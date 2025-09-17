import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const sampleDentalChartsData = [
  {
    tooth: '#1 (Upper Right 3rd Molar)',
    condition: 'Extracted',
    date: '2020-05-15T00:00:00Z',
    provider: 'Dr. Dentist',
    notes: 'Impacted wisdom tooth'
  },
  {
    tooth: '#3 (Upper Right 1st Molar)',
    condition: 'Crown',
    date: '2022-03-10T00:00:00Z',
    provider: 'Dr. Dentist',
    notes: 'Porcelain crown placed'
  },
  {
    tooth: '#14 (Upper Left 1st Premolar)',
    condition: 'Filling',
    date: '2023-08-20T00:00:00Z',
    provider: 'Dr. Dentist',
    notes: 'Composite restoration'
  },
  {
    tooth: '#19 (Lower Left 1st Molar)',
    condition: 'Root Canal',
    date: '2021-11-05T00:00:00Z',
    provider: 'Dr. Endo',
    notes: 'Endodontic treatment completed'
  },
  {
    tooth: '#30 (Lower Right 1st Molar)',
    condition: 'Cavity',
    date: '2024-01-15T00:00:00Z',
    provider: 'Dr. Dentist',
    notes: 'Small caries noted, filling scheduled'
  }
];

const columns: ColumnConfig[] = [
  {
    key: 'tooth',
    title: <Translate>Tooth</Translate>,
    dataKey: 'tooth'
  },
 {
    key: 'condition',
    title: <Translate>Condition</Translate>,
    dataKey: 'condition',
    render: (row: any) => {
      let bgColor = 'var(--light-gray)';
      let color = 'var(--dark-gray)';

      switch (row.condition.toLowerCase()) {
        case 'extracted':
          bgColor = 'var(--light-red)';
          color = 'var(--primary-red)';
          break;
        case 'crown':
          bgColor = 'var(--light-orange)';
          color = 'var(--orange)';
          break;
        case 'filling':
          bgColor = 'var(--light-blue)';
          color = 'var(--primary-blue)';
          break;
        case 'cavity':
          bgColor = 'var(--light-pink)';
          color = 'var(--primary-pink)';
          break;
        default:
          bgColor = 'var(--icon-gray)';
          color = 'var(--light-dark)';
      }

      return (
        <MyBadgeStatus
          backgroundColor={bgColor}
          color={color}
          contant={row.condition}
        />
      );
    }
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
    key: 'notes',
    title: <Translate>Notes</Translate>,
    dataKey: 'notes'
  }
];

const DentalChartsTable = () => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleDentalChartsData);

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

export default DentalChartsTable;
