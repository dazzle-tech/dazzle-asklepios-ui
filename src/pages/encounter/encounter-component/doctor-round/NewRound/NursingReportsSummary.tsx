import React from 'react';
import { Col, Row } from 'rsuite';
import ChiefComplainSummary from '../../nursing-reports-summary/ChiefComplainSummary';
import PainAssessmentSummary from '../../nursing-reports-summary/PainAssessmentSummary';
import GeneralAssessmentSummary from '../../nursing-reports-summary/GeneralAssessmentSummary';
import FunctionalAssessmentSummary from '../../nursing-reports-summary/FunctionalAssessmentSummary';
const NursingReportsSummary = ({ patient, encounter }) => {
  return (
    <div>
      <Row gutter={18}>
        <Col xs={12}>
          <ChiefComplainSummary patient={patient} encounter={encounter} />
        </Col>
        <Col xs={12}>
          <PainAssessmentSummary patient={patient} encounter={encounter} />
        </Col>
      </Row>
      <Row gutter={18}></Row>
      <Row gutter={18}>
        <Col xs={12}>
          <GeneralAssessmentSummary patient={patient} encounter={encounter} />
        </Col>
        <Col xs={12}>
          <FunctionalAssessmentSummary patient={patient} encounter={encounter} />
        </Col>
      </Row>
    </div>
  );
};
export default NursingReportsSummary;
