import * as React from "react";
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

const ApplyConfigurationSection: React.FC = () => {
  return (
    <SurfaceCard title="Apply Configuration" description="Configure pool, resources and policies" icon={Settings2}>
      <div className="space-y-5">
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">Resource Scope</p>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <Circle className="h-4 w-4 fill-blue-600 text-blue-600" />
              <span className="font-medium">Department Pool</span>
              <span className="text-xs text-slate-400">(All channels)</span>
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <Circle className="h-4 w-4 text-slate-300" />
              <span className="font-medium">Specific Channels</span>
              <Pill className="bg-slate-200 text-slate-600">3 selected</Pill>
            </label>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700">Additional Resources</p>
            <ActionChip label="Add Resource" />
          </div>
          <div className="space-y-3">
            {resources.map((resource) => {
              const Icon = resource.icon;
              return (
                <div
                  key={resource.title}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{resource.title}</div>
                      <div className="text-xs text-slate-500">{resource.subtitle}</div>
                    </div>
                  </div>
                  <Switch checked />
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700">Policies to Apply</p>
            <ActionChip label="Add Policy" />
          </div>
          <div className="space-y-2">
            {policies.map((policy) => (
              <div
                key={policy.label}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-800">{policy.label}</span>
                  <Pill className="bg-slate-100 text-slate-600">{policy.tag}</Pill>
                </div>
                <span className="text-slate-300">×</span>
              </div>
            ))}
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
