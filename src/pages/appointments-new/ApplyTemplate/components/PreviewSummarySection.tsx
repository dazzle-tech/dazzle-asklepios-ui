import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { TimerReset } from "lucide-react";
import { useLazyGetAvailabilityTemplateIntervalsByTemplateAndDayQuery } from "@/services/appointment/availabilityTemplate/availabilityTemplateInterval";
import {
  useLazyGetAvailabilityTemplateIntervalBreaksByIntervalQuery,
} from "@/services/appointment/availabilityTemplate/availabilityTemplateIntervalBreak";
import { useGetAvailabilityTemplateQuery } from "@/services/appointment/availabilityTemplateService";
import type {
  AvailabilityGenerationBatchApplyDTO,
  AvailabilityTemplateIntervalBreakResponseVM,
  AvailabilityTemplateIntervalResponseVM,
} from "@/types/model-types-new";
import { useGetActiveHolidaysInRangeQuery } from "@/services/system-configurations/organizationHolidaysService";
import { useAppSelector } from "@/hooks";
import { MiniStat } from "./shared";
import { formatLocalDateForApi, parseApplyTemplateDateTime } from "../applyTemplateDateUtils";

type Props = {
  templateId?: number | null;
  templateDurationMinutes?: number | null;
  dto?: AvailabilityGenerationBatchApplyDTO;
  holidayDates?: string[];
};

function toDateOnly(input: unknown): Date | null {
  const d = parseApplyTemplateDateTime(input);
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDaysLabel(days: number): string {
  if (!Number.isFinite(days) || days <= 0) return "-";
  return days === 1 ? "1 day" : `${days} days`;
}

function jsDayToIso(jsDay: number): number {
  // JS: 0=Sun..6=Sat -> ISO: 1=Mon..7=Sun
  return jsDay === 0 ? 7 : jsDay;
}

function isoToDayOfWeekEnum(isoDay: number): string {
  const map: Record<number, string> = {
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
    6: "SATURDAY",
    7: "SUNDAY",
  };
  return map[isoDay] ?? "MONDAY";
}

function parseTimeToMinutes(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === "string") {
    const m = value.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return hh * 60 + mm;
  }
  return null;
}

function toMinutesOfDay(value: Date): number {
  return value.getHours() * 60 + value.getMinutes();
}

function findOverlappingBreakEnd(
  breaks: AvailabilityTemplateIntervalBreakResponseVM[],
  slotStart: number,
  slotEnd: number
): number | null {
  const overlappingBreakEnds = breaks
    .map((intervalBreak) => {
      const breakStart = parseTimeToMinutes(intervalBreak?.startTime);
      const breakEnd = parseTimeToMinutes(intervalBreak?.endTime);
      if (breakStart == null || breakEnd == null || breakEnd <= breakStart) return null;
      const isOverlapping = slotStart < breakEnd && slotEnd > breakStart;
      return isOverlapping ? breakEnd : null;
    })
    .filter((v): v is number => v != null);
  if (overlappingBreakEnds.length === 0) return null;
  return Math.max(...overlappingBreakEnds);
}

function countSlotsForInterval(interval: AvailabilityTemplateIntervalResponseVM, templateDurationMinutes: number): number {
  const start = parseTimeToMinutes((interval as any)?.startTime ?? (interval as any)?.fromTime ?? (interval as any)?.start);
  const end = parseTimeToMinutes((interval as any)?.endTime ?? (interval as any)?.toTime ?? (interval as any)?.end);
  if (start == null || end == null) return 0;
  const intervalDuration = Number(interval?.slotDurationMinutes ?? templateDurationMinutes);
  if (!Number.isFinite(intervalDuration) || intervalDuration <= 0) return 0;

  let slots = 0;
  let cursor = start;
  const intervalBreaks: AvailabilityTemplateIntervalBreakResponseVM[] = [];
  while (cursor + intervalDuration <= end) {
    const slotStart = cursor;
    const slotEnd = slotStart + intervalDuration;
    const overlappingBreakEnd = findOverlappingBreakEnd(intervalBreaks, slotStart, slotEnd);
    if (overlappingBreakEnd != null) {
      cursor = overlappingBreakEnd;
      continue;
    }
    slots += 1;
    cursor = slotEnd;
  }
  return slots;
}

