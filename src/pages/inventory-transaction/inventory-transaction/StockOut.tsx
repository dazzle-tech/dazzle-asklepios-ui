// import React, { useEffect, useState } from 'react';
// import {
//     useDeactiveActivVaccineBrandsMutation,
//     useGetDepartmentsQuery,
//     useGetIcdListQuery,
//     useGetLovValuesByCodeQuery,
//     useGetProductQuery,
//     useGetUomGroupsUnitsQuery,
//     useGetVaccineBrandsListQuery,
//     useGetWarehouseProductsDetailsQuery,
//     useGetWarehouseProductsQuery,
//     useGetWarehouseQuery,
//     useSaveVaccineBrandMutation,
//     useSaveVaccineMutation,
//     useSaveWarehouseMutation,
//     useSaveWarehouseProductsMutation
// } from '@/services/setupService';
// import SearchIcon from '@rsuite/icons/Search';
// import MyInput from '@/components/MyInput';
// import { Dropdown, Form, SelectPicker } from 'rsuite';
// import './styles.less';
// import ChildModal from '@/components/ChildModal';
// import Translate from '@/components/Translate';
// import MyTable from '@/components/MyTable';
// import { useAppDispatch } from '@/hooks';
// import { notify } from '@/utils/uiReducerActions';
// import { MdVaccines } from 'react-icons/md';
// import { MdMedication } from 'react-icons/md';
// import { FaUndo } from 'react-icons/fa';
// import { MdModeEdit } from 'react-icons/md';
// import { MdDelete } from 'react-icons/md';
// import { initialListRequest, ListRequest } from '@/types/types';
// import MyButton from '@/components/MyButton/MyButton';
// import { ApInventoryTransactionProduct, ApProducts, ApVaccineBrands, ApWarehouseProduct, ApWarehouseProductDetails } from '@/types/model-types';
// import { newApInventoryTransactionProduct, newApProducts, newApVaccineBrands, newApWarehouseProduct, newApWarehouseProductDetails } from '@/types/model-types-constructor';
// import AddOutlineIcon from '@rsuite/icons/AddOutline';
// import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
// import MyModal from '@/components/MyModal/MyModal';
// import { FaBabyCarriage, FaWarehouse } from 'react-icons/fa6';
// import { useConfirmTransProductStockInMutation, useGetInventoryTransactionsProductQuery, useLazyGetQtyInBaseUomQuery, useRemoveInventoryTransactionProductMutation, useSaveInventoryTransactionProductListMutation, useSaveInventoryTransactionProductMutation } from '@/services/inventoryTransactionService';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faCalculator, faEye, faSave } from '@fortawesome/free-solid-svg-icons';
// import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
// import { ColumnConfig } from '@/components/MyNestedTable/MyNestedTable';
// const StockOut = ({ transProduct, setTransProduct, transaction, setTransaction, refetch }) => {

//     const dispatch = useAppDispatch();

//     const [selectedProduct, setSelectedProduct] = useState<ApProducts>({ ...newApProducts });
//     const [products, setProducts] = useState<ApInventoryTransactionProduct[]>([]);
//     const [totalCost, setTotalCost] = useState(0);
//     const { data: productTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PRODUCTS_TYPES');
//     const { data: lotSerialLovQueryResponse } = useGetLovValuesByCodeQuery('LOT_SERIAL');
//     const [selectedWarehouseProduct, setSelectedWarehouseProduct] = useState<ApWarehouseProduct>({ ...newApWarehouseProduct });
//     const [selectedWarehouseProductdetails, setSelectedWarehouseProductdetails] = useState<ApWarehouseProductDetails>({ ...newApWarehouseProductDetails });
//     const [triggerGetQty, { data: qtyInBaseUomResponse, isLoading }] = useLazyGetQtyInBaseUomQuery();
//     const [listRequest, setListRequest] = useState<ListRequest>({
//         ...initialListRequest,
//         filters: [
//             {
//                 fieldName: 'deleted_at',
//                 operator: 'isNull',
//                 value: undefined,
//             },
//             {
//                 fieldName: 'warehouse_key',
//                 operator: 'match',
//                 value: transaction?.warehouseKey
//             },
//         ],
//     });
//     const {
//         data: warehouseProductListResponseLoading,
//         refetch: refetchWarehouseProduct,
//         isFetching
//     } = useGetWarehouseProductsQuery(listRequest);

