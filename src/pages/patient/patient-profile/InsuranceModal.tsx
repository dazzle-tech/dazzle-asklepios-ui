import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { useGetAllActivePlansQuery } from '@/services/setup/payer/PayorPlanService';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';
import AdvancedModal from '@/components/AdvancedModal/AdvancedModal';
import { formatEnumString } from '@/utils';
import { useGetAllActivePayorsQuery } from '@/services/setup/payer/PayorService';
import InsuranceBenefitsCard from './InsuranceBenefitsCard';
import './styles.less';
import PlanCoverageItemsSection from './PlanCoverageItemsSection';
import { PatientInsurance } from '@/types/model-types-new';
import { newPatientInsurance } from '@/types/model-types-constructor-new';

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
  'db.constraint': 'Database constraint violation while saving insurance.',
  notfound: 'Insurance record not found.'
};

const INSURANCE_FIELD_LABELS: Record<string, string> = {
  payorId: 'Payor',
  planId: 'Plan',
  policyNumber: 'Policy Number',
  groupNumber: 'Group Number',
  expirationDate: 'Expiration Date',
  policyHolderId: 'Policy Holder',
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
  relations,
  hideSaveBtn = false
}) => {
  const dispatch = useAppDispatch();

  const [patientInsurance, setPatientInsurance] = useState<PatientInsurance>({
    ...newPatientInsurance
  });

  const [addPatientInsurance] = useAddPatientInsuranceMutation();
  const [updatePatientInsurance] = useUpdatePatientInsuranceMutation();

  const [relationsList, setRelationsList] = useState<any[]>();
  const [prevPayorId, setPrevPayorId] = useState<number | undefined>();

  const [payorPage, setPayorPage] = useState(0);
  const [payorSearchKeyword, setPayorSearchKeyword] = useState('');
  const [planPage, setPlanPage] = useState(0);

  // Policy Holder pagination state
  const [relativePage, setRelativePage] = useState(0);
  const [allRelatives, setAllRelatives] = useState<any[]>([]);

  // بعد
  const {
    data: payorResponse,
    isLoading: payorLoading,
    isFetching: payorFetching
  } = useGetAllActivePayorsQuery({
    page: payorPage,
    size: 20,
    sort: 'name,asc'
  });

  const {
    data: plansResponse,
    isLoading: plansLoading,
    isFetching: plansFetching
  } = useGetAllActivePlansQuery(
    {
      payorId: Number(patientInsurance?.payorId) || 0,
      page: planPage,
      size: 20,
      sort: 'name,asc'
    },
    { skip: !patientInsurance?.payorId }
  );

  const {
    data: relativesResponse,
    isLoading: relativesLoading,
    isFetching: relativesFetching
  } = useGetRelativePatientsByCategoryQuery(
    {
      patientId: patientKey?.id,
      categoryType: 'ADULT',
      page: relativePage,
      size: 5
    },
    { skip: !patientKey?.id || !open }
  );

  useEffect(() => {
    setPayorPage(0);
  }, [payorSearchKeyword]);

  useEffect(() => {
    const currentPayorId = patientInsurance?.payorId ? Number(patientInsurance.payorId) : undefined;

    if (currentPayorId === prevPayorId) return;

    setPlanPage(0);

    if (prevPayorId !== undefined) {
      setPatientInsurance(prevInsurance => ({ ...prevInsurance, planId: null }));
    }

    setPrevPayorId(currentPayorId);
  }, [patientInsurance?.payorId, prevPayorId]);

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
    const insuranceBody: PatientInsurance = {
      ...patientInsurance,
      patientId: patientKey.id
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

  const handleClearModal = () => {
    setPatientInsurance({ ...newPatientInsurance });
    setPrevPayorId(undefined);
    setPayorPage(0);
    setPayorSearchKeyword('');
    setPlanPage(0);
    setRelativePage(0);
    setAllRelatives([]);
    onClose();
  };

  useEffect(() => {
    const namesAndIds =
      relations?.map(relation => ({
        name: `${relation.relativePatientObject.firstName} ${relation.relativePatientObject.lastName}`,
        id: relation.id
      })) || [];
    setRelationsList(namesAndIds);
  }, [relations]);

  useEffect(() => {
    if (open) {
      if (editing && editing.id) {
        setPatientInsurance({
          ...editing,
          payorId: Number(editing.payorId),
          planId: editing.planId ? Number(editing.planId) : null
        });
        setPrevPayorId(Number(editing.payorId));
      } else {
        setPatientInsurance({ ...newPatientInsurance });
        setPrevPayorId(undefined);
        setPayorPage(0);
        setPayorSearchKeyword('');
        setPlanPage(0);
      }

      setRelativePage(0);
      setAllRelatives([]);
    }
  }, [open, editing]);

  useEffect(() => {
    if (!open) {
      const resetTimer = setTimeout(() => {
        setPatientInsurance({ ...newPatientInsurance });
        setPrevPayorId(undefined);
        setPayorPage(0);
        setPayorSearchKeyword('');
        setPlanPage(0);
        setRelativePage(0);
        setAllRelatives([]);
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
          remailingDeductibles: patientInsurance.remailingDeductibles,
          deductiblesValue: patientInsurance.deductiblesValue,
          coInsuranceValue: patientInsurance.coInsuranceValue,
          coPaymentValue: patientInsurance.coPaymentValue
        }}
      />
    </div>
  );

  const renderRightContent = () => (
    <div className="insurance-modal__right-content">
      <Form layout="inline" fluid>
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
          fieldType="number"
          fieldLabel="Policy Number"
          fieldName="policyNumber"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
        />
        <MyInput
          column
          fieldType="number"
          fieldLabel="Group Number"
          fieldName="groupNumber"
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
          fieldLabel="Primary Insurance"
          fieldName="isPrimary"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          fieldType="checkbox"
          disabled={insuranceBrowsing}
        />
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
      subRightTitle={editing?.id ? 'Edit Insurance Information' : 'Add New Insurance'}
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
