import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import {
  ApAttachment,
  ApPatient,
  ApPatientRelation,
  ApPatientSecondaryDocuments,
  ApPatientAdministrativeWarnings
} from '@/types/model-types';
import RemindOutlineIcon from '@rsuite/icons/RemindOutline';
import CloseIcon from '@rsuite/icons/Close';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import TrashIcon from '@rsuite/icons/Trash';
import DetailIcon from '@rsuite/icons/Detail';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector } from 'react-redux';
import QuickPatient from './quickPatient';
import * as icons from '@rsuite/icons';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import CheckOutlineIcon from '@rsuite/icons/CheckOutline';
import InsuranceModal from './InsuranceModal';

import SpecificCoverageModa from './SpecificCoverageModa';
import ReloadIcon from '@rsuite/icons/Reload';

import { saveAs } from 'file-saver';
import {
  newApAttachment,
  newApPatient,
  newApPatientInsurance,
  newApPatientRelation,
  newApPatientSecondaryDocuments,
  newApPatientAdministrativeWarnings
} from '@/types/model-types-constructor';
import { Block, Check, DocPass, Edit, History, Icon, PlusRound, Detail } from '@rsuite/icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  InputGroup,
  ButtonToolbar,
  Form,
  IconButton,
  Input,
  Panel,
  Stack,
  Divider,
  Drawer,
  Table,
  Pagination,
  Button,
  Modal,
  Whisper,
  Tooltip,
  SelectPicker,
  Badge
} from 'rsuite';

const { Column, HeaderCell, Cell } = Table;
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import SearchIcon from '@rsuite/icons/Search';
import PageIcon from '@rsuite/icons/Page';
import PieChartIcon from '@rsuite/icons/PieChart';
import FileUploadIcon from '@rsuite/icons/FileUpload';
import { RootState } from '@/store';

import { initialListRequest, ListRequest } from '@/types/types';
import {
  useGetPatientRelationsQuery,
  useGetPatientsQuery,
  useSavePatientMutation,
  useSavePatientRelationMutation,
  useSendVerificationOtpMutation,
  useVerifyVerificationOtpMutation,
  useGetPatientAllergiesViewQuery,
  useGetPatientSecondaryDocumentsQuery,
  useSaveNewSecondaryDocumentMutation,
  useGetPatientInsuranceQuery,
  useDeletePatientInsuranceMutation,
  useDeletePatientRelationMutation,
  useDeletePatientSecondaryDocumentMutation,
  useSavePatientAdministrativeWarningsMutation,
  useGetPatientAdministrativeWarningsQuery,
  useUpdatePatientAdministrativeWarningsMutation,
  useDeletePatientAdministrativeWarningsMutation
} from '@/services/patientService';
import { FaClock, FaPencil, FaPlus, FaQuestion } from 'react-icons/fa6';
import { VscGitPullRequestGoToChanges } from 'react-icons/vsc';
import { VscUnverified } from 'react-icons/vsc';
import { VscVerified } from 'react-icons/vsc';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { useNavigate } from 'react-router-dom';
import { useGetEncountersQuery } from '@/services/encounterService';
import {
  useFetchAttachmentQuery,
  useFetchAttachmentLightQuery,
  useFetchAttachmentByKeyQuery,
  useUploadMutation,
  useDeleteAttachmentMutation,
  useUpdateAttachmentDetailsMutation
} from '@/services/attachmentService';
import { notify } from '@/utils/uiReducerActions';

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

