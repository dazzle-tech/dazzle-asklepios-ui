import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaArrowsRotate } from 'react-icons/fa6';

import MyTable from '@/components/MyTable';
import {
  useGetClaimTrackingQuery,
  useRefreshClaimStatusMutation,
  useRefreshClaimUploadSummaryMutation,
  useSubmitClaimForInvoiceMutation
} from '@/services/waseel-integration/claimService';
import { useLazyGetEncountersByIdsQuery } from '@/services/encounters/patientEncounterService';
import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';
import type { ClaimTrackingResponse, WaseelClaimUploadResponse } from '@/types/model-types-new';
import { useAppDispatch } from '@/hooks';
import { notify, showSystemLoader, hideSystemLoader } from '@/utils/uiReducerActions';

import ClaimFilters from './ClaimFilters';
import ClaimPreview from './ClaimPreview';
import ClaimBatchPanel from './ClaimBatchPanel';
import ClaimUploadSummaryModal from './ClaimUploadSummaryModal';
import { getClaimColumns } from './claimColumns';
import { filterClaimRows } from './utils';
import { initialFilters, type Filters } from './types';

const ClaimsWorkspace: React.FC = () => {
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

  const { data, refetch, isLoading, isFetching } = useGetClaimTrackingQuery({
    page,
    size: rowsPerPage,
    sort: 'id,desc'
  });

  const [submitClaim] = useSubmitClaimForInvoiceMutation();
  const [refreshUploadSummary] = useRefreshClaimUploadSummaryMutation();
  const [refreshClaimStatus] = useRefreshClaimStatusMutation();

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
    const counts = { submitted: 0, accepted: 0, failed: 0, rejected: 0 };
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

  const closePreview = useCallback(() => {
    setOpenPreview(false);
    setSelectedRow(null);
  }, []);

  const handleResubmit = useCallback(
    async (row: ClaimTrackingResponse) => {
      if (!row.financialDocumentId) {
        dispatch(notify({ msg: 'Invoice document is missing for this claim', sev: 'warning' }));
        return;
      }
      try {
        dispatch(showSystemLoader());
        const result = await submitClaim({
          financialDocumentId: row.financialDocumentId,
          claimType: row.claimType,
          claimSubType: row.claimSubType
        }).unwrap();
        dispatch(
          notify({
            msg:
              String(result.status ?? '').toUpperCase() === 'FAILED' ||
              String(result.status ?? '').toUpperCase() === 'REJECTED'
                ? result.message || 'Claim submission was not accepted by Waseel'
                : 'Claim submitted successfully',
            sev:
              String(result.status ?? '').toUpperCase() === 'FAILED' ||
              String(result.status ?? '').toUpperCase() === 'REJECTED'
                ? 'error'
                : 'success'
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
        if (row.id) {
          const refreshed = await refreshClaimStatus(row.id).unwrap();
          setSelectedRow(refreshed);
        }
        refetch();
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
    [dispatch, refetch, refreshClaimStatus, refreshUploadSummary]
  );

  const columns = useMemo(
    () =>
      getClaimColumns({
        handlers: { onPreview: handlePreview, onResubmit: handleResubmit, onRefreshUpload: handleRefreshUpload },
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

  const tableLoading = isLoading || isFetching;

  return (
    <>
      <div className="bc-toolbar__stats-row">
        <div className="bc-toolbar__stats" aria-label="Claim status summary">
          <div className="bc-chip">
            <span className="bc-chip__dot bc-chip__dot--info" />
            Submitted <strong>{statusSummary.submitted}</strong>
          </div>
          <div className="bc-chip">
            <span className="bc-chip__dot bc-chip__dot--success" />
            Accepted <strong>{statusSummary.accepted}</strong>
          </div>
          <div className="bc-chip">
            <span className="bc-chip__dot bc-chip__dot--danger" />
            Failed <strong>{statusSummary.failed}</strong>
          </div>
          <div className="bc-chip">
            <span className="bc-chip__dot bc-chip__dot--warn" />
            Rejected <strong>{statusSummary.rejected}</strong>
          </div>
        </div>

        <button
          type="button"
          className="bc-toolbar__refresh"
          disabled={tableLoading}
          onClick={() => refetch()}
        >
          <FaArrowsRotate size={13} />
          Refresh
        </button>
      </div>

      <div className={`bc-body${openPreview ? ' bc-body--split' : ''}`}>
        <main className="bc-main">
          <ClaimBatchPanel onSubmitted={() => refetch()} />

          <div className="bc-card">
            <div className="bc-card__head">
              <div>
                <h2 className="bc-card__head-title">Claims registry</h2>
                <div className="bc-card__head-meta">
                  {tableLoading
                    ? 'Loading…'
                    : `${filteredRows.length} displayed · ${totalCount} total`}
                </div>
              </div>
            </div>

            <div className="bc-filters">
              <ClaimFilters
                filtersKey={filtersKey}
                filters={filters}
                selectedFilter={selectedFilter}
                onFiltersChange={setFilters}
                onSelectedFilterChange={setSelectedFilter}
                onSearch={onSearch}
                onReset={onReset}
              />
            </div>

            <div className="bc-table-wrap">
              <MyTable
                columns={columns}
                data={filteredRows}
                loading={tableLoading}
                page={page}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                height={openPreview ? 480 : 520}
                onRowClick={(row: ClaimTrackingResponse) => handlePreview(row)}
                onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
                onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
            </div>
          </div>
        </main>

        {openPreview && selectedRow && (
          <ClaimPreview
            claim={selectedRow}
            patient={
              selectedRow.patientId != null
                ? patientMap.get(String(selectedRow.patientId))
                : undefined
            }
            encounter={
              selectedRow.encounterId != null
                ? encounterMap.get(Number(selectedRow.encounterId))
                : undefined
            }
            onClose={closePreview}
          />
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
    </>
  );
};

export default ClaimsWorkspace;
