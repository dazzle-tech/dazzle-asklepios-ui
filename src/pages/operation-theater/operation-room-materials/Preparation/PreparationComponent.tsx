//Declares
import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import ReactDOMServer from 'react-dom/server';

import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MaterialTable from './MaterialTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { formatDateWithoutSeconds } from '@/utils';
import { setPageCode, setDivContent } from '@/reducers/divSlice';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
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

type SortType = 'asc' | 'desc';

const Preparation: React.FC = () => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  const [record, setRecord] = useState<any>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof (typeof sampleData)[number]>('operationName');
  const [sortType, setSortType] = useState<SortType>('asc');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Header page setup inside useEffect (with cleanup)
  useEffect(() => {
    const header = (
      <div className="page-title">
        <h5>Operation Room Materials</h5>
      </div>
    );
    const html = ReactDOMServer.renderToStaticMarkup(header);
    dispatch(setPageCode('Operation-Room-Materials'));
    dispatch(setDivContent(html));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, pathname]);

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  // Table columns (memoized)
  const columns = useMemo(
    () => [
      {
        key: 'select',
        title: '',
        dataKey: 'id',
        width: 50,
        render: (row: any) => {
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
        render: (row: any) => <span>{row.operationName}</span>
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
    ],
    [selectedIds]
  );

  // Sorted data (memoized)
  const sortedData = useMemo(() => {
    const data = [...sampleData];
    return data.sort((a: any, b: any) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === bVal) return 0;
      return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
    });
  }, [sortColumn, sortType]);

  // Pagination slice (memoized)
  const paginatedData = useMemo(
    () => sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedData, page, rowsPerPage]
  );

  // Table Filters(Header)
  const filterstable = (
    <>
      <Form fluid>
        <h5 className="requested-procedures-table-header">Requested Operation</h5>
        <div className="from-to-input-position">
          <MyInput
            width="100%"
            fieldLabel="Request From"
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
        </div>
      </Form>
      <AdvancedSearchFilters searchFilter />
    </>
  );

  return (
    <div className="Tables-gap-betwen-columns">
      <MyTable
        data={paginatedData}
        columns={columns}
        loading={false}
        filters={filterstable}
        sortColumn={sortColumn as string}
        sortType={sortType}
        onSortChange={(col: any, type: SortType) => {
          setSortColumn(col as keyof (typeof sampleData)[number]);
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
      <MaterialTable />
    </div>
  );
};

export default Preparation;
