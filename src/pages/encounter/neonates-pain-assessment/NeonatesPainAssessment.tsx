import React from 'react';
import { Tabs } from 'rsuite';
import Flacc from './flacc/Flacc';
import Neonatal from './neontes/Neonatal';

const NeonatesPainAssessment = () => {
  return (
    <Tabs defaultActiveKey="flacc">
      <Tabs.Tab eventKey="flacc" title="FLACC Pain Scale">
        <Flacc />
      </Tabs.Tab>
      <Tabs.Tab eventKey="neonatal" title="Neonatal Pain Scale">
        <Neonatal />
      </Tabs.Tab>
    </Tabs>
  );
};

export default NeonatesPainAssessment;
