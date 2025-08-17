import React from 'react';
import { Col, Radio, RadioGroup, Row, Text } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
const WoundIdentification = ({ object, setObject }) => {
  const { data: woundLocationLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
  const { data: sideLovQueryResponse } = useGetLovValuesByCodeQuery('SIDES');
  return (
    <div>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="woundLocation"
            fieldType="select"
            record={object}
            setRecord={setObject}
            selectData={woundLocationLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            menuMaxHeight={200}
            disabled={object?.key}
            searchable={false}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="side"
            fieldType="select"
            record={object}
            setRecord={setObject}
            selectData={sideLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            menuMaxHeight={200}
            disabled={object?.key}
            searchable={false}
          />
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="woundType"
            record={object}
            setRecord={setObject}
            disabled={object?.key}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="woundCause"
            record={object}
            setRecord={setObject}
            disabled={object?.key}
          />
        </Col>
      </Row>
      <Row>
        <MyInput
          width="100%"
          fieldName="dateOfOnset"
          fieldType="date"
          record={object}
          setRecord={setObject}
          disabled={object?.key}
        />
      </Row>
      <Row>
        <RadioGroup disabled={object?.key}>
          <Row gutter={10}>
            <Radio value="initial ">Initial</Radio>
            <Radio value="FollowUp">Follow-up</Radio>
          </Row>
        </RadioGroup>
      </Row>
    </div>
  );
};
export default WoundIdentification;
