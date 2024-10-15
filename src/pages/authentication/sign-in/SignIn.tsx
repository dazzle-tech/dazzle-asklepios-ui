import React, { useEffect, useState } from 'react';
import { Form, Button, Panel, SelectPicker, Stack, Divider, Message } from 'rsuite';
import { useAppDispatch, useAppSelector } from '@/hooks';
import Logo from '../../../images/ASK_LOGO.svg';
import Translate from '@/components/Translate';
import { useLoginMutation } from "@/services/authService";
import { useNavigate } from "react-router-dom";
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetFacilitiesQuery } from '@/services/setupService';

const SignIn = () => {
  const [login, { isLoading: isLoggingIn, data: loginResult, error: loginError }] = useLoginMutation()
  const authSlice = useAppSelector(state => state.auth);
  const [otpView, setOtpView] = useState(false);
  const [resetPasswordView, setResetPasswordView] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    orgKey: ''
  });
  const navigate = useNavigate();

  const {
    data: facilityListResponse,
    isLoading: isGettingFacilities,
    isFetching: isFetchingFacilities
  } = useGetFacilitiesQuery({ ...initialListRequest });

  const handleLogin = () => {
    login(credentials).unwrap();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();  // Prevent default form submission behavior
      handleLogin();
    }
  };


  useEffect(() => {
    // if there is a user, navigate to dashboard
    if (authSlice.user && localStorage.getItem('access_token')) {
      navigate('/')
    }
  }, [authSlice.user]);

  return (
    <Stack
      justifyContent="center"
      alignItems="center"
      direction="column"
      style={{
        height: '100vh'
      }}
    >
      <img
        src={
          authSlice.tenant && authSlice.tenant.tenantLogoPath
            ? authSlice.tenant.tenantLogoPath
            : Logo
        }
        width={300}
      />
      <br />

      {!resetPasswordView && (
        <Panel bordered style={{ background: '#fff', width: 400, padding: 20 }}
          header={<h3>Sign In</h3>}>
          {!authSlice.tenant && (
            <Message type="warning" showIcon>
              <Translate>No Tenant Configured</Translate>
            </Message>
          )}
          <Form fluid onKeyPress={handleKeyPress}>
            <Form.Group>
              <Form.ControlLabel>Organization</Form.ControlLabel>
              <Form.Control
                block
                disabled={!authSlice.tenant}
                accepter={SelectPicker}
                name="organization"
                data={facilityListResponse?.object ?? []}
                labelKey='facilityName'
                valueKey='key'
                value={credentials.orgKey}
                onChange={e => {
                  setCredentials({ ...credentials, orgKey: e });
                }}
              />
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>Username</Form.ControlLabel>
              <Form.Control
                disabled={!authSlice.tenant}
                name="username"
                value={credentials.username}
                onChange={e => {
                  setCredentials({ ...credentials, username: e });
                }}
              />
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>
                <span>Password</span>
                <a style={{ float: 'right' }}>Forgot password?</a>
              </Form.ControlLabel>
              <Form.Control
                disabled={!authSlice.tenant}
                name="passowrd"
                type="password"
                value={credentials.password}
                onChange={e => {
                  setCredentials({ ...credentials, password: e });
                }}
              />
            </Form.Group>
            <Form.Group>
              <Stack spacing={6} divider={<Divider vertical />}>
                <Button appearance="primary" onClick={handleLogin} disabled={!authSlice.tenant}>
                  Sign in
                </Button>
              </Stack>
            </Form.Group>
          </Form>
        </Panel>
      )}

      {resetPasswordView && (
        <Panel bordered style={{ background: '#fff', width: 400 }} header={<h3>Sign In</h3>}>
          <Form fluid>
            <Form.Group>
              <Form.ControlLabel>Organization</Form.ControlLabel>
              <Form.Control
                block
                accepter={SelectPicker}
                name="organization"
                data={organizations}
                value={credentials.orgKey}
                onChange={e => {
                  setCredentials({ ...credentials, orgKey: e });
                }}
              />
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>Username</Form.ControlLabel>
              <Form.Control
                name="username"
                value={credentials.username}
                onChange={e => {
                  setCredentials({ ...credentials, username: e });
                }}
              />
            </Form.Group>
            <Form.Group>
              <Stack spacing={6} divider={<Divider vertical />}>
                <Button appearance="primary" onClick={handleLogin}>
                  Send OTP
                </Button>
              </Stack>
            </Form.Group>
          </Form>
        </Panel>
      )}
    </Stack>
  );
};

export default SignIn;
