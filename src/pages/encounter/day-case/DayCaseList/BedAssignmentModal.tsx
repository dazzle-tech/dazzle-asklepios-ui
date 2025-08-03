import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import { newApEncounterAssignToBed } from '@/types/model-types-constructor';
import { useSaveAssignToBedMutation } from '@/services/encounterService';
import { useGetRoomListQuery } from '@/services/setupService';
import { Form } from 'rsuite';
import { ApEncounterAssignToBed } from '@/types/model-types';
import { useGetBedListQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';

const BedAssignmentModal = ({ open, setOpen, encounter, refetchEncounter, departmentKey }) => {
    const [object, setObject] = useState<ApEncounterAssignToBed>({ ...newApEncounterAssignToBed });
    const [saveDayCase] = useSaveAssignToBedMutation();
    // State to hold the request object for fetching department list
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
    
    // State to hold the request object for fetching bed list
    const [bedListRequest, setBedListRequest] = useState<ListRequest>({
        ...initialListRequest,
        pageSize: 100,
        filters: [
            {
                fieldName: 'room_key',
                operator: 'match',
                value: object?.roomKey
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
    } = useGetRoomListQuery(listRequest);
    const dispatch = useAppDispatch();
    // Fetch bed list using the bedListRequest object
    // Skip the query if roomKey is not available to avoid unnecessary request
    const { data: fetchBedsListQueryResponce } = useGetBedListQuery(bedListRequest, { skip: !object?.roomKey });


    // handle save Assign to Bed function
    const handleSave = async () => {
        try {
            const save = await saveDayCase({
                ...object,
                encounterKey: encounter?.key,
                patientKey: encounter?.patientKey,
                departmentKey: departmentKey
            }).unwrap();
            refetchEncounter();
            dispatch(notify({ msg: 'Admit Successfully', sev: 'success' }));
            setOpen(false);
            setObject({ ...newApEncounterAssignToBed });
        } catch (error) {
        }
    };
    // Effects
    useEffect(() => {
        setListRequest((prev) => {
            let updatedFilters = [...(prev.filters || [])];
            updatedFilters = updatedFilters.filter(f => f.fieldName !== 'department_key');
            if (encounter) {
                updatedFilters.push({
                    fieldName: 'department_key',
                    operator: 'match',
                    value: departmentKey
                });
            }

            return {
                ...prev,
                filters: updatedFilters,
            };
        });
    }, [encounter]);
    useEffect(() => {
        setBedListRequest((prev) => {
            let updatedFilters = [...(prev.filters || [])];
            updatedFilters = updatedFilters.filter(f => f.fieldName !== 'room_key');
            if (object) {
                updatedFilters.push({
                    fieldName: 'room_key',
                    operator: 'match',
                    value: object?.roomKey
                });
            }
            return {
                ...prev,
                filters: updatedFilters,
            };
        });
    }, [object]);

    // modal content
    const modalContent = (
        <Form fluid layout="inline" className='fields-container'>
            <MyInput
                require
                column
                fieldLabel="Select Room"
                fieldType="select"
                fieldName="roomKey"
                selectData={roomListResponseLoading?.object ?? []}
                selectDataLabel="name"
                selectDataValue="key"
                record={object}
                setRecord={setObject}
                width={250}
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
                record={object}
                setRecord={setObject}
                searchable={false}
                width={250}
            />
            <MyInput
                column
                fieldType='textarea'
                fieldLabel="Admission Reason"
                fieldName='admissionReason'
                record={object}
                setRecord={setObject}
                width={500}
            />
        </Form>);
    return (<MyModal
        open={open}
        setOpen={setOpen}
        title="Assign to Bed"
        steps={[{ title: "Assign to Bed", icon: <FontAwesomeIcon icon={faBed} /> }]}
        size="38vw"
        bodyheight='60vh'
        actionButtonFunction={handleSave}
        content={modalContent}
    />);
}
export default BedAssignmentModal;