//     const [uomListRequest, setUomListRequest] = useState<ListRequest>({ ...initialListRequest });

//     const {
//         data: uomGroupsUnitsListResponse,
//         refetch: refetchUomGroupsUnit,
//     } = useGetUomGroupsUnitsQuery(uomListRequest);

//     const [productListRequest, setProductListRequest] = useState<ListRequest>({
//         ...initialListRequest,
//         filters: [
//             {
//                 fieldName: 'deleted_at',
//                 operator: 'isNull',
//                 value: undefined,
//             },
//         ],
//     });
//     const [productselectListRequest, setProductselectListRequest] = useState<ListRequest>({
//         ...initialListRequest,
//         filters: [
//             {
//                 fieldName: 'deleted_at',
//                 operator: 'isNull',
//                 value: undefined,
//             },
//             {
//                 fieldName: 'key',
//                 operator: 'match',
//                 value: transProduct?.productKey,
//             },
//         ],
//     });
//     const {
//         data: productselectListResponseLoading
//     } = useGetProductQuery(productselectListRequest);


//     const [departmentListRequest, setDepartmentListRequest] = useState<ListRequest>({
//         ...initialListRequest,
//         filters: [
//             {
//                 fieldName: 'deleted_at',
//                 operator: 'isNull',
//                 value: undefined,
//             },
//         ],
//     });


//     const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);
//     const calculateCost = (totalQuantity, unitCost) => {
//         return totalQuantity * unitCost;
//     };


//     const handleConvertQuantity = async () => {
//         if (!selectedProduct || !transProduct) return;

//         const result = await triggerGetQty({
//             quantity: transProduct.newQuentity,
//             transUnit: transProduct.transUomKey,
//             toBaseUnit: selectedProduct.baseUomKey,
//             uomGroup: selectedProduct.uomGroupKey,
//         });

//         if (result?.data?.object !== undefined) {
//             setTransProduct(prev => ({
//                 ...prev,
//                 newQuantityBaseUom: result.data.object
//             }));
//         }
//     };

//     useEffect(() => {
//         setListRequest(prev => ({
//             ...prev,
//             filters: [
//                 {
//                     fieldName: 'deleted_at',
//                     operator: 'isNull',
//                     value: undefined
//                 },
//                 {
//                     fieldName: 'warehouse_key',
//                     operator: 'match',
//                     value: transaction?.warehouseKey
//                 },
//             ]
//         }));
//     }, [transaction?.warehouseKey]);

//     const [unitListRequest, setUnitListRequest] = useState<ListRequest>({
//         ...initialListRequest,
//         filters: [
//             {
//                 fieldName: 'deleted_at',
//                 operator: 'isNull',
//                 value: undefined
//             },
//             {
//                 fieldName: 'uom_group_key',
//                 operator: 'match',
//                 value: selectedProduct?.uomGroupKey
//             }

//         ],

//     });

//     useEffect(() => {
//         setUnitListRequest(
//             {
//                 ...initialListRequest,
//                 filters: [
//                     {
//                         fieldName: 'deleted_at',
//                         operator: 'isNull',
//                         value: undefined
//                     },
//                     {
//                         fieldName: 'uom_group_key',
//                         operator: 'match',
//                         value: selectedProduct?.uomGroupKey
//                     }

//                 ],
//             }
//         );
//     }, [selectedProduct]);

//     const {
//         data: UnitsListResponse,
//         refetch: refetchUnit,
//     } = useGetUomGroupsUnitsQuery(unitListRequest);

//     const [productDetailsListRequest, setProductDetailsListRequest] = useState<ListRequest>({
//         ...initialListRequest,
//         filters: [
//             {
//                 fieldName: 'deleted_at',
//                 operator: 'isNull',
//                 value: undefined,
//             },
//             {
//                 fieldName: 'warehouse_product_key',
//                 operator: 'match',
//                 value: selectedWarehouseProduct?.key
//             }
//         ],
//     });

