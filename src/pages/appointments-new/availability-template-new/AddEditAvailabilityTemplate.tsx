
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Divider, Form, Row, Col } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import './styles.less';
import AvailabilityDayGrid from './AvailabilityDayGrid';
import MyModal from '@/components/MyModal/MyModal';
import { useGetActiveFacilitiesQuery, useGetFacilityByIdQuery } from '@/services/security/facilityService';
import { useGetAppointableDepartmentsQuery, useGetDepartmentByIdQuery, useLazyGetDepartmentByIdQuery } from '@/services/security/departmentService';
import MyTab from '@/components/MyTab';
import { FaPlus } from "react-icons/fa";
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetServicesByDepartmentQuery } from '@/services/setup/serviceService';
import { useGetPractitionerByDepartmentQuery } from '@/services/setup/practitioner/PractitionerService';
import { AvailabilityTemplateResponseVM } from '@/types/model-types-new';
import { useGetAllOrganizationDefinitionsQuery } from '@/services/system-configurations/organizationDefinitionService';
import { newAvailabilityTemplateCreateDTO } from '@/types/model-types-constructor-new';
import { useCreateAvailabilityTemplateMutation, useGetAvailabilityTemplateQuery, useGetAvailabilityTemplatesByParentTemplateIdQuery, useUpdateAvailabilityTemplateMutation } from '@/services/appointment/availabilityTemplateService';
import { formatEnumString } from '@/utils';
import AddResourceModal from './AddResourceModal';
import PreviewSlotsModal from './PreviewSlotsModal';
import { useGetDepartmentServicesQuery } from '@/services/departmentServicesService';
import { useEnumOptions } from '@/services/enumsApi';
import { duration } from '@mui/material';


type AddEditAvailabilityTemplateProps = {
  open: boolean;
  setOpen: any;
  template: AvailabilityTemplateResponseVM;
};

