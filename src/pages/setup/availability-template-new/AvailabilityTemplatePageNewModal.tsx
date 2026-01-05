import React, { useState, useEffect } from 'react';
import { Tabs, Divider, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import './styles.less';
import AvailabilityDayGrid from './AvailabilityDayGrid';
import PreviewAvailabilityModal from './PreviewAvailabilityModal';
import MyModal from '@/components/MyModal/MyModal';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { VscNotebookTemplate } from "react-icons/vsc";
import { title } from 'process';
import MyTab from '@/components/MyTab';

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

type Channel = {
  id: string;
  name: string;
  color?: string;
};


type Interval = {
  id: string;
  start: number;
  end: number;
  type?: 'NORMAL' | 'BREAK' | 'POOL';
  meta?: {
    name: string;
    capacity: number;
    step: number;
    slotsBefore: number;
    color?: string;
  };
};


type ChannelAvailability = {
  channelId: string;
  intervals: Interval[];
};

type AvailabilityByDay = {
  [dayIndex: number]: ChannelAvailability[];
};

type ChannelsByDay = {
  [dayIndex: number]: Channel[];
};

const minutesFromDate = (date: Date) => date.getHours() * 60 + date.getMinutes();

const getDaysBetween = (from: Date, to: Date) => {
  const days: number[] = [];
  const d = new Date(from);

  while (d <= to) {
    days.push(d.getDay());
    d.setDate(d.getDate() + 1);
  }

  return Array.from(new Set(days));
};


const parseLocalDateTime = (value: any): Date | null => {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (typeof value === 'string') {
    const [datePart, timePart] = value.trim().split(' ');
    if (!datePart || !timePart) return null;

    const [dd, mm, yyyy] = datePart.split('-').map(Number);
    const [HH, MM] = timePart.split(':').map(Number);

    if (
      [dd, mm, yyyy, HH, MM].some(n => Number.isNaN(n)) ||
      !dd || !mm || !yyyy
    ) {
      return null;
    }

    return new Date(yyyy, mm - 1, dd, HH, MM, 0, 0);
  }

  return null;
};


const EditAvailabilityTemplateModalNew: React.FC = () => {
  const [record, setRecord] = useState<any>({
    name: '',
    facilityId: null,
    departmentId: null,
    effectiveFrom: null,
    effectiveTo: null,
    status: 'DRAFT',
    step: 60,
    slotsBefore: 5
  });

  const [activeDay, setActiveDay] = useState(0);



  const [availability, setAvailability] = useState<AvailabilityByDay>({});
  const [openPreview, setOpenPreview] = useState(false);
  const [openPublishModal, setOpenPublishModal] = useState(false);
  const [publishChannelId, setPublishChannelId] = useState<string | null>(null);
  const [channelsByDay, setChannelsByDay] = useState<ChannelsByDay>({});
  const {
    data: facilityListResponse,
    isLoading: isGettingFacilities,
    isFetching: isFetchingFacilities
  } = useGetAllFacilitiesQuery({});
  const { data: departmentListResponse } = useGetActiveDepartmentByFacilityListQuery(
      {
        facilityId: record?.facilityId
      },
      {
        skip: !record?.facilityId
      }
    );
 
    const tabData = () => {
      let arr = [];
      {days.map((day, index) => (
         
            arr.push({title: day, content:""})
          ))}
          return arr;
    }
    

  const handleAddChannel = ({ name, color }: { name: string; color?: string }) => {
    const trimmedName = name?.trim();
    if (!trimmedName) return;

    setChannelsByDay(prev => ({
      ...prev,
      [activeDay]: [
        ...(prev[activeDay] ?? []),
        {
          id: crypto.randomUUID(),
          name: trimmedName,
          color: color ?? '#4C7EF3'
        }
      ]
    }));
  };

  const handleRemoveChannel = (channelId: string) => {
    setChannelsByDay(prev => ({
      ...prev,
      [activeDay]: (prev[activeDay] ?? []).filter(c => c.id !== channelId)
    }));
  };

  const handlePublish = (targetChannelId: string) => {
    const channel =
      (channelsByDay[activeDay] ?? []).find(c => c.id === targetChannelId);
    if (!channel) return;

    const from = parseLocalDateTime(record.effectiveFrom);
    const to = parseLocalDateTime(record.effectiveTo);

    if (!from || !to || from >= to) {
      console.warn('INVALID EFFECTIVE RANGE');
      return;
    }

    const dayIndex = from.getDay();

    const poolStart =
      from.getHours() * 60 + from.getMinutes();

    const poolEnd =
      to.getHours() * 60 + to.getMinutes();

    setAvailability(prev => {
      const dayData = prev[dayIndex] ?? [];

      const channelData =
        dayData.find(c => c.channelId === channel.id) ?? {
          channelId: channel.id,
          intervals: []
        };

      const normalIntervals = channelData.intervals.filter(
        i => i.type === 'NORMAL'
      );

      return {
        ...prev,
        [dayIndex]: [
          ...dayData.filter(c => c.channelId !== channel.id),
          {
            channelId: channel.id,
            intervals: [
              {
                id: crypto.randomUUID(),
                start: poolStart,
                end: poolEnd,
                type: 'POOL',
                meta: {
                  name: record.name,
                  capacity: normalIntervals.length || 1,
                  step: record.step,
                  slotsBefore: record.slotsBefore,
                  color: channel.color
                }
              },
              ...normalIntervals
            ]
          }
        ]
      };
    });
  };

  return (
    <div className="availability-template-modal">
      <Form fluid>
        <div className="template-header">
          <MyInput
            fieldName="name"
            fieldType="text"
            fieldLabel="Template Name"
            record={record}
            setRecord={setRecord}
            width="20vw"
          />
          <MyInput
            column
            fieldLabel="Facility"
            selectData={facilityListResponse ?? []}
            fieldType="select"
            selectDataLabel="name"
            selectDataValue="id"
            fieldName="facilityId"
            record={record}
            setRecord={setRecord}
            width="14vw"
          />

          <MyInput
            width="12vw"
            fieldName="departmentId"
            fieldLabel="Department"
            fieldType="select"
            selectData={departmentListResponse ?? []}
            selectDataLabel="name"
            selectDataValue="id"
            record={record}
            setRecord={setRecord}
            menuMaxHeight={200}
          />

          <MyButton appearance="ghost" color="#525252" prefixIcon={() => <VscNotebookTemplate />
}>
            Copy from template
          </MyButton>
        </div>

        <div className="template-header2">
          <MyInput
            fieldName="effectiveFrom"
            fieldType="date"
            fieldLabel="Effective From Date"
            record={record}
            setRecord={setRecord}
            width="12vw"
          />
           <MyInput
            fieldName="effectiveFrom"
            fieldType="time"
            fieldLabel="Effective From Hour"
            record={record}
            setRecord={setRecord}
            width="7vw"
          />

          <MyInput
            fieldName="effectiveTo"
            fieldType="date"
            fieldLabel="Effective To Date"
            record={record}
            setRecord={setRecord}
            width="12vw"
          />
           <MyInput
            fieldName="effectiveTo"
            fieldType="time"
            fieldLabel="Effective To Hour"
            record={record}
            setRecord={setRecord}
            width="7vw"
          />
          <MyInput
            fieldName="status"
            fieldType="select"
            fieldLabel="Status"
            record={record}
            setRecord={setRecord}
            width="10vw"
            isEnum
            selectData={[
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Active', value: 'ACTIVE' }
            ]}
            selectDataLabel="label"
            selectDataValue="value"
          />

          <MyInput
            fieldName="step"
            fieldType="number"
            fieldLabel="Step"
            record={record}
            setRecord={setRecord}
            width="10vw"
            rightAddon="min"
          />

          <MyInput
            fieldName="slotsBefore"
            fieldType="number"
            fieldLabel="Slots Before/After"
            record={record}
            setRecord={setRecord}
            leftAddonwidth={"auto"}
            rightAddon="min"
            width="6vw"
          />
        </div>
      </Form>

      <Divider />

      <div className="days-header">
        <MyTab 
          data={tabData()}
        />

        <div className="days-actions">
          <MyButton
            appearance="subtle"
            onClick={() => setOpenPreview(true)}
          >
            <Translate>Preview slots</Translate>
          </MyButton>


          <MyButton
            appearance="primary"
            onClick={() => setOpenPublishModal(true)}
          // onClick={() => handlePublish(publishChannelId)}
          >
            Publish new version
          </MyButton>

        </div>
      </div>

      <Divider />

      <AvailabilityDayGrid
        step={record.step}
        activeDay={activeDay}
        setActiveDay={setActiveDay}
        channels={channelsByDay[activeDay] ?? []}
        availability={availability}
        setAvailability={setAvailability}
        onAddChannel={handleAddChannel}
        onRemoveChannel={handleRemoveChannel}
      />

      <PreviewAvailabilityModal
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        templateName={record.name}
        step={record.step}
        channelsByDay={channelsByDay}
        availability={availability}
      />


      <MyModal
        open={openPublishModal}
        setOpen={setOpenPublishModal}
        title="Publish New Version"
        size="30vw"
        content={
          <Form fluid>
            <MyInput
              fieldName="publishChannel"
              fieldType="select"
              label="Publish on Channel"
              record={{ publishChannel: publishChannelId }}
              setRecord={(r: any) => setPublishChannelId(r.publishChannel)}
              selectData={(channelsByDay[activeDay] ?? []).map(c => ({
                label: c.name,
                value: c.id
              }))}

              selectDataLabel="label"
              selectDataValue="value"
              placeholder="Select channel"
              width="100%"
            />
          </Form>
        }
        actionButtonLabel="Publish"
        isDisabledActionBtn={!publishChannelId}
        actionButtonFunction={() => {
          if (!publishChannelId) return;

          handlePublish(publishChannelId);
          setOpenPublishModal(false);
        }}
      />


    </div>
  );
};

export default EditAvailabilityTemplateModalNew;
