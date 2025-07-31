import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Checkbox, Col, Form, Panel, Row } from 'rsuite';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import { FaSyringe } from 'react-icons/fa';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { notify } from '@/utils/uiReducerActions';
import { ApInventoryTransactionProduct, ApInventoryTransferProduct} from '@/types/model-types';
import { newApInventoryTransactionProduct, newApInventoryTransferProduct} from '@/types/model-types-constructor';
import './styles.less';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, fromCamelCaseToDBName } from '@/utils';
import {
  useGetProductQuery,
  useGetLovValuesByCodeAndParentQuery,
  useGetUomGroupsUnitsQuery,
  useGetWarehouseQuery,
} from '@/services/setupService';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import {  useGetInventoryTransferProductQuery, useRemoveInventoryTransferProductMutation, useSaveInventoryTransactionProductMutation } from '@/services/inventoryTransactionService';
import { GrProductHunt } from 'react-icons/gr';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faDownload, faX } from '@fortawesome/free-solid-svg-icons';
const TransferProductList = ({

  open,
  setOpen,
  transfer,
  setTransfer,
  refetch
}) => {
  const dispatch = useAppDispatch();
  const [selectedRows, setSelectedRows] = useState([]);
  const [transferProduct, setTransferProduct] = useState<ApInventoryTransferProduct>({ ...newApInventoryTransferProduct });
  const [openConfirmDeleteTransferProductModal, setOpenConfirmDeleteTransferProductModal] =
    useState<boolean>(false);
  const [saveTransferProduct, saveTransferProductMutation] = useSaveInventoryTransactionProductMutation();
  const [removeTransferProduct, removeTransferProductMutation] = useRemoveInventoryTransferProductMutation();
  const [stateOfDeleteTransferProductModal, setStateOfDeleteTransferProductModal] = useState<string>('delete');
  const [openAddEditPopup, setOpenAddEditPopup] = useState(false);
  const [edit_new, setEdit_new] = useState(false);
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest
  });

  const { data: productTypeLovQueryResponse } = useGetLovValuesByCodeAndParentQuery('PRODUCTS_TYPES');
  const [uomListRequest, setUomListRequest] = useState<ListRequest>({ ...initialListRequest });
   const { data: warehouseListResponse } = useGetWarehouseQuery(listRequest);
  const {
    data: uomGroupsUnitsListResponse,
    refetch: refetchUomGroupsUnit,
  } = useGetUomGroupsUnitsQuery(uomListRequest);
  const [transferProductListRequest, setTransferProductListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15,
    filters: [
      {
        fieldName: 'transfer_key',
        operator: 'match',
        value: transfer?.key
      }
    ]
  });

  // Fetch transfer product list response
  const {
    data: transferProductListResponseLoading,
    refetch: transferProductRefetch,
    isFetching: transferProductIsFetching
  } = useGetInventoryTransferProductQuery(transferProductListRequest);

  useEffect(() => {
    const updatedFilters = [
         {
        fieldName: 'transfer_key',
        operator: 'match',
        value: transfer?.key
      }
    ];
    setTransferProductListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
    console.log(transferProductListResponseLoading);
  }, [transfer?.key]);

   useEffect(() => {
    transferProductRefetch();
  }, [refetch]);


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
  const pageIndex = transferProductListRequest.pageNumber - 1;
  const rowsPerPage = transferProductListRequest.pageSize;
  const totalCount = transferProductListResponseLoading?.extraNumeric ?? 0;

  // Header page setUp
  const divContent = (
    <div className='title'>
      <h5>Inventory Transfer Products</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('ProductList'));
  dispatch(setDivContent(divContentHTML));

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && transferProduct && transferProduct.key === rowData.key) {
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

 // Handle  selection by checking the checkbox
  const handleCheckboxChange = key => {
    setSelectedRows(prev => {
      if (prev.includes(key)) {
        return prev.filter(item => item !== key);
      } else {
        return [...prev, key];
      }
    });
  };

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
  // handle deactivate transfer product
  const handleDeactivateTransferProduct = async data => {
    setOpenConfirmDeleteTransferProductModal(false);
    try {
      await removeTransferProduct({
        ...transferProduct
      })
        .unwrap()
        .then(() => {
          refetchProduct();
          transferProductRefetch();
          refetch();
          dispatch(
            notify({
              msg: 'The product was successfully ' + stateOfDeleteTransferProductModal,
              sev: 'success'
            })
          );
        });
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to ' + stateOfDeleteTransferProductModal + ' this product',
          sev: 'error'
        })
      );
    }
  };
  //handle Reactivate transfer product
  const handleReactivateTransferProduct = () => {
    setOpenConfirmDeleteTransferProductModal(false);
    const updatedTransferProduct = { ...transferProduct, deletedAt: null };
    saveTransferProduct(updatedTransferProduct)
      .unwrap()
      .then(() => {
        refetch();
        transferProductRefetch();
        // display success message
        dispatch(notify({ msg: 'The transfer Product has been activated successfully', sev: 'success' }));
      })
      .catch(() => {
        // display error message
        dispatch(notify({ msg: 'Failed to activated this transaction Product', sev: 'error' }));
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

  const handleSave = async () => {

  }
  //Table columns
  const tableColumns = [
        {
      key: 'test',
      title: <Translate></Translate>,
      render: rowData => (
        <Checkbox
          checked={selectedRows.includes(rowData.key)}
          onChange={() => handleCheckboxChange(rowData.key)}
        />
      )
    },
    {
      key: 'productKey',
      title: <Translate>Product Name</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            productListResponseLoading?.object ?? [],
            rowData.productKey,
            'name'
          )}
        </span>
      )
    },
       {
            key: 'fromWarehouse',
            title: <Translate>From Warehouse</Translate>,
            flexGrow: 4,
            render: rowData => (
                <span>
                    {conjureValueBasedOnKeyFromList(
                        warehouseListResponse?.object ?? [],
                        rowData.transferObj.fromWarehouseKey,
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
                        rowData.transferObj.toWarehouseKey,
                        'warehouseName'
                    )}
                </span>
            )
        },
    {
      key: 'quantity',
      title: <Translate>Requested Quantity</Translate>,
      flexGrow: 4,
      render: rowData => <span>{rowData.quentityRequested}</span>
    },
     {
      key: 'quantity',
      title: <Translate>Approved Quantity</Translate>,
      flexGrow: 4,
      render: rowData => <span>{rowData.quentityApproved}</span>
    },
     {
      key: 'transUomKey',
      title: <Translate>Transfer UOM</Translate>,
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
  ];
   const conjureFormContentOfMainModal = () => {
         return (
           <Panel>
                  <div className='bt-right-group'>
                    <div className='btns-group'>
                        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faCheck} />} ></MyButton>
                        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faX} />} ></MyButton>
                        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faDownload} />}></MyButton>
                    </div>
                </div>
      <MyTable
        height={450}
        data={transferProductListResponseLoading?.object ?? []}
        loading={transferProductIsFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setTransferProduct(rowData);
        }}
        sortColumn={transferProductListRequest.sortBy}
        sortType={transferProductListRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          if (sortBy) setTransferProductListRequest({ ...transferProductListRequest, sortBy, sortType });
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteTransferProductModal}
        setOpen={setOpenConfirmDeleteTransferProductModal}
        itemToDelete="Product"
        actionButtonFunction={
          stateOfDeleteTransferProductModal == 'deactivate'
            ? () => handleDeactivateTransferProduct(transferProduct)
            : handleReactivateTransferProduct
        }
        actionType={stateOfDeleteTransferProductModal}
      />

    </Panel>
         );

     }

  return (
       <MyModal
              actionButtonLabel={'Save' } 
              actionButtonFunction={handleSave}
              open={open}
              setOpen={setOpen}
              position="right"
              title={'Approval Workflow'}
              content={conjureFormContentOfMainModal}
              steps={[
                {
                  title: 'Transfer Product',
                  icon: <GrProductHunt />,
                }
              ]}
            />
  );
};

export default TransferProductList;