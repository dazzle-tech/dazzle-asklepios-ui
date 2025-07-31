import React, { useEffect, useState } from 'react';
import { Row, Col, Form } from 'rsuite';
import { MdSave } from 'react-icons/md';
import { ApActiveIngredient } from '@/types/model-types';
import { newApActiveIngredient } from '@/types/model-types-constructor';
import { useSaveActiveIngredientMutation } from '@/services/medicationsSetupService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
const PregnancyLactation = ({ activeIngredients }) => {
  const dispatch = useAppDispatch();
  const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({
    ...newApActiveIngredient
  });
  // Fetch pregnancy categories Lov response
  const { data: pregnancyCategoriesLovQueryResponseData } =
    useGetLovValuesByCodeQuery('PREGNANCY_CATEGORIES');
  // Fetch breast feeding categories Lov response
  const { data: breastfeedingCategoriesLovQueryResponseData } =
    useGetLovValuesByCodeQuery('FR_MED_CATEGORIES');
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
    <Form fluid>
      <Row>
        <div className="container-of-buttons-pregnancy-lactation">
          <MyButton
            prefixIcon={() => <MdSave />}
            color="var(--deep-blue)"
            onClick={save}
            title="Save"
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
            required
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
            required
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
            required
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
            required
            height={140}
          />
        </Col>
      </Row>
    </Form>
  );
};

export default PregnancyLactation;
