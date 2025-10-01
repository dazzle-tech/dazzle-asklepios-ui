import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { Container, Content, DOMHelper, Stack, Divider, Form } from 'rsuite';
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
  MenuItem
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MyButton from '../MyButton/MyButton';

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
  const authSlice = useAppSelector(state => state.auth);
  const patientSlice = useAppSelector(state => state.patient);
  const [expandNotes, setExpandNotes] = useState(false); // sticky notes panel
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

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
            zIndex: 1400,
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
          <Toolbar />
          <MuiDivider />

          <div
            className={classNames('scroll-hidden', 'scroll-container', {
              'scroll-container-expanded': expand,
              'scroll-container-collapsed': !expand
            })}
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

            {/* Organization info */}
            {expand && (
              <div className="container-of-organization-info">
                <FontAwesomeIcon className="organization-img" icon={faHospital} size="lg" />
                <div>
                  <div className="name">Health Organization1</div>
                  <div className="location">845 Euclid Avenue, CA</div>
                </div>
              </div>
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
                                {expand && <ListItemText primary={child.title} />}
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
                            {child.title}
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
