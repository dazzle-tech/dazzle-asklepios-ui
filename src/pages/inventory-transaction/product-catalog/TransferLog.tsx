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
import { ApInventoryTransfer, ApVaccine, ApWarehouse, ApWarehouseProduct } from '@/types/model-types';
import { newApInventoryTransfer, newApVaccine, newApWarehouse, newApWarehouseProduct } from '@/types/model-types-constructor';
import MyInput from '@/components/MyInput';
import './styles.less';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, formatDateWithoutSeconds, fromCamelCaseToDBName } from '@/utils';
import {
  useGetVaccineListQuery,
  useDeactiveActivVaccineMutation,
  useGetWarehouseQuery,
  useGetProductQuery,
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
import { useGetInventoryTransferQuery } from '@/services/inventoryTransactionService';
const TransferLog = ({ selectedProduct }) => {
  
      const [open, setOpen] = useState(false);
      const [transfer, setTransfer] = useState<ApInventoryTransfer>({ ...newApInventoryTransfer });
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
  
      const { data: transstatusListResponse, refetch: refetchTransStatus } = useGetLovValuesByCodeQuery('LABRAD_ORDER_STATUS');
  
      const { data: warehouseListResponse } = useGetWarehouseQuery(transactionListRequest);
  
      // const { data: inventoryTransListResponse } = useGetInventoryTransactionsQuery(transactionListRequest);
  
      const { data: inventoryTransListResponse, refetch: refetchTransProduct } = useGetInventoryTransferQuery(transactionProductListRequest);
  
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
          { key: 'transNo', title: 'Transfer No', dataKey: 'transNo' },
          { key: 'transReason', title: 'Transfer Reason', dataKey: 'transReason' },
          {
              key: 'fromWarehouse',
              title: <Translate>From Warehouse</Translate>,
              flexGrow: 4,
              render: rowData => (
                  <span>
                      {conjureValueBasedOnKeyFromList(
                          warehouseListResponse?.object ?? [],
                          rowData.fromWarehouseKey,
                          'warehouseName'
                      )}
                  </span>
              )
          },
          {
              key: 'toWarehouse',
              title: <Translate>To Warehouse</Translate>,
              flexGrow: 4,
              render: rowData => (
                  <span>
                      {conjureValueBasedOnKeyFromList(
                          warehouseListResponse?.object ?? [],
                          rowData.toWarehouseKey,
                          'warehouseName'
                      )}
                  </span>
              )
          },
          {
              key: 'statusLkey',
              title: <Translate>Transfer Status</Translate>,
              flexGrow: 4,
              render: rowData => (
                  <span>
                      {conjureValueBasedOnKeyFromList(
                          transstatusListResponse?.object ?? [],
                          rowData.statusLkey,
                          'lovDisplayVale'
                      )}
                  </span>
              )
          },
          { key: 'note', title: 'NOTE', dataKey: 'note' },
          {
              key: 'createdAt',
              title: 'Initiated By/At',
              flexGrow: 4,
              render: (row: any) =>
                  row?.createdAt ? (
                      <>
                          <br />
                          <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
                      </>
                  ) : (
                      ' '
                  ),
          }
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
      // Effects
      useEffect(() => {
          handleManualSearch();
      }, []);
  
  
      return (
          <div className='container-div'>
              <MyTable
                  data={inventoryTransListResponse?.object ?? []}
                  columns={columns}
                  height={800}
                  loading={false}
              />
          </div>
  
      );
};

export default TransferLog;