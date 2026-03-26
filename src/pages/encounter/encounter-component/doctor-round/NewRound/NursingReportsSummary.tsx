import React from 'react';
import { Col, Row } from 'rsuite';
import ChiefComplainSummary from '../../nursing-reports-summary/ChiefComplainSummary';
import PainAssessmentSummary from '../../nursing-reports-summary/PainAssessmentSummary';
import GeneralAssessmentSummary from '../../nursing-reports-summary/GeneralAssessmentSummary';
import FunctionalAssessmentSummary from '../../nursing-reports-summary/FunctionalAssessmentSummary';
const NursingReportsSummary = ({ patient, encounter }) => {
          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
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
