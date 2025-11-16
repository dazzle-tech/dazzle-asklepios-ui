import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useAddVisitDurationMutation,
  useUpdateVisitDurationMutation
} from '@/services/setup/visitDurationService';
import { VisitDuration } from '@/types/model-types-new';
import './style.less';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

/** ===================== Helpers ===================== */
const toHumanBackendError = (err: any, fieldLabels: Record<string, string> = {}): string => {
  const data = err?.data ?? {};
  const title = data?.title || '';
  const detail = data?.detail || '';
  const message = data?.message || '';
  const type = data?.type || '';
  const payloadText: string =
    [title, detail, message].filter(Boolean).join(' | ') || String(err?.error || '');

  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  // Bean Validation / MethodArgumentNotValid / ConstraintViolation
  const isValidation =
    data?.message === 'error.validation' ||
    (typeof title === 'string' && title.toLowerCase().includes('argument not valid')) ||
    (typeof type === 'string' && type.includes('constraint-violation'));

  if (isValidation && Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const normalizeMsg = (msg: string) => {
      const m = (msg || '').toLowerCase();
      if (m.includes('must not be null')) return 'is required';
      if (m.includes('must not be blank')) return 'must not be blank';
      if (m.includes('size must be between')) return 'length is out of range';
      if (m.includes('must be greater than')) return 'value is too small';
      if (m.includes('must be greater than or equal to')) return 'value is too small';
      if (m.includes('must be less than')) return 'value is too large';
      if (m.includes('must be less than or equal to')) return 'value is too large';
      return msg || 'invalid value';
    };
    const lines = data.fieldErrors.map((fe: any) => {
      const label = fieldLabels[fe.field] ?? fe.field;
      return `• ${label}: ${normalizeMsg(fe.message)}`;
    });
    return `Please fix the following fields:\n${lines.join('\n')}${suffix}`;
  }

  const lowerPayload = payloadText.toLowerCase();
  const looksLikeConstraintViolations =
    lowerPayload.includes('constraintviolation') || lowerPayload.includes('interpolatedmessage=');

  if (looksLikeConstraintViolations) {
    const matches: Array<{ field: string; msg: string }> = [];
    const re = /propertyPath\s*=\s*([a-zA-Z0-9_.[\]]+).*?interpolatedMessage\s*=\s*'([^']+)'/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(payloadText)) !== null) {
      matches.push({ field: m[1], msg: m[2] });
    }
    if (matches.length === 0) {
      const re2 = /propertyPath\s*=\s*([a-zA-Z0-9_.[\]]+).*?messageTemplate\s*=\*?\s*'([^']+)'/g;
      while ((m = re2.exec(payloadText)) !== null) {
        matches.push({ field: m[1], msg: m[2] });
      }
    }
    if (matches.length > 0) {
      const normalizeMsg = (msg: string) => {
        const l = msg.toLowerCase();
        if (l.includes('notnull') || l.includes('must not be null')) return 'is required';
        if (l.includes('notblank') || l.includes('must not be blank')) return 'must not be blank';
        if (l.includes('positive') || l.includes('must be greater than'))
          return 'value is too small';
        if (l.includes('max') || l.includes('less than or equal')) return 'value is too large';
        if (l.includes('min') || l.includes('greater than or equal')) return 'value is too small';
        return msg.replace(/[{}]/g, '') || 'invalid value';
      };
      const toLabel = (rawField: string) => {
        const base =
          rawField
            .split(/[.[\]]/)
            .filter(Boolean)
            .pop() || rawField;
        return fieldLabels[base] ?? fieldLabels[rawField] ?? base;
      };
      const lines = matches.map(({ field, msg }) => `• ${toLabel(field)}: ${normalizeMsg(msg)}`);
      return `Please fix the following fields:\n${lines.join('\n')}${suffix}`;
    }
  }

  if (title.toLowerCase().includes('failed to read request')) {
    return (
      'Some fields have invalid format (e.g. empty value for enum or number). ' +
      'Please select valid options or clear numeric fields.' +
      suffix
    );
  }

  // errorKey jhipster-style
  const errorKey = message.startsWith('error.') ? message.substring(6) : undefined;
  const keyMap: Record<string, string> = {
    // common
    'payload.required': 'Visit duration payload is required.',
    'db.constraint': 'Database constraint violation while saving visit duration.',
    notfound: 'Visit duration not found.',
    // custom VisitDuration
    'visitType.required': 'Visit Type is required.',
    'unique.visitDuration.global':
      'A global visit duration with the same visit type and duration already exists.'
  };

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    (data?.errorKey && keyMap[data.errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  return humanMsg + suffix;
};

/** ===================== Component ===================== */

interface VisitDurationSetupModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  mode: 'add' | 'edit';
  record?: VisitDuration;
  onSuccess?: () => void;
}

