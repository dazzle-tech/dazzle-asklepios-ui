import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import InfoCardList from '@/components/InfoCardList';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useGetInventoryTransactionsAttachmentQuery,
  useGetInventoryTransactionsProductQuery,
  useGetInventoryTransactionsQuery
} from '@/services/inventoryTransactionService';
import {
  useGetLovValuesByCodeQuery,
  useGetProductQuery,
  useGetUomGroupsUnitsQuery,
  useGetWarehouseQuery
} from '@/services/setupService';
import { ApInventoryTransaction, ApInventoryTransactionProduct } from '@/types/model-types';
import {
  newApInventoryTransaction,
  newApInventoryTransactionProduct
} from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import {
  addFilterToListRequest,
  conjureValueBasedOnKeyFromList,
  formatDateWithoutSeconds
} from '@/utils';
import { faEdit, faFileExport, faPlus, faWarehouse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import AddEditTransaction from './AddEditTransaction';
import './styles.less';

const InventoryTransaction = () => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [searchTrans, setSearchTrans] = useState<ApInventoryTransactionProduct>({
    ...newApInventoryTransactionProduct
  });
  const [inventoryTransaction, setInventoryTransaction] = useState<ApInventoryTransaction>({
    ...newApInventoryTransaction
  });

  const [transactionListRequest, setTransactionListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [{ fieldName: 'deleted_at', operator: 'isNull', value: undefined }]
  });

  const [transactionProductListRequest, setTransactionProductListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [{ fieldName: 'deleted_at', operator: 'isNull', value: undefined }]
  });

  const { data: transTypeListResponse } = useGetLovValuesByCodeQuery('STOCK_TRANSACTION_TYPES');
  const { data: transReasonInListResponse } = useGetLovValuesByCodeQuery('STOCK_IN_REASONS');
  const { data: transReasonOutListResponse } = useGetLovValuesByCodeQuery('STOCK_OUT_REASONS');

  const { data: warehouseListResponse } = useGetWarehouseQuery(transactionListRequest);
  const { data: inventoryTransListResponse } =
    useGetInventoryTransactionsQuery(transactionListRequest);

  const { data: inventoryTransAttachmentListResponse, refetch: refetchTransAttachment } =
    useGetInventoryTransactionsAttachmentQuery(transactionListRequest);

  const {
    data: inventoryTransProductListResponse,
    refetch: refetchTransProduct,
    isLoading,
    isFetching
  } = useGetInventoryTransactionsProductQuery(transactionProductListRequest);

  // Initialize list request with default filters
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: []
  });

  const [productsListRequest, setProductsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [{ fieldName: 'deleted_at', operator: 'isNull', value: undefined }]
  });
  const { data: productListResponseLoading } = useGetProductQuery(productsListRequest);

  const [uomListRequest, setUomListRequest] = useState<ListRequest>({ ...initialListRequest });
  const { data: uomGroupsUnitsListResponse } = useGetUomGroupsUnitsQuery(uomListRequest);

  const calculateCost = (totalQuantity: number, unitCost: number) =>
    Number(totalQuantity || 0) * Number(unitCost || 0);

  // Pagination
  const pageIndex = (transactionProductListRequest.pageNumber || 1) - 1;
  const rowsPerPage = transactionProductListRequest.pageSize;
  const totalCount = inventoryTransProductListResponse?.extraNumeric ?? 0;

  const handlePageChange = (_: unknown, newPage: number) => {
    setTransactionProductListRequest({ ...transactionProductListRequest, pageNumber: newPage + 1 });
  };
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTransactionProductListRequest({
      ...transactionProductListRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };

  // Date filter
  const [dateFilter, setDateFilter] = useState({ fromDate: new Date(), toDate: new Date() });

  const updateFilter = (fieldName: string, operator: string, value?: string | number) => {
    setListRequest(prev => {
      const newFilters = prev.filters.filter(f => f.fieldName !== fieldName);
      if (value !== undefined && value !== null && value !== '') {
        newFilters.push({ fieldName, operator, value: String(value) });
      }
      return { ...prev, filters: newFilters, pageNumber: 1 };
    });
  };

  useEffect(() => {
    if (dateFilter.fromDate && dateFilter.toDate) {
      const from = new Date(dateFilter.fromDate);
      const to = new Date(dateFilter.toDate);
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      updateFilter('created_at', 'between', `${from.getTime()}_${to.getTime()}`);
    } else {
      updateFilter('created_at', 'between', undefined);
    }
  }, [dateFilter]);

  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState<any>(null);
  const [detailsType, setDetailsType] = useState<'product' | 'warehouse' | null>(null);

  const dataDetails = () => (
    <div>
      <MyModal
        hideActionBtn
        title={detailsType === 'product' ? 'Product Details' : 'Warehouse Details'}
        open={openDetailsModal}
        setOpen={setOpenDetailsModal}
        size="xs"
        bodyheight="30vh"
        steps={[
          {
            title: detailsType === 'product' ? 'Product Details' : 'Warehouse Details',
            icon: <FontAwesomeIcon icon={faWarehouse} />
          }
        ]}
        content={
          <>
            {detailsType === 'product' && selectedItemDetails && (
              <InfoCardList
                list={[selectedItemDetails]}
                fields={['name', 'code', 'typeLkey', 'barecode', 'inventoryTypeLkey']}
                titleField="name"
                fieldLabels={{
                  name: 'Product Name',
                  code: 'Code',
                  typeLkey: 'Type',
                  barecode: 'Barcode',
                  inventoryTypeLkey: 'Inventory Type'
                }}
              />
            )}

            {detailsType === 'warehouse' && selectedItemDetails && (
              <InfoCardList
                list={[selectedItemDetails]}
                fields={['warehouseId', 'warehouseName', 'location', 'Capacity', 'departmenKey']}
                titleField="warehouseName"
                fieldLabels={{
                  warehouseName: 'Warehouse Name',
                  warehouseId: 'Code',
                  location: 'Location',
                  Capacity: 'Capacity',
                  departmenKey: 'Department'
                }}
              />
            )}
          </>
        }
      />
    </div>
  );

  const actionsForItems = (rowData: any) => (
    <div className="container-of-actions">
      <FontAwesomeIcon
        icon={faEdit}
        title="Edit Transaction"
        className="action-icon"
        onClick={() => {
          setOpen(true);
          setInventoryTransaction(rowData?.transactionObj);
        }}
      />
    </div>
  );

  /** ---------- Selection Like EncounterList (single row) ---------- **/
  const getStableKey = (row: any): string | undefined =>
    row?.key ??
    row?.transactionProductKey ??
    row?.transactionObj?.key ??
    row?.transactionObj?.transId ??
    undefined;

  const pageData = useMemo(
    () => inventoryTransProductListResponse?.object ?? [],
    [inventoryTransProductListResponse?.object]
  );

  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);

  const isSelected = (rowData: any) => {
    const k = getStableKey(rowData);
    return k && selectedRowKey === k ? 'selected-row' : '';
  };

  const handleRowClick = (rowData: any) => {
    const k = getStableKey(rowData);
    if (!k) return;
    setSelectedRowKey(prev => (prev === k ? null : k)); // toggle
  };

  const columns = [
    {
      key: 'index',
      title: '#',
      render: (_rowData: any, rowIndex: number) => {
        const page = transactionProductListRequest.pageNumber; // 1-based
        const pageSize = transactionProductListRequest.pageSize;
        return (page - 1) * pageSize + (rowIndex + 1);
      }
    },
    {
      key: 'transactionId',
      title: <Translate>Transaction ID</Translate>,
      flexGrow: 4,
      render: (rowData: any) => (
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
      render: (rowData: any) => (
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
      render: (rowData: any) => (
        <span>
          {conjureValueBasedOnKeyFromList(
            rowData.transactionObj?.transTypeLkey === '6509244814441399'
              ? transReasonInListResponse?.object ?? []
              : transReasonOutListResponse?.object ?? [],
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
      render: (rowData: any) => (
        <span
          className="table-link"
          onClick={e => {
            e.stopPropagation();
            setSelectedItemDetails(rowData.warehouseObj);
            setDetailsType('warehouse');
            setOpenDetailsModal(true);
          }}
        >
          {conjureValueBasedOnKeyFromList(
            warehouseListResponse?.object ?? [],
            rowData.warehouseObj?.key,
            'warehouseName'
          )}
        </span>
      )
    },
    {
      key: 'productName',
      title: <Translate>Product Name</Translate>,
      flexGrow: 4,
      render: (rowData: any) => (
        <span
          className="table-link"
          onClick={e => {
            e.stopPropagation();
            setSelectedItemDetails(rowData.productObj);
            setDetailsType('product');
            setOpenDetailsModal(true);
          }}
        >
          {conjureValueBasedOnKeyFromList(
            productListResponseLoading?.object ?? [],
            rowData.productObj?.key,
            'name'
          )}
        </span>
      )
    },
    {
      key: 'productcode',
      title: <Translate>Product code</Translate>,
      flexGrow: 4,
      render: (rowData: any) => (
        <span>
          {conjureValueBasedOnKeyFromList(
            productListResponseLoading?.object ?? [],
            rowData.productObj?.key,
            'code'
          )}
        </span>
      )
    },
    { key: 'Quantity', title: 'QUANTITY', dataKey: 'newQuentity' },
    {
      key: 'productUOM',
      title: <Translate>Product Base UOM</Translate>,
      flexGrow: 4,
      render: (rowData: any) => (
        <span>
          {conjureValueBasedOnKeyFromList(
            uomGroupsUnitsListResponse?.object ?? [],
            rowData.productObj?.baseUomKey,
            'units'
          )}
        </span>
      )
    },
    {
      key: 'productUOMTrans',
      title: <Translate>Product Transaction UOM</Translate>,
      flexGrow: 4,
      render: (rowData: any) => (
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
      key: 'totalCost',
      title: 'Total cost',
      flexGrow: 4,
      render: (rowData: any) => (
        <span>{calculateCost(rowData.newQuentity, rowData.newCost).toFixed(2)}</span>
      )
    },
    { key: 'oldAvgCost', title: 'Avg cost Befor', dataKey: 'oldAvgCost' },
    { key: 'newAvgCost', title: 'Avg cost After', dataKey: 'newAvgCost' },
    { key: 'notes', title: 'Note', dataKey: 'notes' },
    {
      key: 'statusLkey',
      title: <Translate>Status</Translate>,
      width: 100,
      render: (rowData: any) => {
        const status = rowData?.statusLkey || '164797574082125';
        const getStatusConfig = (st: string) => {
          switch (st) {
            case '164797574082125':
              return {
                backgroundColor: 'var(--light-green)',
                color: 'var(--primary-green)',
                contant: 'New'
              };
            case '5959341154465084':
              return {
                backgroundColor: 'var(--light-blue)',
                color: 'var(--primary-blue)',
                contant: 'Requested'
              };
            case '1804482322306061':
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
      key: 'createdAt',
      title: 'Performed By/At',
      flexGrow: 4,
      render: (row: any) =>
        row?.createdAt ? (
          <>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      width: 120,
      render: (rowData: any) => actionsForItems(rowData)
    }
  ];

  // handle manual search from date to date
  const handleManualSearch = () => {
    if (dateFilter.fromDate && dateFilter.toDate) {
      const formattedFromDate = dateFilter.fromDate as unknown as string;
      const formattedToDate = dateFilter.toDate as unknown as string;
      setListRequest(
        addFilterToListRequest(
          'created_at',
          'between',
          formattedFromDate + '_' + formattedToDate,
          listRequest
        )
      );
    } else if (dateFilter.fromDate) {
      const formattedFromDate = dateFilter.fromDate as unknown as string;
      setListRequest(addFilterToListRequest('created_at', 'gte', formattedFromDate, listRequest));
    } else if (dateFilter.toDate) {
      const formattedToDate = dateFilter.toDate as unknown as string;
      setListRequest(addFilterToListRequest('created_at', 'lte', formattedToDate, listRequest));
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

  useEffect(() => {
    handleManualSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setListRequest(prevState => ({
      ...prevState,
      filters: [
        ...prevState.filters.filter(
          f =>
            !['gender_lkey', 'document_type_lkey', 'insurance_provider_lkey'].includes(f.fieldName)
        ),
        (searchTrans as any).inventoryTransKey && {
          fieldName: 'inventory_trans_key',
          operator: 'match',
          value: (searchTrans as any).inventoryTransKey
        }
      ].filter(Boolean) as any
    }));
  }, [searchTrans.inventoryTransKey]);

  useEffect(() => {
    handleManualSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  const divContent = 'Inventory Transaction';
  dispatch(setPageCode('Inventory_Transaction'));
  dispatch(setDivContent(divContent));

  const tablebuttons = (
    <div className="bt-right-group">
      <div className="btns-group">
        <MyButton
          prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
          onClick={() => {
            setOpen(true), setInventoryTransaction({ ...newApInventoryTransaction });
          }}
        >
          Add Transaction
        </MyButton>
        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faFileExport} />}>
          Export to Xsl
        </MyButton>
      </div>
      {/* اختياري: عرض المفتاح المحدد */}
      <div className="selected-counter">Selected: {selectedRowKey ?? 'None'}</div>
    </div>
  );

  const filters = (
    <>
      <Form layout="inline" fluid>
        <MyInput
          column
          fieldLabel="From Date"
          fieldType="date"
          fieldName="fromDate"
          record={dateFilter}
          setRecord={setDateFilter}
        />
        <MyInput
          column
          fieldLabel="To Date"
          fieldType="date"
          fieldName="toDate"
          record={dateFilter}
          setRecord={setDateFilter}
        />
        <MyInput
          column
          fieldLabel="Transaction ID"
          fieldName="transactionId"
          record={searchTrans}
          setRecord={setSearchTrans}
        />
        <MyInput
          column
          fieldLabel="Product Type"
          fieldType="select"
          fieldName="productTypeLkey"
          selectData={[]}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={searchTrans}
          setRecord={setSearchTrans}
        />
        <MyInput
          column
          fieldLabel="code"
          fieldName="transactionId"
          record={searchTrans}
          setRecord={setSearchTrans}
        />
        <MyInput
          column
          fieldLabel="Transaction Type"
          fieldType="select"
          fieldName="documentTypeLkey"
          selectData={[]}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={searchTrans}
          setRecord={setSearchTrans}
        />
        <MyInput
          column
          fieldLabel="Warehouse Name"
          fieldType="select"
          fieldName="warehouseLkey"
          selectData={[]}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={searchTrans}
          setRecord={setSearchTrans}
        />
      </Form>
      <AdvancedSearchFilters searchFilter={true} />
    </>
  );

  return (
    <div className="container-div">
      <MyTable
        data={pageData}
        columns={columns}
        height={1000}
        loading={isLoading || isFetching}
        filters={filters}
        tableButtons={tablebuttons}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowClassName={isSelected}
        onRowClick={handleRowClick}
      />
      <AddEditTransaction
        open={open}
        setOpen={setOpen}
        transaction={inventoryTransaction}
        setTransaction={setInventoryTransaction}
        refetch={refetchTransProduct}
        refetchAttachmentList={refetchTransAttachment}
      />
      {dataDetails()}
    </div>
  );
};

export default InventoryTransaction;
