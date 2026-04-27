import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useGetCollectedSamplesByOrderTestIdQuery } from '@/services/setup/diagnosticTest/diagnosticOrderTestCollectedSampleService';
import { DiagnosticOrderTestStatus } from '@/types/model-types-new';
import { skipToken } from '@reduxjs/toolkit/query';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Col, Form, Row, Tabs } from 'rsuite';

import DetailsCard from '@/components/DetailsCard';
import MyInput from '@/components/MyInput';
import MyStepper from '@/components/MyStepper';
import MyTab from '@/components/MyTab';
import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';
import { newApDiagnosticOrders, newApDiagnosticOrderTests } from '@/types/model-types-constructor';
import {
  faCircleCheck,
  faClock,
  faRectangleList,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import RequestedTest from '../rad-module/requested-tests/RequestedTest';
import Orders from './Orders';
import PatientSide from '@/pages/encounter/encounter-main-info-section/PatienSide';
import Result from './Result';
import Tests from './Tests';
import { newPatient, newPatientEncounter } from '@/types/model-types-constructor-new';
import { useLazyGetEncounterByIdQuery } from '@/services/encounters/patientEncounterService';
import ReviewResults from './ReviewResults';

const safeRefetch = async (fn?: () => any) => {
  if (!fn) return;
  try {
    await fn();
  } catch { }
};

const Lab = () => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const user = authSlice?.user;
  const OrdersRef = useRef<any>(null);
  const TestsRef = useRef<any>(null);
  const [mainActiveTab, setMainActiveTab] = useState('1');
  const [order, setOrder] = useState<any>({ ...newApDiagnosticOrders });
  const [test, setTest] = useState<any>({ ...newApDiagnosticOrderTests });
  const [patient, setPatient] = useState({ ...newPatient });
  const [encounter, setEncounter] = useState({ ...newPatientEncounter });
  const [globalLoading, setGlobalLoading] = useState(false);
  const [visibleTests, setVisibleTests] = useState<any[]>([]);
const [activeKey, setActiveKey] = useState('1');
  const [orderNumberFilter, setOrderNumberFilter] = useState<string>('');

  const [getBulkPatientBasicInfo] = useGetBulkPatientBasicInfoMutation();
  const [getEncounterById] = useLazyGetEncounterByIdQuery();
  const [activeKey2, setActiveKey2] = useState('1');

  useEffect(() => {
    dispatch(setPageCode('Lab'));
    dispatch(setDivContent('Clinical Laboratory'));
  }, []);

  const today = new Date();

  const [dateFilter, setDateFilter] = useState({
    fromDate: today,
    toDate: today
  });

  const { data: samplesResponse, refetch: fecthSample } = useGetCollectedSamplesByOrderTestIdQuery(
    test?.id ? { orderTestId: test.id, page: 0, size: 20 } : skipToken
  );

  const samplesList = samplesResponse?.data ?? [];

  const refetchAllLabData = async () => {
    setGlobalLoading(true);

    try {
      await safeRefetch(OrdersRef.current?.refetchOrders);

      if (test?.id) {
        await safeRefetch(fecthSample);
      }

      await safeRefetch(TestsRef.current?.fetchTest);
    } finally {
      setGlobalLoading(false);
    }
  };

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

  const isAcceptedLike = (status?: DiagnosticOrderTestStatus) =>
    status === DiagnosticOrderTestStatus.ACCEPTED || status === DiagnosticOrderTestStatus.PARTIALLY;

  const activeStep = stepsDataComputed.findIndex(s =>
    isAcceptedLike(test?.processingStatus)
      ? s.key === DiagnosticOrderTestStatus.ACCEPTED
      : s.key === test?.processingStatus
  );

  useEffect(() => {
    if (!order?.patientId) {
      setPatient({ ...newPatient });
      return;
    }

    getBulkPatientBasicInfo([Number(order.patientId)])
      .unwrap()
      .then((res: any[]) => {
        if (res?.length > 0) {
          setPatient(res[0]);
        } else {
          setPatient({ ...newPatient });
        }
      })
      .catch(() => {
        setPatient({ ...newPatient });
      });
  }, [order?.patientId]);

  useEffect(() => {
    if (!order?.encounterId) {
      setEncounter({ ...newPatientEncounter });
      return;
    }

    getEncounterById({ id: order.encounterId })
      .unwrap()
      .then((res: any) => {
        setEncounter(res ?? { ...newPatientEncounter });
      })
      .catch(() => {
        setEncounter({ ...newPatientEncounter });
      });
  }, [order?.encounterId]);

  const newTestsCount = useMemo(
    () => visibleTests.filter(t => t.processingStatus === DiagnosticOrderTestStatus.NEW).length,
    [visibleTests]
  );

  const sampleCollectedTestsCount = useMemo(
    () =>
      visibleTests.filter(t => t.processingStatus === DiagnosticOrderTestStatus.SAMPLE_COLLECTED)
        .length,
    [visibleTests]
  );

  const resultApprovedCount = useMemo(
    () =>
      visibleTests.filter(t => t.processingStatus === DiagnosticOrderTestStatus.RESULT_APPROVED)
        .length,
    [visibleTests]
  );

  const totalTestsCount = visibleTests.length;

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';
  const innerTabsData = [
    {
      title: 'Tests',
      content: (
        <Tests
          ref={TestsRef}
          order={order}
          setTest={setTest}
          test={test}
          samplesList={samplesList}
          fecthSample={fecthSample}
          loading={globalLoading}
          refetchAllLabData={refetchAllLabData}
          onTestsLoaded={setVisibleTests}
        />
      )
    },
    {
      title: 'Results',
      content: (
        <Result
          order={order}
          setTest={setTest}
          loading={globalLoading}
          refetchAllLabData={refetchAllLabData}
        />
      )
    }
  ];
  const tabData = [
    {
      title: 'Laboratory',
      content: (
        <>
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
                number={totalTestsCount}
                icon={faTriangleExclamation}
                color="--gray-dark"
                backgroundClassName="total-test-section"
                width={'20vw'}
              />
            </div>

            <div dir={dir}>
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
                        orderNumberFilter={orderNumberFilter}
                      />
                    </Col>
                    <Col xs={10}>
                      <Form fluid layout="inline">
                        <MyInput
                          width={130}
                          placeholder="From Date"
                          fieldType="date"
                          fieldName="fromDate"
                          record={dateFilter}
                          setRecord={setDateFilter}
                          showLabel={false}
                        />
                        <MyInput
                          width={130}
                          placeholder="To Date"
                          fieldType="date"
                          fieldName="toDate"
                          record={dateFilter}
                          setRecord={setDateFilter}
                          showLabel={false}
                        />
                        <MyInput
                          width={130}
                          placeholder="Order ID"
                          fieldType="text"
                          fieldName="orderNumber"
                          record={{ orderNumber: orderNumberFilter }}
                          setRecord={(val: any) => setOrderNumberFilter(val.orderNumber ?? '')}
                          showLabel={false}
                        />
                      </Form>

                      {test.id && (
                        <Row>
                          <Col md={24}>
                            <MyStepper stepsList={stepsDataComputed} activeStep={activeStep} />
                          </Col>
                        </Row>
                      )}
                      {test.id && <Row>Number of Samples Collected: {samplesList.length}</Row>}
                    </Col>
                  </Row>
                  <MyTab
                    data={innerTabsData}
                    activeTab={activeKey2}
                    setActiveTab={setActiveKey2}
                    lazy
                  />
                </div>

                <div className="right-boxs">
                  <PatientSide
                    patient={patient}
                    setPatient={setPatient}
                    encounter={encounter}
                    showDiagnosis={false}
                    showVisitDetails={false}
                    showBalance={false}
                  />
                </div>
              </div>
            </div>
          </>
        </>
      )
    },
    {
      title: 'Requested Tests',
      content: <RequestedTest requestType="LABORATORY" />
    },
    {
      title: 'Reviewed Results',
      content: (
        <div dir={dir}>
          <ReviewResults
            setEncounter={setEncounter}
            setPatient={setPatient}
            user={user?.id}

          />        </div>
      )
    }
  ];

  return (
    <>
      <MyTab
        data={tabData}
        activeTab={mainActiveTab}
        setActiveTab={setMainActiveTab}
        lazy
      />
    </>
  );
};

export default Lab;
