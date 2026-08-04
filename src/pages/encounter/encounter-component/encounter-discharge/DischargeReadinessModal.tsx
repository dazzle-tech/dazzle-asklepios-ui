import React, { useEffect } from 'react';
import { Loader } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import { useAssessDischargeReadinessMutation } from '@/services/ai-services/smartDischargePlannerService';
import './styles.less';

const READINESS_LABELS: Record<string, string> = {
  ready: 'Ready',
  needs_review: 'Needs Review',
  not_ready: 'Not Ready',
  unclear: 'Unclear'
};

const DischargeReadinessModal = ({ open, setOpen, encounterId }) => {
  const [
    assessDischargeReadiness,
    { data: readinessResult, isLoading: isAssessing, error: readinessError }
  ] = useAssessDischargeReadinessMutation();

  useEffect(() => {
    if (open && encounterId) {
      assessDischargeReadiness({ encounterId });
    }
  }, [open, encounterId]);

  const plan = readinessResult?.discharge_plan;

  const content = (
    <div className="discharge-readiness-modal-body">
      {isAssessing && (
        <div className="discharge-report-loading">
          <Loader size="md" content="Assessing discharge readiness..." vertical />
        </div>
      )}

      {!isAssessing && readinessError && (
        <div className="discharge-report-error">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <span>Unable to assess discharge readiness</span>
        </div>
      )}

      {!isAssessing && plan && (
        <>
          <div className="discharge-report-meta">
            <span className={`readiness-status readiness-status-${plan.readiness_status}`}>
              {READINESS_LABELS[plan.readiness_status] || plan.readiness_status}
            </span>
          </div>

          <p className="discharge-report-fulltext">{plan.readiness_reason}</p>

          {plan.blockers?.length > 0 && (
            <div className="qa-group">
              <h5>Blockers</h5>
              {plan.blockers.map((blocker, index) => (
                <div className="qa-item" key={index}>
                  <span className="qa-item-id">{blocker.category}</span>
                  <p className="qa-item-field">
                    <b>{blocker.title}</b>
                  </p>
                  <p className="qa-item-field">{blocker.reason}</p>
                </div>
              ))}
            </div>
          )}

          {plan.medication_reconciliation_concerns?.length > 0 && (
            <div className="qa-group">
              <h5>Medication Reconciliation Concerns</h5>
              {plan.medication_reconciliation_concerns.map((concern, index) => (
                <p className="qa-item-field" key={index}>
                  {concern}
                </p>
              ))}
            </div>
          )}

          {plan.follow_up_considerations?.length > 0 && (
            <div className="qa-group">
              <h5>Follow-Up Considerations</h5>
              {plan.follow_up_considerations.map((item, index) => (
                <p className="qa-item-field" key={index}>
                  {item}
                </p>
              ))}
            </div>
          )}

          <div className="qa-group">
            <h5>Draft Discharge Summary</h5>
            <p className="discharge-report-fulltext">{plan.draft_discharge_summary}</p>
          </div>

          <div className="discharge-report-disclaimer">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            <span>{plan.disclaimer}</span>
          </div>
        </>
      )}
    </div>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Discharge Readiness Check"
      icon={faClipboardCheck}
      position="center"
      size="45vw"
      bodyheight="65vh"
      hideActionBtn
      cancelButtonLabel="Close"
      content={content}
    />
  );
};

export default DischargeReadinessModal;
