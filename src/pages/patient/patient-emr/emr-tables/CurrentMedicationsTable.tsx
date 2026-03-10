import MyTab from '@/components/MyTab';
import Prescriptions from '@/pages/encounter/encounter-component/medications-record/Prescriptions';
import { useGetCustomeInstructionsQuery } from '@/services/encounterService';
import { useGetGenericMedicationQuery } from '@/services/medicationsSetupService';
import { initialListRequest } from '@/types/types';
import React from 'react';

interface Props {
  patient: any;
}

const MedicationsRecord: React.FC<Props> = ({ patient }) => {
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
  ];

  return (
      <MyTab data={tabData} />
  );
};
export default MedicationsRecord;
