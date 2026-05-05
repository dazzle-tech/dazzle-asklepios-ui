import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Panel, Button, Form, Modal, Avatar } from 'rsuite';
import './styles.less';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import FollowupAppointmentModal from './components/FollowupAppointmentModal';
import type { AppointmentFromTemplateSearchFilterDTO } from '@/types/model-types-new';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faCalendarCheck, faCheckDouble, faCircleCheck, faCirclePlus, faStethoscope, faUserCheck, faUserSlash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import AppointmentActionsModal from './components/AppointmentActionsModal';
import { useLazySearchAppointmentsQuery } from '@/services/appointment/appointmentService';
import { useGetAppointableDepartmentsQuery } from '@/services/security/departmentService';
import { useGetAppointablePractitionerByLoggedInFacilityQuery } from '@/services/setup/practitioner/PractitionerService';
import { useGetAppointableCatalogsByLoggedInFacilityQuery } from '@/services/setup/catalog/catalogService';
import { useGetAllActiveAppointableDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetAppointableServicesByLoggedInFacilityQuery } from '@/services/setup/serviceService';
import { useLazyGetAppointmentsByStatusBetweenDatesQuery } from '@/services/appointment/appointmentService';
import MyInput from '@/components/MyInput';
import { useFetchAttachmentsListQuery } from '@/services/attachmentService';
import { useSelector } from 'react-redux';
import MyModal from '@/components/MyModal/MyModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import ViewAppointmentRequests from './components/ViewAppointmentRequests';
import { useEnumOptions } from '@/services/enumsApi';
import { calculateAgeFormat } from '@/utils';
import BookPatient from './components/BookPatient';
import { useGetPatientsByIdsQuery } from '@/services/patient/patientService';
import ViewRequestsFloatingButton from './components/ViewRequestsFloatingButton';
import ApproveRequestAgendaModal from './components/ApproveRequestAgendaModal';
import { skipToken } from '@reduxjs/toolkit/query';
import { useApproveAppointmentRequestMutation, useCancelAppointmentRequestMutation, useGetAppointmentRequestsQuery } from '@/services/appointment/appointmentRequestService';
import ScheduleFiltersPanel from './components/ScheduleFiltersPanel';
import ScheduleSummaryBar from './components/ScheduleSummaryBar';
import ScheduleContentGrid from './components/ScheduleContentGrid';
import RescheduleAppointmentModal from './components/RescheduleAppointmentModal';

