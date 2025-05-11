import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { useResetUserPasswordMutation } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { Radio, RadioGroup } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

const ResetPassword = ({
  open,
  setOpen,
  width,
  user,
  setUser
}) => {
  const dispatch = useAppDispatch();

  // const [resetVia, setResetVia] = useState('email');
  // Reset Password
  const [resetUserPassword] = useResetUserPasswordMutation();
  // Handle Reset Password
  const handleResetPassword = () => {
    resetUserPassword(user)
      .then(() => {
        setOpen(false);
        dispatch(notify({ msg: "New Password Was Sent to User's Email", sev: 'success' }));
      })
      .catch(() => {
        setOpen(false);
        dispatch(notify({ msg: 'Failed to Reset your password', sev: 'error' }));
      });
  };
  // Modal content
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
            <Form layout="inline" fluid>
              <MyInput
                disabled
                column
                fieldName="email"
                record={user}
                setRecord={setUser}
                width={width > 600 ? 520 : 250}
              />
              <MyInput
                disabled
                column
                fieldName="phoneNumber"
                record={user}
                setRecord={setUser}
                width={width > 600 ? 520 : 250}
              />
            <br />
            <br />
            <span>How would you like to reset the password?</span>
            <RadioGroup
              // onChange={e => setResetVia(e)}
              name="radio-group-inline"
              defaultValue="email"
            >
              <Radio value="email">Email</Radio>
              <Radio disabled value="phone">
                Phone Number
              </Radio>
            </RadioGroup>
            </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={`Reset Password for ${user.firstName}`}
      position="right"
      content={conjureFormContent}
      actionButtonLabel="Reset"
      actionButtonFunction={handleResetPassword}
      size={width > 600 ? '570px' : '300px'}
      //  steps={[
      //         { title: 'Reset Password', icon: faUnlockKeyhole }
      //  ]}
    />
  );
};
export default ResetPassword;
