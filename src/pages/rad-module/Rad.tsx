import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { Row, Col, Tabs, Form } from 'rsuite';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  useFilterDiagnosticOrdersQuery
} from '@/services/diagnosic-order/diagnosticOrderService';
import { useLazyGetPatientByIdQuery } from '@/services/patientService';
import {
  useFilterDiagnosticOrderTestsQuery,
  useUpdateDiagnosticOrderTestMutation
} from '@/services/diagnosic-order/diagnosticOrderTestService';
import {
  useSaveDiagnosticOrderTestRadReportMutation
} from '@/services/radService';
import {
  DiagnosticOrderTestStatus
} from '@/types/model-types-new';
import {
  newApDiagnosticOrders,
  newApDiagnosticOrderTests,
  newApDiagnosticOrderTestsRadReport,
  newApEncounter,
  newApPatient
} from '@/types/model-types-constructor';
import DetailsCard from '@/components/DetailsCard';
import MyStepper from '@/components/MyStepper';
import MyInput from '@/components/MyInput';
import Orders from './Orders';
import Tests from './Tests';
import Report from './Report';
import PatientSide from '../lab-module/PatienSide';
import {
  faCircleCheck,
  faClock,
  faRectangleList,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';

const safeRefetch = async (fn?: () => any) => {
  if (!fn) return;
  try {
    await fn();
  } catch { }
};

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};


type RadRef = {
  refetchAllRadData: () => Promise<void>;
};

