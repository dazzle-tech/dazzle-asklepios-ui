import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useGetPatientProfilePictureQuery,
  useUploadAttachmentsMutation
} from '@/services/patients/attachmentService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Patient } from '@/types/model-types-new';
import { calculateAgeFormat } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import {
  faBolt,
  faBroom,
  faCalendarCheck,
  faCheckDouble,
  faEllipsisVertical,
  faHandHoldingDollar,
  faPersonCircleQuestion,
  faPrint,
  faShareNodes,
  faTriangleExclamation,
  faUsersLine
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Icon } from '@rsuite/icons';
import React, { useRef, useState,useEffect } from 'react';
import { FaUser } from 'react-icons/fa';
import { VscUnverified, VscVerified } from 'react-icons/vsc';
import { Avatar, AvatarGroup, Dropdown, Form, Popover, Stack, Tooltip, Whisper } from 'rsuite';
import AdministrativeWarningsModal from './AdministrativeWarning';
import ScanDocumentModal from './ScanDocumentModal';
import QuickPatient from '../facility-patient-list/QuickPatient';
import {
  useLazyGetPatientInformationPdfQuery,
  useLazyGetPatientLabelPdfQuery,
  useSendPatientPasswordEmailMutation
} from '@/services/patient/patientService';

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
  // eligibilityChecked: boolean;
  // setEligibilityChecked: (val: boolean) => void;
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
  const navigate = useNavigate();
  const location = useLocation();
  const profileImageFileInputRef = useRef<HTMLInputElement | null>(null);
  const [patientImageUrl, setPatientImageUrl] = useState<string>('');
  const [openMoreMenu, setOpenMoreMenu] = useState<boolean>(false);
  const [openScanDocumentModal, setOpenScanDocumentModal] = useState<boolean>(false);
  const [quickPatientModalOpen, setQuickPatientModalOpen] = useState(false);
  const [uploadAttachments] = useUploadAttachmentsMutation();
  const dispatch = useAppDispatch();
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  const [triggerGetPatientInformationPdf] = useLazyGetPatientInformationPdfQuery();
  const patientId = localPatient?.id ? Number(localPatient.id) : undefined;
  const [triggerGetPatientLabelPdf] = useLazyGetPatientLabelPdfQuery();
  const [sendPatientPasswordEmail, { isLoading: isSendingPasswordEmail }] = useSendPatientPasswordEmailMutation();
  const [printingType, setPrintingType] = useState<'information' | 'label' | null>(null);

  const {
    data: profilePictureTicket,
    isError
  } = useGetPatientProfilePictureQuery(
    { patientId: patientId! },
    { skip: !patientId, refetchOnMountOrArgChange: true }
  );



const handlePrintInformation = async () => {
  if (!localPatient?.id) return;

  try {
    setPrintingType('information');

    const blob = await triggerGetPatientInformationPdf({
      patientId: localPatient.id,
    }).unwrap();

    const pdfBlob = new Blob([blob], {
      type: 'application/pdf',
    });

    const fileURL = window.URL.createObjectURL(pdfBlob);

    const win = window.open(fileURL, '_blank');

    if (win) {
      win.focus();
    } else {
      dispatch(
        notify({
          msg: 'Popup blocked. Please allow popups for this site.',
          sev: 'warning',
        })
      );
    }

    // لا تعمل revokeObjectURL هون
  } catch (err: any) {
    dispatch(
      notify({
        msg: err?.data?.message || 'Print failed',
        sev: 'error',
      })
    );
  } finally {
    setPrintingType(null);
  }
};

const handlePrintPatientLabel = async (rowData: any) => {
  if (!rowData?.id) return;

  try {
    setPrintingType('label');

    const blob = await triggerGetPatientLabelPdf({
      patientId: rowData.id,
    }).unwrap();

    const pdfBlob = new Blob([blob], {
      type: 'application/pdf',
    });

    const fileURL = window.URL.createObjectURL(pdfBlob);

    const win = window.open(fileURL, '_blank');

    if (win) {
      win.focus();
    } else {
      dispatch(
        notify({
          msg: 'Popup blocked. Please allow popups for this site.',
          sev: 'warning',
        })
      );
    }

    // لا تعمل revokeObjectURL هون
  } catch (error: any) {
    dispatch(
      notify({
        msg: error?.data?.message || 'Failed to open label pdf',
        sev: 'error',
      })
    );
  } finally {
    setPrintingType(null);
  }
};

const extractErrorMessage = (response: any): string => {
  try {
    const msg =
      response?.data?.message ??
      response?.data?.error ??
      response?.message ??
      response?.error;

    if (typeof msg === 'string' && msg.trim()) {
      return msg.replace(/^error\./i, '').trim();
    }

    if (response?.data && typeof response?.data === 'object') {
      const detail = response.data.detail ?? response.data.description;
      if (typeof detail === 'string' && detail.trim()) {
        return detail.trim();
      }
    }
  } catch {
    // ignore
  }
  return '';
};

