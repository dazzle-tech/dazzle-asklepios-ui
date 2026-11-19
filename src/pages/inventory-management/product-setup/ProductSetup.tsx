import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Form, Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
import AddEditProduct from './AddEditProduct';
import { conjureValueBasedOnKeyFromList, formatDateWithoutSeconds, formatEnumString } from '@/utils';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { Box } from '@mui/material';
import MyTab from '@/components/MyTab';
import BasicInf from './BasicInf';
import MaintenanceInformation from './MaintenanceInformation';
import UomGroup from './UOMGroup';
import InventoryAttributes from './InventoryAttributes';
import RegulSafty from './RegulSafty';
import FinancCostInfo from './FinancCostInfo';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { InventoryProduct } from '@/types/model-types-new';
import { newInventoryProduct } from '@/types/model-types-constructor-new';
import {
  useGetInventoryProductsQuery,
  useToggleInventoryProductActiveMutation,
} from '@/services/inventory/inventory-products/inventoryProductsService';
import { useAppSelector } from "@/hooks";
import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllUnitsByGroupIdQuery, useGetAllUOMGroupsQuery } from '@/services/setup/uom-group/uomGroupService';

const ProductSetup = () => {
  const dispatch = useAppDispatch();
  const facility = useAppSelector((state) => state.auth?.tenant);
  const [product, setProduct] = useState<InventoryProduct>({ ...newInventoryProduct });
  const [productOpen, setProductOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openConfirmDeleteProductModal, setOpenConfirmDeleteProductModal] =
    useState<boolean>(false);
  const [stateOfDeleteModal, setStateOfDeleteModal] = useState<string>('deactivate');
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  // Filters above the table (UOM and advanced search); applied as they change
  const [filter, setFilter] = useState({
    barcodeOrQrCode: "",
    warrantyStartDate: null,
    warrantyEndDate: null,
    uomGroupId: 0,
    baseUom: null,
    dispenseUom: "",
    erpIntegrationId: ""
  });

  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { type: '', code: '', name: '', inventoryType: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';


  const { data: uomGroupsListResponse } = useGetAllUOMGroupsQuery({
    page: 0,
    size: 200,
    sort: "id,asc",
    name: ""
  });
  const { data: uomUnitsResponse } = useGetAllUnitsByGroupIdQuery(
    filter?.uomGroupId ?? 0,
    { skip: !filter?.uomGroupId }
  );
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc',
  });


  // Dates go to the backend as plain ISO dates (yyyy-MM-dd)
  const toIsoDate = (value: any) => {
    if (!value) return undefined;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
  };

  const { data: productListResponse, isFetching } = useGetInventoryProductsQuery({
    ...paginationParams,
    ...appliedFilters,
    isActive: activeFilter,
    barcode: filter.barcodeOrQrCode,
    erpIntegrationId: filter.erpIntegrationId,
    uomGroupId: filter.uomGroupId,
    baseUom: filter.baseUom,
    dispenseUom: filter.dispenseUom,
    warrantyStartDate: toIsoDate(filter.warrantyStartDate),
    warrantyEndDate: toIsoDate(filter.warrantyEndDate)
  });

  const [toggleInventoryProductActive] = useToggleInventoryProductActiveMutation();
  const divContent = 'Inventory Products Setup';

  useEffect(() => {
    dispatch(setPageCode('Product'));
    dispatch(setDivContent(divContent));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const isSelected = (rowData: InventoryProduct) => {
    const rowId = rowData?.id ?? rowData?.Id;
    const selectedId = product?.id ?? product?.Id;

    if (!selectedId) return "";

    return rowId === selectedId ? "selected-row" : "";
  };
  const handleNew = () => {
    setProduct({ ...newInventoryProduct });
    setProductOpen(true);
  };
  const handlePageChange = (_: unknown, newPage: number) => {
    setPaginationParams(prev => ({
      ...prev,
      page: newPage,
    }));
  };
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(event.target.value);
    setPaginationParams(prev => ({
      ...prev,
      size: newSize,
      page: 0,
    }));
  };
  const handleDeactiveReactivateProduct = async () => {
    const currentProduct = {
      ...product,
      id: product?.id ?? product?.Id
    };

    if (!currentProduct.id) return;

    try {
      await toggleInventoryProductActive({ id: currentProduct.id }).unwrap()
        .catch(() =>{});

      dispatch(
        notify({
          msg:
            stateOfDeleteModal === "deactivate"
              ? "The Product was successfully deactivated"
              : "The Product was successfully reactivated",
          sev: "success",
        })
      );

      setOpenConfirmDeleteProductModal(false);
    } catch (error) {
      dispatch(
        notify({
          msg: "Failed to " + stateOfDeleteModal + " this Product",
          sev: "error",
        })
      );
    }
  };

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ───────────── SORT HANDLER ─────────────
  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortType(type);

    const sortValue = `${column},${type}`;
    setPaginationParams(prev => ({
      ...prev,
      sort: sortValue,
      page: 0,
    }));
  };
  // Applying one header filter also applies whatever is typed in the others
  const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
    const next = { ...headerFilters, [field]: value };
    setHeaderFilters(next);
    setAppliedFilters(next);
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  };

  const headerSearch = (field: HeaderFilterField, placeholder?: string) => ({
    searchable: true,
    searchPlaceholder: placeholder,
    searchValue: headerFilters[field],
    onSearchChange: (value: string) => setHeaderFilters(prev => ({ ...prev, [field]: value })),
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field])
  });

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

  const productType = useEnumOptions("ProductTypes");
  const lotSerial = useEnumOptions("InventoryType");

  const iconsForActions = (rowData: InventoryProduct) => (
    <div className="container-of-icons">
      {/* Edit */}
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setProduct({ ...rowData, id: rowData?.id ?? rowData?.Id });
          setProductOpen(true);
        }}
      />
      {/* Deactivate / Activate based on isActive */}
      {rowData.isActive ? (
        <MdDelete
          className="icons"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setProduct({
              ...rowData,
            });
            setStateOfDeleteModal("deactivate");
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
            setProduct(rowData);
            setStateOfDeleteModal('reactivate');
            setOpenConfirmDeleteProductModal(true);
          }}
        />
      )}
    </div>
  );
  const tableColumns = [
    {
      key: 'type',
      title: <Translate>Item Type</Translate>,
      width: 170,
      ...headerSearch('type'),
      searchType: 'select' as const,
      searchOptions: [{ label: 'All', value: '' }, ...(productType ?? [])],
      render: (rowData: InventoryProduct) => formatEnumString(rowData.type ?? ''),
    },
    {
      key: 'code',
      title: <Translate>Item Code</Translate>,
      width: 140,
      ...headerSearch('code', 'Search code'),
      render: (rowData: InventoryProduct) => rowData.code ?? '',
    },
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      width: 200,
      ...headerSearch('name', 'Search name'),
      render: (rowData: InventoryProduct) => rowData.name ?? '',
    },
    {
      key: 'baseUom',
      title: <Translate>Base UOM</Translate>,
      flexGrow: 4,
      render: (rowData: InventoryProduct) => rowData.baseUom ?? '',
    },
    {
      key: 'inventoryType',
      title: <Translate>Lot Type</Translate>,
      width: 130,
      ...headerSearch('inventoryType'),
      searchType: 'select' as const,
      searchOptions: [{ label: 'All', value: '' }, ...(lotSerial ?? [])],
      render: (rowData: any) => {
        const status = rowData?.inventoryType || 'Unknown';

        const getStatusConfig = (s: string) => {
          switch (s) {
            case 'LOT':
              return {
                backgroundColor: 'var(--light-green)',
                color: 'var(--primary-green)',
                contant: 'LOT',
              };
            case 'SERIAL':
              return {
                backgroundColor: 'var(--light-purple)',
                color: 'var(--primary-purple)',
                contant: 'Serial',
              };
            default:
              return {
                backgroundColor: 'var(--background-gray)',
                color: 'var(--primary-gray)',
                contant: s || 'Unknown',
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
      },
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      width: 120,
      searchable: true,
      searchType: 'select' as const,
      searchOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'All', value: 'all' }
      ],
      searchValue: statusFilter,
      onSearchChange: (value: string) => setStatusFilter(value as 'active' | 'inactive' | 'all'),
      render: (rowData: any) => (
        <MyBadgeStatus
          contant={rowData?.isActive ? 'Active' : 'Inactive'}
          color={rowData?.isActive ? '#415be7' : '#b1acacff'}
        />
      )
    },
    {
      key: 'createdBy',
      title: <Translate>Created By</Translate>,
      flexGrow: 4,
      render: (rowData: any) => rowData?.createdBy ?? '',
    },
    {
      key: 'createdDate',
      title: <Translate>Created At</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.createdDate ? formatDateWithoutSeconds(rowData.createdDate) : '',
    },
    {
      key: 'lastModifiedBy',
      title: <Translate>Updated By</Translate>,
      flexGrow: 4,
      render: (rowData: any) => rowData?.lastModifiedBy ?? '',
    },
    {
      key: 'lastModifiedDate',
      title: <Translate>Updated At</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.lastModifiedDate ? formatDateWithoutSeconds(rowData.lastModifiedDate) : '',
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 3,
      render: (rowData: InventoryProduct) => iconsForActions(rowData),
    },
  ];
  const tabData = [
    {
      title: 'Bacis Info',
      content: <BasicInf product={product} setProduct={setProduct} disabled={true} />,
    },
    {
      title: 'Maintenance Information',
      content: (
        <MaintenanceInformation product={product} setProduct={setProduct} disabled={true} />
      ),
    },
    {
      title: 'UOM',
      content: <UomGroup product={product} setProduct={setProduct} disabled={true} />,
    },
    {
      title: 'Inventory Attributes',
      content: (
        <InventoryAttributes product={product} setProduct={setProduct} disabled={true} />
      ),
    },
    {
      title: 'Regulatory & Safety',
      content: <RegulSafty product={product} setProduct={setProduct} disabled={true} />,
    },
    {
      title: 'Financial & Costing Information',
      content: <FinancCostInfo product={product} setProduct={setProduct} disabled={true} facilityCurrency={facility?.defaultCurrency} />,
    },
  ];
  const tabContant = () => (
    <Box>
      <MyTab data={tabData} lazy/>
    </Box>
  );



  const contents = (
    <div className="advanced-filters">
      <Form fluid layout="inline" className="dissss">

        <MyInput
          column
          fieldName="barcodeOrQrCode"
          fieldLabel="Barcode / QR"
          fieldType="text"
          record={filter}
          setRecord={setFilter}
          width={180}
        />


        <MyInput
          column
          fieldName="warrantyStartDate"
          fieldLabel="Warranty Start"
          fieldType="date"
          record={filter}
          setRecord={setFilter}
          width={180}
        />

        <MyInput
          column
          fieldName="warrantyEndDate"
          fieldLabel="Warranty End"
          fieldType="date"
          record={filter}
          setRecord={setFilter}
          width={180}
        />

        <MyInput
          column
          fieldName="dispenseUom"
          fieldLabel="Dispense UOM"
          fieldType="select"
          selectData={(uomUnitsResponse ?? []).map(u => ({
            label: u.uom,
            value: u.id
          }))} 
          selectDataLabel="label"
          selectDataValue="value"
          record={filter}
          setRecord={setFilter}
          width={180}
          disabled={!filter?.uomGroupId}
        />



        <MyInput
          column
          fieldName="erpIntegrationId"
          fieldLabel="ERP ID"
          fieldType="text"
          record={filter}
          setRecord={setFilter}
          width={160}
        />

      </Form>
    </div>
  );

  const filters = (
    <>

      <Form fluid layout='inline'>
        <MyInput
          column
          fieldLabel="UOM Group"
          fieldName="uomGroupId"
          fieldType="select"
          selectData={uomGroupsListResponse?.data ?? []}
          selectDataLabel="name"
          selectDataValue="id"
          record={filter}
          setRecord={setFilter}
          searchable
          width={200}
        />

        <MyInput
          column
          fieldName="baseUom"
          fieldLabel="Base UOM"
          fieldType="select"
          selectData={(uomUnitsResponse ?? []).map(u => ({
            label: u.uom,
            value: u.id
          }))}
          selectDataLabel="label"
          selectDataValue="value"
          record={filter}
          setRecord={setFilter}
          width={150}
          disabled={!filter?.uomGroupId}
        />




      </Form>

        <AdvancedSearchFilters
            searchFilter={true}
            content={contents}
            clearOnClick={() => {
                setFilter({
                    barcodeOrQrCode: "",
                    warrantyStartDate: null,
                    warrantyEndDate: null,
                    uomGroupId: 0,
                    baseUom: null,
                    dispenseUom: null,
                    erpIntegrationId: ""
                });
            }}
        />
    </>
  );

  const tablebuttons = (
    <div className="container-of-add-new-button">
      <MyButton
        prefixIcon={() => <AddOutlineIcon />}
        color="var(--deep-blue)"
        onClick={handleNew}
        width="109px"
      >
        Add New
      </MyButton>
    </div>
  );

  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;
  const totalCount = productListResponse?.totalCount ?? 0;
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [filter]);

  useEffect(() => {
    setFilter(f => ({ ...f, baseUom: null }));
  }, [filter.uomGroupId]);


        // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  
  return (
    <Panel dir={dir}>
      <MyTable
        height={450}
        data={productListResponse?.data ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={(rowData) => isSelected(rowData)}
        filters={filters}
        tableButtons={tablebuttons}
        onRowClick={(rowData) => setProduct({ ...rowData, id: rowData?.id ?? rowData?.Id })}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
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
      />

      <DeletionConfirmationModal
        open={openConfirmDeleteProductModal}
        setOpen={setOpenConfirmDeleteProductModal}
        itemToDelete="Product"
        actionButtonFunction={handleDeactiveReactivateProduct}
        actionType={stateOfDeleteModal}
      />

      {product.id && tabContant()}
    </Panel>
  );
};

export default ProductSetup;
