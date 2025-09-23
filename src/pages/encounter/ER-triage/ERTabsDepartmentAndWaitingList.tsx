import React, { useEffect } from 'react';
import { Tabs, Panel } from 'rsuite';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import ReactDOMServer from 'react-dom/server';
import ERWaitingList from './ERWaitingList'; 
import ERList from './ERList';
import './styles.less';

const ERTabsDepartmentAndWaitingList = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  // header setup
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Emergency Department Management</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);

  useEffect(() => {
    dispatch(setPageCode('ER_Management'));
    dispatch(setDivContent(divContentHTML));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(' '));
    };
  }, [location.pathname, dispatch]);

  return (
    <Panel>
      <Tabs defaultActiveKey="1" appearance="subtle">
        <Tabs.Tab eventKey="1" title="ER Waiting List">
          <ERWaitingList />
        </Tabs.Tab>
        <Tabs.Tab eventKey="2" title="ER Department">
          <ERList />
        </Tabs.Tab>
      </Tabs>
    </Panel>
  );
};

export default ERTabsDepartmentAndWaitingList;