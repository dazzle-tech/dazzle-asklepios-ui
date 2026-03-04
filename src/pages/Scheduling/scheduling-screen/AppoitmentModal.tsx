import AdvancedModal from '@/components/AdvancedModal';
import AttachmentModal from '@/components/AttachmentUploadModal/AttachmentUploadModal';
import MyButton from '@/components/MyButton/MyButton';
import MyCard from '@/components/MyCard';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import QuickPatient from '@/pages/patient/facility-patient-list/QuickPatient';
import {
  useGetResourcesAvailabilityQuery,
  useGetResourceWithDetailsQuery,
  useSaveAppointmentMutation
} from '@/services/appointmentService';
import { useGetAllResourcesQuery, useGetResourcesByTypeQuery, useGetResourceByIdQuery } from '@/services/setup/resource/ResourceService';
import { useFetchAttachmentQuery } from '@/services/attachmentService';
import {
  useGetPatientsByMedicalRecordNumberQuery,
  useGetPatientsByDocumentNumberQuery,
  useGetPatientsByFullNameQuery,
  useGetPatientsByArchivingNumberQuery,
  useGetPatientsByPrimaryPhoneQuery,
  useGetPatientsByDateOfBirthQuery
} from '@/services/patient/patientService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetAppointableDepartmentsQuery, useGetAppointableDepartmentByTypeQuery } from '@/services/security/departmentService';
import { useGetDocumentsByPatientQuery } from '@/services/patients/patientDocumentsService';
import { useLazyGetPreviousEncountersSameDepartmentQuery } from '@/services/encounters/patientEncounterService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { ApAppointment, ApAttachment, ApPatient } from '@/types/model-types';
import { newApAppointment, newApPatient } from '@/types/model-types-constructor';
import { conjureValueBasedOnKeyFromListOfValues, formatEnumString } from '@/utils';
import { DAYS, DayValue, mapJsDayToCustom } from '@/utils/dayMapping';
import { notify } from '@/utils/uiReducerActions';
import { faBan, faBolt, faListCheck, faUpload, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SearchIcon from '@rsuite/icons/Search';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Avatar,
  Button,
  DatePicker,
  Divider,
  Drawer,
  Form,
  IconButton,
  Input,
  InputGroup,
  Pagination,
  Panel,
  Placeholder,
  Table,
  Tag
} from 'rsuite';
import './AppoitmentModal.less';
import SliceBox from './SliceBox';
import SectionContainer from '@/components/SectionsoContainer';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import { useEnumOptions } from '@/services/enumsApi';
import PatientSearchBar from './PatientSearchBar';
import PatientCardWithPicture from '@/components/PatientCard/PatientCardWithPicture';
import { Box, Skeleton } from '@mui/material';
// TODO: we have to use css clases insted of inline styles for better maintainability and performance.

type AppointmentModalProps = {
  isOpen: any;
  onClose: any;
  resourceType: any;
  facility: any;
  onSave: any;
  appointmentData: any;
  showOnly: any;
  from: any;
  selectedSlot: any;
  forceStatus?: any;
  onSwitchToFollowUp?: any;
};

