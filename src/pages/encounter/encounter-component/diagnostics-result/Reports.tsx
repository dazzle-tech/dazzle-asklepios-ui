import ChatModal from "@/components/ChatModal";
import MyInput from "@/components/MyInput";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useAppDispatch } from "@/hooks";
import AddReportModal from "@/pages/rad-module/AddReportModal";
import { useGetDiagnosticOrderTestRadReportListQuery, useGetDiagnosticOrderTestReportNotesByReportIdQuery, useSaveDiagnosticOrderTestRadReportMutation, useSaveDiagnosticOrderTestReportNotesMutation } from "@/services/radService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { newApDiagnosticOrderTests, newApDiagnosticOrderTestsRadReport, newApDiagnosticOrderTestsReportNotes } from "@/types/model-types-constructor";
import { initialListRequest, ListRequest } from "@/types/types";
import { addFilterToListRequest, formatDateWithoutSeconds } from "@/utils";
import { notify } from "@/utils/uiReducerActions";
import { faComment, faFileLines, faPrint, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { Col, Form, HStack, Row, Tooltip, Whisper } from "rsuite";
const Reports = ({ patient, user }) => {
    const dispatch = useAppDispatch();
    const [openReportModal, setOpenReportModal] = useState(false);
    const [openNoteResultModal, setOpenNoteResultModal] = useState(false);
    const [report, setReport] = useState<any>({ ...newApDiagnosticOrderTestsRadReport });
    const [record, setRecord] = useState({});
    const [test, setTest] = useState<any>({ ...newApDiagnosticOrderTests });
    const [dateOrderFilter, setDateOrderFilter] = useState({
        fromDate: new Date(),
        toDate: new Date()
    });
    const [listReportResponse, setListReportResponse] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: "patient_key",
                operator: 'match',
                value: patient?.key,
            },
            {
                fieldName: "review_at",
                operator: 'notMatch',
                value: 0,
            }
        ]
    });

    const isSelected = rowData => {
        if (rowData && report && rowData.key === report.key) {
            return 'selected-row';
        } else return '';
    };

    const { data: reportList, refetch: reportFetch, isLoading } = useGetDiagnosticOrderTestRadReportListQuery({
        ...listReportResponse
    });
    const { data: messagesResultList, refetch: fecthResultNotes } =
        useGetDiagnosticOrderTestReportNotesByReportIdQuery(report?.key || undefined, {
            skip: report.key == null
        });
    const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
    const [saveReportNote] = useSaveDiagnosticOrderTestReportNotesMutation();
    useEffect(() => {
        setTest({ ...report?.test });
    }, [report]);


    useEffect(() => {
        setListReportResponse(prev => ({
            ...prev,
            filters: [
                {
                    fieldName: "patient_key",
                    operator: "match",
                    value: patient?.key,
                },
                {
                    fieldName: "review_at",
                    operator: "notMatch",
                    value: 0,
                },
            ],
        }));
    }, [dateOrderFilter?.fromDate, dateOrderFilter?.toDate]);
    useEffect(() => {
        const isDateRangeValid = dateOrderFilter.fromDate !== null && dateOrderFilter.toDate !== null;
        const isResultsLoaded = Array.isArray(reportList?.object) && reportList.object.length > 0;

        if (isDateRangeValid && isResultsLoaded) {
            const fromDate = new Date(dateOrderFilter.fromDate);
            fromDate.setHours(0, 0, 0, 0);

            const toDate = new Date(dateOrderFilter.toDate);
            toDate.setHours(23, 59, 59, 999);

            const filtered = reportList.object.filter(item => {
                const createdAt = new Date(item.test?.order?.createdAt);
                return createdAt >= fromDate && createdAt <= toDate;
            });

            const value = filtered.map(order => `(${order.key})`).join(" ") || '("")';

            setListReportResponse(prev =>
                addFilterToListRequest("key", "in", value, prev)
            );
        }
    }, [dateOrderFilter, reportList]);

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


    //Table
    const reportColumns = [

        {
            key: "orderId",
            title: <Translate>ORDER ID</Translate>,
            flexGrow: 1,

            render: (rowData: any) => {
                return rowData.test?.order?.orderId;
            }
        },

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
            key: "approvedAt",
            title: <Translate>Report Date</Translate>,
            flexGrow: 1,

            render: (rowData: any) => {
                return formatDateWithoutSeconds(rowData.approvedAt);
            }
        },
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
                         style={{
                        fontSize: "1em",
                        color: rowData.hasComments ? "#007bff" : "gray" 
                    }}
                        onClick={() => setOpenNoteResultModal(true)}
                    />
                </HStack>
            )

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
            key: "lab",
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
            key: "file",

            title: <Translate>ATTACHED BY/DATE</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {

                return null;

            }
        }

        ,
        {
            key: "print",

            title: <Translate>Print</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {

                return (
                    <HStack spacing={10}>

                        <Whisper
                            placement="top"
                            trigger="hover"
                            speaker={<Tooltip>Print</Tooltip>}
                            onClick={()=>{setOpenReportModal(true)}}
                        >
                            <FontAwesomeIcon icon={faPrint} style={{ fontSize: '1em', marginRight: '5px' }} />
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

    const filters = () => {
        return (
            <Form layout="inline" fluid className="date-filter-form">

                <MyInput
                    column
                    width={180}
                    fieldType="date"
                    fieldLabel="Order From Date"
                    fieldName="fromDate"
                    record={dateOrderFilter}
                    setRecord={setDateOrderFilter}
                />
                <MyInput
                    width={180}
                    column
                    fieldType="date"
                    fieldLabel="Order To Date"
                    fieldName="toDate"
                    record={dateOrderFilter}
                    setRecord={setDateOrderFilter}
                />

                <MyInput
                    width={'100%'}
                    column
                    fieldLabel="Test Name"
                    fieldType="text"
                    fieldName="testName"
                    record={record}
                    setRecord={setRecord}
                />
            </Form>
        );
    };
    return (<>
        <MyTable
            filters={filters()}
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
        
          <AddReportModal
                  open={openReportModal}
                  setOpen={setOpenReportModal}
                  test={test}
                  setTest={setTest}
                  resultFetch={reportFetch}
                  report={report}
                  setReport={setReport}
                  saveReport={()=>{}}
                  saveTest={()=>{}}
                  disableEdit={true}
                  attachmentRefetch={()=>{}}
                />
        </>)
}
export default Reports;