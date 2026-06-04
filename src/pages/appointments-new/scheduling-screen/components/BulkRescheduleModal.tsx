import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Checkbox, Divider, Form, Loader, Modal, Panel } from "rsuite";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faRightLeft } from "@fortawesome/free-solid-svg-icons";
import { skipToken } from "@reduxjs/toolkit/query/react";

import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import "@/components/MyModal/styles.less";
import MyStepper from "@/components/MyStepper";
import MyTable from "@/components/MyTable";
import MyBadgeStatus from "@/components/MyBadgeStatus/MyBadgeStatus";
import Translate from "@/components/Translate";
import { useAppDispatch, useAppSelector } from "@/hooks";
import {
  useGetAvailabilityGenerationBatchesByTemplateQuery,
  useGetAvailabilityGenerationBatchesByTemplateExcludingBatchQuery,
} from "@/services/appointment/availabilityGenerationBatchService/availabilityGenerationBatchService";
import {
  useBulkRescheduleAppointmentsMutation,
  useCancelAppointmentMutation,
  useGetBulkReschedulePreviewQuery,
} from "@/services/appointment/appointmentService";
import {
  useGetAvailabilityTemplatesByPublishStatusQuery,
  useGetAvailabilityTemplatesByDepartmentAndActiveQuery,
} from "@/services/appointment/availabilityTemplateService";
import { useGetPatientsByIdsQuery } from "@/services/patient/patientService";
import { useGetAppointableDepartmentsQuery } from "@/services/security/departmentService";
import { useGetAppointablePractitionerByLoggedInFacilityQuery } from "@/services/setup/practitioner/PractitionerService";
import { useGetAppointableCatalogsByLoggedInFacilityQuery } from "@/services/setup/catalog/catalogService";
import { useGetAllActiveAppointableDiagnosticTestsQuery } from "@/services/setup/diagnosticTest/diagnosticTestService";
import { useGetAppointableServicesByLoggedInFacilityQuery } from "@/services/setup/serviceService";
import { useGetRoomsByIdsMutation } from "@/services/setup/room/roomService";
import type {
  AvailabilityGenerationBatch,
  AvailabilityTemplateResponseVM,
} from "@/types/model-types-new";
import { formatDateWithoutSeconds, formatEnumString } from "@/utils";
import {
  hideSystemLoader,
  notify,
  showSystemLoader,
} from "@/utils/uiReducerActions";

const WIZARD_STEPS = [
  { title: "Select template" },
  { title: "Select generation batch" },
  { title: "Review appointments" },
  { title: "Replacement template" },
  { title: "Replacement batch" },
  { title: "Complete" },
];

const SYSTEM_CANCEL_REASON = "cancel appointment from reschedule";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
};

function appointmentStart(row: any): Date | null {
  const raw =
    row?.startDatetime ?? row?.appointmentStart ?? row?.appointmentDateTime;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isStrictlyAfterCalendarToday(d: Date): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return day.getTime() > today.getTime();
}

function normalizeApptStatus(row: any): string {
  return String(row?.status ?? row?.appointmentStatus ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function isFreeSlotStatus(s: string): boolean {
  return s === "NEW" || s === "RESCHEDULE" || s === "NEW_APPOINTMENT";
}

function isBookedOrConfirmed(s: string): boolean {
  return s === "BOOKED" || s === "CONFIRMED";
}

function getAppointmentPatientId(row: any): number | null {
  const raw =
    row?.patientId ??
    (typeof row?.patient === "object" ? row.patient?.id : row?.patient) ??
    row?.patient?.patientId ??
    row?.patient?.patient_id;
  const numeric = Number(raw);
  const result = Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  return result;
}

function getPatientFullName(patient: any): string {
  if (!patient) return "";
  if (typeof patient === "string") return patient.trim();
  const candidateName = [
    patient?.firstName ?? patient?.first_name,
    patient?.secondName ?? patient?.second_name,
    patient?.thirdName ?? patient?.third_name,
    patient?.lastName ?? patient?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  return (
    candidateName ||
    String(
      patient?.fullName ?? patient?.full_name ?? patient?.name ?? "",
    ).trim()
  );
}

function normalizeResourceTypeKey(value: any): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[-\s]+/g, "_");
}

function getAppointmentResourceType(row: any): string {
  return normalizeResourceTypeKey(row?.resourceType ?? "");
}
function getTemplateResourceType(row: any): string {
  return normalizeResourceTypeKey(row?.templateType ?? row?.resourceType ?? "");
}

function getCanonicalResourceTypeKey(value: any): string {
  const key = normalizeResourceTypeKey(value);
  if (!key) return key;
  if (key.includes("DEPARTMENT")) return "DEPARTMENT";
  if (key.includes("PRACTITIONER")) return "PRACTITIONER";
  if (key.includes("CATALOG")) return "CATALOG";
  if (
    key.includes("DIAGNOSTIC") ||
    key.includes("LAB") ||
    key.includes("RADIOLOGY") ||
    key.includes("TEST")
  )
    return "DIAGNOSTIC_TEST";
  if (key.includes("SERVICE")) return "SERVICE";
  if (key.includes("ROOM")) return "ROOM";
  return key;
}

function getAppointmentDepartmentId(row: any): number | string | null {
  return (
    row?.departmentId ??
    row?.department_id ??
    row?.department?.id ??
    row?.department?.departmentId ??
    row?.department?.department_id ??
    row?.appointmentData?.departmentId ??
    row?.appointmentData?.department_id ??
    row?.appointmentData?.department?.id ??
    row?.appointmentData?.department?.departmentId ??
    row?.appointmentData?.department?.department_id ??
    null
  );
}

function getAppointmentResourceId(row: any): number | string | null {
  return (
    row?.resourceId ??
    row?.resource?.id ??
    row?.resource?.key ??
    row?.resource?.resourceId ??
    row?.appointmentData?.resourceId ??
    row?.appointmentData?.resource?.id ??
    row?.appointmentData?.resource?.key ??
    null
  );
}

function getRowResourceId(row: any): number | string | null {
  return getAppointmentResourceId(row);
}

function extractErrorMessage(response: any): string {
  try {
    const msg =
      response?.data?.message ??
      response?.data?.error ??
      response?.message ??
      response?.error;
    if (typeof msg === "string" && msg.trim()) {
      return msg.replace(/^error\./i, "").trim();
    }
    if (response?.data && typeof response?.data === "object") {
      const detail = response.data.detail ?? response.data.description;
      if (typeof detail === "string" && detail.trim()) {
        return detail.trim();
      }
    }
  } catch {
    // ignore
  }
  return "";
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function looksLikeAppointmentList(value: any): boolean {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return true;
  const first = value[0];
  if (!first || typeof first !== "object") return false;
  return Boolean(
    first.id ??
      first.appointmentId ??
      first.startDatetime ??
      first.startDateTime ??
      first.appointmentStart ??
      first.appointmentDateTime ??
      first.status ??
      first.appointmentStatus,
  );
}

function extractBulkReschedulePreviewAppointments(
  preview: any,
  includeFreeSlots: boolean,
): any[] {
  if (!preview) return [];
  if (Array.isArray(preview)) return preview;

  const root = preview?.data && typeof preview.data === "object" ? preview.data : preview;

  const freeCandidates = [
    root?.freeAppointments,
    root?.freeAppointmentList,
    root?.freeSlots,
    root?.freeSlotAppointments,
    root?.newAppointments,
    root?.newAppointmentList,
  ];

  const bookedCandidates = [
    root?.appointments,
    root?.appointmentList,
    root?.appointmentVMs,
    root?.appointmentVMS,
    root?.appointmentFromTemplates,
    root?.bulkRescheduleAppointments,
    root?.appointmentsForReschedule,
    root?.previewAppointments,
    root?.bookedAppointments,
    root?.bookedConfirmedAppointments,
    root?.bookedAndConfirmedAppointments,
    root?.content,
    root?.items,
    root?.data,
  ];

  const preferredCandidates = includeFreeSlots
    ? [...freeCandidates, ...bookedCandidates]
    : bookedCandidates;

  for (const candidate of preferredCandidates) {
    if (looksLikeAppointmentList(candidate)) return candidate;
    if (looksLikeAppointmentList(candidate?.data)) return candidate.data;
    if (looksLikeAppointmentList(candidate?.content)) return candidate.content;
    if (looksLikeAppointmentList(candidate?.items)) return candidate.items;
  }

  const queue = [root];
  const seen = new Set<any>();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);

    for (const value of Object.values(current)) {
      if (looksLikeAppointmentList(value)) return value;
      if (value && typeof value === "object") queue.push(value);
    }
  }

  return [];
}

