import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useSortedLovQuery } from '../useSortedLovQuery';
import React from 'react';
import { Col, Form, Row, Text } from 'rsuite';
import ProcedureVitalsFields from '../ProcedureVitalsFields';

type VitalProps = {
  record: any;
  setRecord: (record: any) => void;
};

const ProcedureVitals: React.FC<VitalProps> = ({ record, setRecord }) => {
  const { data: correctLovQueryResponse } = useSortedLovQuery('CORRECT_INCORRECT');
  return (
    <>
    <ProcedureVitalsFields
      title="Post-Procedure Vitals"
      record={record}
      setRecord={setRecord}
    />
    <SectionContainer
      title={<Text>Recovery Assessment</Text>}
      content={
        <>
          <Form fluid>
            <Row>
              <Col md={11}>
                <MyInput
                  width="100%"
                  fieldType="select"
                  selectData={correctLovQueryResponse?.object ?? []}
                   selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                  selectDataValue="lovDisplayVale"
                  fieldName="countStatus"
                  record={record}
                  setRecord={setRecord}
                  searchable={false}
                />
              </Col>
              <Col md={2}></Col>
              <Col md={11}>
                <MyInput
                  width="100%"
                  fieldType="checkbox"
                  fieldName="equipmentCountDone"
                  record={record}
                  setRecord={setRecord}
                />
              </Col>
            </Row>
            <Row>
              <Col md={11}>
                <MyInput
                  width="100%"
                  fieldType="textarea"
                  fieldName="additionalObservations"
                  record={record}
                  setRecord={setRecord}
                />
              </Col>
              <Col md={2}></Col>
              <Col md={11}>
                <MyInput
                  width="100%"
                  fieldType="textarea"
                  fieldName="recoveryNotes"
                  record={record}
                  setRecord={setRecord}
                />
              </Col>
            </Row>
          </Form>
        </>
      }
    />
    </>
  );
};
export default ProcedureVitals;
