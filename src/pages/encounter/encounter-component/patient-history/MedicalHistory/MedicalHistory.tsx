import React from 'react';
import PatientProblems from '@/pages/encounter/encounter-component/patient-history/MedicalHistory/PatientProblems/PatientProblems';
import FamilyHistory from './FamilyHistory';
import Hospitalizations from './Hospitalizations';
import BloodTransfusion from './BloodTransfusion/BloodTransfusion';
const MedicalHistory = ({ patient, encounter,edit }) => {
    return (
        <div className='medical-main-container'>
           <PatientProblems patient={patient} encounter={encounter} edit={edit}/>
           <FamilyHistory patient={patient} encounter={encounter} edit={edit}/>
           <Hospitalizations patient={patient} encounter={encounter} edit={edit}/>
           <BloodTransfusion patient={patient} encounter={encounter} edit={edit}/>
        </div>
    );
};
export default MedicalHistory;