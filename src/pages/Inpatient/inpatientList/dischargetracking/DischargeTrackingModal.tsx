import React from 'react';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import './style.less';
// Dummy data for the tables
const dischargeInfo = [
  {
    id: 1,
    patientName: 'John Doe',
    mrn: 'MRN001',
    expectedDischargeDate: '2025-09-05',
    updatedBy: 'Dr. Ahmad',
    updatedAt: '2025-08-31 10:00'
  },
];

const pendingOrders = [
  {
    id: 1,
    orderType: 'Lab',
    name: 'CBC',
    orderedBy: 'Dr. Rami',
    orderedAt: '2025-08-30 14:15',
    status: 'Pending'
  },
  {
    id: 2,
    orderType: 'Radiology',
    name: 'Chest X-Ray',
    orderedBy: 'Dr. Sarah',
    orderedAt: '2025-08-30 15:40',
    status: 'Completed'
  }
];

const approvalStatus = [
  {
    id: 1,
    approvalType: 'Pharmacy Approval',
    status: 'Approved',
    expireIn: '2h 15m'
  },
  {
    id: 2,
    approvalType: 'Insurance',
    status: 'Pending',
    expireIn: '6h 0m'
  }
];

// Columns for each table
const dischargeColumns = [
  { key: 'patientName', title: 'Patient Name', width: 210 },
  { key: 'mrn', title: 'MRN', width: 210 },
  { key: 'expectedDischargeDate', title: 'Expected Discharge Date', width: 210 },
  {
    key: 'updatedByAt',
    title: 'Updated By / At',
    width: 205,
    render: row => (
      <>
        <div>{row.updatedBy}</div>
        <div style={{ fontSize: '12px', color: '#888' }}>{row.updatedAt}</div>
      </>
    )
  }
];

const pendingOrdersColumns = [
  { key: 'orderType', title: 'Order Type', width: 100 },
  { key: 'name', title: 'Name', width: 100 },
  {
    key: 'orderedByAt',
    title: 'Ordered By / At',
    width: 100,
    render: row => (
      <>
        <div>{row.orderedBy}</div>
        <div style={{ fontSize: '12px', color: '#888' }}>{row.orderedAt}</div>
      </>
    )
  },
  {
    key: 'status',
    title: 'Status',
    width: 100,
    render: row => (
      <MyBadgeStatus
        contant={row.status}
        backgroundColor={
          row.status === 'Pending' ? 'var(--light-gray)' : 'var(--light-green)'
        }
        color={
          row.status === 'Pending' ? 'var(--primary-gray)' : 'var(--primary-green)'
        }
      />
    )
  }
];

const approvalStatusColumns = [
  { key: 'approvalType', title: 'Approval Type', width: 50 },
  {
    key: 'status',
    title: 'Status',
    width: 50,
    render: row => (
      <MyBadgeStatus
        contant={row.status}
        backgroundColor={
          row.status === 'Approved' ? 'var(--light-green)' : 'var(--light-gray)'
        }
        color={
          row.status === 'Approved' ? 'var(--primary-green)' : 'var(--primary-gray)'
        }
      />
    )
  },
  { key: 'expireIn', title: 'Expire In (Timer)', width: 50 }
];

// Main modal component
const DischargeTrackingModal = ({ open, setOpen }) => {
  return (
<div className='discharge-tracking-modal-main-container'>
<MyTable
  data={dischargeInfo}
  columns={dischargeColumns}
  page={0}
  rowsPerPage={dischargeInfo.length}
  totalCount={dischargeInfo.length}
  sortColumn={''}
  sortType={''}
  onSortChange={() => {}}
  onPageChange={() => {}}
  onRowsPerPageChange={() => {}}
  showPagination={false}
/>
<MyTable
  data={pendingOrders}
  columns={pendingOrdersColumns}
  page={0}
  rowsPerPage={pendingOrders.length}
  totalCount={pendingOrders.length}
  sortColumn={''}
  sortType={''}
  onSortChange={() => {}}
  onPageChange={() => {}}
  onRowsPerPageChange={() => {}}
  showPagination={false}
/>


<MyTable
  data={approvalStatus}
  columns={approvalStatusColumns}
  page={0}
  rowsPerPage={approvalStatus.length}
  totalCount={approvalStatus.length}
  sortColumn={''}
  sortType={''}
  onSortChange={() => {}}
  onPageChange={() => {}}
  onRowsPerPageChange={() => {}}
  showPagination={false}
/>

  </div>);
};

export default DischargeTrackingModal;
