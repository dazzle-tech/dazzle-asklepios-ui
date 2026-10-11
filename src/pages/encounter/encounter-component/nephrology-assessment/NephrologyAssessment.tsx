import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useLocation, useOutletContext } from 'react-router-dom';

import { Form, Message, Modal } from 'rsuite';
import { skipToken } from '@reduxjs/toolkit/query';

import MyInput from '@/components/MyInput';
import MyDateHijriInput from '@/components/MyDateHijriInput/MyDateHijriInput';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';

import VitalSigns from '@/pages/medical-component/vital-signs/VitalSigns';

import BodyMeasurements from '../../encounter-pre-observations-new/observations/BodyMeasurements';
import Allergies from '../../encounter-pre-observations-new/AllergiesNurse';

import PatientProblems from '../patient-history/MedicalHistory/PatientProblems/PatientProblems';
import SurgicalHistory from '../patient-history/SurgicalHistory';
import CurrentMedication from '../patient-history/MedicalHistory/CurrentMedication/CurrentMedication';
import FamilyHistory from '../patient-history/MedicalHistory/FamilyHistory';
import SocialHistory from '../patient-history/SocialHistory';
import PatientDiagnosis from '../../medical-notes-and-assessments/patient-diagnosis';
import HistoryOfPresentIllnessSection from '../s.o.a.p/HistoryOfPresentIllnessSection';
import FieldAuditHistoryModal from '../s.o.a.p/FieldAuditHistory';

import { useAppDispatch } from '@/hooks';
import {
    useGetEncounterAuditQuery,
    useGetEncounterByIdQuery,
    useUpdateEncounterMutation
} from '@/services/encounters/patientEncounterService';
import { useGetLatestPatientObservationsComplaintsByEncounterIdQuery } from '@/services/medicalsheetsEncounter/observations/patientObservationsComplaintsService';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { notify } from '@/utils/uiReducerActions';

import {
    DiagnosticOrderTestStatus,
    type DiagnosticOrderTestResultResponseVM,
    type Patient,
    type PatientEncounter
} from '@/types/model-types-new';

