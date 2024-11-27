import React, { useEffect, useRef, useState } from "react";
import { Button, Divider, Form, Input, Modal } from "rsuite";
import FileUploadIcon from '@rsuite/icons/FileUpload';
import { newApPatientInsurance } from "@/types/model-types-constructor";
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { useAppDispatch, useAppSelector } from '@/hooks';
import DetailIcon from '@rsuite/icons/Detail';
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { useFetchAttachmentLightQuery, useUpdateAttachmentDetailsMutation, useUploadMutation,useFetchAttachmentByKeyQuery } from "@/services/attachmentService";
import { ApPatient } from "@/types/model-types";
import MyInput from "@/components/MyInput";



const AttachmentModal = ({ isOpen, localPatient,attatchmentType ,selected ,requested,actionType}) => {
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(isOpen);
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
    const {
        data: fetchAttachmentByKeyResponce,
        error,
        isLoading,
        isFetching,
        isSuccess,
        refetch
      } = useFetchAttachmentByKeyQuery(
        { key: requested },
        { skip: !requested || !localPatient.key }
      );
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
    useEffect(() => {
        if (isSuccess && fetchAttachmentByKeyResponce) {
          if (actionType === 'download') {
            handleDownload(fetchAttachmentByKeyResponce);
          } else if (actionType === 'view') {
            setAttachmentsModalOpen(true);
            setSelectedPatientAttacment(fetchAttachmentByKeyResponce);
            setNewAttachmentDetails(fetchAttachmentByKeyResponce.extraDetails);
            setSelectedAttachType(fetchAttachmentByKeyResponce.accessTypeLkey);
          }
        }
      }, [requested, fetchAttachmentByKeyResponce, actionType]);

    const { data: fetchPatintAttachmentsResponce, refetch: attachmentRefetch } =
    useFetchAttachmentLightQuery({ refKey: localPatient?.key }, { skip: !localPatient?.key });
console.log("Action",fetchAttachmentByKeyResponce);
    const handleAttachmentFileUploadClick = attatchmentType => {
        console.log(localPatient?.key);
        setNewAttachmentType(attatchmentType); // PATIENT_PROFILE_ATTACHMENT or PATIENT_PROFILE_PICTURE or APPOINTMENT_ATTACHMENT
        if (localPatient?.key && attachmentsModalOpen) attachmentFileInputRef.current.click();
    };
 
    const [selectedPatientAttacment, setSelectedPatientAttacment] = useState<any>({
        ...newApPatientInsurance
    });
    const handleCleareAttachment = () => {
        setSelectedPatientAttacment(null);
        setAttachmentsModalOpen(false);
        setNewAttachmentSrc(null);
        setNewAttachmentType(null);
        setNewAttachmentDetails('');
        setAttachmentsModalOpen(false);
        attachmentRefetch();
        setSelectedPatientAttacment(null);
        setAttachmentsModalOpen(false);
        handleFinishUploading();
    };
    const closeModal = () => {
        handleCleareAttachment()
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
      };
    const handleUpdateAttachmentDetails = () => {
        Update({
            key: selected.key,
            attachmentDetails: newAttachmentDetails
        })
            .unwrap()
            .then(() => {handleFinishUploading();});
    };
  
    return (
        <Modal open={attachmentsModalOpen} onClose={()=>handleCleareAttachment()}>
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
                                    handleAttachmentFileUploadClick(attatchmentType)
                                }
                                src={newAttachmentSrc}
                            />
                        ) : (
                            <FileUploadIcon
                                onClick={() => {
                                    handleAttachmentFileUploadClick(attatchmentType);

                                }
                                }
                                style={{ fontSize: '250px', marginTop: '10%' }}
                            />
                        )
                    ) : selected && selected.fileContent ? (
                        selected.contentType === 'application/pdf' ? (
                            <DetailIcon
                                onClick={() =>
                                    handleAttachmentFileUploadClick(attatchmentType)
                                }
                                style={{ fontSize: '250px', marginTop: '10%' }}
                            />
                        ) : (
                            <img
                                alt={'Attachment Preview'}
                                width={380}
                                height={380}
                                onClick={() =>
                                    handleAttachmentFileUploadClick(attatchmentType)
                                }
                                src={`data:${selected.contentType};base64,${selected.fileContent}`}
                            />
                        )
                    ) : (
                        <FileUploadIcon
                            onClick={() =>
                                handleAttachmentFileUploadClick(attatchmentType)
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
                                .then(() => 
                              {  handleFinishUploading();
                               })
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

