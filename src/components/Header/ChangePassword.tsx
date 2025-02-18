import { useAppSelector } from '@/hooks';
import { setUser } from '@/reducers/authSlice';
import { useSaveUserMutation } from '@/services/setupService';
import { ApUser } from '@/types/model-types';
import { newApUser } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Dropdown, Popover, Button, Modal, Input, Form } from 'rsuite';
import MyInput from '../MyInput';
import FormControl from 'rsuite/esm/FormControl';
import { Password } from 'primereact/password';

const ChangePassword = ({ open, onClose }) => {
    const [password, setPassword] = useState({ password: '' });
    const [newPassword, setNewPassword] = useState({ newPassword: '' });
    const [confirmPassword, setConfirmPassword] = useState({ confirmPassword: '' });
    const authSlice = useAppSelector(state => state.auth);
    const [saveUser, saveUserMutation] = useSaveUserMutation();
    const dispatch = useDispatch();
    const [localUser, setLocalUser] = useState<ApUser>({ ...newApUser });

    useEffect(() => {
        setLocalUser(authSlice.user)
        console.log(authSlice.user)

    }, [authSlice.user])

 

    const handleClearFields = () => {
        setNewPassword({ newPassword: '' })
        setConfirmPassword({ confirmPassword: '' })
        setPassword({ password: '' })
    }

    const handleSubmit = async () => {
        console.log(authSlice.user);

        if (authSlice.user.password === password?.password) {
            if (newPassword?.newPassword === confirmPassword?.confirmPassword && newPassword?.newPassword.length > 0) {
                try {
                    await saveUser({ ...localUser, password: newPassword?.newPassword }).unwrap();

                    console.log('Password changed successfully:', newPassword);

                    dispatch(notify({ msg: 'Password changed successfully' }));
                    handleClearFields();
                    dispatch(setUser({ ...localUser, password: newPassword?.newPassword }));

                    onClose();
                } catch (error) {
                    console.error('Failed to change password:', error);
                    dispatch(notify({ msg: 'Failed to change password. Please try again.', sev: 'error' }));
                }
            } else {
                console.log('Passwords do not match.');
                dispatch(notify({ msg: 'Passwords do not match.', sev: 'error' }));
            }
        } else {
            console.log('Incorrect current password');
            dispatch(notify({ msg: 'Incorrect current password.', sev: 'error' }));
        }
    };


    return (
        <Modal open={open} backdrop="static" onClose={onClose}>
            <Modal.Header>
                <Modal.Title>Change Password</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form layout="inline">
                    <MyInput

                        width={350}
                        column
                        fieldLabel="Current Password"
                        fieldName="password"
                        record={password}
                        setRecord={setPassword}
                    />

                    <MyInput
                        width={350}
                        column
                        fieldLabel="Confirm Password"
                        fieldName="confirmPassword"
                        record={confirmPassword}
                        setRecord={setConfirmPassword}
                    />
                    <MyInput
                        width={350}
                        column
                        fieldLabel="New Password"
                        fieldName="newPassword"
                        record={newPassword}
                        setRecord={setNewPassword}
                    />
                </Form>

            </Modal.Body>
            <Modal.Footer>
                <Button disabled={!newPassword} appearance="primary" onClick={handleSubmit}>
                    Save
                </Button>
                <Button appearance="subtle" onClick={onClose}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
export default ChangePassword;
