import React, { useEffect, useMemo, useState } from 'react';
import { Form, Panel } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faCalendarCheck, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';

import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { useGetCancelledAppointmentsQuery } from '@/services/appointment/appointmentService';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import type { LinkMap } from '@/utils/paginationHelper';
import { PaginationPerPage } from '@/utils/paginationPerPage';
import type { AppointmentFromTemplate } from '@/types/model-types-new';
import AppointmentLogsModal from './AppointmentLogsModal';
import '../styles.less';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Visible calendar range used as default date filter */
  calendarViewRange: { start: Date; end: Date };
  departmentId?: number | string | null;
  departmentOptions?: { id?: number | string; name?: string; departmentName?: string }[];
  onRebookAppointment?: (appointment: any) => void;
};

type CancelledAppointmentsFilterRecord = {
  startDate: Date | null;
  endDate: Date | null;
  useDepartmentFilter: boolean;
  departmentId: number | null;
};

const buildFilterFromCalendarRange = (
  range: { start: Date; end: Date },
  departmentId?: number | string | null
): CancelledAppointmentsFilterRecord => {
  const deptNum = departmentId != null ? Number(departmentId) : null;
  return {
    startDate: moment(range.start).startOf('day').toDate(),
    endDate: moment(range.end).endOf('day').toDate(),
    useDepartmentFilter: Number.isFinite(deptNum) && deptNum > 0,
    departmentId: Number.isFinite(deptNum) && deptNum > 0 ? deptNum : null
  };
};

const toApiDateRange = (record: CancelledAppointmentsFilterRecord) => {
  const start = moment(record.startDate ?? new Date()).startOf('day');
  let end = moment(record.endDate ?? record.startDate ?? new Date()).endOf('day');
  if (end.isBefore(start)) {
    end = start.clone().endOf('day');
  }
  return {
    startDatetime: start.toISOString(),
    endDatetime: end.toISOString()
  };
};

