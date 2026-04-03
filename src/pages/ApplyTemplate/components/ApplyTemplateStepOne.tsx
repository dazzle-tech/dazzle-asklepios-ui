import * as React from "react";
import MyInput from "@/components/MyInput";
import { useGetFacilityByIdQuery } from "@/services/security/facilityService";
import { useGetDepartmentByIdQuery } from "@/services/security/departmentService";
import ApplyConfigurationSection from "./ApplyConfigurationSection";
import PreviewSlotsSection from "./PreviewSlotsSection";
import SlotDetailsSection from "./SlotDetailsSection";
import { Form } from "rsuite";
import { addMonths, isAfter, isBefore, startOfMinute } from "date-fns";
import type { AvailabilityTemplateResponseVM } from "@/types/model-types-new";
import type { AvailabilityGenerationBatchApplyDTO } from "@/types/model-types-new";

type ApplyTemplateStepOneProps = {
  selectedTemplate?: AvailabilityTemplateResponseVM | null;
  dto?: AvailabilityGenerationBatchApplyDTO;
  setDto?: React.Dispatch<React.SetStateAction<AvailabilityGenerationBatchApplyDTO>>;
  onValidationChange?: (isValid: boolean) => void;
};

function parseFormDateTime(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string") {
    const raw = value.trim();
    const dmy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
    if (dmy) {
      const dd = Number(dmy[1]);
      const mm = Number(dmy[2]);
      const yyyy = Number(dmy[3]);
      const hh = dmy[4] != null ? Number(dmy[4]) : 0;
      const min = dmy[5] != null ? Number(dmy[5]) : 0;
      if (![dd, mm, yyyy, hh, min].some(n => Number.isNaN(n))) {
        const d = new Date(yyyy, mm - 1, dd, hh, min, 0, 0);
        if (!Number.isNaN(d.getTime())) return d;
      }
    }
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function validateDateRange(startRaw: unknown, endRaw: unknown): { ok: boolean; message: string } {
  const start = parseFormDateTime(startRaw);
  const end = parseFormDateTime(endRaw);
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
    setFormState((prev) => ({
      ...prev,
      templateId: selectedTemplate?.id ?? 0,
      startDate: "",
      endDate: "",
      scope: prev?.scope ? prev.scope : ("DEPARTMENT" as any),
    }));
  }, [selectedTemplate]);

  const dateRangeValidation = React.useMemo(
    () => validateDateRange(formState.startDate, formState.endDate),
    [formState.startDate, formState.endDate]
  );

  React.useEffect(() => {
    const scope = String((formState as any)?.scope ?? "").trim().toUpperCase();
    const isScopeSelected = scope.length > 0;
    const isSpecificResource = scope === "SPECIFIC_RESOURCE";
    const hasSelectedResourceTemplate = Number((formState as any)?.childTemplateId ?? 0) > 0;
    const scopeOk = isScopeSelected && (!isSpecificResource || hasSelectedResourceTemplate);
    const isValid = scopeOk && dateRangeValidation.ok;
    onValidationChange?.(isValid);
  }, [
    formState?.scope,
    (formState as any)?.childTemplateId,
    dateRangeValidation.ok,
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
        <Form fluid className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
            setRecord={() => {}}
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
            setRecord={() => {}}
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
            setRecord={() => {}}
            width="100%"
            disabled
          />
        </Form>
      </div>

      <div className="grid gap-4 bg-slate-50 p-4 xl:grid-cols-[1.05fr_1.25fr_0.95fr]">
        <ApplyConfigurationSection dto={formState} setDto={setFormState} />
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
