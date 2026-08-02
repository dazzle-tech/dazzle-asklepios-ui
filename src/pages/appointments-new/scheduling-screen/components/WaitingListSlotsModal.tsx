import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox, Loader } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTab from '@/components/MyTab';
import Translate from '@/components/Translate';
import { useGetServicesBulkByIdsQuery } from '@/services/setup/serviceService';
import { useGetPractitionersBulkMutation } from '@/services/setup/practitioner/PractitionerService';
import type {
  AppointmentWaitingListVM,
  WaitingListAvailableSlotVM,
  WaitingListAvailableSlotsByBookingModeVM,
} from '@/types/model-types-new';
type TabKey = '1' | '2';

type SlotSelectionState = {
  anchor: number | null;
  selected: Set<number>;
};

type WaitingListSlotsModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  entry: AppointmentWaitingListVM | null;
  slotsByMode: WaitingListAvailableSlotsByBookingModeVM | null;
  isLoading: boolean;
  isBooking: boolean;
  onBookSlots: (slots: WaitingListAvailableSlotVM[]) => void | Promise<void>;
};

const EMPTY_SELECTION: SlotSelectionState = { anchor: null, selected: new Set() };

const formatTime = (value: string | null | undefined): string => {
  if (!value) return '--:--';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '--:--';
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatSlotTimeRange = (slot: WaitingListAvailableSlotVM): string => {
  const start = formatTime(slot.startDatetime);
  const end = formatTime(slot.endDatetime);
  if (end === '--:--') return start;
  return `${start} - ${end}`;
};

const parseTime = (value: string | null | undefined): number => {
  if (!value) return Number.NaN;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? Number.NaN : t;
};

const sortSlotsByStart = (slots: WaitingListAvailableSlotVM[]): WaitingListAvailableSlotVM[] =>
  [...slots].sort((a, b) => parseTime(a.startDatetime) - parseTime(b.startDatetime));

const countAvailableSlots = (
  slotsByMode: WaitingListAvailableSlotsByBookingModeVM | null | undefined
): number => (slotsByMode?.SLOT?.length ?? 0) + (slotsByMode?.BUFFER?.length ?? 0);

const areAdjacentInTime = (
  current: WaitingListAvailableSlotVM,
  next: WaitingListAvailableSlotVM
): boolean => {
  const currentEnd = parseTime(current.endDatetime);
  const nextStart = parseTime(next.startDatetime);
  if (!Number.isFinite(currentEnd) || !Number.isFinite(nextStart)) return false;
  return Math.abs(currentEnd - nextStart) <= 60_000;
};

const isIndexRangeTimeSequential = (
  slots: WaitingListAvailableSlotVM[],
  startIdx: number,
  endIdx: number
): boolean => {
  if (startIdx >= endIdx) return true;
  for (let i = startIdx; i < endIdx; i++) {
    if (!areAdjacentInTime(slots[i], slots[i + 1])) return false;
  }
  return true;
};

const buildRangeSelection = (
  slots: WaitingListAvailableSlotVM[],
  anchor: number,
  focus: number
): Set<number> => {
  const start = Math.min(anchor, focus);
  const end = Math.max(anchor, focus);
  if (!isIndexRangeTimeSequential(slots, start, end)) {
    return new Set([focus]);
  }
  const selected = new Set<number>();
  for (let i = start; i <= end; i++) selected.add(i);
  return selected;
};

const updateSlotSelection = (
  prev: SlotSelectionState,
  index: number,
  slots: WaitingListAvailableSlotVM[]
): SlotSelectionState => {
  if (prev.selected.has(index)) {
    if (prev.selected.size <= 1) {
      return EMPTY_SELECTION;
    }
    const min = Math.min(...prev.selected);
    const max = Math.max(...prev.selected);
    if (index !== min && index !== max) {
      return prev;
    }
    const nextSelected = new Set(prev.selected);
    nextSelected.delete(index);
    const nextAnchor = nextSelected.size > 0 ? Math.min(...nextSelected) : null;
    return { anchor: nextAnchor, selected: nextSelected };
  }

  if (prev.anchor == null || prev.selected.size === 0) {
    return { anchor: index, selected: new Set([index]) };
  }

  const selected = buildRangeSelection(slots, prev.anchor, index);
  const anchor = selected.size === 1 ? index : prev.anchor;
  return { anchor, selected };
};

const getSelectedSlots = (
  slots: WaitingListAvailableSlotVM[],
  selectedIndices: Set<number>
): WaitingListAvailableSlotVM[] =>
  Array.from(selectedIndices)
    .sort((a, b) => a - b)
    .map(index => slots[index])
    .filter(Boolean);

const collectSlotIds = (
  slotsByMode: WaitingListAvailableSlotsByBookingModeVM | null | undefined,
  pickId: (slot: WaitingListAvailableSlotVM) => number | null | undefined
): number[] => {
  const ids = new Set<number>();
  const allSlots = [...(slotsByMode?.SLOT ?? []), ...(slotsByMode?.BUFFER ?? [])];
  allSlots.forEach(slot => {
    const id = Number(pickId(slot));
    if (Number.isFinite(id) && id > 0) ids.add(id);
  });
  return Array.from(ids).sort((a, b) => a - b);
};

const formatPractitionerName = (practitioner: any): string => {
  const fromParts = [practitioner?.firstName, practitioner?.lastName].filter(Boolean).join(' ').trim();
  return fromParts || String(practitioner?.fullName ?? '').trim();
};

const formatServiceName = (service: any): string =>
  String(service?.name ?? service?.serviceName ?? '').trim();

type SlotListProps = {
  variant: 'free' | 'buffer';
  slots: WaitingListAvailableSlotVM[];
  selection: SlotSelectionState;
  onToggleSlot: (index: number) => void;
  resolveServiceName: (slot: WaitingListAvailableSlotVM) => string;
  resolvePractitionerName: (slot: WaitingListAvailableSlotVM) => string;
};

const SlotList = ({
  variant,
  slots,
  selection,
  onToggleSlot,
  resolveServiceName,
  resolvePractitionerName,
}: SlotListProps) => {  if (slots.length === 0) {
    return (
      <p className="waiting-list-panel__empty">
        <Translate>No slots in this category.</Translate>
      </p>
    );
  }

  return (
    <>
      <p className="waiting-list-slots-modal__hint">
        <Translate>
          Select sequential slots to book together. Click a start slot, then click another slot to
          fill the range in between.
        </Translate>
      </p>
      <div className="waiting-list-slots-modal__scroll">
        <div className="waiting-list-slots">
          {slots.map((slot, slotIdx) => {
            const isSelected = selection.selected.has(slotIdx);
            const serviceName = resolveServiceName(slot);
            const practitionerName = resolvePractitionerName(slot);
            return (
              <button
                key={`${variant}-${slot.appointmentId ?? slotIdx}`}
                type="button"
                className={[
                  'waiting-list-slot',
                  'waiting-list-slot--selectable',
                  `waiting-list-slot--${variant}`,
                  isSelected ? 'waiting-list-slot--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onToggleSlot(slotIdx)}
              >
                <Checkbox
                  checked={isSelected}
                  className="waiting-list-slot__checkbox"
                  onChange={() => onToggleSlot(slotIdx)}
                  onClick={event => event.stopPropagation()}
                />
                <div className="waiting-list-slot__content">
                  <div className="waiting-list-slot__time">{formatSlotTimeRange(slot)}</div>
                  {serviceName ? (
                    <div className="waiting-list-slot__meta">
                      <Translate>Service</Translate>: {serviceName}
                    </div>
                  ) : null}
                  {practitionerName ? (
                    <div className="waiting-list-slot__meta">
                      <Translate>Practitioner</Translate>: {practitionerName}
                    </div>
                  ) : null}
                  {slot.status ? (
                    <div className="waiting-list-slot__meta">
                      <Translate>Status</Translate>: {slot.status}
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

const WaitingListSlotsModal = ({
  open,
  setOpen,
  entry,
  slotsByMode,
  isLoading,
  isBooking,
  onBookSlots,
}: WaitingListSlotsModalProps) => {
  const patientName = entry?.patientName || `Patient #${entry?.patientId ?? ''}`;
  const slotCount = countAvailableSlots(slotsByMode);
  const wasOpenRef = useRef(false);

  const sortedSlotList = useMemo(
    () => sortSlotsByStart(slotsByMode?.SLOT ?? []),
    [slotsByMode?.SLOT]
  );
  const sortedBufferList = useMemo(
    () => sortSlotsByStart(slotsByMode?.BUFFER ?? []),
    [slotsByMode?.BUFFER]
  );

  const slotServiceIds = useMemo(
    () => collectSlotIds(slotsByMode, slot => slot.serviceId),
    [slotsByMode]
  );

  const slotPractitionerIds = useMemo(
    () => collectSlotIds(slotsByMode, slot => slot.practitionerId),
    [slotsByMode]
  );

  const { data: servicesBulk = [] } = useGetServicesBulkByIdsQuery(slotServiceIds, {
    skip: slotServiceIds.length === 0,
  });

  const [getPractitionersBulk] = useGetPractitionersBulkMutation();
  const [practitionersBulk, setPractitionersBulk] = useState<any[]>([]);
  const practitionerIdsKey = useMemo(() => slotPractitionerIds.join(','), [slotPractitionerIds]);

  useEffect(() => {
    if (slotPractitionerIds.length === 0) {
      setPractitionersBulk(prev => (prev.length === 0 ? prev : []));
      return;
    }

    let cancelled = false;

    void getPractitionersBulk(slotPractitionerIds)
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

  const resolveSlotServiceName = useCallback(
    (slot: WaitingListAvailableSlotVM) => {
      const id = Number(slot.serviceId);
      if (!Number.isFinite(id) || id <= 0) return '';
      return serviceNameById.get(id) || `Service #${id}`;
    },
    [serviceNameById]
  );

  const resolveSlotPractitionerName = useCallback(
    (slot: WaitingListAvailableSlotVM) => {
      const id = Number(slot.practitionerId);
      if (!Number.isFinite(id) || id <= 0) return '';
      return practitionerNameById.get(id) || `Practitioner #${id}`;
    },
    [practitionerNameById]
  );

  const [activeTab, setActiveTab] = useState<TabKey>('1');
  const [selectionByTab, setSelectionByTab] = useState<Record<TabKey, SlotSelectionState>>({
    '1': EMPTY_SELECTION,
    '2': EMPTY_SELECTION,
  });

  const activeSlots = activeTab === '1' ? sortedSlotList : sortedBufferList;
  const activeSelection = selectionByTab[activeTab];
  const selectedSlots = useMemo(
    () => getSelectedSlots(activeSlots, activeSelection.selected),
    [activeSlots, activeSelection.selected]
  );

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      setActiveTab('1');
      setSelectionByTab({ '1': EMPTY_SELECTION, '2': EMPTY_SELECTION });
      return;
    }

    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;

    if (justOpened || slotCount > 0) {
      if (sortedSlotList.length > 0) {
        setActiveTab('1');
      } else if (sortedBufferList.length > 0) {
        setActiveTab('2');
      }
    }

    if (justOpened) {
      setSelectionByTab({ '1': EMPTY_SELECTION, '2': EMPTY_SELECTION });
    }
  }, [open, slotCount, sortedSlotList.length, sortedBufferList.length]);

  const handleBookSelected = () => {
    if (selectedSlots.length === 0) return;
    if (!isIndexRangeTimeSequential(activeSlots, Math.min(...activeSelection.selected), Math.max(...activeSelection.selected))) {
      return;
    }
    void onBookSlots(selectedSlots);
  };

  const slotTabTitle =
    sortedSlotList.length > 0 ? `Slot (${sortedSlotList.length})` : 'Slot';
  const bufferTabTitle =
    sortedBufferList.length > 0 ? `Buffer (${sortedBufferList.length})` : 'Buffer';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        <>
          <Translate>Available slots</Translate> — {patientName}
        </>
      }
      size="52vw"
      bodyheight="72vh"
      hideActionBtn
      enforceFocus={false}
      cancelButtonLabel="Close"
      customClassName="waiting-list-slots-modal sub-child-right-modal"
      content={
        <div className="waiting-list-slots-modal__body">
          {isLoading && slotCount === 0 ? (
            <div className="waiting-list-panel__empty waiting-list-panel__loading">
              <Loader size="sm" />
              <Translate>Loading slots...</Translate>
            </div>
          ) : slotCount === 0 ? (
            <p className="waiting-list-panel__empty">
              <Translate>No suggested slots available.</Translate>
            </p>
          ) : (
            <>
              <div className="waiting-list-slots-modal__tabs">
                <MyTab
                  appearance="subtle"
                  activeTab={activeTab}
                  setActiveTab={key => setActiveTab(key as TabKey)}
                  className="waiting-list-slots-modal__tab-panel"
                  lazy
                  data={[
                    {
                      title: slotTabTitle,
                      content: (
                        <SlotList
                          variant="free"
                          slots={sortedSlotList}
                          selection={selectionByTab['1']}
                          resolveServiceName={resolveSlotServiceName}
                          resolvePractitionerName={resolveSlotPractitionerName}
                          onToggleSlot={index =>
                            setSelectionByTab(prev => ({
                              ...prev,
                              '1': updateSlotSelection(prev['1'], index, sortedSlotList),
                            }))
                          }
                        />
                      ),
                      disabled: sortedSlotList.length === 0,
                    },
                    {
                      title: bufferTabTitle,
                      content: (
                        <SlotList
                          variant="buffer"
                          slots={sortedBufferList}
                          selection={selectionByTab['2']}
                          resolveServiceName={resolveSlotServiceName}
                          resolvePractitionerName={resolveSlotPractitionerName}
                          onToggleSlot={index =>
                            setSelectionByTab(prev => ({
                              ...prev,
                              '2': updateSlotSelection(prev['2'], index, sortedBufferList),
                            }))
                          }
                        />
                      ),
                      disabled: sortedBufferList.length === 0,
                    },
                  ]}
                />
              </div>

              <div className="waiting-list-slots-modal__footer">
                <span className="waiting-list-slots-modal__selection-summary">
                  {selectedSlots.length > 0 ? (
                    <>
                      <Translate>Selected</Translate>: {selectedSlots.length}{' '}
                      <Translate>{selectedSlots.length === 1 ? 'slot' : 'slots'}</Translate>
                      {' — '}
                      {formatSlotTimeRange(selectedSlots[0])}
                      {selectedSlots.length > 1
                        ? ` → ${formatTime(selectedSlots[selectedSlots.length - 1].endDatetime)}`
                        : ''}
                    </>
                  ) : (
                    <Translate>No slots selected</Translate>
                  )}
                </span>
                <MyButton
                  size="sm"
                  appearance="primary"
                  onClick={handleBookSelected}
                  disabled={isBooking || selectedSlots.length === 0}
                  loading={isBooking}
                >
                  <Translate>Book selected</Translate>
                </MyButton>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};

export default WaitingListSlotsModal;
