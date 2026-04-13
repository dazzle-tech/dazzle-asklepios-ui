import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { useAppDispatch, useAppSelector } from '@/hooks';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';

import {
  useAddPatientDocumentMutation,
  useAddNoDocumentMutation
} from '@/services/patients/patientDocumentsService';

import { notify } from '@/utils/uiReducerActions';
import { formatEnumString } from '@/utils';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faIdCard, faPhone, faShieldHalved } from '@fortawesome/free-solid-svg-icons';

import {
  useGetLovValuesByCodeQuery,
  useGetLovValuesByCodeAndParentQuery
} from '@/services/setupService';

import { setRefetchEncounter } from '@/reducers/refetchEncounterState';

import { useAddPatientMutation, useUpdatePatientMutation } from '@/services/patient/patientService';
import { useCreateQuickAppointmentMutation } from '@/services/appointment/appointmentService';
import * as modelTypes from '@/types/model-types-new';

import {
  newAddress,
  newPatient,
  newPatientDocument,
  newPatientInsurance
} from '@/types/model-types-constructor-new';
import {
  Address,
  Patient,
  PatientInsurance,
  SimpleArea,
  SimpleCommunity,
  SimpleCountry,
  SimpleDistrict
} from '@/types/model-types-new';
import { useLazyGetAppointableActiveDepartmentsByEncounterTypeAndFacilityQuery } from '@/services/security/departmentService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetActiveDistrictsQuery } from '@/services/setup/country/countryDistrictService';
import { useGetActiveCommunitiesQuery } from '@/services/setup/country/districtCommunityService';
import { useGetActiveAreasQuery } from '@/services/setup/country/communityAreaService';
import { useCreateAddressMutation, useUpdateAddressMutation } from '@/services/patients/AddressService';
import { useGetActiveCountriesQuery } from '@/services/setup/country/countryService';
import { conjureValueBasedOnKeyFromList } from '@/utils';

import {
  useAddPatientInsuranceMutation,
  useUpdatePatientInsuranceMutation
} from '@/services/patients/patientInsurancesService';
import { useGetAllPayorsQuery } from '@/services/setup/payer/PayorService';
import { useGetPlansByPayorQuery } from '@/services/setup/payer/PayorPlanService';
import { useGetRelativePatientsByCategoryQuery } from '@/services/patients/PatientRelationService';

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
  'patient.emergency.notAllowed.withOngoing':
    'Patient currently treated by another doctor',
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
        msg: `Please fix the following fields:\n${lines.join('\n')}${suffix}`,
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
    'patient.emergency.notAllowed.withOngoing': 'Patient currently treated by another doctor',
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

const INSURANCE_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Insurance data is required.',
  'patient.required': 'Patient is required.',
  'patient.payor.duplicate': 'This patient already has an insurance for the selected payor.',
  'primary.exists': 'This patient already has a primary insurance.',
  'db.constraint': 'Database constraint violation while saving insurance.',
  notfound: 'Insurance record not found.'
};

const INSURANCE_FIELD_LABELS: Record<string, string> = {
  payorId: 'Payor',
  planId: 'Plan',
  policyNumber: 'Policy Number',
  groupNumber: 'Group Number',
  expirationDate: 'Expiration Date',
  policyHolderId: 'Policy Holder',
  isPrimary: 'Primary Insurance'
};

const normalizeInsuranceFieldErrorMessage = (message: string): string => {
  const lowerMessage = (message || '').toLowerCase();
  if (lowerMessage.includes('must not be null')) return 'is required';
  if (lowerMessage.includes('must not be blank')) return 'must not be blank';
  if (lowerMessage.includes('size')) return 'length is out of range';
  if (lowerMessage.includes('greater')) return 'value is too small';
  if (lowerMessage.includes('less')) return 'value is too large';
  return message || 'invalid value';
};

const getInsuranceFieldLabel = (field: string): string =>
  INSURANCE_FIELD_LABELS[field] ?? field;

const toHumanInsuranceError = (
  error: any,
  keyMap: Record<string, string> = INSURANCE_ERROR_MAP
): string => {
  const responseData = error?.data ?? {};
  const traceId =
    responseData?.traceId || responseData?.requestId || responseData?.correlationId;
  const traceSuffix = traceId ? `\nTrace ID: ${traceId}` : '';

  if (Array.isArray(responseData?.fieldErrors) && responseData.fieldErrors.length > 0) {
    const errorLines = responseData.fieldErrors.map(
      (fieldError: any) =>
        `• ${getInsuranceFieldLabel(fieldError.field)}: ${normalizeInsuranceFieldErrorMessage(
          fieldError.message
        )}`
    );

    return `Please fix the following fields:\n${errorLines.join('\n')}${traceSuffix}`;
  }

  const messageProp: string = responseData?.message || '';
  const errorKey = messageProp.startsWith('error.')
    ? messageProp.substring(6)
    : responseData?.errorKey;

  return (
    (errorKey && keyMap[errorKey]) ||
    responseData?.detail ||
    responseData?.title ||
    responseData?.message ||
    'Unexpected error' + traceSuffix
  );
};

