import React from 'react';
import ArrowRightLineIcon from '@rsuite/icons/ArrowRightLine';
import { Text } from 'rsuite';
import { useGetAppointmentsByStatusBetweenDatesQuery } from '@/services/appointment/appointmentService';
import { useGetPatientsByIdsQuery } from '@/services/patient/patientService';

const getAppointmentPatientId = (appointment: any): number | null => {
  const raw =
    appointment?.patientId ??
    appointment?.patientKey ??
    (typeof appointment?.patient === 'object'
      ? appointment.patient?.id ?? appointment.patient?.key
      : appointment?.patient);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Same start field order as the scheduling calendar (`ScheduleScreen` event mapping). */
const getAppointmentStartDate = (a: any): Date | null => {
  const raw =
    a?.appointmentStart ??
    a?.appointment_start ??
    a?.startDatetime ??
    a?.start_datetime ??
    a?.appointmentDateTime ??
    a?.appointment_datetime ??
    a?.applyStartDateTime ??
    a?.apply_start_datetime;
  if (raw == null || raw === '') return null;
  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

type TodayAppointmentsListProps = {
  selectedDate?: Date | null;
  todayAppointmentsList?: any[];
  isFetchingTodayAppointments?: boolean;
  rightPanelAppointmentRows?: any[];
  todayTimelineRows?: any[];
  onViewAppointment?: (appointmentData: any) => void;
};

const TodayAppointmentsList = ({
  selectedDate,
  onViewAppointment
}: TodayAppointmentsListProps) => {
  const day = new Date(selectedDate ?? new Date());
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  const allowedStatuses = ['CHECKED_IN', 'BOOKED', 'IN_SERVICE', 'CONFIRMED'];
  const { data: todayAppointmentsResponse, isFetching: isFetchingTodayAppointments } =
    useGetAppointmentsByStatusBetweenDatesQuery({
      status: allowedStatuses,
      startDatetime: start.toISOString(),
      endDatetime: end.toISOString(),
      page: 0,
      size: 100,
      sort: 'id,asc'
    });

  const todayPatientIds = React.useMemo(() => {
    const rows = (todayAppointmentsResponse as any)?.data ?? [];
    const ids = new Set<number>();
    rows.forEach((a: any) => {
      const id = getAppointmentPatientId(a);
      if (id != null) ids.add(id);
    });
    return Array.from(ids).sort((x, y) => x - y);
  }, [todayAppointmentsResponse]);

  const { data: todayPatientsByIds } = useGetPatientsByIdsQuery(
    { ids: todayPatientIds },
    { skip: todayPatientIds.length === 0 }
  );

  const todayPatientDisplayById = React.useMemo(() => {
    const m = new Map<string, { name: string; mrn: string }>();
    for (const p of todayPatientsByIds ?? []) {
      const id = (p as any)?.id;
      if (id == null) continue;
      const name =
        [(p as any).firstName, (p as any).secondName, (p as any).thirdName, (p as any).lastName]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        (p as any).fullName ||
        '';
      const mrn =
        (p as any).medicalRecordNumber ?? (p as any).patientMrn ?? (p as any).mrn ?? '';
      m.set(String(id), { name: String(name || '').trim(), mrn: String(mrn || '').trim() });
    }
    return m;
  }, [todayPatientsByIds]);

  const todayAppointmentsList = React.useMemo(() => {
    const rows = (todayAppointmentsResponse as any)?.data ?? [];
    const mapped = rows.map((a: any) => {
      const startDate = getAppointmentStartDate(a);
      const timeLabel = !startDate
        ? '--:--'
        : startDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
      const hourLabel = !startDate
        ? '--'
        : new Intl.DateTimeFormat(undefined, { hour: 'numeric', hour12: true }).format(startDate);
      const patient = a?.patient ?? {};
      const pid = getAppointmentPatientId(a);
      const fromSvc = pid != null ? todayPatientDisplayById.get(String(pid)) : undefined;
      const patientName =
        (fromSvc?.name && fromSvc.name.trim()) ||
        patient?.full_name ||
        patient?.fullName ||
        [patient?.first_name, patient?.last_name].filter(Boolean).join(' ') ||
        [patient?.firstName, patient?.lastName].filter(Boolean).join(' ') ||
        'Unknown';
      return {
        id: a?.id ?? a?.key ?? `${patientName}-${timeLabel}`,
        timeLabel,
        hourLabel,
        startDate,
        patientName,
        status: a?.status ?? a?.appointmentStatus ?? '-',
        _raw: a
      };
    });
    return mapped.sort((x: any, y: any) => {
      const tx = x.startDate instanceof Date ? x.startDate.getTime() : 0;
      const ty = y.startDate instanceof Date ? y.startDate.getTime() : 0;
      return tx - ty;
    });
  }, [todayAppointmentsResponse, todayPatientDisplayById]);

  const appointmentDisplayRows = React.useMemo(() => {
    const statusColor = (status: string) => {
      const s = String(status ?? '').toUpperCase();
      if (s.includes('BOOK')) return '#059669';
      if (s.includes('CONFIRM')) return '#166534';
      if (s.includes('CHECK')) return '#F5B971';
      if (s.includes('IN_SERVICE') || s.includes('IN SERVICE')) return '#7C8BF3';
      return '#9DB5DA';
    };
    return (todayAppointmentsList ?? []).map((a: any) => {
      const dots = Array.from({ length: 8 }).map((_, idx) =>
        idx < 4 ? statusColor(a?.status) : '#E6ECF7'
      );
      return {
        ...a,
        dots
      };
    });
  }, [todayAppointmentsList]);

  const todayTimelineRows = React.useMemo(() => {
    const statusColor = (status: string) => {
      const s = String(status ?? '').toUpperCase();
      if (s.includes('BOOK')) return '#059669';
      if (s.includes('CONFIRM')) return '#166534';
      if (s.includes('CHECK')) return '#F5B971';
      if (s.includes('IN_SERVICE') || s.includes('IN SERVICE')) return '#7C8BF3';
      return '#C8D1E1';
    };
    const hours = [8, 9, 10, 11, 12];
    return hours.map(hour => {
      const matches = todayAppointmentsList.filter((a: any) => {
        const d = a?.startDate;
        return d instanceof Date && !Number.isNaN(d.getTime()) && d.getHours() === hour;
      });
      const dots = matches.slice(0, 8).map((m: any) => statusColor(m.status));
      while (dots.length < 8) dots.push('#E6EBF3');
      return { hour, dots };
    });
  }, [todayAppointmentsList]);

  return (
    <div className="today-appointments-panel">
      <div className="today-appointments-panel__header">
        <strong>{todayAppointmentsList.length} today appointments</strong>
      </div>
      <div className="today-appointments-panel__scroll">
        {isFetchingTodayAppointments ? (
          <div className="today-appointments-panel__empty">
            <Text muted>Loading...</Text>
          </div>
        ) : appointmentDisplayRows.length > 0 ? (
          appointmentDisplayRows.map((row: any, idx: number) => (
            <div
              key={row.id}
              className="today-appointments-panel__row"
              style={{
                borderBottom:
                  idx === appointmentDisplayRows.length - 1
                    ? 'none'
                    : '1px solid var(--rs-border-primary)'
              }}
            >
              <span className="today-appointments-panel__hour">{row.hourLabel}</span>
              <div className="today-appointments-panel__info">
                <div className="today-appointments-panel__name">{row.patientName}</div>
                <div className="today-appointments-panel__meta">
                  <span className="today-appointments-panel__time">{row.timeLabel}</span>
                  <div className="today-appointments-panel__dots">
                    {row.dots.map((color: string, dotIdx: number) => (
                      <span
                        key={`${row.id}-dot-${dotIdx}`}
                        className="today-appointments-panel__dot"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <ArrowRightLineIcon
                className="today-appointments-panel__arrow"
                onClick={() => onViewAppointment?.(row?._raw)}
              />
            </div>
          ))
        ) : (
          todayTimelineRows.map((row: any) => (
            <div key={row.hour} className="today-appointments-panel__row today-appointments-panel__row--timeline">
              <span className="today-appointments-panel__hour">{row.hour} AM</span>
              <div className="today-appointments-panel__dots">
                {row.dots.map((color: string, idx: number) => (
                  <span
                    key={`${row.hour}-${idx}`}
                    className="today-appointments-panel__dot today-appointments-panel__dot--timeline"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <ArrowRightLineIcon className="today-appointments-panel__arrow" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TodayAppointmentsList;
