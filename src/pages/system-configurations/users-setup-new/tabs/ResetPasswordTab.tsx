import React from 'react';
import { Form, Radio, RadioGroup } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { ApUser } from '@/types/model-types-new';
import { useRequestPasswordResetMutation } from '@/services/userService';

interface ResetPasswordTabProps {
  user: ApUser;
  width: number;
}

const ResetPasswordTab: React.FC<ResetPasswordTabProps> = ({ user, width }) => {
   const mode = useAppSelector((state: any) => state.ui.mode);
  const dispatch = useAppDispatch();
  const [requestPasswordReset] = useRequestPasswordResetMutation();

  const handleResetPassword = () => {
    if (!user?.email) {
      dispatch(notify({ msg: 'User email is required to reset password', sev: 'error' }));
      return;
    }

    requestPasswordReset(user.email)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: "New Password Was Sent to User's Email", sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to reset password', sev: 'error' }));
      });
  };

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div style={{ padding: '20px' }} dir={dir}>
      <Form layout="inline" fluid>
        <MyInput
          disabled
          column
          fieldLabel="Email"
          fieldName="email"
          record={user}
          setRecord={() => {}}
          width={width > 600 ? 520 : 250}
        />
        <MyInput
          disabled
          column
          fieldLabel="Phone Number"
          fieldName="phoneNumber"
          record={user}
          setRecord={() => {}}
          width={width > 600 ? 520 : 250}
        />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginLeft: '10px' }}>
          <span style={{ marginBottom: 8, color: mode === 'dark' ? 'var(--white)' : ''}}>How would you like to reset the password?</span>
          <RadioGroup name="radio-group-inline" defaultValue="email" style={{ marginBottom: 8 }}>
            <Radio style={{color: mode === 'dark' ? 'var(--white)' : ''}} value="email">Email</Radio>
            <Radio style={{color: mode === 'dark' ? 'var(--white)' : ''}} disabled value="phone">
              Phone Number
            </Radio>
          </RadioGroup>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <MyButton onClick={handleResetPassword} appearance="primary" disabled={!user?.id}>
              Reset Password
            </MyButton>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default ResetPasswordTab;


