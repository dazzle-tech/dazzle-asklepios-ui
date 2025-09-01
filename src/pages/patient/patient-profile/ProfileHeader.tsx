import React, { useRef, useState } from 'react';
import { useAppSelector } from '@/hooks';
import type { ApAttachment, ApPatient } from '@/types/model-types';
import { faBroom, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { calculateAgeFormat } from '@/utils';
import { useFetchAttachmentQuery, useUploadMutation } from '@/services/attachmentService';
import { AvatarGroup, Avatar, Whisper, Tooltip, Form, Stack } from 'rsuite';
import { Icon } from '@rsuite/icons';
import { FaUser } from 'react-icons/fa';
import { VscUnverified, VscVerified } from 'react-icons/vsc';
import MyButton from '@/components/MyButton/MyButton';
import AdministrativeWarningsModal from './AdministrativeWarning';
import { useAppDispatch } from '@/hooks';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
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
  setOpenRegistrationWarningsSummary
}) => {
  const authSlice = useAppSelector(state => state.auth);
  const profileImageFileInputRef = useRef(null);
  const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);
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
          <Form fluid layout="inline">
            <MyButton>Print Patient Label</MyButton>
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

            <MyButton
              appearance="ghost"
              disabled={localPatient.key === undefined}
              onClick={() => setVisitHistoryModel(true)}
            >
              Visit History
            </MyButton>
            <MyButton appearance="ghost" disabled={!localPatient.key} onClick={handleNewVisit}>
              Quick Appointment
            </MyButton>

            <AdministrativeWarningsModal
              localPatient={localPatient}
              validationResult={validationResult}
            />
            <MyButton onClick={() => setOpenBedsideRegistrations(true)}>
              Bedside Registrations
            </MyButton>
            <MyButton onClick={() => setOpenRegistrationWarningsSummary(true)}>
              Registration Warnings Summary
            </MyButton>
            <MyButton>Print Information</MyButton>
            <MyButton>Price List</MyButton>
            <MyButton>Approvals</MyButton>
            <MyButton>Appointments</MyButton>
            <MyButton>Bulk Registration</MyButton>
            <MyButton>Transactions</MyButton>
          </Form>
        </Form>
      </Stack.Item>
    </Stack>
  );
};
export default ProfileHeader;
