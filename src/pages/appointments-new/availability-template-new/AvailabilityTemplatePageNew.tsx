import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Form } from 'rsuite';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import EditAvailabilityTemplateModalNew from './AddEditAvailabilityTemplate';
import AvailabilityIntervalCard from './AvailabilityIntervalCard';
import AvailabilityTemplateSummaryCard from './AvailabilityTemplateSummaryCard';
import SlotCard from './SlotCard';
import DateNavigator from './DateNavigator';
import WarningMessage from './WarningMessage';
import {
  useGetAvailabilityTemplatesQuery,
  useToggleAvailabilityTemplateActiveMutation
} from '@/services/appointment/availabilityTemplateService';
import { useGetActiveFacilitiesQuery, useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetAllDepartmentsWithoutPaginationQuery, useGetDepartmentByFacilityQuery } from '@/services/security/departmentService';
import { FaUndo } from "react-icons/fa";
import { useEnumOptions } from '@/services/enumsApi';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { formatEnumString } from '@/utils';
import { AvailabilityTemplateResponseVM } from '@/types/model-types-new';
import { newAvailabilityTemplateResponseVM } from '@/types/model-types-constructor-new';
import AddEditAvailabilityTemplate from './AddEditAvailabilityTemplate';

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
          { id: "int-101", startTime: "09:00", endTime: "12:30", slotDuration: "30 minutes", strategy: 'asDepartmentPool', startBreak: "02:02", endBreak: "03:03" },
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
  const { data: templatesList, isFetching, refetch } = useGetAvailabilityTemplatesQuery({});
  const [recordOfFilter, setRecordOfFilter] = useState<{ filter?: string; value?: string }>({});
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5
  });
  const [openModal, setOpenModal] = useState(false);
  const [openTestModal, setOpenTestModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AvailabilityTemplateResponseVM>({ ...newAvailabilityTemplateResponseVM });
  const [openConfirmToggleTemplate, setOpenConfirmToggleTemplate] = useState(false);
  const [toggleActionType, setToggleActionType] = useState<'deactivate' | 'reactivate'>(
    'deactivate'
  );
  const { data: facilitiesResponse } = useGetActiveFacilitiesQuery({});
  const { data: allDepartments } = useGetAllDepartmentsWithoutPaginationQuery({});
  const statusEnum = useEnumOptions('TemplateStatus');
  const templateTypeEnum = useEnumOptions('TemplateType');
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;
  const { data: departmentforLoggedInFacility, isFetching: deptFetching } =
    useGetDepartmentByFacilityQuery(
      { facilityId: selectedFacility?.id },
      { skip: !selectedFacility?.id }
    );
  const [toggleTemplateActive] = useToggleAvailabilityTemplateActiveMutation();
  const dispatch = useAppDispatch();

  const handleFilterChange = (field?: string, value?: string) => {
    const list = templatesList ?? [];
    if (!field || value === undefined || value === null || value === '') {
      setIsFiltered(false);
      setFilteredList([]);
      setPaginationParams(prev => ({ ...prev, page: 0 }));
      return;
    }

    const normalizedValue = String(value).trim().toLowerCase();
    const filtered = list.filter(item => {
      if (!item) return false;
      if (field === 'templateName') {
        const name = item.templateName ?? item.name ?? '';
        return String(name).toLowerCase().includes(normalizedValue);
      }
      if (field === 'departmentId') {
        return String(item.departmentId ?? '') === String(value);
      }
      if (field === 'status') {
        return String(item.status ?? '').toLowerCase() === normalizedValue;
      }
      if (field === 'templateType') {
        return String(item.templateType ?? '').toLowerCase() === normalizedValue;
      }
      return false;
    });

    setFilteredList(filtered);
    setIsFiltered(true);
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  };

  const currentList = useMemo(() => {
    return isFiltered ? filteredList : (templatesList ?? []);
  }, [filteredList, isFiltered, templatesList]);

  const totalCount = currentList.length;
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;
  const pagedList = useMemo(() => {
    const start = pageIndex * rowsPerPage;
    return currentList.slice(start, start + rowsPerPage);
  }, [currentList, pageIndex, rowsPerPage]);

  useEffect(() => {
    if (pageIndex > 0 && pageIndex * rowsPerPage >= totalCount) {
      setPaginationParams(prev => ({ ...prev, page: 0 }));
    }
  }, [pageIndex, rowsPerPage, totalCount]);

  // Class name of selected row
  const isSelected = rowData => {
    if (rowData && selectedTemplate && rowData.id === selectedTemplate.id) {
      return 'selected-row';
    } else return '';
  };

  const handleToggleTemplateActive = async () => {
    if (!selectedTemplate?.id) return;
    try {
      dispatch(showSystemLoader());
      await toggleTemplateActive({ id: selectedTemplate.id }).unwrap();
      setOpenConfirmToggleTemplate(false);
      dispatch(
        notify({
          msg:
            toggleActionType === 'deactivate'
              ? 'Template deactivated successfully'
              : 'Template reactivated successfully',
          sev: 'success'
        })
      );
      refetch();
    } catch (error) {
      dispatch(
        notify({
          msg: 'Action failed, please try again',
          sev: 'warning'
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const columns = [
    {
      key: 'templateName',
      title: <Translate>Template Name</Translate>,
    },
    {
      key: 'departmentId',
      title: <Translate>Department ID</Translate>,
      render: (rowData) => {
        const department = allDepartments?.find(d => d?.id === rowData?.departmentId);
        return department ? department.name : 'Unknown';
      },
    },
    {
      key: 'facilityId',
      title: <Translate>Facility ID</Translate>,
      render: (rowData) => {
        const facility = facilitiesResponse?.find(f => f.id === rowData?.facilityId);
        return facility ? facility.name : 'Unknown';
      },
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: (rowData: any) => (
        <span>{formatEnumString(rowData.status)}</span>
      ),

    },
    {
      key: 'actions',
      title: '',
      flexGrow: 2,
      render: (rowData) => (
        <div className="container-of-icons">
          <MdModeEdit
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            className="icons-style"
            onClick={() => {
              setSelectedTemplate(rowData);
              setOpenModal(true);
            }}
          />
          {rowData?.isActive ? (
            <MdDelete
              title="Deactivate"
              size={24}
              fill="var(--primary-pink)"
              className="icons-style"
              onClick={() => {
                setSelectedTemplate(rowData);
                setToggleActionType('deactivate');
                setOpenConfirmToggleTemplate(true);
              }}
            />
          ) : (
            <FaUndo
              title="Activate"
              size={24}
              fill="var(--primary-gray)"
              className="icons-style"
              onClick={() => {
                setSelectedTemplate(rowData);
                setToggleActionType('reactivate');
                setOpenConfirmToggleTemplate(true);
              }}
            />
          )}
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
          { label: 'Template Name', value: 'templateName' },
          { label: 'Department', value: 'departmentId' },
          { label: 'Status', value: 'status' },
          { label: 'Template Type', value: 'templateType' },
        ]}
        selectDataLabel='label'
        selectDataValue='value'
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Filter By"
        searchable={false}
      />

      {recordOfFilter.filter === "templateName" && (
        <MyInput
          fieldName="value"
          record={recordOfFilter}
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
        />
      )}
      {recordOfFilter.filter === "departmentId" && (
        <MyInput
          fieldName="value"
          record={recordOfFilter}
          fieldType='select'
          selectData={departmentforLoggedInFacility?.data ?? []}
          selectDataLabel='name'
          selectDataValue='id'
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
        />
      )}
      {recordOfFilter.filter === "status" && (
        <MyInput
          fieldName="value"
          record={recordOfFilter}
          fieldType='select'
          selectData={statusEnum ?? []}
          selectDataLabel='label'
          selectDataValue='value'
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
        />
      )}
      {recordOfFilter.filter === "templateType" && (
        <MyInput
          fieldName="value"
          record={recordOfFilter}
          fieldType='select'
          selectData={templateTypeEnum ?? []}
          selectDataLabel='label'
          selectDataValue='value'
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
        />
      )}
      {!recordOfFilter.filter && (
        <MyInput
          fieldType="text"
          fieldName="value"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Search"
        />
      )}
      <MyButton
        color="var(--deep-blue)"
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
        width="80px"
      >
        Search
      </MyButton>
    </Form>
  );

  return (
    <Panel>

      <MyTable
        columns={columns}
        data={pagedList}
        height={500}
        rowClassName={isSelected}
        onRowClick={rowdata => setSelectedTemplate(rowdata)}
        filters={filters}
        loading={isFetching}
        totalCount={totalCount}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, newPage) => {
          setPaginationParams(prev => ({ ...prev, page: newPage }));
        }}
        onRowsPerPageChange={e => {
          const newSize = Number(e.target.value);
          setPaginationParams({ page: 0, size: newSize });
        }}
        tableButtons={
          <>
            <MyButton
              icon="plus"
              appearance="primary"
              onClick={() => {
                setSelectedTemplate(
                  { ...newAvailabilityTemplateResponseVM }
                  //   {
                  //   id: '',
                  //   name: '',
                  //   facilityId: null,
                  //   departmentId: null,
                  //   effectiveFrom: null,
                  //   effectiveTo: null,
                  //   status: 'DRAFT',
                  //   step: 60,
                  //   slotsBefore: 5,
                  //   channelsData: {
                  //     Sunday: [
                  //     ],
                  //     Monday: [
                  //     ],
                  //     Tuesday: [

                  //     ],
                  //     Wednesday: [
                  //     ],
                  //     Thursday: [

                  //     ],
                  //     Friday: [
                  //     ],
                  //     Saturday: [
                  //     ]
                  //   }
                  // }
                );
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




      {/* <MyModal
        open={openModal}
        setOpen={setOpenModal}
        title={
          selectedTemplate?.id
            ? <Translate>Edit Availability Template</Translate>
            : <Translate>New Availability Template</Translate>
        }
        size="70vw"
        content={ */}
      <AddEditAvailabilityTemplate
       open={openModal}
        setOpen={setOpenModal}
        template={selectedTemplate}
         templatesData={templatesData}
          setTemplatesData={setTemplatesData} />
      {/* }
      /> */}

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
              interval={{ startTime: "9:00", endTime: "10:00", slotDuration: "Test" }}
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

      <DeletionConfirmationModal
        open={openConfirmToggleTemplate}
        setOpen={setOpenConfirmToggleTemplate}
        itemToDelete="Availability Template"
        actionButtonFunction={handleToggleTemplateActive}
        actionType={toggleActionType}
      />

    </Panel>
  );
};

export default AvailabilityTemplatePageNew;
