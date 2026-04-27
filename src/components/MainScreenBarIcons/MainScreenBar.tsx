import {
  faBullhorn,
  faChartColumn,
  faFileLines,
  faHeadset,
  faHospital,
  faNoteSticky,
  faRepeat,
  faUserDoctor,
  faSun,
  faMoon,
  faEllipsisVertical
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ArrowDownLineIcon from '@rsuite/icons/ArrowDownLine';
import NoticeIcon from '@rsuite/icons/Notice';
import { FaEarthAmericas } from 'react-icons/fa6';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import './style.less';
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
import { logout } from '@/reducers/authSlice';
import { useAppSelector } from '@/hooks';
import { useGetAllLanguagesQuery } from '@/services/setup/languageService';
import { formatEnumString } from '@/utils';
import { setLang, setMode } from '@/reducers/uiSlice';
import { Tooltip, IconButton } from '@mui/material';
import DepartmentSwitcher from '../DepartmentSwitcher/DepartmentSwitcher';
const MainScreenBar = ({ setExpandNotes, displaySearch, setDisplaySearch, expandNotes }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const mode = useAppSelector(state => state.ui.mode);
  const uiSlice = useAppSelector(state => state.ui);
  const authSlice = useAppSelector(state => state.auth);

  const trigger = useRef<WhisperInstance>(null);
  const direction = localStorage.getItem('direction');

  // const [apiLogout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openMoreMenu, setOpenMoreMenu] = useState<boolean>(false);
  const authAlice = useAppSelector(state => state.auth);
  const selectedDepartment = authAlice.selectedDepartment;

  const { data: langData } = useGetAllLanguagesQuery({});

  const closeMenus = useCallback(() => {
    setOpenMoreMenu(false);
  }, []);

  const handleLogout = async () => {
    try {
      // await apiLogout({}).unwrap();
    } catch (e) { }

    dispatch(logout());
    localStorage.setItem('logout_event', Date.now().toString());
    navigate('/login', { replace: true });
  };

  const contentOfMoreIconMenu = (
    <Popover full>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faFileLines} />
            Customize Form
          </div>
        </Dropdown.Item>

        <Dropdown.Item onClick={() => setOpenMoreMenu(false)}>
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faChartColumn} />
            Customize Dashboard
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

        <Dropdown.Item
          onClick={() => {
            setOpenMoreMenu(false);
            navigate('/incident-portal');
          }}
        >
          <div className="container-of-icon-and-key1">
            <FontAwesomeIcon
              className="header-screen-bar-icon-size-handle text-blue-600"
              icon={faHospital}
            />
            MedCare Incident Portal
          </div>
        </Dropdown.Item>

        {width < 600 && (
          <Dropdown.Item
            onClick={() => {
              setOpenMoreMenu(false);
              dispatch(setMode(mode === 'light' ? 'dark' : 'light'));
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
    const handleSelect = () => {
      onClose();
    };

    return (
      <Popover ref={ref} className={className} style={{ left, top }} full>
        <Dropdown.Menu onSelect={handleSelect}>
          <Dropdown.Item divider />
          {langData?.map(lang => (
            <React.Fragment key={lang.langKey}>
              <Dropdown.Item
                active={uiSlice?.lang === lang?.langKey}
                onClick={() => {
                  dispatch(setLang(lang?.langKey));
                  const selectedObject = langData.find(item => item?.langKey === lang?.langKey);
                  localStorage.setItem('direction', selectedObject?.direction);
                  localStorage.setItem('language', selectedObject?.langKey);
                }}
              >
                {lang.langName}
              </Dropdown.Item>
              <Dropdown.Item divider />
            </React.Fragment>
          ))}
        </Dropdown.Menu>
      </Popover>
    );
  };

  const renderAdminSpeaker = ({ onClose, left, top, className }: any, ref) => {
    const handleOpenChangePassword = () => {
      dispatch(openChangePassword());
    };

    const handleOpenShowEditProfile = () => {
      dispatch(openEditProfile());
    };

    const handleSelect = () => {
      onClose();
    };

    return (
      <Popover ref={ref} className={className} style={{ left, top }} full>
        <Dropdown.Menu onSelect={handleSelect}>
          <Dropdown.Item panel style={{ padding: 10, width: 200 }}>
            <p>Signed in as</p>
            <strong>
              {authSlice.user?.firstName}-{authSlice.user?.lastName}
            </strong>
          </Dropdown.Item>

          <Dropdown.Item panel style={{ padding: 10, width: 160 }}>
            <p>Job Role</p>
            <strong>{formatEnumString(authSlice.user?.jobRole)}</strong>
          </Dropdown.Item>

          <Dropdown.Item divider />
          <Dropdown.Item onSelect={handleOpenShowEditProfile}>Edit Profile</Dropdown.Item>
          <Dropdown.Item eventKey="change-password" onSelect={handleOpenChangePassword}>
            Change Password
          </Dropdown.Item>
          <Dropdown.Item divider />
          <Dropdown.Item onClick={handleLogout}>
            { 'Sign out'}
          </Dropdown.Item>
        </Dropdown.Menu>
      </Popover>
    );
  };

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <div
        className={`main-screen-bar-icons-main-container-header ${mode}`}
        style={{ flexDirection: direction === 'LTR' ? 'row' : 'row-reverse' }}
      >
        {width >= 930 ? (
          <>
            <Tooltip title="Customize Form">
              <IconButton
                size="small"
                onClick={() => {
                  navigate('/form-template-use');
                }}
              >
                <FontAwesomeIcon
                  className="header-screen-bar-icon-size-handle"
                  icon={faFileLines}
                />
              </IconButton>
            </Tooltip>

            <Tooltip title="Customize Dashboard">
              <IconButton size="small">
                <FontAwesomeIcon
                  className="header-screen-bar-icon-size-handle"
                  icon={faChartColumn}
                />
              </IconButton>
            </Tooltip>

            {authSlice.user?.jobRole === 'PHYSICIAN' && (
              <Tooltip title="My Consultations">
                <IconButton
                  size="small"
                  onClick={() => {
                    navigate('/my-consultations');
                  }}
                >
                  <FontAwesomeIcon
                    className="header-screen-bar-icon-size-handle"
                    icon={faUserDoctor}
                  />
                </IconButton>
              </Tooltip>
            )}

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
              <IconButton size="small" onClick={() => setExpandNotes(!expandNotes)}>
                <FontAwesomeIcon
                  className="header-screen-bar-icon-size-handle"
                  icon={faNoteSticky}
                />
              </IconButton>
            </Tooltip>

            <Tooltip title="MedCare Incident Portal" className="hidden">
              <IconButton
                size="small"
                onClick={() => {
                  navigate('/incident-portal');
                }}
              >
                <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faHospital} />
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
            <React.Suspense
              fallback={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tooltip title="Switch Department">
                    <IconButton size="small">
                      <FontAwesomeIcon
                        className="header-screen-bar-icon-size-handle"
                        icon={faRepeat}
                      />
                    </IconButton>
                  </Tooltip>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: direction === 'LTR' ? 'flex-start' : 'flex-end',
                      lineHeight: 1.1
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '12px' }}>
                      {selectedDepartment?.facilityName ?? '-'}
                    </span>
                    <span style={{ color: '#9E9E9E', fontSize: '11px' }}>
                      {selectedDepartment?.departmentName ?? '-'}
                    </span>
                  </div>
                </div>
              }
            >
              <DepartmentSwitcher placement="bottomEnd" reloadOnSelect>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  <Tooltip title="Switch Department">
                    <IconButton size="small">
                      <FontAwesomeIcon
                        className="header-screen-bar-icon-size-handle"
                        icon={faRepeat}
                      />
                    </IconButton>
                  </Tooltip>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: direction === 'LTR' ? 'flex-start' : 'flex-end',
                      lineHeight: 1.1
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '12px' }}>
                      {selectedDepartment?.facilityName ?? '-'}
                    </span>
                    <span style={{ color: '#9E9E9E', fontSize: '11px' }}>
                      {selectedDepartment?.departmentName ?? '-'}
                    </span>
                  </div>
                </div>
              </DepartmentSwitcher>
            </React.Suspense>
            <Whisper
              placement="bottomEnd"
              trigger="click"
              ref={trigger}
              speaker={renderLangSpeaker}
            >
              <IconButton size="small">
                <FaEarthAmericas size={20} color={mode === 'light' ? '#333' : 'var(--white)'} />
              </IconButton>
            </Whisper>

            <Whisper
              placement="bottomEnd"
              trigger="click"
              ref={trigger}
              speaker={renderNoticeSpeaker}
            >
              <IconButton size="small">
                <NoticeIcon
                  style={{ fontSize: 20 }}
                  color={mode === 'light' ? '#333' : 'var(--white)'}
                />
              </IconButton>
            </Whisper>

            <Divider style={{ height: '31px', fontSize: '4px' }} vertical />

            <Whisper
              placement="bottomEnd"
              trigger="click"
              ref={trigger}
              speaker={renderAdminSpeaker}
            >
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
                <ArrowDownLineIcon
                  style={{
                    marginInlineStart: 8,
                    position: 'relative',
                    zIndex: 10
                  }}
                />
              </div>
            </Whisper>
          </>
        )}
      </div>
    </>
  );
};

export default MainScreenBar;