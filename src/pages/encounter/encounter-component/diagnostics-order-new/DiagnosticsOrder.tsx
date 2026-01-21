import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { ApDiagnosticOrderTests, ApDiagnosticTest } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import {
  faLandMineOn,
  faListCheck,
  faCreditCard,
  faVial,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import PreviewDiagnosticsOrder from './PreviewDiagnosticsOrder';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVialCircleCheck } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useRef, useState } from 'react';
import { GrTestDesktop } from 'react-icons/gr';
import { MdAttachFile, MdModeEdit } from 'react-icons/md';
import {
  Checkbox,
  Divider,
  Form,
  HStack,
  IconButton,
  Panel,
  Row,
  SelectPicker,
  Tooltip,
  Whisper
} from 'rsuite';
import TransferList from './TransferTestList';
import './styles.less';
import { addFilterToListRequest, formatDateWithoutSeconds } from '@/utils';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import {
  useGetDiagnosticOrderQuery,
  useGetDiagnosticOrderTestQuery,
  useSaveDiagnosticOrderMutation,
  useSaveDiagnosticOrderTestMutation
} from '@/services/encounterService';
import {
  newApDiagnosticOrders,
  newApDiagnosticOrderTests,
  newApDiagnosticTest
} from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import CheckIcon from '@rsuite/icons/Check';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import PlusIcon from '@rsuite/icons/Plus';
import DetailsModal from './DetailsModal';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import CancellationModal from '@/components/CancellationModal';
import { useLocation } from 'react-router-dom';
import { useGetDiagnosticsTestListQuery } from '@/services/setupService';
import PatientPrevTests from './PatientPrevTests';
import {
  useGetLovValuesByCodeQuery,
  useGetDiagnosticsTestLaboratoryListQuery,
  useGetDiagnosticsTestRadiologyListQuery
} from '@/services/setupService';
import PatientHistorySummaryModal from './PatientHistorySummaryModal';

import { useGetGenericMedicationWithActiveIngredientQuery } from '@/services/medicationsSetupService';
import { newApDrugOrderMedications } from '@/types/model-types-constructor';
import SampleModal from '@/pages/lab-module/SampleModal';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { add } from 'lodash';

