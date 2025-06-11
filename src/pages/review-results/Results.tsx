import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useAppDispatch } from "@/hooks";
import { useGetDiagnosticOrderTestResultQuery, useGetOrderTestResultNotesByResultIdQuery, useSaveDiagnosticOrderTestResultMutation, useSaveDiagnosticOrderTestResultsNotesMutation } from "@/services/labService";
import { useGetPatientByIdQuery } from "@/services/patientService";
import { useGetEncounterByIdQuery } from "@/services/encounterService";
import { useGetDiagnosticsTestLaboratoryListQuery, useGetLovAllValuesQuery } from "@/services/setupService";
import { newApDiagnosticOrderTests, newApDiagnosticOrderTestsResult, newApDiagnosticOrderTestsResultNotes, newApDiagnosticTestLaboratory } from "@/types/model-types-constructor";
import { initialListRequest, initialListRequestAllValues, ListRequest } from "@/types/types";
import { notify } from "@/utils/uiReducerActions";
import { faArrowDown, faArrowUp, faCircleExclamation, faComment, faStar, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { addFilterToListRequest, formatDate } from '@/utils';
import React, { useEffect, useState } from "react";
import { Form, HStack, Tooltip, Whisper } from "rsuite";
import ChatModal from "@/components/ChatModal";
import MyModal from "@/components/MyModal/MyModal";
import MyInput from "@/components/MyInput";
const Results = ({ setEncounter, setPatient, user }) => {
    const dispatch = useAppDispatch();
    const [result, setResult] = useState<any>({ ...newApDiagnosticOrderTestsResult });
    const [openNoteResultModal, setOpenNoteResultModal] = useState(false);
    const [test, setTest] = useState<any>({ ...newApDiagnosticOrderTests });
    const [dateFilter, setDateFilter] = useState({
        fromDate:null,
        toDate:null
    });
    const [dateOrderFilter, setDateOrderFilter] = useState({
        fromDate: null,
        toDate:null
    });
    const { data: patientData, isLoading: isPatientLoading } = useGetPatientByIdQuery(test?.order?.patientKey, { skip: !test?.order?.patientKey });
    const { data: encounterData, isLoading: isEncounterLoading } = useGetEncounterByIdQuery(test?.order?.encounterKey, { skip: !test?.order?.encounterKey });
    const {
        data: messagesResultList, refetch: fecthResultNotes } = useGetOrderTestResultNotesByResultIdQuery(result?.key || undefined, { skip: result.key == null });
    const [saveResult, saveResultMutation] = useSaveDiagnosticOrderTestResultMutation();
    const [saveResultNote] = useSaveDiagnosticOrderTestResultsNotesMutation();
    const [labDetails, setLabDetails] = useState<any>({ ...newApDiagnosticTestLaboratory });
    const isResultSelected = rowData => {
        if (rowData && result && rowData.key === result.key) {
            return 'selected-row';
        } else return '';
    };
    const [listResultResponse, setListResultResponse] = useState<ListRequest>({
        ...initialListRequest,
        sortBy: "createdAt",
        sortType: 'desc',
       
        filters: [
            {
                fieldName: "status_lkey",
                operator: 'match',
                value: "265089168359400",
            }


        ],
    });

    const { data: resultsList, refetch: resultFetch, isLoading: resultLoding, isFetching: featchingTest } = useGetDiagnosticOrderTestResultQuery({ ...listResultResponse });
    const { data: lovValues } = useGetLovAllValuesQuery({ ...initialListRequestAllValues });
    const { data: laboratoryList } = useGetDiagnosticsTestLaboratoryListQuery({
        ...initialListRequest

    });

    useEffect(() => {

        setPatient(patientData);
    }, [patientData]);
    useEffect(() => {
        setEncounter(encounterData)
    }, [encounterData]);
    useEffect(() => {
        const cat = laboratoryList?.object?.find((item) => item.testKey === test.testKey);
        setLabDetails(cat);
    }, [test]);
    useEffect(() => {
        setTest({ ...result?.test });
    }, [result]);
    useEffect(() => {

        if (dateFilter.fromDate && dateFilter.toDate) {
            const formattedFromDate = new Date(dateFilter.fromDate)?.getTime();
            const formattedToDate = new Date(dateFilter.toDate)?.getTime();
            setListResultResponse(
                addFilterToListRequest(
                    'approved_at',
                    'between',
                    formattedFromDate + '_' + formattedToDate,
                    listResultResponse
                )
            );
        } else if (dateFilter.fromDate) {
            const formattedFromDate = new Date(dateFilter.fromDate)?.getTime();
            setListResultResponse(
                addFilterToListRequest('approved_at', 'gte', formattedFromDate, listResultResponse)
            );
        } else if (dateFilter.toDate) {
            const formattedToDate = new Date(dateFilter.toDate)?.getTime();
            setListResultResponse(
                addFilterToListRequest('approved_at', 'lte', formattedToDate, listResultResponse)
            );
        }
        else {
            setListResultResponse({
                ...listResultResponse, filters: [
                    {
                        fieldName: "status_lkey",
                        operator: 'match',
                        value: "265089168359400",
                    }
                ]
            });
        }
    }, [dateFilter.fromDate, dateFilter.toDate]);
  
    useEffect(() => {
    
        if((dateOrderFilter.fromDate !==null )&& (dateOrderFilter.toDate !==null)){
           
        const filtered = resultsList?.object?.filter(
            item => item.test?.order?.createdAt >= dateOrderFilter.fromDate && item.test?.order?.createdAt <= dateOrderFilter.toDate
        );

       
        const value = filtered?.map(order => `(${order.key})`)
            .join(" ");
       
        setListResultResponse(
            addFilterToListRequest(
                'key',
                'in',
                value,
                listResultResponse
            )
        );}
    }, [dateOrderFilter?.fromDate, dateOrderFilter?.toDate]);
   
    const joinValuesFromArray = (keys) => {

        return keys
            .map(key => lovValues?.object?.find(lov => lov.key === key))
            .filter(obj => obj !== undefined)
            .map(obj => obj.lovDisplayVale)
            .join(', ');
    };
    const handleSendResultMessage = async (value) => {
        try {
            await saveResultNote({ ...newApDiagnosticOrderTestsResultNotes, notes: value, testKey: test.key, orderKey: test.orderKey, resultKey: result.key }).unwrap();
            dispatch(notify({ msg: 'Send Successfully', sev: 'success' }));

        }
        catch (error) {
            dispatch(notify({ msg: 'Send Faild', sev: 'error' }));
        }
        await fecthResultNotes();

    };
    const tableColomns = [
        {
            key: "orderId",
            title: <Translate>ORDER ID</Translate>,
            flexGrow: 1,

            render: (rowData: any) => {
                return rowData.test?.orderId;
            }
        },
        {
            key: "testName",
            title: <Translate>TEST NAME</Translate>,
            flexGrow: 2,
            fullText: true,
            render: (rowData: any) => {
                if (rowData.isProfile) {
                    return rowData.test?.profileList?.find((item) => item.key == rowData?.testProfileKey)?.testName;
                } else {
                    return rowData.test?.test?.testName;
                }
            },
        },
        {
            key: "testResultUnit",
            title: <Translate>TEST RESULT,UNIT</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData => {
                if (rowData.normalRangeKey) {
                    if (rowData.normalRange?.resultTypeLkey === "6209578532136054") {

                        return (
                            <span>

                                {rowData.resultLvalue ? rowData.resultLvalue.lovDisplayVale : rowData?.resultLkey}
                            </span>
                        );
                    }
                    else if (rowData.normalRange?.resultTypeLkey == "6209569237704618") {
                        return (
                            <span>
                                {rowData.resultValueNumber}
                            </span>)
                    }
                }
                else {
                    return (
                        <span>
                            {rowData.resultText}
                        </span>
                    );
                }
            }

        },
        {
            key: "normalRange",
            title: <Translate>NORMAL RANGE</Translate>,
            flexGrow: 2,
            fullText: true,
            render: (rowData: any) => {
                if (rowData.normalRangeKey) {
                    if (rowData.normalRange?.resultTypeLkey == "6209578532136054") {
                        return (
                            joinValuesFromArray(rowData.normalRange?.lovList) +
                            " " +
                            labDetails?.resultUnitLvalue?.lovDisplayVale || ""
                        );
                    }
                    else if (rowData.normalRange?.resultTypeLkey == "6209569237704618") {
                        if (rowData.normalRange?.normalRangeTypeLkey == "6221150241292558") {
                            return (
                                rowData.normalRange?.rangeFrom +
                                "_" +
                                rowData.normalRange?.rangeTo +
                                " " +
                                labDetails?.resultUnitLvalue?.lovDisplayVale
                            );
                        } else if (rowData.normalRange?.normalRangeTypeLkey == "6221162489019880") {
                            return (
                                "Less Than " +
                                rowData.normalRange?.rangeFrom +
                                " " +
                                labDetails?.resultUnitLvalue?.lovDisplayVale
                            );
                        } else if (rowData.normalRange?.normalRangeTypeLkey == "6221175556193180") {
                            return (
                                "More Than " +
                                rowData.normalRange?.rangeTo +
                                " " +
                                labDetails?.resultUnitLvalue?.lovDisplayVale
                            );
                        }
                    }
                } else {
                    return "Normal Range Not Defined";
                }
            },
        },
        {
            key: "marker",
            title: <Translate>MARKER</Translate>,
            flexGrow: 2,
            fullText: true,
            render: (rowData: any) => {
                if (rowData.marker == "6730122218786367") {
                    return <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize: "1em" }} />;
                } else if (rowData.marker == "6731498382453316") {
                    return "Normal";
                } else if (rowData.marker == "6730083474405013") {
                    return <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: "1em" }} />;
                } else if (rowData.marker == "6730094497387122") {
                    return <FontAwesomeIcon icon={faArrowDown} style={{ fontSize: "1em" }} />;
                } else if (rowData.marker == "6730104027458969") {
                    return (
                        <HStack spacing={10}>
                            <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "1em" }} />
                            <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: "1em" }} />
                        </HStack>
                    );
                } else if (rowData.marker == "6730652890616978") {
                    return (
                        <HStack spacing={10}>
                            <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "1em" }} />
                            <FontAwesomeIcon icon={faArrowDown} style={{ fontSize: "1em" }} />
                        </HStack>
                    );
                }
            },
        },
        {
            key: "comments",
            title: <Translate>COMMENTS</Translate>,
            flexGrow: 1,
            fullText: true,
            render: (rowData: any) => {
                return (
                    <HStack spacing={10}>
                        <FontAwesomeIcon
                            icon={faComment}
                            style={{ fontSize: "1em" }}
                            onClick={() => setOpenNoteResultModal(true)}
                        />
                    </HStack>
                );
            },
        },



        {
            key: "resultStatus",
            title: <Translate>RESULT SATUTS</Translate>,
            flexGrow: 1,
            fullText: true,
            render: (rowData: any) => {
                return rowData.statusLvalue ? rowData.statusLvalue.lovDisplayVale : rowData.statusLkey

            },
        },
        {
            key: "action",
            title: <Translate>ACTION</Translate>,
            flexGrow: 3,
            fullText: true,
            render: (rowData: any) => {
                return (

                    <HStack spacing={5}>

                        <Whisper
                            placement="top"
                            trigger="hover"
                            speaker={<Tooltip>Review</Tooltip>}
                        >
                            <FontAwesomeIcon icon={faStar} style={{ fontSize: '1em', marginRight: '5px', color: rowData.reviewAt ? '#e0a500' : "#343434" }}
                                onClick={async () => {
                                    try {
                                        await saveResult({ ...result, reviewAt: Date.now(), reviewBy: user }).unwrap();
                                        dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                                        resultFetch();
                                    }
                                    catch (error) {
                                        dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
                                    }
                                }} />
                        </Whisper>

                    </HStack>


                );
            },
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

        }
    ]
    const pageIndex = listResultResponse.pageNumber - 1;

    // how many rows per page:
    const rowsPerPage = listResultResponse.pageSize;

    // total number of items in the backend:
    const totalCount = resultsList?.extraNumeric ?? 0;

    // handler when the user clicks a new page number:
    const handlePageChange = (_: unknown, newPage: number) => {
        // MUI gives you a zero-based page, so add 1 for your API

        setListResultResponse({ ...listResultResponse, pageNumber: newPage + 1 });
    };

    // handler when the user chooses a different rows-per-page:
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {

        setListResultResponse({
            ...listResultResponse,
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
                    fieldType="datetime"
                    fieldLabel="Approval From Date"
                    fieldName="fromDate"
                    record={dateFilter}
                    setRecord={setDateFilter}
                />
                <MyInput
                    width={180}
                    column
                    fieldType="datetime"
                    fieldLabel="Approval To Date"
                    fieldName="toDate"
                    record={dateFilter}
                    setRecord={setDateFilter}
                />
                <MyInput
                    column
                    width={180}
                    fieldType="datetime"
                    fieldLabel="Order From Date"
                    fieldName="fromDate"
                    record={dateOrderFilter}
                    setRecord={setDateOrderFilter}
                />
                <MyInput
                    width={180}
                    column
                    fieldType="datetime"
                    fieldLabel="Order To Date"
                    fieldName="toDate"
                    record={dateOrderFilter}
                    setRecord={setDateOrderFilter}
                />
            </Form>
        );
    };
    return (
        <>
            <MyTable
                filters={filters()}
                columns={tableColomns}
                data={resultsList?.object || []}
                loading={featchingTest}
                onRowClick={rowData => {
                    setResult(rowData);
                }}
                rowClassName={isResultSelected}
                height={250}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            ></MyTable>
            <ChatModal open={openNoteResultModal} setOpen={setOpenNoteResultModal} handleSendMessage={handleSendResultMessage} title={"Comments"} list={messagesResultList?.object} fieldShowName={'notes'} />

        </>
    );
}
export default Results;