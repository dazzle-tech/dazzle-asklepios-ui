import DynamicLineChart from '@/components/Charts/DynamicLineChart/DynamicLineChart';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import React from 'react';
import { Col, FlexboxGrid, Panel, Row } from 'rsuite';
const AnthropometricData = (object, setObject) => {
  return (
    <div >
      <FlexboxGrid>
        <FlexboxGrid.Item className="chart" as={Col} colspan={24} lg={8} md={12} sm={24}>
          <Panel bordered header={<Translate>Patient Weight Change</Translate>}>
            <DynamicLineChart
              maxValue={70}
              title="Patient Weight Change"
              chartData={[
                { x: '2025-09-19', y: 10 },
                { x: '2025-09-20', y: 20 },
                { x: '2025-09-21', y: 30 },
                { x: '2025-09-22', y: 50 },
                { x: '2025-09-23', y: 60 }
              ]}
            />
          </Panel>
        </FlexboxGrid.Item>
      </FlexboxGrid>
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
            readonly
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
            readonly
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
          />
        </Col>
      </Row>
    </div>
  );
};
export default AnthropometricData;
