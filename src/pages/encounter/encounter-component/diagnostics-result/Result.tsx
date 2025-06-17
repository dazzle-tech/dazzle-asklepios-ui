import ChatModal from "@/components/ChatModal";
import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useAppDispatch } from "@/hooks";
import { useGetDiagnosticOrderTestResultQuery, useGetOrderTestResultNotesByResultIdQuery, useSaveDiagnosticOrderTestResultsNotesMutation } from "@/services/labService";
import { useGetDiagnosticsTestLaboratoryListQuery, useGetLovAllValuesQuery } from "@/services/setupService";
import { newApDiagnosticOrderTests, newApDiagnosticOrderTestsResult, newApDiagnosticOrderTestsResultNotes, newApDiagnosticTestLaboratory } from "@/types/model-types-constructor";
import { initialListRequest, initialListRequestAllValues, ListRequest } from "@/types/types";
import { addFilterToListRequest,formatDateWithoutSeconds } from '@/utils';
import { notify } from "@/utils/uiReducerActions";
import { faArrowDown, faArrowUp, faCircleExclamation, faComment, faPrint, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { Form, HStack, Tooltip, Whisper } from "rsuite";
const Result = ({ patient, user }) => {
    const dispatch = useAppDispatch();
    const [result, setResult] = useState<any>({ ...newApDiagnosticOrderTestsResult });
    const [test, setTest] = useState<any>({ ...newApDiagnosticOrderTests });
    const [labDetails, setLabDetails] = useState<any>({ ...newApDiagnosticTestLaboratory });
    const [dateOrderFilter, setDateOrderFilter] = useState({
        fromDate: new Date(),
        toDate: new Date()
    });
    const [listResultResponse, setListResultResponse] = useState<ListRequest>({
        ...initialListRequest,
        sortBy: "createdAt",
        sortType: 'desc',
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
        ],
    });

    const [openNoteResultModal, setOpenNoteResultModal] = useState(false);
    const [saveResultNote] = useSaveDiagnosticOrderTestResultsNotesMutation();
    const { data: resultsList, refetch: resultFetch, isLoading: resultLoding, isFetching: featchingTest } = useGetDiagnosticOrderTestResultQuery({ ...listResultResponse });
    const { data: lovValues } = useGetLovAllValuesQuery({ ...initialListRequestAllValues });
    const { data: messagesResultList, refetch: fecthResultNotes } = useGetOrderTestResultNotesByResultIdQuery(result?.key || undefined, { skip: result.key == null });
    const { data: laboratoryList } = useGetDiagnosticsTestLaboratoryListQuery({
        ...initialListRequest

    });
    const isResultSelected = rowData => {
        if (rowData && result && rowData.key === result.key) {
            return 'selected-row';
        } else return '';
    };
    useEffect(() => {
        const cat = laboratoryList?.object?.find((item) => item.testKey === test.testKey);
        setLabDetails(cat);
    }, [test]);
    useEffect(() => {
        setTest({ ...result?.test });
    }, [result]);


 useEffect(() => {
  setListResultResponse(prev => ({
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
  if (!resultLoding && resultsList?.object?.length) {
    const fromDate = dateOrderFilter.fromDate
      ? new Date(dateOrderFilter.fromDate)
      : null;
    const toDate = dateOrderFilter.toDate
      ? new Date(dateOrderFilter.toDate)
      : null;

    if (fromDate) fromDate.setHours(0, 0, 0, 0);
    if (toDate) toDate.setHours(23, 59, 59, 999);

    const filtered = resultsList.object.filter(item => {
      const createdAt = new Date(item.test?.order?.createdAt);
      return (
        (!fromDate || createdAt >= fromDate) &&
        (!toDate || createdAt <= toDate)
      );
    });

    const value = filtered.map(order => `(${order.key})`).join(" ") || '("")';

    setListResultResponse(prev =>
      addFilterToListRequest("key", "in", value, prev)
    );
  }
}, [dateOrderFilter, resultLoding, resultsList]);

    const joinValuesFromArray = (keys) => {

        return keys
            .map(key => lovValues?.object?.find(lov => lov.key === key))
            .filter(obj => obj !== undefined)
            .map(obj => obj.lovDisplayVale)
            .join(', ');
    };
    const handleSendResultMessage = async (value) => {
        try {
            await saveResultNote({ ...newApDiagnosticOrderTestsResultNotes, notes: value, testKey: test.key, orderKey: test.orderKey, resultKey: result.key, createdBy: user }).unwrap();
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
            key: "approvedAt",
            title: <Translate>Result Date</Translate>,
            flexGrow: 1,

            render: (rowData: any) => {
                return formatDateWithoutSeconds(rowData.approvedAt);
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
            title: <Translate>Print</Translate>,
            flexGrow: 3,
            fullText: true,
            render: (rowData: any) => {
                return (

                    <HStack spacing={5}>

                        <Whisper
                            placement="top"
                            trigger="hover"
                            speaker={<Tooltip>Print</Tooltip>}
                        >
                            <FontAwesomeIcon icon={faPrint} style={{ fontSize: '1em', marginRight: '5px' }} />
                        </Whisper>

                    </HStack>


                );
            },
        },
        {
            key: "reviewAt",
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
            </Form>
        );
    };
    return (<>
        <MyTable

            filters={filters()}
            columns={tableColomns}
            data={resultsList?.object || []}
            loading={resultLoding}
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
        <ChatModal open={openNoteResultModal} setOpen={setOpenNoteResultModal} handleSendMessage={handleSendResultMessage} title={"Comments"} list={messagesResultList?.object} fieldShowName={'notes'} /></>)
}
export default Result;