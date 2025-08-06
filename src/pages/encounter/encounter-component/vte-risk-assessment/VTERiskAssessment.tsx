import React from 'react';
import { Tabs } from 'rsuite';
import PaduaPredictionScore from './padua-prediction-score';
import CapriniRiskAssessment from './caprini-risk-assessment';
const VTERiskAssessment = () => {


    return(<>
      <Tabs appearance="subtle" className="doctor-round-tabs" defaultActiveKey="1">
        <Tabs.Tab eventKey="1" title="Padua Prediction Score">
          <PaduaPredictionScore />
        </Tabs.Tab>
        <Tabs.Tab eventKey="2" title="Caprini Risk Assessment">
          <CapriniRiskAssessment />
        </Tabs.Tab>
      </Tabs>
    </>);
};

export default VTERiskAssessment;
