import * as React from "react";
import type { AvailabilityGenerationBatchApplyDTO } from "@/types/model-types-new";
import PreviewSummarySection from "./PreviewSummarySection";
import { formatLocalDateForApi, parseApplyTemplateDateTime } from "../applyTemplateDateUtils";
import { useLazyGetAppointmentsByDepartmentBetweenDatesQuery } from "@/services/appointment/appointmentService";
import PreviewSlotsCardSection from "./PreviewSlotsCardSection";
import { useGetAvailabilityTemplateQuery } from "@/services/appointment/availabilityTemplateService";

const PreviewSlotsSection: React.FC<{
  templateId?: number | null;
  templateDurationMinutes?: number | null;
  departmentId?: number | null;
  dto?: AvailabilityGenerationBatchApplyDTO;
  setDto?: React.Dispatch<React.SetStateAction<AvailabilityGenerationBatchApplyDTO>>;
  onSlotCellSelect?: (payload: { dateKey: string; timeLabel: string; slots: any[] }) => void;
  selectedCellKey?: string | null;
}> = ({ templateId, templateDurationMinutes, departmentId, dto, setDto, onSlotCellSelect, selectedCellKey }) => {
  void dto;
  void setDto;

  const [triggerAppointmentsByDepartment] = useLazyGetAppointmentsByDepartmentBetweenDatesQuery();
  const scopeUpper = String((dto as any)?.scope ?? "").trim().toUpperCase();
  const effectiveTemplateId = React.useMemo(
    () =>
      scopeUpper === "SPECIFIC_RESOURCE"
        ? Number((dto as any)?.childTemplateId ?? 0)
        : Number((dto as any)?.templateId ?? templateId ?? 0),
    [scopeUpper, dto, templateId]
  );
  const { data: effectiveTemplateData } = useGetAvailabilityTemplateQuery(
    { id: effectiveTemplateId },
    { skip: !effectiveTemplateId }
  );
  const effectiveDepartmentId = Number((effectiveTemplateData as any)?.departmentId ?? departmentId ?? 0);
  const effectiveResourceId = Number((effectiveTemplateData as any)?.resourceId ?? 0);
  const effectiveTemplateDurationMinutes = Number(
    (effectiveTemplateData as any)?.durationMinutes ?? templateDurationMinutes ?? 0
  );
  const [matrix, setMatrix] = React.useState<
    Record<string, { count: number; statuses: Record<string, number> }>
  >({});
  const [slotsByCell, setSlotsByCell] = React.useState<Record<string, any[]>>({});
  const [timeRows, setTimeRows] = React.useState<string[]>([]);
  const [isLoadingCounts, setIsLoadingCounts] = React.useState(false);

  const startDate = React.useMemo(() => parseApplyTemplateDateTime((dto as any)?.startDate), [dto]);
  const endDate = React.useMemo(() => parseApplyTemplateDateTime((dto as any)?.endDate), [dto]);

  const rangeStart = React.useMemo(
    () => (startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null),
    [startDate]
  );
  const rangeEnd = React.useMemo(
    () => (endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : null),
    [endDate]
  );

  const periodDays = React.useMemo(() => {
    if (!rangeStart || !rangeEnd || rangeEnd < rangeStart) return [] as Date[];
    const rows: Date[] = [];
    for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
      rows.push(new Date(d));
    }
    return rows;
  }, [startDate, endDate]);

  const getStatusColor = React.useCallback((statusRaw: string) => {
    const s = String(statusRaw ?? "").toUpperCase();
    if (s.includes("BOOK")) return "#059669";
    if (s.includes("CONFIRM")) return "#166534";
    if (s.includes("COMPLETE")) return "#6DA7E8";
    if (s.includes("NEW")) return "#4B7BEC";
    if (s.includes("CHECK")) return "#F5B971";
    if (s.includes("NO_SHOW") || s.includes("NO-SHOW")) return "#E8CF5A";
    if (s.includes("IN_SERVICE") || s.includes("IN SERVICE")) return "#7C8BF3";
    if (s.includes("CANCEL")) return "#F87171";
    return "#C8D1E1";
  }, []);
  const statusLegendItems = React.useMemo(
    () => [
      { label: "Booked", color: "#059669" },
      { label: "Confirmed", color: "#166534" },
      { label: "Completed", color: "#6DA7E8" },
      { label: "New", color: "#4B7BEC" },
      { label: "Checked In", color: "#F5B971" },
      { label: "No Show", color: "#E8CF5A" },
      { label: "In Service", color: "#7C8BF3" },
      { label: "Cancelled", color: "#F87171" },
      { label: "Empty", color: "#E2E8F0" }
    ],
    []
  );

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return Number.MAX_SAFE_INTEGER;
    return h * 60 + m;
  };

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      const depId = effectiveDepartmentId;
      if (!depId || !startDate || !endDate || endDate < startDate) {
        if (mounted) {
          setMatrix({});
          setSlotsByCell({});
          setTimeRows([]);
        }
        return;
      }

      setIsLoadingCounts(true);
      try {
        const startIso = new Date(startDate).toISOString();
        const endIso = new Date(endDate).toISOString();
        const nextMatrix: Record<string, { count: number; statuses: Record<string, number> }> = {};
        const nextSlotsByCell: Record<string, any[]> = {};
        const times = new Set<string>();
        let page = 0;
        const size = 200;

        while (true) {
          const response = await triggerAppointmentsByDepartment({
            departmentId: depId,
            startDatetime: startIso,
            endDatetime: endIso,
            page,
            size,
            sort: "id,asc",
            timestamp: Date.now()
          }).unwrap();

          const rows = response?.data ?? [];
          rows.forEach((row: any) => {
            if (scopeUpper === "SPECIFIC_RESOURCE" && effectiveResourceId > 0) {
              const rowResourceId = Number(
                row?.resourceId ??
                row?.resource?.id ??
                0
              );
              if (rowResourceId !== effectiveResourceId) return;
            }
            const rawStart = row?.startDatetime ?? row?.appointmentDateTime;
            if (!rawStart) return;
            const d = new Date(rawStart);
            if (Number.isNaN(d.getTime())) return;
            const dateKey = formatLocalDateForApi(d);
            if (!dateKey) return;
            const timeKey = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
            const cellKey = `${dateKey}|${timeKey}`;
            const status = String(row?.status ?? "").toUpperCase() || "UNKNOWN";
            if (!nextMatrix[cellKey]) nextMatrix[cellKey] = { count: 0, statuses: {} };
            nextMatrix[cellKey].count += 1;
            nextMatrix[cellKey].statuses[status] = (nextMatrix[cellKey].statuses[status] ?? 0) + 1;
            if (!nextSlotsByCell[cellKey]) nextSlotsByCell[cellKey] = [];
            nextSlotsByCell[cellKey].push(row);
            times.add(timeKey);
          });

          if (!response?.links?.next || rows.length === 0) break;
          page += 1;
        }

        if (mounted) {
          setMatrix(nextMatrix);
          setSlotsByCell(nextSlotsByCell);
          setTimeRows(Array.from(times).sort((a, b) => timeToMinutes(a) - timeToMinutes(b)));
        }
      } catch {
        if (mounted) {
          setMatrix({});
          setSlotsByCell({});
          setTimeRows([]);
        }
      } finally {
        if (mounted) setIsLoadingCounts(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [
    effectiveDepartmentId,
    effectiveResourceId,
    scopeUpper,
    startDate,
    endDate,
    triggerAppointmentsByDepartment
  ]);

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <PreviewSlotsCardSection
        startDate={startDate}
        endDate={endDate}
        periodDays={periodDays}
        timeRows={timeRows}
        matrix={matrix}
        getStatusColor={getStatusColor}
        statusLegendItems={statusLegendItems}
        isLoadingCounts={isLoadingCounts}
        selectedCellKey={selectedCellKey}
        slotsByCell={slotsByCell}
        onCellClick={onSlotCellSelect}
      />

      <PreviewSummarySection
        templateId={effectiveTemplateId || null}
        templateDurationMinutes={effectiveTemplateDurationMinutes || null}
        dto={dto}
      />
    </div>
  );
};

export default PreviewSlotsSection;
