import DentalChart from '@/components/DentalChart';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  ButtonToolbar,
  Divider,
  Drawer,
  Form,
  IconButton,
  Input,
  List,
  Modal,
  Panel,
  SelectPicker,
  Stack,
  Table,
  Tooltip,
  Whisper
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import StackItem from 'rsuite/esm/Stack/StackItem';
import * as icons from '@rsuite/icons';
import { initialListRequest, ListRequest } from '@/types/types';
import {
  useSavePlannedTreatmentMutation,
  useDeletePlannedTreatmentMutation,
  useDeleteProgressNoteMutation,
  useFetchTreatmentPlanQuery,
  useGetActionsQuery,
  useGetChartDataQuery,
  useGetDentalChartsByEncounterQuery,
  useSaveChartMutation,
  useSaveProgressNotesMutation
} from '@/services/dentalService';
import {
  newApDentalChart,
  newApDentalChartProgressNote,
  newApDentalChartTooth,
  newApDentalPlannedTreatment
} from '@/types/model-types-constructor';
import { BlockUI } from 'primereact/blockui';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { notify } from '@/utils/uiReducerActions';
import { current } from '@reduxjs/toolkit';
import Error500 from '@/pages/authentication/500';
import {
  useGetCdtsQuery,
  useGetLovValuesByCodeQuery,
  useGetServicesQuery
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { ItemDataType } from 'rsuite/esm/@types/common';

const Dental = ({ disabled, ...props }) => {
  const patientSlice = useAppSelector(state => state.patient);
  const dispatch = useAppDispatch();

  const [originalChart, setOriginalChart] = useState({ ...newApDentalChart });
  const [currentChart, setCurrentChart] = useState({ ...newApDentalChart });
  const [previousCharts, setPreviousCharts] = useState([]);
  const [selectedPreviousChartKey, setSelectedPreviousChartKey] = useState('');
  const [selectedTooth, setSelectedTooth] = useState({ ...newApDentalChartTooth });
  const [progressNotes, setProgressNotes] = useState([]);
  const [manualChartLoading, setManualChartLoading] = useState(false);

  const [dentalActionsListRequest, setDentalActionsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 1000
  });
  const dentalActionsListResponse = useGetActionsQuery(dentalActionsListRequest);
  const [dentalActionsMap, setDentalActionsMap] = useState({}); // to cache dental action list as a map

  const [dentalServicesListRequest, setDentalServicesListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'category_lkey',
        operator: 'match',
        value: '6418596687583232' // TODO change to be on CODE not KEY
      }
    ],
    pageSize: 1000
  });
  const dentalServicesListResponse = useGetServicesQuery(dentalServicesListRequest);
  const [dentalServicesMap, setDentalServicesMap] = useState({}); // to cache dental services list as a map

  const [cdtListRequest, setCdtListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'type_lkey',
        operator: 'match',
        value: '277273303968200' // TODO change to be on CODE not KEY
      }
    ],
    pageSize: 1000
  });
  const cdtListResponse = useGetCdtsQuery(cdtListRequest);
  const [cdtMap, setCdtMap] = useState({}); // to cache dental services list as a map

  const dentalChartsResponse = useGetDentalChartsByEncounterQuery(
    patientSlice.encounter?.key ?? ''
  );

  const [saveProgressNotes, saveProgressNotesMutation] = useSaveProgressNotesMutation();
  const [deleteProgressNote, deleteProgressNotesMutation] = useDeleteProgressNoteMutation();
  const [saveDentalChart, saveDentalChartMutation] = useSaveChartMutation();

  const previousChartDataResponse = useGetChartDataQuery(selectedPreviousChartKey, {
    skip: !selectedPreviousChartKey || selectedPreviousChartKey === ''
  });

  const { data: treatmentPlanStatusLovQueryResponse } =
    useGetLovValuesByCodeQuery('DENT_PLAN_TRTMNT_STATUS');
  const { data: toothSurfaceLovQueryResponse } = useGetLovValuesByCodeQuery('TOOTH_SURF');
  const { data: billingTypeLovQueryResponse } = useGetLovValuesByCodeQuery('BILLING_TYPE');

  const [treatmentPlanTrigger, setTreatmentPlanTrigger] = useState(-1);
  const treatmentPlanDataResponse = useFetchTreatmentPlanQuery(
    { encounterKey: originalChart.encounterKey, trigger: treatmentPlanTrigger },
    {
      skip: !originalChart.key
    }
  );

  const [savePlannedTreatment, savePlannedTreatmentMutation] = useSavePlannedTreatmentMutation();
  const [deletePlannedTreatment, deletePlannedTreatmentMutation] =
    useDeletePlannedTreatmentMutation();

  const [treatmentPlan, setTreatmentPlan] = useState({
    draft: [],
    current: []
  });

  const [draftPlannedTreatment, setDraftPlannedTreatment] = useState({
    ...newApDentalPlannedTreatment
  });
  const [draftPlanPopupOpen, setDraftPlanPopupOpen] = useState(false);

  const isDraftTreatmentSelected = rowData => {
    if (rowData && draftPlannedTreatment && rowData.key === draftPlannedTreatment.key) {
      return 'selected-row';
    } else return '';
  };

  const [activePlannedTreatment, setActivePlannedTreatment] = useState({
    ...newApDentalPlannedTreatment
  });
  const [activePlanPopupOpen, setActivePlanPopupOpen] = useState(false);

  const isActiveTreatmentSelected = rowData => {
    if (rowData && activePlannedTreatment && rowData.key === activePlannedTreatment.key) {
      return 'selected-row';
    } else return '';
  };

  useEffect(() => {
    if (dentalChartsResponse && dentalChartsResponse.isSuccess) {
      if (dentalChartsResponse.data.object) {
        setOriginalChart(dentalChartsResponse.data.object.currentChart);
        setCurrentChart(dentalChartsResponse.data.object.currentChart);
        setPreviousCharts(dentalChartsResponse.data.object.historyCharts);
        setProgressNotes(dentalChartsResponse.data.object.currentChart?.progressNotes ?? []);
      }
    }
  }, [dentalChartsResponse]);

  useEffect(() => {
    if (treatmentPlanDataResponse && treatmentPlanDataResponse.isSuccess) {
      if (treatmentPlanDataResponse.data.object) {
        setTreatmentPlan({
          draft: treatmentPlanDataResponse.data.object?.draftTreatments ?? [],
          current: treatmentPlanDataResponse.data.object?.currentTreatments ?? []
        });
      }
    }
  }, [treatmentPlanDataResponse]);

  useEffect(() => {
    // cache dental action list into an object/map for fast details access
    if (dentalActionsListResponse.status === 'fulfilled') {
      let actionCache = {};
      dentalActionsListResponse.data.object.map(action => {
        actionCache[action.key] = action;
      });
      setDentalActionsMap(actionCache);
    }
  }, [dentalActionsListResponse]);

  useEffect(() => {
    // cache dental service list into an object/map for fast details access
    if (dentalServicesListResponse.status === 'fulfilled') {
      let servicesCache = {};
      dentalServicesListResponse.data.object.map(service => {
        servicesCache[service.key] = service;
      });
      setDentalServicesMap(servicesCache);
    }
  }, [dentalServicesListResponse]);

  useEffect(() => {
    // cache cdt list into an object/map for fast details access
    if (cdtListResponse.status === 'fulfilled') {
      let cdtCache = {};
      cdtListResponse.data.object.map(cdt => {
        cdtCache[cdt.key] = cdt;
      });
      setCdtMap(cdtCache);
    }
  }, [cdtListResponse]);

  useEffect(() => {
    if (previousChartDataResponse.isLoading) {
      setManualChartLoading(true);
    }

    if (previousChartDataResponse && previousChartDataResponse.isSuccess) {
      if (previousChartDataResponse.data.object) {
        setCurrentChart(previousChartDataResponse.data.object);
        setManualChartLoading(false);
      }
    }
  }, [previousChartDataResponse]);

  useEffect(() => {
    if (saveProgressNotesMutation.status === 'fulfilled') {
      setProgressNotes(saveProgressNotesMutation.data);
    } else if (saveProgressNotesMutation.status === 'rejected') {
      dispatch(notify({ msg: 'Save Failed', sev: 'error' }));
    }
  }, [saveProgressNotesMutation]);

  useEffect(() => {
    if (savePlannedTreatmentMutation.status === 'fulfilled') {
      setTreatmentPlanTrigger(treatmentPlanTrigger * -1);
      setDraftPlanPopupOpen(false);
      setActivePlanPopupOpen(false);
    } else if (savePlannedTreatmentMutation.status === 'rejected') {
      dispatch(notify({ msg: 'Save Failed', sev: 'error' }));
    }
  }, [savePlannedTreatmentMutation]);

  useEffect(() => {
    if (deletePlannedTreatmentMutation.status === 'fulfilled') {
      setTreatmentPlanTrigger(treatmentPlanTrigger * -1);
      setDraftPlannedTreatment({ ...newApDentalPlannedTreatment });
    } else if (deletePlannedTreatmentMutation.status === 'rejected') {
      dispatch(notify({ msg: 'Delete Failed', sev: 'error' }));
    }
  }, [deletePlannedTreatmentMutation]);

  useEffect(() => {
    if (deleteProgressNotesMutation.status === 'fulfilled') {
      // Filter out the deleted note from the progressNotes array
      const updatedProgressNotes = progressNotes.filter(
        note => note.key !== deleteProgressNotesMutation.data.key
      );
      setProgressNotes(updatedProgressNotes);
    } else if (deleteProgressNotesMutation.status === 'rejected') {
      dispatch(notify({ msg: 'Save Failed', sev: 'error' }));
    }
  }, [deleteProgressNotesMutation]);

  const handleProgressNoteChange = (value, index) => {
    let notesClone = [...progressNotes];
    let object = { ...notesClone[index] };
    object.note = value;
    notesClone[index] = object;
    setProgressNotes(notesClone);
  };

  const cancelPreviousChartView = () => {
    setCurrentChart(originalChart);
    setSelectedPreviousChartKey('');
  };

  return (
    <>
      <BlockUI
        template={
          <h3 style={{ textAlign: 'center', color: 'white', top: '10%', position: 'absolute' }}>
            <Translate>Chart Loading</Translate>...
          </h3>
        }
        blocked={dentalChartsResponse.isLoading || manualChartLoading}
      >
        <br />
          <Tabs>
            <TabList>
              <Tab>
                <Translate>Chart</Translate>
              </Tab>
              <Tab>
                <Translate>Progress Note</Translate>
              </Tab>
              <Tab>
                <Translate>Treatment Plan</Translate>
              </Tab>
              <Tab>
                <Translate>X-Ray</Translate>
              </Tab>
            </TabList>

            <TabPanel>
              <Stack spacing={10}>
                <StackItem grow={4}>
                  <Panel
                    bordered
                    style={{ height: '70vh', minWidth: '30vw' }}
                    header={
                      <Stack justifyContent="space-between">
                        <StackItem>
                          <Translate>Current Chart Actions </Translate>
                          {currentChart.key !== originalChart.key && (
                            <small style={{ color: 'rgb(120,120,120)' }}>
                              Previewing History Chart ({currentChart.chartDate})
                            </small>
                          )}
                        </StackItem>
                      </Stack>
                    }
                  >
                    <Table
                      height={500}
                      headerHeight={80}
                      rowHeight={60}
                      bordered
                      cellBordered
                      data={currentChart['chartActions']}
                    >
                      <Column flexGrow={1}>
                        <HeaderCell>
                          <Translate>Existing</Translate>
                        </HeaderCell>
                        <Cell>
                          {rowData => <Translate>{rowData.existing ? 'Yes' : 'No'}</Translate>}
                        </Cell>
                      </Column>
                      <Column flexGrow={1}>
                        <HeaderCell>
                          <Translate>Tooth #</Translate>
                        </HeaderCell>
                        <Cell dataKey="toothNumber" />
                      </Column>
                      <Column flexGrow={4}>
                        <HeaderCell>
                          <Translate>Action</Translate>
                        </HeaderCell>
                        <Cell>
                          {rowData => (
                            <Translate>{dentalActionsMap[rowData.actionKey].description}</Translate>
                          )}
                        </Cell>
                      </Column>
                      <Column flexGrow={1}>
                        <HeaderCell>
                          <Translate>Type</Translate>
                        </HeaderCell>
                        <Cell>
                          {rowData => (
                            <small>
                              {dentalActionsMap[rowData.actionKey].type === 'treatment' ? (
                                <b style={{ color: 'green' }}>Treatment</b>
                              ) : (
                                <b style={{ color: 'red' }}>Condition</b>
                              )}
                            </small>
                          )}
                        </Cell>
                      </Column>
                      <Column flexGrow={1}>
                        <HeaderCell>
                          <Translate>Surface</Translate>
                        </HeaderCell>
                        <Cell>
                          {rowData => <small>{rowData.surfaceLvalue?.lovDisplayVale ?? '-'}</small>}
                        </Cell>
                      </Column>
                      <Column flexGrow={1} align="center">
                        <HeaderCell>
                          <Translate>Note</Translate>
                        </HeaderCell>
                        <Cell>
                          {rowData =>
                            rowData.note && (
                              <Whisper
                                placement="right"
                                controlId="control-id-hover"
                                trigger="hover"
                                speaker={
                                  <Tooltip>
                                    <span style={{ fontSize: '20px' }}>{rowData.note}</span>
                                  </Tooltip>
                                }
                              >
                                <icons.Message style={{ fontSize: '20px' }} />
                              </Whisper>
                            )
                          }
                        </Cell>
                      </Column>
                    </Table>
                  </Panel>
                </StackItem>
                <StackItem grow={2}>
                  <Panel
                    bordered
                    style={{ height: '70vh' }}
                    header={
                      <Stack justifyContent="space-between">
                        <StackItem>
                          <Translate>Current Visit Chart </Translate>
                          {currentChart.key !== originalChart.key && (
                            <small style={{ color: 'rgb(120,120,120)' }}>
                              Previewing History Chart ({currentChart.chartDate})
                            </small>
                          )}
                          {selectedTooth.key && (
                            <span>
                              <small>(Selection: Tooth #{selectedTooth.toothNumber})</small>
                              <IconButton
                                title="Clear Selection"
                                appearance="link"
                                disabled={!selectedTooth || !selectedTooth.key}
                                onClick={() => {
                                  setSelectedTooth({ ...newApDentalChartTooth });
                                }}
                                icon={<icons.BlockRound />}
                              />
                            </span>
                          )}
                        </StackItem>

                        <StackItem>
                          <ButtonToolbar>
                            {!disabled && (
                              <SelectPicker
                                onClean={cancelPreviousChartView}
                                placeholder="Previous Charts"
                                data={previousCharts}
                                labelKey={'chartDate'}
                                valueKey="key"
                                value={selectedPreviousChartKey}
                                style={{ width: '200px' }}
                                onChange={e => {
                                  if (e) setSelectedPreviousChartKey(e);
                                  else cancelPreviousChartView();
                                }}
                              />
                            )}
                          </ButtonToolbar>
                        </StackItem>
                      </Stack>
                    }
                  >
                    <DentalChart
                      disabled={disabled || currentChart.key !== originalChart.key}
                      chartObject={currentChart}
                      setChartObject={setCurrentChart}
                      selectedTooth={selectedTooth}
                      setSelectedTooth={setSelectedTooth}
                      dentalActionsList={dentalActionsListResponse.data?.object ?? []}
                      dentalActionsMap={dentalActionsMap}
                      dentalServicesList={dentalServicesListResponse.data?.object ?? []}
                      dentalServicesMap={dentalServicesMap}
                      cdtList={cdtListResponse.data?.object ?? []}
                      cdtMap={cdtMap}
                      treatmentPlanTrigger={treatmentPlanTrigger}
                      setTreatmentPlanTrigger={setTreatmentPlanTrigger}
                      cdtLoading={cdtListResponse.isLoading}
                      servicesLoading={dentalServicesListResponse.isLoading}
                      zoom={0.35}
                    />
                  </Panel>
                </StackItem>
              </Stack>
            </TabPanel>

            <TabPanel>
              {!disabled && (
                <ButtonToolbar>
                  <IconButton
                    disabled={disabled}
                    appearance="primary"
                    icon={<icons.Plus />}
                    onClick={() => {
                      setProgressNotes([
                        { key: null, chartKey: currentChart.key, note: '' },
                        ...progressNotes
                      ]);
                    }}
                  >
                    <Translate>Add New</Translate>
                  </IconButton>
                  <Divider vertical />
                  <IconButton
                    style={{ margin: '5px' }}
                    appearance="primary"
                    color="green"
                    icon={<icons.Check />}
                    onClick={() => {
                      saveProgressNotes(progressNotes).unwrap();
                    }}
                  >
                    <Translate>Save Notes</Translate>
                  </IconButton>
                </ButtonToolbar>
              )}
              <Table height={400} rowHeight={100} bordered data={progressNotes}>
                <Column flexGrow={6} align="center" fixed>
                  <HeaderCell>
                    <Translate>Progress Note</Translate>
                  </HeaderCell>
                  <Cell>
                    {(rowData, rowIndex) => (
                      <Input
                        style={{ padding: '10px' }}
                        disabled={disabled}
                        as="textarea"
                        rows={3}
                        placeholder="Insert new note... "
                        value={rowData.note}
                        onChange={e => handleProgressNoteChange(e, rowIndex)}
                      />
                    )}
                  </Cell>
                </Column>
                <Column flexGrow={3}>
                  <HeaderCell>
                    <Translate>Audit</Translate>
                  </HeaderCell>
                  <Cell>
                    {rowData => (
                      <small style={{ color: '#363636', fontSize: '75%' }}>
                        {rowData.createAudit}
                        <br />
                        {rowData.updatedAudit && ' / '.concat(rowData.updatedAudit)}
                      </small>
                    )}
                  </Cell>
                </Column>
                <Column flexGrow={1} align="center">
                  <HeaderCell>
                    <Translate>Delete</Translate>
                  </HeaderCell>
                  <Cell>
                    {rowData => (
                      <IconButton
                        style={{ margin: '3px', position: 'absolute', right: '5%' }}
                        size="xs"
                        onClick={() => {
                          deleteProgressNote(rowData).unwrap();
                        }}
                        icon={<icons.Close />}
                        appearance="ghost"
                        color="red"
                      />
                    )}
                  </Cell>
                </Column>
              </Table>
            </TabPanel>

            <TabPanel>
              <Modal open={draftPlanPopupOpen} overflow>
                <Modal.Title>
                  <Translate>New/Edit Draft Planned Treatment</Translate>
                </Modal.Title>
                <Modal.Body>
                  <Form fluid>
                    <MyInput
                      width={400}
                      fieldName="visitNumber"
                      fieldType="number"
                      max={99}
                      record={draftPlannedTreatment}
                      setRecord={setDraftPlannedTreatment}
                    />
                    <MyInput
                      width={400}
                      fieldName="cdtKey"
                      fieldLabel="CDT"
                      fieldType="select"
                      selectData={cdtListResponse?.data?.object ?? [] ?? []}
                      selectDataLabel="description"
                      selectDataValue="key"
                      renderMenuItem={(label, item) => {
                        return (
                          <span>
                            {item.cdtCode} / {item.description}
                          </span>
                        );
                      }}
                      searchBy={(keyword: string, label: ReactNode, item: ItemDataType) =>
                        item.cdtCode.toLowerCase().includes(keyword.toLowerCase()) ||
                        item.description.toLowerCase().includes(keyword.toLowerCase())
                      }
                      record={draftPlannedTreatment}
                      setRecord={setDraftPlannedTreatment}
                    />
                    <MyInput
                      width={400}
                      fieldName="note"
                      fieldType="textarea"
                      record={draftPlannedTreatment}
                      setRecord={setDraftPlannedTreatment}
                    />
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Stack spacing={2} divider={<Divider vertical />}>
                    <Button
                      appearance="primary"
                      onClick={() => {
                        console.log({
                          ...draftPlannedTreatment,
                          type: 'DRAFT',
                          encounterKey: patientSlice.encounter.key
                        });

                        savePlannedTreatment({
                          ...draftPlannedTreatment,
                          type: 'DRAFT',
                          encounterKey: patientSlice.encounter.key,
                          patientKey: patientSlice.patient.key
                        }).unwrap();
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      appearance="primary"
                      color="red"
                      onClick={() => setDraftPlanPopupOpen(false)}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Modal.Footer>
              </Modal>
              <Panel
                bordered
                header={
                  <h5>
                    <Translate>Draft Plan</Translate>
                    <IconButton
                      style={{ marginLeft: '10px' }}
                      appearance="primary"
                      color="green"
                      icon={<icons.Plus />}
                      onClick={() => {
                        setDraftPlanPopupOpen(true);
                        setDraftPlannedTreatment({ ...newApDentalPlannedTreatment });
                      }}
                    >
                      <Translate>New</Translate>
                    </IconButton>
                    <IconButton
                      style={{ marginLeft: '10px' }}
                      appearance="primary"
                      color="blue"
                      icon={<icons.Edit />}
                      disabled={!draftPlannedTreatment || !draftPlannedTreatment.key}
                      onClick={() => {
                        setDraftPlanPopupOpen(true);
                      }}
                    >
                      <Translate>Edit</Translate>
                    </IconButton>
                    <IconButton
                      style={{ marginLeft: '10px' }}
                      appearance="primary"
                      color="red"
                      icon={<icons.Trash />}
                      disabled={!draftPlannedTreatment || !draftPlannedTreatment.key}
                      onClick={() => {
                        deletePlannedTreatment(draftPlannedTreatment).unwrap();
                      }}
                    >
                      <Translate>Delete</Translate>
                    </IconButton>
                  </h5>
                }
                style={{ width: '35%', display: 'inline-block', marginRight: '0.5%' }}
              >
                <Table
                  data={treatmentPlan.draft}
                  height={400}
                  rowHeight={60}
                  bordered
                  onRowClick={rowData => {
                    setDraftPlannedTreatment(rowData);
                  }}
                  rowClassName={isDraftTreatmentSelected}
                >
                  <Table.Column flexGrow={1} align="center" fixed>
                    <Table.HeaderCell>Visit Number</Table.HeaderCell>
                    <Table.Cell dataKey="visitNumber" />
                  </Table.Column>
                  <Table.Column flexGrow={1} align="center" fixed>
                    <Table.HeaderCell>CDT Code</Table.HeaderCell>
                    <Table.Cell>
                      {rowData => (
                        <Translate>{cdtMap[rowData.cdtKey]?.cdtCode ?? rowData.cdtKey}</Translate>
                      )}
                    </Table.Cell>
                  </Table.Column>
                  <Table.Column flexGrow={3} align="center" fixed>
                    <Table.HeaderCell>Planned Procedure</Table.HeaderCell>
                    <Table.Cell>
                      {rowData => (
                        <Translate>
                          {cdtMap[rowData.cdtKey]?.description ?? rowData.cdtKey}
                        </Translate>
                      )}
                    </Table.Cell>
                  </Table.Column>
                  <Column flexGrow={1} align="center">
                    <HeaderCell>
                      <Translate>Note</Translate>
                    </HeaderCell>
                    <Cell>
                      {rowData =>
                        rowData.note && (
                          <Whisper
                            placement="right"
                            controlId="control-id-hover"
                            trigger="hover"
                            speaker={
                              <Tooltip>
                                <span style={{ fontSize: '20px' }}>{rowData.note}</span>
                              </Tooltip>
                            }
                          >
                            <icons.Message style={{ fontSize: '20px' }} />
                          </Whisper>
                        )
                      }
                    </Cell>
                  </Column>
                </Table>
              </Panel>

              <Modal open={activePlanPopupOpen} overflow>
                <Modal.Title>
                  <Translate>New/Edit Active Planned Treatment</Translate>
                </Modal.Title>
                <Modal.Body>
                  <Form fluid>
                    <MyInput
                      disabled={activePlannedTreatment.key}
                      width={400}
                      fieldName="cdtKey"
                      fieldLabel="CDT"
                      fieldType="select"
                      selectData={cdtListResponse?.data?.object ?? [] ?? []}
                      selectDataLabel="description"
                      selectDataValue="key"
                      renderMenuItem={(label, item) => {
                        return (
                          <span>
                            {item.cdtCode} / {item.description}
                          </span>
                        );
                      }}
                      searchBy={(keyword: string, label: ReactNode, item: ItemDataType) =>
                        item.cdtCode.toLowerCase().includes(keyword.toLowerCase()) ||
                        item.description.toLowerCase().includes(keyword.toLowerCase())
                      }
                      record={activePlannedTreatment}
                      setRecord={setActivePlannedTreatment}
                    />
                    <MyInput
                      width={400}
                      fieldType="select"
                      fieldLabel="Billing Type"
                      fieldName="billingTypeLkey"
                      selectData={billingTypeLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={activePlannedTreatment}
                      setRecord={setActivePlannedTreatment}
                    />
                    <MyInput
                      width={400}
                      fieldName="fees"
                      fieldType="number"
                      record={activePlannedTreatment}
                      setRecord={setActivePlannedTreatment}
                    />
                    <MyInput
                      width={400}
                      fieldName="discount"
                      fieldType="number"
                      record={activePlannedTreatment}
                      setRecord={setActivePlannedTreatment}
                    />

                    <MyInput
                      width={400}
                      fieldName="note"
                      fieldType="textarea"
                      record={activePlannedTreatment}
                      setRecord={setActivePlannedTreatment}
                    />
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Stack spacing={2} divider={<Divider vertical />}>
                    <Button
                      appearance="primary"
                      onClick={() => {
                        savePlannedTreatment({
                          ...activePlannedTreatment,
                          type: 'CURRENT',
                          encounterKey: patientSlice.encounter.key,
                          patientKey: patientSlice.patient.key
                        }).unwrap();
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      appearance="primary"
                      color="red"
                      onClick={() => setActivePlanPopupOpen(false)}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Modal.Footer>
              </Modal>
              <Panel
                bordered
                header={
                  <h5>
                    <Translate>Active Plan</Translate>
                    <IconButton
                      style={{ marginLeft: '10px' }}
                      appearance="primary"
                      color="green"
                      icon={<icons.Plus />}
                      onClick={() => {
                        setActivePlanPopupOpen(true);
                        setActivePlannedTreatment({ ...newApDentalPlannedTreatment });
                      }}
                    >
                      <Translate>New</Translate>
                    </IconButton>
                    <IconButton
                      style={{ marginLeft: '10px' }}
                      appearance="primary"
                      color="blue"
                      icon={<icons.Edit />}
                      disabled={!activePlannedTreatment || !activePlannedTreatment.key}
                      onClick={() => {
                        setActivePlanPopupOpen(true);
                      }}
                    >
                      <Translate>Edit</Translate>
                    </IconButton>
                    <IconButton
                      style={{ marginLeft: '10px' }}
                      appearance="primary"
                      color="cyan"
                      disabled
                      icon={<icons.CheckOutline />}
                    >
                      <Translate>Sign</Translate>
                    </IconButton>
                  </h5>
                }
                style={{ width: '64%', display: 'inline-block' }}
              >
                <Table
                  data={treatmentPlan.current}
                  height={400}
                  rowHeight={60}
                  bordered
                  onRowClick={rowData => {
                    setActivePlannedTreatment(rowData);
                  }}
                  rowClassName={isActiveTreatmentSelected}
                >
                  <Table.Column flexGrow={2} align="center" fixed>
                    <Table.HeaderCell>CDT Code</Table.HeaderCell>
                    <Table.Cell>
                      {rowData => (
                        <Translate>{cdtMap[rowData.cdtKey]?.cdtCode ?? rowData.cdtKey}</Translate>
                      )}
                    </Table.Cell>
                  </Table.Column>
                  <Table.Column flexGrow={4} align="center" fixed>
                    <Table.HeaderCell>Procedure</Table.HeaderCell>
                    <Table.Cell>
                      {rowData => (
                        <Translate>
                          {cdtMap[rowData.cdtKey]?.description ?? rowData.cdtKey}
                        </Translate>
                      )}
                    </Table.Cell>
                  </Table.Column>
                  <Table.Column flexGrow={1} align="center" fixed>
                    <Table.HeaderCell>Tooth</Table.HeaderCell>
                    <Table.Cell>
                      {rowData =>
                        rowData.toothObject ? rowData.toothObject.toothNumber : rowData.toothKey
                      }
                    </Table.Cell>
                  </Table.Column>
                  <Table.Column flexGrow={2} align="center" fixed>
                    <Table.HeaderCell>Surface</Table.HeaderCell>
                    <Table.Cell>
                      {rowData =>
                        rowData.surfaceLvalue
                          ? rowData.surfaceLvalue.lovDisplayVale
                          : rowData.surfaceLkey
                      }
                    </Table.Cell>
                  </Table.Column>
                  <Table.Column flexGrow={2} align="center" fixed>
                    <Table.HeaderCell>Billing Type</Table.HeaderCell>
                    <Table.Cell>
                      {rowData =>
                        rowData.billingTypeLvalue
                          ? rowData.billingTypeLvalue.lovDisplayVale
                          : rowData.billingTypeLkey
                      }
                    </Table.Cell>
                  </Table.Column>
                  <Table.Column flexGrow={2} align="center" fixed>
                    <Table.HeaderCell>Fees</Table.HeaderCell>
                    <Table.Cell dataKey="fees" />
                  </Table.Column>
                  <Table.Column flexGrow={2} align="center" fixed>
                    <Table.HeaderCell>Discount</Table.HeaderCell>
                    <Table.Cell dataKey="discount" />
                  </Table.Column>
                  <Column flexGrow={1} align="center">
                    <HeaderCell>
                      <Translate>Note</Translate>
                    </HeaderCell>
                    <Cell>
                      {rowData =>
                        rowData.note && (
                          <Whisper
                            placement="left"
                            controlId="control-id-hover"
                            trigger="hover"
                            speaker={
                              <Tooltip>
                                <span style={{ fontSize: '20px' }}>{rowData.note}</span>
                              </Tooltip>
                            }
                          >
                            <icons.Message style={{ fontSize: '20px' }} />
                          </Whisper>
                        )
                      }
                    </Cell>
                  </Column>
                </Table>
              </Panel>
            </TabPanel>

            <TabPanel></TabPanel>
          </Tabs>
      </BlockUI>
    </>
  );
};

export default Dental;
