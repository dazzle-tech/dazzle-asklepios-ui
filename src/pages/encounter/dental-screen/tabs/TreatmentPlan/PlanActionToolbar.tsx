import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClockRotateLeft,
  faPen,
  faPrint
} from '@fortawesome/free-solid-svg-icons';

import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';

export type PlanActionToolbarProps = {
  plan: any;
  /** Loaded treatment rows for the plan; preferred over summary count when present. */
  treatmentCount?: number;
  actionsDisabled?: boolean;
  onPrintPlan: () => void;
  onStatusHistory: () => void;
  onEditPlan: () => void;
  onPropose: () => void;
  onAccept: () => void;
  onReturnToDraft: () => void;
  onHold: () => void;
  onResume: () => void;
  onCancelPlan: () => void;
  className?: string;
};

const PlanActionToolbar: React.FC<PlanActionToolbarProps> = ({
  plan,
  treatmentCount,
  actionsDisabled = false,
  onPrintPlan,
  onStatusHistory,
  onEditPlan,
  onPropose,
  onAccept,
  onReturnToDraft,
  onHold,
  onResume,
  onCancelPlan,
  className
}) => {
  if (!plan) return null;

  const planClosed =
    plan.status === 'COMPLETED' || plan.status === 'CANCELLED';
  const planOnHold = plan.status === 'ON_HOLD';
  const planExecutable =
    plan.status === 'ACCEPTED' || plan.status === 'IN_PROGRESS';
  const planEditableHeader =
    plan.status === 'DRAFT' || plan.status === 'PROPOSED';
  const resolvedTreatmentCount =
    treatmentCount != null
      ? treatmentCount
      : Number(plan.activeTreatments ?? 0);
  const hasNoTreatments = resolvedTreatmentCount < 1;

  return (
    <div className={className || 'ap-plan-toolbar'}>
      <div className="ap-document-actions">
        <MyButton
          appearance="ghost"
          prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}
          onClick={onPrintPlan}
        >
          <Translate>Print Plan</Translate>
        </MyButton>

        <MyButton
          appearance="ghost"
          prefixIcon={() => <FontAwesomeIcon icon={faClockRotateLeft} />}
          onClick={onStatusHistory}
        >
          <Translate>Status History</Translate>
        </MyButton>
      </div>

      <div className="ap-plan-actions">
        {planEditableHeader && (
          <MyButton
            appearance="ghost"
            prefixIcon={() => <FontAwesomeIcon icon={faPen} />}
            onClick={onEditPlan}
            disabled={actionsDisabled}
          >
            <Translate>Edit Plan</Translate>
          </MyButton>
        )}

        {plan.status === 'DRAFT' && (
          <MyButton
            disabled={actionsDisabled || hasNoTreatments}
            onClick={onPropose}
          >
            <Translate>Propose</Translate>
          </MyButton>
        )}

        {plan.status === 'PROPOSED' && (
          <>
            <MyButton
              disabled={actionsDisabled || hasNoTreatments}
              onClick={onAccept}
            >
              <Translate>Accept</Translate>
            </MyButton>

            <MyButton
              appearance="ghost"
              disabled={actionsDisabled}
              onClick={onReturnToDraft}
            >
              <Translate>Return to Draft</Translate>
            </MyButton>
          </>
        )}

        {planExecutable && (
          <MyButton
            appearance="ghost"
            disabled={actionsDisabled}
            onClick={onHold}
          >
            <Translate>On Hold</Translate>
          </MyButton>
        )}

        {planOnHold && (
          <MyButton disabled={actionsDisabled} onClick={onResume}>
            <Translate>Resume</Translate>
          </MyButton>
        )}

        {!planClosed && (
          <span className="ap-cancel-plan">
            <MyButton
              appearance="ghost"
              disabled={actionsDisabled}
              onClick={onCancelPlan}
            >
              <Translate>Cancel Plan</Translate>
            </MyButton>
          </span>
        )}
      </div>
    </div>
  );
};

export default PlanActionToolbar;
