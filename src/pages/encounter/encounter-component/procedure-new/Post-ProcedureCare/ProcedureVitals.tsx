import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import VitalSigns from '@/pages/medical-component/vital-signs/VitalSigns';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import React from 'react';
import { Col, Form, Row, Text } from 'rsuite';

type VitalProps = {
  record: any;
  setRecord: (record: any) => void;
};

const ProcedureVitals: React.FC<VitalProps> = ({ record, setRecord }) => {
  const { data: numbersLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
  const { data: correctLovQueryResponse } = useGetLovValuesByCodeQuery('CORRECT_INCORRECT');
  return (
    <SectionContainer
      title={<Text>Post-Procedure Vitals</Text>}
      content={
        <>
          <VitalSigns setObject={setRecord} object={record} />
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
                  fieldType="select"
                  selectData={numbersLovQueryResponse?.object ?? []}
                   selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                  selectDataValue="lovDisplayVale"
                  fieldName="painScore"
                  record={record}
                  setRecord={setRecord}
                  searchable={false}
                />
              </Col>
              <Col md={2}></Col>
              <Col md={11}>
                <MyInput
                  width="100%"
                  fieldType="textarea"
                  fieldName="additionalObservations"
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
                  fieldName="painDescription"
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
  );
};
export default ProcedureVitals;
