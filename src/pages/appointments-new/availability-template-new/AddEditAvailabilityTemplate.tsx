import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Tabs, Divider, Form, RadioGroup, Radio, Row, Col } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import './styles.less';
import AvailabilityDayGrid from './AvailabilityDayGrid';
import PreviewAvailabilityModal from './PreviewSlotsModal';
import MyModal from '@/components/MyModal/MyModal';
import { useGetActiveFacilitiesQuery, useGetAllFacilitiesQuery, useGetFacilityByIdQuery } from '@/services/security/facilityService';
import { useGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { VscNotebookTemplate } from "react-icons/vsc";
import { title } from 'process';
import MyTab from '@/components/MyTab';
import { FaPlus } from "react-icons/fa";
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import AddRoomModal from './AddResourceModal';
import AddExceptionModal from './AddExceptionModal';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetAllServicesQuery, useGetServicesByDepartmentQuery } from '@/services/setup/serviceService';
import { useGetAllPractitionersQuery, useGetPractitionerByDepartmentQuery } from '@/services/setup/practitioner/PractitionerService';
import { useEnumOptions } from '@/services/enumsApi';
import { AvailabilityTemplateResponseVM } from '@/types/model-types-new';
import { useGetAllOrganizationDefinitionsQuery } from '@/services/system-configurations/organizationDefinitionService';
import { newAvailabilityTemplateCreateDTO, newAvailabilityTemplateResponseVM } from '@/types/model-types-constructor-new';
import { useCreateAvailabilityTemplateMutation, useGetAvailabilityTemplatesByParentTemplateIdQuery } from '@/services/appointment/availabilityTemplateService';
import { formatEnumString } from '@/utils';
import AddResourceModal from './AddResourceModal';
import PreviewSlotsModal from './PreviewSlotsModal';

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






type AddEditAvailabilityTemplateProps = {
  open: boolean
  setOpen: any;
  template: AvailabilityTemplateResponseVM;
  templatesData: any;
  setTemplatesData: any
};

const AddEditAvailabilityTemplate: React.FC<AddEditAvailabilityTemplateProps> = ({ open, setOpen, template, templatesData, setTemplatesData }) => {

  const [record, setRecord] = useState<any>(
    { ...newAvailabilityTemplateResponseVM }
  );

  const dispatch = useAppDispatch();
  const [activeDay, setActiveDay] = useState(0);



  const [availability, setAvailability] = useState<AvailabilityByDay>({});
  const [currentColor, setCurrentColor] = useState(record?.color || '#6982F0');
  const [openPreviewSlotsModal, setOpenPreviewSlotsModal] = useState(false);
  const [openAddChannelModal, setOpenAddChannelModal] = useState(false);
  const [openAddExceptionModal, setOpenAddExceptionModal] = useState<boolean>(false);
  const [openAddResource, setOpenAddResource] = useState<boolean>(false);
  const [publishChannelId, setPublishChannelId] = useState<string | null>(null);
  const [channelsByDay, setChannelsByDay] = useState<ChannelsByDay>({});
  const {
    data: facilityListResponse,
    isLoading: isGettingFacilities,
    isFetching: isFetchingFacilities
  } = useGetActiveFacilitiesQuery({});
  const { data: organizationDefinitions } = useGetAllOrganizationDefinitionsQuery({});
  const authSlice = useAppSelector((s) => s.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;
  const { data: selectedFacilityFullObject } = useGetFacilityByIdQuery(selectedFacility?.id, {
    skip: !selectedFacility?.id
  });
  const { data: departmentListResponse } = useGetActiveDepartmentByFacilityListQuery(
    {
      facilityId: record?.facilityId
    },
    {
      skip: !record?.facilityId
    }
  );

  const daysEnum = useEnumOptions("DayOfWeek");
  const { data: servicesList, isFetching, refetch } = useGetAllServicesQuery({});
  const { data: servicesByDepartmentList, isFetching: isFetchingServicesByDepartmentList, refetch: refetchservicesByDepartmentList } = useGetServicesByDepartmentQuery(
    {
      sourceId: selectedDepartment?.departmentId
    },
    {
      skip: !selectedDepartment?.departmentId
    }
  );
  const { data: practitionerListResponse } = useGetPractitionerByDepartmentQuery(
    {
      departmentId: record?.departmentId
    },
    {
      skip: !record?.departmentId
    }
  );
  const statusEnum = useEnumOptions('TemplateStatus');
  const templateTypeEnum = useEnumOptions('TemplateType');
  const dayOptions = useEnumOptions('DayOfWeek');
  const dayOptionsKey = useMemo(
    () => (dayOptions ?? []).map(d => `${d.value}:${d.label}`).join('|'),
    [dayOptions]
  );
  const allServices = servicesList?.data ?? [];
  const departmentServiceIds = (servicesByDepartmentList?.data ?? []).map((s: any) => s.id);
  const selectedServiceIds = record?.allowedServiceIds ?? [];
  const workingDaysTouchedRef = useRef(false);
  const isEditMode = !!template?.id;
  const workingDaysRecord = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!dayOptions || dayOptions.length === 0) return map;

    dayOptions.forEach(day => {
      map[day.value] = false;
    });

    (record?.workingDays ?? []).forEach(day => {
      if (day?.dayOfWeek !== undefined && day?.dayOfWeek !== null) {
        map[day.dayOfWeek] = day.isWorking !== false;
      }
    });

    return map;
  }, [record?.workingDays, dayOptionsKey]);

  const setWorkingDaysRecord = (nextRecord: Record<string, boolean>) => {
    if (!dayOptions || dayOptions.length === 0) return;

    const nextWorkingDays = dayOptions.map(day => ({
      dayOfWeek: day.value,
      isWorking: !!nextRecord[day.value],
    }));

    workingDaysTouchedRef.current = true;
    setRecord(prev => ({
      ...prev,
      workingDays: nextWorkingDays,
    }));
  };
