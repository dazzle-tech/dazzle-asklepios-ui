import React, { useEffect, useState } from 'react';
import { Input } from 'rsuite';
import MyTable, { type ColumnConfig } from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';
import { useDebouncedSearch } from '@/pages/setup/coverage-management/coverageHelpers';
import { formatEnumString } from '@/utils';
import {
  useGetPriceListDataCheckRowsQuery,
  useGetPriceListDataCheckSummaryQuery,
  useLazyGetPriceListDataCheckRowsQuery
} from '@/services/setup/priceListSetup/priceListSetupService';
import type {
  PriceListDataCheckKey,
  PriceListDataCheckRow,
  PriceListItemType
} from '@/types/model-types-new';

type CheckInfo = {
  key: PriceListDataCheckKey;
  label: string;
  description: string;
  accent: 'warning' | 'purple' | 'blue';
  // Rows of this check point at an item that is on a price list (can be opened in the Items tab)
  openable: boolean;
};

export const DATA_CHECKS: CheckInfo[] = [
  {
    key: 'INACTIVE_SOURCE_ACTIVE_ITEM',
    label: 'Inactive item, active on a list',
    description: 'The item is inactive in its setup screen but still active on a price list.',
    accent: 'warning',
    openable: true
  },
  {
    key: 'MISSING_FROM_CASH',
    label: 'Missing from cash',
    description: 'Active items of this facility that are not on any active cash price list.',
    accent: 'warning',
    openable: false
  },
  {
    key: 'CASH_PRICE_DIFFERS',
    label: 'Cash price differs from setup',
    description: 'The price on the cash list is not the price defined on the item itself.',
    accent: 'purple',
    openable: true
  },
  {
    key: 'INSURANCE_WITHOUT_SBS',
    label: 'Insurance item without SBS',
    description: 'Items on an active insurance price list with no SBS code.',
    accent: 'purple',
    openable: true
  },
  {
    key: 'ZERO_PRICE',
    label: 'Zero price',
    description: 'Active items on an active price list with price 0 or no price.',
    accent: 'blue',
    openable: true
  },
  {
    key: 'DUPLICATE_IN_LIST',
    label: 'Duplicate on a list',
    description: 'The same item is active more than once on the same price list.',
    accent: 'blue',
    openable: true
  },
  {
    key: 'ORPHAN_ITEM',
    label: 'Setup item not found',
    description: 'Price list items pointing at an item that no longer exists.',
    accent: 'blue',
    openable: false
  }
];

const ITEM_TYPES: PriceListItemType[] = [
  'MEDICATION',
  'LABORATORY',
  'RADIOLOGY',
  'PATHOLOGY',
  'SERVICE',
  'PROCEDURE',
  'VACCINE'
];

const EXPORT_SIZE = 10000;

const money = (value?: number | string | null) => {
  if (value == null || value === '') return '—';
  const amount = Number(value);
  return Number.isNaN(amount)
    ? '—'
    : amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
};

