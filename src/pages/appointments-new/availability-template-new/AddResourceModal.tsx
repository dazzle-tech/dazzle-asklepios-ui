import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Form, Row, Col } from "rsuite";

import MyInput from "@/components/MyInput";
import MyModal from "@/components/MyModal/MyModal";
import Translate from "@/components/Translate";
import SectionContainer from "@/components/SectionsoContainer";

import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import { formatEnumString } from "@/utils";
import { extractPaginationFromLink } from "@/utils/paginationHelper";

import { useEnumOptions } from "@/services/enumsApi";
import { useGetActiveFacilitiesQuery } from "@/services/security/facilityService";
import {
  useLazyGetAppointableServicesByLoggedInFacilityQuery,
  useLazyGetServicesByDepartmentQuery,
  useLazyGetServiceByIdQuery,
} from "@/services/setup/serviceService";
import {
  useLazyGetPractitionerByDepartmentQuery,
  useLazyGetPractitionerByIdQuery,
} from "@/services/setup/practitioner/PractitionerService";
import {
  useLazyGetAllActiveAppointableDiagnosticTestsQuery,
  useLazyGetDiagnosticTestByIdQuery,
} from "@/services/setup/diagnosticTest/diagnosticTestService";
import {
  useLazyGetAppointableCatalogsByLoggedInFacilityQuery,
  useLazyGetCatalogByIdQuery,
} from "@/services/setup/catalog/catalogService";
import {
  useLazyGetActiveAppointableRoomsByDepartmentIdQuery,
  useLazyGetRoomByIdQuery,
} from "@/services/setup/room/roomService";
import {
  useCreateAvailabilityTemplateMutation,
  useUpdateAvailabilityTemplateMutation,
} from "@/services/appointment/availabilityTemplateService";

import { newAvailabilityTemplateCreateDTO } from "@/types/model-types-constructor-new";

import "./AddResourceModal.less";

type AddResourceModalProps = {
  mainTemplate: any;
  open: boolean;
  setOpen: (open: boolean) => void;
  editRecord?: any;
  selectedFacility: any;
  readOnly?: boolean;
};

type AllowedService = {
  id: string | number | null;
  service: string | null;
};

type WorkingDay = {
  dayOfWeek: string | number;
  isWorking: boolean;
};

type PaginationState = {
  items: any[];
  hasMore: boolean;
  nextLink: string | null;
};

type LoadPageParams = {
  page?: number;
  append?: boolean;
};

const PAGE_SIZE = 20;
const DEFAULT_TEMPLATE_COLOR = "#6982F0";

const DEPARTMENT_TEMPLATE_TYPE = "DEPARTMENT";
const PRACTITIONER_TEMPLATE_TYPE = "PRACTITIONER";
const SERVICE_TEMPLATE_TYPE = "SERVICE";
const CATALOG_TEMPLATE_TYPE = "CATALOG";
const DIAGNOSTIC_TEST_TEMPLATE_TYPE = "DIAGNOSTIC_TEST";
const ROOM_TEMPLATE_TYPE = "ROOM";

const createEmptyPaginationState = (): PaginationState => ({
  items: [],
  hasMore: false,
  nextLink: null,
});

const FormContainer = Form as unknown as React.FC<any>;

const toSafeNumber = (value: unknown, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? fallback : numericValue;
};

const createInitialResourceRecord = () => ({
  ...newAvailabilityTemplateCreateDTO,
  templateName: newAvailabilityTemplateCreateDTO?.templateName ?? "",
  durationMinutes: toSafeNumber(
    newAvailabilityTemplateCreateDTO?.durationMinutes,
    0,
  ),
  defaultBufferBeforeMinutes: toSafeNumber(
    newAvailabilityTemplateCreateDTO?.defaultBufferBeforeMinutes,
    0,
  ),
  defaultBufferAfterMinutes: toSafeNumber(
    newAvailabilityTemplateCreateDTO?.defaultBufferAfterMinutes,
    0,
  ),
  parallelCapacityValue: toSafeNumber(
    newAvailabilityTemplateCreateDTO?.parallelCapacityValue,
    1,
  ),
  numberOfResourcesExpected: toSafeNumber(
    newAvailabilityTemplateCreateDTO?.numberOfResourcesExpected,
    0,
  ),
  versionNo: toSafeNumber(newAvailabilityTemplateCreateDTO?.versionNo, 0),
  requirePractitioner: Boolean(
    newAvailabilityTemplateCreateDTO?.requirePractitioner,
  ),
  requirePreAssessment: Boolean(
    newAvailabilityTemplateCreateDTO?.requirePreAssessment,
  ),
  allowedServices: Array.isArray(newAvailabilityTemplateCreateDTO?.allowedServices)
    ? newAvailabilityTemplateCreateDTO.allowedServices
    : [],
  workingDays: Array.isArray(newAvailabilityTemplateCreateDTO?.workingDays)
    ? newAvailabilityTemplateCreateDTO.workingDays
    : [],
});

const scheduleUiStateUpdate = (callback: () => void) => {
  if (typeof window !== "undefined" && window.requestAnimationFrame) {
    window.requestAnimationFrame(callback);
    return;
  }

  callback();
};

