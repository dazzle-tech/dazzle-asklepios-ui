import React, { useEffect, useMemo, useState } from 'react';

import { Panel, Tag, Text } from 'rsuite';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {

  faFileInvoice,

  faLock,

  faMinusCircle,

  faPlusCircle,

  faPrint

} from '@fortawesome/free-solid-svg-icons';



import MyTable from '@/components/MyTable';

import MyButton from '@/components/MyButton/MyButton';

import SectionContainer from '@/components/SectionsoContainer';



import {

  BillableVisit,

  PatientFinancialInvoice,

  useFinancialCloseEncounterMutation,

  useFreezeEligibilitySnapshotMutation,

  useGenerateInvoicesMutation,

  useGetBillableVisitsQuery,

  useGetEligibilitySnapshotQuery,

  useGetEncounterInvoiceDetailsQuery,

  useGetPatientFinancialInvoicesQuery

} from '@/services/billing/invoiceGenerationService';

import {

  useCreateCreditNoteMutation,

  useCreateDebitNoteMutation,

  useGetAddableChargeLinesQuery,

  useGetInvoiceAdjustmentsQuery,

  useGetInvoiceLineItemsQuery,
  useLazyGetInvoiceLineItemsQuery,
  useGetInvoicePricingSummaryQuery,
  useLazyGetInvoicePricingSummaryQuery,

  type CreateAdjustmentRequest,
  type FinancialDocumentAdjustment
} from '@/services/billing/financialDocumentAdjustmentService';

import EligibilitySnapshotPanel from './invoices/EligibilitySnapshotPanel';

import InvoiceDetailPanel from './invoices/InvoiceDetailPanel';

import InvoiceAdjustmentModal from './invoices/InvoiceAdjustmentModal';

import InvoicePrintModal from './invoices/InvoicePrintModal';
import AdjustmentPrintModal from './invoices/AdjustmentPrintModal';

import {

  isFinancialDocumentNumberingReady,

  numberingSetupHint,

  resolveAdjustmentDocumentType

} from './invoices/financialDocumentNumberingUtils';

import { useFinancialDocumentTypes } from './invoices/useFinancialDocumentTypes';

import {

  buildInvoicePrintDataFromIssuedInvoice,

  type InvoicePrintData

} from './invoices/invoicePrintUtils';

import { useInvoicePrintLookups } from './invoices/useInvoicePrintLookups';
import {
  buildAdjustmentPrintData,
  type AdjustmentPrintData
} from './invoices/adjustmentPrintUtils';

import { useGetFinancialDocumentNumberingByFacilityQuery } from '@/services/billing/financialDocumentNumberingService';

import { FINANCIAL_DOCUMENT_NUMBERING_ERROR_MAP } from '@/pages/setup/financial-document-numbering/financialDocumentNumberingErrorHandler';

import { notify } from '@/utils/uiReducerActions';

import { useAppDispatch, useAppSelector } from '@/hooks';

import {

  ADJUSTMENT_ERROR_MAP,

  extractApiErrorMessage,

  INVOICE_GENERATION_ERROR_MAP

} from '@/utils/apiErrorMessage';



const mergeErrorMaps = (...maps: Record<string, string>[]) =>

  Object.assign({}, ...maps);



const INVOICE_FLOW_ERROR_MAP = mergeErrorMaps(

  INVOICE_GENERATION_ERROR_MAP,

  FINANCIAL_DOCUMENT_NUMBERING_ERROR_MAP

);



const ADJUSTMENT_FLOW_ERROR_MAP = mergeErrorMaps(

  ADJUSTMENT_ERROR_MAP,

  FINANCIAL_DOCUMENT_NUMBERING_ERROR_MAP

);



import './invoices/styles.less';



type InvoicesProps = {

  patient?: any;

  onSimulatedInvoicePayment?: () => void | Promise<void>;

};



type AdjustmentKind = 'CREDIT_NOTE' | 'DEBIT_NOTE';



const resolvePatientId = (patient?: any): number | null => {

  const raw = patient?.id ?? patient?.key;

  const numeric = Number(raw);

  return Number.isFinite(numeric) ? numeric : null;

};



const formatMoney = (value?: number, currency = 'SAR') => {

  const amount = Number(value ?? 0);

  return `${amount.toFixed(2)} ${currency}`;

};



const billingStatusColor = (status?: string) => {

  switch (String(status ?? '').toUpperCase()) {

    case 'FINANCIALLY_CLOSED':

      return 'orange';

    case 'INVOICED':

      return 'green';

    default:

      return 'blue';

  }

};



