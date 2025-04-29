import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel} from 'rsuite';
import Substitutes from './Substitutes';
import {
  useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import {
  useGetGenericMedicationQuery,
  useSaveGenericMedicationMutation
} from '@/services/medicationsSetupService';
import {  ButtonToolbar, IconButton,} from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { Block, Check, PlusRound } from '@rsuite/icons';
import { ApActiveIngredient, ApGenericMedication, ApPatient } from '@/types/model-types';
import { newApActiveIngredient, newApGenericMedication } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useNavigate } from 'react-router-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import ActiveIngredient from './ActiveIngredients';
import BackButton from '@/components/BackButton/BackButton';

const NewEditGenericMedication = ({ selectedGenericMedication,  goBack , ...props}) => {
  const [genericMedication, setGenericMedication] = useState<ApGenericMedication>({ ...newApGenericMedication });
  const [enableAddActive, setEnableAddActive] = useState(false);
  const navigate = useNavigate();

  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });

  const [saveGenericMedication, saveGenericMedicationMutation] = useSaveGenericMedicationMutation();
  const [isAdded, setIsAdded] = useState(false);
  const { data: activeIngredientListResponse } = useGetGenericMedicationQuery(listRequest);

  const { data: GenericMedicationLovQueryResponse } = useGetLovValuesByCodeQuery('GEN_MED_MANUFACTUR');
  const { data: doseageFormLovQueryResponse } = useGetLovValuesByCodeQuery('DOSAGE_FORMS');
  const { data: medRoutLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
  const [preKey, setPreKey] = useState(genericMedication?.key) ;
  const [selectedROA, setSelectedROA] = useState([])
  const [editing, setEditing] = useState(false);
  const dispatch = useAppDispatch();
  const handleNew = () => {
    setGenericMedication({ ...newApGenericMedication })
  };

  const handleGoBack = () => {
    navigate('/GenericMedications');
  };

  const handleSave = async () => {
    try {
    setEnableAddActive(true);
    setEditing(true);
    const response = await saveGenericMedication({ genericMedication, roa: selectedROA? selectedROA.roaLkey : [] }).unwrap();
      dispatch(notify('Brand Medication Saved Successfully'));
      setGenericMedication(response);
      setPreKey(response?.key);
    } catch (error) {
      console.error("Error saving Brand Medication:", error);
  }
  };


  useEffect(() => {
    if (selectedGenericMedication) {
      setGenericMedication(selectedGenericMedication);
      setPreKey(selectedGenericMedication.key);
      setSelectedROA(selectedGenericMedication.roaList);
      
    } else {
      setGenericMedication(newApGenericMedication);
    }
  }, [selectedGenericMedication]);

  useEffect(() => {
    if (saveGenericMedicationMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveGenericMedicationMutation.data]);

  return (
    <Panel
      header={
        <h3 className="title">
          <Translate>New/Edit Brand Medication</Translate>
        </h3>
      }
    >
      <ButtonToolbar>
        <BackButton onClick={goBack}/>
        <Divider vertical />
        <IconButton
              appearance="primary"
              color="cyan"
              onClick={handleNew}
              icon={<PlusRound />}
            >
              <Translate>New Brand Medication</Translate>
            </IconButton>
        <IconButton
                  appearance="primary"
                  color="green"
                  icon={<Check />}
                  onClick={handleSave}
                >
                  <Translate>Save</Translate>
                </IconButton>

        <IconButton
          appearance="primary"
          color="red"
          onClick={handleNew}
          icon={<Block />}
        >
          <Translate>Clear</Translate>
        </IconButton>
      </ButtonToolbar>
      <hr />

      <Panel
        bordered
      >

        <Stack>
          <Stack.Item grow={4}>
            <Form layout="inline" fluid>
              <MyInput width={360} column fieldName="code" record={genericMedication} setRecord={setGenericMedication} />
              <MyInput width={360} column fieldLabel="Brand Name" fieldName="genericName" record={genericMedication} setRecord={setGenericMedication} />

              <MyInput
                width={360}
                column
                fieldName="manufacturerLkey"
                fieldType="select"
                selectData={GenericMedicationLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={genericMedication}
                setRecord={setGenericMedication}
              />
              <MyInput
                width={360}
                column
                fieldName="dosageFormLkey"
                fieldType="select"
                selectData={doseageFormLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={genericMedication}
                setRecord={setGenericMedication}
              />
              <br />
              {/* <MyInput
            width={360}
            column
            fieldLabel="Rout"
            selectData={medRoutLovQueryResponse?.object ?? []}
            fieldType="multyPicker"
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            fieldName={selectedROA}
            record={selectedROA}
            setRecord={setSelectedROA}
          /> */}
            <MyInput
            width={360}
            column
            fieldLabel="Rout"
            selectData={medRoutLovQueryResponse?.object ?? []}
            fieldType="multyPicker"
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            fieldName="roaList"
            record={genericMedication}
            setRecord={setGenericMedication}
          />

              <MyInput
                width={360}
                column
                fieldName="usageInstructions"
                fieldType="textarea"
                record={genericMedication}
                setRecord={setGenericMedication}
              />
              <MyInput
                width={360}
                column
                fieldName="storageRequirements"
                fieldType="textarea"
                record={genericMedication}
                setRecord={setGenericMedication}
              />
                  <MyInput
                width={360}
                column
                fieldName="marketingAuthorizationHolder"
                fieldType="textarea"
                record={genericMedication}
                setRecord={setGenericMedication}
              />
              <MyInput
                width={400}
                column
                fieldName="expiresAfterOpening"
                fieldType="checkbox"
                record={genericMedication}
                setRecord={setGenericMedication}
              />

             {genericMedication?.expiresAfterOpening && <MyInput
                width={360}
                column
                fieldName="expiresAfterOpeningValue"
                fieldType="text"
                record={genericMedication}
                setRecord={setGenericMedication}
              />
             }
               <MyInput
                column
                fieldName="singlePatientUse"
                fieldType="checkbox"
                record={genericMedication}
                setRecord={setGenericMedication}
              />

              {/* {enableAddActive && <ActiveIngredient/>}

<Divider />
              
             {enableAddActive &&   <Panel bordered style={{ padding: '10px', margin: '5px' }} header="Insurance">
                <Table
                  bordered
                  rowClassName={isSelected}
                  headerHeight={50}
                  rowHeight={60}
                >
                  <Table.Column flexGrow={1}>
                    <Table.HeaderCell>Insurance</Table.HeaderCell>
                    <Table.Cell>
                    </Table.Cell>
                  </Table.Column>
                  <Table.Column flexGrow={1}>
                    <Table.HeaderCell>Plan</Table.HeaderCell>
                    <Table.Cell></Table.Cell>
                  </Table.Column>
                  <Table.Column flexGrow={1}>
                    <Table.HeaderCell>Coverage</Table.HeaderCell>
                    <Table.Cell></Table.Cell>
                  </Table.Column>
                </Table>
              </Panel>} */}
              <br />
            </Form>
          </Stack.Item>
        </Stack>
      </Panel>
       <Tabs>
            <TabList>
              <Tab>Active Ingredient</Tab>
              <Tab>Substitutes</Tab>
              {/* <Tab>Unit of Measurments</Tab>
              <Tab>Price</Tab> */}
       {/* <Tab>Insurance</Tab> */}
            </TabList>

            <TabPanel>
              {preKey && <ActiveIngredient genericMedication={genericMedication} />}
               </TabPanel>
               <TabPanel>
                <Substitutes genericMedication={genericMedication}/>
               </TabPanel>
            {/* <TabPanel>
            <UOM />
            </TabPanel> */}
            {/* <TabPanel>
                <Price />
              </TabPanel> */}
            {/* <TabPanel>
            <Table
                bordered
                rowClassName={isSelected}
                headerHeight={50}
                rowHeight={60}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Insurance</Table.HeaderCell>
                  <Table.Cell>
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Plan</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Coverage</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
              </Table>
            </TabPanel>  */}
       </Tabs>  
    </Panel>
  );
};

export default NewEditGenericMedication;
