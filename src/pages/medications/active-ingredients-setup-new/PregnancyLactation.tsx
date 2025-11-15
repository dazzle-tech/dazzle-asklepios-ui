import React, { useEffect, useState } from 'react';
import { Row, Col, Form } from 'rsuite';
import { MdSave } from 'react-icons/md';
import { newActiveIngredient } from '@/types/model-types-constructor-new';
import { ActiveIngredient } from '@/types/model-types-new';
import { useUpdateActiveIngredientMutation } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
import { sanitizeActiveIngredient } from './activeIngredientPayload';
const PregnancyLactation = ({ activeIngredients }) => {
  const dispatch = useAppDispatch();
  const [activeIngredient, setActiveIngredient] = useState<ActiveIngredient>({
    ...newActiveIngredient
  });
  // Fetch pregnancy categories Lov response
  const { data: pregnancyCategoriesLovQueryResponseData } =
    useGetLovValuesByCodeQuery('PREGNANCY_CATEGORIES');
  // Fetch breast feeding categories Lov response
  const { data: breastfeedingCategoriesLovQueryResponseData } =
    useGetLovValuesByCodeQuery('FR_MED_CATEGORIES');
  // save active ingredient
  const [updateActiveIngredient, { isLoading: isSaving }] = useUpdateActiveIngredientMutation();

  // handle save
  const save = () => {
    if (!activeIngredient?.id) {
      dispatch(notify({ msg: 'Please save the basic information first.', sev: 'warning' }));
      return;
    }

    const payload = sanitizeActiveIngredient(activeIngredient);

    updateActiveIngredient(payload)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Pregnancy & Lactation saved successfully.', sev: 'success' }));
      })
      .catch(error => {
        const message =
          error?.data?.message ??
          error?.data?.detail ??
          error?.message ??
          'Failed to save pregnancy & lactation.';
        dispatch(notify({ msg: message, sev: 'error' }));
      });
  };

  // Effects
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
      <Row>
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
      </Row>
      <br />
      <Row>
        <Col md={12}>
          <MyInput
            fieldType="select"
            selectData={pregnancyCategoriesLovQueryResponseData?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            width="100%"
            fieldName="pregnancyCategoryLkey"
            fieldLabel="Pregnancy Category"
            record={activeIngredient}
            setRecord={setActiveIngredient}
          />
        </Col>
        <Col md={12}>
          <MyInput
            fieldType="select"
            selectData={breastfeedingCategoriesLovQueryResponseData?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            width="100%"
            fieldName="lactationRiskLkey"
            fieldLabel="Breastfeeding Category"
            record={activeIngredient}
            setRecord={setActiveIngredient}           
          />
        </Col>
      </Row>
      <br />
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="pregnancyNotes"
            fieldLabel="Description"
            fieldType="textarea"
            record={activeIngredient}
            setRecord={setActiveIngredient}
            height={140}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="lactationRiskNotes"
            fieldLabel="Description"
            fieldType="textarea"
            record={activeIngredient}
            setRecord={setActiveIngredient}
            height={140}
          />
        </Col>
      </Row>
    </Form>
  );
};

export default PregnancyLactation;
