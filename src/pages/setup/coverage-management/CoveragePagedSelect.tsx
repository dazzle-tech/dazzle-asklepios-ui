import React, { useState } from 'react';
import MyInput from '@/components/MyInput';
import {
  formatLookupLabel,
  useDebouncedSearch,
  usePagedLookupCache,
  withAllOption
} from './coverageHelpers';
import type { CoverageLookupItem } from '@/services/setup/coverageManagement/coverageManagementService';

type Props = {
  fieldName: string;
  fieldLabel: string;
  record: any;
  setRecord: (next: any) => void;
  result: { data?: any; isFetching: boolean };
  page: number;
  setPage: (updater: any) => void;
  search: string;
  setSearch: (value: string) => void;
  resetToken?: string | number;
  required?: boolean;
  disabled?: boolean;
  includeAll?: boolean;
  placeholder?: string;
  showLabel?: boolean;
  width?: string;
  onSelected?: (item: CoverageLookupItem | null) => void;
};

const CoveragePagedSelect = ({
  fieldName,
  fieldLabel,
  record,
  setRecord,
  result,
  page,
  setPage,
  search,
  setSearch,
  resetToken,
  required,
  disabled,
  includeAll,
  placeholder,
  showLabel,
  width,
  onSelected
}: Props) => {
  const lookup = usePagedLookupCache({
    result,
    page,
    setPage,
    search,
    setSearch,
    resetToken
  });

  const options = includeAll ? withAllOption(lookup.options) : lookup.options;

  return (
    <MyInput
      required={required}
      disabled={disabled}
      width={width ?? '100%'}
      fieldLabel={fieldLabel}
      fieldType="selectPagination"
      fieldName={fieldName}
      record={record}
      setRecord={setRecord}
      showLabel={showLabel}
      selectData={options.map(item => ({
        ...item,
        displayName: formatLookupLabel(item)
      }))}
      selectDataLabel="displayName"
      selectDataValue="id"
      searchable
      searchKeyWard={lookup.search}
      setSearchKeyWard={lookup.setSearch}
      loading={lookup.loading}
      hasMore={lookup.hasMore}
      onFetchMore={lookup.fetchMore}
      placeholder={placeholder}
      onSelectItem={(item: CoverageLookupItem | null) => {
        onSelected?.(item ?? null);
      }}
    />
  );
};

export const useLookupPaging = (resetToken?: string | number) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const appliedSearch = useDebouncedSearch(search);
  return { search, setSearch, page, setPage, appliedSearch, resetToken };
};

export default CoveragePagedSelect;