const BulkRescheduleModal = ({ open, setOpen, onSuccess }: Props) => {
  const dispatch = useAppDispatch();
  const mode = useSelector((state: any) => state.ui.mode);

  const [step, setStep] = useState(0);
  const [selectedOriginTemplate, setSelectedOriginTemplate] =
    useState<AvailabilityTemplateResponseVM | null>(null);
  const [originTemplateId, setOriginTemplateId] = useState<number | null>(null);
  const [originBatchId, setOriginBatchId] = useState<number | null>(null);
  const [selectedOriginBatchRowKey, setSelectedOriginBatchRowKey] =
    useState<string>("");

  const [replacementTemplateId, setReplacementTemplateId] = useState<
    number | null
  >(null);
  const [replacementBatchId, setReplacementBatchId] = useState<number | null>(
    null,
  );
  const [selectedReplacementBatchKey, setSelectedReplacementBatchKey] =
    useState<string>("");

  const [batchAppointmentsAll, setBatchAppointmentsAll] = useState<any[]>([]);
  const [unmatchedIds, setUnmatchedIds] = useState<number[]>([]);
  const [confirmBulkCancelOpen, setConfirmBulkCancelOpen] = useState(false);
  const [showFreeAppointments, setShowFreeAppointments] = useState(false);
  const [templateSearchRecord, setTemplateSearchRecord] = useState<{
    templateName: string;
    departmentId: number | null;
  }>({ templateName: "", departmentId: null });
  const [listRefreshKeys, setListRefreshKeys] = useState({
    originBatches: 0,
    preview: 0,
    replacementTemplates: 0,
    replacementBatches: 0,
  });

  const bumpListRefresh = useCallback(
    (key: keyof typeof listRefreshKeys) => {
      setListRefreshKeys((prev) => ({ ...prev, [key]: prev[key] + 1 }));
    },
    [],
  );

  const { data: publishedTemplatesPage, isFetching: loadingTemplates } =
    useGetAvailabilityTemplatesByPublishStatusQuery(
      { page: 0, size: 1000, sort: "id,asc" },
      { skip: !open },
    );
  const publishedTemplates = publishedTemplatesPage?.data ?? [];

  const templateNameFilter = String(templateSearchRecord.templateName ?? "").trim();
  const departmentIdFilter =
    templateSearchRecord.departmentId != null &&
    Number(templateSearchRecord.departmentId) > 0
      ? Number(templateSearchRecord.departmentId)
      : undefined;

  const filteredPublishedTemplates = useMemo(() => {
    let list = publishedTemplates;
    const name = templateNameFilter.toLowerCase();
    if (name) {
      list = list.filter((t) =>
        String(t?.templateName ?? "").toLowerCase().includes(name),
      );
    }
    if (departmentIdFilter != null) {
      list = list.filter(
        (t) => Number(t?.departmentId) === departmentIdFilter,
      );
    }
    return list;
  }, [publishedTemplates, templateNameFilter, departmentIdFilter]);

  const { data: originBatchesPage, isFetching: loadingOriginBatches } =
    useGetAvailabilityGenerationBatchesByTemplateQuery(
      {
        templateId: originTemplateId ?? 0,
        page: 0,
        size: 500,
        sort: "id,desc",
        timestamp: listRefreshKeys.originBatches,
      },
      {
        skip: !open || !originTemplateId || step !== 1,
        refetchOnMountOrArgChange: true,
      },
    );

  const {
    data: replacementBatchesPage,
    isFetching: loadingReplacementBatches,
  } = useGetAvailabilityGenerationBatchesByTemplateExcludingBatchQuery(
    {
      templateId: replacementTemplateId ?? 0,
      batchId: originBatchId ?? 0,
      page: 0,
      size: 500,
      sort: "id,desc",
      timestamp: listRefreshKeys.replacementBatches,
    },
    {
      skip:
        !open ||
        !replacementTemplateId ||
        !originBatchId ||
        step !== 4,
      refetchOnMountOrArgChange: true,
    },
  );

  const {
    data: departmentActiveTemplatesPage,
    isFetching: loadingDepartmentActiveTemplates,
  } = useGetAvailabilityTemplatesByDepartmentAndActiveQuery(
    step === 3 &&
      selectedOriginTemplate?.departmentId &&
      selectedOriginTemplate?.templateType &&
      selectedOriginTemplate?.resourceId
      ? {
          departmentId: selectedOriginTemplate!.departmentId,
          type: selectedOriginTemplate!.templateType,
          resourceId: selectedOriginTemplate!.resourceId,
          page: 0,
          size: 1000,
          sort: "id,asc",
          timestamp: listRefreshKeys.replacementTemplates,
        }
      : skipToken,
    { refetchOnMountOrArgChange: true },
  );

  const {
    data: bulkReschedulePreview,
    isFetching: loadingBulkReschedulePreview,
  } = useGetBulkReschedulePreviewQuery(
    open && step === 2 && originBatchId
      ? {
          batchId: originBatchId,
          includeFreeSlots: showFreeAppointments,
          departmentId: departmentIdFilter,
          templateName: templateNameFilter || undefined,
          refreshKey: listRefreshKeys.preview,
        }
      : skipToken,
    {
      refetchOnMountOrArgChange: true,
    },
  );

  const [cancelAppointment] = useCancelAppointmentMutation();
  const [bulkReschedule, { isLoading: bulkLoading }] =
    useBulkRescheduleAppointmentsMutation();

  const resetWizard = useCallback(() => {
    setStep(0);
    setSelectedOriginTemplate(null);
    setOriginTemplateId(null);
    setOriginBatchId(null);
    setSelectedOriginBatchRowKey("");
    setReplacementTemplateId(null);
    setReplacementBatchId(null);
    setSelectedReplacementBatchKey("");
    setBatchAppointmentsAll([]);
    setUnmatchedIds([]);
    setConfirmBulkCancelOpen(false);
    setShowFreeAppointments(false);
    setTemplateSearchRecord({ templateName: "", departmentId: null });
    setListRefreshKeys({
      originBatches: 0,
      preview: 0,
      replacementTemplates: 0,
      replacementBatches: 0,
    });
  }, []);

  useEffect(() => {
    if (!open) {
      resetWizard();
    }
  }, [open, resetWizard]);

  useEffect(() => {
    if (!originTemplateId) return;
    const stillVisible = filteredPublishedTemplates.some(
      (t) => Number(t.id) === Number(originTemplateId),
    );
    if (!stillVisible) {
      setOriginTemplateId(null);
      setSelectedOriginTemplate(null);
      setOriginBatchId(null);
      setSelectedOriginBatchRowKey("");
    }
  }, [filteredPublishedTemplates, originTemplateId]);

  const bulkPreviewRows = useMemo(
    () =>
      extractBulkReschedulePreviewAppointments(
        bulkReschedulePreview,
        showFreeAppointments,
      ),
    [bulkReschedulePreview, showFreeAppointments],
  );

  const appointmentPreviewRows = useMemo(() => {
    if (!showFreeAppointments) return bulkPreviewRows;
    return bulkPreviewRows.filter((row) => isFreeSlotStatus(normalizeApptStatus(row)));
  }, [bulkPreviewRows, showFreeAppointments]);

  useEffect(() => {
    setBatchAppointmentsAll(bulkPreviewRows);
  }, [bulkPreviewRows]);

  const patientIds = useMemo(() => {
    const ids = appointmentPreviewRows
      .map((row) => getAppointmentPatientId(row))
      .filter((id): id is number => id != null);
    return Array.from(new Set(ids));
  }, [appointmentPreviewRows]);

  const { data: patients } = useGetPatientsByIdsQuery(
    { ids: Array.from(patientIds) },
    { skip: patientIds.length === 0 },
  );

  const patientMap = useMemo(() => {
    const map = new Map<number, any>();
    patients?.forEach((p) => map.set(Number(p.id), p));
    return map;
  }, [patients]);

  const selectedFacility = useAppSelector(
    (state: any) => state.auth?.tenant?.selectedFacility,
  );

  const appointmentPreviewResourceTypes = useMemo(() => {
    const types = new Set<string>();
    appointmentPreviewRows.forEach((row: any) => {
      const rt = getCanonicalResourceTypeKey(getAppointmentResourceType(row));
      if (rt) types.add(rt);
    });
    return types;
  }, [appointmentPreviewRows]);

  const templateResourceTypes = useMemo(() => {
    const types = new Set<string>();
    const addType = (row: any) => {
      const rt = getCanonicalResourceTypeKey(
        getTemplateResourceType(row) || getAppointmentResourceType(row),
      );
      if (rt) types.add(rt);
    };
    publishedTemplates.forEach(addType);
    (departmentActiveTemplatesPage?.data ?? []).forEach(addType);
    return types;
  }, [publishedTemplates, departmentActiveTemplatesPage?.data]);

  const allResourceTypes = useMemo(() => {
    const types = new Set<string>(appointmentPreviewResourceTypes);
    templateResourceTypes.forEach((type) => types.add(type));
    return types;
  }, [appointmentPreviewResourceTypes, templateResourceTypes]);

  const roomResourceIds = useMemo(() => {
    const ids = new Set<string>();
    const addRoomId = (row: any) => {
      const rt = getCanonicalResourceTypeKey(
        getTemplateResourceType(row) || getAppointmentResourceType(row),
      );
      if (rt === "ROOM") {
        const id = getRowResourceId(row);
        if (id != null) ids.add(String(id));
      }
    };
    appointmentPreviewRows.forEach(addRoomId);
    publishedTemplates.forEach(addRoomId);
    (departmentActiveTemplatesPage?.data ?? []).forEach(addRoomId);
    return Array.from(ids).map((value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : value;
    });
  }, [appointmentPreviewRows, publishedTemplates, departmentActiveTemplatesPage?.data]);

  const { data: appointableDepartmentsResponse } = useGetAppointableDepartmentsQuery(
    open && selectedFacility?.id
      ? {
          facilityId: selectedFacility.id,
          page: 0,
          size: 200,
          sort: "id,asc",
        }
      : skipToken,
  );

  const appointableDepartmentOptions = useMemo(
    () =>
      ((appointableDepartmentsResponse as any)?.data ?? [])
        .map((d: any) => {
          const value = d?.id ?? d?.key;
          const label = d?.name ?? d?.departmentName ?? String(value ?? "");
          return value != null ? { label: String(label), value: Number(value) } : null;
        })
        .filter(Boolean) as { label: string; value: number }[],
    [appointableDepartmentsResponse],
  );

  const { data: appointablePractitionersResponse } =
    useGetAppointablePractitionerByLoggedInFacilityQuery(
      { page: 0, size: 200, sort: "id,asc" },
      { skip: !allResourceTypes.has("PRACTITIONER") },
    );

  const { data: appointableCatalogsResponse } =
    useGetAppointableCatalogsByLoggedInFacilityQuery(
      { page: 0, size: 200, sort: "id,asc" },
      { skip: !allResourceTypes.has("CATALOG") },
    );

  const { data: appointableDiagnosticTestsResponse } =
    useGetAllActiveAppointableDiagnosticTestsQuery(
      { page: 0, size: 200, sort: "id,asc" },
      { skip: !allResourceTypes.has("DIAGNOSTIC_TEST") },
    );

  const { data: appointableServicesResponse } =
    useGetAppointableServicesByLoggedInFacilityQuery(
      { page: 0, size: 200, sort: "id,asc" },
      { skip: !allResourceTypes.has("SERVICE") },
    );

  const departmentNameById = useMemo(() => {
    const map = new Map<string, string>();
    ((appointableDepartmentsResponse as any)?.data ?? []).forEach((d: any) => {
      const id = d?.id ?? d?.departmentId ?? d?.key;
      const name = d?.name ?? d?.departmentName;
      if (id != null && name) map.set(String(id), String(name));
    });
    return map;
  }, [appointableDepartmentsResponse]);

  const [getRoomsByIds, { data: roomsByIds = [] }] = useGetRoomsByIdsMutation();

  useEffect(() => {
    if (roomResourceIds.length === 0) return;
    void getRoomsByIds({ ids: roomResourceIds });
  }, [getRoomsByIds, roomResourceIds]);

  const getDepartmentNameFromRow = useCallback(
    (row: any): string | undefined => {
      const deptId = getAppointmentDepartmentId(row);
      return (
        row?.departmentName ??
        row?.department?.name ??
        row?.department?.departmentName ??
        row?.appointmentData?.departmentName ??
        row?.appointmentData?.department?.name ??
        row?.appointmentData?.department?.departmentName ??
        (deptId != null ? departmentNameById.get(String(deptId)) : undefined)
      );
    },
    [departmentNameById],
  );

  const resourceNameByTypeAndId = useMemo(() => {
    const departmentMap = new Map<string, string>();
    ((appointableDepartmentsResponse as any)?.data ?? []).forEach((d: any) => {
      const id = d?.id ?? d?.key;
      const name = d?.name ?? d?.departmentName;
      if (id != null && name) departmentMap.set(String(id), String(name));
    });

    const practitionerMap = new Map<string, string>();
    ((appointablePractitionersResponse as any)?.data ?? []).forEach((p: any) => {
      const id = p?.id ?? p?.key;
      const name = [p?.firstName, p?.lastName].filter(Boolean).join(" ") || p?.fullName;
      if (id != null && name) practitionerMap.set(String(id), String(name));
    });

    const catalogMap = new Map<string, string>();
    ((appointableCatalogsResponse as any)?.data ?? []).forEach((c: any) => {
      const id = c?.id ?? c?.key;
      const name = c?.name ?? c?.catalogName;
      if (id != null && name) catalogMap.set(String(id), String(name));
    });

    const diagnosticTestMap = new Map<string, string>();
    ((appointableDiagnosticTestsResponse as any)?.data ?? []).forEach((t: any) => {
      const id = t?.id ?? t?.key;
      const name = t?.name ?? t?.testName;
      if (id != null && name) diagnosticTestMap.set(String(id), String(name));
    });

    const serviceMap = new Map<string, string>();
    ((appointableServicesResponse as any)?.data ?? []).forEach((s: any) => {
      const id = s?.id ?? s?.key;
      const name = s?.name ?? s?.serviceName;
      if (id != null && name) serviceMap.set(String(id), String(name));
    });

    const roomMap = new Map<string, string>();
    (roomsByIds ?? []).forEach((room: any) => {
      const id = room?.id ?? room?.key;
      const name = room?.name ?? room?.roomName;
      if (id != null && name) roomMap.set(String(id), String(name));
    });

    return {
      DEPARTMENT: departmentMap,
      PRACTITIONER: practitionerMap,
      CATALOG: catalogMap,
      DIAGNOSTIC_TEST: diagnosticTestMap,
      SERVICE: serviceMap,
      ROOM: roomMap,
    };
  }, [
    appointableDepartmentsResponse,
    appointablePractitionersResponse,
    appointableCatalogsResponse,
    appointableDiagnosticTestsResponse,
    appointableServicesResponse,
    roomsByIds,
  ]);

  const replacementCandidates = useMemo(() => {
    if (!selectedOriginTemplate) return [];
    return departmentActiveTemplatesPage?.data ?? [];
  }, [departmentActiveTemplatesPage?.data, selectedOriginTemplate]);

  const originBatches = originBatchesPage?.data ?? [];
  const replacementBatches = replacementBatchesPage?.data ?? [];

  const originBatchRows = useMemo(
    () =>
      originBatches.map((b: AvailabilityGenerationBatch) => ({
        ...b,
        rowKey: String(b.id),
        applyLabel: b.applyStartDateTime
          ? formatDateWithoutSeconds(b.applyStartDateTime)
          : "-",
        endLabel: b.applyEndDateTime
          ? formatDateWithoutSeconds(b.applyEndDateTime)
          : "-",
      })),
    [originBatches],
  );

  const replacementBatchRows = useMemo(
    () =>
      replacementBatches.map((b: AvailabilityGenerationBatch) => ({
        ...b,
        rowKey: String(b.id),
        applyLabel: b.applyStartDateTime
          ? formatDateWithoutSeconds(b.applyStartDateTime)
          : "-",
        endLabel: b.applyEndDateTime
          ? formatDateWithoutSeconds(b.applyEndDateTime)
          : "-",
      })),
    [replacementBatches],
  );

  const appointmentPreviewColumns = useMemo(
    () => [
      {
        key: "start",
        title: <Translate>Start</Translate>,
        flexGrow: 2,
        render: (row: any) => (
          <span>
            {row?.startDatetime || row?.startDateTime || row?.appointmentStart || row?.appointmentDateTime
              ? formatDateWithoutSeconds(
                  row.startDatetime || row.startDateTime || row.appointmentStart || row.appointmentDateTime,
                )
              : "-"}
          </span>
        ),
      },
      {
        key: "status",
        title: <Translate>Status</Translate>,
        flexGrow: 1,
        render: (row: any) => (
          <MyBadgeStatus
            color="#0284c7"
            contant={formatEnumString(String(row?.status ?? ""))}
          />
        ),
      },
      {
        key: 'resourceType',
        title: <Translate>Resource Type</Translate>,
        flexGrow: 1,
        render: (row: any) => {
          const resourceTypeKey = getCanonicalResourceTypeKey(getAppointmentResourceType(row));
          return (
            <span>
              {formatEnumString(resourceTypeKey) || '—'}
            </span>
          );
        },
      },
      {
        key: 'department',
        title: <Translate>Department</Translate>,
        flexGrow: 2,
        render: (row: any) => {
          const deptId = getAppointmentDepartmentId(row);
          const deptName =
            getDepartmentNameFromRow(row) ??
            (deptId != null ? String(deptId) : undefined);
          return <span>{String(deptName ?? '—')}</span>;
        },
      },
      {
        key: 'resource',
        title: <Translate>Resource</Translate>,
        flexGrow: 2,
        render: (row: any) => {
          const resourceTypeKey = getCanonicalResourceTypeKey(getAppointmentResourceType(row));
          const resourceId = getAppointmentResourceId(row);
          const resourceLookup =
            resourceId != null && resourceTypeKey
              ? resourceNameByTypeAndId[resourceTypeKey]?.get(String(resourceId))
              : undefined;
          const rname =
            row?.resourceName ??
            row?.appointmentData?.resourceName ??
            row?.resource?.resourceName ??
            row?.resource?.name ??
            resourceLookup ??
            (resourceId != null ? String(resourceId) : '—');
          return <span>{String(rname ?? '—')}</span>;
        },
      },
      {
        key: "patient",
        title: <Translate>Patient</Translate>,
        flexGrow: 2,
        render: (row: any) => {
          const patientId = getAppointmentPatientId(row);
          const patient =
            patientId != null ? patientMap.get(patientId) : undefined;
          const nameFromService = patient
            ? getPatientFullName(patient)
            : undefined;
          const nameFromRow =
            getPatientFullName(row?.patient) ||
            String(row?.patientName ?? "").trim();
          const name = nameFromService || nameFromRow || "—";
          return <span>{name}</span>;
        },
      },
    ],
    [patientMap, departmentNameById, resourceNameByTypeAndId],
  );

  const templatePickColumns = useMemo(
    () => [
      {
        key: "pick",
        title: "",
        width: 44,
        render: (row: any) => (
          <input
            type="radio"
            readOnly
            checked={Number(originTemplateId) === Number(row.id)}
          />
        ),
      },
      {
        key: "templateName",
        title: <Translate>Template</Translate>,
        flexGrow: 2,
        render: (row: any) => <strong>{row?.templateName ?? "-"}</strong>,
      },
      {
        key: "templateType",
        title: <Translate>Type</Translate>,
        flexGrow: 1,
        render: (row: any) => (
          <span>
            {formatEnumString(String(row?.templateType ?? "")) || "-"}
          </span>
        ),
      },
      {
        key: "department",
        title: <Translate>Department</Translate>,
        flexGrow: 2,
        render: (row: any) => {
          const deptId = getAppointmentDepartmentId(row);
          const deptName =
            getDepartmentNameFromRow(row) ??
            (deptId != null ? String(deptId) : "-");
          return <span>{String(deptName)}</span>;
        },
      },
      {
        key: "resource",
        title: <Translate>Resource</Translate>,
        flexGrow: 2,
        render: (row: any) => {
          const resourceTypeKey = getCanonicalResourceTypeKey(getTemplateResourceType(row));
          const resourceId = getAppointmentResourceId(row);
          const resourceLookup =
            resourceId != null && resourceTypeKey
              ? resourceNameByTypeAndId[resourceTypeKey]?.get(String(resourceId))
              : undefined;
          const rname =
            row?.resourceName ??
            row?.appointmentData?.resourceName ??
            row?.resource?.name ??
            resourceLookup ??
            (resourceId != null ? String(resourceId) : "-");
          return <span>{String(rname)}</span>;
        },
      },
      {
        key: "active",
        title: <Translate>State</Translate>,
        flexGrow: 1,
        render: (row: any) => (
          <MyBadgeStatus
            color={row?.isActive ? "#16a34a" : "#6b7280"}
            contant={row?.isActive ? "Active" : "Inactive"}
          />
        ),
      },
    ],
    [originTemplateId, departmentNameById, resourceNameByTypeAndId],
  );

  const replacementTemplatePickColumns = useMemo(
    () => [
      {
        key: "pick",
        title: "",
        width: 44,
        render: (row: any) => (
          <input
            type="radio"
            readOnly
            checked={Number(replacementTemplateId) === Number(row.id)}
          />
        ),
      },
      {
        key: "templateName",
        title: <Translate>Template</Translate>,
        flexGrow: 2,
        render: (row: any) => <strong>{row?.templateName ?? "-"}</strong>,
      },
      {
        key: "templateType",
        title: <Translate>Type</Translate>,
        flexGrow: 1,
        render: (row: any) => (
          <span>
            {formatEnumString(String(row?.templateType ?? "")) || "-"}
          </span>
        ),
      },
      {
        key: "department",
        title: <Translate>Department</Translate>,
        flexGrow: 2,
        render: (row: any) => {
          const deptId = getAppointmentDepartmentId(row);
          const deptName =
            getDepartmentNameFromRow(row) ??
            (deptId != null ? String(deptId) : "-");
          return <span>{String(deptName)}</span>;
        },
      },
      {
        key: "resource",
        title: <Translate>Resource</Translate>,
        flexGrow: 2,
        render: (row: any) => {
          const resourceTypeKey = getCanonicalResourceTypeKey(getTemplateResourceType(row));
          const resourceId = getAppointmentResourceId(row);
          const resourceLookup =
            resourceId != null && resourceTypeKey
              ? resourceNameByTypeAndId[resourceTypeKey]?.get(String(resourceId))
              : undefined;
          const rname =
            row?.resourceName ??
            row?.appointmentData?.resourceName ??
            row?.resource?.name ??
            resourceLookup ??
            (resourceId != null ? String(resourceId) : "-");
          return <span>{String(rname)}</span>;
        },
      },
      {
        key: "active",
        title: <Translate>State</Translate>,
        flexGrow: 1,
        render: (row: any) => (
          <MyBadgeStatus
            color={row?.isActive ? "#16a34a" : "#6b7280"}
            contant={row?.isActive ? "Active" : "Inactive"}
          />
        ),
      },
    ],
    [replacementTemplateId, departmentNameById, resourceNameByTypeAndId],
  );

  const batchPickColumnsOrigin = useMemo(
    () => [
      {
        key: "pick",
        title: "",
        width: 44,
        render: (row: any) => (
          <input
            type="radio"
            readOnly
            checked={selectedOriginBatchRowKey === row.rowKey}
          />
        ),
      },
      {
        key: "applyLabel",
        title: <Translate>Start</Translate>,
        flexGrow: 2,
        render: (row: any) => <span>{row.applyLabel}</span>,
      },
      {
        key: "endLabel",
        title: <Translate>End</Translate>,
        flexGrow: 2,
        render: (row: any) => <span>{row.endLabel}</span>,
      },
      {
        key: "executionStatus",
        title: <Translate>Status</Translate>,
        flexGrow: 2,
        render: (row: any) =>
          row.executionStatus ? (
            <MyBadgeStatus
              color="#64748b"
              contant={formatEnumString(String(row.executionStatus))}
            />
          ) : (
            <span>—</span>
          ),
      },
    ],
    [selectedOriginBatchRowKey],
  );

  const batchPickColumnsReplacement = useMemo(
    () => [
      {
        key: "pick",
        title: "",
        width: 44,
        render: (row: any) => (
          <input
            type="radio"
            readOnly
            checked={selectedReplacementBatchKey === row.rowKey}
          />
        ),
      },
      {
        key: "applyLabel",
        title: <Translate>Start</Translate>,
        flexGrow: 2,
        render: (row: any) => <span>{row.applyLabel}</span>,
      },
      {
        key: "endLabel",
        title: <Translate>End</Translate>,
        flexGrow: 2,
        render: (row: any) => <span>{row.endLabel}</span>,
      },
      {
        key: "executionStatus",
        title: <Translate>Status</Translate>,
        flexGrow: 2,
        render: (row: any) =>
          row.executionStatus ? (
            <MyBadgeStatus
              color="#64748b"
              contant={formatEnumString(String(row.executionStatus))}
            />
          ) : (
            <span>—</span>
          ),
      },
    ],
    [selectedReplacementBatchKey],
  );

  const handleClose = () => {
    setOpen(false);
  };

  const handleNext = () => {
    if (step === 0) {
      if (!originTemplateId || !selectedOriginTemplate) {
        dispatch(
          notify({ msg: "Select a template to continue.", sev: "warning" }),
        );
        return;
      }
      bumpListRefresh("originBatches");
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!originBatchId) {
        dispatch(
          notify({
            msg: "Select a generation batch to continue.",
            sev: "warning",
          }),
        );
        return;
      }
      bumpListRefresh("preview");
      setStep(2);
      return;
    }
    if (step === 3) {
      if (!replacementTemplateId) {
        dispatch(
          notify({ msg: "Select a replacement template.", sev: "warning" }),
        );
        return;
      }
      bumpListRefresh("replacementBatches");
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step === 1) setStep(0);
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  };

  const runBulkCancelForBatch = async () => {
    if (!originBatchId) return;
    const targets = batchAppointmentsAll.filter((row) => {
      const d = appointmentStart(row);
      if (!d || !isStrictlyAfterCalendarToday(d)) return false;
      const st = normalizeApptStatus(row);
      return isFreeSlotStatus(st) || isBookedOrConfirmed(st);
    });
    const ids = targets
      .map((row: any) => Number(row?.id ?? row?.key ?? 0))
      .filter((id: number) => Number.isFinite(id) && id > 0);
    if (ids.length === 0) {
      dispatch(
        notify({
          msg: "No future appointments in this batch match cancel rules.",
          sev: "warning",
        }),
      );
      return;
    }
    showSystemLoader();
    try {
      for (const chunk of chunkArray(ids, 15)) {
        await Promise.all(
          chunk.map((id) =>
            cancelAppointment({
              id,
              cancelReason: SYSTEM_CANCEL_REASON,
            }).unwrap(),
          ),
        );
      }
      dispatch(
        notify({
          msg: `Cancelled ${ids.length} appointment(s). Patients will be notified when supported by the server.`,
          sev: "success",
        }),
      );
      onSuccess?.();
      setConfirmBulkCancelOpen(false);
      handleClose();
    } catch (error) {
      const errorMsg =
        extractErrorMessage(error) ||
        "Some appointments could not be cancelled.";
      dispatch(notify({ msg: errorMsg, sev: "error" }));
    } finally {
      hideSystemLoader();
    }
  };

  const handleApplyBulkReschedule = async () => {
    if (!originBatchId || !replacementBatchId) {
      dispatch(notify({ msg: "Select a replacement batch.", sev: "warning" }));
      return;
    }
    if (replacementBatchId === originBatchId) {
      dispatch(
        notify({
          msg: "Replacement batch must be different from the original batch.",
          sev: "warning",
        }),
      );
      return;
    }
    try {
      const result = await bulkReschedule({
        originalAvailabilityGenerationBatchId: originBatchId,
        replacementAvailabilityGenerationBatchId: replacementBatchId,
      }).unwrap();

      if (result.success) {
        setUnmatchedIds([]);
        setStep(5);
        onSuccess?.();
        return;
      }

      const rawUnmatched =
        result.unmatchedAppointmentIds ??
        result.unmatchedOldAppointmentIds ??
        ([] as number[]);
      const list = Array.isArray(rawUnmatched)
        ? rawUnmatched.filter((n) => Number.isFinite(n))
        : [];

      if (list.length > 0) {
        setUnmatchedIds(list);
        dispatch(
          notify({
            msg:
              result.message?.trim() ||
              "Not all appointments could be matched to replacement slots. Review step 3.",
            sev: "warning",
          }),
        );
        bumpListRefresh("preview");
        setStep(2);
        return;
      }

      dispatch(
        notify({
          msg: result.message?.trim() || "Bulk reschedule did not complete.",
          sev: "warning",
        }),
      );
    } catch (error) {
      const errorMsg = extractErrorMessage(error) || "Bulk reschedule failed.";
      dispatch(notify({ msg: errorMsg, sev: "error" }));
    }
  };

  const stepperMeta = WIZARD_STEPS.map((s, index) => ({
    title: s.title,
    isError: step === 2 && unmatchedIds.length > 0 && index === 2,
  }));

  const renderBody = () => {
    if (step === 5) {
      return (
        <Panel bordered style={{ padding: 24, textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <FontAwesomeIcon
              icon={faCircleCheck}
              style={{ color: "#16a34a", fontSize: 24 }}
            />
            <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
              Reschedule applied successfully
            </p>
          </div>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            All appointments in this run were handled. You can close this
            dialog.
          </p>
        </Panel>
      );
    }

    if (step === 0) {
      return (
        <Form fluid layout="vertical">
          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 12 }}>
            Published templates (active and inactive). Use the search filters
            below, then select one template to continue.
          </p>
          <Panel
            bordered
            style={{
              marginBottom: 12,
              padding: "12px 16px",
              background: mode === "light" ? "#f8fafc" : undefined,
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                margin: "0 0 10px",
                color: "#334155",
              }}
            >
              <Translate>Search</Translate>
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <MyInput
                fieldLabel="Template name"
                fieldName="templateName"
                record={templateSearchRecord}
                setRecord={setTemplateSearchRecord}
                placeholder="Search by template name"
                width="100%"
              />
              <MyInput
                fieldType="select"
                fieldLabel="Department"
                fieldName="departmentId"
                record={templateSearchRecord}
                setRecord={setTemplateSearchRecord}
                selectData={appointableDepartmentOptions}
                selectDataLabel="label"
                selectDataValue="value"
                placeholder="All departments"
                searchable
                width="100%"
              />
            </div>
          </Panel>
          {loadingTemplates ? (
            <Loader center />
          ) : publishedTemplates.length === 0 ? (
            <Panel bordered>No published templates found.</Panel>
          ) : filteredPublishedTemplates.length === 0 ? (
            <Panel bordered>
              No templates match the current search filters.
            </Panel>
          ) : (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 8,
              }}
            >
              <MyTable
                columns={templatePickColumns as any}
                data={filteredPublishedTemplates}
                loading={loadingTemplates}
                height={420}
                onRowClick={(row: AvailabilityTemplateResponseVM) => {
                  const id = Number(row?.id ?? 0);
                  if (!Number.isFinite(id) || id <= 0) return;
                  setOriginTemplateId(id);
                  const t =
                    filteredPublishedTemplates.find((x) => Number(x.id) === id) ??
                    null;
                  setSelectedOriginTemplate(t);
                  setOriginBatchId(null);
                  setSelectedOriginBatchRowKey("");
                }}
                rowClassName={(row: any) =>
                  Number(originTemplateId) === Number(row?.id)
                    ? "selected-row"
                    : ""
                }
              />
            </div>
          )}
        </Form>
      );
    }

    if (step === 1) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            Select one availability generation batch for this template.
          </p>
          {loadingOriginBatches ? (
            <Loader center />
          ) : originBatchRows.length === 0 ? (
            <Panel bordered>
              No generation batches found for this template.
            </Panel>
          ) : (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 8,
              }}
            >
              <MyTable
                columns={batchPickColumnsOrigin as any}
                data={originBatchRows}
                loading={loadingOriginBatches}
                height={420}
                onRowClick={(row: any) => {
                  setSelectedOriginBatchRowKey(row.rowKey);
                  setOriginBatchId(Number(row.id));
                }}
                rowClassName={(row: any) =>
                  selectedOriginBatchRowKey === row.rowKey ? "selected-row" : ""
                }
              />
            </div>
          )}
        </div>
      );
    }

    if (step === 2) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {unmatchedIds.length > 0 ? (
            <Panel
              bordered
              style={{ background: "#fffbeb", borderColor: "#fcd34d" }}
            >
              <strong>Outstanding appointments</strong>
              <p style={{ fontSize: 13, marginTop: 6 }}>
                These appointments could not be matched to replacement slots.
                Adjust replacement batch or cancel appointments, then try again.
              </p>
              <pre
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: 120,
                  overflow: "auto",
                }}
              >
                {unmatchedIds.join(", ")}
              </pre>
            </Panel>
          ) : null}

          <Panel bordered>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <p style={{ fontSize: 13, margin: 0 }}>
                {showFreeAppointments ? (
                  <>
                    Future <strong>NEW</strong> free appointments after today
                    (today excluded).
                  </>
                ) : (
                  <>
                    Future <strong>BOOKED</strong> and{" "}
                    <strong>CONFIRMED</strong> appointments after today (today
                    excluded).
                  </>
                )}
              </p>
              <Checkbox
                checked={showFreeAppointments}
                onChange={(_, checked) =>
                  setShowFreeAppointments(Boolean(checked))
                }
              >
                Show free appointments
              </Checkbox>
            </div>
            {loadingBulkReschedulePreview ? (
              <Loader center />
            ) : (
              <MyTable
                columns={appointmentPreviewColumns as any}
                data={appointmentPreviewRows}
                height={260}
                loading={loadingBulkReschedulePreview}
              />
            )}
          </Panel>
        </div>
      );
    }

    if (step === 3) {
      return (
        <Form fluid layout="vertical">
          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 12 }}>
            Replacement templates with the same configuration as the selected
            template (same department).
          </p>
          {loadingDepartmentActiveTemplates ? (
            <Loader center />
          ) : replacementCandidates.length === 0 ? (
            <Panel bordered>
              No matching replacement templates were found.
            </Panel>
          ) : (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 8,
              }}
            >
              <MyTable
                columns={replacementTemplatePickColumns as any}
                data={replacementCandidates}
                loading={loadingDepartmentActiveTemplates}
                height={420}
                onRowClick={(row: AvailabilityTemplateResponseVM) => {
                  const id = Number(row?.id ?? 0);
                  if (!Number.isFinite(id) || id <= 0) return;
                  setReplacementTemplateId(id);
                  setReplacementBatchId(null);
                  setSelectedReplacementBatchKey("");
                }}
                rowClassName={(row: any) =>
                  Number(replacementTemplateId) === Number(row?.id)
                    ? "selected-row"
                    : ""
                }
              />
            </div>
          )}
        </Form>
      );
    }

    if (step === 4) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            Select the replacement generation batch. This runs the bulk
            reschedule mapping on save.
          </p>
          {loadingReplacementBatches ? (
            <Loader center />
          ) : replacementBatchRows.length === 0 ? (
            <Panel bordered>
              No batches found for this replacement template.
            </Panel>
          ) : (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 8,
              }}
            >
              <MyTable
                columns={batchPickColumnsReplacement as any}
                data={replacementBatchRows}
                loading={loadingReplacementBatches}
                height={420}
                onRowClick={(row: any) => {
                  setSelectedReplacementBatchKey(row.rowKey);
                  setReplacementBatchId(Number(row.id));
                }}
                rowClassName={(row: any) =>
                  selectedReplacementBatchKey === row.rowKey
                    ? "selected-row"
                    : ""
                }
              />
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderFooter = () => {
    if (step === 5) {
      return (
        <Modal.Footer className="footer-modal">
          <Form className="footer-modal-content">
            <MyButton appearance="primary" onClick={handleClose}>
              Close
            </MyButton>
          </Form>
        </Modal.Footer>
      );
    }

    if (step === 2) {
      return (
        <Modal.Footer className="footer-modal">
          <Form className="footer-modal-content">
            <MyButton appearance="subtle" onClick={handleClose}>
              Cancel
            </MyButton>
            <MyButton appearance="subtle" onClick={handleBack}>
              Back
            </MyButton>
            <MyButton
              appearance="primary"
              onClick={() => setConfirmBulkCancelOpen(true)}
            >
              Cancel appointments
            </MyButton>
            <MyButton appearance="default" disabled style={{ opacity: 0.65 }}>
              Ask patient by notification (Coming soon)
            </MyButton>
            <MyButton
              appearance="ghost"
              onClick={() => {
                bumpListRefresh("replacementTemplates");
                setStep(3);
              }}
            >
              Reschedule
            </MyButton>
          </Form>
        </Modal.Footer>
      );
    }

    if (step === 4) {
      return (
        <Modal.Footer className="footer-modal">
          <Form className="footer-modal-content">
            <MyButton appearance="subtle" onClick={handleClose}>
              Cancel
            </MyButton>
            <MyButton appearance="subtle" onClick={handleBack}>
              Back
            </MyButton>
            <MyButton
              appearance="primary"
              loading={bulkLoading}
              disabled={!replacementBatchId}
              onClick={() => void handleApplyBulkReschedule()}
            >
              Apply bulk reschedule
            </MyButton>
          </Form>
        </Modal.Footer>
      );
    }

    return (
      <Modal.Footer className="footer-modal">
        <Form className="footer-modal-content">
          <MyButton appearance="subtle" onClick={handleClose}>
            Cancel
          </MyButton>
          {step > 0 && (
            <MyButton appearance="subtle" onClick={handleBack}>
              Back
            </MyButton>
          )}
          {step !== 4 && (
            <MyButton
              appearance="primary"
              onClick={handleNext}
              disabled={
                (step === 0 && !originTemplateId) ||
                (step === 1 && !originBatchId) ||
                (step === 3 && !replacementTemplateId)
              }
            >
              Next
            </MyButton>
          )}
        </Form>
      </Modal.Footer>
    );
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        size="85vw"
        enforceFocus={step !== 5}
        className={`${mode === "light" ? "modal-light" : "modal-dark"} bulk-reschedule-wizard-modal`}
      >
        <Modal.Header>
          <Modal.Title>
            <FontAwesomeIcon icon={faRightLeft} style={{ marginRight: 8 }} />
            Reschedule
          </Modal.Title>
        </Modal.Header>
        <Divider className="divider-line" />
        <Modal.Body style={{ height: "72vh" }}>
          <MyStepper
            activeStep={step}
            stepsList={stepperMeta.map((s, index) => ({
              key: index,
              value: <Translate>{s.title}</Translate>,
              description: "",
              customIcon: null,
              isError: s.isError || false,
            }))}
            modalColor="var(--primary-blue)"
          />
          <br />
          {renderBody()}
        </Modal.Body>
        <Divider className="divider-line" />
        {renderFooter()}
      </Modal>

      <Modal
        open={confirmBulkCancelOpen}
        size="xs"
        onClose={() => setConfirmBulkCancelOpen(false)}
      >
        <Modal.Header>
          <Modal.Title>Cancel future appointments?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This will cancel all future free, booked, and confirmed appointments
          for this batch (today excluded), using the reason &quot;
          {SYSTEM_CANCEL_REASON}&quot;.
        </Modal.Body>
        <Modal.Footer>
          <MyButton
            appearance="subtle"
            onClick={() => setConfirmBulkCancelOpen(false)}
          >
            Back
          </MyButton>
          <MyButton
            appearance="primary"
            onClick={() => void runBulkCancelForBatch()}
          >
            Confirm cancel
          </MyButton>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default BulkRescheduleModal;
