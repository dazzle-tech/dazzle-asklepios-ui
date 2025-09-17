import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const sampleHistoryData = [
  {
    condition: 'Hypertension',
    dateDiagnosed: '2018-06-15T00:00:00Z',
    status: 'Active',
    severity: 'Moderate'
  },
  {
    condition: 'Type 2 Diabetes',
    dateDiagnosed: '2019-03-22T00:00:00Z',
    status: 'Active',
    severity: 'Well Controlled'
  },
  {
    condition: 'Asthma',
    dateDiagnosed: '2010-11-08T00:00:00Z',
    status: 'Active',
    severity: 'Mild'
  },
  {
    condition: 'Osteoarthritis',
    dateDiagnosed: '2020-09-12T00:00:00Z',
    status: 'Active',
    severity: 'Moderate'
  }
];

const columns: ColumnConfig[] = [
  {
    key: 'condition',
    title: <Translate>Condition</Translate>,
    dataKey: 'condition'
  },
  {
    key: 'dateDiagnosed',
    title: <Translate>Date Diagnosed</Translate>,
    dataKey: 'dateDiagnosed',
    render: (row: any) =>
      row?.dateDiagnosed ? (
        <span className="date-table-style">{formatDateWithoutSeconds(row.dateDiagnosed)}</span>
      ) : (
        '-'
      )
  },
  {
    key: 'status',
    title: <Translate>Status</Translate>,
    dataKey: 'status',
    width: 100,
    render: (row: any) => (
      <MyBadgeStatus
        backgroundColor="var(--light-green)"
        color="var(--primary-green)"
        contant={row.status}
      />
    )
  },
  {
    key: 'severity',
    title: <Translate>Severity</Translate>,
    dataKey: 'severity'
  }
];

const PastMedicalHistoryTable = () => {
  const [sortColumn, setSortColumn] = useState('dateDiagnosed');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleHistoryData);

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

export default PastMedicalHistoryTable;
