import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import { Form, Panel } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsersLine } from '@fortawesome/free-solid-svg-icons';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { PriceList, PriceListItem } from '@/types/model-types-new';
import { newPriceList, newPriceListItem } from '@/types/model-types-constructor-new';
import {
  useGetAllPriceListsQuery,
  useLazyGetPriceListsByNameQuery,
  useLazyGetPriceListsByTypeQuery
} from '@/services/billing/PriceListService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useEnumOptions } from '@/services/enumsApi';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { conjureValueBasedOnIDFromList, formatEnumString } from '@/utils';
import { PaginationPerPage } from '@/utils/paginationPerPage';
import MyInput from '@/components/MyInput';
import { useGetPriceListItemsByPriceListIdQuery } from '@/services/billing/PriceListItemService';
import { useGetAllServicesQuery } from '@/services/setup/serviceService';
import { useGetInventoryProductsQuery } from '@/services/inventory/inventory-products/inventoryProductsService';
const ViewPriceList = ({ open, setOpen }) => {
  const dispatch = useAppDispatch();

  const [priceList, setPriceList] = useState<PriceList>({ ...newPriceList });
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [item, setItem] = useState<PriceListItem>({
    ...newPriceListItem,
    priceListId: priceList?.id ?? 0
  });
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<PriceList[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc'
  });

  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [link, setLink] = useState({});

  const { data: priceListResponse, isFetching } = useGetAllPriceListsQuery(paginationParams);

  const { data: itemsRes, isFetching: isFetchingItems } = useGetPriceListItemsByPriceListIdQuery(
    { priceListId: priceList?.id as number, page: 0, size: 50, sort: 'id,asc' },
    { skip: !priceList?.id }
  );
  const items = itemsRes?.data ?? [];
  const { data: servicesData } = useGetAllServicesQuery({ page: 0, size: 1000 });
  const servicesList = servicesData?.data ?? [];
  const { data: AllProducts } = useGetInventoryProductsQuery({ page: 0, size: 1000 });
  const [getByName] = useLazyGetPriceListsByNameQuery();
  const [getByType] = useLazyGetPriceListsByTypeQuery();
  const { data: allFacilities = [] } = useGetAllFacilitiesQuery(null);
  const priceListTypes = useEnumOptions('PriceListTypes');

  const totalCount = priceListResponse?.totalCount ?? 0;
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  useEffect(() => {
    dispatch(setPageCode('PriceLists'));
    dispatch(setDivContent('Price Lists'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => setLink(priceListResponse?.links), [priceListResponse?.links]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filterFields = [
    { label: 'Type', value: 'type' },
    { label: 'Facility', value: 'facility' },
    { label: 'Name', value: 'name' }
  ];

  const handleFilterChange = async (field: string, value: string, page = 0, size?: number) => {
    try {
      if (!field || !value) {
        setIsFiltered(false);
        setFilteredList([]);
        return;
      }

      const currentSize = size ?? filterPagination.size;
      const params = { page, size: currentSize, sort: filterPagination.sort };

      let response: any;

      if (field === 'type') {
        response = await getByType({ type: value, ...params }).unwrap();
      } else if (field === 'name') {
        response = await getByName({ name: value, ...params }).unwrap();
      } else if (field === 'facility') {
        dispatch(
          notify({ msg: 'Filter by Facility not implemented on backend yet', sev: 'warning' })
        );
        return;
      }

      setFilteredList(response.data ?? []);
      setFilteredTotal(response.totalCount ?? 0);
      setLink(response.links);
      setIsFiltered(true);
      setFilterPagination({ ...filterPagination, page, size: currentSize });
    } catch (error) {
      dispatch(notify({ msg: 'Failed to filter price lists', sev: 'error' }));
      setIsFiltered(false);
    }
  };

  const handleSortChange = (sortCol: string, sortT: 'asc' | 'desc') => {
    setSortColumn(sortCol);
    setSortType(sortT);

    const sortValue = `${sortCol},${sortT}`;

    if (isFiltered) {
      setFilterPagination({ ...filterPagination, sort: sortValue, page: 0 });
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, filterPagination.size);
    } else {
      setPaginationParams({ ...paginationParams, sort: sortValue, page: 0, timestamp: Date.now() });
    }
  };

  const isSelected = (rowData: PriceList) => (rowData?.id === priceList?.id ? 'selected-row' : '');

  const tableColumns = [
    {
      key: 'facilityId',
      title: 'Facility',
      flexGrow: 3,
      render: (rowData: any) =>
        conjureValueBasedOnIDFromList(allFacilities, rowData?.facilityId, 'name')
    },
    { key: 'name', title: 'Name', flexGrow: 4 },
    {
      key: 'type',
      title: 'Type',
      flexGrow: 3,
      render: (rowData: PriceList) => <p>{formatEnumString(rowData.type)}</p>
    },
    {
      key: 'effectiveFrom',
      title: 'Effective From',
      flexGrow: 3
    },
    {
      key: 'effectiveTo',
      title: 'Effective To',
      flexGrow: 3,
      render: (rowData: PriceList) => <p>{rowData.effectiveTo ?? '-'}</p>
    }
  ];

  const tableItemsColumns = [
    {
      key: 'itemType',
      title: 'Item Type',
      flexGrow: 2,
      render: (r: PriceListItem) => <span>{formatEnumString(r.itemType)}</span>
    },
    {
      key: 'productType',
      title: 'Product Type',
      flexGrow: 2,
      render: (r: PriceListItem) => (
        <span>{r.itemType === 'PRODUCT' ? formatEnumString(r.productType) : '-'}</span>
      )
    },
    {
      key: 'target',
      title: 'Item',
      flexGrow: 4,
      render: (r: PriceListItem) => {
        if (r.itemType === 'SERVICE') {
          return (
            <span>{servicesList.find((s: any) => s.id === r.serviceId)?.name ?? r.serviceId}</span>
          );
        }
        return (
          <span>
            {AllProducts?.data.find((p: any) => p.Id === r.productId)?.name ?? r.productId}
          </span>
        );
      }
    },
    {
      key: 'price',
      title: 'Price',
      flexGrow: 2
    },
    {
      key: 'discountAllowed',
      title: 'Discount Allowed',
      flexGrow: 2,
      render: (r: PriceListItem) => <span>{r.discountAllowed ? 'Yes' : 'No'}</span>
    }
  ];

  const handlePageChange = (event, newPage) => {
    if (isFiltered) {
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, newPage);
    } else {
      PaginationPerPage.handlePageChange(
        event,
        newPage,
        paginationParams,
        link,
        setPaginationParams
      );
    }
  };

  const filters = () => (
    <Form layout="inline" style={{ display: 'flex', gap: '10px' }}>
      <MyInput
        fieldName="filter"
        fieldType="select"
        selectData={filterFields}
        selectDataLabel="label"
        selectDataValue="value"
        record={recordOfFilter}
        setRecord={u => setRecordOfFilter({ filter: u.filter, value: '' })}
        placeholder="Select Filter"
        showLabel={false}
        width="180px"
      />

      {recordOfFilter.filter === 'type' && (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={priceListTypes ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
          placeholder="Select Type"
        />
      )}

      {recordOfFilter.filter === 'facility' && (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={allFacilities ?? []}
          selectDataLabel="name"
          selectDataValue="id"
          record={recordOfFilter}
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
          placeholder="Select Facility"
        />
      )}

      {recordOfFilter.filter === 'name' && (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Enter Name"
        />
      )}

      <MyButton
        color="var(--deep-blue)"
        width="80px"
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
      >
        Search
      </MyButton>
    </Form>
  );
  // Modal content
  const conjureFormContent = () => {
    return (
      <Panel>
        <MyTable
          data={isFiltered ? filteredList : priceListResponse?.data ?? []}
          totalCount={isFiltered ? filteredTotal : totalCount}
          columns={tableColumns}
          rowClassName={isSelected}
          onRowClick={rowData => setPriceList(rowData)}
          filters={filters()}
          loading={isFetching}
          page={isFiltered ? filterPagination.page : pageIndex}
          rowsPerPage={isFiltered ? filterPagination.size : rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={e => {
            const newSize = Number(e.target.value);
            if (isFiltered) {
              setFilterPagination({ ...filterPagination, size: newSize, page: 0 });
              handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
            } else {
              setPaginationParams({
                ...paginationParams,
                size: newSize,
                page: 0,
                timestamp: Date.now()
              });
            }
          }}
          sortColumn={sortColumn}
          sortType={sortType}
          onSortChange={handleSortChange}
        />
        <br />
        {priceList?.id && (
          <MyTable
            height={450}
            data={items}
            columns={tableItemsColumns}
            rowClassName={row => (row?.id === item?.id ? 'selected-row' : '')}
            onRowClick={row => setItem(row)}
            loading={isFetchingItems}
          />
        )}
      </Panel>
    );
  };

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Bulk Registration"
      position="right"
      content={conjureFormContent}
      hideActionBtn
      size={width > 600 ? '36vw' : '70vw'}
      steps={[
        {
          title: 'Bulk Registration',
          icon: <FontAwesomeIcon icon={faUsersLine} />
        }
      ]}
    />
  );
};
export default ViewPriceList;
