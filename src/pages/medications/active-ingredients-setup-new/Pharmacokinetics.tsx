import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Form, TagPicker } from 'rsuite';
import { MdSave } from 'react-icons/md';
import { newActiveIngredient } from '@/types/model-types-constructor-new';
import { ActiveIngredient } from '@/types/model-types-new';
import { useUpdateActiveIngredientMutation } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { sanitizeActiveIngredient } from './activeIngredientPayload';

const Pharmacokinetics = ({ activeIngredients }) => {
  const dispatch = useAppDispatch();
  const [activeIngredient, setActiveIngredient] = useState<ActiveIngredient>({
    ...newActiveIngredient
  });
  const [updateActiveIngredient, { isLoading: isSaving }] = useUpdateActiveIngredientMutation();
  const { data: routeOfEliminationLovResponse } = useGetLovValuesByCodeQuery('MED_ROUT_OF_ELIMIN');

  const routeOptions = useMemo(
    () =>
      (routeOfEliminationLovResponse?.object ?? []).map(item => ({
        label: item.lovDisplayVale,
        value: item.key
      })),
    [routeOfEliminationLovResponse]
  );

  const save = () => {
    if (!activeIngredient?.id) {
      dispatch(notify({ msg: 'Please save the basic information first.', sev: 'warning' }));
      return;
    }

    const payload = sanitizeActiveIngredient(activeIngredient);

    updateActiveIngredient(payload)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Pharmacokinetics saved successfully.', sev: 'success' }));
      })
      .catch(error => {
        const message =
          error?.data?.message ??
          error?.data?.detail ??
          error?.message ??
          'Failed to save pharmacokinetics.';
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
      <Row>
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'end', padding: '5px' }}>
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
          <div className="my-input-label">Route Of Elimination</div>
          <TagPicker
            data={routeOptions}
            value={
              activeIngredient.pharmaRouteOfElimination
                ? activeIngredient.pharmaRouteOfElimination.split(',').map(entry => entry.trim()).filter(Boolean)
                : []
            }
            onChange={values => {
              setActiveIngredient(prev => ({
                ...prev,
                pharmaRouteOfElimination: values && values.length ? values.join(',') : null
              }));
            }}
            placeholder="Select route"
            cleanable
            style={{ width: '100%' }}
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
