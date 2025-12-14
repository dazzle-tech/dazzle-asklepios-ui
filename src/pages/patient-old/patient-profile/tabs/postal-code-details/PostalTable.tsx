import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';

const postalData = [
  { id: 1, state: 'Palestine', city: 'Ramallah', street: 'Alersal', postalCode: '309' },
  { id: 2, state: 'Palestine', city: 'Jenin', street: 'Arabah', postalCode: '310' },
  { id: 3, state: 'Palestine', city: 'Nablus', street: 'Rafidia', postalCode: '300' },
  { id: 4, state: 'Palestine', city: 'Tulkarm', street: 'Shwekah', postalCode: '303' },
  { id: 5, state: 'Palestine', city: 'Jeruslem', street: 'Silwan', postalCode: '307' }
];

const columns: ColumnConfig[] = [
  { key: 'state', title: 'State', dataKey: 'state' },
  { key: 'city', title: 'City', dataKey: 'city' },
  { key: 'street', title: 'Street', dataKey: 'street' }
];

const PostalTable = ({ onRowClick }) => {
  const [sortColumn, setSortColumn] = useState('state');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const sortedData = [...postalData].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    if (aValue === bValue) return 0;
    return sortType === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
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
      totalCount={postalData.length}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={e => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
      onRowClick={onRowClick}
    />
  );
};

export default PostalTable;