const VisitDurationSetupModal: React.FC<VisitDurationSetupModalProps> = ({
  open,
  setOpen,
  mode,
  record: initialRecord,
  onSuccess
}) => {
  const dispatch = useAppDispatch();

  const [formRecord, setFormRecord] = useState<any>({});

  const [addVisitDuration, { isLoading: isAdding }] = useAddVisitDurationMutation();
  const [updateVisitDuration, { isLoading: isUpdating }] = useUpdateVisitDurationMutation();
  const isSaving = isAdding || isUpdating;

  // visit type LOV
  const visitType = useEnumOptions('VisitType');

  // fill form (edit / add)
  useEffect(() => {
    if (mode === 'edit' && initialRecord) {
      setFormRecord({
        visitType: initialRecord.visitType ?? '',
        duration: initialRecord.durationInMinutes ?? '',
        resourceSpecific: initialRecord.resourceSpecific ?? false
      });
    } else {
      setFormRecord({
        visitType: '',
        duration: '',
        resourceSpecific: false
      });
    }
  }, [mode, initialRecord]);

  const handleSave = async () => {
    if (!formRecord.visitType || formRecord.duration === '' || formRecord.duration == null) {
      dispatch(
        notify({
          msg: 'Visit Type and Duration are required',
          sev: 'error'
        })
      );
      return;
    }

    const durationValue =
      typeof formRecord.duration === 'string' ? Number(formRecord.duration) : formRecord.duration;

    if (Number.isNaN(durationValue)) {
      dispatch(
        notify({
          msg: 'Duration must be a valid number',
          sev: 'error'
        })
      );
      return;
    }

    const payload: Partial<VisitDuration> = {
      visitType: formRecord.visitType ?? null,
      durationInMinutes: durationValue,
      resourceSpecific: !!formRecord.resourceSpecific
    };

    try {
      if (mode === 'add') {
        await addVisitDuration(payload).unwrap();
        dispatch(
          notify({
            msg: 'Visit Duration added successfully',
            sev: 'success'
          })
        );
      } else if (mode === 'edit' && initialRecord?.id != null) {
        await updateVisitDuration({
          id: initialRecord.id,
          visitType: payload.visitType ?? null,
          durationInMinutes: payload.durationInMinutes ?? null,
          resourceSpecific: payload.resourceSpecific
        }).unwrap();
        dispatch(
          notify({
            msg: 'Visit Duration updated successfully',
            sev: 'success'
          })
        );
      }

      if (onSuccess) onSuccess();
      setOpen(false);
    } catch (err: any) {
      const msg = toHumanBackendError(err, {
        visitType: 'Visit Type',
        durationInMinutes: 'Duration',
        resourceSpecific: 'Resource Specific'
      });
      setFormRecord({
        visitType: '',
        duration: '',
        resourceSpecific: false
      });
      dispatch(
        notify({
          msg,
          sev: 'error'
        })
      );
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Visit Duration Setup"
      steps={[{ title: 'Visit Duration Setup', icon: <FontAwesomeIcon icon={faEye} /> }]}
      size="33vw"
      position="right"
      actionButtonLabel={isSaving ? 'Saving...' : 'Save'}
      actionButtonFunction={handleSave}
      content={
        <Form fluid layout="vertical" className="visit-duration-modal-form">
          <div className="top-row">
            <MyInput
              width="13vw"
              fieldName="visitType"
              fieldType="select"
              selectData={visitType}
              selectDataLabel="label"
              selectDataValue="value"
              record={formRecord}
              setRecord={setFormRecord}
              fieldLabel="Visit Type"
              required
            />

            <MyInput
              width="10vw"
              fieldName="duration"
              fieldType="number"
              record={formRecord}
              setRecord={setFormRecord}
              fieldLabel="Duration"
              placeholder="Enter duration"
              rightAddon="Min"
              required
            />
          </div>

          <div className="middle-row">
            <MyInput
              width="13vw"
              fieldName="resourceSpecific"
              fieldType="check"
              record={formRecord}
              setRecord={setFormRecord}
              fieldLabel="Resource Specific"
              showLabel={false}
            />
          </div>
        </Form>
      }
    />
  );
};

export default VisitDurationSetupModal;
