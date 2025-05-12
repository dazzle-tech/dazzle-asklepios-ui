import React from 'react';
import {Tabs} from 'rsuite';
import MedicalHistory from './MedicalHistory/MedicalHistory';
import SurgicalHistory from './SurgicalHistory';
import SocialHistory from './SocialHistory';
const PatientHistory =({patient,encounter,edit})=>{
  return(

    <Tabs defaultActiveKey="1" appearance="subtle" className="tab-container">
     <Tabs.Tab eventKey="1" title="Medical History"  ><MedicalHistory patient={patient} encounter={encounter} edit={edit}/></Tabs.Tab>
     <Tabs.Tab eventKey="2" title="Surgical History" ><SurgicalHistory patient={patient} encounter={encounter} edit={edit}/></Tabs.Tab>
     <Tabs.Tab eventKey="3" title="Social History" ><SocialHistory patient={patient} encounter={encounter} edit={edit}/></Tabs.Tab>
    </Tabs>
);
};
export default PatientHistory;