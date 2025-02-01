import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Panel, Container, Row, Col, Button } from 'rsuite';
import {
  useGetLovValuesByCodeQuery,
  useGetLovValuesByCodeAndParentQuery
} from '@/services/setupService';
import{
  useGetActiveIngredientQuery,
  useSaveActiveIngredientMutation
} from '@/services/medicationsSetupService';
import { Accordion, ButtonToolbar, IconButton, Checkbox, TagGroup, Tag } from 'rsuite';
import { Block, Check, Edit, PlusRound, ArrowDown, ArrowUp } from '@rsuite/icons';
import PlusIcon from '@rsuite/icons/Plus';
import { ApActiveIngredient} from '@/types/model-types';
import { newApActiveIngredient } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useNavigate } from 'react-router-dom';
import ArowBackIcon from '@rsuite/icons/ArowBack';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import Indications from './Indications';
import Contraindications from './Contraindications';
import DrugDrugInteractions from './DrugDrugInteractions';
import AdversEffects from './AdversEffects';
import RecommendedDosage from './RecommendedDosage';
import MOA from './MOA';
import Toxicity from './Toxicity';
import PregnancyLactation from './PregnancyLactation';
import SpecialPopulation from './SpecialPopulation';
import DoseAdjustment from './DoseAdjustment';
import Pharmacokinetics from './Pharmacokinetics';
import DrugFoodInteractions from './DrugFoodInteractions';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

