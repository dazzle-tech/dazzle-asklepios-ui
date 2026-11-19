import React, { useMemo } from 'react';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaFilePrescription } from 'react-icons/fa6';
import PlusIcon from '@rsuite/icons/Plus';
import BlockIcon from '@rsuite/icons/Block';
import CheckIcon from '@rsuite/icons/Check';
import ReloadIcon from '@rsuite/icons/Reload';

import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { formatDateWithoutSeconds } from '@/utils';

import type { NahdiSyncStatus } from '@/services/patients/Prescription/patientPrescriptionService';

import PrescriptionReportButton from './PrescriptionReportButton';

type Props = {
  edit: boolean;
  isNurse: boolean;
  isLoadingPrescriptions: boolean;
  isLoadingCreateOrGet: boolean;
  currentPrescription: any;
  setPreKeyRecord: React.Dispatch<React.SetStateAction<{ preKey: number | null }>>;
  prescriptions: any[];
  selectedRows: any[];
  patientPrescriptionMedicationObject: any;
  setSelectedRows: React.Dispatch<React.SetStateAction<any[]>>;
  setOpenCancellation: React.Dispatch<React.SetStateAction<boolean>>;
  setSummaryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleNewPrescriptionAndAddMedication: () => void;
  handleClearSelection: () => void;
  // Sends the edited (submitted) prescription to Nahdi again.
  handleResendToNahdi: () => void;
  isResending: boolean;
  // The submitted prescription changed after its last send.
  hasUnsentChanges: boolean;
  // Re-checks the pharmacy dispensing status.
  handleRefreshDispensingStatus: () => void;
  isRefreshingDispensing: boolean;
  // Whether the submitted prescription reached the pharmacy (order number, or the reason it failed).
  nahdiSyncStatus?: NahdiSyncStatus;
};

const isDraftStatus = (status: any) => {
  const s = String(status ?? '').toUpperCase();
  return !s || s === 'DRAFT' || s === 'NEW';
};

/**
 * Whether a submitted prescription reached the pharmacy (Nahdi): sent with its order number, or not delivered
 * with the reason. Shown to every user; nothing is shown for prescriptions sent before sends were recorded.
 */
const PHARMACY_UNREACHABLE = 'Could not reach the pharmacy system. Try Resend later; if it keeps failing, contact IT.';

const PharmacySendStatus = ({ status }: { status?: NahdiSyncStatus }) => {
  if (!status) return null;

  const line = (color: string, label: string, detail?: string | null, title?: string | null) => (
    <span
      title={title ?? undefined}
      style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 8, lineHeight: 1.4 }}
    >
      <span style={{ color, fontWeight: 600 }}>
        ● <Translate>{label}</Translate>
      </span>
      {detail && <span style={{ color: 'var(--primary-gray)', fontSize: 12 }}>{detail}</span>}
    </span>
  );

  if (!status.integrationEnabled) {
    return line('var(--primary-gray)', 'Not sent to pharmacy', 'Pharmacy integration is off');
  }
  if (status.lastAttemptStatus === 'FAILED') {
    const when = status.lastAttemptAt ? formatDateWithoutSeconds(status.lastAttemptAt) : '';
    // The doctor sees what to do; the technical reason (e.g. invalid token) is only a hint for IT.
    const message = status.failureMessage || PHARMACY_UNREACHABLE;
    return line(
      'var(--primary-red)',
      'Not delivered to pharmacy',
      [message, when].filter(Boolean).join(' · '),
      status.failureReason ? `Technical details: ${status.failureReason}` : null
    );
  }
  if (status.lastSentAt) {
    const detail = [
      status.orderNumber ? `Order ${status.orderNumber}` : null,
      formatDateWithoutSeconds(status.lastSentAt)
    ]
      .filter(Boolean)
      .join(' · ');
    return line('var(--primary-green)', 'Sent to pharmacy', detail);
  }
  return null;
};

