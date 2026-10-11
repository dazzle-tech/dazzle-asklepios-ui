import React, { useEffect, useMemo, useState } from 'react';
import { Message } from 'rsuite';
import { skipToken } from '@reduxjs/toolkit/query';

import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import DialysisSession from '@/pages/encounter/encounter-component/dialysis-session/DialysisSession';
import { useGetEncountersByPatientQuery } from '@/services/encounters/patientEncounterService';
import { useGetDialysisSessionsQuery } from '@/services/dialysis/dialysisSessionService';
import { useGetNephrologyTreatmentPlansByPatientQuery } from '@/services/dialysis/nephrologyTreatmentPlanService';
import { useEnumOptions } from '@/services/enumsApi';
import type {
    DialysisSession as DialysisSessionModel,
    NephrologyTreatmentPlan,
    Patient,
    PatientEncounter
} from '@/types/model-types-new';
import { formatDateWithoutSeconds } from '@/utils';

import './styles.less';

type Props = {
    patient: Patient;
};

const formatEncounterLabel = (encounter: PatientEncounter) => {
    return String(
        encounter.encounterNumber ??
        encounter.id ??
        ''
    );
};

const formatPlanLabel = (
    plan: NephrologyTreatmentPlan,
    _treatmentTypeLabel: (value?: string | null) => string
) => {
    return plan.id != null ? `Plan #${plan.id}` : 'Plan';
};

const formatSessionLabel = (session: DialysisSessionModel) => {
    return session.id != null ? `#${session.id}` : '';
};