const { data: templates, isLoading, isError } = useGetAvailabilityTemplatesByParentTemplateIdQuery(
// { parentTemplateId: record?.id }
{
      parentTemplateId:  record?.id
    },
    {
      skip: ! record?.id
    }

);
console.log("templatestemplates: ", templates)
  const tabData = () => {
    let arr = [];
    {
      daysEnum.map((day, index) => (
        arr.push({
          title: formatEnumString(day.value),
          // disabled: !record?.workingDays?.find(d => d.dayOfWeek === day.value)?.isWorking ,
          content:
            <>
              <AvailabilityDayGrid
               parentTemplate={record}
               templates={templates}
               day={day?.value}
              />
            </>

        })
      ))
    }
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

  const [create] = useCreateAvailabilityTemplateMutation();
  const handleSaveMainInfo = () => {
    if (!record?.templateName?.trim()) {
      dispatch(notify({ msg: 'Template Name is required', sev: 'warning' }));
      return;
    }
    if (!record?.facilityId) {
      dispatch(notify({ msg: 'Facility is required', sev: 'warning' }));
      return;
    }
    if (!record?.departmentId) {
      dispatch(notify({ msg: 'Department is required', sev: 'warning' }));
      return;
    }

    if (template?.id) {

      dispatch(notify({ msg: 'Updated Successfully', sev: 'success' }));
      setOpen(false);
      return;
    }



    console.log("objectToAdd: ", { ...record, numberOfResourcesExpected: Number(record.numberOfResourcesExpected), durationMinutes: Number(record?.durationMinutes) });
    create({ ...record, resourceId: record?.departmentId, numberOfResourcesExpected: Number(record.numberOfResourcesExpected), durationMinutes: Number(record?.durationMinutes) }).unwrap();
    // setRecord(newTemplate);
    dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    setOpen(false);
  };

  // Effects
  useEffect(() => {
    if (template?.id) {
      setRecord({ ...template, facilityId: selectedFacility?.id });
    } else {
      setRecord({ ...newAvailabilityTemplateCreateDTO, facilityId: selectedFacility?.id });
    }
  }, [template]);

  const appliedWorkingDaysFacilityIdRef = useRef<string | number | null>(null);
  useEffect(() => {
    workingDaysTouchedRef.current = false;
    appliedWorkingDaysFacilityIdRef.current = null;
  }, [record?.facilityId]);

  // useEffect(() => {
  //   if (isEditMode) return;
  //   if (workingDaysTouchedRef.current) return;
  //   if (!DayOfWeek || DayOfWeek.length === 0) return;
  //   if (!record?.facilityId) return;
  //   if (appliedWorkingDaysFacilityIdRef.current === record.facilityId) return;

  //   const facilities = facilityListResponse ?? [];
  //   const selectedFacilityData = facilities.find(
  //     (f: any) => String(f?.id) === String(record.facilityId)
  //   );

  //   const facilityWorkingDays =
  //     selectedFacilityFullObject?.workingDays ??
  //     selectedFacilityData?.workingDays ??
  //     [];

  //   const organizationWorkingDays =
  //     organizationDefinitions?.[0]?.workingDays ?? [];

  //   const sourceWorkingDays =
  //     facilityWorkingDays?.length > 0
  //       ? facilityWorkingDays
  //       : organizationWorkingDays;

  //   if (!sourceWorkingDays?.length) return;

  //   const normalizedWorkingDays = DayOfWeek.map(day => {
  //     const found = sourceWorkingDays.find(
  //       (d: any) => String(d?.dayOfWeek) === String(day.value)
  //     );
  //     return {
  //       dayOfWeek: day.value,
  //       isWorking: found ? found.isWorking !== false : false,
  //     };
  //   });

  //   // ðŸ”¥ Ø£Ù‡Ù… Ø³Ø·Ø±
  //   appliedWorkingDaysFacilityIdRef.current = record.facilityId;

  //   setRecord(prev => ({
  //     ...prev,
  //     workingDays: normalizedWorkingDays,
  //   }));

  // }, [
  //   isEditMode,
  //   record?.facilityId,
  //   facilityListResponse,
  //   selectedFacilityFullObject,
  //   organizationDefinitions,
  //   DayOfWeek,
  // ]);
  useEffect(() => {
    if (isEditMode) return;
    if (!dayOptions || dayOptions.length === 0) return;
    if (!record?.facilityId) return;
    if (workingDaysTouchedRef.current) return;

    const facilities = facilityListResponse ?? [];
    const selectedFacilityData = facilities.find(
      (f: any) => String(f?.id) === String(record.facilityId)
    );

    const facilityWorkingDays =
      selectedFacilityFullObject?.workingDays ??
      selectedFacilityData?.workingDays ??
      [];

    const organizationWorkingDays = organizationDefinitions?.[0]?.workingDays ?? [];

    const sourceWorkingDays =
      facilityWorkingDays && facilityWorkingDays.length > 0
        ? facilityWorkingDays
        : organizationWorkingDays;

    if (!sourceWorkingDays || sourceWorkingDays.length === 0) return;

    const normalizedWorkingDays = dayOptions.map(day => {
      const found = sourceWorkingDays.find(
        (d: any) => String(d?.dayOfWeek) === String(day.value)
      );
      return {
        dayOfWeek: day.value,
        isWorking: found ? found.isWorking !== false : false,
      };
    });

    setRecord(prev => {
      const prevDays = prev?.workingDays ?? [];
      const same =
        prevDays.length === normalizedWorkingDays.length &&
        prevDays.every((d, i) =>
          d.dayOfWeek === normalizedWorkingDays[i].dayOfWeek &&
          d.isWorking === normalizedWorkingDays[i].isWorking
        );
      if (same) return prev;
      return {
        ...prev,
        workingDays: normalizedWorkingDays,
      };
    });
  }, [
    isEditMode,
    record?.facilityId,
    facilityListResponse,
    selectedFacilityFullObject,
    organizationDefinitions,
    dayOptionsKey,
  ]);

  useEffect(() => {
    if (!servicesByDepartmentList?.data) return;
    setRecord(prev => {
      const prevIds = prev?.allowedServiceIds ?? [];
      const nextIds =
        prevIds.length > 0
          ? Array.from(new Set([...prevIds, ...departmentServiceIds]))
          : departmentServiceIds;
      if (
        prevIds.length === nextIds.length &&
        prevIds.every((id: any) => nextIds.includes(id))
      ) {
        return prev;
      }
      return { ...prev, allowedServiceIds: nextIds };
    });
  }, [servicesByDepartmentList]);

  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <div className="availability-template-modal">
            <Row>
              <Col md={12}>
                <SectionContainer
                  title="Basic Information "
                  content={
                    <>

                      <Form fluid>
                        <Row>
                          <Col md={12}>
                            <MyInput
                              fieldName="templateName"
                              fieldType="text"
                              record={record}
                              setRecord={setRecord}
                              width="100%"
                              required
                            />
                          </Col>
                          <Col md={12}>
                            <MyInput
                              fieldName="status"
                              fieldType="select"
                              fieldLabel="Status"
                              record={record}
                              setRecord={setRecord}
                              width="100%"
                              isEnum
                              selectData={statusEnum ?? []}
                              selectDataLabel="label"
                              selectDataValue="value"
                              readOnly
                            />
                          </Col>
                        </Row>
                        <Row>
                          <Col md={12}>
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
                              width="100%"
                              required
                              disabled
                            />
                          </Col>
                          <Col md={12}>
                            <MyInput
                              width="100%"
                              fieldName="departmentId"
                              fieldLabel="Department"
                              fieldType="select"
                              selectData={departmentListResponse ?? []}
                              selectDataLabel="name"
                              selectDataValue="id"
                              record={record}
                              setRecord={setRecord}
                              menuMaxHeight={200}
                              required
                            />
                          </Col>
                        </Row>

                        <Row>
                          <Col md={12}>
                            <MyInput
                              fieldName="templateType"
                              record={record}
                              setRecord={setRecord}
                              fieldType='select'
                              selectData={templateTypeEnum ?? []}
                              selectDataLabel="label"
                              selectDataValue='value'
                              width="100%"
                              disabled
                            />
                          </Col>
                          <div className="block">
                            <Translate>Color</Translate>
                            <div className="color-picker-row">
                              <input
                                type="color"
                                value={currentColor}
                                onChange={e => {
                                  const nextColor = e.target.value;
                                  setCurrentColor(nextColor);
                                  setRecord(prev => ({ ...prev, templateColor: nextColor }));
                                }}
                              />
                            </div>
                          </div>
                        </Row>
                        <Row>
                          <Col md={12}>
                            <MyInput
                              fieldName="durationMinutes"
                              fieldLabel='duration'
                              fieldType="number"
                              record={record}
                              setRecord={setRecord}
                              width="100%"
                              rightAddon="min"
                              required
                            />
                          </Col>
                          <Col md={12}>
                            <MyInput
                              fieldName="versionNo"
                              fieldType="number"
                              record={record}
                              setRecord={setRecord}
                              width="100%"
                            />
                          </Col>
                        </Row>




                      </Form>

                    </>
                  }
                />
              </Col>
              <Col md={12}>
                <SectionContainer
                  title="Department Details"
                  content={
                    <>
                      <Form fluid>
                        <MyInput
                          width="100%"
                          fieldType="select"
                          fieldName="defaultServiceId"
                          selectData={servicesByDepartmentList?.data ?? []}
                          selectDataLabel="name"
                          selectDataValue="id"
                          record={record}
                          setRecord={setRecord}
                        />
                        <MyInput
                          width="100%"
                          fieldType="number"
                          fieldLabel="NumberOfResources"
                          fieldName="numberOfResourcesExpected"
                          record={record}
                          setRecord={setRecord}
                        />
                        <Row>
                          <Col md={12}>
                            <MyInput
                              width="100%"
                              fieldType="check"
                              fieldName="requirePractitioner"
                              record={record}
                              setRecord={setRecord}
                              showLabel={false}
                            />
                          </Col>
                          {record['requirePractitioner'] && (
                            <Col md={12}>
                              <MyInput
                                width="100%"
                                fieldType="select"
                                fieldName="defaultPractitioner"
                                selectData={practitionerListResponse?.data ?? []}
                                selectDataLabel="firstName"
                                selectDataValue="id"
                                record={record}
                                setRecord={setRecord}
                              />
                            </Col>
                          )}
                        </Row>
                        <MyInput
                          width="100%"
                          fieldType="check"
                          fieldName="requirePreAssesment"
                          record={record}
                          setRecord={setRecord}
                          showLabel={false}
                        />
                      </Form>
                    </>
                  }
                />
              </Col>
            </Row>

            <Row>
              <Col md={24}>
                <SectionContainer
                  title="Services Allowed"
                  content={
                    <Form fluid>
                      <Row>
                        {allServices.map((service: any) => {
                          const fieldName = `service_${service.id}`;
                          // const isChecked = selectedServiceIds.includes(service.id);
                          const isChecked = servicesByDepartmentList?.data?.some(s => s.id === service.id);
                          return (
                            <Col md={8} key={service.id}>
                              <MyInput
                                width="100%"
                                fieldType="check"
                                fieldName={fieldName}
                                record={{ [fieldName]: isChecked }}
                                setRecord={(next: any) => {
                                  const checked = Boolean(next[fieldName]);
                                  setRecord(prev => {
                                    const prevIds = prev?.allowedServiceIds ?? [];
                                    if (checked) {
                                      if (prevIds.includes(service.id)) return prev;
                                      return {
                                        ...prev,
                                        allowedServiceIds: [...prevIds, service.id]
                                      };
                                    }
                                    return {
                                      ...prev,
                                      allowedServiceIds: prevIds.filter(
                                        (id: any) => id !== service.id
                                      )
                                    };
                                  });
                                }}
                                showLabel={false}
                                label={service.name}
                              />
                            </Col>
                          );
                        })}
                      </Row>
                    </Form>
                  }
                />
              </Col>
            </Row>


            <SectionContainer
              title="Days"
              content={
                <Form fluid layout='inline'>
                  {dayOptions?.map(day => (
                    <MyInput
                      key={day.value}
                      width="13vw"
                      fieldName={day.value}
                      fieldType="check"
                      record={workingDaysRecord}
                      setRecord={setWorkingDaysRecord}
                      label={day.label}
                      showLabel={false}
                    />
                  ))}
                </Form>
              }
            />

            <Divider />

            <div className="days-header">
              <MyTab
                data={tabData()}
              />


              <div className="days-actions">
                <MyButton
                  appearance="subtle"
                  disabled={record?.id ? false : true}
                  onClick={() => setOpenPreviewSlotsModal(true)}
                >
                  <Translate>Preview slots</Translate>
                </MyButton>
                <MyButton onClick={() => setOpenAddResource(true)} prefixIcon={() => <FaPlus />} disabled={template?.id ? false : true}>Add Resource</MyButton>

              </div>
            </div>



            <PreviewSlotsModal
              open={openPreviewSlotsModal}
              onClose={() => setOpenPreviewSlotsModal(false)}
              templateName={record.name}
              step={record.step}
              channelsByDay={channelsByDay}
              availability={availability}
              slotsBeforeAfter={template.slotsBeforeAfter ?? 5}
            />

            <AddResourceModal
              open={openAddResource}
              setOpen={setOpenAddResource}
              // record={record}
              // setRecord={setRecord}
              mainTemplate={record}
              selectedDepartment={selectedDepartment}
              selectedFacility={selectedFacility}
            />

            <AddExceptionModal
              open={openAddExceptionModal}
              setOpen={setOpenAddExceptionModal}
              template={{}}
            />

          </div>
        );
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      actionButtonFunction={handleSaveMainInfo}
      hideActionBtn={record?.id}
      title={
        template?.id
          ? <Translate>Edit Availability Template</Translate>
          : <Translate>New Availability Template</Translate>
      }
      size="70vw"
      // content={
      //   <AddEditAvailabilityTemplate template={selectedTemplate} templatesData={templatesData} setTemplatesData={setTemplatesData} />
      // }
      content={conjureFormContent}
    />
  )
};

export default AddEditAvailabilityTemplate;

