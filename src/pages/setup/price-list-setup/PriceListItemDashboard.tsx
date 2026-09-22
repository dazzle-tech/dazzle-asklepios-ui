import React, { useEffect, useState } from 'react';
import { Input, Loader, Pagination, Panel } from 'rsuite';
import Translate from '@/components/Translate';
import { useDebouncedSearch } from '@/pages/setup/coverage-management/coverageHelpers';
import { formatEnumString } from '@/utils';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useGetPriceListItemDashboardCardQuery,
  useGetPriceListItemDashboardItemsQuery,
  useGetPriceListItemDashboardQuery
} from '@/services/setup/priceListSetup/priceListSetupService';
import type {
  PriceListItemDashboardCard,
  PriceListItemDashboardCatalogItem,
  PriceListItemDashboardCoverage,
  PriceListItemDashboardEntry,
  PriceListItemType
} from '@/types/model-types-new';

import './styles.less';

type SelectedItem = {
  itemType: PriceListItemType;
  sourceId: number;
} | null;

const ITEM_TYPES: PriceListItemType[] = [
  'MEDICATION',
  'LABORATORY',
  'RADIOLOGY',
  'PATHOLOGY',
  'SERVICE',
  'PROCEDURE'
];

const PAGE_SIZES = [10, 20, 50];

const money = (value?: number | string | null) => {
  if (value == null || value === '') {
    return '—';
  }
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return '—';
  }
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  });
};

const yesNo = (value?: boolean | null) => (value ? 'Yes' : 'No');

const coverageClass = (status?: string | null) =>
  status === 'COMPLETE' ? 'is-complete' : 'is-partial';

const presenceClass = (presence?: string | null) => {
  if (presence === 'PRESENT') {
    return 'is-present';
  }
  if (presence === 'INACTIVE') {
    return 'is-inactive';
  }
  return 'is-missing';
};

const presenceLabel = (presence?: string | null) => {
  if (presence === 'PRESENT') {
    return 'In list';
  }
  if (presence === 'INACTIVE') {
    return 'Inactive';
  }
  return 'Not in list';
};

