//Declares
import React, { useState } from 'react';
import MyTable from '@/components/MyTable';

//Table Data
const sampleData = [
  {
    id: 1,
    productType: 'Surgical',
    name: 'Scalpel',
    code: 'SRG001',
    quantity: 10,
    uom: 'pcs',
    operationName: 'Appendectomy'
  },
  {
    id: 2,
    productType: 'Medication',
    name: 'Morphine',
    code: 'MED123',
    quantity: 2,
    uom: 'vials',
    operationName: 'Pain Management'
  },
  {
    id: 3,
    productType: 'Tool',
    name: 'Clamp',
    code: 'TL045',
    quantity: 4,
    uom: 'pcs',
    operationName: 'Gallbladder Removal'
  }
];

  //Table coulmns Configure
const columns = [
  {
    key: 'productType',
    title: 'Product Type',
    dataKey: 'productType',
    width: 150
  },
  {
    key: 'name',
    title: 'Name',
    dataKey: 'name',
    width: 150
  },
  {
    key: 'quantityUOM',
    title: 'Quantity & UOM',
    dataKey: 'quantityUOM',
    width: 160,
    render: row => (
      <span>
        {row.quantity} {row.uom}
      </span>
    )
  }
];

//Declare the Variables
const TotalQuantitiesTable = () => {
  const [sortColumn, setSortColumn] = useState('operationName');
  type SortType = 'asc' | 'desc';
  const [sortType, setSortType] = useState<SortType>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

//sorted Data
  const sortedData = [...sampleData].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (aVal === bVal) return 0;
    return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
  });

//Pagination
  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  return (
    <div className="total-quantities-table-size">
      <MyTable
        data={paginatedData}
        columns={columns}
        loading={false}
        filters={<h5 className="total-quantities-table-header">Total Counts</h5>}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={(col, type) => {
          setSortColumn(col);
          setSortType(type);
        }}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={sortedData.length}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={e => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </div>
  );
};

export default TotalQuantitiesTable;
