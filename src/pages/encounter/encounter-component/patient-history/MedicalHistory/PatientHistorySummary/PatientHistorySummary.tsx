// PatientHistorySummary.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '@/components/SectionsoContainer';

const PatientHistorySummary = ({ patient, encounter, edit }) => {
  return (
     <div className="medical-container-div">
    <SectionContainer
      title={
        <div className="patient-history-title">
          <FontAwesomeIcon icon={faClipboardList} className="patient-history-icon" />
          <span>Patient History Summary</span>
        </div>
      }
      content={
        <div className="medical-table-div2">
          <div className="patient-history-card">
            <div className="patient-history-blue-line"></div>
            <div className="patient-history-content">
              <div className="patient-history-text">
                A 56-year-old male with a history of type 2 diabetes mellitus (diagnosed 2015,
                managed with oral hypoglycemics), hypertension, and hyperlipidemia. Surgical history
                includes coronary artery bypass grafting (2018) and cholecystectomy (2009). He has a
                documented allergy to penicillin (rash) and shellfish (anaphylaxis). Family history
                is significant for ischemic heart disease in his father and type 2 diabetes in his
                mother. Social history: non-smoker, occasional alcohol consumption, retired
                accountant, lives with spouse.
              </div>
            </div>
          </div>
        </div>
      }
    />
    </div>
  );
};

export default PatientHistorySummary;
