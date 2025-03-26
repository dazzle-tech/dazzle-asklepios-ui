
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
const { Column, HeaderCell, Cell } = Table;
import { useAppDispatch, useAppSelector } from '@/hooks';
import React, { useEffect, useRef, useState } from 'react';
import {
    ButtonToolbar,
    Form,
    IconButton,
    Panel,
    Drawer,
    Stack,
    Table,
    SelectPicker,
    Button,
    Pagination,
    Modal,
    Input,
} from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { FaClock, FaPencil, FaPlus, FaQuestion } from 'react-icons/fa6';
import RemindOutlineIcon from '@rsuite/icons/RemindOutline';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import { initialListRequest, ListRequest } from '@/types/types';
import TrashIcon from '@rsuite/icons/Trash';
import {
    useFetchAttachmentQuery,
    useFetchAttachmentLightQuery,
    useGetPatientAttachmentsListQuery,
    useFetchAttachmentByKeyQuery,
    useUploadMutation,
    useDeleteAttachmentMutation,
    useUpdateAttachmentDetailsMutation
} from '@/services/attachmentService';
import {
    useGetPatientRelationsQuery,
    useGetPatientsQuery,
    useSavePatientMutation,
    useSavePatientRelationMutation,
    useSendVerificationOtpMutation,
    useVerifyVerificationOtpMutation,
    useGetPatientAllergiesViewQuery,
    useGetPatientSecondaryDocumentsQuery,
    useSaveNewSecondaryDocumentMutation,
    useGetPatientInsuranceQuery,
    useDeletePatientInsuranceMutation,
    useDeletePatientRelationMutation,
    useDeletePatientSecondaryDocumentMutation,
    useSavePatientAdministrativeWarningsMutation,
    useGetPatientAdministrativeWarningsQuery,
    useUpdatePatientAdministrativeWarningsMutation,
    useDeletePatientAdministrativeWarningsMutation,
    useGetAgeGroupValueQuery
} from '@/services/patientService'
import {
    newApAttachment,
    newApPatient,
    newApPatientInsurance,
    newApPatientRelation,
    newApPatientSecondaryDocuments,
    newApPatientAdministrativeWarnings
} from '@/types/model-types-constructor';
import DetailIcon from '@rsuite/icons/Detail';
import FileUploadIcon from '@rsuite/icons/FileUpload';
import {
    useGetLovValuesByCodeAndParentQuery,
    useGetLovValuesByCodeQuery
} from '@/services/setupService';
import {
    ApAttachment,
} from '@/types/model-types';
import { Block, Check, DocPass, Edit, History, Icon, PlusRound, Detail } from '@rsuite/icons';
import { notify } from '@/utils/uiReducerActions';
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
    const [newAttachmentSrc, setNewAttachmentSrc] = useState(null);
    const [requestedPatientAttacment, setRequestedPatientAttacment] = useState();
    const [upload, uploadMutation] = useUploadMutation();
    const dispatch = useAppDispatch();
    const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);
    const authSlice = useAppSelector(state => state.auth);
    const [Update, UpdateMutation] = useUpdateAttachmentDetailsMutation();
    const [newAttachmentType, setNewAttachmentType] = useState();
    const [selectedAttachment, setSelectedAttachment] = useState(null);
    const [newAttachmentDetails, setNewAttachmentDetails] = useState('');
    const [actionType, setActionType] = useState(null);
    const [deleteAttachment, deleteAttachmentMutation] = useDeleteAttachmentMutation();
    const [patientAttachments, setPatientAttachments] = useState([]);
    const { data: attachmentsLovQueryResponse } = useGetLovValuesByCodeQuery('ATTACH_TYPE');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const attachmentFileInputRef = useRef(null);
    const [selectedAttachType, setSelectedAttachType] = useState({
        accessTypeLkey: ''
    });
    const [patientRelationListRequest, setPatientRelationListRequest] = useState<ListRequest>({
        ...initialListRequest,
        pageSize: 1000
    });
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
    const { data: patientRelationsResponse, refetch: patientRelationsRefetch } =
        useGetPatientRelationsQuery(
            {
                listRequest: patientRelationListRequest,
                key: localPatient?.key
            },
            { skip: !localPatient.key }
        );
    const [selectedPatientAttacment, setSelectedPatientAttacment] = useState<any>({
        ...newApPatientInsurance
    });
    const { data: fetchPatintAttachmentsResponce, refetch: attachmentRefetch } =
        useGetPatientAttachmentsListQuery(attachmentsListRequest, { skip: !localPatient?.key });
    const [uploadedAttachmentOpject, setUploadedAttachmentOpject] = useState({
        formData: null,
        type: null,
        refKey: null,

    });
    const [savePatientRelation, savePatientRelationMutation] = useSavePatientRelationMutation();
    const [relationModalOpen, setRelationModalOpen] = useState(false);
    const [selectedPatientRelation, setSelectedPatientRelation] = useState<any>({
        ...newApPatientRelation
    });
    const {
        data: fetchAttachmentByKeyResponce,
        error,
        isLoading,
        isFetching,
        isSuccess,
        refetch
    } = useFetchAttachmentByKeyQuery(
        { key: requestedPatientAttacment },
        { skip: !requestedPatientAttacment || !localPatient.key }
    );
    const handleDownloadSelectedPatientAttachment = attachmentKey => {
        setRequestedPatientAttacment(attachmentKey);
        setActionType('download');
    };
    const handleFileUpload = async event => {
        if (!localPatient) return;

        const selectedFile = event.target.files[0];
        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);

            if (attachmentsModalOpen) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setNewAttachmentSrc(reader.result);
                };
                reader.readAsDataURL(selectedFile);

                setUploadedAttachmentOpject({
                    formData: formData,
                    type: newAttachmentType,
                    refKey: localPatient.key
                });
            }
        }
    };
    const handleUpdateAttachmentDetails = () => {
        Update({
            key: selectedPatientAttacment.key,
            attachmentDetails: newAttachmentDetails,
            updatedBy: authSlice.user.key,
            accessType: selectedAttachType.accessTypeLkey
        })
            .unwrap()
            .then(() => handleFinishUploading());
    };
    const fetchPatientImageResponse = useFetchAttachmentQuery(
        {
            type: 'PATIENT_PROFILE_PICTURE',
            refKey: localPatient.key,
        },
        { skip: !localPatient.key }
    );

    const handleFinishUploading = () => {
        setUploadedAttachmentOpject({
            formData: null,
            type: null,
            refKey: null
        });
        setNewAttachmentSrc(null);
        setNewAttachmentType(null);
        setNewAttachmentDetails('');
        setAttachmentsModalOpen(false);
        attachmentRefetch();
        setSelectedPatientAttacment(null);
        handleAttachmentSelected(null);
        setActionType(null);
        setSelectedAttachType(null);
    };
    const handleCleareAttachment = () => {
        setAttachmentsModalOpen(false);
        setRequestedPatientAttacment(null);
        setRequestedPatientAttacment(null);
        setNewAttachmentSrc(null);
        setNewAttachmentType(null);
        setNewAttachmentDetails('');
        attachmentRefetch();
        setSelectedPatientAttacment(null);
        handleAttachmentSelected(null);
        setActionType(null);
    };

    const handleDeleteAttachment = (attachment) => {
        setSelectedAttachment(attachment);
        setDeleteModalOpen(true);
    };
    const handleClearAttachmentDelete = () => {
        setDeleteModalOpen(false);
        handleCleareAttachment();

    };
    const handleAttachmentFileUploadClick = type => {
        setNewAttachmentType(type); // PATIENT_PROFILE_ATTACHMENT or PATIENT_PROFILE_PICTURE
        if (localPatient && attachmentsModalOpen) attachmentFileInputRef.current.click();
    };
    const handleAttachmentSelected = attachmentKey => {
        setRequestedPatientAttacment(attachmentKey);
        setActionType('view');
    };
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
                setSelectedPatientAttacment(fetchAttachmentByKeyResponce);
                setNewAttachmentDetails(fetchAttachmentByKeyResponce.extraDetails);
                setSelectedAttachType({ accessTypeLkey: fetchAttachmentByKeyResponce.accessTypeLkey })
            }
        }
    }, [requestedPatientAttacment, fetchAttachmentByKeyResponce, actionType]);
    useEffect(() => {
        if (isSuccess && fetchAttachmentByKeyResponce) {
            if (actionType === 'download') {
                handleDownload(fetchAttachmentByKeyResponce);
            } else if (actionType === 'view') {
                setAttachmentsModalOpen(true);
                setSelectedPatientAttacment(fetchAttachmentByKeyResponce);
                setNewAttachmentDetails(fetchAttachmentByKeyResponce.extraDetails);
                setSelectedAttachType({ accessTypeLkey: fetchAttachmentByKeyResponce.accessTypeLkey });
            }
        }
    }, [fetchAttachmentByKeyResponce, actionType]);
  
    useEffect(() => {
        if (savePatientRelationMutation.status === 'fulfilled') {
            setSelectedPatientRelation(savePatientRelationMutation.data);
            setPatientRelationListRequest({ ...patientRelationListRequest, timestamp: Date.now() });
            setRelationModalOpen(false);
            dispatch(notify('Relation saved'));
        }
    }, [savePatientRelationMutation]);
    useEffect(() => {
        if (uploadMutation.status === 'fulfilled') {
            dispatch(notify('patient image uploaded'));
            if (!attachmentsModalOpen) setPatientImage(uploadMutation.data);
        }
    }, [uploadMutation]);
    useEffect(() => {
        if (
            fetchPatientImageResponse.isSuccess &&
            fetchPatientImageResponse.data &&
            fetchPatientImageResponse.data.key
        ) {
            setPatientImage(fetchPatientImageResponse.data);
        } else {
            setPatientImage(undefined);
        }
    }, [fetchPatientImageResponse]);

    useEffect(() => {
        if (localPatient) {


            setPatientRelationListRequest({
                ...patientRelationListRequest,
                filters: [
                    {
                        fieldName: 'patient_key',
                        operator: 'match',
                        value: localPatient.key
                    }
                ]
            });

        }
    }, []);
    return (
        <>
            <Panel>


                <Modal open={attachmentsModalOpen} onClose={() => handleCleareAttachment()}>
                    <Modal.Header>
                        <Modal.Title>New/Edit Patient Attachments</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div
                            style={{
                                borderRadius: '5px',
                                border: '1px solid #e1e1e1',
                                margin: '2px',
                                position: 'relative',
                                bottom: 0,
                                width: '99%',
                                height: 400,
                                display: 'flex',
                                alignContent: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <input
                                type="file"
                                ref={attachmentFileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                                accept="image/*"
                            />

                            {newAttachmentSrc ? (
                                newAttachmentSrc ? (
                                    <img

                                        alt={'Attachment Preview'}
                                        width={380}
                                        height={380}
                                        onClick={() =>
                                            handleAttachmentFileUploadClick('PATIENT_PROFILE_ATTACHMENT')
                                        }
                                        src={newAttachmentSrc}
                                    />
                                ) : (
                                    <FileUploadIcon
                                        onClick={() => {
                                            handleAttachmentFileUploadClick('PATIENT_PROFILE_ATTACHMENT');

                                        }
                                        }
                                        style={{ fontSize: '250px', marginTop: '10%' }}
                                    />
                                )
                            ) : selectedPatientAttacment && selectedPatientAttacment.fileContent ? (
                                selectedPatientAttacment.contentType === 'application/pdf' ? (
                                    <DetailIcon
                                        onClick={() =>
                                            handleAttachmentFileUploadClick('PATIENT_PROFILE_ATTACHMENT')
                                        }
                                        style={{ fontSize: '250px', marginTop: '10%' }}
                                    />
                                ) : (
                                    <img
                                        alt={'Attachment Preview'}
                                        width={380}
                                        height={380}
                                        onClick={() =>
                                            handleAttachmentFileUploadClick('PATIENT_PROFILE_ATTACHMENT')
                                        }
                                        src={`data:${selectedPatientAttacment.contentType};base64,${selectedPatientAttacment.fileContent}`}
                                    />
                                )
                            ) : (
                                <FileUploadIcon
                                    onClick={() =>
                                        handleAttachmentFileUploadClick('PATIENT_PROFILE_ATTACHMENT')
                                    }
                                    style={{ fontSize: '250px', marginTop: '10%' }}
                                />
                            )}
                        </div>

                        <br />
                        <Form>
                            <MyInput
                                width={550}
                                fieldName="accessTypeLkey"
                                fieldType="select"
                                selectData={attachmentsLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                fieldLabel="Type"
                                selectDataValue="key"
                                record={selectedAttachType}
                                setRecord={setSelectedAttachType}
                            />

                        </Form>

                        <br />
                        <Input
                            value={newAttachmentDetails}
                            onChange={setNewAttachmentDetails}
                            as="textarea"
                            rows={3}
                            placeholder="Details"
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={() => handleCleareAttachment()} appearance="subtle">
                            Cancel
                        </Button>

                        <Button
                            disabled={actionType ? false : !uploadedAttachmentOpject?.formData}
                            onClick={() => {
                                actionType === 'view'
                                    ? handleUpdateAttachmentDetails()
                                    : upload({
                                        ...uploadedAttachmentOpject,
                                        details: newAttachmentDetails,
                                        accessType: selectedAttachType.accessTypeLkey,
                                        createdBy: authSlice.user.key
                                    })
                                        .unwrap()
                                        .then(() => {
                                            handleFinishUploading();
                                        })
                            }}
                            appearance="primary"
                        >
                            Save
                        </Button>
                    </Modal.Footer>
                </Modal>            <Modal open={deleteModalOpen} onClose={handleClearAttachmentDelete}>
                    <Modal.Header>
                        <Modal.Title><h6>Confirm Delete</h6></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            <RemindOutlineIcon style={{ color: '#ffca61', marginRight: '8px', fontSize: '24px' }} />
                            <Translate style={{ fontSize: '24px' }} >
                                Are you sure you want to delete this Attachment?
                            </Translate>
                        </p>

                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={handleClearAttachmentDelete} appearance="ghost" color="blue" >
                            Cancel
                        </Button>

                        <Button
                            onClick={() => {
                                deleteAttachment({ key: selectedAttachment.key })
                                    .then(() => {
                                        attachmentRefetch();
                                        fetchPatientImageResponse.refetch();
                                        dispatch(notify('Deleted Successfully'))
                                        handleClearAttachmentDelete();
                                    })
                            }}
                            appearance="primary"
                        >
                            Delete
                        </Button>
                    </Modal.Footer>
                </Modal>

                <ButtonToolbar style={{ padding: 1 ,zoom:.8 }}>


                    <Button style={{ backgroundColor: 'var(--primary-blue)', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}
                        onClick={() => {
                            handleCleareAttachment();
                            setAttachmentsModalOpen(true);

                        }}
                        disabled={!localPatient.key}>

                        <Icon as={FaPlus} /> New Attachment
                    </Button>
                </ButtonToolbar>

                <br />

                <Table
                    height={600}
                    sortColumn={patientRelationListRequest.sortBy}
                    sortType={patientRelationListRequest.sortType}
                    onSortColumn={(sortBy, sortType) => {
                        if (sortBy)
                            setPatientRelationListRequest({
                                ...patientRelationListRequest,
                                sortBy,
                                sortType
                            });
                    }}
                    headerHeight={40}
                    rowHeight={50}
                    bordered
                    cellBordered
                    onRowClick={rowData => {
                        setSelectedPatientRelation(rowData);
                    }}
                    data={patientAttachments ?? []}
                >
                    <Column sortable flexGrow={4} fullText>
                        <HeaderCell>
                            <Translate>Attachment Name</Translate>
                        </HeaderCell>
                        <Cell dataKey="fileName" fullText />
                    </Column>

                    <Column sortable flexGrow={4} fullText>
                        <HeaderCell>
                            <Translate>File Type</Translate>
                        </HeaderCell>
                        <Cell dataKey="contentType" fullText />
                    </Column>

                    <Column sortable flexGrow={4} fullText>
                        <HeaderCell>
                            <Translate>Details</Translate>
                        </HeaderCell>
                        <Cell dataKey="extraDetails" fullText />
                    </Column>
                    <Column sortable flexGrow={4} fullText>
                        <HeaderCell>
                            <Translate>Source</Translate>
                        </HeaderCell>
                        <Cell fullText>
                            {rowData => rowData.accessTypeLvalue
                                ? rowData.accessTypeLvalue.lovDisplayVale
                                : rowData.accessTypeLkey

                            }</Cell>
                    </Column>

                    <Column sortable flexGrow={4} fullText>
                        <HeaderCell>
                            <Translate>Download</Translate>
                        </HeaderCell>
                        <Cell fullText>
                            {attachment => (
                                <Button
                                    appearance="link"
                                    onClick={() => handleDownloadSelectedPatientAttachment(attachment.key)}
                                >
                                    Download <FileDownloadIcon style={{ marginLeft: '10px', scale: '1.4' }} />
                                </Button>
                            )}
                        </Cell>
                    </Column>
                    <Column sortable flexGrow={4} fullText>
                        <HeaderCell>
                            <Translate>Created By</Translate>
                        </HeaderCell>
                        <Cell fullText>
                            {rowData => rowData?.createdByUser?.fullName}
                        </Cell>

                    </Column>
                    <Column sortable flexGrow={4} fullText>
                        <HeaderCell>
                            <Translate>Created At</Translate>
                        </HeaderCell>
                        <Cell fullText>
                            {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString("en-GB") : ""}

                        </Cell>
                    </Column>
                    <Column sortable flexGrow={4} fullText>
                        <HeaderCell>
                            <Translate>Updated By</Translate>
                        </HeaderCell>
                        <Cell fullText>
                            {rowData => rowData?.updatedByUser?.fullName}
                        </Cell>
                    </Column>
                    <Column sortable flexGrow={4} fullText>
                        <HeaderCell>
                            <Translate>Updated At</Translate>
                        </HeaderCell>
                        <Cell fullText>

                            {rowData => rowData.updatedAt ? new Date(rowData.updatedAt).toLocaleString("en-GB") : ""}
                        </Cell>
                    </Column>
                    <Column sortable flexGrow={4} fullText>
                        <HeaderCell>
                            <Translate>Actions</Translate>
                        </HeaderCell>
                        <Cell fullText>
                            {attachment => (
                                <div>
                                    <Button
                                        appearance="link"
                                        onClick={() => handleAttachmentSelected(attachment.key)}
                                    >
                                        Preview / Edit
                                    </Button>
                                </div>
                            )}
                        </Cell>
                    </Column>
                    <Column sortable flexGrow={3} fullText>
                        <HeaderCell>
                            <Translate>Delete</Translate>
                        </HeaderCell>
                        <Cell fullText>
                            {attachment => (
                                <div>

                                    <Button
                                        appearance="link"
                                        color="blue"
                                        onClick={() => handleDeleteAttachment(attachment)}

                                    >
                                        <TrashIcon style={{ marginLeft: '10px', scale: '1.4' }} />
                                    </Button>
                                </div>
                            )}
                        </Cell>
                    </Column>
                </Table>

            </Panel>
        </>
    );
};

export default PatientAttachment;
