import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useEnumOptions } from '@/services/enumsApi';
import { useAppDispatch } from '@/hooks';
import CoveragePagedSelect, { useLookupPaging } from './CoveragePagedSelect';
import { emptyContract, notifyError, notifySuccess, notifyWarning, APPROVAL_COVERAGE_COMPANY_LABELS, approvalCoverageCompanyOptions, formatLinkedInsuranceLabel } from './coverageHelpers';
import {
  useCreateCoverageContractMutation,
  useSearchCoverageCompaniesQuery,
  useSearchCoveragePriceListsQuery,
  useSearchCoverageTpaInsurancePayersQuery,
  useUpdateCoverageContractMutation,
  normalizeCoverageContract,
  normalizeCoverageLookupItem,
  type CoverageContract,
  type CoverageLookupItem
} from '@/services/setup/coverageManagement/coverageManagementService';
import { useGetNphiesPayerByIdQuery } from '@/services/setup/payer/NphiesPayerSetupService';

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
  const approvalCoverageCompanies = approvalCoverageCompanyOptions(
    useEnumOptions('ApprovalCoverageCompany', {
      labelOverrides: APPROVAL_COVERAGE_COMPANY_LABELS
    })
  );
  const companyLookup = useLookupPaging(`${record.guarantorType || ''}`);
  const tpaInsuranceLookup = useLookupPaging(String(record.companyId || ''));
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
  const priceLists = useSearchCoveragePriceListsQuery(
    {
      nphiesPayerId: Number(selectedInsuranceId),
      page: priceListLookup.page,
      size: 15,
      search: priceListLookup.appliedSearch
    },
    { skip: !open || !selectedInsuranceId }
  );

  const { currentData: selectedNphiesPayer, isFetching: isParentPayerLoading } = useGetNphiesPayerByIdQuery(
    selectedInsuranceId as number,
    { skip: !open || !selectedInsuranceId, refetchOnMountOrArgChange: true }
  );

  const [createContract] = useCreateCoverageContractMutation();
  const [updateContract] = useUpdateCoverageContractMutation();

  const clearPriceListFields = {
    priceListSetupId: undefined,
    priceListName: undefined,
    startDate: null as string | null,
    endDate: null as string | null
  };

  const clearParentFields = {
    parentPayerId: null as number | null,
    parentPayerName: ''
  };

  useEffect(() => {
    if (open) {
      setRecord(normalizeCoverageContract({ ...emptyContract(), ...contract }));
    }
  }, [open, contract]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (!selectedInsuranceId) {
      setRecord(previous => ({
        ...previous,
        ...clearParentFields
      }));
      return;
    }
    const fetchedMatchesSelected =
      selectedNphiesPayer != null && Number(selectedNphiesPayer.id) === Number(selectedInsuranceId);
    if (!fetchedMatchesSelected) {
      return;
    }
    const parent = selectedNphiesPayer.parentCompany ?? null;
    const parentPayerId = parent?.id ?? null;
    const parentPayerName = formatLinkedInsuranceLabel(parent);
    setRecord(previous => {
      const previousInsuranceId = previous.insurancePayerId || (previous.guarantorType !== 'TPA' ? previous.companyId : undefined);
      if (Number(previousInsuranceId) !== Number(selectedNphiesPayer.id)) {
        return previous;
      }
      if (previous.parentPayerId === parentPayerId && previous.parentPayerName === parentPayerName) {
        return previous;
      }
      return {
        ...previous,
        parentPayerId,
        parentPayerName
      };
    });
  }, [open, selectedInsuranceId, selectedNphiesPayer]);

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

  const saveHeader = async () => {
    if (
      !record.guarantorType ||
      !record.companyId ||
      !record.code ||
      !record.policyNumber ||
      !record.coverageBasis ||
      !record.insurancePayerId ||
      !record.priceListSetupId
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
                ...clearPriceListFields,
                ...clearParentFields
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
                  ...clearPriceListFields,
                  ...clearParentFields
                });
                return;
              }
              setRecord({
                ...next,
                insurancePayerId: undefined,
                insurancePayerName: undefined,
                ...clearPriceListFields,
                ...clearParentFields
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
                  ...clearPriceListFields,
                  ...clearParentFields
                }));
                return;
              }
              setRecord(previous => ({
                ...previous,
                companyId: item?.id,
                companyName: item?.name,
                insurancePayerId: undefined,
                insurancePayerName: undefined,
                ...clearPriceListFields,
                ...clearParentFields
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
            width="100%"
            fieldLabel="Approval Coverage Co."
            fieldType="select"
            fieldName="approvalCoverageCompany"
            record={record}
            setRecord={setRecord}
            selectData={approvalCoverageCompanies}
            cleanable
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
                  ...clearPriceListFields,
                  ...clearParentFields
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
                  ...clearPriceListFields,
                  ...clearParentFields
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
          <MyInput
            disabled
            width="100%"
            fieldLabel="Parent Name"
            fieldName="parentPayerName"
            record={record}
            setRecord={setRecord}
            loading={isParentPayerLoading}
            placeholder={
              !selectedInsuranceId
                ? 'Filled from the selected insurance company'
                : isParentPayerLoading
                  ? 'Loading parent insurance...'
                  : 'No parent insurance linked'
            }
          />
        </Form>
      }
    />
  );
};

export default CoverageContractEditor;
