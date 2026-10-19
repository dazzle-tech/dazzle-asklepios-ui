import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useGetCatalogTestsQuery } from '@/services/setup/catalog/catalogTestService';
import { useGetActiveDiagnosticTestsByTypeQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { CircularProgress } from '@mui/material';
import { skipToken } from '@reduxjs/toolkit/query';
import SearchIcon from '@rsuite/icons/Search';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Form } from 'rsuite';
import '../styles.less';

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

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

type QueryFilters = {
  search: string;
  catalogId?: number;
  page: number;
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
  const [searchInput, setSearchInput] = useState('');
  const [catalogFilter, setCatalogFilter] = useState<{ catalogId?: number }>({});
  const [filters, setFilters] = useState<QueryFilters>({ search: '', page: 0 });
  const [tests, setTests] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const appliedRequestKeyRef = useRef<string | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const activeSearch = filters.search.trim();
  const activeCatalogId = filters.catalogId;
  const page = filters.page;

  // Catalog ids only needed to narrow a fixed list (favorites); paged API path filters by catalogId on the backend
  const { data: catalogTestsResponse, isFetching: isFetchingCatalogTests } = useGetCatalogTestsQuery(
    open && hasFixedItems && activeCatalogId ? { catalogId: activeCatalogId, page: 0, size: 1000 } : skipToken
  );

  const catalogTestIds = useMemo(() => {
    const raw: any = catalogTestsResponse?.data;
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.tests) ? raw.tests : [];
    return list.map((t: any) => t.diagnosticTestId ?? t.testId ?? t.id).filter(Boolean);
  }, [catalogTestsResponse]);

  const catalogTestIdSet = useMemo(() => new Set(catalogTestIds.map(String)), [catalogTestIds]);

  const queryArgs = useMemo(
    () => ({
      type,
      page,
      size: PAGE_SIZE,
      sort: 'id,asc' as const,
      ...(activeSearch ? { name: activeSearch } : {}),
      ...(activeCatalogId != null ? { catalogId: activeCatalogId } : {})
    }),
    [type, page, activeSearch, activeCatalogId]
  );

  const requestKey = `${type}|${activeSearch}|${activeCatalogId ?? ''}|${page}`;

  const { data: testsResponse, isFetching, originalArgs } = useGetActiveDiagnosticTestsByTypeQuery(
    open && !hasFixedItems ? queryArgs : skipToken
  );

  const fixedItemsOfType = useMemo(
    () => (items ?? []).filter(t => normalizeSearchText(t?.type) === normalizeSearchText(type)),
    [items, type]
  );

  const replaceFilters = (next: QueryFilters) => {
    appliedRequestKeyRef.current = null;
    setTests([]);
    setTotalCount(0);
    setFilters(next);
  };

  const commitSearch = (raw: string) => {
    const nextSearch = String(raw ?? '');
    const prev = filtersRef.current;
    if (prev.search === nextSearch) return;
    replaceFilters({ ...prev, search: nextSearch, page: 0 });
  };

  // Debounce search input (~300ms) before querying the backend
  useEffect(() => {
    const timer = setTimeout(() => commitSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Clear filters when the popup opens; reset local paging state
  useEffect(() => {
    if (!open) return;
    setSearchInput('');
    setCatalogFilter({});
    replaceFilters({ search: '', page: 0 });
  }, [open]);

  // Apply server pages: replace on page 0, append on Load More; ignore stale responses
  useEffect(() => {
    if (hasFixedItems || !testsResponse?.data || !originalArgs) return;

    const argsName = String(originalArgs.name ?? '').trim();
    const argsCatalogId = originalArgs.catalogId ?? undefined;
    const argsPage = originalArgs.page ?? 0;

    if (argsName !== activeSearch) return;
    if ((argsCatalogId ?? undefined) !== (activeCatalogId ?? undefined)) return;
    if (argsPage !== page) return;
    if (appliedRequestKeyRef.current === requestKey) return;

    appliedRequestKeyRef.current = requestKey;

    if (page === 0) {
      setTests(testsResponse.data);
    } else {
      setTests(prev => {
        const existing = new Set(prev.map(getItemKey));
        return [...prev, ...testsResponse.data.filter((t: any) => !existing.has(getItemKey(t)))];
      });
    }
    setTotalCount(testsResponse.totalCount ?? 0);
  }, [
    testsResponse,
    originalArgs,
    page,
    activeSearch,
    activeCatalogId,
    hasFixedItems,
    requestKey
  ]);

  // Source list:
  //  - fixed items: this type's items, narrowed by catalog + client search
  //  - otherwise: server-filtered/paged list (type + catalog + name applied on backend)
  const displayedTests = useMemo(() => {
    if (hasFixedItems) {
      const term = normalizeSearchText(activeSearch);
      let list = activeCatalogId
        ? fixedItemsOfType.filter(t => catalogTestIdSet.has(String(getItemKey(t))))
        : fixedItemsOfType;
      if (term) {
        list = list.filter(t => normalizeSearchText(getItemName(t)).includes(term));
      }
      return list;
    }
    return tests;
  }, [hasFixedItems, activeCatalogId, fixedItemsOfType, catalogTestIdSet, activeSearch, tests]);

  const hasMore = !hasFixedItems && tests.length < totalCount;
  const isLoading = hasFixedItems
    ? !!loading || (!!activeCatalogId && isFetchingCatalogTests)
    : isFetching && tests.length === 0;

  const displayedTotal = hasFixedItems ? displayedTests.length : totalCount || displayedTests.length;

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
            setRecord={(r: any) => {
              const rawId = r?.catalogId;
              const parsedId = rawId == null || rawId === '' ? NaN : Number(rawId);
              const nextCatalogId = Number.isFinite(parsedId) ? parsedId : undefined;
              setCatalogFilter(r ?? {});
              const prev = filtersRef.current;
              if (prev.catalogId === nextCatalogId) return;
              replaceFilters({ ...prev, catalogId: nextCatalogId, page: 0 });
            }}
          />
        </div>
        <div className="test-name-field-main-container">
          <MyInput
            fieldName="testName"
            fieldType="text"
            placeholder="Search Test"
            record={{ testName: searchInput }}
            setRecord={(r: any) => {
              setSearchInput(r?.testName ?? '');
            }}
            width="100%"
            showLabel={false}
            rightAddon={
              <SearchIcon
                className="search-icon-test-name-icon"
                onClick={() => commitSearch(searchInput)}
              />
            }
            enterClick={() => commitSearch(searchInput)}
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
        ) : displayedTests.length === 0 ? (
          <div className="test-type-section-empty">
            <Translate>No tests found</Translate>
          </div>
        ) : (
          displayedTests.map(item => {
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
          <MyButton
            appearance="ghost"
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={isFetching}
          >
            Load More
          </MyButton>
        </div>
      )}
    </div>
  );
};

export default TestTypeSection;
