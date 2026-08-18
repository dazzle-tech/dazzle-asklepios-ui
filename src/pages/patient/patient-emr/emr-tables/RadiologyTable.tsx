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
  useFilterDiagnosticOrdersQuery,
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
import { DiagnosticOrderTestStatus } from '@/types/model-types-new';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import AddReportModal from '@/pages/rad-module/radiologist-worklist/AddReportModal';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetAllRadiologiesQuery } from '@/services/setup/diagnosticTest/radiologyTestService';
import UserDateCell from '@/components/UserDateCell';

const RadiologyReportsTable = ({ patient, setEncounter, setPatient }) => {

    const [page, setPage] = useState(0);
  
  const [rowsPerPage, setRowsPerPage] = useState(10);

 
  const [orderTestsMap, setOrderTestsMap] = useState<Record<string, any>>({});
  const [ordersMap, setOrdersMap] = useState<Record<string, any>>({});
  const [patientsMap, setPatientsMap] = useState<Record<string, any>>({});
  const [testsMap, setTestsMap] = useState<Record<string, any>>({});
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [openReportModal, setOpenReportModal] = useState(false);
  const [fetchOrderTestById] = useLazyGetDiagnosticOrderTestByIdQuery();
  const [fetchOrderById] = useLazyGetDiagnosticOrderByIdQuery();
  const [fetchDiagnosticTestById] = useLazyGetDiagnosticTestByIdQuery();
  const [getBulkPatientBasicInfo] = useGetBulkPatientBasicInfoMutation();
   const ordersQueryParams = useMemo(() => {
      if (!patient?.id) return skipToken;
  
      return {
        patientId: patient.id,
        page: 0,
        size: 1000,
        sort: 'id,desc'
      };
    }, [patient?.id]);
  
    const { data: radCategoriesLovQueryResponse } =
  useGetLovValuesByCodeQuery('RAD_CATEGORIES');
    
const resolveCategoryLabel = (key?: any) =>
  radCategoriesLovQueryResponse?.object?.find(
    c => String(c.key) === String(key)
  )?.lovDisplayVale ?? key;


      const {
        data: ordersResponse,
        isFetching: isOrdersFetching
      } = useFilterDiagnosticOrdersQuery(ordersQueryParams);
    
      const orders = ordersResponse?.data ?? [];
    
      const orderIds = useMemo(
        () => orders.map((o: any) => o.id).filter(Boolean),
        [orders]
      );


    const { data: allRadiologiesResponse } = useGetAllRadiologiesQuery({
      page: 0,
      size: 10000,
      sort: 'testId,asc'
    });

    const radiologyByTestIdMap = useMemo(() => {
      const list = allRadiologiesResponse?.data ?? [];
      return new Map(list.map((r: any) => [r.testId, r]));
    }, [allRadiologiesResponse]);


    const queryParams = useMemo(() => {

      if (!patient?.id) return skipToken;
      if (isOrdersFetching) return skipToken;
      if (!orderIds.length) return skipToken;

      return {
        page,
        size: rowsPerPage,
        sort: 'id,desc',
        params: {
          processingStatus: DiagnosticOrderTestStatus.RESULT_APPROVED,
          orderIdIn: orderIds
        }
      };

    }, [patient?.id, isOrdersFetching, orderIds, page, rowsPerPage]);


    const {
      data,
      isFetching
    } = useFilterRadiologyReportsQuery(queryParams);
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
        <UserDateCell
          login={row.createdBy}
          date={row.createdDate}
        />
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
        const radiology = radiologyByTestIdMap.get(ot?.testId);
        return resolveCategoryLabel(radiology?.category);

      }
    },

    {
      key: 'testName',
      title: <Translate>TEST NAME</Translate>,
      render: (row: any) => {

        const ot = orderTestsMap[String(row.orderTestId)];
        const test = testsMap[String(ot?.testId)];

        return (
          <>
            {test?.name ?? '-'}
            <br />
            <span style={{ fontSize: 10, color: '#666' }}>
              {test?.testName ?? ''}
            </span>
          </>
        );

      }
    },

    {
      key: 'report',
      title: <Translate>REPORT</Translate>,
      render: (rowData: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

          <FontAwesomeIcon
            icon={faFileLines}
            style={{ cursor: 'pointer', color: '#a4a4a4' }}
            onClick={() => {
              setSelectedReport(rowData);
              setOpenReportModal(true);
            }}
          />
        </div>
      )
    }

  ];

  return (<>
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

  {openReportModal && selectedReport && (
    <AddReportModal
      key={selectedReport.id}
      open={openReportModal}
      setOpen={setOpenReportModal}
      report={selectedReport}
      setReport={setSelectedReport}
      disableEdit
      disableDefaultTemplate
    />
  )}

  </>);
};

export default RadiologyReportsTable;