import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const sampleAppointments = [];

const columns: ColumnConfig[] = [
  {
    key: 'dateTime',
    title: <Translate>Date & Time</Translate>,
    dataKey: 'dateTime',
    render: (row: any) =>
      row?.dateTime ? (
        <span className="date-table-style">{formatDateWithoutSeconds(row.dateTime)}</span>
      ) : (
        '-'
      )
  },
  {
    key: 'provider',
    title: <Translate>Provider</Translate>,
    dataKey: 'provider'
  },
  {
    key: 'department',
    title: <Translate>Department</Translate>,
    dataKey: 'department'
  },
  {
    key: 'status',
    title: <Translate>Status</Translate>,
    dataKey: 'status',
    width: 100,
    render: (row: any) => (
      <MyBadgeStatus
        backgroundColor={
          row.status === 'Completed'
            ? 'var(--light-green)'
            : row.status === 'Scheduled'
            ? 'var(--light-yellow)'
            : 'var(--primary-pink)'
        }
        color={
          row.status === 'Completed'
            ? 'var(--primary-green)'
            : row.status === 'Scheduled'
            ? 'var(--primary-yellow)'
            : 'var(--primary-pink)'
        }
        contant={row.status}
      />
    )
  }
];

const AppointmentsTable = () => {
  const [sortColumn, setSortColumn] = useState('dateTime');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleAppointments);

  const sortedData = [...tableData].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    if (aValue === bValue) return 0;
    return sortType === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
  });

  const paginatedData = sortedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <MyTable
      data={paginatedData}
      columns={columns}
      loading={false}
      sortColumn={sortColumn}
      sortType={sortType}
      onSortChange={(col, type) => {
        setSortColumn(col);
        setSortType(type);
      }}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={tableData.length}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={e => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
    />
  );
};

export default AppointmentsTable;
