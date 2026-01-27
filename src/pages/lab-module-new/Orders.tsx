import React, { useEffect, useMemo, useState,forwardRef, useImperativeHandle } from 'react';

import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';

import { useFilterDiagnosticOrdersQuery } from '@/services/diagnosic-order/diagnosticOrderService';
import { useLazyGetPatientByIdQuery } from '@/services/patientService';
import { formatDateWithoutSeconds } from '@/utils';
import { useAppSelector } from '@/hooks';
import { skipToken } from '@reduxjs/toolkit/query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLandMineOn } from '@fortawesome/free-solid-svg-icons';
import { Tooltip, Whisper } from 'rsuite';
import { formatEnumString} from '@/utils';
import './styles.less';

type OrdersProps = {
  order: any;
  setOrder: (order: any) => void;
  dateFilter: {
    fromDate?: Date;
    toDate?: Date;
  };
  loading?: boolean;
};

const Orders = forwardRef<any, OrdersProps>(
  ({ order, setOrder, dateFilter,loading  }, ref) => {
    const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const [sortColumn, setSortColumn] = useState("id");
  const [sortType, setSortType] = useState<"asc" | "desc">("asc");

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: ['isUrgent,desc', 'submittedDate,desc'],
  });


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

  const departmentId =
    selectedDepartment?.id ??
    selectedDepartment?.departmentId ??
    selectedDepartment?.key;

      const formatDateTime = (date?: string) => {
        if (!date) return '—';

        const d = new Date(date);
        if (isNaN(d.getTime())) return date;

        return d.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      };


  const {
    data: ordersResponse,
    isFetching,
    refetch: refetchOrders
  } = useFilterDiagnosticOrdersQuery(
    departmentId
    ? {
        page: paginationParams.page,
        size: paginationParams.size,
        sort: paginationParams.sort,
        status: 'SUBMITTED',
        departmentId: selectedDepartment?.departmentId,
        submittedDateFrom: fromDateParam,
        submittedDateTo: toDateParam
      }
      : skipToken
  );

  useImperativeHandle(ref, () => ({
    refetchOrders
  }));




  const ordersList = ordersResponse?.data ?? [];
  const totalCount = ordersResponse?.totalCount ?? 0;

  useEffect(() => {
    if (!order?.id && ordersList.length > 0) {
      setOrder(ordersList[0]);
    }
  }, [ordersList]);

  const isSelected = rowData =>
    rowData && order && rowData.id === order.id ? 'selected-row' : '';



  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [fetchPatientById] = useLazyGetPatientByIdQuery();
  const [patientsMap, setPatientsMap] = useState<Record<string, any>>({});

  const patientIds = useMemo(
    () =>
      ordersList
        .map(o => o.patientId)
        .filter(Boolean)
        .map(String)
        .filter((id, i, arr) => arr.indexOf(id) === i),
    [ordersList]
  );
  useEffect(() => {
    if (!patientIds.length) return;

    patientIds.forEach(id => {
      if (patientsMap[id]) return;

      fetchPatientById(id)
        .unwrap()
        .then(patient => {

          if (!patient) return;

          setPatientsMap(prev => ({
            ...prev,
            [id]: patient
          }));
        })
        .catch(() => {
        });
    });
  }, [patientIds, fetchPatientById, patientsMap]);

  const tableColumns = [
    {
      key: 'orderNumber',
      title: <Translate>ORDER ID</Translate>,
      flexGrow: 1,
      render: r => {
        return r.orderNumber ?? '—';
      }
    },
    {
      key: 'date',
      title: <Translate>DATE, TIME</Translate>,
      flexGrow: 2,
      render: r => {
        const rawDate =
          r.submittedDate ??
          r.submittedAt ??
          r.createdAt;

        if (!rawDate) return '—';

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
      render: r => {
        const patient = patientsMap[String(r.patientId)];

        return (
          <>
            <span>{patient?.fullName ?? '—'}</span>
            <br />
            <span className="date-table-style">
              {patient?.patientMrn ?? '—'}
            </span>
          </>
        );
      }
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      flexGrow: 2,
      render: r => {
        console.log("r print: ",r);
        return <>{formatEnumString(r.labStatus ?? r.status ?? '—')}</>;
      }
    },
    {
      key: 'urgent',
      title: <Translate>MARKER</Translate>,
      flexGrow: 1,
      render: r =>
        r.isUrgent ? (
          <Whisper placement="top" speaker={<Tooltip>Urgent</Tooltip>}>
            <FontAwesomeIcon icon={faLandMineOn} className="urgent-icon-style" />
          </Whisper>
        ) : null
    }
  ];

  console.log("ordersList: ", ordersList);

  useEffect(() => {
    setOrder(null);
  }, [fromDateParam, toDateParam]);

  useEffect(() => {
    if (!order?.id && ordersList.length > 0) {
      setOrder(ordersList[0]);
    }
  }, [ordersList]);

    const handlePageChange = (_: any, newPage: number) => {
      setPaginationParams(prev => ({
        ...prev,
        page: newPage,
      }));
    };

    const handleRowsPerPageChange = (e: any) => {
      const newSize = Number(e.target.value);
      setPaginationParams(prev => ({
        ...prev,
        size: newSize,
        page: 0,
      }));
    };

    const handleSortChange = (column: string, type: "asc" | "desc") => {
      setSortColumn(column);
      setSortType(type);

      setPaginationParams(prev => ({
        ...prev,
        sort: [
          'isUrgent,desc',
          'submittedDate,desc',
        ],
        page: 0,
      }));

    };



  return (
    <MyTable
      data={ordersList}
      columns={tableColumns}
      loading={loading || isFetching}
      height={200}
      onRowClick={rowData => setOrder(rowData)}
      rowClassName={isSelected}
      page={paginationParams.page}
      rowsPerPage={paginationParams.size}
      totalCount={totalCount}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      sortColumn={sortColumn}
      sortType={sortType}
      onSortChange={handleSortChange}
    />
  );
});

export default Orders;
