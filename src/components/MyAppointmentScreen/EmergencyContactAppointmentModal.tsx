import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';
import { Form } from 'rsuite';
import SearchPatientCriteria from '../SearchPatientCriteria';

const samplePatientsData = [
  {
    id: 1,
    name: 'John Smith',
    gender: 'Male',
    age: 45,
    emergencyContact: 'Jane Smith',
    relation: 'Wife',
    phone: '+123456789',
    email: 'john.smith@email.com',
    mrn: '001234',
    documentNumber: 'ID-1001',
    dob: '1980-05-12'
  },
  {
    id: 2,
    name: 'Alice Brown',
    gender: 'Female',
    age: 52,
    emergencyContact: 'Michael Brown',
    relation: 'Husband',
    phone: '+987654321',
    email: 'alice.brown@email.com',
    mrn: '005678',
    documentNumber: 'ID-2002',
    dob: '1974-09-03'
  }
];

const columns: ColumnConfig[] = [
  { key: 'name', title: <Translate>Name</Translate>, dataKey: 'name' },
  { key: 'gender', title: <Translate>Gender</Translate>, dataKey: 'gender' },
  { key: 'age', title: <Translate>Age</Translate>, dataKey: 'age' },
  { key: 'emergencyContact', title: <Translate>Emergency Contact</Translate>, dataKey: 'emergencyContact' },
  { key: 'relation', title: <Translate>Relation</Translate>, dataKey: 'relation' },
  { key: 'phone', title: <Translate>Phone</Translate>, dataKey: 'phone' },
  { key: 'email', title: <Translate>Email</Translate>, dataKey: 'email' }
];

const PatientsTable = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [record, setRecord] = useState<any>({});
  const [appliedPatientSearch, setAppliedPatientSearch] = useState<any>({
    searchByField: 'fullName',
    patientName: ''
  });

  const matchesSearch = (row: any) => {
    const field = String(appliedPatientSearch?.searchByField ?? 'fullName');
    const raw = String(appliedPatientSearch?.patientName ?? '').trim().toLowerCase();
    if (!raw) return true;
    if (field === 'patientMrn') return String(row?.mrn ?? '').toLowerCase().includes(raw);
    if (field === 'phoneNumber') return String(row?.phone ?? '').toLowerCase().includes(raw);
    if (field === 'documentNumber')
      return String(row?.documentNumber ?? '').toLowerCase().includes(raw);
    if (field === 'dob')
      return String(row?.dob ?? '') === String(appliedPatientSearch?.patientName ?? '').trim();
    return String(row?.name ?? '').toLowerCase().includes(raw);
  };

  const filteredData = samplePatientsData.filter(matchesSearch);

  const paginatedData = filteredData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const filters = (
    <Form fluid className="dissss">
      <SearchPatientCriteria
        record={record}
        setRecord={setRecord}
        liveSearchMinLength={0}
        onSearchClick={() => {
          setAppliedPatientSearch({
            searchByField: record?.searchByField ?? 'fullName',
            patientName: record?.patientName ?? ''
          });
          setPage(0);
        }}
      />
    </Form>
  );

  return (
    <MyTable
      data={paginatedData}
      columns={columns}
      loading={false}
      page={page}
      filters={filters}
      rowsPerPage={rowsPerPage}
      totalCount={filteredData.length}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={e => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
    />
  );
};

export default PatientsTable;
