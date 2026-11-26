import React from 'react';
import { Col, Form, Row } from 'rsuite';
import { MdOutlineCategory } from 'react-icons/md';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import type { ActivityCategory } from '@/types/model-types-new';
import {
  ACTIVITY_ICON_OPTIONS,
  ActivityIcon,
  DEFAULT_CATEGORY_COLOR
} from '@/pages/patient/patient-profile/tabs/Activities/activityCatalog';
import { toTemplateCode } from './AddEditActivityTemplate';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  record: ActivityCategory;
  setRecord: (record: ActivityCategory) => void;
  onSave: () => void;
  loading: boolean;
};

const AddEditActivityCategory: React.FC<Props> = ({ open, setOpen, record, setRecord, onSave, loading }) => {
  const isEdit = Boolean(record.id);

  const update = (next: ActivityCategory) => {
    const resolved = { ...next };
    if (!isEdit && resolved.name !== record.name && toTemplateCode(record.name) === record.code) {
      resolved.code = toTemplateCode(resolved.name).slice(0, 50);
    }
    setRecord(resolved);
  };

  const color = record.color || DEFAULT_CATEGORY_COLOR;

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={isEdit ? 'Edit Category' : 'New Category'}
      icon={<MdOutlineCategory />}
      size="40vw"
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
                setRecord={next => setRecord({ ...next, code: toTemplateCode(next.code ?? '').slice(0, 50) })}
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
                fieldName="icon"
                fieldLabel="Icon"
                selectData={ACTIVITY_ICON_OPTIONS}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={update}
              />
            </Col>
            <Col md={6}>
              <MyLabel label="Color" />
              <MyInput fieldType="color" fieldName="color" showLabel={false} record={record} setRecord={update} />
            </Col>
            <Col md={6}>
              <MyLabel label="Preview" />
              <span className="activity-setup-icon-preview" style={{ color, background: `${color}1f` }}>
                <ActivityIcon icon={record.icon} />
              </span>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <MyInput
                width="100%"
                fieldType="number"
                fieldName="viewOrder"
                fieldLabel="View Order"
                record={record}
                setRecord={update}
              />
            </Col>
            <Col md={12}>
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
        </Form>
      }
    />
  );
};

export default AddEditActivityCategory;
