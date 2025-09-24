import MyButton from '@/components/MyButton/MyButton';
import React, { useRef } from 'react';
import { Col, Divider, Row, Text } from 'rsuite';
import Diagnosis from '../../../../medical-component/diagnosis/DiagnosisAndFindings';
import ProcedureVitals from './ProcedureVitals';
import AdministeredMedications from './AdministeredMedications ';
import PostProcedureAnesthesia from './PostProcedureAnesthesia';
import PostProcedureChecklist from './PostProcedureChecklist';
import {
  useGetProcedureAdministeredMedicationsQuery,
  useSaveProcedureAdministeredMedicationsMutation
} from '@/services/procedureService';
import { useGetActiveIngredientQuery } from '@/services/medicationsSetupService';
import { newApProcedureAdministeredMedications } from '@/types/model-types-constructor';
import '../styles.less';

const PostProcedureCare = ({ procedure, setActiveTab, user }) => {
  const diagRef = useRef(null);
  const vitalRef = useRef(null);
  const checklistRef = useRef(null);
  const anesthesiaRef = useRef(null);
  // get all save function from all component use ref
  const handleSaveDiagnosisClick = () => {
    diagRef.current?.handleSave();
    vitalRef.current?.handleSave();
    checklistRef.current?.handleSave();
    anesthesiaRef.current?.handleSave();
  };

  return (
    <>
      <Row gutter={15} className="r">
        <Col md={12}>
          {/* Procedure Care */}
          <Row>
            <Col md={24}>
              <Diagnosis ref={diagRef} procedure={procedure} user={user} />
            </Col>
          </Row>

          <AdministeredMedications
            title="Administered Medications"
            parentKey={procedure?.key}
            filterFieldName="procedureKey"
            medicationService={{
              useGetQuery: useGetProcedureAdministeredMedicationsQuery,
              useSaveMutation: useSaveProcedureAdministeredMedicationsMutation
            }}
            newMedicationTemplate={newApProcedureAdministeredMedications}
          />

          <Row>
            <Col md={24}>
              <PostProcedureAnesthesia ref={anesthesiaRef} procedure={procedure} user={user} />
            </Col>
          </Row>
        </Col>
        <Col md={12}>
          <Row>
            <Col md={24}>
              <ProcedureVitals ref={vitalRef} procedure={procedure} user={user} />
            </Col>
          </Row>

          <Row>
            <Col md={24}>
              <PostProcedureChecklist ref={checklistRef} procedure={procedure} user={user} />
            </Col>
          </Row>
        </Col>
      </Row>

      <div className="bt-div">
        <div className="bt-right">
          <MyButton onClick={handleSaveDiagnosisClick}>Save</MyButton>
          <MyButton>Create Follow-up</MyButton>
          <MyButton onClick={() => setActiveTab('5')}>Complete and Next</MyButton>
        </div>
      </div>
    </>
  );
};
export default PostProcedureCare;
