import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown, Form, Popover, Whisper } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';

import {
  useGetEncountersByPatientQuery,
  useCancelEncounterMutation,
  useCompleteEncounterMutation,
  useReassignPractitionerMutation
} from '@/services/encounters/patientEncounterService';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRectangleXmark,
  faPowerOff,
  faCheckDouble,
  faFileInvoiceDollar,
  faEllipsisVertical,
  faUserDoctor
} from '@fortawesome/free-solid-svg-icons';

import { useDispatch } from 'react-redux';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';

import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import {
  useGetPractitionersBulkMutation,
  useGetPractitionersBySpecialityAndDepartmentQuery,
  useLazyGetPractitionerByIdQuery
} from '@/services/setup/practitioner/PractitionerService';
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
import { useLazyGetDepartmentByIdQuery } from '@/services/security/departmentService';
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
  const [openReassignModal, setOpenReassignModal] = useState(false);
  const [actionsMenuKey, setActionsMenuKey] = useState(0);
  const [reassignForm, setReassignForm] = useState<{ practitionerId?: number | null }>({
    practitionerId: null
  });
  const [reassignSpecialtyOverride, setReassignSpecialtyOverride] = useState<string>('');

  const [quickAppointmentModel, setQuickAppointmentModel] = useState(false);
  const [quickInitialStep, setQuickInitialStep] = useState<number>(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentViewOnly, setPaymentViewOnly] = useState(false);
  const [paymentConfirmLoading, setPaymentConfirmLoading] = useState(false);
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
  const [getPractitionerById] = useLazyGetPractitionerByIdQuery();
  const [getDepartmentById] = useLazyGetDepartmentByIdQuery();
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
  const [reassignPractitioner, { isLoading: isReassigning }] = useReassignPractitionerMutation();

  const reassignDepartmentId = selectedVisit?.departmentId
    ? Number(selectedVisit.departmentId)
    : null;
  const mappedCurrentPractitioner =
    selectedVisit?.practitionerId != null
      ? practitionersMap[String(selectedVisit.practitionerId)] ??
        practitionersMap[selectedVisit.practitionerId]
      : null;
  const reassignSpecialty = String(
    reassignSpecialtyOverride ||
      selectedVisit?.specialty ||
      mappedCurrentPractitioner?.specialty ||
      ''
  ).trim();
  const canLoadReassignPractitioners =
    openReassignModal && reassignDepartmentId != null && !!reassignSpecialty;

  const { data: practitionersBySpecialty, isFetching: isLoadingReassignPractitioners } =
    useGetPractitionersBySpecialityAndDepartmentQuery(
      {
        departmentId: reassignDepartmentId ?? 0,
        specialty: reassignSpecialty,
        page: 0,
        size: 200,
        sort: 'firstName,asc'
      },
      { skip: !canLoadReassignPractitioners }
    );

  const reassignPractitionerOptions = useMemo(() => {
    return (practitionersBySpecialty?.data ?? []).filter(
      (practitioner: Practitioner) =>
        practitioner?.id != null &&
        Number(practitioner.id) !== Number(selectedVisit?.practitionerId)
    );
  }, [practitionersBySpecialty?.data, selectedVisit?.practitionerId]);

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

  const closeActionsMenu = useCallback(() => {
    setActionsMenuKey(prev => prev + 1);
  }, []);

  const handleOpenReassign = useCallback(
    async (row: any) => {
      closeActionsMenu();
      setSelectedVisit(row);
      setReassignForm({ practitionerId: null });
      setReassignSpecialtyOverride('');
      setOpenReassignModal(true);

      const existingSpecialty = String(
        row?.specialty ||
          practitionersMap[String(row?.practitionerId)]?.specialty ||
          practitionersMap[row?.practitionerId]?.specialty ||
          ''
      ).trim();

      if (existingSpecialty || !row?.practitionerId) {
        if (existingSpecialty) setReassignSpecialtyOverride(existingSpecialty);
        return;
      }

      try {
        const practitioner = await getPractitionerById(row.practitionerId).unwrap();
        const specialty = String(practitioner?.specialty ?? '').trim();
        if (specialty) {
          setReassignSpecialtyOverride(specialty);
          setSelectedVisit((prev: any) =>
            prev?.id === row.id ? { ...prev, specialty } : prev
          );
        }
      } catch (err) {
        console.error('Failed to load practitioner specialty:', err);
      }
    },
    [closeActionsMenu, getPractitionerById, practitionersMap]
  );

  const handleCloseReassign = useCallback((open: boolean) => {
    setOpenReassignModal(open);
    if (!open) {
      setReassignForm({ practitionerId: null });
      setReassignSpecialtyOverride('');
    }
  }, []);

  const handleReassignPractitioner = async () => {
    if (!selectedVisit?.id) return;

    const practitionerId = Number(reassignForm.practitionerId);
    if (!practitionerId) {
      dispatch(notify({ msg: 'Please select a practitioner', sev: 'warning' }));
      return;
    }

    if (Number(selectedVisit.practitionerId) === practitionerId) {
      dispatch(notify({ msg: 'Please select a different practitioner', sev: 'warning' }));
      return;
    }

    try {
      await reassignPractitioner({
        encounterId: selectedVisit.id,
        practitionerId
      }).unwrap();
      dispatch(notify({ msg: 'Practitioner reassigned successfully', sev: 'success' }));
      setOpenReassignModal(false);
      setReassignForm({ practitionerId: null });
      refetch();
    } catch (error) {
      dispatch(
        notify({
          msg: extractApiErrorMessage(error) || 'Failed to reassign practitioner',
          sev: 'error'
        })
      );
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
      Array.from(
        new Set(
          encounters
            .map((e: any) => e.departmentId)
            .filter((id: any) => id != null)
            .map((id: any) => Number(id))
        )
      ),
    [encounters]
  );

  const encounterIds = useMemo(
    () => encounters.map((e: any) => e.id).filter((id: any) => id != null),
    [encounters]
  );

  useEffect(() => {
    if (!practitionerIds.length) {
      setPractitionersMap(prev =>
        Object.keys(prev).length ? {} : prev
      );
      return;
    }

    const load = async () => {
      try {
        const practitioners =
          await getPractitionersBulk(practitionerIds).unwrap();

        const nextMap = Object.fromEntries(
          practitioners.map((p: Practitioner) => [
            String(p.id),
            p
          ])
        );

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
      } catch (err) {
        console.error('getPractitionersBulk error:', err);
      }
    };

    load();
  }, [practitionerIds, getPractitionersBulk]);

  useEffect(() => {
    if (!departmentIds.length) {
      setDepartmentsMap({});
      return;
    }

    const loadDepartments = async () => {
      try {
        const results = await Promise.all(
          departmentIds.map(id =>
            getDepartmentById(id).unwrap()
          )
        );

        const nextMap = Object.fromEntries(
          results.map((department: Department) => [
            String(department.id),
            department
          ])
        );

        setDepartmentsMap(nextMap);
      } catch (err) {
        console.error('getDepartmentById error:', err);
      }
    };

    loadDepartments();
  }, [departmentIds, getDepartmentById]);

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
        setPaymentConfirmLoading(false);
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
    const isNew = treatmentStatus === 'NEW';
    const isPendingPayment = treatmentStatus === 'PENDING_PAYMENT';
    const isWaitingTriage = treatmentStatus === 'WAITING_TRIAGE';
    const isCancelled = lifecycleStatus === 'CANCELLED';
    const isClosed = lifecycleStatus === 'CLOSED';

    const departmentType = departmentsMap[row.departmentId]?.type;

    const Radiology = departmentType === 'RADIOLOGY';
    const Laboratory = departmentType === 'LABORATORY';

    const canPay =
      !isCancelled &&
      !isClosed &&
      !isNew &&
      (isPendingPayment || (lifecycleStatus === 'OPEN' && treatmentStatus !== 'WAITING_TRIAGE'));

    const canCancel = (isNew || isPendingPayment || isWaitingTriage) && !row?.isObserved;
    const canComplete = Radiology || Laboratory;
    const canDischarge = false;
    const canReassignPractitioner = isNew || isPendingPayment;
    const hasVisibleActions =
      canPay || canComplete || canDischarge || canCancel || canReassignPractitioner;

    if (!hasVisibleActions) return null;

    const menu = (
      <Popover className="visit-history__actions-popover">
        <Dropdown.Menu>
          {canPay ? (
            <Dropdown.Item
              onClick={() => {
                closeActionsMenu();
                handleOpenPayment(row);
              }}
            >
              <div className="visit-history__dropdown-item">
                <FontAwesomeIcon icon={faFileInvoiceDollar} />
                <Translate>Payment</Translate>
              </div>
            </Dropdown.Item>
          ) : null}

          {canReassignPractitioner ? (
            <Dropdown.Item
              onClick={() => {
                void handleOpenReassign(row);
              }}
            >
              <div className="visit-history__dropdown-item">
                <FontAwesomeIcon icon={faUserDoctor} />
                <Translate>Re-assign Practitioner</Translate>
              </div>
            </Dropdown.Item>
          ) : null}

          {canComplete ? (
            <Dropdown.Item
              onClick={() => {
                closeActionsMenu();
                handleComplete(row);
              }}
            >
              <div className="visit-history__dropdown-item">
                <FontAwesomeIcon icon={faCheckDouble} />
                <Translate>Complete</Translate>
              </div>
            </Dropdown.Item>
          ) : null}

          {canDischarge ? (
            <Dropdown.Item
              onClick={() => {
                closeActionsMenu();
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
                closeActionsMenu();
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
        key={`${row.id}-${actionsMenuKey}`}
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
        render: (row: any) => {
          const department = departmentsMap[String(row.departmentId)];

          return department?.name || row?.department?.name || '-';
        }
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
      actionsMenuKey,
      closeActionsMenu,
      handleComplete,
      handleOpenPayment,
      handleOpenReassign
    ]
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';
  const currentPractitionerName = mappedCurrentPractitioner
    ? `${mappedCurrentPractitioner.firstName} ${mappedCurrentPractitioner.lastName ?? ''}`.trim()
    : '-';

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

        <MyModal
          open={openReassignModal}
          setOpen={handleCloseReassign}
          title="Re-assign Practitioner"
          size="sm"
          actionButtonLabel="Re-assign"
          actionButtonFunction={handleReassignPractitioner}
          actionButtonLoading={isReassigning}
          isDisabledActionBtn={
            isReassigning || !reassignForm.practitionerId || isLoadingReassignPractitioners
          }
          content={
            <Form fluid>
              <p style={{ marginBottom: 12 }}>
                <Translate>Current Practitioner</Translate>: {currentPractitionerName}
              </p>
              <MyInput
                required
                column
                fieldType="select"
                fieldLabel="New Practitioner"
                fieldName="practitionerId"
                selectData={reassignPractitionerOptions}
                selectDataLabel={['firstName', 'lastName']}
                selectDataValue="id"
                record={reassignForm}
                setRecord={setReassignForm}
                searchable
                loading={isLoadingReassignPractitioners}
                disabled={!canLoadReassignPractitioners || isLoadingReassignPractitioners}
                placeholder={
                  !reassignDepartmentId
                    ? 'Encounter department is missing'
                    : !reassignSpecialty
                      ? 'Encounter specialty is missing'
                      : isLoadingReassignPractitioners
                        ? 'Loading practitioners...'
                        : reassignPractitionerOptions.length
                          ? 'Select practitioner'
                          : 'No other practitioners found'
                }
              />
            </Form>
          }
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
          actionButtonLoading={paymentConfirmLoading}
          isDisabledActionBtn={paymentConfirmLoading}
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
                onConfirmingChange={setPaymentConfirmLoading}
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
