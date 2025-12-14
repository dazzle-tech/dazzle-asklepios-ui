import React, { useEffect } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import {
  useAddNoDocumentMutation,
  useAddPatientDocumentMutation,
  useUpdatePatientDocumentMutation
} from '@/services/patients/patientDocumentsService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newPatientDocument } from '@/types/model-types-constructor-new';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { faIdCard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../styles.less';

/* ========================================================= */
/* ======================= ERROR HANDLING =================== */
/* ========================================================= */

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

  const payloadText = [title, detail, message].filter(Boolean).join(' | ');

  /* ===========================================================
     1) VALIDATION FIELD ERRORS
     =========================================================== */

  const isValidation =
    data?.message === 'error.validation' ||
    title?.toLowerCase()?.includes?.('argument not valid') ||
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
    const lines = data.fieldErrors.map(fe => {
      const label = fieldLabels[fe.field] ?? fe.field;
      return `• ${label}: ${normalize(fe.message)}`;
    });

    return `Please fix the following fields:\n${lines.join('\n')}${traceId}`;
  }

  /* ===========================================================
     2) HIBERNATE / ConstraintViolation Parsing
     =========================================================== */

  const looksLikeConstraintViolation =
    payloadText.toLowerCase().includes('constraintviolation') ||
    payloadText.toLowerCase().includes('interpolatedmessage=');

  if (looksLikeConstraintViolation) {
    const matches = [];
    const regex = /propertyPath\s*=\s*([a-zA-Z0-9_.\[\]]+).*?interpolatedMessage\s*=\s*'([^']+)'/g;

    let m;
    while ((m = regex.exec(payloadText)) !== null) {
      matches.push({ field: m[1], msg: m[2] });
    }

    if (matches.length) {
      const lines = matches.map(({ field, msg }) => {
        const base =
          field
            .split(/[.\[\]]/)
            .filter(Boolean)
            .pop() || field;
        const label = fieldLabels[base] ?? base;

        return `• ${label}: ${normalize(msg)}`;
      });

      return `Please fix the following fields:\n${lines.join('\n')}${traceId}`;
    }
  }

  /* ===========================================================
     3) BACKEND CUSTOM ERROR KEYS — FIXED VERSION
     =========================================================== */

  let errorKey = data.errorKey || data.message || data.properties?.message || '';

  errorKey = errorKey.replace(/^error\./, '');

  const keyMap = {
    'payload.required': 'Document payload is required.',
    'patient.required': 'Patient ID is required.',
    'country.required': 'Document country is required.',
    'number.required': 'Document number is required.',
    'type.required': 'Document type is required.',
    'primary.exists': 'This patient already has a primary document.',
    'unique.document': 'A document with the same number, type, and country already exists.',
    'db.constraint': 'Database constraint violation.',
    notfound: 'Patient document not found.'
  };

  if (keyMap[errorKey]) {
    return keyMap[errorKey] + traceId;
  }

  /* ===========================================================
     4) FALLBACK
     =========================================================== */

  return detail || title || message || 'Unexpected error' + traceId;
};

/* ========================================================= */
/* ======================== COMPONENT ======================= */
/* ========================================================= */

