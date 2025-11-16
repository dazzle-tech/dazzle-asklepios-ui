import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect, useMemo } from 'react';
import { Panel, Row, Col } from 'rsuite';
import { useEnumOptions } from '@/services/enumsApi';
import { formatControlledEnumLabel } from '@/utils';
import {
  useCreateActiveIngredientMutation,
  useUpdateActiveIngredientMutation
} from '@/services/setup/activeIngredients/activeIngredientsService';
import { Block, Check } from '@rsuite/icons';
import { newActiveIngredient } from '@/types/model-types-constructor-new';
import { ActiveIngredient } from '@/types/model-types-new';
import { Form, Stack } from 'rsuite';
import MyInput from '@/components/MyInput';
import Indications from './Indications';
import Contraindications from './Contraindications';
import AdversEffectsAndToxicity from './AdversEffectsAndToxicity';
import DoseAdjustment from './DoseAdjustment';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import BackButton from '@/components/BackButton/BackButton';
import MOAAndPharmacokinetics from './MOAAndPharmacokinetics';
import DrugDrugAndFoodInteractions from './DrugDrugAndFoodInteractions';
import PregnancyLactationAndSpecialPopulation from './PregnancyLactationAndSpecialPopulation';
import Synonyms from './Synonyms';
import MyButton from '@/components/MyButton/MyButton';
import Section from '@/components/Section';
import PreRequestedTests from './Pre-requestedTests';
import MyTab from '@/components/MyTab';
import { sanitizeActiveIngredient } from './activeIngredientPayload';
import { useGetAllMedicationCategoriesQuery } from '@/services/setup/medication-categories/MedicationCategoriesService';
import { useGetAllMedicationCategoryClassesByCategoryQuery } from '@/services/setup/medication-categories/MedicationCategoriesClassService';

const createEmptyActiveIngredient = (): ActiveIngredient => ({
  ...newActiveIngredient
});

