import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { forwardRef, useImperativeHandle } from 'react';
import { useGetDiagnosticOrderTestQuery, useGetOrderTestNotesByTestIdQuery, useSaveDiagnosticOrderTestMutation } from "@/services/encounterService";
import { useGetDiagnosticsTestLaboratoryListQuery, useGetLovValuesByCodeQuery } from "@/services/setupService";
import { initialListRequest, ListRequest } from "@/types/types";
import { addFilterToListRequest, fromCamelCaseToDBName } from "@/utils";
import { faComment, faFilter, faRightFromBracket, faVialCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect } from "react";
import { Divider, HStack, IconButton, Pagination, Panel, SelectPicker, Table, Tooltip, Whisper } from "rsuite";
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import './styles.less';
import { newApDiagnosticOrderTests, newApDiagnosticOrderTestsNotes, newApDiagnosticOrderTestsResult } from "@/types/model-types-constructor";
import { useSaveDiagnosticOrderTestNotesMutation, useSaveDiagnosticTestResultMutation } from "@/services/labService";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import SampleModal from "./SampleModal";
import ChatModal from "@/components/ChatModal";
import CancellationModal from "@/components/CancellationModal";
const { Column, HeaderCell, Cell } = Table;
type Props = {
    order: any;         
    test: any; 
    setTest: any;
    samplesList: any;
    resultFetch: any;    
  };
