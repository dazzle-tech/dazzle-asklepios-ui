import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { formatEnumString } from '@/utils';
import { InsuranceCompanyPolicy } from '@/types/model-types-new';
import {
  PolicyCoverageClass,
  useGetPolicyCoverageClassesQuery
} from '@/services/setup/payer/InsuranceCompanyPolicyService';

type PolicyClassesModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  insuranceCompanyId?: number | null;
  policy: InsuranceCompanyPolicy | null;
};

const PolicyClassesModal: React.FC<PolicyClassesModalProps> = ({
  open,
  setOpen,
  insuranceCompanyId,
  policy
}) => {
  const { data = [], isFetching } = useGetPolicyCoverageClassesQuery(
    { insuranceCompanyId: Number(insuranceCompanyId), policyId: Number(policy?.id) },
    { skip: !open || !insuranceCompanyId || !policy?.id, refetchOnMountOrArgChange: true }
  );

  const columns = [
    {
      key: 'name',
      title: <Translate>Class</Translate>,
      flexGrow: 2
    },
    {
      key: 'guarantorType',
      title: <Translate>Coverage Type</Translate>,
      flexGrow: 2,
      render: (row: PolicyCoverageClass) => formatEnumString(row.guarantorType || '') || '-'
    },
    {
      key: 'coverageName',
      title: <Translate>Coverage</Translate>,
      flexGrow: 3,
      render: (row: PolicyCoverageClass) => row.coverageName || '-'
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      render: (row: PolicyCoverageClass) => (row.isActive ? 'Active' : 'Inactive')
    }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={policy ? `Classes - ${policy.policyName}` : 'Classes'}
      size="70vw"
      bodyheight="60vh"
      hideCancel
      hideActionBtn
      modalColor="var(--primary-blue)"
      steps={[]}
      content={<MyTable data={data} columns={columns} loading={isFetching} height={420} />}
    />
  );
};

export default PolicyClassesModal;
