import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const sampleConsultationsData = [
  {
    date: '2024-01-12T00:00:00Z',
    consultant: 'Dr. Cardio',
    specialty: 'Cardiology',
    reason: 'Chest pain evaluation',
    recommendations: 'Continue current meds',
    status: 'Completed'
  },
  {
    date: '2024-01-08T00:00:00Z',
    consultant: 'Dr. Endo',
    specialty: 'Endocrinology',
    reason: 'Diabetes management',
    recommendations: 'Increase metformin',
    status: 'Completed'
  },
  {
    date: '2024-01-20T00:00:00Z',
    consultant: 'Dr. Ortho',
    specialty: 'Orthopedics',
    reason: 'Knee pain',
    recommendations: 'Physical therapy',
    status: 'Scheduled'
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
    key: 'consultant',
    title: <Translate>Consultant</Translate>,
    dataKey: 'consultant'
  },
  {
    key: 'specialty',
    title: <Translate>Specialty</Translate>,
    dataKey: 'specialty'
  },
  {
    key: 'reason',
    title: <Translate>Reason</Translate>,
    dataKey: 'reason'
  },
  {
    key: 'recommendations',
    title: <Translate>Recommendations</Translate>,
    dataKey: 'recommendations'
  },
  {
    key: 'status',
    title: <Translate>Status</Translate>,
    dataKey: 'status',
    width: 120,
    render: (row: any) => {
      const bgColor =
        row.status === 'Completed'
          ? 'var(--light-green)'
          : row.status === 'Scheduled'
          ? 'var(--light-pink)'
          : 'var(--primary-pink)';

      const color =
        row.status === 'Completed'
          ? 'var(--primary-green)'
          : row.status === 'Scheduled'
          ? 'var(--primary-pink)'
          : 'var(--primary-pink)';

      return (
        <MyBadgeStatus backgroundColor={bgColor} color={color} contant={row.status} />
      );
    }
  }
];

const ConsultationsTable = () => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleConsultationsData);

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

export default ConsultationsTable;
