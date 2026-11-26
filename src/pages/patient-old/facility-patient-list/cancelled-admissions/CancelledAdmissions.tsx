import React, { useState } from 'react';
import { Form} from 'rsuite';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import '../styles.less';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetDepartmentsQuery } from '@/services/setupService';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import { initialListRequest } from '@/types/types';
import { ApPatient } from '@/types/model-types';
import { newApPatient } from '@/types/model-types-constructor';



const dummyRow = {
  fullName: 'Jane Smith',
  patientMrn: 'MRN345678',
  phoneNumber: '+15559876',
  documentNumber: 'ID-345678',
  dob: '1980-07-04',
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
    title: 'Gender',
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
  const [appliedPatientSearch, setAppliedPatientSearch] = useState<any>({
    searchByField: 'fullName',
    patientName: ''
  });
  const [sortColumn, setSortColumn] = useState('fullName');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedDepartments, setSelectedDepartments] = useState<any[]>([]);
  const [searchPatient, setSearchPatient] = useState<ApPatient>({
    ...newApPatient,
    encounterTypeLkey: '',
    bedStatusLkey: ''
  });


  const { data: encounterTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_TYPE');
  const { data: departmentsResponse } = useGetDepartmentsQuery(initialListRequest);

  const matchesPatientSearch = (row: any) => {
    const field = String(appliedPatientSearch?.searchByField ?? 'fullName');
    const raw = String(appliedPatientSearch?.patientName ?? '').trim().toLowerCase();
    if (!raw) return true;
    if (field === 'patientMrn') return String(row?.patientMrn ?? '').toLowerCase().includes(raw);
    if (field === 'phoneNumber') return String(row?.phoneNumber ?? '').toLowerCase().includes(raw);
    if (field === 'documentNumber')
      return String(row?.documentNumber ?? '').toLowerCase().includes(raw);
    if (field === 'dob')
      return String(row?.dob ?? '') === String(appliedPatientSearch?.patientName ?? '').trim();
    return String(row?.fullName ?? '').toLowerCase().includes(raw);
  };

  const data = [dummyRow].filter(matchesPatientSearch);
  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (aVal === bVal) return 0;
    return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });
  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

const content = (
            <div className="advanced-filters">
              <Form fluid className="dissss">
                <MyInput
            fieldLabel="Select Department"
            fieldType="checkPicker"
            selectData={departmentsResponse?.object ?? []}
            selectDataLabel="name"
            selectDataValue="key"
            placeholder=" "
            fieldName="selectedDepartments"
            record={{ selectedDepartments }}
            setRecord={value => setSelectedDepartments(value.selectedDepartments)}
            searchable={false}
          />
          <MyInput
            fieldLabel="Encounter Type"
            fieldType="select"
            fieldName="encounterTypeLkey"
            selectData={encounterTypeLovQueryResponse?.object ?? []}
             selectDataLabel="lovDisplayVale"
 disableByField='isValid'

            selectDataValue="key"
            record={searchPatient}
            setRecord={setSearchPatient}
            searchable={false}
            placeholder=" "
          />
                </Form></div>);


const filterss = (<>
<Form fluid layout='inline'>
        <div className='table-filters-handle-positions'>   
        <MyInput
          fieldLabel="Cancelled From"
          fieldType="date"
          column
          fieldName="from"
          record={filters}
          setRecord={setFilters}
          width="10vw"
        />
        <MyInput
          fieldLabel="Cancelled To"
          fieldType="date"
          column
          fieldName="to"
          width="10vw"
          record={filters}
          setRecord={setFilters}
        />

<SearchPatientCriteria
  record={filters}
  setRecord={setFilters}
  liveSearchMinLength={0}
  onSearchClick={() => {
    setAppliedPatientSearch({
      searchByField: (filters as any)?.searchByField ?? 'fullName',
      patientName: (filters as any)?.patientName ?? ''
    });
    setPage(0);
  }}
/>

</div>
      </Form>
              <AdvancedSearchFilters searchFilter={true} content={content}/>

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
