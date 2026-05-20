import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFinishCreatePatientPasswordMutation } from '@/services/patient/patientService';
import { Form, Panel, Message, Button, Loader } from 'rsuite';
import MyInput from '@/components/MyInput';
import Background from '../../../images/auth-bg.png';
import Logo from '../../../images/Logo_BLUE_New.png';
import ErrorPage from '@/components/ErrorPage';
import config from '../../../../app-config';
import './CreatePatientPassword.less';

const CreatePatientPassword = () => {
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key');
  const navigate = useNavigate();

  const [formValue, setFormValue] = useState({ newPassword: '', confirmPassword: '' });
  const [formError, setFormError] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPasswordCreated, setIsPasswordCreated] = useState(false);

  const hasValidKey = key && typeof key === 'string' && key.trim() !== '';
  const [isKeyValid, setIsKeyValid] = useState<any>(undefined);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<any>(undefined);

  useEffect(() => {
    if (hasValidKey && key && key.trim() !== '') {
      setIsValidating(true);
      setValidationError(undefined);
      setIsKeyValid(undefined);

      const baseUrl = config.backendBaseURL || 'http://localhost:8080';
      const url = `${baseUrl}/api/patient/create-patient-password/validate?key=${encodeURIComponent(key)}`;
      const timeoutId = setTimeout(() => {
        setValidationError({ status: 408, message: 'Request timeout' });
        setIsValidating(false);
        setIsKeyValid(undefined);
      }, 10000);

      fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('id_token') || localStorage.getItem('token')
            ? { Authorization: `Bearer ${localStorage.getItem('id_token') || localStorage.getItem('token')}` }
            : {}),
        },
      })
        .then(async res => {
          clearTimeout(timeoutId);
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw { status: res.status, data: errorData };
          }
          return res.json();
        })
        .then(data => {
          setIsKeyValid(data);
          setIsValidating(false);
          setValidationError(undefined);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          setValidationError(err);
          setIsValidating(false);
          setIsKeyValid(undefined);
        });

      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      setIsValidating(false);
    }
  }, [hasValidKey, key]);

  const isUserAlreadyActive = useMemo(() => {
    if (isValidating) {
      return false;
    }

    if (isKeyValid && typeof isKeyValid === 'object' && isKeyValid !== null) {
      const response = isKeyValid as any;
      if (response.valid === true) {
        return false;
      }
      if (response.valid === false) {
        if (response.activated === true || response.passwordAlreadySet === true || response.message === 'USER_ALREADY_ACTIVE') {
          return true;
        }
      }
    }

    if (validationError) {
      const errorData = (validationError as any)?.data;
      if (errorData && typeof errorData === 'object') {
        if (errorData.valid === true) {
          return false;
        }
        if (errorData.activated === true || errorData.passwordAlreadySet === true || errorData.message === 'USER_ALREADY_ACTIVE') {
          return true;
        }
      }
    }

    return false;
  }, [isKeyValid, validationError, isValidating]);

  const [finishCreatePatientPassword, { isLoading }] = useFinishCreatePatientPasswordMutation();

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
    setError('');
    setSuccess('');
    setFormError({});

    if (!formValue.newPassword || formValue.newPassword.trim() === '') {
      setError('New password is required');
      return;
    }

    const passwordError = validatePassword(formValue.newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!formValue.confirmPassword || formValue.confirmPassword.trim() === '') {
      setError('Confirm password is required');
      return;
    }

    if (formValue.newPassword !== formValue.confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    try {
      await finishCreatePatientPassword({ key, newPassword: formValue.newPassword }).unwrap();
      setSuccess('Password created successfully!');
      setIsPasswordCreated(true);
    } catch (err: any) {
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
        'Failed to create password. Please try again.';

      setError(errorMessage);
    }
  };

  if (!key || !hasValidKey) {
    return (
      <Panel className="panel" style={{ backgroundImage: `url(${Background})` }}>
        <ErrorPage code={403}>
          <p className="error-page-title">Invalid or Missing Link</p>
          <p className="error-page-subtitle text-muted">
            Please check your email link or request a new one.
          </p>
        </ErrorPage>
      </Panel>
    );
  }

  if (validationError) {
    const errorData = (validationError as any)?.data;
    if (errorData && typeof errorData === 'object') {
      if (errorData.activated === true || errorData.passwordAlreadySet === true || errorData.message === 'USER_ALREADY_ACTIVE') {
        return (
          <Panel className="panel" style={{ backgroundImage: `url(${Background})` }}>
            <ErrorPage code={403}>
              <p className="error-page-title">Password Already Set</p>
              <p className="error-page-subtitle text-muted">
                Your account already has a password set. If you need to reset your password, please use the password reset feature.
              </p>
            </ErrorPage>
          </Panel>
        );
      }
    }

    return (
      <Panel className="panel" style={{ backgroundImage: `url(${Background})` }}>
        <ErrorPage code={403}>
          <p className="error-page-title">Link is Invalid or Expired</p>
          <p className="error-page-subtitle text-muted">
            Please request a new create-password link from your administrator.
          </p>
        </ErrorPage>
      </Panel>
    );
  }

  if (!isValidating && isUserAlreadyActive) {
    return (
      <Panel className="panel" style={{ backgroundImage: `url(${Background})` }}>
        <ErrorPage code={403}>
          <p className="error-page-title">Password Already Set</p>
          <p className="error-page-subtitle text-muted">
            Your account already has a password set. If you need to reset your password, please use the password reset feature.
          </p>
        </ErrorPage>
      </Panel>
    );
  }

  if (!isValidating && isKeyValid && typeof isKeyValid === 'object' && (isKeyValid as any).valid === false && !isUserAlreadyActive) {
    const response = isKeyValid as any;
    const message = response.message || '';

    let errorTitle = 'Link is Invalid or Expired';
    let errorSubtitle = 'Please request a new create-password link from your administrator.';

    if (message === 'TOKEN_INVALID_OR_EXPIRED') {
      errorTitle = 'Link is Invalid or Expired';
      errorSubtitle = 'This link has expired or is invalid. Please request a new create-password link from your administrator.';
    } else if (message === 'TOKEN_NOT_FOUND') {
      errorTitle = 'Link Not Found';
      errorSubtitle = 'This link could not be found. Please request a new create-password link from your administrator.';
    }

    return (
      <Panel className="panel" style={{ backgroundImage: `url(${Background})` }}>
        <ErrorPage code={403}>
          <p className="error-page-title">{errorTitle}</p>
          <p className="error-page-subtitle text-muted">{errorSubtitle}</p>
        </ErrorPage>
      </Panel>
    );
  }

  if (isValidating && !isKeyValid && !validationError && hasValidKey) {
    return (
      <Panel className="panel" style={{ backgroundImage: `url(${Background})` }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Loader size="lg" />
        </div>
      </Panel>
    );
  }

  if (!isValidating && !isKeyValid && !validationError && hasValidKey) {
    return (
      <Panel className="panel" style={{ backgroundImage: `url(${Background})` }}>
        <ErrorPage code={403}>
          <p className="error-page-title">Link is Invalid or Expired</p>
          <p className="error-page-subtitle text-muted">
            Please request a new create-password link from your administrator.
          </p>
        </ErrorPage>
      </Panel>
    );
  }

  if (!isValidating && isKeyValid && typeof isKeyValid === 'object' && (isKeyValid as any).valid !== true) {
    return (
      <Panel className="panel" style={{ backgroundImage: `url(${Background})` }}>
        <ErrorPage code={403}>
          <p className="error-page-title">Link is Invalid or Expired</p>
          <p className="error-page-subtitle text-muted">
            Please request a new create-password link from your administrator.
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
          borderRadius: '10px',
          opacity: isPasswordCreated ? 0.6 : 1,
          pointerEvents: isPasswordCreated ? 'none' : 'auto',
        }}
      >
        <div className="bodySignInDiv">
          <Panel className="logo-panel">
            <img src={Logo} alt="Tenant Logo" />
          </Panel>

          <Panel className="sign-in-panel">
            {isPasswordCreated ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ marginBottom: '20px', fontSize: '48px', color: 'green' }}>✓</div>
                <Message showIcon type="success" style={{ marginBottom: '20px' }}>
                  Password created successfully!
                </Message>
                <p style={{ color: '#666', marginTop: '20px', fontSize: '16px' }}>
                  Your account is now active and ready to use.
                </p>
              </div>
            ) : (
              <Form fluid onSubmit={handleSubmit}>
                <h4 className="create-password-header-title">Create Your Password</h4>

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
                <Form.HelpText className="create-password-hint">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>1. Minimum 8 characters</div>
                    <div>2. At least one uppercase letter</div>
                    <div>3. At least one number</div>
                    <div>4. At least one symbol (@ $ ! % * ? & # _ - .)</div>
                    <div>5. No spaces</div>
                  </div>
                </Form.HelpText>
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
                    Create Password
                  </Button>
                </Form.Group>
              </Form>
            )}
          </Panel>
        </div>
      </Panel>
    </Panel>
  );
};

export default CreatePatientPassword;