const PrescriptionToolbar = ({
  edit,
  isNurse,
  isLoadingPrescriptions,
  isLoadingCreateOrGet,
  currentPrescription,
  setPreKeyRecord,
  prescriptions,
  selectedRows,
  patientPrescriptionMedicationObject,
  setSelectedRows,
  setOpenCancellation,
  setSummaryModalOpen,
  handleNewPrescriptionAndAddMedication,
  handleClearSelection,
  handleResendToNahdi,
  isResending,
  hasUnsentChanges,
  handleRefreshDispensingStatus,
  isRefreshingDispensing,
  nahdiSyncStatus
}: Props) => {
  const isSubmitted = String(currentPrescription?.status ?? '').toUpperCase() === 'SUBMITTED';
  const hasSelection = currentPrescription?.id != null;

  // Drafts on top, then newest first
  const displayedPrescriptions = useMemo(() => {
    return [...(prescriptions ?? [])].sort((a: any, b: any) => {
      const aDraft = isDraftStatus(a?.status);
      const bDraft = isDraftStatus(b?.status);
      if (aDraft && !bDraft) return -1;
      if (!aDraft && bDraft) return 1;

      const timeA = a?.createdDate ? new Date(a.createdDate).getTime() : 0;
      const timeB = b?.createdDate ? new Date(b.createdDate).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;

      return (Number(b?.id) || 0) - (Number(a?.id) || 0);
    });
  }, [prescriptions]);

  return (
    <div className="prescription-header">
      <div className="header-top-grid">
        {/* Left side: prescriptions compact list */}
        <div className="orders-mini-table-container">
          <div className="orders-list-header">
            <span className="orders-list-header-title">
              <Translate>Prescriptions</Translate>
            </span>
            <div className="orders-list-header-actions">
              {hasSelection && (
                <MyButton appearance="ghost" size="xs" onClick={handleClearSelection}>
                  Clear Selection
                </MyButton>
              )}
              <span className="orders-list-count-badge">{displayedPrescriptions.length}</span>
            </div>
          </div>

          <div className="orders-compact-list">
            {displayedPrescriptions.length === 0 ? (
              <div className="orders-empty-state">
                <Translate>No prescriptions</Translate>
              </div>
            ) : (
              displayedPrescriptions.map((item: any, index: number) => {
                const isSelected =
                  item?.id != null &&
                  currentPrescription?.id != null &&
                  String(item.id) === String(currentPrescription.id);

                const label =
                  item?.prescriptionNum || (item?.id ? `#${item.id}` : `Prescription #${index + 1}`);

                // prescriptionDate is a date-only LocalDate (parsing it yields a fake midnight-UTC time),
                // so take the real timestamp from createdDate and show prescriptionDate without time as a fallback
                const dateText = item?.createdDate
                  ? formatDateWithoutSeconds(item.createdDate)
                  : item?.prescriptionDate
                    ? String(item.prescriptionDate).split('-').reverse().join('/')
                    : '-';

                return (
                  <div
                    key={item?.id ?? index}
                    className={`order-compact-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setPreKeyRecord({ preKey: item?.id ?? null })}
                  >
                    <div className="order-compact-card-left">
                      <div className="order-compact-icon">
                        <FaFilePrescription />
                      </div>
                      <div className="order-compact-details">
                        <span className="order-compact-number">{label}</span>
                        <span className="order-compact-date">
                          <FontAwesomeIcon icon={faClock} style={{ fontSize: 9 }} />
                          {dateText}
                        </span>
                      </div>
                    </div>

                    <div className="order-compact-card-right">
                      {isDraftStatus(item?.status) ? (
                        <span className="order-badge draft">
                          <Translate>Draft</Translate>
                        </span>
                      ) : (
                        <span className="order-badge submitted">
                          <Translate>{item?.status || 'Submitted'}</Translate>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right side: prescription-level actions */}
        <div className="order-actions-section">
          <div className="order-actions-buttons">
            <MyButton loading={isLoadingPrescriptions} disabled={edit}>
              <Translate>Validate with Gallon Reasoner</Translate>
            </MyButton>

            <MyButton
              onClick={handleNewPrescriptionAndAddMedication}
              prefixIcon={() => <PlusIcon />}
              loading={isLoadingPrescriptions || isLoadingCreateOrGet}
              disabled={edit || isNurse}
            >
              Add Medication
            </MyButton>

            <MyButton
              prefixIcon={() => <BlockIcon />}
              onClick={() => {
                if (!selectedRows.length && patientPrescriptionMedicationObject?.id) {
                  setSelectedRows([patientPrescriptionMedicationObject]);
                }
                setOpenCancellation(true);
              }}
              disabled={(!selectedRows.length && !patientPrescriptionMedicationObject?.id) || edit}
            >
              Cancel
            </MyButton>

            <MyButton
              loading={isLoadingPrescriptions}
              onClick={() => setSummaryModalOpen(true)}
              disabled={edit || !currentPrescription || currentPrescription?.status === 'SUBMITTED'}
              prefixIcon={() => <CheckIcon />}
            >
              Sign & Submit Order
            </MyButton>

            {isSubmitted && (
              <>
                {/* Resend and Refresh Status are shown only to users allowed to change the submitted prescription;
                    Resend lights up when the prescription changed after it was last sent to the pharmacy. */}
                {!edit && (
                  <>
                    <MyButton
                      prefixIcon={() => <ReloadIcon />}
                      onClick={handleResendToNahdi}
                      loading={isResending}
                      disabled={isResending || !hasUnsentChanges}
                      appearance={hasUnsentChanges ? 'primary' : 'ghost'}
                      backgroundColor={hasUnsentChanges ? 'var(--primary-orange)' : undefined}
                      color={hasUnsentChanges ? undefined : 'var(--primary-gray)'}
                    >
                      <Translate>Resend to Pharmacy</Translate>
                    </MyButton>
                    {/* Re-checks which medications the pharmacy dispensed (also checked automatically on open). */}
                    <MyButton
                      appearance="ghost"
                      onClick={handleRefreshDispensingStatus}
                      loading={isRefreshingDispensing}
                      disabled={isRefreshingDispensing}
                    >
                      <Translate>Refresh Status</Translate>
                    </MyButton>
                  </>
                )}
              </>
            )}

            <PrescriptionReportButton
              prescriptionId={currentPrescription?.id}
              disabled={!currentPrescription?.id || currentPrescription?.status !== 'SUBMITTED'}
            />
          </div>

          {/* Pharmacy status on its own line under the buttons. */}
          {isSubmitted && (
            <div className="order-status-row">
              <PharmacySendStatus status={nahdiSyncStatus} />
              {!edit && hasUnsentChanges && (
                <span style={{ color: 'var(--primary-orange)', fontWeight: 600 }}>
                  ● <Translate>Unsent changes</Translate>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionToolbar;
