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
import '../styles.less';
import RegistrationEncounter from './RegistrationEncounter';
import PatientPaymentInfo, { PatientPaymentInfoHandle } from './PatientPaymentInfo';
import type { PatientEncounter } from '@/types/model-types-new';
import {
  newPatientEncounter,
  newPatientInsurance,
  newPatientPayments
} from '@/types/model-types-constructor-new';
import {
  useCreateQuickAppointmentMutation
} from '@/services/appointment/appointmentService';
import { useAcceptReferralRequestMutation } from '@/services/medicalsheetsEncounter/referralRequestService';
import { useLazyGetEncountersByPatientQuery } from '@/services/encounters/patientEncounterService';
import * as modelTypes from '@/types/model-types-new';

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
  'patient.department.date.duplicate':
    'Patient already has same department encounter Today',
  'department.date.sequence.duplicate':
    'Daily sequence number already exists for this department and date. Please try again.',
  'patient.emergency.notAllowed.withOngoing':
    'Patient currently treated by another doctor',
  duplicate: 'Duplicate record.',
  'facility.invalid': 'Invalid facility id.',
  'department.invalid': 'Invalid department id.',
  'practitioner.invalid': 'Invalid practitioner id.',
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
    patientId: Number(localPatient?.id ?? localPatient?.key ?? 0),
    facilityId: Number(localReferral?.toFacilityId ?? 0),
    departmentId: Number(localReferral?.toDepartmentId ?? 0),
    encounterDate: new Date()
  });

  const [isReadOnly] = useState(isDisabeld);
  const [isEncounterSaved, setIsEncounterSaved] = useState(false);
  const [validationResult, setValidationResult] = useState<any>({});

  const paymentRef = useRef<PatientPaymentInfoHandle | null>(null);
  const [isPaymentSaved, setIsPaymentSaved] = useState(false);

  const isViewMode = Boolean(isDisabeld);
  const isPaymentMode = initialStep === 1;
  const isLockedAfterPayment = Boolean(isPaymentSaved);

  const encounterReadOnly = Boolean(isReadOnly || isViewMode || isPaymentMode || isEncounterSaved);
  const paymentReadOnly = Boolean(isViewMode || isLockedAfterPayment);

  const [createQuickAppointment] = useCreateQuickAppointmentMutation();
  const [acceptReferralRequest] = useAcceptReferralRequestMutation();
  const [fetchPatientEncounters] = useLazyGetEncountersByPatientQuery();

  const didAcceptReferralRef = useRef(false);

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
    }
  }, [quickAppointmentModel]);

  const validateRequiredFields = () => {
    const missingFields: string[] = [];
    if (!localEncounter?.facilityId) missingFields.push('Facility');
    if (!localEncounter?.departmentId) missingFields.push('Department');
    if (!localEncounter?.encounterType) missingFields.push('Encounter Type');
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

  const checkDuplicateEncounter = async (
    patientId: number,
    departmentId: number,
    encounterDate: any
  ): Promise<boolean> => {
    if (!patientId || !departmentId || !encounterDate) return false;
    try {
      const result: any = await fetchPatientEncounters(
        { patientId, page: 0, size: 200, sort: 'createdDate,desc' },
        true
      ).unwrap();

      const list: any[] = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
        ? result
        : [];

      return list.some((e: any) => {
        const sameDept =
          Number(e?.departmentId ?? e?.department?.id ?? 0) === Number(departmentId);
        const status = String(e?.status ?? '').toUpperCase();
        const isCancelled = status === 'CANCELLED';
        const dateValue = e?.encounterDate ?? e?.createdDate;
        return sameDept && !isCancelled && isSameLocalDate(dateValue, encounterDate);
      });
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateRequiredFields()) return;

    const patientId = Number(localPatient?.id ?? localPatient?.key ?? 0);
    const practitionerId = Number(localEncounter?.practitionerId ?? 0);
    const departmentId = Number(localEncounter?.departmentId ?? 0);

    const hasDuplicate = await checkDuplicateEncounter(
      patientId,
      departmentId,
      localEncounter?.encounterDate
    );

    if (hasDuplicate) {
      dispatch(
        notify({
          msg: 'Patient already has same department encounter Today',
          sev: 'error'
        })
      );
      return;
    }

    try {

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
        reason: (localEncounter as any)?.chiefComplaint  as string | null,
        note: (localEncounter?.notes ?? null) as string | null,
        followUpEncounterId:
          localEncounter?.encounterReason === 'FOLLOW_UP' && localEncounter?.followUpEncounterId
            ? Number(localEncounter.followUpEncounterId)
            : null,
        originType: (localEncounter as any)?.originType ?? null,
        originName: (localEncounter as any)?.originName ?? null
      };

      const saved = await createQuickAppointment(payload).unwrap();
      const returnedEncounter = (saved as any)?.encounter ?? null;
      const returnedAppointment = (saved as any)?.appointmentFromTemplate ?? null;
      const createdEncounterId = Number(returnedEncounter?.id ?? 0) || localEncounter?.id || 0;

      if (returnedEncounter && typeof returnedEncounter === 'object') {
        setLocalEncounter(prev => ({ ...prev, ...returnedEncounter }));
      } else {
        setLocalEncounter(prev => ({ ...prev, id: createdEncounterId || prev.id }));
      }
      setPaymentDraft((prev: any) => ({
        ...prev,
        encounterId: createdEncounterId || prev.encounterId
      }));
      if (returnedAppointment && typeof returnedAppointment === 'object') {
        setValidationResult((prev: any) => ({ ...prev, appointmentFromTemplate: returnedAppointment }));
      }
      setIsEncounterSaved(true);

      if (
        openedFromReferral &&
        localReferral?.id &&
        !didAcceptReferralRef.current
      ) {
        await acceptReferralRequest({ id: localReferral.id }).unwrap();
        didAcceptReferralRef.current = true;
      }

      dispatch(notify({ msg: 'Quick appointment saved successfully', sev: 'success' }));

      if (onEncounterSaved) await onEncounterSaved();
    } catch (err: any) {
      setValidationResult(err?.data ?? err);
      handleCrudError(err, dispatch, ENCOUNTER_ERROR_MAP);
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

      setIsPaymentSaved(true);

      if (onEncounterSaved) await onEncounterSaved();

      setQuickAppointmentModel(false);
      dispatch(notify({ msg: 'Payment Confirmed Successfully', sev: 'success' }));
    } catch (err: any) {
      dispatch(notify({ msg: 'Error confirming payment', sev: 'error' }));
    }
  };

  const handlePaymentClear = () => {
    paymentRef.current?.clear();
    setIsPaymentSaved(false);
  };

  const conjureFormContent = (stepNumber: number) => {
    switch (stepNumber) {
      case 0:
        return (
          <RegistrationEncounter
            localEncounter={localEncounter}
            setLocalEncounter={setLocalEncounter}
            isReadOnly={encounterReadOnly}
            localPatient={localPatient}
            localReferral={localReferral}
            openedFromReferral={openedFromReferral}
          />
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


  return (<div dir={dir}>
    <MyModal
      open={quickAppointmentModel}
      setOpen={setQuickAppointmentModel}
      title="Quick Appointment"
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
                disabled={encounterReadOnly}
              >
                Clear
              </MyButton>
              <MyButton
                disabled={encounterReadOnly}
                onClick={handleSave}
                prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
              >
                Save
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
                disabled={paymentReadOnly}
                prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
              >
                Confirm
              </MyButton>
            </>
          )
        }
      ]}
      content={(step: number) => <div dir={dir}>{conjureFormContent(step)}</div>}
      size="55vw"
      bodyheight="65vh"
      hideActionBtn={true}
      initialStep={initialStep}
    />
    </div>
  );
};

export default PatientQuickAppointment;