import React, { useEffect } from 'react';
import { Col, Radio, RadioGroup, Row, Text } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
const WoundAssessment = ({object, setObject}) => {
  const { data: nmbersLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
  
  useEffect(() => {
    console.log("print");
    console.log(object);
  },[object]);
  return (
    <div>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="sizeLength"
            fieldLabel="Size – Length"
            fieldType="number"
            rightAddon="cm"
            record={object}
            setRecord={setObject}
            disabled={object?.key}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="sizeWidth"
            fieldLabel="Size – Width"
            fieldType="number"
            rightAddon="cm"
            record={object}
            setRecord={setObject}
            disabled={object?.key}
          />
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="sizeDepth "
            fieldLabel="Size – Depth "
            fieldType="number"
            rightAddon="cm"
            record={object}
            setRecord={setObject}
            disabled={object?.key}
          />
        </Col>
        <Col md={12}>
           <MyInput
        width="100%"
        fieldName="painLevel"
        fieldType="select"
        record={object}
        setRecord={setObject}
        selectData={nmbersLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        menuMaxHeight={200}
      />
        </Col>
      </Row>
      <Row>
        <Text>Shape</Text>
        <RadioGroup
         disabled={object?.key}
        //    value={GUGT} onChange={value => setGUGT(value)}
        >
          <Row gutter={10}>
            <Radio value="round ">Round</Radio>
            <Radio value="oval">Oval</Radio>
            <Radio value="irregular">Irregular</Radio>
          </Row>
        </RadioGroup>
      </Row>
      <Row>
        <Text>Edges</Text>
        <RadioGroup
         disabled={object?.key}
        //    value={GUGT} onChange={value => setGUGT(value)}
        >
          <Row gutter={10}>
            <Radio value="rolled">Rolled</Radio>
            <Radio value="attached">Attached</Radio>
            <Radio value="detached">Detached</Radio>
          </Row>
        </RadioGroup>
      </Row>
      <Text>Wound Bed Appearance</Text>
      <Row>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldName="granulation"
            showLabel={false}
            fieldType="check"
            record={object}
            setRecord={setObject}
            disabled={object?.key}
          />
        </Col>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldName="slough"
            showLabel={false}
            fieldType="check"
            record={object}
            setRecord={setObject}
            disabled={object?.key}
          />
        </Col>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldName="necrosis"
            showLabel={false}
            fieldType="check"
            record={object}
            setRecord={setObject}
            disabled={object?.key}
          />
        </Col>
      </Row>
      <Row>
        <Text>Exudate Amount</Text>
        <RadioGroup
         disabled={object?.key}
        //    value={GUGT} onChange={value => setGUGT(value)}
        >
          <Row gutter={10}>
            <Radio value="scant">Scant</Radio>
            <Radio value="moderate">Moderate</Radio>
            <Radio value="large">Large</Radio>
            <Radio value="none">None</Radio>
          </Row>
        </RadioGroup>
      </Row>
      <Row>
        <Text>Exudate Type</Text>
        <RadioGroup
         disabled={object?.key}
        //    value={GUGT} onChange={value => setGUGT(value)}
        >
          <Row gutter={10}>
            <Radio value="serous">Serous</Radio>
            <Radio value="purulent">Purulent</Radio>
            <Radio value="sanguineous">Sanguineous</Radio>
            <Radio value="serosanguinous">Serosanguinous</Radio>
          </Row>
        </RadioGroup>
      </Row>
      <Row>
        <Text>Odor</Text>
        <RadioGroup
         disabled={object?.key}
        //    value={GUGT} onChange={value => setGUGT(value)}
        >
          <Row gutter={10}>
            <Radio value="none">None</Radio>
            <Radio value="foul">Foul</Radio>
            <Radio value="sweet">Sweet</Radio>
            <Radio value="pungent">Pungent</Radio>
          </Row>
        </RadioGroup>
      </Row>
      <Row>
      <Text>Surrounding Skin</Text>
      <Row>
        <Col md={6}>
      <MyInput
        width="100%"
        fieldName="intact"
        showLabel={false}
        fieldType="check"
        record={object}
        setRecord={setObject}
        disabled={object?.key}
      />
      </Col>
      <Col md={6}>
      <MyInput
        width="100%"
        fieldName="erythema"
        showLabel={false}
        fieldType="check"
        record={object}
        setRecord={setObject}
        disabled={object?.key}
      />
      </Col>
      <Col md={6}>
      <MyInput
        width="100%"
        fieldName="macerated"
        showLabel={false}
        fieldType="check"
        record={object}
        setRecord={setObject}
        disabled={object?.key}
      />
      </Col>
      <Col md={6}>
      <MyInput
        width="100%"
        fieldName="indurated"
        showLabel={false}
        fieldType="check"
        record={object}
        setRecord={setObject}
        disabled={object?.key}
      />
      </Col>
      </Row>
      </Row>

     

      <Row>
        <MyInput
          width="100%"
          fieldName="signsOfInfection"
          fieldType="checkbox"
          record={object}
          setRecord={setObject}
          disabled={object?.key}
        />
      </Row>
    </div>
  );
};
export default WoundAssessment;
