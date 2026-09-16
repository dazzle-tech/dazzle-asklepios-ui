import React, { useMemo } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { TpaDefinition } from '@/types/model-types-new';
import SectionContainer from '@/components/SectionsoContainer';
import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetActiveCountriesQuery } from '@/services/setup/country/countryService';
import { useGetActiveDistrictsQuery } from '@/services/setup/country/countryDistrictService';
import { APPROVAL_COVERAGE_COMPANY_LABELS, approvalCoverageCompanyOptions } from '@/pages/setup/coverage-management/coverageHelpers';

type TpaDefinitionModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  tpa: TpaDefinition;
  setTpa: React.Dispatch<React.SetStateAction<TpaDefinition>>;
  onSave: () => void;
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
  onSave
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

  const approvalCoverageCompanies = approvalCoverageCompanyOptions(
    useEnumOptions('ApprovalCoverageCompany', {
      labelOverrides: APPROVAL_COVERAGE_COMPANY_LABELS
    })
  );

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
                    fieldName="approvalCoverageCompany"
                    fieldType="select"
                    fieldLabel="Approval Coverage Co."
                    selectData={approvalCoverageCompanies}
                    selectDataLabel="label"
                    selectDataValue="value"
                    searchable={false}
                    cleanable
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
