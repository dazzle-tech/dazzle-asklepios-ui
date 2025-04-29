import React from 'react';
import { Table, Tabs} from 'rsuite';
import MedicalHistory from './MedicalHistory/MedicalHistory';
import FamilyHistory from './MedicalHistory/FamilyHistory';
import { SubTitle } from 'chart.js';
import SurgicalHistory from './SurgicalHistory';
const { Column, HeaderCell, Cell } = Table;
const PatientHistory =({patient,encounter})=>{
  return(

    <Tabs defaultActiveKey="1" appearance="subtle" className="tab-container">
     <Tabs.Tab eventKey="1" title="Medical History"  ><MedicalHistory patient={patient} encounter={encounter}/></Tabs.Tab>
     <Tabs.Tab eventKey="2" title="Surgical History" ><SurgicalHistory patient={patient} encounter={encounter}/></Tabs.Tab>
     <Tabs.Tab eventKey="3" title="Family History" >3</Tabs.Tab>
    </Tabs>
);
};
export default PatientHistory;