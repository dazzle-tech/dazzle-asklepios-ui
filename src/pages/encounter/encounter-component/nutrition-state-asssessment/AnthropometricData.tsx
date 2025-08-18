import DynamicLineChart from '@/components/Charts/DynamicLineChart/DynamicLineChart';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import React from 'react';
import { Col, FlexboxGrid, Panel, Row } from 'rsuite';
const AnthropometricData = (object, setObject) => {
  return (
    <Row gutter={120}>
      <Row>
      <FlexboxGrid>
        <FlexboxGrid.Item className="chart" as={Col} colspan={24} lg={8} md={12} sm={24}>
          <Panel bordered header={<Translate>Patient Weight Change</Translate>}>
            <DynamicLineChart
              maxValue={70}
              title="Patient Weight Change"
              chartData={[
                { x: '2025-03-02', y: 10 },
                { x: '2025-04-02', y: 20 },
                { x: '2025-05-02', y: 30 },
                { x: '2025-06-02', y: 50 },
                { x: '2025-07-02', y: 60 }
              ]}
            />
          </Panel>
        </FlexboxGrid.Item>
      </FlexboxGrid>
      </Row>
      <Row>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldName="height"
            record={object}
            setRecord={setObject}
            rightAddon="cm"
            fieldType="number"
          />
        </Col>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldName="width"
            record={object}
            setRecord={setObject}
            rightAddon="kg"
            fieldType="number"
          />
        </Col>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldLabel="BMI"
            fieldName="bmi"
            record={object}
            setRecord={setObject}
            disabled
            fieldType="number"
          />
        </Col>
      </Row>
      <Row>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldName="lastWeight "
            record={object}
            setRecord={setObject}
            rightAddon="kg"
            fieldType="number"
          />
        </Col>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldName="weightChange"
            record={object}
            setRecord={setObject}
            rightAddon="%"
            fieldType="number"
            disabled
          />
        </Col>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldLabel="MUAC"
            fieldName="muac"
            record={object}
            setRecord={setObject}
            fieldType="number"
            disabled
          />
        </Col>
      </Row>
    </Row>
  );
};
export default AnthropometricData;
