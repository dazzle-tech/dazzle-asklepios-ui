import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useEnumOptions } from '@/services/enumsApi';
import { useAppDispatch } from '@/hooks';
import CoveragePagedSelect, { useLookupPaging } from './CoveragePagedSelect';
import { emptyContract, notifyError, notifySuccess, notifyWarning } from './coverageHelpers';
import {
  useCreateCoverageContractMutation,
  useSearchCoverageCompaniesQuery,
  useSearchCoverageInsurancePayersQuery,
  useSearchCoveragePriceListsQuery,
  useSearchCoverageTpaInsurancePayersQuery,
  useUpdateCoverageContractMutation,
  normalizeCoverageContract,
  normalizeCoverageLookupItem,
  type CoverageContract,
  type CoverageLookupItem
} from '@/services/setup/coverageManagement/coverageManagementService';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  contract: CoverageContract;
  onSaved: (contract: CoverageContract) => void;
};

const CoverageContractEditor = ({ open, setOpen, contract, onSaved }: Props) => {
  const dispatch = useAppDispatch();
  const [record, setRecord] = useState<CoverageContract>({ ...emptyContract(), ...contract });
  const guarantorTypes = useEnumOptions('GuarantorType');
  const coverageBasis = useEnumOptions('CoverageBasis');
  const classNames = useEnumOptions('CoverageClassName');
  const companyLookup = useLookupPaging(`${record.guarantorType || ''}`);
  const tpaInsuranceLookup = useLookupPaging(String(record.companyId || ''));
  const parentLookup = useLookupPaging('parent');
  const priceListLookup = useLookupPaging(String(record.insurancePayerId || ''));
  const isTpa = record.guarantorType === 'TPA';
  const selectedInsuranceId = record.insurancePayerId || (!isTpa ? record.companyId : undefined);

  const companies = useSearchCoverageCompaniesQuery(
    {
      guarantorType: String(record.guarantorType),
      page: companyLookup.page,
      size: 15,
      search: companyLookup.appliedSearch,
      sort: record.guarantorType === 'INSURANCE' ? 'nameEn,asc' : 'name,asc'
    },
    { skip: !open || !record.guarantorType }
  );
  const tpaInsurances = useSearchCoverageTpaInsurancePayersQuery(
    {
      tpaId: Number(record.companyId),
      page: tpaInsuranceLookup.page,
      size: 15,
      search: tpaInsuranceLookup.appliedSearch
    },
    { skip: !open || !isTpa || !record.companyId }
  );
  const parentPayers = useSearchCoverageInsurancePayersQuery(
    {
      page: parentLookup.page,
      size: 15,
      search: parentLookup.appliedSearch
    },
    { skip: !open }
  );
  const priceLists = useSearchCoveragePriceListsQuery(
    {
      nphiesPayerId: Number(selectedInsuranceId),
      page: priceListLookup.page,
      size: 15,
      search: priceListLookup.appliedSearch
    },
    { skip: !open || !selectedInsuranceId }
  );

  const [createContract] = useCreateCoverageContractMutation();
  const [updateContract] = useUpdateCoverageContractMutation();

  useEffect(() => {
    if (open) {
      setRecord(normalizeCoverageContract({ ...emptyContract(), ...contract }));
    }
  }, [open, contract]);

  const applyPriceListSelection = (priceListId?: number, selectedItem?: CoverageLookupItem | null) => {
    const selected =
      normalizeCoverageLookupItem(selectedItem) ??
      normalizeCoverageLookupItem(
        (priceLists.data?.data ?? []).find(item => Number(item.id) === Number(priceListId))
      );
    setRecord(previous => ({
      ...previous,
      priceListSetupId: priceListId || undefined,
      priceListName: selected?.name,
      startDate: selected?.startDate ?? null,
      endDate: selected?.endDate ?? null,
      insurancePayerId: selected?.relatedId ?? previous.insurancePayerId,
      insurancePayerName: selected?.relatedName ?? previous.insurancePayerName
    }));
  };

  const clearPriceListFields = {
    priceListSetupId: undefined,
    priceListName: undefined,
    startDate: null as string | null,
    endDate: null as string | null
  };

  const saveHeader = async () => {
    if (
      !record.guarantorType ||
      !record.companyId ||
      !record.code ||
      !record.policyNumber ||
      !record.coverageBasis ||
      !record.insurancePayerId ||
      !record.priceListSetupId ||
      !record.parentPayerId ||
      !record.className
    ) {
      notifyWarning(dispatch, 'Please complete the required beneficiary details');
      return;
    }
    try {
      const saved = record.id
        ? await updateContract(record).unwrap()
        : await createContract(record).unwrap();
      notifySuccess(dispatch, 'Coverage contract saved');
      onSaved(saved);
      setOpen(false);
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to save coverage contract');
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={record.id ? 'Edit Coverage Contract' : 'Add Coverage Contract'}
      size="80vw"
      bodyheight="72vh"
      actionButtonLabel="Save"
      actionButtonFunction={saveHeader}
      modalColor="var(--primary-blue)"
      content={
        <Form fluid className="coverage-form-grid">
          <MyInput
            required
            width="100%"
            fieldLabel="Coverage Type"
            fieldType="select"
            fieldName="guarantorType"
            record={record}
            setRecord={(next: CoverageContract) =>
              setRecord({
                ...next,
                companyId: undefined,
                companyName: undefined,
                insurancePayerId: undefined,
                insurancePayerName: undefined,
                ...clearPriceListFields
              })
            }
            selectData={guarantorTypes}
          />
          <CoveragePagedSelect
            required
            disabled={!record.guarantorType}
            fieldName="companyId"
            fieldLabel={record.guarantorType === 'TPA' ? 'TPA' : 'Insurance Company'}
            record={record}
            setRecord={(next: CoverageContract) => {
              if (record.guarantorType === 'INSURANCE') {
                setRecord({
                  ...next,
                  insurancePayerId: next.companyId,
                  insurancePayerName: undefined,
                  ...clearPriceListFields
                });
                return;
              }
              setRecord({
                ...next,
                insurancePayerId: undefined,
                insurancePayerName: undefined,
                ...clearPriceListFields
              });
            }}
            result={companies}
            page={companyLookup.page}
            setPage={companyLookup.setPage}
            search={companyLookup.search}
            setSearch={companyLookup.setSearch}
            resetToken={record.guarantorType}
            onSelected={item => {
              if (record.guarantorType === 'INSURANCE') {
                setRecord(previous => ({
                  ...previous,
                  companyId: item?.id,
                  companyName: item?.name,
                  insurancePayerId: item?.id,
                  insurancePayerName: item?.name,
                  ...clearPriceListFields
                }));
                return;
              }
              setRecord(previous => ({
                ...previous,
                companyId: item?.id,
                companyName: item?.name,
                insurancePayerId: undefined,
                insurancePayerName: undefined,
                ...clearPriceListFields
              }));
            }}
          />
          <MyInput required width="100%" fieldLabel="Code" fieldName="code" record={record} setRecord={setRecord} />
          <MyInput
            required
            width="100%"
            fieldLabel="Policy Number"
            fieldName="policyNumber"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            required
            width="100%"
            fieldLabel="Coverage on"
            fieldType="select"
            fieldName="coverageBasis"
            record={record}
            setRecord={setRecord}
            selectData={coverageBasis}
          />
          <MyInput
            required
            width="100%"
            fieldLabel="Class Name"
            fieldType="select"
            fieldName="className"
            record={record}
            setRecord={setRecord}
            selectData={classNames}
          />
          {isTpa ? (
            <CoveragePagedSelect
              required
              disabled={!record.companyId}
              fieldName="insurancePayerId"
              fieldLabel="Insurance Name"
              record={record}
              setRecord={(next: CoverageContract) =>
                setRecord({
                  ...next,
                  ...clearPriceListFields
                })
              }
              result={tpaInsurances}
              page={tpaInsuranceLookup.page}
              setPage={tpaInsuranceLookup.setPage}
              search={tpaInsuranceLookup.search}
              setSearch={tpaInsuranceLookup.setSearch}
              resetToken={record.companyId}
              placeholder="Select a linked insurance company"
              onSelected={item => {
                setRecord(previous => ({
                  ...previous,
                  insurancePayerId: item?.id,
                  insurancePayerName: item?.name,
                  ...clearPriceListFields
                }));
              }}
            />
          ) : (
            <MyInput
              required
              disabled
              width="100%"
              fieldLabel="Insurance Name"
              fieldName="insurancePayerName"
              record={{
                ...record,
                insurancePayerName: record.insurancePayerName || record.companyName || ''
              }}
              setRecord={setRecord}
              placeholder="Filled from the selected insurance company"
            />
          )}
          <CoveragePagedSelect
            required
            disabled={!selectedInsuranceId}
            fieldName="priceListSetupId"
            fieldLabel="Price list"
            record={record}
            setRecord={next => applyPriceListSelection(next.priceListSetupId)}
            result={priceLists}
            page={priceListLookup.page}
            setPage={priceListLookup.setPage}
            search={priceListLookup.search}
            setSearch={priceListLookup.setSearch}
            resetToken={selectedInsuranceId}
            placeholder={
              selectedInsuranceId
                ? 'Select a price list from Price List Setup'
                : isTpa
                  ? 'Select insurance name first'
                  : 'Select insurance company first'
            }
            onSelected={item => applyPriceListSelection(item?.id, item)}
          />
          <MyInput
            width="100%"
            fieldLabel="Start date"
            fieldType="date"
            fieldName="startDate"
            record={record}
            setRecord={setRecord}
            disabled
          />
          <MyInput
            width="100%"
            fieldLabel="End Date"
            fieldType="date"
            fieldName="endDate"
            record={record}
            setRecord={setRecord}
            disabled
          />
          <CoveragePagedSelect
            required
            fieldName="parentPayerId"
            fieldLabel="Parent Name"
            record={record}
            setRecord={setRecord}
            result={parentPayers}
            page={parentLookup.page}
            setPage={parentLookup.setPage}
            search={parentLookup.search}
            setSearch={parentLookup.setSearch}
          />
        </Form>
      }
    />
  );
};

export default CoverageContractEditor;
