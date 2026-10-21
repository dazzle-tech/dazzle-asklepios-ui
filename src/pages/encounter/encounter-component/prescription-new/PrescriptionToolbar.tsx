import React, { useMemo } from 'react';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaFilePrescription } from 'react-icons/fa6';
import PlusIcon from '@rsuite/icons/Plus';
import BlockIcon from '@rsuite/icons/Block';
import CheckIcon from '@rsuite/icons/Check';

import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { formatDateWithoutSeconds } from '@/utils';

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
};

const isDraftStatus = (status: any) => {
  const s = String(status ?? '').toUpperCase();
  return !s || s === 'DRAFT' || s === 'NEW';
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
  handleNewPrescriptionAndAddMedication
}: Props) => {
  const isSubmitted = String(currentPrescription?.status ?? '').toUpperCase() === 'SUBMITTED';

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
            <span className="orders-list-count-badge">{displayedPrescriptions.length}</span>
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
              disabled={edit || isNurse || isSubmitted}
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
              disabled={
                (!selectedRows.length && !patientPrescriptionMedicationObject?.id) ||
                edit ||
                isSubmitted
              }
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

            <PrescriptionReportButton
              prescriptionId={currentPrescription?.id}
              disabled={!currentPrescription?.id || currentPrescription?.status !== 'SUBMITTED'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionToolbar;
