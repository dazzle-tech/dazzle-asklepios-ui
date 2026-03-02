import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppSelector } from '@/hooks';
import { useFilterDiagnosticOrdersQuery } from '@/services/diagnosic-order/diagnosticOrderService';
import { useLazyGetPatientByIdQuery } from '@/services/patientService';
import { formatEnumString } from '@/utils';
import { faLandMineOn } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { skipToken } from '@reduxjs/toolkit/query';
import { Tooltip, Whisper } from 'rsuite';
import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';
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
  ({ order, setOrder, dateFilter, loading }, ref) => {
    const authSlice = useAppSelector(state => state.auth);
    const selectedDepartment = authSlice.selectedDepartment;
    const [sortColumn, setSortColumn] = useState("id");
    const [sortType, setSortType] = useState<"asc" | "desc">("asc");

    const [getBulkPatientBasicInfo] = useGetBulkPatientBasicInfoMutation();
    const [patientsMap, setPatientsMap] = useState<Record<string, any>>({});

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
          testType: "LABORATORY",
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

    const isSelected = rowData =>
      rowData && order && rowData.id === order.id ? 'selected-row' : '';


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

      const numericIds = patientIds.map(id => Number(id));

      getBulkPatientBasicInfo(numericIds)
        .unwrap()
        .then((res: any[]) => {

          const map: Record<string, any> = {};

          res.forEach((p: any, index: number) => {
            const originalId = numericIds[index];
            map[String(originalId)] = p;
          });

          setPatientsMap(map);
        })
        .catch(err => {
          console.error("❌ Bulk patient error:", err);
        });

    }, [patientIds]);

    useEffect(() => {
      console.log("ordersList raw:", ordersList);
    }, [ordersList]);

    const tableColumns = [
      {
        key: 'orderNumber',
        title: <Translate>ORDER ID</Translate>,
        flexGrow: 1,
        render: r => {
          return r.orderNumber ?? ' ';
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
        render: r => {
          const patient = patientsMap[String(r.patientId)];

          return (
            <>
              <span>
                {patient
                  ? `${patient.firstName} ${patient.lastName}`
                  : '—'}
              </span>
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
        render: r => {
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
