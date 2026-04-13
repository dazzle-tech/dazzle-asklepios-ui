import React, { useState } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFinishPasswordResetMutation } from '@/services/userService';
import { Form, Panel, Message, Button, Loader } from 'rsuite';
import MyInput from '@/components/MyInput';
import Background from '../../images/auth-bg.png';
import Logo from '../../images/Logo_BLUE_New.png';
import ErrorPage from '@/components/ErrorPage';
import './styles.less';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const resetKey = searchParams.get('key');
  const navigate = useNavigate();

  const [formValue, setFormValue] = useState({ newPassword: '', confirmPassword: '' });
  const [formError, setFormError] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [finishPasswordReset, { isLoading }] = useFinishPasswordResetMutation();

  const validatePassword = (password: string): string | null => {
    if (!password) {
      return 'New password is required';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }

    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (!/\d/.test(password)) {
      return 'Password must contain at least one number';
    }

    if (!/[@$!%*?&#_.-]/.test(password)) {
      return 'Password must contain at least one symbol (@ $ ! % * ? & # _ - .)';
    }

    if (/\s/.test(password)) {
      return 'Password must not contain spaces';
    }

    return null;
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setError('');
    setSuccess('');
    setFormError({});

    // Validate new password is provided
    if (!formValue.newPassword || formValue.newPassword.trim() === '') {
      setError('New password is required');
      return;
    }

    // Validate new password meets all requirements
    const passwordError = validatePassword(formValue.newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Validate confirm password is provided
    if (!formValue.confirmPassword || formValue.confirmPassword.trim() === '') {
      setError('Confirm password is required');
      return;
    }

    // Validate passwords match
    if (formValue.newPassword !== formValue.confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    // All validations passed, call API
    try {
      await finishPasswordReset({ key: resetKey, newPassword: formValue.newPassword }).unwrap();
      setSuccess('Password reset successfully!');
      navigate('/login');
    } catch (err: any) {
      // Extract the exact error message from various possible locations
      const errorMessage =
        err?.data?.message ||
        err?.data?.msg ||
        err?.data?.detail ||
        err?.data?.error ||
        (typeof err?.data === 'string' ? err.data : null) ||
        err?.message ||
        err?.error?.data?.message ||
        err?.error?.data?.msg ||
        err?.error?.data?.detail ||
        err?.error?.message ||
        'Failed to reset password. Please try again.';

      setError(errorMessage);
    }
  };

  // Show 403 error for invalid or missing key
  if (!resetKey) {
    return (
      <Panel className="panel" style={{ backgroundImage: `url(${Background})` }}>
        <ErrorPage code={403}>
          <p className="error-page-title">Invalid or Missing Link</p>
          <p className="error-page-subtitle text-muted">
            Please check your reset link or request a new one.
          </p>
        </ErrorPage>
      </Panel>
    );
  }

  return (
    <Panel className="panel" style={{ backgroundImage: `url(${Background})` }}>
      <Panel
        bordered
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '20px',
          borderRadius: '10px'
        }}
      >
        <div className="bodySignInDiv">
          <Panel className="logo-panel">
            <img src={Logo} alt="Tenant Logo" />
          </Panel>

          <Panel className="sign-in-panel">
            <Form fluid onSubmit={handleSubmit}>
              <h4 className="create-password-header-title">Reset Your Password</h4>

              <MyInput
                width="100%"
                fieldLabel="New Password"
                fieldName="newPassword"
                fieldType="password"
                record={formValue}
                setRecord={setFormValue}
                placeholder="Enter New Password"
                showLabel={true}
                required
              />
              <Form.HelpText className="create-password-hint">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>1. Minimum 8 characters</div>
                  <div>2. At least one uppercase letter</div>
                  <div>3. At least one number</div>
                  <div>4. At least one symbol (@ $ ! % * ? & # _ - .)</div>
                  <div>5. No spaces</div>
                </div>
              </Form.HelpText>
              <MyInput
                width="100%"
                fieldLabel="Confirm Password"
                fieldName="confirmPassword"
                fieldType="password"
                record={formValue}
                setRecord={setFormValue}
                placeholder="Confirm Password"
                showLabel={true}
                required
              />
              {formValue.confirmPassword && formValue.newPassword !== formValue.confirmPassword && (
                <Form.HelpText style={{ color: 'red', marginTop: 4 }}>
                  Passwords do not match
                </Form.HelpText>
              )}

              {error && (
                <p style={{ color: 'red', marginBottom: 10, marginTop: 10 }}>{error}</p>
              )}
              {success && (
                <Message showIcon type="success" className="create-password-success-message">
                  {success}
                </Message>
              )}

              <Form.Group>
                <Button
                  style={{ backgroundColor: 'var(--primary-blue)' }}
                  appearance="primary"
                  onClick={handleSubmit}
                  loading={isLoading}
                  className="submit-button"
                  block
                >
                  Reset Password
                </Button>
              </Form.Group>
            </Form>
          </Panel>
        </div>
      </Panel>
    </Panel>
  );
};

export default ResetPassword;
