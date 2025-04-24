import { useEffect, useRef, useState } from 'react';

import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useGetDiagnosticsTestLaboratoryListQuery,
} from '@/services/setupService';
import { RootState } from '@/store';
import { notify } from '@/utils/uiReducerActions';
import {
  faArrowDown,
  faArrowUp,
  faCircleExclamation,
  faComment,
  faDiagramPredecessor,
  faFileLines,
  faFilter,
  faPenToSquare,
  faPrint,
  faStar,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ConversionIcon from '@rsuite/icons/Conversion';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { useSelector } from 'react-redux';
import { HStack, SelectPicker, Tooltip, Whisper } from 'rsuite';
import './styles.less';

import {
  useGetLovAllValuesQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import {
  DatePicker,
  Divider,
  Form,
  IconButton,
  Input,
  Modal,
  Pagination,
  Row,
  Table
} from 'rsuite';

import {
  useGetDiagnosticOrderTestResultQuery,
  useGetLabResultLogListQuery,
  useGetOrderTestResultNotesByResultIdQuery,
  useGetOrderTestSamplesByTestIdQuery,
  useSaveDiagnosticOrderTestResultMutation,
  useSaveDiagnosticOrderTestResultsNotesMutation,
  useSaveLabResultLogMutation
} from '@/services/labService';
import { addFilterToListRequest, fromCamelCaseToDBName, getNumericTimestamp } from '@/utils';


import ChatModal from '@/components/ChatModal';
import MyInput from '@/components/MyInput';
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
  Button,
  Col,
  Panel,
  Steps
} from 'rsuite';
import PatientSide from './PatienSide';
import './styles.less';
const { Column, HeaderCell, Cell } = Table;


import Orders from './Orders';
import Tests from './Tests';
import CancellationModal from '@/components/CancellationModal';
import Result from './Result';
const Lab = () => {
  const dispatch = useAppDispatch();
  const uiSlice = useAppSelector(state => state.auth);
  const [localUser, setLocalUser] = useState(uiSlice?.user);
  const [openRejectedModal, setOpenRejectedModal] = useState(false);
  const [openRejectedResultModal, setOpenRejectedResultModal] = useState(false);
  const [currentStep, setCurrentStep] = useState("6055029972709625");
  const [openLogModal, setOpenLogModal] = useState(false);
  const [encounter, setEncounter] = useState({ ...newApEncounter });
  const [patient, setPatient] = useState({ ...newApPatient });
  const [order, setOrder] = useState<any>({ ...newApDiagnosticOrders })
  const [test, setTest] = useState<any>({ ...newApDiagnosticOrderTests });
  const [note, setNote] = useState({ ...newApDiagnosticOrderTestsNotes });
  const [result, setResult] = useState({ ...newApDiagnosticOrderTestsResult, resultLkey: '' })
  const [activeRowKey, setActiveRowKey] = useState(null);
  const [listOrdersResponse, setListOrdersResponse] = useState<ListRequest>({
    ...initialListRequest

  });
  const [listLogRequest, setListLogRequest] = useState({
    ...initialListRequest,
    filters: [
      {

        fieldName: "result_key",
        operator: "match",
        value: result?.key ?? undefined,

      }
    ]

  })
  const { data: lovValues } = useGetLovAllValuesQuery({ ...initialListRequestAllValues });
 
  const { data: samplesList, refetch: fecthSample } = useGetOrderTestSamplesByTestIdQuery(test?.key || undefined, { skip: test.key == null });
  const { data: resultLogList, refetch: fetchLogs, isFetching: fetchLog } = useGetLabResultLogListQuery({ ...listLogRequest });
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Clinical Laboratory</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Lab'));
  dispatch(setDivContent(divContentHTML));

  const [listOrdersTestResponse, setListOrdersTestResponse] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: "order_key",
        operator: "match",
        value: order?.key ?? undefined,
      },
      {
        fieldName: "order_type_lkey",
        operator: "match",
        value: "862810597620632",
      }


    ],
  });

  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),//new Date(),
    toDate: new Date()
  });
  const [openNoteResultModal, setOpenNoteResultModal] = useState(false);
  const { data: laboratoryList } = useGetDiagnosticsTestLaboratoryListQuery({
    ...initialListRequest

  });
  const [selectedCatValue, setSelectedCatValue] = useState(null)
  const { data: laboratoryListToFilter } = useGetDiagnosticsTestLaboratoryListQuery({
    ...initialListRequest,
    filters: [
      {

        fieldName: "category_lkey",
        operator: "match",
        value: selectedCatValue,
      }
    ]

  }, {
    skip: !selectedCatValue
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
  const [listPrevResultResponse, setListPrevResultResponse] = useState<ListRequest>({
    ...initialListRequest,
    sortBy: "createdAt",
    sortType: 'desc',
    filters: [
      {
        fieldName: "patient_key",
        operator: "match",
        value: patient?.key || undefined,
      },
      {
        fieldName: "medical_test_key",
        operator: "match",
        value: test?.testKey || undefined,
      }


    ],
  });
  const { data: resultsList, refetch: resultFetch } = useGetDiagnosticOrderTestResultQuery({ ...listResultResponse });
  const { data: prevResultsList, refetch: prevResultFetch } = useGetDiagnosticOrderTestResultQuery({ ...listPrevResultResponse });
  const [labDetails, setLabDetails] = useState<any>({ ...newApDiagnosticTestLaboratory });

  

  const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
  const [newMessage, setNewMessage] = useState("");
  
 
  const [saveTest] = useSaveDiagnosticOrderTestMutation();
 
  const [saveResult] = useSaveDiagnosticOrderTestResultMutation();
  const [saveResultNote] = useSaveDiagnosticOrderTestResultsNotesMutation();
  const [saveResultLog, saveResultLogMutation] = useSaveLabResultLogMutation();
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    handleManualSearch();
  }, []);
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
    const updatedPrevFilters = [
      {
        fieldName: "patient_key",
        operator: "match",
        value: patient?.key || undefined,
      },
      {
        fieldName: "medical_test_key",
        operator: "match",
        value: test?.testKey || undefined,
      }


    ];
    setListPrevResultResponse((prevRequest) => ({
      ...prevRequest,
      filters: updatedPrevFilters,
    }));

  }, [test]);

  useEffect(() => {
    
    resultFetch();
    const updatedFilter = [
      {

        fieldName: "result_key",
        operator: "match",
        value: result?.key ?? undefined,

      }
    ];
    setListLogRequest((prevRequest) => ({
      ...prevRequest,
      filters: updatedFilter,
    }));
    fetchLogs();
  }, [result]);
  useEffect(() => {
 
    fetchLogs();
  }, [saveResultLogMutation])
  useEffect(() => {
    handleManualSearch();
  }, []);

  useEffect(() => {
    if (selectedCatValue != null && selectedCatValue !== "") {

      if (laboratoryListToFilter?.object?.length == 0) {
        const value = undefined;
        setListOrdersTestResponse(
          addFilterToListRequest(
            fromCamelCaseToDBName("testKey"),
            "in",
            value,
            listOrdersTestResponse
          )
        );
      }
      else {
        const value = laboratoryListToFilter?.object
          ?.map(cat => `(${cat.testKey})`)
          .join(" ");
        setListOrdersTestResponse(
          addFilterToListRequest(
            fromCamelCaseToDBName("testKey"),
            "in",
            value,
            listOrdersTestResponse
          )
        );
      }



    }
    else {
      setListOrdersTestResponse({
        ...listOrdersTestResponse, filters: [
          {
            fieldName: "order_key",
            operator: "match",
            value: order?.key ?? undefined,
          },
          {
            fieldName: "order_type_lkey",
            operator: "match",
            value: "862810597620632",
          }]
      })
    }
  }, [selectedCatValue, laboratoryListToFilter]);



  

  


 
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListOrdersResponse(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'startsWithIgnoreCase',
          value,
          listOrdersResponse
        )
      );
    } else {
      setListOrdersResponse({ ...listOrdersResponse, filters: [] });
    }
  };
  const handleFilterResultChange = (fieldName, value) => {
    if (value) {
      setListOrdersTestResponse(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'startsWithIgnoreCase',
          value,
          listOrdersTestResponse
        )
      );
    } else {
      setListOrdersTestResponse({
        ...listOrdersTestResponse, filters: [
          {
            fieldName: "order_key",
            operator: "match",
            value: order?.key ?? undefined,
          },
          {
            fieldName: "order_type_lkey",
            operator: "match",
            value: "862810597620632",
          }


        ]
      });
    }
  };
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
  const joinValuesFromArray = (keys) => {

    return keys
      .map(key => lovValues?.object?.find(lov => lov.key === key))
      .filter(obj => obj !== undefined)
      .map(obj => obj.lovDisplayVale)
      .join(', ');
  };
  const handleValueChange = async (value, rowData) => {

    const Response = await saveResult({ ...rowData, resultLkey: String(value) }).unwrap();


    const v = rowData.normalRange?.lovList.find((item) => item == value);
    const valueText=lovValues?.object?.find(lov => lov.key === value)?.lovDisplayVale
    if (v) {
      
      const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
      saveResult({ ...result, marker: "6731498382453316", statusLkey: '265123250697000' , resultLkey: String(value)}).unwrap();
      saveResultLog({ ...newApLabResultLog, resultKey: result?.key, createdBy: localUser.fullName, resultValue:valueText }).unwrap();
      setTest({ ...newApDiagnosticOrderTests });

      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
      setTest({ ...Response });
      // await fetchTest();
      await resultFetch();

    }
    else {
    
      const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000', readyAt: Date.now() }).unwrap();
      saveResult({ ...result, marker: "6730122218786367", statusLkey: '265123250697000', resultLkey: String(value) }).unwrap();
      saveResultLog({ ...newApLabResultLog, resultKey: result?.key, createdBy: localUser.fullName, resultValue:valueText }).unwrap();
      setTest({ ...newApDiagnosticOrderTests });
      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
      setTest({ ...Response });
      // await fetchTest();
      await resultFetch();
    }
    await resultFetch().then(() => {

    });
    setActiveRowKey(null)
  };

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
        <Orders order={order} setOrder={setOrder}  listOrdersResponse={listOrdersResponse} setListOrdersResponse={setListOrdersResponse}/>
          </Col>
          <Col xs={10}>
            <Row>
              <DatePicker

                oneTap
                placeholder="From Date"
                value={dateFilter.fromDate}
                onChange={e => setDateFilter({ ...dateFilter, fromDate: e })}
                style={{ width: '230px', marginRight: '5px',fontFamily:'Inter' ,fontSize:'14px',height:'30px' }}
              />
              <DatePicker
                oneTap
                placeholder="To Date"
                value={dateFilter.toDate}
                onChange={e => setDateFilter({ ...dateFilter, toDate: e })}
                style={{ width: '230px', marginRight: '5px',fontFamily:'Inter' ,fontSize:'14px',height:'30px' }}
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
            <Tests order={order} setTest={setTest} test={test} samplesList={samplesList}/>}
        </Row>
        <Row>
          {test.key && 
         <Result result={result} setResult={setResult} test={test} setTest={setTest} saveTest={saveTest} labDetails={labDetails} />
          }
        </Row>

      </div>

      <div className='right-box' >
        <PatientSide patient={patient} encounter={encounter} />
      </div>
    </div>

 
   
    <Modal open={openRejectedResultModal} onClose={() => setOpenRejectedResultModal(false)} size="xs">
      <Modal.Header>
        <Modal.Title>Why do you want to reject the Test? </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form >
          <MyInput
            disabled={false}
            fieldType={"textarea"}
            fieldName={"rejectedReason"}
            record={result}
            setRecord={setResult}

          /></Form>
      </Modal.Body>
      <Modal.Footer style={{ display: "flex", justifyContent: 'flex-end' }}>
        <Button
          appearance="primary"
          color="cyan"
          onClick={async () => {
            {
              try {
                await saveResult({ ...result, statusLkey: '6488555526802885', rejectedAt: Date.now() }).unwrap();
                dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                resultFetch();
                setOpenRejectedResultModal(false)
              }
              catch (error) {
                dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
              }
            }
          }
          }
        >
          Save
        </Button>
        <Button
          appearance="ghost"
          color="cyan"
          onClick={() => setOpenRejectedResultModal(false)}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
    <Modal open={openLogModal} onClose={() => setOpenLogModal(false)} size="md">
      <Modal.Header>
        <Modal.Title>  </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table
          data={resultLogList?.object ?? []}
          loading={fetchLog}
        >
          <Column flexGrow={1} fullText>
            <HeaderCell>
              <FontAwesomeIcon icon={faFilter} style={{ marginRight: '5px' }} />
              <Translate>RESULT </Translate>
            </HeaderCell>
            <Cell  >
              {rowData => rowData.resultValue}
            </Cell>
          </Column>
          <Column flexGrow={1} fullText>
            <HeaderCell>
              <FontAwesomeIcon icon={faFilter} style={{ marginRight: '5px' }} />
              <Translate>Time </Translate>
            </HeaderCell>
            <Cell  >
              {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ""}
            </Cell>
          </Column>
          <Column flexGrow={1} fullText>
            <HeaderCell>
              <FontAwesomeIcon icon={faFilter} style={{ marginRight: '5px' }} />
              <Translate>log </Translate>
            </HeaderCell>
            <Cell  >
              {rowData => rowData.createdBy}
            </Cell>
          </Column>
        </Table>
      </Modal.Body>
      <Modal.Footer style={{ display: "flex", justifyContent: 'flex-end' }}>
        
        <Button
          appearance="ghost"
          color="cyan"
          onClick={() => setOpenLogModal(false)}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  
  </>)
}
export default Lab;