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

const DoseAdjustment = ({ activeIngredients }) => {
  const dispatch = useAppDispatch();
  const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({
    ...newApActiveIngredient
  });
  // save active ingredient
  const [saveActiveIngredient] = useSaveActiveIngredientMutation();

  // handle save
  const save = () => {
    saveActiveIngredient({
      ...activeIngredient,
      createdBy: 'Administrator'
    })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Added successfully', sev: 'success' }));
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
      <div className="container-of-buttons-pregnancy-lactation">
        <MyButton
          prefixIcon={() => <MdSave />}
          color="var(--deep-blue)"
          onClick={save}
          title="Save"
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
              fieldName="doseAdjRenalOne"
              fieldLabel="CrCl 60-89 mL/min"
              fieldType="textarea"
              record={activeIngredient}
              setRecord={setActiveIngredient}
            />
          )}
        </Col>
        <Col md={12}>
          {activeIngredient?.doseAdjustmentHepatic && (
            <MyInput
              width="100%"
              fieldName="doseAdjPugA"
              fieldLabel="child-Pug A"
              fieldType="textarea"
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
              fieldName="doseAdjRenalTwo"
              fieldLabel="CrCl 30 to & lt;60 mL/min"
              fieldType="textarea"
              record={activeIngredient}
              setRecord={setActiveIngredient}
            />
          )}
        </Col>
        <Col md={12}>
          {activeIngredient?.doseAdjustmentHepatic && (
            <MyInput
              width="100%"
              fieldName="doseAdjPugB"
              fieldLAbel="child-Pug B"
              fieldType="textarea"
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
              fieldName="doseAdjRenalThree"
              fieldLabel="CrCl 15 to & lt;30 mL/min"
              fieldType="textarea"
              record={activeIngredient}
              setRecord={setActiveIngredient}
            />
          )}
        </Col>
        <Col md={12}>
          {activeIngredient?.doseAdjustmentHepatic && (
            <MyInput
              width="100%"
              fieldName="doseAdjPugC"
              fieldLabel="child-Pug C"
              fieldType="textarea"
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
              fieldName="doseAdjRenalFour"
              fieldLabel="CrCl & lt;15 mL/min"
              fieldType="textarea"
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