const AddExtraDetails = ({
  localPatient,
  open,
  setOpen,
  secondaryDocument,
  setSecondaryDocument,
  refetch
}) => {
  const dispatch = useAppDispatch();

  const [addPatientDocument] = useAddPatientDocumentMutation();
  const [updatePatientDocument] = useUpdatePatientDocumentMutation();
  const [addNoDocument] = useAddNoDocumentMutation();

  const patientDocumentEnum = useEnumOptions('DocumentType');
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');

  useEffect(() => {
    const isNoDocument =
      secondaryDocument.type === 'NO_DOC' || secondaryDocument.type === 'NO_DOCUMENT';

    if (isNoDocument && !secondaryDocument.isPrimary) {
      setSecondaryDocument(prev => ({
        ...prev,
        isPrimary: true
      }));
    }
  }, [secondaryDocument.type, secondaryDocument.isPrimary]);

  /* ============================= Modal Content ============================= */

  const content = () => (
    <Form layout="inline" fluid className="patient-doc-secondary-container">
      {/* TYPE */}
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
        setRecord={newRecord => setSecondaryDocument({ ...secondaryDocument, ...newRecord })}
      />

      {/* COUNTRY */}
      {secondaryDocument.type !== 'NO_DOCUMENT' && (
        <MyInput
          required
          column
          width={300}
          fieldLabel="Document Country"
          fieldType="select"
          fieldName="countryId"
          selectData={countryLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={secondaryDocument}
          setRecord={newRecord =>
            setSecondaryDocument({
              ...secondaryDocument,
              ...newRecord
            })
          }
        />
      )}

      {/* NUMBER */}
      {secondaryDocument.type !== 'NO_DOCUMENT' && (
        <MyInput
          required
          column
          width={300}
          fieldLabel="Document Number"
          fieldName="number"
          disabled={secondaryDocument.type === 'NO_DOC' || secondaryDocument.type === 'NO_DOCUMENT'}
          record={secondaryDocument}
          setRecord={newRecord =>
            setSecondaryDocument({
              ...secondaryDocument,
              ...newRecord,
              number:
                secondaryDocument.type === 'NO_DOC' || secondaryDocument.type === 'NO_DOCUMENT'
                  ? 'NO_DOCUMENT'
                  : newRecord.number
            })
          }
        />
      )}

      {/* PRIMARY FLAG */}
      <MyInput
        width={200}
        column
        fieldLabel="Primary Document"
        fieldType="checkbox"
        fieldName="isPrimary"
        disabled={secondaryDocument.type === 'NO_DOC' || secondaryDocument.type === 'NO_DOCUMENT'}
        record={secondaryDocument}
        setRecord={setSecondaryDocument}
      />
    </Form>
  );

  /* ============================= Reset modal ============================= */

  const handleClear = () => {
    setOpen(false);
    setSecondaryDocument({ ...newPatientDocument });
  };

  /* ============================= SAVE DOCUMENT HANDLER ============================= */

  const handleSaveSecondaryDocument = async () => {
    const isNoDoc = secondaryDocument.type === 'NO_DOC' || secondaryDocument.type === 'NO_DOCUMENT';

    const logError = (prefix: string, err: any) => {
      console.log(`${prefix} (raw):`, err);
      const msg = toHumanPatientDocumentError(err);
      console.log(`${prefix} (human):`, msg);

      dispatch(notify({ msg, sev: 'error' }));
    };

    /* =========================== NO DOCUMENT CASE =========================== */

    if (isNoDoc) {
      try {
        await addNoDocument({
          patientId: localPatient.id,
          type: 'NO_DOCUMENT',
          isPrimary: true
        }).unwrap();

        dispatch(notify({ msg: 'No Document Added Successfully', sev: 'success' }));

        refetch();
        handleClear();
      } catch (err) {
        logError('Error adding NO_DOCUMENT', err);
      }

      return;
    }

    /* =========================== DOCUMENT DATA =========================== */

    const documentData = {
      ...secondaryDocument,
      patientId: localPatient.id,
      isPrimary: secondaryDocument.isPrimary ?? false,
      countryId: 14,
      number: secondaryDocument.number
    };

    /* =========================== CREATE =========================== */

    if (!secondaryDocument.id) {
      try {
        await addPatientDocument(documentData).unwrap();

        dispatch(notify({ msg: 'Document Added Successfully', sev: 'success' }));

        refetch();
        handleClear();
      } catch (err) {
        logError('Error adding document', err);
      }

      return;
    }

    /* =========================== UPDATE =========================== */

    try {
      await updatePatientDocument({
        id: secondaryDocument.id,
        ...documentData,
          countryId: 14,
      }).unwrap();

      dispatch(notify({ msg: 'Document Updated Successfully', sev: 'success' }));

      refetch();
      handleClear();
    } catch (err) {
      logError('Error updating document', err);
    }
  };

  /* ============================= Render Component ============================= */

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
      hideBack={true}
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
