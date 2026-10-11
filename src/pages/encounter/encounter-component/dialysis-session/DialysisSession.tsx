import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { Form, Message, Modal } from 'rsuite';
import { skipToken } from '@reduxjs/toolkit/query';

import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import MyDateHijriInput from '@/components/MyDateHijriInput/MyDateHijriInput';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { useGetUsersBasicQuery } from '@/services/userService';
import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import {
    useCreateDialysisSessionMutation,
    useGetDialysisSessionByIdQuery,
    useGetDialysisSessionQuery,
    useLazyGetDialysisSessionsByTreatmentPlanQuery,
    useUpdateDialysisSessionMutation
} from '@/services/dialysis/dialysisSessionService';
import DialysisPatientRegistration from './DialysisPatientRegistration';
import { mapTreatmentPlanToSessionFields } from './treatmentPlanSessionMapping';
import {
    useCreateDialysisFlowReadingMutation,
    useDeleteDialysisFlowReadingMutation,
    useGetDialysisFlowReadingsByDialysisSessionIdQuery
} from '@/services/dialysis/dialysisFlowReadingService';
import {
    useCreateDialysisMedicationMutation,
    useDeleteDialysisMedicationMutation,
    useGetDialysisMedicationsByDialysisSessionIdQuery
} from '@/services/dialysis/dialysisMedicationService';
import { useLazyGetDiagnosticOrderTestByIdQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import {
    useFilterDiagnosticOrderTestResultsQuery,
    useLazyFilterDiagnosticOrderTestResultsQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';
import {
    useGetActiveLabProfilesByTestIdsMutation,
    useGetDiagnosticTestProfilesByIdsMutation
} from '@/services/setup/diagnosticTest/diagnosticTestProfileService';

import {
    DiagnosticOrderTestStatus,
    type DiagnosticOrderTestResultResponseVM,
    type DialysisFlowReading,
    type DialysisMedication,
    type DialysisSession as DialysisSessionModel,
    type NephrologyTreatmentPlan,
    type Patient,
    type PatientEncounter
} from '@/types/model-types-new';

import './styles.less';

/** Diagnostic Test IDs (not result IDs / order-test IDs). */
const ELECTROLYTE_DIAGNOSTIC_TEST_IDS = {
    sodium: 161,
    potassium: 162,
    calcium: 1
} as const;

type ElectrolyteField = keyof typeof ELECTROLYTE_DIAGNOSTIC_TEST_IDS;

type BloodElectrolyteLabRef = {
    resultId: number;
    value: number;
    marker: string | null;
    isCritical: boolean;
    unitDisplay: string;
    approvedDate: string | null;
    reviewDate: string | null;
    createdDate: string | null;
};

const ELECTROLYTE_FIELDS = Object.keys(
    ELECTROLYTE_DIAGNOSTIC_TEST_IDS
) as ElectrolyteField[];

const LAB_RESULTS_PAGE_SIZE = 200;

const isCriticalMarker = (marker?: string | null) =>
    marker === 'CRITICAL_UPPER' || marker === 'CRITICAL_LOWER';

const normalizeUnitToken = (unit: string) =>
    unit.toLowerCase().replace(/\s+/g, '');

const resolveElectrolyteUnitDisplay = (
    profile: { resultUnit?: string | number | null } | null | undefined,
    valueUnitLov:
        | { object?: Array<{ key?: string | number; lovDisplayVale?: string }> }
        | undefined
): string | null => {
    if (profile?.resultUnit == null || profile.resultUnit === '') {
        return null;
    }

    const fromLov = valueUnitLov?.object?.find(
        unit => String(unit.key) === String(profile.resultUnit)
    )?.lovDisplayVale;

    const display = String(fromLov || profile.resultUnit || '').trim();

    if (!display) {
        return null;
    }

    // Unresolved LOV keys are numeric/opaque and must not pass unit validation.
    if (/^\d+$/.test(display)) {
        return null;
    }

    return display;
};

const isCompatibleElectrolyteUnit = (
    unitDisplay: string | null | undefined,
    field: ElectrolyteField
) => {
    if (!unitDisplay?.trim()) {
        return false;
    }

    const token = normalizeUnitToken(unitDisplay).replace(/\./g, '');

    if (
        token === 'mmol/l' ||
        token === 'mmol' ||
        (token.includes('mmol') && token.includes('l'))
    ) {
        return true;
    }

    // Monovalent electrolytes: mEq/L is clinically equivalent to mmol/L.
    if (
        (field === 'sodium' || field === 'potassium') &&
        (token === 'meq/l' ||
            token === 'meq' ||
            (token.includes('meq') && token.includes('l')))
    ) {
        return true;
    }

    return false;
};

const toTimestampMs = (value?: string | Date | null) => {
    if (value == null || value === '') {
        return null;
    }

    const ms = new Date(value).getTime();

    return Number.isFinite(ms) ? ms : null;
};

/**
 * Latest-approved ordering:
 * 1) approvedDate (primary)
 * 2) reviewDate
 * 3) createdDate
 * 4) result id (deterministic tie-breaker)
 * Never rely on API array order.
 */
const compareApprovedLabResultsNewestFirst = (
    a: Pick<
        DiagnosticOrderTestResultResponseVM,
        'id' | 'approvedDate' | 'reviewDate' | 'createdDate'
    >,
    b: Pick<
        DiagnosticOrderTestResultResponseVM,
        'id' | 'approvedDate' | 'reviewDate' | 'createdDate'
    >
) => {
    const aApproved = toTimestampMs(a.approvedDate);
    const bApproved = toTimestampMs(b.approvedDate);

    if (aApproved != null || bApproved != null) {
        if (aApproved == null) return 1;
        if (bApproved == null) return -1;
        if (aApproved !== bApproved) return bApproved - aApproved;
    }

    const aReview = toTimestampMs(a.reviewDate);
    const bReview = toTimestampMs(b.reviewDate);

    if (aReview != null || bReview != null) {
        if (aReview == null) return 1;
        if (bReview == null) return -1;
        if (aReview !== bReview) return bReview - aReview;
    }

    const aCreated = toTimestampMs(a.createdDate);
    const bCreated = toTimestampMs(b.createdDate);

    if (aCreated != null || bCreated != null) {
        if (aCreated == null) return 1;
        if (bCreated == null) return -1;
        if (aCreated !== bCreated) return bCreated - aCreated;
    }

    return Number(b.id) - Number(a.id);
};

const getResultEligibilityTimestamp = (
    result: DiagnosticOrderTestResultResponseVM
) => result.approvedDate ?? result.reviewDate ?? result.createdDate ?? null;

type EncounterContext = {
    patient?: Patient;
    encounter?: PatientEncounter;
    edit?: boolean;
    readOnly?: boolean;
    viewMode?: string;
};

type DialysisSessionProps = EncounterContext & {
    /** When set (e.g. Patient EMR), load this saved session instead of encounter latest. */
    preferredSessionId?: number | null;
    /** When set (e.g. Patient EMR), keep the session bound to this Treatment Plan. */
    preferredTreatmentPlanId?: number | null;
};

const booleanYesNoOptions = [
    { label: 'Yes', value: true },
    { label: 'No', value: false }
];

const dialysisComplicationLabelOverrides = {
    NAUSEA_VOMITING: 'Nausea / Vomiting'
};

const initialSessionForm = {
    chairStation: '',
    machine: '',
    date: null as string | null,
    startTime: null as string | null,
    endTime: null as string | null,
    shift: '',
    assignedNurseId: null as number | null,
    nephrologistId: null as number | null,

    preWeight: null as number | null,
    dryWeight: null as number | null,
    weightGain: null as number | null,
    preBloodPressure: '',
    prePulse: '',
    preTemperature: '',
    bloodPressureSystolic: null as number | null,
    bloodPressureDiastolic: null as number | null,
    heartRate: null as number | null,
    temperature: null as number | null,
    respiratoryRate: null as number | null,
    oxygenSaturation: null as number | null,
    spo2: '',
    symptoms: '',
    edema: null as string | null,
    preAccessCondition: '',
    generalCondition: '',
    interdialyticWeightGain: null as number | null,

    dialysisDuration: null as number | null,
    durationType: '' as string,
    bloodFlowRate: null as number | null,
    dialysateFlowRate: null as number | null,
    dialysateComposition: null as string | null,
    ultrafiltrationGoal: null as number | null,
    heparinDose: null as number | null,
    anticoagulation: '' as string,
    otherAnticoagulation: null as string | null,
    sodium: null as number | null,
    potassium: null as number | null,
    calcium: null as number | null,
    dialysisTemperature: null as number | null,
    targetDryWeight: null as number | null,

    accessType: null as string | null,
    accessSite: null as string | null,
    otherAccessSite: null as string | null,
    infection: null as boolean | null,
    bleeding: null as boolean | null,
    thrill: null as string | null,
    bruit: null as string | null,
    dressing: null as string | null,
    catheterCondition: null as string | null,

    activeIngredientId: null as number | null,
    dose: null as number | string | null,
    doseUnit: null as string | null,

    postWeight: null as number | null,
    postBloodPressureSystolic: null as number | null,
    postBloodPressureDiastolic: null as number | null,
    postPulse: null as number | null,
    postTemperature: null as number | null,
    totalUfRemoved: null as number | null,
    actualTreatmentDuration: null as number | null,
    postAccessCondition: null as string | null,
    disposition: null as string | null,
    postComplications: null as string | null,
    patientCondition: null as string | null,
    targetUf: null as number | null,
    actualUf: null as number | null,
    ufDifference: null as number | null,

    complications: [] as string[],
    complicationNotes: null as string | null
};

const initialFlowEntry = {
    time: '' as string,
    bloodPressureSystolic: null as number | string | null,
    bloodPressureDiastolic: null as number | string | null,
    pulse: null as number | string | null,
    ufRate: null as number | string | null,
    ufRemoved: null as number | string | null,
    arterialPressure: null as number | string | null,
    venousPressure: null as number | string | null,
    transmembranePressure: null as number | string | null
};

const DialysisSession = (props: DialysisSessionProps = {}) => {
    const location = useLocation();
    const outletContext = useOutletContext<EncounterContext>();

    const state = (location.state ?? {}) as EncounterContext;

    const patient =
        props.patient ?? state.patient ?? outletContext?.patient;

    const encounter =
        props.encounter ?? state.encounter ?? outletContext?.encounter;

    const viewMode =
        props.viewMode ?? state.viewMode ?? outletContext?.viewMode;

    const preferredSessionId =
        props.preferredSessionId != null
            ? Number(props.preferredSessionId)
            : null;

    const preferredTreatmentPlanId =
        props.preferredTreatmentPlanId != null
            ? Number(props.preferredTreatmentPlanId)
            : null;

    const disabled = Boolean(
        viewMode === 'readOnly' ||
        (props.readOnly ?? state.readOnly ?? outletContext?.readOnly) ||
        (props.edit ?? state.edit ?? outletContext?.edit) ||
        patient?.patientStatus === 'MERGED' ||
        encounter?.status === 'COMPLETED' ||
        encounter?.status === 'CANCELLED'
    );

    const dispatch = useAppDispatch();

    const patientId = Number(patient?.id);
    const encounterId = Number(encounter?.id);

    const shiftOptions = useEnumOptions('DialysisShift');
    const dialysisAnticoagulationOptions = useEnumOptions(
        'DialysisAnticoagulation'
    );
    const dialysisAccessTypeOptions = useEnumOptions('DialysisAccessType');
    const dialysisAccessSiteOptions = useEnumOptions('DialysisAccessSite');
    const dialysisDispositionOptions = useEnumOptions('DialysisDisposition');
    const durationTypeOptions = useEnumOptions('Unit');
    const complicationOptions = useEnumOptions('DialysisComplication', {
        labelOverrides: dialysisComplicationLabelOverrides
    });

    const [form, setForm] = useState(initialSessionForm);

    const [flowEntry, setFlowEntry] = useState(initialFlowEntry);

    const [knownSessionId, setKnownSessionId] = useState<number | null>(null);
    const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
    const [selectedTreatmentPlanId, setSelectedTreatmentPlanId] = useState<
        number | null
    >(null);
    const [pendingTreatmentPlan, setPendingTreatmentPlan] =
        useState<NephrologyTreatmentPlan | null>(null);
    const [ambiguousSessions, setAmbiguousSessions] = useState<
        DialysisSessionModel[]
    >([]);
    const [pendingAmbiguousPlan, setPendingAmbiguousPlan] =
        useState<NephrologyTreatmentPlan | null>(null);
    const [sessionHydration, setSessionHydration] = useState<{
        patientId: string | number;
        encounterId: string | number;
        sessionId: number | null;
        treatmentPlanId: number | null;
    } | null>(null);
    const [bootstrapComplete, setBootstrapComplete] = useState(false);
    const [planSwitchLoading, setPlanSwitchLoading] = useState(false);

    const planRequired = selectedTreatmentPlanId == null;
    const sessionFieldsDisabled = disabled || planRequired;

    const selectedTreatmentPlanIdRef = useRef<number | null>(null);
    selectedTreatmentPlanIdRef.current = selectedTreatmentPlanId;
    const activeSessionIdRef = useRef<number | null>(null);
    activeSessionIdRef.current = activeSessionId;
    const formBaselineRef = useRef<string>('');
    const bootstrapAppliedKey = useRef<string | null>(null);
    const draftHydrationPlanIdRef = useRef<number | null>(null);

    const {
        currentData: latestSessionResponse,
        isFetching: loadingLatestSession,
        isSuccess: latestSessionLoaded,
        isError: latestSessionFailed
    } = useGetDialysisSessionQuery(
        {
            patientId,
            encounterId
        },
        {
            skip:
                !patient?.id ||
                !encounter?.id ||
                (preferredSessionId != null && preferredSessionId > 0)
        }
    );

    const {
        currentData: activeSessionResponse,
        isFetching: loadingActiveSession,
        isSuccess: activeSessionLoaded,
        isError: activeSessionFailed
    } = useGetDialysisSessionByIdQuery(activeSessionId ?? 0, {
        skip: activeSessionId == null || activeSessionId <= 0
    });

    const [fetchSessionsByPlan] =
        useLazyGetDialysisSessionsByTreatmentPlanQuery();

    const dialysisSession =
        activeSessionId != null &&
            activeSessionResponse &&
            activeSessionResponse.id != null &&
            Number(activeSessionResponse.id) === Number(activeSessionId) &&
            String(activeSessionResponse.patientId) === String(patient?.id) &&
            String(activeSessionResponse.encounterId) === String(encounter?.id)
            ? activeSessionResponse
            : undefined;

    const loadingDialysisSession =
        activeSessionId != null
            ? loadingActiveSession
            : !bootstrapComplete && loadingLatestSession;

    const dialysisSessionLoaded =
        activeSessionId != null
            ? activeSessionLoaded
            : bootstrapComplete || latestSessionLoaded || latestSessionFailed;

    const dialysisSessionFailed =
        activeSessionId != null ? activeSessionFailed : latestSessionFailed;

    const sessionHydrationReady = Boolean(
        bootstrapComplete &&
        sessionHydration &&
        String(sessionHydration.patientId) === String(patient?.id) &&
        String(sessionHydration.encounterId) === String(encounter?.id) &&
        (activeSessionId != null
            ? sessionHydration.sessionId === Number(activeSessionId) &&
            dialysisSession != null &&
            !loadingActiveSession
            : sessionHydration.sessionId == null)
    );

    const [createDialysisSession, { isLoading: creatingDialysisSession }] =
        useCreateDialysisSessionMutation();

    const [updateDialysisSession, { isLoading: updatingDialysisSession }] =
        useUpdateDialysisSessionMutation();

    const savingDialysisSession =
        creatingDialysisSession || updatingDialysisSession;

    const resolvedActiveSessionId =
        activeSessionId != null
            ? activeSessionId
            : sessionHydrationReady
                ? knownSessionId
                : null;

    const {
        currentData: flowReadingsResponse,
        isFetching: loadingFlowReadings
    } = useGetDialysisFlowReadingsByDialysisSessionIdQuery(
        {
            dialysisSessionId: resolvedActiveSessionId ?? 0
        },
        {
            skip: !resolvedActiveSessionId
        }
    );

    const flowReadings = Array.isArray(flowReadingsResponse)
        ? flowReadingsResponse.filter(
            reading =>
                resolvedActiveSessionId != null &&
                Number(reading.dialysisSessionId) ===
                Number(resolvedActiveSessionId)
        )
        : [];

    const [createDialysisFlowReading, { isLoading: creatingFlowReading }] =
        useCreateDialysisFlowReadingMutation();

    const [deleteDialysisFlowReading, { isLoading: deletingFlowReading }] =
        useDeleteDialysisFlowReadingMutation();

    const {
        currentData: dialysisMedicationsResponse,
        isFetching: loadingDialysisMedications
    } = useGetDialysisMedicationsByDialysisSessionIdQuery(
        {
            dialysisSessionId: resolvedActiveSessionId ?? 0
        },
        {
            skip: !resolvedActiveSessionId
        }
    );

    const dialysisMedications = Array.isArray(dialysisMedicationsResponse)
        ? dialysisMedicationsResponse.filter(
            medication =>
                resolvedActiveSessionId != null &&
                Number(medication.dialysisSessionId) ===
                Number(resolvedActiveSessionId)
        )
        : [];

    const [createDialysisMedication, { isLoading: creatingDialysisMedication }] =
        useCreateDialysisMedicationMutation();

    const [deleteDialysisMedication, { isLoading: deletingDialysisMedication }] =
        useDeleteDialysisMedicationMutation();

    const { data: activeIngredientsRes } = useGetActiveIngredientsQuery({
        page: 0,
        size: 1000
    });

    const activeIngredientMap = useMemo(() => {
        const map: Record<number, { name?: string }> = {};

        (activeIngredientsRes?.data || []).forEach(item => {
            map[item.id] = item;
        });

        return map;
    }, [activeIngredientsRes]);

    const activeIngredients = activeIngredientsRes?.data ?? [];

    const { data: unitLov } = useGetLovValuesByCodeQuery('UOM');
    const { data: valueUnitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');

    const unitMap = useMemo(() => {
        const map: Record<string, string> = {};

        (unitLov?.object || []).forEach((item: { key?: string | number; lovDisplayVale?: string }) => {
            map[String(item.key)] = item.lovDisplayVale ?? '';
        });

        return map;
    }, [unitLov]);

    const sessionLabCutoffMs = useMemo(() => {
        const sessionDate = form.date ?? dialysisSession?.date ?? null;
        const sessionStart =
            form.startTime ?? dialysisSession?.startTime ?? null;

        if (sessionDate && sessionStart) {
            const datePart = String(sessionDate).slice(0, 10);
            const timePart = String(sessionStart).includes('T')
                ? String(sessionStart)
                : `${datePart}T${String(sessionStart)}`;
            const combinedMs =
                toTimestampMs(timePart) ??
                toTimestampMs(`${datePart}T${String(sessionStart)}`);

            if (combinedMs != null) {
                return combinedMs;
            }
        }

        const sessionDateMs = toTimestampMs(sessionDate);

        if (sessionDateMs != null) {
            return sessionDateMs;
        }

        const encounterCutoff = toTimestampMs(
            encounter?.startedDate ??
                encounter?.encounterDate ??
                encounter?.createdDate ??
                (encounter as { createdAt?: string | Date | null } | undefined)
                    ?.createdAt ??
                null
        );

        return encounterCutoff ?? Date.now();
    }, [
        form.date,
        form.startTime,
        dialysisSession?.date,
        dialysisSession?.startTime,
        encounter
    ]);

    const labResultsQueryArgs = useMemo(() => {
        if (!patientId) {
            return skipToken;
        }

        return {
            page: 0,
            size: LAB_RESULTS_PAGE_SIZE,
            // Sort is not used for selection; latest is chosen client-side.
            sort: 'id,desc',
            patientIdIn: [patientId],
            processingStatus: DiagnosticOrderTestStatus.RESULT_APPROVED
        };
    }, [patientId]);

    const {
        data: labResultsPage,
        isFetching: loadingLabResults,
        isSuccess: labResultsSuccess,
        isError: labResultsError
    } = useFilterDiagnosticOrderTestResultsQuery(labResultsQueryArgs);

    const [fetchLabResultsPage] =
        useLazyFilterDiagnosticOrderTestResultsQuery();
    const [allApprovedLabResults, setAllApprovedLabResults] = useState<
        DiagnosticOrderTestResultResponseVM[]
    >([]);
    const [labResultsFullyLoaded, setLabResultsFullyLoaded] = useState(false);

    useEffect(() => {
        if (labResultsQueryArgs === skipToken) {
            setAllApprovedLabResults([]);
            setLabResultsFullyLoaded(true);
            return;
        }

        if (loadingLabResults && !labResultsSuccess && !labResultsError) {
            setLabResultsFullyLoaded(false);
            return;
        }

        if (labResultsError) {
            setAllApprovedLabResults([]);
            setLabResultsFullyLoaded(true);
            return;
        }

        if (!labResultsSuccess || !labResultsPage) {
            setLabResultsFullyLoaded(false);
            return;
        }

        let cancelled = false;

        const loadAllPages = async () => {
            setLabResultsFullyLoaded(false);

            const totalCount = Number(labResultsPage.totalCount ?? 0);
            const merged = [...(labResultsPage.data ?? [])];
            const totalPages = Math.max(
                1,
                Math.ceil(totalCount / LAB_RESULTS_PAGE_SIZE)
            );

            for (let page = 1; page < totalPages; page += 1) {
                const nextPage = await fetchLabResultsPage({
                    ...labResultsQueryArgs,
                    page,
                    size: LAB_RESULTS_PAGE_SIZE
                }).unwrap();

                if (cancelled) {
                    return;
                }

                merged.push(...(nextPage.data ?? []));
            }

            if (cancelled) {
                return;
            }

            const approvedOnly = merged.filter(
                result =>
                    result.processingStatus ===
                        DiagnosticOrderTestStatus.RESULT_APPROVED &&
                    result.resultValueNumber != null &&
                    Number.isFinite(Number(result.resultValueNumber))
            );

            setAllApprovedLabResults(approvedOnly);
            setLabResultsFullyLoaded(true);
        };

        loadAllPages().catch(() => {
            if (!cancelled) {
                setAllApprovedLabResults([]);
                setLabResultsFullyLoaded(true);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [
        labResultsQueryArgs,
        loadingLabResults,
        labResultsSuccess,
        labResultsError,
        labResultsPage,
        fetchLabResultsPage
    ]);

    const approvedLabResults = allApprovedLabResults;

    const electrolyteOrderTestIds = useMemo(
        () =>
            Array.from(
                new Set(
                    approvedLabResults
                        .map(result => Number(result.orderTestId))
                        .filter(id => Number.isFinite(id) && id > 0)
                )
            ),
        [approvedLabResults]
    );

    const [fetchOrderTestById] = useLazyGetDiagnosticOrderTestByIdQuery();
    const [orderTestsMap, setOrderTestsMap] = useState<
        Record<
            string,
            { id?: number; testId?: number; diagnosticTestId?: number }
        >
    >({});

    useEffect(() => {
        electrolyteOrderTestIds.forEach(orderTestId => {
            const key = String(orderTestId);

            if (orderTestsMap[key]) {
                return;
            }

            fetchOrderTestById(orderTestId)
                .unwrap()
                .then(orderTest => {
                    if (orderTest?.id == null) {
                        return;
                    }

                    setOrderTestsMap(previous => ({
                        ...previous,
                        [String(orderTest.id)]: orderTest
                    }));
                })
                .catch(() => {
                    // Leave unresolved; selection skips missing joins.
                });
        });
    }, [electrolyteOrderTestIds, orderTestsMap, fetchOrderTestById]);

    const electrolyteOrderTestById = useMemo(() => {
        const map = new Map<
            number,
            { id?: number; testId?: number; diagnosticTestId?: number }
        >();

        Object.values(orderTestsMap).forEach(orderTest => {
            if (orderTest?.id != null) {
                map.set(Number(orderTest.id), orderTest);
            }
        });

        return map;
    }, [orderTestsMap]);

    const orderTestsResolved =
        electrolyteOrderTestIds.length === 0 ||
        electrolyteOrderTestIds.every(id => electrolyteOrderTestById.has(id));

    const electrolyteProfileIds = useMemo(
        () =>
            Array.from(
                new Set(
                    approvedLabResults
                        .map(result =>
                            result.profileTestId != null
                                ? Number(result.profileTestId)
                                : null
                        )
                        .filter(
                            (id): id is number =>
                                id != null && Number.isFinite(id) && id > 0
                        )
                )
            ),
        [approvedLabResults]
    );

    const [fetchElectrolyteProfilesByIds, { data: electrolyteProfilesResponse }] =
        useGetDiagnosticTestProfilesByIdsMutation();
    const [fetchActiveProfilesByTestIds] =
        useGetActiveLabProfilesByTestIdsMutation();
    const [activeProfilesByTestId, setActiveProfilesByTestId] = useState<
        Record<number, any[]>
    >({});
    const [activeProfilesLoaded, setActiveProfilesLoaded] = useState(false);

    useEffect(() => {
        if (electrolyteProfileIds.length > 0) {
            fetchElectrolyteProfilesByIds(electrolyteProfileIds);
        }
    }, [electrolyteProfileIds, fetchElectrolyteProfilesByIds]);

    useEffect(() => {
        if (labResultsQueryArgs === skipToken) {
            setActiveProfilesLoaded(true);
            setActiveProfilesByTestId({});
            return;
        }

        setActiveProfilesLoaded(false);

        const testIds = ELECTROLYTE_FIELDS.map(
            field => ELECTROLYTE_DIAGNOSTIC_TEST_IDS[field]
        );

        fetchActiveProfilesByTestIds(testIds)
            .unwrap()
            .then(response => {
                setActiveProfilesByTestId(response ?? {});
                setActiveProfilesLoaded(true);
            })
            .catch(() => {
                setActiveProfilesByTestId({});
                setActiveProfilesLoaded(true);
            });
    }, [labResultsQueryArgs, fetchActiveProfilesByTestIds]);

    const electrolyteProfilesById = useMemo(() => {
        const map = new Map<number, any>();

        (electrolyteProfilesResponse ?? []).forEach((profile: any) => {
            if (profile?.id != null) {
                map.set(Number(profile.id), profile);
            }
        });

        return map;
    }, [electrolyteProfilesResponse]);

    const bloodLabRefsReady = useMemo(() => {
        if (labResultsQueryArgs === skipToken) {
            return true;
        }

        if (!labResultsFullyLoaded || !orderTestsResolved) {
            return false;
        }

        if (
            electrolyteProfileIds.length > 0 &&
            electrolyteProfilesResponse == null
        ) {
            return false;
        }

        if (!activeProfilesLoaded || valueUnitLov == null) {
            return false;
        }

        return true;
    }, [
        labResultsQueryArgs,
        labResultsFullyLoaded,
        orderTestsResolved,
        electrolyteProfileIds.length,
        electrolyteProfilesResponse,
        activeProfilesLoaded,
        valueUnitLov
    ]);

    /**
     * Approved blood electrolyte labs for reference only.
     * Never copied into dialysate prescription form fields.
     */
    const bloodElectrolyteLabRefs = useMemo(() => {
        const empty: Record<ElectrolyteField, BloodElectrolyteLabRef | null> = {
            sodium: null,
            potassium: null,
            calcium: null
        };

        if (labResultsQueryArgs === skipToken || !bloodLabRefsReady) {
            return empty;
        }

        const testIdToField = new Map<number, ElectrolyteField>(
            ELECTROLYTE_FIELDS.map(field => [
                ELECTROLYTE_DIAGNOSTIC_TEST_IDS[field],
                field
            ])
        );

        const pickProfile = (
            result: DiagnosticOrderTestResultResponseVM,
            diagnosticTestId: number
        ) => {
            const linked =
                result.profileTestId != null
                    ? electrolyteProfilesById.get(Number(result.profileTestId))
                    : null;

            if (linked) {
                return linked;
            }

            const byTest = activeProfilesByTestId[diagnosticTestId] ?? [];

            return (
                byTest.find((profile: any) => profile?.isDefault) ??
                byTest[0] ??
                null
            );
        };

        const eligibleByField: Record<
            ElectrolyteField,
            Array<{
                result: DiagnosticOrderTestResultResponseVM;
                suggestion: BloodElectrolyteLabRef;
            }>
        > = {
            sodium: [],
            potassium: [],
            calcium: []
        };

        approvedLabResults.forEach(result => {
            if (
                result.processingStatus !==
                DiagnosticOrderTestStatus.RESULT_APPROVED
            ) {
                return;
            }

            const orderTest = electrolyteOrderTestById.get(
                Number(result.orderTestId)
            );
            const diagnosticTestId = Number(
                orderTest?.testId ?? orderTest?.diagnosticTestId
            );

            if (!Number.isFinite(diagnosticTestId)) {
                return;
            }

            const field = testIdToField.get(diagnosticTestId);

            if (!field) {
                return;
            }

            const profile = pickProfile(result, diagnosticTestId);

            if (
                profile?.testId != null &&
                Number(profile.testId) !== diagnosticTestId
            ) {
                return;
            }

            const resultType = String(profile?.resultType ?? '')
                .toUpperCase()
                .trim();

            if (resultType && resultType !== 'NUMBER') {
                return;
            }

            const unitDisplay = resolveElectrolyteUnitDisplay(
                profile,
                valueUnitLov
            );

            if (!isCompatibleElectrolyteUnit(unitDisplay, field)) {
                return;
            }

            const value = Number(result.resultValueNumber);

            if (!Number.isFinite(value)) {
                return;
            }

            const eligibilityAt = getResultEligibilityTimestamp(result);
            const eligibilityMs = toTimestampMs(eligibilityAt);

            if (eligibilityMs != null && eligibilityMs > sessionLabCutoffMs) {
                return;
            }

            const marker = result.viewMarker ?? result.marker ?? null;

            eligibleByField[field].push({
                result,
                suggestion: {
                    resultId: Number(result.id),
                    value,
                    marker,
                    isCritical: isCriticalMarker(marker),
                    unitDisplay: unitDisplay as string,
                    approvedDate: result.approvedDate ?? null,
                    reviewDate: result.reviewDate ?? null,
                    createdDate: result.createdDate ?? null
                }
            });
        });

        const latestByField: Record<
            ElectrolyteField,
            BloodElectrolyteLabRef | null
        > = { ...empty };

        ELECTROLYTE_FIELDS.forEach(field => {
            const group = eligibleByField[field];

            if (!group.length) {
                latestByField[field] = null;
                return;
            }

            group.sort((left, right) =>
                compareApprovedLabResultsNewestFirst(left.result, right.result)
            );

            latestByField[field] = group[0].suggestion;
        });

        return latestByField;
    }, [
        labResultsQueryArgs,
        bloodLabRefsReady,
        approvedLabResults,
        electrolyteOrderTestById,
        electrolyteProfilesById,
        activeProfilesByTestId,
        valueUnitLov,
        sessionLabCutoffMs
    ]);

    /**
     * Diagnostic trace for Calcium result 1504 / orderTest 1539 / profile 87.
     * Used only to report the exact rejection gate (not shown in UI).
     */
    const calciumLabBlocker = useMemo(() => {
        if (!bloodLabRefsReady) {
            return 'Calcium reference waiting for results/joins/units to finish loading.';
        }

        if (bloodElectrolyteLabRefs.calcium) {
            return null;
        }

        const calciumResult = approvedLabResults.find(
            result => Number(result.id) === 1504
        );

        if (!calciumResult) {
            return 'Result 1504 not present in loaded RESULT_APPROVED pages for this patient.';
        }

        if (
            calciumResult.processingStatus !==
            DiagnosticOrderTestStatus.RESULT_APPROVED
        ) {
            return `Result 1504 status is ${String(calciumResult.processingStatus)}, not RESULT_APPROVED.`;
        }

        const orderTest = electrolyteOrderTestById.get(
            Number(calciumResult.orderTestId)
        );

        if (!orderTest) {
            return `Order test ${calciumResult.orderTestId} (expected 1539) did not resolve.`;
        }

        const diagnosticTestId = Number(
            orderTest.testId ?? orderTest.diagnosticTestId
        );

        if (diagnosticTestId !== ELECTROLYTE_DIAGNOSTIC_TEST_IDS.calcium) {
            return `Order test ${orderTest.id} resolved to testId ${diagnosticTestId}, expected Calcium test ID 1.`;
        }

        const linkedProfile =
            calciumResult.profileTestId != null
                ? electrolyteProfilesById.get(
                      Number(calciumResult.profileTestId)
                  )
                : null;
        const fallbackProfiles =
            activeProfilesByTestId[ELECTROLYTE_DIAGNOSTIC_TEST_IDS.calcium] ??
            [];
        const profile =
            linkedProfile ??
            fallbackProfiles.find((item: any) => item?.isDefault) ??
            fallbackProfiles[0] ??
            null;

        if (!profile) {
            return `Profile ${calciumResult.profileTestId ?? 87} (and active Calcium profiles) could not be loaded for unit resolution.`;
        }

        if (
            profile.testId != null &&
            Number(profile.testId) !== ELECTROLYTE_DIAGNOSTIC_TEST_IDS.calcium
        ) {
            return `Profile ${profile.id} testId is ${profile.testId}, expected Calcium test ID 1.`;
        }

        const resultType = String(profile.resultType ?? '')
            .toUpperCase()
            .trim();

        if (resultType && resultType !== 'NUMBER') {
            return `Profile ${profile.id} resultType is ${resultType}, not NUMBER.`;
        }

        const unitDisplay = resolveElectrolyteUnitDisplay(profile, valueUnitLov);

        if (!unitDisplay) {
            return `Profile ${profile.id} resultUnit '${String(profile.resultUnit ?? '')}' could not be resolved via VALUE_UNIT (missing/ambiguous unit).`;
        }

        if (!isCompatibleElectrolyteUnit(unitDisplay, 'calcium')) {
            return `Profile ${profile.id} unit '${unitDisplay}' is incompatible for Calcium (accepted: mmol/L family only; mg/dL is not accepted).`;
        }

        const eligibilityAt = getResultEligibilityTimestamp(calciumResult);
        const eligibilityMs = toTimestampMs(eligibilityAt);

        if (eligibilityMs != null && eligibilityMs > sessionLabCutoffMs) {
            return `Result 1504 timestamp ${String(eligibilityAt)} is after the dialysis session cutoff.`;
        }

        return 'Result 1504 passed gates but was not selected (unexpected).';
    }, [
        bloodLabRefsReady,
        bloodElectrolyteLabRefs.calcium,
        approvedLabResults,
        electrolyteOrderTestById,
        electrolyteProfilesById,
        activeProfilesByTestId,
        valueUnitLov,
        sessionLabCutoffMs
    ]);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && calciumLabBlocker) {
            // eslint-disable-next-line no-console
            console.debug(
                '[DialysisSession] Calcium blood-lab reference blocked:',
                calciumLabBlocker
            );
        }
    }, [calciumLabBlocker]);

    const renderBloodLabReference = (field: ElectrolyteField) => {
        const labRef = bloodElectrolyteLabRefs[field];

        if (!labRef) {
            if (field === 'calcium' && bloodLabRefsReady && !sessionFieldsDisabled) {
                return (
                    <div
                        className="dialysis-session-lab-ref dialysis-session-lab-ref--unavailable"
                        role="note"
                    >
                        <span className="dialysis-session-lab-ref-label">
                            <Translate>Blood lab unavailable</Translate>
                        </span>
                        <span className="dialysis-session-lab-ref-value">
                            <Translate>
                                No eligible approved Calcium blood result for
                                this patient (check test mapping or unit). Do
                                not invent a dialysate value from missing labs.
                            </Translate>
                        </span>
                    </div>
                );
            }

            return null;
        }

        const sourceTime = labRef.approvedDate
            ? formatDateWithoutSeconds(labRef.approvedDate)
            : labRef.reviewDate
              ? formatDateWithoutSeconds(labRef.reviewDate)
              : labRef.createdDate
                ? formatDateWithoutSeconds(labRef.createdDate)
                : '';

        return (
            <div className="dialysis-session-lab-ref" role="note">
                <span className="dialysis-session-lab-ref-label">
                    <Translate>Blood result (not dialysate)</Translate>
                    {labRef.isCritical ? (
                        <span className="dialysis-session-lab-ref-critical">
                            {' '}
                            · <Translate>Critical</Translate>
                        </span>
                    ) : null}
                </span>
                <span className="dialysis-session-lab-ref-value">
                    {labRef.value} {labRef.unitDisplay}
                    {sourceTime ? ` · ${sourceTime}` : ''}
                    {labRef.marker
                        ? ` · ${formatEnumString(String(labRef.marker))}`
                        : ''}
                </span>
                <span className="dialysis-session-lab-ref-hint">
                    <Translate>
                        Do not copy into dialysate prescription fields.
                    </Translate>
                </span>
            </div>
        );
    };

    const ufWeightLossMismatch = useMemo(() => {
        if (
            form.preWeight == null ||
            form.postWeight == null ||
            form.actualUf == null
        ) {
            return null;
        }

        const pre = Number(form.preWeight);
        const post = Number(form.postWeight);
        const actualUf = Number(form.actualUf);

        if (Number.isNaN(pre) || Number.isNaN(post) || Number.isNaN(actualUf)) {
            return null;
        }

        const weightLossKg = Math.round((pre - post) * 100) / 100;
        // Actual UF is entered in L; 1 L ≈ 1 kg fluid.
        const delta = Math.abs(weightLossKg - actualUf);

        if (delta <= 0.5) {
            return null;
        }

        return {
            weightLossKg,
            actualUf,
            delta
        };
    }, [form.preWeight, form.postWeight, form.actualUf]);

    const {
        data: practitioners,
        isFetching: loadingPractitioners,
        isError: practitionerError
    } = useGetAllPractitionersQuery({
        page: 0,
        size: 9999,
        sort: 'id,asc'
    });

    const physicians =
        practitioners?.data?.filter(
            practitioner => practitioner.jobRole === 'PHYSICIAN'
        ) ?? [];

    const {
        data: nurseListResponse,
        isFetching: loadingNurses,
        isError: nurseError
    } = useGetUsersBasicQuery({
        page: 0,
        size: 9999,
        sort: 'id,asc',
        jobRole: 'NURSE'
    });

    const nurses = nurseListResponse?.data ?? [];

    const appliedHydrationKey = useRef<string | null>(null);
    const section02Touched = useRef<Record<string, true>>({});
    const section03Touched = useRef<Record<string, true>>({});
    const section05Touched = useRef<Record<string, true>>({});
    const section07Touched = useRef<Record<string, true>>({});
    const section08Touched = useRef<Record<string, true>>({});
    const loadedSessionId = useRef<number | null>(null);
    const creatingSessionRef = useRef<Promise<number | null> | null>(null);
    const sessionContextRef = useRef({
        patientId: patient?.id,
        encounterId: encounter?.id
    });
    sessionContextRef.current = {
        patientId: patient?.id,
        encounterId: encounter?.id
    };

    const contextIdentity = `${patient?.id ?? ''}|${encounter?.id ?? ''}`;
    const [renderedContext, setRenderedContext] = useState(contextIdentity);

    if (renderedContext !== contextIdentity) {
        setRenderedContext(contextIdentity);
        loadedSessionId.current = null;
        appliedHydrationKey.current = null;
        bootstrapAppliedKey.current = null;
        draftHydrationPlanIdRef.current = null;
        creatingSessionRef.current = null;
        formBaselineRef.current = '';
        section02Touched.current = {};
        section03Touched.current = {};
        section05Touched.current = {};
        section07Touched.current = {};
        section08Touched.current = {};
        setKnownSessionId(null);
        setActiveSessionId(null);
        setSelectedTreatmentPlanId(null);
        setPendingTreatmentPlan(null);
        setAmbiguousSessions([]);
        setPendingAmbiguousPlan(null);
        setSessionHydration(null);
        setBootstrapComplete(false);
        setPlanSwitchLoading(false);
        setForm(initialSessionForm);
        setFlowEntry(initialFlowEntry);
    }

    useEffect(() => {
        loadedSessionId.current = null;
        setKnownSessionId(null);
        setActiveSessionId(null);
        setSelectedTreatmentPlanId(null);
        setPendingTreatmentPlan(null);
        setAmbiguousSessions([]);
        setPendingAmbiguousPlan(null);
        setSessionHydration(null);
        setBootstrapComplete(false);
        setPlanSwitchLoading(false);
        creatingSessionRef.current = null;
        appliedHydrationKey.current = null;
        bootstrapAppliedKey.current = null;
        draftHydrationPlanIdRef.current = null;
        formBaselineRef.current = '';
        section02Touched.current = {};
        section03Touched.current = {};
        section05Touched.current = {};
        section07Touched.current = {};
        section08Touched.current = {};
        setForm(initialSessionForm);
        setFlowEntry(initialFlowEntry);
    }, [patient?.id, encounter?.id]);

    useEffect(() => {
        if (dialysisSession?.id) {
            const sessionId = Number(dialysisSession.id);
            loadedSessionId.current = sessionId;
            setKnownSessionId(sessionId);
        }
    }, [dialysisSession?.id]);

    /** Clinical IDWG = Pre Weight − Dry Weight (kg). */
    const computeInterdialyticWeightGain = (
        preWeight: number | string | null | undefined,
        dryWeight: number | string | null | undefined
    ) => {
        if (
            preWeight === '' ||
            preWeight === null ||
            preWeight === undefined ||
            dryWeight === '' ||
            dryWeight === null ||
            dryWeight === undefined
        ) {
            return null;
        }

        const pre = Number(preWeight);
        const dry = Number(dryWeight);

        if (Number.isNaN(pre) || Number.isNaN(dry)) {
            return null;
        }

        return Math.round((pre - dry) * 100) / 100;
    };

    const computeUfDifference = (
        targetUf: number | string | null | undefined,
        actualUf: number | string | null | undefined
    ) => {
        if (
            targetUf === '' ||
            targetUf === null ||
            targetUf === undefined ||
            actualUf === '' ||
            actualUf === null ||
            actualUf === undefined
        ) {
            return null;
        }

        const target = Number(targetUf);
        const actual = Number(actualUf);

        if (Number.isNaN(target) || Number.isNaN(actual)) {
            return null;
        }

        return Math.round((actual - target) * 100) / 100;
    };

    const setSection02Form = (
        next:
            | typeof initialSessionForm
            | ((previous: typeof initialSessionForm) => typeof initialSessionForm)
    ) => {
        setForm(previous => {
            const incoming =
                typeof next === 'function' ? next(previous) : next;
            const record = { ...incoming };

            const preWeightChanged = record.preWeight !== previous.preWeight;
            const dryWeightChanged = record.dryWeight !== previous.dryWeight;

            if (preWeightChanged || dryWeightChanged) {
                record.interdialyticWeightGain = computeInterdialyticWeightGain(
                    record.preWeight,
                    record.dryWeight
                );
            }

            (
                [
                    'preWeight',
                    'dryWeight',
                    'weightGain',
                    'interdialyticWeightGain',
                    'bloodPressureSystolic',
                    'bloodPressureDiastolic',
                    'heartRate',
                    'temperature',
                    'respiratoryRate',
                    'oxygenSaturation',
                    'symptoms',
                    'edema',
                    'preAccessCondition',
                    'generalCondition'
                ] as const
            ).forEach(field => {
                if (record[field] !== previous[field]) {
                    section02Touched.current[field] = true;
                }
            });

            return record;
        });
    };

    const setSection03Form = (
        next:
            | typeof initialSessionForm
            | ((previous: typeof initialSessionForm) => typeof initialSessionForm)
    ) => {
        setForm(previous => {
            const incoming =
                typeof next === 'function' ? next(previous) : next;
            const record = { ...incoming };

            if (record.anticoagulation !== 'OTHER') {
                record.otherAnticoagulation = null;
            }

            (
                [
                    'dialysisDuration',
                    'durationType',
                    'bloodFlowRate',
                    'dialysateFlowRate',
                    'ultrafiltrationGoal',
                    'dialysateComposition',
                    'sodium',
                    'potassium',
                    'calcium',
                    'dialysisTemperature',
                    'heparinDose',
                    'anticoagulation',
                    'otherAnticoagulation',
                    'targetDryWeight'
                ] as const
            ).forEach(field => {
                if (record[field] !== previous[field]) {
                    section03Touched.current[field] = true;
                }
            });

            return record;
        });
    };

    const setSection05Form = (
        next:
            | typeof initialSessionForm
            | ((previous: typeof initialSessionForm) => typeof initialSessionForm)
    ) => {
        setForm(previous => {
            const incoming =
                typeof next === 'function' ? next(previous) : next;
            const record = { ...incoming };

            if (record.accessSite !== 'OTHER') {
                record.otherAccessSite = null;
            }

            (
                [
                    'accessType',
                    'accessSite',
                    'otherAccessSite',
                    'infection',
                    'bleeding',
                    'thrill',
                    'bruit',
                    'dressing',
                    'catheterCondition'
                ] as const
            ).forEach(field => {
                if (record[field] !== previous[field]) {
                    section05Touched.current[field] = true;
                }
            });

            return record;
        });
    };

    const setSection07Form = (
        next:
            | typeof initialSessionForm
            | ((previous: typeof initialSessionForm) => typeof initialSessionForm)
    ) => {
        setForm(previous => {
            const incoming =
                typeof next === 'function' ? next(previous) : next;
            const record = { ...incoming };

            const targetUfChanged = record.targetUf !== previous.targetUf;
            const actualUfChanged = record.actualUf !== previous.actualUf;

            if (targetUfChanged || actualUfChanged) {
                // Difference is derived (Actual − Target); not manually edited.
                record.ufDifference = computeUfDifference(
                    record.targetUf,
                    record.actualUf
                );
            }

            (
                [
                    'postWeight',
                    'postBloodPressureSystolic',
                    'postBloodPressureDiastolic',
                    'postPulse',
                    'postTemperature',
                    'totalUfRemoved',
                    'actualTreatmentDuration',
                    'postAccessCondition',
                    'disposition',
                    'postComplications',
                    'patientCondition',
                    'targetUf',
                    'actualUf',
                    'ufDifference'
                ] as const
            ).forEach(field => {
                if (
                    field === 'ufDifference' &&
                    (targetUfChanged || actualUfChanged)
                ) {
                    return;
                }

                if (record[field] !== previous[field]) {
                    section07Touched.current[field] = true;
                }
            });

            return record;
        });
    };

    const setSection08Form = (
        next:
            | typeof initialSessionForm
            | ((previous: typeof initialSessionForm) => typeof initialSessionForm)
    ) => {
        setForm(previous => {
            const record =
                typeof next === 'function' ? next(previous) : next;

            (
                [
                    'complications',
                    'complicationNotes'
                ] as const
            ).forEach(field => {
                if (record[field] !== previous[field]) {
                    section08Touched.current[field] = true;
                }
            });

            return record;
        });
    };

    const toMeasurement = (value: number | string | null) => {
        if (value === '' || value === null || value === undefined) {
            return null;
        }

        const numericValue = Number(value);

        return Number.isNaN(numericValue) ? null : numericValue;
    };

    const toInteger = (value: number | string | null) => {
        const numericValue = toMeasurement(value);

        return numericValue === null ? null : Math.trunc(numericValue);
    };

    const captureFormBaseline = (nextForm: typeof initialSessionForm) => {
        formBaselineRef.current = JSON.stringify(nextForm);
    };

    const hasUnsavedSessionChanges = () => {
        if (!formBaselineRef.current) {
            return false;
        }

        return JSON.stringify(form) !== formBaselineRef.current;
    };

    const resetTouchedSections = () => {
        section02Touched.current = {};
        section03Touched.current = {};
        section05Touched.current = {};
        section07Touched.current = {};
        section08Touched.current = {};
    };

    const beginDraftForPlan = (plan: NephrologyTreatmentPlan) => {
        // Never create draft/session state from read-only EMR or locked encounters.
        if (
            disabled ||
            !patient?.id ||
            !encounter?.id ||
            String(plan.patientId) !== String(patient.id)
        ) {
            return;
        }

        const planId = Number(plan.id);
        const mapped = mapTreatmentPlanToSessionFields(plan);
        const nextForm = {
            ...initialSessionForm,
            ...mapped
        };

        creatingSessionRef.current = null;
        loadedSessionId.current = null;
        draftHydrationPlanIdRef.current = planId;
        appliedHydrationKey.current = `draft:plan:${planId}`;
        resetTouchedSections();

        setActiveSessionId(null);
        activeSessionIdRef.current = null;
        setKnownSessionId(null);
        setSelectedTreatmentPlanId(planId);
        selectedTreatmentPlanIdRef.current = planId;
        setForm(nextForm);
        setFlowEntry(initialFlowEntry);
        captureFormBaseline(nextForm);
        setSessionHydration({
            patientId: patient.id,
            encounterId: encounter.id,
            sessionId: null,
            treatmentPlanId: planId
        });
        setBootstrapComplete(true);
    };

    const loadSavedSessionForPlan = (
        session: DialysisSessionModel,
        plan: NephrologyTreatmentPlan
    ) => {
        if (
            !patient?.id ||
            !encounter?.id ||
            String(session.patientId) !== String(patient.id) ||
            String(session.encounterId) !== String(encounter.id) ||
            String(plan.patientId) !== String(patient.id)
        ) {
            return;
        }

        const sessionId = Number(session.id);
        const planId = Number(plan.id);

        creatingSessionRef.current = null;
        loadedSessionId.current = sessionId;
        draftHydrationPlanIdRef.current = null;
        appliedHydrationKey.current = null;
        resetTouchedSections();

        setSelectedTreatmentPlanId(planId);
        selectedTreatmentPlanIdRef.current = planId;
        setKnownSessionId(sessionId);
        setActiveSessionId(sessionId);
        activeSessionIdRef.current = sessionId;
        setBootstrapComplete(true);
        // Form hydration is applied from the by-id query response.
    };

    const selectTreatmentPlan = async (plan: NephrologyTreatmentPlan) => {
        // Allow plan switching while read-only so EMR can browse saved sessions.
        // Drafts / creates remain blocked via beginDraftForPlan + save guards.
        // When EMR locks a preferred plan, do not switch away from it.
        if (
            savingDialysisSession ||
            planSwitchLoading ||
            !patient?.id ||
            !encounter?.id ||
            String(plan.patientId) !== String(patient.id)
        ) {
            return;
        }

        if (
            preferredTreatmentPlanId != null &&
            preferredTreatmentPlanId > 0 &&
            Number(plan.id) !== preferredTreatmentPlanId
        ) {
            return;
        }

        const requestPatientId = patient.id;
        const requestEncounterId = encounter.id;
        const planId = Number(plan.id);

        setPlanSwitchLoading(true);

        try {
            const sessions = await fetchSessionsByPlan({
                patientId: Number(requestPatientId),
                encounterId: Number(requestEncounterId),
                treatmentPlanId: planId
            }).unwrap();

            if (
                String(sessionContextRef.current.patientId) !==
                String(requestPatientId) ||
                String(sessionContextRef.current.encounterId) !==
                String(requestEncounterId)
            ) {
                return;
            }

            const matchingSessions = (sessions ?? []).filter(
                session =>
                    String(session.patientId) === String(requestPatientId) &&
                    String(session.encounterId) ===
                    String(requestEncounterId) &&
                    Number(session.treatmentPlanId) === planId
            );

            if (matchingSessions.length > 1) {
                setPendingAmbiguousPlan(plan);
                setAmbiguousSessions(matchingSessions);
                return;
            }

            if (matchingSessions.length === 1) {
                loadSavedSessionForPlan(matchingSessions[0], plan);
                return;
            }

            if (disabled) {
                creatingSessionRef.current = null;
                loadedSessionId.current = null;
                draftHydrationPlanIdRef.current = null;
                appliedHydrationKey.current = `empty:plan:${planId}`;
                resetTouchedSections();
                setActiveSessionId(null);
                activeSessionIdRef.current = null;
                setKnownSessionId(null);
                setSelectedTreatmentPlanId(planId);
                selectedTreatmentPlanIdRef.current = planId;
                setForm(initialSessionForm);
                setFlowEntry(initialFlowEntry);
                captureFormBaseline(initialSessionForm);
                setSessionHydration({
                    patientId: requestPatientId,
                    encounterId: requestEncounterId,
                    sessionId: null,
                    treatmentPlanId: planId
                });
                setBootstrapComplete(true);
                return;
            }

            beginDraftForPlan(plan);
        } catch (e: any) {
            dispatch(
                notify({
                    msg:
                        e?.data?.detail ||
                        e?.data?.message ||
                        'Failed to load sessions for the selected Treatment Plan',
                    sev: 'error'
                })
            );
        } finally {
            setPlanSwitchLoading(false);
        }
    };

    const handleSelectTreatmentPlan = (plan: NephrologyTreatmentPlan) => {
        if (
            savingDialysisSession ||
            planSwitchLoading ||
            String(plan.patientId) !== String(patient?.id)
        ) {
            return;
        }

        if (
            Number(plan.id) === Number(selectedTreatmentPlanId) &&
            (activeSessionId != null ||
                sessionHydration?.treatmentPlanId === Number(plan.id))
        ) {
            return;
        }

        if (
            (selectedTreatmentPlanId != null || activeSessionId != null) &&
            hasUnsavedSessionChanges()
        ) {
            setPendingTreatmentPlan(plan);
            return;
        }

        void selectTreatmentPlan(plan);
    };

    const confirmPendingTreatmentPlan = () => {
        if (!pendingTreatmentPlan) {
            return;
        }

        const plan = pendingTreatmentPlan;
        setPendingTreatmentPlan(null);
        void selectTreatmentPlan(plan);
    };

    const selectAmbiguousSession = (session: DialysisSessionModel) => {
        if (!pendingAmbiguousPlan) {
            return;
        }

        const plan = pendingAmbiguousPlan;
        setPendingAmbiguousPlan(null);
        setAmbiguousSessions([]);
        loadSavedSessionForPlan(session, plan);
    };

    const persistDialysisSession = async (): Promise<number | null> => {
        if (disabled || !patient?.id || !encounter?.id) {
            return null;
        }

        if (selectedTreatmentPlanIdRef.current == null) {
            return null;
        }

        const requestPatientId = patient.id;
        const requestEncounterId = encounter.id;

        if (
            String(sessionContextRef.current.patientId) !== String(requestPatientId) ||
            String(sessionContextRef.current.encounterId) !== String(requestEncounterId)
        ) {
            return null;
        }

        const hydrationMatchesContext =
            sessionHydration != null &&
            String(sessionHydration.patientId) === String(requestPatientId) &&
            String(sessionHydration.encounterId) === String(requestEncounterId);

        const serverSessionId =
            activeSessionId != null &&
                hydrationMatchesContext &&
                sessionHydration?.sessionId === Number(activeSessionId)
                ? Number(activeSessionId)
                : null;

        if (serverSessionId) {
            if (
                loadingActiveSession ||
                (dialysisSession != null &&
                    Number(dialysisSession.id) !== serverSessionId)
            ) {
                return null;
            }
        } else if (!bootstrapComplete || !hydrationMatchesContext) {
            return null;
        } else if (sessionHydration?.sessionId != null) {
            return null;
        } else if (
            selectedTreatmentPlanIdRef.current != null &&
            sessionHydration?.treatmentPlanId !==
            Number(selectedTreatmentPlanIdRef.current)
        ) {
            return null;
        }

        const body = {
            chairStation: form.chairStation?.trim() || null,
            machine: form.machine?.trim() || null,
            date: form.date || null,
            startTime: form.startTime || null,
            endTime: form.endTime || null,
            shift: form.shift || null,
            assignedNurseId: form.assignedNurseId
                ? Number(form.assignedNurseId)
                : null,
            nephrologistId: form.nephrologistId
                ? Number(form.nephrologistId)
                : null,
            treatmentPlanId: Number(selectedTreatmentPlanIdRef.current),
            preWeight: toMeasurement(form.preWeight),
            dryWeight: toMeasurement(form.dryWeight),
            weightGain: toMeasurement(form.weightGain),
            interdialyticWeightGain: toMeasurement(
                form.interdialyticWeightGain
            ),
            bloodPressureSystolic: toInteger(form.bloodPressureSystolic),
            bloodPressureDiastolic: toInteger(form.bloodPressureDiastolic),
            heartRate: toInteger(form.heartRate),
            temperature: toMeasurement(form.temperature),
            respiratoryRate: toInteger(form.respiratoryRate),
            oxygenSaturation: toMeasurement(form.oxygenSaturation),
            symptoms: form.symptoms?.trim() || null,
            edema: form.edema?.trim() || null,
            preAccessCondition: form.preAccessCondition?.trim() || null,
            generalCondition: form.generalCondition?.trim() || null,
            dialysisDuration: toMeasurement(form.dialysisDuration),
            durationType: form.durationType || null,
            bloodFlowRate: toMeasurement(form.bloodFlowRate),
            dialysateFlowRate: toMeasurement(form.dialysateFlowRate),
            ultrafiltrationGoal: toMeasurement(form.ultrafiltrationGoal),
            dialysateComposition: form.dialysateComposition?.trim() || null,
            sodium: toMeasurement(form.sodium),
            potassium: toMeasurement(form.potassium),
            calcium: toMeasurement(form.calcium),
            dialysisTemperature: toMeasurement(form.dialysisTemperature),
            heparinDose: toMeasurement(form.heparinDose),
            anticoagulation: form.anticoagulation || null,
            otherAnticoagulation:
                form.anticoagulation === 'OTHER'
                    ? form.otherAnticoagulation?.trim() || null
                    : null,
            targetDryWeight: toMeasurement(form.targetDryWeight),
            accessType: form.accessType || null,
            accessSite: form.accessSite || null,
            otherAccessSite:
                form.accessSite === 'OTHER'
                    ? form.otherAccessSite?.trim() || null
                    : null,
            infection:
                form.infection === true || form.infection === false
                    ? form.infection
                    : null,
            bleeding:
                form.bleeding === true || form.bleeding === false
                    ? form.bleeding
                    : null,
            thrill: form.thrill?.trim() || null,
            bruit: form.bruit?.trim() || null,
            dressing: form.dressing?.trim() || null,
            catheterCondition: form.catheterCondition?.trim() || null,
            postWeight: toMeasurement(form.postWeight),
            postBloodPressureSystolic: toInteger(
                form.postBloodPressureSystolic
            ),
            postBloodPressureDiastolic: toInteger(
                form.postBloodPressureDiastolic
            ),
            postPulse: toInteger(form.postPulse),
            postTemperature: toMeasurement(form.postTemperature),
            totalUfRemoved: toMeasurement(form.totalUfRemoved),
            actualTreatmentDuration: toMeasurement(
                form.actualTreatmentDuration
            ),
            postAccessCondition: form.postAccessCondition?.trim() || null,
            disposition: form.disposition || null,
            postComplications: form.postComplications?.trim() || null,
            patientCondition: form.patientCondition?.trim() || null,
            targetUf: toMeasurement(form.targetUf),
            actualUf: toMeasurement(form.actualUf),
            ufDifference: toMeasurement(form.ufDifference),
            complications:
                form.complications.length > 0 ? form.complications : null,
            complicationNotes: form.complicationNotes?.trim() || null
        };

        const hydratedSessionId =
            hydrationMatchesContext && sessionHydration?.sessionId != null
                ? Number(sessionHydration.sessionId)
                : null;
        const rememberedSessionId =
            loadedSessionId.current != null &&
                Number(loadedSessionId.current) === hydratedSessionId
                ? Number(loadedSessionId.current)
                : null;
        const existingSessionId = serverSessionId ?? rememberedSessionId;

        if (existingSessionId) {
            await updateDialysisSession({
                id: existingSessionId,
                ...body
            }).unwrap();

            if (
                String(sessionContextRef.current.patientId) ===
                String(requestPatientId) &&
                String(sessionContextRef.current.encounterId) ===
                String(requestEncounterId)
            ) {
                appliedHydrationKey.current = `id:${existingSessionId}`;
                captureFormBaseline(form);
                setActiveSessionId(existingSessionId);
                activeSessionIdRef.current = existingSessionId;
                setKnownSessionId(existingSessionId);
                setSessionHydration({
                    patientId: requestPatientId,
                    encounterId: requestEncounterId,
                    sessionId: existingSessionId,
                    treatmentPlanId: selectedTreatmentPlanIdRef.current
                });
            }

            return existingSessionId;
        }

        if (creatingSessionRef.current) {
            return creatingSessionRef.current;
        }

        let createPromise: Promise<number | null>;
        createPromise = (async (): Promise<number | null> => {
            try {
                const created = await createDialysisSession({
                    patientId,
                    encounterId,
                    ...body
                }).unwrap();

                if (!created?.id) {
                    return null;
                }

                const createdId = Number(created.id);
                const stillSameEncounter =
                    sessionContextRef.current.patientId === requestPatientId &&
                    sessionContextRef.current.encounterId === requestEncounterId;

                if (stillSameEncounter) {
                    loadedSessionId.current = createdId;
                    draftHydrationPlanIdRef.current = null;
                    appliedHydrationKey.current = `id:${createdId}`;
                    captureFormBaseline(form);
                    setKnownSessionId(createdId);
                    setActiveSessionId(createdId);
                    activeSessionIdRef.current = createdId;
                    setSessionHydration({
                        patientId: requestPatientId,
                        encounterId: requestEncounterId,
                        sessionId: createdId,
                        treatmentPlanId: selectedTreatmentPlanIdRef.current
                    });
                }

                return createdId;
            } finally {
                if (creatingSessionRef.current === createPromise) {
                    creatingSessionRef.current = null;
                }
            }
        })();

        creatingSessionRef.current = createPromise;
        return createPromise;
    };

    const saveDialysisSession = async () => {
        if (sessionFieldsDisabled || savingDialysisSession) {
            return;
        }

        if (!patient?.id || !encounter?.id) {
            return;
        }

        try {
            const savedSessionId = await persistDialysisSession();

            if (!savedSessionId) {
                return;
            }

            dispatch(
                notify({
                    msg: 'Dialysis Session Saved Successfully',
                    sev: 'success'
                })
            );
        } catch (e: any) {
            dispatch(
                notify({
                    msg:
                        e?.data?.detail ||
                        e?.data?.message ||
                        'Failed to save Dialysis Session',
                    sev: 'error'
                })
            );
        }
    };

    const savePreDialysisAssessment = async () => {
        if (sessionFieldsDisabled || savingDialysisSession) {
            return;
        }

        if (!patient?.id || !encounter?.id) {
            return;
        }

        try {
            const savedSessionId = await persistDialysisSession();

            if (!savedSessionId) {
                return;
            }

            dispatch(
                notify({
                    msg: 'Pre-Dialysis Assessment Saved Successfully',
                    sev: 'success'
                })
            );
        } catch (e: any) {
            dispatch(
                notify({
                    msg:
                        e?.data?.detail ||
                        e?.data?.message ||
                        'Failed to save Pre-Dialysis Assessment',
                    sev: 'error'
                })
            );
        }
    };

    const saveDialysisPrescription = async () => {
        if (sessionFieldsDisabled || savingDialysisSession) {
            return;
        }

        if (!patient?.id || !encounter?.id) {
            return;
        }

        try {
            const savedSessionId = await persistDialysisSession();

            if (!savedSessionId) {
                return;
            }

            dispatch(
                notify({
                    msg: 'Dialysis Prescription Saved Successfully',
                    sev: 'success'
                })
            );
        } catch (e: any) {
            dispatch(
                notify({
                    msg:
                        e?.data?.detail ||
                        e?.data?.message ||
                        'Failed to save Dialysis Prescription',
                    sev: 'error'
                })
            );
        }
    };

    const saveDialysisAccess = async () => {
        if (sessionFieldsDisabled || savingDialysisSession) {
            return;
        }

        if (!patient?.id || !encounter?.id) {
            return;
        }

        try {
            const savedSessionId = await persistDialysisSession();

            if (!savedSessionId) {
                return;
            }

            dispatch(
                notify({
                    msg: 'Dialysis Access Saved Successfully',
                    sev: 'success'
                })
            );
        } catch (e: any) {
            dispatch(
                notify({
                    msg:
                        e?.data?.detail ||
                        e?.data?.message ||
                        'Failed to save Dialysis Access',
                    sev: 'error'
                })
            );
        }
    };

    const savePostDialysisAssessment = async () => {
        if (sessionFieldsDisabled || savingDialysisSession) {
            return;
        }

        if (!patient?.id || !encounter?.id) {
            return;
        }

        try {
            const savedSessionId = await persistDialysisSession();

            if (!savedSessionId) {
                return;
            }

            dispatch(
                notify({
                    msg: 'Post-Dialysis Assessment Saved Successfully',
                    sev: 'success'
                })
            );
        } catch (e: any) {
            dispatch(
                notify({
                    msg:
                        e?.data?.detail ||
                        e?.data?.message ||
                        'Failed to save Post-Dialysis Assessment',
                    sev: 'error'
                })
            );
        }
    };

    const saveDialysisComplications = async () => {
        if (sessionFieldsDisabled || savingDialysisSession) {
            return;
        }

        if (!patient?.id || !encounter?.id) {
            return;
        }

        try {
            const savedSessionId = await persistDialysisSession();

            if (!savedSessionId) {
                return;
            }

            dispatch(
                notify({
                    msg: 'Dialysis Complications Saved Successfully',
                    sev: 'success'
                })
            );
        } catch (e: any) {
            dispatch(
                notify({
                    msg:
                        e?.data?.detail ||
                        e?.data?.message ||
                        'Failed to save Dialysis Complications',
                    sev: 'error'
                })
            );
        }
    };

    useEffect(() => {
        if (!patient?.id || !encounter?.id) {
            return;
        }

        const preferredKey =
            preferredSessionId != null && preferredSessionId > 0
                ? `|session:${preferredSessionId}`
                : '';
        const bootstrapKey = `${patient.id}|${encounter.id}${preferredKey}`;

        if (bootstrapAppliedKey.current === bootstrapKey) {
            return;
        }

        // EMR / explicit session selection: load by id, never create.
        if (preferredSessionId != null && preferredSessionId > 0) {
            bootstrapAppliedKey.current = bootstrapKey;
            loadedSessionId.current = preferredSessionId;
            draftHydrationPlanIdRef.current = null;
            appliedHydrationKey.current = null;
            resetTouchedSections();
            setActiveSessionId(preferredSessionId);
            activeSessionIdRef.current = preferredSessionId;
            setKnownSessionId(preferredSessionId);
            if (
                preferredTreatmentPlanId != null &&
                preferredTreatmentPlanId > 0
            ) {
                setSelectedTreatmentPlanId(preferredTreatmentPlanId);
                selectedTreatmentPlanIdRef.current = preferredTreatmentPlanId;
            }
            setBootstrapComplete(true);
            return;
        }

        if (loadingLatestSession) {
            return;
        }

        if (!latestSessionLoaded && !latestSessionFailed) {
            return;
        }

        bootstrapAppliedKey.current = bootstrapKey;

        const latest =
            latestSessionResponse &&
                latestSessionResponse.id != null &&
                String(latestSessionResponse.patientId) === String(patient.id) &&
                String(latestSessionResponse.encounterId) === String(encounter.id)
                ? latestSessionResponse
                : undefined;

        if (latest?.id != null) {
            const sessionId = Number(latest.id);
            const planId =
                latest.treatmentPlanId != null
                    ? Number(latest.treatmentPlanId)
                    : null;

            loadedSessionId.current = sessionId;
            draftHydrationPlanIdRef.current = null;
            appliedHydrationKey.current = null;
            resetTouchedSections();
            setActiveSessionId(sessionId);
            activeSessionIdRef.current = sessionId;
            setKnownSessionId(sessionId);
            setSelectedTreatmentPlanId(planId);
            selectedTreatmentPlanIdRef.current = planId;
            setBootstrapComplete(true);
            return;
        }

        // No saved session for this encounter yet.
        if (selectedTreatmentPlanIdRef.current != null) {
            setBootstrapComplete(true);
            return;
        }

        appliedHydrationKey.current = 'empty';
        setActiveSessionId(null);
        setKnownSessionId(null);
        setSelectedTreatmentPlanId(null);
        setForm(initialSessionForm);
        captureFormBaseline(initialSessionForm);
        setSessionHydration({
            patientId: patient.id,
            encounterId: encounter.id,
            sessionId: null,
            treatmentPlanId: null
        });
        setBootstrapComplete(true);
    }, [
        patient?.id,
        encounter?.id,
        preferredSessionId,
        preferredTreatmentPlanId,
        latestSessionResponse,
        loadingLatestSession,
        latestSessionLoaded,
        latestSessionFailed
    ]);

    const sessionSkipped = !patient?.id || !encounter?.id;
    const section02SourcesReady =
        sessionSkipped ||
        (activeSessionId != null
            ? activeSessionLoaded || activeSessionFailed
            : bootstrapComplete);

    useEffect(() => {
        if (!patient?.id || !encounter?.id || !section02SourcesReady) {
            return;
        }

        // Draft for a selected plan is initialized explicitly; do not wipe it.
        if (
            activeSessionId == null &&
            draftHydrationPlanIdRef.current != null
        ) {
            return;
        }

        if (activeSessionId != null) {
            if (loadingActiveSession) {
                return;
            }

            if (!dialysisSession && !activeSessionFailed) {
                return;
            }

            if (
                dialysisSession &&
                Number(dialysisSession.id) !== Number(activeSessionId)
            ) {
                return;
            }
        } else if (!bootstrapComplete) {
            return;
        }

        const hydrationKey =
            dialysisSession?.id != null
                ? `id:${Number(dialysisSession.id)}`
                : activeSessionId == null
                    ? 'empty'
                    : `pending:${activeSessionId}`;

        if (appliedHydrationKey.current === hydrationKey) {
            return;
        }

        if (hydrationKey.startsWith('pending:')) {
            return;
        }

        if (hydrationKey === 'empty') {
            loadedSessionId.current = null;
            setKnownSessionId(null);
        }

        setForm(previous => {
            const initialValue = (
                field: keyof typeof section02Touched.current,
                persisted: number | string | null | undefined,
                fallback: number | string | null | undefined
            ) => {
                if (section02Touched.current[field]) {
                    return previous[field];
                }

                return persisted ?? fallback ?? null;
            };

            const initialSection03 = (
                field:
                    | 'dialysisDuration'
                    | 'durationType'
                    | 'bloodFlowRate'
                    | 'dialysateFlowRate'
                    | 'ultrafiltrationGoal'
                    | 'dialysateComposition'
                    | 'sodium'
                    | 'potassium'
                    | 'calcium'
                    | 'dialysisTemperature'
                    | 'heparinDose'
                    | 'anticoagulation'
                    | 'otherAnticoagulation'
                    | 'targetDryWeight',
                persisted: number | string | null | undefined,
                fallback: number | string | null | undefined
            ) => {
                if (section03Touched.current[field]) {
                    return previous[field];
                }

                return persisted ?? fallback ?? null;
            };

            const initialSection05 = (
                field:
                    | 'accessType'
                    | 'accessSite'
                    | 'otherAccessSite'
                    | 'infection'
                    | 'bleeding'
                    | 'thrill'
                    | 'bruit'
                    | 'dressing'
                    | 'catheterCondition',
                persisted: string | boolean | null | undefined,
                fallback: string | boolean | null | undefined
            ) => {
                if (section05Touched.current[field]) {
                    return previous[field];
                }

                return persisted ?? fallback ?? null;
            };

            const initialSection07 = (
                field:
                    | 'postWeight'
                    | 'postBloodPressureSystolic'
                    | 'postBloodPressureDiastolic'
                    | 'postPulse'
                    | 'postTemperature'
                    | 'totalUfRemoved'
                    | 'actualTreatmentDuration'
                    | 'postAccessCondition'
                    | 'disposition'
                    | 'postComplications'
                    | 'patientCondition'
                    | 'targetUf'
                    | 'actualUf'
                    | 'ufDifference',
                persisted: number | string | null | undefined,
                fallback: number | string | null | undefined
            ) => {
                if (section07Touched.current[field]) {
                    return previous[field];
                }

                return persisted ?? fallback ?? null;
            };

            const initialSection08 = (
                field: 'complications' | 'complicationNotes',
                persisted: string[] | string | null | undefined,
                fallback: string[] | string | null
            ) => {
                if (section08Touched.current[field]) {
                    return previous[field];
                }

                return persisted ?? fallback;
            };

            const nextForm = {
                ...previous,
                chairStation: dialysisSession?.chairStation ?? '',
                machine: dialysisSession?.machine ?? '',
                date: dialysisSession?.date ?? null,
                startTime: dialysisSession?.startTime ?? null,
                endTime: dialysisSession?.endTime ?? null,
                shift: dialysisSession?.shift ?? '',
                assignedNurseId: dialysisSession?.assignedNurseId ?? null,
                nephrologistId: dialysisSession?.nephrologistId ?? null,
                preWeight: initialValue(
                    'preWeight',
                    dialysisSession?.preWeight,
                    null
                ) as number | null,
                dryWeight: initialValue(
                    'dryWeight',
                    dialysisSession?.dryWeight,
                    null
                ) as number | null,
                weightGain: initialValue(
                    'weightGain',
                    dialysisSession?.weightGain,
                    null
                ) as number | null,
                interdialyticWeightGain: (() => {
                    const preWeight = initialValue(
                        'preWeight',
                        dialysisSession?.preWeight,
                        null
                    ) as number | null;
                    const dryWeight = initialValue(
                        'dryWeight',
                        dialysisSession?.dryWeight,
                        null
                    ) as number | null;
                    return computeInterdialyticWeightGain(preWeight, dryWeight);
                })(),
                bloodPressureSystolic: initialValue(
                    'bloodPressureSystolic',
                    dialysisSession?.bloodPressureSystolic,
                    null
                ) as number | null,
                bloodPressureDiastolic: initialValue(
                    'bloodPressureDiastolic',
                    dialysisSession?.bloodPressureDiastolic,
                    null
                ) as number | null,
                heartRate: initialValue(
                    'heartRate',
                    dialysisSession?.heartRate,
                    null
                ) as number | null,
                temperature: initialValue(
                    'temperature',
                    dialysisSession?.temperature,
                    null
                ) as number | null,
                respiratoryRate: initialValue(
                    'respiratoryRate',
                    dialysisSession?.respiratoryRate,
                    null
                ) as number | null,
                oxygenSaturation: initialValue(
                    'oxygenSaturation',
                    dialysisSession?.oxygenSaturation,
                    null
                ) as number | null,
                symptoms: initialValue(
                    'symptoms',
                    dialysisSession?.symptoms,
                    ''
                ) as string | null,
                edema: initialValue(
                    'edema',
                    dialysisSession?.edema,
                    null
                ) as string | null,
                preAccessCondition: initialValue(
                    'preAccessCondition',
                    dialysisSession?.preAccessCondition,
                    ''
                ) as string | null,
                generalCondition: initialValue(
                    'generalCondition',
                    dialysisSession?.generalCondition,
                    ''
                ) as string | null,
                dialysisDuration: initialSection03(
                    'dialysisDuration',
                    dialysisSession?.dialysisDuration,
                    null
                ) as number | null,
                durationType: initialSection03(
                    'durationType',
                    dialysisSession?.durationType,
                    ''
                ) as string,
                bloodFlowRate: initialSection03(
                    'bloodFlowRate',
                    dialysisSession?.bloodFlowRate,
                    null
                ) as number | null,
                dialysateFlowRate: initialSection03(
                    'dialysateFlowRate',
                    dialysisSession?.dialysateFlowRate,
                    null
                ) as number | null,
                ultrafiltrationGoal: initialSection03(
                    'ultrafiltrationGoal',
                    dialysisSession?.ultrafiltrationGoal,
                    null
                ) as number | null,
                dialysateComposition: initialSection03(
                    'dialysateComposition',
                    dialysisSession?.dialysateComposition,
                    null
                ) as string | null,
                sodium: initialSection03(
                    'sodium',
                    dialysisSession?.sodium,
                    null
                ) as number | null,
                potassium: initialSection03(
                    'potassium',
                    dialysisSession?.potassium,
                    null
                ) as number | null,
                calcium: initialSection03(
                    'calcium',
                    dialysisSession?.calcium,
                    null
                ) as number | null,
                dialysisTemperature: initialSection03(
                    'dialysisTemperature',
                    dialysisSession?.dialysisTemperature,
                    null
                ) as number | null,
                heparinDose: initialSection03(
                    'heparinDose',
                    dialysisSession?.heparinDose,
                    null
                ) as number | null,
                anticoagulation: initialSection03(
                    'anticoagulation',
                    dialysisSession?.anticoagulation,
                    ''
                ) as string,
                otherAnticoagulation: initialSection03(
                    'otherAnticoagulation',
                    dialysisSession?.anticoagulation === 'OTHER'
                        ? dialysisSession?.otherAnticoagulation
                        : null,
                    null
                ) as string | null,
                targetDryWeight: initialSection03(
                    'targetDryWeight',
                    dialysisSession?.targetDryWeight,
                    null
                ) as number | null,
                accessType: initialSection05(
                    'accessType',
                    dialysisSession?.accessType,
                    null
                ) as string | null,
                accessSite: initialSection05(
                    'accessSite',
                    dialysisSession?.accessSite,
                    null
                ) as string | null,
                otherAccessSite: initialSection05(
                    'otherAccessSite',
                    dialysisSession?.accessSite === 'OTHER'
                        ? dialysisSession?.otherAccessSite
                        : null,
                    null
                ) as string | null,
                infection: initialSection05(
                    'infection',
                    dialysisSession?.infection,
                    null
                ) as boolean | null,
                bleeding: initialSection05(
                    'bleeding',
                    dialysisSession?.bleeding,
                    null
                ) as boolean | null,
                thrill: initialSection05(
                    'thrill',
                    dialysisSession?.thrill,
                    null
                ) as string | null,
                bruit: initialSection05(
                    'bruit',
                    dialysisSession?.bruit,
                    null
                ) as string | null,
                dressing: initialSection05(
                    'dressing',
                    dialysisSession?.dressing,
                    null
                ) as string | null,
                catheterCondition: initialSection05(
                    'catheterCondition',
                    dialysisSession?.catheterCondition,
                    null
                ) as string | null,
                postWeight: initialSection07(
                    'postWeight',
                    dialysisSession?.postWeight,
                    null
                ) as number | null,
                postBloodPressureSystolic: initialSection07(
                    'postBloodPressureSystolic',
                    dialysisSession?.postBloodPressureSystolic,
                    null
                ) as number | null,
                postBloodPressureDiastolic: initialSection07(
                    'postBloodPressureDiastolic',
                    dialysisSession?.postBloodPressureDiastolic,
                    null
                ) as number | null,
                postPulse: initialSection07(
                    'postPulse',
                    dialysisSession?.postPulse,
                    null
                ) as number | null,
                postTemperature: initialSection07(
                    'postTemperature',
                    dialysisSession?.postTemperature,
                    null
                ) as number | null,
                totalUfRemoved: initialSection07(
                    'totalUfRemoved',
                    dialysisSession?.totalUfRemoved,
                    null
                ) as number | null,
                actualTreatmentDuration: initialSection07(
                    'actualTreatmentDuration',
                    dialysisSession?.actualTreatmentDuration,
                    null
                ) as number | null,
                postAccessCondition: initialSection07(
                    'postAccessCondition',
                    dialysisSession?.postAccessCondition,
                    null
                ) as string | null,
                disposition: initialSection07(
                    'disposition',
                    dialysisSession?.disposition,
                    null
                ) as string | null,
                postComplications: initialSection07(
                    'postComplications',
                    dialysisSession?.postComplications,
                    null
                ) as string | null,
                patientCondition: initialSection07(
                    'patientCondition',
                    dialysisSession?.patientCondition,
                    null
                ) as string | null,
                targetUf: initialSection07(
                    'targetUf',
                    dialysisSession?.targetUf,
                    null
                ) as number | null,
                actualUf: initialSection07(
                    'actualUf',
                    dialysisSession?.actualUf,
                    null
                ) as number | null,
                ufDifference: (() => {
                    const targetUf = initialSection07(
                        'targetUf',
                        dialysisSession?.targetUf,
                        null
                    ) as number | null;
                    const actualUf = initialSection07(
                        'actualUf',
                        dialysisSession?.actualUf,
                        null
                    ) as number | null;
                    return computeUfDifference(targetUf, actualUf);
                })(),
                complications: initialSection08(
                    'complications',
                    dialysisSession?.complications,
                    []
                ) as string[],
                complicationNotes: initialSection08(
                    'complicationNotes',
                    dialysisSession?.complicationNotes,
                    null
                ) as string | null
            };

            captureFormBaseline(nextForm);
            return nextForm;
        });

        appliedHydrationKey.current = hydrationKey;

        const restoredPlanId =
            preferredTreatmentPlanId != null && preferredTreatmentPlanId > 0
                ? preferredTreatmentPlanId
                : dialysisSession?.treatmentPlanId != null
                  ? Number(dialysisSession.treatmentPlanId)
                  : selectedTreatmentPlanIdRef.current;

        if (dialysisSession?.id != null) {
            setSelectedTreatmentPlanId(restoredPlanId);
            selectedTreatmentPlanIdRef.current = restoredPlanId;
            setKnownSessionId(Number(dialysisSession.id));
            loadedSessionId.current = Number(dialysisSession.id);
        }

        setSessionHydration({
            patientId: patient.id,
            encounterId: encounter.id,
            sessionId:
                dialysisSession?.id != null
                    ? Number(dialysisSession.id)
                    : null,
            treatmentPlanId: restoredPlanId
        });
    }, [
        section02SourcesReady,
        patient?.id,
        encounter?.id,
        dialysisSession,
        activeSessionId,
        loadingActiveSession,
        activeSessionFailed,
        bootstrapComplete,
        preferredTreatmentPlanId
    ]);

    const handleComplicationChange = (
        complication: string,
        checked: boolean
    ) => {
        setSection08Form(previous => ({
            ...previous,
            complications: checked
                ? previous.complications.includes(complication)
                    ? previous.complications
                    : [...previous.complications, complication]
                : previous.complications.filter(
                    item => item !== complication
                )
        }));
    };

    const displayReadingValue = (
        value: number | string | null | undefined
    ) => {
        if (value === null || value === undefined || value === '') {
            return '-';
        }

        return String(value);
    };

    const displayBloodPressure = (row: DialysisFlowReading) => {
        const hasSystolic =
            row.bloodPressureSystolic !== null &&
            row.bloodPressureSystolic !== undefined;
        const hasDiastolic =
            row.bloodPressureDiastolic !== null &&
            row.bloodPressureDiastolic !== undefined;

        if (hasSystolic && hasDiastolic) {
            return `${row.bloodPressureSystolic}/${row.bloodPressureDiastolic}`;
        }

        if (hasSystolic) {
            return String(row.bloodPressureSystolic);
        }

        if (hasDiastolic) {
            return String(row.bloodPressureDiastolic);
        }

        return '-';
    };

    const handleAddFlowEntry = async () => {
        if (
            sessionFieldsDisabled ||
            creatingFlowReading ||
            deletingFlowReading ||
            savingDialysisSession
        ) {
            return;
        }

        if (!patient?.id || !encounter?.id) {
            return;
        }

        if (!sessionHydrationReady) {
            dispatch(
                notify({
                    msg: 'The dialysis session is still loading.',
                    sev: 'warning'
                })
            );
            return;
        }

        const hasValue = Object.values(flowEntry).some(
            value =>
                value !== null &&
                value !== undefined &&
                String(value).trim() !== ''
        );

        if (!hasValue) {
            return;
        }

        try {
            const hydratedSessionId =
                sessionHydration?.sessionId != null
                    ? Number(sessionHydration.sessionId)
                    : null;
            const currentSessionId =
                dialysisSession?.id != null &&
                    hydratedSessionId === Number(dialysisSession.id)
                    ? Number(dialysisSession.id)
                    : hydratedSessionId != null &&
                        loadedSessionId.current != null &&
                        Number(loadedSessionId.current) === hydratedSessionId
                        ? hydratedSessionId
                        : null;

            const sessionId = currentSessionId
                ? currentSessionId
                : await persistDialysisSession();

            if (!sessionId) {
                dispatch(
                    notify({
                        msg: 'Unable to add a flow reading until the dialysis session is saved.',
                        sev: 'error'
                    })
                );
                return;
            }

            await createDialysisFlowReading({
                dialysisSessionId: sessionId,
                time: flowEntry.time || null,
                bloodPressureSystolic: toInteger(
                    flowEntry.bloodPressureSystolic
                ),
                bloodPressureDiastolic: toInteger(
                    flowEntry.bloodPressureDiastolic
                ),
                pulse: toInteger(flowEntry.pulse),
                ufRate: toMeasurement(flowEntry.ufRate),
                ufRemoved: toMeasurement(flowEntry.ufRemoved),
                arterialPressure: toMeasurement(flowEntry.arterialPressure),
                venousPressure: toMeasurement(flowEntry.venousPressure),
                transmembranePressure: toMeasurement(
                    flowEntry.transmembranePressure
                )
            }).unwrap();

            setFlowEntry(initialFlowEntry);

            dispatch(
                notify({
                    msg: 'Flow Reading Added Successfully',
                    sev: 'success'
                })
            );
        } catch (e: any) {
            dispatch(
                notify({
                    msg:
                        e?.data?.detail ||
                        e?.data?.message ||
                        'Failed to add Flow Reading',
                    sev: 'error'
                })
            );
        }
    };

    const handleDeleteFlowEntry = async (row: DialysisFlowReading) => {
        if (sessionFieldsDisabled || deletingFlowReading || !row.id) {
            return;
        }

        if (
            resolvedActiveSessionId == null ||
            Number(row.dialysisSessionId) !== Number(resolvedActiveSessionId)
        ) {
            dispatch(
                notify({
                    msg: 'This flow reading does not belong to the current dialysis session.',
                    sev: 'error'
                })
            );
            return;
        }

        try {
            await deleteDialysisFlowReading({
                id: row.id,
                dialysisSessionId: resolvedActiveSessionId
            }).unwrap();

            dispatch(
                notify({
                    msg: 'Flow Reading Deleted Successfully',
                    sev: 'success'
                })
            );
        } catch (e: any) {
            dispatch(
                notify({
                    msg:
                        e?.data?.detail ||
                        e?.data?.message ||
                        'Failed to delete Flow Reading',
                    sev: 'error'
                })
            );
        }
    };

    const flowColumns = [
        {
            key: 'time',
            title: <Translate>Time</Translate>,
            minWidth: 110,
            render: (row: DialysisFlowReading) =>
                displayReadingValue(row.time)
        },
        {
            key: 'bloodPressure',
            title: <Translate>Blood Pressure</Translate>,
            minWidth: 150,
            render: (row: DialysisFlowReading) => displayBloodPressure(row)
        },
        {
            key: 'pulse',
            title: <Translate>Pulse</Translate>,
            minWidth: 100,
            render: (row: DialysisFlowReading) =>
                displayReadingValue(row.pulse)
        },
        {
            key: 'ufRate',
            title: <Translate>UF Rate (mL/h)</Translate>,
            minWidth: 120,
            render: (row: DialysisFlowReading) =>
                displayReadingValue(row.ufRate)
        },
        {
            key: 'ufRemoved',
            title: <Translate>UF Removed (mL)</Translate>,
            minWidth: 130,
            render: (row: DialysisFlowReading) =>
                displayReadingValue(row.ufRemoved)
        },
        {
            key: 'arterialPressure',
            title: <Translate>AP (mmHg)</Translate>,
            minWidth: 100,
            render: (row: DialysisFlowReading) =>
                displayReadingValue(row.arterialPressure)
        },
        {
            key: 'venousPressure',
            title: <Translate>VP (mmHg)</Translate>,
            minWidth: 100,
            render: (row: DialysisFlowReading) =>
                displayReadingValue(row.venousPressure)
        },
        {
            key: 'transmembranePressure',
            title: <Translate>TMP (mmHg)</Translate>,
            minWidth: 110,
            render: (row: DialysisFlowReading) =>
                displayReadingValue(row.transmembranePressure)
        },
        {
            key: 'actions',
            title: <Translate>Actions</Translate>,
            minWidth: 100,
            render: (row: DialysisFlowReading) =>
                sessionFieldsDisabled ? null : (
                    <MyButton
                        onClick={() => handleDeleteFlowEntry(row)}
                    >
                        <Translate>Delete</Translate>
                    </MyButton>
                )
        }
    ];

    const handleAddMedication = async () => {
        if (
            sessionFieldsDisabled ||
            creatingDialysisMedication ||
            deletingDialysisMedication ||
            savingDialysisSession
        ) {
            return;
        }

        if (!patient?.id || !encounter?.id) {
            return;
        }

        if (!sessionHydrationReady) {
            dispatch(
                notify({
                    msg: 'The dialysis session is still loading.',
                    sev: 'warning'
                })
            );
            return;
        }

        if (
            form.activeIngredientId === null ||
            form.activeIngredientId === undefined
        ) {
            return;
        }

        try {
            const hydratedSessionId =
                sessionHydration?.sessionId != null
                    ? Number(sessionHydration.sessionId)
                    : null;
            const currentSessionId =
                dialysisSession?.id != null &&
                    hydratedSessionId === Number(dialysisSession.id)
                    ? Number(dialysisSession.id)
                    : hydratedSessionId != null &&
                        loadedSessionId.current != null &&
                        Number(loadedSessionId.current) === hydratedSessionId
                        ? hydratedSessionId
                        : null;

            const sessionId = currentSessionId
                ? currentSessionId
                : await persistDialysisSession();

            if (!sessionId) {
                dispatch(
                    notify({
                        msg: 'Unable to add a medication until the dialysis session is saved.',
                        sev: 'error'
                    })
                );
                return;
            }

            await createDialysisMedication({
                dialysisSessionId: sessionId,
                activeIngredientId: Number(form.activeIngredientId),
                dose: toInteger(form.dose),
                doseUnit: form.doseUnit?.trim() || null
            }).unwrap();

            setForm(previous => ({
                ...previous,
                activeIngredientId: null,
                dose: null,
                doseUnit: null
            }));

            dispatch(
                notify({
                    msg: 'Medication Added Successfully',
                    sev: 'success'
                })
            );
        } catch (e: any) {
            dispatch(
                notify({
                    msg:
                        e?.data?.detail ||
                        e?.data?.message ||
                        'Failed to add Medication',
                    sev: 'error'
                })
            );
        }
    };

    const handleDeleteMedication = async (row: DialysisMedication) => {
        if (sessionFieldsDisabled || deletingDialysisMedication || !row.id) {
            return;
        }

        if (
            resolvedActiveSessionId == null ||
            Number(row.dialysisSessionId) !== Number(resolvedActiveSessionId)
        ) {
            dispatch(
                notify({
                    msg: 'This medication does not belong to the current dialysis session.',
                    sev: 'error'
                })
            );
            return;
        }

        try {
            await deleteDialysisMedication({
                id: row.id,
                dialysisSessionId: resolvedActiveSessionId
            }).unwrap();

            dispatch(
                notify({
                    msg: 'Medication Deleted Successfully',
                    sev: 'success'
                })
            );
        } catch (e: any) {
            dispatch(
                notify({
                    msg:
                        e?.data?.detail ||
                        e?.data?.message ||
                        'Failed to delete Medication',
                    sev: 'error'
                })
            );
        }
    };

    const medicationColumns = [
        {
            key: 'medicationName',
            title: <Translate>Medication Name</Translate>,
            minWidth: 220,
            render: (row: DialysisMedication) =>
                activeIngredientMap[row.activeIngredientId]?.name || '-'
        },
        {
            key: 'dose',
            title: <Translate>Dose</Translate>,
            minWidth: 130,
            render: (row: DialysisMedication) =>
                row.dose === null || row.dose === undefined
                    ? '-'
                    : String(row.dose)
        },
        {
            key: 'doseUnit',
            title: <Translate>UOM</Translate>,
            minWidth: 130,
            render: (row: DialysisMedication) => {
                if (!row.doseUnit) {
                    return '-';
                }

                return unitMap[String(row.doseUnit)] || row.doseUnit;
            }
        },
        {
            key: 'actions',
            title: <Translate>Actions</Translate>,
            minWidth: 100,
            render: (row: DialysisMedication) =>
                sessionFieldsDisabled ? null : (
                    <MyButton
                        onClick={() => handleDeleteMedication(row)}
                    >
                        <Translate>Delete</Translate>
                    </MyButton>
                )
        }
    ];

    const direction =
        localStorage.getItem('direction')?.toLowerCase() === 'rtl'
            ? 'rtl'
            : 'ltr';

    return (
        <div className="dialysis-session" dir={direction}>
            <div className="dialysis-session-sections">
                <div className="dialysis-session-section">
                            {planRequired && (
                                <Message
                                    type="warning"
                                    className="dialysis-session-plan-required"
                                >
                                    <Translate>
                                        Please select a Treatment Plan to
                                        continue.
                                    </Translate>
                                </Message>
                            )}

                            <DialysisPatientRegistration
                                patientId={patient?.id}
                                selectedTreatmentPlanId={
                                    selectedTreatmentPlanId
                                }
                                onSelectTreatmentPlan={
                                    handleSelectTreatmentPlan
                                }
                                selectionDisabled={
                                    disabled ||
                                    savingDialysisSession ||
                                    planSwitchLoading
                                }
                            />
                        </div>

                <div className="dialysis-session-section">
                    <SectionContainer
                        collapsible={true}
                        defaultCollapsed={false}
                        title={
                            <div className="dialysis-session-section-title">
                                <span className="dialysis-session-section-index">
                                    01
                                </span>

                                <div className="dialysis-session-section-heading">
                                    <Translate>
                                        Dialysis Session Information
                                    </Translate>

                                    <span className="dialysis-session-section-description">
                                        Session, station and clinical assignment information
                                    </span>
                                </div>
                            </div>
                        }
                        action={
                            <MyButton
                                size="small"
                                onClick={saveDialysisSession}
                                disabled={
                                    sessionFieldsDisabled ||
                                    savingDialysisSession ||
                                    !sessionHydrationReady
                                }
                            >
                                {savingDialysisSession ? (
                                    <Translate>Saving...</Translate>
                                ) : (
                                    <Translate>Save</Translate>
                                )}
                            </MyButton>
                        }
                        content={
                            <>
                                <Form fluid>
                                    <div className="dialysis-session-content">

                                        <div className="dialysis-session-group">
                                            <div className="dialysis-session-group-header">
                                                <span className="dialysis-session-group-title">
                                                    <Translate>Session Details</Translate>
                                                </span>

                                                <div className="dialysis-session-group-line" />
                                            </div>

                                            <div className="dialysis-session-row">
                                                <div className="dialysis-session-field">
                                                    <MyInput
                                                        width="100%"
                                                        fieldName="chairStation"
                                                        fieldLabel="Chair / Station"
                                                        fieldType="text"
                                                        record={form}
                                                        setRecord={setForm}
                                                        disabled={sessionFieldsDisabled}
                                                    />
                                                </div>

                                                <div className="dialysis-session-field">
                                                    <MyInput
                                                        width="100%"
                                                        fieldName="machine"
                                                        fieldLabel="Machine"
                                                        fieldType="text"
                                                        record={form}
                                                        setRecord={setForm}
                                                        disabled={sessionFieldsDisabled}
                                                    />
                                                </div>

                                                <div className="dialysis-session-field">
                                                    <MyDateHijriInput
                                                        fieldName="date"
                                                        fieldLabel="Date"
                                                        record={form}
                                                        setRecord={setForm}
                                                        disabled={sessionFieldsDisabled}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="dialysis-session-group">
                                            <div className="dialysis-session-group-header">
                                                <span className="dialysis-session-group-title">
                                                    <Translate>Session Time</Translate>
                                                </span>

                                                <div className="dialysis-session-group-line" />
                                            </div>

                                            <div className="dialysis-session-row">
                                                <div className="dialysis-session-field">
                                                    <MyInput
                                                        width="100%"
                                                        fieldName="startTime"
                                                        fieldLabel="Start Time"
                                                        fieldType="time"
                                                        record={form}
                                                        setRecord={setForm}
                                                        disabled={sessionFieldsDisabled}
                                                    />
                                                </div>

                                                <div className="dialysis-session-field">
                                                    <MyInput
                                                        width="100%"
                                                        fieldName="endTime"
                                                        fieldLabel="End Time"
                                                        fieldType="time"
                                                        record={form}
                                                        setRecord={setForm}
                                                        disabled={sessionFieldsDisabled}
                                                    />
                                                </div>

                                                <div className="dialysis-session-field">
                                                    <MyInput
                                                        width="100%"
                                                        fieldName="shift"
                                                        fieldLabel="Shift"
                                                        fieldType="select"
                                                        selectData={shiftOptions}
                                                        selectDataLabel="label"
                                                        selectDataValue="value"
                                                        searchable={false}
                                                        record={form}
                                                        setRecord={setForm}
                                                        disabled={sessionFieldsDisabled}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="dialysis-session-group">
                                            <div className="dialysis-session-group-header">
                                                <span className="dialysis-session-group-title">
                                                    <Translate>Clinical Assignment</Translate>
                                                </span>

                                                <div className="dialysis-session-group-line" />
                                            </div>

                                            <div className="dialysis-session-row">
                                                <div className="dialysis-session-field">
                                                    <MyInput
                                                        width="100%"
                                                        fieldName="assignedNurseId"
                                                        fieldLabel="Assigned Nurse"
                                                        fieldType="select"
                                                        selectData={nurses}
                                                        selectDataLabel={['firstName', 'lastName']}
                                                        selectDataValue="id"
                                                        searchable
                                                        loading={loadingNurses}
                                                        record={form}
                                                        setRecord={setForm}
                                                        disabled={sessionFieldsDisabled}
                                                    />

                                                    {nurseError && (
                                                        <Message type="error">
                                                            <Translate>
                                                                Unable to load nurses.
                                                            </Translate>
                                                        </Message>
                                                    )}
                                                </div>

                                                <div className="dialysis-session-field">
                                                    <MyInput
                                                        width="100%"
                                                        fieldName="nephrologistId"
                                                        fieldLabel="Nephrologist"
                                                        fieldType="select"
                                                        selectData={physicians}
                                                        selectDataLabel={['firstName', 'lastName']}
                                                        selectDataValue="id"
                                                        searchable
                                                        loading={loadingPractitioners}
                                                        record={form}
                                                        setRecord={setForm}
                                                        disabled={sessionFieldsDisabled}
                                                    />

                                                    {practitionerError && (
                                                        <Message type="error">
                                                            <Translate>
                                                                Unable to load doctors.
                                                            </Translate>
                                                        </Message>
                                                    )}
                                                </div>

                                                <div className="dialysis-session-field dialysis-session-field--empty" />
                                            </div>
                                        </div>

                                    </div>
                                </Form>
                            </>
                        }
                    />
                </div>

                <div className="dialysis-session-section">
                    <SectionContainer
                        collapsible={true}
                        defaultCollapsed={false}
                        title={
                            <div className="dialysis-session-section-title">
                                <span className="dialysis-session-section-index">
                                    02
                                </span>

                                <div className="dialysis-session-section-heading">
                                    <Translate>
                                        Pre-Dialysis Assessment
                                    </Translate>

                                    <span className="dialysis-session-section-description">
                                        Patient condition before starting dialysis
                                    </span>
                                </div>
                            </div>
                        }
                        action={
                            <MyButton
                                size="small"
                                onClick={savePreDialysisAssessment}
                                disabled={
                                    sessionFieldsDisabled ||
                                    savingDialysisSession ||
                                    !sessionHydrationReady
                                }
                            >
                                {savingDialysisSession ? (
                                    <Translate>Saving...</Translate>
                                ) : (
                                    <Translate>Save</Translate>
                                )}
                            </MyButton>
                        }
                        content={
                            <Form fluid>
                                <div className="dialysis-session-content">

                                    <div className="dialysis-session-group">
                                        <div className="dialysis-session-group-header">
                                            <span className="dialysis-session-group-title">
                                                <Translate>
                                                    Weight Assessment
                                                </Translate>
                                            </span>

                                            <div className="dialysis-session-group-line" />
                                        </div>

                                        <div className="dialysis-session-row">
                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="preWeight"
                                                    fieldLabel="Pre Weight"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="kg"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>
                                        </div>

                                        <div className="dialysis-session-row dialysis-session-row--spaced">
                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="dryWeight"
                                                    fieldLabel="Dry Weight"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="kg"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="weightGain"
                                                    fieldLabel="Reported Weight Gain"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="kg"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="interdialyticWeightGain"
                                                    fieldLabel="Interdialytic Weight Gain (Pre − Dry)"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="kg"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={() => undefined}
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="dialysis-session-group">
                                        <div className="dialysis-session-group-header">
                                            <span className="dialysis-session-group-title">
                                                <Translate>Vital Signs</Translate>
                                            </span>

                                            <div className="dialysis-session-group-line" />
                                        </div>

                                        <div className="dialysis-session-row">
                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="bloodPressureSystolic"
                                                    fieldLabel="Pre BP Systolic"
                                                    fieldType="number"
                                                    showZero
                                                    rightAddon="mmHg"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="bloodPressureDiastolic"
                                                    fieldLabel="Pre BP Diastolic"
                                                    fieldType="number"
                                                    showZero
                                                    rightAddon="mmHg"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="heartRate"
                                                    fieldLabel="Heart Rate"
                                                    fieldType="number"
                                                    showZero
                                                    rightAddon="bpm"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="temperature"
                                                    fieldLabel="Temperature"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="°C"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="respiratoryRate"
                                                    fieldLabel="Respiratory Rate"
                                                    fieldType="number"
                                                    showZero
                                                    rightAddon="breaths/min"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="oxygenSaturation"
                                                    fieldLabel="Oxygen Saturation"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="%"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="dialysis-session-group">
                                        <div className="dialysis-session-group-header">
                                            <span className="dialysis-session-group-title">
                                                <Translate>
                                                    Clinical Condition
                                                </Translate>
                                            </span>

                                            <div className="dialysis-session-group-line" />
                                        </div>

                                        <div className="dialysis-session-row">
                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="symptoms"
                                                    fieldLabel="Symptoms"
                                                    fieldType="textarea"
                                                    rows={3}
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="edema"
                                                    fieldLabel="Edema"
                                                    fieldType="text"
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="preAccessCondition"
                                                    fieldLabel="Access Condition"
                                                    fieldType="textarea"
                                                    rows={3}
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="generalCondition"
                                                    fieldLabel="General Condition"
                                                    fieldType="textarea"
                                                    rows={3}
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </Form>
                        }
                    />
                </div>

                <div className="dialysis-session-section">
                    <SectionContainer
                        collapsible={true}
                        defaultCollapsed={false}
                        title={
                            <div className="dialysis-session-section-title">
                                <span className="dialysis-session-section-index">
                                    03
                                </span>

                                <div className="dialysis-session-section-heading">
                                    <Translate>
                                        Dialysis Prescription
                                    </Translate>

                                    <span className="dialysis-session-section-description">
                                        Dialysis treatment parameters and prescription
                                    </span>
                                </div>
                            </div>
                        }
                        action={
                            <MyButton
                                size="small"
                                onClick={saveDialysisPrescription}
                                disabled={
                                    sessionFieldsDisabled ||
                                    savingDialysisSession ||
                                    !sessionHydrationReady
                                }
                            >
                                {savingDialysisSession ? (
                                    <Translate>Saving...</Translate>
                                ) : (
                                    <Translate>Save</Translate>
                                )}
                            </MyButton>
                        }
                        content={
                            <Form fluid>
                                <div className="dialysis-session-content">

                                    <div className="dialysis-session-group">
                                        <div className="dialysis-session-group-header">
                                            <span className="dialysis-session-group-title">
                                                <Translate>
                                                    Treatment Parameters
                                                </Translate>
                                            </span>

                                            <div className="dialysis-session-group-line" />
                                        </div>

                                        <div className="dialysis-session-row">
                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="dialysisDuration"
                                                    fieldLabel="Dialysis Duration"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="durationType"
                                                    fieldLabel="Duration Type"
                                                    fieldType="select"
                                                    selectData={durationTypeOptions}
                                                    selectDataLabel="label"
                                                    selectDataValue="value"
                                                    searchable={false}
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="bloodFlowRate"
                                                    fieldLabel="Blood Flow Rate"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="mL/min"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="dialysateFlowRate"
                                                    fieldLabel="Dialysate Flow Rate"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="mL/min"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="ultrafiltrationGoal"
                                                    fieldLabel="Ultrafiltration Goal"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="L"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="dialysis-session-group">
                                        <div className="dialysis-session-group-header">
                                            <span className="dialysis-session-group-title">
                                                <Translate>
                                                    Dialysate Prescription
                                                </Translate>
                                            </span>

                                            <div className="dialysis-session-group-line" />
                                        </div>

                                        <Message
                                            type="info"
                                            showIcon
                                            className="dialysis-session-serum-dialysate-note"
                                        >
                                            <Translate>
                                                Enter dialysate bath values only.
                                                Blood lab results below each field
                                                are serum reference and must not be
                                                copied into the prescription.
                                            </Translate>
                                        </Message>

                                        <div className="dialysis-session-row">
                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="dialysateComposition"
                                                    fieldLabel="Dialysate Composition (free text)"
                                                    fieldType="text"
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="sodium"
                                                    fieldLabel="Dialysate Sodium"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="mmol/L"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                                {renderBloodLabReference('sodium')}
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="potassium"
                                                    fieldLabel="Dialysate Potassium"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="mmol/L"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                                {renderBloodLabReference('potassium')}
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="calcium"
                                                    fieldLabel="Dialysate Calcium"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="mmol/L"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                                {renderBloodLabReference('calcium')}
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="dialysisTemperature"
                                                    fieldLabel="Temperature"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="°C"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="dialysis-session-group">
                                        <div className="dialysis-session-group-header">
                                            <span className="dialysis-session-group-title">
                                                <Translate>
                                                    Anticoagulation & Target
                                                </Translate>
                                            </span>

                                            <div className="dialysis-session-group-line" />
                                        </div>

                                        <div className="dialysis-session-row">
                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="heparinDose"
                                                    fieldLabel="Heparin Dose"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="IU"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="anticoagulation"
                                                    fieldLabel="Anticoagulation Type"
                                                    fieldType="select"
                                                    selectData={dialysisAnticoagulationOptions}
                                                    selectDataLabel="label"
                                                    selectDataValue="value"
                                                    searchable={false}
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            {form.anticoagulation === 'OTHER' && (
                                                <div className="dialysis-session-field">
                                                    <MyInput
                                                        width="100%"
                                                        fieldName="otherAnticoagulation"
                                                        fieldLabel="Other Anticoagulation"
                                                        fieldType="text"
                                                        record={form}
                                                        setRecord={setSection03Form}
                                                        disabled={sessionFieldsDisabled}
                                                    />
                                                </div>
                                            )}

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="targetDryWeight"
                                                    fieldLabel="Target Dry Weight"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="kg"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </Form>
                        }
                    />
                </div>

                <div className="dialysis-session-section">
                    <SectionContainer
                        collapsible={true}
                        defaultCollapsed={false}
                        title={
                            <div className="dialysis-session-section-title">
                                <span className="dialysis-session-section-index">
                                    04
                                </span>

                                <div className="dialysis-session-section-heading">
                                    <Translate>
                                        Dialysis Flow Sheet
                                    </Translate>

                                    <span className="dialysis-session-section-description">
                                        Intra-dialysis monitoring — chart BP drops
                                        and interventions as they occur
                                    </span>
                                </div>
                            </div>
                        }
                        content={
                            <div className="dialysis-session-content">
                                <Message
                                    type="info"
                                    showIcon
                                    className="dialysis-session-flow-note"
                                >
                                    <Translate>
                                        For intradialytic events (e.g. hypotension),
                                        add a timed reading here and record the
                                        intervention in Complications notes
                                        (Section 08) without waiting until post.
                                    </Translate>
                                </Message>

                                <div className="dialysis-session-pressure-legend">
                                    <span>
                                        <Translate>AP</Translate>
                                        {' = '}
                                        <Translate>Arterial Pressure</Translate>
                                    </span>
                                    <span>
                                        <Translate>VP</Translate>
                                        {' = '}
                                        <Translate>Venous Pressure</Translate>
                                    </span>
                                    <span>
                                        <Translate>TMP</Translate>
                                        {' = '}
                                        <Translate>Transmembrane Pressure</Translate>
                                    </span>
                                </div>

                                <Form fluid>
                                    <div className="dialysis-session-row">
                                        <div className="dialysis-session-field">
                                            <MyInput
                                                width="100%"
                                                fieldName="time"
                                                fieldLabel="Time"
                                                fieldType="time"
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={sessionFieldsDisabled}
                                            />
                                        </div>

                                        <div className="dialysis-session-field dialysis-session-field--addon">
                                            <MyInput
                                                width="100%"
                                                fieldName="bloodPressureSystolic"
                                                fieldLabel="Intradialytic BP Systolic"
                                                fieldType="number"
                                                showZero
                                                rightAddon="mmHg"
                                                rightAddonwidth="auto"
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={sessionFieldsDisabled}
                                            />
                                        </div>

                                        <div className="dialysis-session-field dialysis-session-field--addon">
                                            <MyInput
                                                width="100%"
                                                fieldName="bloodPressureDiastolic"
                                                fieldLabel="Intradialytic BP Diastolic"
                                                fieldType="number"
                                                showZero
                                                rightAddon="mmHg"
                                                rightAddonwidth="auto"
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={sessionFieldsDisabled}
                                            />
                                        </div>

                                        <div className="dialysis-session-field dialysis-session-field--addon">
                                            <MyInput
                                                width="100%"
                                                fieldName="pulse"
                                                fieldLabel="Pulse"
                                                fieldType="number"
                                                showZero
                                                rightAddon="bpm"
                                                rightAddonwidth="auto"
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={sessionFieldsDisabled}
                                            />
                                        </div>
                                    </div>

                                    <div className="dialysis-session-row dialysis-session-row--spaced">
                                        <div className="dialysis-session-field dialysis-session-field--addon">
                                            <MyInput
                                                width="100%"
                                                fieldName="ufRate"
                                                fieldLabel="UF Rate"
                                                fieldType="number"
                                                allowDecimal
                                                showZero
                                                rightAddon="mL/h"
                                                rightAddonwidth="auto"
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={sessionFieldsDisabled}
                                            />
                                        </div>

                                        <div className="dialysis-session-field dialysis-session-field--addon">
                                            <MyInput
                                                width="100%"
                                                fieldName="ufRemoved"
                                                fieldLabel="UF Removed"
                                                fieldType="number"
                                                allowDecimal
                                                showZero
                                                rightAddon="mL"
                                                rightAddonwidth="auto"
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={sessionFieldsDisabled}
                                            />
                                        </div>

                                        <div className="dialysis-session-field dialysis-session-field--addon">
                                            <MyInput
                                                width="100%"
                                                fieldName="arterialPressure"
                                                fieldLabel="AP (Arterial)"
                                                fieldType="number"
                                                allowDecimal
                                                allowNegative
                                                showZero
                                                rightAddon="mmHg"
                                                rightAddonwidth="auto"
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={sessionFieldsDisabled}
                                            />
                                        </div>

                                        <div className="dialysis-session-field dialysis-session-field--addon">
                                            <MyInput
                                                width="100%"
                                                fieldName="venousPressure"
                                                fieldLabel="VP (Venous)"
                                                fieldType="number"
                                                allowDecimal
                                                allowNegative
                                                showZero
                                                rightAddon="mmHg"
                                                rightAddonwidth="auto"
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={sessionFieldsDisabled}
                                            />
                                        </div>
                                    </div>

                                    <div className="dialysis-session-row dialysis-session-row--spaced">
                                        <div className="dialysis-session-field dialysis-session-field--addon">
                                            <MyInput
                                                width="100%"
                                                fieldName="transmembranePressure"
                                                fieldLabel="TMP (Transmembrane)"
                                                fieldType="number"
                                                allowDecimal
                                                allowNegative
                                                showZero
                                                rightAddon="mmHg"
                                                rightAddonwidth="auto"
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={sessionFieldsDisabled}
                                            />
                                        </div>
                                    </div>
                                </Form>

                                {!disabled && (
                                    <div className="dialysis-session-actions">
                                        <MyButton
                                            onClick={handleAddFlowEntry}
                                            disabled={
                                                sessionFieldsDisabled ||
                                                !sessionHydrationReady ||
                                                savingDialysisSession ||
                                                creatingFlowReading ||
                                                deletingFlowReading
                                            }
                                        >
                                            <Translate>Add Reading</Translate>
                                        </MyButton>
                                    </div>
                                )}

                                <div className="dialysis-session-table">
                                    <MyTable
                                        data={flowReadings}
                                        columns={flowColumns}
                                        loading={loadingFlowReadings}
                                    />
                                </div>
                            </div>
                        }
                    />
                </div>

                <div className="dialysis-session-section">
                    <SectionContainer
                        collapsible={true}
                        defaultCollapsed={false}
                        title={
                            <div className="dialysis-session-section-title">
                                <span className="dialysis-session-section-index">
                                    05
                                </span>

                                <div className="dialysis-session-section-heading">
                                    <Translate>
                                        Dialysis Access Management
                                    </Translate>

                                    <span className="dialysis-session-section-description">
                                        Complete at pre-connect / cannulation — before
                                        starting the flow sheet
                                    </span>
                                </div>
                            </div>
                        }
                        action={
                            <MyButton
                                size="small"
                                onClick={saveDialysisAccess}
                                disabled={
                                    sessionFieldsDisabled ||
                                    savingDialysisSession ||
                                    !sessionHydrationReady
                                }
                            >
                                {savingDialysisSession ? (
                                    <Translate>Saving...</Translate>
                                ) : (
                                    <Translate>Save</Translate>
                                )}
                            </MyButton>
                        }
                        content={
                            <Form fluid>
                                <div className="dialysis-session-content">

                                    <div className="dialysis-session-group">
                                        <div className="dialysis-session-group-header">
                                            <span className="dialysis-session-group-title">
                                                <Translate>Access Details</Translate>
                                            </span>

                                            <div className="dialysis-session-group-line" />
                                        </div>

                                        <div className="dialysis-session-row">
                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="accessType"
                                                    fieldLabel="Access Type"
                                                    fieldType="select"
                                                    selectData={dialysisAccessTypeOptions}
                                                    selectDataLabel="label"
                                                    selectDataValue="value"
                                                    searchable={false}
                                                    record={form}
                                                    setRecord={setSection05Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="accessSite"
                                                    fieldLabel="Site"
                                                    fieldType="select"
                                                    selectData={dialysisAccessSiteOptions}
                                                    selectDataLabel="label"
                                                    selectDataValue="value"
                                                    searchable={false}
                                                    record={form}
                                                    setRecord={setSection05Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            {form.accessSite === 'OTHER' && (
                                                <div className="dialysis-session-field">
                                                    <MyInput
                                                        width="100%"
                                                        fieldName="otherAccessSite"
                                                        fieldLabel="Other Access Site"
                                                        fieldType="text"
                                                        record={form}
                                                        setRecord={setSection05Form}
                                                        disabled={sessionFieldsDisabled}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="dialysis-session-group">
                                        <div className="dialysis-session-group-header">
                                            <span className="dialysis-session-group-title">
                                                <Translate>
                                                    Access Assessment
                                                </Translate>
                                            </span>

                                            <div className="dialysis-session-group-line" />
                                        </div>

                                        <div className="dialysis-session-row">
                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="infection"
                                                    fieldLabel="Infection"
                                                    fieldType="select"
                                                    selectData={booleanYesNoOptions}
                                                    selectDataLabel="label"
                                                    selectDataValue="value"
                                                    searchable={false}
                                                    record={form}
                                                    setRecord={setSection05Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="bleeding"
                                                    fieldLabel="Bleeding"
                                                    fieldType="select"
                                                    selectData={booleanYesNoOptions}
                                                    selectDataLabel="label"
                                                    selectDataValue="value"
                                                    searchable={false}
                                                    record={form}
                                                    setRecord={setSection05Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="thrill"
                                                    fieldLabel="Thrill"
                                                    fieldType="text"
                                                    record={form}
                                                    setRecord={setSection05Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="bruit"
                                                    fieldLabel="Bruit"
                                                    fieldType="text"
                                                    record={form}
                                                    setRecord={setSection05Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>
                                        </div>

                                        <div className="dialysis-session-row dialysis-session-row--spaced">
                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="dressing"
                                                    fieldLabel="Dressing"
                                                    fieldType="text"
                                                    record={form}
                                                    setRecord={setSection05Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="catheterCondition"
                                                    fieldLabel="Catheter Condition"
                                                    fieldType="text"
                                                    record={form}
                                                    setRecord={setSection05Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </Form>
                        }
                    />
                </div>

                <div className="dialysis-session-section">
                    <SectionContainer
                        collapsible={true}
                        defaultCollapsed={false}
                        title={
                            <div className="dialysis-session-section-title">
                                <span className="dialysis-session-section-index">
                                    06
                                </span>

                                <div className="dialysis-session-section-heading">
                                    <Translate>
                                        Medication During Dialysis
                                    </Translate>

                                    <span className="dialysis-session-section-description">
                                        Medications administered during the dialysis session
                                    </span>
                                </div>
                            </div>
                        }
                        content={
                            <div className="dialysis-session-content">
                                <Form fluid>
                                    <div className="dialysis-session-row">
                                        <div className="dialysis-session-field">
                                            <MyInput
                                                width="100%"
                                                fieldName="activeIngredientId"
                                                fieldLabel="Medication Name"
                                                fieldType="select"
                                                selectData={activeIngredients}
                                                selectDataLabel="name"
                                                selectDataValue="id"
                                                searchable={true}
                                                record={form}
                                                setRecord={setForm}
                                                disabled={sessionFieldsDisabled}
                                            />
                                        </div>

                                        <div className="dialysis-session-field">
                                            <MyInput
                                                width="100%"
                                                fieldName="dose"
                                                fieldLabel="Dose"
                                                fieldType="number"
                                                showZero
                                                record={form}
                                                setRecord={setForm}
                                                disabled={sessionFieldsDisabled}
                                            />
                                        </div>

                                        <div className="dialysis-session-field">
                                            <MyInput
                                                width="100%"
                                                fieldName="doseUnit"
                                                fieldLabel="UOM"
                                                fieldType="select"
                                                selectData={unitLov?.object || []}
                                                selectDataLabel="lovDisplayVale"
                                                selectDataValue="key"
                                                disableByField="isValid"
                                                searchable={true}
                                                record={form}
                                                setRecord={setForm}
                                                disabled={sessionFieldsDisabled}
                                            />
                                        </div>
                                    </div>
                                </Form>

                                {!disabled && (
                                    <div className="dialysis-session-actions">
                                        <MyButton
                                            onClick={handleAddMedication}
                                            disabled={
                                                sessionFieldsDisabled ||
                                                !sessionHydrationReady ||
                                                savingDialysisSession ||
                                                creatingDialysisMedication ||
                                                deletingDialysisMedication
                                            }
                                        >
                                            <Translate>Add Medication</Translate>
                                        </MyButton>
                                    </div>
                                )}

                                <div className="dialysis-session-table">
                                    <MyTable
                                        data={dialysisMedications}
                                        columns={medicationColumns}
                                        loading={loadingDialysisMedications}
                                    />
                                </div>
                            </div>
                        }
                    />
                </div>

                <div className="dialysis-session-section">
                    <SectionContainer
                        collapsible={true}
                        defaultCollapsed={false}
                        title={
                            <div className="dialysis-session-section-title">
                                <span className="dialysis-session-section-index">
                                    07
                                </span>

                                <div className="dialysis-session-section-heading">
                                    <Translate>
                                        Post-Dialysis Assessment
                                    </Translate>

                                    <span className="dialysis-session-section-description">
                                        Patient condition and treatment outcome after dialysis
                                    </span>
                                </div>
                            </div>
                        }
                        action={
                            <MyButton
                                size="small"
                                onClick={savePostDialysisAssessment}
                                disabled={
                                    sessionFieldsDisabled ||
                                    savingDialysisSession ||
                                    !sessionHydrationReady
                                }
                            >
                                {savingDialysisSession ? (
                                    <Translate>Saving...</Translate>
                                ) : (
                                    <Translate>Save</Translate>
                                )}
                            </MyButton>
                        }
                        content={
                            <Form fluid>
                                <div className="dialysis-session-content">

                                    <div className="dialysis-session-group">
                                        <div className="dialysis-session-group-header">
                                            <span className="dialysis-session-group-title">
                                                <Translate>
                                                    Post Treatment Measurements
                                                </Translate>
                                            </span>

                                            <div className="dialysis-session-group-line" />
                                        </div>

                                        <div className="dialysis-session-row">
                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="postWeight"
                                                    fieldLabel="Post Weight"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="kg"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="postBloodPressureSystolic"
                                                    fieldLabel="Post BP Systolic"
                                                    fieldType="number"
                                                    showZero
                                                    rightAddon="mmHg"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="postBloodPressureDiastolic"
                                                    fieldLabel="Post BP Diastolic"
                                                    fieldType="number"
                                                    showZero
                                                    rightAddon="mmHg"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="postPulse"
                                                    fieldLabel="Pulse"
                                                    fieldType="number"
                                                    showZero
                                                    rightAddon="bpm"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="postTemperature"
                                                    fieldLabel="Temperature"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="°C"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="dialysis-session-group">
                                        <div className="dialysis-session-group-header">
                                            <span className="dialysis-session-group-title">
                                                <Translate>
                                                    Treatment Outcome
                                                </Translate>
                                            </span>

                                            <div className="dialysis-session-group-line" />
                                        </div>

                                        <div className="dialysis-session-row">
                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="totalUfRemoved"
                                                    fieldLabel="Total UF Removed"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="L"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="actualTreatmentDuration"
                                                    fieldLabel="Treatment Duration"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="h"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="postAccessCondition"
                                                    fieldLabel="Access Condition"
                                                    fieldType="text"
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="disposition"
                                                    fieldLabel="Disposition"
                                                    fieldType="select"
                                                    selectData={dialysisDispositionOptions}
                                                    selectDataLabel="label"
                                                    selectDataValue="value"
                                                    searchable={false}
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>
                                        </div>

                                        <div className="dialysis-session-row dialysis-session-row--spaced">
                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="postComplications"
                                                    fieldLabel="Post Complications Summary"
                                                    fieldType="textarea"
                                                    rows={3}
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="patientCondition"
                                                    fieldLabel="Patient Condition"
                                                    fieldType="textarea"
                                                    rows={3}
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="dialysis-session-group">
                                        <div className="dialysis-session-group-header">
                                            <span className="dialysis-session-group-title">
                                                <Translate>
                                                    Actual UF vs Target UF
                                                </Translate>
                                            </span>

                                            <div className="dialysis-session-group-line" />
                                        </div>

                                        <div className="dialysis-session-row">
                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="targetUf"
                                                    fieldLabel="Target UF"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="L"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="actualUf"
                                                    fieldLabel="Actual UF"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    rightAddon="L"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field dialysis-session-field--addon">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="ufDifference"
                                                    fieldLabel="Difference (Actual − Target)"
                                                    fieldType="number"
                                                    allowDecimal
                                                    allowNegative
                                                    showZero
                                                    rightAddon="L"
                                                    rightAddonwidth="auto"
                                                    record={form}
                                                    setRecord={() => undefined}
                                                    disabled
                                                />
                                            </div>
                                        </div>

                                        {ufWeightLossMismatch ? (
                                            <Message
                                                type="warning"
                                                showIcon
                                                className="dialysis-session-uf-warning"
                                            >
                                                <Translate>
                                                    UF vs weight-loss check:
                                                </Translate>{' '}
                                                <Translate>
                                                    Pre−Post weight loss
                                                </Translate>
                                                {` (${ufWeightLossMismatch.weightLossKg} kg) `}
                                                <Translate>
                                                    differs from Actual UF
                                                </Translate>
                                                {` (${ufWeightLossMismatch.actualUf} L) `}
                                                <Translate>
                                                    by more than 0.5 L/kg. Verify
                                                    scales, priming, and UF meter
                                                    before signing off.
                                                </Translate>
                                            </Message>
                                        ) : null}
                                    </div>

                                </div>
                            </Form>
                        }
                    />
                </div>

                <div className="dialysis-session-section">
                    <SectionContainer
                        collapsible={true}
                        defaultCollapsed={false}
                        title={
                            <div className="dialysis-session-section-title">
                                <span className="dialysis-session-section-index">
                                    08
                                </span>

                                <div className="dialysis-session-section-heading">
                                    <Translate>
                                        Dialysis Complications / Events
                                    </Translate>

                                    <span className="dialysis-session-section-description">
                                        Document intradialytic events and interventions
                                        in real time — do not wait until post
                                    </span>
                                </div>
                            </div>
                        }
                        action={
                            <MyButton
                                size="small"
                                onClick={saveDialysisComplications}
                                disabled={
                                    sessionFieldsDisabled ||
                                    savingDialysisSession ||
                                    !sessionHydrationReady
                                }
                            >
                                {savingDialysisSession ? (
                                    <Translate>Saving...</Translate>
                                ) : (
                                    <Translate>Save</Translate>
                                )}
                            </MyButton>
                        }
                        content={
                            <Form fluid>
                                <div className="dialysis-session-content">
                                    <div className="dialysis-complications">
                                        {complicationOptions.map(option => (
                                            <div
                                                key={option.value}
                                                className="dialysis-complication-item"
                                            >
                                                <MyInput
                                                    width="100%"
                                                    fieldName={option.value}
                                                    fieldLabel={option.label}
                                                    fieldType="checkbox"
                                                    record={{
                                                        [option.value]:
                                                            form.complications.includes(
                                                                option.value
                                                            )
                                                    }}
                                                    setRecord={(record: any) =>
                                                        handleComplicationChange(
                                                            option.value,
                                                            Boolean(record?.[option.value])
                                                        )
                                                    }
                                                    disabled={sessionFieldsDisabled}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="dialysis-session-row dialysis-session-row--spaced">
                                        <div className="dialysis-session-field dialysis-session-field--full">
                                            <MyInput
                                                width="100%"
                                                fieldName="complicationNotes"
                                                fieldLabel="Notes"
                                                fieldType="textarea"
                                                rows={3}
                                                record={form}
                                                setRecord={setSection08Form}
                                                disabled={sessionFieldsDisabled}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Form>
                        }
                    />
                </div>

            </div>

            <Modal
                open={pendingTreatmentPlan != null}
                onClose={() => setPendingTreatmentPlan(null)}
            >
                <Modal.Header>
                    <Modal.Title>
                        <Translate>Change Treatment Plan</Translate>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Translate>
                        You have unsaved Dialysis Session changes. Switching
                        Treatment Plans will discard these unsaved changes and
                        load the saved session for the selected plan (or start a
                        new draft if none exists). Continue?
                    </Translate>
                </Modal.Body>
                <Modal.Footer>
                    <MyButton onClick={() => setPendingTreatmentPlan(null)}>
                        <Translate>Cancel</Translate>
                    </MyButton>
                    <MyButton onClick={confirmPendingTreatmentPlan}>
                        <Translate>Discard and Switch</Translate>
                    </MyButton>
                </Modal.Footer>
            </Modal>

            <Modal
                open={ambiguousSessions.length > 0}
                onClose={() => {
                    setAmbiguousSessions([]);
                    setPendingAmbiguousPlan(null);
                }}
            >
                <Modal.Header>
                    <Modal.Title>
                        <Translate>Select Dialysis Session</Translate>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Translate>
                        Multiple saved Dialysis Sessions are associated with this
                        Treatment Plan. Select the session to open.
                    </Translate>
                    <div className="dialysis-session-ambiguous-list">
                        {ambiguousSessions.map(session => (
                            <div
                                key={session.id}
                                className="dialysis-session-ambiguous-item"
                            >
                                <span>
                                    <Translate>Session</Translate>
                                    {` #${session.id}`}
                                    {session.date
                                        ? ` — ${String(session.date).slice(0, 10)}`
                                        : ''}
                                    {session.lastModifiedDate
                                        ? ` (${String(
                                            session.lastModifiedDate
                                        ).slice(0, 16)})`
                                        : ''}
                                </span>
                                <MyButton
                                    size="small"
                                    onClick={() =>
                                        selectAmbiguousSession(session)
                                    }
                                >
                                    <Translate>Open</Translate>
                                </MyButton>
                            </div>
                        ))}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <MyButton
                        onClick={() => {
                            setAmbiguousSessions([]);
                            setPendingAmbiguousPlan(null);
                        }}
                    >
                        <Translate>Cancel</Translate>
                    </MyButton>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default DialysisSession;