import { useAppSelector } from '@/hooks';
import { setUser } from '@/reducers/authSlice';
import { useGetAccessRolesQuery, useGetFacilitiesQuery, useGetLovValuesByCodeQuery, useSaveUserMutation } from '@/services/setupService';
import { ApUser } from '@/types/model-types';
import { newApUser } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Form, Modal } from 'rsuite';
import MyInput from '../MyInput';
import { initialListRequest } from '@/types/types';

interface EditProfileProps {
    open: boolean;
    onClose: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ open, onClose }) => {
    const authSlice = useAppSelector(state => state.auth);
    const dispatch = useDispatch();

     const { data: gndrLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const { data: jobRoleLovQueryResponse } = useGetLovValuesByCodeQuery('JOB_ROLE');
    const { data: facilityListResponse } = useGetFacilitiesQuery({ ...initialListRequest, pageSize: 1000 });
    const { data: accessRoleListResponse } = useGetAccessRolesQuery({ ...initialListRequest, pageSize: 1000 });

     const [user, setUser] = useState<ApUser>({ ...newApUser, isValid: true });
    const [readyUser, setReadyUser] = useState<Partial<ApUser>>({});

     useEffect(() => {
        if (authSlice.user) {
            setUser(authSlice.user);
        }
    }, [authSlice.user]);

     useEffect(() => {
        if (user?.firstName && user?.lastName) {
            setReadyUser({
                ...user,
                fullName: `${user.firstName} ${user.lastName}`,
                username: user.username ?? (user.firstName.slice(0, 1) + user.lastName).toLowerCase()
            });
        }
    }, [user]);

     const [saveUser, saveUserMutation] = useSaveUserMutation();

     const handleSubmit = async () => {
        try {
            await saveUser(user).unwrap();
            onClose();
        } catch (error) {
            console.error('Failed to Edit Profile:', error);
            dispatch(notify({ msg: 'Failed to Edit Profile', sev: 'error' }));
        }
    };

    // Input forms
    const InputForms = (editing: boolean) => {
        if (!user) return <>Loading...</>; // safeguard
        return (
            <div>
                <Form layout='inline' fluid>
                    <MyInput disabled={!editing} column fieldName="firstName" required record={user} setRecord={setUser} />
                    <MyInput disabled={!editing} column fieldName="secondName" required record={user} setRecord={setUser} />
                    <MyInput disabled={!editing} column fieldName="lastName" required record={user} setRecord={setUser} />
                    <MyInput disabled column fieldName="fullName" required record={user} setRecord={setUser} />
                    <MyInput disabled={!editing} column fieldName="username" required record={readyUser} setRecord={setReadyUser} />
                </Form>

                <Form layout='inline' fluid>
                    <MyInput disabled={!editing} column fieldName="email" required record={user} setRecord={setUser} />
                    <MyInput disabled={!editing} column fieldName="phoneNumber" required record={user} setRecord={setUser} />
                    <MyInput
                        disabled={!editing}
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
                    <MyInput
                        disabled={!editing}
                        column
                        fieldType="date"
                        fieldLabel="DOB"
                        fieldName="dob"
                        record={user}
                        setRecord={setUser}
                    />
                </Form>
            </div>
        );
    };

    if (!user?.firstName) {
        return <>Loading...</>; // safeguard while waiting for user
    }

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
};

export default EditProfile;
