//Declares

import React from 'react';
import { Tabs } from 'rsuite';
import InformationDesk from './information-desk/InformationDesk';
import CancelledAdmissions from './cancelled-admissions/CancelledAdmissions';
import DischargedPatients from './discharged-patients/DischargedPatients';


const FacilityPatientList = () => {
  return (
      <Tabs appearance="subtle" className="doctor-round-tabs" defaultActiveKey="1">
        <Tabs.Tab eventKey="1" title="Information Desk">
          <InformationDesk />
        </Tabs.Tab>
        <Tabs.Tab eventKey="2" title="Cancelled Admissions">
          <CancelledAdmissions></CancelledAdmissions>
        </Tabs.Tab>
                <Tabs.Tab eventKey="3" title="Discharged Patients">
          <DischargedPatients></DischargedPatients>
        </Tabs.Tab>
      </Tabs>
  );
};
export default FacilityPatientList;
