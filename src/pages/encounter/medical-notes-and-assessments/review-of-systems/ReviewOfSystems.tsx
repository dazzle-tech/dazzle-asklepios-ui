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
  useGetEncounterReviewOfSystemsQuery,
  useRemoveReviewOfSystemMutation,
  useSaveReviewOfSystemMutation
} from '@/services/encounterService';
const ReviewOfSystems = () => {
  const patientSlice = useAppSelector(state => state.patient);

  const [selectedSystem, setSelectedSystem] = useState({ ...newApLovValues });

  const { data: bodySystemsLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_SYS');
  const { data: bodySystemsDetailLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'BODY_SYS_DETAIL',
    parentValueKey: selectedSystem.key
  });

  const encounterReviewOfSystemsResponse = useGetEncounterReviewOfSystemsQuery(
    patientSlice.encounter.key
  );

  const [saveReviewOfSystem, saveReviewOfSystemMutation] = useSaveReviewOfSystemMutation();
  const [removeReviewOfSystem, removeReviewOfSystemMutation] = useRemoveReviewOfSystemMutation();

  const [mainData, setMainData] = useState({});

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
                {<icons.CheckRound color="green"  />}
              </InputGroup.Addon>
              <Input


                value={""}
              // onChange={e => setLocalEncounter({ ...localEncounter, progressNote: e })}
              // onBlur={progressNoteIsChanged() ? saveChanges : undefined}
              />
              <InputGroup.Addon>
              <IconButton icon={<icons.List style={{fontSize:"10px" }} />}>Summary</IconButton> {/* استبدلها بالأيقونة التي ترغب بإضافتها */}
              </InputGroup.Addon>
            </InputGroup>
          </Row>
          <Row gutter={15}>
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
                  <Table.Cell dataKey="lovDisplayVale" />
                </Table.Column>
              </Table>


              <Table
                bordered
                data={bodySystemsDetailLovQueryResponse?.object ?? []}
                height={298}
                rowHeight={50}
                style={{ flex: "3" }}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Checked</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <Checkbox
                        onChange={(value, checked) => {
                          if (checked) {
                            saveReviewOfSystem({
                              key: mainData[rowData.key] ? mainData[rowData.key].key : undefined,
                              encounterKey: patientSlice.encounter.key,
                              bodySystemDetailKey: rowData.key,
                              notes: mainData[rowData.key] ? mainData[rowData.key].notes : ''
                            }).unwrap();
                          } else {
                            removeReviewOfSystem({
                              key: mainData[rowData.key] ? mainData[rowData.key].key : undefined,
                              encounterKey: patientSlice.encounter.key,
                              bodySystemDetailKey: rowData.key,
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
                          saveReviewOfSystem({
                            key: mainData[rowData.key].key,
                            encounterKey: patientSlice.encounter.key,
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
          </Row>

        </Grid>
      </Panel>
    </>
  );
};

export default ReviewOfSystems;
