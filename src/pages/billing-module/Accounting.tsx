import React, { useEffect, useMemo, useState } from 'react';
import { getHeight } from 'rsuite/esm/DOMHelper';
import { Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet } from '@fortawesome/free-solid-svg-icons';

import { newApPatient } from '@/types/model-types-constructor';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';

import MyTab from '@/components/MyTab';
import MyButton from '@/components/MyButton/MyButton';
import SectionContainer from '@/components/SectionsoContainer';

import ProfileSidebar from '../patient/patient-profile/ProfileSidebar-new';
import PatientBillingSide from './PatientBillingSide';
import Invoices from './Invoices';
import Receipt from './Receipt';

import {
  useCloneRejectedPreAuthorizationItemMutation,
  usePayRejectedPreAuthorizationItemAsCashMutation,
  useRefreshEncounterPreAuthorizationMutation
} from '@/services/waseel-integration/preAuthorizationService';
import { useBillingAccountingData } from './accounting/hooks/useBillingAccountingData';
import EncounterSelector from './accounting/components/EncounterSelector';
import BillingSummaryCards from './accounting/components/BillingSummaryCards';
import BillingTimeline from './accounting/components/BillingTimeline';
import BillingChargesTable from './accounting/components/BillingChargesTable';
import WaseelCoveragePanel from './accounting/components/WaseelCoveragePanel';
import CashFallbackBanner from './accounting/components/CashFallbackBanner';
import PreAuthorizationBillingControls from './accounting/components/PreAuthorizationBillingControls';
import WalletDepositModal from './accounting/components/WalletDepositModal';
import CollectPaymentModal from './accounting/components/CollectPaymentModal';
import PaymentReceiptModal from '@/pages/patient/patient-profile/PatientQuickAppoinment/PaymentReceiptModal';
import type { PaymentReceiptData } from '@/pages/patient/patient-profile/PatientQuickAppoinment/paymentPreviewUtils';
import BillingCheckoutPanel from './accounting/components/BillingCheckoutPanel';
import PrepareServicesPanel from './accounting/components/PrepareServicesPanel';
import EncounterSettlementBanner from './accounting/components/EncounterSettlementBanner';
import { resolvePatientId, sumEncounterReservedAmount, toNumber, computeRowRemainingAmount, computeEncounterRemainingToPay, formatMoney, isRowCollectable, isEncounterChargeCollectionComplete, isBillingServicesLocked, isEncounterClosedForBilling, WALLET_DEPOSIT_BUTTON_LABEL, formatEncounterDisplayLabel, normalizeBillingCoverageType } from './accounting/utils/billingAccountingUtils';

import './accounting/styles.less';