const AddEditAvailabilityTemplate: React.FC<AddEditAvailabilityTemplateProps> = ({ open, setOpen, template }) => {
  const dispatch = useAppDispatch();
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;

  const [record, setRecord] = useState<any>({});
  const [currentColor, setCurrentColor] = useState('#6982F0');
  const [openPreviewSlotsModal, setOpenPreviewSlotsModal] = useState(false);
  const [openAddResource, setOpenAddResource] = useState<boolean>(false);
  const [resourceToEdit, setResourceToEdit] = useState<any>(null);

  const [openCount, setOpenCount] = useState(0);


  const [departmentChangeCount, setDepartmentChangeCount] = useState(0);

  const userChangedServicesRef = useRef(false);
  const userChangedWorkingDaysRef = useRef(false);

  const isEditMode = !!template?.id;

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: facilityListResponse } = useGetActiveFacilitiesQuery({});
  const { data: organizationDefinitions } = useGetAllOrganizationDefinitionsQuery({});
  const { data: selectedFacilityFullObject } = useGetFacilityByIdQuery(selectedFacility?.id, {
    skip: !selectedFacility?.id,
  });
  const { data: departmentListResponse } = useGetAppointableDepartmentsQuery(
    {
      facilityId: record?.facilityId,
      page: 0,
      size: 500,
      sort: 'id,asc'
    },
    { skip: !record?.facilityId }
  );
  const { data: departmentServices = [] } = useGetDepartmentServicesQuery(
    { departmentId: record?.departmentId },
    { skip: !record?.departmentId }
  );
  const { data: servicesByDepartmentList } = useGetServicesByDepartmentQuery(
    {
      sourceId: record?.departmentId,
      page: 0,
      size: 500,
      sort: 'id,asc'
    },
    { skip: !record?.departmentId }
  );
  const { data: practitionerListResponse } = useGetPractitionerByDepartmentQuery(
    {
      departmentId: record?.departmentId,
      page: 0,
      size: 500,
      sort: 'id,asc'
    },
    { skip: !record?.departmentId }
  );
  const { data: templates } = useGetAvailabilityTemplatesByParentTemplateIdQuery(
    { parentTemplateId: record?.id },
    { skip: !record?.id }
  );
  const { data: templateById } = useGetAvailabilityTemplateQuery(
    { id: template?.id },
    { skip: !template?.id }
  );
  
   const [getDepartment, { data, isLoading }] = useLazyGetDepartmentByIdQuery();
 

  const [create] = useCreateAvailabilityTemplateMutation();
  const [update] = useUpdateAvailabilityTemplateMutation();

  const statusEnum = useEnumOptions('TemplateStatus');
  const templateTypeEnum = useEnumOptions('TemplateType');
  const dayOptions = useEnumOptions('DayOfWeek');
  const daysEnum = useEnumOptions('DayOfWeek');
  const encounterReasonEnum = useEnumOptions('EncounterReason');


  const normalizeAllowedServices = (raw: any) => {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((s: any) => {
        if (typeof s === 'string') return { id: null, service: s };
        if (s && typeof s === 'object' && 'service' in s) return { id: s.id ?? null, service: s.service ?? null };
        return null;
      })
      .filter(Boolean);
  };

  const getWorkingDaysFromFacility = () => {
    if (!dayOptions || dayOptions.length === 0) return null;

    const facilities = facilityListResponse ?? [];
    const selectedFacilityData = facilities.find(
      (f: any) => String(f?.id) === String(selectedFacility?.id)
    );

    const facilityWorkingDays =
      selectedFacilityFullObject?.workingDays ??
      selectedFacilityData?.workingDays ??
      [];

    const organizationWorkingDays = organizationDefinitions?.[0]?.workingDays ?? [];

    const source =
      facilityWorkingDays && facilityWorkingDays.length > 0
        ? facilityWorkingDays
        : organizationWorkingDays;

    if (!source || source.length === 0) return null;

    return dayOptions.map(day => {
      const found = source.find(
        (d: any) => String(d?.dayOfWeek) === String(day.value)
      );
      return {
        dayOfWeek: day.value,
        isWorking: found ? found.isWorking !== false : false,
      };
    });
  };

  const getServicesFromDepartment = (services = departmentServices) => {
    if (!Array.isArray(services)) return [];
    return services
      .map((s: any) => s?.service)
      .filter((v: any) => typeof v === 'string' && v.length > 0)
      .map((service: string) => ({ id: null, service }));
  };


  useEffect(() => {
    if (!open) return;

    setOpenCount(c => c + 1);
    setDepartmentChangeCount(0);
    userChangedServicesRef.current = false;
    userChangedWorkingDaysRef.current = false;

    if (isEditMode) {
      const source: any = templateById ?? template;
      setRecord({
        ...source,
        facilityId: selectedFacility?.id,
        allowedServices: normalizeAllowedServices(source?.allowedServices),
      });
    } else {
      setRecord({
        ...newAvailabilityTemplateCreateDTO,
        facilityId: selectedFacility?.id,
        departmentId: null,
        allowedServices: [],
        workingDays: [],
      });
    }
  }, [open]);


  useEffect(() => {
    if (!open || !isEditMode || !templateById) return;
    setRecord(prev => ({
      ...templateById,
      facilityId: selectedFacility?.id,
      allowedServices: normalizeAllowedServices(templateById?.allowedServices),
    }));
  }, [templateById]);

   useEffect(() => {
  if (!record?.departmentId) {
    setRecord(prev => ({
      ...prev,
      durationMinutes: 0 
    }));
    return;
  }

  getDepartment(record.departmentId)
    .unwrap()
    .then(res => {
      setRecord(prev => ({
        ...prev,
        durationMinutes: res.defaultDurationMinutes
      }));
    });

}, [record?.departmentId]);


  useEffect(() => {
    if (!open) return;
    if (isEditMode) return;
    if (userChangedWorkingDaysRef.current) return;
    if (!dayOptions || dayOptions.length === 0) return;
    if (!selectedFacility?.id) return;

    const workingDays = getWorkingDaysFromFacility();
    if (!workingDays) return;

    setRecord(prev => ({ ...prev, workingDays }));
  }, [
    openCount,
    selectedFacilityFullObject,
    facilityListResponse,
    organizationDefinitions,
  ]);



  useEffect(() => {
    if (!open) return;
    if (isEditMode) return;
    if (userChangedServicesRef.current) return;
    if (!record?.departmentId) return;
    if (departmentChangeCount === 0) return;

    const services = getServicesFromDepartment();
    if (services.length === 0) return;

    setRecord(prev => ({ ...prev, allowedServices: services }));
  }, [
    departmentChangeCount,
    departmentServices,
  ]);


  const handleDepartmentChange = (next: any) => {
    if (isEditMode) {
      setRecord(prev => ({ ...prev, ...next }));
      return;
    }
    userChangedServicesRef.current = false;
    setDepartmentChangeCount(c => c + 1);
    setRecord(prev => ({
      ...prev,
      ...next,
      allowedServices: [],
      defaultServiceId: null,
    }));
  };


  const dayOptionsKey = useMemo(
    () => (dayOptions ?? []).map(d => `${d.value}:${d.label}`).join('|'),
    [dayOptions]
  );

  const workingDaysRecord = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!dayOptions || dayOptions.length === 0) return map;
    dayOptions.forEach(day => { map[day.value] = false; });
    (record?.workingDays ?? []).forEach((day: any) => {
      if (day?.dayOfWeek !== undefined && day?.dayOfWeek !== null) {
        map[day.dayOfWeek] = day.isWorking !== false;
      }
    });
    return map;
  }, [record?.workingDays, dayOptionsKey]);

  const setWorkingDaysRecord = (nextRecord: Record<string, boolean>) => {
    if (!dayOptions || dayOptions.length === 0) return;
    userChangedWorkingDaysRef.current = true;
    const nextWorkingDays = dayOptions.map(day => ({
      dayOfWeek: day.value,
      isWorking: !!nextRecord[day.value],
    }));
    setRecord(prev => ({ ...prev, workingDays: nextWorkingDays }));
  };


  const handleSaveMainInfo = async () => {
    if (!record?.templateName?.trim()) {
      dispatch(notify({ msg: 'Template Name is required', sev: 'warning' }));
      return;
    }
    if (!record?.facilityId) {
      dispatch(notify({ msg: 'Facility is required', sev: 'warning' }));
      return;
    }
    if (!record?.templateType) {
      dispatch(notify({ msg: 'Template Type is required', sev: 'warning' }));
      return;
    }
    if (!record?.departmentId) {
      dispatch(notify({ msg: 'Department is required', sev: 'warning' }));
      return;
    }
    if (record?.requirePractitioner && !record?.defaultPractitionerId) {
      dispatch(notify({ msg: 'Default Practitioner is required', sev: 'warning' }));
      return;
    }

    const payload = {
      ...record,
      resourceId: record?.departmentId,
      numberOfResourcesExpected: Number(record.numberOfResourcesExpected),
      durationMinutes: Number(record?.durationMinutes),
      allowedServices: Array.isArray(record?.allowedServices) ? record.allowedServices : [],
    };

    try {
      if (template?.id) {
        const updated = await update({ id: template.id, ...payload }).unwrap();
        setRecord(updated);
        dispatch(notify({ msg: 'Updated Successfully', sev: 'success' }));
      } else {
        const created = await create(payload).unwrap();
        setRecord(created);
        dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
      }
    } catch (err) {
      dispatch(notify({ msg: 'Failed to save', sev: 'warning' }));
    }
  };

  // ─── Tab Data ─────────────────────────────────────────────────────────────

  const tabData = () => {
    return daysEnum.map((day) => ({
      title: formatEnumString(day.value),
      content: (
        <AvailabilityDayGrid
          parentTemplate={record}
          templates={templates}
          day={day?.value}
          onEditTemplate={(templateToEdit) => {
            setResourceToEdit(templateToEdit);
            setOpenAddResource(true);
          }}
        />
      ),
    }));
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <div className="availability-template-modal">
            <Row>
              <Col md={12}>
                <SectionContainer
                  title="Basic Information"
                  content={
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
                            disabled
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
                          {/* ✅ استخدمنا setRecord custom عشان نتحكم باختيار الـ department */}
                          <MyInput
                            width="100%"
                            fieldName="departmentId"
                            fieldLabel="Department"
                            fieldType="select"
                            selectData={departmentListResponse?.data ?? []}
                            selectDataLabel="name"
                            selectDataValue="id"
                            record={record}
                            setRecord={handleDepartmentChange}
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
                            fieldType="select"
                            selectData={templateTypeEnum ?? []}
                            selectDataLabel="label"
                            selectDataValue="value"
                            width="100%"
                            disabled
                            required
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
                            fieldLabel="duration"
                            fieldType="number"
                            record={record}
                            setRecord={setRecord}
                            width="100%"
                            rightAddon="min"
                          />
                        </Col>
                        <Col md={12}>
                          <MyInput
                            fieldName="versionNo"
                            fieldType="number"
                            record={record}
                            setRecord={setRecord}
                            width="100%"
                            disabled
                          />
                        </Col>
                      </Row>
                    </Form>
                  }
                />
              </Col>
              <Col md={12}>
                <SectionContainer
                  title="Department Details"
                  content={
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
                        fieldLabel="Number Of Resources"
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
                              fieldLabel="Default Practitioner"
                              fieldName="defaultPractitionerId"
                              selectData={practitionerListResponse?.data ?? []}
                              selectDataLabel="firstName"
                              selectDataValue="id"
                              record={record}
                              setRecord={setRecord}
                              required
                            />
                          </Col>
                        )}
                      </Row>
                      <MyInput
                        width="100%"
                        fieldType="check"
                        fieldName="requirePreAssessment"
                        record={record}
                        setRecord={setRecord}
                        showLabel={false}
                      />
                    </Form>
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
                        {encounterReasonEnum.map((service: any) => {
                          const serviceValue = service.value;
                          const fieldName = `service_${serviceValue}`;
                          const selectedServiceValues = Array.isArray(record?.allowedServices)
                            ? record.allowedServices
                              .map((s: any) => s?.service)
                              .filter((v: any) => typeof v === 'string' && v.length > 0)
                            : [];
                          const isChecked = selectedServiceValues.includes(serviceValue);
                          return (
                            <Col md={8} key={serviceValue}>
                              <MyInput
                                width="100%"
                                fieldType="check"
                                fieldName={fieldName}
                                record={{ [fieldName]: isChecked }}
                                setRecord={(next: any) => {
                                  const checked = Boolean(next[fieldName]);
                                  userChangedServicesRef.current = true;
                                  setRecord(prev => {
                                    const prevAllowed = Array.isArray(prev?.allowedServices)
                                      ? prev.allowedServices
                                      : [];
                                    const prevValues = prevAllowed
                                      .map((s: any) => s?.service)
                                      .filter((v: any) => typeof v === 'string' && v.length > 0);
                                    if (checked) {
                                      if (prevValues.includes(serviceValue)) return prev;
                                      return {
                                        ...prev,
                                        allowedServices: [
                                          ...prevAllowed,
                                          { id: null, service: serviceValue },
                                        ],
                                      };
                                    }
                                    return {
                                      ...prev,
                                      allowedServices: prevAllowed.filter(
                                        (s: any) => s?.service !== serviceValue
                                      ),
                                    };
                                  });
                                }}
                                showLabel={false}
                                label={service.label}
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
                <Form fluid layout="inline">
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
              <MyTab data={tabData()} />

              <div className="days-actions">
                <MyButton
                  appearance="subtle"
                  disabled={!record?.id}
                  onClick={() => setOpenPreviewSlotsModal(true)}
                >
                  <Translate>Preview slots</Translate>
                </MyButton>
                <MyButton
                  onClick={() => {
                    setResourceToEdit(null);
                    setOpenAddResource(true);
                  }}
                  prefixIcon={() => <FaPlus />}
                  disabled={!record?.id}
                >
                  Add Resource
                </MyButton>
              </div>
            </div>

            <PreviewSlotsModal
              open={openPreviewSlotsModal}
              onClose={() => setOpenPreviewSlotsModal(false)}
              templateName={record.templateName ?? record.name}
              step={record.durationMinutes ?? record.step}
              parentTemplate={record}
              templates={Array.isArray(templates) ? templates : (templates as any)?.data}
            />

            <AddResourceModal
              open={openAddResource}
              setOpen={(next: boolean) => {
                if (!next) setResourceToEdit(null);
                setOpenAddResource(next);
              }}
              editRecord={resourceToEdit}
              mainTemplate={record}
              selectedFacility={selectedFacility}
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
      title={
        template?.id
          ? <Translate>Edit Availability Template</Translate>
          : <Translate>New Availability Template</Translate>
      }
      size="70vw"
      content={conjureFormContent}
    />
  );
};

export default AddEditAvailabilityTemplate;