import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const sampleDayCaseData = [
  {
    date: '2023-10-20T00:00:00Z',
    procedure: 'Colonoscopy',
    physician: 'Dr. Gastro',
    facility: 'Endoscopy Suite',
    status: 'Completed',
    duration: '2h 30m'
  },
  {
    date: '2023-07-15T00:00:00Z',
    procedure: 'Cataract Surgery',
    physician: 'Dr. Ophtha',
    facility: 'Day Surgery',
    status: 'Completed',
    duration: '1h 45m'
  },
  {
    date: '2024-02-12T00:00:00Z',
    procedure: 'Upper Endoscopy',
    physician: 'Dr. Gastro',
    facility: 'Endoscopy Suite',
    status: 'Scheduled',
    duration: '1h 30m'
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
    key: 'procedure',
    title: <Translate>Procedure</Translate>,
    dataKey: 'procedure'
  },
  {
    key: 'physician',
    title: <Translate>Physician</Translate>,
    dataKey: 'physician'
  },
  {
    key: 'facility',
    title: <Translate>Facility</Translate>,
    dataKey: 'facility'
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
  },
  {
    key: 'duration',
    title: <Translate>Duration</Translate>,
    dataKey: 'duration'
  }
];

const DayCaseTable = () => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleDayCaseData);

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

export default DayCaseTable;
