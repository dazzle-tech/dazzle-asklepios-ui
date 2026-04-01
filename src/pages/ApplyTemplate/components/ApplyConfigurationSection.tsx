import * as React from "react";
import MyInput from "@/components/MyInput";
import { Form } from "rsuite";
import { Switch } from "@/components/ui/switch";
import {
  Circle,
  Clock3,
  Plus,
  Settings2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import {
  exceptions,
  Pill,
  policies,
  resources,
  SurfaceCard,
} from "./shared";
import { useEnumOptions } from "@/services/enumsApi";
import type { AvailabilityGenerationBatchApplyDTO } from "@/types/model-types-new";
import { useGetAvailabilityTemplatesByParentTemplateIdQuery } from "@/services/appointment/availabilityTemplateService";

const ActionChip = ({ label }: { label: string }) => (
  <button
    type="button"
    className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700"
  >
    <span className="inline-flex items-center gap-2">
      <Plus className="h-4 w-4" />
      {label}
    </span>
  </button>
);

type ApplyConfigurationSectionProps = {
  dto: AvailabilityGenerationBatchApplyDTO;
  setDto: React.Dispatch<React.SetStateAction<AvailabilityGenerationBatchApplyDTO>>;
};

const ApplyConfigurationSection: React.FC<ApplyConfigurationSectionProps> = ({ dto, setDto }) => {
  const enumOptions = (useEnumOptions('AvailabilityGenerationScope') as any[]) ?? [];
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
            <ActionChip label="Add Exception" />
          </div>
          <div className="space-y-2">
            {exceptions.map((exception) => (
              <div
                key={exception.title}
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-600" />
                  <div>
                    <div className="text-sm font-medium text-amber-900">{exception.title}</div>
                    <div className="text-xs text-amber-700">{exception.subtitle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Deferred Execution</p>
              <p className="text-xs text-slate-500">Generate slots later instead of immediately</p>
            </div>
            <Switch />
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
            Schedule for <span className="ml-2 inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              02:00 AM, May 15
            </span>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
};

export default ApplyConfigurationSection;
