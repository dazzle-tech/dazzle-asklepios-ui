// Import required modules
import React, { useState } from 'react';
import { Panel } from 'rsuite';
import MyInput from '@/components/MyInput';
import DragDropTable from './DragDropTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { IconButton, Tooltip, Whisper } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import { Form } from 'rsuite';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import CancellationModal from '@/components/CancellationModal';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCirclePlay,
  faCircleXmark,
  faFileWaveform,
  faLandMineOn
} from '@fortawesome/free-solid-svg-icons';
import ReactDOMServer from 'react-dom/server';
import { useDispatch } from 'react-redux';
import { setPageCode, setDivContent } from '@/reducers/divSlice';
import './start-tele-consultation/styles.less';
// Define request type
type TeleconsultationRequest = {
  id: number;
  patientName: string;
  mrn: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  priority: 'Low' | 'Medium' | 'Urgent';
  status: 'Pending' | 'Confirmed' | 'Rejected';
};

// Sample data
const sampleRequests: TeleconsultationRequest[] = [
  {
    id: 1,
    patientName: 'John Doe',
    mrn: 'MRN001',
    gender: 'Male',
    age: 35,
    reason: 'Chest pain',
    requestedBy: 'Dr. Smith',
    requestedAt: '2025-08-11 10:30',
    priority: 'Urgent',
    status: 'Pending'
  },
  {
    id: 2,
    patientName: 'Ahmad Naser',
    mrn: 'MRN003',
    gender: 'Male',
    age: 42,
    reason: 'Severe abdominal pain',
    requestedBy: 'Dr. Rami Khalil',
    requestedAt: '2025-08-12 08:45',
    priority: 'Urgent',
    status: 'Pending'
  },
  {
    id: 3,
    patientName: 'Jane Smith',
    mrn: 'MRN002',
    gender: 'Female',
    age: 29,
    reason: 'Headache',
    requestedBy: 'Dr. Johnson',
    requestedAt: '2025-08-11 09:15',
    priority: 'Medium',
    status: 'Pending'
  },
  {
    id: 4,
    patientName: 'Lina Youssef',
    mrn: 'MRN004',
    gender: 'Female',
    age: 37,
    reason: 'Blurred vision and dizziness',
    requestedBy: 'Dr. Sara Mansour',
    requestedAt: '2025-08-12 10:20',
    priority: 'Low',
    status: 'Pending'
  }
];
// State variables
const TeleconsultationRequests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TeleconsultationRequest[]>(sampleRequests);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelObject, setCancelObject] = useState<any>({});
  const [record, setRecord] = useState({});
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<'confirm' | 'reject' | null>(null);
  const [customConfirmMessage, setCustomConfirmMessage] = useState('');
  const [sortColumn, setSortColumn] = useState('patientName');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const handleConfirmAction = () => {
    if (selectedRequestId !== null && pendingAction) {
      setRequests(prev =>
        prev.map(req =>
          req.id === selectedRequestId
            ? { ...req, status: pendingAction === 'confirm' ? 'Confirmed' : 'Rejected' }
            : req
        )
      );
      // Navigate to the consultation screen if confirmed
      if (pendingAction === 'confirm') {
        const confirmedRequest = requests.find(req => req.id === selectedRequestId);
        if (confirmedRequest) {
          navigate('/start-tele-consultation', {
            state: {
              patient: confirmedRequest.patientName,
              encounter: confirmedRequest,
              fromPage: 'teleconsultation-requests'
            }
          });
        }
      }
    }

    // Reset modal state
    setOpenConfirmModal(false);
    setSelectedRequestId(null);
    setPendingAction(null);
  };
  // Handle cancellation (rejection) with reason
  const handleCancleReject = () => {
    if (selectedRequestId !== null) {
      setRequests(prev =>
        prev.map(req =>
          req.id === selectedRequestId
            ? { ...req, status: 'Rejected', reason: cancelObject?.reason || '' }
            : req
        )
      );
    }

    // Close modal and reset
    setOpenCancelModal(false);
    setSelectedRequestId(null);
    setCancelObject({});
  };
  const physicianList = [
    { label: 'Dr. Ahmed Ali', value: '1' },
    { label: 'Dr. Sara Youssef', value: '2' },
    { label: 'Dr. Khalid Mansour', value: '3' }
  ];

