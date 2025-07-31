//Declares
import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { Checkbox } from 'rsuite';
import { formatDateWithoutSeconds } from '@/utils';
import { Form } from 'rsuite';

//Table Data
const sampleData = [
  {
    id: 1,
    productType: 'Surgical Instrument',
    name: 'Scalpel',
    code: 'SI-001',
    plannedQuantity: '10 pcs',
    usedQuantity: '8 pcs',
    difference: '2 pcs',
    serialNumber: 'SN123456',
    usedBy: 'OR Room 3',
    usedAt: '2025-07-29 08:30 AM'
  },
  {
    id: 2,
    productType: 'Suture Material',
    name: 'Absorbable Suture',
    code: 'SM-102',
    plannedQuantity: '50 meters',
    usedQuantity: '45 meters',
    difference: '5 meters',
    serialNumber: 'SN654321',
    usedBy: 'OR Room 1',
    usedAt: '2025-07-28 02:15 PM'
  },
  {
    id: 3,
    productType: 'Implant',
    name: 'Hip Replacement',
    code: 'IM-770',
    plannedQuantity: '2 pcs',
    usedQuantity: '2 pcs',
    difference: '0 pcs',
    serialNumber: 'SN998877',
    usedBy: 'OR Room 2',
    usedAt: '2025-07-27 11:00 AM'
  }
];

//Table columns Configure
const columns = [
  { key: 'productType', title: 'Product Type', dataKey: 'productType', width: 180 },
  { key: 'name', title: 'Name', dataKey: 'name', width: 150 },
  { key: 'code', title: 'Code', dataKey: 'code', width: 100 },
  {
    key: 'plannedQuantity',
    title: 'Planned Quantity & UOM',
    dataKey: 'plannedQuantity',
    width: 180
  },
  { key: 'usedQuantity', title: 'Used Quantity & UOM', dataKey: 'usedQuantity', width: 180 },
  { key: 'difference', title: 'Difference', dataKey: 'difference', width: 100 },
  { key: 'serialNumber', title: 'Serial Number', dataKey: 'serialNumber', width: 150 },
  {
    key: 'usedByAt',
    title: 'Used By\\At',
    dataKey: 'usedByAt',
    width: 150,
    render: (row: any) =>
      row?.usedAt ? (
        <>
          {row?.usedBy}
          <br />
          <span className="date-table-style">{formatDateWithoutSeconds(row.usedAt)}</span>{' '}
        </>
      ) : (
        ' '
      )
  }
];

//Declare the Variables
const MaterialTableReconciliation = () => {
  const [sortColumn, setSortColumn] = useState('operationName');
  type SortType = 'asc' | 'desc';
  const [sortType, setSortType] = useState<SortType>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  //sorted Data
  const sortedData = [...sampleData].sort((a, b) => {
    const aVal = a[sortColumn as keyof typeof a];
    const bVal = b[sortColumn as keyof typeof b];
    if (aVal === bVal) return 0;
    return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
  });
  //Pagination
  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  //Table Filters(Header)
  const filters = (
    <>
      <Form fluid>
        <div
          className="material-table-filter-table-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h5 className="operation-materials-table-header" style={{ margin: 0 }}>
            Operation Materials
          </h5>

          <div
            className="check-boxes-material-table-positions"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <Checkbox>Implant</Checkbox>

            <Checkbox>Consumable</Checkbox>

            <Checkbox>Surgical Instrument</Checkbox>
          </div>
        </div>
      </Form>
    </>
  );

  return (
    <div>
      <div className="tables-row-positioning">
        <div className="reconciliation-material-table-size-position">
          <MyTable
            data={paginatedData}
            columns={columns}
            loading={false}
            filters={filters}
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
      </div>
    </div>
  );
};

export default MaterialTableReconciliation;
