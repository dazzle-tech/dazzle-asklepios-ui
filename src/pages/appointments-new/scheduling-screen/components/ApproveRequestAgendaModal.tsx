import React, { useEffect, useMemo, useState } from 'react';
import { Button, ButtonGroup, Calendar as RsCalendar, DatePicker, Stack, Text, TimePicker } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import { useLazySearchAppointmentsQuery } from '@/services/appointment/appointmentService';
import { useAppSelector } from '@/hooks';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  request: any;
  onSelectAppointment: (appointment: any) => void;
};

const minutesOfLocalDay = (d: Date) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
const normalizeLocalDayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const normalizeLocalDayEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const ApproveRequestAgendaModal = ({ open, setOpen, request, onSelectAppointment }: Props) => {
  const mode = useAppSelector((state: any) => state.ui.mode);
  const isDark = mode === 'dark';

  const [dateFrom, setDateFrom] = useState<Date>(new Date());
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<'agenda'>('agenda');
  const [searchAppointments, { isFetching }] = useLazySearchAppointmentsQuery();
  const [slots, setSlots] = useState<any[]>([]);
  const dateRangeInvalid = dateFrom != null && dateTo != null && dateTo < dateFrom;

  const facilityId = useMemo(
    () => request?.facilityId ?? request?.facility_id ?? request?.facilityKey ?? request?.facility_key ?? null,
    [request]
  );
  const departmentId = useMemo(
    () =>
      request?.departmentId ??
      request?.department_id ??
      request?.requestedResourceId ??
      request?.requested_resource_id ??
      null,
    [request]
  );

  useEffect(() => {
    if (!open) return;
    const preferred = request?.preferredDate ?? request?.preferred_date ?? null;
    const next = preferred ? new Date(preferred) : new Date();
    const normalized = Number.isNaN(next.getTime()) ? new Date() : next;
    setDateFrom(normalized);
    setDateTo(normalized);
  }, [open, request]);


  useEffect(() => {
    if (!open || !facilityId || !departmentId || !dateFrom || !dateTo || dateRangeInvalid) {
      setSlots([]);
      return;
    }

    const load = async () => {
      try {
        const rangeStart = normalizeLocalDayStart(dateFrom);
        const rangeEnd = normalizeLocalDayEnd(dateTo);

        const res = await searchAppointments({
          filter: {
            facility: Number(facilityId),
            departmentIds: departmentId != null ? [Number(departmentId)] : null,
            resourceType: null,
            resourceId: null,
            status: null,
            bookingMode: null,
            patientId: null
          },
          page: 0,
          size: 1000,
          sort: 'id,asc'
        }).unwrap();

        const nextSlots = (res?.data ?? [])
          .filter((a: any) => {
            const status = String(a?.appointmentStatus ?? a?.status ?? '').toUpperCase();
            return status === 'NEW' || status === 'NEW-APPOINTMENT' || status === 'NEW_APPOINTMENT';
          })
          .filter((a: any) => {
            const startRaw =
              a?.appointmentStart ?? a?.appointment_start ?? a?.startDatetime ?? a?.start_datetime;
            const d = startRaw ? new Date(startRaw) : null;
            if (!d || Number.isNaN(d.getTime())) return false;
            return d >= rangeStart && d <= rangeEnd;
          })
          .sort((x: any, y: any) => {
            const xs = new Date(x?.appointmentStart ?? x?.startDatetime ?? 0).getTime();
            const ys = new Date(y?.appointmentStart ?? y?.startDatetime ?? 0).getTime();
            return xs - ys;
          });

        setSlots(nextSlots);
      } catch {
        setSlots([]);
      }
    };

    void load();
  }, [open, facilityId, departmentId, dateFrom, dateTo, dateRangeInvalid, searchAppointments]);


  // Dark mode color tokens
  const colors = {
    border: isDark ? '#737c8f' : '#dbe2ea',
    tableHeadBg: isDark ? '#1e2533' : '#f8fafc',
    tableHeadText: isDark ? '#94a3b8' : '#334155',
    tableHeadBorder: isDark ? '#737c8f' : '#e2e8f0',
    rowBorder: isDark ? '#737c8f' : '#eef2f7',
    dateCellColor: isDark ? '#94a3b8' : '#475569',
    timeCellColor: isDark ? '#f1f5f9' : '#0f172a',
    mutedText: isDark ? '#64748b' : '#94a3b8',
    loadingText: isDark ? '#94a3b8' : '#64748b',
    toLabel: isDark ? '#64748b' : '#94a3b8',
    timeFilterLabel: isDark ? '#94a3b8' : '#475569',
    calendarHeaderText: isDark ? '#e2e8f0' : undefined,
    calendarBorder: isDark ? '#737c8f' : '#dbe2ea',
    eventText: isDark ? '#cbd5e1' : '#334155',
    badgeBg: isDark ? '#14532d' : '#dcfce7',
    badgeText: isDark ? '#86efac' : '#166534',
    badgeBorder: isDark ? '#166534' : '#86efac',
    rowHoverBg: isDark ? '#1a2235' : '#f8fafc',
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Approve Appointment Request"
      size="65vw"
      bodyheight="75vh"
      actionButtonLabel="Save"
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <ButtonGroup size="sm">
              <Button appearance={currentView === 'agenda' ? 'primary' : 'subtle'} onClick={() => setCurrentView('agenda')}>
                Agenda
              </Button>
            </ButtonGroup>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <DatePicker
                  oneTap
                  value={dateFrom}
                  onChange={d => setDateFrom(d ?? new Date())}
                  format="yyyy-MM-dd"
                  placeholder="From"
                  style={{
                    width: 180,
                    borderColor: dateRangeInvalid ? '#ef4444' : undefined
                  }}
                />
                <Text size="sm" style={{ color: colors.toLabel }}>
                  to
                </Text>
                <DatePicker
                  oneTap
                  value={dateTo}
                  onChange={d => setDateTo(d ?? new Date())}
                  format="yyyy-MM-dd"
                  placeholder="To"
                  style={{
                    width: 180,
                    borderColor: dateRangeInvalid ? '#ef4444' : undefined
                  }}
                />
              </div>
              {dateRangeInvalid ? (
                <Text size="sm" style={{ color: '#dc2626', maxWidth: 368, textAlign: 'right' }}>
                  The To date must be the same as or later than the From date.
                </Text>
              ) : null}
            </div>
          </div>

            <div style={{ maxHeight: '58vh', overflowY: 'auto', border: `1px solid ${colors.border}`, borderRadius: 8 }}>
              {isFetching ? (
                <div style={{ fontSize: 13, color: colors.loadingText, padding: 12 }}>Loading free appointments...</div>
              ) : slots.length === 0 && !dateRangeInvalid ? (
                <div style={{ fontSize: 13, color: colors.mutedText, padding: 12 }}>No NEW appointments for selected date range.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: colors.tableHeadBg, color: colors.tableHeadText }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${colors.tableHeadBorder}`, width: 180 }}>
                        Date
                      </th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${colors.tableHeadBorder}`, width: 170 }}>
                        Time
                      </th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${colors.tableHeadBorder}` }}>Event</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dateRangeInvalid ? null : slots.map((slot: any) => {
                      const startRaw =
                        slot?.appointmentStart ?? slot?.appointment_start ?? slot?.startDatetime ?? slot?.start_datetime;
                      const endRaw =
                        slot?.appointmentEnd ?? slot?.appointment_end ?? slot?.endDatetime ?? slot?.end_datetime;
                      const start = startRaw ? new Date(startRaw) : null;
                      const end = endRaw ? new Date(endRaw) : null;
                      const dateLabel = start
                        ? start.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: '2-digit'
                          })
                        : '--';
                      const timeLabel = `${start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} - ${
                        end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'
                      }`;

                      return (
                        <tr
                          key={String(slot?.id ?? slot?.key)}
                          onClick={() => onSelectAppointment(slot)}
                          style={{ cursor: 'pointer', borderBottom: `1px solid ${colors.rowBorder}` }}
                        >
                          <td style={{ padding: '10px 12px', color: colors.dateCellColor }}>{dateLabel}</td>
                          <td style={{ padding: '10px 12px', color: colors.timeCellColor, fontWeight: 600 }}>{timeLabel}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: colors.badgeText,
                                  background: colors.badgeBg,
                                  border: `1px solid ${colors.badgeBorder}`,
                                  borderRadius: 999,
                                  padding: '2px 8px',
                                  fontWeight: 600
                                }}
                              >
                                NEW
                              </span>
                              <span style={{ color: colors.eventText }}>Available appointment</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

        </div>
      }
    />
  );
};

export default ApproveRequestAgendaModal;