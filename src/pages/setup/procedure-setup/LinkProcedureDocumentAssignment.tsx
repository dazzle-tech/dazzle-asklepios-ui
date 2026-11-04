import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete, MdDescription, MdToggleOff, MdToggleOn } from 'react-icons/md';
import './styles.less';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import ChildModal from '@/components/ChildModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import { formatEnumString } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetProceduresQuery } from '@/services/setup/procedure/procedureService';
import {
  useCreateDocumentAssignmentMutation,
  useDeleteDocumentAssignmentMutation,
  useSearchDocumentAssignmentsQuery,
  useSearchDocumentsQuery,
  useToggleDocumentAssignmentActiveMutation,
  type DocumentAssignmentDTO,
  type DocumentAssignmentResponseVM
} from '@/services/patients/documentManagementService';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  defaultProcedureId?: number | null;
};

type FormState = {
  documentId?: number | null;
  targetIds: number[];
  triggerType?: string;
  required: boolean;
  blocking: boolean;
  active: boolean;
};

const defaultProcedureTargetType = 'PROCEDURE';

const emptyForm = (defaultProcedureId?: number | null): FormState => ({
  documentId: null,
  targetIds: defaultProcedureId ? [Number(defaultProcedureId)] : [],
  triggerType: undefined,
  required: true,
  blocking: false,
  active: true
});

