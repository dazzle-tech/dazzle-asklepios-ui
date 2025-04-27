import React from 'react';
import TreadmillStress from '../treadm-stress/TreadmillStress';
import ChiefComplaintSymptoms from '../chief_complaint_symptoms/ChiefComplaintSymptoms';
import ElectrocardiogramECG from '../electrocardiogram-ecg/ElectrocardiogramECG';
import { Tabs } from 'rsuite';
const Cardiology = ({ patient, encounter }) => {
    return (
        <Tabs defaultActiveKey="1" appearance="subtle" >
            <Tabs.Tab eventKey="1" title="Chief Complaint & Symptoms">
                <ChiefComplaintSymptoms patient={patient} encounter={encounter} />
            </Tabs.Tab>
            <Tabs.Tab eventKey="2" title="Treadmill Stress Test (TMST)">
                <TreadmillStress patient={patient} encounter={encounter} />
            </Tabs.Tab>
            <Tabs.Tab eventKey="3" title="Electrocardiography (ECG)">
                <ElectrocardiogramECG patient={patient} encounter={encounter} />
            </Tabs.Tab>
        </Tabs>
    );
};
export default Cardiology;