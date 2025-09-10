//imports
import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckToSlot, faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import TableModalManagment from '../table-task-managment/TableTaskManagment';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import '../style.less';

//declares
const PhysicianOrderSummaryComponent = () => {
  const [openModal, setOpenModal] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const rowsPerPage = 5;

  //table samble data
  const data = [
    {
      patientname: 'Ali Ahmad',
      mrn: 'MRN001',
      orderType: 'Medication',
      orderName: 'Paracetamol 500mg PO',
      priority: 'High',
      orderDate: '2025-08-06',
      orderTime: '08:00',
      scheduledDateTime: '2025-08-06 08:30',
      status: 'Completed'
    },
    {
      patientname: 'Sara Khaled',
      mrn: 'MRN002',
      orderType: 'Lab Test',
      orderName: 'Complete Blood Count (CBC)',
      priority: 'Medium',
      orderDate: '2025-08-06',
      orderTime: '09:15',
      scheduledDateTime: '2025-08-06 10:00',
      status: 'Pending'
    },
    {
      patientname: 'Omar Zaid',
      mrn: 'MRN004',
      orderType: 'Radiology',
      orderName: 'Chest X-Ray',
      priority: 'Low',
      orderDate: '2025-08-06',
      orderTime: '10:00',
      scheduledDateTime: '2025-08-06 11:30',
      status: 'Missed'
    },
    {
      patientname: 'Lina Saeed',
      mrn: 'MRN005',
      orderType: 'Medication',
      orderName: 'Ibuprofen 400mg PO',
      priority: 'Medium',
      orderDate: '2025-08-06',
      orderTime: '11:00',
      scheduledDateTime: '2025-08-06 11:30',
      status: 'Completed'
    },
    {
      patientname: 'Majed Faris',
      mrn: 'MRN006',
      orderType: 'Lab Test',
      orderName: 'Urine Analysis',
      priority: 'Low',
      orderDate: '2025-08-06',
      orderTime: '12:00',
      scheduledDateTime: '2025-08-06 12:30',
      status: 'Pending'
    },
    {
      patientname: 'Noor Adel',
      mrn: 'MRN007',
      orderType: 'Procedure',
      orderName: 'IV Cannulation',
      priority: 'High',
      orderDate: '2025-08-06',
      orderTime: '13:00',
      scheduledDateTime: '2025-08-06 13:15',
      status: 'Completed'
    }
  ];

  //declares
  const totalCount = data.length;
  const paginatedData = data.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage);
  const [record, setRecord] = useState({});
  const handlePageChange = (_: any, newPageIndex: number) => {
    setPageIndex(newPageIndex);
  };
  //table coulmns
  const columns = [
    { title: 'Patient Name', dataIndex: 'patientname', key: 'patientname' },
    { title: 'MRN', dataIndex: 'mrn', key: 'mrn' },
    { title: 'Order Type', dataIndex: 'orderType', key: 'orderType' },
    { title: 'Order Name', dataIndex: 'orderName', key: 'orderName' },
    { title: 'Priority', dataIndex: 'priority', key: 'priority' },
    {
      title: 'Order Date&Time',
      key: 'orderDate',
      render: (rowData: any) =>
        rowData?.orderDate ? (
          <>
            {rowData.orderDate}
            <br />
            <span className="date-table-style">{rowData.orderTime}</span>
          </>
        ) : (
          ''
        )
    },
    {
      title: 'Scheduled Date&Time',
      key: 'scheduledDateTime',
      render: (rowData: any) =>
        rowData?.scheduledDateTime ? (
          <>
            {rowData.scheduledDateTime.split(' ')[0]}
            <br />
            <span className="date-table-style">{rowData.scheduledDateTime.split(' ')[1]}</span>
          </>
        ) : (
          ''
        )
    },
    {
      title: 'Status',
      key: 'status',
      render: (rowData: any) => {
        const status = rowData.status || 'Normal';
        const getStatusConfig = (status: string) => {
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
      render: (_: any) => (
        <FontAwesomeIcon
          icon={faCheckToSlot}
          className="font-aws"
          onClick={() => setOpenModal(true)}
        />
      )
    }
  ];

  const data_two = [
    { text: 'Vitals stable', createdBy: 'Ali', createdAt: '2025-08-06 09:00' },
    { text: 'Patient alert', createdBy: 'Omar', createdAt: '2025-08-06 09:30' }
  ];

  const columns_two = [
    { title: 'Note', dataIndex: 'text', key: 'text' },
    {
      title: 'Created By / At',
      key: 'createdByAt',
      render: (row: any) => (
        <>
          {row?.createdBy}
          <br />
          <span className="date-table-style">{row.createdAt}</span>
        </>
      )
    }
  ];

  const countByStatus = {
    Missed: data.filter(d => d.status === 'Missed').length,
    Pending: data.filter(d => d.status === 'Pending').length,
    Completed: data.filter(d => d.status === 'Completed').length
  };
  //table filters
  const tablefilters = (
    <>
      {' '}
      <Form fluid>
        <div className="from-to-input-position">
          <MyInput
            width={'100%'}
            fieldLabel="Order Date From"
            fieldType="date"
            fieldName="key0"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            width={'100%'}
            fieldLabel="To"
            fieldType="date"
            fieldName="key1"
            record={record}
            setRecord={setRecord}
          />

          <MyInput
            width="10vw"
            fieldLabel="Patient Search"
            fieldName="selectfilter"
            fieldType="select"
            selectData={[
              { key: 'MRN', value: 'MRN' },
              { key: 'Document Number', value: 'Document Number' },
              { key: 'Full Name', value: 'Full Name' },
              { key: 'Archiving Number', value: 'Archiving Number' },
              { key: 'Primary Phone Number', value: 'Primary Phone Number' },
              { key: 'Date of Birth', value: 'Date of Birth' }
            ]}
            selectDataLabel="value"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
          />

          <MyInput
            fieldLabel="Search by"
            fieldName="searchCriteria"
            fieldType="text"
            placeholder="Search"
            width="10vw"
            record={record}
            setRecord={setRecord}
          />

          <MyInput
            width="10vw"
            fieldLabel="Order Type"
            fieldName="selectfilter"
            fieldType="checkPicker"
            selectData={[
              { key: 'medication', value: 'Medication' },
              { key: 'laboratory', value: 'Laboratory' },
              { key: 'radiology', value: 'Radiology' },
              { key: 'patholoy', value: 'Patholoy' },
              { key: 'proceduer', value: 'Proceduer' },
              { key: 'operation', value: 'Operation' },
              { key: 'blood', value: 'Blood' },
              { key: 'ivfluid', value: 'Iv Fluid' },
              { key: 'bedsideprocedure', value: 'Bedside Procedure' },
              { key: 'diet', value: 'Diet' },
              { key: 'phyaicianrequest', value: 'Phyaician Request' }
            ]}
            selectDataLabel="value"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
          />
        </div>
      </Form>
      <AdvancedSearchFilters searchFilter={true} />
    </>
  );

  return (
    <div className="main">
      <div className="table-1">
        <MyTable
          data={paginatedData}
          columns={columns}
          page={pageIndex}
          filters={tablefilters}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
        />
        <TableModalManagment openModal={openModal} setOpenModal={setOpenModal} />
      </div>

      <div className="side-panel">
        <div id="button-1">
          <FontAwesomeIcon icon={faArrowsRotate} className="font-aws" />
        </div>

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

        <MyTable data={data_two} columns={columns_two} />
      </div>
    </div>
  );
};

const SummaryBox = ({
  label,
  count,
  backgroundColor,
  color
}: {
  label: string;
  count: number;
  backgroundColor: string;
  color: string;
}) => (
  <div
    className="summary-vars"
    style={{
      backgroundColor,
      color
    }}
  >
    {label}: {count}
  </div>
);

export default PhysicianOrderSummaryComponent;
