import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { useGetPlansByPayorQuery } from '@/services/setup/payer/PayorPlanService';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';
import AdvancedModal from '@/components/AdvancedModal/AdvancedModal';
import { formatEnumString } from '@/utils';
import { useGetAllPayorsQuery } from '@/services/setup/payer/PayorService';
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

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const normalizeMsg = (msg: string) => {
      const m = (msg || '').toLowerCase();
      if (m.includes('must not be null')) return 'is required';
      if (m.includes('must not be blank')) return 'must not be blank';
      if (m.includes('size')) return 'length is out of range';
      if (m.includes('greater')) return 'value is too small';
      if (m.includes('less')) return 'value is too large';
      return msg || 'invalid value';
    };

    const toLabel = (field: string) => INSURANCE_FIELD_LABELS[field] ?? field;

    const lines = data.fieldErrors.map(
      (fe: any) => `• ${toLabel(fe.field)}: ${normalizeMsg(fe.message)}`
    );

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix,
        sev: 'warning'
      })
    );
    return;
  }

  const messageProp: string = data?.message || '';
  const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : data?.errorKey;

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  dispatch(
    notify({
      msg: humanMsg + suffix,
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

  const {
    data: payorResponse,
    isLoading: payorLoading,
    isFetching: payorFetching
  } = useGetAllPayorsQuery({
    page: payorPage,
    size: 20,
    sort: 'name,asc',
    ...(payorSearchKeyword && { name: payorSearchKeyword })
  });

  const {
    data: plansResponse,
    isLoading: plansLoading,
    isFetching: plansFetching
  } = useGetPlansByPayorQuery(
    {
      payorId: Number(patientInsurance?.payorId) || 0,
      page: planPage,
      size: 20,
      sort: 'name,asc'
    },
    { skip: !patientInsurance?.payorId }
  );

  const { data: relatives, isLoading } = useGetRelativePatientsByCategoryQuery({
    patientId: patientKey?.id,
    categoryType: 'ADULT'
  });

  useEffect(() => {
    setPayorPage(0);
  }, [payorSearchKeyword]);

  useEffect(() => {
    const currentPayorId = patientInsurance?.payorId ? Number(patientInsurance.payorId) : undefined;

    if (currentPayorId === prevPayorId) return;

    setPlanPage(0);

    if (prevPayorId !== undefined) {
      setPatientInsurance(prev => ({ ...prev, planId: null }));
    }

    setPrevPayorId(currentPayorId);
  }, [patientInsurance?.payorId, prevPayorId]);

  const hasMorePayors = payorResponse?.links?.next != null;
  const hasMorePlans = plansResponse?.links?.next != null;

  const handleLoadMorePayors = () => {
    if (hasMorePayors && !payorFetching) setPayorPage(p => p + 1);
  };

  const handleLoadMorePlans = () => {
    if (hasMorePlans && !plansFetching) setPlanPage(p => p + 1);
  };

  const handleSave = async () => {
    const body: PatientInsurance = {
      ...patientInsurance,
      patientId: patientKey.id
    };

    try {
      if (body.id) {
        await updatePatientInsurance({ id: body.id, ...body }).unwrap();
      } else {
        await addPatientInsurance(body).unwrap();
      }

      refetchInsurance();
      handleClearModal();

      dispatch(notify({ msg: 'Insurance Saved Successfully', sev: 'success' }));
    } catch (err: any) {
      handleCrudError(err, dispatch, INSURANCE_ERROR_MAP);
    }
  };

  const handleClearModal = () => {
    setPatientInsurance({ ...newPatientInsurance });
    setPrevPayorId(undefined);
    setPayorPage(0);
    setPayorSearchKeyword('');
    setPlanPage(0);
    onClose();
  };

  useEffect(() => {
    const namesAndIds =
      relations?.map(r => ({
        name: `${r.relativePatientObject.firstName} ${r.relativePatientObject.lastName}`,
        id: r.id
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
    }
  }, [open, editing]);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setPatientInsurance({ ...newPatientInsurance });
        setPrevPayorId(undefined);
        setPayorPage(0);
        setPayorSearchKeyword('');
        setPlanPage(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const renderLeftContent = () => (
    <div style={{ padding: '16px', height: '100%' }}>
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
    <div style={{ padding: '20px' }}>
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
              return (
                <div
                  style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Load more...
                </div>
              );
            }
            return (
              <div>
                <div style={{ fontWeight: 500 }}>{item.name}</div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--primary-gray)'
                  }}
                >
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
          fieldType="select"
          fieldName="policyHolderId"
          selectData={relatives ?? []}
          selectDataLabel={['firstName', 'lastName']}
          selectDataValue="id"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
          loading={isLoading}
          searchable={false}
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
      <div style={{ marginTop: 20 }}>
        {patientInsurance?.planId && <PlanCoverageItemsSection planId={patientInsurance.planId} />}
      </div>
    </div>
  );

  return (
    <AdvancedModal
      open={open}
      setOpen={setOpen}
      leftTitle="Benefits Overview"
      rightTitle="Patient Insurance"
      subRightTitle={editing?.id ? 'Edit Insurance Information' : 'Add New Insurance'}
      leftContent={renderLeftContent()}
      rightContent={renderRightContent()}
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