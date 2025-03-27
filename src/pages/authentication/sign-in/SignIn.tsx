import React, { useEffect, useState } from 'react';
import { Form, Button, Panel, SelectPicker, Stack, Divider, Message, Modal, ButtonToolbar } from 'rsuite';
import { useAppDispatch, useAppSelector } from '@/hooks';
import Logo from '../../../images/Logo_BLUE_New.svg';
import Background from '../../../images/medical-equipment-desk-with-copy-space.svg';
import UserLogo from '../../../images/Login_ICon.svg';
import './styles.less';
import Translate from '@/components/Translate';
import { useLoginMutation } from "@/services/authService";
import { useNavigate } from "react-router-dom";
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetFacilitiesQuery } from '@/services/setupService';
import PasswordChangeModal from './PasswordChangeModal';
import RemindIcon from '@rsuite/icons/legacy/Remind';
import MyInput from '@/components/MyInput';
import { ApUser } from '@/types/model-types';
import { newApUser } from '@/types/model-types-constructor';
import {
  useGetUsersQuery,
  useSaveUserMutation,
} from '@/services/setupService';
import { Input, InputGroup } from 'rsuite';
import EyeCloseIcon from '@rsuite/icons/EyeClose';
import VisibleIcon from '@rsuite/icons/Visible';
 
const SignIn = () => {
  const [login, { isLoading: isLoggingIn, data: loginResult, error: loginError }] = useLoginMutation()
  const authSlice = useAppSelector(state => state.auth);
  const [otpView, setOtpView] = useState(false);
  const [changePasswordView, setChangePasswordView] = useState(false);
  const [newPassword, setNewPassword] = useState();
  const [newPasswordConfirm, setNewPasswordConfirm] = useState();
  const [errText, setErrText] = useState(" ")
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
    if (authSlice.user && localStorage.getItem('access_token') && !authSlice.user?.mustChangePassword) {
      navigate('/')
    } else if (authSlice.user && localStorage.getItem('access_token') && authSlice.user?.mustChangePassword) {
      console.log(authSlice.user?.mustChangePassword)
      setChangePasswordView(true)
 
    }
 
  }, [authSlice.user]);
 
  useEffect(() => {
    console.log(changePasswordView)
  }, [changePasswordView])
 
 
  const [user, setUser] = useState<ApUser>({
    ...newApUser
  });
 
 
  const resetUserPasswordModal = () => {
    return (
      <h3>test</h3>
    )
  }
 
  useEffect(() => {
    console.log(newPassword)
    console.log(newPasswordConfirm)
    setErrText(" ")
 
  }, [newPassword, newPasswordConfirm])
 
  const handleSaveNewPassword = () => {
    if (changePasswordView) {
 
      if (!newPassword || newPassword === '') {
        setErrText('Please ensure both fields are filled.')
      } else {
 
        if (newPassword === newPasswordConfirm) {
          console.log('Passwords  Matched')
          saveUser({ ...authSlice?.user, password: newPassword, mustChangePassword: false }).unwrap().then(() => {
            navigate('/')
          })
 
 
        } else (
          setErrText('Please ensure both fields have the same password.')
        )
      }
 
    }
  }
 
  useEffect(() => {

    document.body.style.backgroundImage = `url(${Background})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';

    return () => {
      document.body.style.backgroundImage = ''; 


    };
  }, [Background]); 
  return (
 
    <Panel
      bordered
      className="panel"
    >
    
      <div className='bodySignInDiv'>
 
 
          {/* Logo Panel */}
      <Panel style={{ zoom: 0.86 }} className="logo-panel">
        <img
          src={authSlice.tenant && authSlice.tenant.tenantLogoPath ? authSlice.tenant.tenantLogoPath : Logo}
          alt="Tenant Logo"
        />
      </Panel>
 
      {/* Sign In Panel */}
      {!resetPasswordView && (
        <Panel  bordered className='sign-in-panel '>
 
          <div className='image-header-div'>
            <img
            style={{ zoom: 0.86 }}
              src={UserLogo}
              alt="Header Background"
              className='header-image'
 
            /></div>
 
          <h3 style={{ zoom: 0.82 }}  className='title'>
            Sign In
          </h3>
          {!authSlice.tenant && (
            <Message type="warning" showIcon>
              <Translate>No Tenant Configured</Translate>
            </Message>
          )}
 
          <Form fluid style={{ zoom: 0.85 }} onKeyPress={handleKeyPress}>
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
                onChange={e => setCredentials({ ...credentials, orgKey: e })}
              />
            </Form.Group>
 
            <Form.Group>
              <Form.ControlLabel>Username</Form.ControlLabel>
              <Form.Control
                disabled={!authSlice.tenant}
                name="username"
                value={credentials.username}
                onChange={e => setCredentials({ ...credentials, username: e })}
              />
            </Form.Group>
 
            <Form.Group>
              <Form.ControlLabel>
                <span>Password</span>
                <a className="forgot-password" >Forgot password?</a>
              </Form.ControlLabel>
              <Form.Control
                disabled={!authSlice.tenant}
                name="password"
                type="password"
                value={credentials.password}
                onChange={e => setCredentials({ ...credentials, password: e })}
              />
            </Form.Group>
 
            <Form.Group>
              <Button style={{backgroundColor:'#599ab8'}} appearance="primary" onClick={handleLogin} disabled={!authSlice.tenant}
                className='submit-button' >
                Sign in
              </Button>
            </Form.Group>
          </Form>
        </Panel>
      )}
 
      </div>
   
      {/* Reset Password Panel */}
      {resetPasswordView && (
        <Panel bordered className='reset-password-panel' header={<h3>Sign In</h3>}>
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
          <RemindIcon className='remind-icon' />
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
          <p className='error-text'> {errText}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSaveNewPassword} appearance="primary">Ok</Button>
          <Button appearance="subtle">Cancel</Button>
        </Modal.Footer>
      </Modal>
    </Panel>
 
 
  );
};
 
export default SignIn;