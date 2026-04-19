import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Calendar as BigCalendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  Panel,
  Input,
  Button,
  Form,
  Drawer,
  Calendar as RsCalendar,
  DatePicker,
  Checkbox,
  Modal,
  Avatar,
  Stack,
  ButtonGroup,
  Text
} from 'rsuite';
import './styles.less';
import SearchIcon from '@rsuite/icons/Search';
import { newApAppointment } from '@/types/model-types-constructor';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import { initialListRequest, ListRequest } from '@/types/types';
import AppointmentModal from './AppoitmentModal';
import FollowupAppointmentModal from './FollowupAppointmentModal';
import { ApAppointment } from '@/types/model-types';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faCalendarCheck,
  faCheckDouble,
  faCircleCheck,
  faCirclePlus,
  faClock,
  faPlus,
  faPrint,
  faStethoscope,
  faUserCheck,
  faUserSlash,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import AppointmentActionsModal from './components/AppointmentActionsModal';
import {
  useGetResourcesWithAvailabilityQuery,
  useSaveAppointmentMutation
} from '@/services/appointmentService';
import { useLazySearchAppointmentsQuery } from '@/services/appointment/appointmentService';
import { useGetAppointableDepartmentsQuery } from '@/services/security/departmentService';
import { useGetAppointablePractitionerByLoggedInFacilityQuery } from '@/services/setup/practitioner/PractitionerService';
import { useGetAppointableCatalogsByLoggedInFacilityQuery } from '@/services/setup/catalog/catalogService';
import { useGetAllActiveAppointableDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetAppointableServicesByLoggedInFacilityQuery } from '@/services/setup/serviceService';
import { useLazyGetAppointmentsByStatusBetweenDatesQuery } from '@/services/appointment/appointmentService';
import { useGetAllResourcesQuery } from '@/services/setup/resource/ResourceService';
import MyInput from '@/components/MyInput';
import CalenderSimpleIcon from '@rsuite/icons/CalenderSimple';
import ArrowLeftLineIcon from '@rsuite/icons/ArrowLeftLine';
import ArrowRightLineIcon from '@rsuite/icons/ArrowRightLine';
import Translate from '@/components/Translate';
import { useFetchAttachmentsListQuery } from '@/services/attachmentService';
import { useSelector } from 'react-redux';
import MyButton from '@/components/MyButton/MyButton';
import SectionContainer from '@/components/SectionsoContainer';
import MyModal from '@/components/MyModal/MyModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import ViewAppointmentRequests from './ViewAppointmentRequests';
import { useEnumOptions } from '@/services/enumsApi';
import { calculateAgeFormat } from '@/utils';
import { update } from 'lodash';
import TodayAppointmentsList from './components/TodayAppointmentsList';
import BookPatient from './components/BookPatient';
import { useGetPatientsByIdsQuery } from '@/services/patient/patientService';
import ViewRequestsFloatingButton from './components/ViewRequestsFloatingButton';
import ApproveRequestAgendaModal from './components/ApproveRequestAgendaModal';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  useApproveAppointmentRequestMutation,
  useCancelAppointmentRequestMutation,
  useGetAppointmentRequestsQuery
} from '@/services/appointment/appointmentRequestService';

/** Resolve numeric patient id from appointment payload (not nested patient object). */
const getAppointmentPatientId = (appointment: any): number | null => {
  const raw =
    appointment?.patientId ??
    appointment?.patientKey ??
    (typeof appointment?.patient === 'object'
      ? appointment.patient?.id ?? appointment.patient?.key
      : appointment?.patient);
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
  { label: 'New', color: '#E8F6EF', borderColor: '#89D0B2', icon: faCirclePlus, summaryIconBg: '#059669' },
  { label: 'In Service', color: '#C7D2FE', icon: faStethoscope, summaryIconBg: '#4f46e5' },
  { label: 'Confirmed', color: '#ADFF2F', icon: faCheckDouble, summaryIconBg: '#65a30d' },
  { label: 'Completed', color: '#93C5FD', icon: faCircleCheck, summaryIconBg: '#1d4ed8' },
  { label: 'Cancel', color: '#FECACA', icon: faXmark, summaryIconBg: '#dc2626' }
];

const normLegendStr = (str: string) => String(str ?? '').toLowerCase().replace(/[-_]/g, ' ').trim();

