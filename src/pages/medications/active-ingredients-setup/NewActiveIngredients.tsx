import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel, Row, Col } from 'rsuite';
import {
  useGetLovValuesByCodeQuery,
  useGetLovValuesByCodeAndParentQuery
} from '@/services/setupService';
import { useSaveActiveIngredientMutation } from '@/services/medicationsSetupService';
import { Block, Check } from '@rsuite/icons';
import { ApActiveIngredient } from '@/types/model-types';
import { newApActiveIngredient } from '@/types/model-types-constructor';
import { Form, Stack } from 'rsuite';
import MyInput from '@/components/MyInput';
import Indications from './Indications';
import Contraindications from './Contraindications';
import AdversEffects from './AdversEffects';
import Toxicity from './Toxicity';
import DoseAdjustment from './DoseAdjustment';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import BackButton from '@/components/BackButton/BackButton';
import { Tabs } from 'rsuite';
import MOAAndPharmacokinetics from './MOAAndPharmacokinetics';
import DrugDrugAndFoodInteractions from './DrugDrugAndFoodInteractions';
import PregnancyLactationAndSpecialPopulation from './PregnancyLactationAndSpecialPopulation';
import Synonyms from './Synonyms';
import MyButton from '@/components/MyButton/MyButton';
import Section from '@/components/Section';
import PreRequestedTests from './Pre-requestedTests';
import MyTab from '@/components/MyTab';
const NewActiveIngredients = ({ selectedactiveIngredient, goBack }) => {
  const dispatch = useAppDispatch();
  const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({
    ...newApActiveIngredient
  });
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  // save active ingredient
  const [saveActiveIngredient, saveActiveIngredientMutation] = useSaveActiveIngredientMutation();
  // Fetch medication categor Lov response
  const { data: MedicationCategorLovQueryResponse } = useGetLovValuesByCodeQuery('MED_CATEGORY');
  // Fetch medication class Lov response
  const { data: MedicationClassLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'MED_ClASS',
    parentValueKey: activeIngredient.medicalCategoryLkey
  });
  // Fetch medication types Lov response
  const { data: MedicationTypesLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'MED_TYPES',
    parentValueKey: activeIngredient.drugClassLkey
  });
  // Fetch controlled medications categories Lov response
  const { data: ControlledMedicationsCategoriesLovQueryResponse } =
    useGetLovValuesByCodeQuery('CONTROL_MEDS');
  const [editing, setEditing] = useState(false);

  // handle save
  const handleSave = async () => {
    setEditing(true);
    try {
      const response = await saveActiveIngredient(activeIngredient).unwrap();
      dispatch(notify({ msg: response.msg, sev: 'success' }));
      console.log(response.msg);
    } catch (error) {
      if (error.data && error.data.message) {
        dispatch(notify(error.data.message));
      } else {
        dispatch(notify('An unexpected error occurred'));
      }
    }
  };

  // Effects
  useEffect(() => {
    if (saveActiveIngredientMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveActiveIngredientMutation.data]);

  useEffect(() => {
    if (selectedactiveIngredient) {
      setActiveIngredient(selectedactiveIngredient);
    } else {
      setActiveIngredient(newApActiveIngredient);
    }
  }, [selectedactiveIngredient]);

  const TabData = [
    {
      title: 'Indications',
      content: (
          <Section
            title="Indications"
            content={<Indications selectedActiveIngredients={selectedactiveIngredient} />}
          />
      )
    },
    {
      title: 'Contraindications',
      content: (
          <Section
            title="Contraindications"
            content={<Contraindications activeIngredients={activeIngredient} />}
          />
      )
    },
    {
      title: 'Advers Effects',
      content: (
          <AdversEffects activeIngredients={activeIngredient} />
      )
    },
    {
      title: 'Toxicity',
      content: (
          <Section title="Toxicity" content={<Toxicity activeIngredients={activeIngredient} />} />
      )
    },
    {
      title: 'MOA & Pharmacokinetics',
      content: (
          <MOAAndPharmacokinetics activeIngredient={activeIngredient} />
      )
    },
    {
      title: 'Drug Drug & Food Interactions',
      content: (
          <DrugDrugAndFoodInteractions activeIngredient={activeIngredient} />
      )
    },
    {
      title: 'Pregnancy / Lactation & Special Population',
      content: (
          <PregnancyLactationAndSpecialPopulation activeIngredient={activeIngredient} />
      )
    },
    {
      title: 'Dose Adjustment',
      content: (
          <Section
            title="Dose Adjustment"
            content={<DoseAdjustment activeIngredients={activeIngredient} />}
          />
      )
    },
    {
      title: 'Synonyms',
      content: (
          <Section title="Synonyms" content={<Synonyms activeIngredients={activeIngredient} />} />
      )
    },
    {
      title: 'Pre-requested Tests',
      content: (
          <Section
            title="Pre-requested Tests"
            content={<PreRequestedTests activeIngredients={activeIngredient} />}
          />
      )
    }
  ];

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
            onClick={() =>
              setActiveIngredient({
                ...newApActiveIngredient
              })
            }
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
                <Col md={4}>
                  <MyInput
                    required
                    width="100%"
                    fieldName="code"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={4}>
                  <MyInput
                    required
                    width="100%"
                    fieldName="name"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={4}>
                  <MyInput
                    required
                    width="100%"
                    fieldName="medicalCategoryLkey"
                    fieldType="select"
                    selectData={MedicationCategorLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={4}>
                  <MyInput
                    required
                    width="100%"
                    fieldName="drugClassLkey"
                    fieldType="select"
                    selectData={MedicationClassLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={4}>
                  <MyInput
                    required
                    width="100%"
                    fieldName="drugTypeLkey"
                    fieldType="select"
                    selectData={MedicationTypesLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={4}>
                  <MyInput
                    required
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
                <Col md={4}>
                  <MyInput
                    width={400}
                    fieldName="otc"
                    fieldLabel="OTC"
                    fieldType="checkbox"
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={4}>
                  <MyInput
                    width="100%"
                    fieldName="hasSynonyms"
                    fieldType="checkbox"
                    selectDataValue="key"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={4}>
                  <MyInput
                    width={400}
                    fieldName="Antimicrobial"
                    fieldType="checkbox"
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={4}>
                  <MyInput
                    width={400}
                    fieldName="HighRiskMed"
                    fieldType="checkbox"
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={4}>
                  <MyInput
                    width={400}
                    fieldName="AbortiveMedication"
                    fieldType="checkbox"
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={4}>
                  <MyInput
                    width={400}
                    fieldName="LaborInducingMed"
                    fieldType="checkbox"
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <MyInput
                    width="100%"
                    fieldName="isControlled"
                    fieldType="checkbox"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>

                <Col md={4}>
                  {activeIngredient.isControlled && (
                    <MyInput
                      width="100%"
                      fieldName="controlledLkey"
                      fieldType="select"
                      selectData={ControlledMedicationsCategoriesLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={activeIngredient}
                      isabled={!editing}
                      setRecord={setActiveIngredient}
                    />
                  )}
                </Col>
                <Col md={4}></Col>
                <Col md={4}>
                  <MyInput
                    width="100%"
                    fieldName="blackBoxWarning"
                    fieldType="checkbox"
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={activeIngredient}
                    setRecord={setActiveIngredient}
                  />
                </Col>
                <Col md={4}>
                  {activeIngredient.blackBoxWarning && (
                    <MyInput
                      width="100%"
                      fieldName=""
                      fieldType="textarea"
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={activeIngredient}
                      isabled={!editing}
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
         data={TabData}
        />
      </Panel>
    </Panel>
  );
};

export default NewActiveIngredients;
