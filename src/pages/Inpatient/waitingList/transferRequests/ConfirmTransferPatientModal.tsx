import React, { useState, useEffect } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import { newApTransferPatient } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import { ApTransferPatient } from '@/types/model-types';
import { useGetResourceTypeQuery } from '@/services/appointmentService';
import MyLabel from '@/components/MyLabel';
import { useSaveApprovalTransferMutation } from '@/services/encounterService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import MyModal from '@/components/MyModal/MyModal';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useGetRoomListQuery } from '@/services/setupService';
import { useGetBedListQuery } from '@/services/setupService';
const ConfirmTransferPatientModal = ({ open, setOpen, localTransfer, refetchInpatientList }) => {
    const [transferPatient, setTransferPatient] = useState<ApTransferPatient>({ ...newApTransferPatient });
    const inpatientDepartmentListResponse = useGetResourceTypeQuery("4217389643435490");
    const [saveApprovalTransferPatient] = useSaveApprovalTransferMutation();
    const authSlice = useAppSelector(state => state.auth);
    const dispatch = useAppDispatch();
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'department_key',
                operator: 'match',
                value: transferPatient?.toInpatientDepartmentKey
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
                value: transferPatient?.toRoom
            },
            {
                fieldName: 'status_lkey',
                operator: 'match',
                value: "5258243122289092"
            }
        ]
    });
    // Fetch Room list response
    const {
        data: roomListResponseLoading,
        refetch,
        isFetching
    } = useGetRoomListQuery(listRequest, {
        skip: !transferPatient?.toInpatientDepartmentKey
    });
    const { data: fetchBedsListQueryResponce } = useGetBedListQuery(bedListRequest, { skip: !transferPatient?.toRoom });

    // modal content
    const modalContent = (
        <>
            <br />
            <MyLabel label={<h6>Notes field & checklist</h6>} />
            <Form fluid layout="inline" className='fields-container'>
                <MyInput
                    width={200}
                    column
                    fieldType="checkbox"
                    fieldLabel="Final Vitals Before Transfer"
                    fieldName="finalVitalsBeforeTransfer"
                    record={transferPatient}
                    setRecord={setTransferPatient}
                    disabled />
                <MyInput
                    width={200}
                    column
                    fieldType="checkbox"
                    fieldLabel="IV Lines / Drips Checked"
                    fieldName="ivLinesDripsChecked"
                    record={transferPatient}
                    setRecord={setTransferPatient}
                    disabled />
                <MyInput
                    width={200}
                    column
                    fieldType="checkbox"
                    fieldLabel="Medication Administered Pre-Transfer"
                    fieldName="medicationAdministeredPreTransfer"
                    record={transferPatient}
                    setRecord={setTransferPatient}
                    disabled />
                <MyInput
                    width={200}
                    column
                    fieldType="checkbox"
                    fieldLabel="Belongings Sent with Patient"
                    fieldName="belongingsSentWithPatient"
                    record={transferPatient}
                    setRecord={setTransferPatient}
                    disabled />
                <MyInput
                    width={200}
                    column
                    fieldType="checkbox"
                    fieldLabel="Clinical Handover Done"
                    fieldName="clinicalHandoverDone"
                    record={transferPatient}
                    setRecord={setTransferPatient}
                    disabled />
                <MyInput
                    width={200}
                    column
                    fieldLabel="Transfer Notes"
                    fieldName="transferNotes"
                    record={transferPatient}
                    setRecord={setTransferPatient}
                    fieldType='textarea'
                    disabled />
            </Form>
            <MyLabel label={<h6>To proceed with the transfer request, please fill in the following fields : </h6>} />
            <Form fluid layout="inline" className='fields-container'>
                <MyInput
                    width={200}
                    column
                    fieldType='select'
                    fieldLabel="Confirm Ward"
                    fieldName="toInpatientDepartmentKey"
                    selectData={inpatientDepartmentListResponse?.data?.object ?? []}
                    selectDataLabel="name"
                    selectDataValue="key"
                    record={transferPatient}
                    setRecord={setTransferPatient}
                    required
                />
                <MyInput
                    required
                    column
                    fieldLabel="Select Room"
                    fieldType="select"
                    fieldName="toRoom"
                    selectData={roomListResponseLoading?.object ?? []}
                    selectDataLabel="name"
                    selectDataValue="key"
                    record={transferPatient}
                    setRecord={setTransferPatient}
                    width={200}
                    searchable={false}
                />
                <MyInput
                    required
                    column
                    fieldLabel="Select Bed"
                    fieldType="select"
                    fieldName="toBed"
                    selectData={fetchBedsListQueryResponce?.object ?? []}
                    selectDataLabel="name"
                    selectDataValue="key"
                    record={transferPatient}
                    setRecord={setTransferPatient}
                    searchable={false}
                    width={200}
                />
            </Form>
        </>
    );

    // Function to handle saving the transfer patient data
    const handleSave = async () => {
        // TODO convert key to code
        try {
            await saveApprovalTransferPatient({
                ...transferPatient,
                statusLkey: "6572194150955704",
                confirmedAt: (new Date()).getTime(),
                confirmedBy: authSlice.user.key
            }).unwrap();

            dispatch(notify({ msg: 'Transfer Patient Successfully', sev: 'success' }));
            //TODO convert key to code
            setTransferPatient({ ...newApTransferPatient, statusLkey: "6572194150955704" });
            setOpen(false);
            // Clear the transfer patient state
            await refetchInpatientList();
            handleClearField();
        } catch (error) {
            dispatch(notify({ msg: error?.data.message, sev: 'error' }));
        }
    };
    // Function to clear the fields
    const handleClearField = () => {
        setTransferPatient({ ...newApTransferPatient });
    }
    // Effects
    useEffect(() => {
        if (localTransfer?.key) {
            setTransferPatient({ ...localTransfer });
        }
    }, [localTransfer]);
    useEffect(() => {
        setBedListRequest((prev) => {
            let updatedFilters = [...(prev.filters || [])];
            updatedFilters = updatedFilters.filter(f => f.fieldName !== 'room_key');
            if (transferPatient?.toRoom) {
                updatedFilters.push({
                    fieldName: 'room_key',
                    operator: 'match',
                    value: transferPatient?.toRoom
                });
            }

            return {
                ...prev,
                filters: updatedFilters,
            };
        });
    }, [transferPatient]);
    useEffect(() => {
        setListRequest((prev) => {
            let updatedFilters = [...(prev.filters || [])];
            updatedFilters = updatedFilters.filter(f => f.fieldName !== 'department_key');
            if (transferPatient?.toInpatientDepartmentKey) {
                updatedFilters.push({
                    fieldName: 'department_key',
                    operator: 'match',
                    value: transferPatient?.toInpatientDepartmentKey
                });
            }
            return {
                ...prev,
                filters: updatedFilters,
            };
        });
    }, [transferPatient]);
    useEffect(() => {
        if (!open) {
            handleClearField();
        }
    }, [open]);
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Transfer Approval"
            size="60vw"
            bodyheight="70vh"
            content={modalContent}
            hideCancel={false}
            hideBack={true}
            steps={[{ title: "Transfer Approval", icon: <FontAwesomeIcon icon={faCheckCircle} /> }]}
            actionButtonLabel="Confirm Transfer"
            actionButtonFunction={handleSave}
        />
    );
}
export default ConfirmTransferPatientModal;