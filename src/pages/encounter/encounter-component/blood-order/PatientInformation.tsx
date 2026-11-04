import React from 'react';
import { Col, Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
const PatientInformation = ({ bloodorder, setBloodOrder }) => {

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Form fluid dir={dir}>
      <Row>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldName="latestHb"
            record={bloodorder}
            setRecord={setBloodOrder}
            readonly
          />
        </Col>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldName="latestHct"
            record={bloodorder}
            setRecord={setBloodOrder}
            readonly
          />
        </Col>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldName="latestPlateletCount"
            record={bloodorder}
            setRecord={setBloodOrder}
            readonly
          />
        </Col>
      </Row>
      <Row>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldName="scheduledTransfusionDate"
            fieldType="datetime"
            record={bloodorder}
            setRecord={setBloodOrder}
          />
        </Col>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldName="antibodyScreenDone"
            fieldType="checkbox"
            record={bloodorder}
            setRecord={setBloodOrder}
          />
        </Col>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldName="crossmatchRequired"
            fieldType="checkbox"
            record={bloodorder}
            setRecord={setBloodOrder}
          />
        </Col>
      </Row>
    </Form>
  );
};
export default PatientInformation;
