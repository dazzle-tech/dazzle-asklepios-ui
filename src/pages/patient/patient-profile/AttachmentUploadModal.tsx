import React, { useEffect, useRef, useState } from "react";
import { Button, Divider, Form, Input, Modal } from "rsuite";
import FileUploadIcon from '@rsuite/icons/FileUpload';
import { newApPatientInsurance } from "@/types/model-types-constructor";
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { useAppDispatch, useAppSelector } from '@/hooks';
import DetailIcon from '@rsuite/icons/Detail';
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { useFetchAttachmentLightQuery, useUpdateAttachmentDetailsMutation, useUploadMutation } from "@/services/attachmentService";
import { ApPatient } from "@/types/model-types";



const AttachmentModal = ({ isOpen, onClose, localPatient }) => {

    const [requestedPatientAttacment, setRequestedPatientAttacment] = useState();
    const [actionType, setActionType] = useState(null); // 'view' or 'download'
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const [newAttachmentType, setNewAttachmentType] = useState();
    const attachmentFileInputRef = useRef(null);
    const [newAttachmentSrc, setNewAttachmentSrc] = useState(null);
    const patientSlice = useAppSelector(state => state.patient);
    const { data: attachmentsLovQueryResponse } = useGetLovValuesByCodeQuery('ATTACH_TYPE');
    const [newAttachmentDetails, setNewAttachmentDetails] = useState('');
    const [Update, UpdateMutation] = useUpdateAttachmentDetailsMutation();
    const [upload, uploadMutation] = useUploadMutation();
    const [selectedAttachType, setSelectedAttachType] = useState('');
    const [patient, setPatient] = useState<ApPatient>(localPatient)
    const [uploadedAttachmentOpject, setUploadedAttachmentOpject] = useState({
        formData: null,
        type: null,
        refKey: null
    });



    const { data: fetchPatintAttachmentsResponce, refetch: attachmentRefetch } =
    useFetchAttachmentLightQuery({ refKey: localPatient?.key }, { skip: !localPatient?.key });

    const handleAttachmentFileUploadClick = type => {
        setNewAttachmentType(type); // PATIENT_PROFILE_ATTACHMENT or PATIENT_PROFILE_PICTURE
        if (localPatient?.key) attachmentFileInputRef.current.click();
    };
 
    
    const [selectedPatientAttacment, setSelectedPatientAttacment] = useState<any>({
        ...newApPatientInsurance
    });
    const handleAttachmentSelected = attachmentKey => {
        setRequestedPatientAttacment(attachmentKey);
        setActionType('view');
      };

    const handleCleareAttachment = () => {
        setSelectedPatientAttacment(null);
        setRequestedPatientAttacment(null);
        setActionType(null);
        setAttachmentsModalOpen(false);
        handleFinishUploading();
    };
    const closeModal = () => {
        onClose()
        handleCleareAttachment
    };

    const handleFileUpload = async event => {
        if (!localPatient) {
            console.log('No Selected Patient')
            return
        };

        const selectedFile = event.target.files[0];
        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);

            if (isOpen) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setNewAttachmentSrc(reader.result);
                };
                reader.readAsDataURL(selectedFile);

                setUploadedAttachmentOpject({
                    formData: formData,
                    type: newAttachmentType,
                    refKey: localPatient?.key
                });
            }
        }
    };

    const handleFinishUploading = () => {
        setUploadedAttachmentOpject({
          formData: null,
          type: null,
          refKey: null
        });
        setNewAttachmentSrc(null);
        setNewAttachmentType(null);
        setNewAttachmentDetails('');
        closeModal();
        attachmentRefetch();
        setSelectedPatientAttacment(null);
        handleAttachmentSelected(null);
        setActionType(null);
      };

    const handleUpdateAttachmentDetails = () => {
        Update({
            key: selectedPatientAttacment.key,
            attachmentDetails: newAttachmentDetails
        })
            .unwrap()
            .then(() => handleFinishUploading());
    };

    return (
        <Modal open={isOpen} onClose={closeModal}>
            <Modal.Header>
                <Modal.Title onClick={() => {
                    handleAttachmentFileUploadClick('PATIENT_PROFILE_ATTACHMENT')
                }} >New/Edit Patient Attachments</Modal.Title>
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
                        disabled={actionType}
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
                <Form fluid>
                    <Form.Group>
                        <Form.ControlLabel>Type</Form.ControlLabel>
                        <Input
                            as="select"
                            required
                            value={selectedAttachType || ''}
                            onChange={value => setSelectedAttachType(value)}
                        >
                            {attachmentsLovQueryResponse?.object?.map(item => (
                                <option key={item.key} value={item.key}>
                                    {item.lovDisplayVale}
                                </option>
                            ))}
                        </Input>
                    </Form.Group>
                </Form>

                <br />
                <Input
                    value={newAttachmentDetails || ''}
                    onChange={setNewAttachmentDetails}
                    as="textarea"
                    rows={3}
                    placeholder="Details"
                />
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={() => closeModal()} appearance="subtle">
                    Cancel
                </Button>
                <Divider vertical />
                <Button
                    disabled={actionType ? false : !uploadedAttachmentOpject?.formData}
                    onClick={() => {
                        console.log(uploadedAttachmentOpject);
                        actionType === 'view'
                            ? handleUpdateAttachmentDetails()
                            : upload({
                                ...uploadedAttachmentOpject,
                                details: newAttachmentDetails,
                                accessType: selectedAttachType
                            })
                                .unwrap()
                                .then(() => handleFinishUploading());
                    }}
                    appearance="primary"
                >
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    )

}






export default AttachmentModal;

