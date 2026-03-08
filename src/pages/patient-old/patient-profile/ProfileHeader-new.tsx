import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks';
import type { ApAttachment, ApPatient } from '@/types/model-types';
import { initialListRequest, ListRequest } from '@/types/types';
import { calculateAgeFormat } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import AdministrativeWarningsModal from './AdministrativeWarning';
import ScanDocumentModal from '@/pages/patient/patient-profile/ScanDocumentModal';
import '@/patches/prototypeShield';
import {
  useGetPatientProfilePictureQuery,
  useUploadAttachmentsMutation
} from '@/services/patients/attachmentService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetPatientSecondaryDocumentsQuery } from '@/services/patientService';
import { Avatar, AvatarGroup, Dropdown, Form, Popover, Stack, Whisper, Tooltip } from 'rsuite';
import { Icon } from '@rsuite/icons';
import {
  faBroom,
  faCheckDouble,
  faEllipsisVertical,
  faThumbsUp,
  faCalendarCheck,
  faCalendarDay,
  faHandHoldingDollar,
  faTriangleExclamation,
  faPersonCircleQuestion,
  faUsersLine,
  faBars,
  faPrint
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { VscUnverified, VscVerified } from 'react-icons/vsc';
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
  setOpenBViewPriceListModal: (value: boolean) => void;
  setLocalPatient: React.Dispatch<React.SetStateAction<ApPatient>>;
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
  setOpenBViewPriceListModal,
  setLocalPatient
}) => {
  const authSlice = useAppSelector(state => state.auth);
  const profileImageFileInputRef = useRef<HTMLInputElement | null>(null);
  const [patientImage, setPatientImage] = useState<ApAttachment | undefined>(undefined);
  const [patientImageUrl, setPatientImageUrl] = useState<string>('');
  const [openMoreMenu, setOpenMoreMenu] = useState<boolean>(false);
  const [openPrintMenu, setOpenPrintMenu] = useState<boolean>(false);
  const [openScanDocumentModal, setOpenScanDocumentModal] = useState<boolean>(false);

  const [uploadAttachments] = useUploadAttachmentsMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');

  const patientId = localPatient?.key ? Number(localPatient.key) : undefined;

  const {
    data: profilePictureTicket,
    refetch: refetchProfilePicture,
    isError
  } = useGetPatientProfilePictureQuery(
    { patientId: patientId! },
    { skip: !patientId, refetchOnMountOrArgChange: true }
  );

  const [documenstListRequest, setDocumentsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });

  const { data: patientSecondaryDocumentsResponse, refetch: patientSecondaryDocuments } =
    useGetPatientSecondaryDocumentsQuery(documenstListRequest, { skip: !localPatient.key });

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

  const handlePrintInformation = () => {
    if (!localPatient) return;

    const patientWithImage = {
      ...(localPatient as any),
      profilePictureUrl: patientImageUrl || ''
    };

    const secondaryDocumentsArray =
      patientSecondaryDocumentsResponse &&
      (patientSecondaryDocumentsResponse as any).object &&
      Array.isArray((patientSecondaryDocumentsResponse as any).object)
        ? (patientSecondaryDocumentsResponse as any).object
        : [];

    (patientWithImage as any).secondaryDocuments = secondaryDocumentsArray;

    navigate('/patient-report', { state: { patient: patientWithImage } });
  };

  React.useEffect(() => {
    if (!localPatient) return;
    if (!localPatient.key) return;

    setLocalPatient(prev => {
      if (JSON.stringify(prev) === JSON.stringify(localPatient)) return prev;
      return { ...localPatient };
    });
  }, [localPatient, setLocalPatient]);

  const handleImageClick = () => {
    if (localPatient.key && profileImageFileInputRef.current) {
      profileImageFileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!localPatient || !patientId) return;

    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    try {
      await uploadAttachments({
        patientId: patientId,
        file: selectedFile,
        type: undefined,
        details: 'Profile Picture',
        source: 'PATIENT_PROFILE_PICTURE'
      }).unwrap();

      // No manual refetch: calling refetch() while the query is skipped/uninitialized throws.
      // We rely on RTK Query tag invalidation in `attachmentService` to refresh the picture.
      setRefetchAttachmentList(true);
      dispatch(notify({ msg: 'Profile Picture Uploaded Successfully', sev: 'success' }));
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      dispatch(notify({ msg: 'Failed to Upload Profile Picture', sev: 'error' }));
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
    const normalized = normalizeParsedData(parsedData);

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

  const handleNewVisit = () => {
    setQuickAppointmentModel(true);
  };

  const closeMenus = useCallback(() => {
    setOpenMoreMenu(false);
    setOpenPrintMenu(false);
  }, []);

  React.useEffect(() => {
    const patientWithUrl = localPatient as any;

    if (patientWithUrl?.profilePictureUrl) {
      setPatientImageUrl(patientWithUrl.profilePictureUrl);
      setPatientImage({ url: patientWithUrl.profilePictureUrl } as any);
      return;
    }
    if (profilePictureTicket && (profilePictureTicket as any).url && !isError) {
      const url = (profilePictureTicket as any).url;
      setPatientImageUrl(url);
      setPatientImage({ url } as any);
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
                  {localPatient.dob && `${calculateAgeFormat(localPatient.dob)} old`}{' '}
                </div>
                <span className="patient-mrn">
                  {localPatient.key != undefined && `# `}
                  {localPatient?.patientMrn}
                </span>
              </div>
              <div className="status-icons-container">
                {localPatient.key && (
                  <Whisper
                    placement="top"
                    controlId="control-id-click-verified"
                    trigger="hover"
                    speaker={
                      <Tooltip>
                        {localPatient.verified ? 'Verified Patient' : 'Unverified Patient'}
                      </Tooltip>
                    }
                  >
                    <div className="status-icon">
                      {!localPatient.verified && <Icon color="red" as={VscUnverified} />}
                      {localPatient.verified && <Icon color="green" as={VscVerified} />}
                    </div>
                  </Whisper>
                )}
                {localPatient.key && (
                  <Whisper
                    placement="bottom"
                    controlId="control-id-click-incomplete"
                    trigger="hover"
                    speaker={
                      <Tooltip>
                        {localPatient.incompletePatient ? 'Incomplete Patient' : 'Complete Patient'}
                      </Tooltip>
                    }
                  >
                    <div className="status-icon">
                      {localPatient.incompletePatient && <Icon color="red" as={VscUnverified} />}
                      {!localPatient.incompletePatient && <Icon color="green" as={VscVerified} />}
                    </div>
                  </Whisper>
                )}
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

                <MyButton appearance="ghost" disabled={!localPatient.key} onClick={handleNewVisit}>
                  <Translate>Quick Appointment</Translate>
                </MyButton>

                <AdministrativeWarningsModal
                  localPatient={localPatient}
                  validationResult={validationResult}
                />

                {/* More Menu */}
                <Whisper
                  trigger="click"
                  open={openMoreMenu}
                  onClose={() => setOpenMoreMenu(false)}
                  placement="bottom"
                  speaker={
                    <Popover full>
                      <Dropdown.Menu>
                        <Dropdown.Item
                          disabled={localPatient.key === undefined}
                          onClick={() => {
                            if (!(localPatient.key === undefined)) {
                              setVisitHistoryModel(true);
                            }
                            setOpenMoreMenu(false);
                          }}
                        >
                          <div className="container-of-icon-and-key1">
                            <FontAwesomeIcon icon={faCalendarCheck} />
                            <Translate>Visit History</Translate>
                          </div>
                        </Dropdown.Item>

                        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
                          <div className="container-of-icon-and-key1">
                            <FontAwesomeIcon icon={faThumbsUp} />
                            <Translate>Approvals</Translate>
                          </div>
                        </Dropdown.Item>

                        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
                          <div className="container-of-icon-and-key1">
                            <FontAwesomeIcon icon={faCalendarDay} />
                            <Translate>Appointments</Translate>
                          </div>
                        </Dropdown.Item>

                        <Dropdown.Item
                          onClick={() => {
                            setOpenMoreMenu(false);
                            setOpenBViewPriceListModal(true);
                          }}
                        >
                          <div className="container-of-icon-and-key1">
                            <FontAwesomeIcon icon={faHandHoldingDollar} />
                            <Translate>View Price List</Translate>
                          </div>
                        </Dropdown.Item>

                        <Dropdown.Item
                          onClick={() => {
                            setOpenRegistrationWarningsSummary(true);
                            setOpenMoreMenu(false);
                          }}
                        >
                          <div className="container-of-icon-and-key1">
                            <FontAwesomeIcon icon={faTriangleExclamation} />
                            <Translate>Warnings Summary</Translate>
                          </div>
                        </Dropdown.Item>

                        <Dropdown.Item
                          onClick={() => {
                            setOpenBedsideRegistrations(true);
                            setOpenMoreMenu(false);
                          }}
                        >
                          <div className="container-of-icon-and-key1">
                            <FontAwesomeIcon icon={faPersonCircleQuestion} />
                            <Translate>Bedside Registration</Translate>
                          </div>
                        </Dropdown.Item>

                        <Dropdown.Item
                          onClick={() => {
                            setOpenBulkRegistrationModal(true);
                            setOpenMoreMenu(false);
                          }}
                        >
                          <div className="container-of-icon-and-key1">
                            <FontAwesomeIcon icon={faUsersLine} />
                            <Translate>Bulk Registration</Translate>
                          </div>
                        </Dropdown.Item>

                        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
                          <div className="container-of-icon-and-key1">
                            <FontAwesomeIcon icon={faBars} />
                            <Translate>Encounter Transactions</Translate>
                          </div>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Popover>
                  }
                >
                  <span>
                    <MyButton size="small" onClick={() => setOpenMoreMenu(!openMoreMenu)}>
                      <FontAwesomeIcon icon={faEllipsisVertical} />
                    </MyButton>
                  </span>
                </Whisper>

                {/* Print menu */}
                <Whisper
                  trigger="click"
                  placement="bottom"
                  speaker={
                    <Popover full>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={handlePrintInformation}>
                          <div className="container-of-icon-and-key1">
                            <Translate>Print Information</Translate>
                          </div>
                        </Dropdown.Item>

                        <Dropdown.Item onClick={handlePrintPatientLabel}>
                          <div className="container-of-icon-and-key1">
                            <Translate>Print Patient Label</Translate>
                          </div>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Popover>
                  }
                >
                  <span>
                    <MyButton size="small">
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
