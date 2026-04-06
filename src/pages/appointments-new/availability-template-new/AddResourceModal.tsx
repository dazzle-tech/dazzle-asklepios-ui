import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Form, Checkbox, CheckboxGroup, RadioGroup, Radio, Text, Row, Col } from 'rsuite';
import MyInput from '@/components/MyInput';
import './AddResourceModal.less';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { FaPlus, FaTrash } from "react-icons/fa";
import SectionContainer from '@/components/SectionsoContainer';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetActiveFacilitiesQuery, useGetFacilityByIdQuery } from '@/services/security/facilityService';
import { useGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { Department } from '@/types/model-types-new';
import { useGetAppointableServicesByLoggedInFacilityQuery, useGetServicesByDepartmentQuery } from '@/services/setup/serviceService';
import { useGetAppointablePractitionerByLoggedInFacilityQuery, useGetPractitionerByDepartmentQuery } from '@/services/setup/practitioner/PractitionerService';
import { newAvailabilityTemplateCreateDTO } from '@/types/model-types-constructor-new';
import { useCreateAvailabilityTemplateMutation, useUpdateAvailabilityTemplateMutation } from '@/services/appointment/availabilityTemplateService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { useGetDepartmentServicesQuery } from '@/services/departmentServicesService';
import { useGetAllActiveAppointableDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetAppointableCatalogsByLoggedInFacilityQuery } from '@/services/setup/catalog/catalogService';
import { useGetAllOrganizationDefinitionsQuery } from '@/services/system-configurations/organizationDefinitionService';
import { formatEnumString } from '@/utils';



const AddResourceModal = ({
  mainTemplate,
  open,
  setOpen,
  editRecord,
  selectedDepartment,
  selectedFacility
}: {
  mainTemplate: any;
  open: boolean;
  setOpen: any;
  editRecord?: any;
  selectedDepartment: any
  selectedFacility: any;
}) => {
  const dispatch = useAppDispatch();
  const [record, setRecord] = useState({ ...newAvailabilityTemplateCreateDTO });
  const prevTemplateTypeRef = useRef<any>(record?.templateType);
  useEffect(() => {
    if (!open) return;
    if (editRecord?.id) {
      const rawAllowed = editRecord?.allowedServices;
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
        ...editRecord,
        allowedServices: normalizedAllowedServices,
        facilityId: selectedFacility?.id ?? editRecord?.facilityId,
        departmentId: editRecord?.departmentId ?? mainTemplate?.departmentId
      });
      return;
    }
    setRecord({
      ...newAvailabilityTemplateCreateDTO,
      parentTemplateId: mainTemplate?.id,
      facilityId: selectedFacility?.id,
      departmentId: mainTemplate?.departmentId
    });
  }, [open, editRecord?.id, mainTemplate?.id, mainTemplate?.departmentId, selectedFacility?.id]);
  const [currentColor, setCurrentColor] = useState(mainTemplate?.color || '#6982F0');
  useEffect(() => {
    if (!open) return;
    if (editRecord?.id) {
      setCurrentColor(editRecord?.templateColor ?? mainTemplate?.color ?? '#6982F0');
    } else {
      setCurrentColor(mainTemplate?.color ?? '#6982F0');
    }
  }, [open, editRecord?.id, editRecord?.templateColor, mainTemplate?.color]);

  const statusEnum = useEnumOptions('TemplateStatus');
  const templateTypeEnum = useEnumOptions('TemplateType');
  const filteredtemplateTypeEnum = templateTypeEnum?.filter(
    option => option.value !== "DEPARTMENT"
  );
  // encounterReasonEnum no longer used here; services list is derived from parent template

  const {
    data: facilityListResponse,
    isLoading: isGettingFacilities,
    isFetching: isFetchingFacilities
  } = useGetActiveFacilitiesQuery({});
  const { data: organizationDefinitions } = useGetAllOrganizationDefinitionsQuery({});
  const { data: selectedFacilityFullObject } = useGetFacilityByIdQuery(selectedFacility?.id, {
    skip: !selectedFacility?.id
  });
  
  const { data: practitionersAppointableByLoggedOnFacility } = useGetAppointablePractitionerByLoggedInFacilityQuery({});
  const { data: diagnosticTestsAppointable} = useGetAllActiveAppointableDiagnosticTestsQuery({});
  const { data: catalogsAppointableByLoggedOnFacility } = useGetAppointableCatalogsByLoggedInFacilityQuery({});
  const { data: servicesAppointableByLoggedOnFacility } = useGetAppointableServicesByLoggedInFacilityQuery({});
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
  const { data: departmentServices = [] } =
    useGetDepartmentServicesQuery(
      { departmentId: record?.departmentId },
      { skip: !record?.departmentId }
    );

  const allowedServicesTouchedRef = useRef(false);
  const dayOptions = useEnumOptions('DayOfWeek');
  const dayOptionsKey = useMemo(
    () => (dayOptions ?? []).map(d => `${d.value}:${d.label}`).join('|'),
    [dayOptions]
  );
  const workingDaysTouchedRef = useRef(false);
  useEffect(() => {
    allowedServicesTouchedRef.current = false;
  }, [record?.departmentId]);

  useEffect(() => {
    workingDaysTouchedRef.current = false;
  }, [record?.facilityId]);

  useEffect(() => {
    if (!open) return;
    allowedServicesTouchedRef.current = false;
    workingDaysTouchedRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (parentTemplateAllowedServices.length === 0) return;
    setRecord(prev => {
      const prevAllowed = Array.isArray(prev?.allowedServices) ? prev.allowedServices : [];
      if (prevAllowed.length > 0) return prev;
      return {
        ...prev,
        allowedServices: parentTemplateAllowedServices,
      };
    });
  }, [open, parentTemplateAllowedServices]);

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

  const normalizeAllowedServices = (input: any) => {
    if (!Array.isArray(input)) return [];
    return input
      .map((s: any) => {
        if (typeof s === 'string') return { id: null, service: s };
        if (s && typeof s === 'object' && 'service' in s) {
          return { id: s.id ?? null, service: s.service ?? null };
        }
        return null;
      })
      .filter(Boolean);
  };

  const parentTemplateAllowedServices = useMemo(
    () => normalizeAllowedServices(mainTemplate?.allowedServices),
    [mainTemplate?.allowedServices]
  );

  const isEditMode = Boolean(record?.id);

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

  useEffect(() => {
    if (allowedServicesTouchedRef.current) return;
    if (!isEditMode) {
      if (parentTemplateAllowedServices.length === 0) return;
      setRecord(prev => {
        const prevAllowed = Array.isArray(prev?.allowedServices) ? prev.allowedServices : [];
        if (prevAllowed.length > 0) return prev;
        return {
          ...prev,
          allowedServices: parentTemplateAllowedServices,
        };
      });
      return;
    }

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
  }, [departmentServiceValuesKey, isEditMode, parentTemplateAllowedServices]);

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

  useEffect(() => {
    if (prevTemplateTypeRef.current === record?.templateType) return;
    if (!prevTemplateTypeRef.current) {
      prevTemplateTypeRef.current = record?.templateType;
      return;
    }
    prevTemplateTypeRef.current = record?.templateType;
    if(!record?.templateType)
    setRecord(prev => ({ ...prev, resourceId: undefined }));
  }, [record?.templateType]);
  useEffect(() => {
    console.log("resource record: ", record);
  },[record]);
  const conjureFormContent = () => (
    <Form fluid>
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
                        fieldName="templateType"
                        record={record}
                        setRecord={setRecord}
                        fieldType='select'
                        selectData={filteredtemplateTypeEnum ?? []}
                        selectDataLabel="label"
                        selectDataValue='value'
                        width="100%"
                      />
                    </Col>
                    {record.templateType === 'PRACTITIONER' ?
                    (
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldName="resourceId"
                        fieldLabel="Practitioner"
                        fieldType="select"
                        selectData={practitionersAppointableByLoggedOnFacility?.data ?? []}
                        selectDataLabel="firstName"
                        selectDataValue="id"
                        record={record}
                        setRecord={setRecord}
                        menuMaxHeight={200}
                        required
                      />
                    </Col>
                    ) : (record.templateType === 'SERVICE') ? (
                       <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldName="resourceId"
                        fieldLabel="Service"
                        fieldType="select"
                        selectData={servicesAppointableByLoggedOnFacility?.data ?? []}
                        selectDataLabel="name"
                        selectDataValue="id"
                        record={record}
                        setRecord={setRecord}
                        menuMaxHeight={200}
                        required
                      />
                    </Col>
                    ):(record.templateType === 'CATALOG') ? (
                       <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldName="resourceId"
                        fieldLabel="Catalog"
                        fieldType="select"
                        selectData={catalogsAppointableByLoggedOnFacility?.data ?? []}
                        selectDataLabel="name"
                        selectDataValue="id"
                        record={record}
                        setRecord={setRecord}
                        menuMaxHeight={200}
                        required
                      />
                    </Col>
                    ):
                    (record.templateType === 'DIAGNOSTIC_TEST') ? (
                       <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldName="resourceId"
                        fieldLabel="Diagnostic Test"
                        fieldType="select"
                        selectData={diagnosticTestsAppointable?.data ?? []}
                        selectDataLabel="name"
                        selectDataValue="id"
                        record={record}
                        setRecord={setRecord}
                        menuMaxHeight={200}
                        required
                      />
                    </Col>
                    ):
                    (<></>)
                  }
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
                          fieldName="defaultPractitionerId"
                          fieldLabel='Default Practitioner'
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
                    fieldName="requirePreAssessment"
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
                  {parentTemplateAllowedServices.map((service: any) => {
                    const serviceValue = service?.service ?? '';
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
                          label={formatEnumString(serviceValue)}
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
    </Form>
  );

  const [create] = useCreateAvailabilityTemplateMutation();
  const [update] = useUpdateAvailabilityTemplateMutation();
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

    // if (template?.id) {

    //   dispatch(notify({ msg: 'Updated Successfully', sev: 'success' }));
    //   setOpen(false);
    //   return;
    // }



    const payload = {
      ...record,
      numberOfResourcesExpected: Number(record.numberOfResourcesExpected),
      durationMinutes: Number(record?.durationMinutes),
      allowedServices: Array.isArray(record?.allowedServices)
        ? record.allowedServices
        : []
    };
    console.log("objectToAdd(resource): ", payload);
    const mutation = isEditMode
      ? update({ id: record.id, ...payload })
      : create(payload);
    mutation
      .unwrap()
      .then(() => {
        dispatch(
          notify({
            msg: isEditMode ? 'Updated Successfully' : 'Saved Successfully',
            sev: 'success'
          })
        );
        setOpen(false);
      })
      .catch((e) => {
        dispatch(notify({ msg: 'Error', sev: 'warning' }));
        console.log("error: ", e);
      });
    // setRecord(newTemplate);
    
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={isEditMode ? "Edit Resource" : "Add Resource"}
      size="md"
      content={conjureFormContent}
      actionButtonFunction={handleSaveMainInfo}
      actionButtonLabel={isEditMode ? "Save" : "Add"}

    />
  );
};

export default AddResourceModal;
