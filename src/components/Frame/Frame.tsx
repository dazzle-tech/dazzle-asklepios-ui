import React, { useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import {
  Container,
  Content,
  DOMHelper,
  Stack,
  Divider,
  Form,
  Popover,
  Whisper,
  WhisperInstance
} from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHospital } from '@fortawesome/free-solid-svg-icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks';
import Logo from '../../images/Logo_BLUE_New.svg';
import DLogo from '../../images/Logo_Dark.svg';
import { setScreenKey } from '@/utils/uiReducerActions';
import MyInput from '../MyInput';
import './styles.less';
import UserStickyNotes from '../UserStickyNotes/UserStickyNotes';
import Header from '../Header';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// MUI imports
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Toolbar,
  Divider as MuiDivider,
  Box,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MyButton from '../MyButton/MyButton';
import { setSelectedDepartment } from '@/reducers/authSlice';
import { useGetDepartmentsQuery } from '@/services/security/departmentService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import {
  useGetActiveUserDepartmentsByUserQuery,
  useGetDefaultUserDepartmentByUserQuery
} from '@/services/security/userDepartmentsService';
import { conjureValueBasedOnIDFromList } from '@/utils';
import { UserDepartment } from '@/types/model-types-new';

const { getHeight, on } = DOMHelper;

// Navigation item interface
export interface NavItemData {
  eventKey: string;
  title: string;
  icon?: any;
  to?: string;
  target?: string;
  children?: NavItemData[];
}

// Frame props interface
export interface FrameProps {
  navs: NavItemData[];
  children?: React.ReactNode;
  mode: string;
}
// open drawer width
const drawerWidth = 240;
// closed drawer width
const collapsedWidth = 60;

