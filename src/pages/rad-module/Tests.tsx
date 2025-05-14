import CancellationModal from '@/components/CancellationModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useGetDiagnosticOrderTestQuery,
  useGetOrderTestNotesByTestIdQuery,
  useSaveDiagnosticOrderTestNotesMutation
} from '@/services/encounterService';
import { useGetDiagnosticsTestRadiologyListQuery } from '@/services/setupService';
import {
  newApDiagnosticOrderTests,
  newApDiagnosticOrderTestsNotes,
  newApDiagnosticOrderTestsRadReport
} from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import { notify } from '@/utils/uiReducerActions';
import { faComment, faHospitalUser, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect, useRef } from 'react';
import { HStack, Tooltip, Whisper } from 'rsuite';
import ChatModal from '@/components/ChatModal';

import PatientArrivalModal from './PatientArrivalModal';
const Tests = ({ test, setTest, order, patient, encounter, saveTest, saveReport, reportFetch }) => {
  const dispatch = useAppDispatch();
  const [openNoteModal, setOpenNoteModal] = useState(false);
  const [openArrivalModal, setOpenArrivalModal] = useState(false);
  const [manualSearchTriggeredTest, setManualSearchTriggeredTest] = useState(false);
  const [note, setNote] = useState({ ...newApDiagnosticOrderTestsNotes });
  const [openRejectedModal, setOpenRejectedModal] = useState(false);
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
      },
      {
        fieldName: 'status_lkey',
        operator: 'match',
        value: '1804482322306061'
      }
    ]
  });
  const isSelected = rowData => {
    if (rowData && test && rowData.key === test.key) {
      return 'selected-row';
    } else return '';
  };
  const [savenotes] = useSaveDiagnosticOrderTestNotesMutation();
  const { data: messagesList, refetch: fecthNotes } = useGetOrderTestNotesByTestIdQuery(
    test?.key || undefined,
    { skip: test.key == null }
  );
  const { data: radiologyList } = useGetDiagnosticsTestRadiologyListQuery({
    ...initialListRequest,
    pageSize: 100
  });
  const {
    data: testsList,
    refetch: fetchTest,
    isFetching: isTestFetching
  } = useGetDiagnosticOrderTestQuery({ ...listOrdersTestResponse });
  console.log('tests', testsList);
  //to set notes modal scroll in tha last massage
  const endOfMessagesRef = useRef(null);
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesList]);
  useEffect(() => {
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
      },
      {
        fieldName: 'status_lkey',
        operator: 'match',
        value: '1804482322306061'
      }
    ];
    setListOrdersTestResponse(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
  }, [order]);
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
      //orderFetch();
      setTest({ ...Response });
    } catch (error) {
      dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
    }
  };
  //When the test is accepted, a report is generated for it,but the patient must have arrived
  const handleAcceptTest = async rowData => {
    if (rowData.patientArrivedAt !== null) {
      try {
        const Response = await saveTest({
          ...rowData,
          processingStatusLkey: '6055074111734636',
          acceptedAt: Date.now()
        }).unwrap();
        await saveReport({
          ...newApDiagnosticOrderTestsRadReport,
          orderKey: order.key,
          orderTestKey: test.key,
          medicalTestKey: test.testKey,
          patientKey: patient.key,
          visitKey: encounter.key,
          statusLkey: '6055029972709625'
        }).unwrap();

        dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));

        setTest({ ...newApDiagnosticOrderTests });
        await fetchTest();
        await reportFetch();
      } catch (error) {
        dispatch(notify({ msg: 'Saved Failed', sev: 'error' }));
        console.error('Error saving test or report:', error);
      }
    } else {
      dispatch(notify({ msg: 'Wait for the patient to arrive', sev: 'warning' }));
    }
  };

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
  const testColumns = [
    {
      key: 'categoryLvalue',
      dataKey: 'categoryLvalue',
      title: <Translate>TEST CATEGORY</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const cat = radiologyList?.object?.find(item => item.testKey === rowData.testKey);
        if (cat) {
          return cat.categoryLvalue?.lovDisplayVale ?? '';
        }
        return '';
      }
    },
    {
      key: 'name',
      dataKey: 'name',
      title: <Translate>TEST NAME</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.test.testName;
      }
    },
    {
      key: 'reasonLkey',
      dataKey: 'reasonLkey',
      title: <Translate>REASON</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.reasonLvalue ? rowData.reasonLvalue.lovDisplayVale : rowData.reasonLkey;
      }
    },
    {
      key: 'priorityLkey',
      dataKey: 'priorityLkey',
      title: <Translate>PROIRITY</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.priorityLvalue
          ? rowData.priorityLvalue.lovDisplayVale
          : rowData.priorityLkey;
      }
    },
    {
      key: 'duration',
      dataKey: 'duration',
      title: <Translate>DURATION</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const cat = radiologyList?.object?.find(item => item.testKey === rowData.testKey);
        if (cat) {
          return `${cat.testDurationTime ?? ''} ${cat.timeUnitLvalue?.lovDisplayVale ?? ''}`;
        }
        return '';
      }
    },
    {
      key: 'physician',
      dataKey: 'physician',
      title: <Translate>PHYSICIAN</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return (
          rowData.createdBy,
          ' At',
          rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ''
        );
      }
    },
    {
      key: 'notes',
      dataKey: 'notes',
      title: <Translate>ORDERS NOTES</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.notes;
      }
    },
    {
      key: 'technicianNotes',
      title: <Translate>Technician Notes</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return (
          <HStack spacing={10}>
            <FontAwesomeIcon
              icon={faComment}
              style={{ fontSize: '1em' }}
              onClick={() => setOpenNoteModal(true)}
            />
          </HStack>
        );
      }
    },
    {
      key: 'patientArrived',
      title: <Translate>PATIENT ARRIVED</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return (
          <HStack spacing={10}>
            <FontAwesomeIcon
              icon={faHospitalUser}
              style={{ fontSize: '1em' }}
              onClick={() => setOpenArrivalModal(true)}
            />
          </HStack>
        );
      }
    },
    ,
    {
      key: 'processingStatusLkey',
      dataKey: 'processingStatusLkey',
      title: <Translate>SATUTS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.processingStatusLvalue
          ? rowData.processingStatusLvalue.lovDisplayVale
          : rowData.processingStatusLkey;
      }
    },
    ,
    {
      key: '',
      dataKey: '',
      title: <Translate>ACTION</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return (
          <HStack spacing={10}>
            <Whisper placement="top" trigger="hover" speaker={<Tooltip>Accepted</Tooltip>}>
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
            <Whisper placement="top" trigger="hover" speaker={<Tooltip>Rejected</Tooltip>}>
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
        );
      }
    },
    ,
    {
      key: 'acceptedAt',
      dataKey: 'acceptedAt',
      title: <Translate>ACCEPTED AT</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) => {
        return rowData.acceptedAt ? new Date(rowData.acceptedAt).toLocaleString() : '';
      }
    },
    ,
    {
      key: 'acceptedBy',
      dataKey: 'acceptedBy',
      title: <Translate>ACCEPTED BY</Translate>,
      flexGrow: 1,
      expandable: true
    },
    ,
    {
      key: 'rejectedAt',
      dataKey: 'rejectedAt',
      title: <Translate>REJECTED AT</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) => {
        return rowData.rejectedAt ? new Date(rowData.rejectedAt).toLocaleString() : '';
      }
    },
    {
      key: 'rejectedBy',
      dataKey: 'rejectedBy',
      title: <Translate>REJECTED BY</Translate>,
      flexGrow: 1,
      expandable: true
    },
    {
      key: 'rejectedReason',
      dataKey: 'rejectedReason',
      title: <Translate>REJECTED REASON</Translate>,
      flexGrow: 1,
      expandable: true,
   
    }
  ];

  ////test
  const pageTestIndex = listOrdersTestResponse.pageNumber - 1;
  // how many rows per page:
  const rowsPerPageTest = listOrdersTestResponse.pageSize;
  // total number of items in the backend:
  const totalCountTest = testsList?.extraNumeric ?? 0;
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
  return (
    <>
      <MyTable
        columns={testColumns}
        data={testsList?.object ?? []}
        onRowClick={rowData => {
          setTest(rowData);
          //  setReport({ ...newApDiagnosticOrderTestsRadReport });
        }}
        loading={isTestFetching}
        page={pageTestIndex}
        rowsPerPage={rowsPerPageTest}
        totalCount={totalCountTest}
        onPageChange={handlePageChangeTest}
        onRowsPerPageChange={handleRowsPerPageChangeTest}
        rowClassName={isSelected}
      />
      <CancellationModal
        open={openRejectedModal}
        setOpen={setOpenRejectedModal}
        fieldName="rejectedReason"
        fieldLabel="Rejected Reason"
        title="Reject"
        object={test}
        setObject={setTest}
        handleCancle={handleRejectedTest}
      />
      <ChatModal
        open={openNoteModal}
        setOpen={setOpenNoteModal}
        handleSendMessage={handleSendMessage}
        title={'Comments'}
        list={messagesList?.object}
        fieldShowName={'notes'}
      />
      <PatientArrivalModal
        open={openArrivalModal}
        setOpen={setOpenArrivalModal}
        test={test}
        setTest={setTest}
        saveTest={saveTest}
        fetchTest={fetchTest}
      />
    </>
  );
};
export default Tests;
