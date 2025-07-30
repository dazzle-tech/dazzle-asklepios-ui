import React, { useState } from 'react';
import { useAppDispatch } from '@/hooks';
import { Checkbox } from 'rsuite';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import { MdModeEdit } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import AddProgressNotes from './AddProgressNotes';
import EditProgressNotes from './EditProgressNotes';

const ProgressNotes = () => {
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [progressNotes, setProgressNotes] = useState<any>({});
  const [popupCancelOpen, setPopupCancelOpen] = useState(false);
  const dispatch = useAppDispatch();

  // Sample data for demonstration
  const sampleData = [
    {
      key: 1,
      ProgressNotes: 'Progress Note 1',
      JobRole: 'Nurse',
      createdBy: 'John Doe',
      createdAt: '2025-01-15 10:30:00'
    },
    {
      key: 2,
      ProgressNotes: 'Progress Note 2',
      JobRole: 'Physician',
      createdBy: 'Jane Smith',
      createdAt: '2025-01-14 14:20:00'
    }
  ];

  // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
  const isSelected = rowData => {
    if (rowData && progressNotes && progressNotes.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };

  // Handle Clear Fields
  const handleClearField = () => {
    setProgressNotes({
      ProgressNotes: '',
      JobRole: '',
      createdBy: '',
      createdAt: ''
    });
  };

  // Handle Add New Progress Notes Record
  const handleAddNewProgressNotes = () => {
    handleClearField();
    setOpenAddModal(true);
  };

  // Handle Cancel Progress Notes Record
  const handleCancle = () => {
    dispatch(notify({ msg: 'Progress Notes Canceled Successfully', sev: 'success' }));
    setPopupCancelOpen(false);
  };

  // Pagination values
  const pageIndex = 0;
  const rowsPerPage = 10;
  const totalCount = sampleData.length;

  // Table Column
  const columns = [
    {
      key: 'ProgressNotes',
      title: 'Progress Notes',
      dataKey: 'ProgressNotes',
      render: (rowData: any) => rowData?.ProgressNotes || ''
    },
    {
      key: 'JobRole',
      title: 'JOB ROLE',
      dataKey: 'JobRole',
      render: (rowData: any) => rowData?.JobRole || ''
    },
    {
      key: 'createdAt/By',
      title: 'CREATED AT/BY',
      render: (row: any) =>
        row?.createdAt ? (
          <>
            <div>{row.createdBy || ''}</div>
            <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'details',
      title: <Translate>EDIT</Translate>,
      flexGrow: 2,
      render: (rowData: any) => (
        <MdModeEdit
          title="Edit"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setProgressNotes(rowData);
            setOpenEditModal(true);
          }}
        />
      )
    }
  ];

  return (
    <div>
      <AddProgressNotes open={openAddModal} setOpen={setOpenAddModal} />
      <EditProgressNotes
        open={openEditModal}
        setOpen={setOpenEditModal}
        progressNotesObj={progressNotes}
      />
      <div className="bt-div">
        <MyButton
          onClick={() => {
            setPopupCancelOpen(true);
          }}
          prefixIcon={() => <CloseOutlineIcon />}
          disabled={!progressNotes?.key}
        >
          <Translate>Cancel</Translate>
        </MyButton>
        <Checkbox>Show Cancelled</Checkbox>
        <Checkbox>Show All</Checkbox>
        <Checkbox>Show Nurse Notes</Checkbox>
        <Checkbox>Show Physician Notes</Checkbox>

        <div className="bt-right">
          <MyButton onClick={handleAddNewProgressNotes} prefixIcon={() => <PlusIcon />}>
            Add{' '}
          </MyButton>
        </div>
      </div>
      <MyTable
        data={sampleData}
        columns={columns}
        height={600}
        onRowClick={rowData => {
          setProgressNotes({ ...rowData });
        }}
        rowClassName={isSelected}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
      />
      <CancellationModal
        title="Cancel Progress Notes"
        fieldLabel="Cancellation Reason"
        open={popupCancelOpen}
        setOpen={setPopupCancelOpen}
        object={progressNotes}
        setObject={setProgressNotes}
        handleCancle={handleCancle}
        fieldName="cancellationReason"
      />
    </div>
  );
};

export default ProgressNotes;
