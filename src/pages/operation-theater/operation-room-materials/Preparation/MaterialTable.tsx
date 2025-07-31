//Declares
import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import TotalQuantitiesTable from './TotalQuantitiesTable';
import { formatDateWithoutSeconds } from '@/utils';
import { Checkbox } from 'rsuite';
import { Form } from 'rsuite';
import './styles.less';

//Table Data
const sampleData = [
  {
    id: 1,
    operationName: 'Appendectomy',
    priority: 'High',
    patientName: 'Farouk Dhelea',
    mrn: 'MRN001',
    requestedBy: 'Dr. Ahmad',
    requestedAt: '2025-07-29 08:30 AM',
    status: 'Pending'
  },
  {
    id: 2,
    operationName: 'Gallbladder Removal',
    priority: 'Medium',
    patientName: 'Qais Omar',
    mrn: 'MRN002',
    requestedBy: 'Dr. Lina',
    requestedAt: '2025-07-28 02:15 PM',
    status: 'Ready'
  },
  {
    id: 3,
    operationName: 'Appendectomy',
    priority: 'High',
    patientName: 'Farouk Dhelea',
    mrn: 'MRN001',
    requestedBy: 'Dr. Ahmad',
    requestedAt: '2025-07-29 08:30 AM',
    status: 'Pending'
  }
];

//Table coulmns Configure
const columns = [
  { key: 'operationName', title: 'Operation Name', dataKey: 'operationName', width: 200 },
  { key: 'priority', title: 'Priority', dataKey: 'priority', width: 100 },
  { key: 'patientName', title: 'Patient Name', dataKey: 'patientName', width: 180 },
  { key: 'mrn', title: 'MRN', dataKey: 'mrn', width: 120 },
  {
    key: 'requestedByAt',
    title: 'Requested By\\At',
    dataKey: 'requestedBy',
    width: 220,
    render: (row: any) =>
      row?.requestedAt ? (
        <>
          {row?.requestedBy}
          <br />
          <span className="date-table-style">{formatDateWithoutSeconds(row.requestedAt)}</span>{' '}
        </>
      ) : (
        ' '
      )
  },
  {
    key: 'status',
    title: 'Status',
    dataKey: 'status',
    width: 100,
    render: (row: any) => (
      <span className={row.status === 'Pending' ? 'status-pending' : 'status-approved'}>
        {row.status}
      </span>
    )
  }
];

//Declare the Variables
const RequestedProceduresTable = () => {
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

      <Checkbox>
        Implant
      </Checkbox>

      <Checkbox>
        Consumable
      </Checkbox>

      <Checkbox>
        Surgical Instrument
      </Checkbox>
    </div>
  </div>
      </Form>
    </>
  );

  return (
    <div>
      <div className="tables-row-positioning">
        <div className="material-table-size-position">
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
        <TotalQuantitiesTable></TotalQuantitiesTable>
      </div>
    </div>
  );
};

export default RequestedProceduresTable;
