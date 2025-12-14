import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const sampleServicesData = [];

const columns: ColumnConfig[] = [
  {
    key: 'service',
    title: <Translate>Service</Translate>,
    dataKey: 'service'
  },
  {
    key: 'provider',
    title: <Translate>Provider</Translate>,
    dataKey: 'provider'
  },
  {
    key: 'startDate',
    title: <Translate>Start Date</Translate>,
    dataKey: 'startDate',
    render: (row: any) =>
      row?.startDate ? (
        <span className="date-table-style">{formatDateWithoutSeconds(row.startDate)}</span>
      ) : (
        '-'
      )
  },
  {
    key: 'frequency',
    title: <Translate>Frequency</Translate>,
    dataKey: 'frequency'
  },
  {
    key: 'progress',
    title: <Translate>Progress</Translate>,
    dataKey: 'progress'
  },
  {
    key: 'status',
    title: <Translate>Status</Translate>,
    dataKey: 'status',
    width: 100,
    render: (row: any) => {
      let bgColor = 'var(--light-pink)';
      let color = 'var(--primary-pink)';
      if (row.status === 'Completed') {
        bgColor = 'var(--light-yellow)';
        color = 'var(--primary-yellow)';
      } else if (row.status === 'Active') {
        bgColor = 'var(--light-green)';
        color = 'var(--primary-green)';
      } else if (row.status === 'Scheduled') {
        bgColor = 'var(--light-orange)';
        color = 'var(--primary-orange)';
      }
      return <MyBadgeStatus backgroundColor={bgColor} color={color} contant={row.status} />;
    }
  }
];

const AppliedServicesTable = () => {
  const [sortColumn, setSortColumn] = useState('startDate');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleServicesData);

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

export default AppliedServicesTable;
