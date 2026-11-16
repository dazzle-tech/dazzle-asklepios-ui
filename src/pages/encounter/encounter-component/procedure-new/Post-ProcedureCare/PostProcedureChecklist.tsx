import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import React from 'react';
import { Col, Form, Row, Text } from 'rsuite';

type ChecklistProps = {
  record: any;
  setRecord: (record: any) => void;
};

const PostProcedureChecklist: React.FC<ChecklistProps> = ({ record, setRecord }) => {
  return (
    <SectionContainer
      title={<Text>Post-Procedure Checklist</Text>}
      content={
        <Form fluid>
          <Row>
            <MyInput
              width="100%"
              record={record}
              setRecord={setRecord}
              fieldType="checkbox"
              fieldName="nauseaVomiting"
            />
          </Row>

          <Row>
            <Col md={8}>
              <MyInput
                width="100%"
                record={record}
                setRecord={setRecord}
                fieldType="check"
                fieldName="awakeAndOriented"
                showLabel={false}
              />
            </Col>
            <Col md={8}>
              <MyInput
                width="100%"
                record={record}
                setRecord={setRecord}
                fieldType="check"
                fieldName="toleratingOralFluids"
                showLabel={false}
              />
            </Col>
            <Col md={8}>
              <MyInput
                width="100%"
                record={record}
                setRecord={setRecord}
                fieldType="check"
                fieldName="ambulatingIndependently"
                showLabel={false}
              />
            </Col>
          </Row>
          <Row>
            <Col md={8}>
              <MyInput
                width="100%"
                record={record}
                setRecord={setRecord}
                fieldType="check"
                fieldName="voidedUrine"
                showLabel={false}
              />
            </Col>
            <Col md={8}>
              <MyInput
                width="100%"
                record={record}
                setRecord={setRecord}
                fieldType="check"
                fieldName="noActiveBleeding"
                showLabel={false}
              />
            </Col>
            <Col md={8}>
              <MyInput
                width="100%"
                record={record}
                setRecord={setRecord}
                fieldType="check"
                fieldName="painScore4"
                showLabel={false}
              />
            </Col>
          </Row>
        </Form>
      }
    />
  );
};
export default PostProcedureChecklist;
