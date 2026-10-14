import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaArrowRotateLeft, FaArrowsRotate } from 'react-icons/fa6';

import MyTable from '@/components/MyTable';
import { useAppSelector } from '@/hooks';
import {
  useGetClaimTrackingQuery,
  useRefreshClaimStatusMutation,
  useRefreshClaimUploadSummaryMutation,
  useReturnClaimsForResubmitMutation,
  type ClaimTrackingQuery
} from '@/services/waseel-integration/claimService';
import { useLazyGetEncountersByIdsQuery } from '@/services/encounters/patientEncounterService';
import { useLazyGetUserByLoginQuery } from '@/services/userService';
import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';
import type { ClaimTrackingResponse, WaseelClaimUploadResponse } from '@/types/model-types-new';
import { useAppDispatch } from '@/hooks';
import { notify, showSystemLoader, hideSystemLoader } from '@/utils/uiReducerActions';

import ClaimFilters from './ClaimFilters';
import ClaimPreview from './ClaimPreview';
import ClaimBatchPanel from './ClaimBatchPanel';
import ClaimUploadSummaryModal from './ClaimUploadSummaryModal';
import { getClaimColumns } from './claimColumns';
import { canReturnClaimForResubmit } from './utils';
import { initialFilters, type Filters } from './types';

