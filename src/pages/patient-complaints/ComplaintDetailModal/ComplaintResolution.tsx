import React from 'react';
import { Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import type { PatientComplaintDetail } from '../constants';
import type { ResolutionDraft } from './types';

type ComplaintResolutionProps = {
  complaint: PatientComplaintDetail;
  mutationPending: boolean;
  resolutionDraft: ResolutionDraft;
  setResolutionDraft: (next: ResolutionDraft) => void;
  onResolve: () => void;
  onCloseComplaint: () => void;
  onReopen: () => void;
};

const ComplaintResolution = ({
  complaint,
  mutationPending,
  resolutionDraft,
  setResolutionDraft,
  onResolve,
  onCloseComplaint,
  onReopen
}: ComplaintResolutionProps) => (
  <div className="patient-complaint-modal-section">
    <div className="patient-complaint-action-panel">
      <div className="patient-complaint-panel-title">
        <Translate>Resolution</Translate>
      </div>
      <Form fluid>
        <MyInput
          fieldType="textarea"
          fieldName="resolutionSummary"
          fieldLabel="Resolution Summary"
          record={resolutionDraft}
          setRecord={setResolutionDraft}
          disabled={complaint.status === 'CLOSED' || mutationPending}
          width="100%"
          rows={5}
          height={130}
        />
      </Form>
      <div className="patient-complaint-inline-actions">
        <MyButton
          appearance="primary"
          disabled={
            mutationPending ||
            complaint.status === 'RESOLVED' ||
            complaint.status === 'CLOSED'
          }
          onClick={onResolve}
        >
          <Translate>Resolve Complaint</Translate>
        </MyButton>
        <MyButton
          appearance="ghost"
          disabled={mutationPending || complaint.status !== 'RESOLVED'}
          onClick={onCloseComplaint}
        >
          <Translate>Close Complaint</Translate>
        </MyButton>
      </div>
    </div>

    <div className="patient-complaint-action-panel">
      <div className="patient-complaint-panel-title">
        <Translate>Reopen</Translate>
      </div>
      <Form fluid>
        <MyInput
          fieldType="textarea"
          fieldName="reopenReason"
          fieldLabel="Reopen Reason"
          record={resolutionDraft}
          setRecord={setResolutionDraft}
          disabled={
            mutationPending ||
            (complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED')
          }
          width="100%"
          rows={3}
          height={90}
        />
      </Form>
      <div className="patient-complaint-inline-actions">
        <MyButton
          appearance="ghost"
          color="var(--primary-orange, #f59e0b)"
          disabled={
            mutationPending ||
            (complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED')
          }
          onClick={onReopen}
        >
          <Translate>Reopen Complaint</Translate>
        </MyButton>
      </div>
    </div>
  </div>
);

export default ComplaintResolution;
