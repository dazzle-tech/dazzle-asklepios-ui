import React, { useState } from 'react';
import { Tabs } from 'rsuite';
import { useOutletContext } from 'react-router-dom';

import SOAP from '../../encounter-component/s.o.a.p';
import ProgressNotes from '../../encounter-component/progress-notes';
import PatientHistory from '../../encounter-component/patient-history';

const PhysicianAssessment = () => {
  const { patient, encounter, edit } = useOutletContext<any>();
  const [activeTab, setActiveTab] = useState('clinical');

  return (
    <div className="physician-assessment-container">
      <Tabs activeKey={activeTab} onSelect={key => setActiveTab(key as string)} appearance="subtle">
        {/* Clinical Visit + Physical Exam */}
        <Tabs.Tab eventKey="clinical" title="Clinical Visit">
          <SOAP patient={patient} encounter={encounter} edit={edit} />
        </Tabs.Tab>

        {/* Progress Notes */}
        <Tabs.Tab eventKey="progress" title="Progress Notes">
          <ProgressNotes />
        </Tabs.Tab>

        {/* Patient History */}
        <Tabs.Tab eventKey="history" title="Patient History">
          <PatientHistory patient={patient} encounter={encounter} edit={edit} />
        </Tabs.Tab>
      </Tabs>
    </div>
  );
};

export default PhysicianAssessment;
