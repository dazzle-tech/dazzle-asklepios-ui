import ChatModal from "@/components/ChatModal";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useAppDispatch } from "@/hooks";
import { useGetEncounterByIdQuery } from "@/services/encounterService";
import { useGetPatientByIdQuery } from "@/services/patientService";
import { useGetDiagnosticOrderTestRadReportListQuery, useGetDiagnosticOrderTestReportNotesByReportIdQuery, useSaveDiagnosticOrderTestRadReportMutation, useSaveDiagnosticOrderTestReportNotesMutation } from "@/services/radService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { newApDiagnosticOrderTests, newApDiagnosticOrderTestsRadReport, newApDiagnosticOrderTestsReportNotes } from "@/types/model-types-constructor";
import { initialListRequest, ListRequest } from "@/types/types";
import { notify } from "@/utils/uiReducerActions";
import { faComment, faFileLines, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef, useState } from "react";
import { Col, Form, HStack, Row, Tooltip, Whisper } from "rsuite";
const ReviewReport = ({  setEncounter, setPatient, user }) => {
    const [openReportModal, setOpenReportModal] = useState(false);
    const [openNoteResultModal, setOpenNoteResultModal] = useState(false);
    
    const [saveReportNote] = useSaveDiagnosticOrderTestReportNotesMutation();
    const [report, setReport] = useState<any>({ ...newApDiagnosticOrderTestsRadReport });
    const [test, setTest] = useState<any>({ ...newApDiagnosticOrderTests });
    const { data: patientData, isLoading: isPatientLoading } = useGetPatientByIdQuery(test?.order?.patientKey, { skip: !test?.order?.patientKey });
     const { data: encounterData, isLoading: isEncounterLoading } = useGetEncounterByIdQuery(test?.order?.encounterKey,{skip: !test?.order?.encounterKey});
         const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
    const dispatch = useAppDispatch();
    const [listReportResponse, setListReportResponse] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: "status_lkey",
                operator: 'match',
                value: "265089168359400",
            }
        ]
    });
    const isSelected = rowData => {
        if (rowData && report && rowData.key === report.key) {
            return 'selected-row';
        } else return '';
    };
    const [saveReport, saveReportMutation] = useSaveDiagnosticOrderTestRadReportMutation();
    const { data: reportList, refetch: reportFetch, isLoading } = useGetDiagnosticOrderTestRadReportListQuery({
        ...listReportResponse
    });

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
     
        setPatient(patientData);
    }, [patientData]);
    useEffect(()=>{
        setEncounter()
    },[encounterData]);
      useEffect(()=>{
            setTest({...report?.test});
        },[report])
    const handleSendResultMessage = async value => {
        try {
            await saveReportNote({
                ...newApDiagnosticOrderTestsReportNotes,
                notes: value,
                testKey: report.test.key,
                // orderKey: order.key,
                reportKey: report.key
            }).unwrap();
            dispatch(notify({ msg: 'Send successfully', sev: 'success' }));

        } catch (error) {
            dispatch(notify({ msg: 'Send Faild', sev: 'error' }));
        }
        fecthResultNotes();
    };
    const reportColumns = [
        {
            key: "testName",
            dataKey: "testName",
            title: <Translate>TEST NAME</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.test?.test?.testName;
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
        // {
        //     key: "previousResult",
        //     title: <Translate>PREVIOUS RESULT</Translate>,
        //     flexGrow: 1,
        //     render: (rowData: any) => {
        //         const prev = prevResultsList?.object?.[1];

        //         if (!prev) return prev?.reportValue;

        //         return null;


        //     }

        // },


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
                                        await saveReport({ ...report, reviewAt: Date.now(), reviewBy: user }).unwrap();
                                        dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                                        reportFetch();
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
        {
            key: "",
            title: <Translate>Review At/By</Translate>,
            expandable: true,
            render: (rowData: any) => {
                return (<>
                    <span>{rowData.reviewByUser?.fullName}</span>
                    <br />
                    <span className='date-table-style'>{rowData.reviewAt ? new Date(rowData.reviewAt).toLocaleString() : ''}</span>
                </>)
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

        setListReportResponse({ ...listReportResponse, pageNumber: newPage + 1 });
    };

    // handler when the user chooses a different rows-per-page:
    const handleRowsPerPageChangeReport = (event: React.ChangeEvent<HTMLInputElement>) => {

        setListReportResponse({
            ...listReportResponse,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // reset to first page
        });
    };

    return (<>
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
         <MyModal
                open={openReportModal}
                setOpen={setOpenReportModal}
                title={"Report"}
                size="sm"
               bodyheight="30vh"
                content={
                    <>
                    <Form fluid>
                          <Row>
                    <Col md={24}>
                       
                            <MyInput
                                width="100%"
                                disabled={ true}
                                fieldName={'severityLkey'}
                                fieldType="select"
                                selectData={severityLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={report}
                                setRecord={setReport}
                            />
                       
                    </Col>
                </Row>
                <Row >
                    <Col md={24}>
                      
                            <MyInput
                                disabled={ true }
                                width="100%"
                                hight={200}
                                fieldLabel={''}
                                fieldName={'reportValue'}
                                fieldType="textarea"
                                record={report}
                                setRecord={setReport}
                            />
                       </Col>

                </Row>
                        </Form></>
                }
            />
    </>);
}
export default ReviewReport;