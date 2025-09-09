import React from 'react';
import { Tabs } from 'rsuite';
import FlaccTab from './FlaccTab';
import NeonatalTab from './NeonatalTab';

const NeonatesPainAssessment = () => {
  return (
    <Tabs defaultActiveKey="flacc">
      <Tabs.Tab eventKey="flacc" title="FLACC Pain Scale">
        <FlaccTab />
      </Tabs.Tab>
      <Tabs.Tab eventKey="neonatal" title="Neonatal Pain Scale">
        <NeonatalTab />
      </Tabs.Tab>
    </Tabs>
  );
};

export default NeonatesPainAssessment;
