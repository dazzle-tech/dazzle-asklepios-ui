import React, { useEffect, useState } from 'react';
import { MdLayers, MdModeEdit, MdToggleOff } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { InsuranceCompanyPolicy, NphiesPayer } from '@/types/model-types-new';
import {
  useGetInsuranceCompanyPoliciesQuery,
  useToggleInsuranceCompanyPolicyActiveMutation
} from '@/services/setup/payer/InsuranceCompanyPolicyService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import PolicyClassesModal from './PolicyClassesModal';
import InsuranceCompanyPolicyModal from './InsuranceCompanyPolicyModal';

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
  const dispatch = useAppDispatch();
  const companyId = insuranceCompany?.id;
  const [classesOpen, setClassesOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<InsuranceCompanyPolicy | null>(null);
  const { data, isFetching } = useGetInsuranceCompanyPoliciesQuery(companyId as number, {
    skip: !companyId
  });
  const [toggleActive] = useToggleInsuranceCompanyPolicyActiveMutation();

  useEffect(() => {
    setClassesOpen(false);
    setEditOpen(false);
    setSelectedPolicy(null);
  }, [companyId]);

  const changeStatus = async (policy: InsuranceCompanyPolicy) => {
    if (!companyId) {
      return;
    }
    try {
      await toggleActive({ insuranceCompanyId: companyId, policyId: policy.id }).unwrap();
      dispatch(
        notify({
          msg: policy.isActive === false ? 'Policy activated' : 'Policy deactivated',
          sev: 'success'
        })
      );
    } catch {
      dispatch(notify({ msg: 'Unable to update policy status', sev: 'warning' }));
    }
  };

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
      render: (row: { validTo?: string | null }) => <span>{formatDate(row.validTo)}</span>
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      render: (row: InsuranceCompanyPolicy) => <span>{row.isActive === false ? 'Inactive' : 'Active'}</span>
    },
    {
      key: 'actions',
      title: '',
      width: 130,
      render: (row: InsuranceCompanyPolicy) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={22}
            fill="var(--primary-gray)"
            onClick={event => {
              event.stopPropagation();
              setSelectedPolicy(row);
              setEditOpen(true);
            }}
          />
          {row.isActive === false ? (
            <FaUndo
              className="icons-style"
              title="Activate"
              size={18}
              fill="var(--primary-gray)"
              onClick={event => {
                event.stopPropagation();
                changeStatus(row);
              }}
            />
          ) : (
            <MdToggleOff
              className="icons-style"
              title="Deactivate"
              size={24}
              fill="var(--primary-gray)"
              onClick={event => {
                event.stopPropagation();
                changeStatus(row);
              }}
            />
          )}
          <MdLayers
            className="icons-style"
            title="Classes"
            size={22}
            fill="var(--primary-gray)"
            onClick={event => {
              event.stopPropagation();
              setSelectedPolicy(row);
              setClassesOpen(true);
            }}
          />
        </div>
      )
    }
  ];

  return (
    <div className="insurance-company-policies">
      <h4 className="payer-setup-section-title">
        Policies - {insuranceCompany?.nameEn || insuranceCompany?.nphiesId}
      </h4>
      <MyTable data={data ?? []} columns={columns} loading={isFetching} height={260} />
      <PolicyClassesModal
        open={classesOpen}
        setOpen={setClassesOpen}
        insuranceCompanyId={companyId}
        policy={selectedPolicy}
      />
      <InsuranceCompanyPolicyModal
        open={editOpen}
        setOpen={setEditOpen}
        insuranceCompany={insuranceCompany}
        policy={editOpen ? selectedPolicy : null}
      />
    </div>
  );
};

export default InsuranceCompanyPoliciesPanel;
