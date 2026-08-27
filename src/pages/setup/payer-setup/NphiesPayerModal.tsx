import React, { useMemo } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { NphiesPayer } from '@/types/model-types-new';
import SectionContainer from '@/components/SectionsoContainer';
import './styles.less';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import { useGetActiveCountriesQuery } from '@/services/setup/country/countryService';
import { useGetActiveDistrictsQuery } from '@/services/setup/country/countryDistrictService';
import { useGetAllTpaDefinitionsQuery } from '@/services/setup/payer/TpaDefinitionSetupService';

type NphiesPayerModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  payer: NphiesPayer;
  setPayer: React.Dispatch<React.SetStateAction<NphiesPayer>>;
  onSave: () => void;
};

const statusOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false }
];

const NphiesPayerModal: React.FC<NphiesPayerModalProps> = ({
  open,
  setOpen,
  payer,
  setPayer,
  onSave
}) => {
  const { data: activeFacilities = [], isFetching: isFacilitiesLoading } =
    useGetActiveFacilitiesQuery(undefined, { skip: !open });

  const { data: countriesResponse, isFetching: isCountriesLoading } = useGetActiveCountriesQuery(
    { page: 0, size: 500, sort: 'id,asc' },
    { skip: !open }
  );

  const { data: citiesResponse, isFetching: isCitiesLoading } = useGetActiveDistrictsQuery(
    {
      countryId: payer.countryId as number,
      page: 0,
      size: 500,
      sort: 'name,asc'
    },
    { skip: !open || !payer.countryId }
  );

  const { data: tpaResponse, isFetching: isTpasLoading } = useGetAllTpaDefinitionsQuery(
    { page: 0, size: 1000, sort: 'id,asc' },
    { skip: !open }
  );

  const facilityOptions = useMemo(() => {
    const list = Array.isArray(activeFacilities) ? [...activeFacilities] : [];
    if (
      payer.facilityId &&
      !list.some((facility: { id?: number }) => facility.id === payer.facilityId)
    ) {
      list.unshift({
        id: payer.facilityId,
        name: payer.facilityName || `Facility #${payer.facilityId}`
      });
    }
    return list;
  }, [activeFacilities, payer.facilityId, payer.facilityName]);

  const countryOptions = useMemo(() => {
    const list = (countriesResponse?.data ?? []).map((country: any) => ({
      ...country,
      displayName: String(country?.name ?? '').replaceAll('_', ' ')
    }));
    if (
      payer.countryId &&
      !list.some((country: { id?: number }) => country.id === payer.countryId)
    ) {
      list.unshift({
        id: payer.countryId,
        displayName: payer.countryName
          ? String(payer.countryName).replaceAll('_', ' ')
          : `Country #${payer.countryId}`
      });
    }
    return list;
  }, [countriesResponse, payer.countryId, payer.countryName]);

  const cityOptions = useMemo(() => {
    const list = [...(citiesResponse?.data ?? [])];
    if (payer.cityId && !list.some((city: { id?: number }) => city.id === payer.cityId)) {
      list.unshift({
        id: payer.cityId,
        name: payer.cityName || `City #${payer.cityId}`
      });
    }
    return list;
  }, [citiesResponse, payer.cityId, payer.cityName]);

  const tpaOptions = useMemo(() => {
    const raw = Array.isArray(tpaResponse) ? tpaResponse : tpaResponse?.data ?? [];
    const byId = new Map<number, any>();
    [...raw, ...(payer.tpas ?? [])].forEach(tpa => {
      if (tpa?.id == null || byId.has(tpa.id)) {
        return;
      }
      byId.set(tpa.id, tpa);
    });
    return [...byId.values()]
      .filter(tpa => tpa.isActive !== false || (payer.tpaIds ?? []).includes(tpa.id))
      .map(tpa => ({
        value: tpa.id,
        label: [tpa.tpaCode, tpa.name].filter(Boolean).join(' - ') || `TPA #${tpa.id}`,
        isActive: tpa.isActive !== false
      }));
  }, [tpaResponse, payer.tpas, payer.tpaIds]);

  const handleSetPayer: React.Dispatch<React.SetStateAction<NphiesPayer>> = updated => {
    const next = typeof updated === 'function' ? updated(payer) : updated;
    if (next.countryId !== payer.countryId) {
      setPayer({ ...next, cityId: null, cityName: null });
      return;
    }
    setPayer({
      ...next,
      tpaIds: [...new Set(next.tpaIds ?? [])]
    });
  };

  const fieldProps = {
    record: payer,
    setRecord: handleSetPayer,
    width: '100%' as const,
    column: true
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={payer.id ? 'Edit Insurance Company' : 'Add Insurance Company'}
      size="88vw"
      bodyheight="78vh"
      actionButtonLabel="Save"
      actionButtonFunction={onSave}
      modalColor="var(--primary-blue)"
      steps={[]}
      content={
        <Form fluid layout="vertical" className="nphies-payer-form">
          <div className="nphies-payer-modal-section-container">
            <SectionContainer
              title="Basic Information"
              content={
                <div className="nphies-payer-fields-grid">
                  <MyInput
                    {...fieldProps}
                    fieldName="nphiesId"
                    fieldType="text"
                    fieldLabel="Insurance Company Code"
                    required
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="nameEn"
                    fieldType="text"
                    fieldLabel="Insurance Company Name"
                    required
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="nameAr"
                    fieldType="text"
                    fieldLabel="Arabic Name"
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="shortName"
                    fieldType="text"
                    fieldLabel="Short Name"
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="facilityId"
                    fieldType="select"
                    fieldLabel="Facility Name"
                    selectData={facilityOptions}
                    selectDataLabel="name"
                    selectDataValue="id"
                    searchable
                    loading={isFacilitiesLoading}
                    required
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="isActive"
                    fieldType="select"
                    fieldLabel="Status"
                    selectData={statusOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    searchable={false}
                    required
                  />
                  <div className="nphies-payer-field-span-2">
                    <MyInput
                      {...fieldProps}
                      fieldName="tpaIds"
                      fieldType="checkPicker"
                      fieldLabel="Linked TPAs"
                      selectData={tpaOptions}
                      selectDataLabel="displayName"
                      selectDataValue="id"
                      loading={isTpasLoading}
                      disableByField="isActive"
                      placeholder="Select one or more TPAs"
                    />
                  </div>
                </div>
              }
            />

            <SectionContainer
              title="Saudi Regulatory Information"
              content={
                <div className="nphies-payer-fields-grid nphies-payer-fields-grid-4">
                  <MyInput
                    {...fieldProps}
                    fieldName="insuranceAuthorityLicenseNo"
                    fieldType="text"
                    fieldLabel="Insurance Authority License No."
                    required
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="commercialRegistrationNo"
                    fieldType="text"
                    fieldLabel="Commercial Registration No. (CR)"
                    required
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="vatRegistrationNo"
                    fieldType="text"
                    fieldLabel="VAT Registration No."
                    required
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="unifiedNationalNo"
                    fieldType="text"
                    fieldLabel="Unified National No."
                  />
                </div>
              }
            />

            <SectionContainer
              title="Contact Information"
              content={
                <div className="nphies-payer-fields-grid">
                  <div className="nphies-payer-field-span-full">
                    <MyInput
                      {...fieldProps}
                      fieldName="headOfficeAddress"
                      fieldType="textarea"
                      fieldLabel="Head Office Address"
                      rows={3}
                    />
                  </div>
                  <MyInput
                    {...fieldProps}
                    fieldName="countryId"
                    fieldType="select"
                    fieldLabel="Country"
                    selectData={countryOptions}
                    selectDataLabel="displayName"
                    selectDataValue="id"
                    searchable
                    loading={isCountriesLoading}
                    cleanable
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="cityId"
                    fieldType="select"
                    fieldLabel="City"
                    selectData={cityOptions}
                    selectDataLabel="name"
                    selectDataValue="id"
                    searchable
                    loading={isCitiesLoading}
                    disabled={!payer.countryId}
                    cleanable
                    placeholder={payer.countryId ? 'Select city' : 'Select country first'}
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="postalCode"
                    fieldType="text"
                    fieldLabel="Postal Code"
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="contactPerson"
                    fieldType="text"
                    fieldLabel="Contact Person"
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="phone"
                    fieldType="text"
                    fieldLabel="Phone"
                    required
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="mobile"
                    fieldType="text"
                    fieldLabel="Mobile"
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="email"
                    fieldType="text"
                    fieldLabel="Email"
                    required
                  />
                  <div className="nphies-payer-field-span-2">
                    <MyInput
                      {...fieldProps}
                      fieldName="website"
                      fieldType="text"
                      fieldLabel="Website"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              }
            />
          </div>
        </Form>
      }
    />
  );
};

export default NphiesPayerModal;
