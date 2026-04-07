import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Tabs, Divider, Form, RadioGroup, Radio, Row, Col } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import './styles.less';
import AvailabilityDayGrid from './AvailabilityDayGrid';
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
import { useGetServicesByDepartmentQuery } from '@/services/setup/serviceService';
import { useGetAllPractitionersQuery, useGetPractitionerByDepartmentQuery } from '@/services/setup/practitioner/PractitionerService';
import { useEnumOptions } from '@/services/enumsApi';
import { AvailabilityTemplateResponseVM } from '@/types/model-types-new';
import { useGetAllOrganizationDefinitionsQuery } from '@/services/system-configurations/organizationDefinitionService';
import { newAvailabilityTemplateCreateDTO, newAvailabilityTemplateResponseVM } from '@/types/model-types-constructor-new';
import { useCreateAvailabilityTemplateMutation, useGetAvailabilityTemplateQuery, useGetAvailabilityTemplatesByParentTemplateIdQuery, useUpdateAvailabilityTemplateMutation } from '@/services/appointment/availabilityTemplateService';
import { formatEnumString } from '@/utils';
import AddResourceModal from './AddResourceModal';
import PreviewSlotsModal from './PreviewSlotsModal';
import { useGetDepartmentServicesQuery } from '@/services/departmentServicesService';




type AddEditAvailabilityTemplateProps = {
  template: AvailabilityTemplateResponseVM;
  
};

