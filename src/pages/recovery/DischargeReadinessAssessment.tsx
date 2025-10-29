import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import {
  useGetDischargeReadinessByOperationQuery,
  useSaveDischargeReadinessMutation
} from '@/services/RecoveryService';
import { newApOperationDischargeReadiness } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { Col, Row, Text } from 'rsuite';
import ScoreCalculation from '../medical-component/score-calculation';
const DischargeReadinessAssessment = ({ operation }) => {
  const dispatch = useAppDispatch();
  // Initialize state for discharge readiness assessment
  const [readinessAssessment, setReadinessAssessment] = useState({
    ...newApOperationDischargeReadiness
  });
  // Query to get existing discharge readiness assessment by operation key
  const { data: readinessData } = useGetDischargeReadinessByOperationQuery(operation.key, {
    skip: !operation.key,
    selectFromResult: ({ data }) => ({
      data: data ? data : newApOperationDischargeReadiness
    })
  });
  console.log('Redin', readinessAssessment);
  // Mutation hook to save the discharge readiness assessment
  const [save] = useSaveDischargeReadinessMutation();

  // Effect to set the readiness assessment state when data is fetched
  useEffect(() => {
    if (readinessData?.object) {
      setReadinessAssessment(readinessData.object);
    }
  }, [readinessData]);
  // Function to handle the save action
  const handleSave = async () => {
    try {
      // Logic to save the readiness assessment
      await save({ ...readinessAssessment, operationRequestKey: operation?.key }).unwrap();

      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: 'Error saving readiness assessment', sev: 'error' }));
    }
  };

  return (
    <SectionContainer
      title={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <div className="title-div">
            <Text>Discharge Readiness Assessment</Text>
          </div>
          <div className="container-of-add-new-button-2">
            <MyButton color="var(--deep-blue)" width="90px" onClick={handleSave}>
              Save
            </MyButton>
          </div>
        </div>
      }
      content={
        <>
          <ScoreCalculation
            record={readinessAssessment}
            setRecord={setReadinessAssessment}
            scoreFieldName="aldreteScore"
            fields={[
              {
                fieldName: 'oxygenSaturationLkey',
                lovCode: 'ALDRETE_OXSAT',
                label: 'Oxygen Saturation',
                searchable: false
              },
              {
                fieldName: 'consciousnessLkey',
                lovCode: 'ALDRETE_CONSC',
                label: 'Consciousness',
                searchable: false
              },
              {
                fieldName: 'circulationLkey',
                lovCode: 'ALDRETE_CIRCU',
                label: 'Circulation',
                searchable: false
              },
              {
                fieldName: 'respirationLkey',
                lovCode: 'ALDRETE_RESPIR',
                label: 'Respiration',
                searchable: false
              },
              {
                fieldName: 'activityLkey',
                lovCode: 'ALDRETE_ACTIVITY',
                label: 'Activity',
                searchable: false
              }
            ]}
          ></ScoreCalculation>
          <Row>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldType="checkbox"
                fieldName="painControlled"
                record={readinessAssessment}
                setRecord={setReadinessAssessment}
              />
            </Col>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldType="checkbox"
                fieldName="vitalsStable"
                record={readinessAssessment}
                setRecord={setReadinessAssessment}
              />
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldType="checkbox"
                fieldName="fullyAwake"
                record={readinessAssessment}
                setRecord={setReadinessAssessment}
              />
            </Col>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldType="checkbox"
                fieldName="maintainAirway"
                record={readinessAssessment}
                setRecord={setReadinessAssessment}
              />
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldType="checkbox"
                fieldName="siteDressingIntact"
                fieldLabel="site/DressingIntact"
                record={readinessAssessment}
                setRecord={setReadinessAssessment}
              />
            </Col>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldType="checkbox"
                fieldName="nauseaControlled"
                record={readinessAssessment}
                setRecord={setReadinessAssessment}
              />
            </Col>
          </Row>
        </>
      }
    />
  );
};
export default DischargeReadinessAssessment;