const contents = (
  <div className="advanced-filters">
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

<MyInput
  width="100%"
  fieldLabel="Physician"
  fieldType="select"
  fieldName="physicianId"
  record={record}
  setRecord={setRecord}
  selectData={physicianList}
  selectDataLabel="label"
  selectDataValue="value"
/>


      <MyInput
        width="100%"
        fieldLabel="Priority"
        fieldType="select"
        fieldName="priority"
        record={record}
        setRecord={setRecord}
        selectData={[
          { label: 'low', value: 'Low' },
          { label: 'medium', value: 'Medium' },
          { label: 'urgent', value: 'Urgent' }
        ]}
        selectDataLabel="label"
        selectDataValue="value"
      />

      <MyInput
        width="100%"
        fieldLabel="Status"
        fieldType="select"
        fieldName="status"
        record={record}
        setRecord={setRecord}
        selectData={[
          { label: 'Pending', value: 'Pending' },
          { label: 'Cancelled', value: 'Cancelled' },
          { label: 'Ongoing', value: 'Ongoing' }
        ]}
        selectDataLabel="label"
        selectDataValue="value"
      />
    </Form>
  </div>
);


  const filterstable = (
    <>
      <Form fluid>
        <div className="from-to-input-position">
          <MyInput
            width={'100%'}
            fieldLabel="Request From"
            fieldType="date"
            fieldName="key0"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            width={'100%'}
            fieldLabel="To"
            fieldType="date"
            fieldName="key1"
            record={record}
            setRecord={setRecord}
          />
        </div>
      </Form>
      <AdvancedSearchFilters searchFilter={true} content={contents} />
    </>
  );

  const columns = [
    {
      key: 'priorityIcon',
      title: '',
      width: 50,
      align: 'center',
      render: (row: TeleconsultationRequest) =>
        row.priority.toLowerCase() === 'urgent' ? (
          <FontAwesomeIcon
            icon={faLandMineOn}
            style={{ color: 'red', fontSize: '18px' }}
            title="Urgent Priority"
          />
        ) : null
    },
    {
      key: 'patient',
      title: 'Patient Name',
      dataKey: 'patientName',
      width: 200
    },
    { key: 'gender', title: 'Gender', dataKey: 'gender', width: 80 },
    { key: 'age', title: 'Age', dataKey: 'age', width: 60 },
    { key: 'reason', title: 'Reason', dataKey: 'reason', width: 180 },
    {
      key: 'requestedBy',
      title: 'Requested By / At',
      width: 160,
      render: (row: TeleconsultationRequest) => (
        <>
          <div>{row.requestedBy}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>{row.requestedAt}</div>
        </>
      )
    },
    { key: 'priority', title: 'Priority', dataKey: 'priority', width: 100 },
    {
      key: 'status',
      title: 'Status',
      dataKey: 'status',
      width: 100,
      render: (row: TeleconsultationRequest) => (
        <MyBadgeStatus
          backgroundColor={
            row.status === 'Pending'
              ? 'var(--light-gray)'
              : row.status === 'Confirmed'
              ? 'var(--light-green)'
              : 'var(--light-pink)'
          }
          color={
            row.status === 'Pending'
              ? 'var(--primary-gray)'
              : row.status === 'Confirmed'
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
  width: 120,
  align: 'center',
  render: (rowData: TeleconsultationRequest) => (
    <div className="actions-icons-tele-consultation-screen">
      {/* Start Teleconsultation */}
      <Whisper trigger="hover" placement="top" speaker={<Tooltip>Start Teleconsultation</Tooltip>}>
        <div>
          <MyButton
            size="small"
            onClick={() => {
              setSelectedRequestId(rowData.id);
              setPendingAction('confirm');
              setCustomConfirmMessage(`Start The Call With ${rowData.patientName}?`);
              setOpenConfirmModal(true);
            }}
          >
            <FontAwesomeIcon icon={faCirclePlay} />
          </MyButton>
        </div>
      </Whisper>

      {/* Reject Request */}
      <Whisper trigger="hover" placement="top" speaker={<Tooltip>Reject Request</Tooltip>}>
        <div>
          <MyButton
            size="small"
            onClick={() => {
              setSelectedRequestId(rowData.id);
              setCancelObject({
                ...rowData,
                statusLkey: '',
                reason: ''
              });
              setOpenCancelModal(true);
            }}
          >
            <FontAwesomeIcon icon={faCircleXmark} />
          </MyButton>
        </div>
      </Whisper>

      {/* View EMR File */}
      <Whisper trigger="hover" placement="top" speaker={<Tooltip>View EMR File</Tooltip>}>
        <div>
          <MyButton size="small">
            <FontAwesomeIcon icon={faFileWaveform} />
          </MyButton>
        </div>
      </Whisper>
    </div>
  )
}


  ];

  const sortedData = [...requests].sort((a, b) => {
    const aValue = a[sortColumn as keyof TeleconsultationRequest];
    const bValue = b[sortColumn as keyof TeleconsultationRequest];

    if (aValue === bValue) return 0;
    return sortType === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
  });

  const paginatedData = sortedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const divContent = (
    <div className="page-title">
      <h5>Tele Consultation Screen</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('tele_consultation_screen'));
  dispatch(setDivContent(divContentHTML));

  return (
    <Panel>
      <DragDropTable
        data={paginatedData}
        columns={columns}
        loading={false}
        filters={filterstable}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={requests.length}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={(col, type) => {
          setSortColumn(col);
          setSortType(type);
        }}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={e => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      <CancellationModal
        open={openCancelModal}
        setOpen={setOpenCancelModal}
        handleCancle={handleCancleReject}
        object={cancelObject}
        setObject={setCancelObject}
        fieldLabel="Please specify the reason for rejection"
        title="Reject Request"
        fieldName="reason"
      />

      <DeletionConfirmationModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        itemToDelete={pendingAction === 'confirm' ? 'Confirm' : 'Reject'}
        actionType={pendingAction === 'confirm' ? 'confirm' : 'reject'}
        actionButtonFunction={handleConfirmAction}
        confirmationQuestion={customConfirmMessage}
      />
    </Panel>
  );
};

export default TeleconsultationRequests;
