import ArrowLineToggle from '@/components/Frame/ArrowLineToggle';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import {
  useFetchAttachmentByKeyQuery,
  useFetchAttachmentQuery,
  useUploadMutation
} from '@/services/attachmentService';
import {
  useDeletePatientAdministrativeWarningsMutation,
  useDeletePatientInsuranceMutation,
  useDeletePatientRelationMutation,
  useGetAgeGroupValueQuery,
  useGetPatientAdministrativeWarningsQuery,
  useGetPatientInsuranceQuery,
  useGetPatientRelationsQuery,
  useGetPatientsQuery,
  useSavePatientAdministrativeWarningsMutation,
  useSavePatientMutation,
  useSavePatientRelationMutation,
  useSendVerificationOtpMutation,
  useUpdatePatientAdministrativeWarningsMutation,
  useVerifyVerificationOtpMutation
} from '@/services/patientService';
import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { RootState } from '@/store';
import {
  ApAttachment,
  ApPatient,
  ApPatientAdministrativeWarnings,
  ApPatientInsurance
} from '@/types/model-types';
import {
  newApEncounter,
  newApPatient,
  newApPatientAdministrativeWarnings,
  newApPatientInsurance,
  newApPatientRelation
} from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest, calculateAgeFormat, fromCamelCaseToDBName } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import {
  faBroom,
  faCheckDouble,
  faEllipsis,
  faLock,
  faUserPen
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Check, Icon, PlusRound } from '@rsuite/icons';
import ArrowLeftLineIcon from '@rsuite/icons/ArrowLeftLine';
import CheckOutlineIcon from '@rsuite/icons/CheckOutline';
import CloseIcon from '@rsuite/icons/Close';
import ListIcon from '@rsuite/icons/List';
import MoreIcon from '@rsuite/icons/More';
import ReloadIcon from '@rsuite/icons/Reload';
import SearchIcon from '@rsuite/icons/Search';
import SearchPeopleIcon from '@rsuite/icons/SearchPeople';
import TrashIcon from '@rsuite/icons/Trash';
import React, { useEffect, useRef, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { FaClock } from 'react-icons/fa6';
import { VscGitPullRequestGoToChanges, VscUnverified, VscVerified } from 'react-icons/vsc';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import 'react-tabs/style/react-tabs.css';
import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  ButtonToolbar,
  Col,
  Divider,
  DOMHelper,
  Dropdown,
  Form,
  IconButton,
  Input,
  InputGroup,
  Modal,
  Nav,
  Pagination,
  Panel,
  Row,
  SelectPicker,
  Sidebar,
  Sidenav,
  Stack,
  Table,
  Tabs,
  Tooltip,
  Whisper
} from 'rsuite';
import ConsentFormTab from './ConsentFormTab';
import InsuranceModal from './InsuranceModal';
import PatientAttachment from './PatientAttachment';
import PatientExtraDetails from './PatientExtraDetails';
import PatientFamilyMembers from './PatientFamilyMembers';
import PatientQuickAppointment from './PatientQuickAppointment';
import PatientVisitHistory from './PatientVisitHistory';
import PreferredHealthProfessional from './PreferredHealthProfessional';
import SpecificCoverageModa from './SpecificCoverageModa';
const { Column, HeaderCell, Cell } = Table;
const { getHeight, on } = DOMHelper;
const handleDownload = attachment => {
  const byteCharacters = atob(attachment.fileContent);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: attachment.contentType });
  // Create a temporary  element and trigger the download
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = attachment.fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
};
const PatientProfileCopy = () => {
  const authSlice = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const [localVisit, setLocalVisit] = useState({ ...newApEncounter });
  const [windowHeight, setWindowHeight] = useState(getHeight(window));
  const [expand, setExpand] = useState(false);
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
  const [searchResultVisible, setSearchResultVisible] = useState(false);
  const [patientSearchTarget, setPatientSearchTarget] = useState('primary'); // primary, relation, etc..
  const [selectedCriterion, setSelectedCriterion] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [specificCoverageModalOpen, setSpecificCoverageModalOpen] = useState(false);
  const [deleteRelativeModalOpen, setDeleteRelativeModalOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [labelTitle, setLabelTitle] = useState(' ');
  const [administrativeWarningDetails, setAdministrativeWarningDetails] = useState('');
  const [quickAppointmentModel, setQuickAppointmentModel] = useState(false);
  const [visitHistoryModel, setVisitHistoryModel] = useState(false);
  const [selectedAttachType, setSelectedAttachType] = useState({
    accessTypeLkey: ''
  });
  const location = useLocation();
  const propsData = location.state;
  const [requestedPatientAttacment, setRequestedPatientAttacment] = useState();
  const [savePatientRelation, savePatientRelationMutation] = useSavePatientRelationMutation();
  const [relationModalOpen, setRelationModalOpen] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [administrativeWarningsModalOpen, setAdministrativeWarningsModalOpen] = useState(false);
  const [savePatient, savePatientMutation] = useSavePatientMutation();
  const [savePatientAdministrativeWarnings, setSavePatientAdministrativeWarnings] =
    useSavePatientAdministrativeWarningsMutation();
  const [updatePatientAdministrativeWarnings, setUpdatePatientAdministrativeWarnings] =
    useUpdatePatientAdministrativeWarningsMutation();
  const [deletePatientAdministrativeWarnings, setDeletePatientAdministrativeWarnings] =
    useDeletePatientAdministrativeWarningsMutation();
  const [sendOtp, sendOtpMutation] = useSendVerificationOtpMutation();
  const [verifyOtp, verifyOtpMutation] = useVerifyVerificationOtpMutation();
  const [upload, uploadMutation] = useUploadMutation();
  const [deleteInsurance, deleteInsuranceMutation] = useDeletePatientInsuranceMutation();
  const [deleteRelation, deleteRelationMutation] = useDeletePatientRelationMutation();
  const [validationResult, setValidationResult] = useState({});
  const profileImageFileInputRef = useRef(null);
  const [InsuranceModalOpen, setInsuranceModalOpen] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<ApPatientInsurance | null>();
  const [insuranceBrowsing, setInsuranceBrowsing] = useState(false);
  //LOV
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
  const { data: cityLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'CITY',
    parentValueKey: localPatient.countryLkey
  });
  const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
  const { data: maritalStatusLovQueryResponse } = useGetLovValuesByCodeQuery('MARI_STATUS');
  const { data: nationalityLovQueryResponse } = useGetLovValuesByCodeQuery('NAT');
  const { data: primaryLangLovQueryResponse } = useGetLovValuesByCodeQuery('LANG');
  const { data: religeonLovQueryResponse } = useGetLovValuesByCodeQuery('REL');
  const { data: ethnicityLovQueryResponse } = useGetLovValuesByCodeQuery('ETH');
  const { data: occupationLovQueryResponse } = useGetLovValuesByCodeQuery('OCCP');
  const { data: relationsLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
  const { data: roleLovQueryResponse } = useGetLovValuesByCodeQuery('ER_CONTACTP_ROLE');
  const { data: administrativeWarningsLovQueryResponse } =
    useGetLovValuesByCodeQuery('ADMIN_WARNINGS');
  const { data: preferredWayOfContactLovQueryResponse } =
    useGetLovValuesByCodeQuery('PREF_WAY_OF_CONTACT');
  const { data: patientClassLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_CLASS');
  const { data: educationalLevelLovQueryResponse } = useGetLovValuesByCodeQuery('EDU_LEVEL');
  const { data: responsiblePartyLovQueryResponse } = useGetLovValuesByCodeQuery('RESP_PARTY');
  const { data: securityAccessLevelLovQueryResponse } =
    useGetLovValuesByCodeQuery('SEC_ACCESS_LEVEL');
  const [warningsAdmistritiveListRequest, setWarningsAdmistritiveListRequest] =
    useState<ListRequest>({
      ...initialListRequest,
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: localPatient.key || undefined
        },
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        }
      ]
    });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: !searchKeyword || searchKeyword.length < 3
  });
  const { data: warnings, refetch: warningsRefetch } = useGetPatientAdministrativeWarningsQuery(
    warningsAdmistritiveListRequest
  );
  const [patientAdministrativeWarnings, setPatientAdministrativeWarnings] =
    useState<ApPatientAdministrativeWarnings>({ ...newApPatientAdministrativeWarnings });
  const searchCriteriaOptions = [
    { label: 'MRN', value: 'patientMrn' },
    { label: 'Document Number', value: 'documentNo' },
    { label: 'Full Name', value: 'fullName' },
    { label: 'Archiving Number', value: 'archivingNumber' },
    { label: 'Primary Phone Number', value: 'phoneNumber' },
    { label: 'Date of Birth', value: 'dob' }
  ];

  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Patient Registration</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Patient_Registration'));
  dispatch(setDivContent(divContentHTML));
  const {
    data: patientListResponse,
    isLoading: isGettingPatients,
    isFetching: isFetchingPatients,
    refetch: refetchPatients
  } = useGetPatientsQuery({ ...listRequest, filterLogic: 'or' });
  const [patientRelationListRequest, setPatientRelationListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 1000
  });
  const { data: patientRelationsResponse, refetch: patientRelationsRefetch } =
    useGetPatientRelationsQuery(
      {
        listRequest: patientRelationListRequest,
        key: localPatient?.key
      },
      { skip: !localPatient.key }
    );
  const { data: patientAgeGroupResponse, refetch: patientAgeGroupRefetch } =
    useGetAgeGroupValueQuery(
      {
        dob: localPatient?.dob ? new Date(localPatient.dob).toISOString() : null
      },
      { skip: !localPatient?.dob }
    );
  const [ageGroupValue, setAgeGroupValue] = useState({
    ageGroup: ''
  });
  const [ageFormatType, setAgeFormatType] = useState({
    ageFormat: ''
  });
  const [selectedPatientRelation, setSelectedPatientRelation] = useState<any>({
    ...newApPatientRelation
  });
  const [selectedPatientAdministrativeWarnings, setSelectedPatientAdministrativeWarnings] =
    useState<any>({
      ...newApPatientAdministrativeWarnings
    });
  const fetchPatientImageResponse = useFetchAttachmentQuery(
    {
      type: 'PATIENT_PROFILE_PICTURE',
      refKey: localPatient.key
    },
    { skip: !localPatient.key }
  );
  const [actionType, setActionType] = useState(null); // 'view' or 'download'
  const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationRequest, setVerificationRequest] = useState({
    otp: ''
  });
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [newAttachmentType, setNewAttachmentType] = useState();
  const [newAttachmentDetails, setNewAttachmentDetails] = useState('');
  const navBodyStyle: React.CSSProperties = expand
    ? { height: windowHeight, overflow: 'auto' }
    : { height: windowHeight };
  //handleFun
  const handleSave = () => {
    // save changes
    savePatient({ ...localPatient, incompletePatient: false, unknownPatient: false })
      .unwrap()
      .then(() => {
        dispatch(notify('Patient Added Successfully'));
      });
  };
  const handleImageClick = type => {
    setNewAttachmentType(type); // PATIENT_PROFILE_ATTACHMENT or PATIENT_PROFILE_PICTURE
    if (localPatient.key) profileImageFileInputRef.current.click();
  };
  const isSelected = rowData => {
    if (
      rowData &&
      selectedPatientAdministrativeWarnings &&
      rowData.key === selectedPatientAdministrativeWarnings.key
    ) {
      return 'selected-row';
    } else return '';
  };
  const handleDeleteInsurance = () => {
    deleteInsurance({
      key: selectedInsurance.key
    }).then(
      () => (
        patientInsuranceResponse.refetch(),
        dispatch(notify('Insurance Deleted')),
        setSelectedInsurance(null)
      )
    );
  };
  const {
    data: fetchAttachmentByKeyResponce,
    error,
    isLoading,
    isFetching,
    isSuccess,
    refetch
  } = useFetchAttachmentByKeyQuery(
    { key: requestedPatientAttacment },
    { skip: !requestedPatientAttacment || !localPatient.key }
  );
  const handleUpdateAdministrativeWarningsUnDoResolved = () => {
    updatePatientAdministrativeWarnings({
      ...selectedPatientAdministrativeWarnings,
      resolutionUndoDate: new Date().toISOString(),
      resolvedUndoBy: 'keyForCurrentUser',
      isValid: true
    })
      .unwrap()
      .then(() => {
        warningsRefetch();
        dispatch(notify('Activeted Successfly '));
        setSelectedPatientAdministrativeWarnings({ ...newApPatientAdministrativeWarnings });
      });
  };
  const handleUpdateAdministrativeWarningsResolved = () => {
    updatePatientAdministrativeWarnings({
      ...selectedPatientAdministrativeWarnings,
      dateResolved: new Date().toISOString(),
      resolvedBy: 'keyForCurrentUser',
      isValid: false
    })
      .unwrap()
      .then(() => {
        warningsRefetch();
        dispatch(notify('Resolved Successfly '));
        setSelectedPatientAdministrativeWarnings({ ...newApPatientAdministrativeWarnings });
      });
  };
  const handleSavePatientAdministrativeWarnings = () => {
    savePatientAdministrativeWarnings({
      ...patientAdministrativeWarnings,
      description: administrativeWarningDetails,
      patientKey: localPatient.key
    })
      .unwrap()
      .then(() => {
        setPatientAdministrativeWarnings({
          ...patientAdministrativeWarnings,
          description: '',
          warningTypeLkey: undefined
        });
        setAdministrativeWarningDetails('');
        warningsRefetch();
        dispatch(notify('Activated Successfully'));
        setPatientAdministrativeWarnings({ ...newApPatientAdministrativeWarnings });
      });
  };
  const handleDeletePatientAdministrativeWarnings = () => {
    deletePatientAdministrativeWarnings({
      ...selectedPatientAdministrativeWarnings
    })
      .unwrap()
      .then(() => {
        warningsRefetch();
        dispatch(notify('Deleted Successfly '));
        setSelectedPatientAdministrativeWarnings({ ...newApPatientAdministrativeWarnings });
      });
  };
  const handleClear = () => {
    setLocalPatient({
      ...newApPatient,
      documentCountryLkey: null,
      documentTypeLkey: null,
      specialCourtesyLkey: null,
      genderLkey: null,
      maritalStatusLkey: null,
      nationalityLkey: null,
      primaryLanguageLkey: null,
      religionLkey: null,
      ethnicityLkey: null,
      occupationLkey: null,
      emergencyContactRelationLkey: null,
      countryLkey: null,
      stateProvinceRegionLkey: null,
      cityLkey: null,
      patientClassLkey: null,
      securityAccessLevelLkey: null,
      responsiblePartyLkey: null,
      educationalLevelLkey: null,
      preferredContactLkey: null,
      roleLkey: null
    });
    setValidationResult(undefined);
    dispatch(setPatient(null));
    dispatch(setEncounter(null));
    setPatientImage(undefined);
    setRequestedPatientAttacment(null);
    setActionType(null);
    setSelectedCriterion('');
  };
  const handleFileChange = async event => {
    if (!localPatient) return;

    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      if (attachmentsModalOpen) {
      } else {
        upload({
          formData: formData,
          type: 'PATIENT_PROFILE_PICTURE',
          refKey: localPatient.key,
          details: `Profile Picture for ${localPatient.fullName}`,
          accessType: '',
          createdBy: authSlice.user.key
        })
          .unwrap()
          .then();
      }
    }
  };
  const handleSelect = value => {
    setSelectedCriterion(value);
    setOpen(false);
  };
  const handleFilterChangeInWarning = (fieldName, value) => {
    if (value) {
      setWarningsAdmistritiveListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          String(value),
          warningsAdmistritiveListRequest
        )
      );
    } else {
      setWarningsAdmistritiveListRequest({
        ...warningsAdmistritiveListRequest,
        filters: [
          {
            fieldName: 'patient_key',
            operator: 'match',
            value: localPatient.key || undefined
          },
          {
            fieldName: 'deleted_at',
            operator: 'isNull',
            value: undefined
          }
        ]
      });
    }
  };
  const search = target => {
    setPatientSearchTarget(target);
    setSearchResultVisible(true);

    if (searchKeyword && searchKeyword.length >= 3 && selectedCriterion) {
      setListRequest({
        ...listRequest,
        ignore: false,
        filters: [
          {
            fieldName: fromCamelCaseToDBName(selectedCriterion),
            operator: 'containsIgnoreCase',
            value: searchKeyword
          }
        ]
      });
    }
  };
  const conjurePatientSearchBar = target => {
    return (
      <Panel>
        <ButtonToolbar
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}
        >
          <div>
            <Dropdown
              title={selectedCriterion ? labelTitle : 'Select Search Criteria'}
              style={{ width: 245 }}
              open={open}
              onToggle={() => setOpen(!open)}
            >
              {searchCriteriaOptions.map(option => (
                <Dropdown.Item
                  key={option.value}
                  onSelect={() => {
                    setLabelTitle(option.label);
                    handleSelect(option.value);
                  }}
                >
                  {option.label}
                </Dropdown.Item>
              ))}
            </Dropdown>
          </div>

          <InputGroup inside style={{ width: '245px', direction: 'ltr' }}>
            <Input
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  search(target);
                }
              }}
              placeholder={'Search Patients '}
              value={searchKeyword}
              onChange={e => setSearchKeyword(e)}
            />
            <InputGroup.Button onClick={() => search(target)}>
              <SearchIcon />
            </InputGroup.Button>
          </InputGroup>
        </ButtonToolbar>
      </Panel>
    );
  };
  const handleNewVisit = () => {
    setQuickAppointmentModel(true);
  };
  const handleEditModal = () => {
    if (selectedInsurance) {
      setInsuranceModalOpen(true);
    }
  };
  const handleShowInsuranceDetails = () => {
    setInsuranceModalOpen(true);
    setInsuranceBrowsing(true);
  };
  const patientInsuranceResponse = useGetPatientInsuranceQuery({
    patientKey: localPatient.key
  });
  //useEffect
  useEffect(() => {
    dispatch(setPatient({ ...newApPatient }));
  }, []);
  useEffect(() => {
    if (propsData && propsData.patient) {
      console.log('propsData.patient-->', propsData.patient.key);
      setLocalPatient(propsData.patient);
    }
  }, [propsData]);

  useEffect(() => {
    if (patientAgeGroupResponse?.object?.lovDisplayVale) {
      setAgeGroupValue({
        ageGroup: patientAgeGroupResponse.object.lovDisplayVale
      });
    }
  }, [patientAgeGroupResponse]);

  useEffect(() => {
    if (localPatient?.dob) {
      const calculatedFormat = calculateAgeFormat(localPatient.dob);
      setAgeFormatType(prevState => ({
        ...prevState,
        ageFormat: calculatedFormat
      }));
    } else {
      setAgeFormatType(prevState => ({
        ...prevState,
        ageFormat: ''
      }));
    }
  }, [localPatient?.dob]);
  useEffect(() => {
    const updatedFilters = [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: localPatient.key || undefined
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ];
    setWarningsAdmistritiveListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
  }, [localPatient.key]);
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);
  useEffect(() => {
    if (isSuccess && fetchAttachmentByKeyResponce) {
      if (actionType === 'download') {
        handleDownload(fetchAttachmentByKeyResponce);
      } else if (actionType === 'view') {
        setAttachmentsModalOpen(true);
        setNewAttachmentDetails(fetchAttachmentByKeyResponce.extraDetails);
        setSelectedAttachType({ accessTypeLkey: fetchAttachmentByKeyResponce.accessTypeLkey });
      }
    }
  }, [fetchAttachmentByKeyResponce, actionType]);
  useEffect(() => {
    setSearchKeyword('');
  }, [selectedCriterion]);
  useEffect(() => {
    if (savePatientRelationMutation.status === 'fulfilled') {
      setSelectedPatientRelation(savePatientRelationMutation.data);
      setPatientRelationListRequest({ ...patientRelationListRequest, timestamp: Date.now() });
      setRelationModalOpen(false);
      dispatch(notify('Relation saved'));
    }
  }, [savePatientRelationMutation]);
  useEffect(() => {
    if (sendOtpMutation.status === 'fulfilled') {
      dispatch(notify('OTP sent'));
    }
  }, [sendOtpMutation]);
  useEffect(() => {
    if (verifyOtpMutation.status === 'fulfilled') {
      dispatch(notify('Patient verified success'));
      setLocalPatient(verifyOtpMutation.data);
      dispatch(setPatient(verifyOtpMutation.data));
      setVerificationModalOpen(false);
    }
  }, [verifyOtpMutation]);
  useEffect(() => {
    if (savePatientMutation && savePatientMutation.status === 'fulfilled') {
      setLocalPatient(savePatientMutation.data);
      dispatch(setPatient(savePatientMutation.data));
      setValidationResult(undefined);
    } else if (savePatientMutation && savePatientMutation.status === 'rejected') {
      setValidationResult(savePatientMutation.error.data.validationResult);
    }
  }, [savePatientMutation]);
  useEffect(() => {
    if (uploadMutation.status === 'fulfilled') {
      dispatch(notify('patient image uploaded'));
      if (!attachmentsModalOpen) setPatientImage(uploadMutation.data);
    }
  }, [uploadMutation]);
  useEffect(() => {
    if (localPatient) {
      setPatientRelationListRequest({
        ...patientRelationListRequest,
        filters: [
          {
            fieldName: 'patient_key',
            operator: 'match',
            value: localPatient.key
          }
        ]
      });
    }
  }, []);
  useEffect(() => {
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
  useEffect(() => {
    if (isSuccess && fetchAttachmentByKeyResponce) {
      if (actionType === 'download') {
        handleDownload(fetchAttachmentByKeyResponce);
      } else if (actionType === 'view') {
        setAttachmentsModalOpen(true);
        setNewAttachmentDetails(fetchAttachmentByKeyResponce.extraDetails);
        setSelectedAttachType({ accessTypeLkey: fetchAttachmentByKeyResponce.accessTypeLkey });
      }
    }
  }, [requestedPatientAttacment, fetchAttachmentByKeyResponce, actionType]);
  return (
    <Panel>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <div style={{ width: expand ? 'calc(100% - 240px)' : '100%' }}>
          <Panel bordered>
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
                                    {localPatient.verified
                                      ? 'Verified Patient'
                                      : 'Unverified Patient'}
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
                            onClick={() => handleImageClick('PATIENT_PROFILE_PICTURE')}
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
                    <ButtonToolbar style={{ zoom: 0.8 }}>
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
                        <FontAwesomeIcon
                          icon={faBroom}
                          style={{ marginRight: '5px', color: 'white' }}
                        />
                        <Translate>Clear</Translate>
                      </Button>
                      <SelectPicker
                        style={{ width: 185 }}
                        data={[
                          {
                            label: (
                              <Button
                                color="blue"
                                appearance="ghost"
                                style={{
                                  color: 'var(--primary-blue)',
                                  textAlign: 'left',
                                  width: 170
                                }}
                                disabled={localPatient.key === undefined}
                                onClick={() => setVisitHistoryModel(true)}
                                block
                              >
                                <span>Visit History</span>
                              </Button>
                            ),
                            value: 'visitHistory'
                          },

                          {
                            label: (
                              <Button
                                color="blue"
                                appearance="ghost"
                                style={{
                                  color: 'var(--primary-blue)',
                                  textAlign: 'left',
                                  width: 170
                                }}
                                disabled={!localPatient.key}
                                onClick={handleNewVisit}
                                block
                              >
                                <span>Quick Appointment</span>
                              </Button>
                            ),
                            value: 'quickAppointment'
                          },
                          {
                            label: (
                              <Button
                                color="blue"
                                onClick={() => setAdministrativeWarningsModalOpen(true)}
                                disabled={!localPatient.key}
                                appearance="ghost"
                                style={{
                                  color: 'var(--primary-blue)',
                                  textAlign: 'left',
                                  width: 170
                                }}
                                block
                              >
                                <span>Administrative Warnings</span>
                              </Button>
                            ),
                            value: 'administrativeWarnings'
                          }
                        ]}
                        placeholder={
                          <span style={{ color: 'var(--primary-blue)' }}>
                            <ListIcon style={{ marginRight: 8 }} />
                            {'  '} More
                          </span>
                        }
                        menuStyle={{ marginTop: 0, width: 180, padding: 5 }}
                      />
                    </ButtonToolbar>
                  </Form>
                </Stack.Item>
              </Stack>
            </Panel>
            {/* Administrative Warnings */}
            <Modal
              size="lg"
              open={administrativeWarningsModalOpen}
              onClose={() => setAdministrativeWarningsModalOpen(false)}
            >
              <Modal.Header>
                <Modal.Title>Administrative Warnings</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form fluid>
                  <MyInput
                    vr={validationResult}
                    required
                    fieldLabel="Warning Type"
                    fieldType="select"
                    fieldName="warningTypeLkey"
                    selectData={administrativeWarningsLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={patientAdministrativeWarnings}
                    setRecord={setPatientAdministrativeWarnings}
                  />

                  <Input
                    // value={newAttachmentDetails || ''}
                    onChange={setAdministrativeWarningDetails}
                    as="textarea"
                    rows={3}
                    placeholder="Details"
                    style={{ width: 357 }}
                  />
                </Form>
                <br />
                <ButtonToolbar>
                  <IconButton
                    appearance="primary"
                    color="violet"
                    icon={<Check />}
                    onClick={handleSavePatientAdministrativeWarnings}
                  >
                    <Translate>Add</Translate>
                  </IconButton>

                  <IconButton
                    appearance="primary"
                    color="cyan"
                    disabled={!selectedPatientAdministrativeWarnings.isValid}
                    icon={<CheckOutlineIcon />}
                    onClick={handleUpdateAdministrativeWarningsResolved}
                  >
                    <Translate>Resolve</Translate>
                  </IconButton>
                  <IconButton
                    appearance="primary"
                    disabled={
                      selectedPatientAdministrativeWarnings.isValid == undefined ||
                      selectedPatientAdministrativeWarnings.isValid
                    }
                    icon={<ReloadIcon />}
                    onClick={handleUpdateAdministrativeWarningsUnDoResolved}
                  >
                    <Translate>Undo Resolve</Translate>
                  </IconButton>
                </ButtonToolbar>
                <br />
                <Panel>
                  <Table
                    height={310}
                    sortColumn={warningsAdmistritiveListRequest.sortBy}
                    sortType={warningsAdmistritiveListRequest.sortType}
                    onSortColumn={(sortBy, sortType) => {
                      if (sortBy)
                        setWarningsAdmistritiveListRequest({
                          ...warningsAdmistritiveListRequest,
                          sortBy,
                          sortType
                        });
                    }}
                    headerHeight={80}
                    rowHeight={50}
                    bordered
                    cellBordered
                    onRowClick={rowData => {
                      setSelectedPatientAdministrativeWarnings(rowData);
                      setSelectedRowId(rowData.key);
                    }}
                    rowClassName={isSelected}
                    data={warnings?.object ?? []}
                  >
                    <Column sortable flexGrow={3}>
                      <HeaderCell>
                        <Input
                          onChange={e =>
                            handleFilterChangeInWarning('warningTypeLvalue.lovDisplayVale', e)
                          }
                        />
                        <Translate>Warning Type</Translate>
                      </HeaderCell>

                      <Cell dataKey="warningTypeLvalue.lovDisplayVale" />
                    </Column>
                    <Column sortable flexGrow={3}>
                      <HeaderCell>
                        <Input onChange={e => handleFilterChangeInWarning('description', e)} />
                        <Translate>Description</Translate>
                      </HeaderCell>
                      <Cell dataKey="description" />
                    </Column>
                    <Column sortable flexGrow={4}>
                      <HeaderCell>
                        <Input onChange={e => handleFilterChangeInWarning('createdAt', e)} />
                        <Translate> Addition Date</Translate>
                      </HeaderCell>
                      <Cell dataKey="createdAt" />
                    </Column>
                    <Column sortable flexGrow={3}>
                      <HeaderCell>
                        <Input onChange={e => handleFilterChangeInWarning('createdBy', e)} />
                        <Translate> Added By</Translate>
                      </HeaderCell>
                      <Cell dataKey="createdBy" />
                    </Column>
                    <Column sortable flexGrow={3}>
                      <HeaderCell>
                        <Translate> Status </Translate>
                      </HeaderCell>

                      <Cell dataKey="isValid">
                        {rowData => (rowData.isValid ? 'Active' : 'Resolved')}
                      </Cell>
                    </Column>
                    <Column sortable flexGrow={4}>
                      <HeaderCell>
                        <Input onChange={e => handleFilterChangeInWarning('dateResolved', e)} />
                        <Translate> Resolution Date</Translate>
                      </HeaderCell>
                      <Cell dataKey="dateResolved" />
                    </Column>
                    <Column sortable flexGrow={3}>
                      <HeaderCell>
                        <Input onChange={e => handleFilterChangeInWarning('resolvedBy', e)} />
                        <Translate> Resolved By </Translate>
                      </HeaderCell>
                      <Cell dataKey="resolvedBy" />
                    </Column>
                    <Column sortable flexGrow={4}>
                      <HeaderCell>
                        <Input
                          onChange={e => handleFilterChangeInWarning('resolutionUndoDate', e)}
                        />
                        <Translate> Resolution Undo Date</Translate>
                      </HeaderCell>
                      <Cell dataKey="resolutionUndoDate" />
                    </Column>
                    <Column sortable flexGrow={4}>
                      <HeaderCell>
                        <Input onChange={e => handleFilterChangeInWarning('resolvedUndoBy', e)} />
                        <Translate>Resolution Undo By</Translate>
                      </HeaderCell>
                      <Cell dataKey="resolvedUndoBy" />
                    </Column>
                    <Column sortable flexGrow={2}>
                      <HeaderCell>
                        <Translate>Delete</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData => (
                          <div className="deleteButton">
                            <button
                              onClick={() => {
                                setSelectedPatientAdministrativeWarnings(rowData);
                                handleDeletePatientAdministrativeWarnings();
                              }}
                              className="deleteButton"
                              style={{
                                color: selectedRowId === rowData.key ? 'black' : 'gray',
                                background: 'transparent',
                                cursor: selectedRowId === rowData.key ? 'pointer' : 'not-allowed'
                              }}
                              disabled={selectedRowId !== rowData.key}
                            >
                              <CloseIcon />
                            </button>
                          </div>
                        )}
                      </Cell>
                    </Column>
                  </Table>
                  <div style={{ padding: 20 }}>
                    <Pagination
                      prev
                      next
                      first
                      last
                      ellipsis
                      boundaryLinks
                      maxButtons={5}
                      size="xs"
                      layout={['limit', '|', 'pager']}
                      limitOptions={[5, 15, 30]}
                      limit={warningsAdmistritiveListRequest.pageSize}
                      activePage={warningsAdmistritiveListRequest.pageNumber}
                      onChangePage={pageNumber => {
                        setWarningsAdmistritiveListRequest({
                          ...warningsAdmistritiveListRequest,
                          pageNumber
                        });
                      }}
                      onChangeLimit={pageSize => {
                        setWarningsAdmistritiveListRequest({
                          ...warningsAdmistritiveListRequest,
                          pageSize
                        });
                      }}
                      total={warnings?.extraNumeric ?? 0}
                    />
                  </div>
                </Panel>
              </Modal.Body>
            </Modal>
            <Panel
              header={
                <h5 className="title">
                  <Translate>Basic Information</Translate>
                </h5>
              }
            >
              <Stack>
                <Stack.Item grow={1}></Stack.Item>
                <Stack.Item grow={15}>
                  <Form layout="inline" fluid>
                    <MyInput
                      required
                      vr={validationResult}
                      column
                      fieldName="firstName"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      required
                      width={165}
                      vr={validationResult}
                      column
                      fieldName="secondName"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      width={165}
                      vr={validationResult}
                      column
                      fieldName="thirdName"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      required
                      width={165}
                      vr={validationResult}
                      column
                      fieldName="lastName"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      required
                      width={165}
                      vr={validationResult}
                      column
                      fieldLabel="Sex at Birth"
                      fieldType="select"
                      fieldName="genderLkey"
                      selectData={genderLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      width={165}
                      vr={validationResult}
                      column
                      fieldType="date"
                      fieldLabel="DOB"
                      fieldName="dob"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      width={165}
                      vr={validationResult}
                      column
                      fieldLabel="Age"
                      fieldType="text"
                      disabled
                      fieldName="ageFormat"
                      record={localPatient?.dob ? ageFormatType : null}
                    />
                    <MyInput
                      width={165}
                      vr={validationResult}
                      column
                      fieldLabel="Patient Category"
                      fieldType="text"
                      fieldName="ageGroup"
                      disabled
                      record={localPatient?.dob ? ageGroupValue : null}
                    />
                    <MyInput
                      width={165}
                      vr={validationResult}
                      column
                      fieldLabel="Patient Class"
                      fieldType="select"
                      fieldName="patientClassLkey"
                      selectData={patientClassLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    {localPatient?.incompletePatient ? (
                      <MyInput
                        width={165}
                        vr={validationResult}
                        column
                        fieldLabel="Unknown Patient"
                        fieldType="checkbox"
                        fieldName="unknownPatient"
                        record={localPatient}
                        setRecord={setLocalPatient}
                        disabled
                      />
                    ) : null}
                    <MyInput
                      width={180}
                      vr={validationResult}
                      column
                      fieldLabel="Private Patient"
                      fieldType="checkbox"
                      fieldName="privatePatient"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      required
                      width={165}
                      vr={validationResult}
                      column
                      fieldLabel="Document Type"
                      fieldType="select"
                      fieldName="documentTypeLkey"
                      selectData={docTypeLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      required
                      width={165}
                      vr={validationResult}
                      column
                      fieldLabel="Document Country"
                      fieldType="select"
                      fieldName="documentCountryLkey"
                      selectData={countryLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                      disabled={localPatient.documentTypeLkey === 'NO_DOC'}
                    />
                    <MyInput
                      required
                      width={165}
                      vr={validationResult}
                      column
                      fieldLabel="Document Number"
                      fieldName="documentNo"
                      record={localPatient}
                      setRecord={setLocalPatient}
                      disabled={localPatient.documentTypeLkey === 'NO_DOC'}
                    />
                  </Form>
                </Stack.Item>
              </Stack>
            </Panel>
            <Panel
              header={
                <h5 className="title">
                  <Translate>Details</Translate>
                </h5>
              }
            >
              <Tabs defaultActiveKey="1" appearance="subtle">
                <Tabs.Tab eventKey="1" title="Demographics">
                  <Form layout="inline" fluid>
                    <MyInput
                      vr={validationResult}
                      column
                      fieldLabel="First Name (Sec. Lang)"
                      fieldName="firstNameOtherLang"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      width={165}
                      column
                      fieldLabel="Second Name (Sec. Lang)"
                      fieldName="secondNameOtherLang"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Third Name (Sec. Lang)"
                      fieldName="thirdNameOtherLang"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Last Name (Sec. Lang)"
                      fieldName="lastNameOtherLang"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Marital Status"
                      fieldType="select"
                      fieldName="maritalStatusLkey"
                      selectData={maritalStatusLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Nationality"
                      fieldType="select"
                      fieldName="nationalityLkey"
                      selectData={nationalityLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Religion"
                      fieldType="select"
                      fieldName="religionLkey"
                      selectData={religeonLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Ethnicity"
                      fieldType="select"
                      fieldName="ethnicityLkey"
                      selectData={ethnicityLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Occupation"
                      fieldType="select"
                      fieldName="occupationLkey"
                      selectData={occupationLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Responsible Party"
                      fieldType="select"
                      fieldName="responsiblePartyLkey"
                      selectData={responsiblePartyLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Educational Level"
                      fieldType="select"
                      fieldName="educationalLevelLkey"
                      selectData={educationalLevelLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Previous ID"
                      fieldName="previousId"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Archiving Number"
                      fieldName="archivingNumber"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                  </Form>
                </Tabs.Tab>
                <Tabs.Tab eventKey="2" title="Contact">
                  <Form layout="inline" fluid>
                    <MyInput
                      vr={validationResult}
                      column
                      required
                      width={165}
                      fieldName="phoneNumber"
                      fieldLabel="Primary Mobile Number"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldType="checkbox"
                      fieldName="receiveSms"
                      fieldLabel="Receive SMS"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Secondary Mobile Number"
                      fieldName="secondaryMobileNumber"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldName="homePhone"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldName="workPhone"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldName="email"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldType="checkbox"
                      fieldName="receiveEmail"
                      fieldLabel="Receive Email"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Preferred Way of Contact"
                      fieldType="select"
                      fieldName="preferredContactLkey"
                      selectData={preferredWayOfContactLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Native Language"
                      fieldType="select"
                      fieldName="primaryLanguageLkey"
                      selectData={primaryLangLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldName="emergencyContactName"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Emergency Contact Relation"
                      fieldType="select"
                      fieldName="emergencyContactRelationLkey"
                      selectData={relationsLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldName="emergencyContactPhone"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Role"
                      fieldType="select"
                      fieldName="roleLkey"
                      selectData={roleLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                  </Form>
                </Tabs.Tab>
                <Tabs.Tab eventKey="3" title="Address">
                  <Form layout="inline" fluid>
                    <ButtonToolbar style={{ zoom: 0.8 }}>
                      <Button
                        style={{
                          backgroundColor: 'var(--primary-blue)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                        disabled={!localPatient.key}
                      >
                        <Icon as={FaClock} /> Address Change Log
                      </Button>
                    </ButtonToolbar>
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Country"
                      fieldType="select"
                      fieldName="countryLkey"
                      selectData={countryLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="State/Province"
                      fieldType="select"
                      fieldName="stateProvinceRegionLkey"
                      selectData={cityLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="City"
                      fieldType="select"
                      fieldName="cityLkey"
                      selectData={cityLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Street Name"
                      fieldName="streetAddressLine1"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="House/Apartment Number"
                      fieldName="apartmentNumber"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Postal/ZIP code"
                      fieldName="postalCode"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Additional Address Line"
                      fieldName="streetAddressLine2"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      width={165}
                      fieldLabel="Country ID"
                      fieldType="text"
                      fieldName="countryId"
                      record={localPatient}
                      setRecord={setLocalPatient}
                      disabled
                    />
                  </Form>
                </Tabs.Tab>

                <Tabs.Tab eventKey="4" title="Insurance">
                  <ButtonToolbar style={{ zoom: 0.8 }}>
                    <Button
                      style={{
                        backgroundColor: 'var(--primary-blue)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                      disabled={!localPatient.key}
                      onClick={() => {
                        setInsuranceModalOpen(true);
                        setSelectedInsurance(newApPatientInsurance);
                      }}
                    >
                      <Icon as={PlusRound} /> New Inusrance
                    </Button>
                    <Button
                      disabled={!selectedInsurance?.key}
                      onClick={handleEditModal}
                      appearance="ghost"
                      style={{
                        border: '1px solid var(--primary-blue)',
                        backgroundColor: 'white',
                        color: 'var(--primary-blue)',
                        marginLeft: '3px'
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faUserPen}
                        style={{ marginRight: '5px', color: 'var(--primary-blue)' }}
                      />
                      <span>Edit</span>
                    </Button>
                    <Button
                      disabled={!selectedInsurance?.key}
                      appearance="primary"
                      style={{ backgroundColor: 'var(--primary-blue)' }}
                      onClick={() => setSpecificCoverageModalOpen(true)}
                    >
                      <FontAwesomeIcon icon={faLock} style={{ marginRight: '8px' }} />
                      <span>Specific Coverage</span>
                    </Button>
                    <Button
                      disabled={!selectedInsurance?.key}
                      style={{
                        border: '1px solid var(--primary-blue)',
                        backgroundColor: 'white',
                        color: 'var(--primary-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      onClick={handleDeleteInsurance}
                    >
                      <TrashIcon /> <Translate>Delete</Translate>
                    </Button>
                  </ButtonToolbar>
                  <InsuranceModal
                    relations={patientRelationsResponse?.object ?? []}
                    editing={selectedInsurance ? selectedInsurance : null}
                    refetchInsurance={patientInsuranceResponse.refetch}
                    patientKey={localPatient ?? localPatient.key}
                    open={InsuranceModalOpen}
                    insuranceBrowsing={insuranceBrowsing}
                    onClose={() => {
                      setInsuranceModalOpen(false);
                      setInsuranceBrowsing(false);
                      setSelectedInsurance(newApAttachment);
                    }}
                  />
                  <SpecificCoverageModa
                    insurance={selectedInsurance?.key}
                    open={specificCoverageModalOpen}
                    onClose={() => {
                      setSpecificCoverageModalOpen(false);
                    }}
                  />
                  <Table
                    height={400}
                    headerHeight={40}
                    rowHeight={50}
                    bordered
                    cellBordered
                    onRowClick={setSelectedInsurance}
                    data={patientInsuranceResponse?.data ?? []}
                  >
                    <Column flexGrow={4}>
                      <HeaderCell>Insurance Provider </HeaderCell>
                      <Cell dataKey="insuranceProvider">
                        {rowData =>
                          rowData.primaryInsurance ? (
                            <div>
                              <Badge color="blue" content={'Primary'}>
                                <p>{rowData.insuranceProvider}</p>
                              </Badge>
                            </div>
                          ) : (
                            <p>{rowData.insuranceProvider}</p>
                          )
                        }
                      </Cell>
                    </Column>
                    <Column flexGrow={4}>
                      <HeaderCell>Insurance Policy Number</HeaderCell>
                      <Cell dataKey="insurancePolicyNumber" />
                    </Column>
                    <Column flexGrow={4}>
                      <HeaderCell>Group Number</HeaderCell>
                      <Cell dataKey="groupNumber" />
                    </Column>
                    <Column flexGrow={4}>
                      <HeaderCell>Insurance Plan Type</HeaderCell>
                      <Cell dataKey="insurancePlanType" />
                    </Column>
                    <Column flexGrow={4}>
                      <HeaderCell>Expiration Date</HeaderCell>
                      <Cell dataKey="expirationDate" />
                    </Column>
                    <Column flexGrow={4}>
                      <HeaderCell>Details</HeaderCell>
                      <Cell>
                        <Button
                          onClick={() => {
                            handleShowInsuranceDetails();
                          }}
                          appearance="subtle"
                        >
                          <FontAwesomeIcon icon={faEllipsis} style={{ marginRight: '8px' }} />
                        </Button>
                      </Cell>
                    </Column>
                  </Table>
                </Tabs.Tab>
                <Tabs.Tab eventKey="5" title="Privacy & Security">
                  <Modal
                    open={verificationModalOpen}
                    onClose={() => setVerificationModalOpen(false)}
                  >
                    <Modal.Header>
                      <Modal.Title>Patient Verification</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <Form fluid>
                        <MyInput
                          width={165}
                          vr={validationResult}
                          fieldLabel="Primary Mobile Number"
                          fieldName="phoneNumber"
                          record={localPatient}
                          setRecord={setLocalPatient}
                          disabled={true}
                        />
                        <MyInput
                          width={165}
                          vr={validationResult}
                          fieldLabel="Code"
                          fieldName="otp"
                          record={verificationRequest}
                          setRecord={setVerificationRequest}
                        />
                      </Form>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        onClick={() => sendOtp(localPatient.key).unwrap()}
                        appearance="subtle"
                      >
                        Send Code
                      </Button>
                      <Divider vertical />
                      <Button
                        onClick={() =>
                          verifyOtp({
                            otp: verificationRequest.otp,
                            patientId: localPatient.key
                          }).unwrap()
                        }
                        disabled={!verificationRequest.otp}
                        appearance="primary"
                      >
                        Verify
                      </Button>
                    </Modal.Footer>
                  </Modal>
                  <Form layout="inline" fluid>
                    <ButtonToolbar style={{ zoom: 0.8 }}>
                      <Button
                        style={{
                          backgroundColor: 'var(--primary-blue)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                        onClick={() => setVerificationModalOpen(true)}
                        disabled={!localPatient.key}
                      >
                        <PlusRound /> Patient Verification
                      </Button>
                      <Button
                        style={{
                          backgroundColor: 'var(--primary-blue)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <Icon as={VscGitPullRequestGoToChanges} /> Amendment Requests
                      </Button>
                    </ButtonToolbar>
                    <MyInput
                      vr={validationResult}
                      column
                      fieldLabel="Security Access Level"
                      fieldType="select"
                      fieldName="securityAccessLevelLkey"
                      selectData={securityAccessLevelLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      fieldLabel="Social Security Number"
                      fieldName="socialSecurityNumber"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <h5 style={{ borderTop: '1px solid #e1e1e1' }}>HIPAA</h5>
                    <MyInput
                      vr={validationResult}
                      fieldType="checkbox"
                      fieldLabel="Notice of Privacy Practices"
                      fieldName="noticeOfPrivacyPractice"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      fieldType="date"
                      fieldLabel=" "
                      fieldName="noticeOfPrivacyPracticeDate"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <br />
                    <MyInput
                      vr={validationResult}
                      fieldType="checkbox"
                      fieldLabel="Privacy Authorization"
                      fieldName="privacyAuthorization"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                    <MyInput
                      vr={validationResult}
                      fieldType="date"
                      fieldLabel=" "
                      fieldName="privacyAuthorizationDate"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                  </Form>
                </Tabs.Tab>
                <Tabs.Tab eventKey="6" title="Consent Forms">
                  <ConsentFormTab patient={localPatient} isClick={!localPatient.key} />
                </Tabs.Tab>
                <Tabs.Tab eventKey="7" title="Preferred Health Professional">
                  <PreferredHealthProfessional patient={localPatient} isClick={!localPatient.key} />
                </Tabs.Tab>
                <Tabs.Tab eventKey="8" title="Family Members">
                  <PatientFamilyMembers localPatient={localPatient} />
                </Tabs.Tab>
                <Tabs.Tab eventKey="9" title="Extra Details">
                  <Form layout="inline" fluid>
                    <MyInput
                      vr={validationResult}
                      column
                      fieldLabel=" Details"
                      fieldType="textarea"
                      fieldName="extraDetails"
                      //  selectDataLabel="Extra Details"
                      record={localPatient}
                      setRecord={setLocalPatient}
                    />
                  </Form>
                  <PatientExtraDetails localPatient={localPatient} />
                </Tabs.Tab>
                <Tabs.Tab eventKey="10" title="Attachments">
                  <PatientAttachment localPatient={localPatient} />
                </Tabs.Tab>
              </Tabs>
            </Panel>
          </Panel>
        </div>
        <div
          style={{
            flex: expand ? '240px' : '56px',
            height: '90vh',
            display: 'flex',
            flexDirection: 'row-reverse'
          }}
        >
          <Sidebar
            style={{ display: 'flex', flexDirection: 'column', height: '90vh' }}
            width={expand ? 300 : 56}
            collapsible
          >
            <Sidenav.Header></Sidenav.Header>
            <Sidenav expanded={expand} appearance="subtle" defaultOpenKeys={['2', '3']}>
              <Sidenav.Body style={navBodyStyle}>
                <Nav>
                  {expand ? (
                    <Panel
                      header="Search Patient"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      {conjurePatientSearchBar(patientSearchTarget)}
                      <br />
                      {patientListResponse?.object?.map(patient => (
                        <>
                          <div
                            style={{
                              display: 'inline-block',
                              width: '250px',
                              border: '1px solid #f0f0f0',
                              borderRadius: '8px',
                              padding: '15px',
                              backgroundColor: 'white'
                            }}
                          >
                            <Row gutter={15}>
                              <Col xs={19}>
                                <Row>
                                  <Avatar
                                    circle
                                    src={
                                      patient?.attachmentProfilePicture?.fileContent
                                        ? `data:${patient?.attachmentProfilePicture?.contentType};base64,${patient?.attachmentProfilePicture?.fileContent}`
                                        : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
                                    }
                                    size="md"
                                  />
                                </Row>
                                <Row>
                                  <span style={{ fontSize: '14x' }}>{patient.fullName} </span>
                                </Row>
                                <Row>
                                  <span style={{ color: 'gray', fontSize: '12x' }}>
                                    {patient.createdAt
                                      ? new Date(patient?.createdAt).toLocaleString('en-GB')
                                      : ''}{' '}
                                  </span>
                                </Row>
                                <Row>
                                  <span style={{ color: 'gray', fontSize: '12px' }}>
                                    {patient.patientMrn}{' '}
                                  </span>
                                </Row>
                              </Col>

                              <Col xs={5}>
                                <Row>
                                  <Button>
                                    <MoreIcon style={{ width: '10px', height: '10px' }} />
                                  </Button>
                                </Row>
                                <br />

                                <br />
                                <br />
                                <Row>
                                  <Button
                                    appearance="ghost"
                                    style={{
                                      color: 'var(--primary-blue)',
                                      border: '1px solid  var(--primary-blue)'
                                    }}
                                    onClick={() => setLocalPatient(patient)}
                                  >
                                    <ArrowLeftLineIcon style={{ width: '10px', height: '10px' }} />
                                  </Button>
                                </Row>
                              </Col>
                            </Row>
                          </div>

                          <br />
                        </>
                      ))}
                    </Panel>
                  ) : (
                    <Button
                      onClick={() => {
                        setExpand(true);
                      }}
                    >
                      <SearchPeopleIcon
                        style={{
                          width: '30px',
                          height: '30px',
                          background: 'none',
                          backgroundColor: 'transparent'
                        }}
                      />{' '}
                    </Button>
                  )}
                </Nav>
              </Sidenav.Body>
            </Sidenav>
            <ArrowLineToggle expand={expand} onChange={() => setExpand(false)} />
          </Sidebar>
        </div>
      </div>

      {quickAppointmentModel ? (
        <PatientQuickAppointment
          quickAppointmentModel={quickAppointmentModel}
          localPatient={localPatient}
          setQuickAppointmentModel={setQuickAppointmentModel}
          localVisit={localVisit}
        />
      ) : (
        <></>
      )}
      {visitHistoryModel ? (
        <PatientVisitHistory
          visitHistoryModel={visitHistoryModel}
          quickAppointmentModel={quickAppointmentModel}
          localPatient={localPatient}
          setVisitHistoryModel={setVisitHistoryModel}
          setQuickAppointmentModel={setQuickAppointmentModel}
        />
      ) : (
        <></>
      )}
    </Panel>
  );
};

export default PatientProfileCopy;
