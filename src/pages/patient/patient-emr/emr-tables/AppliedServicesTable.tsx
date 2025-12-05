import React, { useEffect, useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import { useLocation } from 'react-router-dom';
import { faTrash, faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetServicesQuery } from '@/services/setup/serviceService';
import { initialListRequest, ListRequest } from '@/types/types';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { ApNurseServiceProduct } from '@/types/model-types';
import { newApNurseServiceProduct } from '@/types/model-types-constructor';
import {
  useGetNurseServiceProductListQuery,

} from '@/services/encounterService';
import {
  useGetInventoryProductsQuery,
} from '@/services/inventory/inventory-products/inventoryProductsService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService ';
import { notify } from '@/utils/uiReducerActions';
import { BrandMedication, InventoryProduct } from '@/types/model-types-new';

const SERVICE_CATEGORY_LKEY = '19257854232732994';
const PRODUCT_CATEGORY_LKEY = '19257880375908711';

  const page = 0;
  const size = 100;
  const sort = 'id,asc';
const AppliedServicesTable = ({patient}) => {
  const [sortColumn, setSortColumn] = useState('startDate');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
 
  
const [nurseServiceProductListRequest, setNurseServiceProductListRequest] =
    useState<ListRequest>({
      ...initialListRequest,
      filters: [
        { fieldName: 'patient_key', operator: 'match', value: patient?.key },
      
      ],
      pageSize: 100,
    });
const authSlice = useAppSelector((state) => state.auth);
      const { data: categoryLovResponse } = useGetLovValuesByCodeQuery('CATEGORY');
      const { data: serviceListResponse } = useGetServicesQuery({
        facilityId: authSlice?.tenant?.selectedFacility?.id,
        page,
        size,
        sort,
      });
      const { data: inventoryProductsResponse } = useGetInventoryProductsQuery({
        page,
        size,
        sort,
      });
      const { data: brandMedicationList } = useGetAllBrandMedicationsQuery({
        page: 0,
        size: 500,
        sort: 'id,asc',
      });
      
     
      
        const getProductById = (id?: number | string) =>
          products.find((p) => String(p.Id) === String(id));
      
        const getBrandById = (id?: number | string) =>
          brands.find((b) => String(b.id) === String(id));
      
        // ---- Actions ----
      
  const products: InventoryProduct[] = inventoryProductsResponse?.data ?? [];
  const brands: BrandMedication[] = brandMedicationList?.data ?? [];
  const services = serviceListResponse?.data ?? [];



        const columns = [
          {
            key: 'Category',
            title: 'Category',
            render: (rowData) =>
              rowData?.categoryLkey
                ? rowData?.categoryLvalue?.lovDisplayVale
                : rowData?.categoryLkey,
          },
          {
            key: 'name',
            title: 'Name',
            isLink: true,
            render: (rowData) => {
              if (rowData?.categoryLkey === PRODUCT_CATEGORY_LKEY) {
                const product = getProductById(rowData?.warehouseProductId);
                if (!product) return rowData?.name;
      
                if (product.type === 'MEDICATION' && product.brandId) {
                  const brand = getBrandById(product.brandId);
                  return <span>{brand?.name ?? product?.name}</span>;
                }
      
                return <span>{product?.name}</span>;
              }
      
              if (rowData?.categoryLkey === SERVICE_CATEGORY_LKEY) {
                const service = services?.find((s) => s.id === rowData?.serviceId);
                return <span>{service?.name ?? rowData?.name}</span>;
              }
      
              return rowData?.name;
            },
          },
          {
            key: 'type',
            title: 'Type',
            render: (rowData) => {
              if (rowData?.categoryLkey === SERVICE_CATEGORY_LKEY) {
                const service = services?.find((s) => s.id === rowData?.serviceId);
                return service?.category ?? '';
              }
      
              if (rowData?.categoryLkey === PRODUCT_CATEGORY_LKEY) {
                const product = getProductById(rowData?.warehouseProductId);
                if (!product) return rowData?.type ?? '';
                if (product?.type === 'MEDICATION') return 'Medication';
                return product?.type;
              }
      
              return rowData?.type ?? '';
            },
          },
          { key: 'quantity', title: 'Quantity',
            render: (rowData) => rowData?.quantity
            
           },

       
        ];



  const { data: nurseServiceProductListResponse, refetch } =
    useGetNurseServiceProductListQuery(nurseServiceProductListRequest);
    
       const sortedData = [...nurseServiceProductListResponse?.object].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    if (aValue === bValue) return 0;
    return sortType === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
  });
      const paginatedData = sortedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    
      <MyTable
            data={paginatedData ?? []}
            columns={columns}
   
      loading={false}
      sortColumn={sortColumn}
      sortType={sortType}
      onSortChange={(col, type) => {
        setSortColumn(col);
        setSortType(type);
      }}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={nurseServiceProductListResponse?.object.length}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={e => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
    />
  );
};

export default AppliedServicesTable;
