import React, { useEffect } from 'react';
import { Tabs, Panel } from 'rsuite';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import ReactDOMServer from 'react-dom/server';
import ERWaitingList from './ERWaitingList';
import ERList from './ERList';
import './styles.less';
import Translate from '@/components/Translate';
import MyTab from '@/components/MyTab';

const ERTabsDepartmentAndWaitingList = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  // header setup
  const divContent = (
      "Emergency Department Management"
  );
  useEffect(() => {
    dispatch(setPageCode('ER_Management'));
    dispatch(setDivContent(divContent));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(' '));
    };
  }, [location.pathname, dispatch]);

  const tabData = [
    {title: "ER Department", content: <ERList />},
    {title: "ER Waiting List", content: <ERWaitingList />}
  ];
  return (
    <Panel>
      <MyTab 
       data={tabData}
      />
    </Panel>
  );
};

export default ERTabsDepartmentAndWaitingList;
