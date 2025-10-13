import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const sampleVaccinationData = [];

const columns: ColumnConfig[] = [
  {
    key: 'vaccine',
    title: <Translate>Vaccine</Translate>,
    dataKey: 'vaccine'
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
    key: 'dose',
    title: <Translate>Dose</Translate>,
    dataKey: 'dose'
  },
  {
    key: 'lotNumber',
    title: <Translate>Lot Number</Translate>,
    dataKey: 'lotNumber'
  },
  {
    key: 'site',
    title: <Translate>Site</Translate>,
    dataKey: 'site'
  },
  {
    key: 'provider',
    title: <Translate>Provider</Translate>,
    dataKey: 'provider'
  },
  {
    key: 'reaction',
    title: <Translate>Reaction</Translate>,
    dataKey: 'reaction',
    width: 160,
    render: (row: any) => {
      const reaction = row.reaction?.toLowerCase();

      let bgColor = 'var(--light-gray)';
      let color = 'var(--dark-gray)';

      if (reaction === 'none') {
        bgColor = 'var(--light-green)';
        color = 'var(--primary-green)';
      } else if (reaction.includes('mild')) {
        bgColor = 'var(--light-orange)';
        color = 'var(--primary-orange)';
      } else if (reaction.includes('severe')) {
        bgColor = 'var(--light-red)';
        color = 'var(--primary-red)';
      }

      return (
        <div style={{ textAlign: 'center' }}>
          <MyBadgeStatus backgroundColor={bgColor} color={color} contant={row.reaction} />
        </div>
      );
    }
  }
];

const VaccinationTable = () => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleVaccinationData);

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

export default VaccinationTable;
