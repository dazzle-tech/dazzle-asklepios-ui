import React, { useState, useEffect } from 'react';
import { Form} from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faClipboardCheck, faPrint, faSheetPlastic } from '@fortawesome/free-solid-svg-icons';
import { Whisper, Tooltip } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import { setPageCode, setDivContent } from '@/reducers/divSlice';
import ReactDOMServer from 'react-dom/server';
import { useDispatch } from 'react-redux';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

import './style.less';
// dummy data
const data = [
  {
    id: 1,
    imageName: 'CT Head',
    patientName: 'Ahmad Yousef',
    mrn: '123456',
    report: 'Available',
    status: 'Approved',
    orderBy: 'Dr. Sami',
    orderAt: '2025-09-01 09:30 AM'
  }
];

const RadiologyImageList = () => {
  const dispatch = useDispatch();

  const [record, setRecord] = useState<any>({});
  const [tableData, setTableData] = useState(data);
  const [sortColumn, setSortColumn] = useState('imageName');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    const divContent = (
      "Radiology Image List"
    );
    dispatch(setPageCode('Radiology_Image_List'));
    dispatch(setDivContent(divContent));
  }, [dispatch]);

const FilterModel = (
  <Form fluid className="table-header-content">
    <MyInput
      width="100%"
      fieldLabel="Order Date From"
      fieldType="date"
      fieldName="key0"
      record={record}
      setRecord={setRecord}
    />

    <MyInput
      width="100%"
      fieldLabel="To"
      fieldType="date"
      fieldName="key1"
      record={record}
      setRecord={setRecord}
    />

    <MyInput
      width="180px"
      fieldLabel="Image Test Name"
      fieldName="imagetestname"
      fieldType="checkPicker"
      selectData={[
        { key: 'hipultrasound', value: 'Hip ultrasound' },
        { key: 'chestultrasound', value: 'Chest ultrasound' },
        { key: 'Chestxray', value: 'Chest x-ray' }
      ]}
      selectDataLabel="value"
      selectDataValue="key"
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
      width="180px"
      fieldLabel="Requested Department"
      fieldName="requestedDepartment"
      fieldType="checkPicker"
      selectData={[
        { key: 'radiology', value: 'Radiology' },
        { key: 'cardiology', value: 'Cardiology' }
      ]}
      selectDataLabel="value"
      selectDataValue="key"
      record={record}
      setRecord={setRecord}
    />

    <MyInput
      width="180px"
      fieldLabel="Status"
      fieldName="status"
      fieldType="checkPicker"
      selectData={[
        { key: 'pending', value: 'Pending' },
        { key: 'approved', value: 'Approved' }
      ]}
      selectDataLabel="value"
      selectDataValue="key"
      record={record}
      setRecord={setRecord}
    />
  </Form>
);


  const columns: ColumnConfig[] = [
    { key: 'imageName', title: 'Image Name', dataKey: 'imageName', width: 160 },
    { key: 'patientName', title: 'Patient Name', dataKey: 'patientName', width: 180 },
    { key: 'mrn', title: 'MRN', dataKey: 'mrn', width: 120 },
{
  key: 'report',
  title: 'Report',
  dataKey: 'report',
  width: 60,
  align: 'center',
  render: (_row: any) => (
      <Whisper placement="top" trigger="hover" speaker={<Tooltip>Report</Tooltip>}>
    <FontAwesomeIcon icon={faSheetPlastic}className='icon-radiologist-worklist-size' />
      </Whisper>
  )
},
{
  key: 'status',
  title: 'Status',
  dataKey: 'status',
  width: 100,
  render: (row: any) => (
    <MyBadgeStatus
      backgroundColor={
        row.status === 'Approved'
          ? 'var(--light-green)'
          : row.status === 'Pending'
          ? 'var(--light-gray)'
          : 'var(--background-gray)'
      }
      color={
        row.status === 'Approved'
          ? 'var(--primary-green)'
          : row.status === 'Pending'
          ? 'var(--primary-gray)'
          : 'var(--primary-gray)'
      }
      contant={row.status}
    />
  )
},
  {
      key: 'orderByAt',
      title: 'Order By / At',
      dataKey: 'orderBy',
      width: 200,
      render: (row: any) => (
        <>
          {row.orderBy}
          <br />
          <span className="date-table-style">{row.orderAt}</span>
        </>
      )
    },
{
  key: 'icons',
  title: '',
  width: 120,
  align: 'center',
  render: (_rowData: any) => (
    <div className="container-of-icons" style={{ display: 'flex', gap: 10, cursor: 'pointer' }}>
      <Whisper placement="top" trigger="hover" speaker={<Tooltip>Send by Email</Tooltip>}>
        <FontAwesomeIcon icon={faEnvelope} className='icon-radiologist-worklist-size'/>
      </Whisper>

      <Whisper placement="top" trigger="hover" speaker={<Tooltip>Second Approval</Tooltip>}>
        <FontAwesomeIcon icon={faClipboardCheck} className='icon-radiologist-worklist-size'/>
      </Whisper>

      <Whisper placement="top" trigger="hover" speaker={<Tooltip>Print</Tooltip>}>
        <FontAwesomeIcon icon={faPrint} className='icon-radiologist-worklist-size'/>
      </Whisper>
    </div>
  )
}


  ];

  const sortedData = [...tableData].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    if (aValue === bValue) return 0;
    return sortType === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
  });

  const paginatedData = sortedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
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
  );
};

export default RadiologyImageList;
