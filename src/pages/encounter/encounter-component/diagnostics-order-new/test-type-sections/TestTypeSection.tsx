import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useGetCatalogTestsQuery } from '@/services/setup/catalog/catalogTestService';
import {
  useGetActiveDiagnosticTestsByTypeQuery,
  useGetDiagnosticTestsByIdsQuery
} from '@/services/setup/diagnosticTest/diagnosticTestService';
import { CircularProgress } from '@mui/material';
import { skipToken } from '@reduxjs/toolkit/query';
import SearchIcon from '@rsuite/icons/Search';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Form } from 'rsuite';
import '../styles.less';

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 400;

export const getItemKey = (item: any) => item?.id ?? item?.key;
export const getItemName = (item: any) => item?.testName ?? item?.name ?? '';
export const normalizeSearchText = (value: any) => String(value ?? '').trim().toLocaleLowerCase();

type SectionProps = {
  open: boolean;
  type: 'LABORATORY' | 'RADIOLOGY';
  title: string;
  catalogs: any[];
  selectedKeys: Set<any>;
  selectedCount: number;
  onToggle: (item: any) => void;
  /** Optional fixed list (e.g. favorites). When given, the section shows these tests instead of loading them by type */
  items?: any[];
  loading?: boolean;
};

/* ================= one section (Laboratory or Radiology) ================= */