const getAppointmentPatientId = (appointment: any): number | null => {
  const raw =
    appointment?.patientId ?? (typeof appointment?.patient === 'object' ? appointment.patient?.id : appointment?.patient);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const isRequestPendingApproval = (req: any): boolean => {
  if (!req) return false;
  const s = String(req?.status ?? req?.requestStatus ?? '')
    .toUpperCase()
    .replace(/-/g, '_');
  return s === 'REQUESTED' || s === 'PENDING';
};

const formatAppointmentRequestApproveError = (e: unknown): string => {
  const err = e as any;
  const data = err?.data ?? err?.error?.data;
  if (typeof data === 'string' && data.trim()) return data.trim().slice(0, 500);
  if (data && typeof data === 'object') {
    if (typeof data.msg === 'string' && data.msg.trim()) return data.msg.trim().slice(0, 500);
    if (typeof data.message === 'string' && data.message.trim()) return data.message.trim().slice(0, 500);
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail.trim().slice(0, 500);
    if (typeof data.title === 'string' && data.title.trim()) return data.title.trim().slice(0, 500);
    if (Array.isArray(data.errors)) {
      const parts = data.errors.map((x: any) => {
        if (typeof x === 'string') return x;
        return x?.defaultMessage || x?.message || x?.field || '';
      });
      const joined = parts.filter(Boolean).slice(0, 6).join('; ');
      if (joined) return joined.slice(0, 500);
    }
  }
  const status = err?.status ?? err?.originalStatus;
  const stMsg = status ? ` (HTTP ${status})` : '';
  if (typeof err?.error === 'string' && err.error !== 'TypeError') return `${err.error}${stMsg}`.slice(0, 500);
  return `Could not approve the appointment request${stMsg}.`;
};

const APPOINTMENT_REQUEST_APPROVE_STATUS = 'APPROVED';


const SCHEDULE_LEGEND_ITEMS: {
  label: string;
  color: string;
  borderColor?: string;
  icon: IconDefinition;
  summaryIconBg: string;
}[] = [
    { label: 'No-Show', color: '#FDE68A', icon: faUserSlash, summaryIconBg: '#b45309' },
    { label: 'Checked In', color: '#FDBA74', icon: faUserCheck, summaryIconBg: '#ea580c' },
    { label: 'Booked', color: '#87CEFA', icon: faCalendarCheck, summaryIconBg: '#0284c7' },
    { label: 'Reschedule', color: '#E9D5FF', icon: faCalendarCheck, summaryIconBg: '#7e22ce' },
    { label: 'New', color: '#E8F6EF', borderColor: '#89D0B2', icon: faCirclePlus, summaryIconBg: '#059669' },
    { label: 'In Service', color: '#C7D2FE', icon: faStethoscope, summaryIconBg: '#4f46e5' },
    { label: 'Confirmed', color: '#ADFF2F', icon: faCheckDouble, summaryIconBg: '#65a30d' },
    { label: 'Completed', color: '#93C5FD', icon: faCircleCheck, summaryIconBg: '#1d4ed8' },
    { label: 'Cancel', color: '#FECACA', icon: faXmark, summaryIconBg: '#dc2626' }
  ];

const normLegendStr = (str: string) => String(str ?? '').toLowerCase().replace(/[-_]/g, ' ').trim();

const normalizeAppointmentStatusKey = (raw: unknown): string =>
  String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

const appointmentStatusFromRecord = (appointmentData: any): string =>
  normalizeAppointmentStatusKey(
    appointmentData?.status
  );

const isOpenSlotStatus = (rawStatus: unknown): boolean => {
  const status = normalizeAppointmentStatusKey(rawStatus);
  return status === 'NEW' || status === 'RESCHEDULE';
};

const shouldOpenBookPatientDirectly = (rawStatus: unknown): boolean => {
  const status = normalizeAppointmentStatusKey(rawStatus);
  return isOpenSlotStatus(status) || status === 'RESCHEDULED';
};

const appointmentStatusToLegendBucket = (rawStatus: string): string => {
  const s = normLegendStr(rawStatus);
  if (s.includes('cancel')) return 'cancel';
  if (s.includes('reschedule')) return 'reschedule';
  if (s.includes('no show')) return 'no show';
  if (s.includes('checked in') || s.includes('check in')) return 'checked in';
  if (s.includes('book')) return 'booked';
  if (s.includes('in service')) return 'in service';
  if (s.includes('confirm')) return 'confirmed';
  if (s.includes('complete')) return 'completed';
  if (s.includes('new')) return 'new';
  return s || 'unknown';
};

const ScheduleScreen = () => {
  const localizer = momentLocalizer(moment);
  const mode = useSelector((state: any) => state.ui.mode);
  const [schedulePatientFilter, setSchedulePatientFilter] = useState<any | null>(null);
  const [bookPatientModalOpen, setBookPatientModalOpen] = useState(false);
  const [bookPatientReadOnly, setBookPatientReadOnly] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [followUpDraftData, setFollowUpDraftData] = useState<any>(null);
  const [ActionsModalOpen, setActionsModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewAppointmentData, setViewAppointmentData] = useState(null);
  const isOpeningViewModalRef = useRef(false);
  const pendingAgendaSlotRef = useRef<any>(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appRequestModalOpen, setAppRequestModalOpen] = useState(false);
  const FOLLOW_UP_VISIT_TYPE_LKEY = 'FOLLOW_UP';
  const dispatch = useAppDispatch();

  const [cancelAppointmentRequest] = useCancelAppointmentRequestMutation();
  const [approveAppointmentRequest] = useApproveAppointmentRequestMutation();
  const [searchAppointments, { data: searchedAppointmentsResponse, isFetching: isSearchingAppointments }] =
    useLazySearchAppointmentsQuery();
  const [
    getAppointmentsByStatusBetweenDates,
    { data: todayAppointmentsResponse, isFetching: isFetchingTodayAppointments }
  ] = useLazyGetAppointmentsByStatusBetweenDatesQuery();

  const [requestApproveModalOpen, setRequestApproveModalOpen] = useState(false);
  const [requestToApprove, setRequestToApprove] = useState<any>(null);
  const [agendaSlotConfirmOpen, setAgendaSlotConfirmOpen] = useState(false);

  const [selectedFacility, setSelectedFacility] = useState<any>({});
  const [selectedDepartment, setSelectedDepartment] = useState<{ departmentId: number | string | null }>({
    departmentId: null
  });
  const [selectedResourceTypeValue, setSelectedResourceTypeValue] = useState<{ value: string | null }>({
    value: null
  });
  const selectedResourceType = useMemo(
    () => ({ resourcesType: selectedResourceTypeValue?.value ? [selectedResourceTypeValue.value] : [] }),
    [selectedResourceTypeValue?.value]
  );
  const [selectedResources, setSelectedResources] = useState<{ resourceKey: string | null }>({
    resourceKey: null
  });
  const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState<{ status: string | null }>({
    status: null
  });
  const [selectedBookingMode, setSelectedBookingMode] = useState<{
    bookingMode: string | string[] | null;
  }>({
    bookingMode: ['QUICK', 'SLOT']
  });
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [showAppointmentOnly, setShowAppointmentOnly] = useState(false);
  const [filteredResourcesList, setFilteredResourcesList] = useState([]);
  const [showCanceled, setShowCanceled] = useState<boolean>(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('day');
  const [calendarDate, setCalendarDate] = useState<Date | null>(null);
  const [finalAppointments, setFinalAppointments] = useState<any[]>([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [rightPanelDate, setRightPanelDate] = useState<Date>(new Date());
  const [reasonModalType, setReasonModalType] = useState<'Cancel' | 'No-show'>('Cancel');
  const [reasonViewRecord, setReasonViewRecord] = useState({
    reason: '',
  });

  const isFollowUpAppointment = (appt: any) => {
    const label = appt?.visitTypeLvalue?.lovDisplayVale ?? '';
    const key = appt?.visitTypeLkey ?? '';
    const s = `${label} ${key}`.toLowerCase();
    return s.includes('follow') && s.includes('up');
  };

  const authSlice = useAppSelector(state => state.auth);
  const TemplateTypeEnum = useEnumOptions('TemplateType');
  const AppointmentStatusEnum = useEnumOptions('AppointmentStatus');
  const BookingModeEnum = useEnumOptions('BookingMode', {
    exclude: ['BUFFER']
  });

  useEffect(() => {
    if (selectedFacility?.id) return;
    const authFacility =
      authSlice?.selectedDepartment?.facility ??
      authSlice?.selectedDepartment?.facilityId ??
      authSlice?.selectedFacility;
    const id = authFacility?.id ?? authFacility?.facilityId ?? authFacility;
    if (id) {
      setSelectedFacility((prev: any) => ({ ...prev, id }));
    }
  }, [authSlice?.selectedDepartment, authSlice?.selectedFacility, selectedFacility?.id]);

  useEffect(() => {
    setSelectedDepartment({ departmentId: null });
  }, [selectedFacility?.id]);

  const { data: appointmentRequestsResponse } = useGetAppointmentRequestsQuery(
    selectedFacility?.id
      ? {
        facilityId: Number(selectedFacility.id)
      }
      : skipToken
  );

  const { data: activeFacilitiesResponse = [] } = useGetActiveFacilitiesQuery({});
  const { data: appointableDepartmentsResponse } = useGetAppointableDepartmentsQuery(
    {
      facilityId: selectedFacility?.id,
      page: 0,
      size: 200,
      sort: 'id,asc'
    },
    { skip: !selectedFacility?.id }
  );
  const { data: appointablePractitionersResponse } = useGetAppointablePractitionerByLoggedInFacilityQuery(
    { page: 0, size: 200, sort: 'id,asc' },
    { skip: String(selectedResourceTypeValue?.value ?? '').toUpperCase() !== 'PRACTITIONER' }
  );
  const { data: appointableCatalogsResponse } = useGetAppointableCatalogsByLoggedInFacilityQuery(
    { page: 0, size: 200, sort: 'id,asc' },
    { skip: String(selectedResourceTypeValue?.value ?? '').toUpperCase() !== 'CATALOG' }
  );
  const { data: appointableDiagnosticTestsResponse } = useGetAllActiveAppointableDiagnosticTestsQuery(
    { page: 0, size: 200, sort: 'id,asc' },
    { skip: String(selectedResourceTypeValue?.value ?? '').toUpperCase() !== 'DIAGNOSTIC_TEST' }
  );
  const { data: appointableServicesResponse } = useGetAppointableServicesByLoggedInFacilityQuery(
    { page: 0, size: 200, sort: 'id,asc' },
    { skip: String(selectedResourceTypeValue?.value ?? '').toUpperCase() !== 'SERVICE' }
  );

  useEffect(() => {
    if (!selectedFacility?.id || !Array.isArray(activeFacilitiesResponse)) return;
    const matched = (activeFacilitiesResponse as any[]).find(
      (f: any) => String(f?.id) === String(selectedFacility?.id)
    );
    if (matched && selectedFacility?.name !== matched?.name) {
      setSelectedFacility(matched);
    }
  }, [activeFacilitiesResponse, selectedFacility]);

  const resourcesWithAvailabilityResponse = useMemo(() => {
    const selectedType = String(selectedResourceTypeValue?.value ?? '').toUpperCase();
    let rows: any[] = [];

    if (selectedType === 'DEPARTMENT') {
      rows = (appointableDepartmentsResponse as any)?.data ?? [];
    } else if (selectedType === 'PRACTITIONER') {
      rows = (appointablePractitionersResponse as any)?.data ?? [];
    } else if (selectedType === 'CATALOG') {
      rows = (appointableCatalogsResponse as any)?.data ?? [];
    } else if (selectedType === 'DIAGNOSTIC_TEST') {
      rows = (appointableDiagnosticTestsResponse as any)?.data ?? [];
    } else if (selectedType === 'SERVICE') {
      rows = (appointableServicesResponse as any)?.data ?? [];
    }

    const object = rows.map((r: any) => {
      const key = r?.id ?? r?.key ?? '';
      const resourceName =
        r?.resourceName ??
        r?.name ??
        r?.resource_name ??
        r?.departmentName ??
        r?.fullName ??
        r?.catalogName ??
        r?.testName ??
        r?.serviceName ??
        '';
      return {
        key: String(key),
        resourceName: String(resourceName || '')
      };
    });

    return { object };
  }, [
    selectedResourceTypeValue?.value,
    appointableDepartmentsResponse,
    appointablePractitionersResponse,
    appointableCatalogsResponse,
    appointableDiagnosticTestsResponse,
    appointableServicesResponse
  ]);
  const resourceNameById = useMemo(() => {
    const m = new Map<string, string>();
    (resourcesWithAvailabilityResponse?.object ?? []).forEach((r: any) => {
      const id = r?.id ?? r?.key;
      const name = r?.resourceName ?? r?.name ?? r?.resource_name ?? '';
      if (id !== null && typeof id !== 'undefined') m.set(String(id), String(name || ''));
    });
    return m;
  }, [resourcesWithAvailabilityResponse]);

  const extractTimeFromTimestamp = timestamp => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '--:--';
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const dateTime = `${hours}:${minutes} `;
    return dateTime;
  };

  const appointmentPatientIdsForService = useMemo(() => {
    const ids = new Set<number>();
    const collect = (list: any[]) => {
      (list ?? []).forEach((a: any) => {
        const id = getAppointmentPatientId(a);
        if (id != null) ids.add(id);
      });
    };
    collect(searchedAppointmentsResponse?.data ?? []);
    collect((todayAppointmentsResponse as any)?.data ?? []);
    (appointmentRequestsResponse ?? []).forEach((req: any) => {
      const id = Number(req?.patientId ?? req?.patient_id);
      if (Number.isFinite(id) && id > 0) ids.add(id);
    });
    return Array.from(ids).sort((a, b) => a - b);
  }, [searchedAppointmentsResponse, todayAppointmentsResponse, appointmentRequestsResponse]);

  const { data: patientsByIdsData } = useGetPatientsByIdsQuery(
    { ids: appointmentPatientIdsForService },
    { skip: appointmentPatientIdsForService.length === 0 }
  );

  const patientDisplayByPatientService = useMemo(() => {
    const m = new Map<string, { name: string; mrn: string }>();
    for (const p of patientsByIdsData ?? []) {
      const id = (p as any)?.id;
      if (id == null) continue;
      const name =
        [(p as any).firstName, (p as any).secondName, (p as any).thirdName, (p as any).lastName]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        (p as any).fullName ||
        '';
      const mrn =
        (p as any).medicalRecordNumber ?? (p as any).patientMrn ?? (p as any).mrn ?? '';
      m.set(String(id), { name: String(name || '').trim(), mrn: String(mrn || '').trim() });
    }
    return m;
  }, [patientsByIdsData]);

  useEffect(() => {
    const sourceAppointments = searchedAppointmentsResponse?.data ?? [];
    if (sourceAppointments && resourcesWithAvailabilityResponse?.object) {
      const today = new Date();

      const formattedAppointments = sourceAppointments.map((appointment: any) => {
        const startRaw =
          appointment?.startDatetime
        const endRaw =
          appointment?.endDatetime

        const startDate = convertDate(startRaw);
        const endDate = convertDate(endRaw);
        const dob = new Date(appointment?.patient?.dob);
        const patientIdNum = getAppointmentPatientId(appointment);
        const fromPatientService =
          patientIdNum != null ? patientDisplayByPatientService.get(String(patientIdNum)) : undefined;
        const patientFullNameFromNested =
          appointment?.patient?.full_name ||
          appointment?.patient?.fullName ||
          (appointment?.patient?.first_name && appointment?.patient?.last_name
            ? `${appointment.patient.first_name} ${appointment.patient.last_name}`.trim()
            : appointment?.patient?.first_name ||
            appointment?.patient?.last_name ||
            '');
        const patientFullName =
          (fromPatientService?.name && fromPatientService.name.trim()) || patientFullNameFromNested || '';
        const patientMrnFromNested =
          appointment?.patient?.patient_mrn ??
          appointment?.patient?.patientMrn ??
          appointment?.patient?.mrn ??
          appointment?.patientMrn ??
          appointment?.patient_mrn ??
          '';
        const patientMrn =
          (fromPatientService?.mrn && fromPatientService.mrn.trim()) || patientMrnFromNested || '';

        const departmentColumnId =
          appointment?.departmentId ??
          null;
        const normalizedDepartmentColumnId =
          departmentColumnId !== null && typeof departmentColumnId !== 'undefined'
            ? String(departmentColumnId)
            : '';

        const resourceKey =
          appointment?.resourceId
        const normalizedResourceKey =
          resourceKey !== null && typeof resourceKey !== 'undefined' ? String(resourceKey) : '';

        const resource = resourcesWithAvailabilityResponse.object.find(
          item => String(item.key) === normalizedResourceKey
        );
        const resourceNameFromService =
          normalizedResourceKey && resourceNameById.get(normalizedResourceKey)
            ? String(resourceNameById.get(normalizedResourceKey))
            : '';
        const resourceNameForTitle =
          resourceNameFromService ||
          resource?.resourceName ||
          '';
        const slotTitle = [patientFullName, patientMrn ? `MRN: ${patientMrn}` : '', resourceNameForTitle]
          .filter(Boolean)
          .join(' | ');

        const statusText = appointment?.appointmentStatus ?? appointment?.status ?? '';
        const isHidden = String(statusText).toUpperCase() === 'CANCELED';
        const ageYears = isNaN(dob.getTime()) ? '' : `${today.getFullYear() - dob.getFullYear()}Y`;
        const patientLabel = [patientFullName, ageYears].filter(Boolean).join(', ');
        const fallbackTitle = [patientLabel, !(currentView === 'day' || currentView === 'week')
          ? resource?.resourceName || 'Unknown Resource'
          : ''
        ]
          .filter(Boolean)
          .join(' | ');
        return {
          id: appointment?.key ?? appointment?.id,
          title: slotTitle || fallbackTitle || 'Appointment',
          start: startDate,
          end: endDate,
          text: appointment.notes || 'No additional details available',
          appointmentData: appointment,
          hidden: isHidden,
          // Calendar columns are departments; bind events by department id.
          resourceId: normalizedDepartmentColumnId,
          // Keep actual resource id for resource-type/resource filtering logic.
          filterResourceId: normalizedResourceKey,
          tooltipResourceName: resourceNameForTitle,
          fromTo: `${extractTimeFromTimestamp(
            startRaw
          )} - ${extractTimeFromTimestamp(endRaw)}`
        };
      });
      setAppointmentsData(formattedAppointments);
    }
  }, [
    searchedAppointmentsResponse,
    resourcesWithAvailabilityResponse,
    currentView,
    patientDisplayByPatientService,
    resourceNameById
  ]);

  const departmentOptions = useMemo(
    () => (appointableDepartmentsResponse as any)?.data ?? [],
    [appointableDepartmentsResponse]
  );

  const resourceOptions = useMemo(() => {
    const selectedType = String(selectedResourceTypeValue?.value ?? '').toUpperCase();
    if (!selectedType) return [];
    if (selectedType === 'DEPARTMENT') {
      return departmentOptions.map((d: any) => ({
        key: String(d?.id ?? ''),
        resourceName: d?.name ?? d?.departmentName ?? `Department #${d?.id ?? ''}`
      }));
    }
    if (selectedType === 'PRACTITIONER') {
      const rows = (appointablePractitionersResponse as any)?.data ?? [];
      return rows.map((p: any) => ({
        key: String(p?.id ?? ''),
        resourceName: [p?.firstName, p?.lastName].filter(Boolean).join(' ') || p?.fullName || `Practitioner #${p?.id ?? ''}`
      }));
    }
    if (selectedType === 'CATALOG') {
      const rows = (appointableCatalogsResponse as any)?.data ?? [];
      return rows.map((c: any) => ({
        key: String(c?.id ?? ''),
        resourceName: c?.name ?? c?.catalogName ?? `Catalog #${c?.id ?? ''}`
      }));
    }
    if (selectedType === 'DIAGNOSTIC_TEST') {
      const rows = (appointableDiagnosticTestsResponse as any)?.data ?? [];
      return rows.map((t: any) => ({
        key: String(t?.id ?? ''),
        resourceName: t?.name ?? t?.testName ?? `Diagnostic test #${t?.id ?? ''}`
      }));
    }
    if (selectedType === 'SERVICE') {
      const rows = (appointableServicesResponse as any)?.data ?? [];
      return rows.map((s: any) => ({
        key: String(s?.id ?? ''),
        resourceName: s?.name ?? s?.serviceName ?? `Service #${s?.id ?? ''}`
      }));
    }
    return [];
  }, [
    selectedResourceTypeValue?.value,
    departmentOptions,
    appointablePractitionersResponse,
    appointableCatalogsResponse,
    appointableDiagnosticTestsResponse,
    appointableServicesResponse
  ]);

  const normalizeResourceTypeKey = (value: any) =>
    String(value ?? '')
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');

  const resourceNameByTypeAndId = useMemo(() => {
    const departmentMap = new Map<string, string>();
    (departmentOptions ?? []).forEach((d: any) => {
      const id = d?.id;
      const name = d?.name ?? d?.departmentName;
      if (id != null && name) departmentMap.set(String(id), String(name));
    });

    const practitionerMap = new Map<string, string>();
    (((appointablePractitionersResponse as any)?.data ?? []) as any[]).forEach((p: any) => {
      const id = p?.id;
      const name = [p?.firstName, p?.lastName].filter(Boolean).join(' ') || p?.fullName;
      if (id != null && name) practitionerMap.set(String(id), String(name));
    });

    const catalogMap = new Map<string, string>();
    (((appointableCatalogsResponse as any)?.data ?? []) as any[]).forEach((c: any) => {
      const id = c?.id;
      const name = c?.name ?? c?.catalogName;
      if (id != null && name) catalogMap.set(String(id), String(name));
    });

    const diagnosticTestMap = new Map<string, string>();
    (((appointableDiagnosticTestsResponse as any)?.data ?? []) as any[]).forEach((t: any) => {
      const id = t?.id;
      const name = t?.name ?? t?.testName;
      if (id != null && name) diagnosticTestMap.set(String(id), String(name));
    });

    const serviceMap = new Map<string, string>();
    (((appointableServicesResponse as any)?.data ?? []) as any[]).forEach((s: any) => {
      const id = s?.id;
      const name = s?.name ?? s?.serviceName;
      if (id != null && name) serviceMap.set(String(id), String(name));
    });

    return {
      DEPARTMENT: departmentMap,
      PRACTITIONER: practitionerMap,
      CATALOG: catalogMap,
      DIAGNOSTIC_TEST: diagnosticTestMap,
      SERVICE: serviceMap
    };
  }, [
    departmentOptions,
    appointablePractitionersResponse,
    appointableCatalogsResponse,
    appointableDiagnosticTestsResponse,
    appointableServicesResponse
  ]);

  useEffect(() => {
    setFilteredResourcesList(resourceOptions as any);
  }, [resourceOptions]);

  useEffect(() => {
    setSelectedResources({ resourceKey: null });
  }, [selectedResourceTypeValue?.value, selectedFacility?.id, selectedDepartment?.departmentId]);

  const handleSelectEvent = event => {
    const freshEvent = finalAppointments?.find(e => e.id === event.id) || event;

    setSelectedEvent(freshEvent);

    const status = String(
      freshEvent?.appointmentData?.appointmentStatus ??
      freshEvent?.appointmentData?.status ??
      ''
    ).toUpperCase();
    const isCanceled = status === 'CANCELLED' || status === 'CANCELED';
    const isNoShow = status === 'NOSHOW' || status === 'NO_SHOW' || status === 'NO-SHOW';
    if (isCanceled || isNoShow) {
      setReasonModalType(isCanceled ? 'Cancel' : 'No-show');
      const reason = isCanceled
        ? freshEvent?.appointmentData?.cancelReason
        : freshEvent?.appointmentData?.noShowReason;
      setReasonViewRecord({
        reason: reason || freshEvent?.appointmentData?.otherReason || ''
      });
      setShowReasonModal(true);
      return;
    }

    // NEW / template slots: confirm, then approve request (if any) and open booking editor.
    if (shouldOpenBookPatientDirectly(status)) {
      const apptStart =
        freshEvent?.start instanceof Date ? freshEvent.start : new Date(freshEvent?.start as string | number);
      if (
        moment(apptStart).isValid() &&
        moment(apptStart).startOf('day').isBefore(moment().startOf('day'))
      ) {
        dispatch(
          notify({
            msg: 'Previous days: available slots cannot be booked.',
            sev: 'warning'
          })
        );
        return;
      }
      setActionsModalOpen(false);

      setBookPatientModalOpen(true);
      return;
    }

    setActionsModalOpen(true);
  };

  const convertDate = appointmentTime => {
    return new Date(appointmentTime);
  };

  const schedulePatientIdForSearch = useMemo(() => {
    if (!schedulePatientFilter) return null;
    const n = Number(schedulePatientFilter.id ?? schedulePatientFilter.key ?? 0);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [schedulePatientFilter]);

  const handleSearchAppointmentsByCriteria = useCallback(async () => {
    const rk = selectedResources?.resourceKey;
    const firstResourceId =
      rk != null && String(rk).trim() !== '' && Number.isFinite(Number(rk)) && Number(rk) > 0
        ? Number(rk)
        : null;
    const patientId = schedulePatientIdForSearch;
    const rawBookingMode = selectedBookingMode?.bookingMode;
    const bookingMode = Array.isArray(rawBookingMode)
      ? rawBookingMode
      : rawBookingMode
        ? [rawBookingMode]
        : ['QUICK', 'SLOT'];

    const filter: AppointmentFromTemplateSearchFilterDTO = {
      facility: selectedFacility?.id ? Number(selectedFacility.id) : null,
      department: selectedDepartment?.departmentId ? Number(selectedDepartment.departmentId) : null,
      resourceType: selectedResourceTypeValue?.value ?? null,
      resourceId: firstResourceId,
      status: selectedAppointmentStatus?.status ?? null,
      bookingMode: bookingMode as any,
      patientId
    };

    // Always load appointments from search API (facility defaults from logged-in context).
    if (!filter.facility) return;

    try {
      await searchAppointments({
        filter,
        page: 0,
        size: 1000,
        sort: 'id,asc'
      }).unwrap();
    } catch { }
  }, [
    searchAppointments,
    selectedFacility?.id,
    selectedDepartment?.departmentId,
    selectedResourceTypeValue?.value,
    selectedResources?.resourceKey,
    selectedAppointmentStatus?.status,
    selectedBookingMode?.bookingMode,
    schedulePatientIdForSearch
  ]);

  const openEditorForNewAppointment = useCallback(
    async ({
      appointmentRaw,
      request,
      shouldApprove,
      skipAppointmentModal = false
    }: {
      appointmentRaw: any;
      request: any | null;
      shouldApprove: boolean;
      skipAppointmentModal?: boolean;
    }): Promise<boolean> => {
      const raw = appointmentRaw ?? {};
      const startRaw = raw?.startDatetime;
      const endRaw = raw?.endDatetime;
      const departmentId = raw?.departmentId ?? request?.departmentId;
      const facilityId = raw?.facilityId ?? request?.facilityId ?? selectedFacility?.id;
      const selectedSlotForModal = {
        start: startRaw ? new Date(startRaw) : null,
        end: endRaw ? new Date(endRaw) : null,
        resourceId: departmentId != null ? String(departmentId) : null,
        resourceKey: raw?.resourceId ?? raw?.requestedResourceId ?? null,
        resourceTypeLkey: raw?.resourceType ?? 'DEPARTMENT',
        facilityKey: facilityId
      };

      const slotPatientId = getAppointmentPatientId(raw);
      const requestPatientId = Number(request?.patientId ?? 0);
      const effectivePatientId = requestPatientId > 0 ? requestPatientId : slotPatientId != null ? slotPatientId : null;
      const requestPatientName =
        String(request?.patientName ?? '').trim() || '';
      const lockPatient = Boolean(request && requestPatientId > 0);

      if (shouldApprove && request) {
        const requestId = Number(request?.id ?? request?.key);
        const appointmentId = Number(raw?.id ?? 0);
        const patientId = Number(request?.patientId ?? 0);
        const facId = Number(request?.facilityId ?? 0);
        const deptId = Number(request?.requestedResourceId ?? 0);
        const sourceEncounterId = Number(request?.sourceEncounterId ?? NaN);
        const hasValidSourceEncounter = Number.isFinite(sourceEncounterId) && sourceEncounterId > 0;

        const priorityRaw = String(request?.priority ?? 'NORMAL').trim();
        const priorityForApprove = priorityRaw.length > 0 ? priorityRaw : 'NORMAL';

        const missingApproveIds: string[] = [];
        if (!Number.isFinite(requestId) || requestId <= 0) missingApproveIds.push('request id');
        if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
          missingApproveIds.push('appointment id (slot id/key)');
        }
        if (!Number.isFinite(patientId) || patientId <= 0) missingApproveIds.push('patient id');
        if (!Number.isFinite(facId) || facId <= 0) missingApproveIds.push('facility id');
        if (!Number.isFinite(deptId) || deptId <= 0) {
          missingApproveIds.push('department id (or requestedResourceId on request)');
        }

        if (missingApproveIds.length > 0) {
          dispatch(
            notify({
              msg: `Cannot approve: invalid or missing — ${missingApproveIds.join('; ')}.`,
              sev: 'warning'
            })
          );
          return false;
        }

        if (!hasValidSourceEncounter) {
          dispatch(
            notify({
              msg: 'This request has no source encounter id, so the approve API was skipped. Complete the appointment in the editor, or fix the request in the backend.',
              sev: 'warning'
            })
          );
          if (skipAppointmentModal) {
            return false;
          }
        } else {
          dispatch(showSystemLoader());
          try {
            const requestedResourceTypeRaw =
              request?.requestedResourceType ?? null;
            const requestedResourceIdRaw =
              request?.requestedResourceId ?? null;
            const approveBody: Record<string, unknown> = {
              id: requestId,
              patientId,
              facilityId: facId,
              departmentId: deptId,
              sourceEncounterId,
              appointmentId,
              priority: priorityForApprove,
              status: APPOINTMENT_REQUEST_APPROVE_STATUS
            };
            if (requestedResourceTypeRaw != null && String(requestedResourceTypeRaw).trim() !== '') {
              approveBody.requestedResourceType = requestedResourceTypeRaw;
            }
            if (requestedResourceIdRaw != null && Number(requestedResourceIdRaw) > 0) {
              approveBody.requestedResourceId = Number(requestedResourceIdRaw);
            }
            if (request?.reason != null && String(request.reason).trim() !== '') {
              approveBody.reason = request.reason;
            }
            if (request?.note != null && String(request.note).trim() !== '') {
              approveBody.note = request.note;
            }

            await approveAppointmentRequest(approveBody as any).unwrap();
            dispatch(
              notify({
                msg: 'Appointment request approved.',
                sev: 'success'
              })
            );
            setRequestToApprove(null);
            await handleSearchAppointmentsByCriteria();
          } catch (approveErr) {
            dispatch(
              notify({
                msg: formatAppointmentRequestApproveError(approveErr),
                sev: 'error'
              })
            );
          } finally {
            dispatch(hideSystemLoader());
          }
        }
      }

      if (skipAppointmentModal) {
        setRequestApproveModalOpen(false);
        setAppRequestModalOpen(false);
        return true;
      }

      const viewPayload = {
        ...(raw ?? {}),
        resourceType: raw?.resourceType,
        patientId: effectivePatientId,
        patient:
          effectivePatientId != null && effectivePatientId > 0
            ? {
              key: String(effectivePatientId),
              id: effectivePatientId,
              fullName:
                requestPatientName ||
                raw?.patient?.fullName ||
                `Patient #${effectivePatientId}`
            }
            : raw?.patient,
        lockPatient
      };

      setSelectedSlot(selectedSlotForModal as any);
      setViewAppointmentData(viewPayload as any);
      setShowAppointmentOnly(false);
      setRequestApproveModalOpen(false);
      setAppRequestModalOpen(false);
      setBookPatientReadOnly(false);
      setActionsModalOpen(false);
      setBookPatientModalOpen(true);
      return true;
    },
    [
      approveAppointmentRequest,
      dispatch,
      handleSearchAppointmentsByCriteria,
      selectedFacility?.id
    ]
  );

  useEffect(() => {
    if (!selectedFacility?.id) return;
    void handleSearchAppointmentsByCriteria();
  }, [
    selectedFacility?.id,
    selectedDepartment?.departmentId,
    selectedResourceTypeValue?.value,
    selectedResources?.resourceKey,
    selectedAppointmentStatus?.status,
    selectedBookingMode?.bookingMode,
    schedulePatientIdForSearch,
    handleSearchAppointmentsByCriteria
  ]);

  useEffect(() => {
    const day = rightPanelDate ?? currentCalendarDate ?? new Date();
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);
    const status = String(selectedAppointmentStatus?.status ?? 'CONFIRMED');

    void getAppointmentsByStatusBetweenDates({
      status: [status],
      startDatetime: start.toISOString(),
      endDatetime: end.toISOString(),
      page: 0,
      size: 100,
      sort: 'id,asc'
    });
  }, [
    rightPanelDate,
    currentCalendarDate,
    selectedAppointmentStatus?.status,
    getAppointmentsByStatusBetweenDates
  ]);

  useEffect(() => {
    dispatch(setPageCode('Schedule_Screen'));
    dispatch(setDivContent('Scheduling'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [dispatch]);

  const legendItems = SCHEDULE_LEGEND_ITEMS;

  const finalResourceLit = useMemo(() => {
    const selectedDeptId = selectedDepartment?.departmentId ? String(selectedDepartment.departmentId) : '';
    const deptColumns = (departmentOptions ?? []).map((d: any) => ({
      key: String(d?.id ?? ''),
      resourceName: d?.name ?? d?.departmentName ?? `Department #${d?.id ?? ''}`
    }));

    if (selectedDeptId) {
      return deptColumns.filter((d: any) => String(d?.key) === selectedDeptId);
    }
    return deptColumns;
  }, [
    selectedDepartment?.departmentId,
    departmentOptions
  ]);

  const selectedResourceKeysForFilter = useMemo(() => {
    const rk = selectedResources?.resourceKey;
    if (rk != null && String(rk).trim() !== '') {
      return new Set([String(rk)]);
    }
    if (selectedResourceType?.resourcesType?.length) {
      const all = resourcesWithAvailabilityResponse?.object ?? [];
      const normalizeType = (v: any) => String(v ?? '').trim().toUpperCase();
      const selectedTypes = selectedResourceType.resourcesType.map(normalizeType).filter(Boolean);
      const keys = all
        .filter((r: any) => {
          const resourceTypes = [r?.resourceTypeLkey, r?.resource_type, r?.resourceType]
            .map(normalizeType)
            .filter(Boolean);
          return resourceTypes.some((t: string) => selectedTypes.includes(t));
        })
        .map((r: any) => String(r?.key));
      return new Set(keys);
    }
    return null;
  }, [selectedResources?.resourceKey, selectedResourceType?.resourcesType, resourcesWithAvailabilityResponse]);

  const filteredAppointments = useMemo(() => {
    let list = appointmentsData;

    if (selectedDepartment?.departmentId != null && String(selectedDepartment.departmentId) !== '') {
      const deptId = String(selectedDepartment.departmentId);
      list = list.filter(event => String((event as any).resourceId ?? '') === deptId);
    }

    if (selectedResourceKeysForFilter) {
      list = list.filter(event =>
        selectedResourceKeysForFilter.has(String((event as any).filterResourceId ?? event.resourceId))
      );
    }

    if (selectedAppointmentStatus?.status) {
      const statusNeedle = normalizeAppointmentStatusKey(selectedAppointmentStatus.status);
      list = list.filter(
        event => appointmentStatusFromRecord((event as any)?.appointmentData) === statusNeedle
      );
    }

    if (selectedBookingMode?.bookingMode) {
      const selectedModes = Array.isArray(selectedBookingMode.bookingMode)
        ? selectedBookingMode.bookingMode.map(v => String(v ?? '').trim().toUpperCase()).filter(Boolean)
        : [String(selectedBookingMode.bookingMode ?? '').trim().toUpperCase()].filter(Boolean);
      list = list.filter(event => {
        const eventMode = String(event?.appointmentData?.bookingMode ?? '').trim().toUpperCase();
        return selectedModes.includes(eventMode);
      });
    }

    if (schedulePatientIdForSearch != null) {
      const pid = schedulePatientIdForSearch;
      list = list.filter(event => {
        const evPid = getAppointmentPatientId((event as any)?.appointmentData ?? {});
        return evPid != null && Number(evPid) === pid;
      });
    }

    return list;
  }, [
    appointmentsData,
    selectedDepartment?.departmentId,
    selectedResourceKeysForFilter,
    selectedAppointmentStatus?.status,
    selectedBookingMode?.bookingMode,
    schedulePatientIdForSearch
  ]);

  const visibleAppointments =
    currentView === 'agenda' || showCanceled
      ? filteredAppointments
      : filteredAppointments.filter(event => !event.hidden);

  const calendarViewRange = useMemo(() => {
    const a = moment(currentCalendarDate);
    if (currentView === 'day') {
      return { start: a.clone().startOf('day').toDate(), end: a.clone().endOf('day').toDate() };
    }
    if (currentView === 'week') {
      return { start: a.clone().startOf('week').toDate(), end: a.clone().endOf('week').toDate() };
    }
    if (currentView === 'month') {
      return { start: a.clone().startOf('month').toDate(), end: a.clone().endOf('month').toDate() };
    }
    return { start: a.clone().startOf('day').toDate(), end: a.clone().endOf('day').toDate() };
  }, [currentView, currentCalendarDate]);

  const slotSummaryBarStats = useMemo(() => {
    const { start, end } = calendarViewRange;
    const rs = start.getTime();
    const re = end.getTime();
    const inRange = (visibleAppointments ?? []).filter((ev: any) => {
      const s = ev?.start ? new Date(ev.start) : null;
      const e = ev?.end ? new Date(ev.end) : s;
      if (!s || Number.isNaN(s.getTime())) return false;
      const st = s.getTime();
      const et = e && !Number.isNaN(e.getTime()) ? e.getTime() : st;
      return st < re && et > rs;
    });

    const bucketCounts: Record<string, number> = {};
    for (const ev of inRange) {
      const raw = String(
        ev?.appointmentData?.appointmentStatus ?? ev?.appointmentData?.status ?? ''
      ).trim();
      const bucket = appointmentStatusToLegendBucket(raw);
      bucketCounts[bucket] = (bucketCounts[bucket] || 0) + 1;
    }

    const legendNormKeys = new Set(SCHEDULE_LEGEND_ITEMS.map(i => normLegendStr(i.label)));
    let otherCount = 0;
    Object.entries(bucketCounts).forEach(([k, n]) => {
      if (!legendNormKeys.has(k)) otherCount += n;
    });

    const legendRow = SCHEDULE_LEGEND_ITEMS.map(item => ({
      label: item.label,
      color: item.color,
      borderColor: item.borderColor,
      icon: item.icon,
      summaryIconBg: item.summaryIconBg,
      count: bucketCounts[normLegendStr(item.label)] ?? 0
    }));

    const total = inRange.length;

    return {
      total,
      legendRow,
      otherCount,
      rangeLabel:
        currentView === 'day'
          ? moment(currentCalendarDate).format('ddd, MMM D, YYYY')
          : currentView === 'week'
            ? `${moment(calendarViewRange.start).format('MMM D')} – ${moment(calendarViewRange.end).format('MMM D, YYYY')}`
            : moment(currentCalendarDate).format('MMMM YYYY')
    };
  }, [visibleAppointments, calendarViewRange, currentView, currentCalendarDate]);

  const appointmn =
    visibleAppointments?.map(appt => appt.appointmentData?.patient?.key).filter(Boolean) || [];
  const { data: attachments = [], isLoading } = useFetchAttachmentsListQuery(
    {
      type: 'PATIENT_PROFILE_PICTURE',
      refKeys: appointmn
    },
    { skip: appointmn.length === 0 }
  );

  useEffect(() => {
    const attachmentMap = new Map();
    attachments.forEach(att => {
      attachmentMap.set(att.referenceObjectKey, att);
    });

    const updatedAppointments = visibleAppointments.map(appt => {
      const appointmentData = appt.appointmentData || {};
      return {
        ...appt,
        appointmentData: {
          ...appointmentData,
          profilePicture: attachmentMap.get(appointmentData.patientKey)?.fileContent || null
        }
      };
    });

    const areEqual = JSON.stringify(updatedAppointments) === JSON.stringify(finalAppointments);
    if (!areEqual) {
      setFinalAppointments(updatedAppointments);
    }
  }, [visibleAppointments, attachments]);

  const appointmentResourceKeys = useMemo(() => {
    return new Set((finalAppointments ?? []).map(e => e.resourceId).filter(Boolean));
  }, [finalAppointments]);

  const dayIndex = currentCalendarDate.getDay();

  const availabilityResourceKeys = useMemo(() => {
    return new Set(
      (finalResourceLit ?? [])
        .filter((r: any) => r?.availability?.some((a: any) => a?.dayOfWeek === dayIndex))
        .map(r => r.key)
    );
  }, [finalResourceLit, dayIndex]);

  const visibleResources =
    currentView === 'day'
      ? (finalResourceLit ?? [])
      : (finalResourceLit ?? []);

  // Force BigCalendar to remount when filters change (react-big-calendar can keep stale resource columns otherwise)
  const calendarKey = useMemo(() => {
    const facilityKey = selectedFacility?.id ?? '';
    const typeKeys = Array.isArray(selectedResourceType?.resourcesType)
      ? selectedResourceType.resourcesType.join(',')
      : '';
    const rk = (selectedResources as any)?.resourceKey;
    const resourceKeys = rk != null && String(rk).trim() !== '' ? String(rk) : '';
    return `${facilityKey}|${typeKeys}|${resourceKeys}|${currentView}`;
  }, [selectedFacility?.id, selectedResourceType?.resourcesType, selectedResources, currentView]);

  const handleRescheduleAppointment = (appointmentDataToEdit = null) => {
    const dataToEdit = appointmentDataToEdit || selectedEvent?.appointmentData;
    if (!dataToEdit) return;
    setAppointmentToReschedule(dataToEdit);
    setActionsModalOpen(false);
    setRescheduleModalOpen(true);
  };

  const handleRescheduleSuccess = () => {
    setRescheduleModalOpen(false);
    setAppointmentToReschedule(null);
    setSelectedEvent(null);
    void handleSearchAppointmentsByCriteria();
  };

  const handleViewAppointment = (appointmentDataToView = null) => {
    const dataToView = appointmentDataToView || selectedEvent?.appointmentData;
    if (dataToView) {
      isOpeningViewModalRef.current = true;
      setViewAppointmentData(dataToView);
      setBookPatientReadOnly(true);
      setBookPatientModalOpen(true);
      setActionsModalOpen(false);
      setTimeout(() => {
        isOpeningViewModalRef.current = false;
      }, 10);
    }
  };

  const getTooltipResourceDisplay = (event: any) => {
    const fromMapped = String(event?.tooltipResourceName ?? '').trim();
    if (fromMapped) return fromMapped;
    const ad = event?.appointmentData ?? {};
    const direct = String(ad?.resourceName ?? ad?.resource_name ?? '').trim();
    if (direct) return direct;
    const fk = String(event?.filterResourceId ?? '').trim();
    if (fk) {
      const byId = resourceNameById.get(fk);
      if (byId) return String(byId).trim();
      const fromAvail = (resourcesWithAvailabilityResponse?.object ?? []).find(
        (r: any) => String(r?.key) === fk
      );
      if (fromAvail?.resourceName) return String(fromAvail.resourceName).trim();
    }
    const rid = String(
      ad?.resourceKey ?? ad?.resource_key ?? ad?.resourceId ?? ad?.resource_id ?? ''
    ).trim();
    if (rid) {
      const byId = resourceNameById.get(rid);
      if (byId) return String(byId).trim();
    }
    const resourceTypeKey = normalizeResourceTypeKey(
      ad?.resourceTypeLkey ?? ad?.resourceType ?? ad?.resource_type ?? ad?.templateType ?? ad?.template_type
    );
    const idsToTry = [
      ad?.resourceKey,
      ad?.resource_key,
      ad?.resourceId,
      ad?.resource_id,
      ad?.requestedResourceId,
      ad?.requested_resource_id,
      ad?.departmentId,
      ad?.department_id,
      ad?.practitionerId,
      ad?.practitioner_id,
      ad?.practitionerKey,
      ad?.practitioner_key,
      ad?.catalogId,
      ad?.catalog_id,
      ad?.diagnosticTestId,
      ad?.diagnostic_test_id,
      ad?.serviceId,
      ad?.service_id,
      ad?.resource?.key,
      event?.filterResourceId
    ]
      .filter((v: any) => v !== null && typeof v !== 'undefined')
      .map((v: any) => String(v));
    const byTypeMap =
      (resourceNameByTypeAndId as any)[resourceTypeKey] ??
      (resourceTypeKey === 'DIAGNOSTIC_TEST'
        ? (resourceNameByTypeAndId as any).DIAGNOSTIC_TEST
        : undefined);
    const fromTypeMap =
      byTypeMap instanceof Map ? idsToTry.map((id: string) => byTypeMap.get(id)).find(Boolean) : '';
    if (fromTypeMap) return String(fromTypeMap).trim();
    const fromSvcMap = idsToTry.map((id: string) => resourceNameById.get(id)).find(Boolean);
    if (fromSvcMap) return String(fromSvcMap).trim();
    const fromAvailName = (resourcesWithAvailabilityResponse?.object ?? [])
      .find((r: any) => idsToTry.includes(String(r?.key)))
      ?.resourceName;
    if (fromAvailName) return String(fromAvailName).trim();
    const colKey = String(event?.resourceId ?? '').trim();
    if (colKey) {
      const col = (finalResourceLit ?? []).find((d: any) => String(d?.key) === colKey);
      if (col?.resourceName) return String(col.resourceName).trim();
    }
    const nestedRes = String(ad?.resource?.resourceName ?? ad?.resource?.name ?? '').trim();
    if (nestedRes) return nestedRes;
    return String(event?.resource?.resourceName ?? '').trim();
  };

  const getTooltipContent = (event: any) => {
    const resourceName = getTooltipResourceDisplay(event);
    const titleStr = String(event?.title ?? '').trim();
    const fromToStr = String(event?.fromTo ?? '').trim();
    const head =
      currentView === 'month' ? [titleStr, fromToStr].filter(Boolean).join(' - ') : titleStr;
    const res = String(resourceName ?? '').trim();
    const headHasResourceSegment =
      res &&
      head
        .split('|')
        .map(s => s.trim().toLowerCase())
        .some(seg => seg === res.toLowerCase());
    const parts: string[] = [];
    if (head) parts.push(head);
    if (res && !headHasResourceSegment) parts.push(res);
    const out = parts.join(' | ').trim();
    return out || head || res || 'Appointment';
  };

  const [currentCalView, setCurrentCalView] = useState('month'); // Force "month" view

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  const ResourceHeader = ({ resource }) => {
    return (
      <div
        style={{
          marginLeft: '5px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          height: '65px'
        }}
      >
        <Avatar
          size="md"
          circle
          src={
            resource && resource.fileContent
              ? `data:${resource.contentType};base64,${resource.fileContent}`
              : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
          }
        />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '14px' }} className="font-semibold text-sm">
            {resource?.resourceName}
          </div>
          <div style={{ color: 'gray', fontSize: '12px' }}>{resource?.resource_type}</div>
        </div>
      </div>
    );
  };

  const formats = {
    timeGutterFormat: (date, culture, localizer) => localizer.format(date, 'h A', culture)
  };

  const data = [];
  const minTime = useMemo(() => {
    const candidateStartMinutes: number[] = [];

    (finalAppointments ?? []).forEach((evt: any) => {
      const start = new Date(evt?.start);
      if (!Number.isNaN(start.getTime())) {
        candidateStartMinutes.push(start.getHours() * 60 + start.getMinutes());
      }
    });

    const fallbackStart = 8 * 60;
    const earliest = candidateStartMinutes.length > 0 ? Math.min(...candidateStartMinutes) : fallbackStart;
    const roundedStart = Math.max(0, Math.floor(earliest / 60) * 60);

    const min = new Date();
    min.setHours(Math.floor(roundedStart / 60), roundedStart % 60, 0, 0);
    return min;
  }, [finalAppointments]);

  const todayAppointmentsList = useMemo(() => {
    const rows = (todayAppointmentsResponse as any)?.data ?? [];
    const mappedFromStatusQuery = rows.map((a: any) => {
      const dt = new Date(
        a?.appointmentDateTime ??
        a?.appointmentStart ??
        a?.appointment_start ??
        a?.applyStartDateTime ??
        Date.now()
      );
      const timeLabel = Number.isNaN(dt.getTime())
        ? '--:--'
        : dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const patient = a?.patient ?? {};
      const pid = getAppointmentPatientId(a);
      const fromSvc = pid != null ? patientDisplayByPatientService.get(String(pid)) : undefined;
      const patientName =
        (fromSvc?.name && fromSvc.name.trim()) ||
        patient?.full_name ||
        patient?.fullName ||
        [patient?.first_name, patient?.last_name].filter(Boolean).join(' ') ||
        [patient?.firstName, patient?.lastName].filter(Boolean).join(' ') ||
        'Unknown';
      return {
        id: a?.id ?? a?.key ?? `${patientName}-${timeLabel}`,
        timeLabel,
        patientName,
        status: a?.status ?? a?.appointmentStatus ?? '-'
      };
    });

    if (mappedFromStatusQuery.length > 0) {
      return mappedFromStatusQuery;
    }

    // Fallback: derive right panel list from currently loaded calendar events for selected day.
    const day = new Date(rightPanelDate ?? currentCalendarDate ?? new Date());
    const y = day.getFullYear();
    const m = day.getMonth();
    const d = day.getDate();
    return (finalAppointments ?? [])
      .filter((e: any) => {
        const dt = new Date(e?.start);
        return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
      })
      .map((e: any) => {
        const dt = new Date(e?.start);
        return {
          id: e?.id ?? `${e?.title ?? 'appt'}-${dt.getTime()}`,
          timeLabel: Number.isNaN(dt.getTime())
            ? '--:--'
            : dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          patientName: String(e?.title ?? 'Unknown').split(',')[0] ?? 'Unknown',
          status: e?.appointmentData?.appointmentStatus ?? '-'
        };
      });
  }, [
    todayAppointmentsResponse,
    finalAppointments,
    rightPanelDate,
    currentCalendarDate,
    patientDisplayByPatientService
  ]);


  const todayTimelineRows = useMemo(() => {
    const statusColor = (status: string) => {
      const s = String(status ?? '').toUpperCase();
      if (s.includes('BOOK')) return '#059669';
      if (s.includes('CONFIRM')) return '#166534';
      if (s.includes('COMPLETE')) return '#6DA7E8';
      if (s.includes('NEW')) return '#4B7BEC';
      if (s.includes('CHECK')) return '#F5B971';
      if (s.includes('NO_SHOW') || s.includes('NO-SHOW')) return '#E8CF5A';
      if (s.includes('IN_SERVICE') || s.includes('IN SERVICE')) return '#7C8BF3';
      if (s.includes('CANCEL')) return '#F87171';
      return '#C8D1E1';
    };
    const hours = [8, 9, 10, 11, 12];
    return hours.map(hour => {
      const matches = todayAppointmentsList.filter((a: any) => {
        const parsed = new Date(`1970-01-01T${a.timeLabel?.replace(' ', '')}`);
        if (!Number.isNaN(parsed.getTime())) return parsed.getHours() === hour;
        const h = Number(String(a.timeLabel ?? '').split(':')[0]);
        return h === hour;
      });
      const dots = matches.slice(0, 8).map((m: any) => statusColor(m.status));
      while (dots.length < 8) dots.push('#E6EBF3');
      return { hour, dots };
    });
  }, [todayAppointmentsList]);

  const rightPanelAppointmentRows = useMemo(() => {
    const statusColor = (status: string) => {
      const s = String(status ?? '').toUpperCase();
      if (s.includes('BOOK') || s.includes('RESCHEDULE')) return '#059669';
      if (s.includes('CONFIRM')) return '#166534';
      if (s.includes('COMPLETE')) return '#6DA7E8';
      if (s.includes('NEW')) return '#4B7BEC';
      if (s.includes('CHECK')) return '#F5B971';
      if (s.includes('NO_SHOW') || s.includes('NO-SHOW')) return '#E8CF5A';
      if (s.includes('IN_SERVICE') || s.includes('IN SERVICE')) return '#7C8BF3';
      if (s.includes('CANCEL')) return '#F87171';
      return '#9DB5DA';
    };

    return (todayAppointmentsList ?? []).slice(0, 5).map((a: any) => {
      const hourPart = String(a?.timeLabel ?? '').split(':')[0] || '--';
      const hourNum = Number(hourPart);
      const hourLabel = Number.isFinite(hourNum)
        ? `${((hourNum + 11) % 12) + 1} ${hourNum >= 12 ? 'PM' : 'AM'}`
        : '--';
      const dots = Array.from({ length: 8 }).map((_, idx) =>
        idx < 4 ? statusColor(a?.status) : '#E6ECF7'
      );
      return {
        ...a,
        hourLabel,
        dots
      };
    });
  }, [todayAppointmentsList]);

  const hexToRgba = (hex, alpha = 0.1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const MyEvent = ({ event }) => {
    const status = String(
      event?.appointmentData?.appointmentStatus ?? event?.appointmentData?.status ?? ''
    ).toUpperCase();
    const appointment = event?.appointmentData ?? {};
    const patient = appointment?.patient ?? {};
    const pid = getAppointmentPatientId(appointment);
    const fromSvc = pid != null ? patientDisplayByPatientService.get(String(pid)) : undefined;
    const patientName =
      (fromSvc?.name && fromSvc.name.trim()) ||
      patient?.full_name ||
      patient?.fullName ||
      [patient?.first_name, patient?.last_name].filter(Boolean).join(' ') ||
      [patient?.firstName, patient?.lastName].filter(Boolean).join(' ') ||
      '';
    const mrn =
      (fromSvc?.mrn && fromSvc.mrn.trim()) ||
      (patient?.patient_mrn ??
        patient?.patientMrn ??
        patient?.mrn ??
        appointment?.patientMrn ??
        appointment?.patient_mrn ??
        '');
    const resourceNameText =
      appointment?.resourceName ||
      appointment?.resource_name ||
      event?.resource?.resourceName ||
      (event?.filterResourceId != null ? resourceNameById.get(String(event.filterResourceId)) : '') ||
      '';
    const patientSlotText =
      [patientName, mrn ? `MRN: ${mrn}` : '', resourceNameText].filter(Boolean).join(' | ') ||
      resourceNameText ||
      'Appointment';
    const image = event?.appointmentData?.profilePicture;
    const content_type = event?.appointmentData?.profilePicture;

    if (isOpenSlotStatus(status)) {
      const startLabel =
        event?.start instanceof Date && !Number.isNaN(event.start.getTime())
          ? event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '--:--';
      const endLabel =
        event?.end instanceof Date && !Number.isNaN(event.end.getTime())
          ? event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '--:--';
      const resourceText = getTooltipResourceDisplay(event) || 'Unknown Resource';
      return (
        <div className="available-slot-card" title={getTooltipContent(event)}>
          <div className="available-slot-title">{startLabel} - {endLabel}</div>
          <div className="available-slot-status-row">
            <span className="available-slot-dot" />
            <span>
              {resourceText}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        title={getTooltipContent(event)}
        style={{
          padding: '7px',
          display: 'flex',
          gap: '9px'
        }}
      >
        <div style={{ marginRight: '5px' }}>
          <Avatar
            size="xs"
            circle
            src={
              image
                ? `data:${content_type};base64,${image}`
                : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
            }
          />
        </div>

        <div>
          <p style={{ fontSize: '12px', color: 'black' }}>{patientSlotText}</p>
          <p
            style={{
              fontSize: '10px',
              marginTop: '9px',
              color: '#8F98AB'
            }}
          >
            {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ›{' '}
            {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  };

  const eventPropGetter = event => {
    const normalize = str => str?.toLowerCase().replace(/[-_]/g, ' ').trim();
    const normalizeStatusForLegend = (status: string) => {
      const s = normalize(status);
      if (s?.includes('cancel')) return 'cancel';
      if (s?.includes('reschedule')) return 'reschedule';
      if (s?.includes('no show')) return 'no show';
      if (s?.includes('checked in') || s?.includes('check in')) return 'checked in';
      if (s?.includes('book')) return 'booked';
      if (s?.includes('in service')) return 'in service';
      if (s?.includes('confirm')) return 'confirmed';
      if (s?.includes('complete')) return 'completed';
      if (s?.includes('new')) return 'new';
      return s;
    };

    const getBackgroundColor = status => {
      const key = normalizeStatusForLegend(status);
      const item = legendItems.find(i => normalize(i.label) === key);
      return item ? hexToRgba(item.color, 0.15) : '#ffffffff';
    };

    const getBorderColor = status => {
      const key = normalizeStatusForLegend(status);
      const item = legendItems.find(i => normalize(i.label) === key);
      return item?.borderColor ? item.color : '#007bff';
    };

    const status = String(event?.appointmentData?.appointmentStatus ?? event?.appointmentData?.status ?? '');
    if (isOpenSlotStatus(status)) {
      return {
        style: {
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: 0,
          width: '100%',
          minWidth: 0
        }
      };
    }
    const backgroundColor = getBackgroundColor(status);
    const borderColor = getBorderColor(status);

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '3px',
        borderStyle: 'solid',
        borderRadius: '10px',
        padding: '8px',
        color: 'black',
        boxShadow: `0 2px 8px ${hexToRgba(borderColor, 0.3)}`,
        transition: 'all 0.2s ease'
      }
    };
  };

  const slotPropGetter = (date, resourceId) => {
    const defaultShadedStyle = {
      backgroundColor: '#ffffff',
      pointerEvents: 'none',
      color: '#d5dbe5'
    };

    const currentResource = (resourcesWithAvailabilityResponse?.object ?? []).find(
      (r: any) => r?.key === resourceId
    ) as any;

    const currentResourceAvailability = (currentResource as any)?.['availability'] as any[] | undefined;
    if (currentResource && currentResourceAvailability) {
      const jsDay = date.getDay();
      const apiDay = jsDay;
      const currentMinutes = date.getHours() * 60 + date.getMinutes();
      const isAvailable =
        currentResourceAvailability.some((period: any) => {
          const startMinutes = period.startHour * 60 + (period.startMinute || 0);
          const endMinutes = period.endHour * 60 + (period.endMinute || 0);
          const match =
            period.dayOfWeek === apiDay && currentMinutes >= startMinutes && currentMinutes < endMinutes;
          return match;
        }) || false;

      if (isAvailable) {
        return {};
      }
    }

    return { style: defaultShadedStyle };
  };

  const requestsRows = useMemo(() => {
    const list = (appointmentRequestsResponse ?? []).filter((r: any) => {
      const st = String(r?.status ?? '')
        .toUpperCase()
        .replace(/-/g, '_');
      return st !== 'APPROVED';
    });
    return list.map((r: any) => {
      const patientName = String(r?.patientName ?? '').trim() || 'Unknown';
      const patientIdNum = Number(r?.patientId ?? 0);
      const mrn = String(
        r?.patientMrn ?? ''
      ).trim();
      const resourceType = r?.requestedResourceType ?? '-';
      const resourceName =
        String(r?.departmentName ?? '').trim() ||
        (r?.requestedResourceId != null ? `Resource #${r.requestedResourceId}` : '-');

      return {
        id: String(r?.id ?? ''),
        patientName,
        mrn,
        ageText: '',
        genderText: '',
        facilityKey: r?.facilityId ?? '',
        createdBy: r?.requestedBy ?? r?.createdBy ?? '',
        createdAt: r?.requestedDate ?? r?.createdDate ?? null,
        status: r?.status ?? 'REQUESTED',
        resourceName,
        resourceType,
        resourceKey: r?.requestedResourceId ?? '',
        updatedBy: r?.lastModifiedBy ?? '',
        updatedAt: r?.lastModifiedDate ?? r?.cancelledAt ?? r?.cancelled_at ?? null,
        otherReason: r?.cancelReason ?? '',
        _raw: { ...r, key: r?.id }
      };
    });
  }, [appointmentRequestsResponse, patientDisplayByPatientService]);

  const handleApproveRequest = (row: any) => {
    const raw = row?._raw ?? {};
    const facilityId =
      raw?.facilityId ??
      raw?.facility_id ??
      raw?.facilityKey ??
      raw?.facility_key ??
      null;
    const departmentId =
      raw?.departmentId ??
      raw?.department_id ??
      raw?.requestedResourceId ??
      raw?.requested_resource_id ??
      null;
    if (!facilityId || !departmentId) {
      dispatch(
        notify({
          msg: 'Request must include facility and requested department before approval.',
          sev: 'warning'
        })
      );
      return;
    }

    // Keep ScheduleScreen UI untouched; agenda filtering/rendering happens inside approve modal only.
    setAppRequestModalOpen(false);
    setRequestToApprove(raw);
    setRequestApproveModalOpen(true);
  };

  const handleAgendaSlotConfirmCancel = useCallback(() => {
    setAgendaSlotConfirmOpen(false);
    pendingAgendaSlotRef.current = null;
  }, []);

  const handleApproveAgendaSelectAppointment = (appointmentFromAgenda: any) => {
    pendingAgendaSlotRef.current = appointmentFromAgenda;
    setAgendaSlotConfirmOpen(true);
  };

  const handleAgendaSlotConfirmOk = useCallback(async () => {
    const slot = pendingAgendaSlotRef.current;
    if (!slot) {
      handleAgendaSlotConfirmCancel();
      return;
    }
    const success = await openEditorForNewAppointment({
      appointmentRaw: slot,
      request: requestToApprove,
      shouldApprove: isRequestPendingApproval(requestToApprove),
      skipAppointmentModal: true
    });
    if (success) {
      setAgendaSlotConfirmOpen(false);
      pendingAgendaSlotRef.current = null;
    }
  }, [handleAgendaSlotConfirmCancel, openEditorForNewAppointment, requestToApprove]);

  const handleRejectRequest = async (row: any, rejectReason: string) => {
    try {
      const raw = row?._raw;
      const requestId = raw?.id ?? raw?.key;
      if (!requestId) return;

      await cancelAppointmentRequest({
        id: requestId,
        data: {
          cancelReason: rejectReason
        }
      }).unwrap();

      dispatch(
        notify({
          msg: 'Appointment request cancelled successfully.',
          sev: 'success'
        })
      );
    } catch (e) { }
  };

  return (
    <div className="appointments-schedule-screen">
      <div
        className={`appointments-schedule-layout ${filtersCollapsed ? 'filters-collapsed' : ''}`}
        style={{
          backgroundColor: mode === 'light' ? 'rgba(250, 250, 250, 8)' : 'var(--extra-dark-black)',
          position: 'relative',
          zIndex: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          height: 'auto',
          minHeight: 'calc(100vh - 90px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          gap: 12
        }}
      >
        <ScheduleFiltersPanel
          filtersCollapsed={filtersCollapsed}
          setFiltersCollapsed={setFiltersCollapsed}
          activeFacilitiesResponse={activeFacilitiesResponse as any[]}
          selectedFacility={selectedFacility}
          setSelectedFacility={setSelectedFacility}
          departmentOptions={departmentOptions as any[]}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
          TemplateTypeEnum={TemplateTypeEnum as any[]}
          selectedResourceTypeValue={selectedResourceTypeValue}
          setSelectedResourceTypeValue={setSelectedResourceTypeValue}
          filteredResourcesList={filteredResourcesList as any[]}
          selectedResources={selectedResources}
          setSelectedResources={setSelectedResources}
          mode={mode}
          schedulePatientFilter={schedulePatientFilter}
          setSchedulePatientFilter={setSchedulePatientFilter}
          AppointmentStatusEnum={AppointmentStatusEnum as any[]}
          selectedAppointmentStatus={selectedAppointmentStatus}
          setSelectedAppointmentStatus={setSelectedAppointmentStatus}
          BookingModeEnum={BookingModeEnum as any[]}
          selectedBookingMode={selectedBookingMode}
          setSelectedBookingMode={setSelectedBookingMode}
        />

        <Panel
          bordered
          className="right-section appointments-main-card"
          style={{ display: 'flex', flexDirection: 'column', minHeight: 620 }}
        >
          <ScheduleSummaryBar
            slotSummaryBarStats={slotSummaryBarStats}
            selectedDepartment={selectedDepartment}
            departmentOptions={departmentOptions as any[]}
            selectedResources={selectedResources}
            resourceNameById={resourceNameById}
            selectedResourceTypeValue={selectedResourceTypeValue}
          />
          <ScheduleContentGrid
            calendarKey={calendarKey}
            currentCalendarDate={currentCalendarDate}
            setCalendarDate={setCalendarDate}
            setCurrentCalendarDate={setCurrentCalendarDate}
            setRightPanelDate={setRightPanelDate}
            currentView={currentView}
            visibleResources={visibleResources}
            minTime={minTime}
            formats={formats}
            localizer={localizer}
            finalAppointments={finalAppointments}
            resourcesWithAvailabilityResponse={resourcesWithAvailabilityResponse}
            setSelectedSlot={setSelectedSlot}
            setBookPatientReadOnly={setBookPatientReadOnly}
            setBookPatientModalOpen={setBookPatientModalOpen}
            handleSelectEvent={handleSelectEvent}
            getTooltipContent={getTooltipContent}
            setCurrentView={setCurrentView}
            eventPropGetter={eventPropGetter}
            ResourceHeader={ResourceHeader}
            MyEvent={MyEvent}
            slotPropGetter={slotPropGetter}
            rightPanelDate={rightPanelDate}
            todayAppointmentsList={todayAppointmentsList}
            isFetchingTodayAppointments={isFetchingTodayAppointments}
            rightPanelAppointmentRows={rightPanelAppointmentRows}
            todayTimelineRows={todayTimelineRows}
            handleViewAppointment={handleViewAppointment}
            dispatch={dispatch}
          />
        </Panel>
      </div>

      <ApproveRequestAgendaModal
        open={requestApproveModalOpen}
        setOpen={nextOpen => {
          setRequestApproveModalOpen(nextOpen);
          if (!nextOpen) setRequestToApprove(null);
        }}
        request={requestToApprove}
        onSelectAppointment={handleApproveAgendaSelectAppointment}
      />
      <BookPatient
        open={bookPatientModalOpen}
        setOpen={nextOpen => {
          setBookPatientModalOpen(nextOpen);
          if (!nextOpen) {
            setViewAppointmentData(null);
            setSelectedEvent(null);
            setBookPatientReadOnly(false);
          }
        }}
        readOnly={bookPatientReadOnly}
        appointmentData={viewAppointmentData || selectedEvent?.appointmentData}
        practitioners={(appointablePractitionersResponse as any)?.data ?? []}
        services={(appointableServicesResponse as any)?.data ?? []}
        onBooked={async () => {
          await handleSearchAppointmentsByCriteria();
        }}
      />

      <FollowupAppointmentModal
        from={'Schedule'}
        isOpen={followUpModalOpen}
        onClose={() => {
          setFollowUpModalOpen(false);
          setFollowUpDraftData(null);
          setShowAppointmentOnly(false);
          setViewAppointmentData(null);
        }}
        patient={
          followUpDraftData?.patient ??
          viewAppointmentData?.patient ??
          selectedEvent?.appointmentData?.patient ??
          null
        }
        appointmentData={followUpDraftData || viewAppointmentData || selectedEvent?.appointmentData}
        resourceType={selectedResourceType}
        facility={selectedFacility}
        onSave={handleSearchAppointmentsByCriteria}
        showOnly={showAppointmentOnly}
        selectedSlot={showAppointmentOnly ? null : selectedSlot}
      />
      <AppointmentActionsModal
        viewAppointment={appointmentData => handleViewAppointment(appointmentData)}
        editAppointment={appointmentData => handleRescheduleAppointment(appointmentData)}
        onStatusChange={handleSearchAppointmentsByCriteria}
        isActionsModalOpen={ActionsModalOpen}
        onActionsModalClose={() => {
          if (!isOpeningViewModalRef.current) {
            setSelectedEvent(null);
          }
          setActionsModalOpen(false);
        }}
        appointment={selectedEvent}
      />
      <RescheduleAppointmentModal
        open={rescheduleModalOpen}
        setOpen={nextOpen => {
          setRescheduleModalOpen(nextOpen);
          if (!nextOpen) {
            setAppointmentToReschedule(null);
          }
        }}
        appointment={appointmentToReschedule}
        onRescheduled={handleRescheduleSuccess}
      />

      <Modal
        open={showReasonModal}
        onClose={() => setShowReasonModal(false)}
        className="schedule-reason-center-modal"
      >
        <Modal.Header >Reason for {reasonModalType === 'Cancel' ? 'Cancellation' : 'No-Show'}</Modal.Header>
        <Modal.Body>
          <Form fluid layout="vertical">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 520, maxWidth: '100%' }}>
              <MyInput
                width="100%"
                column
                fieldLabel="Reason"
                fieldName="reason"
                fieldType="textarea"
                rows={3}
                record={reasonViewRecord}
                setRecord={setReasonViewRecord}
                disabled
              />
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <DeletionConfirmationModal
        open={agendaSlotConfirmOpen}
        setOpen={nextOpen => {
          setAgendaSlotConfirmOpen(nextOpen);
          if (!nextOpen) pendingAgendaSlotRef.current = null;
        }}
        actionType="confirm"
        confirmationQuestion="Approve the request and book this time slot?"
        cancelButtonLabel="No"
        actionButtonLabel="Yes"
        actionButtonFunction={() => void handleAgendaSlotConfirmOk()}
      />

      <MyModal
        open={appRequestModalOpen}
        setOpen={setAppRequestModalOpen}
        title={'View Appoimtment Request'}
        bodyheight="80vh"
        size="70vw"
        actionButtonLabel="Confirm"
        actionButtonFunction={() => {
          setAppRequestModalOpen(false);
        }}
        content={
          <ViewAppointmentRequests data={requestsRows} onApprove={handleApproveRequest} onReject={handleRejectRequest} />
        }
      ></MyModal>
      <ViewRequestsFloatingButton onOpen={() => setAppRequestModalOpen(true)} />
    </div>
  );
};

export default ScheduleScreen;