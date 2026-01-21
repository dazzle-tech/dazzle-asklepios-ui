import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { Row, Tabs, Form, Col } from 'rsuite';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  useFilterDiagnosticOrdersQuery
} from '@/services/diagnosic-order/diagnosticOrderService';
import {
  useGetTestsByOrderIdQuery,
  useUpdateDiagnosticOrderTestMutation
} from '@/services/diagnosic-order/diagnosticOrderTestService';
import {
  useGetCollectedSamplesByOrderTestIdQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestCollectedSampleService';
import {
  DiagnosticStatus,
  DiagnosticOrderTestStatus
} from '@/types/model-types-new';

import {
  newApDiagnosticOrders,
  newApDiagnosticOrderTests,
  newApDiagnosticOrderTestsResult,
  newApEncounter,
  newApPatient
} from '@/types/model-types-constructor';
import DetailsCard from '@/components/DetailsCard';
import MyStepper from '@/components/MyStepper';
import Orders from './Orders';
import Tests from './Tests';
import Result from './Result';
import PatientSide from './PatienSide';
import MyInput from '@/components/MyInput';
import { useLazyGetPatientByIdQuery } from '@/services/patientService';

import {
  faCircleCheck,
  faClock,
  faRectangleList,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';

const Lab = () => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);

  const OrdersRef = useRef<any>(null);
  const TestsRef = useRef<any>(null);

  /* ===================== STATE ===================== */

  const [order, setOrder] = useState<any>({ ...newApDiagnosticOrders });
  const [test, setTest] = useState<any>({ ...newApDiagnosticOrderTests });
  const [result, setResult] = useState<any>({ ...newApDiagnosticOrderTestsResult });
  const [patient, setPatient] = useState({ ...newApPatient });
  const [encounter] = useState({ ...newApEncounter });
  const [globalLoading, setGlobalLoading] = useState(false);

  const [fetchPatientById] = useLazyGetPatientByIdQuery();

  const [activeKey, setActiveKey] = useState<'1' | '2'>('1');
  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(), //new Date(),
    toDate: new Date()
  });
  /* ===================== PAGE HEADER ===================== */

  
  useEffect(() => {
    dispatch(setPageCode('Lab'));
    dispatch(setDivContent('Clinical Laboratory'));
  }, []);

  /* ===================== ORDERS ===================== */

  const { data: ordersResponse } = useFilterDiagnosticOrdersQuery({
    page: 0,
    size: 1000,
    hasLaboratory: true
  });

  /* ===================== TESTS ===================== */

  const {
    data: testsResponse,
    refetch: fetchAllTests
  } = useGetTestsByOrderIdQuery(
    order?.id ? { orderId: order.id, page: 0, size: 1000 } : skipToken
  );

  const allTestsList = testsResponse?.data ?? [];

  /* ===================== SAMPLES ===================== */

const { data: samplesResponse, refetch: fecthSample } =
  useGetCollectedSamplesByOrderTestIdQuery(
    test?.id
      ? { orderTestId: test.id, page: 0, size: 20 }
      : skipToken
  );

const samplesList = samplesResponse?.data ?? [];


const refetchAllLabData = async () => {
  setGlobalLoading(true);

  try {
    await Promise.all([
      OrdersRef.current?.refetchOrders(), // Orders table
      TestsRef.current?.fetchTest(),      // Tests table
      fetchAllTests(),                    // counters
      fecthSample()                       // samples
    ]);
  } finally {
    setGlobalLoading(false);
  }
};




  /* ===================== COUNTERS ===================== */
const newTestsCount = useMemo(
  () =>
    allTestsList.filter(
      t => t.status === DiagnosticOrderTestStatus.NEW
    ).length,
  [allTestsList]
);

const sampleCollectedTestsCount = useMemo(
  () =>
    allTestsList.filter(
      t => t.processingStatus === DiagnosticStatus.SAMPLE_COLLECTED
    ).length,
  [allTestsList]
);


