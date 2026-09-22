import React, { useState } from 'react';
import { Input, Loader, Tabs } from 'rsuite';
import Translate from '@/components/Translate';
import {
  approvalCoverageCompanyLabel,
  useDebouncedSearch
} from '@/pages/setup/coverage-management/coverageHelpers';
import {
  useGetPayerRelationshipDashboardQuery,
  useGetPayerRelationshipInsuranceQuery,
  useGetPayerRelationshipTpaQuery
} from '@/services/setup/payer/NphiesPayerSetupService';
import type {
  PayerDashboardContract,
  PayerDashboardInsuranceCard,
  PayerDashboardLinkedParty,
  PayerDashboardPriceList,
  PayerDashboardTpaCard
} from '@/types/model-types-new';

type Kind = 'INSURANCE' | 'TPA';
type Selected = { kind: Kind; id: number } | null;

const ROLE_LABEL: Record<string, string> = {
  PARENT: 'Parent',
  CHILD: 'Child',
  STANDALONE: 'Standalone'
};

const statusText = (active?: boolean | null) => (active === false ? 'Inactive' : 'Active');

const partyName = (party?: PayerDashboardLinkedParty | null) => {
  if (!party) {
    return '';
  }
  const code = String(party.code ?? '').trim();
  const name = String(party.name ?? '').trim();
  return code && name ? `${code} — ${name}` : name || code;
};

