import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';

const sampleLedgerData = [
  {
    date: '2024-01-15T00:00:00Z',
    description: 'Office Visit - Dr. Smith',
    charges: 250.0,
    insurance: 50.0,
    payments: 200.0,
    balance: 0.0
  },
  {
    date: '2024-01-10T00:00:00Z',
    description: 'Laboratory Tests',
    charges: 180.0,
    insurance: 36.0,
    payments: 144.0,
    balance: 0.0
  },
  {
    date: '2024-01-08T00:00:00Z',
    description: 'Specialist Consultation',
    charges: 350.0,
    insurance: 70.0,
    payments: 280.0,
    balance: 0.0
  },
  {
    date: '2023-12-20T00:00:00Z',
    description: 'Annual Physical Exam',
    charges: 400.0,
    insurance: 80.0,
    payments: 320.0,
    balance: 0.0
  },
  {
    date: '2023-11-15T00:00:00Z',
    description: 'Emergency Room Visit',
    charges: 1250.0,
    insurance: 250.0,
    payments: 1000.0,
    balance: 0.0
  }
];

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

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
    key: 'description',
    title: <Translate>Description</Translate>,
    dataKey: 'description'
  },
  {
    key: 'charges',
    title: <Translate>Charges</Translate>,
    dataKey: 'charges',
    render: (row: any) => formatCurrency(row.charges)
  },
  {
    key: 'insurance',
    title: <Translate>Insurance</Translate>,
    dataKey: 'insurance',
    render: (row: any) => formatCurrency(row.insurance)
  },
  {
    key: 'payments',
    title: <Translate>Payments</Translate>,
    dataKey: 'payments',
    render: (row: any) => formatCurrency(row.payments)
  },
  {
    key: 'balance',
    title: <Translate>Balance</Translate>,
    dataKey: 'balance',
    render: (row: any) => formatCurrency(row.balance)
  }
];

const LedgerAccountTable = () => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleLedgerData);

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

export default LedgerAccountTable;
