import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { useAppDispatch } from '@/hooks';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';

import {
  useAddPatientDocumentMutation,
  useAddNoDocumentMutation
} from '@/services/patients/patientDocumentsService';

import { notify } from '@/utils/uiReducerActions';
import { calculateAgeFormat } from '@/utils';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faIdCard, faPhone, faShieldHalved } from '@fortawesome/free-solid-svg-icons';

import {
  useGetLovValuesByCodeQuery,
  useGetLovValuesByCodeAndParentQuery
} from '@/services/setupService';

import { setRefetchEncounter } from '@/reducers/refetchEncounterState';

import { useAddPatientMutation, useUpdatePatientMutation } from '@/services/patient/patientService';
import { useCreateEncounterMutation } from '@/services/encounters/patientEncounterService';

import { newAddress, newPatient, newPatientDocument, newPatientEncounter } from '@/types/model-types-constructor-new';
import { Address, Patient, PatientEncounter, SimpleArea, SimpleCommunity, SimpleCountry, SimpleDistrict } from '@/types/model-types-new';

import { newApPatientInsurance } from '@/types/model-types-constructor';
import { ApPatientInsurance } from '@/types/model-types';

import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetActiveCountriesQuery } from '@/services/setup/country/countryService';
import { useGetActiveDistrictsQuery } from '@/services/setup/country/countryDistrictService';
import { useGetActiveCommunitiesQuery } from '@/services/setup/country/districtCommunityService';
import { useGetActiveAreasQuery } from '@/services/setup/country/communityAreaService';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { useCreateAddressMutation, useUpdateAddressMutation } from '@/services/patients/AddressService';

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
    'db.constraint':
      'A document with this number already exists for this patient. Please use a different document number.',
    notfound: 'Patient document not found.'
  };

  if (keyMap[errorKey]) {
    return keyMap[errorKey] + traceId;
  }

  if (
    payloadText.toLowerCase().includes('constraint') ||
    payloadText.toLowerCase().includes('unique') ||
    payloadText.toLowerCase().includes('duplicate')
  ) {
    return (
      'A document with this number already exists for this patient. Please use a different document number.' +
      traceId
    );
  }

  return detail || title || message || 'Unexpected error occurred while saving document.' + traceId;
};

const toHumanBackendError = (err: any, fieldLabels: Record<string, string> = {}): string => {
  const data = err?.data ?? {};
  const title = data?.title || '';
  const detail = data?.detail || '';
  const message = data?.message || '';
  const type = data?.type || '';
  const fieldErrors = data?.fieldErrors;

  const traceId =
    data?.traceId || data?.correlationId
      ? `\nTrace ID: ${data?.traceId || data?.correlationId}`
      : '';

  const payloadText = [title, detail, message].filter(Boolean).join(' | ');

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

  if (isValidation && Array.isArray(fieldErrors) && fieldErrors.length > 0) {
    const lines = fieldErrors.map((e: any) => {
      const label = fieldLabels[e.field] || e.field;
      return `• ${label}: ${normalize(e.message)}`;
    });

    return `Please fix the following fields:\n${lines.join('\n')}${traceId}`;
  }

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

  let errorKey = data.errorKey || data.message || data.properties?.message || '';
  errorKey = errorKey.replace(/^error\./, '');

  const keyMap = {
    'payload.required': 'Patient payload is required.',
    notfound: 'Patient not found.',
    'unique.medical_record_number': 'A patient with the same medical record number already exists.',
    'db.constraint': 'Database constraint violated while saving/updating patient.'
  };

  if (keyMap[errorKey]) {
    return keyMap[errorKey] + traceId;
  }

  return detail || title || message || 'Unexpected server error occurred.' + traceId;
};

