import React, { useState } from 'react';
import { Form, Checkbox, CheckboxGroup } from 'rsuite';
import MyInput from '@/components/MyInput';
import './AddChannelModal.less';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { FaPlus, FaTrash } from "react-icons/fa";

type ChannelForm = {
  id: number;
  channelName: string;
  type: string;
  capacity: string;
  allowedServices: string[];
  color: string;
  intervals: string[];
  slotsBefore: number;
  resources?: string[];
  applyAllDays?: boolean;
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
  templatesData,
  setTemplatesData,
  template,
  day
}: {
  record: ChannelForm;
  setRecord: React.Dispatch<React.SetStateAction<ChannelForm>>;
  open: boolean;
  setOpen: any;
  templatesData: any;
  setTemplatesData: any;
  template: any;
  day: string;
}) => {

  const [currentColor, setCurrentColor] = useState(record?.color || '#000000');
  const [newResource, setNewResource] = useState({additionalResource: ''});

  const columns = [
    {
      key: 'resource',
      title: <Translate>Resource</Translate>,
      render: (row: any, index: number) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{row}</span>
          <FaTrash
            style={{ cursor: 'pointer', color: 'red' }}
            onClick={() => {
              setRecord(prev => ({
                ...prev,
                resources: prev.resources?.filter(r => r !== row) || []
              }));
            }}
          />
        </div>
      )
    }
  ];

  const conjureFormContent = () => (
    <Form fluid className="add-channel-form">

      <Checkbox
        checked={record.applyAllDays || false}
        onChange={(_, checked) => {
          setRecord(prev => ({ ...prev, applyAllDays: checked }));
        }}
      >
        <Translate>Apply on all days</Translate>
      </Checkbox>

      <MyInput
        column
        fieldName="channelName"
        fieldType="text"
        fieldLabel="Channel Name"
        record={record}
        setRecord={setRecord}
        required
        width="100%"
      />

      <MyInput
        column
        fieldName="type"
        fieldLabel="Channel Type"
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
        <Translate>Services Allowed (optional):</Translate>
        <CheckboxGroup
          inline
          value={record.allowedServices || []}
          onChange={(values: any) => {
            setRecord(prev => ({ ...prev, allowedServices: values }));
          }}
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
              setRecord(prev => ({ ...prev, color: nextColor }));
            }}
          />
        </div>
      </div>
       
       <br/>
      <div className="block">
        <Translate>Resources (optional):</Translate>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <MyInput
            fieldName="additionalResource"
            record={newResource}
            setRecord={setNewResource}
          />
          <MyButton
            prefixIcon={() => <FaPlus />}
            onClick={() => {
              if (newResource['additionalResource'].trim() === '') return;
              setRecord(prev => ({
                ...prev,
                resources: [...(prev.resources || []), newResource['additionalResource'].trim()]
              }));
              setNewResource({additionalResource: ''});
            }}
          >
            Add
          </MyButton>
        </div>

        <MyTable
          height={150}
          data={record.resources || []}
          columns={columns}
        />
      </div>

      <div className="help-text">
        Book into pool; assign practitioner near appointment time.
      </div>
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add Channel"
      size="xs"
      content={conjureFormContent}
      actionButtonLabel="Add"
      actionButtonFunction={() => {
        if (!template || !day) return;

        const updatedTemplates = [...templatesData];
        const templateIndex = updatedTemplates.findIndex(t => t.id === template.id);
        if (templateIndex === -1) return;

        const updatedTemplate = { ...updatedTemplates[templateIndex] };
        if (!updatedTemplate.channelsData) updatedTemplate.channelsData = {};

        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        if (record.applyAllDays) {
          daysOfWeek.forEach(d => {
            if (!updatedTemplate.channelsData[d]) updatedTemplate.channelsData[d] = [];
            const newChannel: ChannelForm = {
              ...record,
              capacity: "1 concurrent",
              id: Date.now() + Math.random(),
              intervals: record.intervals || [],
              allowedServices: record.allowedServices || [],
              resources: record.resources || []
            };
            updatedTemplate.channelsData[d].push(newChannel);
          });
        } else {
          if (!updatedTemplate.channelsData[day]) updatedTemplate.channelsData[day] = [];
          const newChannel: ChannelForm = {
            ...record,
            id: Date.now(),
            intervals: record.intervals || [],
            allowedServices: record.allowedServices || [],
            resources: record.resources || []
          };
          updatedTemplate.channelsData[day].push(newChannel);
        }

        updatedTemplates[templateIndex] = updatedTemplate;
        setTemplatesData(updatedTemplates);
        setRecord({
          id: 0,
          channelName: "",
          type: "Practitioner",
          capacity: '',
          allowedServices: [],
          color: "",
          intervals: [],
          slotsBefore: 0
        })
        setOpen(false);

      }}
    />
  );
};

export default AddChannelModal;
