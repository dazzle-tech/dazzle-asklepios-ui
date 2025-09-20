import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';
import { Form } from 'rsuite';
import MyInput from '../MyInput';



const samplePatientsData = [
  {
    id: 1,
    name: 'John Smith',
    gender: 'Male',
    age: 45,
    emergencyContact: 'Jane Smith',
    relation: 'Wife',
    phone: '+123456789',
    email: 'john.smith@email.com'
  },
  {
    id: 2,
    name: 'Alice Brown',
    gender: 'Female',
    age: 52,
    emergencyContact: 'Michael Brown',
    relation: 'Husband',
    phone: '+987654321',
    email: 'alice.brown@email.com'
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

  const paginatedData = samplePatientsData.slice(
    page * rowsPerPage,
    (page + 1) * rowsPerPage
  );


const filters = (
    <Form fluid className="dissss">
      <MyInput
        width="100%"
        fieldLabel="Select Search Criteria"
        fieldType="select"
        fieldName="searchByField"
        record={record}
        setRecord={setRecord}
        selectData={[
          { label: 'MRN', value: 'patientMrn' },
          { label: 'Document Number', value: 'documentNo' },
          { label: 'Full Name', value: 'fullName' },
          { label: 'Archiving Number', value: 'archivingNumber' },
          { label: 'Primary Phone Number', value: 'phoneNumber' },
          { label: 'Date of Birth', value: 'dob' }
        ]}
        selectDataLabel="label"
        selectDataValue="value"
      />

      <MyInput
        width="100%"
        fieldLabel="Search Patients"
        fieldType="text"
        fieldName="patientName"
        record={record}
        setRecord={setRecord}
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
      totalCount={samplePatientsData.length}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={e => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
    />
  );
};

export default PatientsTable;
