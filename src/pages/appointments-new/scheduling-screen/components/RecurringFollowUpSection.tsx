import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import {
  RecurringAppointmentPreview,
  usePreviewRecurringAppointmentRequestsMutation
} from '@/services/appointment/appointmentRequestService';
import { DAYS } from '@/utils/dayMapping';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Form, Modal } from 'rsuite';

const CUSTOM_DAY_TO_JS: Record<string, number> = {
  '0': 6,
  '1': 0,
  '2': 1,
  '3': 2,
  '4': 3,
  '5': 4,
  '6': 5
};

const MAX_WEEKS = 52;
const MAX_MONTHS = 24;

export type RecurringSlotChoice = {
  id: string;
  dateKey: string;
  startIso: string;
  endIso: string | null;
  dateLabel: string;
  timeLabel: string;
};

export type RecurringMappingRow = {
  id: string;
  dateKey: string;
  dateLabel: string;
  dayLabel: string;
  slot: RecurringSlotChoice | null;
};

export type RecurringFollowUpConfig = {
  daysOfWeek: string[];
  startDate: string | null;
  period: number;
  periodUnit: 'WEEK' | 'MONTH';
};

type Props = {
  disabled?: boolean;
  facilityId: number | null;
  departmentId: number | null;
  resourceType: string | null;
  resourceId: number | null;
  patientId: number | null;
  sourceEncounterId: number | null;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  rows: RecurringMappingRow[];
  onRowsChange: (rows: RecurringMappingRow[]) => void;
  onConfigChange: (config: RecurringFollowUpConfig) => void;
  resetKey?: number;
};

type SkippedDay = { dateKey: string; dateLabel: string };

