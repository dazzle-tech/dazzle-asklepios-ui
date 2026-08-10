import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import AddressChangeLogModal from './AddressChangeLogModal';

import {
  useCreateAddressMutation,
  useGetPatientAddressesQuery,
  useUpdateAddressMutation
} from '@/services/patients/AddressService';

import {
  useGetActiveCountriesQuery,
  useGetCountryNamesQuery
} from '@/services/setup/country/countryService';
import {
  useGetActiveDistrictsQuery,
  useGetDistrictsByNameSearchQuery
} from '@/services/setup/country/countryDistrictService';

import {
  useGetActiveCommunitiesQuery,
  useGetCommunitiesByNameSearchQuery
} from '@/services/setup/country/districtCommunityService';

import {
  useGetActiveAreasQuery,
  useGetAreasByNameSearchQuery
} from '@/services/setup/country/communityAreaService';
import { useEnumOptions } from '@/services/enumsApi';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import {
  SimpleCountry,
  SimpleDistrict,
  SimpleCommunity,
  SimpleArea,
  Address
} from '@/types/model-types-new';

import { newAddress } from '@/types/model-types-constructor-new';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

import { FaBroom } from 'react-icons/fa6';
import { FaSave } from 'react-icons/fa';

const PAGE_SIZE = 5;

const getCchiAddressStorageKey = (
  patientId?: number | string | null,
  documentId?: number | string | null
) => {
  if (patientId) return `cchi-address-patient-${patientId}`;
  if (documentId) return `cchi-address-document-${documentId}`;
  return '';
};

