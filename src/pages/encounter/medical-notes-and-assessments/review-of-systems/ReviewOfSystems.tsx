import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import React, { useEffect, useState } from 'react';
import { FlexboxGrid, IconButton, Input, Panel, Table, Grid, Row, Col, Checkbox, InputGroup } from 'rsuite';
import {  Modal, Button, Toggle, Form } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { useNavigate } from 'react-router-dom';
import CheckOutlineIcon from '@rsuite/icons/CheckOutline';
import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import { newApLovValues, newApEncounter } from '@/types/model-types-constructor';
import {
  useGetEncounterReviewOfSystemsQuery,
  useRemoveReviewOfSystemMutation,
  useSaveReviewOfSystemMutation,
  useSaveEncounterChangesMutation
} from '@/services/encounterService';
const ReviewOfSystems = ({patient,encounter}) => {

 const [openModel,setOpenModel]=useState(false);
  const dispatch = useAppDispatch();
  const [selectedSystem, setSelectedSystem] = useState({ ...newApLovValues });

  const [saveEncounterChanges, saveEncounterChangesMutation] = useSaveEncounterChangesMutation();
  const [localEncounter, setLocalEncounter] = useState({ ...encounter });
  const { data: bodySystemsLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_SYS');
  const { data: bodySystemsDetailLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'BODY_SYS_DETAIL',
    parentValueKey: selectedSystem.key
  });

  const encounterReviewOfSystemsResponse = useGetEncounterReviewOfSystemsQuery(
    encounter.key
  );
  
   const{data:encounterReviewOfSystemsSummaryResponse ,refetch} = useGetEncounterReviewOfSystemsQuery(  encounter.key );

  const [saveReviewOfSystem, saveReviewOfSystemMutation] = useSaveReviewOfSystemMutation();
  const [removeReviewOfSystem, removeReviewOfSystemMutation] = useRemoveReviewOfSystemMutation();
  const [mainData, setMainData] = useState({});


  useEffect(()=>{

  },[encounterReviewOfSystemsSummaryResponse,encounter.key])
  const closeModel=()=>{
    setOpenModel(false);
  }
  const saveChanges = async () => {
    try {
      await saveEncounterChanges(localEncounter).unwrap();
     
      dispatch(notify('Findings Saved Successfully'));
    } catch (error) {
      console.error("Encounter save failed:", error);
      dispatch(notify('Findings Saved fill'));
    }
  };

  useEffect(() => {
    if (saveEncounterChangesMutation.status === 'fulfilled') {
      dispatch(setEncounter(saveEncounterChangesMutation.data));
      setLocalEncounter(saveEncounterChangesMutation.data);
    }
  }, [saveEncounterChangesMutation]);


  useEffect(() => {
    if (encounterReviewOfSystemsResponse.isSuccess) {
      buildMainData(encounterReviewOfSystemsResponse.data?.object ?? []);
    }
  }, [encounterReviewOfSystemsResponse]);

  useEffect(() => {
    if (saveReviewOfSystemMutation.isSuccess) {
      buildMainData(saveReviewOfSystemMutation.data);
    }
  }, [saveReviewOfSystemMutation]);

  useEffect(() => {
    if (removeReviewOfSystemMutation.isSuccess) {
      buildMainData(removeReviewOfSystemMutation.data);
    }
  }, [removeReviewOfSystemMutation]);

  const buildMainData = data => {
    const _map = {};
    console.log(data);
    if (data) {
      data.map(record => {
        _map[record.systemDetailLkey] = record;
      });
      setMainData(_map);
    }
  };

  const isSelected = rowData => {
    if (rowData && rowData.key === selectedSystem.key) {
      return 'selected-row';
    } else return '';
  };

  return (
    <>
      <Panel bordered style={{ padding: '5px', margin: '5px' }} >
        <Grid fluid>
          <Row gutter={15}>

            <InputGroup>
            <InputGroup.Addon>
            <IconButton
            circle
            
            icon={<CheckOutlineIcon />}
            size="xs"
            appearance="primary"
            color="green"
            onClick={saveChanges}
          />
              </InputGroup.Addon>
              <Input
               as={'textarea'}
               rows={1}
               style={{ fontSize: '12px', maxHeight: '150px', overflowY: 'auto', resize: 'vertical' }}
               value={localEncounter.physicalExamSummery}
                onChange={e => setLocalEncounter({ ...localEncounter, physicalExamSummery: e })}
               
              />
             
              <InputGroup.Addon>
                <IconButton 
                onClick={() => setOpenModel(true)}
                    style={{fontSize:"12px"}}
                icon={<icons.List style={{ fontSize: "10px" }} />}>Summary</IconButton> 

              </InputGroup.Addon>
            </InputGroup>
          
          </Row>
          <Row gutter={15}>
          <Panel header="Full Body Examination" collapsible bordered>
   
  
            <div style={{ display: "flex", gap: "3px" }}>
              <Table
                style={{ flex: "1" }}
                bordered
                data={bodySystemsLovQueryResponse?.object ?? []}
                height={298}
                onRowClick={rowData => {
                  setSelectedSystem(rowData);
                }}
                rowClassName={isSelected}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>System</Table.HeaderCell>
                  <Table.Cell style={{ fontSize:"12px"}} dataKey="lovDisplayVale" />
                </Table.Column>
              </Table>


              <Table
                bordered
                data={bodySystemsDetailLovQueryResponse?.object ?? []}
                height={298}
                rowHeight={50}
                style={{ flex: "3" }}
              >
                <Table.Column flexGrow={1} fullText>
                  <Table.HeaderCell>Checked</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <Checkbox
                        onChange={(value, checked) => {
                          if (checked) {
                            saveReviewOfSystem({
                              key: mainData[rowData.key] ? mainData[rowData.key].key : undefined,
                              encounterKey:encounter.key,
                              bodySystemDetailKey: rowData.key,
                              systemLkey:selectedSystem.key,
                              notes: mainData[rowData.key] ? mainData[rowData.key].notes : ''
                            }).unwrap();
                            dispatch(notify('Findings Saved Successfully'));
                            refetch();

                          } else {
                            removeReviewOfSystem({
                              key: mainData[rowData.key] ? mainData[rowData.key].key : undefined,
                              encounterKey: encounter.key,
                              bodySystemDetailKey: rowData.key,
                              notes: mainData[rowData.key] ? mainData[rowData.key].notes : ''
                            }).unwrap();
                            dispatch(notify('Findings Deleted Successfully'));
                            refetch();
                          }
                        }}
                        checked={mainData[rowData.key] ? true : false}
                      />
                    )}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={2}>
                  <Table.HeaderCell>Detail</Table.HeaderCell>
                  <Table.Cell dataKey="lovDisplayVale" />
                </Table.Column>
                <Table.Column flexGrow={4}>
                  <Table.HeaderCell>Notes</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <Input
                        disabled={!mainData[rowData.key]}
                        value={mainData[rowData.key] ? mainData[rowData.key].notes : ''}
                        onChange={e => {
                          setMainData({
                            ...mainData,
                            [rowData.key]: {
                              ...mainData[rowData.key],
                              notes: e
                            }
                          });
                        }}
                        placeholder="Insert Notes"
                        onBlur={() => {
                          saveReviewOfSystem({
                            key: mainData[rowData.key].key,
                            encounterKey: encounter.key,
                            bodySystemDetailKey: rowData.key,
                            notes: mainData[rowData.key].notes
                          }).unwrap();
                        }}
                      />
                    )}
                  </Table.Cell>
                </Table.Column>
              </Table>
            </div>
            </Panel>
          </Row>

        </Grid>
        <Modal open={openModel} onClose={closeModel}>
          <Modal.Header>
            <Modal.Title>Physical Examination & Findings Summary</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            
            <div style={{
              display: "flex",
              flexDirection: "column",
              
              height: "250px",
              backgroundColor: "#f7f7fa"
            }}>
             <pre style={{ maxHeight: '200px', overflowY: 'auto' }}>
       {encounterReviewOfSystemsSummaryResponse?.object?.map((item, index) => (
          <div key={index} style={{ marginBottom: "10px", padding: "5px", borderBottom: "1px solid #ccc" }}>
            <p>{item.systemLkey}</p>
            <p>{item.systemDetailLvalue? item.systemDetailLvalue.lovDisplayVale
                  : item.systemDetailLkey}</p>
            <p> {item.notes}</p>
          </div>
        ))}
    
  </pre>
            </div>
          </Modal.Body>
          <Modal.Footer>
           
            
            <Button appearance="default" onClick={closeModel}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </Panel>
    </>
  );
};

export default ReviewOfSystems;
