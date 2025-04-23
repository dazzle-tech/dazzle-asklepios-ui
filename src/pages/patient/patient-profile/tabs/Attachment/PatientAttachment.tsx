
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import React, { useEffect, useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faUserPen } from '@fortawesome/free-solid-svg-icons';
import { initialListRequest, ListRequest } from '@/types/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useFetchAttachmentQuery, useGetPatientAttachmentsListQuery, useFetchAttachmentByKeyQuery, useUploadMutation, useDeleteAttachmentMutation, useUpdateAttachmentDetailsMutation } from '@/services/attachmentService';
import MyButton from '@/components/MyButton/MyButton';
import { faFileArrowDown } from '@fortawesome/free-solid-svg-icons';
import { PlusRound } from '@rsuite/icons';
import { notify } from '@/utils/uiReducerActions';
import AttachmentModal from '@/components/AttachmentUploadModal/AttachmentUploadModal';

// Handle Download Attachment
const handleDownload = attachment => {
    const byteCharacters = atob(attachment.fileContent);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: attachment.contentType });

    // Create a temporary  element and trigger the download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = attachment.fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
};
const PatientAttachment = ({ localPatient }) => {
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const [requestedPatientAttacment, setRequestedPatientAttacment] = useState();
    const [selectedAttachment, setSelectedAttachment] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [deleteAttachment] = useDeleteAttachmentMutation();
    const [patientAttachments, setPatientAttachments] = useState([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const dispatch = useAppDispatch();

    // Initialize list request with default filters
    const [attachmentsListRequest, setAttachmentsListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ]
    });
    // Fetch patient attachment list responce
    const { data: fetchPatintAttachmentsResponce, refetch: attachmentRefetch ,isLoading:loadAttachment} = useGetPatientAttachmentsListQuery(attachmentsListRequest, { skip: !localPatient?.key });
    // Fetch patient attachment by key responce
    const { data: fetchAttachmentByKeyResponce, isSuccess } = useFetchAttachmentByKeyQuery({ key: requestedPatientAttacment }, { skip: !requestedPatientAttacment || !localPatient.key });
    const fetchPatientImageResponse = useFetchAttachmentQuery({ type: 'PATIENT_PROFILE_PICTURE', refKey: localPatient.key, }, { skip: !localPatient.key });

    // Function to check if the current row is the selected one
    const isSelected = rowData => {
        if (rowData && selectedAttachment && selectedAttachment.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };

    // Handle Clear Attachment Modal
    const handleClearAttachment = () => {
        setRequestedPatientAttacment(null);
        attachmentRefetch();
        setActionType(null);
    };
    // Handle Delete Attachment Modal
    const handleDeleteAttachment = () => {
        deleteAttachment({ key: selectedAttachment?.key })
            .then(() => {
                attachmentRefetch();
                fetchPatientImageResponse.refetch();
                dispatch(notify('Attachment Deleted Successfully'));
                handleClearAttachmentDelete();
            })
    };
    // Handle Clear Delete Attachment Modal
    const handleClearAttachmentDelete = () => {
        setDeleteModalOpen(false);
        handleClearAttachment();

    };
    // Handle Clear Delete Attachment Modal
    const handleAttachmentSelected = () => {
        setRequestedPatientAttacment(selectedAttachment?.key);
        setAttachmentsModalOpen(true);
        setActionType('view');
    };
    // Handle Add New Attachment Open Modal
    const handleAddNewAttachment = () => {
        handleClearAttachment();
        setSelectedAttachment(null);
        setAttachmentsModalOpen(true);
    }
    // Handle Download Selected Patient Attachment
    const handleDownloadSelectedPatientAttachment = attachmentKey => {
        setRequestedPatientAttacment(attachmentKey);
        setActionType('download');
    };

    // Table Columns
    const columns = [
        {
            key: 'fileName',
            title: <Translate>Attachment Name</Translate>,
            flexGrow: 4,
            dataKey: 'fileName',
            fullText: true,
        },
        {
            key: 'contentType',
            title: <Translate>File Type</Translate>,
            flexGrow: 4,
            dataKey: 'contentType',
            fullText: true,
        },
        {
            key: 'extraDetails',
            title: <Translate>Details</Translate>,
            flexGrow: 4,
            dataKey: 'extraDetails',
            fullText: true,
        },
        {
            key: 'source',
            title: <Translate>Source</Translate>,
            flexGrow: 4,
            render: (rowData: any) =>
                rowData.accessTypeLvalue
                    ? rowData.accessTypeLvalue.lovDisplayVale
                    : rowData.accessTypeLkey,
            fullText: true,
        },
        {
            key: 'download',
            title: <Translate>Download</Translate>,
            flexGrow: 4,
            render: (attachment: any) => (
                <MyButton
                    appearance="link"
                    onClick={() => handleDownloadSelectedPatientAttachment(attachment.key)}
                    prefixIcon={() => <FontAwesomeIcon icon={faFileArrowDown} />}>
                    Download
                </MyButton>
            ),
            fullText: true,
        },
        {
            key: 'createdBy',
            title: <Translate>Created By</Translate>,
            flexGrow: 4,
            render: (rowData: any) => rowData?.createdByUser?.fullName || '',
            fullText: true,
        },
        {
            key: 'createdAt',
            title: <Translate>Created At</Translate>,
            flexGrow: 4,
            render: (rowData: any) =>
                rowData.createdAt ? new Date(rowData.createdAt).toLocaleString("en-GB") : '',
            fullText: true,
        },
        {
            key: 'updatedBy',
            title: <Translate>Updated By</Translate>,
            flexGrow: 4,
            render: (rowData: any) => rowData?.updatedByUser?.fullName || '',
            fullText: true,
        },
        {
            key: 'updatedAt',
            title: <Translate>Updated At</Translate>,
            flexGrow: 4,
            render: (rowData: any) =>
                rowData.updatedAt ? new Date(rowData.updatedAt).toLocaleString("en-GB") : '',
            fullText: true,
        },
    ];

    // Effects
    useEffect(() => {
        setAttachmentsListRequest((prev) => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                ...(localPatient?.key
                    ? [
                        {
                            fieldName: 'reference_object_key',
                            operator: 'match',
                            value: localPatient.key,
                        },
                    ]
                    : []),
            ],
        }));
    }, [localPatient.key]);
    useEffect(() => {
        if (fetchPatintAttachmentsResponce)
            if (fetchPatintAttachmentsResponce && localPatient.key) {
                setPatientAttachments(fetchPatintAttachmentsResponce?.object);
            } else {
                setPatientAttachments(undefined);
            }
    }, [fetchPatintAttachmentsResponce]);
    useEffect(() => {
        if (isSuccess && fetchAttachmentByKeyResponce) {
            if (actionType === 'download') {
                handleDownload(fetchAttachmentByKeyResponce);
            } else if (actionType === 'view') {
                setAttachmentsModalOpen(true);
                setSelectedAttachment(fetchAttachmentByKeyResponce);
            }
        }
    }, [requestedPatientAttacment, fetchAttachmentByKeyResponce, actionType]);
    return (
        <div className="tab-main-container">
            <div className="tab-content-btns">
                <MyButton
                    onClick={handleAddNewAttachment}
                    disabled={!localPatient?.key}
                    prefixIcon={() => <PlusRound />}>
                    New Attachment
                </MyButton>
                <MyButton
                    disabled={!selectedAttachment?.key}
                    onClick={() => handleAttachmentSelected()}
                    prefixIcon={() => <FontAwesomeIcon icon={faUserPen} />}>
                    Preview / Edit
                </MyButton>
                <MyButton
                    disabled={!selectedAttachment?.key}
                    onClick={() => setDeleteModalOpen(true)}
                    prefixIcon={() => <FontAwesomeIcon icon={faTrash} />}>
                    Delete
                </MyButton>
            </div>
            <AttachmentModal isOpen={attachmentsModalOpen} setIsOpen={setAttachmentsModalOpen} actionType={actionType} setActionType={setActionType} refecthData={attachmentRefetch} attachmentSource={localPatient} selectedPatientAttacment={selectedAttachment} setSelectedPatientAttacment={setSelectedAttachment} requestedPatientAttacment={requestedPatientAttacment} setRequestedPatientAttacment={setRequestedPatientAttacment} attatchmentType="PATIENT_PROFILE_ATTACHMENT"/>
            <MyTable
                height={200}
                loading={loadAttachment}
                data={patientAttachments ?? []}
                columns={columns}
                onRowClick={rowData => { setSelectedAttachment(rowData); }}
                rowClassName={isSelected}
            />
            <DeletionConfirmationModal
                open={deleteModalOpen}
                setOpen={setDeleteModalOpen}
                itemToDelete='Attachment'
                actionButtonFunction={() => { handleDeleteAttachment() }}
            >
            </DeletionConfirmationModal>
        </div>
    );
};
export default PatientAttachment;
