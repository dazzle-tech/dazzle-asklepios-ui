import { useAppSelector } from '@/hooks';
import authSlice, { setUser } from '@/reducers/authSlice';
import { useGetAccessRolesQuery, useGetFacilitiesQuery, useGetLovValuesByCodeQuery, useSaveUserMutation } from '@/services/setupService';
import { ApUser } from '@/types/model-types';
import { newApUser } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Dropdown, Popover, Button, Modal, Input, Form } from 'rsuite';
import MyInput from '../MyInput';
import { initialListRequest } from '@/types/types';

const EditProfile = ({ open, onClose }) => {
    const authSlice = useAppSelector(state => state.auth);
    const { data: gndrLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const { data: jobRoleLovQueryResponse } = useGetLovValuesByCodeQuery('JOB_ROLE');
    const { data: facilityListResponse, refetch: refetchFacility } = useGetFacilitiesQuery({
        ...initialListRequest,
        pageSize: 1000
    });
    const dispatch = useDispatch();
    const [user, setUser] = useState<ApUser>({
        ...newApUser, isValid: true
    });
    const [readyUser, setReadyUser] = useState({
        user
    });
    useEffect(() => {
        console.log(user)
        if (user.firstName)
            setReadyUser({
                ...user,
                fullName: user.firstName + ' ' + user.lastName,
                username: user.username ? user?.username : (user.firstName.slice(0, 1) + user.lastName).toLowerCase()
            })


    }, [user])

    useEffect(() => {
        setUser(authSlice.user)
    }, [authSlice.user])
    const { data: accessRoleListResponse } = useGetAccessRolesQuery({
        ...initialListRequest,
        pageSize: 1000
    });
    const handleClearFields = () => {
        //--
    }

    const [saveUser, saveUserMutation] = useSaveUserMutation();

    const InputForms = (editing) => {
        return (
            <div>
                <Form layout='inline' fluid>
                    <MyInput disabled={!editing} column fieldName="firstName" required record={user} setRecord={setUser} />
                    <MyInput disabled={!editing} column fieldName="secondName" required record={user} setRecord={setUser} />
                    <MyInput disabled={!editing} column fieldName="lastName" required record={user} setRecord={setUser} />
                    <MyInput disabled={true} column fieldName="fullName" required record={user} setRecord={setUser} />
                    <MyInput disabled={!editing} column fieldName="username" required record={readyUser} setRecord={setReadyUser} />

                </Form>

 

                <Form layout='inline' fluid>
                    <MyInput disabled={!editing} column fieldName="email" required record={user} setRecord={setUser} />
                    <MyInput disabled={!editing} column fieldName="phoneNumber" required record={user} setRecord={setUser} />

                    <MyInput disabled={!editing}
                        column
                        fieldLabel="sex at birth"
                        fieldType="select"
                        fieldName="sexAtBirthLkey"
                        selectData={gndrLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={user}
                        setRecord={setUser}
                    />

                    <MyInput disabled={!editing}
                        column
                        fieldType="date"
                        fieldLabel="DOB"
                        fieldName="dob"
                        record={user}
                        setRecord={setUser}
                    />

                </Form>



            </div>
        )
    }
    const handleSubmit = async () => {

        // dispatch(setUser(user));

        try {
            await saveUser(user).unwrap() 
            onClose();
        } catch (error) {
            console.error('Failed to Edit Profile:', error);
            dispatch(notify({ msg: 'Failed to Edit Profile:', sev: 'error' }));
        }

    };


    return (
        <Modal size={'md'} open={open} backdrop="static" onClose={onClose}>
            <Modal.Header>
                <Modal.Title>Edit Profile</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {InputForms(true)}
            </Modal.Body>
            <Modal.Footer>
                <Button appearance="primary" onClick={handleSubmit}>
                    Save
                </Button>
                <Button appearance="subtle" onClick={onClose}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
export default EditProfile;
