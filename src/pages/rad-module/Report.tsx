import CancellationModal from "@/components/CancellationModal";
import ChatModal from "@/components/ChatModal";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useAppDispatch } from "@/hooks";
import { useGetDiagnosticOrderTestRadReportListQuery, useGetDiagnosticOrderTestReportNotesByReportIdQuery, useSaveDiagnosticOrderTestReportNotesMutation } from "@/services/radService";
import { newApDiagnosticOrderTests, newApDiagnosticOrderTestsReportNotes, newApDiagnosticOrderTestsResultNotes } from "@/types/model-types-constructor";
import { initialListRequest, ListRequest } from "@/types/types";
import { notify } from "@/utils/uiReducerActions";
import { faComment, faFileLines, faPrint, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import React, { useEffect, useRef, useState } from "react";
import { HStack, Tooltip, Whisper } from "rsuite";
import { forwardRef, useImperativeHandle } from 'react';
import AddReportModal from "./AddReportModal";
import { formatDateWithoutSeconds } from '@/utils';
type props = {
    report: any,
    setReport: any,
    saveReport: any,
    test: any,
    setTest: any,
    saveTest: any
    listReportResponse: any,
    setListReportResponse: any
    patient: any,
    order: any,
    saveReportMutation: any
}
const Report = forwardRef<unknown, props>(({ report, setReport, saveReport, test, setTest, listReportResponse, setListReportResponse, saveTest, patient, order,saveReportMutation }, ref) => {
    useImperativeHandle(ref, () => ({
        reportFetch
    }));
    const dispatch = useAppDispatch();
    const [openRejectedResultModal, setOpenRejectedResultModal] = useState(false);
    const [openReportModal, setOpenReportModal] = useState(false);
    const [openNoteResultModal, setOpenNoteResultModal] = useState(false);
    const { data: reportList, refetch: reportFetch, isLoading } = useGetDiagnosticOrderTestRadReportListQuery({
        ...listReportResponse
    });
    const [saveReportNote] = useSaveDiagnosticOrderTestReportNotesMutation();
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
    const { data: prevResultsList, refetch: prevResultFetch } =
        useGetDiagnosticOrderTestRadReportListQuery({ ...listPrevResultResponse });

    const isSelected = rowData => {
        if (rowData && report && rowData.key === report.key) {
            return 'selected-row';
        } else return '';
    };
    const [manualSearchTriggeredReport, setManualSearchTriggeredReport] = useState(false);

    const { data: messagesResultList, refetch: fecthResultNotes } =
        useGetDiagnosticOrderTestReportNotesByReportIdQuery(report?.key || undefined, {
            skip: report.key == null
        });

    //to set notes modal scroll in tha last massage
    const endOfMessagesRef = useRef(null);
    useEffect(() => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messagesResultList]);
    useEffect(() => {
        const updatedFilters = [
            {
                fieldName: 'order_test_key',
                operator: 'match',
                value: test?.key || undefined
            }
        ]
        setListReportResponse((prevRequest) => ({
            ...prevRequest,
            filters: updatedFilters,
        }))
    }, [reportFetch])

    useEffect(() => {
    
        const updatedFilters = [
            {
                fieldName: 'order_test_key',
                operator: 'match',
                value: test?.key || undefined
            }
        ]
        setListReportResponse((prevRequest) => ({
            ...prevRequest,
            filters: updatedFilters,
        }))
    }, [test]);
     useEffect(() => {
    
            reportFetch();
        }, [saveReportMutation.isSuccess]);
    // save note when write it in chatModal
    const handleSendResultMessage = async value => {
        try {
            await saveReportNote({
                ...newApDiagnosticOrderTestsReportNotes,
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
                return (
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

                if (!prev) return prev?.reportValue;

                return null;


            }

        },
        {
            key: "preDate",

            title: <Translate>PREVIOUS REPORT DATE</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return formatDateWithoutSeconds(prevResultsList?.object[0]?.createdAt) 
              
            }
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

                return (
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
                                            // await fetchTest();

                                            await reportFetch();
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
                    
                    </HStack>
                )

            }

        },
          {
              key: 'rejectedAt',
              dataKey: 'rejectedAt',
              title: <Translate>REJECTED AT/BY</Translate>,
              flexGrow: 1,
              expandable: true,
              render: (rowData: any) => {
                return <>
                  <span>{rowData.rejectedBy}</span>
                  <br />
                  <span className='date-table-style'>{formatDateWithoutSeconds(rowData.rejectedAt)}</span>
                </>
              
              }
            },
          
          {
              key: 'approvedAt',
              dataKey: 'approvedAt',
              title: <Translate>Approved AT/BY</Translate>,
              flexGrow: 1,
              expandable: true,
              render: (rowData: any) => {
                return <>
                  <span>{rowData.approvedBy}</span>
                  <br />
                  <span className='date-table-style'>{formatDateWithoutSeconds(rowData.approvedAt)}</span>
                </>
              
              }
            },
          

    ]

    const pageIndexReport = listReportResponse.pageNumber - 1;

    // how many rows per page:
    const rowsPerPageReport = listReportResponse.pageSize;

    // total number of items in the backend:
    const totalCountReport = reportList?.extraNumeric ?? 0;

    // handler when the user clicks a new page number:
    const handlePageChangeReport = (_: unknown, newPage: number) => {
        // MUI gives you a zero-based page, so add 1 for your API
        setManualSearchTriggeredReport(true);
        setListReportResponse({ ...listReportResponse, pageNumber: newPage + 1 });
    };

    // handler when the user chooses a different rows-per-page:
    const handleRowsPerPageChangeReport = (event: React.ChangeEvent<HTMLInputElement>) => {
        setManualSearchTriggeredReport(true);
        setListReportResponse({
            ...listReportResponse,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // reset to first page
        });
    };

    return (<div ref={ref}>
        <MyTable
            columns={reportColumns}
            data={reportList?.object ?? []}
            onRowClick={rowData => {
                setReport(rowData);
            }}
            rowClassName={isSelected}
            loading={isLoading}
            page={pageIndexReport}
            rowsPerPage={rowsPerPageReport}
            totalCount={totalCountReport}
            onPageChange={handlePageChangeReport}
            onRowsPerPageChange={handleRowsPerPageChangeReport}
            sortColumn={listReportResponse.sortBy}
            sortType={listReportResponse.sortType}
            onSortChange={(sortBy, sortType) => {
                setListReportResponse({ ...listReportResponse, sortBy, sortType });
            }}
        />
        <ChatModal open={openNoteResultModal} setOpen={setOpenNoteResultModal} handleSendMessage={handleSendResultMessage} title={"Comments"} list={messagesResultList?.object} fieldShowName={'notes'} />

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
                        reportFetch();
                        setOpenRejectedResultModal(false);
                    } catch (error) {
                        dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
                    }
                }
            }}
        />
        <AddReportModal
            open={openReportModal}
            setOpen={setOpenReportModal}
            test={test}
            setTest={setTest}
            resultFetch={reportFetch}
            report={report}
            setReport={setReport}
            saveReport={saveReport}
            saveTest={saveTest}
        />
    </div>
    );
});
export default Report;