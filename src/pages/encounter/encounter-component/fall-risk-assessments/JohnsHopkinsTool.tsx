//Declares
import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { Checkbox } from 'rsuite';
import JohnsHopkinsToolModal from './JhonsHopkinsToolModal';
import CancellationModal from '@/components/CancellationModal';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import PlusIcon from '@rsuite/icons/Plus';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import JhonsHopkinsToolSecondModal from './JhonsHopkinsToolSecondModal';
import MyButton from '@/components/MyButton/MyButton';
import './Style.less';

//Table Data
const sampleData = [
  {
    id: 1,
    score: 82,
    riskLevel: 'High Risk',
    createdBy: 'Dr. Rami',
    createdAt: '2025-07-29 10:30 AM',
    nextAssessment: '2025-08-15',
    cancelledBy: 'Admin Sara',
    cancelledAt: '2025-08-01 09:00 AM',
    cancelReason: 'Patient discharged'
  },
  {
    id: 2,
    score: 45,
    riskLevel: 'Moderate Risk',
    createdBy: 'Nurse Layla',
    createdAt: '2025-07-25 01:15 PM',
    nextAssessment: '2025-08-10',
    cancelledBy: '',
    cancelledAt: '',
    cancelReason: ''
  },
  {
    id: 3,
    score: 20,
    riskLevel: 'Low Risk',
    createdBy: 'Dr. Ahmad',
    createdAt: '2025-07-10 08:45 AM',
    nextAssessment: '2025-09-01',
    cancelledBy: 'Nurse Omar',
    cancelledAt: '2025-08-20 03:00 PM',
    cancelReason: 'Incorrect entry'
  }
];


//Columns Configure
const columns: ColumnConfig[] = [
  {
    key: 'score',
    title: 'Score',
    dataKey: 'score',
    width: 100
  },
  {
  key: 'riskLevel',
  title: 'Risk Level',
  dataKey: 'riskLevel',
  width: 160,
  render: (row: any) => (
    <MyBadgeStatus
      backgroundColor={
        row.riskLevel === 'High Risk'
          ? 'var(--light-pink)'
          : row.riskLevel === 'Moderate Risk'
          ? 'var(--light-orange)'
          : 'var(--light-green)'
      }
      color={
        row.riskLevel === 'High Risk'
          ? 'var(--primary-pink)'
          : row.riskLevel === 'Moderate Risk'
          ? 'var(--primary-orange)'
          : 'var(--primary-green)'
      }
      contant={row.riskLevel}
    />
  )
},
  {
    key: 'createdByAt',
    title: 'Created By\\At',
    dataKey: 'createdByAt',
    width: 200,
    render: (row: any) => (
      <>
        {row.createdBy}
        <br />
        <span className="date-table-style">{row.createdAt}</span>
      </>
    )
  },
  {
    key: 'nextAssessment',
    title: 'Next Assessment Due',
    dataKey: 'nextAssessment',
    width: 180
  },
  {
    key: 'viewPlan',
    title: 'View Prevention Plan',
    dataKey: 'viewPlan',
    width: 180,
    align: 'center',
    render: () => (
      <FontAwesomeIcon
        icon={faEye}
        style={{ cursor: 'pointer', fontSize: '16px' }}
        title="View Plan"
      />
    )
  },

  {
    key: 'cancelledByAt',
    title: 'Cancelled By\\At',
    dataKey: 'cancelledByAt',
    expandable: true,
    render: (row: any) =>
      row.cancelledBy ? (
        <>
          {row.cancelledBy}
          <br />
          <span className="date-table-style">{row.cancelledAt}</span>
        </>
      ) : (
        <i style={{ color: '#888' }}>Not cancelled</i>
      )
  },
  {
    key: 'cancelReason',
    title: 'Cancellation Reason',
    dataKey: 'cancelReason',
    expandable: true,
    render: (row: any) =>
      row.cancelReason ? row.cancelReason : <i style={{ color: '#888' }}>N/A</i>
  }
];


const JohnsHopkinsTool = () => {
  const [sortColumn, setSortColumn] = useState('score');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  //select row
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  //Modals Opening
  const [openJohnsHopkinsModal, setOpenJohnsHopkinsModal] = useState(false);
  const [secondOpen, setSecondOpen] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
const [cancelObject, setCancelObject] = useState<any>({});
  //Handle Modal Save
  const handleFirstModalSave = ({
    totalScore,
    riskLevel
  }: {
    totalScore: number;
    riskLevel: string;
  }) => {
    console.log('Saved assessment:', totalScore, riskLevel);

    //If statment to open the Second Modal
    if (riskLevel === 'Moderate Risk' || riskLevel === 'High Risk') {
      setSecondOpen(true);
    }
  };

  //Table Data Sorting
  const sortedData = [...sampleData].sort((a, b) => {
    const aValue = a[sortColumn as keyof typeof a];
    const bValue = b[sortColumn as keyof typeof b];
    if (aValue === bValue) return 0;
    return sortType === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
  });
  const paginatedData = sortedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  //Table Filter Content
const tablebuttons = (
  <div className="table-buttons-container">
    <div className="left-group">
      <MyButton
        prefixIcon={() => <CloseOutlineIcon />}
        onClick={() => {
          setCancelObject({}); 
          setOpenCancelModal(true);
        }}>
        Cancel
      </MyButton>
      <Checkbox>Show Cancelled</Checkbox>
    </div>
    <div className="right-group">
      <MyButton prefixIcon={() => <PlusIcon onClick={() => setOpenJohnsHopkinsModal(true)}/>}>Add</MyButton>
    </div>
  </div>
);





  //select row
  const isSelectedRow = rowData => {
    return rowData.id === selectedRowId ? 'selected-row' : '';
  };

  return (
    <>
      <MyTable
        data={paginatedData}
        columns={columns}
        loading={false}
        tableButtons={tablebuttons}
        sortColumn={sortColumn}
        rowClassName={isSelectedRow}
        onRowClick={(rowData) => {
        setSelectedRowId(rowData.id);}}
        sortType={sortType}
        onSortChange={(col, type) => {
          setSortColumn(col);
          setSortType(type);
        }}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={sampleData.length}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={e => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      <JohnsHopkinsToolModal
        open={openJohnsHopkinsModal}
        setOpen={setOpenJohnsHopkinsModal}
        onSave={handleFirstModalSave}
      />

      <JhonsHopkinsToolSecondModal open={secondOpen} setOpen={setSecondOpen} />

      <CancellationModal
  open={openCancelModal}
  setOpen={setOpenCancelModal}
  object={cancelObject}
  setObject={setCancelObject}
  handleCancle={() => {
    console.log('Cancelled:', cancelObject);
    setOpenCancelModal(false);
  }}
  title="Cancel Assessment"
  fieldLabel="Reason for cancellation"
  fieldName="cancelReason"
/>

    </>
  );
};

export default JohnsHopkinsTool;
