import MyInput from '@/components/MyInput';
import { useAppDispatch, useAppSelector } from '@/hooks';
import React from 'react';
import { Form } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import {
  useAddPatientDocumentMutation,
  useUpdatePatientDocumentMutation
} from '@/services/patients/patientDocumentsService';
import { newPatientDocument } from '@/types/model-types-constructor-new';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import { faIdCard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../styles.less';
import MyModal from '@/components/MyModal/MyModal';
import { useEnumOptions } from '@/services/enumsApi';

const toHumanPatientDocumentError = (err: any): string => {
  const data = err?.data ?? {};

  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  const message = data?.message || '';
  const title = data?.title || '';
  const detail = data?.detail || '';

  let errorKey = data?.errorKey;

  if (!errorKey && message) {
    const m = message.toLowerCase();

    if (m.includes('primary') && m.includes('exists')) {
      errorKey = 'primary.exists';
    } else if (m.includes('unique') || m.includes('duplicate')) {
      errorKey = 'unique.document';
    } else if (m.includes('payload')) {
      errorKey = 'payload.required';
    } else if (m.includes('patient id')) {
      errorKey = 'patient.required';
    } else if (m.includes('not found')) {
      errorKey = 'notfound';
    }
  }

  const map: Record<string, string> = {
    'payload.required': 'Document payload is missing. Please fill all required fields.',
    'patient.required': 'Patient ID is missing. Operation aborted.',
    'primary.exists':
      'This patient already has a primary document. Only one primary document can be assigned.',
    'unique.document': 'A document with the same number, type, and country already exists.',
    'db.constraint': 'Database constraint violation occurred while saving this document.',
    notfound: 'Patient document not found. It may have been removed.'
  };

  if (errorKey && map[errorKey]) return map[errorKey] + suffix;

  const fallback =
    detail || title || message || 'Unexpected error occurred while saving the patient document.';

  return fallback + suffix;
};

const AddExtraDetails = ({
  localPatient,
  open,
  setOpen,
  secondaryDocument,
  setSecondaryDocument,
  refetch
}) => {
  const authSlice = useAppSelector(state => state.auth);
  const [addPatientDocument] = useAddPatientDocumentMutation();
  const [updatePatientDocument] = useUpdatePatientDocumentMutation();

  const patientDocumentEnum = useEnumOptions('DocumentType');
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');

  const dispatch = useAppDispatch();

  const content = () => (
    <Form layout="inline" fluid className="patient-doc-secondary-container">
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
        setRecord={newRecord => setSecondaryDocument({ ...secondaryDocument, ...newRecord })}
      />

      <MyInput
        required
        column
        width={300}
        fieldLabel="Document Number"
        fieldName="number"
        disabled={secondaryDocument.type === 'NO_DOC'}
        record={secondaryDocument}
        setRecord={newRecord =>
          setSecondaryDocument({
            ...secondaryDocument,
            ...newRecord,
            number: secondaryDocument.type === 'NO_DOC' ? 'NO_DOC' : newRecord.number
          })
        }
      />

      <MyInput
        column
        fieldLabel="Primary Document"
        fieldName="isPrimary"
        fieldType="checkbox"
        record={secondaryDocument}
        setRecord={newRecord => setSecondaryDocument({ ...secondaryDocument, ...newRecord })}
      />
    </Form>
  );

  const handleClear = () => {
    setOpen(false);
    setSecondaryDocument(newPatientDocument);
  };

  const handleSaveSecondaryDocument = () => {
    const documentData = {
      ...secondaryDocument,
      patientId: localPatient.id,
      isPrimary: secondaryDocument.isPrimary ?? false,
      countryId: secondaryDocument.countryId ?? 14,
      number: secondaryDocument.type === 'NO_DOC' ? 'No Document' : secondaryDocument.number
    };

    if (!secondaryDocument.id) {
      addPatientDocument({
        ...documentData,
        createdBy: authSlice.user.login
      })
        .unwrap()
        .then(() => {
          dispatch(notify({ msg: 'Document Added Successfully', sev: 'success' }));
          refetch();
          handleClear();
        })
        .catch(err => {
          const msg = toHumanPatientDocumentError(err);
          dispatch(notify({ msg, sev: 'error' }));
          console.error('Error adding document:', err);
        });

      return;
    }

    updatePatientDocument({
      id: secondaryDocument.id,
      ...documentData,
      lastModifiedBy: authSlice.user.login
    })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Document Updated Successfully', sev: 'success' }));
        refetch();
        handleClear();
      })
      .catch(err => {
        const msg = toHumanPatientDocumentError(err);
        dispatch(notify({ msg, sev: 'error' }));
        console.error('Error updating document:', err);
      });
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
