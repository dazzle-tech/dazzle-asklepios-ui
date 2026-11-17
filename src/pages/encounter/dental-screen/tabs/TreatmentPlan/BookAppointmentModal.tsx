import React, { useCallback, useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { Button, DatePicker, Loader } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import BookPatient from '@/pages/appointments-new/scheduling-screen/components/BookPatient';
import { useLazyFilterAppointmentsWithoutPaginationQuery } from '@/services/appointment/appointmentService';
import { useGetBookableDepartmentsForLoggedInUserQuery } from '@/services/security/departmentService';
import { useGetFacilityByIdQuery } from '@/services/security/facilityService';
import { extractErrorMessage } from '@/utils';
import type { AppointmentSearchFilterMultiDepartmentDTO } from '@/types/model-types-new';
import './BookAppointmentModal.less';

type BookAppointmentModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Registered patient of the current encounter. */
  patient: any;
  facilityId?: number | null;
  departmentId?: number | null;
};

const DAY_FORMAT = 'YYYY-MM-DD';

const normalizeStatus = (raw: unknown): string =>
  String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

// Same "open slot" rule as the schedule screen (isOpenSlotStatus).
const isOpenSlot = (raw: unknown): boolean => {
  const status = normalizeStatus(raw);
  return status === 'NEW' || status === 'RESCHEDULE';
};