const handleSendPasswordEmail = async () => {
  if (!localPatient?.id) return;

  try {
    await sendPatientPasswordEmail(localPatient.id).unwrap();
    dispatch(
      notify({
        msg: 'Password email sent successfully',
        sev: 'success'
      })
    );
  } catch (error: any) {
    const errorMsg = extractErrorMessage(error);
    dispatch(
      notify({
        msg: errorMsg || 'Failed to send password email',
        sev: 'error'
      })
    );
  }
};

  const contentOfMoreIconMenu = (
    <Popover>
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

        {/* <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon icon={faThumbsUp} />
            <Translate>Approvals</Translate>
          </div>
        </Dropdown.Item> */}

        {/* <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon icon={faCalendarDay} />
            <Translate>Appointments</Translate>
          </div>
        </Dropdown.Item> */}

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

        {/* <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon icon={faBars} />
            <Translate>Encounter Transactions</Translate>
          </div>
        </Dropdown.Item> */}
      </Dropdown.Menu>
    </Popover>
  );

 const contentOfPrintIconMenu = (
  <Popover>
    <Dropdown.Menu>
      <Dropdown.Item
        disabled={!localPatient?.id || printingType !== null}
        onClick={async () => {
          await handlePrintInformation();
        }}
      >
        <div className="container-of-icon-and-key1">
          <Translate>
            {printingType === 'information' ? 'Printing Information...' : 'Print Information'}
          </Translate>
        </div>
      </Dropdown.Item>

      <Dropdown.Item
        disabled={!localPatient?.id || printingType !== null}
        onClick={async () => {
          await handlePrintPatientLabel(localPatient);
        }}
      >
        <div className="container-of-icon-and-key1">
          <Translate>
            {printingType === 'label' ? 'Printing Patient Label...' : 'Print Patient Label'}
          </Translate>
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

        // No manual refetch: calling refetch() while the query is skipped/uninitialized throws.
        // We rely on RTK Query tag invalidation in `attachmentService` to refresh the picture.
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

  React.useEffect(() => {
    const patientWithUrl = localPatient as any;

    if (patientWithUrl?.profilePictureUrl) {
      setPatientImageUrl(patientWithUrl.profilePictureUrl);
      return;
    }

    if (profilePictureTicket && profilePictureTicket.url && !isError) {
      setPatientImageUrl(profilePictureTicket.url);
      return;
    }

    setPatientImageUrl('');
  }, [localPatient, profilePictureTicket, isError]);

// useEffect(() => {
//   if (location.state?.eligibilityDone) {
//     setEligibilityChecked(true);
//   }
// }, [location.state]);


const whisperRef = useRef<any>(null);

useEffect(() => {
  if (quickPatientModalOpen || openScanDocumentModal) {
    whisperRef.current?.close?.();
  }
}, [quickPatientModalOpen, openScanDocumentModal]);

useEffect(() => {
  const handleClick = (e: any) => {
    if (e.target.closest('.rs-popover')) return;

    setOpenMoreMenu(false);
  };

  document.addEventListener('mousedown', handleClick);

  return () => {
    document.removeEventListener('mousedown', handleClick);
  };
}, []);

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <Stack>
        <Stack.Item grow={1}>
          <Form fluid className="profile-header">
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
                      {localPatient.isCompletedPatient && <Icon color="green" as={VscUnverified} />}
                      {!localPatient.isCompletedPatient && <Icon color="red" as={VscVerified} />}
                    </div>
                  </Whisper>
                )}
              </div>
            </AvatarGroup>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '15px'
              }}
            >
              <AvatarGroup spacing={6}></AvatarGroup>
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                justifyContent: 'flex-end'
              }}
            >
              {/* <MyButton onClick={handleScanDocumentClick}>
                <Translate>Scan Document</Translate>
              </MyButton> */}

              <MyButton
                onClick={() => {
                  // setEligibilityChecked(true);
                  // navigate(`/patient-profile/${localPatient?.id}`);
                }}
              >
                <Translate>Eligibility Check</Translate>
              </MyButton>

              <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                onClick={handleSave}
              >
                <Translate>{localPatient?.id ? 'Edit' : 'Save'}</Translate>
              </MyButton>

              <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
                onClick={handleClear}
              >
                <Translate>Clear</Translate>
              </MyButton>

              <MyButton
                appearance="ghost"
                disabled={!localPatient?.id || isSendingPasswordEmail}
                onClick={handleSendPasswordEmail}
              >
                <Translate>
                  {isSendingPasswordEmail ? 'Sending Password Email...' : 'Send Password Email'}
                </Translate>
              </MyButton>

              <MyButton
                appearance="ghost"
                onClick={() => setQuickPatientModalOpen(true)}
                prefixIcon={() => <FontAwesomeIcon icon={faBolt} />}
              >
                <Translate>Quick Patient</Translate>
              </MyButton>

              <MyButton appearance="ghost" disabled={!localPatient.id} onClick={handleNewVisit}>
                <Translate>Quick Appointment</Translate>
              </MyButton>

              <AdministrativeWarningsModal
                localPatient={localPatient}
                validationResult={validationResult}
              />

              <Whisper
                ref={whisperRef}
                trigger="click"
                placement={isRTL ? 'bottomStart' : 'bottomEnd'}
                preventOverflow
                rootClose
                open={openMoreMenu}
                onOpen={() => setOpenMoreMenu(true)}
                onClose={() => setOpenMoreMenu(false)}
                speaker={contentOfMoreIconMenu}
              >
                <span style={{ display: 'inline-block' }}>
                  <MyButton
                    size="small"
                    onClick={() => setOpenMoreMenu(prev => !prev)}
                  >
                    <FontAwesomeIcon icon={faEllipsisVertical} />
                  </MyButton>
                </span>
              </Whisper>

              <Whisper
                trigger="click"
                placement={isRTL ? 'bottomStart' : 'bottomEnd'}
                container={() => document.body}
                preventOverflow
                rootClose
                speaker={contentOfPrintIconMenu}
              >
                <span style={{ display: 'inline-block' }}>
                  <MyButton size="small">
                    <FontAwesomeIcon icon={faPrint} />
                  </MyButton>
                </span>
              </Whisper>
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
    </div>
  );
};

export default ProfileHeader;
