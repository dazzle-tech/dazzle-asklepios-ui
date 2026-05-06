import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';

import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import {
  useLazySearchAppointmentsQuery,
  useRescheduleDiagnosticTestAppointmentMutation
} from '@/services/appointment/appointmentService';
import { newDiagnosticTestAppointmentRescheduleDTO } from '@/types/model-types-constructor-new';
import { notify } from '@/utils/uiReducerActions';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  orderTest: any;
  facilityId?: number;
  onClose?: () => void;
};

const RescheduleAppointmentsLookupModal: React.FC<Props> = ({
  open,
  setOpen,
  orderTest,
  facilityId,
  onClose
}) => {
  const dispatch = useAppDispatch();
  const [searchAppointments, { isFetching }] = useLazySearchAppointmentsQuery();
  const [rescheduleDiagnosticTestAppointment, { isLoading: isSubmitting }] =
    useRescheduleDiagnosticTestAppointmentMutation();
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedDateRecord, setSelectedDateRecord] = useState<{ selectedDate: string | null }>({
    selectedDate: new Date().toISOString().slice(0, 10)
  });
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [rescheduleDto, setRescheduleDto] = useState({
    ...newDiagnosticTestAppointmentRescheduleDTO
  });

  const resolvedFacilityId = useMemo(() => {
    const n = Number(facilityId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [facilityId]);

  const resourceId = useMemo(() => {
    const n = Number(orderTest?.test?.id ?? orderTest?.testId ?? orderTest?.diagnosticTestId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [orderTest]);

  useEffect(() => {
    if (!open) return;
    setSelectedSlotId('');
    setSelectedDateRecord({ selectedDate: new Date().toISOString().slice(0, 10) });
    setRescheduleDto({ ...newDiagnosticTestAppointmentRescheduleDTO });
  }, [open]);

  useEffect(() => {
    if (!open || !resolvedFacilityId || !resourceId) {
      setSlots([]);
      return;
    }

    const loadAvailableAppointments = async () => {
      try {
        const response = await searchAppointments({
          filter: {
            facility: resolvedFacilityId,
            resourceType: 'DIAGNOSTIC_TEST' as any,
            resourceId,
            bookingMode: ['SLOT'] as any,
            status: null,
            patientId: null,
            department: null
          },
          page: 0,
          size: 500,
          sort: 'startDatetime,asc'
        }).unwrap();

        const freeSlots = (response?.data ?? [])
          .filter((row: any) => {
            const status = String(row?.status ?? row?.appointmentStatus ?? '')
              .trim()
              .toUpperCase();
            return status === 'NEW' || status === 'NEW_APPOINTMENT' || status === 'NEW-APPOINTMENT';
          })
          .sort((a: any, b: any) => {
            const aDate = new Date(a?.startDatetime ?? a?.appointmentStart ?? 0).getTime();
            const bDate = new Date(b?.startDatetime ?? b?.appointmentStart ?? 0).getTime();
            return aDate - bDate;
          });

        setSlots(freeSlots);
      } catch {
        setSlots([]);
      }
    };

    void loadAvailableAppointments();
  }, [open, searchAppointments, resolvedFacilityId, resourceId]);

  const closeModal = (next: boolean) => {
    setOpen(next);
    if (!next) onClose?.();
  };

  const daySlots = useMemo(() => {
    const selectedDate = selectedDateRecord.selectedDate
      ? new Date(selectedDateRecord.selectedDate)
      : new Date();
    const now = new Date();
    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    return (slots ?? []).filter((slot: any) => {
      const startRaw = slot?.startDatetime ?? slot?.appointmentStart ?? slot?.appointment_start;
      const start = startRaw ? new Date(startRaw) : null;
      if (!start || Number.isNaN(start.getTime())) return false;
      if (!isSameDay(start, selectedDate)) return false;
      // Prevent showing already-passed slot hours for today.
      if (isSameDay(selectedDate, now)) return start.getTime() >= now.getTime();
      return true;
    });
  }, [slots, selectedDateRecord.selectedDate]);

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
      daySlots.map((slot: any) => {
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
    [daySlots]
  );

  const selectedSlot = useMemo(
    () => daySlots.find((slot: any) => String(slot?.id ?? slot?.key ?? '') === selectedSlotId),
    [daySlots, selectedSlotId]
  );

  return (
    <MyModal
      open={open}
      setOpen={closeModal}
      title="Reschedule Appointment"
      size="62vw"
      bodyheight="70vh"
      actionButtonLabel="Save"
      isDisabledActionBtn={!selectedSlot || !String(rescheduleDto.rescheduleReason ?? '').trim() || isSubmitting}
      actionButtonFunction={async () => {
        const orderTestId = Number(orderTest?.id ?? orderTest?.orderTestId ?? 0);
        const newAppointmentId = Number(selectedSlot?.id ?? selectedSlot?.key ?? 0);
        const rescheduleReason = String(rescheduleDto.rescheduleReason ?? '').trim();
        if (!orderTestId || !newAppointmentId || !rescheduleReason) {
          dispatch(
            notify({
              msg: 'Please select a slot and provide a reschedule reason.',
              sev: 'warning'
            })
          );
          return;
        }

        try {
          await rescheduleDiagnosticTestAppointment({
            orderTestId,
            newAppointmentId,
            rescheduleReason
          }).unwrap();
          dispatch(notify({ msg: 'Diagnostic test appointment rescheduled successfully.', sev: 'success' }));
          closeModal(false);
        } catch {
          dispatch(notify({ msg: 'Failed to reschedule diagnostic test appointment.', sev: 'error' }));
        }
      }}
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Form fluid layout="vertical">
            <MyInput
              fieldType="textarea"
              fieldName="rescheduleReason"
              fieldLabel="Reschedule reason"
              record={rescheduleDto}
              setRecord={setRescheduleDto}
              rows={3}
              width="100%"
              column
            />
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

          <div style={{ border: '1px solid #dbe2ea', borderRadius: 8, minHeight: 420, padding: 12 }}>
            {!isFetching && daySlots.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13 }}>
                No available slot appointments found for this diagnostic test.
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
      }
    />
  );
};

export default RescheduleAppointmentsLookupModal;