const CreateNewPatient = ({ open, setOpen }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const pageCode = useSelector((state: any) => state.div?.pageCode);

  const [localPatient, setLocalPatient] = useState<Patient>({ ...newPatient });
  const [secondaryDocument, setSecondaryDocument] = useState(newPatientDocument);
  const [patientInsurance, setPatientInsurance] = useState<ApPatientInsurance>({
    ...newApPatientInsurance
  });
  const [openNextDocument, setOpenNextDocument] = useState(false);

  const [addPatient] = useAddPatientMutation();
  const [updatePatient] = useUpdatePatientMutation();
  const [addPatientDocument] = useAddPatientDocumentMutation();
  const [addNoDocument] = useAddNoDocumentMutation();
  const [createEncounter] = useCreateEncounterMutation();
  const [createAddress] = useCreateAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();

  const { data: countryLov } = useGetLovValuesByCodeQuery('CNTRY');
  const patientDocumentEnum = useEnumOptions('DocumentType');
  const preferredWayOfContactEnum = useEnumOptions('PreferredWayOfContact');
  const genderEnum = useEnumOptions('Gender');

  const { data: cityLov } = useGetLovValuesByCodeAndParentQuery({
    code: 'CITY',
    parentValueKey: (localPatient as any).country
  });

  const { data: insuranceProviderLov } = useGetLovValuesByCodeQuery('INS_PROVIDER');
  const { data: insurancePlanLov } = useGetLovValuesByCodeQuery('INS_PLAN_TYPS');

  const PAGE_SIZE = 5;

  const [docCountryCache, setDocCountryCache] = useState<any[]>([]);
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

    const mapped = docCountriesData.data.map((c: any) => ({
      ...c,
      displayName:
        conjureValueBasedOnKeyFromList(countryLov?.object ?? [], c.name, 'lovDisplayVale') || c.name
    }));

    if (docCountryPage === 0) {
      setDocCountryCache(mapped);
    } else {
      setDocCountryCache(prev => [...prev, ...mapped]);
    }

    // countryService returns a PagedResult with Link headers parsed into `links`
    setDocHasMoreCountries(!!docCountriesData.links?.next);
    setDocPaginationLoading(false);
  }, [docCountriesData, docCountryPage, countryLov]);

  const loadMoreDocCountries = () => {
    if (!docHasMoreCountries) return;
    setDocPaginationLoading(true);
    setDocCountryPage(prev => prev + 1);
  };

  /* ========================================================= */
  /* ===================== ADDRESS (CONTACT STEP) ============= */
  /* ========================================================= */

  type ExtendedAddress = Address & {
    countryId?: number | null;
    districtId?: number | null;
    communityId?: number | null;
    areaId?: number | null;
  };

  const [addrRefreshToken, setAddrRefreshToken] = useState(0);
  const [address, setAddress] = useState<ExtendedAddress>({
    ...(newAddress as any),
    patientId: 0,
    locationJson: {
      country: null,
      district: null,
      community: null,
      area: null
    },
    countryId: null,
    districtId: null,
    communityId: null,
    areaId: null
  });

  const [addrCountryCache, setAddrCountryCache] = useState<SimpleCountry[]>([]);
  const [addrDistrictCache, setAddrDistrictCache] = useState<SimpleDistrict[]>([]);
  const [addrCommunityCache, setAddrCommunityCache] = useState<SimpleCommunity[]>([]);
  const [addrAreaCache, setAddrAreaCache] = useState<SimpleArea[]>([]);

  const [addrCountryPage, setAddrCountryPage] = useState(0);
  const [addrDistrictPage, setAddrDistrictPage] = useState(0);
  const [addrCommunityPage, setAddrCommunityPage] = useState(0);
  const [addrAreaPage, setAddrAreaPage] = useState(0);

  const [addrCountrySearch, setAddrCountrySearch] = useState('');
  const [addrDistrictSearch, setAddrDistrictSearch] = useState('');
  const [addrCommunitySearch, setAddrCommunitySearch] = useState('');
  const [addrAreaSearch, setAddrAreaSearch] = useState('');

  const resetAddressState = () => {
    setAddress({
      ...(newAddress as any),
      patientId: Number(localPatient?.id ?? 0) || 0,
      locationJson: { country: null, district: null, community: null, area: null },
      countryId: null,
      districtId: null,
      communityId: null,
      areaId: null
    });

    setAddrCountrySearch('');
    setAddrDistrictSearch('');
    setAddrCommunitySearch('');
    setAddrAreaSearch('');

    setAddrCountryPage(0);
    setAddrDistrictPage(0);
    setAddrCommunityPage(0);
    setAddrAreaPage(0);

    setAddrCountryCache([]);
    setAddrDistrictCache([]);
    setAddrCommunityCache([]);
    setAddrAreaCache([]);

    setAddrRefreshToken(prev => prev + 1);
  };

  const hasAnyAddressInput =
    !!address?.countryId ||
    !!address?.districtId ||
    !!address?.communityId ||
    !!address?.areaId ||
    !!String(address?.streetName ?? '').trim() ||
    !!String(address?.houseApartmentNumber ?? '').trim() ||
    !!String(address?.postalZipCode ?? '').trim() ||
    !!String(address?.additionalAddressLine ?? '').trim();

  const isLocationValid = !!address.countryId && !!address.districtId && !!address.communityId;

  const { data: addrCountriesResponse } = useGetActiveCountriesQuery({
    page: addrCountryPage,
    size: PAGE_SIZE,
    search: addrCountrySearch || undefined,
    sort: 'id,asc',
    refreshToken: addrRefreshToken
  } as any);

  const { data: addrDistrictsResponse } = useGetActiveDistrictsQuery(
    {
      page: addrDistrictPage,
      size: PAGE_SIZE,
      search: addrDistrictSearch || undefined,
      sort: 'id,asc',
      countryId: address.locationJson?.country?.id,
      refreshToken: addrRefreshToken
    } as any,
    { skip: !address.locationJson?.country?.id }
  );

  const { data: addrCommunitiesResponse } = useGetActiveCommunitiesQuery(
    {
      page: addrCommunityPage,
      size: PAGE_SIZE,
      search: addrCommunitySearch || undefined,
      sort: 'id,asc',
      districtId: address.locationJson?.district?.id,
      refreshToken: addrRefreshToken
    } as any,
    { skip: !address.locationJson?.district?.id }
  );

  const { data: addrAreasResponse } = useGetActiveAreasQuery(
    {
      page: addrAreaPage,
      size: PAGE_SIZE,
      search: addrAreaSearch || undefined,
      sort: 'id,asc',
      communityId: address.locationJson?.community?.id,
      refreshToken: addrRefreshToken
    } as any,
    { skip: !address.locationJson?.community?.id }
  );

  useEffect(() => {
    if (!addrCountriesResponse?.data) return;

    const mapped = addrCountriesResponse.data.map((c: any) => ({
      ...c,
      displayName:
        conjureValueBasedOnKeyFromList(countryLov?.object ?? [], c.name, 'lovDisplayVale') || c.name
    }));

    setAddrCountryCache(prev => (addrCountryPage === 0 ? mapped : [...prev, ...mapped]));
  }, [addrCountriesResponse, addrCountryPage, countryLov]);

  useEffect(() => {
    if (!addrDistrictsResponse?.data) return;
    setAddrDistrictCache(prev =>
      addrDistrictPage === 0 ? addrDistrictsResponse.data : [...prev, ...addrDistrictsResponse.data]
    );
  }, [addrDistrictsResponse, addrDistrictPage]);

  useEffect(() => {
    if (!addrCommunitiesResponse?.data) return;
    setAddrCommunityCache(prev =>
      addrCommunityPage === 0
        ? addrCommunitiesResponse.data
        : [...prev, ...addrCommunitiesResponse.data]
    );
  }, [addrCommunitiesResponse, addrCommunityPage]);

  useEffect(() => {
    if (!addrAreasResponse?.data) return;
    setAddrAreaCache(prev => (addrAreaPage === 0 ? addrAreasResponse.data : [...prev, ...addrAreasResponse.data]));
  }, [addrAreasResponse, addrAreaPage]);

  const saveAddressIfNeeded = async (patientId: number) => {
    if (!hasAnyAddressInput) return;

    if (!isLocationValid) {
      dispatch(
        notify({
          msg: 'Please complete Country, District, and Community before saving the address.',
          sev: 'error'
        })
      );
      return;
    }

    const payload: Address = {
      id: address.id,
      patientId,
      locationJson: address.locationJson,
      streetName: address.streetName ?? null,
      houseApartmentNumber: address.houseApartmentNumber ?? null,
      postalZipCode: address.postalZipCode ?? null,
      additionalAddressLine: address.additionalAddressLine ?? null,
      isCurrent: address.isCurrent ?? true
    };

    try {
      const savedAddress = address.id
        ? await updateAddress({ id: Number(address.id), patientId, body: payload }).unwrap()
        : await createAddress({ patientId, body: payload }).unwrap();

      setAddress({
        ...(savedAddress as any),
        countryId: savedAddress.locationJson?.country?.id ?? null,
        districtId: savedAddress.locationJson?.district?.id ?? null,
        communityId: savedAddress.locationJson?.community?.id ?? null,
        areaId: savedAddress.locationJson?.area?.id ?? null
      } as any);

      dispatch(notify({ msg: 'Address Saved Successfully', sev: 'success' }));
    } catch (err: any) {
      dispatch(
        notify({
          msg: err?.data?.message || err?.message || 'Failed to save address',
          sev: 'error'
        })
      );
    }
  };

  /* ========================================================= */
  /* ===================== SAVE PATIENT ======================= */
  /* ========================================================= */

  const handleSave = async (): Promise<Patient | null> => {
    try {
      const saved = localPatient?.id
        ? await updatePatient({
          id: localPatient.id,
          data: { ...localPatient, isCompletedPatient: true }
        }).unwrap()
        : await addPatient({
          ...localPatient,
          isCompletedPatient: true
        }).unwrap();

      setLocalPatient(saved);
      // If user filled address fields in Contact step, save the address after patient is saved.
      await saveAddressIfNeeded(Number(saved?.id ?? 0));

      dispatch(
        notify({
          msg: localPatient?.id ? 'Patient Updated Successfully' : 'Patient Saved Successfully',
          sev: 'success'
        })
      );
      return saved;
    } catch (err) {
      const msg = toHumanBackendError(err, {
        firstName: 'First Name',
        lastName: 'Last Name',
        dateOfBirth: 'Date of Birth',
        primaryMobileNumber: 'Primary Mobile Number',
        sexAtBirth: 'Gender'
      });

      dispatch(notify({ msg, sev: 'error' }));
      return null;
    }
  };

  const handleSavePatientAndQuick = async () => {
    try {
      const saved = localPatient?.id
        ? await updatePatient({
          id: localPatient.id,
          data: { ...localPatient, isCompletedPatient: true }
        }).unwrap()
        : await addPatient({
          ...localPatient,
          isCompletedPatient: true
        }).unwrap();

      setLocalPatient(saved);

      if (pageCode === 'ER_Triage') {
        const selectedDepartment = JSON.parse(localStorage.getItem('selectedDepartment') || 'null');
        const departmentId = Number(selectedDepartment?.departmentId ?? 0);
        const facilityId = Number(selectedDepartment?.facilityId ?? 0);

        if (!departmentId || !facilityId) {
          dispatch(
            notify({
              msg: 'Missing logged-in department. Please select a department then try again.',
              sev: 'error'
            })
          );
          return;
        }

        const encounterBody: PatientEncounter = {
          ...newPatientEncounter,
          id: 0,
          patientId: Number(saved.id ?? 0),
          facilityId,
          departmentId,
          encounterType: 'EMERGENCY',
          encounterReason: 'URGENT_VISIT',
          status: 'WAITING_TRIAGE',
          encounterDate: new Date(),
          paymentDate: new Date().toISOString(),
          amount: 0
        };

        await createEncounter({ body: encounterBody }).unwrap();

        dispatch(setRefetchEncounter(true));
      }

      dispatch(notify({ msg: 'Patient added successfully', sev: 'success' }));

      if (pageCode !== 'ER_Triage') {
        navigate('/patient-profile', { state: { patient: saved } });
      }
    } catch (err) {
      const msg = toHumanBackendError(err, {
        firstName: 'First Name',
        lastName: 'Last Name',
        dateOfBirth: 'Date of Birth',
        primaryMobileNumber: 'Primary Mobile Number',
        sexAtBirth: 'Gender'
      });

      dispatch(notify({ msg, sev: 'error' }));
    }
  };

  const handleSaveDocument = async () => {
    const isNoDocument =
      secondaryDocument.type === 'NO_DOC' || secondaryDocument.type === 'NO_DOCUMENT';

    if (isNoDocument) {
      try {
        await addNoDocument({
          patientId: localPatient.id,
          type: 'NO_DOCUMENT',
          isPrimary: secondaryDocument.isPrimary ?? false
        }).unwrap();

        dispatch(notify({ msg: 'No Document Added Successfully', sev: 'success' }));
        setOpenNextDocument(true);
      } catch (err) {
        const msg = toHumanPatientDocumentError(err);
        dispatch(notify({ msg, sev: 'error' }));
      }

      return;
    }

    const documentData = {
      ...secondaryDocument,
      patientId: localPatient.id,
      isPrimary: secondaryDocument.isPrimary ?? false,
      number: secondaryDocument.number
    };

    try {
      await addPatientDocument(documentData).unwrap();
      dispatch(notify({ msg: 'Document Added Successfully', sev: 'success' }));
      setOpenNextDocument(true);
    } catch (err) {
      const msg = toHumanPatientDocumentError(err);
      dispatch(notify({ msg, sev: 'error' }));
    }
  };

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

  useEffect(() => {
    if (!open) {
      setLocalPatient({ ...newPatient });
      setPatientInsurance({ ...newApPatientInsurance });
      setOpenNextDocument(false);
      setSecondaryDocument({ ...newPatientDocument });
      resetAddressState();
    }
  }, [open]);

  const conjureFormContent = step => {
    switch (step) {
      case 0:
        return (
          <Form layout="inline">
            <span className="custom-text">Basic Information</span>

            <MyInput
              width={200}
              column
              required
              fieldName="firstName"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={200}
              column
              fieldName="secondName"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={200}
              column
              fieldName="thirdName"
              record={localPatient}
              setRecord={setLocalPatient}
            />

            <MyInput
              width={200}
              column
              required
              fieldName="lastName"
              record={localPatient}
              setRecord={setLocalPatient}
            />

            <MyInput
              width={200}
              column
              required
              fieldType="date"
              fieldLabel="DOB"
              fieldName="dateOfBirth"
              record={localPatient}
              setRecord={setLocalPatient}
            />

            <MyInput
              width={200}
              column
              required
              fieldLabel="Gender"
              fieldType="select"
              fieldName="sexAtBirth"
              selectData={genderEnum ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={localPatient}
              setRecord={setLocalPatient}
            />

            <MyInput
              width={200}
              column
              required
              fieldName="primaryMobileNumber"
              fieldLabel="Primary Mobile Number"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              required
              column
              fieldName="email"
              record={localPatient}
              setRecord={setLocalPatient}
              width={200}
            />
            <MyInput
              width={200}
              column
              fieldType="checkbox"
              fieldName="isPrivatePatient"
              fieldLabel="Private Patient"
              record={localPatient}
              setRecord={setLocalPatient}
            />
          </Form>
        );

      case 1:
        return (
          <Form fluid layout="inline">
            <span className="custom-text">Patient Document</span>

            <MyInput
              width={200}
              required
              column
              fieldLabel="Document Type"
              fieldType="select"
              fieldName="type"
              selectData={patientDocumentEnum ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={secondaryDocument}
              setRecord={setSecondaryDocument}
            />

            {secondaryDocument.type !== 'NO_DOC' && secondaryDocument.type !== 'NO_DOCUMENT' && (
              <MyInput
                required
                column
                width={200}
                fieldLabel="Document Country"
                fieldType="selectPagination"
                fieldName="countryId"
                selectData={docCountryCache}
                selectDataLabel="displayName"
                selectDataValue="id"
                searchKeyWard={docCountrySearch}
                setSearchKeyWard={setDocCountrySearch}
                hasMore={docHasMoreCountries}
                onFetchMore={loadMoreDocCountries}
                loading={docPaginationLoading}
                onSelectItem={(item: any) => {
                  setSecondaryDocument(prev => ({
                    ...prev,
                    countryId: item.id
                  }));
                }}
                record={secondaryDocument}
              />
            )}

            {secondaryDocument.type !== 'NO_DOC' && secondaryDocument.type !== 'NO_DOCUMENT' && (
              <MyInput
                width={200}
                required
                column
                fieldLabel="Document Number"
                fieldName="number"
                disabled={
                  secondaryDocument.type === 'NO_DOC' || secondaryDocument.type === 'NO_DOCUMENT'
                }
                record={secondaryDocument}
                setRecord={newRecord => {
                  setSecondaryDocument({
                    ...secondaryDocument,
                    ...newRecord,
                    number:
                      secondaryDocument.type === 'NO_DOC' ||
                        secondaryDocument.type === 'NO_DOCUMENT'
                        ? 'NO_DOCUMENT'
                        : newRecord.number
                  });
                }}
              />
            )}

            <MyInput
              width={200}
              column
              fieldLabel="Primary Document"
              fieldType="checkbox"
              fieldName="isPrimary"
              disabled={
                secondaryDocument.type === 'NO_DOC' || secondaryDocument.type === 'NO_DOCUMENT'
              }
              record={secondaryDocument}
              setRecord={setSecondaryDocument}
            />
          </Form>
        );

      case 2:
        return (
          <Form layout="inline">
            <span className="custom-text">Contact Information</span>

            <MyInput
              width={200}
              column
              fieldLabel="Secondary Mobile Number"
              fieldName="secondMobileNumber"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={200}
              column
              fieldName="homePhone"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              column
              fieldName="email"
              width={200}
              record={localPatient}
              setRecord={setLocalPatient}
            />

            <MyInput
              column
              width={200}
              fieldLabel="Preferred Way of Contact"
              fieldType="select"
              fieldName="preferredWayOfContact"
              selectData={preferredWayOfContactEnum ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={localPatient}
              setRecord={setLocalPatient}
              searchable={false}
            />

            <MyInput
              column
              width={200}
              fieldName="emergencyContactName"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              column
              width={200}
              fieldName="emergencyContactPhone"
              record={localPatient}
              setRecord={setLocalPatient}
            />

            <span className="custom-text">Address Information</span>

            <div className="create-new-patient-address">
              <div className="create-new-patient-address-actions">
                <MyButton appearance="ghost" onClick={resetAddressState}>
                  Clear Address
                </MyButton>
              </div>

              <div className="create-new-patient-address-fields">
                <MyInput
                  width={200}
                  column
                  required={hasAnyAddressInput}
                  fieldLabel="Country"
                  fieldType="selectPagination"
                  fieldName="countryId"
                  selectData={addrCountryCache as any}
                  selectDataLabel="displayName"
                  selectDataValue="id"
                  record={address}
                  setRecord={setAddress}
                  searchKeyWard={addrCountrySearch}
                  setSearchKeyWard={setAddrCountrySearch}
                  hasMore={!!addrCountriesResponse?.links?.next}
                  onFetchMore={() => {
                    if (addrCountriesResponse?.links?.next) {
                      const { page } = extractPaginationFromLink(addrCountriesResponse.links.next);
                      setAddrCountryPage(page);
                    }
                  }}
                  onSelectItem={(item: SimpleCountry | null) => {
                    if (!item) return resetAddressState();

                    setAddress(prev => ({
                      ...prev,
                      countryId: item.id,
                      districtId: null,
                      communityId: null,
                      areaId: null,
                      locationJson: {
                        country: { id: item.id, name: item.name, code: item.code },
                        district: null,
                        community: null,
                        area: null
                      }
                    }));

                    setAddrDistrictCache([]);
                    setAddrCommunityCache([]);
                    setAddrAreaCache([]);
                    setAddrDistrictPage(0);
                    setAddrCommunityPage(0);
                    setAddrAreaPage(0);
                    setAddrDistrictSearch('');
                    setAddrCommunitySearch('');
                    setAddrAreaSearch('');
                    setAddrRefreshToken(prev => prev + 1);
                  }}
                />

                <MyInput
                  width={200}
                  column
                  required={hasAnyAddressInput}
                  fieldLabel="District"
                  fieldType="selectPagination"
                  fieldName="districtId"
                  selectData={addrDistrictCache as any}
                  selectDataLabel="name"
                  selectDataValue="id"
                  record={{
                    ...address,
                    districtId: address.countryId ? address.districtId : null
                  }}
                  setRecord={setAddress}
                  searchKeyWard={addrDistrictSearch}
                  setSearchKeyWard={setAddrDistrictSearch}
                  hasMore={!!addrDistrictsResponse?.links?.next}
                  disabled={!address.countryId}
                  onFetchMore={() => {
                    if (addrDistrictsResponse?.links?.next) {
                      const { page } = extractPaginationFromLink(addrDistrictsResponse.links.next);
                      setAddrDistrictPage(page);
                    }
                  }}
                  onSelectItem={(item: SimpleDistrict | null) => {
                    if (!item) return;
                    setAddress(prev => ({
                      ...prev,
                      districtId: item.id,
                      communityId: null,
                      areaId: null,
                      locationJson: {
                        ...prev.locationJson,
                        district: { id: item.id, name: item.name, code: item.code },
                        community: null,
                        area: null
                      }
                    }));
                    setAddrCommunityCache([]);
                    setAddrAreaCache([]);
                    setAddrCommunityPage(0);
                    setAddrAreaPage(0);
                    setAddrCommunitySearch('');
                    setAddrAreaSearch('');
                    setAddrRefreshToken(prev => prev + 1);
                  }}
                />

                <MyInput
                  width={200}
                  column
                  required={hasAnyAddressInput}
                  fieldLabel="Community"
                  fieldType="selectPagination"
                  fieldName="communityId"
                  selectData={addrCommunityCache as any}
                  selectDataLabel="name"
                  selectDataValue="id"
                  record={{
                    ...address,
                    communityId: address.districtId ? address.communityId : null
                  }}
                  setRecord={setAddress}
                  searchKeyWard={addrCommunitySearch}
                  setSearchKeyWard={setAddrCommunitySearch}
                  hasMore={!!addrCommunitiesResponse?.links?.next}
                  disabled={!address.districtId}
                  onFetchMore={() => {
                    if (addrCommunitiesResponse?.links?.next) {
                      const { page } = extractPaginationFromLink(addrCommunitiesResponse.links.next);
                      setAddrCommunityPage(page);
                    }
                  }}
                  onSelectItem={(item: SimpleCommunity | null) => {
                    if (!item) return;
                    setAddress(prev => ({
                      ...prev,
                      communityId: item.id,
                      areaId: null,
                      locationJson: {
                        ...prev.locationJson,
                        community: { id: item.id, name: item.name },
                        area: null
                      }
                    }));
                    setAddrAreaCache([]);
                    setAddrAreaPage(0);
                    setAddrAreaSearch('');
                    setAddrRefreshToken(prev => prev + 1);
                  }}
                />

                <MyInput
                  width={200}
                  column
                  fieldLabel="Area"
                  fieldType="selectPagination"
                  fieldName="areaId"
                  selectData={addrAreaCache as any}
                  selectDataLabel="name"
                  selectDataValue="id"
                  record={{
                    ...address,
                    areaId: address.communityId ? address.areaId : null
                  }}
                  setRecord={setAddress}
                  searchKeyWard={addrAreaSearch}
                  setSearchKeyWard={setAddrAreaSearch}
                  hasMore={!!addrAreasResponse?.links?.next}
                  disabled={!address.communityId}
                  onFetchMore={() => {
                    if (addrAreasResponse?.links?.next) {
                      const { page } = extractPaginationFromLink(addrAreasResponse.links.next);
                      setAddrAreaPage(page);
                    }
                  }}
                  onSelectItem={(item: SimpleArea | null) => {
                    if (!item) return;
                    setAddress(prev => ({
                      ...prev,
                      areaId: item.id,
                      locationJson: {
                        ...prev.locationJson,
                        area: { id: item.id, name: item.name }
                      }
                    }));
                  }}
                />

                <MyInput
                  width={200}
                  column
                  fieldLabel="Street Name"
                  fieldName="streetName"
                  record={address}
                  setRecord={setAddress}
                />

                <MyInput
                  width={200}
                  column
                  fieldLabel="House/Apartment Number"
                  fieldName="houseApartmentNumber"
                  record={address}
                  setRecord={setAddress}
                />

                <MyInput
                  width={200}
                  column
                  fieldLabel="Postal/ZIP code"
                  fieldName="postalZipCode"
                  record={address}
                  setRecord={setAddress}
                />

                <MyInput
                  width={200}
                  column
                  fieldLabel="Additional Address Line"
                  fieldName="additionalAddressLine"
                  record={address}
                  setRecord={setAddress}
                />
              </div>
            </div>
          </Form>
        );

      case 3:
        return (
          <Form layout="inline">
            <span className="custom-text">Insurance Information</span>

            <MyInput
              width={200}
              column
              fieldLabel="Insurance Provider"
              fieldType="select"
              fieldName="insuranceProvider"
              selectData={insuranceProviderLov?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={patientInsurance}
              setRecord={setPatientInsurance}
            />

            <MyInput
              width={200}
              column
              fieldLabel="Policy Number"
              fieldName="insurancePolicyNumber"
              record={patientInsurance}
              setRecord={setPatientInsurance}
            />

            <MyInput
              width={200}
              column
              fieldLabel="Insurance Plan"
              fieldType="select"
              fieldName="insurancePlanType"
              selectData={insurancePlanLov?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={patientInsurance}
              setRecord={setPatientInsurance}
            />

            <MyInput
              width={200}
              column
              fieldLabel="Group Number"
              fieldName="groupNumber"
              record={patientInsurance}
              setRecord={setPatientInsurance}
            />

            <MyInput
              width={200}
              column
              fieldType="date"
              fieldLabel="Expiration"
              fieldName="expirationDate"
              record={patientInsurance}
              setRecord={setPatientInsurance}
            />
          </Form>
        );

      default:
        return null;
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Patient Registration"
      steps={[
        {
          title: 'Basic Info',
          icon: <FontAwesomeIcon icon={faUser} />,
          footer: (
            <MyButton onClick={pageCode === 'ER_Triage' ? handleSavePatientAndQuick : handleSave}>
              {pageCode === 'ER_Triage' ? 'Save & Create Quick Appointment' : 'Save'}
            </MyButton>
          )
        },
        {
          title: 'Document',
          icon: <FontAwesomeIcon icon={faIdCard} />,
          disabledNext: !openNextDocument,
          footer: <MyButton onClick={handleSaveDocument}>Save Document</MyButton>
        },
        {
          title: 'Contact',
          icon: <FontAwesomeIcon icon={faPhone} />,
          footer: <MyButton onClick={handleSave}>Save</MyButton>
        },
        {
          title: 'Insurance',
          icon: <FontAwesomeIcon icon={faShieldHalved} />,
          footer: (
            <MyButton
              onClick={() =>
                dispatch(notify({ msg: 'Insurance saved (placeholder)', sev: 'success' }))
              }
            >
              Save Insurance
            </MyButton>
          )
        }
      ]}
      size="33vw"
      position="right"
      content={conjureFormContent}
      actionButtonFunction={async () => {
        const saved = await handleSave();
        if (!saved) return;

        if (pageCode === 'ER_Triage') {
          navigate('/ER-triage');
        } else {
          navigate('/patient-profile', { state: { patient: saved } });
        }

        setOpen(false);
        setLocalPatient({ ...newPatient });
        setPatientInsurance({ ...newApPatientInsurance });
        setOpenNextDocument(false);
      }}
    />
  );
};

export default CreateNewPatient;