  //Declares
  import React, { useState } from 'react';
  import MyInput from '@/components/MyInput';
  import MyTable from '@/components/MyTable';
  import { useDispatch } from 'react-redux';
  import ReactDOMServer from 'react-dom/server';
  import { setPageCode, setDivContent } from '@/reducers/divSlice';
  import { formatDateWithoutSeconds } from '@/utils';
  import MaterialTableReconciliation from './MaterialTableReconciliation';
  import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
  import { Form } from 'rsuite';

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
    },
    {
      id: 2,
      operationName: 'Gallbladder Removal',
      priority: 'Medium',
      patientName: 'Qais Omar',
      mrn: 'MRN002',
      requestedBy: 'Dr. Lina',
      requestedAt: '2025-07-28 02:15 PM',
    },
    {
      id: 3,
      operationName: 'Appendectomy',
      priority: 'High',
      patientName: 'Farouk Dhelea',
      mrn: 'MRN001',
      requestedBy: 'Dr. Ahmad',
      requestedAt: '2025-07-29 08:30 AM',
    }
  ];

  //Declare the Variables
  const Reconciliation = () => {
    const dispatch = useDispatch();
    const [record, setRecord] = useState({});
    const [sortColumn, setSortColumn] = useState('operationName');
    type SortType = 'asc' | 'desc';
    const [sortType, setSortType] = useState<SortType>('asc');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedId, setSelectedId] = useState<number | null>(null);


    //Table columns Configure
  const columns = [
  {
    key: 'select',
    title: '',
    dataKey: 'id',
    width: 50,
    render: row => {
      const isSelected = selectedId === row.id;
      return (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => setSelectedId(isSelected ? null : row.id)}
        />
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
    title: 'Requested By\At',
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
  }

  ];


    //Sort Data
    const sortedData = [...sampleData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === bVal) return 0;
      return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
    });

    //Table Filters(Header)
    const filterstable = (<>
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
          <div className='filter-table-header-requested-opearation'>
            <MyInput
                  className='select-input-requested-operation-filter'
                  width={200}
                  selectDataValue="value"
                  selectDataLabel="label"
                  selectData={[
                    { label: 'Operation Name', key: 1 },
                  ]}
                  fieldName="filter"
                  fieldType="select"
                  fieldLabel="Select Filter"
                  record={record}
                  setRecord={setRecord}
                  showLabel={false}
                  searchable={false}
                />
                <MyInput
                  width={200}
                  fieldName="value"
                  fieldType="text"
                  fieldLabel="Search"
                  record={record}
                  setRecord={setRecord}
                  showLabel={false}
                /></div>
        </div>
      </Form>

            <AdvancedSearchFilters searchFilter={true}/>

    </>);

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

        <MaterialTableReconciliation></MaterialTableReconciliation>
      </div>
    );
  };

  export default Reconciliation;
