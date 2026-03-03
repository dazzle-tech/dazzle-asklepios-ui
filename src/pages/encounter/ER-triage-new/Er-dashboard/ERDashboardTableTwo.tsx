// Imports
import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { Whisper, Tooltip } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCapsules,
  faVialCircleCheck,
  faDroplet,
  faSyringe,
  faLandMineOn,
} from '@fortawesome/free-solid-svg-icons';
import './style.less';

// Dummy data
const todoData = [
  {
    id: 1,
    patientName: 'Salma Basheer',
    location: 'Bed 11',
    todo: 'Administer Heparin 1000IU Dose',
    Tooltip: faCapsules,
    priority:'urgent',
  },
  {
    id: 2,
    patientName: 'Alia Saleem',
    location: 'Bed 02',
    todo: 'Collect Creatinine Sample',
    Tooltip: faVialCircleCheck,
  },
  {
    id: 3,
    patientName: 'Rama Ramzi',
    location: 'Bed 14',
    todo: 'Collect INR Sample',
    Tooltip: faVialCircleCheck,
  },
  {
    id: 4,
    patientName: 'Faheem Ahmad',
    location: 'Bed 25',
    todo: 'Administer RBCs Order',
    Tooltip: faDroplet,
  },
  {
    id: 5,
    patientName: 'Rania Abed',
    location: 'Bed 06',
    todo: 'Administer Normal Saline Order',
    Tooltip: faSyringe,
  },
];

// Columns
const columns: ColumnConfig[] = [
  {
    key: 'patientName',
    title: 'Patient Name',
    dataKey: 'patientName',
    width: 50,
  },
  {
    key: 'location',
    title: 'Location',
    dataKey: 'location',
    width: 50,
  },
{
  key: 'todo',
  title: 'To-Do',
  dataKey: 'todo',
  width: 80,
  align: 'center',
  render: (row: TeleconsultationRequest) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'start', gap: '8px', }}>
      <Whisper
        trigger="hover"
        placement="top"
        speaker={
          <Tooltip>
            {row.todo}
          </Tooltip>
        }
      >
        <span>
          <FontAwesomeIcon
            icon={row.Tooltip}
            style={{ fontSize: '18px', color: '#afafaf', cursor: 'pointer' }}
          />
        </span>
      </Whisper>

      {/* Show urgent icon only if priority is 'Urgent' */}
      {row.priority?.toLowerCase() === 'urgent' && (
        <FontAwesomeIcon
          icon={faLandMineOn}
          title="Urgent"
          style={{ fontSize: '16px', color: 'red' }}
        />
      )}
    </div>
  )
}


];


const ERDashboardTableTwo = () => {
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('patientName');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const sortedData = [...todoData].sort((a, b) => {
    const aVal = a[sortColumn as keyof typeof a];
    const bVal = b[sortColumn as keyof typeof b];
    if (aVal === bVal) return 0;
    return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const isSelectedRow = (row: any) => row.id === selectedRowId ? 'selected-row' : '';

  return (
    <div className='ER-dashboard-table-two'>
      <MyTable
        data={paginatedData}
        columns={columns}
        height={'auto'}
        loading={false}
        rowClassName={isSelectedRow}
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
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        onRowClick={(row) => setSelectedRowId(row.id)}
      />
    </div>
  );
};

export default ERDashboardTableTwo;
