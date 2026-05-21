import React from 'react';
import { Panel } from 'rsuite';
import MyTab from '@/components/MyTab';

import AllGraphsTab from './AllGraphsTab';
import OneGraphTab from './OneGraphTab';
import PreviousMeasurements from './PreviousMeasurements';

const PreviousMeasurementsMain = ({ patient }) => {
  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const tabData = [
    {
      title: 'All Measurements',
      content: <PreviousMeasurements patient={patient} />
    },
    {
      title: 'All Graphs',
      content: <AllGraphsTab patient={patient} />
    },
    {
      title: 'One Graph',
      content: <OneGraphTab patient={patient} />
    }
  ];

  return (
    <Panel dir={dir}>
      <MyTab data={tabData} lazy/>
    </Panel>
  );
};

export default PreviousMeasurementsMain;