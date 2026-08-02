import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown, Popover, Whisper } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';

import {
  useGetEncountersByPatientQuery,
  useCancelEncounterMutation,
  useCompleteEncounterMutation
} from '@/services/encounters/patientEncounterService';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRectangleXmark,
  faPowerOff,
  faCheckDouble,
  faFileInvoiceDollar,
  faEllipsisVertical
} from '@fortawesome/free-solid-svg-icons';

import { useDispatch } from 'react-redux';
import { notify } from '@/utils/uiReducerActions';

import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useGetPractitionersBulkMutation } from '@/services/setup/practitioner/PractitionerService';
import type { Practitioner, Department } from '@/types/model-types-new';
import PatientQuickAppointment from './PatientQuickAppoinment/PatientQuickAppointment';
import PatientPaymentInfo, {
  PatientPaymentInfoHandle
} from './PatientQuickAppoinment/PatientPaymentInfo';
import PaymentReceiptModal from './PatientQuickAppoinment/PaymentReceiptModal';
import type { PaymentReceiptData } from './PatientQuickAppoinment/paymentPreviewUtils';
import {
  newPatientInsurance,
  newPatientPayments
} from '@/types/model-types-constructor-new';
import { formatEnumString } from '@/utils';
import {
  getEncounterLifecycleStatus,
  getEncounterTreatmentStatus
} from '@/utils/encounterStatusHelpers';
import { useGetDepartmentsBulkMutation } from '@/services/security/departmentService';
import EncounterDischarge from '@/pages/encounter/encounter-component/encounter-discharge';
import { useLazyGetDiagnosisFlagsByEncounterIdsQuery } from '@/services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';
import './styles.less';

const EMPTY_ENCOUNTERS: any[] = [];

