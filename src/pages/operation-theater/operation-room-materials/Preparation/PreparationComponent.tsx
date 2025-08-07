//Declares
import React, { useState } from 'react';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MaterialTable from './MaterialTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { formatDateWithoutSeconds } from '@/utils';
import { useDispatch } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
import { setPageCode, setDivContent } from '@/reducers/divSlice';
import { Form } from 'rsuite';
import './styles.less';

//Table Data
const sampleData = [
  {
    id: 1,
    operationName: 'Appendectomy',
    priority: 'High',
    patientName: 'Farouk Dhelea',
    mrn: 'MRN001',
    requestedBy: 'Dr. Ahmad',
    requestedAt: '2025-07-29 08:30 AM',
    status: 'Pending'
  },
  {
    id: 2,
    operationName: 'Gallbladder Removal',
    priority: 'Medium',
    patientName: 'Qais Omar',
    mrn: 'MRN002',
    requestedBy: 'Dr. Lina',
    requestedAt: '2025-07-28 02:15 PM',
    status: 'Ready'
  },
  {
    id: 3,
    operationName: 'Appendectomy',
    priority: 'High',
    patientName: 'Farouk Dhelea',
    mrn: 'MRN001',
    requestedBy: 'Dr. Ahmad',
    requestedAt: '2025-07-29 08:30 AM',
    status: 'Pending'
  }
];

//Declare the Variables
const Preparation = () => {
  const dispatch = useDispatch();
  const [record, setRecord] = useState({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortColumn, setSortColumn] = useState('name');
  type SortType = 'asc' | 'desc';
  const [sortType, setSortType] = useState<SortType>('asc');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  //Table coulmns Configure
  const columns = [
    {
      key: 'select',
      title: '',
      dataKey: 'id',
      width: 50,
      render: row => {
        const isSelected = selectedIds.includes(row.id);
        return (
          <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(row.id)} />
        );
      }
    },
    {
      key: 'operationName',
      title: 'Operation Name',
      dataKey: 'operationName',
      width: 250,
      render: row => <span>{row.operationName}</span>
    },
    {
      key: 'priority',
      title: 'Priority',
      dataKey: 'priority',
      width: 100
    },
    {
      key: 'patientName',
      title: 'Patient Name',
      dataKey: 'patientName',
      width: 180
    },
    {
      key: 'mrn',
      title: 'MRN',
      dataKey: 'mrn',
      width: 120
    },
    {
     key: 'requestedByAt',
     title: 'Requested By\\At',
     dataKey: 'requestedBy',
     width: 220,
     render: (row: any) =>
       row?.requestedAt ? (
         <>
           {row?.requestedBy}
           <br />
           <span className="date-table-style">
             {formatDateWithoutSeconds(row.requestedAt)}
           </span>{' '}
         </>
       ) : (
         ' '
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
            row.status === 'Pending' ? 'var(--background-gray)' : 'var(--light-green)'
          }
          color={row.status === 'Pending' ? 'var(--primary-gray)' : 'var(--primary-green)'}
          contant={row.status}
        />
      )
    }
  ];
//sorted Data
  const sortedData = [...sampleData].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (aVal === bVal) return 0;
    return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
  });

  //Table Filters(Header)
  const filterstable = (
    <Form fluid>
      <h5 className="requested-procedures-table-header">Requested Operation</h5>
      <div className="from-to-input-position">
        <MyInput
          width={'100%'}
          fieldLabel="Request From"
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
      </div>
    </Form>
  );
//Pagination
  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Header page setUp
  const divContent = (
    <div className="page-title">
      <h5>Operation Room Materials</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Operation-Room-Materials'));
  dispatch(setDivContent(divContentHTML));

  return (
    <div className="Tables-gap-betwen-columns">
      <MyTable
        data={paginatedData}
        columns={columns}
        loading={false}
        filters={filterstable}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={(col, type) => {
          setSortColumn(col);
          setSortType(type);
        }}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={sortedData.length}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={e => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
      <MaterialTable></MaterialTable>
    </div>
  );
};
export default Preparation;
