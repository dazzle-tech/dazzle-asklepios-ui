import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { SelectPicker } from 'rsuite';

import MyTable from '@/components/MyTable';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetPatientFinancialDocumentsQuery,
  useLazyGetEncounterInvoiceDetailsQuery,
  type EncounterInvoiceDetails,
  type PatientFinancialInvoice
} from '@/services/billing/invoiceGenerationService';
import {
  useLazyGetInvoiceAdjustmentsQuery,
  useLazyGetInvoiceLineItemsQuery,
  useLazyGetInvoicePricingSummaryQuery,
  type FinancialDocumentAdjustment,
  type InvoiceLineItem,
  type InvoicePricingSummary
} from '@/services/billing/financialDocumentAdjustmentService';
import {
  useLazyGetBillingPaymentByIdQuery,
  useLazyGetEncounterBillingSummaryQuery
} from '@/services/billing/billingTransactionService';
import InvoicePrintModal from '@/pages/billing-module/invoices/InvoicePrintModal';
import AdjustmentPrintModal from '@/pages/billing-module/invoices/AdjustmentPrintModal';
import PaymentReceiptModal from '@/pages/patient/patient-profile/PatientQuickAppoinment/PaymentReceiptModal';
import type { PaymentReceiptData } from '@/pages/patient/patient-profile/PatientQuickAppoinment/paymentPreviewUtils';
import { useInvoicePrintLookups } from '@/pages/billing-module/invoices/useInvoicePrintLookups';
import { useFinancialDocumentTypes } from '@/pages/billing-module/invoices/useFinancialDocumentTypes';
import {
  buildInvoicePrintDataFromIssuedInvoice,
  type InvoicePrintData
} from '@/pages/billing-module/invoices/invoicePrintUtils';
import {
  buildAdjustmentPrintData,
  type AdjustmentPrintData
} from '@/pages/billing-module/invoices/adjustmentPrintUtils';
import {
  getInvoicePrintVersion,
  invoicePrintVersionLabel
} from '@/pages/billing-module/invoices/invoicePrintVersion';
import {
  buildBillingPaymentReceipt,
  buildIssuedRefundReceipt,
  formatBillingEnum,
  formatBillingTimestamp,
  formatMoney,
  normalizeBillingError,
  resolvePatientId
} from '../utils/billingAccountingUtils';

type PatientIssuedDocumentsTabProps = {
  patient?: any;
};

const isAdjustmentType = (documentType?: string) => {
  const normalized = String(documentType ?? '').toUpperCase();
  return normalized === 'CREDIT_NOTE' || normalized === 'DEBIT_NOTE';
};

const isPaymentReceipt = (document: PatientFinancialInvoice) =>
  document.billingPaymentId != null;

type PendingInvoicePrint = {
  invoice: PatientFinancialInvoice;
  lineItems: InvoiceLineItem[];
  pricingSummary?: InvoicePricingSummary | null;
  encounterDetails: EncounterInvoiceDetails;
};

type PendingAdjustmentPrint = {
  document: PatientFinancialInvoice;
  adjustment: FinancialDocumentAdjustment;
  parentInvoice: PatientFinancialInvoice;
  parentLineItems: InvoiceLineItem[];
  encounterDetails: EncounterInvoiceDetails;
};

const resolveEncounterLabel = (document: PatientFinancialInvoice) => {
  if (document.encounterNumber?.trim()) {
    return document.encounterNumber.trim();
  }

  if (document.encounterId != null) {
    return `#${document.encounterId}`;
  }

  return '-';
};

