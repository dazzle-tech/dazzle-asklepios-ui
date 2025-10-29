import React, { useState } from 'react';
import WoundCare from './WoundCare';
import Tracking from './Tracking';
import MyTab from '@/components/MyTab';
const WoundCareDocumentation = () => {
  const [object, setObject] = useState({});

  const [activeKey, setActiveKey] = useState<string | number>('1');
  const tabData = [
    { title: 'Wound Care', content: <WoundCare object={object} setObject={setObject} /> },
    { title: 'Tracking', content: <Tracking /> }
  ];
  return <MyTab data={tabData} activeTab={activeKey} setActiveTab={setActiveKey} />;
};
export default WoundCareDocumentation;
