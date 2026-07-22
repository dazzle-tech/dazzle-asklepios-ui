export interface ConflictDecision {
    entityName: string;
    tableName: string;
    fromRecordId: any;
    toRecordId: any;
    matchKey: string;

    fieldName: string | null;
    fieldLabel: string;

    fieldType?: string | null;
    inputType?: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'LOV' | 'ENUM' | string | null;
    inputSource?: string | null;

    fromValue: any;
    toValue: any;

    suggestedDecision: string;
    finalDecision?: string;
    selectedValue?: any;
}

export interface MergePreviewModalProps {
    open: boolean;
    conflicts: any[];
    autoTransfers: any[];
    ruleConflicts: any[];

    onReviewSummary: (
        decisions: any[],
        reason: string,
        conflicts: any[],
        autoTransfers: any[]
    ) => void;


    onConfirmMerge: (
        decisions: any[],
        reason: string,
        ruleDecisions: Record<string, string>
    ) => void;

    onCancel: () => void;

    loading?: boolean;
    showSummary?: boolean;
    summaryData?: any;
    onBackToConflicts?: () => void;
}


export interface PatientMergeDecisionPayload {
    entityName: string;
    tableName: string;
    fromRecordId: any;
    toRecordId: any;
    matchKey: string;
    fieldName: string | null;
    fieldLabel: string;
    fromValue: any;
    toValue: any;
    suggestedDecision: string;
    finalDecision?: string;
    selectedValue?: any;
}