import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useGetOrderTestNotesByTestIdQuery,
  useSaveDiagnosticOrderTestNotesMutation
} from '@/services/labService';
import {
  useGetDiagnosticOrderTestRadReportListQuery,
  useGetDiagnosticOrderTestReportNotesByReportIdQuery,
  useSaveDiagnosticOrderTestRadReportMutation,
  useSaveDiagnosticOrderTestReportNotesMutation
} from '@/services/radService';
import {
  useGetDiagnosticsTestLaboratoryListQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { addFilterToListRequest, fromCamelCaseToDBName, getNumericTimestamp } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import {
  faComment,
  faFileLines,
  faFilter,
  faHospitalUser,
  faLandMineOn,
  faPrint,
  faRightFromBracket,
  faStar
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Image, List } from '@rsuite/icons';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import React, { useEffect, useRef, useState } from 'react';
import { FaBold, FaCalendar, FaItalic, FaLink } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import {
  ButtonGroup,
  DatePicker,
  Divider,
  Form,
  HStack,
  IconButton,
  Input,
  Modal,
  Pagination,
  Row,
  Table,
  Text,
  Tooltip,
  Whisper
} from 'rsuite';
import './styles.less';

import MyInput from '@/components/MyInput';

import ChatModal from '@/components/ChatModal';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useGetDiagnosticOrderQuery,
  useGetDiagnosticOrderTestQuery,
  useSaveDiagnosticOrderTestMutation
} from '@/services/encounterService';
import { RootState } from '@/store';
import {
  newApDiagnosticOrders,
  newApDiagnosticOrderTests,
  newApDiagnosticOrderTestsNotes,
  newApDiagnosticOrderTestsRadReport,
  newApEncounter,
  newApPatient
} from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import ReactDOMServer from 'react-dom/server';
import { Button, Col, Panel, Steps } from 'rsuite';
import PatientSide from '../lab-module/PatienSide';
import CancellationModal from '@/components/CancellationModal';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
const { Column, HeaderCell, Cell } = Table;
const Rad = () => {
  const dispatch = useAppDispatch();
  const [openorders, setOpenOrders] = useState(false);
  const [openresults, setOpenResults] = useState(false);
  const [openRejectedModal, setOpenRejectedModal] = useState(false);
  const [openRejectedResultModal, setOpenRejectedResultModal] = useState(false);
  const [openReportModal, setOpenReportModal] = useState(false);
  const [currentStep, setCurrentStep] = useState('6055029972709625');
  const [encounter, setEncounter] = useState({ ...newApEncounter });
  const [showFilterInput, setShowFilterInput] = useState(false);
  const [patient, setPatient] = useState({ ...newApPatient });
  const [order, setOrder] = useState<any>({ ...newApDiagnosticOrders });
  const [test, setTest] = useState<any>({ ...newApDiagnosticOrderTests });
  const [note, setNote] = useState({ ...newApDiagnosticOrderTestsNotes });
  const [report, setReport] = useState({ ...newApDiagnosticOrderTestsRadReport });
  const [selectedSampleDate, setSelectedSampleDate] = useState(null);
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [manualSearchTriggeredTest, setManualSearchTriggeredTest] = useState(false);
  const [manualSearchTriggeredReport, setManualSearchTriggeredReport] = useState(false);
  const [listOrdersResponse, setListOrdersResponse] = useState<ListRequest>({
    ...initialListRequest
  });

  const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
  const { data: messagesList, refetch: fecthNotes } = useGetOrderTestNotesByTestIdQuery(
    test?.key || undefined,
    { skip: test.key == null }
  );
  const { data: messagesResultList, refetch: fecthResultNotes } =
    useGetDiagnosticOrderTestReportNotesByReportIdQuery(report?.key || undefined, {
      skip: report.key == null
    });

  const [listOrdersTestResponse, setListOrdersTestResponse] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'order_key',
        operator: 'match',
        value: order?.key ?? undefined
      },
      {
        fieldName: 'order_type_lkey',
        operator: 'match',
        value: '862828331135792'
      }
    ]
  });

  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(), //new Date(),
    toDate: new Date()
  });
  const [openNoteModal, setOpenNoteModal] = useState(false);
  const [openNoteResultModal, setOpenNoteResultModal] = useState(false);
  const [openSampleModal, setOpenSampleModal] = useState(false);
  const {
    data: ordersList,
    refetch: orderFetch,
    isFetching: isOrderFetching
  } = useGetDiagnosticOrderQuery({ ...listOrdersResponse });

  const filterdOrderList = ordersList?.object.filter(item => item.hasRadiology === true);
  const {
    data: testsList,
    refetch: fetchTest,
    isFetching: isTestFetching
  } = useGetDiagnosticOrderTestQuery({ ...listOrdersTestResponse });
  const { data: laboratoryList } = useGetDiagnosticsTestLaboratoryListQuery({
    ...initialListRequest,
    pageSize: 100
  });
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
  const [listPrevResultResponse, setListPrevResultResponse] = useState<ListRequest>({
    ...initialListRequest,
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key || undefined
      },
      {
        fieldName: 'medical_test_key',
        operator: 'match',
        value: test?.testKey || undefined
      }
    ]
  });
  const { data: reportList, refetch: resultFetch } = useGetDiagnosticOrderTestRadReportListQuery({
    ...listResultResponse
  });
  const { data: prevResultsList, refetch: prevResultFetch } =
    useGetDiagnosticOrderTestRadReportListQuery({ ...listPrevResultResponse });
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

  const [savenotes] = useSaveDiagnosticOrderTestNotesMutation();

  const [saveTest] = useSaveDiagnosticOrderTestMutation();
  const [saveReport] = useSaveDiagnosticOrderTestRadReportMutation();
  const [saveReportNote] = useSaveDiagnosticOrderTestReportNotesMutation();

  const endOfMessagesRef = useRef(null);
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Radiology</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Rad'));
  dispatch(setDivContent(divContentHTML));
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
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
        fieldName: 'order_key',
        operator: 'match',
        value: order?.key ?? undefined
      },
      {
        fieldName: 'order_type_lkey',
        operator: 'match',
        value: '862828331135792'
      }
    ];
    setListOrdersTestResponse(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
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
    const cat = laboratoryList?.object?.find(item => item.testKey === test.testKey);

    setCurrentStep(test.processingStatusLkey);
    const updatedFilters = [
      {
        fieldName: 'order_test_key',
        operator: 'match',
        value: test?.key || undefined
      }
    ];
    setListResultResponse(prevRequest => ({
      ...prevRequest,
      filters: [...updatedFilters]
    }));
    const updatedPrevFilters = [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key || undefined
      },
      {
        fieldName: 'medical_test_key',
        operator: 'match',
        value: test?.testKey || undefined
      }
    ];
    setListPrevResultResponse(prevRequest => ({
      ...prevRequest,
      filters: updatedPrevFilters
    }));
  }, [test]);

  const handleSendMessage = async value => {
    try {
      await savenotes({
        ...note,
        notes: value,
        testKey: test.key,
        orderKey: order.key
      }).unwrap();
      dispatch(notify({ msg: 'Send successfully', sev: 'success' }));

    } catch (error) {
      dispatch(notify({ msg: 'Send Faild', sev: 'error' }));
    }
    fecthNotes();
  };
  const handleSendResultMessage = async value => {
    try {
      await saveReportNote({
        ...note,
        notes: value,
        testKey: test.key,
        orderKey: order.key,
        reportKey: report.key
      }).unwrap();
      dispatch(notify({ msg: 'Send successfully', sev: 'success' }));

    } catch (error) {
      dispatch(notify({ msg: 'Send Faild', sev: 'error' }));
    }
    fecthResultNotes();
  };
  const handleDateChange = date => {
    if (date) {
      setSelectedSampleDate(date);
    }
  };

  const handleRejectedTest = async () => {
    try {
      const Response = await saveTest({
        ...test,
        processingStatusLkey: '6055192099058457',
        rejectedAt: Date.now()
      }).unwrap();
      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
      setOpenRejectedModal(false);
      setTest({ ...newApDiagnosticOrderTests });
      await fetchTest();
      orderFetch();
      setTest({ ...Response });
    } catch (error) {
      dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
    }
  };

  const handleAcceptTest = async rowData => {
    if (rowData.patientArrivedAt !== null) {
      try {
        const Response = await saveTest({
          ...rowData,
          processingStatusLkey: '6055074111734636',
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

        setTest({ ...newApDiagnosticOrderTests });
        dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
        setTest({ ...Response });

        await fetchTest();

        await resultFetch();
      } catch (error) {
        dispatch(notify({ msg: 'Saved Failed', sev: 'error' }));
        console.error('Error saving test or report:', error);
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

  const stepsData = [
    {
      key: '6816324725527414',
      value: 'Patient Arrived',
      time: test.patientArrivedAt ? new Date(test.patientArrivedAt).toLocaleString() : ''
    },
    {
      key: '6055074111734636',
      value: 'Accepted',
      time: test.acceptedAt ? new Date(test.acceptedAt).toLocaleString() : ''
    },
    {
      key: '6055192099058457',
      value: 'Rejected',
      time: test.rejectedAt ? new Date(test.rejectedAt).toLocaleString() : ''
    },
    {
      key: '265123250697000',
      value: 'Result Ready',
      time: test.readyAt ? new Date(test.readyAt).toLocaleString() : ''
    },
    {
      key: '265089168359400',
      value: 'Result Approved',
      time: test.approvedAt ? new Date(test.approvedAt).toLocaleString() : ''
    }
  ];

  const filteredStepsData = stepsData.filter(step =>
    currentStep == '6055192099058457' ? step.value !== 'Accepted' : step.value !== 'Rejected'
  );
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);
  const orderColumns = [
    {
      key: "orderId",
      dataKey: "orderId",
      title: <Translate>ORDER ID</Translate>,
      flexGrow: 1,
      fullText: true,
      render: (rowData: any) => {
        return rowData.orderId ?? '';
      }
    },
    {
      key: "submittedAt",
      dataKey: "submittedAt",
      title: <Translate>DATE,TIME</Translate>,
      flexGrow: 1,
      fullText: true,
      render: (rowData: any) => {
        return rowData.submittedAt ? new Date(rowData.submittedAt).toLocaleString() : '';
      }
    },
    {
      key: "mrn",
      title: <Translate>MRN</Translate>,
      flexGrow: 1,
      fullText: true,
      render: (rowData: any) => {
        return rowData.patient?.patientMrn ?? '';
      }
    },
    {
      key: "name",
      title: <Translate>PATIENT NAME</Translate>,
      flexGrow: 2,
      fullText: true,
      render: (rowData: any) => {
        return rowData.patient?.fullName ?? '';
      }
    },
    {
      key: "radStatusLkey",
      dataKey: "radStatusLkey",
      title: <Translate>STATUS</Translate>,
      flexGrow: 1,
      fullText: true,
      render: (rowData: any) => {
        return rowData.radStatusLvalue?.lovDisplayVale ?? rowData.radStatusLkey;
      }
    },
    {
      key: "marker",
      title: <Translate>MARKER</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.isUrgent ? (
          <Whisper
            placement="top"
            trigger="hover"
            speaker={<Tooltip>Urgent</Tooltip>}
          >
            <FontAwesomeIcon
              icon={faLandMineOn}
              style={{
                fontSize: '1em',
                marginRight: 10,
                color: 'red',
                cursor: 'pointer'
              }}
            />
          </Whisper>
        ) : (
          null
        );
      }
    }
  ];
  ////order
  const pageIndex = listOrdersResponse.pageNumber - 1;
  // how many rows per page:
  const rowsPerPage = listOrdersResponse.pageSize;
  // total number of items in the backend:
  const totalCount = filterdOrderList?.length ?? 0;
  // handler when the user clicks a new page number:
  const handlePageChange = (_: unknown, newPage: number) => {
    // MUI gives you a zero-based page, so add 1 for your API
    setManualSearchTriggered(true);
    setListOrdersResponse({ ...listOrdersResponse, pageNumber: newPage + 1 });
  };
  // handler when the user chooses a different rows-per-page:
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualSearchTriggered(true);
    setListOrdersResponse({
      ...listOrdersResponse,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // reset to first page
    });


  };
  const testColumns = [
    {
      key: "categoryLvalue",
      dataKey: "categoryLvalue",
      title: <Translate>TEST CATEGORY</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const cat = laboratoryList?.object?.find(
          item => item.testKey === rowData.testKey
        );
        if (cat) {
          return cat.categoryLvalue?.lovDisplayVale ?? '';
        }
        return '';
      }
    }
    ,
    {
      key: "name",
      dataKey: "name",
      title: <Translate>TEST NAME</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return  rowData.test.testName
      }

    }
    ,
    {
      key: "reasonLkey",
      dataKey: "reasonLkey",
      title: <Translate>REASON</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return  rowData.reasonLvalue
        ? rowData.reasonLvalue.lovDisplayVale
        : rowData.reasonLkey
      }

    },
    {
      key: "priorityLkey",
      dataKey: "priorityLkey",
      title: <Translate>PROIRITY</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return  rowData.priorityLvalue
        ? rowData.priorityLvalue.lovDisplayVale
        : rowData.priorityLkey
      }

    }
    ,
    {
      key: "duration",
      dataKey: "duration",
      title: <Translate>DURATION</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const cat = laboratoryList?.object?.find(
          item => item.testKey === rowData.testKey
        );
        if (cat) {
          return `${cat.testDurationTime ?? ''} ${cat.timeUnitLvalue?.lovDisplayVale ?? ''}`;
        }
        return '';
      }
    }
    ,
    {
      key: "physician",
      dataKey: "physician",
      title: <Translate>PHYSICIAN</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.createdBy, " At", rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : "" 
      }

    },
    {
      key: "notes",
      dataKey: "notes",
      title: <Translate>ORDERS NOTES</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.notes
      }

    },
    {
      key: "technicianNotes", 
      title: <Translate>Technician Notes</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return <HStack spacing={10}>
        <FontAwesomeIcon
          icon={faComment}
          style={{ fontSize: '1em' }}
          onClick={() => setOpenNoteModal(true)}
        />
      </HStack>
      }

    },
    {
      key: "patientArrived",
      title: <Translate>PATIENT ARRIVED</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return  <HStack spacing={10}>
        <FontAwesomeIcon
          icon={faHospitalUser}
          style={{ fontSize: '1em' }}
          onClick={() => setOpenSampleModal(true)}
        />
      </HStack>
      }

    },
    ,
    {
      key: "processingStatusLkey",
      dataKey: "processingStatusLkey",
      title: <Translate>SATUTS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
       
       return rowData.processingStatusLvalue
          ? rowData.processingStatusLvalue.lovDisplayVale
          : rowData.processingStatusLkey
      }

    }
    ,
    ,
    {
      key: "",
      dataKey: "",
      title: <Translate>ACTION</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
         
     return   <HStack spacing={10}>
        <Whisper
          placement="top"
          trigger="hover"
          speaker={<Tooltip>Accepted</Tooltip>}
        >
          <CheckRoundIcon
            onClick={() =>
              (rowData.processingStatusLkey === '6055029972709625' ||
                rowData.processingStatusLkey == '6816324725527414') &&
              handleAcceptTest(rowData)
            }
            style={{
              fontSize: '1em',
              marginRight: 10,
              color:
                rowData.processingStatusLkey !== '6055029972709625' &&
                  rowData.processingStatusLkey !== '6816324725527414'
                  ? 'gray'
                  : 'inherit',
              cursor:
                rowData.processingStatusLkey !== '6055029972709625' &&
                  rowData.processingStatusLkey !== '6816324725527414'
                  ? 'not-allowed'
                  : 'pointer'
            }}
          />
        </Whisper>
        <Whisper
          placement="top"
          trigger="hover"
          speaker={<Tooltip>Rejected</Tooltip>}
        >
          <WarningRoundIcon
            onClick={() =>
              (rowData.processingStatusLkey === '6055029972709625' ||
                rowData.processingStatusLkey === '6816324725527414') &&
              setOpenRejectedModal(true)
            }
            style={{
              fontSize: '1em',
              marginRight: 10,
              color:
                rowData.processingStatusLkey !== '6055029972709625' &&
                  rowData.processingStatusLkey !== '6816324725527414'
                  ? 'gray'
                  : 'inherit',
              cursor:
                rowData.processingStatusLkey !== '6055029972709625' &&
                  rowData.processingStatusLkey !== '6816324725527414'
                  ? 'not-allowed'
                  : 'pointer'
            }}
          />
        </Whisper>
        <Whisper
          placement="top"
          trigger="hover"
          speaker={<Tooltip>Send to External Lab</Tooltip>}
        >
          <FontAwesomeIcon
            icon={faRightFromBracket}
            style={{ fontSize: '1em', marginRight: 10 }}
          />
        </Whisper>
      </HStack>
   
      }

    },
    ,
    {
      key: "acceptedAt",
      dataKey: "acceptedAt",
      title: <Translate>ACCEPTED AT</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) => {
        return (rowData.acceptedAt ? new Date(rowData.acceptedAt).toLocaleString() : '')
      }
    },
    ,
    {
      key: "acceptedBy",
      dataKey: "acceptedBy",
      title: <Translate>ACCEPTED BY</Translate>,
      flexGrow: 1,
      expandable: true,
      
    }
    ,
    ,
    {
      key: "rejectedAt",
      dataKey: "rejectedAt",
      title: <Translate>REJECTED AT</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) => {
        return (rowData.rejectedAt ? new Date(rowData.rejectedAt).toLocaleString() : '')
      }
    }
    ,
    {
      key: "rejectedBy",
      dataKey: "rejectedBy",
      title: <Translate>REJECTED BY</Translate>,
      flexGrow: 1,
      expandable: true,
     
    }
    ,
    {
      key: "rejectedReason",
      dataKey: "rejectedReason",
      title: <Translate>REJECTED REASON</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) => {
        return (rowData.rejectedAt ? new Date(rowData.rejectedAt).toLocaleString() : '')
      }
    }
  ]

   ////test
   const pageTestIndex = listOrdersTestResponse.pageNumber - 1;
   // how many rows per page:
   const rowsPerPageTest = listOrdersTestResponse.pageSize;
   // total number of items in the backend:
   const totalCountTest = testsList?.extraNumeric?? 0;
   // handler when the user clicks a new page number:
   const handlePageChangeTest = (_: unknown, newPage: number) => {
     // MUI gives you a zero-based page, so add 1 for your API
     setManualSearchTriggeredTest(true);
     setListOrdersTestResponse({ ...listOrdersTestResponse, pageNumber: newPage + 1 });
   };
   // handler when the user chooses a different rows-per-page:
   const handleRowsPerPageChangeTest = (event: React.ChangeEvent<HTMLInputElement>) => {
     setManualSearchTriggeredTest(true);
     setListOrdersTestResponse({
       ...listOrdersTestResponse,
       pageSize: parseInt(event.target.value, 10),
       pageNumber: 1 // reset to first page
     });
 
 
   };
  //report
  const reportColumns = [
    {
      key: "testName",
      dataKey: "testName",
      title: <Translate>TEST NAME</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
       return test?.test?.testName;
      }
    }
    ,
    {
      key: "report",
      dataKey: "report",
      title: <Translate>Report</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return  (
          <HStack spacing={10}>
            <FontAwesomeIcon
              icon={faFileLines}
              style={{ fontSize: '1em' }}
              onClick={() => setOpenReportModal(true)}
            />
          </HStack>
        )
      }

    }
    ,
    {
      key: "comment",
      
      title: <Translate>COMMENTS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => (
        <HStack spacing={10}>
          <FontAwesomeIcon
            icon={faComment}
            style={{ fontSize: '1em' }}
            onClick={() => setOpenNoteResultModal(true)}
          />
        </HStack>
      )

    },
    {
      key: "previousResult",
      title: <Translate>PREVIOUS RESULT</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const prev = prevResultsList?.object?.[1];
    
        if (!prev) return '';
    
        switch (prev.normalRangeKey) {
          case '6209578532136054':
            return prev.reasonLvalue?.lovDisplayVale ?? prev.reasonLkey;
          case '6209569237704618':
            return prev.resultValueNumber ?? '';
          default:
            return '';
        }
      }
    },
    {
      key: "preDate",
     
      title: <Translate>PREVIOUS REPORT DATE</Translate>,
      flexGrow: 1,
      render: (rowData: any) =>  {
       return prevResultsList?.object[0]
        ? new Date(prevResultsList?.object[0]?.createdAt).toLocaleString()
        : ''}
    }
    ,
    {
      key: "",
      
      title: <Translate>EXTERNEL STATUS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return null;
      }

    },
    {
      key: "statusLkey",
      dataKey: "statusLkey",
      title: <Translate>REPORT SATUTS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.statusLvalue
        ? rowData.statusLvalue.lovDisplayVale
        : rowData.statusLkey
      }

    },
    {
      key: "", 
      title: <Translate>EXTERNEL LAB NAME</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return null;
      }

    },
    {
      key: "patientArrived",
      title: <Translate>ATTACHMENT</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return null;
      }

    },
    ,
    {
      key: " ",
      
      title: <Translate>ATTACHED BY/DATE</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
       
       return null;

    }}
    ,
    ,
    {
      key: "",
      dataKey: "",
      title: <Translate>ACTION</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
         
     return  (
      <HStack spacing={10}>
        <Whisper
          placement="top"
          trigger="hover"
          speaker={<Tooltip>Approve</Tooltip>}
        >
          <CheckRoundIcon
            style={{
              fontSize: '1em',
              marginRight: 10,
              color: rowData.statusLkey == '265089168359400' ? 'gray' : 'inherit',
              cursor:
                rowData.statusLkey == '265089168359400'
                  ? 'not-allowed'
                  : 'pointer'
            }}
            onClick={async () => {
              if (rowData.statusLkey !== '265089168359400') {
                try {
                  saveReport({
                    ...rowData,
                    statusLkey: '265089168359400',
                    approvedAt: Date.now()
                  }).unwrap();
                  const Response = await saveTest({
                    ...test,
                    processingStatusLkey: '265089168359400',
                    approvedAt: Date.now()
                  }).unwrap();

                  setTest({ ...newApDiagnosticOrderTests });
                  dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                  setTest({ ...Response });
                  await fetchTest();

                  await resultFetch();
                } catch (error) {
                  dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
                }
              }
            }}
          />
        </Whisper>
        <Whisper
          placement="top"
          trigger="hover"
          speaker={<Tooltip>Reject</Tooltip>}
        >
          <WarningRoundIcon
            style={{
              fontSize: '1em',
              marginRight: 10,
              color: rowData.statusLkey == '265089168359400' ? 'gray' : 'inherit',
              cursor:
                rowData.statusLkey == '265089168359400'
                  ? 'not-allowed'
                  : 'pointer'
            }}
            onClick={() =>
              rowData.statusLkey !== '265089168359400' &&
              setOpenRejectedResultModal(true)
            }
          />
        </Whisper>

        <Whisper
          placement="top"
          trigger="hover"
          speaker={<Tooltip>Print</Tooltip>}
        >
          <FontAwesomeIcon
            icon={faPrint}
            style={{ fontSize: '1em', marginRight: 10 }}
          />
        </Whisper>
        <Whisper
          placement="top"
          trigger="hover"
          speaker={<Tooltip>Review</Tooltip>}
        >
          <FontAwesomeIcon
            icon={faStar}
            style={{
              fontSize: '1em',
              marginRight: 10,
              color: rowData.reviewAt ? '#e0a500' : '#343434'
            }}
            onClick={async () => {
              try {
                await saveReport({ ...report, reviewAt: Date.now() }).unwrap();
                dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                resultFetch();
              } catch (error) {
                dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
              }
            }}
          />
        </Whisper>
      </HStack>
    )
   
      }

    },
   
  ]
    
    const pageIndexReport = listResultResponse.pageNumber - 1;
  
    // how many rows per page:
    const rowsPerPageReport = listResultResponse.pageSize;
  
    // total number of items in the backend:
    const totalCountReport = reportList?.extraNumeric ?? 0;
  
    // handler when the user clicks a new page number:
    const handlePageChangeReport = (_: unknown, newPage: number) => {
      // MUI gives you a zero-based page, so add 1 for your API
      setManualSearchTriggeredReport(true);
      setListResultResponse({ ...listResultResponse, pageNumber: newPage + 1 });
    };
  
    // handler when the user chooses a different rows-per-page:
    const handleRowsPerPageChangeReport = (event: React.ChangeEvent<HTMLInputElement>) => {
      setManualSearchTriggeredReport(true);
      setListResultResponse({
        ...listResultResponse,
        pageSize: parseInt(event.target.value, 10),
        pageNumber: 1 // reset to first page
      });
    };
  
  return (
    <div>
      <div className="container">
        <div className="left-box">
          <Row>
            <Col xs={14}>
              {/* <Panel style={{ border: '1px solid #e5e5ea' }}> */}
              <MyTable
                data={filterdOrderList ?? []}
                columns={orderColumns}
                onRowClick={rowData => {
                  setOrder(rowData);
                  setOpenOrders(true);
                  setTest({ ...newApDiagnosticOrderTests });
                  setReport({ ...newApDiagnosticOrderTestsRadReport });
                }}
                sortColumn={listOrdersResponse.sortBy}
                sortType={listOrdersResponse.sortType}
                onSortChange={(sortBy, sortType) => {
                  setListOrdersResponse({ ...listOrdersResponse, sortBy, sortType });
                }}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />


            </Col>
            <Col xs={10}>
              <Row>
                <DatePicker
                  oneTap
                  placeholder="From Date"
                  value={dateFilter.fromDate}
                  onChange={e => setDateFilter({ ...dateFilter, fromDate: e })}
                  style={{
                    width: '230px',
                    marginRight: '5px',
                    fontFamily: 'Inter',
                    fontSize: '14px',
                    height: '30px'
                  }}
                />
                <DatePicker
                  oneTap
                  placeholder="To Date"
                  value={dateFilter.toDate}
                  onChange={e => setDateFilter({ ...dateFilter, toDate: e })}
                  style={{
                    width: '230px',
                    marginRight: '5px',
                    fontFamily: 'Inter',
                    fontSize: '14px',
                    height: '30px'
                  }}
                />
              </Row>

              {test.key && (
                <Row>
                  <Steps
                    current={filteredStepsData.findIndex(step => step.key === currentStep)}
                    style={{ zoom: 0.7 }}
                  >
                    {filteredStepsData.map((step, index) => {
                      let stepStatus = 'process';
                      let stepColor = 'inherit';

                      const currentIndex = filteredStepsData.findIndex(s => s.key === currentStep);

                      if (index < currentIndex) {
                        stepStatus = 'finish';
                      } else if (step.key === currentStep) {
                        if (currentStep == '6055192099058457') {
                          stepStatus = 'error';
                        } else {
                          stepStatus = 'process';
                          stepColor = 'blue';
                        }
                      } else {
                        stepStatus = 'wait';
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
                </Row>
              )}
            </Col>
          </Row>
          <Row>
            {openorders && (
              <Panel
                header="Order's Tests"
                collapsible
                defaultExpanded
                style={{ border: '1px solid #e5e5ea' }}
              >
                <MyTable
                columns={testColumns}
                 data={testsList?.object ?? []}
                 onRowClick={rowData => {
                   setOpenResults(true);
                   setTest(rowData);
                   setReport({ ...newApDiagnosticOrderTestsRadReport });
                 }}
                 loading={isTestFetching}
                 page={pageTestIndex}
                 rowsPerPage={rowsPerPageTest}
                 totalCount={totalCountTest}
                 onPageChange={handlePageChangeTest}
                 onRowsPerPageChange={handleRowsPerPageChangeTest}
                />
             
              </Panel>
            )}
          </Row>
          <Row>
            {openresults && (
              <Panel
                header="Test's Results Processing"
                collapsible
                defaultExpanded
                style={{ border: '1px solid #e5e5ea' }}
              >
                <MyTable
                columns={reportColumns}
                data={reportList?.object ?? []}
                onRowClick={rowData => {
                  setReport(rowData);
                }}
                rowClassName={isReporttSelected}
                loading={isTestFetching}
                page={pageIndexReport}
                rowsPerPage={rowsPerPageReport}
                totalCount={totalCountReport}
                onPageChange={handlePageChangeReport}
                onRowsPerPageChange={handleRowsPerPageChangeReport}
                sortColumn={listResultResponse.sortBy}
                sortType={listResultResponse.sortType}
                onSortChange={(sortBy, sortType) => {
                  setListResultResponse({ ...listResultResponse, sortBy, sortType });
                }}
                />
              
              </Panel>
            )}
          </Row>
        </div>

        <div className="right-box">
          <PatientSide patient={patient} encounter={encounter} />
        </div>
      </div>
      <ChatModal open={openNoteResultModal} setOpen={setOpenNoteResultModal} handleSendMessage={handleSendResultMessage} title={"Comments"} list={messagesResultList?.object} fieldShowName={'notes'} />
      <ChatModal open={openNoteModal} setOpen={setOpenNoteModal} handleSendMessage={handleSendMessage} title={"Comments"} list={messagesList?.object} fieldShowName={'notes'} />
      <MyModal
        open={openSampleModal}
        setOpen={setOpenSampleModal}
        title="Patient Arrived"
        steps={[{ title: "Arrived", icon: faHospitalUser }]}
        size="450px"
        bodyheight={300}
        content={
          <Col md={24}>
            <Row>
              <Col md={24}>
                <Form fluid>
                  <MyInput
                    width='100%'
                    fieldLabel="Patient Arrival Note"
                    fieldName={'patientArrivedNoteRad'}
                    fieldType="textarea"
                    record={test}
                    setRecord={setTest}
                  />
                </Form></Col>
            </Row>
            <Row>
              <Col md={24}>
                <Form fluid>
                  <MyInput
                    width="100%"
                    fieldName="patientArrivedAt"
                    fieldType='datetime'
                    record={test}
                    setRecord={setTest}

                  />
                </Form></Col>
            </Row>
          </Col>}
      ></MyModal>

      <CancellationModal
        open={openRejectedModal}
        setOpen={setOpenRejectedModal}
        fieldName='rejectedReason'
        fieldLabel="Rejected Reason"
        title="Reject"
        object={test}
        setObject={setTest}
        handleCancle={handleRejectedTest}
      />
      <CancellationModal
        open={openRejectedResultModal}
        setOpen={setOpenRejectedResultModal}
        fieldName='rejectedReason'
        fieldLabel="Rejected Reason"
        title="Reject"
        object={report}
        setObject={setReport}
        handleCancle={async () => {
          {
            try {
              await saveReport({
                ...report,
                statusLkey: '6488555526802885',
                rejectedAt: Date.now()
              }).unwrap();
              dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
              resultFetch();
              setOpenRejectedResultModal(false);
            } catch (error) {
              dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
            }
          }
        }}
      />
      <MyModal
        title="Add Report"
        open={openReportModal}
        setOpen={setOpenReportModal}
        steps={[{ title: "Report", icon: faFileLines }]}
        size="450px"
        bodyheight={300}
        content={<>
          <Row>
            <Col md={24}>
              <ButtonGroup>
                <IconButton icon={<FaBold />} />
                <IconButton icon={<FaItalic />} />
                <IconButton icon={<List />} />
                <IconButton icon={<FaLink />} />
                <IconButton icon={<Image />} />

              </ButtonGroup>
            </Col>
          </Row>
          <Row >
            <Col md={24}>
              <Form fluid>
                <MyInput
                  width="100%"
                  disabled={report.statusLkey == '265089168359400' ? true : false}
                  fieldName={'severityLkey'}
                  fieldType="select"
                  selectData={severityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={report}
                  setRecord={setReport}
                />
              </Form>
            </Col>
          </Row>
          <Row >
            <Col md={24}>
              <Form fluid>
                <MyInput
                  disabled={report.statusLkey == '265089168359400' ? true : false}
                  width="100%"
                  hight={200}
                  fieldLabel={''}
                  fieldName={'reportValue'}
                  fieldType="textarea"
                  record={report}
                  setRecord={setReport}
                />
              </Form></Col>

          </Row>
        </>}
      ></MyModal>

    </div>
  );
};
export default Rad;
