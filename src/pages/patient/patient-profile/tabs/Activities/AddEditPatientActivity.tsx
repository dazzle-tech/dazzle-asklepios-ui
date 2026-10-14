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
  useGetPatientActivityCatalogQuery,
  useUpdatePatientActivityMutation
} from '@/services/patients/patientActivityService';
import type { PatientActivity } from '@/types/model-types-new';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { useGetEncountersByPatientQuery } from '@/services/encounters/patientEncounterService';
import { useGetAppointmentsByPatientQuery } from '@/services/appointment/appointmentService';
import { emptyPatientActivityForm } from './activityCatalog';

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

const toDueAt = (value: string): string | null => {
  const date = value?.trim();
  if (!date) return null;
  if (date.includes('T')) return date;
  return `${date}T00:00:00Z`;
};

const toSelectOptions = (values: string[]) =>
  values.map(value => ({ value, label: formatEnumString(value) }));

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
  const { data: catalog } = useGetPatientActivityCatalogQuery();
  const { data: encountersPage } = useGetEncountersByPatientQuery(
    { patientId, page: 0, size: 200, sort: 'createdDate,desc' },
    { skip: !open || !patientId }
  );
  const { data: appointmentsPage } = useGetAppointmentsByPatientQuery(
    { patientId, page: 0, size: 200, sort: 'startDatetime,desc' },
    { skip: !open || !patientId }
  );

  const categoryOptions = useMemo(
    () => toSelectOptions(catalog?.categories ?? []),
    [catalog?.categories]
  );
  const typeOptions = useMemo(
    () =>
      toSelectOptions(
        (catalog?.types ?? [])
          .filter(type => type.category === form.category)
          .map(type => type.value)
      ),
    [catalog?.types, form.category]
  );
  const statusOptions = useMemo(() => {
    if (isEdit) return toSelectOptions(form.status ? [form.status] : []);
    return toSelectOptions(catalog?.creatableStatuses ?? []);
  }, [catalog?.creatableStatuses, form.status, isEdit]);
  const priorityOptions = useMemo(
    () => toSelectOptions(catalog?.priorities ?? []),
    [catalog?.priorities]
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
    const categoryChanged = resolved.category !== form.category;
    const typeChanged = resolved.activityType !== form.activityType;
    const nextForm = { ...resolved };

    if (categoryChanged) {
      const stillValid = (catalog?.types ?? []).some(
        type => type.category === nextForm.category && type.value === nextForm.activityType
      );
      if (!stillValid) nextForm.activityType = '';
    }

    if (typeChanged && nextForm.activityType) {
      const selectedType = (catalog?.types ?? []).find(type => type.value === nextForm.activityType);
      if (selectedType) {
        nextForm.priority = selectedType.defaultPriority;
        if (!isEdit) nextForm.status = selectedType.defaultStatus;
      }
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
                selectData={categoryOptions}
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
                selectData={typeOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={form}
                setRecord={applyForm}
                required
                disabled={!form.category}
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
