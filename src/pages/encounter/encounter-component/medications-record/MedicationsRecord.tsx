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
import UCCMedications from './UCCMedications/UCCMedications';
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
          // genericMedicationListResponse={genericMedicationListResponse?.object}
          patient={patient}
        />
      )
    },
    {
      title: 'UCC Medications',
      content: (
        <UCCMedications
          patient={patient}
        />
      )
    },
    // don't remove these comments - they are for future features
    // {
    //   title: 'Drug Orders',
    //   content: (
    //     <DrugOrder
    //       genericMedicationListResponse={genericMedicationListResponse?.object}
    //       patient={patient}
    //     />
    //   )
    // },
    // {
    //   title: 'Patient’s Chronic Medications',
    //   content: (
    //     <PatientChronic
    //       genericMedicationListResponse={genericMedicationListResponse?.object}
    //       patient={patient}
    //       customeInstructions={customeInstructions?.object}
    //     />
    //   )
    // }
  ];

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyTab
    lazy
      data={tabData.map(tab => ({
        ...tab,
        content: <div dir={dir}>{tab.content}</div>
      }))}
    />
  );
};
export default MedicationsRecord;
