import React, { useEffect, useState, useMemo, useRef } from "react";
import { Divider, Form } from "rsuite";
import "../styles.less";
import PageIcon from '@rsuite/icons/Page';
import { faSackDollar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  useCancelAppointmentMutation,
  useCheckInAppointmentMutation,
  useConfirmAppointmentMutation,
  useNoShowAppointmentMutation
} from "@/services/appointment/appointmentService";
import { notify } from "@/utils/uiReducerActions";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import MyInput from "@/components/MyInput";
import {
  useGetEncountersByAppointmentQuery,
  useLazyGetEncountersByAppointmentQuery,
  useLazyGetEncounterByIdQuery
} from "@/services/encounters/patientEncounterService";
import type { PatientEncounter } from "@/types/model-types-new";
import { useGetPatientByIdQuery } from "@/services/patient/patientService";
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { calculateAgeFormat } from "@/utils";
import MyModal from "@/components/MyModal/MyModal";
import MyButton from "@/components/MyButton/MyButton";
import { faClock } from '@fortawesome/free-solid-svg-icons';
import PatientPaymentInfo, { PatientPaymentInfoHandle } from '@/pages/patient/patient-profile/PatientQuickAppoinment/PatientPaymentInfo';
import { newPatientPayments, newPatientInsurance } from '@/types/model-types-constructor-new';
import AppointmentLogsModal from "./AppointmentLogsModal";
import CompletePatientProfileBeforeCheckInModal from "./CompletePatientProfileBeforeCheckInModal";
import { ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  useBulkUpdateAppointmentPolicyAssignmentsAppliedMutation,
  useGetAppointmentPolicyAssignmentsByAppointmentIdQuery
} from "@/services/appointment/appointmentPolicyAssignment/appointmentPolicyAssignmentService";
import type { AppointmentPolicyAssignmentAppliedUpdateDTO } from "@/types/model-types-new";

const buildPaymentDraft = (patientId: number, encounterId: number) => ({
  ...newPatientPayments,
  patientId,
  encounterId,
  useBalanceToSettleDebts: false,
  dept: 0
});

const buildInsuranceDraft = () => ({
  ...newPatientInsurance,
  payorName: '',
  planName: ''
});

