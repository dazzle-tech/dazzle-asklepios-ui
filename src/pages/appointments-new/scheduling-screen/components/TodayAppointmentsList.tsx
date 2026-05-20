import React from 'react';
import { Panel, Text } from 'rsuite';
import ArrowRightLineIcon from '@rsuite/icons/ArrowRightLine';
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

  const rightPanelAppointmentRows = React.useMemo(() => {
    const statusColor = (status: string) => {
      const s = String(status ?? '').toUpperCase();
      if (s.includes('BOOK')) return '#059669';
      if (s.includes('CONFIRM')) return '#166534';
      if (s.includes('CHECK')) return '#F5B971';
      if (s.includes('IN_SERVICE') || s.includes('IN SERVICE')) return '#7C8BF3';
      return '#9DB5DA';
    };
    return (todayAppointmentsList ?? []).slice(0, 5).map((a: any) => {
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
    <Panel
      bordered
      style={{
        padding: 8,
        borderRadius: 12,
        flex: 1,
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>{todayAppointmentsList.length} today appointments</strong>
      </div>
      <div style={{ marginBottom: 8 }} />
      <div
        style={{
          border: '1px solid var(--rs-border-primary)',
          borderRadius: 10,
          overflowY: 'auto',
          overflowX: 'hidden',
          flex: 1,
          minHeight: 0
        }}
      >
        {isFetchingTodayAppointments ? (
          <div style={{ padding: 10 }}>
            <Text muted>Loading...</Text>
          </div>
        ) : rightPanelAppointmentRows.length > 0 ? (
          rightPanelAppointmentRows.map((row: any, idx: number) => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '42px 1fr 12px',
                alignItems: 'center',
                gap: 6,
                padding: '8px 6px',
                borderBottom: idx === rightPanelAppointmentRows.length - 1 ? 'none' : '1px solid var(--rs-border-primary)'
              }}
            >
              <span style={{ fontSize: 11, color: '#7b8794' }}>{row.hourLabel}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#263238' }}>{row.patientName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#8a94a6' }}>{row.timeLabel}</span>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {row.dots.map((color: string, dotIdx: number) => (
                      <span
                        key={`${row.id}-dot-${dotIdx}`}
                        style={{ width: 6, height: 6, borderRadius: 6, display: 'inline-block', backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <ArrowRightLineIcon
                style={{ fontSize: 12, opacity: 0.45, cursor: 'pointer' }}
                onClick={() => onViewAppointment?.(row?._raw)}
              />
            </div>
          ))
        ) : (
          todayTimelineRows.map((row: any) => (
            <div
              key={row.hour}
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr 12px',
                alignItems: 'center',
                gap: 6,
                padding: '8px 6px',
                borderBottom: '1px solid #f0f3f8'
              }}
            >
              <span style={{ fontSize: 11, color: '#7b8794' }}>{row.hour} AM</span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {row.dots.map((color: string, idx: number) => (
                  <span
                    key={`${row.hour}-${idx}`}
                    style={{ width: 8, height: 8, borderRadius: 8, display: 'inline-block', backgroundColor: color }}
                  />
                ))}
              </div>
              <ArrowRightLineIcon style={{ fontSize: 12, opacity: 0.45 }} />
            </div>
          ))
        )}
      </div>
    </Panel>
  );
};

export default TodayAppointmentsList;
