import React, { useEffect, useState } from 'react';
import {
    useDeactiveActivVaccineBrandsMutation,
    useGetDepartmentsQuery,
    useGetIcdListQuery,
    useGetLovValuesByCodeQuery,
    useGetProductQuery,
    useGetVaccineBrandsListQuery,
    useGetWarehouseQuery,
    useSaveVaccineBrandMutation,
    useSaveVaccineMutation
} from '@/services/setupService';
import SearchIcon from '@rsuite/icons/Search';
import MyInput from '@/components/MyInput';
import { Dropdown, Form } from 'rsuite';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { MdVaccines } from 'react-icons/md';
import { MdMedication } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { initialListRequest, ListRequest } from '@/types/types';
import MyButton from '@/components/MyButton/MyButton';
import { ApInventoryTransferProduct } from '@/types/model-types';
import { newApInventoryTransferProduct } from '@/types/model-types-constructor';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyModal from '@/components/MyModal/MyModal';
import { FaBabyCarriage, FaInbox, FaProductHunt } from 'react-icons/fa6';
import { useConfirmTransProductStockInMutation, useGetInventoryTransactionsProductQuery, useGetInventoryTransferProductQuery, useSaveInventoryTransactionMutation, useSaveInventoryTransactionProductMutation, useSaveInventoryTransferMutation, useSaveInventoryTransferProductMutation } from '@/services/inventoryTransactionService';
import { create, set } from 'lodash';
import authSlice from '@/reducers/authSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIdCard, faInbox, faList, faListCheck, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import ProductList from './ProductList';
import AddEditProduct from './AddEditProduct';

