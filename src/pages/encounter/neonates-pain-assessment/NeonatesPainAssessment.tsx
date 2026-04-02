import React from 'react';
import { Tabs } from 'rsuite';
import Flacc from './flacc/Flacc';
import Neonatal from './neontes/Neonatal';

const NeonatesPainAssessment = () => {

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
    <Tabs defaultActiveKey="flacc">
      <Tabs.Tab eventKey="flacc" title="FLACC Pain Scale">
        <Flacc />
      </Tabs.Tab>
      <Tabs.Tab eventKey="neonatal" title="Neonatal Pain Scale">
        <Neonatal />
      </Tabs.Tab>
    </Tabs>
      </div>
  );
};

export default NeonatesPainAssessment;
