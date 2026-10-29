import React, { useMemo } from 'react';
import { Col, Form, Row } from 'rsuite';
import { MdArrowDownward, MdArrowUpward, MdDeleteOutline, MdOutlineAccountTree } from 'react-icons/md';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useEnumOptions } from '@/services/enumsApi';
import { formatEnumString } from '@/utils';
import type { ActivityPlan, ActivityPlanItem, ActivityTemplate } from '@/types/model-types-new';
import { describeDueRule, useActivityCatalog } from '@/pages/patient/patient-profile/tabs/Activities/activityCatalog';
import { toTemplateCode } from './AddEditActivityTemplate';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  record: ActivityPlan;
  setRecord: (record: ActivityPlan) => void;
  onSave: () => void;
  loading: boolean;
};

export const emptyPlanItem = (): ActivityPlanItem => ({
  templateCode: '',
  dueOffset: null,
  dueUnit: null,
  note: ''
});

/** The due rule an item ends up with: its own, or the one of its template. */
export const itemDueRule = (item: ActivityPlanItem, template?: ActivityTemplate) =>
  item.dueOffset != null && String(item.dueOffset) !== '' && item.dueUnit
    ? describeDueRule({ dueOffset: Number(item.dueOffset), dueUnit: item.dueUnit })
    : describeDueRule(template);

const AddEditActivityPlan: React.FC<Props> = ({ open, setOpen, record, setRecord, onSave, loading }) => {
  const isEdit = Boolean(record.id);
  const { templates, templateByCode, categoryName } = useActivityCatalog();
  const dueUnitOptions = useEnumOptions('ActivityDueUnit');
  const items = useMemo(() => record.items ?? [], [record.items]);

  const taskOptions = useMemo(
    () =>
      templates
        .filter(t => t.kind === 'TASK')
        .filter(t => t.isActive || items.some(item => item.templateCode === t.code))
        .map(t => ({ value: t.code, label: `${t.name} · ${categoryName(t.categoryCode)}` })),
    [templates, items, categoryName]
  );

  const update = (next: ActivityPlan) => {
    const resolved = { ...next };
    if (!isEdit && resolved.name !== record.name && toTemplateCode(record.name) === record.code) {
      resolved.code = toTemplateCode(resolved.name);
    }
    setRecord(resolved);
  };

  const setItems = (nextItems: ActivityPlanItem[]) => setRecord({ ...record, items: nextItems });

  const setItem = (index: number, next: ActivityPlanItem) =>
    setItems(items.map((item, i) => (i === index ? { ...next } : item)));

  const moveItem = (index: number, step: number) => {
    const target = index + step;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={isEdit ? 'Edit Task Plan' : 'New Task Plan'}
      icon={<MdOutlineAccountTree />}
      size="80vw"
      actionButtonLabel="Save"
      actionButtonFunction={onSave}
      actionButtonLoading={loading}
      content={
        <Form fluid className="activity-setup-form">
          <Row>
            <Col md={8}>
              <MyInput width="100%" fieldName="name" fieldLabel="Name" record={record} setRecord={update} required />
            </Col>
            <Col md={8}>
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
            <Col md={4}>
              <MyInput
                width="100%"
                fieldType="number"
                fieldName="viewOrder"
                fieldLabel="View Order"
                record={record}
                setRecord={update}
              />
            </Col>
            <Col md={4}>
              <MyInput
                width="100%"
                fieldType="checkbox"
                fieldName="isActive"
                fieldLabel="Active"
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

          <div className="activity-plan-items-head">
            <span>
              <Translate>Tasks</Translate> <span className="activity-setup-count">{items.length}</span>
            </span>
            <span className="activity-setup-hint">
              <Translate>Due times count from the moment the plan is applied; empty uses the task setup. Priority and team come from the task setup.</Translate>
            </span>
          </div>

          {items.map((item, index) => {
            const template = templateByCode.get(item.templateCode);
            const rule = itemDueRule(item, template);
            return (
              <div key={index} className="activity-plan-item">
                <span className="activity-plan-item-index">{index + 1}</span>
                <div className="activity-plan-item-fields">
                  <Row>
                    <Col md={10}>
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldName="templateCode"
                        fieldLabel="Task"
                        selectData={taskOptions}
                        selectDataLabel="label"
                        selectDataValue="value"
                        record={item}
                        setRecord={next => setItem(index, next)}
                        required
                      />
                    </Col>
                    <Col md={3}>
                      <MyInput
                        width="100%"
                        fieldType="number"
                        fieldName="dueOffset"
                        fieldLabel="Due After"
                        record={item}
                        setRecord={next => setItem(index, next)}
                      />
                    </Col>
                    <Col md={3}>
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldName="dueUnit"
                        fieldLabel="Unit"
                        selectData={dueUnitOptions}
                        selectDataLabel="label"
                        selectDataValue="value"
                        record={item}
                        setRecord={next => setItem(index, next)}
                        searchable={false}
                      />
                    </Col>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldName="note"
                        fieldLabel="Default Note"
                        placeholder="Optional"
                        record={item}
                        setRecord={next => setItem(index, next)}
                      />
                    </Col>
                  </Row>
                  {template && (
                    <div className="activity-setup-hint">
                      <Translate>
                        {[
                          rule ? `Due ${rule} after the plan is applied.` : 'No due rule: staff pick the date when applying.',
                          `Priority ${formatEnumString(template.defaultPriority ?? 'NORMAL')}`,
                          template.assigneeRoles?.length
                            ? `Team ${template.assigneeRoles.map(formatEnumString).join(', ')}`
                            : 'No team'
                        ].join(' · ')}
                      </Translate>
                    </div>
                  )}
                </div>
                <div className="activity-plan-item-actions">
                  <MdArrowUpward title="Move up" onClick={() => moveItem(index, -1)} />
                  <MdArrowDownward title="Move down" onClick={() => moveItem(index, 1)} />
                  <MdDeleteOutline
                    title="Remove"
                    className="remove"
                    onClick={() => setItems(items.filter((_, i) => i !== index))}
                  />
                </div>
              </div>
            );
          })}

          <MyButton appearance="ghost" onClick={() => setItems([...items, emptyPlanItem()])}>
            Add Task
          </MyButton>
        </Form>
      }
    />
  );
};

export default AddEditActivityPlan;
