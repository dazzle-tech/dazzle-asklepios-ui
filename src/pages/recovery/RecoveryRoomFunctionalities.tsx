import React from 'react';
import { Col, Form, Row } from 'rsuite';
import PatientSide from '../lab-module/PatienSide';
import AnesthesiaRecovery from './AnesthesiaRecovery';
import ArrivalRecoveryRoom from './ArrivalRecoveryRoom';
import ContinuousVitalsMonitoring from './ContinuousVitalsMonitoring';
import DischargeReadinessAssessment from './DischargeReadinessAssessment';
import DischargeToWard from './DischargeToWard';
import NursingCare from './NursingCareInterventions';
import './styles.less';
const RecoveryRoomFunctionalities = ({ patient, encounter, operation }) => {
  return (
    <div className="container">
      <div className="left-box">
        <Row gutter={15} className="d">
          <Form fluid>
            <Col md={12}>
              <Row>
                <ArrivalRecoveryRoom operation={operation} />
              </Row>
              <Row>
                <AnesthesiaRecovery operation={operation} />
              </Row>
              <Row>
              <NursingCare operation={operation} />
              </Row>
            </Col>
            <Col md={12}>
              <Row>
                <ContinuousVitalsMonitoring operation={operation} />
              </Row>
              <Row>
                <DischargeReadinessAssessment operation={operation} />
              </Row>
              <Row>
                 <DischargeToWard operation={operation} />
              </Row>
            </Col>
          </Form>
        </Row>
      </div>
      <div className="right-box">
        <PatientSide patient={patient} encounter={encounter} />
      </div>
    </div>
  );
};
export default RecoveryRoomFunctionalities;
