import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Form, Modal } from 'rsuite';
import MyInput from '../MyInput';
import MyModal from '../MyModal/MyModal';
import { useChangePasswordMutation } from '@/services/userService';
import { notify } from '@/utils/uiReducerActions';

const ChangePassword = ({ open, onClose }) => {
    const dispatch = useDispatch();
    const [currentPassword, setCurrentPassword] = useState({ currentPassword: '' });
    const [newPassword, setNewPassword] = useState({ newPassword: '' });
    const [confirmPassword, setConfirmPassword] = useState({ confirmPassword: '' });
    const [error, setError] = useState('');
    const [changePassword, { isLoading }] = useChangePasswordMutation();

      const clearFields = () => {
        setCurrentPassword({currentPassword: ""});
        setNewPassword({newPassword:''});
        setConfirmPassword({confirmPassword:''});
        setError('');
      };

    const handleSubmit = async () => {
        setError('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Please fill in all fields');
            dispatch(notify({ msg: 'Please fill in all fields', sev: 'info' }))
            return;
        }

        if (newPassword.newPassword !== confirmPassword.confirmPassword) {
            console.log("new", newPassword);
            console.log("confirm", confirmPassword)
            setError('New passwords do not match');
            dispatch(notify({ msg: 'New passwords do not match', sev: 'info' }))
            return;
        }

        try {

            const Current = currentPassword.currentPassword;
            const New = newPassword.newPassword
            console.log({
                "currentPassword": Current,
                "newPassword": New
            });
            await changePassword({
                "currentPassword": Current,
                "newPassword": New
            }).unwrap();
            dispatch(notify({ msg: 'Password changed successfully', sev: 'success' }));
            onClose();
              clearFields();

        } catch (err) {
            console.error('Password change failed:', err);
            setError('Failed to change password. Please try again.');
            dispatch(notify({ msg: 'Failed to change password. Please try again.', sev: 'error' }));
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
                        fieldName="currentPassword"
                        record={currentPassword}
                        setRecord={setCurrentPassword}
                    />
                    <MyInput
                        width={350}
                        column
                        fieldLabel="New Password"
                        fieldName="newPassword"
                        record={newPassword}
                        setRecord={setNewPassword}
                    />

                    <MyInput
                        width={350}
                        column
                        fieldLabel="Confirm Password"
                        fieldName="confirmPassword"
                        record={confirmPassword}
                        setRecord={setConfirmPassword}
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
};

export default ChangePassword;