const PatientProfile = () => {
  const patientSlice = useAppSelector(state => state.patient);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
  const [editing, setEditing] = useState(false);
  const [searchResultVisible, setSearchResultVisible] = useState(false);
  const [patientSearchTarget, setPatientSearchTarget] = useState('primary'); // primary, relation, etc..
  const [patientAttachments, setPatientAttachments] = useState([]);
  const [selectedCriterion, setSelectedCriterion] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [deleteDocModalOpen, setDeleteDocModalOpen] = useState(false);
  const [deleteRelativeModalOpen, setDeleteRelativeModalOpen] = useState(false);
  const [selectedAttachType, setSelectedAttachType] = useState('');
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
  //Administrative Warning
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
  const patientKey = localPatient?.key?.toString();
  const { data: warnings, refetch: warningsRefetch } = useGetPatientAdministrativeWarningsQuery(
    warningsAdmistritiveListRequest
  );

  const patientSecondaryDocumentsResponse = useGetPatientSecondaryDocumentsQuery(
    { key: localPatient?.key },
    { skip: !localPatient?.key }
  );

  useEffect(() => {
    console.log(patientSecondaryDocumentsResponse);
  }, [patientSecondaryDocumentsResponse]);

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
  console.log('localPatient.key', localPatient.key);
  const handleSaveSecondaryDocument = () => {
    saveSecondaryDocument({
      ...secondaryDocument,
      patientKey: localPatient.key,
      documentNo:
        secondaryDocument.documentTypeLkey === 'NO_DOC'
          ? 'No Document '
          : secondaryDocument.documentNo

    })
      .unwrap()
      .then(() => {
        dispatch(notify('Document Added Successfully'));
        patientSecondaryDocumentsResponse.refetch();
        handleCleareSecondaryDocument();
      });
    const handleCleareSecondaryDocument = () => {
      setSecondaryDocumentModalOpen(false);
      setSecondaryDocument(newApPatientSecondaryDocuments);
    };


  };

  const [selectedPatientRelation, setSelectedPatientRelation] = useState<any>({
    ...newApPatientRelation
  });
  const [selectedPatientAdministrativeWarnings, setSelectedPatientAdministrativeWarnings] =
    useState<any>({
      ...newApPatientAdministrativeWarnings
    });
  console.log(selectedPatientAdministrativeWarnings);
  const [selectedSecondaryDocument, setSelectedSecondaryDocument] = useState<any>({
    ...newApPatientSecondaryDocuments
  });

  const [requestedPatientAttacment, setRequestedPatientAttacment] = useState();
  const [selectedPatientAttacment, setSelectedPatientAttacment] = useState<any>({
    ...newApPatientInsurance
  });

  const [patientAllergies, setPatientAllergies] = useState();

  const [savePatientRelation, savePatientRelationMutation] = useSavePatientRelationMutation();
  const [relationModalOpen, setRelationModalOpen] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [administrativeWarningsModalOpen, setAdministrativeWarningsModalOpen] = useState(false);
  const [secondaryDocumentModalOpen, setSecondaryDocumentModalOpen] = useState(false);

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
  const { data: categoryLovQueryResponse } = useGetLovValuesByCodeQuery('FAMILY_MMBR_CAT');
  const { data: attachmentsLovQueryResponse } = useGetLovValuesByCodeQuery('ATTACH_TYPE');
  const { data: administrativeWarningsLovQueryResponse } =
    useGetLovValuesByCodeQuery('ADMIN_WARNINGS');

  const [attachmentType, setAttachmnetType] = useState();

  const { data: preferredWayOfContactLovQueryResponse } =
    useGetLovValuesByCodeQuery('PREF_WAY_OF_CONTACT');
  const { data: patientClassLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_CLASS');
  const { data: educationalLevelLovQueryResponse } = useGetLovValuesByCodeQuery('EDU_LEVEL');
  const { data: responsiblePartyLovQueryResponse } = useGetLovValuesByCodeQuery('RESP_PARTY');
  const { data: securityAccessLevelLovQueryResponse } =
    useGetLovValuesByCodeQuery('SEC_ACCESS_LEVEL');

  const [savePatient, savePatientMutation] = useSavePatientMutation();
  const [saveSecondaryDocument, setSaveSecondaryDocument] = useSaveNewSecondaryDocumentMutation();
  const [savePatientAdministrativeWarnings, setSavePatientAdministrativeWarnings] =
    useSavePatientAdministrativeWarningsMutation();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [updatePatientAdministrativeWarnings, setUpdatePatientAdministrativeWarnings] =
    useUpdatePatientAdministrativeWarningsMutation();
  const [deletePatientAdministrativeWarnings, setDeletePatientAdministrativeWarnings] =
    useDeletePatientAdministrativeWarningsMutation();
  const [sendOtp, sendOtpMutation] = useSendVerificationOtpMutation();
  const [verifyOtp, verifyOtpMutation] = useVerifyVerificationOtpMutation();
  const [upload, uploadMutation] = useUploadMutation();
  const [deleteAttachment, deleteAttachmentMutation] = useDeleteAttachmentMutation();
  const [deleteInsurance, deleteInsuranceMutation] = useDeletePatientInsuranceMutation();
  const [deleteSecondaryDocument, deleteSecondaryDocumentMutation] =
    useDeletePatientSecondaryDocumentMutation();

  const [deleteRelation, deleteRelationMutation] = useDeletePatientRelationMutation();

  const [Update, UpdateMutation] = useUpdateAttachmentDetailsMutation();
  const [validationResult, setValidationResult] = useState({});
  const profileImageFileInputRef = useRef(null);
  const attachmentFileInputRef = useRef(null);

  const [encounterHistoryModalOpen, setEncounterHistoryModalOpen] = useState(false);
  const [InsuranceModalOpen, setInsuranceModalOpen] = useState(false);

  const [selectedInsurance, setSelectedInsurance] = useState();
  const [insuranceBrowsing, setInsuranceBrowsing] = useState(false);
  //Administrative Details
  const [administrativeWarningDetails, setAdministrativeWarningDetails] = useState('');

  const handleShowInsuranceDetails = () => {
    setInsuranceModalOpen(true);
    setInsuranceBrowsing(true);
  };

  const [encounterHistoryListRequest, setEncounterHistoryListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 50,
    sortBy: 'plannedStartDate',
    sortType: 'desc',
    ignore: true
  });

  const encounterHistoryResponse = useGetEncountersQuery(encounterHistoryListRequest);
  const fetchPatientImageResponse = useFetchAttachmentQuery(
    {
      type: 'PATIENT_PROFILE_PICTURE',
      refKey: localPatient.key,
    },
    { skip: !localPatient.key }
  );

  const handleSelectPatient = data => {
    if (patientSearchTarget === 'primary') {
      // selecteing primary patient (localPatient)
      setLocalPatient(data);
      // dispatch(setPatient(data));
    } else if (patientSearchTarget === 'relation') {
      // selecting patient for relation patient key
      setSelectedPatientRelation({
        ...selectedPatientRelation,
        relativePatientKey: data.key,
        relativePatientObject: data
      });
    }
    refetchPatients({ ...listRequest, clearResults: true });
    setSearchResultVisible(false);
  };

  const {
    data: patientAllergiesViewResponse,
    error: allergiesError,
    isLoading: isLoadingAllergies,
    isSuccess: isSuccessAllergies
  } = useGetPatientAllergiesViewQuery({ key: localPatient?.key }, { skip: !localPatient?.key });

  const patientInsuranceResponse = useGetPatientInsuranceQuery({
    patientKey: localPatient.key
  });

  useEffect(() => {
    console.log(encounterHistoryResponse);
  }, [encounterHistoryResponse]);

  useEffect(() => {
    console.log(secondaryDocument);
    console.log(selectedSecondaryDocument);
    if (selectedSecondaryDocument) {
      setSecondaryDocument(selectedSecondaryDocument);
    }
  }, [selectedSecondaryDocument]);

  useEffect(() => {
    if (isSuccessAllergies && patientAllergiesViewResponse) {
      setPatientAllergies(patientAllergiesViewResponse.object);
    }
  }, [
    localPatient,
    isLoadingAllergies,
    allergiesError,
    isSuccessAllergies,
    patientAllergiesViewResponse
  ]);

  const [skipQuery, setSkipQuery] = useState(true);
  const [actionType, setActionType] = useState(null); // 'view' or 'download'
  const [visit, setVisit] = useState();
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
  useEffect(() => {
    console.log(visit);
  }, [visit]);

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

  const handleDownloadSelectedPatientAttachment = attachmentKey => {
    setRequestedPatientAttacment(attachmentKey);
    setActionType('download');
  };

  const handleAttachmentSelected = attachmentKey => {
    setRequestedPatientAttacment(attachmentKey);
    setActionType('view');
  };


  const handleCleareSecondaryDocument = () => {
    setSecondaryDocumentModalOpen(false);
  };

  useEffect(() => {
    console.log('Requested Patient Attacment Data:', requestedPatientAttacment);
  }, [requestedPatientAttacment]);

  useEffect(() => {
    if (isSuccess && fetchAttachmentByKeyResponce) {
      if (actionType === 'download') {
        handleDownload(fetchAttachmentByKeyResponce);
      } else if (actionType === 'view') {
        setAttachmentsModalOpen(true);
        setSelectedPatientAttacment(fetchAttachmentByKeyResponce);
        setNewAttachmentDetails(fetchAttachmentByKeyResponce.extraDetails);
      }
    }
  }, [requestedPatientAttacment, fetchAttachmentByKeyResponce, actionType]);

  const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationRequest, setVerificationRequest] = useState({
    otp: ''
  });

  const { data: fetchPatintAttachmentsResponce, refetch: attachmentRefetch } =
    useFetchAttachmentLightQuery({ refKey: localPatient?.key }, { skip: !localPatient?.key });

  useEffect(() => {
    if (patientSlice.patient) {
      setLocalPatient(patientSlice.patient);

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
    if (patientSlice.patient) {
      setLocalPatient(patientSlice.patient);
    }
  }, [patientSlice]);
  const isSelected = rowData => {
    if (
      rowData &&
      selectedPatientAdministrativeWarnings &&
      rowData.key === selectedPatientAdministrativeWarnings.key
    ) {
      return 'selected-row';
    } else return '';
  };
  useEffect(() => {
    if (fetchPatintAttachmentsResponce)
      if (fetchPatintAttachmentsResponce && localPatient.key) {
        setPatientAttachments(fetchPatintAttachmentsResponce);
      } else {
        setPatientAttachments(undefined);
      }

    console.log({ 'patient attatchments': fetchPatintAttachmentsResponce });
  }, [fetchPatintAttachmentsResponce]);

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

  const handleImageClick = type => {
    setNewAttachmentType(type); // PATIENT_PROFILE_ATTACHMENT or PATIENT_PROFILE_PICTURE

    if (patientSlice.patient && editing) profileImageFileInputRef.current.click();
  };

  const handleAttachmentFileUploadClick = type => {
    setNewAttachmentType(type); // PATIENT_PROFILE_ATTACHMENT or PATIENT_PROFILE_PICTURE
    if (patientSlice.patient && attachmentsModalOpen) attachmentFileInputRef.current.click();
  };

  useEffect(() => {
    if (uploadMutation.status === 'fulfilled') {
      dispatch(notify('patient image uploaded'));
      if (!attachmentsModalOpen) setPatientImage(uploadMutation.data);
    }
  }, [uploadMutation]);

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
          accessType: ''
        })
          .unwrap()
          .then(() => attachmentRefetch());
      }
    }
  };

  const [secondaryDocument, setSecondaryDocument] = useState(newApPatientSecondaryDocuments);
  useEffect(() => {
    console.log({ SecondaryDocument: secondaryDocument });
  }, [secondaryDocument]);
  const [selectedRowId, setSelectedRowId] = useState(null);

  const [newAttachmentSrc, setNewAttachmentSrc] = useState(null);
  const [newAttachmentType, setNewAttachmentType] = useState();
  const [newAttachmentDetails, setNewAttachmentDetails] = useState('');
  const [uploadedAttachmentOpject, setUploadedAttachmentOpject] = useState({
    formData: null,
    type: null,
    refKey: null,

  });

  const handleFileUpload = async event => {
    if (!patientSlice.patient) return;

    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      if (attachmentsModalOpen) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewAttachmentSrc(reader.result);
        };
        reader.readAsDataURL(selectedFile);

        setUploadedAttachmentOpject({
          formData: formData,
          type: newAttachmentType,
          refKey: localPatient.key
        });
      }
    }
  };
  const handleFinishUploading = () => {
    setUploadedAttachmentOpject({
      formData: null,
      type: null,
      refKey: null
    });
    setNewAttachmentSrc(null);
    setNewAttachmentType(null);
    setNewAttachmentDetails('');
    setAttachmentsModalOpen(false);
    attachmentRefetch();
    setSelectedPatientAttacment(null);
    handleAttachmentSelected(null);
    setActionType(null);
    setSelectedAttachType(null);
  };
  useEffect(() => {
    dispatch(setPatient({ ...newApPatient }));
  }, []);
  const enableEdit = () => {
    setEditing(true);
    setValidationResult(undefined);
  };
  console.log(secondaryDocument.documentTypeLkey);
  const startRegistration = () => {
    setEditing(true);
    setValidationResult(undefined);
  };

  const handleSave = () => {
    // save changes
    savePatient({ ...localPatient, incompletePatient: false, unknownPatient: false }).unwrap().then(() => {
      dispatch(notify('Patient Added Successfully'));
    });
  };

  const handleDeleteSecondaryDocument = () => {
    deleteSecondaryDocument({
      key: selectedSecondaryDocument.key
    }).then(
      () => (
        patientSecondaryDocumentsResponse.refetch(),
        dispatch(notify('Secondary Document Deleted')),
        setSelectedInsurance(null),
        setDeleteDocModalOpen(false)
      )
    );
  };
  const handleDeleteAttachment = (attachment) => {
    setSelectedAttachment(attachment);
    setDeleteModalOpen(true);
  };
  console.log('uploadedAttachmentOpject', uploadedAttachmentOpject);
  const handleDeleteRelation = () => {
    console.log('required to delete relation' + selectedPatientRelation.key);

    deleteRelation({
      key: selectedPatientRelation.key
    }).then(
      () => (
        patientRelationsRefetch(),
        dispatch(notify('Relation Deleted')),
        setSelectedPatientRelation(newApPatientRelation),
        setDeleteRelativeModalOpen(false)
      )
    );
  };
  console.log(selectedPatientAdministrativeWarnings);

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

  console.log(selectedPatientAdministrativeWarnings);
  const handleDeletePatientAdministrativeWarnings = () => {
    deletePatientAdministrativeWarnings({
      ...selectedPatientAdministrativeWarnings
    })
      .unwrap()
      .then(() => {
        console.log(selectedPatientAdministrativeWarnings);

        warningsRefetch();
        dispatch(notify('Deleted Successfly '));
        setSelectedPatientAdministrativeWarnings({ ...newApPatientAdministrativeWarnings });
      });
  };
  const handleUpdateAttachmentDetails = () => {
    Update({
      key: selectedPatientAttacment.key,
      attachmentDetails: newAttachmentDetails
    })
      .unwrap()
      .then(() => handleFinishUploading());
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
      districtLkey: null,
    });
    setEditing(false);
    setValidationResult(undefined);
    dispatch(setPatient(null));
    dispatch(setEncounter(null));
    setPatientImage(undefined);
    setSelectedPatientAttacment(null);
    setRequestedPatientAttacment(null);
    setPatientAttachments([]);
    setActionType(null);
    setPatientAllergies(null);
    setSelectedCriterion('');
  };

  useEffect(() => {
    if (savePatientMutation && savePatientMutation.status === 'fulfilled') {
      setLocalPatient(savePatientMutation.data);
      dispatch(setPatient(savePatientMutation.data));
      setEditing(false);
      setValidationResult(undefined);
    } else if (savePatientMutation && savePatientMutation.status === 'rejected') {
      setValidationResult(savePatientMutation.error.data.validationResult);
    }
  }, [savePatientMutation]);

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
  const handleClearAttachmentDelete = () => {
    setDeleteModalOpen(false);
    handleCleareAttachment();

  };
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };
  const handleClearDocument = () => {
    setSecondaryDocumentModalOpen(false);
    setSecondaryDocument(newApPatientSecondaryDocuments);
    setDeleteDocModalOpen(false);

  };
  const handleClearRelative = () => {
    setSelectedPatientRelation(newApPatientRelation);
    setDeleteRelativeModalOpen(false);

  }
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
        ...warningsAdmistritiveListRequest, filters: [
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



  useEffect(() => {
    setSearchKeyword('');

  }, [selectedCriterion]);

  const conjurePatientSearchBar = target => {
    return (
      <Panel>
        <ButtonToolbar>
          <SelectPicker
            label="Search Criteria"
            data={searchCriteriaOptions}
            onChange={e => {
              setSelectedCriterion(e);
            }}
            style={{ width: 250 }}
          />

          <InputGroup inside style={{ width: '350px', direction: 'ltr' }}>
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
    navigate('/encounter-registration');
  };

  const handleEncounterHistory = () => {
    if (patientSlice.patient) {
      setEncounterHistoryListRequest(
        addFilterToListRequest('patient_key', 'containsIgnoreCase', patientSlice.patient.key, {
          ...encounterHistoryListRequest,
          ignore: false
        })
      );
      setEncounterHistoryModalOpen(true);
    }
  };
  const handleCleareAttachment = () => {
    setAttachmentsModalOpen(false);
    setRequestedPatientAttacment(null);
    setRequestedPatientAttacment(null);
    setNewAttachmentSrc(null);
    setNewAttachmentType(null);
    setNewAttachmentDetails('');
    attachmentRefetch();
    setSelectedPatientAttacment(null);
    handleAttachmentSelected(null);
    setActionType(null);
  };
  const handleEditModal = () => {
    if (selectedInsurance) {
      setInsuranceModalOpen(true);
    }
  };

  const handleEditSecondaryDocument = () => {
    if (selectedSecondaryDocument) {
      setSecondaryDocumentModalOpen(true);
    }
  };



  const [quickPatientModalOpen, setQuickPatientModalOpen] = useState(false);
  const [specificCoverageModalOpen, setSpecificCoverageModalOpen] = useState(false);
  useEffect(() => {
    if (isSuccess && fetchAttachmentByKeyResponce) {
      if (actionType === 'download') {
        handleDownload(fetchAttachmentByKeyResponce);
      } else if (actionType === 'view') {
        setAttachmentsModalOpen(true);
        setSelectedPatientAttacment(fetchAttachmentByKeyResponce);
        setNewAttachmentDetails(fetchAttachmentByKeyResponce.extraDetails);
        setSelectedAttachType(fetchAttachmentByKeyResponce.accessTypeLkey);
      }
    }
  }, [fetchAttachmentByKeyResponce, actionType]);









  return (
    <>
      <Panel
        header={
          <h3 className="title">
            <Translate>Patient Profile</Translate>
          </h3>
        }
      >
        <Panel bordered>
          <ButtonToolbar>
            {conjurePatientSearchBar('primary')}
            <Divider vertical />
            <IconButton
              color="violet"
              appearance="primary"
              icon={<PlusRound />}
              disabled={editing || localPatient.key !== undefined}
              onClick={startRegistration}
            >
              <Translate>New Patient</Translate>
            </IconButton>

            <div>
              <Button
                appearance="ghost"
                style={{ border: '1px solid rgb(130, 95, 196)', color: 'rgb(130, 95, 196)' }}
                disabled={editing || localPatient.key !== undefined}
                onClick={() => setQuickPatientModalOpen(true)}
              >
                <FontAwesomeIcon icon={faBolt} style={{ marginRight: '8px' }} />
                <span>Quick Patient</span>
              </Button>

              <QuickPatient
                open={quickPatientModalOpen}
                localPatientData={localPatient}
                onClose={() => setQuickPatientModalOpen(false)}
              />
            </div>

            <IconButton
              disabled={editing || !localPatient.key}
              appearance="primary"
              color="cyan"
              icon={<Edit />}
              onClick={enableEdit}
            >
              <Translate>Edit</Translate>
            </IconButton>

            <IconButton
              appearance="primary"
              color="violet"
              disabled={!editing}
              icon={<Check />}
              onClick={handleSave}
            >
              <Translate>Save</Translate>
            </IconButton>

            <IconButton appearance="primary" color="blue" icon={<Block />} onClick={handleClear}>
              <Translate>Clear</Translate>
            </IconButton>

            <Divider vertical />

            <IconButton
              appearance="primary"
              color="cyan"
              disabled={editing || !localPatient.key}
              icon={<PageIcon />}
              onClick={handleNewVisit}
            >
              <Translate>Quick Appointment</Translate>
            </IconButton>

            <IconButton
              appearance="ghost"
              color="cyan"
              disabled={editing || localPatient.key === undefined}
              icon={<History />}
              onClick={handleEncounterHistory}
            >
              <Translate>Visit History</Translate>
            </IconButton>
            <IconButton
              onClick={() => {
                setAdministrativeWarningsModalOpen(true);
              }}
              disabled={editing || !localPatient.key}
              appearance="primary"
              color="orange"
              icon={<icons.Danger />}
            >
              <Translate>Administrative Warnings</Translate>
            </IconButton>

            {/* <IconButton
              appearance="primary"
              color="yellow"
              disabled={editing || !localPatient.key}
              icon={<PieChartIcon />}
              onClick={() => {
                navigate('/patient-chart');
              }}
            >
              <Translate>Patient Chart</Translate>
            </IconButton> */}
          </ButtonToolbar>
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
                    <Input onChange={e => handleFilterChangeInWarning('resolutionUndoDate', e)} />
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
                            background: "transparent",
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
        <br />

        <Panel
          bordered
          header={
            <h5 className="title">
              <Translate>Basic Information</Translate>
            </h5>
          }
        >
          <Stack>
            <Stack.Item grow={1}>
              <div
                style={{
                  borderRadius: '5px',
                  border: '1px solid #e1e1e1',
                  margin: '2px',
                  position: 'relative',
                  bottom: 0,
                  width: 130
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
                        fontSize: 30,
                        position: 'absolute',
                        left: '2%',
                        top: '-3%'
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
                    style={{ marginTop: '50px' }}
                    placement="bottom"
                    controlId="control-id-click"
                    trigger="hover"
                    speaker={
                      <Tooltip>
                        {localPatient.incompletePatient ? 'incomplete Patient' : 'complete Patient'}
                      </Tooltip>
                    }
                  >
                    <div
                      style={{
                        fontSize: 30,
                        position: 'absolute',
                        left: '2%',
                        marginTop: '30px'
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

                <input
                  type="file"
                  ref={profileImageFileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept="image/*"
                />
                <img
                  width={130}
                  height={130}
                  onClick={() => handleImageClick('PATIENT_PROFILE_PICTURE')}
                  src={
                    patientImage && patientImage.fileContent
                      ? `data:${patientImage.contentType};base64,${patientImage.fileContent}`
                      : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
                  }
                />
              </div>
              <Form layout="inline" fluid>
                <MyInput
                  width={165}
                  vr={validationResult}
                  column
                  fieldLabel="MRN"
                  fieldName="patientMrn"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled
                />
              </Form>
            </Stack.Item>
            <Stack.Item grow={15}>
              <Form layout="inline" fluid>
                <MyInput
                  required
                  width={165}
                  vr={validationResult}
                  column
                  fieldName="firstName"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  required
                  width={165}
                  vr={validationResult}
                  column
                  fieldName="secondName"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  width={165}
                  vr={validationResult}
                  column
                  fieldName="thirdName"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  required
                  width={165}
                  vr={validationResult}
                  column
                  fieldName="lastName"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  width={400}
                  vr={validationResult}
                  column
                  fieldName="fullName"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={true}
                />
                <br />
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
                  disabled={!editing}
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
                  disabled={!editing}
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
                  disabled={!editing}
                />
                <MyInput
                  width={165}
                  vr={validationResult}
                  column
                  fieldLabel="Private Patient"
                  fieldType="checkbox"
                  fieldName="privatePatient"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
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

                <br />

                <MyInput
                  required
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
                  disabled={!editing}
                />
                <MyInput
                  required
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
                  disabled={!editing}
                />
                <MyInput
                  required
                  vr={validationResult}
                  column
                  fieldLabel="Document Number"
                  fieldName="documentNo"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing || localPatient.documentTypeLkey === 'NO_DOC'}
                />

                <IconButton
                  appearance="primary"
                  color="cyan"
                  style={{ top: 30 }}
                  icon={<Detail />}
                  disabled={localPatient.key === undefined}
                  onClick={startRegistration}
                >
                  <Translate>Validate Document</Translate>
                </IconButton>
              </Form>
            </Stack.Item>
          </Stack>
        </Panel>
        <br />
        <Panel
          bordered
          header={
            <h5 className="title">
              <Translate>Details</Translate>
            </h5>
          }
        >
          <Tabs>
            <TabList>
              <Tab>
                <Translate>Demographics</Translate>
              </Tab>
              <Tab>
                <Translate>Contact</Translate>
              </Tab>
              <Tab>
                <Translate>Address</Translate>
              </Tab>
              <Tab>
                <Translate>Insurance</Translate>
              </Tab>
              {/* <Tab>
                <Translate>Allergies</Translate>
              </Tab> */}
              <Tab>
                <Translate>Privacy & Security</Translate>
              </Tab>
              <Tab>
                <Translate>Family Members</Translate>
              </Tab>
              <Tab>
                <Translate>Extra Details</Translate>
              </Tab>
              <Tab>
                <Translate>Attachments</Translate>
              </Tab>
              <Tab>
                <Translate>Follow Up & Activites</Translate>
              </Tab>
            </TabList>

            {/* Demopgraphics */}
            <TabPanel>
              <Form layout="inline" fluid>
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="First Name (Sec. Lang)"
                  fieldName="firstNameOtherLang"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Second Name (Sec. Lang)"
                  fieldName="secondNameOtherLang"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Third Name (Sec. Lang)"
                  fieldName="thirdNameOtherLang"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Last Name (Sec. Lang)"
                  fieldName="lastNameOtherLang"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Marital Status"
                  fieldType="select"
                  fieldName="maritalStatusLkey"
                  selectData={maritalStatusLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Nationality"
                  fieldType="select"
                  fieldName="nationalityLkey"
                  selectData={nationalityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Religion"
                  fieldType="select"
                  fieldName="religionLkey"
                  selectData={religeonLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Ethnicity"
                  fieldType="select"
                  fieldName="ethnicityLkey"
                  selectData={ethnicityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Occupation"
                  fieldType="select"
                  fieldName="occupationLkey"
                  selectData={occupationLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Responsible Party"
                  fieldType="select"
                  fieldName="responsiblePartyLkey"
                  selectData={responsiblePartyLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Educational Level"
                  fieldType="select"
                  fieldName="educationalLevelLkey"
                  selectData={educationalLevelLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Previous ID"
                  fieldName="previousId"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Archiving Number"
                  fieldName="archivingNumber"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
              </Form>
            </TabPanel>

            {/* Contact */}
            <TabPanel>
              <Form layout="inline" fluid>
                <MyInput
                  vr={validationResult}
                  column
                  required
                  fieldName="phoneNumber"
                  fieldLabel="Primary Mobile Number"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldType="checkbox"
                  fieldName="receiveSms"
                  fieldLabel="Receive SMS"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Secondary Mobile Number"
                  fieldName="secondaryMobileNumber"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldName="homePhone"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldName="workPhone"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldName="email"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldType="checkbox"
                  fieldName="receiveEmail"
                  fieldLabel="Receive Email Correspondence"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Preferred Way of Contact"
                  fieldType="select"
                  fieldName="preferredContactLkey"
                  selectData={preferredWayOfContactLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Preferred Language"
                  fieldType="select"
                  fieldName="primaryLanguageLkey"
                  selectData={primaryLangLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <br />
                <MyInput
                  vr={validationResult}
                  column
                  fieldName="emergencyContactName"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Emergency Contact Relation"
                  fieldType="select"
                  fieldName="emergencyContactRelationLkey"
                  selectData={relationsLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldName="emergencyContactPhone"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
              </Form>
            </TabPanel>

            {/* Address */}
            <TabPanel>
              <Form layout="inline" fluid>
                <ButtonToolbar>
                  <IconButton icon={<Icon as={FaClock} />} appearance="primary" disabled={!editing || !localPatient.key}>
                    Address Change Log
                  </IconButton>
                </ButtonToolbar>
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Country"
                  fieldType="select"
                  fieldName="countryLkey"
                  selectData={countryLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="State/Province"
                  fieldType="select"
                  fieldName="stateProvinceRegionLkey"
                  selectData={cityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="City"
                  fieldType="select"
                  fieldName="cityLkey"
                  selectData={cityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="District"
                  fieldType="select"
                  fieldName="districtLkey"
                  selectData={cityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Street Name"
                  fieldName="streetAddressLine1"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="House/Apartment Number"
                  fieldName="apartmentNumber"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={true}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Postal/ZIP code"
                  fieldName="postalCode"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />

                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Additional Address Line"
                  fieldName="streetAddressLine2"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
              </Form>
            </TabPanel>

            {/* Inusrance */}
            <TabPanel>
              <ButtonToolbar>
                <IconButton
                  appearance="primary"
                  color="cyan"
                  icon={<PlusRound />}
                  disabled={!editing || !localPatient.key}
                  onClick={() => {
                    setInsuranceModalOpen(true);
                    setSelectedInsurance(newApPatientInsurance);
                  }}
                >
                  <Translate>New Inusrance</Translate>
                </IconButton>

                <IconButton
                  disabled={!selectedInsurance?.key}
                  appearance="primary"
                  color="cyan"
                  icon={<Edit />}
                  onClick={handleEditModal}
                >
                  <Translate>Edit</Translate>
                </IconButton>

                <IconButton
                  disabled={!selectedInsurance?.key}
                  appearance="primary"
                  color="blue"
                  icon={<TrashIcon />}
                  onClick={handleDeleteInsurance}
                >
                  <Translate>Delete</Translate>
                </IconButton>

                <Button
                  disabled={!selectedInsurance?.key}
                  appearance="primary"
                  style={{ backgroundColor: '#8034ff' }}
                  onClick={() => setSpecificCoverageModalOpen(true)}
                >
                  <FontAwesomeIcon icon={faLock} style={{ marginRight: '8px' }} />
                  <span>Specific Coverage</span>
                </Button>
              </ButtonToolbar>
              <br />
              <br />

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
            </TabPanel>

            {/* Allergies */}
            {/* <TabPanel>
              <Table
                height={600}
                sortColumn={patientRelationListRequest.sortBy}
                sortType={patientRelationListRequest.sortType}
                onSortColumn={(sortBy, sortType) => {
                  if (sortBy)
                    setPatientRelationListRequest({
                      ...patientRelationListRequest,
                      sortBy,
                      sortType
                    });
                }}
                headerHeight={40}
                rowHeight={50}
                bordered
                cellBordered
                data={patientAllergies ?? []}
              >
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Allergen Code</Translate>
                  </HeaderCell>
                  <Cell dataKey="allergenCode" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Allergen Name</Translate>
                  </HeaderCell>
                  <Cell dataKey="allergenName" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Allergen Type</Translate>
                  </HeaderCell>
                  <Cell dataKey="allergenType" />
                </Column>
              </Table>
            </TabPanel> */}

            {/* Privacy & Security */}
            <TabPanel>
              <Modal open={verificationModalOpen} onClose={() => setVerificationModalOpen(false)}>
                <Modal.Header>
                  <Modal.Title>Patient Verification</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form fluid>
                    <MyInput
                      vr={validationResult}
                      fieldLabel="Primary Mobile Number"
                      fieldName="phoneNumber"
                      record={localPatient}
                      setRecord={setLocalPatient}
                      disabled={true}
                    />
                    <MyInput
                      vr={validationResult}
                      fieldLabel="Code"
                      fieldName="otp"
                      record={verificationRequest}
                      setRecord={setVerificationRequest}
                    />
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button onClick={() => sendOtp(localPatient.key).unwrap()} appearance="subtle">
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
                <ButtonToolbar>
                  <IconButton
                    icon={<Icon as={FaQuestion} />}
                    onClick={() => setVerificationModalOpen(true)}
                    appearance="primary"
                    disabled={!editing || !localPatient.key}
                  >
                    <Translate>Patient Verification</Translate>
                  </IconButton>
                  <Divider vertical />
                  <IconButton
                    icon={<Icon as={VscGitPullRequestGoToChanges} />}
                    appearance="primary"
                    disabled={!editing || !localPatient.key}
                  >
                    <Translate>Amendment Requests</Translate>
                  </IconButton>
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
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Social Secirty Number"
                  fieldName="socialSecurityNumber"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <h5 style={{ borderTop: '1px solid #e1e1e1' }}>HIPAA</h5>
                <MyInput
                  vr={validationResult}
                  fieldType="checkbox"
                  fieldLabel="Notice of Privacy Practices"
                  fieldName="noticeOfPrivacyPractice"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  fieldType="date"
                  fieldLabel=" "
                  fieldName="noticeOfPrivacyPracticeDate"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <br />
                <MyInput
                  vr={validationResult}
                  fieldType="checkbox"
                  fieldLabel="Privacy Authorization"
                  fieldName="privacyAuthorization"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  fieldType="date"
                  fieldLabel=" "
                  fieldName="privacyAuthorizationDate"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <br />
                <MyInput
                  vr={validationResult}
                  fieldType="checkbox"
                  fieldLabel="Consent"
                  fieldName="consent"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  fieldType="date"
                  fieldLabel=" "
                  fieldName="consentDate"
                  record={localPatient}
                  setRecord={setLocalPatient}
                  disabled={!editing}
                />
              </Form>
            </TabPanel>

            {/* Relations */}
            <TabPanel>
              <Modal open={relationModalOpen} onClose={() => setRelationModalOpen(false)}>
                <Modal.Header>
                  <Modal.Title>New/Edit Patient Relation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form fluid>
                    <MyInput
                      vr={validationResult}
                      required
                      fieldLabel="Relation Type"
                      fieldType="select"
                      fieldName="relationTypeLkey"
                      selectData={relationsLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={selectedPatientRelation}
                      setRecord={setSelectedPatientRelation}
                    />
                    <MyInput
                      vr={validationResult}
                      required
                      fieldLabel="Category"
                      fieldType="select"
                      fieldName="categoryTypeLkey"
                      selectData={categoryLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={selectedPatientRelation}
                      setRecord={setSelectedPatientRelation}
                    />
                    <Form.Group>
                      <InputGroup inside style={{ width: 300, direction: 'ltr' }}>
                        <Input
                          disabled={true}
                          placeholder={'Search Relative Patient'}
                          value={selectedPatientRelation.relativePatientObject?.fullName ?? ''}
                        />
                        <InputGroup.Button onClick={() => search('relation')}>
                          <SearchIcon />
                        </InputGroup.Button>
                      </InputGroup>
                    </Form.Group>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button onClick={() => setRelationModalOpen(false)} appearance="subtle">
                    Cancel
                  </Button>
                  <Divider vertical />
                  <Button
                    onClick={() =>
                      savePatientRelation({
                        ...selectedPatientRelation,
                        patientKey: localPatient.key
                      }).unwrap()
                    }
                    appearance="primary"
                  >
                    Save
                  </Button>
                </Modal.Footer>
              </Modal>

              <ButtonToolbar style={{ padding: 1 }}>
                <IconButton
                  disabled={!editing}
                  icon={<Icon as={FaPlus} />}
                  onClick={() => {
                    setSelectedPatientRelation({ ...newApPatientRelation });
                    setRelationModalOpen(true);
                  }}
                  appearance="primary"
                >
                  <Translate>New Relative</Translate>
                </IconButton>
                <Divider vertical />
                <IconButton
                  disabled={!selectedPatientRelation.key}
                  icon={<Icon as={FaPencil} />}
                  onClick={() => {
                    setRelationModalOpen(true);
                  }}
                  appearance="primary"
                  color="cyan"
                >
                  <Translate>Edit</Translate>
                </IconButton>

                <Divider vertical />

                <IconButton
                  disabled={!selectedPatientRelation?.key}
                  appearance="primary"
                  color="blue"
                  icon={<TrashIcon />}
                  onClick={() => { setDeleteRelativeModalOpen(true) }}
                >
                  <Translate>Delete</Translate>
                </IconButton>
              </ButtonToolbar>

              <br />
              <Modal open={deleteRelativeModalOpen} onClose={handleClearRelative}>
                <Modal.Header>
                  <Modal.Title>Confirm Delete</Modal.Title>

                </Modal.Header>

                <Modal.Body>
                  <p>
                    <RemindOutlineIcon style={{ color: '#ffca61', marginRight: '8px', fontSize: '24px' }} />
                    <Translate style={{ fontSize: '24px' }} >
                      Are you sure you want to delete this Relation?
                    </Translate>
                  </p>
                </Modal.Body>
                <Modal.Footer>
                  <Button onClick={handleClearRelative} appearance="ghost" color='cyan'>
                    Cancel
                  </Button>
                  <Divider vertical />
                  <Button
                    onClick={handleDeleteRelation}
                    appearance="primary"
                  >
                    Delete
                  </Button>
                </Modal.Footer>
              </Modal>

              <Table
                height={600}
                sortColumn={patientRelationListRequest.sortBy}
                sortType={patientRelationListRequest.sortType}
                onSortColumn={(sortBy, sortType) => {
                  if (sortBy)
                    setPatientRelationListRequest({
                      ...patientRelationListRequest,
                      sortBy,
                      sortType
                    });
                }}
                headerHeight={40}
                rowHeight={50}
                bordered
                cellBordered
                onRowClick={rowData => {
                  setSelectedPatientRelation(rowData);
                }}
                data={patientRelationsResponse?.object ?? []}
              >
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Relation Type</Translate>
                  </HeaderCell>
                  <Cell dataKey="relationTypeLvalue.lovDisplayVale" />
                </Column>
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Relative Patient Name</Translate>
                  </HeaderCell>
                  <Cell dataKey="relativePatientObject.fullName" />
                </Column>
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Relation Category</Translate>
                  </HeaderCell>
                  <Cell dataKey="categoryTypeLvalue.lovDisplayVale" />
                </Column>
              </Table>
            </TabPanel>

            {/* Extra Details */}
            <TabPanel>
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
                  disabled={!editing}
                />
              </Form>
              <br />
              <ButtonToolbar>
                <IconButton
                  color="cyan"
                  icon={<PlusRound />}
                  onClick={() => {
                    setSecondaryDocumentModalOpen(true);
                    setSelectedSecondaryDocument(newApPatientSecondaryDocuments);
                  }}
                  disabled={!editing}
                  appearance="primary"
                >
                  New Secondary Document
                </IconButton>

                <IconButton
                  disabled={!selectedSecondaryDocument?.key}
                  appearance="primary"
                  color="cyan"
                  icon={<Edit />}
                  onClick={handleEditSecondaryDocument}
                >
                  <Translate>Edit</Translate>
                </IconButton>

                <IconButton
                  disabled={!selectedSecondaryDocument?.key}
                  appearance="primary"
                  color="blue"
                  icon={<TrashIcon />}
                  onClick={() => { setDeleteDocModalOpen(true) }}
                >
                  <Translate>Delete</Translate>
                </IconButton>
              </ButtonToolbar>

              <br />
              <Form layout="inline" fluid>
                <Table
                  height={600}
                  data={patientSecondaryDocumentsResponse?.data?.object ?? []}
                  headerHeight={40}
                  rowHeight={50}
                  bordered
                  cellBordered
                  onRowClick={rowData => {
                    setSelectedSecondaryDocument(rowData);
                  }}
                >
                  <Column sortable flexGrow={4}>
                    <HeaderCell>
                      <Translate>Document Country</Translate>
                    </HeaderCell>
                    <Cell dataKey="docContry" />
                  </Column>

                  <Column sortable flexGrow={4}>
                    <HeaderCell>
                      <Translate>Document Type</Translate>
                    </HeaderCell>
                    <Cell dataKey="docType" />
                  </Column>

                  <Column sortable flexGrow={4}>
                    <HeaderCell>
                      <Translate>Document Number</Translate>
                    </HeaderCell>
                    <Cell dataKey="documentNo" />
                  </Column>
                </Table>
              </Form>
            </TabPanel>

            <Modal
              open={secondaryDocumentModalOpen}
              onClose={() => handleCleareSecondaryDocument()}
            >
              <Modal.Header>
                <Modal.Title>Secondary Document</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form layout="inline" fluid>
                  <MyInput
                    required
                    vr={validationResult}
                    column
                    fieldLabel="Document Country"
                    fieldType="select"
                    fieldName="documentCountryLkey"
                    selectData={countryLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={secondaryDocument}
                    setRecord={newRecord =>
                      setSecondaryDocument({
                        ...secondaryDocument,
                        ...newRecord
                      })
                    }
                  />

                  <MyInput
                    required
                    vr={validationResult}
                    column
                    fieldLabel="Document Type"
                    fieldType="select"
                    fieldName="documentTypeLkey"
                    selectData={docTypeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={secondaryDocument}
                    setRecord={newRecord =>
                      setSecondaryDocument({
                        ...secondaryDocument,
                        ...newRecord
                      })
                    }
                  />
                  <MyInput
                    required
                    vr={validationResult}
                    column
                    fieldLabel="Document Number"
                    fieldName="documentNo"
                    record={secondaryDocument}
                    setRecord={newRecord =>
                      setSecondaryDocument({
                        ...secondaryDocument,
                        ...newRecord,
                        documentNo:
                          secondaryDocument.documentTypeLkey === 'NO_DOC' ? 'NO_DOC' : newRecord.documentNo
                      })
                    }
                    disabled={secondaryDocument.documentTypeLkey === 'NO_DOC'}
                  />

                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={() => handleCleareSecondaryDocument()} appearance="subtle">
                  Cancel
                </Button>
                <Divider vertical />
                <Button
                  onClick={() => {
                    handleSaveSecondaryDocument();
                  }}
                  appearance="primary"
                >
                  Save
                </Button>
              </Modal.Footer>
            </Modal>
            <Modal open={deleteDocModalOpen} onClose={handleClearDocument}>
              <Modal.Header>
                <Modal.Title>Confirm Delete</Modal.Title>

              </Modal.Header>

              <Modal.Body>
                <p>
                  <RemindOutlineIcon style={{ color: '#ffca61', marginRight: '8px', fontSize: '24px' }} />
                  <Translate style={{ fontSize: '24px' }} >
                    Are you sure you want to delete this Document?
                  </Translate>
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={handleClearDocument} appearance="ghost" color='cyan'>
                  Cancel
                </Button>
                <Divider vertical />
                <Button
                  onClick={handleDeleteSecondaryDocument}
                  appearance="primary"
                >
                  Delete
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Attachments */}
            <TabPanel>

              <Modal open={attachmentsModalOpen} onClose={() => handleCleareAttachment()}>
                <Modal.Header>
                  <Modal.Title>New/Edit Patient Attachments</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div
                    style={{
                      borderRadius: '5px',
                      border: '1px solid #e1e1e1',
                      margin: '2px',
                      position: 'relative',
                      bottom: 0,
                      width: '99%',
                      height: 400,
                      display: 'flex',
                      alignContent: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <input
                      type="file"
                      ref={attachmentFileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                      accept="image/*"
                    />

                    {newAttachmentSrc ? (
                      newAttachmentSrc ? (
                        <img

                          alt={'Attachment Preview'}
                          width={380}
                          height={380}
                          onClick={() =>
                            handleAttachmentFileUploadClick('PATIENT_PROFILE_ATTACHMENT')
                          }
                          src={newAttachmentSrc}
                        />
                      ) : (
                        <FileUploadIcon
                          onClick={() => {
                            handleAttachmentFileUploadClick('PATIENT_PROFILE_ATTACHMENT');

                          }
                          }
                          style={{ fontSize: '250px', marginTop: '10%' }}
                        />
                      )
                    ) : selectedPatientAttacment && selectedPatientAttacment.fileContent ? (
                      selectedPatientAttacment.contentType === 'application/pdf' ? (
                        <DetailIcon
                          onClick={() =>
                            handleAttachmentFileUploadClick('PATIENT_PROFILE_ATTACHMENT')
                          }
                          style={{ fontSize: '250px', marginTop: '10%' }}
                        />
                      ) : (
                        <img
                          alt={'Attachment Preview'}
                          width={380}
                          height={380}
                          onClick={() =>
                            handleAttachmentFileUploadClick('PATIENT_PROFILE_ATTACHMENT')
                          }
                          src={`data:${selectedPatientAttacment.contentType};base64,${selectedPatientAttacment.fileContent}`}
                        />
                      )
                    ) : (
                      <FileUploadIcon
                        onClick={() =>
                          handleAttachmentFileUploadClick('PATIENT_PROFILE_ATTACHMENT')
                        }
                        style={{ fontSize: '250px', marginTop: '10%' }}
                      />
                    )}
                  </div>

                  <br />
                  <Form>
                    <MyInput
                      width={550}
                      fieldName="accessTypeLkey"
                      fieldType="select"
                      selectData={attachmentsLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      fieldLabel="Type"
                      selectDataValue="key"
                      record={selectedAttachType}
                      setRecord={setSelectedAttachType}
                    />

                  </Form>

                  <br />
                  <Input
                    value={newAttachmentDetails}
                    onChange={setNewAttachmentDetails}
                    as="textarea"
                    rows={3}
                    placeholder="Details"
                  />
                </Modal.Body>
                <Modal.Footer>
                  <Button onClick={() => handleCleareAttachment()} appearance="subtle">
                    Cancel
                  </Button>
                  <Divider vertical />
                  <Button
                    disabled={actionType ? false : !uploadedAttachmentOpject?.formData}
                    onClick={() => {
                      actionType === 'view'
                        ? handleUpdateAttachmentDetails()
                        : upload({
                          ...uploadedAttachmentOpject,
                          details: newAttachmentDetails,
                          accessType: selectedAttachType
                        })
                          .unwrap()
                          .then(() => {
                            handleFinishUploading();
                          })
                    }}
                    appearance="primary"
                  >
                    Save
                  </Button>
                </Modal.Footer>
              </Modal>            <Modal open={deleteModalOpen} onClose={handleClearAttachmentDelete}>
                <Modal.Header>
                  <Modal.Title><h6>Confirm Delete</h6></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <p>
                    <RemindOutlineIcon style={{ color: '#ffca61', marginRight: '8px', fontSize: '24px' }} />
                    <Translate style={{ fontSize: '24px' }} >
                      Are you sure you want to delete this Attachment?
                    </Translate>
                  </p>

                </Modal.Body>
                <Modal.Footer>
                  <Button onClick={handleClearAttachmentDelete} appearance="ghost" color="cyan" >
                    Cancel
                  </Button>
                  <Divider vertical />
                  <Button
                    onClick={() => {
                      deleteAttachment({ key: selectedAttachment.key })
                        .then(() => {
                          attachmentRefetch();
                          fetchPatientImageResponse.refetch();
                          dispatch(notify('Deleted Successfully'))
                          handleClearAttachmentDelete();
                        })
                    }}
                    appearance="primary"
                  >
                    Delete
                  </Button>
                </Modal.Footer>
              </Modal>

              <ButtonToolbar style={{ padding: 1 }}>
                <IconButton
                  icon={<Icon as={FaPlus} />}

                  onClick={() => {
                    handleCleareAttachment();
                    setAttachmentsModalOpen(true);

                  }}
                  appearance="primary"
                  disabled={!editing || !localPatient.key}
                >
                  <Translate>New Attachment </Translate>
                </IconButton>
                <Divider vertical />
              </ButtonToolbar>

              <br />

              <Table
                height={600}
                sortColumn={patientRelationListRequest.sortBy}
                sortType={patientRelationListRequest.sortType}
                onSortColumn={(sortBy, sortType) => {
                  if (sortBy)
                    setPatientRelationListRequest({
                      ...patientRelationListRequest,
                      sortBy,
                      sortType
                    });
                }}
                headerHeight={40}
                rowHeight={50}
                bordered
                cellBordered
                onRowClick={rowData => {
                  setSelectedPatientRelation(rowData);
                }}
                data={patientAttachments ?? []}
              >
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Attachment Name</Translate>
                  </HeaderCell>
                  <Cell dataKey="fileName" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>File Type</Translate>
                  </HeaderCell>
                  <Cell dataKey="contentType" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Details</Translate>
                  </HeaderCell>
                  <Cell dataKey="extraDetails" />
                </Column>
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Source</Translate>
                  </HeaderCell>
                  <Cell dataKey="accessTypeLkey" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Download</Translate>
                  </HeaderCell>
                  <Cell>
                    {attachment => (
                      <Button
                        appearance="link"
                        onClick={() => handleDownloadSelectedPatientAttachment(attachment.key)}
                      >
                        Download <FileDownloadIcon style={{ marginLeft: '10px', scale: '1.4' }} />
                      </Button>
                    )}
                  </Cell>
                </Column>
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Actions</Translate>
                  </HeaderCell>
                  <Cell>
                    {attachment => (
                      <div>
                        <Button
                          appearance="link"
                          onClick={() => handleAttachmentSelected(attachment.key)}
                        >
                          Preview / Edit
                        </Button>

                        <Divider vertical />

                        <Button
                          appearance="link"
                          color="red"
                          onClick={() => handleDeleteAttachment(attachment)}

                        >
                          <TrashIcon style={{ marginLeft: '10px', scale: '1.4' }} />
                        </Button>
                      </div>
                    )}
                  </Cell>
                </Column>
              </Table>
            </TabPanel>

            {/* Follow Up & Activites */}
            <TabPanel></TabPanel>
          </Tabs>
        </Panel>
      </Panel>

      <Drawer
        size="lg"
        placement={'left'}
        open={searchResultVisible}
        onClose={() => {
          setSearchResultVisible(false);
        }}
      >
        <Drawer.Header>
          <Drawer.Title>Patient List - Search Results</Drawer.Title>
          <Drawer.Actions>{conjurePatientSearchBar(patientSearchTarget)}</Drawer.Actions>
        </Drawer.Header>
        <Drawer.Body>
          <small>
            * <Translate>Click to select patient</Translate>
          </small>
          <Table
            height={600}
            sortColumn={listRequest.sortBy}
            sortType={listRequest.sortType}
            onSortColumn={(sortBy, sortType) => {
              if (sortBy)
                setListRequest({
                  ...listRequest,
                  sortBy,
                  sortType
                });
            }}
            headerHeight={80}
            rowHeight={60}
            bordered
            cellBordered
            onRowClick={rowData => {
              handleSelectPatient(rowData);
              setSearchKeyword(null);
            }}
            data={patientListResponse?.object ?? []}
          >
            <Column sortable flexGrow={3}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('fullName', e)} />
                <Translate>Patient Name</Translate>
              </HeaderCell>
              <Cell dataKey="fullName" />
            </Column>
            <Column sortable flexGrow={3}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('phoneNumber', e)} />
                <Translate>Mobile Number</Translate>
              </HeaderCell>
              <Cell dataKey="phoneNumber" />
            </Column>
            <Column sortable flexGrow={2}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('genderLkey', e)} />
                <Translate>Gender</Translate>
              </HeaderCell>
              <Cell dataKey="genderLvalue.lovDisplayVale" />
            </Column>
            <Column sortable flexGrow={2}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('patientMrn', e)} />
                <Translate>Mrn</Translate>
              </HeaderCell>
              <Cell dataKey="patientMrn" />
            </Column>
            <Column sortable flexGrow={3}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('documentNo', e)} />
                <Translate>Document No</Translate>
              </HeaderCell>
              <Cell dataKey="documentNo" />
            </Column>
            <Column sortable flexGrow={3}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('archivingNumber', e)} />
                <Translate>Archiving Number</Translate>
              </HeaderCell>
              <Cell dataKey="archivingNumber" />
            </Column>
            <Column sortable flexGrow={3}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('dob', e)} />
                <Translate>Date of Birth</Translate>
              </HeaderCell>
              <Cell dataKey="dob" />
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
              limit={listRequest.pageSize}
              activePage={listRequest.pageNumber}
              onChangePage={pageNumber => {
                setListRequest({ ...listRequest, pageNumber });
              }}
              onChangeLimit={pageSize => {
                setListRequest({ ...listRequest, pageSize });
              }}
              total={patientListResponse?.extraNumeric ?? 0}
            />
          </div>
        </Drawer.Body>
      </Drawer>


      <Drawer
        size="lg"
        placement={'right'}
        open={encounterHistoryModalOpen}
        onClose={() => setEncounterHistoryModalOpen(false)}
      >
        <Drawer.Header>
          <Drawer.Title>Patient Visit History</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <Table
            height={600}
            sortColumn={encounterHistoryListRequest.sortBy}
            sortType={encounterHistoryListRequest.sortType}
            onSortColumn={(sortBy, sortType) => {
              if (sortBy)
                setEncounterHistoryListRequest({
                  ...encounterHistoryListRequest,
                  sortBy,
                  sortType
                });
            }}
            headerHeight={80}
            rowHeight={60}
            bordered
            cellBordered
            data={encounterHistoryResponse?.data?.object ?? [] ?? []}
          >
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Translate>key</Translate>
              </HeaderCell>
              <Cell>
                {rowData => (
                  <a
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      dispatch(setEncounter(rowData));
                      // navigate('/encounter');
                      setVisit(rowData);

                      navigate('/encounter-registration');
                    }}
                  >
                    {rowData.key}
                  </a>
                )}
              </Cell>
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Translate>Date</Translate>
              </HeaderCell>
              <Cell dataKey="plannedStartDate" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Translate>Department</Translate>
              </HeaderCell>
              <Cell dataKey="departmentName" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Translate>Physician</Translate>
              </HeaderCell>
              <Cell dataKey="responsiblePhysicianKey" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Translate>Priority</Translate>
              </HeaderCell>
              <Cell>
                {rowData =>
                  rowData.encounterPriorityLvalue
                    ? rowData.encounterPriorityLvalue.lovDisplayVale
                    : rowData.encounterPriorityLkey
                }
              </Cell>
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Translate>Status</Translate>
              </HeaderCell>
              <Cell>
                {rowData =>
                  rowData.encounterStatusLvalue
                    ? rowData.encounterStatusLvalue.lovDisplayVale
                    : rowData.encounterStatusLkey
                }
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
              limitOptions={[10, 20, 50]}
              limit={encounterHistoryListRequest.pageSize}
              activePage={encounterHistoryListRequest.pageNumber}
              onChangePage={pageNumber => {
                setEncounterHistoryListRequest({ ...encounterHistoryListRequest, pageNumber });
              }}
              onChangeLimit={pageSize => {
                setEncounterHistoryListRequest({ ...encounterHistoryListRequest, pageSize });
              }}
              total={encounterHistoryResponse?.data?.extraNumeric ?? 0 ?? 0}
            />
          </div>
        </Drawer.Body>
      </Drawer>
    </>
  );
};

export default PatientProfile;