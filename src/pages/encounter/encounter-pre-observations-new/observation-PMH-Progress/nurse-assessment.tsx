import React, { useState } from 'react';
import { Tabs } from 'rsuite';
import { useOutletContext } from 'react-router-dom';
import Observations from '../observations/Observations';
import ProgressNotes from '../../encounter-component/progress-notes';
import PatientHistory from '../../encounter-component/patient-history';

const NurseAssessment = () => {
  const { patient, encounter, edit } = useOutletContext<any>();
  const [activeTab, setActiveTab] = useState('observation');

  return (
    <div className="nurse-assessment-container">
      <Tabs activeKey={activeTab} onSelect={key => setActiveTab(key as string)} appearance="subtle">
        <Tabs.Tab eventKey="observation" title="Observation">
          <Observations patient={patient} encounter={encounter} edit={edit} />
        </Tabs.Tab>

        <Tabs.Tab eventKey="progress" title="Progress Notes">
          <ProgressNotes />
        </Tabs.Tab>

        <Tabs.Tab eventKey="history" title="Patient History">
          <PatientHistory patient={patient} encounter={encounter} edit={edit} />
        </Tabs.Tab>
      </Tabs>
    </div>
  );
};

export default NurseAssessment;
