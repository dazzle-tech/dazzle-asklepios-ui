import React from 'react';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Col, Row, Text } from 'rsuite';
import Translate from '@/components/Translate';
const NutritionInterventionPlan = ({ object, setObject }) => {
  // Fetch fluid intake types Lov Response
  const { data: fluidIntakeTypesLovQueryResponse } =
    useGetLovValuesByCodeQuery('FLUID_INTAKE_TYPES');

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
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
 disableByField='isValid'

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
          <Text className="title-nutrition-state"><Translate>Nutrition Prescription</Translate></Text>
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
