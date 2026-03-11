import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';

import {
  useFilterDiagnosticOrderTestResultsQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';

import {
  useFilterDiagnosticOrdersQuery,
  useLazyGetDiagnosticOrderByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderService';

import {
  useLazyGetDiagnosticOrderTestByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderTestService';

import {
  useGetBulkPatientBasicInfoMutation
} from '@/services/patient/patientService';

import {
  useGetAllDiagnosticTestProfilesQuery
} from '@/services/setup/diagnosticTest/diagnosticTestProfileService';

import { DiagnosticOrderTestStatus } from '@/types/model-types-new';

import React, { useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

interface Props {
  patient: any;
}

const LaboratoryTable: React.FC<Props> = ({ patient }) => {

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [ordersMap, setOrdersMap] = useState<Record<string, any>>({});
  const [orderTestsMap, setOrderTestsMap] = useState<Record<string, any>>({});
  const [patientsMap, setPatientsMap] = useState<Record<string, any>>({});

  const [fetchOrderById] = useLazyGetDiagnosticOrderByIdQuery();
  const [fetchOrderTestById] = useLazyGetDiagnosticOrderTestByIdQuery();
  const [getBulkPatientBasicInfo] = useGetBulkPatientBasicInfoMutation();

  const {
    data: profilesResponse
  } = useGetAllDiagnosticTestProfilesQuery({
    page: 0,
    size: 10000,
    sort: 'id,asc'
  });

  const profilesMap = useMemo(
    () => new Map(profilesResponse?.data?.map(p => [p.id, p]) ?? []),
    [profilesResponse]
  );
  const ordersQueryParams = useMemo(() => {
    if (!patient?.id) return skipToken;

    return {
      patientId: patient.id,
      page: 0,
      size: 1000,
      sort: 'id,desc'
    };
  }, [patient?.id]);

  const {
    data: ordersResponse,
    isFetching: isOrdersFetching
  } = useFilterDiagnosticOrdersQuery(ordersQueryParams);

  const orders = ordersResponse?.data ?? [];

  const orderIds = useMemo(
    () => orders.map((o: any) => o.id).filter(Boolean),
    [orders]
  );
  const queryParams = useMemo(() => {
    if (!orderIds.length) return skipToken;

    return {
      page,
      size,
      sort: 'id,desc',
      processingStatus: DiagnosticOrderTestStatus.RESULT_APPROVED,
      orderIdIn: orderIds
    };
  }, [orderIds, page, size]);

  const { data: resultsResponse, isFetching } =
    useFilterDiagnosticOrderTestResultsQuery(queryParams);



  const results = resultsResponse?.data ?? [];
  const totalCount = resultsResponse?.totalCount ?? 0;

  useEffect(() => {

    results.forEach(r => {

      if (r.orderTestId && !orderTestsMap[r.orderTestId]) {

        fetchOrderTestById(r.orderTestId)
          .unwrap()
          .then(test => {

            setOrderTestsMap(prev => ({
              ...prev,
              [String(test.id)]: test
            }));

          });

      }

    });

  }, [results]);

  useEffect(() => {

    Object.values(orderTestsMap).forEach((test: any) => {

      const orderId = test?.orderId;

      if (orderId && !ordersMap[orderId]) {

        fetchOrderById(orderId)
          .unwrap()
          .then(order => {

            setOrdersMap(prev => ({
              ...prev,
              [String(order.id)]: order
            }));

          });

      }

    });

  }, [orderTestsMap]);

  const patientIds = useMemo(() => {

    return Object.values(ordersMap)
      .map((o: any) => o?.patientId)
      .filter(Boolean)
      .map(String)
      .filter((id, i, arr) => arr.indexOf(id) === i);

  }, [ordersMap]);

  useEffect(() => {

    if (!patientIds.length) return;

    const numericIds = patientIds.map(id => Number(id));

    getBulkPatientBasicInfo(numericIds)
      .unwrap()
      .then((res: any[]) => {

        const map: Record<string, any> = {};

        res.forEach((p: any, index: number) => {

          const originalId = numericIds[index];
          map[String(originalId)] = p;

        });

        setPatientsMap(map);

      });

  }, [patientIds]);

  const normalizedResults = useMemo(() => {

    return results.map(r => {

      const orderTest = orderTestsMap[String(r.orderTestId)];
      const order = ordersMap[String(orderTest?.orderId)];
      const patient = patientsMap[String(order?.patientId)];
      const profile = profilesMap.get(r.profileTestId);

      return {
        ...r,
        _patientName: patient
          ? `${patient.firstName} ${patient.lastName}`
          : '-',
        _profile: profile,
        _visitId: order?.encounterId
      };

    });

  }, [results, orderTestsMap, ordersMap, patientsMap, profilesMap]);

  const columns: ColumnConfig[] = [

    {
      key: 'visitId',
      title: <Translate>VISIT ID</Translate>,
      width: 120,
      render: (row: any) => row._visitId ?? '-'
    },

    {
      key: 'patient',
      title: <Translate>PATIENT</Translate>,
      render: (row: any) => row._patientName
    },

    {
      key: 'created',
      title: <Translate>CREATED BY / AT</Translate>,
      render: (row: any) => (
        <>
          {row.createdBy}
          <br />
          <span style={{ fontSize: 11, color: '#777' }}>
            {formatDateWithoutSeconds(row.createdDate)}
          </span>
        </>
      )
    },

    {
      key: 'resultDate',
      title: <Translate>RESULT DATE</Translate>,
      width: 150,
      render: (row: any) =>
        formatDateWithoutSeconds(row.approvedDate)
    },

    {
      key: 'category',
      title: <Translate>CATEGORY</Translate>,
      width: 150,
      render: (row: any) =>
        row._profile?.category ?? '-'
    },

    {
      key: 'testName',
      title: <Translate>TEST NAME</Translate>,
      render: (row: any) => (
        <>
          {row._profile?.name ?? '-'}
          <br />
          <span style={{ fontSize: 10, color: '#666' }}>
            {row._profile?.testName ?? ''}
          </span>
        </>
      )
    },

    {
      key: 'result',
      title: <Translate>RESULT</Translate>,
      render: (row: any) =>
        row.resultValue ?? row.resultText ?? '-'
    },

    {
      key: 'normalRange',
      title: <Translate>NORMAL RANGE</Translate>,
      render: (row: any) => {

        if (row.viewNormalRange)
          return row.viewNormalRange;

        if (row.minValue && row.maxValue)
          return `${row.minValue} - ${row.maxValue}`;

        return '-';

      }
    }

  ];

  return (
    <MyTable
      columns={columns}
      data={normalizedResults}
      loading={isFetching}
      page={page}
      rowsPerPage={size}
      totalCount={totalCount}
      onPageChange={(_, p) => setPage(p)}
      onRowsPerPageChange={(e) => {
        setSize(Number(e.target.value));
        setPage(0);
      }}
      height={350}
    />
  );

};

export default LaboratoryTable;