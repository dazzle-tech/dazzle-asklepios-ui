import React, {
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle
} from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useFilterDiagnosticOrderTestsQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { DiagnosticStatus,DiagnosticOrderTestStatus } from '@/types/model-types-new';
import { Checkbox, Form } from 'rsuite';
import { formatEnumString } from '@/utils';
import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useFilterDiagnosticOrdersQuery } from '@/services/diagnosic-order/diagnosticOrderService';

type PatientPrevTestsRef = {
  refetchPrevTests: () => void;
};

const PatientPrevTests = forwardRef<PatientPrevTestsRef, { patient: any }>(
  ({ patient }, ref) => {
    /* ===================== HELPERS ===================== */
    const toNumericId = (value: any) => {
      if (value === null || value === undefined) return undefined;
      if (typeof value === 'number') return value;
      const n = Number(value);
      return Number.isNaN(n) ? undefined : n;
    };
//add new patient edits
    const patientId = toNumericId(patient?.id ?? patient?.key);

    /* ===================== STATE ===================== */
    const [showCancelled, setShowCancelled] = useState(false);
    const [filters, setFilters] = useState({
      testName: '',
      type: '',
      category: ''
    });

    /* ===================== FILTERS ===================== */
    const cleanFilters = (filters: any) => {
      const cleaned: any = Object.fromEntries(
        Object.entries(filters).filter(
          ([, v]) => v !== '' && v !== null && v !== undefined
        )
      );

      if (cleaned.type) {
        cleaned.orderType = cleaned.type;
        delete cleaned.type;
      }

      return cleaned;
    };

    const cleanedFilters = useMemo(
      () => cleanFilters(filters),
      [filters]
    );

    /* ===================== QUERY ===================== */
       const ordersQueryParams = useMemo(() => {
         if (!patientId) return skipToken;
     
         return {
           patientId,
           page: 0,
           size: 1000,
           sort: 'id,desc'
         };
       }, [patientId]);
     
       const {
         data: ordersResponse,
         isFetching: isOrdersFetching
       } = useFilterDiagnosticOrdersQuery(ordersQueryParams);
     
       const orders = ordersResponse?.data ?? [];
     
   const orderIds = useMemo(
  () => orders.map((o: any) => o.id).filter(Boolean),
  [orders]
);

const queryParams =
  !patientId || isOrdersFetching || !orderIds.length
    ? skipToken
    : {
        orderIdIn: orderIds,
        ...(showCancelled
          ? {}
          : { excludeStatus: DiagnosticOrderTestStatus.CANCELLED }),
        ...cleanedFilters
      };

const {
  data: orderTestResponse,
  isLoading,
  refetch
} = useFilterDiagnosticOrderTestsQuery(queryParams);


    /* 🔥 expose refetch to parent */
    useImperativeHandle(ref, () => ({
      refetchPrevTests: () => {
        refetch();
      }
    }));

    const orderTestList: any[] = orderTestResponse?.data ?? [];

    /* ===================== ALL TESTS ===================== */
    const { data: testsResponse } = useGetAllDiagnosticTestsQuery({
      page: 0,
      size: 10000
    });

    const testsList = testsResponse?.data ?? [];

    const testsMap = useMemo(() => {
      return new Map(testsList.map(t => [t.id, t]));
    }, [testsList]);

    /* ===================== NORMALIZE ===================== */
    const normalizedRows = useMemo(() => {
      return orderTestList.map(orderTest => {
        const test = testsMap.get(orderTest.testId);
        return {
          ...orderTest,
          test,
          orderType: orderTest.orderType ?? test?.type
        };
      });
    }, [orderTestList, testsMap]);

    /* ===================== COLUMNS ===================== */
    const tableColumns = [
      {
        key: 'orderId',
        title: <Translate>ORDER ID</Translate>,
        flexGrow: 1,
        render: (row: any) => row.orderId
      },
      {
        key: 'orderType',
        title: <Translate>ORDER TYPE</Translate>,
        flexGrow: 1,
        render: (row: any) => formatEnumString(row.orderType)
      },
      {
        key: 'testName',
        title: <Translate>TEST NAME</Translate>,
        flexGrow: 2,
        render: (row: any) => row.test?.testName ?? row.test?.name ?? ''
      },
      {
        key: 'internalCode',
        title: <Translate>INTERNAL CODE</Translate>,
        flexGrow: 2,
        render: (row: any) => row.test?.internalCode ?? row.test?.code ?? ''
      },
      {
        key: 'status',
        title: <Translate>STATUS</Translate>,
        flexGrow: 1,
        render: (row: any) => formatEnumString(row.status)
      }
    ];

    /* ===================== FILTER UI ===================== */
    const diagTypeResponse = useEnumOptions('TestType');
    const { data: labCategoriesLovResponse } =
      useGetLovValuesByCodeQuery('LAB_CATEGORIES');
    const { data: radCategoriesLovResponse } =
      useGetLovValuesByCodeQuery('RAD_CATEGORIES');

    const tableFilters = (
      <Form fluid layout="inline">
        <MyInput
          column
          width={140}
          fieldName="testName"
          fieldLabel="Test Name"
          fieldType="text"
          record={filters}
          setRecord={setFilters}
        />

        <MyInput
          column
          width={140}
          fieldName="type"
          fieldType="select"
          fieldLabel="Type"
          selectData={diagTypeResponse ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={filters}
          setRecord={rec =>
            setFilters({
              ...rec,
              category: ''
            })
          }
          searchable={false}
        />

        {filters.type && (
          <MyInput
            column
            width={160}
            fieldName="category"
            fieldType="select"
            fieldLabel="Category"
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
    );

    /* ===================== RENDER ===================== */

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';
    
    const dir = isRTL ? 'rtl' : 'ltr';

    return (
      <>
      <div dir={dir}>
        <Checkbox
          checked={showCancelled}
          onChange={(_, checked) => setShowCancelled(checked)}
        >
                <Translate>Show Cancelled</Translate>
        </Checkbox>

        <MyTable
          loading={isLoading}
          data={normalizedRows}
          columns={tableColumns}
          filters={tableFilters}
        />
      </div>
      </>
    );
  }
);

export default PatientPrevTests;