const invoiceStatusLabel = (status?: string) => {

  switch (String(status ?? '').toUpperCase()) {

    case 'ISSUED':

      return 'Issued';

    case 'PARTIALLY_PAID':

      return 'Partially Paid';

    case 'PAID':

      return 'Paid';

    case 'DRAFT':

      return 'Draft';

    case 'CANCELLED':

      return 'Cancelled';

    default:

      return status ?? '-';

  }

};



const makeRequestId = (prefix: string) =>

  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;



const invoiceSubtypeLabel = (subtype?: string) => {

  switch (String(subtype ?? 'PATIENT').toUpperCase()) {

    case 'INSURANCE_CLAIM':

      return 'Insurance Claim';

    default:

      return 'Patient';

  }

};



const canAdjustInvoice = (invoice?: PatientFinancialInvoice | null) => {

  if (invoice == null) return false;

  const status = String(invoice.status ?? '').toUpperCase();

  return status !== 'DRAFT' && status !== 'CANCELLED';

};



const Invoices: React.FC<InvoicesProps> = ({ patient, onSimulatedInvoicePayment }) => {

  const dispatch = useAppDispatch();
  const selectedFacility = useAppSelector(state => state.auth?.tenant?.selectedFacility);
  const facilityId =
    useAppSelector(state => state.auth?.selectedDepartment?.facilityId) ??
    selectedFacility?.id ??
    null;
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

  const patientId = resolvePatientId(patient);



  const [selectedEncounterId, setSelectedEncounterId] = useState<number | null>(null);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  const [adjustmentModal, setAdjustmentModal] = useState<{

    open: boolean;

    kind: AdjustmentKind;

  }>({ open: false, kind: 'CREDIT_NOTE' });

  const [invoicePrintModal, setInvoicePrintModal] = useState<{

    open: boolean;

    invoices: InvoicePrintData[];

    autoPrint: boolean;

  }>({ open: false, invoices: [], autoPrint: false });

  const [pendingInvoicePrint, setPendingInvoicePrint] = useState<{

    invoices: InvoicePrintData[];

    autoPrint: boolean;

  } | null>(null);

  const [adjustmentPrintModal, setAdjustmentPrintModal] = useState<{

    open: boolean;

    adjustments: AdjustmentPrintData[];

    autoPrint: boolean;

  }>({ open: false, adjustments: [], autoPrint: false });

  const [pendingAdjustmentPrint, setPendingAdjustmentPrint] = useState<{

    adjustment: FinancialDocumentAdjustment;

    autoPrint: boolean;

  } | null>(null);



  const {

    data: billableVisits = [],

    isFetching: loadingBillableVisits,

    refetch: refetchBillableVisits

  } = useGetBillableVisitsQuery(patientId as number, {

    skip: patientId == null

  });



  const {

    data: encounterDetails,

    isFetching: loadingEncounterDetails,

    refetch: refetchEncounterDetails

  } = useGetEncounterInvoiceDetailsQuery(selectedEncounterId as number, {

    skip: selectedEncounterId == null

  });



  const {

    data: financialInvoices = [],

    isFetching: loadingFinancialInvoices,

    refetch: refetchFinancialInvoices

  } = useGetPatientFinancialInvoicesQuery(patientId as number, {

    skip: patientId == null

  });



  const {

    data: adjustmentSummary,

    isFetching: loadingAdjustments,

    refetch: refetchAdjustments

  } = useGetInvoiceAdjustmentsQuery(selectedInvoiceId as number, {

    skip: selectedInvoiceId == null

  });



  const {

    data: invoiceLineItems = [],

    isFetching: loadingInvoiceLineItems,

    refetch: refetchInvoiceLineItems

  } = useGetInvoiceLineItemsQuery(selectedInvoiceId as number, {

    skip: selectedInvoiceId == null

  });

  const { data: selectedInvoicePricingSummary } = useGetInvoicePricingSummaryQuery(
    selectedInvoiceId as number,
    {
      skip: selectedInvoiceId == null
    }
  );

  const [fetchInvoiceLineItemsForPrint] = useLazyGetInvoiceLineItemsQuery();
  const [fetchInvoicePricingSummaryForPrint] = useLazyGetInvoicePricingSummaryQuery();



  const {

    data: addableChargeLines = [],

    isFetching: loadingAddableChargeLines,

    refetch: refetchAddableChargeLines

  } = useGetAddableChargeLinesQuery(selectedInvoiceId as number, {

    skip: selectedInvoiceId == null

  });



  const [financialClose, { isLoading: closingFinancially }] =

    useFinancialCloseEncounterMutation();



  const [generateInvoices, { isLoading: generatingInvoices }] =

    useGenerateInvoicesMutation();



  const [freezeEligibilitySnapshot, { isLoading: freezingEligibility }] =

    useFreezeEligibilitySnapshotMutation();



  const [createCreditNote, { isLoading: creatingCreditNote }] =

    useCreateCreditNoteMutation();



  const [createDebitNote, { isLoading: creatingDebitNote }] =

    useCreateDebitNoteMutation();



  const {

    data: eligibilitySnapshot,

    isFetching: loadingEligibilitySnapshot,

    refetch: refetchEligibilitySnapshot

  } = useGetEligibilitySnapshotQuery(selectedEncounterId as number, {

    skip: selectedEncounterId == null

  });



  const {

    data: numberingConfigurations = [],

    isFetching: loadingNumberingConfigurations

  } = useGetFinancialDocumentNumberingByFacilityQuery(

    { facilityId: facilityId as number },

    { skip: facilityId == null }

  );



  const financialDocumentTypes = useFinancialDocumentTypes();



  const invoiceNumberingReady = useMemo(

    () =>

      Boolean(financialDocumentTypes.invoice) &&

      isFinancialDocumentNumberingReady(

        numberingConfigurations,

        financialDocumentTypes.invoice

      ),

    [financialDocumentTypes.invoice, numberingConfigurations]

  );



  const creditNoteNumberingReady = useMemo(

    () =>

      Boolean(financialDocumentTypes.creditNote) &&

      isFinancialDocumentNumberingReady(

        numberingConfigurations,

        financialDocumentTypes.creditNote

      ),

    [financialDocumentTypes.creditNote, numberingConfigurations]

  );



  const debitNoteNumberingReady = useMemo(

    () =>

      Boolean(financialDocumentTypes.debitNote) &&

      isFinancialDocumentNumberingReady(

        numberingConfigurations,

        financialDocumentTypes.debitNote

      ),

    [financialDocumentTypes.debitNote, numberingConfigurations]

  );



  useEffect(() => {

    setSelectedEncounterId(null);

    setSelectedInvoiceId(null);

  }, [patientId]);



  useEffect(() => {

    if (selectedEncounterId != null) return;

    if (!billableVisits.length) return;

    setSelectedEncounterId(billableVisits[0].encounterId);

  }, [billableVisits, selectedEncounterId]);



  useEffect(() => {

    if (selectedInvoiceId == null) return;

    const stillExists = financialInvoices.some(

      invoice => invoice.id === selectedInvoiceId

    );

    if (!stillExists) {

      setSelectedInvoiceId(null);

    }

  }, [financialInvoices, selectedInvoiceId]);



  const selectedVisit = useMemo(

    () => billableVisits.find(visit => visit.encounterId === selectedEncounterId) ?? null,

    [billableVisits, selectedEncounterId]

  );



  const selectedInvoice = useMemo(

    () => financialInvoices.find(invoice => invoice.id === selectedInvoiceId) ?? null,

    [financialInvoices, selectedInvoiceId]

  );

  const printEncounterId =
    selectedInvoice?.encounterId ?? selectedEncounterId ?? null;

  const printDepartmentId = useMemo(() => {
    if (
      encounterDetails?.encounterId != null &&
      encounterDetails.encounterId === printEncounterId
    ) {
      return encounterDetails.departmentId ?? null;
    }

    return (
      billableVisits.find(visit => visit.encounterId === printEncounterId)?.departmentId ??
      selectedVisit?.departmentId ??
      null
    );
  }, [billableVisits, encounterDetails, printEncounterId, selectedVisit]);

  const visitDepartmentId =
    encounterDetails?.departmentId ?? selectedVisit?.departmentId ?? null;

  const {
    billingSummary: visitBillingSummary,
    chargeRows: visitChargeRows,
    isReady: visitDetailsLookupsReady
  } = useInvoicePrintLookups(selectedEncounterId, visitDepartmentId);

  const visitDetailRows = useMemo(() => {
    const summaryByPspId = new Map(
      (visitBillingSummary?.items ?? [])
        .filter(item => item.patientServiceProductId != null)
        .map(item => [Number(item.patientServiceProductId), item])
    );
    const summaryByChargeLineId = new Map(
      (visitBillingSummary?.items ?? [])
        .filter(item => item.chargeLineId != null)
        .map(item => [Number(item.chargeLineId), item])
    );

    return visitChargeRows.map(row => {
      const summaryItem =
        (row.patientServiceProductId != null
          ? summaryByPspId.get(row.patientServiceProductId)
          : undefined) ??
        (row.chargeLineId != null
          ? summaryByChargeLineId.get(row.chargeLineId)
          : undefined);

      return {
        itemCode: row.itemCode ?? summaryItem?.itemCode ?? '-',
        itemName: row.itemName,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        netAmount: row.netAmount,
        patientResponsibilityAmount: row.patientAmount,
        insuranceResponsibilityAmount: row.insuranceAmount,
        taxAmount: Number(summaryItem?.taxAmount ?? 0)
      };
    });
  }, [visitBillingSummary?.items, visitChargeRows]);

  const {
    billingSummary,
    chargeRows,
    isReady: printLookupsReady
  } = useInvoicePrintLookups(printEncounterId, printDepartmentId);

  const chargeContext = useMemo(
    () => ({
      billingSummary,
      chargeRows
    }),
    [billingSummary, chargeRows]
  );



  const canGenerateInvoice = useMemo(() => {

    if (facilityId == null || !invoiceNumberingReady) {

      return false;

    }



    if (selectedVisit == null || selectedVisit.hasFinalInvoice) {

      return false;

    }



    if (selectedVisit.invoiceReady) {

      return true;

    }



    const billingStatus =

      encounterDetails?.billingStatus ?? selectedVisit.billingStatus;

    const chargeStatus =

      encounterDetails?.billingSummary?.chargeStatus ?? selectedVisit.chargeStatus;



    return (

      (billingStatus === 'FINANCIALLY_CLOSED' || chargeStatus === 'CLOSED') &&

      !selectedVisit.hasFinalInvoice

    );

  }, [encounterDetails, facilityId, invoiceNumberingReady, selectedVisit]);



  const canFinancialClose =

    selectedVisit != null &&

    selectedVisit.billingStatus === 'OPEN' &&

    !selectedVisit.hasFinalInvoice;



  const canFreezeEligibility =

    selectedVisit?.coverageType === 'INSURANCE' &&

    !eligibilitySnapshot?.frozen &&

    !(encounterDetails?.eligibilitySnapshot?.frozen ?? false) &&

    selectedVisit.billingStatus !== 'INVOICED';



  const canCreateCreditNote =

    facilityId != null &&

    creditNoteNumberingReady &&

    canAdjustInvoice(selectedInvoice) &&

    (adjustmentSummary?.creditNoteAllowed === true ||

      Number(adjustmentSummary?.outstandingBalance ?? 0) > 0 ||

      invoiceLineItems.some(

        line =>

          Number(line.remainingAmount ?? 0) > 0.0001 ||

          (Number(line.netAmount ?? 0) > 0.0001 &&

            Number(line.paidAmount ?? 0) > 0.0001)

      ));



  const canCreateDebitNote =

    facilityId != null &&

    debitNoteNumberingReady &&

    canAdjustInvoice(selectedInvoice);



  const handleFinancialClose = async () => {

    if (selectedEncounterId == null || facilityId == null) return;



    try {

      await financialClose({

        encounterId: selectedEncounterId,

        requestId: makeRequestId('invoice-close')

      }).unwrap();



      dispatch(

        notify({

          msg: 'Visit financially closed successfully.',

          sev: 'success'

        })

      );



      await Promise.all([

        refetchBillableVisits(),

        refetchEncounterDetails(),

        refetchFinancialInvoices(),

        refetchEligibilitySnapshot()

      ]);

    } catch (error: any) {

      dispatch(

        notify({

          msg: extractApiErrorMessage(error, INVOICE_FLOW_ERROR_MAP),

          sev: 'error'

        })

      );

    }

  };



  const openInvoicePrintPreview = (

    invoices: InvoicePrintData[],

    autoPrint = false

  ) => {

    if (invoices.length === 0) {

      return;

    }



    setInvoicePrintModal({

      open: true,

      invoices,

      autoPrint

    });

  };

  const openAdjustmentPrintPreview = (

    adjustments: AdjustmentPrintData[],

    autoPrint = false

  ) => {

    if (adjustments.length === 0) {

      return;

    }



    setAdjustmentPrintModal({

      open: true,

      adjustments,

      autoPrint

    });

  };

  const buildSelectedAdjustmentPrintData = (

    adjustment: FinancialDocumentAdjustment

  ): AdjustmentPrintData | null => {

    if (selectedInvoice == null) {

      return null;

    }



    const matchingEncounterDetails =

      encounterDetails?.encounterId === selectedInvoice.encounterId

        ? encounterDetails

        : null;



    return buildAdjustmentPrintData({

      adjustment,

      parentInvoice: selectedInvoice,

      originalInvoiceNumber:

        adjustmentSummary?.documentNumber ?? selectedInvoice.documentNumber,

      invoiceLineItems,

      encounterDetails: matchingEncounterDetails,

      eligibilitySnapshot:

        matchingEncounterDetails != null

          ? eligibilitySnapshot ?? encounterDetails?.eligibilitySnapshot ?? null

          : null,

      patient,

      facility: facilityPrintInfo,

      chargeContext

    });

  };

  const handlePreviewAdjustment = (adjustment: FinancialDocumentAdjustment) => {

    if (!printLookupsReady) {

      return;

    }



    const printData = buildSelectedAdjustmentPrintData(adjustment);

    if (printData == null) {

      return;

    }



    openAdjustmentPrintPreview([printData], false);

  };

  useEffect(() => {
    if (
      pendingInvoicePrint == null ||
      !printLookupsReady ||
      encounterDetails == null ||
      pendingInvoicePrint.invoices.length === 0
    ) {
      return;
    }

    openInvoicePrintPreview(
      pendingInvoicePrint.invoices,
      pendingInvoicePrint.autoPrint
    );
    setPendingInvoicePrint(null);
  }, [
    encounterDetails,
    pendingInvoicePrint,
    printLookupsReady
  ]);

  useEffect(() => {
    if (
      pendingAdjustmentPrint == null ||
      !printLookupsReady ||
      selectedInvoice == null
    ) {
      return;
    }

    const printData = buildSelectedAdjustmentPrintData(pendingAdjustmentPrint.adjustment);

    if (printData == null) {
      return;
    }

    openAdjustmentPrintPreview([printData], pendingAdjustmentPrint.autoPrint);
    setPendingAdjustmentPrint(null);
  }, [
    adjustmentSummary,
    chargeContext,
    eligibilitySnapshot,
    encounterDetails,
    facilityPrintInfo,
    invoiceLineItems,
    pendingAdjustmentPrint,
    printLookupsReady,
    selectedInvoice
  ]);



  const handleGenerateInvoices = async () => {

    if (selectedEncounterId == null || encounterDetails == null || facilityId == null) return;



    if (!invoiceNumberingReady) {

      dispatch(

        notify({

          msg: numberingSetupHint(
            financialDocumentTypes.invoice,
            financialDocumentTypes.labelFor(financialDocumentTypes.invoice)
          ),

          sev: 'warning'

        })

      );

      return;

    }



    try {

      const result = await generateInvoices({

        encounterId: selectedEncounterId,

        requestId: makeRequestId('invoice-generate')

      }).unwrap();



      const invoiceNumbers =

        result.invoices?.map(invoice => invoice.documentNumber).join(', ') ?? '';



      dispatch(

        notify({

          msg: invoiceNumbers

            ? `Invoice(s) generated: ${invoiceNumbers}`

            : 'Invoice(s) generated successfully.',

          sev: 'success'

        })

      );



      await Promise.all([

        refetchBillableVisits(),

        refetchEncounterDetails(),

        refetchFinancialInvoices(),

        refetchEligibilitySnapshot()

      ]);



      if (result.invoices?.length) {
        const generatedPrintData = await Promise.all(
          result.invoices.map(async invoice => {
            const [lineItems, pricingSummary] = await Promise.all([
              fetchInvoiceLineItemsForPrint(invoice.id).unwrap(),
              fetchInvoicePricingSummaryForPrint(invoice.id).unwrap()
            ]);

            return buildInvoicePrintDataFromIssuedInvoice({
              invoice,
              lineItems,
              pricingSummary,
              encounterDetails: encounterDetails ?? null,
              eligibilitySnapshot:
                eligibilitySnapshot ?? encounterDetails?.eligibilitySnapshot ?? null,
              patient,
              facility: facilityPrintInfo,
              chargeContext
            });
          })
        );

        setPendingInvoicePrint({
          invoices: generatedPrintData,
          autoPrint: true
        });
      }

    } catch (error: any) {

      dispatch(

        notify({

          msg: extractApiErrorMessage(error, INVOICE_FLOW_ERROR_MAP),

          sev: 'error'

        })

      );

    }

  };



  const handlePreviewSelectedInvoice = () => {

    if (selectedInvoice == null || !printLookupsReady) {

      return;

    }



    const matchingEncounterDetails =

      encounterDetails?.encounterId === selectedInvoice.encounterId

        ? encounterDetails

        : null;



    openInvoicePrintPreview(

      [

        buildInvoicePrintDataFromIssuedInvoice({

          invoice: selectedInvoice,

          lineItems: invoiceLineItems,
          pricingSummary: selectedInvoicePricingSummary ?? null,

          encounterDetails: matchingEncounterDetails,

          eligibilitySnapshot:

            matchingEncounterDetails != null

              ? eligibilitySnapshot ?? encounterDetails?.eligibilitySnapshot ?? null

              : null,

          patient,

          facility: facilityPrintInfo,

          chargeContext

        })

      ],

      false

    );

  };

  const resolveChargeContextForInvoice = (invoice: PatientFinancialInvoice) =>
    invoice.encounterId === printEncounterId
      ? chargeContext
      : { billingSummary: null, chargeRows: [] as typeof chargeContext.chargeRows };

  const handlePrintInvoiceRow = async (invoice: PatientFinancialInvoice) => {
    if (!printLookupsReady) {
      return;
    }

    try {
      const [lineItems, pricingSummary] = await Promise.all([
        fetchInvoiceLineItemsForPrint(invoice.id).unwrap(),
        fetchInvoicePricingSummaryForPrint(invoice.id).unwrap()
      ]);
      const matchingEncounterDetails =
        encounterDetails?.encounterId === invoice.encounterId ? encounterDetails : null;

      openInvoicePrintPreview(
        [
          buildInvoicePrintDataFromIssuedInvoice({
            invoice,
            lineItems,
            pricingSummary,
            encounterDetails: matchingEncounterDetails,
            eligibilitySnapshot:
              matchingEncounterDetails != null
                ? eligibilitySnapshot ?? encounterDetails?.eligibilitySnapshot ?? null
                : null,
            patient,
            facility: facilityPrintInfo,
            chargeContext: resolveChargeContextForInvoice(invoice)
          })
        ],
        false
      );
    } catch (error: any) {
      dispatch(
        notify({
          msg: extractApiErrorMessage(error, INVOICE_GENERATION_ERROR_MAP),
          sev: 'error'
        })
      );
    }
  };



  const handleFreezeEligibility = async () => {

    if (selectedEncounterId == null) return;



    try {

      await freezeEligibilitySnapshot({

        encounterId: selectedEncounterId,

        requestId: makeRequestId('eligibility-freeze')

      }).unwrap();



      dispatch(

        notify({

          msg: 'Eligibility snapshot frozen successfully.',

          sev: 'success'

        })

      );



      await Promise.all([refetchEligibilitySnapshot(), refetchEncounterDetails()]);

    } catch (error: any) {

      dispatch(

        notify({

          msg: extractApiErrorMessage(error, INVOICE_FLOW_ERROR_MAP),

          sev: 'error'

        })

      );

    }

  };



  const handleCreateAdjustment = async (payload: CreateAdjustmentRequest) => {

    if (selectedInvoiceId == null || facilityId == null) return;



    const isCredit = adjustmentModal.kind === 'CREDIT_NOTE';

    const documentType = resolveAdjustmentDocumentType(adjustmentModal.kind);

    const numberingReady = isCredit ? creditNoteNumberingReady : debitNoteNumberingReady;



    if (!numberingReady) {

      dispatch(

        notify({

          msg: numberingSetupHint(documentType),

          sev: 'warning'

        })

      );

      return;

    }



    try {

      const result = isCredit

        ? await createCreditNote({

            invoiceId: selectedInvoiceId,

            body: payload

          }).unwrap()

        : await createDebitNote({

            invoiceId: selectedInvoiceId,

            body: payload

          }).unwrap();



      dispatch(

        notify({

          msg: `${isCredit ? 'Credit' : 'Debit'} note ${result.documentNumber} issued successfully.`,

          sev: 'success'

        })

      );



      setAdjustmentModal(current => ({ ...current, open: false }));



      await Promise.all([

        refetchAdjustments(),

        refetchFinancialInvoices(),

        refetchInvoiceLineItems(),

        refetchAddableChargeLines(),

        onSimulatedInvoicePayment?.()

      ]);



      setPendingAdjustmentPrint({

        adjustment: result,

        autoPrint: true

      });

    } catch (error: any) {

      dispatch(

        notify({

          msg: extractApiErrorMessage(error, ADJUSTMENT_FLOW_ERROR_MAP),

          sev: 'error'

        })

      );

    }

  };



  const billableVisitColumns = [

    {

      key: 'encounterNumber',

      title: 'Visit Number'

    },

    {

      key: 'encounterDate',

      title: 'Visit Date'

    },

    {

      key: 'encounterType',

      title: 'Visit Type'

    },

    {

      key: 'coverageType',

      title: 'Coverage'

    },

    {

      key: 'serviceCount',

      title: 'Services'

    },

    {

      key: 'netAmount',

      title: 'Net Amount',

      render: (row: BillableVisit) =>

        formatMoney(row.netAmount, row.currency ?? 'SAR')

    },

    {

      key: 'billingStatus',

      title: 'Billing Status',

      render: (row: BillableVisit) => (

        <Tag color={billingStatusColor(row.billingStatus)}>{row.billingStatus}</Tag>

      )

    },

    {

      key: 'invoiceReady',

      title: 'Ready',

      render: (row: BillableVisit) => (

        <Tag color={row.invoiceReady ? 'green' : 'yellow'}>

          {row.invoiceReady ? 'Ready to Invoice' : 'Pending Close'}

        </Tag>

      )

    }

  ];



  const serviceColumns = [

    { key: 'itemCode', title: 'Service Code' },

    { key: 'itemName', title: 'Service Name' },

    { key: 'quantity', title: 'Qty' },

    {

      key: 'unitPrice',

      title: 'Unit Price',

      render: (row: any) => formatMoney(row.unitPrice)

    },

    {

      key: 'netAmount',

      title: 'Total',

      render: (row: any) => formatMoney(row.netAmount)

    },

    {

      key: 'patientResponsibilityAmount',

      title: 'Patient Share',

      render: (row: any) => formatMoney(row.patientResponsibilityAmount)

    },

    {

      key: 'insuranceResponsibilityAmount',

      title: 'Insurance Share',

      render: (row: any) => formatMoney(row.insuranceResponsibilityAmount)

    },

    {

      key: 'taxAmount',

      title: 'VAT',

      render: (row: any) => formatMoney(row.taxAmount)

    }

  ];



  const issuedInvoiceColumns = [

    { key: 'documentNumber', title: 'Invoice Number' },

    {

      key: 'documentSubtype',

      title: 'Type',

      render: (row: PatientFinancialInvoice) => (

        <Tag color={row.documentSubtype === 'INSURANCE_CLAIM' ? 'violet' : 'blue'}>

          {invoiceSubtypeLabel(row.documentSubtype)}

        </Tag>

      )

    },

    {

      key: 'createdDate',

      title: 'Invoice Date',

      render: (row: PatientFinancialInvoice) =>

        row.createdDate ? String(row.createdDate).substring(0, 10) : '-'

    },

    { key: 'encounterId', title: 'Visit ID' },

    {

      key: 'eligibilityReference',

      title: 'Eligibility',

      render: (row: PatientFinancialInvoice) => row.eligibilityReference ?? '-'

    },

    {

      key: 'claimReference',

      title: 'Claim',

      render: (row: PatientFinancialInvoice) => row.claimReference ?? '-'

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

      render: (row: PatientFinancialInvoice) => (

        <Tag>{invoiceStatusLabel(row.status)}</Tag>

      )

    },

    {

      key: 'print',

      title: 'Report',

      render: (row: PatientFinancialInvoice) => (

        <MyButton

          appearance="ghost"

          size="sm"

          disabled={!printLookupsReady}

          onClick={event => {

            event.stopPropagation();

            void handlePrintInvoiceRow(row);

          }}

        >

          <FontAwesomeIcon icon={faPrint} /> Print

        </MyButton>

      )

    }

  ];



  if (patientId == null) {

    return (

      <div className="billing-invoices__empty">

        <Text muted>Select a patient to review billable visits and invoices.</Text>

      </div>

    );

  }



  return (

    <div className="billing-invoices">

      <SectionContainer

        title="Billable Visits"

        content={

          <MyTable

            data={billableVisits}

            columns={billableVisitColumns}

            loading={loadingBillableVisits}

            rowClassName={(row: BillableVisit) =>

              row.encounterId === selectedEncounterId ? 'selected-row' : ''

            }

            onRowClick={(row: BillableVisit) =>

              setSelectedEncounterId(row.encounterId)

            }

          />

        }

      />



      {selectedEncounterId != null && (

        <Panel bordered className="billing-invoices__details">

          <div className="billing-invoices__details-header">

            <div>

              <Text weight="bold">

                Visit Details — {encounterDetails?.encounterNumber ?? selectedVisit?.encounterNumber}

              </Text>

              <div className="billing-invoices__meta">

                <Tag color={billingStatusColor(encounterDetails?.billingStatus)}>

                  {encounterDetails?.billingStatus ?? selectedVisit?.billingStatus}

                </Tag>

                <Tag>{encounterDetails?.coverageType ?? selectedVisit?.coverageType}</Tag>

                {encounterDetails?.eligibilityReference && (

                  <Tag color="cyan">

                    Eligibility: {encounterDetails.eligibilityReference}

                  </Tag>

                )}

              </div>

            </div>



            <div className="billing-invoices__actions">

              <MyButton

                appearance="primary"

                disabled={!canFinancialClose || closingFinancially}

                loading={closingFinancially}

                onClick={handleFinancialClose}

              >

                <FontAwesomeIcon icon={faLock} /> Financial Close

              </MyButton>



              <MyButton

                appearance="primary"

                color="green"

                disabled={!canGenerateInvoice || generatingInvoices || loadingNumberingConfigurations}

                loading={generatingInvoices}

                onClick={handleGenerateInvoices}

              >

                <FontAwesomeIcon icon={faFileInvoice} /> Generate Invoice

              </MyButton>

            </div>



            {facilityId != null && !loadingNumberingConfigurations && !invoiceNumberingReady ? (

              <Text muted size="sm" className="billing-invoices__numbering-hint">

                {numberingSetupHint(
                  financialDocumentTypes.invoice,
                  financialDocumentTypes.labelFor(financialDocumentTypes.invoice)
                )}

              </Text>

            ) : null}

          </div>



          <EligibilitySnapshotPanel

            coverageType={encounterDetails?.coverageType ?? selectedVisit?.coverageType}

            snapshot={eligibilitySnapshot ?? encounterDetails?.eligibilitySnapshot ?? null}

            loading={loadingEligibilitySnapshot}

            freezing={freezingEligibility}

            onFreeze={handleFreezeEligibility}

            canFreeze={canFreezeEligibility}

            currency={selectedVisit?.currency ?? 'SAR'}

          />



          <div className="billing-invoices__patient-grid">

            <div>

              <Text muted>Patient</Text>

              <Text>{encounterDetails?.patient?.fullName ?? '-'}</Text>

            </div>

            <div>

              <Text muted>MRN</Text>

              <Text>{encounterDetails?.patient?.medicalRecordNumber ?? '-'}</Text>

            </div>

            <div>

              <Text muted>National ID</Text>

              <Text>{encounterDetails?.patient?.nationalId ?? '-'}</Text>

            </div>

            <div>

              <Text muted>Mobile</Text>

              <Text>{encounterDetails?.patient?.mobileNumber ?? '-'}</Text>

            </div>

          </div>



          <MyTable

            data={visitDetailRows}

            columns={serviceColumns}

            loading={loadingEncounterDetails || !visitDetailsLookupsReady}

          />

        </Panel>

      )}



      <SectionContainer

        title="Invoice Accounts"

        content={

          <div className="billing-invoices__accounts-layout">

            <div className="billing-invoices__accounts-list">

              <div className="billing-invoices__accounts-list-header">

                <h3 className="billing-invoices__accounts-list-title">Your invoices</h3>

                <p className="billing-invoices__accounts-list-subtitle">

                  Select an invoice to view services, payment status, and collect any remaining balance.

                </p>

              </div>

              <div className="billing-invoices__accounts-list-body">

                <MyTable

                  data={financialInvoices}

                  columns={issuedInvoiceColumns}

                  loading={loadingFinancialInvoices}

                  rowClassName={(row: PatientFinancialInvoice) =>

                    row.id === selectedInvoiceId ? 'selected-row' : ''

                  }

                  onRowClick={(row: PatientFinancialInvoice) =>

                    setSelectedInvoiceId(row.id)

                  }

                />

              </div>

              <div className="billing-invoices__accounts-detail">

                <InvoiceDetailPanel

              invoice={selectedInvoice}

              summary={adjustmentSummary}

              lineItems={invoiceLineItems}

              pricingSummary={selectedInvoicePricingSummary}

              loading={loadingAdjustments || loadingInvoiceLineItems}

              currency={selectedInvoice?.currency ?? 'SAR'}

              patient={patient}

              printDisabled={!printLookupsReady}

              canCreateCreditNote={canCreateCreditNote}

              canCreateDebitNote={canCreateDebitNote}

              onPrintInvoice={handlePreviewSelectedInvoice}

              onPrintAdjustment={handlePreviewAdjustment}

              onCreateCreditNote={async () => {

                if (selectedInvoiceId != null) {

                  await refetchInvoiceLineItems();

                }

                setAdjustmentModal({ open: true, kind: 'CREDIT_NOTE' });

              }}

              onCreateDebitNote={() =>

                setAdjustmentModal({ open: true, kind: 'DEBIT_NOTE' })

              }

              onRefresh={() => {

                void Promise.all([

                  refetchAdjustments(),

                  refetchInvoiceLineItems(),

                  refetchFinancialInvoices(),

                  onSimulatedInvoicePayment?.()

                ]);

              }}

            />

              </div>

            </div>

          </div>

        }

      />



      <InvoiceAdjustmentModal

        open={adjustmentModal.open}

        kind={adjustmentModal.kind}

        invoice={selectedInvoice}

        summary={adjustmentSummary}

        invoiceLines={invoiceLineItems}

        addableChargeLines={addableChargeLines}

        patientId={patientId}

        encounterId={selectedInvoice?.encounterId ?? selectedEncounterId}

        facilityId={facilityId}

        loading={creatingCreditNote || creatingDebitNote}

        loadingLines={loadingInvoiceLineItems || loadingAddableChargeLines}

        onClose={() => setAdjustmentModal(current => ({ ...current, open: false }))}

        onSubmit={handleCreateAdjustment}

      />



      <InvoicePrintModal

        open={invoicePrintModal.open}

        invoices={invoicePrintModal.invoices}

        autoPrint={invoicePrintModal.autoPrint}

        onClose={() =>

          setInvoicePrintModal(current => ({ ...current, open: false }))

        }

      />



      <AdjustmentPrintModal

        open={adjustmentPrintModal.open}

        adjustments={adjustmentPrintModal.adjustments}

        autoPrint={adjustmentPrintModal.autoPrint}

        onClose={() =>

          setAdjustmentPrintModal(current => ({ ...current, open: false }))

        }

      />

    </div>

  );

};



export default Invoices;


