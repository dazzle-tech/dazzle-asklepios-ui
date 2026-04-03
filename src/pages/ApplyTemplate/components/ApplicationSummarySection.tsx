import * as React from "react";
import {
  CalendarRange,
  CheckCircle2,
  FileCheck2,
  Hospital,
  Info,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { Pill, SummaryRow, SurfaceCard } from "./shared";

const ApplicationSummarySection: React.FC = () => {
  return (
    <SurfaceCard title="Application Summary" description="Final review before execution" icon={Wrench}>
      <div className="space-y-5">
        <div className="space-y-3">
          <SummaryRow label="Template" value="Pediatrics Morning" icon={FileCheck2} />
          <SummaryRow label="Date Range" value="May 15 - May 31, 2024 (17 days)" icon={CalendarRange} />
          <SummaryRow label="Facility" value="Global Med Clinic" icon={Hospital} />
          <SummaryRow label="Department" value="Pediatrics" icon={Stethoscope} />
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-700">Total Slots</span>
            <Pill className="bg-white text-emerald-700">255 free appointments</Pill>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>Daily Average</span>
            <span>~15 slots per day</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-800">Configuration</div>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Department Pool (All channels)
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              2 Policies will be applied
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              1 Skill Set requirement
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              2 Exceptions configured
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 text-sky-600" />
            <p>
              <span className="font-semibold">Next Step:</span> Free appointments will be created
              and ready for patient booking.
            </p>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
};

export default ApplicationSummarySection;

