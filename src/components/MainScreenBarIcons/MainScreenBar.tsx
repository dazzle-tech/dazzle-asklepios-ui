import {
  faBookmark,
  faBullhorn,
  faCalendarDays,
  faChartColumn,
  faCommentDots,
  faHeadset,
  faNoteSticky,
  faRepeat
} from '@fortawesome/free-solid-svg-icons';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import { faMoon } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Close as CloseIcon } from '@mui/icons-material';
import { Dialog, DialogContent, DialogTitle, IconButton, Tooltip, Typography } from '@mui/material';
import ArrowDownLineIcon from '@rsuite/icons/ArrowDownLine';
import NoticeIcon from '@rsuite/icons/Notice';
import { FaEarthAmericas } from 'react-icons/fa6';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ChatScreen from '../ChatScreen/ChatScreen';
import './style.less';
import MyAppointmentScreen from '../MyAppointmentScreen/MyAppointmentScreen';
import MyModal from '../MyModal/MyModal';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import {
  Avatar,
  Badge,
  Button,
  Divider,
  Dropdown,
  List,
  Popover,
  Stack,
  Whisper,
  WhisperInstance
} from 'rsuite';
import { openChangePassword, openEditProfile } from '@/utils/uiReducerActions';
import { useLogoutMutation } from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { setUser } from '@/reducers/authSlice';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppSelector } from '@/hooks';
import { useChangeLangMutation } from '@/services/uiService';
import { setMode } from '@/reducers/uiSlice';
import { faHospital } from "@fortawesome/free-solid-svg-icons";

