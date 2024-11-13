import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import React, { useEffect, useState } from 'react';
import { FlexboxGrid, IconButton, Input, Panel, Table, Grid, Row, Col, Checkbox, InputGroup } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { useNavigate } from 'react-router-dom';
import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { newApLovValues } from '@/types/model-types-constructor';
import {
  useGetEncounterPhysicalExamAreasQuery,
  useRemovePhysicalExamAreaMutation,
  useSavePhysicalExamAreaMutation
} from '@/services/encounterService';
const PhysicalExaminationsAndFindings = () => {
  const patientSlice = useAppSelector(state => state.patient);

  const [selectedArea, setSelectedArea] = useState({ ...newApLovValues });

  const { data: physicalExamAreasLovQueryResponse } = useGetLovValuesByCodeQuery('PHYSICAL_EXAM_AREAS');
  const { data: physicalExamAreasDetailsLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'PHYSICAL_EXAM_AREAS_DETAIL',
    parentValueKey: selectedArea.key
  });

  const encounterPhysicalExamAreasResponse = useGetEncounterPhysicalExamAreasQuery(
    patientSlice.encounter.key
  );

  const [savePhysicalExamArea, savePhysicalExamAreaMutation] = useSavePhysicalExamAreaMutation();
  const [removePhysicalExamArea, removePhysicalExamAreaMutation] = useRemovePhysicalExamAreaMutation();

  const [mainData, setMainData] = useState({});

  useEffect(() => {
    if (encounterPhysicalExamAreasResponse.isSuccess) {
      buildMainData(encounterPhysicalExamAreasResponse.data?.object ?? []);
    }
  }, [encounterPhysicalExamAreasResponse]);

  useEffect(() => {
    if (savePhysicalExamAreaMutation.isSuccess) {
      buildMainData(savePhysicalExamAreaMutation.data);
    }
  }, [savePhysicalExamAreaMutation]);

  useEffect(() => {
    if (removePhysicalExamAreaMutation.isSuccess) {
      buildMainData(removePhysicalExamAreaMutation.data);
    }
  }, [removePhysicalExamAreaMutation]);

  const buildMainData = data => {
    const _map = {};
    console.log(data);
    if (data) {
      data.map(record => {
        _map[record.physicalExamAreaDetailLkey] = record;
      });
      setMainData(_map);
    }
  };

  const isSelected = rowData => {
    if (rowData && rowData.key === selectedArea.key) {
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
                {<icons.CheckRound color="green" />}


              </InputGroup.Addon>
              <Input


                value={""}
              // onChange={e => setLocalEncounter({ ...localEncounter, progressNote: e })}
              // onBlur={progressNoteIsChanged() ? saveChanges : undefined}
              />
            </InputGroup>
          </Row>
          <Row gutter={15}>
            <div style={{display:"flex" ,gap:"3px"}}>
              <Table 
              style={{flex:"1"}}
                bordered
                data={physicalExamAreasLovQueryResponse?.object ?? []}
                height={300}
                onRowClick={rowData => {
                  setSelectedArea(rowData);
                }}
                rowClassName={isSelected}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Area</Table.HeaderCell>
                  <Table.Cell dataKey="lovDisplayVale" />
                </Table.Column>
              </Table>
            
              <Table
                bordered
                data={physicalExamAreasDetailsLovQueryResponse?.object ?? []}
                height={300}
                rowHeight={50}
                style={{flex:"3"}}
              >
                <Table.Column flexGrow={2}>
                  <Table.HeaderCell>Checked</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <Checkbox
                        onChange={(value, checked) => {
                          if (checked) {
                            savePhysicalExamArea({
                              key: mainData[rowData.key] ? mainData[rowData.key].key : undefined,
                              encounterKey: patientSlice.encounter.key,
                              physicalExamAreaDetailKey: rowData.key,
                              notes: mainData[rowData.key] ? mainData[rowData.key].notes : ''
                            }).unwrap();
                          } else {
                            removePhysicalExamArea({
                              key: mainData[rowData.key] ? mainData[rowData.key].key : undefined,
                              encounterKey: patientSlice.encounter.key,
                              physicalExamAreaDetailKey: rowData.key,
                              notes: mainData[rowData.key] ? mainData[rowData.key].notes : ''
                            }).unwrap();
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
                          savePhysicalExamArea({
                            key: mainData[rowData.key].key,
                            encounterKey: patientSlice.encounter.key,
                            physicalExamAreaDetailKey: rowData.key,
                            notes: mainData[rowData.key].notes
                          }).unwrap();
                        }}
                      />
                    )}
                  </Table.Cell>
                </Table.Column>
              </Table>
           </div>
          </Row>

        </Grid>
      </Panel>
    </>
  );
};

export default PhysicalExaminationsAndFindings;
