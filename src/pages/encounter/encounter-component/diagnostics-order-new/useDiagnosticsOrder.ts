import React, { useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

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
  useUpdateDiagnosticOrderTestMutation
} from '@/services/diagnosic-order/diagnosticOrderTestService';

import { useGetFavoriteDiagnosticTestsByUserQuery } from '@/services/diagnosic-order/favoriteDiagnosticTestService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetDepartmentsQuery } from '@/services/security/departmentService';
import {
  useGetAllActiveDiagnosticTestsQuery,
  useGetDiagnosticTestsByIdsQuery
} from '@/services/setup/diagnosticTest/diagnosticTestService';
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

import { DiagnosticOrderTestStatus, DiagnosticStatus } from '@/types/model-types-new';
import { useGetAgeGroupsQuery } from '@/services/setup/ageGroupService';
import { formatEnumString } from '@/utils';

type UseDiagnosticsOrderArgs = {
  patient?: any;
  encounter?: any;
  edit?: boolean;
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

export const useDiagnosticsOrder = ({ patient, encounter, edit }: UseDiagnosticsOrderArgs) => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const patientId = patient?.id;
  const encounterId = encounter?.id;

  const tableContainerRef = React.useRef<HTMLDivElement | null>(null);

  const toNumericId = (value: any) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'number') return value;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  };

  // UI state
  const [showCanceled, setShowCanceled] = useState(false);
  const [test, setTest] = useState<any>({ ...newDiagnosticTest });

  const [openTestsModal, setOpenTestsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<{ type?: string; catalogId?: number }>({});

  const [openRequestTestModal, setOpenRequestTestModal] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);

  const [recallFavoriteModal, setRecallFavoriteModal] = useState(false);

  const [collectSampleModal, setCollectSampleModal] = useState(false);
  const [testCardModal, setTestCardModal] = useState(false);
  const [rescheduleAppointmentsModalOpen, setRescheduleAppointmentsModalOpen] = useState(false);
  const [selectedOrderTestForReschedule, setSelectedOrderTestForReschedule] = useState<any>(null);
  const [reson, setReson] = useState<{ cancellationReason: string }>({
    cancellationReason: ''
  });

  const [bulkDepartmentModalOpen, setBulkDepartmentModalOpen] = useState(false);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc',
    // timestamp: Date.now()

  });


  const [filters, setFilters] = useState({
    testName: '',
    type: '',
    category: '',
    catalog: ''
  });

  const diagTypeResponse = useEnumOptions('TestType');

  const queryParams = useMemo(() => {
    if (showCanceled) return {};
    return { excludeStatus: [DiagnosticOrderTestStatus.CANCELLED] };
  }, [showCanceled]);

  const normalizeOrderTest = (rowData: any) => ({
    ...rowData,
    reason: rowData.reason
  });

  // Lookups
  const { data: departmentsResponse } = useGetDepartmentsQuery({ page: 0, size: 10000 });
  const departments = departmentsResponse?.data ?? [];

  const resolveFromDepartmentId = () => {
    const selectedDeptId = selectedDepartment?.departmentId;
    const selectedDeptName = selectedDepartment?.departmentName ?? selectedDepartment?.name;
    const selectedFacilityId = selectedDepartment?.facilityId;

    if (!selectedDeptId && !selectedDeptName) return undefined;
    if (!departments.length) return selectedDeptId;

    const match =
      departments.find((d: any) => d.id === selectedDeptId) ??
      departments.find((d: any) => {
        return (
          selectedDeptName &&
          (d.name ?? d.departmentName) === selectedDeptName &&
          (!selectedFacilityId ||
            toNumericId(d.facilityId ?? d.facilityKey ?? d.facility?.id) === selectedFacilityId)
        );
      });

    return toNumericId(match?.id ?? match?.departmentId ?? match?.key ?? match?.departmentKey);
  };

  const [allTests, setAllTests] = useState<any[]>([]);



  const { data: testsResponse, isFetching } = useGetAllActiveDiagnosticTestsQuery(paginationParams);

  const testsList = allTests;

  useEffect(() => {
    if (!testsResponse?.data) return;

    setAllTests(prev => {
      const existingIds = new Set(prev.map(x => x.id));
      const newData = testsResponse.data.filter(x => !existingIds.has(x.id));
      return [...prev, ...newData];
    });
  }, [testsResponse]);

  const { data: ageGroupsResponse } = useGetAgeGroupsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });


  const handleLoadMore = () => {
    setPaginationParams(prev => ({
      ...prev,
      page: prev.page + 1
    }));
  };

  const ageGroupsList = ageGroupsResponse?.data ?? [];

  // Transfer list state
  const [selectedTestsList, setSelectedTestsList] = useState<any[]>([]);
  const [leftItems, setLeftItems] = useState<any[]>([]);

  useEffect(() => {
    if (openTestsModal) {
      setLeftItems(testsList);
      setSelectedTestsList([]);
    }
  }, [openTestsModal, testsList]);

  useEffect(() => {
    const selectedIds = new Set(selectedTestsList.map(t => t.id ?? t.key));
    const computedLeft = testsList.filter(t => !selectedIds.has(t.id ?? t.key));
    setLeftItems(computedLeft);
  }, [testsList, selectedTestsList]);

  // Orders
  const [orders, setOrders] = useState<any>({ ...newDiagnosticOrder });
  const orderId = orders?.id ?? orders?.key ?? null;

  const isSubmitDisabled = !orderId || orders?.status !== 'NEW';

  const { data: ordersListResponse, refetch: ordersRefetch } = useFilterDiagnosticOrdersQuery(
    patientId && encounterId ? { patientId, encounterId } : skipToken
  );

  const ordersList = ordersListResponse?.data ?? [];

  const hasOpenOrder = ordersList.some((o: any) => o.status === 'NEW' || o.saveDraft === true);

  // OrderTest
  const [orderTest, setOrderTest] = useState<any>({ ...newDiagnosticOrderTest });
  const [tableVersion, setTableVersion] = useState(0);

  // selection
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const cleanFilters = (f: any) => {
    const cleaned: any = Object.fromEntries(
      Object.entries(f).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    );
    if (cleaned.type) {
      cleaned.orderType = cleaned.type;
      delete cleaned.type;
    }
    return cleaned;
  };

  const cleanedFilters = useMemo(() => cleanFilters(filters), [filters]);

  const { data: orderTestsResponse, refetch: orderTestRefetch, isLoading: loadTests } =
    useFilterDiagnosticOrderTestsQuery(
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

  const orderTestList = orderTestsResponse?.data ?? [];

  // Favorites
  const userId = authSlice?.user?.id;

  const { data: favoriteLinks } = useGetFavoriteDiagnosticTestsByUserQuery(
    userId ? { userId } : skipToken
  );

  const favoriteTestIds = useMemo(() => favoriteLinks?.map((f: any) => f.testId) ?? [], [favoriteLinks]);

  const orderTestIds = useMemo(
    () =>
      Array.from(
        new Set(
          (orderTestList ?? [])
            .map((ot: any) => ot.testId)
            .filter(Boolean)
        )
      ),
    [orderTestList]
  );

  const { data: diagnosticTestsByIdsResponse } = useGetDiagnosticTestsByIdsQuery(
    orderTestIds.length ? { ids: orderTestIds } : skipToken
  );



  
  const { data: favoriteTests, isFetching: loadingFavorites } = useGetDiagnosticTestsByIdsQuery(
    favoriteTestIds.length ? { ids: favoriteTestIds } : skipToken
  );

  // LOVs
  const { data: labCategoriesLovResponse } = useGetLovValuesByCodeQuery('LAB_CATEGORIES');
  const { data: radCategoriesLovResponse } = useGetLovValuesByCodeQuery('RAD_CATEGORIES');
  const { data: ReasonLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_ORD_REASON');

  const resolveReasonLabel = (reasonKey?: string) =>
    ReasonLovQueryResponse?.object?.find((r: any) => String(r.key) === String(reasonKey))?.lovDisplayVale ??
    reasonKey ??
    '';

  // Mutations
  const [cancelDiagnosticOrderTest] = useCancelDiagnosticOrderTestMutation();
  const [submitDiagnosticOrder] = useSubmitDiagnosticOrderMutation();
  const [createOrder] = useCreateDiagnosticOrderMutation();
  const [updateOrder] = useUpdateDiagnosticOrderMutation();
  const [createOrderTest] = useCreateDiagnosticOrderTestMutation();
  const [updateOrderTest] = useUpdateDiagnosticOrderTestMutation();


  // Modals state
  const [openDetailsModel, setOpenDetailsModel] = useState(false);
  const [openConfirmDeleteModel, setConfirmDeleteModel] = useState(false);
  const [previewDiagnosticsOrder, setPreviewDiagnosticsOrder] = useState<any | null>(null);

  const handleClearDiagnostics = () => {
    setOrderTest({ ...newDiagnosticOrderTest });
    setTest({ ...newDiagnosticTest });
    setPreviewDiagnosticsOrder(null);
  };

  useEffect(() => {
    if (!ordersList?.length) return;
    if (orders?.id) return;

    const draftOrder = ordersList.find((o: any) => o.saveDraft === true && o.status === 'NEW');
    if (draftOrder) setOrders(draftOrder);
  }, [ordersList]); // eslint-disable-line react-hooks/exhaustive-deps

  const OpenConfirmDeleteModel = () => setConfirmDeleteModel(true);
  const CloseConfirmDeleteModel = () => setConfirmDeleteModel(false);

  const resolveOrderType = (testObj?: any) =>
    testObj?.type ?? testObj?.testType ?? testObj?.testTypeLvalue?.valueCode ?? null;

  const handleSaveTest = async () => {
    try {
      const receivedDepartmentId = orderTest?.receivedDepartmentId ?? orderTest?.receivedLabId ?? undefined;

      const testId = toNumericId(
        orderTest?.testId ?? orderTest?.test?.id ?? orderTest?.diagnosticTest?.id ?? test?.id
      );

      const _orderId = toNumericId(orderTest?.orderId ?? orders?.id ?? orders?.key);

      const fromDepartmentId = resolveFromDepartmentId();
      const orderTestId = toNumericId(orderTest?.id ?? orderTest?.key);

      if (!testId || !_orderId || !patientId || !encounterId) {
        dispatch(notify({ msg: 'Missing test or patient info', sev: 'warning' }));
        return;
      }

      if (!fromDepartmentId) {
        dispatch(notify({ msg: 'Missing department info', sev: 'error' }));
        return;
      }

      if (!orderTestId) {
        const createPayload: DiagnosticOrderTestCreateDTO = {
          orderId: _orderId,
          testId,
          receivedDepartmentId: toNumericId(receivedDepartmentId),
          reason: orderTest?.reason,
          notes: orderTest?.notes,
          orderType: resolveOrderType(test),
          icdDiagnosisId: orderTest?.icdDiagnosisId,
        };

        await createOrderTest(createPayload).unwrap();
      } else {
        const updatePayload: DiagnosticOrderTestUpdateDTO = {
          id: orderTestId,
          orderId: _orderId,
          testId,
          receivedDepartmentId: toNumericId(receivedDepartmentId),
          reason: orderTest?.reason,
          notes: orderTest?.notes,
          icdDiagnosisId: orderTest?.icdDiagnosisId,

        };

        await updateOrderTest({ id: orderTestId, body: updatePayload }).unwrap();
      }

      if (_orderId) {
        await orderTestRefetch();
        setTableVersion(v => v + 1);
      }

      setOpenDetailsModel(false);
      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
    } catch (error: any) {
      console.error('Save test failed', error);
      dispatch(notify({ msg: extractErrorMessage(error), sev: 'error' }));
    }
  };

  const handleCheckboxChange = (id: number) => {
    setSelectedRows(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleCancle = async () => {
    try {
      await Promise.all(
        selectedRows.map((itemId: number) =>
          cancelDiagnosticOrderTest({
            id: itemId,
            body: { cancellationReason: reson.cancellationReason }
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
      orderTestRefetch()

    }
  };


  const convertToMonths = (value: number, unit?: string) => {
    const normalizedUnit = String(unit || '').toUpperCase();

    switch (normalizedUnit) {
      case 'MINUTE':
      case 'MINUTES':
        return value / (60 * 24 * 30);

      case 'HOUR':
      case 'HOURS':
        return value / (24 * 30);

      case 'DAY':
      case 'DAYS':
        return value / 30;

      case 'WEEK':
      case 'WEEKS':
        return value * 7 / 30;

      case 'MONTH':
      case 'MONTHS':
        return value;

      case 'YEAR':
      case 'YEARS':
        return value * 12;

      default:
        return value;
    }
  };

  const getPatientAgeInMonths = (patient: any) => {
    const rawDob = patient?.dateOfBirth || patient?.dob;
    if (!rawDob) return null;

    const dob = new Date(rawDob);
    if (Number.isNaN(dob.getTime())) return null;

    const now = new Date();
    const diffMs = now.getTime() - dob.getTime();

    return diffMs / (1000 * 60 * 60 * 24 * 30);
  };

  const getPatientAgeGroup = (patient: any) => {
    const patientAgeInMonths = getPatientAgeInMonths(patient);
    if (patientAgeInMonths === null) return '';
    if (!ageGroupsList.length) return '';

    const patientFacilityId =
      patient?.facilityId ||
      encounter?.facilityId ||
      selectedDepartment?.facilityId;

    const matchingAgeGroup = ageGroupsList.find((group: any) => {
      if (
        patientFacilityId &&
        group?.facilityId &&
        Number(group.facilityId) !== Number(patientFacilityId)
      ) {
        return false;
      }

      const fromAge = Number(group?.fromAge ?? 0);
      const toAge = Number(group?.toAge ?? 0);

      const fromAgeInMonths = convertToMonths(fromAge, group?.fromAgeUnit);
      const toAgeInMonths = convertToMonths(toAge, group?.toAgeUnit);

      return (
        patientAgeInMonths >= fromAgeInMonths &&
        patientAgeInMonths <= toAgeInMonths
      );
    });

    return matchingAgeGroup?.ageGroup || '';
  };

  const validateTestForPatient = (test: any, patient: any) => {
    const warnings: string[] = [];
    const testName = test.name || 'Test';

    // Gender
    if (test.genderSpecific && test.gender) {
      const testGender = String(test.gender).toUpperCase();
      const patientGender = String(
        patient?.gender || patient?.genderType || patient?.sexAtBirth || ''
      ).toUpperCase();

      if (patientGender && testGender !== patientGender) {
        warnings.push(`${testName}: Only for ${formatEnumString(String(test.gender))}`);
      }
    }

    // Age
    if (test.ageSpecific && test.ageGroupList?.length) {
      const patientAgeGroup = String(
        patient?.ageGroup || getPatientAgeGroup(patient)
      ).toUpperCase();

      const matches = test.ageGroupList.some(
        (age: any) => String(age).toUpperCase() === patientAgeGroup
      );

      if (patientAgeGroup && !matches) {
        warnings.push(
          `${testName}: Only for ${test.ageGroupList.map((age: any) => formatEnumString(String(age))).join(', ')} (Patient is ${formatEnumString(patientAgeGroup)})`
        );
      }
    }

    // Special Population
    if (test.specialPopulation && test.specialPopulationValues?.length) {
      const patientSpecialPopulation = patient?.specialPopulationValues ?? [];

      const match = test.specialPopulationValues.some((val: any) =>
        patientSpecialPopulation.includes(val)
      );

      if (!match) {
        warnings.push(`${testName}: Special population mismatch`);
      }
    }

    return warnings;
  };

  const handleSaveTests = async () => {
    setOpenTestsModal(false);

    const _orderId = toNumericId(orders?.id ?? orders?.key);
    const fromDepartmentId = resolveFromDepartmentId();

    if (!_orderId || !patientId || !encounterId) {
      dispatch(notify({ msg: 'Missing order or patient info', sev: 'warning' }));
      return;
    }

    if (!fromDepartmentId) {
      dispatch(notify({ msg: 'Missing department info', sev: 'error' }));
      return;
    }

    try {
      const pickTestId = (t: any) =>
        toNumericId(t?.testId ?? t?.id ?? t?.key ?? t?.test?.id);

      let warnings: string[] = [];
      selectedTestsList.forEach(item => {
        const realTest = testsList.find(
          t => String(t.id) === String(item.id || item.testId)
        );

        if (!realTest) return;

        const w = validateTestForPatient(realTest, patient);
        warnings.push(...w);
      });

      if (warnings.length) {
        const uniqueWarnings = Array.from(new Set(warnings));

        dispatch(
          notify({
            msg:
              '⚠ Validation Warnings:\n\n' +
              uniqueWarnings.join('\n'),
            sev: 'warning'
          })
        );
      }

      const validTests = selectedTestsList.filter(item =>
        pickTestId(item)
      );

      const existingTestIds = new Set(
        orderTestList
          .filter(t => t.status !== DiagnosticOrderTestStatus.CANCELLED)
          .map(t => String(t.testId))
      );

      let added: string[] = [];
      let duplicates: string[] = [];

      await Promise.all(
        validTests.map(async item => {
          const testId = pickTestId(item);
          const testName = item.name || item.testName || 'Test';

          if (existingTestIds.has(String(testId))) {
            duplicates.push(testName);
            return;
          }

          try {
            await createOrderTest({
              orderId: _orderId,
              testId,
              orderType: item.type || 'LABORATORY'
            }).unwrap();

            added.push(testName);
          } catch (e) {
            console.warn('❌ Failed test:', testId, e);
          }
        })
      );

      if (added.length) {
        dispatch(
          notify({
            msg: `✅ ${added.join(', ')} added successfully`,
            sev: 'success'
          })
        );
      }

      if (duplicates.length) {
        dispatch(
          notify({
            msg: `⚠ ${duplicates.join(', ')} already added`,
            sev: 'warning'
          })
        );
      }

      await orderTestRefetch();

    } catch (error: any) {
      console.error('Save tests failed:', error);
      dispatch(notify({ msg: extractErrorMessage(error), sev: 'error' }));
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
        fromFacilityId: selectedDepartment?.facilityId
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
    const _orderId = orders?.id;
    if (!_orderId) {
      dispatch(notify({ msg: 'Missing order id', sev: 'warning' }));
      return;
    }

    if (!orderTestList.length) {
      dispatch(notify({ msg: 'Please add at least one test', sev: 'warning' }));
      return;
    }

    const hasMissingReceivedLab = orderTestList.some((t: any) => !t.receivedDepartmentId);
    if (hasMissingReceivedLab) {
      dispatch(notify({ msg: 'Please select Received Lab for Your Test', sev: 'warning' }));
      return;
    }

    try {
      await updateOrder({
        id: _orderId,
        body: {
          id: _orderId,
          patientId,
          encounterId,
          isUrgent: orders.isUrgent
        }
      }).unwrap();

      await submitDiagnosticOrder(_orderId).unwrap();

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

  const handleEdit = (rowData: any) => {
    setOrderTest({
      ...rowData,
      reason: rowData.reason ?? rowData.reason
    });

    if (!ReasonLovQueryResponse?.object?.length) return;

    setOpenDetailsModel(true);
  };

  const handleOpenRescheduleAppointments = (rowData: any) => {
    const resourceId = Number(
      rowData?.test?.id ?? rowData?.testId ?? rowData?.diagnosticTestId ?? rowData?.resourceId
    );
    if (!resourceId) {
      dispatch(
        notify({
          msg: 'Missing diagnostic test id for this order test.',
          sev: 'warning'
        })
      );
      return;
    }
    setSelectedOrderTestForReschedule(rowData);
    setRescheduleAppointmentsModalOpen(true);
  };

  const handleRecallFavoriteTest = async (t: any) => {
    const _orderId = orders?.id;

    if (!_orderId || !patientId || !encounterId) {
      dispatch(notify({ msg: 'Missing order or patient info', sev: 'warning' }));
      return;
    }

    try {
      await createOrderTest({
        orderId: _orderId,
        testId: t.id,
        orderType: t.type
      }).unwrap();

      dispatch(notify({ msg: 'Test recalled successfully', sev: 'success' }));
      await orderTestRefetch();
    } catch (error: any) {
      const msg = extractErrorMessage(error);

      dispatch(
        notify({
          msg: msg.toLowerCase().includes('already') ? 'This test already ordered' : msg,
          sev: msg.toLowerCase().includes('already') ? 'warning' : 'error'
        })
      );
    }
  };



  // Normalization + sorting
    const diagnosticTestsByIds = diagnosticTestsByIdsResponse ?? [];

    const testsMap = useMemo(
      () => new Map((diagnosticTestsByIds ?? []).map((t: any) => [t.id, t])),
      [diagnosticTestsByIds]
    );


  const STATUS_PRIORITY: Record<string, number> = {
    NEW: 1,
    IN_PROGRESS: 2,
    COMPLETED: 3,
    CANCELLED: 4
  };

  const normalizedOrderTestList = useMemo(() => {
    return [...orderTestList]
      .map((ot: any) => {
        const t = testsMap.get(ot.testId);
        return { ...ot, test: t, orderType: ot.orderType ?? t?.type };
      })
      .sort((a: any, b: any) => {
        const aPriority = STATUS_PRIORITY[a.status] ?? 99;
        const bPriority = STATUS_PRIORITY[b.status] ?? 99;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      });
  }, [orderTestList, testsMap]);


  const selectableRowIds = useMemo(() => {
    return normalizedOrderTestList
      .filter((row: any) => row.status === 'NEW')
      .map((row: any) => Number(row.id))
      .filter(Boolean);
  }, [normalizedOrderTestList]);

  const isAllSelected =
    selectableRowIds.length > 0 && selectableRowIds.every(id => selectedRows.includes(id));

  const isIndeterminate = selectedRows.length > 0 && !isAllSelected;

  const selectedOrderTests = useMemo(
    () => normalizedOrderTestList.filter((row: any) => selectedRows.includes(row.id)),
    [normalizedOrderTestList, selectedRows]
  );

  return {
    // refs
    tableContainerRef,

    // route data
    patient,
    encounter,
    edit,
    reson,
    setReson,
    // ids
    patientId,
    encounterId,
    orderId,

    // auth
    authSlice,
    selectedDepartment,
    departments,

    // lists
    ordersList,
    testsList,
    orderTestList,
    normalizedOrderTestList,
    favoriteTests: favoriteTests ?? [],
    loadingFavorites,

    // lovs
    labCategoriesLovResponse,
    radCategoriesLovResponse,
    ReasonLovQueryResponse,
    resolveReasonLabel,

    // flags
    isFetching,
    loadTests,
    hasOpenOrder,
    isSubmitDisabled,

    // filters
    filters,
    setFilters,
    diagTypeResponse,

    // state
    showCanceled,
    setShowCanceled,

    test,
    setTest,
    orders,
    setOrders,
    orderTest,
    setOrderTest,

    selectedRows,
    setSelectedRows,
    handleCheckboxChange,

    // transfer list
    openTestsModal,
    setOpenTestsModal,
    selectedTestsList,
    setSelectedTestsList,
    leftItems,
    setLeftItems,
    searchTerm,
    setSearchTerm,
    searchType,
    setSearchType,

    // modals
    attachmentsModalOpen,
    setAttachmentsModalOpen,
    openRequestTestModal,
    setOpenRequestTestModal,
    recallFavoriteModal,
    setRecallFavoriteModal,
    collectSampleModal,
    setCollectSampleModal,
    testCardModal,
    setTestCardModal,
    rescheduleAppointmentsModalOpen,
    setRescheduleAppointmentsModalOpen,
    selectedOrderTestForReschedule,
    setSelectedOrderTestForReschedule,
    bulkDepartmentModalOpen,
    setBulkDepartmentModalOpen,

    openDetailsModel,
    setOpenDetailsModel,
    openConfirmDeleteModel,
    setConfirmDeleteModel,

    previewDiagnosticsOrder,
    setPreviewDiagnosticsOrder,

    // actions
    handleClearDiagnostics,
    handleSaveOrders,
    handleSaveTests,
    handleSaveTest,
    handleSubmitPres,
    OpenConfirmDeleteModel,
    CloseConfirmDeleteModel,
    handleCancle,
    handleEdit,
    handleOpenRescheduleAppointments,
    handleRecallFavoriteTest,

    // helpers
    normalizeOrderTest,
    resolveFromDepartmentId,
    toNumericId,

    // table helpers
    tableVersion,
    setTableVersion,
    selectableRowIds,
    isAllSelected,
    isIndeterminate,
    selectedOrderTests,

    // refetch
    ordersRefetch,
    orderTestRefetch,
    handleLoadMore
  };
};
