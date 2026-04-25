import React, { useEffect, useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetEncountersQuery } from '@/services/encounterService';
import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';

const EmergencyTable = ({ patient }) => {
  const [sortColumn, setSortColumn] = useState('dateTime');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [visitHistoryListRequest, setVisitHistoryListRequest] = useState<ListRequest>({
    ...initialListRequest,
    sortBy: 'plannedStartDate',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient.key || undefined
      },
      {
        fieldName: 'resource_type_lkey',
        operator: 'match',
        value: 'EMERGENCY'
      }
    ],
    pageSize: 15
  });

  const {
    data: visiterHistoryResponse,
    refetch: refetchEncounter,
    isFetching
  } = useGetEncountersQuery(visitHistoryListRequest, {
    refetchOnMountOrArgChange: true, // Refetch when component mounts or arguments change
    refetchOnFocus: true // Refetch when window regains focus
  });

  useEffect(() => {
    refetchEncounter();
  }, [patient]);
  const sortedData = [...visiterHistoryResponse?.object].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    if (aValue === bValue) return 0;
    return sortType === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
  });

  const paginatedData = sortedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const { data: allDepartments } = useGetAllDepartmentsWithoutPaginationQuery({});

  // Fetch all practitioners for lookup
  const { data: practitionersResponse } = useGetAllPractitionersQuery({
    page: 0,
    size: 1000, // Fetch a large number to get all practitioners
    sort: 'id,asc'
  });

  // Fetch all resources for lookup
  const { data: resourcesResponse } = { data: { data: [] as unknown[] } };

  // Fetch all diagnostic tests for lookup
  const { data: diagnosticTestsResponse } = useGetAllDiagnosticTestsQuery({
    page: 0,
    size: 1000, // Fetch a large number to get all diagnostic tests
    sort: 'id,asc'
  });

  // Create a department lookup map by key
  const departmentMap = useMemo(() => {
    if (!allDepartments) return {};
    const map = {};
    allDepartments.forEach(dept => {
      if (dept.key) map[dept.key] = dept;
      if (dept.id) map[dept.id] = dept;
    });
    return map;
  }, [allDepartments]);

  // Create a practitioner lookup map by key
  const practitionerMap = useMemo(() => {
    if (!practitionersResponse?.data) return {};
    const map = {};
    practitionersResponse.data.forEach(practitioner => {
      if (practitioner.key) map[practitioner.key] = practitioner;
      if (practitioner.id) map[practitioner.id] = practitioner;
    });
    return map;
  }, [practitionersResponse]);

  // Create a resource lookup map by key
  const resourceMap = useMemo(() => {
    if (!resourcesResponse?.data) return {};
    const map = {};
    resourcesResponse.data.forEach(resource => {
      if (resource.key) map[resource.key] = resource;
      if (resource.id) map[resource.id] = resource;
    });
    return map;
  }, [resourcesResponse]);

  // Create a diagnostic test lookup map by key
  const diagnosticTestMap = useMemo(() => {
    if (!diagnosticTestsResponse?.data) return {};
    const map = {};
    diagnosticTestsResponse.data.forEach(test => {
      if (test.key) map[test.key] = test;
      if (test.id) map[test.id] = test;
    });
    return map;
  }, [diagnosticTestsResponse]);
  const tableColumns = [
    {
      key: 'visitId',
      title: <Translate>key</Translate>,
      flexGrow: 4,
      render: (rowData: any) => (
        <a
          style={{ cursor: 'pointer' }}
          onClick={() => {
            // setSelectedVisit(rowData);
          }}
        >
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
      render: (rowData: any) => {
        const departmentKey = rowData?.departmentKey;
        const department = departmentKey ? departmentMap[departmentKey] : null;

        if (department) {
          return department.name;
        }

        return '';
      }
    },
    {
      key: 'resourceType',
      title: <Translate>Resource Type</Translate>,
      flexGrow: 4,
      render: (rowData: any) => {
        return formatEnumString(rowData?.resourceTypeLkey);
      }
    },
    {
      key: 'resource',
      title: <Translate>Resource</Translate>,
      flexGrow: 4,
      render: (rowData: any) => {
        // Get resource from resource map
        const resourceKey = rowData?.resourceKey;
        const resource = resourceKey ? resourceMap[resourceKey] : null;

        if (!resource) {
          return '';
        }

        let displayName = resource.resourceKey || '';
        const resourceType = resource.resourceType;
        const lookupKey = resource.resourceKey;

        // Based on resource type, look up the appropriate name
        if (resourceType === 'PRACTITIONER') {
          const practitioner = lookupKey ? practitionerMap[lookupKey] : null;

          if (practitioner) {
            displayName =
              practitioner.practitionerFullName ||
              `${practitioner.firstName || ''} ${practitioner.lastName || ''}`.trim();
          }
        } else if (
          ['CLINIC', 'INPATIENT_ADMISSION', 'DAY_CASE', 'EMERGENCY'].includes(resourceType)
        ) {
          const department = lookupKey ? departmentMap[lookupKey] : null;

          if (department) {
            displayName = department.name;
          }
        } else if (['MEDICAL_TEST'].includes(resourceType)) {
          const diagnosticTest = lookupKey ? diagnosticTestMap[lookupKey] : null;

          if (diagnosticTest) {
            displayName = diagnosticTest.name;
          }
        }

        // Final fallback
        if (!displayName) {
          displayName = resource.resourceKey || 'Unknown Resource';
        }

        return displayName;
      }
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
            </span>{' '}
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'cancelledByAt',
      title: <Translate>Cancelled By\At</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.deletedBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.deletedAt)}</span>
          </>
        );
      }
    },
    {
      key: 'cancellationReason',
      title: <Translate>Cancellation Reason</Translate>,
      expandable: true
    },
    {
      key: 'dischargedByAt',
      title: <Translate>Discharged By\At</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.discharge}</span>
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(rowData.dischargeAt)}
            </span>
          </>
        );
      }
    }
  ];

  useEffect(() => {
    setVisitHistoryListRequest({
      ...initialListRequest,
      sortBy: 'plannedStartDate',
      sortType: 'desc',
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient.key || undefined
        },
        {
          fieldName: 'resource_type_lkey',
          operator: 'match',
          value: 'EMERGENCY'
        }
      ],
      pageNumber: 1
    });
  }, [patient?.key]);

  return (
    <MyTable
      data={paginatedData ?? []}
      columns={tableColumns}
      height={580}
      loading={isFetching}
      sortColumn={sortColumn}
      sortType={sortType}
      onSortChange={(col, type) => {
        setSortColumn(col);
        setSortType(type);
      }}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={visiterHistoryResponse?.object.length}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={e => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
    />
  );
};

export default EmergencyTable;