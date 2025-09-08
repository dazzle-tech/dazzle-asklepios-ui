import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const sampleEncounterLogs = [
  {
    encounterDate: '2025-09-01T08:00:00Z',
    patientName: 'Ali Ahmad',
    mrn: 'MRN100001',
    plannedDischargeDate: '2025-09-05T15:00:00Z',
    transferDate: '2025-09-03T13:00:00Z',
    transferFrom: { name: 'ICU' },
    transferTo: { name: 'Ward C' },
    status: 'Discharged',
    dischargeDate: '2025-09-06T10:00:00Z'
  },
  {
    encounterDate: '2025-08-22T09:15:00Z',
    patientName: 'Mona Khaled',
    mrn: 'MRN100002',
    plannedDischargeDate: '2025-08-28T11:00:00Z',
    transferDate: '2025-08-25T16:30:00Z',
    transferFrom: { name: 'Ward A' },
    transferTo: { name: 'Ward B' },
    status: 'Completed',
    dischargeDate: '2025-08-29T14:45:00Z'
  }
];


const columns: ColumnConfig[] = [
  {
    key: 'encounterDate',
    title: <Translate>Encounter Date</Translate>,
    dataKey: 'encounterDate',
    render: (row: any) =>
      row?.encounterDate ? (
        <span className="date-table-style">{formatDateWithoutSeconds(row.encounterDate)}</span>
      ) : (
        '-'
      )
  },
  {
    key: 'patientName',
    title: <Translate>Patient Name</Translate>,
    dataKey: 'patientName'
  },
  {
    key: 'mrn',
    title: <Translate>MRN</Translate>,
    dataKey: 'mrn'
  },
  {
    key: 'plannedDischargeDate',
    title: <Translate>Planned Discharge Date</Translate>,
    dataKey: 'plannedDischargeDate',
    render: (row: any) =>
      row?.plannedDischargeDate ? (
        <span className="date-table-style">{formatDateWithoutSeconds(row.plannedDischargeDate)}</span>
      ) : (
        '-'
      )
  },
  {
    key: 'transferDate',
    title: <Translate>Transfer Date</Translate>,
    dataKey: 'transferDate',
    render: (row: any) =>
      row?.transferDate ? (
        <span className="date-table-style">{formatDateWithoutSeconds(row.transferDate)}</span>
      ) : (
        '-'
      )
  },
  {
    key: 'fromTo',
    title: <Translate>From - To</Translate>,
    dataKey: 'fromTo',
    render: (row: any) =>
      `${row?.transferFrom?.name ?? '-'} / ${row?.transferTo?.name ?? '-'}`
  },
{
  key: 'status',
  title: 'Status',
  dataKey: 'status',
  width: 100,
  render: (row: any) => (
    <MyBadgeStatus
      backgroundColor={
        row.status === 'Completed'
          ? 'var(--light-green)'
          : row.status === 'Discharged'
          ? 'var(--light-pink)'
          : 'var(--primary-pink)'
      }
      color={
        row.status === 'Completed'
          ? 'var(--primary-green)'
          : row.status === 'Discharged'
          ? 'var(--primary-pink)'
          : 'var(--primary-pink)'
      }
      contant={row.status}
    />
  )
},
  {
    key: 'dischargeDate',
    title: <Translate>Discharge Date</Translate>,
    dataKey: 'dischargeDate',
    render: (row: any) =>
      row?.dischargeDate ? (
        <span className="date-table-style">{formatDateWithoutSeconds(row.dischargeDate)}</span>
      ) : (
        '-'
      )
  }
];

const EncounterLogsTable = () => {
  const [sortColumn, setSortColumn] = useState('encounterDate');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleEncounterLogs);

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

export default EncounterLogsTable;
