import React from 'react';
import PatientProblems from '@/pages/encounter/encounter-component/patient-history/MedicalHistory/PatientProblems/PatientProblems';
import FamilyHistory from './FamilyHistory';
import Hospitalizations from './Hospitalizations';
import CurrentMedication from './CurrentMedication/CurrentMedication';
// import BloodTransfusion from './BloodTransfusion/BloodTransfusion';
// import PatientHistorySummary from './PatientHistorySummary/PatientHistorySummary';

const MedicalHistory = ({
  patient,
  encounter,
  edit,
  toShowData,
  showFreeText = false
}) => {
    // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div className="medical-main-container" dir={dir}>
      {/* <PatientHistorySummary patient={patient} encounter={encounter} edit={edit} /> */}
      <PatientProblems
        patient={patient}
        encounter={encounter}
        edit={edit}
        toShowData={toShowData}
        showFreeText={showFreeText}
      />
      <FamilyHistory
        patient={patient}
        encounter={encounter}
        edit={edit}
        toShowData={toShowData}
        showFreeText={showFreeText}
      />
      <Hospitalizations
        patient={patient}
        encounter={encounter}
        edit={edit}
        toShowData={toShowData}
        showFreeText={showFreeText}
      />
      <CurrentMedication
        patient={patient}
        edit={edit}
        toShowData={toShowData}
        showFreeText={showFreeText}
      />
      {/* <BloodTransfusion patient={patient} encounter={encounter} edit={edit} /> */}
    </div>
  );
};

export default MedicalHistory;