const DiagnosticsOrder = props => {
  const location = useLocation();
  const authSlice = useAppSelector(state => state.auth);

  const selectedDepartment = authSlice.selectedDepartment;

  // Reference to table container
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  // Check if the click is on an input element (or RSuite elements/your editable components)
  const isFormField = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(
        `
      input, textarea, select, button, [contenteditable="true"],
      .rs-input, .rs-picker, .rs-checkbox, .rs-btn, .rs-datepicker,
      .rs-picker-toggle, .rs-calendar, .rs-dropdown, .rs-auto-complete,
      .rs-input-group, .rs-select, .rs-slider
    `
      ) !== null
    );
  };

  // Ignore clicks inside modals/popups (RSuite or your components)
  const isInsideModalOrPopup = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(
        `
      .rs-modal, .rs-drawer, .rs-picker-select-menu, .rs-picker-popup,
      .my-modal, .my-popup
    `
      ) !== null
    );
  };

  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;
  const dispatch = useAppDispatch();
  const [showCanceled, setShowCanceled] = useState(true);
  const [test, setTest] = useState<ApDiagnosticTest>({ ...newApDiagnosticTest });
  const [flag, setFlag] = useState(false);
  const [reson, setReson] = useState({ cancellationReason: '' });
  const [openTestsModal, setOpenTestsModal] = useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [searchType, setSearchType] = React.useState({ type: '' });

  const [search, setSearch] = useState({ testName: '', type: '', category: '' });
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [recallFavoriteModal, setRecallFavoriteModal] = useState(false);
  const [preTestAssessmentModal, setPreTestAssessmentModal] = useState(false);
  const [collectSampleModal, setCollectSampleModal] = useState(false);
  const [testCardModal, setTestCardModal] = useState(false);
  const [openFavoritesModal, setOpenFavoritesModal] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedCatalog, setSelectedCatalog] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [proposedExecutionDate, setProposedExecutionDate] = useState(null);
  const [executionNumber, setExecutionNumber] = useState('');
  const [approvalNumber, setApprovalNumber] = useState('');
  const [favoriteMedications, setFavoriteMedications] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [drugKey, setDrugKey] = useState(null);
  const [openToAdd, setOpenToAdd] = useState(true);
  const [missingDeptModalOpen, setMissingDeptModalOpen] = useState(false);
  const [missingDeptList, setMissingDeptList] = useState([]);
  const [openSampleModal, setOpenSampleModal] = useState(false);
  const { data: genericMedicationListResponse } =
    useGetGenericMedicationWithActiveIngredientQuery(searchKeyword);

  const handleOpenAttachmentModal = () => {
    setAttachmentsModalOpen(true);
  };
  const [orderMedication, setOrderMedication] = useState<any>({
    ...newApDrugOrderMedications,
    drugOrderKey: drugKey
  });
  const [listTestRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 1000
  });
  const [listTestSearchRequest, setListTestSearchRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 1000
  });
  const { data: testsList, isFetching } = useGetDiagnosticsTestListQuery(listTestRequest);
  const { data: testsSearchList, isFetching: isFetchingSearch } =
    useGetDiagnosticsTestListQuery(listTestSearchRequest);

  const [labRequest, setLabRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 1000
  });
  const [radRequest, setRadRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 1000
  });
  const { data: labTestsList, isFetching: isLabTestsLoading } =
    useGetDiagnosticsTestLaboratoryListQuery(labRequest);
  const { data: radiologyTestsList, isFetching: isRadiologyTestsLoading } =
    useGetDiagnosticsTestRadiologyListQuery(radRequest);

  const [leftItems, setLeftItems] = useState([]);
  const [selectedTestsList, setSelectedTestsList] = useState([]);
  const [listOrdersRequest, setListOrdersRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },
      {
        fieldName: 'visit_key',
        operator: 'match',
        value: encounter?.key
      },
      {
        fieldName: 'is_valid',
        operator: 'match',
        value: showCanceled
      }
    ]
  });
  const [orders, setOrders] = useState<any>({ ...newApDiagnosticOrders });

  const [orderTest, setOrderTest] = useState<ApDiagnosticOrderTests>({
    ...newApDiagnosticOrderTests,
    processingStatusLkey: '6055029972709625'
  });
  const [listOrdersTestRequest, setListOrdersTestRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },
      {
        fieldName: 'order_key',
        operator: 'match',
        value: orders?.key || undefined
      },
      {
        fieldName: 'is_valid',
        operator: 'match',
        value: showCanceled
      }
    ]
  });

  const [selectedRows, setSelectedRows] = useState([]);
  const { data: ordersList, refetch: ordersRefetch } =
    useGetDiagnosticOrderQuery(listOrdersRequest);
  const {
    data: orderTestList,
    refetch: orderTestRefetch,
    isLoading: loadTests
  } = useGetDiagnosticOrderTestQuery({ ...listOrdersTestRequest });
  const tableLoading =
    loadTests ||
    isFetchingSearch ||
    (search.category &&
      (search.type === '862810597620632'
        ? isLabTestsLoading
        : search.type === '862828331135792'
          ? isRadiologyTestsLoading
          : false));
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  const [saveOrders, saveOrdersMutation] = useSaveDiagnosticOrderMutation();
  const [saveOrderTests, saveOrderTestsMutation] = useSaveDiagnosticOrderTestMutation();
  const [openDetailsModel, setOpenDetailsModel] = useState(false);
  const [openConfirmDeleteModel, setConfirmDeleteModel] = useState(false);
  const [selectedGeneric, setSelectedGeneric] = useState(null);
  const [isdraft, setIsDraft] = useState(false);
  const [previewDiagnosticsOrder, setPreviewDiagnosticsOrder] = useState<any | null>(null);
  // LOV queries for new fields
  const { data: diagTypesLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_TEST-TYPES');
  const { data: labCategoriesLovResponse } = useGetLovValuesByCodeQuery('LAB_CATEGORIES');
  const { data: radCategoriesLovResponse } = useGetLovValuesByCodeQuery('RAD_CATEGORIES');

  const { data: administrationInstructionsLovQueryResponse } = useGetLovValuesByCodeQuery(
    'MED_ORDER_ADMIN_NSTRUCTIONS'
  );

  const isSelected = rowData => {
    if (rowData && orderTest && rowData.key === orderTest.key) {
      return 'selected-row';
    } else return '';
  };
  const filteredOrders =
    ordersList?.object?.filter(item => item.statusLkey === '1804482322306061') ?? [];
  //Effects

  useEffect(() => {
    setSearch(prev => ({ ...prev, category: '' }));
  }, [search.type]);

  useEffect(() => {
    setListTestSearchRequest(prev => {
      let next: ListRequest = { ...prev, pageSize: 1000, pageNumber: 1 };

      next = {
        ...next,
        filters: next.filters.filter(
          f => f.fieldName !== 'test_name' && f.fieldName !== 'test_type_lkey'
        ),
        ignore: false
      };

      const name = search.testName?.trim();
      if (name) {
        next = addFilterToListRequest('test_name', 'containsIgnoreCase', name, next);
      }

      const type = search.type?.trim?.() ?? search.type;
      if (type) {
        next = addFilterToListRequest('test_type_lkey', 'match', type, next);
      }

      return next;
    });
  }, [search.testName, search.type]);

  useEffect(() => {
    setLabRequest(prev => ({
      ...prev,
      filters: prev.filters.filter(f => f.fieldName !== 'category_lkey'),
      ignore: false,
      pageNumber: 1,
      pageSize: 1000
    }));
    setRadRequest(prev => ({
      ...prev,
      filters: prev.filters.filter(f => f.fieldName !== 'category_lkey'),
      ignore: false,
      pageNumber: 1,
      pageSize: 1000
    }));

    if (!search.category) return;

    if (search.type === '862810597620632') {
      setLabRequest(prev =>
        addFilterToListRequest('category_lkey', 'match', search.category, prev)
      );
    } else if (search.type === '862828331135792') {
      setRadRequest(prev =>
        addFilterToListRequest('category_lkey', 'match', search.category, prev)
      );
    }
  }, [search.type, search.category]);

  useEffect(() => {
    if (!testsSearchList?.object) return;

    const all = testsSearchList.object;
    let selected = all;

    if (search.category) {
      if (search.type === '862810597620632') {
        const labKeys = new Set((labTestsList?.object ?? []).map(x => x.testKey));
        selected = all.filter(t => labKeys.has(t.key));
      } else if (search.type === '862828331135792') {
        const radKeys = new Set((radiologyTestsList?.object ?? []).map(x => x.testKey));
        selected = all.filter(t => radKeys.has(t.key));
      }
    }

    const value = selected.length === 0 ? '(-1)' : selected.map(t => `(${t.key})`).join(' ');

    setListOrdersTestRequest(prev => addFilterToListRequest('test_key', 'in', value, prev));
  }, [testsSearchList, labTestsList, radiologyTestsList, search.type, search.category]);

  useEffect(() => {
    if (testsList?.object) {
      setLeftItems(testsList.object);
      setSelectedTestsList([]);
    }
  }, [openTestsModal, testsList]);

  useEffect(() => {
    setListRequest(prev => {
      let next: ListRequest = { ...initialListRequest, pageSize: 1000, pageNumber: 1 };

      const name = searchTerm?.trim();
      if (name) {
        next = addFilterToListRequest('test_name', 'containsIgnoreCase', name, next);
      }

      const type = searchType?.type?.trim();
      if (type) {
        next = addFilterToListRequest('test_type_lkey', 'match', type, next);
      }

      return next;
    });
  }, [searchTerm, searchType.type]);

  useEffect(() => {
    const draftOrder = ordersList?.object?.find(order => order.saveDraft === true);

    if (draftOrder != null) {
      setIsDraft(true);
      setOrders({ ...draftOrder });
    }
  }, [ordersList]);

  useEffect(() => {
    setListOrdersTestRequest({
      ...initialListRequest,
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key
        },
        {
          fieldName: 'order_key',
          operator: 'match',
          value: orders?.key || undefined
        },
        {
          fieldName: 'is_valid',
          operator: 'match',
          value: showCanceled
        }
      ]
    });
  }, [showCanceled]);

  useEffect(() => {
    const updatedFilters = [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },
      {
        fieldName: 'order_key',
        operator: 'match',
        value: orders?.key || undefined
      },
      {
        fieldName: 'is_valid',
        operator: 'match',
        value: showCanceled
      }
    ];

    setListOrdersTestRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
  }, [orders]);

  // Reset category when type changes
  useEffect(() => {
    setSelectedCategory('');
  }, [selectedType]);

  useEffect(() => {
    setSelectedCategory(null);
  }, [orders.type]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;

      // If click inside table container => ignore
      if (tableContainerRef.current?.contains(target as Node)) return;

      // If on an input element or inside a module/menu => ignore
      if (isFormField(e.target) || isInsideModalOrPopup(e.target)) return;

      //clean up the selections
      handleClearDiagnostics();
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClearDiagnostics();
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('touchstart', handleGlobalClick);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Handlers
  const OpenDetailsModel = () => {
    setOpenDetailsModel(true);
  };

  const OpenConfirmDeleteModel = () => {
    setConfirmDeleteModel(true);
  };
  const CloseConfirmDeleteModel = () => {
    setConfirmDeleteModel(false);
  };

  const handleSaveTest = async () => {
    try {
      await saveOrderTests({
        ...orderTest,
        fromFacilityId: selectedDepartment.facilityId,
        fromDepartmentId: selectedDepartment.departmentId
      }).unwrap();
      setOpenDetailsModel(false);
      dispatch(notify({ msg: 'saved Successfully', sev: 'success' }));

      orderTestRefetch()
        .then(() => {
          console.log('Refetch complete');
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });
    } catch (error) {
      dispatch(notify('Save Failed'));
    }
  };

  const handleCheckboxChange = key => {
    setSelectedRows(prev => {
      if (prev.includes(key)) {
        return prev.filter(item => item !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const handleCancle = async () => {
    try {
      await Promise.all(
        selectedRows.map(item =>
          saveOrderTests({
            ...item,
            deletedAt: Date.now(),
            statusLkey: '1804447528780744',
            isValid: false,
            cancellationReason: reson.cancellationReason
          }).unwrap()
        )
      );

      dispatch(notify({ msg: 'All orders deleted successfully', sev: 'success' }));

      orderTestRefetch()
        .then(() => {
          console.log('Refetch complete');
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });
      setSelectedRows([]);
      CloseConfirmDeleteModel();
    } catch (error) {
      console.error('Encounter save failed:', error);
      dispatch(notify({ msg: 'One or more deleted failed', sev: 'error' }));
      CloseConfirmDeleteModel();
    }
  };

  const handleSaveTests = async () => {
    setOpenTestsModal(false);

    try {
      await Promise.all(
        selectedTestsList.map(item =>
          saveOrderTests({
            ...newApDiagnosticOrderTests,
            patientKey: patient.key,
            visitKey: encounter?.key,
            orderKey: orders?.key,
            testKey: item?.key,
            statusLkey: '164797574082125',
            processingStatusLkey: '6055029972709625',
            orderTypeLkey: item?.testTypeLkey
          }).unwrap()
        )
      );

      dispatch(notify({ msg: 'All Tests Saved Successfully', sev: 'success' }));

      await orderTestRefetch();
    } catch (error) {
      console.error('Encounter save failed:', error);
      dispatch(notify({ msg: 'Save Failed', sev: 'error' }));
    }
  };

  const handleSaveOrdersAndDraft = async () => {
    if (patient && encounter) {
      try {
        const response = await saveOrders({
          ...newApDiagnosticOrders,
          patientKey: patient.key,
          visitKey: encounter.key,
          statusLkey: '164797574082125',
          labStatusLkey: '6055029972709625',
          radStatusLkey: '6055029972709625',
          saveDraft: true,
          // Add new fields to the order
          typeKey: selectedType,
          catalogKey: selectedCatalog,
          categoryKey: selectedCategory,
          proposedExecutionDate: proposedExecutionDate?.getTime(),
          executionNumber,
          approvalNumber
        });

        setOpenTestsModal(true);
        dispatch(notify('Start New Order with ID:' + response?.data?.orderId));
        setOrders(response?.data);
      } catch (error) {
        console.error('Error saving prescription:', error);
      }
    } else {
      console.warn('Patient or encounter is missing. Cannot save prescription.');
    }
  };

  const handleSubmitPres = async () => {
    const missingTests =
      orderTestList?.object
        ?.filter(item => !item.receivedLabId)
        ?.map(item => item.test?.testName || 'Unnamed Test') || [];

    if (missingTests.length > 0) {
      setMissingDeptList(missingTests);
      setMissingDeptModalOpen(true);
      return;
    }

    try {
      await saveOrders({
        ...orders,
        statusLkey: '1804482322306061',
        saveDraft: false,
        submittedAt: Date.now()
      }).unwrap();

      dispatch(notify({ msg: 'Submitted Successfully', sev: 'success' }));
      ordersRefetch();
      orderTestRefetch();
    } catch (error) {
      console.error('Error saving :', error);
    }

    orderTestList?.object?.map(item => {
      if (item.statusLkey !== '1804447528780744') {
        saveOrderTests({ ...item, statusLkey: '1804482322306061', submitDate: Date.now() });
      }
    });

    setIsDraft(false);
    setFlag(true);
    await ordersRefetch();
    orderTestRefetch().then(() => '');
    setOrders({ ...newApDiagnosticOrders });
    handleClearDiagnostics();
  };

  const handleRecall = rowData => {
    const genericMedication = genericMedicationListResponse?.object?.find(
      item => item.key === rowData.genericMedicationsKey
    );

    setOrderMedication({
      ...newApDrugOrderMedications,
      ...rowData,
      drugOrderKey: drugKey,
      genericName: genericMedication?.genericName || '',
      dose: rowData.dose || null,
      doseUnitLkey: rowData.doseUnitLkey || null,
      frequency: rowData.frequency || null,
      roaLkey: rowData.roaLkey || null,
      chronicMedication: rowData.chronicMedication || false,
      priorityLkey: rowData.priorityLkey || null,
      durationTypeLkey: rowData.durationTypeLkey || null,
      indicationUseLkey: rowData.indicationUseLkey || null,
      pharmacyDepartmentKey: rowData.pharmacyDepartmentKey || null
    });

    setSelectedGeneric(genericMedication || null);
    setOpenFavoritesModal(false);
    setOpenDetailsModel(true);
    setOpenToAdd(true);
  };


  // Clean up the test selection and hide the preview and any associated states
  const handleClearDiagnostics = () => {
    setOrderTest({
      ...newApDiagnosticOrderTests,
      processingStatusLkey: '6055029972709625'
    });
    setTest({ ...newApDiagnosticTest });
    setPreviewDiagnosticsOrder(null);
    setSelectedRows([]);
  };

  const addToFavorites = rowData => {
    const alreadyExists = favoriteMedications.some(
      item => item.genericMedicationsKey === rowData.genericMedicationsKey
    );

    if (alreadyExists) {
      setFavoriteMedications(prev =>
        prev.filter(item => item.genericMedicationsKey !== rowData.genericMedicationsKey)
      );
      const genericMedication = genericMedicationListResponse?.object?.find(
        item => item.key === rowData.genericMedicationsKey
      );
      const medicationName = genericMedication ? genericMedication.genericName : 'Medication';
      dispatch(
        notify({
          msg: `${medicationName} removed from favorites`,
          type: 'info'
        })
      );
    } else {
      const genericMedication = genericMedicationListResponse?.object?.find(
        item => item.key === rowData.genericMedicationsKey
      );

      const medicationToAdd = {
        ...rowData,
        genericName: genericMedication ? genericMedication.genericName : 'Unnamed Medication',
        administrationInstructions: rowData.administrationInstructions,
        parametersToMonitor: rowData.parametersToMonitor || rowData.parametersToMonitorKey
      };

      setFavoriteMedications(prev => [...prev, medicationToAdd]);
      dispatch(
        notify({
          msg: `${medicationToAdd.genericName} added to favorites`,
          type: 'success'
        })
      );
    }
  };
  const joinValuesFromArray = values => {
    return values.filter(Boolean).join(', ');
  };
  const buildDiagnosticsSummaryPayload = (
    patient: any,
    encounter: any,
    orderTests: any[] = []
  ) => {
    const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));

    const patientInfo = {
      mrn: toStr(patient?.patientMrn),
      fullName: toStr(patient?.fullName || patient?.patientFullName),
      gender: toStr(patient?.genderLvalue?.lovDisplayVale || patient?.genderLvalue?.valueCode),
      dob: toStr(patient?.dob),
    };

    const encounterInfo = {
      visitId: toStr(encounter?.visitId),
      visitType: toStr(encounter?.visitTypeLvalue?.lovDisplayVale),
      plannedStartDate: toStr(encounter?.plannedStartDate),
      chiefComplaint: toStr(encounter?.chiefComplaint),
      patientAge: toStr(encounter?.patientAge),
      diagnosis: toStr(encounter?.diagnosis),
    };

    // Each row as a single string "exactly like table data (human readable)"
    const testsAsStrings: string[] = orderTests.map((row: any) => {
      const parts = [
        `Order Type: ${toStr(row?.test?.testTypeLvalue?.lovDisplayVale)}`,
        `Test Name: ${toStr(row?.test?.testName)}`,
        `Internal Code: ${toStr(row?.test?.internalCode)}`,
        `Status: ${toStr(row?.statusLvalue?.lovDisplayVale || row?.statusLkey)}`,
        `Reason: ${toStr(row?.reasonLvalue?.lovDisplayVale || row?.reasonLkey)}`,
        `Priority: ${toStr(row?.priorityLvalue?.lovDisplayVale || row?.priorityLkey)}`,
        `Notes: ${toStr(row?.notes)}`,
        `Cancellation Reason: ${toStr(row?.cancellationReason)}`,
      ];

      return parts
        .map(s => s.trim())
        .filter(s => !s.endsWith(':') && !s.endsWith(': '))
        .join(' | ');
    });

    return {
      patient: patientInfo,
      encounter: encounterInfo,
      complain: toStr(encounter?.chiefComplaint), // explicit field as requested
      diagnosis: {
        value: toStr(encounter?.diagnosis),
      },
      tests: testsAsStrings,
    };
  };
  const payload = buildDiagnosticsSummaryPayload(
    patient,
    encounter,
    orderTestList?.object ?? []
  );
  const tableColumns = [
    {
      key: 'check',
      title: <Translate>#</Translate>,
      flexGrow: 1,
      fullText: true,
      render: rowData => (
        <Checkbox
          key={rowData.id}
          checked={selectedRows.includes(rowData)}
          onChange={() => handleCheckboxChange(rowData)}
          disabled={rowData.statusLvalue?.lovDisplayVale !== 'New'}
        />
      )
    },
    {
      key: 'orderTypeLkey',
      title: <Translate>ORDER TYPE</Translate>,
      flexGrow: 1,
      fullText: true,
      render: rowData => {
        return rowData.test?.testTypeLvalue?.lovDisplayVale ?? '';
      }
    },
    {
      key: 'test',
      title: <Translate>TEST NAME</Translate>,
      flexGrow: 2,
      fullText: true,
      render: rowData => rowData.test.testName
    },
    {
      key: 'internalCode',
      dataKey: 'internalCode',
      title: <Translate>INTERNAL CODE</Translate>,
      flexGrow: 2,
      fullText: true,
      render: rowData => rowData.test.internalCode
    },
    {
      key: 'statusLkey',
      dataKey: 'statusLkey',
      title: <Translate>STATUS</Translate>,
      flexGrow: 1,
      fullText: true,
      render: rowData =>
        rowData.statusLvalue ? rowData.statusLvalue.lovDisplayVale : rowData.statusLkey
    },
    {
      key: 'receivedLabkey ',
      dataKey: 'receivedLabkey ',
      title: <Translate>RECEIVED LAB</Translate>,
      fullText: true,
      flexGrow: 1
    },
    {
      key: 'processingStatusLkey',
      dataKey: 'processingStatusLkey',
      title: <Translate>PROCESSING STATUS</Translate>,
      flexGrow: 1,
      fullText: true,
      render: rowData =>
        rowData.processingStatusLvalue
          ? rowData.processingStatusLvalue?.lovDisplayVale
          : rowData.processingStatusLkey
    },
    {
      key: 'reasonLkey',
      dataKey: 'reasonLkey',
      title: <Translate>REASON</Translate>,
      flexGrow: 1,
      fullText: true,
      render: rowData =>
        rowData.reasonLkey ? rowData.reasonLvalue?.lovDisplayVale : rowData.reasonLkey
    },
    {
      key: 'priorityLkey',
      dataKey: 'priorityLkey',
      title: <Translate>priority</Translate>,
      flexGrow: 1,
      fullText: true,
      render: rowData =>
        rowData.priorityLvalue ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey
    },
    {
      key: 'notes',
      dataKey: 'notes ',
      title: <Translate>NOTES</Translate>,
      fullText: true,
      flexGrow: 1
    },
    {
      key: 'attachments',
      dataKey: '',
      title: <Translate>ATTACHMENTS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return (
          <MdAttachFile
            size={20}
            fill={rowData?.key ? 'var(--primary-gray)' : '#ccc'}
            onClick={() => {
              if (rowData?.key) {
                setOrderTest(rowData);
                handleOpenAttachmentModal();
              }
            }}
            style={{ cursor: rowData?.key ? 'pointer' : 'not-allowed' }}
          />
        );
      }
    },
    {
      key: 'submitDate',
      dataKey: 'submitDate',
      title: <Translate>SUBMIT DATE</Translate>,
      flexGrow: 2,
      fullText: true,
      render: rowData => (
        <span className="date-table-style">{formatDateWithoutSeconds(rowData.submitDate)}</span>
      )
    },
    {
      key: 'details',
      title: <Translate>ADD DETAILS</Translate>,
      flexGrow: 2,
      fullText: true,
      render: rowData => {
        const isInFavorites = favoriteMedications.some(
          item => item.genericMedicationsKey === rowData.genericMedicationsKey
        );
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Whisper placement="top" speaker={<Tooltip>Edit</Tooltip>}>
              <MdModeEdit
                onClick={OpenDetailsModel}
                color="var(--primary-gray)"
                className="icons-styles"
              />
            </Whisper>

            {/*  */}
            <Whisper placement="top" speaker={<Tooltip>Pre-test assessment</Tooltip>}>
              <FontAwesomeIcon
                color="var(--primary-gray)"
                className="icons-styles"
                icon={faListCheck}
              />
            </Whisper>

            {/*  */}
         
        
          </div>
        );
      }
    },
    {
      key: '',
      title: <Translate>Created At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.createdBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.createdAt)}</span>
          </>
        );
      }
    },
    {
      key: '',
      title: <Translate>Updated At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.updatedBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.updatedAt)}</span>
          </>
        );
      }
    },

    {
      key: '',
      title: <Translate>Cancelled At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.deletedBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.deletedAt)}</span>
          </>
        );
      }
    },

    {
      key: 'cancellationReason',
      dataKey: 'cancellationReason',
      title: <Translate>Cancellation Reason</Translate>,
      expandable: true
    }
  ];

  const pageIndex = listOrdersTestRequest.pageNumber - 1;
  const rowsPerPage = listOrdersTestRequest.pageSize;
  const totalCount = orderTestList?.extraNumeric ?? 0;

  const handlePageChange = (_: unknown, newPage: number) => {
    setListOrdersTestRequest({ ...listOrdersTestRequest, pageNumber: newPage + 1 });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListOrdersTestRequest({
      ...listOrdersTestRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };

  return (
    <>
      <div className="main-container">
        {/* Enhanced Header with New Fields */}
        <div className="enhanced-header">
          {/* First Row - Existing Order Selector and Basic Controls */}
          <div className="header-first-row">
            {/* Select */}
            <SelectPicker
              className="select-picker-orders"
              data={filteredOrders ?? []}
              labelKey="orderId"
              valueKey="key"
              placeholder="orders"
              value={orders.key ?? null}
              onChange={value => {
                const selectedItem =
                  filteredOrders.find(item => item.key === value) || newApDiagnosticOrders;
                setOrders(selectedItem);
                handleClearDiagnostics(); // Clean up previous selection
              }}
            />
            <div className="top-container">
              {/* Icon */}
              <div className="icon-style">
                <GrTestDesktop size={18} />
              </div>

              {/* Texts */}
              <div>
                <div className="prescripton-word-style">Order</div>
                <div className="prescripton-number-style">{orders?.orderId || '_'}</div>
              </div>
            </div>

            {/* Buttons */}
            <div className="buttons-group">
              <MyButton
                loading={isFetching}
                onClick={handleSaveOrdersAndDraft}
                disabled={!edit ? isdraft : true}
                prefixIcon={() => <PlusIcon />}
              >
                New Order
              </MyButton>
              <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faLandMineOn} />}
                onClick={() => setOrders({ ...orders, isUrgent: !orders.isUrgent })}
                backgroundColor={orders.isUrgent ? 'var(--primary-orange)' : 'var(--primary-blue)'}
                disabled={
                  edit ? true : orders.key ? orders?.statusLkey !== '164797574082125' : true
                }
              >
                Urgent
              </MyButton>
            </div>
          </div>

          {/* Second Row - New Header Fields */}
          <div className="header-second-row">
            {/* Test Name */}
            <Form>
              <MyInput
                width={170}
                fieldName="testName"
                fieldType="text"
                fieldLabel="Test Name"
                record={search}
                setRecord={setSearch}
              />
            </Form>
            {/* Type */}
            <Form>
              <MyInput
                width={180}
                fieldName="type"
                fieldType="select"
                selectData={diagTypesLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                fieldLabel="Type"
                selectDataValue="key"
                record={search}
                setRecord={setSearch}
                searchable={false}
              />
            </Form>

            {/* Category */}
            {search.type && (
              <Form>
                <MyInput
                  fieldName="category"
                  fieldType="select"
                  fieldLabel="Category"
                  width={220}
                  selectData={
                    search.type === '862810597620632'
                      ? labCategoriesLovResponse?.object ?? []
                      : search.type === '862828331135792'
                        ? radCategoriesLovResponse?.object ?? []
                        : []
                  }
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={search}
                  setRecord={setSearch}
                  searchable={false}
                />
              </Form>
            )}
          </div>

          {/* Third Row - Action Buttons */}
          <div className="header-third-row">
            {/* Request New Test Setup */}
            {/* <MyButton onClick={handleRequestNewTestSetup} appearance="ghost">
              <FontAwesomeIcon icon={faVial} />
              Request New TestSetup
            </MyButton> */}
            {/* Recall Favorite */}
          
            {/* Sign and Submit */}
            <MyButton
              onClick={() => {
                setSummaryModalOpen(true);
              }} disabled={orders.key ? orders.statusLkey === '1804482322306061' : true}
              prefixIcon={() => <CheckIcon />}
            >
              Sign & Submit
            </MyButton>
          </div>
        </div>

        <Row>
          <Divider />
        </Row>
        <Row>
          <div className="top-container">
            <div className="buttons-sect">
              <Checkbox
                checked={!showCanceled}
                disabled={orders.key == null}
                onChange={() => {
                  setShowCanceled(!showCanceled);
                }}
              >
                Show canceled test
              </Checkbox>
              <MyButton disabled={orders.key == null} onClick={() => setOpenTestsModal(true)}>
                <FontAwesomeIcon icon={faPlus} />
                Add Test
              </MyButton>
              <MyButton
                disabled={orders.key !== null ? selectedRows.length === 0 : true}
                prefixIcon={() => <CloseOutlineIcon />}
                onClick={OpenConfirmDeleteModel}
              >
                Cancel
              </MyButton>
            </div>
          </div>
        </Row>
      </div>
      <Row className="table-row-margins">
        <div ref={tableContainerRef}>
          <MyTable
            columns={tableColumns}
            sortColumn={listOrdersRequest.sortBy}
            sortType={listOrdersRequest.sortType}
            loading={tableLoading}
            onSortChange={(sortBy, sortType) => {
              setListOrdersRequest({ ...listOrdersRequest, sortBy, sortType });
            }}
            data={orderTestList?.object ?? []}
            onRowClick={rowData => {
              setOrderTest(rowData);
              setTest(rowData.test);
              setPreviewDiagnosticsOrder(rowData); // Show preview when selecting a row
            }}
            rowClassName={isSelected}
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </div>

        <PreviewDiagnosticsOrder
          open={!!previewDiagnosticsOrder}
          setOpen={() => setPreviewDiagnosticsOrder(null)}
          orderTest={previewDiagnosticsOrder}
        />

        <Panel header="Patient Orders Test" collapsible expanded={true} className="panel-style">
          <PatientPrevTests patient={patient} />
        </Panel>
      </Row>

      <DetailsModal
        order={orders}
        test={test}
        openDetailsModel={openDetailsModel}
        setOpenDetailsModel={setOpenDetailsModel}
        orderTest={orderTest}
        setOrderTest={setOrderTest}
        handleSaveTest={handleSaveTest}
        edit={edit}
      />

      <CancellationModal
        open={openConfirmDeleteModel}
        setOpen={setConfirmDeleteModel}
        object={reson}
        setObject={setReson}
        handleCancle={handleCancle}
        fieldName="cancellationReason"
        fieldLabel={'Cancellation Reason'}
        title={'Cancellation'}
      />

      <MyModal
        open={attachmentsModalOpen}
        setOpen={setAttachmentsModalOpen}
        title={`Attachments - ${orderTest?.test?.testName || 'Test'}`}
        size="lg"
        hideActionBtn={true}
        content={
          <EncounterAttachment
            localEncounter={encounter}
            source="DIAGNOSTIC_ORDER_ATTACHMENT"
            sourceId={orderTest?.key ? Number(orderTest.key) : undefined}
            refetchAttachmentList={false}
            setRefetchAttachmentList={() => { }}
          />
        }
      />

      <MyModal
        open={openTestsModal}
        setOpen={setOpenTestsModal}
        title="Select Tests"
        actionButtonFunction={handleSaveTests}
        size="50vw"
        content={
          <TransferList
            open={openTestsModal}
            leftItems={leftItems}
            rightItems={selectedTestsList}
            setLeftItems={setLeftItems}
            setRightItems={setSelectedTestsList}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchType={searchType}
            setSearchType={setSearchType}
            isFetching={isFetching}
          />

        }
      />

      {/* Recall Favorite Modal */}
      <MyModal
        open={recallFavoriteModal}
        setOpen={setRecallFavoriteModal}
        title="Recall Favorite Orders"
        size="60vw"
        content={
          <div className="modal-content-padding">
            <p>Select favorite diagnostic orders to recall...</p>
            {/* TODO: Add favorite orders selection component similar to medication */}
          </div>
        }
      />

      {/* Pre-test Assessment Modal */}
      <MyModal
        open={preTestAssessmentModal}
        setOpen={setPreTestAssessmentModal}
        title="Pre-test Assessment"
        size="70vw"
        content={
          <div className="modal-content-padding">
            <p>Pre-test assessment checklist and requirements...</p>
            {/* TODO: Add pre-test assessment form */}
          </div>
        }
      />

      {/* Collect Sample Modal */}
      <MyModal
        open={collectSampleModal}
        setOpen={setCollectSampleModal}
        title="Laboratory Sample Collection"
        size="60vw"
        content={
          <div className="modal-content-padding">
            <p>Sample collection interface and tracking...</p>
            {/* TODO: Add sample collection interface */}
          </div>
        }
      />

      {/* Test Card Modal */}
      <MyModal
        open={testCardModal}
        setOpen={setTestCardModal}
        title="Test Card"
        size="80vw"
        content={
          <div className="modal-content-padding">
            <p>Test card information and details...</p>
            {/* TODO: Add test card component */}
          </div>
        }
      />
      <MyModal
        open={openFavoritesModal}
        setOpen={setOpenFavoritesModal}
        title="Favorite Medications"
        size="lg"
        content={
          <div>
            <MyTable
              columns={[
                {
                  key: 'medicationName',
                  dataKey: 'genericMedicationsKey',
                  title: 'Medication Name',
                  render: (rowData: any) => {
                    return (
                      genericMedicationListResponse?.object?.find(
                        item => item.key === rowData.genericMedicationsKey
                      )?.genericName || 'Unknown Medication'
                    );
                  }
                },
                {
                  key: 'instruction',
                  dataKey: '',
                  title: 'Instruction',
                  render: (rowData: any) => {
                    return joinValuesFromArray([
                      rowData.dose,
                      rowData.doseUnitLvalue?.lovDisplayVale,
                      rowData.drugOrderTypeLkey == '2937757567806213'
                        ? 'STAT'
                        : 'every ' + rowData.frequency + ' hours',
                      rowData.roaLvalue?.lovDisplayVale
                    ]);
                  }
                },
                {
                  key: 'administrationInstruction',
                  dataKey: 'administrationInstructions',
                  title: 'Administration Instruction',
                  render: (rowData: any) => {
                    if (rowData.administrationInstructions?.lovDisplayVale) {
                      return rowData.administrationInstructions.lovDisplayVale;
                    } else if (rowData.administrationInstructions) {
                      const instruction = administrationInstructionsLovQueryResponse?.object?.find(
                        item => item.key === rowData.administrationInstructions
                      );
                      return instruction?.lovDisplayVale || rowData.administrationInstructions;
                    }
                    return 'No instruction';
                  }
                },
                {
                  key: 'parametersToMonitor',
                  dataKey: 'parametersToMonitorKey',
                  title: 'Parameters To Monitor',
                  render: (rowData: any) => {
                    if (rowData.parametersToMonitor) {
                      return rowData.parametersToMonitor;
                    } else if (rowData.parametersToMonitorValue?.lovDisplayVale) {
                      return rowData.parametersToMonitorValue.lovDisplayVale;
                    } else if (rowData.parametersToMonitorKey) {
                      return rowData.parametersToMonitorKey;
                    }
                    return 'No parameters specified';
                  }
                },
                {
                  key: 'actions',
                  title: 'Actions',
                  render: (rowData: any) => {
                    return (
                      <div className="favorites-modal-actions">
                        <MyButton size="xs" onClick={() => handleRecall(rowData)}>
                          Recall
                        </MyButton>
                        <FontAwesomeIcon
                          icon={faStar}
                          onClick={() => addToFavorites(rowData)}
                          className="star-favorite-icon"
                          title="Remove from favorites"
                        />
                      </div>
                    );
                  }
                }
              ]}
              data={favoriteMedications || []}
            />
          </div>
        }
      />
      <SampleModal
        open={openSampleModal}
        setOpen={setOpenSampleModal}
        order={orders}
        test={test}
        orderTest={orderTest}
        patient={patient}
        encounter={encounter}
        edit={edit}
        onSave={handleSaveTest}
      />
      <PatientHistorySummaryModal
        open={summaryModalOpen}
        setOpen={setSummaryModalOpen}
        patient={patient}
        encounter={encounter}
        edit={edit}
        handleSave={handleSubmitPres}
        payload={payload}
      />
      <MyModal
        open={missingDeptModalOpen}
        setOpen={setMissingDeptModalOpen}
        title="Missing Receiving Department"
        modalColor="var(--primary-orange)"
        steps={[
          {
            title: 'Warning',
            icon: <FontAwesomeIcon icon={faTriangleExclamation} />
          }
        ]}
        actionButtonLabel="OK"
        hideCancel={true}
        content={
          <div style={{ padding: '10px' }}>
            <p style={{ fontWeight: 'bold', color: 'var(--primary-orange)' }}>
              Please select a receiving department for the following tests:
            </p>
            <ul>
              {missingDeptList.map((name, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>
                  • {name}
                </li>
              ))}
            </ul>
          </div>
        }
      />
    </>
  );
};

export default DiagnosticsOrder;