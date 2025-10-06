import { FormData } from "@/types/incident";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Clock, Users } from "lucide-react";
import React from "react";

interface EnvironmentalFactorsProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
}

export const EnvironmentalFactors = ({
  formData,
  setFormData,
}: EnvironmentalFactorsProps) => {
  const contributingFactors = [
    "Staffing levels inadequate",
    "Equipment malfunction",
    "Communication breakdown",
    "Time pressures",
    "Training insufficient",
    "Policies unclear",
    "Workload excessive",
    "Interruptions/distractions",
    "Lighting inadequate",
    "Noise levels high",
    "Space constraints",
    "Technology issues",
  ];

  const toggleContributingFactor = (factor: string) => {
    const current = formData.contributingFactors || [];
    const updated = current.includes(factor)
      ? current.filter((f) => f !== factor)
      : [...current, factor];
    setFormData({ ...formData, contributingFactors: updated });
  };

  const inputBox: React.CSSProperties = {
    height: 40,
    border: "1px solid #D6DFEA",
    borderRadius: 8,
    background: "#fff",
    paddingLeft: 12,
    paddingRight: 12,
  };

  const factorsGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    columnGap: 48,
    rowGap: 12,
  };

  return (
    <Card className="!rounded-[12px] !border !border-[#E6EBF1] !shadow-sm">
      <CardHeader className="!py-4 !px-6 !border-b !border-[#E6EBF1]">
        <CardTitle className="!text-[17px] !font-semibold !text-[hsl(var(--foreground))] !flex !items-center">
          <MapPin className="!h-[18px] !w-[18px] !mr-2 !text-[#1E60D6]" />
          Environmental & Contributing Factors
        </CardTitle>
      </CardHeader>

      <CardContent className="!px-6 !pt-5 !pb-6 !space-y-6">
        <section className="!grid md:!grid-cols-3 !gap-6">
          <div className="!space-y-2.5">
            <Label className="!flex !items-center !text-[14px] !font-medium">
              <Clock className="!h-[16px] !w-[16px] !mr-1" />
              Shift/Time Period
            </Label>
            <Select
              value={formData.shiftTime}
              onValueChange={(v) => setFormData({ ...formData, shiftTime: v })}
            >
              <SelectTrigger className="!text-[14px]" style={inputBox}>
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day-shift">Day Shift (7AM-7PM)</SelectItem>
                <SelectItem value="night-shift">Night Shift (7PM-7AM)</SelectItem>
                <SelectItem value="evening">Evening (3PM-11PM)</SelectItem>
                <SelectItem value="weekend">Weekend</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="!space-y-2.5">
            <Label className="!flex !items-center !text-[14px] !font-medium">
              <Users className="!h-[16px] !w-[16px] !mr-1" />
              Staffing Level
            </Label>
            <Select
              value={formData.staffingLevel}
              onValueChange={(v) => setFormData({ ...formData, staffingLevel: v })}
            >
              <SelectTrigger className="!text-[14px]" style={inputBox}>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adequate">Adequate</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="short-staffed">Short Staffed</SelectItem>
                <SelectItem value="critically-low">Critically Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="!space-y-2.5">
            <Label className="!text-[14px] !font-medium">Patient Acuity/Workload</Label>
            <Select
              value={formData.workload}
              onValueChange={(v) => setFormData({ ...formData, workload: v })}
            >
              <SelectTrigger className="!text-[14px]" style={inputBox}>
                <SelectValue placeholder="Select workload" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="very-high">Very High</SelectItem>
                <SelectItem value="overwhelming">Overwhelming</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="!space-y-3">
          <Label className="!text-[14px] !font-medium">
            Contributing Factors (Select all that apply)
          </Label>

          <div className="!mt-3" style={factorsGrid}>
            {contributingFactors.map((factor) => (
              <label
                key={factor}
                className="!text-[14px] !inline-flex !items-center !gap-2 !cursor-pointer"
              >
                <Checkbox
                  checked={formData.contributingFactors?.includes(factor) || false}
                  onCheckedChange={() => toggleContributingFactor(factor)}
                  className="
                    !h-[16px] !w-[16px]
                    !border-2 !border-[#1E60D6]
                    data-[state=checked]:bg-[#1E60D6]
                    data-[state=checked]:text-white
                    !rounded-[4px]
                  "
                />
                {factor}
              </label>
            ))}
          </div>
        </section>

        <section className="!space-y-2.5">
          <Label className="!text-[14px] !font-medium">Environmental Conditions</Label>
          <Textarea
            placeholder="Describe lighting, noise, temperature, cleanliness, space constraints, or other environmental factors that may have contributed..."
            value={formData.environmentalConditions}
            onChange={(e) =>
              setFormData({ ...formData, environmentalConditions: e.target.value })
            }
            className="!min-h-[96px] !text-[14px] !border !border-[#D6DFEA] !rounded-[8px]"
          />
        </section>

        <section className="!space-y-2.5">
          <Label className="!text-[14px] !font-medium">System/Process Factors</Label>
          <Textarea
            placeholder="Describe any organizational, systemic, or process-related factors that contributed to this incident..."
            value={formData.systemFactors}
            onChange={(e) =>
              setFormData({ ...formData, systemFactors: e.target.value })
            }
            className="!min-h-[96px] !text-[14px] !border !border-[#D6DFEA] !rounded-[8px]"
          />
        </section>
      </CardContent>
    </Card>
  );
};
