import React, { useState } from 'react';
import { Tabs } from 'rsuite';
import NormalConsultation from './NormalConsultation';
import TelephonicConsultation from './TelephonicConsultation';
import './styles.less';
import MyTab from '@/components/MyTab';

const Consultation = ({}) => {

  const tabData = [
    {title: "Normal Consultation", content: <NormalConsultation/>},
    {title: "Telephonic Consultation", content: <TelephonicConsultation/>}
  ];
  return (
    <MyTab 
     data={tabData}
     appearance='pills'
    />
  );
};

export default Consultation;
