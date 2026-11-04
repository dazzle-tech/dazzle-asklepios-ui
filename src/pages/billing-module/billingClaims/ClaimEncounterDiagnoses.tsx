
import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import Icd10DiagnosisSearch from '@/components/Icd10DiagnosisSearch/Icd10DiagnosisSearch';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import { useEnumOptions } from '@/services/enumsApi';
import { useLazyGetIcdDiagnosesByIdsQuery } from '@/services/setup/icdTreeService';
import {
    useGetClaimEncounterDiagnosesQuery,
    useCreateClaimEncounterDiagnosisMutation,
    useUpdateClaimEncounterDiagnosisMutation,
    useDeleteClaimEncounterDiagnosisMutation,
} from '@/services/billing/claimEncounterDiagnosisService';

import { formatEnumString } from '@/utils';
import { ClaimEncounterDiagnosis } from '@/types/model-types-new';

type ClaimEncounterDiagnosesProps = {
    encounter: any;
    disabled?: boolean;
    onDiagnosisSaved?: () => void;
};

type DiagnosisForm = {
    diagnosisId: number | null;
    type: string | null;
    suspected: boolean;
    major: boolean;
};

const ClaimEncounterDiagnoses: React.FC<ClaimEncounterDiagnosesProps> = ({
    encounter,
    disabled = false,
    onDiagnosisSaved
}) => {
    const dispatch = useAppDispatch();

    const encounterId = encounter?.id ? Number(encounter.id) : null;

    const diagnosisTypeOptions = useEnumOptions('DiagnosisType');

    const {
        data: encounterDiagnoses = [],
        isFetching,
        refetch
    } = useGetClaimEncounterDiagnosesQuery(
        { encounterId: encounterId as number },
        {
            skip: !encounterId,
            refetchOnMountOrArgChange: true
        }
    );

    const [
        createClaimEncounterDiagnosis,
        { isLoading: isCreating }
    ] = useCreateClaimEncounterDiagnosisMutation();

    const [
        updateClaimEncounterDiagnosis,
        { isLoading: isUpdating }
    ] = useUpdateClaimEncounterDiagnosisMutation();

    const [
        deleteClaimEncounterDiagnosis,
        { isLoading: isDeleting }
    ] = useDeleteClaimEncounterDiagnosisMutation();

    const isSaving = isCreating || isUpdating || isDeleting;

    const [diagnoses, setDiagnoses] = useState<ClaimEncounterDiagnosis[]>([]);

    const [diagnosis, setDiagnosis] = useState<DiagnosisForm>({
        diagnosisId: null,
        type: null,
        suspected: false,
        major: false
    });

    const [editingDiagnosisId, setEditingDiagnosisId] = useState<number | null>(
        null
    );

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const [selectedDiagnosisToDelete, setSelectedDiagnosisToDelete] =
        useState<ClaimEncounterDiagnosis | null>(null);

    const [fetchIcdByIds] = useLazyGetIcdDiagnosesByIdsQuery();

    const [icdMap, setIcdMap] = useState<Record<number, any>>({});

    useEffect(() => {
        setDiagnoses(encounterDiagnoses);
    }, [encounterDiagnoses]);

    const diagnosisIds = useMemo(() => {
        return Array.from(
            new Set(
                diagnoses
                    .map(item => Number(item.diagnosisId))
                    .filter(id => Number.isFinite(id) && id > 0)
            )
        );
    }, [diagnoses]);

    useEffect(() => {
        let cancelled = false;

        const loadIcd = async () => {
            const missing = diagnosisIds.filter(id => !icdMap[id]);

            if (!missing.length) return;

            try {
                const response = await fetchIcdByIds({
                    ids: missing,
                    timestamp: Date.now()
                }).unwrap();

                if (cancelled) return;

                setIcdMap(previous => {
                    const next = { ...previous };

                    for (const item of response ?? []) {
                        const id = Number((item as any)?.id);

                        if (Number.isFinite(id) && id > 0) {
                            next[id] = item;
                        }
                    }

                    return next;
                });
            } catch {
                // Ignore ICD lookup errors.
            }
        };

        loadIcd();

        return () => {
            cancelled = true;
        };
    }, [diagnosisIds, fetchIcdByIds, icdMap]);

    const clearForm = () => {
        setDiagnosis({
            diagnosisId: null,
            type: null,
            suspected: false,
            major: false
        });

        setEditingDiagnosisId(null);
    };

    const showError = (error: any, defaultMessage: string) => {
        const data = error?.data ?? {};

        dispatch(
            notify({
                msg:
                    data?.detail ||
                    data?.message ||
                    data?.title ||
                    defaultMessage,
                sev: 'error'
            })
        );
    };

    const handleAddOrUpdate = async () => {
        if (!encounterId) return;

        if (!diagnosis.diagnosisId) {
            dispatch(
                notify({
                    msg: 'Diagnosis is required.',
                    sev: 'warning'
                })
            );
            return;
        }

        if (!diagnosis.type) {
            dispatch(
                notify({
                    msg: 'Type is required.',
                    sev: 'warning'
                })
            );
            return;
        }

        const payload = {
            diagnosisId: diagnosis.diagnosisId,
            type: diagnosis.type,
            suspected: diagnosis.suspected,
            major: diagnosis.major
        };

        try {
            if (editingDiagnosisId !== null) {
                await updateClaimEncounterDiagnosis({
                    id: editingDiagnosisId,
                    ...payload
                }).unwrap();

                dispatch(
                    notify({
                        msg: 'Diagnosis updated successfully',
                        sev: 'success'
                    })
                );
            } else {
                await createClaimEncounterDiagnosis({
                    encounterId,
                    ...payload
                }).unwrap();

                dispatch(
                    notify({
                        msg: 'Diagnosis added successfully',
                        sev: 'success'
                    })
                );
            }

            clearForm();
            await refetch();
            onDiagnosisSaved?.();
        } catch (error: any) {
            showError(error, 'Failed to save diagnosis');
        }
    };

    const handleEdit = (row: ClaimEncounterDiagnosis) => {
        setEditingDiagnosisId(row.id);

        setDiagnosis({
            diagnosisId: row.diagnosisId,
            type: row.type,
            suspected: row.suspected,
            major: row.major
        });
    };

    const handleOpenDeleteModal = (row: ClaimEncounterDiagnosis) => {
        setSelectedDiagnosisToDelete(row);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (selectedDiagnosisToDelete?.id == null) return;

        try {
            await deleteClaimEncounterDiagnosis(
                selectedDiagnosisToDelete.id
            ).unwrap();

            if (editingDiagnosisId === selectedDiagnosisToDelete.id) {
                clearForm();
            }

            setDeleteModalOpen(false);
            setSelectedDiagnosisToDelete(null);

            dispatch(
                notify({
                    msg: 'Diagnosis deleted successfully',
                    sev: 'success'
                })
            );

            await refetch();
            onDiagnosisSaved?.();
        } catch (error: any) {
            showError(error, 'Failed to delete diagnosis');
        }
    };

    const tableColumns = useMemo(
        () => [
            {
                key: 'diagnosisId',
                title: <Translate>Code</Translate>,
                flexGrow: 2,
                render: (row: ClaimEncounterDiagnosis) => {
                    const id = Number(row?.diagnosisId);
                    const icd = id ? icdMap[id] : null;

                    return icd?.icdCode ?? '';
                }
            },
            {
                key: 'diagnosisDesc',
                title: <Translate>Description</Translate>,
                flexGrow: 6,
                render: (row: ClaimEncounterDiagnosis) => {
                    const id = Number(row?.diagnosisId);
                    const icd = id ? icdMap[id] : null;

                    return (
                        icd?.icdShortDescription ||
                        icd?.icdFullDescription ||
                        ''
                    );
                }
            },
            {
                key: 'type',
                title: <Translate>Type</Translate>,
                flexGrow: 2,
                render: (row: ClaimEncounterDiagnosis) =>
                    formatEnumString(row?.type ?? '')
            },
            {
                key: 'suspected',
                title: <Translate>Suspected</Translate>,
                flexGrow: 2,
                render: (row: ClaimEncounterDiagnosis) =>
                    row?.suspected ? 'Yes' : 'No'
            },
            {
                key: 'major',
                title: <Translate>Chronic</Translate>,
                flexGrow: 2,
                render: (row: ClaimEncounterDiagnosis) =>
                    row?.major ? 'Yes' : 'No'
            },
            {
                key: 'actions',
                title: <Translate>Actions</Translate>,
                flexGrow: 2,
                render: (row: ClaimEncounterDiagnosis) => (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <MyButton
                            appearance="link"
                            onClick={() => handleEdit(row)}
                            disabled={disabled || isSaving}
                        >
                            Edit
                        </MyButton>

                        <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(row)}
                            disabled={disabled || isSaving}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                cursor:
                                    disabled || isSaving
                                        ? 'not-allowed'
                                        : 'pointer'
                            }}
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </div>
                )
            }
        ],
        [icdMap, disabled, isSaving]
    );

    return (
        <div style={{ width: '100%' }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                    gap: '16px',
                    width: '100%',
                    minWidth: 0
                }}
            >
                <div>
                    <Form fluid>
                        <Icd10DiagnosisSearch
                            diagnosisId={diagnosis.diagnosisId}
                            setDiagnosisId={(id: number | null) =>
                                setDiagnosis(previous => ({
                                    ...previous,
                                    diagnosisId: id
                                }))
                            }
                            label=""
                            disabled={disabled || isSaving}
                        />

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                marginTop: '12px'
                            }}
                        >
                            <MyInput
                                width="15vw"
                                required
                                fieldType="select"
                                selectData={diagnosisTypeOptions ?? []}
                                selectDataLabel="label"
                                selectDataValue="value"
                                fieldName="type"
                                record={diagnosis}
                                setRecord={setDiagnosis}
                                fieldLabel="Type"
                                disabled={disabled || isSaving}
                            />

                            <MyInput
                                width="100%"
                                fieldLabel="Suspected"
                                fieldType="checkbox"
                                fieldName="suspected"
                                record={diagnosis}
                                setRecord={setDiagnosis}
                                disabled={disabled || isSaving}
                            />

                            <MyInput
                                width="100%"
                                fieldLabel="Chronic"
                                fieldType="checkbox"
                                fieldName="major"
                                record={diagnosis}
                                setRecord={setDiagnosis}
                                disabled={disabled || isSaving}
                            />
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                gap: '8px',
                                marginTop: '12px'
                            }}
                        >
                            <MyButton
                                onClick={handleAddOrUpdate}
                                disabled={disabled || isSaving || isFetching}
                            >
                                {isSaving
                                    ? 'Saving...'
                                    : editingDiagnosisId !== null
                                      ? 'Update'
                                      : 'Add'}
                            </MyButton>

                            <MyButton
                                onClick={clearForm}
                                disabled={disabled || isSaving}
                            >
                                Clear
                            </MyButton>
                        </div>
                    </Form>
                </div>

                <div>
                    <MyTable
                        data={diagnoses}
                        totalCount={diagnoses.length}
                        loading={isFetching || isSaving}
                        columns={tableColumns}
                    />
                </div>
            </div>

            <DeletionConfirmationModal
                open={deleteModalOpen}
                setOpen={setDeleteModalOpen}
                itemToDelete="diagnosis"
                actionType="delete"
                confirmationQuestion="Are you sure you want to remove this diagnosis?"
                actionButtonLabel="Delete"
                actionButtonFunction={handleConfirmDelete}
            />
        </div>
    );
};

export default ClaimEncounterDiagnoses;
