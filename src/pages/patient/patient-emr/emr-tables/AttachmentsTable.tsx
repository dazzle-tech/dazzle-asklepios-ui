import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';

const sampleAttachmentsData = [];

const columns: ColumnConfig[] = [
  {
    key: 'fileName',
    title: <Translate>File Name</Translate>,
    dataKey: 'fileName'
  },
  {
    key: 'type',
    title: <Translate>Type</Translate>,
    dataKey: 'type'
  },
  {
    key: 'uploadDate',
    title: <Translate>Upload Date</Translate>,
    dataKey: 'uploadDate',
    render: (row: any) =>
      row?.uploadDate ? (
        <span className="date-table-style">{formatDateWithoutSeconds(row.uploadDate)}</span>
      ) : (
        '-'
      )
  },
  {
    key: 'size',
    title: <Translate>Size</Translate>,
    dataKey: 'size'
  },
  {
    key: 'uploadedBy',
    title: <Translate>Uploaded By</Translate>,
    dataKey: 'uploadedBy'
  }
];

const AttachmentsTable = () => {
  const [sortColumn, setSortColumn] = useState('uploadDate');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleAttachmentsData);

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

export default AttachmentsTable;
