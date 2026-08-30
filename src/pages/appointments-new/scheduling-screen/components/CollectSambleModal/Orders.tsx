import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';

import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useFilterDiagnosticOrdersQuery } from '@/services/diagnosic-order/diagnosticOrderService';
import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';
import { formatEnumString } from '@/utils';

import { faLandMineOn } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { skipToken } from '@reduxjs/toolkit/query';
import { Tooltip, Whisper } from 'rsuite';
import { useGetPatientDiagnosesByEncounterIdQuery } from '@/services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';

type OrdersProps = {
  order: any;
  setOrder: (order: any) => void;
  dateFilter: {
    fromDate?: Date;
    toDate?: Date;
  };
  loading?: boolean;
  orderNumberFilter?: string;
  departmentFilter?: any;
  selectedPatient?: any;
  filters?: React.ReactNode;
  departmentId?: number | string;
  fromDepartmentId?: number | string;
};

const Orders = forwardRef<any, OrdersProps>(
  ({
    order,
    setOrder,
    dateFilter,
    loading,
    orderNumberFilter,
    selectedPatient,
    departmentFilter,
    filters,
departmentId: departmentIdProp,
fromDepartmentId
  }, ref) => {

    const [sortColumn, setSortColumn] = useState('id');
    const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

    const [getBulkPatientBasicInfo] = useGetBulkPatientBasicInfoMutation();

    const [patientsMap, setPatientsMap] = useState<Record<number, any>>({});

    const [paginationParams, setPaginationParams] = useState({
      page: 0,
      size: 5,
      sort: ['isUrgent,desc', 'submittedDate,desc']
    });

const { data: diagnosesList } = useGetPatientDiagnosesByEncounterIdQuery(
  order?.encounterId ? { encounterId: order.encounterId } : skipToken
);

const diagnosisMap = useMemo(() => {
  const map: Record<number, any> = {};

  (diagnosesList ?? []).forEach((d: any) => {
    if (d?.id != null) {
      map[d.id] = d;
    }
  });

  return map;
}, [diagnosesList]);

    const fromDateParam = useMemo(() => {
      if (!dateFilter?.fromDate) return undefined;
      const d = new Date(dateFilter.fromDate);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }, [dateFilter?.fromDate]);

    const toDateParam = useMemo(() => {
      if (!dateFilter?.toDate) return undefined;
      const d = new Date(dateFilter.toDate);
      d.setHours(23, 59, 59, 999);
      return d.toISOString();
    }, [dateFilter?.toDate]);

const departmentId = departmentIdProp;

useEffect(() => {
  setPaginationParams(prev => ({
    ...prev,
    page: 0
  }));
}, [
  orderNumberFilter,
  selectedPatient?.id,
  departmentId,
  fromDepartmentId,
  dateFilter?.fromDate,
  dateFilter?.toDate
]);

    const {
      data: ordersResponse,
      isFetching,
      refetch: refetchOrders
    } = useFilterDiagnosticOrdersQuery(
  departmentId && fromDepartmentId
    ? {
        page: paginationParams.page,
        size: paginationParams.size,
        sort: paginationParams.sort,

        status: 'SUBMITTED',
        testType: 'LABORATORY',

        departmentId: Number(departmentId),
        fromDepartmentIdIn: [Number(fromDepartmentId)],

        submittedDateFrom: fromDateParam,
        submittedDateTo: toDateParam,

        ...(selectedPatient?.id
          ? { patientIdIn: [selectedPatient.id] }
          : {}),

        ...(orderNumberFilter?.trim()
          ? { orderNumber: orderNumberFilter.trim() }
          : {})
      }
    : skipToken
);

    useImperativeHandle(ref, () => ({
      refetchOrders
    }));

    const ordersList = ordersResponse?.data ?? [];
    const totalCount = ordersResponse?.totalCount ?? 0;

    const patientIds = useMemo(() => {
      return ordersList
        .map(orderItem => orderItem.patientId)
        .filter(Boolean)
        .map((id: number | string) => Number(id))
        .filter((id, index, arr) => arr.indexOf(id) === index);
    }, [ordersList]);

    useEffect(() => {
      if (!patientIds.length) return;

      getBulkPatientBasicInfo(patientIds)
        .unwrap()
        .then((res: any[]) => {
          setPatientsMap(prev => {
            const next = { ...prev };
            res.forEach((patient: any) => {
              if (patient?.id != null) {
                next[Number(patient.id)] = patient;
              }
            });
            return next;
          });
        })
        .catch(err => {
          console.error('Bulk patient error:', err);
        });
    }, [patientIds, getBulkPatientBasicInfo]);

    useEffect(() => {
      if (!order?.id && ordersList.length > 0) {
        setOrder(ordersList[0]);
      }
    }, [order?.id, ordersList, setOrder]);

    const isSelected = (rowData: any) => {
      return rowData && order && rowData.id === order.id ? 'selected-row' : '';
    };

    const handlePageChange = (_: any, newPage: number) => {
      setPaginationParams(prev => ({ ...prev, page: newPage }));
    };

    const handleRowsPerPageChange = (e: any) => {
      const newSize = Number(e.target.value);
      setPaginationParams(prev => ({ ...prev, size: newSize, page: 0 }));
    };

    const handleSortChange = (column: string, type: 'asc' | 'desc') => {
      setSortColumn(column);
      setSortType(type);
      setPaginationParams(prev => ({
        ...prev,
        sort: ['isUrgent,desc', 'submittedDate,desc'],
        page: 0
      }));
    };

    const tableColumns = [
      {
        key: 'orderNumber',
        title: <Translate>ORDER ID</Translate>,
        flexGrow: 1,
        render: (r: any) => r.orderNumber ?? ' '
      },
      {
        key: 'date',
        title: <Translate>DATE, TIME</Translate>,
        flexGrow: 2,
        render: (r: any) => {
          const rawDate = r.submittedDate ?? r.submittedAt ?? r.createdAt;
          if (!rawDate) return ' ';
          const d = new Date(rawDate);
          if (isNaN(d.getTime())) return rawDate;

          const datePart = d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          const timePart = d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });

          return (
            <>
              <div>{datePart}</div>
              <div className="date-table-style">{timePart}</div>
            </>
          );
        }
      },
      {
        key: 'patient',
        title: <Translate>PATIENT</Translate>,
        flexGrow: 3,
        render: (r: any) => {
          const patient = patientsMap[Number(r.patientId)];
          const fullName = [
            patient?.firstName,
            patient?.secondName,
            patient?.lastName
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <>
              <span>{fullName || '—'}</span>
              <br />
              <span className="date-table-style">
                {patient?.medicalRecordNumber ?? '—'}
              </span>
            </>
          );
        }
      },
      {
        key: 'status',
        title: <Translate>STATUS</Translate>,
        flexGrow: 2,
        render: (r: any) => <>{formatEnumString(r.labStatus ?? r.status ?? '—')}</>
      },
      {
        key: 'urgent',
        title: <Translate>MARKER</Translate>,
        flexGrow: 1,
        render: (r: any) =>
          r.isUrgent ? (
            <Whisper placement="top" speaker={<Tooltip>Urgent</Tooltip>}>
              <FontAwesomeIcon icon={faLandMineOn} className="urgent-icon-style" />
            </Whisper>
          ) : null
      }
    ];

    // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';
    const dir = isRTL ? 'rtl' : 'ltr';

    return (
      <div dir={dir}>
        <MyTable
          data={ordersList}
          columns={tableColumns}
          loading={loading || isFetching}
          height={200}
          onRowClick={(rowData: any) => setOrder(rowData)}
          rowClassName={isSelected}
          page={paginationParams.page}
          rowsPerPage={paginationParams.size}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          sortColumn={sortColumn}
          sortType={sortType}
          filters={filters}
          onSortChange={handleSortChange}
        />
      </div>
    );
  }
);

export default Orders;