type UnavailableSlot = {
  id: string;
  rowId: string;
  dateKey: string;
  dateLabel: string;
  dayLabel: string;
  timeLabel: string | null;
  reason: string;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toDateKey = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const formatDateLabel = (date: Date) =>
  date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

const formatDayLabel = (date: Date) => date.toLocaleDateString(undefined, { weekday: 'long' });

const formatTimeLabel = (start: Date, end: Date | null) => {
  const startText = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (!end || Number.isNaN(end.getTime())) return startText;
  const endText = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${startText} - ${endText}`;
};

const parseDateOnly = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return startOfDay(value);
  }
  const text = String(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return startOfDay(parsed);
};

const toSlotChoiceFromPreview = (
  slot: RecurringAppointmentPreview['availableSlots'][number]
): RecurringSlotChoice | null => {
  if (slot?.appointmentId == null || !slot.startDatetime) return null;
  const start = new Date(slot.startDatetime);
  if (Number.isNaN(start.getTime())) return null;
  const end = slot.endDatetime ? new Date(slot.endDatetime) : null;
  const date = parseDateOnly(slot.date) ?? startOfDay(start);
  return {
    id: String(slot.appointmentId),
    dateKey: toDateKey(date),
    startIso: start.toISOString(),
    endIso: end && !Number.isNaN(end.getTime()) ? end.toISOString() : null,
    dateLabel: formatDateLabel(date),
    timeLabel: formatTimeLabel(start, end && !Number.isNaN(end.getTime()) ? end : null)
  };
};

const RecurringFollowUpSection = ({
  disabled = false,
  facilityId,
  departmentId,
  resourceType,
  resourceId,
  patientId,
  sourceEncounterId,
  enabled,
  onEnabledChange,
  rows,
  onRowsChange,
  onConfigChange,
  resetKey = 0
}: Props) => {
  const dispatch = useAppDispatch();
  const [previewRecurring] = usePreviewRecurringAppointmentRequestsMutation();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [form, setForm] = useState<{ startDate: string | null; period: number; unit: 'week' | 'month' }>({
    startDate: null,
    period: 1,
    unit: 'week'
  });
  const [skipped, setSkipped] = useState<SkippedDay[]>([]);
  const [unavailable, setUnavailable] = useState<UnavailableSlot[]>([]);
  const [slotPool, setSlotPool] = useState<RecurringSlotChoice[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [unavailableOpen, setUnavailableOpen] = useState(false);
  const [alertItemId, setAlertItemId] = useState<string | null>(null);
  const [upcomingDateKey, setUpcomingDateKey] = useState<string | null>(null);
  const [changeRowId, setChangeRowId] = useState<string | null>(null);
  const [pickerDateKey, setPickerDateKey] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDays([]);
    setForm({ startDate: null, period: 1, unit: 'week' });
    setSkipped([]);
    setUnavailable([]);
    setSlotPool([]);
    setHasGenerated(false);
    setUnavailableOpen(false);
    setAlertItemId(null);
    setUpcomingDateKey(null);
    setChangeRowId(null);
  }, [resetKey]);

  useEffect(() => {
    const start = parseDateOnly(form.startDate);
    onConfigChange({
      daysOfWeek: selectedDays
        .map(value => DAYS.find(day => day.value === value)?.label.toUpperCase())
        .filter((day): day is string => Boolean(day)),
      startDate: start ? toDateKey(start) : null,
      period: Math.floor(Number(form.period)),
      periodUnit: form.unit === 'month' ? 'MONTH' : 'WEEK'
    });
  }, [form, onConfigChange, selectedDays]);

  const clearMapping = () => {
    onRowsChange([]);
    setSkipped([]);
    setUnavailable([]);
    setSlotPool([]);
    setHasGenerated(false);
    setUnavailableOpen(false);
    setAlertItemId(null);
    setUpcomingDateKey(null);
    setChangeRowId(null);
  };

  const selectedDayLabels = DAYS.filter(day => selectedDays.includes(day.value)).map(day => day.label);

  const readyCount = rows.filter(row => row.slot).length;

  const unresolvedCount = useMemo(() => {
    const unresolved = unavailable.filter(item => !rows.some(row => row.id === item.rowId && row.slot));
    return new Set(unresolved.map(item => item.rowId)).size;
  }, [unavailable, rows]);

  const selectedUnavailable = unavailable.find(item => item.id === alertItemId) ?? null;

  const upcomingSlots = useMemo(() => {
    if (!selectedUnavailable) return [];
    const todayKey = toDateKey(startOfDay(new Date()));
    const usedIds = new Set(
      rows.filter(row => row.id !== selectedUnavailable.rowId && row.slot).map(row => row.slot!.id)
    );
    const usedDates = new Set(
      rows.filter(row => row.id !== selectedUnavailable.rowId && row.slot).map(row => row.dateKey)
    );
    return slotPool.filter(
      slot => slot.dateKey >= todayKey && !usedIds.has(slot.id) && !usedDates.has(slot.dateKey)
    );
  }, [rows, selectedUnavailable, slotPool]);

  const upcomingDates = useMemo(() => {
    const seen = new Set<string>();
    return upcomingSlots.filter(slot => {
      if (seen.has(slot.dateKey)) return false;
      seen.add(slot.dateKey);
      return true;
    });
  }, [upcomingSlots]);

  const activeUpcomingDateKey =
    upcomingDateKey && upcomingDates.some(slot => slot.dateKey === upcomingDateKey)
      ? upcomingDateKey
      : upcomingDates[0]?.dateKey ?? null;

  const upcomingTimes = upcomingSlots.filter(slot => slot.dateKey === activeUpcomingDateKey);

  const selectUnavailable = (item: UnavailableSlot) => {
    setAlertItemId(item.id);
    const replacement = rows.find(row => row.id === item.rowId && row.slot);
    const todayKey = toDateKey(startOfDay(new Date()));
    const usedIds = new Set(rows.filter(row => row.id !== item.rowId && row.slot).map(row => row.slot!.id));
    const usedDates = new Set(rows.filter(row => row.id !== item.rowId && row.slot).map(row => row.dateKey));
    const pool = slotPool.filter(
      slot => slot.dateKey >= todayKey && !usedIds.has(slot.id) && !usedDates.has(slot.dateKey)
    );
    const preferred =
      replacement?.dateKey && pool.some(slot => slot.dateKey === replacement.dateKey)
        ? replacement.dateKey
        : pool[0]?.dateKey ?? null;
    setUpcomingDateKey(preferred);
  };

  const assignUpcomingSlot = (item: UnavailableSlot, slot: RecurringSlotChoice) => {
    const date = parseDateOnly(slot.dateKey);
    const nextRow: RecurringMappingRow = {
      id: item.rowId,
      dateKey: slot.dateKey,
      dateLabel: slot.dateLabel,
      dayLabel: date ? formatDayLabel(date) : item.dayLabel,
      slot
    };
    const exists = rows.some(row => row.id === item.rowId);
    onRowsChange(exists ? rows.map(row => (row.id === item.rowId ? nextRow : row)) : [...rows, nextRow]);
  };

  const changeRow = rows.find(row => row.id === changeRowId) ?? null;

  const eligibleSlots = useMemo(() => {
    if (!changeRow) return [];
    const usedIds = new Set(rows.filter(row => row.id !== changeRow.id && row.slot).map(row => row.slot!.id));
    return slotPool.filter(slot => !usedIds.has(slot.id));
  }, [changeRow, rows, slotPool]);

  const pickerDates = useMemo(() => {
    const seen = new Set<string>();
    return eligibleSlots.filter(slot => {
      if (seen.has(slot.dateKey)) return false;
      seen.add(slot.dateKey);
      return true;
    });
  }, [eligibleSlots]);

  const pickerSlots = eligibleSlots.filter(slot => slot.dateKey === pickerDateKey);

  const openSlotPicker = (row: RecurringMappingRow) => {
    const usedIds = new Set(rows.filter(item => item.id !== row.id && item.slot).map(item => item.slot!.id));
    const available = slotPool.filter(slot => !usedIds.has(slot.id));
    const preferred = available.some(slot => slot.dateKey === row.dateKey)
      ? row.dateKey
      : available[0]?.dateKey ?? null;
    setPickerDateKey(preferred);
    setChangeRowId(row.id);
  };

  const applySlot = (slot: RecurringSlotChoice) => {
    if (!changeRowId) return;
    const date = parseDateOnly(slot.dateKey);
    onRowsChange(
      rows.map(row =>
        row.id === changeRowId
          ? {
              ...row,
              dateKey: slot.dateKey,
              dateLabel: slot.dateLabel,
              dayLabel: date ? formatDayLabel(date) : row.dayLabel,
              slot
            }
          : row
      )
    );
    setChangeRowId(null);
  };

  const handleGenerate = async () => {
    if (!enabled || disabled) return;

    const jsDays = selectedDays
      .map(day => CUSTOM_DAY_TO_JS[day])
      .filter(day => typeof day === 'number');
    const start = parseDateOnly(form.startDate);
    const period = Math.floor(Number(form.period));
    const today = startOfDay(new Date());

    if (jsDays.length === 0) {
      dispatch(notify({ msg: 'Select at least one day of the week.', sev: 'warning' }));
      return;
    }
    if (!start) {
      dispatch(notify({ msg: 'Select a start date.', sev: 'warning' }));
      return;
    }
    if (start < today) {
      dispatch(notify({ msg: 'Start date cannot be in the past.', sev: 'warning' }));
      return;
    }
    if (!Number.isFinite(period) || period < 1) {
      dispatch(notify({ msg: 'Enter a period of at least 1.', sev: 'warning' }));
      return;
    }
    if (form.unit === 'week' && period > MAX_WEEKS) {
      dispatch(notify({ msg: `Period cannot be more than ${MAX_WEEKS} weeks.`, sev: 'warning' }));
      return;
    }
    if (form.unit === 'month' && period > MAX_MONTHS) {
      dispatch(notify({ msg: `Period cannot be more than ${MAX_MONTHS} months.`, sev: 'warning' }));
      return;
    }
    if (!facilityId || !departmentId || !resourceId || !resourceType) {
      dispatch(notify({ msg: 'Facility, resource type, and resource are required before generating.', sev: 'warning' }));
      return;
    }
    if (!patientId) {
      dispatch(notify({ msg: 'Select a patient before generating recurring appointments.', sev: 'warning' }));
      return;
    }
    if (!sourceEncounterId) {
      dispatch(notify({ msg: 'Source encounter is required to generate recurring appointments.', sev: 'warning' }));
      return;
    }

    const daysOfWeek = selectedDays
      .map(value => DAYS.find(day => day.value === value)?.label.toUpperCase())
      .filter((day): day is string => Boolean(day));

    setIsGenerating(true);
    try {
      const preview = await previewRecurring({
        patientId,
        facilityId,
        departmentId,
        sourceEncounterId,
        requestedResourceType: resourceType,
        requestedResourceId: resourceId,
        priority: 'NORMAL',
        daysOfWeek,
        startDate: toDateKey(start),
        period,
        periodUnit: form.unit === 'month' ? 'MONTH' : 'WEEK'
      }).unwrap();

      const slots = (preview?.availableSlots ?? [])
        .map(toSlotChoiceFromPreview)
        .filter((slot): slot is RecurringSlotChoice => Boolean(slot))
        .sort((a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime());
      const slotsById = new Map(slots.map(slot => [slot.id, slot]));

      const nextRows: RecurringMappingRow[] = (preview?.days ?? []).map(day => {
        const date = parseDateOnly(day.date);
        const dateKey = date ? toDateKey(date) : String(day.date);
        const slot = day.appointmentId != null ? slotsById.get(String(day.appointmentId)) ?? null : null;
        return {
          id: dateKey,
          dateKey,
          dateLabel: date ? formatDateLabel(date) : String(day.date),
          dayLabel: date ? formatDayLabel(date) : String(day.dayOfWeek ?? ''),
          slot
        };
      });
      const nextSkipped: SkippedDay[] = (preview?.skippedDays ?? []).map(day => {
        const date = parseDateOnly(day.date);
        return {
          dateKey: date ? toDateKey(date) : String(day.date),
          dateLabel: date ? formatDateLabel(date) : String(day.date)
        };
      });

      const timeLabelFrom = (startIso?: string | null, endIso?: string | null) => {
        if (!startIso) return null;
        const start = new Date(startIso);
        if (Number.isNaN(start.getTime())) return null;
        const end = endIso ? new Date(endIso) : null;
        return formatTimeLabel(start, end && !Number.isNaN(end.getTime()) ? end : null);
      };

      const nextUnavailable: UnavailableSlot[] = [];
      const coveredDates = new Set<string>();
      (preview?.unavailableSlots ?? []).forEach((slot, index) => {
        const date = parseDateOnly(slot.date);
        const dateKey = date ? toDateKey(date) : String(slot.date);
        coveredDates.add(dateKey);
        nextUnavailable.push({
          id: `${dateKey}-${index}`,
          rowId: `replacement-${dateKey}`,
          dateKey,
          dateLabel: date ? formatDateLabel(date) : String(slot.date),
          dayLabel: date ? formatDayLabel(date) : String(slot.dayOfWeek ?? ''),
          timeLabel: timeLabelFrom(slot.startDatetime, slot.endDatetime),
          reason: slot.reason || 'Appointment already exists on this day'
        });
      });
      (preview?.skippedDays ?? []).forEach(day => {
        const date = parseDateOnly(day.date);
        const dateKey = date ? toDateKey(date) : String(day.date);
        if (coveredDates.has(dateKey)) return;
        coveredDates.add(dateKey);
        nextUnavailable.push({
          id: dateKey,
          rowId: `replacement-${dateKey}`,
          dateKey,
          dateLabel: date ? formatDateLabel(date) : String(day.date),
          dayLabel: date ? formatDayLabel(date) : String(day.dayOfWeek ?? ''),
          timeLabel: null,
          reason: day.reason || 'Appointment already exists on this day'
        });
      });
      nextRows.forEach(row => {
        if (row.slot) return;
        nextUnavailable.push({
          id: `empty-${row.id}`,
          rowId: row.id,
          dateKey: row.dateKey,
          dateLabel: row.dateLabel,
          dayLabel: row.dayLabel,
          timeLabel: null,
          reason: 'No open slot on this day'
        });
      });

      setSkipped(nextSkipped);
      setUnavailable(nextUnavailable);
      setAlertItemId(nextUnavailable[0]?.id ?? null);
      setHasGenerated(true);
      setSlotPool(slots);
      onRowsChange(nextRows);

      if (nextRows.length === 0) {
        dispatch(
          notify({
            msg: 'Every generated day already has an appointment, so nothing was added.',
            sev: 'warning'
          })
        );
        return;
      }

      const withSlot = nextRows.filter(row => row.slot).length;
      dispatch(
        notify({
          msg: `Generated ${nextRows.length} day(s). ${withSlot} have an available slot.`,
          sev: 'success'
        })
      );
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.data?.detail ||
        'Failed to check appointments and available slots.';
      dispatch(notify({ msg: message, sev: 'warning' }));
    } finally {
      setIsGenerating(false);
    }
  };

  const skippedPreview = skipped.slice(0, 8).map(day => day.dateLabel).join(', ');
  const skippedRemainder = skipped.length > 8 ? ` and ${skipped.length - 8} more` : '';
  const startDateLabel = (() => {
    const start = parseDateOnly(form.startDate);
    return start ? formatDateLabel(start) : '';
  })();
  const periodCount = Math.floor(Number(form.period));
  const periodLabel = `${Number.isFinite(periodCount) ? periodCount : form.period} ${
    form.unit === 'month' ? 'month' : 'week'
  }${periodCount === 1 ? '' : 's'}`;

  return (
    <SectionContainer
      title="Recurring Appointment"
      content={
        <div className="recurring-followup">
          <Checkbox
            checked={enabled}
            disabled={disabled}
            onChange={(_, checked) => {
              onEnabledChange(Boolean(checked));
              clearMapping();
            }}
          >
            Create a recurring follow-up
          </Checkbox>

          {enabled && (
            <>
              <div>
                <p className="recurring-followup-label">Days of week</p>
                <div className="recurring-followup-days">
                  {DAYS.map(day => (
                    <Checkbox
                      key={day.value}
                      checked={selectedDays.includes(day.value)}
                      disabled={disabled}
                      onChange={(_, checked) => {
                        setSelectedDays(current =>
                          checked ? [...current, day.value] : current.filter(value => value !== day.value)
                        );
                        clearMapping();
                      }}
                    >
                      {day.label}
                    </Checkbox>
                  ))}
                </div>
              </div>

              <Form fluid>
                <div className="recurring-followup-fields">
                  <MyInput
                    column
                    width="12vw"
                    fieldLabel="Start date"
                    fieldType="date"
                    fieldName="startDate"
                    record={form}
                    setRecord={(next: any) => {
                      setForm(next);
                      clearMapping();
                    }}
                    disabled={disabled}
                    disablePastDates
                    cleanable={false}
                  />
                  <MyInput
                    column
                    width="8vw"
                    fieldLabel="Period"
                    fieldType="number"
                    fieldName="period"
                    record={form}
                    setRecord={(next: any) => {
                      setForm(next);
                      clearMapping();
                    }}
                    min={1}
                    disabled={disabled}
                  />
                  <MyInput
                    column
                    width="10vw"
                    fieldLabel="Unit"
                    fieldType="select"
                    fieldName="unit"
                    selectData={[
                      { label: 'Week', value: 'week' },
                      { label: 'Month', value: 'month' }
                    ]}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={form}
                    setRecord={(next: any) => {
                      setForm(next);
                      clearMapping();
                    }}
                    searchable={false}
                    disabled={disabled}
                  />
                  <div className="recurring-followup-generate">
                    <MyButton appearance="ghost" loading={isGenerating} disabled={disabled} onClick={() => void handleGenerate()}>
                      Generate
                    </MyButton>
                    <div className="recurring-followup-alert">
                      <MyButton
                        appearance="ghost"
                        color="#c2410c"
                        disabled={disabled}
                        onClick={() => {
                          if (!hasGenerated) {
                            dispatch(notify({ msg: 'Generate the series first to see unavailable slots.', sev: 'warning' }));
                            return;
                          }
                          const first = unavailable.find(item => item.id === alertItemId) ?? unavailable[0];
                          if (first) selectUnavailable(first);
                          setUnavailableOpen(true);
                        }}
                      >
                        Unavailable
                      </MyButton>
                      {hasGenerated && unresolvedCount > 0 && (
                        <span className="recurring-followup-alert-count">{unresolvedCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Form>

              <p className="recurring-followup-hint">
                Included days have no existing appointment. Save sends a request for each day that has an available slot.
              </p>

              {rows.length > 0 && (
                <div className="recurring-followup-summary">
                  <p className="recurring-followup-summary-title">
                    {selectedDayLabels.join(', ') || 'Selected days'} · {periodLabel}
                    {startDateLabel ? ` from ${startDateLabel}` : ''}
                  </p>
                  <p className="recurring-followup-summary-meta">
                    {rows.length} day(s) with no appointment · {readyCount} with an available slot
                  </p>
                  <div className="recurring-followup-list">
                    {rows.map(row => (
                      <div key={row.id} className="recurring-followup-row">
                        <div>
                          <div className="recurring-followup-row-date">
                            {row.dayLabel}, {row.dateLabel}
                          </div>
                          <div className={row.slot ? 'recurring-followup-row-slot' : 'recurring-followup-row-empty'}>
                            {row.slot ? row.slot.timeLabel : 'No available slot'}
                          </div>
                        </div>
                        <MyButton
                          appearance="ghost"
                          size="xs"
                          disabled={disabled || slotPool.length === 0}
                          onClick={() => openSlotPicker(row)}
                        >
                          {row.slot ? 'Change' : 'Choose slot'}
                        </MyButton>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {skipped.length > 0 && (
                <p className="recurring-followup-skipped">
                  {skipped.length} day(s) already have an appointment and were left out: {skippedPreview}
                  {skippedRemainder}.
                </p>
              )}
            </>
          )}

          <Modal open={unavailableOpen} onClose={() => setUnavailableOpen(false)} size="md">
            <Modal.Header>
              <Modal.Title>Unavailable slots</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="recurring-followup-hint">
                These days cannot use their original slot. Select one, choose a day that has an available slot, then pick a time.
              </p>
              {unavailable.length === 0 ? (
                <p className="recurring-followup-row-empty">Every generated day has an available slot.</p>
              ) : (
                <div className="recurring-followup-unavailable">
                  <div className="recurring-followup-slot-list">
                    {unavailable.map(item => {
                      const replacement = rows.find(row => row.id === item.rowId && row.slot);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={
                            item.id === alertItemId
                              ? 'recurring-followup-slot-option selected'
                              : 'recurring-followup-slot-option'
                          }
                          onClick={() => selectUnavailable(item)}
                        >
                          <div className="recurring-followup-row-date">
                            {item.dayLabel}, {item.dateLabel}
                            {item.timeLabel ? ` · ${item.timeLabel}` : ''}
                          </div>
                          <div className="recurring-followup-row-empty">{item.reason}</div>
                          {replacement?.slot && (
                            <div className="recurring-followup-row-slot">
                              Upcoming slot: {replacement.dayLabel}, {replacement.dateLabel} · {replacement.slot.timeLabel}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <p className="recurring-followup-summary-title">Upcoming available slots</p>
                    {upcomingDates.length === 0 ? (
                      <p className="recurring-followup-row-empty">No upcoming open slot for this configuration.</p>
                    ) : (
                      <>
                        <Form fluid>
                          <MyInput
                            column
                            width="100%"
                            fieldLabel="Date"
                            fieldType="select"
                            fieldName="dateKey"
                            selectData={upcomingDates.map(slot => {
                              const date = parseDateOnly(slot.dateKey);
                              return {
                                label: date ? `${formatDayLabel(date)}, ${slot.dateLabel}` : slot.dateLabel,
                                value: slot.dateKey
                              };
                            })}
                            selectDataLabel="label"
                            selectDataValue="value"
                            record={{ dateKey: activeUpcomingDateKey }}
                            setRecord={(next: any) => setUpcomingDateKey(next?.dateKey ?? null)}
                            searchable
                          />
                        </Form>
                        <div className="recurring-followup-slot-list">
                          {upcomingTimes.length === 0 ? (
                            <p className="recurring-followup-row-empty">No open slot on this date.</p>
                          ) : (
                            upcomingTimes.map(slot => {
                              const assigned =
                                selectedUnavailable != null &&
                                rows.some(row => row.id === selectedUnavailable.rowId && row.slot?.id === slot.id);
                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  className={
                                    assigned
                                      ? 'recurring-followup-slot-option selected'
                                      : 'recurring-followup-slot-option'
                                  }
                                  disabled={!selectedUnavailable}
                                  onClick={() => selectedUnavailable && assignUpcomingSlot(selectedUnavailable, slot)}
                                >
                                  {slot.timeLabel}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <MyButton appearance="ghost" onClick={() => setUnavailableOpen(false)}>
                Close
              </MyButton>
            </Modal.Footer>
          </Modal>

          <Modal open={Boolean(changeRow)} onClose={() => setChangeRowId(null)} size="sm">
            <Modal.Header>
              <Modal.Title>Available slots</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="recurring-followup-hint">
                Slots use the same facility, department, and resource. Pick one to replace this day.
              </p>
              {pickerDates.length === 0 ? (
                <p className="recurring-followup-row-empty">No available slots for this configuration.</p>
              ) : (
                <>
                  <Form fluid>
                    <MyInput
                      column
                      width="100%"
                      fieldLabel="Date"
                      fieldType="select"
                      fieldName="dateKey"
                      selectData={pickerDates.map(slot => {
                        const date = parseDateOnly(slot.dateKey);
                        return {
                          label: date ? `${formatDayLabel(date)}, ${slot.dateLabel}` : slot.dateLabel,
                          value: slot.dateKey
                        };
                      })}
                      selectDataLabel="label"
                      selectDataValue="value"
                      record={{ dateKey: pickerDateKey }}
                      setRecord={(next: any) => setPickerDateKey(next?.dateKey ?? null)}
                      searchable
                    />
                  </Form>
                  <div className="recurring-followup-slot-list">
                    {pickerSlots.length === 0 ? (
                      <p className="recurring-followup-row-empty">No open slot on this date.</p>
                    ) : (
                      pickerSlots.map(slot => (
                        <button
                          key={slot.id}
                          type="button"
                          className={
                            changeRow?.slot?.id === slot.id
                              ? 'recurring-followup-slot-option selected'
                              : 'recurring-followup-slot-option'
                          }
                          onClick={() => applySlot(slot)}
                        >
                          {slot.timeLabel}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </Modal.Body>
          </Modal>
        </div>
      }
    />
  );
};

export default RecurringFollowUpSection;