//     useEffect(() => {
//         setProductselectListRequest(prev => ({
//             ...prev,
//             filters: [
//                 {
//                     fieldName: 'deleted_at',
//                     operator: 'isNull',
//                     value: undefined,
//                 },
//                 {
//                     fieldName: 'key',
//                     operator: 'match',
//                     value: transProduct?.productKey,
//                 },
//             ]
//         }));
//     }, [transProduct?.productKey]);


//     useEffect(() => {
//         setTransProduct({ ...transProduct, inventoryTransKey: transaction?.key });
//     }, [transaction?.key]);

//     const [warehouseProductListRequest, setWarehouseProductListRequest] = useState<ListRequest>({
//         ...initialListRequest,
//         filters: [
//             {
//                 fieldName: 'deleted_at',
//                 operator: 'isNull',
//                 value: undefined,
//             },
//             {
//                 fieldName: 'warehouse_key',
//                 operator: 'match',
//                 value: transaction?.warehouseKey
//             },
//             {
//                 fieldName: 'product_key',
//                 operator: 'match',
//                 value: transProduct?.productKey
//             },
//         ],
//     });
//     const {
//         data: warehouseProductSelectedListResponseLoading,
//         refetch: refetchWarehouseProductSelected,
//     } = useGetWarehouseProductsQuery(warehouseProductListRequest);


//       const [deleteProduct, deleteProductMutation] = useRemoveInventoryTransactionProductMutation();
//   const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
//   const [productToDelete, setProductToDelete] = useState<any>(null);
//   const [saveProducts, saveProductsMutation] = useSaveInventoryTransactionProductListMutation();
//   // Save notes effect
//   useEffect(() => {
//     if (saveProductsMutation.status === 'fulfilled') {
//       setProducts(saveProductsMutation.data);
//     } else if (saveProductsMutation.status === 'rejected') {
//       dispatch({ type: 'NOTIFY', payload: { msg: 'Save Failed', sev: 'error' } });
//     }
//   }, [saveProductsMutation.status]);

//   // Delete note effect
//   useEffect(() => {
//     if (deleteProductMutation.status === 'fulfilled') {
//       setProducts(prev => prev.filter(product => product.key !== productToDelete?.key));
//       setProductToDelete(null);
//     } else if (deleteProductMutation.status === 'rejected') {
//       dispatch({ type: 'NOTIFY', payload: { msg: 'Delete Failed', sev: 'error' } });
//     }
//   }, [deleteProductMutation.status]);

//   const handleChange = (value: string, index: number, field: string) => {
//     const updatedProducts = [...products];
//     updatedProducts[index] = { ...updatedProducts[index], [field]: value };
//     setProducts(updatedProducts);
//   };

//     useEffect(() => {

//         setWarehouseProductListRequest(prev => ({
//             ...prev,
//             filters: [
//                 {
//                     fieldName: 'deleted_at',
//                     operator: 'isNull',
//                     value: undefined,
//                 },
//                 {
//                     fieldName: 'warehouse_key',
//                     operator: 'match',
//                     value: transaction?.warehouseKey
//                 },
//                 {
//                     fieldName: 'product_key',
//                     operator: 'match',
//                     value: transProduct?.productKey
//                 },

//             ]
//         }));
//     }, [selectedProduct?.key]);

//     useEffect(() => {
//         setProductDetailsListRequest(prev => ({
//             ...prev,
//             filters: [
//                 {
//                     fieldName: 'deleted_at',
//                     operator: 'isNull',
//                     value: undefined,
//                 },
//                 {
//                     fieldName: 'warehouse_product_key',
//                     operator: 'match',
//                     value: selectedWarehouseProduct?.key
//                 }

//             ]
//         }));

//     }, [selectedWarehouseProduct?.key]);

//     useEffect(() => {
//         console.log(productselectListResponseLoading);
//         if (productselectListResponseLoading?.object?.length > 0) {
//             const firstItem = productselectListResponseLoading.object[0];
//             setSelectedProduct(firstItem);
//             console.log(firstItem);
//         }
//     }, [productselectListResponseLoading?.object]);

