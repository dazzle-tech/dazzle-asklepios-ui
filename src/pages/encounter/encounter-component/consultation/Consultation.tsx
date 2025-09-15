import React, { useState } from 'react';
import { Tabs } from 'rsuite';
import NormalConsultation from './NormalConsultation';
import TelephonicConsultation from './TelephonicConsultation';
import './styles.less';

const Consultation = ({}) => {

  return (
    <Tabs defaultActiveKey="1" appearance="pills">
      <Tabs.Tab eventKey="1" title="Normal Consultation">
        <NormalConsultation/>
      </Tabs.Tab>
      <Tabs.Tab eventKey="2" title="Telephonic Consultation">
        <TelephonicConsultation/>
      </Tabs.Tab>
    </Tabs>
  );
};

export default Consultation;
