import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Panel } from 'rsuite';

import MyTable from '@/components/MyTable';
import {
  useGetClaimTrackingQuery,
  useRefreshClaimUploadSummaryMutation,
  useSubmitClaimForInvoiceMutation
} from '@/services/waseel-integration/claimService';
import { useLazyGetEncountersByIdsQuery } from '@/services/encounters/patientEncounterService';
import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';
import type { ClaimTrackingResponse, WaseelClaimUploadResponse } from '@/types/model-types-new';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify, showSystemLoader, hideSystemLoader } from '@/utils/uiReducerActions';

import ClaimFilters from './ClaimFilters';
import ClaimPreview from './ClaimPreview';
import ClaimUploadSummaryModal from './ClaimUploadSummaryModal';
import { getClaimColumns } from './claimColumns';
import { filterClaimRows } from './utils';
import { initialFilters, type Filters } from './types';
import './styles.less';

const ClaimsScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  const [filters, setFilters] = useState<Filters>({ ...initialFilters });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({ ...initialFilters });
  const [filtersKey, setFiltersKey] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const [selectedRow, setSelectedRow] = useState<ClaimTrackingResponse | null>(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<WaseelClaimUploadResponse | null>(null);
  const [openUploadSummary, setOpenUploadSummary] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(setPageCode('Claims'));
    dispatch(setDivContent('Claims'));
  }, [dispatch]);

  const {
    data,
    refetch,
    isLoading,
    isFetching
  } = useGetClaimTrackingQuery({
    page,
    size: rowsPerPage,
    sort: 'id,desc'
  });

  const [submitClaim] = useSubmitClaimForInvoiceMutation();
  const [refreshUploadSummary] = useRefreshClaimUploadSummaryMutation();

  const [getEncountersByIds, { data: encountersData }] = useLazyGetEncountersByIdsQuery();
  const patientBulkIdsRef = useRef<string[]>([]);
  const [getBulkPatientBasicInfo, { data: patientsBasicInfo }] =
    useGetBulkPatientBasicInfoMutation();

  const claimRows: ClaimTrackingResponse[] = useMemo(() => {
    const response: any = data;
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.content)) return response.content;
    if (Array.isArray(response?.data?.content)) return response.data.content;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  }, [data]);

  const filteredRows = useMemo(
    () => filterClaimRows(claimRows, appliedFilters),
    [claimRows, appliedFilters]
  );

  const encounterIds = useMemo(() => {
    const ids = filteredRows.map(item => item.encounterId);
    return Array.from(new Set(ids.filter((id): id is number => id != null)));
  }, [filteredRows]);

  useEffect(() => {
    if (!encounterIds.length) return;
    getEncountersByIds({ ids: encounterIds });
  }, [encounterIds, getEncountersByIds]);

  const encounterMap = useMemo(() => {
    if (!encountersData) return new Map<number, any>();
    return new Map(encountersData.map((item: any) => [item.id, item]));
  }, [encountersData]);

  const patientIdsForBulk = useMemo(() => {
    const ids = filteredRows
      .map(row => row.patientId)
      .filter(v => v !== null && v !== undefined)
      .map(v => String(v));
    return Array.from(new Set(ids));
  }, [filteredRows]);

  useEffect(() => {
    if (!patientIdsForBulk.length) return;
    patientBulkIdsRef.current = patientIdsForBulk;
    getBulkPatientBasicInfo(patientIdsForBulk as any)
      .unwrap()
      .catch(() => {
        dispatch(notify({ msg: 'Failed to load patients information', sev: 'error' }));
      });
  }, [patientIdsForBulk, getBulkPatientBasicInfo, dispatch]);

  const patientMap = useMemo(() => {
    const map = new Map<string, any>();
    const ids = patientBulkIdsRef.current;
    (patientsBasicInfo ?? []).forEach((patient: any, index: number) => {
      const key = patient?.id ?? ids[index];
      if (!key) return;
      map.set(String(key), patient);
    });
    return map;
  }, [patientsBasicInfo]);

  const totalCount = useMemo(() => {
    const response: any = data;
    return (
      response?.totalElements ??
      response?.totalCount ??
      response?.data?.totalElements ??
      filteredRows.length
    );
  }, [data, filteredRows.length]);

  const statusSummary = useMemo(() => {
    const counts = {
      submitted: 0,
      accepted: 0,
      failed: 0,
      rejected: 0
    };
    claimRows.forEach(row => {
      const status = String(row.status ?? '').toUpperCase();
      if (status === 'SUBMITTED') counts.submitted += 1;
      if (status === 'ACCEPTED') counts.accepted += 1;
      if (status === 'FAILED') counts.failed += 1;
      if (status === 'REJECTED') counts.rejected += 1;
    });
    return counts;
  }, [claimRows]);

  const handlePreview = useCallback((row: ClaimTrackingResponse) => {
    setSelectedRow(row);
    setOpenPreview(true);
  }, []);

  const handleResubmit = useCallback(
    async (row: ClaimTrackingResponse) => {
      if (!row.financialDocumentId) {
        dispatch(notify({ msg: 'Invoice document is missing for this claim', sev: 'warning' }));
        return;
      }

      try {
        dispatch(showSystemLoader());
        const result = await submitClaim(row.financialDocumentId).unwrap();
        dispatch(
          notify({
            msg:
              result.status === 'FAILED'
                ? result.message || 'Claim resubmission failed'
                : 'Claim submitted successfully',
            sev: result.status === 'FAILED' ? 'error' : 'success'
          })
        );
        refetch();
      } catch (error: any) {
        dispatch(
          notify({
            msg: error?.data?.detail || error?.data?.message || 'Failed to submit claim',
            sev: 'error'
          })
        );
      } finally {
        dispatch(hideSystemLoader());
      }
    },
    [dispatch, refetch, submitClaim]
  );

  const handleRefreshUpload = useCallback(
    async (row: ClaimTrackingResponse) => {
      if (!row.uploadId) {
        dispatch(notify({ msg: 'Upload ID is not available yet', sev: 'warning' }));
        return;
      }

      try {
        dispatch(showSystemLoader());
        const summary = await refreshUploadSummary(row.uploadId).unwrap();
        setUploadSummary(summary);
        setOpenUploadSummary(true);
      } catch (error: any) {
        dispatch(
          notify({
            msg: error?.data?.detail || error?.data?.message || 'Failed to refresh upload summary',
            sev: 'error'
          })
        );
      } finally {
        dispatch(hideSystemLoader());
      }
    },
    [dispatch, refreshUploadSummary]
  );

  const columns = useMemo(
    () =>
      getClaimColumns({
        handlers: {
          onPreview: handlePreview,
          onResubmit: handleResubmit,
          onRefreshUpload: handleRefreshUpload
        },
        encounterMap,
        patientMap
      }),
    [encounterMap, handlePreview, handleRefreshUpload, handleResubmit, patientMap]
  );

  const onSearch = () => {
    setAppliedFilters({ ...filters });
    setPage(0);
  };

  const onReset = () => {
    setFilters({ ...initialFilters });
    setAppliedFilters({ ...initialFilters });
    setSelectedFilter(null);
    setFiltersKey(key => key + 1);
    setPage(0);
  };

  return (
    <div className="claims-page">
      <div className={`claims-layout ${openPreview ? 'claims-layout--preview-open' : ''}`}>
        <div className="claims-main">
          <Panel bordered className="claims-hero-panel">
            <div className="claims-hero">
              <div>
                <div className="claims-hero-eyebrow">Waseel Integration</div>
                <h1 className="claims-hero-title">Insurance Claims</h1>
                <p className="claims-hero-subtitle">
                  Track claims generated from finalized insurance invoices, linked to billing,
                  payments, and approved pre-authorizations.
                </p>
              </div>
              <div className="claims-kpi-grid">
                <div className="claims-kpi">
                  <span className="claims-kpi-label">Submitted</span>
                  <strong>{statusSummary.submitted}</strong>
                </div>
                <div className="claims-kpi claims-kpi--success">
                  <span className="claims-kpi-label">Accepted</span>
                  <strong>{statusSummary.accepted}</strong>
                </div>
                <div className="claims-kpi claims-kpi--danger">
                  <span className="claims-kpi-label">Failed</span>
                  <strong>{statusSummary.failed}</strong>
                </div>
                <div className="claims-kpi claims-kpi--warn">
                  <span className="claims-kpi-label">Rejected</span>
                  <strong>{statusSummary.rejected}</strong>
                </div>
              </div>
            </div>
          </Panel>

          <Panel bordered className="claims-table-panel">
            <ClaimFilters
              filtersKey={filtersKey}
              filters={filters}
              selectedFilter={selectedFilter}
              onFiltersChange={setFilters}
              onSelectedFilterChange={setSelectedFilter}
              onSearch={onSearch}
              onReset={onReset}
            />

            <MyTable
              columns={columns}
              data={filteredRows}
              loading={isLoading || isFetching}
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={totalCount}
              height={620}
              onRowClick={(row: ClaimTrackingResponse) => handlePreview(row)}
              onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
              onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
            />
          </Panel>
        </div>

        {openPreview && (
          <div className="claims-preview-column">
            <ClaimPreview
              open={openPreview}
              claim={selectedRow}
              patient={
                selectedRow?.patientId != null
                  ? patientMap.get(String(selectedRow.patientId))
                  : undefined
              }
              encounter={
                selectedRow?.encounterId != null
                  ? encounterMap.get(Number(selectedRow.encounterId))
                  : undefined
              }
              onClose={() => {
                setOpenPreview(false);
                setSelectedRow(null);
              }}
            />
          </div>
        )}
      </div>

      <ClaimUploadSummaryModal
        open={openUploadSummary}
        summary={uploadSummary}
        onClose={() => {
          setOpenUploadSummary(false);
          setUploadSummary(null);
        }}
      />
    </div>
  );
};

export default ClaimsScreen;
