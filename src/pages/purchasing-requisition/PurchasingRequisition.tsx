import React, { useState, useEffect } from 'react';
import { Form, Panel } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { initialListRequest, ListRequest } from '@/types/types';
import { faPen, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
import ReactDOMServer from 'react-dom/server';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import AttachmentModal from '@/components/AttachmentUploadModal/AttachmentUploadModal';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { formatDateWithoutSeconds } from '@/utils';
import AddPurchasing from './AddPurchasing';

//table data
const sampleData = [
  {
    id: 1,
    InitiatedBy: 'Ahmed Khalil',
    InitiatedDate: '2025-08-05',
    InitiatedDepartment: 'Procurement',
    CreatedBy: 'Mohammad Naser',
    ItemCategoryName: 'Office Supplies',
    CreationDate: '2025-07-20',
    EstimatedDeliveryDate: '2025-08-01',
    RecommendedSupplier: 'Alpha Traders Ltd.',
    EstimatedBudget: '1500',
    Currency: 'USD',
    UrgencyLevel: 'High',
    Justification: 'Restocking essential office materials',
    CreatedDepartment: 'Procurement',
    LastPurchaseOrder: 'PO-2024-0298',
    Attachments: ['invoice.pdf', 'quotation.docx'],
    StockName: 'Stationery',
    ApprovalBy: 'Rania Jaber',
    ApprovalDate: '2025-07-22',
    OrderID: 'REQ-00123',
    PurchaseRequisitionType: 'Commercial',
    active: true
  },
  {
    id: 2,
    InitiatedBy: 'Lina Mansour',
    InitiatedDate: '2025-08-05',
    InitiatedDepartment: 'IT',
    CreatedBy: 'Tariq Zahran',
    ItemCategoryName: 'Electronics',
    CreationDate: '2025-07-22',
    EstimatedDeliveryDate: '2025-08-05',
    RecommendedSupplier: 'TechWorld Inc.',
    EstimatedBudget: '9800',
    Currency: 'USD',
    UrgencyLevel: 'Medium',
    Justification: 'Upgrade network infrastructure',
    CreatedDepartment: 'IT',
    LastPurchaseOrder: 'PO-2023-0842',
    Attachments: ['specifications.pdf'],
    StockName: 'Networking Devices',
    ApprovalBy: 'Khaled Hamdan',
    ApprovalDate: '2025-07-22',
    OrderID: 'REQ-00124',
    PurchaseRequisitionType: 'Non-Commercial',
    active: true
  }
];
const PurchasingRequisition = () => {
  const dispatch = useAppDispatch();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRowToDelete, setSelectedRowToDelete] = useState<any>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedAttachmentRow, setSelectedAttachmentRow] = useState<any>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [tableData, setTableData] = useState(sampleData);
  const [actionType, setActionType] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [actionTypes, setActionTypes] = useState<'view' | 'download' | 'add' | null>(null);
  const [requestedPatientAttachment, setRequestedPatientAttachment] = useState<
    string | undefined
  >();
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15
  });
  const [record, setRecord] = useState({
    text: '',
    number: 0,
    checkbox: true,
    date: new Date(),
    datetime: new Date(),
    time: new Date(),
    select: '',
    multy: [],
    check: false,
    textarea: '',
    checkPicker: []
  });

  //columns
  const columns: ColumnConfig[] = [
    {
      key: 'InitiatedBy',
      title: 'INITIATED BY/AT',
      dataKey: 'InitiatedBy',
      expandable: true,
      width: 120,
      render: (row: any) =>
        row?.InitiatedDate ? (
          <>
            {row?.InitiatedBy}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(row?.InitiatedDate)}
            </span>{' '}
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'InitiatedDepartment',
      title: 'Initiated Department',
      dataKey: 'InitiatedDepartment',
      width: 140
    },
    {
      key: 'CreatedBy',
      title: 'CREATED BY/AT',
      dataKey: 'CreatedBy',
      expandable: true,
      width: 120,
      render: (row: any) =>
        row?.CreationDate ? (
          <>
            {row?.CreatedBy}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(row.CreationDate)}
            </span>{' '}
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'ItemCategoryName',
      title: 'Item Category',
      dataKey: 'ItemCategoryName',
      width: 140
    },
    {
      key: 'EstimatedDeliveryDate',
      title: 'Est. Delivery Date',
      dataKey: 'EstimatedDeliveryDate',
      expandable: true,
      width: 140
    },
    {
      key: 'RecommendedSupplier',
      title: 'Recommended Supplier',
      dataKey: 'RecommendedSupplier',
      width: 160
    },
    {
      key: 'EstimatedBudget',
      title: 'Estimated Budget',
      dataKey: 'EstimatedBudget',
      width: 140
    },
    {
      key: 'Currency',
      title: 'Currency',
      dataKey: 'Currency',
      width: 100
    },
    {
      key: 'UrgencyLevel',
      title: 'Urgency Level',
      dataKey: 'UrgencyLevel',
      width: 120
    },
    {
      key: 'Justification',
      title: 'Justification',
      dataKey: 'Justification',
      width: 140
    },
    {
      key: 'CreatedDepartment',
      title: 'Created Department',
      dataKey: 'CreatedDepartment',
      expandable: true,
      width: 140
    },
    {
      key: 'LastPurchaseOrder',
      title: 'Last Purchase Order',
      dataKey: 'LastPurchaseOrder',
      expandable: true,
      width: 160
    },
    {
      key: 'Attachments',
      title: 'Attachments',
      dataKey: 'Attachments',
      width: 120,
      render: row => (
        <MyButton
          onClick={() => {
            setSelectedAttachmentRow(row);
            setShowAttachmentModal(true);
            setActionTypes('view');
            setRequestedPatientAttachment(row.Attachments?.[0]?.key);
          }}
        >
          <FontAwesomeIcon icon={faPaperclip} />
          Attachments
        </MyButton>
      )
    },
    {
      key: 'StockName',
      title: 'Stock Name',
      dataKey: 'StockName',
      expandable: true,
      width: 130
    },
    {
      key: 'ApprovalBy',
      title: 'APPROVAL By/AT',
      dataKey: 'ApprovalBy',
      expandable: true,
      width: 130,
      render: (row: any) =>
        row?.ApprovalDate ? (
          <>
            {row?.ApprovalBy}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(row.ApprovalDate)}
            </span>{' '}
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'OrderID',
      title: 'Order ID',
      dataKey: 'OrderID',
      expandable: true,

      width: 100
    },
    {
      key: 'PurchaseRequisitionType',
      title: 'Requisition Type',
      dataKey: 'PurchaseRequisitionType',
      expandable: true,
      width: 150
    },
    {
      key: 'actions',
      title: '',
      width: 150,
      align: 'center',
      render: row => (
        <div className="container-of-icons">
          <FontAwesomeIcon
            icon={faCheckCircle}
            title="Confirm"
            id="confirm"
            className="icons-style"
            size="lg"
            fill="var(--primary-green)"
          />

          <FontAwesomeIcon
            icon={faPen}
            title="Edit"
            id="edit"
            className="icons-style"
            size="lg"
            fill="var(--primary-blue)"
            onClick={() => {
              // setOpen(true); // This line is removed as per the edit hint
            }}
          />

          {row?.active ? (
            <FontAwesomeIcon
              icon={faTrash}
              title="Delete"
              id="delete"
              className="icons-style"
              size="lg"
              fill="var(--primary-gray)"
              onClick={() => {
                setSelectedItemId(row.id);
                setSelectedRowToDelete(row);
                setActionType('deactivate');
                setDeleteModalOpen(true);
              }}
            />
          ) : (
            <FontAwesomeIcon
              icon={faRotate}
              title="Restore"
              className="icons-style"
              size="lg"
              fill="var(--primary-pink)"
              onClick={() => {
                setSelectedItemId(row.id);
                setSelectedRowToDelete(row);
                setActionType('reactivate');
                setDeleteModalOpen(true);
              }}
            />
          )}
        </div>
      )
    }
  ];
  // Header page setUp
  const divContent = (
    <div className="page-title">
      <h5>Purchasing Requisition</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Purchasing_Requisition'));
  dispatch(setDivContent(divContentHTML));
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = tableData.length;
  //  paginatedData
  const paginatedData = tableData.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage);

  // handles
  // handle page change
  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };
  // Handle change rows per page in navigation
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };
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
    setDeleteModalOpen(false);
    setSelectedItemId(null);
    setSelectedRowToDelete(null);
  };

  //  useEffect
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  return (
    <>
      <Panel>
        <div className="container-of-add-new-button">
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={() => setAddModalOpen(true)}
            width="109px"
          >
            Add New
          </MyButton>
        </div>

        <MyTable
          height={450}
          data={paginatedData}
          columns={columns}
          filters={
            <>
              <Form fluid className="search">
                <MyInput
                  fieldName=""
                  fieldType="select"
                  placeholder="Select Filter"
                  selectData={[
                    { key: 'Initiated Department', lovDisplayVale: 'Initiated Department' },
                    { key: 'Item Category', lovDisplayVale: 'Item Category' }
                  ]}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={record}
                  setRecord={setRecord}
                  width={145}
                />

                <MyInput fieldName="" placeholder="Search" record={''} setRecord={''} width={145} />
              </Form>
            </>
          }
          onRowClick={row => console.log('Clicked row:', row)}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />

        <AddPurchasing open={addModalOpen} setOpen={setAddModalOpen} />

        <DeletionConfirmationModal
          open={deleteModalOpen}
          setOpen={setDeleteModalOpen}
          itemToDelete={`Order ID ${selectedRowToDelete?.OrderID || ''}`}
          actionButtonFunction={handleDeleteConfirm}
          actionType={actionType}
        />
        <AttachmentModal
          isOpen={showAttachmentModal}
          setIsOpen={setShowAttachmentModal}
          attachmentSource={{ key: selectedAttachmentRow?.OrderID ?? '' }}
          attatchmentType={selectedAttachmentRow?.PurchaseRequisitionType ?? ''}
          actionType={actionTypes}
          setActionType={setActionTypes}
          selectedPatientAttacment={null}
          setSelectedPatientAttacment={() => null}
          setRequestedPatientAttacment={setRequestedPatientAttachment}
          requestedPatientAttacment={requestedPatientAttachment}
          patientKey={selectedAttachmentRow?.OrderID ?? ''}
        />
      </Panel>
    </>
  );
};
export default PurchasingRequisition;
