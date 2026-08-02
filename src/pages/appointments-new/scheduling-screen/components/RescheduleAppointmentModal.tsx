import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
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
  const [selectedDateRecord, setSelectedDateRecord] = useState<{ selectedDate: string | null }>({
    selectedDate: new Date().toISOString().slice(0, 10)
  });
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
    const normalized = Number.isNaN(startDate.getTime()) ? new Date() : startDate;
    setSelectedDateRecord({ selectedDate: normalized.toISOString().slice(0, 10) });
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
            departmentIds: [departmentId],
            resourceType,
            resourceId: Number.isFinite(resourceId) && resourceId > 0 ? resourceId : null,
            status: ['NEW'],
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
            const targetDate = selectedDateRecord.selectedDate
              ? new Date(selectedDateRecord.selectedDate)
              : new Date();
            return isSameDay(start, targetDate);
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
    selectedDateRecord.selectedDate
  ]);

  const selectedSlot = useMemo(
    () => slots.find((slot: any) => String(slot?.id ?? slot?.key) === String(selectedSlotId)),
    [slots, selectedSlotId]
  );

  const tableColumns = useMemo(
    () => [
      {
        key: 'selection',
        title: 'Select',
        width: 80,
        render: (rowData: any) => (
          <input type="radio" readOnly checked={selectedSlotId === String(rowData.slotKey)} />
        )
      },
      {
        key: 'date',
        title: 'Date',
        flexGrow: 1,
        render: (rowData: any) => rowData.dateLabel
      },
      {
        key: 'time',
        title: 'Time',
        flexGrow: 1,
        render: (rowData: any) => rowData.timeLabel
      }
    ],
    [selectedSlotId]
  );

  const tableRows = useMemo(
    () =>
      slots.map((slot: any) => {
        const slotKey = String(slot?.id ?? slot?.key ?? '');
        const start = new Date(slot?.startDatetime ?? slot?.appointmentStart ?? 0);
        const end = new Date(slot?.endDatetime ?? slot?.appointmentEnd ?? 0);
        return {
          slotKey,
          dateLabel: Number.isNaN(start.getTime()) ? '-' : start.toLocaleDateString(),
          timeLabel:
            Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
              ? '-'
              : `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        };
      }),
    [slots]
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Form fluid layout="vertical">
              <MyInput
                fieldType="date"
                fieldName="selectedDate"
                fieldLabel="Date"
                record={selectedDateRecord}
                setRecord={setSelectedDateRecord}
                disablePastDates
                width={220}
                column
              />
            </Form>
            <div style={{ border: '1px solid #dbe2ea', borderRadius: 8, padding: 12, minHeight: 420 }}>
              {isFetching ? (
                <div style={{ color: '#64748b', fontSize: 13 }}>Loading free appointments...</div>
              ) : slots.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 13 }}>
                  No free appointments found for the same appointment configuration.
                </div>
              ) : (
                <MyTable
                  columns={tableColumns as any}
                  data={tableRows}
                  loading={isFetching}
                  height={380}
                  onRowClick={(rowData: any) => setSelectedSlotId(String(rowData.slotKey))}
                  rowClassName={(rowData: any) =>
                    selectedSlotId === String(rowData.slotKey) ? 'selected-row' : ''
                  }
                />
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
