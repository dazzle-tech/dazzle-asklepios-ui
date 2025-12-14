import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const sampleOperationsData = [];

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
    key: 'operation',
    title: <Translate>Operation</Translate>,
    dataKey: 'operation'
  },
  {
    key: 'surgeon',
    title: <Translate>Surgeon</Translate>,
    dataKey: 'surgeon'
  },
  {
    key: 'type',
    title: <Translate>Type</Translate>,
    dataKey: 'type'
  },
  {
    key: 'duration',
    title: <Translate>Duration</Translate>,
    dataKey: 'duration'
  },
  {
    key: 'anesthesia',
    title: <Translate>Anesthesia</Translate>,
    dataKey: 'anesthesia'
  },
  {
    key: 'outcome',
    title: <Translate>Outcome</Translate>,
    dataKey: 'outcome',
    width: 150,
    render: (row: any) => {
      const outcome = row.outcome;

      let bgColor = 'var(--light-gray)';
      let color = 'var(--dark-gray)';

      if (outcome === 'Successful') {
        bgColor = 'var(--light-green)';
        color = 'var(--primary-green)';
      } else if (outcome === 'Complication') {
        bgColor = 'var(--light-orange)';
        color = 'var(--primary-orange)';
      } else if (outcome === 'Cancelled') {
        bgColor = 'var(--light-pink)';
        color = 'var(--primary-pink)';
      } else if (outcome === 'Pending') {
        bgColor = 'var(--light-blue)';
        color = 'var(--primary-blue)';
      }

      return (
        <div style={{ textAlign: 'center' }}>
          <MyBadgeStatus backgroundColor={bgColor} color={color} contant={outcome} />
        </div>
      );
    }
  }
];

const OperationsTable = () => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleOperationsData);

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

export default OperationsTable;
