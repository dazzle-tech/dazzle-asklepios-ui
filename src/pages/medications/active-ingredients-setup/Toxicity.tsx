import React, { useEffect, useState } from 'react';
import {
  Form
} from 'rsuite';
import { MdSave } from 'react-icons/md';
import { newApActiveIngredient } from '@/types/model-types-constructor';
import {
  useSaveActiveIngredientMutation
} from '@/services/medicationsSetupService';
import { ApActiveIngredient } from '@/types/model-types';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';

const Toxicity = ({ activeIngredients }) => {
  const dispatch = useAppDispatch();
  const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({
    ...newApActiveIngredient
  });
  // Fetch value unit Lov response
   const { data: valueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
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
    <Form fluid >
      <div className='container-of-actions-header-active'>
        <div className='container-of-fields-active'>
          <MyInput
            fieldLabel="Maximum Dose"
            fieldName="toxicityMaximumDose"
            record={activeIngredient}
            setRecord={setActiveIngredient}
            required
            width={150}
          />
          <MyInput
            fieldType="select"
            selectData={valueUnitLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            fieldName="toxicityMaximumDosePerUnitLkey"
            fieldLabel="Per"
            record={activeIngredient}
            setRecord={setActiveIngredient}
            required
            width={150}
            menuMaxHeight={200}
            height={30}
          />
          </div>
        <div className='container-of-buttons-active'>
          <MyButton
            prefixIcon={() => <MdSave />}
            color="var(--deep-blue)"
            onClick={save}
            title="Save"
          >
          </MyButton>
        </div>
      </div>
        <MyInput
            fieldLabel="Toxicity"
            fieldName="toxicityDetails"
            record={activeIngredient}
            setRecord={setActiveIngredient}
            required
            width="100%"
            fieldType='textarea'
            height={161}
          />
    </Form>
  );
};

export default Toxicity;
