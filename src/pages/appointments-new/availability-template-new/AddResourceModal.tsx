import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Form, Row, Col } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import {
  useLazyGetAppointableServicesByLoggedInFacilityQuery,
  useLazyGetServicesByDepartmentQuery,
  useLazyGetServiceByIdQuery,
} from '@/services/setup/serviceService';
import {
  useLazyGetPractitionerByDepartmentQuery,
  useLazyGetPractitionerByIdQuery,
} from '@/services/setup/practitioner/PractitionerService';
import { newAvailabilityTemplateCreateDTO } from '@/types/model-types-constructor-new';
import {
  useCreateAvailabilityTemplateMutation,
  useUpdateAvailabilityTemplateMutation,
} from '@/services/appointment/availabilityTemplateService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { useGetDepartmentServicesQuery } from '@/services/departmentServicesService';
import {
  useLazyGetAllActiveAppointableDiagnosticTestsQuery,
  useLazyGetDiagnosticTestByIdQuery,
} from '@/services/setup/diagnosticTest/diagnosticTestService';
import {
  useLazyGetAppointableCatalogsByLoggedInFacilityQuery,
  useLazyGetCatalogByIdQuery,
} from '@/services/setup/catalog/catalogService';
import { formatEnumString } from '@/utils';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { useLazyGetActiveAppointableRoomsByDepartmentIdQuery, useLazyGetRoomByIdQuery } from '@/services/setup/room/roomService';
import { extractErrorMessage, normalizeAllowedServices } from './utils';
import './AddResourceModal.less';
import { AvailabilityTemplateCreateDTO, AvailabilityTemplateUpdateDTO } from '@/types/model-types-new';

const PAGE_SIZE = 20;

type Props = {
  mainTemplate: any;
  open: boolean;
  setOpen: (open: boolean) => void;
  editRecord?: any;
  selectedFacility: any;
  readOnly?: boolean;
};

