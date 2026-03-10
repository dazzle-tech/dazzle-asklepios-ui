import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';

import {
  useFilterRadiologyReportsQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';

import {
  useLazyGetDiagnosticOrderTestByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderTestService';

import {
  useLazyGetDiagnosticOrderByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderService';

import {
  useLazyGetDiagnosticTestByIdQuery
} from '@/services/setup/diagnosticTest/diagnosticTestService';

import {
  useGetBulkPatientBasicInfoMutation
} from '@/services/patient/patientService';

import React, { useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const RadiologyReportsTable = ({ patient, setEncounter, setPatient }) => {

  const today = new Date();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [approvalDate] = useState({
    fromDate: today,
    toDate: today
  });

  const [orderTestsMap, setOrderTestsMap] = useState<Record<string, any>>({});
  const [ordersMap, setOrdersMap] = useState<Record<string, any>>({});
  const [patientsMap, setPatientsMap] = useState<Record<string, any>>({});
  const [testsMap, setTestsMap] = useState<Record<string, any>>({});

  const [fetchOrderTestById] = useLazyGetDiagnosticOrderTestByIdQuery();
  const [fetchOrderById] = useLazyGetDiagnosticOrderByIdQuery();
  const [fetchDiagnosticTestById] = useLazyGetDiagnosticTestByIdQuery();
  const [getBulkPatientBasicInfo] = useGetBulkPatientBasicInfoMutation();

  const { data, isFetching } =
    useFilterRadiologyReportsQuery(
      patient?.id
        ? {
          page,
          size: rowsPerPage,
          sort: 'id,desc',
          params: {
            processingStatus: 'RESULT_APPROVED',
            patientId: patient.id,
            approvedDateFrom: startOfDay(approvalDate.fromDate).toISOString(),
            approvedDateTo: endOfDay(approvalDate.toDate).toISOString()
          }
        }
        : skipToken
    );

  const reports = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;

  const orderTestIds = useMemo(
    () =>
      reports
        .map(r => r.orderTestId)
        .filter(Boolean)
        .map(String)
        .filter((id, i, arr) => arr.indexOf(id) === i),
    [reports]
  );

  const testIds = useMemo(
    () =>
      Object.values(orderTestsMap)
        .map((ot: any) => ot?.testId)
        .filter(Boolean)
        .map(String)
        .filter((id, i, arr) => arr.indexOf(id) === i),
    [orderTestsMap]
  );

  const patientIds = useMemo(
    () =>
      Object.values(ordersMap)
        .map((o: any) => o?.patientId)
        .filter(Boolean)
        .map(String)
        .filter((id, i, arr) => arr.indexOf(id) === i),
    [ordersMap]
  );

  useEffect(() => {

    orderTestIds.forEach(id => {

      if (orderTestsMap[id]) return;

      fetchOrderTestById(Number(id))
        .unwrap()
        .then(ot => {
          if (!ot) return;

          setOrderTestsMap(prev => ({
            ...prev,
            [id]: ot
          }));
        });

    });

  }, [orderTestIds]);

  useEffect(() => {

    testIds.forEach(id => {

      if (testsMap[id]) return;

      fetchDiagnosticTestById(Number(id))
        .unwrap()
        .then(res => {

          const test = res?.data;
          if (!test) return;

          setTestsMap(prev => ({
            ...prev,
            [id]: test
          }));

        });

    });

  }, [testIds]);

  useEffect(() => {

    Object.values(orderTestsMap).forEach((ot: any) => {

      const orderId = ot?.orderId;
      if (!orderId) return;

      if (ordersMap[orderId]) return;

      fetchOrderById(Number(orderId))
        .unwrap()
        .then(order => {

          if (!order) return;

          setOrdersMap(prev => ({
            ...prev,
            [String(order.id)]: order
          }));

        });

    });

  }, [orderTestsMap]);

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

  const columns: ColumnConfig[] = [

    {
      key: 'visitId',
      title: <Translate>VISIT ID</Translate>,
      width: 120,
      render: (row: any) => {

        const ot = orderTestsMap[String(row.orderTestId)];
        const order = ordersMap[String(ot?.orderId)];

        return (
          <span
            style={{
              color: '#1675e0',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => {

              const patient = patientsMap[String(order?.patientId)];

              if (patient) setPatient(patient);
              if (order) setEncounter(order);

            }}
          >
            {order?.encounterId ?? '-'}
          </span>
        );

      }
    },

    {
      key: 'created',
      title: <Translate>CREATED BY / AT</Translate>,
      render: (row: any) => (
        <>
          {row.createdBy ?? '-'}
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
      render: (row: any) => {

        const ot = orderTestsMap[String(row.orderTestId)];
        const test = testsMap[String(ot?.testId)];

        return test?.category ?? '-';

      }
    },

    {
      key: 'testName',
      title: <Translate>TEST NAME</Translate>,
      render: (row: any) => {

        const ot = orderTestsMap[String(row.orderTestId)];
        const test = testsMap[String(ot?.testId)];

        return test?.name ?? test?.testName ?? '-';

      }
    },

    {
      key: 'report',
      title: <Translate>REPORT</Translate>,
      render: (row: any) => row.report ?? '-'
    }

  ];

  return (
    <MyTable
      columns={columns}
      data={reports}
      loading={isFetching}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      onPageChange={(_, p) => setPage(p)}
      onRowsPerPageChange={(e) => {
        setRowsPerPage(Number(e.target.value));
        setPage(0);
      }}
      height={400}
    />
  );
};

export default RadiologyReportsTable;