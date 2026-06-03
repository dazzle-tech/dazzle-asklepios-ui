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

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTab
      lazy
        data={tabData.map(tab => ({
          ...tab,
          content: <div dir={dir}>{tab.content}</div>
        }))}
        className="tab-container"
      />
    </Panel>
  );
};

export default ERTabsDepartmentAndWaitingList;
