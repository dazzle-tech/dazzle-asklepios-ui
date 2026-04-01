import * as React from "react";
import MyInput from "@/components/MyInput";
import { useGetFacilityByIdQuery } from "@/services/security/facilityService";
import { useGetDepartmentByIdQuery } from "@/services/security/departmentService";
import ApplyConfigurationSection from "./ApplyConfigurationSection";
import PreviewSlotsSection from "./PreviewSlotsSection";
import SlotDetailsSection from "./SlotDetailsSection";
import { Form } from "rsuite";
import type { AvailabilityTemplateResponseVM } from "@/types/model-types-new";
import type { AvailabilityGenerationBatchApplyDTO } from "@/types/model-types-new";

type ApplyTemplateStepOneProps = {
  selectedTemplate?: AvailabilityTemplateResponseVM | null;
};

const ApplyTemplateStepOne: React.FC<ApplyTemplateStepOneProps> = ({ selectedTemplate }) => {
  const facilityId = selectedTemplate?.facilityId ?? null;
  const departmentId = selectedTemplate?.departmentId ?? null;
  const { data: facilityData } = useGetFacilityByIdQuery(facilityId as any, { skip: !facilityId });
  const { data: departmentData } = useGetDepartmentByIdQuery(departmentId as any, { skip: !departmentId });

  const [formState, setFormState] = React.useState<AvailabilityGenerationBatchApplyDTO>({
    templateId: selectedTemplate?.id ?? 0,
    startDate: "",
    endDate: "",
    deferred: false,
    deferredAt: null,
    scope: "DEPARTMENT",
    holidayHandlingMode: null,
  } as AvailabilityGenerationBatchApplyDTO);

  React.useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      templateId: selectedTemplate?.id ?? 0,
      startDate: "",
      endDate: "",
    }));
  }, [selectedTemplate]);

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
            fieldLabel="Date Range Start"
            fieldType="date"
            record={formState}
            setRecord={setFormState}
            placeholder="DD-MM-YYYY"
            width="100%"
          />

          <MyInput
            fieldName="endDate"
            fieldLabel="Date Range End"
            fieldType="date"
            record={formState}
            setRecord={setFormState}
            placeholder="DD-MM-YYYY"
            width="100%"
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
        <PreviewSlotsSection dto={formState} setDto={setFormState} />
        <SlotDetailsSection dto={formState} setDto={setFormState} />
      </div>
    </>
  );
};

export default ApplyTemplateStepOne;
