import React, { useEffect, useRef, useState } from 'react';
import {
  Dropdown,
  Popover,
  Whisper,
  WhisperInstance,
  Stack,
  Badge,
  Avatar,
  IconButton,
  List,
  Button,
  Divider
} from 'rsuite';
import NoticeIcon from '@rsuite/icons/Notice';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { FaGlobe } from 'react-icons/fa6';
import { useLogoutMutation } from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { useChangeLangMutation } from '@/services/uiService';
import ChangePassword from './ChangePassword';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { openChangePassword, closeChangePassword, openEditProfile, closeEditProfile } from '@/utils/uiReducerActions';
import EditProfile from './EditProfile';
import RegistrationWizard from '@/pages/patient/facility-patient-list/RegistrationWizard';
import authSlice from '@/reducers/authSlice';
import ArrowDownLineIcon from '@rsuite/icons/ArrowDownLine';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
const Header = ({ expand, setExpand }) => {
  const dispatch = useDispatch();

  const showChangePassword = useSelector((state: RootState) => state.ui.showChangePassword);
  const handleCloseChangePassword = () => {
    dispatch(closeChangePassword());
  };

  const showEditProfile = useSelector((state: RootState) => state.ui.showEditProfile);
  const handleCloseEditProfile = () => {
    dispatch(closeEditProfile());
  };

  const authSlice = useAppSelector(state => state.auth);

  const renderAdminSpeaker = ({ onClose, left, top, className, open }: any, ref) => {

    const dispatch = useDispatch();

    const handleOpenChangePassword = () => {
      dispatch(openChangePassword());
    };
    const handleOpenShowEditProfile = () => {
      dispatch(openEditProfile());
    };




    const [logout, { isLoading: isLoggingOut, data: logoutResult, error: logoutError }] =
      useLogoutMutation();
    const navigate = useNavigate();

    const handleSelect = eventKey => {
      onClose();
      console.log(eventKey);
    };

    const handleLogout = () => {
      logout('').unwrap();
       dispatch(setPageCode(''));
       dispatch(setDivContent("  "));
    };

    useEffect(() => {
      if (logoutResult && !isLoggingOut && !authSlice.user) {
        navigate('/login');
      }
    }, [isLoggingOut, authSlice.user]);


    const handlePasswordChange = (newPassword) => {
      console.log('Password changed to:', newPassword);
    };


    return (
      <div>

        <Popover ref={ref} className={className} style={{ left, top }} full>
          <Dropdown.Menu onSelect={handleSelect}>
            <Dropdown.Item panel style={{ padding: 10, width: 160 }}>
              <p>Signed in as</p>
              <strong>{authSlice.user?.fullName}</strong>
            </Dropdown.Item>
            <Dropdown.Item panel style={{ padding: 10, width: 160 }}>
              <p>Job Role</p>
              <strong>{authSlice.user?.jobRoleLvalue?.lovDisplayVale}</strong>
            </Dropdown.Item>
            <Dropdown.Item divider />
            <Dropdown.Item onSelect={handleOpenShowEditProfile}>Edit Profile</Dropdown.Item>
            <Dropdown.Item eventKey="change-password" onSelect={handleOpenChangePassword}>
              Change Password
            </Dropdown.Item>
            <Dropdown.Item divider />
            <Dropdown.Item onClick={handleLogout}>Sign out</Dropdown.Item>
          </Dropdown.Menu>

        </Popover>


      </div>

    );
  };

  const renderNoticeSpeaker = ({ onClose, left, top, className }: any, ref) => {
    const notifications = [
      ['7 hours ago', 'Demo notification 1.'],
      ['13 hours ago', 'Demo notification 2.']
    ];

    return (
      <Popover ref={ref} className={className} style={{ left, top, width: 300 }} title="Last updates">
        <List>
          {notifications.map((item, index) => {
            const [time, content] = item;
            return (
              <List.Item key={index}>
                <Stack spacing={4}>
                  <Badge /> <span style={{ color: '#57606a' }}>{time}</span>
                </Stack>

                <p>{content}</p>
              </List.Item>
            );
          })}
        </List>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Button onClick={onClose}>More notifications</Button>
        </div>
      </Popover>
    );
  };

  const renderLangSpeaker = ({ onClose, left, top, className }: any, ref) => {
    const uiSlice = useAppSelector(state => state.ui);

    const [
      changeLang,
      { isLoading: isChangingLang, data: changeLangResult, error: changeLangError }
    ] = useChangeLangMutation();

    const handleChangeLang = lang => {
      changeLang(lang).unwrap();
    };

    const handleSelect = eventKey => {
      onClose();
      console.log(eventKey);
    };

    return (
      <Popover ref={ref} className={className} style={{ left, top }} full>
        <Dropdown.Menu onSelect={handleSelect}>
          <Dropdown.Item divider />
          <Dropdown.Item
            active={uiSlice.lang === 'en'}
            onClick={() => {
              handleChangeLang('en');
            }}
          >
            English
          </Dropdown.Item>
          <Dropdown.Item divider />
          <Dropdown.Item
            active={uiSlice.lang === 'ar'}
            onClick={() => {
              handleChangeLang('ar');
            }}
          >
            العربية
          </Dropdown.Item>
        </Dropdown.Menu>
      </Popover>
    );
  };


  const trigger = useRef<WhisperInstance>(null);
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const pageCode = useSelector((state: RootState) => state.div?.pageCode);
  return (
    <div>
      <Stack  className={`header ${expand ? "expand" : ""}`} spacing={8}>
        <div dangerouslySetInnerHTML={{ __html: divElement }} />
        <div className="headerItem" >
          {pageCode === 'P_Facility' ? <RegistrationWizard /> : <></>}

          <Whisper placement="bottomEnd" trigger="click" ref={trigger} speaker={renderLangSpeaker}>
            <IconButton icon={<FaGlobe style={{ fontSize: 20 }} />} />
          </Whisper>

          <Whisper placement="bottomEnd" trigger="click" ref={trigger} speaker={renderNoticeSpeaker}>
            <IconButton
              icon={
                <Badge content={2}>
                  <NoticeIcon style={{ fontSize: 20 }} />
                </Badge>
              }
            />
          </Whisper>
          <Divider style={{ height: "31px", fontSize: "4px" }} vertical />

          <Whisper  placement="bottomEnd" trigger="click" ref={trigger} speaker={renderAdminSpeaker}>
            <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <Avatar
                size="md"
                circle
                src="https://avatars.githubusercontent.com/u/1203827"
                alt="@simonguo"
               />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "start", marginLeft: 8 }}>
                <span style={{ fontWeight: "bold", fontSize: "14px" }}>
                  {authSlice.user?.fullName}
                </span>
                <span style={{ color: "#9E9E9E", fontSize: "12px" }}>
                  {authSlice.user?.jobRoleLvalue?.lovDisplayVale}
                </span>
              </div>
              <ArrowDownLineIcon style={{ marginLeft: 8 }} />
            </div>
          </Whisper>

        </div>
      </Stack>

      <ChangePassword
        open={showChangePassword}
        onClose={handleCloseChangePassword}
      />
      <EditProfile
        open={showEditProfile}
        onClose={handleCloseEditProfile}
      />
    </div>

  );
};

export default Header;