//     useEffect(() => {
//         console.log(warehouseProductSelectedListResponseLoading);
//         if (warehouseProductSelectedListResponseLoading?.object?.length > 0) {
//             const firstItem = warehouseProductSelectedListResponseLoading.object[0];
//             setSelectedWarehouseProduct(firstItem);
//             console.log(firstItem);
//         }

//     }, [warehouseProductSelectedListResponseLoading?.object]);

//     const {
//         data: productDetailsListResponseLoading,
//         refetch: refetchProductDetails
//     } = useGetWarehouseProductsDetailsQuery(productDetailsListRequest);


//     useEffect(() => {
//         setTotalCost(Number(calculateCost(transProduct?.newQuentity, transProduct?.newCost)) || 0);
//         console.log("Total Cost:", totalCost);
//     }, [transProduct?.newQuantity, transProduct?.newCost]);







//     // Update product field
//     const handleProductChange = (key: number, field: string, value: any) => {
//         setProducts((prev) =>
//             prev.map((p) => {
//                 // if (p.key === key) {
//                 //   const updated = { ...p, [field]: value };

//                 //   // Calculate totalCost if relevant fields change
//                 //   if (transaction.transTypeLkey === "6509244814441399") { //Stock in
//                 //     if (field === "unitCost" || field === "quantity") {
//                 //       updated. = (updated.newCost || 0) * (updated.newQuentity || 0);
//                 //     }
//                 //   }

//                 //   return updated;
//                 // }
//                 return p;
//             })
//         );
//     };

//     // Update product select
//     const handleSelectProduct = (key: number, value: string) => {
//         const prod = warehouseProductListResponseLoading.find((p) => p.value === value) || null;
//         handleProductChange(key, "product", prod);
//     };

//     useEffect(() => {
//         setListRequest(prev => ({
//             ...prev,
//             filters: [
//                 {
//                     fieldName: 'deleted_at',
//                     operator: 'isNull',
//                     value: undefined
//                 },
//                 {
//                     fieldName: 'warehouse_key',
//                     operator: 'match',
//                     value: transaction?.warehouseKey
//                 },
//             ]
//         }));
//     }, [transaction?.warehouseKey]);


//     useEffect(() => {
//         setUnitListRequest(
//             {
//                 ...initialListRequest,
//                 filters: [
//                     {
//                         fieldName: 'deleted_at',
//                         operator: 'isNull',
//                         value: undefined
//                     },
//                     {
//                         fieldName: 'uom_group_key',
//                         operator: 'match',
//                         value: selectedProduct?.uomGroupKey
//                     }

//                 ],
//             }
//         );
//     }, [selectedProduct]);


//     useEffect(() => {
//         setProductselectListRequest(prev => ({
//             ...prev,
//             filters: [
//                 {
//                     fieldName: 'deleted_at',
//                     operator: 'isNull',
//                     value: undefined,
//                 },
//                 {
//                     fieldName: 'key',
//                     operator: 'match',
//                     value: transProduct?.productKey,
//                 },
//             ]
//         }));
//     }, [transProduct?.productKey]);


//     useEffect(() => {
//         setTransProduct({ ...transProduct, inventoryTransKey: transaction?.key });
//     }, [transaction?.key]);



//     useEffect(() => {
//         console.log(productselectListResponseLoading);
//         if (productselectListResponseLoading?.object?.length > 0) {
//             const firstItem = productselectListResponseLoading.object[0];
//             setSelectedProduct(firstItem);
//             console.log(firstItem);
//         }
//     }, [productselectListResponseLoading?.object]);


//     useEffect(() => {
//         setTotalCost(Number(calculateCost(transProduct?.newQuentity, transProduct?.newCost)) || 0);
//         console.log("Total Cost:", totalCost);
//     }, [transProduct?.newQuantity, transProduct?.newCost]);


//     const [saveTransactionProduct, saveTransactionProductMutation] = useSaveInventoryTransactionProductMutation();
//     const [confirmProductStockIn, confirmProductStockInMutation] = useConfirmTransProductStockInMutation();

//     const handleSavesubchild = async (rowData) => {
//         if (!transaction?.key?.trim()) {
//             dispatch(notify({ msg: 'Error In save Transaction Product', sev: 'error' }));
//             return;
//         }

