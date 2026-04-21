import * as React from "react";
import {
  CalendarRange,
  CheckCircle2,
  FileCheck2,
  Hospital,
  Info,
  Layers,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { useGetFacilityByIdQuery } from "@/services/security/facilityService";
import { useGetDepartmentByIdQuery } from "@/services/security/departmentService";
import { useGetAvailabilityTemplateQuery } from "@/services/appointment/availabilityTemplateService";
import { formatEnumString } from "@/utils";
import { Pill, SummaryRow, SurfaceCard } from "./shared";
import type { AvailabilityGenerationBatchApplyDTO, AvailabilityTemplateResponseVM } from "@/types/model-types-new";

const toDate = (v: unknown): Date | null =>
  v instanceof Date && !Number.isNaN(v.getTime())
    ? v
    : typeof v === "string" && v.trim() !== ""
      ? (() => {
          const d = new Date(v);
          return Number.isNaN(d.getTime()) ? null : d;
        })()
      : null;

type ApplicationSummarySectionProps = {
  selectedTemplate?: AvailabilityTemplateResponseVM | null;
  dto?: AvailabilityGenerationBatchApplyDTO;
  totalSlotsToBeCreated: number;
  totalPrimarySlotsToBeCreated: number;
  totalBufferSlotsToBeCreated: number;
  exceptionCount: number;
};

const ApplicationSummarySection: React.FC<ApplicationSummarySectionProps> = ({
  selectedTemplate,
  dto,
  totalSlotsToBeCreated,
  totalPrimarySlotsToBeCreated,
  totalBufferSlotsToBeCreated,
  exceptionCount,
}) => {
  const scopeUpper = String((dto as any)?.scope ?? "").trim().toUpperCase();
  const effectiveTemplateId =
    scopeUpper === "SPECIFIC_RESOURCE"
      ? Number((dto as any)?.childTemplateId ?? 0)
      : Number(dto?.templateId ?? 0);

  const { data: effectiveTemplate } = useGetAvailabilityTemplateQuery(
    { id: effectiveTemplateId },
    { skip: !effectiveTemplateId }
  );

  const facilityId = selectedTemplate?.facilityId ?? null;
  const departmentId = selectedTemplate?.departmentId ?? null;
  const { data: facilityData } = useGetFacilityByIdQuery(facilityId as any, { skip: !facilityId });
  const { data: departmentData } = useGetDepartmentByIdQuery(departmentId as any, { skip: !departmentId });

  const templateName = React.useMemo(() => {
    if (!effectiveTemplateId) return "—";
    if (selectedTemplate?.id === effectiveTemplateId) {
      return selectedTemplate.templateName ?? "—";
    }
    return (effectiveTemplate as any)?.templateName ?? "—";
  }, [effectiveTemplateId, selectedTemplate, effectiveTemplate]);

  const facilityName = (facilityData as any)?.name ?? "—";
  const departmentName = (departmentData as any)?.name ?? "—";

  const start = toDate(dto?.startDate as any);
  const end = toDate(dto?.endDate as any);
  const calendarDays =
    start && end && end >= start ? differenceInCalendarDays(end, start) + 1 : 0;

  const dateRangeLabel = React.useMemo(() => {
    if (!start || !end) return "—";
    const a = format(start, "MMM d, yyyy h:mm a");
    const b = format(end, "MMM d, yyyy h:mm a");
    const daysPart = calendarDays > 0 ? ` (${calendarDays} ${calendarDays === 1 ? "day" : "days"})` : "";
    return `${a} – ${b}${daysPart}`;
  }, [start, end, calendarDays]);

  const scopeLabel = dto?.scope ? formatEnumString(String(dto.scope)) : "—";

  const dailyAverage =
    calendarDays > 0 ? Math.round(totalSlotsToBeCreated / calendarDays) : null;

  const scopeConfigLine =
    scopeUpper === "DEPARTMENT" ? `${scopeLabel}` : scopeLabel;

  const holidayMode = String((dto as any)?.holidayHandlingMode ?? "").toUpperCase();
  const excludeHolidays = holidayMode === "EXCLUDE_HOLIDAYS";
  const includeAsException = holidayMode === "INCLUDE_AS_EXCEPTION";

  const holidaySummaryLine =
    excludeHolidays || includeAsException
      ? excludeHolidays
        ? exceptionCount === 0
          ? "No organization holidays in the selected range"
          : `${exceptionCount} Exception${exceptionCount === 1 ? "" : "s"} configured`
        : exceptionCount === 0
          ? "No organization holidays in the selected range"
          : `${exceptionCount} organization holiday${exceptionCount === 1 ? "" : "s"} included as exceptions`
      : null;

  return (
    <SurfaceCard title="Application Summary" description="Final review before execution" icon={Wrench}>
      <div className="space-y-5">
        <div className="space-y-3">
          <SummaryRow label="Template" value={templateName} icon={FileCheck2} />
          <SummaryRow label="Date Range" value={dateRangeLabel} icon={CalendarRange} />
          <SummaryRow label="Facility" value={facilityName || "—"} icon={Hospital} />
          <SummaryRow label="Department" value={departmentName || "—"} icon={Stethoscope} />
          <SummaryRow label="Resource scope" value={scopeLabel} icon={Layers} />
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-700">Total slots</span>
            <Pill className="bg-white text-emerald-700">
              {totalSlotsToBeCreated} {totalSlotsToBeCreated === 1 ? "appointment" : "appointments"}
            </Pill>
          </div>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Number of Slot </span>
              <span>{totalPrimarySlotsToBeCreated}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Number of Buffer</span>
              <span>{totalBufferSlotsToBeCreated}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>Daily average</span>
            <span>{dailyAverage != null ? `~${dailyAverage} slots per day` : "—"}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-800">Configuration</div>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {scopeConfigLine}
            </div>
            {holidaySummaryLine != null ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {holidaySummaryLine}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 text-sky-600" />
            <p>
              <span className="font-semibold">Next step:</span> Free appointments will be created and ready for
              patient booking.
            </p>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
};

export default ApplicationSummarySection;
