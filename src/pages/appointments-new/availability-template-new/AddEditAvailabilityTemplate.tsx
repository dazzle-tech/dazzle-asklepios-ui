import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Divider, Form, Row, Col } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import './styles.less';
import AvailabilityDayGrid from './AvailabilityDayGrid';
import MyModal from '@/components/MyModal/MyModal';
import { useGetActiveFacilitiesQuery, useGetFacilityByIdQuery } from '@/services/security/facilityService';
import { useGetAppointableDepartmentsQuery, useGetDepartmentByIdQuery, useLazyGetAppointableDepartmentsQuery, useLazyGetDepartmentByIdQuery } from '@/services/security/departmentService';
import MyTab from '@/components/MyTab';
import { FaPlus } from "react-icons/fa";
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetServicesByDepartmentQuery, useLazyGetServicesByDepartmentQuery } from '@/services/setup/serviceService';
import { useGetPractitionerByDepartmentQuery, useLazyGetPractitionerByDepartmentQuery } from '@/services/setup/practitioner/PractitionerService';
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
import { extractPaginationFromLink } from '@/utils/paginationHelper';


type AddEditAvailabilityTemplateProps = {
  open: boolean;
  setOpen: any;
  template: AvailabilityTemplateResponseVM;
  setTemplate: (t: AvailabilityTemplateResponseVM) => void;
};

