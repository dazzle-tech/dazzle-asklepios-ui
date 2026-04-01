import React, { useState } from 'react';
import { Panel, Form } from 'rsuite';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import EditAvailabilityTemplateModalNew from './AvailabilityTemplatePageNewModal';
import AvailabilityIntervalCard from './AvailabilityIntervalCard';
import AvailabilityTemplateSummaryCard from './AvailabilityTemplateSummaryCard';
import SlotCard from './SlotCard';
import DateNavigator from './DateNavigator';
import WarningMessage from './WarningMessage';
import { useGetAvailabilityTemplatesQuery } from '@/services/appointment/availabilityTemplateService';


const mockAvailabilityTemplates = [
  {
    id: '1',
    facilityId: 1,
    departmentId: 5001,
    description: 'pediatrics_department - Template #1',
    availability_json: '{}',
    is_valid: true,
    name: "template1",
    step: 60,
    effectiveFromDate: new Date('2026-01-10'),
    effectiveFromHour: new Date('1970-01-01T08:00'),
    effectiveToDate: new Date('2026-01-15'),
    effectiveToHour: new Date('1970-01-01T16:00'),
    slotsBeforeAfter: 5,
    days: [],
    channelsData: {
      Sunday: [{
        id: 1,
        channelName: "Pediatrics Pool",
        type: "Department Pool",
        capacity: "3 concurrent",
        departmentCapacity: '5 patients',
        allowedServices: ["Vaccination", "Follow-up"],
        color: "#6982F0",
        intervals: [
          { id: "int-101", startTime: "09:00", endTime: "12:30", slotDuration: "30 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03"},
        ],
        resources: []
      },
      {
        id: 2,
        channelName: "Dr. Emma Johnson",
        type: "Practitioner",
        capacity: "1 concurrent",
        departmentCapacity: '4 patients',
        allowedServices: ["Consultation"],
        color: "#71946C",
        intervals: [
          { id: "int-102", startTime: "10:00", endTime: "14:00", slotDuration: "20 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },
      {
        id: 3,
        channelName: "Exam Room 1",
        type: "Resource",
        capacity: "1 concurrent",
        departmentCapacity: '3 patients',
        allowedServices: ["Consultation"],
        color: "#8575A1",
        intervals: [
          { id: "int-103", startTime: "08:30", endTime: "12:00", slotDuration: "30 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },],
      Monday: [{
        id: 4,
        channelName: "Orthodontics Pool",
        type: "Department Pool",
        capacity: "1 concurrent",
        departmentCapacity: '6 patients',
        allowedServices: ["Braces Check"],
        color: "#F08A5D",
        intervals: [
          { id: "int-201", startTime: "09:00", endTime: "13:00", slotDuration: "30 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },
      {
        id: 5,
        channelName: "Dr. Michael Smith",
        type: "Practitioner",
        capacity: "1 concurrent",
        departmentCapacity: '7 patients',
        allowedServices: ["Surgery Consultation"],
        color: "#6A9FB5",
        intervals: [
          { id: "int-202", startTime: "11:00", endTime: "15:00", slotDuration: "40 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },
      {
        id: 6,
        channelName: "X-Ray Room",
        type: "Resource",
        capacity: "1 concurrent",
        departmentCapacity: '6 patients',
        allowedServices: ["X-Ray"],
        color: "#B83B5E",
        intervals: [
          { id: "int-203", startTime: "08:00", endTime: "12:00", slotDuration: "15 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },],
      Tuesday: [{
        id: 7,
        channelName: "Preventive Care Pool",
        type: "Department Pool",
        capacity: "4 concurrent",
        departmentCapacity: '2 patients',
        allowedServices: ["Cleaning", "Check-up"],
        color: "#4ECDC4",
        intervals: [
          { id: "int-301", startTime: "07:30", endTime: "11:30", slotDuration: "30 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },
      {
        id: 8,
        channelName: "Dr. Sarah Lee",
        type: "Practitioner",
        capacity: "1 concurrent",
        departmentCapacity: '8 patients',
        allowedServices: ["Follow-up"],
        color: "#3D5A80",
        intervals: [
          { id: "int-302", startTime: "12:00", endTime: "16:00", slotDuration: "20 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },
      {
        id: 9,
        channelName: "Exam Room 2",
        type: "Resource",
        capacity: "1 concurrent",
        departmentCapacity: '6 patients',
        allowedServices: ["Consultation"],
        color: "#9A8C98",
        intervals: [
          { id: "int-303", startTime: "09:30", endTime: "13:30", slotDuration: "30 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },],
      Wednesday: [{
        id: 10,
        channelName: "Surgery Pool",
        type: "Department Pool",
        capacity: "1 concurrent",
        departmentCapacity: '6 patients',
        allowedServices: ["Minor Surgery"],
        color: "#22223B",
        intervals: [
          { id: "int-401", startTime: "08:00", endTime: "12:00", slotDuration: "60 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },
      {
        id: 11,
        channelName: "Dr. Ahmed Khaled",
        type: "Practitioner",
        capacity: "1 concurrent",
        departmentCapacity: '7 patients',
        allowedServices: ["Minor Surgery"],
        color: "#4A4E69",
        intervals: [
          { id: "int-402", startTime: "12:30", endTime: "16:30", slotDuration: "60 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },
      {
        id: 12,
        channelName: "Operating Room 1",
        type: "Resource",
        capacity: "1 concurrent",
        departmentCapacity: '4 patients',
        allowedServices: ["Minor Surgery"],
        color: "#C9ADA7",
        intervals: [
          { id: "int-403", startTime: "08:00", endTime: "16:00", slotDuration: "60 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },],
      Thursday: [{
        id: 13,
        channelName: "Dermatology Pool",
        type: "Department Pool",
        capacity: "2 concurrent",
        departmentCapacity: '5 patients',
        allowedServices: ["Skin Check"],
        color: "#81B29A",
        intervals: [
          { id: "int-501", startTime: "09:00", endTime: "13:00", slotDuration: "30 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },
      {
        id: 14,
        channelName: "Dr. Lina Hassan",
        type: "Practitioner",
        capacity: "1 concurrent",
        departmentCapacity: '8 patients',
        allowedServices: ["Skin Treatment"],
        color: "#F2CC8F",
        intervals: [
          { id: "int-502", startTime: "13:30", endTime: "17:00", slotDuration: "30 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },
      {
        id: 15,
        channelName: "Treatment Room",
        type: "Resource",
        capacity: "1 concurrent",
        departmentCapacity: '4 patients',
        allowedServices: ["Skin Treatment"],
        color: "#E07A5F",
        intervals: [
          { id: "int-503", startTime: "09:00", endTime: "17:00", slotDuration: "30 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },],
      Friday: [{
        id: 16,
        channelName: "Dental Pool",
        type: "Department Pool",
        capacity: "1 concurrent",
        departmentCapacity: '6 patients',
        allowedServices: ["Cleaning"],
        color: "#577590",
        intervals: [
          { id: "int-601", startTime: "08:00", endTime: "12:00", slotDuration: "30 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },
      {
        id: 17,
        channelName: "Dr. Noor Ali",
        type: "Practitioner",
        capacity: "1 concurrent",
        departmentCapacity: '7 patients',
        allowedServices: ["Cleaning"],
        color: "#43AA8B",
        intervals: [
          { id: "int-602", startTime: "12:30", endTime: "16:30", slotDuration: "30 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },
      {
        id: 18,
        channelName: "Dental Room 1",
        type: "Resource",
        capacity: "1 concurrent",
        departmentCapacity: '3 patients',
        allowedServices: ["Cleaning"],
        color: "#F94144",
        intervals: [
          { id: "int-603", startTime: "08:00", endTime: "16:30", slotDuration: "30 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },],
      Saturday: [{
        id: 19,
        channelName: "ENT Pool",
        type: "Department Pool",
        capacity: "2 concurrent",
        departmentCapacity: '8 patients',
        allowedServices: ["ENT Consultation"],
        color: "#90DBF4",
        intervals: [
          { id: "int-701", startTime: "09:00", endTime: "12:00", slotDuration: "30 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },
      {
        id: 20,
        channelName: "Dr. Omar Saleh",
        type: "Practitioner",
        capacity: "1 concurrent",
        departmentCapacity: '9 patients',
        allowedServices: ["ENT Consultation"],
        color: "#CDB4DB",
        intervals: [
          { id: "int-702", startTime: "12:30", endTime: "16:00", slotDuration: "30 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },
      {
        id: 21,
        channelName: "ENT Room",
        type: "Resource",
        capacity: "1 concurrent",
        departmentCapacity: '4 patients',
        allowedServices: ["ENT Consultation"],
        color: "#FFC8DD",
        intervals: [
          { id: "int-703", startTime: "09:00", endTime: "16:00", slotDuration: "30 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
        ],
        resources: []
      },]
    }
  },
  {
    id: '2',
    facilityId: 2,
    departmentId: 5004,
    description: 'default_department - Template #3',
    availability_json: '{}',
    is_valid: true,
    name: "template2",
    step: 90,
    effectiveFromDate: new Date('2026-02-01'),
    effectiveFromHour: new Date('1970-01-01T08:00'),
    effectiveToDate: new Date('2026-02-10'),
    effectiveToHour: new Date('1970-01-01T16:00'),
    slotsBeforeAfter: 7,
    days: [],
  },
  {
    id: '3',
    facilityId: 3,
    departmentId: null,
    description: 'default_department - Template #2',
    availability_json: '{}',
    is_valid: false,
    name: "template3",
    step: 100,
    effectiveFromDate: new Date('2026-03-05'),
    effectiveFromHour: new Date('1970-01-01T08:00'),
    effectiveToDate: new Date('2026-03-20'),
    effectiveToHour: new Date('1970-01-01T16:00'),
    slotsBeforeAfter: 10,
    days: [],
  }
];




const AvailabilityTemplatePageNew = () => {
  // const [data, setData] = useState(mockAvailabilityTemplates);
  const [templatesData, setTemplatesData] = useState(mockAvailabilityTemplates);
  const { data: templatesList } = useGetAvailabilityTemplatesQuery({});
  console.log("templatesList: ", templatesList);
  const [record, setRecord] = useState<{ filter?: string; value?: string }>({});
  const [openModal, setOpenModal] = useState(false);
  const [openTestModal, setOpenTestModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  // Class name of selected row
  const isSelected = rowData => {
    if (rowData && selectedTemplate && rowData.id === selectedTemplate.id) {
      return 'selected-row';
    } else return '';
  };

  const columns = [
    {
      key: 'id',
      title: <Translate>Template ID</Translate>,
      flexGrow: 2
    },
    {
      key: 'departmentId',
      title: <Translate>Department ID</Translate>,
      flexGrow: 3
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      flexGrow: 4
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      
    },
    {
      key: 'actions',
      title: '',
      flexGrow: 2,
      render: (row) => (
        <div className="container-of-icons">
          <MdModeEdit
            size={22}
            className="icons-style"
            onClick={() => {
              // setSelectedTemplate(row);
              setOpenModal(true);
            }}
          />
          <MdDelete
            size={22}
            className="icons-style"
          />
        </div>
      )
    }
  ];

  const filters = (
    <Form layout="inline">
      <MyInput
        fieldType="select"
        fieldName="filter"
        selectData={[
          { label: 'Template ID', value: 'id' },
          { label: 'Department ID', value: 'departmentId' },
          { label: 'Description', value: 'description' }
        ]}
        record={record}
        setRecord={setRecord}
        showLabel={false}
        placeholder="Filter By"
        searchable={false}
      />

      <MyInput
        fieldType="text"
        fieldName="value"
        record={record}
        setRecord={setRecord}
        showLabel={false}
        placeholder="Search"
      />
    </Form>
  );

  return (
    <Panel>

      <MyTable
        columns={columns}
        // data={templatesData}
        data={templatesList ?? []}
        height={500}
        onRowClick={rowdata => setSelectedTemplate(rowdata)}
        filters={filters}
        tableButtons={
          <>
            <MyButton
              icon="plus"
              appearance="primary"
              onClick={() => {
                setSelectedTemplate({
                  id: '',
                  name: '',
                  facilityId: null,
                  departmentId: null,
                  effectiveFrom: null,
                  effectiveTo: null,
                  status: 'DRAFT',
                  step: 60,
                  slotsBefore: 5,
                  channelsData: {
                    Sunday: [
                    ],
                    Monday: [
                    ],
                    Tuesday: [

                    ],
                    Wednesday: [
                    ],
                    Thursday: [

                    ],
                    Friday: [
                    ],
                    Saturday: [
                    ]
                  }
                });
                setOpenModal(true);
              }}
            >
              Add Template
            </MyButton>
            {/* <MyButton
              icon="plus"
              appearance="primary"
              onClick={() => {
                setOpenTestModal(true);
              }}
            >
              Test Button
            </MyButton> */}
          </>
        }
      />




      <MyModal
        open={openModal}
        setOpen={setOpenModal}
        title={
          selectedTemplate?.id
            ? <Translate>Edit Availability Template</Translate>
            : <Translate>New Availability Template</Translate>
        }
        size="70vw"
        content={
          <EditAvailabilityTemplateModalNew template={selectedTemplate} templatesData={templatesData} setTemplatesData={setTemplatesData} />
        }
      />

      <MyModal
        open={openTestModal}
        setOpen={setOpenTestModal}
        title="Test"
        size="70vw"
        content={
          <>
            <AvailabilityTemplateSummaryCard
              title="Test"
              type="Department"
              capacity='test'
              services={['service1', 'service2']}
              onSettingsClick={null}
            />
            <AvailabilityIntervalCard
              start="9:00"
              end="10:00"
              slotLabel="Test"
              type='NORMAL'

            />
            <SlotCard
              time="9:30 - 9:40"
              slots="2"
              status="New"
            />
            <WarningMessage
             message='Warning war'
            />
          </>
        }
      />

    </Panel>
  );
};

export default AvailabilityTemplatePageNew;
