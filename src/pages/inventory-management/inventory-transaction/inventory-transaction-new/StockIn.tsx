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
import { Dropdown, Form, Input, SelectPicker } from 'rsuite';
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
import { useConfirmTransProductStockInMutation, useGetInventoryTransactionsProductQuery, useLazyGetQtyInBaseUomQuery, useRemoveInventoryTransactionProductMutation, useSaveInventoryTransactionProductListMutation, useSaveInventoryTransactionProductMutation } from '@/services/inventoryTransactionService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalculator, faDeleteLeft, faEye, faSave } from '@fortawesome/free-solid-svg-icons';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { ColumnConfig } from '@/components/MyNestedTable/MyNestedTable';
const StockIn = ({ transProduct, setTransProduct, transaction, setTransaction, refetch }) => {
    const dispatch = useAppDispatch();

    const [selectedProduct, setSelectedProduct] = useState<ApProducts>({ ...newApProducts });
    const [triggerGetQty, { data: qtyInBaseUomResponse, isLoading }] = useLazyGetQtyInBaseUomQuery();
    const [generateCode, setGenerateCode] = useState();
    const [totalCost, setTotalCost] = useState(0);
    const [recordOfWarehouseCode, setRecordOfWarehouseCode] = useState({ warehouseId: '' });
    const { data: productTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PRODUCTS_TYPES');
    const { data: lotSerialLovQueryResponse } = useGetLovValuesByCodeQuery('LOT_SERIAL');
    const [confirmProductStockIn, confirmProductStockInMutation] = useConfirmTransProductStockInMutation();
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


    const [productList, setProductList] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            }
        ],
    });
    const {
        data: productListResponseLoading
    } = useGetProductQuery(productList);


    const handleConvertQuantity = async (productObj, transactionProduct) => {
        if (!productObj || !transactionProduct) return;

        const result = await triggerGetQty({
            quantity: transactionProduct.newQuentity,
            transUnit: transactionProduct.transUomKey,
            toBaseUnit: productObj.baseUomKey,
            uomGroup: productObj.uomGroupKey,
        });

        if (result?.data?.object !== undefined) {
            return result.data.object;

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


    //  const [products, setProducts] = useState<ApInventoryTransactionProduct[]>([]);
    const [products, setProducts] = useState([]);
    const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);
    const calculateCost = (totalQuantity, unitCost) => {
        return totalQuantity * unitCost;
    };

    const [transactionProductListRequest, setTransactionProductListRequest] = useState<ListRequest>({
        ...initialListRequest,
        pageSize: 15,
        filters: [
            {
                fieldName: 'inventory_trans_key',
                operator: 'match',
                value: transaction?.key
            }
        ]
    });

    const {
        data: transactionProductListResponseLoading,
        refetch: transactionProductRefetch,
        isFetching: transactionProductIsFetching
    } = useGetInventoryTransactionsProductQuery(transactionProductListRequest);

    useEffect(() => {
        const updatedFilters = [
            {
                fieldName: 'inventory_trans_key',
                operator: 'match',
                value: transaction?.key
            }
        ];
        setTransactionProductListRequest(prevRequest => ({
            ...prevRequest,
            filters: updatedFilters
        }));

        setProducts(transactionProductListResponseLoading?.data ?? [])
    }, [transaction?.key]);

    
        useEffect(() => {
            const updatedFilters = [
                {
                    fieldName: 'inventory_trans_key',
                    operator: 'match',
                    value: transaction?.key
                }
            ];
            setTransactionProductListRequest(prevRequest => ({
                ...prevRequest,
                filters: updatedFilters
            }));
            setProducts(transactionProductListResponseLoading?.object ?? []);
    console.log(transactionProductListResponseLoading?.object);
    
              
        }, [transaction?.key, transactionProductListResponseLoading]);
    useEffect(() => {
        setProducts(transactionProductListResponseLoading?.data ?? [])
    }, [transactionProductRefetch]);


    const handleSaveAllProducts = async () => {
        try {
            await saveProducts(products).unwrap();
            const refreshed = await transactionProductRefetch().unwrap();
            setProducts(refreshed?.object ?? []);
            refetch();
            dispatch(notify({ msg: 'All products saved successfully', sev: 'success' }));
        } catch (error) {
            dispatch(notify({ msg: 'Failed to save products', sev: 'error' }));
        }
    };

    const handleDeleteProduct = (rowData) => {
        setProductToDelete(rowData);
        setConfirmDeleteOpen(true);
     
    };

 const confirmDelete = async () => {
    if (!productToDelete) return;

    const { key, index } = productToDelete;

    if (key) {
        try {
            await deleteProduct(productToDelete).unwrap();
            dispatch(notify({ msg: 'Product deleted successfully', sev: 'success' }));
        } catch (error) {
            dispatch(notify({ msg: 'Failed to delete product', sev: 'error' }));
            return; // stop further action
        }
    }

    setProducts((prev) => prev.filter((_, i) => i !== index));
    setConfirmDeleteOpen(false);
    setProductToDelete(null); // clear
};


    const [deleteProduct, deleteProductMutation] = useRemoveInventoryTransactionProductMutation();
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<any>(null);
    const [saveProducts, saveProductsMutation] = useSaveInventoryTransactionProductListMutation();
    // Save notes effect
    useEffect(() => {
        if (saveProductsMutation.status === 'fulfilled') {
            setProducts(saveProductsMutation.data);
        } else if (saveProductsMutation.status === 'rejected') {
            dispatch({ type: 'NOTIFY', payload: { msg: 'Save Failed', sev: 'error' } });
        }
    }, [saveProductsMutation.status]);

    // Delete note effect
    useEffect(() => {
        if (deleteProductMutation.status === 'fulfilled') {
            setProducts(prev => prev.filter(product => product.key !== productToDelete?.key));
            setProductToDelete(null);
        } else if (deleteProductMutation.status === 'rejected') {
            dispatch({ type: 'NOTIFY', payload: { msg: 'Delete Failed', sev: 'error' } });
        }
    }, [deleteProductMutation.status]);

    const handleChange = (value: string, index: number, field: string) => {
        const updatedProducts = [...products];
        updatedProducts[index] = { ...updatedProducts[index], [field]: value };
        setProducts(updatedProducts);
    };

    const handleRowChange = async (index: number, field: string, value: any) => {
        setProducts((prev) => {
            const updated = [...prev];
            let row = { ...updated[index], [field]: value };

            if (transaction?.transTypeLkey === '6509244814441399') {
                if (field === 'newCost' || field === 'newQuentity') {
                    row.totalCost = (row.newCost || 0) * (row.newQuentity || 0);
                }
            }

            updated[index] = row;
            return updated;
        });

        if (field === 'transUomKey' || field === 'newQuentity') {
            const productObj = products[index]?.productObj;
            const transactionProduct = { ...products[index], [field]: value };

            if (productObj && transactionProduct) {
                try {
                    const converted = await handleConvertQuantity(productObj, transactionProduct);

                    setProducts((prev) => {
                        const updated = [...prev];
                        updated[index] = {
                            ...updated[index],
                            quentityRequestedBaseUom: converted ?? 0,
                        };
                        return updated;
                    });
                } catch (err) {
                    console.error("Conversion error:", err);
                }
            }
        }
    };

    //      const handleSelectProduct = (index: number, selectedProduct: any) => {
    //     setProducts((prev) => {
    //       const updated = [...prev];
    //       updated[index] = {
    //         ...updated[index],
    //         productKey: selectedProduct.key,
    //         productName: selectedProduct.name,
    //         uomGroupKey: selectedProduct.uomGroupKey,
    //         baseUomKey: selectedProduct.baseUomKey,
    //         priceBaseUom: selectedProduct.priceBaseUom,
    //       };
    //       return updated;
    //     });
    //   };

    // Update product field
    // const handleProductChange = (key: string, field: string, value: any) => {
    //     setProducts((prev) =>
    //         prev.map((p) => {
    //             if (p.key === key) {
    //               const updated = { ...p, [field]: value };

    //               // Calculate totalCost if relevant fields change
    //               if (transaction.transTypeLkey === "6509244814441399") { //Stock in
    //                 if (field === "newCost" || field === "newQuentity") {
    //                   updated.totalCost = (updated.newCost || 0) * (updated.newQuentity || 0);
    //                 }
    //               }

    //               return updated;
    //             }
    //             return p;
    //         })
    //     );
    // };

    // // Update product select
    // const handleSelectProduct = (key: string, value: string) => {
    //     const prod = warehouseProductListResponseLoading.find((p) => p.value === value) || null;
    //     handleProductChange(key, "productKey", prod);
    // };

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


    const handleSavechildIn = () => {
        confirmProductStockIn({
            key: transaction?.key
        })
            .unwrap()
            .then(() => {
                refetch();
                transactionProductRefetch();
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
                    // {
                    //     fieldName: 'uom_group_key',
                    //     operator: 'match',
                    //     value: selectedProduct?.uomGroupKey
                    // }

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


    const handleAddProductRow = () => {
        setProducts((prev) => [
            ...prev,
            { ...newApInventoryTransactionProduct, inventoryTransKey: transaction?.key, statusLkey: '164797574082125' }, //New
        ]);
    };

    const actionsForItems = rowData => {
        const handleViewTransactions = () => {
            console.log('View transactions for:', rowData.name);
            // TODO: Implement view transactions logic
        };


        return (
            <div className="container-of-actions">
                <FontAwesomeIcon
                    icon={faDeleteLeft}
                    title="Delete Product"
                    className="action-icon"
                    onClick={() => {
                        setConfirmDeleteOpen(true);
                        setProductToDelete(rowData);
                    }}
                />
            </div>
        );
    };



    const columns: ColumnConfig[] = [
        {
            key: 'productKey',
            title: 'Product',
            width: 180,
            render: (rowData, index) => (
                <SelectPicker
                    data={warehouseProductListResponseLoading?.object ?? []}
                    value={rowData.productKey}
                    labelKey="productName"
                    valueKey="productKey"
                    onChange={(val) => {

                        const selectedProduct = (productListResponseLoading?.object ?? [])
                            .find((p) => p.key === val);


                        handleRowChange(index, 'productKey', val);
                        handleRowChange(index, 'productObj', selectedProduct);
                    }

                    }
                    cleanable={true}
                    searchable={true}
                    style={{ width: 160 }}
                     disabled={rowData?.statusLkey == '1804482322306061'}
                />

            ),
        },
        {
            key: 'inventoryTypeLkey',
            title: 'Inventory Type',
            width: 120,
            render: (rowData) => (
                <SelectPicker
                    style={{ width: 160 }}
                    disabled
                    value={rowData?.productObj?.inventoryTypeLkey}
                    data={lotSerialLovQueryResponse?.object ?? []}
                    labelKey="lovDisplayVale"
                    valueKey="key"
                />
            ),


        },
        {
            key: 'lotserialnumber',
            title: 'Lot/Serial Number',
            width: 130,
            render: (rowData, index) => (
                <Input
                    value={rowData.lotserialnumber}
                    onChange={(val: string) => handleRowChange(index, 'lotserialnumber', val)}
                    style={{ width: '100%' }}
                     disabled={rowData?.statusLkey == '1804482322306061'}
                />
            ),
        },
        {
            key: 'newQuentity',
            title: 'Quantity',
            width: 100,
            render: (rowData, index) => (
                <Input
                    type="number"
                    value={rowData.newQuentity}
                    onChange={(val: string) => {
                        handleRowChange(index, 'newQuentity', Number(val));
                    }}
                    style={{ width: '100%' }}
                    min={0}
                     disabled={rowData?.statusLkey == '1804482322306061'}
                />
            ),
        },
        {
            key: 'transUomKey',
            title: 'Transaction UOM',
            width: 130,
            render: (rowData, index) => (
                <SelectPicker
                    value={rowData.transUomKey}
                    onChange={(val: string) => handleRowChange(index, 'transUomKey', val)}
                    data={
                        (UnitsListResponse?.object ?? []).filter(
                            (u) => u.uomGroupKey === rowData?.productObj?.uomGroupKey
                        )
                    }
                    labelKey="units"
                    valueKey="key"
                    cleanable={true}
                    searchable={true}
                    style={{ width: 160 }}
                     disabled={rowData?.statusLkey == '1804482322306061'}
                />
            ),
        },
        {
            key: 'quentityRequestedBaseUom',
            title: 'Quantity in base UOM',
            width: 120,
            render: (rowData) => <span>{rowData?.quentityRequestedBaseUom ?? '0.00'}</span>,
        },
        {
            key: 'baseUomKey',
            title: 'Base Uom',
            width: 180,
            render: (rowData, index) => (
                <SelectPicker
                    data={uomGroupsUnitsListResponse?.object ?? []}
                    value={rowData?.productObj?.baseUomKey}
                    labelKey="units"
                    valueKey="key"
                    cleanable={false}
                    searchable={false}
                    style={{ width: 160 }}
                    disabled
                />
            ),
        },



    ];

    // Conditionally add stock-in columns
    if (transaction.transTypeLkey === '6509244814441399') {
        columns.push(
            {
                key: 'newCost',
                title: 'Unit Cost',
                width: 120,
                render: (rowData, index) => (
                    <Input
                        type="number"
                        value={rowData.newCost}
                        onChange={
                            (val: string) => {
                                handleRowChange(index, 'newCost', val);
                                setTotalCost(Number(calculateCost(rowData?.newQuentity, rowData?.newCost)) || 0);
                            }
                        }
                        style={{ width: '100%' }}
                        min={0}
                     disabled={rowData?.statusLkey == '1804482322306061'}
                    />
                ),
            },

            {
                key: 'expiryDate',
                title: 'Expiry Date',
                width: 140,
                render: (rowData, index) => (
                    <Input
                        type="date"
                        value={rowData.expiryDate}
                        onChange={(val: string) => handleRowChange(index, 'expiryDate', val)}
                        style={{ width: '100%' }}
                     disabled={rowData?.statusLkey == '1804482322306061'}
                    />
                ),
            },
            {
                key: 'totalCost',
                title: 'Total Cost',
                width: 120,
                render: (rowData, index) =>
                    <span>{(products[index]?.totalCost || 0).toFixed(2) || '0.00'}</span>

            },
                       {
                key: 'notes',
                title: 'Notes',
                width: 140,
                render: (rowData, index) => (
                    <Input
                        value={rowData.notes}
                        onChange={(val: string) => handleRowChange(index, 'notes', val)}
                        style={{ width: '100%' }}
                        disabled={rowData?.statusLkey == '1804482322306061'}
                    />
                )


            },
            {
                key: 'statusLkey',
                title: <Translate>Status</Translate>,
                width: 100,
                render: (rowData, index) => {
                    const status = rowData?.statusLkey || '164797574082125';

                    const getStatusConfig = status => {
                        switch (status) {
                            case '164797574082125'://New
                                return {
                                    backgroundColor: 'var(--light-green)',
                                    color: 'var(--primary-green)',
                                    contant: 'New'
                                };
                            case '5959341154465084': //Requested
                                return {
                                    backgroundColor: 'var(--light-blue)',
                                    color: 'var(--primary-blue)',
                                    contant: 'Requested'
                                };
                            case '1804482322306061': //Submitted
                                return {
                                    backgroundColor: 'var(--light-orange)',
                                    color: 'var(--primary-orange)',
                                    contant: 'Submitted'
                                };
                            default:
                                return {
                                    backgroundColor: 'var(--background-gray)',
                                    color: 'var(--primary-gray)',
                                    contant: 'Unknown'
                                };
                        }
                    };

                    const config = getStatusConfig(status);
                    return (
                        <MyBadgeStatus
                            backgroundColor={config.backgroundColor}
                            color={config.color}
                            contant={config.contant}
                        />
                    );
                }
            },
 
            {
                key: 'actions',
                title: <Translate>Actions</Translate>,
                width: 120,
                render: rowData => actionsForItems(rowData)
            }
        );

    }

    const totals = products.reduce(
        (acc, item) => {
            acc.items += 1;
            acc.queentitybase += Number(item.quentityRequestedBaseUom || 0);
            acc.newCost += Number(item.newCost || 0);
            acc.quantity += Number(item.newQuentity || 0);
            acc.totalCost += Number(item.totalCost || 0);
            return acc;
        },
        { quantity: 0, totalCost: 0, items: 0, queentitybase: 0, newCost: 0 }
    );


    return (
        <Form fluid>

            <div className="table-buttons-right">

                <MyButton appearance="primary" onClick={handleAddProductRow} disabled={!transaction?.key}>
                    Add Product
                </MyButton>
                <MyButton appearance="primary" onClick={handleSaveAllProducts} disabled={!transaction?.key}>
                    Save All product
                </MyButton>
                <MyButton appearance="ghost" onClick={handleSavechildIn} disabled={!transaction?.key}>
                    Confirm
                </MyButton>

            </div>

            <MyTable
                data={products}
                columns={columns}
                height={300}
            >

            </MyTable>
            <DeletionConfirmationModal
                open={confirmDeleteOpen}
                setOpen={setConfirmDeleteOpen}
                itemToDelete="Product"
                actionButtonFunction={confirmDelete}
                actionType={'delete'}
            />
            <div style={{
                display: "flex",
                borderTop: "2px solid #e5e5e5",
                background: "#fafafa",
                fontWeight: "bold",
                padding: "8px 16px"
            }}>
                <div style={{ width: 200 }}>Total Product: {totals.items}</div>
                <div style={{ width: 200 }}>Total Quantity: {totals.quantity}</div>
                <div style={{ width: 250 }}>Total Quantity in Base UOM: {totals.queentitybase}</div>
                <div style={{ width: 200 }}>Total Unit Cost: {totals.newCost}</div>
                <div style={{ width: 200 }}>Total Cost:{totals.totalCost.toFixed(2)}</div>
            </div>
        </Form>
    );
};
export default StockIn;
