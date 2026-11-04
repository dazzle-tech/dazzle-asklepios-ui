import React from 'react';
import { Panel } from 'rsuite';
import MyTab from '@/components/MyTab';
import UrgentCareList from './UrgentCareList';
import MedicationRecord from './MedicationRecord';

const UrgentCareListMain = () => {
  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const tabData = [
    {
      title: 'Encounters',
      content: <UrgentCareList />
    },
    {
      title: 'Medication Record',
      content: <MedicationRecord />
    }
  ];

  return (
    <Panel dir={dir}>
      <MyTab data={tabData} lazy/>
    </Panel>
  );
};

export default UrgentCareListMain;