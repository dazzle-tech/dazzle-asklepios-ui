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
import { useCreateEncounterMutation, useGetEncountersByAppointmentQuery } from "@/services/encounters/patientEncounterService";
import type { PatientEncounter } from "@/types/model-types-new";
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { calculateAgeFormat } from "@/utils";
import MyModal from "@/components/MyModal/MyModal";
import MyButton from "@/components/MyButton/MyButton";
import { faClock } from '@fortawesome/free-solid-svg-icons';
import PatientPaymentInfo, { PatientPaymentInfoHandle } from '@/pages/patient/patient-profile/PatientQuickAppoinment/PatientPaymentInfo';
import { newPatientPayments, newPatientInsurance } from '@/types/model-types-constructor-new';

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
    const [otherReason, setOtherReason] = useState<any>(null)
    const [createEncounter] = useCreateEncounterMutation();
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [createdEncounter, setCreatedEncounter] = useState<PatientEncounter | null>(null);
    const paymentRef = useRef<PatientPaymentInfoHandle | null>(null);
    
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
    const statusValue = localAppointmentData?.status || localAppointmentData?.appointmentStatus || appointment?.appointmentData?.status || appointment?.appointmentData?.appointmentStatus;
    const currentStatus = normalizeStatus(statusValue);

    const handleCheckIn = async () => {
      const id = getAppointmentId();
      if (!id) {
        dispatch(notify({ msg: 'Invalid appointment id', sev: 'warning' }));
        return;
      }
      if (currentStatus !== 'CONFIRMED') {
        dispatch(notify({ msg: 'Please confirm the appointment before check-in', sev: 'warning' }));
        return;
      }

      try {
        await checkInAppointment({ id }).unwrap();
        dispatch(notify({ msg: 'Appointment Checked-In Successfully', sev: 'success' }));
        onStatusChange();
        onActionsModalClose();
      } catch (error: any) {
        dispatch(notify({ msg: 'An error occurred while checking in the appointment', sev: 'warn' }));
      }
    };
    const handleSaveVisit = async (data) => {
        try {
            // Check if the resource type is department-based (similar to PatientQuickAppointment)
            const isDepartmentBasedResource = ['CLINIC', 'INPATIENT_ADMISSION', 'DAY_CASE', 'EMERGENCY'].includes(data?.resourceTypeLkey);
            
            // Get resourceKey - use data.resourceKey or fallback to localAppointmentData.resourceKey
            const resourceKeyToUse = data?.resourceKey || localAppointmentData?.resourceKey;
            
            // For department-based resources, use the resourceKey as departmentKey
            // For other resources, use the departmentKey as is (or null if not set)
            const departmentKeyToSave = isDepartmentBasedResource 
                ? resourceKeyToUse 
                : (data?.departmentKey || localAppointmentData?.departmentKey);

            // Get patient ID - convert from key/id to number
            const patientId = Number(data?.patient?.id || data?.patient?.key || 0);
            if (!patientId || patientId === 0) {
                dispatch(notify({ msg: 'Patient ID is required to create encounter', sev: 'warning' }));
                return;
            }

            // Get facility ID - from appointment or current logged-in facility
            const facilityId = Number(
                data?.facilityKey || 
                localAppointmentData?.facilityKey || 
                currentLoggedInFacility?.id || 
                currentLoggedInFacility?.facilityKey || 
                0
            );
            if (!facilityId || facilityId === 0) {
                dispatch(notify({ msg: 'Facility ID is required to create encounter', sev: 'warning' }));
                return;
            }

            // Get department ID - convert to number
            const departmentId = Number(departmentKeyToSave || 0);
            if (!departmentId || departmentId === 0) {
                dispatch(notify({ msg: 'Department ID is required to create encounter', sev: 'warning' }));
                return;
            }

            // Map resourceTypeLkey to encounterType (you may need to adjust this mapping)
            const encounterType = data?.resourceTypeLkey || localAppointmentData?.resourceTypeLkey || 'CLINIC';
            
            // Get encounter date from appointment start or use current date
            const encounterDate = data?.appointmentStart 
                ? new Date(data.appointmentStart) 
                : new Date();

            // Get appointment ID/key
            const appointmentId = Number(
                data?.key || 
                data?.id || 
                localAppointmentData?.key || 
                localAppointmentData?.id || 
                0
            );

            // Create new encounter object (id is optional for creation)
            const encounterBody: any = {
                patientId: patientId,
                facilityId: facilityId,
                departmentId: departmentId,
                encounterType: encounterType,
                encounterReason: data?.visitTypeLkey || 'APPOINTMENT',
                priorityLevel: 'NORMAL', // Default priority, adjust as needed
                status: 'NEW', // Default status, adjust as needed
                encounterDate: encounterDate,
                notes: data?.notes || null,
                chiefComplaint: null,
                hasPrescription: false,
                hasOrder: false,
                isObserved: false,
                appointmentId: appointmentId || null
            };

            // Create the encounter
            const createdEncounterResult = await createEncounter({ body: encounterBody as PatientEncounter }).unwrap();
            
            // Store the created encounter
            setCreatedEncounter(createdEncounterResult as PatientEncounter);
            
            // Update payment draft with encounter ID
            setPaymentDraft((prev: any) => ({
                ...prev,
                patientId: patientId,
                encounterId: (createdEncounterResult as any)?.id ?? 0
            }));
            
            dispatch(notify({ msg: 'Encounter created successfully', sev: 'success' }));
            
            return createdEncounterResult;
        } catch (error: any) {
            // Extract error message from API response
            const rawMessage =
              error?.data?.message ||
              error?.data?.errorKey ||
              error?.message ||
              'An error occurred while creating the encounter';

            // Friendly mapping for backend error keys (like the screenshot)
            const errorMessage =
              String(rawMessage).trim() === 'error.patient.department.date.duplicate'
                ? 'This patient already has an appointment in this department for the selected date.'
                : String(rawMessage);
            
            // Always show error message to user
            dispatch(notify({ msg: errorMessage, sev: 'warning' }));
            throw error; // Re-throw to allow caller to handle
        }
    };

    // Keep original label for title and use normalized value for business rules
    const currentAppointmentStatus = statusValue;
    const modalPatientTitle = useMemo(() => {
      const patient: any = localAppointmentData?.patient || appointment?.appointmentData?.patient || {};
      const patientName =
        [
          patient?.firstName,
          patient?.secondName,
          patient?.thirdName,
          patient?.lastName
        ]
          .filter(Boolean)
          .join(' ')
          .trim() || patient?.fullName || 'Unknown Patient';
      const mrn =
        patient?.medicalRecordNumber ||
        patient?.patientMrn ||
        patient?.mrn ||
        '';

      return mrn ? `${patientName} (${mrn})` : patientName;
    }, [localAppointmentData?.patient, appointment?.appointmentData?.patient]);

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
        if (appointment)
            setLocalAppoitmentData(appointment.appointmentData)
    }, [appointment])

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
        if (createdEncounter && localAppointmentData?.patient) {
            const patientAny = localAppointmentData.patient as any;
            const patientId = Number(patientAny?.id ?? localAppointmentData.patient?.key ?? 0);
            const encounterId = Number((createdEncounter as any)?.id ?? 0);
            
            setPaymentDraft((prev: any) => ({
                ...prev,
                patientId: patientId,
                encounterId: encounterId
            }));
        }
    }, [createdEncounter, localAppointmentData?.patient]);

    const handleConfirm = async () => {
        try {
            const id = getAppointmentId();
            if (!id) {
              dispatch(notify({ msg: 'Invalid appointment id', sev: 'warning' }));
              return;
            }
            
            // First, create the encounter
            await handleSaveVisit(localAppointmentData || appointment?.appointmentData);
            
            // Then, confirm the appointment
            await confirmAppointment({ id }).unwrap();
            
            // Update local appointment data to reflect confirmed status
            setLocalAppoitmentData(prev => ({
                ...prev,
                appointmentStatus: "CONFIRMED",
                status: "CONFIRMED"
            }));
            
            dispatch(notify({ msg: 'Appointment Confirmed and Encounter Created Successfully', sev: 'success' }));
            onStatusChange();
            // Don't close the modal - keep it open so user can add payment
        } catch (error: any) {
            // Extract error message from API response
            const rawMessage =
              error?.data?.message ||
              error?.data?.errorKey ||
              error?.message ||
              'An error occurred while confirming the appointment';

            // Friendly mapping for backend error keys (like the screenshot)
            const errorMessage =
              String(rawMessage).trim() === 'error.patient.department.date.duplicate'
                ? 'This patient already has an appointment in this department for the selected date.'
                : String(rawMessage);
            
            // Always show error message to user
            dispatch(notify({ msg: errorMessage, sev: 'warning' }));
        }
    }

    const handleOpenPaymentModal = () => {
        if (!createdEncounter) {
            dispatch(notify({ msg: 'Please confirm the appointment first to create an encounter', sev: 'warning' }));
            return;
        }
        
        // Ensure payment draft is initialized with current patient and encounter
        if (localAppointmentData?.patient && createdEncounter) {
            const patientAny = localAppointmentData.patient as any;
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

const handleNonShow = () => {
  const id = getAppointmentId();
  if (!id) {
    dispatch(notify({ msg: 'Invalid appointment id', sev: 'warning' }));
    return;
  }
  const reasonText = String(otherReason?.otherReason || reasonKey?.lovDisplayVale || reasonKey?.key || '').trim();
  if (!reasonText) {
    dispatch(notify({ msg: 'Please add no-show reason', sev: 'warning' }));
    return;
  }

  noShowAppointment({ id, noShowReason: reasonText })
    .unwrap()
    .then(() => {
      dispatch(notify({ msg: 'Appointment Status has been changed Successfully', sev: 'success' }));
      onStatusChange();
      onActionsModalClose();
      setResonType(null);
      setOtherReason(null);
      setResonKey(null);
    });
};


const handleCancel = () => {
  const id = getAppointmentId();
  if (!id) {
    dispatch(notify({ msg: 'Invalid appointment id', sev: 'warning' }));
    return;
  }
  const reasonText = String(otherReason?.otherReason || reasonKey?.lovDisplayVale || reasonKey?.key || '').trim();
  if (!reasonText) {
    dispatch(notify({ msg: 'Please add cancel reason', sev: 'warning' }));
    return;
  }

  cancelAppointment({ id, cancelReason: reasonText })
    .unwrap()
    .then(() => {
      dispatch(notify({ msg: 'Appointment has been canceled Successfully', sev: 'success' }));
      onStatusChange();
      onActionsModalClose();
      setResonType(null);
      setOtherReason(null);
      setResonKey(null);
    });
};
    // Appoinment Actions Modal Content
    const actionsModalContent = (
        <Form fluid layout="inline">
            <MyButton
              width="250px"
              disabled={currentStatus !== "CONFIRMED"}
              onClick={handleCheckIn}
              color="cyan"
              appearance="primary"
            >
                Check-In
            </MyButton>
            <MyButton width="250px" disabled={currentStatus === "CONFIRMED"} onClick={handleConfirm} color="violet" appearance="primary">
                Confirm
            </MyButton>
            <MyButton width="250px" disabled={["NOSHOW", "CONFIRMED"].includes(currentStatus)} onClick={() => { setResonType('No-show') }} color="blue" appearance="primary">
                No-show
            </MyButton>
            <MyButton width="250px" onClick={() => viewAppointment(appointment?.appointmentData)} color="cyan" appearance="primary">
                View
            </MyButton>
            <MyButton width="250px" disabled={["CONFIRMED"].includes(currentStatus)} onClick={() => editAppointment()} color="violet" appearance="primary">
                Change
            </MyButton>
            <MyButton width="250px" disabled={["CANCELED", "CONFIRMED"].includes(currentStatus)} onClick={() => { setResonType('Cancel') }} color="blue" appearance="primary">
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
                    selectData={resonType === 'Cancel' ? cancelResonLovQueryResponse?.object : noShowResonLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={reasonKey}
                    setRecord={setResonKey}
                />
                <MyInput
                    width="100%"
                    column
                    fieldLabel="Other Reason"
                    fieldName="otherReason"
                    record={otherReason}
                    setRecord={setOtherReason}
                />
            </div>
        </Form>
    );
    return (
        <div>
            <MyModal
                open={isActionsModalOpen}
                setOpen={onActionsModalClose}
                title={modalPatientTitle}
                size="38vw"
                bodyheight="50vh"
                position="center"
                content={actionsModalContent}
                hideBack={true}
                hideActionBtn={true}
                steps={[{
                    title: "Appoinment Actions", icon: <FontAwesomeIcon icon={faCalendarCheck} />,
                    footer: <>
                        <MyButton appearance="ghost" prefixIcon={() => <PageIcon />}>
                            Print Certificate
                        </MyButton>
                        <MyButton 
                            appearance="ghost" 
                            prefixIcon={() => <FontAwesomeIcon icon={faSackDollar} />}
                            disabled={currentStatus !== "CONFIRMED"}
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
                position="right"
                content={cancelModalContent}
                actionButtonFunction={() => { resonType === 'Cancel' ? handleCancel() : handleNonShow() }}
                isDisabledActionBtn={!(otherReason || reasonKey)}
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
                    createdEncounter && localAppointmentData?.patient ? (
                        <PatientPaymentInfo
                            ref={paymentRef}
                            localPatient={localAppointmentData.patient}
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
        </div>
    );
}
export default AppointmentActionsModal;