const ClaimsWorkspace: React.FC = () => {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector(state => state.auth.user);
  const [getUserByLogin, { data: userByLogin }] = useLazyGetUserByLoginQuery();

  useEffect(() => {
    if (authUser?.login) {
      getUserByLogin(authUser.login);
    }
  }, [authUser?.login, getUserByLogin]);

  const canReturnClaims = Boolean(userByLogin?.canReturnClaimForResubmit);

  const [filters, setFilters] = useState<Filters>({ ...initialFilters });
  const [appliedSearch, setAppliedSearch] = useState<{
    field: keyof Filters | null;
    value: string;
    token: number;
  }>({ field: null, value: '', token: 0 });
  const [filtersKey, setFiltersKey] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const [selectedRow, setSelectedRow] = useState<ClaimTrackingResponse | null>(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<WaseelClaimUploadResponse | null>(null);
  const [openUploadSummary, setOpenUploadSummary] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedClaimIds, setSelectedClaimIds] = useState<number[]>([]);

  const trackingQuery = useMemo<ClaimTrackingQuery>(() => {
    const query: ClaimTrackingQuery = {
      page,
      size: rowsPerPage,
      sort: 'id,desc',
      timestamp: appliedSearch.token
    };
    if (appliedSearch.field && appliedSearch.value) {
      query[appliedSearch.field] = appliedSearch.value;
    }
    return query;
  }, [appliedSearch, page, rowsPerPage]);

  const { data, refetch, isLoading, isFetching } = useGetClaimTrackingQuery(trackingQuery);

  const [returnClaimsForResubmit, { isLoading: returningClaims }] =
    useReturnClaimsForResubmitMutation();
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

  const encounterIds = useMemo(() => {
    const ids = claimRows.map(item => item.encounterId);
    return Array.from(new Set(ids.filter((id): id is number => id != null)));
  }, [claimRows]);

  useEffect(() => {
    if (!encounterIds.length) return;
    getEncountersByIds({ ids: encounterIds });
  }, [encounterIds, getEncountersByIds]);

  const encounterMap = useMemo(() => {
    if (!encountersData) return new Map<number, any>();
    return new Map(encountersData.map((item: any) => [item.id, item]));
  }, [encountersData]);

  const patientIdsForBulk = useMemo(() => {
    const ids = claimRows
      .map(row => row.patientId)
      .filter(v => v !== null && v !== undefined)
      .map(v => String(v));
    return Array.from(new Set(ids));
  }, [claimRows]);

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

  const totalCount = data?.totalCount ?? 0;

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

  const pageReturnableIds = useMemo(
    () =>
      claimRows
        .filter(canReturnClaimForResubmit)
        .map(row => row.id)
        .filter((id): id is number => id != null),
    [claimRows]
  );

  const toggleClaim = useCallback((claimId: number) => {
    setSelectedClaimIds(current =>
      current.includes(claimId) ? current.filter(id => id !== claimId) : [...current, claimId]
    );
  }, []);

  const togglePageClaims = useCallback(() => {
    const pageIds = new Set(pageReturnableIds);
    const allPageSelected =
      pageReturnableIds.length > 0 && pageReturnableIds.every(id => selectedClaimIds.includes(id));

    if (allPageSelected) {
      setSelectedClaimIds(current => current.filter(id => !pageIds.has(id)));
      return;
    }

    setSelectedClaimIds(current => [...new Set([...current, ...pageReturnableIds])]);
  }, [pageReturnableIds, selectedClaimIds]);

  const handleReturnForResubmit = useCallback(async () => {
    if (!selectedClaimIds.length) {
      dispatch(notify({ msg: 'Select at least one claim.', sev: 'warning' }));
      return;
    }

    try {
      dispatch(showSystemLoader());
      const result = await returnClaimsForResubmit({ claimIds: selectedClaimIds }).unwrap();
      const skipped = Number(result?.skippedCount ?? 0);
      dispatch(
        notify({
          msg:
            skipped > 0
              ? `Returned ${result.returnedCount} claim(s) to the batch. Skipped ${skipped} that cannot be resubmitted.`
              : `Returned ${result.returnedCount} claim(s) to the monthly batch. Search above to resubmit them.`,
          sev: 'success'
        })
      );
      setSelectedClaimIds([]);
      refetch();
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            error?.data?.detail ||
            error?.data?.message ||
            'Failed to return the selected claims for resubmit',
          sev: 'error'
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  }, [dispatch, refetch, returnClaimsForResubmit, selectedClaimIds]);

  const columns = useMemo(
    () =>
      getClaimColumns({
        handlers: { onPreview: handlePreview, onRefreshUpload: handleRefreshUpload },
        encounterMap,
        patientMap,
        canSelect: canReturnClaims,
        selectedIds: selectedClaimIds,
        pageReturnableIds,
        onToggleRow: toggleClaim,
        onTogglePage: togglePageClaims
      }),
    [
      canReturnClaims,
      encounterMap,
      handlePreview,
      handleRefreshUpload,
      pageReturnableIds,
      patientMap,
      selectedClaimIds,
      toggleClaim,
      togglePageClaims
    ]
  );

  const onSearch = () => {
    const field = selectedFilter as keyof Filters | null;
    const value = field ? String(filters[field] ?? '').trim() : '';
    setAppliedSearch({
      field: field && value ? field : null,
      value,
      token: Date.now()
    });
    setSelectedClaimIds([]);
    setPage(0);
  };

  const onReset = () => {
    setFilters({ ...initialFilters });
    setAppliedSearch({ field: null, value: '', token: Date.now() });
    setSelectedFilter(null);
    setFiltersKey(key => key + 1);
    setSelectedClaimIds([]);
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

      <div className="bc-body">
        <main className="bc-main">
          <ClaimBatchPanel onSubmitted={() => refetch()} />

          <div className="bc-card">
            <div className="bc-card__head">
              <div>
                <h2 className="bc-card__head-title">Claims registry</h2>
                <div className="bc-card__head-meta">
                  {tableLoading
                    ? 'Loading…'
                    : `${claimRows.length} on this page · ${totalCount} matching`}
                </div>
              </div>
              {canReturnClaims && (
                <button
                  type="button"
                  className="bc-return-btn"
                  disabled={!selectedClaimIds.length || returningClaims}
                  onClick={() => {
                    void handleReturnForResubmit();
                  }}
                >
                  <FaArrowRotateLeft size={13} />
                  <span>{returningClaims ? 'Returning…' : 'Return for resubmit'}</span>
                  <span className="bc-return-btn__count">{selectedClaimIds.length}</span>
                </button>
              )}
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
                data={claimRows}
                loading={tableLoading}
                page={page}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                height={520}
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
      </div>

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
