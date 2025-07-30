//Declares
import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import TotalQuantitiesTable from './TotalQuantitiesTable';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
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
    width: 220
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
  const [record, setRecord] = useState({});
  const [sortColumn, setSortColumn] = useState('operationName');
  type SortType = 'asc' | 'desc';
  const [sortType, setSortType] = useState<SortType>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

//List Of Values
  const { data: materialLovQueryResponse } = useGetLovValuesByCodeQuery('OPERATION_MATERIAL_TYPES');
  const dataOfMaterial =
    materialLovQueryResponse?.object?.map(item => ({
      label: item.lovDisplayVale,
      value: item.valueCode
    })) || [];

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
    <Form fluid>
            <h5 className="operation-materials-table-header">Operation Materials</h5>

      <MyInput
        className="multipicker-select-input"
        showLabel={false}
        fieldType="checkPicker"
        fieldName="selected"
        selectData={dataOfMaterial}
        selectDataLabel="label"
        selectDataValue="value"
        record={record}
        setRecord={setRecord}
        width={250}
      />
    </Form>
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
