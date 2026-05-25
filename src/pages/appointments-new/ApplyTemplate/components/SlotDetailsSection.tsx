import * as React from "react";
import MyBadgeStatus from "@/components/MyBadgeStatus/MyBadgeStatus";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Info,
  CalendarDays,
  Clock3,
  ListTree,
  ShieldCheck,
  X,
  Check,
} from "lucide-react";
import { Pill, SurfaceCard } from "./shared";
import type { AvailabilityGenerationBatchApplyDTO } from "@/types/model-types-new";
import { formatDateWithoutSeconds, formatEnumString } from "@/utils";
import { useGetDepartmentByIdQuery } from "@/services/security/departmentService";
import { useGetPractitionerByIdQuery } from "@/services/setup/practitioner/PractitionerService";
import { useGetAvailabilityGenerationBatchByIdQuery } from "@/services/appointment/availabilityGenerationBatchService/availabilityGenerationBatchService";
import { useGetAvailabilityTemplateQuery } from "@/services/appointment/availabilityTemplateService";
import { useAppSelector } from "@/hooks";
import { useGetAppointmentPolicyAssignmentsByAppointmentIdQuery } from "@/services/appointment/appointmnetPolicyAssignment/appointmentPolicyAssignmentService";

const SlotDetailsSection: React.FC<{
  dto?: AvailabilityGenerationBatchApplyDTO;
  setDto?: React.Dispatch<React.SetStateAction<AvailabilityGenerationBatchApplyDTO>>;
  selectedCell?: { dateKey: string; timeLabel: string } | null;
  selectedCellSlots?: any[];
  selectedSlot?: any | null;
  onSelectSlot?: (slot: any) => void;
}> = ({
  dto,
  setDto,
  selectedCell,
  selectedCellSlots = [],
  selectedSlot,
  onSelectSlot,
}) => {
    void dto;
    void setDto;

    const mode = useAppSelector((state: any) => state.ui.mode);
    const isDark = mode === "dark";

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

      if (!start && !end) {
        return selectedCell
          ? `${selectedCell.dateKey}· ${selectedCell.timeLabel}`
          : "-";
      }

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
      skip: !departmentId,
    });

    const { data: practitionerById } = useGetPractitionerByIdQuery(
      defaultPractitionerId as any,
      {
        skip: !defaultPractitionerId,
      }
    );

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
      {
        skip: !availabilityGenerationBatchId,
      }
    );

    const templateIdFromBatch = React.useMemo(() => {
      const raw =
        (generationBatchById as any)?.templateId ??
        (generationBatchById as any)?.template?.id ??
        null;

      const n = Number(raw);

      return Number.isFinite(n) && n > 0 ? n : null;
    }, [generationBatchById]);

    const { data: templateById } = useGetAvailabilityTemplateQuery(
      {
        id: templateIdFromBatch as any,
      },
      {
        skip: !templateIdFromBatch,
      }
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

      return Math.max(
        0,
        Math.min(100, (capacityIndex / parallelCapacityValue) * 100)
      );
    }, [capacityIndex, parallelCapacityValue]);

    const selectedAppointmentId = React.useMemo(() => {
      const raw =
        selectedSlot?.id ??
        selectedSlot?.appointmentId ??
        selectedSlot?.appointment?.id ??
        null;

      const n = Number(raw);

      return Number.isFinite(n) && n > 0 ? n : null;
    }, [selectedSlot]);

    const {
      data: appointmentPolicyAssignments = [],
      isFetching: isLoadingAppointmentPolicies,
    } = useGetAppointmentPolicyAssignmentsByAppointmentIdQuery(
      selectedAppointmentId as any,
      {
        skip: !selectedAppointmentId,
      }
    );

    const getPolicyDisplayName = React.useCallback((policyAssignment: any) => {
      const code = policyAssignment?.policyCode ?? "";
      const name = policyAssignment?.policyName ?? "";

      if (code && name) {
        return `${code} ${name}`;
      }

      if (name) {
        return name;
      }

      if (code) {
        return code;
      }

      if (policyAssignment?.policyId) {
        return `Policy #${policyAssignment.policyId}`;
      }

      return "Policy";
    }, []);

    const isPolicyRequired = React.useCallback((policyAssignment: any) => {
      return Boolean(policyAssignment?.isRequired);
    }, []);

    const isPolicyApplied = React.useCallback((policyAssignment: any) => {
      return Boolean(policyAssignment?.isApplied);
    }, []);

    return (
      <SurfaceCard
        title="Slot Details"
        description="Detailed information for the selected preview slot"
        icon={Info}
        headerAction={
          selectedSlot?.status ? (
            <MyBadgeStatus
              color={statusColor}
              contant={formatEnumString(selectedSlot.status)}
            />
          ) : null
        }
      >
        <div className="space-y-5">
          {!selectedCell ? (
            <div
              className={cn(
                "rounded-xl border border-dashed px-4 py-8 text-center text-sm",
                isDark
                  ? "border-zinc-700 text-zinc-300"
                  : "border-slate-300 text-slate-500"
              )}
              style={
                isDark
                  ? {
                    backgroundColor: "var(--dark-black)",
                    borderColor: "#3d3d3d",
                    color: "var(--white)",
                  }
                  : undefined
              }
            >
              Select a slot cell from preview to see slot list and details.
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "rounded-xl border px-4 py-3 transition-colors",
                  isDark
                    ? "border-zinc-700 bg-zinc-950/60"
                    : "border-slate-200 bg-slate-50"
                )}
                style={
                  isDark
                    ? {
                      backgroundColor: "var(--dark-black)",
                      borderColor: "#3d3d3d",
                    }
                    : undefined
                }
              >
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm font-semibold",
                    isDark ? "text-zinc-100" : "text-slate-700"
                  )}
                >
                  <CalendarDays
                    className={cn(
                      "h-4 w-4",
                      isDark ? "text-zinc-400" : "text-slate-500"
                    )}
                  />
                  {cellDateTimeRange}
                </div>
              </div>

              <div>
                <div
                  className={cn(
                    "mb-3 flex items-center gap-2 text-sm font-semibold",
                    isDark ? "text-zinc-100" : "text-slate-700"
                  )}
                >
                  <ListTree
                    className={cn(
                      "h-4 w-4",
                      isDark ? "text-zinc-400" : "text-slate-500"
                    )}
                  />
                  Slots in this cell ({selectedCellSlots.length})
                </div>

                <div
                  className={cn(
                    "max-h-[170px] space-y-2 overflow-y-auto rounded-xl border p-2 transition-colors",
                    isDark
                      ? "border-zinc-700 bg-zinc-950/60"
                      : "border-slate-200 bg-white"
                  )}
                  style={
                    isDark
                      ? {
                        backgroundColor: "var(--extra-dark-black)",
                        borderColor: "#3d3d3d",
                      }
                      : undefined
                  }
                >
                  {selectedCellSlots.length === 0 ? (
                    <div
                      className={cn(
                        "px-2 py-3 text-xs",
                        isDark ? "text-zinc-400" : "text-slate-500"
                      )}
                    >
                      No slots in this selection.
                    </div>
                  ) : (
                    selectedCellSlots.map((slot: any, idx: number) => {
                      const slotId =
                        slot?.id ??
                        `${slot?.startDatetime ?? slot?.appointmentDateTime}-${idx}`;

                      const isActive =
                        (selectedSlot?.id ?? null) === (slot?.id ?? null) &&
                        selectedSlot?.id != null;

                      return (
                        <button
                          key={String(slotId)}
                          type="button"
                          onClick={() => onSelectSlot?.(slot)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors",
                            isActive
                              ? isDark
                                ? "border-emerald-400 bg-emerald-500/10"
                                : "border-sky-400 bg-sky-50"
                              : isDark
                                ? "border-zinc-700 bg-zinc-950/70"
                                : "border-slate-200 bg-white"
                          )}
                          style={
                            isDark
                              ? {
                                backgroundColor: isActive
                                  ? "rgba(16,185,129,0.1)"
                                  : "var(--dark-black)",
                                borderColor: isActive ? "#34d399" : "#3d3d3d",
                              }
                              : undefined
                          }
                        >
                          <span
                            className={cn(
                              "text-xs font-medium",
                              isDark ? "text-zinc-100" : "text-slate-700"
                            )}
                          >
                            #{slot?.id ?? "-"}·{" "}
                            {formatEnumString(slot?.status ?? "-")}
                          </span>

                          <span
                            className={cn(
                              "text-[11px]",
                              isDark ? "text-zinc-400" : "text-slate-500"
                            )}
                          >
                            {slot?.startDatetime
                              ? formatDateWithoutSeconds(slot.startDatetime)
                              : "-"}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "rounded-2xl border p-4 transition-colors",
                  isDark
                    ? "border-zinc-700 bg-zinc-950/60"
                    : "border-slate-200 bg-slate-50"
                )}
                style={
                  isDark
                    ? {
                      backgroundColor: "var(--dark-black)",
                      borderColor: "#3d3d3d",
                    }
                    : undefined
                }
              >
                <div
                  className={cn(
                    "mb-2 flex items-center gap-2 text-sm font-semibold",
                    isDark ? "text-zinc-100" : "text-slate-700"
                  )}
                >
                  <Clock3
                    className={cn(
                      "h-4 w-4",
                      isDark ? "text-zinc-400" : "text-slate-500"
                    )}
                  />
                  Selected Slot Details
                </div>

                {!selectedSlot ? (
                  <div
                    className={cn(
                      "text-xs",
                      isDark ? "text-zinc-400" : "text-slate-500"
                    )}
                  >
                    Select a specific slot from the list above.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div
                          className={cn(
                            "text-sm font-semibold",
                            isDark ? "text-zinc-100" : "text-slate-900"
                          )}
                        >
                          {(departmentById as any)?.name ||
                            selectedSlot?.departmentName ||
                            "Department -"}
                        </div>

                        <div
                          className={cn(
                            "mt-1 text-xs",
                            isDark ? "text-zinc-400" : "text-slate-500"
                          )}
                        >
                          Capacity: {capacityIndex}/{parallelCapacityValue || "-"}{" "}
                          Appointments
                        </div>

                        <div
                          className={cn(
                            "mt-1 text-xs",
                            isDark ? "text-zinc-400" : "text-slate-500"
                          )}
                        >
                          Practitioner:{" "}
                          {(practitionerById as any)?.fullName ||
                            [
                              (practitionerById as any)?.firstName,
                              (practitionerById as any)?.lastName,
                            ]
                              .filter(Boolean)
                              .join(" ") ||
                            selectedSlot?.defaultPractitionerName ||
                            "Default Practitioner -"}
                        </div>
                      </div>

                      <Pill
                        className={
                          isDark
                            ? "bg-emerald-500/10 text-emerald-200"
                            : "bg-sky-100 text-sky-700"
                        }
                      >
                        {formatEnumString(
                          selectedSlot?.resourceType ??
                          selectedSlot?.templateType ??
                          selectedSlot?.resource?.type ??
                          "DEPARTMENT"
                        )}
                      </Pill>
                    </div>

                    <Progress
                      value={capacityPercent}
                      className={cn(
                        "h-2.5",
                        isDark
                          ? "bg-zinc-700 [&>div]:bg-emerald-400"
                          : "bg-slate-200 [&>div]:bg-blue-600"
                      )}
                    />

                    <div
                      className={cn(
                        "grid grid-cols-1 gap-1 text-xs",
                        isDark ? "text-zinc-200" : "text-slate-700"
                      )}
                    >
                      <div>
                        <span className="font-semibold">Deferred:</span>{" "}
                        {String(
                          selectedSlot?.deffered ?? selectedSlot?.deferred ?? "-"
                        )}
                      </div>

                      <div>
                        <span className="font-semibold">Deferred At:</span>{" "}
                        {selectedSlot?.defferedAt
                          ? formatDateWithoutSeconds(selectedSlot.defferedAt)
                          : "-"}
                      </div>

                      <div>
                        <span className="font-semibold">Time Range:</span>{" "}
                        {slotTimeRange}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={cn(
                  "rounded-2xl border p-4 transition-colors",
                  isDark
                    ? "border-zinc-700 bg-zinc-950/60"
                    : "border-slate-200 bg-slate-50"
                )}
                style={
                  isDark
                    ? {
                      backgroundColor: "var(--dark-black)",
                      borderColor: "#3d3d3d",
                    }
                    : undefined
                }
              >
                <div
                  className={cn(
                    "mb-3 text-sm font-semibold",
                    isDark ? "text-zinc-100" : "text-slate-700"
                  )}
                >
                  Policies:
                </div>

                {!selectedSlot ? (
                  <div
                    className={cn(
                      "text-xs",
                      isDark ? "text-zinc-400" : "text-slate-500"
                    )}
                  >
                    Select a specific slot from the list above to view policies.
                  </div>
                ) : !selectedAppointmentId ? (
                  <div
                    className={cn(
                      "text-xs",
                      isDark ? "text-zinc-400" : "text-slate-500"
                    )}
                  >
                    This slot does not have an appointment id.
                  </div>
                ) : isLoadingAppointmentPolicies ? (
                  <div
                    className={cn(
                      "text-xs",
                      isDark ? "text-zinc-400" : "text-slate-500"
                    )}
                  >
                    Loading policies...
                  </div>
                ) : appointmentPolicyAssignments.length === 0 ? (
                  <div
                    className={cn(
                      "text-xs",
                      isDark ? "text-zinc-400" : "text-slate-500"
                    )}
                  >
                    No policies assigned to this slot.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {appointmentPolicyAssignments.map((policyAssignment: any) => {
                      const required = isPolicyRequired(policyAssignment);
                      const applied = isPolicyApplied(policyAssignment);

                      return (
                        <div
                          key={`slot-policy-${policyAssignment?.id ?? policyAssignment?.policyId
                            }`}
                          className={cn(
                            "flex items-center justify-between rounded-lg border px-3 py-2 text-xs",
                            isDark
                              ? "border-violet-800 bg-violet-950/30"
                              : "border-violet-100 bg-violet-50"
                          )}
                          style={
                            isDark
                              ? {
                                borderColor: "#4c1d95",
                                backgroundColor: "rgba(76, 29, 149, 0.25)",
                              }
                              : undefined
                          }
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck
                              className={cn(
                                "h-4 w-4",
                                isDark ? "text-violet-300" : "text-violet-700"
                              )}
                            />

                            <span
                              className={cn(
                                "font-semibold",
                                isDark ? "text-zinc-100" : "text-slate-800"
                              )}
                            >
                              {getPolicyDisplayName(policyAssignment)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {required && (
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                  isDark
                                    ? "bg-zinc-800 text-zinc-200"
                                    : "bg-white text-slate-600"
                                )}
                              >
                                Required
                              </span>
                            )}

                            <span
                              title={applied ? "Applied" : "Not Applied"}
                              className={cn(
                                "inline-flex h-6 w-6 items-center justify-center rounded-full",
                                applied
                                  ? isDark
                                    ? "bg-emerald-900 text-emerald-200"
                                    : "bg-emerald-100 text-emerald-700"
                                  : isDark
                                    ? "bg-red-900 text-red-200"
                                    : "bg-red-100 text-red-700"
                              )}
                            >
                              {applied ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
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