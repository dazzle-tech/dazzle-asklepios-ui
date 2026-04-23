import * as React from "react";
import { TriangleAlert, CalendarDays } from "lucide-react";
import MyTable from "@/components/MyTable/MyTable";
import { SurfaceCard, type GeneratedSlot } from "./shared";

type Props = {
  generatedSlots: GeneratedSlot[];
  generatedSlotsColumns: any[];
  totalSlotsToBeCreated: number;
  exceptionCount: number;
  /** When true (Exclude holidays mode), show the organization-calendar exceptions notice */
  excludeHolidays: boolean;
};

const SlotsToBeGeneratedSection: React.FC<Props> = ({
  generatedSlots,
  generatedSlotsColumns,
  totalSlotsToBeCreated,
  exceptionCount,
  excludeHolidays,
}) => {
  return (
    <SurfaceCard
      title="Slots to be Generated"
      description={`${totalSlotsToBeCreated} generated appointments (slots + buffers)`}
      icon={CalendarDays}
    >
      <MyTable data={generatedSlots} columns={generatedSlotsColumns as any} height={420} />

      {excludeHolidays ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          <span className="font-semibold">
            {exceptionCount} {exceptionCount === 1 ? "exception" : "exceptions"} will be applied
          </span>
          <span className="text-amber-700">
            - {exceptionCount} {exceptionCount === 1 ? "holiday" : "holidays"} from organization calendar
          </span>
        </div>
      ) : null}
    </SurfaceCard>
  );
};

export default SlotsToBeGeneratedSection;

