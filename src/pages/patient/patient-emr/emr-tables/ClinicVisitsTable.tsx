import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';

const sampleClinicVisits = [
  {
    date: '2024-01-15T00:00:00Z',
    provider: 'Dr. Smith',
    clinic: 'Cardiac Care Center',
    reason: 'Follow-up HTN',
    duration: '30 min',
    notes: 'BP well controlled'
  },
  {
    date: '2024-01-08T00:00:00Z',
    provider: 'Dr. Johnson',
    clinic: 'Diabetes Center',
    reason: 'Routine Check',
    duration: '45 min',
    notes: 'A1C improved'
  },
  {
    date: '2023-12-20T00:00:00Z',
    provider: 'Dr. Brown',
    clinic: 'Primary Care',
    reason: 'Annual Physical',
    duration: '60 min',
    notes: 'Overall good health'
  }
];

const columns: ColumnConfig[] = [
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
    key: 'provider',
    title: <Translate>Provider</Translate>,
    dataKey: 'provider'
  },
  {
    key: 'clinic',
    title: <Translate>Clinic</Translate>,
    dataKey: 'clinic'
  },
  {
    key: 'reason',
    title: <Translate>Reason</Translate>,
    dataKey: 'reason'
  },
  {
    key: 'duration',
    title: <Translate>Duration</Translate>,
    dataKey: 'duration'
  },
  {
    key: 'notes',
    title: <Translate>Notes</Translate>,
    dataKey: 'notes'
  }
];

const ClinicVisitsTable = () => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleClinicVisits);

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

export default ClinicVisitsTable;
