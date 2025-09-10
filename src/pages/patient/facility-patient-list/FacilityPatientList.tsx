//Declares

import React from 'react';
import { Tabs } from 'rsuite';
import InformationDesk from './information-desk/InformationDesk';
import CancelledAdmissions from './cancelled-admissions/CancelledAdmissions';
import DischargedPatients from './discharged-patients/DischargedPatients';
import DetailsCard from '@/components/DetailsCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBed,
  faPersonShelter,
  faStethoscope,
  faExplosion} from '@fortawesome/free-solid-svg-icons';

const FacilityPatientList = () => {
  return (<>
    <div className="count-div-on-top-of-page">
      <DetailsCard
        title="Inpatient"
        number={2}
        icon={faBed}
        color="--green-600"
        backgroundClassName="result-ready-section"
        width={'20vw'}
        />
      <DetailsCard
        title="DayCase"
        number={2}
        icon={faPersonShelter}
        color="--primary-purple"
        backgroundClassName="sample-collected-section"
        width={'20vw'}
      />
      <DetailsCard
        title="Clinics"
        number={2}
        icon={faStethoscope}
        color="--primary-blue"
        backgroundClassName="new-section"
        width={'20vw'}
      />
      <DetailsCard
        title="Emergency"
        number={2}
        icon={faExplosion}
        color="--gray-dark"
        backgroundClassName="total-test-section"
        width={'20vw'}
      />
    </div>
        
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
  </>);
};
export default FacilityPatientList;
