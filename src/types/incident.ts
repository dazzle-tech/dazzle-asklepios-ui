export interface FormData {
  // Basic Information
  title: string;
  description: string;
  department: string;
  location: string;
  building: string;
  severity: string;
  priority: string;
  riskLevel: string;
  category: string;
  date: string;
  time: string;

  // Reporter Information
  reporterName: string;
  reporterRole: string;
  reporterContact: string;
  reporterDepartment: string;
  reporterEmployeeId: string;

  // Patient Information
  patientInvolved: boolean;
  patientId: string;
  patientAge: string;
  patientGender: string;
  admissionStatus: string;
  primaryDiagnosis: string;
  patientCondition: string;
  injuryDetails: string;
  physicianNotified: boolean;
  familyNotified: boolean;

  // Environmental Factors
  shiftTime: string;
  staffingLevel: string;
  workload: string;
  contributingFactors: string[];
  environmentalConditions: string;
  systemFactors: string;

  // Witnesses and Documentation
  witnessPresent: boolean;
  witnessDetails: string;
  equipmentInvolved: string;
  medicationsInvolved: string;
  policeCalled: boolean;
  mediaInvolved: boolean;

  // Actions and Follow-up
  immediateAction: string;
  preventiveActions: string;
  followUpRequired: boolean;
  followUpActions: string;
  rootCauseAnalysis: boolean;
  peerReview: boolean;
  qualityImprovement: boolean;

  // Risk Assessment
  likelihood: string;
  consequence: string;
  riskMatrix: string;
  regulatoryReporting: boolean;
  reportingAgency: string;

  // Quality Assurance
  supervisorNotified: boolean;
  supervisorName: string;
  riskManagerNotified: boolean;
  legalCounselNotified: boolean;
}