const NewActiveIngredients = ({ selectedactiveIngredient, goBack }) => {
  const dispatch = useAppDispatch();
  const [activeIngredient, setActiveIngredient] = useState<ActiveIngredient>(() =>
    createEmptyActiveIngredient()
  );
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [createActiveIngredient, createActiveIngredientMutation] =
    useCreateActiveIngredientMutation();
  const [updateActiveIngredient, updateActiveIngredientMutation] =
    useUpdateActiveIngredientMutation();
  // Fetch medication category data
  const { data: medicationCategories } = useGetAllMedicationCategoriesQuery(undefined);
  // Fetch medication class data once a category is chosen
  const { data: medicationClasses } = useGetAllMedicationCategoryClassesByCategoryQuery(
    activeIngredient.medicalCategoryId
      ? { id: activeIngredient.medicalCategoryId }
      : undefined,
    {
      skip: !activeIngredient.medicalCategoryId
    }
  );
  // Fetch controlled medications categories Lov response
const controlledOptions = useEnumOptions('ActiveIngredientsControlled', {
  labelFormatter: formatControlledEnumLabel
});

  // handle save
  const handleSave = async () => {
    const sanitized = sanitizeActiveIngredient(activeIngredient);
    const isUpdate = sanitized.id !== undefined && sanitized.id !== null;
    try {
      let response: ActiveIngredient;
      if (isUpdate) {
        response = await updateActiveIngredient(sanitized).unwrap();
      } else {
        const { id: _, ...createPayload } = sanitized;
        response = await createActiveIngredient(createPayload as ActiveIngredient).unwrap();
      }

      dispatch(
        notify({
          msg: `The active ingredient was successfully ${isUpdate ? 'updated' : 'created'}.`,
          sev: 'success'
        })
      );

      if (response) {
        setActiveIngredient({
          ...createEmptyActiveIngredient(),
          ...response
        });
      }
    } catch (error: any) {
      const message =
        error?.data?.message ??
        error?.data?.title ??
        error?.error ??
        'An unexpected error occurred while saving the active ingredient.';
      dispatch(
        notify({
          msg: message,
          sev: 'error'
        })
      );
    } 
  };

  // Effects
  useEffect(() => {
    if (createActiveIngredientMutation.isSuccess || updateActiveIngredientMutation.isSuccess) {
      setListRequest(prev => ({ ...prev, timestamp: Date.now() }));
    }
  }, [createActiveIngredientMutation.isSuccess, updateActiveIngredientMutation.isSuccess]);

  useEffect(() => {
    if (selectedactiveIngredient) {
      setActiveIngredient({
        ...createEmptyActiveIngredient(),
        ...selectedactiveIngredient
      });
    } else {
      setActiveIngredient(createEmptyActiveIngredient());
    }
  }, [selectedactiveIngredient]);

  useEffect(() => {
    if (!activeIngredient.isControlled && activeIngredient.controlled) {
      setActiveIngredient(prev => ({
        ...prev,
        controlled: null
      }));
    }
  }, [activeIngredient.isControlled, activeIngredient.controlled]);

  useEffect(() => {
    if (!activeIngredient.hasBlackBoxWarning && activeIngredient.blackBoxWarning) {
      setActiveIngredient(prev => ({
        ...prev,
        blackBoxWarning: null
      }));
    }
  }, [activeIngredient.hasBlackBoxWarning, activeIngredient.blackBoxWarning]);

  const isExisting = Boolean(activeIngredient?.id);

  const tabData = useMemo(
    () => [
      {
        title: 'Indications',
        content: (
          <Section
            title="Indications"
            content={<Indications selectedActiveIngredients={activeIngredient} />}
            setOpen={() => {}}
            rightLink=""
            openedContent={null}
            disabled={!isExisting}
          />
        ),
        disabled: !isExisting
      },
      {
        title: 'Contraindications',
        content: (
          <Section
            title="Contraindications"
            content={<Contraindications activeIngredients={activeIngredient} />}
            setOpen={() => {}}
            rightLink=""
            openedContent={null}
            disabled={!isExisting}
          />
        ),
        disabled: !isExisting
      },
      {
        title: 'Advers Effects & Toxicity',
        content: (
          <Section
            title="Advers Effects & Toxicity"
            content={<AdversEffectsAndToxicity activeIngredient={activeIngredient} />}
            setOpen={() => {}}
            rightLink=""
            openedContent={null}
            disabled={!isExisting}
          />
        ),
        disabled: !isExisting
      },
      {
        title: 'MOA & Pharmacokinetics',
        content: (
          <Section
            title="MOA & Pharmacokinetics"
            content={<MOAAndPharmacokinetics activeIngredient={activeIngredient} />}
            setOpen={() => {}}
            rightLink=""
            openedContent={null}
            disabled={!isExisting}
          />
        ),
        disabled: !isExisting
      },
      {
        title: 'Drug & Food Interactions',
        content: (
          <Section
            title="Drug & Food Interactions"
            content={<DrugDrugAndFoodInteractions activeIngredient={activeIngredient} />}
            setOpen={() => {}}
            rightLink=""
            openedContent={null}
            disabled={!isExisting}
          />
        ),
        disabled: !isExisting
      },
      {
        title: 'Special Population',
        content: (
          <Section
            title="Special Population"
            content={<PregnancyLactationAndSpecialPopulation activeIngredient={activeIngredient} />}
            setOpen={() => {}}
            rightLink=""
            openedContent={null}
            disabled={!isExisting}
          />
        ),
        disabled: !isExisting
      },
      {
        title: 'Dose Adjustment',
        content: (
          <Section
            title="Dose Adjustment"
            content={<DoseAdjustment activeIngredients={activeIngredient} />}
            setOpen={() => {}}
            rightLink=""
            openedContent={null}
            disabled={!isExisting}
          />
        ),
        disabled: !isExisting
      },
      {
        title: 'Synonyms',
        content: (
          <Section
            title="Synonyms"
            content={<Synonyms activeIngredients={activeIngredient} />}
            setOpen={() => {}}
            rightLink=""
            openedContent={null}
            disabled={!isExisting}
          />
        ),
        disabled: !isExisting
      },
      {
        title: 'Pre-requested Tests',
        content: (
          <Section
            title="Pre-requested Tests"
            content={<PreRequestedTests />}
            setOpen={() => {}}
            rightLink=""
            openedContent={null}
            disabled={!isExisting}
          />
        ),
        disabled: !isExisting
      }
    ],
    [activeIngredient, isExisting]
  );

  return (
    <Panel
      header={
        <h3 className="title">
          <Translate>New/Edit Active Ingredient</Translate>
        </h3>
      }
    >
      <div className="container-of-actions-header-active">
        <div>
          <BackButton onClick={goBack} />
        </div>
        <div className="container-of-buttons-active">
          <MyButton
            prefixIcon={() => <Check />}
            color="var(--deep-blue)"
            onClick={handleSave}
            title="Save"
            width="83px"
          >
            Save
          </MyButton>
          <MyButton
            appearance="ghost"
            prefixIcon={() => <Block />}
            color="var(--deep-blue)"
            onClick={() => {
              setActiveIngredient({
                ...createEmptyActiveIngredient(),
                name: '',
                medicalCategoryId: null,
                drugClassId: null,
                atcCode: null,
                isControlled: false,
                controlled: null,
                hasBlackBoxWarning: false,
                blackBoxWarning: null
              });
            }}
            title="Clear"
            width="83px"
          >
            Clear
          </MyButton>
        </div>
      </div>
      <br />
      <Panel
        header={
          <h5 className="title">
            <Translate>Basic Information</Translate>
          </h5>
        }
      >
        <Stack>
          <Stack.Item grow={5}>
            <Form fluid>
              <Row>
                <Col md={6}>
                  <MyInput
                    required
                    width="100%"
                    fieldName="name"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={6}>
                  <MyInput
                    width="100%"
                    fieldName="medicalCategoryId"
                    fieldType="select"
                    selectData={medicationCategories ?? []}
                    selectDataLabel="name"
                    selectDataValue="id"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                    fieldLabel="Medical Category"
                  />
                </Col>
                <Col md={6}>
                  <MyInput
                    width="100%"
                    fieldName="drugClassId"
                    fieldType="select"
                    selectData={medicationClasses ?? []}
                    selectDataLabel="name"
                    selectDataValue="id"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                    fieldLabel="Medication Class"
                  />
                </Col>
                <Col md={6}>
                  <MyInput
                    width="100%"
                    fieldLabel="ATC Code"
                    fieldName="atcCode"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
              </Row>
              <br />
              <Row>
                <Col md={6}>
                  <MyInput
                    width="100%"
                    fieldName="otc"
                    fieldLabel="OTC"
                    fieldType="checkbox"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={6}>
                  <MyInput
                    width="100%"
                    fieldName="hasSynonyms"
                    fieldType="checkbox"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={6}>
                  <MyInput
                    width="100%"
                    fieldName="antimicrobial"
                    fieldType="checkbox"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={6}>
                  <MyInput
                    width="100%"
                    fieldName="highRiskMed"
                    fieldType="checkbox"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
              
              </Row>
              <Row>
              <Col md={6}>
                  <MyInput
                    width="100%"
                    fieldName="abortiveMedication"
                    fieldType="checkbox"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={6}>
                  <MyInput
                    width="100%"
                    fieldName="laborInducingMed"
                    fieldType="checkbox"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={6}>
                  <MyInput
                    width="100%"
                    fieldName="isControlled"
                    fieldType="checkbox"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={6}>
                  {activeIngredient.isControlled && (
                    <MyInput
                      width="100%"
                      fieldName="controlled"
                      fieldType="select"
                      selectData={controlledOptions}
                      selectDataLabel="label"
                      selectDataValue="value"
                      record={activeIngredient}
                      setRecord={setActiveIngredient}
                    />
                  )}
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <MyInput
                    width="100%"
                    fieldName="hasBlackBoxWarning"
                    fieldType="checkbox"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={8}>
                  {activeIngredient.hasBlackBoxWarning && (
                    <MyInput
                      width="100%"
                      fieldName="blackBoxWarning"
                      fieldType="textarea"
                      rows={4}
                      record={activeIngredient}
                      setRecord={setActiveIngredient}
                    />
                  )}
                </Col>
              </Row>
              <br />
            </Form>
          </Stack.Item>
        </Stack>
        <MyTab 
         data={tabData}
        />
      </Panel>
    </Panel>
  );
};

export default NewActiveIngredients;