const PayerRelationshipDashboard = ({ active = true }: { active?: boolean }) => {
  const [kind, setKind] = useState<Kind>('INSURANCE');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Selected>(null);
  const [detailTab, setDetailTab] = useState('overview');
  const debouncedSearch = useDebouncedSearch(search);
  const { data, isFetching, isError, refetch } = useGetPayerRelationshipDashboardQuery(debouncedSearch, {
    skip: !active
  });
  const { data: baseline } = useGetPayerRelationshipDashboardQuery('', {
    skip: !active || !debouncedSearch
  });
  const insuranceDetail = useGetPayerRelationshipInsuranceQuery(selected?.id ?? 0, {
    skip: !active || selected?.kind !== 'INSURANCE'
  });
  const tpaDetail = useGetPayerRelationshipTpaQuery(selected?.id ?? 0, {
    skip: !active || selected?.kind !== 'TPA'
  });

  const insurances = data?.insurances ?? [];
  const tpas = data?.tpas ?? [];
  const summary = data?.summary ?? baseline?.summary;
  const list = kind === 'INSURANCE' ? insurances : tpas;
  const selectedInsurance = selected?.kind === 'INSURANCE' ? insuranceDetail.data ?? null : null;
  const selectedTpa = selected?.kind === 'TPA' ? tpaDetail.data ?? null : null;
  const detailLoading =
    (selected?.kind === 'INSURANCE' && insuranceDetail.isFetching && !insuranceDetail.data) ||
    (selected?.kind === 'TPA' && tpaDetail.isFetching && !tpaDetail.data);

  const selectItem = (nextKind: Kind, id: number) => {
    setKind(nextKind);
    setSelected({ kind: nextKind, id });
    setDetailTab('overview');
  };

  return (
    <div className="payer-dashboard">
      <div className="payer-dashboard-hero">
        <div>
          <div className="payer-dashboard-kicker">
            <Translate>Relationships</Translate>
          </div>
          <h2 className="payer-dashboard-title">
            <Translate>TPA & Insurance Dashboard</Translate>
          </h2>
          <p className="payer-dashboard-copy">
            <Translate>Click a company to open its parent, children, contracts, and price lists.</Translate>
          </p>
        </div>
        <button type="button" className="payer-dashboard-refresh" onClick={() => refetch()} disabled={!active}>
          <Translate>Refresh</Translate>
        </button>
      </div>

      <div className="payer-dashboard-kpis">
        <Kpi label="Insurances" value={summary?.insuranceCount} />
        <Kpi label="TPAs" value={summary?.tpaCount} accent="purple" />
        <Kpi label="Parents" value={summary?.parentCompanyCount} accent="info" />
        <Kpi label="Children" value={summary?.childCompanyCount} accent="info" />
        <Kpi label="With contracts" value={summary?.insurancesWithContracts} accent="success" />
        <Kpi label="With price lists" value={summary?.insurancesWithPriceLists} accent="warning" />
      </div>

      {isError ? (
        <div className="payer-dashboard-banner">
          <Translate>Unable to load the relationship dashboard.</Translate>
        </div>
      ) : null}

      {isFetching && !data ? (
        <div className="payer-dashboard-empty">
          <Loader size="md" content="Loading relationships..." />
        </div>
      ) : (
        <div className="payer-dashboard-shell">
          <aside className="payer-dashboard-master">
            <div className="payer-dashboard-master-head">
              <div className="payer-dashboard-kind-row">
                <button
                  type="button"
                  className={`payer-dashboard-kind${kind === 'INSURANCE' ? ' is-active' : ''}`}
                  onClick={() => {
                    setKind('INSURANCE');
                    setSelected(null);
                  }}
                >
                  <Translate>Insurance</Translate>
                  <span>{insurances.length}</span>
                </button>
                <button
                  type="button"
                  className={`payer-dashboard-kind${kind === 'TPA' ? ' is-active' : ''}`}
                  onClick={() => {
                    setKind('TPA');
                    setSelected(null);
                  }}
                >
                  <Translate>TPA</Translate>
                  <span>{tpas.length}</span>
                </button>
              </div>
              <Input value={search} onChange={setSearch} placeholder="Search code or name" />
            </div>
            <div className={`payer-dashboard-master-items${isFetching ? ' is-loading' : ''}`}>
              {list.length === 0 ? (
                <div className="payer-dashboard-muted">
                  <Translate>No companies found.</Translate>
                </div>
              ) : kind === 'INSURANCE' ? (
                insurances.map(item => (
                  <MasterItem
                    key={item.id}
                    selected={selected?.kind === 'INSURANCE' && selected.id === item.id}
                    code={item.nphiesId}
                    name={item.nameEn || item.nameAr || ''}
                    meta={ROLE_LABEL[item.role] ?? item.role}
                    onClick={() => selectItem('INSURANCE', item.id)}
                  />
                ))
              ) : (
                tpas.map(item => (
                  <MasterItem
                    key={item.id}
                    selected={selected?.kind === 'TPA' && selected.id === item.id}
                    code={item.tpaCode}
                    name={item.name}
                    meta="TPA"
                    onClick={() => selectItem('TPA', item.id)}
                  />
                ))
              )}
            </div>
          </aside>

          <section className="payer-dashboard-detail">
            {!selected ? (
              <div className="payer-dashboard-empty-card">
                <Translate>Select a TPA or insurance company to see its details.</Translate>
              </div>
            ) : detailLoading ? (
              <div className="payer-dashboard-empty">
                <Loader size="md" content="Loading details..." />
              </div>
            ) : selectedInsurance ? (
              <InsuranceDetail
                card={selectedInsurance}
                detailTab={detailTab}
                setDetailTab={setDetailTab}
                onOpenInsurance={id => selectItem('INSURANCE', id)}
                onOpenTpa={id => selectItem('TPA', id)}
              />
            ) : selectedTpa ? (
              <TpaDetail
                card={selectedTpa}
                detailTab={detailTab}
                setDetailTab={setDetailTab}
                onOpenInsurance={id => selectItem('INSURANCE', id)}
              />
            ) : (
              <div className="payer-dashboard-empty-card">
                <Translate>Unable to load details.</Translate>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

const MasterItem = ({
  selected,
  code,
  name,
  meta,
  onClick
}: {
  selected: boolean;
  code: string;
  name: string;
  meta: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    className={`payer-dashboard-master-item${selected ? ' is-selected' : ''}`}
    onClick={onClick}
  >
    <span className="payer-dashboard-master-item-top">
      <strong>{code}</strong>
      <em>{meta}</em>
    </span>
    <span className="payer-dashboard-master-item-name">{name}</span>
  </button>
);

const InsuranceDetail = ({
  card,
  detailTab,
  setDetailTab,
  onOpenInsurance,
  onOpenTpa
}: {
  card: PayerDashboardInsuranceCard;
  detailTab: string;
  setDetailTab: (key: string) => void;
  onOpenInsurance: (id: number) => void;
  onOpenTpa: (id: number) => void;
}) => (
  <>
    <DetailHeader
      code={card.nphiesId}
      name={card.nameEn || card.nameAr || ''}
      active={card.isActive}
      badge={ROLE_LABEL[card.role] ?? card.role}
      extra={card.facilityName}
    />
    <Tabs appearance="subtle" activeKey={detailTab} onSelect={key => setDetailTab(String(key))}>
      <Tabs.Tab eventKey="overview" title={<Translate>Overview</Translate>}>
        <OverviewList
          items={[
            { label: 'Status', value: statusText(card.isActive) },
            { label: 'Role', value: ROLE_LABEL[card.role] ?? card.role },
            { label: 'Approval Coverage Co.', value: approvalCoverageCompanyLabel(card.approvalCoverageCompany) },
            { label: 'Parent', value: partyName(card.parent) || 'None' },
            { label: 'Child companies', value: String(card.childCompanies?.length ?? 0) },
            { label: 'Linked TPAs', value: String(card.tpas?.length ?? 0) },
            { label: 'Coverage contracts', value: String(card.contracts?.length ?? 0) },
            { label: 'Price lists', value: String(card.priceLists?.length ?? 0) }
          ]}
        />
      </Tabs.Tab>
      <Tabs.Tab eventKey="links" title={<Translate>Links</Translate>}>
        <Section title="Parent insurance" count={card.parent ? 1 : 0}>
          <PartyTable
            parties={card.parent ? [card.parent] : []}
            empty="No parent insurance linked"
            onOpen={onOpenInsurance}
          />
        </Section>
        <Section title="Companies underneath" count={card.childCompanies?.length ?? 0}>
          <PartyTable
            parties={card.childCompanies ?? []}
            empty="No child insurance companies"
            onOpen={onOpenInsurance}
          />
        </Section>
        <Section title="Linked TPAs" count={card.tpas?.length ?? 0}>
          <PartyTable parties={card.tpas ?? []} empty="No TPA linked" onOpen={onOpenTpa} />
        </Section>
      </Tabs.Tab>
      <Tabs.Tab eventKey="contracts" title={<Translate>Coverage contracts</Translate>}>
        <ContractTable contracts={card.contracts ?? []} />
      </Tabs.Tab>
      <Tabs.Tab eventKey="prices" title={<Translate>Price lists</Translate>}>
        <PriceTable items={card.priceLists ?? []} />
      </Tabs.Tab>
    </Tabs>
  </>
);

const TpaDetail = ({
  card,
  detailTab,
  setDetailTab,
  onOpenInsurance
}: {
  card: PayerDashboardTpaCard;
  detailTab: string;
  setDetailTab: (key: string) => void;
  onOpenInsurance: (id: number) => void;
}) => (
  <>
    <DetailHeader code={card.tpaCode} name={card.name} active={card.isActive} badge="TPA" />
    <Tabs appearance="subtle" activeKey={detailTab} onSelect={key => setDetailTab(String(key))}>
      <Tabs.Tab eventKey="overview" title={<Translate>Overview</Translate>}>
        <OverviewList
          items={[
            { label: 'Status', value: statusText(card.isActive) },
            { label: 'Approval Coverage Co.', value: approvalCoverageCompanyLabel(card.approvalCoverageCompany) },
            { label: 'Linked insurances', value: String(card.insuranceCompanies?.length ?? 0) },
            { label: 'Coverage contracts', value: String(card.contracts?.length ?? 0) }
          ]}
        />
      </Tabs.Tab>
      <Tabs.Tab eventKey="links" title={<Translate>Insurances</Translate>}>
        <Section title="Insurances underneath" count={card.insuranceCompanies?.length ?? 0}>
          <PartyTable
            parties={card.insuranceCompanies ?? []}
            empty="No insurance companies linked"
            onOpen={onOpenInsurance}
          />
        </Section>
      </Tabs.Tab>
      <Tabs.Tab eventKey="contracts" title={<Translate>Coverage contracts</Translate>}>
        <ContractTable contracts={card.contracts ?? []} />
      </Tabs.Tab>
    </Tabs>
  </>
);

const DetailHeader = ({
  code,
  name,
  active,
  badge,
  extra
}: {
  code: string;
  name: string;
  active?: boolean | null;
  badge: string;
  extra?: string | null;
}) => (
  <header className="payer-dashboard-card-head">
    <div>
      <div className="payer-dashboard-code">{code}</div>
      <h3>{name}</h3>
      {extra ? <div className="payer-dashboard-meta">{extra}</div> : null}
    </div>
    <div className="payer-dashboard-card-flags">
      <span className="payer-dashboard-badge">{badge}</span>
      <span className={`payer-dashboard-status${active ? ' is-active' : ''}`}>{statusText(active)}</span>
    </div>
  </header>
);

const OverviewList = ({ items }: { items: Array<{ label: string; value: string }> }) => (
  <dl className="payer-dashboard-overview">
    {items.map(item => (
      <div key={item.label}>
        <dt>
          <Translate>{item.label}</Translate>
        </dt>
        <dd>{item.value}</dd>
      </div>
    ))}
  </dl>
);

const Section = ({
  title,
  count,
  children
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) => (
  <div className="payer-dashboard-block">
    <div className="payer-dashboard-block-title">
      <Translate>{title}</Translate>
      <span>{count}</span>
    </div>
    {children}
  </div>
);

const PartyTable = ({
  parties,
  empty,
  onOpen
}: {
  parties: PayerDashboardLinkedParty[];
  empty: string;
  onOpen: (id: number) => void;
}) => (
  <DetailTable
    rows={parties}
    empty={empty}
    onRowClick={party => onOpen(party.id)}
    columns={[
      { label: 'Code', render: party => party.code || '—' },
      { label: 'Name', render: party => party.name || '—' },
      { label: 'Status', render: party => statusText(party.isActive) }
    ]}
  />
);

const ContractTable = ({ contracts }: { contracts: PayerDashboardContract[] }) => (
  <DetailTable
    rows={contracts}
    empty="No coverage contract in Coverage Management"
    columns={[
      { label: 'Code', render: contract => contract.code || '—' },
      { label: 'Policy', render: contract => contract.policyNumber || '—' },
      { label: 'Classes', render: contract => contract.className || '—' },
      { label: 'Type', render: contract => contract.guarantorType || '—' },
      { label: 'Insurance', render: contract => contract.insurancePayerName || '—' },
      { label: 'Price list', render: contract => contract.priceListName || '—' },
      { label: 'Status', render: contract => statusText(contract.isActive) }
    ]}
  />
);

const PriceTable = ({ items }: { items: PayerDashboardPriceList[] }) => (
  <DetailTable
    rows={items}
    empty="No price list in Price List Setup"
    columns={[
      { label: 'Name', render: item => item.name || '—' },
      { label: 'Status', render: item => item.status || statusText(item.isActive) },
      { label: 'Type', render: item => item.type || '—' },
      {
        label: 'Effective',
        render: item => [item.effectiveFrom, item.effectiveTo].filter(Boolean).join(' → ') || '—'
      }
    ]}
  />
);

const DetailTable = <T extends { id: number }>({
  columns,
  rows,
  empty,
  onRowClick
}: {
  columns: Array<{ label: string; render: (row: T) => React.ReactNode }>;
  rows: T[];
  empty: string;
  onRowClick?: (row: T) => void;
}) => {
  if (!rows.length) {
    return (
      <div className="payer-dashboard-muted">
        <Translate>{empty}</Translate>
      </div>
    );
  }

  return (
    <div className="payer-dashboard-table-wrap">
      <table className="payer-dashboard-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.label}>
                <Translate>{column.label}</Translate>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr
              key={row.id}
              className={onRowClick ? 'is-clickable' : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map(column => (
                <td key={column.label}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Kpi = ({
  label,
  value,
  accent = 'primary'
}: {
  label: string;
  value?: number;
  accent?: 'primary' | 'purple' | 'info' | 'success' | 'warning';
}) => (
  <div className={`payer-dashboard-kpi payer-dashboard-kpi--${accent}`}>
    <div className="payer-dashboard-kpi-label">
      <Translate>{label}</Translate>
    </div>
    <div className="payer-dashboard-kpi-value">{value ?? 0}</div>
  </div>
);

export default PayerRelationshipDashboard;
