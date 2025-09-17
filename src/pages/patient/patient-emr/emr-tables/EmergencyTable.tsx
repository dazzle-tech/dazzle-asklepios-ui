import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const sampleEmergencyData = [
  {
    dateTime: '2023-11-15T02:15:00Z',
    chiefComplaint: 'Chest Pain',
    triage: 'ESI 2',
    provider: 'Dr. Emergency',
    disposition: 'Admitted',
    duration: '4h 30m'
  },
  {
    dateTime: '2023-08-22T23:30:00Z',
    chiefComplaint: 'Shortness of Breath',
    triage: 'ESI 3',
    provider: 'Dr. Night',
    disposition: 'Discharged',
    duration: '2h 45m'
  },
  {
    dateTime: '2023-05-10T18:45:00Z',
    chiefComplaint: 'Fall with Injury',
    triage: 'ESI 4',
    provider: 'Dr. Trauma',
    disposition: 'Discharged',
    duration: '3h 15m'
  }
];

const columns: ColumnConfig[] = [
  {
    key: 'dateTime',
    title: <Translate>Date & Time</Translate>,
    dataKey: 'dateTime',
    render: (row: any) =>
      row?.dateTime ? (
        <span className="date-table-style">{formatDateWithoutSeconds(row.dateTime)}</span>
      ) : (
        '-'
      )
  },
  {
    key: 'chiefComplaint',
    title: <Translate>Chief Complaint</Translate>,
    dataKey: 'chiefComplaint'
  },
{
  key: 'triage',
  title: <Translate>Triage</Translate>,
  dataKey: 'triage',
  width: 120,
  render: (row: any) => {
    const triage = row.triage;

    const bgColor =
      triage === 'ESI 1'
        ? 'var(--light-red)'
        : triage === 'ESI 2'
        ? 'var(--light-orange)'
        : triage === 'ESI 3'
        ? 'var(--light-yellow)'
        : triage === 'ESI 4'
        ? 'var(--light-pink)'
        : 'var(--light-gray)';

    const color =
      triage === 'ESI 1'
        ? 'var(--primary-red)'
        : triage === 'ESI 2'
        ? 'var(--primary-orange)'
        : triage === 'ESI 3'
        ? 'var(--primary-yellow)'
        : triage === 'ESI 4'
        ? 'var(--primary-pink)'
        : 'var(--dark-gray)';

    return <MyBadgeStatus backgroundColor={bgColor} color={color} contant={triage} />;
  }
},
  {
    key: 'provider',
    title: <Translate>Provider</Translate>,
    dataKey: 'provider'
  },
  {
    key: 'disposition',
    title: <Translate>Disposition</Translate>,
    dataKey: 'disposition',
    width: 120,
    render: (row: any) => {
      const bgColor =
        row.disposition === 'Admitted'
          ? 'var(--light-green)'
          : row.disposition === 'Discharged'
          ? 'var(--light-pink)'
          : 'var(--primary-pink)';

      const color =
        row.disposition === 'Admitted'
          ? 'var(--primary-green)'
          : row.disposition === 'Discharged'
          ? 'var(--primary-pink)'
          : 'var(--primary-pink)';

      return (
        <MyBadgeStatus backgroundColor={bgColor} color={color} contant={row.disposition} />
      );
    }
  },
  {
    key: 'duration',
    title: <Translate>Duration</Translate>,
    dataKey: 'duration'
  }
];

const EmergencyTable = () => {
  const [sortColumn, setSortColumn] = useState('dateTime');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleEmergencyData);

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

export default EmergencyTable;
