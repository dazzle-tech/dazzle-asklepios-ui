import MyInput from '@/components/MyInput';
import {  useGetLovValuesByCodeQuery, useSaveUserMutation, useGetLovDefultByCodeQuery } from '@/services/setupService';
import { ApUser } from '@/types/model-types';
import { newApUser } from '@/types/model-types-constructor';

import { initialListRequest } from '@/types/types';
import RemindIcon from '@rsuite/icons/legacy/Remind';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Modal, Panel } from 'rsuite';
import Background from '../../../images/auth-bg.png';
import Logo from '../../../images/Logo_BLUE_New.svg';
import './styles.less';

import { useLoginMutation } from '@/services/authServiceApi';
import { useDispatch } from 'react-redux';
import { useLazyGetAccountQuery } from '@/services/accountService';
import { setTenant, setToken, setUser } from '@/reducers/authSlice';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { store } from '@/store';
import { enumsApi } from '@/services/enumsApi';


const SignIn = () => {
  const [otpView, setOtpView] = useState(false);
  const [changePasswordView, setChangePasswordView] = useState(false);
  const [newPassword, setNewPassword] = useState<string | undefined>();
  const [newPasswordConfirm, setNewPasswordConfirm] = useState<string | undefined>();
  const [errText, setErrText] = useState(' ');
  const [resetPasswordView, setResetPasswordView] = useState(false);
  const { data: langdefult } = useGetLovDefultByCodeQuery('SYSTEM_LANG');

  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    orgKey: ''
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const uiSlice = useAppSelector(state => state.ui);
  const [langRecord, setLangRecord] = useState({ lang: uiSlice.lang });


  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [getAccount] = useLazyGetAccountQuery();
  const {
    data: facilityListResponse,
  } = useGetAllFacilitiesQuery({});
  console.log( facilityListResponse);
  const { data: langLovQueryResponse } = useGetLovValuesByCodeQuery('SYSTEM_LANG');
  const [saveUser] = useSaveUserMutation();

  // Handle login
  const handleLogin = async () => {
    if (!credentials.username || !credentials.password || !credentials.orgKey) {
      setErrText('Please fill all required fields.');
      return;
    }

    try {
      const resp = await login({
        username: credentials.username,
        password: credentials.password,
        facilityId: Number(credentials.orgKey),
        rememberMe: true
      }).unwrap();

      // Save token first so prepareHeaders can pick it up
      dispatch(setToken(resp.id_token));

      const userResp = await getAccount().unwrap();
      dispatch(setUser(userResp));

    // NEW ⬇︎ merge the selected facility into tenant as `selectedFacility`
      const selectedFacility =
        (facilityListResponse ?? []).find((f: any) => f.id === Number(credentials.orgKey)) || null;
     const existingTenant = JSON.parse(localStorage.getItem('tenant') || 'null') || {};
     dispatch(setTenant({ ...existingTenant, selectedFacility }));

     // (Optional cleanup) If you previously stored standalone 'facility' in localStorage, remove it:
     // localStorage.removeItem('facility');
     // and stop dispatching any setFacility action you might have had.

      console.log('User Info:', userResp);
      localStorage.setItem('id_token', resp.id_token);
      localStorage.setItem('user', JSON.stringify(userResp));

      store.dispatch(enumsApi.util.prefetch('getAllEnums', undefined, { force: true }));

      setErrText(' ');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setErrText('Login failed. Please check your credentials.');
    }
  };

  // Submit on Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  // Handle saving new password
  const handleSaveNewPassword = () => {
    if (changePasswordView) {
      if (!newPassword || newPassword === '') {
        setErrText('Please ensure both fields are filled.');
      } else {
        if (newPassword === newPasswordConfirm) {
          saveUser({ password: newPassword, mustChangePassword: false })
            .unwrap()
            .then(() => {
              navigate('/');
            });
        } else setErrText('Please ensure both fields have the same password.');
      }
    }
  };

  // Effect to clear error text when password fields change
  useEffect(() => {
    setErrText(' ');
  }, [newPassword, newPasswordConfirm]);


  useEffect(() => {
    dispatch(setLang(langRecord['lang']));
  }, [langRecord]);

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

          {!resetPasswordView && (
            <Panel className="sign-in-panel ">
              <Form fluid onKeyPress={handleKeyPress}>
                <MyInput
                  placeholder="Select Facility"
                  width="100%"
                  fieldType="select"
                  fieldLabel="Facility"
                  selectData={facilityListResponse ?? []}
                  selectDataLabel="name"
                  selectDataValue="id"
                  fieldName="orgKey"
                  record={credentials}
                  setRecord={setCredentials}
                  showLabel={false}
                />

                <MyInput

                  width="100%"
                  fieldName="lang"
                  fieldType="select"
                  selectData={langLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  defaultSelectValue={langdefult?.object?.key?.toString() ?? ''}
                  record={{}}
                  setRecord={() => { }}
                  placeholder="Select Language"
                  showLabel={false}
                  searchable={false}
                />


                <MyInput
                  width="100%"
                  placeholder="Enter User Name"
                  fieldLabel="User Name"
                  fieldName="username"
                  record={credentials}
                  setRecord={setCredentials}
                  showLabel={false}
                />

                <Form.Group>
                  <Form.Control
                    placeholder="Enter Password"
                    name="password"
                    type="password"
                    value={credentials.password}
                    onChange={e => setCredentials({ ...credentials, password: e })}
                  />
                </Form.Group>

                <a className="forgot-password">Forgot password?</a>

                <p style={{ color: 'red', marginBottom: 10 }}>{errText}</p>

                <Form.Group>
                  <Button
                    style={{ backgroundColor: 'var(--primary-blue)' }}
                    appearance="primary"
                    onClick={handleLogin}
                    loading={isLoggingIn}
                    className="submit-button"
                  >
                    Sign in
                  </Button>
                </Form.Group>
              </Form>
            </Panel>
          )}
        </div>

        {/* Modal for Password Change */}
        <Modal backdrop="static" role="alertdialog" open={changePasswordView} size="xs">
          <Modal.Body>
            <RemindIcon className="remind-icon" />
            {'New password required!'}
            <Form fluid>
              <Form.Group>
                <Form.ControlLabel>New Password</Form.ControlLabel>
                <Form.Control
                  name="New Password"
                  value={newPassword}
                  onChange={e => setNewPassword(e)}
                />
              </Form.Group>
              <Form.Group>
                <Form.ControlLabel>Password Confirm</Form.ControlLabel>
                <Form.Control
                  name="Password Confirm"
                  value={newPasswordConfirm}
                  onChange={e => setNewPasswordConfirm(e)}
                />
              </Form.Group>
            </Form>
            <p className="error-text"> {errText}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={handleSaveNewPassword} appearance="primary">
              Ok
            </Button>
            <Button appearance="subtle">Cancel</Button>
          </Modal.Footer>
        </Modal>
      </Panel>
    </Panel>
  );
};

export default SignIn;
