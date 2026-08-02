import React, { useEffect, useMemo, useRef } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import {
  useAddNoDocumentMutation,
  useAddPatientDocumentMutation,
  useUpdatePatientDocumentMutation
} from '@/services/patients/patientDocumentsService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetActiveCountriesQuery } from '@/services/setup/country/countryService';
import { newPatientDocument } from '@/types/model-types-constructor-new';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatEnumString } from '@/utils';
import { faIdCard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../styles.less';
import clsx from 'clsx';

const SAUDI_ARABIA_CODE = 'SAUDI_ARABIA';

const toHumanPatientDocumentError = (
  err,
  fieldLabels = {
    type: 'Document Type',
    countryId: 'Document Country',
    number: 'Document Number',
    isPrimary: 'Primary Document'
  }
) => {
  const data = err?.data ?? {};
  const title = data.title ?? '';
  const detail = data.detail ?? '';
  const message = data.message ?? '';
  const type = data.type ?? '';

  const traceId =
    data.traceId || data.correlationId ? `\nTrace ID: ${data.traceId || data.correlationId}` : '';

  const isValidation =
    data?.message === 'error.validation' ||
    title?.toLowerCase()?.includes('argument not valid') ||
    (typeof type === 'string' && type.includes('constraint-violation'));

  const normalize = msg => {
    const m = (msg || '').toLowerCase();
    if (m.includes('must not be null')) return 'is required';
    if (m.includes('must not be empty')) return 'is required';
    if (m.includes('must not be blank')) return 'must not be blank';
    if (m.includes('size must be between')) return 'length is out of range';
    return msg || 'invalid value';
  };

  if (isValidation && Array.isArray(data.fieldErrors) && data.fieldErrors.length) {
    return (
      'Please fix the following fields:\n' +
      data.fieldErrors
        .map(fe => `• ${fieldLabels[fe.field] ?? fe.field}: ${normalize(fe.message)}`)
        .join('\n') +
      traceId
    );
  }

  let errorKey = data.errorKey || data.message || data.properties?.message || '';
  errorKey = errorKey.replace(/^error\./, '');

  const keyMap = {
    'payload.required': 'Document payload is required.',
    'patient.required': 'Patient ID is required.',
    'country.required': 'Document country is required.',
    'number.required': 'Document number is required.',
    'type.required': 'Document type is required.',
    'primary.exists': 'This patient already has a primary document.',
    'document.number.duplicate':
      'This document number already exists for the selected type and country.',
    'document.type.country.exists':
      'This patient already has a document of this type for the selected country.',
    notfound: 'Patient document not found.',
    'number.invalid.start': 'Document number has an invalid starting digit for the selected type.',
    'number.invalid.length': 'ID number should not be less than 10 digits.'
  };

  return (keyMap[errorKey] || detail || title || message || 'Unexpected error') + traceId;
};

const AddExtraDetails = ({
  localPatient,
  open,
  setOpen,
  secondaryDocument,
  setSecondaryDocument,
  refetch
}) => {
  const dispatch = useAppDispatch();
  console.log('Secondary Document:', secondaryDocument);
  const [addPatientDocument] = useAddPatientDocumentMutation();
  const [updatePatientDocument] = useUpdatePatientDocumentMutation();
  const [addNoDocument] = useAddNoDocumentMutation();

  const patientDocumentEnum = useEnumOptions('DocumentType', {
    exclude: ['NO_DOCUMENT', 'PASSPORT', 'DRIVING_LICENSE', 'BORDER_NUMBER', 'SOCIAL_CARD']
  });

  const enumLabels = useEnumOptions('CountryName');
  const enumLabelMap = useMemo(
    () => Object.fromEntries(enumLabels.map(o => [o.value, o.label])),
    [enumLabels]
  );

  const { data: activeCountriesResp } = useGetActiveCountriesQuery({ page: 0, size: 1000 });
  const countrySelectData = useMemo(
    () =>
      (activeCountriesResp?.data ?? []).map(c => ({
        value: c.id,
        label: enumLabelMap[c.name] || formatEnumString(c.name)
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCountriesResp]
  );
  const countrySelectDataRef = useRef(countrySelectData);
  countrySelectDataRef.current = countrySelectData;

  const saudiCountryId = useMemo(
    () => (activeCountriesResp?.data ?? []).find(c => c.name === SAUDI_ARABIA_CODE)?.id ?? null,
    [activeCountriesResp]
  );

  const validateDocument = () => {
    const { type, number, countryId } = secondaryDocument;
    const numberStr = String(number ?? '').trim();

    if (countryId !== saudiCountryId) return true;

    if (type === 'NATIONAL_ID') {
      if (!numberStr.startsWith('1')) {
        dispatch(notify({ msg: 'Saudi National ID number must start with 1.', sev: 'warning' }));
        return false;
      }
      if (numberStr.length < 10) {
        dispatch(notify({ msg: 'ID number should not be less than 10 digits.', sev: 'warning' }));
        return false;
      }
    }

    if (type === 'IQAMA' || type === 'BORDER_NUMBER') {
      if (!numberStr.startsWith('2')) {
        dispatch(notify({ msg: `Saudi ${type} number must start with 2.`, sev: 'warning' }));
        return false;
      }
      if (numberStr.length < 10) {
        dispatch(notify({ msg: 'ID number should not be less than 10 digits.', sev: 'warning' }));
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    if (open && !secondaryDocument.id) {
      setSecondaryDocument(prev => ({
        ...prev,
        type: prev.type || 'NATIONAL_ID',
        countryId: prev.countryId || saudiCountryId || null
      }));
    }
  }, [open, saudiCountryId]);

  const content = () => (
    <Form layout="inline" fluid    className={clsx('patient-doc-secondary-container', { 'disabled-panel': localPatient?.patientStatus === 'MERGED' })}>
      <MyInput
        required
        column
        width={300}
        fieldLabel="Document Type"
        fieldType="select"
        fieldName="type"
        selectData={patientDocumentEnum ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        searchable={false}
        record={secondaryDocument}
        setRecord={r => setSecondaryDocument(prev => ({ ...prev, ...r }))}
      />

      {secondaryDocument.type !== 'NO_DOCUMENT' && (
        <MyInput
          required
          column
          width={300}
          fieldLabel="Document Country"
          fieldType="select"
          fieldName="countryId"
          selectData={countrySelectData}
          selectDataLabel="label"
          selectDataValue="value"
          record={secondaryDocument}
          setRecord={r => setSecondaryDocument(prev => ({ ...prev, ...r }))}
        />
      )}

      {secondaryDocument.type !== 'NO_DOCUMENT' && (
        <MyInput
          required
          column
          width={300}
          fieldType="number"
          fieldLabel="Document Number"
          fieldName="number"
          record={secondaryDocument}
          setRecord={r =>
            setSecondaryDocument(prev => ({
              ...prev,
              number:
                prev.type === 'NO_DOC' || prev.type === 'NO_DOCUMENT'
                  ? 'NO_DOCUMENT'
                  : String(r.number ?? '')
            }))
          }
        />
      )}
    </Form>
  );

  const handleClear = () => {
    setOpen(false);
    setSecondaryDocument({ ...newPatientDocument });
  };

  const handleSaveSecondaryDocument = async () => {
    const isNoDoc = secondaryDocument.type === 'NO_DOC' || secondaryDocument.type === 'NO_DOCUMENT';

    if (!isNoDoc && !validateDocument()) {
      return;
    }

    try {
      if (isNoDoc) {
        await addNoDocument({
          patientId: localPatient.id,
          type: 'NO_DOCUMENT',
          isPrimary: true
        }).unwrap();
      } else {
        const payload = {
          ...secondaryDocument,
          patientId: localPatient.id,
          number: String(secondaryDocument.number ?? '').trim(),
          isPrimary: secondaryDocument.type === 'NATIONAL_ID'
        };

        secondaryDocument.id
          ? await updatePatientDocument(payload).unwrap()
          : await addPatientDocument(payload).unwrap();
      }

      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
      refetch();
      handleClear();
    } catch (err) {
      dispatch(notify({ msg: toHumanPatientDocumentError(err), sev: 'warning' }));
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      size="xs"
      bodyheight="60vh"
      title="Patient Document"
      content={content}
      actionButtonFunction={handleSaveSecondaryDocument}
      actionButtonLabel="Save"
      hideBack
      hideCancel={false}
      steps={[
        {
          title: 'Patient Document',
          icon: <FontAwesomeIcon icon={faIdCard} />
        }
      ]}
    />
  );
};

export default AddExtraDetails;