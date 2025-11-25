
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import React, { useEffect, useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import { faTrash, faFileArrowDown, faEye, faEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useGetPatientAttachmentsQuery, useGetDownloadUrlMutation as useGetPatientDownloadUrlMutation, useDeleteAttachmentMutation as useDeletePatientAttachmentMutation } from '@/services/patients/attachmentService';
import { useGetDownloadUrlMutation as useGetEncounterDownloadUrlMutation, useDeleteAttachmentMutation as useDeleteEncounterAttachmentMutation, useGetEncounterAttachmentsByEncounterIdsQuery } from '@/services/encounters/attachmentsService';
import { useGetEncountersQuery } from '@/services/encounterService';
import MyButton from '@/components/MyButton/MyButton';
import { PlusRound } from '@rsuite/icons';
import { notify } from '@/utils/uiReducerActions';
import { AttachmentUploadModal, PreviewModal, EditModal } from '@/components/AttachmentModals';
import { formatDateWithoutSeconds, formatEnumString, conjureValueBasedOnKeyFromList } from '@/utils';
import { PatientAttachment as PatientAttachmentType, EncounterAttachment } from '@/types/model-types-new';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { initialListRequest } from '@/types/types';

const PatientAttachment = ({ localPatient, refetchAttachmentList, setRefetchAttachmentList }) => {
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState<PatientAttachmentType | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [previewFileName, setPreviewFileName] = useState<string>('');
    const [previewFileType, setPreviewFileType] = useState<string>('');
    const [editModalOpen, setEditModalOpen] = useState(false);
    const dispatch = useAppDispatch();

    // Pagination state
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(5);

    // API hooks
    const [deletePatientAttachment] = useDeletePatientAttachmentMutation();
    const [deleteEncounterAttachment] = useDeleteEncounterAttachmentMutation();
    const [getPatientDownloadUrl] = useGetPatientDownloadUrlMutation();
    const [getEncounterDownloadUrl] = useGetEncounterDownloadUrlMutation();

    // Fetch attachment types LOV for mapping
    const { data: attachmentsLovQueryResponse } = useGetLovValuesByCodeQuery('ATTACH_TYPE');
    const attachmentTypesLov = attachmentsLovQueryResponse?.object ?? [];

    // Fetch all encounters for the patient
    const { data: encountersResponse, isLoading: loadingEncounters } = useGetEncountersQuery(
        {
            ...initialListRequest,
            pageSize: 1000, // Get all encounters
            filters: [
                {
                    fieldName: 'patient_key',
                    operator: 'match',
                    value: localPatient?.key || localPatient?.id
                }
            ]
        },
        { skip: !localPatient?.id && !localPatient?.key }
    );

    const patientEncounters = encountersResponse?.object || [];
    const encounterIds = patientEncounters.map(enc => enc.id || enc.key).filter(Boolean);

    // Fetch patient attachments
    const { data: patientAttachmentsResponse, refetch: attachmentRefetch, isLoading: loadPatientAttachment } = useGetPatientAttachmentsQuery(
        {
            patientId: localPatient?.id || localPatient?.key
        },
        { skip: !localPatient?.id && !localPatient?.key }
    );

    // Fetch encounter attachments for all patient encounters using the new endpoint
    const { data: encounterAttachmentsResponse, refetch: encounterAttachmentsRefetch, isLoading: loadingEncounterAttachments } = useGetEncounterAttachmentsByEncounterIdsQuery(
        {
            encounterIds: encounterIds
        },
        { skip: encounterIds.length === 0 }
    );

    const encounterAttachments = encounterAttachmentsResponse || [];

    // Combine patient and encounter attachments with encounter info
    const patientAttachments = patientAttachmentsResponse?.data || [];
    const combinedAttachments = [
        ...patientAttachments.map(att => ({ ...att, attachmentType: 'patient' as const, encounterInfo: null })),
        ...encounterAttachments.map(att => {
            const encounter = patientEncounters.find(enc => (enc.id || enc.key) === att.encounterId);
            return {
                ...att,
                attachmentType: 'encounter' as const,
                encounterInfo: encounter
            };
        })
    ];

    const totalCount = combinedAttachments.length;
    const loadAttachment = loadPatientAttachment || loadingEncounters || loadingEncounterAttachments;

    // Function to check if the current row is the selected one
    const isSelected = rowData => {
        if (rowData && selectedAttachment && selectedAttachment.id === rowData.id) {
            return 'selected-row';
        } else return '';
    };

    // Handle Delete Attachment Modal
    const handleDeleteAttachment = async () => {
        if (!selectedAttachment?.id) return;

        try {
            const attachmentType = (selectedAttachment as any).attachmentType;

            if (attachmentType === 'patient') {
                await deletePatientAttachment({
                    id: selectedAttachment.id,
                    patientId: localPatient?.id || localPatient?.key
                }).unwrap();
            } else if (attachmentType === 'encounter') {
                const encounterAtt = selectedAttachment as any as EncounterAttachment;
                await deleteEncounterAttachment({
                    id: encounterAtt.id,
                    encounterId: encounterAtt.encounterId
                }).unwrap();
            }

            attachmentRefetch();
            encounterAttachmentsRefetch();
            dispatch(notify({ msg: 'Attachment Deleted Successfully', sev: 'success' }));
            handleClearAttachmentDelete();
        } catch (error) {
            dispatch(notify({ msg: 'Failed to delete attachment', sev: 'error' }));
        }
    };

    // Handle Clear Delete Attachment Modal
    const handleClearAttachmentDelete = () => {
        setDeleteModalOpen(false);
        setSelectedAttachment(null);
    };

    // Handle Add New Attachment Open Modal
    const handleAddNewAttachment = () => {
        setSelectedAttachment(null);
        setAttachmentsModalOpen(true);
    };

    // Refetch all attachments (patient + encounter)
    const refetchAllAttachments = async () => {
        attachmentRefetch();
        encounterAttachmentsRefetch();
    };

    // Handle Open Edit Modal
    const handleOpenEditModal = () => {
        if (!selectedAttachment) return;
        setEditModalOpen(true);
    };

    // Handle Close Edit Modal
    const handleCloseEditModal = () => {
        setEditModalOpen(false);
    };

    // Handle Preview Selected Attachment (patient or encounter)
    const handlePreviewSelectedPatientAttachment = async (attachment: any) => {
        try {
            const attachmentType = attachment.attachmentType;
            let downloadTicket;

            if (attachmentType === 'patient') {
                downloadTicket = await getPatientDownloadUrl(attachment.id).unwrap();
            } else {
                downloadTicket = await getEncounterDownloadUrl(attachment.id).unwrap();
            }

            // Set preview data and open modal
            setPreviewUrl(downloadTicket.url);
            setPreviewFileName(attachment.filename);
            setPreviewFileType(attachment.mimeType);
            setPreviewModalOpen(true);
        } catch (error) {
            dispatch(notify({ msg: 'Failed to get preview URL', sev: 'error' }));
        }
    };

    // Handle Close Preview Modal
    const handleClosePreview = () => {
        setPreviewModalOpen(false);
        setPreviewUrl('');
        setPreviewFileName('');
        setPreviewFileType('');
    };

    // Handle Download Selected Attachment (patient or encounter)
    const handleDownloadSelectedPatientAttachment = async (attachment: any) => {
        try {
            const attachmentType = attachment.attachmentType;
            let downloadTicket;

            if (attachmentType === 'patient') {
                downloadTicket = await getPatientDownloadUrl(attachment.id).unwrap();
            } else {
                downloadTicket = await getEncounterDownloadUrl(attachment.id).unwrap();
            }

            // Open the presigned URL in a new tab or trigger download
            const link = document.createElement('a');
            link.href = downloadTicket.url;
            link.download = attachment.filename;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            dispatch(notify({ msg: 'Download started', sev: 'success' }));
        } catch (error) {
            dispatch(notify({ msg: 'Failed to get download URL', sev: 'error' }));
        }
    };

    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPageSize(parseInt(event.target.value, 10));
        setPage(0); // Reset to first page
    };
    // Table Columns
    const columns = [
        {
            key: 'attachmentType',
            title: <Translate>Category</Translate>,
            flexGrow: 2,
            render: (rowData: any) => (
                <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: rowData.attachmentType === 'patient' ? '#e3f2fd' : '#fff3e0',
                    color: rowData.attachmentType === 'patient' ? '#1976d2' : '#f57c00',
                    fontWeight: 500,
                    fontSize: '12px'
                }}>
                    {rowData.attachmentType === 'patient' ? 'Patient' : 'Encounter'}
                </span>
            ),
            fullText: true,
        },
        {
            key: 'filename',
            title: <Translate>Attachment Name</Translate>,
            flexGrow: 4,
            dataKey: 'filename',
            fullText: true,
        },
        {
            key: 'mimeType',
            title: <Translate>File Type</Translate>,
            flexGrow: 3,
            dataKey: 'mimeType',
            fullText: true,
        },
        {
            key: 'details',
            title: <Translate>Details</Translate>,
            flexGrow: 3,
            dataKey: 'details',
            fullText: true,
        },
        {
            key: 'type',
            title: <Translate>Type</Translate>,
            flexGrow: 4,
            render: (rowData: any) =>
                rowData.type
                    ? conjureValueBasedOnKeyFromList(attachmentTypesLov, rowData.type, 'lovDisplayVale')
                    : rowData.type,
            fullText: true,
        },
        {
            key: 'source',
            title: <Translate>Source</Translate>,
            flexGrow: 3,
            render: (row: any) => formatEnumString(row.source),
            fullText: true,
        },
        {
            key: 'encounter',
            title: <Translate>Encounter</Translate>,
            flexGrow: 3,
            render: (rowData: any) => {
                if (rowData.attachmentType === 'encounter' && rowData.encounterId) {
                    const encounter = patientEncounters.find(enc =>
                        Number(enc.key) === Number(rowData.encounterId)
                    );
                    if (encounter) {
                        return encounter.visitId;         
                    }
                    return rowData.encounterId;
                }
                return '-';
            },
            fullText: true,
        },
        {
            key: 'preview',
            title: <Translate>Preview</Translate>,
            flexGrow: 2,
            render: (attachment: PatientAttachmentType) => (
                <MyButton
                    appearance="link"
                    onClick={() => handlePreviewSelectedPatientAttachment(attachment)}
                    prefixIcon={() => <FontAwesomeIcon icon={faEye} />}>
                    Preview
                </MyButton>
            ),
            fullText: true,
        },
        {
            key: 'download',
            title: <Translate>Download</Translate>,
            flexGrow: 2,
            render: (attachment: PatientAttachmentType) => (
                <MyButton
                    appearance="link"
                    onClick={() => handleDownloadSelectedPatientAttachment(attachment)}
                    prefixIcon={() => <FontAwesomeIcon icon={faFileArrowDown} />}>
                    Download
                </MyButton>
            ),
            fullText: true,
        },
        {
            key: 'createdDate',
            title: <Translate>Created By/At</Translate>,
            fullText: true,
            flexGrow: 3,
            render: (row: PatientAttachmentType) => row?.createdDate ? <>{row?.createdBy}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.createdDate)}</span> </> : ' '
        },
        {
            key: 'lastModifiedDate',
            title: <Translate>Updated By/At</Translate>,
            fullText: true,
            flexGrow: 3,
            render: (row: PatientAttachmentType) => row?.lastModifiedDate ? <>{row?.lastModifiedBy}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.lastModifiedDate)}</span> </> : ' '
        },
    ];

    // Effects
    useEffect(() => {
        if (refetchAttachmentList) {
            refetchAllAttachments();
            setRefetchAttachmentList(false);
        }
    }, [refetchAttachmentList, setRefetchAttachmentList]);
    return (
        <div className="tab-main-container">
            <div className="tab-content-btns">
                <MyButton
                    onClick={handleAddNewAttachment}
                    disabled={!localPatient?.id && !localPatient?.key}
                    prefixIcon={() => <PlusRound />}>
                    New Attachment
                </MyButton>
                <MyButton
                    disabled={!selectedAttachment?.id || (selectedAttachment as any)?.attachmentType === 'encounter'}
                    onClick={handleOpenEditModal}
                    prefixIcon={() => <FontAwesomeIcon icon={faEdit} />}>
                    Edit
                </MyButton>
                <MyButton
                    disabled={!selectedAttachment?.id || (selectedAttachment as any)?.attachmentType === 'encounter'}
                    onClick={() => setDeleteModalOpen(true)}
                    prefixIcon={() => <FontAwesomeIcon icon={faTrash} />}>
                    Delete
                </MyButton>
            </div>
            <AttachmentUploadModal
                isOpen={attachmentsModalOpen}
                setIsOpen={setAttachmentsModalOpen}
                patientId={localPatient?.id || localPatient?.key}
                refetchData={refetchAllAttachments}
                source='PATIENT_PROFILE_ATTACHMENT'
            />
            <MyTable
                height={200}
                loading={loadAttachment}
                data={combinedAttachments}
                columns={columns}
                onRowClick={rowData => { setSelectedAttachment(rowData); }}
                rowClassName={isSelected}
                page={page}
                rowsPerPage={pageSize}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
            <DeletionConfirmationModal
                open={deleteModalOpen}
                setOpen={setDeleteModalOpen}
                itemToDelete='Attachment'
                actionButtonFunction={handleDeleteAttachment}
            >
            </DeletionConfirmationModal>

            {/* Edit Modal */}
            <EditModal
                open={editModalOpen}
                onClose={handleCloseEditModal}
                selectedAttachment={selectedAttachment}
                patientId={localPatient?.id || localPatient?.key}
                attachmentTypesLov={attachmentTypesLov}
                onUpdateSuccess={refetchAllAttachments}
            />

            {/* Preview Modal */}
            <PreviewModal
                open={previewModalOpen}
                onClose={handleClosePreview}
                previewUrl={previewUrl}
                previewFileName={previewFileName}
                previewFileType={previewFileType}
            />
        </div>
    );
};
export default PatientAttachment;
