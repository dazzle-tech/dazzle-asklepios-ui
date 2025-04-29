import React from 'react';
import PatientProblems from '@/pages/encounter/encounter-component/patient-history/MedicalHistory/PatientProblems/PatientProblems';
import FamilyHistory from './FamilyHistory';
import Hospitalizations from './Hospitalizations';
import BloodTransfusion from './BloodTransfusion/BloodTransfusion';
const MedicalHistory = ({ patient, encounter }) => {
    return (
        <div className='medical-main-container'>
           <PatientProblems patient={patient} encounter={encounter}/>
           <FamilyHistory patient={patient} encounter={encounter}/>
           <Hospitalizations patient={patient} encounter={encounter}/>
           <BloodTransfusion patient={patient} encounter={encounter}/>
        </div>
    );
};
export default MedicalHistory;