function countSlotsForIntervalWithBreaks(
  interval: AvailabilityTemplateIntervalResponseVM,
  templateDurationMinutes: number,
  slotBeforeMinutes: number,
  slotAfterMinutes: number,
  parallelCapacity: number,
  breaks: AvailabilityTemplateIntervalBreakResponseVM[],
  effectiveStartBound?: number | null,
  effectiveEndBound?: number | null
): { slotCount: number; bufferCount: number; totalCount: number } {
  const start = parseTimeToMinutes((interval as any)?.startTime ?? (interval as any)?.fromTime ?? (interval as any)?.start);
  const end = parseTimeToMinutes((interval as any)?.endTime ?? (interval as any)?.toTime ?? (interval as any)?.end);
  if (start == null || end == null) return { slotCount: 0, bufferCount: 0, totalCount: 0 };
  const intervalDuration = Number(interval?.slotDurationMinutes ?? templateDurationMinutes);
  if (!Number.isFinite(intervalDuration) || intervalDuration <= 0) {
    return { slotCount: 0, bufferCount: 0, totalCount: 0 };
  }

  let effectiveStart = start;
  let effectiveEnd = end;
  if (effectiveStartBound != null && effectiveStartBound > effectiveStart) {
    effectiveStart = effectiveStartBound;
  }
  if (effectiveEndBound != null && effectiveEndBound < effectiveEnd) {
    effectiveEnd = effectiveEndBound;
  }
  if (effectiveStart >= effectiveEnd) {
    return { slotCount: 0, bufferCount: 0, totalCount: 0 };
  }

  let slotCount = 0;
  let bufferCount = 0;
  let cursor = effectiveStart;
  while (true) {
    const slotStart = cursor;
    const slotEnd = slotStart + intervalDuration;
    if (slotEnd > effectiveEnd) break;
    const overlappingBreakEnd = findOverlappingBreakEnd(breaks, slotStart, slotEnd);
    if (overlappingBreakEnd != null) {
      cursor = overlappingBreakEnd + slotBeforeMinutes;
      continue;
    }
    const beforeCount = slotBeforeMinutes > 0 ? parallelCapacity : 0;
    const afterCount = slotAfterMinutes > 0 ? parallelCapacity : 0;
    slotCount += parallelCapacity;
    bufferCount += beforeCount + afterCount;

    const afterBufferEnd = slotEnd + slotAfterMinutes;
    cursor = afterBufferEnd + slotBeforeMinutes;
  }
  return {
    slotCount,
    bufferCount,
    totalCount: slotCount + bufferCount,
  };
}

function computePreview(
  intervalsByDay: Record<string, AvailabilityTemplateIntervalResponseVM[]>,
  breaksByIntervalId: Record<number, AvailabilityTemplateIntervalBreakResponseVM[]>,
  templateDurationMinutes: number,
  slotBeforeMinutes: number,
  slotAfterMinutes: number,
  parallelCapacity: number,
  dto: AvailabilityGenerationBatchApplyDTO | undefined,
  holidayDates: string[] = []
) {
  const startDateTime = parseApplyTemplateDateTime((dto as any)?.startDate);
  const endDateTime = parseApplyTemplateDateTime((dto as any)?.endDate);
  const start = toDateOnly(startDateTime);
  const end = toDateOnly(endDateTime);
  const excludeHolidays = String((dto as any)?.holidayHandlingMode ?? "").toUpperCase() === "EXCLUDE_HOLIDAYS";

  if (!start || !end || !startDateTime || !endDateTime || end < start) {
    return {
      totalSlots: 0,
      totalSlotTypeSlots: 0,
      totalBufferTypeSlots: 0,
      avgSlotsPerDay: 0,
      exceptions: 0,
      days: 0
    };
  }

  const holidaysSet = new Set((holidayDates ?? []).filter(Boolean));
  const holidayCountInPeriod = holidaysSet.size;
  const applyStartDayKey = `${startDateTime.getFullYear()}-${String(startDateTime.getMonth() + 1).padStart(2, "0")}-${String(startDateTime.getDate()).padStart(2, "0")}`;
  const applyEndDayKey = `${endDateTime.getFullYear()}-${String(endDateTime.getMonth() + 1).padStart(2, "0")}-${String(endDateTime.getDate()).padStart(2, "0")}`;
  const applyStartMinutes = toMinutesOfDay(startDateTime);
  const applyEndMinutes = toMinutesOfDay(endDateTime);

  let totalSlots = 0;
  let totalSlotTypeSlots = 0;
  let totalBufferTypeSlots = 0;
  let includedDays = 0;
  let excludedHolidayDays = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;

    const isHoliday = holidaysSet.has(key);
    if (isHoliday && excludeHolidays) {
      excludedHolidayDays += 1;
      continue;
    }

    includedDays += 1;
    const isoDay = jsDayToIso(d.getDay());
    const dayKey = isoToDayOfWeekEnum(isoDay);
    const dayIntervals = intervalsByDay[dayKey] ?? [];
    for (const interval of dayIntervals) {
      const intervalId = Number(interval?.id ?? 0);
      const intervalBreaks = intervalId ? breaksByIntervalId[intervalId] ?? [] : [];
      const dayEffectiveStart = key === applyStartDayKey ? applyStartMinutes : null;
      const dayEffectiveEnd = key === applyEndDayKey ? applyEndMinutes : null;
      const counts = countSlotsForIntervalWithBreaks(
        interval,
        templateDurationMinutes,
        slotBeforeMinutes,
        slotAfterMinutes,
        parallelCapacity,
        intervalBreaks,
        dayEffectiveStart,
        dayEffectiveEnd
      );
      totalSlots += counts.totalCount;
      totalSlotTypeSlots += counts.slotCount;
      totalBufferTypeSlots += counts.bufferCount;
    }
  }

  const avgSlotsPerDay = includedDays > 0 ? Math.round(totalSlots / includedDays) : 0;
  const days = includedDays;
  // Exceptions should reflect holidays in selected period;
  // handling mode only controls whether holidays are excluded from generation.
  void excludedHolidayDays;
  return {
    totalSlots,
    totalSlotTypeSlots,
    totalBufferTypeSlots,
    avgSlotsPerDay,
    exceptions: holidayCountInPeriod,
    days
  };
}

