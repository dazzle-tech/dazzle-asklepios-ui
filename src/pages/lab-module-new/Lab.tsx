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

const safeRefetch = async (fn?: () => any) => {
  if (!fn) return;
  try {
    await fn();
  } catch {
  }
};


const Lab = () => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);

  const OrdersRef = useRef<any>(null);
  const TestsRef = useRef<any>(null);

  const [order, setOrder] = useState<any>({ ...newApDiagnosticOrders });
  const [test, setTest] = useState<any>({ ...newApDiagnosticOrderTests });
  const [result, setResult] = useState<any>({ ...newApDiagnosticOrderTestsResult });
  const [patient, setPatient] = useState({ ...newApPatient });
  const [encounter] = useState({ ...newApEncounter });
  const [globalLoading, setGlobalLoading] = useState(false);

  const [fetchPatientById] = useLazyGetPatientByIdQuery();

  const [activeKey, setActiveKey] = useState<'1' | '2'>('1');
  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(), 
    toDate: new Date()
  });
  
  useEffect(() => {
    dispatch(setPageCode('Lab'));
    dispatch(setDivContent('Clinical Laboratory'));
  }, []);

  const { data: ordersResponse } = useFilterDiagnosticOrdersQuery({
    page: 0,
    size: 1000,
    hasLaboratory: true
  });

  const {
    data: testsResponse,
    refetch: fetchAllTests
  } = useGetTestsByOrderIdQuery(
    order?.id ? { orderId: order.id, page: 0, size: 1000 } : skipToken
  );

  const allTestsList = testsResponse?.data ?? [];

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
        await safeRefetch(OrdersRef.current?.refetchOrders);

        if (order?.id) {
          await safeRefetch(fetchAllTests);
        }

        if (test?.id) {
          await safeRefetch(fecthSample);
        }

        await safeRefetch(TestsRef.current?.fetchTest);

      } finally {
        setGlobalLoading(false);
      }
    };

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

    const stepsData = [
      { key: DiagnosticOrderTestStatus.SAMPLE_COLLECTED, value: 'Sample Collected' },
      { key: DiagnosticOrderTestStatus.ACCEPTED, value: 'Accepted' },
      { key: DiagnosticOrderTestStatus.REJECTED, value: 'Rejected', isError: true },
      { key: DiagnosticOrderTestStatus.RESULT_READY, value: 'Result Ready' },
      { key: DiagnosticOrderTestStatus.RESULT_APPROVED, value: 'Result Approved' },
      { key: DiagnosticOrderTestStatus.RESULT_REJECTED, value: 'Result Rejected', isError: true }
    ];

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
        if (
          step.key === DiagnosticOrderTestStatus.RESULT_REJECTED &&
          test?.processingStatus !== DiagnosticOrderTestStatus.RESULT_REJECTED
        ) {
          return false;
        }

        if (
          step.key === DiagnosticOrderTestStatus.RESULT_APPROVED &&
          test?.processingStatus === DiagnosticOrderTestStatus.RESULT_REJECTED
        ) {
          return false;
        }

        return true;
      });
    }, [stepsData, test?.processingStatus]);


    const activeStep = stepsDataComputed.findIndex(
      s => s.key === test?.processingStatus
    );

  const [updateTest] = useUpdateDiagnosticOrderTestMutation();

  const saveTest = async payload => {
    if (!test?.id) return;
    await updateTest({ id: test.id, body: payload }).unwrap();
    fetchAllTests();
  };

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
                      <MyStepper stepsList={stepsDataComputed} activeStep={activeStep} />
                  </Col>
                </Row>
              )}
              {test.id && (
                <Row>
                  Number of Samples Collected: {samplesList.length}
                </Row>
              )}
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
                    <Result
                      order={order}
                      setTest={setTest}
                      loading={globalLoading}
                      fetchAllTests={fetchAllTests}
                      refetchAllLabData={refetchAllLabData}
                      fecthSample={fecthSample}
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
};

export default Lab;
