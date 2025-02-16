import { useState, useEffect, useRef } from 'react';

import Translate from '@/components/Translate';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import ConversionIcon from '@rsuite/icons/Conversion';
import SortUpIcon from '@rsuite/icons/SortUp';
import { HStack } from 'rsuite';
import { Avatar } from 'rsuite';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import { Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import CheckOutlineIcon from '@rsuite/icons/CheckOutline';
import ReloadIcon from '@rsuite/icons/Reload';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {

  useGetDiagnosticsTestLaboratoryListQuery,

} from '@/services/setupService';
import {
  faHandDots,
  faTriangleExclamation
  , faClipboardList,
  faComment
  ,
  faPrint
  ,
  faComments,
  faVialCircleCheck,
  faDiagramPredecessor,
  faFilter,
  faStar,
  faLandMineOn,
  faIdCard,
  faUserNinja,
  faPaperPlane,
  faCalendar,
  faRightFromBracket


} from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import './styles.less';
import { Badge } from 'rsuite';

import { FaWeight, FaRulerVertical, FaUserCircle, FaDumbbell, FaUserAlt, FaTint, FaMars, FaVenus,  FaCalendar } from 'react-icons/fa';
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
  useGetFacilitiesQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { useGetEncountersQuery } from '@/services/encounterService';
import { useGetObservationSummariesQuery } from '@/services/observationService';
import { addFilterToListRequest, formatDate, fromCamelCaseToDBName, getNumericTimestamp } from '@/utils';

import ArrowDownIcon from '@rsuite/icons/ArrowDown';
import MyInput from '@/components/MyInput';
import SearchIcon from '@rsuite/icons/Search';
import {
  Panel, FlexboxGrid, Col, List, Stack, Button, Timeline
  , Steps
} from 'rsuite';
import { newApDiagnosticOrders, newApDiagnosticOrderTests, newApDiagnosticOrderTestsNotes, newApDiagnosticOrderTestsSamples, newApDiagnosticTestLaboratory, newApEncounter, newApPatient } from '@/types/model-types-constructor';
const { Column, HeaderCell, Cell } = Table;
import {
  useGetDiagnosticOrderQuery,
  useGetDiagnosticOrderTestQuery,
  useSaveDiagnosticOrderMutation,
  useSaveDiagnosticOrderTestMutation,
  useGetOrderTestNotesByTestIdQuery,
  useSaveDiagnosticOrderTestNotesMutation,
  useGetOrderTestSamplesByTestIdQuery,
  useSaveDiagnosticOrderTestSamplesMutation
} from '@/services/encounterService';
import { initialListRequest, ListRequest } from '@/types/types';
import { ApDiagnosticTestLaboratory } from '@/types/model-types';
import PatientSide from './patienSide';
const Lab = () => {
  const dispatch = useAppDispatch();
  const [selectedCriterion, setSelectedCriterion] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [openorders, setOpenOrders] = useState(false);
  const [openresults, setOpenResults] = useState(false);
  const [openRejectedModal, setOpenRejectedModal] = useState(false);
  const [currentStep, setCurrentStep] = useState("6055029972709625");
  const [encounter, setEncounter] = useState({ ...newApEncounter });
  const [showFilterInput, setShowFilterInput] = useState(false);
  const [patient, setPatient] = useState({ ...newApPatient });
  const [order, setOrder] = useState({ ...newApDiagnosticOrders })
  const [test, setTest] = useState({ ...newApDiagnosticOrderTests });
  const [note, setNote] = useState({ ...newApDiagnosticOrderTestsNotes });
  const [sample, setSample] = useState({ ...newApDiagnosticOrderTestsSamples });
  const [selectedSampleDate, setSelectedSampleDate] = useState(null);
  const [listOrdersResponse, setListOrdersResponse] = useState<ListRequest>({
    ...initialListRequest,

  });

  const { data: ValueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: SampleContainerLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_SAMPLE_CONTAINER');
  const { data: LabTubeTypeLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_TUBE_TYPES');
  const { data: TubeColorLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_TUBE_COLORS');
  const { data: messagesList, refetch: fecthNotes } = useGetOrderTestNotesByTestIdQuery(test?.key || undefined, { skip: test.key == null });
  const { data: samplesList, refetch: fecthSample } = useGetOrderTestSamplesByTestIdQuery(test?.key || undefined, { skip: test.key == null });
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
  const [openNoteModal, setOpenNoteModal] = useState(false);
  const [openSampleModal, setOpenSampleModal] = useState(false);
  const { data: ordersList,refetch:orderFetch } = useGetDiagnosticOrderQuery({ ...listOrdersResponse });
  const { data: testsList, refetch: fetchTest } = useGetDiagnosticOrderTestQuery({ ...listOrdersTestResponse });
  const { data: laboratoryList } = useGetDiagnosticsTestLaboratoryListQuery({
    ...initialListRequest
    , pageSize: 100
  })
  const [labDetails, setLabDetails] = useState<ApDiagnosticTestLaboratory>({ ...newApDiagnosticTestLaboratory })
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
 
  const { data: patirntObservationlist } = useGetObservationSummariesQuery({
    ...initialListRequest,
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: "patient_key",
        operator: "match",
        value: patient?.key ?? undefined,
      }

    ],

  });

  const [bodyMeasurements, setBodyMeasurements] = useState({
    height: null,
    weight: null,
    headcircumference: null
  });
  const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [savenotes] = useSaveDiagnosticOrderTestNotesMutation();
  const [saveSample] = useSaveDiagnosticOrderTestSamplesMutation();
  const [saveTest] = useSaveDiagnosticOrderTestMutation();
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: "key",
        operator: "match",
        value: order?.visitKey || undefined
      }
    ]

  });

  useEffect(() => {
    setBodyMeasurements({
      height: patirntObservationlist?.object?.find((item) => item.latestheight != null)?.latestheight,
      weight: patirntObservationlist?.object?.find((item) => item.latestweight != null)?.latestweight,
      headcircumference: patirntObservationlist?.object?.find((item) => item.latestheadcircumference != null)?.latestheadcircumference
    })
  }, [patirntObservationlist])
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
        value: "862810597620632",
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
    setLabDetails(cat);
    setCurrentStep(test.processingStatusLkey)
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
  const handleDateChange = (date) => {
    if (date) {

      setSelectedSampleDate(date);


    }
  };
  const handleSaveSample = async () => {
    try {
      await saveSample({
        ...sample,
        orderKey: order.key,
        testKey: test.key,
        sampleCollectedAt: selectedSampleDate ? selectedSampleDate.getTime() : null
      }).unwrap();
      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
      await saveTest({ ...test, processingStatusLkey: "6055207372976955" }).unwrap();
      fecthSample();
      fetchTest();
      orderFetch();
      setOpenSampleModal(false);
      setSample({ ...newApDiagnosticOrderTestsSamples });
      setSelectedSampleDate(null);
    }
    catch (error) {
      dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
    }
  }
  const handleRejectedTest = async () => {
    try {
      const Response = await saveTest({ ...test, processingStatusLkey: "6055192099058457", rejectedAt:Date.now() }).unwrap();
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
  const handleAcceptTest = async () => {
    try {

      const Response = await saveTest({ ...test, processingStatusLkey: "6055074111734636", acceptedAt:Date.now() }).unwrap();
      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
      setTest({ ...newApDiagnosticOrderTests });
      await fetchTest();
      orderFetch();
      setTest({ ...Response });
    }
    catch (error) {
      dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
    }
  }
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
    console.log(rowData);
    return (


        <Table
            data={[rowData]} 
            bordered
            cellBordered
            headerHeight={30}
            rowHeight={40}
            style={{ width: '100%', marginTop: '5px',marginBottom:'5px' }}
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
                    {rowData => rowData.rejectedAt? new Date(rowData.rejectedAt).toLocaleString() : ""}
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
                <Cell  />
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
    { key: "6055207372976955", value: "Sample Collected", time: "10:30 AM" },
    { key: "6055074111734636", value: "Accepted", time: "5:00 PM" },
    { key: "6055192099058457", value: "Rejected", time: "8:00 PM" },
    { key: "265123250697000", value: "Result Ready", time: "10:30 AM" },
    { key: "265089168359400", value: "Result Approved", time: "5:00 PM" },
  ];



  const filteredStepsData = stepsData.filter(step =>
    currentStep == "6055192099058457" ? step.value !== "Accepted" : step.value !== "Rejected"
  );
  return (<div>

    <Row>
      <Col xs={20} >

        <Row>
          <h5 style={{ marginLeft: '5px' }}> Clinical Laboratory</h5>
        </Row>
        <Row>
          <Col xs={14}>
            <Panel style={{ border: '1px solid #e5e5ea', borderRadius: '25px', zoom: 0.93 }}>
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

                data={ordersList?.object ?? []}
                onRowClick={rowData => {
                  setOrder(rowData);
                  setOpenOrders(true);
                }}
                rowClassName={isSelected}
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
                    {rowData => rowData.orderId}
                  </Cell>
                </Column>



                <Column sortable flexGrow={2} fullText >
                  <HeaderCell>
                    <FontAwesomeIcon icon={faFilter} style={{ marginRight: '5px' }} />
                    <Translate>SATUTS</Translate>
                  </HeaderCell>
                  <Cell style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {rowData =>rowData.labStatusLvalue?rowData.labStatusLvalue.lovDisplayVale:rowData.labStatusLkey}
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
                total={ordersList?.object?.length || 0}
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
              <IconButton appearance="primary"
                style={{ backgroundColor: "#00b1cc", borderColor: "#00b1cc", color: "white" }}
                onClick={() => handleManualSearch}
                icon={<SearchIcon />} >

              </IconButton>
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
            {test.key && <Row>Number of Samples Collected:{samplesList?.object?.length}</Row>}
          </Col>
        </Row>
        <Row>
          {openorders &&
           <Panel header="Order's Tests" collapsible defaultExpanded style={{ border: '1px solid #e5e5ea', borderRadius: '25px', zoom: 0.93 }}>
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
                setTest(rowData)
              }}
              rowClassName={isTestSelected}
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

              <Column sortable flexGrow={2} fullText>
                <HeaderCell>
                  <Translate>IS PROFILE</Translate>
                </HeaderCell>
                <Cell>
                  {rowData => {
                    const cat = laboratoryList?.object?.find((item) => item.testKey === rowData.testKey)?.isProfile
                    return cat?.isProfile ? "Yes" : "NO"
                  }}
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

                  <Translate>COLLECT SAMPLE</Translate>
                </HeaderCell>
                <Cell >
                  {rowData => (
                    <HStack spacing={10}>

                      <FontAwesomeIcon icon={faVialCircleCheck} style={{ fontSize: '1em' }} onClick={() => setOpenSampleModal(true)} />

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
                        onClick={() => (rowData.processingStatusLkey === "6055029972709625" || rowData.processingStatusLkey === "6055207372976955") && handleAcceptTest()}
                        style={{
                          fontSize: '1em',
                          marginRight: 10,
                          color: (rowData.processingStatusLkey !== "6055029972709625" && rowData.processingStatusLkey !== "6055207372976955") ? 'gray' : 'inherit',
                          cursor: (rowData.processingStatusLkey !== "6055029972709625" && rowData.processingStatusLkey !== "6055207372976955") ? 'not-allowed' : 'pointer',
                        }}
                      />
                      </Whisper>
                      <Whisper
                        placement="top"
                        trigger="hover"
                        speaker={<Tooltip>Rejected</Tooltip>}
                      >
                      <WarningRoundIcon
                        onClick={() => (rowData.processingStatusLkey === "6055029972709625" || rowData.processingStatusLkey === "6055207372976955") && setOpenRejectedModal(true)}
                        style={{
                          fontSize: '1em', marginRight: 10,
                          color: (rowData.processingStatusLkey !== "6055029972709625" && rowData.processingStatusLkey !== "6055207372976955") ? 'gray' : 'inherit',
                          cursor: (rowData.processingStatusLkey !== "6055029972709625" && rowData.processingStatusLkey !== "6055207372976955") ? 'not-allowed' : 'pointer',
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
              //  limit={listRequest.pageSize}
              //  activePage={listRequest.pageNumber}

              //  onChangePage={pageNumber => {
              //    setListRequest({ ...listRequest, pageNumber });
              //  }}
              //  onChangeLimit={pageSize => {
              //    setListRequest({ ...listRequest, pageSize });
              //  }}
              total={testsList?.object?.length || 0}
            />
          </Panel>}
        </Row>
        <Row>
          {openresults && <Panel header="Test's Results Processing" collapsible defaultExpanded style={{ border: '1px solid #e5e5ea', borderRadius: '25px', zoom: 0.93 }}>
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

              data={[{ name: "hanan", hasObservation: true, patientAge: "34" }
                ,
              { name: "hanan", hasObservation: true, patientAge: "34" }
                ,
              { name: "hanan", hasObservation: true, patientAge: "34" }
              ]}
            //   onRowClick={rowData => {
            //     setLocalEncounter(rowData);
            //     setLocalPatient(rowData.patientObject)
            //   }}
            //   rowClassName={isSelected}
            >
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>
                  <Translate>TEST RESULT,UNIT</Translate>
                </HeaderCell>
                <Cell dataKey="queueNumber" />
              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>
                  <Translate>NORMAL RANGE</Translate>
                </HeaderCell>
                <Cell dataKey="visitId" />
              </Column>

              <Column sortable flexGrow={2} fullText>
                <HeaderCell>
                  <Translate>MARKER</Translate>
                </HeaderCell>
                <Cell>
                  YES
                </Cell>
              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>COMMENTS</Translate>
                </HeaderCell>
                <Cell >
                  {rowData => (
                    <HStack spacing={10}>

                      <FontAwesomeIcon icon={faComments} style={{ fontSize: '1em' }} />

                    </HStack>

                  )}
                </Cell>
              </Column>


              <Column sortable flexGrow={3} fullText>
                <HeaderCell>

                  <Translate>PREVIOUS RESULT</Translate>
                </HeaderCell>
                <Cell>
                  l</Cell>
              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>PREVIOUS RESULT DATE</Translate>
                </HeaderCell>
                <Cell>
                  ll

                </Cell>

              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>COMPARE WITH ALL PREVIOUS</Translate>
                </HeaderCell>
                <Cell >
                  {rowData => (
                    <HStack spacing={10}>

                      <FontAwesomeIcon icon={faDiagramPredecessor} style={{ fontSize: '1em' }} />

                    </HStack>

                  )}
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
                  <Translate> RESULT SATUTS</Translate>
                </HeaderCell>
                <Cell style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {rowData => (rowData.hasObservation ? <Badge content="YES" style={{
                    backgroundColor: '#bcf4f7',
                    color: '#008aa6',
                    padding: '5px 19px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: "bold"
                  }} /> : <Badge
                    style={{
                      backgroundColor: 'rgba(238, 130, 238, 0.2)',
                      color: '#4B0082',
                      padding: '5px 19px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: "bold"
                    }}
                    content="NO"
                  />)}
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
                      <WarningRoundIcon style={{ fontSize: '1em', marginRight: 10 }} />
                      <CheckRoundIcon style={{ fontSize: '1em', marginRight: 10 }} />
                      <ConversionIcon style={{ fontSize: '1em', marginRight: 10 }} />

                      <FontAwesomeIcon icon={faPrint} style={{ fontSize: '1em', marginRight: 10 }} />
                      <FontAwesomeIcon icon={faStar} style={{ fontSize: '1em', marginRight: 10 }} />
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

      <Col style={{ border: '1px solid #e5e5ea', height: '87vh' }} xs={4}>
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
    <Modal open={openSampleModal} onClose={() => setOpenSampleModal(false)} size="md">
      <Modal.Header>
        <Modal.Title>Collect Sample</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col xs={8}>
            <Form style={{ zoom: 0.85 }}>
              <MyInput
                disabled={true}
                fieldName={"systemLkey"}
                record={labDetails}
                setRecord={setLabDetails}

              /></Form>
          </Col>
          <Col xs={8}>
            <Form style={{ zoom: 0.85 }}>
              <MyInput
                disabled={true}
                fieldName={"tubeColorLkey"}
                fieldType='select'
                selectData={TubeColorLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={labDetails}
                setRecord={setLabDetails}

              /></Form>
          </Col>
          <Col xs={8}>
            <Form style={{ zoom: 0.85 }}>
              <MyInput
                disabled={true}
                fieldName={"tubeTypeLkey"}
                fieldType='select'
                selectData={LabTubeTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={labDetails}
                setRecord={setLabDetails}

              /></Form>
          </Col>
        </Row>
        <Row>
          <Col xs={8}>
            <Form style={{ zoom: 0.85 }}>
              <MyInput
                fieldName={"sampleContainerLkey"}
                fieldType='select'
                selectData={SampleContainerLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                disabled={true}
                record={labDetails}
                setRecord={setLabDetails}
              /></Form>
          </Col>
          <Col xs={8}>
            <Form style={{ zoom: 0.85 }}>
              <MyInput
                fieldName={"sampleVolume"}
                fieldType='number'
                disabled={true}
                record={labDetails ?? ""}
                setRecord={setLabDetails}
              />
            </Form>

          </Col>
          <Col xs={8}>
            <Form style={{ zoom: 0.85 }}>
              <MyInput
                fieldName={"sampleVolumeUnitLkey"}
                fieldType='select'
                selectData={ValueUnitLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                disabled={true}
                record={labDetails}
                setRecord={setLabDetails}
              />
            </Form>
          </Col>
        </Row>
        <Row>
          <Col xs={8}>
            <Form style={{ zoom: 0.85 }}>
              <MyInput
                fieldLabel={"Actual Sample Quantity"}
                fieldName={"quantity"}
                fieldType='number'

                record={sample}
                setRecord={setSample}
              />
            </Form>
          </Col>
          <Col xs={8}>
            <Form style={{ zoom: 0.85 }}>
              <MyInput
                fieldName={"unitLkey"}
                fieldType='select'
                selectData={ValueUnitLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={sample}
                setRecord={setSample}
              />
            </Form></Col>
          <Col xs={8}>
            <Text style={{ fontWeight: 'bold' }}>Sample Collected </Text>
            <DatePicker
              style={{ zoom: 0.85, width: '270' }}
              format="dd MMM yyyy hh:mm:ss aa"
              showMeridiem
              caretAs={FaCalendar}
              value={selectedSampleDate}
              onChange={handleDateChange}
            /></Col>

        </Row>
        <Row>
          <Col xs={24}>
            <Panel
              header="Collected Samples"
              collapsible
              style={{ border: '1px solid #e5e5ea', zoom: 0.85 }}
            >
              <Panel style={{ border: '1px solid #e5e5ea', borderRadius: '25px', zoom: 0.93 }}>
                <Table
                  height={200}

                  headerHeight={35}
                  rowHeight={40}

                  data={samplesList?.object ?? []}

                >

                  <Column flexGrow={3} fullText>
                    <HeaderCell>
                      <FontAwesomeIcon icon={faFilter} />
                      <Translate>COLLECTED AT</Translate>
                    </HeaderCell>
                    <Cell >
                      {rowData => rowData.sampleCollectedAt ? new Date(rowData.sampleCollectedAt).toLocaleString() : ""}
                    </Cell>
                  </Column>

                  <Column flexGrow={2} fullText>
                    <HeaderCell>
                      <FontAwesomeIcon icon={faFilter} style={{ marginRight: '5px' }} />
                      <Translate>ACTUAL SAMPLE QUANTITY</Translate>
                    </HeaderCell>
                    <Cell>
                      {rowData => rowData?.quantity ?? ""}
                    </Cell>
                  </Column>
                  <Column flexGrow={1} fullText>
                    <HeaderCell>
                      <FontAwesomeIcon icon={faFilter} style={{ marginRight: '5px' }} />
                      <Translate>UNIT </Translate>
                    </HeaderCell>
                    <Cell  >
                      {rowData => rowData.unitLvalue ? rowData.unitLvalue.lovDisplayVale : rowData.unitLkey}
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
                  total={samplesList?.object?.length || 0}
                />
              </Panel>
            </Panel>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer style={{ display: "flex", justifyContent: 'flex-end' }}>
        <Button
          appearance="primary"
          color="cyan"
          onClick={handleSaveSample}
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
  </div>)
}
export default Lab;