const NewActiveIngredients = ({ selectedactiveIngredient, goBack, ...props })  => {
  const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({ ...newApActiveIngredient });

  const navigate = useNavigate();
 
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });

  const [saveActiveIngredient, saveActiveIngredientMutation] = useSaveActiveIngredientMutation();

  const { data: activeIngredientListResponse } = useGetActiveIngredientQuery(listRequest);
  const { data: MedicationCategorLovQueryResponse } = useGetLovValuesByCodeQuery('MED_CATEGORY');
  const { data: MedicationClassLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'MED_ClASS',
    parentValueKey: activeIngredient.medicalCategoryLkey
  });
  const { data: MedicationTypesLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'MED_TYPES',
    parentValueKey: activeIngredient.drugClassLkey
  });
  const { data: ControlledMedicationsCategoriesLovQueryResponse } = useGetLovValuesByCodeQuery('CONTROL_MEDS');
  const [tags, setTags] = useState([]);
  const [typing, setTyping] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [editing, setEditing] = useState(false);
  const [isControlled, setIsControlled] = useState(false);
  const dispatch = useAppDispatch();
  const [validationResult, setValidationResult] = useState({});


  const [indicationsCollapsed, setIndicationsCollapsed] = useState(false);
  const [contraindicationsCollapsed, setContraindicationsCollapsed] = useState(false);
  const [drugDrugInteractionsCollapsed, setDrugDrugInteractionsCollapsed] = useState(false);
  const [drugFoodInteractionsCollapsed, setDrugFoodInteractionsCollapsed] = useState(false);
  const [adversEffectsCollapsed, setAdversEffectsCollapsed] = useState(false);
  const [recommendedDosageCollapsed, setRecommendedDosageCollapsed] = useState(false);
  const [moaCollapsed, setMoaCollapsed] = useState(false);
  const [toxicityCollapsed, setToxicityCollapsed] = useState(false);
  const [pregnancyLactationCollapsed, setPregnancyLactationCollapsed] = useState(false);
  const [specialPopulationCollapsed, setSpecialPopulationCollapsed] = useState(false);
  const [doseAdjustmentCollapsed, setDoseAdjustmentCollapsed] = useState(false);
  const [pharmacokineticsCollapsed, setPharmacokineticsCollapsed] = useState(false);
  const [input, setInput] = useState('');
  const [list, setList] = useState([]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleAddItem = () => {
    if (input.trim() !== '') {
      setList([...list, input]);
      setInput(''); 
    }
  };

  const [listRequestindication, setListRequestindication] = useState<ListRequest>(
    {
      ...initialListRequest,
      pageSize: 100,
      sortBy: 'createdAt',
      sortType: 'desc',
      filters: [
        {
          fieldName: 'active_ingredient_key',
          operator: 'match',
          value: selectedactiveIngredient.key
        },
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        }
      ]
    }
  );

  const removeTag = tag => {
    const nextTags = tags.filter(item => item !== tag);
    setTags(nextTags);
  };
 
  const addTag = () => {
    const nextTags = inputValue ? [...tags, inputValue] : tags;
    setTags(nextTags);
    setTyping(false);
    setInputValue('');
  };

  const handelTogglePanel = () => {
    setIndicationsCollapsed(true);
    setContraindicationsCollapsed(true);
    setDrugDrugInteractionsCollapsed(true);
    setDrugFoodInteractionsCollapsed(true);
    setAdversEffectsCollapsed(true);
    setRecommendedDosageCollapsed(true);
    setMoaCollapsed(true);
    setToxicityCollapsed(true);
    setPregnancyLactationCollapsed(true);
    setSpecialPopulationCollapsed(true);
    setDoseAdjustmentCollapsed(true);
    setPharmacokineticsCollapsed(true);
  }


  const handleButtonClick = () => {
    setTyping(true);
  };

  
  useEffect(() => {
    if (selectedactiveIngredient) {
      setActiveIngredient(selectedactiveIngredient);
    } else {
      setActiveIngredient(newApActiveIngredient);
    }
  }, [selectedactiveIngredient]);

  const renderInput = () => {
    if (typing) {
      return (
        <Input
          className="tag-input"
          size="xs"
          style={{ width: 70 }}
          value={inputValue}
          onChange={setInputValue}
          onBlur={addTag}
          onPressEnter={addTag}
        />
      );
    }
    return (
      <IconButton
        className="tag-add-btn"
        onClick={handleButtonClick}
        icon={<PlusIcon />}
        appearance="ghost"
        size="xs"
      />
    );
  };

  const handleNew = () => {
    setActiveIngredient({...newApActiveIngredient})
  };

  const handleGoBack = () => {
    navigate('/ActiveIngredientsSetup');
  };

    const handleSave = async () => {
      setEditing(true);
       try {
        const response = await  saveActiveIngredient(activeIngredient).unwrap();
        dispatch(notify(response.msg));
        
      } catch (error) {
        if (error.data && error.data.message) {
          dispatch(notify(error.data.message));
        } else {
          dispatch(notify("An unexpected error occurred"));
        }
      }
    };
    


  useEffect(() => {
    if (saveActiveIngredientMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveActiveIngredientMutation.data]);

  const isSelected = rowData => {
    if (rowData && activeIngredient && rowData.key === activeIngredient.key) {
      return 'selected-row';
    } else return '';
  };

  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };


  const [isCollapsed, setIsCollapsed] = useState(true);

  
  const handleToggleAll = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleIsControlled = () => {
    setIsControlled(!isControlled);
    console.log('Checkbox changed:', isControlled) ;
  }; 

  return (
    <Panel
      header={
        <h3 className="title">
          <Translate>New/Edit Active Ingredient</Translate>
        </h3>
      }
    >
      <ButtonToolbar>
      <IconButton appearance="ghost" color="cyan" icon={<ArowBackIcon />} onClick={goBack}>
              Go Back
            </IconButton>
            <Divider vertical />
            <IconButton
              appearance="primary"
              color="cyan"
              icon={<PlusRound />}
            >
              <Translate>New Active Ingredient</Translate>
            </IconButton>

            {/* <IconButton
              // disabled={editing || !localPatient.key}
              appearance="primary"
              color="orange"
              icon={<Edit />}
            >
              <Translate>Edit</Translate>
            </IconButton> */}

            <IconButton
              appearance="primary"
              color="green"
              // disabled={!editing}
              icon={<Check />}
              onClick={handleSave}
            >
              <Translate>Save</Translate>
            </IconButton>

            <IconButton appearance="primary" color="red" icon={<Block />}>
              <Translate>Clear</Translate>
            </IconButton>
      </ButtonToolbar>
      <hr />

      <Panel
          bordered
          header={
            <h5 className="title">
              <Translate>Basic Information</Translate>
            </h5>
          }
        >

       <Stack>
       <Stack.Item grow={5}>
        <Form layout="inline" fluid>
          <MyInput width={260} column fieldName="code" record={activeIngredient} setRecord={setActiveIngredient} />
          <MyInput  width={260} column fieldName="name" record={activeIngredient} setRecord={setActiveIngredient}/>
          
          <MyInput
           width={260}
           column
            fieldName="medicalCategoryLkey"
            fieldType="select"
            selectData={MedicationCategorLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={activeIngredient}
            setRecord={setActiveIngredient}
          />
           <MyInput
           width={260}
           column
            fieldName="drugClassLkey"
            fieldType="select"
            selectData={MedicationClassLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={activeIngredient}
            setRecord={setActiveIngredient}
          />
           <MyInput
            width={260}
            column
            fieldName="drugTypeLkey"
            fieldType="select"
            selectData={MedicationTypesLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={activeIngredient}
            setRecord={setActiveIngredient}
          />
            <MyInput  width={240} column fieldLabel="ATC Code" fieldName="atcCode"  record={activeIngredient} setRecord={setActiveIngredient} />
          <br/>
              <MyInput
                width={400}
                column
                fieldName="isControlled"
                fieldType="checkbox"
                record={activeIngredient}
                setRecord={setActiveIngredient}
              />
              {activeIngredient.isControlled && (

                <MyInput
                  width={200}
                  column
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
         
         <MyInput
          width={400}
            column
            fieldName="blackBoxWarning"
            fieldType="checkbox"
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={activeIngredient}
            setRecord={setActiveIngredient}
          />
            {activeIngredient.blackBoxWarning && (<MyInput
           width={350}
           column
            fieldName=""
            fieldType="textarea"
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={activeIngredient}
            isabled={!editing}
            setRecord={setActiveIngredient}
          />)}
       
          <MyInput
           width={400}
            column
            fieldName="hasSynonyms"
            fieldType="checkbox"
            selectDataValue="key"
            record={activeIngredient}
            setRecord={setActiveIngredient}
          />

      { activeIngredient.hasSynonyms &&
          (  <>
           <input 
             type="text" 
             value={input} 
             onChange={handleInputChange} 
             placeholder="Synonyms"
           />
                  <Button 
              appearance="primary" 
              color="blue" 
              onClick={handleAddItem}
            >
              Add
            </Button>
           
           <ul>
             {list.map((item, index) => (
               <li key={index}>{item}</li>
             ))}
           </ul>
         </>)
      }
          <br/>
          {/* <IconButton
              appearance="primary"
              color="green"
              // disabled={!editing}
              icon={<Check />}
              onClick={handleSave}
            >
              <Translate>Save</Translate>
            </IconButton> */}

          <IconButton
              disabled={!activeIngredient.key}
              checked={isCollapsed} 
              onClick={handleToggleAll}
              appearance="primary"
              color="blue"
              icon={isCollapsed ? <ArrowDown /> : <ArrowUp />}
            >
              <Translate> {isCollapsed ? "Expand All" : "Collapse All"} </Translate>
            </IconButton>
          
        </Form>
        </Stack.Item>
        </Stack>
             <Container>
            <Row>
                <Col xs={24} md={12}>
                <Panel>
                <Accordion bordered>
                  <Accordion.Panel header="Indications"   expanded={indicationsCollapsed || !isCollapsed}>
                  <Indications selectedActiveIngredients={selectedactiveIngredient} isEdit={true}/>
                  </Accordion.Panel>
                  <Accordion.Panel header="Contraindications" expanded={!isCollapsed}>
                 <Contraindications activeIngredients={activeIngredient} isEdit={true}/>
                  </Accordion.Panel>
                  <Accordion.Panel header="Drug-Drug Interactions " expanded={!isCollapsed}>
                    <DrugDrugInteractions activeIngredients={activeIngredient} isEdit={true}/>
                  </Accordion.Panel>
                  <Accordion.Panel header="Drug-Food Interactions " expanded={!isCollapsed}>
                    <DrugFoodInteractions activeIngredients={activeIngredient} isEdit={true}/>
                  </Accordion.Panel>
                  <Accordion.Panel header="Advers Effects " expanded={!isCollapsed}>
                    <AdversEffects activeIngredients={activeIngredient} isEdit={true}/>
                  </Accordion.Panel>
                  <Accordion.Panel header="Recommended Dosage " expanded={!isCollapsed}>
                    <RecommendedDosage activeIngredients={activeIngredient} isEdit={true} />
                  </Accordion.Panel>
                </Accordion>
        </Panel>
                </Col>
                <Col xs={24} md={12}>
                <Panel>
                <Accordion bordered>
                  <Accordion.Panel header="MOA" expanded={!isCollapsed} >
                    <MOA activeIngredients={activeIngredient} isEdit={true} />
                  </Accordion.Panel>
                  <Accordion.Panel header="Toxicity" expanded={!isCollapsed}>
                    <Toxicity activeIngredients={activeIngredient}  isEdit={true}/>
                  </Accordion.Panel>
                  <Accordion.Panel header="Pregnancy & Lactation" expanded={!isCollapsed}>
                    <PregnancyLactation activeIngredients={activeIngredient} isEdit={true}/>
                  </Accordion.Panel>
                  <Accordion.Panel header="Special Population" expanded={!isCollapsed}>
                    <SpecialPopulation activeIngredients={activeIngredient} isEdit={true} />
                  </Accordion.Panel>
                  <Accordion.Panel header="Dose Adjustment" expanded={!isCollapsed}>
                    <DoseAdjustment activeIngredients={activeIngredient} isEdit={true}/>
                  </Accordion.Panel>
                  <Accordion.Panel header="Pharmacokinetics" expanded={!isCollapsed} >
                    <Pharmacokinetics activeIngredients={activeIngredient} isEdit={true}/>
                  </Accordion.Panel>
                </Accordion>
        </Panel>
                </Col>
            </Row>
        </Container>
       
        </Panel>
    </Panel>
  );
};

export default NewActiveIngredients;
