import React, { useEffect, useRef, useState, useMemo } from 'react';
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
import { faPaperPlane, faPlus, faPrint } from '@fortawesome/free-solid-svg-icons';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import AppointmentActionsModal from './AppointmentActionsModal';
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
import ViewAppointmentRequests from './ViewAppointmentRequests';
import { useEnumOptions } from '@/services/enumsApi';
import { calculateAgeFormat } from '@/utils';
import { update } from 'lodash';
import TodayAppointmentsList from './components/TodayAppointmentsList';
import BookPatient from './components/BookPatient';

const ScheduleScreen = () => {
  const localizer = momentLocalizer(moment);
  const mode = useSelector((state: any) => state.ui.mode);
  const [validationResult] = useState({});
  const [recordSearchAppointment, setRecordSearchAppointment] = useState({ value: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [bookPatientModalOpen, setBookPatientModalOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [followUpDraftData, setFollowUpDraftData] = useState<any>(null);
  const [ActionsModalOpen, setActionsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewAppointmentData, setViewAppointmentData] = useState(null);
  const isOpeningViewModalRef = useRef(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [appRequestModalOpen, setAppRequestModalOpen] = useState(false);
  const FOLLOW_UP_VISIT_TYPE_LKEY = 'FOLLOW_UP';

  const [saveAppointment] = useSaveAppointmentMutation();
  const [searchAppointments, { data: searchedAppointmentsResponse, isFetching: isSearchingAppointments }] =
    useLazySearchAppointmentsQuery();
  const [
    getAppointmentsByStatusBetweenDates,
    { data: todayAppointmentsResponse, isFetching: isFetchingTodayAppointments }
  ] = useLazyGetAppointmentsByStatusBetweenDatesQuery();

  const [requestApproveModalOpen, setRequestApproveModalOpen] = useState(false);
  const [requestToApprove, setRequestToApprove] = useState<any>(null);

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
  const [reasonViewRecord, setReasonViewRecord] = useState({
    reason: '',
    otherReason: ''
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
        const patientFullName =
          appointment?.patient?.full_name ||
          appointment?.patient?.fullName ||
          (appointment?.patient?.first_name && appointment?.patient?.last_name
            ? `${appointment.patient.first_name} ${appointment.patient.last_name}`.trim()
            : appointment?.patient?.first_name ||
              appointment?.patient?.last_name ||
              appointment?.reason ||
              'Appointment');

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

        const statusText = appointment?.appointmentStatus ?? appointment?.status ?? '';
        const isHidden = String(statusText).toUpperCase() === 'CANCELED';
        return {
          id: appointment?.key ?? appointment?.id,
          title: ` ${patientFullName}, ${
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
    currentView
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

  useEffect(() => {
    setFilteredResourcesList(resourceOptions as any);
  }, [resourceOptions]);

  useEffect(() => {
    setSelectedResources({ resourceKey: [] });
  }, [selectedResourceTypeValue?.value, selectedFacility?.id, selectedDepartment?.departmentId]);

  useEffect(() => {
    if (selectedSlot) {
      setSelectedStartDate(selectedSlot?.slots[0]);
    }
  }, [selectedSlot]);

  const { data: noShowResonLovQueryResponse } = useGetLovValuesByCodeQuery('APP_NOSHOW_REASON');

  const { data: cancelResonLovQueryResponse } = useGetLovValuesByCodeQuery('APP_CANCEL_REASON');

  const handleSelectEvent = event => {
    const freshEvent = finalAppointments?.find(e => e.id === event.id) || event;

    setSelectedEvent(freshEvent);

    const status = String(
      freshEvent?.appointmentData?.appointmentStatus ?? freshEvent?.appointmentData?.status ?? ''
    ).toUpperCase();

    if (status === 'CANCELED' || status === 'NO_SHOW' || status === 'NO-SHOW') {
      const reasonKey = freshEvent?.appointmentData?.reasonLkey;

      const reasonLovList =
        status === 'CANCELED'
          ? cancelResonLovQueryResponse?.object
          : noShowResonLovQueryResponse?.object;

      const matchedReason = reasonLovList?.find(r => r.key === reasonKey);

      setReasonViewRecord({
        reason: matchedReason?.lovDisplayVale || '',
        otherReason: freshEvent?.appointmentData?.otherReason || ''
      });

      setShowReasonModal(true);
      return;
    }

    // NEW slots are not booked yet; click should go straight to booking modal.
    if (status === 'NEW') {
      setViewAppointmentData(freshEvent?.appointmentData ?? null);
      setShowAppointmentOnly(false);
      setActionsModalOpen(false);
      setBookPatientModalOpen(true);
      return;
    }

    setActionsModalOpen(true);
  };

  const convertDate = appointmentTime => {
    return new Date(appointmentTime);
  };

  const [appointment, setAppointment] = useState<ApAppointment>({ ...newApAppointment });
  const [drowerOpen, setDrowerOpen] = useState(false);
  const dispatch = useAppDispatch();

  const handleSearchAppointmentsByCriteria = async () => {
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
  };

  useEffect(() => {
    if (!selectedFacility?.id) return;
    void handleSearchAppointmentsByCriteria();
  }, [selectedFacility?.id]);

  useEffect(() => {
    const rows = (searchedAppointmentsResponse as any)?.data ?? [];
    // Debug: print search API appointment list in devtools.
    console.log('[ScheduleScreen] searchAppointments rows:', rows);
  }, [searchedAppointmentsResponse]);

  useEffect(() => {
    const day = rightPanelDate ?? currentCalendarDate ?? new Date();
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);
    const status = String(selectedAppointmentStatus?.status ?? 'CONFIRMED');

    void getAppointmentsByStatusBetweenDates({
      status,
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

  const legendItems = [
    { label: 'No-Show', color: '#FDE68A' },
    { label: 'Checked In', color: '#FDBA74' },
    { label: 'New', color: '#fafafeff', borderColor: '#007bff' },
    { label: 'Confirmed', color: '#166534' },
    { label: 'Completed', color: '#93C5FD' }
  ];

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

  // Filter appointments based on selected resources
  const filteredAppointments = useMemo(() => {
    if (!selectedResourceKeysForFilter) {
      // No filters applied, show all appointments
      return appointmentsData;
    }

    // Filter appointments to only show those matching selected resource filter
    let list = appointmentsData.filter(event =>
      selectedResourceKeysForFilter.has(String((event as any).filterResourceId ?? event.resourceId))
    );

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
    selectedResourceType,
    selectedResources,
    selectedResourceKeysForFilter,
    selectedAppointmentStatus?.status,
    selectedBookingMode?.bookingMode
  ]);

  const visibleAppointments =
    currentView === 'agenda' || showCanceled
      ? filteredAppointments
      : filteredAppointments.filter(event => !event.hidden);

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
      const eventToSet = selectedEvent
        ? { ...selectedEvent, appointmentData: dataToView }
        : { appointmentData: dataToView };
      setSelectedEvent(eventToSet);
      setAppointment(dataToView);
      setShowAppointmentOnly(true);
      setActionsModalOpen(false);
      setTimeout(() => {
        if (isFollowUpAppointment(dataToView)) {
          setFollowUpDraftData(dataToView);
          setFollowUpModalOpen(true);
          setModalOpen(false);
        } else {
          setModalOpen(true);
        }
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
      const patientName =
        patient?.full_name ||
        patient?.fullName ||
        [patient?.first_name, patient?.last_name].filter(Boolean).join(' ') ||
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
  }, [todayAppointmentsResponse, finalAppointments, rightPanelDate, currentCalendarDate]);


  const todayTimelineRows = useMemo(() => {
    const statusColor = (status: string) => {
      const s = String(status ?? '').toUpperCase();
      if (s.includes('CONFIRM')) return '#166534';
      if (s.includes('COMPLETE')) return '#6DA7E8';
      if (s.includes('NEW')) return '#4B7BEC';
      if (s.includes('CHECK')) return '#F5B971';
      if (s.includes('NO_SHOW') || s.includes('NO-SHOW')) return '#E8CF5A';
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
      if (s.includes('CONFIRM')) return '#166534';
      if (s.includes('COMPLETE')) return '#6DA7E8';
      if (s.includes('NEW')) return '#4B7BEC';
      if (s.includes('CHECK')) return '#F5B971';
      if (s.includes('NO_SHOW') || s.includes('NO-SHOW')) return '#E8CF5A';
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
      const modeText =
        event?.appointmentData?.bookingModeLvalue?.lovDisplayVale ||
        event?.appointmentData?.bookingMode ||
        event?.appointmentData?.visitTypeLvalue?.lovDisplayVale ||
        'Walk-in';
      const templateText =
        event?.appointmentData?.templateName || event?.appointmentData?.resourceName || 'Lab Template';
      return (
         <div className="available-slot-card">
           <div className="available-slot-title">Available Slot</div>
           <div className="available-slot-status-row">
             <span className="available-slot-dot" />
             <span>
               {modeText} <span className="available-slot-separator">•</span> {templateText}
             </span>
           </div>
           <div className="available-slot-time">{startLabel} - {endLabel}</div>
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
          <p style={{ fontSize: '12px', color: 'black' }}>{event.title}</p>
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

    const getBackgroundColor = status => {
      const item = legendItems.find(i => normalize(i.label) === normalize(status));
      return item ? hexToRgba(item.color, 0.15) : '#ffffffff';
    };

    const getBorderColor = status => {
      const item = legendItems.find(i => normalize(i.label) === normalize(status));
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
    const list = searchedAppointmentsResponse?.data ?? [];
    const resourcesList = resourcesWithAvailabilityResponse?.object ?? [];

    return list
      .filter((a: any) => String(a?.visitTypeLkey) === String(FOLLOW_UP_VISIT_TYPE_LKEY))
      .filter((a: any) => !a?.appointmentStart)
      .map((a: any) => {
        const patient = a?.patient || {};

        const patientName =
          patient?.full_name ||
          patient?.fullName ||
          (patient?.first_name && patient?.last_name
            ? `${patient.first_name} ${patient.last_name}`.trim()
            : patient?.first_name || patient?.last_name || 'Unknown');

        const patientGender = patient?.genderLvalue?.lovDisplayVale || patient?.genderLkey || '';
        const patientAge = patient?.dob ? calculateAgeFormat(patient.dob) : '';

        const patientMrn = patient?.patient_mrn || '';

        const resourceKey = a?.resourceKey ?? a?.resource_key ?? a?.resource?.key ?? null;

        const resource =
          resourceKey != null
            ? resourcesList.find((r: any) => String(r.key) === String(resourceKey))
            : null;

        const resourceNameFromService = resourceKey != null ? resourceNameById.get(String(resourceKey)) : '';
        const resourceName =
          (resourceNameFromService && String(resourceNameFromService).trim()) ||
          resource?.resourceName ||
          resource?.name ||
          a?.resourceName ||
          a?.resource_name ||
          '-';

        const resourceType =
          resource?.resource_type ||
          resource?.resourceType ||
          a?.resourceType ||
          a?.resource_type ||
          a?.resourceTypeLkey ||
          a?.resource_type_key ||
          '-';

        return {
          id: a.key,

          patientName,
          mrn: patientMrn,

          ageText: patientAge,
          genderText: patientGender,

          facilityKey: a?.facilityKey ?? a?.facility_key ?? a?.facilityId ?? a?.facility_id ?? '',

          createdBy: a?.createdBy ?? a?.created_by ?? '',
          createdAt: a?.createdAt ?? a?.created_at ?? null,

          status: a?.appointmentStatus ?? 'Pending',

          resourceName,
          resourceType,
          resourceKey: resourceKey ?? '',
          updatedBy: a?.updatedBy ?? a?.updated_by ?? '',
          updatedAt: a?.updatedAt ?? a?.updated_at ?? null,

          otherReason: a?.otherReason ?? '',

          _raw: a
        };
      });
  }, [searchedAppointmentsResponse, resourcesWithAvailabilityResponse?.object, resourceNameById]);

  const handleApproveRequest = (row: any) => {
    setRequestToApprove(row?._raw);
    setRequestApproveModalOpen(true);
  };

  const handleRejectRequest = async (row: any, rejectReason: string) => {
    try {
      const raw = row?._raw;
      if (!raw?.key) return;

      await saveAppointment({
        ...raw,
        appointmentStatus: 'Rejected',
        otherReason: rejectReason,
        reasonValue: rejectReason,
        appointmentStart: null,
        appointmentEnd: null,
        updatedBy: authSlice.user.username
      }).unwrap();

      await handleSearchAppointmentsByCriteria();
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
          <div className="appointments-content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12, flex: 1 }}>
            <div className="appointments-calendar-pane" style={{ minHeight: 0, height: '100%' }}>
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
                style={{ height: currentView === 'day' || currentView === 'week' ? 'max-content' : '100%' }}
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
                todayAppointmentsList={todayAppointmentsList}
                isFetchingTodayAppointments={isFetchingTodayAppointments}
                rightPanelAppointmentRows={rightPanelAppointmentRows}
                todayTimelineRows={todayTimelineRows}
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
      <AppointmentModal
        from={'Schedule'}
        isOpen={requestApproveModalOpen}
        onClose={() => {
          setRequestApproveModalOpen(false);
          setRequestToApprove(null);
        }}
        appointmentData={requestToApprove}
        resourceType={selectedResourceType}
        facility={selectedFacility}
        onSave={async () => {
          await handleSearchAppointmentsByCriteria();
          setRequestApproveModalOpen(false);
          setRequestToApprove(null);
          setAppRequestModalOpen(false);
        }}
        showOnly={false}
        selectedSlot={null}
        forceStatus="Confirmed"
      />
      <BookPatient
        open={bookPatientModalOpen}
        setOpen={setBookPatientModalOpen}
        appointmentData={selectedEvent?.appointmentData}
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

      <Modal open={showReasonModal} onClose={() => setShowReasonModal(false)}>
        <Modal.Header />
        <Modal.Body>
          <Form fluid layout="vertical">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 520, maxWidth: '100%' }}>
              <MyInput
                width="100%"
                column
                fieldLabel="Reason"
                fieldName="reason"
                record={reasonViewRecord}
                setRecord={setReasonViewRecord}
                disabled
              />
              <MyInput
                width="100%"
                column
                fieldLabel="Other Reason"
                fieldName="otherReason"
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
    </div>
  );
};

export default ScheduleScreen;