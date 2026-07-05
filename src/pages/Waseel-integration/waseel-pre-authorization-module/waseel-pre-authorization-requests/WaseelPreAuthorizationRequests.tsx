import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  useGetPreAuthorizationTrackingQuery,
  useSearchPreAuthorizationMutation,
  useCancelPreAuthorizationMutation,
  useCommunicatePreAuthorizationMutation
} from '@/services/waseel-integration/preAuthorizationService';

import { useLazyGetEncountersByIdsQuery } from '@/services/encounters/patientEncounterService';
import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';

import type {
  PreAuthorizationCancelRequest,
  PreAuthorizationCommunicationRequest,
  PreAuthorizationTrackingResponse
} from '@/types/model-types-new';

import PreviewWaseelPreAuthorizationRequests from './PreviewWaseelPreAuthorizationRequests';
import PreAuthorizationFilters from './PreAuthorizationFilters';
import PreAuthorizationExportButtons from './PreAuthorizationExportButtons';
import PreAuthorizationRequestsTable from './PreAuthorizationRequestsTable';
import PreAuthorizationCancelModal from './PreAuthorizationCancelModal';
import PreAuthorizationCommunicationModal from './PreAuthorizationCommunicationModal';
import { getPreAuthorizationColumns } from './preAuthorizationColumns';
import { initialFilters, type Filters } from './types';
import { filterPreAuthorizationRows } from './utils';
import { useAppDispatch } from '@/hooks';
import { notify, showSystemLoader, hideSystemLoader } from '@/utils/uiReducerActions';
import './styles.less';

