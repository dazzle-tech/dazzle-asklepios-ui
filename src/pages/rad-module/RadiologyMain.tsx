//Declares

import React from 'react';
import { Tabs } from 'rsuite';
import Rad from './Rad';
import RadiologistWorklist from './radiologist-worklist/RadiologistWorklist';
import MyTab from '@/components/MyTab';

const RadiologyMain = () => {
  const tabData = [
    {title: "Imaging Radiology", content:  <Rad />},
    {title: "Radiologist Worklist", content: <RadiologistWorklist/>}
  ];
  return (
    <MyTab 
     data={tabData}
    />
  );
};
export default RadiologyMain;
