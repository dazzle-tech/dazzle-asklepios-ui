import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useGetPatientProfilePictureQuery,
  useUploadAttachmentsMutation
} from '@/services/patients/attachmentService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import type { ApAttachment } from '@/types/model-types';
import { Patient } from '@/types/model-types-new';
import { calculateAgeFormat } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import {
  faBars,
  faBolt,
  faBroom,
  faCalendarCheck,
  faCalendarDay,
  faCheckDouble,
  faEllipsisVertical,
  faHandHoldingDollar,
  faPersonCircleQuestion,
  faPrint,
  faShareNodes,
  faThumbsUp,
  faTriangleExclamation,
  faUsersLine
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Icon } from '@rsuite/icons';
import React, { useCallback, useRef, useState } from 'react';
import { FaUser } from 'react-icons/fa';
import { VscUnverified, VscVerified } from 'react-icons/vsc';
import { Avatar, AvatarGroup, Dropdown, Form, Popover, Stack, Tooltip, Whisper } from 'rsuite';
import AdministrativeWarningsModal from './AdministrativeWarning';
import ScanDocumentModal from './ScanDocumentModal';
import QuickPatient from '../facility-patient-list/QuickPatient';

interface ProfileHeaderProps {
  localPatient: Patient;
  handleSave: () => void;
  handleClear: () => void;
  setVisitHistoryModel: (value: boolean) => void;
  validationResult: any;
  setQuickAppointmentModel: (value: boolean) => void;
  setRefetchAttachmentList: (value: boolean) => void;
  setOpenBedsideRegistrations: (value: boolean) => void;
  setOpenRegistrationWarningsSummary: (value: boolean) => void;
  setOpenBulkRegistrationModal: (value: boolean) => void;
  setLocalPatient: (patient: Patient) => void;
  setOpenReferralRequestModal: (value: boolean) => void;
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
  setLocalPatient,
  setOpenReferralRequestModal
}) => {
  const profileImageFileInputRef = useRef<HTMLInputElement | null>(null);
  const [patientImage, setPatientImage] = useState<ApAttachment | undefined>(undefined);
  const [patientImageUrl, setPatientImageUrl] = useState<string>('');
  const [openMoreMenu, setOpenMoreMenu] = useState<boolean>(false);
  const [openPrintMenu, setOpenPrintMenu] = useState<boolean>(false);
  const [openScanDocumentModal, setOpenScanDocumentModal] = useState<boolean>(false);
  const [quickPatientModalOpen, setQuickPatientModalOpen] = useState(false);

  const [uploadAttachments] = useUploadAttachmentsMutation();
  const dispatch = useAppDispatch();
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');

  const patientId = localPatient?.id ? Number(localPatient.id) : undefined;

  const {
    data: profilePictureTicket,
    refetch: refetchProfilePicture,
    isError
  } = useGetPatientProfilePictureQuery(
    { patientId: patientId! },
    { skip: !patientId, refetchOnMountOrArgChange: true }
  );

  const contentOfMoreIconMenu = (
    <Popover full>
      <Dropdown.Menu>
        <Dropdown.Item
          disabled={localPatient.id === undefined}
          onClick={() => {
            if (localPatient.id !== undefined) {
              setOpenMoreMenu(false);
              setVisitHistoryModel(true);
            }
          }}
        >
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon icon={faCalendarCheck} />
            <Translate>Visit History</Translate>
          </div>
        </Dropdown.Item>

        <Dropdown.Item
          onClick={() => {
            setOpenMoreMenu(false);
            setOpenReferralRequestModal(true);
          }}
        >
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon icon={faShareNodes} />
            <Translate>Referral Requests</Translate>
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

        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon icon={faHandHoldingDollar} />
            <Translate>View Price List</Translate>
          </div>
        </Dropdown.Item>

        <Dropdown.Item
          onClick={() => {
            setOpenMoreMenu(false);
            setOpenRegistrationWarningsSummary(true);
          }}
        >
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            <Translate>Warnings Summary</Translate>
          </div>
        </Dropdown.Item>

        <Dropdown.Item
          onClick={() => {
            setOpenMoreMenu(false);
            setOpenBedsideRegistrations(true);
          }}
        >
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon icon={faPersonCircleQuestion} />
            <Translate>Bedside Registration</Translate>
          </div>
        </Dropdown.Item>

        <Dropdown.Item
          onClick={() => {
            setOpenMoreMenu(false);
            setOpenBulkRegistrationModal(true);
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
  );

  const contentOfPrintIconMenu = (
    <Popover full>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => setOpenPrintMenu(false)}>
          <div className="container-of-icon-and-key1">
            <Translate>Print Information</Translate>
          </div>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setOpenPrintMenu(false)}>
          <div className="container-of-icon-and-key1">
            <Translate>Print Patient Label</Translate>
          </div>
        </Dropdown.Item>
      </Dropdown.Menu>
    </Popover>
  );

  const handleImageClick = () => {
    if (localPatient.id) profileImageFileInputRef.current?.click();
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

        refetchProfilePicture();
        setRefetchAttachmentList(true);
        dispatch(notify({ msg: 'Profile Picture Uploaded Successfully', sev: 'success' }));
      } catch (error) {
        console.error('Failed to upload profile picture:', error);
        dispatch(notify({ msg: 'Failed to Upload Profile Picture', sev: 'error' }));
      }
    }
  };

  const handleNewVisit = () => {
    setQuickAppointmentModel(true);
  };

  const handleScanDocumentClick = () => {
    setOpenScanDocumentModal(true);
  };

  const handleIdParsed = (parsedData: any) => {
    const updatedPatient: Partial<Patient> = {
      ...localPatient
    };

    if (parsedData.firstName) updatedPatient.firstName = parsedData.firstName;
    if (parsedData.lastName) updatedPatient.lastName = parsedData.lastName;
    if (parsedData.secondName) updatedPatient.secondName = parsedData.secondName;
    if (parsedData.thirdName) updatedPatient.thirdName = parsedData.thirdName;
    if (parsedData.dateOfBirth) updatedPatient.dateOfBirth = parsedData.dateOfBirth;
    if (parsedData.nationality) updatedPatient.nationality = parsedData.nationality;
    if (parsedData.gender || parsedData.sexAtBirth) {
      updatedPatient.sexAtBirth = parsedData.gender || parsedData.sexAtBirth;
    }

    setLocalPatient(updatedPatient as Patient);

    dispatch(
      notify({
        msg: 'Patient data auto-filled from ID document',
        sev: 'success'
      })
    );
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
                alt={localPatient?.firstName}
                className="avatar-image"
              />

              <div className="avatar-container">
                <span className="patient-name">
                  {localPatient?.firstName} {localPatient?.lastName}
                </span>

                <div className="patient-info">
                  {localPatient.id !== undefined && <FaUser />}
                  {
                    genderLovQueryResponse?.object?.find(
                      item => item.key === localPatient.sexAtBirth
                    )?.lovDisplayVale
                  }
                  {localPatient.id !== undefined &&
                    calculateAgeFormat(localPatient.dateOfBirth) &&
                    ','}
                  {localPatient.dateOfBirth &&
                    `${calculateAgeFormat(localPatient.dateOfBirth)} old`}{' '}
                </div>

                <span className="patient-mrn">
                  {localPatient.id !== undefined && `# `}
                  {localPatient?.medicalRecordNumber}
                </span>
              </div>

              <div className="status-icons-container">
                {localPatient.id && (
                  <Whisper
                    placement="top"
                    controlId="control-id-click"
                    trigger="hover"
                    speaker={
                      <Tooltip>
                        {localPatient.isVerified ? 'Verified Patient' : 'Unverified Patient'}
                      </Tooltip>
                    }
                  >
                    <div className="status-icon">
                      {!localPatient.isVerified && <Icon color="red" as={VscUnverified} />}
                      {localPatient.isVerified && <Icon color="green" as={VscVerified} />}
                    </div>
                  </Whisper>
                )}

                {localPatient.id && (
                  <Whisper
                    placement="bottom"
                    controlId="control-id-click"
                    trigger="hover"
                    speaker={
                      <Tooltip>
                        {localPatient.isCompletedPatient
                          ? 'Completed Patient'
                          : 'Incomplete Patient'}
                      </Tooltip>
                    }
                  >
                    <div className="status-icon">
                      {localPatient.isCompletedPatient && (
                        <Icon color="green" as={VscUnverified} />
                      )}
                      {!localPatient.isCompletedPatient && (
                        <Icon color="red" as={VscVerified} />
                      )}
                    </div>
                  </Whisper>
                )}
              </div>
            </AvatarGroup>

            <div className="button-group-left-align">
              <Form fluid layout="inline" className="registration-header-buttons-section">
                <MyButton onClick={handleScanDocumentClick}>Scan Document</MyButton>

                <MyButton
                  prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                  onClick={handleSave}
                >
                  {localPatient?.id ? 'Edit' : 'Save'}
                </MyButton>

                <MyButton
                  prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
                  onClick={handleClear}
                >
                  Clear
                </MyButton>

                <MyButton
                  appearance="ghost"
                  onClick={() => setQuickPatientModalOpen(true)}
                  prefixIcon={() => <FontAwesomeIcon icon={faBolt} />}
                >
                  Quick Patient
                </MyButton>

                <MyButton appearance="ghost" disabled={!localPatient.id} onClick={handleNewVisit}>
                  Quick Appointment
                </MyButton>

                <AdministrativeWarningsModal
                  localPatient={localPatient}
                  validationResult={validationResult}
                />

                <Whisper
                  open={openMoreMenu}
                  onClose={() => setOpenMoreMenu(false)}
                  placement="bottom"
                  speaker={contentOfMoreIconMenu}
                >
                  <span>
                    <MyButton size="small" onClick={() => setOpenMoreMenu(true)}>
                      <FontAwesomeIcon icon={faEllipsisVertical} />
                    </MyButton>
                  </span>
                </Whisper>

                <Whisper
                  open={openPrintMenu}
                  onClose={() => setOpenPrintMenu(false)}
                  placement="bottom"
                  speaker={contentOfPrintIconMenu}
                >
                  <span>
                    <MyButton size="small" onClick={() => setOpenPrintMenu(true)}>
                      <FontAwesomeIcon icon={faPrint} />
                    </MyButton>
                  </span>
                </Whisper>

                {(openMoreMenu || openPrintMenu) && (
                  <div
                    onClick={closeMenus}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 1
                    }}
                  />
                )}
              </Form>
            </div>
          </Form>
        </Stack.Item>
      </Stack>

      <QuickPatient
        open={quickPatientModalOpen}
        setOpen={setQuickPatientModalOpen}
        setPatient={setLocalPatient}
      />

      <ScanDocumentModal
        open={openScanDocumentModal}
        setOpen={setOpenScanDocumentModal}
        patientId={patientId}
        onUploadSuccess={() => {
          setRefetchAttachmentList(true);
        }}
        onIdParsed={handleIdParsed}
      />
    </>
  );
};

export default ProfileHeader;