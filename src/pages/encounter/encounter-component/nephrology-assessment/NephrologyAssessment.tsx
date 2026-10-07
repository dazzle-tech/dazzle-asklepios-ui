import React, { useEffect, useState } from 'react';

import { useLocation, useOutletContext } from 'react-router-dom';

import { Form, Message } from 'rsuite';

import MyInput from '@/components/MyInput';
import MyDateHijriInput from '@/components/MyDateHijriInput/MyDateHijriInput';
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

import type { Patient, PatientEncounter } from '@/types/model-types-new';

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
    useGetNephrologyTreatmentPlanQuery,
    useUpdateNephrologyTreatmentPlanMutation
} from '@/services/dialysis/nephrologyTreatmentPlanService';

import { useEnumOptions } from '@/services/enumsApi';

import './styles.less';
import MyButton from '@/components/MyButton/MyButton';

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

    const patientId = Number(patient.id);
    const encounterId = Number(encounter.id);

    const ckdStageOptions = useEnumOptions('CkdStage');
    const kidneyConditionOptions = useEnumOptions('KidneyCondition');
    const kidneyDiseaseCauseOptions = useEnumOptions('KidneyDiseaseCause');
    const dialysisTreatmentTypeOptions = useEnumOptions('DialysisTreatmentType');
    const dialysisScheduleDayOptions = useEnumOptions('DialysisScheduleDay');
    const dialysisAccessTypeOptions = useEnumOptions('DialysisAccessType');
    const dialysisAccessSiteOptions = useEnumOptions('DialysisAccessSite');
    const dialysisRegistrationStatusOptions = useEnumOptions('DialysisRegistrationStatus');

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
        isFetching: loadingRenalFunction
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

    const {
        data: treatmentPlan,
        isFetching: loadingTreatmentPlan
    } = useGetNephrologyTreatmentPlanQuery(
        {
            patientId,
            encounterId
        },
        {
            skip: !patientId || !encounterId
        }
    );

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

        try {
            const body = {
                treatmentType: form.treatmentType || null,
                frequency: toInteger(form.frequency),
                schedule: form.schedule?.length ? form.schedule : null,
                dialysisDuration: toMeasurement(form.dialysisDuration),
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

            if (treatmentPlan?.id) {
                await updateTreatmentPlan({
                    id: Number(treatmentPlan.id),
                    ...body
                }).unwrap();
            } else {
                await createTreatmentPlan({
                    patientId,
                    encounterId,
                    ...body
                }).unwrap();
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
        if (!renalFunction) {
            return;
        }

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
        if (!treatmentPlan) {
            return;
        }

        setForm(prev => ({
            ...prev,
            treatmentType: treatmentPlan.treatmentType ?? '',
            frequency: treatmentPlan.frequency ?? null,
            schedule: treatmentPlan.schedule ?? [],
            dialysisDuration: treatmentPlan.dialysisDuration ?? null,
            dryWeight: treatmentPlan.dryWeight ?? null,
            targetWeight: treatmentPlan.targetWeight ?? null,
            dialysisAccess: treatmentPlan.dialysisAccess ?? '',
            accessSite: treatmentPlan.accessSite ?? '',
            otherAccessSite: treatmentPlan.otherAccessSite ?? '',
            bloodFlowRate: treatmentPlan.bloodFlowRate ?? null,
            dialysateFlow: treatmentPlan.dialysateFlow ?? null,
            dialysate: treatmentPlan.dialysate ?? '',
            nephrologistId: treatmentPlan.nephrologistId ?? null,
            startDate: treatmentPlan.startDate ?? null,
            status: treatmentPlan.status ?? ''
        }));
    }, [treatmentPlan]);

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
                                                    setRecord={setForm}
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
                                                    setRecord={setForm}
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
                                                    setRecord={setForm}
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
                            <MyButton
                                size="small"
                                onClick={saveTreatmentPlan}
                                disabled={
                                    disabled ||
                                    savingTreatmentPlan ||
                                    loadingTreatmentPlan
                                }
                            >
                                {savingTreatmentPlan ? (
                                    <Translate>Saving...</Translate>
                                ) : (
                                    <Translate>Save</Translate>
                                )}
                            </MyButton>
                        }
                        content={
                            <div className="nephrology-treatment-content">
                                <div className="nephrology-treatment-group">
                                    <div className="nephrology-treatment-group-header">
                                        <span className="nephrology-treatment-group-title">
                                            <Translate>Treatment Selection</Translate>
                                        </span>

                                        <div className="nephrology-treatment-group-line" />
                                    </div>

                                    <Form fluid>
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
                                    </Form>
                                </div>
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

                                        <Form fluid>
                                            <div className="nephrology-dialysis-content">

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
                                                    </div>
                                                </div>

                                                <div className="nephrology-dialysis-group">
                                                    <div className="nephrology-dialysis-group-header">
                                                        <span className="nephrology-dialysis-group-title">
                                                            <Translate>Weight & Access</Translate>
                                                        </span>

                                                        <div className="nephrology-dialysis-group-line" />
                                                    </div>

                                                    <div className="nephrology-dialysis-row">
                                                        <div className="nephrology-dialysis-field">
                                                            <MyInput
                                                                width="100%"
                                                                fieldName="dryWeight"
                                                                fieldLabel="Dry Weight"
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
                                                                fieldName="targetWeight"
                                                                fieldLabel="Target Weight"
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

                                                <div className="nephrology-dialysis-group">
                                                    <div className="nephrology-dialysis-group-header">
                                                        <span className="nephrology-dialysis-group-title">
                                                            <Translate>Dialysis Prescription</Translate>
                                                        </span>

                                                        <div className="nephrology-dialysis-group-line" />
                                                    </div>

                                                    <div className="nephrology-dialysis-row">
                                                        <div className="nephrology-dialysis-field">
                                                            <MyInput
                                                                width="100%"
                                                                fieldName="bloodFlowRate"
                                                                fieldLabel="Blood Flow Rate"
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
                                                                fieldName="dialysateFlow"
                                                                fieldLabel="Dialysate Flow"
                                                                fieldType="number"
                                                                allowDecimal
                                                                showZero
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
                                        </Form>
                                    </div>
                                )}
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