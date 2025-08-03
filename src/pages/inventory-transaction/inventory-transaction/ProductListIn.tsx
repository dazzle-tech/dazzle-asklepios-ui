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
import { ApInventoryTransactionProduct} from '@/types/model-types';
import { newApInventoryTransactionProduct} from '@/types/model-types-constructor';
import MyInput from '@/components/MyInput';
import './styles.less';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, fromCamelCaseToDBName } from '@/utils';
import {
  useGetVaccineListQuery,
  useDeactiveActivVaccineMutation,
  useGetDepartmentsQuery,
  useGetProductQuery,
  useGetLovValuesByCodeAndParentQuery,
  useGetUomGroupsUnitsQuery,
} from '@/services/setupService';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import { FaClock, FaHourglass, FaUser } from 'react-icons/fa6';
import AddEditProductIn from './AddEditProductIn';
import { useGetInventoryTransactionsProductQuery, useRemoveInventoryTransactionProductMutation, useSaveInventoryTransactionProductMutation } from '@/services/inventoryTransactionService';
const ProductListIn = ({

  open,
  setOpen,
  showSubChildModal,
  setShowSubChildModal,
  transaction,
  setTransaction,
  refetch
}) => {
  const dispatch = useAppDispatch();
  const [transactionProduct, setTransactionProduct] = useState<ApInventoryTransactionProduct>({ ...newApInventoryTransactionProduct });
  const [openConfirmDeleteTransactionProductModal, setOpenConfirmDeleteTransactionProductModal] =
    useState<boolean>(false);
  const [saveTransactionProduct, saveTransactionProductMutation] = useSaveInventoryTransactionProductMutation();
  const [removeTransactionProduct, removeTransactionProductMutation] = useRemoveInventoryTransactionProductMutation();
  const [stateOfDeleteTransactionProductModal, setStateOfDeleteTransactionProductModal] = useState<string>('delete');
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

  // Fetch transaction product list response
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
    console.log(transactionProductListResponseLoading);
  }, [transaction?.key]);

   useEffect(() => {
    transactionProductRefetch();
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
  const pageIndex = transactionProductListRequest.pageNumber - 1;
  const rowsPerPage = transactionProductListRequest.pageSize;
  const totalCount = transactionProductListResponseLoading?.extraNumeric ?? 0;
 
  // Header page setUp
  const divContent = (
    <div className='title'>
      <h5>Inventory Transaction Products</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('ProductList'));
  dispatch(setDivContent(divContentHTML));

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && transactionProduct && transactionProduct.key === rowData.key) {
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

   //useEffect
  useEffect(() => {
  refetchProduct();
  }, [showSubChildModal]);

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
  // handle deactivate transaction product
  const handleDeactivateTransactionProduct = async data => {
    setOpenConfirmDeleteTransactionProductModal(false);
    try {
      await removeTransactionProduct({
        ...transactionProduct
      })
        .unwrap()
        .then(() => {
          refetchProduct();
          transactionProductRefetch();
          refetch();
          dispatch(
            notify({
              msg: 'The product was successfully ' + stateOfDeleteTransactionProductModal,
              sev: 'success'
            })
          );
        });
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to ' + stateOfDeleteTransactionProductModal + ' this product',
          sev: 'error'
        })
      );
    }
  };
  //handle Reactivate transaction product
  const handleReactivateTransactionProduct = () => {
    setOpenConfirmDeleteTransactionProductModal(false);
    const updatedTransactionProduct = { ...transactionProduct, deletedAt: null };
    saveTransactionProduct(updatedTransactionProduct)
      .unwrap()
      .then(() => {
        refetch();
        transactionProductRefetch();
        // display success message
        dispatch(notify({ msg: 'The transaction Product has been activated successfully', sev: 'success' }));
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
            setStateOfDeleteTransactionProductModal('deactivate');
            setOpenConfirmDeleteTransactionProductModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteTransactionProductModal('reactivate');
            setOpenConfirmDeleteTransactionProductModal(true);
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
      key: 'productType',
      title: <Translate>Product Type</Translate>,
      flexGrow: 4,
      render: rowData => {
        return (
          <p>
             {rowData.productObj.typeLvalue ? rowData.productObj.typeLvalue.lovDisplayVale : rowData.productObj.typeLkey}
          </p>
        );
      }
    },
    {
      key: 'productcode',
      title: <Translate>Product code</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            productListResponseLoading?.object ?? [],
            rowData.productKey,
            'code'
          )}
        </span>
      )
    },
    {
      key: 'productUOM',
      title: <Translate>Product Base UOM</Translate>,
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
      key: 'quantity',
      title: <Translate>Quantity</Translate>,
      flexGrow: 4,
      render: rowData => <span>{rowData.newQuentity}</span>
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
                      setShowSubChildModal(true), setTransactionProduct({ ...newApInventoryTransactionProduct }), setEdit_new(true);
                    }}
                    width="109px"
                  >
                    Add product
                  </MyButton>
                </div>
      <MyTable
        height={450}
        data={transactionProductListResponseLoading?.object ?? []}
        loading={transactionProductIsFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setTransactionProduct(rowData);
        }}
        sortColumn={transactionProductListRequest.sortBy}
        sortType={transactionProductListRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          if (sortBy) setTransactionProductListRequest({ ...transactionProductListRequest, sortBy, sortType });
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <DeletionConfirmationModal
        open={openConfirmDeleteTransactionProductModal}
        setOpen={setOpenConfirmDeleteTransactionProductModal}
        itemToDelete="Product"
        actionButtonFunction={
          stateOfDeleteTransactionProductModal == 'deactivate'
            ? () => handleDeactivateTransactionProduct(transactionProduct)
            : handleReactivateTransactionProduct
        }
        actionType={stateOfDeleteTransactionProductModal}
      />

    </Panel>
  );
};

export default ProductListIn;