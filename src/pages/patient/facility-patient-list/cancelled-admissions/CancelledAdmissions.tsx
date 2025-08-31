import React, { useState } from 'react';
import { Form} from 'rsuite';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import '../styles.less';
import MyButton from '@/components/MyButton/MyButton';
const dummyRow = {
  fullName: 'Jane Smith',
  patientMrn: 'MRN345678',
  age: 45,
  genderLvalue: { lovDisplayVale: 'Female' },
  encounterTypeLvalue: { lovDisplayVale: 'Inpatient' },
  departmentName: 'Cardiology',
  admissionBy: 'Dr. Alia',
  admissionAt: '2025-08-10 09:20',
  cancellationBy: 'Nurse Omar',
  cancellationAt: '2025-08-12 11:45',
  cancellationReason: 'Patient Discharged',
  patientBalance: 200.5
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
    key: 'cancellationByAt',
    title: 'Cancellation By\\At',
    render: rowData => (
      <>
        {rowData.cancellationBy}<br />
        <span className="date-table-style">{rowData.cancellationAt}</span>
      </>
    )
  },
  { key: 'cancellationReason', title: 'Cancellation Reason', dataKey: 'cancellationReason' },
  {
    key: 'patientBalance',
    title: 'Patient Balance',
    dataKey: 'patientBalance'
  }
];

const CancelledAdmissions = () => {
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

const filterss = (<>
<Form fluid >
        <div className='table-filters-handle-positions'>   
        <MyInput
          fieldLabel="Cancelled From"
          fieldType="date"
          fieldName="from"
          record={filters}
          setRecord={setFilters}
          width="10vw"
        />
        <MyInput
          fieldLabel="Cancelled To"
          fieldType="date"
          fieldName="to"
          width="10vw"
          record={filters}
          setRecord={setFilters}
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
          fieldName="searchCriteria"
          fieldType="text"
          placeholder="Search"
          width="10vw"
          record={filters}
          setRecord={setFilters}
        />

</div>
      </Form>
              <AdvancedSearchFilters searchFilter={true}/>

      </>);

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

export default CancelledAdmissions;
