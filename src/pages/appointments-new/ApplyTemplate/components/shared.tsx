import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/hooks";
import {
  CalendarRange,
  ChevronDown,
  FileCheck2,
  Hospital,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";

export type IconType = React.ComponentType<{ className?: string }>;

export type FilterField = {
  label: string;
  value: string;
  icon: IconType;
};

export type ResourceItem = {
  title: string;
  subtitle: string;
  icon: IconType;
};

export type SlotCell = {
  label: string;
  tone: "available" | "selected" | "partial" | "blocked" | "booked" | "empty";
};

export type GeneratedSlot = {
  date: string;
  time: string;
  slotType?: string;
  channel: string;
  duration: string;
  capacity: string;
  status: string;
  tone: "created" | "partial" | "skipped";
  checked?: boolean;
  alert?: boolean;
};

export const filterFields: FilterField[] = [
  { label: "Template", value: "Pediatrics Morning", icon: FileCheck2 },
  { label: "Date Range", value: "May 15, 2024  -  May 31, 2024", icon: CalendarRange },
  { label: "Facility", value: "Global Med Clinic", icon: Hospital },
  { label: "Department", value: "Pediatrics", icon: Stethoscope },
];

export const resources: ResourceItem[] = [
  {
    title: "ID Policy (Required)",
    subtitle: "Will be attached to all appointments",
    icon: ShieldCheck,
  },
  {
    title: "Pediatrics Skill Set",
    subtitle: "Auto-assign qualified staff",
    icon: Sparkles,
  },
];

export const policies = [{ label: "ID Required", tag: "Required" }];

export const exceptions = [
  {
    title: "May 20, 2024 (Hospital Holiday)",
    subtitle: "All day · Emergency maintenance",
  },
];

export const weekDays = ["Mon 15", "Tue 16", "Wed 17", "Thu 18", "Fri 19"];

export const slotRows: { time: string; cells: SlotCell[] }[] = [
  {
    time: "08:00",
    cells: [
      { label: "5", tone: "available" },
      { label: "3", tone: "available" },
      { label: "5", tone: "available" },
      { label: "2", tone: "available" },
      { label: "4", tone: "available" },
    ],
  },
  {
    time: "09:00",
    cells: [
      { label: "Selected", tone: "selected" },
      { label: "Blocked", tone: "blocked" },
      { label: "Selected", tone: "selected" },
      { label: "15", tone: "available" },
      { label: "—", tone: "empty" },
    ],
  },
  {
    time: "10:00",
    cells: [
      { label: "2 / 5", tone: "partial" },
      { label: "Selected", tone: "selected" },
      { label: "Selected", tone: "selected" },
      { label: "2 / 7", tone: "partial" },
      { label: "—", tone: "empty" },
    ],
  },
  {
    time: "11:00",
    cells: [
      { label: "5", tone: "available" },
      { label: "—", tone: "empty" },
      { label: "—", tone: "empty" },
      { label: "—", tone: "empty" },
      { label: "15", tone: "available" },
    ],
  },
  {
    time: "12:00",
    cells: [
      { label: "1 Booked", tone: "booked" },
      { label: "—", tone: "empty" },
      { label: "—", tone: "empty" },
      { label: "—", tone: "empty" },
      { label: "—", tone: "empty" },
    ],
  },
  {
    time: "13:00",
    cells: [
      { label: "—", tone: "empty" },
      { label: "—", tone: "empty" },
      { label: "—", tone: "empty" },
      { label: "—", tone: "empty" },
      { label: "—", tone: "empty" },
    ],
  },
  {
    time: "14:00",
    cells: [
      { label: "—", tone: "empty" },
      { label: "—", tone: "empty" },
      { label: "—", tone: "empty" },
      { label: "—", tone: "empty" },
      { label: "—", tone: "empty" },
    ],
  },
];

export const legendItems: { label: string; tone: SlotCell["tone"] }[] = [
  { label: "Available", tone: "available" },
  { label: "Selected", tone: "selected" },
  { label: "Partial", tone: "partial" },
  { label: "Blocked", tone: "blocked" },
  { label: "Booked", tone: "booked" },
];

export const generatedSlots: GeneratedSlot[] = [
  {
    date: "Mon, May 15",
    time: "09:00 - 09:30",
    channel: "Pediatrics Pool",
    duration: "30 min",
    capacity: "5 slots",
    status: "Will be created",
    tone: "created",
    checked: true,
  },
  {
    date: "Mon, May 15",
    time: "09:30 - 10:00",
    channel: "Pediatrics Pool",
    duration: "30 min",
    capacity: "3 slots",
    status: "Will be created",
    tone: "created",
    checked: true,
  },
  {
    date: "Tue, May 16",
    time: "09:00 - 09:30",
    channel: "Dr. Emma Johnson",
    duration: "30 min",
    capacity: "2 of 5",
    status: "Partial (3 slots)",
    tone: "partial",
    checked: false,
  },
  {
    date: "Wed, May 17",
    time: "10:00 - 10:30",
    channel: "Room 2",
    duration: "30 min",
    capacity: "5 slots",
    status: "Will be created",
    tone: "created",
    checked: true,
  },
  {
    date: "Mon, May 20",
    time: "—",
    channel: "Hospital Holiday",
    duration: "All day",
    capacity: "—",
    status: "Will be skipped",
    tone: "skipped",
    checked: false,
    alert: true,
  },
];

export const slotToneClasses: Record<SlotCell["tone"], string> = {
  available: "bg-emerald-500 text-white",
  selected: "bg-sky-500 text-white",
  partial: "bg-amber-400 text-slate-900",
  blocked: "bg-rose-500 text-white",
  booked: "bg-violet-500 text-white",
  empty: "bg-slate-100 text-slate-400",
};

export const generatedToneClasses: Record<GeneratedSlot["tone"], string> = {
  created: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  skipped: "bg-rose-100 text-rose-700",
};

export function SurfaceCard({
  title,
  description,
  icon: Icon,
  children,
  headerAction,
}: {
  title: string;
  description?: string;
  icon: IconType;
  children?: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  const isDark = useAppSelector((state: any) => state.ui.mode === "dark");
  return (
    <Card
      className="rounded-2xl border-border bg-card text-card-foreground shadow-sm"
      style={isDark ? { borderColor: "#3d3d3d", backgroundColor: "var(--dark-black)" } : undefined}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-1 text-[11px] font-semibold leading-tight tracking-tight text-card-foreground">
            <Icon className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
            {title}
          </CardTitle>
          {description ? <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{description}</p> : null}
        </div>
        {headerAction}
      </CardHeader>
      <Separator style={isDark ? { backgroundColor: "#3d3d3d" } : undefined} />
      <CardContent className="px-4 py-3">{children}</CardContent>
    </Card>
  );
}

export function FakeSelect({
  icon: Icon,
  label,
  value,
  compact,
}: FilterField & { compact?: boolean; key?: React.Key }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-left shadow-sm",
          compact ? "h-10" : "h-11",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="truncate text-sm font-medium text-slate-800">{value}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
    </div>
  );
}

export function MiniStat({
  label,
  value,
  className,
  valueClassName,
  labelClassName,
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card px-4 py-3 text-center shadow-sm", className)}>
      <div className={cn("text-2xl font-bold text-card-foreground", valueClassName)}>{value}</div>
      <div className={cn("mt-1 text-xs text-muted-foreground", labelClassName)}>{label}</div>
    </div>
  );
}

export function Pill({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SummaryRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: IconType;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-3 text-slate-500">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="text-right font-medium text-slate-800">{value}</div>
    </div>
  );
}