const toNumberOrNull = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const LinkProcedureDocumentAssignment: React.FC<Props> = ({
  open,
  setOpen,
  defaultProcedureId = null
}) => {
  const dispatch = useAppDispatch();
  const [openChildModal, setOpenChildModal] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<DocumentAssignmentResponseVM | null>(null);
  const [formItem, setFormItem] = useState<FormState>(() => emptyForm(defaultProcedureId));
  const [viewProcedureId, setViewProcedureId] = useState<number | null>(defaultProcedureId);

  const triggerTypeOptions = useEnumOptions('DocumentTriggerType');
  const targetTypeOptions = useEnumOptions('DocumentTargetType');
  const procedureTargetType = useMemo(() => {
    const exact = targetTypeOptions.find(option => option.value.toUpperCase() === 'PROCEDURE');
    if (exact) return exact.value;
    return (
      targetTypeOptions.find(option => /PROCEDURE/i.test(option.value))?.value ??
      defaultProcedureTargetType
    );
  }, [targetTypeOptions]);

  const procedureTargetTypeOptions = useMemo(
    () => targetTypeOptions.filter(option => option.value === procedureTargetType),
    [targetTypeOptions, procedureTargetType]
  );

  const {
    data: assignments = [],
    isFetching: isLoadingAssignments,
    refetch: refetchAssignments
  } = useSearchDocumentAssignmentsQuery(
    {
      targetType: procedureTargetType,
      ...(viewProcedureId != null ? { targetId: viewProcedureId } : {})
    },
    { skip: !open }
  );

  const { data: documentsPage, isFetching: isLoadingDocuments } = useSearchDocumentsQuery(
    { status: 'ACTIVE', page: 0, size: 200, sort: 'name,asc' },
    { skip: !openChildModal }
  );

  const { data: proceduresPage, isFetching: isLoadingProcedures } = useGetProceduresQuery(
    { page: 0, size: 10000, sort: 'name,asc' },
    { skip: !open }
  );

  const [createAssignment] = useCreateDocumentAssignmentMutation();
  const [deleteAssignment, { isLoading: isDeleting }] = useDeleteDocumentAssignmentMutation();
  const [toggleAssignmentActive, { isLoading: isToggling }] =
    useToggleDocumentAssignmentActiveMutation();
  const [busyAssignmentId, setBusyAssignmentId] = useState<number | null>(null);

  const documents = documentsPage?.data ?? [];
  const documentOptions = useMemo(
    () =>
      documents.map(document => ({
        value: document.id,
        label: `${document.code ? `${document.code} - ` : ''}${document.name}`
      })),
    [documents]
  );

  const procedureOptions = useMemo(
    () =>
      (proceduresPage?.data ?? []).map((item: any) => ({
        value: item.id,
        label: `${item.code ? `${item.code} - ` : ''}${item.name ?? item.id}`
      })),
    [proceduresPage]
  );

  const procedureNameById = useMemo(() => {
    const map = new Map<number, string>();
    (proceduresPage?.data ?? []).forEach((item: any) => {
      if (item?.id != null) {
        map.set(
          Number(item.id),
          `${item.code ? `${item.code} - ` : ''}${item.name ?? item.id}`
        );
      }
    });
    return map;
  }, [proceduresPage]);

  const viewProcedureOptions = useMemo(
    () => [{ value: '', label: 'All procedures (general)' }, ...procedureOptions],
    [procedureOptions]
  );

  useEffect(() => {
    if (!open) {
      setOpenChildModal(false);
      setFormItem(emptyForm(defaultProcedureId));
      setViewProcedureId(defaultProcedureId ?? null);
      return;
    }
    setViewProcedureId(defaultProcedureId ?? null);
  }, [open, defaultProcedureId]);

  const columns: ColumnConfig[] = [
    { key: 'documentCode', title: <Translate>Code</Translate> },
    { key: 'documentName', title: <Translate>Document</Translate> },
    {
      key: 'documentVersion',
      title: <Translate>Version</Translate>,
      render: (row: DocumentAssignmentResponseVM) => {
        const version =
          typeof row.documentVersion === 'object' && row.documentVersion != null
            ? row.documentVersion.version
            : row.documentVersion;
        return version != null ? `v${version}` : '-';
      }
    },
    {
      key: 'assignmentScope',
      title: <Translate>Scope</Translate>,
      render: (row: DocumentAssignmentResponseVM) =>
        row.targetId == null ? (
          <MyBadgeStatus contant="General" color="#d32f2f" />
        ) : (
          <MyBadgeStatus contant="Specific" color="#2264e5" />
        )
    },
    {
      key: 'targetId',
      title: <Translate>Procedure</Translate>,
      render: (row: DocumentAssignmentResponseVM) =>
        row.targetId != null
          ? procedureNameById.get(Number(row.targetId)) ?? String(row.targetId)
          : '-'
    },
    {
      key: 'trigger',
      title: <Translate>Trigger</Translate>,
      render: (row: DocumentAssignmentResponseVM) =>
        formatEnumString(row.trigger ?? (row.triggerType as string)) ||
        row.trigger ||
        row.triggerType ||
        '-'
    },
    {
      key: 'required',
      title: <Translate>Required</Translate>,
      render: (row: DocumentAssignmentResponseVM) => (row.required ? 'Yes' : 'No')
    },
    {
      key: 'blocking',
      title: <Translate>Blocking</Translate>,
      render: (row: DocumentAssignmentResponseVM) => (row.blocking ? 'Yes' : 'No')
    },
    {
      key: 'active',
      title: <Translate>Active</Translate>,
      render: (row: DocumentAssignmentResponseVM) => (
        <MyBadgeStatus
          color={row.active === false ? '#969fb0' : '#45b887'}
          contant={row.active === false ? 'Inactive' : 'Active'}
        />
      )
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      width: 110,
      align: 'right' as const,
      render: (row: DocumentAssignmentResponseVM) => {
        const isBusy = busyAssignmentId === row.id || isDeleting || isToggling;
        const isActive = row.active !== false;

        return (
          <div className="container-of-icons">
            {isActive ? (
              <MdToggleOn
                className="icons-style"
                title="Deactivate"
                size={28}
                fill="var(--deep-blue)"
                style={{ cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.6 : 1 }}
                onClick={() => {
                  if (!isBusy) handleToggleActive(row);
                }}
              />
            ) : (
              <MdToggleOff
                className="icons-style"
                title="Activate"
                size={28}
                fill="var(--primary-gray)"
                style={{ cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.6 : 1 }}
                onClick={() => {
                  if (!isBusy) handleToggleActive(row);
                }}
              />
            )}
            <MdDelete
              className="icons-style"
              title="Delete"
              size={22}
              fill="var(--primary-pink)"
              style={{ cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.6 : 1 }}
              onClick={() => {
                if (isBusy) return;
                setAssignmentToDelete(row);
                setOpenConfirmDelete(true);
              }}
            />
          </div>
        );
      }
    }
  ];

  const openCreate = () => {
    setFormItem(emptyForm(defaultProcedureId));
    setOpenChildModal(true);
  };

  const handleToggleActive = async (row: DocumentAssignmentResponseVM) => {
    if (!row?.id) return;

    try {
      setBusyAssignmentId(row.id);
      await toggleAssignmentActive(row.id).unwrap();
      dispatch(
        notify({
          msg:
            row.active === false
              ? 'Assignment activated successfully'
              : 'Assignment deactivated successfully',
          sev: 'success'
        })
      );
      await refetchAssignments();
    } catch (error) {
      dispatch(
        notify({
          msg: extractApiErrorMessage(error) || 'Failed to update assignment status',
          sev: 'warning'
        })
      );
    } finally {
      setBusyAssignmentId(null);
    }
  };

  const handleDelete = async () => {
    if (!assignmentToDelete?.id) return;

    try {
      await deleteAssignment(assignmentToDelete.id).unwrap();
      dispatch(notify({ msg: 'Assignment deleted successfully', sev: 'success' }));
      await refetchAssignments();
    } catch (error) {
      dispatch(
        notify({
          msg: extractApiErrorMessage(error) || 'Failed to delete assignment',
          sev: 'warning'
        })
      );
    } finally {
      setOpenConfirmDelete(false);
      setAssignmentToDelete(null);
    }
  };

  const buildPayload = (targetId?: number | null): DocumentAssignmentDTO => ({
    targetType: procedureTargetType,
    ...(targetId != null ? { targetId } : {}),
    triggerType: formItem.triggerType!,
    required: Boolean(formItem.required),
    blocking: Boolean(formItem.blocking),
    active: formItem.active != null ? Boolean(formItem.active) : true
  });

  const handleSave = async () => {
    if (!procedureTargetType) {
      dispatch(notify({ msg: 'Target Type is required', sev: 'warning' }));
      return;
    }

    if (!formItem.triggerType) {
      dispatch(notify({ msg: 'Trigger Type is required', sev: 'warning' }));
      return;
    }

    const documentId = toNumberOrNull(formItem.documentId);
    if (!documentId) {
      dispatch(notify({ msg: 'Please select a document first.', sev: 'warning' }));
      return;
    }

    const selectedDocument = documents.find(document => document.id === documentId);
    if (!selectedDocument?.activeVersion) {
      dispatch(notify({ msg: 'Selected document has no active version', sev: 'warning' }));
      return;
    }

    const targetIds = (formItem.targetIds ?? [])
      .map(id => Number(id))
      .filter(id => Number.isFinite(id));

    const assignmentTargets = targetIds.length > 0 ? targetIds : [null];

    try {
      await Promise.all(
        assignmentTargets.map(targetId =>
          createAssignment({ id: documentId, body: buildPayload(targetId) }).unwrap()
        )
      );

      dispatch(
        notify({
          msg:
            targetIds.length > 1
              ? `Document assigned to ${targetIds.length} procedures successfully`
              : 'Document assigned successfully',
          sev: 'success'
        })
      );
      setFormItem(emptyForm(defaultProcedureId));
      setOpenChildModal(false);
      await refetchAssignments();
    } catch (error) {
      dispatch(
        notify({
          msg: extractApiErrorMessage(error) || 'Failed to assign document',
          sev: 'warning'
        })
      );
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const mainContent = (
    <div dir={dir}>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={openCreate}
          width="180px"
        >
          <Translate>Link Assignment</Translate>
        </MyButton>
      </div>

      <Form fluid className="document-assignment-filter">
        <MyInput
          width="100%"
          fieldName="viewProcedureId"
          fieldLabel="Filter By Procedure"
          fieldType="select"
          selectData={viewProcedureOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={{ viewProcedureId: viewProcedureId ?? '' }}
          setRecord={(record: { viewProcedureId: number | string }) => {
            const next = record.viewProcedureId;
            setViewProcedureId(next === '' || next == null ? null : Number(next));
          }}
          searchable
          placeholder="All procedures (general)"
        />
      </Form>

      <p className="document-version-hint">
        <Translate>
          {viewProcedureId
            ? 'Showing documents assigned to the selected procedure.'
            : 'Showing general documents assigned to all procedures.'}
        </Translate>
      </p>

      <MyTable
        height={400}
        loading={isLoadingAssignments}
        data={assignments}
        columns={columns}
      />
    </div>
  );

  const childContent = (
    <Form fluid dir={dir}>
      <div style={{ display: 'grid', gap: 12 }}>
        <MyInput
          required
          width="100%"
          fieldName="documentId"
          fieldLabel="Document"
          fieldType="select"
          selectData={documentOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={formItem}
          setRecord={setFormItem}
          loading={isLoadingDocuments}
          placeholder={isLoadingDocuments ? 'Loading...' : 'Select Document'}
        />
        <MyInput
          required
          width="100%"
          fieldName="targetType"
          fieldLabel="Target Type"
          fieldType="select"
          selectData={procedureTargetTypeOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={{ targetType: procedureTargetType }}
          setRecord={() => {}}
          searchable={false}
          disabled
        />
        <MyInput
          width="100%"
          fieldName="targetIds"
          fieldLabel="Procedures"
          fieldType="multyPicker"
          selectData={procedureOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={formItem}
          setRecord={setFormItem}
          loading={isLoadingProcedures}
          searchable
          menuMaxHeight={250}
          placeholder={isLoadingProcedures ? 'Loading procedures...' : 'Select procedures'}
        />
        <MyInput
          required
          width="100%"
          fieldName="triggerType"
          fieldLabel="Trigger Type"
          fieldType="select"
          selectData={triggerTypeOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={formItem}
          setRecord={setFormItem}
          searchable={false}
          placeholder="Select Trigger Type"
        />
        <MyInput
          width="100%"
          fieldName="required"
          fieldLabel="Required"
          fieldType="checkbox"
          record={formItem}
          setRecord={setFormItem}
        />
        <MyInput
          width="100%"
          fieldName="blocking"
          fieldLabel="Blocking"
          fieldType="checkbox"
          record={formItem}
          setRecord={setFormItem}
        />
        <MyInput
          width="100%"
          fieldName="active"
          fieldLabel="Active"
          fieldType="checkbox"
          record={formItem}
          setRecord={setFormItem}
        />
      </div>
    </Form>
  );

  return (
    <>
      <ChildModal
        open={open}
        setOpen={setOpen}
        showChild={openChildModal}
        setShowChild={setOpenChildModal}
        title="Linked Documents"
        mainContent={mainContent}
        hideActionBtn
        childTitle="Link Document Assignment"
        childContent={childContent}
        actionChildButtonFunction={handleSave}
        actionChildButtonLabel="Assign"
        mainSize="md"
        childSize="sm"
        mainStep={[{ title: 'Linked Documents', icon: <MdDescription /> }]}
        childStep={[{ title: 'Assignment', icon: <MdDescription /> }]}
      />

      <DeletionConfirmationModal
        open={openConfirmDelete}
        setOpen={setOpenConfirmDelete}
        itemToDelete="document assignment"
        actionButtonFunction={handleDelete}
        actionType="delete"
      />
    </>
  );
};

export default LinkProcedureDocumentAssignment;
