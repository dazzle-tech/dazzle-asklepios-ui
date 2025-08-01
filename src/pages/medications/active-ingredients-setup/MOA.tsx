import React, { useEffect, useState } from 'react';
import { Row, Col, Text, Form } from 'rsuite';
import { MdSave } from 'react-icons/md';
import { ApActiveIngredient } from '@/types/model-types';
import { newApActiveIngredient } from '@/types/model-types-constructor';
import { useSaveActiveIngredientMutation } from '@/services/medicationsSetupService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import './styles.less';
const MOA = ({ activeIngredients }) => {
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
    <Form className="container-active" fluid>
      <div className="container-of-actions-header-active">
        <Text>Mechanism Of Actions</Text>
        <div className="container-of-buttons-active">
          <MyButton
            prefixIcon={() => <MdSave />}
            color="var(--deep-blue)"
            onClick={save}
            title="Save"
          ></MyButton>
        </div>
      </div>
      <br />
      <Row>
        <Col md={24}>
          <MyInput
            width="100%"
            fieldName="mechanismOfAction"
            fieldType="textarea"
            record={activeIngredient}
            setRecord={setActiveIngredient}
            showLabel={false}
            height={160}
          />
        </Col>
      </Row>
    </Form>
  );
};

export default MOA;
