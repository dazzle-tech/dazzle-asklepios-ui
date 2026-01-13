import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
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
  Panel,
  Row,
  SelectPicker,
  Tooltip,
  Whisper
} from 'rsuite';
import TransferList from './TransferTestList';
import './styles.less';
import { formatDateWithoutSeconds } from '@/utils';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import {
  useCreateDiagnosticOrderMutation,
  useUpdateDiagnosticOrderMutation,
  useFilterDiagnosticOrdersQuery,
  useSubmitDiagnosticOrderMutation
} from '@/services/diagnosic-order/diagnosticOrderService';
import {
  useCreateDiagnosticOrderTestMutation,
  useUpdateDiagnosticOrderTestMutation,
  useGetTestsByOrderIdQuery,
  useCancelDiagnosticOrderTestMutation,
  useReviewDiagnosticOrderTestMutation
} from '@/services/diagnosic-order/diagnosticOrderTestService';

import {
  newDiagnosticOrder,
  newDiagnosticOrderTest,
  newDiagnosticTest
} from '@/types/model-types-constructor-new';
import type {
  DiagnosticOrderCreateDTO,
  DiagnosticOrderTestCreateDTO,
  DiagnosticOrderTestUpdateDTO,
  DiagnosticOrderUpdateDTO
} from '@/types/model-types-new';
import {
  DiagnosticOrderTestStatus
} from '@/types/model-types-new';
import { DiagnosticStatus } from '@/types/model-types-new';
import { initialListRequest, initialListRequestId, ListRequest } from '@/types/types';
import CheckIcon from '@rsuite/icons/Check';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import PlusIcon from '@rsuite/icons/Plus';
import DetailsModal from './DetailsModal';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import CancellationModal from '@/components/CancellationModal';
import { useGetPatientAttachmentsListQuery } from '@/services/attachmentService';
import { FaFileArrowDown } from 'react-icons/fa6';
import AttachmentUploadModal from '@/components/AttachmentUploadModal';
import { useLocation } from 'react-router-dom';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import PatientPrevTests from './PatientPrevTests';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetGenericMedicationWithActiveIngredientQuery } from '@/services/medicationsSetupService';
import { newApDrugOrderMedications } from '@/types/model-types-constructor';
import SampleModal from '@/pages/lab-module/SampleModal';
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetDepartmentsQuery } from '@/services/security/departmentService';
import { useEnumOptions } from '@/services/enumsApi';
import TestCardModal from './TestCardModal';

const handleDownload = attachment => {
  const byteCharacters = atob(attachment.fileContent);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: attachment.contentType });

  // Create a temporary element and trigger the download
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = attachment.fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
};

