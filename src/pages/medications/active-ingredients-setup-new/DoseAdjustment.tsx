import React, { useEffect, useState } from 'react';
import { Row, Col, Form } from 'rsuite';
import { MdSave } from 'react-icons/md';
import { newActiveIngredient } from '@/types/model-types-constructor-new';
import { ActiveIngredient } from '@/types/model-types-new';
import { useUpdateActiveIngredientMutation } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { sanitizeActiveIngredient } from './activeIngredientPayload';

const DoseAdjustment = ({ activeIngredients }) => {
  const dispatch = useAppDispatch();
  const [activeIngredient, setActiveIngredient] = useState<ActiveIngredient>({
    ...newActiveIngredient
  });
  const [updateActiveIngredient, { isLoading: isSaving }] = useUpdateActiveIngredientMutation();

  const save = () => {
    if (!activeIngredient?.id) {
      dispatch(notify({ msg: 'Please save the basic information first.', sev: 'warning' }));
      return;
    }

    const payload = sanitizeActiveIngredient(activeIngredient);

    updateActiveIngredient(payload)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Dose adjustment saved successfully.', sev: 'success' }));
      })
      .catch(error => {
        const message =
          error?.data?.message ??
          error?.data?.detail ??
          error?.message ??
          'Failed to save dose adjustment.';
        dispatch(notify({ msg: message, sev: 'error' }));
      });
  };

  useEffect(() => {
    if (activeIngredients) {
      setActiveIngredient(prev => ({
        ...prev,
        ...activeIngredients
      }));
    } else {
      setActiveIngredient({
        ...newActiveIngredient
      });
    }
  }, [activeIngredients]);

  return (
    <Form fluid>
      <div className="container-of-buttons-pregnancy-lactation">
        <MyButton
          prefixIcon={() => <MdSave />}
          color="var(--deep-blue)"
          onClick={save}
          title="Save"
          loading={isSaving}
          disabled={isSaving}
        ></MyButton>
      </div>
      <Row>
        <Col md={12}>
          <MyInput
            width={200}
            column
            fieldLabel="Renal Adjustment"
            fieldType="check"
            showLabel={false}
            fieldName="doseAdjustmentRenal"
            record={activeIngredient}
            setRecord={setActiveIngredient}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width={200}
            column
            fieldLabel="Hepatic Adjustment"
            fieldType="check"
            showLabel={false}
            fieldName="doseAdjustmentHepatic"
            record={activeIngredient}
            setRecord={setActiveIngredient}
          />
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          {activeIngredient?.doseAdjustmentRenal && (
            <MyInput
              width="100%"
              fieldName="doseAdjustmentRenalOne"
              fieldLabel="CrCl 60-89 mL/min"
              fieldType="text"
              record={activeIngredient}
              setRecord={setActiveIngredient}
            />
          )}
        </Col>
        <Col md={12}>
          {activeIngredient?.doseAdjustmentHepatic && (
            <MyInput
              width="100%"
              fieldName="doseAdjustmentPugA"
              fieldLabel="Child-Pugh A"
              fieldType="text"
              record={activeIngredient}
              setRecord={setActiveIngredient}
            />
          )}
        </Col>
      </Row>
      <br />
      <Row>
        <Col md={12}>
          {activeIngredient?.doseAdjustmentRenal && (
            <MyInput
              width="100%"
              fieldName="doseAdjustmentRenalTwo"
              fieldLabel="CrCl 30 to < 60 mL/min"
              fieldType="text"
              record={activeIngredient}
              setRecord={setActiveIngredient}
            />
          )}
        </Col>
        <Col md={12}>
          {activeIngredient?.doseAdjustmentHepatic && (
            <MyInput
              width="100%"
              fieldName="doseAdjustmentPugB"
              fieldLabel="Child-Pugh B"
              fieldType="text"
              record={activeIngredient}
              setRecord={setActiveIngredient}
            />
          )}
        </Col>
      </Row>
      <br />
      <Row>
        <Col md={12}>
          {activeIngredient?.doseAdjustmentRenal && (
            <MyInput
              width="100%"
              fieldName="doseAdjustmentRenalThree"
              fieldLabel="CrCl 15 to < 30 mL/min"
              fieldType="text"
              record={activeIngredient}
              setRecord={setActiveIngredient}
            />
          )}
        </Col>
        <Col md={12}>
          {activeIngredient?.doseAdjustmentHepatic && (
            <MyInput
              width="100%"
              fieldName="doseAdjustmentPugC"
              fieldLabel="Child-Pugh C"
              fieldType="text"
              record={activeIngredient}
              setRecord={setActiveIngredient}
            />
          )}
        </Col>
      </Row>
      <br />
      <Row>
        <Col md={12}>
          {activeIngredient?.doseAdjustmentRenal && (
            <MyInput
              width="100%"
              fieldName="doseAdjustmentRenalFour"
              fieldLabel="CrCl < 15 mL/min"
              fieldType="text"
              record={activeIngredient}
              setRecord={setActiveIngredient}
            />
          )}
        </Col>
      </Row>
    </Form>
  );
};

export default DoseAdjustment;
