import { useEffect, useState,useRef } from 'react';

import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useGetDiagnosticsTestLaboratoryListQuery,
} from '@/services/setupService';
import { RootState } from '@/store';
import { notify } from '@/utils/uiReducerActions';


import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { useSelector } from 'react-redux';

import './styles.less';

import {
  useGetLovAllValuesQuery,
} from '@/services/setupService';
import {
  DatePicker,
  Row,
  Table
} from 'rsuite';

import {
  useGetLabResultLogListQuery,
  useGetOrderTestSamplesByTestIdQuery,
  useSaveDiagnosticOrderTestResultMutation,
  useSaveLabResultLogMutation
} from '@/services/labService';
import { addFilterToListRequest, fromCamelCaseToDBName, getNumericTimestamp } from '@/utils';


import {
  useSaveDiagnosticOrderTestMutation
} from '@/services/encounterService';
import {
  newApDiagnosticOrders,
  newApDiagnosticOrderTests,
  newApDiagnosticOrderTestsNotes,
  newApDiagnosticOrderTestsResult,
  newApDiagnosticTestLaboratory,
  newApEncounter,
  newApLabResultLog,
  newApPatient
} from '@/types/model-types-constructor';
import { initialListRequest, initialListRequestAllValues, ListRequest } from '@/types/types';
import {
  Col,
  Steps
} from 'rsuite';
import PatientSide from './PatienSide';
import './styles.less';
const { Column, HeaderCell, Cell } = Table;


