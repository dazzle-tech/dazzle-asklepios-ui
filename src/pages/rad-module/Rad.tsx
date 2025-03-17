import { useState, useEffect, useRef } from 'react';
import React from 'react';
import Translate from '@/components/Translate';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import ConversionIcon from '@rsuite/icons/Conversion';
import { HStack } from 'rsuite';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import { Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { Image, List } from '@rsuite/icons';
import {

  useGetDiagnosticsTestLaboratoryListQuery,

} from '@/services/setupService';
import {
  useSaveDiagnosticOrderTestRadReportMutation,
  useGetDiagnosticOrderTestRadReportListQuery,
  useGetDiagnosticOrderTestReportNotesByReportIdQuery,
  useSaveDiagnosticOrderTestReportNotesMutation
} from '@/services/radService';
import {
  faHandDots,
  faTriangleExclamation
  , faClipboardList,
  faComment
  ,
  faPrint
  ,
  faFileLines,
  faVialCircleCheck,
  faDiagramPredecessor,
  faFilter,
  faStar,
  faLandMineOn,
  faArrowUp,
  faArrowDown,
  faPaperPlane,
  faCircleExclamation,
  faRightFromBracket
  , faHospitalUser

} from '@fortawesome/free-solid-svg-icons';
import './styles.less';
import { Badge, SelectPicker, ButtonGroup } from 'rsuite';
import { FaCalendar, FaBold, FaItalic, FaLink } from 'react-icons/fa';
import {
  InputGroup,
  ButtonToolbar,
  Form,
  IconButton,
  Input,
  Divider,
  Drawer,
  Table,
  Pagination,
  Row,
  Progress,
  DatePicker,
  Dropdown,
  Text,
  Modal

} from 'rsuite';
import {

  useGetLovValuesByCodeQuery,
  useGetLovAllValuesQuery
} from '@/services/setupService';
import {
  faFaceSmile
} from '@fortawesome/free-solid-svg-icons';
import {
  useGetOrderTestNotesByTestIdQuery,
  useSaveDiagnosticOrderTestNotesMutation,
  useGetResultNormalRangeQuery
} from '@/services/labService';
import { addFilterToListRequest, formatDate, fromCamelCaseToDBName, getNumericTimestamp } from '@/utils';


import MyInput from '@/components/MyInput';

import SearchIcon from '@rsuite/icons/Search';
import {
  Panel, FlexboxGrid, Col, Stack, Button, Timeline
  , Steps
} from 'rsuite';
import {
  newApDiagnosticOrders,
  newApDiagnosticOrderTests,
  newApDiagnosticOrderTestsNotes,
  newApDiagnosticOrderTestsRadReport,
  newApDiagnosticOrderTestsResult,
  newApDiagnosticOrderTestsSamples,
  newApDiagnosticTestLaboratory,
  newApEncounter,
  newApPatient
} from '@/types/model-types-constructor';
const { Column, HeaderCell, Cell } = Table;
import {
  useGetDiagnosticOrderQuery,
  useGetDiagnosticOrderTestQuery,
  useSaveDiagnosticOrderMutation,
  useSaveDiagnosticOrderTestMutation
} from '@/services/encounterService';
import { initialListRequest, ListRequest, ListRequestAllValues, initialListRequestAllValues } from '@/types/types';
import { ApDiagnosticTestLaboratory } from '@/types/model-types';
import PatientSide from '../lab-module/PatienSide';
import ro from 'date-fns/locale/ro';
const Rad = () => {
  const dispatch = useAppDispatch();
  const [selectedCriterion, setSelectedCriterion] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [openorders, setOpenOrders] = useState(false);
  const [openresults, setOpenResults] = useState(false);
  const [openRejectedModal, setOpenRejectedModal] = useState(false);
  const [openRejectedResultModal, setOpenRejectedResultModal] = useState(false);
  const [openReportModal, setOpenReportModal] = useState(false);
  const [currentStep, setCurrentStep] = useState("6055029972709625");
  const [encounter, setEncounter] = useState({ ...newApEncounter });
  const [showFilterInput, setShowFilterInput] = useState(false);
  const [patient, setPatient] = useState({ ...newApPatient });
  const [order, setOrder] = useState({ ...newApDiagnosticOrders })
  const [test, setTest] = useState({ ...newApDiagnosticOrderTests });
  const [note, setNote] = useState({ ...newApDiagnosticOrderTestsNotes });
  const [report, setReport] = useState({ ...newApDiagnosticOrderTestsRadReport })
  const [selectedSampleDate, setSelectedSampleDate] = useState(null);
  const [listOrdersResponse, setListOrdersResponse] = useState<ListRequest>({
    ...initialListRequest,

  });

  const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
  const { data: messagesList, refetch: fecthNotes } = useGetOrderTestNotesByTestIdQuery(test?.key || undefined, { skip: test.key == null });
  const { data: messagesResultList, refetch: fecthResultNotes } = useGetDiagnosticOrderTestReportNotesByReportIdQuery(report?.key || undefined, { skip: report.key == null });

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
        value: "862828331135792",
      }


    ],
  });

  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),//new Date(),
    toDate: new Date()
  });
  const [openNoteModal, setOpenNoteModal] = useState(false);
  const [openNoteResultModal, setOpenNoteResultModal] = useState(false);
  const [openSampleModal, setOpenSampleModal] = useState(false);
  const { data: ordersList, refetch: orderFetch ,isFetching:isOrderFetching} = useGetDiagnosticOrderQuery({ ...listOrdersResponse });

  const filterdOrderList = ordersList?.object.filter((item) => item.hasRadiology === true);
  const { data: testsList, refetch: fetchTest,isFetching:isTestFetching } = useGetDiagnosticOrderTestQuery({ ...listOrdersTestResponse });
  const { data: laboratoryList } = useGetDiagnosticsTestLaboratoryListQuery({
    ...initialListRequest
    , pageSize: 100
  })
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
  const { data: reportList, refetch: resultFetch } = useGetDiagnosticOrderTestRadReportListQuery({ ...listResultResponse });
  const { data: prevResultsList, refetch: prevResultFetch } = useGetDiagnosticOrderTestRadReportListQuery({ ...listPrevResultResponse });
  const isSelected = rowData => {
    if (rowData && order && rowData.key === order.key) {
      return 'selected-row';
    } else return '';
  };
  const isTestSelected = rowData => {
    if (rowData && test && rowData.key === test.key) {
      return 'selected-row';
    } else return '';
  };
  const isReporttSelected = rowData => {
    if (rowData && report && rowData.key === report.key) {
      return 'selected-row';
    } else return '';
  };

  const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [savenotes] = useSaveDiagnosticOrderTestNotesMutation();

  const [saveTest] = useSaveDiagnosticOrderTestMutation();
  const [saveReport] = useSaveDiagnosticOrderTestRadReportMutation();
  const [saveReportNote] = useSaveDiagnosticOrderTestReportNotesMutation();

  const endOfMessagesRef = useRef(null);
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesList]);
  useEffect(() => {
    handleManualSearch();
  }, []);
  useEffect(() => {
    setPatient(order.patient);
    setEncounter(order.encounter);
    const updatedFilters = [
      {
        fieldName: "order_key",
        operator: "match",
        value: order?.key ?? undefined,
      },
      {
        fieldName: "order_type_lkey",
        operator: "match",
        value: "862828331135792",
      }

    ];
    setListOrdersTestResponse((prevRequest) => ({
      ...prevRequest,
      filters: updatedFilters,
    }));


  }, [order]);
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
    const cat = laboratoryList?.object?.find((item) => item.testKey === test.testKey);

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
      filters: [...updatedFilters],
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

  const handleSendMessage = async (value) => {
    try {
      await savenotes({ ...note, notes: newMessage, testKey: test.key, orderKey: order.key }).unwrap();
      dispatch(notify({ msg: 'Send successfully', sev: 'success' }));
      await setNewMessage("");
    }
    catch (error) {
      dispatch(notify({ msg: 'Send Faild', sev: 'error' }));
    }
    fecthNotes();

  };
  const handleSendResultMessage = async (value) => {
    try {
      await saveReportNote({ ...note, notes: newMessage, testKey: test.key, orderKey: order.key, reportKey: report.key }).unwrap();
      dispatch(notify({ msg: 'Send successfully', sev: 'success' }));
      await setNewMessage("");
    }
    catch (error) {
      dispatch(notify({ msg: 'Send Faild', sev: 'error' }));
    }
    fecthResultNotes();

  };
  const handleDateChange = (date) => {
    if (date) {

      setSelectedSampleDate(date);


    }
  };

  const handleRejectedTest = async () => {
    try {
      const Response = await saveTest({ ...test, processingStatusLkey: "6055192099058457", rejectedAt: Date.now() }).unwrap();
      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
      setOpenRejectedModal(false);
      setTest({ ...newApDiagnosticOrderTests });
      await fetchTest();
      orderFetch();
      setTest({ ...Response });
    }
    catch (error) {
      dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
    }
  }

  const handleAcceptTest = async (rowData) => {
    if (rowData.patientArrivedAt !== null) {
      try {
        const Response = await saveTest({
          ...rowData,
          processingStatusLkey: "6055074111734636",
          acceptedAt: Date.now()
        }).unwrap();
        saveReport({
          ...report,
          orderKey: order.key,
          orderTestKey: test.key,
          medicalTestKey: test.testKey,
          patientKey: patient.key,
          visitKey: encounter.key,
          statusLkey: '6055029972709625'
        }).unwrap();

        setTest({ ...newApDiagnosticOrderTests })
        dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
        setTest({ ...Response });



        await fetchTest();

        await resultFetch();

      } catch (error) {
        dispatch(notify({ msg: 'Saved Failed', sev: 'error' }));
        console.error("Error saving test or report:", error);
      }
    } else {
      dispatch(notify({ msg: 'Wait for the patient to arrive', sev: 'warning' }));
    }
  };

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
  const renderRowExpanded = rowData => {

    return (


      <Table
        data={[rowData]}
        bordered
        cellBordered
        headerHeight={30}
        rowHeight={40}
        style={{ width: '100%', marginTop: '5px', marginBottom: '5px' }}
        height={100}
      >
        <Column flexGrow={1} align="center" fullText>
          <HeaderCell>ACCEPTED AT</HeaderCell>
          <Cell dataKey="acceptedAt" >
            {rowData => rowData.acceptedAt ? new Date(rowData.acceptedAt).toLocaleString() : ""}
          </Cell>
        </Column>
        <Column flexGrow={1} align="center" fullText>
          <HeaderCell>ACCEPTED BY</HeaderCell>
          <Cell dataKey="acceptedBy" />
        </Column>
        <Column flexGrow={1} align="center" fullText>
          <HeaderCell>REJECTED AT</HeaderCell>
          <Cell dataKey="rejectedAt" >
            {rowData => rowData.rejectedAt ? new Date(rowData.rejectedAt).toLocaleString() : ""}
          </Cell>
        </Column>
        <Column flexGrow={1} align="center" fullText>
          <HeaderCell>REJECTED BY</HeaderCell>
          <Cell dataKey="rejectedBy" />
        </Column>
        <Column flexGrow={2} align="center" fullText>
          <HeaderCell>REJECTED REASON</HeaderCell>
          <Cell dataKey="rejectedReason" >
            {rowData => rowData.rejectedReason}
          </Cell>
        </Column>
        <Column flexGrow={1} align="center" fullText>
          <HeaderCell>ATTACHMENT</HeaderCell>
          <Cell />
        </Column>

      </Table>


    );
  };

  const handleExpanded = (rowData) => {
    let open = false;
    const nextExpandedRowKeys = [];

    expandedRowKeys.forEach(key => {
      if (key === rowData.key) {
        open = true;
      } else {
        nextExpandedRowKeys.push(key);
      }
    });

    if (!open) {
      nextExpandedRowKeys.push(rowData.key);
    }



    console.log(nextExpandedRowKeys)
    setExpandedRowKeys(nextExpandedRowKeys);
  };

  const ExpandCell = ({ rowData, dataKey, expandedRowKeys, onChange, ...props }) => (
    <Cell {...props} style={{ padding: 5 }}>
      <IconButton
        appearance="subtle"
        onClick={() => {
          onChange(rowData);
        }}
        icon={
          expandedRowKeys.some(key => key === rowData["key"]) ? (
            <CollaspedOutlineIcon />
          ) : (
            <ExpandOutlineIcon />
          )
        }
      />
    </Cell>
  );



  const stepsData = [
    { key: "6816324725527414", value: "Patient Arrived", time: test.patientArrivedAt ? new Date(test.patientArrivedAt).toLocaleString() : "" },
    { key: "6055074111734636", value: "Accepted", time: test.acceptedAt ? new Date(test.acceptedAt).toLocaleString() : "" },
    { key: "6055192099058457", value: "Rejected", time: test.rejectedAt ? new Date(test.rejectedAt).toLocaleString() : "" },
    { key: "265123250697000", value: "Result Ready", time: test.readyAt ? new Date(test.readyAt).toLocaleString() : "" },
    { key: "265089168359400", value: "Result Approved", time: test.approvedAt ? new Date(test.approvedAt).toLocaleString() : "" },
  ];



  const filteredStepsData = stepsData.filter(step =>
    currentStep == "6055192099058457" ? step.value !== "Accepted" : step.value !== "Rejected"
  );

  return (<div>

    <Row>
      <Col xs={21} >

        <Row>
          <h5 style={{ marginLeft: '5px' }}>Radiology</h5>
        </Row>
        <Row>
          <Col xs={14}>
            <Panel style={{ border: '1px solid #e5e5ea' }}>
              <Table
                height={200}
                width={700}
                sortColumn={listOrdersResponse.sortBy}
                sortType={listOrdersResponse.sortType}
                onSortColumn={(sortBy, sortType) => {
                  if (sortBy)
                    setListOrdersResponse({
                      ...listOrdersResponse,
                      sortBy,
                      sortType
                    });
                }}
                headerHeight={35}
                rowHeight={40}

                data={filterdOrderList ?? []}
                onRowClick={rowData => {
                  setOrder(rowData);
                  setOpenOrders(true);
                  setTest({ ...newApDiagnosticOrderTests });
                  setReport({ ...newApDiagnosticOrderTestsRadReport })
                }}
                rowClassName={isSelected}
                loading={isOrderFetching}
              >
                <Column sortable flexGrow={2} fullText>
                  <HeaderCell>
                    {showFilterInput ? (

                      <Input
                        placeholder="Search ORDER ID"
                        // value={filterValue}
                        onChange={(value) => handleFilterChange('orderId', value)}
                        // onKeyPress={handleKeyPress}
                        onBlur={() => setShowFilterInput(false)}
                        style={{ width: '80%', height: '23px', marginBottom: '3px' }}
                      />
                    ) : (

                      <div onClick={() => setShowFilterInput(true)} style={{ cursor: 'pointer' }}>
                        <FontAwesomeIcon icon={faFilter} style={{ marginRight: '5px' }} />
                        <Translate> ORDER ID</Translate>
                      </div>
                    )}
                  </HeaderCell>
                  <Cell  >
                    {rowData => rowData.orderId}
                  </Cell>
                </Column>
                <Column sortable flexGrow={3} fullText>
                  <HeaderCell>
                    <FontAwesomeIcon icon={faFilter} />
                    <Translate>  DATE,TIME</Translate>
                  </HeaderCell>
                  <Cell >
                    {rowData => rowData.submittedAt ? new Date(rowData.submittedAt).toLocaleString() : ""}
                  </Cell>
                </Column>

                <Column sortable flexGrow={2} fullText>
                  <HeaderCell>
                    <FontAwesomeIcon icon={faFilter} style={{ marginRight: '5px' }} />
                    <Translate>MRN</Translate>
                  </HeaderCell>
                  <Cell>
                    {rowData => rowData.patient?.patientMrn}
                  </Cell>
                </Column>
                <Column sortable flexGrow={2} fullText>
                  <HeaderCell>
                    <FontAwesomeIcon icon={faFilter} style={{ marginRight: '5px' }} />
                    <Translate>PATIENT NAME</Translate>
                  </HeaderCell>
                  <Cell  >
                    {rowData => rowData.patient?.fullName}
                  </Cell>
                </Column>



                <Column sortable flexGrow={2} fullText >
                  <HeaderCell>
                    <FontAwesomeIcon icon={faFilter} style={{ marginRight: '5px' }} />
                    <Translate>SATUTS</Translate>
                  </HeaderCell>
                  <Cell style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {rowData => rowData.radStatusLvalue ? rowData.radStatusLvalue.lovDisplayVale : rowData.radStatusLkey}
                  </Cell>
                </Column>

                <Column sortable flexGrow={2} fullText>
                  <HeaderCell>

                    <Translate>MARKER</Translate>
                  </HeaderCell>
                  <Cell>
                    {rowData => rowData.isUrgent ?
                      <Whisper
                        placement="top"
                        trigger="hover"
                        speaker={<Tooltip>Urgent</Tooltip>}
                      >
                        <FontAwesomeIcon
                          icon={faLandMineOn}
                          style={{ fontSize: '1em', marginRight: 10, color: 'red', cursor: 'pointer' }}
                        />
                      </Whisper> : ""}
                  </Cell>
                </Column>
              </Table>
              <Divider style={{ margin: '4px 4px' }} />
              <Pagination
                prev
                next
                first
                last
                ellipsis
                boundaryLinks
                maxButtons={5}
                size="xs"
                layout={['total', '-', 'limit', '|', 'pager', 'skip']}
                limitOptions={[4, 15, 30]}
                limit={listOrdersResponse.pageSize}
                activePage={listOrdersResponse.pageNumber}

                onChangePage={pageNumber => {
                  setListOrdersResponse({ ...listOrdersResponse, pageNumber });
                }}
                onChangeLimit={pageSize => {
                  setListOrdersResponse({ ...listOrdersResponse, pageSize });
                }}
                total={filterdOrderList?.length || 0}
              />
            </Panel>
          </Col>
          <Col xs={10}>
            <Row>
              <DatePicker

                oneTap
                placeholder="From Date"
                value={dateFilter.fromDate}
                onChange={e => setDateFilter({ ...dateFilter, fromDate: e })}
                style={{ width: '230px', marginRight: '5px' }}
              />
              <DatePicker
                oneTap
                placeholder="To Date"
                value={dateFilter.toDate}
                onChange={e => setDateFilter({ ...dateFilter, toDate: e })}
                style={{ width: '230px', marginRight: '5px' }}
              />
             
            </Row>


            {test.key &&
              <Row>
                <Steps current={filteredStepsData.findIndex(step => step.key === currentStep)} style={{ zoom: 0.7 }}>
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

          </Col>
        </Row>
        <Row>
          {openorders &&
            <Panel header="Order's Tests" collapsible defaultExpanded style={{ border: '1px solid #e5e5ea' }}>
              <Table

                height={200}
                sortColumn={listOrdersTestResponse.sortBy}
                sortType={listOrdersTestResponse.sortType}
                onSortColumn={(sortBy, sortType) => {
                  if (sortBy)
                    setListOrdersTestResponse({
                      ...listOrdersTestResponse,
                      sortBy,
                      sortType
                    });
                }}
                headerHeight={35}
                rowHeight={40}
                rowKey="key"
                expandedRowKeys={expandedRowKeys} // Ensure expanded row state is correctly handled
                renderRowExpanded={renderRowExpanded} // This is the function rendering the expanded child table
                shouldUpdateScroll={false}
                data={testsList?.object ?? []}
                onRowClick={rowData => {
                  setOpenResults(true);
                  setTest(rowData);
                  setReport({ ...newApDiagnosticOrderTestsRadReport })
                }}
                rowClassName={isTestSelected}
                loading={isTestFetching}
              >
                <Column width={70} align="center">
                  <HeaderCell>#</HeaderCell>
                  <ExpandCell rowData={rowData => rowData} dataKey="key" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} />
                </Column>

                <Column sortable flexGrow={2} fullText>
                  <HeaderCell>
                    <Translate>TEST CATEGORY</Translate>
                  </HeaderCell>
                  <Cell >
                    {rowData => {
                      const cat = laboratoryList?.object?.find((item) => item.testKey === rowData.testKey)
                      if (cat) {
                        return cat.categoryLvalue.lovDisplayVale
                      }
                      return "";
                    }}
                  </Cell>
                </Column>
                <Column sortable flexGrow={2} fullText>
                  <HeaderCell>
                    <Translate>TEST NAME</Translate>
                  </HeaderCell>
                  <Cell  >
                    {rowData => rowData.test.testName}
                  </Cell>
                </Column>

                <Column sortable flexGrow={1} fullText>
                  <HeaderCell>

                    <Translate>REASON</Translate>
                  </HeaderCell>
                  <Cell >
                    {rowData => rowData.reasonLvalue ? rowData.reasonLvalue.lovDisplayVale : rowData.reasonLkey}
                  </Cell>
                </Column>
                <Column sortable flexGrow={2} fullText>
                  <HeaderCell>

                    <Translate>PROIRITY</Translate>
                  </HeaderCell>
                  <Cell >
                    {rowData => rowData.priorityLvalue ? rowData.priorityLvalue.lovDisplayVale : rowData.priorityLkey}
                  </Cell>
                </Column>

                <Column sortable flexGrow={2} fullText>
                  <HeaderCell>

                    <Translate>DURATION</Translate>
                  </HeaderCell>
                  <Cell >
                    {rowData => {
                      const cat = laboratoryList?.object?.find((item) => item.testKey === rowData.testKey)
                      if (cat) {
                        return cat?.testDurationTime + " " + cat?.timeUnitLvalue?.lovDisplayVale
                      }
                      return "";

                    }}
                  </Cell>
                </Column>

                <Column sortable flexGrow={2} fullText>
                  <HeaderCell>

                    <Translate>PHYSICIAN</Translate>
                  </HeaderCell>
                  <Cell>
                    {rowData => { return rowData.createdBy, " At", rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : "" }}

                  </Cell>

                </Column>




                <Column sortable flexGrow={2} fullText>
                  <HeaderCell>

                    <Translate>ORDERS NOTES</Translate>
                  </HeaderCell>
                  <Cell>
                    {rowData => rowData.notes}

                  </Cell>

                </Column>

                <Column sortable flexGrow={2} fullText>
                  <HeaderCell>

                    <Translate>Technician Notes</Translate>
                  </HeaderCell>
                  <Cell >
                    {rowData => (
                      <HStack spacing={10}>

                        <FontAwesomeIcon icon={faComment} style={{ fontSize: '1em' }} onClick={() => setOpenNoteModal(true)} />

                      </HStack>

                    )}
                  </Cell>

                </Column>
                <Column sortable flexGrow={2} fullText>
                  <HeaderCell>

                    <Translate>PATIENT ARRIVED</Translate>
                  </HeaderCell>
                  <Cell >
                    {rowData => (
                      <HStack spacing={10}>

                        <FontAwesomeIcon icon={faHospitalUser} style={{ fontSize: '1em' }} onClick={() => setOpenSampleModal(true)} />

                      </HStack>

                    )}
                  </Cell>

                </Column>
                <Column sortable flexGrow={2} fullText >
                  <HeaderCell>
                    <Translate>SATUTS</Translate>
                  </HeaderCell>
                  <Cell style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {rowData => rowData.processingStatusLvalue ? rowData.processingStatusLvalue.lovDisplayVale : rowData.processingStatusLkey}
                  </Cell>
                </Column>
                <Column sortable flexGrow={4} fullText>
                  <HeaderCell>

                    <Translate>ACTION</Translate>
                  </HeaderCell>
                  <Cell >
                    {rowData => (
                      <HStack spacing={10}>
                        <Whisper
                          placement="top"
                          trigger="hover"
                          speaker={<Tooltip>Accepted</Tooltip>}
                        >
                          <CheckRoundIcon
                            onClick={() => (rowData.processingStatusLkey === "6055029972709625" || rowData.processingStatusLkey == "6816324725527414") && handleAcceptTest(rowData)}
                            style={{
                              fontSize: '1em',
                              marginRight: 10,
                              color: (rowData.processingStatusLkey !== "6055029972709625" && rowData.processingStatusLkey !== "6816324725527414") ? 'gray' : 'inherit',
                              cursor: (rowData.processingStatusLkey !== "6055029972709625" && rowData.processingStatusLkey !== "6816324725527414") ? 'not-allowed' : 'pointer',
                            }}
                          />
                        </Whisper>
                        <Whisper
                          placement="top"
                          trigger="hover"
                          speaker={<Tooltip>Rejected</Tooltip>}
                        >
                          <WarningRoundIcon
                            onClick={() => (rowData.processingStatusLkey === "6055029972709625" || rowData.processingStatusLkey === "6816324725527414") && setOpenRejectedModal(true)}
                            style={{
                              fontSize: '1em', marginRight: 10,
                              color: (rowData.processingStatusLkey !== "6055029972709625" && rowData.processingStatusLkey !== "6816324725527414") ? 'gray' : 'inherit',
                              cursor: (rowData.processingStatusLkey !== "6055029972709625" && rowData.processingStatusLkey !== "6816324725527414") ? 'not-allowed' : 'pointer',
                            }} />
                        </Whisper>
                        <Whisper
                          placement="top"
                          trigger="hover"
                          speaker={<Tooltip>Send to External Lab</Tooltip>}
                        >
                          <FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize: '1em', marginRight: 10 }} />
                        </Whisper>
                      </HStack>

                    )}
                  </Cell>

                </Column>
              </Table>
              <Divider style={{ margin: '4px 4px' }} />
              <Pagination
                prev
                next
                first
                last
                ellipsis
                boundaryLinks
                maxButtons={5}
                size="xs"
                layout={['total', '-', 'limit', '|', 'pager', 'skip']}
                limitOptions={[5, 15, 30]}
                 limit={listOrdersTestResponse.pageSize}
                 activePage={listOrdersTestResponse.pageNumber}

                 onChangePage={pageNumber => {
                   setListOrdersTestResponse({ ...listOrdersTestResponse, pageNumber });
                 }}
                 onChangeLimit={pageSize => {
                  setListOrdersTestResponse({ ...listOrdersTestResponse, pageSize });
                 }}
                total={testsList?.extraNumeric|| 0}
              />
            </Panel>}
        </Row>
        <Row>
          {openresults && <Panel header="Test's Results Processing" collapsible defaultExpanded style={{ border: '1px solid #e5e5ea' }}>
            <Table

              height={200}

              //   sortColumn={listRequest.sortBy}
              //   sortType={listRequest.sortType}
              //   onSortColumn={(sortBy, sortType) => {
              //     if (sortBy)
              //       setListRequest({
              //         ...listRequest,
              //         sortBy,
              //         sortType
              //       });
              //   }}
              headerHeight={35}
              rowHeight={40}

              data={reportList?.object ?? []}
              onRowClick={rowData => {
                setReport(rowData);
              }}
              rowClassName={isReporttSelected}
            >
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>
                  <Translate>TEST NAME</Translate>
                </HeaderCell>
                <Cell>
                  {test?.test?.testName}
                </Cell>
              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>
                  <Translate>Report</Translate>
                </HeaderCell>
                <Cell>
                  {rowData => (
                    <HStack spacing={10}>

                      <FontAwesomeIcon icon={faFileLines} style={{ fontSize: '1em' }} onClick={() => setOpenReportModal(true)} />

                    </HStack>
                  )}
                </Cell>
              </Column>



              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>COMMENTS</Translate>
                </HeaderCell>
                <Cell >
                  {rowData => (
                    <HStack spacing={10}>

                      <FontAwesomeIcon icon={faComment} style={{ fontSize: '1em' }} onClick={() => setOpenNoteResultModal(true)} />

                    </HStack>

                  )}
                </Cell>
              </Column>


              <Column sortable flexGrow={3} fullText>
                <HeaderCell>

                  <Translate>PREVIOUS RESULT</Translate>
                </HeaderCell>
                <Cell>
                  {prevResultsList?.object[1]?.normalRangeKey === "6209578532136054" && (
                    prevResultsList?.object[1]?.reasonLvalue ? prevResultsList?.object[1]?.reasonLvalue.lovDisplayVale : prevResultsList?.object[1].reasonLkey
                  )}

                  {prevResultsList?.object[1]?.normalRangeKey === "6209569237704618" && (
                    prevResultsList?.object[1]?.resultValueNumber
                  )}

                  {!["6209578532136054", "6209569237704618"].includes(prevResultsList?.object[0]?.normalRangeKey) &&
                    (
                      <></>
                    )}
                </Cell>
              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>PREVIOUS REPORT DATE</Translate>
                </HeaderCell>
                <Cell>
                  {prevResultsList?.object[0] ? new Date(prevResultsList?.object[0]?.createdAt).toLocaleString() : ""}
                </Cell>

              </Column>



              <Column sortable flexGrow={1} fullText>
                <HeaderCell>

                  <Translate>EXTERNEL STATUS</Translate>
                </HeaderCell>
                <Cell >
                  K
                </Cell>

              </Column>
              <Column sortable flexGrow={2} fullText >
                <HeaderCell>
                  <Translate> REPORT SATUTS</Translate>
                </HeaderCell>
                <Cell style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {rowData => rowData.statusLvalue ? rowData.statusLvalue.lovDisplayVale : rowData.statusLkey}
                </Cell>
              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>EXTERNEL LAB NAME</Translate>
                </HeaderCell>
                <Cell>
                  ll

                </Cell>

              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>ATTACHMENT</Translate>
                </HeaderCell>
                <Cell>
                  ll

                </Cell>

              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>ATTACHED BY/DATE</Translate>
                </HeaderCell>
                <Cell>
                  ll

                </Cell>

              </Column>
              <Column sortable flexGrow={4} fullText>
                <HeaderCell>

                  <Translate>ACTION</Translate>
                </HeaderCell>
                <Cell >
                  {rowData => (
                    <HStack spacing={10}>
                      <CheckRoundIcon style={{ fontSize: '1em', marginRight: 10 }}
                        onClick={async () => {
                          try {
                            saveReport({ ...rowData, statusLkey: '265089168359400', approvedAt: Date.now() }).unwrap();
                            const Response = await saveTest({ ...test, processingStatusLkey: '265089168359400', approvedAt: Date.now() }).unwrap();

                            setTest({ ...newApDiagnosticOrderTests })
                            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                            setTest({ ...Response })
                            await fetchTest();


                            await resultFetch();
                          }
                          catch (error) {
                            dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
                          }
                        }} />
                      <WarningRoundIcon style={{ fontSize: '1em', marginRight: 10 }} onClick={() => setOpenRejectedResultModal(true)} />



                      <FontAwesomeIcon icon={faPrint} style={{ fontSize: '1em', marginRight: 10 }} />
                      <FontAwesomeIcon icon={faStar} style={{ fontSize: '1em', marginRight: 10, color: rowData.reviewAt ? '#e0a500' : "#343434" }} onClick={async () => {
                        try {
                          await saveReport({ ...report, reviewAt: Date.now() }).unwrap();
                          dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                          resultFetch();
                        }
                        catch (error) {
                          dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
                        }
                      }} />
                    </HStack>

                  )}
                </Cell>

              </Column>
            </Table>
            <Divider style={{ margin: '4px 4px' }} />
            <Pagination
              prev
              next
              first
              last
              ellipsis
              boundaryLinks
              maxButtons={5}
              size="xs"
              layout={['total', '-', 'limit', '|', 'pager', 'skip']}
              limitOptions={[5, 15, 30]}
              //  limit={listRequest.pageSize}
              //  activePage={listRequest.pageNumber}

              //  onChangePage={pageNumber => {
              //    setListRequest({ ...listRequest, pageNumber });
              //  }}
              //  onChangeLimit={pageSize => {
              //    setListRequest({ ...listRequest, pageSize });
              //  }}
              total={40}
            />
          </Panel>
          }
        </Row>

      </Col>

      <Col style={{ border: '1px solid #e5e5ea', height: '87vh' }} xs={3}>
        <PatientSide patient={patient} encounter={encounter} />
      </Col>
    </Row>

    <Modal open={openNoteModal} onClose={() => setOpenNoteModal(false)} size="xs">
      <Modal.Header>
        <Modal.Title>💬Technician Notes</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "300px", overflowY: "auto", padding: "10px" }}>
        {messagesList?.object.length > 0 ? (
          messagesList?.object.map((msg, index) => (
            <div key={index} style={{ textAlign: "right", marginBottom: "8px" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  backgroundColor: "#007bff",
                  color: "white",
                  maxWidth: "70%",
                }}
              >
                {msg.notes}
              </span>
              <div style={{ fontSize: "10px", color: "gray", marginTop: "4px" }}>
                {new Date(msg.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "gray" }}>Not found Notes Yet</p>
        )}

        <div ref={endOfMessagesRef}></div>
      </Modal.Body>
      <Modal.Footer>
        <div style={{ display: 'flex' }}>
          <Input
            value={newMessage}
            onChange={setNewMessage}
            placeholder="write note.."
            style={{ width: "80%", marginRight: "10px" }}
            onPressEnter={(value) => handleSendMessage(value)}
          />
          <Button appearance="primary" onClick={(value) => handleSendMessage(value)}>
            <FontAwesomeIcon icon={faPaperPlane} />
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
    <Modal open={openNoteResultModal} onClose={() => setOpenNoteResultModal(false)} size="xs">
      <Modal.Header>
        <Modal.Title>💬Technician Notes</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "300px", overflowY: "auto", padding: "10px" }}>
        {messagesResultList?.object.length > 0 ? (
          messagesResultList?.object.map((msg, index) => (
            <div key={index} style={{ textAlign: "right", marginBottom: "8px" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  backgroundColor: "#007bff",
                  color: "white",
                  maxWidth: "70%",
                }}
              >
                {msg.notes}
              </span>
              <div style={{ fontSize: "10px", color: "gray", marginTop: "4px" }}>
                {new Date(msg.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "gray" }}>Not found Notes Yet</p>
        )}

        <div ref={endOfMessagesRef}></div>
      </Modal.Body>
      <Modal.Footer>
        <div style={{ display: 'flex' }}>
          <Input
            value={newMessage}
            onChange={setNewMessage}
            placeholder="write note.."
            style={{ width: "80%", marginRight: "10px" }}
            onPressEnter={(value) => handleSendResultMessage(value)}
          />
          <Button appearance="primary" onClick={(value) => handleSendResultMessage(value)}>
            <FontAwesomeIcon icon={faPaperPlane} />
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
    <Modal open={openSampleModal} onClose={() => setOpenSampleModal(false)} size="xs">
      <Modal.Header>
        <Modal.Title>Patient Arrived</Modal.Title>
      </Modal.Header>
      <Modal.Body>

        <Col xs={24}>

          <Row >
            <Form >
              <MyInput
                fieldLabel='Patient Arrival Note'
                fieldName={"patientArrivedNoteRad"}
                fieldType='textarea'
                record={test}
                setRecord={setTest}
              />
            </Form></Row>
          <Row>
            <Text style={{ fontWeight: 'bold' }}>Patient Arrived </Text>
            <DatePicker
              style={{ zoom: 0.85, width: '270' }}
              format="dd MMM yyyy hh:mm:ss aa"
              showMeridiem
              caretAs={FaCalendar}
              value={selectedSampleDate}
              onChange={handleDateChange}
            /></Row>

        </Col>

      </Modal.Body>
      <Modal.Footer style={{ display: "flex", justifyContent: 'flex-end' }}>
        <Button
          appearance="primary"
          color="cyan"
          onClick={async () => {
            const Response = await saveTest({ ...test, patientArrivedAt: selectedSampleDate ? selectedSampleDate.getTime() : null, processingStatusLkey: "6816324725527414" }).unwrap()
            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
            setSelectedSampleDate(null);
            setOpenSampleModal(false);
            setTest({ ...newApDiagnosticOrderTests });
            await fetchTest();
            orderFetch();
            setTest({ ...Response });

          }}
        >
          Save
        </Button>
        <Button
          appearance="ghost"
          color="cyan"
          onClick={() => setOpenSampleModal(false)}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
    <Modal open={openRejectedModal} onClose={() => setOpenRejectedModal(false)} size="xs">
      <Modal.Header>
        <Modal.Title>Why do you want to reject the Test? </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form style={{ zoom: 0.85 }}>
          <MyInput
            disabled={false}
            fieldType={"textarea"}
            fieldName={"rejectedReason"}
            record={test}
            setRecord={setTest}

          /></Form>

      </Modal.Body>
      <Modal.Footer style={{ display: "flex", justifyContent: 'flex-end' }}>
        <Button
          appearance="primary"
          color="cyan"
          onClick={handleRejectedTest}
        >
          Save
        </Button>
        <Button
          appearance="ghost"
          color="cyan"
          onClick={() => setOpenRejectedModal(false)}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
    <Modal open={openRejectedResultModal} onClose={() => setOpenRejectedResultModal(false)} size="xs">
      <Modal.Header>
        <Modal.Title>Why do you want to reject the Test? </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form style={{ zoom: 0.85 }}>
          <MyInput
            disabled={false}
            fieldType={"textarea"}
            fieldName={"rejectedReason"}
            record={report}
            setRecord={setReport}

          /></Form>

      </Modal.Body>
      <Modal.Footer style={{ display: "flex", justifyContent: 'flex-end' }}>
        <Button
          appearance="primary"
          color="cyan"
          onClick={async () => {
            {
              try {
                await saveReport({ ...report, statusLkey: '6488555526802885', rejectedAt: Date.now() }).unwrap();
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
    <Modal open={openReportModal} onClose={() =>

      setOpenReportModal(false)} size="md">
      <Modal.Header>
        <Modal.Title></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ border: '1px solid #ccc', borderRadius: 5, padding: 10, width: 500 }}>
          <ButtonGroup>
            <IconButton icon={<FaBold />} />
            <IconButton icon={<FaItalic />} />
            <IconButton icon={<List />} />
            <IconButton icon={<FaLink />} />
            <IconButton icon={<Image />} />
            <Form style={{ zoom: 0.85 }}>
              <MyInput

                fieldName={"severityLkey"}
                fieldType='select'
                selectData={severityLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={report}
                setRecord={setReport}

              /></Form>
          </ButtonGroup>
          <Form>
            <MyInput

              width={450}
              hight={200}
              fieldLabel={""}
              fieldName={'reportValue'}
              fieldType='textarea'
              record={report}
              setRecord={setReport} />

          </Form>
          {/* <Input as="textarea" rows={5} placeholder="Write Report.." /> */}
        </div>

      </Modal.Body>
      <Modal.Footer style={{ display: "flex", justifyContent: 'flex-end' }}>
        <Button
          appearance="primary"
          color="cyan"
          onClick={async () => {


            saveReport({ ...report, statusLkey: '265123250697000' }).unwrap();

            const Response = await saveTest({ ...test, processingStatusLkey: '265123250697000' }).unwrap();

            setTest({ ...newApDiagnosticOrderTests });
            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
            setTest({ ...Response });
            await fetchTest();
            await resultFetch();

            setOpenReportModal(false);


          }
          }
        >
          Save
        </Button>
        <Button
          appearance="ghost"
          color="cyan"
          onClick={() => setOpenReportModal(false)}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  </div>);
}
export default Rad;
