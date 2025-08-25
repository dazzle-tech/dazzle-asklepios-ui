import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyLabel from '@/components/MyLabel';
import MyNestedTable from '@/components/MyNestedTable';
import Translate from '@/components/Translate';
import React from 'react';
import { Panel } from 'rsuite';

const Referrals = () => {
  // Dummy occupational referrals
  const referralsData = [
    {
      id: 1,
      referredBy: 'Dr. Tariq',
      referredAt: '2024-01-15 10:30',
      department: 'Rehabilitation',
      reason: 'Post-stroke occupational therapy',
      notes: 'Patient needs help regaining independence in daily activities',
      status: 'Requested'
    },
    {
      id: 2,
      referredBy: 'Dr. Yousef',
      referredAt: '2024-01-14 14:20',
      department: 'Orthopedics',
      reason: 'Hand function training',
      notes: 'Focus on improving fine motor skills after hand surgery',
      status: 'Confirmed'
    }
  ];
  // Columns for referrals table
  const referralColumns = [
    {
      key: 'referredByAt',
      title: <Translate>Referred By/At</Translate>,
      render: rowData => (
        <>
          {rowData?.referredBy}
          <br />
          <span className="date-table-style">
            {rowData?.referredAt?.split(' ')[0]}
            <br />
            {rowData?.referredAt?.split(' ')[1]}
          </span>
        </>
      )
    },
    { key: 'department', title: <Translate>Department</Translate> },
    { key: 'reason', title: <Translate>Reason</Translate> },
    { key: 'notes', title: <Translate>Notes</Translate> },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: rowData => {
        const status = rowData.status || 'Requested';

        const getStatusConfig = status => {
          switch (status) {
            case 'Requested':
              return {
                backgroundColor: 'var(--light-orange)',
                color: 'var(--primary-orange)',
                contant: 'Requested'
              };
            case 'Confirmed':
              return {
                backgroundColor: 'var(--light-green)',
                color: 'var(--primary-green)',
                contant: 'Confirmed'
              };
            default:
              return {
                backgroundColor: 'var(--background-gray)',
                color: 'var(--primary-gray)',
                contant: 'Unknown'
              };
          }
        };

        const config = getStatusConfig(status);
        return (
          <MyBadgeStatus
            backgroundColor={config.backgroundColor}
            color={config.color}
            contant={config.contant}
          />
        );
      }
    }
  ];

  return (
    <Panel className="section-panel">
      <div className="section-header">
        <div className="section-header">
          <MyLabel className="section-title" label={<h6>Occupational Referrals</h6>} />
        </div>
      </div>
      <MyNestedTable data={referralsData} columns={referralColumns} />
    </Panel>
  );
};
export default Referrals;
