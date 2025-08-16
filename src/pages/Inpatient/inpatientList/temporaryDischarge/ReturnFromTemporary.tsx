import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { newApPatientTemporaryDischarge, newApEncounter } from '@/types/model-types-constructor';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Form } from 'rsuite';
import { ApPatientTemporaryDischarge } from '@/types/model-types';
import { faPersonWalkingArrowRight } from '@fortawesome/free-solid-svg-icons';
import MyButton from '@/components/MyButton/MyButton';
import AttachmentModal from '@/components/AttachmentUploadModal/AttachmentUploadModal';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetRoomListQuery } from '@/services/setupService';
import { useGetBedListQuery } from '@/services/setupService';

const ReturnFromTemporary = ({ open, setOpen, localEncounter, refetchInpatientList, localPatient }) => {
    const [encounter, setEncounter] = useState<any>({ ...newApEncounter });
    const [patientTemporaryDischarge, setPatientTemporaryDischarge] = useState<ApPatientTemporaryDischarge>({ ...newApPatientTemporaryDischarge });
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [selectedAttachment, setSelectedAttachment] = useState(null);

    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'department_key',
                operator: 'match',
                value: "520693372143529"
            }],
        pageSize: 100,
    });
    const [bedListRequest, setBedListRequest] = useState<ListRequest>({
        ...initialListRequest,
        pageSize: 100,
        filters: [
            {
                fieldName: 'room_key',
                operator: 'match',
                value: patientTemporaryDischarge?.roomKey
            },
            {
                fieldName: 'status_lkey',
                operator: 'match',
                value: "5258243122289092"
            }
        ]
    });

    // Fetch Room list response
    const { data: roomListResponseLoading, refetch, isFetching } = useGetRoomListQuery(listRequest);
    const { data: fetchBedsListQueryResponce } = useGetBedListQuery(bedListRequest, { skip: !patientTemporaryDischarge?.roomKey });

    const { data: typeLovQueryResponse } = useGetLovValuesByCodeQuery('TEMP_DC_TYPES');

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


    // modal content
    const modalContent = (
        <>
            <Form fluid layout="inline" >
                <MyInput
                    column
                    fieldLabel="Billing Approval Status"
                    fieldType="select"
                    fieldName=""
                    selectData={[]}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={""}
                    setRecord={""}
                    width={200}
                    searchable={false}
                    disabled={true}
                />
                <MyInput
                    column
                    fieldLabel="Return Date/Time"
                    fieldType="datetime"
                    fieldName="returnAt"
                    record={patientTemporaryDischarge}
                    setRecord={setPatientTemporaryDischarge}
                    width={200}
                />
                <MyInput
                    require
                    column
                    fieldLabel="Select Room"
                    fieldType="select"
                    fieldName="roomKey"
                    selectData={roomListResponseLoading?.object ?? []}
                    selectDataLabel="name"
                    selectDataValue="key"
                    record={patientTemporaryDischarge}
                    setRecord={setPatientTemporaryDischarge}
                    width={190}
                    searchable={false}
                />
                <MyInput
                    require
                    column
                    fieldLabel="Select Bed"
                    fieldType="select"
                    fieldName="bedKey"
                    selectData={fetchBedsListQueryResponce?.object ?? []}
                    selectDataLabel="name"
                    selectDataValue="key"
                    record={patientTemporaryDischarge}
                    setRecord={setPatientTemporaryDischarge}
                    searchable={false}
                    width={190}
                />
                <MyInput
                    column
                    fieldLabel="Notes"
                    fieldType="textarea"
                    fieldName="notes"
                    record={patientTemporaryDischarge}
                    setRecord={setPatientTemporaryDischarge}
                    width={200}
                />
            </Form>
            </>
    );
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
                actionButtonFunction={null}
                content={modalContent}
                actionButtonLabel='Discharge'
            />
            <AttachmentModal isOpen={attachmentsModalOpen} setIsOpen={setAttachmentsModalOpen} actionType={actionType} setActionType={setActionType} refecthData={refetchInpatientList} attachmentSource={localPatient} selectedPatientAttacment={selectedAttachment} setSelectedPatientAttacment={setSelectedAttachment} attatchmentType="PATIENT_PROFILE_ATTACHMENT" patientKey={localPatient?.key} />

        </>);
}
export default ReturnFromTemporary;