const CreateNewPatient = ({ open, setOpen }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const pageCode = useSelector((state: any) => state.div?.pageCode);

  const [localPatient, setLocalPatient] = useState<Patient>({ ...newPatient });
  const [secondaryDocument, setSecondaryDocument] = useState(newPatientDocument);
  const [patientInsurance, setPatientInsurance] = useState<PatientInsurance>({
    ...newPatientInsurance
  });
  const [openNextDocument, setOpenNextDocument] = useState(false);

  const [addPatient] = useAddPatientMutation();
  const [updatePatient] = useUpdatePatientMutation();
  const [addPatientDocument] = useAddPatientDocumentMutation();
  const [addNoDocument] = useAddNoDocumentMutation();
  const [createQuickAppointment] = useCreateQuickAppointmentMutation();
  const [createAddress] = useCreateAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [addPatientInsurance] = useAddPatientInsuranceMutation();
  const [updatePatientInsurance] = useUpdatePatientInsuranceMutation();

  const { data: countryLov } = useGetLovValuesByCodeQuery('CNTRY');
  const patientDocumentEnum = useEnumOptions('DocumentType');
  const preferredWayOfContactEnum = useEnumOptions('PreferredWayOfContact');
  const genderEnum = useEnumOptions('Gender');

  useGetLovValuesByCodeAndParentQuery({
    code: 'CITY',
    parentValueKey: (localPatient as any).country
  });

  const PAGE_SIZE = 5;

  const [encounterType, setEncounterType] = useState<string>('EMERGENCY');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [deptPage, setDeptPage] = useState(0);
  const deptSize = 20;
  const [allDepartments, setAllDepartments] = useState<any[]>([]);
  const EncounterTypeEnum = useEnumOptions('EncounterType');
  const authSlice = useAppSelector(s => s.auth);

  const selectedDepartment = authSlice.selectedDepartment;
  const [triggerDepartments, { data: deptList, isFetching: isDepartmentsFetching }] =
    useLazyGetAppointableActiveDepartmentsByEncounterTypeAndFacilityQuery();

  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);

  const [prevPayorId, setPrevPayorId] = useState<number | undefined>();
  const [payorPage, setPayorPage] = useState(0);
  const [payorSearchKeyword, setPayorSearchKeyword] = useState('');
  const [planPage, setPlanPage] = useState(0);
  const [relativePage, setRelativePage] = useState(0);
  const [allRelatives, setAllRelatives] = useState<any[]>([]);

  const {
    data: payorResponse,
    isLoading: payorLoading,
    isFetching: payorFetching
  } = useGetAllPayorsQuery({
    page: payorPage,
    size: 20,
    sort: 'name,asc',
    ...(payorSearchKeyword && { name: payorSearchKeyword })
  });

  const {
    data: plansResponse,
    isLoading: plansLoading,
    isFetching: plansFetching
  } = useGetPlansByPayorQuery(
    {
      payorId: Number(patientInsurance?.payorId) || 0,
      page: planPage,
      size: 20,
      sort: 'name,asc'
    },
    { skip: !patientInsurance?.payorId }
  );

  const {
    data: relativesResponse,
    isLoading: relativesLoading,
    isFetching: relativesFetching
  } = useGetRelativePatientsByCategoryQuery(
    {
      patientId: localPatient?.id,
      categoryType: 'ADULT',
      page: relativePage,
      size: 5
    },
    { skip: !localPatient?.id || !open }
  );

  const hasMorePayors = payorResponse?.links?.next != null;
  const hasMorePlans = plansResponse?.links?.next != null;
  const hasMoreRelatives = relativesResponse?.links?.next != null;

  const handleLoadMorePayors = () => {
    if (hasMorePayors && !payorFetching) {
      setPayorPage(currentPage => currentPage + 1);
    }
  };

  const handleLoadMorePlans = () => {
    if (hasMorePlans && !plansFetching) {
      setPlanPage(currentPage => currentPage + 1);
    }
  };

  const handleLoadMoreRelatives = () => {
    if (hasMoreRelatives && !relativesFetching) {
      setRelativePage(currentPage => currentPage + 1);
    }
  };

  const fetchDepartments = async (page = 0) => {
    if (!selectedFacilityId) return;

    try {
      console.log('[TRACE] fetchDepartments:start', {
        facilityId: selectedFacilityId,
        encounterType: 'EMERGENCY',
        page,
        size: deptSize
      });

      const result = await triggerDepartments({
        facilityId: selectedFacilityId,
        encounterType: 'EMERGENCY',
        page,
        size: deptSize,
        sort: 'id,asc'
      }).unwrap();

      const rows = result?.data ?? [];

      console.log('[TRACE] fetchDepartments:success', {
        page,
        count: rows.length,
        rows,
        links: result?.links
      });

      setAllDepartments(prev => {
        if (page === 0) return rows;

        const seenIds = new Set(prev.map((d: any) => Number(d.id)));
        const merged = [...prev];

        rows.forEach((d: any) => {
          if (!seenIds.has(Number(d.id))) {
            merged.push(d);
          }
        });

        return merged;
      });
    } catch (error) {
      console.error('[TRACE] fetchDepartments:error', error);
      if (page === 0) setAllDepartments([]);
    }
  };

  useEffect(() => {
    const facilityId = selectedDepartment?.facilityId;

    setSelectedFacilityId(
      typeof facilityId === 'number' && !Number.isNaN(facilityId) ? facilityId : null
    );
  }, [selectedDepartment?.facilityId]);

  useEffect(() => {
    if (!open) return;
    if (pageCode !== 'ER_Triage' && pageCode !== 'Urgent_Care_Triage') return;
    if (!selectedFacilityId) return;

    setDeptPage(0);
    setSelectedDepartmentId(null);
    fetchDepartments(0);
  }, [open, pageCode, selectedFacilityId]);

  useEffect(() => {
    setPayorPage(0);
  }, [payorSearchKeyword]);

  useEffect(() => {
    const currentPayorId = patientInsurance?.payorId
      ? Number(patientInsurance.payorId)
      : undefined;

    if (currentPayorId === prevPayorId) return;

    setPlanPage(0);

    if (prevPayorId !== undefined) {
      setPatientInsurance(prevInsurance => ({ ...prevInsurance, planId: null }));
    }

    setPrevPayorId(currentPayorId);
  }, [patientInsurance?.payorId, prevPayorId]);

  useEffect(() => {
    if (!open) {
      setRelativePage(0);
      setAllRelatives([]);
      return;
    }

    if (relativePage === 0) {
      setAllRelatives(relativesResponse?.data ?? relativesResponse ?? []);
      return;
    }

    const incomingRows = relativesResponse?.data ?? relativesResponse ?? [];

    setAllRelatives(prev => {
      const seenIds = new Set(prev.map(item => Number(item.id)));
      const merged = [...prev];

      incomingRows.forEach(item => {
        if (!seenIds.has(Number(item.id))) {
          merged.push(item);
        }
      });

      return merged;
    });
  }, [relativesResponse, relativePage, open]);

  const deptHasMore = Boolean(deptList?.links?.next);

  const [docCountryCache, setDocCountryCache] = useState<any[]>([]);
  const [docCountryPage, setDocCountryPage] = useState(0);
  const [docCountrySearch, setDocCountrySearch] = useState('');
  const [docHasMoreCountries, setDocHasMoreCountries] = useState(true);
  const [, setDocCountryOpen] = useState(false);
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
        conjureValueBasedOnKeyFromList(countryLov?.object ?? [], c.name, 'lovDisplayVale') ||
        c.name
    }));

    if (docCountryPage === 0) {
      setDocCountryCache(mapped);
    } else {
      setDocCountryCache(prev => [...prev, ...mapped]);
    }

    setDocHasMoreCountries(!!docCountriesData.links?.next);
    setDocPaginationLoading(false);
  }, [docCountriesData, docCountryPage, countryLov]);

  const loadMoreDocCountries = () => {
    if (!docHasMoreCountries) return;
    setDocPaginationLoading(true);
    setDocCountryPage(prev => prev + 1);
  };

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
        conjureValueBasedOnKeyFromList(countryLov?.object ?? [], c.name, 'lovDisplayVale') ||
        c.name
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
    setAddrAreaCache(prev =>
      addrAreaPage === 0 ? addrAreasResponse.data : [...prev, ...addrAreasResponse.data]
    );
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
    const facilityId = selectedFacilityId;
    const departmentId = selectedDepartmentId;

    if (!departmentId || !facilityId) {
      dispatch(
        notify({
          msg: 'Please select a department before saving.',
          sev: 'error'
        })
      );
      return;
    }

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

      await saveAddressIfNeeded(Number(saved?.id ?? 0));

      const practitionerId = 0;

      const payload: modelTypes.AppointmentFromTemplateQuickAppointmentDTO = {
        facilityId: Number(facilityId),
        departmentId: Number(departmentId),
        resourceType: (practitionerId > 0 ? 'PRACTITIONER' : 'DEPARTMENT') as modelTypes.TemplateType,
        resourceId: practitionerId > 0 ? practitionerId : Number(departmentId),
        patientId: Number(saved?.id ?? 0),
        service: 'URGENT_VISIT' as modelTypes.EncounterReason,
        priority: 'NORMAL',
        defaultServiceId: null,
        defaultPractitionerId: practitionerId > 0 ? practitionerId : null,
        reason: null,
        note: null,
        followUpEncounterId: null,
        originType: null,
        originName: null
      };

      const quickSaved = await createQuickAppointment(payload).unwrap();
      const returnedEncounter = (quickSaved as any)?.encounter ?? null;

      if (returnedEncounter && typeof returnedEncounter === 'object') {
        dispatch(setRefetchEncounter(true));
      } else {
        dispatch(setRefetchEncounter(true));
      }

      dispatch(notify({ msg: 'Patient added successfully', sev: 'success' }));

      if (pageCode !== 'ER_Triage' && pageCode !== 'Urgent_Care_Triage') {
        navigate('/patient-profile', { state: { patient: saved } });
      }
    } catch (err: any) {
      const encounterLikeError =
        Array.isArray(err?.data?.fieldErrors) ||
        !!err?.data?.errorKey ||
        (typeof err?.data?.message === 'string' && err.data.message.startsWith('error.'));

      if (encounterLikeError) {
        handleCrudError(err, dispatch, ENCOUNTER_ERROR_MAP);
        return;
      }

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

  const handleSaveInsurance = async () => {
    if (!localPatient?.id) {
      dispatch(
        notify({
          msg: 'Please save patient first before saving insurance.',
          sev: 'warning'
        })
      );
      return;
    }

    const insuranceBody: PatientInsurance = {
      ...patientInsurance,
      patientId: Number(localPatient.id)
    };

    try {
      if (insuranceBody.id) {
        await updatePatientInsurance({ id: insuranceBody.id, ...insuranceBody }).unwrap();
      } else {
        await addPatientInsurance(insuranceBody).unwrap();
      }

      dispatch(notify({ msg: 'Insurance Saved Successfully', sev: 'success' }));
    } catch (error: any) {
      dispatch(
        notify({
          msg: toHumanInsuranceError(error),
          sev: 'warning'
        })
      );
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
      setPatientInsurance({ ...newPatientInsurance });
      setOpenNextDocument(false);
      setSecondaryDocument({ ...newPatientDocument });
      resetAddressState();
      setEncounterType('EMERGENCY');
      setSelectedDepartmentId(null);
      setDeptPage(0);
      setAllDepartments([]);

      setPrevPayorId(undefined);
      setPayorPage(0);
      setPayorSearchKeyword('');
      setPlanPage(0);
      setRelativePage(0);
      setAllRelatives([]);
      setDocCountryOpen(false);
    }
  }, [open]);

  const conjureFormContent = step => {
    switch (step) {
      case 0:
        return (
          <Form layout="inline">
            <span className="custom-text">Basic Informationm</span>

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
              required
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

            {(pageCode === 'ER_Triage' || pageCode === 'Urgent_Care_Triage') && (
              <>
                <MyInput
                  column
                  width={200}
                  required
                  fieldLabel="Encounter Type"
                  fieldType="select"
                  fieldName="encounterType"
                  selectData={EncounterTypeEnum ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={{ encounterType }}
                  setRecord={(record: any) => {
                    if (record.encounterType) {
                      setEncounterType(record.encounterType);
                    }
                  }}
                  disabled={true}
                  searchable={false}
                />

                <MyInput
                  width={200}
                  required
                  column
                  fieldType="selectPagination"
                  fieldLabel="Department"
                  fieldName="departmentId"
                  selectData={allDepartments}
                  selectDataLabel="name"
                  selectDataValue="id"
                  record={{ departmentId: selectedDepartmentId }}
                  setRecord={(record: any) => {
                    if (record.departmentId !== undefined) {
                      setSelectedDepartmentId(record.departmentId);
                    }
                  }}
                  searchable
                  disabled={!selectedFacilityId}
                  loading={isDepartmentsFetching}
                  hasMore={deptHasMore}
                  onFetchMore={() => {
                    if (deptList?.links?.next) {
                      const { page } = extractPaginationFromLink(deptList.links.next);
                      setDeptPage(page);
                      fetchDepartments(page);
                    }
                  }}
                />
              </>
            )}

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
              column
              width={200}
              required
              fieldLabel="Payor"
              fieldType="selectPagination"
              fieldName="payorId"
              selectData={payorResponse?.data ?? []}
              selectDataLabel="name"
              selectDataValue="id"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              searchable={true}
              loading={payorLoading || payorFetching}
              hasMore={hasMorePayors}
              onFetchMore={handleLoadMorePayors}
              searchKeyWard={payorSearchKeyword}
              setSearchKeyWard={setPayorSearchKeyword}
              placeholder="Select Payor..."
            />

            <MyInput
              column
              width={200}
              required
              fieldLabel="Plan"
              fieldType="selectPagination"
              fieldName="planId"
              selectData={plansResponse?.data ?? []}
              selectDataLabel="name"
              selectDataValue="id"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={!patientInsurance?.payorId}
              searchable={true}
              loading={plansLoading || plansFetching}
              hasMore={hasMorePlans}
              onFetchMore={handleLoadMorePlans}
              placeholder={!patientInsurance?.payorId ? 'Select Payor first...' : 'Select Plan...'}
              renderMenuItem={(label, item) => {
                if (item?.isLoadMore) {
                  return <div>Load more...</div>;
                }

                return (
                  <div>
                    <div>{item.name}</div>
                    <div>
                      {formatEnumString(item.planType)} • {formatEnumString(item.coverageType)} • $
                      {item.amount}
                    </div>
                  </div>
                );
              }}
            />

            <MyInput
              column
              width={200}
              required
              fieldType="number"
              fieldLabel="Policy Number"
              fieldName="policyNumber"
              record={patientInsurance}
              setRecord={setPatientInsurance}
            />

            <MyInput
              column
              width={200}
              fieldType="number"
              fieldLabel="Group Number"
              fieldName="groupNumber"
              record={patientInsurance}
              setRecord={setPatientInsurance}
            />

            <MyInput
              column
              width={200}
              required
              fieldType="date"
              fieldLabel="Expiration Date"
              fieldName="expirationDate"
              record={patientInsurance}
              setRecord={setPatientInsurance}
            />

            <MyInput
              column
              width={200}
              fieldLabel="Policy Holder"
              fieldType="selectPagination"
              fieldName="policyHolderId"
              selectData={allRelatives ?? []}
              selectDataLabel={['firstName', 'lastName']}
              selectDataValue="id"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              loading={relativesLoading || relativesFetching}
              searchable={true}
              hasMore={hasMoreRelatives}
              onFetchMore={handleLoadMoreRelatives}
              placeholder="Select Policy Holder..."
            />

            <MyInput
              column
              width={200}
              fieldLabel="Primary Insurance"
              fieldName="isPrimary"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              fieldType="checkbox"
            />
          </Form>
        );

      default:
        return null;
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Patient Registration"
      steps={[
        {
          title: 'Basic Info',
          icon: <FontAwesomeIcon icon={faUser} />,
          disabledNext: !localPatient?.id,
          footer: (
            <MyButton
              onClick={
                pageCode === 'ER_Triage' || pageCode === 'Urgent_Care_Triage'
                  ? handleSavePatientAndQuick
                  : handleSave
              }
            >
              {pageCode === 'ER_Triage' || pageCode === 'Urgent_Care_Triage'
                ? 'Save & Create Quick Appointment'
                : 'Save'}
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
          footer: <MyButton onClick={handleSaveInsurance}>Save Insurance</MyButton>
        }
      ]}
      size="33vw"
      position="right"
      content={step => <div dir={dir}>{conjureFormContent(step)}</div>}
      actionButtonFunction={async () => {
        const saved = await handleSave();
        if (!saved) return;

        if (pageCode === 'ER_Triage') {
          navigate('/ER-triage');
        } else if (pageCode === 'Urgent_Care_Triage') {
          navigate('/urgent-care-triage');
        } else {
          navigate('/patient-profile', { state: { patient: saved } });
        }

        setOpen(false);
        setLocalPatient({ ...newPatient });
        setPatientInsurance({ ...newPatientInsurance });
        setOpenNextDocument(false);
        setPrevPayorId(undefined);
        setPayorPage(0);
        setPayorSearchKeyword('');
        setPlanPage(0);
        setRelativePage(0);
        setAllRelatives([]);
      }}
    />
  );
};

export default CreateNewPatient;