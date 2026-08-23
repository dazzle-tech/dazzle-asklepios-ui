import React, { useEffect, useMemo, useState } from 'react';
import { Loader, Text } from 'rsuite';

import MyTable from '@/components/MyTable';
import { useGetPatientFinancialDashboardQuery } from '@/services/billing/patientFinancialStatementService';
import { formatBillingEnum, resolvePatientId } from '../utils/billingAccountingUtils';
import PatientFinancialStatementView from './PatientFinancialStatementView';
import { dash, money, statusLabel, statusTone, timestamp } from './statementFormatters';

type PatientFinancialDashboardTabProps = {
  patient?: any;
  currency?: string;
};

const SummaryCard = ({
  label,
  value,
  hint,
  tone
}: {
  label: string;
  value: string;
  hint: string;
  tone?: 'success' | 'danger';
}) => (
  <div className="pfs-metric">
    <div className="pfs-metric__label">{label}</div>
    <div
      className={`pfs-metric__value${
        tone === 'success' ? ' pfs-metric__value--success' : tone === 'danger' ? ' pfs-metric__value--danger' : ''
      }`}
    >
      {value}
    </div>
    <div className="pfs-metric__hint">{hint}</div>
  </div>
);

const PatientFinancialDashboardTab: React.FC<PatientFinancialDashboardTabProps> = ({
  patient,
  currency: fallbackCurrency = 'SAR'
}) => {
  const patientId = resolvePatientId(patient);
  const [selectedEncounterId, setSelectedEncounterId] = useState<number | null>(null);

  const { data, isFetching, isError } = useGetPatientFinancialDashboardQuery(patientId as number, {
    skip: patientId == null,
    refetchOnMountOrArgChange: true
  });

  useEffect(() => {
    setSelectedEncounterId(null);
  }, [patientId]);

  const currency = data?.currency ?? fallbackCurrency;

  const encounters = useMemo(() => data?.encounters ?? [], [data]);

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

  if (isFetching && data == null) {
    return (
      <div className="pfs-empty">
        <Loader content="Loading accounting dashboard..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="pfs-empty">Unable to load the patient financial dashboard.</div>
    );
  }

  const totals = data?.totals;

  return (
    <div className="pfs-dashboard">
      <div className="pfs-dashboard__header">
        <div>
          <Text weight="semibold" size="lg">
            Accounting dashboard
          </Text>
          <div className="pfs-dashboard__subtitle">
            {dash(data?.patientName)} · MRN {dash(data?.medicalRecordNumber)}
          </div>
        </div>
      </div>

      <div className="pfs-metrics">
        <SummaryCard
          label="Gross charges"
          value={money(totals?.grossCharges, currency)}
          hint="All visit charges"
        />
        <SummaryCard
          label="Patient responsibility"
          value={money(totals?.patientResponsibility, currency)}
          hint="Deductible, co-pay and non-covered"
        />
        <SummaryCard
          label="Insurance share"
          value={money(totals?.insuranceShare, currency)}
          hint="Payer responsibility"
        />
        <SummaryCard
          label="Total collected"
          value={money(totals?.totalCollected, currency)}
          hint="Allocated payments"
          tone={(totals?.totalCollected ?? 0) > 0 ? 'success' : undefined}
        />
        <SummaryCard
          label="Outstanding"
          value={money(totals?.outstanding, currency)}
          hint="Patient + insurance remaining"
          tone={(totals?.outstanding ?? 0) > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="pfs-card">
        <div className="pfs-card__title">
          Patient visits
          <span className="pfs-card__badge">{encounters.length} encounters</span>
        </div>
        <MyTable
          data={encounters}
          height={Math.min(520, 160 + Math.max(encounters.length, 1) * 56)}
          onRowClick={row => setSelectedEncounterId(Number(row.encounterId))}
          rowClassName={() => 'pfs-visit-row'}
          columns={[
            { key: 'encounterNumber', title: 'Encounter', render: row => dash(row.encounterNumber) },
            { key: 'encounterDateTime', title: 'Date', render: row => timestamp(row.encounterDateTime) },
            { key: 'visitType', title: 'Visit type', render: row => formatBillingEnum(row.visitType) },
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
            }
          ]}
        />
      </div>
    </div>
  );
};

export default PatientFinancialDashboardTab;
