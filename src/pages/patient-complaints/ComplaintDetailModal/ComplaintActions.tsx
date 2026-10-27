import React from 'react';
import { Form } from 'rsuite';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import {
  formatDisplayDate,
  getStatusColor,
  type PatientComplaintDetail
} from '../constants';
import type {
  ActionDraft,
  CompleteDraft,
  OwnerDraft,
  StaffOption
} from './types';

type ComplaintActionsProps = {
  complaint: PatientComplaintDetail;
  locked: boolean;
  mutationPending: boolean;
  staffOptions: StaffOption[];
  ownerDraft: OwnerDraft;
  setOwnerDraft: (next: OwnerDraft) => void;
  actionDraft: ActionDraft;
  setActionDraft: (next: ActionDraft) => void;
  completeDraft: CompleteDraft | null;
  setCompleteDraft: (next: CompleteDraft | null) => void;
  onAssignOwner: () => void;
  onSetDeadline: () => void;
  onStartHandling: () => void;
  onAddAction: () => void;
  onStartAction: (actionId: number) => void;
  onCompleteAction: () => void;
};

const ComplaintActions = ({
  complaint,
  locked,
  mutationPending,
  staffOptions,
  ownerDraft,
  setOwnerDraft,
  actionDraft,
  setActionDraft,
  completeDraft,
  setCompleteDraft,
  onAssignOwner,
  onSetDeadline,
  onStartHandling,
  onAddAction,
  onStartAction,
  onCompleteAction
}: ComplaintActionsProps) => (
  <div className="patient-complaint-modal-section">
    {locked ? (
      <div className="patient-complaint-locked-note">
        <Translate>
          Resolved or closed complaints must be reopened before actions can be changed.
        </Translate>
      </div>
    ) : null}

    <div className="patient-complaint-action-panel">
      <div className="patient-complaint-panel-title">
        <Translate>Assignment & Deadline</Translate>
      </div>
      <Form fluid>
        <div className="patient-complaint-form-row">
          <MyInput
            fieldType="select"
            fieldName="assignedUserId"
            fieldLabel="Assigned User"
            record={ownerDraft}
            setRecord={setOwnerDraft}
            selectData={staffOptions}
            selectDataLabel="label"
            selectDataValue="value"
            searchable
            disabled={locked || mutationPending}
            width="100%"
          />
          <MyInput
            fieldType="date"
            fieldName="targetDeadline"
            fieldLabel="Target Deadline"
            record={ownerDraft}
            setRecord={setOwnerDraft}
            disabled={locked || mutationPending}
            width="100%"
          />
        </div>
      </Form>
      <div className="patient-complaint-inline-actions">
        <MyButton
          appearance="ghost"
          disabled={locked || mutationPending}
          onClick={onAssignOwner}
        >
          <Translate>Assign / Reassign Owner</Translate>
        </MyButton>
        <MyButton
          appearance="ghost"
          disabled={locked || mutationPending}
          onClick={onSetDeadline}
        >
          <Translate>Set Deadline</Translate>
        </MyButton>
        <MyButton
          appearance="primary"
          disabled={locked || mutationPending || complaint.status !== 'NEW'}
          onClick={onStartHandling}
        >
          <Translate>Start Handling</Translate>
        </MyButton>
      </div>
    </div>

    <div className="patient-complaint-action-panel">
      <div className="patient-complaint-panel-title">
        <Translate>Action Tasks</Translate>
      </div>

      {(complaint.actions ?? []).length === 0 ? (
        <div className="patient-complaint-empty-actions">
          <Translate>No actions yet.</Translate>
        </div>
      ) : (
        <div className="patient-complaint-action-list">
          {complaint.actions.map(action => (
            <div key={action.id} className="patient-complaint-action-item">
              <div className="patient-complaint-action-item-top">
                <div>
                  <div className="patient-complaint-action-description">{action.description}</div>
                  <div className="patient-complaint-action-meta">
                    <Translate>Assigned To</Translate>: {action.assignedUserName} ·{' '}
                    <Translate>Deadline</Translate>: {formatDisplayDate(action.deadline)}
                  </div>
                </div>
                <MyBadgeStatus contant={action.status} color={getStatusColor(action.status)} />
              </div>

              {action.status === 'DONE' ? (
                <div className="patient-complaint-action-result">
                  <div>
                    <strong>
                      <Translate>Result</Translate>:
                    </strong>{' '}
                    {action.result}
                  </div>
                  <div>
                    <Translate>Completed By</Translate>: {action.completedBy || '-'} ·{' '}
                    {formatDisplayDate(action.completedAt)}
                  </div>
                </div>
              ) : null}

              {!locked && (action.status === 'TO_DO' || action.status === 'IN_PROGRESS') ? (
                <>
                  <div
                    className="patient-complaint-inline-actions"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    {action.status === 'TO_DO' ? (
                      <MyButton
                        appearance="ghost"
                        size="md"
                        disabled={mutationPending}
                        onClick={() => onStartAction(action.id)}
                      >
                        <Translate>Start Action</Translate>
                      </MyButton>
                    ) : null}

                    {completeDraft?.actionId !== action.id ? (
                      <MyButton
                        appearance="ghost"
                        size="md"
                        disabled={mutationPending}
                        onClick={() => setCompleteDraft({ actionId: action.id, result: '' })}
                      >
                        <Translate>Complete Action</Translate>
                      </MyButton>
                    ) : null}
                  </div>

                  {completeDraft?.actionId === action.id ? (
                    <div className="patient-complaint-complete-box">
                      <Form fluid>
                        <MyInput
                          fieldType="textarea"
                          fieldName="result"
                          fieldLabel="Result"
                          record={completeDraft}
                          setRecord={next => setCompleteDraft(next as CompleteDraft)}
                          required
                          width="100%"
                          rows={3}
                          height={90}
                        />
                      </Form>

                      <div className="patient-complaint-inline-actions">
                        <MyButton
                          appearance="ghost"
                          size="md"
                          disabled={mutationPending}
                          onClick={() => setCompleteDraft(null)}
                        >
                          <Translate>Cancel</Translate>
                        </MyButton>

                        <MyButton
                          appearance="primary"
                          size="md"
                          disabled={mutationPending}
                          onClick={onCompleteAction}
                        >
                          <Translate>Complete Action</Translate>
                        </MyButton>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}

            </div>
          ))}
        </div>
      )}
    </div>

    <div className="patient-complaint-action-panel">
      <div className="patient-complaint-panel-title">
        <Translate>Add Action</Translate>
      </div>
      <Form fluid>
        <div className="patient-complaint-form-full">
          <MyInput
            fieldType="textarea"
            fieldName="description"
            fieldLabel="Description"
            record={actionDraft}
            setRecord={setActionDraft}
            disabled={locked || mutationPending}
            width="100%"
            rows={3}
            height={90}
          />
        </div>
        <div className="patient-complaint-form-row">
          <MyInput
            fieldType="select"
            fieldName="assignedUserId"
            fieldLabel="Assigned User"
            record={actionDraft}
            setRecord={setActionDraft}
            selectData={staffOptions}
            selectDataLabel="label"
            selectDataValue="value"
            searchable
            disabled={locked || mutationPending}
            width="100%"
          />
          <MyInput
            fieldType="date"
            fieldName="deadline"
            fieldLabel="Deadline"
            record={actionDraft}
            setRecord={setActionDraft}
            disabled={locked || mutationPending}
            width="100%"
          />
        </div>
      </Form>
      <div className="patient-complaint-inline-actions">
        <MyButton
          appearance="primary"
          disabled={locked || mutationPending}
          onClick={onAddAction}
        >
          <Translate>Add Action</Translate>
        </MyButton>
      </div>
    </div>
  </div>
);

export default ComplaintActions;
