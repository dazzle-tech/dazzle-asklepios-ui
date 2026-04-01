import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  Eye,
  FileCheck2,
  FlaskConical,
  Hospital,
  Info,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TimerReset,
  TriangleAlert,
  UserRound,
  Wrench,
} from "lucide-react";

type IconType = React.ComponentType<{ className?: string }>;

type FilterField = {
  label: string;
  value: string;
  icon: IconType;
};

type ResourceItem = {
  title: string;
  subtitle: string;
  icon: IconType;
};

type SlotCell = {
  label: string;
  tone: "available" | "selected" | "partial" | "blocked" | "booked" | "empty";
};

type GeneratedSlot = {
  date: string;
  time: string;
  channel: string;
  duration: string;
  capacity: string;
  status: string;
  tone: "created" | "partial" | "skipped";
  checked?: boolean;
  alert?: boolean;
};

const filterFields: FilterField[] = [
  { label: "Template", value: "Pediatrics Morning", icon: FileCheck2 },
  { label: "Date Range", value: "May 15, 2024  -  May 31, 2024", icon: CalendarRange },
  { label: "Facility", value: "Global Med Clinic", icon: Hospital },
  { label: "Department", value: "Pediatrics", icon: Stethoscope },
];

const resources: ResourceItem[] = [
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

const policies = [
  { label: "ID Required", tag: "Required" },
];

const exceptions = [
  {
    title: "May 20, 2024 (Hospital Holiday)",
    subtitle: "All day · Emergency maintenance",
  },
];

const weekDays = ["Mon 15", "Tue 16", "Wed 17", "Thu 18", "Fri 19"];

const slotRows: { time: string; cells: SlotCell[] }[] = [
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

const legendItems: { label: string; tone: SlotCell["tone"] }[] = [
  { label: "Available", tone: "available" },
  { label: "Selected", tone: "selected" },
  { label: "Partial", tone: "partial" },
  { label: "Blocked", tone: "blocked" },
  { label: "Booked", tone: "booked" },
];

const generatedSlots: GeneratedSlot[] = [
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

const slotToneClasses: Record<SlotCell["tone"], string> = {
  available: "bg-emerald-500 text-white",
  selected: "bg-sky-500 text-white",
  partial: "bg-amber-400 text-slate-900",
  blocked: "bg-rose-500 text-white",
  booked: "bg-violet-500 text-white",
  empty: "bg-slate-100 text-slate-400",
};

const generatedToneClasses: Record<GeneratedSlot["tone"], string> = {
  created: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  skipped: "bg-rose-100 text-rose-700",
};

function SurfaceCard({
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
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Icon className="h-4 w-4 text-slate-500" />
            {title}
          </CardTitle>
          {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
        </div>
        {headerAction}
      </CardHeader>
      <CardContent className="px-5 py-4">{children}</CardContent>
    </Card>
  );
}

function FakeSelect({
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-center">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

function Pill({ children, className }: { children?: React.ReactNode; className?: string }) {
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

const ApplyTemplate: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-[1420px] space-y-6">
        <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
                    Apply Template to Period
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Generate availability and free appointments from a template
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-slate-200 bg-white px-4 text-slate-700"
                  >
                    <Eye className="h-4 w-4" />
                    Preview Changes
                  </Button>
                  <Button className="h-11 rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-700">
                    <CalendarDays className="h-4 w-4" />
                    Apply Template
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_1.25fr_1fr_1fr_auto]">
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
                      <Button
                        variant="outline"
                        className="h-9 rounded-lg border-sky-200 bg-sky-50 px-3 text-sky-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add Resource
                      </Button>
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
                      <Button
                        variant="outline"
                        className="h-9 rounded-lg border-violet-200 bg-violet-50 px-3 text-violet-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add Policy
                      </Button>
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
                      <Button
                        variant="outline"
                        className="h-9 rounded-lg border-amber-200 bg-amber-50 px-3 text-amber-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add Exception
                      </Button>
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

                <Card className="rounded-2xl border-sky-200 bg-sky-50 shadow-sm">
                  <CardHeader className="px-5 py-4">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <TimerReset className="h-4 w-4 text-sky-600" />
                      Preview Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-4">
                    <MiniStat label="Slots/Day avg" value="34" />
                    <MiniStat label="Total Slots" value="255" />
                    <MiniStat label="Exceptions" value="2" />
                    <MiniStat label="Date Range" value="5 days" />
                  </CardContent>
                </Card>
              </div>

              <SurfaceCard
                title="Slot Details"
                description="Detailed information for the selected preview slot"
                icon={Info}
                headerAction={
                  <Pill className="bg-emerald-100 px-3 py-1 text-emerald-700">Available</Pill>
                }
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
                    <FakeSelect
                      compact
                      icon={Sparkles}
                      label=""
                      value="Pediatrics Certified"
                    />
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
                    <Button className="h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                      Book Test Appointment
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-xl border-slate-200 bg-white text-slate-700"
                    >
                      Block This Slot
                    </Button>
                    <button type="button" className="w-full text-center text-sm font-medium text-blue-600">
                      View Conflicts (0)
                    </button>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">Review & Confirm</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Review slots to be generated and confirm template application
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-slate-200 bg-white px-4 text-slate-700"
                  >
                    Back to Edit
                  </Button>
                  <Button className="h-11 rounded-xl bg-emerald-600 px-5 text-white hover:bg-emerald-700">
                    Apply Template
                  </Button>
                </div>
              </div>
            </div>

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
                        <Pill
                          className={cn(
                            slot.alert ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700",
                          )}
                        >
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function SummaryRow({
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

export default ApplyTemplate;