const TestTypeSection: React.FC<SectionProps> = ({
  open,
  type,
  title,
  catalogs,
  selectedKeys,
  selectedCount,
  onToggle,
  items,
  loading
}) => {
  const hasFixedItems = Array.isArray(items);
  const mode = useSelector((state: any) => state.ui.mode);
  // Paged query: the name is sent to the backend, so changing it starts again from page 0
  const [pagedQuery, setPagedQuery] = useState<{ name: string; page: number }>({ name: '', page: 0 });
  const [tests, setTests] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [catalogFilter, setCatalogFilter] = useState<{ catalogId?: number }>({});
  const catalogId = catalogFilter?.catalogId;

  // Catalog filter: catalog → its test ids → full (active) test objects of this section's type
  const { data: catalogTestsResponse, isFetching: isFetchingCatalogTests } = useGetCatalogTestsQuery(
    open && catalogId ? { catalogId, page: 0, size: 1000 } : skipToken
  );

  const catalogTestIds = useMemo(() => {
    const raw: any = catalogTestsResponse?.data;
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.tests) ? raw.tests : [];
    return list.map((t: any) => t.diagnosticTestId ?? t.testId ?? t.id).filter(Boolean);
  }, [catalogTestsResponse]);

  // A fixed list already has the full test objects, so it only needs the catalog's ids
  const { data: catalogTestsFull, isFetching: isFetchingCatalogFull } = useGetDiagnosticTestsByIdsQuery(
    open && !hasFixedItems && catalogId && catalogTestIds.length ? { ids: catalogTestIds } : skipToken
  );

  const catalogTests = useMemo(
    () =>
      (catalogTestsFull ?? []).filter(
        (t: any) => t?.isActive !== false && normalizeSearchText(t?.type) === normalizeSearchText(type)
      ),
    [catalogTestsFull, type]
  );

  const {
    data: testsResponse,
    currentData: currentTestsResponse,
    originalArgs: testsArgs,
    isFetching
  } = useGetActiveDiagnosticTestsByTypeQuery(
    open && !hasFixedItems
      ? {
        type,
        ...(pagedQuery.name ? { name: pagedQuery.name } : {}),
        page: pagedQuery.page,
        size: PAGE_SIZE,
        sort: 'id,asc'
      }
      : skipToken
  );

  // Send the search to the backend (debounced while typing)
  const applyServerSearch = (value: string) => {
    const name = String(value ?? '').trim();
    setPagedQuery(prev => (prev.name === name ? prev : { name, page: 0 }));
  };

  useEffect(() => {
    const timer = setTimeout(() => applyServerSearch(searchTerm), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fixedItemsOfType = useMemo(
    () =>
      (items ?? []).filter(t => normalizeSearchText(t?.type) === normalizeSearchText(type)),
    [items, type]
  );

  // Clear the search/catalog every time the popup opens (loaded tests are kept, they come from the RTK cache anyway)
  useEffect(() => {
    if (!open) return;
    setSearchInput('');
    setSearchTerm('');
    setCatalogFilter({});
  }, [open]);

  // Accumulate pages (Load More); page 0 (new search) replaces the list
  useEffect(() => {
    const pageData = currentTestsResponse?.data;
    if (!pageData) return;
    if (!testsArgs?.page) {
      setTests(pageData);
      return;
    }
    setTests(prev => {
      const existing = new Set(prev.map(getItemKey));
      return [...prev, ...pageData.filter((t: any) => !existing.has(getItemKey(t)))];
    });
  }, [currentTestsResponse]);

  // Source list:
  //  - fixed items: this type's items, narrowed to the catalog's tests when a catalog is selected
  //  - otherwise:   the catalog's tests (fully loaded) when a catalog is selected, else the paged list
  const catalogTestIdSet = useMemo(() => new Set(catalogTestIds.map(String)), [catalogTestIds]);
  const sourceTests = useMemo(() => {
    if (hasFixedItems) {
      return catalogId
        ? fixedItemsOfType.filter(t => catalogTestIdSet.has(String(getItemKey(t))))
        : fixedItemsOfType;
    }
    return catalogId ? catalogTests : tests;
  }, [hasFixedItems, catalogId, fixedItemsOfType, catalogTestIdSet, catalogTests, tests]);

  const hasMore = !hasFixedItems && !catalogId && tests.length < (testsResponse?.totalCount ?? 0);
  const isLoading = hasFixedItems
    ? !!loading || (!!catalogId && isFetchingCatalogTests)
    : catalogId
      ? isFetchingCatalogTests || isFetchingCatalogFull
      : isFetching && pagedQuery.page === 0;

  const filteredTests = useMemo(() => {
    const term = normalizeSearchText(searchTerm);
    if (!term) return sourceTests;
    return sourceTests.filter(t => normalizeSearchText(getItemName(t)).includes(term));
  }, [sourceTests, searchTerm]);

  // "tests" = what is shown in the list right now (catalog, search and Load More all change it);
  // "selected" (selectedCount) never follows the list — it is everything chosen in this section
  const displayedTotal = filteredTests.length;

  return (
    <div className="test-type-section">
      <div className="test-type-section-header">
        <span>
          <Translate>{title}</Translate>
        </span>
        <span className="test-type-section-counts">
          <span className="test-type-section-count test-type-section-count-selected">
            {selectedCount} <Translate>selected</Translate>
          </span>
          <span className="test-type-section-count">
            {displayedTotal} <Translate>tests</Translate>
          </span>
        </span>
      </div>

      <Form fluid className="test-type-section-filters">
        <div>
          <MyInput
            fieldName="catalogId"
            fieldType="select"
            showLabel={false}
            placeholder="Select Catalog"
            selectData={catalogs}
            selectDataLabel="name"
            selectDataValue="id"
            width="100%"
            record={catalogFilter}
            setRecord={setCatalogFilter}
          />
        </div>
        <div className="test-name-field-main-container">
          <MyInput
            fieldName="testName"
            fieldType="text"
            placeholder="Search Test"
            record={{ testName: searchInput }}
            setRecord={(r: any) => {
              const val = r?.testName ?? '';
              setSearchInput(val);
              setSearchTerm(val);
            }}
            width="100%"
            showLabel={false}
            rightAddon={
              <SearchIcon
                className="search-icon-test-name-icon"
                onClick={() => {
                  setSearchTerm(searchInput);
                  applyServerSearch(searchInput);
                }}
              />
            }
            enterClick={() => {
              setSearchTerm(searchInput);
              applyServerSearch(searchInput);
            }}
          />
        </div>
      </Form>

      <div
        className="test-type-section-list"
        style={{ background: mode === 'light' ? '#F8FAFE' : 'var(--extra-dark-black)' }}
      >
        {isLoading ? (
          <div className="test-type-section-loading">
            <CircularProgress size={28} />
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="test-type-section-empty">
            <Translate>No tests found</Translate>
          </div>
        ) : (
          filteredTests.map(item => {
            const key = getItemKey(item);
            return (
              <div key={key} className="test-type-section-item">
                <MyInput
                  className="transfer-test-list-check"
                  fieldType="check"
                  showLabel={false}
                  fieldLabel={getItemName(item)}
                  fieldName="selected"
                  record={{ selected: selectedKeys.has(key) }}
                  setRecord={() => onToggle(item)}
                />
              </div>
            );
          })
        )}
      </div>

      {hasMore && (
        <div className="test-type-section-footer">
          <MyButton appearance="ghost" onClick={() => setPagedQuery(q => ({ ...q, page: q.page + 1 }))} disabled={isFetching}>
            Load More
          </MyButton>
        </div>
      )}
    </div>
  );
};

export default TestTypeSection;
