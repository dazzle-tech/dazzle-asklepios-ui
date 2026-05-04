import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Divider, Form, Row, Col } from 'rsuite';
import { FaPlus } from 'react-icons/fa';

import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import MyModal from '@/components/MyModal/MyModal';
import MyTab from '@/components/MyTab';
import SectionContainer from '@/components/SectionsoContainer';

import AvailabilityDayGrid from './AvailabilityDayGrid';
import AddResourceModal from './AddResourceModal';
import PreviewSlotsModal from './PreviewSlotsModal';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatEnumString } from '@/utils';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

import {
  useGetActiveFacilitiesQuery,
  useGetFacilityByIdQuery,
} from '@/services/security/facilityService';
import {
  useLazyGetAppointableDepartmentsQuery,
  useLazyGetDepartmentByIdQuery,
} from '@/services/security/departmentService';
import { useLazyGetServicesByDepartmentQuery } from '@/services/setup/serviceService';
import { useLazyGetPractitionerByDepartmentQuery } from '@/services/setup/practitioner/PractitionerService';
import { useGetAllOrganizationDefinitionsQuery } from '@/services/system-configurations/organizationDefinitionService';
import {
  useCreateAvailabilityTemplateMutation,
  useGetAvailabilityTemplatesByParentTemplateIdQuery,
  useUpdateAvailabilityTemplateMutation,
} from '@/services/appointment/availabilityTemplateService';
import { useGetDepartmentServicesQuery } from '@/services/departmentServicesService';
import { useEnumOptions } from '@/services/enumsApi';

import { AvailabilityTemplateResponseVM } from '@/types/model-types-new';
import { newAvailabilityTemplateCreateDTO } from '@/types/model-types-constructor-new';

import './styles.less';

type AddEditAvailabilityTemplateProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  template: AvailabilityTemplateResponseVM;
  setTemplate: (template: AvailabilityTemplateResponseVM) => void;
};

type SelectOption = {
  label: string;
  value: string | number;
};

type AllowedService = {
  id: string | number | null;
  service: string | null;
};

type WorkingDay = {
  dayOfWeek: string | number;
  isWorking: boolean;
};

type PaginatedLoadParams = {
  page?: number;
  append?: boolean;
};

type DepartmentLoadParams = PaginatedLoadParams & {
  facilityId: string | number;
};

const PAGE_SIZE = 20;
const DEFAULT_TEMPLATE_COLOR = '#6982F0';

