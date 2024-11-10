import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Panel, Container, Row, Col, Table, Button, InlineEdit, TagPicker } from 'rsuite';
import {
  useGetDiagnosticsTestTypeQuery,
  useGetLovValuesByCodeQuery,
  useSaveDiagnosticsTestMutation,
  useSaveDiagnosticsTestSpecialPopulationMutation
} from '@/services/setupService';
import {
  useGetActiveIngredientQuery,
  useSaveActiveIngredientMutation
} from '@/services/medicationsSetupService';
import { Accordion, ButtonToolbar, IconButton, Checkbox, TagGroup, Tag, Modal, CheckboxGroup, InputGroup } from 'rsuite';
import { Block, Check, Edit, PlusRound, ArrowDown, ArrowUp } from '@rsuite/icons';
import PlusIcon from '@rsuite/icons/Plus';
import { ApActiveIngredient, ApDiagnosticTest, ApDiagnosticTestSpecialPopulation } from '@/types/model-types';
import { newApActiveIngredient, newApDiagnosticTest, newApDiagnosticTestSpecialPopulation } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useNavigate } from 'react-router-dom';
import ArowBackIcon from '@rsuite/icons/ArowBack';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import Laboratory from './Laboratory';
import Pathology from './Pathology';
import Radiology from './Radiology';
import Genetics from './Genetics';
// import EyeExam from './EyeExam';
import { isNil } from 'lodash';

const { Column, HeaderCell, Cell } = Table;

