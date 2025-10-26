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
import { ApInventoryTransactionProduct, ApInventoryTransferProduct} from '@/types/model-types';
import { newApInventoryTransactionProduct, newApInventoryTransferProduct} from '@/types/model-types-constructor';
import './styles.less';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, fromCamelCaseToDBName } from '@/utils';
import {
  useGetProductQuery,
  useGetLovValuesByCodeAndParentQuery,
  useGetUomGroupsUnitsQuery,
} from '@/services/setupService';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import {  useGetInventoryTransferProductQuery, useRemoveInventoryTransferProductMutation, useSaveInventoryTransactionProductMutation } from '@/services/inventoryTransactionService';
const ProductList = ({

  open,
  setOpen,
  showSubChildModal,
  setShowSubChildModal,
  transfer,
  setTransfer,
  transferProductListRequest,
  setTransferProductListRequest,
  transferProductListResponseLoading,
  transferProductIsFetching,
  transferProductRefetch
}) => {
  const dispatch = useAppDispatch();
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

  const {
    data: uomGroupsUnitsListResponse,
    refetch: refetchUomGroupsUnit,
  } = useGetUomGroupsUnitsQuery(uomListRequest);
 
   
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
        refetch: refetchProduct
      } = useGetProductQuery(productsListRequest);

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
  }, [transferProductRefetch]);


  // Pagination values
  const pageIndex = transferProductListRequest.pageNumber - 1;
  const rowsPerPage = transferProductListRequest.pageSize;
  const totalCount = transferProductListResponseLoading?.extraNumeric ?? 0;

  // Header page setUp
  const divContent = (
    <div className='title'>
      <h5><Translate>Inventory Transfer Products</Translate></h5>
    </div>
  );
  dispatch(setPageCode('ProductList'));
  dispatch(setDivContent(divContent));

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
          transferProductRefetch();
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
  // // Icons column (Edit, User, , reactive/Deactivate)
  const iconsForActions = (rowData: ApInventoryTransactionProduct) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => handleEdit()}
      />
      {!rowData?.deletedAt ? (
        <MdDelete
          className="icons"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteTransferProductModal('deactivate');
            setOpenConfirmDeleteTransferProductModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteTransferProductModal('reactivate');
            setOpenConfirmDeleteTransferProductModal(true);
          }}
        />
      )}
    </div>
  );
  //Table columns
  const tableColumns = [
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
      key: 'quantity',
      title: <Translate>Transfer Quantity</Translate>,
      flexGrow: 4,
      render: rowData => <span>{rowData.quentityRequested}</span>
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
      {
      key: 'productUOM',
      title: <Translate>Available quantity</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            uomGroupsUnitsListResponse?.object ?? [],
            rowData.productObj.baseUomKey,
            'units'
          )}
        </span>
      )
    },
    {
      key: 'productUOM',
      title: <Translate>Base UOM</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            uomGroupsUnitsListResponse?.object ?? [],
            rowData.productObj.baseUomKey,
            'units'
          )}
        </span>
      )
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];
  return (
    <Panel>
       <div className="container-of-add-new-button">
                  <MyButton
                    prefixIcon={() => <AddOutlineIcon />}
                    color="var(--deep-blue)"
                    onClick={() => {
                      setShowSubChildModal(true), setTransferProduct({ ...newApInventoryTransferProduct }), setEdit_new(true);
                    }}
                    width="109px"
                  >
                    Add product
                  </MyButton>
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
};

export default ProductList;