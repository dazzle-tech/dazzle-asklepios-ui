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
  useCreateEncounterMutation,
  useUpdateEncounterMutation
} from '@/services/encounters/patientEncounterService';
import { useAcceptReferralRequestMutation } from '@/services/medicalsheetsEncounter/referralRequestService';
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
    'This patient already has an encounter in this department on the selected date.',
  'department.date.sequence.duplicate':
    'Daily sequence number already exists for this department and date. Please try again.',
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

  const [validationResult, setValidationResult] = useState<any>({});
  const [isReadOnly, setIsReadOnly] = useState(isDisabeld);
  const [isEncounterSaved, setIsEncounterSaved] = useState(false);

  const paymentRef = useRef<PatientPaymentInfoHandle | null>(null);
  const [isPaymentSaved, setIsPaymentSaved] = useState(false);

  const isViewMode = Boolean(isDisabeld);
  const isPaymentMode = initialStep === 1;
  const isLockedAfterPayment = Boolean(isPaymentSaved);

  const encounterReadOnly = Boolean(isReadOnly || isViewMode || isPaymentMode);
  const paymentReadOnly = Boolean(isViewMode || isLockedAfterPayment);

  const [createEncounter] = useCreateEncounterMutation();
  const [updateEncounter] = useUpdateEncounterMutation();
  const [acceptReferralRequest] = useAcceptReferralRequestMutation();

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

    if (missingFields.length > 0) {
      const lines = missingFields.map(field => `• ${field}: is required`);
      dispatch(
        notify({ msg: `Please fix the following fields:\n${lines.join('\n')}`, sev: 'warning' })
      );
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateRequiredFields()) return;

    try {
      const body: PatientEncounter = {
        ...localEncounter,
        patientId: Number(localPatient?.id ?? localPatient?.key ?? 0),
        encounterDate: localEncounter?.encounterDate ?? new Date()
      };

      const saved =
        body.id && Number(body.id) > 0
          ? await updateEncounter({ id: body.id, body }).unwrap()
          : await createEncounter({ body }).unwrap();

      const normalizedSaved: any = { ...saved };
      const v = normalizedSaved?.encounterDate;
      if (typeof v === 'string' || typeof v === 'number') {
        const d = new Date(v);
        if (!Number.isNaN(d.getTime())) normalizedSaved.encounterDate = d;
      }

      setLocalEncounter(prev => ({ ...prev, ...normalizedSaved }));
      setIsEncounterSaved(true);

      if (
        openedFromReferral &&
        localReferral?.id &&
        !didAcceptReferralRef.current
      ) {
        await acceptReferralRequest({ id: localReferral.id }).unwrap();
        didAcceptReferralRef.current = true;
      }

      dispatch(notify({ msg: 'Encounter Saved Successfully', sev: 'success' }));

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
          />
        );
      default:
        return null;
    }
  };

  return (
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
      content={(step: number) => conjureFormContent(step)}
      size="55vw"
      bodyheight="65vh"
      hideActionBtn={true}
      initialStep={initialStep}
    />
  );
};

export default PatientQuickAppointment;