const NewDiagnosticsTest = ({ selectedDiagnosticsTest, goBack, ...props }) => {
  const navigate = useNavigate();
     const [basicDataSaved, setBasicDataSaved] = useState(false);
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [diagnosticsTest, setDiagnosticsTest] = useState<ApDiagnosticTest>({ ...newApDiagnosticTest });
  const [saveDiagnosticsTest, saveDiagnosticsTestMutation] = useSaveDiagnosticsTestMutation();
  const [diagnosticTestSpecialPopulation, setDiagnosticTestSpecialPopulation] = useState<ApDiagnosticTestSpecialPopulation>({...newApDiagnosticTestSpecialPopulation});
  const [saveDiagnosticsTestSpecialPopulation, saveDiagnosticsTestpecialPopulationMutation] = useSaveDiagnosticsTestSpecialPopulationMutation();
  
  const { data: DiagnosticsTestTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_TEST-TYPES');
  
  const { data: CurrencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
  const { data: GenderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  const { data: SpecialPopulationLovQueryResponse } = useGetLovValuesByCodeQuery('SPECIAL_POPULATION_GROUPS');
  const { data: AgeGroupLovQueryResponse } = useGetLovValuesByCodeQuery('AGE_GROUPS');
  const { data: LabReagentsLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_REAGENTS');
  const [tags, setTags] = useState([]);
  const [typing, setTyping] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [editing, setEditing] = useState(false);
  const [ageDetails, setAgeDetails] = useState(false);
  const [genderDetails, setGenderDetails] = useState(false);
  const [specialPopulationDetails, setSpecialPopulationDetails] = useState(false);
  const [ageGroupSpecificDetails, setAgeGroupSpecificDetailsDetails] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [componentToDisplay, setComponentToDisplay ] =useState("");
  const removeTag = tag => {
    const nextTags = tags.filter(item => item !== tag);
    setTags(nextTags);
  };

  const matchingItem =  useGetDiagnosticsTestTypeQuery(diagnosticsTest.testTypeLkey || '');

  const addTag = () => {
    const nextTags = inputValue ? [...tags, inputValue] : tags;
    setTags(nextTags);
    setTyping(false);
    setInputValue('');
  };

  const handleButtonClick = () => {
    setTyping(true);
  };

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

  const handleGoBack = () => {
    navigate('/DiagnosticsTest');
  };


  useEffect(() => {
    if (saveDiagnosticsTestMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveDiagnosticsTestMutation.data]);

  useEffect(() => {
    if (selectedDiagnosticsTest) {
      setDiagnosticsTest(selectedDiagnosticsTest);
      setBasicDataSaved(true);
    } else {
      setDiagnosticsTest(newApDiagnosticTest);
    }
  }, [selectedDiagnosticsTest]);


  const isSelected = rowData => {
    if (rowData && diagnosticsTest && rowData.key === diagnosticsTest.key) {
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


  const handleSaveBasicInfo = () => {
   saveDiagnosticsTest(diagnosticsTest).unwrap();
         setBasicDataSaved(true);
    if (diagnosticsTest.testTypeLkey === null) {
      return null;
    }
  };
  
  const handleShowComponent = () => {
    
    console.log(matchingItem.data?.object);
    switch (matchingItem.data?.object) {
      case 'Laboratory':
        console.log("lab");
       return <Laboratory diagnosticsTest={diagnosticsTest} />;
      case 'Radiology':
        console.log("Rad");
        return <Radiology diagnosticsTest={diagnosticsTest}/>;
        case 'Pathology':
          console.log("Path");
          return <Pathology/>;
          case 'Genetics':
            console.log("Gen");
            return <Genetics/>;
            // case 'Eye Exam':
            //   console.log("Ete");
            //   return <EyeExam/>;
              default:
            return <div>No component available</div> ;
    }

  }

  // const handleShowComponent = () => {
  //   let component;
  
  //   const componentType = matchingItem.data?.object;
  //   console.log(componentType);
  //   switch (componentType) {
  //     case 'Laboratory':
  //       component = <Laboratory />;
  //       break;
  //     case 'Radiology':
  //       component = <Radiology />;
  //       break;
  //     case 'Pathology':
  //       component = <Pathology />;
  //       break;
  //     case 'Genetics':
  //       component = <Genetics />;
  //       break;
  //     case 'Eye Exam':
  //       component = <EyeExam />;
  //       break;
  //     default:
  //       component = <div>No component available</div>;
  //   }
  
  //   console.log("Returning component:", component);
  //   return component;
  // };
  
  return (
    <Panel
      header={
        <h3 className="title">
          <Translate>New/Edit Diagnostics</Translate>
        </h3>
      }
    >
      <ButtonToolbar>
        <IconButton appearance="ghost" color="cyan" icon={<ArowBackIcon />} onClick={goBack}>
          Go Back
        </IconButton>
        <Divider vertical />

        
        <IconButton
                onClick={handleSaveBasicInfo}
                appearance="primary"
                color="green"
                icon={<Check />}
              >
                <Translate> {"Save"} </Translate>
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
          <Stack.Item grow={8}>
            <Form layout="inline" fluid>
              <MyInput
                width={250}
                column
                fieldName="testTypeLkey"
                fieldType="select"
                selectData={DiagnosticsTestTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={diagnosticsTest}
                setRecord={setDiagnosticsTest}
              />
              <MyInput width={250} column fieldName="testName" record={diagnosticsTest} setRecord={setDiagnosticsTest} />
              <MyInput width={250} column fieldName="internalCode" record={diagnosticsTest} setRecord={setDiagnosticsTest} />
              <MyInput width={250} column fieldName="price" record={diagnosticsTest} setRecord={setDiagnosticsTest} />
              <MyInput
                width={250}
                column
                fieldName="currencyLkey"
                fieldType="select"
                selectData={CurrencyLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={diagnosticsTest}
                setRecord={setDiagnosticsTest}
              />
              <MyInput
                width={250}
                column
                fieldName="specialNotes"
                fieldType="textarea"
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={diagnosticsTest}
                isabled={!editing}
                setRecord={setDiagnosticsTest}
              />
                <br/>
               <MyInput
                width={400}
                column
                fieldName="genderSpecific"
                fieldType="checkbox"
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={diagnosticsTest}
                setRecord={setDiagnosticsTest}
              />
              {diagnosticsTest.genderSpecific && (
                 <MyInput
                 width={200}
                 column
                 fieldName="genderLkey"
                 fieldType="select"
                 selectData={GenderLovQueryResponse?.object ?? []}
                 selectDataLabel="lovDisplayVale"
                 selectDataValue="key"
                 record={diagnosticsTest}
                 isabled={!editing}
                 setRecord={setDiagnosticsTest}
               />
               
              )}
                  <MyInput
                width={400}
                column
                fieldName="specialPopulation"
                fieldType="checkbox"
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={diagnosticsTest}
                setRecord={setDiagnosticsTest}
              />
              {diagnosticsTest.specialPopulation && (
                  <InlineEdit
                    placeholder="Special Pouplation"
                    style={{ width: 200 }}

                  >
                    <TagPicker data={SpecialPopulationLovQueryResponse?.object ?? []}
                      labelKey="lovDisplayVale" valueKey="key"  block
                      value={diagnosticTestSpecialPopulation.testKey}
                      onChange={e =>
                        setDiagnosticTestSpecialPopulation({
                          ...diagnosticTestSpecialPopulation,
                          testKey: String(e)
                        })
                      }

                      />
                  </InlineEdit>
                )
                }
                   <MyInput
                width={400}
                column
                fieldName="ageSpecific"
                fieldType="checkbox"
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={diagnosticsTest}
                setRecord={setDiagnosticsTest}
              />
              {diagnosticsTest.ageSpecific && (
                
                  <InlineEdit
                    placeholder="Age Group"
                    style={{ width: 200 }}
                  >
                    <TagPicker data={AgeGroupLovQueryResponse?.object ?? []}
                      labelKey="lovDisplayVale" valueKey="key" block 
                      />
                  </InlineEdit>
                )
                }
              <br />


            </Form>
          </Stack.Item>
        </Stack>
   
      </Panel>
      {basicDataSaved && (
        <Panel>
           {console.log("the value is " + handleShowComponent() + basicDataSaved)}
           {handleShowComponent()} 
        </Panel>
)}
    </Panel>
   
  );

 
  
};

export default NewDiagnosticsTest;