const patientDisplayName = (patient: any): string =>
  [patient?.firstName, patient?.secondName, patient?.thirdName, patient?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim() ||
  patient?.fullName ||
  patient?.name ||
  '';

/**
 * Book Appointment inside Dental Care. Slots come from the same query the schedule screen uses
 * (filterAppointmentsWithoutPagination, restricted to the visit's department as the DEPARTMENT
 * resource) and the chosen slot goes through the existing BookPatient flow, which owns the
 * confirmation and the real booking call.
 */
const BookAppointmentModal = ({
  open,
  setOpen,
  patient,
  facilityId,
  departmentId
}: BookAppointmentModalProps) => {
  const [triggerSearch, { isFetching }] = useLazyFilterAppointmentsWithoutPaginationQuery();
  const [slots, setSlots] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const { data: bookableDepartments, isLoading: isLoadingDepartments } =
    useGetBookableDepartmentsForLoggedInUserQuery(undefined, { skip: !open });
  const { data: facility } = useGetFacilityByIdQuery(facilityId as number, {
    skip: !open || !facilityId
  });

  // Access rule shared with the schedule screen: only departments bookable by the logged-in user.
  const department = useMemo(
    () =>
      (bookableDepartments ?? []).find(
        (d: any) =>
          String(d?.id) === String(departmentId) &&
          (!facilityId || String(d?.facilityId ?? d?.facility_id ?? '') === String(facilityId))
      ),
    [bookableDepartments, departmentId, facilityId]
  );
  const hasAccess = Boolean(department);
  const departmentName = (department as any)?.name ?? '';
  const facilityName = (facility as any)?.name ?? '';

  const loadSlots = useCallback(async () => {
    if (!facilityId || !departmentId) return;
    setLoadError(null);
    const filter: AppointmentSearchFilterMultiDepartmentDTO = {
      facility: Number(facilityId),
      departmentIds: [Number(departmentId)],
      resourceType: 'DEPARTMENT' as any,
      resourceId: Number(departmentId),
      status: null,
      bookingMode: ['QUICK', 'SLOT'] as any,
      patientId: null
    };
    try {
      const rows = await triggerSearch({ filter }).unwrap();
      const today = moment().startOf('day');
      setSlots(
        (rows ?? [])
          .filter((a: any) => isOpenSlot((a as any)?.appointmentStatus ?? a?.status))
          .filter((a: any) => {
            const start = moment(a?.startDatetime);
            return start.isValid() && !start.clone().startOf('day').isBefore(today);
          })
          .sort(
            (a: any, b: any) => moment(a.startDatetime).valueOf() - moment(b.startDatetime).valueOf()
          )
      );
      setLoaded(true);
    } catch (error) {
      setSlots([]);
      setLoaded(false);
      setLoadError(extractErrorMessage(error) || 'Failed to load available appointment slots.');
    }
  }, [facilityId, departmentId, triggerSearch]);

  useEffect(() => {
    if (!open) {
      setSlots([]);
      setLoaded(false);
      setLoadError(null);
      setSelectedDay(null);
      setSelectedSlot(null);
      return;
    }
    if (hasAccess) void loadSlots();
  }, [open, hasAccess, loadSlots]);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    slots.forEach(slot => {
      const key = moment(slot.startDatetime).format(DAY_FORMAT);
      map.set(key, [...(map.get(key) ?? []), slot]);
    });
    return map;
  }, [slots]);
  const daysWithSlots = useMemo(() => Array.from(slotsByDay.keys()).sort(), [slotsByDay]);

  // Land on the first day that has availability once slots are loaded.
  useEffect(() => {
    if (!loaded) return;
    setSelectedDay(prev => prev ?? daysWithSlots[0] ?? moment().format(DAY_FORMAT));
  }, [loaded, daysWithSlots]);

  const daySlots = selectedDay ? slotsByDay.get(selectedDay) ?? [] : [];
  const shiftDay = (delta: number) =>
    setSelectedDay(moment(selectedDay ?? undefined).add(delta, 'day').format(DAY_FORMAT));
  const nextAvailable = daysWithSlots.find(d => selectedDay != null && d > selectedDay);

  const renderSlots = () => {
    if (isLoadingDepartments) return <Loader content="Loading..." />;
    if (!facilityId || !departmentId) {
      return (
        <div className="ba-state ba-state-warning">
          <Translate>This visit has no facility or department.</Translate>
        </div>
      );
    }
    if (!hasAccess) {
      return (
        <div className="ba-state ba-state-warning">
          <Translate>You do not have booking access to this visit&apos;s department.</Translate>
        </div>
      );
    }
    if (loadError) {
      return (
        <div className="ba-state ba-state-error">
          <div>{loadError}</div>
          <Button appearance="ghost" size="sm" onClick={() => void loadSlots()}>
            <Translate>Retry</Translate>
          </Button>
        </div>
      );
    }
    if (isFetching || !loaded) {
      return (
        <div className="ba-state">
          <Loader content="Loading available slots..." />
        </div>
      );
    }
    if (daysWithSlots.length === 0) {
      return (
        <div className="ba-state">
          <Translate>No available appointment slots for this department.</Translate>
        </div>
      );
    }
    if (daySlots.length === 0) {
      return (
        <div className="ba-state">
          <Translate>No available slots on this day.</Translate>
          {nextAvailable && (
            <Button appearance="link" size="sm" onClick={() => setSelectedDay(nextAvailable)}>
              {`Next available: ${moment(nextAvailable).format('ddd, MMM D')}`}
            </Button>
          )}
        </div>
      );
    }
    return (
      <div className="ba-slot-grid">
        {daySlots.map(slot => (
          <Button
            key={slot.id ?? slot.key ?? slot.startDatetime}
            appearance="ghost"
            className="ba-slot"
            onClick={() => setSelectedSlot(slot)}
          >
            {`${moment(slot.startDatetime).format('HH:mm')} - ${moment(
              slot.endDatetime ?? slot.startDatetime
            ).format('HH:mm')}`}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title={<Translate>Book Appointment</Translate>}
        hideActionBtn
        cancelButtonLabel="Cancel"
        size="720px"
        bodyheight="auto"
        content={
          <div className="ba-modal">
            <div className="ba-summary">
              <div>
                <span className="ba-label">Patient</span>
                <span>
                  {patientDisplayName(patient)}
                  {(patient?.medicalRecordNumber || patient?.patientMrn) &&
                    ` (${patient?.medicalRecordNumber ?? patient?.patientMrn})`}
                </span>
              </div>
              <div>
                <span className="ba-label">Facility</span>
                <span>{facilityName || '...'}</span>
              </div>
              <div>
                <span className="ba-label">Department</span>
                <span>{departmentName || '...'}</span>
              </div>
              <div>
                <span className="ba-label">Resource Type</span>
                <span>DEPARTMENT</span>
              </div>
              <div>
                <span className="ba-label">Resource</span>
                <span>{departmentName || '...'}</span>
              </div>
            </div>

            <div className="ba-day-nav">
              <Button
                size="sm"
                disabled={!selectedDay || !hasAccess}
                onClick={() => shiftDay(-1)}
                aria-label="Previous day"
              >
                &lsaquo;
              </Button>
              <DatePicker
                size="sm"
                cleanable={false}
                oneTap
                format="EEE, MMM dd yyyy"
                disabled={!hasAccess}
                value={selectedDay ? moment(selectedDay).toDate() : null}
                onChange={value => value && setSelectedDay(moment(value).format(DAY_FORMAT))}
                shouldDisableDate={date => moment(date).isBefore(moment(), 'day')}
              />
              <Button
                size="sm"
                disabled={!selectedDay || !hasAccess}
                onClick={() => shiftDay(1)}
                aria-label="Next day"
              >
                &rsaquo;
              </Button>
            </div>

            {renderSlots()}
          </div>
        }
      />

      <BookPatient
        open={Boolean(selectedSlot)}
        setOpen={next => {
          if (!next) setSelectedSlot(null);
        }}
        appointmentData={selectedSlot}
        initialPatient={patient}
        onBooked={() => {
          setSelectedSlot(null);
          setOpen(false);
        }}
      />
    </>
  );
};

export default BookAppointmentModal;
