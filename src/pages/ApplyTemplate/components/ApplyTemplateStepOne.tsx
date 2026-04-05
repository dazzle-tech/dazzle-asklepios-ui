import * as React from "react";
import MyInput from "@/components/MyInput";
import { useAppSelector } from "@/hooks";
import { useGetFacilityByIdQuery } from "@/services/security/facilityService";
import { useGetDepartmentByIdQuery } from "@/services/security/departmentService";
import { useGetActiveHolidaysInRangeQuery } from "@/services/system-configurations/organizationHolidaysService";
import ApplyConfigurationSection, {
  type EffectiveTemplateIntervalsStatus,
} from "./ApplyConfigurationSection";
import PreviewSlotsSection from "./PreviewSlotsSection";
import SlotDetailsSection from "./SlotDetailsSection";
import { Form } from "rsuite";
import { addMonths, isAfter, isBefore, startOfMinute } from "date-fns";
import type { AvailabilityTemplateResponseVM } from "@/types/model-types-new";
import type { AvailabilityGenerationBatchApplyDTO } from "@/types/model-types-new";
import { formatLocalDateForApi, parseApplyTemplateDateTime } from "../applyTemplateDateUtils";

type ApplyTemplateStepOneProps = {
  selectedTemplate?: AvailabilityTemplateResponseVM | null;
  dto?: AvailabilityGenerationBatchApplyDTO;
  setDto?: React.Dispatch<React.SetStateAction<AvailabilityGenerationBatchApplyDTO>>;
  onValidationChange?: (isValid: boolean) => void;
};

function validateDateRange(startRaw: unknown, endRaw: unknown): { ok: boolean; message: string } {
  const start = parseApplyTemplateDateTime(startRaw);
  const end = parseApplyTemplateDateTime(endRaw);
  if (!start || !end) {
    return { ok: false, message: "From and To date and time are required." };
  }
  const nowMinute = startOfMinute(new Date());
  if (isBefore(start, nowMinute)) {
    return { ok: false, message: "From must be the current time or in the future (not in the past)." };
  }
  if (isBefore(end, start)) {
    return { ok: false, message: "To must be on or after From." };
  }
  const maxEnd = addMonths(start, 2);
  if (isAfter(end, maxEnd)) {
    return { ok: false, message: "The range between From and To must not exceed 2 months." };
  }
  return { ok: true, message: "" };
}

