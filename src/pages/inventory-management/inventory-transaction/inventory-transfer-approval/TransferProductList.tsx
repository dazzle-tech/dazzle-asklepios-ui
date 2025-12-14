import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Checkbox, Col, Form, Input, Panel, Row, SelectPicker } from 'rsuite';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import { FaSyringe } from 'react-icons/fa';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { notify } from '@/utils/uiReducerActions';
import { ApInventoryTransactionProduct, ApInventoryTransferProduct } from '@/types/model-types';
import { newApInventoryTransactionProduct, newApInventoryTransferProduct } from '@/types/model-types-constructor';
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
import { useGetInventoryTransferProductQuery, useRemoveInventoryTransferProductMutation, useSaveInventoryTransactionProductMutation, useSaveInventoryTransferProductApprovedMutation, useSaveInventoryTransferProductRejectedMutation } from '@/services/inventoryTransactionService';
import { GrProductHunt } from 'react-icons/gr';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faDownload, faPenToSquare, faX } from '@fortawesome/free-solid-svg-icons';
import CancellationModal from '@/components/CancellationModal';
const TransferProductList = ({

  open,
  setOpen,
  transfer,
  setTransfer,
  refetch
}) => {
  const dispatch = useAppDispatch();
  const [selectedRows, setSelectedRows] = useState([]);
  const [InventoryTransferProducts, setInventoryTransferProducts] = useState<ApInventoryTransferProduct[]>([]);
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
  const [saveInventoryTransferProductApproved, saveInventoryTransferProductApprovedMutation] = useSaveInventoryTransferProductApprovedMutation();
  const [saveInventoryTransferProductRejected, saveInventoryTransferProductRejectedMutation] = useSaveInventoryTransferProductRejectedMutation();
  const [activeRowKey, setActiveRowKey] = useState(null);
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


  const [openRejectedModal, setOpenRejectedModal] = useState(false);
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
      "Inventory Transfer Products"
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

  // handle save tests(on selected list)
  const handleSaveApproved = () => {
    let testsClone = [...InventoryTransferProducts];
    const objectsToSave = selectedRows.map(key => ({
      ...newApInventoryTransferProduct,
      key: key,
      transfer_key: transfer.key
    }));
    testsClone.push(...objectsToSave);
    saveInventoryTransferProductApproved(objectsToSave)
      .unwrap()
      .then(() => {
        // newList.refetch();
        dispatch(notify({ msg: 'The Inventory Transfer Products have been Approved successfully', sev: 'success' }));
      });
    setInventoryTransferProducts(testsClone);
  };

  // handle save tests(on selected list) Rejected
  const handleSaveRejected = () => {
    let testsClone = [...InventoryTransferProducts];
    const objectsToSave = selectedRows.map(key => ({
      ...newApInventoryTransferProduct,
      key: key,
      transfer_key: transfer.key
    }));
    testsClone.push(...objectsToSave);
    saveInventoryTransferProductRejected(objectsToSave)
      .unwrap()
      .then(() => {
        // newList.refetch();
        dispatch(notify({ msg: 'The Inventory Transfer Products have been Rejected successfully', sev: 'success' }));
      });
    setInventoryTransferProducts(testsClone);
  };

  // handle click on edit
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

  const handleApprovedQuantitySave = (key, value) => {
    const updatedList = selectedRows.map(item =>
      item.key === key ? { ...item, quentityApproved: value } : item
    );
    setSelectedRows(updatedList); // update state
    setActiveRowKey(null); // close the input
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
          disabled={rowData.statusLkey !== '164797574082125'}
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
      key: "quentityApproved",
      title: <Translate>Approved Quantity</Translate>,
      render: (rowData) =>
        activeRowKey === rowData.key ? (
          <Input
            type="number"
            style={{ width: 100 }}
            // onChange={(value) =>
            //   setTransferProduct({ ...transferProduct, quentityApproved: Number(value) })
            // }
            disabled={rowData.statusLkey !== '164797574082125'}
            defaultValue={rowData.quentityApproved}
            onChange={(value) => handleApprovedQuantitySave(rowData.key, Number(value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const updatedValue = Number(e.target);
                handleApprovedQuantitySave(rowData.key, updatedValue);
              }
            }}
          />
        ) : (
          <span>
            <FontAwesomeIcon
              icon={faPenToSquare}
              onClick={() =>  rowData.statusLkey !== '164797574082125' ? setActiveRowKey(rowData.key) : null}
              style={{ marginRight: "8px", cursor: "pointer" }}
            />
            {rowData.quentityApproved}
          </span>
        )
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
      key: 'status',
      dataKey: 'statusLkey',
      title: 'Status',
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.statusLvalue ? rowData.statusLvalue?.lovDisplayVale : rowData.statusLkey;
      },
    }
  ];
  const conjureFormContentOfMainModal = () => {
    return (
      <Panel>
        <div className='bt-right-group'>
          <div className='btns-group'>
            <MyButton
              title="Approve Selected"
              prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}
              onClick={handleSaveApproved}
            ></MyButton>
            <MyButton title="Reject Selected" prefixIcon={() => <FontAwesomeIcon icon={faX} />} ></MyButton>
            <MyButton title="Download" prefixIcon={() => <FontAwesomeIcon icon={faDownload} />}></MyButton>
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
        {/* <CancellationModal
          open={openRejectedModal}
          setOpen={setOpenRejectedModal}
          fieldName="rejectedReason"
          fieldLabel="Rejected Reason"
          title="Reject"
          object={transferProduct}
          setObject={setTransferProduct}
          handleCancle={handleRejectedTest}
        /> */}
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
      actionButtonLabel={'Save'}
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