const AddEditTransfer = ({ open, setOpen, transfer, setTransfer, refetch }) => {
    const dispatch = useAppDispatch();
    const authSlice = useAppSelector(state => state.auth);
    const [openNextDocument, setOpenNextDocument] = useState(false);
    const [openChildModal, setOpenChildModal] = useState(false);
    const [showSubChildModal, setShowSubChildModal] = useState(false);
    const [departmentListRequest, setDepartmentListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
        ],
    });

    const [warehouseListRequest, setWarehouseListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
        ],
    });


    const [transProductListRequest, setTransProductListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
            {
                fieldName: 'transfer_key',
                operator: 'match',
                value: transfer?.key
            }
        ],
    });

    const { data: transProductListResponse, refetch: refetchTransProductList } = useGetInventoryTransferProductQuery(transProductListRequest);


    const [saveTransferProduct, saveTransferProductMutation] = useSaveInventoryTransferProductMutation();
    const [saveTransfer, saveTransferMutation] = useSaveInventoryTransferMutation();
    const [confirmProductStockIn, confirmProductStockInMutation] = useConfirmTransProductStockInMutation();

    const [transProduct, setTransProduct] = useState<ApInventoryTransferProduct>({ ...newApInventoryTransferProduct });

    const now = new Date();

    const [generateCode, setGenerateCode] = useState();
    const [recordOfTransferCode, setRecordOfTransferCode] = useState({ transNo: '' });
    // Generate code for transfer
    const generateFiveDigitCode = () => {
        const code = Math.floor(10000 + Math.random() * 90000);
        setTransfer({ ...transfer, transNo: code })
    };

    const { data: warehouseListResponse } = useGetWarehouseQuery(warehouseListRequest);


    const { data: transTypeListResponse } = useGetLovValuesByCodeQuery('STOCK_TRANSACTION_TYPES');

    const { data: transReasonInListResponse } = useGetLovValuesByCodeQuery('STOCK_IN_REASONS');

    const { data: transReasonOutListResponse } = useGetLovValuesByCodeQuery('STOCK_OUT_REASONS');

    const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);

    const [transferProductListRequest, setTransferProductListRequest] = useState<ListRequest>({
        ...initialListRequest,
        pageSize: 15,
        filters: [
            {
                fieldName: 'transfer_key',
                operator: 'match',
                value: transfer?.key
            }
        ]
    });



    // Fetch transfer product list response
    const {
        data: transferProductListResponseLoading,
        refetch: transferProductRefetch,
        isFetching: transferProductIsFetching
    } = useGetInventoryTransferProductQuery(transferProductListRequest);

    const handleSave = () => {
        saveTransfer({
            ...transfer,
            statusLkey: '6053140045975671', // Assuming '6053140045975671' is the status for 'New transfer'
            createdBy: authSlice.user.key,
            createdAt: null
        }).unwrap().then((result) => {
            setTransfer(result);
            console.log(result);
            refetch();
            setOpenNextDocument(true);
            dispatch(
                notify({
                    msg: 'The transfer Added/Edited successfully ',
                    sev: 'success'
                })
            );
        }).catch((e) => {
            if (e.status === 422) {
                console.log("Validation error: Unprocessable Entity", e);
            } else {
                console.log("An unexpected error occurred", e);
                dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
            }
        });
    };
    // const handleSave = () => {
    //     const response = saveTransaction({
    //         ...transfer,
    //         createdBy: authSlice.user.key,
    //         createdAt: null
    //     }).unwrap().then(() => {
    //         setTransfer(response );
    //         console.log(response);
    //         refetch();
    //         setOpenNextDocument(true);
    //         dispatch(
    //             notify({
    //                 msg: 'The transfer Added/Edited successfully ',
    //                 sev: 'success'
    //             })
    //         );
    //     }).catch((e) => {

    //         if (e.status === 422) {
    //             console.log("Validation error: Unprocessable Entity", e);

    //         } else {
    //             console.log("An unexpected error occurred", e);
    //             dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
    //         }
    //     });;

    // };


    // Handle Go To Patient Profile 
    const goToPatientProfile = () => {
        // setOpen(false);
        // const privatePatientPath = '/patient-profile';
        // navigate(privatePatientPath, { state: { patient: localPatient } });
        // setLocalPatient({ ...newApPatient });
        // setPatientInsurance({ ...newApPatientInsurance });
    };


    useEffect(() => {
        setTransfer({ ...transfer, createdBy: authSlice.user.username, createdAt: now.toString() });
        setOpenNextDocument(false);
    }, [transfer?.key]);

    useEffect(() => {
        setTransProductListRequest(prev => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                {
                    fieldName: 'transfer_key',
                    operator: 'match',
                    value: transfer?.key
                }
            ]
        }));
    }, [transProduct?.productKey]);


    useEffect(() => {
        if (transfer?.transNo) {
            setRecordOfTransferCode({ transNo: transfer.transNo });
            return;
        }
        generateFiveDigitCode();
        setRecordOfTransferCode({ transNo: transfer?.transNo ?? generateCode });
        console.log(recordOfTransferCode);
    }, [transfer?.transNo?.length]);

    // Main modal content
    const conjureFormContent = stepNumber => {
        switch (stepNumber) {
            case 0:
                return (
                    <Form fluid>
                        <div className='container-of-three-fields' >
                            <div className='container-of-field' >
                                <MyInput
                                    width="100%"
                                    fieldLabel="Transfer Number"
                                    fieldName="transNo"
                                    record={recordOfTransferCode}
                                    setRecord={setRecordOfTransferCode}
                                    disabled={true}
                                />
                            </div>
                            <div className='container-of-field' >
                                <MyInput
                                    width="100%"
                                    fieldLabel="From Warehouse"
                                    fieldName="fromWarehouseKey"
                                    fieldType="select"
                                    selectData={warehouseListResponse?.object ?? []}
                                    selectDataLabel="warehouseName"
                                    selectDataValue="key"
                                    record={transfer}
                                    setRecord={setTransfer}
                                />
                            </div>

                        </div>
                        <div className='container-of-three-fields' >
                            <div className='container-of-field' >
                                <MyInput
                                    width="100%"
                                    fieldLabel="To Warehouse"
                                    fieldName="toWarehouseKey"
                                    fieldType="select"
                                    selectData={warehouseListResponse?.object ?? []}
                                    selectDataLabel="warehouseName"
                                    selectDataValue="key"
                                    record={transfer}
                                    setRecord={setTransfer}
                                />
                            </div>
                            <div className='container-of-field' >

                                <MyInput
                                    width="100%"
                                    fieldLabel="Reason"
                                    fieldName="transReason"
                                    record={transfer}
                                    setRecord={setTransfer}
                                />
                            </div>
                        </div>
                        <div className='container-of-two-fields'>
                            <div className='container-of-field' >

                                <MyInput width="100%" fieldLabel="Performed By" disabled fieldName="createdBy" record={transfer} setRecord={setTransfer} />
                            </div>
                            <div className='container-of-field' >

                                <MyInput width="100%" fieldLabel="Date & Times" disabled fieldName="createdAt" record={transfer} setRecord={setTransfer} />
                            </div>
                        </div>
                        <div >

                            <MyInput
                                width="100%"
                                fieldLabel="Note"
                                fieldName="note"
                                fieldType="textarea"
                                record={transfer}
                                setRecord={setTransfer}
                            />

                        </div>

                        <br />
                        <div className="container-of-add-new-button">
                            <MyButton
                                prefixIcon={() => <AddOutlineIcon />}
                                color="var(--deep-blue)"
                                disabled={!transfer?.key && !openNextDocument}
                                onClick={() => {
                                    setOpenChildModal(true);

                                }}
                                width="109px"
                            >
                                Add Product
                            </MyButton>
                        </div>
                    </Form>
                );
            case 1:
                return (
                    <Form fluid>


                    </Form>
                );
        }
    };

    const childContent = (
        <Form fluid>
            <ProductList open={openChildModal} setOpen={setOpenChildModal} showSubChildModal={showSubChildModal} setShowSubChildModal={setShowSubChildModal} transfer={transfer} setTransfer={setTransfer} transferProductListRequest={transferProductListRequest} setTransferProductListRequest={setTransferProductListRequest} transferProductListResponseLoading={transferProductListResponseLoading} transferProductRefetch={refetchTransProductList} transferProductIsFetching={transferProductIsFetching} />
        </Form>
    );


    const subChildContent = () => {
        return (
            <AddEditProduct
                open={showSubChildModal}
                setOpen={setShowSubChildModal}
                transferProduct={transProduct}
                setTransferProduct={setTransProduct}
                transfer={transfer}
                setTransfer={setTransfer}
                refetch={refetchTransProductList}
            />
        );
    };
    const handleSaveSubchild = () => {
        const response = saveTransferProduct({
            ...transProduct,
            transferKey: transfer.key,

        }).unwrap().then((result) => {
            console.log(result)
            setTransProduct(result);
            refetchTransProductList();
            refetch();
            refetchTransProductList();
            setTransProduct({ ...newApInventoryTransferProduct, productKey: null });
            dispatch(
                notify({
                    msg: 'The Inventory Transfer Product Added/Edited successfully ',
                    sev: 'success'
                })
            );
        }).catch((e) => {

            if (e.status === 422) {
                console.log("Validation error: Unprocessable Entity", e);

            } else {
                console.log("An unexpected error occurred", e);
                dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
            }
        });;

    };

    const handleSavechild = () => {
        setOpenChildModal(false);
        confirmProductStockIn({
            key: transfer?.key
        })
            .unwrap()
            .then(() => {
                dispatch(
                    notify({
                        msg: 'The product was successfully Added to stock',
                        sev: 'success'
                    })
                );
            }).catch(() => {
                dispatch(
                    notify({
                        msg: 'Fail',
                        sev: 'error'
                    })
                );
            });
    };



    return (

        <ChildModal
            open={open}
            setOpen={setOpen}
            showChild={openChildModal}
            setShowChild={setOpenChildModal}
            showSubChild={showSubChildModal}
            setShowSubChild={setShowSubChildModal}
            title={transfer?.key ? 'Edit Transfer' : 'New Transfer'}
            mainStep={[
                { title: 'Transfer Info', icon: <FontAwesomeIcon icon={faInbox} /> },
            ]}
            mainContent={conjureFormContent}
            actionButtonLabel='Save'
            actionButtonFunction={handleSave}
            childTitle="Product Transfer"
            childContent={childContent}
            subChildTitle="Add Product Details"
            subChildContent={subChildContent}
            actionSubChildButtonFunction={handleSaveSubchild}
            childStep={[{ title: "Product Transfer", icon: <FontAwesomeIcon icon={faList} /> }]}
            subChildStep={[{ title: "Add Product Details", icon: <FontAwesomeIcon icon={faListCheck} /> }]}
            mainSize="xs"
            childSize="sm"
            subChildSize="xs"
        // actionChildButtonLabel="Confirm"
        // actionChildButtonFunction={handleSavechild}
        />
    );
};
export default AddEditTransfer;
