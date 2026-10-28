import React, { useEffect, useMemo, useState } from 'react';
import { Loader } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyTab from '@/components/MyTab';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { extractErrorMessage } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { useGetUsersByFacilityQuery } from '@/services/security/UserRoleService';
import {
  useAddPatientComplaintActionMutation,
  useAssignPatientComplaintMutation,
  useClosePatientComplaintMutation,
  useCompletePatientComplaintActionMutation,
  useGetPatientComplaintByIdQuery,
  useLazyGetPatientComplaintAttachmentDownloadUrlQuery,
  useReopenPatientComplaintMutation,
  useResolvePatientComplaintMutation,
  useSetPatientComplaintDeadlineMutation,
  useStartPatientComplaintActionMutation,
  useStartPatientComplaintHandlingMutation
} from '@/services/patient-complaints/patientComplaintService';
import {
  dateInputToInstant,
  formatStaffUserLabel,
  hasIncompleteActions,
  isComplaintOverdue,
  toDateInputValue
} from '../constants';
import ComplaintActions from './ComplaintActions';
import ComplaintDetails from './ComplaintDetails';
import ComplaintResolution from './ComplaintResolution';
import {
  emptyActionDraft,
  emptyOwnerDraft,
  emptyResolutionDraft,
  type ActionDraft,
  type CompleteDraft,
  type OwnerDraft,
  type ResolutionDraft
} from './types';

type ComplaintDetailModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  complaintId: number | null;
};

