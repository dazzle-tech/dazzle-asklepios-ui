import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const sampleMedicationsData = [
  {
    medication: 'Metformin 1000mg',
    frequency: 'Twice daily',
    prescriber: 'Dr. Smith',
    startDate: '2019-03-22T00:00:00Z',
    status: 'Active'
  },
  {
    medication: 'Lisinopril 10mg',
    frequency: 'Once daily',
    prescriber: 'Dr. Johnson',
    startDate: '2018-06-15T00:00:00Z',
    status: 'Active'
  },
  {
    medication: 'Albuterol Inhaler',
    frequency: 'As needed',
    prescriber: 'Dr. Brown',
    startDate: '2020-05-10T00:00:00Z',
    status: 'Active'
  }
];

const columns: ColumnConfig[] = [
  {
    key: 'medication',
    title: <Translate>Medication</Translate>,
    dataKey: 'medication'
  },
  {
    key: 'frequency',
    title: <Translate>Frequency</Translate>,
    dataKey: 'frequency'
  },
  {
    key: 'prescriber',
    title: <Translate>Prescriber</Translate>,
    dataKey: 'prescriber'
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
  }
];

const CurrentMedicationsTable = () => {
  const [sortColumn, setSortColumn] = useState('startDate');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleMedicationsData);

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

export default CurrentMedicationsTable;