const AddResourceModal: React.FC<Props> = ({ mainTemplate, open, setOpen, editRecord, selectedFacility, readOnly }) => {
  const dispatch = useAppDispatch();
  const [record, setRecord] = useState<AvailabilityTemplateCreateDTO | AvailabilityTemplateUpdateDTO>({ ...newAvailabilityTemplateCreateDTO });

  // Becomes true when the modal opens and stays true until the resourceId effect
  // resolves its async fetch. Used to know whether a working-days overwrite came
  // from the initial load (should use editRecord days) or from the user picking
  // a new resource (should use resource/parent days).
  const justOpenedRef = useRef(false);

  // Becomes true when the user manually ticks/unticks an allowed service.
  // Prevents the services auto-fill effects from overwriting user selections.
  const allowedServicesTouchedRef = useRef(false);

  // Becomes true when the user manually ticks/unticks a working day.
  // applyWorkingDays checks this and skips the write if the user already touched the days.
  // Reset whenever facilityId or department changes so the new context can re-apply defaults.
  const workingDaysTouchedRef = useRef(false);

  // ─── Diagnostic Tests ────────────────────────────────────────────────────────
  const [allDiagnosticTests, setAllDiagnosticTests] = useState<any[]>([]);
  const [diagnosticTestHasMore, setDiagnosticTestHasMore] = useState(false);
  const [diagnosticTestNextLink, setDiagnosticTestNextLink] = useState<string | null>(null);
  const [triggerDiagnosticTests, { isFetching: isDiagnosticTestLoading }] = useLazyGetAllActiveAppointableDiagnosticTestsQuery();

  // ─── Catalogs ────────────────────────────────────────────────────────────────
  const [allCatalogs, setAllCatalogs] = useState<any[]>([]);
  const [catalogHasMore, setCatalogHasMore] = useState(false);
  const [catalogNextLink, setCatalogNextLink] = useState<string | null>(null);
  const [triggerCatalogs, { isFetching: isCatalogLoading }] = useLazyGetAppointableCatalogsByLoggedInFacilityQuery();

  // ─── Rooms ────────────────────────────────────────────────────────────────────
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [roomHasMore, setRoomHasMore] = useState(false);
  const [roomNextLink, setRoomNextLink] = useState<string | null>(null);
  const [triggerRooms, { isFetching: isRoomLoading }] = useLazyGetActiveAppointableRoomsByDepartmentIdQuery();

  // ─── Services (by facility) ───────────────────────────────────────────────────
  const [allServicesFacility, setAllServicesFacility] = useState<any[]>([]);
  const [servicesFacilityHasMore, setServicesFacilityHasMore] = useState(false);
  const [servicesFacilityNextLink, setServicesFacilityNextLink] = useState<string | null>(null);
  const [triggerServicesFacility, { isFetching: isServicesFacilityLoading }] = useLazyGetAppointableServicesByLoggedInFacilityQuery();

  // ─── Services (by department) ─────────────────────────────────────────────────
  const [allServicesDept, setAllServicesDept] = useState<any[]>([]);
  const [servicesDeptHasMore, setServicesDeptHasMore] = useState(false);
  const [servicesDeptNextLink, setServicesDeptNextLink] = useState<string | null>(null);
  const [triggerServicesDept, { isFetching: isServicesDeptLoading }] = useLazyGetServicesByDepartmentQuery();

  // ─── Practitioners (by department) ───────────────────────────────────────────
  const [allPractitionersDept, setAllPractitionersDept] = useState<any[]>([]);
  const [practitionerDeptHasMore, setPractitionerDeptHasMore] = useState(false);
  const [practitionerDeptNextLink, setPractitionerDeptNextLink] = useState<string | null>(null);
  const [triggerPractitionersDept, { isFetching: isPractitionerDeptLoading }] = useLazyGetPractitionerByDepartmentQuery();

  // ─── Queries ─────────────────────────────────────────────────────────────────
  const { data: facilityListResponse } = useGetActiveFacilitiesQuery({});
  const [getPractitioner] = useLazyGetPractitionerByIdQuery();
  const [getDiagnosticTest] = useLazyGetDiagnosticTestByIdQuery();
  const [getCatalog] = useLazyGetCatalogByIdQuery();
  const [getService] = useLazyGetServiceByIdQuery();
  const [getRoom] = useLazyGetRoomByIdQuery();
  const { data: departmentServices = [] } = useGetDepartmentServicesQuery(
    { departmentId: record?.departmentId },
    { skip: !record?.departmentId }
  );
  const [create] = useCreateAvailabilityTemplateMutation();
  const [update] = useUpdateAvailabilityTemplateMutation();

  const statusEnum = useEnumOptions('TemplateStatus');
  const templateTypeEnum = useEnumOptions('TemplateType',{exclude: ['DEPARTMENT']});
  const dayOptions = useEnumOptions('DayOfWeek');

  // ─── Options ─────────────────────────────────────────────────────────────────
  const diagnosticTestOptions = useMemo(() => allDiagnosticTests.map(d => ({ label: d.name, value: d.id })), [allDiagnosticTests]);
  const catalogOptions = useMemo(() => allCatalogs.map(c => ({ label: c.name, value: c.id })), [allCatalogs]);
  const servicesFacilityOptions = useMemo(() => allServicesFacility.map(s => ({ label: s.name, value: s.id })), [allServicesFacility]);
  const servicesDeptOptions = useMemo(() => allServicesDept.map(s => ({ label: s.name, value: s.id })), [allServicesDept]);
  const practitionerDeptOptions = useMemo(() => allPractitionersDept.map(p => ({ label: `${p.firstName} ${p.lastName}`, value: p.id })), [allPractitionersDept]);
  const roomOptions = useMemo(() => allRooms.map(r => ({ label: r.name, value: r.id })), [allRooms]);

  // ─── Load Functions ──────────────────────────────────────────────────────────
  const appendItems = <T extends { id: any }>(prev: T[], rows: T[]): T[] => {
    const seen = new Set(prev.map(d => d.id));
    return [...prev, ...rows.filter(r => !seen.has(r.id))];
  };

  const loadDiagnosticTests = async ({ page = 0, append = false }: { page?: number; append?: boolean } = {}) => {
    try {
      const res = await triggerDiagnosticTests({ page, size: PAGE_SIZE, sort: 'id,asc' }).unwrap();
      const rows = res?.data ?? [];
      const nextLink = res?.links?.next ?? null;
      setDiagnosticTestHasMore(Boolean(nextLink));
      setDiagnosticTestNextLink(nextLink);
      setAllDiagnosticTests(prev => append ? appendItems(prev, rows) : rows);
    } catch { setAllDiagnosticTests([]); }
  };

  const loadCatalogs = async ({ page = 0, append = false }: { page?: number; append?: boolean } = {}) => {
    try {
      const res = await triggerCatalogs({ page, size: PAGE_SIZE, sort: 'id,asc' }).unwrap();
      const rows = res?.data ?? [];
      const nextLink = res?.links?.next ?? null;
      setCatalogHasMore(Boolean(nextLink));
      setCatalogNextLink(nextLink);
      setAllCatalogs(prev => append ? appendItems(prev, rows) : rows);
    } catch { setAllCatalogs([]); }
  };

  const loadRooms = async ({ page = 0, append = false }: { page?: number; append?: boolean } = {}) => {
    if (!record?.departmentId) return;
    try {
      const res = await triggerRooms({ departmentId: record.departmentId, page, size: PAGE_SIZE, sort: 'id,asc' }).unwrap();
      const rows = res?.data ?? [];
      const nextLink = res?.links?.next ?? null;
      setRoomHasMore(Boolean(nextLink));
      setRoomNextLink(nextLink);
      setAllRooms(prev => append ? appendItems(prev, rows) : rows);
    } catch { setAllRooms([]); }
  };

  const loadServicesFacility = async ({ page = 0, append = false }: { page?: number; append?: boolean } = {}) => {
    try {
      const res = await triggerServicesFacility({ page, size: PAGE_SIZE, sort: 'id,asc' }).unwrap();
      const rows = res?.data ?? [];
      const nextLink = res?.links?.next ?? null;
      setServicesFacilityHasMore(Boolean(nextLink));
      setServicesFacilityNextLink(nextLink);
      setAllServicesFacility(prev => append ? appendItems(prev, rows) : rows);
    } catch { setAllServicesFacility([]); }
  };

  const loadServicesDept = async ({ page = 0, append = false }: { page?: number; append?: boolean } = {}) => {
    if (!record?.departmentId) return;
    try {
      const res = await triggerServicesDept({ sourceId: record.departmentId, page, size: PAGE_SIZE, sort: 'id,asc' }).unwrap();
      const rows = res?.data ?? [];
      const nextLink = res?.links?.next ?? null;
      setServicesDeptHasMore(Boolean(nextLink));
      setServicesDeptNextLink(nextLink);
      setAllServicesDept(prev => append ? appendItems(prev, rows) : rows);
    } catch { setAllServicesDept([]); }
  };

  const loadPractitionersDept = async ({ page = 0, append = false }: { page?: number; append?: boolean } = {}) => {
    if (!record?.departmentId) return;
    try {
      const res = await triggerPractitionersDept({ departmentId: record.departmentId, page, size: PAGE_SIZE, sort: 'id,asc' }).unwrap();
      const rows = res?.data ?? [];
      const nextLink = res?.links?.next ?? null;
      setPractitionerDeptHasMore(Boolean(nextLink));
      setPractitionerDeptNextLink(nextLink);
      setAllPractitionersDept(prev => append ? appendItems(prev, rows) : rows);
    } catch { setAllPractitionersDept([]); }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const dayOptionsKey = useMemo(() => (dayOptions ?? []).map(d => `${d.value}:${d.label}`).join('|'), [dayOptions]);

  const normalizeWorkingDays = (sourceWorkingDays: any[] = []) => {
    if (!dayOptions?.length) return [];
    return dayOptions.map(day => {
      const found = sourceWorkingDays.find((d: any) => String(d?.dayOfWeek) === String(day.value));
      return { dayOfWeek: day.value, isWorking: found?.isWorking === true };
    });
  };

  // Writes normalized working days into the record without marking them as
  // "user touched". The equality check prevents a re-render when the days
  // didn't actually change (avoids infinite loops when the effect re-fires).
  // Resets workingDaysTouchedRef so subsequent auto-fills are not blocked.
  const applyWorkingDays = (sourceWorkingDays: any[] = []) => {
    if (!dayOptions?.length) return;
    const normalized = normalizeWorkingDays(sourceWorkingDays);
    workingDaysTouchedRef.current = false;
    setRecord(prev => {
      const prevDays = prev?.workingDays ?? [];
      const same =
        prevDays.length === normalized.length &&
        prevDays.every((d: any, i: number) => d.dayOfWeek === normalized[i].dayOfWeek && d.isWorking === normalized[i].isWorking);
      if (same) return prev;
      return { ...prev, workingDays: normalized };
    });
  };

  const getEditTimingValues = (source: any) => ({
    durationMinutes: Number(source?.durationMinutes ?? source?.slotDurationMinutes ?? 0),
    defaultBufferBeforeMinutes: Number(source?.defaultBufferBeforeMinutes ?? source?.slotBeforeMinutes ?? 0),
    defaultBufferAfterMinutes: Number(source?.defaultBufferAfterMinutes ?? source?.slotAfterMinutes ?? 0),
    parallelCapacityValue: Number(source?.parallelCapacityValue ?? 1),
  });

  // ─── Working Days Record ──────────────────────────────────────────────────────
  const workingDaysRecord = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!dayOptions?.length) return map;
    dayOptions.forEach(day => { map[day.value] = false; });
    (record?.workingDays ?? []).forEach((day: any) => {
      if (day?.dayOfWeek != null) map[day.dayOfWeek] = day.isWorking === true;
    });
    return map;
  }, [record?.workingDays, dayOptionsKey]);

  const setWorkingDaysRecord = (nextRecord: Record<string, boolean>) => {
    if (!dayOptions?.length) return;
    workingDaysTouchedRef.current = true;
    setRecord(prev => ({
      ...prev,
      workingDays: dayOptions.map(day => ({ dayOfWeek: day.value, isWorking: !!nextRecord[day.value] })),
    }));
  };

  // ─── Allowed Services ─────────────────────────────────────────────────────────
  const parentTemplateAllowedServices = useMemo(
    () => normalizeAllowedServices(mainTemplate?.allowedServices),
    [mainTemplate?.allowedServices]
  );

  const editRecordWorkingDays = useMemo(
    () => (Array.isArray(editRecord?.workingDays) ? editRecord.workingDays : []),
    [editRecord?.workingDays]
  );

  // isEditingRecord: the editRecord prop already has an id, meaning the parent
  // opened this modal to edit an existing child template. Used to decide whether
  // to load timing/working-days from editRecord (preserve what was saved) or from
  // the resource defaults (fresh create).
  //
  // isEditMode: the current record state has an id, meaning we are in the middle
  // of editing (could be because isEditingRecord was true when we populated record,
  // or because the user saved a new record and it came back with an id). Used for
  // the save mutation (update vs create) and some field-level guards.
  const isEditingRecord = Boolean(editRecord?.id);
  const isEditMode = Boolean(record?.id);

  const departmentServiceValues = useMemo(() => {
    if (!Array.isArray(departmentServices)) return [];
    return departmentServices.map((s: any) => s?.service).filter((v: any) => typeof v === 'string' && v.length > 0);
  }, [departmentServices]);

  const departmentServiceValuesKey = useMemo(() => departmentServiceValues.join('|'), [departmentServiceValues]);

  const selectedServiceValues = useMemo(() => {
    return Array.isArray(record?.allowedServices)
      ? record.allowedServices.map((s: any) => s?.service).filter((v: any) => typeof v === 'string' && v.length > 0)
      : [];
  }, [record?.allowedServices]);

  const toggleAllowedService = (serviceValue: string, checked: boolean, serviceId: number | null = null) => {
    allowedServicesTouchedRef.current = true;
    setRecord(prev => {
      const prevAllowed = Array.isArray(prev?.allowedServices) ? prev.allowedServices : [];
      if (checked) {
        if (prevAllowed.some((s: any) => s?.service === serviceValue)) return prev;
        return { ...prev, allowedServices: [...prevAllowed, { id: serviceId, service: serviceValue }] };
      }
      return { ...prev, allowedServices: prevAllowed.filter((s: any) => s?.service !== serviceValue) };
    });
  };

  // ─── Effects ─────────────────────────────────────────────────────────────────
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
    loadRooms({ page: 0 });
  }, [record?.departmentId]);

  // Primary open/reset effect.
  // Runs when the modal opens or when the key props change while it's open.
  // Sets justOpenedRef = true so the resourceId effect (which fires asynchronously)
  // knows it's still the initial load and should not overwrite editRecord's days.
  useEffect(() => {
    if (!open) return;
    justOpenedRef.current = true;
    allowedServicesTouchedRef.current = false;
    workingDaysTouchedRef.current = false;

    if (editRecord?.id) {
      // Edit mode: hydrate record from the existing child template.
      // getEditTimingValues normalizes field name differences between
      // the API response shape and the DTO shape.
      setRecord({
        ...editRecord,
        resourceId: editRecord?.resourceId,
        allowedServices: normalizeAllowedServices(editRecord?.allowedServices),
        facilityId: selectedFacility?.id ?? editRecord?.facilityId,
        departmentId: editRecord?.departmentId ?? mainTemplate?.departmentId,
        workingDays: editRecordWorkingDays,
        ...getEditTimingValues(editRecord),
      });
      return;
    }

    // Create mode: start from blank DTO, inherit context from the parent template.
    // Working days default to parent template's days; the resourceId effect may
    // override them once the user picks a PRACTITIONER resource.
    setRecord({
      ...newAvailabilityTemplateCreateDTO,
      parentTemplateId: mainTemplate?.id,
      facilityId: selectedFacility?.id,
      departmentId: mainTemplate?.departmentId,
      workingDays: mainTemplate?.workingDays ?? [],
      parallelCapacityValue: Number(mainTemplate?.parallelCapacityValue ?? 1),
    });
    applyWorkingDays(mainTemplate?.workingDays ?? []);
  }, [open, editRecord, mainTemplate?.id, mainTemplate?.departmentId, selectedFacility?.id]);

  useEffect(() => {
    if (!open) return;
    if (editRecord?.id) {
      applyWorkingDays(editRecord?.workingDays ?? []);
    } else {
      applyWorkingDays(mainTemplate?.workingDays ?? []);
    }
  }, [open]);

  useEffect(() => {
    allowedServicesTouchedRef.current = false;
  }, [record?.departmentId]);

  useEffect(() => {
    workingDaysTouchedRef.current = false;
  }, [record?.facilityId]);

  // Auto-fills allowed services once (only if the user hasn't touched them yet
  // and the record doesn't already have services).
  // • Create mode (isEditMode false): inherits services from the parent template.
  // • Edit mode: fills from department services if the record has none yet.
  //   This handles the edge case where a saved resource has no services stored
  //   and the department list arrives after the modal opens.
  useEffect(() => {
    if (allowedServicesTouchedRef.current) return;
    if (!isEditMode) {
      if (parentTemplateAllowedServices.length === 0) return;
      setRecord(prev => {
        const prevAllowed = Array.isArray(prev?.allowedServices) ? prev.allowedServices : [];
        if (prevAllowed.length > 0) return prev;
        return { ...prev, allowedServices: parentTemplateAllowedServices };
      });
      return;
    }
    if (!departmentServiceValues.length) return;
    setRecord(prev => {
      const prevAllowed = Array.isArray(prev?.allowedServices) ? prev.allowedServices : [];
      if (prevAllowed.length > 0) return prev;
      return { ...prev, allowedServices: departmentServiceValues.map(service => ({ id: null, service })) };
    });
  }, [departmentServiceValuesKey, isEditMode, parentTemplateAllowedServices]);

  // Safety net: if the modal opens and parentTemplateAllowedServices loads after
  // the primary open effect already ran, apply them now. The prevAllowed.length
  // guard means this won't overwrite services already set by the open effect.
  useEffect(() => {
    if (!open || parentTemplateAllowedServices.length === 0) return;
    setRecord(prev => {
      const prevAllowed = Array.isArray(prev?.allowedServices) ? prev.allowedServices : [];
      if (prevAllowed.length > 0) return prev;
      return { ...prev, allowedServices: parentTemplateAllowedServices };
    });
  }, [open, parentTemplateAllowedServices]);

  // Fires whenever the user changes resourceId or templateType.
  // Fetches the selected resource's details and applies its default timing values
  // and (for PRACTITIONER) working days.
  //
  // Working days logic for PRACTITIONER (hierarchy):
  //   1. If editing an existing record AND the modal just opened → use editRecord's
  //      saved days (don't overwrite what was already stored).
  //   2. Otherwise, use the practitioner's own working days if they have any marked true.
  //   3. If the practitioner has no working days → fall back to parent template's days.
  //
  // For all other resource types (SERVICE, ROOM, etc.) → always inherit parent days.
  //
  // isEditingRecord guard in applyResourceDefaults: if we're editing, the timing
  // fields should come from the saved editRecord, not the resource's current defaults.
  useEffect(() => {
    if (!record?.resourceId) {
      // Resource was cleared — reset timing to parent defaults in create mode.
      if (!isEditingRecord) {
        setRecord(prev => ({
          ...prev,
          durationMinutes: 0,
          defaultBufferBeforeMinutes: 0,
          defaultBufferAfterMinutes: 0,
          parallelCapacityValue: Number(mainTemplate?.parallelCapacityValue ?? 1),
          defaultPractitionerId: undefined,
        }));
        applyWorkingDays(mainTemplate?.workingDays ?? []);
      }
      return;
    }

    const applyResourceDefaults = (res: any) => {
      if (!isEditingRecord) {
        setRecord(prev => ({
          ...prev,
          durationMinutes: res?.defaultDurationMinutes,
          defaultBufferBeforeMinutes: res?.defaultBufferBeforeMinutes,
          defaultBufferAfterMinutes: res?.defaultBufferAfterMinutes,
          parallelCapacityValue: Number(res?.parallelCapacityValue ?? 1),
        }));
      }
      // Once the async fetch resolves, the "just opened" window is over —
      // future resourceId changes should be treated as user-initiated picks.
      justOpenedRef.current = false;
    };

    if (record?.templateType === 'PRACTITIONER') {
      getPractitioner(record.resourceId)
        .unwrap()
        .then(res => {
          const practitionerDays = res?.workingDays ?? [];
          const hasWorkingDays = practitionerDays.some((d: any) => d?.isWorking === true);
          // Fallback: if practitioner has no working days, use parent template's days.
          const finalWorkingDays = hasWorkingDays ? practitionerDays : (mainTemplate?.workingDays ?? []);

          if (isEditingRecord && justOpenedRef.current) {
            // Initial load of edit mode: preserve the already-saved days, not the
            // practitioner's current days (they may have changed since saving).
            applyWorkingDays(editRecordWorkingDays);
          } else {
            applyWorkingDays(finalWorkingDays);
          }

          applyResourceDefaults(res);
          if (!isEditingRecord) {
            setRecord(prev => ({ ...prev, defaultPractitionerId: res?.id }));
          }
        })
        .catch(() => {
          if (!isEditingRecord) applyWorkingDays(mainTemplate?.workingDays ?? []);
          justOpenedRef.current = false;
        });
    } else if (record?.templateType === 'SERVICE') {
      getService(record.resourceId)
        .unwrap()
        .then(res => {
          applyResourceDefaults(res);
          if (!isEditingRecord) applyWorkingDays(mainTemplate?.workingDays ?? []);
        });
    } else if (record?.templateType === 'ROOM') {
      getRoom({ id: record.resourceId })
        .unwrap()
        .then(res => {
          applyResourceDefaults(res);
          if (!isEditingRecord) applyWorkingDays(mainTemplate?.workingDays ?? []);
        });
    } else if (record?.templateType === 'DIAGNOSTIC_TEST') {
      getDiagnosticTest(String(record.resourceId))
        .unwrap()
        .then(res => {
          if (!isEditingRecord) {
            setRecord(prev => ({
              ...prev,
              durationMinutes: res?.data?.defaultDurationMinutes,
              defaultBufferBeforeMinutes: res?.data?.defaultBufferBeforeMinutes,
              defaultBufferAfterMinutes: res?.data?.defaultBufferAfterMinutes,
              parallelCapacityValue: Number(res?.data?.parallelCapacityValue ?? 1),
            }));
          }
          if (!isEditingRecord) applyWorkingDays(mainTemplate?.workingDays ?? []);
          justOpenedRef.current = false;
        });
    } else if (record?.templateType === 'CATALOG') {
      getCatalog(record.resourceId)
        .unwrap()
        .then(res => {
          applyResourceDefaults(res);
          if (!isEditingRecord) applyWorkingDays(mainTemplate?.workingDays ?? []);
        });
    }
  }, [record?.resourceId, record?.templateType, isEditingRecord, editRecordWorkingDays]);

  // ─── Resource Select Renderer ─────────────────────────────────────────────────
  const renderResourceSelect = () => {
    const configs: Record<string, { label: string; options: any[]; loading: boolean; hasMore: boolean; nextLink: string | null; onLoadMore: () => void }> = {
      PRACTITIONER: {
        label: 'Practitioner',
        options: practitionerDeptOptions,
        loading: isPractitionerDeptLoading,
        hasMore: practitionerDeptHasMore,
        nextLink: practitionerDeptNextLink,
        onLoadMore: async () => {
          if (!practitionerDeptNextLink) return;
          const { page } = extractPaginationFromLink(practitionerDeptNextLink);
          await loadPractitionersDept({ page, append: true });
        },
      },
      SERVICE: {
        label: 'Service',
        options: servicesFacilityOptions,
        loading: isServicesFacilityLoading,
        hasMore: servicesFacilityHasMore,
        nextLink: servicesFacilityNextLink,
        onLoadMore: async () => {
          if (!servicesFacilityNextLink) return;
          const { page } = extractPaginationFromLink(servicesFacilityNextLink);
          await loadServicesFacility({ page, append: true });
        },
      },
      CATALOG: {
        label: 'Catalog',
        options: catalogOptions,
        loading: isCatalogLoading,
        hasMore: catalogHasMore,
        nextLink: catalogNextLink,
        onLoadMore: async () => {
          if (!catalogNextLink) return;
          const { page } = extractPaginationFromLink(catalogNextLink);
          await loadCatalogs({ page, append: true });
        },
      },
      DIAGNOSTIC_TEST: {
        label: 'Diagnostic Test',
        options: diagnosticTestOptions,
        loading: isDiagnosticTestLoading,
        hasMore: diagnosticTestHasMore,
        nextLink: diagnosticTestNextLink,
        onLoadMore: async () => {
          if (!diagnosticTestNextLink) return;
          const { page } = extractPaginationFromLink(diagnosticTestNextLink);
          await loadDiagnosticTests({ page, append: true });
        },
      },
      ROOM: {
        label: 'Room',
        options: roomOptions,
        loading: isRoomLoading,
        hasMore: roomHasMore,
        nextLink: roomNextLink,
        onLoadMore: async () => {
          if (!roomNextLink) return;
          const { page } = extractPaginationFromLink(roomNextLink);
          await loadRooms({ page, append: true });
        },
      },
    };

    const config = configs[record.templateType];
    if (!config) return null;

    return (
      <Col md={12}>
        <MyInput
          width="100%"
          fieldType="selectPagination"
          fieldName="resourceId"
          fieldLabel={config.label}
          selectData={config.options}
          selectDataLabel="label"
          selectDataValue="value"
          record={record}
          setRecord={setRecord}
          loading={config.loading}
          hasMore={config.hasMore}
          onFetchMore={config.onLoadMore}
          menuMaxHeight={200}
          disabled={readOnly}
          required
        />
      </Col>
    );
  };

  // ─── Save Handler ─────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!record?.templateName?.trim()) { dispatch(notify({ msg: 'Template Name is required', sev: 'warning' })); return; }
    if (!record?.facilityId) { dispatch(notify({ msg: 'Facility is required', sev: 'warning' })); return; }
    if (!record?.templateType) { dispatch(notify({ msg: 'Template Type is required', sev: 'warning' })); return; }
    if (!record?.departmentId) { dispatch(notify({ msg: 'Department is required', sev: 'warning' })); return; }
    if (!record?.resourceId) { dispatch(notify({ msg: 'Resource is required', sev: 'warning' })); return; }
    if (record?.requirePractitioner && !record?.defaultPractitionerId) { dispatch(notify({ msg: 'Default Practitioner is required', sev: 'warning' })); return; }

    const payload = {
      ...record,
      numberOfResourcesExpected: Number(record.numberOfResourcesExpected),
      durationMinutes: Number(record?.durationMinutes),
      defaultBufferBeforeMinutes: Number(record?.defaultBufferBeforeMinutes),
      defaultBufferAfterMinutes: Number(record?.defaultBufferAfterMinutes),
      parallelCapacityValue: Number(record?.parallelCapacityValue ?? 1),
      allowedServices: Array.isArray(record?.allowedServices) ? record.allowedServices : [],
    };

    const mutation = isEditMode ? update({ id: record?.id, ...payload }) : create(payload);
    mutation
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: isEditMode ? 'Updated Successfully' : 'Saved Successfully', sev: 'success' }));
        setOpen(false);
      })
      .catch(e => {
        dispatch(notify({ msg: extractErrorMessage(e) || 'Save Failed', sev: 'warning' }));
      });
  };

  // ─── Form Content ─────────────────────────────────────────────────────────────
  const formContent = () => (
    <Form fluid>
      <Row>
        <Col md={12}>
          <SectionContainer
            title="Basic Information"
            content={
              <Form fluid>
                <Row>
                  <Col md={12}>
                    <MyInput fieldName="templateName" fieldType="text" record={record} setRecord={setRecord} width="100%" required disabled={readOnly} />
                  </Col>
                  <Col md={12}>
                    <MyInput fieldName="status" fieldType="select" fieldLabel="Status" record={record} setRecord={setRecord} width="100%" isEnum selectData={statusEnum ?? []} selectDataLabel="label" selectDataValue="value" disabled />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput
                      fieldName="templateType"
                      record={record}
                      setRecord={(next) => {
                        workingDaysTouchedRef.current = false;
                        justOpenedRef.current = false;
                        setRecord(prev => ({
                          ...prev,
                          ...next,
                          resourceId: undefined,
                          defaultPractitionerId: undefined,
                          workingDays: normalizeWorkingDays(mainTemplate?.workingDays ?? []),
                          requirePractitioner: next?.templateType === 'PRACTITIONER',
                        }));
                      }}
                      fieldType="select"
                      selectData={templateTypeEnum ?? []}
                      selectDataLabel="label"
                      selectDataValue="value"
                      width="100%"
                      disabled={readOnly}
                      required
                    />
                  </Col>
                  {renderResourceSelect()}
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput column fieldLabel="Facility" selectData={facilityListResponse ?? []} fieldType="select" selectDataLabel="name" selectDataValue="id" fieldName="facilityId" record={record} setRecord={setRecord} width="100%" required disabled />
                  </Col>
                  <div className="block">
                    <Translate>Color</Translate>
                    <div className="color-picker-row">
                      <input
                        type="color"
                        value={record?.templateColor ?? '#6982F0'}
                        onChange={e => setRecord(prev => ({ ...prev, templateColor: e.target.value }))}
                      />
                    </div>
                  </div>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput fieldName="durationMinutes" fieldLabel="duration" fieldType="number" record={record} setRecord={setRecord} width="100%" rightAddon="min" disabled={readOnly} />
                  </Col>
                  <Col md={12}>
                    <MyInput fieldName="parallelCapacityValue" fieldLabel="Parallel Capacity Value" fieldType="number" record={record} setRecord={setRecord} width="100%" min={1} disabled={readOnly} />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput fieldName="defaultBufferBeforeMinutes" fieldLabel="Slot Before" fieldType="number" record={record} setRecord={setRecord} width="100%" disabled={readOnly} />
                  </Col>
                  <Col md={12}>
                    <MyInput fieldLabel="Slot After" fieldName="defaultBufferAfterMinutes" fieldType="number" record={record} setRecord={setRecord} width="100%" disabled={readOnly} />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput fieldName="versionNo" fieldType="number" record={record} setRecord={setRecord} width="100%" disabled />
                  </Col>
                  <Col md={12}>
                    <MyInput width="100%" fieldType="check" fieldName="requireConfirmation" record={record} setRecord={setRecord} showLabel={false} disabled={readOnly} />
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
                  disabled={readOnly}
                />
                <MyInput width="100%" fieldType="number" fieldLabel="Number Of Resources" fieldName="numberOfResourcesExpected" record={record} setRecord={setRecord} disabled={readOnly} />
                <Row>
                  <Col md={12}>
                    <MyInput width="100%" fieldType="check" fieldName="requirePractitioner" record={record} setRecord={setRecord} showLabel={false} disabled={readOnly || record?.templateType === 'PRACTITIONER'} />
                  </Col>
                  {record['requirePractitioner'] && (
                    <Col md={12}>
                      <MyInput
                        key={`practitioner-dept-${record?.departmentId}`}
                        width="100%"
                        fieldType="selectPagination"
                        fieldName="defaultPractitionerId"
                        fieldLabel="Default Practitioner"
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
                        disabled={readOnly || record?.templateType === 'PRACTITIONER'}
                        required
                      />
                    </Col>
                  )}
                </Row>
                <MyInput width="100%" fieldType="check" fieldName="requirePreAssessment" record={record} setRecord={setRecord} showLabel={false} disabled={readOnly} />
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
                  {parentTemplateAllowedServices.map((service: any) => {
                    const fieldName = `service_${service?.service}`;
                    return (
                      <Col md={8} key={service?.service}>
                        <MyInput
                          width="100%"
                          fieldType="check"
                          fieldName={fieldName}
                          record={{ [fieldName]: selectedServiceValues.includes(service?.service) }}
                          setRecord={(next: any) => toggleAllowedService(service?.service, Boolean(next[fieldName]), null)}
                          showLabel={false}
                          label={formatEnumString(service?.service)}
                          disabled={readOnly}
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
                disabled={readOnly}
              />
            ))}
          </Form>
        }
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={readOnly ? 'View Resource' : isEditMode ? 'Edit Resource' : 'Add Resource'}
      size="md"
      content={formContent}
      actionButtonFunction={handleSave}
      actionButtonLabel={isEditMode ? 'Save' : 'Add'}
      hideActionBtn={readOnly}
    />
  );
};

export default AddResourceModal;
