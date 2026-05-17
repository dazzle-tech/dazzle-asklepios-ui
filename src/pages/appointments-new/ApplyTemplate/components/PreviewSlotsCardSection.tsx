import * as React from "react";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import { SurfaceCard } from "./shared";
import { formatLocalDateForApi } from "../applyTemplateDateUtils";
import { useAppSelector } from "@/hooks";

type MatrixCell = { count: number; statuses: Record<string, number> };

type Props = {
  startDate: Date | null;
  endDate: Date | null;
  periodDays: Date[];
  timeRows: string[];
  matrix: Record<string, MatrixCell>;
  getStatusColor: (statusRaw: string) => string;
  statusLegendItems: Array<{ label: string; color: string }>;
  isLoadingCounts: boolean;
  selectedCellKey?: string | null;
  onCellClick?: (payload: { dateKey: string; timeLabel: string; slots: any[] }) => void;
  slotsByCell?: Record<string, any[]>;
};

const PreviewSlotsCardSection: React.FC<Props> = ({
  startDate,
  endDate,
  periodDays,
  timeRows,
  matrix,
  getStatusColor,
  statusLegendItems,
  isLoadingCounts,
  selectedCellKey = null,
  onCellClick,
  slotsByCell = {}
}) => {
   const mode = useAppSelector((state: any) => state.ui.mode);
  return (
    <SurfaceCard
      title="Preview Slots"
      description="Appointments by date and time"
      icon={CalendarDays}
      headerAction={null}
    >
      <div style={{backgroundColor: mode === 'dark' ? '#2E2D2D' : ''}} className="rounded-2xl border border-slate-200 bg-white p-3">
        {!startDate || !endDate || endDate < startDate ? (
          <div style={{backgroundColor: mode === 'dark' ? '#2E2D2D' : '', color: mode === 'dark' ? 'var(--white)' : ''}} className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            Select valid From/To dates to preview appointments.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-full max-w-full rounded-xl border border-slate-200">
              <div className="max-h-[400px] w-full overflow-x-auto overflow-y-auto">
                <div className="w-max min-w-full">
                  <div
                    className="grid border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-500"
                    style={{ gridTemplateColumns: `100px repeat(${periodDays.length}, minmax(88px, 1fr))` }}
                  >
                    <div className="px-2 py-3 text-left">Time</div>
                    {periodDays.map((day) => {
                      const key = formatLocalDateForApi(day) || "";
                      return (
                        <div key={`header-${key}`} className="border-l border-slate-200 px-2 py-3">
                          {day.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" })}
                        </div>
                      );
                    })}
                  </div>
                  {(timeRows.length > 0 ? timeRows : ["--:--"]).map((timeLabel) => (
                    <div
                      key={`row-${timeLabel}`}
                      className="grid border-b border-slate-100 last:border-b-0"
                      style={{ gridTemplateColumns: `100px repeat(${periodDays.length}, minmax(88px, 1fr))` }}
                    >
                      <div className="px-2 py-3 text-sm font-medium text-slate-600">{timeLabel}</div>
                      {periodDays.map((day) => {
                        const dateKey = formatLocalDateForApi(day) || "";
                        const cell = matrix[`${dateKey}|${timeLabel}`];
                        const cellKey = `${dateKey}|${timeLabel}`;
                        const count = cell?.count ?? 0;
                        const dominantStatus = cell
                          ? Object.entries(cell.statuses).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ""
                          : "";
                        const color = count > 0 ? getStatusColor(dominantStatus) : "#E2E8F0";

                        return (
                          <div key={`${dateKey}-${timeLabel}`} className="border-l border-slate-100 px-2 py-2">
                            <div
                              className={cn(
                                "flex min-h-[44px] cursor-pointer flex-col items-center justify-center rounded-lg text-xs font-semibold",
                                count > 0 ? "text-white" : "text-slate-500",
                                selectedCellKey === cellKey ? "ring-2 ring-slate-800 ring-offset-1" : ""
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() =>
                                onCellClick?.({
                                  dateKey,
                                  timeLabel,
                                  slots: slotsByCell[cellKey] ?? []
                                })
                              }
                            >
                              <div>{count > 0 ? count : "-"}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusLegendItems.map((item) => (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isLoadingCounts && <div className="mt-3 text-xs text-slate-500">Loading appointments...</div>}
    </SurfaceCard>
  );
};

export default PreviewSlotsCardSection;
