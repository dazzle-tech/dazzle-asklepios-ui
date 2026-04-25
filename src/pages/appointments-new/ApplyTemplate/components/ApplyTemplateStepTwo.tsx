import * as React from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import MyBadgeStatus from "@/components/MyBadgeStatus/MyBadgeStatus";
import {
  generatedSlots as generatedSlotsMock,
  type GeneratedSlot,
  Pill,
} from "./shared";
import type {
  AvailabilityGenerationBatchApplyDTO,
  AvailabilityTemplateIntervalBreakResponseVM,
  AvailabilityTemplateIntervalResponseVM,
  AvailabilityTemplateResponseVM,
} from "@/types/model-types-new";
import { useLazyGetAvailabilityTemplateIntervalsByTemplateAndDayQuery } from "@/services/appointment/availabilityTemplate/availabilityTemplateInterval";
import {
  useLazyGetAvailabilityTemplateIntervalBreaksByIntervalQuery,
} from "@/services/appointment/availabilityTemplate/availabilityTemplateIntervalBreak";
import { useGetActiveHolidaysInRangeQuery } from "@/services/system-configurations/organizationHolidaysService";
import { useLazyGetAvailabilityTemplateQuery } from "@/services/appointment/availabilityTemplateService";
import { useAppSelector } from "@/hooks";
import { formatEnumString } from "@/utils";
import SlotsToBeGeneratedSection from "./SlotsToBeGeneratedSection";
import ApplicationSummarySection from "./ApplicationSummarySection";
import { formatLocalDateForApi, parseApplyTemplateDateTime } from "../applyTemplateDateUtils";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
const parseHHmm = (v?: string | null) => {
  if (!v) return null;
  const [h, m] = String(v).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};
const toHHmm = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
const toDayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const toMinutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();
const findOverlappingBreakEnd = (
  breaks: AvailabilityTemplateIntervalBreakResponseVM[],
  slotStart: number,
  slotEnd: number
) => {
  const overlappingBreakEnds = breaks
    .map((intervalBreak) => {
      const breakStart = parseHHmm(intervalBreak?.startTime as any);
      const breakEnd = parseHHmm(intervalBreak?.endTime as any);
      if (breakStart == null || breakEnd == null || breakEnd <= breakStart) return null;
      const isOverlapping = slotStart < breakEnd && slotEnd > breakStart;
      return isOverlapping ? breakEnd : null;
    })
    .filter((v): v is number => v != null);
  if (overlappingBreakEnds.length === 0) return null;
  return Math.max(...overlappingBreakEnds);
};
const findOverlappingBreakWindow = (
  breaks: AvailabilityTemplateIntervalBreakResponseVM[],
  slotStart: number,
  slotEnd: number
) => {
  const overlapping = breaks
    .map((intervalBreak) => {
      const breakStart = parseHHmm(intervalBreak?.startTime as any);
      const breakEnd = parseHHmm(intervalBreak?.endTime as any);
      if (breakStart == null || breakEnd == null || breakEnd <= breakStart) return null;
      const isOverlapping = slotStart < breakEnd && slotEnd > breakStart;
      if (!isOverlapping) return null;
      return { breakStart, breakEnd };
    })
    .filter((v): v is { breakStart: number; breakEnd: number } => v != null);

  if (overlapping.length === 0) return null;
  return {
    start: Math.min(...overlapping.map((b) => b.breakStart)),
    end: Math.max(...overlapping.map((b) => b.breakEnd)),
  };
};

