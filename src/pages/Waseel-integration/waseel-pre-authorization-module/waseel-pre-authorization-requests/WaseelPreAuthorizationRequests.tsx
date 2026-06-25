import React, { useCallback, useMemo, useState } from 'react';

import {
  useGetPreAuthorizationTrackingQuery,
  useLazySearchPreAuthorizationQuery,
  useCancelPreAuthorizationMutation,
  useCommunicatePreAuthorizationMutation
} from '@/services/waseel-integration/preAuthorizationService';

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
import { notify } from '@/utils/uiReducerActions';
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

  const { data, refetch } = useGetPreAuthorizationTrackingQuery({
    page,
    size: rowsPerPage,
    sort: 'id,desc'
  });

  const [searchFromWaseel] = useLazySearchPreAuthorizationQuery();
  const [cancelPreAuthorization, { isLoading: isCancelling }] = useCancelPreAuthorizationMutation();
  const [communicatePreAuthorization, { isLoading: isCommunicating }] =
    useCommunicatePreAuthorizationMutation();

  const preAuthorizationRows: PreAuthorizationTrackingResponse[] = useMemo(() => {
    const response: any = data;

    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.content)) return response.content;
    if (Array.isArray(response?.data?.content)) return response.data.content;
    if (Array.isArray(response?.data)) return response.data;

    return [];
  }, [data]);

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
        alert('No approvalRequestId found for this pre-authorization.');
        return;
      }

      await searchFromWaseel({ requestId: row.approvalRequestId }).unwrap();
      refetch();
    },
    [refetch, searchFromWaseel]
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
      approvalRequestId: Number(selectedRow.approvalRequestId),
      cancelReason: cancelReason as PreAuthorizationCancelRequest['cancelReason']
    };

    await cancelPreAuthorization(body).unwrap();

    dispatch(notify({ msg: 'Pre-authorization cancelled successfully', sev: 'success' }));

    setOpenCancelModal(false);
    setCancelReason('');
    refetch();
  } catch {
    dispatch(notify({ msg: 'Failed to cancel pre-authorization', sev: 'error' }));
  }
};

  const submitCommunication = async () => {
    if (!selectedRow) return;
    console.log('selectedRow:', selectedRow);
    if (!selectedRow.approvalResponseId) {
      alert('No approvalResponseId found for this pre-authorization.');
      return;
    }

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

    console.log('submitCommunication body:', body);

    await communicatePreAuthorization(body).unwrap();
    setOpenCommunicationModal(false);
    refetch();
  };

  const columns = useMemo(
    () =>
      getPreAuthorizationColumns({
        onView: openView,
        onRefreshFromWaseel: handleRefreshFromWaseel,
        onCommunication: openCommunication,
        onCancel: openCancel
      }),
    [openView, handleRefreshFromWaseel, openCommunication, openCancel]
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
        tableButtons={<PreAuthorizationExportButtons />}
      />

      {openPreview && (
        <PreviewWaseelPreAuthorizationRequests
          open={openPreview}
          preAuth={selectedRow}
          onClose={() => setOpenPreview(false)}
        />
      )}

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

