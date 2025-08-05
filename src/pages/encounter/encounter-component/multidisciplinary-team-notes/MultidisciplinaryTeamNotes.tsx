import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Checkbox, Panel } from 'rsuite';
import { MdModeEdit } from 'react-icons/md';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import './styles.less';
import AddEditMdtNote from './AddEditMdtNote';
import { formatDate, formatDateWithoutSeconds } from '@/utils';

import CancellationModal from '@/components/CancellationModal';
const MultidisciplinaryTeamNotes = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
  const [mdtNote, setMdtNode] = useState({});

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && mdtNote && rowData.key === mdtNote.key) {
      return 'selected-row';
    } else return '';
  };

  // dummy data
  const data = [
    {
      key: '1',
      shift: 'Morning',
      role: 'Physiotherapist',
      name: 'Dr. Sarah Johnson',
      note: 'Mobility session completed. Improved left leg range of motion.',
      createdAt: '2025-02-15 08:30',
      createdBy: 'Dr. Sarah Johnson',
      deletedAt: '',
      deletedBy: '',
      updatedAt: '2025-02-15 10:15',
      updatedBy: 'Dr. Sarah Johnson',
      cancelledReason: ''
    },
    {
      key: '2',
      shift: 'Morning',
      role: 'Nutritionist',
      name: 'Ms. Emily Chen',
      note: 'Diet plan modified for diabetes. Reduced carbs by 20%.',
      createdAt: '2025-02-15 09:00',
      createdBy: 'Ms. Emily Chen',
      deletedAt: '',
      deletedBy: '',
      updatedAt: '2025-02-15 11:30',
      updatedBy: 'Ms. Emily Chen',
      cancelledReason: ''
    },
    {
      key: '3',
      shift: 'Afternoon',
      role: 'Social Worker',
      name: 'Mr. David Rodriguez',
      note: 'Family meeting completed. Discharge planning arranged.',
      createdAt: '2025-02-15 14:00',
      createdBy: 'Mr. David Rodriguez',
      deletedAt: '',
      deletedBy: '',
      updatedAt: '2025-02-15 16:45',
      updatedBy: 'Mr. David Rodriguez',
      cancelledReason: ''
    },
    {
      key: '4',
      shift: 'Evening',
      role: 'Occupational Therapist',
      name: 'Ms. Lisa Thompson',
      note: 'ADL assessment done. Patient needs dressing assistance.',
      createdAt: '2025-02-15 18:00',
      createdBy: 'Ms. Lisa Thompson',
      deletedAt: '',
      deletedBy: '',
      updatedAt: '2025-02-15 19:30',
      updatedBy: 'Ms. Lisa Thompson',
      cancelledReason: ''
    }
  ];

  // Handle click on Add New Button
  const handleNew = () => {
    setPopupOpen(true);
    setMdtNode({});
  };

  //icons column (Medical sheets, Edite, Active/Deactivate)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setPopupOpen(true);
        }}
      />
    </div>
  );
  // table Columns
  const tableColumns = [
    {
      key: 'shift',
      title: <Translate>Shift</Translate>
    },
    {
      key: 'role',
      title: <Translate>Role</Translate>
    },
    {
      key: 'name',
      title: <Translate>Name</Translate>
    },
    {
      key: 'note',
      title: <Translate>Note</Translate>
    },
    {
      key: '',
      title: <Translate>Created At/By</Translate>,
      expandable: true,
      render: (row: any) =>
        row?.createdAt ? (
          <>
            {row?.createdBy}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: '',
      title: <Translate>Cancelled At/By</Translate>,
      expandable: true,
      render: (row: any) =>
        row?.deletedAt ? (
          <>
            {row?.deletedBy}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.deletedAt)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: '',
      title: <Translate>Updated At/By</Translate>,
      render: (row: any) =>
        row?.updatedAt ? (
          <>
            {row?.updatedBy}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.updatedAt)}</span>
          </>
        ) : (
          ' '
        ),

      expandable: true
    },
    {
      key: 'cancelledReason',
      title: <Translate>Cancelled Reason</Translate>,
      expandable: true
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 4,
      render: () => iconsForActions()
    }
  ];

  // handle cancel
  const handleCancle = async () => {
    setOpenCancellationReasonModel(false);
  };

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Panel>
      <div className="container-of-header-action-mdt">
        <div>
          <MyButton
            prefixIcon={() => <CloseOutlineIcon />}
            onClick={() => setOpenCancellationReasonModel(true)}
            disabled={mdtNote?.key == null ? true : false}
          >
            Cancel
          </MyButton>

          <Checkbox>Show Cancelled</Checkbox>
        </div>
        <MyButton prefixIcon={() => <PlusIcon />} onClick={handleNew}>
          Add New
        </MyButton>
      </div>
      <MyTable
        data={data}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setMdtNode(rowData);
        }}
      />
      <AddEditMdtNote
        open={popupOpen}
        setOpen={setPopupOpen}
        mdtNote={mdtNote}
        setMdtNote={setMdtNode}
        width={width}
      />
      <CancellationModal
        open={openCancellationReasonModel}
        setOpen={setOpenCancellationReasonModel}
        object={mdtNote}
        setObject={setMdtNode}
        handleCancle={handleCancle}
        fieldName="cancelledReason"
        fieldLabel={'Cancelled Reason'}
        title={'Cancellation'}
      ></CancellationModal>
    </Panel>
  );
};

export default MultidisciplinaryTeamNotes;
