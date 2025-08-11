import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { Form, Panel, Checkbox } from 'rsuite';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import CurrentVisitModal from './CurrentVisitModal';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import { MdDelete } from 'react-icons/md';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

// Sample data for initial visits
const sampleData = [
  {
    id: 1,
    date: '2025-06-15',
    weeks: 2,
    weight: 60,
    bloodPressure: '120/80',
    heightOfUterus: 12,
    bloodGlucose: 90,
    urineDipstick: 'Normal',
    fetalHeartRate: 140,
    cancelled: false
  },
  {
    id: 2,
    date: '2025-06-22',
    weeks: 3,
    weight: 61,
    bloodPressure: '118/75',
    heightOfUterus: 13,
    bloodGlucose: 92,
    urineDipstick: 'Normal',
    fetalHeartRate: 142,
    cancelled: false
  }
];

const CurrentVisit = () => {
  // State for all visit records
  const [records, setRecords] = useState(sampleData);
  // State to control the Add/Edit modal visibility
  const [modalOpen, setModalOpen] = useState(false);
  // State to control the confirmation modal for deleting/cancelling a visit
  const [openConfirmDeleteModal, setOpenConfirmDeleteModal] = useState(false);
  // Holds the id of the selected record to cancel
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  // Flag to determine whether cancelled visits should be shown or hidden
  const [showCancelled, setShowCancelled] = useState(false);

  // Function to handle cancellation confirmation
  const handleDeleteConfirm = () => {
    if (selectedItemId !== null) {
      // Mark the selected visit as cancelled
      setRecords(prev =>
        prev.map(item => (item.id === selectedItemId ? { ...item, cancelled: true } : item))
      );
    }
    // Close the confirmation modal and clear selected id
    setOpenConfirmDeleteModal(false);
    setSelectedItemId(null);
  };

  // Filter records based on whether cancelled visits are shown
  const displayedRecords = showCancelled ? records : records.filter(r => !r.cancelled);

  // Define table columns and how each column renders
  const columns = [
    { key: 'date', title: 'Date', dataKey: 'date', width: 120 },
    { key: 'weeks', title: 'Weeks', dataKey: 'weeks', width: 80 },
    { key: 'weight', title: 'Weight (kg)', dataKey: 'weight', width: 100 },
    { key: 'bloodPressure', title: 'Blood Pressure', dataKey: 'bloodPressure', width: 130 },
    {
      key: 'heightOfUterus',
      title: 'Height of Uterus (cm)',
      dataKey: 'heightOfUterus',
      width: 160
    },
    { key: 'bloodGlucose', title: 'Blood Glucose (mg/dL)', dataKey: 'bloodGlucose', width: 160 },
    { key: 'urineDipstick', title: 'Urine Dipstick', dataKey: 'urineDipstick', width: 130 },
    {
      key: 'fetalHeartRate',
      title: 'Fetal Heart Rate (bpm)',
      dataKey: 'fetalHeartRate',
      width: 160
    },
    {
      key: 'actions',
      title: '',
      width: 80,
      align: 'center',
      // Render delete icon that triggers cancellation confirmation modal
      render: rowData => (
        <MdDelete
          size={22}
          style={{ cursor: 'pointer', color: 'var(--primary-pink)' }}
          title="Cancel Visit"
          onClick={() => {
            setSelectedItemId(rowData.id);
            setOpenConfirmDeleteModal(true);
          }}
        />
      )
    }
  ];

  // Filter section above the table
  const filters = (
    <Form fluid>
      <div className="bt-div">
        {/* Cancel button (you can implement functionality as needed) */}
        <MyButton prefixIcon={() => <CloseOutlineIcon />}>Cancel</MyButton>

        {/* Checkbox to toggle showing cancelled visits */}
        <Checkbox
          checked={showCancelled}
          onChange={(value, checked, event) => {
            // Log the checkbox state for debugging
            console.log('Checkbox value:', value);
            console.log('Checkbox checked:', checked);
            // Update state to show/hide cancelled visits
            setShowCancelled(checked);
          }}
        >
          Show Cancelled
        </Checkbox>

        <div className="bt-right">
          {/* Button to open modal to add a new visit */}
          <MyButton prefixIcon={() => <PlusIcon />} onClick={() => setModalOpen(true)}>
            Add New
          </MyButton>
        </div>
      </div>
    </Form>
  );

  return (
    <Panel>
      {/* Table component displaying visits with filters and pagination */}
      <MyTable
        data={displayedRecords}
        columns={columns}
        loading={false}
        page={0}
        rowsPerPage={20}
        filters={filters}
        totalCount={displayedRecords.length}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
        sortColumn="date"
        sortType="desc"
        onSortChange={() => {}}
      />

      {/* Modal to add or edit visit details */}
      <CurrentVisitModal open={modalOpen} setOpen={setModalOpen} lmp={new Date('2025-06-01')} />

      {/* Confirmation modal to confirm cancellation of a visit */}
      <DeletionConfirmationModal
        open={openConfirmDeleteModal}
        setOpen={setOpenConfirmDeleteModal}
        itemToDelete="Visit"
        actionButtonFunction={handleDeleteConfirm}
        actionType="delete"
      />
    </Panel>
  );
};

export default CurrentVisit;
