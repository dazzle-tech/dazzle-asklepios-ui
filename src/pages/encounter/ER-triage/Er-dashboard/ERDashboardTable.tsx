// Imports
import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { Whisper, Tooltip } from 'rsuite';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import './style.less';
// Dummy data
const sampleData = [
  {
    id: 1,
    patientName: 'Ali Ahmad',
    age: 32,
    erLevel: 'Level 3',
    priority: 'High',
    chiefComplaint: 'Chest pain',
    arrivalTime: '2025-08-18 09:30 AM',
    location: 'Room 102',
    status: 'Waiting',
    quickInfo: {
      allergy: 'Milk Allergy',
      fallRisk: 'Moderate',
      vitals: {
        bp: '129/56',
        hr: 67,
        rr: 77,
        spo2: 92
      }
    }
  },
  {
    id: 2,
    patientName: 'Sara Khalid',
    age: 28,
    erLevel: 'Level 2',
    priority: 'Medium',
    chiefComplaint: 'Fever & cough',
    arrivalTime: '2025-08-18 08:45 AM',
    location: 'Room 103',
    status: 'In Treatment',
    quickInfo: {
      allergy: 'Milk Allergy',
      fallRisk: 'Moderate',
      vitals: {
        bp: '129/56',
        hr: 67,
        rr: 77,
        spo2: 92
      }
    }
  },
  {
    id: 3,
    patientName: 'Mohammed Youssef',
    age: 45,
    erLevel: 'Level 1',
    priority: 'Critical',
    chiefComplaint: 'Severe trauma',
    arrivalTime: '2025-08-18 07:20 AM',
    location: 'Trauma Bay',
    status: 'Discharged',
    quickInfo: {
      allergy: 'Milk Allergy',
      fallRisk: 'Moderate',
      vitals: {
        bp: '129/56',
        hr: 67,
        rr: 77,
        spo2: 92
      }
    }
  },
  {
    id: 4,
    patientName: 'Fatima Noor',
    age: 36,
    erLevel: 'Level 4',
    priority: 'Low',
    chiefComplaint: 'Headache',
    arrivalTime: '2025-08-18 10:15 AM',
    location: 'Room 104',
    status: 'Waiting',
    quickInfo: {
      allergy: 'Milk Allergy',
      fallRisk: 'Moderate',
      vitals: {
        bp: '129/56',
        hr: 67,
        rr: 77,
        spo2: 92
      }
    }
  },
  {
    id: 5,
    patientName: 'Omar Zaid',
    age: 51,
    erLevel: 'Level 2',
    priority: 'High',
    chiefComplaint: 'Shortness of breath',
    arrivalTime: '2025-08-18 06:55 AM',
    location: 'Room 105',
    status: 'In Treatment',
    quickInfo: {
      allergy: 'Milk Allergy',
      fallRisk: 'Moderate',
      vitals: {
        bp: '129/56',
        hr: 67,
        rr: 77,
        spo2: 92
      }
    }
  }
];

// Table columns
const columns: ColumnConfig[] = [
  {
    key: 'index',
    title: '#',
    width: 50,
    render: (_row, index) => index + 1
  },
  {
    key: 'patientName',
    title: 'Patient Name',
    dataKey: 'patientName',
    width: 150,
    render: row => {
      const tooltipSpeaker = (
        <Tooltip>
          <div>
            <strong>Allergy:</strong> {row?.quickInfo?.allergy || 'N/A'}
          </div>
          <div>
            <strong>Fall Risk:</strong> {row?.quickInfo?.fallRisk || 'N/A'}
          </div>
          <div>
            <strong>BP:</strong> {row?.quickInfo?.vitals?.bp || 'N/A'}
          </div>
          <div>
            <strong>HR:</strong> {row?.quickInfo?.vitals?.hr || 'N/A'}
          </div>
          <div>
            <strong>RR:</strong> {row?.quickInfo?.vitals?.rr || 'N/A'}
          </div>
          <div>
            <strong>SPO2:</strong> {row?.quickInfo?.vitals?.spo2 || 'N/A'}
          </div>
        </Tooltip>
      );

      return (
        <Whisper trigger="hover" placement="top" speaker={tooltipSpeaker}>
          <div style={{ display: 'inline-block', cursor: 'pointer' }}>{row?.patientName}</div>
        </Whisper>
      );
    }
  },
  {
    key: 'age',
    title: 'Age',
    width: 100
  },
  {
    key: 'erLevel',
    title: 'ER Level',
    dataKey: 'erLevel',
    width: 100
  },
  {
    key: 'priority',
    title: 'Priority',
    dataKey: 'priority',
    width: 100
  },
  {
    key: 'chiefComplaint',
    title: 'Chief Complaint',
    dataKey: 'chiefComplaint',
    width: 100
  },
  {
    key: 'arrivalTime',
    title: 'Arrival Time',
    dataKey: 'arrivalTime',
    width: 150
  },
  {
    key: 'location',
    title: 'Location',
    dataKey: 'location',
    width: 100
  },
  {
    key: 'status',
    title: 'Status',
    dataKey: 'status',
    width: 150,
    render: row => (
      <MyBadgeStatus
        backgroundColor={
          row.status === 'Waiting'
            ? 'var(--light-gray)'
            : row.status === 'In Treatment'
            ? 'var(--light-green)'
            : 'var(--light-pink)'
        }
        color={
          row.status === 'Waiting'
            ? 'var(--primary-gray)'
            : row.status === 'In Treatment'
            ? 'var(--primary-green)'
            : 'var(--primary-pink)'
        }
        contant={row.status}
      />
    )
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 70,
    align: 'center',
    render: () => (
      <FontAwesomeIcon
        icon={faEye}
        style={{ cursor: 'pointer', fontSize: '16px',}}
        title="View Details"
      />
    )
  }
];

