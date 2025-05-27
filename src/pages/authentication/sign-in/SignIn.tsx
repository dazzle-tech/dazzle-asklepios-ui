import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppSelector } from '@/hooks';
import { useLoginMutation } from '@/services/authService';
import { useGetFacilitiesQuery, useGetLovValuesByCodeQuery, useSaveUserMutation, useGetLovDefultByCodeQuery } from '@/services/setupService';
import { ApUser } from '@/types/model-types';
import { newApUser } from '@/types/model-types-constructor';
import { initialListRequest } from '@/types/types';
import RemindIcon from '@rsuite/icons/legacy/Remind';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Form,
  Message,
  Modal,
  Panel,
  SelectPicker,
  Text
} from 'rsuite';
import Background from '../../../images/auth-bg.png';
import Logo from '../../../images/Logo_BLUE_New.svg';
import './styles.less';

const SignIn = () => {
  const [login, { isLoading: isLoggingIn, data: loginResult, error: loginError }] =
    useLoginMutation();
  const authSlice = useAppSelector(state => state.auth);
  const [otpView, setOtpView] = useState(false);
  const [changePasswordView, setChangePasswordView] = useState(false);
  const [newPassword, setNewPassword] = useState();
  const [newPasswordConfirm, setNewPasswordConfirm] = useState();
  const [errText, setErrText] = useState(' ');
  const [resetPasswordView, setResetPasswordView] = useState(false);

  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    orgKey: ''
  });
  const navigate = useNavigate();
  const [saveUser, saveUserMutation] = useSaveUserMutation();

  const {
    data: facilityListResponse,
    isLoading: isGettingFacilities,
    isFetching: isFetchingFacilities
  } = useGetFacilitiesQuery({ ...initialListRequest });
  const { data: langLovQueryResponse } = useGetLovValuesByCodeQuery('SYSTEM_LANG');
  const {data:langDefult}= useGetLovDefultByCodeQuery('SYSTEM_LANG');
  
  const handleLogin = () => {
    login(credentials).unwrap();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default form submission behavior
      handleLogin();
    }
  };

  useEffect(() => {
    // if there is a user, navigate to dashboard
    if (
      authSlice.user &&
      localStorage.getItem('access_token') &&
      !authSlice.user?.mustChangePassword
    ) {
      navigate('/');
    } else if (
      authSlice.user &&
      localStorage.getItem('access_token') &&
      authSlice.user?.mustChangePassword
    ) {
      console.log(authSlice.user?.mustChangePassword);
      setChangePasswordView(true);
    }
  }, [authSlice.user]);

  useEffect(() => {
    console.log(changePasswordView);
  }, [changePasswordView]);

  const [user, setUser] = useState<ApUser>({
    ...newApUser
  });

  const resetUserPasswordModal = () => {
    return <h3>test</h3>;
  };

  useEffect(() => {
    setErrText(' ');
  }, [newPassword, newPasswordConfirm]);

  const handleSaveNewPassword = () => {
    if (changePasswordView) {
      if (!newPassword || newPassword === '') {
        setErrText('Please ensure both fields are filled.');
      } else {
        if (newPassword === newPasswordConfirm) {
          console.log('Passwords  Matched');
          saveUser({ ...authSlice?.user, password: newPassword, mustChangePassword: false })
            .unwrap()
            .then(() => {
              navigate('/');
            });
        } else setErrText('Please ensure both fields have the same password.');
      }
    }
  };

  // useEffect(() => {
  //   document.body.style.backgroundImage = `url(${Background})`;
  //   document.body.style.backgroundSize = 'cover';
  //   document.body.style.backgroundPosition = 'center';
  //   document.body.style.backgroundRepeat = 'no-repeat';

  //   return () => {
  //     document.body.style.backgroundImage = '';
  //   };
  // }, [Background]);
  return (
    <Panel className="panel" style={{ backgroundImage: `url(${Background})` }}>
    <Panel bordered  style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' ,padding: '20px', borderRadius: '10px'}}>
      <div className="bodySignInDiv">
        {/* Logo Panel */}
     
        <Panel className="logo-panel">
          <img
            src={
              authSlice.tenant && authSlice.tenant.tenantLogoPath
                ? authSlice.tenant.tenantLogoPath
                : Logo
            }
            alt="Tenant Logo"
          />
        </Panel>

        {/* Sign In Panel */}
        {!resetPasswordView && (
          <Panel className="sign-in-panel ">
          
            {!authSlice.tenant && (
              <Message type="warning" showIcon>
                <Translate>No Tenant Configured</Translate>
              </Message>
            )}

            <Form fluid onKeyPress={handleKeyPress}>
              <MyInput
                disabled={!authSlice.tenant}
                placeholder="Select Facility"
                width="100%"
                fieldType='select'
                fieldLabel="Facility"
                selectData={facilityListResponse?.object ?? []}
                selectDataLabel="facilityName"
                selectDataValue="key"
                fieldName="orgKey"
                record={credentials}
                setRecord={setCredentials} 
                 showLabel={false}/>
              <MyInput
                width="100%"
                fieldName="lang"
                fieldType="select"
                selectData={langLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                defaultSelectValue={langDefult?.data?.object?.key}
                record={{}}
                setRecord={() => { }}
                placeholder="Select Language"
                showLabel={false}
               
              />
              <MyInput
                width="100%"
                placeholder="Enter User Name"
                disabled={!authSlice.tenant}
                fieldLabel="User Name"
                fieldName="username"
                record={credentials}
                setRecord={setCredentials}
                 showLabel={false}
              />


              <Form.Group>
              
                <Form.Control
                placeholder='Enter Password'
                  disabled={!authSlice.tenant}
                  name="password"
                  type="password"
                  value={credentials.password}
                  onChange={e => setCredentials({ ...credentials, password: e })}
                />
              </Form.Group>
              <a className="forgot-password">Forgot password?</a>

              <Form.Group>
                <Button
                  style={{ backgroundColor: 'var(--primary-blue)' }}
                  appearance="primary"
                  onClick={handleLogin}
                  disabled={!authSlice.tenant}
                  className="submit-button"
                >
                  Sign in
                </Button>
              </Form.Group>
            </Form>
          </Panel>
        )}
      </div>

      {/* Reset Password Panel */}
      {resetPasswordView && (
        <Panel bordered className="reset-password-panel" header={<h3>Sign In</h3>}>
          <Form fluid>
            <Form.Group>
              <Form.ControlLabel>Organization</Form.ControlLabel>
              <Form.Control
                block
                accepter={SelectPicker}
                name="organization"
                data={organizations}
                value={credentials.orgKey}
                onChange={e => setCredentials({ ...credentials, orgKey: e })}
              />
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>Username</Form.ControlLabel>
              <Form.Control
                name="username"
                value={credentials.username}
                onChange={e => setCredentials({ ...credentials, username: e })}
              />
            </Form.Group>

            <Form.Group>
              <Button appearance="primary" onClick={handleLogin}>
                Send OTP
              </Button>
            </Form.Group>
          </Form>
        </Panel>
      )}

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
    </Panel></Panel>
  );
};

export default SignIn;
