import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Form, Row, Col } from 'rsuite';
import MyInput from '@/components/MyInput';
import './AddResourceModal.less';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import SectionContainer from '@/components/SectionsoContainer';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import {
  useLazyGetAppointableServicesByLoggedInFacilityQuery,
  useLazyGetServicesByDepartmentQuery,
  useLazyGetServiceByIdQuery,
  useLazyGetServiceItemByIdQuery
} from '@/services/setup/serviceService';
import {
  useLazyGetAppointablePractitionerByLoggedInFacilityQuery,
  useLazyGetPractitionerByDepartmentQuery,
  useLazyGetPractitionerByIdQuery
} from '@/services/setup/practitioner/PractitionerService';
import { newAvailabilityTemplateCreateDTO } from '@/types/model-types-constructor-new';
import { useCreateAvailabilityTemplateMutation, useUpdateAvailabilityTemplateMutation } from '@/services/appointment/availabilityTemplateService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { useGetDepartmentServicesQuery } from '@/services/departmentServicesService';
import {
  useLazyGetAllActiveAppointableDiagnosticTestsQuery,
  useLazyGetDiagnosticTestByIdQuery
} from '@/services/setup/diagnosticTest/diagnosticTestService';
import {
  useLazyGetAppointableCatalogsByLoggedInFacilityQuery,
  useLazyGetCatalogByIdQuery
} from '@/services/setup/catalog/catalogService';
import { formatEnumString } from '@/utils';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { useLazyGetActiveAppointableRoomsByDepartmentIdQuery, useLazyGetRoomByIdQuery } from '@/services/setup/room/roomService';