const DialysisSessionEmr: React.FC<Props> = ({ patient }) => {
    const patientId = Number(patient?.id);
    const dialysisTreatmentTypeOptions = useEnumOptions('DialysisTreatmentType');

    const [selectedEncounterId, setSelectedEncounterId] = useState<
        number | null
    >(null);
    const [selectedTreatmentPlanId, setSelectedTreatmentPlanId] = useState<
        number | null
    >(null);
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
        null
    );

    const treatmentTypeLabel = (value?: string | null) => {
        if (value == null || value === '') {
            return '';
        }

        const match = dialysisTreatmentTypeOptions.find(
            option => String(option.value) === String(value)
        );

        return match?.label ? String(match.label) : String(value);
    };

    const {
        data: encountersPage,
        isFetching: loadingEncounters,
        isError: encountersError
    } = useGetEncountersByPatientQuery(
        patientId
            ? {
                  patientId,
                  page: 0,
                  size: 200,
                  sort: 'createdDate,desc'
              }
            : skipToken
    );

    const encounters = useMemo(
        () => encountersPage?.data ?? [],
        [encountersPage?.data]
    );

    const {
        data: treatmentPlansPage,
        isFetching: loadingPlans,
        isError: plansError
    } = useGetNephrologyTreatmentPlansByPatientQuery(
        patientId && selectedEncounterId
            ? {
                  patientId,
                  encounterId: selectedEncounterId,
                  page: 0,
                  size: 200,
                  sort: 'createdDate,desc'
              }
            : skipToken
    );

    const treatmentPlans = useMemo(() => {
        const rows = treatmentPlansPage?.data ?? [];

        return rows.filter(
            plan =>
                Number(plan.patientId) === patientId &&
                Number(plan.encounterId) === Number(selectedEncounterId) &&
                plan.isActive !== false
        );
    }, [treatmentPlansPage?.data, patientId, selectedEncounterId]);

    const {
        data: sessionsPage,
        isFetching: loadingSessions,
        isError: sessionsError
    } = useGetDialysisSessionsQuery(
        patientId && selectedEncounterId && selectedTreatmentPlanId
            ? {
                  patientId,
                  encounterId: selectedEncounterId,
                  treatmentPlanId: selectedTreatmentPlanId,
                  page: 0,
                  size: 100,
                  sort: 'lastModifiedDate,desc'
              }
            : skipToken
    );

    const sessions = useMemo(() => {
        const rows = sessionsPage?.data ?? [];

        return rows.filter(
            session =>
                Number(session.patientId) === patientId &&
                Number(session.encounterId) === Number(selectedEncounterId) &&
                Number(session.treatmentPlanId) ===
                    Number(selectedTreatmentPlanId)
        );
    }, [
        sessionsPage?.data,
        patientId,
        selectedEncounterId,
        selectedTreatmentPlanId
    ]);

    useEffect(() => {
        setSelectedEncounterId(null);
        setSelectedTreatmentPlanId(null);
        setSelectedSessionId(null);
    }, [patientId]);

    useEffect(() => {
        if (!encounters.length) {
            setSelectedEncounterId(null);
            return;
        }

        setSelectedEncounterId(prev => {
            if (
                prev != null &&
                encounters.some(
                    encounter => Number(encounter.id) === Number(prev)
                )
            ) {
                return prev;
            }

            return Number(encounters[0].id);
        });
    }, [encounters]);

    useEffect(() => {
        setSelectedTreatmentPlanId(null);
        setSelectedSessionId(null);
    }, [selectedEncounterId]);

    useEffect(() => {
        setSelectedSessionId(null);
    }, [selectedTreatmentPlanId]);

    useEffect(() => {
        if (!treatmentPlans.length) {
            setSelectedTreatmentPlanId(null);
            return;
        }

        setSelectedTreatmentPlanId(prev => {
            if (
                prev != null &&
                treatmentPlans.some(plan => Number(plan.id) === Number(prev))
            ) {
                return prev;
            }

            return Number(treatmentPlans[0].id);
        });
    }, [treatmentPlans]);

    useEffect(() => {
        if (!sessions.length) {
            setSelectedSessionId(null);
            return;
        }

        setSelectedSessionId(prev => {
            if (
                prev != null &&
                sessions.some(session => Number(session.id) === Number(prev))
            ) {
                return prev;
            }

            return Number(sessions[0].id);
        });
    }, [sessions]);

    const selectedEncounter = useMemo(
        () =>
            encounters.find(
                encounter => Number(encounter.id) === Number(selectedEncounterId)
            ) ?? null,
        [encounters, selectedEncounterId]
    );

    const selectedSession = useMemo(
        () =>
            sessions.find(
                session => Number(session.id) === Number(selectedSessionId)
            ) ?? null,
        [sessions, selectedSessionId]
    );

    const encounterOptions = useMemo(
        () =>
            encounters.map(encounter => ({
                label: formatEncounterLabel(encounter),
                value: Number(encounter.id)
            })),
        [encounters]
    );

    const planOptions = useMemo(
        () =>
            treatmentPlans.map(plan => ({
                label: formatPlanLabel(plan, treatmentTypeLabel),
                value: Number(plan.id)
            })),
        [treatmentPlans, dialysisTreatmentTypeOptions]
    );

    const sessionOptions = useMemo(
        () =>
            sessions.map(session => ({
                label: formatSessionLabel(session),
                value: Number(session.id)
            })),
        [sessions]
    );

    const selectorRecord = {
        encounterId: selectedEncounterId,
        treatmentPlanId: selectedTreatmentPlanId,
        sessionId: selectedSessionId
    };

    if (!patientId) {
        return (
            <Message type="info">
                <Translate>Select a patient to view Dialysis records.</Translate>
            </Message>
        );
    }

    if (encountersError) {
        return (
            <Message type="error">
                <Translate>Failed to load patient encounters.</Translate>
            </Message>
        );
    }

    if (!loadingEncounters && !encounters.length) {
        return (
            <Message type="info">
                <Translate>No encounters found for Dialysis Session.</Translate>
            </Message>
        );
    }

    return (
        <div className="emr-dialysis-section">
            <div className="emr-dialysis-toolbar emr-dialysis-toolbar--split">
                <MyInput
                    width="100%"
                    fieldName="encounterId"
                    fieldLabel="Encounter"
                    fieldType="select"
                    selectData={encounterOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={selectorRecord}
                    setRecord={(next: { encounterId?: number | null }) => {
                        const nextId = Number(next?.encounterId);
                        setSelectedEncounterId(
                            Number.isFinite(nextId) && nextId > 0 ? nextId : null
                        );
                    }}
                    disabled={loadingEncounters || !encounterOptions.length}
                />

                <MyInput
                    width="100%"
                    fieldName="treatmentPlanId"
                    fieldLabel="Treatment Plan"
                    fieldType="select"
                    selectData={planOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={selectorRecord}
                    setRecord={(next: { treatmentPlanId?: number | null }) => {
                        const nextId = Number(next?.treatmentPlanId);
                        setSelectedTreatmentPlanId(
                            Number.isFinite(nextId) && nextId > 0 ? nextId : null
                        );
                    }}
                    disabled={
                        !selectedEncounterId ||
                        loadingPlans ||
                        !planOptions.length
                    }
                />

                <MyInput
                    width="100%"
                    fieldName="sessionId"
                    fieldLabel="Dialysis Session"
                    fieldType="select"
                    selectData={sessionOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={selectorRecord}
                    setRecord={(next: { sessionId?: number | null }) => {
                        const nextId = Number(next?.sessionId);
                        setSelectedSessionId(
                            Number.isFinite(nextId) && nextId > 0 ? nextId : null
                        );
                    }}
                    disabled={
                        !selectedTreatmentPlanId ||
                        loadingSessions ||
                        !sessionOptions.length
                    }
                />
            </div>

            {plansError && selectedEncounterId != null && (
                <Message type="error" className="emr-dialysis-message">
                    <Translate>
                        Failed to load Treatment Plans for this encounter.
                    </Translate>
                </Message>
            )}

            {!loadingPlans &&
                selectedEncounterId != null &&
                !plansError &&
                !treatmentPlans.length && (
                    <Message type="info" className="emr-dialysis-message">
                        <Translate>
                            No Treatment Plans for this encounter.
                        </Translate>
                    </Message>
                )}

            {sessionsError && selectedTreatmentPlanId != null && (
                <Message type="error" className="emr-dialysis-message">
                    <Translate>
                        Failed to load Dialysis Sessions for this Treatment
                        Plan.
                    </Translate>
                </Message>
            )}

            {!loadingSessions &&
                selectedTreatmentPlanId != null &&
                !sessionsError &&
                !sessions.length && (
                    <Message type="info" className="emr-dialysis-message">
                        <Translate>
                            No saved Dialysis Sessions for this Treatment Plan.
                        </Translate>
                    </Message>
                )}

            {selectedEncounter &&
            selectedTreatmentPlanId != null &&
            selectedSession?.id != null ? (
                <DialysisSession
                    key={`dialysis-emr-${patientId}-${selectedEncounter.id}-${selectedTreatmentPlanId}-${selectedSession.id}`}
                    patient={patient}
                    encounter={selectedEncounter}
                    preferredSessionId={Number(selectedSession.id)}
                    preferredTreatmentPlanId={Number(selectedTreatmentPlanId)}
                    readOnly
                    viewMode="readOnly"
                />
            ) : null}
        </div>
    );
};

export default DialysisSessionEmr;
