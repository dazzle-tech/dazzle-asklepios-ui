import React from 'react';
import TreadmillStress from '../treadm-stress/TreadmillStress';
import ChiefComplaintSymptoms from '../chief_complaint_symptoms/ChiefComplaintSymptoms';
import ElectrocardiogramECG from '../electrocardiogram-ecg/ElectrocardiogramECG';
import EchoDopplerTest from './echo-doppler-test/EchoDopplerTest';
import { useLocation } from 'react-router-dom';
import MyTab from '@/components/MyTab';
const Cardiology = () => {
    const location = useLocation();
    const { patient, encounter, edit } = location.state || {};
 
    const tabData = [
      {title: "Chief Complaint & Symptoms", content: <ChiefComplaintSymptoms patient={patient} encounter={encounter} edit={edit} />},
      {title: "Treadmill Stress Test (TMST)", content: <TreadmillStress patient={patient} encounter={encounter} edit={edit} />},
      {title: "Electrocardiography (ECG)", content: <ElectrocardiogramECG patient={patient} encounter={encounter} edit={edit} />},
      {title: "Echo Doppler Test", content: <EchoDopplerTest patient={patient} encounter={encounter} edit={edit} />},
    ];

    return (
       <MyTab 
        data={tabData}
       />
    );
};
export default Cardiology;