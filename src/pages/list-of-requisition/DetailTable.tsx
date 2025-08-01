import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
//Table Static Data
import { sampleData } from './OpenDetailsTableModal';

//Columns Configure Table
const columns: ColumnConfig[] = [
  { key: 'itemName', title: 'Item Name', dataKey: 'itemName' },
  { key: 'itemCode', title: 'Item Code', dataKey: 'itemCode' },
  { key: 'unitOfMeasurement', title: 'Unit of Measurement', dataKey: 'unitOfMeasurement' },
  { key: 'quantity', title: 'Quantity', dataKey: 'quantity' },
  {
    key: 'lastPurchasedDate',
    title: 'Last Purchased Date',
    dataKey: 'lastPurchasedDate',
    render: (row: any) =>
      row?.lastPurchasedDate ? (
        <>
          <span className="date-table-style">
            {formatDateWithoutSeconds(row.lastPurchasedDate)}
          </span>
        </>
      ) : (
        ' '
      )
  },
  { key: 'maxmanQuantity', title: 'Max Quantity', dataKey: 'maxmanQuantity' },
  { key: 'minimumQuantity', title: 'Min Quantity', dataKey: 'minimumQuantity' },
  { key: 'specs', title: 'Specs', dataKey: 'specs' },
  {
    key: 'status',
    title: 'Status',
    dataKey: 'status',
    render: (row: any) => (
      <MyBadgeStatus
        backgroundColor={
          row.status === 'Available' ? 'var(--light-green)' : 'var(--background-gray)'
        }
        color={row.status === 'Available' ? 'var(--primary-green)' : 'var(--primary-gray)'}
        contant={row.status}
      />
    )
  },
  {
    key: 'approvalStatus',
    title: 'Approval Status',
    dataKey: 'approvalStatus',
    render: (row: any) => (
      <MyBadgeStatus
        backgroundColor={
          row.approvalStatus === 'Approved' ? 'var(--light-green)' : 'var(--background-gray)'
        }
        color={row.approvalStatus === 'Approved' ? 'var(--primary-green)' : 'var(--primary-gray)'}
        contant={row.approvalStatus}
      />
    )
  },
  { key: 'note', title: 'Note', dataKey: 'note', expandable: true },
  {
    key: 'itemClassification',
    title: 'Classification',
    dataKey: 'itemClassification',
    expandable: true
  },
  {
    key: 'acceptDateTime',
    title: 'Accepted By/At',
    dataKey: 'acceptDateTime',
    expandable: true,
    render: (row: any) =>
      row?.acceptDateTime ? (
        <>
          {row?.acceptBy}
          <br />
          <span className="date-table-style">
            {formatDateWithoutSeconds(row.acceptDateTime)}
          </span>{' '}
        </>
      ) : (
        ' '
      )
  },
  {
    key: 'Approved At/By',
    title: 'Approved At/By',
    dataKey: 'ApprovedAtBy',
    expandable: true,
    render: (row: any) =>
      row?.approvedDate ? (
        <>
          <span className="date-table-style">{row.approvedBy}</span>
          <br />
          <span className="date-table-style">{formatDateWithoutSeconds(row.approvedDate)}</span>
        </>
      ) : (
        ' '
      )
  },

  { key: 'approvalNote', title: 'Approval Note', dataKey: 'approvalNote', expandable: true }
];
//Declares
const DetailTable = () => {
  const [sortColumn, setSortColumn] = useState('itemName');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleData);

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

export default DetailTable;