const ApplyTemplateStepOne: React.FC<ApplyTemplateStepOneProps> = ({
  selectedTemplate,
  dto,
  setDto,
  onValidationChange,
}) => {
  const facilityId = selectedTemplate?.facilityId ?? null;
  const departmentId = selectedTemplate?.departmentId ?? null;
  const selectedDepartment = useAppSelector((s) => (s as any)?.auth?.selectedDepartment);
  const facilityIdFromAuth =
    selectedDepartment?.facilityId ??
    selectedDepartment?.facility?.id ??
    selectedDepartment?.facility?.facilityId ??
    null;
  const { data: facilityData } = useGetFacilityByIdQuery(facilityId as any, { skip: !facilityId });
  const { data: departmentData } = useGetDepartmentByIdQuery(departmentId as any, { skip: !departmentId });

  const [internalFormState, setInternalFormState] = React.useState<AvailabilityGenerationBatchApplyDTO>({
    templateId: selectedTemplate?.id ?? 0,
    startDate: "",
    endDate: "",
    deferred: false,
    deferredAt: null,
    scope: "DEPARTMENT",
    holidayHandlingMode: null,
  } as AvailabilityGenerationBatchApplyDTO);
  const formState = dto ?? internalFormState;
  const setFormState = setDto ?? setInternalFormState;

  React.useEffect(() => {
    const nextId = selectedTemplate?.id ?? 0;
    setFormState((prev) => {
      if (prev.templateId === nextId) {
        return prev;
      }
      return {
        ...prev,
        templateId: nextId,
        startDate: "",
        endDate: "",
        scope: "DEPARTMENT" as any,
        childTemplateId: null as any,
        holidayHandlingMode: null,
      } as AvailabilityGenerationBatchApplyDTO;
    });
  }, [selectedTemplate?.id, setFormState]);

  const dateRangeValidation = React.useMemo(
    () => validateDateRange(formState.startDate, formState.endDate),
    [formState.startDate, formState.endDate]
  );

  const facilityIdForHolidays =
    facilityId != null && Number(facilityId) > 0
      ? Number(facilityId)
      : Number(facilityIdFromAuth ?? 0);
  const fromDate = formatLocalDateForApi(formState.startDate);
  const toDate = formatLocalDateForApi(formState.endDate);
  const shouldFetchHolidays =
    facilityIdForHolidays > 0 && Boolean(fromDate) && Boolean(toDate) && dateRangeValidation.ok;
  const {
    data: holidaysInRange = [],
    isFetching: isFetchingHolidays,
    isError: isHolidaysQueryError,
  } = useGetActiveHolidaysInRangeQuery(
    { fromDate, toDate, facilityId: facilityIdForHolidays },
    { skip: !shouldFetchHolidays }
  );
  const holidayHandlingModeSet = Boolean(
    String((formState as any)?.holidayHandlingMode ?? "").trim()
  );
  /** When org holidays exist in range, user must pick Exclude vs Include-as-exception before continuing */
  const holidayHandlingValidationOk = React.useMemo(() => {
    if (!shouldFetchHolidays) return true;
    if (isHolidaysQueryError) return true;
    if (isFetchingHolidays) return false;
    const count = (holidaysInRange as unknown[])?.length ?? 0;
    return count === 0 || holidayHandlingModeSet;
  }, [
    shouldFetchHolidays,
    isHolidaysQueryError,
    isFetchingHolidays,
    holidaysInRange,
    holidayHandlingModeSet,
  ]);

  const [templateIntervalsStatus, setTemplateIntervalsStatus] =
    React.useState<EffectiveTemplateIntervalsStatus>({
      effectiveTemplateId: 0,
      isLoading: true,
      hasAnyInterval: false,
    });

  const handleTemplateIntervalsStatus = React.useCallback((s: EffectiveTemplateIntervalsStatus) => {
    setTemplateIntervalsStatus((prev) =>
      prev.effectiveTemplateId === s.effectiveTemplateId &&
        prev.isLoading === s.isLoading &&
        prev.hasAnyInterval === s.hasAnyInterval
        ? prev
        : s
    );
  }, []);

  React.useEffect(() => {
    setTemplateIntervalsStatus({
      effectiveTemplateId: 0,
      isLoading: true,
      hasAnyInterval: false,
    });
  }, [selectedTemplate?.id]);

  React.useEffect(() => {
    const scope = String((formState as any)?.scope ?? "").trim().toUpperCase();
    const isScopeSelected = scope.length > 0;
    const isSpecificResource = scope === "SPECIFIC_RESOURCE";
    const hasSelectedResourceTemplate = Number((formState as any)?.childTemplateId ?? 0) > 0;
    const scopeOk = isScopeSelected && (!isSpecificResource || hasSelectedResourceTemplate);
    const intervalsApplyOk =
      !templateIntervalsStatus.isLoading &&
      templateIntervalsStatus.effectiveTemplateId > 0 &&
      templateIntervalsStatus.hasAnyInterval;
    const isValid =
      scopeOk && dateRangeValidation.ok && intervalsApplyOk && holidayHandlingValidationOk;
    onValidationChange?.(isValid);
  }, [
    formState?.scope,
    (formState as any)?.childTemplateId,
    (formState as any)?.holidayHandlingMode,
    dateRangeValidation.ok,
    templateIntervalsStatus.isLoading,
    templateIntervalsStatus.effectiveTemplateId,
    templateIntervalsStatus.hasAnyInterval,
    holidayHandlingValidationOk,
    onValidationChange,
  ]);

  const facilityName = React.useMemo(() => {
    return (facilityData as any)?.name ?? "";
  }, [facilityData]);

  const departmentName = React.useMemo(() => {
    return (departmentData as any)?.name ?? "";
  }, [departmentData]);

  const templateOptions = selectedTemplate
    ? [{ id: selectedTemplate.id, label: selectedTemplate.templateName }]
    : [];
  const facilityOptions = selectedTemplate?.facilityId && facilityName
    ? [{ id: selectedTemplate.facilityId, label: facilityName }]
    : [];
  const departmentOptions = selectedTemplate?.departmentId && departmentName
    ? [{ id: selectedTemplate.departmentId, label: departmentName }]
    : [];

  return (
    <>
      <div className="px-5">
        <Form
          fluid
          className="apply-template-step1-fields grid grid-cols-1 gap-x-3 gap-y-2 md:grid-cols-3"
        >
          <MyInput
            fieldName="templateId"
            fieldLabel="Template"
            fieldType="select"
            record={formState}
            setRecord={setFormState}
            selectData={templateOptions}
            selectDataLabel="label"
            selectDataValue="id"
            cleanable={false}
            searchable={false}
            width="100%"
            disabled
          />

          <MyInput
            fieldName="startDate"
            fieldLabel="From Date"
            fieldType="datetime"
            record={formState}
            setRecord={setFormState}
            placeholder="DD-MM-YYYY HH:mm"
            width="100%"
            required
            disablePastDates
          />

          <MyInput
            fieldName="endDate"
            fieldLabel="To Date"
            fieldType="datetime"
            record={formState}
            setRecord={setFormState}
            placeholder="DD-MM-YYYY HH:mm"
            width="100%"
            required
            disablePastDates
          />

          <MyInput
            fieldName="facilityId"
            fieldLabel="Facility"
            fieldType="select"
            record={{ facilityId: selectedTemplate?.facilityId ?? null }}
            setRecord={() => { }}
            selectData={facilityOptions}
            selectDataLabel="label"
            selectDataValue="id"
            cleanable={false}
            searchable={false}
            width="100%"
            disabled
          />

          <MyInput
            fieldName="departmentId"
            fieldLabel="Department"
            fieldType="select"
            record={{ departmentId: selectedTemplate?.departmentId ?? null }}
            setRecord={() => { }}
            selectData={departmentOptions}
            selectDataLabel="label"
            selectDataValue="id"
            cleanable={false}
            searchable={false}
            width="100%"
            disabled
          />

          <MyInput
            fieldName="durationMinutes"
            fieldLabel="Duration (Minutes)"
            fieldType="number"
            record={{ durationMinutes: selectedTemplate?.durationMinutes ?? null }}
            setRecord={() => { }}
            width="100%"
            disabled
          />
        </Form>
      </div>

      <div className="grid gap-4 bg-slate-50 p-4 xl:grid-cols-[1.05fr_1.25fr_0.95fr]">
        <ApplyConfigurationSection
          dto={formState}
          setDto={setFormState}
          onEffectiveTemplateIntervalsStatus={handleTemplateIntervalsStatus}
          templateFacilityId={selectedTemplate?.facilityId ?? null}
        />
        <PreviewSlotsSection
          templateId={selectedTemplate?.id}
          templateDurationMinutes={selectedTemplate?.durationMinutes ?? null}
          dto={formState}
          setDto={setFormState}
        />
        <SlotDetailsSection dto={formState} setDto={setFormState} />
      </div>
    </>
  );
};

export default ApplyTemplateStepOne;
