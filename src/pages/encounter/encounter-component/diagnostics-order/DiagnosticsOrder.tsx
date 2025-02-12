import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import './styles.less';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import DocPassIcon from '@rsuite/icons/DocPass';
import {
    InputGroup,
    Form,
    Input,
    Panel,
    Text,
    Checkbox,
    Dropdown,
    Button,
    IconButton,
    Table,
    Modal,
    Stack,
    Divider,
    Row,
    Col,
    SelectPicker
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { ApDiagnosticOrders, ApDiagnosticOrderTests, ApDiagnosticTest, ApPatientEncounterOrder } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import {
    useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import {
    useFetchAttachmentQuery,
    useFetchAttachmentLightQuery,
    useFetchAttachmentByKeyQuery,
    useUploadMutation,
    useDeleteAttachmentMutation,
    useUpdateAttachmentDetailsMutation
} from '@/services/attachmentService';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CheckIcon from '@rsuite/icons/Check';
import PlusIcon from '@rsuite/icons/Plus';
import OthersIcon from '@rsuite/icons/Others';
import RemindOutlineIcon from '@rsuite/icons/RemindOutline';
import AttachmentModal from "@/pages/patient/patient-profile/AttachmentUploadModal";
import {
    useGetDiagnosticsTestListQuery
} from '@/services/setupService';
import {
    useSavePatientEncounterOrderMutation,
    useGetPatientEncounterOrdersQuery,
    useRemovePatientEncounterOrderMutation,
    useGetDiagnosticOrderQuery,
    useGetDiagnosticOrderTestQuery,
    useSaveDiagnosticOrderMutation,
    useSaveDiagnosticOrderTestMutation
} from '@/services/encounterService';
import SearchIcon from '@rsuite/icons/Search';
import MyInput from '@/components/MyInput';
import { initialListRequest, ListRequest } from '@/types/types';
import { newApDiagnosticOrders, newApDiagnosticOrderTests, newApDiagnosticTest, newApPatientEncounterOrder } from '@/types/model-types-constructor';
import { isValid } from 'date-fns';
const DiagnosticsOrder = ({ edit }) => {
    const patientSlice = useAppSelector(state => state.patient);
    const dispatch = useAppDispatch();
    const [showCanceled, setShowCanceled] = useState(true);
    const [order, setOrder] = useState<ApPatientEncounterOrder>({ ...newApPatientEncounterOrder });
    const [test, setTest] = useState<ApDiagnosticTest>({ ...newApDiagnosticTest });
    const [searchKeyword, setSearchKeyword] = useState('');
    const [listTestRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const [listOrderRequest, setListOrderRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patientSlice.patient.key
            },
            {
                fieldName: 'visit_key',
                operator: 'match',
                value: patientSlice.encounter.key
            }
        ]
    });
    const [listOrdersRequest, setListOrdersRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patientSlice.patient.key
            },
            {
                fieldName: 'visit_key',
                operator: 'match',
                value: patientSlice.encounter.key
            },
            {
                fieldName: 'is_valid',
                operator: 'match',
                value: showCanceled
            }
        ]
    });
    const [orders, setOrders] = useState<ApDiagnosticOrders>({ ...newApDiagnosticOrders });
    const [orderTest, setOrderTest] = useState<ApDiagnosticOrderTests>({ ...newApDiagnosticOrderTests });
    const [listOrdersTestRequest, setListOrdersTestRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patientSlice.patient.key
            },
            {
                fieldName: 'order_key',
                operator: 'match',
                value: orders.key || undefined
            },
            {
                fieldName: 'is_valid',
                operator: 'match',
                value: showCanceled
            }
        ]
    });
    const [selectedRows, setSelectedRows] = useState([]);
    const { data: testsList } = useGetDiagnosticsTestListQuery(listTestRequest);
    const { data: ordersList, refetch: ordersRefetch } = useGetDiagnosticOrderQuery(listOrdersRequest);
    const { data: orderTestList, refetch: orderTestRefetch } = useGetDiagnosticOrderTestQuery({ ...listOrdersTestRequest });


    const [savePatientOrder, savePatientOrderMutation] = useSavePatientEncounterOrderMutation();
    const [saveOrders, saveOrdersMutation] = useSaveDiagnosticOrderMutation();
    const [saveOrderTests, saveOrderTestsMutation] = useSaveDiagnosticOrderTestMutation();
    const [deleteOrder, deleteOrderMutation] = useRemovePatientEncounterOrderMutation();
    const [openDetailsModel, setOpenDetailsModel] = useState(false);
    const [openConfirmDeleteModel, setConfirmDeleteModel] = useState(false);
    const [actionType, setActionType] = useState(null);
    const { data: orderPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
    const { data: ReasonLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_ORD_REASON');
    const { data: departmentTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DEPARTMENT-TYP');
    const [newAttachmentDetails, setNewAttachmentDetails] = useState('');
    const { data: fetchPatintAttachmentsResponce, refetch: attachmentRefetch } =
        useFetchAttachmentLightQuery({ refKey: order?.key }, { skip: !order?.key });
    const [requestedPatientAttacment, setRequestedPatientAttacment] = useState();
    const fetchOrderAttachResponse = useFetchAttachmentQuery(
        {
            type: 'ORDER_ATTACHMENT',
            refKey: order.key
        },
        { skip: !order.key }
    );
    const {
        data: fetchAttachmentByKeyResponce,
        error,
        isLoading,
        isFetching,
        isSuccess,
        refetch
    } = useFetchAttachmentByKeyQuery(
        { key: requestedPatientAttacment },
        { skip: !requestedPatientAttacment || !order.key }
    );
    const [isdraft, setIsDraft] = useState(false);
    const isSelected = rowData => {
        if (rowData && order && rowData.key === order.key) {
            return 'selected-row';
        } else return '';
    };
    const filteredOrders = ordersList?.object?.filter(
        (item) => item.statusLkey === "1804482322306061"
    ) ?? [];
    useEffect(() => {
        const draftOrder = ordersList?.object?.find((order) => order.saveDraft === true);
        console.log(ordersList?.object)
        console.log(draftOrder);
        if (draftOrder != null) {
            setIsDraft(true);
            setOrders({ ...draftOrder });
        }
    }, [ordersList]);
    useEffect(() => {
        console.log("test", test)
    }, [test])
    useEffect(() => {
        if (searchKeyword.trim() !== "") {
            setListRequest(
                {
                    ...initialListRequest,

                    filters: [
                        {
                            fieldName: 'test_name',
                            operator: 'containsIgnoreCase',
                            value: searchKeyword
                        }

                    ]
                }
            );
        }
    }, [searchKeyword]);

    useEffect(() => {

        setListOrdersTestRequest({
            ...initialListRequest,
            filters: [
                {
                    fieldName: 'patient_key',
                    operator: 'match',
                    value: patientSlice.patient.key
                },
                {
                    fieldName: 'visit_key',
                    operator: 'match',
                    value: patientSlice.encounter.key
                },
                {
                    fieldName: 'is_valid',
                    operator: 'match',
                    value: showCanceled
                }
            ]
        })
    }, [showCanceled]);

    useEffect(() => {
        const updatedFilters = [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patientSlice.patient.key
            },
            {
                fieldName: 'order_key',
                operator: 'match',
                value: orders.key || undefined
            },
            {
                fieldName: 'is_valid',
                operator: 'match',
                value: showCanceled
            }
        ];

        setListOrdersTestRequest((prevRequest) => ({

            ...prevRequest,
            filters: updatedFilters,

        }));

    }, [orders])
    useEffect(() => {
        console.log("iam in useefect download")
        if (isSuccess && fetchAttachmentByKeyResponce) {
            if (actionType === 'download') {
                handleDownload(fetchAttachmentByKeyResponce);
            }
        }
    }, [requestedPatientAttacment, fetchAttachmentByKeyResponce, actionType]);
    const handleDownload = async (attachment) => {
        try {
            if (!attachment?.fileContent || !attachment?.contentType || !attachment?.fileName) {
                console.error("Invalid attachment data.");
                return;
            }

            const byteCharacters = atob(attachment.fileContent);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: attachment.contentType });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = attachment.fileName;

            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            console.log("File downloaded successfully:", attachment.fileName);
            attachmentRefetch().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });
        } catch (error) {
            console.error("Error during file download:", error);
        }
    };
    const handleDownloadSelectedPatientAttachment = attachmentKey => {

        setRequestedPatientAttacment(attachmentKey);
        setActionType('download');

    };


    const handleSearch = value => {
        setSearchKeyword(value);


    };
    const handleFilterChange = (fieldName, value) => {
        if (value) {
            setListRequest(
                addFilterToListRequest(
                    fromCamelCaseToDBName(fieldName),
                    'containsIgnoreCase',
                    value,
                    listRequest
                )
            );
        } else {
            setListRequest({ ...listRequest, filters: [] });
        }
    };
    const OpenDetailsModel = () => {
        setOpenDetailsModel(true);
    }
    const CloseDetailsModel = () => {
        setOpenDetailsModel(false);
    }
    const OpenConfirmDeleteModel = () => {
        setConfirmDeleteModel(true);
    }
    const CloseConfirmDeleteModel = () => {
        setConfirmDeleteModel(false);
    }
    const handleSaveOrder = async () => {
        try {
            await saveOrderTests(orderTest).unwrap();
            setOpenDetailsModel(false);
            dispatch(notify('saved  Successfully'));

            orderTestRefetch().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });

        }
        catch (error) {


            dispatch(notify('Save Failed'));
        }

    }
    const handleCheckboxChange = (key) => {
        setSelectedRows((prev) => {
            if (prev.includes(key)) {
                return prev.filter(item => item !== key);
            } else {
                return [...prev, key];
            }
        });
    };
    const handleSubmit = async () => {
        console.log(selectedRows);

        try {
            await Promise.all(
                selectedRows.map(item => savePatientOrder({ ...item, submitDate: Date.now(), statusLkey: '1804482322306061' }).unwrap())
            );

            dispatch(notify('All orders saved successfully'));


            setSelectedRows([]);
        } catch (error) {
            console.error("Encounter save failed:", error);
            dispatch(notify('One or more saves failed'));
        }
    };


    // new Date().toISOString()
    const handleCancle = async () => {

        try {
            await Promise.all(
                selectedRows.map(item => saveOrderTests({ ...item, statusLkey: '1804447528780744', isValid: false }).unwrap())
            );

            dispatch(notify({ msg: 'All orders deleted successfully', sev: 'success' }));

            orderTestRefetch().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });
            setSelectedRows([]);
            CloseConfirmDeleteModel();
        } catch (error) {
            console.error("Encounter save failed:", error);
            dispatch(notify({ msg: 'One or more deleted failed', sev: 'error' }));
            CloseConfirmDeleteModel();
        }
    };
    const handleItemClick = async (test) => {

        try {
            await saveOrderTests({
                ...ordersList,
                patientKey: patientSlice.patient.key,
                visitKey: patientSlice.encounter.key,
                orderKey: orders.key,
                testKey: test.key,

                statusLkey: "164797574082125",
                processingStatusLkey:"6053140045975671"

            }).unwrap();
            dispatch(notify('saved  Successfully'));

            orderTestRefetch().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });
            setSearchKeyword("");
        }
        catch (error) {

            console.error("Encounter save failed:", error);
            dispatch(notify('Save Failed'));
        }
    };
    const handleSaveOrders = async () => {
        // handleCleare();
        // setPreKey(null);
        // setPrescription(null);

        if (patientSlice.patient && patientSlice.encounter) {
            try {

                const response = await saveOrders({
                    ...newApDiagnosticOrders,
                    patientKey: patientSlice.patient.key,
                    visitKey: patientSlice.encounter.key,
                    statusLkey: "164797574082125",
                });


                dispatch(notify('Start New Order whith ID:' + response?.data?.orderId));

                // setPreKey(response?.data?.key);
                setOrders(response?.data);
                // preRefetch().then(() => "");

            } catch (error) {
                console.error("Error saving prescription:", error);
            }
        } else {
            console.warn("Patient or encounter is missing. Cannot save prescription.");
        }
    };
    const handleSubmitPres = async () => {
        try {
            await saveOrders({
                ...orders,

                statusLkey: "1804482322306061"
                , saveDraft: false,
                submittedAt: Date.now()
            }).unwrap();
            dispatch(notify('submetid  Successfully'));
            ordersRefetch();
            orderTestRefetch(); 

        }
        catch (error) {
            console.error("Error saving :", error);
        }

        orderTestList?.object?.map((item) => {
            saveOrderTests({ ...item, statusLkey: "1804482322306061", submitDate: Date.now() })
        })
        orderTestRefetch().then(() => "");



    }
    const saveDraft = async () => {
        try {
            saveOrders({ ...orders, saveDraft: true }).unwrap().then
                (() => {
                    setIsDraft(true);
                    dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
                })
        }
        catch (error) {

        }
    }
    const cancleDraft = async () => {
        try {
            saveOrders({ ...orders, saveDraft: false }).unwrap().then
                (() => {
                    setIsDraft(false);
                    dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
                })
        }
        catch (error) {

        }
    }
    return (
        <>
            <div style={{ marginLeft: '10px', padding: '5px', border: '1px solid #b6b7b8' }}>
                <Row style={{ paddingTop: '10px' }}>
                    <Col xs={6}>
                        <SelectPicker

                            style={{ width: '100%' }}
                            data={filteredOrders ?? []}
                            labelKey="orderId"
                            valueKey="key"
                            placeholder="orders"

                            value={orders.key ?? null}
                            onChange={(value) => {
                                const selectedItem = filteredOrders.find(item => item.key === value) || newApDiagnosticOrders;
                                setOrders(selectedItem);
                            }}

                        />
                    </Col>
                    <Col xs={8}>   <Text>Current Prescription ID : {orders.orderId}</Text></Col>
                    <Col xs={2}></Col>
                    <Col xs={3} >
                        {
                            !isdraft &&
                            <IconButton
                                color="cyan"
                                appearance="primary"
                                onClick={saveDraft}
                                icon={<DocPassIcon />}
                                disabled={orders.key ? orders.statusLkey === '1804482322306061' : true}
                            >
                                <Translate> Save draft</Translate>
                            </IconButton>

                        }
                        {
                            isdraft &&
                            <IconButton
                                color="red"
                                appearance="primary"
                                onClick={cancleDraft}
                                icon={<DocPassIcon />}
                                disabled={orders.key ? orders.statusLkey === '1804482322306061' : true}
                            >
                                <Translate> Cancle draft </Translate>
                            </IconButton>

                        }</Col>

                    <Col xs={2}>
                        <IconButton
                            color="cyan"
                            appearance="primary"
                            onClick={handleSubmitPres}
                            disabled={orders.key ? orders.statusLkey === '1804482322306061' : true}
                            icon={<CheckIcon />}
                        >
                            <Translate>Submit</Translate>
                        </IconButton>
                    </Col>
                    <Col xs={3}>

                        <IconButton
                            color="cyan"
                            appearance="ghost"
                            onClick={handleSaveOrders}
                            disabled={isdraft}
                            style={{ marginLeft: 'auto' }}
                            // className={edit ? "disabled-panel" : ""}
                            icon={<PlusIcon />}
                        >
                            <Translate>New Order</Translate>
                        </IconButton>
                    </Col>
                </Row>
                <Row>
                    <Divider />
                </Row>
                <Row>
                    <Col xs={24}>
                        <div className='top-container'>

                            <div className='form-search-container '>
                                <Form>
                                    <Text>Add test</Text>
                                    <InputGroup inside className='input-search'>
                                        <Input
                                            disabled={orders.key == null}
                                            placeholder={'Search Test '}
                                            value={searchKeyword}
                                            onChange={handleSearch}
                                        />
                                        <InputGroup.Button>
                                            <SearchIcon />
                                        </InputGroup.Button>
                                    </InputGroup>
                                    {searchKeyword && (
                                        <Dropdown.Menu className="dropdown-menuresult">
                                            {testsList && testsList?.object?.map(test => (
                                                <Dropdown.Item
                                                    key={test.key}
                                                    eventKey={test.key}
                                                    onClick={() => handleItemClick(test)}

                                                >
                                                    <span style={{ marginRight: "19px" }}>{test.testName}</span>
                                                    <span>{test.testTypeLvalue.lovDisplayVale}</span>
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    )}
                                    <Checkbox
                                        checked={!showCanceled}
                                        disabled={orders.key == null}
                                        onChange={() => {


                                            setShowCanceled(!showCanceled);
                                        }}
                                    >
                                        Show canceled test
                                    </Checkbox>

                                </Form>

                            </div>

                            <div className='space-container'></div>

                            <div className="buttons-sect">

                                <IconButton
                                    color="cyan"
                                    appearance="primary"
                                    onClick={OpenConfirmDeleteModel}
                                    icon={<CloseOutlineIcon />}
                                    disabled={orders.key !== null ? selectedRows.length === 0 : true}
                                >
                                    <Translate>Cancel</Translate>
                                </IconButton>


                            </div>
                        </div >
                    </Col>
                </Row>
            </div>
            <Row >   </Row>
            <Row style={{ marginLeft: '10px' }}>
                <Table
                    height={400}
                    sortColumn={listOrderRequest.sortBy}
                    sortType={listOrderRequest.sortType}
                    onSortColumn={(sortBy, sortType) => {
                        if (sortBy)
                            setListRequest({
                                ...listOrderRequest,
                                sortBy,
                                sortType
                            });
                    }}
                    headerHeight={80}
                    rowHeight={60}
                    bordered
                    cellBordered

                    data={orderTestList?.object ?? []}
                    onRowClick={rowData => {
                        setOrderTest(rowData);
                        setTest(rowData.test);
                        console.log(fetchPatintAttachmentsResponce)
                    }}
                    rowClassName={isSelected}
                >
                    <Column flexGrow={1}>
                        <HeaderCell align="center">

                            <Translate>#</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => (
                                <Checkbox
                                    key={rowData.id}
                                    checked={selectedRows.includes(rowData)}
                                    onChange={() => handleCheckboxChange(rowData)}
                                    disabled={rowData.statusLvalue?.lovDisplayVale !== 'New'}
                                />
                            )}
                        </Cell>


                    </Column>
                    <Column flexGrow={2}>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('orderType', e)} />
                            <Translate>Order Type</Translate>
                        </HeaderCell>
                        <Cell dataKey="orderTypeLkey">
                            {rowData => {

                                const matchedTest = testsList?.object?.find(item => item.testTypeLkey === rowData.test.testTypeLkey);

                                return matchedTest ? matchedTest.
                                    testTypeLvalue
                                    .lovDisplayVale : "";
                            }}
                        </Cell>

                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('TestName', e)} />
                            <Translate>Test Name</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => rowData.test.testName}

                        </Cell>
                    </Column>
                    <Column flexGrow={2}>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('InternalCode', e)} />
                            <Translate>Internal Code</Translate>
                        </HeaderCell>
                        <Cell dataKey="internalCode" >
                            {rowData => rowData.test.internalCode}
                        </Cell>

                    </Column>
                    <Column flexGrow={2}>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('statusLkey', e)} />
                            <Translate>Status</Translate>
                        </HeaderCell>
                        <Cell  >
                            {rowData => rowData.statusLvalue.lovDisplayVale}
                        </Cell>
                    </Column>
                    <Column flexGrow={3}>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('InternationalCoding', e)} />
                            <Translate>International Coding</Translate>
                        </HeaderCell>
                        <Cell >
                            {rowData =>
                                rowData.test.internationalCodeOne
                            } <br />
                            {rowData =>
                                rowData.test.internationalCodeTwo
                            }

                            {rowData =>
                                rowData.test.internationalCodeThree
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={2}>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('receivedLabLkey', e)} />
                            <Translate>Received Lab</Translate>
                        </HeaderCell>
                        <Cell  >
                            {rowData => rowData.receivedLabLvalue?.lovDisplayVale || ""}
                        </Cell>
                    </Column>
                    <Column flexGrow={2}>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('reasonLkey', e)} />
                            <Translate>Reason </Translate>
                        </HeaderCell>
                        <Cell >{rowData => rowData.reasonLvalue?.lovDisplayVale || ""}</Cell>
                    </Column>
                    <Column flexGrow={2}>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('priorityLkey', e)} />
                            <Translate>Priority</Translate>
                        </HeaderCell>
                        <Cell >{rowData => rowData.priorityLvalue?.lovDisplayVale || ''}
                        </Cell>
                    </Column>
                    <Column flexGrow={2}>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('notes', e)} />
                            <Translate>Notes</Translate>
                        </HeaderCell>
                        <Cell dataKey="notes" />
                    </Column>

                    <Column flexGrow={3}>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('createdAt', e)} />
                            <Translate>Submit Date</Translate>
                        </HeaderCell>
                        <Cell >
                            {rowData => rowData.submitDate ? new Date(rowData.submitDate).toLocaleString() : ""}

                        </Cell>
                    </Column>
                    <Column flexGrow={2}>
                        <HeaderCell align="center">

                            <Translate>Add details</Translate>
                        </HeaderCell>
                        <Cell  >
                            <IconButton onClick={OpenDetailsModel} icon={<OthersIcon />} />
                        </Cell>
                    </Column>
                </Table>
            </Row>
            <Modal open={openDetailsModel} onClose={CloseDetailsModel} overflow>
                <Modal.Title>
                    <Translate>Add Test Details</Translate>
                </Modal.Title>
                <Modal.Body>
                    <div className='form-search-container '>
                        <div>
                            <Form layout="inline" fluid>
                                <Input
                                  style={{width:150}}
                                    disabled={true}
                                  
                                    value={test?.testTypeLvalue?.lovDisplayVale}
                                />

                                <Input

                                    disabled={true}
                                    style={{width:150}}
                                    value={test?.testName}
                                />

                            </Form>
                        </div>
                        <div>
                            <Form layout="inline" fluid disabled={orderTest.statusLkey !== '164797574082125'}>

                                <MyInput
                                    column

                                    width={150}
                                    fieldType="select"
                                    fieldLabel="Order Priority"
                                    selectData={orderPriorityLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'priorityLkey'}
                                    record={orderTest}
                                    setRecord={setOrderTest}
                                />
                                <MyInput
                                    column

                                    width={150}
                                    fieldType="select"
                                    fieldLabel="Reason"
                                    selectData={ReasonLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'reasonLkey'}
                                    record={orderTest}
                                    setRecord={setOrderTest}
                                />
                                <MyInput
                                    column

                                    width={150}
                                    fieldType="select"
                                    fieldLabel="Received Lab"
                                    selectData={departmentTypeLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'receivedLabLkey'}
                                    record={orderTest}
                                    setRecord={setOrderTest}
                                />
                            </Form>
                        </div>
                        <div>
                            <Form layout="inline" fluid disabled={orderTest.statusLkey !== '164797574082125'}>
                                <MyInput
                                    column
                                    rows={3}
                                    width={150}

                                    fieldName={'notes'}
                                    record={orderTest}
                                    setRecord={setOrderTest}
                                />



                                <IconButton
                                    style={{ marginTop: "20px", paddingTop: "10px" }}
                                    color="cyan"
                                    appearance="primary"
                                    icon={<PlusIcon />}
                                    disabled={orderTest.statusLkey !== '164797574082125'}
                                    onClick={() => setAttachmentsModalOpen(true)}
                                >
                                    <Translate>Attached File</Translate>
                                </IconButton>
                                <Button
                                    style={{ marginTop: "20px" }}
                                    appearance="link"
                                    onClick={() => handleDownloadSelectedPatientAttachment(fetchOrderAttachResponse.data.key)}
                                >
                                    Download <FileDownloadIcon style={{ marginLeft: '10px', scale: '1.4' }} />
                                </Button>
                                <AttachmentModal isOpen={attachmentsModalOpen} onClose={() => setAttachmentsModalOpen(false)} localPatient={order} attatchmentType={'ORDER_ATTACHMENT'} />


                            </Form>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Stack spacing={2} divider={<Divider vertical />}>
                        <Button appearance="primary" disabled={orderTest.statusLkey !== '164797574082125'} onClick={handleSaveOrder}>
                            Save
                        </Button>
                        <Button appearance="ghost" color="cyan" onClick={CloseDetailsModel}>
                            Cancel
                        </Button>
                    </Stack>
                </Modal.Footer>
            </Modal>


            <Modal open={openConfirmDeleteModel} onClose={CloseConfirmDeleteModel} overflow  >
                <Modal.Title>
                    <Translate><h6>Confirm Delete</h6></Translate>
                </Modal.Title>
                <Modal.Body>
                    <p>
                        <RemindOutlineIcon style={{ color: '#ffca61', marginRight: '8px', fontSize: '24px' }} />
                        <Translate style={{ fontSize: '24px' }} >
                            Are you sure you want to delete this orders?
                        </Translate>
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Stack spacing={2} divider={<Divider vertical />}>
                        <Button appearance="primary" onClick={handleCancle}>
                            Delete
                        </Button>
                        <Button appearance="ghost" color="cyan" onClick={CloseConfirmDeleteModel}>
                            Cancel
                        </Button>
                    </Stack>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default DiagnosticsOrder;
