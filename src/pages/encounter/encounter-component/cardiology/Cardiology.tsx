import React, { useEffect, useState } from 'react';
import {
    Panel,
} from 'rsuite';
import TreadmillStress from '../treadm-stress/TreadmillStress';

const Cardiology = ({ patient, encounter }) => {
    
    return (
        <Panel header={"Cardiology"}>
            <Panel header={"Chief Complaint & Symptoms"} collapsible bordered>   
            </Panel>
            <Panel header={"Treadmill Stress Test (TMST)"} collapsible bordered>
             <TreadmillStress patient={patient} encounter={encounter}/>     
            </Panel>
            <Panel header={"Electrocardiography (ECG)"} collapsible bordered>      
            </Panel>
            <Panel header={"Echocardiography (ECHO)"} collapsible bordered>  
            </Panel>
            <Panel header={"Ambulatory Blood Pressure Monitoring (ABPM)"} collapsible bordered>
            </Panel>
            <Panel header={"Holter Monitoring"} collapsible bordered>      
            </Panel>
            <Panel header={"Cardiovascular Risk Factors"} collapsible bordered>  
            </Panel>
            <Panel header={"Cardiac Biomarkers"} collapsible bordered>
            </Panel>
            <Panel header={"Diagnosis & Treatment Plan"} collapsible bordered>
            </Panel>
        </Panel>
    );
};
export default Cardiology;