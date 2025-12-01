import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useGetDiagnosticsTestLaboratoryListQuery } from '@/services/setupService';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Form, Row } from 'rsuite';
import './styles.less';
import { useGetOrderTestSamplesByTestIdQuery } from '@/services/labService';
import { addFilterToListRequest, getNumericTimestamp } from '@/utils';
import {
  useGetDiagnosticOrderQuery,
  useGetDiagnosticOrderTestQuery,
  useSaveDiagnosticOrderTestMutation
} from '@/services/encounterService';
import {
  newApDiagnosticOrders,
  newApDiagnosticOrderTests,
  newApDiagnosticOrderTestsResult,
  newApDiagnosticTestLaboratory,
  newApEncounter,
  newApPatient
} from '@/types/model-types-constructor';
import DetailsCard from '@/components/DetailsCard';
import {
  faCircleCheck,
  faClock,
  faRectangleList,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';

import { initialListRequest, ListRequest } from '@/types/types';
import { formatDateWithoutSeconds } from '@/utils';
import { Col } from 'rsuite';
import PatientSide from './PatienSide';
import './styles.less';
import MyStepper from '@/components/MyStepper';
import Orders from './Orders';
import Result from './Result';
import Tests from './Tests';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
const Lab = () => {
  const dispatch = useAppDispatch();
  const ResultRef = useRef(null);
  const TestRef = useRef(null);
   const authSlice = useAppSelector(state => state.auth);
  const refetchTest = () => {
    TestRef.current?.fetchTest();
  };

  const refetchResult = () => {
    ResultRef.current?.resultFetch();
  };
  useEffect(() => { }, [refetchResult]);
  const [currentStep, setCurrentStep] = useState('6055029972709625');
  const [encounter, setEncounter] = useState({ ...newApEncounter, discharge: false });
  const [patient, setPatient] = useState({ ...newApPatient });
  const [order, setOrder] = useState<any>({ ...newApDiagnosticOrders });
  const [test, setTest] = useState<any>({ ...newApDiagnosticOrderTests });
  const [result, setResult] = useState({ ...newApDiagnosticOrderTestsResult, resultLkey: '' });
  const [newTestsCount, setNewTestsCount] = useState<number>(0);
  const [sampleCollectedTestsCount, setSampleCollectedTestsCount] = useState<number>(0);
  const [resultApprovedCount, setResultApprovedCount] = useState<number>(0);
   const selectedDepartment = authSlice.selectedDepartment;
  const [listOrdersResponse, setListOrdersResponse] = useState<ListRequest>({
    pageSize: 1000,
    ...initialListRequest,
    // filters: [
    //   {
    //     fieldName: 'department_id',
    //     operator: 'match',
    //     value: selectedDepartment?.departmentId || undefined
    //   }]
  });
 
  console.log('selectedDepartment', selectedDepartment);
  const [listResultResponse, setListResultResponse] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'order_test_key',
        operator: 'match',
        value: test?.key || undefined
      }
    ]
  });

  const { data: samplesList, refetch: fecthSample } = useGetOrderTestSamplesByTestIdQuery(
    test?.key || undefined,
    { skip: test.key == null }
  );
  const divContent = (
      "Clinical Laboratory"
  );
  dispatch(setPageCode('Lab'));
  dispatch(setDivContent(divContent));

  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(), //new Date(),
    toDate: new Date()
  });

  const { data: laboratoryList } = useGetDiagnosticsTestLaboratoryListQuery({
    ...initialListRequest
  });

  const [labDetails, setLabDetails] = useState<any>({ ...newApDiagnosticTestLaboratory });
  const [saveTest] = useSaveDiagnosticOrderTestMutation();

  const stepsData = [
    { key: '6055207372976955', value: 'Sample Collected', description: ' ', isError: false },
    {
      key: '6055074111734636',
      value: 'Accepted',
      description: formatDateWithoutSeconds(test.acceptedAt),
      isError: false
    },
    {
      key: '6055192099058457',
      value: 'Rejected',
      description: formatDateWithoutSeconds(test.rejectedAt),
      isError: true
    },
    {
      key: '265123250697000',
      value: 'Result Ready',
      description: formatDateWithoutSeconds(test.readyAt),
      isError: false
    },
    {
      key: '265089168359400',
      value: 'Result Approved',
      description: formatDateWithoutSeconds(test.approvedAt)
    }
  ];
  const filteredStepsData = stepsData.filter(step =>
    currentStep == '6055192099058457' ? step.value !== 'Accepted' : step.value !== 'Rejected'
  );
  const activeStep = filteredStepsData.findIndex(step => step.key === currentStep);
  const [listOrdersForTodayResponse] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 1000,
    filters: [
      {
        fieldName: 'submitted_at',
        operator: 'between',
        value: getNumericTimestamp(new Date()) + '_' + getNumericTimestamp(new Date(), false)
      }
    ]
  });
  const { data: ordersListForToday } = useGetDiagnosticOrderQuery(listOrdersForTodayResponse);
  const filterdOrderListForToday = ordersListForToday?.object.filter(
    item => item.hasLaboratory === true
  );
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 1000,
    filters: [
      {
        fieldName: 'order_key',
        operator: 'in',
        value: filterdOrderListForToday
          ?.map(order => order.key)
          ?.map(key => `(${key})`)
          .join(' ')
      },
      {
        fieldName: 'order_type_lkey',
        operator: 'match',
        value: '862810597620632'
      },
      {
        fieldName: 'status_lkey',
        operator: 'match',
        value: '1804482322306061'
      }
    ]
  });
  const { data: allTestsList, refetch: fetchAllTests } = useGetDiagnosticOrderTestQuery({
    ...listRequest
  });

  const handleManualSearch = () => {
    if (dateFilter.fromDate && dateFilter.toDate) {
      const formattedFromDate = getNumericTimestamp(dateFilter.fromDate, true);

      const formattedToDate = getNumericTimestamp(dateFilter.toDate, false);

      setListOrdersResponse(
        addFilterToListRequest(
          'submitted_at',
          'between',
          formattedFromDate + '_' + formattedToDate,
          listOrdersResponse
        )
      );
    } else if (dateFilter.fromDate) {
      const formattedFromDate = getNumericTimestamp(dateFilter.fromDate, true);
      setListOrdersResponse(
        addFilterToListRequest('submitted_at', 'gte', formattedFromDate, listOrdersResponse)
      );
    } else if (dateFilter.toDate) {
      const formattedToDate = getNumericTimestamp(dateFilter.toDate, false);
      setListOrdersResponse(
        addFilterToListRequest('submitted_at', 'lte', formattedToDate, listOrdersResponse)
      );
    } else {
      setListOrdersResponse({ ...listOrdersResponse, filters: [] });
    }
  };

  // Effects
  useEffect(() => {
    if (!filterdOrderListForToday || filterdOrderListForToday.length === 0) return;

    const orderKeysString = filterdOrderListForToday.map(order => `(${order.key})`).join(' ');

    if (listRequest.filters?.[0]?.value !== orderKeysString) {
      setListRequest(prev => ({
        ...prev,
        filters: [
          {
            fieldName: 'order_key',
            operator: 'in',
            value: orderKeysString
          },
          {
            fieldName: 'order_type_lkey',
            operator: 'match',
            value: '862810597620632'
          },
          {
            fieldName: 'status_lkey',
            operator: 'match',
            value: '1804482322306061'
          }
        ]
      }));
    }
  }, [filterdOrderListForToday]);

  useEffect(() => {
    let newTests = 0;
    let sampleCollectedTests = 0;
    let resultApproved = 0;
    if (allTestsList?.object)
      for (const test of allTestsList?.object) {
        if (test?.processingStatusLvalue?.key === '6055029972709625') {
          newTests++;
        }
        if (test?.processingStatusLvalue?.key === '6055207372976955') {
          sampleCollectedTests++;
        }
        if (test?.processingStatusLvalue?.key === '265089168359400') {
          resultApproved++;
        }
      }
    setNewTestsCount(newTests);
    setSampleCollectedTestsCount(sampleCollectedTests);
    setResultApprovedCount(resultApproved);
  }, [allTestsList]);

  useEffect(() => {
    handleManualSearch();
  }, []);

  useEffect(() => {}, [refetchResult]);

  useEffect(() => {
    setResult({ ...newApDiagnosticOrderTestsResult });
    const updatedFilters = [
      {
        fieldName: 'order_test_key',
        operator: 'match',
        value: test?.key || undefined
      }
    ];
    setListResultResponse(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
  }, [test]);

  useEffect(() => {
    setPatient(order.patient);
    setEncounter(order.encounter);
  }, [order]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  useEffect(() => {
    if (dateFilter.fromDate && dateFilter.toDate) {
      const formattedFromDate = getNumericTimestamp(dateFilter.fromDate, true);
      const formattedToDate = getNumericTimestamp(dateFilter.toDate, false);
      setListOrdersResponse(
        addFilterToListRequest(
          'submitted_at',
          'between',
          formattedFromDate + '_' + formattedToDate,
          listOrdersResponse
        )
      );
    } else if (dateFilter.fromDate) {
      const formattedFromDate = getNumericTimestamp(dateFilter.fromDate, true);
      setListOrdersResponse(
        addFilterToListRequest('submitted_at', 'gte', formattedFromDate, listOrdersResponse)
      );
    } else if (dateFilter.toDate) {
      const formattedToDate = getNumericTimestamp(dateFilter.toDate, false);
      setListOrdersResponse(
        addFilterToListRequest('submitted_at', 'lte', formattedToDate, listOrdersResponse)
      );
    } else {
      setListOrdersResponse({ ...listOrdersResponse, filters: [] });
    }
  }, [dateFilter]);

  useEffect(() => {
    setResult({ ...newApDiagnosticOrderTestsResult });
    const cat = laboratoryList?.object?.find(item => item.testKey === test.testKey);
    setLabDetails(cat);
    setCurrentStep(test.processingStatusLkey);
  }, [test]);

  useEffect(() => {
    handleManualSearch();
  }, []);

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
          number={allTestsList?.object?.length ? allTestsList?.object?.length : 0}
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
                order={order}
                setOrder={setOrder}
                listOrdersResponse={listOrdersResponse}
                setListOrdersResponse={setListOrdersResponse}
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

              {test.key && (
                <Row>
                  <Col md={24}>
                    <MyStepper stepsList={filteredStepsData} activeStep={activeStep} />
                  </Col>
                </Row>
              )}
              {test.key && <Row>Number of Samples Collected:{samplesList?.object?.length}</Row>}
            </Col>
          </Row>
          <Row>
            <Tests
              ref={TestRef}
              order={order}
              setTest={setTest}
              test={test}
              samplesList={samplesList}
              resultFetch={refetchResult}
              fecthSample={fecthSample}
              fetchAllTests={fetchAllTests}
            />
          </Row>
          <Row>
            <Result
              result={result}
              setResult={setResult}
              test={test}
              setTest={setTest}
              saveTest={saveTest}
              labDetails={labDetails}
              patient={patient}
              samplesList={samplesList}
              fetchTest={refetchTest}
              refetchTest={refetchTest}
              fecthSample={fecthSample}
              listResultResponse={listResultResponse}
              setListResultResponse={setListResultResponse}
              fetchAllTests={fetchAllTests}
            />

          </Row>
        </div>

        <div className="right-boxs">
          <PatientSide patient={patient} encounter={encounter} />
        </div>
      </div>
    </>
  );
};
export default Lab;
