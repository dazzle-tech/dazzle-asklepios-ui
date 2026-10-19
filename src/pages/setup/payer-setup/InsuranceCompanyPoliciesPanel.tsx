import React from 'react';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { NphiesPayer } from '@/types/model-types-new';
import { useGetInsuranceCompanyPoliciesQuery } from '@/services/setup/payer/InsuranceCompanyPolicyService';

const formatDate = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
};

type InsuranceCompanyPoliciesPanelProps = {
  insuranceCompany: NphiesPayer | null;
};

const InsuranceCompanyPoliciesPanel: React.FC<InsuranceCompanyPoliciesPanelProps> = ({
  insuranceCompany
}) => {
  const companyId = insuranceCompany?.id;
  const { data, isFetching } = useGetInsuranceCompanyPoliciesQuery(companyId as number, {
    skip: !companyId
  });

  if (!companyId) {
    return null;
  }

  const columns = [
    {
      key: 'policyName',
      title: <Translate>Policy Name</Translate>,
      flexGrow: 3
    },
    {
      key: 'policyNumber',
      title: <Translate>Policy Number</Translate>,
      flexGrow: 2
    },
    {
      key: 'policyCode',
      title: <Translate>Policy Code</Translate>,
      flexGrow: 2
    },
    {
      key: 'validFrom',
      title: <Translate>Valid From</Translate>,
      flexGrow: 2,
      render: (row: { validFrom?: string }) => <span>{formatDate(row.validFrom)}</span>
    },
    {
      key: 'validTo',
      title: <Translate>Valid To</Translate>,
      flexGrow: 2,
      render: (row: { validTo?: string }) => <span>{formatDate(row.validTo)}</span>
    }
  ];

  return (
    <div className="insurance-company-policies">
      <h4 className="payer-setup-section-title">
        Policies - {insuranceCompany?.nameEn || insuranceCompany?.nphiesId}
      </h4>
      <MyTable data={data ?? []} columns={columns} loading={isFetching} height={260} />
    </div>
  );
};

export default InsuranceCompanyPoliciesPanel;