/** Maps API appointment status to legend bucket key (aligned with eventPropGetter). */
const appointmentStatusToLegendBucket = (rawStatus: string): string => {
  const s = normLegendStr(rawStatus);
  if (s.includes('cancel')) return 'cancel';
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
  const [validationResult] = useState({});
  const [recordSearchAppointment, setRecordSearchAppointment] = useState({ value: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [bookPatientModalOpen, setBookPatientModalOpen] = useState(false);
  const [bookPatientReadOnly, setBookPatientReadOnly] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [followUpDraftData, setFollowUpDraftData] = useState<any>(null);
  const [ActionsModalOpen, setActionsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewAppointmentData, setViewAppointmentData] = useState(null);
  const isOpeningViewModalRef = useRef(false);
  const pendingNewSlotEventRef = useRef<any>(null);
  const pendingAgendaSlotRef = useRef<any>(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [appRequestModalOpen, setAppRequestModalOpen] = useState(false);
  const FOLLOW_UP_VISIT_TYPE_LKEY = 'FOLLOW_UP';
  const dispatch = useAppDispatch();

  const [saveAppointment] = useSaveAppointmentMutation();
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
  const [confirmNewSlotOpen, setConfirmNewSlotOpen] = useState(false);
  const [newSlotConfirmBusy, setNewSlotConfirmBusy] = useState(false);
  const [agendaSlotConfirmOpen, setAgendaSlotConfirmOpen] = useState(false);

  //Calendar Filters
  // NOTE: `MyInput`'s `setRecord` spreads `record` (`{ ...record, ... }`),
  // so these MUST NOT be `null` (spreading null would crash at runtime).
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
  const [selectedResources, setSelectedResources] = useState<{ resourceKey: string[] }>({
    resourceKey: []
  });
  const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState<{ status: string | null }>({
    status: null
  });
  const [selectedBookingMode, setSelectedBookingMode] = useState<{ bookingMode: string | null }>({
    bookingMode: null
  });
  const [listRequest] = useState<ListRequest>({ ...initialListRequest });
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [showAppointmentOnly, setShowAppointmentOnly] = useState(false);
  const [filteredResourcesList, setFilteredResourcesList] = useState([]);
  const [showCanceled, setShowCanceled] = useState<boolean>(false);
  const [filteredMonth] = useState<Date>();
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('day');
  const [totalAppointmentsText, setTotalAppointmentsText] = useState<string>();
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
  const BookingModeEnum = useEnumOptions('BookingMode');

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

  const { data: resourcesWithAvailabilityResponse } =
    useGetResourcesWithAvailabilityQuery(listRequest);
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

  // Used for mapping resourceKey -> resource name (per requirement: use ResourceService)
  const { data: allResourcesResponse } = useGetAllResourcesQuery({
    page: 0,
    size: 5000,
    sort: 'id,asc'
  });
  const resourceNameById = useMemo(() => {
    const list =
      (allResourcesResponse as any)?.data ??
      (allResourcesResponse as any)?.object ??
      allResourcesResponse ??
      [];
    const arr = Array.isArray(list) ? list : [];
    const m = new Map<string, string>();
    arr.forEach((r: any) => {
      const id = r?.id ?? r?.key;
      const name = r?.resourceName ?? r?.name ?? r?.resource_name ?? '';
      if (id !== null && typeof id !== 'undefined') m.set(String(id), String(name || ''));
    });
    return m;
  }, [allResourcesResponse]);

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
          appointment?.appointmentStart ??
          appointment?.appointment_start ??
          appointment?.startDatetime ??
          appointment?.start_datetime;
        const endRaw =
          appointment?.appointmentEnd ??
          appointment?.appointment_end ??
          appointment?.endDatetime ??
          appointment?.end_datetime;

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
          appointment?.department_id ??
          appointment?.department ??
          null;
        const normalizedDepartmentColumnId =
          departmentColumnId !== null && typeof departmentColumnId !== 'undefined'
            ? String(departmentColumnId)
            : '';

        const resourceKey =
          appointment?.resourceKey ??
          appointment?.resource_key ??
          appointment?.resourceId ??
          appointment?.resource_id;
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
          resource?.name ||
          appointment?.resourceName ||
          appointment?.resource_name ||
          '';
        const slotTitle = [patientFullName, patientMrn ? `MRN: ${patientMrn}` : '', resourceNameForTitle]
          .filter(Boolean)
          .join(' | ');

        const statusText = appointment?.appointmentStatus ?? appointment?.status ?? '';
        const isHidden = String(statusText).toUpperCase() === 'CANCELED';
        return {
          id: appointment?.key ?? appointment?.id,
          title:
            slotTitle ||
            ` ${patientFullName}, ${
              isNaN(dob.getTime()) ? 'Unknown' : today.getFullYear() - dob.getFullYear()
            }Y  ${
              !(currentView === 'day' || currentView === 'week')
                ? ', ' + (resource?.resourceName || 'Unknown Resource')
                : ''
            }
`,
          start: startDate,
          end: endDate,
          text: appointment.notes || 'No additional details available',
          appointmentData: appointment,
          hidden: isHidden,
          // Calendar columns are departments; bind events by department id.
          resourceId: normalizedDepartmentColumnId,
          // Keep actual resource id for resource-type/resource filtering logic.
          filterResourceId: normalizedResourceKey,
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
    setSelectedResources({ resourceKey: [] });
  }, [selectedResourceTypeValue?.value, selectedFacility?.id, selectedDepartment?.departmentId]);

  useEffect(() => {
    if (selectedSlot) {
      const firstSlotDate =
        selectedSlot?.slots?.[0] ??
        selectedSlot?.start ??
        null;
      setSelectedStartDate(firstSlotDate);
    }
  }, [selectedSlot]);

  const { data: noShowResonLovQueryResponse } = useGetLovValuesByCodeQuery('APP_NOSHOW_REASON');

  const { data: cancelResonLovQueryResponse } = useGetLovValuesByCodeQuery('APP_CANCEL_REASON');

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

    // NEW / template slots: confirm, then approve request (if any) and open AppointmentModal — not BookPatient.
    const isNewUnbooked =
      status === 'NEW' || status === 'NEW-APPOINTMENT' || status === 'NEW_APPOINTMENT';
    if (isNewUnbooked) {
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
      pendingNewSlotEventRef.current = freshEvent;
      setActionsModalOpen(false);
      setConfirmNewSlotOpen(true);
      return;
    }

    setActionsModalOpen(true);
  };

  const convertDate = appointmentTime => {
    return new Date(appointmentTime);
  };

  const [appointment, setAppointment] = useState<ApAppointment>({ ...newApAppointment });
  const [drowerOpen, setDrowerOpen] = useState(false);

  const handleSearchAppointmentsByCriteria = useCallback(async () => {
    const firstResourceId =
      Array.isArray(selectedResources?.resourceKey) && selectedResources.resourceKey.length > 0
        ? Number(selectedResources.resourceKey[0])
        : null;
    const patientIdCandidate = Number(recordSearchAppointment?.value);
    const patientId = Number.isFinite(patientIdCandidate) && patientIdCandidate > 0 ? patientIdCandidate : null;

    const filter = {
      facility: selectedFacility?.id ? Number(selectedFacility.id) : null,
      department: selectedDepartment?.departmentId ? Number(selectedDepartment.departmentId) : null,
      resourceType: selectedResourceTypeValue?.value ?? null,
      resourceId: firstResourceId,
      status: selectedAppointmentStatus?.status ?? null,
      bookingMode: selectedBookingMode?.bookingMode ?? null,
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
    } catch {}
  }, [
    searchAppointments,
    selectedFacility?.id,
    selectedDepartment?.departmentId,
    selectedResourceTypeValue?.value,
    selectedResources?.resourceKey,
    selectedAppointmentStatus?.status,
    selectedBookingMode?.bookingMode,
    recordSearchAppointment?.value
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
      const startRaw =
        raw?.appointmentStart ?? raw?.appointment_start ?? raw?.startDatetime ?? raw?.start_datetime;
      const endRaw = raw?.appointmentEnd ?? raw?.appointment_end ?? raw?.endDatetime ?? raw?.end_datetime;
      const departmentId =
        raw?.departmentId ??
        raw?.department_id ??
        raw?.departmentKey ??
        request?.departmentId ??
        request?.department_id ??
        request?.requestedResourceId;
      const facilityId =
        raw?.facilityId ??
        raw?.facility_id ??
        raw?.facilityKey ??
        request?.facilityId ??
        request?.facility_id ??
        selectedFacility?.id;
      const selectedSlotForModal = {
        start: startRaw ? new Date(startRaw) : null,
        end: endRaw ? new Date(endRaw) : null,
        resourceId: departmentId != null ? String(departmentId) : null,
        resourceKey: raw?.resourceKey ?? raw?.resourceId ?? raw?.requestedResourceId ?? null,
        resourceTypeLkey: raw?.resourceTypeLkey ?? raw?.resourceType ?? 'DEPARTMENT',
        facilityKey: facilityId
      };

      const slotPatientId = getAppointmentPatientId(raw);
      const requestPatientId = Number(
        request?.patientId ??
          request?.patient_id ??
          request?.patientKey ??
          request?.patient_key ??
          0
      );
      const effectivePatientId =
        requestPatientId > 0 ? requestPatientId : slotPatientId != null ? slotPatientId : null;
      const requestPatientName =
        String(request?.patientName ?? request?.patient_name ?? '').trim() || '';
      const lockPatient = Boolean(request && requestPatientId > 0);

      if (shouldApprove && request) {
        const requestId = Number(request?.id ?? request?.key);
        const appointmentId = Number(
          raw?.id ?? 0
        );
        const patientId = Number(
          request?.patientId ??
            0
        );
        const facId = Number(
          request?.facilityId ??
            0
        );
        const deptId = Number(
            request?.requestedResourceId ??
            0
        );
        const sourceEncounterId = Number(
          request?.sourceEncounterId ??
            NaN
        );
        const hasValidSourceEncounter = Number.isFinite(sourceEncounterId) && sourceEncounterId > 0;

        const priorityRaw = String(
          request?.priority ?? request?.priorityLkey ?? request?.priority_lkey ?? 'NORMAL'
        ).trim();
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
          const ae = approveErr as any;
          console.error(
            'approveAppointmentRequest failed',
            ae,
            ae?.data != null ? JSON.stringify(ae.data) : ''
          );
          dispatch(
            notify({
              msg: formatAppointmentRequestApproveError(approveErr),
              sev: 'error'
            })
          );
          dispatch(hideSystemLoader());
          return false;
        }
        dispatch(hideSystemLoader());
        }
      }

      if (skipAppointmentModal) {
        setRequestApproveModalOpen(false);
        setAppRequestModalOpen(false);
        return true;
      }

      const viewPayload = {
        ...(raw ?? {}),
        patientId: effectivePatientId,
        patient:
          effectivePatientId != null && effectivePatientId > 0
            ? {
                key: String(effectivePatientId),
                id: effectivePatientId,
                fullName:
                  requestPatientName ||
                  raw?.patient?.fullName ||
                  raw?.patient?.full_name ||
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
      setBookPatientModalOpen(false);
      setActionsModalOpen(false);
      setModalOpen(true);
      return true;
    },
    [
      approveAppointmentRequest,
      dispatch,
      handleSearchAppointmentsByCriteria,
      selectedFacility?.id
    ]
  );

  const handleConfirmNewSlotCancel = useCallback(() => {
    setConfirmNewSlotOpen(false);
    pendingNewSlotEventRef.current = null;
  }, []);

  const handleConfirmNewSlotOk = useCallback(async () => {
    const freshEvent = pendingNewSlotEventRef.current;
    if (!freshEvent?.appointmentData) {
      handleConfirmNewSlotCancel();
      return;
    }
    setNewSlotConfirmBusy(true);
    try {
      await openEditorForNewAppointment({
        appointmentRaw: freshEvent.appointmentData,
        request: requestToApprove,
        shouldApprove: isRequestPendingApproval(requestToApprove)
      });
    } finally {
      setNewSlotConfirmBusy(false);
      setConfirmNewSlotOpen(false);
      pendingNewSlotEventRef.current = null;
    }
  }, [handleConfirmNewSlotCancel, openEditorForNewAppointment, requestToApprove]);

  useEffect(() => {
    if (!selectedFacility?.id) return;
    void handleSearchAppointmentsByCriteria();
  }, [selectedFacility?.id, handleSearchAppointmentsByCriteria]);

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

  // Derived resources list (synchronous) to avoid a one-render "stale columns" glitch
  // when filters change (react-big-calendar can render once before an effect updates state).
  const finalResourceLit = useMemo(() => {
    const selectedDeptId = selectedDepartment?.departmentId ? String(selectedDepartment.departmentId) : '';
    const deptColumns = (departmentOptions ?? []).map((d: any) => ({
      key: String(d?.id ?? ''),
      resourceName: d?.name ?? d?.departmentName ?? `Department #${d?.id ?? ''}`
    }));

    // Calendar headers are always departments for selected facility.
    if (selectedDeptId) {
      return deptColumns.filter((d: any) => String(d?.key) === selectedDeptId);
    }
    return deptColumns;
  }, [
    selectedDepartment?.departmentId,
    departmentOptions
  ]);

  const selectedResourceKeysForFilter = useMemo(() => {
    if (Array.isArray(selectedResources?.resourceKey) && selectedResources.resourceKey.length > 0) {
      return new Set((selectedResources.resourceKey ?? []).map((k: any) => String(k)));
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

  // Filter appointments: department matches calendar columns (event.resourceId); optional resource / status / booking.
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
      const statusNeedle = String(selectedAppointmentStatus.status).toUpperCase();
      list = list.filter(event =>
        String(event?.appointmentData?.appointmentStatus ?? '').toUpperCase() === statusNeedle
      );
    }

    if (selectedBookingMode?.bookingMode) {
      const modeNeedle = String(selectedBookingMode.bookingMode).toUpperCase();
      list = list.filter(event =>
        String(event?.appointmentData?.bookingMode ?? '').toUpperCase() === modeNeedle
      );
    }

    return list;
  }, [
    appointmentsData,
    selectedDepartment?.departmentId,
    selectedResourceKeysForFilter,
    selectedAppointmentStatus?.status,
    selectedBookingMode?.bookingMode
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
        .filter(r => r.availability?.some(a => a.dayOfWeek === dayIndex))
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
    const resourceKeys = Array.isArray((selectedResources as any)?.resourceKey)
      ? (selectedResources as any).resourceKey.join(',')
      : Array.isArray(selectedResources)
      ? (selectedResources as any).join(',')
      : '';
    return `${facilityKey}|${typeKeys}|${resourceKeys}|${currentView}`;
  }, [selectedFacility?.id, selectedResourceType?.resourcesType, selectedResources, currentView]);

  const handleChangeAppointment = () => {
    const dataToEdit = selectedEvent?.appointmentData;
    if (dataToEdit) {
      if (isFollowUpAppointment(dataToEdit)) {
        setFollowUpDraftData(dataToEdit);
        setFollowUpModalOpen(true);
        setModalOpen(false);
        setActionsModalOpen(false);
        return;
      }
      setViewAppointmentData(dataToEdit);
      setShowAppointmentOnly(false);
      setSelectedSlot(null);
      setAppointment(dataToEdit);
      setModalOpen(true);
    }
    setActionsModalOpen(false);
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

  useEffect(() => {
    if (filteredMonth) {
      setDrowerOpen(false);
    }
    setDrowerOpen(false);
  }, [filteredMonth]);

  const CustomToolbar = ({ label, onNavigate, onView }) => {
    const [localVisibleAppointments, setLocalVisibleAppointments] = useState([]);
    const datePickerRef = useRef<any>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
      if (calendarDate) {
        setCalendarDate(calendarDate);
      }
    }, [calendarDate]);

    const handleClickCalinderSearch = () => {
      setShowDatePicker(true);
      if (datePickerRef.current) {
        datePickerRef.current.open();
      }
    };

    useEffect(() => {
      switch (currentView) {
        case 'day': {
          setTotalAppointmentsText('today appointments');
          const [, monthStrDay, dayStr] = label.split(' ');
          const day = parseInt(dayStr);
          const month = new Date(`${monthStrDay} 1, ${new Date().getFullYear()}`).getMonth();
          const year = new Date().getFullYear();

          const dayAppointments = visibleAppointments.filter(appointment => {
            const appointmentDate = new Date(appointment.start);
            return (
              appointmentDate.getDate() === day &&
              appointmentDate.getMonth() === month &&
              appointmentDate.getFullYear() === year
            );
          });

          if (dayAppointments !== localVisibleAppointments) {
            setLocalVisibleAppointments(dayAppointments);
          }
          break;
        }

        case 'week': {
          setTotalAppointmentsText('this week appointments');
          const [startDateStr, endDateStr] = label.split(' – ');
          const startDate = new Date(`${startDateStr}, ${new Date().getFullYear()}`);
          const endDate = new Date(`${endDateStr}, ${new Date().getFullYear()}`);

          const weekAppointments = visibleAppointments.filter(appointment => {
            const appointmentDate = new Date(appointment.start);
            return appointmentDate >= startDate && appointmentDate <= endDate;
          });

          if (JSON.stringify(weekAppointments) !== JSON.stringify(localVisibleAppointments)) {
            setLocalVisibleAppointments(weekAppointments);
          }
          break;
        }

        case 'month': {
          setTotalAppointmentsText('this month appointments');

          const [monthStr, yearStr] = label.split(' ');
          const month = new Date(`${monthStr} 1, ${yearStr}`).getMonth();
          const year = parseInt(yearStr);

          const filteredAppointments = visibleAppointments.filter(appointment => {
            const appointmentDate = new Date(appointment.start);
            return appointmentDate.getMonth() === month && appointmentDate.getFullYear() === year;
          });

          if (filteredAppointments !== localVisibleAppointments) {
            setLocalVisibleAppointments(filteredAppointments);
          }
          break;
        }

        case 'agenda': {
          setTotalAppointmentsText('this period appointments');

          const [startDateStr, endDateStr] = label.split(' – ');

          const startDateParts = startDateStr.split('/');
          const endDateParts = endDateStr.split('/');

          const startDate = new Date(
            `${startDateParts[2]}-${startDateParts[0]}-${startDateParts[1]}`
          );
          const endDate = new Date(`${endDateParts[2]}-${endDateParts[0]}-${endDateParts[1]}`);

          const agendaAppointments = visibleAppointments.filter(appointment => {
            const appointmentDate = new Date(appointment.start);
            return appointmentDate >= startDate && appointmentDate <= endDate;
          });

          if (JSON.stringify(agendaAppointments) !== JSON.stringify(localVisibleAppointments)) {
            setLocalVisibleAppointments(agendaAppointments);
          }

          break;
        }
        default:
          break;
      }
    }, [visibleAppointments, currentView, label]);

    useEffect(() => {
      if (isSearchingAppointments) {
        dispatch(showSystemLoader());
      } else {
        dispatch(hideSystemLoader());
      }
    }, [isSearchingAppointments]);

    return (
      <div style={{ marginInline: '15px' }} className="rbc-toolbar">
        <span className="rbc-btn-group">
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '16px' }}>
            <div className="calender-icon-schedule">
              <CalenderSimpleIcon style={{ fontSize: '17px' }} />
            </div>

            <strong
              style={{
                fontSize: '19px',
                marginInline: '8px',
                color: mode === 'light' ? '#2D3B4C' : 'var(--white)'
              }}
            >
              {localVisibleAppointments.length}
            </strong>
            <span style={{ fontSize: '14px', color: '#969FB0' }}>{totalAppointmentsText}</span>
          </div>
        </span>

        <div className="rbc-toolbar-label">
          <button
            style={{
              fontSize: '14px',
              margin: '7px',
              height: '35px',
              color: mode === 'light' ? 'black' : 'var(--white)'
            }}
            onClick={() => onNavigate('TODAY')}
            className="btn-scheduling"
          >
            Today
          </button>

          <button
            className="btn-scheduling"
            style={{
              margin: '7px',
              height: '35px',
              color: mode === 'light' ? 'black' : 'var(--white)'
            }}
            onClick={() => onNavigate('PREV')}
          >
            <ArrowLeftLineIcon />
          </button>
          <Button
            className="btn-scheduling"
            onClick={handleClickCalinderSearch}
            style={{
              display: showDatePicker ? 'none' : 'inline-block',
              border: 'none',
              height: '35px',
              color: mode === 'light' ? 'black' : 'var(--white)'
            }}
          >
            <strong>{label}</strong>
          </Button>

          {showDatePicker && (
            <DatePicker
              ref={datePickerRef}
              onChange={date => {
                if (date) {
                  setCalendarDate(date);
                  setCurrentCalView('day');
                }
              }}
              placement="bottomStart"
              defaultOpen
              format={currentView === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd'}
              onClose={() => {
                setShowDatePicker(false);
              }}
            />
          )}
          <button
            className="btn-scheduling"
            style={{
              margin: '7px',
              height: '35px',
              color: mode === 'light' ? 'black' : 'var(--white)'
            }}
            onClick={() => onNavigate('NEXT')}
          >
            <ArrowRightLineIcon />
          </button>
        </div>
      </div>
    );
  };

  const getTooltipContent = event => {
    if (currentView === 'month') {
      return `${event.title} - ${event.fromTo}`;
    } else {
      return `${event.title}`;
    }
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
  const minTime = new Date();
  minTime.setHours(8, 0, 0);

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
      if (s.includes('BOOK')) return '#059669';
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

    if (status === 'NEW') {
      const startLabel =
        event?.start instanceof Date && !Number.isNaN(event.start.getTime())
          ? event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '--:--';
      const endLabel =
        event?.end instanceof Date && !Number.isNaN(event.end.getTime())
          ? event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '--:--';
      const resourceTypeKey = normalizeResourceTypeKey(
        appointment?.resourceTypeLkey ??
          appointment?.resourceType ??
          appointment?.resource_type ??
          appointment?.templateType ??
          appointment?.template_type
      );
      const idsToTry = [
        appointment?.resourceKey,
        appointment?.resource_key,
        appointment?.resourceId,
        appointment?.resource_id,
        appointment?.departmentId,
        appointment?.department_id,
        appointment?.practitionerId,
        appointment?.practitioner_id,
        appointment?.catalogId,
        appointment?.catalog_id,
        appointment?.diagnosticTestId,
        appointment?.diagnostic_test_id,
        appointment?.serviceId,
        appointment?.service_id,
        appointment?.resource?.key,
        event?.filterResourceId
      ]
        .filter((v: any) => v !== null && typeof v !== 'undefined')
        .map((v: any) => String(v));

      const byTypeMap =
        (resourceNameByTypeAndId as any)[resourceTypeKey] ??
        (resourceTypeKey === 'DIAGNOSTIC TEST'
          ? (resourceNameByTypeAndId as any).DIAGNOSTIC_TEST
          : undefined);
      const resourceNameFromTypeMap =
        byTypeMap instanceof Map ? idsToTry.map((id: string) => byTypeMap.get(id)).find(Boolean) : '';
      const resourceNameFromServiceMap = idsToTry.map((id: string) => resourceNameById.get(id)).find(Boolean);
      const resourceNameFromAvailability =
        (resourcesWithAvailabilityResponse?.object ?? [])
          .find((r: any) => idsToTry.includes(String(r?.key)))
          ?.resourceName ?? '';

      const resourceText =
        resourceNameFromTypeMap ||
        resourceNameFromServiceMap ||
        resourceNameFromAvailability ||
        appointment?.resourceName ||
        appointment?.resource_name ||
        event?.resource?.resourceName ||
        'Unknown Resource';
      return (
         <div className="available-slot-card">
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
    if (normalize(status) === 'new') {
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

    const currentResource = resourcesWithAvailabilityResponse?.object.find(r => r.key === resourceId);

    if (currentResource && currentResource.availability) {
      const jsDay = date.getDay();
      const apiDay = jsDay;
      const currentMinutes = date.getHours() * 60 + date.getMinutes();
      const isAvailable =
        currentResource?.availability?.some(period => {
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
    } catch (e) {}
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
        {/* Top section: appointment search filters */}
        <div
          className={`appointments-filters-wrap ${filtersCollapsed ? 'collapsed' : ''}`}
          style={{ width: '100%', paddingInline: 8, paddingTop: 8 }}
        >
          <SectionContainer
            title={'Filters'}
            action={
              <button
                type="button"
                className="appointments-filters-collapse-btn"
                onClick={() => setFiltersCollapsed(prev => !prev)}
                aria-label={filtersCollapsed ? 'Expand filters' : 'Collapse filters'}
                title={filtersCollapsed ? 'Expand filters' : 'Collapse filters'}
              >
                {filtersCollapsed ? '▾' : '▴'}
              </button>
            }
            content={
              !filtersCollapsed && (
              <Form fluid layout="inline">
                <div className="appointments-filter-row" style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', width: '100%' }}>
                  {/* Facility is preselected from logged-in tenant and shown as read-only */}
                  <MyInput
                    disabled
                    height={35}
                    width={'11.5vw'}
                    column
                    fieldLabel="Facility"
                    selectData={activeFacilitiesResponse ?? []}
                    fieldType="select"
                    selectDataLabel="name"
                    selectDataValue="id"
                    fieldName="id"
                    record={selectedFacility}
                    setRecord={setSelectedFacility}
                    searchable={false}
                  />

                  {/* Department filter narrows schedule results by department */}
                  <MyInput
                    height={35}
                    width={'11.5vw'}
                    column
                    fieldLabel="Department"
                    selectData={departmentOptions ?? []}
                    fieldType="select"
                    selectDataLabel="name"
                    selectDataValue="id"
                    fieldName="departmentId"
                    record={selectedDepartment}
                    setRecord={setSelectedDepartment}
                    searchable
                  />

                  {/* Resource type controls which resources are available in picker below */}
                  <MyInput
                    height={35}
                    width={'11.5vw'}
                    column
                    fieldLabel="Resource Type"
                    fieldType="select"
                    fieldName="value"
                    selectData={TemplateTypeEnum ?? []}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={selectedResourceTypeValue}
                    setRecord={setSelectedResourceTypeValue}
                    searchable={false}
                  />

                  {/* Multi-select resources; enabled only after selecting a resource type */}
                  <MyInput
                    height={35}
                    width={'11.5vw'}
                    column
                    fieldLabel="Resource"
                    selectData={filteredResourcesList ?? []}
                    fieldType="multyPicker"
                    selectDataLabel="resourceName"
                    selectDataValue="key"
                    fieldName="resourceKey"
                    record={selectedResources}
                    setRecord={setSelectedResources}
                    disabled={!selectedResourceTypeValue?.value}
                  />

                  {/* Appointment status filter */}
                  <MyInput
                    height={35}
                    width={'11.5vw'}
                    column
                    fieldLabel="Status"
                    fieldType="select"
                    fieldName="status"
                    selectData={AppointmentStatusEnum ?? []}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={selectedAppointmentStatus}
                    setRecord={setSelectedAppointmentStatus}
                  />

                  {/* Booking mode filter */}
                  <MyInput
                    height={35}
                    width={'11.5vw'}
                    column
                    fieldLabel="Booking Mode"
                    fieldType="select"
                    fieldName="bookingMode"
                    selectData={BookingModeEnum ?? []}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={selectedBookingMode}
                    setRecord={setSelectedBookingMode}
                  />
                </div>
              </Form>
              )
            }
          />

       
        </div>

        {/* =================== Right Side ============= */}
        <Panel
          bordered
          className="right-section appointments-main-card"
          style={{ display: 'flex', flexDirection: 'column', minHeight: 620 }}
        >
          <div className="appointments-slot-summary-bar">
            <div className="appointments-slot-summary-scope">
              <span className="appointments-slot-summary-scope-date">{slotSummaryBarStats.rangeLabel}</span>
              <span className="appointments-slot-summary-scope-meta">
                {selectedDepartment?.departmentId
                  ? (departmentOptions as any[])?.find(
                      (d: any) => String(d?.id) === String(selectedDepartment.departmentId)
                    )?.name ?? `Dept #${selectedDepartment.departmentId}`
                  : 'All departments'}
                {selectedResourceKeysForFilter && selectedResources?.resourceKey?.length
                  ? ` · ${selectedResources.resourceKey.length} resource(s)`
                  : selectedResourceTypeValue?.value
                    ? ` · ${String(selectedResourceTypeValue.value)}`
                    : ''}
              </span>
            </div>
            <div className="appointments-slot-summary-metrics appointments-slot-summary-metrics--single-row">
              <div className="appointments-slot-summary-item appointments-slot-summary-item--shrink0">
                <span className="appointments-slot-summary-icon appointments-slot-summary-icon--total">
                  <FontAwesomeIcon icon={faClock} />
                </span>
                <span className="appointments-slot-summary-text">
                  <strong>{slotSummaryBarStats.total}</strong> Slots
                </span>
              </div>
              {slotSummaryBarStats.legendRow.map(row => (
                <React.Fragment key={row.label}>
                  <div className="appointments-slot-summary-divider" />
                  <div className="appointments-slot-summary-item appointments-slot-summary-item--shrink0">
                    <span
                      className="appointments-slot-summary-icon"
                      style={{ backgroundColor: row.summaryIconBg }}
                    >
                      <FontAwesomeIcon icon={row.icon} />
                    </span>
                    <span className="appointments-slot-summary-text">
                      <strong>{row.count}</strong> {row.label}
                    </span>
                  </div>
                </React.Fragment>
              ))}
              {slotSummaryBarStats.otherCount > 0 ? (
                <>
                  <div className="appointments-slot-summary-divider" />
                  <div className="appointments-slot-summary-item appointments-slot-summary-item--shrink0">
                    <span className="appointments-slot-summary-text appointments-slot-summary-muted">
                      <strong>{slotSummaryBarStats.otherCount}</strong> Other
                    </span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
          <div className="appointments-content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12, flex: 1 }}>
            <div
              className="appointments-calendar-pane"
              style={{ minHeight: 0, height: '100%', overflowX: 'auto', overflowY: 'hidden' }}
            >
              <BigCalendar
                key={calendarKey}
                toolbar={false}
                date={currentCalendarDate}
                onNavigate={date => {
                  setCalendarDate(date);
                  setCurrentCalendarDate(date);
                  setRightPanelDate(date);
                }}
                className={`my-calendar ${currentView}`}
                style={{
                  height: currentView === 'day' || currentView === 'week' ? 'max-content' : '100%',
                  minWidth:
                    currentView === 'day' || currentView === 'week'
                      ? `${Math.max((visibleResources?.length || 1) * 300, 900)}px`
                      : '100%'
                }}
                min={minTime}
                {...(currentView === 'day' && {
                  resources: visibleResources ?? [],
                  resourceIdAccessor: 'key',
                  resourceTitleAccessor: 'resourceName'
                })}
                formats={formats}
                localizer={localizer}
                events={finalAppointments ?? []}
                step={60}
                timeslots={1}
                onSelectSlot={slotInfo => {
              if (moment(slotInfo.start).startOf('day').isBefore(moment().startOf('day'))) {
                dispatch(
                  notify({
                    msg: 'Previous days: available slots cannot be booked.',
                    sev: 'warning'
                  })
                );
                return;
              }
              if (slotInfo.resourceId) {
                const currentResource = resourcesWithAvailabilityResponse?.object.find(
                  r => r.key === slotInfo.resourceId
                );

                if (currentResource && currentResource.availability) {
                  const jsDay = slotInfo.start.getDay();
                  const apiDay = jsDay;
                  const currentMinutes = slotInfo.start.getHours() * 60 + slotInfo.start.getMinutes();

                  const isAvailable =
                    currentResource?.availability?.some(period => {
                      const startMinutes = period.startHour * 60 + (period.startMinute || 0);
                      const endMinutes = period.endHour * 60 + (period.endMinute || 0);

                      return (
                        period.dayOfWeek === apiDay &&
                        currentMinutes >= startMinutes &&
                        currentMinutes < endMinutes
                      );
                    }) || false;

                  if (!isAvailable) {
                    return;
                  }

                  const enhancedSlotInfo = {
                    ...slotInfo,
                    resourceKey: currentResource.resourceKey,
                    resourceTypeLkey: currentResource.resourceTypeLkey,
                    resourceName: currentResource.resourceName,
                    facilityKey: currentResource.facilityKey
                  };
                  setSelectedSlot(enhancedSlotInfo);
                  setModalOpen(true);
                  return;
                }
              }
              // Ignore clicks on empty/non-available areas.
              return;
                }}
                startAccessor="start"
                endAccessor="end"
                views={['month', 'week', 'day', 'agenda']}
                defaultView={currentView}
                selectable={true}
                onSelectEvent={event => {
                  handleSelectEvent(event);
                }}
                tooltipAccessor={event => getTooltipContent(event)}
                onView={view => setCurrentView(view)}
                eventPropGetter={eventPropGetter}
                components={{
                  resourceHeader: ResourceHeader,
                  event: MyEvent
                }}
                slotPropGetter={currentView == 'day' ? slotPropGetter : null}
              />
            </div>

            <div
              className="appointments-right-pane"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                height: '100%',
                minHeight: 0
              }}
            >
              <Panel bordered className="appointments-mini-panel" style={{ padding: 10, borderRadius: 12, flex: '0 0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  <ButtonGroup
                    style={{ borderRadius: '5px', backgroundColor: 'var(--rs-border-primary)' }}
                    size="xs"
                  >
                    <Button
                      className="btn-scheduling"
                      style={{ border: 'none', height: '30px' }}
                      appearance={currentView === Views.WEEK ? 'primary' : 'subtle'}
                      onClick={() => setCurrentView(Views.WEEK)}
                    >
                      <Text>Week</Text>
                    </Button>
                    <Button
                      className="btn-scheduling"
                      style={{ border: 'none', height: '30px' }}
                      appearance={currentView === Views.DAY ? 'primary' : 'subtle'}
                      onClick={() => setCurrentView(Views.DAY)}
                    >
                      <Text>Day</Text>
                    </Button>
                    <Button
                      className="btn-scheduling"
                      style={{ border: 'none', height: '30px' }}
                      appearance={currentView === Views.MONTH ? 'primary' : 'subtle'}
                      onClick={() => setCurrentView(Views.MONTH)}
                    >
                      <Text>Month</Text>
                    </Button>
                    <Button
                      className="btn-scheduling"
                      style={{ border: 'none', height: '30px' }}
                      appearance={currentView === Views.AGENDA ? 'primary' : 'subtle'}
                      onClick={() => setCurrentView(Views.AGENDA)}
                    >
                      <Text>Agenda</Text>
                    </Button>
                  </ButtonGroup>
                </div>
                <RsCalendar
                  value={rightPanelDate}
                  onChange={(d: Date | null) => {
                    if (d) {
                      setRightPanelDate(d);
                      setCurrentCalendarDate(d);
                      setCalendarDate(d);
                    }
                  }}
                  compact
                  style={{ width: '100%', height: 220, fontSize: 12 }}
                />
              </Panel>

              <TodayAppointmentsList
                selectedDate={rightPanelDate ?? currentCalendarDate}
                todayAppointmentsList={todayAppointmentsList}
                isFetchingTodayAppointments={isFetchingTodayAppointments}
                rightPanelAppointmentRows={rightPanelAppointmentRows}
                todayTimelineRows={todayTimelineRows}
                onViewAppointment={handleViewAppointment}
              />
            </div>
          </div>

          <Stack className="appointments-legend" style={{ margin: '0.4%' }}>
            {legendItems.map(({ label, color }) => (
              <Stack style={{ marginRight: '36px' }} spacing={6} alignItems="center" key={label}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 12,
                    backgroundColor: color
                  }}
                />
                <span style={{ fontSize: '12px' }}>{label}</span>
              </Stack>
            ))}
          </Stack>
        </Panel>
      </div>

      <AppointmentModal
        from={'Schedule'}
        isOpen={modalOpen && !followUpModalOpen}
        onClose={() => {
          setModalOpen(false);
          setShowAppointmentOnly(false);
          setViewAppointmentData(null);
          setSelectedEvent(null);
          setSelectedSlot(null);
        }}
        appointmentData={viewAppointmentData || selectedEvent?.appointmentData}
        resourceType={selectedResourceType}
        facility={selectedFacility}
        onSave={handleSearchAppointmentsByCriteria}
        showOnly={showAppointmentOnly}
        selectedSlot={showAppointmentOnly ? null : selectedSlot}
        onSwitchToFollowUp={(draft: any) => {
          setFollowUpDraftData({ ...(draft?.appointment ?? {}), patient: draft?.patient });
          setModalOpen(false);
          setFollowUpModalOpen(true);
        }}
      />
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
            if (bookPatientReadOnly) {
              setViewAppointmentData(null);
              setSelectedEvent(null);
              setAppointment(null as any);
            }
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
        editAppointment={() => handleChangeAppointment()}
        onStatusChange={handleSearchAppointmentsByCriteria}
        isActionsModalOpen={ActionsModalOpen}
        onActionsModalClose={() => {
          if (!isOpeningViewModalRef.current) {
            setSelectedEvent(null);
            setAppointment(null);
          }
          setActionsModalOpen(false);
        }}
        appointment={selectedEvent}
      />

      <Drawer placement={'left'} open={false} onClose={() => setDrowerOpen(false)}>
        <Drawer.Header>
          <Drawer.Title></Drawer.Title>
          <Drawer.Actions>
            <Button onClick={() => setDrowerOpen(false)}>Cancel</Button>
            <Button onClick={() => setDrowerOpen(false)} appearance="primary">
              Confirm
            </Button>
          </Drawer.Actions>
        </Drawer.Header>
        <Drawer.Body>
          <DatePicker
            format="yyyy-MM"
            placeholder="Select Month and Year"
            cleanable
            placement="autoVerticalStart"
            style={{ width: 500 }}
          />
        </Drawer.Body>
      </Drawer>

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

      <Modal open={confirmNewSlotOpen} onClose={handleConfirmNewSlotCancel} size="sm">
        <Modal.Header>Available appointment</Modal.Header>
        <Modal.Body>
          <Text size="sm" style={{ color: 'var(--rs-text-secondary)' }}>
            {isRequestPendingApproval(requestToApprove)
              ? 'Approve the pending appointment request for this slot and open the appointment editor?'
              : 'Open the appointment editor to complete booking for this slot?'}
          </Text>
        </Modal.Body>
        <Modal.Footer>
          <Button appearance="subtle" onClick={handleConfirmNewSlotCancel} disabled={newSlotConfirmBusy}>
            Cancel
          </Button>
          <Button appearance="primary" loading={newSlotConfirmBusy} onClick={() => void handleConfirmNewSlotOk()}>
            Continue
          </Button>
        </Modal.Footer>
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
          setModalOpen(false);
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