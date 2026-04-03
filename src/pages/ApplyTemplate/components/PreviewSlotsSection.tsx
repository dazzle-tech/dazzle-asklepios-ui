import * as React from "react";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronDown, Search } from "lucide-react";
import { legendItems, slotRows, slotToneClasses, SurfaceCard, weekDays } from "./shared";
import type { AvailabilityGenerationBatchApplyDTO } from "@/types/model-types-new";
import PreviewSummarySection from "./PreviewSummarySection";

const PreviewSlotsSection: React.FC<{
  templateId?: number | null;
  templateDurationMinutes?: number | null;
  dto?: AvailabilityGenerationBatchApplyDTO;
  setDto?: React.Dispatch<React.SetStateAction<AvailabilityGenerationBatchApplyDTO>>;
}> = ({ templateId, templateDurationMinutes, dto, setDto }) => {
  void dto;
  void setDto;
  return (
    <div className="space-y-4">
      <SurfaceCard
        title="Preview Slots"
        description="Generated availability by day and time"
        icon={CalendarDays}
        headerAction={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600"
            >
              View by: <span className="font-semibold text-slate-800">Week</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        }
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[90px_repeat(5,minmax(0,1fr))] border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-500">
            <div className="px-3 py-3 text-left"> </div>
            {weekDays.map((day) => (
              <div key={day} className="border-l border-slate-200 px-3 py-3">
                {day}
              </div>
            ))}
          </div>

          {slotRows.map((row) => (
            <div
              key={row.time}
              className="grid grid-cols-[90px_repeat(5,minmax(0,1fr))] border-b border-slate-100 last:border-b-0"
            >
              <div className="px-3 py-3 text-sm font-medium text-slate-600">{row.time}</div>
              {row.cells.map((cell, index) => (
                <div key={`${row.time}-${index}`} className="border-l border-slate-100 px-2 py-2">
                  <div
                    className={cn(
                      "flex h-9 items-center justify-center rounded-lg text-xs font-semibold",
                      slotToneClasses[cell.tone],
                    )}
                  >
                    {cell.label}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", slotToneClasses[item.tone].split(" ")[0])} />
              {item.label}
            </div>
          ))}
        </div>
      </SurfaceCard>

      <PreviewSummarySection
        templateId={templateId ?? null}
        templateDurationMinutes={templateDurationMinutes ?? null}
        dto={dto}
      />
    </div>
  );
};

export default PreviewSlotsSection;
