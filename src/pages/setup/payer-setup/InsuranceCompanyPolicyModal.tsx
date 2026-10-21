import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { NphiesPayer } from '@/types/model-types-new';
import {
  InsuranceCompanyPolicySave,
  useCreateInsuranceCompanyPolicyMutation
} from '@/services/setup/payer/InsuranceCompanyPolicyService';
import './styles.less';

type PolicyForm = InsuranceCompanyPolicySave;

const emptyPolicy = (): PolicyForm => ({
  policyName: '',
  policyNumber: '',
  policyCode: '',
  validFrom: '',
  validTo: ''
});

type InsuranceCompanyPolicyModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  insuranceCompany: NphiesPayer | null;
};

const serverMessage = (err: any) => {
  const message =
    err?.data?.properties?.message ||
    err?.data?.message ||
    err?.data?.detail ||
    err?.data?.title ||
    'Failed to save policy';
  return String(message).replace(/^error\./i, '');
};

const InsuranceCompanyPolicyModal: React.FC<InsuranceCompanyPolicyModalProps> = ({
  open,
  setOpen,
  insuranceCompany
}) => {
  const dispatch = useAppDispatch();
  const [policy, setPolicy] = useState<PolicyForm>(emptyPolicy());
  const [createPolicy] = useCreateInsuranceCompanyPolicyMutation();

  useEffect(() => {
    if (open) {
      setPolicy(emptyPolicy());
    }
  }, [open, insuranceCompany?.id]);

  const handleSave = async () => {
    if (!insuranceCompany?.id) {
      return;
    }

    const errors: string[] = [];
    if (!policy.policyName.trim()) errors.push('Policy Name is required');
    if (!policy.policyNumber.trim()) errors.push('Policy Number is required');
    if (!policy.policyCode.trim()) errors.push('Policy Code is required');
    if (!policy.validFrom) errors.push('Valid From is required');
    if (!policy.validTo) errors.push('Valid To is required');
    if (policy.validFrom && policy.validTo && policy.validTo < policy.validFrom) {
      errors.push('Valid To must be on or after Valid From');
    }

    if (errors.length > 0) {
      dispatch(
        notify({
          msg: (
            <>
              {errors.map((err, index) => (
                <div key={index}>• {err}</div>
              ))}
            </>
          ),
          sev: 'warning'
        })
      );
      return;
    }

    try {
      dispatch(showSystemLoader());
      await createPolicy({
        insuranceCompanyId: insuranceCompany.id,
        body: {
          policyName: policy.policyName.trim(),
          policyNumber: policy.policyNumber.trim(),
          policyCode: policy.policyCode.trim(),
          validFrom: policy.validFrom,
          validTo: policy.validTo
        }
      }).unwrap();
      dispatch(notify({ msg: 'Policy saved successfully', sev: 'success' }));
      setOpen(false);
    } catch (err) {
      dispatch(notify({ msg: serverMessage(err), sev: 'warning' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const fieldProps = {
    record: policy,
    setRecord: setPolicy,
    width: '100%' as const,
    column: true
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        insuranceCompany?.nameEn
          ? `Add Policy - ${insuranceCompany.nameEn}`
          : 'Add Policy'
      }
      size="58vw"
      bodyheight="42vh"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      modalColor="var(--primary-blue)"
      steps={[]}
      content={
        <Form fluid layout="vertical" className="nphies-payer-form">
          <SectionContainer
            title="Policy"
            content={
              <div className="nphies-payer-fields-grid">
                <MyInput
                  {...fieldProps}
                  fieldName="policyName"
                  fieldType="text"
                  fieldLabel="Policy Name"
                  required
                />
                <MyInput
                  {...fieldProps}
                  fieldName="policyNumber"
                  fieldType="text"
                  fieldLabel="Policy Number"
                  required
                />
                <MyInput
                  {...fieldProps}
                  fieldName="policyCode"
                  fieldType="text"
                  fieldLabel="Policy Code"
                  required
                />
                <MyInput
                  {...fieldProps}
                  fieldName="validFrom"
                  fieldType="date"
                  fieldLabel="Valid From"
                  required
                />
                <MyInput
                  {...fieldProps}
                  fieldName="validTo"
                  fieldType="date"
                  fieldLabel="Valid To"
                  required
                />
              </div>
            }
          />
        </Form>
      }
    />
  );
};

export default InsuranceCompanyPolicyModal;
