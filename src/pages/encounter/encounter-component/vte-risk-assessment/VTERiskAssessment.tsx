import React from 'react';
import { Tabs } from 'rsuite';
import PaduaPredictionScore from './padua-prediction-score';
import CapriniRiskAssessment from './caprini-risk-assessment';
import MyTab from '@/components/MyTab';
const VTERiskAssessment = () => {
  const tabData = [
    { title: 'Padua Prediction Score', content: <PaduaPredictionScore /> },
    { title: 'Caprini Risk Assessment', content: <CapriniRiskAssessment /> }
  ];

  return (
    <>
      <MyTab data={tabData} />
    </>
  );
};

export default VTERiskAssessment;
