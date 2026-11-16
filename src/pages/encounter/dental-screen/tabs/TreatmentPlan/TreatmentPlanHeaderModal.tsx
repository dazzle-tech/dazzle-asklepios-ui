import React from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';

const practitionerLabel = (practitioner: any) =>
  [practitioner?.firstName, practitioner?.secondName, practitioner?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim() || practitioner?.name || '';

const TreatmentPlanHeaderModal = ({
  open,
  setOpen,
  form,
  setForm,
  practitioners,
  saving,
  onSave
}) => (
  <MyModal
    open={open}
    setOpen={setOpen}
    title={<Translate>{form?.id ? 'Edit Treatment Plan' : 'New Treatment Plan'}</Translate>}
    size="480px"
    bodyheight="auto"
    actionButtonLabel="Save"
    actionButtonLoading={saving}
    isDisabledActionBtn={saving}
    actionButtonFunction={onSave}
    content={
    <Form fluid>
      <MyInput
        width="100%"
        fieldName="title"
        fieldLabel="Title"
        fieldType="text"
        record={form}
        setRecord={setForm}
        required
      />
      <MyInput
        width="100%"
        fieldName="practitionerId"
        fieldLabel="Responsible Practitioner"
        fieldType="select"
        selectData={practitioners}
        selectDataLabel="label"
        selectDataValue="id"
        record={form}
        setRecord={setForm}
        searchable
      />
      <MyInput
        width="100%"
        height={90}
        fieldName="notes"
        fieldLabel="Notes"
        fieldType="textarea"
        record={form}
        setRecord={setForm}
      />
    </Form>
    }
  />
);

export const toPractitionerOptions = (practitioners: any[] = []) =>
  practitioners
    .map(practitioner => ({
      ...practitioner,
      label: practitionerLabel(practitioner)
    }))
    .filter(practitioner => practitioner.label);

export const practitionerDisplayName = (
  practitioners: any[] = [],
  practitionerId?: number | null
) => {
  if (practitionerId == null) return '—';
  const match = practitioners.find(
    practitioner => String(practitioner.id) === String(practitionerId)
  );
  return match ? practitionerLabel(match) || '—' : '—';
};

export default TreatmentPlanHeaderModal;
