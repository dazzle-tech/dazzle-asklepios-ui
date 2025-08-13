import React from 'react';
import { Col, Row } from 'rsuite';
import PreObservation from '../../patient-summary/PreObservation/PreObservation';
import RecentTestResults from '../../patient-summary/RecentTestResults';
import PatientChronicMedication from '../../patient-summary/PatientChronicMedication';
import IntakeOutputs from '../../patient-summary/IntakeOutputs';
const PatientSummary = ({ patient }) => {
  return (
    <div>
      <Row gutter={18}>
        <Col xs={12}>
          <PreObservation patient={patient} />
        </Col>
        <Col xs={12}>
          <RecentTestResults patient={patient} />
        </Col>
      </Row>
      <Row gutter={18}></Row>
      <Row gutter={18}>
        <Col xs={12}>
          <PatientChronicMedication patient={patient} title="Last 24-h Medications " />
        </Col>
        <Col xs={12}>
          <IntakeOutputs patient={patient} />
        </Col>
      </Row>
    </div>
  );
};
export default PatientSummary;