const mergeUniqueById = <T extends { id?: number | null }>(oldItems: T[], newItems: T[]) => {
  const map = new Map<number, T>();

  [...oldItems, ...newItems].forEach(item => {
    if (item?.id != null) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values());
};

const toHumanAddressError = (
  err: any,
  fieldLabels: Record<string, string> = {
    countryId: 'Country',
    districtId: 'District',
    communityId: 'Community',
    areaId: 'Area',
    streetName: 'Street Name',
    houseApartmentNumber: 'House/Apartment Number',
    postalZipCode: 'Postal/ZIP code',
    additionalAddressLine: 'Additional Address Line',
    locationJson: 'Location'
  }
): string => {
  const data = err?.data ?? {};

  const title = data?.title ?? '';
  const detail = data?.detail ?? '';
  const message = data?.message ?? '';
  const type = data?.type ?? '';
  const fieldErrors = data?.fieldErrors;

  const traceId =
    data?.traceId || data?.correlationId
      ? `\nTrace ID: ${data?.traceId || data?.correlationId}`
      : '';

  const normalize = (msg: string) => {
    const m = (msg || '').toLowerCase();
    if (m.includes('must not be null')) return 'is required';
    if (m.includes('must not be empty')) return 'is required';
    if (m.includes('must not be blank')) return 'must not be blank';
    if (m.includes('size must be between')) return 'length is out of range';
    return msg || 'invalid value';
  };

  const extractConstraintFromDetail = (text: string): { msg?: string; params?: string } => {
    if (!text) return {};
    const msgMatch = text.match(/message\s*=\s*([a-zA-Z0-9_.-]+)/);
    const paramsMatch = text.match(/params\s*=\s*([a-zA-Z0-9_.-]+)/);
    return { msg: msgMatch?.[1], params: paramsMatch?.[1] };
  };

  const extracted = extractConstraintFromDetail(detail);
  const constraintMsg = message || extracted.msg || '';
  const constraintParams = data?.params || extracted.params || '';

  const isValidation =
    data?.message === 'error.validation' ||
    title?.toLowerCase?.().includes?.('argument not valid') ||
    (typeof type === 'string' && type.includes('constraint-violation'));

  if (isValidation && Array.isArray(fieldErrors) && fieldErrors.length > 0) {
    const lines = fieldErrors.map((e: any) => {
      const label = fieldLabels[e.field] || e.field;
      return `• ${label}: ${normalize(e.message)}`;
    });

    return `Please fix the following fields:\n${lines.join('\n')}${traceId}`;
  }

  const rawKey = data?.errorKey ?? data?.properties?.message ?? '';
  const errorKey = String(rawKey).replace(/^error\./, '').trim();

  if (errorKey === 'payload.required') return 'Address payload is required.' + traceId;
  if (errorKey === 'notfound') return (detail || 'Address not found.') + traceId;
  if (errorKey === 'unique.patient.fullAddress')
    return 'This address already exists for the same patient.' + traceId;
  if (errorKey === 'fk.patient') return 'Invalid patient reference for address.' + traceId;
  if (errorKey === 'db.constraint')
    return detail || 'Database constraint violated while saving/updating address.' + traceId;

  if (constraintMsg === 'error.constraint') {
    if (String(constraintParams).toLowerCase() === 'address') {
      return 'This address already exists for the same patient.' + traceId;
    }

    return (
      'Database constraint violated while saving/updating address.' +
      (constraintParams ? `\nConstraint: ${constraintParams}` : '') +
      traceId
    );
  }

  const payloadText = [title, detail, message].filter(Boolean).join(' | ');
  const lower = payloadText.toLowerCase();

  if (
    lower.includes('uk_address_patient_full_address') ||
    lower.includes('unique constraint') ||
    lower.includes('duplicate key') ||
    lower.includes('duplicate entry') ||
    lower.includes('duplicate')
  ) {
    return 'This address already exists for the same patient.' + traceId;
  }

  if (lower.includes('fk_address_patient') || lower.includes('foreign key')) {
    return 'Invalid patient reference for address.' + traceId;
  }

  return detail || title || message || 'Unexpected server error occurred.' + traceId;
};

interface AddressTabProps {
  localPatient: any;
  cchiAddress?: Address | null;
  setCchiAddress?: (address: Address | null) => void;
}

type ExtendedAddress = Address & {
  patientId?: number | null;
  countryId?: number | null;
  districtId?: number | null;
  communityId?: number | null;
  areaId?: number | null;
};

const AddressTab: React.FC<AddressTabProps> = ({
  localPatient,
  cchiAddress,
  setCchiAddress
}) => {
  const dispatch = useAppDispatch();

  const patientId = localPatient?.id ?? null;
  const patientDocumentId = localPatient?.documentId ?? null;

  const cchiStorageKey = useMemo(
    () => getCchiAddressStorageKey(patientId, patientDocumentId),
    [patientId, patientDocumentId]
  );

  const [refreshToken, setRefreshToken] = useState(0);
  const [blockServerHydration, setBlockServerHydration] = useState(false);
  const [hasHydratedFromCchi, setHasHydratedFromCchi] = useState(false);

  const [address, setAddress] = useState<ExtendedAddress>({
    ...newAddress,
    patientId,
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

  const [countryCache, setCountryCache] = useState<SimpleCountry[]>([]);
  const [districtCache, setDistrictCache] = useState<SimpleDistrict[]>([]);
  const [communityCache, setCommunityCache] = useState<SimpleCommunity[]>([]);
  const [areaCache, setAreaCache] = useState<SimpleArea[]>([]);

  const [countryPage, setCountryPage] = useState(0);
  const [districtPage, setDistrictPage] = useState(0);
  const [communityPage, setCommunityPage] = useState(0);
  const [areaPage, setAreaPage] = useState(0);

  const [countrySearch, setCountrySearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [communitySearch, setCommunitySearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');

  const [selectedCountry, setSelectedCountry] =
    useState<SimpleCountry | null>(null);


  const countryEnum = useEnumOptions('CountryName');

  const countryEnumKey = useMemo(
    () =>
      countryEnum
        .map(option => `${option.value}:${option.label}`)
        .join('|'),
    [countryEnum]
  );

  const countryLabelMap = useMemo(
    () =>
      Object.fromEntries(
        countryEnum.map(option => [option.value, option.label])
      ),
    [countryEnumKey]
  );

  const handleCountrySearch = (value: string) => {
    setCountryPage(0);
    setCountrySearch(value);
    setCountryCache([]);
  };

  const handleDistrictSearch = (value: string) => {
    setDistrictPage(0);
    setDistrictSearch(value);
    setDistrictCache([]);
  };

  const handleCommunitySearch = (value: string) => {
    setCommunityPage(0);
    setCommunitySearch(value);
    setCommunityCache([]);
  };

  const handleAreaSearch = (value: string) => {
    setAreaPage(0);
    setAreaSearch(value);
    setAreaCache([]);
  };

  const [openChangeLog, setOpenChangeLog] = useState(false);






  const getCountryDisplayName = (country?: any) => {
    if (!country) return '';

    return (
      countryLabelMap[country.code] ||
      countryLabelMap[country.name] ||
      String(country.name || country.code || '').replaceAll('_', ' ')
    );
  };

  const hydrateAddressIntoState = (sourceAddress: Address) => {
    const country = sourceAddress.locationJson?.country ?? null;
    const district = sourceAddress.locationJson?.district ?? null;
    const community = sourceAddress.locationJson?.community ?? null;
    const area = sourceAddress.locationJson?.area ?? null;

    const mappedAddress: ExtendedAddress = {
      ...newAddress,
      ...sourceAddress,
      id: sourceAddress.id ?? undefined,
      patientId,
      locationJson: {
        country,
        district,
        community,
        area
      },
      countryId: country?.id ?? null,
      districtId: district?.id ?? null,
      communityId: community?.id ?? null,
      areaId: area?.id ?? null
    };

    if (country) {
      const mappedCountry = {
        id: country.id,
        name: country.name,
        code: country.code,
        displayName: getCountryDisplayName(country)
      } as SimpleCountry;

      setCountryCache(prev =>
        mergeUniqueById(prev, [mappedCountry])
      );

      setSelectedCountry(mappedCountry);
    }

    if (district) {
      setDistrictCache(prev =>
        mergeUniqueById(prev, [
          {
            id: district.id,
            name: district.name,
            code: district.code
          } as any
        ])
      );
    }

    if (community) {
      setCommunityCache(prev =>
        mergeUniqueById(prev, [
          {
            id: community.id,
            name: community.name
          } as any
        ])
      );
    }

    if (area) {
      setAreaCache(prev =>
        mergeUniqueById(prev, [
          {
            id: area.id,
            name: area.name
          } as any
        ])
      );
    }

    setAddress(mappedAddress);
    setBlockServerHydration(true);
    setHasHydratedFromCchi(true);
  };

  const resetLocationState = () => {
    setAddress({
      ...newAddress,
      patientId,
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

    setBlockServerHydration(false);
    setHasHydratedFromCchi(false);

    setDistrictSearch('');
    setCommunitySearch('');
    setAreaSearch('');

    setCountryPage(0);
    setDistrictPage(0);
    setCommunityPage(0);
    setAreaPage(0);

    setCountryCache([]);
    setDistrictCache([]);
    setCommunityCache([]);
    setAreaCache([]);
    setCountrySearch('');
    setSelectedCountry(null);

    setRefreshToken(prev => prev + 1);
  };

  const clearAddressManually = () => {
    resetLocationState();

    if (cchiStorageKey) {
      sessionStorage.removeItem(cchiStorageKey);
    }

    setCchiAddress?.(null);
  };

  useEffect(() => {
    if (!cchiStorageKey) return;
    if (cchiAddress) return;

    const saved = sessionStorage.getItem(cchiStorageKey);

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Address;
      hydrateAddressIntoState(parsed);
    } catch {
      sessionStorage.removeItem(cchiStorageKey);
    }
  }, [cchiStorageKey, cchiAddress]);

  const { data: addressesResult, isFetching } = useGetPatientAddressesQuery(
    { patientId },
    { skip: !patientId }
  );




  const isCountrySearching = countrySearch.trim().length > 0;

  const isDistrictSearching = districtSearch.trim().length > 0;
  const isCommunitySearching = communitySearch.trim().length > 0;
  const isAreaSearching = areaSearch.trim().length > 0;

  const {
    data: countriesResponse,
    isFetching: isFetchingCountries
  } = useGetActiveCountriesQuery(
    {
      page: countryPage,
      size: PAGE_SIZE,
      sort: 'id,asc'
    },
    {
      skip: isCountrySearching
    }
  );

  const {
    data: searchedCountriesResponse,
    isFetching: isFetchingSearchedCountries
  } = useGetCountryNamesQuery(
    {
      name: countrySearch.trim(),
      page: countryPage,
      size: PAGE_SIZE,
      sort: 'id,asc'
    },
    {
      skip: !isCountrySearching
    }
  );




  const {
    data: districtsResponse,
    isFetching: isFetchingDistricts
  } = useGetActiveDistrictsQuery(
    {
      page: districtPage,
      size: PAGE_SIZE,
      sort: 'id,asc',
      countryId: address.locationJson?.country?.id,
      timestamp: refreshToken
    },
    {
      skip:
        !address.locationJson?.country?.id ||
        isDistrictSearching
    }
  );

  const {
    data: searchedDistrictsResponse,
    isFetching: isFetchingSearchedDistricts
  } = useGetDistrictsByNameSearchQuery(
    {
      countryId: address.locationJson?.country?.id!,
      name: districtSearch.trim(),
      page: districtPage,
      size: PAGE_SIZE,
      sort: 'id,asc'
    },
    {
      skip:
        !address.locationJson?.country?.id ||
        !isDistrictSearching
    }
  );

  const {
    data: communitiesResponse,
    isFetching: isFetchingCommunities
  } = useGetActiveCommunitiesQuery(
    {
      page: communityPage,
      size: PAGE_SIZE,
      sort: 'id,asc',
      districtId: address.locationJson?.district?.id,
      timestamp: refreshToken
    },
    {
      skip:
        !address.locationJson?.district?.id ||
        isCommunitySearching
    }
  );

  const {
    data: searchedCommunitiesResponse,
    isFetching: isFetchingSearchedCommunities
  } = useGetCommunitiesByNameSearchQuery(
    {
      districtId: address.locationJson?.district?.id!,
      name: communitySearch.trim(),
      page: communityPage,
      size: PAGE_SIZE,
      sort: 'id,asc'
    },
    {
      skip:
        !address.locationJson?.district?.id ||
        !isCommunitySearching
    }
  );

  const {
    data: areasResponse,
    isFetching: isFetchingAreas
  } = useGetActiveAreasQuery(
    {
      page: areaPage,
      size: PAGE_SIZE,
      sort: 'id,asc',
      communityId: address.locationJson?.community?.id,
      timestamp: refreshToken
    },
    {
      skip:
        !address.locationJson?.community?.id ||
        isAreaSearching
    }
  );

  const {
    data: searchedAreasResponse,
    isFetching: isFetchingSearchedAreas
  } = useGetAreasByNameSearchQuery(
    {
      districtId: address.locationJson?.district?.id!,
      name: areaSearch.trim(),
      page: areaPage,
      size: PAGE_SIZE,
      sort: 'id,asc'
    },
    {
      skip:
        !address.locationJson?.district?.id ||
        !isAreaSearching
    }
  );

  useEffect(() => {
    if (!cchiAddress || !cchiStorageKey) return;

    sessionStorage.setItem(
      cchiStorageKey,
      JSON.stringify(cchiAddress)
    );

    hydrateAddressIntoState(cchiAddress);
  }, [cchiAddress, cchiStorageKey]);



  useEffect(() => {
    const response = isCountrySearching
      ? searchedCountriesResponse
      : countriesResponse;

    if (!response?.data) return;

    const mapped = response.data.map((country: any) => ({
      ...country,
      displayName: getCountryDisplayName(country)
    }));

    setCountryCache(prev => {
      if (countryPage === 0) {
        return mapped;
      }

      return mergeUniqueById(prev, mapped);
    });
  }, [
    countriesResponse,
    searchedCountriesResponse,
    isCountrySearching,
    countryPage,
    countryLabelMap
  ]);


  useEffect(() => {
    const response = isDistrictSearching
      ? searchedDistrictsResponse
      : districtsResponse;

    if (!response?.data) return;

    setDistrictCache(prev => {
      if (districtPage === 0) {
        return response.data;
      }

      return mergeUniqueById(prev, response.data);
    });
  }, [
    districtsResponse,
    searchedDistrictsResponse,
    isDistrictSearching,
    districtPage
  ]);


  useEffect(() => {
    const response = isCommunitySearching
      ? searchedCommunitiesResponse
      : communitiesResponse;

    if (!response?.data) return;

    setCommunityCache(prev => {
      if (communityPage === 0) {
        return response.data;
      }

      return mergeUniqueById(prev, response.data);
    });
  }, [
    communitiesResponse,
    searchedCommunitiesResponse,
    isCommunitySearching,
    communityPage
  ]);

  useEffect(() => {
    const response = isAreaSearching
      ? searchedAreasResponse
      : areasResponse;

    if (!response?.data) return;

    setAreaCache(prev => {
      if (areaPage === 0) {
        return response.data;
      }

      return mergeUniqueById(prev, response.data);
    });
  }, [
    areasResponse,
    searchedAreasResponse,
    isAreaSearching,
    areaPage
  ]);

  useEffect(() => {
    if (!patientId || isFetching) return;

    if (hasHydratedFromCchi && !address?.id) {
      return;
    }

    if (blockServerHydration) return;

    const existing = addressesResult?.data?.[0];
    if (!existing) return;

    const existingAddress: ExtendedAddress = {
      ...(existing as ExtendedAddress),
      patientId,
      countryId: existing.locationJson?.country?.id ?? null,
      districtId: existing.locationJson?.district?.id ?? null,
      communityId: existing.locationJson?.community?.id ?? null,
      areaId: existing.locationJson?.area?.id ?? null
    };

    setAddress(existingAddress);

    if (existing.locationJson?.country) {
      const country = existing.locationJson.country;

      const mappedCountry = {
        id: country.id,
        name: country.name,
        code: country.code,
        displayName: getCountryDisplayName(country)
      } as SimpleCountry;

      setCountryCache(prev =>
        mergeUniqueById(prev, [mappedCountry])
      );

      setSelectedCountry(mappedCountry);
    }

    if (existing.locationJson?.district) {
      const district = existing.locationJson.district;

      setDistrictCache(prev =>
        mergeUniqueById(prev, [
          {
            id: district.id,
            name: district.name,
            code: district.code
          } as any
        ])
      );
    }

    if (existing.locationJson?.community) {
      const community = existing.locationJson.community;

      setCommunityCache(prev =>
        mergeUniqueById(prev, [
          {
            id: community.id,
            name: community.name
          } as any
        ])
      );
    }

    if (existing.locationJson?.area) {
      const area = existing.locationJson.area;

      setAreaCache(prev =>
        mergeUniqueById(prev, [
          {
            id: area.id,
            name: area.name
          } as any
        ])
      );
    }
  }, [
    addressesResult,
    isFetching,
    patientId,
    blockServerHydration,
    hasHydratedFromCchi,
    address?.id
  ]);

  const [createAddress] = useCreateAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();

  const isLocationValid = !!address.countryId && !!address.districtId && !!address.communityId;

  const handleSave = async () => {
    if (!patientId) return;

    if (!isLocationValid) {
      dispatch(
        notify({
          msg: 'Country, District and Community are required',
          sev: 'error'
        })
      );
      return;
    }

    const payload: Address = {
      ...address,
      patientId,
      locationJson: address.locationJson
    };

    try {
      address.id
        ? await updateAddress({ id: address.id, patientId, body: payload }).unwrap()
        : await createAddress({ patientId, body: payload }).unwrap();

      setBlockServerHydration(false);
      setHasHydratedFromCchi(false);

      if (cchiStorageKey) {
        sessionStorage.removeItem(cchiStorageKey);
      }

      setRefreshToken(prev => prev + 1);

      dispatch(notify({ msg: 'Address Saved Successfully', sev: 'success' }));
    } catch (err: any) {
      setBlockServerHydration(true);

      const msg = toHumanAddressError(err, {
        countryId: 'Country',
        districtId: 'District',
        communityId: 'Community',
        areaId: 'Area',
        streetName: 'Street Name',
        houseApartmentNumber: 'House/Apartment Number',
        postalZipCode: 'Postal/ZIP code',
        additionalAddressLine: 'Additional Address Line',
        locationJson: 'Location'
      });

      dispatch(notify({ msg, sev: 'error' }));
    }
  };




  const countrySelectData = (() => {
    if (!selectedCountry?.id) {
      return countryCache;
    }

    const exists = countryCache.some(
      item => String(item?.id) === String(selectedCountry.id)
    );

    if (exists) {
      return countryCache;
    }

    return [selectedCountry, ...countryCache];
  })();

  return (
    <>
      <SectionContainer
        title={<Translate>Address</Translate>}
        action={
          <div className="flex-row-22">
            <MyButton color="var(--primary-gray)" onClick={clearAddressManually} width="90px">
              <FaBroom /> Clear
            </MyButton>

            <MyButton
              color="var(--deep-blue)"
              onClick={handleSave}
              disabled={!patientId || !isLocationValid}
            >
              <FaSave /> {address.id ? 'Update' : 'Save'}
            </MyButton>
          </div>
        }
        content={
          <div>
            <MyButton
              color="var(--primary-gray)"
              onClick={() => setOpenChangeLog(true)}
              width="170px"
              disabled={!patientId}
            >
              <Translate>Address Change Log</Translate>
            </MyButton>

            <Form layout="inline" fluid>
              <MyInput
                column
                required
                fieldLabel="Countrysssssss"
                fieldType="selectPagination"
                fieldName="countryId"

                selectData={countrySelectData}
                selectDataLabel="displayName"
                selectDataValue="id"

                record={address}
                setRecord={setAddress}

                searchKeyWard={countrySearch}
                setSearchKeyWard={handleCountrySearch}

                loading={
                  isFetchingCountries ||
                  isFetchingSearchedCountries
                }

                hasMore={
                  isCountrySearching
                    ? !!searchedCountriesResponse?.links?.next
                    : !!countriesResponse?.links?.next
                }

                onFetchMore={() => {
                  if (isCountrySearching) {
                    if (!searchedCountriesResponse?.links?.next) {
                      return;
                    }

                    const { page } = extractPaginationFromLink(
                      searchedCountriesResponse.links.next
                    );

                    setCountryPage(page);
                    return;
                  }

                  if (!countriesResponse?.links?.next) {
                    return;
                  }

                  const { page } = extractPaginationFromLink(
                    countriesResponse.links.next
                  );

                  setCountryPage(page);
                }}

                onSelectItem={(item: SimpleCountry | null) => {
                  if (!item) {
                    return clearAddressManually();
                  }

                  setSelectedCountry(item);

                  setAddress(prev => ({
                    ...prev,
                    countryId: item.id,
                    districtId: null,
                    communityId: null,
                    areaId: null,
                    locationJson: {
                      country: {
                        id: item.id,
                        name: item.name,
                        code: item.code
                      },
                      district: null,
                      community: null,
                      area: null
                    }
                  }));

                  setDistrictCache([]);
                  setCommunityCache([]);
                  setAreaCache([]);

                  setDistrictPage(0);
                  setCommunityPage(0);
                  setAreaPage(0);

                  setDistrictSearch('');
                  setCommunitySearch('');
                  setAreaSearch('');

                  setRefreshToken(prev => prev + 1);
                }}

                disabled={!patientId}
              />

              <MyInput
                column
                required
                fieldLabel="District"
                fieldType="selectPagination"
                fieldName="districtId"
                selectData={districtCache}
                selectDataLabel="name"
                selectDataValue="id"
                record={{
                  ...address,
                  districtId: address.countryId ? address.districtId : null
                }}
                setRecord={setAddress}
                searchKeyWard={districtSearch}
                setSearchKeyWard={handleDistrictSearch}

                loading={
                  isFetchingDistricts ||
                  isFetchingSearchedDistricts
                }

                hasMore={
                  isDistrictSearching
                    ? !!searchedDistrictsResponse?.links?.next
                    : !!districtsResponse?.links?.next
                }
                disabled={!address.countryId}
                onFetchMore={() => {
                  const response = isDistrictSearching
                    ? searchedDistrictsResponse
                    : districtsResponse;

                  if (!response?.links?.next) {
                    return;
                  }

                  const { page } = extractPaginationFromLink(
                    response.links.next
                  );

                  setDistrictPage(page);
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
                      district: {
                        id: item.id,
                        name: item.name,
                        code: item.code
                      },
                      community: null,
                      area: null
                    }
                  }));

                  setCommunityCache([]);
                  setAreaCache([]);

                  setCommunityPage(0);
                  setAreaPage(0);

                  setCommunitySearch('');
                  setAreaSearch('');

                  setRefreshToken(prev => prev + 1);
                }}
              />

              <MyInput
                column
                required
                fieldLabel="Community"
                fieldType="selectPagination"
                fieldName="communityId"
                selectData={communityCache}
                selectDataLabel="name"
                selectDataValue="id"
                record={{
                  ...address,
                  communityId: address.districtId ? address.communityId : null
                }}
                setRecord={setAddress}
                searchKeyWard={communitySearch}
                setSearchKeyWard={handleCommunitySearch}

                loading={
                  isFetchingCommunities ||
                  isFetchingSearchedCommunities
                }

                hasMore={
                  isCommunitySearching
                    ? !!searchedCommunitiesResponse?.links?.next
                    : !!communitiesResponse?.links?.next
                }
                disabled={!address.districtId}
                onFetchMore={() => {
                  const response = isCommunitySearching
                    ? searchedCommunitiesResponse
                    : communitiesResponse;

                  if (!response?.links?.next) {
                    return;
                  }

                  const { page } = extractPaginationFromLink(
                    response.links.next
                  );

                  setCommunityPage(page);
                }}
                onSelectItem={(item: SimpleCommunity | null) => {
                  if (!item) return;

                  setAddress(prev => ({
                    ...prev,
                    communityId: item.id,
                    areaId: null,
                    locationJson: {
                      ...prev.locationJson,
                      community: {
                        id: item.id,
                        name: item.name
                      },
                      area: null
                    }
                  }));

                  setAreaCache([]);
                  setAreaPage(0);
                  setAreaSearch('');

                  setRefreshToken(prev => prev + 1);
                }}
              />

              <MyInput
                column
                fieldLabel="Area"
                fieldType="selectPagination"
                fieldName="areaId"
                selectData={areaCache}
                selectDataLabel="name"
                selectDataValue="id"
                record={{
                  ...address,
                  areaId: address.communityId ? address.areaId : null
                }}
                setRecord={setAddress}
                searchKeyWard={areaSearch}
                setSearchKeyWard={handleAreaSearch}

                loading={
                  isFetchingAreas ||
                  isFetchingSearchedAreas
                }

                hasMore={
                  isAreaSearching
                    ? !!searchedAreasResponse?.links?.next
                    : !!areasResponse?.links?.next
                }
                disabled={!address.communityId}
                onFetchMore={() => {
                  const response = isAreaSearching
                    ? searchedAreasResponse
                    : areasResponse;

                  if (!response?.links?.next) {
                    return;
                  }

                  const { page } = extractPaginationFromLink(
                    response.links.next
                  );

                  setAreaPage(page);
                }}
                onSelectItem={(item: SimpleArea | null) => {
                  if (!item) return;

                  setAddress(prev => ({
                    ...prev,
                    areaId: item.id,
                    locationJson: {
                      ...prev.locationJson,
                      area: {
                        id: item.id,
                        name: item.name
                      }
                    }
                  }));
                }}
              />

              <MyInput
                column
                fieldLabel="Street Name"
                fieldName="streetName"
                record={address}
                setRecord={setAddress}
                disabled={!patientId}
              />

              <MyInput
                column
                fieldLabel="House/Apartment Number"
                fieldName="houseApartmentNumber"
                record={address}
                setRecord={setAddress}
                disabled={!patientId}
              />

              <MyInput
                column
                fieldLabel="Postal/ZIP code"
                fieldName="postalZipCode"
                record={address}
                setRecord={setAddress}
                disabled={!patientId}
              />

              <MyInput
                column
                fieldLabel="Additional Address Line"
                fieldName="additionalAddressLine"
                record={address}
                setRecord={setAddress}
                disabled={!patientId}
              />
            </Form>
          </div>
        }
      />

      <AddressChangeLogModal
        open={openChangeLog}
        setOpen={setOpenChangeLog}
        patientId={patientId}
      />
    </>
  );
};

export default AddressTab;