const AvailabilityTemplateDetailsSection: React.FC<AddEditAvailabilityTemplateProps> = ({ template }) => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector((s) => s.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;

  const appliedWorkingDaysFacilityIdRef = useRef<string | number | null>(null);
  const [record, setRecord] = useState<any>(
    { ...newAvailabilityTemplateResponseVM }
  );
  const [currentColor, setCurrentColor] = useState(record?.color || '#6982F0');
  const [openPreviewSlotsModal, setOpenPreviewSlotsModal] = useState(false);
  const [openAddExceptionModal, setOpenAddExceptionModal] = useState<boolean>(false);
  const [openAddResource, setOpenAddResource] = useState<boolean>(false);
  const [resourceToEdit, setResourceToEdit] = useState<any>(null);
  
  const {
    data: facilityListResponse,
    isLoading: isGettingFacilities,
    isFetching: isFetchingFacilities
  } = useGetActiveFacilitiesQuery({});
  const { data: organizationDefinitions } = useGetAllOrganizationDefinitionsQuery({});
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
  const { data: departmentServices = []} =
      useGetDepartmentServicesQuery(
        { departmentId: record?.departmentId },
        { skip: !record?.departmentId }
      );
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
  const { data: templates } = useGetAvailabilityTemplatesByParentTemplateIdQuery(
    {
      parentTemplateId: record?.id
    },
    {
      skip: !record?.id
    }

  );
   const { data: templateById } = useGetAvailabilityTemplateQuery(
    { id: template?.id },
    { skip: !template?.id }
  );
  const [create] = useCreateAvailabilityTemplateMutation();
  const [update] = useUpdateAvailabilityTemplateMutation();
  const statusEnum = useEnumOptions('TemplateStatus');
  const templateTypeEnum = useEnumOptions('TemplateType');
  const dayOptions = useEnumOptions('DayOfWeek');
   const daysEnum = useEnumOptions("DayOfWeek");
  const encounterReasonEnum = useEnumOptions("EncounterReason");
  const dayOptionsKey = useMemo(
    () => (dayOptions ?? []).map(d => `${d.value}:${d.label}`).join('|'),
    [dayOptions]
  );
  const workingDaysTouchedRef = useRef(false);
  const allowedServicesTouchedRef = useRef(false);
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

  const departmentServiceValues = useMemo(() => {
    if (!Array.isArray(departmentServices)) return [];
    return departmentServices
      .map((s: any) => s?.service)
      .filter((v: any) => typeof v === 'string' && v.length > 0);
  }, [departmentServices]);

  const departmentServiceValuesKey = useMemo(
    () => departmentServiceValues.join('|'),
    [departmentServiceValues]
  );
  
  const tabData = () => {
    let arr = [];
    {
      daysEnum.map((day, index) => (
        arr.push({
          title: formatEnumString(day.value),
          content:
            <>
              <AvailabilityDayGrid
                parentTemplate={record}
                templates={templates}
                day={day?.value}
                onEditTemplate={(templateToEdit) => {
                  setResourceToEdit(templateToEdit);
                  setOpenAddResource(true);
                }}
                readOnly
              />
            </>

        })
      ))
    }
    return arr;
  }

  

  // Effects
  useEffect(() => {
    if (template?.id) {
      const source: any = templateById ?? template;
      const rawAllowed = source?.allowedServices;
      const normalizedAllowedServices = Array.isArray(rawAllowed)
        ? rawAllowed
            .map((s: any) => {
              if (typeof s === 'string') return { id: null, service: s };
              if (s && typeof s === 'object' && 'service' in s) {
                return { id: s.id ?? null, service: s.service ?? null };
              }
              return null;
            })
            .filter(Boolean)
        : [];

      setRecord({
        ...source,
        facilityId: selectedFacility?.id,
        allowedServices: normalizedAllowedServices,
      });
    } else {
      setRecord({ ...newAvailabilityTemplateCreateDTO, facilityId: selectedFacility?.id });
    }
  }, [template, templateById]);

  
  useEffect(() => {
    workingDaysTouchedRef.current = false;
    appliedWorkingDaysFacilityIdRef.current = null;
  }, [record?.facilityId]);

  useEffect(() => {
    allowedServicesTouchedRef.current = false;
  }, [record?.departmentId, isEditMode]);

  

  useEffect(() => {
    if (isEditMode) return;
    if (allowedServicesTouchedRef.current) return;
    if (!departmentServiceValues || departmentServiceValues.length === 0) return;

    setRecord(prev => {
      const prevAllowed = Array.isArray(prev?.allowedServices) ? prev.allowedServices : [];
      if (prevAllowed.length > 0) return prev;
      return {
        ...prev,
        allowedServices: departmentServiceValues.map((service: string) => ({
          id: null,
          service
        })),
      };
    });
  }, [isEditMode, departmentServiceValuesKey]);

  useEffect(() => {
    if (!dayOptions || dayOptions.length === 0) return;
    if (!record?.facilityId) return;
    if (workingDaysTouchedRef.current) return;
    const hasWorkingDays =
      Array.isArray(record?.workingDays) && record.workingDays.length > 0;
    if (hasWorkingDays) return;

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
    record?.facilityId,
    facilityListResponse,
    selectedFacilityFullObject,
    organizationDefinitions,
    dayOptionsKey,
    record?.workingDays,
  ]);


  
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
                              disabled
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
                              disabled
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
                              disabled
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
                              disabled
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
                          disabled
                        />
                        <MyInput
                          width="100%"
                          fieldType="number"
                          fieldLabel="Number Of Resources"
                          fieldName="numberOfResourcesExpected"
                          record={record}
                          setRecord={setRecord}
                          disabled
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
                              disabled
                            />
                          </Col>
                          {record['requirePractitioner'] && (
                            <Col md={12}>
                              <MyInput
                                width="100%"
                                fieldType="select"
                                fieldLabel='Default Practitioner'
                                fieldName="defaultPractitionerId"
                                selectData={practitionerListResponse?.data ?? []}
                                selectDataLabel="firstName"
                                selectDataValue="id"
                                record={record}
                                setRecord={setRecord}
                                disabled
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
                          disabled
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
                              disabled
                                width="100%"
                                fieldType="check"
                                fieldName={fieldName}
                                record={{ [fieldName]: isChecked }}
                                setRecord={(next: any) => {
                                  const checked = Boolean(next[fieldName]);
                                  allowedServicesTouchedRef.current = true;
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
                                          { id: null, service: serviceValue }
                                        ]
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
                <Form fluid layout='inline'>
                  {dayOptions?.map(day => (
                    <MyInput
                    disabled
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
              selectedDepartment={selectedDepartment}
              selectedFacility={selectedFacility}
              readOnly
            />

            <AddExceptionModal
              open={openAddExceptionModal}
              setOpen={setOpenAddExceptionModal}
              template={{}}
            />

          </div>
        );
};

export default AvailabilityTemplateDetailsSection;

