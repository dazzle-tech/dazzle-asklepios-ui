
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
const { Column, HeaderCell, Cell } = Table;
import { useAppDispatch, useAppSelector } from '@/hooks';
import React, { useEffect, useRef, useState } from 'react';
import {
    ButtonToolbar,
    Form,
    Panel,
    Table,
    Button,
    Modal,
} from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import RemindOutlineIcon from '@rsuite/icons/RemindOutline';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import { initialListRequest, ListRequest } from '@/types/types';
import TrashIcon from '@rsuite/icons/Trash';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import {
    useGetPatientSecondaryDocumentsQuery,
    useSaveNewSecondaryDocumentMutation,
    useDeletePatientSecondaryDocumentMutation,
} from '@/services/patientService'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPen } from '@fortawesome/free-solid-svg-icons';
import {
    newApPatientSecondaryDocuments,
} from '@/types/model-types-constructor';
import {
    useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { PlusRound } from '@rsuite/icons';
import { notify } from '@/utils/uiReducerActions';
const PatientExtraDetails = ({ localPatient }) => {
    const dispatch = useAppDispatch();
    const authSlice = useAppSelector(state => state.auth);
    const [secondaryDocumentModalOpen, setSecondaryDocumentModalOpen] = useState(false);
    const [secondaryDocument, setSecondaryDocument] = useState(newApPatientSecondaryDocuments);
    const [deleteDocModalOpen, setDeleteDocModalOpen] = useState(false);

    //CRUD
    const [saveSecondaryDocument, setSaveSecondaryDocument] = useSaveNewSecondaryDocumentMutation();
    const [deleteSecondaryDocument, deleteSecondaryDocumentMutation] =useDeletePatientSecondaryDocumentMutation();

    //LOV
    const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
    const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');

    const [selectedSecondaryDocument, setSelectedSecondaryDocument] = useState<any>({
        ...newApPatientSecondaryDocuments
    });
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
    const { data: patientSecondaryDocumentsResponse, refetch: patientSecondaryDocuments } = useGetPatientSecondaryDocumentsQuery(documenstListRequest, { skip: !localPatient.key });
   
    //handleFun
    const isSelectedDocument = rowData => {
        if (rowData && secondaryDocument && secondaryDocument.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    const handleCleareSecondaryDocument = () => {
        setSecondaryDocumentModalOpen(false);
        setSecondaryDocument(newApPatientSecondaryDocuments);
    };

    const handleSaveSecondaryDocument = () => {
        if (secondaryDocument.key === undefined) {
            saveSecondaryDocument({
                ...secondaryDocument,
                patientKey: localPatient.key,
                createdBy: authSlice.user.key,
                documentNo:
                    secondaryDocument.documentTypeLkey === 'NO_DOC'
                        ? 'No Document '
                        : secondaryDocument.documentNo

            })
                .unwrap()
                .then(() => {
                    dispatch(notify('Document Added Successfully'));
                    patientSecondaryDocuments();
                    handleCleareSecondaryDocument();
                });
        }
        else if (secondaryDocument.key) {
            saveSecondaryDocument({
                ...secondaryDocument,
                patientKey: localPatient.key,
                updatedBy: authSlice.user.key,
                documentNo:
                    secondaryDocument.documentTypeLkey === 'NO_DOC'
                        ? 'No Document '
                        : secondaryDocument.documentNo

            })
                .unwrap()
                .then(() => {
                    dispatch(notify('Document Updated Successfully'));
                    patientSecondaryDocuments();
                    handleCleareSecondaryDocument();
                });
        }

    };

    const handleDeleteSecondaryDocument = () => {
        deleteSecondaryDocument({
            key: selectedSecondaryDocument.key
        }).then(
            () => (
                patientSecondaryDocuments(),
                dispatch(notify('Secondary Document Deleted')),
                setDeleteDocModalOpen(false)
            )
        );
    };
    const handleClearDocument = () => {
        setSecondaryDocumentModalOpen(false);
        setSecondaryDocument(newApPatientSecondaryDocuments);
        setDeleteDocModalOpen(false);

    };
    const handleEditSecondaryDocument = () => {
        if (selectedSecondaryDocument) {
            setSecondaryDocumentModalOpen(true);
        }
    };

    //useEffect
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
        <>
            <Panel>

                <ButtonToolbar>

                    <Button style={{ backgroundColor: ' #00b1cc', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}
                        onClick={() => {
                            setSecondaryDocumentModalOpen(true);
                            setSelectedSecondaryDocument(newApPatientSecondaryDocuments);
                        }}
                        disabled={!localPatient.key}>
                        <PlusRound />   New Secondary Document
                    </Button>
                    <Button
                        disabled={!selectedSecondaryDocument?.key}
                        onClick={handleEditSecondaryDocument}
                        appearance="ghost"
                        style={{ border: '1px solid #00b1cc', backgroundColor: 'white', color: '#00b1cc', marginLeft: "3px" }}
                    >
                        <FontAwesomeIcon icon={faUserPen} style={{ marginRight: '5px', color: '#007e91' }} />

                        <span>Edit</span>
                    </Button>
                    <Button
                        disabled={!selectedSecondaryDocument?.key}
                        style={{ border: '1px solid  #007e91', backgroundColor: 'white', color: '#007e91', display: 'flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => { setDeleteDocModalOpen(true) }}
                    >
                        <TrashIcon /> <Translate>Delete</Translate>
                    </Button>


                </ButtonToolbar>

                <br />
                <Form layout="inline" fluid>
                    <Table
                        height={600}
                        data={patientSecondaryDocumentsResponse?.object ?? []}
                        headerHeight={40}
                        rowHeight={50}
                        bordered
                        cellBordered
                        onRowClick={rowData => {
                            setSelectedSecondaryDocument(rowData);
                        }}
                        rowClassName={isSelectedDocument}
                    >
                        <Column sortable flexGrow={4}>
                            <HeaderCell>
                                <Translate>Document Country</Translate>
                            </HeaderCell>
                            <Cell>
                                {rowData =>
                                    rowData.documentCountryLvalue
                                        ? rowData.documentCountryLvalue.lovDisplayVale
                                        : rowData.documentCountryLkey
                                }

                            </Cell>
                        </Column>

                        <Column sortable flexGrow={4}>
                            <HeaderCell>
                                <Translate>Document Type</Translate>
                            </HeaderCell>
                            <Cell>
                                {rowData =>
                                    rowData.documentTypeLvalue
                                        ? rowData.documentTypeLvalue.lovDisplayVale
                                        : rowData.documentTypeLkey
                                }

                            </Cell>
                        </Column>

                        <Column sortable flexGrow={4}>
                            <HeaderCell>
                                <Translate>Document Number</Translate>
                            </HeaderCell>
                            <Cell dataKey="documentNo" />
                        </Column>
                        <Column sortable flexGrow={4}>
                            <HeaderCell>
                                <Translate>Created By</Translate>
                            </HeaderCell>
                            <Cell >
                                {rowData => rowData?.createdByUser?.fullName}
                            </Cell>

                        </Column>
                        <Column sortable flexGrow={4}>
                            <HeaderCell>
                                <Translate>Created At</Translate>
                            </HeaderCell>
                            <Cell >
                                {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString("en-GB") : ""}

                            </Cell>
                        </Column>
                        <Column sortable flexGrow={4}>
                            <HeaderCell>
                                <Translate>Updated By</Translate>
                            </HeaderCell>
                            <Cell >
                                {rowData => rowData?.updatedByUser?.fullName}
                            </Cell>
                        </Column>
                        <Column sortable flexGrow={4}>
                            <HeaderCell>
                                <Translate>Updated At</Translate>
                            </HeaderCell>
                            <Cell >

                                {rowData => rowData.updatedAt ? new Date(rowData.updatedAt).toLocaleString("en-GB") : ""}
                            </Cell>
                        </Column>
                    </Table>
                </Form>
            </Panel>

            <Modal
                open={secondaryDocumentModalOpen}
                onClose={() => handleCleareSecondaryDocument()}
            >
                <Modal.Header>
                    <Modal.Title>Secondary Document</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form layout="inline" fluid>
                        <MyInput
                            required
                            column
                            width={165}
                            fieldLabel="Document Country"
                            fieldType="select"
                            fieldName="documentCountryLkey"
                            selectData={countryLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={secondaryDocument}
                            setRecord={newRecord =>
                                setSecondaryDocument({
                                    ...secondaryDocument,
                                    ...newRecord
                                })
                            }
                        />

                        <MyInput
                            required
                            column
                            width={165}
                            fieldLabel="Document Type"
                            fieldType="select"
                            fieldName="documentTypeLkey"
                            selectData={docTypeLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={secondaryDocument}
                            setRecord={newRecord =>
                                setSecondaryDocument({
                                    ...secondaryDocument,
                                    ...newRecord
                                })
                            }
                        />
                        <MyInput
                            required
                            column
                            width={165}
                            fieldLabel="Document Number"
                            fieldName="documentNo"
                            record={secondaryDocument}
                            setRecord={newRecord =>
                                setSecondaryDocument({
                                    ...secondaryDocument,
                                    ...newRecord,
                                    documentNo:
                                        secondaryDocument.documentTypeLkey === 'NO_DOC' ? 'NO_DOC' : newRecord.documentNo
                                })
                            }
                            disabled={secondaryDocument.documentTypeLkey === 'NO_DOC'}
                        />
                    </Form>
                </Modal.Body>
                <Modal.Footer style={{display:'flex' ,alignItems:'center'}}>
                     <ButtonToolbar style={{display:'flex' ,alignItems:'center',zoom:.8,marginLeft:'auto'}}>
                     <Button onClick={() => handleCleareSecondaryDocument()} appearance="ghost" style={{ color: ' #00b1cc', border: '1px solid  #00b1cc' }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            handleSaveSecondaryDocument();
                        }}
                        style={{ backgroundColor: ' #00b1cc', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}
                        
                    >
                        <FontAwesomeIcon icon={faCheckDouble} style={{ marginRight: '5px', color: 'white' }} />
                        Save
                    </Button>
                     </ButtonToolbar>
                   
                </Modal.Footer>
            </Modal>
            <Modal open={deleteDocModalOpen} onClose={handleClearDocument}>
                <Modal.Header>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        <RemindOutlineIcon style={{ color: '#ffca61', marginRight: '8px', fontSize: '24px' }} />
                        <Translate style={{ fontSize: '24px' }} >
                            Are you sure you want to delete this Document?
                        </Translate>
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleClearDocument} appearance="ghost" color='cyan'>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteSecondaryDocument}
                        appearance="primary"
                    >
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>

        </>
    );
};

export default PatientExtraDetails;
