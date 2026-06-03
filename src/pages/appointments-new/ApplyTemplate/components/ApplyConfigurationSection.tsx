import * as React from "react";
import MyInput from "@/components/MyInput";
import { Form } from "rsuite";
import {
  Settings2,
  TriangleAlert,
  X,
  ShieldCheck,
} from "lucide-react";
import { SurfaceCard } from "./shared";
import { useEnumOptions } from "@/services/enumsApi";
import type {
  AvailabilityGenerationBatchApplyDTO,
  AvailabilityTemplateIntervalResponseVM,
  PolicyAssignment,
  PolicyResourceType,
} from "@/types/model-types-new";
import { useGetAvailabilityTemplatesByParentTemplateIdQuery } from "@/services/appointment/availabilityTemplateService";
import { useGetActiveHolidaysInRangeQuery } from "@/services/system-configurations/organizationHolidaysService";
import { useLazyGetAvailabilityTemplateIntervalsByTemplateAndDayQuery } from "@/services/appointment/availabilityTemplate/availabilityTemplateInterval";
import { useGetEffectiveActivePolicyAssignmentsQuery } from "@/services/setup/policyAssignment/policyAssignmentService";
import { useAppSelector } from "@/hooks";
import { formatEnumString } from "@/utils";
import { formatLocalDateForApi } from "../applyTemplateDateUtils";
import MyModal from "@/components/MyModal/MyModal";
import MyButton from "@/components/MyButton/MyButton";

export type EffectiveTemplateIntervalsStatus = {
  effectiveTemplateId: number;
  isLoading: boolean;
  hasAnyInterval: boolean;
};

type ApplyConfigurationSectionProps = {
  dto: AvailabilityGenerationBatchApplyDTO;
  setDto: React.Dispatch<React.SetStateAction<AvailabilityGenerationBatchApplyDTO>>;

  /** Used by step one to disable Next until the apply template has at least one interval. */
  onEffectiveTemplateIntervalsStatus?: (status: EffectiveTemplateIntervalsStatus) => void;

  /** Prefer template facility for org holidays and policy assignment API. */
  templateFacilityId?: number | null;

  /**
   * Pass the selected parent template from the parent screen.
   * Needed to get departmentId when scope is DEPARTMENT.
   */
  selectedTemplate?: any;
};

