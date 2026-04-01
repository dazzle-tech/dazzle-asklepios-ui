import * as React from "react";
import { FakeSelect, filterFields } from "./shared";
import ApplyConfigurationSection from "./ApplyConfigurationSection";
import PreviewSlotsSection from "./PreviewSlotsSection";
import SlotDetailsSection from "./SlotDetailsSection";

const ApplyTemplateStepOne: React.FC = () => {
  return (
    <>
      <div className="px-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_1.25fr_1fr_1fr_auto]">
          {filterFields.map((field) => (
            <FakeSelect
              key={field.label}
              icon={field.icon}
              label={field.label}
              value={field.value}
            />
          ))}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">Apply Mode</p>
            <div className="grid h-11 grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                className="rounded-lg bg-white text-sm font-semibold text-blue-600 shadow-sm"
              >
                Immediate
              </button>
              <button type="button" className="rounded-lg text-sm font-medium text-slate-500">
                Deferred
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 bg-slate-50 p-4 xl:grid-cols-[1.05fr_1.25fr_0.95fr]">
        <ApplyConfigurationSection />
        <PreviewSlotsSection />
        <SlotDetailsSection />
      </div>
    </>
  );
};

export default ApplyTemplateStepOne;
