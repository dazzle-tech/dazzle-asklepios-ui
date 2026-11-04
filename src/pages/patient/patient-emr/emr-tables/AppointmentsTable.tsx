import React, { useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';
import { formatDateWithoutSeconds } from '@/utils';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

import { useSearchAppointmentsQuery } from '@/services/appointment/appointmentService';
import { useAppSelector } from '@/hooks';
import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';

const AppointmentsTable = ({ patient }: any) => {


  const facility = useAppSelector(state => state.auth?.tenant?.selectedFacility);
  const department = useAppSelector(state => state.auth?.selectedDepartment);


  const departmentId = department?.departmentId;

  const facilityId = facility?.id;


  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);


  const filter: any = {
    patientId: patient?.id,
    facility: facilityId
  };

  if (departmentId) {
    filter.departmentIds = [Number(departmentId)];
  }

  const { data, isLoading } = useSearchAppointmentsQuery(
    {
      filter,
      page,
      size: rowsPerPage,
      sort: 'startDatetime,desc'
    },
    {
      skip: !patient?.id || !facilityId
    }
  );


    const { data: departments = [] } =
      useGetAllDepartmentsWithoutPaginationQuery();

    const departmentMap = useMemo(() => {
      const map: Record<number, any> = {};

      departments.forEach((dept: any) => {
        map[dept.id] = dept;
      });

      return map;
    }, [departments]);


  const tableData = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;

  const columns: ColumnConfig[] = [
    {
      key: 'department',
      title: <Translate>Department</Translate>,
      render: row =>
        department?.departmentName ||
        `Dept #${row?.departmentId}` ||
        '-'
    },
    {
      key: 'resourceType',
      title: <Translate>Resource Type</Translate>,
      render: row => row?.resourceType || '-'
    },
    {
      key: 'resource',
      title: <Translate>Resource</Translate>,
      render: (row: any) => {
        if (row.resourceType === 'DEPARTMENT') {
          return (
            departmentMap[row.resourceId]?.name ??
            departmentMap[row.resourceId]?.departmentName ??
            `Dept #${row.resourceId}`
          );
        }

        return (
          row.resourceName ||
          row.defaultPractitionerName ||
          `Res #${row.resourceId}` ||
          '-'
        );
      }
    },
    {
      key: 'scheduleDate',
      title: <Translate>Schedule Date</Translate>,
      render: row =>
        row?.startDatetime ? (
          <span className="date-table-style">
            {formatDateWithoutSeconds(row.startDatetime)}
          </span>
        ) : '-'
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: row => {
        const status = row?.status || '-';

        let bg = 'var(--light-gray)';
        let color = 'var(--dark-gray)';

        if (status === 'CONFIRMED' || status === 'COMPLETED') {
          bg = 'var(--light-green)';
          color = 'var(--primary-green)';
        } else if (status === 'BOOKED' || status === 'SCHEDULED') {
          bg = 'var(--light-yellow)';
          color = 'var(--primary-yellow)';
        } else if (status === 'CANCELLED') {
          bg = 'var(--light-red)';
          color = 'var(--primary-red)';
        }

        return (
          <MyBadgeStatus
            backgroundColor={bg}
            color={color}
            contant={status}
          />
        );
      }
    }
  ];
  return (
    <MyTable
      data={tableData}
      columns={columns}
      loading={isLoading}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={e => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
      height={500}
    />
  );
};

export default AppointmentsTable;