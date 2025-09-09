import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import './styles.less';
import { GiKidneys } from 'react-icons/gi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import AttachmentModal from '@/components/AttachmentUploadModal/AttachmentUploadModal';
import MyModal from '@/components/MyModal/MyModal';
import DialysisRequestModal from './DialysisRequestModal';
// Sample data for Dialysis Requests
const initialDialysisData = [
  {
    id: 1,
    createdBy: 'Dr. Sarah',
    createdAt: '2025-08-01 09:00 AM',
    reason: 'test',
    dialysisType: 'Hemodialysis',
    frequency: '3 times/week',
    priority: 'High',
    department: 'Nephrology',
    scheduledDate: '2025-08-05'
  },
  {
    id: 2,
    createdBy: 'Nurse Ali',
    createdAt: '2025-08-03 11:30 AM',
    reason: 'test',
    dialysisType: 'Peritoneal',
    frequency: 'Daily',
    priority: 'Medium',
    department: 'Internal Medicine',
    scheduledDate: '2025-08-06'
  }
];

// Table column configuration
const columns: ColumnConfig[] = [
  {
    key: 'createdByAt',
    title: 'Created By\\At',
    dataKey: 'createdByAt',
    width: 200,
    render: row => (
      <>
        {row.createdBy}
        <br />
        <span className="date-table-style">{row.createdAt}</span>
      </>
    )
  },
  {
    key: 'reason',
    title: 'Reason',
    dataKey: 'reason',
    width: 200
  },
  {
    key: 'dialysisType',
    title: 'Dialysis Type',
    dataKey: 'dialysisType',
    width: 150
  },
  {
    key: 'frequency',
    title: 'Frequency',
    dataKey: 'frequency',
    width: 140
  },
  {
    key: 'priority',
    title: 'Priority',
    dataKey: 'priority',
    width: 100
  },
  {
    key: 'department',
    title: 'Department',
    dataKey: 'department',
    width: 160
  },
  {
    key: 'scheduledDate',
    title: 'Scheduled Date',
    dataKey: 'scheduledDate',
    width: 150
  }
];

const DialysisRequest = () => {
  const [sortColumn, setSortColumn] = useState('scheduledDate');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [dialysisData, setDialysisData] = useState(initialDialysisData);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [openEncounterLogsModal, setOpenEncounterLogsModal] = useState(false);

  const sortedData = [...dialysisData].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (aVal === bVal) return 0;
    return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
  });

  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const tablebuttons = (
    <Form fluid>
      <div className="dialysis-request-buttons-right">
        <MyButton prefixIcon={() => <PlusIcon />} onClick={() => setOpenEncounterLogsModal(true)}>
          Add
        </MyButton>
      </div>
    </Form>
  );

  const isSelectedRow = rowData => {
    return rowData.id === selectedRowId ? 'selected-row' : '';
  };

  return (
    <div>
      <MyTable
        data={paginatedData}
        columns={columns}
        loading={false}
        tableButtons={tablebuttons}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={(col, type) => {
          setSortColumn(col);
          setSortType(type);
        }}
        rowClassName={isSelectedRow}
        onRowClick={rowData => setSelectedRowId(rowData.id)}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={sortedData.length}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={e => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      <MyModal
        open={openEncounterLogsModal}
        setOpen={setOpenEncounterLogsModal}
        title="Dialysis Request"
        size="60vw"
        content={<DialysisRequestModal />}
        steps={[{ title: 'Dialysis Request', icon: <GiKidneys size={20} /> }]}
        actionButtonLabel="Save"
        actionButtonFunction={() => {
          console.log('Saved!');
        }}
        cancelButtonLabel="Cancel"
        footerButtons={
          <MyButton onClick={() => setShowAttachmentModal(true)}>
            <FontAwesomeIcon icon={faPaperclip} /> Add Attachment
          </MyButton>
        }
      />

      <AttachmentModal
        isOpen={showAttachmentModal}
        setIsOpen={setShowAttachmentModal}
        selectedPatientAttacment={null}
        setSelectedPatientAttacment={() => null}
      />
    </div>
  );
};

export default DialysisRequest;
