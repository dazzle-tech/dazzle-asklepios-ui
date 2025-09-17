import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';

const sampleInpatientData = [
  {
    admission: '2023-11-15T00:00:00Z',
    discharge: '2023-11-18T00:00:00Z',
    ward: 'Cardiology ICU',
    diagnosis: 'Acute MI',
    physician: 'Dr. Smith',
    los: '3 days'
  },
  {
    admission: '2022-08-10T00:00:00Z',
    discharge: '2022-08-12T00:00:00Z',
    ward: 'General Medicine',
    diagnosis: 'Diabetic Ketoacidosis',
    physician: 'Dr. Johnson',
    los: '2 days'
  },
  {
    admission: '2021-03-05T00:00:00Z',
    discharge: '2021-03-07T00:00:00Z',
    ward: 'Respiratory Unit',
    diagnosis: 'Pneumonia',
    physician: 'Dr. Williams',
    los: '2 days'
  }
];

const columns: ColumnConfig[] = [
  {
    key: 'admission',
    title: <Translate>Admission</Translate>,
    dataKey: 'admission',
    render: (row: any) =>
      row?.admission ? (
        <span className="date-table-style">{formatDateWithoutSeconds(row.admission)}</span>
      ) : (
        '-'
      )
  },
  {
    key: 'discharge',
    title: <Translate>Discharge</Translate>,
    dataKey: 'discharge',
    render: (row: any) =>
      row?.discharge ? (
        <span className="date-table-style">{formatDateWithoutSeconds(row.discharge)}</span>
      ) : (
        '-'
      )
  },
  {
    key: 'ward',
    title: <Translate>Ward</Translate>,
    dataKey: 'ward'
  },
  {
    key: 'diagnosis',
    title: <Translate>Diagnosis</Translate>,
    dataKey: 'diagnosis'
  },
  {
    key: 'physician',
    title: <Translate>Physician</Translate>,
    dataKey: 'physician'
  },
  {
    key: 'los',
    title: <Translate>LOS</Translate>,
    dataKey: 'los'
  }
];

const InpatientTable = () => {
  const [sortColumn, setSortColumn] = useState('admission');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleInpatientData);

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

export default InpatientTable;
