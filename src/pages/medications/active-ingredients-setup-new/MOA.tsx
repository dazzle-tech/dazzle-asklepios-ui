import React, { useEffect, useState } from 'react';
import { Row, Col, Text, Form } from 'rsuite';
import { MdSave } from 'react-icons/md';
import { newActiveIngredient } from '@/types/model-types-constructor-new';
import { ActiveIngredient } from '@/types/model-types-new';
import { useUpdateActiveIngredientMutation } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import './styles.less';
import { sanitizeActiveIngredient } from './activeIngredientPayload';

const MOA = ({ activeIngredients }) => {
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
        dispatch(notify({ msg: 'Mechanism of action saved successfully.', sev: 'success' }));
      })
      .catch(error => {
        const message =
          error?.data?.message ??
          error?.data?.detail ??
          error?.message ??
          'Failed to save mechanism of action.';
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
    <Form className="container-active" fluid>
      <div className="container-of-actions-header-active">
        <Text>Mechanism Of Actions</Text>
        <div className="container-of-buttons-active">
          <MyButton
            prefixIcon={() => <MdSave />}
            color="var(--deep-blue)"
            onClick={save}
            title="Save"
            loading={isSaving}
            disabled={isSaving}
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
