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
import { ApVaccine, ApWarehouse, ApWarehouseProduct, ApWarehouseProductDetails } from '@/types/model-types';
import { newApVaccine, newApWarehouse, newApWarehouseProduct, newApWarehouseProductDetails } from '@/types/model-types-constructor';
import MyInput from '@/components/MyInput';
import './styles.less';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, fromCamelCaseToDBName } from '@/utils';
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
  useGetWarehouseProductsDetailsQuery,
} from '@/services/setupService';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import { FaClock, FaHourglass, FaUser } from 'react-icons/fa6';
import AddEditWarehouseProduct from './AddEditWarehouseProduct';
const ProductDetails = ({

  open,
  setOpen,
  warehouseProduct,
  setWarehouseProduct,
  refetch
}) => {
  const dispatch = useAppDispatch();
  const [productDetails, setProductDetails] = useState<ApWarehouseProductDetails>({ ...newApWarehouseProductDetails });
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
  const [warehouseProductDetailsListRequest, setWarehouseProductDetailsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15,
    filters: [
      {
        fieldName: 'warehouse_product_key',
        operator: 'match',
        value: warehouseProduct?.key
      }
    ]
  });

  // Fetch warehouse product list response
  const {
    data: warehouseProductDetailsListResponseLoading,
    refetch: warehouseProductRefetch,
    isFetching: warehouseProductIsFetching
  } = useGetWarehouseProductsDetailsQuery(warehouseProductDetailsListRequest);

  useEffect(() => {
    const updatedFilters = [
         {
        fieldName: 'warehouse_product_key',
        operator: 'match',
        value: warehouseProduct?.key
      }
    ];
    setWarehouseProductDetailsListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
    console.log(warehouseProductDetailsListResponseLoading);
  }, [warehouseProduct?.key]);

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
  const pageIndex = warehouseProductDetailsListRequest.pageNumber - 1;
  const rowsPerPage = warehouseProductDetailsListRequest.pageSize;
  const totalCount = warehouseProductDetailsListResponseLoading?.extraNumeric ?? 0;
  // Available fields for filtering
  const filterFields = [
    { label: 'Lot/Serial Number', value: 'lotSerialNum' },
    { label: 'Quantity', value: 'quantity' },
    { label: 'Status', value: 'isValid' }
  ];
  // Header page setUp
  const divContent = (
    <div className='title'>
      <h5>Warehouse Products</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('ProductList'));
  dispatch(setDivContent(divContentHTML));

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && warehouseProduct && warehouseProduct.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };


  //useEffect
  useEffect(() => {
    if (recordOfFilter['filter']) {
      handleFilterChange(recordOfFilter['filter'], recordOfFilter['value']);
    } else {
      setListRequest({
        ...initialListRequest,
        pageSize: listRequest.pageSize,
        pageNumber: 1
      });
    }
  }, [recordOfFilter]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);



  // handle click om edit  
  const handleEdit = () => {
    setEdit_new(true);
    setOpenAddEditPopup(true);
  };
  // handle filter change
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'startsWithIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };
  // handle deactivate warehouse
  const handleDeactivateWarehouse = async data => {
    setOpenConfirmDeleteWarehouseModal(false);
    try {
      await removeWarehouseProduct({
        ...warehouseProduct
      })
        .unwrap()
        .then(() => {
          refetchProduct();
          warehouseProductRefetch();
          refetch();
          dispatch(
            notify({
              msg: 'The product was successfully ' + stateOfDeleteWarehouseModal,
              sev: 'success'
            })
          );
        });
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to ' + stateOfDeleteWarehouseModal + ' this product',
          sev: 'error'
        })
      );
    }
  };
  //handle Reactivate warehouse
  const handleReactiveWarehouse = () => {
    setOpenConfirmDeleteWarehouseModal(false);
    const updatedWarehouse = { ...warehouseProduct, deletedAt: null };
    saveWarehouseProduct(updatedWarehouse)
      .unwrap()
      .then(() => {
        refetch();
         warehouseProductRefetch();
        // display success message
        dispatch(notify({ msg: 'The warehouse Product has been activated successfully', sev: 'success' }));
      })
      .catch(() => {
        // display error message
        dispatch(notify({ msg: 'Failed to activated this warehouse Product', sev: 'error' }));
      });
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
  // Filter table
  const filters = () => (
    <Form layout="inline" fluid className="container-of-filter-fields">
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={updatedRecord => {
          setRecordOfFilter({
            ...recordOfFilter,
            filter: updatedRecord.filter,
            value: ''
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />
      <MyInput
        fieldName="value"
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Search"
      />
    </Form>
  );
  //Table columns
  const tableColumns = [
    {
      key: 'lotSerialNum',
      title: <Translate>Lot Serial Number</Translate>,
      flexGrow: 4,
      render: rowData => <span>{rowData.lotSerialNum}</span>
    },
    {
      key: 'quantity',
      title: <Translate>Quantity</Translate>,
      flexGrow: 4,
      render: rowData => <span>{rowData.quantity}</span>
    },
      {
      key: 'expiryDate',
      title: <Translate>Expiry Date</Translate>,
      flexGrow: 4,
      render: rowData => <span>{rowData.expiryDate}</span>
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.isValid ? 'Inactive' : 'Active')
    }
  ];
  return (
    <Panel>
      <MyTable
        height={450}
        data={warehouseProductDetailsListResponseLoading?.object ?? []}
        loading={warehouseProductIsFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setProductDetails(rowData);
        }}
        sortColumn={warehouseProductDetailsListRequest.sortBy}
        sortType={warehouseProductDetailsListRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          if (sortBy) setWarehouseProductDetailsListRequest({ ...warehouseProductDetailsListRequest, sortBy, sortType });
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

export default ProductDetails;