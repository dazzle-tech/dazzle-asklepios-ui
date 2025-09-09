import Translate from '@/components/Translate';
import React, { useEffect } from 'react';
import { Panel, FlexboxGrid, Col } from 'rsuite';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import DynamicBarChart from '@/components/Charts/DynamicBarChart/DynamicBarChart';
import DynamicPieChart from '@/components/Charts/DynamicPieChart/DynamicPieChart';
import { TitleWithIcon } from '@/components/Charts/DynamicTableChart/TitleWithIcon';
import DynamicMainTableChart from '@/components/Charts/DynamicTableChart/DynamicMainTableChart';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStethoscope, faVial, faPills } from '@fortawesome/free-solid-svg-icons';
const Dashboard = () => {
  const dispatch = useAppDispatch();
  const divContent = (
    <div className="display-flex">
      <h5>Dashboard</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Dashboard'));
  dispatch(setDivContent(divContentHTML));
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  return (
    <Panel>
      <FlexboxGrid>
        <FlexboxGrid.Item as={Col} colspan={24} lg={12} md={12} sm={24}>
          <Panel
            bordered
            header={<Translate>Weekly Patient Flow</Translate>}
            className="margin-bottom-10"
          >
            <DynamicBarChart
              title=""
              selectable
              refreshButton={false}
              multiColumns={true}
              colors={['#3498db', '#2ecc71', '#e74c3c']}
              chartData={[
                { label: 'Mon', Admissions: 45, Discharges: 38, Emergency: 66 },
                { label: 'Tue', Admissions: 52, Discharges: 41, Emergency: 73 },
                { label: 'Wed', Admissions: 48, Discharges: 45, Emergency: 69 },
                { label: 'Thu', Admissions: 61, Discharges: 39, Emergency: 82 },
                { label: 'Fri', Admissions: 55, Discharges: 43, Emergency: 76 },
                { label: 'Sat', Admissions: 42, Discharges: 47, Emergency: 59 },
                { label: 'Sun', Admissions: 38, Discharges: 35, Emergency: 52 }
              ]}
            />
          </Panel>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item as={Col} colspan={24} lg={12} md={12} sm={24}>
          <Panel
            bordered
            header={<Translate>Patient Distribution by Department</Translate>}
            className="margin-bottom-10"
          >
            <DynamicPieChart
              title="Scheduled Appointments"
              selectable={true}
              refreshButton={false}
              width={350}
              height={347}
              colors={['#2264E5', '#93C6FA', '#FF6384', '#FFCE56', '#4BC0C0', '#663399']}
              chartData={[
                { label: 'ICU', value: 13 },
                { label: 'Sergery', value: 5 },
                { label: 'Cardiology', value: 9 },
                { label: 'Pediatrics', value: 12 },
                { label: 'Others', value: 6 },
                { label: 'Emergency', value: 6 }
              ]}
            />
          </Panel>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item as={Col} colspan={24} lg={8} md={12} sm={24}>
          <Panel>
            <DynamicMainTableChart
              title={
                <TitleWithIcon
                  icon={<FontAwesomeIcon icon={faStethoscope} />}
                  text="Top Diagnoses"
                  iconColor="#8f98ab"
                />
              }
              subtitle="Most common diagnoses this month"
              data={[
                { name: 'Hypertension', value: 289, percentage: '17.1%', trend: 'up' },
                { name: 'Type 2 Diabetes', value: 234, percentage: '8.9%', trend: 'down' },
                { name: 'Pneumonia', value: 178, trend: 'up' },
                { name: 'Coronary Artery Disease', value: 145, percentage: '12.1%', trend: 'up' },
                { name: 'COPD', value: 123, percentage: '16.1%', trend: 'down' },
                { name: 'Acute Myocardial Infarction', value: 98, percentage: '7.9%', trend: 'up' }
              ]}
              showHeader={false}
              columns={['name', 'value']}
              columnWidths={['70%', '30%']}
              alignments={['left', 'right']}
              showPercentage={true}
            />
          </Panel>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item as={Col} colspan={24} lg={8} md={12} sm={24}>
          <Panel>
            <DynamicMainTableChart
              title={
                <TitleWithIcon
                  icon={<FontAwesomeIcon icon={faPills} />}
                  text="Top Medications"
                  iconColor="#8f98ab"
                />
              }
              subtitle="Most prescribed medications this month"
              data={[
                { name: 'Metformin', value: 342, percentage: '16.1%', trend: 'up' },
                { name: 'Lisinopril', value: 298, percentage: '16.1%', trend: 'down' },
                { name: 'Atorvastatin', value: 267, percentage: '14.6%', trend: 'up' },
                { name: 'Ambolipine', value: 231, percentage: '12.5%', trend: 'down' },
                { name: 'Amoxicillin', value: 189, percentage: '10.2%', trend: 'up' },
                { name: 'Omeprazole', value: 156, percentage: '8.4%', trend: 'down' }
              ]}
              columns={['name', 'value']}
              columnWidths={['70%', '30%']}
              alignments={['left', 'right']}
              showPercentage={true}
              showTrend={true}
              showHeader={false}
            />
          </Panel>
        </FlexboxGrid.Item>

        <FlexboxGrid.Item as={Col} colspan={24} lg={8} md={12} sm={24}>
          <Panel>
            <DynamicMainTableChart
              title={
                <TitleWithIcon
                  icon={<FontAwesomeIcon icon={faVial} />}
                  text="Top Lab Findings"
                  iconColor="#8f98ab"
                />
              }
              subtitle="Most frequent lab test findings"
              data={[
                { name: 'Laptop Pro', value: 156, percentage: '7.6%', trend: 'up' },
                { name: 'Smartphone X', value: 234, percentage: '55.2%', trend: 'up' },
                { name: 'Tablet Lite', value: 189, percentage: '21.9%', trend: 'down' }
              ]}
              showHeader={false}
              columns={['name', 'value']}
              columnWidths={['70%', '30%']}
              alignments={['left', 'right']}
              showPercentage={true}
            />
          </Panel>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </Panel>
  );
};

export default Dashboard;
