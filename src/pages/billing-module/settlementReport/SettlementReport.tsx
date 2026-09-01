import React, { useMemo, useState } from 'react';
import { DateRangePicker, SelectPicker } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllNphiesPayersQuery } from '@/services/setup/payer/NphiesPayerSetupService';
import type { ClaimSettlementRowResponse } from '@/types/model-types-new';
import { notify } from '@/utils/uiReducerActions';

import { getSettlementColumns } from './settlementColumns';
import './styles.less';
import {
  useGetClaimSettlementsQuery,
  useLazyGetClaimSettlementsQuery,
  useGenerateSettlementPdfMutation
} from '@/services/billing/claimSettlementService';

type AppliedFilters = {
  payerNphiesId: string;
  encounterType: string | null;
  fromDate: string;
  toDate: string;
};

const SettlementReportPanel: React.FC = () => {
  const dispatch = useAppDispatch();

  const [payerNphiesId, setPayerNphiesId] = useState<string | null>(null);
  const [encounterType, setEncounterType] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const canSearch = Boolean(payerNphiesId && dateRange?.[0] && dateRange?.[1]);
  const hasAppliedFilters = appliedFilters != null;

  const encounterTypeOptions = useEnumOptions('EncounterType');

  const { data: nphiesPayerListResponse, isFetching: isPayersLoading } =
    useGetAllNphiesPayersQuery({ page: 0, size: 2000, sort: 'nameEn,asc' });
  const [loadAllRows] = useLazyGetClaimSettlementsQuery();

  const [generateSettlementPdf] =
    useGenerateSettlementPdfMutation();
  const insuranceCompanyOptions = useMemo(
    () =>
      (nphiesPayerListResponse?.data ?? [])
        .filter(payer => payer?.nphiesId && payer.isActive !== false)
        .map(payer => ({
          value: String(payer.nphiesId).trim(),
          label: formatPayerLabel(payer.nameEn, payer.nphiesId)
        })),
    [nphiesPayerListResponse]
  );

  const { data, isLoading, isFetching } = useGetClaimSettlementsQuery(
    {
      payerNphiesId: appliedFilters?.payerNphiesId,
      encounterType: appliedFilters?.encounterType,
      fromDate: appliedFilters?.fromDate,
      toDate: appliedFilters?.toDate,
      page,
      size: rowsPerPage,
      sort: 'id,desc'
    },
    { skip: !hasAppliedFilters }
  );

  const rows: ClaimSettlementRowResponse[] = data?.content ?? [];
  const totalCount = data?.totalElements ?? 0;
  const columns = useMemo(() => getSettlementColumns(), []);

  const handleSearch = () => {
    if (!payerNphiesId || !dateRange?.[0] || !dateRange?.[1]) {
      dispatch(
        notify({
          msg: 'Select insurance company and settlement dates first.',
          sev: 'warning'
        })
      );
      return;
    }

    setAppliedFilters({
      payerNphiesId,
      encounterType,
      fromDate: toStartOfDayIso(dateRange[0]) as string,
      toDate: toExclusiveEndIso(dateRange[1]) as string
    });
    setPage(0);
  };

  const handleReset = () => {
    setPayerNphiesId(null);
    setEncounterType(null);
    setDateRange(null);
    setAppliedFilters(null);
    setPage(0);
  };
  const handlePrintReport = async () => {
    if (!appliedFilters) {
      return;
    }

    try {

      const allRowsResponse = await loadAllRows({
        payerNphiesId: appliedFilters.payerNphiesId,
        encounterType: appliedFilters.encounterType,
        fromDate: appliedFilters.fromDate,
        toDate: appliedFilters.toDate,
        page: 0,
        size: 100000,
        sort: 'id,desc'
      }).unwrap();

      const pdfBlob = await generateSettlementPdf({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        lang: 'en',

        body: {
          criteria: {
            insuranceCompanyId: null,
            settlementDateFrom:
              appliedFilters.fromDate.substring(0, 10),
            settlementDateTo:
              appliedFilters.toDate.substring(0, 10),
            encounterType:
              appliedFilters.encounterType
          },
          rows: allRowsResponse.content.map(row => ({
            patientName: row.patientName || '',
            patientId: row.medicalRecordNumber || (row.patientId != null ? String(row.patientId) : ''),
            invoiceNumber: row.invoiceNumber || '',
            visitNumber: row.visitNumber || '',
            visitType: row.visitType || '',
            settlementNumber: row.settlementNo,

            settlementDate:
              row.settlementDate
                ? row.settlementDate.substring(0, 10)
                : null,

            insuranceCompany: row.insuranceCompany,

            claimNumber: row.claimNo,

            claimDate:
              row.claimDate
                ? row.claimDate.substring(0, 10)
                : null,

            billedAmount: row.billedAmount,
            approvedAmount: row.approvedAmount,
            rejectedAmount: row.rejectedAmount,

            patientShare: row.patientShare,
            insuranceAmount: row.insuranceAmount,

            paidAmount: row.paidAmount,
            outstandingAmount: row.outstandingAmount,

            settlementStatus: row.settlementStatus
          }))

        }
      }).unwrap();

      const url = window.URL.createObjectURL(pdfBlob);

      window.open(url, '_blank');

    } catch {

      dispatch(
        notify({
          msg: 'Failed to generate settlement report.',
          sev: 'error'
        })
      );
    }
  };
  return (
    <div className="bc-body">
      <main className="bc-main">
        <div className="bc-card sr-card">
          <div className="bc-card__head">
            <div>
              <h2 className="bc-card__head-title">Settlement Report</h2>
              <div className="bc-card__head-meta">
                Choose insurance company and settlement dates, then search.
              </div>
            </div>
            {hasAppliedFilters && (
              <div className="sr-count">
                <span>Results</span>
                <strong>{totalCount}</strong>
              </div>
            )}
          </div>

          <div className="sr-filters">
            <div className="sr-filters__grid">
              <div className="sr-field">
                <span className="sr-field__label">
                  <Translate>Insurance Company</Translate>
                  <em>*</em>
                </span>
                <SelectPicker
                  data={insuranceCompanyOptions}
                  value={payerNphiesId}
                  onChange={value => setPayerNphiesId(value)}
                  searchable
                  cleanable
                  loading={isPayersLoading}
                  placeholder="Select insurance company"
                  block
                  container={() => document.body}
                  menuMaxHeight={320}
                />
              </div>

              <div className="sr-field">
                <span className="sr-field__label">
                  <Translate>Settlement Date From / To</Translate>
                  <em>*</em>
                </span>
                <DateRangePicker
                  value={dateRange}
                  onChange={value => setDateRange(value)}
                  placement="bottomStart"
                  placeholder="Select date range"
                  cleanable
                  style={{ width: '100%' }}
                  container={() => document.body}
                />
              </div>

              <div className="sr-field">
                <span className="sr-field__label">
                  <Translate>Encounter Type</Translate>
                </span>
                <SelectPicker
                  data={encounterTypeOptions}
                  labelKey="label"
                  valueKey="value"
                  value={encounterType}
                  onChange={value => setEncounterType(value)}
                  searchable
                  cleanable
                  placeholder="All encounter types"
                  block
                  container={() => document.body}
                  menuMaxHeight={280}
                />
              </div>

              <div className="sr-filters__actions">
                <MyButton appearance="primary" onClick={handleSearch} disabled={!canSearch}>
                  Search
                </MyButton>
                <MyButton appearance="ghost" onClick={handleReset}>
                  Reset
                </MyButton>
                <MyButton
                  appearance="primary"
                  onClick={handlePrintReport}
                  disabled={!hasAppliedFilters}
                >
                  Print Report
                </MyButton>
              </div>
            </div>
          </div>

          {!hasAppliedFilters ? (
            <div className="sr-empty">
              <strong>No data loaded yet</strong>
              <p>Insurance company and settlement dates are required before results appear.</p>
            </div>
          ) : (
            <div className="bc-table-wrap">
              <MyTable
                columns={columns}
                data={rows}
                loading={isLoading || isFetching}
                page={page}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                height={520}
                dontTranslateData
                onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
                onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const formatPayerLabel = (nameEn?: string | null, nphiesId?: string | null) => {
  const name = nameEn?.trim();
  const code = nphiesId?.trim();

  if (name && code) {
    return `${name} (${code})`;
  }

  return name || code || '-';
};

const toStartOfDayIso = (date?: Date | null) => {
  if (!date) {
    return null;
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
};

const toExclusiveEndIso = (date?: Date | null) => {
  if (!date) {
    return null;
  }

  const end = new Date(date);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1);
  return end.toISOString();
};

export default SettlementReportPanel;