const DiagnosticsOrder = props => {
  const location = useLocation();

  const tableContainerRef = useRef<HTMLDivElement | null>(null);

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

  const toNumericId = (value: any) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'number') return value;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  };

  const resolveFromDepartmentId = () => {
    const selectedDeptId = toNumericId(
      selectedDepartment?.departmentId ??
      selectedDepartment?.id ??
      selectedDepartment?.departmentKey ??
      selectedDepartment?.key
    );
    const selectedDeptName = selectedDepartment?.departmentName ?? selectedDepartment?.name;
    const selectedFacilityId = toNumericId(
      selectedDepartment?.facilityId ?? selectedDepartment?.facilityKey
    );

    if (!selectedDeptId && !selectedDeptName) return undefined;
    if (!departments.length) return selectedDeptId;

    const match =
      departments.find(
        d =>
          toNumericId(d.id ?? d.departmentId ?? d.key ?? d.departmentKey) === selectedDeptId
      ) ??
      departments.find(
        d =>
          selectedDeptName &&
          (d.name ?? d.departmentName) === selectedDeptName &&
          (!selectedFacilityId ||
            toNumericId(d.facilityId ?? d.facilityKey ?? d.facility?.id) === selectedFacilityId)
      );

    return toNumericId(match?.id ?? match?.departmentId ?? match?.key ?? match?.departmentKey);
  };

  const patientId = toNumericId(patient?.id ?? patient?.key);
  const encounterId = toNumericId(encounter?.id ?? encounter?.key);
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const currentUserName =
    authSlice?.user?.login ??
    authSlice?.user?.loginName ??
    authSlice?.user?.username ??
    authSlice?.user?.email ??
    null;
  const [showCanceled, setShowCanceled] = useState(false);
  const [test, setTest] = useState<any>({ ...newDiagnosticTest });
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
  const [searchKeyword] = useState('');
  const [openSampleModal, setOpenSampleModal] = useState(false);
  const [paginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const [filters, setFilters] = useState({
    testName: '',
    type: '',
    category: '',
    catalog: '',
  });


  const diagTypeResponse = useEnumOptions("TestType");


  const queryParams = React.useMemo(() => {
    if (showCanceled) {
      return {
        status: DiagnosticOrderTestStatus.CANCELLED,
      };
    }

    return {
      excludeStatus: [DiagnosticOrderTestStatus.CANCELLED],
    };
  }, [showCanceled]);


  const { data: genericMedicationListResponse } =
    useGetGenericMedicationWithActiveIngredientQuery(searchKeyword);

  const { data: departmentsResponse } = useGetDepartmentsQuery({ page: 0, size: 10000 });

  const departments = departmentsResponse?.data ?? [];

  const [, setOrderMedication] = useState<any>({
    ...newApDrugOrderMedications,
    drugOrderKey: null
  });

  const { data: testsResponse, isFetching } = useGetAllDiagnosticTestsQuery(paginationParams);

  const [listOrdersRequest] = useState<ListRequest>({
    ...initialListRequestId,
    pageSize: 1000
  });

  const [attachmentsListRequest, setAttachmentsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'attachment_type',
        operator: 'match',
        value: 'ORDER_TEST'
      }
    ]
  });

  const testsList = testsResponse?.data ?? [];

  useEffect(() => {
    console.log('🔵 useEffect fired', {
      openTestsModal,
      testsListLength: testsList?.length
    });

    if (openTestsModal) {
      setLeftItems(testsList);
      setSelectedTestsList([]);
    }
  }, [openTestsModal, testsList]);

  const [selectedTestsList, setSelectedTestsList] = useState([]);
  const [leftItems, setLeftItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any>({ ...newDiagnosticOrder });
  const orderId = orders?.id ?? orders?.key ?? null;

  const isSubmitDisabled =
    !orderId || orders?.status !== 'NEW';

  const [orderTest, setOrderTest] = useState<any>({
    ...newDiagnosticOrderTest
  });

  useEffect(() => {
    const selectedIds = new Set(
      selectedTestsList.map(t => t.id ?? t.key)
    );

    const computedLeft = testsList.filter(
      t => !selectedIds.has(t.id ?? t.key)
    );

    setLeftItems(computedLeft);
  }, [testsList, selectedTestsList]);

  const {
    data: fetchPatintAttachmentsResponce,
    refetch: attachmentRefetch,
  } = useGetPatientAttachmentsListQuery(attachmentsListRequest);

  const [selectedRows, setSelectedRows] = useState([]);

  const { data: ordersListResponse, refetch: ordersRefetch } = useFilterDiagnosticOrdersQuery(
    patientId && encounterId
      ? { patientId, encounterId, listRequest: listOrdersRequest }
      : skipToken
  );

  const ordersList = ordersListResponse?.data ?? [];

  const hasOpenOrder = ordersList.some(
    o => o.status === 'NEW' || o.saveDraft === true
  );

  const {
    data: orderTestsResponse,
    refetch: orderTestRefetch,
    isLoading: loadTests
  } = useGetTestsByOrderIdQuery(
    orderId
      ? {
        orderId,
        page: 0,
        size: 1000,
        ...queryParams
      }
      : skipToken
  );


  const orderTestList = orderTestsResponse?.data ?? [];
  const [cancelDiagnosticOrderTest] = useCancelDiagnosticOrderTestMutation();
  const [submitDiagnosticOrder] = useSubmitDiagnosticOrderMutation();
  const [reviewDiagnosticOrderTest] = useReviewDiagnosticOrderTestMutation();
  const [createOrder] = useCreateDiagnosticOrderMutation();
  const [updateOrder] = useUpdateDiagnosticOrderMutation();
  const [createOrderTest] = useCreateDiagnosticOrderTestMutation();
  const [updateOrderTest] = useUpdateDiagnosticOrderTestMutation();
  const [openDetailsModel, setOpenDetailsModel] = useState(false);
  const [openConfirmDeleteModel, setConfirmDeleteModel] = useState(false);
  const [, setSelectedGeneric] = useState(null);
  const [previewDiagnosticsOrder, setPreviewDiagnosticsOrder] = useState<any | null>(null);
  // LOV queries for new fields
  const { data: diagTypesLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_TEST-TYPES');
  const { data: labCategoriesLovResponse } = useGetLovValuesByCodeQuery('LAB_CATEGORIES');
  const { data: radCategoriesLovResponse } = useGetLovValuesByCodeQuery('RAD_CATEGORIES');
  const { data: administrationInstructionsLovQueryResponse } = useGetLovValuesByCodeQuery(
    'MED_ORDER_ADMIN_NSTRUCTIONS'
  );

  const isSelected = rowData => {
    const rowId = rowData?.id ?? rowData?.key;
    const selectedId = orderTest?.id ?? orderTest?.key;
    if (rowId && selectedId && rowId === selectedId) {
      return 'selected-row';
    }
    return '';
  };

  const filteredOrders = ordersList ?? [];

  useEffect(() => {
    if (!attachmentsModalOpen) {
      const updatedFilters = [
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        },
        {
          fieldName: 'attachment_type',
          operator: 'match',
          value: 'ORDER_TEST'
        }
      ];
      setAttachmentsListRequest(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    }
    attachmentRefetch();
  }, [attachmentsModalOpen]);

  useEffect(() => {
    setSelectedCategory('');
  }, [selectedType]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClearDiagnostics();
      }
    };

    const handleGlobalClick = (event: MouseEvent | TouchEvent) => {
      if (isInsideModalOrPopup(event.target)) return;
      if (
        tableContainerRef.current &&
        event.target instanceof Node &&
        tableContainerRef.current.contains(event.target)
      ) {
        return;
      }
      handleClearDiagnostics();
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

  const OpenDetailsModel = () => {
    setOpenDetailsModel(true);
  };

  const OpenConfirmDeleteModel = () => {
    setConfirmDeleteModel(true);
  };
  const CloseConfirmDeleteModel = () => {
    setConfirmDeleteModel(false);
  };


  const resolveOrderType = (testObj?: any) => {
    return (
      testObj?.type ??
      testObj?.testType ??
      testObj?.testTypeLvalue?.valueCode ??
      null
    );
  };

  const handleSaveTest = async () => {
    const receivedDepartmentId =
      orderTest?.receivedDepartmentId ?? orderTest?.receivedLabId ?? undefined;

    const testId = toNumericId(
      orderTest?.testId ??
      orderTest?.test?.id ??
      orderTest?.diagnosticTest?.id ??
      test?.id
    );

    const orderId = toNumericId(orderTest?.orderId ?? orders?.id ?? orders?.key);
    const fromDepartmentId = resolveFromDepartmentId();

    if (!testId || !orderId || !patientId || !encounterId) {
      dispatch(notify({ msg: 'Missing test or patient info', sev: 'warning' }));
      return;
    }

    if (!fromDepartmentId) {
      dispatch(notify({ msg: 'Missing department info', sev: 'error' }));
      return;
    }

    const orderTestId = toNumericId(orderTest?.id ?? orderTest?.key);

    try {

      if (!orderTestId) {
        const createPayload: DiagnosticOrderTestCreateDTO = {
          patientId,
          encounterId,
          orderId,
          testId,
          fromDepartmentId,
          fromFacilityId: toNumericId(selectedDepartment?.facilityId),
          toFacilityId: toNumericId(orderTest?.toFacilityId),
          receivedDepartmentId: toNumericId(receivedDepartmentId),
          reason: orderTest?.reason,
          notes: orderTest?.notes,
          orderType: resolveOrderType(test)
        };

        await createOrderTest(createPayload).unwrap();
      }

      else {
        const updatePayload: DiagnosticOrderTestUpdateDTO = {
          id: orderTestId,
          patientId,
          encounterId,
          orderId,
          testId,
          fromDepartmentId,
          fromFacilityId: toNumericId(selectedDepartment?.facilityId),
          toFacilityId: toNumericId(orderTest?.toFacilityId),
          receivedDepartmentId: toNumericId(receivedDepartmentId),
          reason: orderTest?.reason,
          notes: orderTest?.notes,
          isRepeat: orderTest?.isRepeat,
          repeatEveryNumber: orderTest?.repeatEveryNumber,
          repeatEveryUnit: orderTest?.repeatEveryUnit,
          periodNumber: orderTest?.periodNumber,
          periodUnit: orderTest?.periodUnit,
          firstOccurrenceDateTime: orderTest?.firstOccurrenceDateTime
        };


        await updateOrderTest({
          id: orderTestId,
          body: updatePayload
        }).unwrap();
      }

      setOpenDetailsModel(false);
      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
      await orderTestRefetch?.();

    } catch (error) {
      console.error('Save test failed', error);
      dispatch(notify({ msg: 'Save failed', sev: 'error' }));
    }
  };

  const handleCheckboxChange = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const handleCancle = async () => {
    try {
      console.log('Cancelling IDs:', selectedRows);
      await Promise.all(
        selectedRows.map((itemId: number) =>
          cancelDiagnosticOrderTest({
            id: itemId,
            body: {
              cancellationReason: reson.cancellationReason
            }
          }).unwrap()
        )
      );

      dispatch(notify({ msg: 'Cancelled successfully', sev: 'success' }));
      setSelectedRows([]);
      CloseConfirmDeleteModel();
      await orderTestRefetch();

    } catch (error) {
      console.error('Cancel failed:', error);
      dispatch(notify({ msg: 'Cancel failed', sev: 'error' }));
      CloseConfirmDeleteModel();
    }
  };

  const handleSaveTests = async () => {
    setOpenTestsModal(false);

    const orderId = toNumericId(orders?.id ?? orders?.key);
    const fromDepartmentId = resolveFromDepartmentId();

    if (!orderId || !patientId || !encounterId) {
      dispatch(notify({ msg: 'Missing order or patient info', sev: 'warning' }));
      return;
    }
    if (!fromDepartmentId) {
      dispatch(notify({ msg: 'Missing department info', sev: 'error' }));
      return;
    }

    try {
      const pickTestId = (t: any) =>
        toNumericId(
          t?.testId ??
          t?.id ??
          t?.key ??
          t?.test?.id ??
          t?.diagnosticTest?.id
        );

      await Promise.all(
        selectedTestsList
          .map(item => {
            const testId = pickTestId(item);
            if (!testId) return null;

            return createOrderTest({
              patientId,
              encounterId,
              orderId,
              testId,
              fromDepartmentId,
              fromFacilityId: toNumericId(selectedDepartment?.facilityId),
              orderType: item.type
            }).unwrap();
          })
          .filter(Boolean)
      );

      dispatch(notify({ msg: 'All Tests Saved Successfully', sev: 'success' }));
      await orderTestRefetch();
    } catch (error) {
      console.error('Save tests failed:', error);
      dispatch(notify({ msg: 'Save Failed', sev: 'error' }));
    }
  };

  const handleSaveOrders = async () => {
    if (!patientId || !encounterId) {
      dispatch(notify({ msg: 'Missing patient or encounter', sev: 'warning' }));
      return;
    }

    try {
      const createPayload: DiagnosticOrderCreateDTO = {
        patientId,
        encounterId,
        labStatus: DiagnosticStatus.NEW,
        radStatus: DiagnosticStatus.NEW,
      };

      const response = await createOrder(createPayload).unwrap();

      setOrders(response);
      setOpenTestsModal(true);

      dispatch(
        notify({
          msg: `New Order Created (ID: ${response?.orderNumber ?? response?.id})`,
          sev: 'success'
        })
      );

      await ordersRefetch();
    } catch (error) {
      console.error('Create order failed:', error);
      dispatch(notify({ msg: 'Failed to create order', sev: 'error' }));
    }
  };

  const handleSubmitPres = async () => {
    const orderId = toNumericId(orders?.id ?? orders?.key);
    if (!orderId) {
      dispatch(notify({ msg: 'Missing order id', sev: 'warning' }));
      return;
    }

    if (!orderTestList.length) {
      dispatch(notify({ msg: 'Please add at least one test', sev: 'warning' }));
      return;
    }

    const hasMissingReceivedLab = orderTestList.some(
      t => !t.receivedDepartmentId
    );


    if (hasMissingReceivedLab) {
      dispatch(
        notify({
          msg: 'Please select Received Lab for Your Test',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      await submitDiagnosticOrder(orderId).unwrap();

      dispatch(notify({ msg: 'Submitted Successfully', sev: 'success' }));

      await ordersRefetch();
      await orderTestRefetch();

      setOrders({ ...newDiagnosticOrder });
      handleClearDiagnostics();

    } catch (error) {
      console.error('Submit failed', error);
      dispatch(notify({ msg: 'Submit failed', sev: 'error' }));
    }
  };


  const handleRecall = rowData => {
    const genericMedication = genericMedicationListResponse?.object?.find(
      item => item.key === rowData.genericMedicationsKey
    );

    setOrderMedication({
      ...newApDrugOrderMedications,
      ...rowData,
      drugOrderKey: rowData?.drugOrderKey ?? null,
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
  };

  const handleRequestNewTestSetup = () => {
    dispatch(notify({ msg: 'New Test Setup Request Submitted', sev: 'info' }));
  };

  const handleClearDiagnostics = () => {
    setOrderTest({ ...newDiagnosticOrderTest });
    setTest({ ...newDiagnosticTest });
    setPreviewDiagnosticsOrder(null);
  };


  const addToFavorites = rowData => {
    const rowId = rowData.id ?? rowData.key;

    const alreadyExists = favoriteMedications.some(
      item => item.__rowId === rowId
    );

    if (alreadyExists) {
      setFavoriteMedications(prev =>
        prev.filter(item => item.__rowId !== rowId)
      );

      dispatch(
        notify({
          msg: 'Removed from favorites',
          type: 'info'
        })
      );
    } else {
      setFavoriteMedications(prev => [
        ...prev,
        {
          ...rowData,
          __rowId: rowId   // ✅ المفتاح السحري
        }
      ]);

      dispatch(
        notify({
          msg: 'Added to favorites',
          type: 'success'
        })
      );
    }
  };

  const joinValuesFromArray = values => {
    return values.filter(Boolean).join(', ');
  };

  const tableColumns = [
    {
      key: 'check',
      title: <Translate>#</Translate>,
      flexGrow: 1,
      fullText: true,
      render: rowData => {
        const status = rowData.status;
        const rowId = rowData.id ?? rowData.key;


        return (
          <Checkbox
            checked={selectedRows.includes(rowId)}
            onChange={() => handleCheckboxChange(rowId)}
            disabled={status !== 'NEW'}
          />
        );
      }
    },
    {
      key: 'orderTypeLkey',
      title: <Translate>ORDER TYPE</Translate>,
      flexGrow: 1,
      fullText: true,
      render: rowData => {
        return (
          rowData.orderType ??
          rowData.test?.testTypeLvalue?.lovDisplayVale ??
          rowData.test?.type ??
          ''
        );
      }
    },
    {
      key: 'test',
      title: <Translate>TEST NAME</Translate>,
      flexGrow: 2,
      fullText: true,
      render: rowData =>
        rowData.test?.testName ??
        rowData.test?.name ??
        rowData.testName ??
        rowData.diagnosticTestName ??
        ''
    },
    {
      key: 'internalCode',
      dataKey: 'internalCode',
      title: <Translate>INTERNAL CODE</Translate>,
      flexGrow: 2,
      fullText: true,
      render: rowData =>
        rowData.test?.internalCode ??
        rowData.test?.code ??
        rowData.internalCode ??
        ''
    },
    {
      key: 'status',
      dataKey: 'status',
      title: <Translate>STATUS</Translate>,
      flexGrow: 1,
      fullText: true,
      render: rowData =>
        rowData.status ??
        rowData.statusLvalue?.lovDisplayVale ??
        rowData.statusLkey ??
        ''
    },
    {
      key: 'receivedDepartmentId',
      dataKey: 'receivedDepartmentId',
      title: <Translate>RECEIVED LAB</Translate>,
      fullText: true,
      flexGrow: 1,
      render: rowData =>
        rowData.receivedDepartmentId ?? rowData.receivedLabId ?? ''
    },
    {
      key: 'processingStatusLkey',
      dataKey: 'processingStatusLkey',
      title: <Translate>PROCESSING STATUS</Translate>,
      flexGrow: 1,
      fullText: true,
      render: rowData =>
        rowData.processingStatus ??
        rowData.processingStatusLvalue?.lovDisplayVale ??
        rowData.processingStatusLkey ??
        ''
    },
    {
      key: 'reasonLkey',
      dataKey: 'reasonLkey',
      title: <Translate>REASON</Translate>,
      flexGrow: 1,
      fullText: true,
      render: rowData =>
        rowData.reason ??
        rowData.reasonLvalue?.lovDisplayVale ??
        rowData.reasonLkey ??
        ''
    },
    {
      key: 'priorityLkey',
      dataKey: 'priorityLkey',
      title: <Translate>priority</Translate>,
      flexGrow: 1,
      fullText: true,
      render: rowData =>
        rowData.priorityLvalue?.lovDisplayVale ?? rowData.priorityLkey ?? ''
    },
    {
      key: 'notes',
      dataKey: 'notes ',
      title: <Translate>NOTES</Translate>,
      fullText: true,
      flexGrow: 1
    },
    {
      key: '',
      dataKey: '',
      title: <Translate>ATTACHED FILE</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const rowId = rowData?.id ?? rowData?.key;
        const matchingAttachments = fetchPatintAttachmentsResponce?.object?.filter(
          item => item.referenceObjectKey === rowId
        );
        const lastAttachment = matchingAttachments?.[matchingAttachments.length - 1];

        return (
          <HStack spacing={2}>
            {lastAttachment && (
              <FaFileArrowDown
                size={20}
                fill="var(--primary-gray)"
                onClick={() => handleDownload(lastAttachment)}
                style={{ cursor: 'pointer' }}
              />
            )}

            <MdAttachFile
              size={20}
              fill="var(--primary-gray)"
              onClick={() => {
                setOrderTest(rowData);
                setAttachmentsModalOpen(true);
              }}
              style={{ cursor: 'pointer' }}
            />
          </HStack>
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
        const rowId = rowData.id ?? rowData.key;
        const isLaboratory =
          rowData.orderType === 'LABORATORY' ||
          rowData.test?.type === 'LABORATORY';

        const isInFavorites = favoriteMedications.some(
          item => item.__rowId === rowId
        );

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

            <Whisper placement="top" speaker={<Tooltip>Edit</Tooltip>}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <MdModeEdit
                  onClick={() => {
                      setOrderTest(rowData);
                      setTest(rowData.test ?? newDiagnosticTest);
                      setOpenDetailsModel(true);
                    }}
                  className="icons-styles"
                  color="var(--primary-gray)"
                />
              </span>
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
            {isLaboratory && (
              <Whisper placement="top" speaker={<Tooltip>Collect Sample</Tooltip>}>
                <HStack spacing={10}>
                  <FontAwesomeIcon
                    icon={faVialCircleCheck}
                    className="icons-styles"
                    color="var(--primary-gray)"
                    onClick={() => {
                      setOrderTest(rowData);
                      setTest(rowData.test);
                      setOpenSampleModal(true);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </HStack>
              </Whisper>
            )}
            {/*  */}
            <Whisper placement="top" speaker={<Tooltip>Test card</Tooltip>}>
              <HStack spacing={10}>
                <FontAwesomeIcon
                  icon={faCreditCard}
                  className="icons-styles"
                  color="var(--primary-gray)"
                  onClick={() => {
                    setOrderTest(rowData);
                    setTest(rowData.test);
                    setTestCardModal(true);
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </HStack>
            </Whisper>

            {/*  */}
            <Whisper
              placement="top"
              speaker={
                <Tooltip>{isInFavorites ? 'Remove from favorites' : 'Add to favorites'}</Tooltip>
              }
            >
              <FontAwesomeIcon
                icon={faStar}
                onClick={() => addToFavorites(rowData)}
                className={isInFavorites ? 'font-awsy icons-styless' : 'font-aws icons-styless'}
              />
            </Whisper>
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



  const testsMap = React.useMemo(() => {
    return new Map(testsList.map(t => [t.id, t]));
  }, [testsList]);


  const normalizedOrderTestList = React.useMemo(() => {
    return orderTestList.map(orderTest => {
      const test = testsMap.get(orderTest.testId);

      return {
        ...orderTest,
        test,
        orderType: orderTest.orderType ?? test?.type
      };
    });
  }, [orderTestList, testsMap]);

  useEffect(() => {
    if (!ordersList?.length) return;

    if (orders?.id || orders?.key) return;
    const draftOrder = ordersList.find(
      o => o.saveDraft === true && o.status === 'NEW'
    );

    if (draftOrder) {
      setOrders(draftOrder);
    }
  }, [ordersList]);

  return (
    <>
      <div className="main-container">
        {/* Enhanced Header with New Fields */}
        <div className="enhanced-header">
          {/* First Row - Existing Order Selector and Basic Controls */}
          <div className="header-first-row">
            {/* Select */}

            <SelectPicker
              data={filteredOrders ?? []}
              labelKey="orderNumber"   // ✅
              valueKey="id"
              placeholder="Orders"
              value={orders?.id ?? null}
              onChange={value => {
                const selectedItem =
                  filteredOrders.find(item => item.id === value) ??
                  newDiagnosticOrder;
                setOrders(selectedItem);
                handleClearDiagnostics();
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
                <div className="prescripton-number-style">{orders?.orderNumber ?? '_'}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="buttons-group">
              <MyButton
                loading={isFetching}
                onClick={handleSaveOrders}
                prefixIcon={() => <PlusIcon />}
                disabled={hasOpenOrder}
              >
                New Order
              </MyButton>


              <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faLandMineOn} />}
                onClick={() => setOrders({ ...orders, isUrgent: !orders.isUrgent })}
                backgroundColor={orders.isUrgent ? 'var(--primary-orange)' : 'var(--primary-blue)'}
                disabled={
                  edit
                    ? true
                    : orders.id ?? orders.key
                      ? orders?.status !== 'NEW' && orders?.statusLkey !== '164797574082125'
                      : true
                }
              >
                Urgent
              </MyButton>
            </div>
          </div>

          {/* Second Row - New Header Fields */}
          <div className="header-second-row">
            <Form fluid layout="inline">

              {/* Test Name */}
              <MyInput
                column
                width={120}
                fieldName="testName"
                fieldType="text"
                fieldLabel="Test Name"
                record={filters}
                setRecord={setFilters}
              />

              {/* Type */}
              <MyInput
                column
                width={120}
                fieldName="type"
                fieldType="select"
                selectData={diagTypeResponse ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={filters}
                setRecord={rec =>
                  setFilters({
                    ...rec,
                    category: '',
                    catalog: '',
                  })
                }
                searchable={false}
              />

              {/* Category */}
              {filters.type && (
                <MyInput
                  column
                  fieldName="category"
                  fieldType="select"
                  fieldLabel="Category"
                  width={120}
                  selectData={
                    filters.type === '862810597620632'
                      ? labCategoriesLovResponse?.object ?? []
                      : filters.type === '862828331135792'
                        ? radCategoriesLovResponse?.object ?? []
                        : []
                  }
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={filters}
                  setRecord={setFilters}
                  searchable={false}
                />
              )}

              {/* Catalog */}
              <MyInput
                fieldName="catalog"
                column
                fieldType="select"
                record={filters}
                setRecord={setFilters}
                selectData={[]}
                selectDataLabel="name"
                selectDataValue="key"
                width={120}
                searchable={false}
              />

            </Form>
          </div>


          {/* Third Row - Action Buttons */}
          <div className="header-third-row">
            {/* Request New Test Setup */}
            <MyButton onClick={handleRequestNewTestSetup} appearance="ghost">
              <FontAwesomeIcon icon={faVial} />
              Request New TestSetup
            </MyButton>
            {/* Recall Favorite */}
            <MyButton onClick={() => setOpenFavoritesModal(true)}>
              <FontAwesomeIcon icon={faStar} />
              Recall Favorite
            </MyButton>

            <MyButton
              onClick={handleSubmitPres}
              disabled={isSubmitDisabled}
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
                checked={showCanceled}
                disabled={!orderId}
                onChange={() => setShowCanceled(prev => !prev)}
              >
                Show Canceled
              </Checkbox>

              <MyButton
                disabled={orders.id == null && orders.key == null}
                onClick={() => setOpenTestsModal(true)}
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Test
              </MyButton>
              <MyButton
                disabled={
                  orders.id ?? orders.key ? selectedRows.length === 0 : true
                }
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
            loading={loadTests}
            data={orderId ? normalizedOrderTestList : []}
            onRowClick={rowData => {
              setOrderTest(rowData);
              setTest(rowData.test ?? newDiagnosticTest);
              setPreviewDiagnosticsOrder(rowData);
            }}
            rowClassName={isSelected}
          />


        </div>

        <PreviewDiagnosticsOrder
          open={!!previewDiagnosticsOrder}
          setOpen={setPreviewDiagnosticsOrder}
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

      <AttachmentUploadModal
        isOpen={attachmentsModalOpen}
        setIsOpen={setAttachmentsModalOpen}
        actionType={'add'}
        refecthData={attachmentRefetch}
        attachmentSource={orderTest}
        attatchmentType="ORDER_TEST"
        patientKey={patientId ?? patient?.key}
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

      <MyModal
        open={testCardModal}
        setOpen={setTestCardModal}
        title="Test Card"
        size="45vw"
        position='center'
        content={
          <TestCardModal
            orderTest={orderTest}
            test={test}
          />
        }
      />



    </>
  );
};

export default DiagnosticsOrder;
