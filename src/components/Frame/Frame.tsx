import React, { useEffect, useState } from 'react';
import { Card, Text, VStack, TagGroup, Tag } from 'rsuite';
import classNames from 'classnames';
import {
  Container,
  Sidebar,
  Sidenav,
  Content,
  Nav,
  DOMHelper,
  Stack,
  Button,
  Divider,
  Panel
} from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHospital} from '@fortawesome/free-solid-svg-icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import NavToggle from './NavToggle';
import Header from '../Header';
import NavLink from '../NavLink';
import { useAppDispatch, useAppSelector } from '@/hooks';
import Logo from '../../images/suggested logo_2025 copy.svg';
import { Breadcrumb } from 'rsuite';
import Translate from '../Translate';
import StackItem from 'rsuite/esm/Stack/StackItem';
import { setScreenKey } from '@/utils/uiReducerActions';

const { getHeight, on } = DOMHelper;

const NavItem = props => {
  const { title, eventKey, ...rest } = props;
  return (
    <Nav.Item eventKey={eventKey} as={NavLink} {...rest}>
      {title}
    </Nav.Item>
  );
};

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
}

const Frame = (props: FrameProps) => {
  const { navs } = props;
  const [expand, setExpand] = useState(false);
  const [windowHeight, setWindowHeight] = useState(getHeight(window));
  const authSlice = useAppSelector(state => state.auth);
  const patientSlice = useAppSelector(state => state.patient);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  useEffect(() => {
    setWindowHeight(getHeight(window));
    const resizeListenner = on(window, 'resize', () => setWindowHeight(getHeight(window)));

    return () => {
      resizeListenner.off();
    };
  }, []);

  const containerClasses = classNames('page-container', {
    'container-full': !expand
  });

  const navBodyStyle: React.CSSProperties = expand
    ? { height: windowHeight - 112, overflow: 'auto' }
    : {};

  return (
    <Container className="frame" >

  
      <Sidebar
        style={{ display: 'flex', flexDirection: 'column', height: '102vh'}}

        width={expand ? 260 : 56}
        collapsible
      >
        <Sidenav.Header>

        </Sidenav.Header>
        <Sidenav expanded={expand} appearance="subtle" defaultOpenKeys={['2', '3']}>
          <Sidenav.Body style={navBodyStyle}>
            <Nav>
              {expand&&<img
                onClick={() => {
                  navigate('/');
                }}
                style={{
                  display: 'block',
                  margin: 'auto',
                  padding: '0px 0px',
                  cursor: 'pointer'
                }}
                src={
                  authSlice.tenant && authSlice.tenant.tenantLogoPath
                    ? authSlice.tenant.tenantLogoPath
                    : Logo
                }
                height={50}
                width={ 100 }
              />}
            {expand&&
               <div
               
               style={{
                 display: 'flex',
                 alignItems: 'center',
                 marginLeft: '15px',
                 padding: '12px 15px',
                 borderRadius: '15px',
                 boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)', 
                 backgroundColor: '#f9f9f9',
                 width: '220px',
                 border: '1px solid #ddd'
               }}
             >
               <FontAwesomeIcon 
                 icon={faHospital} 
                 size="lg" 
                 style={{ color: '#666', marginRight: '12px' }} 
               />
             
               <div>
                 <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>
                   Health Organization1
                 </div>
                 <div style={{ fontSize: '10px', color: '#777' }}>
                   845 Euclid Avenue, CA
                 </div>
               </div>
             </div>}
              {navs.map(item => {
                const { children, ...rest } = item;
                if (children) {
                  return (
                    <Nav.Menu key={item.eventKey} placement="rightStart" trigger="hover" {...rest}>
                      {children.map(child => {
                        return (
                          <NavItem
                  
                            onClick={() => {
                              dispatch(setScreenKey(child.eventKey));
                            }}
                            key={child.eventKey}
                            {...child}
                          />
                        );
                      })}
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

                return <NavItem key={rest.eventKey} {...rest} />;
              })}
            </Nav>
          </Sidenav.Body>
        </Sidenav>
        <NavToggle expand={expand} onChange={() => setExpand(!expand)} />
      </Sidebar>

      <Container className={containerClasses}  >
        <Header expand={expand} setExpand={setExpand} />
        <Content style={{ marginTop: '15px' }}>
          {/* <Breadcrumb>
            <Breadcrumb.Item onClick={() => navigate('/')}>
              <a>
                <Translate>Home</Translate>
              </a>
            </Breadcrumb.Item>
            {
              location ? location.pathname.replace('/','') : ''
            }
          </Breadcrumb> */}
          <Stack
            id="fixedInfoBar"
            style={{
              opacity: patientSlice.patient ? '1' : '0.85',
              padding: '11px',
              position: 'relative',
              display: 'inline-flex',
              color: 'black',
              zIndex: '101',

              height: '50px',
              borderRadius: '0px 15px 15px 0px'
            }}
            divider={<Divider vertical />}
          >
            {/* <StackItem>
              <img
                onClick={() => {
                  navigate('/');
                }}
                style={{
                  display: 'block',
                  margin: 'auto',
                  padding: '0px 0px',
                  cursor: 'pointer'
                }}
                src={
                  authSlice.tenant && authSlice.tenant.tenantLogoPath
                    ? authSlice.tenant.tenantLogoPath
                    : Logo
                }
                height={50}
                width={100}
              />
            </StackItem>
            <StackItem>
              <small>
                <b>Facility</b>
              </small>
              <div>HQ</div>
            </StackItem>
            <StackItem>
              <small>
                <b>Department</b>
              </small>
              <div>Dental</div>
            </StackItem>
            <StackItem>
              <small>
                <b>Date</b>
              </small>
              <div>{new Date().toDateString()}</div>
            </StackItem>
            {patientSlice.patient && (
              <StackItem>
                <small>
                  <b>Patient</b>
                </small>
                <div>
                  <a
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      navigate('/patient-profile');
                    }}
                  >
                    {patientSlice.patient.fullName}
                  </a>
                </div>
              </StackItem>
            )}
            {patientSlice.encounter && (
              <StackItem>
                <small>
                  <b>Visit ID</b>
                </small>
                <div>
                  <a
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      navigate('/encounter');
                    }}
                  >
                    {patientSlice.encounter.key}
                  </a>
                </div>
              </StackItem>
            )} */}
          </Stack>
          <Panel
            style={{ maxHeight: '90vh', overflowY: 'auto', marginTop: '5px' }}
            bordered
            color="green"
          >
            <Outlet />
          </Panel>
        </Content>
      </Container>
    </Container>
  );
};

export default Frame;
