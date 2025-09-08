//Declares

import React from 'react';
import { Tabs } from 'rsuite';
import Rad from './Rad';
import RadiologistWorklist from './radiologist-worklist/RadiologistWorklist';

const RadiologyMain = () => {
  return (
    <>
      <Tabs appearance="subtle" className="doctor-round-tabs" defaultActiveKey="1">
        <Tabs.Tab eventKey="1" title="Imaging Radiology">
          <Rad />
        </Tabs.Tab>
        <Tabs.Tab eventKey="2" title="Radiologist Worklist">
<RadiologistWorklist/>      </Tabs.Tab>
      </Tabs>
    </>
  );
};
export default RadiologyMain;
