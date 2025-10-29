import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel, Tabs } from 'rsuite';
import {
  useGetLovValuesByCodeQuery,
  useGetProductQuery,
  useGetUomGroupsUnitsQuery,
  useRemoveProductMutation,
  useSaveProductMutation
} from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApProducts } from '@/types/model-types';
import { newApProducts } from '@/types/model-types-constructor';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
import AddEditProduct from './AddEditProduct';
import { conjureValueBasedOnKeyFromList, formatDateWithoutSeconds } from '@/utils';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { Box } from '@mui/material';
import { Tab, TabList, TabPanel } from 'react-tabs';
import ChartTab from '@/pages/encounter/dental-screen/tabs/DentalChartTab';
import BasicInf from './BasicInf';
import MaintenanceInformation from './MaintenanceInformation';
import UomGroup from './UOMGroup';
import InventoryAttributes from './InventoryAttributes';
import RegulSafty from './RegulSafty';
import FinancCostInfo from './FinancCostInfo';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import MyTab from '@/components/MyTab';

const ProductSetup = () => {
  const dispatch = useAppDispatch();
  const [product, setProduct] = useState<ApProducts>({ ...newApProducts });
  const [productOpen, setProductOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openConfirmDeleteProductModal, setOpenConfirmDeleteProductModal] =
    useState<boolean>(false);
  const [stateOfDeleteModal, setStateOfDeleteModal] = useState<string>('delete');
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [UnitListRequest, setUnitListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  const { data: UnitListResponse, refetch: unitRefetch } = useGetUomGroupsUnitsQuery(listRequest);
  const [uomListRequest, setUomListRequest] = useState<ListRequest>({ ...initialListRequest });

  const { data: uomGroupsUnitsListResponse, refetch: refetchUomGroupsUnit } =
    useGetUomGroupsUnitsQuery(uomListRequest);
  // Save product
  const [saveProduct, saveProductMutation] = useSaveProductMutation();

  // remove Product
  const [removeProduct, removeProductMutation] = useRemoveProductMutation();
  // Fetch products list response
  const {
    data: productListResponse,
    refetch: refetchProduct,
    isFetching
  } = useGetProductQuery(listRequest);
  // Header page setUp
  const divContent = 'Inventory Products Setup';
  dispatch(setPageCode('Product'));
  dispatch(setDivContent(divContent));
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = productListResponse?.extraNumeric ?? 0;

  const isSelected = rowData => {
    if (rowData && product && rowData.key === product.key) {
      return 'selected-row';
    } else return '';
  };

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (saveProductMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveProductMutation.data]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  // handle click on Add New button
  const handleNew = () => {
    setProductOpen(true);
    setProduct({ ...newApProducts });
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
  // handle deactivate
  const handleDeactivate = async data => {
    setOpenConfirmDeleteProductModal(false);
    try {
      await removeProduct({
        ...product
      })
        .unwrap()
        .then(() => {
          refetchProduct();
          dispatch(
            notify({
              msg: 'The Product was successfully ' + stateOfDeleteModal,
              sev: 'success'
            })
          );
        });
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to ' + stateOfDeleteModal + ' this Product',
          sev: 'error'
        })
      );
    }
  };
  //handle Activate
  const handleActive = () => {
    setOpenConfirmDeleteProductModal(false);
    const updatedProduct = { ...product, deletedAt: null };
    saveProduct(updatedProduct)
      .unwrap()
      .then(() => {
        // display success message
        dispatch(notify({ msg: 'The Product has been activated successfully', sev: 'success' }));
      })
      .catch(() => {
        // display error message
        dispatch(notify({ msg: 'Failed to activated this Product', sev: 'error' }));
      });
  };

  // Icons column (Edite, reactive/Deactivate)
  const iconsForActions = (rowData: ApProducts) => (
    <div className="container-of-icons">
      {/* open edit resource when click on this icon */}
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setProductOpen(true)}
        // onClick={() => setPopupOpen(true)}
      />
      {/* deactivate/activate  when click on one of these icon */}
      {!rowData?.deletedAt ? (
        <MdDelete
          className="icons"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteModal('deactivate');
            setOpenConfirmDeleteProductModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteModal('reactivate');
            setOpenConfirmDeleteProductModal(true);
          }}
        />
      )}
    </div>
  );
  //Table columns
  const tableColumns = [
    {
      key: 'type',
      title: <Translate>Item Type</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.typeLvalue ? rowData.typeLvalue.lovDisplayVale : rowData.typeLkey
    },
    {
      key: 'code',
      title: <Translate>Item Code</Translate>,
      flexGrow: 4,
      render: (rowData: any) => rowData.code
    },
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      flexGrow: 4,
      render: (rowData: any) => rowData.name
    },
    {
      key: 'baseUomKey',
      title: <Translate>Base UOM</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            uomGroupsUnitsListResponse?.object ?? [],
            rowData.baseUomKey,
            'units'
          )}
        </span>
      )
    },
    {
      key: 'inventoryTypeLkey',
      title: <Translate>Lot Type</Translate>,
      width: 100,
      render: (rowData, index) => {
        const status = rowData?.inventoryTypeLkey || 'Unknown';

        const getStatusConfig = status => {
          switch (status) {
            case '5274928776446580': //Lot
              return {
                backgroundColor: 'var(--light-green)',
                color: 'var(--primary-green)',
                contant: 'LOT'
              };
            case '5274937762090202': //Serial
              return {
                backgroundColor: 'var(--light-purple)',
                color: 'var(--primary-purple)',
                contant: 'Serial'
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
      key: 'createdBy',
      title: <Translate>Created By</Translate>,
      flexGrow: 4,
      render: (rowData: any) => {
        return rowData?.createdBy ?? '';
      }
    },
    {
      key: 'createdAt',
      title: <Translate>Created At</Translate>,
      flexGrow: 4,
      render: (rowData: any) => {
        return rowData.createdAt ? formatDateWithoutSeconds(rowData.createdAt) : '';
      }
    },
    {
      key: 'updatedBy',
      title: <Translate>Updated By</Translate>,
      flexGrow: 4,
      render: (rowData: any) => {
        return rowData?.updatedBy ?? '';
      }
    },
    {
      key: 'updatedAt',
      title: <Translate>Updated At</Translate>,
      flexGrow: 4,
      render: (rowData: any) => {
        return rowData.updatedAt ? formatDateWithoutSeconds(rowData.updatedAt) : '';
      }
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];
  const tabData = [
    {
      title: 'Bacis Info',
      content: <BasicInf product={product} setProduct={setProduct} disabled={true} />
    },
    {
      title: 'Maintenance Information',
      content: <MaintenanceInformation product={product} setProduct={setProduct} disabled={true} />
    },
    {
      title: 'UOM',
      content: <UomGroup product={product} setProduct={setProduct} disabled={true} />
    },
    {
      title: 'Inventory Attributes',
      content: <InventoryAttributes product={product} setProduct={setProduct} disabled={true} />
    },
    {
      title: 'Regulatory & Safety',
      content: <RegulSafty product={product} setProduct={setProduct} disabled={true} />
    },
    {
      title: 'Financial & Costing Information',
      content: <FinancCostInfo product={product} setProduct={setProduct} disabled={true} />
    }
  ];
  const tabContant = () => {
    return (
      <Box>
        <MyTab data={tabData} />
      </Box>
    );
  };

  const filters = (
    <>
      <AdvancedSearchFilters searchFilter={true} />
    </>
  );
  const tablebuttons = (
    <>
      {' '}
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={() => {
            setOpenAddEditPopup(true),
              setWarehouseProduct({ ...newApWarehouseProduct }),
              setEdit_new(true);
          }}
          width="109px"
        >
          Add New
        </MyButton>
      </div>
    </>
  );
  return (
    <Panel>
      <MyTable
        height={450}
        data={productListResponse?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters}
        tableButtons={tablebuttons}
        onRowClick={rowData => {
          setProduct(rowData);
        }}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <AddEditProduct
        open={productOpen}
        setOpen={setProductOpen}
        product={product}
        setProduct={setProduct}
        refetch={refetchProduct}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteProductModal}
        setOpen={setOpenConfirmDeleteProductModal}
        itemToDelete="Product"
        actionButtonFunction={
          stateOfDeleteModal == 'deactivate' ? () => handleDeactivate(product) : handleActive
        }
        actionType={stateOfDeleteModal}
      />
      {product.key && tabContant()}
    </Panel>
  );
};

export default ProductSetup;
