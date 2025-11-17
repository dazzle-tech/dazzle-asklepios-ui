import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { MdSave } from 'react-icons/md';
import { newActiveIngredient } from '@/types/model-types-constructor-new';
import { ActiveIngredient } from '@/types/model-types-new';
import { useUpdateActiveIngredientMutation } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { sanitizeActiveIngredient } from './activeIngredientPayload';

const Toxicity = ({ activeIngredients }) => {
  const dispatch = useAppDispatch();
  const [activeIngredient, setActiveIngredient] = useState<ActiveIngredient>({
    ...newActiveIngredient
  });

  const { data: valueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
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
        dispatch(notify({ msg: 'Toxicity information saved successfully.', sev: 'success' }));
      })
      .catch(error => {
        const message =
          error?.data?.message ??
          error?.data?.detail ??
          error?.message ??
          'Failed to save toxicity information.';
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
      <div className="container-of-actions-header-active">
        <div className="container-of-fields-active">
          <MyInput
            fieldLabel="Maximum Dose"
            fieldName="toxicityMaximumDose"
            record={activeIngredient}
            setRecord={setActiveIngredient}

            width={150}
          />
          <MyInput
            fieldType="select"
            selectData={valueUnitLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            fieldName="toxicityMaximumDosePerUnit"
            fieldLabel="Per"
            record={activeIngredient}
            setRecord={setActiveIngredient}
            width={150}
            menuMaxHeight={200}
            height={30}
          />
        </div>
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
      <MyInput
        fieldLabel="Toxicity"
        fieldName="toxicityDetails"
        record={activeIngredient}
        setRecord={setActiveIngredient}
        width="100%"
        fieldType="textarea"
        height={161}
      />
    </Form>
  );
};

export default Toxicity;
