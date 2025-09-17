import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const sampleLaboratoryData = [
  {
    testName: 'Complete Blood Count',
    date: '2024-01-10T00:00:00Z',
    result: 'Normal',
    status: 'Final'
  },
  {
    testName: 'HbA1c',
    date: '2024-01-10T00:00:00Z',
    result: '7.2%',
    status: 'Final'
  },
  {
    testName: 'Lipid Panel',
    date: '2024-01-05T00:00:00Z',
    result: 'See Report',
    status: 'Final'
  },
  {
    testName: 'TSH',
    date: '2024-01-05T00:00:00Z',
    result: '2.1 mIU/L',
    status: 'Final'
  },
  {
    testName: 'Creatinine',
    date: '2024-01-10T00:00:00Z',
    result: '1.0 mg/dL',
    status: 'Final'
  }
];

const columns: ColumnConfig[] = [
  {
    key: 'testName',
    title: <Translate>Test Name</Translate>,
    dataKey: 'testName'
  },
  {
    key: 'date',
    title: <Translate>Date</Translate>,
    dataKey: 'date',
    render: (row: any) =>
      row?.date ? (
        <span className="date-table-style">{formatDateWithoutSeconds(row.date)}</span>
      ) : (
        '-'
      )
  },
  {
    key: 'result',
    title: <Translate>Result</Translate>,
    dataKey: 'result'
  },
  {
    key: 'status',
    title: <Translate>Status</Translate>,
    dataKey: 'status',
    width: 100,
    render: (row: any) => (
      <MyBadgeStatus
        backgroundColor={'var(--light-green)'}
        color={'var(--primary-green)'}
        contant={row.status}
      />
    )
  }
];

const LaboratoryTable = () => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleLaboratoryData);

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

export default LaboratoryTable;
