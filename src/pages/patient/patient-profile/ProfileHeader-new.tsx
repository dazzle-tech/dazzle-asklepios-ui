import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { setPatient } from '@/reducers/patientSlice';
import {
  useLazyGetPatientLabelPdfQuery,
  useSendPatientPasswordEmailMutation
} from '@/services/patient/patientService';
import {
  useGetPatientProfilePictureQuery,
  useUploadAttachmentsMutation
} from '@/services/patients/attachmentService';
import {
  useLazyGetPatientInformationPdfQuery,
} from '@/services/patient/patientService';
import {
  useGetInsurancesByPatientQuery,
  patientInsurancesService
} from '@/services/patients/patientInsurancesService';
import { useGetAllPayorsQuery } from '@/services/setup/payer/PayorService';
import { useGetAllNphiesPayersQuery } from '@/services/setup/payer/NphiesPayerSetupService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useLazyGetPatientFromCchiQuery, useRefreshPatientFromCchiMutation } from '@/services/waseel-integration/cchiService';
import { useCheckEligibilityMutation } from '@/services/waseel-integration/eligibilityService';
import { Address, Patient, PatientDocument, PatientInsurance } from '@/types/model-types-new';
import { calculateAgeFormat, extractEligibilityErrorMessage, extractErrorMessage } from '@/utils';
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
  faUsersLine,
  faLayerGroup,
  faRotate
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Icon } from '@rsuite/icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaUser } from 'react-icons/fa';
import { VscUnverified, VscVerified } from 'react-icons/vsc';
import {
  Avatar,
  AvatarGroup,
  Dropdown,
  Form,
  Input,
  Message,
  Popover,
  SelectPicker,
  Stack,
  Tooltip,
  Whisper
} from 'rsuite';
import QuickPatient from '../facility-patient-list/QuickPatient';
import AdministrativeWarningsModal from './AdministrativeWarning';
import ScanDocumentModal from './ScanDocumentModal';
import './styles.less';
import {
  buildWaseelClassListDisplay,
  extractCchiInsurance,
  extractPatientInsurancesList,
  getCchiInsuranceStorageKey,
  pickPatientFields
} from './cchiMappers';
import type { CchiMappedPatientResponse } from '@/services/waseel-integration/cchiService';
import {
  formatInsurancePickerLabel,
  resolveInsurancePayorDisplayName
} from './insuranceDisplayUtils';
import { useLocation, useNavigate } from 'react-router-dom';
import usePatientInformationReportPrint from './PatientInformationReportDropdownItem';
import usePatientLabelPrint from './PatientLabelPrintDropdownItem';
import { FaCodeMerge } from 'react-icons/fa6';
import ViewPriceListModal from './ViewPriceListModal/ViewPriceListModal';

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
  setCchiAddress: (address: Address | null) => void;
  setCchiDocument?: (document: PatientDocument | null) => void;
  setCchiInsurance?: (insurance: PatientInsurance | null) => void;
  setProfileActiveTab?: (tabKey: string) => void;
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
  setCchiAddress,
  setCchiDocument,
  setCchiInsurance,
  setOpenReferralRequestModal
}) => {
  const {
    patientInformationMenuItem,
    patientInformationModal
  } = usePatientInformationReportPrint(localPatient?.id);
  const [openPriceListModal, setOpenPriceListModal] = useState(false);

  const {  patientLabelMenuItem,
    patientLabelModal}=usePatientLabelPrint(localPatient?.id); 
  const profileImageFileInputRef = useRef<HTMLInputElement | null>(null);
  const whisperRef = useRef<any>(null);

  const [patientImageUrl, setPatientImageUrl] = useState<string>('');
  const [openMoreMenu, setOpenMoreMenu] = useState<boolean>(false);
  const [openScanDocumentModal, setOpenScanDocumentModal] = useState<boolean>(false);
  const [quickPatientModalOpen, setQuickPatientModalOpen] = useState(false);
  const [printingType, setPrintingType] = useState<'information' | 'label' | null>(null);
  const [openCchiModal, setOpenCchiModal] = useState(false);
  const [cchiDocumentId, setCchiDocumentId] = useState('');
  const [openEligibilityModal, setOpenEligibilityModal] = useState(false);
  const [selectedPatientInsuranceId, setSelectedPatientInsuranceId] = useState<number | null>(
    null
  );

  const patientId = localPatient?.id ? Number(localPatient.id) : undefined;

  const dispatch = useAppDispatch();
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');

  const [uploadAttachments] = useUploadAttachmentsMutation();
  const [triggerGetPatientInformationPdf] = useLazyGetPatientInformationPdfQuery();
  const [triggerGetPatientLabelPdf] = useLazyGetPatientLabelPdfQuery();
  const [sendPatientPasswordEmail, { isLoading: isSendingPasswordEmail }] =
    useSendPatientPasswordEmailMutation();
  const [triggerGetPatientFromCchi, { isFetching: isFetchingCchiPatient }] =
    useLazyGetPatientFromCchiQuery();
  const [refreshPatientFromCchi, { isLoading: isRefreshingCchiPatient }] =
    useRefreshPatientFromCchiMutation();
  const [checkEligibility, { isLoading: isCheckingEligibility }] = useCheckEligibilityMutation();

  const { data: patientInsuranceResponseForHeader } = useGetInsurancesByPatientQuery(
    {
      patientId: patientId!,
      page: 0,
      size: 100,
      sort: 'id,desc'
    },
    {
      skip: !patientId,
      refetchOnMountOrArgChange: true
    }
  );

  const savedInsurancesForHeader = useMemo(
    () => extractPatientInsurancesList(patientInsuranceResponseForHeader),
    [patientInsuranceResponseForHeader]
  );

  const hasSavedInsurance = savedInsurancesForHeader.length > 0;
  const showRefreshFromCchiButton =
    Boolean(localPatient?.id) &&
    Boolean(localPatient?.isCchiPatient) &&
    !hasSavedInsurance;
  const showUpdateFromCchiButton = Boolean(localPatient?.id) && hasSavedInsurance;

  const { data: patientInsuranceResponse, isFetching: isFetchingInsurances, refetch: refetchInsurances } =
    useGetInsurancesByPatientQuery(
      {
        patientId: patientId!,
        page: 0,
        size: 100,
        sort: 'id,desc'
      },
      {
        skip: !patientId || !openEligibilityModal,
        refetchOnMountOrArgChange: true
      }
    );

  const { data: payorListResponse } = useGetAllPayorsQuery(
    { page: 0, size: 1000, sort: 'name,asc' },
    { skip: !openEligibilityModal }
  );

  const { data: nphiesPayerListResponse } = useGetAllNphiesPayersQuery(
    { page: 0, size: 2000, sort: 'nameEn,asc' },
    { skip: !openEligibilityModal }
  );

  const payorsList = payorListResponse?.data ?? [];
  const nphiesPayersList = nphiesPayerListResponse?.data ?? [];

  const patientInsurancesList = useMemo(
    () => extractPatientInsurancesList(patientInsuranceResponse),
    [patientInsuranceResponse]
  );

  const insurancePickerOptions = useMemo(
    () =>
      patientInsurancesList
        .filter((insurance: any) => insurance?.id != null && !Number.isNaN(Number(insurance.id)))
        .map((insurance: any) => ({
          label: formatInsurancePickerLabel(insurance, payorsList, nphiesPayersList),
          value: Number(insurance.id)
        })),
    [patientInsurancesList, payorsList, nphiesPayersList]
  );

  const selectedEligibilityInsurance = useMemo(
    () =>
      patientInsurancesList.find(
        insurance => Number(insurance.id) === Number(selectedPatientInsuranceId)
      ) ?? null,
    [patientInsurancesList, selectedPatientInsuranceId]
  );

  const selectedEligibilityPayorName = useMemo(
    () => resolveInsurancePayorDisplayName(selectedEligibilityInsurance ?? {}, payorsList, nphiesPayersList),
    [selectedEligibilityInsurance, payorsList, nphiesPayersList]
  );

  const eligibilityClassList = useMemo(
    () => buildWaseelClassListDisplay(selectedEligibilityInsurance),
    [selectedEligibilityInsurance]
  );

  const eligibilityClassListColumns = useMemo(
    () => [
      {
        key: 'classType',
        title: <Translate>Class Type</Translate>,
        width: 120
      },
      {
        key: 'className',
        title: <Translate>Class Name</Translate>,
        width: 180
      },
      {
        key: 'classValue',
        title: <Translate>Class Value</Translate>,
        width: 140
      }
    ],
    []
  );

  const {
    data: profilePictureTicket,
    isError
  } = useGetPatientProfilePictureQuery(
    { patientId: patientId! },
    { skip: !patientId, refetchOnMountOrArgChange: true }
  );

  useEffect(() => {
    if (!openEligibilityModal || selectedPatientInsuranceId != null) return;

    const primaryInsurance = patientInsurancesList.find((insurance: any) => insurance?.isPrimary);
    const defaultInsurance = primaryInsurance ?? patientInsurancesList[0];
    const defaultId = defaultInsurance?.id != null ? Number(defaultInsurance.id) : null;

    if (defaultId != null && !Number.isNaN(defaultId)) {
      setSelectedPatientInsuranceId(defaultId);
    }
  }, [openEligibilityModal, patientInsurancesList, selectedPatientInsuranceId]);

  const handleOpenEligibilityModal = () => {
    if (!localPatient?.id) {
      dispatch(
        notify({
          msg: 'Please save the patient before checking eligibility',
          sev: 'warning'
        })
      );
      return;
    }

    setSelectedPatientInsuranceId(null);
    setOpenEligibilityModal(true);
  };

  const handleCheckEligibility = async () => {
    if (!localPatient?.id) {
      dispatch(
        notify({
          msg: 'Please save the patient before checking eligibility',
          sev: 'warning'
        })
      );
      return;
    }

    if (!selectedPatientInsuranceId) {
      dispatch(
        notify({
          msg: 'Please select an insurance',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      const result = await checkEligibility({
        patientId: Number(localPatient.id),
        patientInsuranceId: selectedPatientInsuranceId,
        serviceDate: new Date().toISOString().split('T')[0],
        benefits: true,
        validation: true,
        discovery: false,
        transfer: false,
        emergency: false
      }).unwrap();

      dispatch(
        notify({
          msg:
            result.message ||
            `Eligibility check ${result.requestStatus ?? 'completed'} successfully`,
          sev: result.requestStatus === 'SUCCESS' ? 'success' : 'info'
        })
      );

      dispatch(
        notify({
          msg: result.message?.trim() || 'Eligibility check completed successfully',
          sev: 'success'
        })
      );

      dispatch(patientInsurancesService.util.invalidateTags(['PatientInsurance']));
      await refetchInsurances();
    } catch (error: any) {
      dispatch(
        notify({
          msg: extractEligibilityErrorMessage(error),
          sev: 'error'
        })
      );
    }
  };

  const applyCchiMappedResponse = (mappedResponse: CchiMappedPatientResponse) => {
    const rawInsurance = extractCchiInsurance(mappedResponse);

    setLocalPatient({
      ...localPatient,
      ...pickPatientFields(mappedResponse.patient),
      id: localPatient?.id ?? mappedResponse.patient?.id,
      isCchiPatient: true
    });

    setCchiAddress(mappedResponse.address ?? null);

    const mappedDocument = mappedResponse.document;
    if (mappedDocument) {
      setCchiDocument?.({
        ...mappedDocument,
        id: null,
        patient: null,
        countryId: mappedDocument.countryId,
        number: mappedDocument.number,
        type: mappedDocument.type,
        isPrimary: false
      } as any);
    } else {
      setCchiDocument?.(null);
    }

    if (rawInsurance) {
      setCchiInsurance?.({
        ...rawInsurance,
        id: undefined,
        patientId: localPatient?.id != null ? Number(localPatient.id) : undefined,
        isPrimary: rawInsurance.isPrimary ?? true
      } as PatientInsurance);

      const storageKey = getCchiInsuranceStorageKey(
        localPatient?.id,
        mappedResponse.patient?.documentId ?? localPatient?.documentId
      );
      if (storageKey) {
        sessionStorage.setItem(storageKey, JSON.stringify(rawInsurance));
      }
    } else {
      setCchiInsurance?.(null);
    }
  };

  const handleFetchPatientFromCchi = async () => {
    if (!cchiDocumentId?.trim()) {
      dispatch(
        notify({
          msg: 'Please enter document ID',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      const mappedResponse = await triggerGetPatientFromCchi(cchiDocumentId.trim()).unwrap();

      if (mappedResponse.alreadyExists && mappedResponse.patient) {
        setLocalPatient(mappedResponse.patient);
        dispatch(setPatient(mappedResponse.patient));
        setCchiAddress(null);
        setCchiDocument?.(null);
        setCchiInsurance?.(null);
        setOpenCchiModal(false);
        setCchiDocumentId('');

        dispatch(
          notify({
            msg:
              mappedResponse.message ||
              'Patient already exists in the system. Loaded from local records.',
            sev: 'warning'
          })
        );
        return;
      }

      applyCchiMappedResponse(mappedResponse);

      const rawInsurance = extractCchiInsurance(mappedResponse);

      setOpenCchiModal(false);
      setCchiDocumentId('');

      dispatch(
        notify({
          msg: rawInsurance
            ? 'Patient and insurance data loaded from CCHI. Open the Insurance tab when ready to save insurance.'
            : 'Patient data loaded from CCHI successfully',
          sev: 'success'
        })
      );
    } catch (error: any) {
      setCchiDocument?.(null);
      setCchiInsurance?.(null);

      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Failed to fetch patient from CCHI',
          sev: 'error'
        })
      );
    }
  };

  const handleRefreshOrUpdateFromCchi = async () => {
    if (!localPatient?.id) {
      dispatch(
        notify({
          msg: 'Please save the patient before refreshing from CCHI',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      const mappedResponse = await refreshPatientFromCchi(Number(localPatient.id)).unwrap();
      applyCchiMappedResponse(mappedResponse);

      const refreshedPatient = {
        ...localPatient,
        ...pickPatientFields(mappedResponse.patient),
        id: localPatient.id,
        isCchiPatient: true
      };

      setLocalPatient(refreshedPatient);
      dispatch(setPatient(refreshedPatient));

      const rawInsurance = extractCchiInsurance(mappedResponse);

      dispatch(
        notify({
          msg: rawInsurance
            ? 'Patient data refreshed from CCHI. Review insurance changes in the Insurance tab.'
            : 'Patient data refreshed from CCHI successfully',
          sev: 'success'
        })
      );
    } catch (error: any) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Failed to refresh patient data from CCHI',
          sev: 'error'
        })
      );
    }
  };

  const handlePrintInformation = async () => {
    if (!localPatient?.id) return;

    try {
      setPrintingType('information');

      const blob = await triggerGetPatientInformationPdf({
        patientId: localPatient.id
      }).unwrap();

      const pdfBlob = new Blob([blob], {
        type: 'application/pdf'
      });

      const fileURL = window.URL.createObjectURL(pdfBlob);
      const win = window.open(fileURL, '_blank');

      if (win) {
        win.focus();
      } else {
        dispatch(
          notify({
            msg: 'Popup blocked. Please allow popups for this site.',
            sev: 'warning'
          })
        );
      }
    } catch (err: any) {
      dispatch(
        notify({
          msg: err?.data?.message || 'Print failed',
          sev: 'error'
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
        patientId: rowData.id
      }).unwrap();

      const pdfBlob = new Blob([blob], {
        type: 'application/pdf'
      });

      const fileURL = window.URL.createObjectURL(pdfBlob);
      const win = window.open(fileURL, '_blank');

      if (win) {
        win.focus();
      } else {
        dispatch(
          notify({
            msg: 'Popup blocked. Please allow popups for this site.',
            sev: 'warning'
          })
        );
      }
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.message || 'Failed to open label pdf',
          sev: 'error'
        })
      );
    } finally {
      setPrintingType(null);
    }
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
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Failed to send password email',
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

        <Dropdown.Item
          onClick={() => {
            setOpenMoreMenu(false);
          }}
        >
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
      </Dropdown.Menu>
    </Popover>
  );


 const contentOfPrintIconMenu = (
  <Popover>
    <Dropdown.Menu>
      {patientInformationMenuItem}
      {patientLabelMenuItem}
  
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

        setRefetchAttachmentList(true);
        dispatch(notify({ msg: 'Profile Picture Uploaded Successfully', sev: 'success' }));
      } catch (error) {
        const errorMsg = extractErrorMessage(error);
        dispatch(
          notify({
            msg: errorMsg || 'Failed to Upload Profile Picture',
            sev: 'error'
          })
        );
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

  useEffect(() => {
    if (
      quickPatientModalOpen ||
      openScanDocumentModal ||
      openCchiModal ||
      openEligibilityModal
    ) {
      whisperRef.current?.close?.();
    }
  }, [quickPatientModalOpen, openScanDocumentModal, openCchiModal, openEligibilityModal]);

 

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
                      {localPatient.isCompletedPatient ? (
                        <Icon color="green" as={VscVerified} />
                      ) : (
                        <Icon color="red" as={VscUnverified} />
                      )}
                    </div>
                  </Whisper>
                )}

                {localPatient.patientStatus === 'MERGED' && (
                  <Whisper
                    placement="bottom"
                    controlId="merged-patient-tooltip"
                    trigger="hover"
                    speaker={
                      <Tooltip>
                        Merged Patient
                      </Tooltip>
                    }
                  >
                    <div className="status-icon merged-status-icon">
                      <Icon color="orange" as={FaCodeMerge} />
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
              <MyButton
                disabled={!localPatient?.id || isCheckingEligibility || localPatient?.patientStatus === 'MERGED'}
                loading={isCheckingEligibility}
                onClick={handleOpenEligibilityModal}
              >
                <Translate>Eligibility Check</Translate>
              </MyButton>

              <MyButton onClick={() => setOpenCchiModal(true)}>
                <Translate>Fetch Patient from CCHI</Translate>
              </MyButton>

              {showRefreshFromCchiButton ? (
                <MyButton
                  appearance="ghost"
                  loading={isRefreshingCchiPatient}
                  disabled={isRefreshingCchiPatient || localPatient?.patientStatus === 'MERGED'}
                  prefixIcon={() => <FontAwesomeIcon icon={faRotate} />}
                  onClick={handleRefreshOrUpdateFromCchi}
                >
                  <Translate>Refresh from CCHI</Translate>
                </MyButton>
              ) : null}

              {showUpdateFromCchiButton ? (
                <MyButton
                  appearance="ghost"
                  loading={isRefreshingCchiPatient}
                  disabled={isRefreshingCchiPatient || localPatient?.patientStatus === 'MERGED'}
                  prefixIcon={() => <FontAwesomeIcon icon={faRotate} />}
                  onClick={handleRefreshOrUpdateFromCchi}
                >
                  <Translate>Update Data from CCHI</Translate>
                </MyButton>
              ) : null}

              <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                onClick={handleSave}
                disabled={!!localPatient?.id && localPatient?.patientStatus === 'MERGED'}
              >
                <Translate>{localPatient?.id ? 'Edit' : 'Save'}</Translate>
              </MyButton>

              <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
                onClick={handleClear}
                disabled={localPatient?.id === undefined || localPatient?.patientStatus === 'MERGED'}
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


              <MyButton appearance="ghost" disabled={!localPatient.id || localPatient?.patientStatus === 'MERGED'} onClick={handleNewVisit}>
                <Translate>Walk-in Patient</Translate>
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
                  <MyButton size="small" onClick={() => setOpenMoreMenu(prev => !prev)}>
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

      <ViewPriceListModal
        open={openPriceListModal}
        setOpen={setOpenPriceListModal}
        patient={localPatient}
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

      <MyModal
        open={openEligibilityModal}
        setOpen={(open: boolean) => {
          if (!isCheckingEligibility) {
            setOpenEligibilityModal(open);
            if (!open) {
              setSelectedPatientInsuranceId(null);
            }
          }
        }}
        title={<Translate>Eligibility Check</Translate>}
        size="42vw"
        bodyheight="auto"
        pagesCount={1}
        hideBack
        actionButtonLabel={isCheckingEligibility ? 'Checking...' : 'Check Eligibility'}
        isDisabledActionBtn={
          isCheckingEligibility ||
          isFetchingInsurances ||
          insurancePickerOptions.length === 0 ||
          !selectedPatientInsuranceId
        }
        actionButtonFunction={handleCheckEligibility}
        cancelButtonLabel="Cancel"
        handleCancelFunction={() => {
          if (!isCheckingEligibility) {
            setOpenEligibilityModal(false);
            setSelectedPatientInsuranceId(null);
          }
        }}
        content={
          <Form fluid className="eligibility-check-modal">
            <Form.Group>
              <Form.ControlLabel>
                <Translate>Insurance</Translate>
              </Form.ControlLabel>

              {isFetchingInsurances ? (
                <Translate>Loading insurances...</Translate>
              ) : insurancePickerOptions.length === 0 ? (
                <Translate>
                  No insurance found for this patient. Please add insurance first.
                </Translate>
              ) : (
                <>
                  <SelectPicker
                    block
                    searchable
                    cleanable={false}
                    data={insurancePickerOptions}
                    value={selectedPatientInsuranceId}
                    disabled={isCheckingEligibility}
                    onChange={value =>
                      setSelectedPatientInsuranceId(value != null ? Number(value) : null)
                    }
                    placeholder="Select insurance"
                  />

                  {selectedEligibilityInsurance ? (
                    <div className="eligibility-check-modal__payor-line">
                      <span className="eligibility-check-modal__payor-label">
                        <Translate>Payor</Translate>
                      </span>
                      <strong>{selectedEligibilityPayorName}</strong>
                      <span className="eligibility-check-modal__payor-meta">
                        <Translate>Policy</Translate>:{' '}
                        {selectedEligibilityInsurance.policyNumber ?? '-'}
                        {selectedEligibilityInsurance.memberCardId
                          ? ` · ${selectedEligibilityInsurance.memberCardId}`
                          : ''}
                      </span>
                    </div>
                  ) : null}
                </>
              )}
            </Form.Group>

            {selectedEligibilityInsurance ? (
              <div className="eligibility-check-modal__class-list">
                <div className="eligibility-check-modal__class-list-header">
                  <FontAwesomeIcon icon={faLayerGroup} />
                  <span>
                    <Translate>Waseel Plan Class List</Translate>
                  </span>
                </div>

                {eligibilityClassList.length ? (
                  <MyTable
                    data={eligibilityClassList}
                    columns={eligibilityClassListColumns}
                    totalCount={eligibilityClassList.length}
                    page={0}
                    rowsPerPage={eligibilityClassList.length || 5}
                    onPageChange={() => undefined}
                    onRowsPerPageChange={() => undefined}
                  />
                ) : (
                  <Message showIcon type="info">
                    <Translate>
                      Class list will appear here after you run Check Eligibility.
                    </Translate>
                  </Message>
                )}

                <div className="eligibility-check-modal__snapshot">
                  <span>
                    <Translate>Network</Translate>:{' '}
                    {selectedEligibilityInsurance.networkId ?? '-'}
                  </span>
                  <span>
                    <Translate>Member ID</Translate>:{' '}
                    {selectedEligibilityInsurance.memberCardId ?? '-'}
                  </span>
                  <span>
                    <Translate>Status</Translate>:{' '}
                    {selectedEligibilityInsurance.eligibilityStatus ?? '-'}
                  </span>
                </div>
              </div>
            ) : null}
          </Form>
        }
      />

      <MyModal
        open={openCchiModal}
        setOpen={(open: boolean) => {
          if (!isFetchingCchiPatient) {
            setOpenCchiModal(open);
          }
        }}
        title={<Translate>Fetch Patient from CCHI</Translate>}
        size="30vw"
        bodyheight="160px"
        pagesCount={1}
        hideBack
        actionButtonLabel={isFetchingCchiPatient ? 'Loading...' : 'Load Patient'}
        isDisabledActionBtn={isFetchingCchiPatient}
        actionButtonFunction={handleFetchPatientFromCchi}
        cancelButtonLabel="Cancel"
        handleCancelFunction={() => {
          if (!isFetchingCchiPatient) {
            setOpenCchiModal(false);
            setCchiDocumentId('');
          }
        }}
        content={
          <Form fluid>
            <Form.Group>
              <Form.ControlLabel>
                <Translate>Document ID</Translate>
              </Form.ControlLabel>

              <Input
                value={cchiDocumentId}
                disabled={isFetchingCchiPatient}
                onChange={value => setCchiDocumentId(value)}
                placeholder="Enter document ID"
                onPressEnter={handleFetchPatientFromCchi}
              />
            </Form.Group>
          </Form>
        }
      />
      {patientInformationModal}
      {patientLabelModal}
    </div>
  );
};

export default ProfileHeader;