const MainScreenBar = ({ setExpandNotes, displaySearch, setDisplaySearch }) => {
  const dispatch = useDispatch();
  const mode = useSelector(state => state.ui.mode);
  const trigger = useRef<WhisperInstance>(null);
  const authSlice = useAppSelector(state => state.auth);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth); // window width
  const [openMoreMenu, setOpenMoreMenu] = useState<boolean>(false);
  const navigate = useNavigate();

  // container to choose action from more menu
  const contentOfMoreIconMenu = (
    <Popover full>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faChartColumn} />
            Customize Dashboard
          </div>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => {
            setOpenMoreMenu(false);
            setShowChatModal(true);
          }}
        >
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faCommentDots} />
            Secure Messaging
          </div>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => {
            setOpenMoreMenu(false);
            setShowAppointmentsModal(true);
          }}
        >
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faCalendarDays} />
            My Appointments
          </div>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faBookmark} />
            Bookmarks
          </div>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faBullhorn} />
            Announcements
          </div>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faHeadset} />
            Help & Support
          </div>
        </Dropdown.Item>

        {/* الخيار الجديد للبوابة */}
        <Dropdown.Item
          onClick={() => {
            setOpenMoreMenu(false);
            navigate("/incident-portal");
          }}
        >
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle text-blue-600" icon={faHospital} />
            MedCare Incident Portal
          </div>
        </Dropdown.Item>

        {width < 600 && (
          <Dropdown.Item
            onClick={() => {
              setOpenMoreMenu(false);
              if (mode === 'light') {
                dispatch(setMode('dark'));
              } else {
                dispatch(setMode('light'));
              }
            }}
          >
            <div className="container-of-icon-and-key1">
              <FontAwesomeIcon
                className="header-screen-bar-icon-size-handle"
                icon={mode === 'dark' ? faSun : faMoon}
              />
              <span>{mode === 'light' ? 'Switch to Dark mode' : 'Switch to Light mode'}</span>
            </div>
          </Dropdown.Item>
        )}
      </Dropdown.Menu>
    </Popover>
  );

  const renderNoticeSpeaker = ({ onClose, left, top, className }: any, ref) => {
    const notifications = [
      ['7 hours ago', 'Demo notification 1.'],
      ['13 hours ago', 'Demo notification 2.']
    ];

    return (
      <Popover
        ref={ref}
        className={className}
        style={{ left, top, width: 300 }}
        title="Last updates"
      >
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
            active={uiSlice.lang === 'SYS_LANG_ENG'}
            onClick={() => {
              handleChangeLang('SYS_LANG_ENG');
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
      dispatch(setUser(null));
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));

      localStorage.clear();

      navigate('/login');
    };

    useEffect(() => {
      if (logoutResult && !isLoggingOut && !authSlice.user) {
        navigate('/login');
      }
    }, [isLoggingOut, authSlice.user]);

    const handlePasswordChange = newPassword => {
      console.log('Password changed to:', newPassword);
    };

    return (
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
    );
  };

  const closeMenus = useCallback(() => {
    setOpenMoreMenu(false);
  }, []);

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <div className={`main-screen-bar-icons-main-container-header ${mode}`}>
        {width >= 930 ? (
          <>
            <Tooltip title="Customize Dashboard">
              <IconButton size="small">
                <FontAwesomeIcon
                  className="header-screen-bar-icon-size-handle"
                  icon={faChartColumn}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Secure Messaging">
              <IconButton size="small" onClick={() => setShowChatModal(true)}>
                <FontAwesomeIcon
                  className="header-screen-bar-icon-size-handle"
                  icon={faCommentDots}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="My Appointments">
              <IconButton size="small" onClick={() => setShowAppointmentsModal(true)}>
                <FontAwesomeIcon
                  className="header-screen-bar-icon-size-handle"
                  icon={faCalendarDays}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Bookmarks">
              <IconButton size="small">
                <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faBookmark} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Announcements">
              <IconButton size="small">
                <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faBullhorn} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Help & Support">
              <IconButton size="small">
                <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faHeadset} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sticky Notes">
              <IconButton size="small" onClick={() => setExpandNotes(true)}>
                <FontAwesomeIcon
                  className="header-screen-bar-icon-size-handle"
                  icon={faNoteSticky}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="MedCare Incident Portal">
              <IconButton
                size="small"
                onClick={() => {
                  navigate("/incident-portal");
                }}
              >
                <FontAwesomeIcon
                  className="header-screen-bar-icon-size-handle"

                  icon={faHospital}
                />
              </IconButton>
            </Tooltip>

          </>
        ) : (
          <>
            <Whisper
              open={openMoreMenu}
              onClose={() => setOpenMoreMenu(false)}
              placement="bottom"
              speaker={contentOfMoreIconMenu}
              trigger="click"
            >
              <span>
                <FontAwesomeIcon
                  icon={faEllipsisVertical}
                  style={{ fontSize: '20px' }}
                  onClick={() => setOpenMoreMenu(true)}
                />
              </span>
            </Whisper>
            {openMoreMenu && (
              <div
                onClick={closeMenus}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 1
                }}
              />
            )}
          </>
        )}
        {(width > 500 || !displaySearch) && (
          <>
            <Tooltip title="Switch Department">
              <IconButton size="small">
                <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faRepeat} />
              </IconButton>
            </Tooltip>
            <Whisper placement="bottomEnd" trigger="click" ref={trigger} speaker={renderLangSpeaker}>
              <IconButton size="small">
                <FaEarthAmericas size={20} color={mode === 'light' ? '#333' : 'var(--white)'} />
              </IconButton>
            </Whisper>
            <Whisper placement="bottomEnd" trigger="click" ref={trigger} speaker={renderNoticeSpeaker}>
              <IconButton size="small">
                <NoticeIcon
                  style={{ fontSize: 20 }}
                  color={mode === 'light' ? '#333' : 'var(--white)'}
                />
              </IconButton>
            </Whisper>
            <Divider style={{ height: '31px', fontSize: '4px' }} vertical />
            <Whisper placement="bottomEnd" trigger="click" ref={trigger} speaker={renderAdminSpeaker}>
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <Avatar
                  size="md"
                  circle
                  src="https://avatars.githubusercontent.com/u/1203827"
                  alt="@simonguo"
                />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'start',
                    marginLeft: 8
                  }}
                >
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}></span>
                  <span style={{ color: '#9E9E9E', fontSize: '12px' }}></span>
                </div>
                <ArrowDownLineIcon style={{ marginLeft: 8 }} />
              </div>
            </Whisper>
          </>
        )}
      </div>

      {/* Chat Screen Modal */}
      <Dialog
        open={showChatModal}
        onClose={() => setShowChatModal(false)}
        maxWidth="lg"
        fullWidth
        classes={{ paper: 'chat-modal-paper' }}
      >
        <DialogTitle className="chat-modal-title">
          <div className="chat-modal-title-inner">
            <Typography variant="h6">Secure Messaging</Typography>
            <IconButton onClick={() => setShowChatModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent className="chat-modal-content">
          <ChatScreen />
        </DialogContent>
      </Dialog>

      <MyModal
        open={showAppointmentsModal}
        setOpen={setShowAppointmentsModal}
        title="My Appointments"
        size="90vw"
        bodyheight="83vh"
        content={<MyAppointmentScreen />}
        hideBack={true}
        actionButtonLabel="Save"
      />
    </>
  );
};

export default MainScreenBar;
