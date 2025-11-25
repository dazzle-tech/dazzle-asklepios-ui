//Declares

import React from 'react';
import InformationDesk from './information-desk/InformationDesk';
import CancelledAdmissions from './cancelled-admissions/CancelledAdmissions';
import DischargedPatients from './discharged-patients/DischargedPatients';
import DetailsCard from '@/components/DetailsCard';
import {
  faBed,
  faPersonShelter,
  faStethoscope,
  faExplosion
} from '@fortawesome/free-solid-svg-icons';
import MyTab from '@/components/MyTab';

const FacilityPatientList = () => {
  const tabData = [
    {title: "Information Desk", content: <InformationDesk />},
    {title: "Cancelled Admissions", content: <CancelledAdmissions></CancelledAdmissions>},
    {title: "Discharged Patients", content: <DischargedPatients></DischargedPatients>}
  ];
  return (
    <>
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
      <MyTab 
       data={tabData}
      />
    </>
  );
};
export default FacilityPatientList;
