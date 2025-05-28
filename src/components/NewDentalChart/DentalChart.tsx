import React from "react";
import { useAppDispatch } from '@/hooks';
import {
  useModifyToothActionMutation,
  useModifyToothServiceMutation
} from '@/services/dentalService';
import type { ApDentalChartTooth } from '@/types/model-types';
import { hideLoading, notify, showLoading } from '@/utils/uiReducerActions';
import { useEffect, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { Button } from 'rsuite';
import { Box } from '@mui/material';
import clsx from 'clsx';

import './styles.less';
import MyModal from '../MyModal/MyModal';
import Tooth from './Tooth/Tooth';
import ToothStateTab from './tabs/ToothStateTab';
import ToothHistoryTab from './tabs/ToothHistoryTab';
import ToothServicesTab from './tabs/ToothServicesTab';
import ToothCdtTab from './tabs/ToothCdtTab';

const DentalChart = ({
  chartObject,
  setChartObject,
  dentalActionsMap,
  dentalActionsList,
  dentalServicesMap,
  dentalServicesList,
  cdtMap,
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

  useEffect(() => {
    if (chartObject?.chartTeeth) {
      const upper = [];
      const lower = [];

      chartObject.chartTeeth.map((tooth: any) => {
        if (tooth.toothNumberNumeric < 17) {
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

  const clearCurrentAction = () => {
    setCurrentToothAction({
      key: null,
      actionKey: '',
      surfaceKey: '',
      note: '',
      existing: false
    });
    setSelectedCdt('');
  };

  const clearCurrentService = () => {
    setCurrentToothService({
      key: null,
      serviceKey: ''
    });
  };

  return (
    <>
      <Box className="dental-chart-container">
        <Box className="tooth-arc upper">
          {upperTeeth.map((_tooth: ApDentalChartTooth, idx: number) => {
            const total = upperTeeth.length;
            const angle = (Math.PI * idx) / (total - 1);
            const x = 50 + 50 * Math.cos(angle - Math.PI);
            const y = 50 + 60 * Math.sin(angle - Math.PI);
            const rotationDeg = (idx - total / 2) * 11;
            const selected = _tooth.toothNumber === selectedTooth.toothNumber;
            const hasCondition = (_tooth as any).toothActions?.some(
              action => dentalActionsMap?.[action.actionKey]?.type === 'condition'
            );
            const hasTreatment = (_tooth as any).toothActions?.some(
              action => dentalActionsMap?.[action.actionKey]?.type === 'treatment'
            );
            return (
              <div
                key={_tooth.key}
                className={clsx(`tooth-slot`, {
                  selected: selected
                })}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`
                }}
              >
                <div className="tooth-number">{_tooth.toothNumber}</div>
                <Button
                  disabled={props.disabled}
                  onClick={() => setSelectedTooth(_tooth)}
                  onDoubleClick={() => setActionModalOpen(true)}
                  appearance={
                    _tooth.toothNumber === selectedTooth.toothNumber ? 'primary' : 'default'
                  }
                  className={clsx(`tooth-btn tooth_${_tooth.toothNumber}`)}
                >
                  <div>
                    <Tooth
                      chartTooth={_tooth}
                      selected={selected}
                      type={dentalActionsMap?.[(_tooth as any)?.toothActions[0]?.actionKey]?.type}
                      hasCondition={hasCondition}
                      hasTreatment={hasTreatment}
                    />
                  </div>
                </Button>
              </div>
            );
          })}
        </Box>

        <Box className="tooth-arc lower">
          {lowerTeeth.map((_tooth: ApDentalChartTooth, idx: number) => {
            const total = lowerTeeth.length;
            const angle = (Math.PI * idx) / (total - 1);
            const x = 50 + 50 * Math.cos(angle);
            const y = 50 + 65 * Math.sin(angle);
            const rotationDeg = (idx - total / 2) * 11;
            const selected = _tooth.toothNumber === selectedTooth.toothNumber;
            const hasCondition = (_tooth as any).toothActions?.some(
              action => dentalActionsMap?.[action.actionKey]?.type === 'condition'
            );
            const hasTreatment = (_tooth as any).toothActions?.some(
              action => dentalActionsMap?.[action.actionKey]?.type === 'treatment'
            );
            return (
              <div
                key={_tooth.key}
                className={clsx(`tooth-slot`, {
                  selected: selected
                })}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`
                }}
              >
                <Button
                  disabled={props.disabled}
                  onClick={() => setSelectedTooth(_tooth)}
                  onDoubleClick={() => setActionModalOpen(true)}
                  appearance={
                    _tooth.toothNumber === selectedTooth.toothNumber ? 'primary' : 'default'
                  }
                  className={clsx(`tooth-btn tooth_${_tooth.toothNumber}`)}
                >
                  <div>
                    <Tooth
                      chartTooth={_tooth}
                      selected={selected}
                      type={dentalActionsMap?.[(_tooth as any)?.toothActions[0]?.actionKey]?.type}
                      hasCondition={hasCondition}
                      hasTreatment={hasTreatment}
                    />
                  </div>
                </Button>
                <div className="tooth-number">{_tooth.toothNumber}</div>
              </div>
            );
          })}
        </Box>
      </Box>

      <MyModal
        open={actionModalOpen}
        size="70vw"
        position="right"
        setOpen={() => {
          setActionModalOpen(false);
          clearCurrentAction();
          clearCurrentService();
        }}
        title={`Tooth Details - #${selectedTooth.toothNumber}`}
        actionButtonFunction={() => addAction()}
        content={
          <Tabs>
            <TabList>
              <Tab>Current Tooth State</Tab>
              <Tab>Tooth History</Tab>
              <Tab>Applied Services</Tab>
              <Tab>CDT Procedures</Tab>
            </TabList>

            <TabPanel>
              <ToothStateTab
                selectedTooth={selectedTooth}
                currentToothAction={currentToothAction}
                setCurrentToothAction={setCurrentToothAction}
                selectedCdt={selectedCdt}
                setSelectedCdt={setSelectedCdt}
                dentalActionsList={dentalActionsList}
                dentalActionsMap={dentalActionsMap}
                removeToothAction={removeToothAction}
                clearCurrentAction={clearCurrentAction}
              />
            </TabPanel>

            <TabPanel>
              <ToothHistoryTab selectedTooth={selectedTooth} dentalActionsMap={dentalActionsMap} />
            </TabPanel>

            <TabPanel>
              <ToothServicesTab
                selectedTooth={selectedTooth}
                currentToothService={currentToothService}
                setCurrentToothService={setCurrentToothService}
                dentalServicesList={dentalServicesList}
                dentalServicesMap={dentalServicesMap}
                addService={addService}
                servicesLoading={props.servicesLoading}
              />
            </TabPanel>

            <TabPanel>
              <ToothCdtTab selectedTooth={selectedTooth} cdtMap={cdtMap} />
            </TabPanel>
          </Tabs>
        }
      />
    </>
  );
};

export default DentalChart;
