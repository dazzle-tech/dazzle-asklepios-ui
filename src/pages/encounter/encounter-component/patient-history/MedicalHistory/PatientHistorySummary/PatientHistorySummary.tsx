// PatientHistorySummary.js
import React from 'react';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import SectionSummary from './SectionSummary';

const PatientHistorySummary = ({ patient, encounter, edit }) => {
  return (
    <SectionSummary
      title="Patient History Summary"
      content="A 56-year-old male with a history of type 2 diabetes mellitus (diagnosed 2015, managed with oral hypoglycemics), hypertension, and hyperlipidemia. Surgical history includes coronary artery bypass grafting (2018) and cholecystectomy (2009). He has a documented allergy to penicillin (rash) and shellfish (anaphylaxis). Family history is significant for ischemic heart disease in his father and type 2 diabetes in his mother. Social history: non-smoker, occasional alcohol consumption, retired accountant, lives with spouse."
      icon={faClipboardList}
    />
  );
};

export default PatientHistorySummary;