const AppointmentActionsModal = ({ isActionsModalOpen, onActionsModalClose, appointment, onStatusChange, editAppointment, viewAppointment }) => {
    const [cancelAppointment] = useCancelAppointmentMutation();
    const [noShowAppointment] = useNoShowAppointmentMutation();
    const [confirmAppointment] = useConfirmAppointmentMutation();
    const [checkInAppointment] = useCheckInAppointmentMutation();
    const dispatch = useAppDispatch();
    const authSlice = useAppSelector(state => state.auth);
    const [localAppointmentData, setLocalAppoitmentData] = useState(appointment)
    const [resonType, setResonType] = useState(null)
    const { data: noShowResonLovQueryResponse } = useGetLovValuesByCodeQuery('APP_NOSHOW_REASON');
    const { data: cancelResonLovQueryResponse } = useGetLovValuesByCodeQuery('APP_CANCEL_REASON');
    const [reasonKey, setResonKey] = useState<any>(null)
    const [openAppointmentLogsModal, setOpenAppointmentLogsModal] = useState<boolean>(false);
    const [policySettingsModalOpen, setPolicySettingsModalOpen] = useState(false);
    const [completeProfileModalOpen, setCompleteProfileModalOpen] = useState(false);
    const [profileCompletedForCheckIn, setProfileCompletedForCheckIn] = useState(false);
    const [policyAppliedDraft, setPolicyAppliedDraft] = useState<Record<number, boolean>>({});
    const [isSavingPolicies, setIsSavingPolicies] = useState(false);
    const mode = useAppSelector((state: any) => state.ui.mode);
    const isDark = mode === 'dark';
    const [otherReason, setOtherReason] = useState<any>(null)
    const reasonOptions = useMemo(
      () => (resonType === 'Cancel' ? cancelResonLovQueryResponse?.object : noShowResonLovQueryResponse?.object) ?? [],
      [resonType, cancelResonLovQueryResponse?.object, noShowResonLovQueryResponse?.object]
    );
    const selectedReasonValue = useMemo(() => {
      if (!reasonKey) return '';
      if (typeof reasonKey === 'string' || typeof reasonKey === 'number') return String(reasonKey);
      return String(reasonKey?.reasonLkey ?? reasonKey?.key ?? '');
    }, [reasonKey]);
    const selectedReasonText = useMemo(
      () => {
        const direct =
          reasonKey?.lovDisplayVale ||
          reasonKey?.lovDisplayValue ||
          reasonKey?.label ||
          '';
        if (String(direct).trim()) return String(direct).trim();
        if (!selectedReasonValue) return '';
        const matched = (reasonOptions ?? []).find((opt: any) => String(opt?.key ?? '') === selectedReasonValue);
        return String(matched?.lovDisplayVale || matched?.lovDisplayValue || '').trim();
      },
      [reasonKey, selectedReasonValue, reasonOptions]
    );
    const hasOtherReasonText = useMemo(
      () => String(otherReason?.otherReason || '').trim().length > 0,
      [otherReason]
    );
    const [bulkUpdateAppointmentPolicyAssignmentsApplied] =
      useBulkUpdateAppointmentPolicyAssignmentsAppliedMutation();
    const [getEncounterByAppointment] = useLazyGetEncountersByAppointmentQuery();
    const [getEncounterById] = useLazyGetEncounterByIdQuery();
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [createdEncounter, setCreatedEncounter] = useState<PatientEncounter | null>(null);
    const paymentRef = useRef<PatientPaymentInfoHandle | null>(null);
    const paymentContextKeyRef = useRef<string>('');
    const appointmentPatientId = useMemo(() => {
      const appointmentData: any = appointment?.appointmentData || localAppointmentData || {};
      const patientRaw = appointmentData?.patient;
      const candidate =
        (typeof patientRaw === 'object' ? patientRaw?.id ?? patientRaw?.key : patientRaw) ??
        appointmentData?.patientId ??
        null;
      const parsed = Number(candidate);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }, [appointment?.appointmentData, localAppointmentData]);
    const { data: fetchedPatientById, isFetching: isFetchingPatient } = useGetPatientByIdQuery(
      { id: appointmentPatientId as number },
      { skip: !isActionsModalOpen || !appointmentPatientId, refetchOnMountOrArgChange: true }
    );
    const resolvedPatient: any =
      fetchedPatientById ||
      ((appointment?.appointmentData || localAppointmentData)?.patient ?? null);

    const isPatientProfileIncomplete = useMemo(() => {
      if (profileCompletedForCheckIn) return false;
      if (!appointmentPatientId) return false;

      const patientRecord = fetchedPatientById ?? resolvedPatient;
      if (!patientRecord) return false;

      return patientRecord?.isCompletedPatient !== true;
    }, [
      profileCompletedForCheckIn,
      appointmentPatientId,
      fetchedPatientById,
      resolvedPatient
    ]);
    
    const [paymentDraft, setPaymentDraft] = useState<any>(() => buildPaymentDraft(0, 0));
    const [patientInsuranceDraft, setPatientInsuranceDraft] = useState<any>(() => buildInsuranceDraft());

    // Get current logged-in facility from localStorage or auth slice
     const extractErrorMessage = (response: any): string => {
    try {
      const msg = response?.data?.message;
      if (typeof msg === 'string') {
        return msg.replace(/^error\./i, '');
      }
      return '';
    } catch {
      return '';
    }
  };
    const currentLoggedInFacility = useMemo(() => {
        // Try to get from auth slice first
        if (authSlice?.tenant?.selectedFacility) {
            return authSlice.tenant.selectedFacility;
        }
        
        // Fallback to localStorage
        try {
            const raw = localStorage.getItem('tenant');
            if (raw) {
                const tenant = JSON.parse(raw);
                if (tenant?.selectedFacility) {
                    return tenant.selectedFacility;
                }
            }
        } catch (e) {
            // Error parsing tenant from localStorage
        }
        
        return null;
    }, [authSlice?.tenant?.selectedFacility]);

    const getAppointmentId = () =>
      Number(localAppointmentData?.id || localAppointmentData?.key || appointment?.appointmentData?.id || appointment?.appointmentData?.key || 0);

    const appointmentId = useMemo(() => {
      const appointmentData = appointment?.appointmentData || localAppointmentData;
      return Number(appointmentData?.key || appointmentData?.id || 0);
    }, [appointment?.appointmentData, localAppointmentData]);

    useEffect(() => {
      setProfileCompletedForCheckIn(false);
    }, [appointmentPatientId, appointmentId, isActionsModalOpen]);

    const normalizeStatus = (value: any) => String(value ?? '').replace(/[-_\s]/g, '').toUpperCase();
    // Always prefer the latest clicked appointment payload from props to avoid stale local state.
    const statusValue =
      appointment?.appointmentData?.status ||
      appointment?.appointmentData?.appointmentStatus ||
      localAppointmentData?.status ||
      localAppointmentData?.appointmentStatus;
    const currentStatus = normalizeStatus(statusValue);
    const requireConfirmation = Boolean(
      appointment?.appointmentData?.requireConfirmation ??
      localAppointmentData?.requireConfirmation
    );
    const isDirectReasonStatus =
      currentStatus === 'CANCELED' ||
      currentStatus === 'CANCELLED' ||
      currentStatus === 'NOSHOW';
    /** Appointment is in a terminal state where only View should be available (no cancel/no-show/edit). */
    const isViewOnlyActionsStatus =
      currentStatus === 'COMPLETED' ||
      currentStatus === 'INSERVICE' ||
      currentStatus === 'CHECKEDIN';
    const isCheckInEligibleStatus =
      currentStatus === 'BOOKED' ||
      currentStatus === 'CONFIRMED';
    const canCheckIn =
      !isViewOnlyActionsStatus &&
      isCheckInEligibleStatus &&
      (!requireConfirmation || currentStatus === 'CONFIRMED');
    const isReasonViewOnly =
      Boolean(resonType) && (isDirectReasonStatus || isViewOnlyActionsStatus);

    // Fetch policies for the selected appointment
    const { data: appointmentPolicyAssignments = [] } =
      useGetAppointmentPolicyAssignmentsByAppointmentIdQuery(appointmentId, {
        skip: !appointmentId || !isActionsModalOpen
      });

    const getPolicyParts = (policyAssignment: any) => {
      const code = policyAssignment?.policyCode ?? '';
      const name = policyAssignment?.policyName ?? '';

      if (code || name) {
        return {
          code: code || '-',
          name: name || code || `Policy #${policyAssignment?.policyId ?? '-'}`
        };
      }

      return {
        code: '-',
        name: `Policy #${policyAssignment?.policyId ?? '-'}`
      };
    };

    const buildPolicyAppliedDraft = (policies: any[]) =>
      policies.reduce<Record<number, boolean>>((acc, policyAssignment) => {
        const id = Number(policyAssignment?.id);
        if (Number.isFinite(id) && id > 0) {
          acc[id] = Boolean(policyAssignment?.isApplied);
        }
        return acc;
      }, {});

    const openPolicySettingsModal = (policies: any[]) => {
      setPolicyAppliedDraft(buildPolicyAppliedDraft(policies));
      setPolicySettingsModalOpen(true);
    };

    const performCheckIn = async () => {
      const id = getAppointmentId();
      if (!id) {
        dispatch(notify({ msg: 'Invalid appointment id', sev: 'warning' }));
        return;
      }

      try {
        await checkInAppointment({ id }).unwrap();
        try {
          const encounterByAppointment = await getEncounterByAppointment({ appointmentId: id }).unwrap();
          if (typeof encounterByAppointment === 'string' && !isNaN(Number(encounterByAppointment))) {
            const encounterId = Number(encounterByAppointment);
            const fullEncounter = await getEncounterById({ id: encounterId }).unwrap();
            setCreatedEncounter(fullEncounter as PatientEncounter);
          } else if (encounterByAppointment && typeof encounterByAppointment === 'object') {
            setCreatedEncounter(encounterByAppointment as unknown as PatientEncounter);
          }
        } catch {
          // keep modal flow; encounter may still be available by background query.
        }
        setLocalAppoitmentData((prev: any) => ({
          ...prev,
          appointmentStatus: 'CHECKEDIN',
          status: 'CHECKEDIN'
        }));
        dispatch(notify({ msg: 'Appointment Checked-In and Encounter Created  Successfully', sev: 'success' }));
        onStatusChange();
      } catch (error: any) {
        const errorMsg = extractErrorMessage(error) || 'Save Failed';
        dispatch(notify({ msg: errorMsg, sev: 'warning' }));
      }
    };

    /** Policies modal (if any), then check-in API. */
    const proceedWithCheckIn = async () => {
      if (appointmentPolicyAssignments.length > 0) {
        openPolicySettingsModal(appointmentPolicyAssignments);
        return;
      }
      await performCheckIn();
    };

    /**
     * Full check-in pipeline: validate appointment → ensure patient profile is complete
     * → policies (if assigned) → check-in.
     */
    const runCheckInFlow = async (options?: { skipProfileCompletionCheck?: boolean }) => {
      const id = getAppointmentId();
      if (!id) {
        dispatch(notify({ msg: 'Invalid appointment id', sev: 'warning' }));
        return;
      }
      if (currentStatus == 'CHECKEDIN') {
        dispatch(notify({ msg: 'Appointment already checked in', sev: 'warning' }));
        return;
      }
      if (!isCheckInEligibleStatus) {
        dispatch(notify({ msg: 'Only booked or confirmed appointments can be checked in', sev: 'warning' }));
        return;
      }
      if (requireConfirmation && currentStatus !== 'CONFIRMED') {
        dispatch(notify({ msg: 'Appointment requires confirmation before check-in', sev: 'warning' }));
        return;
      }
      if (!appointmentPatientId) {
        dispatch(notify({ msg: 'Please assign a patient before check-in', sev: 'warning' }));
        return;
      }

      const shouldCheckProfile = !options?.skipProfileCompletionCheck;

      if (shouldCheckProfile && isFetchingPatient) {
        dispatch(notify({ msg: 'Loading patient profile, please try again', sev: 'warning' }));
        return;
      }

      if (shouldCheckProfile && isPatientProfileIncomplete) {
        setCompleteProfileModalOpen(true);
        return;
      }

      await proceedWithCheckIn();
    };

    const handleCheckIn = async () => {
      await runCheckInFlow();
    };

    const handleProfileCompletedAndContinueCheckIn = async () => {
      setProfileCompletedForCheckIn(true);
      setCompleteProfileModalOpen(false);
      await runCheckInFlow({ skipProfileCompletionCheck: true });
    };

    const handleSavePolicySettings = async () => {
      const updates: AppointmentPolicyAssignmentAppliedUpdateDTO[] = appointmentPolicyAssignments
        .map((policyAssignment: any) => {
          const id = Number(policyAssignment?.id);
          if (!Number.isFinite(id) || id <= 0) return null;
          return {
            id,
            isApplied: Boolean(policyAppliedDraft[id])
          };
        })
        .filter(Boolean) as AppointmentPolicyAssignmentAppliedUpdateDTO[];

      if (updates.length === 0) {
        dispatch(notify({ msg: 'No policies to save', sev: 'warning' }));
        return;
      }

      setIsSavingPolicies(true);
      try {
        await bulkUpdateAppointmentPolicyAssignmentsApplied({ updates }).unwrap();
        dispatch(notify({ msg: 'Policy settings saved successfully', sev: 'success' }));
        setPolicySettingsModalOpen(false);
        await performCheckIn();
      } catch (error: any) {
        const errorMsg = extractErrorMessage(error) || 'Failed to save policy settings';
        dispatch(notify({ msg: errorMsg, sev: 'warning' }));
      } finally {
        setIsSavingPolicies(false);
      }
    };
  

    // Keep original label for title and use normalized value for business rules
    const currentAppointmentStatus = statusValue;
    const modalPatientTitle = useMemo(() => {
      const appointmentData: any = appointment?.appointmentData || localAppointmentData || {};
      const patient: any = resolvedPatient || appointmentData?.patient || {};
      const patientName =
        [
          patient?.firstName,
          patient?.secondName,
          patient?.thirdName,
          patient?.lastName
        ]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        patient?.fullName ||
        patient?.name ||
        appointmentData?.patientName ||
        appointment?.title ||
        'Unknown Patient';
      const mrn =
        patient?.medicalRecordNumber ||
        '';

      return mrn ? `${patientName} (${mrn})` : patientName;
    }, [localAppointmentData, appointment?.appointmentData, appointment?.title, resolvedPatient]);

    // Fetch encounter for the selected appointment
    const { data: encounterByAppointmentResponse } = useGetEncountersByAppointmentQuery(
        { appointmentId: appointmentId },
        { 
            skip: !appointmentId || !isActionsModalOpen,
            pollingInterval: isActionsModalOpen ? 5000 : 0,
            refetchOnMountOrArgChange: true
        }
    );

    const resetPaymentState = (patientId = 0, encounterId = 0) => {
      setPaymentDraft(buildPaymentDraft(patientId, encounterId));
      setPatientInsuranceDraft(buildInsuranceDraft());
    };

    useEffect(() => {
        if (appointment) {
            setLocalAppoitmentData(appointment.appointmentData);
            // Reset reason modal state when switching to another appointment.
            setResonType(null);
            setResonKey(null);
            setOtherReason(null);
            setPolicySettingsModalOpen(false);
            setPolicyAppliedDraft({});
            setPaymentModalOpen(false);
            // setCreatedEncounter(null);
            resetPaymentState();
        }
    }, [appointment]);

    useEffect(() => {
      const contextKey = String(appointmentId || '');
      if (!contextKey) return;
      if (paymentContextKeyRef.current === contextKey) return;
      paymentContextKeyRef.current = contextKey;
      setPaymentModalOpen(false);
      setCreatedEncounter(null);
      resetPaymentState();
    }, [appointmentId]);

    useEffect(() => {
      if (!isActionsModalOpen) {
        paymentContextKeyRef.current = '';
        setPaymentModalOpen(false);
        resetPaymentState();
      }
    }, [isActionsModalOpen]);

    useEffect(() => {
      if (!isActionsModalOpen || !isDirectReasonStatus) return;
      const isNoShow = currentStatus === 'NOSHOW';
      setResonType(isNoShow ? 'No-show' : 'Cancel');
      const existingReason =
        (isNoShow ? localAppointmentData?.noShowReason : localAppointmentData?.cancelReason) ||
        localAppointmentData?.otherReason ||
        localAppointmentData?.reason ||
        '';
      setOtherReason({ otherReason: String(existingReason) });
      setResonKey(null);
    }, [isActionsModalOpen, isDirectReasonStatus, currentStatus, localAppointmentData]);

    useEffect(() => {
      if (!resonType) return;
      if (selectedReasonValue) {
        setOtherReason({ otherReason: selectedReasonText });
      } else {
        setOtherReason({ otherReason: '' });
      }
    }, [selectedReasonValue, selectedReasonText, resonType]);

    useEffect(() => {
        if (!isActionsModalOpen) return;
        // Debug: inspect appointment payload when opening actions modal
        // eslint-disable-next-line no-console
    }, [isActionsModalOpen, appointment]);

    // Set encounter when fetched for selected appointment
    useEffect(() => {
        const hydrateEncounter = async () => {
            if (!encounterByAppointmentResponse) return;
            const encounterRef = encounterByAppointmentResponse as any;
            if (typeof encounterRef === 'string' && !isNaN(Number(encounterRef))) {
                try {
                    const fullEncounter = await getEncounterById({ id: Number(encounterRef) }).unwrap();
                    setCreatedEncounter(fullEncounter as PatientEncounter);
                } catch {
                    setCreatedEncounter(null);
                }
                return;
            }
            if (typeof encounterRef === 'object' && encounterRef !== null) {
                setCreatedEncounter(encounterRef as PatientEncounter);
                return;
            }
            setCreatedEncounter(null);
        };
        void hydrateEncounter();
    }, [encounterByAppointmentResponse, getEncounterById]);

    useEffect(() => {
        if (localAppointmentData) {
            // Handle local appointment data if needed
        }
    }, [localAppointmentData]);

    const handleConfirm = async () => {
        try {
            const id = getAppointmentId();
            if (!id) {
              dispatch(notify({ msg: 'Invalid appointment id', sev: 'warning' }));
              return;
            }
            
             // Then, confirm the appointment
            await confirmAppointment({ id }).unwrap();

            // Immediately load encounter generated/linked for this appointment
            try {
              const encounterByAppointment = await getEncounterByAppointment({ appointmentId: id }).unwrap();
              if (typeof encounterByAppointment === 'string' && !isNaN(Number(encounterByAppointment))) {
                const encounterId = Number(encounterByAppointment);
                const fullEncounter = await getEncounterById({ id: encounterId }).unwrap();
                setCreatedEncounter(fullEncounter as PatientEncounter);
              } else if (encounterByAppointment && typeof encounterByAppointment === 'object') {
                setCreatedEncounter(encounterByAppointment as unknown as PatientEncounter);
              }
            } catch {
              // Keep existing flow; background query/effect may still populate createdEncounter.
            }
            
            // Update local appointment data to reflect confirmed status
            setLocalAppoitmentData(prev => ({
                ...prev,
                appointmentStatus: "CONFIRMED",
                status: "CONFIRMED"
            }));
            
            dispatch(notify({ msg: 'Appointment Confirmed Successfully', sev: 'success' }));
            onActionsModalClose();
            await onStatusChange?.();
        } catch (error: any) {
            // Extract error message from API response
             const errorMsg = extractErrorMessage(error) || 'Save Failed';
             dispatch(notify({ msg: errorMsg, sev: 'warning' }));
        }
    }
    const normalizeEncounterStatus = (value: any) => String(value ?? '').replace(/[-_\s]/g, '').toUpperCase();
    const isEncounterPendingPayment = normalizeEncounterStatus((createdEncounter as any)?.status) === 'PENDINGPAYMENT';
    const canOpenAddPayment = currentStatus === 'CHECKEDIN' && isEncounterPendingPayment;
    const loadEncounterByAppointmentId = async (id: number) => {
        const encounterByAppointment = await getEncounterByAppointment({ appointmentId: id }).unwrap();
        if (typeof encounterByAppointment === 'string' && !isNaN(Number(encounterByAppointment))) {
            const encounterId = Number(encounterByAppointment);
            const fullEncounter = await getEncounterById({ id: encounterId }).unwrap();
            setCreatedEncounter(fullEncounter as PatientEncounter);
            return fullEncounter as PatientEncounter;
        }
        if (encounterByAppointment && typeof encounterByAppointment === 'object') {
            setCreatedEncounter(encounterByAppointment as unknown as PatientEncounter);
            return encounterByAppointment as unknown as PatientEncounter;
        }
        return null;
    };
    const handleOpenPaymentModal = async () => {
        if (currentStatus !== 'CHECKEDIN') {
            dispatch(notify({ msg: 'Add payment is available only for checked-in appointments', sev: 'warning' }));
            return;
        }
        if (!isEncounterPendingPayment) {
            dispatch(notify({ msg: 'Add payment is allowed only when encounter status is Pending Payment', sev: 'warning' }));
            return;
        }
        const id = getAppointmentId();
        if (!id) {
            dispatch(notify({ msg: 'Invalid appointment id', sev: 'warning' }));
            return;
        }

        const encounter = await loadEncounterByAppointmentId(id).catch(() => null);
        if (!encounter) {
            dispatch(notify({ msg: 'No encounter found for this appointment', sev: 'warning' }));
            return;
        }

        const patientAny = resolvedPatient as any;
        const patientId = Number(
          patientAny?.id ??
            patientAny?.key ??
            localAppointmentData?.patient?.id ??
            localAppointmentData?.patient?.key ??
            appointmentPatientId ??
            0
        );
        const encounterId = Number((encounter as any)?.id ?? 0);

        resetPaymentState(patientId, encounterId);
        setPaymentModalOpen(true);
    };

    const handlePaymentConfirm = async () => {
        if (!paymentRef.current) return;
        try {
            const success = await paymentRef.current.confirm();
            if (success) {
                dispatch(notify({ msg: 'Payment confirmed successfully', sev: 'success' }));
                setPaymentModalOpen(false);
                resetPaymentState();
                onStatusChange();
            }
        } catch (error: any) {
            // Error handling is managed inside PatientPaymentInfo.
        }
    };

const handleNonShow = async () => {
  const id = getAppointmentId();
  if (!id) {
    dispatch(notify({ msg: 'Invalid appointment id', sev: 'warning' }));
    return;
  }
  const reasonText = String(selectedReasonText || otherReason?.otherReason || '').trim();
  if (!reasonText) {
    dispatch(notify({ msg: 'Please add no-show reason', sev: 'warning' }));
    return;
  }

  try {
    await noShowAppointment({ id, noShowReason: reasonText }).unwrap();
    dispatch(notify({ msg: 'Appointment Status has been changed Successfully', sev: 'success' }));
    setResonType(null);
    setOtherReason(null);
    setResonKey(null);
    onActionsModalClose();
    await onStatusChange?.();
  } catch (error: any) {
    const errorMsg = extractErrorMessage(error) || 'Save Failed';
        dispatch(notify({ msg: errorMsg, sev: 'warning' }));
    return;
  }
};


const handleCancel = async () => {
  const id = getAppointmentId();
  if (!id) {
    dispatch(notify({ msg: 'Invalid appointment id', sev: 'warning' }));
    return;
  }
  const reasonText = String(selectedReasonText || otherReason?.otherReason || '').trim();
  if (!reasonText) {
    dispatch(notify({ msg: 'Please add cancel reason', sev: 'warning' }));
    return;
  }

  try {
    await cancelAppointment({ id, cancelReason: reasonText }).unwrap();
    dispatch(notify({ msg: 'Appointment has been canceled Successfully', sev: 'success' }));
    setResonType(null);
    setOtherReason(null);
    setResonKey(null);
    onActionsModalClose();
    await onStatusChange?.();
  } catch (error: any) {
     const errorMsg = extractErrorMessage(error) || 'Save Failed';
        dispatch(notify({ msg: errorMsg, sev: 'warning' }));
    return;
  }
};
    // Appoinment Actions Modal Content
    const actionsModalContent = (
        <Form fluid layout="inline">
            <MyButton
              width="250px"
              disabled={!canCheckIn}
              onClick={handleCheckIn}
              color="cyan"
              appearance="primary"
            >
                Check-In
            </MyButton>
            <MyButton
              width="250px"
              disabled={currentStatus === "CONFIRMED" || isViewOnlyActionsStatus}
              onClick={handleConfirm}
              color="violet"
              appearance="primary"
            >
                Confirm
            </MyButton>
            <MyButton
              width="250px"
              disabled={!(currentStatus === 'BOOKED' || currentStatus === 'CONFIRMED')}
              onClick={() => editAppointment(appointment?.appointmentData || localAppointmentData)}
              color="violet"
              appearance="primary"
            >
                Reschedule
            </MyButton>
            <MyButton width="250px" onClick={() => viewAppointment(appointment?.appointmentData)} color="cyan" appearance="primary">
                View
            </MyButton>
            <MyButton
              width="250px"
              onClick={() => { setOpenAppointmentLogsModal(true) }}
              color="blue"
              // disabled={true}
              appearance="primary"
            >
                {/* No-show */}
                Show log
            </MyButton>
            <MyButton
              width="250px"
              disabled={["CANCELLED", "CONFIRMED"].includes(currentStatus) || isViewOnlyActionsStatus}
              onClick={() => { setResonType('Cancel') }}
              color="blue"
              appearance="primary"
            >
                Cancel
            </MyButton>
        </Form>
    );
    // Cancel/No-Show Modal Content
    const cancelModalContent = (
        <Form fluid layout="vertical">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 520, maxWidth: '100%' }}>
                <MyInput
                    width="100%"
                    column
                    fieldLabel="Reason"
                    fieldType="select"
                    fieldName="reasonLkey"
                    selectData={reasonOptions}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={reasonKey}
                    setRecord={setResonKey}
                    cleanable
                    disabled={isReasonViewOnly}
                            disableByField='isValid'

                />
             
            </div>
        </Form>
    );

    const policySettingsModalContent = (
        <div style={{ width: '100%', maxWidth: 520 }}>
            <div
                style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isDark ? '#f9fafb' : '#374151',
                    marginBottom: 10
                }}
            >
                Policies List
            </div>
            <div
                style={{
                    border: isDark ? '1px solid #3d3d3d' : '1px solid #e5e7eb',
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: isDark ? 'var(--extra-dark-black)' : '#fff'
                }}
            >
                {appointmentPolicyAssignments.map((policyAssignment: any, index: number) => {
                    const policy = getPolicyParts(policyAssignment);
                    const assignmentId = Number(policyAssignment?.id);
                    const applied = Boolean(policyAppliedDraft[assignmentId]);

                    return (
                        <div
                            key={`checkin-policy-${assignmentId || policyAssignment?.policyId || index}`}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '34px 120px 1fr auto 90px',
                                alignItems: 'center',
                                gap: 10,
                                minHeight: 46,
                                padding: '8px 12px',
                                borderBottom:
                                    index === appointmentPolicyAssignments.length - 1
                                        ? 'none'
                                        : isDark
                                            ? '1px solid #3d3d3d'
                                            : '1px solid #e5e7eb',
                                backgroundColor: isDark ? 'var(--extra-dark-black)' : '#fff'
                            }}
                        >
                            <div
                                style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isDark ? '#27272a' : '#f3f4f6',
                                    color: isDark ? '#d1d5db' : '#374151'
                                }}
                            >
                                <ShieldCheck size={16} />
                            </div>

                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: isDark ? '#f9fafb' : '#374151',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis'
                                }}
                                title={policy.code}
                            >
                                {policy.code}
                            </div>

                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: isDark ? '#f9fafb' : '#374151',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis'
                                }}
                                title={policy.name}
                            >
                                {policy.name}
                            </div>

                          <Form>
                            <MyInput
                                fieldName={`policy_${assignmentId}`}
                                fieldType="checkbox"
                                showLabel={false}
                                width={60}
                                record={{
                                    [`policy_${assignmentId}`]: applied
                                }}
                                setRecord={(updatedRecord: any) => {
                                    const checked = updatedRecord?.[`policy_${assignmentId}`];

                                    if (!Number.isFinite(assignmentId) || assignmentId <= 0) return;

                                    setPolicyAppliedDraft(prev => ({
                                        ...prev,
                                        [assignmentId]: checked
                                    }));
                                }}
                            />
                          </Form>

                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: applied ? '#059669' : isDark ? '#9ca3af' : '#6b7280',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {applied ? 'Applied' : 'Not Applied'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div>
            <MyModal
                open={isActionsModalOpen && !isDirectReasonStatus}
                setOpen={onActionsModalClose}
                title={modalPatientTitle}
                size="560px"
                bodyheight="50vh"
                position="center"
                content={actionsModalContent}
                hideBack={true}
                hideActionBtn={true}
                steps={[{
                    title: "Appoinment Actions", icon: <FontAwesomeIcon icon={faCalendarCheck} />,
                    footer: <>
                        <MyButton appearance="ghost" prefixIcon={() => <PageIcon />} disabled={true}>
                            Print Certificate
                        </MyButton>
                        <MyButton 
                            appearance="ghost" 
                            prefixIcon={() => <FontAwesomeIcon icon={faSackDollar} />}
                            disabled={!canOpenAddPayment}
                            onClick={handleOpenPaymentModal}
                        >
                            Add Payment
                        </MyButton>
                    </>
                }]}
            />
            <MyModal
                open={resonType}
                setOpen={setResonType}
                title={`${`Please add the Appointment ${resonType} Reason. `}`}
                size="38vw"
                bodyheight="50vh"
                position="center"
                content={cancelModalContent}
                actionButtonFunction={() => (resonType === 'Cancel' ? handleCancel() : handleNonShow())}
                hideActionBtn={isReasonViewOnly}
                isDisabledActionBtn={!(selectedReasonText || hasOtherReasonText)}
                steps={[{ title: "Reason", icon: <FontAwesomeIcon icon={faClock} /> }]}
            />
            
            {/* Payment Modal */}
            <MyModal
                open={paymentModalOpen}
                setOpen={(open: boolean) => {
                  setPaymentModalOpen(open);
                  if (!open) resetPaymentState();
                }}
                title="Add Payment"
                size="70vw"
                bodyheight="80vh"
                position="center"
                hideActionBtn={false}
                actionButtonLabel="Confirm Payment"
                actionButtonFunction={handlePaymentConfirm}
                content={
                    createdEncounter && resolvedPatient ? (
                        <PatientPaymentInfo
                            key={`appointment-payment-${appointmentId}-${Number((createdEncounter as any)?.id ?? 0)}`}
                            ref={paymentRef}
                            localPatient={resolvedPatient}
                            localEncounter={createdEncounter}
                            setLocalEncounter={setCreatedEncounter}
                            isReadOnly={false}
                            showInternalButtons={false}
                            payment={paymentDraft}
                            setPayment={setPaymentDraft}
                            patientInsurance={patientInsuranceDraft}
                            setPatientInsurance={setPatientInsuranceDraft}
                        />
                    ) : (
                        <div>Loading...</div>
                    )
                }
            />

            <MyModal
                open={policySettingsModalOpen}
                setOpen={setPolicySettingsModalOpen}
                title="Policy Settings"
                size="560px"
                bodyheight="auto"
                position="center"
                content={policySettingsModalContent}
                actionButtonLabel="Save"
                actionButtonFunction={handleSavePolicySettings}
                isDisabledActionBtn={isSavingPolicies}
                hideBack={true}
            />

            <CompletePatientProfileBeforeCheckInModal
              open={completeProfileModalOpen}
              setOpen={setCompleteProfileModalOpen}
              patientId={appointmentPatientId}
              onCompleted={handleProfileCompletedAndContinueCheckIn}
            />

            <AppointmentLogsModal
            open={openAppointmentLogsModal}
            setOpen={setOpenAppointmentLogsModal}
            appointment={appointment}
            />
        </div>
    );
}
export default AppointmentActionsModal;