const WaseelPreAuthorizationRequests: React.FC = () => {
  const [filters, setFilters] = useState<Filters>({ ...initialFilters });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({ ...initialFilters });
  const [filtersKey, setFiltersKey] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const [selectedRow, setSelectedRow] = useState<PreAuthorizationTrackingResponse | null>(null);
  const [openPreview, setOpenPreview] = useState(false);

  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [openCommunicationModal, setOpenCommunicationModal] = useState(false);
  const [communicationMessage, setCommunicationMessage] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const dispatch = useAppDispatch();

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const {
    data,
    refetch,
    isLoading: isTrackingLoading,
    isFetching: isTrackingFetching
  } = useGetPreAuthorizationTrackingQuery({
    page,
    size: rowsPerPage,
    sort: 'id,desc'
  });

  const [searchFromWaseel] = useSearchPreAuthorizationMutation();
  const [cancelPreAuthorization, { isLoading: isCancelling }] = useCancelPreAuthorizationMutation();
  const [communicatePreAuthorization, { isLoading: isCommunicating }] =
    useCommunicatePreAuthorizationMutation();

  const [getEncountersByIds, { data: encountersData, isFetching: isEncountersFetching }] =
    useLazyGetEncountersByIdsQuery();

  const patientBulkIdsRef = useRef<string[]>([]);
  const [getBulkPatientBasicInfo, { data: patientsBasicInfo, isLoading: patientsBulkLoading }] =
    useGetBulkPatientBasicInfoMutation();

  const preAuthorizationRows: PreAuthorizationTrackingResponse[] = useMemo(() => {
    const response: any = data;

    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.content)) return response.content;
    if (Array.isArray(response?.data?.content)) return response.data.content;
    if (Array.isArray(response?.data)) return response.data;

    return [];
  }, [data]);

  const encounterIds = useMemo(() => {
    const ids = preAuthorizationRows.map(item => item.encounterId);
    return Array.from(new Set(ids.filter((id): id is number => id != null)));
  }, [preAuthorizationRows]);

  useEffect(() => {
    if (!encounterIds.length) return;
    getEncountersByIds({ ids: encounterIds });
  }, [encounterIds, getEncountersByIds]);

  const encounterMap = useMemo(() => {
    if (!encountersData) return new Map<number, any>();
    return new Map(encountersData.map((item: any) => [item.id, item]));
  }, [encountersData]);

  const patientIdsForBulk = useMemo(() => {
    const ids = preAuthorizationRows
      .map(row => row.patientId)
      .filter(v => v !== null && v !== undefined)
      .map(v => String(v));

    return Array.from(new Set(ids));
  }, [preAuthorizationRows]);

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
      response?.data?.totalElements ??
      response?.totalCount ??
      response?.data?.totalCount ??
      preAuthorizationRows.length
    );
  }, [data, preAuthorizationRows.length]);

  const tableData = useMemo(() => {
    return filterPreAuthorizationRows(preAuthorizationRows, appliedFilters);
  }, [preAuthorizationRows, appliedFilters]);

  const tableLoading =
    isTrackingLoading || isTrackingFetching || isEncountersFetching || patientsBulkLoading;

  useEffect(() => {
    if (tableLoading) dispatch(showSystemLoader());
    else dispatch(hideSystemLoader());

    return () => {
      dispatch(hideSystemLoader());
    };
  }, [dispatch, tableLoading]);

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
    setPage(0);
  };

  const handleReset = () => {
    setFilters({ ...initialFilters });
    setAppliedFilters({ ...initialFilters });
    setFiltersKey(prev => prev + 1);
    setSelectedFilter(null);
    setPage(0);
  };

  const openView = useCallback((row: PreAuthorizationTrackingResponse) => {
    setSelectedRow(row);
    setOpenPreview(true);
  }, []);

  const handleRefreshFromWaseel = useCallback(
    async (row: PreAuthorizationTrackingResponse) => {
      if (!row.approvalRequestId) {
        dispatch(notify({ msg: 'No approvalRequestId found for this pre-authorization', sev: 'error' }));
        return;
      }

      try {
        await searchFromWaseel({ requestId: row.approvalRequestId }).unwrap();
        dispatch(notify({ msg: 'Pre-authorization refreshed successfully', sev: 'success' }));
        refetch();
      } catch {
        dispatch(notify({ msg: 'Failed to refresh pre-authorization', sev: 'error' }));
      }
    },
    [dispatch, refetch, searchFromWaseel]
  );

  const openCancel = useCallback((row: PreAuthorizationTrackingResponse) => {
    setSelectedRow(row);
    setCancelReason('');
    setOpenCancelModal(true);
  }, []);

  const openCommunication = useCallback((row: PreAuthorizationTrackingResponse) => {
    setSelectedRow(row);
    setCommunicationMessage('');
    setOpenCommunicationModal(true);
  }, []);

  const submitCancel = async () => {
    if (!selectedRow) {
      dispatch(notify({ msg: 'No pre-authorization selected', sev: 'error' }));
      return;
    }

    if (!selectedRow.id) {
      dispatch(notify({ msg: 'No preAuthorizationId found for this pre-authorization', sev: 'error' }));
      return;
    }

    if (!selectedRow.approvalRequestId) {
      dispatch(notify({ msg: 'No approvalRequestId found for this pre-authorization', sev: 'error' }));
      return;
    }

    if (!cancelReason) {
      dispatch(notify({ msg: 'Please select cancel reason', sev: 'error' }));
      return;
    }

    try {
      const body: PreAuthorizationCancelRequest = {
        preAuthorizationId: Number(selectedRow.id),
        approvalRequestId: Number(selectedRow.approvalRequestId),
        cancelReason: cancelReason as PreAuthorizationCancelRequest['cancelReason']
      };

      await cancelPreAuthorization(body).unwrap();

      dispatch(notify({ msg: 'Pre-authorization cancelled and refreshed successfully', sev: 'success' }));
      setOpenCancelModal(false);
      setCancelReason('');
      refetch();
    } catch {
      dispatch(notify({ msg: 'Failed to cancel pre-authorization', sev: 'error' }));
    }
  };

  const submitCommunication = async () => {
    if (!selectedRow) {
      dispatch(notify({ msg: 'No pre-authorization selected', sev: 'error' }));
      return;
    }

    if (!selectedRow.approvalResponseId) {
      dispatch(notify({ msg: 'No approvalResponseId found for this pre-authorization', sev: 'error' }));
      return;
    }

    try {
      const body = {
        claimResponseId: Number(selectedRow.approvalResponseId),
        payloads: [
          {
            attachmentName: '',
            attachmentType: '',
            claimItemId: 1,
            createdDate: '',
            payloadAttachment: '',
            payloadValue: communicationMessage
          }
        ]
      } as unknown as PreAuthorizationCommunicationRequest;

      await communicatePreAuthorization(body).unwrap();

      dispatch(notify({ msg: 'Communication sent successfully', sev: 'success' }));
      setOpenCommunicationModal(false);
      setCommunicationMessage('');
      refetch();
    } catch {
      dispatch(notify({ msg: 'Failed to send communication', sev: 'error' }));
    }
  };

  const columns = useMemo(
    () =>
      getPreAuthorizationColumns({
        handlers: {
          onView: openView,
          onRefreshFromWaseel: handleRefreshFromWaseel,
          onCommunication: openCommunication,
          onCancel: openCancel
        },
        encounterMap,
        patientMap
      }),
    [openView, handleRefreshFromWaseel, openCommunication, openCancel, encounterMap, patientMap]
  );

  const isSelected = (row: PreAuthorizationTrackingResponse) =>
    row?.id === selectedRow?.id ? 'selected-row' : '';

  return (
    <div className="active-admins-page" dir={dir}>
      <PreAuthorizationRequestsTable
        data={tableData}
        columns={columns}
        rowClassName={isSelected}
        onRowClick={openView}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        loading={tableLoading}
        onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
        onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        filters={
          <PreAuthorizationFilters
            filtersKey={filtersKey}
            filters={filters}
            selectedFilter={selectedFilter}
            onFiltersChange={setFilters}
            onSelectedFilterChange={setSelectedFilter}
            onSearch={handleSearch}
            onReset={handleReset}
          />
        }
        tableButtons={
          <PreAuthorizationExportButtons
            data={tableData}
            patientMap={patientMap}
            encounterMap={encounterMap}
          />
        }
      />

      <PreAuthorizationCancelModal
        open={openCancelModal}
        cancelReason={cancelReason}
        isSubmitting={isCancelling}
        onClose={() => setOpenCancelModal(false)}
        onCancelReasonChange={setCancelReason}
        onSubmit={submitCancel}
      />

      <PreAuthorizationCommunicationModal
        open={openCommunicationModal}
        communicationMessage={communicationMessage}
        isSubmitting={isCommunicating}
        onClose={() => setOpenCommunicationModal(false)}
        onMessageChange={setCommunicationMessage}
        onSubmit={submitCommunication}
      />
    </div>
  );
};

export default WaseelPreAuthorizationRequests;