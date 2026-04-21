import * as React from "react";
import MyBadgeStatus from "@/components/MyBadgeStatus/MyBadgeStatus";
import { Progress } from "@/components/ui/progress";
import {
  Info,
  CalendarDays,
  Clock3,
  ListTree
} from "lucide-react";
import { Pill, SurfaceCard } from "./shared";
import type { AvailabilityGenerationBatchApplyDTO } from "@/types/model-types-new";
import { formatDateWithoutSeconds, formatEnumString } from "@/utils";
import { useGetDepartmentByIdQuery } from "@/services/security/departmentService";
import { useGetPractitionerByIdQuery } from "@/services/setup/practitioner/PractitionerService";
import { useGetAvailabilityGenerationBatchByIdQuery } from "@/services/appointment/availabilityGenerationBatchService/availabilityGenerationBatchService";
import { useGetAvailabilityTemplateQuery } from "@/services/appointment/availabilityTemplateService";

const SlotDetailsSection: React.FC<{
  dto?: AvailabilityGenerationBatchApplyDTO;
  setDto?: React.Dispatch<React.SetStateAction<AvailabilityGenerationBatchApplyDTO>>;
  selectedCell?: { dateKey: string; timeLabel: string } | null;
  selectedCellSlots?: any[];
  selectedSlot?: any | null;
  onSelectSlot?: (slot: any) => void;
}> = ({ dto, setDto, selectedCell, selectedCellSlots = [], selectedSlot, onSelectSlot }) => {
  void dto;
  void setDto;

  const statusColor = React.useMemo(() => {
    const s = String(selectedSlot?.status ?? "").toUpperCase();
    if (s.includes("BOOK")) return "#059669";
    if (s.includes("CONFIRM")) return "#166534";
    if (s.includes("COMPLETE")) return "#6DA7E8";
    if (s.includes("NEW")) return "#4B7BEC";
    if (s.includes("CHECK")) return "#F5B971";
    if (s.includes("NO_SHOW") || s.includes("NO-SHOW")) return "#E8CF5A";
    if (s.includes("IN_SERVICE") || s.includes("IN SERVICE")) return "#7C8BF3";
    if (s.includes("CANCEL")) return "#F87171";
    return "#C8D1E1";
  }, [selectedSlot?.status]);

  const slotTimeRange = React.useMemo(() => {
    const start = selectedSlot?.startDatetime ?? selectedSlot?.appointmentDateTime;
    const end = selectedSlot?.endDatetime;
    if (!start && !end) return "-";
    if (!end) return formatDateWithoutSeconds(start);
    return `${formatDateWithoutSeconds(start)} - ${formatDateWithoutSeconds(end)}`;
  }, [selectedSlot]);

  const cellDateTimeRange = React.useMemo(() => {
    const preferred = selectedSlot ?? selectedCellSlots?.[0];
    const start = preferred?.startDatetime ?? preferred?.appointmentDateTime;
    const end = preferred?.endDatetime;
    if (!start && !end) return selectedCell ? `${selectedCell.dateKey} · ${selectedCell.timeLabel}` : "-";
    if (!end) return formatDateWithoutSeconds(start);
    return `${formatDateWithoutSeconds(start)} - ${formatDateWithoutSeconds(end)}`;
  }, [selectedSlot, selectedCellSlots, selectedCell]);

  const departmentId = React.useMemo(() => {
    const raw =
      selectedSlot?.departmentId ??
      selectedSlot?.departmentKey ??
      selectedSlot?.department?.id ??
      selectedSlot?.department?.key ??
      null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [selectedSlot]);

  const defaultPractitionerId = React.useMemo(() => {
    const raw =
      selectedSlot?.defaultPractitionerId ??
      selectedSlot?.defaultPractitioner?.id ??
      selectedSlot?.defaultPractitioner?.key ??
      null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [selectedSlot]);

  const { data: departmentById } = useGetDepartmentByIdQuery(departmentId as any, {
    skip: !departmentId
  });
  const { data: practitionerById } = useGetPractitionerByIdQuery(defaultPractitionerId as any, {
    skip: !defaultPractitionerId
  });

  const capacitySource = React.useMemo(() => {
    return selectedSlot ?? selectedCellSlots?.[0] ?? null;
  }, [selectedSlot, selectedCellSlots]);

  const availabilityGenerationBatchId = React.useMemo(() => {
    const raw =
      capacitySource?.availabilityGenerationBatchId ??
      capacitySource?.generationBatchId ??
      capacitySource?.batchId ??
      capacitySource?.availabilityGenerationBatch?.id ??
      null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [capacitySource]);

  const { data: generationBatchById } = useGetAvailabilityGenerationBatchByIdQuery(
    availabilityGenerationBatchId as any,
    { skip: !availabilityGenerationBatchId }
  );

  const templateIdFromBatch = React.useMemo(() => {
    const raw = (generationBatchById as any)?.templateId ?? (generationBatchById as any)?.template?.id ?? null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [generationBatchById]);

  const { data: templateById } = useGetAvailabilityTemplateQuery(
    { id: templateIdFromBatch as any },
    { skip: !templateIdFromBatch }
  );

  const parallelCapacityValue = React.useMemo(() => {
    const fromTemplate = Number((templateById as any)?.parallelCapacityValue ?? NaN);
    if (Number.isFinite(fromTemplate) && fromTemplate > 0) {
      return fromTemplate;
    }

    const raw =
      capacitySource?.parallelCapacityValue ??
      capacitySource?.templateParallelCapacityValue ??
      capacitySource?.availabilityTemplateParallelCapacityValue ??
      capacitySource?.availabilityTemplate?.parallelCapacityValue ??
      null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [capacitySource, templateById]);





  const capacityIndex = React.useMemo(() => {
    const n = Number(selectedSlot?.capacityIndex ?? 0);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [selectedSlot?.capacityIndex]);

  const capacityPercent = React.useMemo(() => {
    if (!parallelCapacityValue) return 0;
    return Math.max(0, Math.min(100, (capacityIndex / parallelCapacityValue) * 100));
  }, [capacityIndex, parallelCapacityValue]);

  return (
    <SurfaceCard
      title="Slot Details"
      description="Detailed information for the selected preview slot"
      icon={Info}
      headerAction={
        selectedSlot?.status ? (
          <MyBadgeStatus color={statusColor} contant={formatEnumString(selectedSlot.status)} />
        ) : null
      }
    >
      <div className="space-y-5">
        {!selectedCell ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            Select a slot cell from preview to see slot list and details.
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                {cellDateTimeRange}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ListTree className="h-4 w-4 text-slate-500" />
                Slots in this cell ({selectedCellSlots.length})
              </div>
              <div className="max-h-[170px] space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
                {selectedCellSlots.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-slate-500">No slots in this selection.</div>
                ) : (
                  selectedCellSlots.map((slot: any, idx: number) => {
                    const slotId = slot?.id ?? `${slot?.startDatetime ?? slot?.appointmentDateTime}-${idx}`;
                    const isActive = (selectedSlot?.id ?? null) === (slot?.id ?? null) && selectedSlot?.id != null;
                    return (
                      <button
                        key={String(slotId)}
                        type="button"
                        onClick={() => onSelectSlot?.(slot)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left ${
                          isActive ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-white"
                        }`}
                      >
                        <span className="text-xs font-medium text-slate-700">
                          #{slot?.id ?? "-"} · {formatEnumString(slot?.status ?? "-")}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {slot?.startDatetime ? formatDateWithoutSeconds(slot.startDatetime) : "-"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Clock3 className="h-4 w-4 text-slate-500" />
                Selected Slot Details
              </div>
              {!selectedSlot ? (
                <div className="text-xs text-slate-500">Select a specific slot from the list above.</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {(departmentById as any)?.name || selectedSlot?.departmentName || "Department -"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Capacity: {capacityIndex}/{parallelCapacityValue || "-"} Appointments
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Practitioner:{" "}
                        {(practitionerById as any)?.fullName ||
                          [(practitionerById as any)?.firstName, (practitionerById as any)?.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                          selectedSlot?.defaultPractitionerName ||
                          "Default Practitioner -"}
                      </div>
                    </div>
                    <Pill className="bg-sky-100 text-sky-700">
                      {formatEnumString(
                        selectedSlot?.resourceType ??
                          selectedSlot?.templateType ??
                          selectedSlot?.resource?.type ??
                          "DEPARTMENT"
                      )}
                    </Pill>
                  </div>
                  <Progress value={capacityPercent} className="h-2.5 bg-slate-200 [&>div]:bg-blue-600" />
                  <div className="grid grid-cols-1 gap-1 text-xs text-slate-700">
                    <div><span className="font-semibold">Deferred:</span> {String(selectedSlot?.deffered ?? selectedSlot?.deferred ?? "-")}</div>
                    <div><span className="font-semibold">Deferred At:</span> {selectedSlot?.defferedAt ? formatDateWithoutSeconds(selectedSlot.defferedAt) : "-"}</div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </SurfaceCard>
  );
};

export default SlotDetailsSection;
