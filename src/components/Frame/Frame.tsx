import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { Container, Sidebar, Sidenav, Content, Nav, DOMHelper, Stack, Divider, Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHospital } from '@fortawesome/free-solid-svg-icons';
import { Outlet, useNavigate } from 'react-router-dom';
import NavToggle from './NavToggle';
import Header from '../Header';
import NavLink from '../NavLink';
import { useAppDispatch, useAppSelector } from '@/hooks';
import Logo from '../../images/Logo_BLUE_New.svg';
import { setScreenKey } from '@/utils/uiReducerActions';
import MyInput from '../MyInput';
import './styles.less';
import UserStickyNotes from '../UserStickyNotes/UserStickyNotes';
const { getHeight, on } = DOMHelper;

export interface NavItemData {
  eventKey: string;
  title: string;
  icon?: any;
  to?: string;
  target?: string;
  children?: NavItemData[];
}
export interface FrameProps {
  navs: NavItemData[];
  children?: React.ReactNode;
  mode: string;
}
const Frame = (props: FrameProps) => {
  const { navs } = props;
  const { mode } = props;
  const NavItem = props => {
    const { title, eventKey, ...rest } = props;
    return (
      <Nav.Item eventKey={eventKey} as={NavLink} {...rest}>
        {title}
      </Nav.Item>
    );
  };
  const [expand, setExpand] = useState(false);
  const [windowHeight, setWindowHeight] = useState(getHeight(window));
  const [recordOfSearchedScreenName, setRecordOfSearchedScreenName] = useState({ screen: '' });
  const [width, setWidth] = useState<number>(window.innerWidth);
  const authSlice = useAppSelector(state => state.auth);
  const patientSlice = useAppSelector(state => state.patient);
  const [expandNotes, setExpandNotes] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const navBodyStyle: React.CSSProperties = expand
    ? { height: windowHeight - 112, overflow: 'auto' }
    : {};

  // Effects
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
  useEffect(() => {
    if (width < 950) {
      setExpand(false);
    }
  }, [width]);

  //className for container
  const containerClasses = classNames('page-container', {
    'container-full': !expand
  });
  //function to check if specific module contains the searched screen
  const screenExist: (module: NavItemData) => boolean = (module: NavItemData) => {
    for (const screen of module?.children) {
      if (
        screen.title
          .toLocaleLowerCase()
          .includes(recordOfSearchedScreenName['screen'].toLocaleLowerCase())
      ) {
        return true;
      }
    }
    return false;
  };
  return (
    <Container className={`frame ${mode === 'light' ? 'light' : 'dark'}`}>
      <Sidebar
        className={`sidebar ${expand === true ? 'sidebar-expanded' : 'sidebar-unexpanded'}`}
        collapsible
      >
        <Sidenav.Header></Sidenav.Header>
        <Sidenav expanded={expand} appearance="subtle" defaultOpenKeys={['2', '3']}>
          <Sidenav.Body style={navBodyStyle}>
            <Nav className="sidebar-scroll">
              {expand && (
                <img
                  onClick={() => {
                    navigate('/');
                  }}
                  className="logo"
                  src={
                    authSlice.tenant && authSlice.tenant.tenantLogoPath
                      ? authSlice.tenant.tenantLogoPath
                      : Logo
                  }
                />
              )}
              {expand && (
                <div className="container-of-organization-info">
                  <FontAwesomeIcon className="organization-img" icon={faHospital} size="lg" />
                  <div>
                    <div className="name">Health Organization1</div>
                    <div className="location">845 Euclid Avenue, CA</div>
                  </div>
                </div>
              )}
              {expand && (
                <Form className="search-field">
                  <MyInput
                    fieldName="screen"
                    width="100%"
                    record={recordOfSearchedScreenName}
                    setRecord={setRecordOfSearchedScreenName}
                    placeholder="Search by Screen Name"
                    showLabel={false}
                  />
                </Form>
              )}
              {navs.map(item => {
                const { children, ...rest } = item;
                if (children && screenExist(item)) {
                  return (
                    <Nav.Menu
                      className={`nav-menu ${expand ? 'expanded' : ''} ${
                        mode === 'light' ? 'light' : 'dark'
                      }`}
                      key={item.eventKey}
                      placement={expand ? 'bottomStart' : 'rightStart'}
                      trigger="hover"
                      {...rest}
                    >
                      {/* This inline style cannot be removed because it uses dynamic variables */}
                      <div
                        style={{
                          maxHeight: !expand ? '600px' : undefined,
                          overflowY: !expand ? 'auto' : undefined
                        }}
                      >
                        {children.map(child => {
                          if (
                            child.title
                              .toLocaleLowerCase()
                              .includes(recordOfSearchedScreenName['screen'].toLocaleLowerCase())
                          ) {
                            return (
                              <NavItem
                                onClick={() => {
                                  dispatch(setScreenKey(child.eventKey));
                                }}
                                key={child.eventKey}
                                {...child}
                              />
                            );
                          }
                        })}
                      </div>
                    </Nav.Menu>
                  );
                }
                if (rest.target === '_blank') {
                  return (
                    <Nav.Item key={item.eventKey} {...rest}>
                      {item.title}
                    </Nav.Item>
                  );
                }
                if (recordOfSearchedScreenName['screen'].length === 0)
                  return <NavItem className="nav-menu" key={rest.eventKey} {...rest} />;
              })}
            </Nav>
          </Sidenav.Body>
        </Sidenav>
        <NavToggle
          mode={mode}
          expand={expand}
          onChange={() => {
            width <= 950 ? setExpand(false) : setExpand(!expand);
          }}
        />
      </Sidebar>
      <Container className={containerClasses}>
        <Header expand={expand} setExpand={setExpand} setExpandNotes={setExpandNotes} />
        <Content>
          <Stack
            id="fixedInfoBar"
            //This inline style cannot be removed because it uses dynamic variables
            style={{
              opacity: patientSlice.patient ? '1' : '0.85'
            }}
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
    </Container>
  );
};
export default Frame;
