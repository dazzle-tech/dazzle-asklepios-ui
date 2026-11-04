import React from 'react';
import dayjs from 'dayjs';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyTable, { type ColumnConfig } from '@/components/MyTable/MyTable';
import type { EligibilityRequest } from './InsuranceEligibilityRequests';

type CoverageClass = {
  classType: string;
  className: string;
  classValue: string;
};

type CoverageCostBeneficiary = {
  costBeneficiaryType: string;
  costBeneficiaryQut: string | null;
  costBeneficiaryMoney: number | null;
  exceptionList: string[];
};

type Coverage = {
  memberId: string;
  policyNumber: string;
  policyHolder: string;
  inforce: string;
  notInforceReason: string | null;
  benefitStartDate: string;
  benefitEndDate: string;
  type: string;
  relationship: string;
  subscriberMemberId: string | null;
  status: string;
  siteEligibility: string;
  items: null;
  network: string;
  subrogation: string;
  classList: CoverageClass[];
  costBeneficiaries: CoverageCostBeneficiary[];
};

export type EligibilityResponse = {
  transactionId: number;
  responseId: number;
  outgoingTransactionId: string;
  eligibilityRequestId: string;
  beneficiaryName: string;
  subscriberName: string | null;
  status: string;
  outcome: string;
  disposition: string;
  noCoverageFoundReason: string | null;
  serviceDate: string;
  transactionDate: string;
  nphiesResponseId: string;
  transfer: boolean;
  siteEligibility: string;
  isNewBorn: boolean;
  purpose: string[];
  coverages: Coverage[];
  errors: string[] | null;
  eligibilityIdentifierUrl: string;
  documentId: string;
  documentType: string;
  payerId: string;
  isEmergency: boolean;
  requestBundleId: string;
  responseBundleId: string;
  tpa_Id: string | null;
};

const formatBoolean = (value: any) => {
  if (value === null || value === undefined || value === '') return '-';
  return value ? 'true' : 'false';
};

const formatDateTime = (value?: string) => (value ? dayjs(value).format('DD MMM YYYY, hh:mm A') : '-');

const formatDateOnly = (value?: string) => (value ? dayjs(value).format('DD MMM YYYY') : '-');

const getEligibilityColor = (value?: string) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'eligible') return '#166534';
  if (normalized === 'pending') return '#b9b90d';
  if (normalized === 'error') return '#c2410c';
  return '#475569';
};

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="detail-row">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const classListColumns: ColumnConfig[] = [
  { key: 'classType', title: 'Class Type' },
  { key: 'className', title: 'Class Name' },
  { key: 'classValue', title: 'Class Value' }
];

const costBeneficiaryColumns: ColumnConfig[] = [
  { key: 'costBeneficiaryType', title: 'Type' },
  { key: 'costBeneficiaryQut', title: 'Quantity' },
  { key: 'costBeneficiaryMoney', title: 'Money' },
  {
    key: 'exceptionList',
    title: 'Exceptions',
    render: row => (row.exceptionList?.length ? row.exceptionList.join(', ') : '-')
  }
];

type ContentProps = {
  request: EligibilityRequest | null;
  response: EligibilityResponse | null;
};

