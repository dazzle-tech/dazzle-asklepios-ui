import React, { useMemo } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { NphiesPayer } from '@/types/model-types-new';
import SectionContainer from '@/components/SectionsoContainer';
import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import { useGetActiveCountriesQuery } from '@/services/setup/country/countryService';
import { useGetActiveDistrictsQuery } from '@/services/setup/country/countryDistrictService';
import { useGetAllTpaDefinitionsQuery } from '@/services/setup/payer/TpaDefinitionSetupService';
import { APPROVAL_COVERAGE_COMPANY_LABELS, approvalCoverageCompanyOptions } from '@/pages/setup/coverage-management/coverageHelpers';

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

  const approvalCoverageCompanies = approvalCoverageCompanyOptions(
    useEnumOptions('ApprovalCoverageCompany', {
      labelOverrides: APPROVAL_COVERAGE_COMPANY_LABELS
    })
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
    const raw = Array.isArray(tpaResponse)
      ? tpaResponse
      : tpaResponse?.data ?? tpaResponse?.content ?? [];
    const byId = new Map<number, any>();
    [...raw, ...(payer.tpas ?? [])].forEach(tpa => {
      const id = Number(tpa?.id ?? tpa?.tpaId ?? tpa?.value);
      if (!Number.isFinite(id) || byId.has(id)) {
        return;
      }
      byId.set(id, { ...tpa, id });
    });
    const options = [...byId.values()]
      .filter(tpa => tpa.isActive !== false || (payer.tpaIds ?? []).includes(tpa.id))
      .map(tpa => {
        const tpaCode = String(tpa.tpaCode ?? tpa.code ?? '').trim();
        const name = String(tpa.name ?? tpa.tpaName ?? tpa.label ?? '').trim();
        return {
          value: tpa.id,
          label: [tpaCode, name].filter(Boolean).join(' - ') || `TPA #${tpa.id}`,
          isActive: tpa.isActive !== false
        };
      });
    (payer.tpaIds ?? []).forEach(id => {
      if (id != null && !options.some(option => option.value === id)) {
        options.push({ value: id, label: `TPA #${id}`, isActive: true });
      }
    });
    return options;
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
      title={payer.id ? 'Edit Payer Company' : 'Add Payer Company'}
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
                    fieldLabel="Payer Company Code"
                    required
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="nameEn"
                    fieldType="text"
                    fieldLabel="Payer Company Name"
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
                  <MyInput
                    {...fieldProps}
                    fieldName="approvalCoverageCompany"
                    fieldType="select"
                    fieldLabel="Approval Coverage Co."
                    selectData={approvalCoverageCompanies}
                    selectDataLabel="label"
                    selectDataValue="value"
                    searchable={false}
                    cleanable
                  />
                  <div className="nphies-payer-field-span-2">
                    <MyInput
                      {...fieldProps}
                      fieldName="tpaIds"
                      fieldType="checkPicker"
                      fieldLabel="Linked TPAs"
                      selectData={tpaOptions}
                      selectDataLabel="label"
                      selectDataValue="value"
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