const AddEditAvailabilityTemplate: React.FC<AddEditAvailabilityTemplateProps> = ({
  open,
  setOpen,
  template,
  setTemplate,
}) => {
  const dispatch = useAppDispatch();

  const selectedFacility = useMemo(() => {
    const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
    return tenant?.selectedFacility || null;
  }, []);

  const isEditMode = Boolean(template?.id);

  const [availabilityTemplateRecord, setAvailabilityTemplateRecord] = useState<any>({});
  const [selectedTemplateColor, setSelectedTemplateColor] = useState(DEFAULT_TEMPLATE_COLOR);

  const [isPreviewSlotsModalOpen, setIsPreviewSlotsModalOpen] = useState(false);
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [resourceTemplateToEdit, setResourceTemplateToEdit] = useState<any>(null);

  const [modalOpenCount, setModalOpenCount] = useState(0);
  const [departmentChangeCount, setDepartmentChangeCount] = useState(0);

  const [departmentPage, setDepartmentPage] = useState(0);
  const [departments, setDepartments] = useState<any[]>([]);
  const [hasMoreDepartments, setHasMoreDepartments] = useState(false);
  const [nextDepartmentsLink, setNextDepartmentsLink] = useState<string | null>(null);

  const [servicePage, setServicePage] = useState(0);
  const [services, setServices] = useState<any[]>([]);
  const [hasMoreServices, setHasMoreServices] = useState(false);
  const [nextServicesLink, setNextServicesLink] = useState<string | null>(null);

  const [practitionerPage, setPractitionerPage] = useState(0);
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [hasMorePractitioners, setHasMorePractitioners] = useState(false);
  const [nextPractitionersLink, setNextPractitionersLink] = useState<string | null>(null);

  const hasUserChangedServicesRef = useRef(false);
  const hasUserChangedWorkingDaysRef = useRef(false);

  const { data: facilityList = [] } = useGetActiveFacilitiesQuery({});
  const { data: organizationDefinitions } = useGetAllOrganizationDefinitionsQuery({});
  const { data: selectedFacilityDetails } = useGetFacilityByIdQuery(selectedFacility?.id, {
    skip: !selectedFacility?.id,
  });

  const { data: departmentServiceMappings = [] } = useGetDepartmentServicesQuery(
    { departmentId: availabilityTemplateRecord?.departmentId },
    { skip: !availabilityTemplateRecord?.departmentId }
  );

  const { data: childTemplates } = useGetAvailabilityTemplatesByParentTemplateIdQuery(
    { parentTemplateId: availabilityTemplateRecord?.id },
    { skip: !availabilityTemplateRecord?.id }
  );

  const [loadDepartmentById, { data: selectedDepartmentDetails }] = useLazyGetDepartmentByIdQuery();
  const [loadDepartmentsQuery, { isFetching: isDepartmentLoading }] = useLazyGetAppointableDepartmentsQuery();
  const [loadServicesQuery, { isFetching: isServiceLoading }] = useLazyGetServicesByDepartmentQuery();
  const [loadPractitionersQuery, { isFetching: isPractitionerLoading }] = useLazyGetPractitionerByDepartmentQuery();

  const [createAvailabilityTemplate] = useCreateAvailabilityTemplateMutation();
  const [updateAvailabilityTemplate] = useUpdateAvailabilityTemplateMutation();

  const statusOptions = useEnumOptions('TemplateStatus');
  const templateTypeOptions = useEnumOptions('TemplateType');
  const dayOptions = useEnumOptions('DayOfWeek');
  const encounterReasonOptions = useEnumOptions('EncounterReason');

  const departmentOptions: SelectOption[] = useMemo(
    () => departments.map(department => ({ label: department.name, value: department.id })),
    [departments]
  );

  const serviceOptions: SelectOption[] = useMemo(
    () => services.map(service => ({ label: service.name, value: service.id })),
    [services]
  );

  const practitionerOptions: SelectOption[] = useMemo(
    () =>
      practitioners.map(practitioner => ({
        label: `${practitioner.firstName} ${practitioner.lastName}`,
        value: practitioner.id,
      })),
    [practitioners]
  );

  const selectedAllowedServiceValues = useMemo(() => {
    if (!Array.isArray(availabilityTemplateRecord?.allowedServices)) return [];
    return availabilityTemplateRecord.allowedServices
      .map((allowedService: AllowedService) => allowedService?.service)
      .filter((service: unknown): service is string => typeof service === 'string' && service.length > 0);
  }, [availabilityTemplateRecord?.allowedServices]);

  const appendUniqueById = useCallback((currentItems: any[], newItems: any[]) => {
    const existingIds = new Set(currentItems.map(item => item.id));
    return [...currentItems, ...newItems.filter(item => !existingIds.has(item.id))];
  }, []);

  const normalizeAllowedServices = useCallback((rawServices: unknown): AllowedService[] => {
    if (!Array.isArray(rawServices)) return [];
    return rawServices
      .map((allowedService: any) => {
        if (typeof allowedService === 'string') {
          return { id: null, service: allowedService };
        }
        if (allowedService && typeof allowedService === 'object' && 'service' in allowedService) {
          return {
            id: allowedService.id ?? null,
            service: allowedService.service ?? null,
          };
        }
        return null;
      })
      .filter(Boolean) as AllowedService[];
  }, []);

  const hasAnyWorkingDayEnabled = useCallback(
    (workingDays: unknown) => Array.isArray(workingDays) && workingDays.some((day: any) => day?.isWorking !== false),
    []
  );

  const normalizeWorkingDays = useCallback(
    (sourceWorkingDays: any[]): WorkingDay[] | null => {
      if (!dayOptions?.length || !Array.isArray(sourceWorkingDays) || sourceWorkingDays.length === 0) {
        return null;
      }
      return dayOptions.map(dayOption => {
        const matchedWorkingDay = sourceWorkingDays.find(
          (workingDay: any) => String(workingDay?.dayOfWeek) === String(dayOption.value)
        );
        return {
          dayOfWeek: dayOption.value,
          isWorking: matchedWorkingDay ? matchedWorkingDay.isWorking !== false : false,
        };
      });
    },
    [dayOptions]
  );

  const getDefaultWorkingDaysFromHierarchy = useCallback(() => {
    const selectedFacilityFromList = facilityList.find(
      (facility: any) => String(facility?.id) === String(selectedFacility?.id)
    );

    const facilityWorkingDays = selectedFacilityDetails?.workingDays ?? selectedFacilityFromList?.workingDays ?? [];

    const departmentWorkingDays =
      String(selectedDepartmentDetails?.id ?? '') === String(availabilityTemplateRecord?.departmentId ?? '')
        ? selectedDepartmentDetails?.workingDays ?? []
        : [];

    const organizationWorkingDays = organizationDefinitions?.[0]?.workingDays ?? [];

    if (
      availabilityTemplateRecord?.departmentId &&
      String(selectedDepartmentDetails?.id ?? '') !== String(availabilityTemplateRecord?.departmentId ?? '')
    ) {
      return null;
    }

    const sourceWorkingDays = hasAnyWorkingDayEnabled(departmentWorkingDays)
      ? departmentWorkingDays
      : hasAnyWorkingDayEnabled(facilityWorkingDays)
        ? facilityWorkingDays
        : organizationWorkingDays;

    return normalizeWorkingDays(sourceWorkingDays);
  }, [
    availabilityTemplateRecord?.departmentId,
    facilityList,
    hasAnyWorkingDayEnabled,
    normalizeWorkingDays,
    organizationDefinitions,
    selectedDepartmentDetails,
    selectedFacility?.id,
    selectedFacilityDetails,
  ]);

  const getAllowedServicesFromDepartment = useCallback((serviceMappings = departmentServiceMappings): AllowedService[] => {
    if (!Array.isArray(serviceMappings)) return [];
    return serviceMappings
      .map((serviceMapping: any) => serviceMapping?.service)
      .filter((service: unknown): service is string => typeof service === 'string' && service.length > 0)
      .map(service => ({ id: null, service }));
  }, [departmentServiceMappings]);

  const loadDepartments = useCallback(
    async ({ facilityId, page = 0, append = false }: DepartmentLoadParams) => {
      if (!facilityId) return;
      try {
        const response = await loadDepartmentsQuery({
          facilityId,
          page,
          size: PAGE_SIZE,
          sort: 'id,asc',
        }).unwrap();

        const departmentRows = response?.data ?? [];
        const nextLink = response?.links?.next ?? null;

        setHasMoreDepartments(Boolean(nextLink));
        setNextDepartmentsLink(nextLink);
        setDepartments(previousDepartments =>
          append ? appendUniqueById(previousDepartments, departmentRows) : departmentRows
        );
      } catch {
        if (!append) setDepartments([]);
      }
    },
    [appendUniqueById, loadDepartmentsQuery]
  );

  const loadServices = useCallback(
    async ({ page = 0, append = false }: PaginatedLoadParams = {}) => {
      if (!availabilityTemplateRecord?.departmentId) return;
      try {
        const response = await loadServicesQuery({
          sourceId: availabilityTemplateRecord.departmentId,
          page,
          size: PAGE_SIZE,
          sort: 'id,asc',
        }).unwrap();

        const serviceRows = response?.data ?? [];
        const nextLink = response?.links?.next ?? null;

        setHasMoreServices(Boolean(nextLink));
        setNextServicesLink(nextLink);
        setServices(previousServices => (append ? appendUniqueById(previousServices, serviceRows) : serviceRows));
      } catch {
        if (!append) setServices([]);
      }
    },
    [appendUniqueById, availabilityTemplateRecord?.departmentId, loadServicesQuery]
  );

  const loadPractitioners = useCallback(
    async ({ page = 0, append = false }: PaginatedLoadParams = {}) => {
      if (!availabilityTemplateRecord?.departmentId) return;
      try {
        const response = await loadPractitionersQuery({
          departmentId: availabilityTemplateRecord.departmentId,
          page,
          size: PAGE_SIZE,
          sort: 'id,asc',
        }).unwrap();

        const practitionerRows = response?.data ?? [];
        const nextLink = response?.links?.next ?? null;

        setHasMorePractitioners(Boolean(nextLink));
        setNextPractitionersLink(nextLink);
        setPractitioners(previousPractitioners =>
          append ? appendUniqueById(previousPractitioners, practitionerRows) : practitionerRows
        );
      } catch {
        if (!append) setPractitioners([]);
      }
    },
    [appendUniqueById, availabilityTemplateRecord?.departmentId, loadPractitionersQuery]
  );

  useEffect(() => {
    if (!open) return;

    setModalOpenCount(count => count + 1);
    setDepartmentChangeCount(0);
    hasUserChangedServicesRef.current = false;
    hasUserChangedWorkingDaysRef.current = false;

    if (isEditMode) {
      setAvailabilityTemplateRecord({
        ...template,
        facilityId: selectedFacility?.id,
        allowedServices: normalizeAllowedServices(template?.allowedServices),
      });
      setSelectedTemplateColor(template?.templateColor ?? DEFAULT_TEMPLATE_COLOR);
      return;
    }

    setAvailabilityTemplateRecord({
      ...newAvailabilityTemplateCreateDTO,
      facilityId: selectedFacility?.id,
      departmentId: null,
      allowedServices: [],
      workingDays: [],
    });
    setSelectedTemplateColor(DEFAULT_TEMPLATE_COLOR);
  }, [isEditMode, normalizeAllowedServices, open, selectedFacility?.id, template]);

  useEffect(() => {
    if (!open || !isEditMode || !template) return;
    setAvailabilityTemplateRecord({
      ...template,
      facilityId: selectedFacility?.id,
      allowedServices: normalizeAllowedServices(template?.allowedServices),
    });
    setSelectedTemplateColor(template?.templateColor ?? DEFAULT_TEMPLATE_COLOR);
  }, [isEditMode, normalizeAllowedServices, open, selectedFacility?.id, template]);

  useEffect(() => {
    if (availabilityTemplateRecord?.id) return;

    if (!availabilityTemplateRecord?.departmentId) {
      setAvailabilityTemplateRecord(previousRecord => ({
        ...previousRecord,
        durationMinutes: 0,
        defaultBufferBeforeMinutes: 0,
        defaultBufferAfterMinutes: 0,
        parallelCapacityValue: 1,
      }));
      return;
    }

    loadDepartmentById(availabilityTemplateRecord.departmentId)
      .unwrap()
      .then(departmentDetails => {
        setAvailabilityTemplateRecord(previousRecord => ({
          ...previousRecord,
          durationMinutes: departmentDetails?.defaultDurationMinutes,
          defaultBufferBeforeMinutes: departmentDetails?.defaultBufferBeforeMinutes,
          defaultBufferAfterMinutes: departmentDetails?.defaultBufferAfterMinutes,
          parallelCapacityValue: Number(departmentDetails?.parallelCapacityValue ?? 1),
        }));
      });
  }, [availabilityTemplateRecord?.departmentId, availabilityTemplateRecord?.id, loadDepartmentById]);

  useEffect(() => {
    if (!open) return;
    if (isEditMode) return;
    if (hasUserChangedWorkingDaysRef.current) return;
    if (!dayOptions?.length) return;

    const defaultWorkingDays = getDefaultWorkingDaysFromHierarchy();
    if (!defaultWorkingDays) return;

    setAvailabilityTemplateRecord(previousRecord => ({
      ...previousRecord,
      workingDays: defaultWorkingDays,
    }));
  }, [
    modalOpenCount,
    selectedFacilityDetails,
    facilityList,
    selectedDepartmentDetails,
    organizationDefinitions,
    availabilityTemplateRecord?.departmentId,
  ]);

  useEffect(() => {
    if (!open || isEditMode || hasUserChangedServicesRef.current) return;
    if (!availabilityTemplateRecord?.departmentId || departmentChangeCount === 0) return;

    const defaultAllowedServices = getAllowedServicesFromDepartment();
    if (defaultAllowedServices.length === 0) return;

    setAvailabilityTemplateRecord(previousRecord => ({
      ...previousRecord,
      allowedServices: defaultAllowedServices,
    }));
  }, [
    availabilityTemplateRecord?.departmentId,
    departmentChangeCount,
    getAllowedServicesFromDepartment,
    isEditMode,
    open,
  ]);

  useEffect(() => {
    if (!availabilityTemplateRecord?.facilityId) return;
    setDepartments([]);
    setDepartmentPage(0);
    loadDepartments({ facilityId: availabilityTemplateRecord.facilityId, page: 0 });
  }, [availabilityTemplateRecord?.facilityId, loadDepartments]);

  useEffect(() => {
    if (!availabilityTemplateRecord?.departmentId) return;
    setServices([]);
    setServicePage(0);
    loadServices({ page: 0 });
  }, [availabilityTemplateRecord?.departmentId, loadServices]);

  useEffect(() => {
    if (!availabilityTemplateRecord?.departmentId) return;
    setPractitioners([]);
    setPractitionerPage(0);
    loadPractitioners({ page: 0 });
  }, [availabilityTemplateRecord?.departmentId, loadPractitioners]);

  const handleDepartmentChange = useCallback(
    (nextRecord: any) => {
      if (isEditMode) {
        setAvailabilityTemplateRecord(previousRecord => ({ ...previousRecord, ...nextRecord }));
        return;
      }
      hasUserChangedServicesRef.current = false;
      setDepartmentChangeCount(count => count + 1);
      setAvailabilityTemplateRecord(previousRecord => ({
        ...previousRecord,
        ...nextRecord,
        allowedServices: [],
        defaultServiceId: null,
      }));
    },
    [isEditMode]
  );

  const dayOptionsDependencyKey = useMemo(
    () => (dayOptions ?? []).map(dayOption => `${dayOption.value}:${dayOption.label}`).join('|'),
    [dayOptions]
  );

  const workingDaysRecord = useMemo(() => {
    const workingDaysMap: Record<string, boolean> = {};
    if (!dayOptions || dayOptions.length === 0) return workingDaysMap;
    dayOptions.forEach(dayOption => {
      workingDaysMap[dayOption.value] = false;
    });
    (availabilityTemplateRecord?.workingDays ?? []).forEach((workingDay: WorkingDay) => {
      if (workingDay?.dayOfWeek !== undefined && workingDay?.dayOfWeek !== null) {
        workingDaysMap[workingDay.dayOfWeek] = workingDay.isWorking !== false;
      }
    });
    return workingDaysMap;
  }, [availabilityTemplateRecord?.workingDays, dayOptionsDependencyKey]);

  const handleWorkingDaysChange = useCallback(
    (nextWorkingDaysRecord: Record<string, boolean>) => {
      if (!dayOptions || dayOptions.length === 0) return;
      hasUserChangedWorkingDaysRef.current = true;
      const nextWorkingDays = dayOptions.map(dayOption => ({
        dayOfWeek: dayOption.value,
        isWorking: Boolean(nextWorkingDaysRecord[dayOption.value]),
      }));
      setAvailabilityTemplateRecord(previousRecord => ({
        ...previousRecord,
        workingDays: nextWorkingDays,
      }));
    },
    [dayOptions]
  );

  const extractErrorMessage = useCallback((response: any): string => {
    try {
      const message = response?.data?.message;
      return typeof message === 'string' ? message.replace(/^error\./i, '') : '';
    } catch {
      return '';
    }
  }, []);

  const handleAllowedServiceChange = useCallback((serviceValue: string, fieldName: string, nextRecord: any) => {
    const isChecked = Boolean(nextRecord[fieldName]);
    hasUserChangedServicesRef.current = true;

    setAvailabilityTemplateRecord(previousRecord => {
      const previousAllowedServices = Array.isArray(previousRecord?.allowedServices)
        ? previousRecord.allowedServices
        : [];
      const previousServiceValues = previousAllowedServices
        .map((allowedService: AllowedService) => allowedService?.service)
        .filter((service: unknown): service is string => typeof service === 'string' && service.length > 0);

      if (isChecked) {
        if (previousServiceValues.includes(serviceValue)) return previousRecord;
        return {
          ...previousRecord,
          allowedServices: [...previousAllowedServices, { id: null, service: serviceValue }],
        };
      }

      return {
        ...previousRecord,
        allowedServices: previousAllowedServices.filter(
          (allowedService: AllowedService) => allowedService?.service !== serviceValue
        ),
      };
    });
  }, []);

  const handleSaveMainInfo = useCallback(async () => {
    if (!availabilityTemplateRecord?.templateName?.trim()) {
      dispatch(notify({ msg: 'Template Name is required', sev: 'warning' }));
      return;
    }
    if (!availabilityTemplateRecord?.facilityId) {
      dispatch(notify({ msg: 'Facility is required', sev: 'warning' }));
      return;
    }
    if (!availabilityTemplateRecord?.templateType) {
      dispatch(notify({ msg: 'Template Type is required', sev: 'warning' }));
      return;
    }
    if (!availabilityTemplateRecord?.departmentId) {
      dispatch(notify({ msg: 'Department is required', sev: 'warning' }));
      return;
    }
    if (availabilityTemplateRecord?.requirePractitioner && !availabilityTemplateRecord?.defaultPractitionerId) {
      dispatch(notify({ msg: 'Default Practitioner is required', sev: 'warning' }));
      return;
    }

    const payload = {
      ...availabilityTemplateRecord,
      resourceId: availabilityTemplateRecord?.departmentId,
      numberOfResourcesExpected: Number(availabilityTemplateRecord.numberOfResourcesExpected),
      durationMinutes: Number(availabilityTemplateRecord?.durationMinutes),
      defaultBufferBeforeMinutes: Number(availabilityTemplateRecord?.defaultBufferBeforeMinutes),
      defaultBufferAfterMinutes: Number(availabilityTemplateRecord?.defaultBufferAfterMinutes),
      parallelCapacityValue: Number(availabilityTemplateRecord?.parallelCapacityValue ?? 1),
      allowedServices: Array.isArray(availabilityTemplateRecord?.allowedServices)
        ? availabilityTemplateRecord.allowedServices
        : [],
    };

    try {
      if (template?.id) {
        const updatedTemplate = await updateAvailabilityTemplate({ id: template.id, ...payload }).unwrap();
        setTemplate(updatedTemplate);
        dispatch(notify({ msg: 'Updated Successfully', sev: 'success' }));
        return;
      }
      const createdTemplate = await createAvailabilityTemplate(payload).unwrap();
      setTemplate(createdTemplate);
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    } catch (error) {
      const errorMessage = extractErrorMessage(error) || 'Save Failed';
      dispatch(notify({ msg: errorMessage, sev: 'warning' }));
    }
  }, [
    availabilityTemplateRecord,
    createAvailabilityTemplate,
    dispatch,
    extractErrorMessage,
    setTemplate,
    template?.id,
    updateAvailabilityTemplate,
  ]);

  const handleLoadMoreDepartments = useCallback(async () => {
    if (!nextDepartmentsLink || !availabilityTemplateRecord?.facilityId) return;
    const { page } = extractPaginationFromLink(nextDepartmentsLink);
    setDepartmentPage(page);
    await loadDepartments({
      facilityId: availabilityTemplateRecord.facilityId,
      page,
      append: true,
    });
  }, [availabilityTemplateRecord?.facilityId, loadDepartments, nextDepartmentsLink]);

  const handleLoadMoreServices = useCallback(async () => {
    if (!nextServicesLink) return;
    const { page } = extractPaginationFromLink(nextServicesLink);
    setServicePage(page);
    await loadServices({ page, append: true });
  }, [loadServices, nextServicesLink]);

  const handleLoadMorePractitioners = useCallback(async () => {
    if (!nextPractitionersLink) return;
    const { page } = extractPaginationFromLink(nextPractitionersLink);
    setPractitionerPage(page);
    await loadPractitioners({ page, append: true });
  }, [loadPractitioners, nextPractitionersLink]);

  const availabilityTemplateTabs = useMemo(
    () =>
      dayOptions.map(dayOption => ({
        title: formatEnumString(dayOption.value),
        content: (
          <AvailabilityDayGrid
            dayInclude={availabilityTemplateRecord?.workingDays?.find(
              (workingDay: WorkingDay) => workingDay.dayOfWeek === dayOption.value
            )?.isWorking}
            parentTemplate={availabilityTemplateRecord}
            templates={childTemplates}
            day={dayOption?.value}
            onEditTemplate={(templateToEdit: any) => {
              setResourceTemplateToEdit(templateToEdit);
              setIsAddResourceModalOpen(true);
            }}
          />
        ),
      })),
    [availabilityTemplateRecord, childTemplates, dayOptions]
  );

  const childTemplateList = useMemo(
    () => (Array.isArray(childTemplates) ? childTemplates : (childTemplates as any)?.data),
    [childTemplates]
  );

  const renderFormContent = useCallback(
    (stepNumber = 0) => {
      if (stepNumber !== 0) return null;

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
                          record={availabilityTemplateRecord}
                          setRecord={setAvailabilityTemplateRecord}
                          width="100%"
                          required
                        />
                      </Col>
                      <Col md={12}>
                        <MyInput
                          fieldName="status"
                          fieldType="select"
                          fieldLabel="Status"
                          record={availabilityTemplateRecord}
                          setRecord={setAvailabilityTemplateRecord}
                          width="100%"
                          isEnum
                          selectData={statusOptions ?? []}
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
                          selectData={facilityList ?? []}
                          fieldType="select"
                          selectDataLabel="name"
                          selectDataValue="id"
                          fieldName="facilityId"
                          record={availabilityTemplateRecord}
                          setRecord={setAvailabilityTemplateRecord}
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
                          record={availabilityTemplateRecord}
                          setRecord={handleDepartmentChange}
                          loading={isDepartmentLoading}
                          hasMore={hasMoreDepartments}
                          onFetchMore={handleLoadMoreDepartments}
                          menuMaxHeight={200}
                          disabled={availabilityTemplateRecord?.id}
                          required
                        />
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <MyInput
                          fieldName="templateType"
                          record={availabilityTemplateRecord}
                          setRecord={setAvailabilityTemplateRecord}
                          fieldType="select"
                          selectData={templateTypeOptions ?? []}
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
                            value={selectedTemplateColor}
                            onChange={event => {
                              const nextColor = event.target.value;
                              setSelectedTemplateColor(nextColor);
                              setAvailabilityTemplateRecord(previousRecord => ({
                                ...previousRecord,
                                templateColor: nextColor,
                              }));
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
                          record={availabilityTemplateRecord}
                          setRecord={setAvailabilityTemplateRecord}
                          width="100%"
                          rightAddon="min"
                        />
                      </Col>
                      <Col md={12}>
                        <MyInput
                          fieldName="parallelCapacityValue"
                          fieldLabel="Parallel Capacity Value"
                          fieldType="number"
                          record={availabilityTemplateRecord}
                          setRecord={setAvailabilityTemplateRecord}
                          width="100%"
                          min={1}
                        />
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <MyInput
                          fieldName="defaultBufferBeforeMinutes"
                          fieldLabel="Slot Before"
                          fieldType="number"
                          record={availabilityTemplateRecord}
                          setRecord={setAvailabilityTemplateRecord}
                          width="100%"
                        />
                      </Col>
                      <Col md={12}>
                        <MyInput
                          fieldLabel="Slot After"
                          fieldName="defaultBufferAfterMinutes"
                          fieldType="number"
                          record={availabilityTemplateRecord}
                          setRecord={setAvailabilityTemplateRecord}
                          width="100%"
                        />
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <MyInput
                          fieldName="versionNo"
                          fieldType="number"
                          record={availabilityTemplateRecord}
                          setRecord={setAvailabilityTemplateRecord}
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
                      key={`service-${availabilityTemplateRecord?.departmentId}`}
                      width="100%"
                      fieldType="selectPagination"
                      fieldLabel="Default Service"
                      fieldName="defaultServiceId"
                      selectData={serviceOptions}
                      selectDataLabel="label"
                      selectDataValue="value"
                      record={availabilityTemplateRecord}
                      setRecord={setAvailabilityTemplateRecord}
                      loading={isServiceLoading}
                      hasMore={hasMoreServices}
                      onFetchMore={handleLoadMoreServices}
                    />

                    <MyInput
                      width="100%"
                      fieldType="number"
                      fieldLabel="Number Of Resources"
                      fieldName="numberOfResourcesExpected"
                      record={availabilityTemplateRecord}
                      setRecord={setAvailabilityTemplateRecord}
                    />

                    <Row>
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="check"
                          fieldName="requirePractitioner"
                          record={availabilityTemplateRecord}
                          setRecord={setAvailabilityTemplateRecord}
                          showLabel={false}
                        />
                      </Col>

                      {availabilityTemplateRecord?.requirePractitioner && (
                        <Col md={12}>
                          <MyInput
                            key={`practitioner-${availabilityTemplateRecord?.departmentId}`}
                            width="100%"
                            fieldType="selectPagination"
                            fieldLabel="Default Practitioner"
                            fieldName="defaultPractitionerId"
                            selectData={practitionerOptions}
                            selectDataLabel="label"
                            selectDataValue="value"
                            record={availabilityTemplateRecord}
                            setRecord={setAvailabilityTemplateRecord}
                            loading={isPractitionerLoading}
                            hasMore={hasMorePractitioners}
                            onFetchMore={handleLoadMorePractitioners}
                          />
                        </Col>
                      )}
                    </Row>

                    <MyInput
                      width="100%"
                      fieldType="check"
                      fieldName="requirePreAssessment"
                      record={availabilityTemplateRecord}
                      setRecord={setAvailabilityTemplateRecord}
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
                      {encounterReasonOptions.map((encounterReason: any) => {
                        const serviceValue = encounterReason.value;
                        const fieldName = `service_${serviceValue}`;
                        const isChecked = selectedAllowedServiceValues.includes(serviceValue);

                        return (
                          <Col md={8} key={serviceValue}>
                            <MyInput
                              width="100%"
                              fieldType="check"
                              fieldName={fieldName}
                              record={{ [fieldName]: isChecked }}
                              setRecord={(nextRecord: any) => handleAllowedServiceChange(serviceValue, fieldName, nextRecord)}
                              showLabel={false}
                              label={encounterReason.label}
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
                {dayOptions?.map(dayOption => (
                  <MyInput
                    key={dayOption.value}
                    width="13vw"
                    fieldName={dayOption.value}
                    fieldType="check"
                    record={workingDaysRecord}
                    setRecord={handleWorkingDaysChange}
                    label={dayOption.label}
                    showLabel={false}
                  />
                ))}
              </Form>
            }
          />

          <Divider />

          <div className="days-header">
            <MyTab data={availabilityTemplateTabs} />

            <div className="days-actions">
              <MyButton
                appearance="subtle"
                disabled={!availabilityTemplateRecord?.id}
                onClick={() => setIsPreviewSlotsModalOpen(true)}
              >
                <Translate>Preview slots</Translate>
              </MyButton>

              <MyButton
                onClick={() => {
                  setResourceTemplateToEdit(null);
                  setIsAddResourceModalOpen(true);
                }}
                prefixIcon={() => <FaPlus />}
                disabled={!availabilityTemplateRecord?.id}
              >
                Add Resource
              </MyButton>
            </div>
          </div>

          <PreviewSlotsModal
            open={isPreviewSlotsModalOpen}
            onClose={() => setIsPreviewSlotsModalOpen(false)}
            templateName={availabilityTemplateRecord.templateName ?? availabilityTemplateRecord.name}
            step={availabilityTemplateRecord.durationMinutes ?? availabilityTemplateRecord.step}
            parentTemplate={availabilityTemplateRecord}
            templates={childTemplateList}
          />

          <AddResourceModal
            open={isAddResourceModalOpen}
            setOpen={(nextOpen: boolean) => {
              if (!nextOpen) setResourceTemplateToEdit(null);
              setIsAddResourceModalOpen(nextOpen);
            }}
            editRecord={resourceTemplateToEdit}
            mainTemplate={availabilityTemplateRecord}
            selectedFacility={selectedFacility}
          />
        </div>
      );
    },
    [
      availabilityTemplateRecord,
      availabilityTemplateTabs,
      childTemplateList,
      dayOptions,
      departmentOptions,
      encounterReasonOptions,
      facilityList,
      handleAllowedServiceChange,
      handleDepartmentChange,
      handleLoadMoreDepartments,
      handleLoadMorePractitioners,
      handleLoadMoreServices,
      handleWorkingDaysChange,
      hasMoreDepartments,
      hasMorePractitioners,
      hasMoreServices,
      isAddResourceModalOpen,
      isDepartmentLoading,
      isPractitionerLoading,
      isPreviewSlotsModalOpen,
      isServiceLoading,
      practitionerOptions,
      resourceTemplateToEdit,
      selectedAllowedServiceValues,
      selectedFacility,
      selectedTemplateColor,
      serviceOptions,
      statusOptions,
      templateTypeOptions,
      workingDaysRecord,
    ]
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      actionButtonFunction={handleSaveMainInfo}
      title={
        template?.id ? <Translate>Edit Availability Template</Translate> : <Translate>New Availability Template</Translate>
      }
      size="70vw"
      content={renderFormContent}
    />
  );
};

export default AddEditAvailabilityTemplate;