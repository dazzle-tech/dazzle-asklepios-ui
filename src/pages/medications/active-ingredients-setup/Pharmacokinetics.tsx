import React, { useEffect, useState } from 'react';
import { Row, Col, Form } from 'rsuite';
import { MdSave } from 'react-icons/md';
import { newApActiveIngredient } from '@/types/model-types-constructor';
import { ApActiveIngredient } from '@/types/model-types';
import { useSaveActiveIngredientMutation } from '@/services/medicationsSetupService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
const Pharmacokinetics = ({ activeIngredients }) => {
  const dispatch = useAppDispatch();
  const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({
    ...newApActiveIngredient
  });
  // save active ingredient
  const [saveActiveIngredient] = useSaveActiveIngredientMutation();

  // handleSave
  const save = () => {
    saveActiveIngredient({
      ...activeIngredient,
      createdBy: 'Administrator'
    })
      .unwrap()
      .then(() => {
        dispatch(notify('Saved successfully'));
      });
  };

  // Effects
  useEffect(() => {
    if (activeIngredients) {
      setActiveIngredient(activeIngredients);
    }
  }, [activeIngredients]);

  return (
    <Form fluid>
      <Row>
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'end', padding: '5px' }}>
          <MyButton
            prefixIcon={() => <MdSave />}
            color="var(--deep-blue)"
            onClick={save}
            title="Save"
          ></MyButton>
        </div>
      </Row>
      <Row>
        <Col md={24}>
          <MyInput
            fieldName="pharmaAbsorption"
            fieldType="textarea"
            fieldLabel="Absorption"
            record={activeIngredient}
            setRecord={setActiveIngredient}
            width="100%"
          />
        </Col>
      </Row>
      <br />
      <Row>
        <Col md={8}>
          <MyInput
            fieldName="pharmaRouteOfElimination"
            fieldType="textarea"
            fieldLabel="Rout Of Elimination"
            record={activeIngredient}
            setRecord={setActiveIngredient}
            width="100%"
          />
        </Col>
        <Col md={8}>
          <MyInput
            fieldName="pharmaVolumeOfDistribution"
            fieldType="textarea"
            fieldLabel="Volume Of Distribution"
            record={activeIngredient}
            setRecord={setActiveIngredient}
            width="100%"
          />
        </Col>
        <Col md={8}>
          <MyInput
            fieldName="pharmaHalfLife"
            fieldType="textarea"
            fieldLabel="Half-Life"
            record={activeIngredient}
            setRecord={setActiveIngredient}
            width="100%"
          />
        </Col>
      </Row>
      <br />
      <Row>
        <Col md={8}>
          <MyInput
            fieldName="pharmaProteinBinding"
            fieldType="textarea"
            fieldLabel="Protein Binding"
            record={activeIngredient}
            setRecord={setActiveIngredient}
            width="100%"
          />
        </Col>
        <Col md={8}>
          <MyInput
            fieldName="pharmaClearance"
            fieldType="textarea"
            fieldLabel="Clearance"
            record={activeIngredient}
            setRecord={setActiveIngredient}
            width="100%"
          />
        </Col>
        <Col md={8}>
          <MyInput
            fieldName="pharmaMetabolism"
            fieldType="textarea"
            fieldLabel="Metabolism"
            record={activeIngredient}
            setRecord={setActiveIngredient}
            width="100%"
          />
        </Col>
      </Row>
    </Form>
  );
};

export default Pharmacokinetics;
