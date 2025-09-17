import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const sampleRadiologyData = [
  {
    study: 'Chest X-Ray',
    date: '2024-01-12T00:00:00Z',
    radiologist: 'Dr. Radio',
    technique: 'PA/Lateral',
    status: 'Final',
    findings: 'No acute findings'
  },
  {
    study: 'Echocardiogram',
    date: '2024-01-08T00:00:00Z',
    radiologist: 'Dr. Echo',
    technique: 'Transthoracic',
    status: 'Final',
    findings: 'Normal EF 60%'
  },
  {
    study: 'CT Abdomen/Pelvis',
    date: '2023-12-15T00:00:00Z',
    radiologist: 'Dr. Radio',
    technique: 'With contrast',
    status: 'Final',
    findings: 'No acute pathology'
  }
];

const columns: ColumnConfig[] = [
  {
    key: 'study',
    title: <Translate>Study</Translate>,
    dataKey: 'study'
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
    key: 'radiologist',
    title: <Translate>Radiologist</Translate>,
    dataKey: 'radiologist'
  },
  {
    key: 'technique',
    title: <Translate>Technique</Translate>,
    dataKey: 'technique'
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
    key: 'findings',
    title: <Translate>Findings</Translate>,
    dataKey: 'findings'
  }
];

const RadiologyTable = () => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleRadiologyData);

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

export default RadiologyTable;
