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
  const isDark = mode === "dark";
  const headerGridStyle = {
    gridTemplateColumns: `100px repeat(${periodDays.length}, minmax(88px, 1fr))`,
    ...(isDark
      ? {
          backgroundColor: "var(--black)",
          borderColor: "var(--gray-dark)"
        }
      : {})
  };
  const rowGridStyle = {
    gridTemplateColumns: `100px repeat(${periodDays.length}, minmax(88px, 1fr))`,
    ...(isDark
      ? {
          borderColor: "var(--gray-dark)"
        }
      : {})
  };
  const panelStyle = isDark ? { backgroundColor: "var(--extra-dark-black)", borderColor: "var(--gray-dark)" } : undefined;
  const innerPanelStyle = isDark ? { backgroundColor: "var(--dark-black)", borderColor: "var(--gray-dark)" } : undefined;
  return (
    <SurfaceCard
      title="Preview Slots"
      description="Appointments by date and time"
      icon={CalendarDays}
      headerAction={null}
    >
      <div
        className={cn(
          "rounded-2xl border p-3 transition-colors",
          isDark ? "border-neutral-800 bg-transparent" : "border-slate-200 bg-white"
        )}
        style={panelStyle}
      >
        {!startDate || !endDate || endDate < startDate ? (
          <div
            className={cn(
              "rounded-xl border border-dashed px-4 py-8 text-center text-sm transition-colors",
              isDark
                ? "border-neutral-700 text-zinc-300"
                : "border-slate-300 bg-slate-50 text-slate-500"
            )}
            style={innerPanelStyle}
          >
            Select valid From/To dates to preview appointments.
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className={cn(
                "w-full max-w-full overflow-hidden rounded-xl border transition-colors",
                isDark ? "border-neutral-800" : "border-slate-200"
              )}
              style={panelStyle}
            >
              <div className="max-h-[400px] w-full overflow-x-auto overflow-y-auto">
                <div className="w-max min-w-full">
                  <div
                    className={cn(
                      "grid border-b text-center text-xs font-semibold transition-colors",
                      isDark ? "border-neutral-800 text-zinc-300" : "border-slate-200 bg-slate-50 text-slate-500"
                    )}
                    style={headerGridStyle}
                  >
                    <div className="px-2 py-3 text-left">Time</div>
                    {periodDays.map((day) => {
                      const key = formatLocalDateForApi(day) || "";
                      return (
                        <div
                          key={`header-${key}`}
                          className={cn(
                            "border-l px-2 py-3 transition-colors",
                            isDark ? "border-neutral-800" : "border-slate-200"
                          )}
                          style={isDark ? { borderColor: "var(--gray-dark)" } : undefined}
                        >
                          {day.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" })}
                        </div>
                      );
                    })}
                  </div>
                  {(timeRows.length > 0 ? timeRows : ["--:--"]).map((timeLabel) => (
                    <div
                      key={`row-${timeLabel}`}
                      className={cn(
                        "grid border-b last:border-b-0 transition-colors",
                        isDark ? "border-neutral-800" : "border-slate-100"
                      )}
                      style={rowGridStyle}
                    >
                      <div className={cn("px-2 py-3 text-sm font-medium", isDark ? "text-zinc-300" : "text-slate-600")}>
                        {timeLabel}
                      </div>
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
                          <div
                            key={`${dateKey}-${timeLabel}`}
                            className={cn(
                              "border-l px-2 py-2 transition-colors",
                              isDark ? "border-neutral-800" : "border-slate-100"
                            )}
                            style={isDark ? { borderColor: "var(--gray-dark)" } : undefined}
                          >
                            <div
                              className={cn(
                                "flex min-h-[44px] cursor-pointer flex-col items-center justify-center rounded-lg text-xs font-semibold transition-all",
                                count > 0 ? "text-white" : isDark ? "text-zinc-300" : "text-slate-500",
                                selectedCellKey === cellKey
                                  ? isDark
                                    ? "ring-2 ring-white ring-offset-1"
                                    : "ring-2 ring-slate-800 ring-offset-1 ring-offset-white"
                                  : ""
                              )}
                              style={{
                                backgroundColor: count > 0 ? color : isDark ? "var(--dark-black)" : undefined,
                                color: count > 0 ? undefined : isDark ? "var(--white)" : undefined
                              }}
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
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs transition-colors",
                    isDark ? "border-neutral-800 text-zinc-300" : "border-slate-200 bg-white text-slate-600"
                  )}
                  style={isDark ? { backgroundColor: "var(--dark-black)", borderColor: "var(--gray-dark)" } : undefined}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isLoadingCounts && (
        <div className={cn("mt-3 text-xs", isDark ? "text-zinc-400" : "text-slate-500")}>Loading appointments...</div>
      )}
    </SurfaceCard>
  );
};

export default PreviewSlotsCardSection;