const AddEditAvailabilityTemplate: React.FC<AddEditAvailabilityTemplateProps> = ({ open, setOpen, template, setTemplate }) => {
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

  const deptSize = 20;
  const [deptPage, setDeptPage] = useState(0);
  const [allDepartments, setAllDepartments] = useState<any[]>([]);
  const [deptHasMore, setDeptHasMore] = useState(false);
  const [deptNextLink, setDeptNextLink] = useState<string | null>(null);

  const [triggerDepartments, { isFetching: isDeptLoading }] =
    useLazyGetAppointableDepartmentsQuery();

  const serviceSize = 20;
  const [servicePage, setServicePage] = useState(0);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [serviceHasMore, setServiceHasMore] = useState(false);
  const [serviceNextLink, setServiceNextLink] = useState<string | null>(null);

  const [triggerServices, { isFetching: isServiceLoading }] =
    useLazyGetServicesByDepartmentQuery();

  const practitionerSize = 20;
  const [practitionerPage, setPractitionerPage] = useState(0);
  const [allPractitioners, setAllPractitioners] = useState<any[]>([]);
  const [practitionerHasMore, setPractitionerHasMore] = useState(false);
  const [practitionerNextLink, setPractitionerNextLink] = useState<string | null>(null);

  const [triggerPractitioners, { isFetching: isPractitionerLoading }] =
    useLazyGetPractitionerByDepartmentQuery();

  const userChangedServicesRef = useRef(false);
  const userChangedWorkingDaysRef = useRef(false);

  const isEditMode = !!template?.id;

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: facilityListResponse } = useGetActiveFacilitiesQuery({});
  const { data: organizationDefinitions } = useGetAllOrganizationDefinitionsQuery({});
  const { data: selectedFacilityFullObject } = useGetFacilityByIdQuery(selectedFacility?.id, {
    skip: !selectedFacility?.id,
  });

  const { data: departmentServices = [] } = useGetDepartmentServicesQuery(
    { departmentId: record?.departmentId },
    { skip: !record?.departmentId }
  );


  const { data: templates } = useGetAvailabilityTemplatesByParentTemplateIdQuery(
    { parentTemplateId: record?.id },
    { skip: !record?.id }
  );
  const [getDepartment, { data: selectedDepartmentFullObject, isLoading }] = useLazyGetDepartmentByIdQuery();


  const [create] = useCreateAvailabilityTemplateMutation();
  const [update] = useUpdateAvailabilityTemplateMutation();

  const statusEnum = useEnumOptions('TemplateStatus');
  const templateTypeEnum = useEnumOptions('TemplateType');
  const dayOptions = useEnumOptions('DayOfWeek');
  const daysEnum = useEnumOptions('DayOfWeek');
  const encounterReasonEnum = useEnumOptions('EncounterReason');

  const departmentOptions = allDepartments.map(d => ({
    label: d.name,
    value: d.id
  }));
  const serviceOptions = allServices.map(s => ({
    label: s.name,
    value: s.id
  }));

  const practitionerOptions = allPractitioners.map(p => ({
    label: `${p.firstName} ${p.lastName}`,
    value: p.id
  }));

  const loadDepartments = async ({
    facilityId,
    page = 0,
    append = false
  }: {
    facilityId: any;
    page?: number;
    append?: boolean;
  }) => {
    if (!facilityId) return;

    try {
      const response = await triggerDepartments({
        facilityId,
        page,
        size: deptSize,
        sort: 'id,asc'
      }).unwrap();

      const rows = response?.data ?? [];
      const nextLink = response?.links?.next ?? null;

      setDeptHasMore(Boolean(nextLink));
      setDeptNextLink(nextLink);

      if (append) {
        setAllDepartments(prev => {
          const seen = new Set(prev.map(d => d.id));
          return [...prev, ...rows.filter(d => !seen.has(d.id))];
        });
      } else {
        setAllDepartments(rows);
      }
    } catch (e) {
      setAllDepartments([]);
    }
  };

  const loadServices = async ({ page = 0, append = false }) => {
    if (!record?.departmentId) return;

    try {
      const res = await triggerServices({
        sourceId: record.departmentId,
        page,
        size: serviceSize,
        sort: 'id,asc'
      }).unwrap();

      const rows = res?.data ?? [];
      const nextLink = res?.links?.next ?? null;

      setServiceHasMore(Boolean(nextLink));
      setServiceNextLink(nextLink);

      if (append) {
        setAllServices(prev => {
          const seen = new Set(prev.map(s => s.id));
          return [...prev, ...rows.filter(s => !seen.has(s.id))];
        });
      } else {
        setAllServices(rows);
      }

    } catch (e) {
      setAllServices([]);
    }
  };

  const loadPractitioners = async ({ page = 0, append = false }) => {
    if (!record?.departmentId) return;

    try {
      const res = await triggerPractitioners({
        departmentId: record.departmentId,
        page,
        size: practitionerSize,
        sort: 'id,asc'
      }).unwrap();

      const rows = res?.data ?? [];
      const nextLink = res?.links?.next ?? null;

      setPractitionerHasMore(Boolean(nextLink));
      setPractitionerNextLink(nextLink);

      if (append) {
        setAllPractitioners(prev => {
          const seen = new Set(prev.map(p => p.id));
          return [...prev, ...rows.filter(p => !seen.has(p.id))];
        });
      } else {
        setAllPractitioners(rows);
      }

    } catch (e) {
      setAllPractitioners([]);
    }
  };

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

  const hasAnyWorkingDayEnabled = (days: any) =>
    Array.isArray(days) && days.some((d: any) => d?.isWorking !== false);

  const normalizeWorkingDays = (source: any[]) => {
    if (!dayOptions || dayOptions.length === 0) return null;
    if (!Array.isArray(source) || source.length === 0) return null;

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

  const getWorkingDaysFromHierarchy = () => {
    const facilities = facilityListResponse ?? [];
    const selectedFacilityData = facilities.find(
      (f: any) => String(f?.id) === String(selectedFacility?.id)
    );

    const facilityWorkingDays =
      selectedFacilityFullObject?.workingDays ??
      selectedFacilityData?.workingDays ??
      [];
    const departmentWorkingDays =
      String(selectedDepartmentFullObject?.id ?? '') === String(record?.departmentId ?? '')
        ? selectedDepartmentFullObject?.workingDays ?? []
        : [];
    const organizationWorkingDays = organizationDefinitions?.[0]?.workingDays ?? [];

    if (
      record?.departmentId &&
      String(selectedDepartmentFullObject?.id ?? '') !== String(record?.departmentId ?? '')
    ) {
      return null;
    }

    const source =
      hasAnyWorkingDayEnabled(departmentWorkingDays)
        ? departmentWorkingDays
        : hasAnyWorkingDayEnabled(facilityWorkingDays)
          ? facilityWorkingDays
          : organizationWorkingDays;

    return normalizeWorkingDays(source);
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
      setRecord({
        ...template,
        facilityId: selectedFacility?.id,
        allowedServices: normalizeAllowedServices(template?.allowedServices),
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
    if (!open || !isEditMode || !template) return;
    setRecord(prev => ({
      ...template,
      facilityId: selectedFacility?.id,
      allowedServices: normalizeAllowedServices(template?.allowedServices),
    }));
  }, [template]);

  useEffect(() => {
    if (record?.id) {
      return;
    }
    if (!record?.departmentId) {
      setRecord(prev => ({
        ...prev,
        durationMinutes: 0,
        defaultBufferBeforeMinutes: 0,
        defaultBufferAfterMinutes: 0,
        parallelCapacityValue: 1
      }));
      return;
    }

    getDepartment(record.departmentId)
      .unwrap()
      .then(res => {
        setRecord(prev => ({
          ...prev,
          durationMinutes: res?.defaultDurationMinutes,
          defaultBufferBeforeMinutes: res?.defaultBufferBeforeMinutes,
          defaultBufferAfterMinutes: res?.defaultBufferAfterMinutes,
          parallelCapacityValue: Number(res?.parallelCapacityValue ?? 1)
        }));
      });

  }, [record?.departmentId]);


  useEffect(() => {
    if (!open) return;
    if (isEditMode) return;
    if (userChangedWorkingDaysRef.current) return;
    if (!dayOptions || dayOptions.length === 0) return;

    const workingDays = getWorkingDaysFromHierarchy();
    if (!workingDays) return;

    setRecord(prev => ({ ...prev, workingDays }));
  }, [
    openCount,
    selectedFacilityFullObject,
    facilityListResponse,
    selectedDepartmentFullObject,
    organizationDefinitions,
    record?.departmentId,
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

  useEffect(() => {
    if (!record?.facilityId) return;

    setAllDepartments([]);
    setDeptPage(0);

    loadDepartments({
      facilityId: record.facilityId,
      page: 0
    });

  }, [record?.facilityId]);

  useEffect(() => {
    if (!record?.departmentId) return;

    setAllServices([]);
    setServicePage(0);

    loadServices({ page: 0 });

  }, [record?.departmentId]);

  useEffect(() => {
    if (!record?.departmentId) return;

    setAllPractitioners([]);
    setPractitionerPage(0);

    loadPractitioners({ page: 0 });

  }, [record?.departmentId]);


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

  // extract the error message from the bad request that coming from the backend
  const extractErrorMessage = (response: any): string => {
    try {
      const msg = response?.data?.message;
      if (typeof msg === 'string') {
        return msg.replace(/^error\./i, '');
      }
      return '';
    } catch {
      return '';
    }
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
      defaultBufferBeforeMinutes: Number(record?.defaultBufferBeforeMinutes),
      defaultBufferAfterMinutes: Number(record?.defaultBufferAfterMinutes),
      parallelCapacityValue: Number(record?.parallelCapacityValue ?? 1),
      allowedServices: Array.isArray(record?.allowedServices) ? record.allowedServices : [],
    };

    try {
      if (template?.id) {
        const updated = await update({ id: template.id, ...payload }).unwrap();
        setTemplate(updated)
        dispatch(notify({ msg: 'Updated Successfully', sev: 'success' }));
      } else {
        const created = await create(payload).unwrap();
        setTemplate(created)
        dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
      }
    } catch (err) {
      const errorMsg = extractErrorMessage(err) || 'Save Failed';
      dispatch(notify({ msg: errorMsg, sev: 'warning' }));
    }
  };

  // ─── Tab Data ─────────────────────────────────────────────────────────────

  const tabData = () => {
    return daysEnum.map((day) => ({
      title: formatEnumString(day.value),
      content: (
        <AvailabilityDayGrid
          dayInclude={record?.workingDays?.find(d => d.dayOfWeek === day.value)?.isWorking}
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
                          <MyInput
                            width="100%"
                            fieldName="departmentId"
                            fieldLabel="Department"
                            fieldType="selectPagination"
                            selectData={departmentOptions}
                            selectDataLabel="label"
                            selectDataValue="value"
                            record={record}
                            setRecord={handleDepartmentChange}
                            loading={isDeptLoading}
                            hasMore={deptHasMore}
                            onFetchMore={async () => {
                              if (!deptNextLink || !record?.facilityId) return;

                              const { page } = extractPaginationFromLink(deptNextLink);
                              setDeptPage(page);

                              await loadDepartments({
                                facilityId: record.facilityId,
                                page,
                                append: true
                              });
                            }}
                            menuMaxHeight={200}
                            disabled={record?.id}
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
                            fieldName="parallelCapacityValue"
                            fieldLabel="Parallel Capacity Value"
                            fieldType="number"
                            record={record}
                            setRecord={setRecord}
                            width="100%"
                            min={1}
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col md={12}>
                          <MyInput
                            fieldName="defaultBufferBeforeMinutes"
                            fieldLabel='Slot Befor'
                            fieldType="number"
                            record={record}
                            setRecord={setRecord}
                            width="100%"
                          />
                        </Col>
                         <Col md={12}>
                          <MyInput
                            fieldLabel='Slot After'
                            fieldName="defaultBufferAfterMinutes"
                            fieldType="number"
                            record={record}
                            setRecord={setRecord}
                            width="100%"
                          />
                        </Col>
                      </Row>
                      <Row>
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
                        <Col md={12}>
                          <MyInput
                            width="100%"
                            fieldType="check"
                            fieldName="requireConfirmation"
                            record={record}
                            setRecord={setRecord}
                            showLabel={false}
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
                        key={`service-${record?.departmentId}`}
                        width="100%"
                        fieldType="selectPagination"
                        fieldLabel='Default Service'
                        fieldName="defaultServiceId"
                        selectData={serviceOptions}
                        selectDataLabel="label"
                        selectDataValue="value"
                        record={record}
                        setRecord={setRecord}
                        loading={isServiceLoading}
                        hasMore={serviceHasMore}
                        onFetchMore={async () => {
                          if (!serviceNextLink) return;

                          const { page } = extractPaginationFromLink(serviceNextLink);
                          setServicePage(page);

                          await loadServices({ page, append: true });
                        }}
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
                              key={`practitioner-${record?.departmentId}`}
                              width="100%"
                              fieldType="selectPagination"
                              fieldLabel="Default Practitioner"
                              fieldName="defaultPractitionerId"
                              selectData={practitionerOptions}
                              selectDataLabel="label"
                              selectDataValue="value"
                              record={record}
                              setRecord={setRecord}
                              loading={isPractitionerLoading}
                              hasMore={practitionerHasMore}
                              onFetchMore={async () => {
                                if (!practitionerNextLink) return;

                                const { page } = extractPaginationFromLink(practitionerNextLink);
                                setPractitionerPage(page);

                                await loadPractitioners({ page, append: true });
                              }}
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
