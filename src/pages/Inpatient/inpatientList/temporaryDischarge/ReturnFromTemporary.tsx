import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { newApPatientTemporaryDischarge } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import { ApPatientTemporaryDischarge } from '@/types/model-types';
import { faPersonWalkingArrowLoopLeft } from '@fortawesome/free-solid-svg-icons';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetRoomListQuery } from '@/services/setupService';
import { useGetBedListQuery } from '@/services/setupService';
import { useReturnTemporaryDischargeMutation } from '@/services/encounterService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
const ReturnFromTemporary = ({ open, setOpen, localEncounter, refetchInpatientList, localPatient, departmentKey }) => {
    const [patientTemporaryDischarge, setPatientTemporaryDischarge] = useState<ApPatientTemporaryDischarge>({ ...newApPatientTemporaryDischarge });
    const [patientReturnTemporaryDischarge] = useReturnTemporaryDischargeMutation();
    const dispatch = useAppDispatch();
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'department_key',
                operator: 'match',
                value: departmentKey
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

    // handle save patient return from temporary discharge
    const handleSave = async () => {
        try {
            await patientReturnTemporaryDischarge({
                patientTemporaryDischarge: {
                    ...patientTemporaryDischarge,
                    patientKey: localPatient.key,
                    encounterKey: localEncounter.key,
                    returnAt: patientTemporaryDischarge?.returnAt
                        ? new Date(patientTemporaryDischarge.returnAt).getTime()
                        : null
                },
                department_key: departmentKey
            }).unwrap();
            dispatch(
                notify({
                    msg: 'Patient successfully returned from temporary discharge',
                    sev: 'success'
                })
            );
            setPatientTemporaryDischarge({ ...newApPatientTemporaryDischarge });
            setOpen(false);
            await refetchInpatientList();
        } catch (error) {
            console.error("Error saving patient temporary discharge:", error);
            dispatch(
                notify({
                    msg: 'Failed to save patient temporary discharge',
                    sev: 'error'
                })
            );
        }
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
                    width={200}
                    searchable={false}
                    disabled={localEncounter?.apRoom}
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
                    width={200}
                    disabled={localEncounter?.apBed}
                />
                <MyInput
                    column
                    fieldLabel="Notes"
                    fieldType="textarea"
                    fieldName="notes"
                    record={patientTemporaryDischarge}
                    setRecord={setPatientTemporaryDischarge}
                    width={400}
                />
            </Form>
        </>
    );

    // Effects 
    useEffect(() => {
        if (patientTemporaryDischarge.roomKey) {
            setBedListRequest(prev => ({
                ...prev,
                filters: [
                    { fieldName: 'room_key', operator: 'match', value: patientTemporaryDischarge.roomKey },
                    { fieldName: 'status_lkey', operator: 'match', value: "5258243122289092" }
                ]
            }));
        }
    }, [patientTemporaryDischarge.roomKey]);
    useEffect(() => {
        if (!open) {
            setPatientTemporaryDischarge({ ...newApPatientTemporaryDischarge });
        }
    }, [open]);
    useEffect(() => {
    if (departmentKey) {
        setListRequest(prev => ({
            ...prev,
            filters: [
                {
                    fieldName: 'department_key',
                    operator: 'match',
                    value: departmentKey
                }
            ]
        }));
    }
}, [departmentKey]);
    console.log("dep---->", departmentKey)
    return (
        <>
            <MyModal
                open={open}
                setOpen={setOpen}
                title="Return from Temporary Discharge"
                steps={[{
                    title: "Return from Temporary Discharge", icon: <FontAwesomeIcon icon={faPersonWalkingArrowLoopLeft} />
                }]}
                size="33vw"
                position='right'
                actionButtonFunction={handleSave}
                content={modalContent}
                actionButtonLabel='Save'
            />
        </>);
}
export default ReturnFromTemporary;