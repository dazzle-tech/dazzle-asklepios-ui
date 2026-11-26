import React, { useMemo } from 'react';
import { Col, Form, Row } from 'rsuite';
import { FaClipboardList } from 'react-icons/fa';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyTagInput from '@/components/MyTagInput/MyTagInput';
import Translate from '@/components/Translate';
import { useEnumOptions } from '@/services/enumsApi';
import type { ActivityCategory, ActivityTemplate } from '@/types/model-types-new';
import { describeDueRule } from '@/pages/patient/patient-profile/tabs/Activities/activityCatalog';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  record: ActivityTemplate;
  setRecord: (record: ActivityTemplate) => void;
  categories: ActivityCategory[];
  onSave: () => void;
  loading: boolean;
};

const KIND_LABELS = {
  labelOverrides: {
    TASK: 'Task — followed up until done',
    ACTIVITY: 'Activity — logged as done'
  }
};

export const toTemplateCode = (name: string) =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

const AddEditActivityTemplate: React.FC<Props> = ({
  open,
  setOpen,
  record,
  setRecord,
  categories,
  onSave,
  loading
}) => {
  const isEdit = Boolean(record.id);
  const isTask = record.kind === 'TASK';
  const jobRoles = useEnumOptions('JobRole');
  const kindOptions = useEnumOptions('ActivityTemplateKind', KIND_LABELS);
  const dueUnitOptions = useEnumOptions('ActivityDueUnit');
  const priorityOptions = useEnumOptions('PatientActivityPriority');

  const categoryOptions = useMemo(
    () => categories.map(c => ({ value: c.code, label: c.isActive ? c.name : `${c.name} (inactive)` })),
    [categories]
  );

  const update = (next: ActivityTemplate | ((current: ActivityTemplate) => ActivityTemplate)) => {
    const resolved = typeof next === 'function' ? next(record) : next;
    if (!isEdit && resolved.name !== record.name && toTemplateCode(record.name) === record.code) {
      resolved.code = toTemplateCode(resolved.name);
    }
    setRecord({ ...resolved });
  };

  const tagProps = (key: 'outcomeOptions' | 'checklist') => ({
    tags: record[key] ?? [],
    setTags: (value: string[] | ((prev: string[]) => string[])) =>
      setRecord({ ...record, [key]: typeof value === 'function' ? value(record[key] ?? []) : value }),
    onRemoveTag: (tag: string) => setRecord({ ...record, [key]: (record[key] ?? []).filter(t => t !== tag) }),
    onClearAll: () => setRecord({ ...record, [key]: [] })
  });

  const dueRule = describeDueRule(record);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={isEdit ? 'Edit Activity Type' : 'New Activity Type'}
      icon={<FaClipboardList />}
      size="60vw"
      actionButtonLabel="Save"
      actionButtonFunction={onSave}
      actionButtonLoading={loading}
      content={
        <Form fluid className="activity-setup-form">
          <Row>
            <Col md={12}>
              <MyInput width="100%" fieldName="name" fieldLabel="Name" record={record} setRecord={update} required />
            </Col>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldName="code"
                fieldLabel="Code"
                record={record}
                setRecord={next => setRecord({ ...next, code: toTemplateCode(next.code ?? '') })}
                disabled={isEdit}
                required
              />
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldType="select"
                fieldName="categoryCode"
                fieldLabel="Category"
                selectData={categoryOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={update}
                required
              />
            </Col>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldType="select"
                fieldName="kind"
                fieldLabel="Kind"
                selectData={kindOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={update}
                searchable={false}
                required
              />
            </Col>
          </Row>
          <Row>
            <Col md={8}>
              <MyInput
                width="100%"
                fieldType="select"
                fieldName="defaultPriority"
                fieldLabel="Default Priority"
                selectData={priorityOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={update}
                searchable={false}
              />
            </Col>
            {isTask && (
              <>
                <Col md={8}>
                  <MyInput
                    width="100%"
                    fieldType="number"
                    fieldName="dueOffset"
                    fieldLabel="Due After"
                    record={record}
                    setRecord={update}
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    width="100%"
                    fieldType="select"
                    fieldName="dueUnit"
                    fieldLabel="Unit"
                    selectData={dueUnitOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={record}
                    setRecord={update}
                    searchable={false}
                  />
                </Col>
              </>
            )}
          </Row>
          {isTask && (
            <div className="activity-setup-hint">
              {dueRule ? (
                <Translate>{`New tasks are due ${dueRule} after they are created.`}</Translate>
              ) : (
                <Translate>No due rule: staff pick the due date, and system tasks are due right away.</Translate>
              )}
            </div>
          )}
          <Row>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldType="checkPicker"
                fieldName="assigneeRoles"
                fieldLabel="Team (Job Roles)"
                selectData={jobRoles}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={update}
              />
            </Col>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldType="checkPicker"
                fieldName="creatorRoles"
                fieldLabel="Who Can Create It"
                placeholder="Everyone"
                selectData={jobRoles}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={update}
              />
            </Col>
          </Row>
          <Row>
            <Col md={isTask ? 12 : 24}>
              <MyTagInput {...tagProps('outcomeOptions')} labelText="Outcome Options" />
            </Col>
            {isTask && (
              <Col md={12}>
                <MyTagInput {...tagProps('checklist')} labelText="Checklist" />
              </Col>
            )}
          </Row>
          <Row>
            <Col md={8}>
              <MyInput
                width="100%"
                fieldType="checkbox"
                fieldName="requireOutcome"
                fieldLabel="Outcome Required"
                record={record}
                setRecord={update}
              />
            </Col>
            <Col md={8}>
              <MyInput
                width="100%"
                fieldType="checkbox"
                fieldName="isActive"
                fieldLabel="Active"
                record={record}
                setRecord={update}
              />
            </Col>
            <Col md={8}>
              <MyInput
                width="100%"
                fieldType="number"
                fieldName="viewOrder"
                fieldLabel="View Order"
                record={record}
                setRecord={update}
              />
            </Col>
          </Row>
          <MyInput
            width="100%"
            fieldType="textarea"
            fieldName="description"
            fieldLabel="Description"
            record={record}
            setRecord={update}
          />
          {record.isSystem && (
            <div className="activity-setup-hint">
              <Translate>
                The system records this type on its own. Turning it off stops those automatic entries.
              </Translate>
            </div>
          )}
        </Form>
      }
    />
  );
};

export default AddEditActivityTemplate;
