import React, { useMemo } from 'react';
import { Col, Form, Row } from 'rsuite';
import { FaClipboardList } from 'react-icons/fa';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import {
  useAddPatientActivityMutation,
  useUpdatePatientActivityMutation
} from '@/services/patients/patientActivityService';
import type { PatientActivity } from '@/types/model-types-new';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetEncountersByPatientQuery } from '@/services/encounters/patientEncounterService';
import { useGetAppointmentsByPatientQuery } from '@/services/appointment/appointmentService';
import { useGetUsersBasicQuery } from '@/services/userService';
import { describeDueRule, dueFromRule, useActivityCatalog } from './activityCatalog';

export const emptyTaskForm = () => ({
  activityType: '',
  priority: 'NORMAL',
  note: '',
  dueAt: '',
  assignedRoles: [] as string[],
  assignedTo: '',
  encounterId: null as number | null,
  appointmentId: null as number | null
});

export type TaskForm = ReturnType<typeof emptyTaskForm>;

export const taskFormOf = (row: PatientActivity): TaskForm => ({
  activityType: row.activityType ?? '',
  priority: row.priority ?? 'NORMAL',
  note: row.note ?? '',
  dueAt: row.dueAt ?? '',
  assignedRoles: row.assignedRoles ?? [],
  assignedTo: row.assignedTo ?? '',
  encounterId: row.encounterId ?? null,
  appointmentId: row.appointmentId ?? null
});

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  patientId: number;
  activity: PatientActivity | null;
  form: TaskForm;
  setForm: (form: TaskForm) => void;
};