const ApplyConfigurationSection: React.FC<ApplyConfigurationSectionProps> = ({
  dto,
  setDto,
  onEffectiveTemplateIntervalsStatus,
  templateFacilityId,
  selectedTemplate,
}) => {
  const isDark = useAppSelector((state: any) => state.ui.mode === "dark");

  const surfaceStyle = isDark
    ? {
      backgroundColor: "var(--dark-black)",
      borderColor: "#3d3d3d",
      color: "var(--white)",
    }
    : undefined;

  const selectedDepartment = useAppSelector(
    (s) => (s as any)?.auth?.selectedDepartment
  );

  const facilityIdFromAuth =
    selectedDepartment?.facilityId ??
    selectedDepartment?.facility?.id ??
    selectedDepartment?.facility?.facilityId ??
    null;

  const facilityIdForHolidays =
    templateFacilityId != null && Number(templateFacilityId) > 0
      ? Number(templateFacilityId)
      : Number(facilityIdFromAuth ?? 0);

  const enumOptions = (useEnumOptions("AvailabilityGenerationScope") as any[]) ?? [];
  const holidayHandlingModeEnumOptions =
    (useEnumOptions("HolidayHandlingMode") as any[]) ?? [];

  const options = React.useMemo(
    () =>
      enumOptions.map((o: any) =>
        typeof o === "string"
          ? { value: o, label: o }
          : { value: o.value, label: o.label ?? o.value }
      ),
    [enumOptions]
  );

  const [checks, setChecks] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const selectedScope = String((dto as any)?.scope ?? "").toUpperCase();

    const nextChecks = Object.fromEntries(
      options.map((opt) => {
        const value = String(opt.value).toUpperCase();
        return [String(opt.value), value === selectedScope];
      })
    ) as Record<string, boolean>;

    setChecks((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(nextChecks);

      if (
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[key] === nextChecks[key])
      ) {
        return prev;
      }

      return nextChecks;
    });
  }, [dto?.scope, options]);

  const selectedScopeUpper = String((dto as any)?.scope ?? "").toUpperCase();

  const isSpecificScope = selectedScopeUpper === "SPECIFIC_RESOURCE";
  const isDepartmentScope = selectedScopeUpper === "DEPARTMENT";

  const parentId = dto?.templateId ?? 0;

  const { data: childTemplates = [], isFetching: isLoadingChildren } =
    useGetAvailabilityTemplatesByParentTemplateIdQuery(
      { parentTemplateId: parentId },
      { skip: !isSpecificScope || !parentId }
    );

  const childOptions = (childTemplates as any[]).map((t) => ({
    id: t?.id,
    label: t?.templateName ?? `Template #${t?.id}`,
  }));

  const selectedChildTemplateId = Number((dto as any)?.childTemplateId ?? 0);

  const selectedChildTemplate = React.useMemo(
    () =>
      (childTemplates as any[]).find(
        (template) => Number(template?.id) === Number(selectedChildTemplateId)
      ),
    [childTemplates, selectedChildTemplateId]
  );

  /** Matches apply logic: parent template unless scope is specific resource. */
  const effectiveTemplateIdForIntervals = isSpecificScope
    ? selectedChildTemplateId
    : Number(dto?.templateId ?? 0);

  const [intervalsByDay, setIntervalsByDay] = React.useState<
    Record<string, AvailabilityTemplateIntervalResponseVM[]>
  >({});

  const [isLoadingIntervals, setIsLoadingIntervals] = React.useState(false);

  const [loadIntervalsByTemplateAndDay] =
    useLazyGetAvailabilityTemplateIntervalsByTemplateAndDayQuery();

  const dayOfWeekOptions = useEnumOptions("DayOfWeek") as any[] | undefined;

  const daysToQuery = React.useMemo(() => {
    const normalized = (dayOfWeekOptions ?? []).map((d: any) =>
      typeof d === "string" ? d : d?.value ?? d?.label
    );

    return normalized.length > 0
      ? normalized.map((d: any) => String(d).toUpperCase())
      : [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ];
  }, [dayOfWeekOptions]);

  React.useEffect(() => {
    let mounted = true;

    const loadIntervals = async () => {
      if (!effectiveTemplateIdForIntervals) {
        if (mounted) {
          setIntervalsByDay({});
          setIsLoadingIntervals(false);
        }

        return;
      }

      setIsLoadingIntervals(true);

      const nextMap: Record<string, AvailabilityTemplateIntervalResponseVM[]> = {};

      await Promise.all(
        daysToQuery.map(async (dayOfWeek) => {
          try {
            const rows = await loadIntervalsByTemplateAndDay({
              templateId: effectiveTemplateIdForIntervals,
              dayOfWeek,
            }).unwrap();

            nextMap[dayOfWeek] = rows ?? [];
          } catch {
            nextMap[dayOfWeek] = [];
          }
        })
      );

      if (mounted) {
        setIntervalsByDay(nextMap);
        setIsLoadingIntervals(false);
      }
    };

    void loadIntervals();

    return () => {
      mounted = false;
    };
  }, [
    effectiveTemplateIdForIntervals,
    loadIntervalsByTemplateAndDay,
    daysToQuery.join("|"),
  ]);

  const hasAnyInterval = React.useMemo(
    () => daysToQuery.some((day) => (intervalsByDay[day] ?? []).length > 0),
    [daysToQuery, intervalsByDay]
  );

  React.useEffect(() => {
    onEffectiveTemplateIntervalsStatus?.({
      effectiveTemplateId: effectiveTemplateIdForIntervals,
      isLoading: isLoadingIntervals,
      hasAnyInterval,
    });
  }, [
    effectiveTemplateIdForIntervals,
    isLoadingIntervals,
    hasAnyInterval,
    onEffectiveTemplateIntervalsStatus,
  ]);

  const fromDate = formatLocalDateForApi((dto as any)?.startDate);
  const toDate = formatLocalDateForApi((dto as any)?.endDate);

  const shouldFetchHolidays =
    facilityIdForHolidays > 0 && Boolean(fromDate) && Boolean(toDate);

  const { data: holidaysInRange = [], isFetching: isLoadingHolidays } =
    useGetActiveHolidaysInRangeQuery(
      {
        fromDate,
        toDate,
        facilityId: facilityIdForHolidays,
      },
      { skip: !shouldFetchHolidays }
    );

  /**
   * =============================
   * Policies to Apply
   * =============================
   */

  const mapTemplateTypeToPolicyResourceType = (
    templateType?: string | null
  ): PolicyResourceType | null => {
    const value = String(templateType ?? "").toUpperCase();

    switch (value) {
      case "DEPARTMENT":
        return "DEPARTMENT" as PolicyResourceType;

      case "PRACTITIONER":
        return "PRACTITIONER" as PolicyResourceType;

      case "SERVICE":
        return "SERVICE" as PolicyResourceType;

      case "DIAGNOSTIC_TEST":
        return "DIAGNOSTIC_TEST" as PolicyResourceType;

      case "LABORATORY":
        return "LABORATORY" as PolicyResourceType;

      case "RADIOLOGY":
        return "RADIOLOGY" as PolicyResourceType;

      default:
        return value ? (value as PolicyResourceType) : null;
    }
  };

  const policyResourceType = React.useMemo<PolicyResourceType | null>(() => {
    if (isDepartmentScope) {
      return "DEPARTMENT" as PolicyResourceType;
    }

    if (isSpecificScope) {
      return mapTemplateTypeToPolicyResourceType(
        selectedChildTemplate?.templateType ??
        selectedChildTemplate?.resourceType ??
        selectedChildTemplate?.type
      );
    }

    return null;
  }, [isDepartmentScope, isSpecificScope, selectedChildTemplate]);

  const policyResourceId = React.useMemo<number>(() => {
    if (isDepartmentScope) {
      return Number(
        selectedTemplate?.departmentId ??
          selectedTemplate?.resourceId ??
          selectedDepartment?.id ??
          selectedDepartment?.departmentId ??
          0
      );
    }
  
    if (isSpecificScope) {
      return Number(selectedChildTemplate?.resourceId ?? 0);
    }
  
    return 0;
  }, [
    isDepartmentScope,
    isSpecificScope,
    selectedTemplate,
    selectedDepartment,
    selectedChildTemplate,
  ]);

  const shouldFetchPolicyAssignments =
    facilityIdForHolidays > 0 &&
    Boolean(policyResourceType) &&
    policyResourceId > 0 &&
    (isDepartmentScope ||
      (isSpecificScope &&
        selectedChildTemplateId > 0 &&
        Boolean(selectedChildTemplate)));

  const departmentIdForPolicies = React.useMemo<number>(() => {
    return Number(
      selectedTemplate?.departmentId ??
      selectedTemplate?.resourceId ??
      selectedDepartment?.id ??
      selectedDepartment?.departmentId ??
      0
    );
  }, [selectedTemplate, selectedDepartment]);

  const {
    data: activePolicyAssignments = [],
    isFetching: isLoadingPolicyAssignments,
  } = useGetEffectiveActivePolicyAssignmentsQuery(
    {
      facilityId: facilityIdForHolidays,
      departmentId: departmentIdForPolicies,
      resourceType: policyResourceType as PolicyResourceType,
      resourceId: policyResourceId,
    },
    {
      skip:
        !shouldFetchPolicyAssignments ||
        facilityIdForHolidays <= 0 ||
        departmentIdForPolicies <= 0 ||
        !policyResourceType ||
        policyResourceId <= 0,
    }
  );

  const [isPolicyPickerOpen, setIsPolicyPickerOpen] = React.useState(false);
  const [policyPickerSelectionIds, setPolicyPickerSelectionIds] = React.useState<number[]>([]);

  React.useEffect(() => {
    setDto(
      (prev) =>
      ({
        ...(prev as any),
        policyAssignmentIds: [],
      } as any)
    );
  }, [policyResourceType, policyResourceId, setDto]);

  const selectedPolicyAssignmentIds = React.useMemo(
    () =>
      (((dto as any)?.policyAssignmentIds ?? []) as number[])
        .map((id) => Number(id))
        .filter(Boolean),
    [dto]
  );

  const getPolicyCode = (policyAssignment: any) =>
    policyAssignment?.policy?.code ??
    policyAssignment?.policyDefinition?.code ??
    policyAssignment?.policyCode ??
    "";

  const getPolicyName = (policyAssignment: any) =>
    policyAssignment?.policy?.name ??
    policyAssignment?.policyDefinition?.name ??
    policyAssignment?.policyName ??
    `Policy Assignment #${policyAssignment?.id}`;

  React.useEffect(() => {
    if (!shouldFetchPolicyAssignments) {
      setPolicyPickerSelectionIds([]);
      setDto(
        (prev) =>
        ({
          ...(prev as any),
          policyAssignmentIds: [],
        } as any)
      );
      return;
    }

    const availableIds = new Set(
      (activePolicyAssignments as PolicyAssignment[])
        .map((policyAssignment) => Number(policyAssignment.id))
        .filter(Boolean)
    );

    setDto((prev) => {
      const currentIds = (((prev as any)?.policyAssignmentIds ?? []) as number[])
        .map((id) => Number(id))
        .filter((id) => id > 0);
      const nextIds = currentIds.filter((id) => availableIds.has(id));

      if (nextIds.length === currentIds.length) {
        return prev;
      }

      return {
        ...(prev as any),
        policyAssignmentIds: nextIds,
      } as any;
    });
  }, [activePolicyAssignments, shouldFetchPolicyAssignments, setDto]);

  const selectedPolicyAssignments = React.useMemo(() => {
    return (activePolicyAssignments as PolicyAssignment[]).filter(
      (policyAssignment) =>
        selectedPolicyAssignmentIds.includes(Number(policyAssignment.id))
    );
  }, [activePolicyAssignments, selectedPolicyAssignmentIds]);

  const availablePolicyAssignments = React.useMemo(() => {
    return (activePolicyAssignments as PolicyAssignment[]).filter(
      (policyAssignment) =>
        !selectedPolicyAssignmentIds.includes(Number(policyAssignment.id))
    );
  }, [activePolicyAssignments, selectedPolicyAssignmentIds]);

  const canOpenPolicyPicker =
    shouldFetchPolicyAssignments &&
    !isLoadingPolicyAssignments &&
    (activePolicyAssignments as PolicyAssignment[]).length > 0;

  const openPolicyPicker = () => {
    if (!canOpenPolicyPicker) return;
    setPolicyPickerSelectionIds([]);
    setIsPolicyPickerOpen(true);
  };

  const handleAddSelectedPolicies = () => {
    if (policyPickerSelectionIds.length === 0) {
      setIsPolicyPickerOpen(false);
      return;
    }

    setDto((prev) => {
      const currentIds = (((prev as any)?.policyAssignmentIds ?? []) as number[])
        .map((id) => Number(id))
        .filter((id) => id > 0);
      const uniqueIds = Array.from(
        new Set([...currentIds, ...policyPickerSelectionIds.map((id) => Number(id)).filter((id) => id > 0)])
      );

      return {
        ...(prev as any),
        policyAssignmentIds: uniqueIds,
      } as any;
    });

    setIsPolicyPickerOpen(false);
    setPolicyPickerSelectionIds([]);
  };

  const handleRemovePolicyAssignment = (policyAssignmentId: number) => {
    setDto(
      (prev) =>
      ({
        ...(prev as any),
        policyAssignmentIds: (((prev as any)?.policyAssignmentIds ??
          []) as number[])
          .map((id) => Number(id))
          .filter((id) => id !== Number(policyAssignmentId)),
      } as any)
    );
  };

  return (
    <SurfaceCard
      title="Apply Configuration"
      description="Configure scope, resources, intervals and exceptions"
      icon={Settings2}
    >
      <div
        className="space-y-5"
        style={isDark ? { backgroundColor: "var(--extra-dark-black)" } : undefined}
      >
        <div style={isDark ? { backgroundColor: "var(--extra-dark-black)" } : undefined}>
          <p
            className="mb-3 text-sm font-semibold text-slate-700"
            style={isDark ? { color: "var(--white)" } : undefined}
          >
            Resource Scope
          </p>

          <div
            className="rounded-2xl border border-slate-200 bg-white p-4"
            style={surfaceStyle}
          >
            <Form fluid>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {options.map((opt) => {
                  const key = String(opt.value);

                  return (
                    <MyInput
                      key={key}
                      fieldName={key}
                      fieldLabel={opt.label}
                      showLabel={false}
                      fieldType="check"
                      record={checks}
                      setRecord={(r: any) => {
                        setChecks(() => {
                          const next: Record<string, boolean> = {};

                          for (const o of options) {
                            next[String(o.value)] = false;
                          }

                          next[key] = !!r[key];

                          setDto((prev) => ({
                            ...(prev as any),
                            scope: next[key] ? (opt.value as string) : ("" as any),
                            childTemplateId:
                              next[key] &&
                                String(opt.value).toUpperCase() === "SPECIFIC_RESOURCE"
                                ? (prev as any)?.childTemplateId ?? null
                                : null,
                            policyAssignmentIds: [],
                          }));

                          return next;
                        });
                      }}
                      label={opt.label}
                      width="100%"
                    />
                  );
                })}
              </div>
            </Form>

            {isSpecificScope && (
              <div className="mt-4 grid grid-cols-1 gap-3">
                <Form fluid>
                  <MyInput
                    fieldName="childTemplateId"
                    fieldLabel="Select Resource Template"
                    fieldType="select"
                    record={dto as any}
                    setRecord={(updated: any) =>
                      setDto(
                        (prev) =>
                        ({
                          ...(prev as any),
                          childTemplateId: updated.childTemplateId,
                          policyAssignmentIds: [],
                        } as any)
                      )
                    }
                    selectData={childOptions}
                    selectDataLabel="label"
                    selectDataValue="id"
                    width="100%"
                    cleanable={false}
                    searchable
                    loading={isLoadingChildren}
                    required
                  />
                </Form>
              </div>
            )}
          </div>
        </div>

        <div style={isDark ? { backgroundColor: "var(--extra-dark-black)" } : undefined}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p
              className="text-sm font-semibold text-slate-700"
              style={isDark ? { color: "var(--white)" } : undefined}
            >
              Policies to Apply
            </p>
            <MyButton
              onClick={openPolicyPicker}
              disabled={!canOpenPolicyPicker}
              appearance="subtle"
            >
              Add Policy
            </MyButton>
          </div>

          <div
            className="rounded-2xl border border-slate-200 bg-white p-4"
            style={surfaceStyle}
          >
            {!isDepartmentScope && !isSpecificScope && (
              <div
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500"
                style={
                  isDark
                    ? {
                      backgroundColor: "var(--extra-dark-black)",
                      borderColor: "#3d3d3d",
                      color: "var(--white)",
                    }
                    : undefined
                }
              >
                Select Department or Specific Resource to view available policies.
              </div>
            )}

            {isSpecificScope && !selectedChildTemplateId && (
              <div
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500"
                style={
                  isDark
                    ? {
                      backgroundColor: "var(--extra-dark-black)",
                      borderColor: "#3d3d3d",
                      color: "var(--white)",
                    }
                    : undefined
                }
              >
                Select a resource template first to view available policies.
              </div>
            )}

            {shouldFetchPolicyAssignments && isLoadingPolicyAssignments && (
              <div
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500"
                style={
                  isDark
                    ? {
                      backgroundColor: "var(--extra-dark-black)",
                      borderColor: "#3d3d3d",
                      color: "var(--white)",
                    }
                    : undefined
                }
              >
                Loading policies...
              </div>
            )}

            {shouldFetchPolicyAssignments &&
              !isLoadingPolicyAssignments &&
              selectedPolicyAssignments.length === 0 && (
                <div
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500"
                  style={
                    isDark
                      ? {
                        backgroundColor: "var(--extra-dark-black)",
                        borderColor: "#3d3d3d",
                        color: "var(--white)",
                      }
                      : undefined
                  }
                >
                  {(activePolicyAssignments as PolicyAssignment[]).length > 0
                    ? "No policies selected. Click Add Policy to choose."
                    : "No active policies found."}
                </div>
              )}

            {shouldFetchPolicyAssignments &&
              !isLoadingPolicyAssignments &&
              selectedPolicyAssignments.length > 0 && (
                <div className="space-y-2">
                  {selectedPolicyAssignments.map((policyAssignment: any) => {
                    const policyCode = getPolicyCode(policyAssignment);
                    const policyName = getPolicyName(policyAssignment);

                    return (
                      <div
                        key={`selected-policy-${policyAssignment.id}`}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                        style={surfaceStyle}
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-violet-700" />

                          <span
                            className="font-semibold text-slate-800"
                            style={isDark ? { color: "var(--white)" } : undefined}
                          >
                            {policyCode || policyName}
                          </span>

                          {policyCode && (
                            <span
                              className="text-slate-600"
                              style={isDark ? { color: "var(--white)" } : undefined}
                            >
                              {policyName}
                            </span>
                          )}

                          {policyAssignment.isRequired && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              Required
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemovePolicyAssignment(Number(policyAssignment.id))
                          }
                          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="Remove policy"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        </div>
        <MyModal
          open={isPolicyPickerOpen}
          setOpen={setIsPolicyPickerOpen}
          title="Select Policies"
          size="520px"
          bodyheight="50vh"
          content={
            <div className="space-y-2">
              {availablePolicyAssignments.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  No additional policies available for this resource.
                </div>
              )}
              {availablePolicyAssignments.map((policyAssignment: any) => {
                const policyCode = getPolicyCode(policyAssignment);
                const policyName = getPolicyName(policyAssignment);
                const assignmentId = Number(policyAssignment.id);
                const isChecked = policyPickerSelectionIds.includes(assignmentId);
                return (
                  <label
                    key={`policy-picker-${assignmentId}`}
                    className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setPolicyPickerSelectionIds((prev) => {
                          if (checked) return Array.from(new Set([...prev, assignmentId]));
                          return prev.filter((id) => id !== assignmentId);
                        });
                      }}
                      className="mt-0.5"
                    />
                    <span className="text-slate-700">
                      <span className="font-semibold">{policyCode || policyName}</span>
                      {policyCode ? ` - ${policyName}` : ""}
                    </span>
                  </label>
                );
              })}
            </div>
          }
          cancelButtonLabel="Cancel"
          actionButtonLabel="Add Selected"
          actionButtonFunction={handleAddSelectedPolicies}
        />

        <div style={isDark ? { backgroundColor: "var(--extra-dark-black)" } : undefined}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p
              className="text-sm font-semibold text-slate-700"
              style={isDark ? { color: "var(--white)" } : undefined}
            >
              Intervals (
              {isSpecificScope && selectedChildTemplateId > 0
                ? "Resource Template"
                : "Selected Template"}
              )
            </p>
          </div>

          <div className="space-y-2">
            {isLoadingIntervals && (
              <div
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600"
                style={surfaceStyle}
              >
                Loading intervals...
              </div>
            )}

            {!isLoadingIntervals && !effectiveTemplateIdForIntervals && (
              <div
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500"
                style={surfaceStyle}
              >
                Select a template to view intervals.
              </div>
            )}

            {!isLoadingIntervals &&
              effectiveTemplateIdForIntervals > 0 &&
              daysToQuery.map((day) => {
                const rows = intervalsByDay[day] ?? [];

                if (rows.length === 0) {
                  return null;
                }

                return (
                  <div
                    key={day}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    style={surfaceStyle}
                  >
                    <div
                      className="mb-2 text-xs font-semibold text-slate-500"
                      style={isDark ? { color: "var(--white)" } : undefined}
                    >
                      {day.replace("_", " ")}
                    </div>

                    <div className="space-y-2">
                      {rows.map((interval, idx) => (
                        <div
                          key={`${day}-${interval?.id ?? idx}`}
                          className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                          style={
                            isDark
                              ? {
                                backgroundColor: "var(--extra-dark-black)",
                                borderColor: "#3d3d3d",
                                color: "var(--white)",
                              }
                              : undefined
                          }
                        >
                          <span
                            className="font-medium text-slate-800"
                            style={isDark ? { color: "var(--white)" } : undefined}
                          >
                            {interval?.startTime ?? "--:--"} -{" "}
                            {interval?.endTime ?? "--:--"}
                          </span>

                          <span
                            className="mx-2 text-slate-300"
                            style={isDark ? { color: "var(--gray-dark)" } : undefined}
                          >
                            |
                          </span>

                          <span>
                            Duration: {interval?.slotDurationMinutes ?? "-"} min
                          </span>

                          <span
                            className="mx-2 text-slate-300"
                            style={isDark ? { color: "var(--gray-dark)" } : undefined}
                          >
                            |
                          </span>

                          <span>
                            Strategy:{" "}
                            {interval?.slotStrategy
                              ? formatEnumString(String(interval.slotStrategy))
                              : "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

            {!isLoadingIntervals &&
              effectiveTemplateIdForIntervals > 0 &&
              daysToQuery.every(
                (day) => (intervalsByDay[day] ?? []).length === 0
              ) && (
                <div
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500"
                  style={surfaceStyle}
                >
                  No intervals found for this template.
                </div>
              )}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p
              className="text-sm font-semibold text-slate-700"
              style={isDark ? { color: "var(--white)" } : undefined}
            >
              Exceptions
            </p>
          </div>

          <div className="space-y-2">
            {isLoadingHolidays && shouldFetchHolidays && (
              <div
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600"
                style={surfaceStyle}
              >
                Loading holidays for selected range...
              </div>
            )}

            {!isLoadingHolidays &&
              shouldFetchHolidays &&
              (holidaysInRange as any[])?.map((h: any) => (
                <div
                  key={`holiday-${h?.id}`}
                  className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-600" />

                    <div>
                      <div className="text-sm font-medium text-amber-900">
                        {h?.name ?? "Holiday"}
                      </div>

                      <div className="text-xs text-amber-700">
                        {h?.startDate} — {h?.endDate}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {!isLoadingHolidays &&
              (!shouldFetchHolidays || (holidaysInRange as any[])?.length === 0) && (
                <div
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500"
                  style={surfaceStyle}
                >
                  No Exceptions in the selected range.
                </div>
              )}
          </div>

          {!isLoadingHolidays &&
            shouldFetchHolidays &&
            (holidaysInRange as any[])?.length > 0 && (
              <div
                className="mt-4 rounded-2xl border border-slate-200 bg-white p-4"
                style={surfaceStyle}
              >
                <p
                  className="mb-3 text-sm font-semibold text-slate-700"
                  style={isDark ? { color: "var(--white)" } : undefined}
                >
                  Holiday Handling Mode
                </p>

                {!String((dto as any)?.holidayHandlingMode ?? "").trim() && (
                  <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                    <span>
                      Organization holidays apply in this date range. Choose one of
                      the options below before you can continue to the next step.
                    </span>
                  </div>
                )}

                <Form fluid>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {holidayHandlingModeEnumOptions.map((o: any) => {
                      const opt =
                        typeof o === "string"
                          ? { value: o, label: o }
                          : { value: o.value, label: o.label ?? o.value };

                      const key = String(opt.value);

                      const record: Record<string, boolean> = {
                        [key]:
                          String((dto as any)?.holidayHandlingMode ?? "") === key,
                      };

                      return (
                        <MyInput
                          key={key}
                          fieldName={key}
                          fieldLabel={opt.label}
                          showLabel={false}
                          fieldType="check"
                          record={record}
                          setRecord={(r: any) => {
                            const checked = !!r[key];

                            setDto((prev) => ({
                              ...prev,
                              holidayHandlingMode: checked
                                ? (opt.value as any)
                                : (null as any),
                            }));
                          }}
                          label={opt.label}
                          width="100%"
                        />
                      );
                    })}
                  </div>
                </Form>
              </div>
            )}
        </div>
      </div>
    </SurfaceCard>
  );
};

export default ApplyConfigurationSection;