const AddResourceModal = ({
  mainTemplate,
  open,
  setOpen,
  editRecord,
  selectedFacility,
  ...props
}: {
  mainTemplate: any;
  open: boolean;
  setOpen: any;
  editRecord?: any;
  selectedFacility: any;
  readOnly?: boolean;
}) => {
  const dispatch = useAppDispatch();
  const [record, setRecord] = useState({ ...newAvailabilityTemplateCreateDTO });
  const prevTemplateTypeRef = useRef<any>(record?.templateType);

 
  
  const [triggerPractitionersFacility, { isFetching: isPractitionerFacilityLoading }] =
    useLazyGetAppointablePractitionerByLoggedInFacilityQuery();

  // ─── Diagnostic Tests Pagination State ────────────────────────────────────
  const diagnosticTestSize = 20;
  const [allDiagnosticTests, setAllDiagnosticTests] = useState<any[]>([]);
  const [diagnosticTestHasMore, setDiagnosticTestHasMore] = useState(false);
  const [diagnosticTestNextLink, setDiagnosticTestNextLink] = useState<string | null>(null);

  const [triggerDiagnosticTests, { isFetching: isDiagnosticTestLoading }] =
    useLazyGetAllActiveAppointableDiagnosticTestsQuery();

  // ─── Catalogs Pagination State ─────────────────────────────────────────────
  const catalogSize = 20;
  const [allCatalogs, setAllCatalogs] = useState<any[]>([]);
  const [catalogHasMore, setCatalogHasMore] = useState(false);
  const [catalogNextLink, setCatalogNextLink] = useState<string | null>(null);

  const [triggerCatalogs, { isFetching: isCatalogLoading }] =
    useLazyGetAppointableCatalogsByLoggedInFacilityQuery();

  const roomSize = 20;
  const [roomPage, setRoomPage] = useState(0);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [roomHasMore, setRoomHasMore] = useState(false);
  const [roomNextLink, setRoomNextLink] = useState<string | null>(null);

  const [triggerRooms, { isFetching: isRoomLoading }] =
    useLazyGetActiveAppointableRoomsByDepartmentIdQuery();

  // ─── Services (appointable by facility) Pagination State ──────────────────
  const servicesFacilitySize = 20;
  const [allServicesFacility, setAllServicesFacility] = useState<any[]>([]);
  const [servicesFacilityHasMore, setServicesFacilityHasMore] = useState(false);
  const [servicesFacilityNextLink, setServicesFacilityNextLink] = useState<string | null>(null);

  const [triggerServicesFacility, { isFetching: isServicesFacilityLoading }] =
    useLazyGetAppointableServicesByLoggedInFacilityQuery();

  // ─── Services (by department) Pagination State ────────────────────────────
  const servicesDeptSize = 20;
  const [allServicesDept, setAllServicesDept] = useState<any[]>([]);
  const [servicesDeptHasMore, setServicesDeptHasMore] = useState(false);
  const [servicesDeptNextLink, setServicesDeptNextLink] = useState<string | null>(null);

  const [triggerServicesDept, { isFetching: isServicesDeptLoading }] =
    useLazyGetServicesByDepartmentQuery();

  // ─── Practitioners (by department) Pagination State ───────────────────────
  const practitionerDeptSize = 20;
  const [allPractitionersDept, setAllPractitionersDept] = useState<any[]>([]);
  const [practitionerDeptHasMore, setPractitionerDeptHasMore] = useState(false);
  const [practitionerDeptNextLink, setPractitionerDeptNextLink] = useState<string | null>(null);

  const [triggerPractitionersDept, { isFetching: isPractitionerDeptLoading }] =
    useLazyGetPractitionerByDepartmentQuery();

  
  const diagnosticTestOptions = allDiagnosticTests.map(d => ({
    label: d.name,
    value: d.id
  }));

  const catalogOptions = allCatalogs.map(c => ({
    label: c.name,
    value: c.id
  }));

  const servicesFacilityOptions = allServicesFacility.map(s => ({
    label: s.name,
    value: s.id
  }));

  const servicesDeptOptions = allServicesDept.map(s => ({
    label: s.name,
    value: s.id
  }));

  const practitionerDeptOptions = allPractitionersDept.map(p => ({
    label: `${p.firstName} ${p.lastName}`,
    value: p.id
  }));

  const roomOptions = allRooms.map(r => ({
    label: r.name,
    value: r.id
  }));


  const loadDiagnosticTests = async ({ page = 0, append = false }) => {
    try {
      const res = await triggerDiagnosticTests({
        page,
        size: diagnosticTestSize,
        sort: 'id,asc'
      }).unwrap();

      const rows = res?.data ?? [];
      const nextLink = res?.links?.next ?? null;

      setDiagnosticTestHasMore(Boolean(nextLink));
      setDiagnosticTestNextLink(nextLink);

      if (append) {
        setAllDiagnosticTests(prev => {
          const seen = new Set(prev.map(d => d.id));
          return [...prev, ...rows.filter(d => !seen.has(d.id))];
        });
      } else {
        setAllDiagnosticTests(rows);
      }
    } catch (e) {
      setAllDiagnosticTests([]);
    }
  };

  const loadCatalogs = async ({ page = 0, append = false }) => {
    try {
      const res = await triggerCatalogs({
        page,
        size: catalogSize,
        sort: 'id,asc'
      }).unwrap();

      const rows = res?.data ?? [];
      const nextLink = res?.links?.next ?? null;

      setCatalogHasMore(Boolean(nextLink));
      setCatalogNextLink(nextLink);

      if (append) {
        setAllCatalogs(prev => {
          const seen = new Set(prev.map(c => c.id));
          return [...prev, ...rows.filter(c => !seen.has(c.id))];
        });
      } else {
        setAllCatalogs(rows);
      }
    } catch (e) {
      setAllCatalogs([]);
    }
  };

  const loadRooms = async ({ page = 0, append = false }) => {
    if (!record?.departmentId) return;

    try {
      const res = await triggerRooms({
        departmentId: record.departmentId,
        page,
        size: roomSize,
        sort: 'id,asc'
      }).unwrap();

      const rows = res?.data ?? [];
      const nextLink = res?.links?.next ?? null;

      setRoomHasMore(Boolean(nextLink));
      setRoomNextLink(nextLink);

      if (append) {
        setAllRooms(prev => {
          const seen = new Set(prev.map(r => r.id));
          return [...prev, ...rows.filter(r => !seen.has(r.id))];
        });
      } else {
        setAllRooms(rows);
      }

    } catch (e) {
      console.error(e);
      setAllRooms([]);
    }
  };

  const loadServicesFacility = async ({ page = 0, append = false }) => {
    try {
      const res = await triggerServicesFacility({
        page,
        size: servicesFacilitySize,
        sort: 'id,asc'
      }).unwrap();

      const rows = res?.data ?? [];
      const nextLink = res?.links?.next ?? null;

      setServicesFacilityHasMore(Boolean(nextLink));
      setServicesFacilityNextLink(nextLink);

      if (append) {
        setAllServicesFacility(prev => {
          const seen = new Set(prev.map(s => s.id));
          return [...prev, ...rows.filter(s => !seen.has(s.id))];
        });
      } else {
        setAllServicesFacility(rows);
      }
    } catch (e) {
      setAllServicesFacility([]);
    }
  };

  const loadServicesDept = async ({ page = 0, append = false }) => {
    if (!record?.departmentId) return;
    try {
      const res = await triggerServicesDept({
        sourceId: record.departmentId,
        page,
        size: servicesDeptSize,
        sort: 'id,asc'
      }).unwrap();

      const rows = res?.data ?? [];
      const nextLink = res?.links?.next ?? null;

      setServicesDeptHasMore(Boolean(nextLink));
      setServicesDeptNextLink(nextLink);

      if (append) {
        setAllServicesDept(prev => {
          const seen = new Set(prev.map(s => s.id));
          return [...prev, ...rows.filter(s => !seen.has(s.id))];
        });
      } else {
        setAllServicesDept(rows);
      }
    } catch (e) {
      setAllServicesDept([]);
    }
  };

  const loadPractitionersDept = async ({ page = 0, append = false }) => {
    if (!record?.departmentId) return;
    try {
      const res = await triggerPractitionersDept({
        departmentId: record.departmentId,
        page,
        size: practitionerDeptSize,
        sort: 'id,asc'
      }).unwrap();

      const rows = res?.data ?? [];
      const nextLink = res?.links?.next ?? null;

      setPractitionerDeptHasMore(Boolean(nextLink));
      setPractitionerDeptNextLink(nextLink);

      if (append) {
        setAllPractitionersDept(prev => {
          const seen = new Set(prev.map(p => p.id));
          return [...prev, ...rows.filter(p => !seen.has(p.id))];
        });
      } else {
        setAllPractitionersDept(rows);
      }
    } catch (e) {
      setAllPractitionersDept([]);
    }
  };

  useEffect(() => {
    if (!open) return;
    loadDiagnosticTests({ page: 0 });
    loadCatalogs({ page: 0 });
    loadServicesFacility({ page: 0 });
  }, [open]);

  useEffect(() => {
    if (!record?.departmentId) return;
    setAllServicesDept([]);
    loadServicesDept({ page: 0 });

    setAllPractitionersDept([]);
    loadPractitionersDept({ page: 0 });

    setAllRooms([]);
    setRoomPage(0);
    loadRooms({ page: 0 });
  }, [record?.departmentId]);



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
        departmentId: editRecord?.departmentId ?? mainTemplate?.departmentId,
        workingDays: Array.isArray(editRecord?.workingDays) ? editRecord.workingDays : [],
        parallelCapacityValue: Number(
          editRecord?.parallelCapacityValue ??
          mainTemplate?.parallelCapacityValue ??
          1
        )
      });
      workingDaysTouchedRef.current = false;
      return;
    }
    setRecord({
      ...newAvailabilityTemplateCreateDTO,
      parentTemplateId: mainTemplate?.id,
      facilityId: selectedFacility?.id,
      departmentId: mainTemplate?.departmentId,
      workingDays: mainTemplate?.workingDays ?? [],
      parallelCapacityValue: Number(mainTemplate?.parallelCapacityValue ?? 1)
    });
    applyWorkingDays(mainTemplate?.workingDays ?? []);
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

  const {
    data: facilityListResponse,
    isLoading: isGettingFacilities,
    isFetching: isFetchingFacilities
  } = useGetActiveFacilitiesQuery({});
  const [getPractitioner] = useLazyGetPractitionerByIdQuery();
  const [getDiagnosticTest] = useLazyGetDiagnosticTestByIdQuery();
  const [getCatalog] = useLazyGetCatalogByIdQuery();
  const [getService] = useLazyGetServiceByIdQuery();
  const [getRoom] = useLazyGetRoomByIdQuery();

  useEffect(() => {
    if (!record?.resourceId) {
      setRecord(prev => ({
        ...prev,
        durationMinutes: 0,
        parallelCapacityValue: Number(mainTemplate?.parallelCapacityValue ?? 1),
        defaultPractitionerId: undefined
      }));
      applyWorkingDays(mainTemplate?.workingDays ?? []);
      return;
    }

    if (record?.templateType === "PRACTITIONER") {
      getPractitioner(record.resourceId)
        .unwrap()
        .then(res => {
          applyWorkingDays(res?.workingDays ?? mainTemplate?.workingDays ?? []);
          setRecord(prev => ({
            ...prev,
            durationMinutes: res.defaultDurationMinutes,
            parallelCapacityValue: Number(res?.parallelCapacityValue ?? 1),
            defaultPractitionerId: res?.id
          }));
        })
        .catch(() => {
          applyWorkingDays(mainTemplate?.workingDays ?? []);
        });
    } else if (record?.templateType === 'DIAGNOSTIC_TEST') {
      getDiagnosticTest(String(record.resourceId))
        .unwrap()
        .then(res => {
          applyWorkingDays(mainTemplate?.workingDays ?? []);
          setRecord(prev => ({
            ...prev,
            durationMinutes: res?.data.defaultDurationMinutes,
            parallelCapacityValue: Number(res?.data?.parallelCapacityValue ?? 1)
          }));
        });
    } else if (record?.templateType === 'CATALOG') {
      getCatalog(record.resourceId)
        .unwrap()
        .then(res => {
          setRecord(prev => ({
            ...prev,
            durationMinutes: res.defaultDurationMinutes,
            parallelCapacityValue: Number(res?.parallelCapacityValue ?? 1)
          }));
        });
    } else if (record?.templateType === 'SERVICE') {
      getService(record.resourceId)
        .unwrap()
        .then(res => {
          setRecord(prev => ({
            ...prev,
            durationMinutes: res.defaultDurationMinutes,
            parallelCapacityValue: Number(res?.parallelCapacityValue ?? 1)
          }));
        });
    }
    else if (record?.templateType === 'ROOM') {
      getRoom({ id: record.resourceId })
        .unwrap()
        .then(res => {
          setRecord(prev => ({
            ...prev,
            durationMinutes: res.defaultDurationMinutes,
            parallelCapacityValue: Number(res?.parallelCapacityValue ?? 1)
          }));
        });
    }

  }, [record?.resourceId, record?.templateType, dayOptionsKey, mainTemplate?.workingDays]);

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
    if (editRecord?.id) {
      applyWorkingDays(editRecord?.workingDays ?? []);
    } else {
      applyWorkingDays(mainTemplate?.workingDays ?? []);
    }
  }, [open]);

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

  const normalizeWorkingDays = (sourceWorkingDays: any[] = []) => {
    if (!dayOptions || dayOptions.length === 0) return [];

    return dayOptions.map(day => {
      const found = sourceWorkingDays.find(
        (d: any) => String(d?.dayOfWeek) === String(day.value)
      );

      return {
        dayOfWeek: day.value,
        isWorking: found ? found.isWorking !== false : false,
      };
    });
  };

  const applyWorkingDays = (sourceWorkingDays: any[] = []) => {
    if (!dayOptions || dayOptions.length === 0) return;

    const normalizedWorkingDays = normalizeWorkingDays(sourceWorkingDays);

    workingDaysTouchedRef.current = false;
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

  useEffect(() => {
    if (prevTemplateTypeRef.current === record?.templateType) return;
    if (!prevTemplateTypeRef.current) {
      prevTemplateTypeRef.current = record?.templateType;
      return;
    }
    prevTemplateTypeRef.current = record?.templateType;
    workingDaysTouchedRef.current = false;
    setRecord(prev => ({
      ...prev,
      resourceId: undefined,
      defaultPractitionerId: undefined,
      workingDays: normalizeWorkingDays(mainTemplate?.workingDays ?? []),
      requirePractitioner: record?.templateType === 'PRACTITIONER' ? true : false
    }));
  }, [record?.templateType]);

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
                        disabled={props?.readOnly}
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
                        fieldName="templateType"
                        record={record}
                        setRecord={setRecord}
                        fieldType='select'
                        selectData={filteredtemplateTypeEnum ?? []}
                        selectDataLabel="label"
                        selectDataValue='value'
                        width="100%"
                        disabled={props?.readOnly}
                        required
                      />
                    </Col>
                    {record.templateType === 'PRACTITIONER' ? (
                      <Col md={12}>
                         <MyInput
                          width="100%"
                          fieldType="selectPagination"
                         fieldName="resourceId"
                          fieldLabel="Practitioner"
                          selectData={practitionerDeptOptions}
                          selectDataLabel="label"
                          selectDataValue="value"
                          record={record}
                          setRecord={setRecord}
                          loading={isPractitionerDeptLoading}
                          hasMore={practitionerDeptHasMore}
                          onFetchMore={async () => {
                            if (!practitionerDeptNextLink) return;
                            const { page } = extractPaginationFromLink(practitionerDeptNextLink);
                            await loadPractitionersDept({ page, append: true });
                          }}
                           menuMaxHeight={200}
                          disabled={props?.readOnly}
                          required
                        />
                      </Col>
                    ) : record.templateType === 'SERVICE' ? (
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldName="resourceId"
                          fieldLabel="Service"
                          fieldType="selectPagination"
                          selectData={servicesFacilityOptions}
                          selectDataLabel="label"
                          selectDataValue="value"
                          record={record}
                          setRecord={setRecord}
                          loading={isServicesFacilityLoading}
                          hasMore={servicesFacilityHasMore}
                          onFetchMore={async () => {
                            if (!servicesFacilityNextLink) return;
                            const { page } = extractPaginationFromLink(servicesFacilityNextLink);
                            await loadServicesFacility({ page, append: true });
                          }}
                          menuMaxHeight={200}
                          required
                          disabled={props?.readOnly}
                        />
                      </Col>
                    ) : record.templateType === 'CATALOG' ? (
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldName="resourceId"
                          fieldLabel="Catalog"
                          fieldType="selectPagination"
                          selectData={catalogOptions}
                          selectDataLabel="label"
                          selectDataValue="value"
                          record={record}
                          setRecord={setRecord}
                          loading={isCatalogLoading}
                          hasMore={catalogHasMore}
                          onFetchMore={async () => {
                            if (!catalogNextLink) return;
                            const { page } = extractPaginationFromLink(catalogNextLink);
                            await loadCatalogs({ page, append: true });
                          }}
                          menuMaxHeight={200}
                          required
                          disabled={props?.readOnly}
                        />
                      </Col>
                    ) : record.templateType === 'DIAGNOSTIC_TEST' ? (
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldName="resourceId"
                          fieldLabel="Diagnostic Test"
                          fieldType="selectPagination"
                          selectData={diagnosticTestOptions}
                          selectDataLabel="label"
                          selectDataValue="value"
                          record={record}
                          setRecord={setRecord}
                          loading={isDiagnosticTestLoading}
                          hasMore={diagnosticTestHasMore}
                          onFetchMore={async () => {
                            if (!diagnosticTestNextLink) return;
                            const { page } = extractPaginationFromLink(diagnosticTestNextLink);
                            await loadDiagnosticTests({ page, append: true });
                          }}
                          menuMaxHeight={200}
                          required
                          disabled={props?.readOnly}
                        />
                      </Col>
                    )
                      : record.templateType === 'ROOM' ? (
                        <Col md={12}>
                          <MyInput
                            key={`room-${record?.departmentId}`}
                            width="100%"
                            fieldType="selectPagination"
                            fieldLabel="Room"
                            fieldName="resourceId"
                            selectData={roomOptions}
                            selectDataLabel="label"
                            selectDataValue="value"
                            record={record}
                            setRecord={setRecord}
                            loading={isRoomLoading}
                            hasMore={roomHasMore}
                            onFetchMore={async () => {
                              if (!roomNextLink) return;

                              const { page } = extractPaginationFromLink(roomNextLink);
                              setRoomPage(page);

                              await loadRooms({ page, append: true });
                            }}
                          />
                        </Col>
                      ) : (
                        <></>
                      )}
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
                        disabled={props?.readOnly}
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
                        disabled={props?.readOnly}
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
                    key={`service-dept-${record?.departmentId}`}
                    width="100%"
                    fieldType="selectPagination"
                    fieldName="defaultServiceId"
                    selectData={servicesDeptOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={record}
                    setRecord={setRecord}
                    loading={isServicesDeptLoading}
                    hasMore={servicesDeptHasMore}
                    onFetchMore={async () => {
                      if (!servicesDeptNextLink) return;
                      const { page } = extractPaginationFromLink(servicesDeptNextLink);
                      await loadServicesDept({ page, append: true });
                    }}
                    disabled={props?.readOnly}
                  />
                  <MyInput
                    width="100%"
                    fieldType="number"
                    fieldLabel="Number Of Resources"
                    fieldName="numberOfResourcesExpected"
                    record={record}
                    setRecord={setRecord}
                    disabled={props?.readOnly}
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
                        disabled={props?.readOnly || record?.templateType === 'PRACTITIONER'}
                      />
                    </Col>
                    {record['requirePractitioner'] && (
                      <Col md={12}>
                        <MyInput
                          key={`practitioner-dept-${record?.departmentId}`}
                          width="100%"
                          fieldType="selectPagination"
                          fieldName="defaultPractitionerId"
                          fieldLabel='Default Practitioner'
                          selectData={practitionerDeptOptions}
                          selectDataLabel="label"
                          selectDataValue="value"
                          record={record}
                          setRecord={setRecord}
                          loading={isPractitionerDeptLoading}
                          hasMore={practitionerDeptHasMore}
                          onFetchMore={async () => {
                            if (!practitionerDeptNextLink) return;
                            const { page } = extractPaginationFromLink(practitionerDeptNextLink);
                            await loadPractitionersDept({ page, append: true });
                          }}
                          disabled={props?.readOnly || record?.templateType === 'PRACTITIONER'}
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
                    disabled={props?.readOnly}
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
                          disabled={props?.readOnly}
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
                disabled={props?.readOnly}
              />
            ))}
          </Form>
        }
      />
    </Form>
  );

  const [create] = useCreateAvailabilityTemplateMutation();
  const [update] = useUpdateAvailabilityTemplateMutation();

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

  const handleSaveMainInfo = () => {
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
    if (!record?.resourceId) {
      dispatch(notify({ msg: 'Resource is required', sev: 'warning' }));
      return;
    }
    if (record?.requirePractitioner && !record?.defaultPractitionerId) {
      dispatch(notify({ msg: 'Default Practitioner is required', sev: 'warning' }));
      return;
    }

    const payload = {
      ...record,
      numberOfResourcesExpected: Number(record.numberOfResourcesExpected),
      durationMinutes: Number(record?.durationMinutes),
      parallelCapacityValue: Number(record?.parallelCapacityValue ?? 1),
      allowedServices: Array.isArray(record?.allowedServices)
        ? record.allowedServices
        : []
    };
    const mutation = isEditMode
      ? update({ id: record?.id, ...payload })
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
        const errorMsg = extractErrorMessage(e) || 'Save Failed';
        dispatch(notify({ msg: errorMsg, sev: 'warning' }));
      });
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={props?.readOnly ? 'View Resource' : isEditMode ? "Edit Resource" : "Add Resource"}
      size="md"
      content={conjureFormContent}
      actionButtonFunction={handleSaveMainInfo}
      actionButtonLabel={isEditMode ? "Save" : "Add"}
      hideActionBtn={props?.readOnly}
    />
  );
};

export default AddResourceModal;
