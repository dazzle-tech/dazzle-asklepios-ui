import React, { useEffect, useState } from 'react';
import { MdLayers, MdModeEdit, MdToggleOff } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import DeactivationReasonModal from '@/components/DeactivationReasonModal';
import { InsuranceCompanyPolicy, NphiesPayer } from '@/types/model-types-new';
import {
  useSearchInsuranceCompanyPoliciesQuery,
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

type PolicySearchField = 'policyName' | 'policyNumber' | 'policyCode';

type PolicyFilter = Record<PolicySearchField, string>;

const emptyPolicyFilter: PolicyFilter = { policyName: '', policyNumber: '', policyCode: '' };

const filterBy = (field: PolicySearchField, value: string): PolicyFilter => ({
  ...emptyPolicyFilter,
  [field]: value
});

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
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<InsuranceCompanyPolicy | null>(null);
  const [policyFilter, setPolicyFilter] = useState<PolicyFilter>(emptyPolicyFilter);
  const [appliedPolicyFilter, setAppliedPolicyFilter] = useState<PolicyFilter>(emptyPolicyFilter);
  const { data, isFetching } = useSearchInsuranceCompanyPoliciesQuery(
    { insuranceCompanyId: companyId as number, ...appliedPolicyFilter },
    { skip: !companyId }
  );
  const [toggleActive] = useToggleInsuranceCompanyPolicyActiveMutation();

  useEffect(() => {
    setClassesOpen(false);
    setEditOpen(false);
    setDeactivateOpen(false);
    setSelectedPolicy(null);
    setPolicyFilter(emptyPolicyFilter);
    setAppliedPolicyFilter(emptyPolicyFilter);
  }, [companyId]);

  const applyHeaderSearch = (field: PolicySearchField, value: string) => {
    const next = filterBy(field, value.trim());
    setPolicyFilter(next);
    setAppliedPolicyFilter(next);
  };

  const searchableColumn = (field: PolicySearchField, placeholder: string) => ({
    searchable: true,
    searchPlaceholder: placeholder,
    searchValue: policyFilter[field],
    onSearchChange: (value: string) => setPolicyFilter(filterBy(field, value)),
    onSearchSubmit: (value?: string) => applyHeaderSearch(field, value ?? policyFilter[field])
  });

  const changeStatus = async (policy: InsuranceCompanyPolicy, reason?: string) => {
    if (!companyId) {
      return;
    }
    try {
      await toggleActive({ insuranceCompanyId: companyId, policyId: policy.id, reason }).unwrap();
      setDeactivateOpen(false);
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
      flexGrow: 3,
      ...searchableColumn('policyName', 'Search policy name')
    },
    {
      key: 'policyNumber',
      title: <Translate>Policy Number</Translate>,
      flexGrow: 2,
      ...searchableColumn('policyNumber', 'Search policy number')
    },
    {
      key: 'policyCode',
      title: <Translate>Policy Code</Translate>,
      flexGrow: 2,
      ...searchableColumn('policyCode', 'Search policy code')
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
      render: (row: InsuranceCompanyPolicy) =>
        row.isActive === false ? (
          <span title={row.inactiveReason ?? undefined}>
            Inactive{row.inactiveReason ? ` — ${row.inactiveReason}` : ''}
          </span>
        ) : (
          <span>Active</span>
        )
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
                setSelectedPolicy(row);
                setDeactivateOpen(true);
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
      <DeactivationReasonModal
        open={deactivateOpen}
        setOpen={setDeactivateOpen}
        itemLabel="Policy"
        itemName={selectedPolicy?.policyName}
        onConfirm={reason => selectedPolicy && changeStatus(selectedPolicy, reason)}
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
