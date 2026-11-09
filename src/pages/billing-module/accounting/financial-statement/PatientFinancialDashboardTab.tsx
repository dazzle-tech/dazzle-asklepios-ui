import React, { useEffect, useMemo, useState } from 'react';
import { Loader } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoiceDollar, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

import MyTable from '@/components/MyTable';
import { useGetPatientFinancialDashboardQuery } from '@/services/billing/patientFinancialStatementService';
import { formatBillingEnum, resolvePatientId } from '../utils/billingAccountingUtils';
import PatientFinancialStatementView from './PatientFinancialStatementView';
import { dash, money, statusLabel, statusTone, timestamp } from './statementFormatters';
import useStatementTablePaging from './useStatementTablePaging';

type PatientFinancialDashboardTabProps = {
  patient?: any;
  currency?: string;
};

const initials = (name?: string | null) =>
  String(name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'PF';

const KpiCard = ({
  label,
  value,
  hint,
  tone,
  accent
}: {
  label: string;
  value: string;
  hint: string;
  tone?: 'success' | 'danger';
  accent: 'primary' | 'purple' | 'info' | 'success' | 'danger' | 'warning';
}) => (
  <div className={`pfs-kpi pfs-kpi--${accent}`}>
    <div className="pfs-kpi__label">{label}</div>
    <div
      className={`pfs-kpi__value${
        tone === 'success' ? ' is-success' : tone === 'danger' ? ' is-danger' : ''
      }`}
    >
      {value}
    </div>
    <div className="pfs-kpi__hint">{hint}</div>
  </div>
);

const PatientFinancialDashboardTab: React.FC<PatientFinancialDashboardTabProps> = ({
  patient,
  currency: fallbackCurrency = 'SAR'
}) => {
  const patientId = resolvePatientId(patient);
  const [selectedEncounterId, setSelectedEncounterId] = useState<number | null>(null);
  const paging = useStatementTablePaging(10);

  const { data, isFetching, isLoading, isError } = useGetPatientFinancialDashboardQuery(
    {
      patientId: patientId as number,
      page: paging.page,
      size: paging.rowsPerPage
    },
    {
      skip: patientId == null
    }
  );

  useEffect(() => {
    setSelectedEncounterId(null);
    paging.onPageChange(undefined, 0);
  }, [patientId]);

  const currency = data?.currency ?? fallbackCurrency;
  const encounters = data?.encounters?.content ?? [];
  const totals = data?.totals;
  const visitCount = data?.encounters?.totalElements ?? 0;

  const collectionRate = useMemo(() => {
    const billed =
      Number(totals?.patientResponsibility ?? 0) + Number(totals?.insuranceShare ?? 0);
    const collected = Number(totals?.totalCollected ?? 0);
    if (billed <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((collected / billed) * 100)));
  }, [totals]);

  if (patientId == null) {
    return (
      <div className="pfs-empty">
        Search and select a patient to open the accounting dashboard.
      </div>
    );
  }

  if (selectedEncounterId != null) {
    return (
      <PatientFinancialStatementView
        encounterId={selectedEncounterId}
        fallbackCurrency={currency}
        onBack={() => setSelectedEncounterId(null)}
      />
    );
  }

  if ((isLoading || isFetching) && data == null) {
    return (
      <div className="pfs-empty">
        <Loader content="Loading accounting dashboard..." />
      </div>
    );
  }

  if (isError) {
    return <div className="pfs-empty">Unable to load the patient financial dashboard.</div>;
  }

  return (
    <div className="pfs-dashboard">
      <section className="pfs-banner">
        <div className="pfs-banner__identity">
          <div className="pfs-avatar">{initials(data?.patientName)}</div>
          <div>
            <div className="pfs-banner__kicker">Accounting workspace</div>
            <h2 className="pfs-banner__title">{dash(data?.patientName)}</h2>
            <div className="pfs-banner__meta">
              MRN {dash(data?.medicalRecordNumber)}
              {data?.nationalId ? ` · ID ${data.nationalId}` : ''}
              {` · ${visitCount} visit${visitCount === 1 ? '' : 's'}`}
            </div>
          </div>
        </div>
        <div className="pfs-banner__score">
          <div className="pfs-ring" style={{ '--pfs-rate': `${collectionRate}` } as React.CSSProperties}>
            <strong>{collectionRate}%</strong>
            <span>Collected</span>
          </div>
        </div>
      </section>

      <div className="pfs-kpis">
        <KpiCard
          label="Gross charges"
          value={money(totals?.grossCharges, currency)}
          hint="All visit charges"
          accent="primary"
        />
        <KpiCard
          label="Patient responsibility"
          value={money(totals?.patientResponsibility, currency)}
          hint="Deductible, co-pay and non-covered"
          accent="purple"
        />
        <KpiCard
          label="Insurance share"
          value={money(totals?.insuranceShare, currency)}
          hint="Payer responsibility"
          accent="info"
        />
        <KpiCard
          label="Total collected"
          value={money(totals?.totalCollected, currency)}
          hint="Allocated payments"
          tone={(totals?.totalCollected ?? 0) > 0 ? 'success' : undefined}
          accent="success"
        />
        <KpiCard
          label="Outstanding"
          value={money(totals?.outstanding, currency)}
          hint="Patient + insurance remaining"
          tone={(totals?.outstanding ?? 0) > 0 ? 'danger' : 'success'}
          accent={(totals?.outstanding ?? 0) > 0 ? 'danger' : 'success'}
        />
      </div>

      <section className="pfs-panel">
        <div className="pfs-panel__head">
          <div>
            <h3>Visit ledger</h3>
            <p>Open a visit to review the full Patient Financial Statement.</p>
          </div>
          <span className="pfs-count">{visitCount} encounters</span>
        </div>
        <MyTable
          data={encounters}
          loading={isFetching}
          height={460}
          page={paging.page}
          rowsPerPage={paging.rowsPerPage}
          totalCount={visitCount}
          onPageChange={paging.onPageChange}
          onRowsPerPageChange={paging.onRowsPerPageChange}
          onRowClick={row => setSelectedEncounterId(Number(row.encounterId))}
          rowClassName={() => 'pfs-visit-row'}
          columns={[
            {
              key: 'encounterNumber',
              title: 'Encounter',
              render: row => (
                <div className="pfs-visit-id">
                  <FontAwesomeIcon icon={faFileInvoiceDollar} />
                  <div>
                    <strong>{dash(row.encounterNumber)}</strong>
                    <small>{formatBillingEnum(row.visitType)}</small>
                  </div>
                </div>
              )
            },
            { key: 'encounterDateTime', title: 'Date', render: row => timestamp(row.encounterDateTime) },
            { key: 'invoiceNumber', title: 'Invoice', render: row => dash(row.invoiceNumber) },
            { key: 'grossCharges', title: 'Gross', render: row => money(row.grossCharges, currency) },
            {
              key: 'patientResponsibility',
              title: 'Patient',
              render: row => money(row.patientResponsibility, currency)
            },
            { key: 'insuranceShare', title: 'Insurance', render: row => money(row.insuranceShare, currency) },
            { key: 'collected', title: 'Collected', render: row => money(row.collected, currency) },
            { key: 'outstanding', title: 'Outstanding', render: row => money(row.outstanding, currency) },
            {
              key: 'financialStatus',
              title: 'Status',
              render: row => (
                <span className={`pfs-pill pfs-pill--${statusTone(row.financialStatus)}`}>
                  {statusLabel(row.financialStatus)}
                </span>
              )
            },
            {
              key: 'open',
              title: '',
              align: 'right',
              render: () => (
                <span className="pfs-open">
                  Statement <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                </span>
              )
            }
          ]}
        />
      </section>
    </div>
  );
};

export default PatientFinancialDashboardTab;
