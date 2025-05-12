import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { ApDiagnosticOrders, ApDiagnosticOrderTests, ApDiagnosticTest } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import {
    faLandMineOn,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DocPassIcon from '@rsuite/icons/DocPass';
import React, { useEffect, useState } from 'react';
import { GrTestDesktop } from "react-icons/gr";
import { MdModeEdit } from 'react-icons/md';
import {
    Checkbox, Divider,
    Row,
    SelectPicker
} from 'rsuite';
import './styles.less';


import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import {
    useGetDiagnosticOrderQuery,
    useGetDiagnosticOrderTestQuery,
    useSaveDiagnosticOrderMutation,
    useSaveDiagnosticOrderTestMutation
} from '@/services/encounterService';
import { newApDiagnosticOrders, newApDiagnosticOrderTests, newApDiagnosticTest } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import CheckIcon from '@rsuite/icons/Check';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import PlusIcon from '@rsuite/icons/Plus';
import DetailsModal from './DetailsModal';
import TestDropdown from './TestDropdown';

const DiagnosticsOrder = ({ edit, patient, encounter }) => {

    const dispatch = useAppDispatch();
    const [showCanceled, setShowCanceled] = useState(true);
    const [test, setTest] = useState<ApDiagnosticTest>({ ...newApDiagnosticTest });
    const [flag, setFlag] = useState(false);
    const [listOrderRequest, setListOrderRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient.key
            },
            {
                fieldName: 'visit_key',
                operator: 'match',
                value: encounter.key
            }
        ]
    });
    const [listOrdersRequest, setListOrdersRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient.key
            },
            {
                fieldName: 'visit_key',
                operator: 'match',
                value: encounter.key
            },
            {
                fieldName: 'is_valid',
                operator: 'match',
                value: showCanceled
            }
        ]
    });
    const [orders, setOrders] = useState<ApDiagnosticOrders>({ ...newApDiagnosticOrders });

    const [orderTest, setOrderTest] = useState<ApDiagnosticOrderTests>({ ...newApDiagnosticOrderTests, processingStatusLkey: '6055029972709625' });
    const [listOrdersTestRequest, setListOrdersTestRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient.key
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
    const { data: ordersList, refetch: ordersRefetch } = useGetDiagnosticOrderQuery(listOrdersRequest);
    const { data: orderTestList, refetch: orderTestRefetch, isLoading: loadTests } = useGetDiagnosticOrderTestQuery({ ...listOrdersTestRequest });
    const [saveOrders, saveOrdersMutation] = useSaveDiagnosticOrderMutation();
    const [saveOrderTests, saveOrderTestsMutation] = useSaveDiagnosticOrderTestMutation();
    const [openDetailsModel, setOpenDetailsModel] = useState(false);
    const [openConfirmDeleteModel, setConfirmDeleteModel] = useState(false);



    const [isdraft, setIsDraft] = useState(false);
    const isSelected = rowData => {
        if (rowData && orderTest && rowData.key === orderTest.key) {
            return 'selected-row';
        } else return '';
    };
    const filteredOrders = ordersList?.object?.filter(
        (item) => item.statusLkey === "1804482322306061"
    ) ?? [];
    // Effects
    useEffect(() => {
        const draftOrder = ordersList?.object?.find((order) => order.saveDraft === true);
        if (draftOrder != null) {
            setIsDraft(true);
            setOrders({ ...draftOrder });
        }
    }, [ordersList]);

    useEffect(() => {

        setListOrdersTestRequest({
            ...initialListRequest,
            filters: [
                {
                    fieldName: 'patient_key',
                    operator: 'match',
                    value: patient.key
                },
                {
                    fieldName: 'visit_key',
                    operator: 'match',
                    value: encounter.key
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
                value: patient.key
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
  



    const OpenDetailsModel = () => {
        setOpenDetailsModel(true);
    }

    const OpenConfirmDeleteModel = () => {
        setConfirmDeleteModel(true);
    }
    const CloseConfirmDeleteModel = () => {
        setConfirmDeleteModel(false);
    }
    const handleSaveTest = async () => {
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
                patientKey: patient.key,
                visitKey: encounter.key,
                orderKey: orders.key,
                testKey: test.key,
                statusLkey: "164797574082125",
                processingStatusLkey: '6055029972709625',
                orderTypeLkey: test.testTypeLkey


            }).unwrap();
            dispatch(notify({msg:'Saved  Successfully' ,sev:"success"}));

            orderTestRefetch();
            setFlag(true);
        }
        catch (error) {

            console.error("Encounter save failed:", error);
            dispatch(notify({msg:'Save Failed',sev:"error"}));
        }
    };
    const handleSaveOrders = async () => {
        if (patient && encounter) {
            try {
                const response = await saveOrders({
                    ...newApDiagnosticOrders,
                    patientKey: patient.key,
                    visitKey: encounter.key,
                    statusLkey: "164797574082125",
                    labStatusLkey: "6055029972709625",
                    radStatusLkey: "6055029972709625",
                });


                dispatch(notify('Start New Order whith ID:' + response?.data?.orderId));
                setOrders(response?.data);

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
        setIsDraft(false);

        await ordersRefetch();

        orderTestRefetch().then(() => "");
        setOrders({ ...newApDiagnosticOrders });
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

    const tableColumns = [
        {
            key: 'check',
            title: <Translate>#</Translate>,
            flexGrow: 1,
            fullText: true,
            render: rowData => (
                <Checkbox
                    key={rowData.id}
                    checked={selectedRows.includes(rowData)}
                    onChange={() => handleCheckboxChange(rowData)}
                    disabled={rowData.statusLvalue?.lovDisplayVale !== 'New'}
                />
            )
        },
        {
            key: 'orderTypeLkey',
            title: <Translate>Order Type</Translate>,
            flexGrow: 1,
            fullText: true,
            render: rowData => {
              
                return rowData.test?.testTypeLvalue?.lovDisplayVale?? "";
            }
        },
        {
            key: 'test',
            title: <Translate>Test Name</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData => rowData.test.testName // or wrap in <span> if needed
        }
        ,
        {
            key: "internalCode",
            dataKey: "internalCode",
            title: <Translate>Internal Code</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData => rowData.test.internalCode

        }
        ,
        {
            key: "statusLkey",
            dataKey: "statusLkey",
            title: <Translate>Status</Translate>,
            flexGrow: 1,
            fullText: true,
            render: rowData => rowData.statusLvalue ? rowData.statusLvalue.lovDisplayVale : rowData.statusLkey

        }
        ,

        {
            key: " ",

            title: <Translate>International Coding</Translate>,
            flexGrow: 2,
            render: rowData => {

                return (
                    <>
                        <span>{rowData.test.internationalCodeOne}</span>
                        <br />

                        <span>{rowData.test.internationalCodeTwo}</span>

                        <br />
                        <span>{rowData.test.internationalCodeThree}</span>
                    </>
                );
            }


        }
        ,
        {
            key: "receivedLabkey ",
            dataKey: "receivedLabkey ",
            title: <Translate>Received Lab</Translate>,
            fullText: true,
            flexGrow: 1,
        }
        ,
        {
            key: "processingStatusLkey",
            dataKey: "processingStatusLkey",
            title: <Translate>Processing Status</Translate>,
            flexGrow: 1,
            fullText: true,
            render: rowData => rowData.processingStatusLvalue ? rowData.processingStatusLvalue?.lovDisplayVale : rowData.processingStatusLkey

        }
        ,
        {
            key: "reasonLkey",
            dataKey: "reasonLkey",
            title: <Translate>Reason</Translate>,
            flexGrow: 1,
            fullText: true,
            render: rowData => rowData.reasonLkey ? rowData.reasonLvalue?.lovDisplayVale : rowData.reasonLkey

        }
        ,
        {
            key: "priorityLkey",
            dataKey: "priorityLkey",
            title: <Translate>Reason</Translate>,
            flexGrow: 1,
            fullText: true,
            render: rowData => rowData.priorityLvalue ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey

        }
        ,
        {
            key: "notes",
            dataKey: "notes ",
            title: <Translate>Notes</Translate>,
            fullText: true,
            flexGrow: 1,
        }
        ,
        {
            key: "submitDate",
            dataKey: "submitDate",
            title: <Translate>Submit Date</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData => rowData.submitDate ? new Date(rowData.submitDate).toLocaleString() : ""

        }
        ,
        {
            key: "details",

            title: <Translate>Add details</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData => {
                return (<MdModeEdit
                    title="Edit"
                    size={24}
                    fill="var(--primary-gray)"
                    onClick={OpenDetailsModel}
                />)
            }

        }
    ];


    return (
        <>
            <div style={{ marginLeft: '10px', padding: '5px' }}>
                <div className='top-container'>

                    <SelectPicker

                        style={{ width: 250 }}
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

                    <div className='buttons-sect'>
                        <MyButton

                            onClick={handleSaveOrders}
                            disabled={!edit? isdraft:true}
                            prefixIcon={() => <PlusIcon />}
                        >New Order</MyButton>
                        <MyButton
                        prefixIcon={()=> <FontAwesomeIcon icon={faLandMineOn}    />}
                            onClick={() =>
                                setOrders({ ...orders, isUrgent: !orders.isUrgent })
                            }
                           backgroundColor={orders.isUrgent?"var(--primary-orange)":'var(--primary-blue)'}
                           disabled={!edit?!orderTest.key:true}

                        >
                          Urgent</MyButton>

                        <MyButton
                            onClick={handleSubmitPres}
                            disabled={orders.key ? orders.statusLkey === '1804482322306061' : true}
                            prefixIcon={() => <CheckIcon />}
                        >
                            <Translate>Submit</Translate>
                        </MyButton>


                        {
                            !isdraft &&
                            <MyButton
                                onClick={saveDraft}
                                postfixIcon={() => <DocPassIcon />}
                                disabled={orders.key ? orders.statusLkey === '1804482322306061' : true}
                            >
                                <Translate> Save draft</Translate>
                            </MyButton>

                        }
                        {
                            isdraft &&
                            <MyButton
                                appearance="ghost"
                                onClick={cancleDraft}
                                postfixIcon={() => <DocPassIcon />}
                                disabled={orders.key ? orders.statusLkey === '1804482322306061' : true}
                            >
                                <Translate> Cancle draft </Translate>
                            </MyButton>

                        }
                    </div>
                </div>

                <Row>
                    <Divider />
                </Row>
                <Row>

                    <div className='top-container'>

                        <TestDropdown handleItemClick={handleItemClick} disabled={orders.key == null} flag={flag} />
                        <div className='icon-style'>
                            <GrTestDesktop size={18} />
                        </div>
                        <div>
                            <div className='prescripton-word-style'>Order</div>
                            <div className='prescripton-number-style'>
                                {orders?.orderId || "_"}
                            </div>
                        </div>
                        <div className="buttons-sect">
                            <Checkbox
                                checked={!showCanceled}
                                disabled={orders.key == null}
                                onChange={() => {


                                    setShowCanceled(!showCanceled);
                                }}
                            >
                                Show canceled test
                            </Checkbox>
                            <MyButton
                                disabled={orders.key !== null ? selectedRows.length === 0 : true}
                                prefixIcon={() => <CloseOutlineIcon />}
                                onClick={OpenConfirmDeleteModel}
                            >Cancel</MyButton>



                        </div>
                    </div >

                </Row>
            </div>
            <Row >   </Row>
            <Row style={{ margin: '5px' }}>



                <MyTable
                    columns={tableColumns}
                    sortColumn={listOrderRequest.sortBy}
                    sortType={listOrderRequest.sortType}
                    loading={loadTests}
                    onSortChange={(sortBy, sortType) => {
                        setListOrderRequest({ ...listOrderRequest, sortBy, sortType });
                    }}



                    data={orderTestList?.object ?? []}
                    onRowClick={rowData => {
                        setOrderTest(rowData);
                        setTest(rowData.test);

                    }}
                    rowClassName={isSelected}
                />
            </Row>

            <DetailsModal
                order={orders}
                test={test}
                openDetailsModel={openDetailsModel}
                setOpenDetailsModel={setOpenDetailsModel}
                orderTest={orderTest}
                setOrderTest={setOrderTest}
                handleSaveTest={handleSaveTest} />

            <DeletionConfirmationModal
                open={openConfirmDeleteModel}
                setOpen={setOpenDetailsModel}
                itemToDelete="Test"
                actionButtonFunction={handleCancle}

            />
        </>
    );
};

export default DiagnosticsOrder;
