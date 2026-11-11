import React, { useEffect, useState } from 'react';
import { Form, Panel } from 'rsuite';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { formatEnumString } from '@/utils';
import { PaginationPerPage } from '@/utils/paginationPerPage';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import {
  useGetDiscountCodesQuery,
  useLazyGetDiscountCodesByCodeQuery,
  useLazyGetDiscountCodesByFacilityQuery,
  useLazyGetDiscountCodesByNameQuery,
  useLazyGetDiscountCodesByTypeQuery,
  useToggleDiscountCodeActiveMutation
} from '@/services/setup/discountCode/discountCodeService';
import type { DiscountCode, DiscountType } from '@/types/model-types-new';
import { newDiscountCode } from '@/types/model-types-constructor-new';
import AddEditDiscountCode from './AddEditDiscountCode';
import './styles.less';

const filterFields = [
  { label: 'Facility', value: 'facilityId' },
  { label: 'Code', value: 'code' },
  { label: 'Name', value: 'name' },
  { label: 'Discount Type', value: 'discountType' }
];

const toSortProperty = (column: string) => {
  const sortProperties: Record<string, string> = {
    facilityName: 'facility.name',
    code: 'code',
    name: 'name',
    discountType: 'discountType',
    value: 'percentage',
    status: 'isActive'
  };
  return sortProperties[column] ?? 'id';
};

const formatDiscountValue = (row: DiscountCode) => {
  if (row.discountType === 'PERCENTAGE') {
    return row.percentage == null ? '-' : `${row.percentage}%`;
  }
  if (row.discountType === 'FIXED_AMOUNT') {
    return [row.fixedAmount, row.currency].filter(value => value != null && value !== '').join(' ') || '-';
  }
  return '-';
};

