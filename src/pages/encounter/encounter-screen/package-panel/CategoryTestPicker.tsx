import React, { useEffect, useMemo, useState } from 'react';
import MyInput from '@/components/MyInput';
import { PackageItemLookup, PackageItemType, useLookupPackageItemsQuery } from '@/services/setup/packageSetupService';

const PAGE_SIZE = 30;

interface Props {
  itemType: string;
  /** Tests already in the order: shown greyed out. */
  excludeIds: number[];
  onPick: (test: PackageItemLookup) => void;
}

/** Searches the active tests of one type (server side, paged) and hands back the one picked. */
const CategoryTestPicker: React.FC<Props> = ({ itemType, excludeIds, onPick }) => {
  const [record, setRecord] = useState<any>({ testId: null });
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(0);
  const [options, setOptions] = useState<PackageItemLookup[]>([]);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(0), [debounced]);

  const { data, isFetching } = useLookupPackageItemsQuery({
    itemType: itemType as PackageItemType,
    search: debounced,
    page,
    size: PAGE_SIZE
  });

  useEffect(() => {
    if (!data) return;
    setOptions(prev => (page === 0 ? data.data : [...prev, ...data.data]));
  }, [data, page]);

  const hasMore = data ? (page + 1) * PAGE_SIZE < data.totalCount : false;
  const pickerData = useMemo(
    () =>
      options.map(o => ({
        ...o,
        value: o.sourceId,
        label: `${o.code ?? ''} - ${o.name ?? ''}`,
        disabled: excludeIds.includes(o.sourceId)
      })),
    [options, excludeIds]
  );

  return (
    <MyInput
      key={resetKey}
      width="100%"
      showLabel={false}
      fieldName="testId"
      fieldLabel="Add test"
      fieldType="selectPagination"
      selectData={pickerData}
      selectDataLabel="label"
      selectDataValue="value"
      record={record}
      setRecord={setRecord}
      loading={isFetching}
      searchKeyWard={search}
      setSearchKeyWard={setSearch}
      hasMore={hasMore}
      onFetchMore={() => {
        if (hasMore && !isFetching) setPage(p => p + 1);
      }}
      onSelectItem={(item: any) => {
        if (!item) return;
        onPick(item);
        // ready for the next test
        setRecord({ testId: null });
        setSearch('');
        setResetKey(k => k + 1);
      }}
      placeholder="Search a test to add"
    />
  );
};

export default CategoryTestPicker;
