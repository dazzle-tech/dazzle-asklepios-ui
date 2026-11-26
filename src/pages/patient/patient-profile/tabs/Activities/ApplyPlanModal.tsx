import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Form } from 'rsuite';
import { MdOutlineAccountTree } from 'react-icons/md';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import { formatEnumString } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetUsersBasicQuery } from '@/services/userService';
import {
  useApplyActivityPlanMutation,
  useGetActivityPlansQuery
} from '@/services/patients/patientActivityService';
import type { ActivityPlan } from '@/types/model-types-new';
import { dueFromRule, useActivityCatalog } from './activityCatalog';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  patientId: number;
};

type PreviewRow = {
  include: boolean;
  activityType: string;
  dueAt: string;
  priority: string;
  assignedRoles: string[];
  assignedTo: string;
  note: string;
};

type BasicUser = { login: string; firstName?: string; lastName?: string; jobRole?: string; activated?: boolean };

/** Rows the user confirms before applying: the plan items with their dates worked out from now. */
const previewOf = (plan: ActivityPlan | undefined, catalog: ReturnType<typeof useActivityCatalog>): PreviewRow[] =>
  (plan?.items ?? []).map(item => {
    const template = catalog.templateByCode.get(item.templateCode);
    const ownRule = item.dueOffset != null && item.dueUnit;
    return {
      include: true,
      activityType: item.templateCode,
      dueAt: ownRule ? dueFromRule(item) : dueFromRule(template),
      priority: template?.defaultPriority || 'NORMAL',
      assignedRoles: template?.assigneeRoles ?? [],
      assignedTo: '',
      note: item.note || ''
    };
  });

const ApplyPlanModal: React.FC<Props> = ({ open, setOpen, patientId }) => {
  const dispatch = useAppDispatch();
  const catalog = useActivityCatalog();
  const priorityOptions = useEnumOptions('PatientActivityPriority');
  const { data: plans = [] } = useGetActivityPlansQuery(undefined, { skip: !open });
  const { data: usersPage } = useGetUsersBasicQuery({ page: 0, size: 500, sort: 'firstName,asc' }, { skip: !open });
  const [applyPlan, { isLoading }] = useApplyActivityPlanMutation();

  const [choice, setChoice] = useState({ planCode: '' });
  const [rows, setRows] = useState<PreviewRow[]>([]);

  const activePlans = useMemo(() => plans.filter(p => p.isActive), [plans]);
  const plan = activePlans.find(p => p.code === choice.planCode);

  useEffect(() => {
    if (open) {
      setChoice({ planCode: '' });
      setRows([]);
    }
  }, [open]);

  useEffect(() => {
    setRows(previewOf(plan, catalog));
    // Rebuild the preview only when another plan is picked, not on every catalog refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.code]);

  const users = (usersPage?.data ?? []) as BasicUser[];
  const userOptionsFor = (roles: string[]) => [
    { value: '', label: 'Anyone in the team' },
    ...users
      .filter(u => u.activated !== false)
      .filter(u => !roles.length || !u.jobRole || roles.includes(u.jobRole))
      .map(u => ({
        value: u.login,
        label: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.login
      }))
  ];

  const setRow = (index: number, next: Partial<PreviewRow>) =>
    setRows(current => current.map((row, i) => (i === index ? { ...row, ...next } : row)));

  const included = rows.filter(row => row.include);

  const handleApply = async () => {
    if (!plan) {
      dispatch(notify({ msg: 'Pick a plan', sev: 'warning' }));
      return;
    }
    if (!included.length) {
      dispatch(notify({ msg: 'Keep at least one task', sev: 'warning' }));
      return;
    }
    if (included.some(row => !row.dueAt)) {
      dispatch(notify({ msg: 'Every task needs a due date', sev: 'warning' }));
      return;
    }
    try {
      const created = await applyPlan({
        patientId,
        planCode: plan.code,
        items: included.map(row => ({
          activityType: row.activityType,
          dueAt: row.dueAt,
          priority: row.priority,
          assignedRoles: row.assignedRoles,
          assignedTo: row.assignedTo || null,
          note: row.note.trim() || null
        }))
      }).unwrap();
      dispatch(notify({ msg: `${plan.name}: ${created.length} tasks added`, sev: 'success' }));
      setOpen(false);
    } catch (error) {
      dispatch(notify({ msg: extractApiErrorMessage(error) || 'Failed to apply the plan', sev: 'warning' }));
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Apply Task Plan"
      icon={<MdOutlineAccountTree />}
      size="75vw"
      actionButtonLabel={included.length ? `Add ${included.length} Tasks` : 'Apply'}
      actionButtonFunction={handleApply}
      actionButtonLoading={isLoading}
      content={
        <Form fluid>
          <MyInput
            width="100%"
            fieldType="select"
            fieldName="planCode"
            fieldLabel="Plan"
            selectData={activePlans.map(p => ({ value: p.code, label: `${p.name} (${p.items.length} tasks)` }))}
            selectDataLabel="label"
            selectDataValue="value"
            record={choice}
            setRecord={setChoice}
            required
          />
          {plan?.description && <p className="patient-activity-form-hint">{plan.description}</p>}
          {!activePlans.length && (
            <p className="patient-activity-form-hint">
              <Translate>No active task plans yet. Add one in Tasks and Activities Setup.</Translate>
            </p>
          )}

          {rows.length > 0 && (
            <div className="patient-plan-preview">
              <div className="patient-plan-preview-head">
                <span />
                <span><Translate>Task</Translate></span>
                <span><Translate>Due</Translate></span>
                <span><Translate>Priority</Translate></span>
                <span><Translate>Assigned To</Translate></span>
                <span><Translate>Note</Translate></span>
              </div>
              {rows.map((row, index) => (
                <div key={`${row.activityType}-${index}`} className={`patient-plan-preview-row${row.include ? '' : ' excluded'}`}>
                  <Checkbox
                    checked={row.include}
                    onChange={(_, checked) => setRow(index, { include: checked })}
                    title={row.include ? 'Leave this task out' : 'Add this task'}
                  />
                  <div>
                    <div className="patient-plan-preview-name">{catalog.templateName(row.activityType)}</div>
                    <div className="patient-plan-preview-team">
                      {row.assignedRoles.map(formatEnumString).join(', ') || '—'}
                    </div>
                  </div>
                  <MyInput
                    width="100%"
                    fieldType="datetime"
                    fieldName="dueAt"
                    showLabel={false}
                    record={row}
                    setRecord={(next: PreviewRow) => setRow(index, { dueAt: next.dueAt })}
                    disabled={!row.include}
                  />
                  <MyInput
                    width="100%"
                    fieldType="select"
                    fieldName="priority"
                    showLabel={false}
                    selectData={priorityOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={row}
                    setRecord={(next: PreviewRow) => setRow(index, { priority: next.priority })}
                    searchable={false}
                    disabled={!row.include}
                  />
                  <MyInput
                    width="100%"
                    fieldType="select"
                    fieldName="assignedTo"
                    showLabel={false}
                    selectData={userOptionsFor(row.assignedRoles)}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={row}
                    setRecord={(next: PreviewRow) => setRow(index, { assignedTo: next.assignedTo })}
                    disabled={!row.include}
                  />
                  <MyInput
                    width="100%"
                    fieldName="note"
                    showLabel={false}
                    placeholder="Optional"
                    record={row}
                    setRecord={(next: PreviewRow) => setRow(index, { note: next.note })}
                    disabled={!row.include}
                  />
                </div>
              ))}
            </div>
          )}
        </Form>
      }
    />
  );
};

export default ApplyPlanModal;
