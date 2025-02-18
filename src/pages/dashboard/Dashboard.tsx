import DynamicLineChart from '@/components/Charts/DynamicLineChart/DynamicLineChart';
import MyLabel from '@/components/MyLabel';
import Translate from '@/components/Translate';
import { useAppSelector } from '@/hooks';
import authSlice from '@/reducers/authSlice';
import React, { useEffect } from 'react';
import { Panel, FlexboxGrid, Col, List, Stack, Button, Timeline } from 'rsuite';




const Dashboard = () => {
 

  return (
    <Panel header={<h3 className="title">Dashboard</h3>}>
      <FlexboxGrid>
        <FlexboxGrid.Item as={Col} colspan={24} lg={8} md={12} sm={24}>
          <Panel bordered header={<Translate>Number of No-Shows per Day</Translate>}>
            <DynamicLineChart
              maxValue={10}
              title={'No-Show'}
              chartData={[
                { x: '2023-09-19', y: 7 },
                { x: '2023-09-20', y: 2 },
                { x: '2023-09-21', y: 1 },
                { x: '2023-09-22', y: 0 },
                { x: '2023-09-23', y: 3 }
              ]}
            />
          </Panel>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item as={Col} colspan={24} lg={8} md={12} sm={24}>
          <Panel
            bordered
            header="Number of Appointments Scheduled per Day"
            style={{ marginBottom: '10px' }}
          >
            <DynamicLineChart
              title={'Scheduled '}
              maxValue={15}
              chartData={[
                { x: '2023-09-19', y: 13 },
                { x: '2023-09-20', y: 5 },
                { x: '2023-09-21', y: 9 },
                { x: '2023-09-22', y: 12 },
                { x: '2023-09-23', y: 6 }
              ]}
            />
          </Panel>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item as={Col} colspan={24} lg={8} md={12} sm={24}>
          <Panel bordered header="Number of Appointments Completed per Day">
            <DynamicLineChart
              maxValue={10}
              title={'Completed'}
              chartData={[
                { x: '2023-09-19', y: 3 },
                { x: '2023-09-20', y: 2 },
                { x: '2023-09-21', y: 1 },
                { x: '2023-09-22', y: 5 },
                { x: '2023-09-23', y: 4 }
              ]}
            />
          </Panel>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item as={Col} colspan={24} lg={8} md={12} sm={24}>
          <Panel bordered header="Top No-show Reasons">
            <List bordered autoScroll style={{ maxHeight: '250px' }}>
              <List.Item>
                <h6>
                Transportation issues
                  <br />
                 
                </h6>
              </List.Item>
              <List.Item>
                <h6>
                Personal emergency
                  <br />
                  
                </h6>
              </List.Item>
            </List>
          </Panel>
        </FlexboxGrid.Item>

        <FlexboxGrid.Item as={Col} colspan={24} lg={8} md={12} sm={24}>
          <Panel bordered header="Upcoming Appointments Activities">
            <Stack spacing={6} style={{ overflowX: 'auto' }}>
              <Button appearance="ghost">Patient 1</Button>
              <Button>Patient 2</Button>
            </Stack>
            <hr />
            <Timeline>
              <Timeline.Item>
                <p>10:20 AM Appointment Scheduled</p>
              </Timeline.Item>
              <Timeline.Item>
                <p>10:49 AM Checked-In</p>
              </Timeline.Item>
              <Timeline.Item>
                <p>11:03 AM Appointment In Progress</p>
              </Timeline.Item>
              <Timeline.Item>

                <p>
                11:39 AM Appointment Completed 
                {/* <a>result</a> */}
                </p>
              </Timeline.Item>
            </Timeline>
          </Panel>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </Panel>
  );
};

export default Dashboard;
