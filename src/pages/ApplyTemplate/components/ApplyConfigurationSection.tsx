import * as React from "react";
import MyInput from "@/components/MyInput";
import { Form } from "rsuite";
import {
  Settings2,
  TriangleAlert,
} from "lucide-react";
import { SurfaceCard } from "./shared";
import { useEnumOptions } from "@/services/enumsApi";
import type { AvailabilityGenerationBatchApplyDTO } from "@/types/model-types-new";
import { useGetAvailabilityTemplatesByParentTemplateIdQuery } from "@/services/appointment/availabilityTemplateService";
import { useGetActiveHolidaysInRangeQuery } from "@/services/system-configurations/organizationHolidaysService";
import { useAppSelector } from "@/hooks";

type ApplyConfigurationSectionProps = {
  dto: AvailabilityGenerationBatchApplyDTO;
  setDto: React.Dispatch<React.SetStateAction<AvailabilityGenerationBatchApplyDTO>>;
};

const ApplyConfigurationSection: React.FC<ApplyConfigurationSectionProps> = ({ dto, setDto }) => {
  const selectedDepartment = useAppSelector((s) => (s as any)?.auth?.selectedDepartment);
  const facilityIdFromAuth =
    selectedDepartment?.facilityId ?? selectedDepartment?.facility?.id ?? selectedDepartment?.facility?.facilityId ?? null;

  const enumOptions = (useEnumOptions('AvailabilityGenerationScope') as any[]) ?? [];
  const holidayHandlingModeEnumOptions = (useEnumOptions('HolidayHandlingMode') as any[]) ?? [];
  const options = enumOptions.map((o: any) =>
    typeof o === 'string' ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value }
  );
  const [checks, setChecks] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(options.map(opt => [String(opt.value), false]))
  );

  const isSpecificScope = String((dto as any)?.scope ?? '').toUpperCase() === 'SPECIFIC_RESOURCE';
  const parentId = dto?.templateId ?? 0;
  const { data: childTemplates = [], isFetching: isLoadingChildren } =
    useGetAvailabilityTemplatesByParentTemplateIdQuery(
      { parentTemplateId: parentId },
      { skip: !isSpecificScope || !parentId }
    );
  const childOptions = (childTemplates as any[]).map(t => ({
    id: t?.id,
    label: t?.templateName ?? `Template #${t?.id}`
  }));

  const fromDate = (dto as any)?.startDate || "";
  const toDate = (dto as any)?.endDate || "";
  const shouldFetchHolidays = Boolean(facilityIdFromAuth) && Boolean(fromDate) && Boolean(toDate);
  const { data: holidaysInRange = [], isFetching: isLoadingHolidays } =
    useGetActiveHolidaysInRangeQuery(
      { fromDate, toDate, facilityId: Number(facilityIdFromAuth) },
      { skip: !shouldFetchHolidays }
    );

  return (
    <SurfaceCard title="Apply Configuration" description="Configure pool, resources and policies" icon={Settings2}>
      <div className="space-y-5">
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">Resource Scope</p>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <Form fluid>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {options.map(opt => {
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
                        setChecks(prev => {
                          const next: Record<string, boolean> = {};
                          for (const o of options) next[String(o.value)] = false;
                          next[key] = !!r[key];
                          setDto(prev => ({
                            ...prev,
                            scope: next[key] ? (opt.value as string) : ('' as any),
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
                    record={(dto as any)}
                    setRecord={(updated: any) =>
                      setDto(prev => ({ ...(prev as any), childTemplateId: updated.childTemplateId } as any))
                    }
                    selectData={childOptions}
                    selectDataLabel="label"
                    selectDataValue="id"
                    width="100%"
                    cleanable={false}
                    searchable
                    loading={isLoadingChildren}
                  />
                </Form>
              </div>
            )}
          </div>
        </div>


        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700">Exceptions</p>
          </div>
          <div className="space-y-2">
            {isLoadingHolidays && shouldFetchHolidays && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                Loading holidays for selected range...
              </div>
            )}

            {!isLoadingHolidays &&
              shouldFetchHolidays &&
              (holidaysInRange as any[])?.map((h: any) => (
                <div key={`holiday-${h?.id}`} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-600" />
                    <div>
                      <div className="text-sm font-medium text-amber-900">{h?.name ?? "Holiday"}</div>
                      <div className="text-xs text-amber-700">
                        {h?.startDate} — {h?.endDate}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {!isLoadingHolidays && shouldFetchHolidays && (holidaysInRange as any[])?.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                No holidays in the selected range.
              </div>
            )}
          </div>

          {!isLoadingHolidays && shouldFetchHolidays && (holidaysInRange as any[])?.length > 0 && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">Holiday Handling Mode</p>
              <Form fluid>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {holidayHandlingModeEnumOptions.map((o: any) => {
                    const opt =
                      typeof o === 'string' ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value };
                    const key = String(opt.value);
                    const record: Record<string, boolean> = { [key]: String((dto as any)?.holidayHandlingMode ?? '') === key };
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
                          setDto(prev => ({
                            ...prev,
                            holidayHandlingMode: checked ? (opt.value as any) : (null as any),
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
