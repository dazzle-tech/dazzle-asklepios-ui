import React, { useEffect, useMemo, useState } from 'react';
import { Form, Message, SelectPicker } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { useGetActivePlansByPayorQuery } from '@/services/setup/payer/PayorPlanService';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { notify } from '@/utils/uiReducerActions';
import AdvancedModal from '@/components/AdvancedModal/AdvancedModal';
import { formatEnumString } from '@/utils';
import { useGetAllActivePayorsQuery } from '@/services/setup/payer/PayorService';
import InsuranceBenefitsCard from './InsuranceBenefitsCard';
import './styles.less';
import PlanCoverageItemsSection from './PlanCoverageItemsSection';
import { PatientInsurance } from '@/types/model-types-new';
import { newPatientInsurance } from '@/types/model-types-constructor-new';
import { normalizePatientInsuranceFromApi } from './cchiMappers';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { formatInsuranceDate } from './insuranceDisplayUtils';
import {
  useListCoverageClassesQuery,
  useSearchCoverageContractsQuery,
  useSearchCoverageInsurancePayersQuery,
  type CoverageClass,
  type CoverageContract,
  type CoverageContractedInsurance
} from '@/services/setup/coverageManagement/coverageManagementService';
import { useGetNphiesPayerByIdQuery } from '@/services/setup/payer/NphiesPayerSetupService';

import {
  useAddPatientInsuranceMutation,
  useUpdatePatientInsuranceMutation
} from '@/services/patients/patientInsurancesService';
import { useGetRelativePatientsByCategoryQuery } from '@/services/patients/PatientRelationService';

const INSURANCE_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Insurance data is required.',
  'patient.required': 'Patient is required.',
  'patient.payor.duplicate': 'This patient already has an insurance for the selected payor.',
  'primary.exists': 'This patient already has a primary insurance.',
  'payor.unresolved': 'Could not match this insurance company to a Payor in Setup.',
  'db.constraint': 'Database constraint violation while saving insurance.',
  notfound: 'Insurance record not found.'
};

const INSURANCE_FIELD_LABELS: Record<string, string> = {
  payorId: 'Payor',
  planId: 'Plan',
  policyNumber: 'Policy Number',
  groupNumber: 'Group Number',
  memberCardId: 'Member ID',
  networkId: 'Network',
  policyClassName: 'Policy Class',
  policyHolderId: 'Policy Holder',
  policyHolderName: 'Policy Holder Name',
  issueDate: 'Issue Date',
  expirationDate: 'Expiration Date',
  coverageType: 'Coverage Type',
  relationWithSubscriber: 'Relation With Subscriber',
  sponsorNumber: 'Sponsor Number',
  patientShare: 'Patient Share',
  maxLimit: 'Max Limit',
  remainingBenefits: 'Remaining Benefits',
  remainingDeductibles: 'Remaining Deductibles',
  isPrimary: 'Primary Insurance'
};

const normalizeFieldErrorMessage = (message: string): string => {
  const lowerMessage = (message || '').toLowerCase();
  if (lowerMessage.includes('must not be null')) return 'is required';
  if (lowerMessage.includes('must not be blank')) return 'must not be blank';
  if (lowerMessage.includes('size')) return 'length is out of range';
  if (lowerMessage.includes('greater')) return 'value is too small';
  if (lowerMessage.includes('less')) return 'value is too large';
  return message || 'invalid value';
};

const getFieldLabel = (field: string): string => INSURANCE_FIELD_LABELS[field] ?? field;

type PatientInsuranceForm = PatientInsurance & {
  insurancePayerId?: number | null;
  coverageContractId?: number | null;
  contractCode?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  priceListName?: string | null;
};

const emptyInsuranceForm = (): PatientInsuranceForm => ({
  ...newPatientInsurance,
  insurancePayerId: null,
  coverageContractId: null,
  contractCode: null,
  contractStartDate: null,
  contractEndDate: null,
  priceListName: null
});

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

/**
 * Coverage endpoints are currently not consistent in response shape.
 * Some return a raw array: [...]
 * Others may return a paged object: { data: [...] }.
 *
 * Keep the UI independent from that difference.
 */
const extractRows = <T,>(response: unknown): T[] => {
  if (Array.isArray(response)) {
    return response as T[];
  }

  const row = asRecord(response);
  return Array.isArray(row.data) ? (row.data as T[]) : [];
};

const readText = (row: Record<string, unknown>, ...keys: string[]): string | null => {
  for (const key of keys) {
    const value = row[key];
    if (value == null) {
      continue;
    }
    const text = String(value).trim();
    if (text && text !== 'undefined' && text !== 'null') {
      return text;
    }
  }
  return null;
};

