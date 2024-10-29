import React, { useEffect, useState } from 'react';
import { Form, Button, Panel, SelectPicker, Stack, Divider, Message, Modal, ButtonToolbar } from 'rsuite';
import { useAppDispatch, useAppSelector } from '@/hooks';
import Logo from '../../../images/ASK_LOGO_SVG copy.svg';
import Background from '../../../images/ASK_WALLPAPER.svg';
import UserLogo from '../../../images/Login_ICon.svg';
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
      }else  {
             
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

  return (

    <Panel
    bordered
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      height: '100vh',
      borderRadius: '10px',
      padding: '20px',
      position: 'relative',
     
     overflow: 'hidden'
    }}
  >
     <img 
    src={Background}
    alt="Background" 
    style={{
      position: 'absolute', // لجعل الصورة في الخلفية
      top: 0,
      left: 0,
      opacity: 0.6 ,
      width: '100%', // لتغطية العرض بالكامل
      height: '100%', // لتغطية الارتفاع بالكامل
      objectFit: 'cover', // لجعل الصورة تغطي كامل الـ Panel
      zIndex: -1 // لجعل الصورة خلف المحتوى
    }} 
  />
        {/* Logo Panel */}
        <Panel style={{ width: 550 }}>
        <img
          src={authSlice.tenant && authSlice.tenant.tenantLogoPath ? authSlice.tenant.tenantLogoPath : Logo}
          width={400}
          alt="Tenant Logo"
        />
      </Panel>
  
      {/* Sign In Panel */}
      {!resetPasswordView && (
        <Panel bordered style={{    backgroundColor: 'rgba(250, 250, 250, 0.5)', width: 450, padding: 40, borderRadius: '10px'  }}>
        
        <img
    src={UserLogo}
    alt="Header Background"
    style={{
      marginLeft:"98px",
      top: 50, // يمكنك تعديل هذا لتغيير موضع الصورة
      left: 50, // يمكنك تعديل هذا لتغيير موضع الصورة
      width: '127px', // ضبط عرض الصورة
      height: '110px',
     // الحفاظ على نسبة العرض إلى الارتفاع
       // يجب أن تكون الصورة أعلى من المحتوى
    }}
  />
 
  <h3 style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif', zIndex: 2 }}>
    Sign In
  </h3>
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
                <a style={{ float: 'right' }}>Forgot password?</a>
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
              <Button color="cyan" appearance="primary" onClick={handleLogin} disabled={!authSlice.tenant}  style={{ 
      borderRadius: '25px', 
      padding: '15px 20px', // تغيير حجم الزر
      fontSize: '16px',
      width:"100%" // حجم الخط
       // لون الخلفية
    }} >
                Sign in
              </Button>
            </Form.Group>
          </Form>
        </Panel>
      )}
  
      {/* Reset Password Panel */}
      {resetPasswordView && (
        <Panel bordered style={{ background: '#fff', width: 400, padding: 40, borderRadius: '8px' }} header={<h3>Sign In</h3>}>
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
        <RemindIcon style={{ color: '#ffb300', fontSize: 24 }} />
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
        <p style={{ color: "red" }}> {errText}</p>
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
