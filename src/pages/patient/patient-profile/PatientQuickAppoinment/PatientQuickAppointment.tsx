import { useAppDispatch } from '@/hooks';
import MyButton from '@/components/MyButton/MyButton';
import React, { useEffect, useRef, useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarCheck,
  faBroom,
  faFileInvoiceDollar,
  faCheckDouble
} from '@fortawesome/free-solid-svg-icons';
import { notify } from '@/utils/uiReducerActions';
import MyModal from '@/components/MyModal/MyModal';
import { Loader, Modal } from 'rsuite';
import '../styles.less';
import RegistrationEncounter from './RegistrationEncounter';
import PatientPaymentInfo, { PatientPaymentInfoHandle } from './PatientPaymentInfo';
import type { PatientEncounter } from '@/types/model-types-new';
import { getEncounterLifecycleStatus } from '@/utils/encounterStatusHelpers';
import { formatEnumString } from '@/utils';
import {
  newPatientEncounter,
  newPatientInsurance,
  newPatientPayments
} from '@/types/model-types-constructor-new';
import {
  useCheckInAppointmentMutation,
  useConfirmAppointmentMutation,
  useCreateQuickAppointmentMutation,
  useLazyFilterAppointmentsWithoutPaginationQuery
} from '@/services/appointment/appointmentService';
import {
  useLazyGetEncounterByIdQuery,
  useLazyGetEncountersByAppointmentQuery
} from '@/services/encounters/patientEncounterService';
import {
  useGetDepartmentByIdQuery,
  useLazyIsPatientAgeAllowedQuery
} from '@/services/security/departmentService';
import { useAcceptReferralRequestMutation } from '@/services/medicalsheetsEncounter/referralRequestService';
import * as modelTypes from '@/types/model-types-new';

const LOADABLE_APPOINTMENT_STATUSES = new Set(['BOOKED', 'CONFIRMED']);

const normalizeAppointmentStatus = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

const appointmentRecordId = (appointment: any) => Number(appointment?.id ?? appointment?.key ?? 0);

const appointmentStartValue = (appointment: any) =>
  appointment?.startDatetime ??
  appointment?.appointmentDateTime ??
  appointment?.appointmentDate ??
  appointment?.startDate ??
  null;

const appointmentDepartmentId = (appointment: any) =>
  Number(appointment?.departmentId ?? appointment?.department?.id ?? appointment?.departmentKey ?? 0);

