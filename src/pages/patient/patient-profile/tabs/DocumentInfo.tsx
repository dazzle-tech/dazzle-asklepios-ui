import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';

import {
  useAddPatientDocumentMutation,
  useUpdatePatientDocumentMutation,
  useGetPrimaryDocumentsByPatientQuery
} from '@/services/patients/patientDocumentsService';
import { useEnumOptions } from '@/services/enumsApi';

import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { newPatientDocument } from '@/types/model-types-constructor-new';
import { PatientDocument } from '@/types/model-types-new';
import clsx from 'clsx';

const DocumentInfo = ({
  validationResult,
  localPatient,
  patientDocumentEnum
}) => {
  const dispatch = useAppDispatch();
  const countryOptions = useEnumOptions('CountryName');

  const patientId = localPatient?.id;

  const [doc, setDoc] = useState<PatientDocument>({ ...newPatientDocument});

  const { data: primaryDocs } = useGetPrimaryDocumentsByPatientQuery(
    { patientId },
    { skip: !patientId }
  );
  const [addDoc] = useAddPatientDocumentMutation();
  const [updateDoc] = useUpdatePatientDocumentMutation();

  useEffect(() => {
    if (!patientId) {
      setDoc({ ...newPatientDocument });
      return;
    }

    // If server returned a primary document
    if (primaryDocs && primaryDocs.length > 0) {
      setDoc(primaryDocs[0]);
    } else {
      // New document (empty)
      setDoc({
        ...newPatientDocument,
        patientId,
      });
    }
  }, [patientId, primaryDocs]);

  // Set default type ONLY when:
  // - document is NEW (no id)
  // - type is empty
  // - enum is loaded
  useEffect(() => {
    if (!doc?.id && (!doc.type || doc.type.trim() === '') && patientDocumentEnum?.length > 0) {
      setDoc(prev => ({
        ...prev,
        type: patientDocumentEnum[0].value
      }));
    }
  }, [doc, patientDocumentEnum]);

  // Helper: remove undefined
  const stripUndefined = obj =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));


  const handleSave = async () => {
    if (!patientId) return;

    const payload = stripUndefined({
      ...doc,
      patientId,
      countryId: 14,
      category: 'PRIMARY'
    });

    try {
      const saved = doc?.id
        ? await updateDoc({ id: doc.id, ...payload }).unwrap()
        : await addDoc(payload).unwrap();

      setDoc(saved);

      dispatch(
        notify({
          msg: doc?.id ? 'Document Updated Successfully' : 'Document Added Successfully',
          sev: 'success'
        })
      );
    } catch (err: any) {
      const backendMsg =
        err?.data?.detail || err?.data?.message || err?.error || 'Error while saving document';

      dispatch(
        notify({
          msg: backendMsg,
          sev: 'error'
        })
      );
    }
  };

  return (
    <SectionContainer
      title={
        <div className="flex-row-22">
          Document
          <MyButton onClick={handleSave} disabled={!patientId}  
              className={clsx('icon-button', { 'not-allowed-cell': localPatient?.patientStatus === 'MERGED' })}
              style={{ cursor: localPatient?.patientStatus === 'MERGED' ? 'not-allowed' : 'pointer' }}
          >
            {doc?.id ? 'Update' : 'Save'}
          </MyButton>
        </div>
      }
      content={
        <Form layout="inline" fluid>
          <MyInput
            disabled
            required
            vr={validationResult}
            column
            fieldLabel="Document Type"
            fieldType="select"
            fieldName="type"
            selectData={patientDocumentEnum ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            record={doc}
            setRecord={setDoc}
          />
          <MyInput
            required
            vr={validationResult}
            column
            fieldLabel="Document Country"
            fieldType="select"
            fieldName="countryName"
            selectData={countryOptions}
            selectDataLabel="label"
            selectDataValue="value"
            record={doc}
            setRecord={setDoc}
            disabled={doc.type === 'NO_DOC'}
            menuMaxHeight={200}
          />
          <MyInput
            required
            vr={validationResult}
            column
            fieldLabel="Document Number"
            fieldName="textnumber"
            record={doc}
            setRecord={setDoc}
            disabled={doc.type === 'NO_DOC'}
          />
        </Form>
      }
    />
  );
};

export default DocumentInfo;
