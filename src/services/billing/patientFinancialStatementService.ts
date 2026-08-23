import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';

export type DashboardTotals = {
  grossCharges: number;
  patientResponsibility: number;
  insuranceShare: number;
  totalCollected: number;
  outstanding: number;
};

export type EncounterFinancialRow = {
  encounterId: number;
  encounterNumber?: string | null;
  encounterDate?: string | null;
  encounterTime?: string | null;
  encounterDateTime?: string | null;
  visitType?: string | null;
  facilityId?: number | null;
  departmentId?: number | null;
  practitionerId?: number | null;
  coverageType?: string | null;
  grossCharges: number;
  patientResponsibility: number;
  insuranceShare: number;
  collected: number;
  outstanding: number;
  financialStatus?: string | null;
  invoiceNumber?: string | null;
  invoiceId?: number | null;
  claimNumber?: string | null;
  claimId?: number | null;
};

export type PatientFinancialDashboard = {
  patientId: number;
  medicalRecordNumber?: string | null;
  patientName?: string | null;
  nationalId?: string | null;
  currency?: string | null;
  totals: DashboardTotals;
  encounters: EncounterFinancialRow[];
};

export type StatementHeader = {
  encounterId: number;
  encounterNumber?: string | null;
  patientName?: string | null;
  medicalRecordNumber?: string | null;
  encounterDateTime?: string | null;
  visitType?: string | null;
  financialStatus?: string | null;
  invoiceNumber?: string | null;
  invoiceId?: number | null;
  currency?: string | null;
  grossServices: number;
  vatAmount: number;
  patientBilled: number;
  collected: number;
  outstanding: number;
};

export type StatementVisitPatient = {
  patientName?: string | null;
  medicalRecordNumber?: string | null;
  nationalId?: string | null;
  facilityId?: number | null;
  departmentId?: number | null;
  practitionerId?: number | null;
  visitType?: string | null;
  encounterDateTime?: string | null;
  encounterDate?: string | null;
  encounterTime?: string | null;
  invoiceNumber?: string | null;
};

export type StatementCoveragePayer = {
  payerName?: string | null;
  coverageType?: string | null;
  memberId?: string | null;
  policyNumber?: string | null;
  eligibility?: string | null;
  authorization?: string | null;
  claimNumber?: string | null;
  claimId?: number | null;
  financialStatus?: string | null;
};

export type StatementServiceLine = {
  chargeLineId?: number | null;
  serviceCode?: string | null;
  serviceName?: string | null;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  deductibleAmount: number;
  copayAmount: number;
  nonCoveredAmount: number;
  patientResponsibility: number;
  insuranceShare: number;
  vatAmount: number;
  lineTotal: number;
};

export type StatementInvoiceBreakdown = {
  grossServices: number;
  discountAmount: number;
  netServices: number;
  taxableAmount: number;
  vatAmount: number;
  totalBilled: number;
};

export type StatementPatientSettlement = {
  patientBilled: number;
  collectedOnInvoice: number;
  walletReserved: number;
  refundsAdjustments: number;
  outstanding: number;
};

export type StatementInsuranceSplit = {
  eligibleAmount: number;
  deductibleAmount: number;
  patientCopayment: number;
  insuranceShare: number;
  nonCoveredAmount: number;
  insuranceResponsibility: number;
};

export type StatementReceiptRow = {
  paymentDate?: string | null;
  receiptNumber?: string | null;
  paymentMethod?: string | null;
  payer?: string | null;
  status?: string | null;
  amount: number;
};

export type StatementClaimFinancial = {
  claimId?: number | null;
  claimNumber?: string | null;
  claimStatus?: string | null;
  rejectionReason?: string | null;
  submittedAmount: number;
  approvedAmount: number;
  rejectedAmount: number;
  resubmittedAmount: number;
  finalApprovedAmount: number;
  insurancePaymentReceived: number;
  insuranceOutstanding: number;
};

export type StatementTimelineRow = {
  transactionDate?: string | null;
  transactionType?: string | null;
  reference?: string | null;
  debit: number;
  credit: number;
  runningBalance: number;
};

export type StatementSettlementParty = {
  party: string;
  billed: number;
  collected: number;
  outstanding: number;
};

export type StatementFinalSettlement = {
  grossCharges: number;
  patientBilled: number;
  insuranceBilled: number;
  patientCollected: number;
  insuranceCollected: number;
  totalCollected: number;
  patientOutstanding: number;
  insuranceOutstanding: number;
  visitOutstanding: number;
  overallFinancialStatus?: string | null;
  parties: StatementSettlementParty[];
};

export type StatementAuditRow = {
  eventDate?: string | null;
  event?: string | null;
  reference?: string | null;
  user?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  reason?: string | null;
};

export type StatementFooter = {
  preparedBy?: string | null;
  finalizedBy?: string | null;
  finalizedDate?: string | null;
  patientPaymentStatus?: string | null;
  insurancePaymentStatus?: string | null;
  overallSettlementStatus?: string | null;
  statementLifecycle?: string | null;
  generatedDate?: string | null;
};

export type EncounterFinancialStatement = {
  header: StatementHeader;
  visitPatient: StatementVisitPatient;
  coveragePayer: StatementCoveragePayer;
  serviceLines: StatementServiceLine[];
  invoiceBreakdown: StatementInvoiceBreakdown;
  patientSettlement: StatementPatientSettlement;
  insuranceSplit: StatementInsuranceSplit;
  receipts: StatementReceiptRow[];
  claimFinancial: StatementClaimFinancial;
  timeline: StatementTimelineRow[];
  finalSettlement: StatementFinalSettlement;
  auditTrail: StatementAuditRow[];
  footer: StatementFooter;
};

export const patientFinancialStatementService = createApi({
  reducerPath: 'patientFinancialStatementService',
  baseQuery: BaseQuery,
  tagTypes: ['PatientFinancialDashboard', 'EncounterFinancialStatement'],
  endpoints: builder => ({
    getPatientFinancialDashboard: builder.query<PatientFinancialDashboard, number>({
      query: patientId => ({
        url: `/api/patient/billing/financial-statement/patients/${patientId}/dashboard`,
        method: 'GET'
      }),
      providesTags: (_result, _error, patientId) => [
        { type: 'PatientFinancialDashboard', id: patientId }
      ]
    }),
    getEncounterFinancialStatement: builder.query<EncounterFinancialStatement, number>({
      query: encounterId => ({
        url: `/api/patient/billing/financial-statement/encounters/${encounterId}`,
        method: 'GET'
      }),
      providesTags: (_result, _error, encounterId) => [
        { type: 'EncounterFinancialStatement', id: encounterId }
      ]
    })
  })
});

export const {
  useGetPatientFinancialDashboardQuery,
  useGetEncounterFinancialStatementQuery
} = patientFinancialStatementService;
