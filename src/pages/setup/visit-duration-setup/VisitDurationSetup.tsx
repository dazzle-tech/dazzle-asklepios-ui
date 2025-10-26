import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyTable from '@/components/MyTable';
import React, { useEffect, useState } from 'react';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { Form, Panel } from 'rsuite';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import ReactDOMServer from 'react-dom/server';
import { useDispatch } from 'react-redux';
import { setPageCode, setDivContent } from '@/reducers/divSlice';
import { formatDateWithoutSeconds } from '@/utils';
import VisitDurationSetupModal from './VisitDurationSetupModal';
import { useLocation } from 'react-router-dom';

// Sample table data
const sampleData = [
  {
    id: 1,
    visitType: 'Consultion',
    duration: '30 mins',
    resourceSpecific: 'Yes',
    resourceType: 'Doctor',
    resource: 'Dr. Ahmad',
    status: 'Active',
    createdBy: 'System',
    createdAt: '2025-08-07T14:40:00',
    active: true
  },
  {
    id: 2,
    visitType: 'Operation',
    duration: '60 mins',
    resourceSpecific: 'No',
    resourceType: '',
    resource: '',
    status: 'Deactive',
    createdBy: 'System',
    createdAt: '2025-08-07T14:40:00',
    active: false
  },
  {
    id: 3,
    visitType: 'Follow-up',
    duration: '15 mins',
    resourceSpecific: 'Yes',
    resourceType: 'Doctor',
    resource: 'Dr. Farouk',
    status: 'Active',
    createdBy: 'System',
    createdAt: '2025-08-07T14:40:00',
    active: true
  }
];

const VisitDurationSetup = () => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  // State for table sorting, pagination, and modal control
  const [sortColumn, setSortColumn] = useState('visitType');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [tableData, setTableData] = useState(sampleData);

  // State for delete/reactivate confirmation modal
  const [openConfirmDeleteModal, setOpenConfirmDeleteModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'reactivate'>('deactivate');

  // Record to edit
  const [record, setRecord] = useState(null);

  // Handle confirm delete or reactivate
  const handleDeleteConfirm = () => {
    if (selectedItemId !== null) {
      setTableData(prev =>
        prev.map(item =>
          item.id === selectedItemId
            ? {
                ...item,
                active: actionType === 'reactivate',
                status: actionType === 'reactivate' ? 'Active' : 'Deactive'
              }
            : item
        )
      );
    }
    setOpenConfirmDeleteModal(false);
    setSelectedItemId(null);
  };

  // Define table columns
  const columns = [
    { key: 'visitType', title: 'Visit Type', dataKey: 'visitType', width: 120 },
    { key: 'duration', title: 'Duration', dataKey: 'duration', width: 100 },
    {
      key: 'resourceSpecific',
      title: 'Resource Specific',
      dataKey: 'resourceSpecific',
      width: 150
    },
    { key: 'resourceType', title: 'Resource Type', dataKey: 'resourceType', width: 150 },
    { key: 'resource', title: 'Resource', dataKey: 'resource', width: 150 },
    {
      key: 'createdByAt',
      title: 'Created By\\At',
      dataKey: 'createdBy',
      width: 220,
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
      key: 'actions',
      title: '',
      width: 120,
      align: 'center',
      render: rowData => (
        <div className="container-of-icons">
          {/* Edit icon */}
          <MdModeEdit
            title="Edit"
            id="icon0-0"
            size={24}
            className="icons-style"
            onClick={() => {
              setRecord(rowData);
              setModalMode('edit');
              setOpenModal(true);
            }}
          />
          {/* Delete or Reactivate icon based on status */}
          {rowData.active ? (
            <MdDelete
              className="icons-style"
              title="Deactivate"
              size={24}
              fill="var(--primary-pink)"
              onClick={() => {
                setSelectedItemId(rowData.id);
                setActionType('deactivate');
                setOpenConfirmDeleteModal(true);
              }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              title="Reactivate"
              fill="var(--primary-gray)"
              size={24}
              onClick={() => {
                setSelectedItemId(rowData.id);
                setActionType('reactivate');
                setOpenConfirmDeleteModal(true);
              }}
            />
          )}
        </div>
      )
    }
  ];

  // Sort table data based on selected column and direction
  const sortedData = [...tableData].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    if (aValue === bValue) return 0;
    return sortType === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
  });

  // Pagination logic
  const paginatedData = sortedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  // Header page setup: dispatch inside useEffect bound to path
  useEffect(() => {
    const divContent = (
      <div className="page-title">
        <h5>Visit Duration Setup</h5>
      </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);

    dispatch(setPageCode('Visit_Duration_Setup'));
    dispatch(setDivContent(divContentHTML));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, pathname]);

  return (
    <Panel className="main-visit-duration-page-gaps">
      {/* Main Table Component */}
      <MyTable
        data={paginatedData}
        columns={columns}
        filters={<></>}
        tableButtons={
          <Form fluid>
            <div className="bt-div">
              <div className="bt-right">
                <MyButton
                  prefixIcon={() => <PlusIcon />}
                  onClick={() => {
                    setModalMode('add');
                    setRecord(null);
                    setOpenModal(true);
                  }}
                >
                  Add
                </MyButton>
              </div>
            </div>
          </Form>
        }
        height={470}
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

      {/* Delete / Reactivate Confirmation Modal */}
      <DeletionConfirmationModal
        open={openConfirmDeleteModal}
        setOpen={setOpenConfirmDeleteModal}
        itemToDelete="Visit Duration"
        actionButtonFunction={handleDeleteConfirm}
        actionType={actionType}
      />

      {/* Add / Edit Modal */}
      <VisitDurationSetupModal
        open={openModal}
        setOpen={setOpenModal}
        mode={modalMode}
        record={record}
      />
    </Panel>
  );
};

export default VisitDurationSetup;
