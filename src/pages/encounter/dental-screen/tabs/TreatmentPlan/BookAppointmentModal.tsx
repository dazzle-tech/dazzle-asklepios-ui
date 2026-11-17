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
  patient: any;
  facilityId?: number | null;
  departmentId?: number | null;
};

const DAY_FORMAT = 'YYYY-MM-DD';

const momentEn = (value?: moment.MomentInput) => moment(value).locale('en');

const normalizeStatus = (raw: unknown): string =>
  String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

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

const BookAppointmentModal = ({
  open,
  setOpen,
  patient,
  facilityId,
  departmentId
}: BookAppointmentModalProps) => {
  const [triggerSearch, { isFetching }] =
    useLazyFilterAppointmentsWithoutPaginationQuery();

  const [slots, setSlots] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const { data: bookableDepartments, isLoading: isLoadingDepartments } =
    useGetBookableDepartmentsForLoggedInUserQuery(undefined, {
      skip: !open
    });

  const { data: facility } = useGetFacilityByIdQuery(facilityId as number, {
    skip: !open || !facilityId
  });

  const department = useMemo(
    () =>
      (bookableDepartments ?? []).find(
        (item: any) =>
          String(item?.id) === String(departmentId) &&
          (!facilityId ||
            String(item?.facilityId ?? item?.facility_id ?? '') ===
              String(facilityId))
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
      const today = momentEn().startOf('day');

      setSlots(
        (rows ?? [])
          .filter((appointment: any) =>
            isOpenSlot(appointment?.appointmentStatus ?? appointment?.status)
          )
          .filter((appointment: any) => {
            const start = momentEn(appointment?.startDatetime);

            return (
              start.isValid() &&
              !start.clone().startOf('day').isBefore(today)
            );
          })
          .sort(
            (first: any, second: any) =>
              momentEn(first.startDatetime).valueOf() -
              momentEn(second.startDatetime).valueOf()
          )
      );

      setLoaded(true);
    } catch (error) {
      setSlots([]);
      setLoaded(false);
      setLoadError(
        extractErrorMessage(error) ||
          'Failed to load available appointment slots.'
      );
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

    if (hasAccess) {
      void loadSlots();
    }
  }, [open, hasAccess, loadSlots]);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, any[]>();

    slots.forEach(slot => {
      const key = momentEn(slot.startDatetime).format(DAY_FORMAT);
      const daySlots = map.get(key);

      if (daySlots) {
        daySlots.push(slot);
      } else {
        map.set(key, [slot]);
      }
    });

    return map;
  }, [slots]);

  const daysWithSlots = useMemo(
    () => Array.from(slotsByDay.keys()).sort(),
    [slotsByDay]
  );

  useEffect(() => {
    if (!loaded) return;

    setSelectedDay(
      previous =>
        previous ?? daysWithSlots[0] ?? momentEn().format(DAY_FORMAT)
    );
  }, [loaded, daysWithSlots]);

  const daySlots = selectedDay
    ? slotsByDay.get(selectedDay) ?? []
    : [];

  const shiftDay = (delta: number) =>
    setSelectedDay(
      momentEn(selectedDay ?? undefined)
        .add(delta, 'day')
        .format(DAY_FORMAT)
    );

  const nextAvailable = daysWithSlots.find(
    day => selectedDay != null && day > selectedDay
  );

  const renderSlots = () => {
    if (isLoadingDepartments) {
      return (
        <div className="ba-state">
          <Loader content="Loading..." />
        </div>
      );
    }

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
          <Translate>
            You do not have booking access to this visit&apos;s department.
          </Translate>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="ba-state ba-state-error">
          <div>{loadError}</div>

          <Button
            appearance="ghost"
            size="sm"
            onClick={() => void loadSlots()}
          >
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
          <Translate>
            No available appointment slots for this department.
          </Translate>
        </div>
      );
    }

    if (daySlots.length === 0) {
      return (
        <div className="ba-state">
          <Translate>No available slots on this day.</Translate>

          {nextAvailable && (
            <Button
              appearance="link"
              size="sm"
              onClick={() => setSelectedDay(nextAvailable)}
            >
              {`Next available: ${momentEn(nextAvailable).format(
                'ddd, MMM D'
              )}`}
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
            {`${momentEn(slot.startDatetime).format('HH:mm')} - ${momentEn(
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
              <div className="ba-summary-item">
                <span className="ba-label">Patient</span>
                <span className="ba-value">
                  {patientDisplayName(patient)}
                  {(patient?.medicalRecordNumber || patient?.patientMrn) &&
                    ` (${patient?.medicalRecordNumber ?? patient?.patientMrn})`}
                </span>
              </div>

              <div className="ba-summary-item">
                <span className="ba-label">Facility</span>
                <span className="ba-value">{facilityName || '...'}</span>
              </div>

              <div className="ba-summary-item">
                <span className="ba-label">Department</span>
                <span className="ba-value">{departmentName || '...'}</span>
              </div>

              <div className="ba-summary-item">
                <span className="ba-label">Resource Type</span>
                <span className="ba-value">Department</span>
              </div>

              <div className="ba-summary-item">
                <span className="ba-label">Resource</span>
                <span className="ba-value">{departmentName || '...'}</span>
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
                value={selectedDay ? momentEn(selectedDay).toDate() : null}
                onChange={value =>
                  value && setSelectedDay(momentEn(value).format(DAY_FORMAT))
                }
                shouldDisableDate={date =>
                  momentEn(date).isBefore(momentEn(), 'day')
                }
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

            <div className="ba-slots-content">{renderSlots()}</div>
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