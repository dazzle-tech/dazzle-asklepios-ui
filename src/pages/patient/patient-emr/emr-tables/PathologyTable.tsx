import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const samplePathologyData = [
  {
    specimen: 'Skin Biopsy',
    date: '2023-11-20T00:00:00Z',
    pathologist: 'Dr. Patho',
    location: 'Left arm',
    status: 'Final',
    diagnosis: 'Benign nevus'
  },
  {
    specimen: 'Colonoscopy Biopsy',
    date: '2023-10-20T00:00:00Z',
    pathologist: 'Dr. Patho',
    location: 'Sigmoid colon',
    status: 'Final',
    diagnosis: 'Hyperplastic polyp'
  },
  {
    specimen: 'Thyroid Nodule FNA',
    date: '2023-09-15T00:00:00Z',
    pathologist: 'Dr. Cytology',
    location: 'Right lobe',
    status: 'Final',
    diagnosis: 'Benign thyroid tissue'
  }
];

const columns: ColumnConfig[] = [
  {
    key: 'specimen',
    title: <Translate>Specimen</Translate>,
    dataKey: 'specimen'
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
    key: 'pathologist',
    title: <Translate>Pathologist</Translate>,
    dataKey: 'pathologist'
  },
  {
    key: 'location',
    title: <Translate>Location</Translate>,
    dataKey: 'location'
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
    key: 'diagnosis',
    title: <Translate>Diagnosis</Translate>,
    dataKey: 'diagnosis'
  }
];

const PathologyTable = () => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(samplePathologyData);

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

export default PathologyTable;
