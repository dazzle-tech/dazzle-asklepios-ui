import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import {
  Container,
  Sidebar,
  Sidenav,
  Content,
  Nav,
  DOMHelper,
  Stack,
  Divider,
  Panel,
  Form
} from 'rsuite';
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
  const dispatch = useAppDispatch();

  const[recordOfSearchedScreenName, setRecordOfSearchedScreenName] = useState({screen: ""});

 

  useEffect(() => {
    setWindowHeight(getHeight(window));
   if(window.innerWidth <= 950) 
     setExpand(false);
    const resizeListenner = on(window, 'resize', () => setWindowHeight(getHeight(window)));

    return () => {
      resizeListenner.off();
    };
  }, []);

  const containerClasses = classNames('page-container', {
    'container-full': !expand
  });


   const screenExist: (module: NavItemData) => boolean = (module: NavItemData) => {
      for(const screen of module?.children ){
          if((screen.title.toLocaleLowerCase()).includes(recordOfSearchedScreenName['screen'].toLocaleLowerCase())){
            return true;
          }
      }
      return false;
     
   };

  const navBodyStyle: React.CSSProperties = expand
    ? { height: windowHeight - 112, overflow: 'auto' }
    : {};

  return (
    <Container className="frame">
      <Sidebar
      className={`sidebar ${expand === true ? "sidebar-expanded" : "sidebar-unexpanded"}`}
        // className='sidebar'
        // width={expand ? 260 : 56}
        collapsible
      >
        <Sidenav.Header></Sidenav.Header>
        <Sidenav expanded={expand} appearance="subtle" defaultOpenKeys={['2', '3']}>
          <Sidenav.Body style={navBodyStyle}>
            <Nav>
              {expand && (
                <img
                  onClick={() => {
                    navigate('/');
                  }}
                  className='logo'
                  src={
                    authSlice.tenant && authSlice.tenant.tenantLogoPath
                      ? authSlice.tenant.tenantLogoPath
                      : Logo
                  }
                  // height={50}
                  // width={100}
                />
              )}
              {expand && (
                <div
                className='container-of-organization-info'
                >
                  <FontAwesomeIcon
                  className='organization-img'
                    icon={faHospital}
                    size="lg"
                  />

                  <div>
                    <div className='name'>
                      Health Organization1
                    </div>
                    <div className='location'>845 Euclid Avenue, CA</div>
                  </div>
                  
                </div>
              )}
               {expand && (
              
                    <Form className='search-field'>
                      <MyInput fieldName='screen' width= '85%' record={recordOfSearchedScreenName} setRecord={setRecordOfSearchedScreenName} placeholder="Search by Screen Name" showLabel={false}/>
                    </Form>
                 
               )}
              {navs.map(item => {
                const { children, ...rest } = item;
                if (children && screenExist(item)) {
                  return (
                    <Nav.Menu expanded key={item.eventKey} placement="rightStart" trigger="hover" {...rest}>
                      {/* This inline style cannot be removed because it uses dynamic variables */}
                      
                       <div style={{ maxHeight: !expand ? '600px' : undefined, overflowY: !expand ? 'auto' : undefined }}>
                      {children.map(child => {
                        if(child.title.toLocaleLowerCase().includes(recordOfSearchedScreenName['screen'].toLocaleLowerCase())){
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
                
                if(recordOfSearchedScreenName['screen'].length === 0)
                return <NavItem key={rest.eventKey} {...rest} />;
              })}

              
            </Nav>
          </Sidenav.Body>
        </Sidenav>
        <NavToggle expand={expand} onChange={() =>{ window.innerWidth <= 950 ? setExpand(false) : setExpand(!expand); }} />
      </Sidebar>


      <Container 
      className={containerClasses}
       >
        <Header expand={expand} setExpand={setExpand} />
        <Content>
         
          
          <Stack
            id="fixedInfoBar"
            //This inline style cannot be removed because it uses dynamic variables
            style={{
              opacity: patientSlice.patient ? '1' : '0.85',
            }}
            divider={<Divider vertical />}
          >
            
          </Stack>
{/* <<<<<<< HEAD */}
          <div
          className='content'
            
// =======
//           <Panel

//           className='content'
//             style={{ maxHeight: '90vh', overflowY: 'auto', marginTop: '5px'}}
//             bordered
//             color="green"
// >>>>>>> 2991b31 (904)
          >
            <Outlet />
          </div>
        </Content>
      </Container>
    </Container>
  );
};

export default Frame;