//         try {
//             await saveTransactionProduct({ ...transProduct }).unwrap();

//             dispatch(
//                 notify({
//                     msg: 'The Inventory Transaction Product Added/Edited successfully',
//                     sev: 'success',
//                 })
//             );

//             // ✅ Refetch from DB and update products
//             const refreshed = await transactionProductRefetch().unwrap();
//             setProducts(refreshed?.object ?? []);
//             console.log("The first refetchh");
//             console.log(refreshed);
//             console.log("The first Productss");
//             console.log(products);

//             // Reset form state
//             setTransProduct({
//                 ...newApInventoryTransactionProduct,
//                 productKey: null,
//                 transUomKey: null,
//                 inventoryTransactionKey: transaction.key,
//             });
//         } catch (e) {
//             if (e.status === 422) {
//                 console.log('Validation error: Unprocessable Entity', e);
//             } else {
//                 console.log('An unexpected error occurred', e);
//                 dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
//             }
//         }
//     };

//     useEffect(() => {
//         handleConvertQuantity();
//     }, [transProduct?.transUomKey, transProduct?.newQuentity]);


//     const [transactionProductListRequest, setTransactionProductListRequest] = useState<ListRequest>({
//         ...initialListRequest,
//         pageSize: 15,
//         filters: [
//             {
//                 fieldName: 'inventory_trans_key',
//                 operator: 'match',
//                 value: transaction?.key
//             }
//         ]
//     });

//     // Fetch transaction product list response
//     const {
//         data: transactionProductListResponseLoading,
//         refetch: transactionProductRefetch,
//         isFetching: transactionProductIsFetching
//     } = useGetInventoryTransactionsProductQuery(transactionProductListRequest);

//     useEffect(() => {
//         const updatedFilters = [
//             {
//                 fieldName: 'inventory_trans_key',
//                 operator: 'match',
//                 value: transaction?.key
//             }
//         ];
//         setTransactionProductListRequest(prevRequest => ({
//             ...prevRequest,
//             filters: updatedFilters
//         }));
//         console.log(transactionProductListResponseLoading);
//     }, [transaction?.key]);

//     useEffect(() => {
//         if (transactionProductListResponseLoading?.object) {
//             setProducts(transactionProductListResponseLoading?.object);
//         }
//     }, [transactionProductListResponseLoading?.object]);


//     const handleAddProductRow = () => {
//         setProducts((prev) => [
//             ...prev,
//             newApInventoryTransactionProduct,
//         ]);
//     };
//     const actionsForItems = rowData => {
//         const handleViewTransactions = () => {
//             console.log('View transactions for:', rowData.name);
//             // TODO: Implement view transactions logic
//         };


//         return (
//             <div className="container-of-actions">
//                 <FontAwesomeIcon
//                     icon={faSave}
//                     title="Save Product"
//                     className="action-icon"
//                     onClick={handleSavesubchild}
//                 />
//             </div>
//         );
//     };



//     useEffect(() => {

//         setWarehouseProductListRequest(prev => ({
//             ...prev,
//             filters: [
//                 {
//                     fieldName: 'deleted_at',
//                     operator: 'isNull',
//                     value: undefined,
//                 },
//                 {
//                     fieldName: 'warehouse_key',
//                     operator: 'match',
//                     value: transaction?.warehouseKey
//                 },
//                 {
//                     fieldName: 'product_key',
//                     operator: 'match',
//                     value: transProduct?.productKey
//                 },

//             ]
//         }));
//     }, [selectedProduct?.key]);



