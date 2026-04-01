import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  FileCheck2,
  Hospital,
  Info,
  ShieldCheck,
  Stethoscope,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import {
  generatedSlots,
  generatedToneClasses,
  Pill,
  SummaryRow,
  SurfaceCard,
} from "./shared";

const ApplyTemplateStepTwo: React.FC = () => {
  return (
    <>
      <div className="grid gap-4 bg-slate-50 p-4 xl:grid-cols-[1.45fr_0.75fr]">
        <SurfaceCard
          title="Slots to be Generated"
          description="255 free appointments"
          icon={CalendarDays}
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[48px_1.2fr_1fr_1.2fr_0.8fr_0.8fr_1fr] border-b border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div className="flex items-center justify-center">
                <Checkbox checked={false} />
              </div>
              <div>Date</div>
              <div>Time</div>
              <div>Channel</div>
              <div>Duration</div>
              <div>Capacity</div>
              <div>Status</div>
            </div>

            {generatedSlots.map((slot, index) => (
              <div
                key={`${slot.date}-${slot.time}-${index}`}
                className={cn(
                  "grid grid-cols-[48px_1.2fr_1fr_1.2fr_0.8fr_0.8fr_1fr] items-center border-b border-slate-100 px-3 py-3 last:border-b-0",
                  slot.alert ? "bg-rose-50/60" : "bg-white",
                )}
              >
                <div className="flex items-center justify-center">
                  <Checkbox checked={slot.checked} />
                </div>
                <div className="text-sm font-medium text-slate-700">{slot.date}</div>
                <div className="text-sm text-slate-600">{slot.time}</div>
                <div>
                  <Pill className={cn(slot.alert ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700")}>
                    {slot.channel}
                  </Pill>
                </div>
                <div className="text-sm text-slate-600">{slot.duration}</div>
                <div className="text-sm text-slate-600">{slot.capacity}</div>
                <div>
                  <Pill className={generatedToneClasses[slot.tone]}>{slot.status}</Pill>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            <span className="font-semibold">2 exceptions will be applied</span>
            <span className="text-amber-700">- 1 holiday, 1 maintenance closure</span>
          </div>
        </SurfaceCard>

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
      </div>

      <div className="border-t border-slate-200 bg-sky-50 px-5 py-4">
        <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
          <ShieldCheck className="h-4 w-4 text-sky-600" />
          Safe & Reversible: No confirmed appointments will be affected. Changes can be rolled back if needed.
        </div>
      </div>
    </>
  );
};

export default ApplyTemplateStepTwo;
