import MyTab from '@/components/MyTab';
import PrescritionEmr from './PrescritionEmr/PrescritionEmr';
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
        <PrescritionEmr patient={patient} />
      )
    }
  ];

  return <MyTab data={tabData} lazy />;
};

export default MedicationsRecord;