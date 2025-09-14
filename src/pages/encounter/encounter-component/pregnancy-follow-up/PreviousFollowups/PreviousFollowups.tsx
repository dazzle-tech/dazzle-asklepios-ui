import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { FaEye } from 'react-icons/fa';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const PreviousFollowups = () => {
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  const data = [
    {
      id: 1,
      visitStartedAt: '2023-01-10',
      lmp: '2022-10-01',
      dueDate: '2023-07-08',
      actualDob: '2023-07-05',
      numberOfBabies: 1,
      status: 'Ended'
    },
    {
      id: 2,
      visitStartedAt: '2024-03-20',
      lmp: '2023-12-15',
      dueDate: '2024-09-21',
      actualDob: '',
      numberOfBabies: 2,
      status: 'Active'
    }
  ];

  const columns = [
    {
      key: 'visitStartedAt',
      title: 'Visit Started At',
      dataKey: 'visitStartedAt',
      width: 150
    },
    {
      key: 'lmp',
      title: 'LMP',
      dataKey: 'lmp',
      width: 120
    },
    {
      key: 'dueDate',
      title: 'Due Date',
      dataKey: 'dueDate',
      width: 120
    },
    {
      key: 'actualDob',
      title: 'Actual Date of Birth',
      dataKey: 'actualDob',
      width: 180
    },
    {
      key: 'numberOfBabies',
      title: 'Number of Babies',
      dataKey: 'numberOfBabies',
      width: 150
    },
{
  key: 'status',
  title: 'Status',
  dataKey: 'status',
  width: 120,
  render: (row: any) => (
    <MyBadgeStatus
      backgroundColor={
        row.status === 'Ended'
          ? 'var(--light-pink)'
          : row.status === 'Active'
          ? 'var(--light-green)'
          : 'var(--light-pink)'
      }
      color={
        row.status === 'Ended'
          ? 'var(--primary-pink)'
          : row.status === 'Active'
          ? 'var(--primary-green)'
          : 'var(--primary-pink)'
      }
      contant={row.status}
    />
  )
},
    {
      key: 'actions',
      title: '',
      width: 80,
      align: 'center',
      render: (rowData: any) => (
        <FaEye
          size={18}
          style={{ cursor: 'pointer', color: 'var(--primary-gray)' }}
          title="View Delivery Information"
          onClick={() => {
            console.log('View delivery info for:', rowData.id);
          }}
        />
      )
    }
  ];

  const isSelectedRow = (rowData: any) => {
    return rowData.id === selectedRowId ? 'selected-row' : '';
  };

  return (
    <MyTable
      data={data}
      columns={columns}
      loading={false}
      page={0}
      rowsPerPage={10}
      rowClassName={isSelectedRow}
      onRowClick={(rowData: any) => setSelectedRowId(rowData.id)}
      totalCount={data.length}
      onPageChange={() => {}}
      onRowsPerPageChange={() => {}}
      sortColumn="visitStartedAt"
      sortType="desc"
      onSortChange={() => {}}
    />
  );
};

export default PreviousFollowups;
