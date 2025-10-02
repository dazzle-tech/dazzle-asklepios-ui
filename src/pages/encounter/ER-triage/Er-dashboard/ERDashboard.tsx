import React from 'react';
import ERDashboardTable from './ERDashboardTable';
import ERDashboardTableTwo from './ERDashboardTableTwo';
import ERDashboardNotificationCard from './ERDashboardNotificationCard';
import { formatDateWithoutSeconds } from '@/utils';
import { useDispatch } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
import { setPageCode, setDivContent } from '@/reducers/divSlice';

const ERDashboards = () => {
  const dispatch = useDispatch();

  // Header page setUp
  const divContent = (
    <div className="page-title">
      <h5>ER Dashboard</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('ER-Dashboard'));
  dispatch(setDivContent(divContentHTML));

  return (
    <>
      <div className="main-tables-container-er-dashboard">
        <ERDashboardTable />

        <div className="table-two-container-er-dashboard">
          <ERDashboardTableTwo />
          <div className="er-dashboard-notification-container">
            <ERDashboardNotificationCard />
          </div>
        </div>
      </div>
    </>
  );
};

export default ERDashboards;