const AddResourceModal: React.FC<AddResourceModalProps> = ({
  mainTemplate,
  open,
  setOpen,
  editRecord,
  selectedFacility,
  readOnly = false,
}) => {
  const dispatch = useAppDispatch();

  const [resourceRecord, setResourceRecord] = useState<any>(
    createInitialResourceRecord,
  );

  const [selectedTemplateColor, setSelectedTemplateColor] = useState(
    DEFAULT_TEMPLATE_COLOR,
  );
  const [isSaving, setIsSaving] = useState(false);

  const isModalJustOpenedRef = useRef(false);
  const allowedServicesTouchedRef = useRef(false);
  const workingDaysTouchedRef = useRef(false);
  const timingFieldsTouchedRef = useRef(false);
  const initializedRecordKeyRef = useRef<string | null>(null);
  const lastDepartmentLoadKeyRef = useRef<string | null>(null);
  const lastAppliedResourceDefaultsKeyRef = useRef<string | null>(null);
  const lastClearedResourceDefaultsKeyRef = useRef<string | null>(null);

  const [diagnosticTestsPagination, setDiagnosticTestsPagination] =
    useState<PaginationState>(createEmptyPaginationState);
  const [catalogsPagination, setCatalogsPagination] =
    useState<PaginationState>(createEmptyPaginationState);
  const [roomsPagination, setRoomsPagination] =
    useState<PaginationState>(createEmptyPaginationState);
  const [facilityServicesPagination, setFacilityServicesPagination] =
    useState<PaginationState>(createEmptyPaginationState);
  const [departmentServicesPagination, setDepartmentServicesPagination] =
    useState<PaginationState>(createEmptyPaginationState);
  const [
    departmentPractitionersPagination,
    setDepartmentPractitionersPagination,
  ] = useState<PaginationState>(createEmptyPaginationState);

  const statusOptions = useEnumOptions("TemplateStatus");
  const filteredTemplateTypeOptions = useEnumOptions("TemplateType", {
    exclude: [DEPARTMENT_TEMPLATE_TYPE],
  });
  const dayOptions = useEnumOptions("DayOfWeek");
  const dayOptionsKey = useMemo(
    () => (dayOptions ?? []).map((day: any) => `${day.value}:${day.label}`).join("|"),
    [dayOptions],
  );

  const { data: facilityList = [] } = useGetActiveFacilitiesQuery({});

  const [loadDiagnosticTestsQuery, { isFetching: isDiagnosticTestLoading }] =
    useLazyGetAllActiveAppointableDiagnosticTestsQuery();
  const [loadCatalogsQuery, { isFetching: isCatalogLoading }] =
    useLazyGetAppointableCatalogsByLoggedInFacilityQuery();
  const [loadRoomsQuery, { isFetching: isRoomLoading }] =
    useLazyGetActiveAppointableRoomsByDepartmentIdQuery();
  const [loadFacilityServicesQuery, { isFetching: isFacilityServiceLoading }] =
    useLazyGetAppointableServicesByLoggedInFacilityQuery();
  const [
    loadDepartmentServicesQuery,
    { isFetching: isDepartmentServiceLoading },
  ] = useLazyGetServicesByDepartmentQuery();
  const [
    loadDepartmentPractitionersQuery,
    { isFetching: isDepartmentPractitionerLoading },
  ] = useLazyGetPractitionerByDepartmentQuery();

  const [getPractitionerById] = useLazyGetPractitionerByIdQuery();
  const [getDiagnosticTestById] = useLazyGetDiagnosticTestByIdQuery();
  const [getCatalogById] = useLazyGetCatalogByIdQuery();
  const [getServiceById] = useLazyGetServiceByIdQuery();
  const [getRoomById] = useLazyGetRoomByIdQuery();

  const [createAvailabilityTemplate] = useCreateAvailabilityTemplateMutation();
  const [updateAvailabilityTemplate] = useUpdateAvailabilityTemplateMutation();

  const isEditMode = Boolean(resourceRecord?.id);
  const isEditingExistingRecord = Boolean(editRecord?.id);
  const isReadOnly = Boolean(readOnly);

  const mainTemplateWorkingDays = useMemo(
    () =>
      Array.isArray(mainTemplate?.workingDays) ? mainTemplate.workingDays : [],
    [mainTemplate?.workingDays],
  );

  const mainTemplateWorkingDaysKey = useMemo(
    () =>
      mainTemplateWorkingDays
        .map((workingDay: any) => `${workingDay?.dayOfWeek}:${workingDay?.isWorking}`)
        .join("|"),
    [mainTemplateWorkingDays],
  );

  const editRecordWorkingDays = useMemo(
    () =>
      Array.isArray(editRecord?.workingDays) ? editRecord.workingDays : [],
    [editRecord?.workingDays],
  );

  const editRecordWorkingDaysKey = useMemo(
    () =>
      editRecordWorkingDays
        .map((workingDay: any) => `${workingDay?.dayOfWeek}:${workingDay?.isWorking}`)
        .join("|"),
    [editRecordWorkingDays],
  );

  const safeResourceRecord = useMemo(
    () => ({
      ...resourceRecord,
      templateName: resourceRecord?.templateName ?? "",
      status: resourceRecord?.status ?? "",
      templateType: resourceRecord?.templateType ?? "",
      resourceId: resourceRecord?.resourceId ?? "",
      facilityId: resourceRecord?.facilityId ?? "",
      departmentId: resourceRecord?.departmentId ?? "",
      defaultServiceId: resourceRecord?.defaultServiceId ?? "",
      defaultPractitionerId: resourceRecord?.defaultPractitionerId ?? "",
      durationMinutes: toSafeNumber(resourceRecord?.durationMinutes, 0),
      defaultBufferBeforeMinutes: toSafeNumber(
        resourceRecord?.defaultBufferBeforeMinutes,
        0,
      ),
      defaultBufferAfterMinutes: toSafeNumber(
        resourceRecord?.defaultBufferAfterMinutes,
        0,
      ),
      parallelCapacityValue: toSafeNumber(
        resourceRecord?.parallelCapacityValue,
        1,
      ),
      numberOfResourcesExpected: toSafeNumber(
        resourceRecord?.numberOfResourcesExpected,
        0,
      ),
      versionNo: toSafeNumber(resourceRecord?.versionNo, 0),
      requirePractitioner: Boolean(resourceRecord?.requirePractitioner),
      requirePreAssessment: Boolean(resourceRecord?.requirePreAssessment),
      allowedServices: Array.isArray(resourceRecord?.allowedServices)
        ? resourceRecord.allowedServices
        : [],
      workingDays: Array.isArray(resourceRecord?.workingDays)
        ? resourceRecord.workingDays
        : [],
    }),
    [resourceRecord],
  );

  const setResourceRecordAndTrackTiming = useCallback((nextRecord: any) => {
    setResourceRecord((previousRecord: any) => {
      const resolvedRecord =
        typeof nextRecord === "function" ? nextRecord(previousRecord) : nextRecord;

      if (resolvedRecord === previousRecord) {
        return previousRecord;
      }

      if (
        resolvedRecord?.durationMinutes !== previousRecord?.durationMinutes ||
        resolvedRecord?.defaultBufferBeforeMinutes !==
          previousRecord?.defaultBufferBeforeMinutes ||
        resolvedRecord?.defaultBufferAfterMinutes !==
          previousRecord?.defaultBufferAfterMinutes ||
        resolvedRecord?.parallelCapacityValue !==
          previousRecord?.parallelCapacityValue
      ) {
        timingFieldsTouchedRef.current = true;
      }

      return resolvedRecord;
    });
  }, []);

  const appendUniqueById = useCallback(
    (currentItems: any[], newItems: any[]) => {
      const existingIds = new Set(currentItems.map((item) => item.id));
      return [
        ...currentItems,
        ...newItems.filter((item) => !existingIds.has(item.id)),
      ];
    },
    [],
  );

  const normalizeAllowedServices = useCallback(
    (input: unknown): AllowedService[] => {
      if (!Array.isArray(input)) return [];

      return input
        .map((allowedService: any) => {
          if (typeof allowedService === "string") {
            return { id: null, service: allowedService };
          }

          if (
            allowedService &&
            typeof allowedService === "object" &&
            "service" in allowedService
          ) {
            return {
              id: allowedService.id ?? null,
              service: allowedService.service ?? null,
            };
          }

          return null;
        })
        .filter(Boolean) as AllowedService[];
    },
    [],
  );

  const parentTemplateAllowedServices = useMemo(
    () => normalizeAllowedServices(mainTemplate?.allowedServices),
    [mainTemplate?.allowedServices, normalizeAllowedServices],
  );

  const areAllowedServicesEqual = useCallback(
    (firstAllowedServices: any[] = [], secondAllowedServices: any[] = []) => {
      if (firstAllowedServices.length !== secondAllowedServices.length)
        return false;

      return firstAllowedServices.every(
        (allowedService, index) =>
          allowedService?.id === secondAllowedServices[index]?.id &&
          allowedService?.service === secondAllowedServices[index]?.service,
      );
    },
    [],
  );

  const selectedAllowedServiceValues = useMemo(() => {
    if (!Array.isArray(resourceRecord?.allowedServices)) return [];

    return resourceRecord.allowedServices
      .map((allowedService: AllowedService) => allowedService?.service)
      .filter(
        (service: unknown): service is string =>
          typeof service === "string" && service.length > 0,
      );
  }, [resourceRecord?.allowedServices]);

  const getTimingValues = useCallback(
    (source: any) => ({
      durationMinutes: toSafeNumber(
        source?.durationMinutes ??
          source?.defaultDurationMinutes ??
          source?.slotDurationMinutes,
        0,
      ),
      defaultBufferBeforeMinutes: toSafeNumber(
        source?.defaultBufferBeforeMinutes ??
          source?.defaultSlotBeforeMinutes ??
          source?.slotBeforeMinutes,
        0,
      ),
      defaultBufferAfterMinutes: toSafeNumber(
        source?.defaultBufferAfterMinutes ??
          source?.defaultSlotAfterMinutes ??
          source?.slotAfterMinutes,
        0,
      ),
      parallelCapacityValue: toSafeNumber(source?.parallelCapacityValue, 1),
    }),
    [],
  );

  const areWorkingDaysEqual = useCallback(
    (firstWorkingDays: any[] = [], secondWorkingDays: any[] = []) => {
      if (firstWorkingDays.length !== secondWorkingDays.length) return false;

      return firstWorkingDays.every(
        (workingDay, index) =>
          String(workingDay?.dayOfWeek) ===
            String(secondWorkingDays[index]?.dayOfWeek) &&
          Boolean(workingDay?.isWorking) ===
            Boolean(secondWorkingDays[index]?.isWorking),
      );
    },
    [],
  );

  const normalizeWorkingDays = useCallback(
    (sourceWorkingDays: any[] = []): WorkingDay[] => {
      if (!dayOptions.length) return [];

      return dayOptions.map((dayOption) => {
        const matchedWorkingDay = sourceWorkingDays.find(
          (workingDay: any) =>
            String(workingDay?.dayOfWeek) === String(dayOption.value),
        );

        return {
          dayOfWeek: dayOption.value,
          isWorking: matchedWorkingDay
            ? matchedWorkingDay.isWorking !== false
            : false,
        };
      });
    },
    [dayOptionsKey],
  );

  const applyWorkingDays = useCallback(
    (sourceWorkingDays: any[] = []) => {
      if (!dayOptions.length) return;

      const normalizedWorkingDays = normalizeWorkingDays(sourceWorkingDays);
      workingDaysTouchedRef.current = false;

      setResourceRecord((previousRecord: any) => {
        const previousWorkingDays = previousRecord?.workingDays ?? [];
        if (areWorkingDaysEqual(previousWorkingDays, normalizedWorkingDays))
          return previousRecord;

        return {
          ...previousRecord,
          workingDays: normalizedWorkingDays,
        };
      });
    },
    [areWorkingDaysEqual, normalizeWorkingDays, dayOptions.length],
  );

  const workingDaysRecord = useMemo(() => {
    const workingDaysMap: Record<string, boolean> = {};

    if (!dayOptions.length) return workingDaysMap;

    dayOptions.forEach((dayOption) => {
      workingDaysMap[dayOption.value] = false;
    });

    (resourceRecord?.workingDays ?? []).forEach((workingDay: WorkingDay) => {
      if (
        workingDay?.dayOfWeek !== undefined &&
        workingDay?.dayOfWeek !== null
      ) {
        workingDaysMap[workingDay.dayOfWeek] = workingDay.isWorking !== false;
      }
    });

    return workingDaysMap;
  }, [resourceRecord?.workingDays, dayOptionsKey]);

  const updatePaginationState = useCallback(
    (
      setPaginationState: React.Dispatch<React.SetStateAction<PaginationState>>,
      rows: any[],
      nextLink: string | null,
      append: boolean,
    ) => {
      setPaginationState((previousState) => ({
        items: append ? appendUniqueById(previousState.items, rows) : rows,
        hasMore: Boolean(nextLink),
        nextLink,
      }));
    },
    [appendUniqueById],
  );

  const clearPaginationState = useCallback(
    (
      setPaginationState: React.Dispatch<React.SetStateAction<PaginationState>>,
      append: boolean,
    ) => {
      if (append) return;
      setPaginationState(createEmptyPaginationState());
    },
    [],
  );

  const loadDiagnosticTests = useCallback(
    async ({ page = 0, append = false }: LoadPageParams = {}) => {
      try {
        const response = await loadDiagnosticTestsQuery({
          page,
          size: PAGE_SIZE,
          sort: "id,asc",
        }).unwrap();
        updatePaginationState(
          setDiagnosticTestsPagination,
          response?.data ?? [],
          response?.links?.next ?? null,
          append,
        );
      } catch {
        clearPaginationState(setDiagnosticTestsPagination, append);
      }
    },
    [clearPaginationState, loadDiagnosticTestsQuery, updatePaginationState],
  );

  const loadCatalogs = useCallback(
    async ({ page = 0, append = false }: LoadPageParams = {}) => {
      try {
        const response = await loadCatalogsQuery({
          page,
          size: PAGE_SIZE,
          sort: "id,asc",
        }).unwrap();
        updatePaginationState(
          setCatalogsPagination,
          response?.data ?? [],
          response?.links?.next ?? null,
          append,
        );
      } catch {
        clearPaginationState(setCatalogsPagination, append);
      }
    },
    [clearPaginationState, loadCatalogsQuery, updatePaginationState],
  );

  const loadRooms = useCallback(
    async ({ page = 0, append = false }: LoadPageParams = {}) => {
      if (!safeResourceRecord?.departmentId) return;

      try {
        const response = await loadRoomsQuery({
          departmentId: safeResourceRecord.departmentId,
          page,
          size: PAGE_SIZE,
          sort: "id,asc",
        }).unwrap();

        updatePaginationState(
          setRoomsPagination,
          response?.data ?? [],
          response?.links?.next ?? null,
          append,
        );
      } catch {
        clearPaginationState(setRoomsPagination, append);
      }
    },
    [
      clearPaginationState,
      loadRoomsQuery,
      safeResourceRecord?.departmentId,
      updatePaginationState,
    ],
  );

  const loadFacilityServices = useCallback(
    async ({ page = 0, append = false }: LoadPageParams = {}) => {
      try {
        const response = await loadFacilityServicesQuery({
          page,
          size: PAGE_SIZE,
          sort: "id,asc",
        }).unwrap();
        updatePaginationState(
          setFacilityServicesPagination,
          response?.data ?? [],
          response?.links?.next ?? null,
          append,
        );
        console.log("Facility Services Response:", response);
      } catch {
        clearPaginationState(setFacilityServicesPagination, append);
      }
    },
    [clearPaginationState, loadFacilityServicesQuery, updatePaginationState],
  );

  const loadDepartmentServices = useCallback(
    async ({ page = 0, append = false }: LoadPageParams = {}) => {
      if (!safeResourceRecord?.departmentId) return;

      try {
        const response = await loadDepartmentServicesQuery({
          sourceId: safeResourceRecord.departmentId,
          page,
          size: PAGE_SIZE,
          sort: "id,asc",
        }).unwrap();

        updatePaginationState(
          setDepartmentServicesPagination,
          response?.data ?? [],
          response?.links?.next ?? null,
          append,
        );
      } catch {
        clearPaginationState(setDepartmentServicesPagination, append);
      }
    },
    [
      clearPaginationState,
      loadDepartmentServicesQuery,
      safeResourceRecord?.departmentId,
      updatePaginationState,
    ],
  );

  const loadDepartmentPractitioners = useCallback(
    async ({ page = 0, append = false }: LoadPageParams = {}) => {
      if (!safeResourceRecord?.departmentId) return;

      try {
        const response = await loadDepartmentPractitionersQuery({
          departmentId: safeResourceRecord.departmentId,
          page,
          size: PAGE_SIZE,
          sort: "id,asc",
        }).unwrap();

        updatePaginationState(
          setDepartmentPractitionersPagination,
          response?.data ?? [],
          response?.links?.next ?? null,
          append,
        );
      } catch {
        clearPaginationState(setDepartmentPractitionersPagination, append);
      }
    },
    [
      clearPaginationState,
      loadDepartmentPractitionersQuery,
      safeResourceRecord?.departmentId,
      updatePaginationState,
    ],
  );

  const loadNextPage = useCallback(
    async (
      nextLink: string | null,
      loader: (params: LoadPageParams) => Promise<void>,
    ) => {
      if (!nextLink) return;

      const { page } = extractPaginationFromLink(nextLink);
      await loader({ page, append: true });
    },
    [],
  );

  const setWorkingDaysRecord = useCallback(
    (nextWorkingDaysRecord: Record<string, boolean>) => {
      if (!dayOptions.length) return;

      const nextWorkingDays = dayOptions.map((dayOption) => ({
        dayOfWeek: dayOption.value,
        isWorking: Boolean(nextWorkingDaysRecord[dayOption.value]),
      }));

      workingDaysTouchedRef.current = true;

      scheduleUiStateUpdate(() => {
        setResourceRecord((previousRecord: any) => {
          if (
            areWorkingDaysEqual(
              previousRecord?.workingDays ?? [],
              nextWorkingDays,
            )
          ) {
            return previousRecord;
          }

          return {
            ...previousRecord,
            workingDays: nextWorkingDays,
          };
        });
      });
    },
    [areWorkingDaysEqual, dayOptionsKey],
  );

  const handleTemplateTypeChange = useCallback(
    (nextRecord: any) => {
      const nextTemplateType = nextRecord?.templateType;

      workingDaysTouchedRef.current = false;
      timingFieldsTouchedRef.current = false;
      isModalJustOpenedRef.current = false;
      lastAppliedResourceDefaultsKeyRef.current = null;
      lastClearedResourceDefaultsKeyRef.current = null;

      setResourceRecord((previousRecord: any) => ({
        ...previousRecord,
        ...nextRecord,
        resourceId: undefined,
        defaultPractitionerId: undefined,
        workingDays: normalizeWorkingDays(mainTemplateWorkingDays),
        requirePractitioner: nextTemplateType === PRACTITIONER_TEMPLATE_TYPE,
      }));
    },
    [mainTemplateWorkingDays, normalizeWorkingDays],
  );

  const handleAllowedServiceChange = useCallback(
    (serviceValue: string, fieldName: string, nextRecord: any) => {
      const isChecked = Boolean(nextRecord[fieldName]);
      allowedServicesTouchedRef.current = true;

      scheduleUiStateUpdate(() => {
        setResourceRecord((previousRecord: any) => {
          const previousAllowedServices = Array.isArray(
            previousRecord?.allowedServices,
          )
            ? previousRecord.allowedServices
            : [];

          const previousServiceValues = previousAllowedServices
            .map((allowedService: AllowedService) => allowedService?.service)
            .filter(
              (service: unknown): service is string =>
                typeof service === "string" && service.length > 0,
            );

          if (isChecked) {
            if (previousServiceValues.includes(serviceValue))
              return previousRecord;

            return {
              ...previousRecord,
              allowedServices: [
                ...previousAllowedServices,
                { id: null, service: serviceValue },
              ],
            };
          }

          if (!previousServiceValues.includes(serviceValue)) {
            return previousRecord;
          }

          return {
            ...previousRecord,
            allowedServices: previousAllowedServices.filter(
              (allowedService: AllowedService) =>
                allowedService?.service !== serviceValue,
            ),
          };
        });
      });
    },
    [],
  );

  const extractErrorMessage = useCallback((error: any): string => {
    const normalizeMessage = (message?: unknown) => {
      if (typeof message !== "string" || !message.trim()) return "";

      return message
        .replace(/^error\./i, "")
        .replace(/_/g, " ")
        .trim();
    };

    const possibleMessages = [
      error?.data?.properties?.message,
      error?.data?.message,
      error?.data?.detail,
      error?.data?.title,
      error?.error?.data?.properties?.message,
      error?.error?.data?.message,
      error?.error?.data?.detail,
      error?.error?.data?.title,
      error?.message,
    ];

    for (const message of possibleMessages) {
      const normalizedMessage = normalizeMessage(message);
      const lowerMessage = normalizedMessage.toLowerCase();

      if (
        normalizedMessage &&
        lowerMessage !== "internal server error" &&
        lowerMessage !== "bad request"
      ) {
        return normalizedMessage;
      }
    }

    return "Save Failed";
  }, []);

  const validateRecordBeforeSave = useCallback(() => {
    if (!safeResourceRecord?.templateName?.trim()) {
      dispatch(notify({ msg: "Template Name is required", sev: "warning" }));
      return false;
    }

    if (!safeResourceRecord?.facilityId) {
      dispatch(notify({ msg: "Facility is required", sev: "warning" }));
      return false;
    }

    if (!safeResourceRecord?.templateType) {
      dispatch(notify({ msg: "Template Type is required", sev: "warning" }));
      return false;
    }

    if (!safeResourceRecord?.departmentId) {
      dispatch(notify({ msg: "Department is required", sev: "warning" }));
      return false;
    }

    if (!safeResourceRecord?.resourceId) {
      dispatch(notify({ msg: "Resource is required", sev: "warning" }));
      return false;
    }

    if (
      safeResourceRecord?.requirePractitioner &&
      !safeResourceRecord?.defaultPractitionerId
    ) {
      dispatch(
        notify({ msg: "Default Practitioner is required", sev: "warning" }),
      );
      return false;
    }

    return true;
  }, [dispatch, safeResourceRecord]);

  const handleSaveMainInfo = useCallback(async () => {
    if (isSaving) return;
    if (!validateRecordBeforeSave()) return;

    setIsSaving(true);

    const payload = {
      ...resourceRecord,
      numberOfResourcesExpected: toSafeNumber(
        resourceRecord?.numberOfResourcesExpected,
        0,
      ),
      durationMinutes: toSafeNumber(resourceRecord?.durationMinutes, 0),
      defaultBufferBeforeMinutes: toSafeNumber(
        resourceRecord?.defaultBufferBeforeMinutes,
        0,
      ),
      defaultBufferAfterMinutes: toSafeNumber(
        resourceRecord?.defaultBufferAfterMinutes,
        0,
      ),
      parallelCapacityValue: toSafeNumber(
        resourceRecord?.parallelCapacityValue,
        1,
      ),
      allowedServices: Array.isArray(resourceRecord?.allowedServices)
        ? resourceRecord.allowedServices
        : [],
      workingDays: Array.isArray(resourceRecord?.workingDays)
        ? resourceRecord.workingDays
        : [],
    };

    try {
      if (isEditMode) {
        await updateAvailabilityTemplate({
          id: resourceRecord?.id,
          ...payload,
        }).unwrap();
      } else {
        await createAvailabilityTemplate(payload).unwrap();
      }

      dispatch(
        notify({
          msg: isEditMode ? "Updated Successfully" : "Saved Successfully",
          sev: "success",
        }),
      );
      setResourceRecord(createInitialResourceRecord());
      setSelectedTemplateColor(DEFAULT_TEMPLATE_COLOR);
      setOpen(false);
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      dispatch(notify({ msg: errorMessage, sev: "warning" }));
    } finally {
      setIsSaving(false);
    }
  }, [
    createAvailabilityTemplate,
    dispatch,
    extractErrorMessage,
    isEditMode,
    isSaving,
    resourceRecord,
    setOpen,
    updateAvailabilityTemplate,
    validateRecordBeforeSave,
  ]);

  const applyResourceDefaults = useCallback(
    (resourceDetails: any, sourceWorkingDays?: any[]) => {
      const shouldApplyResourceDefaults = !isEditingExistingRecord;

      if (isEditingExistingRecord && isModalJustOpenedRef.current) {
        applyWorkingDays(editRecordWorkingDays);
        isModalJustOpenedRef.current = false;
        return;
      }

      if (sourceWorkingDays && !workingDaysTouchedRef.current) {
        applyWorkingDays(sourceWorkingDays);
      }

      if (!shouldApplyResourceDefaults || timingFieldsTouchedRef.current) {
        isModalJustOpenedRef.current = false;
        return;
      }

      setResourceRecord((previousRecord: any) => {
        const timingValues = getTimingValues(resourceDetails);
        const nextDefaultPractitionerId =
          previousRecord?.templateType === PRACTITIONER_TEMPLATE_TYPE
            ? resourceDetails?.id
            : previousRecord?.defaultPractitionerId;

        if (
          previousRecord?.durationMinutes === timingValues.durationMinutes &&
          previousRecord?.defaultBufferBeforeMinutes ===
            timingValues.defaultBufferBeforeMinutes &&
          previousRecord?.defaultBufferAfterMinutes ===
            timingValues.defaultBufferAfterMinutes &&
          previousRecord?.parallelCapacityValue ===
            timingValues.parallelCapacityValue &&
          previousRecord?.defaultPractitionerId === nextDefaultPractitionerId
        ) {
          return previousRecord;
        }

        return {
          ...previousRecord,
          ...timingValues,
          defaultPractitionerId: nextDefaultPractitionerId,
        };
      });

      isModalJustOpenedRef.current = false;
    },
    [
      applyWorkingDays,
      editRecordWorkingDays,
      getTimingValues,
      isEditingExistingRecord,
    ],
  );

  useEffect(() => {
    if (!open) return;

    loadDiagnosticTests({ page: 0 });
    loadCatalogs({ page: 0 });
    loadFacilityServices({ page: 0 });
  }, [loadCatalogs, loadDiagnosticTests, loadFacilityServices, open]);

  useEffect(() => {
    if (!safeResourceRecord?.departmentId) {
      lastDepartmentLoadKeyRef.current = null;
      return;
    }

    const departmentLoadKey = String(safeResourceRecord.departmentId);
    if (lastDepartmentLoadKeyRef.current === departmentLoadKey) return;
    lastDepartmentLoadKeyRef.current = departmentLoadKey;

    setDepartmentServicesPagination(createEmptyPaginationState());
    setDepartmentPractitionersPagination(createEmptyPaginationState());
    setRoomsPagination(createEmptyPaginationState());

    loadDepartmentServices({ page: 0 });
    loadDepartmentPractitioners({ page: 0 });
    loadRooms({ page: 0 });
  }, [
    loadDepartmentPractitioners,
    loadDepartmentServices,
    loadRooms,
    safeResourceRecord?.departmentId,
  ]);

  useEffect(() => {
    if (!open) {
      initializedRecordKeyRef.current = null;
      lastDepartmentLoadKeyRef.current = null;
      lastAppliedResourceDefaultsKeyRef.current = null;
      lastClearedResourceDefaultsKeyRef.current = null;
      isModalJustOpenedRef.current = false;
      allowedServicesTouchedRef.current = false;
      workingDaysTouchedRef.current = false;
      timingFieldsTouchedRef.current = false;
      setSelectedTemplateColor(DEFAULT_TEMPLATE_COLOR);
      setResourceRecord(createInitialResourceRecord());
      return;
    }

    const initializeKey = `${editRecord?.id ?? "new"}:${
      mainTemplate?.id ?? ""
    }:${selectedFacility?.id ?? ""}:${dayOptions.length}`;

    if (initializedRecordKeyRef.current === initializeKey) return;
    initializedRecordKeyRef.current = initializeKey;

    isModalJustOpenedRef.current = true;
    allowedServicesTouchedRef.current = false;
    workingDaysTouchedRef.current = false;
    timingFieldsTouchedRef.current = false;
    lastAppliedResourceDefaultsKeyRef.current = null;
    lastClearedResourceDefaultsKeyRef.current = null;

    if (editRecord?.id) {
      const nextRecord = {
        ...editRecord,
        templateName: editRecord?.templateName ?? "",
        resourceId: editRecord?.resourceId,
        allowedServices: normalizeAllowedServices(editRecord?.allowedServices),
        facilityId: selectedFacility?.id ?? editRecord?.facilityId,
        departmentId: editRecord?.departmentId ?? mainTemplate?.departmentId,
        workingDays: normalizeWorkingDays(editRecordWorkingDays),
        requirePractitioner: Boolean(editRecord?.requirePractitioner),
        requirePreAssessment: Boolean(editRecord?.requirePreAssessment),
        numberOfResourcesExpected: toSafeNumber(
          editRecord?.numberOfResourcesExpected,
          0,
        ),
        versionNo: toSafeNumber(editRecord?.versionNo, 0),
        ...getTimingValues(editRecord),
      };

      setResourceRecord((previousRecord: any) => {
        if (
          previousRecord?.id === nextRecord.id &&
          previousRecord?.resourceId === nextRecord.resourceId &&
          previousRecord?.facilityId === nextRecord.facilityId &&
          previousRecord?.departmentId === nextRecord.departmentId &&
          areWorkingDaysEqual(
            previousRecord?.workingDays ?? [],
            nextRecord.workingDays,
          ) &&
          areAllowedServicesEqual(
            previousRecord?.allowedServices ?? [],
            nextRecord.allowedServices ?? [],
          )
        ) {
          return previousRecord;
        }

        return nextRecord;
      });

      const nextTemplateColor =
        editRecord?.templateColor ??
        mainTemplate?.color ??
        DEFAULT_TEMPLATE_COLOR;

      setSelectedTemplateColor((previousColor) =>
        previousColor === nextTemplateColor ? previousColor : nextTemplateColor,
      );
      return;
    }

    const nextRecord = {
      ...newAvailabilityTemplateCreateDTO,
      templateName: newAvailabilityTemplateCreateDTO?.templateName ?? "",
      parentTemplateId: mainTemplate?.id,
      facilityId: selectedFacility?.id,
      departmentId: mainTemplate?.departmentId,
      workingDays: normalizeWorkingDays(mainTemplateWorkingDays),
      durationMinutes: toSafeNumber(
        newAvailabilityTemplateCreateDTO?.durationMinutes,
        0,
      ),
      defaultBufferBeforeMinutes: toSafeNumber(
        newAvailabilityTemplateCreateDTO?.defaultBufferBeforeMinutes,
        0,
      ),
      defaultBufferAfterMinutes: toSafeNumber(
        newAvailabilityTemplateCreateDTO?.defaultBufferAfterMinutes,
        0,
      ),
      parallelCapacityValue: toSafeNumber(mainTemplate?.parallelCapacityValue, 1),
      numberOfResourcesExpected: toSafeNumber(
        newAvailabilityTemplateCreateDTO?.numberOfResourcesExpected,
        0,
      ),
      versionNo: toSafeNumber(newAvailabilityTemplateCreateDTO?.versionNo, 0),
      requirePractitioner: Boolean(
        newAvailabilityTemplateCreateDTO?.requirePractitioner,
      ),
      requirePreAssessment: Boolean(
        newAvailabilityTemplateCreateDTO?.requirePreAssessment,
      ),
      allowedServices: parentTemplateAllowedServices,
    };

    setResourceRecord(nextRecord);

    const nextTemplateColor = mainTemplate?.color ?? DEFAULT_TEMPLATE_COLOR;
    setSelectedTemplateColor((previousColor) =>
      previousColor === nextTemplateColor ? previousColor : nextTemplateColor,
    );
  }, [
    areAllowedServicesEqual,
    areWorkingDaysEqual,
    dayOptions.length,
    editRecord,
    editRecordWorkingDays,
    editRecordWorkingDaysKey,
    getTimingValues,
    mainTemplate?.color,
    mainTemplate?.departmentId,
    mainTemplate?.id,
    mainTemplate?.parallelCapacityValue,
    mainTemplateWorkingDays,
    mainTemplateWorkingDaysKey,
    normalizeAllowedServices,
    normalizeWorkingDays,
    open,
    parentTemplateAllowedServices,
    selectedFacility?.id,
  ]);

  useEffect(() => {
    allowedServicesTouchedRef.current = false;
  }, [safeResourceRecord?.departmentId]);

  useEffect(() => {
    workingDaysTouchedRef.current = false;
  }, [safeResourceRecord?.facilityId]);

  useEffect(() => {
    if (!open || isEditMode || allowedServicesTouchedRef.current) return;
    if (parentTemplateAllowedServices.length === 0) return;

    setResourceRecord((previousRecord: any) => {
      const previousAllowedServices = Array.isArray(
        previousRecord?.allowedServices,
      )
        ? previousRecord.allowedServices
        : [];

      if (previousAllowedServices.length > 0) return previousRecord;

      return {
        ...previousRecord,
        allowedServices: parentTemplateAllowedServices,
      };
    });
  }, [isEditMode, open, parentTemplateAllowedServices]);

  useEffect(() => {
    const resourceDefaultsKey = `${safeResourceRecord?.templateType ?? ""}:${
      safeResourceRecord?.resourceId ?? ""
    }`;

    if (!safeResourceRecord?.resourceId) {
      lastAppliedResourceDefaultsKeyRef.current = null;

      if (isEditingExistingRecord) return;
      if (lastClearedResourceDefaultsKeyRef.current === resourceDefaultsKey)
        return;

      lastClearedResourceDefaultsKeyRef.current = resourceDefaultsKey;

      setResourceRecord((previousRecord: any) => {
        const nextRecord = {
          ...previousRecord,
          durationMinutes: 0,
          defaultBufferBeforeMinutes: 0,
          defaultBufferAfterMinutes: 0,
          parallelCapacityValue: toSafeNumber(
            mainTemplate?.parallelCapacityValue,
            1,
          ),
          defaultPractitionerId: undefined,
        };

        if (
          previousRecord?.durationMinutes === nextRecord.durationMinutes &&
          previousRecord?.defaultBufferBeforeMinutes ===
            nextRecord.defaultBufferBeforeMinutes &&
          previousRecord?.defaultBufferAfterMinutes ===
            nextRecord.defaultBufferAfterMinutes &&
          previousRecord?.parallelCapacityValue ===
            nextRecord.parallelCapacityValue &&
          previousRecord?.defaultPractitionerId ===
            nextRecord.defaultPractitionerId
        ) {
          return previousRecord;
        }

        return nextRecord;
      });

      if (!workingDaysTouchedRef.current) {
        applyWorkingDays(mainTemplateWorkingDays);
      }
      return;
    }

    lastClearedResourceDefaultsKeyRef.current = null;

    if (lastAppliedResourceDefaultsKeyRef.current === resourceDefaultsKey) {
      return;
    }

    lastAppliedResourceDefaultsKeyRef.current = resourceDefaultsKey;

    if (safeResourceRecord?.templateType === PRACTITIONER_TEMPLATE_TYPE) {
      getPractitionerById(safeResourceRecord.resourceId)
        .unwrap()
        .then((practitionerDetails) => {
          const practitionerWorkingDays =
            practitionerDetails?.workingDays ?? [];
          const hasPractitionerWorkingDays = practitionerWorkingDays.some(
            (workingDay: any) => workingDay?.isWorking,
          );
          const finalWorkingDays = hasPractitionerWorkingDays
            ? practitionerWorkingDays
            : mainTemplateWorkingDays;

          applyResourceDefaults(practitionerDetails, finalWorkingDays);
        })
        .catch(() => {
          lastAppliedResourceDefaultsKeyRef.current = null;
          if (!isEditingExistingRecord)
            applyWorkingDays(mainTemplateWorkingDays);
          isModalJustOpenedRef.current = false;
        });
      return;
    }

    if (safeResourceRecord?.templateType === SERVICE_TEMPLATE_TYPE) {
      getServiceById(safeResourceRecord.resourceId)
        .unwrap()
        .then((serviceDetails) => {
          applyResourceDefaults(
            serviceDetails,
            !isEditingExistingRecord ? mainTemplateWorkingDays : undefined,
          );
        })
        .catch(() => {
          lastAppliedResourceDefaultsKeyRef.current = null;
        });
      return;
    }

    if (safeResourceRecord?.templateType === ROOM_TEMPLATE_TYPE) {
      getRoomById({ id: safeResourceRecord.resourceId })
        .unwrap()
        .then((roomDetails) => {
          applyResourceDefaults(
            roomDetails,
            !isEditingExistingRecord ? mainTemplateWorkingDays : undefined,
          );
        })
        .catch(() => {
          lastAppliedResourceDefaultsKeyRef.current = null;
        });
      return;
    }

    if (safeResourceRecord?.templateType === DIAGNOSTIC_TEST_TEMPLATE_TYPE) {
      getDiagnosticTestById(String(safeResourceRecord.resourceId))
        .unwrap()
        .then((diagnosticTestResponse) => {
          applyResourceDefaults(
            diagnosticTestResponse?.data,
            !isEditingExistingRecord ? mainTemplateWorkingDays : undefined,
          );
        })
        .catch(() => {
          lastAppliedResourceDefaultsKeyRef.current = null;
        });
      return;
    }

    if (safeResourceRecord?.templateType === CATALOG_TEMPLATE_TYPE) {
      getCatalogById(safeResourceRecord.resourceId)
        .unwrap()
        .then((catalogDetails) => {
          applyResourceDefaults(
            catalogDetails,
            !isEditingExistingRecord ? mainTemplateWorkingDays : undefined,
          );
        })
        .catch(() => {
          lastAppliedResourceDefaultsKeyRef.current = null;
        });
    }
  }, [
    applyResourceDefaults,
    applyWorkingDays,
    getCatalogById,
    getDiagnosticTestById,
    getPractitionerById,
    getRoomById,
    getServiceById,
    isEditingExistingRecord,
    mainTemplate?.parallelCapacityValue,
    mainTemplateWorkingDaysKey,
    safeResourceRecord?.resourceId,
    safeResourceRecord?.templateType,
  ]);

  const renderResourceField = useCallback(() => {
    const commonProps = {
      width: "100%",
      fieldName: "resourceId",
      fieldType: "selectPagination" as const,
      selectDataLabel: "label",
      selectDataValue: "value",
      record: safeResourceRecord,
      setRecord: setResourceRecord,
      menuMaxHeight: 200,
      required: true,
      disabled: isReadOnly,
    };

    switch (safeResourceRecord?.templateType) {
      case PRACTITIONER_TEMPLATE_TYPE:
        return (
          <Col md={12}>
            <MyInput
              {...commonProps}
              fieldLabel="Practitioner"
              selectData={departmentPractitionersPagination.items}
              selectDataLabel={["firstName", "lastName"]}
              selectDataValue="id"
              loading={isDepartmentPractitionerLoading}
              hasMore={departmentPractitionersPagination.hasMore}
              onFetchMore={() =>
                loadNextPage(
                  departmentPractitionersPagination.nextLink,
                  loadDepartmentPractitioners,
                )
              }
            />
          </Col>
        );

      case SERVICE_TEMPLATE_TYPE:
        return (
          <Col md={12}>
            <MyInput
              {...commonProps}
              fieldLabel="Service"
              selectData={facilityServicesPagination.items}
              selectDataLabel="name"
              selectDataValue="id"
              loading={isFacilityServiceLoading}
              hasMore={facilityServicesPagination.hasMore}
              onFetchMore={() =>
                loadNextPage(
                  facilityServicesPagination.nextLink,
                  loadFacilityServices,
                )
              }
            />
          </Col>
        );

      case CATALOG_TEMPLATE_TYPE:
        return (
          <Col md={12}>
            <MyInput
              {...commonProps}
              fieldLabel="Catalog"
              selectData={catalogsPagination.items}
              selectDataLabel="name"
              selectDataValue="id"
              loading={isCatalogLoading}
              hasMore={catalogsPagination.hasMore}
              onFetchMore={() =>
                loadNextPage(catalogsPagination.nextLink, loadCatalogs)
              }
            />
          </Col>
        );

      case DIAGNOSTIC_TEST_TEMPLATE_TYPE:
        return (
          <Col md={12}>
            <MyInput
              {...commonProps}
              fieldLabel="Diagnostic Test"
              selectData={diagnosticTestsPagination.items}
              selectDataLabel="name"
              selectDataValue="id"
              loading={isDiagnosticTestLoading}
              hasMore={diagnosticTestsPagination.hasMore}
              onFetchMore={() =>
                loadNextPage(
                  diagnosticTestsPagination.nextLink,
                  loadDiagnosticTests,
                )
              }
            />
          </Col>
        );

      case ROOM_TEMPLATE_TYPE:
        return (
          <Col md={12}>
            <MyInput
              {...commonProps}
              fieldLabel="Room"
              selectData={roomsPagination.items}
              selectDataLabel="name"
              selectDataValue="id"
              loading={isRoomLoading}
              hasMore={roomsPagination.hasMore}
              onFetchMore={() =>
                loadNextPage(roomsPagination.nextLink, loadRooms)
              }
            />
          </Col>
        );

      default:
        return null;
    }
  }, [
    catalogsPagination.items,
    catalogsPagination.hasMore,
    catalogsPagination.nextLink,
    departmentPractitionersPagination.items,
    departmentPractitionersPagination.hasMore,
    departmentPractitionersPagination.nextLink,
    diagnosticTestsPagination.items,
    diagnosticTestsPagination.hasMore,
    diagnosticTestsPagination.nextLink,
    facilityServicesPagination.items,
    facilityServicesPagination.hasMore,
    facilityServicesPagination.nextLink,
    isCatalogLoading,
    isDepartmentPractitionerLoading,
    isDiagnosticTestLoading,
    isFacilityServiceLoading,
    isReadOnly,
    isRoomLoading,
    loadCatalogs,
    loadDepartmentPractitioners,
    loadDiagnosticTests,
    loadFacilityServices,
    loadNextPage,
    loadRooms,
    roomsPagination.items,
    roomsPagination.hasMore,
    roomsPagination.nextLink,
    safeResourceRecord,
  ]);

  const renderAllowedServiceInputs = useMemo(
    () =>
      parentTemplateAllowedServices.map((allowedService) => {
        const serviceValue = allowedService?.service ?? "";
        const fieldName = `service_${serviceValue}`;
        const isChecked = selectedAllowedServiceValues.includes(serviceValue);

        return (
          <Col md={8} key={serviceValue}>
            <MyInput
              width="100%"
              fieldType="check"
              fieldName={fieldName}
              record={{ [fieldName]: Boolean(isChecked) }}
              setRecord={(nextRecord: any) =>
                handleAllowedServiceChange(serviceValue, fieldName, nextRecord)
              }
              showLabel={false}
              label={formatEnumString(serviceValue)}
              disabled={isReadOnly}
            />
          </Col>
        );
      }),
    [
      handleAllowedServiceChange,
      isReadOnly,
      parentTemplateAllowedServices,
      selectedAllowedServiceValues,
    ],
  );

  const renderWorkingDayInputs = useMemo(
    () =>
      dayOptions.map((dayOption) => (
        <MyInput
          key={dayOption.value}
          width="13vw"
          fieldName={dayOption.value}
          fieldType="check"
          record={workingDaysRecord}
          setRecord={setWorkingDaysRecord}
          label={dayOption.label}
          showLabel={false}
          disabled={isReadOnly}
        />
      )),
    [dayOptions, isReadOnly, setWorkingDaysRecord, workingDaysRecord],
  );

  const servicesAllowedSection = useMemo(
    () => (
      <Row>
        <Col md={24}>
          <SectionContainer
            title="Services Allowed"
            content={<Row>{renderAllowedServiceInputs}</Row>}
          />
        </Col>
      </Row>
    ),
    [renderAllowedServiceInputs],
  );

  const workingDaysSection = useMemo(
    () => (
      <SectionContainer
        title="Days"
        content={
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {renderWorkingDayInputs}
          </div>
        }
      />
    ),
    [renderWorkingDayInputs],
  );

  const renderFormContent = useCallback(
    () => (
      <FormContainer fluid>
        <Row>
          <Col md={12}>
            <SectionContainer
              title="Basic Information"
              content={
                <>
                  <Row>
                    <Col md={12}>
                      <MyInput
                        fieldName="templateName"
                        fieldType="text"
                        record={safeResourceRecord}
                        setRecord={setResourceRecord}
                        width="100%"
                        required
                        disabled={isReadOnly}
                      />
                    </Col>
                    <Col md={12}>
                      <MyInput
                        fieldName="status"
                        fieldType="select"
                        fieldLabel="Status"
                        record={safeResourceRecord}
                        setRecord={setResourceRecord}
                        width="100%"
                        isEnum
                        selectData={statusOptions ?? []}
                        selectDataLabel="label"
                        selectDataValue="value"
                        disabled={true}
                      />
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <MyInput
                        fieldName="templateType"
                        record={safeResourceRecord}
                        setRecord={handleTemplateTypeChange}
                        fieldType="select"
                        selectData={filteredTemplateTypeOptions ?? []}
                        selectDataLabel="label"
                        selectDataValue="value"
                        width="100%"
                        disabled={isReadOnly}
                        required
                      />
                    </Col>
                    {renderResourceField()}
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
                        record={safeResourceRecord}
                        setRecord={setResourceRecord}
                        width="100%"
                        required
                        disabled={true}
                      />
                    </Col>
                    <div className="block">
                      <Translate>Color</Translate>
                      <div className="color-picker-row">
                        <input
                          type="color"
                          value={selectedTemplateColor ?? DEFAULT_TEMPLATE_COLOR}
                          disabled={isReadOnly}
                          onChange={(event) => {
                            const nextColor = event.target.value;
                            setSelectedTemplateColor(nextColor);
                            setResourceRecord((previousRecord: any) => ({
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
                        record={safeResourceRecord}
                        setRecord={setResourceRecordAndTrackTiming}
                        width="100%"
                        rightAddon="min"
                        disabled={isReadOnly}
                      />
                    </Col>
                    <Col md={12}>
                      <MyInput
                        fieldName="parallelCapacityValue"
                        fieldLabel="Parallel Capacity Value"
                        fieldType="number"
                        record={safeResourceRecord}
                        setRecord={setResourceRecordAndTrackTiming}
                        width="100%"
                        min={1}
                        disabled={isReadOnly}
                      />
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <MyInput
                        fieldName="versionNo"
                        fieldType="number"
                        record={safeResourceRecord}
                        setRecord={setResourceRecord}
                        width="100%"
                        disabled={true}
                      />
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <MyInput
                        fieldName="defaultBufferBeforeMinutes"
                        fieldLabel="Slot Before"
                        fieldType="number"
                        record={resourceRecord}
                        setRecord={setResourceRecordAndTrackTiming}
                        width="100%"
                        disabled={isReadOnly}
                      />
                    </Col>
                    <Col md={12}>
                      <MyInput
                        fieldLabel="Slot After"
                        fieldName="defaultBufferAfterMinutes"
                        fieldType="number"
                        record={resourceRecord}
                        setRecord={setResourceRecordAndTrackTiming}
                        width="100%"
                        disabled={isReadOnly}
                      />
                    </Col>
                  </Row>
                </>
              }
            />
          </Col>

          <Col md={12}>
            <SectionContainer
              title="Department Details"
              content={
                <>
                  <MyInput
                    key={`service-dept-${safeResourceRecord?.departmentId}`}
                    width="100%"
                    fieldType="selectPagination"
                    fieldName="defaultServiceId"
                    selectData={departmentServicesPagination.items}
                    selectDataLabel="name"
                    selectDataValue="id"
                    record={safeResourceRecord}
                    setRecord={setResourceRecord}
                    loading={isDepartmentServiceLoading}
                    hasMore={departmentServicesPagination.hasMore}
                    onFetchMore={() =>
                      loadNextPage(
                        departmentServicesPagination.nextLink,
                        loadDepartmentServices,
                      )
                    }
                    disabled={isReadOnly}
                  />

                  <MyInput
                    width="100%"
                    fieldType="number"
                    fieldLabel="Number Of Resources"
                    fieldName="numberOfResourcesExpected"
                    record={safeResourceRecord}
                    setRecord={setResourceRecord}
                    disabled={isReadOnly}
                  />

                  <Row>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldType="check"
                        fieldName="requirePractitioner"
                        record={safeResourceRecord}
                        setRecord={setResourceRecord}
                        showLabel={false}
                        disabled={Boolean(
                          isReadOnly ||
                            safeResourceRecord?.templateType ===
                              PRACTITIONER_TEMPLATE_TYPE,
                        )}
                      />
                    </Col>

                    {safeResourceRecord?.requirePractitioner && (
                      <Col md={12}>
                        <MyInput
                          key={`practitioner-dept-${safeResourceRecord?.departmentId}`}
                          width="100%"
                          fieldType="selectPagination"
                          fieldName="defaultPractitionerId"
                          fieldLabel="Default Practitioner"
                          selectData={departmentPractitionersPagination.items}
                          selectDataLabel={["firstName", "lastName"]}
                          selectDataValue="id"
                          record={safeResourceRecord}
                          setRecord={setResourceRecord}
                          loading={isDepartmentPractitionerLoading}
                          hasMore={departmentPractitionersPagination.hasMore}
                          onFetchMore={() =>
                            loadNextPage(
                              departmentPractitionersPagination.nextLink,
                              loadDepartmentPractitioners,
                            )
                          }
                          disabled={Boolean(
                            isReadOnly ||
                              safeResourceRecord?.templateType ===
                                PRACTITIONER_TEMPLATE_TYPE,
                          )}
                          required
                        />
                      </Col>
                    )}
                  </Row>

                  <MyInput
                    width="100%"
                    fieldType="check"
                    fieldName="requirePreAssessment"
                    record={safeResourceRecord}
                    setRecord={setResourceRecord}
                    showLabel={false}
                    disabled={isReadOnly}
                  />
                </>
              }
            />
          </Col>
        </Row>

        {servicesAllowedSection}

        {workingDaysSection}
      </FormContainer>
    ),
    [
      departmentPractitionersPagination.items,
      departmentPractitionersPagination.hasMore,
      departmentPractitionersPagination.nextLink,
      departmentServicesPagination.items,
      departmentServicesPagination.hasMore,
      departmentServicesPagination.nextLink,
      facilityList,
      filteredTemplateTypeOptions,
      handleTemplateTypeChange,
      isDepartmentPractitionerLoading,
      isDepartmentServiceLoading,
      isReadOnly,
      loadDepartmentPractitioners,
      loadDepartmentServices,
      loadNextPage,
      renderResourceField,
      servicesAllowedSection,
      workingDaysSection,
      safeResourceRecord,
      setResourceRecordAndTrackTiming,
      selectedTemplateColor,
      statusOptions,
    ],
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        isReadOnly
          ? "View Resource"
          : isEditMode
            ? "Edit Resource"
            : "Add Resource"
      }
      size="md"
      content={renderFormContent}
      actionButtonFunction={handleSaveMainInfo}
      actionButtonLabel={isEditMode ? "Save" : "Add"}
      hideActionBtn={isReadOnly}
      actionButtonDisabled={isSaving}
    />
  );
};

export default AddResourceModal;
