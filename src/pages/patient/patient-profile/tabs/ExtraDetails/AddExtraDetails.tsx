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
import clsx from 'clsx';

const SAUDI_ARABIA_LOV_NAME = '1216848210951800';

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

  // ✅ Keep only NATIONAL_ID and IQAMA — SOCIAL_CARD also excluded
  const patientDocumentEnum = useEnumOptions('DocumentType', {
    exclude: ['NO_DOCUMENT', 'PASSPORT', 'DRIVING_LICENSE', 'BORDER_NUMBER', 'SOCIAL_CARD']
  });

  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');

  const PAGE_SIZE = 5;
  const [docCountryCache, setDocCountryCache] = useState([]);
  const [docCountryPage, setDocCountryPage] = useState(0);
  const [docCountrySearch, setDocCountrySearch] = useState('');
  const [docHasMoreCountries, setDocHasMoreCountries] = useState(true);
  const [docCountryOpen, setDocCountryOpen] = useState(false);
  const [docPaginationLoading, setDocPaginationLoading] = useState(false);
  const [saudiCountryId, setSaudiCountryId] = useState(null);

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

    // ✅ Capture Saudi Arabia's id once found in the loaded pages
    const saudi = mapped.find(c => c.name === SAUDI_ARABIA_LOV_NAME);
    if (saudi) {
      setSaudiCountryId(saudi.id);
    }
  }, [docCountriesData, docCountryPage, countryLovQueryResponse]);

  // ✅ Set defaults when modal opens for a new document
  useEffect(() => {
    if (open && !secondaryDocument.id) {
      setSecondaryDocument(prev => ({
        ...prev,
        type: prev.type || 'NATIONAL_ID',
        countryId: prev.countryId || saudiCountryId || null
      }));
    }
  }, [open, saudiCountryId]);

  // ✅ If Saudi id resolves after modal is already open, apply it
  useEffect(() => {
    if (open && !secondaryDocument.id && saudiCountryId && !secondaryDocument.countryId) {
      setSecondaryDocument(prev => ({ ...prev, countryId: saudiCountryId }));
    }
  }, [saudiCountryId]);

  const loadMoreDocCountries = () => {
    if (!docHasMoreCountries || docPaginationLoading) return;
    setDocPaginationLoading(true);
    setDocCountryPage(p => p + 1);
  };

  const isSaudiCountry = () => {
    if (!secondaryDocument.countryId) return false;
    const selected = docCountryCache.find(c => c.id === secondaryDocument.countryId);
    return selected?.name === SAUDI_ARABIA_LOV_NAME;
  };

  const validateDocument = () => {
    const { type, number } = secondaryDocument;
    const numberStr = String(number ?? '').trim();
    const saudi = isSaudiCountry();

    if (!saudi) return true;

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

      {/* ✅ Primary Document checkbox removed — isPrimary is set automatically */}
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
        // ✅ Auto-mark as primary if this is the first document
        const isFirstDocument =
          !secondaryDocument.id && (!localPatient.documents || localPatient.documents.length === 0);

        const payload = {
          ...secondaryDocument,
          patientId: localPatient.id,
          number: String(secondaryDocument.number ?? '').trim(),
          isPrimary: isFirstDocument ? true : false
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
