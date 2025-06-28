import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import { newApBedTransactions, newApEncounter } from '@/types/model-types-constructor';
import { useSaveBedTransactionMutation } from '@/services/encounterService';
import { useGetRoomListQuery } from '@/services/setupService';
import { Form } from 'rsuite';
import { ApBedTransactions } from '@/types/model-types';
import { useGetBedListQuery } from '@/services/setupService';

const ChangeBedModal = ({ open, setOpen, localEncounter, refetchInpatientList }) => {
    const [encounter, setEncounter] = useState<any>({ ...newApEncounter });
    const [newLocation, setNewLocation] = useState<ApBedTransactions>({ ...newApBedTransactions });
    // State for managing the request to fetch department-related data (e.g., rooms)
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'department_key',
                operator: 'match',
                value: encounter?.resourceObject?.key
            }],
        pageSize: 100,
    });
    // State for managing the request to fetch available beds in a specific room
    const [bedListRequest, setBedListRequest] = useState<ListRequest>({
        ...initialListRequest,
        pageSize: 100,
        filters: [
            {
                fieldName: 'room_key',
                operator: 'match',
                value: newLocation?.toRoomKey
            },
            {
                fieldName: 'status_lkey',
                operator: 'match',
                value: "5258243122289092"
            }
        ]
    });
    const dispatch = useAppDispatch();
    const [saveBedTransaction, saveBedTransactionMutation] = useSaveBedTransactionMutation();
    // Fetch Bed list response
    const { data: fetchBedsListQueryResponce } = useGetBedListQuery(bedListRequest, { skip: !newLocation?.toRoomKey });
    // Fetch Room list response
    const { data: roomListResponseLoading } = useGetRoomListQuery(listRequest);
    // handle Save To Change Bed Function
    const handleSave = async () => {
        try {
            const saveAdmit = await saveBedTransaction({
                ...newLocation,
                encounterKey: encounter.key,
                patientKey: encounter?.patientKey,
                fromRoomKey: encounter?.apRoom?.key,
                fromBedKey: encounter?.apBed?.key,
                departmentKey:encounter?.resourceObject?.key
            }).unwrap();
            dispatch(notify({ msg: 'Change Bed Successfully', sev: 'success' }));
            setOpen(false);
            setNewLocation({ ...newApBedTransactions });
            refetchInpatientList();
        } catch (error) {
        }
    };
    // use Effect
    useEffect(() => {
        setEncounter({ ...localEncounter });
    }, [localEncounter]);
    useEffect(() => {
        setListRequest((prev) => {
            let updatedFilters = [...(prev.filters || [])];
            updatedFilters = updatedFilters.filter(f => f.fieldName !== 'department_key');
            if (encounter?.resourceObject?.key) {
                updatedFilters.push({
                    fieldName: 'department_key',
                    operator: 'match',
                    value: encounter?.resourceObject?.key
                });
            }

            return {
                ...prev,
                filters: updatedFilters,
            };
        });
    }, [encounter?.resourceObject?.key]);
    useEffect(() => {
        setBedListRequest((prev) => {
            let updatedFilters = [...(prev.filters || [])];
            updatedFilters = updatedFilters.filter(f => f.fieldName !== 'room_key');
            if (newLocation?.toRoomKey) {
                updatedFilters.push({
                    fieldName: 'room_key',
                    operator: 'match',
                    value: newLocation?.toRoomKey
                });
            }

            return {
                ...prev,
                filters: updatedFilters,
            };
        });
    }, [newLocation?.toRoomKey]);

    // modal content
    const modalContent = (
        <Form fluid layout="inline" className='fields-container'>
            <MyInput
                require
                column
                fieldLabel="Select Room"
                fieldType="select"
                fieldName="toRoomKey"
                selectData={roomListResponseLoading?.object ?? []}
                selectDataLabel="name"
                selectDataValue="key"
                record={newLocation}
                setRecord={setNewLocation}
                width={300}
                searchable={false}
            />
            <MyInput
                require
                column
                fieldLabel="Select Bed"
                fieldType="select"
                fieldName="toBedKey"
                selectData={fetchBedsListQueryResponce?.object ?? []}
                selectDataLabel="name"
                selectDataValue="key"
                record={newLocation}
                setRecord={setNewLocation}
                searchable={false}
                width={300}
            />
        </Form>
    );
    return (<MyModal
        open={open}
        setOpen={setOpen}
        title="Change Bed"
        steps={[{ title: "Change Bed", icon: <FontAwesomeIcon icon={faBed} /> }]}
        size="25vw"
        bodyheight='350px'
        actionButtonFunction={handleSave}
        content={modalContent}
        actionButtonLabel='Move'
    />);
}
export default ChangeBedModal;