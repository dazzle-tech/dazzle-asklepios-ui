import React from "react";
import { useAppDispatch } from '@/hooks';
import {
  useSaveToothActionMutation,
  useCancelToothActionMutation,
  useSaveToothServiceMutation,
  useCancelToothServiceMutation
} from '@/services/dental/dentalChartService';
import { hideLoading, notify, showLoading } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import { toothIndexFromEnum, toothDisplayLabel, toothCssClassSuffix } from '@/utils/toothNumber';
import { useEffect, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { Button } from 'rsuite';
import { Box } from '@mui/material';
import clsx from 'clsx';

import './styles.less';
import MyModal from '../MyModal/MyModal';
import Tooth from './Tooth/Tooth';
import OcclusalBadge from './Tooth/OcclusalBadge';
import { getToothShapeType } from './Tooth/toothShape';
import ToothStateTab from './tabs/ToothStateTab';
import ToothHistoryTab from './tabs/ToothHistoryTab';
import ToothServicesTab from './tabs/ToothServicesTab';
import ToothCdtTab from './tabs/ToothCdtTab';

// One entry per surface that has an active (non-cancelled) action on the
// tooth; condition takes priority over treatment if both exist on the same
// surface, matching the main tooth icon's own condition-over-treatment rule.
const getSurfaceStates = (tooth: any, dentalActionsMap: any): Record<string, 'condition' | 'treatment'> => {
  const states: Record<string, 'condition' | 'treatment'> = {};
  (tooth?.actions ?? []).forEach((action: any) => {
    const actionType = dentalActionsMap?.[action.dentalActionId]?.type;
    if (actionType !== 'CONDITION' && actionType !== 'TREATMENT') return;
    if (states[action.surface] === 'condition') return;
    states[action.surface] = actionType === 'CONDITION' ? 'condition' : 'treatment';
  });
  return states;
};

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
    id: null,
    dentalActionId: null,
    surface: null,
    note: '',
    existing: false,
    anesthesiaUsed: '',
    dose: ''
  });

  const [currentToothService, setCurrentToothService] = useState({
    id: null,
    serviceId: null
  });

  // null (not '') for "no CDT selected" -- MyInput's SelectPicker treats an
  // empty string as a real selected value (no matching item -> renders
  // "[object Object]" instead of the placeholder), but treats null correctly.
  const [selectedCdt, setSelectedCdt] = useState<string | null>(null);

  const [addToothAction, addToothActionMutation] = useSaveToothActionMutation();
  const [addToothService, addToothServiceMutation] = useSaveToothServiceMutation();
  const [removeToothAction, removeToothActionMutation] = useCancelToothActionMutation();

  useEffect(() => {
    if (chartObject?.teeth) {
      const upper = [];
      const lower = [];
      // Half-based split (16/32 permanent, 10/20 primary) instead of a
      // hardcoded "< 17" so this works for both tooth sets automatically.
      const upperCutoff = chartObject.teeth.length / 2;

      chartObject.teeth.map((tooth: any) => {
        if (toothIndexFromEnum(tooth.toothNumber) <= upperCutoff) {
          upper.push(tooth);
        } else {
          lower.unshift(tooth);
        }
      });

      setUpperTeeth(upper);
      setLowerTeeth(lower);
    }
  }, [chartObject]);

  const handleErrorMessage = (missingFields: string[]) => {
    if (missingFields.length === 0) return false;
    dispatch(notify({ msg: `Required: ${missingFields.join(', ')}`, sev: 'error' }));
    return true;
  };

  const addAction = () => {
    const action = dentalActionsMap?.[currentToothAction.dentalActionId];
    const missingFields: string[] = [];
    if (!currentToothAction.dentalActionId) missingFields.push('Dental Action');
    if (!currentToothAction.surface) missingFields.push('Surface');
    if (action?.type === 'TREATMENT' && !currentToothAction.existing && !selectedCdt) {
      missingFields.push('CDT Code');
    }
    if (handleErrorMessage(missingFields)) return;

    addToothAction({
      id: currentToothAction.id,
      toothId: selectedTooth.id,
      dentalActionId: currentToothAction.dentalActionId,
      surface: currentToothAction.surface,
      note: currentToothAction.note,
      existing: currentToothAction.existing,
      cdtCodeId: selectedCdt,
      anesthesiaUsed: currentToothAction.anesthesiaUsed,
      dose: currentToothAction.dose
    });
  };

  useEffect(() => {
    if (addToothActionMutation.status === 'fulfilled') {
      setCurrentToothAction({
        id: null,
        dentalActionId: null,
        surface: null,
        note: '',
        existing: false,
        anesthesiaUsed: '',
        dose: ''
      });
      setSelectedCdt(null);

      setChartObject(addToothActionMutation.data);
      for (const toothKey in addToothActionMutation.data.teeth) {
        const tooth = addToothActionMutation.data.teeth[toothKey];
        if (tooth.id === selectedTooth.id) {
          setSelectedTooth(tooth);
          break;
        }
      }
      setTreatmentPlanTrigger(treatmentPlanTrigger * -1);
      dispatch(hideLoading());
    } else if (addToothActionMutation.status === 'rejected') {
      dispatch(hideLoading());
      dispatch(notify({ msg: extractApiErrorMessage(addToothActionMutation.error) || 'Add action error', sev: 'error' }));
    } else if (addToothActionMutation.status === 'pending') {
      dispatch(showLoading());
    }
  }, [addToothActionMutation]);

  const addService = () => {
    addToothService({
      toothId: selectedTooth.id,
      serviceId: currentToothService.serviceId
    });
  };

  useEffect(() => {
    if (addToothServiceMutation.status === 'fulfilled') {
      setCurrentToothService({
        id: null,
        serviceId: null
      });

      setChartObject(addToothServiceMutation.data);
      for (const toothKey in addToothServiceMutation.data.teeth) {
        const tooth = addToothServiceMutation.data.teeth[toothKey];
        if (tooth.id === selectedTooth.id) {
          setSelectedTooth(tooth);
          break;
        }
      }
      dispatch(hideLoading());
    } else if (addToothServiceMutation.status === 'rejected') {
      dispatch(hideLoading());
      dispatch(notify({ msg: extractApiErrorMessage(addToothServiceMutation.error) || 'Add service error', sev: 'error' }));
    } else if (addToothServiceMutation.status === 'pending') {
      dispatch(showLoading());
    }
  }, [addToothServiceMutation]);

  useEffect(() => {
    if (removeToothActionMutation.status === 'fulfilled') {
      setCurrentToothAction({
        id: null,
        dentalActionId: null,
        surface: null,
        note: '',
        existing: false,
        anesthesiaUsed: '',
        dose: ''
      });
      setSelectedCdt(null);

      setChartObject(removeToothActionMutation.data);
      for (const toothKey in removeToothActionMutation.data.teeth) {
        const tooth = removeToothActionMutation.data.teeth[toothKey];
        if (tooth.id === selectedTooth.id) {
          setSelectedTooth(tooth);
          break;
        }
      }
      setTreatmentPlanTrigger(treatmentPlanTrigger * -1);
      dispatch(hideLoading());
    } else if (removeToothActionMutation.status === 'rejected') {
      dispatch(hideLoading());
      dispatch(notify({ msg: extractApiErrorMessage(removeToothActionMutation.error) || 'Remove action error', sev: 'error' }));
    } else if (removeToothActionMutation.status === 'pending') {
      dispatch(showLoading());
    }
  }, [removeToothActionMutation]);

  const clearCurrentAction = () => {
    setCurrentToothAction({
      id: null,
      dentalActionId: null,
      surface: null,
      note: '',
      existing: false,
      anesthesiaUsed: '',
      dose: ''
    });
    setSelectedCdt(null);
  };

  const clearCurrentService = () => {
    setCurrentToothService({
      id: null,
      serviceId: null
    });
  };

  return (
    <>
      <Box className="dental-chart-container">
        <Box className="tooth-arc upper">
          {upperTeeth.map((_tooth: any, idx: number) => {
            const total = upperTeeth.length;
            const angle = (Math.PI * idx) / (total - 1);
            const x = 50 + 44 * Math.cos(angle - Math.PI);
            const y = 50 + 65 * Math.sin(angle - Math.PI);
            const rotationDeg = (idx - total / 2) * 11;
            const selected = _tooth.toothNumber === selectedTooth.toothNumber;
            const hasCondition = (_tooth as any).actions?.some(
              action => dentalActionsMap?.[action.dentalActionId]?.type === 'CONDITION'
            );
            const hasTreatment = (_tooth as any).actions?.some(
              action => dentalActionsMap?.[action.dentalActionId]?.type === 'TREATMENT'
            );
            return (
              <div
                key={_tooth.id}
                className={clsx(`tooth-slot`, {
                  selected: selected
                })}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`
                }}
              >
                <div className="tooth-number">{toothDisplayLabel(_tooth.toothNumber)}</div>
                <Button
                  disabled={props.disabled}
                  onClick={() => setSelectedTooth(_tooth)}
                  onDoubleClick={() => setActionModalOpen(true)}
                  appearance={
                    _tooth.toothNumber === selectedTooth.toothNumber ? 'primary' : 'default'
                  }
                  className={clsx(`tooth-btn tooth_${toothCssClassSuffix(_tooth.toothNumber)}`)}
                >
                  {/* Upper jaw: root attaches to the gum above, crown points down into the mouth. */}
                  <div style={{ transform: 'scaleY(-1)' }}>
                    <Tooth
                      chartTooth={_tooth}
                      selected={selected}
                      type={dentalActionsMap?.[(_tooth as any)?.actions[0]?.dentalActionId]?.type}
                      hasCondition={hasCondition}
                      hasTreatment={hasTreatment}
                    />
                  </div>
                </Button>
                <div className="tooth-occlusal-badge">
                  <OcclusalBadge
                    shapeType={getToothShapeType(_tooth.toothNumber)}
                    surfaceStates={getSurfaceStates(_tooth, dentalActionsMap)}
                  />
                </div>
              </div>
            );
          })}
        </Box>

        <Box className="tooth-arc lower">
          {lowerTeeth.map((_tooth: any, idx: number) => {
            const total = lowerTeeth.length;
            const angle = (Math.PI * idx) / (total - 1);
            const x = 50 + 44 * Math.cos(angle);
            const y = 50 + 70 * Math.sin(angle);
            const rotationDeg = (idx - total / 2) * 11;
            const selected = _tooth.toothNumber === selectedTooth.toothNumber;
            const hasCondition = (_tooth as any).actions?.some(
              action => dentalActionsMap?.[action.dentalActionId]?.type === 'CONDITION'
            );
            const hasTreatment = (_tooth as any).actions?.some(
              action => dentalActionsMap?.[action.dentalActionId]?.type === 'TREATMENT'
            );
            return (
              <div
                key={_tooth.id}
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
                  className={clsx(`tooth-btn tooth_${toothCssClassSuffix(_tooth.toothNumber)}`)}
                >
                  <div>
                    <Tooth
                      chartTooth={_tooth}
                      selected={selected}
                      type={dentalActionsMap?.[(_tooth as any)?.actions[0]?.dentalActionId]?.type}
                      hasCondition={hasCondition}
                      hasTreatment={hasTreatment}
                    />
                  </div>
                </Button>
                <div className="tooth-occlusal-badge">
                  <OcclusalBadge
                    shapeType={getToothShapeType(_tooth.toothNumber)}
                    surfaceStates={getSurfaceStates(_tooth, dentalActionsMap)}
                  />
                </div>
                <div className="tooth-number">{toothDisplayLabel(_tooth.toothNumber)}</div>
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
        customClassName="dental-chart-modal"
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
