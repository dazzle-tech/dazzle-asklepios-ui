import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Form } from 'rsuite';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import {
  useCreatePolicyAssignmentMutation,
  useGetPolicyAssignmentsByResourceQuery,
  useTogglePolicyAssignmentActiveMutation,
  useUpdatePolicyAssignmentMutation,
} from '@/services/setup/policyAssignment/policyAssignmentService';
import {
  useGetAllActivePolicyDefinitionsQuery,
  useGetActivePolicyDefinitionsByFacilityQuery,
} from '@/services/setup/policyDefinition/policyDefinitionService';
import {
  PolicyAssignment,
  PolicyAssignmentCreateDTO,
  PolicyResourceType,
} from '@/types/model-types-new';
import { newPolicyAssignmentCreateDTO } from '@/types/model-types-constructor-new';

const extractErrorMessage = (response: any): string => {
  try {
    const msg = response?.data?.message ?? response?.message;
    return typeof msg === 'string' ? msg.replace(/^error\./i, '') : '';
  } catch {
    return '';
  }
};

type PolicyAssignmentManagerProps = {
  resourceType: PolicyResourceType;
  resourceId: number;
  facilityId?: number;
  title?: string;
  showHeader?: boolean;
  onSaved?: () => void;
};

const PolicyAssignmentManager = ({
  resourceType,
  resourceId,
  facilityId,
  title = 'Policy Assignment',
  showHeader = true,
  onSaved,
}: PolicyAssignmentManagerProps) => {
  const dispatch = useAppDispatch();
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [assignmentRequest, setAssignmentRequest] = useState<PolicyAssignmentCreateDTO>(
    ({ ...newPolicyAssignmentCreateDTO, resourceType, resourceId } as PolicyAssignmentCreateDTO)
  );

  const {
    data: assignmentResponse,
    isFetching: isAssignmentsLoading,
    refetch: refetchAssignments,
  } = useGetPolicyAssignmentsByResourceQuery(
    { resourceType, resourceId },
    { skip: !resourceType || !resourceId }
  );

  const { data: facilityPolicyDefinitionsResponse, isFetching: isFacilityPoliciesLoading } =
    useGetActivePolicyDefinitionsByFacilityQuery(
      { facilityId, page: 0, size: 200, sort: 'name,asc' },
      { skip: !facilityId }
    );

  const { data: allPolicyDefinitionsResponse, isFetching: isAllPoliciesLoading } =
    useGetAllActivePolicyDefinitionsQuery(
      { page: 0, size: 200, sort: 'name,asc' },
      { skip: !!facilityId }
    );

  const policyDefinitions = useMemo(
    () =>
      facilityPolicyDefinitionsResponse?.data?.length
        ? facilityPolicyDefinitionsResponse.data
        : allPolicyDefinitionsResponse?.data ?? [],
    [facilityPolicyDefinitionsResponse, allPolicyDefinitionsResponse]
  );

  const [createPolicyAssignment, { isLoading: isCreatingAssignment }] = useCreatePolicyAssignmentMutation();
  const [togglePolicyAssignmentActive, { isLoading: isTogglingAssignment }] =
    useTogglePolicyAssignmentActiveMutation();
  const [openEditModal, setOpenEditModal] = useState(false);

  const [selectedPolicyAssignment, setSelectedPolicyAssignment] =
    useState<PolicyAssignment | null>(null);

  const [editPolicyAssignmentRequest, setEditPolicyAssignmentRequest] =
    useState<any>({
      isRequired: false,
    });
  const [updatePolicyAssignment, { isLoading: isUpdatingAssignment }] =
    useUpdatePolicyAssignmentMutation();

  useEffect(() => {
    setAssignmentRequest(prev => ({
      ...prev,
      resourceType,
      resourceId,
    }));
  }, [resourceType, resourceId]);

  const assignments: PolicyAssignment[] = assignmentResponse ?? [];
  const isLoading = isAssignmentsLoading || isFacilityPoliciesLoading || isAllPoliciesLoading;

  const policySelectData = policyDefinitions.map(policy => ({
    value: policy.id,
    label: `${policy.code ?? ''}${policy.code ? ' - ' : ''}${policy.name}`,
  }));

  const handleAssignPolicy = async () => {
    if (!assignmentRequest.policyId || !resourceType || !resourceId) {
      dispatch(notify({ msg: 'Please select a policy before assigning.', sev: 'warning' }));
      return;
    }

    const alreadyAssigned = assignments.some(
      existing => existing.policyId === assignmentRequest.policyId
    );
    if (alreadyAssigned) {
      dispatch(notify({ msg: 'This policy is already assigned to the target resource.', sev: 'warning' }));
      return;
    }

    try {
      dispatch(showSystemLoader());
      await createPolicyAssignment(assignmentRequest).unwrap();
      setOpenAssignModal(false);
      setAssignmentRequest({
        ...newPolicyAssignmentCreateDTO,
        resourceType,
        resourceId,
      });
      await refetchAssignments();
      dispatch(notify({ msg: 'Policy assigned successfully.', sev: 'success' }));
      onSaved?.();
    } catch (error) {
      const errorMsg = extractErrorMessage(error) || 'Unable to assign policy, please try again.';
      dispatch(notify({ msg: errorMsg, sev: 'error' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleToggleActive = async (assignment: PolicyAssignment) => {
    if (!assignment?.id) return;
    try {
      dispatch(showSystemLoader());
      await togglePolicyAssignmentActive(assignment.id).unwrap();
      await refetchAssignments();
      dispatch(notify({ msg: 'Policy assignment status updated.', sev: 'success' }));
      onSaved?.();
    } catch (error) {
      const errorMsg = extractErrorMessage(error) || 'Unable to update policy assignment status.';
      dispatch(notify({ msg: errorMsg, sev: 'error' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };
  const handleOpenEditPolicyAssignment = (assignment: PolicyAssignment) => {
    setSelectedPolicyAssignment(assignment);

    setEditPolicyAssignmentRequest({
      ...assignment,
      isRequired: assignment.isRequired ?? false,
    });

    setOpenEditModal(true);
  };
  const handleUpdatePolicyAssignment = async () => {
    if (!selectedPolicyAssignment?.id) {
      dispatch(
        notify({
          msg: 'Missing policy assignment id.',
          sev: 'warning',
        })
      );
      return;
    }

    const policyDefinitionId =
      (selectedPolicyAssignment as any).policy?.id;

    if (!policyDefinitionId) {
      dispatch(
        notify({
          msg: 'Missing policy definition id.',
          sev: 'warning',
        })
      );
      return;
    }

    try {
      dispatch(showSystemLoader());

      await updatePolicyAssignment({
        id: selectedPolicyAssignment.id,
        isRequired: editPolicyAssignmentRequest.isRequired ?? false,
      }).unwrap();

      setOpenEditModal(false);
      setSelectedPolicyAssignment(null);

      await refetchAssignments();

      dispatch(
        notify({
          msg: 'Policy assignment was successfully updated.',
          sev: 'success',
        })
      );

      onSaved?.();
    } catch (error) {
      const errorMsg =
        extractErrorMessage(error) || 'Unable to update policy assignment.';
      dispatch(
        notify({
          msg: errorMsg,
          sev: 'error',
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };
  const tableColumns = [
    {
      key: 'policyCode',
      title: <Translate>Policy Code</Translate>,
      render: (row: PolicyAssignment) => row.policy?.code ?? '-'
    },
    {
      key: 'policyName',
      title: <Translate>Policy Name</Translate>,
      render: (row: PolicyAssignment) => row.policy?.name ?? '-'
    },
    {
      key: 'isRequired',
      title: <Translate>Required</Translate>,
      render: (row: PolicyAssignment) => (row.isRequired ? 'Yes' : 'No')
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: (row: PolicyAssignment) => (row.isActive ? 'Active' : 'Inactive')
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      render: (row: PolicyAssignment) => {
        const disabled = isTogglingAssignment || isUpdatingAssignment;

        return (
          <div className="container-of-icons">
            <MdModeEdit
              className="icons-style"
              title="Edit"
              size={24}
              fill="var(--primary-gray)"
              style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
              onClick={() => {
                if (!disabled) {
                  handleOpenEditPolicyAssignment(row);
                }
              }}
            />

            {row.isActive ? (
              <MdDelete
                title="Deactivate"
                size={24}
                fill={disabled ? 'var(--rs-gray-400)' : 'var(--primary-pink)'}
                className="icons-style"
                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                onClick={() => {
                  if (!disabled) handleToggleActive(row);
                }}
              />
            ) : (
              <FontAwesomeIcon
                icon={faRotateRight}
                title="Activate"
                className="icons-style"
                color={disabled ? 'var(--rs-gray-400)' : 'var(--primary-gray)'}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                size="lg"
                onClick={() => {
                  if (!disabled) handleToggleActive(row);
                }}
              />
            )}
          </div>
        );
      },
    }
  ];

  return (
    <Panel>
      {showHeader && <h4 style={{ marginBottom: 16 }}>{title}</h4>}

      <MyTable
        data={assignments}
        columns={tableColumns}
        loading={isLoading}
        tableButtons={
          <MyButton
            prefixIcon={() => <span style={{ fontSize: 16 }}>+</span>}
            color="var(--deep-blue)"
            onClick={() => setOpenAssignModal(true)}
            width="140px"
          >
            Assign Policy
          </MyButton>
        }
      />
      <MyModal
        open={openEditModal}
        setOpen={setOpenEditModal}
        title="Edit Policy Assignment"
        bodyheight="30vh"
        size="35vw"
        hideBack
        content={
          <Form fluid>
            <MyInput
              fieldName="isRequired"
              fieldType="checkbox"
              record={editPolicyAssignmentRequest}
              setRecord={updated =>
                setEditPolicyAssignmentRequest({
                  ...editPolicyAssignmentRequest,
                  isRequired: updated.isRequired,
                })
              }
              showLabel
              label="Required"
            />
          </Form>
        }
        actionButtonLabel="Save"
        actionButtonFunction={handleUpdatePolicyAssignment}
        isDisabledActionBtn={isUpdatingAssignment}
      />
      <MyModal
        open={openAssignModal}
        setOpen={setOpenAssignModal}
        title="Assign Policy"
        bodyheight="40vh"
        size="40vw"
        hideBack
        content={
          <Form fluid>
            <MyInput
              fieldName="policyId"
              fieldLabel="Policy"
              fieldType="select"
              selectData={policySelectData}
              record={assignmentRequest}
              setRecord={updated => setAssignmentRequest({ ...assignmentRequest, policyId: updated.policyId })}
              selectDataLabel="label"
              selectDataValue="value"
              showLabel
              placeholder="Select policy"
              searchable
              required
            />
            <MyInput
              fieldName="isRequired"
              fieldType="checkbox"
              record={assignmentRequest}
              setRecord={updated => setAssignmentRequest({ ...assignmentRequest, isRequired: updated.isRequired })}
              showLabel
              label="Required"
            />
          </Form>
        }
        actionButtonLabel="Assign"
        actionButtonFunction={handleAssignPolicy}
        isDisabledActionBtn={isCreatingAssignment}
      />
    </Panel>
  );
};

export default PolicyAssignmentManager;
