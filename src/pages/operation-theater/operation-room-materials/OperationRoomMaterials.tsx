//Declares

import React from 'react';
import { Tabs } from 'rsuite';
import Preparation from './Preparation';

const OperationRoomMaterials = () => {
  return (
    <>
      <Tabs appearance="subtle" className="doctor-round-tabs" defaultActiveKey="1">
        <Tabs.Tab eventKey="1" title="Preparation">
          <Preparation />
        </Tabs.Tab>
        <Tabs.Tab eventKey="2" title="Reconciliation">
          {/* <Preparation/> */}
        </Tabs.Tab>
      </Tabs>
    </>
  );
};
export default OperationRoomMaterials;