const Tests =forwardRef<unknown,Props>(({ order, test, setTest, samplesList,resultFetch },ref)=>{
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
    const { data: messagesList, refetch: fecthNotes } = useGetOrderTestNotesByTestIdQuery(test?.key || undefined, { skip: test.key == null });
    const [savenotes] = useSaveDiagnosticOrderTestNotesMutation();
    const [saveNewResult] = useSaveDiagnosticTestResultMutation();
    const [saveTest] = useSaveDiagnosticOrderTestMutation();
    const isTestSelected = rowData => {
        if (rowData && test && rowData.key === test.key) {
            return 'selected-row';
        } else return '';
    };
    const { data: testsList, refetch: fetchTest, isFetching: isTestsFetching } = useGetDiagnosticOrderTestQuery({ ...listOrdersTestResponse });
    const { data: laboratoryList } = useGetDiagnosticsTestLaboratoryListQuery({
        ...initialListRequest

    });
    const { data: laboratoryListToFilter } = useGetDiagnosticsTestLaboratoryListQuery({
        ...initialListRequest,
        filters: [
            {

                fieldName: "category_lkey",
                operator: "match",
                value: selectedCatValue,
            }
        ]

    }, {
        skip: !selectedCatValue
    });
    useEffect(() => {
        if (selectedCatValue != null && selectedCatValue !== "") {

            if (laboratoryListToFilter?.object?.length == 0) {
                const value = undefined;
                setListOrdersTestResponse(
                    addFilterToListRequest(
                        fromCamelCaseToDBName("testKey"),
                        "in",
                        value,
                        listOrdersTestResponse
                    )
                );
            }
            else {
                const value = laboratoryListToFilter?.object
                    ?.map(cat => `(${cat.testKey})`)
                    .join(" ");
                setListOrdersTestResponse(
                    addFilterToListRequest(
                        fromCamelCaseToDBName("testKey"),
                        "in",
                        value,
                        listOrdersTestResponse
                    )
                );
            }



        }
        else {
            setListOrdersTestResponse({
                ...listOrdersTestResponse, filters: [
                    {
                        fieldName: "order_key",
                        operator: "match",
                        value: order?.key ?? undefined,
                    },
                    {
                        fieldName: "order_type_lkey",
                        operator: "match",
                        value: "862810597620632",
                    }]
            })
        }
    }, [selectedCatValue, laboratoryListToFilter]);

    useEffect(() => {

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
    const renderRowExpanded = rowData => {

        return (


            <Table
                data={[rowData]}

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

    const handleFilterResultChange = (fieldName, value) => {
        if (value) {
            setListOrdersTestResponse(
                addFilterToListRequest(
                    fromCamelCaseToDBName(fieldName),
                    'startsWithIgnoreCase',
                    value,
                    listOrdersTestResponse
                )
            );
        } else {
            setListOrdersTestResponse({
                ...listOrdersTestResponse, filters: [
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


                ]
            });
        }
    };
    const handleAcceptTest = async (rowData) => {
        if (samplesList?.object?.length > 0) {
            try {
                const Response = await saveTest({
                    ...test,
                    processingStatusLkey: "6055074111734636",
                    acceptedAt: Date.now()
                }).unwrap();

                const rResponse = await saveNewResult({
                    ...newApDiagnosticOrderTestsResult,
                    orderKey: order.key,
                    orderTestKey: test.key,
                    medicalTestKey: test.testKey,
                    patientKey: order.patient.key,
                    visitKey: order.encounter.key,
                    statusLkey: '6055029972709625'
                }).unwrap();

                setTest({ ...newApDiagnosticOrderTests })
                dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));

                setTest({ ...Response });
                await fetchTest();
                await resultFetch();
            }
            catch (error) {
                console.error("Error saving test:", error);
                dispatch(notify({ msg: error, sev: 'error' }));
            }
        }
        else {
            dispatch(notify({ msg: 'Collect a sample first.', sev: 'warning' }));
        }


    }

    const handleSendMessage = async (value) => {

        try {
            await savenotes({ ...note, notes: value, testKey: test.key, orderKey: order.key }).unwrap();
            dispatch(notify({ msg: 'Send Successfully', sev: 'success' }));

        }
        catch (error) {
            dispatch(notify({ msg: 'Send Faild', sev: 'error' }));
        }
        fecthNotes();

    };
    const handleRejectedTest = async () => {
        try {
            const Response = await saveTest({ ...test, processingStatusLkey: "6055192099058457", rejectedAt: Date.now() }).unwrap();

            setOpenRejectedModal(false);
            setTest({ ...newApDiagnosticOrderTests });
            dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
            setTest({ ...Response });
            await fetchTest();
        }
        catch (error) {
            dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
        }
    }
    return (
        <Panel ref={ref} header="Order's Tests" collapsible defaultExpanded className="panel-border">
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
                rowKey="key"
                expandedRowKeys={expandedRowKeys} // Ensure expanded row state is correctly handled
                renderRowExpanded={renderRowExpanded} // This is the function rendering the expanded child table
                shouldUpdateScroll={false}
                data={testsList?.object ?? []}
                onRowClick={rowData => {

                    setTest(rowData);

                }}
                rowClassName={isTestSelected}
                loading={isTestsFetching}
            >
                <Column width={70} align="center">
                    <HeaderCell>#</HeaderCell>
                    <ExpandCell rowData={rowData => rowData} dataKey="key" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} />
                </Column>

                <Column sortable flexGrow={2} fullText>
                    <HeaderCell>
                        {showListFilter ? (
                            <SelectPicker
                                style={{ width: '80%' }}
                                placeholder={<Translate>Select Action From List</Translate>}
                                data={labCatLovQueryResponse?.object}
                                labelKey="lovDisplayVale"
                                valueKey="key"
                                onSelect={(value) => {
                                    setSelectedCatValue(value);
                                    handleFilterResultChange('testKey', value)
                                }}

                                onClean={() => {
                                    setTimeout(() => setShowListFilter(false), 200)
                                    handleFilterResultChange('testKey', null)
                                }


                                }

                            />
                        ) : (
                            <div onClick={() => setShowListFilter(true)} style={{ cursor: 'pointer' }}>
                                <FontAwesomeIcon icon={faFilter} style={{ marginRight: '5px' }} />
                                <Translate> TEST CATEGORY</Translate>
                            </div>
                        )}
                    </HeaderCell>


                    <Cell >
                        {rowData => {
                            const cat = laboratoryList?.object?.find((item) => item.testKey === rowData.testKey)
                            if (cat) {
                                return cat?.categoryLvalue?.lovDisplayVale
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
                            const cat = laboratoryList?.object?.find((item) => item.testKey === rowData.testKey)
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

                        <Translate>PHYSICIAN</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => { return rowData.createdBy, " At", rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : "" }}

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

                        <Translate>ORDERS NOTES</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData.notes}

                    </Cell>

                </Column>

                <Column sortable flexGrow={2} fullText>
                    <HeaderCell>

                        <Translate>TECHNICIAN NOTES</Translate>
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
                                    speaker={<Tooltip>Accept</Tooltip>}
                                >
                                    <CheckRoundIcon
                                        onClick={() =>
                                            (rowData.processingStatusLkey === "6055029972709625" || rowData.processingStatusLkey === "6055207372976955") &&
                                            handleAcceptTest(rowData)}
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
                                    speaker={<Tooltip>Reject</Tooltip>}
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
            <Divider />
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
                activePage={listOrdersTestResponse.
                    pageNumber}

                onChangePage={pageNumber => {
                    setListOrdersTestResponse({ ...listOrdersTestResponse, pageNumber });
                }}
                onChangeLimit={pageSize => {
                    setListOrdersTestResponse({ ...listOrdersTestResponse, pageSize });
                }}
                total={testsList?.extraNumeric || 0}
            />
            <SampleModal open={openSampleModal} setOpen={setOpenSampleModal} samplesList={samplesList} labDetails={laboratoryList?.object?.find((item) => item.testKey === test.testKey)} saveTest={saveTest} fetchTest={fetchTest} test={test} setTest={setTest} />
            <ChatModal open={openNoteModal} setOpen={setOpenNoteModal} handleSendMessage={handleSendMessage} title={"Comments"} list={messagesList?.object} fieldShowName={'notes'} />
            <CancellationModal open={openRejectedModal} setOpen={setOpenRejectedModal} fieldName='rejectedReason' handleCancle={handleRejectedTest} object={test} setObject={setTest} fieldLabel={"Reject Reason"} title="Reject" />
        </Panel>
    );
});
export default Tests;