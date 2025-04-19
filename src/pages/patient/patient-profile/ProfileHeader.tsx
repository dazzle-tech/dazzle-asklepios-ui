import React, { useRef, useState } from 'react';
import { useAppSelector } from '@/hooks';
import type { ApAttachment, ApPatient } from '@/types/model-types';
import { faBroom, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ListIcon from '@rsuite/icons/List';
import { useFetchAttachmentQuery, useUploadMutation } from '@/services/attachmentService';
import {
  AvatarGroup,
  Avatar,
  Whisper,
  Tooltip,
  Form,
  Stack,
  ButtonToolbar,
  Button,
  SelectPicker,
  Panel
} from 'rsuite';
import { Icon } from '@rsuite/icons';
import { VscUnverified, VscVerified } from 'react-icons/vsc';
import Translate from '@/components/Translate';

interface ProfileHeaderProps {
  localPatient: ApPatient;
  handleSave: () => void;
  handleClear: () => void;
  setVisitHistoryModel: (value: boolean) => void;
  setAdministrativeWarningsModalOpen: (value: boolean) => void;
  setQuickAppointmentModel: (value: boolean) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  localPatient,
  handleSave,
  handleClear,
  setVisitHistoryModel,
  setAdministrativeWarningsModalOpen,
  setQuickAppointmentModel
}) => {
  const authSlice = useAppSelector(state => state.auth);
  const profileImageFileInputRef = useRef(null);
  const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);
  const [upload, uploadMutation] = useUploadMutation();

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
        refKey: localPatient.key,
        details: `Profile Picture for ${localPatient.fullName}`,
        accessType: '',
        createdBy: authSlice.user.key
      })
        .unwrap()
        .then(response => {
          setPatientImage(response);
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
    <Panel>
      <Stack>
        <Stack.Item grow={1}>
          <Form
            layout="inline"
            fluid
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <Form style={{ display: 'flex', alignItems: 'center', padding: '5px' }}>
                <AvatarGroup spacing={6}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
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
                        <div
                          style={{
                            fontSize: 18,
                            position: 'relative',
                            marginRight: '10px'
                          }}
                        >
                          {!localPatient.verified && (
                            <Icon style={{ color: 'red' }} as={VscUnverified} />
                          )}
                          {localPatient.verified && (
                            <Icon style={{ color: 'green' }} as={VscVerified} />
                          )}
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
                            {localPatient.incompletePatient
                              ? 'Incomplete Patient'
                              : 'Complete Patient'}
                          </Tooltip>
                        }
                      >
                        <div
                          style={{
                            fontSize: 18,
                            position: 'relative',
                            marginRight: '10px'
                          }}
                        >
                          {localPatient.incompletePatient && (
                            <Icon style={{ color: 'red' }} as={VscUnverified} />
                          )}
                          {!localPatient.incompletePatient && (
                            <Icon style={{ color: 'green' }} as={VscVerified} />
                          )}
                        </div>
                      </Whisper>
                    )}
                  </div>
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
                  />
                  <Form
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: '8px',
                      fontSize: 11
                    }}
                  >
                    <span style={{ fontWeight: 'bold' }}>{localPatient?.fullName}</span>
                    <span>
                      {localPatient?.createdAt
                        ? new Date(localPatient?.createdAt).toLocaleString('en-GB')
                        : ''}
                    </span>
                    <span>{localPatient?.patientMrn}</span>
                  </Form>
                </AvatarGroup>
              </Form>
            </div>
            <ButtonToolbar>
              <Button
                onClick={handleSave}
                appearance="primary"
                style={{
                  border: 'var(--primary-blue)',
                  backgroundColor: 'var(--primary-blue)',
                  color: 'white',
                  marginLeft: '3px'
                }}
              >
                <FontAwesomeIcon
                  icon={faCheckDouble}
                  style={{ marginRight: '5px', color: 'white' }}
                />
                <span>Save</span>
              </Button>
              <Button
                appearance="primary"
                style={{
                  border: 'var(--primary-blue)',
                  backgroundColor: 'var(--primary-blue)',
                  color: 'white',
                  marginLeft: '3px'
                }}
                onClick={handleClear}
              >
                <FontAwesomeIcon icon={faBroom} style={{ marginRight: '5px', color: 'white' }} />
                <Translate>Clear</Translate>
              </Button>
              <Button
                color="blue"
                appearance="ghost"
                style={{
                  color: 'var(--primary-blue)'
                }}
                disabled={localPatient.key === undefined}
                onClick={() => setVisitHistoryModel(true)}
              >
                <span>Visit History</span>
              </Button>
              <Button
                color="blue"
                appearance="ghost"
                style={{
                  color: 'var(--primary-blue)'
                }}
                disabled={!localPatient.key}
                onClick={handleNewVisit}
              >
                <span>Quick Appointment</span>
              </Button>

              <Button
                color="blue"
                onClick={() => setAdministrativeWarningsModalOpen(true)}
                disabled={!localPatient.key}
                appearance="ghost"
                style={{
                  color: 'var(--primary-blue)',
                }}
              >
                <span>Administrative Warnings</span>
              </Button>
            </ButtonToolbar>
          </Form>
        </Stack.Item>
      </Stack>
    </Panel>
  );
};

export default ProfileHeader;
