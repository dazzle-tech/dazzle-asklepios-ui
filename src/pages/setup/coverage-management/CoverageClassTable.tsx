import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete, MdLink, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { coverageHeaderName, notifyError, notifySuccess, notifyWarning } from './coverageHelpers';
import {
  useCreateCoverageClassMutation,
  useLinkCoverageClassPolicyMutation,
  useListCoverageClassesQuery,
  useToggleCoverageClassActiveMutation,
  useUpdateCoverageClassMutation,
  type CoverageClass,
  type CoverageContract
} from '@/services/setup/coverageManagement/coverageManagementService';
import { useGetInsuranceCompanyPoliciesQuery } from '@/services/setup/payer/InsuranceCompanyPolicyService';

type Props = {
  contract: CoverageContract;
  selected: CoverageClass | null;
  onSelect: (coverageClass: CoverageClass) => void;
};

const emptyClass = (contractId?: number): CoverageClass => ({
  coverageContractId: contractId,
  name: '',
  isActive: true
});

const CoverageClassTable = ({ contract, selected, onSelect }: Props) => {
  const dispatch = useAppDispatch();
  const [editorOpen, setEditorOpen] = useState(false);
  const [record, setRecord] = useState<CoverageClass>(emptyClass(contract.id));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleActionType, setToggleActionType] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [pending, setPending] = useState<CoverageClass | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkClass, setLinkClass] = useState<CoverageClass | null>(null);
  const [linkForm, setLinkForm] = useState<{ insuranceCompanyPolicyId?: number | null }>({});
  const [paginationParams, setPaginationParams] = useState({ page: 0, size: 10, sort: 'name,asc' });
  const classesQuery = useListCoverageClassesQuery(
    { contractId: Number(contract.id), ...paginationParams },
    { skip: !contract.id }
  );
  const [createClass] = useCreateCoverageClassMutation();
  const [updateClass] = useUpdateCoverageClassMutation();
  const [toggleActive] = useToggleCoverageClassActiveMutation();
  const [linkPolicy] = useLinkCoverageClassPolicyMutation();
  const policiesQuery = useGetInsuranceCompanyPoliciesQuery(Number(contract.insurancePayerId), {
    skip: !linkOpen || !contract.insurancePayerId
  });
  const rows = classesQuery.data?.data ?? [];
  const headerName = coverageHeaderName(contract);

  useEffect(() => {
    if (!selected?.id && rows.length) {
      onSelect(rows[0]);
    }
  }, [onSelect, rows, selected?.id]);

  const policyOptions = (policiesQuery.data ?? []).map(policy => ({
    label: `${policy.policyName} (${policy.policyCode})`,
    value: policy.id
  }));

  const openPolicyLink = (coverageClass: CoverageClass) => {
    if (!contract.insurancePayerId) {
      notifyWarning(dispatch, 'Select an insurance company on the coverage contract first');
      return;
    }
    onSelect(coverageClass);
    setLinkClass(coverageClass);
    setLinkForm({ insuranceCompanyPolicyId: coverageClass.insuranceCompanyPolicyId ?? null });
    setLinkOpen(true);
  };

  const savePolicyLink = async () => {
    if (!linkClass?.id || !linkForm.insuranceCompanyPolicyId) {
      notifyWarning(dispatch, 'Policy is required');
      return;
    }
    try {
      const saved = await linkPolicy({
        id: linkClass.id,
        insuranceCompanyPolicyId: Number(linkForm.insuranceCompanyPolicyId)
      }).unwrap();
      notifySuccess(dispatch, 'Policy linked to class');
      onSelect(saved);
      setLinkOpen(false);
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to link policy');
    }
  };

  const openEditor = (coverageClass: CoverageClass) => {
    setRecord({ ...emptyClass(contract.id), ...coverageClass });
    setEditorOpen(true);
  };

  const saveClass = async () => {
    if (!record.name?.trim()) {
      notifyWarning(dispatch, 'Class name is required');
      return;
    }
    try {
      const saved = record.id
        ? await updateClass({ id: record.id, name: record.name.trim(), isActive: record.isActive }).unwrap()
        : await createClass({
            coverageContractId: Number(contract.id),
            name: record.name.trim(),
            isActive: record.isActive ?? true
          }).unwrap();
      notifySuccess(dispatch, 'Coverage class saved');
      onSelect(saved);
      setEditorOpen(false);
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to save coverage class');
    }
  };

  return (
    <div className="coverage-class-block">
      <div className="coverage-class-head">
        <div className="coverage-class-title">
          <Translate>Classes under</Translate>
          {headerName ? (
            <>
              {' '}
              <span className="coverage-class-title-name">{headerName}</span>
            </>
          ) : null}
        </div>
        {contract.isActive ? (
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            width="120px"
            onClick={() => openEditor(emptyClass(contract.id))}
          >
            Add Class
          </MyButton>
        ) : null}
      </div>

      <MyTable
        data={rows}
        totalCount={classesQuery.data?.totalCount ?? 0}
        loading={classesQuery.isFetching}
        height={240}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={(_e: any, page: number) => setPaginationParams(prev => ({ ...prev, page }))}
        onRowsPerPageChange={(e: any) =>
          setPaginationParams(prev => ({ ...prev, size: Number(e.target.value), page: 0 }))
        }
        onRowClick={(row: CoverageClass) => onSelect(row)}
        rowClassName={(row: CoverageClass) => (selected?.id && selected.id === row.id ? 'selected-row' : '')}
        columns={[
          { key: 'name', title: <Translate>Class</Translate>, flexGrow: 2 },
          {
            key: 'policyName',
            title: <Translate>Policy</Translate>,
            flexGrow: 2,
            render: (row: CoverageClass) => row.policyName || '-'
          },
          {
            key: 'isActive',
            title: <Translate>Status</Translate>,
            flexGrow: 1,
            render: (row: CoverageClass) => (row.isActive ? 'Active' : 'Inactive')
          },
          {
            key: 'actions',
            title: '',
            flexGrow: 1,
            render: (row: CoverageClass) => (
              <div className="coverage-row-actions">
                <MdLink
                  className="icons-style"
                  title="Link Policy"
                  size={22}
                  fill="var(--primary-gray)"
                  onClick={event => {
                    event.stopPropagation();
                    openPolicyLink(row);
                  }}
                />
                <MdModeEdit
                  className="icons-style"
                  size={22}
                  onClick={event => {
                    event.stopPropagation();
                    onSelect(row);
                    openEditor(row);
                  }}
                />
                {row.isActive ? (
                  <MdDelete
                    className="icons-style"
                    title="Deactivate"
                    size={22}
                    fill="var(--primary-pink)"
                    onClick={event => {
                      event.stopPropagation();
                      setPending(row);
                      setToggleActionType('deactivate');
                      setConfirmOpen(true);
                    }}
                  />
                ) : (
                  <FaUndo
                    className="icons-style"
                    size={18}
                    title="Activate"
                    onClick={event => {
                      event.stopPropagation();
                      setPending(row);
                      setToggleActionType('reactivate');
                      setConfirmOpen(true);
                    }}
                  />
                )}
              </div>
            )
          }
        ]}
      />

      <MyModal
        open={editorOpen}
        setOpen={setEditorOpen}
        title={record.id ? 'Edit Coverage Class' : 'Add Coverage Class'}
        size="480px"
        bodyheight="28vh"
        actionButtonLabel="Save"
        actionButtonFunction={saveClass}
        modalColor="var(--primary-blue)"
        content={
          <Form fluid>
            <MyInput
              required
              width="100%"
              fieldLabel="Class Name"
              fieldName="name"
              record={record}
              setRecord={setRecord}
              placeholder="VIP, Gold, A..."
            />
          </Form>
        }
      />

      <MyModal
        open={linkOpen}
        setOpen={setLinkOpen}
        title={linkClass?.name ? `Link Policy - ${linkClass.name}` : 'Link Policy'}
        size="480px"
        bodyheight="32vh"
        actionButtonLabel="Save"
        actionButtonFunction={savePolicyLink}
        modalColor="var(--primary-blue)"
        content={
          <Form fluid>
            <MyInput
              required
              width="100%"
              fieldLabel="Policy"
              fieldType="select"
              fieldName="insuranceCompanyPolicyId"
              record={linkForm}
              setRecord={setLinkForm}
              selectData={policyOptions}
              selectDataLabel="label"
              selectDataValue="value"
              placeholder="Select a policy for this insurance company"
              searchable
            />
          </Form>
        }
      />

      <DeletionConfirmationModal
        open={confirmOpen}
        setOpen={setConfirmOpen}
        itemToDelete="Coverage class"
        actionType={toggleActionType}
        actionButtonFunction={async () => {
          if (!pending?.id) return;
          setConfirmOpen(false);
          try {
            const updated = await toggleActive(pending.id).unwrap();
            if (selected?.id === updated.id) {
              onSelect(updated);
            }
            notifySuccess(dispatch, 'Coverage class status updated');
          } catch (error: any) {
            notifyError(dispatch, error, 'Unable to update class status');
          }
        }}
      />
    </div>
  );
};

export default CoverageClassTable;
