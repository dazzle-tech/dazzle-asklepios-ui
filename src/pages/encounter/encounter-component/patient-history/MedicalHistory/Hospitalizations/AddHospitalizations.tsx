import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHospitalUser } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';

import {
  useAddHospitalizationMutation,
  useUpdateHospitalizationMutation
} from '@/services/patients/hospitalizationsService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import Translate from '@/components/Translate';
import {
  DURATION_TYPE_OPTIONS,
  getSavedDuration,
  isIncompleteDuration,
  isSameCalendarDay,
  resolveDurationInput
} from '@/utils/durationDate';
import './style.less';

const PATIENT_IS_FREE_TEXT = 'Patient is Free';

/*  ERROR HANDLER  */

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  /*  FIELD ERRORS  */
  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const normalizeMsg = (msg: string) => {
      const m = (msg || '').toLowerCase();
      if (m.includes('must not be null')) return 'is required';
      if (m.includes('must not be blank')) return 'must not be blank';
      if (m.includes('size must be between')) return 'length is out of range';
      if (m.includes('must be greater')) return 'value is too small';
      if (m.includes('must be less')) return 'value is too large';
      return msg || 'invalid value';
    };

    const lines = data.fieldErrors.map((fe: any) => `• ${fe.field}: ${normalizeMsg(fe.message)}`);

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix,
        sev: 'error'
      })
    );
    return;
  }

  /*  CONSTRAINT VIOLATIONS  */
  const messageProp: string = data?.message || '';

  if (
    messageProp.includes('ConstraintViolationImpl') ||
    messageProp.includes('Validation failed')
  ) {
    const violations: string[] = [];
    const pattern = /propertyPath=(\w+).*?interpolatedMessage='([^']+)'/g;
    let match;

    while ((match = pattern.exec(messageProp)) !== null) {
      const field = match[1];
      const message = match[2];

      const normalized = message.includes('must not be null')
        ? 'is required'
        : message.includes('must not be blank')
        ? 'must not be blank'
        : message;

      violations.push(`• ${field}: ${normalized}`);
    }

    if (violations.length > 0) {
      dispatch(
        notify({
          msg: `Please fix the following fields:\n${violations.join('\n')}` + suffix,
          sev: 'error'
        })
      );
      return;
    }
  }

  /*  BUSINESS / DB ERRORS  */
  const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : data?.errorKey;

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
};

/*  ERROR MAP  */

const PATIENT_ADMISSION_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Hospitalization payload is required.',
  'patient.invalid': 'Invalid patient reference.',
  duplicate: 'Hospitalization already exists for this patient.',
  'db.constraint': 'Database constraint violation.',
  'dateOfAdmission.required': 'Date of admission is required.',
  'admissionDuration.incomplete': 'Date Type and Number must be provided together.',
  'admissionDurationType.invalid': 'Date Type must be Years, Months or Days.',
  'admissionDuration.negative': 'Number must not be negative.',
  'admissionDuration.fraction': 'Number must be a whole number.',
  'admissionDuration.overflow': 'Number is too large.',
  'admissionDuration.outOfRange': 'The resulting date of admission is out of range.',
  notfound: 'Hospitalization record not found.'
};

/*  COMPONENT  */

