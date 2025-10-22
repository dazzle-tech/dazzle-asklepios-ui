import CancellationModal from '@/components/CancellationModal';
import ChatModal from '@/components/ChatModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useGetDiagnosticOrderTestQuery,
  useGetOrderTestNotesByTestIdQuery,
  useSaveDiagnosticOrderTestMutation
} from '@/services/encounterService';
import {
  useDeleteTestResultsMutation,
  useSaveDiagnosticOrderTestNotesMutation,
  useSaveDiagnosticTestResultMutation
} from '@/services/labService';
import {
  useGetDiagnosticsTestLaboratoryListQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import {
  newApDiagnosticOrderTests,
  newApDiagnosticOrderTestsNotes,
  newApDiagnosticOrderTestsResult
} from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import {
  faComment,
  faRightFromBracket,
  faVialCircleCheck
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Form, HStack, Panel, SelectPicker, Table, Tooltip, Whisper } from 'rsuite';
import SampleModal from './SampleModal';
import './styles.less';
import ReloadIcon from '@rsuite/icons/Reload';
import { formatDateWithoutSeconds } from '@/utils';
import MyInput from '@/components/MyInput';
type Props = {
  order: any;
  test: any;
  setTest: any;
  samplesList: any;
  resultFetch: any;
  fetchAllTests: any;
  fecthSample: () => void;
};
const Tests = forwardRef<unknown, Props>(
  ({ order, test, setTest, samplesList, resultFetch,fetchAllTests ,fecthSample }, ref) => {
    useImperativeHandle(ref, () => ({
      fetchTest
    }));
    const dispatch = useAppDispatch();
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [selectedCatValue, setSelectedCatValue] = useState(null);
    const [showListFilter, setShowListFilter] = useState(false);
    const [note, setNote] = useState({ ...newApDiagnosticOrderTestsNotes });
    const [openNoteModal, setOpenNoteModal] = useState(false);
    const [openSampleModal, setOpenSampleModal] = useState(false);
    const [openRejectedModal, setOpenRejectedModal] = useState(false);
    const { data: labCatLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_CATEGORIES');
    const [listRequest, setListRequest] = useState<ListRequest>({
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
          value: '862810597620632'
        },
        {
          fieldName: 'status_lkey',
          operator: 'match',
          value: '1804482322306061'
        }
      ]
    });
    const { data: messagesList, refetch: fecthNotes } = useGetOrderTestNotesByTestIdQuery(
      test?.key || undefined,
      { skip: test.key == null }
    );
    const [savenotes] = useSaveDiagnosticOrderTestNotesMutation();
    const [saveNewResult, saveNewResultMutation] = useSaveDiagnosticTestResultMutation();
    const [saveTest, saveTestMutation] = useSaveDiagnosticOrderTestMutation();
    const [deleteResults] = useDeleteTestResultsMutation();
    const isTestSelected = rowData => {
      if (rowData && test && rowData.key === test.key) {
        return 'selected-row';
      } else return '';
    };
    const {
      data: testsList,
      refetch: fetchTest,
      isFetching: isTestsFetching
    } = useGetDiagnosticOrderTestQuery({ ...listRequest });
    const { data: laboratoryList } = useGetDiagnosticsTestLaboratoryListQuery({
      ...initialListRequest
    });

    const { data: laboratoryListToFilter } = useGetDiagnosticsTestLaboratoryListQuery(
      {
        ...initialListRequest,
        filters: [
          {
            fieldName: 'category_lkey',
            operator: 'match',
            value: selectedCatValue
          }
        ]
      },
      {
        skip: !selectedCatValue
      }
    );

    useEffect(() => {
      if (selectedCatValue != null && selectedCatValue !== '') {
        if (laboratoryListToFilter?.object?.length == 0) {
          const value = undefined;
          setListRequest(
            addFilterToListRequest(fromCamelCaseToDBName('testKey'), 'in', value, listRequest)
          );
        } else {
          const value = laboratoryListToFilter?.object?.map(cat => `(${cat.testKey})`).join(' ');
          setListRequest(
            addFilterToListRequest(fromCamelCaseToDBName('testKey'), 'in', value, listRequest)
          );
        }
      } else {
        setListRequest({
          ...listRequest,
          filters: [
            {
              fieldName: 'order_key',
              operator: 'match',
              value: order?.key ?? undefined
            },
            {
              fieldName: 'order_type_lkey',
              operator: 'match',
              value: '862810597620632'
            },
            ,
            {
              fieldName: 'status_lkey',
              operator: 'match',
              value: '1804482322306061'
            }
          ]
        });
      }
    }, [selectedCatValue, laboratoryListToFilter]);

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
          value: '862810597620632'
        },
        {
          fieldName: 'status_lkey',
          operator: 'match',
          value: '1804482322306061'
        }
      ];
      setListRequest(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    }, [order]);

    useEffect(() => {
      const fetchData = async () => {
        try {
          await resultFetch();
        } catch (error) {
          console.error('Fetch error:', error);
        }
      };

      fetchData();
    }, [test]);

    useEffect(() => {
      resultFetch();
    }, [saveNewResultMutation.isSuccess]);
    //When the test is accepted, a report is generated for it,but the sample must have collected
    const handleAcceptTest = async rowData => {
      if (samplesList?.object?.length > 0) {
        try {
          const Response = await saveTest({
            ...test,
            processingStatusLkey: '6055074111734636',
            acceptedAt: Date.now()
          }).unwrap();

          await saveNewResult({
            ...newApDiagnosticOrderTestsResult,
            orderKey: order.key,
            orderTestKey: test.key,
            medicalTestKey: test.testKey,
            patientKey: order.patient.key,
            visitKey: order.encounter.key,
            statusLkey: '6055029972709625'
          }).unwrap();

          dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));

          await fetchTest();
          await fetchAllTests();
          try {
            await resultFetch();
          } catch (error) {
            console.error('Fetch error:', error);
          }
          setTest({ ...Response });
        } catch (error) {
          dispatch(notify({ msg: error, sev: 'error' }));
        }
      } else {
        dispatch(notify({ msg: 'Collect a sample first.', sev: 'warning' }));
      }
    };
    const handleUndoAcceptTest = async rowData => {
      try {
        const Response = await saveTest({
          ...rowData,
          processingStatusLkey: '6055029972709625',
          acceptedAt: null
        }).unwrap();
        await deleteResults(rowData.key).unwrap();

        dispatch(notify({ msg: 'Undo Successfully', sev: 'success' }));
        // setTest({ ...newApDiagnosticOrderTests });
        await fetchTest();
        await resultFetch();
        setTest({ ...Response });
      } catch (error) {
        dispatch(notify({ msg: 'Undo Faild', sev: 'error' }));
      }
    };

    const handleSendMessage = async value => {
      try {
        await savenotes({ ...note, notes: value, testKey: test.key, orderKey: order.key }).unwrap();
        dispatch(notify({ msg: 'Send Successfully', sev: 'success' }));
      } catch (error) {
        dispatch(notify({ msg: 'Send Faild', sev: 'error' }));
      }
      fecthNotes();
    };
    //set test status reject ,from reject modal
    const handleRejectedTest = async () => {
      try {
        const Response = await saveTest({
          ...test,
          processingStatusLkey: '6055192099058457',
          rejectedAt: Date.now()
        }).unwrap();

        setOpenRejectedModal(false);
        setTest({ ...newApDiagnosticOrderTests });
        dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
        setTest({ ...Response });
        await fetchTest();
      } catch (error) {
        dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
      }
    };

    const tableClumns = [
      {
        key: '',
        dataKey: '',
        title: <Translate>TEST CATEGORY</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          const cat = laboratoryList?.object?.find(item => item.testKey === rowData.testKey);
          if (cat) {
            return cat?.categoryLvalue?.lovDisplayVale;
          }
          return '';
        }
      },
      {
        key: '',
        dataKey: '',
        title: <Translate>TEST NAME</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          return rowData.test.testName;
        }
      },
      {
        key: '',
        dataKey: '',
        title: <Translate>IS PROFILE</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          const cat = laboratoryList?.object?.find(item => item.testKey === rowData.testKey);
          return cat?.isProfile ? 'Yes' : 'NO';
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
        key: '',
        dataKey: '',
        title: <Translate>PHYSICIAN</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          return (
            <>
              <span>{rowData.createdBy}</span>
              <br />
              <span className="date-table-style">
                {formatDateWithoutSeconds(rowData.createdAt)}
              </span>
            </>
          );
        }
      },
      {
        key: '',
        dataKey: '',
        title: <Translate>DURATION</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          const cat = laboratoryList?.object?.find(item => item.testKey === rowData.testKey);
          if (cat) {
            return cat?.testDurationTime + ' ' + cat?.timeUnitLvalue?.lovDisplayVale;
          }
          return '';
        }
      },
      {
        key: 'notes',
        dataKey: 'notes',
        title: <Translate>TEST NOTES</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          return rowData.notes;
        }
      },
      {
        key: '',
        dataKey: '',
        title: <Translate>TECHNICIAN NOTES</Translate>,
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
        key: '',
        dataKey: '',
        title: <Translate>COLLECT SAMPLE</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          return (
            <HStack spacing={10}>
              <FontAwesomeIcon
                icon={faVialCircleCheck}
                style={{ fontSize: '1em' }}
                onClick={() => setOpenSampleModal(true)}
              />
            </HStack>
          );
        }
      },
      {
        key: '',
        dataKey: '',
        title: <Translate>SATUTS</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          return rowData.processingStatusLvalue
            ? rowData.processingStatusLvalue.lovDisplayVale
            : rowData.processingStatusLkey;
        }
      },
      {
        key: '',
        dataKey: '',
        title: <Translate>ACTION</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          return (
            <HStack spacing={10}>
              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Accept</Tooltip>}>
                <CheckRoundIcon
                  onClick={() =>
                    (rowData.processingStatusLkey === '6055029972709625' ||
                      rowData.processingStatusLkey === '6055207372976955') &&
                    handleAcceptTest(rowData)
                  }
                  style={{
                    fontSize: '1em',
                    marginRight: 10,
                    color:
                      rowData.processingStatusLkey !== '6055029972709625' &&
                      rowData.processingStatusLkey !== '6055207372976955'
                        ? 'gray'
                        : 'inherit',
                    cursor:
                      rowData.processingStatusLkey !== '6055029972709625' &&
                      rowData.processingStatusLkey !== '6055207372976955'
                        ? 'not-allowed'
                        : 'pointer'
                  }}
                />
              </Whisper>
              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Undo Accepted</Tooltip>}>
                <ReloadIcon
                  onClick={() =>
                    rowData.processingStatusLvalue?.valueCode === 'LAB_TEST_ACCEPTED' &&
                    handleUndoAcceptTest(rowData)
                  }
                  style={{
                    fontSize: '1em',
                    marginRight: 10,
                    color:
                      rowData.processingStatusLvalue?.valueCode === 'LAB_TEST_ACCEPTED'
                        ? 'inherit'
                        : 'gray',
                    cursor:
                      rowData.processingStatusLvalue?.valueCode === 'LAB_TEST_ACCEPTED'
                        ? 'pointer'
                        : 'not-allowed'
                  }}
                />
              </Whisper>
              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Reject</Tooltip>}>
                <WarningRoundIcon
                  onClick={() =>
                    (rowData.processingStatusLkey === '6055029972709625' ||
                      rowData.processingStatusLkey === '6055207372976955') &&
                    setOpenRejectedModal(true)
                  }
                  style={{
                    fontSize: '1em',
                    marginRight: 10,
                    color:
                      rowData.processingStatusLkey !== '6055029972709625' &&
                      rowData.processingStatusLkey !== '6055207372976955'
                        ? 'gray'
                        : 'inherit',
                    cursor:
                      rowData.processingStatusLkey !== '6055029972709625' &&
                      rowData.processingStatusLkey !== '6055207372976955'
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
      {
        key: '',
        dataKey: '',
        title: <Translate>ACCEPTED AT/BY</Translate>,
        flexGrow: 1,
        expandable: true,
        render: (rowData: any) => {
          return (
            <>
              <span>{rowData.acceptedBy}</span>
              <br />
              <span className="date-table-style">
                {formatDateWithoutSeconds(rowData.acceptedAt)}
              </span>
            </>
          );
        }
      },
      {
        key: '',
        dataKey: '',
        title: <Translate>REJECTED AT/BY</Translate>,
        flexGrow: 1,
        expandable: true,
        render: (rowData: any) => {
          return (
            <>
              <span>{rowData.rejectedBy}</span>
              <br />
              <span className="date-table-style">
                {formatDateWithoutSeconds(rowData.rejectedAt)}
              </span>
            </>
          );
        }
      },
      {
        key: 'rejectedReason',
        dataKey: 'rejectedReason',
        title: <Translate>REJECTED REASON</Translate>,
        flexGrow: 1,
        expandable: true
      },
      {
        key: '',
        dataKey: '',
        title: <Translate>ATTACHMENT</Translate>,
        flexGrow: 1,
        expandable: true
      }
    ];
    const pageIndex = listRequest.pageNumber - 1;

    // how many rows per page:
    const rowsPerPage = listRequest.pageSize;

    // total number of items in the backend:
    const totalCount = testsList?.extraNumeric ?? 0;

    // handler when the user clicks a new page number:
    const handlePageChange = (_: unknown, newPage: number) => {
      // MUI gives you a zero-based page, so add 1 for your API

      setListRequest({ ...listRequest, pageNumber: newPage + 1 });
    };

    // handler when the user chooses a different rows-per-page:
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setListRequest({
        ...listRequest,
        pageSize: parseInt(event.target.value, 10),
        pageNumber: 1 // reset to first page
      });
    };

    const handleFilterResultChange = (fieldName, value) => {
      if (value) {
        setListRequest(
          addFilterToListRequest(
            fromCamelCaseToDBName(fieldName),
            'startsWithIgnoreCase',
            value,
            listRequest
          )
        );
      } else {
        setListRequest({
          ...listRequest,
          filters: [
            {
              fieldName: 'order_key',
              operator: 'match',
              value: order?.key ?? undefined
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
      }
    };
    const [record, setRecord] = useState({});
    //test category filter
    const filters = () => {
      return (
        <Form>
          <MyInput
            fieldType="select"
            fieldName="testKey"
            fieldLabel=""
            width={200}
            placeholder={'Select Action From List'}
            selectData={labCatLovQueryResponse?.object}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
            onChange={value => {
              setSelectedCatValue(value);
              handleFilterResultChange('testKey', value);
            }}
            onClean={() => {
              setTimeout(() => setShowListFilter(false), 200);
              handleFilterResultChange('testKey', null);
            }}
            searchable={false}
          />
        </Form>
      );
    };
    console.log("testsList: ");
    console.log(testsList);
return (
  <Panel ref={ref} header="Order's Tests" defaultExpanded>
    <MyTable
      filters={filters()}
      columns={tableClumns}
      data={testsList?.object ?? []}
      onRowClick={rowData => {
        setTest(rowData);
      }}
      rowClassName={isTestSelected}
      loading={isTestsFetching}
      sortColumn={listRequest.sortBy}
      sortType={listRequest.sortType}
      onSortChange={(sortBy, sortType) => {
        setListRequest({ ...listRequest, sortBy, sortType });
      }}
      page={pageIndex}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
    />

    <SampleModal
      open={openSampleModal}
      setOpen={setOpenSampleModal}
      samplesList={samplesList}
      labDetails={laboratoryList?.object?.find(item => item.testKey === test.testKey)}
      saveTest={saveTest}
      fetchTest={fetchTest}
      test={test}
      setTest={setTest}
      fecthSample={fecthSample}
      fetchAllTests={fetchAllTests}
    />
    <ChatModal
      open={openNoteModal}
      setOpen={setOpenNoteModal}
      handleSendMessage={handleSendMessage}
      title="Technician Notes"
      list={messagesList?.object}
      fieldShowName="notes"
    />
    <CancellationModal
      open={openRejectedModal}
      setOpen={setOpenRejectedModal}
      fieldName="rejectedReason"
      handleCancle={handleRejectedTest}
      object={test}
      setObject={setTest}
      fieldLabel="Reject Reason"
      title="Reject"
    />
  </Panel>
);

  }
);
export default Tests;