const DiscountCodeDefinition = () => {
  const dispatch = useAppDispatch();
  const discountTypeOptions = useEnumOptions('DiscountType');
  const [discountCode, setDiscountCode] = useState<DiscountCode>({ ...newDiscountCode });
  const [openAddEdit, setOpenAddEdit] = useState(false);
  const [openConfirmToggle, setOpenConfirmToggle] = useState(false);
  const [toggleActionType, setToggleActionType] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [link, setLink] = useState({});
  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({
    filter: '',
    value: ''
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<DiscountCode[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);

  const { data: discountCodeResponse, isFetching, refetch } = useGetDiscountCodesQuery(paginationParams);
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  const [fetchByFacility] = useLazyGetDiscountCodesByFacilityQuery();
  const [fetchByCode] = useLazyGetDiscountCodesByCodeQuery();
  const [fetchByName] = useLazyGetDiscountCodesByNameQuery();
  const [fetchByType] = useLazyGetDiscountCodesByTypeQuery();
  const [toggleActive] = useToggleDiscountCodeActiveMutation();

  useEffect(() => {
    dispatch(setPageCode('Discount_Code_Definition'));
    dispatch(setDivContent('Discount Code Definition'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    setLink(discountCodeResponse?.links ?? {});
  }, [discountCodeResponse?.links]);

  const handleFilterChange = async (
    field: string,
    value: any,
    page = 0,
    size?: number,
    sort = filterPagination.sort
  ) => {
    if (!field || value === '' || value == null) {
      setIsFiltered(false);
      setFilteredList([]);
      setFilteredTotal(0);
      return;
    }

    const currentSize = size ?? filterPagination.size;
    const params = { page, size: currentSize, sort };

    try {
      let response;
      if (field === 'facilityId') {
        response = await fetchByFacility({ facilityId: value, ...params }).unwrap();
      } else if (field === 'code') {
        response = await fetchByCode({ code: value, ...params }).unwrap();
      } else if (field === 'name') {
        response = await fetchByName({ name: value, ...params }).unwrap();
      } else if (field === 'discountType') {
        response = await fetchByType({ discountType: value as DiscountType, ...params }).unwrap();
      }

      setFilteredList(response?.data ?? []);
      setFilteredTotal(response?.totalCount ?? 0);
      setIsFiltered(true);
      setFilterPagination({ page, size: currentSize, sort });
    } catch {
      dispatch(notify({ msg: 'Failed to filter discount codes', sev: 'error' }));
      setIsFiltered(false);
    }
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    if (isFiltered) {
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, newPage);
      return;
    }
    PaginationPerPage.handlePageChange(event, newPage, paginationParams, link, setPaginationParams);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(event.target.value);
    if (isFiltered) {
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
      return;
    }
    setPaginationParams(prev => ({
      ...prev,
      size: newSize,
      page: 0,
      timestamp: Date.now()
    }));
  };

  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    const sortValue = `${toSortProperty(column)},${type}`;
    setSortColumn(column);
    setSortType(type);
    if (isFiltered) {
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, filterPagination.size, sortValue);
      return;
    }
    setPaginationParams(prev => ({
      ...prev,
      sort: sortValue,
      page: 0,
      timestamp: Date.now()
    }));
  };

  const handleNew = () => {
    setDiscountCode({ ...newDiscountCode });
    setOpenAddEdit(true);
  };

  const handleAfterSave = () => {
    setIsFiltered(false);
    setFilteredList([]);
    setFilteredTotal(0);
    setRecordOfFilter({ filter: '', value: '' });
    setFilterPagination(prev => ({ ...prev, page: 0 }));
    setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
    refetch();
  };

  const handleToggleActive = async () => {
    if (!discountCode?.id) {
      return;
    }
    try {
      dispatch(showSystemLoader());
      await toggleActive(discountCode.id).unwrap();
      setOpenConfirmToggle(false);
      dispatch(
        notify({
          msg:
            toggleActionType === 'deactivate'
              ? 'Discount code deactivated successfully'
              : 'Discount code reactivated successfully',
          sev: 'success'
        })
      );
      if (isFiltered) {
        handleFilterChange(recordOfFilter.filter, recordOfFilter.value, filterPagination.page);
      }
    } catch {
      dispatch(notify({ msg: 'Action failed, please try again', sev: 'warning' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const iconsForActions = (rowData: DiscountCode) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setDiscountCode(rowData);
          setOpenAddEdit(true);
        }}
      />
      {rowData.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setDiscountCode(rowData);
            setToggleActionType('deactivate');
            setOpenConfirmToggle(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setDiscountCode(rowData);
            setToggleActionType('reactivate');
            setOpenConfirmToggle(true);
          }}
        />
      )}
    </div>
  );

  const tableColumns = [
    { key: 'facilityName', title: <Translate>Facility</Translate>, dataKey: 'facilityName' },
    { key: 'code', title: <Translate>Code</Translate>, dataKey: 'code' },
    { key: 'name', title: <Translate>Name</Translate>, dataKey: 'name' },
    {
      key: 'discountType',
      title: <Translate>Discount Type</Translate>,
      render: (row: DiscountCode) => (row.discountType ? formatEnumString(row.discountType) : '-')
    },
    {
      key: 'value',
      title: <Translate>Discount</Translate>,
      render: (row: DiscountCode) => <span className="discount-code-value">{formatDiscountValue(row)}</span>
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: (row: DiscountCode) => (
        <MyBadgeStatus
          color={row.isActive ? '#415be7' : '#b1acac'}
          contant={row.isActive ? 'Active' : 'Inactive'}
        />
      )
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      render: (rowData: DiscountCode) => iconsForActions(rowData)
    }
  ];

  const filters = () => (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={(updated: { filter: string }) =>
          setRecordOfFilter({
            filter: updated.filter,
            value: ''
          })
        }
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />
      {recordOfFilter.filter === 'facilityId' ? (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={facilityListResponse ?? []}
          selectDataLabel="name"
          selectDataValue="id"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          searchable
        />
      ) : recordOfFilter.filter === 'discountType' ? (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={discountTypeOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          searchable={false}
        />
      ) : (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Search"
        />
      )}
      <MyButton
        color="var(--deep-blue)"
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
        width="80px"
      >
        Search
      </MyButton>
    </Form>
  );

  return (
    <Panel>
      <MyTable
        data={isFiltered ? filteredList : discountCodeResponse?.data ?? []}
        totalCount={isFiltered ? filteredTotal : discountCodeResponse?.totalCount ?? 0}
        loading={isFetching && !isFiltered}
        columns={tableColumns}
        rowClassName={(rowData: DiscountCode) =>
          rowData?.id && rowData.id === discountCode?.id ? 'selected-row' : ''
        }
        onRowClick={(rowData: DiscountCode) => setDiscountCode(rowData)}
        filters={filters()}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        tableButtons={
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
        }
      />

      <DeletionConfirmationModal
        open={openConfirmToggle}
        setOpen={setOpenConfirmToggle}
        itemToDelete="Discount Code"
        actionButtonFunction={handleToggleActive}
        actionType={toggleActionType}
      />

      <AddEditDiscountCode
        open={openAddEdit}
        setOpen={setOpenAddEdit}
        discountCode={discountCode}
        onSaved={handleAfterSave}
      />
    </Panel>
  );
};

export default DiscountCodeDefinition;
