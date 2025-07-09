import React, { useEffect, useState } from 'react';
import {
    useDeactiveActivVaccineBrandsMutation,
    useGetDepartmentsQuery,
    useGetIcdListQuery,
    useGetLovValuesByCodeQuery,
    useGetProductQuery,
    useGetUomGroupsUnitsQuery,
    useGetVaccineBrandsListQuery,
    useGetWarehouseQuery,
    useSaveVaccineBrandMutation,
    useSaveVaccineMutation,
    useSaveWarehouseMutation,
    useSaveWarehouseProductsMutation
} from '@/services/setupService';
import SearchIcon from '@rsuite/icons/Search';
import MyInput from '@/components/MyInput';
import { Dropdown, Form } from 'rsuite';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { MdVaccines } from 'react-icons/md';
import { MdMedication } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { initialListRequest, ListRequest } from '@/types/types';
import MyButton from '@/components/MyButton/MyButton';
import { ApProducts, ApVaccineBrands } from '@/types/model-types';
import { newApProducts, newApVaccineBrands } from '@/types/model-types-constructor';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyModal from '@/components/MyModal/MyModal';
import { FaBabyCarriage, FaWarehouse } from 'react-icons/fa6';
import { set } from 'lodash';
const AddEditWarehouseProduct = ({ open, setOpen, warehouseProduct, setWarehouseProduct, edit_new, setEdit_new, refetch }) => {
    const dispatch = useAppDispatch();
    const [saveWarehouseProduct, saveWarehouseProductMutation] = useSaveWarehouseProductsMutation();
    const [selectedProduct, setSelectedProduct] = useState<ApProducts>({ ...newApProducts });
    const [generateCode, setGenerateCode] = useState();
    const [recordOfWarehouseCode, setRecordOfWarehouseCode] = useState({ warehouseId: '' });
    const { data: productTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PRODUCTS_TYPES');
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
            {
                fieldName: 'department_key',
                operator: 'match',
                value: warehouseProduct?.departmentKey
            },
        ],
    });
    const {
        data: warehouseListResponseLoading,
        refetch: refetchWarehouse,
        isFetching
    } = useGetWarehouseQuery(listRequest);

    const [uomListRequest, setUomListRequest] = useState<ListRequest>({ ...initialListRequest });

    const {
        data: uomGroupsUnitsListResponse,
        refetch: refetchUomGroupsUnit,
    } = useGetUomGroupsUnitsQuery(uomListRequest);

    const [productListRequest, setProductListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
        ],
    });
    const [productselectListRequest, setProductselectListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
            {
                fieldName: 'key',
                operator: 'match',
                value: warehouseProduct?.productKey,
            },
        ],
    });
    const {
        data: productListResponseLoading,
        refetch: refetchProduct,
        isFetching: productListIsFetching
    } = useGetProductQuery(productListRequest);
    const {
        data: productselectListResponseLoading
    } = useGetProductQuery(productselectListRequest);


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


    const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);

    const handleSave = () => {
        const response = saveWarehouseProduct({
            ...warehouseProduct,
        }).unwrap().then(() => {
            console.log(response)
            setWarehouseProduct(response);
            refetch();
            setOpen(false);
            setEdit_new(false); // Reset edit_new state
            refetch();
            setWarehouseProduct({ ...newApProducts });
            dispatch(
                notify({
                    msg: 'The Warehouse Product Added/Edited successfully ',
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


    // update list of warehouse when department is changed
    useEffect(() => {
        setListRequest(prev => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined
                },
                {

                    fieldName: 'department_key',
                    operator: 'match',
                    value: warehouseProduct?.departmentKey
                }
            ]
        }));
    }, [warehouseProduct?.departmentKey]);


    useEffect(() => {
        setProductselectListRequest(prev => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                {
                    fieldName: 'key',
                    operator: 'match',
                    value: warehouseProduct?.productKey,
                },
            ]
        }));
    }, [warehouseProduct?.productKey]);



    useEffect(() => {
        console.log(productselectListResponseLoading);
        if (productselectListResponseLoading?.object?.length > 0) {
            const firstItem = productselectListResponseLoading.object[0];
            setSelectedProduct(firstItem);
        }
    }, [productselectListResponseLoading?.object]);


    // Main modal content
    const conjureFormContent = stepNumber => {
        switch (stepNumber) {
            case 0:
                return (
                    <Form fluid>
                        <MyInput
                            width="100%"
                            fieldName="departmentKey"
                            disabled={warehouseProduct?.key}
                            fieldType="select"
                            selectData={departmentListResponse?.object ?? []}
                            selectDataLabel="name"
                            selectDataValue="key"
                            record={warehouseProduct}
                            setRecord={setWarehouseProduct}
                        />
                        <MyInput
                            width="100%"
                            fieldName="warehouseKey"
                            fieldType="select"
                            selectData={warehouseListResponseLoading?.object ?? []}
                            selectDataLabel="warehouseName"
                            selectDataValue="key"
                            record={warehouseProduct}
                            setRecord={setWarehouseProduct}
                        />

                        <MyInput
                            width="100%"
                            fieldName="productKey"
                            fieldType="select"
                            selectData={productListResponseLoading?.object ?? []}
                            selectDataLabel="name"
                            selectDataValue="key"
                            record={warehouseProduct}
                            setRecord={setWarehouseProduct}
                        />
                        <div className='container-of-two-fields'>
                            <div className='container-of-field' >
                                <MyInput
                                    width="100%"
                                    disabled={true}
                                    fieldName="typeLkey"
                                    fieldType="select"
                                    selectData={productTypeLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    record={selectedProduct}
                                    setRecord={setSelectedProduct}
                                />
                            </div>
                            <div className='container-of-field' >
                                <MyInput
                                    width="100%"
                                    disabled={true}
                                    fieldName="baseUomKey"
                                    fieldType="select"
                                    selectData={uomGroupsUnitsListResponse?.object ?? []}
                                    selectDataLabel="units"
                                    selectDataValue="key"
                                    record={selectedProduct}
                                    setRecord={setSelectedProduct}
                                />
                            </div>
                        </div>
                        <div className='container-of-two-fields'>
                            <div className='container-of-field' >



                                <MyInput width="100%"
                                    fieldType="number" fieldName="reOrderQuantity" record={warehouseProduct} setRecord={setWarehouseProduct} />
                            </div>
                            <div className='container-of-field' >
                                <MyInput
                                    width="100%"
                                    disabled={true}
                                    fieldName="priceBaseUom"
                                    fieldType="select"
                                    selectData={[]}
                                    selectDataLabel="0"
                                    selectDataValue=""
                                    record={selectedProduct}
                                    setRecord={setSelectedProduct}
                                />
                            </div>
                        </div>
                        <div className='container-of-two-fields'>
                            <div className='container-of-field' >



                                <MyInput width="100%" disabled={true}
                                    fieldName="quantity" record={selectedProduct} setRecord={setSelectedProduct} />
                            </div>
                            <div className='container-of-field' >
                                <MyInput
                                    width="100%"
                                    disabled={true}
                                    fieldName="avgCost"
                                    record={selectedProduct}
                                    setRecord={setSelectedProduct}
                                />

                            </div>
                        </div>

                    </Form>
                );
        }
    };


    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title={warehouseProduct?.key ? 'Edit Warehouse Product' : 'New Warehouse Product'}
            position="right"
            content={conjureFormContent}
            actionButtonLabel={warehouseProduct?.key ? 'Save' : 'Create'}
            actionButtonFunction={handleSave}
            steps={[{ title: 'Warehouse Info', icon: <FaWarehouse /> }]}
        />
    );
};
export default AddEditWarehouseProduct;
