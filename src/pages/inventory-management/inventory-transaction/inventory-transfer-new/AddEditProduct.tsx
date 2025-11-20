import React, { useEffect, useState } from 'react';
import {
    useDeactiveActivVaccineBrandsMutation,
    useGetDepartmentsQuery,
    useGetIcdListQuery,
    useGetLovValuesByCodeQuery,
    useGetProductQuery,
    useGetUomGroupsUnitsQuery,
    useGetVaccineBrandsListQuery,
    useGetWarehouseProductsDetailsQuery,
    useGetWarehouseProductsQuery,
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
import { ApInventoryTransactionProduct, ApProducts, ApVaccineBrands, ApWarehouseProduct, ApWarehouseProductDetails } from '@/types/model-types';
import { newApInventoryTransactionProduct, newApProducts, newApVaccineBrands, newApWarehouseProduct, newApWarehouseProductDetails } from '@/types/model-types-constructor';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyModal from '@/components/MyModal/MyModal';
import { FaBabyCarriage, FaWarehouse } from 'react-icons/fa6';
import { useGetQtyInBaseUomQuery, useLazyGetQtyInBaseUomQuery, useSaveInventoryTransactionProductMutation } from '@/services/inventoryTransactionService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
const AddEditProduct = ({ open, setOpen, transferProduct, setTransferProduct, transfer, setTransfer, refetch }) => {
    const dispatch = useAppDispatch();

    const [selectedProduct, setSelectedProduct] = useState<ApProducts>({ ...newApProducts });
    const [selectedWarehouseProduct, setSelectedWarehouseProduct] = useState<ApWarehouseProduct>({ ...newApWarehouseProduct });
    const [selectedWarehouseProductdetails, setSelectedWarehouseProductdetails] = useState<ApWarehouseProductDetails>({ ...newApWarehouseProductDetails });
    const { data: productTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PRODUCTS_TYPES');
    const { data: lotSerialLovQueryResponse } = useGetLovValuesByCodeQuery('LOT_SERIAL');

    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
            {
                fieldName: 'warehouse_key',
                operator: 'match',
                value: transfer?.fromWarehouseKey
            },
        ],
    });

    const [productDetailsListRequest, setProductDetailsListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
            {
                fieldName: 'warehouse_product_key',
                operator: 'match',
                value: selectedWarehouseProduct?.key
            }
        ],
    });
    const {
        data: warehouseProductListResponseLoading,
        refetch: refetchWarehouseProduct,
        isFetching
    } = useGetWarehouseProductsQuery(listRequest);

    const {
        data: productDetailsListResponseLoading,
        refetch: refetchProductDetails
    } = useGetWarehouseProductsDetailsQuery(productDetailsListRequest);

    const [triggerGetQty, { data: qtyInBaseUomResponse, isLoading }] = useLazyGetQtyInBaseUomQuery();


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
            {
                fieldName: 'warehouse_key',
                operator: 'match',
                value: transfer?.fromWarehouseKey
            },
            {
                fieldName: 'product_key',
                operator: 'match',
                value: transfer?.productKey
            },
        ],
    });
    const {
        data: warehouseProductSelectedListResponseLoading,
        refetch: refetchWarehouseProductSelected,
    } = useGetWarehouseProductsQuery(productListRequest);

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
                value: transferProduct?.productKey,
            },
        ],
    });
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
    const calculateCost = (totalQuantity, unitCost) => {
        return totalQuantity * unitCost;
    };

    const handleConvertQuantity = async () => {
        if (!selectedProduct || !transferProduct) return;

        console.log("qty:", transferProduct.quentityRequested);
        const result = await triggerGetQty({
            quantity: transferProduct.quentityRequested,
            transUnit: transferProduct.transUomKey,
            toBaseUnit: selectedProduct.baseUomKey,
            uomGroup: selectedProduct.uomGroupKey,
        });

        if (result?.data?.object !== undefined) {
            setTransferProduct(prev => ({
                ...prev,
                quentityRequestedBaseUom: result.data.object
            }));
        }
    };



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
                    fieldName: 'warehouse_key',
                    operator: 'match',
                    value: transfer?.fromWarehouseKey
                },
            ]
        }));
    }, [transfer?.fromWarehouseKey]);

    const [unitListRequest, setUnitListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            },
            {
                fieldName: 'uom_group_key',
                operator: 'match',
                value: selectedProduct?.uomGroupKey
            }

        ],

    });

    useEffect(() => {
        setUnitListRequest(
            {
                ...initialListRequest,
                filters: [
                    {
                        fieldName: 'deleted_at',
                        operator: 'isNull',
                        value: undefined
                    },
                    {
                        fieldName: 'uom_group_key',
                        operator: 'match',
                        value: selectedProduct?.uomGroupKey
                    }

                ],
            }
        );
    }, [selectedProduct]);

    const {
        data: UnitsListResponse,
        refetch: refetchUnit,
    } = useGetUomGroupsUnitsQuery(unitListRequest);

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
                    value: transferProduct?.productKey,
                },
            ]
        }));

          setProductListRequest(prev => ({
            ...prev,
            filters: [
                {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
              {
                    fieldName: 'warehouse_key',
                    operator: 'match',
                    value: transfer?.fromWarehouseKey
                },
                    {
                    fieldName: 'product_key',
                    operator: 'match',
                    value: transfer?.productKey
                },

            ]
        }));
    }, [transferProduct?.productKey]);


    useEffect(() => {
        setTransferProduct({ ...transferProduct, inventoryTransKey: transfer?.key });
        console.log(transfer?.key);
    }, [transfer?.key]);



    useEffect(() => {
        console.log(productselectListResponseLoading);
        if (productselectListResponseLoading?.object?.length > 0) {
            const firstItem = productselectListResponseLoading.object[0];
            setSelectedProduct(firstItem);
            console.log(firstItem);
        }
    }, [productselectListResponseLoading?.object]);

     useEffect(() => {
        console.log(warehouseProductSelectedListResponseLoading);
        if (warehouseProductSelectedListResponseLoading?.object?.length > 0) {
            const firstItem = warehouseProductSelectedListResponseLoading.object[0];
            setSelectedWarehouseProduct(firstItem);
            console.log(firstItem);
        }

    }, [warehouseProductSelectedListResponseLoading?.object]);

    useEffect(() => {
        setProductDetailsListRequest(prev => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                {
                    fieldName: 'warehouse_product_key',
                    operator: 'match',
                    value: selectedWarehouseProduct?.key
                }

            ]
        }));

    }, [selectedWarehouseProduct?.key]);

  


    return (
        <Form fluid>
            <div className='container-of-two-fields'>
                <div className='container-of-field' >
                    <MyInput
                        width="100%"
                        fieldName="productKey"
                        fieldType="select"
                        selectData={warehouseProductListResponseLoading?.object ?? []}
                        selectDataLabel="productName"
                        selectDataValue="productKey"
                        record={transferProduct}
                        setRecord={record => {
                            const selectedObject = warehouseProductListResponseLoading?.object?.find(item => item.productKey === record?.productKey);
                            setTransferProduct({
                                ...transferProduct,
                                productKey: selectedObject?.productKey
                            });
                            setSelectedWarehouseProduct(selectedObject);
                        }}
                    //     setRecord={
                    //         record => {
                    //     const selectedObject = warehouseProductListResponseLoading?.object?.find(item => item.key === record?.productKey);
                    //     setTransferProduct({
                    //         ...transferProduct,
                    //         productKey: selectedObject?.productKey
                    //     });
                    //     setSelectedWarehouseProduct(selectedObject);
                    //     }
                    // }
                        

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
                    <MyInput
                        width="100%"
                        fieldLabel="Transfer Quantity"
                        fieldName="quentityRequested"
                        fieldType="number"
                        record={transferProduct}
                        setRecord={setTransferProduct}
                    />
                </div>
                <div className='container-of-field' >
                    <MyInput
                        width="100%"
                        fieldLabel="Transaction UOM"
                        fieldName="transUomKey"
                        fieldType="select"
                        selectData={UnitsListResponse?.object ?? []}
                        selectDataLabel="units"
                        selectDataValue="key"
                        record={transferProduct}
                        setRecord={setTransferProduct}
                    />

                </div>
            </div>
            <div className='container-of-two-fields'>
                <div className='container-of-field' >
                    <MyInput
                        width="100%"
                        disabled={true}
                        fieldLabel="Quantity in base UOM"
                        fieldName="quentityRequestedBaseUom"
                        fieldType="number"
                        record={transferProduct}
                        setRecord={setTransferProduct}
                    />
                </div>
                <div className='container-of-field' >


                    <br />
                    <MyButton appearance="primary" onClick={handleConvertQuantity}> <FontAwesomeIcon icon={faCalculator} /></MyButton>
                </div>
            </div>
            <div className='container-of-two-fields'>
                <div className='container-of-field' >
                    <MyInput
                        width="100%"
                        disabled={true}
                        fieldName="inventoryTypeLkey"
                        fieldType="select"
                        selectData={lotSerialLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={selectedProduct}
                        setRecord={setSelectedProduct}
                    />
                </div>
                <div className='container-of-field' >

                    <MyInput
                        width="100%"
                        fieldLabel="Lot/Serial No"
                        fieldName="lotserialnumber"
                        fieldType="select"
                        selectData={productDetailsListResponseLoading?.object ?? []}
                        selectDataLabel="lotSerialNum"
                        selectDataValue="key"
                        record={transferProduct}
                        setRecord={record => {
                        const selectedObject = productDetailsListResponseLoading?.object?.find(item => item.key === record?.lotserialnumber);
                        setTransferProduct({
                            ...transferProduct,
                            lotserialnumber: selectedObject?.key
                        });
                        setSelectedWarehouseProductdetails(selectedObject? { ...selectedObject } : { ...newApWarehouseProductDetails });
                        console.log(record);
                        }}
                    />

                </div>

            </div>
            <div className='container-of-two-fields'>
                <div className='container-of-field' >
                    <MyInput 
                    disabled={true} 
                    width="100%" 
                    fieldLabel="Available Quantity" 
                    fieldName="quantity" 
                    record={selectedWarehouseProductdetails} 
                    setRecord={setSelectedWarehouseProductdetails} 
                    />

                </div>

                <div className='container-of-field' >

                    <MyInput
                        disabled={true}
                        width="100%"
                        fieldName="expiryDate"
                        fieldType="date"
                        record={selectedWarehouseProductdetails}
                        setRecord={setSelectedWarehouseProductdetails}
                    />
                </div>


            </div>

        </Form>
    );
};
export default AddEditProduct;