const ApplyTemplateStepTwo: React.FC<{ selectedTemplate?: AvailabilityTemplateResponseVM | null; dto?: AvailabilityGenerationBatchApplyDTO }> = ({ selectedTemplate, dto }) => {
  const selectedDepartment = useAppSelector((s) => (s as any)?.auth?.selectedDepartment);
  const facilityIdFromAuth =
    selectedDepartment?.facilityId ?? selectedDepartment?.facility?.id ?? selectedDepartment?.facility?.facilityId ?? null;
  const effectiveTemplateId =
    String((dto as any)?.scope ?? "").toUpperCase() === "SPECIFIC_RESOURCE"
      ? Number((dto as any)?.childTemplateId ?? 0)
      : Number((dto as any)?.templateId ?? 0);
  const startDate = parseApplyTemplateDateTime((dto as any)?.startDate);
  const endDate = parseApplyTemplateDateTime((dto as any)?.endDate);
  const fromDate = formatLocalDateForApi((dto as any)?.startDate);
  const toDateStr = formatLocalDateForApi((dto as any)?.endDate);
  const { data: holidays = [] } = useGetActiveHolidaysInRangeQuery(
    { fromDate, toDate: toDateStr, facilityId: Number(facilityIdFromAuth) },
    { skip: !fromDate || !toDateStr || !facilityIdFromAuth }
  );
  const [loadByDay] = useLazyGetAvailabilityTemplateIntervalsByTemplateAndDayQuery();
  const [loadBreaksByInterval] = useLazyGetAvailabilityTemplateIntervalBreaksByIntervalQuery();
  const [loadTemplateById] = useLazyGetAvailabilityTemplateQuery();
  const [generatedSlots, setGeneratedSlots] = React.useState<GeneratedSlot[]>(generatedSlotsMock);
  const totalSlotsToBeCreated = React.useMemo(
    () => generatedSlots.filter(slot => slot.tone === "created").length,
    [generatedSlots]
  );
  const totalBufferSlotsToBeCreated = React.useMemo(
    () => generatedSlots.filter(slot => slot.tone === "created" && slot.slotType === "Buffer").length,
    [generatedSlots]
  );
  const totalPrimarySlotsToBeCreated = React.useMemo(
    () => generatedSlots.filter(slot => slot.tone === "created" && slot.slotType === "Slot").length,
    [generatedSlots]
  );
  const exceptionCount = React.useMemo(() => {
    return (holidays as any[])?.length ?? 0;
  }, [holidays]);
  const excludeHolidays = React.useMemo(
    () => String((dto as any)?.holidayHandlingMode ?? "").toUpperCase() === "EXCLUDE_HOLIDAYS",
    [(dto as any)?.holidayHandlingMode]
  );
  const slotStatusColorMap = React.useMemo(
    () =>
      new Map<string, string>([
        ["created", "#12B76A"],
        ["partial", "#F79009"],
        ["skipped", "#F04438"],
      ]),
    []
  );
  const generatedSlotsColumns = React.useMemo(
    () => [
      {
        key: "date",
        title: "Date",
        width: 180,
        render: (row: GeneratedSlot) => <span className="text-sm font-medium text-slate-700">{row.date}</span>
      },
      {
        key: "time",
        title: "Time",
        width: 150,
        render: (row: GeneratedSlot) => <span className="text-sm text-slate-600">{row.time}</span>
      },
      {
        key: "slotType",
        title: "Type",
        width: 140,
        render: (row: GeneratedSlot) => (
          <Pill
            className={cn(
              row.slotType === "Buffer"
                ? "bg-violet-100 text-violet-700"
                : row.slotType === "Break"
                  ? "bg-rose-100 text-rose-700"
                  : row.slotType === "Holiday"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
            )}
          >
            {row.slotType ?? "Slot"}
          </Pill>
        )
      },
      {
        key: "channel",
        title: "resource",
        width: 170,
        render: (row: GeneratedSlot) => (
          <Pill className={cn(row.alert ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700")}>
            {formatEnumString(row.channel)}
          </Pill>
        )
      },
      {
        key: "duration",
        title: "Duration",
        width: 120,
        render: (row: GeneratedSlot) => <span className="text-sm text-slate-600">{row.duration}</span>
      },
      {
        key: "capacity",
        title: "Capacity",
        width: 120,
        render: (row: GeneratedSlot) => <span className="text-sm text-slate-600">{row.capacity}</span>
      },
      {
        key: "status",
        title: "Status",
        width: 160,
        render: (row: GeneratedSlot) => (
          <MyBadgeStatus
            color={slotStatusColorMap.get(String(row.tone).toLowerCase()) ?? "#98A2B4"}
            contant={row.status}
          />
        )
      }
    ],
    [slotStatusColorMap]
  );

  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!effectiveTemplateId || !startDate || !endDate || endDate < startDate) {
        if (mounted) setGeneratedSlots([]);
        return;
      }
      const effectiveTemplate =
        Number(selectedTemplate?.id ?? 0) === effectiveTemplateId
          ? selectedTemplate
          : await loadTemplateById({ id: effectiveTemplateId }).unwrap().catch(() => null);
      const intervalsByDay: Record<string, AvailabilityTemplateIntervalResponseVM[]> = {};
      await Promise.all(
        DAYS.map(async day => {
          try {
            intervalsByDay[day] = (await loadByDay({ templateId: effectiveTemplateId, dayOfWeek: day }).unwrap()) ?? [];
          } catch {
            intervalsByDay[day] = [];
          }
        })
      );
      const intervalBreaksByIntervalId: Record<number, AvailabilityTemplateIntervalBreakResponseVM[]> = {};
      await Promise.all(
        Object.values(intervalsByDay)
          .flat()
          .map(async (interval) => {
            const intervalId = Number(interval?.id ?? 0);
            if (!intervalId || intervalBreaksByIntervalId[intervalId]) return;
            try {
              intervalBreaksByIntervalId[intervalId] =
                (await loadBreaksByInterval({ intervalId }).unwrap()) ?? [];
            } catch {
              intervalBreaksByIntervalId[intervalId] = [];
            }
          })
      );
      const holidaySet = new Set<string>();
      for (const h of holidays as any[]) {
        const hs = parseApplyTemplateDateTime(h?.startDate);
        const he = parseApplyTemplateDateTime(h?.endDate ?? h?.startDate);
        if (!hs || !he) continue;
        for (let d = new Date(hs); d <= he; d.setDate(d.getDate() + 1)) {
          holidaySet.add(format(d, "yyyy-MM-dd"));
        }
      }
      const rows: GeneratedSlot[] = [];
      const duration = Number(effectiveTemplate?.durationMinutes ?? selectedTemplate?.durationMinutes ?? 30);
      const slotBeforeMinutes = Math.max(
        0,
        Number(effectiveTemplate?.defaultBufferBeforeMinutes ?? selectedTemplate?.defaultBufferBeforeMinutes ?? 0)
      );
      const slotAfterMinutes = Math.max(
        0,
        Number(effectiveTemplate?.defaultBufferAfterMinutes ?? selectedTemplate?.defaultBufferAfterMinutes ?? 0)
      );
      const channelLabel = String(effectiveTemplate?.templateType ?? selectedTemplate?.templateType ?? "TEMPLATE");
      const rawTemplateCapacity = Number(
        effectiveTemplate?.parallelCapacityValue ?? selectedTemplate?.parallelCapacityValue ?? 1
      );
      const templateCapacity = Number.isFinite(rawTemplateCapacity) && rawTemplateCapacity > 0 ? rawTemplateCapacity : 1;
      const startDay = toDayStart(startDate);
      const endDay = toDayStart(endDate);
      const applyStartDayKey = format(startDate, "yyyy-MM-dd");
      const applyEndDayKey = format(endDate, "yyyy-MM-dd");
      const applyStartMinutes = toMinutesOfDay(startDate);
      const applyEndMinutes = toMinutesOfDay(endDate);

      for (let d = new Date(startDay); d <= endDay; d.setDate(d.getDate() + 1)) {
        const dayKey = DAYS[(d.getDay() + 6) % 7];
        const key = format(d, "yyyy-MM-dd");
        const isHoliday = holidaySet.has(key);
        const excludeHolidays =
          String((dto as any)?.holidayHandlingMode ?? "").toUpperCase() === "EXCLUDE_HOLIDAYS";
        if (isHoliday && excludeHolidays) {
          rows.push({
            date: format(d, "EEE, MMM dd"),
            time: "—",
            slotType: "Holiday",
            channel: "Holiday",
            duration: "All day",
            capacity: "—",
            status: "Will be skipped",
            tone: "skipped",
            checked: false,
            alert: true,
          });
          continue;
        }
        for (const it of intervalsByDay[dayKey] ?? []) {
          const intervalId = Number(it?.id ?? 0);
          const breaks = intervalId ? intervalBreaksByIntervalId[intervalId] ?? [] : [];
          const startMins = parseHHmm(it?.startTime as any);
          const endMins = parseHHmm(it?.endTime as any);
          const slotDuration = Number(it?.slotDurationMinutes ?? duration);
          if (startMins == null || endMins == null || !slotDuration || slotDuration <= 0 || endMins <= startMins) {
            continue;
          }

          let effectiveStart = startMins;
          let effectiveEnd = endMins;
          if (key === applyStartDayKey && applyStartMinutes > effectiveStart) {
            effectiveStart = applyStartMinutes;
          }
          if (key === applyEndDayKey && applyEndMinutes < effectiveEnd) {
            effectiveEnd = applyEndMinutes;
          }
          if (effectiveStart >= effectiveEnd) {
            continue;
          }

          for (let cursor = effectiveStart; ;) {
            const slotStart = cursor;
            const slotEnd = cursor + slotDuration;
            if (slotEnd > effectiveEnd) {
              break;
            }
            const overlappingBreakEnd = findOverlappingBreakEnd(breaks, slotStart, slotEnd);
            if (overlappingBreakEnd != null) {
              const overlappingBreakWindow = findOverlappingBreakWindow(breaks, slotStart, slotEnd);
              const skippedStart = overlappingBreakWindow?.start ?? slotStart;
              const skippedEnd = overlappingBreakWindow?.end ?? overlappingBreakEnd;
              const skippedDuration = Math.max(0, skippedEnd - skippedStart);
              rows.push({
                date: format(d, "EEE, MMM dd"),
                time: `${toHHmm(skippedStart)} - ${toHHmm(skippedEnd)}`,
                slotType: "Break",
                channel: channelLabel,
                duration: `${skippedDuration} min`,
                capacity: "—",
                status: "Will be skipped",
                tone: "skipped",
                checked: false,
                alert: true,
              });
              cursor = overlappingBreakEnd + slotBeforeMinutes;
              continue;
            }
            const beforeBufferStart = slotStart - slotBeforeMinutes;
            const beforeBufferEnd = slotStart;
            const afterBufferStart = slotEnd;
            const afterBufferEnd = slotEnd + slotAfterMinutes;

            for (let capacityIndex = 0; capacityIndex < templateCapacity; capacityIndex += 1) {
              if (slotBeforeMinutes > 0) {
                rows.push({
                  date: format(d, "EEE, MMM dd"),
                  time: `${toHHmm(beforeBufferStart)} - ${toHHmm(beforeBufferEnd)}`,
                  slotType: "Buffer",
                  channel: channelLabel,
                  duration: `${slotBeforeMinutes} min`,
                  capacity: `${capacityIndex + 1}/${templateCapacity}`,
                  status: "Will be created",
                  tone: "created",
                  checked: true,
                });
              }

              rows.push({
                date: format(d, "EEE, MMM dd"),
                time: `${toHHmm(slotStart)} - ${toHHmm(slotEnd)}`,
                slotType: "Slot",
                channel: channelLabel,
                duration: `${slotDuration} min`,
                capacity: `${capacityIndex + 1}/${templateCapacity}`,
                status: "Will be created",
                tone: "created",
                checked: true,
              });

              if (slotAfterMinutes > 0) {
                rows.push({
                  date: format(d, "EEE, MMM dd"),
                  time: `${toHHmm(afterBufferStart)} - ${toHHmm(afterBufferEnd)}`,
                  slotType: "Buffer",
                  channel: channelLabel,
                  duration: `${slotAfterMinutes} min`,
                  capacity: `${capacityIndex + 1}/${templateCapacity}`,
                  status: "Will be created",
                  tone: "created",
                  checked: true,
                });
              }
            }
            cursor = afterBufferEnd + slotBeforeMinutes;
          }
        }
      }
      if (mounted) setGeneratedSlots(rows);
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [
    effectiveTemplateId,
    startDate?.getTime(),
    endDate?.getTime(),
    fromDate,
    toDateStr,
    selectedTemplate?.durationMinutes,
    selectedTemplate?.defaultBufferBeforeMinutes,
    selectedTemplate?.defaultBufferAfterMinutes,
    selectedTemplate?.parallelCapacityValue,
    selectedTemplate?.templateType,
    selectedTemplate?.id,
    (dto as any)?.scope,
    (dto as any)?.holidayHandlingMode,
    loadByDay,
    loadBreaksByInterval,
    loadTemplateById,
    holidays,
  ]);

  return (
    <>
      <div className="grid gap-4 bg-slate-50 p-4 xl:grid-cols-[1.45fr_0.75fr]">
        <SlotsToBeGeneratedSection
          generatedSlots={generatedSlots}
          generatedSlotsColumns={generatedSlotsColumns}
          totalSlotsToBeCreated={totalSlotsToBeCreated}
          exceptionCount={exceptionCount}
          excludeHolidays={excludeHolidays}
        />

        <ApplicationSummarySection
          selectedTemplate={selectedTemplate}
          dto={dto}
          totalSlotsToBeCreated={totalSlotsToBeCreated}
          totalPrimarySlotsToBeCreated={totalPrimarySlotsToBeCreated}
          totalBufferSlotsToBeCreated={totalBufferSlotsToBeCreated}
          exceptionCount={exceptionCount}
        />
      </div>
    </>
  );
};

export default ApplyTemplateStepTwo;