const ComplaintDetailModal = ({ open, setOpen, complaintId }: ComplaintDetailModalProps) => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState('1');
  const [ownerDraft, setOwnerDraft] = useState<OwnerDraft>(emptyOwnerDraft());
  const [actionDraft, setActionDraft] = useState<ActionDraft>(emptyActionDraft());
  const [resolutionDraft, setResolutionDraft] = useState<ResolutionDraft>(emptyResolutionDraft());
  const [completeDraft, setCompleteDraft] = useState<CompleteDraft | null>(null);

  const {
    data: complaint,
    isFetching: detailFetching,
    isError: detailError
  } = useGetPatientComplaintByIdQuery(complaintId as number, {
    skip: !open || complaintId == null
  });

  const facilityId = complaint?.facilityId != null ? Number(complaint.facilityId) : null;

  const { data: facilityUsers = [] } = useGetUsersByFacilityQuery(facilityId as number, {
    skip: !open || facilityId == null || Number.isNaN(facilityId)
  });

  const [assignComplaint, { isLoading: assigning }] = useAssignPatientComplaintMutation();
  const [setDeadline, { isLoading: settingDeadline }] = useSetPatientComplaintDeadlineMutation();
  const [startHandling, { isLoading: startingHandling }] =
    useStartPatientComplaintHandlingMutation();
  const [addAction, { isLoading: addingAction }] = useAddPatientComplaintActionMutation();
  const [startAction, { isLoading: startingAction }] = useStartPatientComplaintActionMutation();
  const [completeAction, { isLoading: completingAction }] =
    useCompletePatientComplaintActionMutation();
  const [resolveComplaint, { isLoading: resolving }] = useResolvePatientComplaintMutation();
  const [closeComplaint, { isLoading: closing }] = useClosePatientComplaintMutation();
  const [reopenComplaint, { isLoading: reopening }] = useReopenPatientComplaintMutation();
  const [fetchAttachmentDownloadUrl] = useLazyGetPatientComplaintAttachmentDownloadUrlQuery();

  const mutationPending =
    assigning ||
    settingDeadline ||
    startingHandling ||
    addingAction ||
    startingAction ||
    completingAction ||
    resolving ||
    closing ||
    reopening;

  useEffect(() => {
    if (!open || !complaint) {
      setActiveTab('1');
      setOwnerDraft(emptyOwnerDraft());
      setActionDraft(emptyActionDraft());
      setResolutionDraft(emptyResolutionDraft());
      setCompleteDraft(null);
      return;
    }

    setOwnerDraft({
      assignedUserId: complaint.assignedUserId ?? null,
      targetDeadline: toDateInputValue(complaint.targetDeadline)
    });
    setActionDraft(emptyActionDraft());
    setResolutionDraft({
      resolutionSummary: complaint.resolutionSummary || '',
      reopenReason: ''
    });
    setCompleteDraft(null);
    // Reset draft inputs only when the modal opens or the selected complaint changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, complaint?.id]);

  const locked = complaint?.status === 'RESOLVED' || complaint?.status === 'CLOSED';
  const overdue = complaint ? isComplaintOverdue(complaint) : false;

  const staffOptions = useMemo(
    () =>
      (facilityUsers as any[])
        .filter(user => user?.id != null)
        .map(user => ({
          label: formatStaffUserLabel(user),
          value: Number(user.id)
        })),
    [facilityUsers]
  );

  const notifyError = (error: unknown, fallback: string) => {
    dispatch(
      notify({ msg: extractErrorMessage(error) || fallback, sev: 'error' })
    );
  };

  const handleAssignOwner = async () => {
    if (!complaint || mutationPending) return;

    if (locked) {
      dispatch(notify({ msg: 'Reopen the complaint before changing assignment.', sev: 'warning' }));
      return;
    }

    if (ownerDraft.assignedUserId == null || ownerDraft.assignedUserId === '') {
      dispatch(notify({ msg: 'Select a complaint owner.', sev: 'warning' }));
      return;
    }

    try {
      await assignComplaint({
        id: complaint.id,
        assignedUserId: Number(ownerDraft.assignedUserId)
      }).unwrap();
      dispatch(notify({ msg: 'Complaint owner updated.', sev: 'success' }));
    } catch (error) {
      notifyError(error, 'Unable to assign complaint owner.');
    }
  };

  const handleSetDeadline = async () => {
    if (!complaint || mutationPending) return;

    if (locked) {
      dispatch(notify({ msg: 'Reopen the complaint before changing the deadline.', sev: 'warning' }));
      return;
    }

    if (!ownerDraft.targetDeadline) {
      dispatch(notify({ msg: 'Select a target deadline.', sev: 'warning' }));
      return;
    }

    try {
      await setDeadline({
        id: complaint.id,
        targetDeadline: dateInputToInstant(ownerDraft.targetDeadline, true)
      }).unwrap();
      dispatch(notify({ msg: 'Target deadline updated.', sev: 'success' }));
    } catch (error) {
      notifyError(error, 'Unable to update target deadline.');
    }
  };

  const handleStartHandling = async () => {
    if (!complaint || mutationPending) return;

    if (locked) {
      dispatch(notify({ msg: 'Reopen the complaint before starting handling.', sev: 'warning' }));
      return;
    }

    if (!complaint.assignedUserId) {
      dispatch(notify({ msg: 'Assign an owner before starting handling.', sev: 'warning' }));
      return;
    }

    if (complaint.status !== 'NEW') {
      dispatch(notify({ msg: 'Handling can only be started from NEW status.', sev: 'warning' }));
      return;
    }

    try {
      await startHandling(complaint.id).unwrap();
      dispatch(notify({ msg: 'Complaint handling started.', sev: 'success' }));
    } catch (error) {
      notifyError(error, 'Unable to start handling.');
    }
  };

  const handleAddAction = async () => {
    if (!complaint || mutationPending) return;

    if (locked) {
      dispatch(notify({ msg: 'Reopen the complaint before adding actions.', sev: 'warning' }));
      return;
    }

    const description = actionDraft.description.trim();
    if (
      !description ||
      actionDraft.assignedUserId == null ||
      actionDraft.assignedUserId === '' ||
      !actionDraft.deadline
    ) {
      dispatch(
        notify({ msg: 'Action description, assignee, and deadline are required.', sev: 'warning' })
      );
      return;
    }

    try {
      await addAction({
        id: complaint.id,
        description,
        assignedUserId: Number(actionDraft.assignedUserId),
        deadline: dateInputToInstant(actionDraft.deadline, true)
      }).unwrap();
      setActionDraft(emptyActionDraft());
      dispatch(notify({ msg: 'Action added.', sev: 'success' }));
    } catch (error) {
      notifyError(error, 'Unable to add action.');
    }
  };

  const handleStartAction = async (actionId: number) => {
    if (!complaint || mutationPending) return;

    if (locked) {
      dispatch(notify({ msg: 'Reopen the complaint before changing actions.', sev: 'warning' }));
      return;
    }

    try {
      await startAction({ id: complaint.id, actionId }).unwrap();
      dispatch(notify({ msg: 'Action started.', sev: 'success' }));
    } catch (error) {
      notifyError(error, 'Unable to start action.');
    }
  };

  const handleCompleteAction = async () => {
    if (!complaint || !completeDraft || mutationPending) return;

    if (locked) {
      dispatch(notify({ msg: 'Reopen the complaint before completing actions.', sev: 'warning' }));
      return;
    }

    const result = completeDraft.result.trim();
    if (!result) {
      dispatch(notify({ msg: 'Enter a result describing what was done.', sev: 'warning' }));
      return;
    }

    try {
      await completeAction({
        id: complaint.id,
        actionId: completeDraft.actionId,
        result
      }).unwrap();
      setCompleteDraft(null);
      dispatch(notify({ msg: 'Action completed.', sev: 'success' }));
    } catch (error) {
      notifyError(error, 'Unable to complete action.');
    }
  };

  const handleResolve = async () => {
    if (!complaint || mutationPending) return;

    if (complaint.status === 'CLOSED') {
      dispatch(notify({ msg: 'Closed complaints must be reopened first.', sev: 'warning' }));
      return;
    }

    if (!complaint.assignedUserId) {
      dispatch(notify({ msg: 'Assign an owner before resolving.', sev: 'warning' }));
      return;
    }

    const summary = resolutionDraft.resolutionSummary.trim();
    if (!summary) {
      dispatch(notify({ msg: 'Enter a resolution summary.', sev: 'warning' }));
      return;
    }

    if (hasIncompleteActions(complaint)) {
      dispatch(notify({ msg: 'Complete all actions before resolving.', sev: 'warning' }));
      return;
    }

    try {
      await resolveComplaint({ id: complaint.id, resolutionSummary: summary }).unwrap();
      dispatch(notify({ msg: 'Complaint resolved.', sev: 'success' }));
    } catch (error) {
      notifyError(error, 'Unable to resolve complaint.');
    }
  };

  const handleCloseComplaint = async () => {
    if (!complaint || mutationPending) return;

    if (complaint.status !== 'RESOLVED') {
      dispatch(notify({ msg: 'Closing is available only after resolving.', sev: 'warning' }));
      return;
    }

    try {
      await closeComplaint(complaint.id).unwrap();
      dispatch(notify({ msg: 'Complaint closed.', sev: 'success' }));
    } catch (error) {
      notifyError(error, 'Unable to close complaint.');
    }
  };

  const handleReopen = async () => {
    if (!complaint || mutationPending) return;

    if (complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED') {
      dispatch(notify({ msg: 'Only resolved or closed complaints can be reopened.', sev: 'warning' }));
      return;
    }

    const reason = resolutionDraft.reopenReason.trim();
    if (!reason) {
      dispatch(notify({ msg: 'Enter a reason for reopening.', sev: 'warning' }));
      return;
    }

    try {
      await reopenComplaint({ id: complaint.id, reopenReason: reason }).unwrap();
      setResolutionDraft(prev => ({ ...prev, reopenReason: '' }));
      dispatch(notify({ msg: 'Complaint reopened.', sev: 'success' }));
    } catch (error) {
      notifyError(error, 'Unable to reopen complaint.');
    }
  };

  if (!open) {
    return null;
  }

  const detailsContent = (
    <ComplaintDetails
      complaint={complaint}
      detailFetching={detailFetching}
      detailError={detailError}
      overdue={overdue}
      mutationPending={mutationPending}
      fetchAttachmentDownloadUrl={fetchAttachmentDownloadUrl}
      notifyError={notifyError}
    />
  );

  const actionsContent = !complaint ? (
    detailsContent
  ) : (
    <ComplaintActions
      complaint={complaint}
      locked={locked}
      mutationPending={mutationPending}
      staffOptions={staffOptions}
      ownerDraft={ownerDraft}
      setOwnerDraft={setOwnerDraft}
      actionDraft={actionDraft}
      setActionDraft={setActionDraft}
      completeDraft={completeDraft}
      setCompleteDraft={setCompleteDraft}
      onAssignOwner={handleAssignOwner}
      onSetDeadline={handleSetDeadline}
      onStartHandling={handleStartHandling}
      onAddAction={handleAddAction}
      onStartAction={handleStartAction}
      onCompleteAction={handleCompleteAction}
    />
  );

  const resolutionContent = !complaint ? (
    detailsContent
  ) : (
    <ComplaintResolution
      complaint={complaint}
      mutationPending={mutationPending}
      resolutionDraft={resolutionDraft}
      setResolutionDraft={setResolutionDraft}
      onResolve={handleResolve}
      onCloseComplaint={handleCloseComplaint}
      onReopen={handleReopen}
    />
  );

  return (
    <MyModal
      open={open}
      setOpen={nextOpen => {
        if (!nextOpen) {
          setOwnerDraft(emptyOwnerDraft());
          setActionDraft(emptyActionDraft());
          setResolutionDraft(emptyResolutionDraft());
          setCompleteDraft(null);
          setActiveTab('1');
        }
        setOpen(nextOpen);
      }}
      title={
        <span>
          <Translate>Complaint Details</Translate>
          {complaint?.reference ? ` — ${complaint.reference}` : ''}
        </span>
      }
      size="85vw"
      bodyheight="72vh"
      hideActionBtn
      hideCancel={false}
      cancelButtonLabel="Close"
      content={
        <div className="patient-complaint-modal-body">
          {detailFetching && !complaint ? (
            <div className="patient-complaint-modal-section">
              <Loader content="Loading…" />
            </div>
          ) : (
            <MyTab
              appearance="tabs"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              data={[
                { title: 'Details', content: detailsContent },
                { title: 'Actions', content: actionsContent },
                { title: 'Resolution', content: resolutionContent }
              ]}
            />
          )}
        </div>
      }
    />
  );
};

export default ComplaintDetailModal;
