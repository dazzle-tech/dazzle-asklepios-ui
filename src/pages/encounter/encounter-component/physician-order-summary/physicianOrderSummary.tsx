import MyTable from '@/components/MyTable';
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckToSlot, faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import TableModal from './TableModal';

import './style.less';

const PhysicianOrderSummary = () => {
  const [openModal, setOpenModal] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const rowsPerPage = 5;

  // Sample data for the main table
  const data = [
    {
      orderType: 'Medication',
      orderName: 'Paracetamol 500mg PO',
      priority: 'High',
      orderDate: '2025-08-06',
      orderTime: '08:00',
      scheduledDateTime: '2025-08-06 08:30',
      status: 'Completed'
    },
    {
      orderType: 'Lab Test',
      orderName: 'Complete Blood Count (CBC)',
      priority: 'Medium',
      orderDate: '2025-08-06',
      orderTime: '09:15',
      scheduledDateTime: '2025-08-06 10:00',
      status: 'Pending'
    },
    {
      orderType: 'Radiology',
      orderName: 'Chest X-Ray',
      priority: 'Low',
      orderDate: '2025-08-06',
      orderTime: '10:00',
      scheduledDateTime: '2025-08-06 11:30',
      status: 'Missed'
    },
    {
      orderType: 'Medication',
      orderName: 'Ibuprofen 400mg PO',
      priority: 'Medium',
      orderDate: '2025-08-06',
      orderTime: '11:00',
      scheduledDateTime: '2025-08-06 11:30',
      status: 'Completed'
    },
    {
      orderType: 'Lab Test',
      orderName: 'Urine Analysis',
      priority: 'Low',
      orderDate: '2025-08-06',
      orderTime: '12:00',
      scheduledDateTime: '2025-08-06 12:30',
      status: 'Pending'
    },
    {
      orderType: 'Procedure',
      orderName: 'IV Cannulation',
      priority: 'High',
      orderDate: '2025-08-06',
      orderTime: '13:00',
      scheduledDateTime: '2025-08-06 13:15',
      status: 'Completed'
    },
    {
      orderType: 'Medication',
      orderName: 'Aspirin 100mg PO',
      priority: 'High',
      orderDate: '2025-08-06',
      orderTime: '14:00',
      scheduledDateTime: '2025-08-06 14:30',
      status: 'Missed'
    }
  ];
  const totalCount = data.length;

  const paginatedData = data.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage);

  const handlePageChange = (event: unknown, newPageIndex: number) => {
    setPageIndex(newPageIndex);
  };

  // Columns for the main table
  const columns = [
    { title: 'Order Type', dataIndex: 'orderType', key: 'orderType' },
    { title: 'Order Name', dataIndex: 'orderName', key: 'orderName' },
    { title: 'Priority', dataIndex: 'priority', key: 'priority' },
    {
      title: 'Order Date&Time',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (rowData: any) =>
        rowData?.orderDate ? (
          <>
            {rowData.orderDate}
            <br />
            <span className="date-table-style">{rowData.orderTime}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      title: 'Scheduled Date&Time',
      dataIndex: 'scheduledDateTime',
      key: 'scheduledDateTime',
      render: (rowData: any) =>
        rowData?.scheduledDateTime ? (
          <>
            {rowData.scheduledDateTime.split(' ')[0]}
            <br />
            <span className="date-table-style">{rowData.scheduledDateTime.split(' ')[1]}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: rowData => {
        const status = rowData.status || 'Normal';

        const getStatusConfig = status => {
          switch (status) {
            case 'Completed':
              return {
                backgroundColor: 'var(--light-green)',
                color: 'var(--primary-green)',
                contant: 'Completed'
              };
            case 'Pending':
              return {
                backgroundColor: 'var(--light-orange)',
                color: 'var(--primary-orange)',
                contant: 'Pending'
              };
            case 'Missed':
              return {
                backgroundColor: 'var(--light-red)',
                color: 'var(--primary-red)',
                contant: 'Missed'
              };
            default:
              return {
                backgroundColor: 'var(--background-gray)',
                color: 'var(--primary-gray)',
                contant: 'Unknown'
              };
          }
        };

        const config = getStatusConfig(status);
        return (
          <MyBadgeStatus
            backgroundColor={config.backgroundColor}
            color={config.color}
            contant={config.contant}
          />
        );
      }
    },
    {
      title: 'Execute',
      key: 'execute',
      render: (record: any) => (
        <FontAwesomeIcon
          icon={faCheckToSlot}
          className="font-aws"
          onClick={() => setOpenModal(true)}
        />
      )
    }
  ];
  // Sample data for the second table
  const data_two = [
    { text: 'Vitals stable', createdBy: 'Ali', createdAt: '2025-08-06 09:00' },
    { text: 'Patient alert', createdBy: 'Omar', createdAt: '2025-08-06 09:30' }
  ];
  // Columns for the second table
  const columns_two = [
    {
      title: 'Note',
      dataIndex: 'text',
      key: 'text'
    },
    {
      title: 'Created By / At',
      key: 'createdByAt',
      render: (row: any) =>
        row?.createdBy ? (
          <>
            {row?.createdBy}
            <br />
            <span className="date-table-style">{row.createdAt}</span>{' '}
          </>
        ) : (
          ' '
        )
    }
  ];

  // Count for summary
  const countByStatus = {
    Missed: data.filter(d => d.status === 'Missed').length,
    Pending: data.filter(d => d.status === 'Pending').length,
    Completed: data.filter(d => d.status === 'Completed').length
  };

  return (
    <div className="main">
      {/* Main Table */}
      <div className="table-1">
        <MyTable
          data={paginatedData}
          columns={columns}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
        />

        <TableModal openModal={openModal} setOpenModal={setOpenModal} />
      </div>

      {/* Side Panel */}
      <div className="side-panel">
        {/* Refresh Button */}
        <div id="button-1">
          <FontAwesomeIcon icon={faArrowsRotate} className="font-aws" />
        </div>
        {/* Task Summary */}
        <div className="summary">
          <SummaryBox
            label="Missed"
            count={countByStatus.Missed}
            backgroundColor="#ffbaba"
            color="#ce2626"
          />
          <SummaryBox
            label="Pending"
            count={countByStatus.Pending}
            backgroundColor="#fbe5bf"
            color="#f29a4d"
          />
          <SummaryBox
            label="Completed"
            count={countByStatus.Completed}
            backgroundColor="#daf1e7"
            color="#45b887"
          />
        </div>

        {/* Shift Notes */}
        <MyTable data={data_two} columns={columns_two}></MyTable>
      </div>
    </div>
  );
};

const SummaryBox = ({ label, count, backgroundColor, color }) => (
  <div
    className="summary-vars"
    style={{
      backgroundColor: backgroundColor,
      color: color
    }}
  >
    {label}: {count}
  </div>
);

export default PhysicianOrderSummary;
