import React, { useEffect, useMemo, useState } from 'react';
import { Button, ButtonGroup, Calendar as RsCalendar, DatePicker, Stack, Text, TimePicker } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import { useLazySearchAppointmentsQuery } from '@/services/appointment/appointmentService';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  request: any;
  onSelectAppointment: (appointment: any) => void;
};

const minutesOfLocalDay = (d: Date) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;

const ApproveRequestAgendaModal = ({ open, setOpen, request, onSelectAppointment }: Props) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<'agenda'>('agenda');
  const [searchAppointments, { isFetching }] = useLazySearchAppointmentsQuery();
  const [slots, setSlots] = useState<any[]>([]);
  const [timeFrom, setTimeFrom] = useState<Date | null>(null);
  const [timeTo, setTimeTo] = useState<Date | null>(null);

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
    setSelectedDate(Number.isNaN(next.getTime()) ? new Date() : next);
  }, [open, request]);

  useEffect(() => {
    if (!open) {
      setTimeFrom(null);
      setTimeTo(null);
      return;
    }
    setTimeFrom(null);
    setTimeTo(null);
  }, [open, selectedDate]);

  useEffect(() => {
    if (!open || !facilityId || !departmentId || !selectedDate) {
      setSlots([]);
      return;
    }

    const load = async () => {
      try {
        const isSameLocalDay = (a: Date, b: Date) =>
          a.getFullYear() === b.getFullYear() &&
          a.getMonth() === b.getMonth() &&
          a.getDate() === b.getDate();

        const res = await searchAppointments({
          filter: {
            facility: Number(facilityId),
            department: Number(departmentId),
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
            return isSameLocalDay(d, selectedDate);
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
  }, [open, facilityId, departmentId, selectedDate, searchAppointments]);

  const filteredSlots = useMemo(() => {
    if (!timeFrom && !timeTo) return slots;
    let fromM = timeFrom != null ? minutesOfLocalDay(timeFrom) : null;
    let toM = timeTo != null ? minutesOfLocalDay(timeTo) : null;
    if (fromM != null && toM != null && fromM > toM) {
      const t = fromM;
      fromM = toM;
      toM = t;
    }
    return slots.filter((slot: any) => {
      const startRaw =
        slot?.appointmentStart ?? slot?.appointment_start ?? slot?.startDatetime ?? slot?.start_datetime;
      const start = startRaw ? new Date(startRaw) : null;
      if (!start || Number.isNaN(start.getTime())) return false;
      const m = minutesOfLocalDay(start);
      if (fromM != null && m < fromM) return false;
      if (toM != null && m > toM) return false;
      return true;
    });
  }, [slots, timeFrom, timeTo]);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Approve Appointment Request"
      size="65vw"
      bodyheight="75vh"
      actionButtonLabel=""
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <ButtonGroup size="sm">
              <Button appearance={currentView === 'agenda' ? 'primary' : 'subtle'} onClick={() => setCurrentView('agenda')}>
                Agenda
              </Button>
            </ButtonGroup>
            <DatePicker
              oneTap
              value={selectedDate}
              onChange={d => setSelectedDate(d ?? new Date())}
              format="yyyy-MM-dd"
              style={{ width: 180 }}
            />
          </div>

          <Stack spacing={10} alignItems="center" wrap style={{ padding: '4px 0' }}>
            <Text size="sm" style={{ fontWeight: 600, color: '#475569' }}>
              Time filter
            </Text>
            <TimePicker
              format="HH:mm"
              value={timeFrom}
              onChange={setTimeFrom}
              placeholder="From"
              cleanable
              style={{ width: 110 }}
            />
            <Text size="sm" style={{ color: '#94a3b8' }}>
              –
            </Text>
            <TimePicker
              format="HH:mm"
              value={timeTo}
              onChange={setTimeTo}
              placeholder="To"
              cleanable
              style={{ width: 110 }}
            />
            <Button size="xs" appearance="ghost" onClick={() => { setTimeFrom(null); setTimeTo(null); }}>
              Clear times
            </Button>
          </Stack>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12 }}>
            <div style={{ maxHeight: '58vh', overflowY: 'auto', border: '1px solid #dbe2ea', borderRadius: 8 }}>
              {isFetching ? (
                <div style={{ fontSize: 13, color: '#64748b', padding: 12 }}>Loading free appointments...</div>
              ) : slots.length === 0 ? (
                <div style={{ fontSize: 13, color: '#94a3b8', padding: 12 }}>No NEW appointments for selected date.</div>
              ) : filteredSlots.length === 0 ? (
                <div style={{ fontSize: 13, color: '#94a3b8', padding: 12 }}>
                  No slots match the selected time range. Try widening From / To or clear the time filter.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#334155' }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e2e8f0', width: 180 }}>
                        Date
                      </th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e2e8f0', width: 170 }}>
                        Time
                      </th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>Event</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSlots.map((slot: any) => {
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
                          style={{ cursor: 'pointer', borderBottom: '1px solid #eef2f7' }}
                        >
                          <td style={{ padding: '10px 12px', color: '#475569' }}>{dateLabel}</td>
                          <td style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 600 }}>{timeLabel}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: '#166534',
                                  background: '#dcfce7',
                                  border: '1px solid #86efac',
                                  borderRadius: 999,
                                  padding: '2px 8px',
                                  fontWeight: 600
                                }}
                              >
                                NEW
                              </span>
                              <span style={{ color: '#334155' }}>Available appointment</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ border: '1px solid #dbe2ea', borderRadius: 8, padding: 8 }}>
              <Stack justifyContent="space-between" alignItems="center" style={{ marginBottom: 6 }}>
                <Text style={{ fontWeight: 600 }}>
                  {selectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Text>
                <Button size="xs" appearance="subtle" onClick={() => setSelectedDate(new Date())}>
                  Today
                </Button>
              </Stack>
              <RsCalendar
                compact
                value={selectedDate}
                onChange={d => setSelectedDate(d)}
                style={{ width: '100%', height: 260, fontSize: 12 }}
              />
            </div>
          </div>
        </div>
      }
    />
  );
};

export default ApproveRequestAgendaModal;

