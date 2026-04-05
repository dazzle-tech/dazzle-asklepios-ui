import * as React from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import MyBadgeStatus from "@/components/MyBadgeStatus/MyBadgeStatus";
import {
  generatedSlots as generatedSlotsMock,
  type GeneratedSlot,
  Pill,
} from "./shared";
import type { AvailabilityGenerationBatchApplyDTO, AvailabilityTemplateIntervalResponseVM, AvailabilityTemplateResponseVM } from "@/types/model-types-new";
import { useLazyGetAvailabilityTemplateIntervalsByTemplateAndDayQuery } from "@/services/appointment/availabilityTemplate/availabilityTemplateInterval";
import { useGetActiveHolidaysInRangeQuery } from "@/services/system-configurations/organizationHolidaysService";
import { useLazyGetAvailabilityTemplateQuery } from "@/services/appointment/availabilityTemplateService";
import { useAppSelector } from "@/hooks";
import { formatEnumString } from "@/utils";
import SlotsToBeGeneratedSection from "./SlotsToBeGeneratedSection";
import ApplicationSummarySection from "./ApplicationSummarySection";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
const toDate = (v: any): Date | null => (v instanceof Date && !Number.isNaN(v.getTime()) ? v : (typeof v === "string" ? new Date(v) : null));
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

const ApplyTemplateStepTwo: React.FC<{ selectedTemplate?: AvailabilityTemplateResponseVM | null; dto?: AvailabilityGenerationBatchApplyDTO }> = ({ selectedTemplate, dto }) => {
  const selectedDepartment = useAppSelector((s) => (s as any)?.auth?.selectedDepartment);
  const facilityIdFromAuth =
    selectedDepartment?.facilityId ?? selectedDepartment?.facility?.id ?? selectedDepartment?.facility?.facilityId ?? null;
  const effectiveTemplateId =
    String((dto as any)?.scope ?? "").toUpperCase() === "SPECIFIC_RESOURCE"
      ? Number((dto as any)?.childTemplateId ?? 0)
      : Number((dto as any)?.templateId ?? 0);
  const startDate = toDate((dto as any)?.startDate);
  const endDate = toDate((dto as any)?.endDate);
  const fromDate = startDate ? format(startDate, "yyyy-MM-dd") : "";
  const toDateStr = endDate ? format(endDate, "yyyy-MM-dd") : "";
  const { data: holidays = [] } = useGetActiveHolidaysInRangeQuery(
    { fromDate, toDate: toDateStr, facilityId: Number(facilityIdFromAuth) },
    { skip: !fromDate || !toDateStr || !facilityIdFromAuth }
  );
  const [loadByDay] = useLazyGetAvailabilityTemplateIntervalsByTemplateAndDayQuery();
  const [loadTemplateById] = useLazyGetAvailabilityTemplateQuery();
  const [generatedSlots, setGeneratedSlots] = React.useState<GeneratedSlot[]>(generatedSlotsMock);
  const totalSlotsToBeCreated = React.useMemo(
    () => generatedSlots.filter(slot => slot.tone === "created").length,
    [generatedSlots]
  );
  const exceptionCount = React.useMemo(() => {
    return (holidays as any[])?.length ?? 0;
  }, [holidays]);
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
      const holidaySet = new Set<string>();
      for (const h of holidays as any[]) {
        const hs = toDate(h?.startDate);
        const he = toDate(h?.endDate ?? h?.startDate);
        if (!hs || !he) continue;
        for (let d = new Date(hs); d <= he; d.setDate(d.getDate() + 1)) {
          holidaySet.add(format(d, "yyyy-MM-dd"));
        }
      }
      const rows: GeneratedSlot[] = [];
      const duration = Number(effectiveTemplate?.durationMinutes ?? selectedTemplate?.durationMinutes ?? 30);
      const channelLabel = String(effectiveTemplate?.templateType ?? selectedTemplate?.templateType ?? "TEMPLATE");
      const templateCapacity = Number(effectiveTemplate?.parallelCapacityValue ?? selectedTemplate?.parallelCapacityValue ?? 1);
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayKey = DAYS[(d.getDay() + 6) % 7];
        const key = format(d, "yyyy-MM-dd");
        const isHoliday = holidaySet.has(key);
        if (isHoliday) {
          rows.push({
            date: format(d, "EEE, MMM dd"),
            time: "—",
            channel: "Holiday",
            duration: "All day",
            capacity: "—",
            status: "Will be skipped",
            tone: "skipped",
            checked: false,
            alert: true,
          });
          if (String((dto as any)?.holidayHandlingMode ?? "").toUpperCase() === "EXCLUDE_HOLIDAYS") continue;
        }
        for (const it of intervalsByDay[dayKey] ?? []) {
          const startMins = parseHHmm(it?.startTime as any);
          const endMins = parseHHmm(it?.endTime as any);
          const slotDuration = Number(it?.slotDurationMinutes ?? duration);
          if (startMins == null || endMins == null || !slotDuration || slotDuration <= 0 || endMins <= startMins) {
            continue;
          }
          for (let cursor = startMins; cursor + slotDuration <= endMins; cursor += slotDuration) {
            rows.push({
              date: format(d, "EEE, MMM dd"),
              time: `${toHHmm(cursor)} - ${toHHmm(cursor + slotDuration)}`,
              channel: channelLabel,
              duration: `${slotDuration} min`,
              capacity: `${templateCapacity} slots`,
              status: "Will be created",
              tone: "created",
              checked: true,
            });
          }
        }
      }
      if (mounted) setGeneratedSlots(rows);
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [effectiveTemplateId, fromDate, toDateStr, selectedTemplate?.durationMinutes, (dto as any)?.scope, (dto as any)?.holidayHandlingMode, loadByDay, holidays]);

  return (
    <>
      <div className="grid gap-4 bg-slate-50 p-4 xl:grid-cols-[1.45fr_0.75fr]">
        <SlotsToBeGeneratedSection
          generatedSlots={generatedSlots}
          generatedSlotsColumns={generatedSlotsColumns}
          totalSlotsToBeCreated={totalSlotsToBeCreated}
          exceptionCount={exceptionCount}
        />

        <ApplicationSummarySection
          selectedTemplate={selectedTemplate}
          dto={dto}
          totalSlotsToBeCreated={totalSlotsToBeCreated}
          exceptionCount={exceptionCount}
        />
      </div>
    </>
  );
};

export default ApplyTemplateStepTwo;
