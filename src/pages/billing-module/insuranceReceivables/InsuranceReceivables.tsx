import React, { useEffect, useMemo, useState } from 'react';
import { Button, Panel, SelectPicker } from 'rsuite';

import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useGetInsuranceReceivablesByPayerQuery } from '@/services/billing/insuranceReceivablesService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import type { InsurancePayerReceivablesSummaryResponse } from '@/types/model-types-new';
import { setDivContent, setPageCode } from '@/reducers/divSlice';

import { getReceivablesColumns } from './receivablesColumns';
import { formatMoney } from './utils';
import './styles.less';

const InsuranceReceivablesScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  const selectedDepartmentFacilityId = useAppSelector(
    state => state.auth?.selectedDepartment?.facilityId
  );
  const selectedTenantFacilityId = useAppSelector(
    state => state.auth?.tenant?.selectedFacility?.id
  );

  const defaultFacilityId =
    selectedDepartmentFacilityId ?? selectedTenantFacilityId ?? null;

  const [facilityFilter, setFacilityFilter] = useState<number | null>(
    defaultFacilityId != null ? Number(defaultFacilityId) : null
  );

  useEffect(() => {
    dispatch(setPageCode('Insurance Receivables'));
    dispatch(setDivContent('Insurance Receivables'));
  }, [dispatch]);

  const { data: facilities = [] } = useGetAllFacilitiesQuery();

  const facilityOptions = useMemo(
    () =>
      (facilities ?? []).map((facility: any) => ({
        label: facility?.name ?? `Facility #${facility?.id}`,
        value: Number(facility?.id)
      })),
    [facilities]
  );

  const {
    data: receivables = [],
    isLoading,
    isFetching,
    refetch
  } = useGetInsuranceReceivablesByPayerQuery({
    facilityId: facilityFilter
  });

  const rows: InsurancePayerReceivablesSummaryResponse[] = useMemo(() => {
    if (Array.isArray(receivables)) return receivables;
    const response: any = receivables;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  }, [receivables]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.totalBilled += Number(row.totalBilled ?? 0);
        acc.totalReceived += Number(row.totalReceived ?? 0);
        acc.outstanding += Number(row.outstandingBalance ?? 0);
        acc.pendingClaims += Number(row.pendingClaims ?? 0);
        acc.paidClaims += Number(row.paidClaims ?? 0);
        acc.partiallyPaid += Number(row.partiallyPaidClaims ?? 0);
        acc.rejectedClaims += Number(row.rejectedClaims ?? 0);
        acc.payerCount += 1;
        return acc;
      },
      {
        payerCount: 0,
        totalBilled: 0,
        totalReceived: 0,
        outstanding: 0,
        pendingClaims: 0,
        paidClaims: 0,
        partiallyPaid: 0,
        rejectedClaims: 0
      }
    );
  }, [rows]);

  const columns = useMemo(() => getReceivablesColumns(), []);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [page, rows, rowsPerPage]);

  return (
    <div className="insurance-receivables-page">
      <Panel bordered className="insurance-receivables-hero-panel">
        <div className="insurance-receivables-hero">
          <div>
            <div className="insurance-receivables-hero-eyebrow">Billing & Finance</div>
            <h1 className="insurance-receivables-hero-title">Insurance Receivables</h1>
            <p className="insurance-receivables-hero-subtitle">
              Financial overview by insurance payer — billed amounts, collections, outstanding
              balances, and claim progress from billing, invoice, payment, allocation, and claim
              records.
            </p>
          </div>

          <div className="insurance-receivables-kpi-grid">
            <div className="insurance-receivables-kpi">
              <span className="insurance-receivables-kpi-label">Payers</span>
              <strong>{summary.payerCount}</strong>
            </div>
            <div className="insurance-receivables-kpi">
              <span className="insurance-receivables-kpi-label">Total Billed</span>
              <strong>{formatMoney(summary.totalBilled)}</strong>
            </div>
            <div className="insurance-receivables-kpi insurance-receivables-kpi--success">
              <span className="insurance-receivables-kpi-label">Total Received</span>
              <strong>{formatMoney(summary.totalReceived)}</strong>
            </div>
            <div className="insurance-receivables-kpi insurance-receivables-kpi--danger">
              <span className="insurance-receivables-kpi-label">Outstanding</span>
              <strong>{formatMoney(summary.outstanding)}</strong>
            </div>
            <div className="insurance-receivables-kpi insurance-receivables-kpi--warn">
              <span className="insurance-receivables-kpi-label">Pending Claims</span>
              <strong>{summary.pendingClaims}</strong>
            </div>
            <div className="insurance-receivables-kpi insurance-receivables-kpi--success">
              <span className="insurance-receivables-kpi-label">Paid Claims</span>
              <strong>{summary.paidClaims}</strong>
            </div>
          </div>
        </div>
      </Panel>

      <Panel bordered className="insurance-receivables-table-panel">
        <div className="insurance-receivables-toolbar">
          <div className="insurance-receivables-toolbar-filters">
            <label className="insurance-receivables-filter-label">
              <Translate>Facility</Translate>
            </label>
            <SelectPicker
              cleanable
              searchable
              placeholder="All facilities"
              data={facilityOptions}
              value={facilityFilter}
              style={{ width: 260 }}
              onChange={value =>
                setFacilityFilter(value != null ? Number(value) : null)
              }
            />
          </div>

          <Button appearance="primary" onClick={() => refetch()}>
            <Translate>Refresh</Translate>
          </Button>
        </div>

        <MyTable
          columns={columns}
          data={pagedRows}
          loading={isLoading || isFetching}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={rows.length}
          height={620}
          onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
          onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Panel>
    </div>
  );
};

export default InsuranceReceivablesScreen;
