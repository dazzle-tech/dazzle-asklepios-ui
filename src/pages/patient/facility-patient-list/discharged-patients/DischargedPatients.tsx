import React, { useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import '../styles.less';
import MyButton from '@/components/MyButton/MyButton';

const dummyRow = {
  fullName: 'Ali Hassan',
  patientMrn: 'MRN567890',
  age: 60,
  genderLvalue: { lovDisplayVale: 'Male' },
  encounterTypeLvalue: { lovDisplayVale: 'Inpatient' },
  departmentName: 'Neurology',
  responsiblePhysician: { fullName: 'Dr. Layla' },
  admissionBy: 'Nurse Zain',
  admissionAt: '2025-08-05 08:00',
  dischargeBy: 'Dr. Layla',
  dischargeAt: '2025-08-10 14:30',
  dischargeType: 'Planned',
  patientBalance: 120.75
};

const columns = [
  { key: 'fullName', title: 'Patient Name', dataKey: 'fullName' },
  { key: 'patientMrn', title: 'MRN', dataKey: 'patientMrn' },
  { key: 'age', title: 'Age', dataKey: 'age' },
  {
    key: 'gender',
    title: 'Sex at Birth',
    dataKey: 'genderLvalue.lovDisplayVale'
  },
  {
    key: 'encounterType',
    title: 'Encounter Type',
    dataKey: 'encounterTypeLvalue.lovDisplayVale'
  },
  { key: 'departmentName', title: 'Department', dataKey: 'departmentName' },
  {
    key: 'responsiblePhysician',
    title: 'Responsible Physician',
    render: rowData => rowData.responsiblePhysician?.fullName || '-'
  },
  {
    key: 'admissionByAt',
    title: 'Admission By\\At',
    render: rowData => (
      <>
        {rowData.admissionBy}<br />
        <span className="date-table-style">{rowData.admissionAt}</span>
      </>
    )
  },
  {
    key: 'dischargeByAt',
    title: 'Discharge By\\At',
    render: rowData => (
      <>
        {rowData.dischargeBy}<br />
        <span className="date-table-style">{rowData.dischargeAt}</span>
      </>
    )
  },
  { key: 'dischargeType', title: 'Discharge Type', dataKey: 'dischargeType' },
  {
    key: 'patientBalance',
    title: 'Patient Balance',
    dataKey: 'patientBalance'
  }
];

const DischargedPatients = () => {
  const [filters, setFilters] = useState({ from: '', to: '', patient: '', visitId: '' });
  const [sortColumn, setSortColumn] = useState('fullName');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const data = [dummyRow];

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (aVal === bVal) return 0;
    return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const filterss = (
    <Form fluid>
      <div className="table-filters-handle-positions">
        <MyInput
          fieldLabel="Discharge From"
          fieldType="date"
          fieldName="from"
          record={filters}
          setRecord={setFilters}
          width="10vw"
        />
        <MyInput
          fieldLabel="Discharge To"
          fieldType="date"
          fieldName="to"
          record={filters}
          setRecord={setFilters}
          width="10vw"
        />
        <MyInput
          width="10vw"
          fieldLabel="Select Filter"
          fieldName="selectfilter"
          fieldType="select"
          selectData={[
            { key: 'MRN', value: 'MRN' },
            { key: 'Document Number', value: 'Document Number' },
            { key: 'Full Name', value: 'Full Name' },
            { key: 'Archiving Number', value: 'Archiving Number' },
            { key: 'Primary Phone Number', value: 'Primary Phone Number' },
            { key: 'Date of Birth', value: 'Date of Birth' }
          ]}
          selectDataLabel="value"
          selectDataValue="key"
          record={filters}
          setRecord={setFilters}
        />
        <MyInput
          fieldLabel="Search by"
          fieldName="searchCriteria"
          fieldType="text"
          placeholder="Search"
          width="10vw"
          record={filters}
          setRecord={setFilters}
        />
        <MyInput
          fieldLabel="Visit ID"
          fieldName="visitId"
          fieldType="text"
          placeholder="Visit ID"
          width="10vw"
          record={filters}
          setRecord={setFilters}
        />
        <div className="cancelled-admissions-buttons-positions">
          <MyButton>Search</MyButton>
          <MyButton>Clear</MyButton>
        </div>
      </div>
    </Form>
  );

  return (
      <MyTable
        data={paginated}
        columns={columns}
        loading={false}
        filters={filterss}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={(col, type) => {
          setSortColumn(col);
          setSortType(type as 'asc' | 'desc');
        }}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={data.length}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={e => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
  );
};

export default DischargedPatients;