const Rad = React.forwardRef<RadRef, {}>((props, ref) => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const OrdersRef = useRef<any>(null);
  const TestsRef = useRef<any>(null);
  const ReportRef = useRef<any>(null);
  const [activeKey, setActiveKey] = useState<'1' | '2'>('1');
  const [order, setOrder] = useState<any>({ ...newApDiagnosticOrders });
  const [test, setTest] = useState<any>({ ...newApDiagnosticOrderTests });
  const [report, setReport] = useState({ ...newApDiagnosticOrderTestsRadReport });
  const [visibleRadTests, setVisibleRadTests] = useState<any[]>([]);
  const [patient, setPatient] = useState({ ...newApPatient });
  const [encounter] = useState({ ...newApEncounter });
  const [globalLoading, setGlobalLoading] = useState(false);
  const today = new Date();
  const [dateFilter, setDateFilter] = useState({
    fromDate: today,
    toDate: today
  });

  const [fetchPatientById] = useLazyGetPatientByIdQuery();

  const {
    data: todayRadTestsResponse
  } = useFilterDiagnosticOrderTestsQuery({
    page: 0,
    size: 1000,
    orderType: 'RADIOLOGY',
    receivedDepartmentId: authSlice.selectedDepartment?.departmentId,
    createdDateFrom: startOfDay(dateFilter.fromDate).toISOString(),
    createdDateTo: endOfDay(dateFilter.toDate).toISOString()
  });

  useEffect(() => {
    setVisibleRadTests(todayRadTestsResponse?.data ?? []);
  }, [todayRadTestsResponse]);

  useEffect(() => {
    dispatch(setPageCode('Rad'));
    dispatch(setDivContent('Clinical Radiology'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const { data: ordersResponse } = useFilterDiagnosticOrdersQuery({
    page: 0,
    size: 1000,
    hasRadiology: true
  });

  const {
    data: testsResponse,
    refetch: fetchAllTests
  } = useFilterDiagnosticOrderTestsQuery({
    page: 0,
    size: 1000,
    hasRadiology: true,
    createdDateFrom: startOfDay(dateFilter.fromDate).toISOString(),
    createdDateTo: endOfDay(dateFilter.toDate).toISOString()
  });

  const stepsData = [
    { key: DiagnosticOrderTestStatus.PATIENT_ARRIVED, value: 'Patient Arrived' },
    { key: DiagnosticOrderTestStatus.ACCEPTED, value: 'Accepted' },
    { key: DiagnosticOrderTestStatus.REJECTED, value: 'Rejected', isError: true },
    { key: DiagnosticOrderTestStatus.RESULT_READY, value: 'Result Ready' },
    { key: DiagnosticOrderTestStatus.RESULT_APPROVED, value: 'Result Approved' }
  ];

  const isAcceptedLike = (status?: DiagnosticOrderTestStatus) =>
    status === DiagnosticOrderTestStatus.ACCEPTED ||
    status === DiagnosticOrderTestStatus.PARTIALLY;

  const stepsDataComputed = useMemo(() => {
    return stepsData.filter(step => {
      if (
        step.key === DiagnosticOrderTestStatus.REJECTED &&
        test?.processingStatus !== DiagnosticOrderTestStatus.REJECTED
      ) {
        return false;
      }
      if (
        step.key === DiagnosticOrderTestStatus.ACCEPTED &&
        test?.processingStatus === DiagnosticOrderTestStatus.REJECTED
      ) {
        return false;
      }

      return true;
    });
  }, [stepsData, test?.processingStatus]);

  const activeStep = useMemo(() => {
    if (!test?.processingStatus) return 0;

    return stepsDataComputed.findIndex(step =>
      isAcceptedLike(test.processingStatus)
        ? step.key === DiagnosticOrderTestStatus.ACCEPTED
        : step.key === test.processingStatus
    );
  }, [stepsDataComputed, test?.processingStatus]);

  const [updateTest] = useUpdateDiagnosticOrderTestMutation();

  const [saveReport, saveReportMutation] =
    useSaveDiagnosticOrderTestRadReportMutation();

  const saveTest = async (payload: any) => {
    if (!test?.id) throw new Error("Missing test id");
    const updated = await updateTest({
      id: test.id,
      body: payload
    }).unwrap();
    await fetchAllTests();
    return updated;
  };

  const refetchAllRadData = async () => {
    setGlobalLoading(true);
    try {
      await safeRefetch(OrdersRef.current?.refetchOrders);
      await safeRefetch(fetchAllTests);
      await safeRefetch(TestsRef.current?.fetchTest);
      await safeRefetch(ReportRef.current?.reportFetch);
    } finally {
      setGlobalLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refetchAllRadData
  }));

  useEffect(() => {
    fetchAllTests();
  }, [dateFilter.fromDate, dateFilter.toDate]);

  useEffect(() => {
    if (!order?.patientId) {
      setPatient({ ...newApPatient });
      return;
    }

    fetchPatientById(order.patientId)
      .unwrap()
      .then(res => {
        setPatient(res);
      })
      .catch(() => {
        setPatient({ ...newApPatient });
      });

  }, [order?.patientId]);

  const newTestsCount = useMemo(
    () =>
      visibleRadTests.filter(
        t => t.processingStatus === DiagnosticOrderTestStatus.NEW
      ).length,
    [visibleRadTests]
  );

  const patientArrivedCount = useMemo(
    () =>
      visibleRadTests.filter(
        t => t.processingStatus === DiagnosticOrderTestStatus.PATIENT_ARRIVED
      ).length,
    [visibleRadTests]
  );

  const resultApprovedCount = useMemo(
    () =>
      visibleRadTests.filter(
        t => t.processingStatus === DiagnosticOrderTestStatus.RESULT_APPROVED
      ).length,
    [visibleRadTests]
  );

  const totalRadTestsCount = visibleRadTests.length;

  return (
    <>

      <div className="count-div-on-top-of-page">
        <DetailsCard
          title="Result Approved"
          number={resultApprovedCount}
          icon={faCircleCheck}
          color="--green-600"
          width="20vw"
        />
        <DetailsCard
          title="Patient Arrived"
          number={patientArrivedCount}
          icon={faClock}
          color="--primary-yellow"
          width="20vw"
        />
        <DetailsCard
          title="New"
          number={newTestsCount}
          icon={faRectangleList}
          color="--primary-blue"
          width="20vw"
        />
        <DetailsCard
          title="Total Test"
          number={totalRadTestsCount}
          icon={faTriangleExclamation}
          color="--gray-dark"
          width="20vw"
        />
      </div>

      <div className="container">
        <div className="left-boxs">
          <Row>
            <Col xs={14}>
              <Orders
                ref={OrdersRef}
                order={order}
                setOrder={setOrder}
                dateFilter={dateFilter}
                loading={globalLoading}
              />
            </Col>

            <Col xs={10}>
              <Form fluid layout="inline">
                <MyInput
                  width={230}
                  placeholder="From Date"
                  fieldType="date"
                  fieldName="fromDate"
                  record={dateFilter}
                  setRecord={setDateFilter}
                  showLabel={false}
                />
                <MyInput
                  width={230}
                  placeholder="To Date"
                  fieldType="date"
                  fieldName="toDate"
                  record={dateFilter}
                  setRecord={setDateFilter}
                  showLabel={false}
                />
              </Form>

              {test?.id && (
                <MyStepper
                  stepsList={stepsDataComputed}
                  activeStep={activeStep}
                />
              )}
            </Col>
          </Row>

          <Tabs activeKey={activeKey} onSelect={setActiveKey} appearance="subtle">
            <Tabs.Tab eventKey="1" title="Tests">
              <Tests
                ref={TestsRef}
                order={order}
                test={test}
                setTest={setTest}
                fetchAllTests={fetchAllTests}
                refetchAllRadData={refetchAllRadData}
                loading={globalLoading}
                saveTest={saveTest}
              />
            </Tabs.Tab>
          </Tabs>
        </div>

        <div className="right-boxs">
          <PatientSide patient={patient} encounter={encounter} />
        </div>
      </div>

    </>
  );

});

export default Rad;
