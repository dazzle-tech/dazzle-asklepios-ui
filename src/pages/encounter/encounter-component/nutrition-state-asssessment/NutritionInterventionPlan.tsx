import React from 'react';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Col, Row, Text } from 'rsuite';
const NutritionInterventionPlan = ({ object, setObject }) => {
  // Fetch fluid intake types Lov Response
  const { data: fluidIntakeTypesLovQueryResponse } =
    useGetLovValuesByCodeQuery('FLUID_INTAKE_TYPES');
  return (
    <div>
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
            searchable={false}
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
          <Text className="title-nutrition-state">Nutrition Prescription:</Text>
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
    </div>
  );
};
export default NutritionInterventionPlan;