const PatientIssuedDocumentsTab: React.FC<PatientIssuedDocumentsTabProps> = ({ patient }) => {
  const dispatch = useAppDispatch();
  const selectedFacility = useAppSelector(state => state.auth?.tenant?.selectedFacility);
  const patientId = resolvePatientId(patient);
  const financialDocumentTypes = useFinancialDocumentTypes();

  const [printEncounterId, setPrintEncounterId] = useState<number | null>(null);
  const [printDepartmentId, setPrintDepartmentId] = useState<number | null>(null);
  const [loadingDocumentId, setLoadingDocumentId] = useState<number | null>(null);
  const [pendingInvoicePrint, setPendingInvoicePrint] = useState<PendingInvoicePrint | null>(null);
  const [pendingAdjustmentPrint, setPendingAdjustmentPrint] =
    useState<PendingAdjustmentPrint | null>(null);
  const [invoicePrintModal, setInvoicePrintModal] = useState<{
    open: boolean;
    invoices: InvoicePrintData[];
  }>({ open: false, invoices: [] });
  const [adjustmentPrintModal, setAdjustmentPrintModal] = useState<{
    open: boolean;
    adjustments: AdjustmentPrintData[];
  }>({ open: false, adjustments: [] });
  const [paymentReceiptModal, setPaymentReceiptModal] = useState<{
    open: boolean;
    receipt: PaymentReceiptData | null;
  }>({ open: false, receipt: null });
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('');
  const [printVersionRefreshKey, setPrintVersionRefreshKey] = useState(0);

  const documentTypeFilterOptions = useMemo(
    () => [
      { label: 'All types', value: '' },
      ...financialDocumentTypes.options
    ],
    [financialDocumentTypes.options]
  );

  const facilityPrintInfo = useMemo(
    () => ({
      name:
        selectedFacility?.name ??
        selectedFacility?.facilityName ??
        'Healthcare Facility',
      address:
        selectedFacility?.facilityAddress ??
        selectedFacility?.address ??
        undefined,
      vatRegistrationNumber:
        selectedFacility?.vatRegistrationNumber ??
        selectedFacility?.vatNumber ??
        undefined,
      providerId:
        selectedFacility?.providerId ??
        (selectedFacility?.id != null ? String(selectedFacility.id) : undefined)
    }),
    [selectedFacility]
  );

  const {
    data: documents = [],
    isFetching: loadingDocuments
  } = useGetPatientFinancialDocumentsQuery(patientId as number, {
    skip: patientId == null
  });

  const filteredDocuments = useMemo(() => {
    if (!documentTypeFilter) {
      return documents;
    }

    const normalizedFilter = documentTypeFilter.toUpperCase();
    return documents.filter(
      document => String(document.documentType ?? '').toUpperCase() === normalizedFilter
    );
  }, [documentTypeFilter, documents]);

  const refreshPrintVersions = () => {
    setPrintVersionRefreshKey(current => current + 1);
  };

  const [fetchInvoiceLineItems] = useLazyGetInvoiceLineItemsQuery();
  const [fetchInvoicePricingSummary] = useLazyGetInvoicePricingSummaryQuery();
  const [fetchInvoiceAdjustments] = useLazyGetInvoiceAdjustmentsQuery();
  const [fetchEncounterDetails] = useLazyGetEncounterInvoiceDetailsQuery();
  const [fetchBillingPayment] = useLazyGetBillingPaymentByIdQuery();
  const [fetchEncounterBillingSummary] = useLazyGetEncounterBillingSummaryQuery();

  const {
    billingSummary,
    chargeRows,
    isReady: printLookupsReady
  } = useInvoicePrintLookups(printEncounterId);

  const chargeContext = useMemo(
    () => ({
      billingSummary,
      chargeRows
    }),
    [billingSummary, chargeRows]
  );

  const documentsById = useMemo(
    () => new Map(documents.map(document => [document.id, document])),
    [documents]
  );

  useEffect(() => {
    if (pendingInvoicePrint == null || !printLookupsReady) {
      return;
    }

    const { invoice, lineItems, pricingSummary, encounterDetails } = pendingInvoicePrint;

    setInvoicePrintModal({
      open: true,
      invoices: [
        buildInvoicePrintDataFromIssuedInvoice({
          invoice,
          lineItems,
          pricingSummary,
          encounterDetails,
          eligibilitySnapshot: encounterDetails?.eligibilitySnapshot ?? null,
          patient,
          facility: facilityPrintInfo,
          chargeContext
        })
      ]
    });
    setPendingInvoicePrint(null);
    setLoadingDocumentId(null);
  }, [
    chargeContext,
    facilityPrintInfo,
    patient,
    pendingInvoicePrint,
    printLookupsReady
  ]);

  useEffect(() => {
    if (pendingAdjustmentPrint == null || !printLookupsReady) {
      return;
    }

    const {
      document,
      adjustment,
      parentInvoice,
      parentLineItems,
      encounterDetails
    } = pendingAdjustmentPrint;

    const printData = buildAdjustmentPrintData({
      adjustment,
      parentInvoice,
      originalInvoiceNumber: parentInvoice.documentNumber,
      invoiceLineItems: parentLineItems,
      encounterDetails,
      eligibilitySnapshot: encounterDetails?.eligibilitySnapshot ?? null,
      patient,
      facility: facilityPrintInfo,
      chargeContext
    });

    setAdjustmentPrintModal({
      open: true,
      adjustments: [printData]
    });
    setPendingAdjustmentPrint(null);
    setLoadingDocumentId(null);
  }, [
    chargeContext,
    facilityPrintInfo,
    patient,
    pendingAdjustmentPrint,
    printLookupsReady
  ]);

  const handleViewDocument = async (document: PatientFinancialInvoice) => {
    if (patientId == null) {
      return;
    }

    setLoadingDocumentId(document.id);
    setPendingInvoicePrint(null);
    setPendingAdjustmentPrint(null);

    const documentType = String(document.documentType ?? '').toUpperCase();

    try {
      if (isPaymentReceipt(document)) {
        const paymentResult = await fetchBillingPayment({
          paymentId: document.billingPaymentId as number
        }).unwrap();

        const billingSummary =
          document.encounterId != null
            ? await fetchEncounterBillingSummary({
                encounterId: document.encounterId
              }).unwrap()
            : null;

        const encounterDetails =
          document.encounterId != null
            ? await fetchEncounterDetails(document.encounterId).unwrap()
            : null;

        setPaymentReceiptModal({
          open: true,
          receipt: buildBillingPaymentReceipt({
            paymentResult,
            patient,
            encounter:
              document.encounterId != null
                ? ({
                    id: document.encounterId,
                    encounterNumber: encounterDetails?.encounterNumber
                  } as any)
                : null,
            facilityName: facilityPrintInfo.name,
            billingSummary,
            paymentDate: formatBillingTimestamp(document.createdDate)
          })
        });
        setLoadingDocumentId(null);
        return;
      }

      if (documentType === 'REFUND') {
        setPaymentReceiptModal({
          open: true,
          receipt: buildIssuedRefundReceipt({
            document,
            patient,
            encounterNumber: document.encounterNumber,
            facilityName: facilityPrintInfo.name
          })
        });
        setLoadingDocumentId(null);
        return;
      }

      const encounterDetails = await fetchEncounterDetails(document.encounterId).unwrap();
      setPrintEncounterId(document.encounterId);
      setPrintDepartmentId(encounterDetails?.departmentId ?? null);

      if (documentType === 'INVOICE' || documentType === 'RECEIPT') {
        const [lineItems, pricingSummary] = await Promise.all([
          fetchInvoiceLineItems(document.id).unwrap(),
          fetchInvoicePricingSummary(document.id).unwrap()
        ]);
        setPendingInvoicePrint({
          invoice: document,
          lineItems,
          pricingSummary,
          encounterDetails
        });
        return;
      }

      if (isAdjustmentType(documentType)) {
        const parentDocumentId = document.parentDocumentId;
        if (parentDocumentId == null) {
          dispatch(
            notify({
              msg: 'Parent invoice not found for this adjustment document.',
              sev: 'warning'
            })
          );
          setLoadingDocumentId(null);
          return;
        }

        const parentInvoice = documentsById.get(parentDocumentId);
        if (parentInvoice == null) {
          dispatch(
            notify({
              msg: 'Parent invoice not found for this adjustment document.',
              sev: 'warning'
            })
          );
          setLoadingDocumentId(null);
          return;
        }

        const [parentLineItems, adjustmentSummary] = await Promise.all([
          fetchInvoiceLineItems(parentDocumentId).unwrap(),
          fetchInvoiceAdjustments(parentDocumentId).unwrap()
        ]);

        const adjustment = adjustmentSummary.adjustments?.find(
          (entry: FinancialDocumentAdjustment) => entry.id === document.id
        );

        if (adjustment == null) {
          dispatch(
            notify({
              msg: 'Adjustment document details could not be loaded.',
              sev: 'warning'
            })
          );
          setLoadingDocumentId(null);
          return;
        }

        setPendingAdjustmentPrint({
          document,
          adjustment,
          parentInvoice,
          parentLineItems,
          encounterDetails
        });
        return;
      }

      dispatch(
        notify({
          msg: `Preview is not available for document type ${documentType}.`,
          sev: 'warning'
        })
      );
      setLoadingDocumentId(null);
    } catch (error) {
      dispatch(
        notify({
          msg: normalizeBillingError(error),
          sev: 'error'
        })
      );
      setLoadingDocumentId(null);
    }
  };

  const columns = [
    {
      key: 'documentType',
      title: 'Type',
      render: (row: PatientFinancialInvoice) =>
        financialDocumentTypes.labelFor(String(row.documentType ?? ''))
    },
    {
      key: 'documentNumber',
      title: 'Document #'
    },
    {
      key: 'createdDate',
      title: 'Date',
      render: (row: PatientFinancialInvoice) => formatBillingTimestamp(row.createdDate)
    },
    {
      key: 'encounterNumber',
      title: 'Encounter',
      render: (row: PatientFinancialInvoice) => resolveEncounterLabel(row)
    },
    {
      key: 'printVersion',
      title: 'Version',
      render: (row: PatientFinancialInvoice) => {
        void printVersionRefreshKey;
        const version = getInvoicePrintVersion(row.documentNumber);
        const isCopy = version === 'COPY';

        return (
          <span
            className={`billing-issued-documents-tab__version${
              isCopy ? ' billing-issued-documents-tab__version--copy' : ''
            }`}
          >
            {invoicePrintVersionLabel(version)}
          </span>
        );
      }
    },
    {
      key: 'totalAmount',
      title: 'Amount',
      render: (row: PatientFinancialInvoice) =>
        formatMoney(row.totalAmount, row.currency ?? 'SAR')
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: PatientFinancialInvoice) => formatBillingEnum(row.status)
    },
    {
      key: 'actions',
      title: '',
      render: (row: PatientFinancialInvoice) => (
        <button
          type="button"
          className="rs-btn rs-btn-link"
          disabled={loadingDocumentId === row.id}
          onClick={() => {
            void handleViewDocument(row);
          }}
        >
          <FontAwesomeIcon icon={faEye} /> View
        </button>
      )
    }
  ];

  if (patientId == null) {
    return (
      <div className="billing-accounting__subtitle">
        Select a patient to review issued invoices, credit notes, debit notes, and receipts.
      </div>
    );
  }

  return (
    <div className="billing-issued-documents-tab">
      <div className="billing-issued-documents-tab__toolbar">
        <SelectPicker
          cleanable={false}
          searchable={false}
          data={documentTypeFilterOptions}
          value={documentTypeFilter}
          onChange={value => setDocumentTypeFilter(String(value ?? ''))}
          placeholder="Filter by type"
          style={{ width: 220 }}
        />
      </div>

      <MyTable
        data={filteredDocuments}
        columns={columns}
        loading={loadingDocuments}
        page={1}
        rowsPerPage={Math.max(filteredDocuments.length, 10)}
        totalCount={filteredDocuments.length}
        onPageChange={() => undefined}
        onRowsPerPageChange={() => undefined}
      />

      <InvoicePrintModal
        open={invoicePrintModal.open}
        invoices={invoicePrintModal.invoices}
        onClose={() => {
          refreshPrintVersions();
          setInvoicePrintModal({ open: false, invoices: [] });
        }}
      />

      <AdjustmentPrintModal
        open={adjustmentPrintModal.open}
        adjustments={adjustmentPrintModal.adjustments}
        onClose={() => {
          refreshPrintVersions();
          setAdjustmentPrintModal({ open: false, adjustments: [] });
        }}
      />

      <PaymentReceiptModal
        open={paymentReceiptModal.open}
        receipt={paymentReceiptModal.receipt}
        onClose={() => {
          refreshPrintVersions();
          setPaymentReceiptModal({ open: false, receipt: null });
        }}
      />
    </div>
  );
};

export default PatientIssuedDocumentsTab;
