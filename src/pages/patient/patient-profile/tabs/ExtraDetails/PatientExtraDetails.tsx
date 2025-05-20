
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetPatientSecondaryDocumentsQuery, useDeletePatientSecondaryDocumentMutation } from '@/services/patientService'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPen } from '@fortawesome/free-solid-svg-icons';
import { newApPatientSecondaryDocuments } from '@/types/model-types-constructor';
import { PlusRound } from '@rsuite/icons';
import { notify } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddExtraDetails from './AddExtraDetails';
import { formatDateWithoutSeconds } from '@/utils';
const PatientExtraDetails = ({ localPatient }) => {
    const dispatch = useAppDispatch();
    const [secondaryDocumentModalOpen, setSecondaryDocumentModalOpen] = useState(false);
    const [secondaryDocument, setSecondaryDocument] = useState(newApPatientSecondaryDocuments);
    const [deleteDocModalOpen, setDeleteDocModalOpen] = useState(false);
    const [deleteSecondaryDocument] = useDeletePatientSecondaryDocumentMutation();
    const [selectedSecondaryDocument, setSelectedSecondaryDocument] = useState<any>({ ...newApPatientSecondaryDocuments });
    // Initialize patient preferred health professional list request with default filters
    const [documenstListRequest, setDocumentsListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ]
    });
    // Fetch patient secondary documents list
    const { data: patientSecondaryDocumentsResponse, refetch: patientSecondaryDocuments } = useGetPatientSecondaryDocumentsQuery(documenstListRequest, { skip: !localPatient.key });
    // Function to check if the current row is the selected one
    const isSelectedDocument = rowData => {
        if (rowData && secondaryDocument && secondaryDocument.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // Handle Delete Secondary Document Function
    const handleDeleteSecondaryDocument = () => {
        deleteSecondaryDocument({
            key: selectedSecondaryDocument.key
        }).then(
            () => (
                patientSecondaryDocuments(),
                dispatch(notify({ msg: 'Secondary Document Deleted', sev: 'success' })),
                setDeleteDocModalOpen(false)
            )
        );
        handleClearDocument();
    };
    // Handle Clear Secondary Document Function
    const handleClearDocument = () => {
        setSecondaryDocumentModalOpen(false);
        setSecondaryDocument(newApPatientSecondaryDocuments);
        setDeleteDocModalOpen(false);

    };
    // Handle Edit Secondary Document Function
    const handleEditSecondaryDocument = () => {
        if (selectedSecondaryDocument) {
            setSecondaryDocumentModalOpen(true);
        }
    };
    const columns = [
        {
            key: 'documentCountry',
            title: <Translate>Document Country</Translate>,
            flexGrow: 4,
            render: (rowData: any) =>
                rowData.documentCountryLvalue
                    ? rowData.documentCountryLvalue.lovDisplayVale
                    : rowData.documentCountryLkey,
        },
        {
            key: 'documentType',
            title: <Translate>Document Type</Translate>,
            flexGrow: 4,
            render: (rowData: any) =>
                rowData.documentTypeLvalue
                    ? rowData.documentTypeLvalue.lovDisplayVale
                    : rowData.documentTypeLkey,
        },
        {
            key: 'documentNo',
            title: <Translate>Document Number</Translate>,
            flexGrow: 4,
            dataKey: 'documentNo',
        },
        {
            key: 'createdAt',
            title: 'CREATED AT/BY',
            fullText: true,
            render: (row: any) => row?.createdAt ? <>{row?.createdByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.createdAt)}</span> </> : ' '
        },
        {
            key: 'updatedAt',
            title: 'UPDATED AT/BY',
            fullText: true,
            render: (row: any) => row?.updatedAt ? <>{row?.updatedByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.updatedAt)}</span> </> : ' '
        },
    ];
    // Handle adding a new Secondary Document Function
    const handleNewDocSecondary = () => {
        setSecondaryDocumentModalOpen(true);
        setSelectedSecondaryDocument(newApPatientSecondaryDocuments);
    };
    // Effects 
    useEffect(() => {
        if (selectedSecondaryDocument) {
            setSecondaryDocument(selectedSecondaryDocument);
        }
    }, [selectedSecondaryDocument]);
    useEffect(() => {
        setDocumentsListRequest((prev) => ({
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
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: localPatient.key,
                        },
                    ]
                    : []),
            ],
        }));
    }, [localPatient.key]);
    return (
        <div className="tab-main-container">
            <div className="tab-content-btns">
                <AddExtraDetails open={secondaryDocumentModalOpen} setOpen={setSecondaryDocumentModalOpen} localPatient={localPatient} secondaryDocument={secondaryDocument} setSecondaryDocument={setSecondaryDocument} refetch={patientSecondaryDocuments} />
                <MyButton
                    onClick={handleNewDocSecondary}
                    disabled={!localPatient.key}
                    prefixIcon={() => <PlusRound />}>
                    New Secondary Document
                </MyButton>
                <MyButton
                    disabled={!selectedSecondaryDocument?.key}
                    onClick={handleEditSecondaryDocument}
                    prefixIcon={() => <FontAwesomeIcon icon={faUserPen} />}>
                    Edit
                </MyButton>
                <MyButton
                    disabled={!selectedSecondaryDocument?.key}
                    onClick={() => { setDeleteDocModalOpen(true) }}
                    prefixIcon={() => <FontAwesomeIcon icon={faTrash} />}>
                    Delete
                </MyButton>
            </div>
            <MyTable
                height={600}
                data={patientSecondaryDocumentsResponse?.object ?? []}
                columns={columns}
                onRowClick={rowData => {
                    setSelectedSecondaryDocument(rowData);
                }}
                rowClassName={isSelectedDocument}
            />
            <DeletionConfirmationModal
                open={deleteDocModalOpen}
                setOpen={setDeleteDocModalOpen}
                itemToDelete='Document'
                actionButtonFunction={handleDeleteSecondaryDocument}>
            </DeletionConfirmationModal>
        </div>
    );
};

export default PatientExtraDetails;