const Frame = (props: FrameProps) => {
  const { navs, mode } = props;

  // State variables
  const [expand, setExpand] = useState(false); // sidebar expanded or not
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null); // collapse state of submenu
  const [windowHeight, setWindowHeight] = useState(getHeight(window)); // window height
  const [recordOfSearchedScreenName, setRecordOfSearchedScreenName] = useState({ screen: '' }); // search input
  const [width, setWidth] = useState<number>(window.innerWidth); // window width
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // menu anchor element
  const [activeMenu, setActiveMenu] = useState<string | null>(null); // active menu for popover
  const [expandAllSubmenus, setExpandAllSubmenus] = useState(false);
  const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);
  const authSlice = useAppSelector(state => state.auth);
  const patientSlice = useAppSelector(state => state.patient);
  const [expandNotes, setExpandNotes] = useState(false); // sticky notes panel
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const departmentTriggerRef = React.useRef<WhisperInstance>(null);

  const { data: departmentsResponse } = useGetDepartmentsQuery({ page: 0, size: 10000 });
  const departments = departmentsResponse?.data ?? [];
  const { data: facilitiesResponse } = useGetAllFacilitiesQuery({});
  const facilities = Array.isArray(facilitiesResponse) ? facilitiesResponse : [];
  const userId = authSlice.user?.id;
  type UserDepartmentWithNames = UserDepartment & {
    departmentName?: string | null;
    facilityName?: string | null;
  };
  const selectedDepartment = authSlice.selectedDepartment;
  const {
    data: activeDepartmentsResponse,
    isLoading: isLoadingDepartments
  } = useGetActiveUserDepartmentsByUserQuery(userId as number, {
    skip: !userId
  });
  const activeDepartments = (activeDepartmentsResponse ?? []) as UserDepartmentWithNames[];
  const defaultDepartmentLocal = activeDepartments.find(dept => dept?.isDefault) ?? null;
  const shouldFetchDefault = !defaultDepartmentLocal && Boolean(userId);
  const { data: defaultDepartmentResponse } = useGetDefaultUserDepartmentByUserQuery(
    userId as number,
    {
      skip: !shouldFetchDefault
    }
  );
  const defaultDepartment = (defaultDepartmentResponse ?? null) as UserDepartmentWithNames | null;
  const defaultDepartmentEntity = defaultDepartmentLocal ?? defaultDepartment ?? null;

  const resolveFacilityName = useCallback(
    (facilityId?: string | number | null) => {
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
    },
    [facilities, authSlice?.tenant?.selectedFacility]
  );

  const resolveDepartmentName = useCallback(
    (departmentId?: string | number | null) => {
      if (departmentId == null) return undefined;
      return (
        conjureValueBasedOnIDFromList(departments as any[], departmentId, 'name') ??
        (departmentId ? `Department #${departmentId}` : undefined)
      );
    },
    [departments]
  );

  const departmentHeaderFacilityName = useMemo(
    () =>
      selectedDepartment?.facilityName ??
      authSlice?.tenant?.selectedFacility?.name ??
      authSlice?.tenant?.selectedFacility?.facilityName,
    [selectedDepartment?.facilityName, authSlice?.tenant?.selectedFacility]
  );

  const renderDepartmentsSpeaker = useCallback(
    ({ onClose, left, top, className }: any, ref) => (
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
          {departmentHeaderFacilityName && (
            <span style={{ fontSize: '12px', color: '#6c757d' }}>{departmentHeaderFacilityName}</span>
          )}
        </div>
        <Divider style={{ margin: 0 }} />
        {isLoadingDepartments ? (
          <div style={{ padding: '12px' }}>Loading departments…</div>
        ) : activeDepartments.length === 0 ? (
          <div style={{ padding: '12px' }}>No active departments found.</div>
        ) : (
          <div style={{ maxHeight: 240, overflowY: 'auto', margin: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                <div
                  key={dept.id ?? `${dept.userId}-${dept.departmentId}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    border: '1px solid var(--border-color-light, #e5e7eb)',
                    borderRadius: 8,
                    padding: '8px 12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      style={{
                        fontWeight: 600,
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        textAlign: 'left',
                        flex: '1 1 auto'
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
                        setDepartmentPopoverOpen(false);
                        onClose?.();
                        window.location.reload();
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
                </div>
              );
            })}
          </div>
        )}
      </Popover>
    ),
    [
      activeDepartments,
      defaultDepartmentEntity,
      departmentHeaderFacilityName,
      dispatch,
      isLoadingDepartments,
      resolveDepartmentName,
      resolveFacilityName,
      selectedDepartment
    ]
  );

  const selectedFacilityName =
    authSlice?.tenant?.selectedFacility?.name ??
    authSlice?.tenant?.selectedFacility?.facilityName ??
    'Facility';
  const selectedDepartmentName =
    authSlice?.selectedDepartment?.departmentName ?? 'No Department Selected';

  // Effects - window resize listeners
  useEffect(() => {
    setWindowHeight(getHeight(window));
    const resizeListenner = on(window, 'resize', () => setWindowHeight(getHeight(window)));
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => {
      resizeListenner.off();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Close sidebar if window width is small
  useEffect(() => {
    if (width < 950) {
      setExpand(false);
    }
  }, [width]);

  const containerClasses = classNames('page-container', {
    'container-full': !expand // full width if sidebar closed
  });

  // Toggle submenu collapse
  const handleSubmenuToggle = (menu: string) => {
    setSubmenuOpen(submenuOpen === menu ? null : menu);
  };

  // Open popover menu when sidebar is collapsed
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, key: string) => {
    setAnchorEl(event.currentTarget);
    setActiveMenu(key);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setActiveMenu(null);
  };

  const screenExist = (module: NavItemData) => {
    if (!recordOfSearchedScreenName['screen']) return true;

    if (
      module.children &&
      module.children.some(screen =>
        screen.title.toLowerCase().includes(recordOfSearchedScreenName['screen'].toLowerCase())
      )
    ) {
      return true;
    }

    return module.title.toLowerCase().includes(recordOfSearchedScreenName['screen'].toLowerCase());
  };

  const isCodingModule = (nav: NavItemData) =>
    /coding module/i.test(nav.title) || nav.eventKey === 'coding-module';

  return (
    <Container className={`frame ${mode === 'light' ? 'light' : 'dark'}`}>
      <Box sx={{ display: 'flex' }}>
        {/* Sidebar toggle button */}
        <IconButton
          color="inherit"
          aria-label="toggle drawer"
          onClick={() => setExpand(!expand)}
          edge="start"
          sx={{
            position: 'fixed',
            top: 12,
            left: expand ? `${drawerWidth - 28}px` : '22px', // adjust margin-left when closed
            zIndex: 5,
            background: 'transparent',
            padding: '6px',
            transition: 'left 0.3s ease',
            '&:hover': { background: 'transparent' }
          }}
        >
          <ArrowForwardIosIcon
            sx={{
              transform: expand ? 'rotate(180deg)' : 'rotate(0deg)', // arrow rotation
              transition: 'transform 0.3s ease'
            }}
          />
        </IconButton>

        {/* Sidebar Drawer */}
        <Drawer
          variant="permanent"
          open={expand}
          sx={{
            zIndex: 1,
            width: expand ? drawerWidth : collapsedWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: expand ? drawerWidth : collapsedWidth,
              transition: 'width 0.3s',
              overflowX: 'hidden',
              whiteSpace: 'nowrap'
            }
          }}
        >
          {/* Logo */}
          {expand && (
            <img
              onClick={() => {
                navigate('/');
                setExpand(false);
              }}
              className="logo logo-clickable"
              src={
                authSlice.tenant && authSlice.tenant.tenantLogoPath
                  ? authSlice.tenant.tenantLogoPath
                  : mode === 'light'
                  ? Logo
                  : DLogo
              }
            />
          )}
          {!expand && <Toolbar />}
          <MuiDivider />

          <div
            className={classNames('scroll-hidden', 'scroll-container', {
              'scroll-container-expanded': expand,
              'scroll-container-collapsed': !expand
            })}
          >
            {/* Organization info */}
            {expand && (
              <Whisper
                ref={departmentTriggerRef}
                placement="bottomStart"
                trigger="click"
                open={departmentPopoverOpen}
                onOpen={() => setDepartmentPopoverOpen(true)}
                onClose={() => setDepartmentPopoverOpen(false)}
                speaker={renderDepartmentsSpeaker}
              >
                <div
                  className="container-of-organization-info"
                  role="button"
                  tabIndex={0}
                  onClick={() => setDepartmentPopoverOpen(open => !open)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setDepartmentPopoverOpen(open => !open);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <FontAwesomeIcon className="organization-img" icon={faHospital} size="lg" />
                  <div>
                    <div className="name">{selectedFacilityName}</div>
                    <div className="location">{selectedDepartmentName}</div>
                  </div>
                </div>
              </Whisper>
            )}

            {/* Search input */}
            {expand && (
              <Form className="search-field search-form" fluid>
                <div className="search-input-wrapper">
                  <MyInput
                    fieldName="screen"
                    width="100%"
                    record={recordOfSearchedScreenName}
                    setRecord={setRecordOfSearchedScreenName}
                    placeholder="Search by Screen Name"
                    showLabel={false}
                  />
                </div>
                <MyButton
                  onClick={() => setExpandAllSubmenus(!expandAllSubmenus)}
                  prefixIcon={() => (
                    <ArrowForwardIosIcon
                      className={classNames('expand-all-icon', {
                        'expand-all-icon-expanded': expandAllSubmenus,
                        'expand-all-icon-collapsed': !expandAllSubmenus
                      })}
                    />
                  )}
                ></MyButton>
              </Form>
            )}

            {/* Navigation list */}
            <List>
              {navs
                .filter(item => screenExist(item))
                .map(item => (
                  <React.Fragment key={item.eventKey}>
                    <ListItem disablePadding sx={{ display: 'block' }}>
                      <ListItemButton
                        onClick={e => {
                          if (item.children) {
                            if (!expand) {
                              handleOpenMenu(e, item.eventKey); // open popover if collapsed
                            } else {
                              handleSubmenuToggle(item.eventKey); // toggle collapse
                            }
                          } else {
                            navigate(item.to || '/'); // navigate directly
                          }
                        }}
                        sx={{
                          minHeight: 48,
                          justifyContent: expand ? 'initial' : 'center',
                          px: 2.5,
                          '& .MuiListItemText-primary': {
                            fontSize: '0.73rem',
                            fontWeight: 'bold'
                          }
                        }}
                      >
                        <Tooltip
                          title={item.title}
                          placement="right"
                          arrow
                          disableHoverListener={expand}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 0,
                              mr: expand ? 3 : 'auto',
                              justifyContent: 'center',
                              '& svg': { fontSize: '20px' }
                            }}
                          >
                            {item.icon ? (
                              React.isValidElement(item.icon) ? (
                                item.icon
                              ) : typeof item.icon === 'function' ? (
                                React.createElement(item.icon)
                              ) : (
                                <FontAwesomeIcon icon={faHospital} />
                              )
                            ) : (
                              <FontAwesomeIcon icon={faHospital} />
                            )}
                          </ListItemIcon>
                        </Tooltip>
                        {expand && <ListItemText primary={item.title} />}
                        {expand &&
                          item.children &&
                          (submenuOpen === item.eventKey ? <ExpandLess /> : <ExpandMore />)}
                      </ListItemButton>
                    </ListItem>

                    {/* Submenu collapse */}
                    {item.children && expand && (
                      <Collapse
                        in={expandAllSubmenus || submenuOpen === item.eventKey}
                        timeout="auto"
                        unmountOnExit
                      >
                        <List component="div" disablePadding>
                          {item.children
                            .filter(child =>
                              child.title
                                .toLowerCase()
                                .includes(recordOfSearchedScreenName['screen'].toLowerCase())
                            )
                            .map(child => (
                              <ListItemButton
                                key={child.eventKey}
                                sx={{
                                  pl: 6,
                                  ml: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  '& .MuiListItemText-primary': { fontSize: '0.65rem' },
                                  '& svg': {
                                    fontSize: '16px',
                                    marginRight: '6px',
                                    color: mode === 'dark' ? '#ffffff' : '#6b7280'
                                  }
                                }}
                                onClick={() => {
                                  dispatch(setScreenKey(child.eventKey));
                                  navigate(child.to || '/');
                                }}
                              >
                                {child.icon ? (
                                  React.isValidElement(child.icon) ? (
                                    child.icon
                                  ) : typeof child.icon === 'function' ? (
                                    React.createElement(child.icon)
                                  ) : (
                                    <FontAwesomeIcon icon={faHospital} />
                                  )
                                ) : (
                                  <FontAwesomeIcon icon={faHospital} />
                                )}
                                {expand && (
                                  <ListItemText
                                    primary={
                                      isCodingModule(item) ? child.title.toUpperCase() : child.title
                                    }
                                  />
                                )}
                              </ListItemButton>
                            ))}
                        </List>
                      </Collapse>
                    )}

                    {/* Popover menu for collapsed sidebar */}
                    {item.children && (
                      <Menu
                        anchorEl={anchorEl}
                        open={activeMenu === item.eventKey && !expand}
                        onClose={handleCloseMenu}
                        anchorOrigin={{
                          vertical: 'top',
                          horizontal: 'right'
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'left'
                        }}
                        getContentAnchorEl={null}
                        PaperProps={{
                          sx: {
                            '& .MuiMenuItem-root': {
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              color: mode === 'dark' ? '#ffffff' : '#6b7280',
                              '& svg': {
                                color: mode === 'dark' ? '#ffffff' : '#6b7280'
                              },
                              '&:hover': {
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                '& svg': {
                                  color: '#374151'
                                }
                              }
                            }
                          }
                        }}
                      >
                        {/* Main title of the list */}
                        <MenuItem disabled className="menu-item-disabled">
                          {item.icon ? (
                            React.isValidElement(item.icon) ? (
                              item.icon
                            ) : typeof item.icon === 'function' ? (
                              React.createElement(item.icon)
                            ) : (
                              <FontAwesomeIcon icon={faHospital} className="menu-item-icon" />
                            )
                          ) : (
                            <FontAwesomeIcon icon={faHospital} className="menu-item-icon" />
                          )}
                          {item.title}
                        </MenuItem>

                        {/* Sub-elements */}
                        {item.children.map(child => (
                          <MenuItem
                            key={child.eventKey}
                            onClick={() => {
                              dispatch(setScreenKey(child.eventKey));
                              navigate(child.to || '/');
                              handleCloseMenu();
                            }}
                          >
                            {child.icon ? (
                              React.isValidElement(child.icon) ? (
                                child.icon
                              ) : typeof child.icon === 'function' ? (
                                React.createElement(child.icon)
                              ) : (
                                <FontAwesomeIcon
                                  icon={faHospital}
                                  className="menu-item-icon-small"
                                />
                              )
                            ) : (
                              <FontAwesomeIcon icon={faHospital} className="menu-item-icon-small" />
                            )}
                            {isCodingModule(item) ? child.title.toUpperCase() : child.title}
                          </MenuItem>
                        ))}
                      </Menu>
                    )}
                  </React.Fragment>
                ))}
            </List>
          </div>
        </Drawer>

        {/* Main content area */}
        <Container className={containerClasses}>
          <Header expand={expand} setExpand={setExpand} setExpandNotes={setExpandNotes} />
          <Content>
            <Stack
              id="fixedInfoBar"
              className={classNames({
                'fixed-info-bar-visible': patientSlice.patient,
                'fixed-info-bar-semi-transparent': !patientSlice.patient
              })}
              divider={<Divider vertical />}
            ></Stack>

            <div className="content-with-sticky">
              <div className="main-content-area">
                <Outlet />
              </div>

              {expandNotes && (
                <div className="sticky-sidebar-area">
                  <UserStickyNotes
                    expand={expandNotes}
                    setExpand={setExpandNotes}
                    windowHeight={windowHeight}
                  />
                </div>
              )}
            </div>
          </Content>
        </Container>
      </Box>
    </Container>
  );
};

export default Frame;