const PreviewSummarySection: React.FC<Props> = ({ templateId, templateDurationMinutes, dto, holidayDates }) => {
  const mode = useAppSelector((s: any) => s.ui.mode);
  const isDark = mode === "dark";
  const selectedDepartment = useAppSelector((s) => (s as any)?.auth?.selectedDepartment);
  const facilityIdFromAuth =
    selectedDepartment?.facilityId ??
    selectedDepartment?.facility?.id ??
    selectedDepartment?.facility?.facilityId ??
    null;

  const fromDate = formatLocalDateForApi((dto as any)?.startDate);
  const toDate = formatLocalDateForApi((dto as any)?.endDate);
  const shouldFetchHolidays = Boolean(facilityIdFromAuth) && Boolean(fromDate) && Boolean(toDate);
  const { data: holidaysInRange = [] } = useGetActiveHolidaysInRangeQuery(
    { fromDate, toDate, facilityId: Number(facilityIdFromAuth) },
    { skip: !shouldFetchHolidays }
  );

  const holidayDateSet = React.useMemo(() => {
    // Expand each holiday/range into distinct YYYY-MM-DD dates inside selected period.
    const set = new Set<string>();
    if (!shouldFetchHolidays) return set;

    const selectedStart = toDateOnly((dto as any)?.startDate);
    const selectedEnd = toDateOnly((dto as any)?.endDate);
    if (!selectedStart || !selectedEnd || selectedEnd < selectedStart) return set;

    for (const h of holidaysInRange as any[]) {
      const hs = toDateOnly(h?.startDate);
      const he = toDateOnly(h?.endDate ?? h?.startDate);
      if (!hs || !he) continue;

      const from = hs > selectedStart ? hs : selectedStart;
      const to = he < selectedEnd ? he : selectedEnd;
      if (to < from) continue;

      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        set.add(`${y}-${m}-${day}`);
      }
    }

    return set;
  }, [holidaysInRange, shouldFetchHolidays, dto?.startDate, dto?.endDate]);

  const [intervalsByDay, setIntervalsByDay] = React.useState<Record<string, AvailabilityTemplateIntervalResponseVM[]>>({});
  const [breaksByIntervalId, setBreaksByIntervalId] = React.useState<Record<number, AvailabilityTemplateIntervalBreakResponseVM[]>>({});
  const [triggerIntervalsByDay] = useLazyGetAvailabilityTemplateIntervalsByTemplateAndDayQuery();
  const [triggerBreaksByInterval] = useLazyGetAvailabilityTemplateIntervalBreaksByIntervalQuery();
  const { data: templateData } = useGetAvailabilityTemplateQuery(
    { id: Number(templateId ?? 0) },
    { skip: !templateId }
  );

  React.useEffect(() => {
    let mounted = true;

    const loadIntervals = async () => {
      const start = toDateOnly((dto as any)?.startDate);
      const end = toDateOnly((dto as any)?.endDate);
      if (!templateId || !start || !end || end < start) {
        if (mounted) {
          setIntervalsByDay({});
          setBreaksByIntervalId({});
        }
        return;
      }

      const requestedDays = new Set<string>();
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        requestedDays.add(isoToDayOfWeekEnum(jsDayToIso(d.getDay())));
      }

      const nextMap: Record<string, AvailabilityTemplateIntervalResponseVM[]> = {};
      await Promise.all(
        Array.from(requestedDays).map(async dayOfWeek => {
          try {
            const rows = await triggerIntervalsByDay({ templateId, dayOfWeek }).unwrap();
            nextMap[dayOfWeek] = rows ?? [];
          } catch {
            nextMap[dayOfWeek] = [];
          }
        })
      );
      const nextBreaksByIntervalId: Record<number, AvailabilityTemplateIntervalBreakResponseVM[]> = {};
      await Promise.all(
        Object.values(nextMap)
          .flat()
          .map(async (interval) => {
            const intervalId = Number(interval?.id ?? 0);
            if (!intervalId || nextBreaksByIntervalId[intervalId]) return;
            try {
              nextBreaksByIntervalId[intervalId] = (await triggerBreaksByInterval({ intervalId }).unwrap()) ?? [];
            } catch {
              nextBreaksByIntervalId[intervalId] = [];
            }
          })
      );

      if (mounted) {
        setIntervalsByDay(nextMap);
        setBreaksByIntervalId(nextBreaksByIntervalId);
      }
    };

    void loadIntervals();
    return () => {
      mounted = false;
    };
  }, [dto?.startDate, dto?.endDate, templateId, triggerIntervalsByDay, triggerBreaksByInterval]);

  const effectiveDuration = Number((templateData as any)?.durationMinutes ?? templateDurationMinutes ?? 0);
  const effectiveSlotBefore = Math.max(0, Number((templateData as any)?.defaultBufferBeforeMinutes ?? 0));
  const effectiveSlotAfter = Math.max(0, Number((templateData as any)?.defaultBufferAfterMinutes ?? 0));
  const rawParallelCapacity = Number((templateData as any)?.parallelCapacityValue ?? 1);
  const effectiveParallelCapacity = Number.isFinite(rawParallelCapacity) && rawParallelCapacity > 0 ? rawParallelCapacity : 1;
  const statClassName = isDark
    ? "border border-emerald-500/20 bg-[rgba(16,185,129,0.07)] shadow-none"
    : undefined;
  const statValueClassName = isDark ? "text-emerald-50" : undefined;
  const statLabelClassName = isDark ? "text-emerald-100/80" : undefined;

  const { totalSlotTypeSlots, totalBufferTypeSlots, avgSlotsPerDay, exceptions, days } = React.useMemo(
    () =>
      computePreview(
        intervalsByDay,
        breaksByIntervalId,
        effectiveDuration,
        effectiveSlotBefore,
        effectiveSlotAfter,
        effectiveParallelCapacity,
        dto,
        holidayDates && holidayDates.length > 0 ? holidayDates : Array.from(holidayDateSet)
      ),
    [
      intervalsByDay,
      breaksByIntervalId,
      effectiveDuration,
      effectiveSlotBefore,
      effectiveSlotAfter,
      effectiveParallelCapacity,
      dto,
      holidayDates,
      holidayDateSet,
    ],
  );

  return (
    <Card
      className={isDark ? "rounded-2xl shadow-sm" : "rounded-2xl border-sky-200 bg-sky-50 shadow-sm"}
      style={isDark ? { backgroundColor: "#10261f", borderColor: "#214437" } : undefined}
    >
      <CardHeader className="px-5 py-4">
        <CardTitle className={cn("flex items-center gap-2 text-base font-semibold", isDark ? "text-emerald-50" : "text-slate-900")}>
          <TimerReset className={cn("h-4 w-4", isDark ? "text-emerald-200" : "text-sky-600")} />
          Preview Summary
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="grid gap-3 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-5">
        <MiniStat
          label="Slots/Day avg"
          value={days > 0 ? String(avgSlotsPerDay) : "-"}
          className={statClassName}
          valueClassName={statValueClassName}
          labelClassName={statLabelClassName}
        />
        <MiniStat
          label="Slot count"
          value={days > 0 ? String(totalSlotTypeSlots) : "-"}
          className={statClassName}
          valueClassName={statValueClassName}
          labelClassName={statLabelClassName}
        />
        <MiniStat
          label="Buffer count"
          value={days > 0 ? String(totalBufferTypeSlots) : "-"}
          className={statClassName}
          valueClassName={statValueClassName}
          labelClassName={statLabelClassName}
        />
        <MiniStat
          label="Exceptions"
          value={days > 0 ? String(exceptions) : "-"}
          className={statClassName}
          valueClassName={statValueClassName}
          labelClassName={statLabelClassName}
        />
        <MiniStat
          label="Date Range"
          value={formatDaysLabel(days)}
          className={statClassName}
          valueClassName={statValueClassName}
          labelClassName={statLabelClassName}
        />
      </CardContent>
    </Card>
  );
};

export default PreviewSummarySection;

