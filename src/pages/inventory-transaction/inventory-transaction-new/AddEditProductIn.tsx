import React, { useEffect, useState } from 'react';
import {
    useDeactiveActivVaccineBrandsMutation,
    useGetDepartmentsQuery,
    useGetIcdListQuery,
    useGetLovValuesByCodeQuery,
    useGetProductQuery,
    useGetUomGroupsUnitsQuery,
    useGetVaccineBrandsListQuery,
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
import { ApInventoryTransactionProduct, ApProducts, ApVaccineBrands } from '@/types/model-types';
import { newApInventoryTransactionProduct, newApProducts, newApVaccineBrands } from '@/types/model-types-constructor';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyModal from '@/components/MyModal/MyModal';
import { FaBabyCarriage, FaWarehouse } from 'react-icons/fa6';
import { useLazyGetQtyInBaseUomQuery, useSaveInventoryTransactionProductMutation } from '@/services/inventoryTransactionService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
const AddEditProductIn = ({ open, setOpen, transProduct, setTransProduct, transaction, setTransaction, refetch }) => {
    const dispatch = useAppDispatch();

    const [selectedProduct, setSelectedProduct] = useState<ApProducts>({ ...newApProducts });
    const [triggerGetQty, { data: qtyInBaseUomResponse, isLoading }] = useLazyGetQtyInBaseUomQuery();
    const [generateCode, setGenerateCode] = useState();
    const [totalCost, setTotalCost] = useState(0);
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
                fieldName: 'warehouse_key',
                operator: 'match',
                value: transaction?.warehouseKey
            },
        ],
    });
    const {
        data: warehouseProductListResponseLoading,
        refetch: refetchWarehouseProduct,
        isFetching
    } = useGetWarehouseProductsQuery(listRequest);

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
                value: transProduct?.productKey,
            },
        ],
    });
    const {
        data: productselectListResponseLoading
    } = useGetProductQuery(productselectListRequest);

    
    const handleConvertQuantity = async () => {
        if (!selectedProduct || !transProduct) return;

        const result = await triggerGetQty({
            quantity: transProduct.newQuentity,
            transUnit: transProduct.transUomKey,
            toBaseUnit: selectedProduct.baseUomKey,
            uomGroup: selectedProduct.uomGroupKey,
        });

        if (result?.data?.object !== undefined) {
            setTransProduct(prev => ({
                ...prev,
                quentityRequestedBaseUom: result.data.object
            }));
        }
    };

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
                    value: transaction?.warehouseKey
                },
            ]
        }));
    }, [transaction?.warehouseKey]);

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
                    value: transProduct?.productKey,
                },
            ]
        }));
    }, [transProduct?.productKey]);


    useEffect(() => {
        setTransProduct({ ...transProduct, inventoryTransKey: transaction?.key });
    }, [transaction?.key]);



    useEffect(() => {
        console.log(productselectListResponseLoading);
        if (productselectListResponseLoading?.object?.length > 0) {
            const firstItem = productselectListResponseLoading.object[0];
            setSelectedProduct(firstItem);
            console.log(firstItem);
        }
    }, [productselectListResponseLoading?.object]);


    useEffect(() => {
        setTotalCost(Number(calculateCost(transProduct?.newQuentity, transProduct?.newCost)) || 0);
        console.log("Total Cost:", totalCost);
    }, [transProduct?.newQuantity, transProduct?.newCost]);


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
                        record={transProduct}
                        setRecord={setTransProduct}
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

                    <MyInput width="100%" fieldLabel="Lot/Serial Number" fieldType="number" fieldName="lotserialnumber" record={transProduct} setRecord={setTransProduct} />

                </div>
            </div>
            <div className='container-of-two-fields'>
                <div className='container-of-field' >

                    <MyInput width="100%" fieldLabel="Quantity" fieldType="number" fieldName="newQuentity" record={transProduct} setRecord={setTransProduct} />

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
                        record={transProduct}
                        setRecord={setTransProduct}
                    />

                </div>

            </div>
            <div className='container-of-two-fields'>
                <div className='container-of-field' >
                    <MyInput width="100%" fieldLabel="unit cost" fieldType="number" fieldName="newCost" record={transProduct} setRecord={setTransProduct} />

                </div>

                <div className='container-of-field' >
                    <MyInput
                        width="100%"
                        disabled={true}
                        fieldLabel="Total Cost"
                        fieldName="value"
                        record={{ value: totalCost }}
                        setRecord={() => { }}
                    />

                </div>
            </div>
            <div className='container-of-two-fields'>
                <div className='container-of-field' >



                    <MyInput width="100%" disabled={true}
                        fieldName="currencyLkey" record={transProduct} setRecord={setTransProduct} />
                </div>
                <div className='container-of-field' >


                    <MyInput
                        width="100%"
                        fieldName="expiryDate"
                        fieldType="date"
                        record={transProduct}
                        setRecord={setTransProduct}
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
                                    record={transProduct}
                                    setRecord={setTransProduct}
                                />
                            </div>
                            <div className='container-of-field' >
                                <br />
                                <MyButton appearance="primary" onClick={handleConvertQuantity}> <FontAwesomeIcon icon={faCalculator} /></MyButton>
                            </div>
                        </div>

        </Form>
    );
};
export default AddEditProductIn;