const resolveRowAppointmentId = (row: any): number | null => {
  const n = Number(row?.id ?? row?.key);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const getAppointmentStartDate = (row: any): Date | null => {
  const raw =
    row?.startDatetime ??
    row?.appointmentDateTime ??
    row?.appointmentStart ??
    row?.startDateTime;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Rebook allowed for today and future slot dates (same rule as schedule calendar). */
const canRebookCancelledAppointment = (row: any): boolean => {
  const start = getAppointmentStartDate(row);
  if (!start) return false;
  return !moment(start).startOf('day').isBefore(moment().startOf('day'));
};

const getDepartmentName = (
  row: any,
  departmentNameById: Map<string, string>
): string => {
  const deptId = row?.departmentId ?? row?.department_id;
  if (deptId != null) {
    const fromMap = departmentNameById.get(String(deptId));
    if (fromMap) return fromMap;
  }
  return (
    row?.departmentName ??
    row?.department?.name ??
    row?.department?.departmentName ??
    (deptId != null ? String(deptId) : '-')
  );
};

const CancelledAppointmentsModal = ({
  open,
  setOpen,
  calendarViewRange,
  departmentId,
  departmentOptions = [],
  onRebookAppointment
}: Props) => {
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc',
    timestamp: Date.now()
  });
  const [links, setLinks] = useState<LinkMap>({});
  const [filterRecord, setFilterRecord] = useState<CancelledAppointmentsFilterRecord>(() =>
    buildFilterFromCalendarRange(calendarViewRange, departmentId)
  );
  const [appliedFilter, setAppliedFilter] = useState<CancelledAppointmentsFilterRecord>(() =>
    buildFilterFromCalendarRange(calendarViewRange, departmentId)
  );
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logsAppointment, setLogsAppointment] = useState<any | null>(null);

  const departmentNameById = useMemo(() => {
    const map = new Map<string, string>();
    departmentOptions.forEach(d => {
      const id = d?.id;
      const name = d?.name ?? d?.departmentName;
      if (id != null && name) map.set(String(id), String(name));
    });
    return map;
  }, [departmentOptions]);

  const departmentSelectData = useMemo(
    () =>
      departmentOptions
        .map(d => ({
          label: d?.name ?? d?.departmentName ?? `Department #${d?.id ?? ''}`,
          value: Number(d?.id)
        }))
        .filter(o => Number.isFinite(o.value) && o.value > 0),
    [departmentOptions]
  );

  const queryRange = useMemo(() => toApiDateRange(appliedFilter), [appliedFilter]);

  const effectiveDepartmentId = useMemo(() => {
    if (!appliedFilter.useDepartmentFilter) return undefined;
    const id = appliedFilter.departmentId;
    return id != null && Number(id) > 0 ? Number(id) : undefined;
  }, [appliedFilter]);

  const { data: cancelledPage, isFetching } = useGetCancelledAppointmentsQuery(
    {
      startDatetime: queryRange.startDatetime,
      endDatetime: queryRange.endDatetime,
      departmentId: effectiveDepartmentId,
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort,
      timestamp: paginationParams.timestamp
    },
    { skip: !open }
  );

  const rows = cancelledPage?.data ?? [];
  const totalCount = cancelledPage?.totalCount ?? 0;

  useEffect(() => {
    setLinks(cancelledPage?.links ?? {});
  }, [cancelledPage?.links]);

  useEffect(() => {
    if (!open) return;
    const defaults = buildFilterFromCalendarRange(calendarViewRange, departmentId);
    setFilterRecord(defaults);
    setAppliedFilter(defaults);
    setPaginationParams({
      page: 0,
      size: 15,
      sort: 'id,desc',
      timestamp: Date.now()
    });
  }, [open, calendarViewRange, departmentId]);

  useEffect(() => {
    if (!open) return;
    setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
  }, [open, queryRange.startDatetime, queryRange.endDatetime, effectiveDepartmentId]);

  const handleApplyFilters = () => {
    if (!filterRecord.startDate || !filterRecord.endDate) return;
    setAppliedFilter({ ...filterRecord });
    setPaginationParams(prev => ({
      ...prev,
      page: 0,
      timestamp: Date.now()
    }));
  };

  const handleOpenLogs = (row: any) => {
    const id = resolveRowAppointmentId(row);
    if (id == null) return;
    setLogsAppointment(row);
    setLogsModalOpen(true);
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    PaginationPerPage.handlePageChange(
      event,
      newPage,
      paginationParams,
      links,
      setPaginationParams
    );
  };

  const rangeLabel = useMemo(() => {
    const start = moment(appliedFilter.startDate);
    const end = moment(appliedFilter.endDate);
    if (!start.isValid() || !end.isValid()) return '-';
    if (start.isSame(end, 'day')) {
      return start.format('ddd, MMM D, YYYY');
    }
    return `${start.format('MMM D, YYYY')} – ${end.format('MMM D, YYYY')}`;
  }, [appliedFilter.startDate, appliedFilter.endDate]);

  const columns = useMemo(
    () => [
      {
        key: 'id',
        title: <Translate>ID</Translate>,
        flexGrow: 1,
        render: (row: AppointmentFromTemplate) => row?.id ?? '-'
      },
      {
        key: 'startDatetime',
        title: <Translate>Start</Translate>,
        flexGrow: 2,
        render: (row: any) =>
          formatDateWithoutSeconds(row?.startDatetime ?? row?.appointmentDateTime) || '-'
      },
      {
        key: 'endDatetime',
        title: <Translate>End</Translate>,
        flexGrow: 2,
        render: (row: any) => formatDateWithoutSeconds(row?.endDatetime) || '-'
      },
      {
        key: 'department',
        title: <Translate>Department</Translate>,
        flexGrow: 2,
        render: (row: any) => getDepartmentName(row, departmentNameById)
      },
      {
        key: 'resourceType',
        title: <Translate>Resource type</Translate>,
        flexGrow: 1,
        render: (row: any) => formatEnumString(String(row?.resourceType ?? '')) || '-'
      },
      {
        key: 'cancelReason',
        title: <Translate>Cancel reason</Translate>,
        flexGrow: 2,
        render: (row: any) => String(row?.cancelReason ?? row?.otherReason ?? '-')
      },
      {
        key: 'cancelledBy',
        title: <Translate>Cancelled by</Translate>,
        flexGrow: 1,
        render: (row: any) => String(row?.cancelledBy ?? row?.lastModifiedBy ?? '-')
      },
      {
        key: 'status',
        title: <Translate>Status</Translate>,
        flexGrow: 1,
        render: (row: any) => (
          <MyBadgeStatus
            color="#dc2626"
            contant={formatEnumString(String(row?.status ?? row?.appointmentStatus ?? 'CANCELLED'))}
          />
        )
      },
      {
        key: 'actions',
        title: <Translate>Actions</Translate>,
        width: 100,
        align: 'center' as const,
        render: (row: any) => {
          const hasId = resolveRowAppointmentId(row) != null;
          const canRebook = canRebookCancelledAppointment(row);
          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12
              }}
            >
              <FontAwesomeIcon
                icon={faClipboardList}
                title="View appointment logs"
                className="action-icon"
                style={{
                  color: '#2563eb',
                  cursor: hasId ? 'pointer' : 'not-allowed',
                  opacity: hasId ? 1 : 0.35,
                  fontSize: 18
                }}
                onClick={e => {
                  e.stopPropagation();
                  if (hasId) handleOpenLogs(row);
                }}
              />
              <FontAwesomeIcon
                icon={faCalendarCheck}
                title={
                  canRebook
                    ? 'Rebook appointment'
                    : 'Rebook not available for appointments before today'
                }
                className="action-icon"
                style={{
                  color: '#16a34a',
                  cursor: canRebook && onRebookAppointment ? 'pointer' : 'not-allowed',
                  opacity: canRebook && onRebookAppointment ? 1 : 0.35,
                  fontSize: 18
                }}
                onClick={e => {
                  e.stopPropagation();
                  if (canRebook && onRebookAppointment) onRebookAppointment(row);
                }}
              />
            </div>
          );
        }
      }
    ],
    [departmentNameById, onRebookAppointment]
  );

  return (
    <>
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Cancelled appointments"
      size="85vw"
      bodyheight="75vh"
      hideActionBtn
      steps={[{ title: 'Cancelled', icon: <FontAwesomeIcon icon={faBan} /> }]}
      content={
        <>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
            Cancelled appointments for <strong>{rangeLabel}</strong>.
          </p>
          <Panel bordered style={{ marginBottom: 12, padding: '12px 16px' }}>
            <Form fluid className="cancelled-appointments-filter-row">
              <MyInput
                column
                height={35}
                fieldLabel="Start date"
                fieldType="date"
                fieldName="startDate"
                record={filterRecord}
                setRecord={setFilterRecord}
                width={200}
              />
              <MyInput
                column
                height={35}
                fieldLabel="End date"
                fieldType="date"
                fieldName="endDate"
                record={filterRecord}
                setRecord={setFilterRecord}
                width={200}
              />
              <MyInput
                column
                height={35}
                fieldType="checkbox"
                fieldLabel="Filter by department"
                fieldName="useDepartmentFilter"
                record={filterRecord}
                setRecord={setFilterRecord}
              />
              <MyInput
                column
                height={35}
                fieldType="select"
                fieldLabel="Department"
                fieldName="departmentId"
                record={filterRecord}
                setRecord={setFilterRecord}
                selectData={departmentSelectData}
                selectDataLabel="label"
                selectDataValue="value"
                disabled={!filterRecord.useDepartmentFilter}
                searchable
                width={280}
                placeholder="All departments"
              />
              <Form.Group className="my-input-container light cancelled-appointments-filter-search">
                <Form.ControlLabel className="cancelled-appointments-filter-search-label">
                  {'\u00a0'}
                </Form.ControlLabel>
                <div style={{ marginBottom: 5 }} />
                <MyButton
                  appearance="primary"
                  onClick={handleApplyFilters}
                  disabled={!filterRecord.startDate || !filterRecord.endDate}
                  loading={isFetching}
                >
                  Search
                </MyButton>
              </Form.Group>
            </Form>
          </Panel>
          <MyTable
            height={420}
            data={rows}
            loading={isFetching}
            columns={columns}
            page={paginationParams.page}
            rowsPerPage={paginationParams.size}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={e => {
              const newSize = Number(e.target.value);
              setPaginationParams(prev => ({
                ...prev,
                size: newSize,
                page: 0,
                timestamp: Date.now()
              }));
            }}
          />
        </>
      }
    />
    <AppointmentLogsModal
      open={logsModalOpen}
      setOpen={nextOpen => {
        setLogsModalOpen(nextOpen);
        if (!nextOpen) setLogsAppointment(null);
      }}
      appointment={logsAppointment}
    />
    </>
  );
};

export default CancelledAppointmentsModal;