const Accounting: React.FC = () => {
  const dispatch = useAppDispatch();

  const [patient, setPatient] = useState<any>({ ...newApPatient });
  const [expand, setExpand] = useState(false);
  const [refetchData, setRefetchData] = useState(false);
  const [windowHeight] = useState(getHeight(window));

  const [selectedEncounterId, setSelectedEncounterId] = useState<number | null>(null);
  const [coverageType, setCoverageType] = useState<'SELF_PAY' | 'INSURANCE'>('SELF_PAY');
  const [selectedInsuranceId, setSelectedInsuranceId] = useState<number | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [collectPaymentModalOpen, setCollectPaymentModalOpen] = useState(false);
  const [selectedChargeRowIds, setSelectedChargeRowIds] = useState<string[]>([]);
  const [paymentReceiptModal, setPaymentReceiptModal] = useState<{
    open: boolean;
    receipt: PaymentReceiptData | null;
    autoPrint?: boolean;
  }>({ open: false, receipt: null, autoPrint: false });
  const [preAuthActionLoadingId, setPreAuthActionLoadingId] = useState<number | null>(null);
  const [canCloseCalculation, setCanCloseCalculation] = useState(true);

  const patientId = resolvePatientId(patient);

  const {
    facilityId,
    facilityCurrency,
    encounters,
    loadingEncounters,
    selectedEncounter,
    summary,
    loadingSummary,
    loadingBillingMetrics,
    loadingPsp,
    chargeRows,
    resolvedInvoiceId,
    invoiceAdjustments,
    loadingInvoiceContext,
    timelineEvents,
    rejectedPreAuthItems,
    pendingPreAuthItems,
    waseelCoverage,
    loadingWaseelCoverage,
    waseelCoverageError,
    walletBalance,
    reservedBalance,
    patientLedgerSummary,
    patientInsurances,
    loadingInsurances,
    encounterInvoiceDetails,
    refreshAll
  } = useBillingAccountingData({
    patient,
    selectedEncounterId,
    selectedInsuranceId,
    coverageType
  });

  const [refreshEncounterPreAuthorization, { isLoading: refreshingPreAuthorization }] =
    useRefreshEncounterPreAuthorizationMutation();
  const [payRejectedPreAuthorizationItemAsCash] =
    usePayRejectedPreAuthorizationItemAsCashMutation();
  const [cloneRejectedPreAuthorizationItem] =
    useCloneRejectedPreAuthorizationItemMutation();

  useEffect(() => {
    dispatch(setPageCode('Operation_Module'));
    dispatch(setDivContent('Patient Billing'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    setSelectedEncounterId(null);
    setCoverageType('SELF_PAY');
    setSelectedInsuranceId(null);
    setSelectedChargeRowIds([]);
  }, [patientId]);

  useEffect(() => {
    setSelectedChargeRowIds([]);
  }, [selectedEncounterId]);

  useEffect(() => {
    if (selectedEncounterId == null) {
      return;
    }

    if (encounterInvoiceDetails == null) {
      setCoverageType('SELF_PAY');
      setSelectedInsuranceId(null);
      return;
    }

    const resolvedCoverage = normalizeBillingCoverageType(
      encounterInvoiceDetails.coverageType
    );
    setCoverageType(resolvedCoverage);

    const insuranceId =
      encounterInvoiceDetails.eligibilitySnapshot?.patientInsuranceId ?? null;

    if (resolvedCoverage === 'INSURANCE' && insuranceId != null) {
      setSelectedInsuranceId(Number(insuranceId));
    } else if (resolvedCoverage === 'SELF_PAY') {
      setSelectedInsuranceId(null);
    }
  }, [selectedEncounterId, encounterInvoiceDetails]);

  const handleClosePatient = () => {
    setPatient({ ...newApPatient });
    setSelectedEncounterId(null);
    setCoverageType('SELF_PAY');
    setSelectedInsuranceId(null);
    setSelectedChargeRowIds([]);
    setDepositModalOpen(false);
    setCollectPaymentModalOpen(false);
    setPaymentReceiptModal({ open: false, receipt: null, autoPrint: false });
  };

  const handleCollectRemaining = () => {
    const rowsNeedingPayment = chargeRows.filter(row => isRowCollectable(row));

    if (!rowsNeedingPayment.length) {
      dispatch(
        notify({
          msg: 'All services on this encounter are already settled.',
          sev: 'info'
        })
      );
      return;
    }

    if (isEncounterChargeCollectionComplete(summary, selectedEncounter)) {
      dispatch(
        notify({
          msg: 'Checkout is already complete for this encounter. Any invoice balance is collected from Invoices or Pay outstanding below.',
          sev: 'info'
        })
      );
      return;
    }

    setSelectedChargeRowIds(rowsNeedingPayment.map(row => row.id));
    setCollectPaymentModalOpen(true);
  };

  const handleConvertRejectedToCash = async () => {
    if (selectedEncounterId == null) {
      dispatch(notify({ msg: 'Select an encounter first.', sev: 'warning' }));
      return;
    }

    if (!rejectedPreAuthItems.length) {
      return;
    }

    setPreAuthActionLoadingId(-1);

    try {
      for (const item of rejectedPreAuthItems) {
        if (item.id == null || item.isBilled) {
          continue;
        }

        await payRejectedPreAuthorizationItemAsCash({
          encounterId: selectedEncounterId,
          patientServiceProductId: Number(item.id)
        }).unwrap();
      }

      await refreshAll();

      dispatch(
        notify({
          msg: 'Rejected services billed as full cash using the insurance price list.',
          sev: 'success'
        })
      );
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            error?.data?.message ??
            error?.message ??
            'Unable to bill rejected services as cash.',
          sev: 'error'
        })
      );
    } finally {
      setPreAuthActionLoadingId(null);
    }
  };

  const handleRefreshPreAuthorization = async () => {
    if (selectedEncounterId == null) {
      dispatch(notify({ msg: 'Select an encounter first.', sev: 'warning' }));
      return;
    }

    try {
      const result = await refreshEncounterPreAuthorization({
        encounterId: selectedEncounterId
      }).unwrap();

      setCanCloseCalculation(result.canCloseCalculation !== false);
      await refreshAll();

      dispatch(
        notify({
          msg:
            result.message ??
            'Pre-authorization statuses refreshed from Waseel.',
          sev: result.canCloseCalculation === false ? 'warning' : 'success'
        })
      );
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            error?.data?.message ??
            error?.message ??
            'Unable to refresh pre-authorization status from Waseel.',
          sev: 'error'
        })
      );
    }
  };

  const handlePayRejectedAsCash = async (patientServiceProductId: number) => {
    if (selectedEncounterId == null) {
      return;
    }

    setPreAuthActionLoadingId(patientServiceProductId);

    try {
      await payRejectedPreAuthorizationItemAsCash({
        encounterId: selectedEncounterId,
        patientServiceProductId
      }).unwrap();

      await refreshAll();

      dispatch(
        notify({
          msg: 'Service billed as full cash using the insurance price list.',
          sev: 'success'
        })
      );
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            error?.data?.message ??
            error?.message ??
            'Unable to bill this rejected service as cash.',
          sev: 'error'
        })
      );
    } finally {
      setPreAuthActionLoadingId(null);
    }
  };

  const handleClonePreAuthorization = async (patientServiceProductId: number) => {
    if (selectedEncounterId == null) {
      return;
    }

    setPreAuthActionLoadingId(patientServiceProductId);

    try {
      await cloneRejectedPreAuthorizationItem({
        encounterId: selectedEncounterId,
        patientServiceProductId
      }).unwrap();

      setCanCloseCalculation(false);
      await refreshAll();

      dispatch(
        notify({
          msg: 'A new pre-authorization request was submitted to Waseel.',
          sev: 'success'
        })
      );
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            error?.data?.message ??
            error?.message ??
            'Unable to clone pre-authorization for this service.',
          sev: 'error'
        })
      );
    } finally {
      setPreAuthActionLoadingId(null);
    }
  };

  const selectedChargeRows = useMemo(
    () => chargeRows.filter(row => selectedChargeRowIds.includes(row.id)),
    [chargeRows, selectedChargeRowIds]
  );

  const departmentId = useMemo(
    () =>
      toNumber(
        selectedEncounter?.departmentId ??
          (selectedEncounter as { department?: { id?: number } })?.department?.id,
        0
      ) || null,
    [selectedEncounter]
  );

  const encounterRemainingToPay = useMemo(() => {
    if (loadingBillingMetrics) {
      return null;
    }

    if (invoiceAdjustments != null) {
      return Number(invoiceAdjustments.outstandingBalance ?? 0);
    }

    return computeEncounterRemainingToPay(summary, chargeRows);
  }, [summary, chargeRows, invoiceAdjustments, loadingBillingMetrics]);

  const selectedEncounterLabel = useMemo(
    () => formatEncounterDisplayLabel(selectedEncounter),
    [selectedEncounter]
  );

  const encounterClosedForBilling = useMemo(
    () =>
      isEncounterClosedForBilling(selectedEncounter, {
        chargeRows
      }),
    [selectedEncounter, chargeRows]
  );

  const chargeCollectionComplete = useMemo(
    () => isEncounterChargeCollectionComplete(summary, selectedEncounter),
    [summary, selectedEncounter]
  );

  const billingServicesLocked = useMemo(
    () => isBillingServicesLocked(summary, selectedEncounter, chargeRows),
    [summary, selectedEncounter, chargeRows]
  );

  const billingChargeFinalized = chargeCollectionComplete;

  const preAuthBlocksCheckout = useMemo(
    () =>
      coverageType === 'INSURANCE' &&
      (pendingPreAuthItems.length > 0 || canCloseCalculation === false),
    [canCloseCalculation, coverageType, pendingPreAuthItems.length]
  );

  useEffect(() => {
    if (coverageType !== 'INSURANCE') {
      setCanCloseCalculation(true);
      return;
    }

    setCanCloseCalculation(pendingPreAuthItems.length === 0);
  }, [coverageType, pendingPreAuthItems.length, selectedEncounterId]);

  useEffect(() => {
    if (billingServicesLocked) {
      setSelectedChargeRowIds([]);
      setCollectPaymentModalOpen(false);
    }
  }, [billingServicesLocked, selectedEncounterId]);

  const billingWorkspace = useMemo(
    () => (
      <div className="billing-accounting">
        <div className="billing-accounting__header">
          <div>
            <Text weight="semibold" size="lg">
              Billing workspace
            </Text>
            <div className="billing-accounting__subtitle">
              Step 1: prepare & calculate · Step 2: collect payment · Step 3: checkout & close
              {selectedEncounterLabel ? (
                <>
                  {' '}
                  · Encounter {selectedEncounterLabel}: remaining to pay{' '}
                  {loadingBillingMetrics || selectedEncounterId == null || encounterRemainingToPay == null
                    ? '—'
                    : formatMoney(
                        encounterRemainingToPay,
                        summary.currency ?? facilityCurrency
                      )}
                </>
              ) : null}
            </div>
          </div>
          <div className="billing-accounting__actions">
            <MyButton
              prefixIcon={() => <FontAwesomeIcon icon={faWallet} />}
              onClick={() => setDepositModalOpen(true)}
              disabled={patientId == null}
            >
              {WALLET_DEPOSIT_BUTTON_LABEL}
            </MyButton>
            <MyButton onClick={() => refreshAll()} disabled={patientId == null}>
              Refresh
            </MyButton>
          </div>
        </div>

        <BillingSummaryCards
          summary={summary}
          walletBalance={walletBalance}
          reservedBalance={reservedBalance}
          totalDebt={Number(patientLedgerSummary?.totalDebt ?? 0)}
          loading={
            selectedEncounterId == null ||
            loadingBillingMetrics ||
            loadingInvoiceContext
          }
          currency={summary.currency ?? facilityCurrency}
          coverageType={coverageType}
          chargeRows={chargeRows}
          invoiceAdjustments={invoiceAdjustments}
        />

        <EncounterSettlementBanner
          summary={summary}
          currency={summary.currency ?? facilityCurrency}
          chargeRows={chargeRows}
          loading={selectedEncounterId == null || loadingBillingMetrics}
        />

        <CashFallbackBanner
          rejectedItems={rejectedPreAuthItems}
          converting={preAuthActionLoadingId === -1}
          onConvertToCash={handleConvertRejectedToCash}
        />

        <div className="billing-accounting__grid">
          <div className="billing-accounting__panel">
            <div className="billing-accounting__panel-title">Encounters</div>
            <EncounterSelector
              encounters={encounters}
              selectedEncounterId={selectedEncounterId}
              loading={loadingEncounters}
              onSelect={setSelectedEncounterId}
              remainingToPay={encounterRemainingToPay ?? 0}
              remainingLoading={selectedEncounterId == null || loadingBillingMetrics}
              currency={summary.currency ?? facilityCurrency}
            />
          </div>

          <div className="billing-accounting__main-stack">
            <div className="billing-accounting__panel">
              <div className="billing-accounting__panel-title">
                Prepare & calculate
                <span className="billing-accounting__badge">Step 1</span>
              </div>
              <PrepareServicesPanel
                patientId={patientId}
                encounterId={selectedEncounterId}
                departmentId={departmentId}
                facilityId={facilityId != null ? Number(facilityId) : null}
                currency={summary.currency ?? facilityCurrency}
                summary={summary}
                coverageType={coverageType}
                selectedInsuranceId={selectedInsuranceId}
                patientInsurances={patientInsurances}
                onCoverageTypeChange={setCoverageType}
                onInsuranceChange={setSelectedInsuranceId}
                onPrepared={refreshAll}
                chargeRows={chargeRows}
                loadingBillingMetrics={loadingBillingMetrics}
                readOnly={billingChargeFinalized || preAuthBlocksCheckout}
              />
            </div>

            <div className="billing-accounting__panel">
              <div className="billing-accounting__panel-title">
                All services & products
                <span className="billing-accounting__badge">Step 2 · {chargeRows.length} lines</span>
              </div>
              <PreAuthorizationBillingControls
                visible={coverageType === 'INSURANCE' && selectedEncounterId != null}
                pendingCount={pendingPreAuthItems.length}
                canCloseCalculation={canCloseCalculation}
                refreshing={refreshingPreAuthorization}
                disabled={billingServicesLocked}
                onRefresh={handleRefreshPreAuthorization}
              />
              <BillingChargesTable
                rows={chargeRows}
                billingSummary={summary}
                loading={loadingSummary || loadingPsp}
                currency={summary.currency ?? facilityCurrency}
                chargeClosed={billingChargeFinalized}
                disabled={billingServicesLocked}
                selectedRowIds={selectedChargeRowIds}
                onSelectionChange={setSelectedChargeRowIds}
                onCollectPayment={() => setCollectPaymentModalOpen(true)}
                showPreAuthActions={coverageType === 'INSURANCE'}
                preAuthActionLoadingId={preAuthActionLoadingId}
                onPayRejectedAsCash={handlePayRejectedAsCash}
                onClonePreAuthorization={handleClonePreAuthorization}
              />
            </div>

            <div className="billing-accounting__panel">
              <div className="billing-accounting__panel-title">
                Checkout & settlement
                <span className="billing-accounting__badge">Step 3</span>
              </div>
              <BillingCheckoutPanel
                summary={summary}
                encounterId={selectedEncounterId}
                currency={summary.currency ?? facilityCurrency}
                coverageType={coverageType}
                chargeRows={chargeRows}
                encounterClosedForBilling={encounterClosedForBilling}
                chargeCollectionComplete={chargeCollectionComplete}
                invoiceId={resolvedInvoiceId}
                invoiceAdjustments={invoiceAdjustments}
                walletBalance={walletBalance}
                walletReserved={reservedBalance}
                loadingBillingMetrics={loadingBillingMetrics}
                preAuthBlocksCheckout={preAuthBlocksCheckout}
                onCompleted={refreshAll}
                onCollectRemaining={handleCollectRemaining}
                onInvoicePaid={refreshAll}
              />
            </div>

            <div className="billing-accounting__panel">
              <div className="billing-accounting__panel-title">Waseel eligibility</div>
              <WaseelCoveragePanel
                coverageType={coverageType}
                selectedInsuranceId={selectedInsuranceId}
                waseelCoverage={waseelCoverage}
                loading={loadingWaseelCoverage}
                hasError={waseelCoverageError}
                currency={summary.currency ?? facilityCurrency}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    [
      chargeRows,
      canCloseCalculation,
      coverageType,
      departmentId,
      encounters,
      facilityCurrency,
      facilityId,
      handleClonePreAuthorization,
      handleConvertRejectedToCash,
      handlePayRejectedAsCash,
      handleRefreshPreAuthorization,
      loadingEncounters,
      loadingPsp,
      loadingSummary,
      loadingWaseelCoverage,
      patientId,
      patientInsurances,
      patientLedgerSummary?.totalDebt,
      pendingPreAuthItems.length,
      preAuthActionLoadingId,
      preAuthBlocksCheckout,
      refreshAll,
      refreshingPreAuthorization,
      rejectedPreAuthItems,
      reservedBalance,
      selectedChargeRowIds,
      selectedEncounter,
      selectedEncounterId,
      selectedInsuranceId,
      encounterRemainingToPay,
      loadingBillingMetrics,
      billingServicesLocked,
      billingChargeFinalized,
      chargeCollectionComplete,
      encounterClosedForBilling,
      resolvedInvoiceId,
      invoiceAdjustments,
      selectedEncounterLabel,
      summary,
      walletBalance,
      waseelCoverage,
      waseelCoverageError
    ]
  );

  const tabData = [
    {
      title: 'Billing',
      content: billingWorkspace
    },
    {
      title: 'Invoices',
      content: (
        <Invoices
          patient={patient}
          walletBalance={walletBalance}
        />
      )
    },
    {
      title: 'Issued Documents',
      content: <Receipt patient={patient} />
    }
  ];

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  return (
    <div className="container billing-accounting-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="left-box" style={{ width: '100%' }}>
        {!patient?.id && (
          <SectionContainer
            title="Search patient"
            content={
              <div className="billing-accounting__subtitle">
                Select a patient to review treatment start, charge history, Waseel coverage, and
                wallet balance.
              </div>
            }
          />
        )}
        <MyTab key={patientId ?? 'no-patient'} data={tabData} lazy />
      </div>

      {patient?.id ? (
        <div className="right-box billing-accounting-page__sidebar">
          <PatientBillingSide
            patient={patient}
            onDeposit={() => setDepositModalOpen(true)}
            setPatient={handleClosePatient}
          />
          <div className="billing-accounting billing-accounting__sidebar-timeline">
            <div className="billing-accounting__panel">
              <div className="billing-accounting__panel-title">
                Billing timeline
                {selectedEncounterLabel && (
                  <span className="billing-accounting__badge">
                    Encounter {selectedEncounterLabel}
                  </span>
                )}
              </div>
              <BillingTimeline
                events={timelineEvents}
                loading={
                  selectedEncounterId != null && (loadingSummary || loadingPsp)
                }
              />
            </div>
          </div>
        </div>
      ) : (
          <ProfileSidebar
            expand={expand}
            setExpand={setExpand}
            windowHeight={windowHeight}
            setLocalPatient={setPatient}
            refetchData={refetchData}
            setRefetchData={setRefetchData}
          />
      )}

      {patientId != null && (
        <>
          <WalletDepositModal
            open={depositModalOpen}
            onClose={() => setDepositModalOpen(false)}
            patientId={patientId}
            patient={patient}
            encounter={selectedEncounter}
            encounterId={selectedEncounterId}
            facilityId={facilityId != null ? Number(facilityId) : null}
            currency={summary.currency ?? facilityCurrency}
            onDeposited={refreshAll}
            onReceiptReady={receipt =>
              setPaymentReceiptModal({
                open: true,
                receipt,
                autoPrint: true
              })
            }
          />
          <CollectPaymentModal
            open={collectPaymentModalOpen}
            onClose={() => setCollectPaymentModalOpen(false)}
            patientId={patientId}
            patient={patient}
            encounter={selectedEncounter}
            encounterId={selectedEncounterId}
            facilityId={facilityId != null ? Number(facilityId) : null}
            currency={summary.currency ?? facilityCurrency}
            walletBalance={walletBalance}
            reservedBalance={sumEncounterReservedAmount(summary)}
            billingSummary={summary}
            selectedRows={selectedChargeRows}
            onCollected={() => {
              setSelectedChargeRowIds([]);
              void refreshAll();
            }}
          />
          <PaymentReceiptModal
            open={paymentReceiptModal.open}
            receipt={paymentReceiptModal.receipt}
            autoPrint={paymentReceiptModal.autoPrint}
            onClose={() =>
              setPaymentReceiptModal({
                open: false,
                receipt: null,
                autoPrint: false
              })
            }
          />
        </>
      )}
    </div>
  );
};

export default Accounting;
