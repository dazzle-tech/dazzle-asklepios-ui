import MyTable from '@/components/MyTable';
import { useAppSelector } from '@/hooks';
import { useGetNurseServiceProductListQuery } from '@/services/encounterService';
import { useGetInventoryProductsQuery } from '@/services/inventory/inventory-products/inventoryProductsService';
import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService ';
import { useGetServicesQuery } from '@/services/setup/serviceService';
import { BrandMedication, InventoryProduct } from '@/types/model-types-new';
import { initialListRequest } from '@/types/types';
import React, { useMemo, useState } from 'react';

const SERVICE_CATEGORY_LKEY = '19257854232732994';
const PRODUCT_CATEGORY_LKEY = '19257880375908711';

const lookupPage = 0;
const lookupSize = 100;
const lookupSort = 'id,asc';

const AppliedServicesTable = ({ patient }) => {
  const [sortColumn, setSortColumn] = useState('startDate');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const authSlice = useAppSelector((state) => state.auth);

  const nurseServiceProductListRequest = useMemo(
    () => ({
      ...initialListRequest,
      filters: patient?.id
        ? [
            {
              fieldName: 'patient_key',
              operator: 'match',
              value: patient.id,
            },
          ]
        : [],
      pageSize: 100,
      pageNumber: 1,
    }),
    [patient?.id]
  );

  const { data: serviceListResponse } = useGetServicesQuery({
    facilityId: authSlice?.tenant?.selectedFacility?.id,
    page: lookupPage,
    size: lookupSize,
    sort: lookupSort,
  });

  const { data: inventoryProductsResponse } = useGetInventoryProductsQuery({
    page: lookupPage,
    size: lookupSize,
    sort: lookupSort,
  });

  const { data: brandMedicationList } = useGetAllBrandMedicationsQuery({
    page: 0,
    size: 500,
    sort: 'id,asc',
  });

  const { data: nurseServiceProductListResponse } =
    useGetNurseServiceProductListQuery(nurseServiceProductListRequest, {
      skip: !patient?.id,
    });

  const products: InventoryProduct[] = inventoryProductsResponse?.data ?? [];
  const brands: BrandMedication[] = brandMedicationList?.data ?? [];
  const services = serviceListResponse?.data ?? [];
  const tableData = nurseServiceProductListResponse?.object ?? [];

  const getProductById = (id?: number | string) =>
    products.find((p) => String(p.id ?? p.Id) === String(id));

  const getBrandById = (id?: number | string) =>
    brands.find((b) => String(b.id) === String(id));

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
          const service = services.find(
            (s) => String(s.id) === String(rowData?.serviceId)
          );
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
          const service = services.find(
            (s) => String(s.id) === String(rowData?.serviceId)
          );
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
    {
      key: 'quantity',
      title: 'Quantity',
      render: (rowData) => rowData?.quantity,
    },
  ];

  const sortedData = [...tableData].sort((a, b) => {
    const aValue = a?.[sortColumn];
    const bValue = b?.[sortColumn];

    if (aValue === bValue) return 0;

    return sortType === 'asc'
      ? aValue > bValue
        ? 1
        : -1
      : aValue < bValue
      ? 1
      : -1;
  });

  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    (page + 1) * rowsPerPage
  );

  return (
    <MyTable
      data={patient?.id ? paginatedData : []}
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
      totalCount={patient?.id ? tableData.length : 0}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={(e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
    />
  );
};

export default AppliedServicesTable;