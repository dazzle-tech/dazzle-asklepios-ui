import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyInput from '@/components/MyInput';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import {
  faArrowRotateRight,
  faEye,
  faFileExport,
  faFileLines,
  faFilterCircleXmark
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { Drawer, Form, Panel } from 'rsuite';
import EligibilityResponseModal, { type EligibilityResponse } from './EligibilityResponseModal';
import './style.less';

type EligibilityStatus = 'ELIGIBLE' | 'PENDING' | 'ERROR';

export type EligibilityRequest = {
  requestId: string;
  encounterNo: string;
  mrn: string;
  patientName: string;
  insuranceCompany: string;
  policyNumber: string;
  memberId: string;
  eligibilityStatus: EligibilityStatus;
  eligibilityReferenceNo: string;
  coverageStartDate: string;
  coverageEndDate: string;
  coPayment: string;
  requestedBy: string;
  requestDateTime: string;
  responseDateTime: string;
  errorMessage: string;
  responseDetails: string;
  responseCode: string;
  responseMessage: string;
};

type FilterState = {
  filterKey?: string;
  value?: string;
};

type EligibilityEntry = {
  request: EligibilityRequest;
  response: EligibilityResponse;
};

const STATIC_ELIGIBILITY_DATA: EligibilityEntry[] = [
  {
    request: {
      requestId: 'ELG-2026-0109',
      encounterNo: 'ENC-44812',
      mrn: 'MRN-105221',
      patientName: 'Aya Hassan',
      insuranceCompany: 'Blue Shield',
      policyNumber: 'BS-4401221',
      memberId: 'MBR-88901',
      eligibilityStatus: 'ELIGIBLE',
      eligibilityReferenceNo: 'REF-778811',
      coverageStartDate: '2026-01-01',
      coverageEndDate: '2026-12-31',
      coPayment: '$15.00',
      requestedBy: 'Dr. Lina',
      requestDateTime: '2026-05-24T14:22:00Z',
      responseDateTime: '2026-05-24T14:22:09Z',
      errorMessage: '',
      responseDetails: 'Coverage active. Deductible met for primary consultation.',
      responseCode: '200',
      responseMessage: 'Eligible'
    },
    response: {
      transactionId: 11196,
      responseId: 5256,
      outgoingTransactionId: '11366',
      eligibilityRequestId: 'ELG-2026-0109',
      beneficiaryName: 'Aya Hassan',
      subscriberName: null,
      status: 'Active',
      outcome: 'Processing Complete',
      disposition: 'Coverage is in-force',
      noCoverageFoundReason: null,
      serviceDate: '2026-05-24T14:21:50Z',
      transactionDate: '2026-05-24T14:22:09Z',
      nphiesResponseId: '1e7ffeae-a5f9-4bd8-aa0c-e24995e0c1dc',
      transfer: false,
      siteEligibility: 'eligible',
      isNewBorn: false,
      purpose: ['Validation', 'Consultation'],
      coverages: [
        {
          memberId: 'MBR-88901',
          policyNumber: 'BS-4401221',
          policyHolder: 'MBR-88901',
          inforce: 'true',
          notInforceReason: null,
          benefitStartDate: '2026-01-01T00:00:00.000+0000',
          benefitEndDate: '2026-12-31T00:00:00.000+0000',
          type: 'Primary Medical',
          relationship: 'Self',
          subscriberMemberId: null,
          status: 'Active',
          siteEligibility: 'eligible',
          items: null,
          network: 'Blue Network',
          subrogation: 'false',
          classList: [
            { classType: 'group', className: 'Corporate A', classValue: '123450001' },
            { classType: 'plan', className: 'Gold Plan', classValue: 'BS-4401221' }
          ],
          costBeneficiaries: [
            { costBeneficiaryType: 'gpvisit', costBeneficiaryQut: null, costBeneficiaryMoney: 15, exceptionList: [] },
            { costBeneficiaryType: 'spvisit', costBeneficiaryQut: '5', costBeneficiaryMoney: 25, exceptionList: [] }
          ]
        }
      ],
      errors: null,
      eligibilityIdentifierUrl: 'http://pseudo-payer.com.sa/coverageeligibilityresponse',
      documentId: '11111111',
      documentType: 'PPN',
      payerId: 'INS-FHIR',
      isEmergency: false,
      requestBundleId: '00000000-0000-2c66-0000-019c93ebd2a2',
      responseBundleId: 'f739af18-9c82-4804-8ee1-f1b9954d13ac',
      tpa_Id: null
    }
  },
  {
    request: {
      requestId: 'ELG-2026-0108',
      encounterNo: 'ENC-44811',
      mrn: 'MRN-105220',
      patientName: 'Omar Saleh',
      insuranceCompany: 'National Care',
      policyNumber: 'NC-100744',
      memberId: 'MBR-77112',
      eligibilityStatus: 'PENDING',
      eligibilityReferenceNo: 'REF-778810',
      coverageStartDate: '2025-10-01',
      coverageEndDate: '2026-09-30',
      coPayment: '$20.00',
      requestedBy: 'Reception 2',
      requestDateTime: '2026-05-24T13:55:00Z',
      responseDateTime: '',
      errorMessage: '',
      responseDetails: 'Request submitted to payer, awaiting response.',
      responseCode: '102',
      responseMessage: 'Pending'
    },
    response: {
      transactionId: 11197,
      responseId: 5257,
      outgoingTransactionId: '11367',
      eligibilityRequestId: 'ELG-2026-0108',
      beneficiaryName: 'Omar Saleh',
      subscriberName: null,
      status: 'Pending',
      outcome: 'Processing',
      disposition: 'Request submitted to payer',
      noCoverageFoundReason: null,
      serviceDate: '2026-05-24T13:54:50Z',
      transactionDate: '2026-05-24T13:55:11Z',
      nphiesResponseId: '6e4cf1f2-0d26-4e88-9a38-6a2b2c0a1111',
      transfer: false,
      siteEligibility: 'pending',
      isNewBorn: false,
      purpose: ['Validation'],
      coverages: [],
      errors: null,
      eligibilityIdentifierUrl: 'http://pseudo-payer.com.sa/coverageeligibilityresponse',
      documentId: '11111111',
      documentType: 'PPN',
      payerId: 'INS-FHIR',
      isEmergency: false,
      requestBundleId: '00000000-0000-2c66-0000-019c93ebd2a2',
      responseBundleId: 'f739af18-9c82-4804-8ee1-f1b9954d13ac',
      tpa_Id: null
    }
  },
  {
    request: {
      requestId: 'ELG-2026-0107',
      encounterNo: 'ENC-44790',
      mrn: 'MRN-105199',
      patientName: 'Maha Abdelrahman',
      insuranceCompany: 'Harmony Health',
      policyNumber: 'HH-220900',
      memberId: 'MBR-54010',
      eligibilityStatus: 'ERROR',
      eligibilityReferenceNo: 'REF-778809',
      coverageStartDate: '2025-01-01',
      coverageEndDate: '2025-12-31',
      coPayment: '$0.00',
      requestedBy: 'Dr. Sami',
      requestDateTime: '2026-05-24T11:08:00Z',
      responseDateTime: '2026-05-24T11:08:12Z',
      errorMessage: 'Member active coverage not found under submitted policy.',
      responseDetails: 'Payer responded with no active coverage.',
      responseCode: '409',
      responseMessage: 'Error'
    },
    response: {
      transactionId: 11198,
      responseId: 5258,
      outgoingTransactionId: '11368',
      eligibilityRequestId: 'ELG-2026-0107',
      beneficiaryName: 'Maha Abdelrahman',
      subscriberName: null,
      status: 'Inactive',
      outcome: 'Failed',
      disposition: 'Coverage is not in-force',
      noCoverageFoundReason: 'Policy expired',
      serviceDate: '2026-05-24T11:07:40Z',
      transactionDate: '2026-05-24T11:08:12Z',
      nphiesResponseId: '8d5c229b-5d84-451f-8d11-3e0c1f4d2222',
      transfer: false,
      siteEligibility: 'not eligible',
      isNewBorn: false,
      purpose: ['Validation'],
      coverages: [
        {
          memberId: 'MBR-54010',
          policyNumber: 'HH-220900',
          policyHolder: 'Maha Abdelrahman',
          inforce: 'false',
          notInforceReason: 'Policy expired',
          benefitStartDate: '2025-01-01T00:00:00.000+0000',
          benefitEndDate: '2025-12-31T00:00:00.000+0000',
          type: 'Primary Medical',
          relationship: 'Self',
          subscriberMemberId: null,
          status: 'Inactive',
          siteEligibility: 'not eligible',
          items: null,
          network: 'Harmony Care',
          subrogation: 'false',
          classList: [
            { classType: 'group', className: 'Harmony Group', classValue: 'HH-1001' }
          ],
          costBeneficiaries: []
        }
      ],
      errors: ['Member active coverage not found under submitted policy.'],
      eligibilityIdentifierUrl: 'http://pseudo-payer.com.sa/coverageeligibilityresponse',
      documentId: '11111111',
      documentType: 'PPN',
      payerId: 'INS-FHIR',
      isEmergency: false,
      requestBundleId: '00000000-0000-2c66-0000-019c93ebd2a2',
      responseBundleId: 'f739af18-9c82-4804-8ee1-f1b9954d13ac',
      tpa_Id: null
    }
  },
  {
    request: {
      requestId: 'ELG-2026-0106',
      encounterNo: 'ENC-44761',
      mrn: 'MRN-105180',
      patientName: 'Khaled Nasser',
      insuranceCompany: 'Blue Shield',
      policyNumber: 'BS-4400988',
      memberId: 'MBR-77110',
      eligibilityStatus: 'ERROR',
      eligibilityReferenceNo: 'REF-778808',
      coverageStartDate: '2024-11-01',
      coverageEndDate: '2025-10-31',
      coPayment: '$25.00',
      requestedBy: 'Billing Desk',
      requestDateTime: '2026-05-23T17:42:00Z',
      responseDateTime: '2026-05-23T17:42:31Z',
      errorMessage: 'Provider timeout while checking eligibility.',
      responseDetails: 'Request failed due to network timeout.',
      responseCode: '504',
      responseMessage: 'Error'
    },
    response: {
      transactionId: 11199,
      responseId: 5259,
      outgoingTransactionId: '11369',
      eligibilityRequestId: 'ELG-2026-0106',
      beneficiaryName: 'Khaled Nasser',
      subscriberName: null,
      status: 'Error',
      outcome: 'Timeout',
      disposition: 'Provider timeout while checking eligibility',
      noCoverageFoundReason: 'Gateway timeout',
      serviceDate: '2026-05-23T17:41:50Z',
      transactionDate: '2026-05-23T17:42:31Z',
      nphiesResponseId: 'f2a11c7d-4b74-4f09-a7b0-2a1b2c0c3333',
      transfer: false,
      siteEligibility: 'error',
      isNewBorn: false,
      purpose: ['Validation'],
      coverages: [],
      errors: ['Request failed due to network timeout.'],
      eligibilityIdentifierUrl: 'http://pseudo-payer.com.sa/coverageeligibilityresponse',
      documentId: '11111111',
      documentType: 'PPN',
      payerId: 'INS-FHIR',
      isEmergency: true,
      requestBundleId: '00000000-0000-2c66-0000-019c93ebd2a2',
      responseBundleId: 'f739af18-9c82-4804-8ee1-f1b9954d13ac',
      tpa_Id: null
    }
  },
  {
    request: {
      requestId: 'ELG-2026-0105',
      encounterNo: 'ENC-44734',
      mrn: 'MRN-105162',
      patientName: 'Sara Youssef',
      insuranceCompany: 'CareOne',
      policyNumber: 'CO-881004',
      memberId: 'MBR-22015',
      eligibilityStatus: 'ELIGIBLE',
      eligibilityReferenceNo: 'REF-778807',
      coverageStartDate: '2026-02-01',
      coverageEndDate: '2027-01-31',
      coPayment: '$10.00',
      requestedBy: 'Dr. Hadi',
      requestDateTime: '2026-05-22T09:12:00Z',
      responseDateTime: '2026-05-22T09:12:07Z',
      errorMessage: '',
      responseDetails: 'Plan covers outpatient visits with standard co-pay.',
      responseCode: '200',
      responseMessage: 'Eligible'
    },
    response: {
      transactionId: 11200,
      responseId: 5260,
      outgoingTransactionId: '11370',
      eligibilityRequestId: 'ELG-2026-0105',
      beneficiaryName: 'Sara Youssef',
      subscriberName: null,
      status: 'Active',
      outcome: 'Processing Complete',
      disposition: 'Coverage is in-force',
      noCoverageFoundReason: null,
      serviceDate: '2026-05-22T09:11:51Z',
      transactionDate: '2026-05-22T09:12:07Z',
      nphiesResponseId: '9c1a2d0f-1dcb-4e12-9d4d-222233334444',
      transfer: false,
      siteEligibility: 'eligible',
      isNewBorn: false,
      purpose: ['Validation'],
      coverages: [
        {
          memberId: 'MBR-22015',
          policyNumber: 'CO-881004',
          policyHolder: 'Sara Youssef',
          inforce: 'true',
          notInforceReason: null,
          benefitStartDate: '2026-02-01T00:00:00.000+0000',
          benefitEndDate: '2027-01-31T00:00:00.000+0000',
          type: 'Specialist Plus',
          relationship: 'Self',
          subscriberMemberId: null,
          status: 'Active',
          siteEligibility: 'eligible',
          items: null,
          network: 'CareOne Network',
          subrogation: 'true',
          classList: [
            { classType: 'group', className: 'CareOne Group', classValue: 'CO-4401' },
            { classType: 'plan', className: 'Silver Plus', classValue: 'CO-881004' }
          ],
          costBeneficiaries: [
            { costBeneficiaryType: 'gpvisit', costBeneficiaryQut: null, costBeneficiaryMoney: 10, exceptionList: [] }
          ]
        }
      ],
      errors: null,
      eligibilityIdentifierUrl: 'http://pseudo-payer.com.sa/coverageeligibilityresponse',
      documentId: '11111111',
      documentType: 'PPN',
      payerId: 'INS-FHIR',
      isEmergency: false,
      requestBundleId: '00000000-0000-2c66-0000-019c93ebd2a2',
      responseBundleId: 'f739af18-9c82-4804-8ee1-f1b9954d13ac',
      tpa_Id: null
    }
  },
  {
    request: {
      requestId: 'ELG-2026-0104',
      encounterNo: 'ENC-44712',
      mrn: 'MRN-105151',
      patientName: 'Rami Khalil',
      insuranceCompany: 'National Care',
      policyNumber: 'NC-100501',
      memberId: 'MBR-99114',
      eligibilityStatus: 'PENDING',
      eligibilityReferenceNo: 'REF-778806',
      coverageStartDate: '2025-03-01',
      coverageEndDate: '2026-02-28',
      coPayment: '$18.00',
      requestedBy: 'Admissions',
      requestDateTime: '2026-05-21T15:03:00Z',
      responseDateTime: '',
      errorMessage: '',
      responseDetails: 'Queued for payer processing.',
      responseCode: '102',
      responseMessage: 'Pending'
    },
    response: {
      transactionId: 11201,
      responseId: 5261,
      outgoingTransactionId: '11371',
      eligibilityRequestId: 'ELG-2026-0104',
      beneficiaryName: 'Rami Khalil',
      subscriberName: null,
      status: 'Pending',
      outcome: 'Queued',
      disposition: 'Queued for payer processing',
      noCoverageFoundReason: null,
      serviceDate: '2026-05-21T15:02:51Z',
      transactionDate: '2026-05-21T15:03:03Z',
      nphiesResponseId: 'c2f8b0f1-6a2d-4ef8-b31f-555566667777',
      transfer: false,
      siteEligibility: 'pending',
      isNewBorn: false,
      purpose: ['Validation'],
      coverages: [],
      errors: null,
      eligibilityIdentifierUrl: 'http://pseudo-payer.com.sa/coverageeligibilityresponse',
      documentId: '11111111',
      documentType: 'PPN',
      payerId: 'INS-FHIR',
      isEmergency: false,
      requestBundleId: '00000000-0000-2c66-0000-019c93ebd2a2',
      responseBundleId: 'f739af18-9c82-4804-8ee1-f1b9954d13ac',
      tpa_Id: null
    }
  },
  {
    request: {
      requestId: 'ELG-2026-0103',
      encounterNo: 'ENC-44688',
      mrn: 'MRN-105143',
      patientName: 'Dalia Fares',
      insuranceCompany: 'Harmony Health',
      policyNumber: 'HH-220811',
      memberId: 'MBR-33121',
      eligibilityStatus: 'ERROR',
      eligibilityReferenceNo: 'REF-778805',
      coverageStartDate: '2025-05-01',
      coverageEndDate: '2025-12-31',
      coPayment: '$0.00',
      requestedBy: 'Dr. Rana',
      requestDateTime: '2026-05-20T08:45:00Z',
      responseDateTime: '2026-05-20T08:45:06Z',
      errorMessage: 'Coverage expired on 2025-12-31.',
      responseDetails: 'Policy is no longer active.',
      responseCode: '409',
      responseMessage: 'Error'
    },
    response: {
      transactionId: 11202,
      responseId: 5262,
      outgoingTransactionId: '11372',
      eligibilityRequestId: 'ELG-2026-0103',
      beneficiaryName: 'Dalia Fares',
      subscriberName: null,
      status: 'Inactive',
      outcome: 'Failed',
      disposition: 'Policy is no longer active',
      noCoverageFoundReason: 'Coverage expired',
      serviceDate: '2026-05-20T08:44:50Z',
      transactionDate: '2026-05-20T08:45:06Z',
      nphiesResponseId: 'dd4f1d7a-9d7f-4f9f-8888-99990000aaaa',
      transfer: false,
      siteEligibility: 'not eligible',
      isNewBorn: false,
      purpose: ['Validation'],
      coverages: [
        {
          memberId: 'MBR-33121',
          policyNumber: 'HH-220811',
          policyHolder: 'Dalia Fares',
          inforce: 'false',
          notInforceReason: 'Coverage expired',
          benefitStartDate: '2025-05-01T00:00:00.000+0000',
          benefitEndDate: '2025-12-31T00:00:00.000+0000',
          type: 'Primary Medical',
          relationship: 'Self',
          subscriberMemberId: null,
          status: 'Inactive',
          siteEligibility: 'not eligible',
          items: null,
          network: 'Harmony Care',
          subrogation: 'false',
          classList: [
            { classType: 'group', className: 'Harmony Group', classValue: 'HH-1002' }
          ],
          costBeneficiaries: []
        }
      ],
      errors: ['Coverage expired on 2025-12-31.'],
      eligibilityIdentifierUrl: 'http://pseudo-payer.com.sa/coverageeligibilityresponse',
      documentId: '11111111',
      documentType: 'PPN',
      payerId: 'INS-FHIR',
      isEmergency: false,
      requestBundleId: '00000000-0000-2c66-0000-019c93ebd2a2',
      responseBundleId: 'f739af18-9c82-4804-8ee1-f1b9954d13ac',
      tpa_Id: null
    }
  },
  {
    request: {
      requestId: 'ELG-2026-0102',
      encounterNo: 'ENC-44640',
      mrn: 'MRN-105130',
      patientName: 'Hala Omar',
      insuranceCompany: 'Blue Shield',
      policyNumber: 'BS-4400455',
      memberId: 'MBR-44001',
      eligibilityStatus: 'ELIGIBLE',
      eligibilityReferenceNo: 'REF-778804',
      coverageStartDate: '2025-06-01',
      coverageEndDate: '2026-05-31',
      coPayment: '$12.00',
      requestedBy: 'Billing Desk',
      requestDateTime: '2026-05-19T14:20:00Z',
      responseDateTime: '2026-05-19T14:20:08Z',
      errorMessage: '',
      responseDetails: 'Coverage active with specialist benefits.',
      responseCode: '200',
      responseMessage: 'Eligible'
    },
    response: {
      transactionId: 11203,
      responseId: 5263,
      outgoingTransactionId: '11373',
      eligibilityRequestId: 'ELG-2026-0102',
      beneficiaryName: 'Hala Omar',
      subscriberName: null,
      status: 'Active',
      outcome: 'Processing Complete',
      disposition: 'Coverage is in-force',
      noCoverageFoundReason: null,
      serviceDate: '2026-05-19T14:19:50Z',
      transactionDate: '2026-05-19T14:20:08Z',
      nphiesResponseId: 'abcd1234-5678-4ef9-aaaa-bbbbccccdddd',
      transfer: false,
      siteEligibility: 'eligible',
      isNewBorn: false,
      purpose: ['Validation', 'Specialist Check'],
      coverages: [
        {
          memberId: 'MBR-44001',
          policyNumber: 'BS-4400455',
          policyHolder: 'Hala Omar',
          inforce: 'true',
          notInforceReason: null,
          benefitStartDate: '2025-06-01T00:00:00.000+0000',
          benefitEndDate: '2026-05-31T00:00:00.000+0000',
          type: 'Primary Medical',
          relationship: 'Self',
          subscriberMemberId: null,
          status: 'Active',
          siteEligibility: 'eligible',
          items: null,
          network: 'Blue Shield Network',
          subrogation: 'false',
          classList: [
            { classType: 'group', className: 'Blue Shield Group', classValue: 'BS-4400455' },
            { classType: 'plan', className: 'Standard', classValue: 'BS-STD' }
          ],
          costBeneficiaries: [
            { costBeneficiaryType: 'gpvisit', costBeneficiaryQut: null, costBeneficiaryMoney: 12, exceptionList: [] }
          ]
        }
      ],
      errors: null,
      eligibilityIdentifierUrl: 'http://pseudo-payer.com.sa/coverageeligibilityresponse',
      documentId: '11111111',
      documentType: 'PPN',
      payerId: 'INS-FHIR',
      isEmergency: false,
      requestBundleId: '00000000-0000-2c66-0000-019c93ebd2a2',
      responseBundleId: 'f739af18-9c82-4804-8ee1-f1b9954d13ac',
      tpa_Id: null
    }
  }
];

const PAYOR_OPTIONS = [
  { label: 'Blue Shield', value: 'Blue Shield' },
  { label: 'National Care', value: 'National Care' },
  { label: 'Harmony Health', value: 'Harmony Health' },
  { label: 'CareOne', value: 'CareOne' }
];

const REQUESTED_BY_OPTIONS = [
  { label: 'Dr. Lina', value: 'Dr. Lina' },
  { label: 'Reception 2', value: 'Reception 2' },
  { label: 'Dr. Sami', value: 'Dr. Sami' },
  { label: 'Billing Desk', value: 'Billing Desk' },
  { label: 'Admissions', value: 'Admissions' },
  { label: 'Dr. Hadi', value: 'Dr. Hadi' },
  { label: 'Dr. Rana', value: 'Dr. Rana' }
];

const STATUS_OPTIONS = [
  { label: 'Eligible', value: 'ELIGIBLE' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Error', value: 'ERROR' }
];

const FILTER_OPTIONS = [
  { label: 'Request ID', value: 'requestId' },
  { label: 'Encounter No', value: 'encounterNo' },
  { label: 'MRN', value: 'mrn' },
  { label: 'Patient Name', value: 'patientName' },
  { label: 'Insurance Company', value: 'insuranceCompany' },
  { label: 'Member ID', value: 'memberId' },
  { label: 'Eligibility Status', value: 'eligibilityStatus' },
  { label: 'Request Date', value: 'requestDateTime' },
  { label: 'Requested By', value: 'requestedBy' }
];

const statusMeta: Record<
  EligibilityStatus,
  { label: string; color: string }
> = {
  ELIGIBLE: {
    label: 'Eligible',
    color: '#166534'
  },
  PENDING: { label: 'Pending', color: '#b9b90d' },
  ERROR: { label: 'Error', color: '#c2410c' }
};

const toText = (value: any) => String(value ?? '').trim().toLowerCase();

const buildStaticResponse = (row: EligibilityRequest): EligibilityResponse => ({
  ...(STATIC_ELIGIBILITY_DATA.find(item => item.request.requestId === row.requestId)?.response ??
    STATIC_ELIGIBILITY_DATA[0].response),
  eligibilityRequestId: row.requestId,
  beneficiaryName: row.patientName
});

const formatDateTime = (value?: string) => (value ? dayjs(value).format('DD MMM YYYY, hh:mm A') : '-');

const formatDateOnly = (value?: string) => (value ? dayjs(value).format('DD MMM YYYY') : '-');

const downloadCsv = (rows: EligibilityRequest[]) => {
  const headers = [
    'Request ID',
    'Encounter No',
    'Patient MRN',
    'Patient Name',
    'Insurance Company',
    'Policy Number',
    'Member ID',
    'Eligibility Status',
    'Eligibility Reference No',
    'Coverage Start Date',
    'Coverage End Date',
    'Co-Payment',
    'Requested By',
    'Request Date/Time',
    'Response Date/Time',
    'Error Message'
  ];

  const escapeCsv = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const body = rows
    .map(row => [
      row.requestId,
      row.encounterNo,
      row.mrn,
      row.patientName,
      row.insuranceCompany,
      row.policyNumber,
      row.memberId,
      statusMeta[row.eligibilityStatus].label,
      row.eligibilityReferenceNo,
      row.coverageStartDate,
      row.coverageEndDate,
      row.coPayment,
      row.requestedBy,
      row.requestDateTime,
      row.responseDateTime,
      row.errorMessage
    ].map(escapeCsv).join(','))
    .join('\n');

  const csv = [headers.map(escapeCsv).join(','), body].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `insurance-eligibility-requests-${dayjs().format('YYYYMMDD-HHmm')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const InsuranceEligibilityRequests = () => {
  const dispatch = useAppDispatch();
  const [recordOfFilter, setRecordOfFilter] = useState<FilterState>({});
  const [appliedFilter, setAppliedFilter] = useState<FilterState>({});
  const [sortColumn, setSortColumn] = useState('requestDateTime');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedRequest, setSelectedRequest] = useState<EligibilityRequest | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<EligibilityResponse | null>(null);

  useEffect(() => {
    dispatch(setPageCode('InsuranceEligibilityRequests'));
    dispatch(setDivContent('Insurance Eligibility Requests'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    const filterKey = appliedFilter.filterKey;
    const filterValue = String(appliedFilter.value ?? '').trim();
    return STATIC_ELIGIBILITY_DATA.map(item => item.request).filter(row => {
      if (!filterKey || !filterValue) return true;

      if (filterKey === 'requestDateTime') {
        return dayjs(row.requestDateTime).format('YYYY-MM-DD') === filterValue;
      }

      if (filterKey === 'eligibilityStatus') {
        return row.eligibilityStatus === filterValue;
      }

      if (filterKey === 'insuranceCompany' || filterKey === 'requestedBy') {
        return String(row[filterKey as keyof EligibilityRequest] ?? '') === filterValue;
      }

      return toText(row[filterKey as keyof EligibilityRequest]).includes(toText(filterValue));

    });
  }, [appliedFilter]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];

    rows.sort((a, b) => {
      const aValue = a[sortColumn as keyof EligibilityRequest];
      const bValue = b[sortColumn as keyof EligibilityRequest];

      if (sortColumn === 'requestDateTime' || sortColumn === 'responseDateTime') {
        const diff = dayjs(aValue as string).valueOf() - dayjs(bValue as string).valueOf();
        return sortType === 'asc' ? diff : -diff;
      }

      const aText = String(aValue ?? '').toLowerCase();
      const bText = String(bValue ?? '').toLowerCase();
      if (aText === bText) return 0;
      const result = aText > bText ? 1 : -1;
      return sortType === 'asc' ? result : -result;
    });

    return rows;
  }, [filteredRows, sortColumn, sortType]);

  const visibleRows = useMemo(() => {
    return sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, sortedRows]);

  const handleRetry = (requestId: string) => {
    dispatch(
      notify({
        msg: `Retry requested for ${requestId}`,
        sev: 'info'
      })
    );
  };

  const openResponseModal = (row: EligibilityRequest) => {
    setSelectedRequest(row);
    setSelectedResponse(buildStaticResponse(row));
  };

  const columns: ColumnConfig[] = [
    { key: 'requestId', title: 'Request ID' },
    { key: 'encounterNo', title: 'Encounter No', expandable: true },
    { key: 'mrn', title: 'Patient MRN', expandable: true },
    { key: 'patientName', title: 'Patient Name', expandable: true },
    { key: 'insuranceCompany', title: 'Insurance Company' },
    { key: 'policyNumber', title: 'Policy Number' },
    { key: 'memberId', title: 'Member ID' },
    {
      key: 'eligibilityStatus',
      title: 'Eligibility Status',
      render: row => {
        const meta = statusMeta[row.eligibilityStatus as EligibilityStatus];
        return <MyBadgeStatus contant={meta.label} color={meta.color} />;
      }
    },
    { key: 'eligibilityReferenceNo', title: 'Eligibility Reference No' },
    { key: 'coverageStartDate', title: 'Coverage Start Date', render: row => formatDateOnly(row.coverageStartDate) },
    { key: 'coverageEndDate', title: 'Coverage End Date', render: row => formatDateOnly(row.coverageEndDate) },
    { key: 'coPayment', title: 'Co-Payment' },
    { key: 'requestedBy', title: 'Requested By' },
    { key: 'requestDateTime', title: 'Request Date/Time', render: row => formatDateTime(row.requestDateTime) },
    { key: 'responseDateTime', title: 'Response Date/Time', render: row => formatDateTime(row.responseDateTime) },
    { key: 'errorMessage', title: 'Error Message' },
    {
      key: 'actions',
      title: 'Actions',
      render: row => (
        <div className="eligibility-row-actions">
          <FontAwesomeIcon
           icon={faFileLines} 
           className='icons-style'
           title='Response'
           onClick={e => {
            e.stopPropagation();
            openResponseModal(row);
          }} />
          {(row.eligibilityStatus === 'ERROR' || row.eligibilityStatus === 'PENDING') && (
            <FontAwesomeIcon
             icon={faArrowRotateRight}
             className='icons-style'
             title='Retry'
              onClick={e => {
              e.stopPropagation();
              handleRetry(row.requestId);
            }} />
          )}
        </div>
      )
    }
  ];

  const tableButtons = (
    <div className="container-of-add-new-button">
      <MyButton color="green" onClick={() => downloadCsv(sortedRows)}>
        <FontAwesomeIcon icon={faFileExport} /> Export to Excel
      </MyButton>
    </div>
  );

  const filters = (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        fieldName="filterKey"
        fieldType="select"
        selectData={FILTER_OPTIONS}
        selectDataLabel="label"
        selectDataValue="value"
        record={recordOfFilter}
        setRecord={(next: any) =>
          setRecordOfFilter({
            filterKey: next?.filterKey,
            value: ''
          })
        }
        showLabel={false}
        placeholder="Filter"
        searchable={false}
        width="10vw"
      />
      <MyInput
        key={`${recordOfFilter.filterKey || 'none'}`}
        fieldName="value"
        fieldType={
          recordOfFilter.filterKey === 'eligibilityStatus' ||
            recordOfFilter.filterKey === 'insuranceCompany' ||
            recordOfFilter.filterKey === 'requestedBy'
            ? 'select'
            : recordOfFilter.filterKey === 'requestDateTime'
              ? 'date'
              : 'text'
        }
        selectData={
          recordOfFilter.filterKey === 'eligibilityStatus'
            ? STATUS_OPTIONS
            : recordOfFilter.filterKey === 'insuranceCompany'
              ? PAYOR_OPTIONS
              : recordOfFilter.filterKey === 'requestedBy'
                ? REQUESTED_BY_OPTIONS
                : []
        }
        selectDataLabel="label"
        selectDataValue="value"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Value"
        searchable={
          recordOfFilter.filterKey === 'eligibilityStatus' ||
            recordOfFilter.filterKey === 'insuranceCompany' ||
            recordOfFilter.filterKey === 'requestedBy'
            ? false
            : undefined
        }
        width="15vw"
      />
      <MyButton
        color="var(--deep-blue)"
        width="100px"
        onClick={() => {
          const filterKey = recordOfFilter.filterKey;
          const rawValue = recordOfFilter.value;
          const trimmedValue = typeof rawValue === 'string' ? rawValue.trim() : rawValue;

          if (!filterKey || !trimmedValue) {
            setAppliedFilter({});
            setPage(0);
            return;
          }

          const nextValue =
            filterKey === 'requestDateTime'
              ? dayjs(trimmedValue as string).format('YYYY-MM-DD')
              : String(trimmedValue);

          setAppliedFilter({
            filterKey,
            value: nextValue
          });
          setPage(0);
        }}
      >
        Search
      </MyButton>
    </Form>
  );

  return (
    <div className="eligibility-main-page-container">
      <Panel>
        <MyTable
          data={visibleRows}
          columns={columns}
          height={640}
          filters={filters}
          tableButtons={tableButtons}
          loading={false}
          sortColumn={sortColumn}
          sortType={sortType}
          onSortChange={(column, type) => {
            setSortColumn(column);
            setSortType(type);
            setPage(0);
          }}
          onRowClick={row => setSelectedRequest(row)}
          rowClassName={row => `eligibility-row--${toText(row.eligibilityStatus)}`}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={sortedRows.length}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={event => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
        />
      </Panel>
      <EligibilityResponseModal
        open={Boolean(selectedResponse)}
        setOpen={open => {
          if (!open) {
            setSelectedResponse(null);
          }
        }}
        request={selectedRequest}
        response={selectedResponse}
      />
    </div>
  );
};

export default InsuranceEligibilityRequests;