//     const columns: ColumnConfig[] = [
//         {
//             key: 'product',
//             title: 'Product',
//             width: 160,
//             render: (rowData) => (
//                 <MyInput
//                     width="160"
//                     fieldLabel=""
//                     fieldName="productKey"
//                     fieldType="select"
//                     selectData={warehouseProductListResponseLoading?.object ?? []}
//                     selectDataLabel="productName"
//                     selectDataValue="productKey"
//                     Showlabel={false}
//                     record={transProduct}
//                     setRecord={setTransProduct}
//                     onChange={(val) => handleSelectProduct(rowData.key, val)}
//                 />
//             ),
//         },
//         {
//             key: 'BaseUOM',
//             title: 'Base UOM',
//             width: 160,
//             render: (rowData) => (
//                 <MyInput
//                     width="100%"
//                     disabled={true}
//                     fieldLabel="baseUomKey"
//                     showLabel={false}
//                     fieldName="baseUomKey"
//                     fieldType="select"
//                     selectData={uomGroupsUnitsListResponse?.object ?? []}
//                     selectDataLabel="units"
//                     selectDataValue="key"
//                     record={selectedProduct}
//                     setRecord={setSelectedProduct}
//                     onChange={(val) => handleSelectProduct(rowData.key, val)}

//                 />
//             ),
//         },
//         {
//             key: 'quantity',
//             title: 'Quantity',
//             width: 100,
//             render: (rowData) => (
//                 <MyInput width="100%" showLabel={false} fieldLabel="Quantity" fieldType="number" fieldName="newQuentity" record={transProduct} setRecord={setTransProduct} onChange={(val) => handleSelectProduct(rowData.key, val)} />

//             ),

//         },
//         {
//             key: 'transUomKey',
//             title: 'Transaction UOM',
//             width: 130,
//             render: (rowData) => (
//                 <MyInput
//                     width="100%"
//                     fieldLabel="Transaction UOM"
//                     showLabel={false}
//                     fieldName="transUomKey"
//                     fieldType="select"
//                     selectData={UnitsListResponse?.object ?? []}
//                     selectDataLabel="units"
//                     selectDataValue="key"
//                     record={transProduct}
//                     setRecord={setTransProduct}
//                     onChange={(val) => handleSelectProduct(rowData.key, val)}
//                 />
//             ),
//         },
//         {
//             key: 'quentityInBaseUom',
//             title: 'Quentity In Base UOM',
//             width: 130,
//             render: (rowData) => (
//                 <MyInput
//                     width="100%"
//                     disabled={true}
//                     fieldLabel="Quantity in base UOM"
//                     showLabel={false}
//                     fieldName="newQuentityBaseUom"
//                     fieldType="number"
//                     record={transProduct}
//                     setRecord={setTransProduct}
//                     onChange={(val) => handleSelectProduct(rowData.key, val)}
//                 />
//             ),
//         },

//     ];

//     // Conditionally add stock-out columns
//     if (transaction.transTypeLkey === '6509266518641689') {
//         columns.push(
//             {
//                 key: 'inventoryTypeLkey',
//                 title: 'Inventory Type',
//                 width: 120,
//                 render: (rowData) => (
//                     <MyInput
//                         width="100%"
//                         disabled={true}
//                         fieldLabel=""
//                         showLabel={false}
//                         fieldName="inventoryTypeLkey"
//                         fieldType="select"
//                         selectData={lotSerialLovQueryResponse?.object ?? []}
//                         selectDataLabel="lovDisplayVale"
//                         selectDataValue="key"
//                         record={selectedProduct}
//                         setRecord={setSelectedProduct}
//                     />
//                 ),


//             },
//             {
//                 key: 'lotNumber',
//                 title: 'Lot/Serial Number',
//                 width: 130,
//                 render: (rowData) => (
//                     <MyInput
//                         width="100%"
//                         fieldLabel=""
//                         showLabel={false}
//                         fieldName="lotserialnumber"
//                         fieldType="select"
//                         selectData={productDetailsListResponseLoading?.object ?? []}
//                         selectDataLabel="lotSerialNum"
//                         selectDataValue="key"
//                         record={transProduct}
//                         setRecord={record => {
//                             const selectedObject = productDetailsListResponseLoading?.object?.find(item => item.key === record?.lotserialnumber);
//                             setTransProduct({
//                                 ...transProduct,
//                                 lotserialnumber: selectedObject?.key
//                             });
//                             setSelectedWarehouseProductdetails(selectedObject ? { ...selectedObject } : { ...newApWarehouseProductDetails });
//                             console.log(record);
//                         }}
//                     />),
//             },
//             {
//                 key: 'expiryDate',
//                 title: 'Expiry Date',
//                 width: 140,
//                 render: (rowData) => (

