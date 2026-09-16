import React, { useEffect, useMemo, useState } from 'react';
import { Form, Message } from 'rsuite';
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
  useSearchContractedInsurancesQuery,
  useSearchCoverageContractsQuery,
  type CoverageContract,
  type CoverageContractedInsurance
} from '@/services/setup/coverageManagement/coverageManagementService';

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

const formatContractedInsuranceLabel = (item: CoverageContractedInsurance): string => {
  const name = item.name || item.payorName || item.nphiesId || `Insurance #${item.insurancePayerId}`;
  const nphies = item.nphiesId ? ` (${item.nphiesId})` : '';
  const count =
    item.contractCount && item.contractCount > 0
      ? ` · ${item.contractCount} contract${item.contractCount === 1 ? '' : 's'}`
      : '';
  return `${name}${nphies}${count}`;
};

const formatCoverageContractLabel = (contract: CoverageContract): string => {
  const policy = contract.policyNumber || contract.code || `Contract #${contract.id}`;
  const className = contract.className ? `Class ${formatEnumString(contract.className)}` : '';
  const dates = [contract.startDate, contract.endDate].filter(Boolean).join(' → ');
  return [policy, className, dates].filter(Boolean).join(' · ');
};

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

  const [insuranceSearch, setInsuranceSearch] = useState('');
  const [insurancePage, setInsurancePage] = useState(0);
  const [allContractedInsurances, setAllContractedInsurances] = useState<CoverageContractedInsurance[]>([]);
  const [contractPage, setContractPage] = useState(0);
  const [allCoverageContracts, setAllCoverageContracts] = useState<CoverageContract[]>([]);

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

  const {
    data: contractedInsurancesResponse,
    isLoading: contractedInsurancesLoading,
    isFetching: contractedInsurancesFetching
  } = useSearchContractedInsurancesQuery(
    {
      page: insurancePage,
      size: 20,
      sort: 'nameEn,asc',
      search: insuranceSearch.trim() || undefined
    },
    { skip: !open || !isContractedCreate }
  );

  const selectedInsurancePayerId = Number(patientInsurance.insurancePayerId);

  const {
    data: coverageContractsResponse,
    isLoading: coverageContractsLoading,
    isFetching: coverageContractsFetching
  } = useSearchCoverageContractsQuery(
    {
      page: contractPage,
      size: 20,
      sort: 'policyNumber,asc',
      isActive: true,
      insurancePayerId: selectedInsurancePayerId
    },
    {
      skip: !open || !isContractedCreate || !Number.isFinite(selectedInsurancePayerId) || selectedInsurancePayerId <= 0
    }
  );

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
    setContractPage(0);
    setAllCoverageContracts([]);
    setPatientInsurance(prev => ({
      ...prev,
      insurancePayerId: item?.insurancePayerId ?? null,
      coverageContractId: null,
      contractCode: null,
      contractStartDate: null,
      contractEndDate: null,
      priceListName: null,
      payorId: item?.payorId ?? null,
      payerNphiesId: item?.nphiesId ?? null,
      payerName: item?.payorName || item?.name || null,
      policyNumber: '',
      policyClassName: null,
      groupName: null,
      planId: null
    }));
  };

  const applyCoverageContract = (contract: CoverageContract | null) => {
    setPatientInsurance(prev => ({
      ...prev,
      coverageContractId: contract?.id ?? null,
      contractCode: contract?.code ?? null,
      contractStartDate: contract?.startDate ?? null,
      contractEndDate: contract?.endDate ?? null,
      priceListName: contract?.priceListName ?? null,
      policyNumber: contract?.policyNumber || prev.policyNumber || '',
      policyClassName: contract?.className || prev.policyClassName || null,
      groupName: contract?.companyName || contract?.insurancePayerName || prev.groupName || null,
      payerName: prev.payerName || contract?.insurancePayerName || null
    }));
  };

  useEffect(() => {
    setPayorPage(0);
  }, [payorSearchKeyword]);

  useEffect(() => {
    setInsurancePage(0);
  }, [insuranceSearch]);

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
    if (!open || !isContractedCreate) {
      setAllContractedInsurances([]);
      return;
    }

    const incoming = contractedInsurancesResponse?.data ?? [];
    setAllContractedInsurances(prev => {
      if (insurancePage === 0) {
        return incoming;
      }
      const seen = new Set(prev.map(item => Number(item.insurancePayerId)));
      return [
        ...prev,
        ...incoming.filter(item => !seen.has(Number(item.insurancePayerId)))
      ];
    });
  }, [contractedInsurancesResponse, insurancePage, open, isContractedCreate]);

  useEffect(() => {
    if (!open || !isContractedCreate || !selectedInsurancePayerId) {
      setAllCoverageContracts([]);
      return;
    }

    const incoming = coverageContractsResponse?.data ?? [];
    setAllCoverageContracts(prev => {
      if (contractPage === 0) {
        return incoming;
      }
      const seen = new Set(prev.map(item => Number(item.id)));
      return [...prev, ...incoming.filter(item => !seen.has(Number(item.id)))];
    });
  }, [coverageContractsResponse, contractPage, open, isContractedCreate, selectedInsurancePayerId]);

  useEffect(() => {
    if (!isContractedCreate || !selectedInsurancePayerId) {
      return;
    }

    const contracts = coverageContractsResponse?.data ?? [];
    if (
      contractPage === 0 &&
      contracts.length === 1 &&
      !patientInsurance.coverageContractId &&
      !coverageContractsFetching
    ) {
      applyCoverageContract(contracts[0]);
    }
  }, [
    coverageContractsResponse,
    coverageContractsFetching,
    contractPage,
    isContractedCreate,
    selectedInsurancePayerId,
    patientInsurance.coverageContractId
  ]);

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
  const hasMoreContractedInsurances =
    contractedInsurancesResponse?.links?.next != null ||
    Number(contractedInsurancesResponse?.totalCount ?? 0) > allContractedInsurances.length;
  const hasMoreCoverageContracts =
    coverageContractsResponse?.links?.next != null ||
    Number(coverageContractsResponse?.totalCount ?? 0) > allCoverageContracts.length;

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

  const handleLoadMoreContractedInsurances = () => {
    if (hasMoreContractedInsurances && !contractedInsurancesFetching) {
      setInsurancePage(currentPage => currentPage + 1);
    }
  };

  const handleLoadMoreCoverageContracts = () => {
    if (hasMoreCoverageContracts && !coverageContractsFetching) {
      setContractPage(currentPage => currentPage + 1);
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
    }

    const insuranceBody: PatientInsurance = {
      ...stripUiOnlyInsuranceFields(patientInsurance),
      patientId: resolvedPatientId
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
    setInsuranceSearch('');
    setInsurancePage(0);
    setAllContractedInsurances([]);
    setContractPage(0);
    setAllCoverageContracts([]);
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

  const contractedInsuranceOptions = useMemo(
    () =>
      allContractedInsurances.map(item => ({
        ...item,
        id: item.insurancePayerId,
        displayName: formatContractedInsuranceLabel(item)
      })),
    [allContractedInsurances]
  );

  const coverageContractOptions = useMemo(
    () =>
      allCoverageContracts.map(item => ({
        ...item,
        displayName: formatCoverageContractLabel(item)
      })),
    [allCoverageContracts]
  );

  const renderContractedPolicySection = () => (
    <>
      <div className="insurance-modal__section-title">Contracted Insurance</div>
      <Message showIcon type="info" className="insurance-modal__info-banner">
        <Translate>
          Choose an insurance company that already has an active coverage contract, then select
          the contract to link this patient.
        </Translate>
      </Message>
      {!contractedInsurancesLoading &&
      !contractedInsurancesFetching &&
      allContractedInsurances.length === 0 ? (
        <Message showIcon type="warning" className="insurance-modal__info-banner">
          <Translate>
            No insurance companies with an active coverage contract were found. Add a coverage
            contract in Setup first.
          </Translate>
        </Message>
      ) : null}
      <MyInput
        column
        required
        fieldLabel="Insurance Company"
        fieldType="selectPagination"
        fieldName="insurancePayerId"
        selectData={contractedInsuranceOptions}
        selectDataLabel="displayName"
        selectDataValue="insurancePayerId"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
        searchable
        loading={contractedInsurancesLoading || contractedInsurancesFetching}
        hasMore={hasMoreContractedInsurances}
        onFetchMore={handleLoadMoreContractedInsurances}
        searchKeyWard={insuranceSearch}
        setSearchKeyWard={setInsuranceSearch}
        placeholder="Select insurance with a contract..."
        onSelectItem={(item: any) => {
          if (!item?.isLoadMore) {
            applyContractedInsurance(item);
          }
        }}
      />
      <MyInput
        column
        required
        fieldLabel="Coverage Contract"
        fieldType="selectPagination"
        fieldName="coverageContractId"
        selectData={coverageContractOptions}
        selectDataLabel="displayName"
        selectDataValue="id"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing || !patientInsurance.insurancePayerId}
        searchable
        loading={coverageContractsLoading || coverageContractsFetching}
        hasMore={hasMoreCoverageContracts}
        onFetchMore={handleLoadMoreCoverageContracts}
        placeholder={
          !patientInsurance.insurancePayerId
            ? 'Select insurance company first...'
            : 'Select coverage contract...'
        }
        onSelectItem={(item: any) => {
          if (!item?.isLoadMore) {
            applyCoverageContract(item);
          }
        }}
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
              {patientInsurance.policyClassName
                ? formatEnumString(patientInsurance.policyClassName)
                : '-'}
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
        fieldType="text"
        fieldLabel="Policy Class"
        fieldName="policyClassName"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled
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
        selectData={relationsLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={patientInsurance}
        setRecord={setPatientInsurance}
        disabled={insuranceBrowsing}
        searchable={false}
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
