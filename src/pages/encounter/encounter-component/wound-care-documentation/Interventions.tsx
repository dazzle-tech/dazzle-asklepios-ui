import React, { useEffect, useState } from 'react';
import { Col, Radio, RadioGroup, Row, Text } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetActiveIngredientQuery } from '@/services/medicationsSetupService';
const Interventions = ({ object, setObject }) => {
  const { data: patientPositionLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_POSITION');
  const { data: sideLovQueryResponse } = useGetLovValuesByCodeQuery('SIDES');
  const [activeIngredientsListRequest, setActiveIngredientsListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  const { data: activeIngredientListResponseData } = useGetActiveIngredientQuery(
    activeIngredientsListRequest
  );
  
  return (
    <div>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="cleansingSolutionUsed"
            record={object}
            setRecord={setObject}
            disabled={object?.key}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="dressingTypeApplied"
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
            fieldName="debridementPerformed"
            fieldType="checkbox"
            record={object}
            setRecord={setObject}
            disabled={object?.key}
          />
        </Col>
        <Col md={12}>
          {object?.debridementPerformed && (
            <MyInput
              width="100%"
              fieldLabel="Type & Method"
              fieldName="typeAndMethod"
              record={object}
              setRecord={setObject}
              disabled={object?.key}
            />
          )}
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <MyInput
            width={250}
            selectData={activeIngredientListResponseData?.object ?? []}
            fieldType="checkPicker"
            selectDataLabel="name"
            selectDataValue="key"
            fieldName="topicalMedicationsApplied"
            record={object}
            setRecord={setObject}
            disabled={object?.key}
            menuMaxHeight={200}
          />
        </Col>
        <Col md={12}>
          <MyInput
                width="100%"
                fieldName="patientPositioning"
                fieldType="select"
                record={object}
                setRecord={setObject}
                selectData={patientPositionLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                menuMaxHeight={200}
                disabled={object?.key}
              />
          </Col>    
      </Row>
      <Row>
         <MyInput
                width="100%"
                fieldName="additionalTreatments"
                fieldType="textarea"
                record={object}
                setRecord={setObject}
                disabled={object?.key}
              />
        </Row>
    </div>
  );
};
export default Interventions;