const isSameLocalDate = (a: any, b: any) => {
  const da = a instanceof Date ? a : new Date(a);
  const db = b instanceof Date ? b : new Date(b);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

const isLoadableSameDepartmentAppointment = (
  appointment: any,
  patientId: number,
  departmentId: number
) => {
  if (!appointmentRecordId(appointment)) return false;
  const status = normalizeAppointmentStatus(appointment?.status ?? appointment?.appointmentStatus);
  if (!LOADABLE_APPOINTMENT_STATUSES.has(status)) return false;

  const rowPatientId = Number(appointment?.patientId ?? appointment?.patient?.id ?? 0);
  if (rowPatientId && rowPatientId !== patientId) return false;

  const rowDepartmentId = appointmentDepartmentId(appointment);
  if (rowDepartmentId && rowDepartmentId !== departmentId) return false;

  const start = appointmentStartValue(appointment);
  return Boolean(start) && isSameLocalDate(start, new Date());
};

const linkedEncounterIdOnAppointment = (appointment: any) => {
  const raw =
    appointment?.encounterId ??
    appointment?.patientEncounterId ??
    appointment?.encounter?.id ??
    null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : 0;
};

const linkedEncounterIdFromReference = (encounterRef: unknown) => {
  if (encounterRef == null || encounterRef === '') return 0;
  if (typeof encounterRef === 'string' || typeof encounterRef === 'number') {
    const id = Number(encounterRef);
    return Number.isFinite(id) && id > 0 ? id : 0;
  }
  if (typeof encounterRef === 'object') {
    const id = Number((encounterRef as { id?: number | string }).id ?? 0);
    return Number.isFinite(id) && id > 0 ? id : 0;
  }
  return 0;
};

const isMissingEncounterError = (error: any) => {
  const status = error?.status ?? error?.originalStatus ?? error?.data?.status;
  return status === 404 || status === 204;
};

const isEncounterStillOpen = (encounter: any) => {
  if (!encounter) return false;
  const lifecycle = getEncounterLifecycleStatus(encounter);
  return lifecycle !== 'CLOSED' && lifecycle !== 'CANCELLED';
};

const isAppointmentToday = (appointment: any) => {
  const start = appointmentStartValue(appointment);
  return Boolean(start) && isSameLocalDate(start, new Date());
};

const isEncounterToday = (encounter: any) => {
  const value = encounter?.encounterDate ?? encounter?.createdDate ?? encounter?.createdAt ?? null;
  if (!value) return true;
  return isSameLocalDate(value, new Date());
};

const formatAppointmentTime = (appointment: any) => {
  const start = appointmentStartValue(appointment);
  if (!start) return '';
  const date = new Date(start);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const ENCOUNTER_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Encounter data is required.',
  'patient.invalid': 'Invalid patient id.',
  'patient.notfound': 'Patient not found.',
  'followUpEncounter.invalid': 'Invalid follow-up encounter id.',
  'followUpEncounter.notfound': 'Follow-up encounter not found.',
  'encounterNumber.duplicate': 'Encounter number already exists.',
  'id.notfound': 'Encounter record not found.',
  notfound: 'Encounter record not found.',
  'followUpEncounter.required.followup':
    'Follow-up Encounter is required when Reason is Follow up.',
  'followUpEncounter.required.byReason':
    'Follow-up Encounter is required when Reason is Follow up (and must be empty otherwise).',
  'department.date.sequence.duplicate':
    'Daily sequence number already exists for this department and date. Please try again.',
  'patient.emergency.notAllowed.withOngoing':
    'Patient currently treated by another doctor',
  duplicate: 'Duplicate record.',
  'facility.invalid': 'Invalid facility id.',
  'department.invalid': 'Invalid department id.',
  'practitioner.invalid': 'Invalid practitioner id.',
  'practitioner.required': 'Practitioner is required for this department.',
  'db.constraint': 'Database constraint violation while saving encounter.'
};
const ENCOUNTER_FIELD_LABELS: Record<string, string> = {
  patientId: 'Patient',
  facilityId: 'Facility',
  departmentId: 'Department',
  practitionerId: 'Practitioner',
  encounterType: 'Encounter Type',
  encounterReason: 'Reason',
  followUpEncounterId: 'Follow-up Encounter',
  priorityLevel: 'Priority',
  originType: 'Origin Type',
  originName: 'Origin Name',
  notes: 'Notes',
  status: 'Status',
  encounterDate: 'Date',
  departmentDailySequenceNumber: 'Department Daily Sequence'
};

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? err ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  const normalizeMsg = (msg: string) => {
    const m = (msg || '').toLowerCase();
    if (m.includes('must not be null')) return 'is required';
    if (m.includes('must not be blank')) return 'must not be blank';
    if (m.includes('size')) return 'length is out of range';
    if (m.includes('greater')) return 'value is too small';
    if (m.includes('less')) return 'value is too large';
    return msg || 'invalid value';
  };

  const toLabel = (field: string) => ENCOUNTER_FIELD_LABELS[field] ?? field;

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const lines = data.fieldErrors.map(
      (fe: any) => `• ${toLabel(fe.field)}: ${normalizeMsg(fe.message)}`
    );

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix,
        sev: 'error'
      })
    );
    return;
  }

  const messageProp: string = data?.message || '';
  const errorKey =
    (messageProp && messageProp.startsWith('error.') ? messageProp.substring(6) : undefined) ||
    data?.errorKey;

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  dispatch(
    notify({
      msg: humanMsg + suffix,
      sev: 'error'
    })
  );
};

