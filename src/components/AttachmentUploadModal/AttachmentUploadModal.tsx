import MyModal from '@/components/MyModal/MyModal';
import { useAppSelector } from '@/hooks';
import {
  useUpdateAttachmentDetailsMutation,
  useUploadMutation,
  useFetchAttachmentByKeyQuery
} from '@/services/attachmentService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import DetailIcon from '@rsuite/icons/Detail';
import { Form, Input } from 'rsuite';
import Attachment from '@/images/Attachment.png';
import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyInput from '@/components/MyInput';
import './styles.less';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
// import { on } from "rsuite/esm/DOMHelper";

interface AttachmentModalProps {
  attachmentSource: { key: string };
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  attatchmentType: string;
  actionType?: 'view' | 'download' | 'add' | null;
  setActionType?: (actionType: 'view' | 'download' | 'add' | null) => void | null;
  selectedPatientAttacment?: any | null;
  setSelectedPatientAttacment?: (attachment: any) => void | null;
  setRequestedPatientAttacment?: React.Dispatch<React.SetStateAction<string | undefined>> | null;
  requestedPatientAttacment?: string | null;
  refecthData?: () => void | null;
  patientKey: string;
  // onSuccess?: () => void;
}

const AttachmentModal = ({
  attachmentSource,
  isOpen,
  setIsOpen,
  actionType,
  setActionType,
  selectedPatientAttacment,
  setSelectedPatientAttacment,
  setRequestedPatientAttacment,
  requestedPatientAttacment,
  refecthData,
  attatchmentType,
  patientKey
}: // onSuccess,
AttachmentModalProps) => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);
  const [newAttachmentSrc, setNewAttachmentSrc] = useState<string | null>(null);
  const { data: attachmentsLovQueryResponse } = useGetLovValuesByCodeQuery('ATTACH_TYPE');
  const [selectedAttachType, setSelectedAttachType] = useState<{ accessTypeLkey: string }>({
    accessTypeLkey: ''
  });
  // const [newAttachmentDetails, setNewAttachmentDetails] = useState('');
  const [newAttachmentDetails, setNewAttachmentDetails] = useState({ attachmentDetails: '' });
  const [newAttachmentType, setNewAttachmentType] = useState<string | null>(null);
  const [Update] = useUpdateAttachmentDetailsMutation();
  const [upload] = useUploadMutation();
  const [uploadedAttachmentOpject, setUploadedAttachmentOpject] = useState({
    formData: null as FormData | null,
    type: null as string | null,
    refKey: null as string | null
  });
  // Handle Fetch Attachment By Key Responce
  const { data: fetchAttachmentByKeyResponce, isSuccess } = useFetchAttachmentByKeyQuery(
    { key: requestedPatientAttacment },
    { skip: !requestedPatientAttacment || !attachmentSource.key }
  );

  // Handle Attachment File Upload Click
  const handleAttachmentFileUploadClick = (type: string) => {
    setNewAttachmentType(type);
    if (attachmentSource && isOpen) attachmentFileInputRef.current?.click();
  };
  // Handle File Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!attachmentSource) return;
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      if (isOpen) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewAttachmentSrc(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);

        setUploadedAttachmentOpject({
          formData,
          type: newAttachmentType,
          refKey: attachmentSource?.key
        });
      }
    }
  };
  // Handle Update Attachment Details
  const handleUpdateAttachmentDetails = () => {
    Update({
      key: selectedPatientAttacment.key,
      attachmentDetails: newAttachmentDetails,
      updatedBy: authSlice.user.key,
      accessType: selectedAttachType.accessTypeLkey,
      file: uploadedAttachmentOpject?.formData ?? undefined
    })
      .unwrap()
      .then(() => {
        handleFinishUploading();
        dispatch(notify({ msg: 'Attachment Updated Successfully', sev: 'success' }));
      })
      .catch(error => {
        dispatch(notify({ msg: 'Failed to Update attachment', sev: 'error' }));
        console.error(error);
      });
  };

  // Handle Finish Uploading
  const handleFinishUploading = () => {
    setUploadedAttachmentOpject({ formData: null, type: null, refKey: null });
    setNewAttachmentSrc(null);
    setNewAttachmentType(null);
    setNewAttachmentDetails('');
    setIsOpen(false);
    setSelectedPatientAttacment(null);
    setActionType(null);
    refecthData();
    setRequestedPatientAttacment(null);
    setSelectedAttachType(null);
  };
  // Handle Upload Attachment
  const handleUploadAction = () => {
    if (actionType === 'view') {
      handleUpdateAttachmentDetails();
    } else {
      if (!uploadedAttachmentOpject?.formData) {
        return;
      }

      try {
        upload({
          ...uploadedAttachmentOpject,
          details: newAttachmentDetails,
          accessType: selectedAttachType.accessTypeLkey,
          createdBy: authSlice.user.key,
          patientKey: patientKey
        }).unwrap();
        //    await refecthData();
        //    await onSuccess();
        handleFinishUploading();
        dispatch(notify({ msg: 'Attachment Uploaded Successfully', sev: 'success' }));
        setIsOpen(false);
      } catch (error) {
        dispatch(notify({ msg: 'Failed to Upload Attachment', sev: 'error' }));
      }
    }
  };
  // Attachment Modal Content
  const content = () => (
    <>
      <div className="upload-file-container">
        <input
          type="file"
          ref={attachmentFileInputRef}
          className="upload-file-content"
          onChange={handleFileUpload}
          accept="image/*"
        />
        {newAttachmentSrc ? (
          <img
            alt={'Attachment Preview'}
            width={150}
            height={150}
            onClick={() => handleAttachmentFileUploadClick(attatchmentType)}
            src={newAttachmentSrc}
          />
        ) : selectedPatientAttacment && selectedPatientAttacment.fileContent ? (
          selectedPatientAttacment.contentType === 'application/pdf' ? (
            <DetailIcon onClick={() => handleAttachmentFileUploadClick(attatchmentType)} />
          ) : (
            <img
              alt={'Attachment Preview'}
              width={150}
              height={150}
              onClick={() => handleAttachmentFileUploadClick(attatchmentType)}
              src={`data:${selectedPatientAttacment.contentType};base64,${selectedPatientAttacment.fileContent}`}
            />
          )
        ) : (
          <img
            alt={'Attachment Preview'}
            width={150}
            height={150}
            onClick={() => handleAttachmentFileUploadClick(attatchmentType)}
            src={Attachment}
          />
        )}
      </div>
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
        <MyInput
          width={550}
          record={newAttachmentDetails}
          setRecord={setNewAttachmentDetails}
          fieldType="textarea"
          fieldName="attachmentDetails"
          placeholder="Details"
          showLabel={false}
        />
      </Form>
    </>
  );
  // Effects
  useEffect(() => {
    if (isSuccess && fetchAttachmentByKeyResponce) {
      if (actionType === 'view') {
        setIsOpen(true);
        setSelectedPatientAttacment(fetchAttachmentByKeyResponce);
        setNewAttachmentDetails(fetchAttachmentByKeyResponce.extraDetails);
        setSelectedAttachType({ accessTypeLkey: fetchAttachmentByKeyResponce.accessTypeLkey });
      }
    }
  }, [requestedPatientAttacment, fetchAttachmentByKeyResponce, actionType]);
  return (
    <MyModal
      open={isOpen}
      setOpen={setIsOpen}
      title="New/Edit Patient Attachments"
      size="sm"
      bodyheight="65vh"
      content={content}
      hideBack={true}
      steps={[{ title: 'Attachments', icon: <FontAwesomeIcon icon={faPaperclip} /> }]}
      actionButtonLabel="Save"
      actionButtonFunction={() => handleUploadAction()}
      isDisabledActionBtn={actionType ? false : !uploadedAttachmentOpject?.formData}
    />
  );
};

export default AttachmentModal;
