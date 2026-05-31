import { useAppSelector } from '@/hooks';
import { useGetAccessRolesQuery, useGetFacilitiesQuery, useGetLovValuesByCodeQuery} from '@/services/setupService';

import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Form, Modal } from 'rsuite';
import MyInput from '../MyInput';
import { initialListRequest } from '@/types/types';
import { ApUser } from '@/types/model-types-new';
import { newApUser } from '@/types/model-types-constructor-new';
import { useSaveAccountMutation } from '@/services/userService';
import MyModal from '@/components/MyModal/MyModal';

interface EditProfileProps {
    open: boolean;
    onClose: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ open, onClose }) => {
    const authSlice = useAppSelector(state => state.auth);
    const dispatch = useDispatch();

     const { data: gndrLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');

     const [user, setUser] = useState<ApUser>({ ...newApUser });

     useEffect(() => {
        if (authSlice.user) {
            setUser(authSlice.user);
        }
    }, [authSlice.user]);

    //  useEffect(() => {
    //     if (user?.firstName && user?.lastName) {
    //         setReadyUser({
    //             ...user,
    //             fullName: `${user.firstName} ${user.lastName}`,
    //             username: user.username ?? (user.firstName.slice(0, 1) + user.lastName).toLowerCase()
    //         });
    //     }
    // }, [user]);

     const [saveUser, saveUserMutation] = useSaveAccountMutation()

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
                    {/* <MyInput disabled={!editing} column fieldName="secondName" required record={user} setRecord={setUser} /> */}
                    <MyInput disabled={!editing} column fieldName="lastName" required record={user} setRecord={setUser} />
                    {/* <MyInput disabled column fieldName="fullName" required record={user} setRecord={setUser} /> */}
                    <MyInput disabled={!editing} column fieldName="login" required record={user} setRecord={setUser} />
                </Form>

                <Form layout='inline' fluid>
                    <MyInput disabled={!editing} column fieldName="email" required record={user} setRecord={setUser} />
                    <MyInput disabled={!editing} column fieldName="phoneNumber" required record={user} setRecord={setUser} />
                    <MyInput
                        disabled={!editing}
                        column
                        fieldLabel="Gender"
                        fieldType="select"
                        fieldName="sexAtBirthLkey"
                        selectData={gndrLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={user}
                        setRecord={setUser}
                                disableByField='isValid'

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
        <MyModal
        open={open}
        setOpen={onClose}
        title="Edit Profile"
        size="md"
        position="center"
        bodyheight="auto"
        actionButtonFunction={handleSubmit}
        actionButtonLabel="Save"
        cancelButtonLabel="Cancel"
        isDisabledActionBtn={false}
        content={
            <div>
            {InputForms(true)}
            </div>
        }
        />
    );
};

export default EditProfile;