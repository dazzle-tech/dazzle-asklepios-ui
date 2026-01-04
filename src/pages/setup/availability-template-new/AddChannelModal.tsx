import React from 'react';
import { Form, CheckboxGroup, Checkbox } from 'rsuite';
import MyInput from '@/components/MyInput';
import './AddChannelModal.less';

type ChannelForm = {
  name: string;
  type: 'DEPARTMENT_POOL' | 'PRACTITIONER';
  facility?: string;
  department?: string;
  capacity: number;
  services?: string[];
  color?: string;
};

const channelTypeOptions = [
  { label: 'Department Pool', value: 'DEPARTMENT_POOL' },
  { label: 'Practitioner', value: 'PRACTITIONER' }
];

const serviceOptions = [
  { label: 'Vaccination', value: 'VACCINATION' },
  { label: 'Follow-up', value: 'FOLLOW_UP' },
  { label: 'Consultation', value: 'CONSULTATION' }
];

const AddChannelModal = ({
  record,
  setRecord
}: {
  record: ChannelForm;
  setRecord: (r: Partial<ChannelForm>) => void;
}) => {
  return (
    <Form fluid className="add-channel-form">

      <MyInput
        column
        fieldName="name"
        fieldType="text"
        label="Channel Name"
        record={record}
        setRecord={setRecord}
        required
      />


      <div className="block">
        <MyInput
          column
          fieldName="type"
          label="Channel Type"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={channelTypeOptions}
          selectDataLabel="label"
          selectDataValue="value"
          required
        />
        <div className="help-text">
          Book into pool; assign practitioner near appointment time.
        </div>
      </div>

      <div className="two-cols">
        <MyInput
          column
          fieldName="facility"
          label="Facility"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          column
          fieldName="department"
          label="Department"
          record={record}
          setRecord={setRecord}
        />
      </div>

      <MyInput
        column
        fieldName="capacity"
        label="Capacity"
        fieldType="number"
        record={record}
        setRecord={setRecord}
        required
      />

      <div className="block">
        <div className="label">
          Services Allowed <span className="muted">(optional)</span>
        </div>

        <CheckboxGroup
          inline
          value={record.services ?? []}
          onChange={(values) =>
            setRecord({ services: values as string[] })
          }
        >
          {serviceOptions.map(s => (
            <Checkbox key={s.value} value={s.value}>
              {s.label}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </div>

      <div className="block">
        <div className="label">Channel Color</div>

        <div className="color-picker-row">
            <input
            type="color"
            value={record.color ?? '#4C7EF3'}
            onChange={e => {
                const nextColor = e.target.value;
                console.log('[AddChannelModal] picked color:', nextColor);
                setRecord({ color: nextColor });
            }}
            />


          <div
            className="color-preview"
            style={{ background: record.color ?? '#4C7EF3' }}
          />

          <span className="color-hint">
            Used to visually identify this channel in the schedule.
          </span>
        </div>
      </div>

    </Form>
  );
};

export default AddChannelModal;