const PatientVisitHistoryTable = ({ localPatient, encounterRefetchTrigger }: any) => {
  const dispatch = useDispatch();
  const tooltipContainerRef = useRef<HTMLDivElement | null>(null);
  const getTooltipContainer = () => tooltipContainerRef.current || document.body;

  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openDischargeModal, setOpenDischargeModal] = useState(false);

  const [quickAppointmentModel, setQuickAppointmentModel] = useState(false);
  const [quickInitialStep, setQuickInitialStep] = useState<number>(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentViewOnly, setPaymentViewOnly] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<PaymentReceiptData | null>(null);
  const [paymentDraft, setPaymentDraft] = useState<any>({
    ...newPatientPayments,
    patientId: Number(localPatient?.id ?? localPatient?.key ?? 0),
    useBalanceToSettleDebts: false,
    dept: 0
  });
  const [patientInsuranceDraft, setPatientInsuranceDraft] = useState<any>({
    ...newPatientInsurance,
    payorName: '',
    planName: ''
  });
  const paymentInfoRef = useRef<PatientPaymentInfoHandle | null>(null);
  const [practitionersMap, setPractitionersMap] = useState<Record<number | string, Practitioner>>(
    {}
  );
  const [departmentsMap, setDepartmentsMap] = useState<Record<number | string, Department>>({});

  const [getPractitionersBulk] = useGetPractitionersBulkMutation();
  const [getDepartmentsBulk] = useGetDepartmentsBulkMutation();
  const [fetchDiagnosisFlags, { data: diagnosisFlags }] =
    useLazyGetDiagnosisFlagsByEncounterIdsQuery();

  const { data, isFetching, refetch } = useGetEncountersByPatientQuery(
    {
      patientId: localPatient?.id,
      page: 0,
      size: 50,
      sort: 'createdDate,desc'
    },
    {
      skip: !localPatient?.id,
      refetchOnMountOrArgChange: true,
      pollingInterval: 0
    }
  );

  const encounters = data?.data ?? EMPTY_ENCOUNTERS;

  const [cancelEncounter] = useCancelEncounterMutation();
  const [completeEncounter] = useCompleteEncounterMutation();

  useEffect(() => {
    if (encounterRefetchTrigger > 0) {
      refetch();
    }
  }, [encounterRefetchTrigger, refetch]);

  const handleCancel = async () => {
    if (!selectedVisit) return;

    try {
      await cancelEncounter({ id: selectedVisit.id }).unwrap();
      dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
      setOpenCancelModal(false);
      refetch();
    } catch (err: any) {
      const errorMap: Record<string, string> = {
        'error.cancel.notAllowed.rule': 'Cancellation is not allowed for the current encounter status.',
        'error.cancel.notAllowed.hasObservation': 'Cannot cancel encounter with observations'
      };

      const backendMessage = err?.data?.message;
      const msg = errorMap[backendMessage] || 'Error cancelling encounter';

      dispatch(notify({ msg, sev: 'error' }));
    }
  };

  const handleComplete = async (row: any) => {
    try {
      await completeEncounter({ id: row.id }).unwrap();
      dispatch(notify({ msg: 'Completed Successfully', sev: 'success' }));
      refetch();
    } catch (err: any) {
      const errorMap: Record<string, string> = {
        'error.complete.notAllowed': 'Cannot complete unless status is ONGOING or TRIAGE STARTED',
        'error.id.notfound': 'Encounter not found'
      };

      const backendMessage = err?.data?.message;
      const msg = errorMap[backendMessage] || 'Error completing encounter';

      dispatch(notify({ msg, sev: 'error' }));
    }
  };

  const handleEncounterSaved = async () => {
    await refetch();
  };

  const practitionerIds = useMemo(
    () =>
      Array.from(
        new Set(encounters.map((e: any) => e.practitionerId).filter((id: any) => id != null))
      ),
    [encounters]
  );

  const departmentIds = useMemo(
    () =>
      Array.from(new Set(encounters.map((e: any) => e.departmentId).filter((id: any) => id != null))),
    [encounters]
  );

  const encounterIds = useMemo(
    () => encounters.map((e: any) => e.id).filter((id: any) => id != null),
    [encounters]
  );

  useEffect(() => {
    if (!practitionerIds.length) {
      setPractitionersMap(prev => (Object.keys(prev).length ? {} : prev));
      return;
    }

    const load = async () => {
      try {
        const practitioners = await getPractitionersBulk(practitionerIds).unwrap();
        const nextMap = Object.fromEntries(practitioners.map((p: Practitioner) => [p.id, p]));

        setPractitionersMap(prev => {
          const prevKeys = Object.keys(prev);
          const nextKeys = Object.keys(nextMap);
          if (
            prevKeys.length === nextKeys.length &&
            prevKeys.every(key => prev[key] === nextMap[key])
          ) {
            return prev;
          }
          return nextMap;
        });
      } catch {}
    };

    load();
  }, [practitionerIds, getPractitionersBulk]);

  useEffect(() => {
    if (!departmentIds.length) {
      setDepartmentsMap(prev => (Object.keys(prev).length ? {} : prev));
      return;
    }

    const loadDepartments = async () => {
      try {
        const departments = await getDepartmentsBulk(departmentIds).unwrap();
        const nextMap = Object.fromEntries(departments.map((d: Department) => [d.id, d]));

        setDepartmentsMap(prev => {
          const prevKeys = Object.keys(prev);
          const nextKeys = Object.keys(nextMap);
          if (
            prevKeys.length === nextKeys.length &&
            prevKeys.every(key => prev[key] === nextMap[key])
          ) {
            return prev;
          }
          return nextMap;
        });
      } catch (err) {
        console.error('getDepartmentsBulk error:', err);
      }
    };

    loadDepartments();
  }, [departmentIds, getDepartmentsBulk]);

  useEffect(() => {
    if (!encounterIds.length) return;
    fetchDiagnosisFlags({ encounterIds });
  }, [encounterIds, fetchDiagnosisFlags]);

  const diagnosisMap = useMemo(() => {
    return Object.fromEntries(
      diagnosisFlags?.map((item: any) => [item.encounterId, item.hasPrimaryDiagnoses]) || []
    );
  }, [diagnosisFlags]);

  const handleCloseQuickAppointment = useCallback(
    (val: boolean) => {
      setQuickAppointmentModel(val);
      if (!val) refetch();
    },
    [refetch]
  );

  const handleOpenPayment = useCallback(
    (row: any) => {
      setSelectedVisit(row);
      setPaymentViewOnly(false);
      setPaymentDraft((previous: any) => ({
        ...previous,
        patientId: Number(localPatient?.id ?? localPatient?.key ?? 0),
        encounterId: row?.id ?? 0
      }));
      setPaymentModalOpen(true);
    },
    [localPatient?.id, localPatient?.key]
  );

  const handlePaymentConfirm = async () => {
    const ok = await paymentInfoRef.current?.confirm?.();
    if (!ok) return;

    await refetch();
    dispatch(
      notify({
        msg: 'Payment confirmed successfully',
        sev: 'success'
      })
    );
  };

  const handlePaymentModalSetOpen = useCallback(
    (open: boolean) => {
      setPaymentModalOpen(open);
      if (!open) {
        setPaymentViewOnly(false);
        setReceiptOpen(false);
        setReceiptData(null);
        paymentInfoRef.current?.clear?.();
        refetch();
      }
    },
    [refetch]
  );

  const handleReceiptReady = useCallback(
    (receipt: PaymentReceiptData) => {
      setReceiptData(receipt);
      setReceiptOpen(true);
    },
    []
  );

  const handleReceiptClose = useCallback(() => {
    setReceiptOpen(false);
    setReceiptData(null);
    handlePaymentModalSetOpen(false);
  }, [handlePaymentModalSetOpen]);

  const renderVisitActionsMenu = (row: any) => {
    const treatmentStatus = getEncounterTreatmentStatus(row);
    const lifecycleStatus = getEncounterLifecycleStatus(row);
    const isOngoing = treatmentStatus === 'ONGOING';
    const isNew = treatmentStatus === 'NEW';
    const isPendingPayment = treatmentStatus === 'PENDING_PAYMENT';
    const isCancelled = lifecycleStatus === 'CANCELLED';
    const isClosed = lifecycleStatus === 'CLOSED';

    const departmentType = departmentsMap[row.departmentId]?.type;
    const isOutpatient = departmentType === 'OUTPATIENT_CLINIC';
    const isEmergency =
      departmentType === 'EMERGENCY' || departmentType === 'EMERGENCY_ROOM';
    const Radiology = departmentType === 'RADIOLOGY';
    const Laboratory = departmentType === 'LABORATORY';
    const hasDiagnosis = diagnosisMap[row.id] ?? false;

    const canPay =
      !isCancelled &&
      !isClosed &&
      (isNew || isPendingPayment || lifecycleStatus === 'OPEN');

    const canCancel = isNew || isPendingPayment;
    const canComplete =
      (isOngoing && isOutpatient && hasDiagnosis) || Radiology || Laboratory;
    const canDischarge = isOngoing && isEmergency;

    const menu = (
      <Popover className="visit-history__actions-popover">
        <Dropdown.Menu>
          {canPay ? (
            <Dropdown.Item
              onClick={() => handleOpenPayment(row)}
            >
              <div className="visit-history__dropdown-item">
                <FontAwesomeIcon icon={faFileInvoiceDollar} />
                <Translate>Payment</Translate>
              </div>
            </Dropdown.Item>
          ) : null}

          {canComplete ? (
            <Dropdown.Item onClick={() => handleComplete(row)}>
              <div className="visit-history__dropdown-item">
                <FontAwesomeIcon icon={faCheckDouble} />
                <Translate>Complete</Translate>
              </div>
            </Dropdown.Item>
          ) : null}

          {canDischarge ? (
            <Dropdown.Item
              onClick={() => {
                setSelectedVisit(row);
                setOpenDischargeModal(true);
              }}
            >
              <div className="visit-history__dropdown-item">
                <FontAwesomeIcon icon={faPowerOff} />
                <Translate>Discharge</Translate>
              </div>
            </Dropdown.Item>
          ) : null}

          {canCancel ? (
            <Dropdown.Item
              onClick={() => {
                setSelectedVisit(row);
                setOpenCancelModal(true);
              }}
            >
              <div className="visit-history__dropdown-item visit-history__dropdown-item--danger">
                <FontAwesomeIcon icon={faRectangleXmark} />
                <Translate>Cancel Encounter</Translate>
              </div>
            </Dropdown.Item>
          ) : null}
        </Dropdown.Menu>
      </Popover>
    );

    return (
      <Whisper
        placement="leftStart"
        trigger="click"
        speaker={menu}
        container={getTooltipContainer}
      >
        <span className="visit-history__tooltip-trigger">
          <MyButton appearance="subtle" size="small">
            <FontAwesomeIcon icon={faEllipsisVertical} />
          </MyButton>
        </span>
      </Whisper>
    );
  };

  const columns = useMemo(
    () => [
      {
        key: 'key',
        title: <Translate>Key</Translate>,
        render: (row: any) => (
          <a
            className="visit-history__encounter-link"
            onClick={() => {
              setSelectedVisit(row);
              setQuickInitialStep(0);
              setQuickAppointmentModel(true);
            }}
          >
            {row.encounterNumber}
          </a>
        )
      },
      { key: 'encounterDate', title: <Translate>Date</Translate>, dataKey: 'encounterDate' },
      {
        key: 'department',
        title: <Translate>Department</Translate>,
        render: (row: any) => departmentsMap[row.departmentId]?.name ?? ''
      },
      {
        key: 'practitioner',
        title: <Translate>Practitioner</Translate>,
        render: (row: any) => {
          const p = practitionersMap[row.practitionerId];
          if (!p) return '';
          return `${p.firstName} ${p.lastName ?? ''}`.trim();
        }
      },
      {
        key: 'reason',
        title: <Translate>Reason</Translate>,
        render: (row: any) => formatEnumString(row.encounterReason)
      },
      {
        key: 'priority',
        title: <Translate>Priority</Translate>,
        render: (row: any) => formatEnumString(row.priorityLevel)
      },
      {
        key: 'encounterStatus',
        title: <Translate>Encounter Status</Translate>,
        render: (row: any) => formatEnumString(getEncounterLifecycleStatus(row) || '-')
      },
      {
        key: 'treatmentStatus',
        title: <Translate>Treatment Status</Translate>,
        render: (row: any) => formatEnumString(getEncounterTreatmentStatus(row))
      },
      {
        key: 'actions',
        title: <Translate>Actions</Translate>,
        width: 90,
        render: (row: any) => (
          <div className="visit-history__actions-form">
            {renderVisitActionsMenu(row)}
          </div>
        )
      }
    ],
    [
      departmentsMap,
      practitionersMap,
      diagnosisMap,
      handleComplete,
      handleOpenPayment
    ]
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';
  return (
    <div dir={dir}>
      <div ref={tooltipContainerRef} className="visit-history__wrapper">
        <MyTable
          data={encounters}
          columns={columns}
          loading={isFetching && encounters.length === 0}
          height={580}
        />

        <DeletionConfirmationModal
          open={openCancelModal}
          setOpen={setOpenCancelModal}
          actionButtonFunction={handleCancel}
          confirmationQuestion="Cancel this encounter?"
          actionButtonLabel="Cancel"
          cancelButtonLabel="Close"
        />

        <EncounterDischarge
          open={openDischargeModal}
          setOpen={setOpenDischargeModal}
          encounter={selectedVisit}
        />

        {quickAppointmentModel && (
          <PatientQuickAppointment
            quickAppointmentModel={quickAppointmentModel}
            setQuickAppointmentModel={handleCloseQuickAppointment}
            localPatient={localPatient}
            localVisit={selectedVisit}
            isDisabeld={quickInitialStep === 0}
            initialStep={quickInitialStep}
            onEncounterSaved={handleEncounterSaved}
          />
        )}

        <MyModal
          open={paymentModalOpen}
          setOpen={handlePaymentModalSetOpen}
          title={
            paymentViewOnly
              ? 'Payment Details'
              : 'Payment'
          }
          size="68vw"
          bodyheight="72vh"
          hideActionBtn={paymentViewOnly}
          enforceFocus={false}
          cancelButtonLabel="Close"
          actionButtonLabel="Confirm"
          actionButtonFunction={handlePaymentConfirm}
          handleCancelFunction={() => paymentInfoRef.current?.clear?.()}
          content={
            paymentModalOpen && selectedVisit ? (
              <PatientPaymentInfo
                ref={paymentInfoRef}
                localPatient={localPatient}
                localEncounter={selectedVisit}
                isReadOnly={paymentViewOnly}
                showInternalButtons={false}
                payment={paymentDraft}
                setPayment={setPaymentDraft}
                patientInsurance={patientInsuranceDraft}
                setPatientInsurance={setPatientInsuranceDraft}
                onPaymentSaved={handleEncounterSaved}
                onReceiptReady={handleReceiptReady}
                onReceiptClosed={handleReceiptClose}
                onViewOnlyChange={setPaymentViewOnly}
              />
            ) : null
          }
        />

        <PaymentReceiptModal
          open={receiptOpen}
          onClose={handleReceiptClose}
          receipt={receiptData}
          autoPrint
        />
      </div>
    </div>
  );
};

export default PatientVisitHistoryTable;