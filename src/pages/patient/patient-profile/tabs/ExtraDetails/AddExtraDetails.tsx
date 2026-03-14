import React, { useEffect, useState } from 'react';
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
import { useGetActiveCountriesQuery } from '@/services/setup/country/countryService';
import { newPatientDocument } from '@/types/model-types-constructor-new';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { faIdCard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../styles.less';

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
    notfound: 'Patient document not found.'
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

  const [addPatientDocument] = useAddPatientDocumentMutation();
  const [updatePatientDocument] = useUpdatePatientDocumentMutation();
  const [addNoDocument] = useAddNoDocumentMutation();

  const patientDocumentEnum = useEnumOptions('DocumentType');
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');

  const PAGE_SIZE = 5;
  const [docCountryCache, setDocCountryCache] = useState([]);
  const [docCountryPage, setDocCountryPage] = useState(0);
  const [docCountrySearch, setDocCountrySearch] = useState('');
  const [docHasMoreCountries, setDocHasMoreCountries] = useState(true);
  const [docCountryOpen, setDocCountryOpen] = useState(false);
  const [docPaginationLoading, setDocPaginationLoading] = useState(false);

  const { data: docCountriesData } = useGetActiveCountriesQuery({
    page: docCountryPage,
    size: PAGE_SIZE,
    ...(docCountrySearch && { search: docCountrySearch }),
    sort: 'id,asc'
  });

  useEffect(() => {
    if (!docCountriesData?.data) return;

    const mapped = docCountriesData.data.map(c => ({
      ...c,
      displayName:
        conjureValueBasedOnKeyFromList(
          countryLovQueryResponse?.object ?? [],
          c.name,
          'lovDisplayVale'
        ) || c.name
    }));

    setDocCountryCache(prev => (docCountryPage === 0 ? mapped : [...prev, ...mapped]));

    setDocHasMoreCountries(docCountriesData.last === false);
    setDocPaginationLoading(false);
  }, [docCountriesData, docCountryPage, countryLovQueryResponse]);

  const loadMoreDocCountries = () => {
    if (!docHasMoreCountries || docPaginationLoading) return;
    setDocPaginationLoading(true);
    setDocCountryPage(p => p + 1);
  };

  useEffect(() => {
    const isNoDoc = secondaryDocument.type === 'NO_DOC' || secondaryDocument.type === 'NO_DOCUMENT';

    if (isNoDoc && !secondaryDocument.isPrimary) {
      setSecondaryDocument(prev => ({ ...prev, isPrimary: true }));
    }
  }, [secondaryDocument.type]);

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
        setRecord={r => setSecondaryDocument(prev => ({ ...prev, ...r }))}
      />

      {secondaryDocument.type !== 'NO_DOCUMENT' && (
        <MyInput
          required
          column
          width={300}
          fieldLabel="Document Country"
          fieldType="selectPagination"
          fieldName="countryId"
          selectData={docCountryCache}
          selectDataLabel="displayName"
          selectDataValue="id"
          searchKeyWard={docCountrySearch}
          setSearchKeyWard={v => {
            setDocCountrySearch(v);
            setDocCountryPage(0);
          }}
          hasMore={docHasMoreCountries}
          onFetchMore={loadMoreDocCountries}
          loading={docPaginationLoading}
          open={docCountryOpen}
          onOpen={() => setDocCountryOpen(true)}
          onClose={() => setDocCountryOpen(false)}
          onSelectItem={item => {
            setSecondaryDocument(prev => ({
              ...prev,
              countryId: item ? item.id : null
            }));

            if (!item) {
              setDocCountrySearch('');
              setDocCountryPage(0);
            }

            setDocCountryOpen(false);
          }}
          record={secondaryDocument}
        />
      )}

      {secondaryDocument.type !== 'NO_DOCUMENT' && (
        <MyInput
          required
          column
          width={300}
          fieldLabel="Document Number"
          fieldName="number"
          record={secondaryDocument}
          setRecord={r =>
            setSecondaryDocument(prev => ({
              ...prev,
              number:
                prev.type === 'NO_DOC' || prev.type === 'NO_DOCUMENT' ? 'NO_DOCUMENT' : r.number
            }))
          }
        />
      )}

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

  const handleClear = () => {
    setOpen(false);
    setSecondaryDocument({ ...newPatientDocument });
    setDocCountrySearch('');
    setDocCountryPage(0);
  };

  const handleSaveSecondaryDocument = async () => {
    const isNoDoc = secondaryDocument.type === 'NO_DOC' || secondaryDocument.type === 'NO_DOCUMENT';

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
          isPrimary: secondaryDocument.isPrimary ?? false
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
