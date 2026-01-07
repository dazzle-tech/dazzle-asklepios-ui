import React, { useState } from 'react';
import { Form, CheckboxGroup, Checkbox } from 'rsuite';
import MyInput from '@/components/MyInput';
import './AddChannelModal.less';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { FaPlus } from "react-icons/fa";
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
  setRecord,
  open,
  setOpen,
}: {
  record: any;
  setRecord: any;
  open: boolean;
  setOpen: any
}) => {
  const [currentColor, setCurrentColor] = useState(record?.color);
  const columns = [
    {
      key: 'resource',
      title: <Translate>Resource</Translate>,
    }
  ];
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid className="add-channel-form">

            <Checkbox
              checked={record.applyAllChannels}
              onChange={(_, checked) =>
                setRecord(prev => ({ ...prev, applyAllChannels: checked }))
              }
            >
              <Translate>Apply on all days</Translate>
            </Checkbox>
            <MyInput
              column
              fieldName="name"
              fieldType="text"
              label="Channel Name"
              record={record}
              setRecord={setRecord}
              required
              width="100%"
            />
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
              width="100%"
              required
            />
            <MyInput
              fieldName="slotsBefore"
              fieldType="number"
              fieldLabel="Slots Before/After"
              record={record}
              setRecord={setRecord}
              leftAddonwidth={"auto"}
              rightAddon="min"
              width={60}
            />
            <div className="block">
              <Translate>Services Allowed(optional):</Translate>
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
              <Translate>Channel Color</Translate>
              <div className="color-picker-row">
                <input
                  type="color"
                  value={currentColor}
                  onChange={e => {
                    const nextColor = e.target.value;
                    setCurrentColor(nextColor);
                  }}
                />
              </div>
            </div>
              <div>
                <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
              <MyInput
              fieldName="additionalResource"
              record={record}
              setRecord={setRecord}
            />
            <MyButton prefixIcon={() => <FaPlus />}>Add</MyButton>
            </div>
            <MyTable
                    height={200}
                    data={[{resource: 'Resource 1'},{resource: 'Resource 2'},{resource: 'Resource 3'},]}
                    columns={columns}
                  />
                  </div>
            <div className="help-text">
              Book into pool; assign practitioner near appointment time.
            </div>
          </Form>
        );
      default:
        return null;
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add Channel"
      size="xs"
      content={conjureFormContent}
      actionButtonLabel="Add"
      actionButtonFunction={() => {
        
      }}

    />
  )
};

export default AddChannelModal;
