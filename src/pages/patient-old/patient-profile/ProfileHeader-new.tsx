import React, { useCallback, useRef, useState } from 'react';
import { useAppSelector } from '@/hooks';
import type { ApAttachment, ApPatient } from '@/types/model-types';
import { faBroom, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { calculateAgeFormat } from '@/utils';
import { useGetPatientProfilePictureQuery, useUploadAttachmentsMutation } from '@/services/patients/attachmentService';
import { AvatarGroup, Avatar, Whisper, Tooltip, Form, Stack, Popover, Dropdown } from 'rsuite';
import { Icon } from '@rsuite/icons';
import { FaUser } from 'react-icons/fa';
import { VscUnverified, VscVerified } from 'react-icons/vsc';
import MyButton from '@/components/MyButton/MyButton';
import AdministrativeWarningsModal from './AdministrativeWarning';
import { useAppDispatch } from '@/hooks';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { faThumbsUp } from '@fortawesome/free-solid-svg-icons';
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import { faHandHoldingDollar } from '@fortawesome/free-solid-svg-icons';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faPersonCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { faUsersLine } from '@fortawesome/free-solid-svg-icons';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';

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
  setOpenBulkRegistrationModal
}) => {
  const authSlice = useAppSelector(state => state.auth);
  const profileImageFileInputRef = useRef(null);
  const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);
  const [patientImageUrl, setPatientImageUrl] = useState<string>('');
  const [openMoreMenu, setOpenMoreMenu] = useState<boolean>(false);
  const [openPrintMenu, setOpenPrintMenu] = useState<boolean>(false);
  const [uploadAttachments] = useUploadAttachmentsMutation();
  const dispatch = useAppDispatch();
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  
  // Fetch patient profile image using new API (returns DownloadTicket directly)
  // Convert key (string) to number for patientId
  const patientId = localPatient?.key ? Number(localPatient.key) : undefined;
  const { data: profilePictureTicket, refetch: refetchProfilePicture, isError } = useGetPatientProfilePictureQuery(
    { patientId: patientId! },
    { skip: !patientId, refetchOnMountOrArgChange: true }
  );

  // container to choose action from more menu
  const contentOfMoreIconMenu = (
    <Popover full>
      <Dropdown.Menu>
        <Dropdown.Item
          disabled={localPatient.key === undefined}
          onClick={() => {
            if (!(localPatient.key === undefined)) {
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

  // container to choose action from print menu
  const contentOfPrintIconMenu = (
    <Popover full>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1"><Translate>Print Information</Translate></div>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1"><Translate>Print Patient Label</Translate></div>
        </Dropdown.Item>
      </Dropdown.Menu>
    </Popover>
  );

  // Handle image click for upload
  const handleImageClick = () => {
    if (localPatient.key) profileImageFileInputRef.current.click();
  };

  // Handle file change for profile image using new API
  const handleFileChange = async event => {
    if (!localPatient || !patientId) return;

    const selectedFile = event.target.files[0];
    if (selectedFile) {
      try {
        await uploadAttachments({
          patientId: patientId,
          file: selectedFile, 
          type: undefined,
          details: 'Profile Picture',
          source: 'PATIENT_PROFILE_PICTURE'
        }).unwrap();

        // Refetch profile picture to get the updated image
        refetchProfilePicture();
        setRefetchAttachmentList(true);
        dispatch(notify({ msg: 'Profile Picture Uploaded Successfully', sev: 'success' }));
      } catch (error) {
        console.error('Failed to upload profile picture:', error);
        dispatch(notify({ msg: 'Failed to Upload Profile Picture', sev: 'error' }));
      }
    }
  };
  // Handle quick appointment
  const handleNewVisit = () => {
    setQuickAppointmentModel(true);
  };
  //
  const closeMenus = useCallback(() => {
    setOpenMoreMenu(false);
    setOpenPrintMenu(false);
  }, []);
  // Effects for patient image - use the download URL from the profile picture ticket or from patient object
  React.useEffect(() => {
    const patientWithUrl = localPatient as any;
    
    // Priority 1: Use profilePictureUrl from PatientCard if available
    if (patientWithUrl?.profilePictureUrl) {
      setPatientImageUrl(patientWithUrl.profilePictureUrl);
      setPatientImage({ url: patientWithUrl.profilePictureUrl } as any);
      return; // Exit early
    }
    
    // Priority 2: Use fetched profile picture from API
    if (profilePictureTicket && profilePictureTicket.url && !isError) {
      setPatientImageUrl(profilePictureTicket.url);
      setPatientImage({ url: profilePictureTicket.url } as any);
      return; // Exit early
    }
    
    // Priority 3: No picture available or error - clear it
    setPatientImageUrl('');
    setPatientImage(undefined);
  }, [localPatient, profilePictureTicket, isError]);
  return (
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
                  genderLovQueryResponse?.object?.find(item => item.key === localPatient.genderLkey)
                    ?.lovDisplayVale
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
                  controlId="control-id-click"
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
                  controlId="control-id-click"
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
              <MyButton>Scan Document</MyButton>
              <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                onClick={handleSave}
              >
                Save
              </MyButton>
              <MyButton prefixIcon={() => <FontAwesomeIcon icon={faBroom} />} onClick={handleClear}>
                Clear
              </MyButton>
              <MyButton appearance="ghost" disabled={!localPatient.key} onClick={handleNewVisit}>
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
  );
};
export default ProfileHeader;