//                     <MyInput
//                         disabled={true}
//                         fieldLabel=""
//                         showLabel={false}
//                         width="100%"
//                         fieldName="expiryDate"
//                         fieldType="date"
//                         record={selectedWarehouseProductdetails}
//                         setRecord={setSelectedWarehouseProductdetails}
//                     />
//                 )
//             },
//             {
//                 key: 'expiryDate',
//                 title: 'Expiry Date',
//                 width: 140,
//                 render: (rowData) => (

//                     <MyInput
//                         disabled={true}
//                         fieldLabel=""
//                         showLabel={false}
//                         width="100%"
//                         fieldName="quantity"
//                         record={selectedWarehouseProductdetails}
//                         setRecord={setSelectedWarehouseProductdetails}
//                     />
//                 )
//             },

//             {
//                 key: 'notes',
//                 title: 'Notes',
//                 width: 140,
//                 render: (rowData) => (
//                     <MyInput
//                         width="100%"
//                         showLabel={false}
//                         fieldLabel="Notes"
//                         fieldName="notes"
//                         record={transProduct}
//                         setRecord={setTransProduct}
//                         onChange={(val) => handleSelectProduct(rowData.key, val)}
//                     />
//                 )


//             },
//             {
//                 key: 'statusLkey',
//                 title: <Translate>Status</Translate>,
//                 width: 100,
//                 render: rowData => {
//                     const status = rowData?.statusLkey || '164797574082125';

//                     const getStatusConfig = status => {
//                         switch (status) {
//                             case '164797574082125':
//                                 return {
//                                     backgroundColor: 'var(--light-green)',
//                                     color: 'var(--primary-green)',
//                                     contant: 'New'
//                                 };
//                             case '1804482322306061':
//                                 return {
//                                     backgroundColor: 'var(--light-orange)',
//                                     color: 'var(--primary-orange)',
//                                     contant: 'Submitted'
//                                 };
//                             default:
//                                 return {
//                                     backgroundColor: 'var(--background-gray)',
//                                     color: 'var(--primary-gray)',
//                                     contant: 'Unknown'
//                                 };
//                         }
//                     };

//                     const config = getStatusConfig(status);
//                     return (
//                         <MyBadgeStatus
//                             backgroundColor={config.backgroundColor}
//                             color={config.color}
//                             contant={config.contant}
//                         />
//                     );
//                 }
//             },


//             {
//                 key: 'actions',
//                 title: <Translate>Actions</Translate>,
//                 width: 120,
//                 render: rowData => actionsForItems(rowData)
//             }
//         );

//     }

//     return (
//         <Form fluid>

//             <div className="table-buttons-right">

//                 <MyButton appearance="primary" onClick={handleAddProductRow} disabled={!transaction?.key}>
//                     Add Product
//                 </MyButton>
//                 <MyButton appearance="ghost" onClick={handleAddProductRow} disabled={!transaction?.key}>
//                     Confirm
//                 </MyButton>

//             </div>

//             <MyTable
//                 data={products}
//                 columns={columns}
//                 height={300}
//             />


