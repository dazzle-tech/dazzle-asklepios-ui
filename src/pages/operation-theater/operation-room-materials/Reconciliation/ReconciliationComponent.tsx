// Declares
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Form } from 'rsuite';
import ReactDOMServer from 'react-dom/server';
import { useLocation } from 'react-router-dom';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import MaterialTableReconciliation from './MaterialTableReconciliation';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { formatDateWithoutSeconds } from '@/utils';
import { setPageCode, setDivContent } from '@/reducers/divSlice';

// Table Data (dummy)
const sampleData = [
  {
    id: 1,
    operationName: 'Appendectomy',
    priority: 'High',
    patientName: 'Farouk Dhelea',
    mrn: 'MRN001',
    requestedBy: 'Dr. Ahmad',
    requestedAt: '2025-07-29 08:30 AM'
  },
  {
    id: 2,
    operationName: 'Gallbladder Removal',
    priority: 'Medium',
    patientName: 'Qais Omar',
    mrn: 'MRN002',
    requestedBy: 'Dr. Lina',
    requestedAt: '2025-07-28 02:15 PM'
  },
  {
    id: 3,
    operationName: 'Appendectomy',
    priority: 'High',
    patientName: 'Farouk Dhelea',
    mrn: 'MRN001',
    requestedBy: 'Dr. Ahmad',
    requestedAt: '2025-07-29 08:30 AM'
  }
];

type SortType = 'asc' | 'desc';

const Reconciliation: React.FC = () => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  const [record, setRecord] = useState<any>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [sortColumn, setSortColumn] = useState<keyof typeof sampleData[number]>('operationName');
  const [sortType, setSortType] = useState<SortType>('asc');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Header page setup inside effect (with cleanup)
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

  // Columns (memoized)
  const columns = useMemo(
    () => [
      {
        key: 'select',
        title: '',
        dataKey: 'id',
        width: 50,
        render: (row: any) => {
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
        render: (row: any) => <span>{row.operationName}</span>
      },
      {
        key: 'priority',
        title: 'Priority',
        dataKey: 'priority',
        width: 100,
        render: (row: any) => (
          <MyBadgeStatus
            contant={row.priority}
            color={row.priority === 'High' ? '#b84b45' : '#3b82f6'}
            backgroundColor={row.priority === 'High' ? '#fde2e0' : '#e8f0ff'}
          />
        )
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
              <span className="date-table-style">{formatDateWithoutSeconds(row.requestedAt)}</span>{' '}
            </>
          ) : (
            ' '
          )
      }
    ],
    [selectedId]
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

  // Filters header
  const filterstable = (
    <>
      <Form fluid>
        <h5 className="requested-procedures-table-header">Requested Operation</h5>
        <div className="from-to-input-position">
          <MyInput
            width="100%"
            fieldLabel="Request From"
            fieldType="date"
            fieldName="fromDate"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            width="100%"
            fieldLabel="To"
            fieldType="date"
            fieldName="toDate"
            record={record}
            setRecord={setRecord}
          />
          <div className="filter-table-header-requested-opearation">
            <MyInput
              className="select-input-requested-operation-filter"
              width={200}
              selectData={[
                { label: 'Operation Name', value: 'operationName' }
              ]}
              selectDataLabel="label"
              selectDataValue="value"
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
            />
          </div>
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
          setSortColumn(col as keyof typeof sampleData[number]);
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

      <MaterialTableReconciliation />
    </div>
  );
};
export default Reconciliation;

