import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useGetPatientProfilePictureQuery,
  useUploadAttachmentsMutation
} from '@/services/patients/attachmentService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import type { ApAttachment, ApPatient } from '@/types/model-types';
import { calculateAgeFormat } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import {
  faBroom,
  faCalendarCheck,
  faCheckDouble,
  faEllipsisVertical,
  faPrint
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useRef, useState } from 'react';
import { Avatar, AvatarGroup, Dropdown, Form, Popover, Stack, Whisper } from 'rsuite';
import AdministrativeWarningsModal from './AdministrativeWarning';
import ScanDocumentModal from './ScanDocumentModal';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

interface ProfileHeaderProps {
  localPatient: ApPatient;
  handleSave: () => void;
  handleClear: () => void;
  setVisitHistoryModel: (value: boolean) => void;
  validationResult: any;
  setQuickAppointmentModel: (value: boolean) => void;
  setRefetchAttachmentList: (value: boolean) => void;
  setOpenBedsideRegistrations: (value: boolean) => void;
  setOpenRegistrationWarningsSummary: (value: boolean) => void;
  setOpenBulkRegistrationModal: (value: boolean) => void;
  setLocalPatient: (patient: ApPatient) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  localPatient,
  handleSave,
  handleClear,
  setVisitHistoryModel,
  setQuickAppointmentModel,
  setRefetchAttachmentList,
  validationResult,
  setOpenBedsideRegistrations,
  setOpenRegistrationWarningsSummary,
  setOpenBulkRegistrationModal,
  setLocalPatient
}) => {
  const profileImageFileInputRef = useRef<HTMLInputElement | null>(null);
  const [patientImage, setPatientImage] = useState<ApAttachment | undefined>(undefined);
  const [patientImageUrl, setPatientImageUrl] = useState<string>('');
  const [openMoreMenu, setOpenMoreMenu] = useState<boolean>(false);
  const [openPrintMenu, setOpenPrintMenu] = useState<boolean>(false);
  const [openScanDocumentModal, setOpenScanDocumentModal] = useState<boolean>(false);
  const [uploadAttachments] = useUploadAttachmentsMutation();
  const dispatch = useAppDispatch();
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');

  console.log('localPatient', localPatient);

  const patientId = localPatient?.key ? Number(localPatient.key) : undefined;

  const {
    data: profilePictureTicket,
    refetch: refetchProfilePicture,
    isError
  } = useGetPatientProfilePictureQuery(
    { patientId: patientId! },
    { skip: !patientId, refetchOnMountOrArgChange: true }
  );

  const handlePrintPatientLabel = async () => {
    try {
      const p = localPatient;
      if (!p) return;

      const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
      const mrn = p.patientMrn || '';
      const dob = p.dob ? new Date(p.dob).toLocaleDateString('en-GB') : '';
      const age = p.dob ? calculateAgeFormat(p.dob) : '';
      const gender =
        genderLovQueryResponse?.object?.find(g => g.key === p.genderLkey)?.lovDisplayVale || '';

      const today = new Date().toLocaleDateString('en-GB');

      const qrData = await QRCode.toDataURL(`MRN:${mrn};NAME:${fullName}`);

      const barcodeCanvas = document.createElement('canvas');
      JsBarcode(barcodeCanvas, mrn, {
        format: 'CODE128',
        width: 1.8,
        height: 30,
        displayValue: false
      });
      const barcodeImg = barcodeCanvas.toDataURL('image/png');

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [50, 110]
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Patient Name', 5, 10);

      doc.text(`DATE ${today}`, 55, 10);

      doc.addImage(qrData, 'PNG', 92, 4, 12, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(fullName, 5, 17);

      doc.setFont('helvetica', 'bold');
      doc.text(`MRN # ${mrn}`, 5, 25);

      doc.setFont('helvetica', 'normal');
      doc.text(`DOB ${dob}`, 5, 32);
      doc.text(`AGE ${age}`, 5, 38);
      doc.text(`Gender ${gender}`, 5, 44);

      doc.addImage(barcodeImg, 'PNG', 55, 30, 55, 15);

      doc.save(`PatientLabel_${mrn}.pdf`);
    } catch (error) {
      console.error('Error printing label:', error);
    }
  };

  React.useEffect(() => {
    if (!localPatient) return;
    if (!localPatient.key) return;

    setLocalPatient(prev => {
      if (JSON.stringify(prev) === JSON.stringify(localPatient)) return prev;
      return { ...localPatient };
    });
  }, [localPatient.key]);

  const handleImageClick = () => {
    if (localPatient.key && profileImageFileInputRef.current) {
      profileImageFileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!localPatient || !patientId) return;

    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      try {
        await uploadAttachments({
          patientId,
          file: selectedFile,
          type: undefined,
          details: 'Profile Picture',
          source: 'PATIENT_PROFILE_PICTURE'
        }).unwrap();

        if (patientId) refetchProfilePicture();

        setRefetchAttachmentList(true);
        dispatch(notify({ msg: 'Profile Picture Uploaded Successfully', sev: 'success' }));
      } catch (error) {
        dispatch(notify({ msg: 'Failed to Upload Profile Picture', sev: 'error' }));
      }
    }
  };

  const mapGenderToLkey = (value: any): string | undefined => {
    if (!value) return undefined;
    const g = String(value).trim().toLowerCase();

    if (g === 'm' || g === 'male' || g === 'ذكر') return '1';
    if (g === 'f' || g === 'female' || g === 'انثى' || g === 'أنثى') return '2';

    if (g === '1' || g === '2') return g;

    return undefined;
  };

  const capitalizeFirstLetter = (name: string): string => {
    if (!name) return '';
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  };

  const normalizeParsedData = (raw: any) => {
    console.log('NORMALIZING RAW OCR DATA:', raw);

    return {
      firstName:
        raw.firstName ||
        raw['Given Names'] ||
        raw['GIVEN_NAME'] ||
        raw['First Name'] ||
        raw['FIRST_NAME'] ||
        '',

      lastName:
        raw.lastName ||
        raw['Surname / Family Name'] ||
        raw['Family Name'] ||
        raw['FAMILY_NAME'] ||
        raw['SURNAME'] ||
        '',

      documentNo:
        raw.documentNo || raw['Document Number'] || raw['DOC_NO'] || raw['DOC_NUMBER'] || '',

      nationality: raw.nationality || raw['Nationality'] || raw['NATIONALITY'] || '',

      dateOfBirth: raw.dateOfBirth || raw['Date of Birth'] || raw['DOB'] || '',

      gender: raw.gender || raw['Sex'] || raw['SEX'] || raw['Gender'] || '',

      raw
    };
  };

  const handleIdParsed = (parsedData: any) => {
    console.log('ID Parsed Data RAW:', parsedData);

    const normalized = normalizeParsedData(parsedData);

    console.log('ID NORMALIZED:', normalized);

    const updatedPatient: Partial<ApPatient> = { ...localPatient };

    if (normalized.firstName)
      updatedPatient.firstName = capitalizeFirstLetter(normalized.firstName);

    if (normalized.lastName) updatedPatient.lastName = capitalizeFirstLetter(normalized.lastName);

    if (normalized.dateOfBirth) updatedPatient.dob = normalized.dateOfBirth;
    if (normalized.documentNo) updatedPatient.documentNo = normalized.documentNo;
    if (normalized.nationality) updatedPatient.nationalityLkey = normalized.nationality;

    const mappedGender = mapGenderToLkey(normalized.gender);
    if (mappedGender) updatedPatient.genderLkey = mappedGender;

    setLocalPatient(updatedPatient as ApPatient);

    dispatch(notify({ msg: 'Patient data auto-filled from ID document', sev: 'success' }));
  };

  React.useEffect(() => {
    const patientWithUrl = localPatient as any;

    if (patientWithUrl?.profilePictureUrl) {
      setPatientImageUrl(patientWithUrl.profilePictureUrl);
      setPatientImage({ url: patientWithUrl.profilePictureUrl } as any);
      return;
    }

    if (profilePictureTicket && profilePictureTicket.url && !isError) {
      setPatientImageUrl(profilePictureTicket.url);
      setPatientImage({ url: profilePictureTicket.url } as any);
      return;
    }

    setPatientImageUrl('');
    setPatientImage(undefined);
  }, [localPatient, profilePictureTicket, isError]);

  return (
    <>
      <Stack>
        <Stack.Item grow={1}>
          <Form layout="inline" fluid className="profile-header">
            <AvatarGroup spacing={6} className="avatar-card-parent">
              <input
                type="file"
                ref={profileImageFileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept="image/*"
              />
              <Avatar
                size="lg"
                circle
                bordered
                onClick={handleImageClick}
                src={
                  patientImageUrl
                    ? patientImageUrl
                    : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
                }
                alt={localPatient?.fullName}
                className="avatar-image"
              />
              <div className="avatar-container">
                <span className="patient-name">
                  {localPatient?.firstName} {localPatient?.lastName}
                </span>
                <div className="patient-info">
                  {
                    genderLovQueryResponse?.object?.find(
                      item => item.key === localPatient.genderLkey
                    )?.lovDisplayVale
                  }
                  {localPatient.key !== undefined && calculateAgeFormat(localPatient.dob) && ','}
                  {localPatient.dob && `${calculateAgeFormat(localPatient.dob)} old`}
                </div>
                <span className="patient-mrn">
                  {localPatient.key != undefined && `# `}
                  {localPatient?.patientMrn}
                </span>
              </div>
            </AvatarGroup>

            <div className="button-group-left-align">
              <Form fluid layout="inline" className="registration-header-buttons-section">
                <MyButton onClick={() => setOpenScanDocumentModal(true)}>
                  <Translate>Scan Document</Translate>
                </MyButton>

                <MyButton
                  prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                  onClick={handleSave}
                >
                  <Translate>Save</Translate>
                </MyButton>

                <MyButton
                  prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
                  onClick={handleClear}
                >
                  <Translate>Clear</Translate>
                </MyButton>

                <MyButton
                  appearance="ghost"
                  disabled={!localPatient.key}
                  onClick={() => setQuickAppointmentModel(true)}
                >
                  <Translate>Quick Appointment</Translate>
                </MyButton>

                <AdministrativeWarningsModal
                  localPatient={localPatient}
                  validationResult={validationResult}
                />

                {/* More Menu */}
                <Whisper
                  open={openMoreMenu}
                  onClose={() => setOpenMoreMenu(false)}
                  placement="bottom"
                  speaker={
                    <Popover full>
                      <Dropdown.Menu>
                        <Dropdown.Item
                          disabled={localPatient.key === undefined}
                          onClick={() => {
                            setOpenMoreMenu(false);
                            setVisitHistoryModel(true);
                          }}
                        >
                          <div className="container-of-icon-and-key1">
                            <FontAwesomeIcon icon={faCalendarCheck} />
                            <Translate>Visit History</Translate>
                          </div>
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
                          <Translate>Approvals</Translate>
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
                          <Translate>Appointments</Translate>
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
                          <Translate>View Price List</Translate>
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            setOpenMoreMenu(false);
                            setOpenRegistrationWarningsSummary(true);
                          }}
                        >
                          <Translate>Warnings Summary</Translate>
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            setOpenMoreMenu(false);
                            setOpenBedsideRegistrations(true);
                          }}
                        >
                          <Translate>Bedside Registration</Translate>
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            setOpenMoreMenu(false);
                            setOpenBulkRegistrationModal(true);
                          }}
                        >
                          <Translate>Bulk Registration</Translate>
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
                          <Translate>Encounter Transactions</Translate>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Popover>
                  }
                >
                  <span>
                    <MyButton size="small" onClick={() => setOpenMoreMenu(true)}>
                      <FontAwesomeIcon icon={faEllipsisVertical} />
                    </MyButton>
                  </span>
                </Whisper>

                {/* Print menu */}
                <Whisper
                  open={openPrintMenu}
                  onClose={() => setOpenPrintMenu(false)}
                  placement="bottom"
                  speaker={
                    <Popover full>
                      <Dropdown.Menu>
                        <Dropdown.Item>
                          <Translate>Print Information</Translate>
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            setOpenPrintMenu(false);
                            handlePrintPatientLabel();
                          }}
                        >
                          <Translate>Print Patient Label</Translate>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Popover>
                  }
                >
                  <span>
                    <MyButton size="small" onClick={() => setOpenPrintMenu(true)}>
                      <FontAwesomeIcon icon={faPrint} />
                    </MyButton>
                  </span>
                </Whisper>
              </Form>
            </div>
          </Form>
        </Stack.Item>
      </Stack>

      {/* Scan Document Modal */}
      <ScanDocumentModal
        open={openScanDocumentModal}
        setOpen={setOpenScanDocumentModal}
        patientId={patientId}
        onUploadSuccess={() => setRefetchAttachmentList(true)}
        onIdParsed={handleIdParsed}
      />
    </>
  );
};

export default ProfileHeader;
