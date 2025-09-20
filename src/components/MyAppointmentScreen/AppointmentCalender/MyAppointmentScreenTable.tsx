import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { Button } from 'rsuite';

const sampleAppointmentsData = [
  {
    appointmentId: 'APT-1001',
    date: '2025-09-15T10:30:00Z',
    problem: 'Back Pain',
    time: '10:30 AM',
    treatmentType: 'Physical Therapy',
    treatmentLocation: 'Clinic A',
    therapist: 'Dr. Sarah Johnson',
    status: 'Scheduled',
    phone: '+962799000001',
    age: 32,
    patientName: 'Alice Cooper',
    visitType: 'In-Person'
  },
  {
    appointmentId: 'APT-1002',
    date: '2025-09-12T09:00:00Z',
    problem: 'Shoulder Injury',
    time: '09:00 AM',
    treatmentType: 'Occupational Therapy',
    treatmentLocation: 'Clinic B',
    therapist: 'Dr. Mike Chen',
    status: 'Completed',
    phone: '+962799000002',
    age: 45,
    patientName: 'Bob Marley',
    visitType: 'Virtual'
  },
  {
    appointmentId: 'APT-1003',
    date: '2025-09-18T13:00:00Z',
    problem: 'Speech Delay',
    time: '01:00 PM',
    treatmentType: 'Speech Therapy',
    treatmentLocation: 'Clinic C',
    therapist: 'Dr. Lisa Wong',
    status: 'Active',
    phone: '+962799000003',
    age: 28,
    patientName: 'Charlie Brown',
    visitType: 'Home Visit'
  }
];

const columns: ColumnConfig[] = [
  {
    key: 'no',
    title: <Translate>No.</Translate>,
    dataKey: 'no',
    width: 60,
    render: (_row, index) => <span>{index + 1}</span>
  },
  {
    key: 'patientName',
    title: <Translate>Patient Name</Translate>,
    dataKey: 'patientName'
  },
  {
    key: 'phone',
    title: <Translate>Phone</Translate>,
    dataKey: 'phone'
  },
  {
    key: 'age',
    title: <Translate>Age</Translate>,
    dataKey: 'age'
  },
  {
    key: 'visitType',
    title: <Translate>Visit Type</Translate>,
    dataKey: 'visitType'
  },
  {
    key: 'status',
    title: <Translate>Status</Translate>,
    dataKey: 'status',
    render: row => {
      let color = 'var(--primary-gray)';
      if (row.status === 'Scheduled') {
        color = '#ff8902ff';
      } else if (row.status === 'Completed') {
        color = '#FBC02D';
      } else if (row.status === 'Active') {
        color = '#388E3C';
      }
      return <MyBadgeStatus color={color} contant={row.status} />;
    }
  },
  {
    key: 'actions',
    title: <Translate>Actions</Translate>,
    dataKey: 'actions',
    render: row => (
      <Button size="xs" appearance="link" onClick={() => alert(`Details for ${row.patientName}`)}>
        View
      </Button>
    )
  }
];

const MyAppointmentScreenTable = () => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData] = useState(sampleAppointmentsData);

  const sortedData = [...tableData].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
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

export default MyAppointmentScreenTable;
