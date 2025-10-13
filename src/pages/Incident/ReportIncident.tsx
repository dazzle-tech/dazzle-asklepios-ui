import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, AlertTriangle } from "lucide-react";
import { FormData } from "@/types/incident";
import { BasicIncidentInfo } from "@/components/forms/BasicIncidentInfo";
import { PatientInformation } from "@/components/forms/PatientInformationProps";
import { EnvironmentalFactors } from "@/components/forms/EnvironmentalFactorsProps";
import { DocumentationAttachments } from "@/components/forms/DocumentationAttachmentsProps";
import React from "react";
import "./style.css";

const ReportIncident = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    // Basic Information
    title: "",
    description: "",
    department: "",
    location: "",
    building: "",
    severity: "",
    priority: "",
    riskLevel: "",
    category: "",
    date: "",
    time: "",

    // Reporter Information
    reporterName: "",
    reporterRole: "",
    reporterContact: "",
    reporterDepartment: "",
    reporterEmployeeId: "",

    // Patient Information
    patientInvolved: false,
    patientId: "",
    patientAge: "",
    patientGender: "",
    admissionStatus: "",
    primaryDiagnosis: "",
    patientCondition: "",
    injuryDetails: "",
    physicianNotified: false,
    familyNotified: false,

    // Environmental Factors
    shiftTime: "",
    staffingLevel: "",
    workload: "",
    contributingFactors: [],
    environmentalConditions: "",
    systemFactors: "",

    // Witnesses and Documentation
    witnessPresent: false,
    witnessDetails: "",
    equipmentInvolved: "",
    medicationsInvolved: "",
    policeCalled: false,
    mediaInvolved: false,

    // Actions and Follow-up
    immediateAction: "",
    preventiveActions: "",
    followUpRequired: false,
    followUpActions: "",
    rootCauseAnalysis: false,
    peerReview: false,
    qualityImprovement: false,

    // Risk Assessment
    likelihood: "",
    consequence: "",
    riskMatrix: "",
    regulatoryReporting: false,
    reportingAgency: "",

    // Quality Assurance
    supervisorNotified: false,
    supervisorName: "",
    riskManagerNotified: false,
    legalCounselNotified: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const riskScore = calculateRiskScore(formData.likelihood, formData.consequence);
    toast({
      title: "Incident Report Submitted Successfully",
      description: `Report ID: INC-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 1000)
      ).padStart(3, "0")} has been submitted for review.`,
    });
    console.log("Incident Report Data:", { ...formData, riskMatrix: riskScore });
  };

  const calculateRiskScore = (likelihood: string, consequence: string): string => {
    const likelihoodValues: Record<string, number> = {
      rare: 1,
      unlikely: 2,
      possible: 3,
      likely: 4,
      "almost-certain": 5,
    };
    const consequenceValues: Record<string, number> = {
      insignificant: 1,
      minor: 2,
      moderate: 3,
      major: 4,
      catastrophic: 5,
    };
    const score =
      (likelihoodValues[likelihood] || 0) * (consequenceValues[consequence] || 0);
    if (score >= 15) return "extreme";
    if (score >= 10) return "high";
    if (score >= 5) return "moderate";
    if (score >= 3) return "low";
    return "very-low";
  };

  return (
    <div className="!min-h-screen !bg-[hsl(var(--background))]">
      <div className="!max-w-[80%] !mx-auto !p-6">
        {/* Header */}
        <div className="!mb-4">
          <h1 className="!text-[22px] !font-extrabold !tracking-[-0.01em] !text-[hsl(var(--foreground))] !flex !items-center">
            <FileText className="!h-[18px] !w-[18px] !mr-2 !text-[#1E60D6]" />
            Report New Incident
          </h1>
          <p className="!text-[13px] !mt-1 !text-[hsl(var(--muted-foreground))]">
            Please provide detailed information about the incident. All fields marked with * are required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="!space-y-4">
          <BasicIncidentInfo formData={formData} setFormData={setFormData} />
          <PatientInformation formData={formData} setFormData={setFormData} />
          <EnvironmentalFactors formData={formData} setFormData={setFormData} />
          <DocumentationAttachments formData={formData} setFormData={setFormData} />

          {/* Footer / Submit */}
          <div className="!mt-4 !pt-4 !border-t !border-[#E6EBF1] !flex !items-center !justify-between">
            <div className="!flex !items-center !text-[13px] !text-[hsl(var(--muted-foreground))]">
              <AlertTriangle className="!h-[15px] !w-[15px] !mr-2" />
              All information provided will be kept confidential and used for quality improvement
            </div>

            <div className="!flex !gap-3">
              <Button
                type="button"
                variant="outline"
                className="!h-9 !px-4 !rounded-[8px] !bg-white !text-[#0f172a] !border !border-[#E5E7EB] hover:!bg-[#F9FAFB] !shadow-[0_1px_0_rgba(0,0,0,0.02)]"
              >
                Save Draft
              </Button>

              <Button
                type="submit"
                className="!h-9 !px-6 !rounded-[8px] !bg-[#0B66FF] hover:!bg-[#0957d9] !text-white !shadow-sm"
              >
                Submit Report
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIncident;