const csvCell = (value: unknown) => {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadCsv = (check: CheckInfo, rows: PriceListDataCheckRow[]) => {
  const header = [
    'Item type',
    'Source id',
    'Code',
    'Name',
    'Price list',
    'Price list item id',
    'List price',
    'Setup price',
    'Detail'
  ];
  const lines = rows.map(row =>
    [
      row.itemType,
      row.sourceId,
      row.itemCode,
      row.itemName,
      row.priceListName,
      row.priceListItemId,
      row.unitPrice,
      row.setupPrice,
      row.detail
    ]
      .map(csvCell)
      .join(',')
  );
  // BOM so Excel reads Arabic names correctly
  const blob = new Blob(['﻿' + [header.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `price-list-check-${check.key.toLowerCase().replace(/_/g, '-')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

type Props = {
  active?: boolean;
  // Opens the item in the Items tab
  onOpenItem: (itemType: PriceListItemType, sourceId: number) => void;
};

const PriceListDataChecks = ({ active = true, onOpenItem }: Props) => {
  const [itemType, setItemType] = useState<PriceListItemType | undefined>();
  const [checkKey, setCheckKey] = useState<PriceListDataCheckKey>('INACTIVE_SOURCE_ACTIVE_ITEM');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedSearch(search);

  useEffect(() => {
    setPage(0);
  }, [itemType, checkKey, pageSize, debouncedSearch]);

  const summaryQuery = useGetPriceListDataCheckSummaryQuery({ itemType }, { skip: !active, refetchOnMountOrArgChange: true });
  const rowsQuery = useGetPriceListDataCheckRowsQuery(
    { check: checkKey, itemType, search: debouncedSearch || undefined, page, size: pageSize },
    { skip: !active, refetchOnMountOrArgChange: true }
  );
  const [fetchAllRows] = useLazyGetPriceListDataCheckRowsQuery();

  const counts = new Map(
    (summaryQuery.data?.checks ?? []).map(row => [row.key, Number(row.count) || 0])
  );
  const check = DATA_CHECKS.find(row => row.key === checkKey) ?? DATA_CHECKS[0];
  const rows = rowsQuery.data?.content ?? [];
  const total = rowsQuery.data?.totalElements ?? 0;

  const columns: ColumnConfig[] = [
    {
      key: 'itemType',
      title: 'Type',
      render: (row: PriceListDataCheckRow) => (row.itemType ? formatEnumString(row.itemType) : '—')
    },
    { key: 'itemCode', title: 'Code', render: (row: PriceListDataCheckRow) => row.itemCode || '—' },
    { key: 'itemName', title: 'Name', render: (row: PriceListDataCheckRow) => row.itemName || '—' },
    {
      key: 'priceListName',
      title: 'Price list',
      render: (row: PriceListDataCheckRow) => row.priceListName || '—'
    },
    {
      key: 'unitPrice',
      title: 'List price',
      align: 'right',
      render: (row: PriceListDataCheckRow) => money(row.unitPrice)
    },
    {
      key: 'setupPrice',
      title: 'Setup price',
      align: 'right',
      render: (row: PriceListDataCheckRow) => money(row.setupPrice)
    },
    { key: 'detail', title: 'Detail', render: (row: PriceListDataCheckRow) => row.detail || '' },
    {
      key: 'open',
      title: '',
      render: (row: PriceListDataCheckRow) =>
        check.openable && row.itemType && row.sourceId != null ? (
          <button
            type="button"
            className="item-dashboard-link"
            onClick={() => onOpenItem(row.itemType as PriceListItemType, Number(row.sourceId))}
          >
            <Translate>Open</Translate>
          </button>
        ) : null
    }
  ];

  const exportRows = async () => {
    setExporting(true);
    try {
      const all = await fetchAllRows({
        check: checkKey,
        itemType,
        search: debouncedSearch || undefined,
        page: 0,
        size: EXPORT_SIZE
      }).unwrap();
      downloadCsv(check, all.content);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="item-dashboard-checks">
      <div className="item-dashboard-types">
        <button
          type="button"
          className={`item-dashboard-type${itemType ? '' : ' is-active'}`}
          onClick={() => setItemType(undefined)}
        >
          <Translate>All types</Translate>
        </button>
        {ITEM_TYPES.map(type => (
          <button
            key={type}
            type="button"
            className={`item-dashboard-type${itemType === type ? ' is-active' : ''}`}
            onClick={() => setItemType(current => (current === type ? undefined : type))}
          >
            {formatEnumString(type)}
          </button>
        ))}
      </div>

      {summaryQuery.isError || rowsQuery.isError ? (
        <div className="item-dashboard-banner">
          <Translate>Unable to load the price list data checks.</Translate>
        </div>
      ) : null}

      <div className="item-dashboard-check-cards">
        {DATA_CHECKS.map(row => {
          const count = counts.get(row.key);
          return (
            <button
              key={row.key}
              type="button"
              className={`item-dashboard-kpi item-dashboard-kpi--${
                count === 0 ? 'success' : row.accent
              } item-dashboard-check-card${row.key === checkKey ? ' is-selected' : ''}`}
              onClick={() => setCheckKey(row.key)}
            >
              <div className="item-dashboard-kpi-label">
                <Translate>{row.label}</Translate>
              </div>
              <div className="item-dashboard-kpi-value">
                {summaryQuery.isFetching && count == null ? '…' : (count ?? 0)}
              </div>
            </button>
          );
        })}
      </div>

      <section className="item-dashboard-check-table">
        <header className="item-dashboard-check-head">
          <div>
            <h3>
              <Translate>{check.label}</Translate>
            </h3>
            <p>
              <Translate>{check.description}</Translate>
            </p>
          </div>
          <button
            type="button"
            className="item-dashboard-refresh"
            onClick={exportRows}
            disabled={exporting || total === 0}
          >
            <Translate>{exporting ? 'Exporting...' : 'Export'}</Translate>
          </button>
        </header>

        <MyTable
          height={460}
          data={rows}
          columns={columns}
          loading={rowsQuery.isFetching}
          filters={
            <div className="item-dashboard-check-search">
              <Input value={search} onChange={setSearch} placeholder="Search name or code" />
            </div>
          }
          page={page}
          rowsPerPage={pageSize}
          totalCount={total}
          onPageChange={(_event, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={event => {
            setPageSize(Number(event.target.value));
            setPage(0);
          }}
        />
      </section>
    </div>
  );
};

export default PriceListDataChecks;
