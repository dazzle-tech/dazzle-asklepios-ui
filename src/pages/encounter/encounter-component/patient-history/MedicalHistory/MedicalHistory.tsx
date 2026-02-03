import React from 'react';
import PatientProblems from '@/pages/encounter/encounter-component/patient-history/MedicalHistory/PatientProblems/PatientProblems';
import FamilyHistory from './FamilyHistory';
import Hospitalizations from './Hospitalizations';
// import BloodTransfusion from './BloodTransfusion/BloodTransfusion';
// import PatientHistorySummary from './PatientHistorySummary/PatientHistorySummary';
const MedicalHistory = ({ patient, encounter, edit, toShowData }) => {
  return (
    <div className="medical-main-container">
      {/* <PatientHistorySummary patient={patient} encounter={encounter} edit={edit} /> */}
      <PatientProblems
        patient={patient}
        encounter={encounter}
        edit={edit}
        toShowData={toShowData}
      />
      <FamilyHistory patient={patient} encounter={encounter} edit={edit} toShowData={toShowData} />
      <Hospitalizations
        patient={patient}
        encounter={encounter}
        edit={edit}
        toShowData={toShowData}
      />
      {/* <BloodTransfusion patient={patient} encounter={encounter} edit={edit} /> */}
    </div>
  );
};
export default MedicalHistory;