const PriceListItemDashboard = ({ active = true }: { active?: boolean }) => {
  const [search, setSearch] = useState('');
  const [itemType, setItemType] = useState<PriceListItemType | undefined>();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<SelectedItem>(null);
  const debouncedSearch = useDebouncedSearch(search);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, itemType, pageSize]);

  const {
    data: overview,
    isError: overviewError,
    refetch: refetchOverview
  } = useGetPriceListItemDashboardQuery(undefined, { skip: !active });

  const {
    data: itemPage,
    isFetching: itemsFetching,
    isError: itemsError,
    refetch: refetchItems
  } = useGetPriceListItemDashboardItemsQuery(
    {
      search: debouncedSearch || undefined,
      itemType,
      page,
      size: pageSize
    },
    { skip: !active }
  );

  const cardQuery = useGetPriceListItemDashboardCardQuery(
    {
      itemType: selected?.itemType ?? 'SERVICE',
      sourceId: selected?.sourceId ?? 0
    },
    { skip: !active || !selected }
  );

  const items = itemPage?.content ?? [];
  const summary = overview?.summary;
  const totalElements = itemPage?.totalElements ?? 0;
  const card = cardQuery.data ?? null;
  const cardLoading = Boolean(selected) && cardQuery.isFetching && !cardQuery.data;
  const isError = overviewError || itemsError;
  const isFetching = itemsFetching;
  const refetch = () => {
    refetchOverview();
    refetchItems();
  };

  return (
    <div className="item-dashboard">
      <div className="item-dashboard-hero">
        <div>
          <div className="item-dashboard-kicker">
            <Translate>Price lists</Translate>
          </div>
          <h2 className="item-dashboard-title">
            <Translate>Item Price Dashboard</Translate>
          </h2>
          <p className="item-dashboard-copy">
            <Translate>
              Click an item to see its price and full details in every price list for the selected
              facility.
            </Translate>
          </p>
        </div>
        <button type="button" className="item-dashboard-refresh" onClick={() => refetch()} disabled={!active}>
          <Translate>Refresh</Translate>
        </button>
      </div>

      <div className="item-dashboard-kpis">
        <Kpi label="Price lists" value={summary?.priceListCount ?? overview?.priceLists?.length ?? 0} />
        <Kpi label="Items" value={summary?.uniqueItemCount} accent="purple" />
      </div>

      <div className="item-dashboard-types">
        <button
          type="button"
          className={`item-dashboard-type${itemType ? '' : ' is-active'}`}
          onClick={() => setItemType(undefined)}
        >
          <Translate>All types</Translate>
          <span>{summary?.uniqueItemCount ?? 0}</span>
        </button>
        {ITEM_TYPES.map(type => {
          const count = summary?.byItemType?.find(row => row.itemType === type)?.itemCount ?? 0;
          return (
            <button
              key={type}
              type="button"
              className={`item-dashboard-type${itemType === type ? ' is-active' : ''}`}
              onClick={() => setItemType(current => (current === type ? undefined : type))}
            >
              {formatEnumString(type)}
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      {isError ? (
        <div className="item-dashboard-banner">
          <Translate>Unable to load the item price dashboard.</Translate>
        </div>
      ) : null}

      {itemsFetching && !itemPage ? (
        <div className="item-dashboard-empty">
          <Loader size="md" content="Loading items..." />
        </div>
      ) : (
        <div className="item-dashboard-shell">
          <aside className="item-dashboard-master">
            <div className="item-dashboard-master-head">
              <Input value={search} onChange={setSearch} placeholder="Search name or code" />
            </div>
            <div className={`item-dashboard-master-items${isFetching ? ' is-loading' : ''}`}>
              {items.length === 0 ? (
                <div className="item-dashboard-muted">
                  <Translate>No items found in the facility price lists.</Translate>
                </div>
              ) : (
                items.map(item => (
                  <MasterItem
                    key={`${item.itemType}-${item.sourceId}`}
                    item={item}
                    selected={
                      selected?.itemType === item.itemType && selected.sourceId === item.sourceId
                    }
                    onClick={() =>
                      setSelected({
                        itemType: item.itemType,
                        sourceId: item.sourceId
                      })
                    }
                  />
                ))
              )}
            </div>
            <div className="item-dashboard-pager">
              <Pagination
                prev
                next
                first
                last
                ellipsis
                boundaryLinks
                maxButtons={5}
                size="xs"
                layout={['total', '-', 'limit', '|', 'pager']}
                limitOptions={PAGE_SIZES}
                limit={pageSize}
                activePage={page + 1}
                total={totalElements}
                onChangePage={nextPage => setPage(Math.max(nextPage - 1, 0))}
                onChangeLimit={nextSize => {
                  setPageSize(nextSize);
                  setPage(0);
                }}
              />
            </div>
          </aside>

          <section className="item-dashboard-detail">
            {!selected ? (
              <div className="item-dashboard-empty-card">
                <Translate>Select an item to compare its price across all price lists.</Translate>
              </div>
            ) : cardLoading ? (
              <div className="item-dashboard-empty">
                <Loader size="md" content="Loading item details..." />
              </div>
            ) : card ? (
              <ItemDetail card={card} />
            ) : (
              <div className="item-dashboard-empty-card">
                <Translate>Unable to load item details.</Translate>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

const MasterItem = ({
  item,
  selected,
  onClick
}: {
  item: PriceListItemDashboardCatalogItem;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    className={`item-dashboard-master-item${selected ? ' is-selected' : ''}`}
    onClick={onClick}
  >
    <span className="item-dashboard-master-item-top">
      <strong>{item.itemCode || '—'}</strong>
      <em className={coverageClass(item.coverageStatus)}>
        {item.presentInCount}/{item.presentInCount + item.missingFromCount}
      </em>
    </span>
    <span className="item-dashboard-master-item-name">{item.itemName || '—'}</span>
    <span className="item-dashboard-master-item-meta">
      {formatEnumString(item.itemType)}
      {item.hasPriceVariance ? ' · Price varies' : ''}
    </span>
    <span className="item-dashboard-coverage">
      <span style={{ width: `${Math.max(item.coveragePercent, 0)}%` }} />
    </span>
  </button>
);

const ItemDetail = ({ card }: { card: PriceListItemDashboardCard }) => (
  <>
    <header className="item-dashboard-card-head">
      <div>
        <div className="item-dashboard-code">{card.itemCode || '—'}</div>
        <h3>{card.itemName || '—'}</h3>
        <div className="item-dashboard-meta">
          {formatEnumString(card.itemType)}
          {card.category ? ` · ${formatEnumString(card.category)}` : ''}
          {card.nonStandardCode ? ` · ${card.nonStandardCode}` : ''}
        </div>
      </div>
      <div className="item-dashboard-card-flags">
        <span className={`item-dashboard-badge ${coverageClass(card.coverageStatus)}`}>
          {card.presentInCount} / {card.presentInCount + card.missingFromCount}
        </span>
        {card.hasPriceVariance ? (
          <span className="item-dashboard-badge is-warning">
            <Translate>Price varies</Translate>
          </span>
        ) : null}
      </div>
    </header>

    <dl className="item-dashboard-overview">
      <div>
        <dt>
          <Translate>Lowest price</Translate>
        </dt>
        <dd>{money(card.minUnitPrice)}</dd>
      </div>
      <div>
        <dt>
          <Translate>Highest price</Translate>
        </dt>
        <dd>{money(card.maxUnitPrice)}</dd>
      </div>
      <div>
        <dt>
          <Translate>In price lists</Translate>
        </dt>
        <dd>{card.presentInCount}</dd>
      </div>
      <div>
        <dt>
          <Translate>Missing from</Translate>
        </dt>
        <dd>{card.missingFromCount}</dd>
      </div>
    </dl>

    <div className="item-dashboard-block">
      <div className="item-dashboard-block-title">
        <Translate>All facility price lists</Translate>
        <span>{card.priceLists?.length ?? 0}</span>
      </div>
      <div className="item-dashboard-list-grid">
        {(card.priceLists ?? []).map(row => (
          <PriceListCard key={row.priceList.id} row={row} />
        ))}
      </div>
    </div>
  </>
);

const PriceListCard = ({ row }: { row: PriceListItemDashboardCoverage }) => {
  const list = row.priceList;
  const payer = list.nphiesPayerName || list.payerName;
  return (
    <article className={`item-dashboard-list-card ${presenceClass(row.presence)}`}>
      <div className="item-dashboard-list-card-head">
        <div>
          <strong>{list.name}</strong>
          <div className="item-dashboard-meta">
            {[formatEnumString(list.type), list.status, list.currency, payer].filter(Boolean).join(' · ')}
          </div>
        </div>
        <span className={`item-dashboard-presence ${presenceClass(row.presence)}`}>
          <Translate>{presenceLabel(row.presence)}</Translate>
        </span>
      </div>
      {row.present ? (
        row.entries.map(entry => <EntryDetails key={entry.id} entry={entry} currency={list.currency} />)
      ) : (
        <div className="item-dashboard-muted">
          <Translate>This item is not configured on this price list.</Translate>
        </div>
      )}
    </article>
  );
};

const EntryDetails = ({
  entry,
  currency
}: {
  entry: PriceListItemDashboardEntry;
  currency?: string | null;
}) => (
  <div className="item-dashboard-entry">
    <div className="item-dashboard-entry-price">
      <span>{currency || 'SAR'}</span>
      <strong>{money(entry.unitPrice)}</strong>
      {entry.netPrice != null && Number(entry.netPrice) !== Number(entry.unitPrice) ? (
        <em>
          <Translate>Net</Translate> {money(entry.netPrice)}
        </em>
      ) : null}
    </div>
    <dl>
      <div>
        <dt>
          <Translate>Visit type</Translate>
        </dt>
        <dd>{entry.visitType ? formatEnumString(entry.visitType) : '—'}</dd>
      </div>
      <div>
        <dt>
          <Translate>Discount</Translate>
        </dt>
        <dd>{entry.discountPercentage == null ? '—' : `${entry.discountPercentage}%`}</dd>
      </div>
      <div>
        <dt>
          <Translate>Cost</Translate>
        </dt>
        <dd>{money(entry.cost)}</dd>
      </div>
      <div>
        <dt>
          <Translate>Active</Translate>
        </dt>
        <dd>{yesNo(entry.isActive)}</dd>
      </div>
      <div>
        <dt>
          <Translate>Pre-authorization</Translate>
        </dt>
        <dd>{yesNo(entry.requiresPreAuthorization)}</dd>
      </div>
      <div>
        <dt>
          <Translate>Code</Translate>
        </dt>
        <dd>{entry.itemCode || '—'}</dd>
      </div>
    </dl>
  </div>
);

const Kpi = ({
  label,
  value,
  accent = 'primary'
}: {
  label: string;
  value?: number;
  accent?: 'primary' | 'purple' | 'success' | 'warning';
}) => (
  <div className={`item-dashboard-kpi item-dashboard-kpi--${accent}`}>
    <div className="item-dashboard-kpi-label">
      <Translate>{label}</Translate>
    </div>
    <div className="item-dashboard-kpi-value">{value ?? 0}</div>
  </div>
);

export const PriceListItemDashboardPage = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setPageCode('PRICE_LIST_ITEM_DASHBOARD'));
    dispatch(setDivContent('Price List Item Dashboard'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  return (
    <Panel>
      <PriceListItemDashboard />
    </Panel>
  );
};

export default PriceListItemDashboard;
