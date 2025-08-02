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
import { ApVaccine, ApWarehouse, ApWarehouseProduct } from '@/types/model-types';
import { newApVaccine, newApWarehouse, newApWarehouseProduct } from '@/types/model-types-constructor';
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
} from '@/services/setupService';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import { FaClock, FaHourglass, FaUser } from 'react-icons/fa6';
import ProductDetails from './ProductDetails';
const WarehouseDistribution = ({ selectedProduct }) => {
  const dispatch = useAppDispatch();
  const [warehouseProduct, setWarehouseProduct] = useState<ApWarehouseProduct>({ ...newApWarehouseProduct });
  const [openConfirmDeleteWarehouseModal, setOpenConfirmDeleteWarehouseModal] =
    useState<boolean>(false);
  const [saveWarehouseProduct, saveWarehouseProductMutation] = useSaveWarehouseProductsMutation();
  const [removeWarehouseProduct, removeWarehouseProductMutation] = useRemoveWarehouseProductsMutation();
  const [stateOfDeleteWarehouseModal, setStateOfDeleteWarehouseModal] = useState<string>('delete');
  const [openAddEditPopup, setOpenAddEditPopup] = useState(false);
  const [edit_new, setEdit_new] = useState(false);
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest
  });

  const { data: productTypeLovQueryResponse } = useGetLovValuesByCodeAndParentQuery('PRODUCTS_TYPES');
  const [uomListRequest, setUomListRequest] = useState<ListRequest>({ ...initialListRequest });

  const {
    data: uomGroupsUnitsListResponse,
    refetch: refetchUomGroupsUnit,
  } = useGetUomGroupsUnitsQuery(uomListRequest);
  const [warehouseProductListRequest, setWarehouseProductListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15,
    filters: [
      {
        fieldName: 'product_key',
        operator: 'match',
        value: selectedProduct?.key
      }
    ]
  });

  // Fetch warehouse product list response
  const {
    data: warehouseProductListResponseLoading,
    refetch: warehouseProductRefetch,
    isFetching: warehouseProductIsFetching
  } = useGetWarehouseProductsQuery(warehouseProductListRequest);

  useEffect(() => {
    const updatedFilters = [
     {
        fieldName: 'product_key',
        operator: 'match',
        value: selectedProduct?.key
      }
    ];
    setWarehouseProductListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
    console.log(warehouseProductListResponseLoading);
  }, [selectedProduct?.key]);

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

  // Pagination values
  const pageIndex = warehouseProductListRequest.pageNumber - 1;
  const rowsPerPage = warehouseProductListRequest.pageSize;
  const totalCount = warehouseProductListResponseLoading?.extraNumeric ?? 0;
 
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && warehouseProduct && warehouseProduct.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };



  // Handle page change in navigation
  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };
  // Handle change rows per page in navigation
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };

  //Table columns
  const tableColumns = [
      {
          key: 'warehouseName',
          title: <Translate>Warehouse Name</Translate>,
          flexGrow: 4,
        },

    {
      key: 'quantity',
      title: <Translate>Stock Qty</Translate>,
      flexGrow: 4,
      render: rowData => <span>{rowData.quantity}</span>
    },
     {
      key: 'quantity',
      title: <Translate>Reserved Qty</Translate>,
      flexGrow: 4,
      render: rowData => <span>{rowData.quantity}</span>
    },
     {
      key: 'quantity',
      title: <Translate> Available Qty</Translate>,
      flexGrow: 4,
      render: rowData => <span>{rowData.quantity}</span>
    },
     {
      key: 'createdAt',
      title: <Translate> Last Movement Date</Translate>,
      flexGrow: 4,
      render: rowData => <span>{formatDateWithoutSeconds(rowData.createdAt)}</span>
    },
     {
      key: 'avgCost',
      title: <Translate>Avarge Cost</Translate>,
      flexGrow: 4,
      render: rowData => <span>{rowData.avgCost}</span>
    },
    {
      key: 'status',
      title: <Translate>View Transaction</Translate>,
      flexGrow: 4,
     }
  ];
  return (
    <Panel>
      <MyTable
        height={450}
        data={warehouseProductListResponseLoading?.object ?? []}
        loading={warehouseProductIsFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setWarehouseProduct(rowData);
        }}
        sortColumn={warehouseProductListRequest.sortBy}
        sortType={warehouseProductListRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          if (sortBy) setWarehouseProductListRequest({ ...warehouseProductListRequest, sortBy, sortType });
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Panel>
  );
};

export default WarehouseDistribution;