const AddHospitalizations = ({ open, setOpen, initialData, patient }) => {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<any>({
    facility: '',
    reason: '',
    admissionType: '',
    dateOfAdmission: null,
    admissionDurationType: null,
    admissionDuration: null,
    lengthOfStayDays: null,
    outcomes: '',
    medicalInterventionsPerformed: '',
    patientId: null,
    patientIsFree: false,
    freeText: null
  });

  /*  LOAD  */

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        admissionDurationType: initialData.admissionDurationType ?? null,
        admissionDuration: initialData.admissionDuration ?? null,
        patientId: Number(patient?.id),
        patientIsFree: initialData.patientIsFree === true,
        freeText: initialData.freeText ?? null
      });
    } else {
      setFormData({
        facility: '',
        reason: '',
        admissionType: '',
        dateOfAdmission: null,
        admissionDurationType: null,
        admissionDuration: null,
        lengthOfStayDays: null,
        outcomes: '',
        medicalInterventionsPerformed: '',
        patientId: Number(patient?.id),
        patientIsFree: false,
        freeText: null
      });
    }
  }, [initialData, open, patient?.id]);

  useEffect(() => {
    setFormData(prev => {
      if (prev.patientIsFree === true) {
        return {
          ...prev,
          facility: '',
          reason: '',
          admissionType: '',
          dateOfAdmission: null,
          admissionDurationType: null,
          admissionDuration: null,
          lengthOfStayDays: null,
          outcomes: '',
          medicalInterventionsPerformed: '',
          freeText: PATIENT_IS_FREE_TEXT
        };
      }

      if (prev.freeText === PATIENT_IS_FREE_TEXT) {
        return {
          ...prev,
          freeText: null
        };
      }

      return prev;
    });
  }, [formData.patientIsFree]);

  /*  MUTATIONS  */

  const [addHospitalization] = useAddHospitalizationMutation();
  const [updateHospitalization] = useUpdateHospitalizationMutation();

  /*  ADMISSION DURATION  */

  const savedAdmissionDuration = getSavedDuration(
    initialData?.admissionDurationType,
    initialData?.admissionDuration,
    initialData?.dateOfAdmission
  );

  const handleAdmissionDurationChange = (next: any) => {
    const { durationType, duration, date, error } = resolveDurationInput(
      next?.admissionDurationType,
      next?.admissionDuration,
      savedAdmissionDuration
    );

    if (error) {
      dispatch(notify({ msg: error, sev: 'warning' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      admissionDurationType: durationType,
      admissionDuration: duration,
      ...(date ? { dateOfAdmission: date } : {})
    }));
  };

  const handleDateOfAdmissionChange = (next: any) => {
    const dateOfAdmission = next?.dateOfAdmission ?? null;
    if (isSameCalendarDay(dateOfAdmission, formData.dateOfAdmission)) return;
    setFormData(prev => ({
      ...prev,
      dateOfAdmission,
      admissionDurationType: null,
      admissionDuration: null
    }));
  };

  /*  SAVE  */

  const handleSave = async () => {
    const isFree = formData.patientIsFree === true;
    let errorMsg = '';

    if (!isFree) {
      if (!formData.facility) errorMsg = 'Facility can’t be empty';
      if (!formData.reason)
        errorMsg = errorMsg ? `${errorMsg}, Reason can’t be empty` : 'Reason can’t be empty';
      if (isIncompleteDuration(formData.admissionDurationType, formData.admissionDuration))
        errorMsg = errorMsg
          ? `${errorMsg}, Date Type and Number must be provided together`
          : 'Date Type and Number must be provided together';
      if (!formData.dateOfAdmission)
        errorMsg = errorMsg
          ? `${errorMsg}, Date of admission can’t be empty`
          : 'Date of admission can’t be empty';
      if (!formData.admissionType)
        errorMsg = errorMsg
          ? `${errorMsg}, Admission Type can’t be empty`
          : 'Admission Type can’t be empty';
    }

    if (errorMsg) {
      dispatch(notify({ msg: errorMsg, sev: 'warning' }));
      return;
    }

    const payload = {
      ...(formData.id ? { id: formData.id } : {}),
      patientId: Number(patient?.id),
      facility: isFree ? '' : formData.facility,
      reason: isFree ? '' : formData.reason,
      admissionType: isFree ? '' : formData.admissionType,
      dateOfAdmission: isFree ? null : formData.dateOfAdmission,
      admissionDurationType: isFree ? null : formData.admissionDurationType ?? null,
      admissionDuration: isFree ? null : formData.admissionDuration ?? null,
      lengthOfStayDays: isFree ? null : formData.lengthOfStayDays,
      outcomes: isFree ? '' : formData.outcomes,
      medicalInterventionsPerformed: isFree ? '' : formData.medicalInterventionsPerformed,
      patientIsFree: isFree,
      freeText: isFree ? PATIENT_IS_FREE_TEXT : null
    };

    try {
      if (formData.id) {
        await updateHospitalization(payload).unwrap();
        dispatch(notify({ msg: 'Hospitalization updated successfully', sev: 'success' }));
        setOpen(false);
      } else {
        await addHospitalization(payload).unwrap();
        dispatch(notify({ msg: 'Hospitalization added successfully', sev: 'success' }));
        setFormData({
          facility: '',
          reason: '',
          admissionType: '',
          dateOfAdmission: null,
          admissionDurationType: null,
          admissionDuration: null,
          lengthOfStayDays: null,
          outcomes: '',
          medicalInterventionsPerformed: '',
          patientId: Number(patient?.id),
          patientIsFree: false,
          freeText: null
        });
      }
    } catch (err: any) {
      handleCrudError(err, dispatch, PATIENT_ADMISSION_ERROR_MAP);
    }
  };


  const content = (
    <Form fluid className="hospitalization-form">
      <div className="hospitalization-full-width">
        <MyInput
          width="100%"
          column
          fieldLabel="Patient Is Free"
          fieldType="checkbox"
          fieldName="patientIsFree"
          record={formData}
          setRecord={setFormData}
        />
      </div>

      <div className="hospitalization-row">
        <div className="hospitalization-field">
          <MyInput
            width="100%"
            column
            fieldLabel="Facility"
            fieldName="facility"
            record={formData}
            setRecord={setFormData}
            required={!formData.patientIsFree}
            disabled={formData.patientIsFree}
          />
        </div>

        <div className="hospitalization-field">
          <MyInput
            width="100%"
            column
            fieldLabel="Admission Type"
            fieldName="admissionType"
            record={formData}
            setRecord={setFormData}
            required={!formData.patientIsFree}
            disabled={formData.patientIsFree}
          />
        </div>
      </div>

      <div className="hospitalization-full-width">
        <MyInput
          width="100%"
          column
          fieldLabel="Reason"
          fieldName="reason"
          record={formData}
          setRecord={setFormData}
          required={!formData.patientIsFree}
          disabled={formData.patientIsFree}
        />
      </div>

      <div className="hospitalization-admission">
        <div className="hospitalization-row">
          <div className="hospitalization-date-type">
            <MyInput
              width="100%"
              column
              fieldLabel="Date Type"
              fieldType="select"
              fieldName="admissionDurationType"
              selectData={DURATION_TYPE_OPTIONS}
              selectDataLabel="label"
              selectDataValue="value"
              record={formData}
              setRecord={handleAdmissionDurationChange}
              searchable={false}
              disabled={formData.patientIsFree}
            />
          </div>

          <div className="hospitalization-number">
            <MyInput
              width="100%"
              column
              fieldLabel="Number"
              fieldType="number"
              fieldName="admissionDuration"
              record={formData}
              setRecord={handleAdmissionDurationChange}
              min={0}
              step={1}
              showZero
              disabled={formData.patientIsFree || !formData.admissionDurationType}
            />
          </div>

          <div className="hospitalization-date">
            <MyInput
              width="100%"
              column
              fieldLabel="Date of admission"
              fieldType="date"
              fieldName="dateOfAdmission"
              record={formData}
              setRecord={handleDateOfAdmissionChange}
              disableFutureDates
              required={!formData.patientIsFree}
              disabled={formData.patientIsFree}
            />
          </div>
        </div>
      </div>

      <div className="hospitalization-row">
        <div className="hospitalization-field">
          <MyInput
            width="100%"
            column
            fieldLabel="Length of stay (Days)"
            fieldType="number"
            fieldName="lengthOfStayDays"
            record={formData}
            setRecord={setFormData}
            disabled={formData.patientIsFree}
          />
        </div>

        <div className="hospitalization-field">
          <MyInput
            width="100%"
            column
            fieldLabel="Outcomes"
            fieldName="outcomes"
            record={formData}
            setRecord={setFormData}
            disabled={formData.patientIsFree}
          />
        </div>
      </div>

      <div className="hospitalization-full-width">
        <MyInput
          width="100%"
          column
          fieldLabel="Medical Interventions Performed"
          fieldType="textarea"
          fieldName="medicalInterventionsPerformed"
          record={formData}
          setRecord={setFormData}
          disabled={formData.patientIsFree}
        />
      </div>
    </Form>
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add / Edit Hospitalizations  "
      steps={[{ title: 'Hospitalizations', icon: <FontAwesomeIcon icon={faHospitalUser} /> }]}
      actionButtonFunction={handleSave}
      position="right"
      size="33vw"
      content={<div dir={dir}>{content}</div>}
    />
  );
};

export default AddHospitalizations;
