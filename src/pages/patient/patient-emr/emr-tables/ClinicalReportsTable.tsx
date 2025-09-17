import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const sampleReportsData = [
  {
    reportType: 'Discharge Summary',
    date: '2023-11-18T00:00:00Z',
    provider: 'Dr. Smith',
    subject: 'Acute MI Management',
    pages: 3,
    status: 'Final'
  },
  {
    reportType: 'Consultation Report',
    date: '2024-01-12T00:00:00Z',
    provider: 'Dr. Cardio',
    subject: 'Cardiology Evaluation',
    pages: 2,
    status: 'Final'
  },
  {
    reportType: 'Operative Report',
    date: '2022-06-15T00:00:00Z',
    provider: 'Dr. Surgeon',
    subject: 'Laparoscopic Appendectomy',
    pages: 4,
    status: 'Final'
  },
  {
    reportType: 'Pathology Report',
    date: '2023-11-20T00:00:00Z',
    provider: 'Dr. Patho',
    subject: 'Skin Biopsy Results',
    pages: 1,
    status: 'Final'
  }
];

const columns: ColumnConfig[] = [
  {
    key: 'reportType',
    title: <Translate>Report Type</Translate>,
    dataKey: 'reportType'
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
    key: 'provider',
    title: <Translate>Provider</Translate>,
    dataKey: 'provider'
  },
  {
    key: 'subject',
    title: <Translate>Subject</Translate>,
    dataKey: 'subject'
  },
  {
    key: 'pages',
    title: <Translate>Pages</Translate>,
    dataKey: 'pages'
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

const ClinicalReportsTable = () => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleReportsData);

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

export default ClinicalReportsTable;
