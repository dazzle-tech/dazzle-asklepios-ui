import MyTab from '@/components/MyTab';
import React from 'react';
import NormalConsultation from './NormalConsultation';
import TelephonicConsultation from './TelephonicConsultation';
import './styles.less';

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
