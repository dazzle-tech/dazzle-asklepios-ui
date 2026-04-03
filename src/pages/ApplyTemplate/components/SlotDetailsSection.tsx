import * as React from "react";
import { Progress } from "@/components/ui/progress";
import {
  FlaskConical,
  Info,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { FakeSelect, Pill, SurfaceCard } from "./shared";
import type { AvailabilityGenerationBatchApplyDTO } from "@/types/model-types-new";

const SlotDetailsSection: React.FC<{ dto?: AvailabilityGenerationBatchApplyDTO; setDto?: React.Dispatch<React.SetStateAction<AvailabilityGenerationBatchApplyDTO>>; }> = ({ dto, setDto }) => {
  void dto;
  void setDto;
  return (
    <SurfaceCard
      title="Slot Details"
      description="Detailed information for the selected preview slot"
      icon={Info}
      headerAction={<Pill className="bg-emerald-100 px-3 py-1 text-emerald-700">Available</Pill>}
    >
      <div className="space-y-5">
        <div>
          <p className="text-base font-semibold text-slate-900">Monday, May 15 · 09:00 - 09:30</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Pediatrics Pool</div>
              <div className="mt-1 text-xs text-slate-500">Capacity: 3 of 5 available</div>
            </div>
            <Pill className="bg-sky-100 text-sky-700">Department Pool</Pill>
          </div>
          <Progress value={60} className="mt-4 h-2.5 bg-slate-200 [&>div]:bg-blue-600" />
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <UserRound className="h-4 w-4 text-slate-500" />
            Resources
            <span className="text-xs text-slate-400">(All required)</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-slate-800">Dr. Emma Johnson</span>
              </div>
              <Pill className="bg-slate-100 text-slate-600">Pediatrician</Pill>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-slate-800">Room 2</span>
              </div>
              <Pill className="bg-slate-100 text-slate-600">Exam Room</Pill>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            Policies
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-violet-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white p-2 text-violet-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-800">ID Required</span>
            </div>
            <Pill className="bg-white text-slate-600">Required</Pill>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FlaskConical className="h-4 w-4 text-slate-500" />
            Skills Required
          </div>
          <FakeSelect compact icon={Sparkles} label="" value="Pediatrics Certified" />
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 text-sky-600" />
            <p className="text-sm text-slate-700">
              This slot will be generated as a free appointment ready for booking.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button type="button" className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white">
            Book Test Appointment
          </button>
          <button type="button" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
            Block This Slot
          </button>
          <button type="button" className="w-full text-center text-sm font-medium text-blue-600">
            View Conflicts (0)
          </button>
        </div>
      </div>
    </SurfaceCard>
  );
};

export default SlotDetailsSection;
