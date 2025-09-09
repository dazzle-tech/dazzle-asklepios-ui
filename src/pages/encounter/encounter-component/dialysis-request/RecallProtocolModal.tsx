import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import './styles.less';

const initialProtocols = [
  {
    id: 1,
    protocolName: 'Standard Protocol A',
    createdBy: 'Dr. Ali',
    createdAt: '2025-09-01 10:00 AM',
    dialyzer: 'FX80',
    bloodFlow: '300',
    dialysateFlow: '700',
    composition: '138'
  },
  {
    id: 2,
    protocolName: 'Urgent Protocol B',
    createdBy: 'Nurse Lina',
    createdAt: '2025-09-02 02:30 PM',
    dialyzer: 'FX60',
    bloodFlow: '500',
    dialysateFlow: '600',
    composition: '140'
  }
];

const columns = [
  {
    key: 'protocolName',
    title: 'Protocol Name',
    dataKey: 'protocolName',
    width: 200
  },
  {
    key: 'createdByAt',
    title: 'Created By\\At',
    dataKey: 'createdByAt',
    width: 200,
    render: row => (
      <>
        {row.createdBy}
        <br />
        <span className="date-table-style">{row.createdAt}</span>
      </>
    )
  },
  {
    key: 'dialyzer',
    title: 'Dialyzer',
    dataKey: 'dialyzer',
    width: 150
  },
  {
    key: 'bloodFlow',
    title: 'Blood Flow',
    dataKey: 'bloodFlow',
    width: 130
  },
  {
    key: 'dialysateFlow',
    title: 'Dialysate Flow',
    dataKey: 'dialysateFlow',
    width: 150
  },
  {
    key: 'composition',
    title: 'Composition',
    dataKey: 'composition',
    width: 130
  }
];

const RecallProtocolModal = () => {
  const [data, setData] = useState(initialProtocols);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (aVal === bVal) return 0;
    return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
  });

  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);


  const isSelectedRow = row => {
    return row.id === selectedRowId ? 'selected-row' : '';
  };

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
      rowClassName={isSelectedRow}
      onRowClick={row => setSelectedRowId(row.id)}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={sortedData.length}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={e => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
    />
  );
};

export default RecallProtocolModal;
