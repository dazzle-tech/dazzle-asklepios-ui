import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import './styles.less';
import PatientMajorProblemTable from './PatientMajorProblem';
import PatientChronicMedicationTable from './PatientChronicMedication/PatientChronicMedication';
import ActiveAllergies from './ActiveAllergies/ActiveAllergies';
import MedicalWarnings from './MedicalWarnings/MedicalWarnings';
import RecentTestResults from './RecentTestResults/RecentTestResults';
import PreviuosVisitData from './PreviuosVisitData';
import { useLocation } from 'react-router-dom';
import PreObservation from './PreObservation/PreObservation';
import Procedures from './Procedures/Procedures';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ChooseDashboardScreen from './ChooseDashboardSections';
import { ActionContext } from './ActionContext';
import {
  useGetEncounterDashboardPreferenceQuery
} from '@/services/encounters/patientEncounterService';
import PatientPlan from './PatientPlan';
import PrimaryCareProviderTable from './PrimaryCareProviderTable/PrimaryCareProviderTable';
import PatientPreviousAssessments from './PatientPreviousAssessments';
import { useGetPatientAllergiesByPatientIdQuery } from '@/services/encounters/patientAllergiesService';
import { useGetPreviousClosedEncounterQuery } from '@/services/encounters/patientEncounterService';
import { useGetPatientDiagnosesByPatientIdQuery } from '@/services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';
import { useGetAllChronicRawQuery } from '@/services/patients/Prescription/patientPrescriptionMedicationService';
import { useGetVitalSignsBetweenDatesByPatientIdQuery } from '@/services/medicalsheetsEncounter/observations/vitalSignsService';
import { useGetPatientWarningsByPatientIdQuery } from '@/services/encounters/patientWarningsService';
import { useGetEncounterPlansByPatientQuery } from '@/services/medicalsheetsEncounter/clinicalVisit/encounterPlanService';
import { useFindProcduresByPatientQuery } from '@/services/patients/patientProcedureService';
import { useFilterDiagnosticOrdersQuery } from '@/services/diagnosic-order/diagnosticOrderService';
import { useFilterDiagnosticOrderTestResultsQuery } from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';
import { useGetPatientPreferredHealthProfessionalsQuery } from '@/services/patients/PatientPreferredHealthProfessional';
import { useGetLatestEncounterAssessmentQuery } from '@/services/medicalsheetsEncounter/clinicalVisit/encounterAssessmentService';
import { skipToken } from '@reduxjs/toolkit/query';
import { Loader } from 'rsuite';
import {
  DASHBOARD_WIDGET_KEYS,
  isDashboardWidgetKey,
  type DashboardWidgetKey
} from './dashboardWidgets';

type Availability = 'loading' | 'error' | 'empty' | 'present';

type QueryProbe = {
  skipped: boolean;
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
  currentData: unknown;
  hasData: boolean;
};

const probeAvailability = (probe: QueryProbe): Availability => {
  if (probe.skipped) return 'empty';
  // currentData is only set for the arguments currently in the hook.
  // A fulfilled empty body (204) is null, which is a result, not a load.
  if (probe.currentData !== undefined) return probe.hasData ? 'present' : 'empty';
  if (probe.isSuccess && !probe.isFetching && !probe.isError) {
    return probe.hasData ? 'present' : 'empty';
  }
  if (probe.isError && !probe.isFetching) return 'error';
  return 'loading';
};

const rowsOf = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const record = value as { data?: unknown; content?: unknown };
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.content)) return record.content;
  }
  return [];
};

const DEFAULT_WIDGET_ORDER: DashboardWidgetKey[] = [...DASHBOARD_WIDGET_KEYS];

const dashboardColumnCount = () => {
  if (typeof window === 'undefined') return 3;
  if (window.innerWidth <= 768) return 1;
  if (window.innerWidth <= 1200) return 2;
  return 3;
};

const chunkWidgets = (widgets: DashboardWidgetKey[], columnCount: number) => {
  const rows: DashboardWidgetKey[][] = [];
  const size = Math.max(1, columnCount);
  for (let index = 0; index < widgets.length; index += size) {
    rows.push(widgets.slice(index, index + size));
  }
  return rows;
};

