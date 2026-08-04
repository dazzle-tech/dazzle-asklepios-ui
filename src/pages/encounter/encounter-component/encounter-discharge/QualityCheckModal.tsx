import React, { useEffect } from 'react';
import { Loader } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import { useRunDischargeReportQualityCheckMutation } from '@/services/ai-services/qualityDischargeReportService';
import './styles.less';

const QualityCheckModal = ({ open, setOpen, encounterId, dischargeReportText }) => {
  const [
    runQualityCheck,
    { data: qaResult, isLoading: isRunningQualityCheck, error: qaError }
  ] = useRunDischargeReportQualityCheckMutation();

  useEffect(() => {
    if (open && encounterId && dischargeReportText) {
      runQualityCheck({ encounterId, dischargeReport: dischargeReportText });
    }
  }, [open, encounterId, dischargeReportText]);

  const renderQaItem = (item: Record<string, any>, fields: string[]) => (
    <div className="qa-item" key={item.id}>
      {item.id && <span className="qa-item-id">{item.id}</span>}
      {item.severity && <span className={`qa-item-severity qa-severity-${item.severity}`}>{item.severity}</span>}
      {fields.map(field =>
        item[field] ? (
          <p className="qa-item-field" key={field}>
            <strong>{field.replace(/_/g, ' ')}:</strong> {String(item[field])}
          </p>
        ) : null
      )}
    </div>
  );

  const content = (
    <div className="discharge-report-modal-body">
      {isRunningQualityCheck && (
        <div className="discharge-report-loading">
          <Loader size="md" content="Running quality check..." vertical />
        </div>
      )}

      {!isRunningQualityCheck && qaError && (
        <div className="discharge-report-error">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <span>Unable to run quality check</span>
        </div>
      )}

      {!isRunningQualityCheck && qaResult && (
        <div className="qa-results">
          <div className="discharge-report-meta">
            <span className="discharge-report-confidence">
              Quality Score: {Math.round(qaResult.overall_score)}/100
            </span>
          </div>
          {qaResult.summary && <p className="discharge-report-fulltext">{qaResult.summary}</p>}

          {qaResult.errors?.length > 0 && (
            <div className="qa-group">
              <h5>Errors</h5>
              {qaResult.errors.map(item => renderQaItem(item, ['issue', 'expected', 'observed', 'recommendation']))}
            </div>
          )}

          {qaResult.missing_items?.length > 0 && (
            <div className="qa-group">
              <h5>Missing Items</h5>
              {qaResult.missing_items.map(item => renderQaItem(item, ['section', 'field', 'why_required', 'recommendation']))}
            </div>
          )}

          {qaResult.inconsistencies?.length > 0 && (
            <div className="qa-group">
              <h5>Inconsistencies</h5>
              {qaResult.inconsistencies.map(item =>
                renderQaItem(item, ['section', 'field', 'report_value', 'source_value', 'recommendation'])
              )}
            </div>
          )}

          {qaResult.recommended_corrections?.length > 0 && (
            <div className="qa-group">
              <h5>Recommended Corrections</h5>
              {qaResult.recommended_corrections.map(item =>
                renderQaItem(item, ['section', 'field', 'suggested_text', 'rationale'])
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Discharge Report Quality Check"
      icon={faShieldHalved}
      position="center"
      size="45vw"
      bodyheight="65vh"
      hideActionBtn
      cancelButtonLabel="Close"
      content={content}
    />
  );
};

export default QualityCheckModal;
