import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  useCreateDiagnosticOrderMutation,
  useFilterDiagnosticOrdersQuery,
  useSubmitDiagnosticOrderMutation,
  useUpdateDiagnosticOrderMutation
} from '@/services/diagnosic-order/diagnosticOrderService';
import {
  useCancelDiagnosticOrderTestMutation,
  useCreateDiagnosticOrderTestMutation,
  useFilterDiagnosticOrderTestsQuery,
  useReviewDiagnosticOrderTestMutation,
  useUpdateDiagnosticOrderTestMutation
} from '@/services/diagnosic-order/diagnosticOrderTestService';
import { formatDateWithoutSeconds } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import {
  faCreditCard,
  faLandMineOn,
  faListCheck,
  faPlus,
  faVial
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import PreviewDiagnosticsOrder from './PreviewDiagnosticsOrder';
import TransferList from './TransferTestList';
import './styles.less';

import AttachmentUploadModal from '@/components/AttachmentUploadModal';
import CancellationModal from '@/components/CancellationModal';
import SampleModal from '@/pages/lab-module/SampleModal';
import { useGetFavoriteDiagnosticTestsByUserQuery } from '@/services/diagnosic-order/favoriteDiagnosticTestService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetDepartmentsQuery } from '@/services/security/departmentService';
import { useGetAllDiagnosticTestsQuery, useGetDiagnosticTestsByIdsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  newDiagnosticOrder,
  newDiagnosticOrderTest,
  newDiagnosticTest
} from '@/types/model-types-constructor-new';
import type {
  DiagnosticOrderCreateDTO,
  DiagnosticOrderTestCreateDTO,
  DiagnosticOrderTestUpdateDTO
} from '@/types/model-types-new';
import {
  DiagnosticOrderTestStatus,
  DiagnosticStatus
} from '@/types/model-types-new';
import { formatEnumString } from '@/utils';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { skipToken } from '@reduxjs/toolkit/query';
import CheckIcon from '@rsuite/icons/Check';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import PlusIcon from '@rsuite/icons/Plus';
import { FaFileArrowDown, FaIdCard } from 'react-icons/fa6';
import { useLocation } from 'react-router-dom';
import BulkAssignDepartmentModal from './BulkAssignDepartmentModal';
import DetailsModal from './DetailsModal';
import PatientPrevTests from './PatientPrevTests';
import RecallFavoriteDiagnosticOrdersModal from './RecallFavoriteDiagnosticOrdersModal';
import RequestTestModal from './RequestTestModal';
import TestCardModal from './TestCardModal';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';

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

const extractErrorMessage = (error: any) => {
  const data = error?.data;

  let msg =
    data?.properties?.message ||
    data?.message ||
    data?.detail ||
    data?.title ||
    error?.error ||
    'Operation failed';
  if (typeof msg === 'string' && msg.startsWith('error.')) {
    msg = msg.replace(/^error\./, '');
  }

  return msg;
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


  const patient = location.state?.patient;

  const encounter = location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;
  const toNumericId = (value: any) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'number') return value;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  };

  const resolveFromDepartmentId = () => {
    const selectedDeptId = selectedDepartment?.departmentId;
    const selectedDeptName = selectedDepartment?.departmentName ?? selectedDepartment?.name;
    const selectedFacilityId = selectedDepartment?.facilityId;


    if (!selectedDeptId && !selectedDeptName) return undefined;
    if (!departments.length) return selectedDeptId;

    const match =
      departments.find(
        d =>
          d.id === selectedDeptId
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

  const patientId = patient?.id || patient?.key;
  const encounterId = encounter?.id || encounter?.key;
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const [showCanceled, setShowCanceled] = useState(false);
  const [test, setTest] = useState<any>({ ...newDiagnosticTest });
  const [reson, setReson] = useState({ cancellationReason: '' });
  const [openTestsModal, setOpenTestsModal] = useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [openRequestTestModal, setOpenRequestTestModal] = useState(false);
  const [searchType, setSearchType] = useState<{
    type?: string;
    catalogId?: number;
  }>({});
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [recallFavoriteModal, setRecallFavoriteModal] = useState(false);
  const [preTestAssessmentModal, setPreTestAssessmentModal] = useState(false);
  const [collectSampleModal, setCollectSampleModal] = useState(false);
  const [testCardModal, setTestCardModal] = useState(false);
  const [openFavoritesModal, setOpenFavoritesModal] = useState(false);
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
    return {};
  }
  return {
    excludeStatus: [DiagnosticOrderTestStatus.CANCELLED],
  };
}, [showCanceled]);

  const normalizeOrderTest = rowData => ({
    ...rowData,
    reasonLkey: rowData.reasonLkey ?? rowData.reason
  });



  const { data: departmentsResponse } = useGetDepartmentsQuery({ page: 0, size: 10000 });

  const departments = departmentsResponse?.data ?? [];

  const { data: testsResponse, isFetching } = useGetAllDiagnosticTestsQuery(paginationParams);

  const testsList = testsResponse?.data ?? [];

  useEffect(() => {
    if (openTestsModal) {
      setLeftItems(testsList);
      setSelectedTestsList([]);
    }
  }, [openTestsModal, testsList]);

  const [selectedTestsList, setSelectedTestsList] = useState([]);
  const [leftItems, setLeftItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any>({ ...newDiagnosticOrder });
  const orderId = orders?.id ?? orders?.key ?? null;
  const [tableVersion, setTableVersion] = useState(0);
  const [bulkDepartmentModalOpen, setBulkDepartmentModalOpen] = useState(false);


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


  const [selectedRows, setSelectedRows] = useState([]);

  const { data: ordersListResponse, refetch: ordersRefetch } = useFilterDiagnosticOrdersQuery(
    patientId && encounterId
      ? { patientId, encounterId }
      : skipToken
  );

  const ordersList = ordersListResponse?.data ?? [];

  const hasOpenOrder = ordersList.some(
    o => o.status === 'NEW' || o.saveDraft === true
  );

  const cleanFilters = (filters: any) => {

    const cleaned: any = Object.fromEntries(
      Object.entries(filters).filter(
        ([, value]) => value !== '' && value !== null && value !== undefined
      )
    );
    if (cleaned.type) {
      cleaned.orderType = cleaned.type;
      delete cleaned.type;
    }
    return cleaned;
  };

  const cleanedFilters = React.useMemo(
    () => cleanFilters(filters),
    [filters]
  );

  const {
    data: orderTestsResponse,
    refetch: orderTestRefetch,
    isLoading: loadTests
  } = useFilterDiagnosticOrderTestsQuery(
    orderId
      ? {
        orderId,
        page: 0,
        size: 1000,
        ...cleanedFilters,
        ...queryParams
      }
      : skipToken
  );

  const userId = authSlice?.user?.id;

  const { data: favoriteLinks } =
    useGetFavoriteDiagnosticTestsByUserQuery(
      userId ? { userId } : skipToken
    );

  const favoriteTestIds = useMemo(
    () => favoriteLinks?.map(f => f.testId) ?? [],
    [favoriteLinks]
  );

  const { data: favoriteTests, isFetching: loadingFavorites } =
    useGetDiagnosticTestsByIdsQuery(
      favoriteTestIds.length
        ? { ids: favoriteTestIds }
        : skipToken
    );

  const orderTestList = orderTestsResponse?.data ?? [];
  const [cancelDiagnosticOrderTest] = useCancelDiagnosticOrderTestMutation();
  const [submitDiagnosticOrder] = useSubmitDiagnosticOrderMutation();
  const [createOrder] = useCreateDiagnosticOrderMutation();
  const [updateOrder] = useUpdateDiagnosticOrderMutation();
  const [createOrderTest] = useCreateDiagnosticOrderTestMutation();
  const [updateOrderTest] = useUpdateDiagnosticOrderTestMutation();
  const [openDetailsModel, setOpenDetailsModel] = useState(false);
  const [openConfirmDeleteModel, setConfirmDeleteModel] = useState(false);
  const [previewDiagnosticsOrder, setPreviewDiagnosticsOrder] = useState<any | null>(null);
  const { data: labCategoriesLovResponse } = useGetLovValuesByCodeQuery('LAB_CATEGORIES');
  const { data: radCategoriesLovResponse } = useGetLovValuesByCodeQuery('RAD_CATEGORIES');
  const { data: ReasonLovQueryResponse } =
    useGetLovValuesByCodeQuery('DIAG_ORD_REASON');

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
    try {
      const receivedDepartmentId =
        orderTest?.receivedDepartmentId ?? orderTest?.receivedLabId ?? undefined;

      const testId = toNumericId(
        orderTest?.testId ??
        orderTest?.test?.id ??
        orderTest?.diagnosticTest?.id ??
        test?.id
      );

      const orderId = toNumericId(
        orderTest?.orderId ?? orders?.id ?? orders?.key
      );

      const fromDepartmentId = resolveFromDepartmentId();
      const orderTestId = toNumericId(orderTest?.id ?? orderTest?.key);

      if (!testId || !orderId || !patientId || !encounterId) {
        dispatch(notify({ msg: 'Missing test or patient info', sev: 'warning' }));
        return;
      }

      if (!fromDepartmentId) {
        dispatch(notify({ msg: 'Missing department info', sev: 'error' }));
        return;
      }

      if (!orderTestId) {
        const createPayload: DiagnosticOrderTestCreateDTO = {
          orderId,
          testId,
          receivedDepartmentId: toNumericId(receivedDepartmentId),
          reason: orderTest?.reasonLkey,
          notes: orderTest?.notes,
          orderType: resolveOrderType(test),
        };

        await createOrderTest(createPayload).unwrap();
      }

      else {
        const updatePayload: DiagnosticOrderTestUpdateDTO = {
          id: orderTestId,
          orderId,
          testId,
          receivedDepartmentId: toNumericId(receivedDepartmentId),
          reason: orderTest?.reasonLkey,
          notes: orderTest?.notes,
        };

        await updateOrderTest({
          id: orderTestId,
          body: updatePayload,
        }).unwrap();
      }

      if (orderId) {
        await orderTestRefetch();
        setTableVersion(v => v + 1);
      }

      setOpenDetailsModel(false);
      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));

    } catch (error: any) {
      console.error('Save test failed', error);

      dispatch(
        notify({
          msg: extractErrorMessage(error),
          sev: 'error'
        })
      );
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
              orderId,
              testId,
              orderType: item.type
            }).unwrap();
          })
          .filter(Boolean)
      );

      dispatch(notify({ msg: 'All Tests Saved Successfully', sev: 'success' }));
      await orderTestRefetch();
    } catch (error: any) {
      console.error('Save tests failed:', error);

      dispatch(
        notify({
          msg: extractErrorMessage(error),
          sev: 'error'
        })
      );
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
        fromDepartmentId: selectedDepartment?.departmentId,
        fromFacilityId: selectedDepartment?.facilityId,
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
    const orderId = orders?.id;
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
      await updateOrder({
        id: orderId,
        body: {
          id: orderId,
          patientId,
          encounterId,
          isUrgent: orders.isUrgent,
        }
      }).unwrap();

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



  const handleRequestNewTestSetup = () => {
    setOpenRequestTestModal(true);
  };

  const handleClearDiagnostics = () => {
    setOrderTest({ ...newDiagnosticOrderTest });
    setTest({ ...newDiagnosticTest });
    setPreviewDiagnosticsOrder(null);
  };

  const resolveReasonLabel = (reasonKey?: string) =>
    ReasonLovQueryResponse?.object?.find(
      r => String(r.key) === String(reasonKey)
    )?.lovDisplayVale ?? reasonKey ?? '';

  const handleEdit = rowData => {
    setOrderTest({
      ...rowData,
      reasonLkey: rowData.reasonLkey ?? rowData.reason
    });

    if (!ReasonLovQueryResponse?.object?.length) {
      return;
    }

    setOpenDetailsModel(true);
  };

  const testsMap = React.useMemo(() => {
    return new Map(testsList.map(t => [t.id, t]));
  }, [testsList]);

      const STATUS_PRIORITY: Record<string, number> = {
        NEW: 1,
        IN_PROGRESS: 2,
        COMPLETED: 3,
        CANCELLED: 4
      };

    const normalizedOrderTestList = React.useMemo(() => {
      return [...orderTestList]
        .map(orderTest => {
          const test = testsMap.get(orderTest.testId);
          return {
            ...orderTest,
            test,
            orderType: orderTest.orderType ?? test?.type
          };
        })
        .sort((a, b) => {
          const aPriority = STATUS_PRIORITY[a.status] ?? 99;
          const bPriority = STATUS_PRIORITY[b.status] ?? 99;
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
        });
    }, [orderTestList, testsMap]);

  const selectableRowIds = useMemo(
    () =>
      normalizedOrderTestList
        .filter(row => row.status === 'NEW')
        .map(row => Number(row.id))
        .filter(Boolean),
    [normalizedOrderTestList]
  );

  const isAllSelected =
    selectableRowIds.length > 0 &&
    selectableRowIds.every(id => selectedRows.includes(id));

  const isIndeterminate =
    selectedRows.length > 0 && !isAllSelected;




  const tableColumns = [
    {
      key: 'check',
      title: (
        <Checkbox
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          disabled={selectableRowIds.length === 0}
          onChange={(_, checked) => {
            setSelectedRows(checked ? selectableRowIds : []);
          }}
        />
      ),
      flexGrow: 1,
      render: rowData => {
        const rowId = Number(rowData.id);
        const isDisabled = rowData.status !== 'NEW';

        return (
          <Checkbox
            checked={selectedRows.includes(rowId)}
            disabled={isDisabled}
            onChange={() => handleCheckboxChange(rowId)}
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
        return <>{formatEnumString(
          rowData.orderType)}</>
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
      render: rowData => {
        return <>{formatEnumString(
          rowData.status)}</>
      }
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
      render: rowData => {
        return <>{formatEnumString(
          rowData.processingStatus)}</>
      }
    },
    {
      key: 'reason',
      title: <Translate>REASON</Translate>,
      flexGrow: 1,
      fullText: true,
      render: rowData =>
        resolveReasonLabel(rowData.reason ?? rowData.reasonLkey)
    },
    {
      key: 'notes',
      title: <Translate>NOTES</Translate>,
      flexGrow: 1,
      render: rowData => rowData.notes ?? ''
    },
    {
      key: 'attachments',
      title: <Translate>ATTACHMENTS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => (
        <MdAttachFile
          size={20}
          fill={rowData?.id ? 'var(--primary-gray)' : '#ccc'}
          style={{ cursor: rowData?.id ? 'pointer' : 'not-allowed' }}
          onClick={() => {
            if (!rowData?.id) return;
            setTest(rowData);
            setAttachmentsModalOpen(true);
          }}
        />
      )
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
        const rowId = rowData.id;

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
                  onClick={() => handleEdit(rowData)}
                  className="icons-styles"
                  color="var(--primary-gray)"
                />
              </span>
            </Whisper>

            <Whisper placement="top" speaker={<Tooltip>Pre-test assessment</Tooltip>}>
              <FontAwesomeIcon
                color="var(--primary-gray)"
                className="icons-styles"
                icon={faListCheck}
              />
            </Whisper>
            <Whisper placement="top" speaker={<Tooltip>Test card</Tooltip>}>
              <HStack spacing={10}>
                <FontAwesomeIcon
                  icon={faCreditCard}
                  className="icons-styles"
                  color="var(--primary-gray)"
                  onClick={() => {
                    setOrderTest(normalizeOrderTest(rowData));
                    setTest(rowData.test);
                    setTestCardModal(true);
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </HStack>
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


  const handleRecallFavoriteTest = async (test: any) => {
    const orderId = orders?.id;

    if (!orderId || !patientId || !encounterId) {
      dispatch(notify({ msg: 'Missing order or patient info', sev: 'warning' }));
      return;
    }

    try {
      await createOrderTest({
        orderId,
        testId: test.id,
        orderType: test.type
      }).unwrap();

      dispatch(notify({ msg: 'Test recalled successfully', sev: 'success' }));
      setOpenFavoritesModal(false);
      await orderTestRefetch();

    } catch (error: any) {
      const msg = extractErrorMessage(error);

      dispatch(
        notify({
          msg:
            msg.toLowerCase().includes('already')
              ? 'This test already ordered'
              : msg,
          sev:
            msg.toLowerCase().includes('already')
              ? 'warning'
              : 'error'
        })
      );
    }

  };



  useEffect(() => {
    if (!ordersList?.length) return;

    if (orders?.id) return;
    const draftOrder = ordersList.find(
      o => o.saveDraft === true && o.status === 'NEW'
    );

    if (draftOrder) {
      setOrders(draftOrder);
    }
  }, [ordersList]);

  const selectedOrderTests = useMemo(
    () =>
      normalizedOrderTestList.filter(row =>
        selectedRows.includes(row.id)
      ),
    [normalizedOrderTestList, selectedRows]
  );


  return (
    <>
      <div className="main-container">
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
                    : orders.id
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
                width={160}
                fieldName="testName"
                fieldType="text"
                fieldLabel="Test Name"
                record={filters}
                setRecord={setFilters}
              />

              {/* Type */}
              <MyInput
                column
                width={160}
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
                  width={240}
                  selectData={
                    filters.type === 'LABORATORY'
                      ? labCategoriesLovResponse?.object ?? []
                      : filters.type === 'RADIOLOGY'
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

            </Form>
          </div>

          <div className="header-third-row">
            <MyButton onClick={handleRequestNewTestSetup} appearance="ghost">
              <FontAwesomeIcon icon={faVial} />
              Request New TestSetup
            </MyButton>
            {/* Recall Favorite */}
            <MyButton onClick={() => setRecallFavoriteModal(true)}>
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
                disabled={orders.id == null}
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
              <MyButton
                disabled={selectedRows.length === 0}
                onClick={() => setBulkDepartmentModalOpen(true)}
              >
                Assign Department
              </MyButton>
            </div>
          </div>
        </Row>
      </div>
      <Row className="table-row-margins">
        <div ref={tableContainerRef}>

          <MyTable
            key={`${orderId}-${tableVersion}`}
            columns={tableColumns}
            loading={loadTests}
            data={orderId ? normalizedOrderTestList : []}
            onRowClick={rowData => {
              setOrderTest(normalizeOrderTest(rowData));
              setTest(rowData.test ?? newDiagnosticTest);
              setPreviewDiagnosticsOrder(rowData);
            }}
            rowClassName={isSelected}
          />



        </div>

        <PreviewDiagnosticsOrder
          open={!!previewDiagnosticsOrder}
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
        title={`Attachments - ${test?.test?.testName ?? test?.testName ?? ''}`}
        size="lg"
        hideActionBtn
        content={
          <EncounterAttachment
            localEncounter={encounter}
            source="DIAGNOSTIC_ORDER_ATTACHMENT"
            sourceId={test?.id ? Number(test.id) : undefined}
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

      <MyModal
        open={preTestAssessmentModal}
        setOpen={setPreTestAssessmentModal}
        title="Pre-test Assessment"
        size="70vw"
        content={
          <div className="modal-content-padding">
            <p>Pre-test assessment checklist and requirements...</p>
          </div>
        }
      />

      <MyModal
        open={collectSampleModal}
        setOpen={setCollectSampleModal}
        title="Laboratory Sample Collection"
        size="60vw"
        content={
          <div className="modal-content-padding">
            <p>Sample collection interface and tracking...</p>
          </div>
        }
      />

      <RequestTestModal
        open={openRequestTestModal}
        setOpen={setOpenRequestTestModal}
        fromDepartmentId={resolveFromDepartmentId()}
        fromFacilityId={selectedDepartment?.facilityId}
        onSuccess={() => {
        }}
      />

      <MyModal
        open={testCardModal}
        setOpen={setTestCardModal}
        title="Test Card"
        size="42vw"
        position='center'
        steps={[{ title: '', icon: <FontAwesomeIcon icon={faCreditCard} /> }]}
        content={
          <TestCardModal
            orderTest={orderTest}
            test={test}
          />
        }
      />

      <BulkAssignDepartmentModal
        open={bulkDepartmentModalOpen}
        setOpen={setBulkDepartmentModalOpen}
        selectedRows={selectedRows}
        orderTests={selectedOrderTests}
        onSuccess={() => {
          orderTestRefetch();
          setSelectedRows([]);
        }}
      />

      <RecallFavoriteDiagnosticOrdersModal
        open={recallFavoriteModal}
        setOpen={setRecallFavoriteModal}
        favoriteTests={favoriteTests ?? []}
        loading={loadingFavorites}
        onRecall={tests => {
          Promise.all(
            tests.map(test =>
              handleRecallFavoriteTest(test)
            )
          );
        }}
      />


    </>
  );
};

export default DiagnosticsOrder;
