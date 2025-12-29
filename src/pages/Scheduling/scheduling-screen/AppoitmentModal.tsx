import AdvancedModal from '@/components/AdvancedModal';
import AttachmentModal from '@/components/AttachmentUploadModal/AttachmentUploadModal';
import MyButton from '@/components/MyButton/MyButton';
import MyCard from '@/components/MyCard';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import QuickPatient from '@/pages/patient/facility-patient-list/QuickPatient';
import {
  useGetResourcesAvailabilityQuery,
  useGetResourceWithDetailsQuery,
  useSaveAppointmentMutation
} from '@/services/appointmentService';
import { useGetAllResourcesQuery, useGetResourcesByTypeQuery } from '@/services/setup/resource/ResourceService';
import { useFetchAttachmentQuery } from '@/services/attachmentService';
import { useGetPatientsQuery } from '@/services/patientService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { ApAppointment, ApAttachment, ApPatient } from '@/types/model-types';
import { newApAppointment, newApPatient } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest, fromCamelCaseToDBName, conjureValueBasedOnKeyFromListOfValues } from '@/utils';
import { DAYS, DayValue, mapJsDayToCustom } from '@/utils/dayMapping';
import { notify } from '@/utils/uiReducerActions';
import { faBan, faBolt, faListCheck, faUpload, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SearchIcon from '@rsuite/icons/Search';
import React, { useEffect, useState, useMemo } from 'react';
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

const AppointmentModal = ({
  isOpen,
  onClose,
  resourceType,
  facility,
  onSave,
  appointmentData,
  showOnly,
  from,
  selectedSlot
}) => {
  const mode = useSelector((state: any) => state.ui.mode);

  const [resourcesPaginationParams] = useState({
    page: 0,
    size: 100,
    sort: 'id,asc'
  } as { page: number; size: number; sort: string });

  // Use useGetAllResourcesQuery for all resources
  const { data: resourcesListResponse } = useGetAllResourcesQuery(resourcesPaginationParams);

  const [selectedSlices, setSelectedSlices] = useState([]);

  useEffect(() => {
    if (appointmentData) {
      setAppointment(appointmentData);
      setLocalPatient(appointmentData?.patient || newApPatient);
    } else {
      setAppointment(newApAppointment);
      setLocalPatient(newApPatient);
    }
  }, [appointmentData]);

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
      setAppointment(prev => ({
        ...prev,
        resourceKey: null,
        resourceTypeLkey: null,
        facilityKey: null
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

  const patientSlice = useAppSelector(state => state.patient);

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
    'patientMrn' | 'documentNo' | 'fullName' | 'archivingNumber' | 'phoneNumber' | 'dob'
  >('fullName');

  const [searchKeyword, setSearchKeyword] = useState('');
  const [patientSearchTarget, setPatientSearchTarget] = useState('primary'); // primary, relation, etc..
  const [patientSearchModalOpen, setPatientSearchModalOpen] = useState(false);
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [patientAge, setPatientAge] = useState({ patientAge: null });
  const [reRenderModal, setReRenderModal] = useState(true);
  const [instructionKey, setInstructionsKey] = useState();
  const [instructionValue, setInstructionsValue] = useState();
  const [instructions, setInstructions] = useState();
  const [availabilDays, setAvailabilDays] = useState();
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
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
  const fetchPatientImageResponse = useFetchAttachmentQuery(
    {
      type: 'PATIENT_PROFILE_PICTURE',
      refKey: localPatient?.key
    },
    { skip: !localPatient?.key }
  );

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

    if (resourceAvailabilityDetails?.object?.[0]?.availabilitySlices?.length > 0) {
      const loadedSlices = {};

      resourceAvailabilityDetails.object[0].availabilitySlices.forEach((slice, originalIndex) => {
        const day = String(slice.dayOfWeek);

        if (!['0', '1', '2', '3', '4', '5', '6'].includes(day)) {
          return;
        }

        if (!loadedSlices[day]) {
          loadedSlices[day] = [];
        }
        const startMinutes = (slice.startHour || 0) * 60 + (slice.startMinute || 0);
        const endMinutes = (slice.endHour || 0) * 60 + (slice.endMinute || 0);
        const fromDate = minutesToDisplayDate(startMinutes);
        const toDate = minutesToDisplayDate(endMinutes);

        loadedSlices[day].push({
          from: fromDate,
          to: toDate,
          isBreak: slice.break || false,
          SliceKey: slice.key,
          originalIndex: originalIndex,
          startMinutes: startMinutes
        });
      });

      Object.keys(loadedSlices).forEach(day => {
        loadedSlices[day].sort((a, b) => {
          if (a.startMinutes !== b.startMinutes) {
            return a.startMinutes - b.startMinutes;
          }
          return (a.originalIndex || 0) - (b.originalIndex || 0);
        });
      });

      setDailySlices(loadedSlices);
      return;
    }

    if (resourcesAvailability?.object && resourcesAvailability.object.length > 0) {
      const loadedSlices = {};

      resourcesAvailability.object.forEach((slice, originalIndex) => {
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
    } else {
      setDailySlices({});
    }
  }, [
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

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: !searchKeyword || searchKeyword.length < 3
  });

  const { data: facilityListResponse, isLoading: isGettingFacilities, isFetching: isFetchingFacilities } = useGetAllFacilitiesQuery({});
  
  // Normalize facilityKey to string for proper matching
  const normalizedAppointment = useMemo(() => {
    if (!appointment) return appointment;
    return {
      ...appointment,
      facilityKey: appointment.facilityKey ? String(appointment.facilityKey) : appointment.facilityKey
    };
  }, [appointment]);
  
  const [saveAppointment, saveAppointmentMutation] = useSaveAppointmentMutation();

  useEffect(() => {
    if (patientSlice?.patient) {
      setLocalPatient(patientSlice?.patient);
    }
  }, [patientSlice]);

  // const { data: resourceTypeQueryResponse } = useGetLovValuesByCodeQuery('BOOK_RESOURCE_TYPE');
  const ResourceTypeEnum = useEnumOptions('ResourceType');

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
  const [selectedDate, setSelectedDate] = useState();

  // const { data: cityLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
  //     code: 'CITY',
  //     parentValueKey: localPatient.countryLkey
  //   });
  const { data: visitTypeQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');

  const { data: patientListResponse, isLoading: isGettingPatients, isFetching: isFetchingPatients, refetch: refetchPatients } = useGetPatientsQuery({
    ...listRequest,
    filterLogic: 'or'
  });

  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(addFilterToListRequest(fromCamelCaseToDBName(fieldName), 'containsIgnoreCase', value, listRequest));
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };

  const handleSelectPatient = data => {
    if (patientSearchTarget === 'primary') {
      setLocalPatient(data);
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
    // Reset list to show all patients when clearing filters
    setListRequest({
      ...initialListRequest,
      ignore: true
    });
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
    if (from === 'Encounter') {
      setLocalPatient(patientSlice.patient);
    }
  }, [localPatient]);

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

    if ((searchKeyword && searchKeyword.length >= 3 && selectedCriterion !== 'dob') || 
        (selectedCriterion === 'dob' && dateValue && searchValue)) {
      setListRequest({
        ...listRequest,
        ignore: false,
        filters: [
          {
            fieldName: fromCamelCaseToDBName(selectedCriterion),
            operator: selectedCriterion === 'dob' ? 'equals' : 'containsIgnoreCase',
            value: searchValue
          }
        ]
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
      setAppointment({ ...appointment, patientKey: localPatient?.key });
    }
  }, [localPatient]);

  useEffect(() => {
    if (instructionKey?.instructionsLkey) {
      const filtered = instractionsTypeQueryResponse.object
        .filter(item => item.key === instructionKey?.instructionsLkey)
        .map(item => item.lovDisplayVale);
      setInstructionsValue(filtered);
    }
  }, [instructionKey]);

  useEffect(() => {
    if (instructionValue) {
      setInstructions(prevInstructions =>
        prevInstructions ? `${prevInstructions}, ${instructionValue}` : instructionValue[0]
      );
    }
    setInstructionsKey(null);
  }, [instructionValue]);

  useEffect(() => {
    if (resourceType) setAppointment({ ...appointment, resourceTypeLkey: resourceType?.resourcesType });
  }, [resourceType]);

  useEffect(() => {
    if (facility) setAppointment({ ...appointment, facilityKey: facility?.id || facility?.facilityKey });
  }, [facility]);

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

    reminderLkey: normalizeToString(payload?.reminderLkey),
    durationLkey: normalizeToString(payload?.durationLkey),
    visitTypeLkey: normalizeToString(payload?.visitTypeLkey),
    resourceTypeLkey: normalizeToString(payload?.resourceTypeLkey)
  });

  const handleSaveAppointment = () => {
    let finalResourceKey = appointment.resourceKey;

    if (!finalResourceKey) {
      const selectedResource = resourcesWithNames.find(
        (r: any) => r.key === appointment.resourceKey || r.resourceKey === appointment.resourceKey
      );
      finalResourceKey = selectedResource?.resourceKey || selectedResource?.key;
    }

    // Calculate appointmentStart and appointmentEnd
    // Try to use selectedSlices first, fallback to selectedDate/selectedTime
    const appointmentStart = calculateAppointmentDate(0, true);
    const appointmentEnd = calculateAppointmentDate(selectedDuration, true);

    const appointmentToSave = {
      ...appointment,
      patientKey: localPatient.key,
      appointmentStart: appointmentStart,
      appointmentEnd: appointmentEnd,
      instructions: instructions,
      appointmentStatus: appointment.appointmentStatus ? appointment.appointmentStatus : 'New-Appointment',
      selectedSlices: selectedSlices ?? [],
      appointmentDate: selectedDate,
      resourceKey: finalResourceKey,
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

  useEffect(() => {
    const today = new Date();
    const currentDay = today.getDate();

    const futureDates = availableDatesInMonth?.filter(date => date >= currentDay);
    setFilteredDates(futureDates);
  }, [availableDatesInMonth]);

  const [modalKey, setModalKey] = useState(0);

  const handleDayClick = day => {
    setOpenDay(openDay === day ? null : day);
    setSelectedDate(null);
  };
  const [openDay, setOpenDay] = useState<DayValue | null>(null);

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
        rightTitle="Add Appointment"
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
                            {localPatient?.fullName ? 'Change Patient' : 'Select Patient'}
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
                          <QuickPatient open={quickPatientModalOpen} setOpen={() => setQuickPatientModalOpen(false)} setPatient={setLocalPatient} />
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
                              <p style={{ fontSize: '15px' }}>{localPatient?.fullName}</p>
                              <p style={{ fontSize: '12px', color: '#A1A9B8', fontWeight: 600 }}>
                                {/* {localPatient?.genderLkey} */}
                                <FontAwesomeIcon icon={faUser} />
                                {(() => {
                                  const genderKey = localPatient?.gender_lkey || localPatient?.genderLkey;
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
                                const docTypeKey = localPatient?.document_type_lkey || localPatient?.documentTypeLkey;
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
                                  const docNo = localPatient?.document_no || localPatient?.documentNo;
                                  return docNo || '-';
                                })()}
                              </div>
                            </div>
                            <div className="input-wrapper" style={{ flex: 1 }}>
                              <div className="input-wrapper" style={{ flex: 1 }}>
                                <p style={{ fontSize: '10px', color: '#A1A9B8' }}>Mobile Number</p>
                                {(() => {
                                  const mobileValue = localPatient?.mobile_number || localPatient?.mobileNumber || localPatient?.phoneNumber;
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
                            <div className="input-wrapper" style={{ flex: 4 }}>
                              <MyInput
                                width={'100%'}
                                column
                                fieldLabel="Facility"
                                selectData={facilityListResponse?.map(f => ({ ...f, id: String(f.id) })) ?? []}
                                fieldType="select"
                                selectDataLabel="name"
                                selectDataValue="id"
                                fieldName="facilityKey"
                                disabled={showOnly}
                                record={normalizedAppointment || appointment}
                                setRecord={setAppointment}
                                searchable={false}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="show-grid">
                          <div className="flex-container">
                            <div className="input-wrapper" style={{ flex: 3 }}>
                              <MyInput
                                disabled={showOnly}
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
                              />
                            </div>
                            <div className="input-wrapper" style={{ flex: 3 }}>
                              <MyInput
                                width={'15vw'}
                                vr={validationResult}
                                column
                                fieldLabel="Visit Type"
                                fieldType="select"
                                fieldName="visitTypeLkey"
                                selectData={visitTypeQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={appointment}
                                setRecord={setAppointment}
                                disabled={showOnly}
                                searchable={false}
                              />
                            </div>
                          </div>
                        </div>
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
                              <div className="input-wrapper">
                                <div>
                                  <DatePicker
                                    value={selectedDate}
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
                                    placeholder="Medium"
                                  />
                                </div>
                              </div>
                              <div className="input-wrapper" style={{ display: 'flex' }}>
                                <MyButton
                                  disabled={showOnly}
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
                        </Form>

                        <div style={{ width: '100%' }}>
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
                        <div style={{ display: showMore ? 'block' : 'none' }}>
                          <Panel>
                            <Form layout="inline" fluid>
                              <div className="show-grid">
                                <div className="flex-container">
                                  <div className="input-wrapper" style={{ flex: 1 }}>
                                    <MyInput
                                      disabled={showOnly}
                                      width={'100%'}
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
                                <div style={{ display: 'flex', width: '100%' }}>
                                  <div className="input-wrapper" style={{ flex: 1 }}>
                                    <Input
                                      as="textarea"
                                      disabled={showOnly}
                                      onChange={setInstructions}
                                      value={instructions}
                                      style={{ width: '100%', height: '50px' }}
                                      rows={3}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="show-grid">
                                <div className="flex-container">
                                  <div className="input-wrapper" style={{ flex: 1 }}>
                                    <MyInput
                                      disabled={showOnly}
                                      width={'100%'}
                                      vr={validationResult}
                                      column
                                      fieldLabel="Refering Physician"
                                      fieldType="select"
                                      fieldName="referingPhysician"
                                      selectData={[]}
                                      selectDataLabel="lovDisplayVale"
                                      selectDataValue="key"
                                      searchable={false}
                                      record={appointment}
                                      setRecord={setAppointment}
                                    />
                                  </div>
                                  <div className="input-wrapper" style={{ flex: 1 }}>
                                    <MyInput
                                      disabled={showOnly}
                                      width={'100%'}
                                      vr={validationResult}
                                      column
                                      fieldName="externalPhysician"
                                      record={appointment}
                                      setRecord={setAppointment}
                                    />
                                  </div>
                                  <div className="input-wrapper" style={{ flex: 1 }}>
                                    <MyInput
                                      disabled={showOnly}
                                      width={'100%'}
                                      vr={validationResult}
                                      column
                                      fieldLabel="Procedure Level"
                                      fieldType="select"
                                      fieldName="procedureLevelLkey"
                                      selectData={procedureLevelQueryResponse?.object ?? []}
                                      selectDataLabel="lovDisplayVale"
                                      selectDataValue="key"
                                      searchable={false}
                                      record={appointment}
                                      setRecord={setAppointment}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="show-grid">
                                <div className="flex-container">
                                  <div className="input-wrapper" style={{ flex: 9 }}>
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

                              <div className="show-grid">
                                <div className="flex-container">
                                  <div className="input-wrapper">
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
                                  <div className="input-wrapper">
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
                                  <div className="input-wrapper">
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

                              <div className="flex-container">
                                <div className="input-wrapper" style={{ flex: 1 }}>
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
                      title={patient.fullName}
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
                  contant={`No patient found matching the entered ${
                    searchCriteriaOptions.find(opt => opt.value === selectedCriterion?.value)?.label || 'criteria'
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