const AppointmentModal = ({
  isOpen,
  onClose,
  resourceType,
  facility,
  onSave,
  appointmentData,
  showOnly,
  from,
  selectedSlot,
  forceStatus,
  onSwitchToFollowUp
}: AppointmentModalProps) => {
  const mode = useSelector((state: any) => state.ui.mode);

  const [resourcesPaginationParams] = useState({
    page: 0,
    size: 100,
    sort: 'id,asc'
  } as { page: number; size: number; sort: string });

  // Use useGetAllResourcesQuery for all resources
  const { data: resourcesListResponse } = useGetAllResourcesQuery(resourcesPaginationParams);

  const [selectedSlices, setSelectedSlices] = useState([]);

  const patientSlice = useAppSelector(state => state.patient);
  const authSlice = useAppSelector(state => state.auth);

  // Get current logged-in facility from localStorage or auth slice
  const currentLoggedInFacility = useMemo(() => {
    // Try to get from auth slice first
    if (authSlice?.tenant?.selectedFacility) {
      return authSlice.tenant.selectedFacility;
    }
    
    // Fallback to localStorage
    try {
      const raw = localStorage.getItem('tenant');
      if (raw) {
        const tenant = JSON.parse(raw);
        if (tenant?.selectedFacility) {
          return tenant.selectedFacility;
        }
      }
    } catch (e) {
      console.error('Error parsing tenant from localStorage:', e);
    }
    
    return null;
  }, [authSlice?.tenant?.selectedFacility]);

  useEffect(() => {
    if (appointmentData) {
      // For department-based resources (CLINIC, etc.), ensure departmentKey is set from resourceKey if not present
      const isDepartmentBasedResource = ['CLINIC', 'INPATIENT_ADMISSION', 'DAY_CASE', 'EMERGENCY'].includes(appointmentData?.resourceTypeLkey);
      const departmentKey = isDepartmentBasedResource && !appointmentData?.departmentKey
        ? appointmentData?.resourceKey
        : appointmentData?.departmentKey;

      // Don't convert to string here - keep original type, will be normalized later
      setAppointment({
        ...appointmentData,
        departmentKey: departmentKey,
        createdBy: authSlice.user.username || '',
      });
      const patient = appointmentData?.patient || newApPatient;
      if (patient && (patient.key || patient.id)) {
        // Convert if it's in new format (has id but no key, or has new format fields)
        const convertedPatient = (patient.id && !patient.key) || patient.medicalRecordNumber 
          ? convertNewPatientToApPatient(patient)
          : patient;
        setLocalPatient(convertedPatient);
      } else {
        setLocalPatient(patient);
      }
    } else {
      // For new appointments, initialize with current logged-in facility
      const initialFacilityKey = currentLoggedInFacility?.id || currentLoggedInFacility?.facilityKey;
      setAppointment({
        ...newApAppointment,
        facilityKey: initialFacilityKey || null
      });
      setLocalPatient(newApPatient);
    }
  }, [appointmentData, currentLoggedInFacility]);

  useEffect(() => {
    // Don't override appointment data if we're viewing an existing appointment
    if (appointmentData && showOnly) {
      return;
    }

    if (selectedSlot?.resourceKey) {
      setAppointment(prev => ({
        ...prev,
        resourceKey: selectedSlot.resourceKey,
        resourceTypeLkey: selectedSlot.resourceTypeLkey,
        facilityKey: selectedSlot.facilityKey || facility?.id || facility?.facilityKey || null
      }));
    } else if (selectedSlot?.resourceId) {
      const resource = resourcesListResponse?.data?.find(r => r.key === selectedSlot.resourceId);
      if (resource) {
        setAppointment(prev => ({
          ...prev,
          resourceKey: resource.key,
          resourceTypeLkey: resource.resourceTypeLkey,
          facilityKey: facility?.id || facility?.facilityKey || null
        }));
      }
    } else if (!appointmentData) {
      // Only clear if we don't have appointmentData (i.e., creating new appointment)
      // Don't clear resourceTypeLkey - let the default useEffect set it to CLINIC
      // Only clear resourceKey and facilityKey, preserve resourceTypeLkey
      setAppointment(prev => ({
        ...prev,
        resourceKey: null,
        facilityKey: null
        // Don't touch resourceTypeLkey - let the default useEffect handle it
      }));
    }
  }, [selectedSlot, resourcesListResponse, facility, appointmentData, showOnly]);

  useEffect(() => {
    if (selectedSlot?.start) {
      const slotDate = new Date(selectedSlot.start);
      setSelectedDate(slotDate);

      const jsDay = slotDate.getDay();
      const customDay = mapJsDayToCustom(jsDay);
      setOpenDay(customDay);
    }
  }, [selectedSlot]);

  const minutesToDisplayDate = minutes => {
    if (minutes === null || typeof minutes === 'undefined') return null;
    const d = new Date(0);
    d.setHours(Math.floor(minutes / 60));
    d.setMinutes(minutes % 60);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
  };
  const [dailySlices, setDailySlices] = useState({});
  const sortedDaysWithSlices = Object.keys(dailySlices).sort((a, b) => parseInt(a) - parseInt(b));

  const loggedInUsername = useMemo(() => {
    const u = authSlice?.user;
    const fromUser =
      u?.login ?? u?.username ?? u?.userName ?? u?.name ?? u?.email ?? u?.id ?? u?.key ?? null;
    return fromUser ? String(fromUser) : null;
  }, [authSlice?.user]);

  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);

  const [quickPatientModalOpen, setQuickPatientModalOpen] = useState(false);
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
  const [appointment, setAppointment] = useState<ApAppointment>({ ...newApAppointment });

  const {
    data: resourceAvailabilityDetails,
    error,
    isLoading,
    isFetching
  } = useGetResourceWithDetailsQuery(
    selectedSlot?.resourceKey || selectedSlot?.resourceId || appointment?.resourceKey || '',
    {
      skip: !selectedSlot?.resourceKey && !selectedSlot?.resourceId && !appointment?.resourceKey
    }
  );

  // Fetch the selected resource to get its resourceKey (similar to PatientQuickAppointment)
  const { data: selectedResource } = useGetResourceByIdQuery(appointment?.resourceKey, {
    skip: !appointment?.resourceKey
  });

  const { data: resourcesByTypeResponse } = useGetResourcesByTypeQuery(
    {
      resourceType: appointment?.resourceTypeLkey,
      page: 0,
      size: 100
    },
    {
      skip: !appointment?.resourceTypeLkey
    }
  );
  const dispatch = useAppDispatch();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null); // To store selected event details
  const [validationResult, setValidationResult] = useState({});
  const [selectedCriterion, setSelectedCriterion] = useState<
    'patientMrn' | 'documentNo' | 'fullName' | 'archivingNumber' | 'phoneNumber' | 'dob' | null
  >('fullName');

  const [searchKeyword, setSearchKeyword] = useState('');
  const [patientSearchTarget, setPatientSearchTarget] = useState('primary'); // primary, relation, etc..
  const [patientSearchModalOpen, setPatientSearchModalOpen] = useState(false);
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [patientAge, setPatientAge] = useState({ patientAge: null });
  const [reRenderModal, setReRenderModal] = useState(true);
  const [instructionKey, setInstructionsKey] = useState<any>(null);
  const [instructionValue, setInstructionsValue] = useState<string[] | null>(null);
  const [instructions, setInstructions] = useState<string>('');
  const [availabilDays, setAvailabilDays] = useState<any[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [availableDatesInMonth, setAvailableDatesInMonth] = useState(null);
  const [selectedMonthDay, setSelectedMonthDay] = useState(null);
  const [selectedPeriods, setSelectedPeriods] = useState(null);
  const [availableTimes, setAvailableTimes] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [rowPeriods, setRowPeriods] = useState();
  const [filteredResourcesList, setFilteredResourcesList] = useState([]);
  const [filteredDates, setFilteredDates] = useState([]);
  const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);
  const [showMore, setShowMore] = useState(false);
  const prevFacilityKeyRef = useRef<string | null>(null);

  // Previous encounters for follow-up
  const [prevEncounterPage, setPrevEncounterPage] = useState(0);
  const prevEncounterSize = 15;
  const [allPrevEncounters, setAllPrevEncounters] = useState<any[]>([]);
  const [triggerPreviousEncounters, { data: prevEncountersList, isFetching: isPrevEncountersFetching }] =
    useLazyGetPreviousEncountersSameDepartmentQuery();

  const fetchPatientImageResponse = useFetchAttachmentQuery(
    {
      type: 'PATIENT_PROFILE_PICTURE',
      refKey: localPatient?.key
    },
    { skip: !localPatient?.key }
  );

  // Get patient ID (could be key or id from new service)
  const patientId = useMemo(() => {
    if (!localPatient) return undefined;
    if (localPatient.key) return localPatient.key;
    const patientAny = localPatient as any;
    return patientAny?.id ? String(patientAny.id) : undefined;
  }, [localPatient]);

  // Fetch patient documents
  const { data: patientDocumentsResponse, isLoading: isLoadingDocuments } = useGetDocumentsByPatientQuery(
    {
      patientId: patientId ? String(patientId) : '',
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
    { skip: !patientId }
  );


  // Extract primary document
  const primaryDocument = useMemo(() => {
    if (!patientDocumentsResponse?.data || !Array.isArray(patientDocumentsResponse.data)) {
      return null;
    }
    const primary = patientDocumentsResponse.data.find((doc: any) => doc.isPrimary === true);
    return primary || null;
  }, [patientDocumentsResponse]);


  useEffect(() => {
    if (fetchPatientImageResponse.isSuccess && fetchPatientImageResponse.data && fetchPatientImageResponse.data.key) {
      setPatientImage(fetchPatientImageResponse.data);
    } else {
      setPatientImage(undefined);
    }
  }, [fetchPatientImageResponse]);

  const { data: resourcesAvailability } = useGetResourcesAvailabilityQuery(
    {
      resource_key: appointment?.resourceKey || '',
      facility_id: appointment?.facilityKey || ''
    },
    {
      skip: !appointment?.resourceKey
    }
  );
  useEffect(() => {
    if (appointmentData?.appointmentStart) {
      const date = new Date(appointmentData?.appointmentStart);
      setSelectedDate(date);
      setSelectedYear(date.getFullYear());
      setSelectedMonth(date.getMonth());
      setSelectedMonthDay(date.getDate());
      setSelectedTime(date);

      // Set the day of week for the date picker
      const jsDay = date.getDay();
      const customDay = mapJsDayToCustom(jsDay);
      setOpenDay(customDay);
    }
  }, [appointmentData?.appointmentStart]);

  useEffect(() => {
    setRowPeriods(resourcesAvailability?.object);
  }, [resourcesAvailability?.object, appointment?.resourceKey]);
  useEffect(() => {
    if (!appointment?.resourceKey && !selectedSlot?.resourceKey && !selectedSlot?.resourceId) {
      setDailySlices({});
      return;
    }

    const hasSelectedFacility = Boolean(appointment?.facilityKey);

    // If no facility is selected, do not show/build availability times at all.
    // Availability must depend on selected facility.
    if (!hasSelectedFacility) {
      setDailySlices({});
      return;
    }

    // If a facility is selected, availability MUST depend on that facility.
    // So we only build slices from the facility-filtered endpoint (`resourcesAvailability`).
    const loadedSlices = {};

    const availability = resourcesAvailability?.object ?? [];
    availability.forEach((slice, originalIndex) => {
      const day = String(slice.dayLkey || slice.dayOfWeek);

      if (!['0', '1', '2', '3', '4', '5', '6'].includes(day)) {
        return;
      }

      if (!loadedSlices[day]) {
        loadedSlices[day] = [];
      }

      // startTime and endTime are already in minutes from midnight
      const startMinutes = slice.startTime || 0;
      const endMinutes = slice.endTime || 0;
      const fromDate = minutesToDisplayDate(startMinutes);
      const toDate = minutesToDisplayDate(endMinutes);

      loadedSlices[day].push({
        from: fromDate,
        to: toDate,
        isBreak: slice.isHasBreak || slice.isBreak || false,
        SliceKey: slice.key,
        originalIndex: originalIndex, // Preserve original order
        startMinutes: startMinutes // For sorting
      });
    });

    // Sort slices for each day by start time (maintaining order for same start time)
    Object.keys(loadedSlices).forEach(day => {
      loadedSlices[day].sort((a, b) => {
        // First sort by start time
        if (a.startMinutes !== b.startMinutes) {
          return a.startMinutes - b.startMinutes;
        }
        // If start times are equal, maintain original order
        return (a.originalIndex || 0) - (b.originalIndex || 0);
      });
    });

    setDailySlices(loadedSlices);
  }, [
    appointment?.facilityKey,
    appointment?.resourceKey,
    resourceAvailabilityDetails,
    resourcesAvailability,
    selectedSlot?.resourceKey,
    selectedSlot?.resourceId
  ]);

  useEffect(() => {
    filterWeekDays(rowPeriods);
  }, [rowPeriods]);

  const dayOptions = availablePeriods.map(item => ({
    label: item.day,
    value: item.day
  }));

  // Use resourcesByTypeResponse when resourceTypeLkey is selected, otherwise use all resources
  useEffect(() => {
    if (appointment?.resourceTypeLkey && resourcesByTypeResponse?.data) {
      // Use filtered resources from useGetResourcesByTypeQuery
      setFilteredResourcesList(resourcesByTypeResponse.data);
    } else if (!appointment?.resourceTypeLkey) {
      // Clear filtered list when no resource type is selected
      setFilteredResourcesList([]);
    }
  }, [resourcesByTypeResponse, appointment?.resourceTypeLkey]);

  // ──────────────────────────── RESOURCE NAME FROM RESOURCE TABLE ────────────────────────────
  // Use resourceName directly from resource table (no need to fetch from other APIs)
  const resourcesWithNames = useMemo(() => {
    // Use resourcesByTypeResponse when resourceTypeLkey is selected, otherwise use all resources
    const resources = appointment?.resourceTypeLkey ? resourcesByTypeResponse?.data ?? filteredResourcesList : resourcesListResponse?.data ?? [];

    return resources.map((resource: any) => ({
      ...resource,
      // Use resourceName from resource table, fallback to resourceKey if not available
      resourceName: resource.resourceName || resource.resourceKey || resource.key,
      // Ensure resourceKey is set correctly - use resourceKey if available, otherwise use key
      resourceKey: resource.resourceKey || resource.key,
      // Also set key for selectDataValue compatibility
      key: resource.resourceKey || resource.key
    }));
  }, [resourcesByTypeResponse?.data, filteredResourcesList, resourcesListResponse?.data, appointment?.resourceTypeLkey]);

  const { Column, HeaderCell, Cell } = Table;

  // Search parameters for new patient service
  const [searchParams, setSearchParams] = useState<{
    mrn?: string;
    documentNo?: string;
    fullName?: string;
    archivingNumber?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
  }>({});

  const { data: facilityListResponse, isLoading: isGettingFacilities, isFetching: isFetchingFacilities } = useGetAllFacilitiesQuery({});

  // Fetch departments for PRACTITIONER resource type
  const { data: departmentListResponse } = useGetAppointableDepartmentsQuery({
    facilityId: appointment?.facilityKey,
    page: 0,
    size: 1000,
    sort: 'id,asc'
  }, {
    skip: !appointment?.facilityKey
  });

  // Fetch departments for PROCEDURE resource type (DAY_CASE)
  const { data: dayCaseDepartmentListResponse } = useGetAppointableDepartmentByTypeQuery({
    type: 'DAY_CASE',
    facilityId: appointment?.facilityKey,
    page: 0,
    size: 1000,
    sort: 'id,asc'
  }, {
    skip: !appointment?.facilityKey
  });

  // Normalize facilityKey and departmentKey to string for proper matching
  const normalizedAppointment = useMemo(() => {
    if (!appointment) return appointment;

    // For department field, we need to match the department's id
    // Check if departmentKey exists in the department list and get the matching id
    let normalizedDepartmentKey = appointment.departmentKey;

    if (appointment.departmentKey !== null && appointment.departmentKey !== undefined && appointment.departmentKey !== '') {
      // For PRACTITIONER resource type
      if (appointment.resourceTypeLkey === '2039534205961578' || appointment.resourceTypeLkey === 'PRACTITIONER') {
        const matchingDept = departmentListResponse?.data?.find(
          dept => {
            const deptIdStr = String(dept.id);
            const deptKeyStr = dept.key ? String(dept.key) : null;
            const apptDeptKeyStr = String(appointment.departmentKey);
            return deptIdStr === apptDeptKeyStr || deptKeyStr === apptDeptKeyStr;
          }
        );
        if (matchingDept) {
          // Use the department's id, but ensure it matches the type expected by the select field
          normalizedDepartmentKey = matchingDept.id;
        } else {
          normalizedDepartmentKey = appointment.departmentKey;
        }
      }
      // For PROCEDURE resource type
      else if (appointment.resourceTypeLkey === '2039548173192779' || appointment.resourceTypeLkey === 'PROCEDURE') {
        const matchingDept = dayCaseDepartmentListResponse?.data?.find(
          dept => {
            const deptIdStr = String(dept.id);
            const deptKeyStr = dept.key ? String(dept.key) : null;
            const apptDeptKeyStr = String(appointment.departmentKey);
            return deptIdStr === apptDeptKeyStr || deptKeyStr === apptDeptKeyStr;
          }
        );
        if (matchingDept) {
          normalizedDepartmentKey = matchingDept.id;
        } else {
          normalizedDepartmentKey = appointment.departmentKey;
        }
      } else {
        normalizedDepartmentKey = appointment.departmentKey;
      }
    }

    return {
      ...appointment,
      facilityKey: appointment.facilityKey ? String(appointment.facilityKey) : appointment.facilityKey,
      departmentKey: normalizedDepartmentKey
    };
  }, [appointment, departmentListResponse, dayCaseDepartmentListResponse]);

  const [saveAppointment, saveAppointmentMutation] = useSaveAppointmentMutation();

  useEffect(() => {
    // When editing/viewing an existing appointment, localPatient should come from `appointmentData`.
    // Don't overwrite it from the global patient slice (which may be empty or from a previous flow).
    if (!appointmentData && patientSlice?.patient) {
      setLocalPatient(patientSlice?.patient);
    }
  }, [patientSlice, appointmentData]);

  // const { data: resourceTypeQueryResponse } = useGetLovValuesByCodeQuery('BOOK_RESOURCE_TYPE');
  const ResourceTypeEnum = useEnumOptions('ResourceType');

  const DEFAULT_RESOURCE_TYPE = 'CLINIC';

  useEffect(() => {
    // Skip if we have appointmentData (editing existing appointment)
    if (appointmentData) {
      return;
    }

    // Skip if resourceTypeLkey is already set to a valid value
    if (appointment?.resourceTypeLkey) {
      return;
    }

    // If resourceType prop has values (filter is applied from ScheduleScreen), use the first one
    if (resourceType?.resourcesType && Array.isArray(resourceType.resourcesType) && resourceType.resourcesType.length > 0) {
      const firstResourceType = resourceType.resourcesType[0];
      setAppointment(prev => ({
        ...prev,
        resourceTypeLkey: firstResourceType
      }));
      return;
    }

    // Set default to CLINIC when modal opens for new appointment
    // Only set if modal is open, ResourceTypeEnum is loaded, and resourceTypeLkey is not set
    if (isOpen && !appointment?.resourceTypeLkey && Array.isArray(ResourceTypeEnum) && ResourceTypeEnum.length) {
      const normalize = (v: any) => String(v ?? '').trim().toLowerCase();

      const match =
        ResourceTypeEnum.find(
          (x: any) =>
            normalize(x?.label) === normalize(DEFAULT_RESOURCE_TYPE) ||
            normalize(x?.value) === normalize(DEFAULT_RESOURCE_TYPE)
        ) || null;

      if (match?.value) {
        setAppointment(prev => ({
          ...prev,
          resourceTypeLkey: match.value
        }));
      } else {
        setAppointment(prev => ({
          ...prev,
          resourceTypeLkey: DEFAULT_RESOURCE_TYPE
        }));
      }
    }
  }, [ResourceTypeEnum, appointment?.resourceTypeLkey, appointmentData, resourceType, isOpen]);

  // Get active filter tags
  const activeFilters = useMemo(() => {
    const filters = [];

    if (appointment?.resourceTypeLkey) {
      const resourceTypeLabel =
        ResourceTypeEnum?.find(rt => rt.value === appointment.resourceTypeLkey)?.label || appointment.resourceTypeLkey;
      filters.push({
        type: 'resourceType',
        label: 'Resource Type',
        value: resourceTypeLabel,
        valueKey: appointment.resourceTypeLkey
      });
    }

    if (appointment?.resourceKey) {
      const selectedResource =
        resourcesByTypeResponse?.data?.find(r => r.id === appointment.resourceKey) ||
        resourcesListResponse?.data?.find(r => r.key === appointment.resourceKey);
      if (selectedResource) {
        // Use resourceName from resource table, fallback to resourceKey if not available
        const resourceName = selectedResource.resourceName || selectedResource.resourceKey || selectedResource.key;
        filters.push({
          type: 'resource',
          label: 'Resource',
          value: resourceName,
          valueKey: appointment.resourceKey
        });
      }
    }

    return filters;
  }, [appointment?.resourceTypeLkey, appointment?.resourceKey, ResourceTypeEnum, resourcesByTypeResponse, resourcesListResponse]);

  // Handle removing filter
  const handleRemoveFilter = (filterType: string) => {
    if (filterType === 'resourceType') {
      setAppointment(prev => ({
        ...prev,
        resourceTypeLkey: null,
        resourceKey: null // Also clear resource when resource type is removed
      }));
    } else if (filterType === 'resource') {
      setAppointment(prev => ({
        ...prev,
        resourceKey: null
      }));
    }
  };
  const { data: instractionsTypeQueryResponse } = useGetLovValuesByCodeQuery('APP_INSTRUCTIONS');
  const { data: priorityQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
  const { data: procedureLevelQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_LEVEL');
  const { data: reminderTypeLovQueryResponse } = useGetLovValuesByCodeQuery('REMINDER_TYP');
  const { data: durationLovQueryResponse } = useGetLovValuesByCodeQuery('APNTMNT_DURATION');
  const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  const [isSideSearchOpen, setIsSideSearchOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Convert new patient service format to ApPatient format
  const convertNewPatientToApPatient = (newPatient: any): ApPatient => {
    if (!newPatient) return { ...newApPatient };

    // Build fullName from name parts
    const nameParts = [
      newPatient.firstName,
      newPatient.secondName,
      newPatient.thirdName,
      newPatient.lastName
    ].filter(Boolean);
    const fullName = nameParts.join(' ').trim() || '';

    // Convert sexAtBirth to genderLkey using LOV
    let genderLkey: string | undefined = undefined;
    if (newPatient.sexAtBirth && genderLovQueryResponse?.object) {
      const sexLower = String(newPatient.sexAtBirth).toLowerCase();
      const genderMatch = genderLovQueryResponse.object.find((item: any) => {
        const displayValue = String(item.lovDisplayVale || '').toLowerCase();
        return displayValue === sexLower || 
               (sexLower === 'male' && (displayValue === 'm' || displayValue === 'ذكر')) ||
               (sexLower === 'female' && (displayValue === 'f' || displayValue === 'انثى' || displayValue === 'أنثى'));
      });
      genderLkey = genderMatch?.key;
    }

    // Convert dateOfBirth string to Date
    let dob: Date | null = null;
    if (newPatient.dateOfBirth) {
      try {
        dob = new Date(newPatient.dateOfBirth);
        if (isNaN(dob.getTime())) {
          dob = null;
        }
      } catch (e) {
        dob = null;
      }
    }

    // Convert id to key (if id exists but key doesn't)
    const key = newPatient.key || newPatient.id ? String(newPatient.id || newPatient.key) : undefined;

    return {
      ...newApPatient,
      key: key,
      patientMrn: newPatient.medicalRecordNumber || newPatient.patientMrn || '',
      firstName: newPatient.firstName || '',
      secondName: newPatient.secondName || '',
      thirdName: newPatient.thirdName || '',
      lastName: newPatient.lastName || '',
      fullName: fullName || newPatient.fullName || '',
      documentNo: newPatient.documentNo || '',
      documentTypeLkey: newPatient.documentTypeLkey || undefined,
      dob: dob,
      genderLkey: genderLkey || newPatient.genderLkey || undefined,
      mobileNumber: newPatient.primaryMobileNumber || newPatient.mobileNumber || '',
      phoneNumber: newPatient.primaryMobileNumber || newPatient.phoneNumber || newPatient.mobileNumber || '',
      secondaryMobileNumber: newPatient.secondMobileNumber || '',
      homePhone: newPatient.homePhone || '',
      workPhone: newPatient.workPhone || '',
      email: newPatient.email || '',
      archivingNumber: newPatient.archivingNumber !== undefined ? newPatient.archivingNumber : '',
      emergencyContactName: newPatient.emergencyContactName || '',
      emergencyContactPhone: newPatient.emergencyContactPhone || '',
      emergencyContactRelationLkey: newPatient.emergencyContactRelationLkey || undefined,
      receiveSms: newPatient.receiveSms ?? undefined,
      receiveEmail: newPatient.receiveEmail ?? undefined,
      unknownPatient: newPatient.isUnknown ?? undefined,
      incompletePatient: newPatient.isCompletedPatient !== undefined ? !newPatient.isCompletedPatient : undefined,
      verified: newPatient.isVerified ?? undefined,
      privatePatient: newPatient.isPrivatePatient ?? undefined,
      createdBy: newPatient.createdBy || '',
      updatedBy: newPatient.lastModifiedBy || '',
      createdAt: newPatient.createdDate ? new Date(newPatient.createdDate).getTime() : undefined,
      updatedAt: newPatient.lastModifiedDate ? new Date(newPatient.lastModifiedDate).getTime() : undefined,
    } as ApPatient;
  };

  // const { data: cityLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
  //     code: 'CITY',
  //     parentValueKey: localPatient.countryLkey
  //   });
  // Use EncounterReason enum instead of LOV query
  const EncounterReasonEnum = useEnumOptions('EncounterReason');

  // Use new patient service hooks conditionally based on selected criterion
  const { data: patientsByMrn, isLoading: isLoadingMrn, isFetching: isFetchingMrn } = useGetPatientsByMedicalRecordNumberQuery(
    {
      medicalRecordNumber: searchParams.mrn || '',
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
    { skip: !searchParams.mrn || selectedCriterion !== 'patientMrn' }
  );

  const { data: patientsByDocument, isLoading: isLoadingDocument, isFetching: isFetchingDocument } = useGetPatientsByDocumentNumberQuery(
    {
      number: searchParams.documentNo || '',
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
    { skip: !searchParams.documentNo || selectedCriterion !== 'documentNo' }
  );

  const { data: patientsByFullName, isLoading: isLoadingFullName, isFetching: isFetchingFullName } = useGetPatientsByFullNameQuery(
    {
      keyword: searchParams.fullName || '',
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
    { skip: !searchParams.fullName || selectedCriterion !== 'fullName' }
  );

  const { data: patientsByArchiving, isLoading: isLoadingArchiving, isFetching: isFetchingArchiving } = useGetPatientsByArchivingNumberQuery(
    {
      archivingNumber: searchParams.archivingNumber || '',
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
    { skip: !searchParams.archivingNumber || selectedCriterion !== 'archivingNumber' }
  );

  const { data: patientsByPhone, isLoading: isLoadingPhone, isFetching: isFetchingPhone } = useGetPatientsByPrimaryPhoneQuery(
    {
      phone: searchParams.phoneNumber || '',
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
    { skip: !searchParams.phoneNumber || selectedCriterion !== 'phoneNumber' }
  );

  const { data: patientsByDob, isLoading: isLoadingDob, isFetching: isFetchingDob } = useGetPatientsByDateOfBirthQuery(
    {
      date: searchParams.dateOfBirth || '',
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
    { skip: !searchParams.dateOfBirth || selectedCriterion !== 'dob' }
  );

  // Normalize patient list response to match expected structure
  const patientListResponse = useMemo(() => {
    let data = null;
    let isLoading = false;
    let isFetching = false;

    switch (selectedCriterion) {
      case 'patientMrn':
        data = patientsByMrn;
        isLoading = isLoadingMrn;
        isFetching = isFetchingMrn;
        break;
      case 'documentNo':
        data = patientsByDocument;
        isLoading = isLoadingDocument;
        isFetching = isFetchingDocument;
        break;
      case 'fullName':
        data = patientsByFullName;
        isLoading = isLoadingFullName;
        isFetching = isFetchingFullName;
        break;
      case 'archivingNumber':
        data = patientsByArchiving;
        isLoading = isLoadingArchiving;
        isFetching = isFetchingArchiving;
        break;
      case 'phoneNumber':
        data = patientsByPhone;
        isLoading = isLoadingPhone;
        isFetching = isFetchingPhone;
        break;
      case 'dob':
        data = patientsByDob;
        isLoading = isLoadingDob;
        isFetching = isFetchingDob;
        break;
      default:
        data = null;
        isLoading = false;
        isFetching = false;
    }

    // Transform new service response structure to match old structure
    // New service returns: { data: Patient[], totalCount: number }
    // Old service expected: { object: Patient[] }
    if (data) {
      return {
        object: data.data || [],
        isLoading,
        isFetching
      };
    }

    return {
      object: [],
      isLoading,
      isFetching
    };
  }, [
    selectedCriterion,
    patientsByMrn,
    patientsByDocument,
    patientsByFullName,
    patientsByArchiving,
    patientsByPhone,
    patientsByDob,
    isLoadingMrn,
    isLoadingDocument,
    isLoadingFullName,
    isLoadingArchiving,
    isLoadingPhone,
    isLoadingDob,
    isFetchingMrn,
    isFetchingDocument,
    isFetchingFullName,
    isFetchingArchiving,
    isFetchingPhone,
    isFetchingDob
  ]);

  const isGettingPatients = patientListResponse.isLoading;
  const isFetchingPatients = patientListResponse.isFetching;

  const handleFilterChange = (fieldName, value) => {
    // This function is kept for compatibility but search now uses new service
    // No-op as search is handled by searchParams state
  };

  const handleSelectPatient = data => {
    if (patientSearchTarget === 'primary') {
      // Convert new patient format to ApPatient format
      const convertedPatient = convertNewPatientToApPatient(data);
      setLocalPatient(convertedPatient);
    } else if (patientSearchTarget === 'relation') {
    }
    // refetchPatients({ ...listRequest, clearResults: true });
    setSearchKeyword('');
    setDateValue(null);
  };

  // Reset search keyword when criterion changes
  React.useEffect(() => {
    setSearchKeyword('');
    setDateValue(null);
    // Reset search parameters when criterion changes
    setSearchParams({});
  }, [selectedCriterion]);

  const closeModal = () => {
    onClose();
    handleClear();
  };

  const handleClear = () => {
    setModalKey(prev => prev + 1);
    setLocalPatient(newApPatient);
    setAppointment(newApAppointment);
    setPatientAge(null);
    setValidationResult(undefined);
    setReRenderModal(!reRenderModal);
    setInstructions(null);
    setInstructionsKey(null);
    setInstructionsValue(null);
    setSelectedCriterion(null);
  };
  useEffect(() => {
    calculateAge(localPatient?.dob);
    if (from === 'Encounter' && patientSlice.patient) {
      setLocalPatient(patientSlice.patient);
    }
  }, [localPatient, from, patientSlice]);

  const searchCriteriaOptions = [
    { label: 'MRN', value: 'patientMrn' },
    { label: 'Document Number', value: 'documentNo' },
    { label: 'Full Name', value: 'fullName' },
    { label: 'Archiving Number', value: 'archivingNumber' },
    { label: 'Primary Phone Number', value: 'phoneNumber' },
    { label: 'Date of Birth', value: 'dob' }
  ];

  const search = target => {
    setPatientSearchTarget(target);

    // Return early if selectedCriterion is null or undefined
    if (!selectedCriterion) {
      return;
    }

    let searchValue = searchKeyword;

    if (selectedCriterion === 'dob' && dateValue) {
      try {
        // Format date safely
        const year = dateValue.getFullYear();
        const month = String(dateValue.getMonth() + 1).padStart(2, '0');
        const day = String(dateValue.getDate()).padStart(2, '0');
        searchValue = `${year}-${month}-${day}`;
      } catch (error) {
        console.error('Invalid date:', error);
        return;
      }
    }

    // Validate search criteria
    if ((searchKeyword && searchKeyword.length >= 3 && selectedCriterion !== 'dob') ||
      (selectedCriterion === 'dob' && dateValue && searchValue)) {
      // Update search parameters based on selected criterion
      setSearchParams(prev => {
        const newParams = { ...prev };
        
        switch (selectedCriterion) {
          case 'patientMrn':
            newParams.mrn = searchValue;
            break;
          case 'documentNo':
            newParams.documentNo = searchValue;
            break;
          case 'fullName':
            newParams.fullName = searchValue;
            break;
          case 'archivingNumber':
            newParams.archivingNumber = searchValue;
            break;
          case 'phoneNumber':
            newParams.phoneNumber = searchValue;
            break;
          case 'dob':
            newParams.dateOfBirth = searchValue;
            break;
        }
        
        return newParams;
      });
    }
  };


  const calculateAge = (dateOfBirth: Date | string): number | undefined => {
    if (dateOfBirth) {
      const dob = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);

      if (isNaN(dob.getTime())) {
        return undefined;
      }

      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDifference = today.getMonth() - dob.getMonth();

      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
        age--;
      }

      // Update state or return age as needed
      setPatientAge({ patientAge: age });
      return age;
    }
  };

  useEffect(() => {
    setAppointment({ ...appointment, reminderLkey: null });
  }, [appointment?.isReminder]);

  useEffect(() => {
    if (appointmentData) {
      setAppointment(prev => ({ ...prev, patientKey: localPatient?.key }));
    }
  }, [localPatient]);

  useEffect(() => {
    const instructionLovKey = instructionKey?.instructionsLkey;
    if (instructionLovKey && instractionsTypeQueryResponse?.object) {
      const filtered = instractionsTypeQueryResponse.object
        .filter(item => item.key === instructionLovKey)
        .map(item => item.lovDisplayVale);
      setInstructionsValue(filtered ?? null);
    }
  }, [instructionKey]);

  useEffect(() => {
    if (instructionValue?.length) {
      const nextInstructionText = instructionValue.join(', ');
      setInstructions(prevInstructions => (prevInstructions ? `${prevInstructions}, ${nextInstructionText}` : nextInstructionText));
    }
    setInstructionsKey(null);
  }, [instructionValue]);

  useEffect(() => {
    if (resourceType?.resourcesType && Array.isArray(resourceType.resourcesType) && resourceType.resourcesType.length > 0) {
      // Extract the first value from the array (resourceType.resourcesType is an array like ['CLINIC'])
      const firstResourceType = resourceType.resourcesType[0];
      setAppointment(prev => ({
        ...prev,
        resourceTypeLkey: firstResourceType
      }));
    }
  }, [resourceType]);

  useEffect(() => {
    // If facility prop is provided, use it
    if (facility) {
      setAppointment(prev => ({ ...prev, facilityKey: facility?.id || facility?.facilityKey }));
      return;
    }
    
    // Otherwise, use current logged-in facility if no facility is set
    if (!appointment?.facilityKey && currentLoggedInFacility) {
      setAppointment(prev => ({ 
        ...prev, 
        facilityKey: currentLoggedInFacility?.id || currentLoggedInFacility?.facilityKey 
      }));
    }
  }, [facility, currentLoggedInFacility, appointment?.facilityKey]);

  useEffect(() => {
    const currentFacilityKey = appointment?.facilityKey ? String(appointment.facilityKey) : null;

    // Initialize previous value on first run
    if (prevFacilityKeyRef.current === null) {
      prevFacilityKeyRef.current = currentFacilityKey;
      return;
    }

    // When facility changes, clear any picked availability selections (times must depend on facility)
    if (prevFacilityKeyRef.current !== currentFacilityKey) {
      setSelectedSlices([]);
      setSelectedDate(null);
      setSelectedTime(null);
      setOpenDay(null);
    }

    prevFacilityKeyRef.current = currentFacilityKey;
  }, [appointment?.facilityKey]);

  const calculateAppointmentDate = (duration, useSelectedSlices = false) => {
    // If using selectedSlices, calculate from slices
    if (useSelectedSlices && selectedSlices && selectedSlices.length > 0 && openDay) {
      // Find slices from selectedSlices
      const slices =
        dailySlices[openDay]?.filter(slice => selectedSlices.includes(slice.SliceKey)) || [];

      if (slices.length > 0) {
        // Sort slices by time
        const sortedSlices = [...slices].sort((a, b) => {
          const timeA = a.from instanceof Date && !isNaN(a.from) ? a.from.getTime() : 0;
          const timeB = b.from instanceof Date && !isNaN(b.from) ? b.from.getTime() : 0;
          return timeA - timeB;
        });

        if (duration === 0) {
          // Return start time from first slice
          const firstSlice = sortedSlices[0];
          if (firstSlice?.from instanceof Date && !isNaN(firstSlice.from.getTime())) {
            const startDate = new Date(selectedDate || new Date());
            startDate.setHours(firstSlice.from.getHours());
            startDate.setMinutes(firstSlice.from.getMinutes());
            startDate.setSeconds(0);
            startDate.setMilliseconds(0);
            return startDate;
          }
        } else {
          // Return end time from last slice
          const lastSlice = sortedSlices[sortedSlices.length - 1];
          if (lastSlice?.to instanceof Date && !isNaN(lastSlice.to.getTime())) {
            const endDate = new Date(selectedDate || new Date());
            endDate.setHours(lastSlice.to.getHours());
            endDate.setMinutes(lastSlice.to.getMinutes());
            endDate.setSeconds(0);
            endDate.setMilliseconds(0);

            // Add duration if provided
            if (duration) {
              const durationMinutes = parseInt(duration, 10);
              if (!isNaN(durationMinutes)) {
                endDate.setMinutes(endDate.getMinutes() + durationMinutes);
              }
            }
            return endDate;
          }
        }
      }
    }

    // Fallback: Use selectedDate if available (from DatePicker), otherwise use selectedYear/Month/Day
    let baseDate: Date;

    if (selectedDate) {
      // Use selectedDate as base date
      baseDate = new Date(selectedDate);
    } else if (selectedYear && selectedMonth !== null && selectedMonthDay) {
      // Fallback to selectedYear/Month/Day if selectedDate is not set
      baseDate = new Date(selectedYear, selectedMonth, selectedMonthDay);
    } else {
      // Fallback to current date if nothing is set
      baseDate = new Date();
    }

    // Set time from selectedTime if available
    if (selectedTime) {
      const time = new Date(selectedTime);
      baseDate.setHours(time.getHours());
      baseDate.setMinutes(time.getMinutes());
      baseDate.setSeconds(0);
      baseDate.setMilliseconds(0);
    }

    // Add duration if provided
    if (duration) {
      const durationMinutes = parseInt(duration, 10);
      if (!isNaN(durationMinutes)) {
        baseDate.setMinutes(baseDate.getMinutes() + durationMinutes);
      }
    }

    return baseDate;
  };

  const normalizeToString = (v: any) => {
    if (v === null || typeof v === 'undefined') return null;

    if (typeof v === 'boolean') return v ? 'true' : 'false';

    if (v instanceof Date) return v.toISOString();

    return String(v);
  };

  const sanitizeAppointmentPayload = (payload: any) => ({
    ...payload,

    isReminder: normalizeToString(payload?.isReminder),
    consentForm: normalizeToString(payload?.consentForm),

    appointmentStart: normalizeToString(payload?.appointmentStart),
    appointmentEnd: normalizeToString(payload?.appointmentEnd),

    patientKey: normalizeToString(payload?.patientKey),
    facilityKey: normalizeToString(payload?.facilityKey),
    resourceKey: normalizeToString(payload?.resourceKey),
    departmentKey: normalizeToString(payload?.departmentKey),

    reminderLkey: normalizeToString(payload?.reminderLkey),
    durationLkey: normalizeToString(payload?.durationLkey),
    visitTypeLkey: normalizeToString(payload?.visitTypeLkey),
    resourceTypeLkey: normalizeToString(payload?.resourceTypeLkey)
  });

  const validateRequiredFields = () => {
    const missingFields: string[] = [];

    if (!localPatient?.key) {
      missingFields.push('Patient');
    }
    if (!appointment?.facilityKey) {
      missingFields.push('Facility');
    }
    if (!appointment?.resourceTypeLkey) {
      missingFields.push('Resource Type');
    }
    if (!appointment?.resourceKey) {
      missingFields.push('Resource');
    }
    if (!appointment?.visitTypeLkey) {
      missingFields.push('Visit Type');
    }
    // Validate appointment date 
    // Check if date is set via DatePicker (selectedDate) or fallback date fields
    // Also check if time slices are selected (which implies a date context exists)
    const hasDate = selectedDate || (selectedYear && selectedMonth !== null && selectedMonthDay);
    const hasTimeSlices = selectedSlices && selectedSlices.length > 0;

    // If time slices are selected, we can use current date as fallback, so don't require selectedDate
    // But if no slices and no date, then date is required
    if (!hasDate && !hasTimeSlices) {
      missingFields.push('Appointment Date');
    }

    // Validate appointment time (need either selectedTime or selectedSlices)
    // Only check time if we have a date or time slices are selected
    if (hasDate && !selectedTime && !hasTimeSlices) {
      missingFields.push('Appointment Time');
    }
    // Validate department for PRACTITIONER and PROCEDURE resource types
    if ((appointment?.resourceTypeLkey === '2039534205961578' ||
      appointment?.resourceTypeLkey === 'PRACTITIONER' ||
      appointment?.resourceTypeLkey === '2039548173192779' ||
      appointment?.resourceTypeLkey === 'PROCEDURE') &&
      !appointment?.departmentKey) {
      missingFields.push('Department');
    }

    if (missingFields.length > 0) {
      const lines = missingFields.map(field => `• ${field}: is required`);
      dispatch(
        notify({
          msg: `Please fix the following fields:\n${lines.join('\n')}`,
          sev: 'warning'
        })
      );
      return false;
    }
    return true;
  };

  const handleSaveAppointment = () => {
    // Validate required fields first
    if (!validateRequiredFields()) {
      return;
    }

    let finalResourceKey = appointment.resourceKey;

    if (!finalResourceKey) {
      const selectedResourceFromList = resourcesWithNames.find(
        (r: any) => r.key === appointment.resourceKey || r.resourceKey === appointment.resourceKey
      );
      finalResourceKey = selectedResourceFromList?.resourceKey || selectedResourceFromList?.key;
    }

    // Calculate appointmentStart and appointmentEnd
    // Try to use selectedSlices first, fallback to selectedDate/selectedTime
    const appointmentStart = calculateAppointmentDate(0, true);
    const appointmentEnd = calculateAppointmentDate(selectedDuration, true);

    // Check if the resource type is department-based (similar to PatientQuickAppointment)
    const isDepartmentBasedResource = ['CLINIC', 'INPATIENT_ADMISSION', 'DAY_CASE', 'EMERGENCY'].includes(appointment?.resourceTypeLkey);

    // For department-based resources, use the resourceKey (finalResourceKey) as departmentKey
    // For other resources, use the departmentKey as is
    const departmentKeyToSave = isDepartmentBasedResource
      ? finalResourceKey
      : appointment.departmentKey;

    const appointmentToSave = {
      ...appointment,
      patientKey: localPatient.key,
      // Audit field: if backend doesn't populate created_by, ensure it's set from logged-in user
      createdBy:
        (typeof appointment?.createdBy === 'string' && appointment.createdBy.trim()
          ? appointment.createdBy
          : appointment?.createdBy) ?? loggedInUsername,
      appointmentStart: appointmentStart,
      appointmentEnd: appointmentEnd,
      instructions: instructions,
      // appointmentStatus: appointment.appointmentStatus ? appointment.appointmentStatus : 'New-Appointment',
      appointmentStatus: forceStatus
        ? forceStatus
        : (appointment.appointmentStatus ? appointment.appointmentStatus : 'New-Appointment'),
      selectedSlices: selectedSlices ?? [],
      appointmentDate: selectedDate,
      resourceKey: finalResourceKey,
      departmentKey: departmentKeyToSave ? String(departmentKeyToSave) : departmentKeyToSave,
      facilityKey: appointment.facilityKey ? String(appointment.facilityKey) : appointment.facilityKey
    };

    if (localPatient?.key) {
      const sanitizedAppointmentToSave = sanitizeAppointmentPayload(appointmentToSave);

      saveAppointment(sanitizedAppointmentToSave)
        .unwrap()
        .then(() => {
          closeModal();
          handleClear();
          onSave();
        })
        .catch(e => {
          if (e.status !== 422) {
            dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
          }
        });
    } else {
      dispatch(notify({ msg: 'Please make sure to fill in the required fields.', sev: 'warn' }));
    }
  };

  const getAvailableDatesInMonth = (dayOfWeek, year, month) => {
    const dates = [];
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= totalDays; i++) {
      const currentDate = new Date(year, month, i);
      if (currentDate.toLocaleDateString('en-US', { weekday: 'long' }) === dayOfWeek) {
        dates.push(i);
      }
    }
    return dates;
  };

  const filterWeekDays = periodsData => {
    const result = {};

    periodsData?.forEach(item => {
      const resourceKey = item.resourceKey;
      const day = item.dayLvalue?.lovDisplayVale;
      const period = {
        startTime: item.startTime,
        endTime: item.endTime
      };

      if (!result[resourceKey]) result[resourceKey] = {};
      if (!result[resourceKey][day]) result[resourceKey][day] = [];
      result[resourceKey][day].push(period);
    });

    const availabilityPickerData = Object.entries(result).flatMap(([resourceKey, days]) =>
      Object.entries(days).map(([day, periods]) => ({
        label: `${day} (${periods.length} periods)`,
        value: `${resourceKey}-${day}`,
        periods: periods
      }))
    );

    setAvailabilDays(availabilityPickerData ?? []);
  };

  const mergePeriods = periods => {
    if (!periods || !periods.length) return [];

    const merged = [];
    periods.sort((a, b) => a.startTime - b.startTime);
    let current = { ...periods[0] };

    for (let i = 1; i < periods.length; i++) {
      if (periods[i].startTime <= current.endTime) {
        current.endTime = Math.max(current.endTime, periods[i].endTime);
      } else {
        merged.push(current);
        current = { ...periods[i] };
      }
    }
    merged.push(current);
    return merged;
  };

  const handleSelectDayOfWeek = selectedDay => {
    setSelectedDay(selectedDay);
    const dayOfWeek = selectedDay.split('-')[1];
    const selectedPeriods = availabilDays?.find(item => item.value === selectedDay)?.periods || [];
    const mergedPeriods = mergePeriods(selectedPeriods);
    setSelectedPeriods(mergedPeriods);

    const today = new Date();
    const availableDates = getAvailableDatesInMonth(dayOfWeek, today.getFullYear(), today.getMonth());
    setAvailableDatesInMonth(availableDates);

    const availableTimes = generateTimes(mergedPeriods, 30);
    setAvailableTimes(availableTimes);
  };

  const formatTime = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const generateTimes = (periods, interval = 30) => {
    const times = [];
    periods.forEach(period => {
      let current = period.startTime;
      while (current < period.endTime) {
        times.push(current);
        current += interval * 60;
      }
    });
    return times;
  };

  // get available houers

  useEffect(() => {
    if (appointment?.durationLkey) {
      const duration = durationLovQueryResponse.object.find(item => item.key === appointment?.durationLkey);
      const firstTwoChars = duration.lovDisplayVale.slice(0, 2);
      setSelectedDuration(firstTwoChars);
    }
  }, [appointment?.durationLkey]);

  // Fetch previous encounters when FOLLOW_UP is selected
  useEffect(() => {
    if (appointment?.visitTypeLkey !== 'FOLLOW_UP') {
      setAllPrevEncounters([]);
      return;
    }
    
    const patientAny = localPatient as any;
    const patientIdNum = Number(patientAny?.id ?? localPatient?.key ?? 0);
    if (!patientIdNum || patientIdNum === 0) return;

    // Get department ID from appointment
    // For department-based resources, departmentKey is the resourceKey
    // For other resources, use departmentKey directly
    const isDepartmentBasedResource = ['CLINIC', 'INPATIENT_ADMISSION', 'DAY_CASE', 'EMERGENCY'].includes(appointment?.resourceTypeLkey);
    const departmentId = isDepartmentBasedResource 
      ? Number(appointment?.resourceKey || 0)
      : Number(appointment?.departmentKey || 0);

    if (!departmentId || departmentId === 0) return;

    setPrevEncounterPage(0);
    setAllPrevEncounters([]);

    triggerPreviousEncounters({
      patientId: patientIdNum,
      departmentId: departmentId,
      page: 0,
      size: prevEncounterSize,
      sort: 'id,desc'
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment?.visitTypeLkey, localPatient?.key, appointment?.resourceKey, appointment?.departmentKey, appointment?.resourceTypeLkey]);

  // Handle pagination for previous encounters
  useEffect(() => {
    if (appointment?.visitTypeLkey !== 'FOLLOW_UP') return;
    
    const patientAny = localPatient as any;
    const patientIdNum = Number(patientAny?.id ?? localPatient?.key ?? 0);
    if (!patientIdNum || patientIdNum === 0) return;

    const isDepartmentBasedResource = ['CLINIC', 'INPATIENT_ADMISSION', 'DAY_CASE', 'EMERGENCY'].includes(appointment?.resourceTypeLkey);
    const departmentId = isDepartmentBasedResource 
      ? Number(appointment?.resourceKey || 0)
      : Number(appointment?.departmentKey || 0);

    if (!departmentId || departmentId === 0) return;
    if (prevEncounterPage === 0) return;

    triggerPreviousEncounters({
      patientId: patientIdNum,
      departmentId: departmentId,
      page: prevEncounterPage,
      size: prevEncounterSize,
      sort: 'id,desc'
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevEncounterPage, appointment?.visitTypeLkey, localPatient?.key, appointment?.resourceKey, appointment?.departmentKey, appointment?.resourceTypeLkey]);

  // Merge previous encounters data
  useEffect(() => {
    const rows = prevEncountersList?.data ?? [];
    if (!rows.length) return;

    setAllPrevEncounters(previousEncounters => {
      const seenIds = new Set(previousEncounters.map((encounter: any) => encounter.id));
      const merged = [...previousEncounters];
      rows.forEach((encounter: any) => {
        if (!seenIds.has(encounter.id)) merged.push(encounter);
      });
      return merged;
    });
  }, [prevEncountersList]);

  // Format previous encounters for display
  const modifiedPrevEncounters = useMemo(() => {
    return (allPrevEncounters ?? []).map((encounter: any) => ({
      ...encounter,
      combinedLabel: `${encounter.encounterNumber} , ${encounter.encounterDate ?? ''} `
    }));
  }, [allPrevEncounters]);

  const prevEncountersHasMore = Boolean(prevEncountersList?.links?.next);

  useEffect(() => {
    const today = new Date();
    const currentDay = today.getDate();

    const futureDates = availableDatesInMonth?.filter(date => date >= currentDay);
    setFilteredDates(futureDates);
  }, [availableDatesInMonth]);

  const [modalKey, setModalKey] = useState(0);

  const handleDayClick = day => {
    const isDeselecting = openDay === day;
    setOpenDay(isDeselecting ? null : day);
    // Don't clear selectedDate when selecting a day - keep the date if it was already selected
    // Only clear if deselecting the day and no time slices are selected
    if (isDeselecting && (!selectedSlices || selectedSlices.length === 0)) {
      setSelectedDate(null);
    }
  };
  const [openDay, setOpenDay] = useState<DayValue | null>(null);

  const modalTitle = useMemo(() => {
  if (showOnly) return 'View Appointment';
  if (appointmentData) return 'Add/Edit Appointment';
  return 'Add/Edit Appointment';
}, [showOnly, appointmentData]);


  return (
    <div>
      <AdvancedModal
        leftWidth={'25%'}
        rightWidth={'75%'}
        key={modalKey}
        isLeftClosed={!isSideSearchOpen}
        defaultClose={true}
        size="90vw"
        height="85vh"
        open={isOpen}
        setOpen={() => {
          onClose(), handleClear();
        }}
        actionButtonFunction={handleSaveAppointment}
        footerButtons={
          <div style={{ display: 'flex', gap: '5px' }}>
            <MyButton appearance="ghost" prefixIcon={() => <FontAwesomeIcon icon={faBan} />} onClick={handleClear}>
              Clear
            </MyButton>
          </div>
        }
        // rightTitle="Add Appointment"
        rightTitle={modalTitle}
        rightBodyNoScroll={false}
        rightContent={
          <div className="appointment-wrapper">
            <div className="appointment-content-wrapper">
              <div className="left-input">
                {from === 'Schedule' && (
                  <Panel>
                    <div className="show-grid">
                      <div className="flex-container" style={{ alignItems: 'flex-end', gap: '5px' }}>
                        <div style={{ flex: 1 }}>
                          <MyButton
                            appearance="ghost"
                            onClick={() => {
                              setQuickPatientModalOpen(false);
                              setPatientSearchModalOpen(true);
                            }}
                            prefixIcon={() => <FontAwesomeIcon icon={faUser} />}
                            style={{ width: '100%' }}
                          >
                            {localPatient?.fullName || (localPatient as any)?.full_name ? 'Change Patient' : 'Select Patient'}
                          </MyButton>
                        </div>
                        <div style={{ flex: 1 }}>
                          <MyButton
                            appearance="ghost"
                            onClick={() => {
                              setPatientSearchModalOpen(false);
                              setQuickPatientModalOpen(true);
                            }}
                            prefixIcon={() => <FontAwesomeIcon icon={faBolt} className="quick-patient-icon" />}
                            style={{ width: '100%' }}
                          >
                            Quick Patient
                          </MyButton>
                          <QuickPatient 
                            open={quickPatientModalOpen} 
                            setOpen={() => setQuickPatientModalOpen(false)} 
                            setPatient={(patient) => {
                              // Convert new patient format to ApPatient format
                              const convertedPatient = convertNewPatientToApPatient(patient);
                              setLocalPatient(convertedPatient);
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  </Panel>
                )}

                <div className="left-content-sections-main-conatainer">
                  <SectionContainer
                    title={'Patient Information'}
                    content={
                      <Panel bordered style={{ padding: '0' }}>
                        <div className="flex-container">
                          <div className="input-wrapper" style={{ flex: 2, display: 'flex', alignItems: 'center' }}>
                            <div>
                              <Avatar
                                size="md"
                                circle
                                src={
                                  patientImage && patientImage.fileContent
                                    ? `data:${patientImage.contentType};base64,${patientImage.fileContent}`
                                    : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
                                }
                              />
                            </div>

                            <div style={{ marginLeft: '8px' }}>
                              <p style={{ fontSize: '15px' }}>{localPatient?.fullName || (localPatient as any)?.full_name}</p>
                              <p style={{ fontSize: '12px', color: '#A1A9B8', fontWeight: 600 }}>
                                {/* {localPatient?.genderLkey} */}
                                <FontAwesomeIcon icon={faUser} />
                                {(() => {
                                  const genderKey = (localPatient as any)?.gender_lkey || localPatient?.genderLkey;
                                  const genderDisplay = genderKey && genderLovQueryResponse?.object
                                    ? conjureValueBasedOnKeyFromListOfValues(
                                      genderLovQueryResponse.object,
                                      genderKey,
                                      'lovDisplayVale'
                                    ) || 'N/A'
                                    : 'N/A';
                                  return `${genderDisplay}${patientAge?.patientAge ? `, ${patientAge.patientAge}y old` : ''}`;
                                })()}
                              </p>

                              <p style={{ fontSize: '12px', color: '#A1A9B8' }}>{localPatient?.patientMrn ? `#${localPatient.patientMrn}` : ''}</p>
                            </div>
                          </div>

                          <div
                            style={{
                              flex: 4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: 2
                            }}
                          >
                            <Divider style={{ height: '50px' }} vertical />
                            <div className="input-wrapper" style={{ flex: 1 }}>
                              <p style={{ fontSize: '10px', color: '#A1A9B8' }}>Document Type</p>
                              {(() => {
                                // Use primary document type if available, otherwise fallback to patient's documentTypeLkey
                                if (primaryDocument?.type) {
                                  return formatEnumString(primaryDocument.type);
                                }
                                const docTypeKey = (localPatient as any)?.document_type_lkey || localPatient?.documentTypeLkey;
                                return docTypeKey && docTypeLovQueryResponse?.object
                                  ? conjureValueBasedOnKeyFromListOfValues(
                                    docTypeLovQueryResponse.object,
                                    docTypeKey,
                                    'lovDisplayVale'
                                  ) || '-'
                                  : '-';
                              })()}
                            </div>
                            <div className="input-wrapper" style={{ flex: 1 }}>
                              <div className="input-wrapper" style={{ flex: 1 }}>
                                <p style={{ fontSize: '10px', color: '#A1A9B8' }}>Document No</p>
                                {(() => {
                                  // Use primary document number if available, otherwise fallback to patient's documentNo
                                  if (primaryDocument?.number) {
                                    return primaryDocument.number;
                                  }
                                  const docNo = (localPatient as any)?.document_no || localPatient?.documentNo;
                                  return docNo || '-';
                                })()}
                              </div>
                            </div>
                            <div className="input-wrapper" style={{ flex: 1 }}>
                              <div className="input-wrapper" style={{ flex: 1 }}>
                                <p style={{ fontSize: '10px', color: '#A1A9B8' }}>Mobile Number</p>
                                {(() => {
                                  const mobileValue =
                                    (localPatient as any)?.mobile_number ||
                                    localPatient?.mobileNumber ||
                                    localPatient?.phoneNumber ||
                                    (localPatient as any)?.phone_number;
                                  return mobileValue || '-';
                                })()}
                              </div>
                            </div>
                            <div className="input-wrapper" style={{ flex: 1 }}>
                              <div className="input-wrapper" style={{ flex: 1 }}>
                                <p style={{ fontSize: '10px', color: '#A1A9B8' }}>Email</p>
                                {localPatient?.email || '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Panel>
                    }
                  />

                  <SectionContainer
                    title={'Visit Details'}
                    content={
                      <Form layout="inline" fluid>
                        <div className="show-grid">
                          <div className="flex-container">
                            <div className="input-wrapper" style={{ flex: 2 }}>
                              <MyInput
                                disabled
                                width={'100%'}
                                vr={validationResult}
                                column
                                fieldLabel="City"
                                fieldType="select"
                                fieldName="durationLkey"
                                selectData={[]}
                                searchable={false}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={appointment}
                                setRecord={setAppointment}
                              />
                            </div>
                            <div className="input-wrapper" style={{ flex: 3, minWidth: 260 }}>
                              <MyInput
                                disabled
                                width={'15vw'}
                                column
                                fieldLabel="Facility"
                                selectData={facilityListResponse?.map(f => ({ ...f, id: String(f.id) })) ?? []}
                                fieldType="select"
                                selectDataLabel="name"
                                selectDataValue="id"
                                fieldName="facilityKey"
                                record={normalizedAppointment || appointment}
                                setRecord={setAppointment}
                                searchable={false}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="show-grid">
                          <div className="flex-container">
                            <div className="input-wrapper" style={{ flex: 3 }}>
                              <MyInput
                                disabled
                                width={'15vw'}
                                vr={validationResult}
                                column
                                fieldLabel="Resource Type"
                                fieldType="select"
                                fieldName="resourceTypeLkey"
                                selectData={ResourceTypeEnum ?? []}
                                selectDataLabel="label"
                                selectDataValue="value"
                                record={appointment}
                                setRecord={setAppointment}
                                searchable={false}
                                required
                              />
                            </div>
                            <div className="input-wrapper" style={{ flex: 3 }}>
                              <MyInput
                                disabled={showOnly || !appointment?.resourceTypeLkey}
                                width={'15vw'}
                                column
                                fieldLabel="Resources"
                                selectData={resourcesWithNames}
                                fieldType="select"
                                selectDataLabel="resourceName"
                                selectDataValue="resourceKey"
                                fieldName="resourceKey"
                                record={appointment}
                                setRecord={setAppointment}
                                required
                              />
                            </div>
                            {/* Department field for PRACTITIONER resource type */}
                            {(appointment?.resourceTypeLkey === '2039534205961578' || appointment?.resourceTypeLkey === 'PRACTITIONER') ? (
                              <div className="input-wrapper" style={{ flex: 3 }}>
                                <MyInput
                                  width={'15vw'}
                                  vr={validationResult}
                                  column
                                  fieldType="select"
                                  fieldLabel="Department"
                                  fieldName="departmentKey"
                                  selectData={departmentListResponse?.data ?? []}
                                  selectDataLabel="name"
                                  selectDataValue="id"
                                  record={normalizedAppointment || appointment}
                                  setRecord={setAppointment}
                                  disabled={showOnly}
                                  required
                                />
                              </div>
                            ) : null}
                            {/* Department field for PROCEDURE resource type */}
                            {(appointment?.resourceTypeLkey === '2039548173192779' || appointment?.resourceTypeLkey === 'PROCEDURE') ? (
                              <div className="input-wrapper" style={{ flex: 3 }}>
                                <MyInput
                                  width={'15vw'}
                                  vr={validationResult}
                                  column
                                  fieldType="select"
                                  fieldLabel="Department"
                                  fieldName="departmentKey"
                                  selectData={dayCaseDepartmentListResponse?.data ?? []}
                                  selectDataLabel="name"
                                  selectDataValue="id"
                                  record={normalizedAppointment || appointment}
                                  setRecord={setAppointment}
                                  disabled={showOnly}
                                  required
                                />
                              </div>
                            ) : null}
                            <div className="input-wrapper" style={{ flex: 3 }}>
                              <MyInput
                                width={'15vw'}
                                vr={validationResult}
                                column
                                fieldLabel="Visit Type"
                                fieldType="select"
                                fieldName="visitTypeLkey"
                                selectData={EncounterReasonEnum ?? []}
                                selectDataLabel="label"
                                selectDataValue="value"
                                record={appointment}
                                setRecord={setAppointment}
                                disabled={showOnly}
                                searchable={false}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Previous Encounters field for FOLLOW_UP visit type */}
                        {appointment?.visitTypeLkey === 'FOLLOW_UP' && (
                          <div className="show-grid">
                            <div className="flex-container">
                              <div className="input-wrapper" style={{ flex: 3 }}>
                                <MyInput
                                  width={'15vw'}
                                  vr={validationResult}
                                  column
                                  fieldLabel="Previous Encounters"
                                  fieldType="selectPagination"
                                  fieldName="followUpEncounterId"
                                  selectData={modifiedPrevEncounters}
                                  selectDataLabel="combinedLabel"
                                  selectDataValue="id"
                                  record={appointment}
                                  setRecord={setAppointment}
                                  menuMaxHeight={200}
                                  loading={isPrevEncountersFetching}
                                  searchable={false}
                                  hasMore={prevEncountersHasMore}
                                  disabled={showOnly}
                                  required={appointment?.visitTypeLkey === 'FOLLOW_UP'}
                                  onFetchMore={() => {
                                    if (prevEncountersList?.links?.next) {
                                      const { page } = extractPaginationFromLink(prevEncountersList.links.next);
                                      setPrevEncounterPage(page);
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </Form>
                    }
                  />
                </div>
              </div>
              <div className="right-input">
                <div className="right-content-sections-main-conatainer">
                  <SectionContainer
                    title={'Schedule Appointment'}
                    content={
                      <>
                        <Form layout="inline" fluid>
                          <div className="show-grid">
                            <div className="flex-container">
                              <div className="input-wrapper" style={{ flex: 2, minWidth: 200 }}>
                                <div style={{ width: '100%' }}>
                                  <Form.ControlLabel>
                                    <MyLabel
                                      label="Appointment Date"
                                      color={mode === 'light' ? 'var(--black)' : 'var(--white)'}
                                    />
                                  </Form.ControlLabel>
                                  <div style={{ marginBottom: 5 }} />
                                  <DatePicker
                                    value={selectedDate}
                                    disabled={showOnly || !appointment?.facilityKey}
                                    onChange={date => {
                                      setSelectedDate(date);
                                      if (date) {
                                        // Convert JavaScript day to API day format (same as NewAvailabilityTimeModal)
                                        const jsDay = date.getDay(); // 0=Sunday, 6=Saturday
                                        const apiDay = String((jsDay + 1) % 7); // Convert to 0=Saturday, 1=Sunday, etc.
                                        setOpenDay(apiDay as DayValue);
                                      } else {
                                        setOpenDay(null);
                                      }
                                    }}
                                    shouldDisableDate={date => {
                                      if (openDay !== null) {
                                        // Convert JavaScript day to API day format (same as NewAvailabilityTimeModal)
                                        const jsDay = date.getDay(); // 0=Sunday, 6=Saturday
                                        const apiDay = String((jsDay + 1) % 7); // Convert to 0=Saturday, 1=Sunday, etc.
                                        return apiDay !== openDay;
                                      }
                                      return false;
                                    }}
                                    size="md"
                                    placeholder="DD/MM/YYYY"
                                    style={{ width: '100%' }}
                                  />
                                </div>
                              </div>
                              <div className="input-wrapper" style={{ display: 'flex' }}>
                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                                  {/* Spacer so the button aligns with the DatePicker input (since DatePicker has a label above it) */}
                                  <Form.ControlLabel style={{ visibility: 'hidden' }}>
                                    <MyLabel
                                      label="Appointment Date"
                                      color={mode === 'light' ? 'var(--black)' : 'var(--white)'}
                                    />
                                  </Form.ControlLabel>
                                  <div style={{ marginBottom: 5, visibility: 'hidden' }} />
                                  <MyButton
                                    disabled={showOnly || !appointment?.facilityKey}
                                    appearance="primary"
                                    className="icon-button-primary"
                                    style={{ width: '100%', marginTop: '0' }}
                                  >
                                    <FontAwesomeIcon className="icon-button-primary-icon" icon={faListCheck} />
                                    <Translate>Add to Waiting List</Translate>
                                  </MyButton>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Form>

                        <div style={{ width: '100%' }}>
                          {!appointment?.facilityKey ? (
                            <Panel bordered style={{ width: '100%' }}>
                              <div style={{ fontSize: 13, color: 'var(--rs-text-secondary)' }}>
                                Please select a <b>Facility</b> to view availability times.
                              </div>
                            </Panel>
                          ) : (
                            <>
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '10px',
                                  marginBottom: '16px',
                                  flexWrap: 'wrap',
                                  padding: '8px',
                                  backgroundColor: mode === 'light' ? '#f8f9fa' : '#434343ff',
                                  borderRadius: '12px',
                                  border: '1px solid var(--rs-border-primary)'
                                }}
                              >
                                {sortedDaysWithSlices.map(day => {
                                  const dayLabel = DAYS.find(d => d.value === day)?.label;

                                  return (
                                    <div
                                      key={day}
                                      onClick={() => handleDayClick(day)}
                                      style={{
                                        padding: '10px 16px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        background:
                                          openDay === day
                                            ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
                                            : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                        color: openDay === day ? 'white' : '#495057',
                                        fontWeight: '600',
                                        userSelect: 'none',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        border: openDay === day ? '2px solid #4caf50' : '1px solid #dee2e6',
                                        boxShadow:
                                          openDay === day
                                            ? '0 4px 12px rgba(76, 175, 80, 0.25), 0 2px 4px rgba(0,0,0,0.1)'
                                            : '0 2px 4px rgba(0,0,0,0.05)',
                                        transform: openDay === day ? 'translateY(-1px)' : 'translateY(0)'
                                      }}
                                      onMouseEnter={e => {
                                        if (openDay !== day) {
                                          e.currentTarget.style.transform = 'translateY(-2px)';
                                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.12)';
                                        }
                                      }}
                                      onMouseLeave={e => {
                                        if (openDay !== day) {
                                          e.currentTarget.style.transform = 'translateY(0)';
                                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                                        }
                                      }}
                                    >
                                      {dayLabel}
                                    </div>
                                  );
                                })}
                              </div>

                              <SliceBox
                                dailySlices={dailySlices}
                                openDay={openDay}
                                // sortedDaysWithSlices={sortedDaysWithSlices}
                                onSelectionChange={newSelection => {
                                  setSelectedSlices(newSelection);
                                  // setAppointment({
                                  //     ...appointment,
                                  //     appointmentSlices: newSelection.map(sliceId => {
                                  //         const [day, index] = sliceId.split('-').map(Number);
                                  //         return dailySlices[day][index];
                                  //     })
                                  // });
                                }}
                              />
                            </>
                          )}
                        </div>
                      </>
                    }
                  />
                  <SectionContainer
                    title={'Additional Information'}
                    content={
                      <>
                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
                          <MyButton appearance={showMore ? 'ghost' : 'primary'} onClick={() => setShowMore(v => !v)}>
                            {showMore ? 'Hide' : 'Show More'}
                          </MyButton>
                        </div>

                        <div style={{ display: showMore ? 'block' : 'none', width: '100%' }}>
                          <Panel style={{ width: '100%' }}>
                            <Form layout="inline" fluid style={{ width: '100%' }}>
                              <div style={{ width: '100%' }}>
                                <div
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8,
                                    minWidth: 0,
                                  }}
                                >
                                  <div className="show-grid" style={{ width: '100%' }}>
                                    <div className="flex-container" style={{ width: '100%', gap: 12 }}>
                                      <div className="input-wrapper" style={{ flex: 9, minWidth: 0 }}>
                                        <MyInput
                                          disabled={showOnly}
                                          width="100%"
                                          vr={validationResult}
                                          column
                                          fieldLabel="Instructions"
                                          fieldType="select"
                                          fieldName="instructionsLkey"
                                          selectData={instractionsTypeQueryResponse?.object ?? []}
                                          selectDataLabel="lovDisplayVale"
                                          selectDataValue="key"
                                          record={instructionKey}
                                          searchable={false}
                                          setRecord={setInstructionsKey}
                                        />
                                      </div>
                                    </div>
                                  </div>


                                  <div style={{ width: '100%', minWidth: 0 }}>
                                    <Input
                                      as="textarea"
                                      disabled={showOnly}
                                      onChange={setInstructions}
                                      value={instructions}
                                      rows={4}
                                      style={{
                                        width: '100%',
                                        minWidth: 0,
                                        height: 110,
                                        resize: 'vertical',
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="show-grid" style={{ width: '100%' }}>
                                <div className="flex-container" style={{ width: '100%', gap: 12 }}>
                                  <div className="input-wrapper" style={{ flex: 1, minWidth: 0 }}>
                                    <MyInput
                                      disabled={showOnly}
                                      width={'100%'}
                                      vr={validationResult}
                                      column
                                      fieldLabel="Priority"
                                      fieldType="select"
                                      fieldName="priority"
                                      selectData={priorityQueryResponse?.object ?? []}
                                      selectDataLabel="lovDisplayVale"
                                      selectDataValue="key"
                                      record={appointment}
                                      setRecord={setAppointment}
                                      searchable={false}
                                    />
                                  </div>

                                  <Button
                                    onClick={() => setAttachmentsModalOpen(true)}
                                    appearance="primary"
                                    className="icon-button-primary"
                                    disabled={!localPatient?.key || showOnly}
                                  >
                                    <FontAwesomeIcon className="icon-button-primary-icon" icon={faUpload} />
                                    <Translate>Attach File</Translate>
                                  </Button>

                                  <AttachmentModal
                                    isOpen={attachmentsModalOpen}
                                    setIsOpen={setAttachmentsModalOpen}
                                    attachmentSource={localPatient}
                                    attatchmentType={'APPOINTMENT_ATTACHMENT'}
                                    patientKey={localPatient?.key}
                                  />
                                </div>
                              </div>

                              {/* ===================== Consent / Reminder ===================== */}
                              <div className="show-grid" style={{ width: '100%' }}>
                                <div className="flex-container" style={{ width: '100%', gap: 12 }}>
                                  <div className="input-wrapper" style={{ minWidth: 0 }}>
                                    <MyInput
                                      disabled={showOnly}
                                      width={'100%'}
                                      column
                                      fieldLabel="Consent Form"
                                      fieldType="checkbox"
                                      fieldName="consentForm"
                                      record={appointment}
                                      setRecord={setAppointment}
                                    />
                                  </div>

                                  <div className="input-wrapper" style={{ minWidth: 0 }}>
                                    <MyInput
                                      disabled={showOnly}
                                      width={165}
                                      column
                                      fieldLabel="Reminder"
                                      fieldType="checkbox"
                                      fieldName="isReminder"
                                      record={appointment}
                                      setRecord={setAppointment}
                                    />
                                  </div>

                                  <div className="input-wrapper" style={{ minWidth: 0 }}>
                                    <MyInput
                                      disabled={!appointment?.isReminder}
                                      width={170}
                                      vr={validationResult}
                                      column
                                      fieldLabel="Reminder Type"
                                      fieldType="select"
                                      fieldName="reminderLkey"
                                      selectData={reminderTypeLovQueryResponse?.object ?? []}
                                      selectDataLabel="lovDisplayVale"
                                      selectDataValue="key"
                                      searchable={false}
                                      record={appointment}
                                      setRecord={setAppointment}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* ===================== Notes ===================== */}
                              <div style={{ width: '100%' }}>
                                <div style={{ display: 'flex', width: '100%' }}>
                                  <div className="input-wrapper" style={{ flex: 1, minWidth: 0 }}>
                                    <MyInput
                                      disabled={showOnly}
                                      vr={validationResult}
                                      fieldType="textarea"
                                      column
                                      fieldName="Notes"
                                      width={'100%'}
                                      height={70}
                                      record={appointment}
                                      setRecord={setAppointment}
                                    />
                                  </div>
                                </div>
                              </div>
                            </Form>
                          </Panel>
                        </div>
                      </>
                    }
                  />

                </div>
              </div>
            </div>
          </div>
        }
        leftContent={
          <div className="appointment-wrapper-left" style={{ marginBottom: '20px' }}>
            <div className="show-grid">
              <div className="flex-container" style={{ justifyContent: 'space-between' }}>
                <p className="left-side-title">Patients List</p>
                <IconButton onClick={() => setIsSideSearchOpen(false)} circle icon={<FontAwesomeIcon icon={faUser} />} appearance="ghost" />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gap: '16px',
                padding: '16px',
                maxHeight: '700px',
                overflowY: 'auto',
                backgroundColor: '#F5F7FB',
                borderRadius: '12px'
              }}
            >
              {isFetchingPatients ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 160,
                      backgroundColor: '#e0e0e0',
                      borderRadius: '12px',
                      padding: '16px'
                    }}
                  >
                    <Placeholder.Paragraph rows={3} active />
                  </div>
                ))
              ) : patientListResponse?.object?.length > 0 ? (
                patientListResponse.object.map((patient, index) => (
                  <div key={index} style={{ flexShrink: 0 }}>
                    <MyCard
                      height={160}
                      showArrow={true}
                      key={patient.key}
                      variant="profile"
                      leftArrow={false}
                      avatar={
                        patient?.attachmentProfilePicture?.fileContent
                          ? `data:${patient?.attachmentProfilePicture?.contentType};base64,${patient?.attachmentProfilePicture?.fileContent}`
                          : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
                      }
                      title={patient.fullName || patient.full_name}
                      contant={<>{patient.createdAt ? new Date(patient?.createdAt).toLocaleString('en-GB') : ''}</>}
                      showMore={true}
                      arrowClick={() => {
                        handleSelectPatient(patient);
                        setSearchKeyword('');
                        setIsSideSearchOpen(false);
                        setSelectedCriterion(null);
                      }}
                      footerContant={`# ${patient.patientMrn}`}
                    />
                  </div>
                ))
              ) : (
                // No Data case
                <MyCard
                  height={160}
                  showArrow={false}
                  avatar={
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: '#D3D3D3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        color: '#555',
                        fontWeight: 'bold'
                      }}
                    >
                      !
                    </div>
                  }
                  title="No patient found"
                  contant={`No patient found matching the entered ${searchCriteriaOptions.find(opt => opt.value === selectedCriterion)?.label || 'criteria'
                    }.`}
                />
              )}
            </div>
          </div>
        }
      ></AdvancedModal>

      {/* Patient Search Modal */}
      <Drawer
        size={300}
        placement={'right'}
        open={patientSearchModalOpen}
        onClose={() => {
          setPatientSearchModalOpen(false);
        }}
      >
        <Drawer.Header>
          <Drawer.Title><Translate>Search Patient</Translate></Drawer.Title>
        </Drawer.Header>
        <Drawer.Body style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
          <style>{`
            .rs-picker-menu {
              z-index: 1050 !important;
            }
            .rs-picker-select-menu {
              z-index: 1050 !important;
            }
          `}</style>
          <PatientSearchBar
            selectedCriterion={selectedCriterion}
            searchKeyword={searchKeyword}
            dateValue={dateValue}
            onCriterionChange={(criterion) => {
              setSelectedCriterion(criterion as typeof selectedCriterion);
            }}
            onSearchKeywordChange={setSearchKeyword}
            onDateValueChange={setDateValue}
            onSearch={() => {
              search('primary');
            }}
            expand={true}
            patientListResponse={patientListResponse}
            isFetchingPatients={isFetchingPatients}
            onSelectPatient={(patient) => {
              handleSelectPatient(patient);
              setSearchKeyword('');
              setPatientSearchModalOpen(false);
            }}
            showCloseButton={false}
          />
        </Drawer.Body>
      </Drawer>
    </div>
  );
};

export default AppointmentModal;