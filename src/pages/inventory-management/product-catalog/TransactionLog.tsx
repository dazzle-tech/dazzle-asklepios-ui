import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Col, Form, Panel, Row } from 'rsuite';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import { FaSyringe } from 'react-icons/fa';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { notify } from '@/utils/uiReducerActions';
import { ApInventoryTransaction, ApVaccine, ApWarehouse, ApWarehouseProduct } from '@/types/model-types';
import { newApInventoryTransaction, newApVaccine, newApWarehouse, newApWarehouseProduct } from '@/types/model-types-constructor';
import MyInput from '@/components/MyInput';
import './styles.less';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, formatDateWithoutSeconds, fromCamelCaseToDBName } from '@/utils';
import {
  useGetVaccineListQuery,
  useDeactiveActivVaccineMutation,
  useGetWarehouseQuery,
  useGetDepartmentsQuery,
  useSaveWarehouseMutation,
  useRemoveWarehouseMutation,
  useGetWarehouseProductsQuery,
  useGetProductQuery,
  useGetLovValuesByCodeAndParentQuery,
  useGetUomGroupsUnitsQuery,
  useRemoveWarehouseProductsMutation,
  useSaveWarehouseProductsMutation,
  useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import { FaClock, FaHourglass, FaUser } from 'react-icons/fa6';
import ProductDetails from './ProductDetails';
import { useGetInventoryTransactionsProductQuery, useGetInventoryTransactionsQuery } from '@/services/inventoryTransactionService';
const TransactionLog = ({ selectedProduct }) => {
 const dispatch = useAppDispatch();
     const [open, setOpen] = useState(false);
     const [inventoryTransaction, setInventoryTransaction] = useState<ApInventoryTransaction>({ ...newApInventoryTransaction});
     const [dateFilter, setDateFilter] = useState({ fromDate: '', toDate: '' });
     const [transactionListRequest, setTransactionListRequest] = useState<ListRequest>({
         ...initialListRequest,
         filters: [
             {
                 fieldName: 'deleted_at',
                 operator: 'isNull',
                 value: undefined,
             },
         ],
     });
 
     const [transactionProductListRequest, setTransactionProductListRequest] = useState<ListRequest>({
         ...initialListRequest,
         filters: [
             {
                 fieldName: 'deleted_at',
                 operator: 'isNull',
                 value: undefined,
             },
                   {
                 fieldName: 'product_key',
                 operator: 'isNull',
                 value: selectedProduct?.key,
             },
         ],
     });
 
     const { data: transTypeListResponse, refetch: refetchTransType } = useGetLovValuesByCodeQuery('STOCK_TRANSACTION_TYPES');
 
     const { data: transReasonInListResponse } = useGetLovValuesByCodeQuery('STOCK_IN_REASONS');
 
     const { data: transReasonOutListResponse } = useGetLovValuesByCodeQuery('STOCK_OUT_REASONS');
 
     const { data: warehouseListResponse } = useGetWarehouseQuery(transactionListRequest);
 
     const { data: inventoryTransListResponse } = useGetInventoryTransactionsQuery(transactionListRequest);
 
 
     const { data: inventoryTransProductListResponse, refetch: refetchTransProduct } = useGetInventoryTransactionsProductQuery(transactionProductListRequest);
 
     // Initialize list request with default filters
     const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest, filters: [] });
 
 
     const [productsListRequest, setProductsListRequest] = useState<ListRequest>({
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
         data: productListResponseLoading,
         refetch: refetchProduct,
         isFetching: productListIsFetching
     } = useGetProductQuery(productsListRequest);
 
     const [uomListRequest, setUomListRequest] = useState<ListRequest>({ ...initialListRequest });
 
     const {
         data: uomGroupsUnitsListResponse,
         refetch: refetchUomGroupsUnit,
     } = useGetUomGroupsUnitsQuery(uomListRequest);
 
       const calculateCost = (totalQuantity, unitCost) => {
         return totalQuantity * unitCost;
     };
 
     const columns = [
         { key: 'index', title: '#', render: (rowData, rowIndex) => rowIndex + 1 },
         {
             key: 'transactionId',
             title: <Translate>Transaction ID</Translate>,
             flexGrow: 4,
             render: rowData => (
                 <span>
                     {conjureValueBasedOnKeyFromList(
                         inventoryTransListResponse?.object ?? [],
                         rowData.transactionObj?.transId,
                         'transId'
                     )}
                 </span>
             )
         },
         {
             key: 'transactionType',
             title: <Translate>Transaction Type</Translate>,
             flexGrow: 4,
             render: rowData => (
                 <span>
                     {conjureValueBasedOnKeyFromList(
                         transTypeListResponse?.object ?? [],
                         rowData.transactionObj?.transTypeLkey,
                         'lovDisplayVale'
                     )}
                 </span>
             )
         },
                 {
             key: 'transReason',
             title: <Translate>Transaction Reason</Translate>,
             flexGrow: 4,
             render: rowData => (
                 <span>
                     {conjureValueBasedOnKeyFromList(
                         rowData.transactionObj?.transTypeLkey === '6509244814441399' ? transReasonInListResponse?.object ?? [] : transReasonOutListResponse?.object ?? [],
                         rowData.transactionObj?.transReasonLkey,
                         'lovDisplayVale'
                     )}
                 </span>
             )
         },
         {
             key: 'warehouseName',
             title: <Translate>Warehouse Name</Translate>,
             flexGrow: 4,
             render: rowData => (
                 <span>
                     {conjureValueBasedOnKeyFromList(
                         warehouseListResponse?.object ?? [],
                         rowData.warehouseObj?.key,
                         'warehouseName'
                     )}
                 </span>
             )
         },
         { key: 'Quantity', title: 'QUANTITY', dataKey: 'newQuentity' },
         
           {
             key: 'productUOM',
             title: <Translate>Product Transaction UOM</Translate>,
             flexGrow: 4,
             render: rowData => (
                 <span>
                     {conjureValueBasedOnKeyFromList(
                         uomGroupsUnitsListResponse?.object ?? [],
                         rowData.transUomKey,
                         'units'
                     )}
                 </span>
             )
         },
         { key: 'newCost', title: 'COST PER UNIT', dataKey: 'newCost' },
         { key: 'expiryDate', title: 'EXPIRY DATE', dataKey: 'expiryDate' },
         { key: 'lotserialnumber', title: 'LOT/SERIAL Number', dataKey: 'lotserialnumber' },
         
         { 
             key: 'AverageCostAfter', 
             title: 'Average Cost After', 
             flexGrow: 4,
             render: rowData => (
                 <span>
                     { calculateCost(rowData.newQuentity, rowData.newCost).toFixed(2) }
                       
                 </span>
             )
         },
           { 
          key: 'createdAt',
          title: 'Performed By/At', 
           flexGrow: 4,
           render: (row: any) =>
                          row?.createdAt ? (
                              <>
                                  <br/>
                                  <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
                              </>
                          ) : (
                              ' '
                          ),
                         },
     ];
     // handle manual search from date to date 
     const handleManualSearch = () => {
         if (dateFilter.fromDate && dateFilter.toDate) {
             const formattedFromDate = dateFilter.fromDate;
             const formattedToDate = dateFilter.toDate;
             setListRequest(
                 addFilterToListRequest(
                     'created_at',
                     'between',
                     formattedFromDate + '_' + formattedToDate,
                     listRequest
                 )
             );
         } else if (dateFilter.fromDate) {
             const formattedFromDate = dateFilter.fromDate;
             setListRequest(
                 addFilterToListRequest('created_at', 'gte', formattedFromDate, listRequest)
             );
         } else if (dateFilter.toDate) {
             const formattedToDate = dateFilter.toDate;
             setListRequest(
                 addFilterToListRequest('created_at', 'lte', formattedToDate, listRequest)
             );
         } else {
             setListRequest({ ...listRequest, filters: [] });
         }
     };
 
     useEffect(() => {
             return () => {
                 dispatch(setPageCode(''));
                 dispatch(setDivContent('  '));
             };
         }, [location.pathname, dispatch]);
 
     // Effects
     useEffect(() => {
         handleManualSearch();
     }, []);
     // page header setup
     dispatch(setPageCode('Inventory_Transaction'));
     return (
         <div className='container-div'>
            
             <MyTable
                 data={inventoryTransProductListResponse?.object ?? []}
                 columns={columns}
                 height={800}
                 loading={false}
             />
         </div>
 
     );
};

export default TransactionLog;