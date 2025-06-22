import DynamicLineChart from '@/components/Charts/DynamicLineChart/DynamicLineChart';
import MyLabel from '@/components/MyLabel';
import Translate from '@/components/Translate';
import { useAppSelector } from '@/hooks';
import authSlice from '@/reducers/authSlice';
import React, { useEffect } from 'react';
import { Panel, FlexboxGrid, Col, List, Stack, Button, Timeline } from 'rsuite';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import StimulsoftReportViewer from '@/StimulsoftReportViewer';
const Dashboard = () => {
  const dispatch = useAppDispatch();
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Dashboard</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Dashboard'));
  dispatch(setDivContent(divContentHTML));
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent("  "));
    };
  }, [location.pathname, dispatch]);

  return (
    <Panel>
      <div>
        <h2>Active Ingredients Report</h2>
        <StimulsoftReportViewer/>
      </div>
    </Panel>
  );
};

export default Dashboard;