const PatientQuickAppointment = ({
  quickAppointmentModel,
  localPatient,
  setQuickAppointmentModel,
  localVisit,
  localReferral,
  openedFromReferral = false,
  isDisabeld = false,
  onEncounterSaved,
  initialStep = 0
}: any) => {
  const dispatch = useAppDispatch();

  const [localEncounter, setLocalEncounter] = useState<PatientEncounter>({
    ...newPatientEncounter,
    patientId: Number(localPatient?.id ?? localPatient?.key ?? 0) || null,
    facilityId: Number(localReferral?.toFacilityId ?? 0) || null,
    departmentId: Number(localReferral?.toDepartmentId ?? 0) || null,
    encounterDate: new Date()
  });

  const [isReadOnly] = useState(isDisabeld);
  const [isEncounterSaved, setIsEncounterSaved] = useState(false);
  const [isPatientAgeAllowed, setIsPatientAgeAllowed] = useState(false);
  const [isCheckingPatientAge, setIsCheckingPatientAge] = useState(false);
  const [validationResult, setValidationResult] = useState<any>({});

  const paymentRef = useRef<PatientPaymentInfoHandle | null>(null);
  const [isPaymentSaved, setIsPaymentSaved] = useState(false);
  const [paymentConfirmLoading, setPaymentConfirmLoading] = useState(false);

  const isViewMode = Boolean(isDisabeld);
  const isPaymentMode = initialStep === 1;
  const isLockedAfterPayment = Boolean(isPaymentSaved);
  const paymentReadOnly = Boolean(isViewMode || isLockedAfterPayment);

  const [createQuickAppointment] = useCreateQuickAppointmentMutation();
  const [searchAppointments] = useLazyFilterAppointmentsWithoutPaginationQuery();
  const [checkInAppointment] = useCheckInAppointmentMutation();
  const [confirmAppointment] = useConfirmAppointmentMutation();
  const [getEncounterByAppointment] = useLazyGetEncountersByAppointmentQuery();
  const [getEncounterById] = useLazyGetEncounterByIdQuery();
  const [checkPatientAgeAllowed] = useLazyIsPatientAgeAllowedQuery();
  const [acceptReferralRequest] = useAcceptReferralRequestMutation();
  const [isSavingEncounter, setIsSavingEncounter] = useState(false);
  const [existingAppointmentPromptOpen, setExistingAppointmentPromptOpen] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  const [selectedExistingAppointmentId, setSelectedExistingAppointmentId] = useState<number | null>(null);
  const [isLoadingExistingAppointment, setIsLoadingExistingAppointment] = useState(false);
  const encounterReadOnly = Boolean(
    isReadOnly ||
      isViewMode ||
      isPaymentMode ||
      isEncounterSaved ||
      isSavingEncounter ||
      isLoadingExistingAppointment ||
      existingAppointmentPromptOpen
  );
  const selectedDepartmentId = Number(localEncounter?.departmentId ?? 0);
  const { data: selectedDepartment } = useGetDepartmentByIdQuery(selectedDepartmentId, {
    skip: !selectedDepartmentId
  });

  const didAcceptReferralRef = useRef(false);
  const promptedDepartmentIdRef = useRef<number | null>(null);

  useEffect(() => {
    const departmentId = Number(localEncounter?.departmentId ?? 0);
    if (localPatient?.isUnknown === true) {
     setIsPatientAgeAllowed(true);
     setIsCheckingPatientAge(false);
     return;
    }
    const rawDateOfBirth = localPatient?.dateOfBirth ?? localPatient?.dob;
    const parsedDateOfBirth = rawDateOfBirth ? new Date(rawDateOfBirth) : null;
    const dateOfBirth =
      parsedDateOfBirth && !Number.isNaN(parsedDateOfBirth.getTime())
        ? parsedDateOfBirth.toISOString().split('T')[0]
        : '';

    if (!departmentId || !dateOfBirth) {
      setIsPatientAgeAllowed(false);
      setIsCheckingPatientAge(false);
      return;
    }

    let isCurrent = true;
    setIsCheckingPatientAge(true);
    setIsPatientAgeAllowed(false);

    checkPatientAgeAllowed({ departmentId, dateOfBirth })
      .unwrap()
      .then((isAllowed: boolean) => {
        if (!isCurrent) return;

        setIsPatientAgeAllowed(isAllowed);

        if (!isAllowed) {
          dispatch(
            notify({
              msg: 'Patient age is not allowed for the selected department',
              sev: 'warning'
            })
          );
        }
      })
      .catch(() => {
        if (isCurrent) setIsPatientAgeAllowed(false);
      })
      .finally(() => {
        if (isCurrent) setIsCheckingPatientAge(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [
    checkPatientAgeAllowed,
    localEncounter?.departmentId,
    localPatient?.dateOfBirth,
    localPatient?.dob,
    localPatient?.isUnknown
  ]);

  const [paymentDraft, setPaymentDraft] = useState<modelTypes.PatientPayments & any>({
    ...newPatientPayments,
    patientId: Number(localPatient?.id ?? localPatient?.key ?? 0),
    encounterId: localEncounter?.id ?? 0,
    useBalanceToSettleDebts: false,
    dept: 0
  });

  const [patientInsuranceDraft, setPatientInsuranceDraft] = useState<any>({
    ...newPatientInsurance,
    payorName: '',
    planName: ''
  });

  useEffect(() => {
    setPaymentDraft((prev: any) => ({
      ...prev,
      patientId: Number(localPatient?.id ?? localPatient?.key ?? prev.patientId ?? 0),
      encounterId: localEncounter?.id ?? prev.encounterId ?? 0
    }));
  }, [localPatient?.id, localPatient?.key, localEncounter?.id]);

  useEffect(() => {
    const v: any = (localEncounter as any)?.encounterDate;
    if (!v) return;
    if (typeof v === 'string') {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) setLocalEncounter(prev => ({ ...prev, encounterDate: d }));
    }
    if (typeof v === 'number') {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) setLocalEncounter(prev => ({ ...prev, encounterDate: d }));
    }
  }, [localEncounter?.encounterDate]);

  useEffect(() => {
    if (!openedFromReferral || !localReferral) return;

    setLocalEncounter(prev => ({
      ...prev,
      patientId: Number(localPatient?.id ?? localPatient?.key ?? prev.patientId ?? 0),
      facilityId: Number(localReferral?.toFacilityId ?? prev.facilityId ?? 0),
      departmentId: Number(localReferral?.toDepartmentId ?? prev.departmentId ?? 0)
    }));
  }, [openedFromReferral, localReferral, localPatient?.id, localPatient?.key]);

  useEffect(() => {
    if (!quickAppointmentModel) {
      didAcceptReferralRef.current = false;
      promptedDepartmentIdRef.current = null;
      setExistingAppointmentPromptOpen(false);
      setExistingAppointments([]);
      setSelectedExistingAppointmentId(null);
    }
  }, [quickAppointmentModel]);

  useEffect(() => {
    if (!existingAppointmentPromptOpen || promptedDepartmentIdRef.current == null) return;
    if (Number(localEncounter?.departmentId ?? 0) === promptedDepartmentIdRef.current) return;
    promptedDepartmentIdRef.current = null;
    setExistingAppointmentPromptOpen(false);
    setExistingAppointments([]);
    setSelectedExistingAppointmentId(null);
  }, [existingAppointmentPromptOpen, localEncounter?.departmentId]);

  const validateRequiredFields = () => {
    const missingFields: string[] = [];
    if (!localEncounter?.facilityId) missingFields.push('Facility');
    if (!localEncounter?.departmentId) missingFields.push('Department');
    if (!localEncounter?.encounterType) missingFields.push('Encounter Type');
    const allowsNullPractitionerAtRegistration =
      localEncounter?.encounterType === 'EMERGENCY' ||
      Boolean(selectedDepartment?.assignPractitionerOnVisitStart);
    if (!allowsNullPractitionerAtRegistration && !localEncounter?.practitionerId) {
      missingFields.push('Practitioner');
    }
    if (!localEncounter?.encounterReason) missingFields.push('Reason');
    if (!localEncounter?.priorityLevel) missingFields.push('Priority');
    if (!localEncounter?.encounterDate) missingFields.push('Date');
    if (
      localEncounter?.encounterReason === 'FOLLOW_UP' &&
      !localEncounter?.followUpEncounterId
    ) {
      missingFields.push('Follow-up Encounter');
    }

    if (missingFields.length > 0) {
      const lines = missingFields.map(field => `• ${field}: is required`);
      dispatch(
        notify({ msg: `Please fix the following fields:\n${lines.join('\n')}`, sev: 'warning' })
      );
      return false;
    }
    return true;
  };

  const extractErrorMessage = (response: any): string => {
    try {
      const msg = response?.data?.message ?? response?.message;

      if (typeof msg === 'string') {
        return msg.replace(/^error\./i, '');
      }

      return '';
    } catch {
      return '';
    }
  };
  const closeExistingAppointmentPrompt = () => {
    promptedDepartmentIdRef.current = null;
    setExistingAppointmentPromptOpen(false);
    setExistingAppointments([]);
    setSelectedExistingAppointmentId(null);
  };

  const applySavedEncounter = async (
    encounter: any,
    appointment: any | null,
    successMessage: string
  ) => {
    const createdEncounterId = Number(encounter?.id ?? 0) || localEncounter?.id || 0;
    const linkedAppointmentId = appointment ? appointmentRecordId(appointment) : 0;

    if (encounter && typeof encounter === 'object') {
      setLocalEncounter(prev => ({
        ...prev,
        ...encounter,
        appointmentId: linkedAppointmentId ? String(linkedAppointmentId) : prev.appointmentId ?? null
      }));
    } else {
      setLocalEncounter(prev => ({
        ...prev,
        id: createdEncounterId || prev.id,
        appointmentId: linkedAppointmentId ? String(linkedAppointmentId) : prev.appointmentId ?? null
      }));
    }

    setPaymentDraft((prev: any) => ({
      ...prev,
      encounterId: createdEncounterId || prev.encounterId
    }));
    if (appointment && typeof appointment === 'object') {
      setValidationResult((prev: any) => ({ ...prev, appointmentFromTemplate: appointment }));
    }
    setIsEncounterSaved(true);

    if (openedFromReferral && localReferral?.id && !didAcceptReferralRef.current) {
      await acceptReferralRequest({ id: localReferral.id }).unwrap();
      didAcceptReferralRef.current = true;
    }

    dispatch(notify({ msg: successMessage, sev: 'success' }));
    if (onEncounterSaved) await onEncounterSaved();
  };

  const createNewVisit = async () => {
    const patientId = Number(localPatient?.id ?? localPatient?.key ?? 0);
    const practitionerId = Number(localEncounter?.practitionerId ?? 0);
    const departmentId = Number(localEncounter?.departmentId ?? 0);

    const payload: modelTypes.AppointmentFromTemplateQuickAppointmentDTO = {
      facilityId: Number(localEncounter?.facilityId ?? 0),
      departmentId,
      resourceType: (practitionerId > 0 ? 'PRACTITIONER' : 'DEPARTMENT') as modelTypes.TemplateType,
      resourceId: practitionerId > 0 ? practitionerId : departmentId,
      patientId,
      service: String(localEncounter?.encounterReason ?? '') as modelTypes.EncounterReason,
      priority: String(localEncounter?.priorityLevel ?? ''),
      defaultServiceId: (localEncounter as any)?.defaultServiceId
        ? Number((localEncounter as any).defaultServiceId)
        : null,
      defaultPractitionerId: practitionerId > 0 ? practitionerId : null,
      reason: (localEncounter as any)?.chiefComplaint as string | null,
      note: (localEncounter?.notes ?? null) as string | null,
      followUpEncounterId:
        localEncounter?.encounterReason === 'FOLLOW_UP' && localEncounter?.followUpEncounterId
          ? Number(localEncounter.followUpEncounterId)
          : null,
      originType: (localEncounter as any)?.originType ?? null,
      originName: (localEncounter as any)?.originName ?? null,
      promotionName: (localEncounter as any)?.promotionName || null,
      promotionCode: (localEncounter as any)?.promotionCode || null
    };

    const saved = await createQuickAppointment(payload).unwrap();
    const returnedEncounter = (saved as any)?.encounter ?? null;
    const returnedAppointment = (saved as any)?.appointmentFromTemplate ?? null;
    await applySavedEncounter(
      returnedEncounter ?? { id: localEncounter?.id },
      returnedAppointment,
      'Quick appointment saved successfully'
    );
  };

  const searchDepartmentAppointments = async (patientId: number, departmentId: number) => {
    const facilityId = Number(localEncounter?.facilityId ?? 0);
    const rows = await searchAppointments(
      {
        filter: {
          facility: facilityId > 0 ? facilityId : null,
          departmentIds: [departmentId],
          patientId
        }
      },
      false
    ).unwrap();

    const list = Array.isArray(rows) ? rows : [];
    return list.filter(row => {
      if (!appointmentRecordId(row)) return false;
      const rowPatientId = Number(row?.patientId ?? row?.patient?.id ?? 0);
      if (rowPatientId && rowPatientId !== patientId) return false;
      const rowDepartmentId = appointmentDepartmentId(row);
      if (rowDepartmentId && rowDepartmentId !== departmentId) return false;
      return isAppointmentToday(row);
    });
  };

  const readLinkedEncounter = async (appointment: any) => {
    const inlineEncounter = appointment?.encounter;
    if (
      inlineEncounter &&
      typeof inlineEncounter === 'object' &&
      (inlineEncounter.encounterStatus || inlineEncounter.treatmentStatus || inlineEncounter.status)
    ) {
      return inlineEncounter;
    }

    const linkedId = linkedEncounterIdOnAppointment(appointment);
    if (linkedId) {
      try {
        return await getEncounterById({ id: linkedId }).unwrap();
      } catch (error: any) {
        if (isMissingEncounterError(error)) return null;
        throw error;
      }
    }

    const appointmentId = appointmentRecordId(appointment);
    if (!appointmentId) return null;
    try {
      const encounterRef = await getEncounterByAppointment({ appointmentId }).unwrap();
      const encounterId = linkedEncounterIdFromReference(encounterRef);
      if (!encounterId) {
        return encounterRef && typeof encounterRef === 'object' ? encounterRef : null;
      }
      return await getEncounterById({ id: encounterId }).unwrap();
    } catch (error: any) {
      if (isMissingEncounterError(error)) return null;
      throw error;
    }
  };

  const findOpenLinkedEncounter = async (appointments: any[]) => {
    const todaysAppointments = appointments.filter(isAppointmentToday);
    const seen = new Set<number>();
    const toCheck = todaysAppointments.filter(row => {
      const id = appointmentRecordId(row);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    const encounters = await Promise.all(toCheck.map(row => readLinkedEncounter(row)));
    return (
      encounters.find(encounter => isEncounterStillOpen(encounter) && isEncounterToday(encounter)) ??
      null
    );
  };

  const warnOpenEncounterBlocksNewVisit = (encounter: any) => {
    const encounterNumber = encounter?.encounterNumber ? ` (${encounter.encounterNumber})` : '';
    const departmentLabel =
      selectedDepartment?.name || selectedDepartment?.departmentName || 'this department';
    dispatch(
      notify({
        msg: `This patient already has an open encounter${encounterNumber} today linked to an appointment in ${departmentLabel}. A new encounter and appointment cannot be created in this department until that encounter is closed.`,
        sev: 'warning'
      })
    );
  };

  const findLoadableAppointments = async (appointments: any[], patientId: number, departmentId: number) => {
    const candidates = appointments.filter(row =>
      isLoadableSameDepartmentAppointment(row, patientId, departmentId)
    );
    const unlinked = await Promise.all(
      candidates.map(async row => ((await appointmentHasLinkedEncounter(row)) ? null : row))
    );

    return unlinked
      .filter(Boolean)
      .sort((left: any, right: any) => {
        const leftTime = new Date(appointmentStartValue(left) ?? 0).getTime();
        const rightTime = new Date(appointmentStartValue(right) ?? 0).getTime();
        return leftTime - rightTime;
      });
  };

  const appointmentHasLinkedEncounter = async (appointment: any) => {
    if (linkedEncounterIdOnAppointment(appointment)) return true;
    const appointmentId = appointmentRecordId(appointment);
    if (!appointmentId) return true;

    try {
      const encounterRef = await getEncounterByAppointment({ appointmentId }).unwrap();
      return linkedEncounterIdFromReference(encounterRef) > 0;
    } catch (error: any) {
      if (isMissingEncounterError(error)) return false;
      throw error;
    }
  };

  const resolveEncounterForAppointment = async (appointmentId: number) => {
    const readEncounter = async () => {
      const encounterRef = await getEncounterByAppointment({ appointmentId }).unwrap();
      if (typeof encounterRef === 'string' || typeof encounterRef === 'number') {
        const encounterId = Number(encounterRef);
        if (!encounterId) return null;
        return getEncounterById({ id: encounterId }).unwrap();
      }
      if (encounterRef && typeof encounterRef === 'object') {
        const encounterId = Number((encounterRef as any).id ?? 0);
        if (!encounterId) return encounterRef as PatientEncounter;
        try {
          return await getEncounterById({ id: encounterId }).unwrap();
        } catch {
          return encounterRef as PatientEncounter;
        }
      }
      return null;
    };

    let encounter = await readEncounter().catch(() => null);
    if (!encounter) {
      await new Promise(resolve => setTimeout(resolve, 400));
      encounter = await readEncounter().catch(() => null);
    }
    return encounter;
  };

  const checkInLoadedAppointment = async (appointment: any) => {
    const appointmentId = appointmentRecordId(appointment);
    const status = normalizeAppointmentStatus(appointment?.status ?? appointment?.appointmentStatus);
    const alreadyCheckedIn = status === 'CHECKEDIN' || status === 'CHECKED_IN';
    if (alreadyCheckedIn) return appointment;

    const needsConfirmation =
      appointment?.requireConfirmation === true && status !== 'CONFIRMED';

    const runCheckIn = async () => {
      if (needsConfirmation) {
        await confirmAppointment({ id: appointmentId }).unwrap();
      }
      return checkInAppointment({ id: appointmentId }).unwrap();
    };

    try {
      return await runCheckIn();
    } catch (error: any) {
      const message = extractErrorMessage(error).toLowerCase();
      const alreadyIn = message.includes('already') && message.includes('check');
      if (alreadyIn) return appointment;
      if (message.includes('confirm')) {
        await confirmAppointment({ id: appointmentId }).unwrap();
        return checkInAppointment({ id: appointmentId }).unwrap();
      }
      throw error;
    }
  };

  const reportSaveError = (err: any) => {
    setValidationResult(err?.data ?? err);
    const backendMsg = extractErrorMessage(err);
    if (backendMsg) {
      dispatch(notify({ msg: backendMsg, sev: 'error' }));
      return;
    }
    handleCrudError(err, dispatch, ENCOUNTER_ERROR_MAP);
  };

  const handleSave = async () => {
    if (!validateRequiredFields()) return;
    if (!isPatientAgeAllowed) {
      dispatch(notify({ msg: 'Patient age is not allowed for the selected department', sev: 'warning' }));
      return;
    }

    const patientId = Number(localPatient?.id ?? localPatient?.key ?? 0);
    const departmentId = Number(localEncounter?.departmentId ?? 0);
    setIsSavingEncounter(true);

    try {
      const departmentAppointments = patientId
        ? await searchDepartmentAppointments(patientId, departmentId)
        : [];
      const openEncounter = await findOpenLinkedEncounter(departmentAppointments);
      if (openEncounter) {
        warnOpenEncounterBlocksNewVisit(openEncounter);
        return;
      }

      const matches = await findLoadableAppointments(
        departmentAppointments,
        patientId,
        departmentId
      );
      if (matches.length > 0) {
        promptedDepartmentIdRef.current = departmentId;
        setExistingAppointments(matches);
        setSelectedExistingAppointmentId(appointmentRecordId(matches[0]));
        setExistingAppointmentPromptOpen(true);
        return;
      }
      await createNewVisit();
    } catch (err: any) {
      reportSaveError(err);
    } finally {
      setIsSavingEncounter(false);
    }
  };

  const handleLoadExistingAppointment = async () => {
    const appointment =
      existingAppointments.find(
        row => appointmentRecordId(row) === Number(selectedExistingAppointmentId)
      ) ?? existingAppointments[0];
    const appointmentId = appointmentRecordId(appointment);
    if (!appointmentId) {
      dispatch(notify({ msg: 'Select an appointment to load', sev: 'warning' }));
      return;
    }

    const currentDepartmentId = Number(localEncounter?.departmentId ?? 0);
    const rowDepartmentId = appointmentDepartmentId(appointment);
    if (rowDepartmentId && rowDepartmentId !== currentDepartmentId) {
      closeExistingAppointmentPrompt();
      dispatch(
        notify({
          msg: 'Department changed. Save again to check appointments for the selected department.',
          sev: 'warning'
        })
      );
      return;
    }

    setIsLoadingExistingAppointment(true);
    try {
      if (await appointmentHasLinkedEncounter(appointment)) {
        const remaining = existingAppointments.filter(
          row => appointmentRecordId(row) !== appointmentId
        );
        setExistingAppointments(remaining);
        setSelectedExistingAppointmentId(
          remaining.length ? appointmentRecordId(remaining[0]) : null
        );
        if (!remaining.length) closeExistingAppointmentPrompt();
        dispatch(
          notify({
            msg: remaining.length
              ? 'This appointment already has an encounter. Choose another appointment or change the department.'
              : 'This appointment already has an encounter. Change the department and save again.',
            sev: 'warning'
          })
        );
        return;
      }

      const checkedIn = await checkInLoadedAppointment(appointment);
      const encounter = await resolveEncounterForAppointment(appointmentId);
      if (!encounter || !Number((encounter as any)?.id ?? 0)) {
        dispatch(
          notify({
            msg: 'The appointment was checked in, but the linked encounter was not found. Please try again.',
            sev: 'error'
          })
        );
        return;
      }

      await applySavedEncounter(
        {
          ...encounter,
          appointmentId: String(appointmentId)
        },
        checkedIn ?? appointment,
        'Appointment loaded and checked in. Continue to open the visit.'
      );
      closeExistingAppointmentPrompt();
    } catch (err: any) {
      reportSaveError(err);
    } finally {
      setIsLoadingExistingAppointment(false);
    }
  };

  const handleClear = () => {
    setLocalEncounter({
      ...newPatientEncounter,
      patientId: Number(localPatient?.id ?? localPatient?.key ?? 0),
      facilityId: Number(localReferral?.toFacilityId ?? 0),
      departmentId: Number(localReferral?.toDepartmentId ?? 0),
      encounterDate: new Date()
    });
    setValidationResult({});
    setIsEncounterSaved(false);
    setIsPatientAgeAllowed(false);
    setIsCheckingPatientAge(false);
    setIsPaymentSaved(false);
    paymentRef.current?.clear?.();
    setPaymentDraft({
      ...newPatientPayments,
      patientId: Number(localPatient?.id ?? localPatient?.key ?? 0),
      encounterId: 0,
      useBalanceToSettleDebts: false,
      dept: 0
    });
    setPatientInsuranceDraft({ ...newPatientInsurance, payorName: '', planName: '' });
    closeExistingAppointmentPrompt();
  };

  useEffect(() => {
    if (localVisit?.id != undefined) {
      setLocalEncounter({ ...localVisit });
      setIsEncounterSaved(true);
    }
  }, [localVisit]);

  useEffect(() => {
    const pid = Number(localPatient?.id ?? localPatient?.key ?? 0);
    if (!pid) return;
    setLocalEncounter(prev => ({ ...prev, patientId: prev.patientId || pid }));
  }, [localPatient]);

  const handlePaymentConfirm = async () => {
    try {
      const ok = await paymentRef.current?.confirm();
      if (!ok) return;

      if (onEncounterSaved) await onEncounterSaved();
    } catch (err: any) {
      dispatch(notify({ msg: 'Error confirming payment', sev: 'error' }));
    }
  };

  const handlePaymentDeferred = () => {
    setQuickAppointmentModel(false);
  };

  const handleReceiptClosed = () => {
    setIsPaymentSaved(true);
    setQuickAppointmentModel(false);
    dispatch(
      notify({
        msg: 'Payment collected successfully.',
        sev: 'success'
      })
    );
  };

  const handlePaymentClear = () => {
    paymentRef.current?.clear();
    setIsPaymentSaved(false);
  };

  const conjureFormContent = (stepNumber: number) => {
    switch (stepNumber) {
      case 0:
        return (
          <div className="walk-in-encounter-step">
            {isSavingEncounter && (
              <div className="walk-in-save-loading">
                <Loader size="md" content="Saving..." vertical />
              </div>
            )}
            <RegistrationEncounter
              localEncounter={localEncounter}
              setLocalEncounter={setLocalEncounter}
              isReadOnly={encounterReadOnly}
              localPatient={localPatient}
              localReferral={localReferral}
              openedFromReferral={openedFromReferral}
            />
          </div>
        );
      case 1:
        return (
          <PatientPaymentInfo
            ref={paymentRef}
            localPatient={localPatient}
            localEncounter={localEncounter}
            setLocalEncounter={setLocalEncounter}
            isReadOnly={paymentReadOnly}
            showInternalButtons={false}
            payment={paymentDraft}
            setPayment={setPaymentDraft}
            patientInsurance={patientInsuranceDraft}
            setPatientInsurance={setPatientInsuranceDraft}
            onPaymentSaved={onEncounterSaved}
            onReceiptClosed={handleReceiptClosed}
            onPaymentDeferred={handlePaymentDeferred}
            onConfirmingChange={setPaymentConfirmLoading}
          />
        );
      default:
        return null;
    }
  };

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';
  const departmentName =
    selectedDepartment?.name || selectedDepartment?.departmentName || 'this department';
  const promptBusy = isSavingEncounter || isLoadingExistingAppointment;

  return (<div dir={dir}>
    <MyModal
      open={quickAppointmentModel}
      setOpen={setQuickAppointmentModel}
      title="Walk-in Patient"
      steps={[
        {
          title: 'Encounter',
          disabledNext: !isEncounterSaved,
          icon: <FontAwesomeIcon icon={faCalendarCheck} />,
          footer: (
            <>
              <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
                onClick={handleClear}
                disabled={encounterReadOnly || localPatient?.patientStatus === 'MERGED'}
              >
                Clear
              </MyButton>
              <MyButton
                disabled={
                  (encounterReadOnly && !isSavingEncounter) ||
                  localPatient?.patientStatus === 'MERGED' ||
                  isCheckingPatientAge ||
                  !isPatientAgeAllowed ||
                  isLoadingExistingAppointment
                }
                loading={isSavingEncounter}
                onClick={handleSave}
                prefixIcon={isSavingEncounter ? null : () => <FontAwesomeIcon icon={faCheckDouble} />}
              >
                {isSavingEncounter ? 'Saving...' : 'Save'}
              </MyButton>
            </>
          )
        },
        {
          title: 'Payment',
          icon: <FontAwesomeIcon icon={faFileInvoiceDollar} />,
          footer: (
            <>
              <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
                onClick={handlePaymentClear}
                disabled={paymentReadOnly}
              >
                Clear
              </MyButton>
              <MyButton
                appearance="primary"
                onClick={handlePaymentConfirm}
                disabled={paymentReadOnly || paymentConfirmLoading}
                loading={paymentConfirmLoading}
                prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
              >
                Confirm
              </MyButton>
            </>
          )
        }
      ]}
      content={(step: number) => <div dir={dir}>{conjureFormContent(step)}</div>}
      size="68vw"
      bodyheight="72vh"
      hideActionBtn={true}
      initialStep={initialStep}
    />
    <Modal
      open={existingAppointmentPromptOpen}
      onClose={closeExistingAppointmentPrompt}
      size="36vw"
      className="walk-in-existing-appointment-modal"
    >
      <Modal.Header>
        <Modal.Title>Existing appointment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="walk-in-existing-appointment__message">
          This patient already has an appointment in {departmentName} today that is not linked to
          an encounter. Load it to check in and continue with that appointment, or go back and
          choose another department — saving again checks that department.
        </p>
        <div className="walk-in-existing-appointment__list" role="radiogroup" aria-label="Appointments">
          {existingAppointments.map(appointment => {
            const appointmentId = appointmentRecordId(appointment);
            const selected = appointmentId === Number(selectedExistingAppointmentId);
            const timeLabel = formatAppointmentTime(appointment);
            const serviceLabel = formatEnumString(
              String(appointment?.service ?? appointment?.encounterReason ?? '')
            );
            const statusLabel = formatEnumString(
              String(appointment?.status ?? appointment?.appointmentStatus ?? '')
            );
            return (
              <button
                key={appointmentId}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`walk-in-existing-appointment__option${selected ? ' is-selected' : ''}`}
                onClick={() => setSelectedExistingAppointmentId(appointmentId)}
                disabled={promptBusy}
              >
                <span>{timeLabel || 'Today'}</span>
                <span>{serviceLabel || 'Appointment'}</span>
                <span>{statusLabel}</span>
              </button>
            );
          })}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="walk-in-existing-appointment__actions">
          <MyButton appearance="subtle" onClick={closeExistingAppointmentPrompt} disabled={promptBusy}>
            Change department
          </MyButton>
          <MyButton
            onClick={handleLoadExistingAppointment}
            disabled={promptBusy || !selectedExistingAppointmentId}
            loading={isLoadingExistingAppointment}
          >
            Load appointment
          </MyButton>
        </div>
      </Modal.Footer>
    </Modal>
  </div>
  );
};

export default PatientQuickAppointment;