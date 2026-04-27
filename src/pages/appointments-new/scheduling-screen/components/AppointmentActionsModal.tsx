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
  useCreateEncounterMutation,
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
    const [createEncounter] = useCreateEncounterMutation();
    const [getEncounterByAppointment] = useLazyGetEncountersByAppointmentQuery();
    const [getEncounterById] = useLazyGetEncounterByIdQuery();
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [createdEncounter, setCreatedEncounter] = useState<PatientEncounter | null>(null);
    const paymentRef = useRef<PatientPaymentInfoHandle | null>(null);
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
    const { data: fetchedPatientById } = useGetPatientByIdQuery(
      { id: appointmentPatientId as number },
      { skip: !isActionsModalOpen || !appointmentPatientId }
    );
    const resolvedPatient: any =
      fetchedPatientById ||
      ((appointment?.appointmentData || localAppointmentData)?.patient ?? null);
    
    // Payment draft state
    const [paymentDraft, setPaymentDraft] = useState<any>({
        ...newPatientPayments,
        patientId: 0,
        encounterId: 0,
        useBalanceToSettleDebts: false,
        dept: 0
    });
    
    const [patientInsuranceDraft, setPatientInsuranceDraft] = useState<any>({
        ...newPatientInsurance,
        payorName: '',
        planName: ''
    });

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
    const normalizeStatus = (value: any) => String(value ?? '').replace(/[-_\s]/g, '').toUpperCase();
    // Always prefer the latest clicked appointment payload from props to avoid stale local state.
    const statusValue =
      appointment?.appointmentData?.status ||
      appointment?.appointmentData?.appointmentStatus ||
      localAppointmentData?.status ||
      localAppointmentData?.appointmentStatus;
    const currentStatus = normalizeStatus(statusValue);
    const isDirectReasonStatus =
      currentStatus === 'CANCELED' ||
      currentStatus === 'CANCELLED' ||
      currentStatus === 'NOSHOW';
    /** Appointment is in a terminal state where only View should be available (no cancel/no-show/edit). */
    const isViewOnlyActionsStatus =
      currentStatus === 'COMPLETED' ||
      currentStatus === 'INSERVICE' ||
      currentStatus === 'CHECKEDIN';
    const isReasonViewOnly =
      Boolean(resonType) && (isDirectReasonStatus || isViewOnlyActionsStatus);

    const handleCheckIn = async () => {
      const id = getAppointmentId();
      if (!id) {
        dispatch(notify({ msg: 'Invalid appointment id', sev: 'warning' }));
        return;
      }
      if (currentStatus == 'BOOKED') {
        dispatch(notify({ msg: 'Please confirm the appointment before check-in', sev: 'warning' }));
        return;
      }
      if (currentStatus == 'CHECKEDIN') {
        dispatch(notify({ msg: 'Appointment already checked in', sev: 'warning' }));
        return;
      }

      try {
        await checkInAppointment({ id }).unwrap();
        dispatch(notify({ msg: 'Appointment Checked-In and Encounter Created  Successfully', sev: 'success' }));
        onStatusChange();
        onActionsModalClose();
      } catch (error: any) {
         const errorMsg = extractErrorMessage(error) || 'Save Failed';
        dispatch(notify({ msg: errorMsg, sev: 'warning' }));
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

    // Get appointment ID for fetching encounter
    const appointmentId = useMemo(() => {
        const appointmentData = appointment?.appointmentData || localAppointmentData;
        return Number(appointmentData?.key || appointmentData?.id || 0);
    }, [appointment?.appointmentData, localAppointmentData]);

    // Fetch encounter for confirmed appointments
    const { data: encounterByAppointmentResponse } = useGetEncountersByAppointmentQuery(
        { appointmentId: appointmentId },
        { 
            skip: !appointmentId || !isActionsModalOpen || currentStatus !== "CONFIRMED"
        }
    );

    useEffect(() => {
        if (appointment) {
            setLocalAppoitmentData(appointment.appointmentData);
            // Reset reason modal state when switching to another appointment.
            setResonType(null);
            setResonKey(null);
            setOtherReason(null);
        }
    }, [appointment])

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

    // Set encounter when fetched for confirmed appointment
    useEffect(() => {
        if (encounterByAppointmentResponse && currentStatus === "CONFIRMED") {
            // The API returns a string (encounter ID), but we need the full encounter object
            // If it's just an ID string, we might need to fetch the full encounter
            // For now, we'll try to use it as is - if it's an ID, we'll need to handle it differently
            const encounterId = encounterByAppointmentResponse;
            
            // If the response is a string (ID), we'll need to construct a minimal encounter object
            // or fetch the full encounter. For now, let's assume the API might return the full object
            // despite the type saying string. We'll handle both cases.
            if (typeof encounterId === 'string' && !isNaN(Number(encounterId))) {
                // It's an ID string - construct a minimal encounter object with required fields
                // The payment component will use the encounter ID primarily
                const patientAny = localAppointmentData?.patient as any;
                const minimalEncounter: any = {
                    id: Number(encounterId),
                    patientId: Number(patientAny?.id ?? localAppointmentData?.patient?.key ?? 0),
                    facilityId: Number(localAppointmentData?.facilityKey || 0),
                    departmentId: Number(localAppointmentData?.departmentKey || localAppointmentData?.resourceKey || 0),
                    appointmentId: appointmentId,
                    encounterType: localAppointmentData?.resourceTypeLkey || 'CLINIC',
                    encounterReason: localAppointmentData?.visitTypeLkey || 'APPOINTMENT',
                    priorityLevel: 'NORMAL',
                    status: 'NEW',
                    encounterDate: new Date(),
                    hasPrescription: false,
                    hasOrder: false,
                    isObserved: false
                };
                setCreatedEncounter(minimalEncounter as PatientEncounter);
            } else if (typeof encounterId === 'object' && encounterId !== null) {
                // It's already an encounter object
                setCreatedEncounter(encounterId as PatientEncounter);
            }
        }
    }, [encounterByAppointmentResponse, currentStatus, localAppointmentData, appointmentId]);

    useEffect(() => {
        if (localAppointmentData) {
            // Handle local appointment data if needed
        }
    }, [localAppointmentData]);

    // Update payment draft when encounter is created or patient changes
    useEffect(() => {
        if (createdEncounter && resolvedPatient) {
            const patientAny = resolvedPatient as any;
            const patientId = Number(patientAny?.id ?? localAppointmentData.patient?.key ?? 0);
            const encounterId = Number((createdEncounter as any)?.id ?? 0);
            
            setPaymentDraft((prev: any) => ({
                ...prev,
                patientId: patientId,
                encounterId: encounterId
            }));
        }
    }, [createdEncounter, resolvedPatient, localAppointmentData?.patient]);

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
            onStatusChange();
            onActionsModalClose();
        } catch (error: any) {
            // Extract error message from API response
             const errorMsg = extractErrorMessage(error) || 'Save Failed';
             dispatch(notify({ msg: errorMsg, sev: 'warning' }));
        }
    }

    const handleOpenPaymentModal = () => {
        if (!createdEncounter) {
            dispatch(notify({ msg: 'Please confirm the appointment first to create an encounter', sev: 'warning' }));
            return;
        }
        
        // Ensure payment draft is initialized with current patient and encounter
        if (resolvedPatient && createdEncounter) {
            const patientAny = resolvedPatient as any;
            const patientId = Number(patientAny?.id ?? localAppointmentData.patient?.key ?? 0);
            const encounterId = Number((createdEncounter as any)?.id ?? 0);
            
            setPaymentDraft((prev: any) => ({
                ...prev,
                patientId: patientId,
                encounterId: encounterId
            }));
        }
        
        setPaymentModalOpen(true);
    };

    const handlePaymentConfirm = async () => {
        if (!paymentRef.current) return;
        
        try {
            const success = await paymentRef.current.confirm();
            if (success) {
                dispatch(notify({ msg: 'Payment confirmed successfully', sev: 'success' }));
                setPaymentModalOpen(false);
                onStatusChange(); // Refresh appointment list
            }
        } catch (error: any) {
            // Error handling is done inside PatientPaymentInfo component
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
    onStatusChange();
    onActionsModalClose();
    setResonType(null);
    setOtherReason(null);
    setResonKey(null);
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
    onStatusChange();
    onActionsModalClose();
    setResonType(null);
    setOtherReason(null);
    setResonKey(null);
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
              disabled={currentStatus !== "CONFIRMED" || isViewOnlyActionsStatus}
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
            <MyButton width="250px" disabled={true} onClick={() => editAppointment()} color="violet" appearance="primary">
                Change
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
                />
                <MyInput
                    width="100%"
                    column
                    fieldLabel="Other Reason"
                    fieldName="otherReason"
                    record={otherReason}
                    setRecord={setOtherReason}
                    disabled={Boolean(selectedReasonValue) || isReasonViewOnly}
                />
            </div>
        </Form>
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
                            disabled={true}
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
                setOpen={setPaymentModalOpen}
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

            <AppointmentLogsModal 
            open={openAppointmentLogsModal}
            setOpen={setOpenAppointmentLogsModal}
            appointment={appointment}
            />
        </div>
    );
}
export default AppointmentActionsModal;
