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
import { useGetPatientsQuery } from '@/services/patientService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetAppointableDepartmentsQuery, useGetAppointableDepartmentByTypeQuery } from '@/services/security/departmentService';
import { ApAppointment, ApAttachment, ApPatient } from '@/types/model-types';
import { newApAppointment, newApPatient } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest, fromCamelCaseToDBName, conjureValueBasedOnKeyFromListOfValues } from '@/utils';
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
import SectionContainer from '@/components/SectionsoContainer';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import { useEnumOptions } from '@/services/enumsApi';
import PatientSearchBar from './PatientSearchBar';
import PatientCardWithPicture from '@/components/PatientCard/PatientCardWithPicture';
import { Box, Skeleton } from '@mui/material';

const FOLLOW_UP_VISIT_TYPE_KEY = '2041067508470007';
const FOLLOW_UP_VISIT_TYPE_KEY_STR = String(FOLLOW_UP_VISIT_TYPE_KEY);

const FollowupAppointmentModal = ({
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

  const { data: resourcesListResponse } = useGetAllResourcesQuery(resourcesPaginationParams);

  const [selectedSlices, setSelectedSlices] = useState([]);

  const seedFromAppointmentData = () => {
    const seedPatient = (appointmentData as any)?.patient;
    if (seedPatient?.key) {
      setLocalPatient(seedPatient);
    }
    setAppointment(prev => ({
      ...prev,
      visitTypeLkey: FOLLOW_UP_VISIT_TYPE_KEY_STR,
      patientKey: seedPatient?.key ?? prev?.patientKey,
      createdBy: authSlice.user.username || '',
    }));
  };

  useEffect(() => {
    if (appointmentData) {
      const isDepartmentBasedResource = ['CLINIC', 'INPATIENT_ADMISSION', 'DAY_CASE', 'EMERGENCY'].includes(appointmentData?.resourceTypeLkey);
      const departmentKey = isDepartmentBasedResource && !appointmentData?.departmentKey
        ? appointmentData?.resourceKey
        : appointmentData?.departmentKey;

      setAppointment({
        ...appointmentData,
        departmentKey: departmentKey,
        visitTypeLkey: FOLLOW_UP_VISIT_TYPE_KEY_STR
      });
      setLocalPatient(appointmentData?.patient || newApPatient);
    } else {
      setAppointment({ ...newApAppointment, visitTypeLkey: FOLLOW_UP_VISIT_TYPE_KEY_STR } as any);
      setLocalPatient(newApPatient);
    }
  }, [appointmentData]);

  useEffect(() => {
    if (!isOpen) return;
    if (appointmentData?.patient) {
      seedFromAppointmentData();
    }
  }, [isOpen]);

  useEffect(() => {
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
  const authSlice = useAppSelector(state => state.auth);

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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [validationResult, setValidationResult] = useState({});
  const [selectedCriterion, setSelectedCriterion] = useState<
    'patientMrn' | 'documentNo' | 'fullName' | 'archivingNumber' | 'phoneNumber' | 'dob' | null
  >('fullName');

  const [searchKeyword, setSearchKeyword] = useState('');
  const [patientSearchTarget, setPatientSearchTarget] = useState('primary');
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

    if (!hasSelectedFacility) {
      setDailySlices({});
      return;
    }

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

      const startMinutes = slice.startTime || 0;
      const endMinutes = slice.endTime || 0;
      const fromDate = minutesToDisplayDate(startMinutes);
      const toDate = minutesToDisplayDate(endMinutes);

      loadedSlices[day].push({
        from: fromDate,
        to: toDate,
        isBreak: slice.isHasBreak || slice.isBreak || false,
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

  useEffect(() => {
    if (appointment?.resourceTypeLkey && resourcesByTypeResponse?.data) {
      setFilteredResourcesList(resourcesByTypeResponse.data);
    } else if (!appointment?.resourceTypeLkey) {
      setFilteredResourcesList([]);
    }
  }, [resourcesByTypeResponse, appointment?.resourceTypeLkey]);

  const resourcesWithNames = useMemo(() => {
    const resources = appointment?.resourceTypeLkey ? resourcesByTypeResponse?.data ?? filteredResourcesList : resourcesListResponse?.data ?? [];

    return resources.map((resource: any) => ({
      ...resource,
      resourceName: resource.resourceName || resource.resourceKey || resource.key,
      resourceKey: resource.resourceKey || resource.key,
      key: resource.resourceKey || resource.key
    }));
  }, [resourcesByTypeResponse?.data, filteredResourcesList, resourcesListResponse?.data, appointment?.resourceTypeLkey]);

  const { Column, HeaderCell, Cell } = Table;

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: !searchKeyword || searchKeyword.length < 3
  });

  const { data: facilityListResponse, isLoading: isGettingFacilities, isFetching: isFetchingFacilities } = useGetAllFacilitiesQuery({});

  const { data: departmentListResponse } = useGetAppointableDepartmentsQuery({
    facilityId: appointment?.facilityKey,
    page: 0,
    size: 1000,
    sort: 'id,asc'
  }, {
    skip: !appointment?.facilityKey
  });

  const { data: dayCaseDepartmentListResponse } = useGetAppointableDepartmentByTypeQuery({
    type: 'DAY_CASE',
    facilityId: appointment?.facilityKey,
    page: 0,
    size: 1000,
    sort: 'id,asc'
  }, {
    skip: !appointment?.facilityKey
  });

  const normalizedAppointment = useMemo(() => {
    if (!appointment) return appointment;

    let normalizedDepartmentKey = appointment.departmentKey;

    if (appointment.departmentKey !== null && appointment.departmentKey !== undefined && appointment.departmentKey !== '') {
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
          normalizedDepartmentKey = matchingDept.id;
        } else {
          normalizedDepartmentKey = appointment.departmentKey;
        }
      }
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
    if (!appointmentData && patientSlice?.patient) {
      setLocalPatient(patientSlice?.patient);
    }
  }, [patientSlice, appointmentData]);

  const ResourceTypeEnum = useEnumOptions('ResourceType');

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

  const handleRemoveFilter = (filterType: string) => {
    if (filterType === 'resourceType') {
      setAppointment(prev => ({
        ...prev,
        resourceTypeLkey: null,
        resourceKey: null
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

  const { data: visitTypeQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');

  useEffect(() => {
    if (String(appointment?.visitTypeLkey ?? '') === FOLLOW_UP_VISIT_TYPE_KEY_STR) return;
    setAppointment(prev => ({ ...prev, visitTypeLkey: FOLLOW_UP_VISIT_TYPE_KEY_STR }));
  }, [appointment?.visitTypeLkey]);

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
    setSearchKeyword('');
    setDateValue(null);
  };

  React.useEffect(() => {
    setSearchKeyword('');
    setDateValue(null);
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
    const seedPatient = (appointmentData as any)?.patient;
    setLocalPatient(seedPatient?.key ? seedPatient : newApPatient);
    setAppointment({ ...newApAppointment, visitTypeLkey: FOLLOW_UP_VISIT_TYPE_KEY_STR, patientKey: seedPatient?.key } as any);
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
    if (from === 'Encounter' && !appointmentData && patientSlice?.patient) {
      setLocalPatient(patientSlice.patient);
    }
  }, [localPatient?.dob, from, appointmentData, patientSlice?.patient]);

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

    if (!selectedCriterion) {
      return;
    }

    let searchValue = searchKeyword;

    if (selectedCriterion === 'dob' && dateValue) {
      try {
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

      setPatientAge({ patientAge: age });
      return age;
    }
  };

  useEffect(() => {
    setAppointment(prev => ({ ...prev, reminderLkey: null }));
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
    if (resourceType) setAppointment(prev => ({ ...prev, resourceTypeLkey: resourceType?.resourcesType }));
  }, [resourceType]);

  useEffect(() => {
    if (facility) setAppointment(prev => ({ ...prev, facilityKey: facility?.id || facility?.facilityKey }));
  }, [facility]);

  useEffect(() => {
    const currentFacilityKey = appointment?.facilityKey ? String(appointment.facilityKey) : null;

    if (prevFacilityKeyRef.current === null) {
      prevFacilityKeyRef.current = currentFacilityKey;
      return;
    }

    if (prevFacilityKeyRef.current !== currentFacilityKey) {
      setSelectedSlices([]);
      setSelectedDate(null);
      setSelectedTime(null);
      setOpenDay(null);
    }

    prevFacilityKeyRef.current = currentFacilityKey;
  }, [appointment?.facilityKey]);

  const calculateAppointmentDate = (duration, useSelectedSlices = false) => {
    if (useSelectedSlices && selectedSlices && selectedSlices.length > 0 && openDay) {
      const slices =
        dailySlices[openDay]?.filter(slice => selectedSlices.includes(slice.SliceKey)) || [];

      if (slices.length > 0) {
        const sortedSlices = [...slices].sort((a, b) => {
          const timeA = a.from instanceof Date && !isNaN(a.from) ? a.from.getTime() : 0;
          const timeB = b.from instanceof Date && !isNaN(b.from) ? b.from.getTime() : 0;
          return timeA - timeB;
        });

        if (duration === 0) {
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
          const lastSlice = sortedSlices[sortedSlices.length - 1];
          if (lastSlice?.to instanceof Date && !isNaN(lastSlice.to.getTime())) {
            const endDate = new Date(selectedDate || new Date());
            endDate.setHours(lastSlice.to.getHours());
            endDate.setMinutes(lastSlice.to.getMinutes());
            endDate.setSeconds(0);
            endDate.setMilliseconds(0);

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

    let baseDate: Date;

    if (selectedDate) {
      baseDate = new Date(selectedDate);
    } else if (selectedYear && selectedMonth !== null && selectedMonthDay) {
      baseDate = new Date(selectedYear, selectedMonth, selectedMonthDay);
    } else {
      baseDate = new Date();
    }

    if (selectedTime) {
      const time = new Date(selectedTime);
      baseDate.setHours(time.getHours());
      baseDate.setMinutes(time.getMinutes());
      baseDate.setSeconds(0);
      baseDate.setMilliseconds(0);
    }

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
    if ((appointment?.resourceTypeLkey === '2039534205961578' ||
      appointment?.resourceTypeLkey === 'PRACTITIONER' ||
      appointment?.resourceTypeLkey === '2039548173192779' ||
      appointment?.resourceTypeLkey === 'PROCEDURE') &&
      !appointment?.departmentKey) {
      missingFields.push('Department');
    }

    if (missingFields.length > 0) {
      const lines = missingFields.map(field => `${field}: is required`);
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

    const hasTimeSlices = selectedSlices && selectedSlices.length > 0;
    const hasDate = selectedDate || (selectedYear && selectedMonth !== null && selectedMonthDay);
    const hasTime = Boolean(selectedTime);
    const hasAnyScheduleSelection = Boolean(hasTimeSlices || hasDate || hasTime);

    const appointmentStart = hasAnyScheduleSelection ? calculateAppointmentDate(0, true) : null;
    const appointmentEnd = hasAnyScheduleSelection ? calculateAppointmentDate(selectedDuration, true) : null;

    const isDepartmentBasedResource = ['CLINIC', 'INPATIENT_ADMISSION', 'DAY_CASE', 'EMERGENCY'].includes(appointment?.resourceTypeLkey);

    const departmentKeyToSave = isDepartmentBasedResource
      ? finalResourceKey
      : appointment.departmentKey;

    const appointmentToSave = {
      ...appointment,
      patientKey: localPatient.key,
      createdBy:
        (typeof appointment?.createdBy === 'string' && appointment.createdBy.trim()
          ? appointment.createdBy
          : appointment?.createdBy) ?? loggedInUsername,
      createdAt:
        typeof appointment?.createdAt !== 'undefined' && appointment?.createdAt !== null
          ? appointment.createdAt
          : new Date().toISOString(),
      updatedBy:
        (typeof appointment?.updatedBy === 'string' && appointment.updatedBy.trim()
          ? appointment.updatedBy
          : appointment?.updatedBy) ?? loggedInUsername,
      updatedAt:
        typeof appointment?.updatedAt !== 'undefined' && appointment?.updatedAt !== null
          ? appointment.updatedAt
          : new Date().toISOString(),
      appointmentStart: appointmentStart,
      appointmentEnd: appointmentEnd,
      instructions: instructions,
      appointmentStatus: appointment.appointmentStatus ? appointment.appointmentStatus : 'Pending',
      selectedSlices: selectedSlices ?? [],
      appointmentDate: hasAnyScheduleSelection ? selectedDate : null,
      resourceKey: finalResourceKey,
      departmentKey: departmentKeyToSave ? String(departmentKeyToSave) : departmentKeyToSave,
      facilityKey: appointment.facilityKey ? String(appointment.facilityKey) : appointment.facilityKey
    };

    if (localPatient?.key) {
      const sanitizedAppointmentToSave = sanitizeAppointmentPayload(appointmentToSave);

      saveAppointment(sanitizedAppointmentToSave)
        .unwrap()
        .then(() => {
          dispatch(notify({ msg: 'Appointment saved successfully', sev: 'success' }));
          closeModal();
          onSave();
        })
        .catch(e => {
          const msg =
            (e?.data && (e.data.msg || e.data.message)) ||
            (typeof e?.data === 'string' ? e.data : null) ||
            (Array.isArray(e?.data?.errors) ? e.data.errors.join('\n') : null) ||
            `Failed to save appointment${e?.status ? ` (status ${e.status})` : ''}`;
          dispatch(notify({ msg, sev: 'warn' }));
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
    const isDeselecting = openDay === day;
    setOpenDay(isDeselecting ? null : day);
    if (isDeselecting && (!selectedSlices || selectedSlices.length === 0)) {
      setSelectedDate(null);
    }
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
        rightTitle="Create Follow-up"
        rightBodyNoScroll={false}
        rightContent={
          <div className="appointment-wrapper">
            <div className="appointment-content-wrapper" style={{ width: '100%', maxWidth: '100%' }}>
              <div className="left-input" style={{ width: '100%' }}>
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
                              <p style={{ fontSize: '15px' }}>{localPatient?.fullName || (localPatient as any)?.full_name}</p>
                              <p style={{ fontSize: '12px', color: '#A1A9B8', fontWeight: 600 }}>
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
                                width={'15vw'}
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
                                required
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
                                selectData={
                                  (visitTypeQueryResponse?.object?.length
                                    ? visitTypeQueryResponse.object.map((v: any) => ({ ...v, key: String(v?.key) }))
                                    : [{ key: FOLLOW_UP_VISIT_TYPE_KEY_STR, lovDisplayVale: 'Follow Up' }]) as any
                                }
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={appointment}
                                setRecord={setAppointment}
                                disabled={true}
                                searchable={false}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </Form>
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

export default FollowupAppointmentModal;