import React, { useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useFilterDiagnosticOrderTestsQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { initialListRequestId } from '@/types/types';
import { DiagnosticStatus } from '@/types/model-types-new';
import { Checkbox } from 'rsuite';
import { formatEnumString } from '@/utils';

const PatientPrevTests = (props: any) => {
  /* ===================== HELPERS ===================== */
  const toNumericId = (value: any) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'number') return value;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  };

  const patientId = toNumericId(props?.patient?.id ?? props?.patient?.key);
  const [showCancelled, setShowCancelled] = useState(false);

  /* ===================== PAGINATION (UI STATE) ===================== */
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15
  });

  /* ===================== ADAPT pagination → listRequest ===================== */
  const listRequest = useMemo(
    () => ({
      ...initialListRequestId,
      pageNumber: paginationParams.page + 1, // backend is 1-based
      pageSize: paginationParams.size
    }),
    [paginationParams]
  );

  /* ===================== FETCH ORDER TESTS ===================== */
  const { data: orderTestResponse, isLoading } =
    useFilterDiagnosticOrderTestsQuery(
      patientId
        ? showCancelled
          ? {
            patientId,
            status: DiagnosticStatus.CANCELLED,
            listRequest
          }
          : {
            patientId,
            excludeStatus: DiagnosticStatus.CANCELLED,
            listRequest
          }
        : skipToken
    );



  const orderTestList: any[] = Array.isArray(orderTestResponse)
    ? orderTestResponse
    : orderTestResponse?.data ??
    orderTestResponse?.object ??
    [];

  const totalCount =
    orderTestResponse?.total ??
    orderTestResponse?.extraNumeric ??
    orderTestList.length;

  /* ===================== FETCH ALL TESTS ===================== */
  const { data: testsResponse } = useGetAllDiagnosticTestsQuery({
    page: 0,
    size: 10000
  });

  const testsList = testsResponse?.data ?? [];

  /* ===================== MAP TESTS ===================== */
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
      render: row => row.orderId

    },
    {
      key: 'orderType',
      title: <Translate>ORDER TYPE</Translate>,
      flexGrow: 1,
      render: rowData => {
        return <>{formatEnumString(
          rowData.orderType)}</>
      }
    },
    {
      key: 'testName',
      title: <Translate>TEST NAME</Translate>,
      flexGrow: 2,
      render: row => row.test?.testName ?? row.test?.name ?? ''
    },
    {
      key: 'internalCode',
      title: <Translate>INTERNAL CODE</Translate>,
      flexGrow: 2,
      render: row => row.test?.internalCode ?? row.test?.code ?? ''
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      flexGrow: 1,
      render: rowData => {
        return <>{formatEnumString(
          rowData.status)}</>
      }    }
  ];

  /* ===================== HANDLERS ===================== */
  const handlePageChange = (_: unknown, newPage: number) => {
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaginationParams(prev => ({
      ...prev,
      size: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  /* ===================== RENDER ===================== */
  return (<>
    <Checkbox
      checked={showCancelled}
      onChange={(_, checked) => setShowCancelled(checked)}
    >
      Show Cancelled
    </Checkbox>


    <MyTable
      loading={isLoading}
      data={normalizedRows}
      columns={tableColumns}
      page={paginationParams.page}
      rowsPerPage={paginationParams.size}
      totalCount={totalCount}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
    />
  </>);
};

export default PatientPrevTests;
