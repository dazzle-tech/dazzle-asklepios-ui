import React, { useEffect, useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { initialListRequest, ListRequest } from '@/types/types';
// import { useGetNurseAssessmentsQuery } from '@/services/nurseAssessmentService';
import { skipToken } from '@reduxjs/toolkit/query';

const NurseAssessmentsTable = ({ patient }) => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    sortBy: 'date',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key || undefined
      }
    ],
    pageSize: 15
  });

  // const {
  //   data: nurseResponse,
  //   isFetching,
  //   refetch
  // } = useGetNurseAssessmentsQuery(
  //   patient?.key ? listRequest : skipToken,
  //   {
  //     refetchOnMountOrArgChange: true,
  //     refetchOnFocus: true
  //   }
  // );

  // useEffect(() => {
  //   if (patient?.key) {
  //     refetch();
  //   }
  // }, [patient?.key]);

  useEffect(() => {
    setListRequest({
      ...initialListRequest,
      sortBy: 'date',
      sortType: 'desc',
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key || undefined
        }
      ],
      pageNumber: 1
    });
  }, [patient?.key]);

  // const sortedData = useMemo(() => {
  //   if (!nurseResponse?.object) return [];

  //   return [...nurseResponse.object].sort((a, b) => {
  //     const aValue = a[sortColumn];
  //     const bValue = b[sortColumn];
  //     if (aValue === bValue) return 0;
  //     return sortType === 'asc'
  //       ? aValue > bValue
  //         ? 1
  //         : -1
  //       : aValue < bValue
  //       ? 1
  //       : -1;
  //   });
  // }, [nurseResponse, sortColumn, sortType]);

  // const paginatedData = sortedData.slice(
  //   page * rowsPerPage,
  //   (page + 1) * rowsPerPage
  // );

  const columns: ColumnConfig[] = [
    {
      key: 'date',
      title: <Translate>Date</Translate>,
      render: row =>
        row?.date ? (
          <span className="date-table-style">
            {formatDateWithoutSeconds(row.date)}
          </span>
        ) : (
          '-'
        )
    },
    {
      key: 'nurse',
      title: <Translate>Nurse</Translate>,
      render: row => row?.nurseName || '-'
    },
    {
      key: 'assessmentType',
      title: <Translate>Assessment Type</Translate>,
      render: row => row?.assessmentType || '-'
    },
    {
      key: 'score',
      title: <Translate>Score</Translate>,
      render: row => {
        const score = row?.score || '-';

        let bgColor = 'var(--light-gray)';
        let color = 'var(--dark-gray)';

        if (score === 'Low Risk') {
          bgColor = 'var(--light-green)';
          color = 'var(--primary-green)';
        } else if (score === 'Medium Risk') {
          bgColor = 'var(--light-orange)';
          color = 'var(--primary-orange)';
        } else if (score === 'High Risk') {
          bgColor = 'var(--light-red)';
          color = 'var(--primary-red)';
        }

        return (
          <MyBadgeStatus
            backgroundColor={bgColor}
            color={color}
            contant={score}
          />
        );
      }
    },
    {
      key: 'vitals',
      title: <Translate>Vitals</Translate>,
      render: row => row?.vitals || '-'
    },
    {
      key: 'notes',
      title: <Translate>Notes</Translate>,
      render: row => row?.notes || '-'
    }
  ];

  return (
    <MyTable
      data={[]}
      columns={columns}
      height={580}
      // loading={isFetching}
      sortColumn={sortColumn}
      sortType={sortType}
      onSortChange={(col, type) => {
        setSortColumn(col);
        setSortType(type);
      }}
      page={page}
      rowsPerPage={rowsPerPage}
      // totalCount={nurseResponse?.object?.length || 0}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={e => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
    />
  );
};

export default NurseAssessmentsTable;