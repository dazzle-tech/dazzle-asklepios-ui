import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  useGetPreAuthorizationTrackingQuery,
  useSearchPreAuthorizationMutation,
  useCancelPreAuthorizationMutation,
  useCommunicatePreAuthorizationMutation,
  useUploadPreAuthorizationAttachmentMutation
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
import PreAuthorizationRequestsTable from './PreAuthorizationRequestsTable';
import PreAuthorizationCancelModal from './PreAuthorizationCancelModal';
import PreAuthorizationCommunicationModal, {
  type CommunicationAttachmentFile
} from './PreAuthorizationCommunicationModal';
import PreAuthorizationCommunicationsDrawer from './PreAuthorizationCommunicationsDrawer';
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
  const [openCommunicationsDrawer, setOpenCommunicationsDrawer] = useState(false);
  const [communicationMessage, setCommunicationMessage] = useState('');
  const [communicationAttachment, setCommunicationAttachment] =
    useState<CommunicationAttachmentFile | null>(null);

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
  const [uploadPreAuthorizationAttachment] = useUploadPreAuthorizationAttachmentMutation();
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

  const openCommunication = useCallback((row: PreAuthorizationTrackingResponse) => {
    setSelectedRow(row);
    setCommunicationMessage('');
    setCommunicationAttachment(null);
    setOpenCommunicationModal(true);
  }, []);

  const openCommunicationsHistory = useCallback((row: PreAuthorizationTrackingResponse) => {
    setSelectedRow(row);
    setOpenCommunicationsDrawer(true);
  }, []);

  const openCancel = useCallback((row: PreAuthorizationTrackingResponse) => {
    setSelectedRow(row);
    setCancelReason('');
    setOpenCancelModal(true);
  }, []);

  // Keep modal selection in sync after Search/refetch so waseelClaimItemIds are available.
  useEffect(() => {
    if (selectedRow?.id == null) return;
    const fresh = preAuthorizationRows.find(row => row.id === selectedRow.id);
    if (!fresh) return;

    const sameClaimIds =
      JSON.stringify(fresh.waseelClaimItemIds ?? []) ===
      JSON.stringify(selectedRow.waseelClaimItemIds ?? []);
    const sameResponseId = fresh.approvalResponseId === selectedRow.approvalResponseId;
    const sameSearch = fresh.searchCompleted === selectedRow.searchCompleted;

    if (!sameClaimIds || !sameResponseId || !sameSearch) {
      setSelectedRow(fresh);
    }
  }, [preAuthorizationRows, selectedRow]);

  const handleRefreshFromWaseel = useCallback(
    async (row: PreAuthorizationTrackingResponse) => {
      if (!row.approvalRequestId) {
        dispatch(notify({ msg: 'No approvalRequestId found for this pre-authorization', sev: 'error' }));
        return;
      }

      try {
        await searchFromWaseel({
          preAuthorizationId: row.id != null ? Number(row.id) : undefined,
          requestId: row.approvalRequestId
        }).unwrap();
        dispatch(notify({ msg: 'Pre-authorization refreshed successfully', sev: 'success' }));
        await refetch();
      } catch {
        dispatch(notify({ msg: 'Failed to refresh pre-authorization', sev: 'error' }));
      }
    },
    [dispatch, refetch, searchFromWaseel]
  );

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

    if (!selectedRow.id) {
      dispatch(notify({ msg: 'No preAuthorizationId found for this pre-authorization', sev: 'error' }));
      return;
    }

    if (!selectedRow.approvalResponseId) {
      dispatch(notify({ msg: 'No approvalResponseId found for this pre-authorization', sev: 'error' }));
      return;
    }

    const message = communicationMessage.trim();
    const hasAttachment = !!communicationAttachment?.file;

    if (!message && !hasAttachment) {
      dispatch(notify({ msg: 'Please enter a message or attach a file', sev: 'error' }));
      return;
    }

    try {
      // Prefer stored Waseel item ids from tracking; backend will Search/resolve if omitted.
      const claimItemId =
        Array.isArray(selectedRow.waseelClaimItemIds) && selectedRow.waseelClaimItemIds.length > 0
          ? Number(selectedRow.waseelClaimItemIds[0])
          : undefined;

      let attachmentId: number | undefined;

      // Same method as patient attachments: multipart upload -> Spaces + DB row.
      if (hasAttachment && communicationAttachment) {
        const uploaded = await uploadPreAuthorizationAttachment({
          preAuthorizationId: Number(selectedRow.id),
          file: communicationAttachment.file,
          type: 'COMMUNICATION',
          details: message || undefined,
          source: 'COMMUNICATION',
          sourceId: claimItemId
        }).unwrap();

        attachmentId = uploaded?.id != null ? Number(uploaded.id) : undefined;
        if (!attachmentId) {
          dispatch(notify({ msg: 'Attachment uploaded but no id returned', sev: 'error' }));
          return;
        }
      }

      const body: PreAuthorizationCommunicationRequest = {
        preAuthorizationId: Number(selectedRow.id),
        claimResponseId: Number(selectedRow.approvalResponseId),
        payloads: [
          {
            ...(claimItemId != null ? { claimItemId } : {}),
            ...(message ? { payloadValue: message } : {}),
            ...(attachmentId != null ? { attachmentId } : {})
          }
        ]
      };

      await communicatePreAuthorization(body).unwrap();

      dispatch(notify({ msg: 'Communication sent successfully', sev: 'success' }));
      setOpenCommunicationModal(false);
      setCommunicationMessage('');
      setCommunicationAttachment(null);
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
          onViewCommunications: openCommunicationsHistory,
          onCancel: openCancel
        },
        encounterMap,
        patientMap
      }),
    [
      openView,
      handleRefreshFromWaseel,
      openCommunication,
      openCommunicationsHistory,
      openCancel,
      encounterMap,
      patientMap
    ]
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
        attachment={communicationAttachment}
        isSubmitting={isCommunicating}
        onClose={() => {
          setOpenCommunicationModal(false);
          setCommunicationMessage('');
          setCommunicationAttachment(null);
        }}
        onMessageChange={setCommunicationMessage}
        onAttachmentChange={setCommunicationAttachment}
        onSubmit={submitCommunication}
      />

      <PreAuthorizationCommunicationsDrawer
        open={openCommunicationsDrawer}
        row={selectedRow}
        onClose={() => setOpenCommunicationsDrawer(false)}
      />
    </div>
  );
};

export default WaseelPreAuthorizationRequests;