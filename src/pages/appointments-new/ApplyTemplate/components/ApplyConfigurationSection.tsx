import * as React from "react";
import MyInput from "@/components/MyInput";
import { Form } from "rsuite";
import {
  Settings2,
  TriangleAlert,
} from "lucide-react";
import { SurfaceCard } from "./shared";
import { useEnumOptions } from "@/services/enumsApi";
import type {
  AvailabilityGenerationBatchApplyDTO,
  AvailabilityTemplateIntervalResponseVM,
} from "@/types/model-types-new";
import { useGetAvailabilityTemplatesByParentTemplateIdQuery } from "@/services/appointment/availabilityTemplateService";
import { useGetActiveHolidaysInRangeQuery } from "@/services/system-configurations/organizationHolidaysService";
import { useLazyGetAvailabilityTemplateIntervalsByTemplateAndDayQuery } from "@/services/appointment/availabilityTemplate/availabilityTemplateInterval";
import { useAppSelector } from "@/hooks";
import { formatEnumString } from "@/utils";
import { formatLocalDateForApi } from "../applyTemplateDateUtils";

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
  /** Prefer template facility for org holidays (API expects yyyy-MM-dd + facilityId). */
  templateFacilityId?: number | null;
};

const ApplyConfigurationSection: React.FC<ApplyConfigurationSectionProps> = ({
  dto,
  setDto,
  onEffectiveTemplateIntervalsStatus,
  templateFacilityId,
}) => {
   const mode = useAppSelector((state: any) => state.ui.mode);
  const selectedDepartment = useAppSelector((s) => (s as any)?.auth?.selectedDepartment);
  const facilityIdFromAuth =
    selectedDepartment?.facilityId ?? selectedDepartment?.facility?.id ?? selectedDepartment?.facility?.facilityId ?? null;
  const facilityIdForHolidays =
    templateFacilityId != null && Number(templateFacilityId) > 0
      ? Number(templateFacilityId)
      : Number(facilityIdFromAuth ?? 0);

  const enumOptions = (useEnumOptions('AvailabilityGenerationScope') as any[]) ?? [];
  const holidayHandlingModeEnumOptions = (useEnumOptions('HolidayHandlingMode') as any[]) ?? [];
  const options = React.useMemo(
    () =>
      enumOptions.map((o: any) =>
        typeof o === 'string' ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value }
      ),
    [enumOptions]
  );
  const [checks, setChecks] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const selectedScope = String((dto as any)?.scope ?? '').toUpperCase();
    const nextChecks = Object.fromEntries(
      options.map(opt => {
        const value = String(opt.value).toUpperCase();
        return [String(opt.value), value === selectedScope];
      })
    ) as Record<string, boolean>;
    setChecks(prev => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(nextChecks);
      if (
        prevKeys.length === nextKeys.length &&
        nextKeys.every(key => prev[key] === nextChecks[key])
      ) {
        return prev;
      }
      return nextChecks;
    });
  }, [dto?.scope, options]);

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
  const selectedChildTemplateId = Number((dto as any)?.childTemplateId ?? 0);
  /** Matches apply logic: parent template unless scope is specific resource (then child only). */
  const effectiveTemplateIdForIntervals = isSpecificScope
    ? selectedChildTemplateId
    : Number(dto?.templateId ?? 0);
  const [intervalsByDay, setIntervalsByDay] = React.useState<Record<string, AvailabilityTemplateIntervalResponseVM[]>>({});
  const [isLoadingIntervals, setIsLoadingIntervals] = React.useState(false);
  const [loadIntervalsByTemplateAndDay] = useLazyGetAvailabilityTemplateIntervalsByTemplateAndDayQuery();
  const dayOfWeekOptions = useEnumOptions('DayOfWeek') as any[] | undefined;
  const daysToQuery = React.useMemo(() => {
    const normalized = (dayOfWeekOptions ?? []).map((d: any) =>
      typeof d === 'string' ? d : (d?.value ?? d?.label)
    );
    return normalized.length > 0
      ? normalized.map((d: any) => String(d).toUpperCase())
      : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
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
        daysToQuery.map(async dayOfWeek => {
          try {
            const rows = await loadIntervalsByTemplateAndDay({
              templateId: effectiveTemplateIdForIntervals,
              dayOfWeek
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
  }, [effectiveTemplateIdForIntervals, loadIntervalsByTemplateAndDay, daysToQuery.join('|')]);

  const hasAnyInterval = React.useMemo(
    () => daysToQuery.some(day => (intervalsByDay[day] ?? []).length > 0),
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
  const shouldFetchHolidays = facilityIdForHolidays > 0 && Boolean(fromDate) && Boolean(toDate);
  const { data: holidaysInRange = [], isFetching: isLoadingHolidays } =
    useGetActiveHolidaysInRangeQuery(
      { fromDate, toDate, facilityId: facilityIdForHolidays },
      { skip: !shouldFetchHolidays }
    );

  return (
    <SurfaceCard title="Apply Configuration" description="Configure scope, resources, intervals and exceptions" icon={Settings2}>
      <div style={{backgroundColor: mode === 'dark' ? 'var(--extra-dark-black)' : ''}} className="space-y-5">
        <div style={{backgroundColor: mode === 'dark' ? 'var(--extra-dark-black)' : ''}}>
          <p className="mb-3 text-sm font-semibold text-slate-700" style={{color: mode === 'dark' ? 'var(--white)' : ''}}>Resource Scope</p>
          <div className="rounded-2xl border border-slate-200 bg-white p-4" style={{backgroundColor: mode === 'dark' ? 'var(--dark-black)' : ''}}>
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
                            // Keep selected resource template only when SPECIFIC_RESOURCE is active.
                            childTemplateId:
                              next[key] && String(opt.value).toUpperCase() === 'SPECIFIC_RESOURCE'
                                ? (prev as any)?.childTemplateId ?? null
                                : null,
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
                    required
                  />
                </Form>
              </div>
            )}
          </div>
        </div>


        <div style={{backgroundColor: mode === 'dark' ? 'var(--extra-dark-black)' : ''}}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700" style={{color: mode === 'dark' ? 'var(--white)' : ''}}>
              Intervals ({isSpecificScope && selectedChildTemplateId > 0 ? 'Resource Template' : 'Selected Template'})
            </p>
          </div>
          <div className="space-y-2">
            {isLoadingIntervals && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                Loading intervals...
              </div>
            )}

            {!isLoadingIntervals && !effectiveTemplateIdForIntervals && (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                Select a template to view intervals.
              </div>
            )}

            {!isLoadingIntervals &&
              effectiveTemplateIdForIntervals > 0 &&
              daysToQuery.map(day => {
                const rows = intervalsByDay[day] ?? [];
                if (rows.length === 0) return null;
                return (
                  <div key={day} className="rounded-2xl border border-slate-200 bg-white px-4 py-3"  style={{backgroundColor: mode === 'dark' ? 'var(--dark-black)' : '', color: mode === 'dark' ? 'var(--white)' : ''}}>
                    <div className="mb-2 text-xs font-semibold text-slate-500">{day.replace('_', ' ')}</div>
                    <div className="space-y-2">
                      {rows.map((interval, idx) => (
                        <div
                          key={`${day}-${interval?.id ?? idx}`}
                          className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                          style={{backgroundColor: mode === 'dark' ? '#2E2D2D' : '', color: mode === 'dark' ? 'var(--white)' : ''}}
                        >
                          <span className="font-medium text-slate-800" style={{color: mode === 'dark' ? 'var(--white)' : ''}}>
                            {interval?.startTime ?? '--:--'} - {interval?.endTime ?? '--:--'}
                          </span>
                          <span className="mx-2 text-slate-300">|</span>
                          <span>
                            Duration: {interval?.slotDurationMinutes ?? '-'} min
                          </span>
                          <span className="mx-2 text-slate-300">|</span>
                          <span>
                            Strategy: {interval?.slotStrategy ? formatEnumString(String(interval.slotStrategy)) : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

            {!isLoadingIntervals &&
              effectiveTemplateIdForIntervals > 0 &&
              daysToQuery.every(day => (intervalsByDay[day] ?? []).length === 0) && (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                  No intervals found for this template.
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

            {!isLoadingHolidays && (!shouldFetchHolidays || (holidaysInRange as any[])?.length === 0) && (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500" style={{backgroundColor: mode === 'dark' ? 'var(--dark-black)' : ''}}>
                No Exceptions in the selected range.
              </div>
            )}
          </div>

          {!isLoadingHolidays && shouldFetchHolidays && (holidaysInRange as any[])?.length > 0 && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">Holiday Handling Mode</p>
              {!String((dto as any)?.holidayHandlingMode ?? "").trim() && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    Organization holidays apply in this date range. Choose one of the options below before you can
                    continue to the next step.
                  </span>
                </div>
              )}
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
