import MyTable from '@/components/MyTable';
import React, { useState, useEffect } from 'react';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { Form } from 'rsuite';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import OpenDetailsTableModal from './OpenDetailsTableModal';
import {
  faDownload,
  faCircleCheck,
  faCircleXmark,
  faCheckDouble,
  faPaperclip,
  faPrint,
  faEye,
  faPlug,
  faBan
} from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import './Styles.less';
import { formatDateWithoutSeconds } from '@/utils';
import AttachmentUploadModal from '@/components/AttachmentUploadModal';
import ReactDOMServer from 'react-dom/server';
import { useDispatch } from 'react-redux';
import { setPageCode, setDivContent } from '@/reducers/divSlice';
import Translate from '@/components/Translate';
//MainTable Data
const sampleData = [
  {
    id: 1,
    initiatedBy: 'Farouk',
    initiatedDepartment: 'Procurement',
    createdBy: 'Ahmad',
    categoryName: 'Electronics',
    creationDate: '2025-07-20',
    estimatedDeliveryDate: '2025-08-01',
    recommendedSupplier: 'TechZone Ltd.',
    estimatedBudget: '$5,000',
    currency: 'USD',
    urgencyLevel: 'High',
    justification: 'Project need',
    createdDepartment: 'IT',
    lastPurchaseOrder: 'PO-1234',
    attachment: 'specs.pdf',
    stockName: 'Laptop',
    approvalBy: 'Manager A',
    orderId: 'ORD001',
    createdDateTime: '2025-07-20 10:30 AM',
    details: '',
    itemName: 'Dell Latitude 5430',
    itemCode: 'DL5430',
    unitOfMeasurement: 'Piece',
    quantity: 10,
    lastPurchasedDate: '2025-06-15',
    maxmanQuantity: 50,
    minimumQuantity: 5,
    specs: 'Intel i7, 16GB RAM, 512GB SSD',
    status: 'Available',
    approvalStatus: 'Approved',
    note: 'Urgent for new hires',
    itemClassification: 'Hardware',
    acceptBy: 'Inventory Manager',
    acceptDateTime: '2025-07-20 01:00 PM',
    approvedBy: 'Director A',
    approvedDate: '2025-07-21',
    approvalNote: 'Approved with remarks',
    Accept: true
  },
  {
    id: 2,
    initiatedBy: 'Qais',
    initiatedDepartment: 'Operations',
    createdBy: 'Sami',
    categoryName: 'Office Supplies',
    creationDate: '2025-07-18',
    estimatedDeliveryDate: '2025-07-25',
    recommendedSupplier: 'OfficePlus Co.',
    estimatedBudget: '$1,200',
    currency: 'USD',
    urgencyLevel: 'Medium',
    justification: 'Restocking',
    createdDepartment: 'Logistics',
    lastPurchaseOrder: 'PO-1122',
    attachment: 'quote.pdf',
    stockName: 'Printer Paper',
    approvalBy: 'Manager B',
    orderId: 'ORD002',
    createdDateTime: '2025-07-18 09:45 AM',
    details: '',
    itemName: 'A4 Paper 80gsm',
    itemCode: 'PAPER80A4',
    unitOfMeasurement: 'Box',
    quantity: 100,
    lastPurchasedDate: '2025-05-10',
    maxmanQuantity: 200,
    minimumQuantity: 50,
    specs: '500 sheets per box',
    status: 'Available',
    approvalStatus: 'Pending',
    note: 'Need by end of month',
    itemClassification: 'Stationery',
    acceptBy: 'Warehouse Supervisor',
    acceptDateTime: '2025-07-18 11:00 AM',
    approvedBy: 'Director B',
    approvedDate: '2025-07-19',
    approvalNote: 'Waiting for budget approval',
    Accept: false
  }
];
//Declares
const ListOfRequisition = () => {
  const dispatch = useDispatch();
  const [sortColumn, setSortColumn] = useState('name');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openConfirmDeleteModal, setOpenConfirmDeleteModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'undoaccept' | 'accept'>('undoaccept');
  const [tableData, setTableData] = useState(sampleData);
  const [openAttachModal, setOpenAttachModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);

  // Header page setUp - moved to useEffect
  useEffect(() => {
    const divContent = (
        "List of Requisition"
    );
    dispatch(setPageCode('List_of_Requisition'));
    dispatch(setDivContent(divContent));
  }, [dispatch]);

  //Accept/UndoAccept Handle
  const handleDeleteConfirm = () => {
    if (selectedItemId !== null) {
      setTableData(prev =>
        prev.map(item =>
          item.id === selectedItemId
            ? {
                ...item,
                Accept: actionType === 'accept',
                status: actionType === 'accept' ? 'Accept' : 'Undoaccept'
              }
            : item
        )
      );
    }
    setOpenConfirmDeleteModal(false);
    setSelectedItemId(null);
  };
  //Table Sort Data
  const sortedData = [...tableData].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    if (aValue === bValue) return 0;
    return sortType === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
  });

  const paginatedData = sortedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  //Fiter Content
  const FilterModel = (
    <Form fluid className="table-header-content">
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={[
          { label: 'Order id', key: 1 },
          { label: 'Department Name', key: 2 },
          { label: 'Initiated by', key: 3 },
          { label: 'Initiated Department', key: 4 },
          { label: 'Create Date From/To', key: 5 },
          { label: 'Created by', key: 6 },
          { label: 'Category', key: 7 },
          { label: 'Urgency Level', key: 8 },
          { label: 'Stock Name', key: 9 },
          { label: 'Status', key: 10 }
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
  );
  //Coulumns Configure Main Table
  const columns: ColumnConfig[] = [
    { key: 'initiatedBy', title: 'Initiated by', dataKey: 'initiatedBy', width: 150 },
    {
      key: 'initiatedDepartment',
      title: 'Initiated Department',
      dataKey: 'initiatedDepartment',
      width: 180
    },
    { key: 'createdAtBy', title: 'Created by/at', dataKey: 'createdByAt', width: 150, expandable : true,
       render: (row: any) =>
        row?.createdDateTime ? (
          <>
            {row?.createdBy}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(row.createdDateTime)}
            </span>{' '}
          </>
        ) : (
          ' '
        )},
    { key: 'categoryName', title: 'Category Name', dataKey: 'categoryName', width: 160 },
    {
      key: 'estimatedDeliveryDate',
      title: 'Estimated Delivery Date',
      dataKey: 'estimatedDeliveryDate',
      width: 170,
      render: (row: any) =>
        row?.estimatedDeliveryDate ? (
          <>
            <span className="date-table-style">
              {formatDateWithoutSeconds(row.estimatedDeliveryDate)}
            </span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'recommendedSupplier',
      title: 'Recommended Supplier',
      dataKey: 'recommendedSupplier',
      width: 180
    },
    { key: 'estimatedBudget', title: 'Estimated Budget', dataKey: 'estimatedBudget', width: 150 },
    { key: 'currency', title: 'Currency', dataKey: 'currency', width: 100 },
    {
      key: 'urgencyLevel',
      title: 'Urgency Level',
      dataKey: 'urgencyLevel',
      width: 130,
      expandable: true
    },
    {
      key: 'justification',
      title: 'Justification',
      dataKey: 'justification',
      width: 180,
      expandable: true
    },
    {
      key: 'createdDepartment',
      title: 'Created Department',
      dataKey: 'createdDepartment',
      width: 180,
      expandable: true
    },
    {
      key: 'lastPurchaseOrder',
      title: 'Last Purchase Order',
      dataKey: 'lastPurchaseOrder',
      width: 130,
      expandable: true
    },
{
  key: 'download',
  title: 'Download',
  dataKey: 'download',
  width: 130,
  render: () => (
    <FontAwesomeIcon
      icon={faDownload}
      style={{ cursor: 'pointer', fontSize: '16px', color: '#007bff' }}
    />
  )
},
    { key: 'stockName', title: 'Stock Name', dataKey: 'stockName', width: 140, expandable: true },
    {
      key: 'approvalBy',
      title: 'Approval by',
      dataKey: 'approvalBy',
      width: 140,
      expandable: true
    },
{ key: 'orderId', title: 'Order ID', dataKey: 'orderId', width: 100, expandable: true },
    //Main Table Icons
    {
      key: 'actions',
      title: '',
      width: 120,
      align: 'center',
      render: rowData => {
        return (
          <div className="container-of-icons">
            <FontAwesomeIcon
              icon={faEye}
              title="View Orders"
              id="icon0-0"
              onClick={() => setOpenDetailsModal(true)}
            />
            {rowData.Accept ? (
              <FontAwesomeIcon
                icon={faCircleXmark}
                className="icons-style"
                id="icon1"
                title="Undoaccept"
                onClick={() => {
                  setSelectedItemId(rowData.id);
                  setActionType('undoaccept');
                  setOpenConfirmDeleteModal(true);
                }}
              />
            ) : (
              <FontAwesomeIcon
                icon={faCircleCheck}
                id="icon2"
                className="icons-style"
                title="Accept"
                onClick={() => {
                  setSelectedItemId(rowData.id);
                  setActionType('accept');
                  setOpenConfirmDeleteModal(true);
                }}
              />
            )}
            <FontAwesomeIcon icon={faCheckDouble} id="icon3" title="Approved" />
            <FontAwesomeIcon
              icon={faPaperclip}
              title="Add Attachment"
              id="icon4"
              onClick={() => setOpenAttachModal(true)}
            />
            <FontAwesomeIcon icon={faPrint} id="icon5" title="Print Order" />
            <FontAwesomeIcon icon={faPlug} title="ERP Integration" id="icon6" />
            <FontAwesomeIcon icon={faBan} title="Reject Order" id="icon7" />
          </div>
        );
      }
    }
  ];
  return (
    <>
      <MyTable
        data={paginatedData}
        columns={columns}
        loading={false}
        filters={FilterModel}
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
      <AttachmentUploadModal
        isOpen={openAttachModal}
        setIsOpen={setOpenAttachModal}
        actionType={'add'}
        refecthData={null}
        attachmentSource={null}
        attatchmentType={''}
        patientKey={''}
      />
      <OpenDetailsTableModal open={openDetailsModal} setOpen={setOpenDetailsModal} />
    </>
  );
};

export default ListOfRequisition;
