import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { Form, Message } from 'rsuite';

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
import {
    useCreateDialysisSessionMutation,
    useGetDialysisSessionQuery,
    useUpdateDialysisSessionMutation
} from '@/services/dialysis/dialysisSessionService';
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

import type {
    DialysisFlowReading,
    DialysisMedication,
    Patient,
    PatientEncounter
} from '@/types/model-types-new';

import './styles.less';

type EncounterContext = {
    patient?: Patient;
    encounter?: PatientEncounter;
    edit?: boolean;
    readOnly?: boolean;
    viewMode?: string;
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

const DialysisSession = () => {
    const location = useLocation();
    const outletContext = useOutletContext<EncounterContext>();

    const state = (location.state ?? {}) as EncounterContext;

    const patient = state.patient ?? outletContext?.patient;

    const encounter = state.encounter ?? outletContext?.encounter;

    const viewMode = state.viewMode ?? outletContext?.viewMode;

    const disabled = Boolean(
        viewMode === 'readOnly' ||
        (state.readOnly ?? outletContext?.readOnly) ||
        (state.edit ?? outletContext?.edit) ||
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
    const complicationOptions = useEnumOptions('DialysisComplication', {
        labelOverrides: dialysisComplicationLabelOverrides
    });

    const [form, setForm] = useState(initialSessionForm);

    const [flowEntry, setFlowEntry] = useState(initialFlowEntry);

    const [knownSessionId, setKnownSessionId] = useState<number | null>(null);

    const {
        data: dialysisSession,
        isFetching: loadingDialysisSession,
        isSuccess: dialysisSessionLoaded,
        isError: dialysisSessionFailed
    } = useGetDialysisSessionQuery(
        {
            patientId,
            encounterId
        },
        {
            skip: !patient?.id || !encounter?.id
        }
    );

    const [createDialysisSession, { isLoading: creatingDialysisSession }] =
        useCreateDialysisSessionMutation();

    const [updateDialysisSession, { isLoading: updatingDialysisSession }] =
        useUpdateDialysisSessionMutation();

    const savingDialysisSession =
        creatingDialysisSession || updatingDialysisSession;

    const activeSessionId = dialysisSession?.id
        ? Number(dialysisSession.id)
        : knownSessionId;

    const {
        data: flowReadings = [],
        isFetching: loadingFlowReadings
    } = useGetDialysisFlowReadingsByDialysisSessionIdQuery(
        {
            dialysisSessionId: activeSessionId ?? 0
        },
        {
            skip: !activeSessionId
        }
    );

    const [createDialysisFlowReading, { isLoading: creatingFlowReading }] =
        useCreateDialysisFlowReadingMutation();

    const [deleteDialysisFlowReading, { isLoading: deletingFlowReading }] =
        useDeleteDialysisFlowReadingMutation();

    const {
        data: dialysisMedications = [],
        isFetching: loadingDialysisMedications
    } = useGetDialysisMedicationsByDialysisSessionIdQuery(
        {
            dialysisSessionId: activeSessionId ?? 0
        },
        {
            skip: !activeSessionId
        }
    );

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

    const unitMap = useMemo(() => {
        const map: Record<string, string> = {};

        (unitLov?.object || []).forEach((item: { key?: string | number; lovDisplayVale?: string }) => {
            map[String(item.key)] = item.lovDisplayVale ?? '';
        });

        return map;
    }, [unitLov]);

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

    const section02Initialized = useRef(false);
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

    useEffect(() => {
        loadedSessionId.current = null;
        setKnownSessionId(null);
        creatingSessionRef.current = null;
        section02Initialized.current = false;
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

    const setSection02Form = (
        next:
            | typeof initialSessionForm
            | ((previous: typeof initialSessionForm) => typeof initialSessionForm)
    ) => {
        setForm(previous => {
            const record =
                typeof next === 'function' ? next(previous) : next;

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
            const record =
                typeof next === 'function' ? next(previous) : next;

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

    const persistDialysisSession = async (): Promise<number | null> => {
        if (!patient?.id || !encounter?.id) {
            return null;
        }

        if (
            loadingDialysisSession &&
            loadedSessionId.current == null &&
            !dialysisSession?.id
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

        const existingSessionId = dialysisSession?.id
            ? Number(dialysisSession.id)
            : loadedSessionId.current;

        if (existingSessionId) {
            await updateDialysisSession({
                id: existingSessionId,
                ...body
            }).unwrap();

            return existingSessionId;
        }

        if (creatingSessionRef.current) {
            return creatingSessionRef.current;
        }

        const requestPatientId = patient.id;
        const requestEncounterId = encounter.id;

        const createPromise = (async (): Promise<number | null> => {
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
                    setKnownSessionId(createdId);
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
        if (disabled || savingDialysisSession) {
            return;
        }

        if (!patient?.id || !encounter?.id) {
            return;
        }

        try {
            await persistDialysisSession();

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
        if (disabled || savingDialysisSession) {
            return;
        }

        if (!patient?.id || !encounter?.id) {
            return;
        }

        try {
            await persistDialysisSession();

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
        if (disabled || savingDialysisSession) {
            return;
        }

        if (!patient?.id || !encounter?.id) {
            return;
        }

        try {
            await persistDialysisSession();

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
        if (disabled || savingDialysisSession) {
            return;
        }

        if (!patient?.id || !encounter?.id) {
            return;
        }

        try {
            await persistDialysisSession();

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
        if (disabled || savingDialysisSession) {
            return;
        }

        if (!patient?.id || !encounter?.id) {
            return;
        }

        try {
            await persistDialysisSession();

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
        if (disabled || savingDialysisSession) {
            return;
        }

        if (!patient?.id || !encounter?.id) {
            return;
        }

        try {
            await persistDialysisSession();

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
        if (!dialysisSession) {
            return;
        }

        setForm(prev => ({
            ...prev,
            chairStation: dialysisSession.chairStation ?? '',
            machine: dialysisSession.machine ?? '',
            date: dialysisSession.date ?? null,
            startTime: dialysisSession.startTime ?? null,
            endTime: dialysisSession.endTime ?? null,
            shift: dialysisSession.shift ?? '',
            assignedNurseId: dialysisSession.assignedNurseId ?? null,
            nephrologistId: dialysisSession.nephrologistId ?? null
        }));
    }, [dialysisSession]);

    const sessionSkipped = !patient?.id || !encounter?.id;
    const section02SourcesReady =
        sessionSkipped || dialysisSessionLoaded || dialysisSessionFailed;

    useEffect(() => {
        if (
            section02Initialized.current ||
            !patient?.id ||
            !encounter?.id ||
            !section02SourcesReady
        ) {
            return;
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

            return {
                ...previous,
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
                interdialyticWeightGain: initialValue(
                    'interdialyticWeightGain',
                    dialysisSession?.interdialyticWeightGain,
                    null
                ) as number | null,
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
                ufDifference: initialSection07(
                    'ufDifference',
                    dialysisSession?.ufDifference,
                    null
                ) as number | null,
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
        });

        section02Initialized.current = true;
    }, [
        section02SourcesReady,
        patient?.id,
        encounter?.id,
        dialysisSession
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
            disabled ||
            creatingFlowReading ||
            deletingFlowReading ||
            savingDialysisSession
        ) {
            return;
        }

        if (!patient?.id || !encounter?.id) {
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

        if (
            loadingDialysisSession &&
            !dialysisSession?.id &&
            knownSessionId == null
        ) {
            return;
        }

        try {
            const currentSessionId = dialysisSession?.id
                ? Number(dialysisSession.id)
                : knownSessionId ?? loadedSessionId.current;

            const sessionId = currentSessionId
                ? currentSessionId
                : await persistDialysisSession();

            if (!sessionId) {
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
        if (disabled || deletingFlowReading || !row.id) {
            return;
        }

        const sessionId = row.dialysisSessionId || activeSessionId;

        if (!sessionId) {
            return;
        }

        try {
            await deleteDialysisFlowReading({
                id: row.id,
                dialysisSessionId: sessionId
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
            title: <Translate>UF Rate</Translate>,
            minWidth: 110,
            render: (row: DialysisFlowReading) =>
                displayReadingValue(row.ufRate)
        },
        {
            key: 'ufRemoved',
            title: <Translate>UF Removed</Translate>,
            minWidth: 120,
            render: (row: DialysisFlowReading) =>
                displayReadingValue(row.ufRemoved)
        },
        {
            key: 'arterialPressure',
            title: <Translate>AP</Translate>,
            minWidth: 90,
            render: (row: DialysisFlowReading) =>
                displayReadingValue(row.arterialPressure)
        },
        {
            key: 'venousPressure',
            title: <Translate>VP</Translate>,
            minWidth: 90,
            render: (row: DialysisFlowReading) =>
                displayReadingValue(row.venousPressure)
        },
        {
            key: 'transmembranePressure',
            title: <Translate>TMP</Translate>,
            minWidth: 90,
            render: (row: DialysisFlowReading) =>
                displayReadingValue(row.transmembranePressure)
        },
        {
            key: 'actions',
            title: <Translate>Actions</Translate>,
            minWidth: 100,
            render: (row: DialysisFlowReading) =>
                disabled ? null : (
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
            disabled ||
            creatingDialysisMedication ||
            deletingDialysisMedication ||
            savingDialysisSession
        ) {
            return;
        }

        if (!patient?.id || !encounter?.id) {
            return;
        }

        if (
            form.activeIngredientId === null ||
            form.activeIngredientId === undefined
        ) {
            return;
        }

        if (
            loadingDialysisSession &&
            !dialysisSession?.id &&
            knownSessionId == null
        ) {
            return;
        }

        try {
            const currentSessionId = dialysisSession?.id
                ? Number(dialysisSession.id)
                : knownSessionId ?? loadedSessionId.current;

            const sessionId = currentSessionId
                ? currentSessionId
                : await persistDialysisSession();

            if (!sessionId) {
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
        if (disabled || deletingDialysisMedication || !row.id) {
            return;
        }

        const sessionId = row.dialysisSessionId || activeSessionId;

        if (!sessionId) {
            return;
        }

        try {
            await deleteDialysisMedication({
                id: row.id,
                dialysisSessionId: sessionId
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
                disabled ? null : (
                    <MyButton
                        onClick={() => handleDeleteMedication(row)}
                    >
                        <Translate>Delete</Translate>
                    </MyButton>
                )
        }
    ];

    return (
        <div className="dialysis-session">
            <div className="dialysis-session-sections">
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
                                    disabled ||
                                    savingDialysisSession ||
                                    loadingDialysisSession
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
                                                    disabled={disabled}
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
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyDateHijriInput
                                                    fieldName="date"
                                                    fieldLabel="Date"
                                                    record={form}
                                                    setRecord={setForm}
                                                    disabled={disabled}
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
                                                    disabled={disabled}
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
                                                    disabled={disabled}
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
                                                    disabled={disabled}
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
                                                    disabled={disabled}
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

                                            <div className="dialysis-session-field dialysis-session-field--empty" />
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
                                    disabled ||
                                    savingDialysisSession ||
                                    loadingDialysisSession
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
                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="preWeight"
                                                    fieldLabel="Pre Weight"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="dryWeight"
                                                    fieldLabel="Dry Weight"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="weightGain"
                                                    fieldLabel="Weight Gain"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="interdialyticWeightGain"
                                                    fieldLabel="Interdialytic Weight Gain Kg"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={disabled}
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
                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="bloodPressureSystolic"
                                                    fieldType="number"
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="bloodPressureDiastolic"
                                                    fieldType="number"
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="heartRate"
                                                    fieldType="number"
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="temperature"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="respiratoryRate"
                                                    fieldLabel="R.R"
                                                    fieldType="number"
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="oxygenSaturation"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection02Form}
                                                    disabled={disabled}
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
                                                    disabled={disabled}
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
                                                    disabled={disabled}
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
                                                    disabled={disabled}
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
                                    disabled ||
                                    savingDialysisSession ||
                                    loadingDialysisSession
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
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="bloodFlowRate"
                                                    fieldLabel="Blood Flow Rate"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="dialysateFlowRate"
                                                    fieldLabel="Dialysate Flow Rate"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="ultrafiltrationGoal"
                                                    fieldLabel="Ultrafiltration Goal"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={disabled}
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

                                        <div className="dialysis-session-row">
                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="dialysateComposition"
                                                    fieldLabel="Dialysate Composition"
                                                    fieldType="text"
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="sodium"
                                                    fieldLabel="Sodium"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="potassium"
                                                    fieldLabel="Potassium"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="calcium"
                                                    fieldLabel="Calcium"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="dialysisTemperature"
                                                    fieldLabel="Temperature"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={disabled}
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
                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="heparinDose"
                                                    fieldLabel="Heparin Dose"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="anticoagulation"
                                                    fieldLabel="Anticoagulation"
                                                    fieldType="select"
                                                    selectData={dialysisAnticoagulationOptions}
                                                    selectDataLabel="label"
                                                    selectDataValue="value"
                                                    searchable={false}
                                                    record={form}
                                                    setRecord={setSection03Form}
                                                    disabled={disabled}
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
                                                        disabled={disabled}
                                                    />
                                                </div>
                                            )}

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="targetDryWeight"
                                                    fieldLabel="Target Dry Weight"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection03Form}
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
                                        Intra-dialysis monitoring and treatment measurements
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
                                                fieldName="time"
                                                fieldLabel="Time"
                                                fieldType="time"
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={disabled}
                                            />
                                        </div>

                                        <div className="dialysis-session-field">
                                            <MyInput
                                                width="100%"
                                                fieldName="bloodPressureSystolic"
                                                fieldLabel="Blood Pressure Systolic"
                                                fieldType="number"
                                                showZero
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={disabled}
                                            />
                                        </div>

                                        <div className="dialysis-session-field">
                                            <MyInput
                                                width="100%"
                                                fieldName="bloodPressureDiastolic"
                                                fieldLabel="Blood Pressure Diastolic"
                                                fieldType="number"
                                                showZero
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={disabled}
                                            />
                                        </div>

                                        <div className="dialysis-session-field">
                                            <MyInput
                                                width="100%"
                                                fieldName="pulse"
                                                fieldLabel="Pulse"
                                                fieldType="number"
                                                showZero
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={disabled}
                                            />
                                        </div>
                                    </div>

                                    <div className="dialysis-session-row dialysis-session-row--spaced">
                                        <div className="dialysis-session-field">
                                            <MyInput
                                                width="100%"
                                                fieldName="ufRate"
                                                fieldLabel="UF Rate"
                                                fieldType="number"
                                                allowDecimal
                                                showZero
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={disabled}
                                            />
                                        </div>

                                        <div className="dialysis-session-field">
                                            <MyInput
                                                width="100%"
                                                fieldName="ufRemoved"
                                                fieldLabel="UF Removed"
                                                fieldType="number"
                                                allowDecimal
                                                showZero
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={disabled}
                                            />
                                        </div>

                                        <div className="dialysis-session-field">
                                            <MyInput
                                                width="100%"
                                                fieldName="arterialPressure"
                                                fieldLabel="AP"
                                                fieldType="number"
                                                allowDecimal
                                                allowNegative
                                                showZero
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={disabled}
                                            />
                                        </div>

                                        <div className="dialysis-session-field">
                                            <MyInput
                                                width="100%"
                                                fieldName="venousPressure"
                                                fieldLabel="VP"
                                                fieldType="number"
                                                allowDecimal
                                                allowNegative
                                                showZero
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={disabled}
                                            />
                                        </div>
                                    </div>

                                    <div className="dialysis-session-row dialysis-session-row--spaced">
                                        <div className="dialysis-session-field">
                                            <MyInput
                                                width="100%"
                                                fieldName="transmembranePressure"
                                                fieldLabel="TMP"
                                                fieldType="number"
                                                allowDecimal
                                                allowNegative
                                                showZero
                                                record={flowEntry}
                                                setRecord={setFlowEntry}
                                                disabled={disabled}
                                            />
                                        </div>
                                    </div>
                                </Form>

                                {!disabled && (
                                    <div className="dialysis-session-actions">
                                        <MyButton onClick={handleAddFlowEntry}>
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
                                        Vascular access type and condition assessment
                                    </span>
                                </div>
                            </div>
                        }
                        action={
                            <MyButton
                                size="small"
                                onClick={saveDialysisAccess}
                                disabled={
                                    disabled ||
                                    savingDialysisSession ||
                                    loadingDialysisSession
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
                                                    disabled={disabled}
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
                                                    disabled={disabled}
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
                                                        disabled={disabled}
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
                                                    disabled={disabled}
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
                                                    disabled={disabled}
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
                                                    disabled={disabled}
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
                                                    disabled={disabled}
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
                                                    disabled={disabled}
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
                                                disabled={disabled}
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
                                                disabled={disabled}
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
                                                disabled={disabled}
                                            />
                                        </div>
                                    </div>
                                </Form>

                                {!disabled && (
                                    <div className="dialysis-session-actions">
                                        <MyButton onClick={handleAddMedication}>
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
                                    disabled ||
                                    savingDialysisSession ||
                                    loadingDialysisSession
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
                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="postWeight"
                                                    fieldLabel="Post Weight"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="postBloodPressureSystolic"
                                                    fieldLabel="Post BP Systolic"
                                                    fieldType="number"
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="postBloodPressureDiastolic"
                                                    fieldLabel="Post BP Diastolic"
                                                    fieldType="number"
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="postPulse"
                                                    fieldLabel="Pulse"
                                                    fieldType="number"
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="postTemperature"
                                                    fieldLabel="Temperature"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={disabled}
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
                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="totalUfRemoved"
                                                    fieldLabel="Total UF Removed"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="actualTreatmentDuration"
                                                    fieldLabel="Treatment Duration"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={disabled}
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
                                                    disabled={disabled}
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
                                                    disabled={disabled}
                                                />
                                            </div>
                                        </div>

                                        <div className="dialysis-session-row dialysis-session-row--spaced">
                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="postComplications"
                                                    fieldLabel="Complications"
                                                    fieldType="textarea"
                                                    rows={3}
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={disabled}
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
                                                    disabled={disabled}
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
                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="targetUf"
                                                    fieldLabel="Target UF"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="actualUf"
                                                    fieldLabel="Actual UF"
                                                    fieldType="number"
                                                    allowDecimal
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection07Form}
                                                    disabled={disabled}
                                                />
                                            </div>

                                            <div className="dialysis-session-field">
                                                <MyInput
                                                    width="100%"
                                                    fieldName="ufDifference"
                                                    fieldLabel="Difference"
                                                    fieldType="number"
                                                    allowDecimal
                                                    allowNegative
                                                    showZero
                                                    record={form}
                                                    setRecord={setSection07Form}
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
                                        Complications and events recorded during treatment
                                    </span>
                                </div>
                            </div>
                        }
                        action={
                            <MyButton
                                size="small"
                                onClick={saveDialysisComplications}
                                disabled={
                                    disabled ||
                                    savingDialysisSession ||
                                    loadingDialysisSession
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
                                                    disabled={disabled}
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
                                                disabled={disabled}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Form>
                        }
                    />
                </div>

            </div>
        </div>
    );
};

export default DialysisSession;