const resultApprovedCount = useMemo(
  () =>
    allTestsList.filter(
      t => t.status === DiagnosticOrderTestStatus.APPROVED
    ).length,
  [allTestsList]
);

  /* ===================== STEPPER ===================== */
const stepsData = [
  { key: DiagnosticOrderTestStatus.NEW, value: 'New' },
  { key: DiagnosticOrderTestStatus.SUBMITTED, value: 'Submitted' },
  { key: DiagnosticOrderTestStatus.SAMPLE_COLLECTED, value: 'Sample Collected' },
  { key: DiagnosticOrderTestStatus.READY, value: 'Result Ready' },
  { key: DiagnosticOrderTestStatus.APPROVED, value: 'Result Approved' },
  { key: DiagnosticOrderTestStatus.REJECTED, value: 'Rejected', isError: true },
  { key: DiagnosticOrderTestStatus.CANCELLED, value: 'Cancelled', isError: true }
];

const activeStep = stepsData.findIndex(
  s => s.key === test?.status
);

  /* ===================== SAVE TEST ===================== */

  const [updateTest] = useUpdateDiagnosticOrderTestMutation();

  const saveTest = async payload => {
    if (!test?.id) return;
    await updateTest({ id: test.id, body: payload }).unwrap();
    fetchAllTests();
  };

  /* ===================== RENDER ===================== */

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


  return (
    <>
      <div className="count-div-on-top-of-page">
        <DetailsCard
          title="Result Approved"
          number={resultApprovedCount}
          icon={faCircleCheck}
          color="--green-600"
          backgroundClassName="result-ready-section"
          width={'20vw'}
        />
        <DetailsCard
          title="Sample Collected"
          number={sampleCollectedTestsCount}
          icon={faClock}
          color="--primary-yellow"
          backgroundClassName="sample-collected-section"
          width={'20vw'}
        />
        <DetailsCard
          title="New"
          number={newTestsCount}
          icon={faRectangleList}
          color="--primary-blue"
          backgroundClassName="new-section"
          width={'20vw'}
        />
        <DetailsCard
          title="Total Test"
          number={allTestsList?.length ? allTestsList?.length : 0}
          icon={faTriangleExclamation}
          color="--gray-dark"
          backgroundClassName="total-test-section"
          width={'20vw'}
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
              <Row>
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
              </Row>

              {test.id && (
                <Row>
                  <Col md={24}>
                    <MyStepper stepsList={stepsData} activeStep={activeStep} />
                  </Col>
                </Row>
              )}
              {test.id && <Row>Number of Samples Collected:{samplesList?.data?.length}</Row>}
            </Col>
          </Row>

              <Tabs activeKey={activeKey} onSelect={setActiveKey} appearance="subtle">
                <Tabs.Tab eventKey="1" title="Tests">
                  <Tests
                    ref={TestsRef}
                    order={order}
                    setTest={setTest}
                    test={test}
                    samplesList={samplesList}
                    fecthSample={fecthSample}
                    fetchAllTests={fetchAllTests}
                    loading={globalLoading}
                    refetchAllLabData={refetchAllLabData}
                  />

                </Tabs.Tab>
                  <Tabs.Tab eventKey="2" title="Results">
                    {/* <Result
                      result={result}
                      setResult={setResult}
                      test={test}
                      setTest={setTest}
                      saveTest={saveTest}
                      samplesList={samplesList}

                      patient={patient}
                      labDetails={labDetails}
                      fecthSample={fecthSample}
                      fetchTest={fetchTest}
                      refetchTest={refetchTest}
                      listResultResponse={listResultResponse}
                      setListResultResponse={setListResultResponse}
                    /> */}

                </Tabs.Tab>
              </Tabs>

        </div>

        <div className="right-boxs">
          <PatientSide patient={patient} encounter={encounter} />
        </div>
      </div>

      
    </>
  );
};

export default Lab;
