import MyTab from '@/components/MyTab';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Panel } from 'rsuite';
import ERList from './ERList';
import ERWaitingList from './ERWaitingList';
import './styles.less';

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
