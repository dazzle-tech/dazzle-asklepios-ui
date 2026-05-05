import React, { useEffect, useMemo, useState } from 'react';
import { DatePicker, Form, Radio, RadioGroup } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import {
  useLazySearchAppointmentsQuery,
  useRescheduleAppointmentMutation
} from '@/services/appointment/appointmentService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  appointment: any;
  onRescheduled: () => void;
};

const normalizeResourceType = (value: any): string | null => {
  const v = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  return v || null;
};

const RescheduleAppointmentModal = ({ open, setOpen, appointment, onRescheduled }: Props) => {
  const dispatch = useAppDispatch();
  const [searchAppointments, { isFetching }] = useLazySearchAppointmentsQuery();
  const [rescheduleAppointment, { isLoading: isRescheduling }] = useRescheduleAppointmentMutation();
  const [reason, setReason] = useState<{ reason: string }>({ reason: '' });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');

  const appointmentId = useMemo(
    () => Number(appointment?.id ?? appointment?.key ?? 0),
    [appointment]
  );
  const facilityId = useMemo(
    () => Number(appointment?.facilityId ?? appointment?.facilityKey ?? 0),
    [appointment]
  );
  const departmentId = useMemo(
    () => Number(appointment?.departmentId ?? appointment?.departmentKey ?? 0),
    [appointment]
  );
  const resourceType = useMemo(
    () =>
      normalizeResourceType(
        appointment?.resourceType ??
          appointment?.resourceTypeLkey ??
          appointment?.resource_type ??
          appointment?.templateType
      ),
    [appointment]
  );
  const resourceId = useMemo(
    () => Number(appointment?.resourceId ?? appointment?.resourceKey ?? 0),
    [appointment]
  );
  const bookingMode = useMemo(
    () => String(appointment?.bookingMode ?? '').trim().toUpperCase(),
    [appointment]
  );

  useEffect(() => {
    if (!open) return;
    setReason({ reason: '' });
    setSelectedSlotId('');
    const startRaw = appointment?.startDatetime ?? appointment?.appointmentStart ?? null;
    const startDate = startRaw ? new Date(startRaw) : new Date();
    setSelectedDate(Number.isNaN(startDate.getTime()) ? new Date() : startDate);
  }, [open, appointment]);

  useEffect(() => {
    if (!open || !facilityId || !departmentId) {
      setSlots([]);
      return;
    }

    const loadSlots = async () => {
      try {
        const response = await searchAppointments({
          filter: {
            facility: facilityId,
            department: departmentId,
            resourceType,
            resourceId: Number.isFinite(resourceId) && resourceId > 0 ? resourceId : null,
            status: null,
            bookingMode: bookingMode ? [bookingMode] : null,
            patientId: null
          },
          page: 0,
          size: 1000,
          sort: 'id,asc'
        }).unwrap();

        const isSameDay = (d1: Date, d2: Date) =>
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate();

        const freeSlots = (response?.data ?? [])
          .filter((row: any) => {
            const status = String(row?.appointmentStatus ?? row?.status ?? '').toUpperCase();
            return status === 'NEW' || status === 'NEW_APPOINTMENT' || status === 'NEW-APPOINTMENT';
          })
          .filter((row: any) => Number(row?.id ?? row?.key ?? 0) !== appointmentId)
          .filter((row: any) => {
            const startRaw = row?.startDatetime ?? row?.appointmentStart ?? row?.appointment_start;
            const start = startRaw ? new Date(startRaw) : null;
            if (!start || Number.isNaN(start.getTime())) return false;
            return isSameDay(start, selectedDate);
          })
          .sort((a: any, b: any) => {
            const as = new Date(a?.startDatetime ?? a?.appointmentStart ?? 0).getTime();
            const bs = new Date(b?.startDatetime ?? b?.appointmentStart ?? 0).getTime();
            return as - bs;
          });

        setSlots(freeSlots);
      } catch {
        setSlots([]);
      }
    };

    void loadSlots();
  }, [
    open,
    searchAppointments,
    facilityId,
    departmentId,
    resourceType,
    resourceId,
    bookingMode,
    appointmentId,
    selectedDate
  ]);

  const selectedSlot = useMemo(
    () => slots.find((slot: any) => String(slot?.id ?? slot?.key) === String(selectedSlotId)),
    [slots, selectedSlotId]
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Reschedule Appointment"
      size="62vw"
      bodyheight="72vh"
      steps={[
        { title: 'Reason for reschedule' },
        { title: 'Select new free appointment' }
      ]}
      content={(activeStep: number) => {
        if (activeStep === 0) {
          return (
            <Form fluid layout="vertical">
              <MyInput
                width="100%"
                column
                fieldLabel="Reason"
                fieldType="textarea"
                fieldName="reason"
                rows={4}
                record={reason}
                setRecord={setReason}
              />
            </Form>
          );
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <DatePicker
              oneTap
              value={selectedDate}
              onChange={d => setSelectedDate(d ?? new Date())}
              format="yyyy-MM-dd"
              style={{ width: 180 }}
            />
            <div style={{ border: '1px solid #dbe2ea', borderRadius: 8, padding: 12, minHeight: 360 }}>
              {isFetching ? (
                <div style={{ color: '#64748b', fontSize: 13 }}>Loading free appointments...</div>
              ) : slots.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 13 }}>
                  No free appointments found for the same appointment configuration.
                </div>
              ) : (
                <RadioGroup
                  name="reschedule-slot"
                  value={selectedSlotId}
                  onChange={(nextValue: string | number) => setSelectedSlotId(String(nextValue))}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {slots.map((slot: any) => {
                      const slotKey = String(slot?.id ?? slot?.key);
                      const start = new Date(slot?.startDatetime ?? slot?.appointmentStart ?? 0);
                      const end = new Date(slot?.endDatetime ?? slot?.appointmentEnd ?? 0);
                      const timeLabel = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      return (
                        <label
                          key={slotKey}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            padding: '10px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <Radio value={slotKey}>
                            {start.toLocaleDateString()} | {timeLabel}
                          </Radio>
                        </label>
                      );
                    })}
                  </div>
                </RadioGroup>
              )}
            </div>
          </div>
        );
      }}
      onBeforeNext={() => {
        if (String(reason?.reason ?? '').trim()) return true;
        dispatch(
          notify({
            msg: 'Please provide a reschedule reason before continuing.',
            sev: 'warning'
          })
        );
        return false;
      }}
      actionButtonLabel="Save"
      isDisabledActionBtn={!selectedSlot || isRescheduling}
      actionButtonFunction={async () => {
        if (!selectedSlot) return;
        const oldAppointmentId = Number(appointment?.id ?? appointment?.key ?? 0);
        const newAppointmentId = Number(selectedSlot?.id ?? selectedSlot?.key ?? 0);
        const rescheduleReason = String(reason?.reason ?? '').trim();
        if (!oldAppointmentId || !newAppointmentId || !rescheduleReason) return;
        try {
          await rescheduleAppointment({
            oldAppointmentId,
            newAppointmentId,
            rescheduleReason
          }).unwrap();
          dispatch(notify({ msg: 'Appointment rescheduled successfully.', sev: 'success' }));
          onRescheduled();
          setOpen(false);
        } catch {
          dispatch(notify({ msg: 'Failed to reschedule appointment.', sev: 'error' }));
        }
      }}
    />
  );
};

export default RescheduleAppointmentModal;