const ERDashboardTable = () => {
  const [record, setRecord] = useState({});
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('patientName');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const sortedData = [...sampleData].sort((a, b) => {
    const aVal = a[sortColumn as keyof typeof a];
    const bVal = b[sortColumn as keyof typeof b];
    if (aVal === bVal) return 0;
    return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
  });

  const { data: emergencyLevelLovData } = useGetLovValuesByCodeQuery('EMERGENCY_LEVEL');
  const emergencyLevelLov = emergencyLevelLovData?.object || [];
  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const isSelectedRow = (row: any) => (row.id === selectedRowId ? 'selected-row' : '');

  const tableFilters = (<>
    <Form fluid>
      <div className="filters-container">
        <MyInput
          fieldLabel="Encounter Date From"
          fieldName="encounterDateFrom"
          fieldType="date"
          width="10vw"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          fieldLabel="To"
          fieldName="encounterDateTo"
          fieldType="date"
          width="10vw"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          fieldLabel="Emergency Level"
          fieldName="emergencyLevel"
          fieldType="select"
          width="10vw"
          record={record}
          setRecord={setRecord}
          selectData={emergencyLevelLov}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
        />
        <MyInput
          fieldLabel="Physician"
          fieldName="physician"
          fieldType="select"
          lovCode="PRACTITIONERS"
          width="10vw"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width="10vw"
          fieldLabel="Triage Nurse"
          fieldName="triageNurse"
          fieldType="select"
          lovCode="USERS"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          fieldLabel="Chief Complaint"
          fieldName="chiefComplaint"
          fieldType="text"
          width="10vw"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width="10vw"
          fieldLabel="Status"
          fieldName="status"
          fieldType="select"
          selectData={[
            { key: 'Waiting Triage', value: 'Waiting Triage' },
            { key: 'Triage Started', value: 'Triage Started' },
            { key: 'Sent to ER', value: 'Sent to ER' },
            { key: 'Ongoing', value: 'Ongoing' },
            { key: 'Completed', value: 'Completed' },
            { key: 'Discharged', value: 'Discharged' }
          ]}
          selectDataLabel="value"
          selectDataValue="key"
          record={record}
          setRecord={setRecord}
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
            { key: 'Date of Birth', value: 'Date of Birth'}
        ]}
          selectDataLabel="value"
          selectDataValue="key"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          fieldLabel='Search by'
          fieldName="searchCriteria"
          fieldType="text"
          placeholder="Search"
          width="15vw"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          fieldLabel="Auto Refresh (10s)"
          fieldName="autoRefresh"
          fieldType="checkbox"
          width="10vw"
          record={record}
          setRecord={setRecord}
        />
      </div>
    </Form>
    <AdvancedSearchFilters searchFilter={true}/>
  </>);

  return (
    <div className="first-middle-table-er-dashboard">
      <MyTable
        data={paginatedData}
        columns={columns}
        height="auto"
        loading={false}
        rowClassName={isSelectedRow}
        sortColumn={sortColumn}
        sortType={sortType}
        filters={tableFilters}
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
        onRowClick={row => setSelectedRowId(row.id)}
      />
    </div>
  );
};

export default ERDashboardTable;
