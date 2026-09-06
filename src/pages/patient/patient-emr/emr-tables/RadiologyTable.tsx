import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';

import {
  PacsStudyDTO,
  useFilterRadiologyReportsQuery,
  useLazyGetStudyImageLinkByReportIdQuery
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
import { faFileLines, faImage } from '@fortawesome/free-solid-svg-icons';
import AddReportModal from '@/pages/rad-module/radiologist-worklist/AddReportModal';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetAllRadiologiesQuery } from '@/services/setup/diagnosticTest/radiologyTestService';
import UserDateCell from '@/components/UserDateCell';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import StudyImageViewerModal from '@/pages/rad-module/radiologist-worklist/StudyImageViewrModal';
import { Checkbox, Form, HStack, Tooltip, Whisper } from 'rsuite';

const notifyFromApiError = (dispatch: any, e: any, fallbackMsg = 'Operation failed') => {
  const status = e?.status || e?.originalStatus || e?.data?.status;

  const message = e?.data?.message || e?.data?.detail || e?.error || fallbackMsg;

  if (status === 400 || status === 409 || status === 422) {
    dispatch(
      notify({
        msg: message,
        sev: 'warning'
      })
    );
    return;
  }

  dispatch(
    notify({
      msg: message,
      sev: 'error'
    })
  );
};
const RadiologyReportsTable = ({ patient, setEncounter, setPatient }) => {

    const [page, setPage] = useState(0);
    const dispatch = useAppDispatch();
  
  const [rowsPerPage, setRowsPerPage] = useState(10);

 const [openStudiesModal, setOpenStudiesModal] = useState(false);
 
 const [studies, setStudies] = useState<PacsStudyDTO[]>([]);
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
    const [fetchStudyImageLinkByReportId] =
      useLazyGetStudyImageLinkByReportIdQuery();
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
const handleViewImage = async (reportId: number) => {
  try {
    const response =
      await fetchStudyImageLinkByReportId(reportId).unwrap();

    if (!response?.length) {
      dispatch(
        notify({
          msg: 'No study found for this report',
          sev: 'warning'
        })
      );
      return;
    }

    if (response.length === 1) {
      window.open(
        response[0].link,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    setStudies(response);
    setOpenStudiesModal(true);

  } catch (e) {
    notifyFromApiError(
      dispatch,
      e,
      'Failed to load radiology image'
    );
  }
};

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
    },
     {
          key :'image',
          title:<Translate>Image</Translate>,
    
         render:(rowData: any) => {
         return <Whisper speaker={<Tooltip>View X-Ray Image</Tooltip>}>
                        <span>
                          <FontAwesomeIcon
                            icon={faImage}
                            className="icon-radiologist-worklist-size"
                            style={{
                              cursor: 'pointer',
                              opacity: 1,
                              color: '#1675e0'
                            }}
                            onClick={() => handleViewImage(rowData.id)}
                          />
                        </span>
                      </Whisper>}},

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
  <StudyImageViewerModal
          open={openStudiesModal}
          onClose={() => setOpenStudiesModal(false)}
          studies={studies}
        />

  </>);
};

export default RadiologyReportsTable;