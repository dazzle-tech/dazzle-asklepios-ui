import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Col, Form, Panel, Row } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { notify } from '@/utils/uiReducerActions';
import { ApWarehouse, ApWarehouseProduct } from '@/types/model-types';
import { newApWarehouse, newApWarehouseProduct } from '@/types/model-types-constructor';
import MyInput from '@/components/MyInput';
import './styles.less';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, fromCamelCaseToDBName } from '@/utils';
import {
  useGetDepartmentsQuery,
  useSaveWarehouseMutation,
  useRemoveWarehouseMutation,
  useGetWarehouseProductsQuery,
  useGetWarehouseContainProductsQuery,
} from '@/services/setupService';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddEditWarehouseProduct from './AddEditWarehouseProduct';
import ProductList from './ProductList';
const WarehouseItemsSetup = () => {
  const dispatch = useAppDispatch();
  const [warehouse, setWarehouse] = useState<ApWarehouse>({ ...newApWarehouse });
  const [warehouseProduct, setWarehouseProduct] = useState<ApWarehouseProduct>({ ...newApWarehouseProduct });
  const [openConfirmDeleteWarehouseModal, setOpenConfirmDeleteWarehouseModal] =
    useState<boolean>(false);
  const [saveWarehouse, saveWarehouseMutation] = useSaveWarehouseMutation();
  const [removeWarehouse, removeWarehouseMutation] = useRemoveWarehouseMutation();
  const [stateOfDeleteWarehouseModal, setStateOfDeleteWarehouseModal] = useState<string>('delete');
  const [openAddEditPopup, setOpenAddEditPopup] = useState(false);
  const [openAddEditUserPopup, setOpenAddEditUserPopup] = useState(false);
  const [openAddEditWorkingHoursPopup, setOpenAddEditWorkingHoursPopup] = useState(false);
  const [edit_new, setEdit_new] = useState(false);
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  const [departmentListRequest] = useState<ListRequest>({
    ...initialListRequest
  });

  const [warehouseProductListRequest, setWarehouseProductListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });

  // Fetch warehouse product list response
  const {
    data: warehouseProductListResponseLoading,
    refetch: warehouseProductRefetch,
    isFetching: warehouseProductIsFetching
  } = useGetWarehouseProductsQuery(warehouseProductListRequest);
  // Fetch warehouse product list response



  const [warehouseListRequest, setWarehouseListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });

  // Fetch warehouse contain product list response
  const {
    data: warehouseContainProductsListResponseLoading,
    refetch,
    isSuccess: warehouseProductLoaded,
    isFetching
  } = useGetWarehouseContainProductsQuery(warehouseListRequest);


  // Pagination values
  const pageIndex = warehouseProductListRequest.pageNumber - 1;
  const rowsPerPage = warehouseProductListRequest.pageSize;
  const totalCount = warehouseProductListResponseLoading?.extraNumeric ?? 0;
  // Available fields for filtering
  const filterFields = [
    { label: 'Department Name', value: 'departmentName' },
    { label: 'Warehouse Name', value: 'warehouseName' },
    { label: 'Warehouse Code', value: 'warehouseCode' },
    { label: 'Status', value: 'isValid' }
  ];
  // Header page setUp
  const divContent = (
    <div className='title'>
      <h5>Warehouse Items</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Warehouse_Items_Setup'));
  dispatch(setDivContent(divContentHTML));
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && warehouse && warehouse.key === rowData.key) {
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
  // Fetch department list Response
  const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);
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
      await removeWarehouse({
        ...warehouse
      })
        .unwrap()
        .then(() => {
          refetch();
          dispatch(
            notify({
              msg: 'The warehouse was successfully ' + stateOfDeleteWarehouseModal,
              sev: 'success'
            })
          );
        });
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to ' + stateOfDeleteWarehouseModal + ' this warehouse',
          sev: 'error'
        })
      );
    }
  };
  //handle Reactivate warehouse
  const handleReactiveWarehouse = () => {
    setOpenConfirmDeleteWarehouseModal(false);
    const updatedWarehouse = { ...warehouse, deletedAt: null };
    saveWarehouse(updatedWarehouse)
      .unwrap()
      .then(() => {
        refetch();
        // display success message
        dispatch(notify({ msg: 'The warehouse Item has been activated successfully', sev: 'success' }));
      })
      .catch(() => {
        // display error message
        dispatch(notify({ msg: 'Failed to activated this warehouse Item', sev: 'error' }));
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
      key: 'departmentKey',
      title: <Translate>Department</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            departmentListResponse?.object ?? [],
            rowData.departmentKey,
            'name'
          )}
        </span>
      )
    },
    {
      key: 'warehouseName',
      title: <Translate>Warehouse Name</Translate>,
      flexGrow: 4,
    },
    {
      key: 'warehouseId',
      title: <Translate>Code</Translate>,
      flexGrow: 4,
    },
    {
      key: 'isvalid',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.isvalid ? 'InValid' : 'Valid')
    }
  ];
  return (
    <Panel>
      <Row className='container-of-add-new-button'>
        <Col xs={24}>
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={() => {
                setOpenAddEditPopup(true), setWarehouseProduct({ ...newApWarehouseProduct }), setEdit_new(true);
              }}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
          <MyTable
            height={450}
            data={warehouseContainProductsListResponseLoading?.object ?? []}
            loading={warehouseProductIsFetching}
            columns={tableColumns}
            rowClassName={isSelected}
            filters={filters()}
            onRowClick={rowData => {
              setWarehouse(rowData);
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
        </Col>
      </Row>
      <Row>

        <AddEditWarehouseProduct
          open={openAddEditPopup}
          setOpen={setOpenAddEditPopup}
          warehouseProduct={warehouseProduct}
          setWarehouseProduct={setWarehouseProduct}
          refetch={warehouseProductRefetch}
          edit_new={edit_new}
          setEdit_new={setEdit_new}
        />
        {warehouse.key && (
          <ProductList
            open={openAddEditPopup}
            setOpen={setOpenAddEditPopup}
            warehouse={warehouse}
            setWarehouse={setWarehouse}
            refetch={refetch}
          />
        )}
      </Row>
    </Panel>
  );
};

export default WarehouseItemsSetup;
