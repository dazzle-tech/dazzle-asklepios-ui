import { useAppDispatch } from '@/hooks';
import {
  useGetActionsQuery,
  useModifyToothActionMutation,
  useModifyToothServiceMutation
} from '@/services/dentalService';
import { useGetCdtsByTreatmentQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ApDentalChartTooth } from '@/types/model-types';
import { initialListRequest, ListRequest } from '@/types/types';
import { hideLoading, notify, showLoading } from '@/utils/uiReducerActions';
import { Close } from '@rsuite/icons';
import Trash from '@rsuite/icons/Trash';
import Check from '@rsuite/icons/Check';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import {
  Button,
  ButtonGroup,
  ButtonToolbar,
  Checkbox,
  Divider,
  Drawer,
  IconButton,
  Input,
  List,
  Modal,
  Panel,
  Radio,
  SelectPicker,
  Stack,
  Table
} from 'rsuite';
import { ItemDataType } from 'rsuite/esm/@types/common';
import Translate from '../Translate';
import Tooth from './Tooth/Tooth';

const DentalChart = ({
  chartObject,
  setChartObject,
  dentalActionsMap,
  dentalActionsList,
  dentalServicesMap,
  dentalServicesList,
  cdtMap,
  cdtList,
  selectedTooth,
  setSelectedTooth,
  treatmentPlanTrigger,
  setTreatmentPlanTrigger,
  ...props
}) => {
  const dispatch = useAppDispatch();

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [upperTeeth, setUpperTeeth] = useState([]);
  const [lowerTeeth, setLowerTeeth] = useState([]);

  const [currentToothAction, setCurrentToothAction] = useState({
    key: null,
    actionKey: '',
    surfaceKey: '',
    note: '',
    existing: false
  });

  const [currentToothService, setCurrentToothService] = useState({
    key: null,
    serviceKey: ''
  });

  const [selectedCdt, setSelectedCdt] = useState('');

  const [addToothAction, addToothActionMutation] = useModifyToothActionMutation();
  const [addToothService, addToothServiceMutation] = useModifyToothServiceMutation();
  const [removeToothAction, removeToothActionMutation] = useModifyToothActionMutation();

  const { data: toothSurfaceLovQueryResponse } = useGetLovValuesByCodeQuery('TOOTH_SURF');

  const { data: treatmentCdtListQueryResponse, isLoading: treatmentCdtListIsLoading } =
    useGetCdtsByTreatmentQuery(currentToothAction.actionKey);

  useEffect(() => {
    if (chartObject && chartObject.chartTeeth) {
      // populate local chart state from backend data
      let upper = [];
      let lower = [];

      chartObject.chartTeeth.map((tooth: any) => {
        if (tooth.toothNumberNumeric < 17) {
          // upper tooth
          upper.push(tooth);
        } else {
          lower.unshift(tooth);
        }
      });

      setUpperTeeth(upper);
      setLowerTeeth(lower);
    }
  }, [chartObject]);

  const addAction = () => {
    addToothAction({
      key: currentToothAction.key,
      toothKey: selectedTooth.key,
      actionKey: currentToothAction.actionKey,
      surface: currentToothAction.surfaceKey,
      note: currentToothAction.note,
      existing: currentToothAction.existing,
      cdtKey: selectedCdt,
      operation: 'SAVE'
    }).unwrap();
  };

  useEffect(() => {
    if (addToothActionMutation.status === 'fulfilled') {
      setCurrentToothAction({
        key: null,
        actionKey: '',
        surfaceKey: '',
        note: '',
        existing: false
      });
      setSelectedCdt('');

      setChartObject(addToothActionMutation.data);
      for (const toothKey in addToothActionMutation.data.chartTeeth) {
        const tooth = addToothActionMutation.data.chartTeeth[toothKey];
        if (tooth.key === selectedTooth.key) {
          setSelectedTooth(tooth);
          break;
        }
      }
      setTreatmentPlanTrigger(treatmentPlanTrigger * -1);
      dispatch(hideLoading());
    } else if (addToothActionMutation.status === 'rejected') {
      dispatch(hideLoading());
      dispatch(notify({ msg: 'Add action error', sev: 'error' }));
    } else if (addToothActionMutation.status === 'pending') {
      dispatch(showLoading());
    }
  }, [addToothActionMutation]);

  const addService = () => {
    addToothService({
      key: currentToothService.key,
      toothKey: selectedTooth.key,
      serviceKey: currentToothService.serviceKey,
      operation: 'SAVE'
    }).unwrap();
  };

  useEffect(() => {
    if (addToothServiceMutation.status === 'fulfilled') {
      setCurrentToothService({
        key: null,
        serviceKey: ''
      });

      setChartObject(addToothServiceMutation.data);
      for (const toothKey in addToothServiceMutation.data.chartTeeth) {
        const tooth = addToothServiceMutation.data.chartTeeth[toothKey];
        if (tooth.key === selectedTooth.key) {
          setSelectedTooth(tooth);
          break;
        }
      }
      dispatch(hideLoading());
    } else if (addToothServiceMutation.status === 'rejected') {
      dispatch(hideLoading());
      dispatch(notify({ msg: 'Add service error', sev: 'error' }));
    } else if (addToothServiceMutation.status === 'pending') {
      dispatch(showLoading());
    }
  }, [addToothServiceMutation]);

  useEffect(() => {
    if (removeToothActionMutation.status === 'fulfilled') {
      setCurrentToothAction({
        key: null,
        actionKey: '',
        surfaceKey: '',
        note: '',
        existing: false
      });
      setSelectedCdt('');

      setChartObject(removeToothActionMutation.data);
      for (const toothKey in removeToothActionMutation.data.chartTeeth) {
        const tooth = removeToothActionMutation.data.chartTeeth[toothKey];
        if (tooth.key === selectedTooth.key) {
          setSelectedTooth(tooth);
          break;
        }
      }
      setTreatmentPlanTrigger(treatmentPlanTrigger * -1);
      dispatch(hideLoading());
    } else if (removeToothActionMutation.status === 'rejected') {
      dispatch(hideLoading());
      dispatch(notify({ msg: 'Add action error', sev: 'error' }));
    } else if (removeToothActionMutation.status === 'pending') {
      dispatch(showLoading());
    }
  }, [removeToothActionMutation]);

  const handleRemoveRow = (rowIndex: number) => {
    console.log(rowIndex);
  };

  return (
    <>
      <Panel>
        <Stack id="upper" spacing={1}>
          {upperTeeth &&
            upperTeeth.map((_tooth: ApDentalChartTooth) => {
              return (
                <div key={_tooth.key}>
                  <div
                    style={{
                      fontSize: '30px',
                      color: _tooth.toothNumber === selectedTooth.toothNumber ? 'blue' : '',
                      textAlign: 'center'
                    }}
                  >
                    <b>{_tooth.toothNumber}</b>
                  </div>
                  <Button
                    disabled={props.disabled}
                    onClick={() => setSelectedTooth(_tooth)}
                    onDoubleClick={() => setActionModalOpen(true)}
                    appearance={
                      _tooth.toothNumber === selectedTooth.toothNumber ? 'primary' : 'default'
                    }
                  >
                    <Tooth
                      chartTooth={_tooth}
                      key={_tooth.key}
                      selected={_tooth.toothNumber === selectedTooth.toothNumber}
                    />
                  </Button>
                </div>
              );
            })}
        </Stack>
        <hr />
        <Stack id="lower" spacing={1}>
          {lowerTeeth &&
            lowerTeeth.map((_tooth: ApDentalChartTooth) => {
              return (
                <div key={_tooth.key}>
                  <div
                    style={{
                      fontSize: '30px',
                      color: _tooth.toothNumber === selectedTooth.toothNumber ? 'blue' : '',
                      textAlign: 'center'
                    }}
                  >
                    <b>{_tooth.toothNumber}</b>
                  </div>
                  <Button
                    disabled={props.disabled}
                    onClick={() => setSelectedTooth(_tooth)}
                    onDoubleClick={() => setActionModalOpen(true)}
                    appearance={
                      _tooth.toothNumber === selectedTooth.toothNumber ? 'primary' : 'default'
                    }
                  >
                    <Tooth
                      chartTooth={_tooth}
                      key={_tooth.key}
                      selected={_tooth.toothNumber === selectedTooth.toothNumber}
                    />
                  </Button>
                </div>
              );
            })}
        </Stack>
      </Panel>
      <Drawer
        open={actionModalOpen}
        style={{ width: '80%' }}
        onClose={() => {
          setActionModalOpen(false);
          setCurrentToothAction({
            key: null,
            actionKey: '',
            surfaceKey: '',
            note: '',
            existing: false
          });
          setCurrentToothService({
            key: null,
            serviceKey: ''
          });
        }}
      >
        <Drawer.Header>
          <Drawer.Title>
            <Translate>Inside Tooth Details - </Translate> <b># {selectedTooth.toothNumber}</b>
          </Drawer.Title>
          <Drawer.Actions>
            <Button
              appearance="primary"
              color="green"
              onClick={() => {
                setActionModalOpen(false);
              }}
            >
              <Translate>Close</Translate>
            </Button>
          </Drawer.Actions>
        </Drawer.Header>
        <Drawer.Body>
          <Tabs>
            <TabList>
              <Tab>Current Tooth State</Tab>
              <Tab>Tooth History</Tab>
              <Tab>Applied Services</Tab>
              <Tab>CDT Procedures</Tab>
            </TabList>

            <TabPanel>
              <div style={{ width: '30%', marginRight: '10px', display: 'inline' }}>
                <SelectPicker
                  style={{ width: '30%', marginRight: '10px' }}
                  placeholder={<Translate>Select Action From List</Translate>}
                  value={currentToothAction.actionKey}
                  disabled={currentToothAction.key ? true : false}
                  onChange={e =>
                    setCurrentToothAction({
                      ...currentToothAction,
                      actionKey: e
                    })
                  }
                  data={dentalActionsList}
                  renderMenuItem={(label, action) => {
                    return (
                      <div style={{ color: action.type === 'treatment' ? 'green' : 'red' }}>
                        {action.description}
                      </div>
                    );
                  }}
                  labelKey="description"
                  valueKey="key"
                />
                <Checkbox
                  disabled={
                    !dentalActionsMap[currentToothAction.actionKey] ||
                    dentalActionsMap[currentToothAction.actionKey].type !== 'treatment' ||
                    currentToothAction.key
                      ? true
                      : false
                  }
                  style={{ width: '10%', marginLeft: '10px', display: 'inline-block' }}
                  checked={currentToothAction.existing}
                  onChange={(value: string | number, checked: boolean, event) => {
                    setCurrentToothAction({
                      ...currentToothAction,
                      existing: checked
                    });

                    if (checked) {
                      setSelectedCdt('');
                    }
                  }}
                >
                  <Translate>Existing?</Translate>
                </Checkbox>

                <br />
                <SelectPicker
                  disabled={
                    !dentalActionsMap[currentToothAction.actionKey] ||
                    dentalActionsMap[currentToothAction.actionKey].type !== 'treatment' ||
                    currentToothAction.existing
                      ? true
                      : false
                  }
                  style={{ width: '30%', marginRight: '10px' }}
                  placeholder={
                    <Translate>
                      {currentToothAction.key
                        ? '(+) Add new CDT to this treatment'
                        : 'Select CDT (Treatment Only)'}
                    </Translate>
                  }
                  value={selectedCdt}
                  onChange={e => setSelectedCdt(e)}
                  data={treatmentCdtListQueryResponse?.object ?? []}
                  loading={treatmentCdtListIsLoading}
                  labelKey="description"
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
                  valueKey="key"
                />
              </div>
              <SelectPicker
                style={{ width: '10%', marginRight: '10px' }}
                placeholder={<Translate>Select Surface</Translate>}
                disabled={currentToothAction.key ? true : false}
                value={currentToothAction.surfaceKey}
                onChange={e =>
                  setCurrentToothAction({
                    ...currentToothAction,
                    surfaceKey: e
                  })
                }
                data={toothSurfaceLovQueryResponse?.object ?? []}
                labelKey="lovDisplayVale"
                valueKey="key"
              />
              <Input
                style={{ width: '35%', marginRight: '10px', display: 'inline' }}
                placeholder={'Notes'}
                value={currentToothAction.note}
                onChange={e =>
                  setCurrentToothAction({
                    ...currentToothAction,
                    note: e
                  })
                }
              />
              <IconButton
                appearance="primary"
                style={{ marginRight: '10px' }}
                color="blue"
                onClick={() => {
                  addAction();
                }}
                icon={<Check />}
              >
                <Translate>Save</Translate>
              </IconButton>
              <IconButton
                appearance="primary"
                style={{ marginRight: '10px' }}
                color="red"
                disabled={!currentToothAction.key}
                onClick={() => {
                  removeToothAction({
                    toothKey: selectedTooth.key,
                    key: currentToothAction.key,
                    actionKey: currentToothAction.actionKey,
                    operation: 'REMOVE'
                  }).unwrap();
                }}
                icon={<Trash />}
              >
                <Translate>Remove</Translate>
              </IconButton>
              <Button
                appearance="default"
                onClick={() => {
                  setCurrentToothAction({
                    key: null,
                    actionKey: '',
                    surfaceKey: '',
                    note: '',
                    existing: false
                  });
                  setSelectedCdt('');
                }}
              >
                <Translate>Clear</Translate>
              </Button>
              <hr />
              <Panel
                header={
                  <>
                    <Translate>Applied Actions on Tooth</Translate>{' '}
                    <b># {selectedTooth.toothNumber}</b>
                  </>
                }
                bordered
              >
                <div
                  style={{ textAlign: 'center', zoom: 0.6, display: 'inline-block', width: '10%' }}
                >
                  <Tooth
                    chartTooth={selectedTooth}
                    key={selectedTooth.key}
                    selected={selectedTooth.toothNumber}
                  />
                </div>
                <div style={{ textAlign: 'center', display: 'inline-block', width: '90%' }}>
                  <Table
                    data={selectedTooth.toothActions}
                    height={400}
                    rowHeight={60}
                    bordered
                    rowClassName={rowData =>
                      rowData && rowData.key === currentToothAction.key ? 'selected-row' : ''
                    }
                    onRowClick={rowData => {
                      setCurrentToothAction({
                        key: rowData.key,
                        actionKey: rowData.actionKey,
                        surfaceKey: rowData.surfaceLkey,
                        note: rowData.note,
                        existing: rowData.existing
                      });
                    }}
                  >
                    <Table.Column flexGrow={1}>
                      <Table.HeaderCell>
                        <Translate>Existing</Translate>
                      </Table.HeaderCell>
                      <Table.Cell>
                        {rowData => <Translate>{rowData.existing ? 'Yes' : 'No'}</Translate>}
                      </Table.Cell>
                    </Table.Column>
                    <Table.Column flexGrow={3} align="center" fixed>
                      <Table.HeaderCell>Action</Table.HeaderCell>
                      <Table.Cell>
                        {rowData => (
                          <Translate> {dentalActionsMap[rowData.actionKey].description}</Translate>
                        )}
                      </Table.Cell>
                    </Table.Column>
                    <Table.Column flexGrow={1} align="center" fixed>
                      <Table.HeaderCell>Surface</Table.HeaderCell>
                      <Table.Cell>
                        {rowData =>
                          rowData.surfaceLvalue
                            ? rowData.surfaceLvalue.lovDisplayVale
                            : rowData.surfaceLkey
                        }
                      </Table.Cell>
                    </Table.Column>
                    <Table.Column flexGrow={5} align="center" fixed>
                      <Table.HeaderCell>Note</Table.HeaderCell>
                      <Table.Cell>{rowData => rowData.note}</Table.Cell>
                    </Table.Column>
                  </Table>
                </div>
              </Panel>
            </TabPanel>

            <TabPanel>
              <Table data={selectedTooth.toothHistory} height={650} rowHeight={60} bordered>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Action Type</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <small>
                        {dentalActionsMap[rowData.actionKey].type === 'treatment' ? (
                          <b style={{ color: 'green' }}>Treatment</b>
                        ) : (
                          <b style={{ color: 'red' }}>Condition</b>
                        )}
                      </small>
                    )}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={3}>
                  <Table.HeaderCell>Audit Details</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <span>
                        <Translate>
                          <b>
                            {rowData.logType === 'SAVE'
                              ? 'Added '
                              : rowData.logType === 'CHANGE'
                              ? 'Changed To'
                              : 'Removed '}
                          </b>{' '}
                        </Translate>
                        <Translate> {dentalActionsMap[rowData.actionKey].description}</Translate>
                        <Translate> @ {rowData.fingerprint}</Translate>
                      </span>
                    )}
                  </Table.Cell>
                </Table.Column>
              </Table>
            </TabPanel>

            <TabPanel>
              <SelectPicker
                style={{ width: '30%', marginRight: '10px' }}
                placeholder={<Translate>Select Service From List</Translate>}
                value={currentToothService.serviceKey}
                loading={props.servicesLoading}
                onChange={e =>
                  setCurrentToothService({
                    ...currentToothService,
                    serviceKey: e
                  })
                }
                data={dentalServicesList}
                labelKey="name"
                valueKey="key"
              />
              <Button
                style={{ marginRight: '10px' }}
                appearance="primary"
                color="green"
                onClick={() => {
                  addService();
                }}
              >
                <Translate>Add Service</Translate>
              </Button>
              <hr />
              <Panel
                header={
                  <>
                    <Translate>Applied Services on Tooth</Translate>{' '}
                    <b># {selectedTooth.toothNumber}</b>
                  </>
                }
                bordered
              >
                <div style={{ textAlign: 'center', display: 'inline-block', width: '90%' }}>
                  <Table data={selectedTooth.toothServices} height={400} rowHeight={60} bordered>
                    <Table.Column flexGrow={3} align="center" fixed>
                      <Table.HeaderCell>Service</Table.HeaderCell>
                      <Table.Cell>
                        {rowData => (
                          <Translate> {dentalServicesMap[rowData.serviceKey].name}</Translate>
                        )}
                      </Table.Cell>
                    </Table.Column>
                    <Table.Column flexGrow={3} align="center" fixed>
                      <Table.HeaderCell>Source</Table.HeaderCell>
                      <Table.Cell>
                        {rowData => {
                          return <Translate> {rowData.source}</Translate>;
                        }}
                      </Table.Cell>
                    </Table.Column>
                    <Table.Column flexGrow={3} align="center" fixed>
                      <Table.HeaderCell>Price</Table.HeaderCell>
                      <Table.Cell>
                        {rowData => (
                          <Translate> {dentalServicesMap[rowData.serviceKey].price}</Translate>
                        )}
                      </Table.Cell>
                    </Table.Column>
                    <Table.Column flexGrow={1} align="center" fixed>
                      <Table.HeaderCell>Remove</Table.HeaderCell>
                      <Table.Cell>
                        {(rowData, rowIndex) => (
                          <IconButton
                            appearance="primary"
                            color="red"
                            icon={<Trash />}
                            onClick={() => handleRemoveRow(rowIndex)}
                          />
                        )}
                      </Table.Cell>
                    </Table.Column>
                  </Table>
                </div>
              </Panel>
            </TabPanel>

            <TabPanel>
              <Table data={selectedTooth.toothCdts} height={400} rowHeight={60} bordered>
                <Table.Column flexGrow={2} align="center" fixed>
                  <Table.HeaderCell>Code</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <Translate> {cdtMap[rowData.cdtKey]?.cdtCode ?? rowData.cdtKey}</Translate>
                    )}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={5} align="center" fixed>
                  <Table.HeaderCell>CDT</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <Translate> {cdtMap[rowData.cdtKey]?.description ?? 'Loading...'}</Translate>
                    )}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1} align="center" fixed>
                  <Table.HeaderCell>Surface</Table.HeaderCell>
                  <Table.Cell>
                    {rowData =>
                      rowData.surfaceLvalue
                        ? rowData.surfaceLvalue.lovDisplayVale
                        : rowData.surfaceLkey
                    }
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={3} align="center" fixed>
                  <Table.HeaderCell>Source</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => {
                      return <Translate> {rowData.source}</Translate>;
                    }}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1} align="center" fixed>
                  <Table.HeaderCell>Remove</Table.HeaderCell>
                  <Table.Cell>
                    {(rowData, rowIndex) => (
                      <IconButton
                        appearance="primary"
                        color="red"
                        icon={<Trash />}
                        onClick={() => handleRemoveRow(rowIndex)}
                      />
                    )}
                  </Table.Cell>
                </Table.Column>
              </Table>
            </TabPanel>
          </Tabs>
        </Drawer.Body>
      </Drawer>
    </>
  );
};

export default DentalChart;
