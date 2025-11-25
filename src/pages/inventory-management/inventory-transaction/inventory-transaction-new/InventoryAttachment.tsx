
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
import { conjureValueBasedOnKeyFromList, formatDateWithoutSeconds } from '@/utils';
import { useGetInventoryTransactionsAttachmentQuery, useInventoryTransactionAttachmentByKeyQuery } from '@/services/inventoryTransactionService';

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
const InventoryAttachment = ({ transaction , setTransaction, refetchAttachmentList }) => {
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const [requestedAttachment, setRequestedAttachment] = useState();
    const [selectedAttachment, setSelectedAttachment] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [deleteAttachment] = useDeleteAttachmentMutation();
    const [attachments, setAttachments] = useState([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const dispatch = useAppDispatch();

    console.log( transaction);
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
    const { data: fetchAttachmentsResponce, refetch: attachmentRefetch, isLoading: loadAttachment } = useGetInventoryTransactionsAttachmentQuery(attachmentsListRequest, { skip: !transaction?.key });
    // Fetch patient attachment by key responce
    const { data: fetchAttachmentByKeyResponce, isSuccess } = useInventoryTransactionAttachmentByKeyQuery({ key: requestedAttachment }, { skip: !requestedAttachment || !transaction.key });

    // Function to check if the current row is the selected one
    const isSelected = rowData => {
        if (rowData && selectedAttachment && selectedAttachment.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };

    // Handle Clear Attachment Modal
    const handleClearAttachment = () => {
        setRequestedAttachment(null);
        attachmentRefetch();
        setActionType(null);
    };
    // Handle Delete Attachment Modal
    const handleDeleteAttachment = () => {
        deleteAttachment({ key: selectedAttachment?.key })
            .then(() => {
                attachmentRefetch();
                dispatch(notify({ msg: 'Attachment Deleted Successfully', sev: 'success' }));
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
        setRequestedAttachment(selectedAttachment?.key);
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
        setRequestedAttachment(attachmentKey);
        setActionType('download');
    };
    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setAttachmentsListRequest({ ...attachmentsListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAttachmentsListRequest({
            ...attachmentsListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
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
            flexGrow: 6,
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
            key: 'createdAt',
            title: 'CREATED AT/BY',
            fullText: true,
            flexGrow: 3,
            render: (row: any) => row?.createdAt ? <>{row?.createdByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.createdAt)}</span> </> : ' '
        },
        {
            key: 'updatedAt',
            title: 'UPDATED AT/BY',
            flexGrow: 3,
            fullText: true,
            render: (row: any) => row?.updatedAt ? <>{row?.updatedByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.updatedAt)}</span> </> : ' '
        },
    ];

    // Pagination values
    const pageIndex = attachmentsListRequest.pageNumber - 1;
    const rowsPerPage = attachmentsListRequest.pageSize;
    const totalCount = fetchAttachmentsResponce?.extraNumeric ?? 0;
    // Effects
    useEffect(() => {
        setAttachmentsListRequest((prev) => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                }
            ],
        }));
    }, [transaction.key]);
    useEffect(() => {
        if (fetchAttachmentsResponce)
            if (fetchAttachmentsResponce && transaction.key) {
                setAttachments(fetchAttachmentsResponce?.object);
            } else {
                setAttachments(undefined);
            }
    }, [fetchAttachmentsResponce]);
    useEffect(() => {
        if (isSuccess && fetchAttachmentByKeyResponce) {
            if (actionType === 'download') {
                handleDownload(fetchAttachmentByKeyResponce);
            } else if (actionType === 'view') {
                setAttachmentsModalOpen(true);
                setSelectedAttachment(fetchAttachmentByKeyResponce);
            }
        }
    }, [requestedAttachment, fetchAttachmentByKeyResponce, actionType]);
    // useEffect(() => {
    //     if (refetchAttachmentList) {
    //         attachmentRefetch();
    //     }
    // }, [refetchAttachmentList]);
    return (
        <div className="tab-main-container">
            <div className="tab-content-btns">
                <MyButton
                    onClick={handleAddNewAttachment}
                    disabled={!transaction?.key}
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
            <AttachmentModal isOpen={attachmentsModalOpen} setIsOpen={setAttachmentsModalOpen} actionType={actionType} setActionType={setActionType} refecthData={attachmentRefetch} attachmentSource={transaction} selectedPatientAttacment={selectedAttachment} setSelectedPatientAttacment={setSelectedAttachment} requestedPatientAttacment={requestedAttachment} setRequestedPatientAttacment={setRequestedAttachment} attatchmentType="PATIENT_PROFILE_ATTACHMENT" patientKey={transaction?.key} />
            <MyTable
                height={200}
                loading={loadAttachment}
                data={attachments ?? []}
                columns={columns}
                onRowClick={rowData => { setSelectedAttachment(rowData); }}
                rowClassName={isSelected}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
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
export default InventoryAttachment;