const EligibilityResponseModalContent = ({ request, response }: ContentProps) => {
  if (!response) return null;

  return (
    <div className="eligibility-response-modal">
      <div className="response-hero">
        <div className="response-hero__titles">
          <div className="response-hero__eyebrow">Eligibility Response</div>
          <h3>{request?.requestId ?? '-'}</h3>
          <p>
            {response.beneficiaryName ?? '-'}
            {response.subscriberName ? `, ${response.subscriberName}` : ''}
          </p>
        </div>
        <div className="response-hero__badges">
          <MyBadgeStatus contant={response.status ?? '-'} color="#475569" />
          <MyBadgeStatus contant={response.outcome ?? '-'} color="#1d4ed8" />
          <MyBadgeStatus
            contant={response.siteEligibility ?? '-'}
            color={getEligibilityColor(response.siteEligibility)}
          />
        </div>
      </div>

      <div className="response-section">
        <div className="response-section__header">
          <h4>Request Details</h4>
        </div>
        <div className="response-details-grid">
          <DetailRow label="Request ID" value={request?.requestId ?? '-'} />
          <DetailRow label="Encounter No" value={request?.encounterNo ?? '-'} />
          <DetailRow label="MRN" value={request?.mrn ?? '-'} />
          <DetailRow label="Patient Name" value={request?.patientName ?? '-'} />
          <DetailRow label="Requested By" value={request?.requestedBy ?? '-'} />
          <DetailRow label="Request Date/Time" value={formatDateTime(request?.requestDateTime)} />
          <DetailRow label="Response Date/Time" value={formatDateTime(request?.responseDateTime)} />
          <DetailRow label="Eligibility Reference No" value={request?.eligibilityReferenceNo ?? '-'} />
        </div>
      </div>

      <div className="response-section">
        <div className="response-section__header">
          <h4>Transaction Details</h4>
        </div>
        <div className="response-details-grid">
          <DetailRow label="Transaction ID" value={response.transactionId ?? '-'} />
          <DetailRow label="Response ID" value={response.responseId ?? '-'} />
          <DetailRow label="Outgoing Transaction ID" value={response.outgoingTransactionId ?? '-'} />
          <DetailRow label="Eligibility Request ID" value={response.eligibilityRequestId ?? '-'} />
          <DetailRow label="NPHIES Response ID" value={response.nphiesResponseId ?? '-'} />
          <DetailRow label="Document Type" value={response.documentType ?? '-'} />
          <DetailRow label="Document ID" value={response.documentId ?? '-'} />
          <DetailRow label="Payer ID" value={response.payerId ?? '-'} />
          <DetailRow label="Request Bundle ID" value={response.requestBundleId ?? '-'} />
          <DetailRow label="Response Bundle ID" value={response.responseBundleId ?? '-'} />
          <DetailRow label="Transfer" value={formatBoolean(response.transfer)} />
          <DetailRow label="Emergency" value={formatBoolean(response.isEmergency)} />
          <DetailRow label="New Born" value={formatBoolean(response.isNewBorn)} />
          <DetailRow label="Service Date" value={formatDateTime(response.serviceDate)} />
          <DetailRow label="Transaction Date" value={formatDateTime(response.transactionDate)} />
        </div>
      </div>

      <div className="response-section">
        <div className="response-section__header">
          <h4>Eligibility Outcome</h4>
        </div>
        <div className="response-details-grid">
          <DetailRow label="Status" value={response.status ?? '-'} />
          <DetailRow label="Outcome" value={response.outcome ?? '-'} />
          <DetailRow label="Disposition" value={response.disposition ?? '-'} />
          <DetailRow
            label="No Coverage Found Reason"
            value={response.noCoverageFoundReason ?? '-'}
          />
          <DetailRow label="Purpose" value={response.purpose?.length ? response.purpose.join(', ') : '-'} />
          <DetailRow label="Errors" value={response.errors?.length ? response.errors.join(', ') : '-'} />
          <DetailRow
            label="Eligibility Identifier URL"
            value={response.eligibilityIdentifierUrl ?? '-'}
          />
          <DetailRow label="TPA ID" value={response.tpa_Id ?? '-'} />
        </div>
      </div>

      {response.coverages?.map((coverage, index) => (
        <div className="response-section" key={`${coverage.policyNumber}-${index}`}>
          <div className="response-section__header">
            <h4>Coverage {index + 1}</h4>
            <span className="response-section__subtle">{coverage.type}</span>
          </div>
          <div className="response-details-grid">
            <DetailRow label="Member ID" value={coverage.memberId} />
            <DetailRow label="Policy Number" value={coverage.policyNumber} />
            <DetailRow label="Policy Holder" value={coverage.policyHolder} />
            <DetailRow label="Relationship" value={coverage.relationship} />
            <DetailRow label="Status" value={coverage.status} />
            <DetailRow label="Site Eligibility" value={coverage.siteEligibility} />
            <DetailRow label="Network" value={coverage.network} />
            <DetailRow label="Inforce" value={coverage.inforce} />
            <DetailRow label="Subrogation" value={coverage.subrogation} />
            <DetailRow label="Benefit Start Date" value={formatDateOnly(coverage.benefitStartDate)} />
            <DetailRow label="Benefit End Date" value={formatDateOnly(coverage.benefitEndDate)} />
            <DetailRow label="Subscriber Member ID" value={coverage.subscriberMemberId ?? '-'} />
          </div>

          <div className="response-subsection">
            <div className="response-section__header">
              <h5>Class List</h5>
            </div>
              <MyTable
                data={coverage.classList ?? []}
                columns={classListColumns}
                height={180}
                loading={false}
              />
          </div>

          <div className="response-subsection">
            <div className="response-section__header">
              <h5>Cost Beneficiaries</h5>
            </div>
              <MyTable
                data={coverage.costBeneficiaries ?? []}
                columns={costBeneficiaryColumns}
                height={180}
                loading={false}
              />
          </div>
        </div>
      ))}
    </div>
  );
};

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>> | ((open: boolean) => void);
  request: EligibilityRequest | null;
  response: EligibilityResponse | null;
};

const EligibilityResponseModal = ({ open, setOpen, request, response }: Props) => {
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={request ? `Eligibility Response - ${request.requestId}` : 'Eligibility Response'}
      icon={faFileLines}
      size="70vw"
      hideActionBtn
      content={<EligibilityResponseModalContent request={request} response={response} />}
    />
  );
};

export default EligibilityResponseModal;
