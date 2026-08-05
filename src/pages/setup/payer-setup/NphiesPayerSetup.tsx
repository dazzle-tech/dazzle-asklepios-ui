import React, { useEffect, useState } from 'react';
import './styles.less';
import { Panel, Form } from 'rsuite';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';

import { NphiesPayer } from '@/types/model-types-new';

import {
  useGetAllNphiesPayersQuery,
  useGetNphiesPayersByNphiesIdQuery,
  useGetNphiesPayersByNameEnQuery,
  useGetNphiesPayersByNameArQuery
} from '@/services/setup/payer/NphiesPayerSetupService';

type FilterCriteria = '' | 'nphiesId' | 'nameEn' | 'nameAr';

const filterCriteriaOptions = [
  { label: 'NPHIES ID', value: 'nphiesId' },
  { label: 'English Name', value: 'nameEn' },
  { label: 'Arabic Name', value: 'nameAr' }
];

const initialNphiesPayerFilter = {
  criteria: '' as FilterCriteria,
  nphiesId: '',
  nameEn: '',
  nameAr: ''
};

const NphiesPayerSetup = () => {
  const dispatch = useAppDispatch();

  const [selectedPayer, setSelectedPayer] = useState<NphiesPayer | null>(null);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  const [payerFilter, setPayerFilter] = useState<{
    criteria: FilterCriteria;
    nphiesId: string;
    nameEn: string;
    nameAr: string;
  }>(initialNphiesPayerFilter);

  const [appliedPayerFilter, setAppliedPayerFilter] = useState<{
    criteria: FilterCriteria;
    nphiesId: string;
    nameEn: string;
    nameAr: string;
  }>(initialNphiesPayerFilter);

  const hasNphiesIdFilter =
    appliedPayerFilter.criteria === 'nphiesId' && !!appliedPayerFilter.nphiesId?.trim();

  const hasNameEnFilter =
    appliedPayerFilter.criteria === 'nameEn' && !!appliedPayerFilter.nameEn?.trim();

  const hasNameArFilter =
    appliedPayerFilter.criteria === 'nameAr' && !!appliedPayerFilter.nameAr?.trim();

  const allPayersQuery = useGetAllNphiesPayersQuery(
    {
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort
    },
    {
      skip: hasNphiesIdFilter || hasNameEnFilter || hasNameArFilter
    }
  );

  const payersByNphiesIdQuery = useGetNphiesPayersByNphiesIdQuery(
    {
      nphiesId: appliedPayerFilter.nphiesId.trim(),
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort
    },
    {
      skip: !hasNphiesIdFilter
    }
  );

  const payersByNameEnQuery = useGetNphiesPayersByNameEnQuery(
    {
      nameEn: appliedPayerFilter.nameEn.trim(),
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort
    },
    {
      skip: !hasNameEnFilter
    }
  );

  const payersByNameArQuery = useGetNphiesPayersByNameArQuery(
    {
      nameAr: appliedPayerFilter.nameAr.trim(),
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort
    },
    {
      skip: !hasNameArFilter
    }
  );

  const activePayersResponse = hasNphiesIdFilter
    ? payersByNphiesIdQuery.data
    : hasNameEnFilter
      ? payersByNameEnQuery.data
      : hasNameArFilter
        ? payersByNameArQuery.data
        : allPayersQuery.data;

  const isFetching =
    allPayersQuery.isFetching ||
    payersByNphiesIdQuery.isFetching ||
    payersByNameEnQuery.isFetching ||
    payersByNameArQuery.isFetching;

  useEffect(() => {
    dispatch(setPageCode('NPHIES_PAYER'));
    dispatch(setDivContent('NPHIES Payers'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const handleResetFilter = () => {
    setPayerFilter({ ...initialNphiesPayerFilter });
    setAppliedPayerFilter({ ...initialNphiesPayerFilter });
    setPaginationParams(prev => ({
      ...prev,
      page: 0
    }));
  };

  const isSelected = (rowData: NphiesPayer) => {
    if (rowData && selectedPayer && rowData.id === selectedPayer.id) {
      return 'selected-row';
    }

    return '';
  };

  const handlePageChange = (_event: any, newPage: number) => {
    setPaginationParams(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(e.target.value);

    setPaginationParams(prev => ({
      ...prev,
      size: newSize,
      page: 0
    }));
  };

  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortType(type);

    setPaginationParams(prev => ({
      ...prev,
      sort: `${column},${type}`,
      page: 0
    }));
  };

  const handleSearch = () => {
    if (
      !payerFilter.criteria ||
      (payerFilter.criteria === 'nphiesId' && !payerFilter.nphiesId.trim()) ||
      (payerFilter.criteria === 'nameEn' && !payerFilter.nameEn.trim()) ||
      (payerFilter.criteria === 'nameAr' && !payerFilter.nameAr.trim())
    ) {
      handleResetFilter();
      return;
    }

    setAppliedPayerFilter({
      criteria: payerFilter.criteria,
      nphiesId: payerFilter.nphiesId,
      nameEn: payerFilter.nameEn,
      nameAr: payerFilter.nameAr
    });

    setPaginationParams(prev => ({
      ...prev,
      page: 0
    }));
  };

  const tableColumns = [
    {
      key: 'nphiesId',
      title: <Translate>NPHIES ID</Translate>,
      flexGrow: 2
    },
    {
      key: 'nameEn',
      title: <Translate>Name English</Translate>,
      flexGrow: 3
    },
    {
      key: 'nameAr',
      title: <Translate>Name Arabic</Translate>,
      flexGrow: 3
    },
    {
      key: 'isActive',
      title: <Translate>Active</Translate>,
      flexGrow: 1,
      render: (rowData: NphiesPayer) => <span>{rowData.isActive ? 'Yes' : 'No'}</span>
    }
  ];

  const filters = () => (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        width="180px"
        fieldName="criteria"
        fieldType="select"
        selectData={filterCriteriaOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={payerFilter}
        setRecord={(updated: any) => {
          const next = typeof updated === 'function' ? updated(payerFilter) : updated;
          const nextCriteria = (next?.criteria ?? '') as FilterCriteria;

          if (!nextCriteria) {
            handleResetFilter();
            return;
          }

          setPayerFilter({
            criteria: nextCriteria,
            nphiesId: '',
            nameEn: '',
            nameAr: ''
          });
        }}
        showLabel={false}
        placeholder="Select Criteria"
        searchable={false}
      />

      {payerFilter.criteria === 'nphiesId' && (
        <MyInput
          width="220px"
          fieldName="nphiesId"
          fieldType="text"
          record={payerFilter}
          setRecord={(updated: any) => {
            const next = typeof updated === 'function' ? updated(payerFilter) : updated;
            const nextNphiesId = next?.nphiesId ?? '';

            if (!nextNphiesId.trim()) {
              handleResetFilter();
              return;
            }

            setPayerFilter(prev => ({
              ...prev,
              nphiesId: nextNphiesId
            }));
          }}
          showLabel={false}
          placeholder="Search NPHIES ID"
        />
      )}

      {payerFilter.criteria === 'nameEn' && (
        <MyInput
          width="220px"
          fieldName="nameEn"
          fieldType="text"
          record={payerFilter}
          setRecord={(updated: any) => {
            const next = typeof updated === 'function' ? updated(payerFilter) : updated;
            const nextNameEn = next?.nameEn ?? '';

            if (!nextNameEn.trim()) {
              handleResetFilter();
              return;
            }

            setPayerFilter(prev => ({
              ...prev,
              nameEn: nextNameEn
            }));
          }}
          showLabel={false}
          placeholder="Search English Name"
        />
      )}

      {payerFilter.criteria === 'nameAr' && (
        <MyInput
          width="220px"
          fieldName="nameAr"
          fieldType="text"
          record={payerFilter}
          setRecord={(updated: any) => {
            const next = typeof updated === 'function' ? updated(payerFilter) : updated;
            const nextNameAr = next?.nameAr ?? '';

            if (!nextNameAr.trim()) {
              handleResetFilter();
              return;
            }

            setPayerFilter(prev => ({
              ...prev,
              nameAr: nextNameAr
            }));
          }}
          showLabel={false}
          placeholder="Search Arabic Name"
        />
      )}

      <MyButton color="var(--deep-blue)" onClick={handleSearch} width="80px">
        Search
      </MyButton>

      <MyButton color="var(--primary-gray)" onClick={handleResetFilter} width="80px">
        Clear
      </MyButton>
    </Form>
  );

  const totalCount = activePayersResponse?.totalCount ?? 0;
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  return (
    <Panel>
      <MyTable
        data={activePayersResponse?.data ?? []}
        totalCount={totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => setSelectedPayer(rowData)}
        filters={filters()}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
      />
    </Panel>
  );
};

export default NphiesPayerSetup;