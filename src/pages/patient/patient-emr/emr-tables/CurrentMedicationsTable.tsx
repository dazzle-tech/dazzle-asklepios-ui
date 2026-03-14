import MyTab from '@/components/MyTab';
import Prescriptions from '@/pages/encounter/encounter-component/medications-record/Prescriptions';
import React from 'react';

interface Props {
  patient: any;
}

const MedicationsRecord: React.FC<Props> = ({ patient }) => {

  if (!patient?.id) return null;

  const tabData = [
    {
      title: 'Prescriptions',
      content: (
        <Prescriptions
          patient={patient}/>
      )
    },
  ];

  return <MyTab data={tabData} />;
};

export default MedicationsRecord;