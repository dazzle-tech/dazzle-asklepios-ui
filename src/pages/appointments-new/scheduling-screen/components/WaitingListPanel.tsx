import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Form, Loader } from 'rsuite';
import ArrowRightLineIcon from '@rsuite/icons/ArrowRightLine';
import { skipToken } from '@reduxjs/toolkit/query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUpRightAndDownLeftFromCenter } from '@fortawesome/free-solid-svg-icons';
import {
  useBookAppointmentWaitingListMutation,
  useGetAppointmentWaitingListQuery,
  useLazyGetAppointmentWaitingListAvailableSlotsQuery,
  useRemoveAppointmentWaitingListMutation,
} from '@/services/appointment/appointmentWaitingList/appointmentWaitingListService';
import { useGetServicesBulkByIdsQuery } from '@/services/setup/serviceService';
import { useGetPractitionersBulkMutation } from '@/services/setup/practitioner/PractitionerService';
import { useEnumOptions } from '@/services/enumsApi';
import { useAppDispatch } from '@/hooks';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { extractErrorMessage } from '@/utils';
import type {
  AppointmentWaitingListVM,
  WaitingListAvailableSlotVM,
  WaitingListAvailableSlotsByBookingModeVM,
} from '@/types/model-types-new';
import MyInput from '@/components/MyInput/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import AddToWaitingListModal from './AddToWaitingListModal';
import WaitingListSlotsModal from './WaitingListSlotsModal';

type WaitingListPanelProps = {
  facilityId?: number | string | null;
  departmentId?: number | null;
  departmentOptions?: any[];
  onBooked?: () => void | Promise<void>;
};

const collectSlotAppointmentId = (slot: WaitingListAvailableSlotVM): number | null => {
  const id = Number(slot?.appointmentId);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const collectSlotsAppointmentIds = (slots: WaitingListAvailableSlotVM[]): number[] =>
  slots
    .map(collectSlotAppointmentId)
    .filter((id): id is number => id != null);

const toApiPreferredDate = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt.toISOString().slice(0, 10);
};

const getFirstAvailableSlot = (
  slotsByMode: WaitingListAvailableSlotsByBookingModeVM | null | undefined
): WaitingListAvailableSlotVM | null => {
  const slotList = slotsByMode?.SLOT ?? [];
  if (slotList.length > 0) return slotList[0];
  const bufferList = slotsByMode?.BUFFER ?? [];
  if (bufferList.length > 0) return bufferList[0];
  return null;
};

