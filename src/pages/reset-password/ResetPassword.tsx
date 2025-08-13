import React, { useState } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFinishPasswordResetMutation } from '@/services/userService';
import {
  Form,
  Button,
  Panel,
  Message,
  Schema,
  Container,
  Header,
  Content,
  Divider,
  FlexboxGrid,
  IconButton,
 Icon,
  Loader,
  Stack,
} from 'rsuite';
import MyButton from "@/components/MyButton/MyButton";

const { StringType } = Schema.Types;

const model = Schema.Model({
  newPassword: StringType()
    .isRequired('New password is required')
    .minLength(6, 'Password must be at least 6 characters'),
  confirmPassword: StringType()
    .addRule((value, data) => value === data.newPassword, 'Passwords do not match')
    .isRequired('Confirm password is required')
});

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const resetKey = searchParams.get('key');
  const navigate = useNavigate();
  const [formValue, setFormValue] = useState({ newPassword: '', confirmPassword: '' });
  const [formError, setFormError] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [finishPasswordReset, { isLoading }] = useFinishPasswordResetMutation();

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (!model.check(formValue)) {
      setFormError(model.check(formValue, { autoDetect: false }));
      return;
    }
    try {
      await finishPasswordReset({ key: resetKey, newPassword: formValue.newPassword }).unwrap();
      setSuccess('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      if (err?.data?.msg === 'Invalid token') {
        setError('Reset token is invalid or expired. Please request a new reset link.');
      } else {
        setError('Failed to reset password. Please try again.');
      }
    }
  };

  if (!resetKey) {
    return (
      <Container style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
        <Panel bordered shaded style={{ textAlign: 'center' }}>
          <Icon icon="close-circle" size="3x" style={{ color: '#E74C3C' }} />
          <h3 style={{ marginTop: 20 }}>Invalid or missing reset key</h3>
          <p>Please check your reset link or request a new one.</p>
        </Panel>
      </Container>
    );
  }

  return (
    <Container style={{ maxWidth: 500, margin: '50px auto', padding: 30 }}>
      <Panel
        shaded
        bordered
        style={{
          boxShadow: '0 4px 15px rgb(0 0 0 / 0.15)',
          borderRadius: 15,
          padding: '50px 40px',
          background: 'linear-gradient(135deg, #749bbdff 0%, #162bc8ff 100%)',
          color: '#fff',
        }}
      >
        <Header>
          <h2 style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 20 }}>
            Reset Your Password
          </h2>
          <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }} />
        </Header>

        <Content>
          <Form
            fluid
            model={model}
            formValue={formValue}
            onChange={setFormValue}
            onCheck={setFormError}
            formError={formError}
            onSubmit={handleSubmit}
          >
            <Form.Group controlId="newPassword">
              <Form.ControlLabel style={{ color: '#eee', fontWeight: '600' }}>
                New Password
              </Form.ControlLabel>
              <Form.Control
                name="newPassword"
                type="password"
                placeholder="Enter your new password"
                style={{ borderRadius: 8 }}
              />
              <Form.ErrorMessage style={{ color: '#0c55a9ff' }} name="newPassword" />
            </Form.Group>

            <Form.Group controlId="confirmPassword" style={{ marginTop: 20 }}>
              <Form.ControlLabel style={{ color: '#eee', fontWeight: '600' }}>
                Confirm Password
              </Form.ControlLabel>
              <Form.Control
                name="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                style={{ borderRadius: 8 }}
              />
              <Form.ErrorMessage style={{ color: '#1153aaff' }} name="confirmPassword" />
            </Form.Group>

            {error && (
              <Message showIcon type="error" style={{ marginTop: 25, fontWeight: '700' }}>
                {error}
              </Message>
            )}
            {success && (
              <Message showIcon type="success" style={{ marginTop: 25, fontWeight: '700' }}>
                {success}
              </Message>
            )}

            <Stack justifyContent="center" alignItems="center" spacing={10} style={{ marginTop: 30 }}>
              <MyButton onClick={handleSubmit}>Reset Password</MyButton>
              
            </Stack>
          </Form>
        </Content>
      </Panel>
    </Container>
  );
};

export default ResetPassword;
