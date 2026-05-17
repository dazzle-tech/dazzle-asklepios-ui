import React, { useEffect, useState } from 'react';
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

import { useGetActiveCountriesQuery } from '@/services/setup/country/countryService';
import { useGetActiveDistrictsQuery } from '@/services/setup/country/countryDistrictService';
import { useGetActiveCommunitiesQuery } from '@/services/setup/country/districtCommunityService';
import { useGetActiveAreasQuery } from '@/services/setup/country/communityAreaService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

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
import { conjureValueBasedOnKeyFromList } from '@/utils';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

import { FaBroom } from 'react-icons/fa6';
import { FaSave } from 'react-icons/fa';
import clsx from 'clsx';
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
  const errorKey = String(rawKey)
    .replace(/^error\./, '')
    .trim();

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

/* ========================================================= */
/* ======================= Component ======================== */
/* ========================================================= */

interface AddressTabProps {
  localPatient: any;
}

type ExtendedAddress = Address & {
  countryId?: number | null;
  districtId?: number | null;
  communityId?: number | null;
  areaId?: number | null;
};

const PAGE_SIZE = 5;

const AddressTab: React.FC<AddressTabProps> = ({ localPatient }) => {
  const dispatch = useAppDispatch();
  const patientId = localPatient?.id;

  const [refreshToken, setRefreshToken] = useState(0);

  const [blockServerHydration, setBlockServerHydration] = useState(false);

  const [address, setAddress] = useState<ExtendedAddress>({
    ...newAddress,
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

  const [openChangeLog, setOpenChangeLog] = useState(false);

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

    setCountrySearch('');
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

    setRefreshToken(prev => prev + 1);
  };

  useEffect(() => {
    if (patientId) {
      setBlockServerHydration(false);
      resetLocationState();
    }
  }, [patientId]);

  useEffect(() => {
    if (!patientId) {
      setBlockServerHydration(false);
      resetLocationState();
    }
  }, [patientId]);

  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');

  const { data: addressesResult, isFetching } = useGetPatientAddressesQuery(
    { patientId },
    { skip: !patientId }
  );

  const { data: countriesResponse } = useGetActiveCountriesQuery({
    page: countryPage,
    size: PAGE_SIZE,
    search: countrySearch || undefined,
    sort: 'id,asc',
    refreshToken
  });

  const { data: districtsResponse } = useGetActiveDistrictsQuery(
    {
      page: districtPage,
      size: PAGE_SIZE,
      search: districtSearch || undefined,
      sort: 'id,asc',
      countryId: address.locationJson?.country?.id,
      refreshToken
    },
    { skip: !address.locationJson?.country?.id }
  );

  const { data: communitiesResponse } = useGetActiveCommunitiesQuery(
    {
      page: communityPage,
      size: PAGE_SIZE,
      search: communitySearch || undefined,
      sort: 'id,asc',
      districtId: address.locationJson?.district?.id,
      refreshToken
    },
    { skip: !address.locationJson?.district?.id }
  );

  const { data: areasResponse } = useGetActiveAreasQuery(
    {
      page: areaPage,
      size: PAGE_SIZE,
      search: areaSearch || undefined,
      sort: 'id,asc',
      communityId: address.locationJson?.community?.id,
      refreshToken
    },
    { skip: !address.locationJson?.community?.id }
  );

  useEffect(() => {
    if (!countriesResponse?.data) return;

    const mapped = countriesResponse.data.map((c: any) => ({
      ...c,
      displayName:
        conjureValueBasedOnKeyFromList(
          countryLovQueryResponse?.object ?? [],
          c.name,
          'lovDisplayVale'
        ) || c.name
    }));

    setCountryCache(prev => (countryPage === 0 ? mapped : [...prev, ...mapped]));
  }, [countriesResponse, countryPage, countryLovQueryResponse]);

  useEffect(() => {
    if (!districtsResponse?.data) return;
    setDistrictCache(prev =>
      districtPage === 0 ? districtsResponse.data : [...prev, ...districtsResponse.data]
    );
  }, [districtsResponse, districtPage]);

  useEffect(() => {
    if (!communitiesResponse?.data) return;
    setCommunityCache(prev =>
      communityPage === 0 ? communitiesResponse.data : [...prev, ...communitiesResponse.data]
    );
  }, [communitiesResponse, communityPage]);

  useEffect(() => {
    if (!areasResponse?.data) return;
    setAreaCache(prev => (areaPage === 0 ? areasResponse.data : [...prev, ...areasResponse.data]));
  }, [areasResponse, areaPage]);

  // IMPORTANT FIX: don't hydrate from server if last save failed
  useEffect(() => {
    if (!patientId || isFetching) return;
    if (blockServerHydration) return;

    const existing = addressesResult?.data?.[0];
    if (!existing) return;

    setAddress({
      ...(existing as ExtendedAddress),
      countryId: existing.locationJson?.country?.id ?? null,
      districtId: existing.locationJson?.district?.id ?? null,
      communityId: existing.locationJson?.community?.id ?? null,
      areaId: existing.locationJson?.area?.id ?? null
    });
  }, [addressesResult, isFetching, patientId, blockServerHydration]);

  const [createAddress] = useCreateAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();

  const isLocationValid = !!address.countryId && !!address.districtId && !!address.communityId;

  const handleSave = async () => {
    if (!patientId) return;

    if (!isLocationValid) {
      dispatch(
        notify({
          msg: 'Country, District, Community and Area are required',
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

  return (
    <>
      <SectionContainer
        title={<Translate>Address</Translate>}
        action={
          <div className="flex-row-22">
            <MyButton color="var(--primary-gray)" onClick={resetLocationState} width="90px">
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
            <div className={clsx('', { 'disabled-panel': localPatient?.patientStatus === 'MERGED' })}>

              <Form layout="inline" fluid>
                <MyInput
                  column
                  required
                  fieldLabel="Country"
                  fieldType="selectPagination"
                  fieldName="countryId"
                  selectData={countryCache}
                  selectDataLabel="displayName"
                  selectDataValue="id"
                  record={address}
                  setRecord={setAddress}
                  searchKeyWard={countrySearch}
                  setSearchKeyWard={setCountrySearch}
                  hasMore={!!countriesResponse?.links?.next}
                  onFetchMore={() => {
                    if (countriesResponse?.links?.next) {
                      const { page } = extractPaginationFromLink(countriesResponse.links.next);
                      setCountryPage(page);
                    }
                  }}
                  onSelectItem={(item: SimpleCountry | null) => {
                    if (!item) return resetLocationState();

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
                  disabled={!localPatient?.id}
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
                  setSearchKeyWard={setDistrictSearch}
                  hasMore={!!districtsResponse?.links?.next}
                  disabled={!address.countryId}
                  onFetchMore={() => {
                    if (districtsResponse?.links?.next) {
                      const { page } = extractPaginationFromLink(districtsResponse.links.next);
                      setDistrictPage(page);
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
                  setSearchKeyWard={setCommunitySearch}
                  hasMore={!!communitiesResponse?.links?.next}
                  disabled={!address.districtId}
                  onFetchMore={() => {
                    if (communitiesResponse?.links?.next) {
                      const { page } = extractPaginationFromLink(communitiesResponse.links.next);
                      setCommunityPage(page);
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
                  setSearchKeyWard={setAreaSearch}
                  hasMore={!!areasResponse?.links?.next}
                  disabled={!address.communityId}
                  onFetchMore={() => {
                    if (areasResponse?.links?.next) {
                      const { page } = extractPaginationFromLink(areasResponse.links.next);
                      setAreaPage(page);
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
                  column
                  fieldLabel="Street Name"
                  fieldName="streetName"
                  record={address}
                  setRecord={setAddress}
                  disabled={!localPatient?.id}
                />

                <MyInput
                  column
                  fieldLabel="House/Apartment Number"
                  fieldName="houseApartmentNumber"
                  record={address}
                  setRecord={setAddress}
                  disabled={!localPatient?.id}
                />

                <MyInput
                  column
                  fieldLabel="Postal/ZIP code"
                  fieldName="postalZipCode"
                  record={address}
                  setRecord={setAddress}
                  disabled={!localPatient?.id}
                />

                <MyInput
                  column
                  fieldLabel="Additional Address Line"
                  fieldName="additionalAddressLine"
                  record={address}
                  setRecord={setAddress}
                  disabled={!localPatient?.id}
                />
              </Form>
            </div>
          </div>
        }
      />

      <AddressChangeLogModal
        open={openChangeLog}
        setOpen={setOpenChangeLog}
        patientId={patientId}
        countryLovQueryResponse={countryLovQueryResponse}
      />
    </>
  );
};

export default AddressTab;