import {
    useCreateNephrologyKidneyAssessmentMutation,
    useGetNephrologyKidneyAssessmentQuery,
    useUpdateNephrologyKidneyAssessmentMutation
} from '@/services/dialysis/nephrologyKidneyAssessmentService';
import {
    useCreateNephrologyRenalFunctionMutation,
    useGetNephrologyRenalFunctionQuery,
    useUpdateNephrologyRenalFunctionMutation
} from '@/services/dialysis/nephrologyRenalFunctionService';
import {
    useCreateNephrologyTreatmentPlanMutation,
    useGetNephrologyTreatmentPlansByPatientQuery,
    useUpdateNephrologyTreatmentPlanMutation
} from '@/services/dialysis/nephrologyTreatmentPlanService';
import { useLazyGetDiagnosticOrderTestByIdQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import {
    useFilterDiagnosticOrderTestResultsQuery,
    useLazyFilterDiagnosticOrderTestResultsQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';
import {
    useGetActiveLabProfilesByTestIdsMutation,
    useGetDiagnosticTestProfilesByIdsMutation
} from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

import { useEnumOptions } from '@/services/enumsApi';

import type { NephrologyTreatmentPlan } from '@/types/model-types-new';

import './styles.less';
import MyButton from '@/components/MyButton/MyButton';

/** Diagnostic Test IDs (not result IDs / order-test IDs). */
const ELECTROLYTE_DIAGNOSTIC_TEST_IDS = {
    sodium: 161,
    potassium: 162,
    calcium: 1
} as const;

type ElectrolyteField = keyof typeof ELECTROLYTE_DIAGNOSTIC_TEST_IDS;

type ElectrolyteLabSuggestion = {
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
    onDiagnosisSaved?: () => void;
};


const initialForm = {
    ckdStage: '',
    kidneyCondition: '',
    causeOfKidneyDisease: '',
    otherCauseOfKidneyDisease: '',
    diabetes: null as boolean | null,
    hypertension: null as boolean | null,
    proteinuria: null as boolean | null,
    hematuria: null as boolean | null,

    egfr: null as number | null,
    creatinine: null as number | null,
    bun: null as number | null,
    potassium: null as number | null,
    sodium: null as number | null,
    calcium: null as number | null,
    phosphorus: null as number | null,
    hemoglobin: null as number | null,

    treatmentType: '',

    frequency: null as number | null,
    schedule: [] as string[],
    dialysisDuration: null as number | null,
    durationType: '',
    dryWeight: null as number | null,
    targetWeight: null as number | null,
    dialysisAccess: '',
    accessSite: '',
    otherAccessSite: '',
    bloodFlowRate: null as number | null,
    dialysateFlow: null as number | null,
    dialysate: '',
    nephrologistId: null as number | null,
    startDate: null as string | null,
    status: ''
};

const emptyTreatmentPlanForm = {
    treatmentType: '',
    frequency: null as number | null,
    schedule: [] as string[],
    dialysisDuration: null as number | null,
    durationType: '',
    dryWeight: null as number | null,
    targetWeight: null as number | null,
    dialysisAccess: '',
    accessSite: '',
    otherAccessSite: '',
    bloodFlowRate: null as number | null,
    dialysateFlow: null as number | null,
    dialysate: '',
    nephrologistId: null as number | null,
    startDate: null as string | null,
    status: ''
};

const treatmentPlanFormFromEntity = (plan: NephrologyTreatmentPlan) => ({
    treatmentType: plan.treatmentType ?? '',
    frequency: plan.frequency ?? null,
    schedule: plan.schedule ?? [],
    dialysisDuration: plan.dialysisDuration ?? null,
    durationType: plan.durationType ?? '',
    dryWeight: plan.dryWeight ?? null,
    targetWeight: plan.targetWeight ?? null,
    dialysisAccess: plan.dialysisAccess ?? '',
    accessSite: plan.accessSite ?? '',
    otherAccessSite: plan.otherAccessSite ?? '',
    bloodFlowRate: plan.bloodFlowRate ?? null,
    dialysateFlow: plan.dialysateFlow ?? null,
    dialysate: plan.dialysate ?? '',
    nephrologistId: plan.nephrologistId ?? null,
    startDate: plan.startDate ?? null,
    status: plan.status ?? ''
});

const NephrologySheet = ({
    patient,
    encounter,
    disabled,
    onDiagnosisSaved
}: {
    patient: Patient;
    encounter: PatientEncounter;
    disabled: boolean;
    onDiagnosisSaved?: () => void;
}) => {
    const dispatch = useAppDispatch();

    const [form, setForm] = useState(initialForm);

    const [localEncounter, setLocalEncounter] = useState(encounter);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [selectedAuditField, setSelectedAuditField] = useState('');
    const [selectedTreatmentPlanId, setSelectedTreatmentPlanId] = useState<
        number | null
    >(null);
    const [treatmentPlansPage, setTreatmentPlansPage] = useState(0);
    const [treatmentPlansRowsPerPage, setTreatmentPlansRowsPerPage] =
        useState(10);
    const [pendingPlanAction, setPendingPlanAction] = useState<
        | { type: 'new' }
        | { type: 'edit'; plan: NephrologyTreatmentPlan }
        | null
    >(null);
    const [criticalLabFieldLabels, setCriticalLabFieldLabels] = useState<
        string[]
    >([]);

    const selectedTreatmentPlanIdRef = useRef<number | null>(null);
    selectedTreatmentPlanIdRef.current = selectedTreatmentPlanId;
    const treatmentPlanRequestPatientIdRef = useRef<number>(0);
    const selectedPlanBaselineRef = useRef({ ...emptyTreatmentPlanForm });
    const electrolyteTouchedRef = useRef<Record<ElectrolyteField, boolean>>({
        sodium: false,
        potassium: false,
        calcium: false
    });
    const labAutofillAppliedRef = useRef(false);

    const patientId = Number(patient.id);
    const encounterId = Number(encounter.id);
    treatmentPlanRequestPatientIdRef.current = patientId;

    const ckdStageOptions = useEnumOptions('CkdStage');
    const kidneyConditionOptions = useEnumOptions('KidneyCondition');
    const kidneyDiseaseCauseOptions = useEnumOptions('KidneyDiseaseCause');
    const dialysisTreatmentTypeOptions = useEnumOptions('DialysisTreatmentType');
    const dialysisScheduleDayOptions = useEnumOptions('DialysisScheduleDay');
    const dialysisAccessTypeOptions = useEnumOptions('DialysisAccessType');
    const dialysisAccessSiteOptions = useEnumOptions('DialysisAccessSite');
    const dialysisRegistrationStatusOptions = useEnumOptions('DialysisRegistrationStatus');
    const durationTypeOptions = useEnumOptions('Unit');

    const {
        data: kidneyAssessment,
        isFetching: loadingKidneyAssessment
    } = useGetNephrologyKidneyAssessmentQuery(
        {
            patientId,
            encounterId
        },
        {
            skip: !patientId || !encounterId
        }
    );

    const [createKidneyAssessment, { isLoading: creatingKidneyAssessment }] =
        useCreateNephrologyKidneyAssessmentMutation();

    const [updateKidneyAssessment, { isLoading: updatingKidneyAssessment }] =
        useUpdateNephrologyKidneyAssessmentMutation();

    const savingKidneyAssessment =
        creatingKidneyAssessment || updatingKidneyAssessment;

    const {
        data: renalFunction,
        isFetching: loadingRenalFunction,
        isSuccess: renalFunctionSuccess,
        isError: renalFunctionError
    } = useGetNephrologyRenalFunctionQuery(
        {
            patientId,
            encounterId
        },
        {
            skip: !patientId || !encounterId
        }
    );

    const [createRenalFunction, { isLoading: creatingRenalFunction }] =
        useCreateNephrologyRenalFunctionMutation();

    const [updateRenalFunction, { isLoading: updatingRenalFunction }] =
        useUpdateNephrologyRenalFunctionMutation();

    const savingRenalFunction =
        creatingRenalFunction || updatingRenalFunction;

    const hasSavedRenalFunction = Boolean(renalFunction?.id);
    const renalFunctionQuerySettled =
        !loadingRenalFunction &&
        (renalFunctionSuccess || renalFunctionError || hasSavedRenalFunction);

    /**
     * Nephrology assessment cutoff is "now" at mount: include same-visit labs
     * approved after encounter start, but never future-dated results.
     * Encounter.startedDate incorrectly rejected approved in-visit labs.
     */
    const assessmentCutoffMs = useMemo(() => Date.now(), []);

    const LAB_RESULTS_PAGE_SIZE = 200;

    const labResultsQueryArgs = useMemo(() => {
        if (
            disabled ||
            !patientId ||
            !renalFunctionQuerySettled ||
            hasSavedRenalFunction
        ) {
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
    }, [
        disabled,
        patientId,
        renalFunctionQuerySettled,
        hasSavedRenalFunction
    ]);

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

    const orderTestIds = useMemo(
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
        Record<string, { id?: number; testId?: number; diagnosticTestId?: number }>
    >({});

    useEffect(() => {
        orderTestIds.forEach(orderTestId => {
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
                    // Leave unresolved; suggestion mapping skips missing joins.
                });
        });
    }, [orderTestIds, orderTestsMap, fetchOrderTestById]);

    const orderTestById = useMemo(() => {
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
        orderTestIds.length === 0 ||
        orderTestIds.every(id => orderTestById.has(id));

    const profileIds = useMemo(
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

    const [fetchProfilesByIds, { data: profilesResponse }] =
        useGetDiagnosticTestProfilesByIdsMutation();
    const [fetchActiveProfilesByTestIds] =
        useGetActiveLabProfilesByTestIdsMutation();
    const [activeProfilesByTestId, setActiveProfilesByTestId] = useState<
        Record<number, any[]>
    >({});
    const [activeProfilesLoaded, setActiveProfilesLoaded] = useState(false);
    const { data: valueUnitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');

    useEffect(() => {
        if (profileIds.length > 0) {
            fetchProfilesByIds(profileIds);
        }
    }, [profileIds, fetchProfilesByIds]);

    useEffect(() => {
        if (
            disabled ||
            hasSavedRenalFunction ||
            labResultsQueryArgs === skipToken
        ) {
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
    }, [
        disabled,
        hasSavedRenalFunction,
        labResultsQueryArgs,
        fetchActiveProfilesByTestIds
    ]);

    const profilesById = useMemo(() => {
        const map = new Map<number, any>();

        (profilesResponse ?? []).forEach((profile: any) => {
            if (profile?.id != null) {
                map.set(Number(profile.id), profile);
            }
        });

        return map;
    }, [profilesResponse]);

    const labSuggestionsReady = useMemo(() => {
        if (labResultsQueryArgs === skipToken) {
            return true;
        }

        if (!labResultsFullyLoaded) {
            return false;
        }

        if (!orderTestsResolved) {
            return false;
        }

        if (profileIds.length > 0 && profilesResponse == null) {
            return false;
        }

        if (!activeProfilesLoaded) {
            return false;
        }

        if (valueUnitLov == null) {
            return false;
        }

        return true;
    }, [
        labResultsQueryArgs,
        labResultsFullyLoaded,
        orderTestsResolved,
        profileIds.length,
        profilesResponse,
        activeProfilesLoaded,
        valueUnitLov
    ]);

    const electrolyteLabSuggestions = useMemo(() => {
        const empty: Record<ElectrolyteField, ElectrolyteLabSuggestion | null> =
            {
                sodium: null,
                potassium: null,
                calcium: null
            };

        if (
            disabled ||
            hasSavedRenalFunction ||
            labResultsQueryArgs === skipToken ||
            !labSuggestionsReady
        ) {
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
                    ? profilesById.get(Number(result.profileTestId))
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
                suggestion: ElectrolyteLabSuggestion;
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

            const orderTest = orderTestById.get(Number(result.orderTestId));
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

            if (eligibilityMs != null && eligibilityMs > assessmentCutoffMs) {
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
            ElectrolyteLabSuggestion | null
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
        disabled,
        hasSavedRenalFunction,
        labResultsQueryArgs,
        labSuggestionsReady,
        approvedLabResults,
        orderTestById,
        profilesById,
        activeProfilesByTestId,
        valueUnitLov,
        assessmentCutoffMs
    ]);

    const setElectrolyteForm = (
        next:
            | typeof initialForm
            | ((previous: typeof initialForm) => typeof initialForm)
    ) => {
        setForm(previous => {
            const incoming =
                typeof next === 'function' ? next(previous) : next;

            ELECTROLYTE_FIELDS.forEach(field => {
                if (incoming[field] !== previous[field]) {
                    electrolyteTouchedRef.current[field] = true;
                }
            });

            return incoming;
        });
    };

    const {
        data: treatmentPlansPageData,
        isFetching: loadingTreatmentPlans,
        isError: treatmentPlansError
    } = useGetNephrologyTreatmentPlansByPatientQuery(
        {
            patientId,
            page: treatmentPlansPage,
            size: treatmentPlansRowsPerPage,
            sort: 'createdDate,desc'
        },
        {
            skip: !patientId
        }
    );

    const treatmentPlans = useMemo(() => {
        if (!treatmentPlansPageData?.data) {
            return [];
        }

        return treatmentPlansPageData.data.filter(
            plan => String(plan.patientId) === String(patientId)
        );
    }, [patientId, treatmentPlansPageData]);

    const treatmentPlansTotalCount = treatmentPlansPageData?.totalCount ?? 0;

    const [createTreatmentPlan, { isLoading: creatingTreatmentPlan }] =
        useCreateNephrologyTreatmentPlanMutation();

    const [updateTreatmentPlan, { isLoading: updatingTreatmentPlan }] =
        useUpdateNephrologyTreatmentPlanMutation();

    const savingTreatmentPlan =
        creatingTreatmentPlan || updatingTreatmentPlan;

    const isDialysisTreatment = Boolean(form.treatmentType);

    const {
        data: encounterFromServer
    } = useGetEncounterByIdQuery(
        { id: encounterId },
        {
            skip: !encounterId,
            refetchOnMountOrArgChange: true,
            refetchOnFocus: true
        }
    );

    const { data: audit = [] } = useGetEncounterAuditQuery(
        { id: encounterId },
        { skip: !encounterId }
    );

    const { data: nurseComplaints } =
        useGetLatestPatientObservationsComplaintsByEncounterIdQuery(
            { encounterId },
            { skip: !encounterId }
        );

    useEffect(() => {
        if (encounterFromServer) {
            setLocalEncounter({
                ...encounterFromServer,
                chiefComplaint:
                    encounterFromServer.chiefComplaint ||
                    nurseComplaints?.reasonOfVisit ||
                    ''
            });
        }
    }, [encounterFromServer, nurseComplaints]);

    const saveKidneyAssessment = async () => {
        if (disabled || savingKidneyAssessment) {
            return;
        }

        if (
            form.causeOfKidneyDisease === 'OTHER' &&
            !form.otherCauseOfKidneyDisease?.trim()
        ) {
            dispatch(
                notify({
                    msg: 'Other Cause of Kidney Disease is required.',
                    sev: 'warning'
                })
            );

            return;
        }

        try {
            const body = {
                ckdStage: form.ckdStage || null,
                kidneyCondition: form.kidneyCondition || null,
                causeOfKidneyDisease:
                    form.causeOfKidneyDisease || null,
                otherCauseOfKidneyDisease:
                    form.causeOfKidneyDisease === 'OTHER'
                        ? form.otherCauseOfKidneyDisease?.trim() || null
                        : null,
                diabetes: form.diabetes,
                hypertension: form.hypertension,
                proteinuria: form.proteinuria,
                hematuria: form.hematuria
            };

            if (kidneyAssessment?.id) {
                await updateKidneyAssessment({
                    id: Number(kidneyAssessment.id),
                    ...body
                }).unwrap();
            } else {
                await createKidneyAssessment({
                    patientId,
                    encounterId,
                    ...body
                }).unwrap();
            }

            dispatch(
                notify({
                    msg: 'Kidney Assessment Saved Successfully',
                    sev: 'success'
                })
            );
        } catch (e: any) {
            dispatch(
                notify({
                    msg:
                        e?.data?.detail ||
                        e?.data?.message ||
                        'Failed to save Kidney Assessment',
                    sev: 'error'
                })
            );
        }
    };

    const toMeasurement = (value: number | string | null) => {
        if (value === '' || value === null || value === undefined) {
            return null;
        }

        const numericValue = Number(value);

        return Number.isNaN(numericValue) ? null : numericValue;
    };

    const saveRenalFunction = async () => {
        if (disabled || savingRenalFunction) {
            return;
        }

        try {
            const body = {
                egfr: toMeasurement(form.egfr),
                creatinine: toMeasurement(form.creatinine),
                bun: toMeasurement(form.bun),
                hemoglobin: toMeasurement(form.hemoglobin),
                potassium: toMeasurement(form.potassium),
                sodium: toMeasurement(form.sodium),
                calcium: toMeasurement(form.calcium),
                phosphorus: toMeasurement(form.phosphorus)
            };

            if (renalFunction?.id) {
                await updateRenalFunction({
                    id: Number(renalFunction.id),
                    ...body
                }).unwrap();
            } else {
                await createRenalFunction({
                    patientId,
                    encounterId,
                    ...body
                }).unwrap();
            }

            dispatch(
                notify({
                    msg: 'Renal Function Saved Successfully',
                    sev: 'success'
                })
            );
        } catch (e: any) {
            dispatch(
                notify({
                    msg:
                        e?.data?.detail ||
                        e?.data?.message ||
                        'Failed to save Renal Function',
                    sev: 'error'
                })
            );
        }
    };

    const toInteger = (value: number | string | null) => {
        const numericValue = toMeasurement(value);

        return numericValue === null ? null : Math.trunc(numericValue);
    };

    const applyTreatmentPlanToForm = (plan: NephrologyTreatmentPlan | null) => {
        const nextForm = plan
            ? treatmentPlanFormFromEntity(plan)
            : { ...emptyTreatmentPlanForm };

        selectedPlanBaselineRef.current = nextForm;
        setForm(prev => ({
            ...prev,
            ...nextForm
        }));
    };

    const hasUnsavedTreatmentPlanChanges = () => {
        const baseline = selectedPlanBaselineRef.current;
        const current = {
            treatmentType: form.treatmentType ?? '',
            frequency: form.frequency ?? null,
            schedule: form.schedule ?? [],
            dialysisDuration: form.dialysisDuration ?? null,
            durationType: form.durationType ?? '',
            dryWeight: form.dryWeight ?? null,
            targetWeight: form.targetWeight ?? null,
            dialysisAccess: form.dialysisAccess ?? '',
            accessSite: form.accessSite ?? '',
            otherAccessSite: form.otherAccessSite ?? '',
            bloodFlowRate: form.bloodFlowRate ?? null,
            dialysateFlow: form.dialysateFlow ?? null,
            dialysate: form.dialysate ?? '',
            nephrologistId: form.nephrologistId ?? null,
            startDate: form.startDate ?? null,
            status: form.status ?? ''
        };

        return JSON.stringify(current) !== JSON.stringify(baseline);
    };

    const startNewTreatmentPlan = () => {
        setSelectedTreatmentPlanId(null);
        applyTreatmentPlanToForm(null);
    };

    const startEditTreatmentPlan = (plan: NephrologyTreatmentPlan) => {
        if (String(plan.patientId) !== String(patientId)) {
            return;
        }

        setSelectedTreatmentPlanId(Number(plan.id));
        applyTreatmentPlanToForm(plan);
    };

    const requestNewTreatmentPlan = () => {
        if (disabled || savingTreatmentPlan) {
            return;
        }

        if (hasUnsavedTreatmentPlanChanges()) {
            setPendingPlanAction({ type: 'new' });
            return;
        }

        startNewTreatmentPlan();
    };

    const requestEditTreatmentPlan = (plan: NephrologyTreatmentPlan) => {
        if (disabled || savingTreatmentPlan) {
            return;
        }

        if (Number(plan.id) === Number(selectedTreatmentPlanId)) {
            return;
        }

        if (hasUnsavedTreatmentPlanChanges()) {
            setPendingPlanAction({ type: 'edit', plan });
            return;
        }

        startEditTreatmentPlan(plan);
    };

    const confirmPendingPlanAction = () => {
        if (!pendingPlanAction) {
            return;
        }

        if (pendingPlanAction.type === 'new') {
            startNewTreatmentPlan();
        } else {
            startEditTreatmentPlan(pendingPlanAction.plan);
        }

        setPendingPlanAction(null);
    };

    const enumLabel = (
        options: Array<{ label: string; value: string | number | boolean }>,
        value?: string | null
    ) => {
        if (value == null || value === '') {
            return '-';
        }

        return (
            options.find(option => String(option.value) === String(value))
                ?.label || String(value)
        );
    };

    const displaySchedule = (schedule?: string[] | null) => {
        if (!schedule?.length) {
            return '-';
        }

        return schedule
            .map(day => enumLabel(dialysisScheduleDayOptions, day))
            .join(', ');
    };

    const displayDateValue = (value?: string | null) => {
        if (!value) {
            return '-';
        }

        return String(value).slice(0, 10);
    };

    const saveTreatmentPlan = async () => {
        if (disabled || savingTreatmentPlan) {
            return;
        }

        if (
            form.accessSite === 'OTHER' &&
            !form.otherAccessSite?.trim()
        ) {
            dispatch(
                notify({
                    msg: 'Other Access Site is required.',
                    sev: 'warning'
                })
            );

            return;
        }

        const editingPlanId = selectedTreatmentPlanId;

        try {
            const body = {
                treatmentType: form.treatmentType || null,
                frequency: toInteger(form.frequency),
                schedule: form.schedule?.length ? form.schedule : null,
                dialysisDuration: toMeasurement(form.dialysisDuration),
                durationType: form.durationType || null,
                dryWeight: toMeasurement(form.dryWeight),
                targetWeight: toMeasurement(form.targetWeight),
                dialysisAccess: form.dialysisAccess || null,
                accessSite: form.accessSite || null,
                otherAccessSite:
                    form.accessSite === 'OTHER'
                        ? form.otherAccessSite?.trim() || null
                        : null,
                bloodFlowRate: toMeasurement(form.bloodFlowRate),
                dialysateFlow: toMeasurement(form.dialysateFlow),
                dialysate: form.dialysate?.trim() || null,
                nephrologistId: form.nephrologistId
                    ? Number(form.nephrologistId)
                    : null,
                startDate: form.startDate || null,
                status: form.status || null
            };

            if (editingPlanId) {
                const updated = await updateTreatmentPlan({
                    id: Number(editingPlanId),
                    ...body
                }).unwrap();

                if (
                    treatmentPlanRequestPatientIdRef.current === patientId &&
                    selectedTreatmentPlanIdRef.current === editingPlanId &&
                    updated?.id
                ) {
                    setSelectedTreatmentPlanId(Number(updated.id));
                    applyTreatmentPlanToForm(updated);
                }
            } else {
                const created = await createTreatmentPlan({
                    patientId,
                    encounterId,
                    ...body
                }).unwrap();

                if (
                    treatmentPlanRequestPatientIdRef.current === patientId &&
                    selectedTreatmentPlanIdRef.current == null &&
                    created?.id
                ) {
                    setSelectedTreatmentPlanId(Number(created.id));
                    applyTreatmentPlanToForm(created);
                }
            }

            dispatch(
                notify({
                    msg: 'Treatment Plan Saved Successfully',
                    sev: 'success'
                })
            );
        } catch (e: any) {
            dispatch(
                notify({
                    msg:
                        e?.data?.detail ||
                        e?.data?.message ||
                        'Failed to save Treatment Plan',
                    sev: 'error'
                })
            );
        }
    };

    const [updateEncounter] = useUpdateEncounterMutation();

    const toEncounterPayload = (
        source: PatientEncounter
    ): PatientEncounter => ({
        id: Number(source?.id),
        patientId: Number(
            source?.patientId ??
            source?.patient?.id
        ),
        encounterNumber: source?.encounterNumber ?? null,
        facilityId: Number(source?.facilityId),
        departmentId: Number(source?.departmentId),
        practitionerId: source?.practitionerId ?? null,
        paymentDate: source?.paymentDate,
        amount: source?.amount,
        encounterType: source?.encounterType,
        encounterReason: source?.encounterReason,
        followUpEncounterId:
            source?.followUpEncounterId ??
            source?.followUpEncounter?.id ??
            null,
        priorityLevel: source?.priorityLevel,
        originType: source?.originType ?? null,
        originName: source?.originName ?? null,
        notes: source?.notes ?? null,
        departmentDailySequenceNumber:
            source?.departmentDailySequenceNumber ?? null,
        encounterDate: source?.encounterDate ?? null,
        status: source?.status,
        chiefComplaint: source?.chiefComplaint ?? null,
        hasPrescription: Boolean(source?.hasPrescription),
        hasOrder: Boolean(source?.hasOrder),
        isObserved: Boolean(source?.isObserved),
        physicalExaminationSummery:
            source?.physicalExaminationSummery ?? null
    });

    const saveChanges = async (_silent = false) => {
        if (!localEncounter?.chiefComplaint?.trim()) {
            dispatch(
                notify({
                    msg: 'Chief Complaint cannot be empty.',
                    sev: 'warning'
                })
            );

            return;
        }

        if (
            localEncounter?.chiefComplaint?.trim().trim() ===
            (encounterFromServer?.chiefComplaint ?? '').trim()
        ) {
            return;
        }

        try {
            const idToUpdate = localEncounter?.id ?? encounterId;

            if (!idToUpdate) {
                dispatch(
                    notify({
                        msg: 'No encounter id to update',
                        sev: 'error'
                    })
                );

                return;
            }

            const payload = {
                ...toEncounterPayload(localEncounter),
                physicalExaminationSummery:
                    encounterFromServer?.physicalExaminationSummery ?? null
            };

            if (
                !payload.patientId ||
                !payload.facilityId ||
                !payload.departmentId
            ) {
                dispatch(
                    notify({
                        msg: 'Missing required fields: patientId / facilityId / departmentId',
                        sev: 'error'
                    })
                );

                return;
            }

            if (
                payload.encounterReason === 'FOLLOW_UP' &&
                !payload.followUpEncounterId
            ) {
                dispatch(
                    notify({
                        msg: 'Follow-up encounter is required when reason is FOLLOW_UP',
                        sev: 'error'
                    })
                );

                return;
            }

            const updatedEncounter = await updateEncounter({
                id: idToUpdate,
                body: payload
            }).unwrap();

            setLocalEncounter(updatedEncounter);

            dispatch(
                notify({
                    msg: 'Saved Successfully',
                    sev: 'success'
                })
            );
        } catch (e: any) {
            dispatch(
                notify({
                    msg: e?.data?.detail || e?.data?.message || 'Save Failed',
                    sev: 'error'
                })
            );
        }
    };

    const openAuditHistory = (fieldName: string) => {
        setSelectedAuditField(fieldName);
        setHistoryOpen(true);
    };

    const {
        data: practitioners,
        isFetching: loadingPractitioners,
        isError: practitionerError
    } = useGetAllPractitionersQuery(
        {
            page: 0,
            size: 9999,
            sort: 'id,asc'
        },
        {
            skip: !isDialysisTreatment
        }
    );

    const physicians =
        practitioners?.data?.filter(
            practitioner => practitioner.jobRole === 'PHYSICIAN'
        ) ?? [];

    useEffect(() => {
        if (!kidneyAssessment) {
            return;
        }

        setForm(prev => ({
            ...prev,
            ckdStage: kidneyAssessment.ckdStage ?? '',
            kidneyCondition: kidneyAssessment.kidneyCondition ?? '',
            causeOfKidneyDisease:
                kidneyAssessment.causeOfKidneyDisease ?? '',
            otherCauseOfKidneyDisease:
                kidneyAssessment.otherCauseOfKidneyDisease ?? '',
            diabetes: kidneyAssessment.diabetes ?? null,
            hypertension: kidneyAssessment.hypertension ?? null,
            proteinuria: kidneyAssessment.proteinuria ?? null,
            hematuria: kidneyAssessment.hematuria ?? null
        }));
    }, [kidneyAssessment]);

    useEffect(() => {
        if (!renalFunction?.id) {
            return;
        }

        // Saved Renal Function always wins; block laboratory autofill.
        labAutofillAppliedRef.current = true;
        setCriticalLabFieldLabels([]);

        setForm(prev => ({
            ...prev,
            egfr: renalFunction.egfr ?? null,
            creatinine: renalFunction.creatinine ?? null,
            bun: renalFunction.bun ?? null,
            hemoglobin: renalFunction.hemoglobin ?? null,
            potassium: renalFunction.potassium ?? null,
            sodium: renalFunction.sodium ?? null,
            calcium: renalFunction.calcium ?? null,
            phosphorus: renalFunction.phosphorus ?? null
        }));
    }, [renalFunction]);

    useEffect(() => {
        if (disabled || hasSavedRenalFunction || labAutofillAppliedRef.current) {
            return;
        }

        if (!renalFunctionQuerySettled || !labSuggestionsReady) {
            return;
        }

        // Wait until every approved page + order-test join is complete.
        if (
            labResultsQueryArgs !== skipToken &&
            (!labResultsFullyLoaded || !orderTestsResolved)
        ) {
            return;
        }

        const fieldLabels: Record<ElectrolyteField, string> = {
            sodium: 'Sodium',
            potassium: 'Potassium',
            calcium: 'Calcium'
        };

        const criticalLabels: string[] = [];
        let changed = false;

        setForm(prev => {
            const next = { ...prev };

            ELECTROLYTE_FIELDS.forEach(field => {
                if (electrolyteTouchedRef.current[field]) {
                    return;
                }

                if (prev[field] != null && prev[field] !== ('' as any)) {
                    return;
                }

                const suggestion = electrolyteLabSuggestions[field];

                if (!suggestion) {
                    return;
                }

                next[field] = suggestion.value;
                changed = true;

                if (suggestion.isCritical) {
                    criticalLabels.push(fieldLabels[field]);
                }
            });

            return changed ? next : prev;
        });

        setCriticalLabFieldLabels(criticalLabels);
        labAutofillAppliedRef.current = true;
    }, [
        disabled,
        hasSavedRenalFunction,
        renalFunctionQuerySettled,
        labSuggestionsReady,
        labResultsQueryArgs,
        labResultsFullyLoaded,
        orderTestsResolved,
        electrolyteLabSuggestions
    ]);

    useEffect(() => {
        setSelectedTreatmentPlanId(null);
        setTreatmentPlansPage(0);
        setPendingPlanAction(null);
        selectedPlanBaselineRef.current = { ...emptyTreatmentPlanForm };
        setForm(prev => ({
            ...prev,
            ...emptyTreatmentPlanForm
        }));
    }, [patientId]);

    const treatmentPlanColumns = [
        {
            key: 'id',
            title: <Translate>Plan ID</Translate>,
            minWidth: 90,
            render: (row: NephrologyTreatmentPlan) => row.id ?? '-'
        },
        {
            key: 'treatmentType',
            title: <Translate>Treatment Type</Translate>,
            minWidth: 140,
            render: (row: NephrologyTreatmentPlan) =>
                enumLabel(dialysisTreatmentTypeOptions, row.treatmentType)
        },
        {
            key: 'frequency',
            title: <Translate>Frequency</Translate>,
            minWidth: 100,
            render: (row: NephrologyTreatmentPlan) =>
                row.frequency == null ? '-' : String(row.frequency)
        },
        {
            key: 'schedule',
            title: <Translate>Schedule</Translate>,
            minWidth: 160,
            render: (row: NephrologyTreatmentPlan) =>
                displaySchedule(row.schedule)
        },
        {
            key: 'dialysisDuration',
            title: <Translate>Dialysis Duration</Translate>,
            minWidth: 140,
            render: (row: NephrologyTreatmentPlan) =>
                row.dialysisDuration == null
                    ? '-'
                    : String(row.dialysisDuration)
        },
        {
            key: 'startDate',
            title: <Translate>Start Date</Translate>,
            minWidth: 120,
            render: (row: NephrologyTreatmentPlan) =>
                displayDateValue(row.startDate)
        },
        {
            key: 'status',
            title: <Translate>Status</Translate>,
            minWidth: 120,
            render: (row: NephrologyTreatmentPlan) =>
                enumLabel(dialysisRegistrationStatusOptions, row.status)
        },
        {
            key: 'createdDate',
            title: <Translate>Created Date</Translate>,
            minWidth: 130,
            render: (row: NephrologyTreatmentPlan) =>
                displayDateValue(row.createdDate)
        },
        {
            key: 'actions',
            title: <Translate>Actions</Translate>,
            minWidth: 100,
            render: (row: NephrologyTreatmentPlan) => (
                <MyButton
                    size="small"
                    onClick={() => requestEditTreatmentPlan(row)}
                    disabled={disabled || savingTreatmentPlan}
                >
                    <Translate>Edit</Translate>
                </MyButton>
            )
        }
    ];

    return (
        <div className="nephrology-sheet">
            <div className="nephrology-main-sections">


                <div className="nephrology-main-section nephrology-patient-assessment">
                    <SectionContainer
                        collapsible={true}
                        defaultCollapsed={false}
                        title={
                            <div className="nephrology-section-title">
                                <span className="nephrology-section-index">01</span>

                                <div className="nephrology-section-heading">
                                    <Translate>Patient Assessment</Translate>

                                    <span className="nephrology-section-description">
                                        Clinical history, diagnosis, vital signs and patient measurements
                                    </span>
                                </div>
                            </div>
                        }
                        content={
                            <div
                                className="nephrology-assessment-content"
                                key={String(disabled)}
                            >

                                <div className="nephrology-assessment-group">
                                    <div className="nephrology-assessment-group-header">
                                        <div className="nephrology-assessment-group-title">
                                            <Translate>Clinical Presentation</Translate>
                                        </div>

                                        <div className="nephrology-assessment-group-line" />
                                    </div>

                                    <div className="nephrology-assessment-grid nephrology-assessment-grid--clinical">
                                        <div className="nephrology-assessment-card">
                                            <SectionContainer
                                                collapsible
                                                title={<Translate>Chief Complaint </Translate>}
                                                content={
                                                    <Form fluid>
                                                        <MyInput
                                                            width="100%"
                                                            height="95px"
                                                            showLabel={false}
                                                            fieldType="textarea"
                                                            fieldName="chiefComplaint"
                                                            record={localEncounter}
                                                            setRecord={setLocalEncounter}
                                                            onBlur={() => {
                                                                if (!disabled) {
                                                                    saveChanges(true);
                                                                }
                                                            }}
                                                            disabled={disabled}
                                                        />

                                                        {/* <MyInput
                                                        width="100%"
                                                        height="120px"
                                                        fieldLabel="Physical Examination Summary"
                                                        fieldType="textarea"
                                                        fieldName="physicalExaminationSummery"
                                                        record={{
                                                            physicalExaminationSummery:
                                                            localEncounter?.physicalExaminationSummery || ''
                                                        }}
                                                        setRecord={() => { }}
                                                        disabled
                                                        /> */}
                                                    </Form>
                                                }
                                                action={
                                                    <>
                                                        <MyButton
                                                            size="small"
                                                            onClick={() => openAuditHistory('chiefComplaint')}
                                                        >
                                                            History
                                                        </MyButton>
                                                        <MyButton size="small" onClick={() => saveChanges(false)} disabled={disabled}>
                                                            Save
                                                        </MyButton>
                                                    </>
                                                }
                                            />
                                        </div>
                                        <div className="nephrology-assessment-card">
                                            <HistoryOfPresentIllnessSection
                                                collapsible={true}
                                                defaultCollapsed={false}
                                                encounter={localEncounter}
                                                setEncounter={setLocalEncounter}
                                                disabled={disabled}
                                                onShowHistory={() => openAuditHistory('historyOfPresentIllness')}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="nephrology-assessment-group">
                                    <div className="nephrology-assessment-group-header">
                                        <div className="nephrology-assessment-group-title">
                                            <Translate>Medical History</Translate>
                                        </div>

                                        <div className="nephrology-assessment-group-line" />
                                    </div>
                                    <div className="nephrology-assessment-grid">
                                        <div className="nephrology-assessment-card">
                                            <PatientProblems
                                                collapsible={true}
                                                patient={patient}
                                                edit={disabled}
                                                toShowData={disabled}
                                                showFreeText={true}
                                            />
                                        </div>

                                        <div className="nephrology-assessment-card">
                                            <SurgicalHistory
                                                collapsible={true}
                                                patient={patient}
                                                edit={disabled}
                                                toShowData={disabled}
                                                showFreeText={true}
                                            />
                                        </div>
                                    </div>
                                    <div className="nephrology-assessment-grid">
                                        <div className="nephrology-assessment-card">
                                            <SectionContainer
                                                collapsible={true}
                                                defaultCollapsed={false}
                                                title={<Translate>Medication History</Translate>}
                                                content={
                                                    <CurrentMedication
                                                        patient={patient}
                                                        edit={disabled}
                                                        toShowData={disabled}
                                                        showFreeText={true}
                                                    />
                                                }
                                            />
                                        </div>

                                        <div className="nephrology-assessment-card">
                                            <SectionContainer
                                                collapsible={true}
                                                defaultCollapsed={false}
                                                title={<Translate>Allergy</Translate>}
                                                content={
                                                    <Allergies
                                                        patient={patient}
                                                        encounter={encounter}
                                                        edit={disabled}
                                                    />
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="nephrology-assessment-grid">
                                        <div className="nephrology-assessment-card">
                                            <FamilyHistory
                                                patient={patient}
                                                edit={disabled}
                                                toShowData={disabled}
                                                collapsible={true}
                                                defaultCollapsed={false}
                                                showFreeText={true}
                                            />
                                        </div>

                                        <div className="nephrology-assessment-card">
                                            <SocialHistory
                                                patient={patient}
                                                edit={disabled}
                                                toShowData={disabled}
                                                collapsible={true}
                                                defaultCollapsed={false}
                                                showFreeText={true}

                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="nephrology-assessment-group">
                                    <div className="nephrology-assessment-group-header">
                                        <div className="nephrology-assessment-group-title">
                                            <Translate>Diagnosis</Translate>
                                        </div>

                                        <div className="nephrology-assessment-group-line" />
                                    </div>

                                    <div className="nephrology-assessment-row">
                                        <div className="nephrology-assessment-card nephrology-assessment-card--full">
                                            <SectionContainer
                                                collapsible={true}
                                                defaultCollapsed={false}
                                                title={<Translate>Patient Diagnosis</Translate>}
                                                content={
                                                    <PatientDiagnosis
                                                        patient={patient}
                                                        encounter={localEncounter}
                                                        disabled={disabled}
                                                        onDiagnosisSaved={onDiagnosisSaved}
                                                    />
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>


                                <div className="nephrology-assessment-group nephrology-assessment-group--last">
                                    <div className="nephrology-assessment-group-header">
                                        <div className="nephrology-assessment-group-title">
                                            <Translate>Clinical Measurements</Translate>
                                        </div>

                                        <div className="nephrology-assessment-group-line" />
                                    </div>

                                    <div className="nephrology-assessment-grid nephrology-assessment-grid--measurements">
                                        <div className="nephrology-assessment-card">
                                            <VitalSigns
                                                patientId={patientId}
                                                encounterId={encounterId}
                                                encounter={encounter}
                                                disabled={disabled}
                                                width="100%"
                                                collapsible={true}
                                                defaultCollapsed={false}
                                                showExtendedFields={true}
                                                showFluidAssessment
                                            />
                                        </div>
                                        <div className="nephrology-assessment-card">
                                            <Form fluid>
                                                <BodyMeasurements
                                                    patient={patient}
                                                    patientId={patientId}
                                                    encounterId={encounterId}
                                                    encounter={encounter}
                                                    disabled={disabled}
                                                    width="100%"
                                                    showExtendedMeasurements={false}
                                                    collapsible={true}
                                                    defaultCollapsed={false}
                                                />
                                            </Form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                    />
                </div>


                <div className="nephrology-main-section nephrology-kidney-assessment">
                    <SectionContainer
                        collapsible={true}
                        defaultCollapsed={false}
                        title={
                            <div className="nephrology-section-title">
                                <span className="nephrology-section-index">
                                    02
                                </span>

                                <div className="nephrology-section-heading">
                                    <Translate>
                                        Kidney-specific Assessment
                                    </Translate>

                                    <span className="nephrology-section-description">
                                        Kidney condition and disease assessment
                                    </span>
                                </div>
                            </div>
                        }
                        action={
                            <MyButton
                                size="small"
                                onClick={saveKidneyAssessment}
                                disabled={
                                    disabled ||
                                    savingKidneyAssessment ||
                                    loadingKidneyAssessment
                                }
                            >
                                {savingKidneyAssessment ? (
                                    <Translate>Saving...</Translate>
                                ) : (
                                    <Translate>Save</Translate>
                                )}
                            </MyButton>
                        }
                        content={
                            <Form fluid>
                                <div className="nephrology-kidney-content">

                                    <div className="nephrology-kidney-group">
                                        <div className="nephrology-kidney-group-header">
                                            <span className="nephrology-kidney-group-title">
                                                <Translate>
                                                    Kidney Condition
                                                </Translate>
                                            </span>

                                            <div className="nephrology-kidney-group-line" />
                                        </div>

                                        <div className="nephrology-kidney-row">
                                            <div className="nephrology-kidney-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="ckdStage"
                                                    fieldLabel="CKD Stage"
                                                    fieldType="select"
                                                    selectData={ckdStageOptions}
                                                    selectDataLabel="label"
                                                    selectDataValue="value"
                                                    searchable={false}
                                                    record={form}
                                                    setRecord={setForm}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="nephrology-kidney-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="kidneyCondition"
                                                    fieldLabel="AKI / CKD"
                                                    fieldType="select"
                                                    selectData={kidneyConditionOptions}
                                                    selectDataLabel="label"
                                                    selectDataValue="value"
                                                    searchable={false}
                                                    record={form}
                                                    setRecord={setForm}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="nephrology-kidney-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="causeOfKidneyDisease"
                                                    fieldLabel="Cause of Kidney Disease"
                                                    fieldType="select"
                                                    selectData={kidneyDiseaseCauseOptions}
                                                    selectDataLabel="label"
                                                    selectDataValue="value"
                                                    searchable
                                                    record={form}
                                                    setRecord={setForm}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            {form.causeOfKidneyDisease === 'OTHER' && (
                                                <div className="nephrology-kidney-field">
                                                    <MyInput
                                                        width="100%"
                                                        fieldName="otherCauseOfKidneyDisease"
                                                        fieldLabel="Other Cause of Kidney Disease"
                                                        fieldType="text"
                                                        record={form}
                                                        setRecord={setForm}
                                                        disabled={disabled}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="nephrology-kidney-group">
                                        <div className="nephrology-kidney-group-header">
                                            <span className="nephrology-kidney-group-title">
                                                <Translate>
                                                    Clinical Findings
                                                </Translate>
                                            </span>

                                            <div className="nephrology-kidney-group-line" />
                                        </div>

                                        <div className="nephrology-kidney-row">
                                            <div className="nephrology-kidney-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="diabetes"
                                                    fieldLabel="Diabetes"
                                                    fieldType="checkbox"
                                                    record={form}
                                                    setRecord={setForm}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="nephrology-kidney-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="hypertension"
                                                    fieldLabel="Hypertension"
                                                    fieldType="checkbox"
                                                    record={form}
                                                    setRecord={setForm}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="nephrology-kidney-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="proteinuria"
                                                    fieldLabel="Proteinuria"
                                                    fieldType="checkbox"
                                                    record={form}
                                                    setRecord={setForm}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="nephrology-kidney-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="hematuria"
                                                    fieldLabel="Hematuria"
                                                    fieldType="checkbox"
                                                    record={form}
                                                    setRecord={setForm}
                                                    disabled={disabled}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Form>
                        }
                    />
                </div>

                <div className="nephrology-main-section nephrology-renal-function">
                    <SectionContainer
                        collapsible={true}
                        defaultCollapsed={false}
                        title={
                            <div className="nephrology-section-title">
                                <span className="nephrology-section-index">03</span>

                                <div className="nephrology-section-heading">
                                    <Translate>Renal Function</Translate>

                                    <span className="nephrology-section-description">
                                        Renal markers, hemoglobin and electrolytes
                                    </span>
                                </div>
                            </div>
                        }
                        action={
                            <MyButton
                                size="small"
                                onClick={saveRenalFunction}
                                disabled={
                                    disabled ||
                                    savingRenalFunction ||
                                    loadingRenalFunction
                                }
                            >
                                {savingRenalFunction ? (
                                    <Translate>Saving...</Translate>
                                ) : (
                                    <Translate>Save</Translate>
                                )}
                            </MyButton>
                        }
                        content={
                            <Form fluid>
                                <div className="nephrology-renal-content">

                                    <div className="nephrology-renal-group">
                                        <div className="nephrology-renal-group-header">
                                            <span className="nephrology-renal-group-title">
                                                <Translate>Renal Function Markers</Translate>
                                            </span>

                                            <div className="nephrology-renal-group-line" />
                                        </div>

                                        <div className="nephrology-renal-row">
                                            <div className="nephrology-renal-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="egfr"
                                                    fieldLabel="eGFR"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setForm}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="nephrology-renal-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="creatinine"
                                                    fieldLabel="Creatinine"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setForm}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="nephrology-renal-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="bun"
                                                    fieldLabel="BUN"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setForm}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="nephrology-renal-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="hemoglobin"
                                                    fieldLabel="Hemoglobin"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setForm}
                                                    disabled={disabled}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="nephrology-renal-group">
                                        <div className="nephrology-renal-group-header">
                                            <div className="nephrology-renal-group-heading">
                                                <span className="nephrology-renal-group-title">
                                                    <Translate>Electrolytes</Translate>
                                                </span>

                                                <span className="nephrology-renal-group-description">
                                                    <Translate>Serum electrolyte measurements</Translate>
                                                </span>
                                            </div>

                                            <div className="nephrology-renal-group-line" />
                                        </div>

                                        {criticalLabFieldLabels.length > 0 &&
                                            !disabled && (
                                                <Message
                                                    type="warning"
                                                    showIcon
                                                    style={{ marginBottom: 12 }}
                                                >
                                                    <Translate>
                                                        Critical laboratory
                                                        result suggested for
                                                    </Translate>
                                                    {': '}
                                                    {criticalLabFieldLabels.join(
                                                        ', '
                                                    )}
                                                    .
                                                </Message>
                                            )}

                                        <div className="nephrology-renal-row">
                                            <div className="nephrology-renal-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="potassium"
                                                    fieldLabel="Potassium"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setElectrolyteForm}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="nephrology-renal-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="sodium"
                                                    fieldLabel="Sodium"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setElectrolyteForm}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="nephrology-renal-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="calcium"
                                                    fieldLabel="Calcium"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setElectrolyteForm}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="nephrology-renal-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="phosphorus"
                                                    fieldLabel="Phosphorus"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setForm}
                                                    disabled={disabled}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Form>
                        }
                    />
                </div>


                <div className="nephrology-main-section nephrology-treatment-plan">
                <SectionContainer
                    collapsible={true}
                    defaultCollapsed={false}
                    title={
                    <div className="nephrology-section-title">
                        <span className="nephrology-section-index">04</span>

                        <div className="nephrology-section-heading">
                        <Translate>Treatment Plan</Translate>

                        <span className="nephrology-section-description">
                            Dialysis treatment selection and registration
                        </span>
                        </div>
                    </div>
                    }
                    action={
                    <div className="nephrology-treatment-actions">
                        <MyButton
                        size="small"
                        onClick={requestNewTreatmentPlan}
                        disabled={disabled || savingTreatmentPlan}
                        >
                        <Translate>New Treatment Plan</Translate>
                        </MyButton>

                        <MyButton
                        size="small"
                        onClick={saveTreatmentPlan}
                        disabled={
                            disabled ||
                            savingTreatmentPlan ||
                            loadingTreatmentPlans
                        }
                        >
                        {savingTreatmentPlan ? (
                            <Translate>Saving...</Translate>
                        ) : (
                            <Translate>Save</Translate>
                        )}
                        </MyButton>
                    </div>
                    }
                    content={
                    <div className="nephrology-treatment-content">

                        {/* Treatment Plan Editor */}
                        <div className="nephrology-treatment-editor">

                        <div className="nephrology-treatment-editor-header">
                            <div className="nephrology-treatment-editor-heading">
                            <span className="nephrology-treatment-editor-eyebrow">
                                <Translate>Treatment Plan Details</Translate>
                            </span>

                            <div className="nephrology-treatment-mode">
                                {selectedTreatmentPlanId ? (
                                <Translate>Editing Treatment Plan</Translate>
                                ) : (
                                <Translate>Creating New Treatment Plan</Translate>
                                )}

                                {selectedTreatmentPlanId
                                ? ` #${selectedTreatmentPlanId}`
                                : ''}
                            </div>
                            </div>

                            <span className="nephrology-treatment-editor-status">
                            {selectedTreatmentPlanId ? (
                                <Translate>Existing Plan</Translate>
                            ) : (
                                <Translate>New Plan</Translate>
                            )}
                            </span>
                        </div>

                        <Form fluid>
                            {/* Treatment Selection */}
                            <div className="nephrology-treatment-group">
                            <div className="nephrology-treatment-group-header">
                                <span className="nephrology-treatment-group-title">
                                <Translate>Treatment Selection</Translate>
                                </span>

                                <div className="nephrology-treatment-group-line" />
                            </div>

                            <div className="nephrology-treatment-row nephrology-treatment-row--single">
                                <div className="nephrology-treatment-field">
                                <MyInput
                                    width="100%"
                                    fieldName="treatmentType"
                                    fieldLabel="Treatment Type"
                                    fieldType="select"
                                    selectData={dialysisTreatmentTypeOptions}
                                    selectDataLabel="label"
                                    selectDataValue="value"
                                    searchable={false}
                                    record={form}
                                    setRecord={setForm}
                                    disabled={disabled}
                                />
                                </div>
                            </div>
                            </div>

                            {/* Dialysis Registration */}
                            {isDialysisTreatment && (
                            <div className="nephrology-dialysis-registration">

                                <div className="nephrology-dialysis-registration-header">
                                <div className="nephrology-dialysis-registration-heading">
                                    <div className="nephrology-dialysis-registration-title">
                                    <Translate>Dialysis Patient Registration</Translate>
                                    </div>

                                    <div className="nephrology-dialysis-registration-description">
                                    <Translate>
                                        Long-term dialysis treatment profile
                                    </Translate>
                                    </div>
                                </div>

                                <span className="nephrology-dialysis-registration-badge">
                                    <Translate>Dialysis</Translate>
                                </span>
                                </div>

                                <div className="nephrology-dialysis-content">

                                {/* Dialysis Schedule */}
                                <div className="nephrology-dialysis-group">
                                    <div className="nephrology-dialysis-group-header">
                                    <span className="nephrology-dialysis-group-title">
                                        <Translate>Dialysis Schedule</Translate>
                                    </span>

                                    <div className="nephrology-dialysis-group-line" />
                                    </div>

                                    <div className="nephrology-dialysis-row">
                                    <div className="nephrology-dialysis-field">
                                        <MyInput
                                        width="100%"
                                        fieldName="treatmentType"
                                        fieldLabel="Dialysis Type"
                                        fieldType="select"
                                        selectData={dialysisTreatmentTypeOptions}
                                        selectDataLabel="label"
                                        selectDataValue="value"
                                        searchable={false}
                                        record={form}
                                        setRecord={() => {}}
                                        disabled
                                        />
                                    </div>

                                    <div className="nephrology-dialysis-field">
                                        <MyInput
                                        width="100%"
                                        fieldName="frequency"
                                        fieldLabel="Frequency"
                                        fieldType="number"
                                        showZero
                                        record={form}
                                        setRecord={setForm}
                                        disabled={disabled}
                                        />
                                    </div>

                                    <div className="nephrology-dialysis-field">
                                        <MyInput
                                        width="100%"
                                        fieldName="schedule"
                                        fieldLabel="Schedule"
                                        fieldType="checkPicker"
                                        selectData={dialysisScheduleDayOptions}
                                        selectDataLabel="label"
                                        selectDataValue="value"
                                        searchable={false}
                                        record={form}
                                        setRecord={setForm}
                                        disabled={disabled}
                                        />
                                    </div>

                                    <div className="nephrology-dialysis-field">
                                        <MyInput
                                        width="100%"
                                        fieldName="dialysisDuration"
                                        fieldLabel="Dialysis Duration"
                                        fieldType="number"
                                        allowDecimal
                                        showZero
                                        record={form}
                                        setRecord={setForm}
                                        disabled={disabled}
                                        />
                                    </div>

                                    <div className="nephrology-dialysis-field">
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
                                        setRecord={setForm}
                                        disabled={disabled}
                                        />
                                    </div>
                                    </div>
                                </div>

                                {/* Weight & Access */}
                                <div className="nephrology-dialysis-group">
                                    <div className="nephrology-dialysis-group-header">
                                    <span className="nephrology-dialysis-group-title">
                                        <Translate>Weight & Access</Translate>
                                    </span>

                                    <div className="nephrology-dialysis-group-line" />
                                    </div>

                                    <div className="nephrology-dialysis-row">
                                    <div className="nephrology-dialysis-field nephrology-dialysis-field--addon">
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
                                        setRecord={setForm}
                                        disabled={disabled}
                                        />
                                    </div>

                                    <div className="nephrology-dialysis-field nephrology-dialysis-field--addon">
                                        <MyInput
                                        width="100%"
                                        fieldName="targetWeight"
                                        fieldLabel="Target Weight"
                                        fieldType="number"
                                        allowDecimal
                                        showZero
                                        rightAddon="kg"
                                        rightAddonwidth="auto"
                                        record={form}
                                        setRecord={setForm}
                                        disabled={disabled}
                                        />
                                    </div>

                                    <div className="nephrology-dialysis-field">
                                        <MyInput
                                        width="100%"
                                        fieldName="dialysisAccess"
                                        fieldLabel="Dialysis Access"
                                        fieldType="select"
                                        selectData={dialysisAccessTypeOptions}
                                        selectDataLabel="label"
                                        selectDataValue="value"
                                        searchable={false}
                                        record={form}
                                        setRecord={setForm}
                                        disabled={disabled}
                                        />
                                    </div>

                                    <div className="nephrology-dialysis-field">
                                        <MyInput
                                        width="100%"
                                        fieldName="accessSite"
                                        fieldLabel="Access Site"
                                        fieldType="select"
                                        selectData={dialysisAccessSiteOptions}
                                        selectDataLabel="label"
                                        selectDataValue="value"
                                        searchable={false}
                                        record={form}
                                        setRecord={setForm}
                                        disabled={disabled}
                                        />
                                    </div>

                                    {form.accessSite === 'OTHER' && (
                                        <div className="nephrology-dialysis-field">
                                        <MyInput
                                            width="100%"
                                            fieldName="otherAccessSite"
                                            fieldLabel="Other Access Site"
                                            fieldType="text"
                                            record={form}
                                            setRecord={setForm}
                                            disabled={disabled}
                                        />
                                        </div>
                                    )}
                                    </div>
                                </div>

                                {/* Dialysis Prescription */}
                                <div className="nephrology-dialysis-group">
                                    <div className="nephrology-dialysis-group-header">
                                    <span className="nephrology-dialysis-group-title">
                                        <Translate>Dialysis Prescription</Translate>
                                    </span>

                                    <div className="nephrology-dialysis-group-line" />
                                    </div>

                                    <div className="nephrology-dialysis-row">
                                    <div className="nephrology-dialysis-field nephrology-dialysis-field--addon">
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
                                        setRecord={setForm}
                                        disabled={disabled}
                                        />
                                    </div>

                                    <div className="nephrology-dialysis-field nephrology-dialysis-field--addon">
                                        <MyInput
                                        width="100%"
                                        fieldName="dialysateFlow"
                                        fieldLabel="Dialysate Flow"
                                        fieldType="number"
                                        allowDecimal
                                        showZero
                                        rightAddon="mL/min"
                                        rightAddonwidth="auto"
                                        record={form}
                                        setRecord={setForm}
                                        disabled={disabled}
                                        />
                                    </div>

                                    <div className="nephrology-dialysis-field nephrology-dialysis-field--wide">
                                        <MyInput
                                        width="100%"
                                        fieldName="dialysate"
                                        fieldLabel="Dialysate"
                                        fieldType="text"
                                        placeholder="According to prescription"
                                        record={form}
                                        setRecord={setForm}
                                        disabled={disabled}
                                        />
                                    </div>
                                    </div>
                                </div>

                                {/* Clinical Assignment */}
                                <div className="nephrology-dialysis-group">
                                    <div className="nephrology-dialysis-group-header">
                                    <span className="nephrology-dialysis-group-title">
                                        <Translate>Clinical Assignment</Translate>
                                    </span>

                                    <div className="nephrology-dialysis-group-line" />
                                    </div>

                                    <div className="nephrology-dialysis-row">
                                    <div className="nephrology-dialysis-field nephrology-dialysis-field--doctor">
                                        <MyInput
                                        width="100%"
                                        fieldLabel="Nephrologist"
                                        fieldName="nephrologistId"
                                        fieldType="select"
                                        selectData={physicians}
                                        selectDataLabel={['firstName', 'lastName']}
                                        selectDataValue="id"
                                        searchable
                                        loading={loadingPractitioners}
                                        record={form}
                                        setRecord={setForm}
                                        disabled={disabled}
                                        />

                                        {practitionerError && (
                                        <Message type="error">
                                            <Translate>
                                            Unable to load doctors.
                                            </Translate>
                                        </Message>
                                        )}
                                    </div>

                                    <div className="nephrology-dialysis-field">
                                        <MyDateHijriInput
                                        width="100%"
                                        fieldLabel="Start Date"
                                        fieldName="startDate"
                                        record={form}
                                        setRecord={setForm}
                                        disabled={disabled}
                                        />
                                    </div>

                                    <div className="nephrology-dialysis-field">
                                        <MyInput
                                        width="100%"
                                        fieldLabel="Status"
                                        fieldName="status"
                                        fieldType="select"
                                        selectData={dialysisRegistrationStatusOptions}
                                        selectDataLabel="label"
                                        selectDataValue="value"
                                        searchable={false}
                                        record={form}
                                        setRecord={setForm}
                                        disabled={disabled}
                                        />
                                    </div>
                                    </div>
                                </div>

                                </div>
                            </div>
                            )}
                        </Form>
                        </div>

                        {/* Treatment Plans Table - Bottom */}
                        <div className="nephrology-treatment-group nephrology-treatment-history">
                        <div className="nephrology-treatment-group-header">
                            <span className="nephrology-treatment-group-title">
                            <Translate>Treatment Plans</Translate>
                            </span>

                            <div className="nephrology-treatment-group-line" />
                        </div>

                        {treatmentPlansError ? (
                            <Message type="error">
                            <Translate>
                                Unable to load treatment plans.
                            </Translate>
                            </Message>
                        ) : (
                            <div className="nephrology-treatment-table">
                            <MyTable
                                data={treatmentPlans}
                                columns={treatmentPlanColumns}
                                loading={loadingTreatmentPlans}
                                height={280}
                                page={treatmentPlansPage}
                                rowsPerPage={treatmentPlansRowsPerPage}
                                totalCount={treatmentPlansTotalCount}
                                onPageChange={(_event, newPage) =>
                                setTreatmentPlansPage(newPage)
                                }
                                onRowsPerPageChange={event => {
                                setTreatmentPlansRowsPerPage(
                                    Number(event.target.value)
                                );
                                setTreatmentPlansPage(0);
                                }}
                                onRowClick={row =>
                                requestEditTreatmentPlan(
                                    row as NephrologyTreatmentPlan
                                )
                                }
                                rowClassName={(row: any) =>
                                Number(row?.id) ===
                                Number(selectedTreatmentPlanId)
                                    ? 'nephrology-treatment-row--selected'
                                    : ''
                                }
                            />
                            </div>
                        )}
                        </div>

                    </div>
                    }
                />
                </div>


            </div>

            <FieldAuditHistoryModal
                open={historyOpen}
                setOpen={setHistoryOpen}
                audit={audit}
                fieldName={selectedAuditField}
            />

            <Modal
                open={pendingPlanAction != null}
                onClose={() => setPendingPlanAction(null)}
            >
                <Modal.Header>
                    <Modal.Title>
                        <Translate>Unsaved Treatment Plan Changes</Translate>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Translate>
                        You have unsaved Treatment Plan changes. Discard them
                        and continue?
                    </Translate>
                </Modal.Body>
                <Modal.Footer>
                    <MyButton onClick={() => setPendingPlanAction(null)}>
                        <Translate>Cancel</Translate>
                    </MyButton>
                    <MyButton onClick={confirmPendingPlanAction}>
                        <Translate>Discard and Continue</Translate>
                    </MyButton>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

const NephrologyAssessment = (props: EncounterContext) => {
    const location = useLocation();
    const outlet = useOutletContext<EncounterContext>();

    const state = (location.state ?? {}) as EncounterContext;

    const patient = props.patient ?? state.patient ?? outlet?.patient;
    const encounter = props.encounter ?? state.encounter ?? outlet?.encounter;

    const viewMode =
        props.viewMode ??
        state.viewMode ??
        outlet?.viewMode;

    const onDiagnosisSaved =
        props.onDiagnosisSaved ??
        state.onDiagnosisSaved ??
        outlet?.onDiagnosisSaved;

    const disabled = Boolean(
        viewMode === 'readOnly' ||
        (props.readOnly ?? state.readOnly ?? outlet?.readOnly) ||
        (props.edit ?? state.edit ?? outlet?.edit) ||
        patient?.patientStatus === 'MERGED' ||
        encounter?.status === 'COMPLETED' ||
        encounter?.status === 'CANCELLED'
    );

    const dir =
        localStorage.getItem('direction')?.toLowerCase() === 'rtl'
            ? 'rtl'
            : 'ltr';

    const hasContext =
        Number(patient?.id) > 0 &&
        Number(encounter?.id) > 0;

    return (
        <div
            dir={dir}
            className="nephrology-assessment"
        >
            {hasContext ? (
                <NephrologySheet
                    key={`${patient.id}:${encounter.id}`}
                    patient={patient}
                    encounter={encounter}
                    disabled={disabled}
                    onDiagnosisSaved={onDiagnosisSaved}
                />
            ) : (
                <Message type="info">
                    <Translate>
                        Open Nephrology Assessment from a patient encounter.
                    </Translate>
                </Message>
            )}
        </div>
    );
};

export default NephrologyAssessment;