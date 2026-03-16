import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import { useLocation } from 'react-router-dom';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useGetServicesQuery } from '@/services/setup/serviceService';
import { useGetInventoryProductsQuery } from '@/services/inventory/inventory-products/inventoryProductsService';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService ';
import { notify } from '@/utils/uiReducerActions';
import { BrandMedication, InventoryProduct, PatientServiceAndProduct } from '@/types/model-types-new';
import {
  useDeletePatientServiceOrProductMutation,
  useGetPatientServicesAndProductsByEncounterQuery,
} from '@/services/encounters/patientServicesAndProductsService';
import { formatEnumString } from '@/utils';
import { newPatientServiceAndProduct } from '@/types/model-types-constructor-new';
import AddEditPatientServiceAndProduct from './AddEditPatientServiceAndProduct';

const ServiceAndProductsTab = ({ edit: propEdit }) => {
  const location = useLocation();
  const encounter = location.state?.encounter;

  const authSlice = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

   const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  // Delete mutation for selected service/product row.
  const [deletePatientServiceProduct] = useDeletePatientServiceOrProductMutation();

  // Main list for the current encounter.
  const { data: patientServiceProductListResponse, refetch, isLoading } =
    useGetPatientServicesAndProductsByEncounterQuery(
      {
        encounterId: encounter?.id,
        ...paginationParams
      },
      {
        skip: !encounter?.id,
      }
    );

  const state = location.state || {};
  const edit = propEdit ?? state.edit;

  const [openModal, setOpenModal] = useState(false);
  const [popupOpen, setPopupOpen] = useState<boolean>(false);
  const [patientServiceAndProduct, setPatientServiceAndProduct] =
    useState<PatientServiceAndProduct>({ ...newPatientServiceAndProduct });
    const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  // Master data used to resolve display names in the table.
  const { data: serviceListResponse } = useGetServicesQuery({
    facilityId: authSlice?.tenant?.selectedFacility?.id,
  });
  const { data: inventoryProductsResponse } = useGetInventoryProductsQuery({});
  const { data: brandMedicationList } = useGetAllBrandMedicationsQuery({});

  const products: InventoryProduct[] = inventoryProductsResponse?.data ?? [];
  const brands: BrandMedication[] = brandMedicationList?.data ?? [];
  const services = serviceListResponse?.data ?? [];

  const getProductById = (id?: number) => products.find((p) => p.Id === id);

  const totalCount = patientServiceProductListResponse?.totalCount ?? 0;

   // Class name for selected row
  const isSelected = (rowData: PatientServiceAndProduct) => {
    if (rowData && patientServiceAndProduct && rowData.id === patientServiceAndProduct.id) {
      return 'selected-row';
    } else return '';
  };

  // Delete the currently selected row after user confirmation.
  const handleDelete = async () => {
    if (patientServiceAndProduct?.id === undefined) return;

    try {
      await deletePatientServiceProduct({
        id: patientServiceAndProduct?.id,
      }).unwrap();
      dispatch(
        notify({ msg: 'Patient Service/Product Deleted Successfully', sev: 'success' })
      );
      setPatientServiceAndProduct({ ...newPatientServiceAndProduct });
      refetch();
      setOpenModal(false);
    } catch (error) {
      dispatch(
        notify({ msg: 'Failed to delete Patient Service/Product', sev: 'error' })
      );
    }
  };

  const handlePageChange = (event, newPage) => {
    setPaginationParams({ ...paginationParams, page: newPage });
  };

  const handleSortChange = (newSortColumn: string, newSortType: 'asc' | 'desc') => {
    setSortColumn(newSortColumn);
    setSortType(newSortType);

    const sortValue = `${newSortColumn},${newSortType}`;
    setPaginationParams({
      ...paginationParams,
      sort: sortValue,
      page: 0,
      timestamp: Date.now()
    });
  };

  // Table columns.
  const columns = [
    {
      key: 'category',
      title: 'Category',
      render: (rowData: any) => <span>{formatEnumString(rowData.category)}</span>,
    },
    {
      key: 'name',
      title: 'Name',
      isLink: true,
      render: (rowData) => {
        // Product name
        if (rowData.productId) {
          const product = products.find((p) => p.Id === rowData.productId);
          if (!product) return '-';
          return <span>{product?.name}</span>;
        }

        // Service name lookup.
        if (rowData.serviceId) {
          const service = services.find((s) => String(s.id) === String(rowData.serviceId));
          return <span>{service?.name ?? rowData.name}</span>;
        }

        // Fallback when data is incomplete.
        return <span>-</span>;
      },
    },
    {
      key: 'type',
      title: 'Type',
      render: (rowData) => {
        if (rowData.category === 'SERVICE') {
          return '-';
        }

        if (rowData.category === 'PRODUCT') {
          const product = getProductById(rowData.productId);
          if (product) return <span>{formatEnumString(product?.type)}</span>;
          return '-';
        }

        return '-';
      },
    },
    { key: 'quantity', title: 'Quantity' },
    {
      key: '',
      title: '',
      render: (rowData) => (
        <div className="container-of-icons">
          <MdModeEdit
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            className="icons-style"
            onClick={() => {
              setPopupOpen(true);
            }}
          />
          <MdDelete
            title="Delete"
            size={24}
            fill="var(--primary-pink)"
            className="icons-style"
            onClick={() => {
              setPatientServiceAndProduct(rowData);
              setOpenModal(true);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Add new row entry */}
      <div className="bt-div">
        <div className="bt-right">
          <MyButton
            prefixIcon={() => <PlusIcon />}
            disabled={edit}
            onClick={() => {
              setPopupOpen(true);
              setPatientServiceAndProduct({ ...newPatientServiceAndProduct });
            }}
          >
            Add
          </MyButton>
        </div>
      </div>

      {/* Current encounter services/products list */}
      <MyTable
        data={patientServiceProductListResponse?.data ?? []}
        columns={columns}
        rowClassName={isSelected}
        onRowClick={(rowData) => {
          setPatientServiceAndProduct(rowData);
        }}
         totalCount={totalCount}
          loading={isLoading}
          page={paginationParams.page}
          rowsPerPage={paginationParams.size}
          onPageChange={handlePageChange}
          onRowsPerPageChange={e => {
            const newSize = Number(e.target.value);
            setPaginationParams({
              ...paginationParams,
              size: newSize,
              page: 0,
              timestamp: Date.now()
            });
          }}
          sortColumn={sortColumn}
          sortType={sortType}
          onSortChange={handleSortChange}
      />

      {/* Add/Edit modal */}
      <AddEditPatientServiceAndProduct
        open={popupOpen}
        setOpen={setPopupOpen}
        patientServiceAndProduct={patientServiceAndProduct}
        setPatientServiceAndProduct={setPatientServiceAndProduct}
      />

      {/* Delete confirmation modal */}
      <DeletionConfirmationModal
        open={openModal}
        setOpen={setOpenModal}
        itemToDelete={'product/service'}
        actionButtonFunction={handleDelete}
        actionType="delete"
        confirmationQuestion="Are you sure you want to delete this product/service?"
        actionButtonLabel="Delete"
        cancelButtonLabel="Cancel"
      />
    </div>
  );
};

export default ServiceAndProductsTab;
