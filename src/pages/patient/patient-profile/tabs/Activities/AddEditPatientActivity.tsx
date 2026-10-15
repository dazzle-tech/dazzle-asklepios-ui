import React, { useMemo } from 'react';
import { Col, Form, Row } from 'rsuite';
import { FaClipboardList } from 'react-icons/fa';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { useAppDispatch } from '@/hooks';
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
import {
  defaultActivityPriority,
  defaultActivityStatus,
  emptyPatientActivityForm
} from './activityCatalog';

type ActivityForm = ReturnType<typeof emptyPatientActivityForm>;

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  patientId: number;
  activity: PatientActivity | null;
  form: ActivityForm;
  setForm: (form: ActivityForm) => void;
};

const toOptionalId = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const CREATE_STATUS_EXCLUDE = ['CANCELLED'];

const toDueAt = (value: string): string | null => {
  const date = value?.trim();
  if (!date) return null;
  if (date.includes('T')) return date;
  return `${date}T00:00:00Z`;
};

const AddEditPatientActivity: React.FC<Props> = ({
  open,
  setOpen,
  patientId,
  activity,
  form,
  setForm
}) => {
  const dispatch = useAppDispatch();
  const isEdit = Boolean(activity?.id);
  const [addActivity, { isLoading: isAdding }] = useAddPatientActivityMutation();
  const [updateActivity, { isLoading: isUpdating }] = useUpdatePatientActivityMutation();
  const categoryOptions = useEnumOptions('PatientActivityCategory');
  const typeOptions = useEnumOptions('PatientActivityType');
  const statusOptions = useEnumOptions(
    'PatientActivityStatus',
    isEdit ? undefined : { exclude: CREATE_STATUS_EXCLUDE }
  );
  const priorityOptions = useEnumOptions('PatientActivityPriority');
  const { data: encountersPage } = useGetEncountersByPatientQuery(
    { patientId, page: 0, size: 200, sort: 'createdDate,desc' },
    { skip: !open || !patientId }
  );
  const { data: appointmentsPage } = useGetAppointmentsByPatientQuery(
    { patientId, page: 0, size: 200, sort: 'startDatetime,desc' },
    { skip: !open || !patientId }
  );

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

  const applyForm = (next: ActivityForm | ((current: ActivityForm) => ActivityForm)) => {
    const resolved = typeof next === 'function' ? next(form) : next;
    const typeChanged = resolved.activityType !== form.activityType;
    const nextForm = { ...resolved };

    if (typeChanged && nextForm.activityType) {
      nextForm.priority = defaultActivityPriority(nextForm.activityType);
      if (!isEdit) nextForm.status = defaultActivityStatus(nextForm.activityType);
    }

    setForm(nextForm);
  };

  const handleSave = async () => {
    if (!form.category || !form.activityType) {
      dispatch(notify({ msg: 'Category and activity type are required', sev: 'warning' }));
      return;
    }
    if (!String(form.note ?? '').trim()) {
      dispatch(notify({ msg: 'Note is required', sev: 'warning' }));
      return;
    }
    if (form.status === 'OPEN' && !form.dueAt) {
      dispatch(notify({ msg: 'Due date is required for an open activity', sev: 'warning' }));
      return;
    }

    const encounterId = toOptionalId(form.encounterId);
    const appointmentId = toOptionalId(form.appointmentId);
    if (form.encounterId && encounterId == null) {
      dispatch(notify({ msg: 'Encounter id is invalid', sev: 'warning' }));
      return;
    }
    if (form.appointmentId && appointmentId == null) {
      dispatch(notify({ msg: 'Appointment id is invalid', sev: 'warning' }));
      return;
    }

    const dueAt = form.status === 'OPEN' ? toDueAt(form.dueAt) : toDueAt(form.dueAt);

    try {
      if (isEdit && activity?.id) {
        await updateActivity({
          id: activity.id,
          patientId,
          body: {
            category: form.category,
            activityType: form.activityType,
            priority: form.priority || 'NORMAL',
            note: form.note.trim(),
            dueAt,
            encounterId,
            appointmentId
          }
        }).unwrap();
        dispatch(notify({ msg: 'Activity updated', sev: 'success' }));
      } else {
        await addActivity({
          patientId,
          category: form.category,
          activityType: form.activityType,
          status: form.status || 'OPEN',
          priority: form.priority || 'NORMAL',
          note: form.note.trim(),
          dueAt: form.status === 'OPEN' ? dueAt : null,
          encounterId,
          appointmentId
        }).unwrap();
        dispatch(notify({ msg: 'Activity added', sev: 'success' }));
      }
      setOpen(false);
    } catch (error) {
      dispatch(
        notify({
          msg: extractApiErrorMessage(error) || 'Failed to save activity',
          sev: 'warning'
        })
      );
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={isEdit ? 'Edit Activity' : 'Add Activity'}
      icon={<FaClipboardList />}
      size="60vw"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      actionButtonLoading={isAdding || isUpdating}
      content={
        <Form fluid>
          <Row>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldType="select"
                fieldName="category"
                fieldLabel="Category"
                isEnum
                selectData={categoryOptions ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={form}
                setRecord={applyForm}
                required
              />
            </Col>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldType="select"
                fieldName="activityType"
                fieldLabel="Activity"
                isEnum
                selectData={typeOptions ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={form}
                setRecord={applyForm}
                required
              />
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <MyInput
                width="100%"
                fieldType="select"
                fieldName="status"
                fieldLabel="Status"
                selectData={statusOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={form}
                setRecord={applyForm}
                disabled={isEdit}
                required
              />
            </Col>
            <Col md={6}>
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
              />
            </Col>
            {form.status === 'OPEN' && (
              <Col md={6}>
                <MyInput
                  width="100%"
                  fieldType="date"
                  fieldName="dueAt"
                  fieldLabel="Due Date"
                  record={form}
                  setRecord={applyForm}
                  required
                />
              </Col>
            )}
          </Row>
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
