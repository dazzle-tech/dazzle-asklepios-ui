import React, { useCallback, useRef, useState } from 'react';
import { useAppSelector } from '@/hooks';
import type { ApAttachment, ApPatient } from '@/types/model-types';
import { faBroom, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { calculateAgeFormat } from '@/utils';
import { useFetchAttachmentQuery, useUploadMutation } from '@/services/attachmentService';
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
  const [openMoreMenu, setOpenMoreMenu] = useState<boolean>(false);
  const [openPrintMenu, setOpenPrintMenu] = useState<boolean>(false);
  const [upload, uploadMutation] = useUploadMutation();
  const dispatch = useAppDispatch();
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  // Fetch patient profile image
  const fetchPatientImageResponse = useFetchAttachmentQuery(
    {
      type: 'PATIENT_PROFILE_PICTURE',
      refKey: localPatient.key
    },
    { skip: !localPatient.key }
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
            Visit History
          </div>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon icon={faThumbsUp} />
            Approvals
          </div>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon icon={faCalendarDay} />
            Appointments
          </div>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon icon={faHandHoldingDollar} />
            View Price List
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
            Warnings Summary
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
            Bedside Registration
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
            Bulk Registration
          </div>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon icon={faBars} />
            Encounter Transactions
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
          <div className="container-of-icon-and-key1">Print Information</div>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1">Print Patient Label</div>
        </Dropdown.Item>
      </Dropdown.Menu>
    </Popover>
  );

  // Handle image click for upload
  const handleImageClick = () => {
    if (localPatient.key) profileImageFileInputRef.current.click();
  };

  // Handle file change for profile image
  const handleFileChange = async event => {
    if (!localPatient) return;

    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      upload({
        formData: formData,
        type: 'PATIENT_PROFILE_PICTURE',
        refKey: localPatient?.key,
        details: 'Profile Picture',
        accessType: '',
        createdBy: authSlice.user.key,
        patientKey: localPatient?.key
      })
        .unwrap()
        .then(response => {
          setPatientImage(response);
          setRefetchAttachmentList(true);
          dispatch(notify({ msg: 'Profile Picture Uploaded Successfully', sev: 'success' }));
        });
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
  // Effects for patient image
  React.useEffect(() => {
    if (
      fetchPatientImageResponse.isSuccess &&
      fetchPatientImageResponse.data &&
      fetchPatientImageResponse.data.key
    ) {
      setPatientImage(fetchPatientImageResponse.data);
    } else {
      setPatientImage(undefined);
    }
  }, [fetchPatientImageResponse]);

  React.useEffect(() => {
    if (uploadMutation.status === 'fulfilled') {
      setPatientImage(uploadMutation.data);
    }
  }, [uploadMutation]);
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
                patientImage && patientImage.fileContent
                  ? `data:${patientImage.contentType};base64,${patientImage.fileContent}`
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
                {localPatient.key != undefined && <FaUser />}
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
