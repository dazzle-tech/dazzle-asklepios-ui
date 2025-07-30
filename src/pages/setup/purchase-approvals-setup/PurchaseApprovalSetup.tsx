import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyTable from '@/components/MyTable';
import React, { useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { Form, Panel } from 'rsuite';
import MyInput from '@/components/MyInput';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyButton from '@/components/MyButton/MyButton';
import ReactDOMServer from 'react-dom/server';
import { useDispatch } from 'react-redux';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { setPageCode, setDivContent } from '@/reducers/divSlice';
import AddPurchaseApprovalSetup from './AddPurchaseApprovalSetup';
import { MdModeEdit } from 'react-icons/md';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import './styles.less';
//Table Data
const sampleData = [
  {
    id: 1,
    typeOfPurchase: 'Procurement',
    responsibleDepartment: 'IT',
    approvalBy: 'Department Head',
    hierarchyOfApproval: 'Procurement',
    status: 'Active',
    active: true
  },
  {
    id: 2,
    typeOfPurchase: 'Manegment',
    responsibleDepartment: 'Procurement',
    approvalBy: 'IT Manager',
    hierarchyOfApproval: 'Manegment',
    status: 'Deactive',
    active: false
  },
  {
    id: 3,
    typeOfPurchase: 'Commercial',
    responsibleDepartment: 'IT',
    approvalBy: 'Department HR',
    hierarchyOfApproval: 'Management',
    status: 'Active',
    active: true
  },
  {
    id: 4,
    typeOfPurchase: 'Non-Commercial',
    responsibleDepartment: 'Procurement',
    approvalBy: 'Department Head',
    hierarchyOfApproval: 'Non-Commercial',
    status: 'Deactive',
    active: false
  },
  {
    id: 5,
    typeOfPurchase: 'Management',
    responsibleDepartment: 'Procurement',
    approvalBy: 'IT Manager',
    hierarchyOfApproval: 'Commercial',
    status: 'Active',
    active: true
  }
];
//declares
const PurchaseApprovalSetup = () => {
  const dispatch = useDispatch();
  const [sortColumn, setSortColumn] = useState('typeOfPurchase');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openModal, setOpenModal] = useState(false);
  const [tableData, setTableData] = useState(sampleData);
  const [openConfirmDeleteModal, setOpenConfirmDeleteModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [record, setRecord] = useState(null);
  const { data: purchaseLovQueryResponse } = useGetLovValuesByCodeQuery('PURCH_TYPES');

  //Active/Deactive the Status
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
  //Table Header Column
  const columns: ColumnConfig[] = [
    { key: 'typeOfPurchase', title: 'Types of Purchase', dataKey: 'typeOfPurchase', width: 100 },
    {
      key: 'responsibleDepartment',
      title: 'Responsible Department',
      dataKey: 'responsibleDepartment',
      width: 100,
      align: 'left'
    },
    { key: 'approvalBy', title: 'Approval by', dataKey: 'approvalBy', width: 150 },
    {
      key: 'hierarchyOfApproval',
      title: 'Hierarchy of Approval',
      dataKey: 'hierarchyOfApproval',
      width: 150
    },
    { key: 'status', title: 'Status', dataKey: 'status', width: 100 },
    {
      key: 'actions',
      title: '',
      width: 120,
      align: 'center',
      render: rowData => {
        return (
          <div className="container-of-icons">
                        <MdModeEdit
                          title="Edit"
                          id="icon0-0"/>
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
        );
      }
    }
  ];

  //Table Sort Data
  const sortedData = [...tableData].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    if (aValue === bValue) return 0;
    return sortType === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
  });

  const paginatedData = sortedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  // Header page setUp
  const divContent = (
    <div className="page-title">
      <h5>Purchase Approval Setup</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Purchase_Approval'));
  dispatch(setDivContent(divContentHTML));

  return (
    <>
      <Panel className="main-purchase-approval-page-gaps">
        <div className="add-new-purchase-approval-button">
          <MyButton prefixIcon={() => <AddOutlineIcon />} onClick={() => setOpenModal(true)}>
            Add New
          </MyButton>
        </div>

        <MyTable
          data={paginatedData}
          columns={columns}
          filters={
            <Form fluid className="table-header-content">
              <MyInput
                selectDataValue="value"
                selectDataLabel="label"
                selectData={[
                  { label: 'Types of Purchase', key: 1 },
                  { label: 'Responsible Department', key: 2 },
                  { label: 'Approval by', key: 3 },
                  { label: 'Hierarchy of Approval', key: 4 },
                  { label: 'Status', key: 5 }
                ]}
                fieldName="filter"
                fieldType="select"
                record={''}
                setRecord={''}
                showLabel={false}
                placeholder="Select Filter"
                searchable={false}
              />
              <MyInput
                fieldName="value"
                fieldType="text"
                record={''}
                setRecord={''}
                showLabel={false}
                placeholder="Search"
              />
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
        <DeletionConfirmationModal
          open={openConfirmDeleteModal}
          setOpen={setOpenConfirmDeleteModal}
          itemToDelete="Purchase Type"
          actionButtonFunction={handleDeleteConfirm}
          actionType={actionType}
        />

        <AddPurchaseApprovalSetup
          open={openModal}
          setOpen={setOpenModal}
          record={record}
          setRecord={setRecord}
          purchaseLovQueryResponse={purchaseLovQueryResponse}
        />
      </Panel>
    </>
  );
};

export default PurchaseApprovalSetup;
