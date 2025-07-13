import React, { useEffect, useState } from 'react';
import {
    useGetFacilitiesQuery,
    useGetDepartmentsQuery,
    useGetLovValuesByCodeQuery,
    useSaveRoomMutation
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDoorOpen } from '@fortawesome/free-solid-svg-icons';
import { initialListRequest, ListRequest } from '@/types/types';
import MyButton from '@/components/MyButton/MyButton';
import { newApRoom } from '@/types/model-types-constructor';
import MyModal from '@/components/MyModal/MyModal';
const AddEditRoom = ({
    open,
    setOpen,
    room,
    setRoom,
    refetch
}) => {
    const dispatch = useAppDispatch();
    const [departmentKey, setDepartmentKey] = useState({ key: '' });
    // Fetch age UnitLov list response
    const { data: roomTypesLovQueryResponse } = useGetLovValuesByCodeQuery('ROOM_TYPES');
    const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const [saveRoom] = useSaveRoomMutation();
    const [isGenderSpecific, setGenderSpecific] = useState({ genderSpecific: false });
    const { data: departmentListResponse } = useGetDepartmentsQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'department_type_lkey',
                operator: 'match',
                value: departmentKey?.key
            },
            {
                fieldName: 'facility_key',
                operator: 'match',
                value: room?.facilityKey
            }
        ]
    }, {
        skip: !(departmentKey?.key && room?.facilityKey)
    });

    const {
        data: facilityListResponse,
        isLoading: isGettingFacilities,
        isFetching: isFetchingFacilities
    } = useGetFacilitiesQuery({ ...initialListRequest });
    const { data: resourceTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DEPARTMENT-TYP');

    const selectedList = resourceTypeLovQueryResponse?.object?.filter(item =>
        ['INPATIENT_WARD', 'EMERGENCY_ROOM', 'DAY_CASE', 'OPERATION_THEATER'].includes(item.valueCode)
    );
    // Modal Content 
    const content = (
        <Form fluid layout='inline' >
            <MyInput
                column
                width={250}
                fieldType='select'
                fieldLabel="Facility"
                selectData={facilityListResponse?.object ?? []}
                selectDataLabel="facilityName"
                selectDataValue="key"
                fieldName="facilityKey"
                record={room}
                setRecord={setRoom}
            />
            <MyInput
               column
                fieldName="key"
                fieldLabel="Department Type"
                fieldType="select"
                selectData={selectedList ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={departmentKey}
                setRecord={setDepartmentKey}
                menuMaxHeight={200}
                width={250}
                searchable={false}
            />
            <MyInput
                width={250}
                column
                fieldType="select"
                fieldName="departmentKey"
                selectData={departmentListResponse?.object ?? []}
                selectDataLabel="name"
                selectDataValue="key"
                record={room}
                setRecord={setRoom}
            />
            <MyInput
                width={250}
                fieldLabel="Name"
                column
                fieldName="name"
                record={room}
                setRecord={setRoom}
            />
            <MyInput
                width={250}
                fieldLabel="Floor"
                column
                fieldName="floor"
                record={room}
                setRecord={setRoom}
            />
            <MyInput
                width={250}
                column
                fieldLabel="Location Details"
                fieldType="textarea"
                fieldName="locationDetails"
                record={room}
                setRecord={setRoom}
            />
            <MyInput
                column
                width={250}
                fieldLabel="Type"
                fieldType="select"
                fieldName="typeLkey"
                selectData={roomTypesLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={room}
                setRecord={setRoom}
            />
            <MyInput
                column
                width={250}
                fieldLabel="Gender Specific"
                fieldType="checkbox"
                fieldName="genderSpecific"
                record={isGenderSpecific}
                setRecord={setGenderSpecific}
            />
            <MyInput
                column
                width={250}
                fieldLabel="Gender"
                fieldType="select"
                fieldName="genderLkey"
                selectData={genderLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={room}
                setRecord={setRoom}
                disabled={!isGenderSpecific?.genderSpecific}
            />
        </Form>
    );
    // Handle Clear Fields
    const handleClearField = () => {
        setRoom({
            ...newApRoom,
            typeLkey: null,
            genderLkey: null
        });
    };
    // handle save Room
    const handleSave = () => {
        saveRoom({
            ...room,
            isValid: true
        })
            .unwrap()
            .then(() => {
                if (room.key) {
                    dispatch(notify('Room Updated Successfully'));
                } else {
                    dispatch(notify('Room Added Successfully'));
                }
                refetch();
                setOpen(false);
            }).catch(() => {
                dispatch(notify('Failed to Save Room'));
            });
    };
    //useEffect
    useEffect(() => {
        setGenderSpecific({ genderSpecific: room?.genderLkey ? true : false })
    }, [room]);
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title={room?.key ? 'Edit Room Information' : 'Add New Room'}
            actionButtonFunction={handleSave}
            position='right'
            size='38vw'
            steps={[{
                title: "Room",
                icon: <FontAwesomeIcon icon={faDoorOpen} />,
                footer: <MyButton appearance='ghost' onClick={handleClearField} >Clear</MyButton>
            },]}
            content={content}
        ></MyModal>
    );
};
export default AddEditRoom;