//         </Form>
//     );
// };
// export default StockOut;



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
import { useConfirmTransProductStockInMutation, useConfirmTransProductStockOutMutation, useGetInventoryTransactionsProductQuery, useLazyGetQtyInBaseUomQuery, useRemoveInventoryTransactionProductMutation, useSaveInventoryTransactionProductListMutation, useSaveInventoryTransactionProductMutation } from '@/services/inventoryTransactionService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalculator, faDeleteLeft, faEye, faSave } from '@fortawesome/free-solid-svg-icons';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { ColumnConfig } from '@/components/MyNestedTable/MyNestedTable';
const StockOut = ({ transProduct, setTransProduct, transaction, setTransaction, refetch }) => {
    const dispatch = useAppDispatch();

    const [selectedProduct, setSelectedProduct] = useState<ApProducts>({ ...newApProducts });
    const [triggerGetQty, { data: qtyInBaseUomResponse, isLoading }] = useLazyGetQtyInBaseUomQuery();
    const [generateCode, setGenerateCode] = useState();
    const [totalCost, setTotalCost] = useState(0);
    const [recordOfWarehouseCode, setRecordOfWarehouseCode] = useState({ warehouseId: '' });
    const { data: productTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PRODUCTS_TYPES');
    const { data: lotSerialLovQueryResponse } = useGetLovValuesByCodeQuery('LOT_SERIAL');
    const [confirmProductStockOut, confirmProductStockOutMutation] = useConfirmTransProductStockOutMutation();
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

    const handleDeleteProduct = (rowData, index) => {
        setProductToDelete(rowData);
        setConfirmDeleteOpen(true);
        if (rowData?.key) {
            confirmDelete(index);
        } else {
            setProducts((prev) => prev.filter((_, i) => i !== index));
            dispatch(notify({ msg: 'products deleted successfully', sev: 'success' }));
            setConfirmDeleteOpen(false);
        }
    };

    const confirmDelete = async (index) => {
        if (productToDelete?.key) {
            try {
                await deleteProduct(productToDelete).unwrap();
            } catch (error) {
                dispatch(notify({ msg: 'Failed to delete product', sev: 'error' }));

            }
        }
        setProducts((prev) => prev.filter((_, i) => i !== index));
        setConfirmDeleteOpen(false);
    };

    const [productDetailsListRequest, setProductDetailsListRequest] = useState<ListRequest>({
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
        data: productDetailsListResponseLoading,
        refetch: refetchProductDetails
    } = useGetWarehouseProductsDetailsQuery(productDetailsListRequest);



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

    const handleSavechildOut = () => {
        confirmProductStockOut({
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
         setProducts(transactionProductListResponseLoading?.object ?? [])
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
                    valueKey="key"
                    onChange={(val) => {
                        const selectedWarehouseProduct = (warehouseProductListResponseLoading?.object ?? [])
                            .find((p) => p.key === val);

                        if (selectedWarehouseProduct) {
                            handleRowChange(index, 'warehouseProductObj', selectedWarehouseProduct);

                            handleRowChange(index, 'productKey', selectedWarehouseProduct.productKey);
                            const selectedProduct = (productListResponseLoading?.object ?? [])
                                .find((p) => p.key === selectedWarehouseProduct.productKey);


                            handleRowChange(index, 'productObj', selectedProduct);
                        }
                    }}
                    cleanable={true}
                    searchable={true}
                    style={{ width: 160 }}
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
                <SelectPicker
                    data={
                        (productDetailsListResponseLoading?.object ?? []).filter(
                            (u) => u.warehouseProductKey === rowData?.warehouseProductObj?.key
                        )
                    }
                    value={rowData.lotserialnumber}
                    labelKey="lotSerialNum"
                    valueKey="key"
                    onChange={record => {
                        const selectedObject = productDetailsListResponseLoading?.object?.find(item => item.key === rowData?.lotserialnumber);
                        handleRowChange(index, 'lotserialnumber', record);
                        handleRowChange(index, 'lotSerialObj', selectedObject);
                       

                    }}
                    cleanable={true}
                    searchable={true}
                    style={{ width: 160 }}
                     disabled={rowData?.statusLkey == '1804482322306061'}
                />
            ),
        },
        {
            key: 'quantity',
            title: 'Available Quantity ',
            width: 180,
            render: (rowData, index) => (
                <Input
                    type="number"
                    value={rowData?.lotSerialObj?.quantity}
                    style={{ width: 160 }}
                    disabled
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

    // Conditionally add stock-out columns
    if (transaction.transTypeLkey === '6509266518641689') {
        columns.push(

            {
                key: 'expiryDate',
                title: 'Expiry Date',
                width: 140,
                render: (rowData, index) => (
                    <Input
                        type="date"
                        value={rowData.lotSerialObj?.expiryDate}
                        style={{ width: '100%' }}
                        disabled
                    />
                ),
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
            acc.quantity += Number(item.newQuentity || 0);
            return acc;
        },
        { quantity: 0, items: 0, queentitybase: 0 }
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
                <MyButton appearance="ghost" onClick={handleSavechildOut} disabled={!transaction?.key}>
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
                actionButtonFunction={handleDeleteProduct}
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
            </div>
        </Form>
    );
};
export default StockOut;
