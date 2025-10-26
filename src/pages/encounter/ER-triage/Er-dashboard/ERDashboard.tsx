import React, { useLayoutEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import ReactDOMServer from 'react-dom/server';
import { setPageCode, setDivContent } from '@/reducers/divSlice';
import Translate from '@/components/Translate';

import ERDashboardTable from './ERDashboardTable';
import ERDashboardTableTwo from './ERDashboardTableTwo';
import ERDashboardNotificationCard from './ERDashboardNotificationCard';

const ERDashboards: React.FC = () => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const header = (
      "ER Dashboard"
    );

    const id = requestAnimationFrame(() => {
      dispatch(setPageCode('ER_Dashboard'));
      dispatch(setDivContent(header));
    });

    return () => {
      cancelAnimationFrame(id);
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, pathname]);


  return (
    <div className="main-tables-container-er-dashboard">
      <ERDashboardTable />

      <div className="table-two-container-er-dashboard">
        <ERDashboardTableTwo />
        <div className="er-dashboard-notification-container">
          <ERDashboardNotificationCard />
        </div>
      </div>
    </div>
  );
};

export default ERDashboards;
