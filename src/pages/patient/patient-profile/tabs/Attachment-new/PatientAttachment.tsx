
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import React, { useEffect, useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import { faTrash, faFileArrowDown, faEye, faEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useGetPatientAttachmentsQuery, useGetDownloadUrlMutation, useDeleteAttachmentMutation } from '@/services/patients/attachmentService';
import MyButton from '@/components/MyButton/MyButton';
import { PlusRound } from '@rsuite/icons';
import { notify } from '@/utils/uiReducerActions';
import { AttachmentUploadModal, PreviewModal, EditModal } from '@/components/AttachmentModals';
import { formatDateWithoutSeconds, formatEnumString, conjureValueBasedOnKeyFromList } from '@/utils';
import { PatientAttachment as PatientAttachmentType } from '@/types/model-types-new';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

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
    const [deleteAttachment] = useDeleteAttachmentMutation();
    const [getDownloadUrl] = useGetDownloadUrlMutation();
    
    // Fetch attachment types LOV for mapping
    const { data: attachmentsLovQueryResponse } = useGetLovValuesByCodeQuery('ATTACH_TYPE');
    const attachmentTypesLov = attachmentsLovQueryResponse?.object ?? [];

    // Fetch patient attachments
    const { data: attachmentsResponse, refetch: attachmentRefetch, isLoading: loadAttachment } = useGetPatientAttachmentsQuery(
        {
            patientId: localPatient?.id || localPatient?.key
        },
        { skip: !localPatient?.id && !localPatient?.key }
    );

    const patientAttachments = attachmentsResponse?.data || [];
    const totalCount = patientAttachments.length;

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
            await deleteAttachment({
                id: selectedAttachment.id,
                patientId: localPatient?.id || localPatient?.key
            }).unwrap();
            
            attachmentRefetch();
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

    // Handle Open Edit Modal
    const handleOpenEditModal = () => {
        if (!selectedAttachment) return;
        setEditModalOpen(true);
    };

    // Handle Close Edit Modal
    const handleCloseEditModal = () => {
        setEditModalOpen(false);
    };

    // Handle Preview Selected Patient Attachment
    const handlePreviewSelectedPatientAttachment = async (attachment: PatientAttachmentType) => {
        try {
            const downloadTicket = await getDownloadUrl(attachment.id).unwrap();
            
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

    // Handle Download Selected Patient Attachment
    const handleDownloadSelectedPatientAttachment = async (attachment: PatientAttachmentType) => {
        try {
            const downloadTicket = await getDownloadUrl(attachment.id).unwrap();
            
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
            render: (rowData: PatientAttachmentType) => 
                rowData.type 
                    ? conjureValueBasedOnKeyFromList(attachmentTypesLov, rowData.type, 'lovDisplayVale')
                    : rowData.type ,
            fullText: true,
        },
        {
            key: 'source',
            title: <Translate>Source</Translate>,
            flexGrow: 2,
            render: (row: PatientAttachmentType) => formatEnumString(row.source),
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
            attachmentRefetch();
            setRefetchAttachmentList(false);
        }
    }, [refetchAttachmentList, attachmentRefetch, setRefetchAttachmentList]);
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
                    disabled={!selectedAttachment?.id}
                    onClick={handleOpenEditModal}
                    prefixIcon={() => <FontAwesomeIcon icon={faEdit} />}>
                    Edit
                </MyButton>
                <MyButton
                    disabled={!selectedAttachment?.id}
                    onClick={() => setDeleteModalOpen(true)}
                    prefixIcon={() => <FontAwesomeIcon icon={faTrash} />}>
                    Delete
                </MyButton>
            </div>
            <AttachmentUploadModal 
                isOpen={attachmentsModalOpen} 
                setIsOpen={setAttachmentsModalOpen} 
                patientId={localPatient?.id || localPatient?.key}
                refetchData={attachmentRefetch} 
                source='PATIENT_PROFILE_ATTACHMENT'
            />
            <MyTable
                height={200}
                loading={loadAttachment}
                data={patientAttachments}
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
                onUpdateSuccess={attachmentRefetch}
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
