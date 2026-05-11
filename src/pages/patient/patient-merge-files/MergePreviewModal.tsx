import React, { useState, useMemo } from 'react';
import { Modal, Button, Table, Form, Input, SelectPicker, Message, toaster } from 'rsuite';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faArrowRight, faPlus, faTimes, faList, faExclamationTriangle, faTag, faQuestionCircle, faCheck, faEye, faArrowLeft, faCheckCircle, faFileAlt, faCodeBranch } from '@fortawesome/free-solid-svg-icons';

interface ConflictDecision {
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

interface MergePreviewModalProps {
    open: boolean;
    conflicts: any[];
    autoTransfers?: any[];
    fromPatientId?: number;
    toPatientId?: number;
onReviewSummary: (
  decisions: any[],
  reason: string,
  autoTransfers: any[]
) => void; 
onConfirmMerge: (
  decisions: any[],
  reason: string,

) => void;    onCancel: () => void;
    loading?: boolean;
    showSummary?: boolean;
    summaryData?: any;
    onBackToConflicts?: () => void;
}

const MergePreviewModal: React.FC<MergePreviewModalProps> = ({
    open,
    conflicts = [],
    autoTransfers = [],
 
    onReviewSummary,
    onConfirmMerge,
    onCancel,
    loading = false,
    showSummary = false,
    summaryData,
    onBackToConflicts
}) => {
    const [reason, setReason] = useState('Duplicate patient record');
    const [decisions, setDecisions] = useState<ConflictDecision[]>([]);
    const [summaryDecisions, setSummaryDecisions] = useState<ConflictDecision[]>([]);
    const [summaryReason, setSummaryReason] = useState('');
    const [summaryAutoTransfers, setSummaryAutoTransfers] = useState<any[]>([]);
    // Group conflicts by entityName
    const groupedConflicts = useMemo(() => {
        const groups: Record<string, ConflictDecision[]> = {};

        conflicts.forEach(conflict => {
            const key = conflict.entityName || 'OTHER';
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(conflict);
        });

        return groups;
    }, [conflicts]);

    // Initialize decisions on modal open
    React.useEffect(() => {
        if (open && conflicts.length > 0) {
            const initialized = conflicts.map(conflict => ({
                ...conflict,
                finalDecision: conflict.suggestedDecision,
                selectedValue:
                    conflict.suggestedDecision === 'TAKE_FROM' ? conflict.fromValue :
                        conflict.suggestedDecision === 'KEEP_TO' ? conflict.toValue :
                            conflict.suggestedDecision === 'ADD_FROM_RECORD' ? conflict.matchKey || conflict.fromValue :
                                conflict.suggestedDecision === 'IGNORE_FROM_RECORD' ? conflict.matchKey || conflict.fromValue :
                                    null
            }));
            setDecisions(initialized);
        }
    }, [open, conflicts]);

    // Update decision for a conflict
    const handleDecisionChange = (index: number, finalDecision: string) => {
        const updated = [...decisions];
        updated[index].finalDecision = finalDecision;

        // Auto-set selectedValue based on decision
        if (finalDecision === 'TAKE_FROM') {
            updated[index].selectedValue = updated[index].fromValue;
        } else if (finalDecision === 'KEEP_TO') {
            updated[index].selectedValue = updated[index].toValue;
        } else if (finalDecision === 'ADD_FROM_RECORD') {
            updated[index].selectedValue = updated[index].matchKey || updated[index].fromValue;
        } else if (finalDecision === 'IGNORE_FROM_RECORD') {
            updated[index].selectedValue = updated[index].matchKey || updated[index].fromValue;
        }

        setDecisions(updated);
    };

    // Update selected value for manual entry
    const handleValueChange = (index: number, value: any) => {
        const updated = [...decisions];
        updated[index].selectedValue = value;
        setDecisions(updated);
    };

    // Check if all conflicts have decisions
    const allDecisionsComplete = useMemo(() => {
        return decisions.every(d => {
            if (!d.finalDecision) return false;
            if (d.finalDecision === 'MANUAL' && !d.selectedValue) return false;
            return true;
        });
    }, [decisions]);

    // Get display label for entity name
    const getEntityLabel = (entityName: string) => {
        const labels: Record<string, string> = {
            'PATIENT': 'Patient Basic Information',
            'PATIENT_DOCUMENT': 'Documents',
            'PATIENT_ADDRESS': 'Addresses',
            'PATIENT_PHONE': 'Phone Numbers',
            'PATIENT_EMAIL': 'Email Addresses',
            'PATIENT_INSURANCE': 'Insurance',
            'ENCOUNTER': 'Encounters',
            'APPOINTMENT': 'Appointments',
            'MEDICATION': 'Medications'
        };
        return labels[entityName] || entityName;
    };

    // Get decision options based on conflict type
    const getDecisionOptions = (conflict: ConflictDecision) => {
        if (conflict.fieldName) {
            // Field-level conflict
            return [
                { label: 'Keep Target Value', value: 'KEEP_TO' },
                { label: 'Use Source Value', value: 'TAKE_FROM' },
                { label: 'Manual Entry', value: 'MANUAL' }
            ];
        } else {
            // Record-level conflict
            return [
                { label: 'Add to Target Patient', value: 'ADD_FROM_RECORD' },
                { label: 'Ignore This Record', value: 'IGNORE_FROM_RECORD' }
            ];
        }
    };

    const handleReviewSummary = () => {
        if (!allDecisionsComplete) {
            toaster.push(
                <Message showIcon type="warning">
                    Please complete all decisions before reviewing summary.
                </Message>,
                { placement: 'topCenter' }
            );
            return;
        }

        setSummaryDecisions([...decisions]);
        setSummaryReason(reason);
        setSummaryAutoTransfers([...autoTransfers]);

        onReviewSummary(decisions, reason, autoTransfers);
    };

    const handleConfirmMerge = () => {
onConfirmMerge(
  summaryDecisions,
  summaryReason,
);    };

    // Render summary section
    const renderSummarySection = (title: string, items: any[]) => {
        if (!items || items.length === 0) return null;

        const getSectionIcon = (title: string) => {
            switch (title) {
                case 'Field Updates': return faEdit;
                case 'Auto Transfers': return faArrowRight;
                case 'Records To Add': return faPlus;
                case 'Ignored Items': return faTimes;
                default: return faList;
            }
        };

        const getSectionColor = (title: string) => {
            switch (title) {
                case 'Field Updates': return '#f59e0b';
                case 'Auto Transfers': return '#10b981';
                case 'Records To Add': return '#3b82f6';
                case 'Ignored Items': return '#ef4444';
                default: return '#6b7280';
            }
        };

        return (
            <div style={{ marginBottom: 24 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: 16,
                    paddingBottom: 8,
                    borderBottom: '2px solid #e2e8f0'
                }}>
                    <FontAwesomeIcon
                        icon={getSectionIcon(title)}
                        style={{
                            color: getSectionColor(title),
                            fontSize: '16px'
                        }}
                    />
                    <h5 style={{
                        margin: 0,
                        fontWeight: 600,
                        color: '#1e293b',
                        fontSize: '16px'
                    }}>
                        <Translate>{title}</Translate>
                    </h5>
                    <span style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#64748b',
                        backgroundColor: '#f1f5f9',
                        padding: '2px 8px',
                        borderRadius: '12px'
                    }}>
                        {items.length}
                    </span>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                }}>
                    {items.map((item, idx) => (
                        <div
                            key={idx}
                            style={{
                                padding: 16,
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                fontSize: 14,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {title === 'Field Updates' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FontAwesomeIcon icon={faEdit} style={{ color: '#f59e0b', fontSize: '12px' }} />
                                    <div>
                                        <strong style={{ color: '#1f2937' }}>{item.fieldLabel}:</strong>{' '}
                                        <span style={{
                                            textDecoration: 'line-through',
                                            color: '#ef4444',
                                            marginRight: '8px'
                                        }}>
                                            {item.oldValue || '-'}
                                        </span>
                                        <FontAwesomeIcon icon={faArrowRight} style={{ color: '#6b7280', margin: '0 8px' }} />
                                        <span style={{ color: '#10b981', fontWeight: 500 }}>
                                            {item.newValue || '-'}
                                        </span>
                                        <small style={{ color: '#6b7280', marginLeft: 10 }}>
                                            ({item.decision})
                                        </small>
                                    </div>
                                </div>
                            )}

                            {title === 'Auto Transfers' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FontAwesomeIcon icon={faArrowRight} style={{ color: '#10b981', fontSize: '12px' }} />
                                    <div>
                                        <strong style={{ color: '#1f2937' }}>{item.fieldLabel}</strong>{' '}
                                        will be filled with{' '}
                                        <span style={{ color: '#10b981', fontWeight: 500 }}>
                                            {item.fromValue || '-'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {title === 'Records To Add' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FontAwesomeIcon icon={faPlus} style={{ color: '#3b82f6', fontSize: '12px' }} />
                                    <div>
                                        <strong style={{ color: '#1f2937' }}>{item.entityName}</strong>{' '}
                                        <span style={{ color: '#3b82f6', fontWeight: 500 }}>
                                            {item.matchKey}
                                        </span>{' '}
                                        will be added to the primary patient
                                    </div>
                                </div>
                            )}

                            {title === 'Ignored Items' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FontAwesomeIcon icon={faTimes} style={{ color: '#ef4444', fontSize: '12px' }} />
                                    <div>
                                        {item.fieldLabel ? (
                                            <>
                                                <strong style={{ color: '#1f2937' }}>{item.fieldLabel}</strong>{' '}
                                                <span style={{ color: '#ef4444', fontStyle: 'italic' }}>
                                                    {item.oldValue || item.newValue || item.matchKey || '-'}
                                                </span>{' '}
                                                will be ignored
                                            </>
                                        ) : (
                                            <>
                                                <strong style={{ color: '#1f2937' }}>{item.entityName}</strong>{' '}
                                                <span style={{ color: '#ef4444', fontStyle: 'italic' }}>
                                                    ({item.matchKey || 'ID: ' + item.recordId || '-'})
                                                </span>{' '}
                                                will be ignored
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderSummaryContent = () => (
        <div>
            {/* Summary Reason */}
            <div style={{
                backgroundColor: '#f0f9ff',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #bae6fd'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                }}>
                    <FontAwesomeIcon icon={faFileAlt} style={{ color: '#0369a1' }} />
                    <h6 style={{
                        margin: 0,
                        fontWeight: 600,
                        color: '#0369a1',
                        fontSize: '14px'
                    }}>
                        <Translate>Merge Reason</Translate>
                    </h6>
                </div>
                <p style={{
                    margin: 0,
                    color: '#1e293b',
                    fontSize: '14px',
                    lineHeight: '1.5'
                }}>
                    {summaryReason}
                </p>
            </div>

            {/* Summary Sections */}
            {renderSummarySection('Field Updates', summaryData?.fieldUpdates || [])}
            {renderSummarySection('Auto Transfers', summaryData?.autoTransfers || [])}
            {renderSummarySection('Records To Add', summaryData?.recordsToAdd || [])}
            {renderSummarySection('Ignored Items', summaryData?.ignoredItems || [])}
        </div>
    );

    const renderConflictsContent = () => (
        <div style={{ padding: '24px' }}>
            {/* Merge Reason */}
            <div style={{
                backgroundColor: '#fefce8',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #fde047'
            }}>
                <Form layout="vertical">
                    <Form.Group>
                        <Form.ControlLabel style={{
                            fontWeight: 600,
                            color: '#92400e',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <FontAwesomeIcon icon={faFileAlt} style={{ fontSize: '14px' }} />
                            <Translate>Merge Reason</Translate>
                        </Form.ControlLabel>
                        <Input
                            as="textarea"
                            rows={3}
                            value={reason}
                            onChange={value => setReason(value)}
                            placeholder="Enter reason for merge..."
                            style={{
                                borderColor: '#f59e0b',
                                backgroundColor: '#fff'
                            }}
                        />
                    </Form.Group>
                </Form>
            </div>

            {/* Conflicts grouped by entity */}
            {Object.entries(groupedConflicts).map(([entityName, entityConflicts]) => (
                <div key={entityName} style={{ marginBottom: 32 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: 16,
                        paddingBottom: 8,
                        borderBottom: '2px solid #e2e8f0'
                    }}>
                        <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#f59e0b' }} />
                        <h5 style={{
                            margin: 0,
                            fontWeight: 600,
                            color: '#1e293b',
                            fontSize: '16px'
                        }}>
                            <Translate>{getEntityLabel(entityName)}</Translate>
                        </h5>
                        <span style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: '#64748b',
                            backgroundColor: '#f1f5f9',
                            padding: '2px 8px',
                            borderRadius: '12px'
                        }}>
                            {entityConflicts.length} conflicts
                        </span>
                    </div>

                    {entityConflicts.map((conflict, idx) => {
                        const globalIdx = decisions.findIndex(
                            d => d.entityName === conflict.entityName &&
                                d.fieldName === conflict.fieldName &&
                                d.fromRecordId === conflict.fromRecordId
                        );
                        const decision = decisions[globalIdx];

                        if (!decision) return null;

                        return (
                            <div
                                key={idx}
                                style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 12,
                                    padding: 20,
                                    marginBottom: 16,
                                    backgroundColor: '#fefefe',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {/* Field/Record Label */}
                                <div style={{
                                    marginBottom: 16,
                                    paddingBottom: 12,
                                    borderBottom: '1px solid #f1f5f9'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <FontAwesomeIcon icon={faTag} style={{ color: '#6b7280', fontSize: '14px' }} />
                                        <strong style={{
                                            fontSize: 15,
                                            color: '#1f2937',
                                            fontWeight: 600
                                        }}>
                                            <Translate>
                                                {conflict.fieldName ? conflict.fieldLabel : `${entityName} - ${conflict.matchKey}`}
                                            </Translate>
                                        </strong>
                                    </div>
                                </div>

                                {/* Values Comparison */}
                                {conflict.fieldName && (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 16,
                                        marginBottom: 20
                                    }}>
                                        <div style={{
                                            padding: 12,
                                            backgroundColor: '#eff6ff',
                                            border: '1px solid #bfdbfe',
                                            borderRadius: 8,
                                            borderLeft: '4px solid #3b82f6'
                                        }}>
                                            <small style={{
                                                color: '#1e40af',
                                                fontWeight: 600,
                                                display: 'block',
                                                marginBottom: 4
                                            }}>
                                                <Translate>From (Patient to Merge)</Translate>
                                            </small>
                                            <div style={{
                                                color: '#1e293b',
                                                fontSize: 14,
                                                fontWeight: 500
                                            }}>
                                                {conflict.fromValue ?? '-'}
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: 12,
                                            backgroundColor: '#f0fdf4',
                                            border: '1px solid #bbf7d0',
                                            borderRadius: 8,
                                            borderLeft: '4px solid #10b981'
                                        }}>
                                            <small style={{
                                                color: '#047857',
                                                fontWeight: 600,
                                                display: 'block',
                                                marginBottom: 4
                                            }}>
                                                <Translate>To (Primary Patient)</Translate>
                                            </small>
                                            <div style={{
                                                color: '#1e293b',
                                                fontSize: 14,
                                                fontWeight: 500
                                            }}>
                                                {conflict.toValue ?? '-'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Decision Selection */}
                                <Form layout="vertical">
                                    <Form.Group>
                                        <Form.ControlLabel style={{
                                            fontWeight: 600,
                                            color: '#374151',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <FontAwesomeIcon icon={faQuestionCircle} style={{ fontSize: '14px', color: '#6b7280' }} />
                                            <Translate>Decision</Translate>
                                        </Form.ControlLabel>
                                        <SelectPicker
                                            data={getDecisionOptions(conflict)}
                                            value={decision.finalDecision}
                                            onChange={value => handleDecisionChange(globalIdx, value as string)}
                                            cleanable={false}
                                            block
                                            searchable={false}
                                            style={{
                                                borderColor: '#d1d5db',
                                                borderRadius: '6px'
                                            }}
                                        />
                                    </Form.Group>

                                    {/* Manual Entry Field */}
                                    {decision.finalDecision === 'MANUAL' && (
                                        <Form.Group>
                                            <Form.ControlLabel style={{
                                                fontWeight: 600,
                                                color: '#374151'
                                            }}>
                                                <Translate>Enter Value</Translate>
                                            </Form.ControlLabel>
                                            <Input
                                                placeholder="Enter value..."
                                                value={decision.selectedValue || ''}
                                                onChange={value => handleValueChange(globalIdx, value)}
                                                style={{
                                                    borderColor: '#d1d5db',
                                                    borderRadius: '6px'
                                                }}
                                            />
                                        </Form.Group>
                                    )}
                                </Form>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={onCancel}
            size="lg"
            backdrop="static"
            keyboard={false}
            className="merge-preview-modal"
            style={{
                borderRadius: '12px',
                overflow: 'hidden'
            }}
        >
            <Modal.Header style={{
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                padding: '20px 24px'
            }}>
                <Modal.Title style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b'
                }}>
                    <FontAwesomeIcon
                        icon={showSummary ? faCheckCircle : faCodeBranch}
                        style={{
                            color: showSummary ? '#10b981' : '#3b82f6',
                            fontSize: '20px'
                        }}
                    />
                    <Translate>
                        {showSummary ? 'Merge Summary - Review Changes' : 'Merge Preview - Resolve Conflicts'}
                    </Translate>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ padding: 0 }}>
                <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '24px' }}>
                    {showSummary ? renderSummaryContent() : renderConflictsContent()}
                </div>
            </Modal.Body>

            <Modal.Footer style={{
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                padding: '16px 24px'
            }}>
                <Button
                    onClick={onCancel}
                    disabled={loading}
                    style={{
                        borderColor: '#d1d5db',
                        color: '#6b7280'
                    }}
                >
                    <Translate>Cancel</Translate>
                </Button>

                {showSummary ? (
                    <>
                        <Button
                            onClick={onBackToConflicts}
                            disabled={loading}
                            style={{
                                borderColor: '#d1d5db',
                                color: '#6b7280'
                            }}
                        >
                            <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '8px' }} />
                            <Translate>Back to Conflicts</Translate>
                        </Button>
                        <Button
                            onClick={handleConfirmMerge}
                            appearance="primary"
                            loading={loading}
                            style={{
                                backgroundColor: '#10b981',
                                borderColor: '#10b981',
                                fontWeight: '600'
                            }}
                        >
                            <FontAwesomeIcon icon={faCheck} style={{ marginRight: '8px' }} />
                            <Translate>Confirm Merge</Translate>
                        </Button>
                    </>
                ) : (
                    <Button
                        onClick={handleReviewSummary}
                        appearance="primary"
                        loading={loading}
                        disabled={!allDecisionsComplete || loading}
                        style={{
                            backgroundColor: '#3b82f6',
                            borderColor: '#3b82f6',
                            fontWeight: '600'
                        }}
                    >
                        <FontAwesomeIcon icon={faEye} style={{ marginRight: '8px' }} />
                        <Translate>Review Summary</Translate>
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default MergePreviewModal;