const toOptionalId = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const AddEditPatientActivity: React.FC<Props> = ({ open, setOpen, patientId, activity, form, setForm }) => {
  const dispatch = useAppDispatch();
  const isEdit = Boolean(activity?.id);
  const jobRole = useAppSelector(state => state.auth?.user?.jobRole) as string | undefined;
  const { templates, categoryName, templateByCode } = useActivityCatalog();
  const jobRoles = useEnumOptions('JobRole');
  const priorityOptions = useEnumOptions('PatientActivityPriority');
  const [addActivity, { isLoading: isAdding }] = useAddPatientActivityMutation();
  const [updateActivity, { isLoading: isUpdating }] = useUpdatePatientActivityMutation();
  const { data: encountersPage } = useGetEncountersByPatientQuery(
    { patientId, page: 0, size: 200, sort: 'createdDate,desc' },
    { skip: !open || !patientId }
  );
  const { data: appointmentsPage } = useGetAppointmentsByPatientQuery(
    { patientId, page: 0, size: 200, sort: 'startDatetime,desc' },
    { skip: !open || !patientId }
  );
  const { data: usersPage } = useGetUsersBasicQuery({ page: 0, size: 500, sort: 'firstName,asc' }, { skip: !open });

  const template = templateByCode.get(form.activityType);

  const typeOptions = useMemo(
    () =>
      templates
        .filter(t => t.kind === 'TASK')
        .filter(t => t.isActive || t.code === activity?.activityType)
        .filter(t => !t.creatorRoles?.length || (jobRole && t.creatorRoles.includes(jobRole)) || t.code === activity?.activityType)
        .map(t => ({ value: t.code, label: `${t.name} · ${categoryName(t.categoryCode)}` })),
    [templates, jobRole, activity?.activityType, categoryName]
  );

  const userOptions = useMemo(() => {
    const users = (usersPage?.data ?? []) as Array<{
      login: string;
      firstName?: string;
      lastName?: string;
      jobRole?: string;
      activated?: boolean;
    }>;
    const roles = form.assignedRoles ?? [];
    return [
      { value: '', label: 'Anyone in the team' },
      ...users
        .filter(u => u.activated !== false)
        .filter(u => !roles.length || !u.jobRole || roles.includes(u.jobRole) || u.login === form.assignedTo)
        .map(u => ({
          value: u.login,
          label: `${[u.firstName, u.lastName].filter(Boolean).join(' ') || u.login}${u.jobRole ? ` · ${formatEnumString(u.jobRole)}` : ''}`
        }))
    ];
  }, [usersPage, form.assignedRoles, form.assignedTo]);

  const encounterOptions = useMemo(() => {
    const options = (encountersPage?.data ?? []).map(row => {
      const encounterNumber = (row as { encounterNumber?: string | null }).encounterNumber;
      const label = [
        encounterNumber ? `#${encounterNumber}` : `Encounter ${row.id}`,
        formatEnumString(row.encounterType),
        formatDateWithoutSeconds(row.createdDate || row.encounterDate),
        formatEnumString(row.encounterStatus || '')
      ]
        .filter(Boolean)
        .join(' · ');
      return { value: row.id, label };
    });
    const selected = toOptionalId(form.encounterId);
    if (selected != null && !options.some(option => option.value === selected)) {
      options.unshift({ value: selected, label: `Encounter ${selected}` });
    }
    return [{ value: '', label: 'None' }, ...options];
  }, [encountersPage, form.encounterId]);

  const appointmentOptions = useMemo(() => {
    const options = (appointmentsPage?.data ?? []).map(row => {
      const label = [
        row.startDatetime ? formatDateWithoutSeconds(row.startDatetime) : `Appointment ${row.id}`,
        formatEnumString(row.status || ''),
        formatEnumString(row.service || '')
      ]
        .filter(Boolean)
        .join(' · ');
      return { value: row.id, label };
    });
    const selected = toOptionalId(form.appointmentId);
    if (selected != null && !options.some(option => option.value === selected)) {
      options.unshift({ value: selected, label: `Appointment ${selected}` });
    }
    return [{ value: '', label: 'None' }, ...options];
  }, [appointmentsPage, form.appointmentId]);

  const applyForm = (next: TaskForm | ((current: TaskForm) => TaskForm)) => {
    const resolved = { ...(typeof next === 'function' ? next(form) : next) };
    if (resolved.activityType !== form.activityType) {
      const picked = templateByCode.get(resolved.activityType);
      if (picked) {
        resolved.priority = picked.defaultPriority ?? 'NORMAL';
        resolved.assignedRoles = [...(picked.assigneeRoles ?? [])];
        if (!isEdit || !resolved.dueAt) resolved.dueAt = dueFromRule(picked) || resolved.dueAt;
      }
    }
    setForm(resolved);
  };

  const handleSave = async () => {
    if (!form.activityType) {
      dispatch(notify({ msg: 'Pick what needs to be done', sev: 'warning' }));
      return;
    }
    if (!String(form.note ?? '').trim()) {
      dispatch(notify({ msg: 'Note is required', sev: 'warning' }));
      return;
    }
    if (!form.dueAt) {
      dispatch(notify({ msg: 'Due date is required', sev: 'warning' }));
      return;
    }

    const body = {
      activityType: form.activityType,
      priority: form.priority || 'NORMAL',
      note: form.note.trim(),
      dueAt: form.dueAt,
      assignedRoles: form.assignedRoles ?? [],
      assignedTo: form.assignedTo || null,
      encounterId: toOptionalId(form.encounterId),
      appointmentId: toOptionalId(form.appointmentId)
    };

    try {
      if (isEdit && activity?.id) {
        await updateActivity({ id: activity.id, patientId, body }).unwrap();
        dispatch(notify({ msg: 'Task updated', sev: 'success' }));
      } else {
        await addActivity({ patientId, status: 'OPEN', ...body }).unwrap();
        dispatch(notify({ msg: 'Task added', sev: 'success' }));
      }
      setOpen(false);
    } catch (error) {
      dispatch(notify({ msg: extractApiErrorMessage(error) || 'Failed to save task', sev: 'warning' }));
    }
  };

  const dueRule = describeDueRule(template);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={isEdit ? 'Edit Task' : 'New Task'}
      icon={<FaClipboardList />}
      size="60vw"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      actionButtonLoading={isAdding || isUpdating}
      content={
        <Form fluid>
          <Row>
            <Col md={16}>
              <MyInput
                width="100%"
                fieldType="select"
                fieldName="activityType"
                fieldLabel="Task"
                selectData={typeOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={form}
                setRecord={applyForm}
                required
              />
            </Col>
            <Col md={8}>
              <MyInput
                width="100%"
                fieldType="select"
                fieldName="priority"
                fieldLabel="Priority"
                selectData={priorityOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={form}
                setRecord={applyForm}
                searchable={false}
              />
            </Col>
          </Row>
          {template?.description && <p className="patient-activity-form-hint">{template.description}</p>}
          <Row>
            <Col md={8}>
              <MyInput
                width="100%"
                fieldType="datetime"
                fieldName="dueAt"
                fieldLabel="Due"
                record={form}
                setRecord={applyForm}
                required
              />
            </Col>
            <Col md={8}>
              <MyInput
                width="100%"
                fieldType="checkPicker"
                fieldName="assignedRoles"
                fieldLabel="Team"
                selectData={jobRoles}
                selectDataLabel="label"
                selectDataValue="value"
                record={form}
                setRecord={applyForm}
              />
            </Col>
            <Col md={8}>
              <MyInput
                width="100%"
                fieldType="select"
                fieldName="assignedTo"
                fieldLabel="Assigned To"
                selectData={userOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={form}
                setRecord={applyForm}
              />
            </Col>
          </Row>
          {dueRule && !isEdit && (
            <p className="patient-activity-form-hint">
              <Translate>{`Due date set from the setup: ${dueRule} from now.`}</Translate>
            </p>
          )}
          <Row>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldType="select"
                fieldName="encounterId"
                fieldLabel="Encounter"
                selectData={encounterOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={form}
                setRecord={applyForm}
                searchable
              />
            </Col>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldType="select"
                fieldName="appointmentId"
                fieldLabel="Appointment"
                selectData={appointmentOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={form}
                setRecord={applyForm}
                searchable
              />
            </Col>
          </Row>
          {template?.checklist?.length ? (
            <div className="patient-activity-form-checklist">
              <span><Translate>Checklist</Translate></span>
              <ul>
                {template.checklist.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <MyInput
            width="100%"
            fieldType="textarea"
            fieldName="note"
            fieldLabel="Note"
            record={form}
            setRecord={applyForm}
            required
          />
        </Form>
      }
    />
  );
};

export default AddEditPatientActivity;