const readNumber = (row: Record<string, unknown>, ...keys: string[]): number | null => {
  for (const key of keys) {
    const parsed = Number(row[key]);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
};

const isInsuranceGuarantor = (contract: CoverageContract | null | undefined): boolean =>
  String(asRecord(contract).guarantorType || asRecord(contract).guarantor_type || '').toUpperCase() ===
  'INSURANCE';

const insuranceKeyFromContract = (contract: CoverageContract | null | undefined): number | null =>
  readNumber(
    asRecord(contract),
    'insurancePayerId',
    'insurance_payer_id',
    'companyId',
    'company_id'
  );

const payerIdFromContract = (contract: CoverageContract | null | undefined): number | null =>
  insuranceKeyFromContract(contract);

const nphiesIdFromContract = (contract: CoverageContract | null | undefined): string | null => {
  const row = asRecord(contract);
  if (isInsuranceGuarantor(contract)) {
    return readText(row, 'companyCode', 'company_code', 'nphiesId', 'nphies_id');
  }
  return readText(row, 'nphiesId', 'nphies_id');
};

const insuranceNameFromContract = (contract: CoverageContract | null | undefined): string | null => {
  const row = asRecord(contract);
  return readText(
    row,
    'insurancePayerName',
    'insurance_payer_name',
    'companyName',
    'company_name'
  );
};

const formatInsuranceCompanyLabel = (
  code?: string | null,
  name?: string | null,
  id?: number | null
): string => {
  const trimmedCode = String(code || '').trim();
  const trimmedName = String(name || '').trim();
  if (trimmedCode && trimmedName && trimmedCode !== trimmedName) {
    return `${trimmedCode} — ${trimmedName}`;
  }
  return trimmedName || trimmedCode || (id ? `Insurance #${id}` : '');
};

const formatActiveContractLabel = (contract: CoverageContract): string => {
  const policyNumber = String(contract.policyNumber || '').trim();
  const code = String(contract.code || '').trim();
  if (policyNumber && code && policyNumber !== code) {
    return `${code} · ${policyNumber}`;
  }
  return policyNumber || code || `Contract #${contract.id}`;
};

type ContractedInsuranceChoice = CoverageContractedInsurance & {
  contracts: CoverageContract[];
};

type ContractedPickerOption = {
  value: string | number;
  label: string;
};

const toSafePickerData = (data: ContractedPickerOption[]): ContractedPickerOption[] =>
  (Array.isArray(data) ? data : [])
    .filter(item => item != null && item.value != null && String(item.label ?? '').trim() !== '')
    .map(item => ({
      value: item.value,
      label: String(item.label)
    }));

const ContractedPicker = ({
  fieldLabel,
  required,
  data,
  value,
  onChange,
  disabled,
  placeholder
}: {
  fieldLabel: string;
  required?: boolean;
  data: ContractedPickerOption[];
  value: string | number | null | undefined;
  onChange: (value: string | number | null) => void;
  disabled?: boolean;
  placeholder?: string;
}) => (
  <Form.Group className="my-input-container">
    <Form.ControlLabel>
      <Translate>{fieldLabel}</Translate>
      {required ? <span className="required-field">*</span> : null}
    </Form.ControlLabel>
    <div style={{ marginBottom: 5 }} />
    <SelectPicker
      data={toSafePickerData(data)}
      labelKey="label"
      valueKey="value"
      value={value ?? null}
      onChange={next => onChange(next ?? null)}
      disabled={disabled}
      placeholder={placeholder}
      searchable
      cleanable
      virtualized={false}
      block
      preventOverflow
      container={() => document.body}
      style={{ width: '100%' }}
      menuMaxHeight={240}
    />
  </Form.Group>
);

const stripUiOnlyInsuranceFields = (insurance: PatientInsuranceForm): PatientInsurance => {
  const {
    insurancePayerId: _insurancePayerId,
    coverageContractId: _coverageContractId,
    contractCode: _contractCode,
    contractStartDate: _contractStartDate,
    contractEndDate: _contractEndDate,
    priceListName: _priceListName,
    ...payload
  } = insurance;
  return payload;
};

const handleCrudError = (error: any, dispatch: any, keyMap: Record<string, string>) => {
  const responseData = error?.data ?? {};
  const traceId = responseData?.traceId || responseData?.requestId || responseData?.correlationId;
  const traceSuffix = traceId ? `\nTrace ID: ${traceId}` : '';

  if (Array.isArray(responseData?.fieldErrors) && responseData.fieldErrors.length > 0) {
    const errorLines = responseData.fieldErrors.map(
      (fieldError: any) =>
        `• ${getFieldLabel(fieldError.field)}: ${normalizeFieldErrorMessage(fieldError.message)}`
    );

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${errorLines.join('\n')}` + traceSuffix,
        sev: 'warning'
      })
    );
    return;
  }

  const messageProp: string = responseData?.message || '';
  const errorKey = messageProp.startsWith('error.')
    ? messageProp.substring(6)
    : responseData?.errorKey;

  const humanReadableMessage =
    (errorKey && keyMap[errorKey]) ||
    responseData?.detail ||
    responseData?.title ||
    responseData?.message ||
    'Unexpected error';

  dispatch(
    notify({
      msg: humanReadableMessage + traceSuffix,
      sev: 'warning'
    })
  );
};

const InsuranceModal = ({
  open,
  setOpen,
  onClose,
  patientKey,
  refetchInsurance,
  editing,
  insuranceBrowsing,
  hideSaveBtn = false
}) => {
  const dispatch = useAppDispatch();
  const resolvedPatientId =
    typeof patientKey === 'object' ? Number(patientKey?.id) : Number(patientKey);

  const [patientInsurance, setPatientInsurance] = useState<PatientInsuranceForm>(emptyInsuranceForm());
  const [addPatientInsurance] = useAddPatientInsuranceMutation();
  const [updatePatientInsurance] = useUpdatePatientInsuranceMutation();

  const [prevPayorId, setPrevPayorId] = useState<number | undefined>();

  const [payorPage, setPayorPage] = useState(0);
  const [payorSearchKeyword, setPayorSearchKeyword] = useState('');
  const [planPage, setPlanPage] = useState(0);

  const [relativePage, setRelativePage] = useState(0);
  const [allRelatives, setAllRelatives] = useState<any[]>([]);

  const isContractedCreate = Boolean(open && !editing?.id && !insuranceBrowsing);

  const { data: relationsLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');

  const {
    data: payorResponse,
    isLoading: payorLoading,
    isFetching: payorFetching
  } = useGetAllActivePayorsQuery(
    {
      page: payorPage,
      size: 20,
      sort: 'name,asc'
    },
    { skip: !open || isContractedCreate }
  );

  const {
    data: plansResponse,
    isLoading: plansLoading,
    isFetching: plansFetching
  } = useGetActivePlansByPayorQuery(
    {
      payorId: Number(patientInsurance?.payorId),
      page: planPage,
      size: 20,
      sort: 'name,asc'
    },
    {
      skip: !open || isContractedCreate || !patientInsurance?.payorId
    }
  );

  const selectedInsurancePayerId = Number(patientInsurance.insurancePayerId);

  const {
    data: insurancePayersResponse,
    isLoading: insurancePayersLoading,
    isFetching: insurancePayersFetching,
    isError: insurancePayersError
  } = useSearchCoverageInsurancePayersQuery(
    {
      page: 0,
      size: 500,
      sort: 'nameEn,asc'
    },
    { skip: !open || !isContractedCreate }
  );

  const {
    data: activeContractsResponse,
    isLoading: coverageContractsLoading,
    isFetching: coverageContractsFetching,
    isError: coverageContractsError
  } = useSearchCoverageContractsQuery(
    {
      page: 0,
      size: 500,
      sort: 'id,desc',
      isActive: true
    },
    { skip: !open || !isContractedCreate }
  );

  const allActiveContracts = useMemo(
    () =>
      extractRows<CoverageContract>(activeContractsResponse).filter(
        contract => contract?.isActive !== false
      ),
    [activeContractsResponse]
  );

  const contractedInsurances = useMemo(() => {
    const byPayer = new Map<number, ContractedInsuranceChoice>();

    allActiveContracts.forEach(contract => {
      const insurancePayerId = insuranceKeyFromContract(contract);
      if (!insurancePayerId) return;

      const row = asRecord(contract);
      const name =
        insuranceNameFromContract(contract) || `Insurance #${insurancePayerId}`;
      const nphiesId = nphiesIdFromContract(contract);
      const existing = byPayer.get(insurancePayerId);

      if (existing) {
        existing.contractCount = (existing.contractCount ?? 1) + 1;
        existing.contracts.push(contract);
        if (!existing.nphiesId && nphiesId) {
          existing.nphiesId = nphiesId;
        }
        if (existing.name.startsWith('Insurance #') && insuranceNameFromContract(contract)) {
          existing.name = name;
        }
        return;
      }

      byPayer.set(insurancePayerId, {
        insurancePayerId,
        nphiesId,
        name,
        nameAr: null,
        payorId: null,
        payorName: name,
        contractCount: 1,
        isActive: row.isActive !== false,
        contracts: [contract]
      });
    });

    const lookupRows = extractRows<any>(insurancePayersResponse);
    return Array.from(byPayer.values())
      .map(item => {
        const lookup = lookupRows.find(payer => Number(payer.id) === item.insurancePayerId);
        if (!lookup) {
          return item;
        }
        return {
          ...item,
          nphiesId: lookup.code || item.nphiesId,
          name: lookup.name || item.name,
          nameAr: lookup.extra || item.nameAr
        };
      })
      .sort((left, right) =>
        formatInsuranceCompanyLabel(left.nphiesId, left.name, left.insurancePayerId).localeCompare(
          formatInsuranceCompanyLabel(right.nphiesId, right.name, right.insurancePayerId),
          undefined,
          { sensitivity: 'base' }
        )
      );
  }, [allActiveContracts, insurancePayersResponse]);

  const selectedCoverageContracts = useMemo(() => {
    if (!Number.isFinite(selectedInsurancePayerId) || selectedInsurancePayerId <= 0) {
      return [];
    }
    const selectedInsurance = contractedInsurances.find(
      item => Number(item.insurancePayerId) === selectedInsurancePayerId
    );
    if (selectedInsurance?.contracts?.length) {
      return selectedInsurance.contracts;
    }
    return allActiveContracts.filter(
      contract => insuranceKeyFromContract(contract) === selectedInsurancePayerId
    );
  }, [allActiveContracts, contractedInsurances, selectedInsurancePayerId]);

  const contractsForSelectedInsurance = useMemo(
    () =>
      [...selectedCoverageContracts].sort((left, right) =>
        String(left.policyNumber || left.code || '').localeCompare(
          String(right.policyNumber || right.code || ''),
          undefined,
          { sensitivity: 'base' }
        )
      ),
    [selectedCoverageContracts]
  );

  const { data: coverageClassesResponse } = useListCoverageClassesQuery(
    {
      contractId: Number(patientInsurance.coverageContractId),
      page: 0,
      size: 200,
      sort: 'name,asc',
      isActive: true
    },
    {
      skip:
        !open ||
        !isContractedCreate ||
        !patientInsurance.coverageContractId
    }
  );

  const classOptions = useMemo(
    () =>
      extractRows<CoverageClass>(coverageClassesResponse)
        .filter(item => item?.isActive !== false && String(item?.name || '').trim() !== '')
        .map(item => ({
          value: String(item.name).trim(),
          label: String(item.name).trim()
        })),
    [coverageClassesResponse]
  );

  const selectedContractedInsurance = useMemo(
    () =>
      contractedInsurances.find(item => Number(item.insurancePayerId) === selectedInsurancePayerId) ??
      null,
    [contractedInsurances, selectedInsurancePayerId]
  );

  const { data: selectedNphiesPayer } = useGetNphiesPayerByIdQuery(selectedInsurancePayerId, {
    skip:
      !open ||
      !isContractedCreate ||
      !Number.isFinite(selectedInsurancePayerId) ||
      selectedInsurancePayerId <= 0
  });

  const {
    data: relativesResponse,
    isLoading: relativesLoading,
    isFetching: relativesFetching
  } = useGetRelativePatientsByCategoryQuery(
    {
      patientId: resolvedPatientId,
      categoryType: 'ADULT',
      page: relativePage,
      size: 5
    },
    { skip: !resolvedPatientId || !open }
  );

  const applyContractedInsurance = (item: CoverageContractedInsurance | null) => {
    setPatientInsurance(prev => ({
      ...prev,
      insurancePayerId: item?.insurancePayerId ?? null,
      coverageContractId: null,
      contractCode: null,
      contractStartDate: null,
      contractEndDate: null,
      priceListName: null,
      payorId: null,
      payerNphiesId: item?.nphiesId ?? null,
      payerName: item?.payorName || item?.name || null,
      policyNumber: '',
      policyClassName: null,
      groupName: null,
      planId: null
    }));
  };

  const applyCoverageContract = (contract: CoverageContract | null) => {
    const nphiesId = nphiesIdFromContract(contract);
    setPatientInsurance(prev => ({
      ...prev,
      coverageContractId: contract?.id ?? null,
      contractCode: contract?.code ?? null,
      contractStartDate: contract?.startDate ?? null,
      contractEndDate: contract?.endDate ?? null,
      priceListName: contract?.priceListName ?? null,
      policyNumber: contract?.policyNumber || prev.policyNumber || '',
      policyClassName:
        Number(prev.coverageContractId) === Number(contract?.id) ? prev.policyClassName : null,
      groupName: insuranceNameFromContract(contract) || prev.groupName || null,
      payerName: prev.payerName || insuranceNameFromContract(contract) || null,
      payerNphiesId: nphiesId || prev.payerNphiesId || null
    }));
  };

  const applyContractClass = (className: string | null) => {
    setPatientInsurance(prev => ({
      ...prev,
      policyClassName: className
    }));
  };

  useEffect(() => {
    setPayorPage(0);
  }, [payorSearchKeyword]);

  useEffect(() => {
    const currentPayorId = patientInsurance?.payorId
      ? Number(patientInsurance.payorId)
      : undefined;

    if (currentPayorId === prevPayorId) return;

    setPlanPage(0);
    setPrevPayorId(currentPayorId);

    if (isContractedCreate) {
      return;
    }

    setPatientInsurance(prev => ({
      ...prev,
      planId: null
    }));
  }, [patientInsurance?.payorId]);

  useEffect(() => {
    if (!isContractedCreate || !selectedInsurancePayerId || coverageContractsFetching) {
      return;
    }

    if (
      contractsForSelectedInsurance.length === 1 &&
      !patientInsurance.coverageContractId
    ) {
      applyCoverageContract(contractsForSelectedInsurance[0]);
    }
  }, [
    contractsForSelectedInsurance,
    coverageContractsFetching,
    isContractedCreate,
    selectedInsurancePayerId,
    patientInsurance.coverageContractId
  ]);

  useEffect(() => {
    if (!isContractedCreate || !patientInsurance.coverageContractId || classOptions.length !== 1) {
      return;
    }
    const onlyClass = String(classOptions[0].value || '').trim();
    if (!onlyClass || String(patientInsurance.policyClassName || '').trim() === onlyClass) {
      return;
    }
    applyContractClass(onlyClass);
  }, [
    classOptions,
    isContractedCreate,
    patientInsurance.coverageContractId,
    patientInsurance.policyClassName
  ]);
  useEffect(() => {
    const nphiesId = selectedNphiesPayer?.nphiesId;
    if (!nphiesId || !isContractedCreate) {
      return;
    }

    setPatientInsurance(prev => {
      if (Number(prev.insurancePayerId) !== selectedInsurancePayerId) {
        return prev;
      }
      if (prev.payerNphiesId === nphiesId) {
        return prev;
      }
      return {
        ...prev,
        payerNphiesId: nphiesId,
        payerName: prev.payerName || selectedNphiesPayer.nameEn || selectedNphiesPayer.nameAr || null
      };
    });
  }, [selectedNphiesPayer, selectedInsurancePayerId, isContractedCreate]);

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

  const hasMorePayors = payorResponse?.links?.next != null;
  const hasMorePlans = plansResponse?.links?.next != null;
  const hasMoreRelatives = relativesResponse?.links?.next != null;
  const contractedInsurancesLoading =
    coverageContractsLoading ||
    coverageContractsFetching ||
    insurancePayersLoading ||
    insurancePayersFetching;

  const handleLoadMorePayors = () => {
    if (hasMorePayors && !payorFetching) setPayorPage(currentPage => currentPage + 1);
  };

  const handleLoadMorePlans = () => {
    if (hasMorePlans && !plansFetching) setPlanPage(currentPage => currentPage + 1);
  };

  const handleLoadMoreRelatives = () => {
    if (hasMoreRelatives && !relativesFetching) {
      setRelativePage(currentPage => currentPage + 1);
    }
  };

  const handleSave = async () => {
    if (isContractedCreate) {
      if (!patientInsurance.insurancePayerId) {
        dispatch(
          notify({
            msg: 'Select an insurance company that has an active coverage contract.',
            sev: 'warning'
          })
        );
        return;
      }

      if (!patientInsurance.coverageContractId) {
        dispatch(
          notify({
            msg: 'Select a coverage contract to link this patient.',
            sev: 'warning'
          })
        );
        return;
      }

      if (!patientInsurance.policyClassName) {
        dispatch(
          notify({
            msg: 'Select a coverage class defined under the selected contract.',
            sev: 'warning'
          })
        );
        return;
      }

      if (!patientInsurance.policyNumber) {
        dispatch(
          notify({
            msg: 'Policy number is required.',
            sev: 'warning'
          })
        );
        return;
      }

      if (!patientInsurance.expirationDate) {
        dispatch(
          notify({
            msg: 'Expiration date is required.',
            sev: 'warning'
          })
        );
        return;
      }

      if (!patientInsurance.memberCardId) {
        dispatch(
          notify({
            msg: 'Member ID is required for non-CCHI insurance.',
            sev: 'warning'
          })
        );
        return;
      }

      if (!String(patientInsurance.payerNphiesId || '').trim()) {
        dispatch(
          notify({
            msg: 'Could not resolve the NPHIES ID for the selected insurance company.',
            sev: 'warning'
          })
        );
        return;
      }
    }

    const insuranceBody: PatientInsurance = {
      ...stripUiOnlyInsuranceFields(patientInsurance),
      patientId: resolvedPatientId,
      ...(isContractedCreate
        ? {
            payorId: null,
            payerNphiesId: String(patientInsurance.payerNphiesId).trim()
          }
        : {})
    };

    try {
      if (insuranceBody.id) {
        await updatePatientInsurance({ id: insuranceBody.id, ...insuranceBody }).unwrap();
      } else {
        await addPatientInsurance(insuranceBody).unwrap();
      }

      refetchInsurance();
      handleClearModal();

      dispatch(notify({ msg: 'Insurance Saved Successfully', sev: 'success' }));
    } catch (error: any) {
      handleCrudError(error, dispatch, INSURANCE_ERROR_MAP);
    }
  };

  const resetFormState = () => {
    setPatientInsurance(emptyInsuranceForm());
    setPrevPayorId(undefined);
    setPayorPage(0);
    setPayorSearchKeyword('');
    setPlanPage(0);
    setRelativePage(0);
    setAllRelatives([]);
  };

  const handleClearModal = () => {
    resetFormState();
    onClose();
  };

  useEffect(() => {
    if (open) {
      if (editing) {
        setPatientInsurance({
          ...emptyInsuranceForm(),
          ...normalizePatientInsuranceFromApi({
            ...editing,
            payorId: editing.payorId ? Number(editing.payorId) : null,
            planId: editing.planId ? Number(editing.planId) : null
          })
        });
        setPrevPayorId(editing.payorId ? Number(editing.payorId) : undefined);
      } else {
        resetFormState();
      }

      setRelativePage(0);
    }
  }, [open, editing]);

  useEffect(() => {
    if (!open) {
      const resetTimer = setTimeout(() => {
        resetFormState();
      }, 300);
      return () => clearTimeout(resetTimer);
    }
  }, [open]);

  const relativeOptions = useMemo(() => allRelatives ?? [], [allRelatives]);

  const renderLeftContent = () => (
    <div className="insurance-modal__left-content">
      <InsuranceBenefitsCard
        data={{
          remainingBenefits: patientInsurance.remainingBenefits,
          remailingDeductibles:
            patientInsurance.remainingDeductibles ??
            (patientInsurance as Record<string, unknown>).remailingDeductibles,
          deductiblesValue: (patientInsurance as Record<string, unknown>).deductiblesValue,
          coInsuranceValue: (patientInsurance as Record<string, unknown>).coInsuranceValue,
          coPaymentValue: (patientInsurance as Record<string, unknown>).coPaymentValue
        }}
      />
    </div>
  );

  const insurancePickerData = useMemo(
    () =>
      contractedInsurances.map(item => ({
        value: item.insurancePayerId,
        label: formatInsuranceCompanyLabel(item.nphiesId, item.name, item.insurancePayerId)
      })),
    [contractedInsurances]
  );

  const coveragePickerData = useMemo(
    () =>
      contractsForSelectedInsurance.map(item => ({
        value: Number(item.id),
        label: formatActiveContractLabel(item)
      })),
    [contractsForSelectedInsurance]
  );

  const renderContractedPolicySection = () => (
    <>
      <div className="insurance-modal__section-title">Contracted Insurance</div>
      <Message showIcon type="info" className="insurance-modal__info-banner">
        <Translate>
          Choose an insurance company that already has an active coverage contract, select the
          contract header, then pick a class defined under that header.
        </Translate>
      </Message>
      {coverageContractsError || insurancePayersError ? (
        <Message showIcon type="warning" className="insurance-modal__info-banner">
          <Translate>
            Could not load insurance companies or coverage contracts. Refresh and try again.
          </Translate>
        </Message>
      ) : !contractedInsurancesLoading && contractedInsurances.length === 0 ? (
        <Message showIcon type="warning" className="insurance-modal__info-banner">
          <Translate>
            No insurance companies with an active coverage contract were found. Add a coverage
            contract in Setup first.
          </Translate>
        </Message>
      ) : null}
      <ContractedPicker
        fieldLabel="Insurance Company"
        required
        data={insurancePickerData}
        value={patientInsurance.insurancePayerId}
        disabled={insuranceBrowsing}
        placeholder="Select insurance with a contract..."
        onChange={next => {
          const selected =
            contractedInsurances.find(item => Number(item.insurancePayerId) === Number(next)) ??
            null;
          applyContractedInsurance(selected);
        }}
      />
      <ContractedPicker
        fieldLabel="Coverage Contract"
        required
        data={coveragePickerData}
        value={patientInsurance.coverageContractId}
        disabled={insuranceBrowsing || !patientInsurance.insurancePayerId}
        placeholder={
          !patientInsurance.insurancePayerId
            ? 'Select insurance company first...'
            : 'Select active coverage contract...'
        }
        onChange={next => {
          const selected =
            contractsForSelectedInsurance.find(item => Number(item.id) === Number(next)) ?? null;
          applyCoverageContract(selected);
        }}
      />
      <ContractedPicker
        fieldLabel="Policy Class"
        required
        data={classOptions}
        value={patientInsurance.policyClassName}
        disabled={insuranceBrowsing || !patientInsurance.coverageContractId}
        placeholder={
          !patientInsurance.coverageContractId
            ? 'Select coverage contract first...'
            : classOptions.length
              ? 'Select class under this contract...'
              : 'No classes defined under this contract...'
        }
        onChange={next => applyContractClass(next == null ? null : String(next))}
      />
      {patientInsurance.coverageContractId ? (
        <div className="insurance-modal__contract-summary">
          <div>
            <span>Policy</span>
            <strong>{patientInsurance.policyNumber || '-'}</strong>
          </div>
          <div>
            <span>Class</span>
            <strong>
              {patientInsurance.policyClassName || '-'}
            </strong>
          </div>
          <div>
            <span>Contract period</span>
            <strong>
              {formatInsuranceDate(patientInsurance.contractStartDate)} →{' '}
              {formatInsuranceDate(patientInsurance.contractEndDate)}
            </strong>
          </div>
          {patientInsurance.priceListName ? (
            <div>
              <span>Price list</span>
              <strong>{patientInsurance.priceListName}</strong>
            </div>
          ) : null}
        </div>
      ) : null}
      <MyInput
        column
        required
        fieldType="textnumber"
        fieldLabel="Policy Number"
        fieldName="policyNumber"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
      />
      <MyInput
        column
        fieldType="textnumber"
        fieldLabel="Group Number"
        fieldName="groupNumber"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
      />
      <MyInput
        column
        fieldType="date"
        fieldLabel="Issue Date"
        fieldName="issueDate"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
      />
      <MyInput
        column
        required
        fieldType="date"
        fieldLabel="Expiration Date"
        fieldName="expirationDate"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
      />
    </>
  );

  const renderPolicySection = () => {
    if (isContractedCreate) {
      return renderContractedPolicySection();
    }

    return (
    <>
      <div className="insurance-modal__section-title">Plan &amp; Policy</div>
      <MyInput
        column
        required
        fieldLabel="Payor"
        fieldType="selectPagination"
        fieldName="payorId"
        selectData={payorResponse?.data ?? []}
        selectDataLabel="name"
        selectDataValue="id"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
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
        required
        fieldLabel="Plan"
        fieldType="selectPagination"
        fieldName="planId"
        selectData={plansResponse?.data ?? []}
        selectDataLabel="name"
        selectDataValue="id"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing || !patientInsurance?.payorId}
        searchable={true}
        loading={plansLoading || plansFetching}
        hasMore={hasMorePlans}
        onFetchMore={handleLoadMorePlans}
        placeholder={!patientInsurance?.payorId ? 'Select Payor first...' : 'Select Plan...'}
        renderMenuItem={(label, item) => {
          if (item?.isLoadMore) {
            return <div className="insurance-modal__plan-load-more">Load more...</div>;
          }
          return (
            <div>
              <div className="insurance-modal__plan-name">{item.name}</div>
              <div className="insurance-modal__plan-details">
                {formatEnumString(item.planType)} • {formatEnumString(item.coverageType)} • $
                {item.amount}
              </div>
            </div>
          );
        }}
      />
      <MyInput
        column
        required
        fieldType="textnumber"
        fieldLabel="Policy Number"
        fieldName="policyNumber"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
      />
      <MyInput
        column
        fieldType="textnumber"
        fieldLabel="Group Number"
        fieldName="groupNumber"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
      />
      <MyInput
        column
        fieldType="text"
        fieldLabel="Policy Class"
        fieldName="policyClassName"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
      />
      <MyInput
        column
        fieldType="date"
        fieldLabel="Issue Date"
        fieldName="issueDate"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
      />
      <MyInput
        column
        required
        fieldType="date"
        fieldLabel="Expiration Date"
        fieldName="expirationDate"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
      />
    </>
    );
  };

  const renderMemberSection = () => (
    <>
      <div className="insurance-modal__section-title">Member &amp; Coverage</div>
      <MyInput
        column
        required={isContractedCreate}
        fieldType="text"
        fieldLabel="Member ID"
        fieldName="memberCardId"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
      />
      {isContractedCreate ? null : (
        <>
          <MyInput
            column
            fieldType="text"
            fieldLabel="Network"
            fieldName="networkId"
            record={patientInsurance}
            setRecord={setPatientInsurance}
            disabled={insuranceBrowsing}
          />
          <MyInput
            column
            fieldType="text"
            fieldLabel="Coverage Type"
            fieldName="coverageType"
            record={patientInsurance}
            setRecord={setPatientInsurance}
            disabled={insuranceBrowsing}
          />
          <MyInput
            column
            fieldType="text"
            fieldLabel="Sponsor Number"
            fieldName="sponsorNumber"
            record={patientInsurance}
            setRecord={setPatientInsurance}
            disabled={insuranceBrowsing}
          />
        </>
      )}
      <MyInput
        column
        fieldType={isContractedCreate ? 'select' : 'text'}
        fieldLabel="Relation With Subscriber"
        fieldName="relationWithSubscriber"
        selectData={(relationsLovQueryResponse?.object ?? []).map((item: any) => ({
          ...item,
          key: item.key,
          label: item.lovDisplayVale || item.key,
          lovDisplayVale: item.lovDisplayVale || item.key
        }))}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
        searchable={false}
        virtualized={false}
      />
      <MyInput
        column
        fieldLabel="Policy Holder"
        fieldType="selectPagination"
        fieldName="policyHolderId"
        selectData={relativeOptions}
        selectDataLabel={['firstName', 'lastName']}
        selectDataValue="id"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
        loading={relativesLoading || relativesFetching}
        searchable={true}
        hasMore={hasMoreRelatives}
        onFetchMore={handleLoadMoreRelatives}
        placeholder="Select Policy Holder..."
      />
      <MyInput
        column
        fieldType="text"
        fieldLabel="Policy Holder Name"
        fieldName="policyHolderName"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
      />
    </>
  );

  const renderFinancialSection = () => (
    <>
      <div className="insurance-modal__section-title">Financial</div>
      <MyInput
        column
        fieldType="number"
        fieldLabel="Remaining Benefits"
        fieldName="remainingBenefits"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
      />
      <MyInput
        column
        fieldType="number"
        fieldLabel="Remaining Deductibles"
        fieldName="remainingDeductibles"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
      />
      <MyInput
        column
        fieldType="number"
        fieldLabel="Patient Share"
        fieldName="patientShare"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
      />
      <MyInput
        column
        fieldType="number"
        fieldLabel="Max Limit"
        fieldName="maxLimit"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
      />
      <MyInput
        column
        fieldLabel="Primary Insurance"
        fieldName="isPrimary"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        fieldType="checkbox"
        disabled={insuranceBrowsing}
      />
    </>
  );

  const renderEligibilitySection = () => (
    <>
      <div className="insurance-modal__section-title">Eligibility Snapshot</div>
      <MyInput
        column
        fieldType="text"
        fieldLabel="Eligibility Status"
        fieldName="eligibilityStatus"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled
      />
      <MyInput
        column
        fieldType="text"
        fieldLabel="Site Eligibility"
        fieldName="siteEligibility"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled
      />
      <MyInput
        column
        fieldType="text"
        fieldLabel="In Force"
        fieldName="inforce"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled
      />
      <MyInput
        column
        fieldType="number"
        fieldLabel="GP Visit Copay"
        fieldName="gpVisitCopay"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled
      />
      <MyInput
        column
        fieldType="number"
        fieldLabel="Specialist Visits Limit"
        fieldName="specialistVisitsLimit"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled
      />
      <MyInput
        column
        fieldType="text"
        fieldLabel="Insurance Group"
        fieldName="groupName"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled
      />
      <MyInput
        column
        fieldType="text"
        fieldLabel="Plan Code"
        fieldName="planCode"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled
      />
    </>
  );

  const renderRightContent = () => (
    <div className="insurance-modal__right-content">
      <Form layout="inline" fluid>
        {renderPolicySection()}
        {renderMemberSection()}
        {renderFinancialSection()}
        {isContractedCreate ? null : renderEligibilitySection()}
      </Form>
      <div className="insurance-modal__coverage-section">
        {patientInsurance?.planId && <PlanCoverageItemsSection planId={patientInsurance.planId} />}
      </div>
    </div>
  );

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <AdvancedModal
      open={open}
      setOpen={setOpen}
      leftTitle="Benefits Overview"
      rightTitle="Patient Insurance"
      subRightTitle={
        editing?.id
          ? 'Edit Insurance Information'
          : isContractedCreate
            ? 'Link Contracted Insurance'
            : 'Add New Insurance'
      }
      leftContent={<div dir={dir}>{renderLeftContent()}</div>}
      rightContent={<div dir={dir}>{renderRightContent()}</div>}
      actionButtonLabel="Save"
      actionButtonFunction={hideSaveBtn ? null : handleSave}
      hideCancel={false}
      height="80vh"
      size="80vw"
      leftWidth="25%"
      rightWidth="75%"
      isDisabledActionBtn={hideSaveBtn}
      isLeftClosed={false}
    />
  );
};

export default InsuranceModal;
