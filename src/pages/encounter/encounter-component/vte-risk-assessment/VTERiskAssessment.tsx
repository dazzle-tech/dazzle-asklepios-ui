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
  
  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <>
      <MyTab
        data={tabData.map(tab => ({
          ...tab,
          content: <div dir={dir}>{tab.content}</div>
        }))}
      />
    </>
  );
};

export default VTERiskAssessment;
