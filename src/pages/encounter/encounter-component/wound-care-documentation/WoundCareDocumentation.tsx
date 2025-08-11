import React, { useState } from 'react';
import { Tabs } from 'rsuite';
import SectionContainer from '@/components/SectionsoContainer';
import WoundCare from './WoundCare';
import Tracking from './Tracking';
const WoundCareDocumentation = () => {
  const [object, setObject] = useState({});
  
 const [activeKey, setActiveKey] = useState<string | number>('1');
  return (
        <>
                            <Tabs
                             activeKey={activeKey} onSelect={setActiveKey}
                              appearance="subtle">
                                <Tabs.Tab eventKey="1" title="Wound Care">
                                   <WoundCare object={object} setObject={setObject} />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="2" title="Tracking">
                                   <Tracking/>
                                </Tabs.Tab>
                                

                            </Tabs>
                  
            
        </>
    );
};
export default WoundCareDocumentation;
