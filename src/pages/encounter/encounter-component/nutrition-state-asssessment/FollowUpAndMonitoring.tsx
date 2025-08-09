import MyInput from '@/components/MyInput';
import MyTagInput from '@/components/MyTagInput/MyTagInput';
import React, { useState } from 'react';
import { Col, Divider, Row, Text } from 'rsuite';
const FollowUpAndMonitoring = ({ object, setObject }) => {
  // list of monitoring indicators
  const [monitoringIndicators, setMonitoringIndicators] = useState([]);

  return (
    <div className="container-form">
      <div className="title-div">
        <Text>Follow-up and Monitoring</Text>
      </div>
      <Divider />
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldType="date"
            fieldName="nextReviewDate"
            record={object}
            setRecord={setObject}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="reassessmentNeeded"
            fieldType="checkbox"
            record={object}
            setRecord={setObject}
          />
        </Col>
      </Row>
      <Row>
        <MyTagInput
          tags={monitoringIndicators}
          setTags={setMonitoringIndicators}
          labelText="Monitoring Indicators"
          width="100%"
        />
      </Row>
      <Row>
        <MyInput
          width="100%"
          fieldName="followUpNotes"
          fieldLabel="Follow-up Notes"
          record={object}
          setRecord={setObject}
        />
      </Row>
    </div>
  );
};
export default FollowUpAndMonitoring;
