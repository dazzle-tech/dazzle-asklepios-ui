import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import { newApBedTransactions } from '@/types/model-types-constructor';
import { PatientEncounter } from '@/types/model-types-new';
import { newPatientEncounter } from '@/types/model-types-constructor-new';
import { useSaveBedTransactionMutation } from '@/services/encounterService';
import { useGetRoomListQuery } from '@/services/setupService';
import { Form } from 'rsuite';
import { ApBedTransactions } from '@/types/model-types';
import { useGetBedListQuery } from '@/services/setupService';
import { useSelector } from 'react-redux';
import { create } from 'lodash';

const ChangeBedModal = ({ open, setOpen, localEncounter, refetchInpatientList }) => {
    console.log('local encounter in change bed modal', localEncounter);
    const [encounter, setEncounter] = useState<PatientEncounter>({ ...newPatientEncounter });
    const [newLocation, setNewLocation] = useState<ApBedTransactions>({ ...newApBedTransactions });
  const authSlice = useSelector((state: any) => state.auth);
  
console.log('authSlice in change bed modal', authSlice);
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'department_key',
                operator: 'match',
                value: encounter?.departmentId ?? ''
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

    const { data: fetchBedsListQueryResponce } = useGetBedListQuery(bedListRequest, { skip: !newLocation?.toRoomKey });

    const { data: roomListResponseLoading } = useGetRoomListQuery(listRequest, {
        skip: !encounter?.departmentId
    });
    const handleSave = async () => {
        try {
            console.log("PAyload for bed transaction", {
                ...newLocation,
                encounterKey: encounter.id,
                patientKey: encounter?.patient?.id,
                fromRoomKey: encounter?.apRoom?.key,
                fromBedKey: encounter?.apBed?.key,
                departmentKey: encounter?.departmentId,
                createdBy: authSlice?.user?.login
            });
            await saveBedTransaction({
                ...newLocation,
                encounterKey: encounter.id,
                patientKey: encounter?.patient?.id,
                fromRoomKey: encounter?.apRoom?.key,
                fromBedKey: encounter?.apBed?.key,
                departmentKey: encounter?.departmentId,
                createdBy: authSlice?.user?.login
            }).unwrap();

            dispatch(notify({ msg: 'Change Bed Successfully', sev: 'success' }));

            await refetchInpatientList?.();

            setNewLocation({ ...newApBedTransactions });
            setOpen(false);
        } catch (error) {
        }
    };

    useEffect(() => {
        setEncounter({ ...localEncounter });
    }, [localEncounter]);

    useEffect(() => {
        setListRequest((prev) => {
            let updatedFilters = [...(prev.filters || [])];
            updatedFilters = updatedFilters.filter(f => f.fieldName !== 'department_key');
            if (encounter?.departmentId) {
                updatedFilters.push({
                    fieldName: 'department_key',
                    operator: 'match',
                    value: encounter?.departmentId
                });
            }

            return {
                ...prev,
                filters: updatedFilters,
            };
        });
    }, [encounter?.departmentId]);

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

    const modalContent = (
        <Form fluid layout="inline" className='fields-container'>
            <MyInput
                required
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
                required
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

              // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Change Bed"
            steps={[{ title: "Change Bed", icon: <FontAwesomeIcon icon={faBed} /> }]}
            size="25vw"
            bodyheight='350px'
            actionButtonFunction={handleSave}
            content={<div dir={dir}>{modalContent}</div>}
            actionButtonLabel='Move'
        />
    );
}

export default ChangeBedModal;