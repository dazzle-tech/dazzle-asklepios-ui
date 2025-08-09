import MyInput from '@/components/MyInput';
import { useGetAllergiesQuery } from '@/services/observationService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Col, Divider, Row, Text } from 'rsuite';
const DietaryHistoryOrIntake = ({ object, setObject }) => {
   const location = useLocation();
  const { patient } = location.state || {};
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient.key
      },
      {
        fieldName: 'allergy_type_lkey',
        operator: 'match',
        value: '3196709905099521'
      }
    ]
  });
  // Fetch allergies list response
  const { data: allergiesListResponse } = useGetAllergiesQuery({
    listRequest
  });

   // Fetch fluid intake Types lov response 
  const { data: fluidIntakeTypesLovQueryResponse } = useGetLovValuesByCodeQuery('FLUID_INTAKE_TYPES');

  return (
    <div className="container-form">
      <div className="title-div">
        <Text>Dietary History / Intake</Text>
      </div>
      <Divider />
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="usualDietPattern"
            record={object}
            setRecord={setObject}
          />
        </Col>
        <Col md={12}>
          <MyInput width="100%" fieldName="24-HourRecall" record={object} setRecord={setObject} />
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <MyInput
            fieldType="select"
            fieldName="oralIntakeType"
            selectData={fluidIntakeTypesLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            width="100%"
            record={object}
            setRecord={setObject}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="fluidIntakeStatus"
            record={object}
            setRecord={setObject}
            disabled
          />
        </Col>
      </Row>
      {/* // laaaaaaaaaaaaaaaaaaaaaaaaaaaaaaater */}
      <Row>
        <MyInput
          fieldType="select"
          fieldLabel="Food Allergies / Intolerance"
          fieldName="foodAllergies"
          selectData={allergiesListResponse?.object ?? []}
          selectDataLabel="string"
          selectDataValue="key"
          width="100%"
          record={object}
          setRecord={setObject}
        />
      </Row>
      <Row>
        <MyInput
          width="100%"
          fieldName="notes"
          fieldType="textarea"
          record={object}
          setRecord={setObject}
        />
      </Row>
    </div>
  );
};
export default DietaryHistoryOrIntake;
