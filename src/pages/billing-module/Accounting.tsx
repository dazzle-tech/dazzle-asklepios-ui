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

import { usePrepareDefaultServicesMutation } from '@/services/billing/billingTransactionService';
import { useBillingAccountingData } from './accounting/hooks/useBillingAccountingData';
import EncounterSelector from './accounting/components/EncounterSelector';
import BillingSummaryCards from './accounting/components/BillingSummaryCards';
import BillingTimeline from './accounting/components/BillingTimeline';
import BillingChargesTable from './accounting/components/BillingChargesTable';
import WaseelCoveragePanel from './accounting/components/WaseelCoveragePanel';
import CashFallbackBanner from './accounting/components/CashFallbackBanner';
import WalletDepositModal from './accounting/components/WalletDepositModal';
import CollectPaymentModal from './accounting/components/CollectPaymentModal';
import BillingCheckoutPanel from './accounting/components/BillingCheckoutPanel';
import PrepareServicesPanel from './accounting/components/PrepareServicesPanel';
import EncounterSettlementBanner from './accounting/components/EncounterSettlementBanner';
import { makeRequestId, resolvePatientId, sumEncounterReservedAmount, toNumber, computeRowRemainingAmount, computeEncounterRemainingToPay, formatMoney, isRowCollectable, isEncounterClosedForBilling, WALLET_DEPOSIT_BUTTON_LABEL, formatEncounterDisplayLabel } from './accounting/utils/billingAccountingUtils';

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

  const patientId = resolvePatientId(patient);

  const {
    facilityId,
    facilityCurrency,
    encounters,
    loadingEncounters,
    selectedEncounter,
    summary,
    loadingSummary,
    loadingPsp,
    chargeRows,
    timelineEvents,
    rejectedPreAuthItems,
    waseelCoverage,
    loadingWaseelCoverage,
    waseelCoverageError,
    walletBalance,
    reservedBalance,
    patientLedgerSummary,
    patientInsurances,
    refreshAll
  } = useBillingAccountingData({
    patient,
    selectedEncounterId,
    selectedInsuranceId,
    coverageType
  });

  const [prepareDefaultServices, { isLoading: convertingToCash }] =
    usePrepareDefaultServicesMutation();

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
    if (selectedEncounterId != null) return;
    if (!encounters.length) return;
    setSelectedEncounterId(encounters[0].id);
  }, [encounters, selectedEncounterId]);

  const handleClosePatient = () => {
    setPatient({ ...newApPatient });
    setSelectedEncounterId(null);
    setCoverageType('SELF_PAY');
    setSelectedInsuranceId(null);
    setSelectedChargeRowIds([]);
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

    if (summary.chargeStatus === 'CLOSED') {
      dispatch(
        notify({
          msg: 'Checkout is already complete for this encounter. Any debit balance is collected from Invoices.',
          sev: 'info'
        })
      );
      return;
    }

    setSelectedChargeRowIds(rowsNeedingPayment.map(row => row.id));
    setCollectPaymentModalOpen(true);
  };

  const handleConvertRejectedToCash = async () => {
    if (selectedEncounterId == null || patientId == null || facilityId == null) {
      dispatch(notify({ msg: 'Select a patient and encounter first.', sev: 'warning' }));
      return;
    }

    const serviceItems = rejectedPreAuthItems
      .filter(item => item.serviceId != null)
      .map((item, index) => ({
        serviceId: Number(item.serviceId),
        quantity: Number(item.quantity ?? 1),
        sequence: index + 1,
        isExempted: false
      }));

    if (!serviceItems.length) {
      dispatch(
        notify({
          msg: 'Rejected items cannot be converted automatically. Switch coverage to self pay and re-prepare services manually.',
          sev: 'warning'
        })
      );
      setCoverageType('SELF_PAY');
      setSelectedInsuranceId(null);
      return;
    }

    try {
      await prepareDefaultServices({
        encounterId: selectedEncounterId,
        body: {
          patientId,
          facilityId: Number(facilityId),
          currency: summary.currency ?? facilityCurrency,
          coverageType: 'SELF_PAY',
          patientInsuranceId: null,
          items: serviceItems,
          requestId: makeRequestId('CASH-FALLBACK')
        }
      }).unwrap();

      setCoverageType('SELF_PAY');
      setSelectedInsuranceId(null);
      await refreshAll();

      dispatch(
        notify({
          msg: 'Rejected services re-priced as self pay. Patient can now be billed directly.',
          sev: 'success'
        })
      );
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            error?.data?.message ??
            error?.message ??
            'Unable to convert rejected services to cash billing.',
          sev: 'error'
        })
      );
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

  const encounterRemainingToPay = useMemo(
    () => computeEncounterRemainingToPay(summary, chargeRows),
    [summary, chargeRows]
  );

  const selectedEncounterLabel = useMemo(
    () => formatEncounterDisplayLabel(selectedEncounter),
    [selectedEncounter]
  );

  const encounterClosedForBilling = useMemo(
    () => isEncounterClosedForBilling(selectedEncounter),
    [selectedEncounter]
  );

  useEffect(() => {
    if (encounterClosedForBilling) {
      setSelectedChargeRowIds([]);
    }
  }, [encounterClosedForBilling, selectedEncounterId]);

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
                  {formatMoney(encounterRemainingToPay, summary.currency ?? facilityCurrency)}
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
          currency={summary.currency ?? facilityCurrency}
          coverageType={coverageType}
          chargeRows={chargeRows}
        />

        <EncounterSettlementBanner
          summary={summary}
          currency={summary.currency ?? facilityCurrency}
          chargeRows={chargeRows}
        />

        <CashFallbackBanner
          rejectedItems={rejectedPreAuthItems}
          converting={convertingToCash}
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
              remainingToPay={encounterRemainingToPay}
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
              />
            </div>

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
                loading={loadingSummary || loadingPsp}
              />
            </div>

            <div className="billing-accounting__panel">
              <div className="billing-accounting__panel-title">
                All services & products
                <span className="billing-accounting__badge">Step 2 · {chargeRows.length} lines</span>
              </div>
              <BillingChargesTable
                rows={chargeRows}
                loading={loadingSummary || loadingPsp}
                currency={summary.currency ?? facilityCurrency}
                chargeClosed={summary.chargeStatus === 'CLOSED'}
                disabled={encounterClosedForBilling}
                selectedRowIds={selectedChargeRowIds}
                onSelectionChange={setSelectedChargeRowIds}
                onCollectPayment={() => setCollectPaymentModalOpen(true)}
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
                onCompleted={refreshAll}
                onCollectRemaining={handleCollectRemaining}
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
      convertingToCash,
      coverageType,
      departmentId,
      encounters,
      facilityCurrency,
      facilityId,
      loadingEncounters,
      loadingPsp,
      loadingSummary,
      loadingWaseelCoverage,
      patientId,
      patientInsurances,
      patientLedgerSummary?.totalDebt,
      refreshAll,
      rejectedPreAuthItems,
      reservedBalance,
      selectedChargeRowIds,
      selectedEncounter,
      selectedEncounterId,
      selectedInsuranceId,
      encounterRemainingToPay,
      encounterClosedForBilling,
      selectedEncounterLabel,
      summary,
      timelineEvents,
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
          onSimulatedInvoicePayment={() => {
            void refreshAll();
          }}
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
        <MyTab key={patient?.id ?? 'no-patient'} data={tabData} lazy />
      </div>

      {patient?.id ? (
        <div className="right-box">
          <PatientBillingSide
            patient={patient}
            onDeposit={() => setDepositModalOpen(true)}
            setPatient={handleClosePatient}
          />
        </div>
      ) : (
        <div className="right-box">
          <ProfileSidebar
            expand={expand}
            setExpand={setExpand}
            windowHeight={windowHeight}
            setLocalPatient={setPatient}
            refetchData={refetchData}
            setRefetchData={setRefetchData}
          />
        </div>
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
            currency={summary.currency ?? facilityCurrency}
            onDeposited={refreshAll}
          />
          <CollectPaymentModal
            open={collectPaymentModalOpen}
            onClose={() => setCollectPaymentModalOpen(false)}
            patientId={patientId}
            patient={patient}
            encounter={selectedEncounter}
            encounterId={selectedEncounterId}
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
        </>
      )}
    </div>
  );
};

export default Accounting;
