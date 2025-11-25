import React, { useEffect, useState } from 'react';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import { useGetEncountersQuery } from '@/services/encounterService';
import { initialListRequest, ListRequest } from '@/types/types';

const ClinicVisitsTable = ({ patient }) => {
  const [sortColumn, setSortColumn] = useState('plannedStartDate');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');

  // pageNumber في الباك عندك 1-based حسب اللي شفناه
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [visitHistoryListRequest, setVisitHistoryListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageNumber: page,
    pageSize: rowsPerPage,
    sortBy: sortColumn,
    sortType,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key || undefined
      }
    ]
  });

  const { data: visiterHistoryResponse, isFetching } =
    useGetEncountersQuery(visitHistoryListRequest);

  // لما المريض يتغير: رجع لأول صفحة وحدث الفلتر
  useEffect(() => {
    setPage(1);
    setVisitHistoryListRequest(prev => ({
      ...prev,
      pageNumber: 1,
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key || undefined
        }
      ]
    }));
  }, [patient?.key]);

  // لما الصفحة/الحجم/السورت يتغيروا: حدّث الريكوست
  useEffect(() => {
    setVisitHistoryListRequest(prev => ({
      ...prev,
      pageNumber: page,
      pageSize: rowsPerPage,
      sortBy: sortColumn,
      sortType
    }));
  }, [page, rowsPerPage, sortColumn, sortType]);

  const tableColumns = [
    {
      key: 'visitId',
      title: <Translate>key</Translate>,
      flexGrow: 4,
      render: (rowData: any) => (
        <a style={{ cursor: 'pointer' }}>
          {rowData.visitId}
        </a>
      )
    },
    {
      key: 'plannedStartDate',
      title: <Translate>Date</Translate>,
      flexGrow: 4,
      dataKey: 'plannedStartDate'
    },
    {
      key: 'departmentName',
      title: <Translate>Department</Translate>,
      flexGrow: 4,
      dataKey: 'departmentName',
      render: (rowData: any) =>
        rowData?.resourceTypeLkey === '2039534205961578'
          ? rowData?.departmentName
          : rowData.resourceObject?.name
    },
    {
      key: 'encountertype',
      title: <Translate>Encounter Type</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.resourceObject?.departmentTypeLkey
          ? rowData.resourceObject?.departmentTypeLvalue?.lovDisplayVale
          : rowData.resourceObject?.departmentTypeLkey
    },
    {
      key: 'physician',
      title: <Translate>Physician</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData?.resourceTypeLkey === '2039534205961578'
          ? rowData?.resourceObject?.practitionerFullName
          : ''
    },
    {
      key: 'priority',
      title: <Translate>Priority</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.encounterPriorityLvalue
          ? rowData.encounterPriorityLvalue.lovDisplayVale
          : rowData.encounterPriorityLkey
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.encounterStatusLvalue
          ? rowData.encounterStatusLvalue.lovDisplayVale
          : rowData.encounterStatusLkey
    },
    {
      key: 'visitTypeLvalue',
      title: <Translate>Visit Type</Translate>,
      expandable: true,
      render: (rowData: any) => <span>{rowData?.visitTypeLvalue?.lovDisplayVale}</span>
    },
    {
      key: 'CreatedByAt',
      title: <Translate>Created By\At</Translate>,
      expandable: true,
      render: (rowData: any) =>
        rowData?.createdAt ? (
          <>
            {rowData?.createdBy}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(rowData.createdAt)}
            </span>
          </>
        ) : (
          ' '
        )
    }
  ];

  const totalCount =
    visiterHistoryResponse?.totalCount ??
    visiterHistoryResponse?.totalElements ??
    0;

  return (
    <MyTable
      data={visiterHistoryResponse?.object ?? []}
      columns={tableColumns}
      loading={isFetching}
      sortColumn={sortColumn}
      sortType={sortType}
      onSortChange={(col, type) => {
        setSortColumn(col);
        setSortType(type);
        setPage(1); // ارجع لأول صفحة عند تغيير السورت
      }}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={e => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(1);
      }}
    />
  );
};

export default ClinicVisitsTable;
