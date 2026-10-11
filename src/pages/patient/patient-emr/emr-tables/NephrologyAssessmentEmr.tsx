import React, { useEffect, useMemo, useState } from 'react';
import { Message } from 'rsuite';
import { skipToken } from '@reduxjs/toolkit/query';

import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import NephrologyAssessment from '@/pages/encounter/encounter-component/nephrology-assessment/NephrologyAssessment';
import { useGetEncountersByPatientQuery } from '@/services/encounters/patientEncounterService';
import { useGetNephrologyTreatmentPlansByPatientQuery } from '@/services/dialysis/nephrologyTreatmentPlanService';
import type { Patient, PatientEncounter } from '@/types/model-types-new';
import { formatDateWithoutSeconds } from '@/utils';

import './styles.less';

type Props = {
    patient: Patient;
};

const formatEncounterLabel = (encounter: PatientEncounter) => {
    const raw =
        encounter.encounterNumber ??
        (encounter as any).encounterNo ??
        encounter.id;

    if (raw == null) return '';

    const value = String(raw).trim();

    return /^E/i.test(value) ? value : `E${value}`;
};

const NephrologyAssessmentEmr: React.FC<Props> = ({ patient }) => {
    const patientId = Number(patient?.id);
    const [selectedEncounterId, setSelectedEncounterId] = useState<
        number | null
    >(null);

    const {
        data: encountersPage,
        isFetching: loadingEncounters,
        isError: encountersError
    } = useGetEncountersByPatientQuery(
        patientId
            ? {
                  patientId,
                  page: 0,
                  size: 100,
                  sort: 'createdDate,desc'
              }
            : skipToken
    );

    const { data: treatmentPlansPage } =
        useGetNephrologyTreatmentPlansByPatientQuery(
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

    const encountersWithDialysisContext = useMemo(() => {
        const planEncounterIds = new Set(
            (treatmentPlansPage?.data ?? [])
                .map(plan => Number(plan.encounterId))
                .filter(id => Number.isFinite(id) && id > 0)
        );

        if (!planEncounterIds.size) {
            return encounters;
        }

        const prioritized = encounters.filter(encounter =>
            planEncounterIds.has(Number(encounter.id))
        );

        return prioritized.length ? prioritized : encounters;
    }, [encounters, treatmentPlansPage?.data]);

    useEffect(() => {
        setSelectedEncounterId(null);
    }, [patientId]);

    useEffect(() => {
        if (!encountersWithDialysisContext.length) {
            setSelectedEncounterId(null);
            return;
        }

        setSelectedEncounterId(prev => {
            if (
                prev != null &&
                encountersWithDialysisContext.some(
                    encounter => Number(encounter.id) === Number(prev)
                )
            ) {
                return prev;
            }

            return Number(encountersWithDialysisContext[0].id);
        });
    }, [encountersWithDialysisContext]);

    const selectedEncounter = useMemo(
        () =>
            encountersWithDialysisContext.find(
                encounter => Number(encounter.id) === Number(selectedEncounterId)
            ) ?? null,
        [encountersWithDialysisContext, selectedEncounterId]
    );

    const encounterOptions = useMemo(
        () =>
            encountersWithDialysisContext.map(encounter => ({
                label: formatEncounterLabel(encounter),
                value: Number(encounter.id)
            })),
        [encountersWithDialysisContext]
    );

    const selectorRecord = {
        encounterId: selectedEncounterId
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

    if (!loadingEncounters && !encountersWithDialysisContext.length) {
        return (
            <Message type="info">
                <Translate>
                    No encounters found for Nephrology Assessment.
                </Translate>
            </Message>
        );
    }

    return (
        <div className="emr-dialysis-section">
            <div className="emr-dialysis-toolbar">
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
            </div>

            {selectedEncounter ? (
                <NephrologyAssessment
                    key={`nephrology-emr-${patientId}-${selectedEncounter.id}`}
                    patient={patient}
                    encounter={selectedEncounter}
                    readOnly
                    viewMode="readOnly"
                />
            ) : (
                <Message type="info">
                    <Translate>
                        Select an encounter to view saved Nephrology Assessment
                        data.
                    </Translate>
                </Message>
            )}
        </div>
    );
};

export default NephrologyAssessmentEmr;
