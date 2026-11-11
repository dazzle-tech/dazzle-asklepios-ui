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
import {
  toothDisplayLabel,
  toothCssClassSuffix,
  isPrimaryTooth,
  splitChartTeethByArch
} from '@/utils/toothNumber';
import { useEffect, useRef, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { Button } from 'rsuite';
import { Box } from '@mui/material';
import clsx from 'clsx';

import './styles.less';
import MyModal from '../MyModal/MyModal';
import Tooth from './Tooth/Tooth';
import OcclusalBadge from './Tooth/OcclusalBadge';
import AdultOcclusal from './Tooth/AdultOcclusal';
import { getToothShapeType } from './Tooth/toothShape';
import ToothStateTab from './tabs/ToothStateTab';
import ToothHistoryTab from './tabs/ToothHistoryTab';
import ToothServicesTab from './tabs/ToothServicesTab';
import ToothCdtTab from './tabs/ToothCdtTab';
import {
  dentalTreatmentPlanService,
  useCreateTreatmentPlanMutation,
  useGetTreatmentPlansByPatientQuery,
  useGetTreatmentPlanSessionsQuery
} from '@/services/dental/dentalTreatmentPlanService';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import TreatmentPlanHeaderModal, {
  toPractitionerOptions
} from '@/pages/encounter/dental-screen/tabs/TreatmentPlan/TreatmentPlanHeaderModal';

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
  selectedTeeth,
  setSelectedTeeth,
  treatmentPlanTrigger,
  setTreatmentPlanTrigger,
  patientId,
  encounterId,
  selectionOnly = false,
  multiSelect = false,
  highlightToothIds = null,
  allowedToothIds = null,
  planReviewMode = false,
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
    dose: '',
    treatmentPlanId: null,
    treatmentSessionId: null
  });
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [captureNewSession, setCaptureNewSession] = useState(false);
  const sessionSnapshot = useRef<number | null>(null);
  const [planForm, setPlanForm] = useState<any>({ title: '', notes: '', practitionerId: null });

  const plansQuery = useGetTreatmentPlansByPatientQuery(patientId, { skip: !patientId || selectionOnly });
  const practitionersQuery = useGetAllPractitionersQuery(
    { page: 0, size: 1000 },
    { skip: selectionOnly }
  );
  const [createTreatmentPlan, createPlanMutation] = useCreateTreatmentPlanMutation();
  const eligiblePlans = (plansQuery.data ?? []).filter((plan: any) =>
    ['DRAFT', 'PROPOSED', 'ACCEPTED', 'IN_PROGRESS'].includes(plan.status)
  );
  const planSessionsQuery = useGetTreatmentPlanSessionsQuery(currentToothAction.treatmentPlanId, {
    skip: !currentToothAction.treatmentPlanId || selectionOnly
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

  const numberingSystem = chartObject?.numberingSystem || 'UNIVERSAL';

  useEffect(() => {
    if (!chartObject?.teeth?.length) {
      setUpperTeeth([]);
      setLowerTeeth([]);
      return;
    }
    // Scheme-aware arches: permanent 1–16 / primary A–J upper; permanent 17–32 /
    // primary K–T lower. Safe for MIXED inventories (never length/2).
    const { upper, lower } = splitChartTeethByArch(chartObject.teeth);
    setUpperTeeth(upper);
    setLowerTeeth(lower);
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
    if (
      action?.type === 'TREATMENT' &&
      !currentToothAction.existing &&
      selectedCdt &&
      !currentToothAction.treatmentPlanId
    ) {
      missingFields.push('Treatment Plan');
    }
    if (handleErrorMessage(missingFields)) return;

    const creatingSession =
      action?.type === 'TREATMENT' &&
      !currentToothAction.existing &&
      !currentToothAction.treatmentSessionId;
    if (creatingSession) {
      const currentMax = (planSessionsQuery.data ?? []).reduce(
        (max, session) => Math.max(max, session.id),
        0
      );
      sessionSnapshot.current = currentMax;
    }
    setCaptureNewSession(creatingSession);
    addToothAction({
      id: currentToothAction.id,
      toothId: selectedTooth.id,
      dentalActionId: currentToothAction.dentalActionId,
      surface: currentToothAction.surface,
      note: currentToothAction.note,
      existing: currentToothAction.existing,
      cdtCodeId: selectedCdt,
      anesthesiaUsed: currentToothAction.anesthesiaUsed,
      dose: currentToothAction.dose,
      treatmentPlanId: currentToothAction.existing ? null : currentToothAction.treatmentPlanId,
      treatmentSessionId: currentToothAction.existing ? null : currentToothAction.treatmentSessionId
    });
  };

  const saveChartPlan = async () => {
    const title = planForm.title?.trim?.() || '';
    if (!title || !patientId || !encounterId) {
      dispatch(notify({ msg: 'Title is required', sev: 'error' }));
      return;
    }
    try {
      const saved = await createTreatmentPlan({
        patientId,
        originEncounterId: encounterId,
        title,
        notes: planForm.notes?.trim?.() || null,
        practitionerId: planForm.practitionerId || null
      }).unwrap();
      setCurrentToothAction(prev => ({
        ...prev,
        treatmentPlanId: saved.id,
        treatmentSessionId: null
      }));
      setPlanModalOpen(false);
      dispatch(notify({ msg: 'Treatment plan created', sev: 'success' }));
    } catch (error: any) {
      dispatch(notify({
        msg: extractApiErrorMessage(error) || 'Could not create the treatment plan',
        sev: 'error'
      }));
    }
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
        dose: '',
        treatmentPlanId: currentToothAction.treatmentPlanId,
        treatmentSessionId: currentToothAction.treatmentSessionId
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
      dispatch(dentalTreatmentPlanService.util.invalidateTags(['DentalTreatmentPlan']));
      dispatch(hideLoading());
    } else if (addToothActionMutation.status === 'rejected') {
      dispatch(hideLoading());
      dispatch(notify({ msg: extractApiErrorMessage(addToothActionMutation.error) || 'Add action error', sev: 'error' }));
    } else if (addToothActionMutation.status === 'pending') {
      dispatch(showLoading());
    }
  }, [addToothActionMutation]);

  useEffect(() => {
    if (!captureNewSession || !planSessionsQuery.data?.length) return;
    const newest = [...planSessionsQuery.data].sort(
      (a, b) => b.sessionNumber - a.sessionNumber
    )[0];
    if (!newest || newest.id === sessionSnapshot.current) return;
    setCurrentToothAction(prev => ({
      ...prev,
      treatmentSessionId: newest.id
    }));
    setCaptureNewSession(false);
  }, [captureNewSession, planSessionsQuery.data]);

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

  const midGapAfter = Math.floor(upperTeeth.length / 2);

  const toothIdAllowed = (tooth: any) => {
    if (!allowedToothIds || allowedToothIds.length === 0) return true;
    if (tooth?.id == null) return false;
    return allowedToothIds.some((id: any) => String(id) === String(tooth.id));
  };

  const isToothHighlighted = (tooth: any) => {
    if (!highlightToothIds || highlightToothIds.length === 0) return false;
    if (tooth?.id == null) return false;
    return highlightToothIds.some((id: any) => String(id) === String(tooth.id));
  };

  const isToothSelected = (tooth: any) => {
    if (multiSelect) {
      return (selectedTeeth ?? []).some(
        (item: any) =>
          (item?.id != null && tooth?.id != null && String(item.id) === String(tooth.id)) ||
          (item?.toothNumber != null &&
            tooth?.toothNumber != null &&
            item.toothNumber === tooth.toothNumber)
      );
    }

    return (
      (selectedTooth?.id != null &&
        tooth?.id != null &&
        String(selectedTooth.id) === String(tooth.id)) ||
      tooth?.toothNumber === selectedTooth?.toothNumber
    );
  };

  const toothMeta = (tooth: any) => {
    const selected = isToothSelected(tooth);
    const highlighted = isToothHighlighted(tooth);
    const hasCondition = (tooth.actions ?? []).some(
      (action: any) => dentalActionsMap?.[action.dentalActionId]?.type === 'CONDITION'
    );
    const hasTreatment = (tooth.actions ?? []).some(
      (action: any) => dentalActionsMap?.[action.dentalActionId]?.type === 'TREATMENT'
    );
    return {
      selected,
      highlighted,
      hasCondition,
      hasTreatment,
      surfaceStates: getSurfaceStates(tooth, dentalActionsMap)
    };
  };

  const selectTooth = (tooth: any) => {
    if (!toothIdAllowed(tooth)) return;

    if (multiSelect) {
      const current = selectedTeeth ?? [];
      const alreadySelected = current.some(
        (item: any) =>
          item?.id != null && tooth?.id != null && String(item.id) === String(tooth.id)
      );

      const next = alreadySelected
        ? current.filter(
            (item: any) =>
              !(item?.id != null && tooth?.id != null && String(item.id) === String(tooth.id))
          )
        : [...current, tooth];

      setSelectedTeeth?.(next);
      setSelectedTooth?.(alreadySelected ? next[next.length - 1] ?? null : tooth);
      return;
    }

    setSelectedTooth(tooth);
  };

  const openToothDetails = () => {
    if (!selectionOnly) setActionModalOpen(true);
  };

  const renderToothColumns = (teeth: any[], arch: 'upper' | 'lower') =>
    teeth.map((tooth: any, idx: number) => {
      const { selected, highlighted, hasCondition, hasTreatment, surfaceStates } =
        toothMeta(tooth);
      const primary = isPrimaryTooth(tooth.toothNumber);
      const allowed = toothIdAllowed(tooth);
      const toothDisabled = props.disabled || !allowed;
      const dimmed =
        Array.isArray(allowedToothIds) &&
        allowedToothIds.length > 0 &&
        !allowed;
      const showNestedSelection = selected && !planReviewMode;
      const colClass = clsx('tooth-col', {
        selected,
        'has-plan-treatment': highlighted && !planReviewMode,
        dimmed,
        'midline-gap': idx === midGapAfter
      });

      return (
        <div key={tooth.id} className={colClass}>
          {arch === 'upper' && (
            <div className="tooth-number">
              {toothDisplayLabel(tooth.toothNumber, numberingSystem)}
            </div>
          )}

          {arch === 'upper' ? (
            <>
              <Button
                disabled={toothDisabled}
                onClick={() => selectTooth(tooth)}
                onDoubleClick={openToothDetails}
                appearance={showNestedSelection ? 'primary' : 'default'}
                className={clsx('tooth-btn outer-btn', `tooth_${toothCssClassSuffix(tooth.toothNumber)}`)}
              >
                <Tooth
                  chartTooth={tooth}
                  selected={showNestedSelection}
                  hasCondition={hasCondition}
                  hasTreatment={hasTreatment}
                  flipVertical={primary}
                />
              </Button>
              <Button
                disabled={toothDisabled}
                onClick={() => selectTooth(tooth)}
                onDoubleClick={openToothDetails}
                appearance={showNestedSelection ? 'primary' : 'default'}
                className={clsx('tooth-btn occlusal-btn', {
                  selected: showNestedSelection
                })}
              >
                {primary ? (
                  <OcclusalBadge shapeType={getToothShapeType(tooth.toothNumber)} surfaceStates={surfaceStates} />
                ) : (
                  <AdultOcclusal
                    toothNumber={tooth.toothNumber}
                    surfaceStates={surfaceStates}
                    selected={showNestedSelection}
                  />
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                disabled={toothDisabled}
                onClick={() => selectTooth(tooth)}
                onDoubleClick={openToothDetails}
                appearance={showNestedSelection ? 'primary' : 'default'}
                className={clsx('tooth-btn occlusal-btn', {
                  selected: showNestedSelection
                })}
              >
                {primary ? (
                  <OcclusalBadge shapeType={getToothShapeType(tooth.toothNumber)} surfaceStates={surfaceStates} />
                ) : (
                  <AdultOcclusal
                    toothNumber={tooth.toothNumber}
                    surfaceStates={surfaceStates}
                    selected={showNestedSelection}
                  />
                )}
              </Button>
              <Button
                disabled={toothDisabled}
                onClick={() => selectTooth(tooth)}
                onDoubleClick={openToothDetails}
                appearance={showNestedSelection ? 'primary' : 'default'}
                className={clsx('tooth-btn outer-btn', `tooth_${toothCssClassSuffix(tooth.toothNumber)}`)}
              >
                <Tooth
                  chartTooth={tooth}
                  selected={showNestedSelection}
                  hasCondition={hasCondition}
                  hasTreatment={hasTreatment}
                />
              </Button>
            </>
          )}

          {arch === 'lower' && (
            <div className="tooth-number">
              {toothDisplayLabel(tooth.toothNumber, numberingSystem)}
            </div>
          )}
        </div>
      );
    });

  const hasPrimary = upperTeeth.some((t: any) => isPrimaryTooth(t.toothNumber))
    || lowerTeeth.some((t: any) => isPrimaryTooth(t.toothNumber));
  const hasPermanent = upperTeeth.some((t: any) => !isPrimaryTooth(t.toothNumber))
    || lowerTeeth.some((t: any) => !isPrimaryTooth(t.toothNumber));
  const pediatricLayout = hasPrimary && !hasPermanent;

  return (
    <>
      <Box
        className={clsx('dental-chart-container', {
          'dental-chart--plan-review': planReviewMode
        })}
        dir="ltr"
      >
        <div className="chart-side-label chart-side-r" aria-hidden>
          R
        </div>
        <div className={clsx('dental-chart-grid', { pediatric: pediatricLayout })}>
          <div className="chart-arch upper">{renderToothColumns(upperTeeth, 'upper')}</div>
          <div className="chart-midline" aria-hidden />
          <div className="chart-arch lower">{renderToothColumns(lowerTeeth, 'lower')}</div>
        </div>
        <div className="chart-side-label chart-side-l" aria-hidden>
          L
        </div>
      </Box>

      {!selectionOnly && (
        <MyModal
          open={actionModalOpen}
          size="70vw"
          position="right"
          setOpen={() => {
            setActionModalOpen(false);
            clearCurrentAction();
            clearCurrentService();
          }}
          title={`Tooth Details - #${toothDisplayLabel(selectedTooth?.toothNumber || '', numberingSystem)}`}
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
                  eligiblePlans={eligiblePlans}
                  planSessions={planSessionsQuery.data ?? []}
                  onCreatePlan={() => {
                    setPlanForm({ title: '', notes: '', practitionerId: null });
                    setPlanModalOpen(true);
                  }}
                  dentalActionsList={dentalActionsList}
                  dentalActionsMap={dentalActionsMap}
                  removeToothAction={removeToothAction}
                  clearCurrentAction={clearCurrentAction}
                  numberingSystem={numberingSystem}
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
      )}
      <TreatmentPlanHeaderModal
        open={planModalOpen}
        setOpen={setPlanModalOpen}
        form={planForm}
        setForm={setPlanForm}
        practitioners={toPractitionerOptions(practitionersQuery.data?.data ?? [])}
        saving={createPlanMutation.isLoading}
        onSave={saveChartPlan}
      />
    </>
  );
};

export default DentalChart;
