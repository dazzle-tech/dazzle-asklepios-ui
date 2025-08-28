import React from 'react';
import { Col, Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
const NotesAndHistory = ({ bloodorder, setBloodOrder }) => {
  return (
    <Form fluid>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="specialRequirements"
            fieldType="textarea"
            record={bloodorder}
            setRecord={setBloodOrder}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="transfusionHistory"
            fieldType="textarea"
            record={bloodorder}
            setRecord={setBloodOrder}
          />
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="additionalNotes"
            record={bloodorder}
            setRecord={setBloodOrder}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="extraDocumentation"
            record={bloodorder}
            setRecord={setBloodOrder}
          />
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="previousReaction"
            fieldType="checkbox"
            record={bloodorder}
            setRecord={setBloodOrder}
          />
        </Col>
        <Col md={12}>
          {bloodorder?.previousReaction && (
            <MyInput
              width="100%"
              fieldName="reactions"
              fieldType="textarea"
              record={bloodorder}
              setRecord={setBloodOrder}
            />
          )}
        </Col>
      </Row>
    </Form>
  );
};
export default NotesAndHistory;
