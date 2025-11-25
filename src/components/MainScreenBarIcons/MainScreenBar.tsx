import {
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
import { useDispatch } from 'react-redux';
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
import { openChangePassword, openEditProfile, notify } from '@/utils/uiReducerActions';
import { useLogoutMutation } from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { setUser, setSelectedDepartment } from '@/reducers/authSlice';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppSelector } from '@/hooks';
import { useChangeLangMutation } from '@/services/uiService';
import { setLang, setMode } from '@/reducers/uiSlice';
import { faHospital } from '@fortawesome/free-solid-svg-icons';
import { useGetAllLanguagesQuery } from '@/services/setup/languageService';
import { formatEnumString, conjureValueBasedOnIDFromList } from '@/utils';
import {
  useGetActiveUserDepartmentsByUserQuery,
  useGetDefaultUserDepartmentByUserQuery
} from '@/services/security/userDepartmentsService';
import { UserDepartment } from '@/types/model-types-new';
import { useGetDepartmentsQuery } from '@/services/security/departmentService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';

const MainScreenBar = ({ setExpandNotes, displaySearch, setDisplaySearch }) => {
  const dispatch = useDispatch();
  const mode = useAppSelector(state => state.ui.mode);
  const trigger = useRef<WhisperInstance>(null);
  const authSlice = useAppSelector(state => state.auth);
  const toast = useCallback(
    (msg: string) => {
      dispatch(
        notify({
          msg,
          sev: 'warning'
        })
      );
    },
    [dispatch]
  );
  const { data: departmentsResponse } = useGetDepartmentsQuery({ page: 0, size: 10000 });
  const departments = departmentsResponse?.data ?? [];
  const { data: facilitiesResponse } = useGetAllFacilitiesQuery({});
  const facilities = Array.isArray(facilitiesResponse) ? facilitiesResponse : [];
  const [showChatModal, setShowChatModal] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth); // window width
  const [openMoreMenu, setOpenMoreMenu] = useState<boolean>(false);
  const { data: langData } = useGetAllLanguagesQuery({});
  const navigate = useNavigate();
  const userId = authSlice.user?.id;
  type UserDepartmentWithNames = UserDepartment & {
    departmentName?: string | null;
    facilityName?: string | null;
  };
  const selectedDepartment = authSlice.selectedDepartment;
  const hasWarnedNoDepartmentRef = useRef(false);
  const {
    data: activeDepartmentsResponse,
    isLoading: isLoadingDepartments
  } = useGetActiveUserDepartmentsByUserQuery(userId as number, {
    skip: !userId
  });
  const activeDepartments = (activeDepartmentsResponse ?? []) as UserDepartmentWithNames[];
  const storedDepartmentMatch =
    selectedDepartment &&
    activeDepartments.find(
      dept =>
        dept?.departmentId === selectedDepartment.departmentId &&
        dept?.facilityId === selectedDepartment.facilityId
    );
  const defaultDepartmentLocal = activeDepartments.find(dept => dept?.isDefault) ?? null;
  const shouldFetchDefault = !defaultDepartmentLocal && Boolean(userId);

  const { data: defaultDepartmentResponse } = useGetDefaultUserDepartmentByUserQuery(
    userId as number,
    {
      skip: !shouldFetchDefault
    }
  );

  const defaultDepartment = (defaultDepartmentResponse ?? null) as
    | UserDepartmentWithNames
    | null;
  const defaultDepartmentEntity = defaultDepartmentLocal ?? defaultDepartment ?? null;
  const selectedDepartmentEffective =
    storedDepartmentMatch ??
    defaultDepartmentEntity ??
    (activeDepartments.length > 0 ? activeDepartments[0] : null);

  const resolveFacilityName = (facilityId?: string | number | null) => {
    if (facilityId != null) {
      const resolved =
        conjureValueBasedOnIDFromList(facilities as any[], facilityId, 'name') ??
        (facilityId ? `Facility #${facilityId}` : undefined);
      if (resolved) {
        return resolved;
      }
    }
    const tenantFacility = authSlice?.tenant?.selectedFacility;
    return tenantFacility?.name ?? tenantFacility?.facilityName ?? undefined;
  };

  const resolveDepartmentName = (departmentId?: string | number | null) => {
    if (departmentId == null) return undefined;
    const resolved =
      conjureValueBasedOnIDFromList(departments as any[], departmentId, 'name') ??
      (departmentId ? `Department #${departmentId}` : undefined);
    return resolved;
  };

  useEffect(() => {
    if (activeDepartments.length === 0 && !isLoadingDepartments && !selectedDepartment) {
      if (!hasWarnedNoDepartmentRef.current) {
        toast(
          'No departments are assigned to your user. Please contact the administrator to configure departments.'
        );
        hasWarnedNoDepartmentRef.current = true;
      }
      return;
    }
    if (!selectedDepartmentEffective) {
      return;
    }
    const resolvedDepartmentName = resolveDepartmentName(selectedDepartmentEffective.departmentId);
    const resolvedFacilityName = resolveFacilityName(selectedDepartmentEffective.facilityId);
    if (
      !selectedDepartment ||
      selectedDepartment?.departmentId !== selectedDepartmentEffective.departmentId ||
      selectedDepartment?.facilityId !== selectedDepartmentEffective.facilityId ||
      selectedDepartment?.departmentName !== resolvedDepartmentName ||
      selectedDepartment?.facilityName !== resolvedFacilityName
    ) {
      dispatch(
        setSelectedDepartment({
          departmentId: selectedDepartmentEffective.departmentId,
          facilityId: selectedDepartmentEffective.facilityId,
          departmentName: resolvedDepartmentName,
          facilityName: resolvedFacilityName
        })
      );
    }
  }, [
    selectedDepartment,
    selectedDepartmentEffective,
    activeDepartments,
    departments,
    facilities,
    isLoadingDepartments,
    dispatch,
    toast
  ]);

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
 const uiSlice = useAppSelector(state => state.ui);
  const renderLangSpeaker = ({ onClose, left, top, className }: any, ref) => {
    // const uiSlice = useAppSelector(state => state.ui);

    const [
      changeLang,
      { isLoading: isChangingLang, data: changeLangResult, error: changeLangError }
    ] = useChangeLangMutation();

    const handleChangeLang = lang => {
      changeLang(lang).unwrap();
    };

    const handleSelect = eventKey => {
      onClose();
    };

    return (
      <Popover ref={ref} className={className} style={{ left, top }} full>
        <Dropdown.Menu onSelect={handleSelect}>
          <Dropdown.Item divider />
          {langData?.map(lang => (
            <>
            <Dropdown.Item
              key={lang.langKey}
              active={uiSlice?.lang === lang?.langKey} 
              onClick={() => dispatch(setLang(lang?.langKey))}
            >
              {lang.langName}
            </Dropdown.Item>
            <Dropdown.Item divider />
            </>
          ))}
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

    return (
      <Popover ref={ref} className={className} style={{ left, top }} full>
        <Dropdown.Menu onSelect={handleSelect}>
          <Dropdown.Item panel style={{ padding: 10, width: 200 }}>
            <p>Signed in as</p>
            <strong>{authSlice.user?.firstName}-{authSlice.user?.lastName}</strong>
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
          <Dropdown.Item onClick={handleLogout}>Sign out</Dropdown.Item>
        </Dropdown.Menu>
      </Popover>
    );
  };

  const renderDepartmentsSpeaker = ({ onClose, left, top, className }: any, ref) => (
    <Popover ref={ref} className={className} style={{ left, top, width: 320 }} full>
      <div
        style={{
          padding: '8px 12px',
          fontWeight: 600,
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}
      >
        <span>My Departments</span>
        {(selectedDepartment?.facilityName ||
          authSlice?.tenant?.selectedFacility?.name ||
          authSlice?.tenant?.selectedFacility?.facilityName) && (
          <span style={{ fontSize: '12px', color: '#6c757d' }}>
            {selectedDepartment?.facilityName ??
              authSlice?.tenant?.selectedFacility?.name ??
              authSlice?.tenant?.selectedFacility?.facilityName}
          </span>
        )}
      </div>
      <Divider style={{ margin: 0 }} />
      {isLoadingDepartments ? (
        <div style={{ padding: '12px' }}>Loading departments…</div>
      ) : activeDepartments.length === 0 ? (
        <div style={{ padding: '12px' }}>No active departments found.</div>
      ) : (
        <List bordered style={{ maxHeight: 240, overflowY: 'auto', margin: '8px 12px' }}>
          {activeDepartments.map(dept => {
            const isDefault =
              defaultDepartmentEntity?.id != null
                ? defaultDepartmentEntity.id === dept.id
                : defaultDepartmentEntity?.departmentId === dept.departmentId &&
                  defaultDepartmentEntity?.facilityId === dept.facilityId;
            const isActive =
              selectedDepartment?.departmentId === dept.departmentId &&
              selectedDepartment?.facilityId === dept.facilityId;
            return (
              <List.Item key={dept.id ?? `${dept.userId}-${dept.departmentId}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      style={{
                        fontWeight: 600,
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onClick={() => {
                        const resolvedDepartmentName = resolveDepartmentName(dept.departmentId);
                        const resolvedFacilityName = resolveFacilityName(dept.facilityId);
                        dispatch(
                          setSelectedDepartment({
                            departmentId: dept.departmentId,
                            facilityId: dept.facilityId,
                            departmentName: resolvedDepartmentName,
                            facilityName: resolvedFacilityName
                          })
                        );
                        window.location.reload();
                        onClose?.();
                      }}
                    >
                      {resolveDepartmentName(dept.departmentId)}
                    </button>
                    {isActive && (
                      <span
                        style={{
                          fontSize: '11px',
                          background: '#facc15',
                          color: '#1f2937',
                          padding: '1px 6px',
                          borderRadius: 999
                        }}
                      >
                        Current
                      </span>
                    )}
                    {isDefault && (
                      <span
                        style={{
                          fontSize: '11px',
                          background: 'var(--deep-blue)',
                          color: 'var(--white)',
                          padding: '1px 6px',
                          borderRadius: 999
                        }}
                      >
                        Default
                      </span>
                    )}
                  </div>
                  {/* Facility name intentionally omitted here; shown under My Departments header */}
                </div>
              </List.Item>
            );
          })}
        </List>
      )}
    </Popover>
  );

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
            <Whisper placement="bottomEnd" trigger="click" speaker={renderDepartmentsSpeaker}>
              <span>
                <Tooltip title="Switch Department">
                  <IconButton size="small">
                    <FontAwesomeIcon className="header-screen-bar-icon-size-handle" icon={faRepeat} />
                  </IconButton>
                </Tooltip>
              </span>
            </Whisper>
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
        size="70vw"
        bodyheight="78vh"
        content={<MyAppointmentScreen />}
        hideBack={true}
        actionButtonLabel="Save"
      />
    </>
  );
};

export default MainScreenBar;
