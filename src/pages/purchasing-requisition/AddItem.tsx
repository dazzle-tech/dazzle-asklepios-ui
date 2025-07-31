import React, { useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ChildModal from '@/components/ChildModal/ChildModal';
import {
  faPlus,
  faPen,
  faTrash,
  faRotate,
  faCartPlus,
  faBroom
} from '@fortawesome/free-solid-svg-icons';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { formatDateWithoutSeconds } from '@/utils';
import { faListAlt } from '@fortawesome/free-solid-svg-icons';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
// Component for adding items to a purchasing requisition
const AddItem = ({ open, setOpen }) => {
  // Fetching LOV values for Unit of Measurement
  const { data: UOMLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
  const [showChild, setShowChild] = useState(false);
  const [record, setRecord] = useState({
    initiatedBy: 'ali',
    initiatedDepartment: 'IT',
    categoryName: 'Electronics'
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRowToDelete, setSelectedRowToDelete] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [actionType, setActionType] = useState<'deactivate' | 'reactivate'>('deactivate');
  // Sample table data
  const [tableData, setTableData] = useState([
    {
      id: 1,
      item: 'ORD-1507 | Omega-3 Capsules',
      unitOfMeasurement: 'Capsules',
      quantity: 10,
      lastPurchasedDate: '2023-01-01',
      maxQuantity: 100,
      minQuantity: 5,
      specs: 'Specs 1',
      status: 'New',
      approvalStatus: 'Approved',
      note: 'Note 1',
      itemClassification: 'Asset',
      active: true
    },
    {
      id: 2,
      item: 'ORD-1521 | Vitamin D3 Tablets',
      unitOfMeasurement: 'Mg',
      quantity: 20,
      lastPurchasedDate: '2023-02-01',
      maxQuantity: 200,
      minQuantity: 10,
      specs: 'Specs 2',
      status: 'Inactive',
      approvalStatus: 'Pending',
      note: 'Note 2',
      itemClassification: 'Consumable',
      active: true
    }
  ]);
  // Handlers for table actions
  // Function to handle editing of items
  const handleEdit = row => {
    if (row.active) {
      setEditRow(row);
      setShowChild(true);
    }
  };
  // Function to handle deletion or reactivation of items
  const handleDelete = row => {
    if (row.active) {
      setSelectedItemId(row.id);
      setSelectedRowToDelete(row);
      setActionType('deactivate');
      setDeleteModalOpen(true);
    }
  };
  // Function to handle reactivation of items
  const handleRestore = row => {
    setSelectedItemId(row.id);
    setSelectedRowToDelete(row);
    setActionType('reactivate');
    setDeleteModalOpen(true);
  };
  // Function to handle deletion confirmation
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

  // Columns for the table
  const columns = [
    { key: 'item', title: 'Item' },
    { key: 'unitOfMeasurement', title: 'Unit of Measurement', dataKey: 'unitOfMeasurement' },
    { key: 'quantity', title: 'Quantity' },
    {
      key: 'lastPurchasedDate',
      title: 'Last Purchased Date',
      expandable: true,
      render: (row: any) =>
        row?.lastPurchasedDate ? (
          <>
            <span className="date-table-style">
              {formatDateWithoutSeconds(row?.lastPurchasedDate)}
            </span>{' '}
          </>
        ) : (
          ' '
        )
    },
    { key: 'maxQuantity', title: 'Maximum Quantity' },
    { key: 'minQuantity', title: 'Minimum Quantity', expandable: true },
    { key: 'specs', title: 'Specs', expandable: true },
    { key: 'status', title: 'Status', expandable: true },
    { key: 'approvalStatus', title: 'Approval Status', expandable: true },
    { key: 'note', title: 'Note', expandable: true },
    { key: 'itemClassification', title: 'Item Classification', expandable: true },
    {
      key: 'actions',
      title: 'Actions',
      align: 'center' as const,
      render: row => (
        <div className="container-of-icons">
          {row.active ? (
            <>
              <FontAwesomeIcon
                icon={faPen}
                className="icons-style"
                id="edit"
                onClick={() => handleEdit(row)}
                title={'Edit'}
              />
              <FontAwesomeIcon
                icon={faTrash}
                className="icons-style"
                id="delete"
                onClick={() => handleDelete(row)}
                title={'Delete'}
              />
            </>
          ) : (
            <FontAwesomeIcon
              icon={faRotate}
              className="icons-style"
              onClick={() => handleRestore(row)}
              title="Restore"
            />
          )}
        </div>
      )
    }
  ];

  // Main modal content
  const content = (
    <Form fluid>
      <div className="form-container">
        <MyInput
          fieldLabel="Initiated By"
          fieldName="initiatedBy"
          record={record}
          setRecord={setRecord}
          width={140}
          disabled={true}
        />
        <MyInput
          fieldLabel="Initiated Department"
          fieldName="initiatedDepartment"
          record={record}
          setRecord={setRecord}
          width={140}
          disabled={true}
        />
        <MyInput
          fieldLabel="Category Name"
          fieldName="categoryName"
          record={record}
          setRecord={setRecord}
          width={140}
          disabled={true}
        />
        <div className="btn-add">
          <MyButton
            prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
            color="var(--primary-blue)"
            onClick={() => setShowChild(true)}
            width="100px"
          >
            Add Item
          </MyButton>
        </div>
        <div className="table-flex">
          <MyTable data={tableData} columns={columns} height={300} />
        </div>
      </div>
    </Form>
  );

  // Child modal content
  const childModalContent = (
    <Form fluid>
      <div className="form-container">
        <MyInput
          fieldLabel="Item"
          fieldName="item"
          fieldType="select"
          record={editRow || record}
          setRecord={setRecord}
          width={510}
          required
          selectData={[
            { key: 'ORD-1507', lovDisplayVale: 'ORD-1507 | Omega-3 Capsules' },
            { key: 'ORD-1521', lovDisplayVale: 'ORD-1521 | Vitamin D3 Tablets' },
            { key: 'ORD-1603', lovDisplayVale: 'ORD-1603 | Paracetamol 500mg' },
            { key: 'ORD-1634', lovDisplayVale: 'ORD-1634 | Amoxicillin 250mg' },
            { key: 'ORD-1702', lovDisplayVale: 'ORD-1702 | Cough Syrup 120ml' },
            { key: 'ORD-1720', lovDisplayVale: 'ORD-1720 | Ibuprofen 200mg' },
            { key: 'ORD-1756', lovDisplayVale: 'ORD-1756 | Glucose Test Strips' },
            { key: 'ORD-1788', lovDisplayVale: 'ORD-1788 | Insulin Injection' },
            { key: 'ORD-1801', lovDisplayVale: 'ORD-1801 | Hand Sanitizer 250ml' },
            { key: 'ORD-1850', lovDisplayVale: 'ORD-1850 | Blood Pressure Monitor' }
          ]}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
        />

        <MyInput
          fieldLabel="Unit of Measurement"
          fieldName="unitOfMeasurement"
          fieldType="select"
          selectData={UOMLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={{}}
          setRecord={''}
          width={250}
          required
        />
        <MyInput
          fieldLabel="Quantity"
          fieldName="quantity"
          fieldType="number"
          record={editRow || record}
          setRecord={setRecord}
          width={250}
          required
        />
        <MyInput
          fieldLabel="Last Purchased Date"
          fieldName="lastPurchasedDate"
          placeholder="2025-03-03"
          fieldType="date"
          record={editRow || record}
          setRecord={setRecord}
          width={250}
          disabled={true}
        />
        <MyInput
          fieldLabel="Maximum Quantity"
          fieldName="maxQuantity"
          fieldType="number"
          record={editRow || record}
          setRecord={setRecord}
          width={250}
          required
        />
        <MyInput
          fieldLabel="Minimum Quantity"
          fieldName="minQuantity"
          placeholder="5"
          fieldType="number"
          record={editRow || record}
          setRecord={setRecord}
          width={250}
          disabled={true}
        />
        <MyInput
          fieldLabel="Specs"
          fieldName="specs"
          fieldType="text"
          record={editRow || record}
          setRecord={setRecord}
          width={250}
        />
        <MyInput
          fieldLabel="Approval Status"
          fieldName="approvalStatus"
          fieldType="text"
          record={editRow || record}
          setRecord={setRecord}
          width={250}
          required
        />
        <MyInput
          fieldLabel="Item Classification"
          fieldName="itemClassification"
          fieldType="select"
          selectData={[
            { key: 'asset', lovDisplayVale: 'Asset' },
            { key: 'consumable', lovDisplayVale: 'Consumable' }
          ]}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={editRow || record}
          setRecord={setRecord}
          width={250}
          required
        />
        <MyInput
          fieldLabel="Note"
          fieldName="note"
          fieldType="textarea"
          record={editRow || record}
          setRecord={setRecord}
          width={250}
        />
      </div>
    </Form>
  );

  return (
    <>
      <ChildModal
        open={open}
        setOpen={setOpen}
        showChild={showChild}
        setShowChild={setShowChild}
        title="Order Details"
        mainStep={[
          {
            title: 'Order Details',
            icon: <FontAwesomeIcon icon={faListAlt} />,
            footer: <MyButton prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}>clear</MyButton>
          }
        ]}
        childStep={[
          {
            title: 'Add Item',
            icon: <FontAwesomeIcon icon={faPlusCircle} />,
            footer: (
              <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
                onClick={() => setShowChild(true)}
              >
                Add Item
              </MyButton>
            )
          }
        ]}
        childTitle="Add Item"
        mainContent={content}
        childContent={childModalContent}
        hideActionChildBtn={true}
        mainSize="md"
        childSize="sm"
      />
      <DeletionConfirmationModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        itemToDelete={selectedRowToDelete ? selectedRowToDelete.itemName : ''}
        actionButtonFunction={handleDeleteConfirm}
        actionType={actionType}
      />
    </>
  );
};

export default AddItem;
