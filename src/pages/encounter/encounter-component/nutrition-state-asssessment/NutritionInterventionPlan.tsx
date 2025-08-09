import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import React from 'react';
import { Col, Divider, Row, Text } from 'rsuite';
const NutritionInterventionPlan = ({ object, setObject }) => {
  // Fetch fluid intake types Lov Response
  const { data: fluidIntakeTypesLovQueryResponse } =
    useGetLovValuesByCodeQuery('FLUID_INTAKE_TYPES');
  return (
    <div className="container-form">
      <div className="title-div">
        <Text>Nutrition Intervention Plan</Text>
      </div>
      <Divider />
      <Row>
        <MyInput
          width="100%"
          fieldType="textarea"
          fieldName="NutritionGoal"
          fieldLabel="Nutrition Goal(s)"
          record={object}
          setRecord={setObject}
        />
      </Row>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="interventionType"
            fieldType="select"
            selectData={fluidIntakeTypesLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={object}
            setRecord={setObject}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="patientOrFamilyEducation"
            fieldType="checkbox"
            record={object}
            setRecord={setObject}
          />
        </Col>
      </Row>
      <Row>
        <Row>
          <Text>Nutrition Prescription:</Text>
        </Row>
        <Row>
          <Col md={8}>
            <MyInput
              width="100%"
              fieldName="protein"
              fieldType="number"
              rightAddon="%"
              record={object}
              setRecord={setObject}
            />
          </Col>
          <Col md={8}>
            <MyInput
              width="100%"
              fieldName="Carbohydrates"
              fieldType="number"
              rightAddon="%"
              record={object}
              setRecord={setObject}
            />
          </Col>
          <Col md={8}>
            <MyInput
              width="100%"
              fieldName="fats"
              fieldType="number"
              rightAddon="%"
              record={object}
              setRecord={setObject}
            />
          </Col>
        </Row>
      </Row>
      <Row>
        <Col md={12}>
          <Text>Create Diet Order:</Text>
        </Col>
        <Col md={12}>
          <MyButton>Create</MyButton>
        </Col>
      </Row>
    </div>
  );
};
export default NutritionInterventionPlan;