const orderAfterVisibleMove = (
  currentOrder: DashboardWidgetKey[],
  nextVisible: DashboardWidgetKey[]
) => {
  const visibleSet = new Set(nextVisible);
  const hidden = currentOrder.filter(id => !visibleSet.has(id));
  const missing = DASHBOARD_WIDGET_KEYS.filter(
    id => !nextVisible.includes(id) && !hidden.includes(id)
  );
  return [...nextVisible, ...hidden, ...missing];
};

const PatientSummary = ({
  patient: patientProp,
  encounter: encounterProp
}: { patient?: any; encounter?: any } = {}) => {
  const location = useLocation();
  const stateData = location.state || {};
  const patient = patientProp ?? stateData.patient;
  const encounter = encounterProp ?? stateData.encounter;
  const { setAction } = useContext(ActionContext);
  const [openChooseScreen, setOpenChooseScreen] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);
  const userId = user?.id as string | number | undefined;
  const encounterId = encounter?.id != null ? Number(encounter.id) : null;
  const patientId = patient?.id != null ? Number(patient.id) : null;

  const [widgetOrder, setWidgetOrder] = useState<DashboardWidgetKey[]>(DEFAULT_WIDGET_ORDER);
  const [columnCount, setColumnCount] = useState(dashboardColumnCount);
  const [layoutScope, setLayoutScope] = useState<string | null>(null);
  const scopeKey = `${userId ?? 'none'}:${encounterId ?? 'none'}:${patientId ?? 'none'}`;
  if (layoutScope !== scopeKey) {
    setLayoutScope(scopeKey);
    setWidgetOrder(DEFAULT_WIDGET_ORDER);
    setOpenChooseScreen(false);
  }

  useEffect(() => {
    const onResize = () => setColumnCount(dashboardColumnCount());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const preferenceArg =
    encounterId != null && userId != null && Number.isFinite(encounterId)
      ? { encounterId, userId }
      : skipToken;

  const {
    currentData: preference,
    isError: preferenceIsError,
    isFetching: preferenceIsFetching,
    isSuccess: preferenceIsSuccess,
    refetch: refetchPreferences
  } = useGetEncounterDashboardPreferenceQuery(preferenceArg);

  const preferenceMatches =
    preferenceIsSuccess &&
    preference != null &&
    Number(preference.encounterId) === encounterId;

  const preferenceStatus: 'loading' | 'error' | 'ready' | 'unscoped' =
    encounterId == null
      ? 'unscoped'
      : preferenceMatches
        ? 'ready'
        : preferenceIsError && !preferenceIsFetching
          ? 'error'
          : 'loading';

  const manualKeys = useMemo(() => {
    if (!preferenceMatches || !preference?.customized) return [];
    return (preference.widgetKeys ?? []).filter(isDashboardWidgetKey);
  }, [preferenceMatches, preference]);

  const mode: 'loading' | 'error' | 'auto' | 'manual' =
    preferenceStatus === 'loading'
      ? 'loading'
      : preferenceStatus === 'error'
        ? 'error'
        : preferenceStatus === 'ready' && preference?.customized
          ? 'manual'
          : 'auto';

  const getWidgetContent = useCallback(
    (id: string) => {
      switch (id) {
        case 'c2':
          return <PreviuosVisitData patient={patient} encounter={encounter} />;
        case 'c3':
          return <PatientMajorProblemTable patient={patient} encounter={encounter} loadingHeight="auto" />;
        case 'c4':
          return <PatientChronicMedicationTable patient={patient} loadingHeight="auto" />;
        case 'c5':
          return <PreObservation patient={patient} />;
        case 'c7':
          return <ActiveAllergies patient={patient} loadingHeight="auto" />;
        case 'c8':
          return <MedicalWarnings patient={patient} loadingHeight="auto" />;
        case 'c9':
          return <PatientPlan patient={patient} loadingHeight="auto" />;
        case 'c11':
          return <Procedures patient={patient} loadingHeight="auto" />;
        case 'c12':
          return <RecentTestResults patient={patient} loadingHeight="auto" />;
        case 'c13':
          return <PrimaryCareProviderTable patient={patient} encounter={encounter} loadingHeight="auto" />;
        case 'c14':
          return <PatientPreviousAssessments encounter={encounter} loadingHeight="auto" />;
        default:
          return null;
      }
    },
    [patient, encounter]
  );

  const previousVisitQuery = useGetPreviousClosedEncounterQuery(
    { encounterId: encounterId as number },
    { skip: encounterId == null }
  );
  const chronicDiseasesQuery = useGetPatientDiagnosesByPatientIdQuery(
    { patientId: patientId as number },
    { skip: patientId == null }
  );
  const chronicMedicationQuery = useGetAllChronicRawQuery(
    { patientId: patient?.id, page: 0, size: 5, sort: 'id,asc' },
    { skip: patient?.id == null }
  );
  const observationQuery = useGetVitalSignsBetweenDatesByPatientIdQuery(
    patientId ? { patientId } : (undefined as any),
    { skip: patientId == null }
  );
  const allergiesQuery = useGetPatientAllergiesByPatientIdQuery(
    { patientId: patient?.id },
    { skip: patient?.id == null }
  );
  const warningsQuery = useGetPatientWarningsByPatientIdQuery(
    { patientId: patient?.id, showCancelled: false },
    { skip: patient?.id == null }
  );
  const patientPlanQuery = useGetEncounterPlansByPatientQuery(
    { patientId: patient?.id, page: 0, size: 5, sort: 'createdDate,desc' },
    { skip: patient?.id == null }
  );
  const proceduresQuery = useFindProcduresByPatientQuery(
    {
      patientId: patient?.id || patient?.key,
      page: 0,
      size: 20,
      includeCancelled: false
    },
    { skip: patient?.id == null && patient?.key == null }
  );

  const ordersQueryParams = useMemo(() => {
    if (patient?.id == null) return skipToken;
    return {
      patientId: patient.id,
      page: 0,
      size: 1000,
      sort: ['id,desc']
    };
  }, [patient?.id]);

  const ordersQuery = useFilterDiagnosticOrdersQuery(ordersQueryParams);
  const orderIds = useMemo(
    () => rowsOf(ordersQuery.currentData).map((order: any) => order?.id).filter(Boolean),
    [ordersQuery.currentData]
  );

  const ordersAvailability = probeAvailability({
    skipped: patient?.id == null,
    isFetching: ordersQuery.isFetching,
    isError: ordersQuery.isError,
    isSuccess: ordersQuery.isSuccess,
    currentData: ordersQuery.currentData,
    hasData: orderIds.length > 0
  });

  const testResultsQueryParams = useMemo(() => {
    if (patient?.id == null) return skipToken;
    if (ordersAvailability !== 'present') return skipToken;
    return {
      orderIdIn: orderIds,
      page: 0,
      size: 10,
      processingStatus: 'RESULT_APPROVED',
      sort: 'reviewDate,desc',
      reviewed: true
    };
  }, [patient?.id, orderIds, ordersAvailability]);

  const testResultsQuery = useFilterDiagnosticOrderTestResultsQuery(testResultsQueryParams);
  const preferredQuery = useGetPatientPreferredHealthProfessionalsQuery(
    { page: 0, size: 10, sort: 'id,asc', patientId: patient?.id },
    { skip: patient?.id == null }
  );
  const assessmentQuery = useGetLatestEncounterAssessmentQuery(
    { encounterId },
    { skip: encounterId == null }
  );

  const recentTestAvailability: Availability =
    ordersAvailability === 'present'
      ? probeAvailability({
          skipped: false,
          isFetching: testResultsQuery.isFetching,
          isError: testResultsQuery.isError,
          isSuccess: testResultsQuery.isSuccess,
          currentData: testResultsQuery.currentData,
          hasData: rowsOf(testResultsQuery.currentData).length > 0
        })
      : ordersAvailability;

  const availability: Record<DashboardWidgetKey, Availability> = useMemo(
    () => ({
    c2: probeAvailability({
      skipped: encounterId == null,
      isFetching: previousVisitQuery.isFetching,
      isError: previousVisitQuery.isError,
      isSuccess: previousVisitQuery.isSuccess,
      currentData: previousVisitQuery.currentData,
      hasData: previousVisitQuery.currentData != null
    }),
    c3: probeAvailability({
      skipped: patientId == null,
      isFetching: chronicDiseasesQuery.isFetching,
      isError: chronicDiseasesQuery.isError,
      isSuccess: chronicDiseasesQuery.isSuccess,
      currentData: chronicDiseasesQuery.currentData,
      hasData: rowsOf(chronicDiseasesQuery.currentData).some((item: any) => item?.major === true)
    }),
    c4: probeAvailability({
      skipped: patient?.id == null,
      isFetching: chronicMedicationQuery.isFetching,
      isError: chronicMedicationQuery.isError,
      isSuccess: chronicMedicationQuery.isSuccess,
      currentData: chronicMedicationQuery.currentData,
      hasData: rowsOf(chronicMedicationQuery.currentData).length > 0
    }),
    c5: probeAvailability({
      skipped: patientId == null,
      isFetching: observationQuery.isFetching,
      isError: observationQuery.isError,
      isSuccess: observationQuery.isSuccess,
      currentData: observationQuery.currentData,
      hasData: rowsOf(observationQuery.currentData).length > 0
    }),
    c7: probeAvailability({
      skipped: patient?.id == null,
      isFetching: allergiesQuery.isFetching,
      isError: allergiesQuery.isError,
      isSuccess: allergiesQuery.isSuccess,
      currentData: allergiesQuery.currentData,
      hasData: rowsOf(allergiesQuery.currentData).some((allergy: any) => allergy?.status === 'ACTIVE')
    }),
    c8: probeAvailability({
      skipped: patient?.id == null,
      isFetching: warningsQuery.isFetching,
      isError: warningsQuery.isError,
      isSuccess: warningsQuery.isSuccess,
      currentData: warningsQuery.currentData,
      hasData: rowsOf(warningsQuery.currentData).some((warning: any) => warning?.status === 'ACTIVE')
    }),
    c9: probeAvailability({
      skipped: patient?.id == null,
      isFetching: patientPlanQuery.isFetching,
      isError: patientPlanQuery.isError,
      isSuccess: patientPlanQuery.isSuccess,
      currentData: patientPlanQuery.currentData,
      hasData: rowsOf(patientPlanQuery.currentData).length > 0
    }),
    c11: probeAvailability({
      skipped: patient?.id == null && patient?.key == null,
      isFetching: proceduresQuery.isFetching,
      isError: proceduresQuery.isError,
      isSuccess: proceduresQuery.isSuccess,
      currentData: proceduresQuery.currentData,
      hasData: rowsOf(proceduresQuery.currentData).length > 0
    }),
    c12: recentTestAvailability,
    c13: probeAvailability({
      skipped: patient?.id == null,
      isFetching: preferredQuery.isFetching,
      isError: preferredQuery.isError,
      isSuccess: preferredQuery.isSuccess,
      currentData: preferredQuery.currentData,
      hasData: rowsOf(preferredQuery.currentData).length > 0
    }),
    c14: probeAvailability({
      skipped: encounterId == null,
      isFetching: assessmentQuery.isFetching,
      isError: assessmentQuery.isError,
      isSuccess: assessmentQuery.isSuccess,
      currentData: assessmentQuery.currentData,
      hasData: assessmentQuery.currentData != null
    })
  }),
    [
      encounterId,
      patientId,
      patient?.id,
      patient?.key,
      previousVisitQuery.isFetching,
      previousVisitQuery.isError,
      previousVisitQuery.isSuccess,
      previousVisitQuery.currentData,
      chronicDiseasesQuery.isFetching,
      chronicDiseasesQuery.isError,
      chronicDiseasesQuery.isSuccess,
      chronicDiseasesQuery.currentData,
      chronicMedicationQuery.isFetching,
      chronicMedicationQuery.isError,
      chronicMedicationQuery.isSuccess,
      chronicMedicationQuery.currentData,
      observationQuery.isFetching,
      observationQuery.isError,
      observationQuery.isSuccess,
      observationQuery.currentData,
      allergiesQuery.isFetching,
      allergiesQuery.isError,
      allergiesQuery.isSuccess,
      allergiesQuery.currentData,
      warningsQuery.isFetching,
      warningsQuery.isError,
      warningsQuery.isSuccess,
      warningsQuery.currentData,
      patientPlanQuery.isFetching,
      patientPlanQuery.isError,
      patientPlanQuery.isSuccess,
      patientPlanQuery.currentData,
      proceduresQuery.isFetching,
      proceduresQuery.isError,
      proceduresQuery.isSuccess,
      proceduresQuery.currentData,
      preferredQuery.isFetching,
      preferredQuery.isError,
      preferredQuery.isSuccess,
      preferredQuery.currentData,
      assessmentQuery.isFetching,
      assessmentQuery.isError,
      assessmentQuery.isSuccess,
      assessmentQuery.currentData,
      recentTestAvailability
    ]
  );

  const autoReady = DASHBOARD_WIDGET_KEYS.every(key => availability[key] !== 'loading');
  const autoHasError = DASHBOARD_WIDGET_KEYS.some(key => availability[key] === 'error');

  const isWidgetVisible = useCallback(
    (id: DashboardWidgetKey) => {
      if (mode === 'loading' || mode === 'error') return false;
      if (mode === 'manual') return manualKeys.includes(id);
      return availability[id] === 'present';
    },
    [mode, manualKeys, availability]
  );

  const selectionReady = mode === 'manual' || (mode === 'auto' && autoReady);
  const modalInitialKeys = useMemo(() => {
    if (mode === 'manual') return manualKeys;
    if (mode === 'auto' && autoReady) {
      return DASHBOARD_WIDGET_KEYS.filter(key => availability[key] === 'present');
    }
    return [];
  }, [mode, manualKeys, autoReady, availability]);

  const openCustomize = useCallback(() => {
    setOpenChooseScreen(true);
  }, []);

  useEffect(() => {
    setAction(() => openCustomize);
    return () => setAction(() => () => undefined);
  }, [setAction, openCustomize]);

  const visibleOrder = useMemo(() => {
    const kept = widgetOrder.filter(id => isWidgetVisible(id));
    const added = DASHBOARD_WIDGET_KEYS.filter(id => isWidgetVisible(id) && !kept.includes(id));
    return [...kept, ...added];
  }, [widgetOrder, isWidgetVisible]);

  const widgetRows = useMemo(
    () => chunkWidgets(visibleOrder, columnCount),
    [visibleOrder, columnCount]
  );

  const handleDragEnd = (result: {
    source?: { droppableId: string; index: number };
    destination?: { droppableId: string; index: number } | null;
  }) => {
    const { source, destination } = result;
    if (!source || !destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceRowIndex = Number(source.droppableId.replace('row-', ''));
    const destinationRowIndex = Number(destination.droppableId.replace('row-', ''));
    if (!Number.isInteger(sourceRowIndex) || !Number.isInteger(destinationRowIndex)) return;

    const nextRows = widgetRows.map(row => [...row]);
    const sourceRow = nextRows[sourceRowIndex];
    const destinationRow = nextRows[destinationRowIndex];
    if (!sourceRow || !destinationRow) return;
    if (source.index < 0 || source.index >= sourceRow.length) return;

    const [moved] = sourceRow.splice(source.index, 1);
    if (!moved) return;
    const insertAt = Math.max(0, Math.min(destination.index, destinationRow.length));
    destinationRow.splice(insertAt, 0, moved);

    const nextVisible = nextRows.flat();
    if (new Set(nextVisible).size !== nextVisible.length) return;
    setWidgetOrder(current => orderAfterVisibleMove(current, nextVisible));
  };

  const showBoard = mode === 'manual' || (mode === 'auto' && autoReady);

  return (
    <>
      {mode === 'loading' || (mode === 'auto' && !autoReady) ? (
        <div className="patient-summary-status">
          <Loader />
          <span>Loading dashboard...</span>
        </div>
      ) : null}
      {mode === 'error' ? (
        <div className="patient-summary-status">
          <span>Dashboard preferences could not be loaded.</span>
          <button
            type="button"
            className="dashboard-preference-retry"
            onClick={() => {
              refetchPreferences();
            }}
          >
            Retry
          </button>
        </div>
      ) : null}
      {showBoard && mode === 'auto' && autoHasError ? (
        <div className="dashboard-preference-feedback">
          Some sections could not be loaded and were left hidden.
        </div>
      ) : null}
      {showBoard ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div
            className="patient-summary-container"
            style={{ ['--dashboard-columns' as string]: String(columnCount) }}
          >
            {widgetRows.map((row, rowIndex) => (
              <Droppable
                droppableId={`row-${rowIndex}`}
                direction="horizontal"
                key={`row-${rowIndex}`}
              >
                {provided => (
                  <div
                    className="patient-summary-row"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {row.map((id, index) => (
                      <Draggable draggableId={id} index={index} key={id}>
                        {dragProvided => (
                          <div
                            className="patient-summary-widget"
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                          >
                            {getWidgetContent(id)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      ) : null}
      <ChooseDashboardScreen
        open={openChooseScreen}
        setOpen={setOpenChooseScreen}
        initialSelectedKeys={modalInitialKeys}
        selectionReady={selectionReady}
        encounterId={encounterId}
        userId={userId}
        loadError={
          mode === 'error' ? 'Dashboard preferences could not be loaded.' : null
        }
        onRetry={() => {
          refetchPreferences();
        }}
      />
    </>
  );
};

export default PatientSummary;
