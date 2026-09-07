import React, { useMemo } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { NphiesPayer, TpaDefinition } from '@/types/model-types-new';
import SectionContainer from '@/components/SectionsoContainer';
import './styles.less';
import { useGetActiveCountriesQuery } from '@/services/setup/country/countryService';
import { useGetActiveDistrictsQuery } from '@/services/setup/country/countryDistrictService';
import { useGetAllNphiesPayersQuery } from '@/services/setup/payer/NphiesPayerSetupService';
import {
  normalizeLinkedInsuranceCompany,
  unwrapList,
  useGetLinkableInsuranceCompaniesQuery,
  useGetTpaLinkedInsuranceCompaniesQuery
} from '@/services/setup/payer/TpaDefinitionSetupService';

type TpaDefinitionModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  tpa: TpaDefinition;
  setTpa: React.Dispatch<React.SetStateAction<TpaDefinition>>;
  onSave: () => void;
  insuranceCompanies?: NphiesPayer[];
};

const statusOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false }
];

const guarantorTypeOptions = [{ label: 'TPA', value: 'TPA' }];

const TpaDefinitionModal: React.FC<TpaDefinitionModalProps> = ({
  open,
  setOpen,
  tpa,
  setTpa,
  onSave,
  insuranceCompanies = []
}) => {
  const { data: countriesResponse, isFetching: isCountriesLoading } = useGetActiveCountriesQuery(
    { page: 0, size: 500, sort: 'id,asc' },
    { skip: !open }
  );

  const { data: citiesResponse, isFetching: isCitiesLoading } = useGetActiveDistrictsQuery(
    {
      countryId: tpa.countryId as number,
      page: 0,
      size: 500,
      sort: 'name,asc'
    },
    { skip: !open || !tpa.countryId }
  );

  const { data: payersResponse, isFetching: isPayersLoading } = useGetAllNphiesPayersQuery(
    { page: 0, size: 100, sort: 'id,asc' },
    { skip: !open, refetchOnMountOrArgChange: true }
  );

  const { data: linkedCompanies = [] } = useGetTpaLinkedInsuranceCompaniesQuery(tpa.id as number, {
    skip: !open || !tpa.id
  });

  const { data: linkableCompanies = [], isFetching: isLinkableLoading } =
    useGetLinkableInsuranceCompaniesQuery(undefined, { skip: !open });

  const countryOptions = useMemo(() => {
    const list = (countriesResponse?.data ?? []).map((country: any) => ({
      ...country,
      displayName: String(country?.name ?? '').replaceAll('_', ' ')
    }));
    if (tpa.countryId && !list.some((country: { id?: number }) => country.id === tpa.countryId)) {
      list.unshift({
        id: tpa.countryId,
        displayName: tpa.countryName
          ? String(tpa.countryName).replaceAll('_', ' ')
          : `Country #${tpa.countryId}`
      });
    }
    return list;
  }, [countriesResponse, tpa.countryId, tpa.countryName]);

  const cityOptions = useMemo(() => {
    const list = [...(citiesResponse?.data ?? [])];
    if (tpa.cityId && !list.some((city: { id?: number }) => city.id === tpa.cityId)) {
      list.unshift({
        id: tpa.cityId,
        name: tpa.cityName || `City #${tpa.cityId}`
      });
    }
    return list;
  }, [citiesResponse, tpa.cityId, tpa.cityName]);

  const insuranceOptions = useMemo(() => {
    const byId = new Map<number, NonNullable<ReturnType<typeof normalizeLinkedInsuranceCompany>>>();
    [
      ...unwrapList(insuranceCompanies),
      ...unwrapList(payersResponse),
      ...unwrapList(linkableCompanies),
      ...unwrapList(linkedCompanies),
      ...unwrapList(tpa.insuranceCompanies)
    ].forEach(item => {
      const company = normalizeLinkedInsuranceCompany(item);
      if (!company) {
        return;
      }
      const existing = byId.get(company.id);
      byId.set(company.id, {
        id: company.id,
        nphiesId: company.nphiesId || existing?.nphiesId || '',
        nameEn: company.nameEn || existing?.nameEn || '',
        nameAr: company.nameAr || existing?.nameAr || null,
        isActive:
          !company.nphiesId && !company.nameEn
            ? existing?.isActive ?? company.isActive
            : company.isActive
      });
    });
    return [...byId.values()]
      .filter(
        company =>
          company.isActive !== false || (tpa.insuranceCompanyIds ?? []).includes(company.id)
      )
      .map(company => {
        const displayName =
          [company.nphiesId, company.nameEn].filter(Boolean).join(' - ') || `Company #${company.id}`;
        return {
          id: company.id,
          displayName,
          isActive: company.isActive !== false
        };
      });
  }, [
    insuranceCompanies,
    payersResponse,
    linkableCompanies,
    linkedCompanies,
    tpa.insuranceCompanies,
    tpa.insuranceCompanyIds
  ]);

  const toId = (value: unknown): number | null => {
    if (value == null || value === '') {
      return null;
    }
    if (typeof value === 'object') {
      const nested = Number(
        (value as { id?: unknown; value?: unknown }).id ??
          (value as { value?: unknown }).value
      );
      return Number.isFinite(nested) ? nested : null;
    }
    const id = Number(value);
    return Number.isFinite(id) ? id : null;
  };

  const handleSetTpa: React.Dispatch<React.SetStateAction<TpaDefinition>> = updated => {
    const next = typeof updated === 'function' ? updated(tpa) : updated;
    const countryId = toId(next.countryId);
    const previousCountryId = toId(tpa.countryId);
    const cityId = countryId !== previousCountryId ? null : toId(next.cityId);
    setTpa({
      ...next,
      countryId,
      cityId,
      cityName: countryId !== previousCountryId ? null : next.cityName,
      insuranceCompanyIds: [
        ...new Set((next.insuranceCompanyIds ?? []).map(toId).filter((id): id is number => id != null))
      ]
    });
  };

  const fieldProps = {
    record: tpa,
    setRecord: handleSetTpa,
    width: '100%' as const,
    column: true
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={tpa.id ? 'Edit TPA' : 'Add TPA'}
      size="78vw"
      bodyheight="72vh"
      actionButtonLabel="Save"
      actionButtonFunction={onSave}
      modalColor="var(--primary-blue)"
      steps={[]}
      content={
        <Form fluid layout="vertical" className="nphies-payer-form">
          <div className="nphies-payer-modal-section-container">
            <SectionContainer
              title="TPA Information"
              content={
                <div className="nphies-payer-fields-grid">
                  <MyInput
                    {...fieldProps}
                    fieldName="tpaCode"
                    fieldType="text"
                    fieldLabel="TPA Code"
                    required
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="name"
                    fieldType="text"
                    fieldLabel="Name"
                    required
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="guarantorType"
                    fieldType="select"
                    fieldLabel="Guarantor Type"
                    selectData={guarantorTypeOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    searchable={false}
                    required
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="activationDate"
                    fieldType="date"
                    fieldLabel="Activation Date"
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
                    fieldName="taxRegistrationNo"
                    fieldType="text"
                    fieldLabel="Tax Registration No."
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
                      fieldName="address"
                      fieldType="textarea"
                      fieldLabel="Address"
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
                    disabled={!tpa.countryId}
                    cleanable
                    placeholder={tpa.countryId ? 'Select city' : 'Select country first'}
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="phone"
                    fieldType="text"
                    fieldLabel="Phone"
                  />
                  <MyInput
                    {...fieldProps}
                    fieldName="email"
                    fieldType="text"
                    fieldLabel="Email"
                  />
                  <div className="nphies-payer-field-span-2">
                    <MyInput
                      {...fieldProps}
                      fieldName="insuranceCompanyIds"
                      fieldType="checkPicker"
                      fieldLabel="Insurance Name"
                      selectData={insuranceOptions}
                      selectDataLabel="displayName"
                      selectDataValue="id"
                      searchable
                      virtualized={false}
                      loading={isPayersLoading || isLinkableLoading}
                      disableByField="isActive"
                      disabled={!tpa.isActive}
                      placeholder={
                        tpa.isActive
                          ? 'Select insurance companies'
                          : 'Activate TPA before linking insurance'
                      }
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

export default TpaDefinitionModal;