import Orders from './Orders';
import Result from './Result';
import Tests from './Tests';
const Lab = () => {
  const dispatch = useAppDispatch();
  const uiSlice = useAppSelector(state => state.auth);
  const ResultRef = useRef(null);
  const TestRef = useRef(null);
  const refetchTest = () => {
    TestRef.current?.refetchTest(); 
  };
  const refetchResult = () => {
    ResultRef.current?.resultFetch(); 
  };
   useEffect(() => {
          console.log("resultFetch in Lab", refetchResult)
      },[refetchResult]);
  const [localUser, setLocalUser] = useState(uiSlice?.user);
  const [currentStep, setCurrentStep] = useState("6055029972709625");
  const [encounter, setEncounter] = useState({ ...newApEncounter });
  const [patient, setPatient] = useState({ ...newApPatient });
  const [order, setOrder] = useState<any>({ ...newApDiagnosticOrders })
  const [test, setTest] = useState<any>({ ...newApDiagnosticOrderTests });
  const [result, setResult] = useState({ ...newApDiagnosticOrderTestsResult, resultLkey: '' })
  const [listOrdersResponse, setListOrdersResponse] = useState<ListRequest>({
    ...initialListRequest

  });
const [listResultResponse, setListResultResponse] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: "order_test_key",
                operator: "match",
                value: test?.key || undefined,
            }


        ],
    });

  const { data: samplesList, refetch: fecthSample } = useGetOrderTestSamplesByTestIdQuery(test?.key || undefined, { skip: test.key == null });
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Clinical Laboratory</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Lab'));
  dispatch(setDivContent(divContentHTML));



  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),//new Date(),
    toDate: new Date()
  });

  const { data: laboratoryList } = useGetDiagnosticsTestLaboratoryListQuery({
    ...initialListRequest

  });


  const [labDetails, setLabDetails] = useState<any>({ ...newApDiagnosticTestLaboratory });
  const [saveTest] = useSaveDiagnosticOrderTestMutation();


  useEffect(() => {
    handleManualSearch();
  }, []);

  useEffect(() => {
         setResult({ ...newApDiagnosticOrderTestsResult })
         const updatedFilters = [
             {
                 fieldName: "order_test_key",
                 operator: "match",
                 value: test?.key || undefined,
             }
 
 
         ];
         setListResultResponse((prevRequest) => ({
             ...prevRequest,
             filters: updatedFilters,
         }));
 
    
 
     }, [test]);
  useEffect(() => {
    setPatient(order.patient);
    setEncounter(order.encounter);
  }, [order]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent("  "));
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
    setResult({ ...newApDiagnosticOrderTestsResult })
    const cat = laboratoryList?.object?.find((item) => item.testKey === test.testKey);
    setLabDetails(cat);
    setCurrentStep(test.processingStatusLkey);

  }, [test]);

 
  useEffect(() => {
    handleManualSearch();
  }, []);


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
;

  const stepsData = [
    { key: "6055207372976955", value: "Sample Collected", time: " " },
    { key: "6055074111734636", value: "Accepted", time: test.acceptedAt ? new Date(test.acceptedAt).toLocaleString() : "" },
    { key: "6055192099058457", value: "Rejected", time: test.rejectedAt ? new Date(test.rejectedAt).toLocaleString() : "" },
    { key: "265123250697000", value: "Result Ready", time: test.readyAt ? new Date(test.readyAt).toLocaleString() : "" },
    { key: "265089168359400", value: "Result Approved", time: test.approvedAt ? new Date(test.approvedAt).toLocaleString() : "" },
  ];

  const filteredStepsData = stepsData.filter(step =>
    currentStep == "6055192099058457" ? step.value !== "Accepted" : step.value !== "Rejected"
  );


  return (<>

    <div className='container'>
      <div className='left-box' >
        <Row>
          <Col xs={14}>
            <Orders order={order} setOrder={setOrder} listOrdersResponse={listOrdersResponse} setListOrdersResponse={setListOrdersResponse} />
          </Col>
          <Col xs={10}>
            <Row>
              <DatePicker

                oneTap
                placeholder="From Date"
                value={dateFilter.fromDate}
                onChange={e => setDateFilter({ ...dateFilter, fromDate: e })}
                style={{ width: '230px', marginRight: '5px', fontFamily: 'Inter', fontSize: '14px', height: '30px' }}
              />
              <DatePicker
                oneTap
                placeholder="To Date"
                value={dateFilter.toDate}
                onChange={e => setDateFilter({ ...dateFilter, toDate: e })}
                style={{ width: '230px', marginRight: '5px', fontFamily: 'Inter', fontSize: '14px', height: '30px' }}
              />

            </Row>


            {test.key &&
              <Row>
                <Steps current={filteredStepsData.findIndex(step => step.key === currentStep)} small={true} >
                  {filteredStepsData.map((step, index) => {
                    let stepStatus = "process";
                    let stepColor = "inherit";

                    const currentIndex = filteredStepsData.findIndex(s => s.key === currentStep);

                    if (index < currentIndex) {
                      stepStatus = "finish";
                    }
                    else if (step.key === currentStep) {
                      if (currentStep == "6055192099058457") {
                        stepStatus = "error"
                      }
                      else {
                        stepStatus = "process";
                        stepColor = "blue";
                      }
                    } else {
                      stepStatus = "wait";

                    }

                    return (
                      <Steps.Item
                        key={step.key}
                        title={<span style={{ color: stepColor }}>{step.value}</span>}
                        description={<span style={{ color: stepColor }}>{step.time}</span>}
                        status={stepStatus}
                      />
                    );
                  })}
                </Steps>
              </Row>}
            {test.key && <Row>Number of Samples Collected:{samplesList?.object?.length}</Row>}
          </Col>
        </Row>
        <Row>
          {order.key &&
            <Tests order={order} setTest={setTest} test={test} samplesList={samplesList} resultFetch={refetchResult} fecthSample={fecthSample}/>}
        </Row>
        <Row>
          {test.key &&
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
              fecthSample={fecthSample}
              listResultResponse={listResultResponse}
              setListResultResponse={setListResultResponse}/>
          }
        </Row>

      </div>

      <div className='right-box' >
        <PatientSide patient={patient} encounter={encounter} />
      </div>
    </div>


  </>)
}
export default Lab;