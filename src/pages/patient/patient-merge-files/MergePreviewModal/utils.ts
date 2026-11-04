import {
    faEdit,
    faArrowRight,
    faPlus,
    faTimes,
    faList
} from '@fortawesome/free-solid-svg-icons';

import { ConflictDecision ,PatientMergeDecisionPayload} from './types';

export const getEntityLabel = (entityName: string) => {
    const labels: Record<string, string> = {
        PATIENT: 'Patient Basic Information',
        PATIENT_DOCUMENT: 'Documents',
        PATIENT_ADDRESS: 'Addresses',
        PATIENT_PHONE: 'Phone Numbers',
        PATIENT_EMAIL: 'Email Addresses',
        PATIENT_INSURANCE: 'Insurance',
        ENCOUNTER: 'Encounters',
        APPOINTMENT: 'Appointments',
        MEDICATION: 'Medications'
    };

    return labels[entityName] || entityName;
};

export const getDecisionOptions = (conflict: ConflictDecision) => {
    if (conflict.fieldName) {
        return [
            { label: 'Keep Target Value', value: 'KEEP_TO' },
            { label: 'Use Source Value', value: 'TAKE_FROM' },
            { label: 'Manual Entry', value: 'MANUAL' }
        ];
    }

    return [
        { label: 'Add to Target Patient', value: 'ADD_FROM_RECORD' },
        { label: 'Ignore This Record', value: 'IGNORE_FROM_RECORD' }
    ];
};

export const getSectionIcon = (sectionTitle: string) => {
    switch (sectionTitle) {
        case 'Field Updates':
            return faEdit;
        case 'Auto Transfers':
            return faArrowRight;
        case 'Records To Add':
            return faPlus;
        case 'Ignored Items':
            return faTimes;
        default:
            return faList;
    }
};

export const normalizeLovItems = (items: any[] = []) => {
    return items.map((item: any) => ({
        label:
            item.lovDisplayValue ??
            item.lovDisplayVale ,
        value:
            item.key
    }));
};

export const sanitizeDecisionsForApi = (
    items: ConflictDecision[]
): PatientMergeDecisionPayload[] => {
    return items.map(item => ({
        entityName: item.entityName,
        tableName: item.tableName,
        fromRecordId: item.fromRecordId,
        toRecordId: item.toRecordId,
        matchKey: item.matchKey,
        fieldName: item.fieldName,
        fieldLabel: item.fieldLabel,
        fromValue: item.fromValue,
        toValue: item.toValue,
        suggestedDecision: item.suggestedDecision,
        finalDecision: item.finalDecision,
        selectedValue: item.selectedValue
    }));
};