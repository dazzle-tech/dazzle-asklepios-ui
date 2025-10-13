import { FormData } from "@/types/incident";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { User, AlertCircle } from "lucide-react";
import React from "react";

interface PatientInformationProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
}

export const PatientInformation = ({ formData, setFormData }: PatientInformationProps) => {
  const checkboxBlue =
    "!h-[16px] !w-[16px] !rounded-[4px] " +
    "!border-2 !border-[#1E60D6] " +
    "data-[state=checked]:bg-[#1E60D6] data-[state=checked]:text-white";

  return (
    <Card className="!rounded-[12px] !border !border-[#E6EBF1] !shadow-sm">
      <CardHeader className="!py-4 !px-6 !border-b !border-[#E6EBF1]">
        <CardTitle className="!text-[17px] !font-semibold !text-[hsl(var(--foreground))] !flex !items-center">
          <User className="!h-[18px] !w-[18px] !mr-2 !text-[#1E60D6]" />
          Patient Information
        </CardTitle>
      </CardHeader>

      <CardContent className="!px-6 !pt-4 !pb-5">
        <div className="!flex !items-center !gap-2">
          <Checkbox
            id="patientInvolved"
            checked={formData.patientInvolved}
            onCheckedChange={(v) =>
              setFormData({ ...formData, patientInvolved: !!v })
            }
            className={checkboxBlue}
          />
          <Label
            htmlFor="patientInvolved"
            className="!text-[14px] !font-medium !text-[hsl(var(--foreground))]"
          >
            Patient was directly involved in this incident
          </Label>
        </div>

        {formData.patientInvolved && (
          <div className="!mt-4 !space-y-4 !p-4 !bg-[#F9FAFB] !rounded-[10px] !border !border-[#E6EBF1]">
            <div className="!flex !items-center !text-[13px] !text-amber-600 dark:!text-amber-400">
              <AlertCircle className="!h-[16px] !w-[16px] !mr-2" />
              Patient information is protected under HIPAA. Only provide necessary details.
            </div>

            <div className="!grid !gap-4 md:!grid-cols-3">
              <div className="!space-y-2">
                <Label htmlFor="patientId" className="!text-[12px] !font-medium">Patient MRN/ID *</Label>
                <Input
                  id="patientId"
                  placeholder="Medical Record Number"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="!h-9 !text-[13px]"
                />
              </div>

              <div className="!space-y-2">
                <Label htmlFor="patientAge" className="!text-[12px] !font-medium">Age Range</Label>
                <Select
                  value={formData.patientAge}
                  onValueChange={(value) => setFormData({ ...formData, patientAge: value })}
                >
                  <SelectTrigger className="!h-9 !text-[13px]">
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neonate">Neonate (0-28 days)</SelectItem>
                    <SelectItem value="infant">Infant (1-12 months)</SelectItem>
                    <SelectItem value="toddler">Toddler (1-3 years)</SelectItem>
                    <SelectItem value="child">Child (4-12 years)</SelectItem>
                    <SelectItem value="adolescent">Adolescent (13-17 years)</SelectItem>
                    <SelectItem value="adult">Adult (18-64 years)</SelectItem>
                    <SelectItem value="elderly">Elderly (65+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="!space-y-2">
                <Label htmlFor="patientGender" className="!text-[12px] !font-medium">Gender</Label>
                <Select
                  value={formData.patientGender}
                  onValueChange={(value) => setFormData({ ...formData, patientGender: value })}
                >
                  <SelectTrigger className="!h-9 !text-[13px]">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="!grid !gap-4 md:!grid-cols-2">
              <div className="!space-y-2">
                <Label htmlFor="admissionStatus" className="!text-[12px] !font-medium">Admission Status</Label>
                <Select
                  value={formData.admissionStatus}
                  onValueChange={(value) => setFormData({ ...formData, admissionStatus: value })}
                >
                  <SelectTrigger className="!h-9 !text-[13px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inpatient">Inpatient</SelectItem>
                    <SelectItem value="outpatient">Outpatient</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="day-surgery">Day Surgery</SelectItem>
                    <SelectItem value="observation">Observation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="!space-y-2">
                <Label htmlFor="primaryDiagnosis" className="!text-[12px] !font-medium">Primary Diagnosis</Label>
                <Input
                  id="primaryDiagnosis"
                  placeholder="Primary medical condition"
                  value={formData.primaryDiagnosis}
                  onChange={(e) => setFormData({ ...formData, primaryDiagnosis: e.target.value })}
                  className="!h-9 !text-[13px]"
                />
              </div>
            </div>

            <div className="!space-y-2">
              <Label htmlFor="patientCondition" className="!text-[12px] !font-medium">Patient Condition/Mobility</Label>
              <Textarea
                id="patientCondition"
                placeholder="Relevant medical conditions, mobility restrictions, cognitive status, communication barriers..."
                value={formData.patientCondition}
                onChange={(e) => setFormData({ ...formData, patientCondition: e.target.value })}
                className="!min-h-[80px] !text-[13px]"
              />
            </div>

            <div className="!space-y-2">
              <Label htmlFor="injuryDetails" className="!text-[12px] !font-medium">Injury/Harm Details</Label>
              <Textarea
                id="injuryDetails"
                placeholder="Describe any injuries, harm, or potential harm to the patient as a result of this incident..."
                value={formData.injuryDetails}
                onChange={(e) => setFormData({ ...formData, injuryDetails: e.target.value })}
                className="!min-h-[80px] !text-[13px]"
              />
            </div>

            <div className="!grid !gap-4 md:!grid-cols-2">
              <label htmlFor="physicianNotified" className="!flex !items-center !gap-2">
                <Checkbox
                  id="physicianNotified"
                  checked={formData.physicianNotified}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, physicianNotified: !!v })
                  }
                  className={checkboxBlue}
                />
                <span className="!text-[13px]">Attending physician notified</span>
              </label>

              <label htmlFor="familyNotified" className="!flex !items-center !gap-2">
                <Checkbox
                  id="familyNotified"
                  checked={formData.familyNotified}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, familyNotified: !!v })
                  }
                  className={checkboxBlue}
                />
                <span className="!text-[13px]">Patient/family notified</span>
              </label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
