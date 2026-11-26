import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Form, Message, Panel } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useForgotPasswordMutation } from '@/services/userService';
import { useBranding } from '@/hooks/useBranding';
import Background from '../../images/auth-bg.png';
import Logo from '../../images/Logo_BLUE_New1.svg';
import '../authentication/sign-in/styles.less';
import '../reset-password/styles.less';

type Result = { found: true; maskedEmail: string } | { found: false };

/**
 * Normally reached from the sign-in screen's "Forgot password?" link, which already sent the
 * reset link for the typed user name and passes the masked email in the navigation state.
 * Opened directly (no state), it asks for the user name itself.
 */
const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sentTo = (location.state as { maskedEmail?: string } | null)?.maskedEmail;
  const branding = useBranding();
  const background = branding.loginBackground || Background;

  const [formValue, setFormValue] = useState({ username: '' });
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(
    sentTo ? { found: true, maskedEmail: sentTo } : null
  );

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async () => {
    setError('');
    const username = (formValue.username ?? '').trim();

    if (!username) {
      setError('User name is required');
      return;
    }

    try {
      const resp = await forgotPassword(username).unwrap();
      setResult(resp?.maskedEmail ? { found: true, maskedEmail: resp.maskedEmail } : { found: false });
    } catch (err: any) {
      if (err?.status === 'FETCH_ERROR') {
        setError('Server Cannot be Reached, Please Contact System Administrator');
      } else {
        setError('Failed to send reset link. Please try again.');
      }
    }
  };

  return (
    <Panel className="panel" style={{ backgroundImage: `url(${background})` }}>
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
            <img src={branding.logo || Logo} alt="Logo" />
          </Panel>

          <Panel className="sign-in-panel">
            <Form fluid onSubmit={handleSubmit}>
              <h4 className="create-password-header-title">
                {result?.found ? 'Check Your Email' : 'Forgot Your Password?'}
              </h4>

              {result?.found ? (
                <Message showIcon type="success" className="create-password-success-message">
                  A password reset link has been sent to{' '}
                  <span dir="ltr" style={{ whiteSpace: 'nowrap' }}>
                    {result.maskedEmail}
                  </span>
                  . Please check your inbox. The link is valid for 24 hours.
                </Message>
              ) : (
                <>
                  <p className="create-password-hint" style={{ marginBottom: 12 }}>
                    Enter your user name and we will send a link to reset your password to the
                    email registered on your account.
                  </p>

                  <MyInput
                    width="100%"
                    fieldLabel="User Name"
                    fieldName="username"
                    record={formValue}
                    setRecord={setFormValue}
                    placeholder="Enter User Name"
                    showLabel={true}
                    required
                  />

                  {result && !result.found && (
                    <Message showIcon type="warning" style={{ marginTop: 10 }}>
                      We could not send a reset link for this user name. Please check it, or
                      contact your system administrator.
                    </Message>
                  )}

                  {error && (
                    <p style={{ color: 'red', marginBottom: 10, marginTop: 10 }}>{error}</p>
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
                      Send Reset Link
                    </Button>
                  </Form.Group>
                </>
              )}

              <Button
                appearance="link"
                block
                onClick={() => navigate('/login')}
                style={{ marginTop: 8 }}
              >
                Back to Sign in
              </Button>
            </Form>
          </Panel>
        </div>
      </Panel>
    </Panel>
  );
};

export default ForgotPassword;
