import React, { useEffect, useState } from 'react';
import { Loader } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileMedical, faTriangleExclamation, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import { useLazyGenerateDischargeReportQuery } from '@/services/ai-services/dischargeReportService';
import QualityCheckModal from './QualityCheckModal';
import './styles.less';

const DischargeReportModal = ({ open, setOpen, encounterId }) => {
  const [
    generateDischargeReport,
    { data: dischargeReport, isFetching: isGeneratingReport, error: dischargeReportError }
  ] = useLazyGenerateDischargeReportQuery();

  const [openQualityCheckModal, setOpenQualityCheckModal] = useState(false);

  useEffect(() => {
    if (open && encounterId) {
      generateDischargeReport({ encounterId });
    }
  }, [open, encounterId]);

  const content = (
    <div className="discharge-report-modal-body">
      {isGeneratingReport && (
        <div className="discharge-report-loading">
          <Loader size="md" content="Generating discharge report..." vertical />
        </div>
      )}

      {!isGeneratingReport && dischargeReportError && (
        <div className="discharge-report-error">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <span>Unable to generate discharge report</span>
        </div>
      )}

      {!isGeneratingReport && dischargeReport && (
        <>
          <div className="discharge-report-meta">
            {typeof dischargeReport.confidence_score === 'number' && (
              <span className="discharge-report-confidence">
                Confidence: {Math.round(dischargeReport.confidence_score * 100)}%
              </span>
            )}
            {dischargeReport.generation_mode && (
              <span className="discharge-report-mode">{dischargeReport.generation_mode}</span>
            )}
          </div>

          {dischargeReport.requires_physician_review && dischargeReport.disclaimer && (
            <div className="discharge-report-disclaimer">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <span>{dischargeReport.disclaimer}</span>
            </div>
          )}

          {dischargeReport.report_sections?.length > 0 ? (
            dischargeReport.report_sections.map((section, index) => (
              <div className="discharge-report-card" key={index}>
                <div className="discharge-report-card-header">
                  <span className="discharge-report-card-title">{section.section_name}</span>
                  {typeof section.confidence === 'number' && (
                    <span className="discharge-report-card-confidence">
                      {Math.round(section.confidence * 100)}%
                    </span>
                  )}
                </div>
                <p className="discharge-report-card-content">{section.content}</p>
              </div>
            ))
          ) : (
            <p className="discharge-report-fulltext">{dischargeReport.full_report_text}</p>
          )}

          <div className="discharge-report-qa-section">
            <MyButton
              disabled={!dischargeReport.full_report_text}
              prefixIcon={() => <FontAwesomeIcon icon={faShieldHalved} />}
              onClick={() => setOpenQualityCheckModal(true)}
              appearance="ghost"
            >
              Run Quality Check
            </MyButton>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title="AI Discharge Report"
        icon={faFileMedical}
        position="center"
        size="45vw"
        bodyheight="65vh"
        hideActionBtn
        cancelButtonLabel="Close"
        content={content}
      />

      <QualityCheckModal
        open={openQualityCheckModal}
        setOpen={setOpenQualityCheckModal}
        encounterId={encounterId}
        dischargeReportText={dischargeReport?.full_report_text}
      />
    </>
  );
};

export default DischargeReportModal;
