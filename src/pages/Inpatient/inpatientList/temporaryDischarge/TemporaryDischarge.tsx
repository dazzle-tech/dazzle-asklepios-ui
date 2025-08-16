import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { newApPatientTemporaryDischarge } from '@/types/model-types-constructor';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Form } from 'rsuite';
import { ApPatientTemporaryDischarge } from '@/types/model-types';
import { faPersonWalkingArrowRight } from '@fortawesome/free-solid-svg-icons';
import MyButton from '@/components/MyButton/MyButton';
import AttachmentModal from '@/components/AttachmentUploadModal/AttachmentUploadModal';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { usePatientTemporaryDischargeMutation } from '@/services/encounterService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

const TemporaryDischarge = ({ open, setOpen, localEncounter, refetchInpatientList, localPatient }) => {
    const [patientTemporaryDischarge, setPatientTemporaryDischarge] = useState<ApPatientTemporaryDischarge>({ ...newApPatientTemporaryDischarge });
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [selectedAttachment, setSelectedAttachment] = useState(null);
    const [dischargeTemporary]=usePatientTemporaryDischargeMutation();
    const { data: typeLovQueryResponse } = useGetLovValuesByCodeQuery('TEMP_DC_TYPES');
    const dispatch = useAppDispatch();
    // Handle Add New Attachment Open Modal
    const handleAddNewAttachment = () => {
        handleClearAttachment();
        setSelectedAttachment(null);
        setAttachmentsModalOpen(true);
    }
    // Handle Clear Attachment Modal
    const handleClearAttachment = () => {
        setActionType(null);
    };

    // Function to handle saving the patient temporary discharge data
    const handleSave = async () => {
        try {

            await dischargeTemporary({
                        ...patientTemporaryDischarge,
                        patientKey: localPatient.key,
                        encounterKey: localEncounter.key,
                        expectedReturnAt : patientTemporaryDischarge?.expectedReturnAt ? new Date(patientTemporaryDischarge?.expectedReturnAt).getTime() : null
                    }).unwrap();

                    dispatch(notify({ msg: 'Billing Approval Sent', sev: 'success' }));
                    setPatientTemporaryDischarge({ ...newApPatientTemporaryDischarge});
                    setOpen(false);
              
                await refetchInpatientList();
            } catch (error) {
                console.error("Error saving patient temporary discharge:", error);
                dispatch(notify({ msg: 'Failed to Save Patient Temporary Discharge', sev: 'error' }));
            }
        };
    // modal content
    const modalContent = (
        <>
            <Form fluid layout="inline" >
                <MyInput
                    column
                    fieldLabel="Type"
                    fieldType="select"
                    fieldName="typeLkey"
                    selectData={typeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={patientTemporaryDischarge}
                    setRecord={setPatientTemporaryDischarge}
                    width={200}
                    searchable={false}
                />
                <MyInput
                    column
                    fieldLabel="Expected Return Date/Time"
                    fieldType="datetime"
                    fieldName="expectedReturnAt"
                    record={patientTemporaryDischarge}
                    setRecord={setPatientTemporaryDischarge}
                    width={200}
                />
                <MyInput
                    column
                    fieldLabel="Consent Taken"
                    fieldType="checkbox"
                    fieldName="consentTaken"
                    record={patientTemporaryDischarge}
                    setRecord={setPatientTemporaryDischarge}
                    width={200}
                />
                <MyInput
                    column
                    fieldLabel="Bed Retained"
                    fieldType="checkbox"
                    fieldName="bedRetained"
                    record={patientTemporaryDischarge}
                    setRecord={setPatientTemporaryDischarge}
                    width={200}
                />
                <MyInput
                    column
                    fieldLabel="Reason for Temporary Discharge"
                    fieldType="textarea"
                    fieldName="reasonForTemporaryDischarge"
                    record={patientTemporaryDischarge}
                    setRecord={setPatientTemporaryDischarge}
                    width={200}
                />
                <MyInput
                    column
                    fieldLabel="Comments"
                    fieldType="textarea"
                    fieldName="comments"
                    record={patientTemporaryDischarge}
                    setRecord={setPatientTemporaryDischarge}
                    width={200}
                />
            </Form>
            <Form fluid layout="inline">
                <span className="custom-text">
                    Add Attachment
                </span>
                <MyButton
                    onClick={handleAddNewAttachment}
                    disabled={!localPatient?.key}
                    appearance='ghost'
                    prefixIcon={() => <FontAwesomeIcon icon={faPaperclip} />}>
                    New Attachment
                </MyButton></Form></>
    );

 // Effects 
     useEffect(() => {
         if (!open) {
             handleClearAttachment();
             setPatientTemporaryDischarge({ ...newApPatientTemporaryDischarge });
         }
     }, [open]);
    return (
        <>
            <MyModal
                open={open}
                setOpen={setOpen}
                title="Temporary Discharge"
                steps={[{
                    title: "Temporary Discharge", icon: <FontAwesomeIcon icon={faPersonWalkingArrowRight} />
                }]}
                size="33vw"
                position='right'
                actionButtonFunction={handleSave}
                content={modalContent}
                actionButtonLabel='Discharge'
            />
            <AttachmentModal isOpen={attachmentsModalOpen} setIsOpen={setAttachmentsModalOpen} actionType={actionType} setActionType={setActionType} refecthData={refetchInpatientList} attachmentSource={localPatient} selectedPatientAttacment={selectedAttachment} setSelectedPatientAttacment={setSelectedAttachment} attatchmentType="PATIENT_PROFILE_ATTACHMENT" patientKey={localPatient?.key} />

        </>);
}
export default TemporaryDischarge;