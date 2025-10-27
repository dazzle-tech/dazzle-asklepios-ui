import { useGetCustomeInstructionsQuery } from '@/services/encounterService';
import { useGetGenericMedicationQuery } from '@/services/medicationsSetupService';
import { initialListRequest } from '@/types/types';
import React from 'react';
import './styles.less';

import DrugOrder from './DrugOrder';
import PatientChronic from './PatientChronic';
import Prescriptions from './Prescriptions';
import { useLocation } from 'react-router-dom';
import MyTab from '@/components/MyTab';
const MedicationsRecord = () => {
  const location = useLocation();
  const { patient} = location.state || {};
  const { data: genericMedicationListResponse } = useGetGenericMedicationQuery({
    ...initialListRequest
  });
  const {
    data: customeInstructions,
  } = useGetCustomeInstructionsQuery({
    ...initialListRequest
  });

  const tabData = [
    {
      title: 'Prescriptions',
      content: (
        <Prescriptions
          genericMedicationListResponse={genericMedicationListResponse?.object}
          customeInstructions={customeInstructions?.object}
          patient={patient}
        />
      )
    },
    {
      title: 'Drug Orders',
      content: (
        <DrugOrder
          genericMedicationListResponse={genericMedicationListResponse?.object}
          patient={patient}
        />
      )
    },
    {
      title: 'Patient’s Chronic Medications',
      content: (
        <PatientChronic
          genericMedicationListResponse={genericMedicationListResponse?.object}
          patient={patient}
          customeInstructions={customeInstructions?.object}
        />
      )
    }
  ];

  return (
      <MyTab data={tabData} />
  );
};
export default MedicationsRecord;