const formatPreferredDateShort = (value: string | null | undefined): string => {
  if (!value) return '--';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '--';
  return dt.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

const formatBookedAt = (value: string | null | undefined): string => {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const resolveWaitingSinceMs = (
  entry: AppointmentWaitingListVM,
  firstSeenAtByEntryId: Record<number, number>
): number | null => {
  if (entry.createdDate) {
    const dt = new Date(entry.createdDate);
    if (!Number.isNaN(dt.getTime())) return dt.getTime();
  }

  const id = Number(entry.id);
  if (Number.isFinite(id) && id > 0 && firstSeenAtByEntryId[id] != null) {
    return firstSeenAtByEntryId[id];
  }

  return null;
};

const formatWaitingSinceMinutes = (
  entry: AppointmentWaitingListVM,
  firstSeenAtByEntryId: Record<number, number>,
  now: number
): string => {
  const sinceMs = resolveWaitingSinceMs(entry, firstSeenAtByEntryId);
  if (sinceMs == null) return '-';
  const mins = Math.max(0, Math.floor((now - sinceMs) / 60_000));
  return `${mins} min`;
};

const priorityColor = (priority?: string | null) => {
  const key = String(priority ?? '')
    .trim()
    .toUpperCase();
  if (key.includes('URGENT')) return '#dc2626';
  if (key.includes('HIGH')) return '#ea580c';
  if (key.includes('LOW')) return '#64748b';
  if (key.includes('NORMAL')) return '#0284c7';
  return '#8f98ab';
};

const startOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const matchesPreferredDateFilter = (
  preferredDate: string | null | undefined,
  filterDate: Date
): boolean => {
  if (!preferredDate) return true;
  const entryDate = new Date(preferredDate);
  if (Number.isNaN(entryDate.getTime())) return true;
  return (
    entryDate.getFullYear() === filterDate.getFullYear() &&
    entryDate.getMonth() === filterDate.getMonth() &&
    entryDate.getDate() === filterDate.getDate()
  );
};

const formatPreferredDate = (value: string | null | undefined): string => {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatPractitionerName = (practitioner: any): string => {
  const fromParts = [practitioner?.firstName, practitioner?.lastName].filter(Boolean).join(' ').trim();
  return fromParts || String(practitioner?.fullName ?? '').trim();
};

const formatServiceName = (service: any): string =>
  String(service?.name ?? service?.serviceName ?? '').trim();

const collectUniqueIds = (
  entries: AppointmentWaitingListVM[],
  pickId: (entry: AppointmentWaitingListVM) => number | null | undefined
): number[] => {
  const ids = new Set<number>();
  entries.forEach(entry => {
    const id = Number(pickId(entry));
    if (Number.isFinite(id) && id > 0) ids.add(id);
  });
  return Array.from(ids).sort((a, b) => a - b);
};

const EMPTY_WAITING_LIST: AppointmentWaitingListVM[] = [];
const PICKER_MENU_CONTAINER = () => document.body;

const WaitingListPanel = ({ facilityId, departmentId, departmentOptions = [], onBooked }: WaitingListPanelProps) => {
  const dispatch = useAppDispatch();
  const priorityOptions = useEnumOptions('WaitingListPriority');
  const statusOptions = useEnumOptions('WaitingListStatus');

  const [slotsModalEntry, setSlotsModalEntry] = useState<AppointmentWaitingListVM | null>(null);
  const [slotsByEntryId, setSlotsByEntryId] = useState<
    Record<number, WaitingListAvailableSlotsByBookingModeVM>
  >({});
  const [removeTarget, setRemoveTarget] = useState<AppointmentWaitingListVM | null>(null);
  const [removeReason, setRemoveReason] = useState({ reason: '' });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [fullViewOpen, setFullViewOpen] = useState(false);
  const [filterDepartmentId, setFilterDepartmentId] = useState<number | null>(
    departmentId != null && Number(departmentId) > 0 ? Number(departmentId) : null
  );
  const [preferredDateFilter, setPreferredDateFilter] = useState<Date>(startOfToday);
  const userChangedDepartmentFilterRef = useRef(false);
  const [firstSeenAtByEntryId, setFirstSeenAtByEntryId] = useState<Record<number, number>>({});
  const [now, setNow] = useState(() => Date.now());

  const normalizedDepartmentOptions = useMemo(
    () =>
      (departmentOptions ?? [])
        .map((dept: any) => {
          const id = Number(dept?.id);
          if (!Number.isFinite(id) || id <= 0) return null;
          return {
            ...dept,
            id,
            name: String(dept?.name ?? dept?.departmentName ?? `Department #${id}`).trim(),
          };
        })
        .filter(Boolean),
    [departmentOptions]
  );

  const preferredDateFilterKey = useMemo(
    () => preferredDateFilter.toISOString().slice(0, 10),
    [preferredDateFilter]
  );

  useEffect(() => {
    if (userChangedDepartmentFilterRef.current) return;
    if (departmentId != null && Number(departmentId) > 0) {
      setFilterDepartmentId(Number(departmentId));
    }
  }, [departmentId]);

  useEffect(() => {
    setSlotsModalEntry(null);
    setSlotsByEntryId({});
  }, [filterDepartmentId, preferredDateFilterKey]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const queryArgs =
    facilityId != null && filterDepartmentId != null && filterDepartmentId > 0
      ? { facilityId: Number(facilityId), departmentId: filterDepartmentId }
      : skipToken;

  const { data: waitingListData, isFetching, refetch } = useGetAppointmentWaitingListQuery(queryArgs);
  const waitingList = waitingListData ?? EMPTY_WAITING_LIST;

  const isWaitingListQueryActive = queryArgs !== skipToken;

  const safeRefetchWaitingList = useCallback(async () => {
    if (!isWaitingListQueryActive) return;
    try {
      await refetch();
    } catch {
      // Query may not be subscribed yet when department filter was empty.
    }
  }, [isWaitingListQueryActive, refetch]);

  useEffect(() => {
    if (!waitingList.length) return;
    setFirstSeenAtByEntryId(prev => {
      let changed = false;
      const next = { ...prev };
      const ts = Date.now();
      waitingList.forEach(entry => {
        const id = Number(entry.id);
        if (Number.isFinite(id) && id > 0 && next[id] == null) {
          next[id] = ts;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [waitingList]);

  const filteredWaitingList = useMemo(
    () =>
      waitingList.filter(entry =>
        matchesPreferredDateFilter(entry.preferredDate, preferredDateFilter)
      ),
    [waitingList, preferredDateFilter]
  );

  const serviceIds = useMemo(
    () => collectUniqueIds(waitingList, entry => entry.serviceId),
    [waitingList]
  );

  const practitionerIds = useMemo(
    () => collectUniqueIds(waitingList, entry => entry.practitionerId),
    [waitingList]
  );

  const { data: servicesBulk = [] } = useGetServicesBulkByIdsQuery(serviceIds, {
    skip: serviceIds.length === 0,
  });

  const [getPractitionersBulk] = useGetPractitionersBulkMutation();
  const [practitionersBulk, setPractitionersBulk] = useState<any[]>([]);

  const practitionerIdsKey = useMemo(() => practitionerIds.join(','), [practitionerIds]);

  useEffect(() => {
    if (practitionerIds.length === 0) {
      setPractitionersBulk(prev => (prev.length === 0 ? prev : []));
      return;
    }

    let cancelled = false;

    void getPractitionersBulk(practitionerIds)
      .unwrap()
      .then((result: any) => {
        if (!cancelled) {
          setPractitionersBulk(Array.isArray(result) ? result : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPractitionersBulk(prev => (prev.length === 0 ? prev : []));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [getPractitionersBulk, practitionerIdsKey]);

  const serviceNameById = useMemo(() => {
    const m = new Map<number, string>();
    (servicesBulk ?? []).forEach((service: any) => {
      const id = Number(service?.id);
      const name = formatServiceName(service);
      if (Number.isFinite(id) && id > 0 && name) m.set(id, name);
    });
    return m;
  }, [servicesBulk]);

  const practitionerNameById = useMemo(() => {
    const m = new Map<number, string>();
    (practitionersBulk ?? []).forEach((practitioner: any) => {
      const id = Number(practitioner?.id);
      const name = formatPractitionerName(practitioner);
      if (Number.isFinite(id) && id > 0 && name) m.set(id, name);
    });
    return m;
  }, [practitionersBulk]);

  const [fetchSlots, { isFetching: isFetchingSlots }] = useLazyGetAppointmentWaitingListAvailableSlotsQuery();
  const [bookWaitingList, { isLoading: isBooking }] = useBookAppointmentWaitingListMutation();
  const [removeWaitingList, { isLoading: isRemoving }] = useRemoveAppointmentWaitingListMutation();

  const priorityLabelByValue = useMemo(() => {
    const m = new Map<string, string>();
    (priorityOptions ?? []).forEach((opt: any) => {
      const key = String(opt?.value ?? opt?.lovKey ?? '').trim();
      const label = String(opt?.label ?? opt?.lovDisplayVale ?? key).trim();
      if (key) m.set(key.toUpperCase(), label || key);
    });
    return m;
  }, [priorityOptions]);

  const statusLabelByValue = useMemo(() => {
    const m = new Map<string, string>();
    (statusOptions ?? []).forEach((opt: any) => {
      const key = String(opt?.value ?? opt?.lovKey ?? '').trim();
      const label = String(opt?.label ?? opt?.lovDisplayVale ?? key).trim();
      if (key) m.set(key.toUpperCase(), label || key);
    });
    return m;
  }, [statusOptions]);

  const departmentNameById = useMemo(() => {
    const m = new Map<number, string>();
    normalizedDepartmentOptions.forEach((dept: any) => {
      const id = Number(dept?.id);
      const name = String(dept?.name ?? '').trim();
      if (Number.isFinite(id) && id > 0 && name) m.set(id, name);
    });
    return m;
  }, [normalizedDepartmentOptions]);

  const filterRecord = useMemo(
    () => ({
      departmentId: filterDepartmentId,
      preferredDate: preferredDateFilter,
    }),
    [filterDepartmentId, preferredDateFilter]
  );

  const handleFilterRecordChange = useCallback((next: Record<string, unknown>) => {
    if (Object.prototype.hasOwnProperty.call(next, 'departmentId')) {
      userChangedDepartmentFilterRef.current = true;
      const raw = next.departmentId;
      if (raw === null || raw === undefined || raw === '') {
        setFilterDepartmentId(null);
      } else {
        const id = Number(raw);
        setFilterDepartmentId(Number.isFinite(id) && id > 0 ? id : null);
      }
    }

    if (Object.prototype.hasOwnProperty.call(next, 'preferredDate')) {
      const value = next.preferredDate;
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const normalized = new Date(value);
        normalized.setHours(0, 0, 0, 0);
        setPreferredDateFilter(normalized);
      } else if (typeof value === 'string' && value) {
        const dt = new Date(value);
        if (!Number.isNaN(dt.getTime())) {
          dt.setHours(0, 0, 0, 0);
          setPreferredDateFilter(dt);
        }
      }
    }
  }, []);

  const resolvePriorityLabel = (priority: string | null | undefined) => {
    const key = String(priority ?? '').trim().toUpperCase();
    return priorityLabelByValue.get(key) || key || '-';
  };

  const resolveStatusLabel = (status: string | null | undefined) => {
    const key = String(status ?? '').trim().toUpperCase();
    return statusLabelByValue.get(key) || key || '-';
  };

  const resolveServiceName = (entry: AppointmentWaitingListVM) => {
    const id = Number(entry.serviceId);
    if (!Number.isFinite(id) || id <= 0) return '';
    return serviceNameById.get(id) || `Service #${id}`;
  };

  const resolvePractitionerName = (entry: AppointmentWaitingListVM) => {
    const id = Number(entry.practitionerId);
    if (!Number.isFinite(id) || id <= 0) return '';
    return practitionerNameById.get(id) || `Practitioner #${id}`;
  };

  const resolveServiceLine = (entry: AppointmentWaitingListVM) => {
    const dept =
      entry.departmentId != null
        ? departmentNameById.get(Number(entry.departmentId))
        : undefined;
    const service = resolveServiceName(entry);
    if (dept && service) return `${dept} - ${service}`;
    return dept || service || '-';
  };

  const loadAvailableSlots = useCallback(
    async (entry: AppointmentWaitingListVM) => {
      const entryId = Number(entry.id);
      if (!Number.isFinite(entryId) || entryId <= 0) return null;
      try {
        const preferredDate = toApiPreferredDate(entry.preferredDate);
        const slotsByMode = await fetchSlots({ id: entryId, preferredDate }).unwrap();
        setSlotsByEntryId(prev => ({ ...prev, [entryId]: slotsByMode ?? {} }));
        return slotsByMode ?? null;
      } catch (error) {
        dispatch(
          notify({
            msg: extractErrorMessage(error) || 'Failed to load available slots',
            sev: 'warning',
          })
        );
        return null;
      }
    },
    [dispatch, fetchSlots]
  );

  const handleFindSlot = async (entry: AppointmentWaitingListVM) => {
    const id = Number(entry.id);
    if (!Number.isFinite(id) || id <= 0) return;
    setSlotsModalEntry(entry);
    if (!slotsByEntryId[id]) {
      await loadAvailableSlots(entry);
    }
  };

  const handleBookSlots = async (
    entry: AppointmentWaitingListVM,
    slots: WaitingListAvailableSlotVM[]
  ) => {
    const entryId = Number(entry.id);
    const appointmentIds = collectSlotsAppointmentIds(slots);
    if (!Number.isFinite(entryId) || entryId <= 0 || appointmentIds.length === 0) {
      dispatch(notify({ msg: 'Invalid slot selection for booking.', sev: 'warning' }));
      return;
    }
    dispatch(showSystemLoader());
    try {
      await bookWaitingList({
        id: entryId,
        body: { appointmentIds },
      }).unwrap();
      dispatch(notify({ msg: 'Waiting list patient booked successfully.', sev: 'success' }));
      setSlotsModalEntry(null);
      setSlotsByEntryId(prev => {
        const next = { ...prev };
        delete next[entryId];
        return next;
      });
      await safeRefetchWaitingList();
      await onBooked?.();
    } catch (error) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Failed to book waiting list slot',
          sev: 'error',
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleBookFirstAvailable = async (entry: AppointmentWaitingListVM) => {
    const id = Number(entry.id);
    if (!Number.isFinite(id) || id <= 0) return;
    let slotsByMode = slotsByEntryId[id];
    if (!slotsByMode) {
      slotsByMode = (await loadAvailableSlots(entry)) ?? undefined;
    }
    const firstSlot = getFirstAvailableSlot(slotsByMode);
    if (!firstSlot) {
      dispatch(notify({ msg: 'No available slots found for this patient.', sev: 'warning' }));
      return;
    }
    await handleBookSlots(entry, [firstSlot]);
  };

  const handleRemoveConfirm = async () => {
    const reason = String(removeReason.reason ?? '').trim();
    if (!reason) {
      dispatch(notify({ msg: 'Please enter a reason for removal.', sev: 'warning' }));
      return;
    }

    const entryId = Number(removeTarget?.id);
    if (!Number.isFinite(entryId) || entryId <= 0) {
      dispatch(notify({ msg: 'Invalid waiting list entry.', sev: 'warning' }));
      return;
    }

    dispatch(showSystemLoader());
    try {
      await removeWaitingList({ id: entryId, body: { reason } }).unwrap();
      dispatch(notify({ msg: 'Patient removed from waiting list.', sev: 'success' }));
      setRemoveTarget(null);
      setRemoveReason({ reason: '' });
      setSlotsByEntryId(prev => {
        const next = { ...prev };
        delete next[entryId];
        return next;
      });
      await safeRefetchWaitingList();
      await onBooked?.();
    } catch (error) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Failed to remove from waiting list',
          sev: 'error',
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleCloseRemoveModal = () => {
    setRemoveTarget(null);
    setRemoveReason({ reason: '' });
  };

  const handleOpenFullViewForEntry = (entry: AppointmentWaitingListVM) => {
    setFullViewOpen(true);
  };

  const renderCardEntry = (entry: AppointmentWaitingListVM, fullView: boolean) => {
    const entryId = Number(entry.id);
    const buttonSize = fullView ? 'sm' : 'xs';
    const cardClassName = fullView ? 'waiting-list-card waiting-list-card--full' : 'waiting-list-card';
    const isSlotsModalOpen = slotsModalEntry?.id === entryId;

    return (
      <div key={entryId} className={cardClassName}>
        <div className="waiting-list-card__name">
          {entry.patientName || `Patient #${entry.patientId ?? ''}`}
        </div>
        <div className="waiting-list-card__line">{resolveServiceLine(entry)}</div>
        {resolvePractitionerName(entry) ? (
          <div className="waiting-list-card__line">
            <Translate>Practitioner</Translate>: {resolvePractitionerName(entry)}
          </div>
        ) : null}
        <div className="waiting-list-card__line waiting-list-card__line--priority">
          <Translate>Priority</Translate>
          <MyBadgeStatus
            contant={resolvePriorityLabel(entry.priority)}
            color={priorityColor(entry.priority)}
          />
        </div>
        <div className="waiting-list-card__line">
          <Translate>Waiting since</Translate>:{' '}
          {formatWaitingSinceMinutes(entry, firstSeenAtByEntryId, now)}
        </div>
        <div className="waiting-list-card__line">
          <Translate>Status</Translate>: {resolveStatusLabel(entry.status)}
        </div>
        <div className="waiting-list-card__line">
          <Translate>Preferred date</Translate>: {formatPreferredDate(entry.preferredDate)}
        </div>
        <div className="waiting-list-card__line">
          <Translate>Expected duration</Translate>: {entry.expectedDurationMinutes ?? '-'} min
        </div>
        {entry.reason ? (
          <div className="waiting-list-card__line">
            <Translate>Reason</Translate>: {entry.reason}
          </div>
        ) : null}
        {entry.bookedAt ? (
          <div className="waiting-list-card__line">
            <Translate>Booked at</Translate>: {formatBookedAt(entry.bookedAt)}
          </div>
        ) : null}

        <div className="waiting-list-card__actions">
          <MyButton
            size={buttonSize}
            appearance={isSlotsModalOpen ? 'primary' : 'default'}
            onClick={() => void handleFindSlot(entry)}
            disabled={isFetchingSlots && isSlotsModalOpen}
          >
            Find Slot
          </MyButton>
          <MyButton
            size={buttonSize}
            appearance="primary"
            backgroundColor="#16a34a"
            onClick={() => void handleBookFirstAvailable(entry)}
            disabled={isBooking}
            loading={isBooking}
          >
            Book Nearest Appointment
          </MyButton>
          <MyButton
            size={buttonSize}
            appearance="subtle"
            color="#dc2626"
            onClick={() => setRemoveTarget(entry)}
          >
            Remove
          </MyButton>
        </div>
      </div>
    );
  };

  const renderCompactListRow = (
    entry: AppointmentWaitingListVM,
    idx: number,
    total: number
  ) => {
    const entryId = Number(entry.id);
    const patientName = entry.patientName || `Patient #${entry.patientId ?? ''}`;

    return (
      <div
        key={entryId}
        className="waiting-list-panel__row"
        style={{
          borderBottom: idx === total - 1 ? 'none' : '1px solid var(--rs-border-primary)',
        }}
      >
        <span className="waiting-list-panel__row-side">
          {formatPreferredDateShort(entry.preferredDate)}
        </span>
        <div className="waiting-list-panel__row-info">
          <div className="waiting-list-panel__row-name">{patientName}</div>
          <div className="waiting-list-panel__row-meta">
            <span className="waiting-list-panel__row-service">
              {[resolveServiceName(entry), resolvePractitionerName(entry)].filter(Boolean).join(' · ') ||
                resolveServiceLine(entry)}
            </span>
            <MyBadgeStatus
              contant={resolvePriorityLabel(entry.priority)}
              color={priorityColor(entry.priority)}
            />
          </div>
        </div>
        <ArrowRightLineIcon
          className="waiting-list-panel__row-arrow"
          onClick={() => handleOpenFullViewForEntry(entry)}
        />
      </div>
    );
  };

  const renderFilters = (layout: 'compact' | 'full' = 'compact') => (
    <Form
      fluid
      className={
        layout === 'full'
          ? 'waiting-list-full-modal__filters-form'
          : 'waiting-list-panel__filters-form'
      }
    >
      <div
        className={
          layout === 'full'
            ? 'waiting-list-panel__filters waiting-list-panel__filters--full'
            : 'waiting-list-panel__filters waiting-list-panel__filters--compact'
        }
      >
        <MyInput
          fieldType="select"
          fieldName="departmentId"
          fieldLabel="Department"
          record={filterRecord}
          setRecord={handleFilterRecordChange}
          selectData={normalizedDepartmentOptions}
          selectDataLabel="name"
          selectDataValue="id"
          width="100%"
          searchable
          preventOverflow={false}
          menuClassName="waiting-list-picker-popup"
          container={PICKER_MENU_CONTAINER}
        />
        <MyInput
          fieldType="date"
          fieldName="preferredDate"
          fieldLabel="Preferred Date"
          record={filterRecord}
          setRecord={handleFilterRecordChange}
          width="100%"
          preventOverflow={false}
          container={PICKER_MENU_CONTAINER}
        />
      </div>
    </Form>
  );

  const renderListContent = (fullView = false) => {
    if (!filterDepartmentId) {
      return (
        <p className="waiting-list-panel__empty">
          <Translate>Select a department to view the waiting list.</Translate>
        </p>
      );
    }

    if (isFetching) {
      return (
        <div className="waiting-list-panel__empty waiting-list-panel__loading">
          <Loader size="sm" />
          <Translate>Loading...</Translate>
        </div>
      );
    }

    if (filteredWaitingList.length === 0) {
      return (
        <p className="waiting-list-panel__empty">
          {waitingList.length > 0 ? (
            <Translate>No patients match the selected preferred date.</Translate>
          ) : (
            <Translate>No patients on the waiting list.</Translate>
          )}
        </p>
      );
    }

    if (fullView) {
      return filteredWaitingList.map(entry => renderCardEntry(entry, true));
    }

    return filteredWaitingList.map((entry, idx) =>
      renderCompactListRow(entry, idx, filteredWaitingList.length)
    );
  };

  return (
    <>
      <div className="waiting-list-panel">
        <div className="waiting-list-panel__corner-actions">
          <button
            type="button"
            className="waiting-list-panel__corner-btn waiting-list-panel__corner-btn--add"
            onClick={() => setAddModalOpen(true)}
            title="Add to waiting list"
            aria-label="Add to waiting list"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
          <button
            type="button"
            className="waiting-list-panel__corner-btn waiting-list-panel__corner-btn--expand"
            onClick={() => setFullViewOpen(true)}
            title="Open full view"
            aria-label="Open waiting list full view"
          >
            <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />
          </button>
        </div>
        <div className="waiting-list-panel__header">
          <strong>
            {filteredWaitingList.length} <Translate>waiting list</Translate>
          </strong>
        </div>
        <div className="waiting-list-panel__body">
          {!fullViewOpen && renderFilters('compact')}
          {!fullViewOpen && (
            <div className="waiting-list-panel__scroll waiting-list-panel__scroll--list">
              {renderListContent()}
            </div>
          )}
        </div>
      </div>

      <MyModal
        open={fullViewOpen}
        setOpen={setFullViewOpen}
        title="Waiting List"
        size="90vw"
        bodyheight="82vh"
        hideActionBtn
        enforceFocus={false}
        cancelButtonLabel="Close"
        customClassName="waiting-list-full-modal"
        content={
          <div className="waiting-list-full-modal__body">
            <div className="waiting-list-full-modal__toolbar">
              <span className="waiting-list-full-modal__count">
                {filteredWaitingList.length} <Translate>patients</Translate>
              </span>
              <MyButton
                size="sm"
                appearance="subtle"
                prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
                onClick={() => setAddModalOpen(true)}
              >
                Add
              </MyButton>
            </div>
            {renderFilters('full')}
            <div className="waiting-list-full-modal__scroll">{renderListContent(true)}</div>
          </div>
        }
      />

      <WaitingListSlotsModal
        open={Boolean(slotsModalEntry)}
        setOpen={open => {
          if (!open) setSlotsModalEntry(null);
        }}
        entry={slotsModalEntry}
        slotsByMode={
          slotsModalEntry?.id != null
            ? slotsByEntryId[Number(slotsModalEntry.id)] ?? null
            : null
        }
        isLoading={isFetchingSlots}
        isBooking={isBooking}
        onBookSlots={slots => {
          if (!slotsModalEntry) return;
          void handleBookSlots(slotsModalEntry, slots);
        }}
      />

      <AddToWaitingListModal
        open={addModalOpen}
        setOpen={setAddModalOpen}
        facilityId={facilityId}
        departmentId={filterDepartmentId}
        departmentOptions={departmentOptions}
        onCreated={async created => {
          const createdDeptId = Number(created?.departmentId ?? 0);
          if (Number.isFinite(createdDeptId) && createdDeptId > 0) {
            if (filterDepartmentId !== createdDeptId) {
              userChangedDepartmentFilterRef.current = true;
              setFilterDepartmentId(createdDeptId);
            } else {
              await safeRefetchWaitingList();
            }
          } else {
            await safeRefetchWaitingList();
          }
          await onBooked?.();
        }}
      />

      <MyModal
        open={Boolean(removeTarget)}
        setOpen={open => {
          if (!open) handleCloseRemoveModal();
        }}
        title="Remove from Waiting List"
        size="32vw"
        actionButtonLabel="Remove"
        cancelButtonLabel="Cancel"
        actionButtonFunction={() => void handleRemoveConfirm()}
        handleCancelFunction={handleCloseRemoveModal}
        isDisabledActionBtn={isRemoving}
        actionButtonLoading={isRemoving}
        content={
          <Form fluid>
            <p className="waiting-list-panel__empty" style={{ marginBottom: 12 }}>
              <Translate>
                Remove {removeTarget?.patientName ?? 'this patient'} from the waiting list?
              </Translate>
            </p>
            <MyInput
              fieldType="textarea"
              fieldName="reason"
              fieldLabel="Reason"
              record={removeReason}
              setRecord={setRemoveReason}
              width="100%"
              rows={3}
              required
            />
          </Form>
        }
      />
    </>
  );
};

export default WaitingListPanel;
