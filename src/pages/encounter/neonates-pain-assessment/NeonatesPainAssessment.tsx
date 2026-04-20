import React from 'react';
import { Tabs } from 'rsuite';
import Flacc from './flacc/Flacc';
import Neonatal from './neontes/Neonatal';
import Translate from '@/components/Translate';

const NeonatesPainAssessment = () => {

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
    <Tabs defaultActiveKey="flacc">
      <Tabs.Tab eventKey="flacc" title={<Translate>FLACC Pain Scale</Translate>}>
        <Flacc />
      </Tabs.Tab>
      <Tabs.Tab eventKey="neonatal" title={<Translate>Neonatal Pain Scale</Translate>}>
        <Neonatal />
      </Tabs.Tab>
    </Tabs>
      </div>
  );
};

export default NeonatesPainAssessment;
