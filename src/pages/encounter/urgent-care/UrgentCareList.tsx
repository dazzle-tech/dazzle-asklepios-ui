import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Badge, Form, Panel, Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBed,
  faBedPulse,
  faFileWaveform,
  faRectangleXmark,
  faUserDoctor,
  faCommentMedical,
  faUserNurse
} from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import DetailsCard from '@/components/DetailsCard';
import RefillModalComponent from '@/pages/Inpatient/departmentStock/refill-component';
import EncounterLogsTable from '@/pages/Inpatient/inpatientList/EncounterLogsTable';
import BedManagementModal from '@/pages/Inpatient/inpatientList/bedBedManagementModal';
import ChangeBedModal from '@/pages/Inpatient/inpatientList/changeBedModal';
import TransferPatientModal from '@/pages/Inpatient/inpatientList/transferPatient';
import PhysicianOrderSummaryModal from '@/pages/encounter/encounter-component/physician-order-summary/physician-order-summary-component/PhysicianOrderSummaryComponent';
import PatientEMRModal from '@/pages/patient/patient-emr/PatientEMRModal';

import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';

import { useAppSelector } from '@/hooks';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useCancelEncounterMutation,
  useFilterEncountersQuery,
  useStartEncounterMutation,
  useCountDepartmentTotalByDateRangeQuery,
  useCountDepartmentWaitingListByDateRangeQuery,
  useCountDepartmentTriageByDateRangeQuery,
  useCountDepartmentDischargedByDateRangeQuery
} from '@/services/encounters/patientEncounterService';
import {
  useGetBulkPatientBasicInfoMutation,
  useLazyGetPatientByIdQuery
} from '@/services/patient/patientService';
import { useLazyGetDepartmentByIdQuery } from '@/services/security/departmentService';
import { useGetActiveAssignmentsByEncounterIdsQuery } from '@/services/patients/emergency/encounterAssignToBedService';
import { useGetRoomsByIdsMutation } from '@/services/setup/room/roomService';
import { useGetBedsByIdsMutation } from '@/services/setup/room/bedService';

import { calculateAgeFormat, formatDate, formatEnumString } from '@/utils';
import { newPatient, newPatientEncounter } from '@/types/model-types-constructor-new';
import { Patient } from '@/types/model-types-new';

import './styles.less';
import 'react-tabs/style/react-tabs.css';

const toISODate = (d: Date | string | null | undefined) => {
  if (!d) return undefined;
  if (typeof d === 'string') return d;
  return d.toISOString().slice(0, 10);
};

const uniqueNonEmpty = (arr?: any[]) => {
  if (!arr) return undefined;
  const cleaned = arr.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
  return cleaned.length ? Array.from(new Set(cleaned.map(v => String(v)))) : undefined;
};

const derivePatientFilters = (appliedSearch: any) => {
  const searchByField = String(appliedSearch?.searchByField ?? 'fullName');
  const raw = String(
    appliedSearch?.patientName ??
      appliedSearch?.searchText ??
      appliedSearch?.text ??
      appliedSearch?.value ??
      ''
  ).trim();

  if (!raw) {
    return {
      patientName: undefined as string | undefined,
      mrn: undefined as string | undefined
    };
  }

  if (searchByField === 'patientMrn') {
    return { patientName: undefined, mrn: raw };
  }

  return { patientName: raw, mrn: undefined };
};

const ENCOUNTER_ERROR_MAP: Record<string, string> = {
  'id.notfound': 'Encounter not found.',
  'patient.notfound': 'Patient not found.',
  'patient.hasOngoing.notAllowed':
    'Patient already has an ongoing encounter. Starting another one is not allowed.',
  'cancel.notAllowed.rule': 'Cancellation is not allowed for the current encounter status.',
  'followUpEncounter.required.byReason':
    'Follow-up encounter is required when reason is FOLLOW_UP (and must be empty otherwise).',
  'followUpEncounter.notfound': 'Follow-up encounter not found.',
  'encounterNumber.duplicate': 'Encounter number already exists.',
  'patient.department.date.duplicate':
    'This patient already has an encounter for this department on this date.',
  'department.date.sequence.duplicate':
    'Department daily sequence number already exists for this date.',
  'patient.emergency.notAllowed.withOngoing': 'Patient currently treated by another doctor',
  'db.constraint': 'Database constraint violated while saving patient encounter.'
};

const ENCOUNTER_FIELD_LABELS: Record<string, string> = {
  patientId: 'Patient',
  facilityId: 'Facility',
  departmentId: 'Department',
  practitionerId: 'Practitioner',
  encounterType: 'Encounter Type',
  encounterReason: 'Encounter Reason',
  followUpEncounterId: 'Follow Up Encounter',
  priorityLevel: 'Priority',
  status: 'Status',
  chiefComplaint: 'Chief Complaint'
};

const handleCrudError = (error: any, dispatch: any, keyMap: Record<string, string>) => {
  const responseData = error?.data ?? error ?? {};
  const traceId = responseData?.traceId || responseData?.requestId || responseData?.correlationId;
  const traceSuffix = traceId ? `\nTrace ID: ${traceId}` : '';

  const normalizeFieldErrorMessage = (message: string) => {
    const lowerMessage = (message || '').toLowerCase();
    if (lowerMessage.includes('must not be null')) return 'is required';
    if (lowerMessage.includes('must not be blank')) return 'must not be blank';
    if (lowerMessage.includes('size')) return 'length is out of range';
    if (lowerMessage.includes('greater')) return 'value is too small';
    if (lowerMessage.includes('less')) return 'value is too large';
    return message || 'invalid value';
  };

  const getFieldLabel = (field: string) => ENCOUNTER_FIELD_LABELS[field] ?? field;

  if (Array.isArray(responseData?.fieldErrors) && responseData.fieldErrors.length > 0) {
    const errorLines = responseData.fieldErrors.map(
      (fieldError: any) =>
        `• ${getFieldLabel(fieldError.field)}: ${normalizeFieldErrorMessage(fieldError.message)}`
    );

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${errorLines.join('\n')}` + traceSuffix,
        sev: 'warning'
      })
    );
    return;
  }

  const messageProp: string = responseData?.message || '';
  const errorKey =
    (messageProp && messageProp.startsWith('error.') ? messageProp.substring(6) : undefined) ||
    responseData?.errorKey;

  const humanReadableMessage =
    (errorKey && keyMap[errorKey]) ||
    responseData?.detail ||
    responseData?.title ||
    responseData?.message ||
    'Unexpected error';

  dispatch(notify({ msg: humanReadableMessage + traceSuffix, sev: 'warning' }));
};

const UrgentCareList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const departmentId = selectedDepartment?.departmentId ?? selectedDepartment?.id;

  useEffect(() => {
    dispatch(setPageCode('Urgent_Care_List'));
    dispatch(setDivContent('Urgent Care Department'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(' '));
    };
  }, [dispatch]);

  const [encounter, setLocalEncounter] = useState<any>({
    ...newPatientEncounter,
    discharge: false
  });
  const [localPatient, setLocalPatient] = useState<Patient>({ ...newPatient });

  const [triggerGetPatientById] = useLazyGetPatientByIdQuery();
  const [triggerGetDepartmentById, { data: departmentData, isFetching: isDepartmentFetching }] =
    useLazyGetDepartmentByIdQuery();

  const [getRoomsByIds, { data: roomsByIds = [], isLoading: isRoomsByIdsLoading }] =
    useGetRoomsByIdsMutation();

  const [getBedsByIds, { data: bedsByIds = [], isLoading: isBedsByIdsLoading }] =
    useGetBedsByIdsMutation();

  const [open, setOpen] = useState(false);
  const [openRefillModal, setOpenRefillModal] = useState(false);
  const [openPhysicianOrderSummaryModal, setOpenPhysicianOrderSummaryModal] = useState(false);
  const [openEncounterLogsModal, setOpenEncounterLogsModal] = useState(false);
  const [openEMRModal, setOpenEMRModal] = useState(false);
  const [openChangeBedModal, setOpenChangeBedModal] = useState(false);
  const [openBedManagementModal, setOpenBedManagementModal] = useState(false);
  const [openTransferPatientModal, setOpenTransferPatientModal] = useState(false);
  const [openNurseAssessment, setOpenNurseAssessment] = useState(false);

  const [emrPatient, setEmrPatient] = useState<any>(null);
  const [emrEncounter, setEmrEncounter] = useState<any>(null);

  const [startEncounter] = useStartEncounterMutation();
  const [cancelEncounter] = useCancelEncounterMutation();

  const EncounterStatusEnum = useEnumOptions('EncounterStatus', {
    exclude: [
      'IN_OPERATION',
      'CONFIRM_RETURN',
      'TEMP_DC',
      'TRIAGE_STARTED',
      'SENT_TO_ER',
      'WAITING_TRIAGE',
      'WAITING_LIST',
      'PENDING_PAYMENT'
    ]
  });
  const EncounterPriorityEnum = useEnumOptions('EncounterPriority');
  const EncounterReasonEnum = useEnumOptions('EncounterReason');

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const DEFAULT_SORT = 'id,desc';

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatDate(today), [today]);

  const lastWeek = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);

  const [dateFilter, setDateFilter] = useState({ fromDate: lastWeek, toDate: today });

  const DEFAULT_STATUS = useMemo(() => ['NEW', 'ONGOING'], []);
  const [statusIn, setStatusIn] = useState<string[]>(DEFAULT_STATUS);
  const [encounterReasons, setEncounterReasons] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [hasPrescription, setHasPrescription] = useState<boolean | undefined>(undefined);
  const [hasOrder, setHasOrder] = useState<boolean | undefined>(undefined);
  const [isObserved, setIsObserved] = useState<boolean | undefined>(undefined);

  const [patientSearchDraft, setPatientSearchDraft] = useState<any>({
    searchByField: 'fullName',
    patientName: ''
  });
  const [patientSearchApplied, setPatientSearchApplied] = useState<any>({
    searchByField: 'fullName',
    patientName: ''
  });
  const [searchTick, setSearchTick] = useState(0);
  const [record, setRecord] = useState<any>({});
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    if (!departmentId) return;
    triggerGetDepartmentById(Number(departmentId)).catch(() => {});
  }, [departmentId, triggerGetDepartmentById]);

  const isEmergencyDepartment = useMemo(() => {
    return String(departmentData?.encounterType ?? '').toUpperCase() === 'EMERGENCY';
  }, [departmentData]);

  const handlePatientSearchClick = useCallback(() => {
    setFilterLoading(true);
    setPatientSearchApplied((prev: any) => ({ ...prev, ...(patientSearchDraft ?? {}) }));
    setPage(0);
    setSearchTick(prev => prev + 1);
  }, [patientSearchDraft]);

  const filterParams = useMemo(() => {
    if (!departmentId || !isEmergencyDepartment) return null;

    const fromDate = toISODate(dateFilter.fromDate) ?? todayStr;
    const toDate = toISODate(dateFilter.toDate) ?? todayStr;
    const chiefComplaint =
      String(record?.chiefComplain ?? record?.chiefComplaint ?? '').trim() || undefined;
    const normalizedStatusIn = uniqueNonEmpty(statusIn) ?? DEFAULT_STATUS;
    const normalizedEncounterReasons = uniqueNonEmpty(encounterReasons);
    const normalizedPriorities =
      uniqueNonEmpty(priorities) ??
      uniqueNonEmpty(record?.priority ? [record.priority] : undefined);
    const { patientName, mrn } = derivePatientFilters(patientSearchApplied);

    return {
      departmentId: String(departmentId),
      fromDate,
      toDate,
      statusIn: normalizedStatusIn,
      patientName,
      mrn,
      encounterReasons: normalizedEncounterReasons,
      chiefComplaint,
      priorities: normalizedPriorities,
      hasPrescription,
      hasOrder,
      isObserved,
      page,
      size: pageSize,
      sort: DEFAULT_SORT,
      timestamp: searchTick
    };
  }, [
    DEFAULT_STATUS,
    dateFilter.fromDate,
    dateFilter.toDate,
    departmentId,
    encounterReasons,
    hasOrder,
    isObserved,
    page,
    pageSize,
    priorities,
    record,
    statusIn,
    todayStr,
    hasPrescription,
    patientSearchApplied,
    searchTick,
    isEmergencyDepartment
  ]);

  const {
    data: encountersPaged,
    isFetching: isEncountersFetching,
    isLoading: isEncountersLoading,
    refetch: refetchEncounters
  } = useFilterEncountersQuery(filterParams as any, {
    skip: !filterParams
  });

  useEffect(() => {
    if (!isEncountersFetching) {
      setFilterLoading(false);
    }
  }, [isEncountersFetching]);

  const dateRangeCountsSkip = !departmentId || !isEmergencyDepartment;

  const dateRangeCountParams = useMemo(
    () => ({
      departmentId: String(departmentId ?? ''),
      fromDate: toISODate(dateFilter.fromDate) ?? todayStr,
      toDate: toISODate(dateFilter.toDate) ?? todayStr
    }),
    [departmentId, dateFilter.fromDate, dateFilter.toDate, todayStr]
  );

  const { data: totalErPatientsCount } = useCountDepartmentTotalByDateRangeQuery(
    dateRangeCountParams,
    { skip: dateRangeCountsSkip }
  );

  const { data: waitingListCount } = useCountDepartmentWaitingListByDateRangeQuery(
    dateRangeCountParams,
    { skip: dateRangeCountsSkip }
  );

  const { data: triageCount } = useCountDepartmentTriageByDateRangeQuery(dateRangeCountParams, {
    skip: dateRangeCountsSkip
  });

  const { data: dischargedCount } = useCountDepartmentDischargedByDateRangeQuery(
    dateRangeCountParams,
    { skip: dateRangeCountsSkip }
  );

  const tableData = encountersPaged?.data ?? [];
  const totalCount = encountersPaged?.totalCount ?? 0;

  const patientBulkIdsRef = useRef<string[]>([]);
  const [getBulkPatientBasicInfo, { data: patientsBasicInfo, isLoading: patientsBulkLoading }] =
    useGetBulkPatientBasicInfoMutation();

  const patientIdsForBulk = useMemo(() => {
    const ids = (tableData as any[])
      .map(row => row?.patient?.id)
      .filter(v => v !== null && v !== undefined)
      .map(v => String(v));
    return Array.from(new Set(ids));
  }, [tableData]);

  useEffect(() => {
    if (!isEmergencyDepartment || patientIdsForBulk.length === 0) return;
    patientBulkIdsRef.current = patientIdsForBulk;

    getBulkPatientBasicInfo(patientIdsForBulk as any)
      .unwrap()
      .catch(() => {});
  }, [patientIdsForBulk, getBulkPatientBasicInfo, isEmergencyDepartment]);

  const patientMap = useMemo(() => {
    const map = new Map<string, any>();
    const ids = patientBulkIdsRef.current;

    (patientsBasicInfo ?? []).forEach((patient: any, index: number) => {
      const key = patient?.id ?? ids[index];
      if (!key) return;
      map.set(String(key), patient);
    });

    return map;
  }, [patientsBasicInfo]);

  const normalizedTableData = useMemo(() => {
    return (tableData as any[]).map(row => {
      const patientId = row?.patient?.id ?? null;
      const patientFromMap = patientId != null ? patientMap.get(String(patientId)) : null;

      const firstName = String(patientFromMap?.firstName ?? row?.patient?.firstName ?? '').trim();
      const secondName = String(
        patientFromMap?.secondName ?? row?.patient?.secondName ?? ''
      ).trim();
      const thirdName = String(patientFromMap?.thirdName ?? row?.patient?.thirdName ?? '').trim();
      const lastName = String(patientFromMap?.lastName ?? row?.patient?.lastName ?? '').trim();

      const fullName =
        [firstName, secondName, thirdName, lastName].filter(Boolean).join(' ').trim() || '-';

      const mrn = patientFromMap?.medicalRecordNumber ?? row?.patient?.medicalRecordNumber ?? null;
      const dob = patientFromMap?.dateOfBirth ?? row?.patient?.dateOfBirth ?? null;
      const sexAtBirth =
        formatEnumString(patientFromMap?.sexAtBirth ?? row?.patient?.sexAtBirth) || '';
      const isPrivate = patientFromMap?.isPrivatePatient ?? row?.patient?.isPrivatePatient ?? false;

      return {
        ...row,
        key: row?.id,
        patientObject: {
          id: patientId,
          fullName,
          medicalRecordNumber: mrn,
          dateOfBirth: dob,
          sexAtBirth,
          isPrivatePatient: isPrivate
        },
        patientAge: dob ? calculateAgeFormat(dob) : null
      };
    });
  }, [tableData, patientMap]);

  const encounterIdsForLocations = useMemo(() => {
    return Array.from(
      new Set(
        (normalizedTableData ?? [])
          .map((row: any) => row?.id)
          .filter((value: any) => value !== null && value !== undefined)
      )
    );
  }, [normalizedTableData]);

  const {
    data: activeAssignments = [],
    isLoading: isAssignmentsLoading,
    isFetching: isAssignmentsFetching,
    refetch: refetchActiveAssignments
  } = useGetActiveAssignmentsByEncounterIdsQuery(
    { encounterIds: encounterIdsForLocations },
    {
      skip: !isEmergencyDepartment || encounterIdsForLocations.length === 0
    }
  );

  const roomIdsFromAssignments = useMemo(() => {
    return Array.from(
      new Set(
        (activeAssignments ?? [])
          .map((assignment: any) => assignment?.room?.id ?? assignment?.roomId ?? null)
          .filter((value: any) => value !== null && value !== undefined)
      )
    );
  }, [activeAssignments]);

  const bedIdsFromAssignments = useMemo(() => {
    return Array.from(
      new Set(
        (activeAssignments ?? [])
          .map((assignment: any) => assignment?.bed?.id ?? assignment?.bedId ?? null)
          .filter((value: any) => value !== null && value !== undefined)
      )
    );
  }, [activeAssignments]);

  useEffect(() => {
    if (!isEmergencyDepartment || roomIdsFromAssignments.length === 0) return;
    getRoomsByIds({ ids: roomIdsFromAssignments }).catch(() => {});
  }, [isEmergencyDepartment, roomIdsFromAssignments, getRoomsByIds]);

  useEffect(() => {
    if (!isEmergencyDepartment || bedIdsFromAssignments.length === 0) return;
    getBedsByIds({ ids: bedIdsFromAssignments }).catch(() => {});
  }, [isEmergencyDepartment, bedIdsFromAssignments, getBedsByIds]);

  const roomsMap = useMemo(() => {
    const map = new Map<string, any>();
    (roomsByIds ?? []).forEach((room: any) => {
      if (!room?.id) return;
      map.set(String(room.id), room);
    });
    return map;
  }, [roomsByIds]);

  const bedsMap = useMemo(() => {
    const map = new Map<string, any>();
    (bedsByIds ?? []).forEach((bed: any) => {
      if (!bed?.id) return;
      map.set(String(bed.id), bed);
    });
    return map;
  }, [bedsByIds]);

  const activeAssignmentsMap = useMemo(() => {
    const map = new Map<string, any[]>();

    (activeAssignments ?? []).forEach((assignment: any) => {
      const encounterId = assignment?.encounter?.id ?? assignment?.encounterId;
      if (!encounterId) return;

      const key = String(encounterId);
      const currentList = map.get(key) ?? [];
      currentList.push(assignment);
      map.set(key, currentList);
    });

    return map;
  }, [activeAssignments]);

  const enrichedTableData = useMemo(() => {
    return (normalizedTableData ?? []).map((row: any) => {
      const activeAssignmentsForEncounter = activeAssignmentsMap.get(String(row?.id)) ?? [];

      const firstAssignment = activeAssignmentsForEncounter[0] ?? null;
      const roomId = firstAssignment?.room?.id ?? firstAssignment?.roomId ?? null;
      const bedId = firstAssignment?.bed?.id ?? firstAssignment?.bedId ?? null;

      const roomFromApi = roomId != null ? roomsMap.get(String(roomId)) : null;
      const bedFromApi = bedId != null ? bedsMap.get(String(bedId)) : null;

      return {
        ...row,
        activeAssignmentsForEncounter,
        resolvedRoom: roomFromApi,
        resolvedBed: bedFromApi,
        apRoom: roomFromApi?.name
          ? {
              ...(row?.apRoom ?? {}),
              key: roomFromApi?.id ?? row?.apRoom?.key ?? row?.room?.key ?? null,
              name: roomFromApi?.name ?? row?.apRoom?.name ?? row?.room?.name ?? null
            }
          : row?.apRoom,
        apBed: bedFromApi?.name
          ? {
              ...(row?.apBed ?? {}),
              key: bedFromApi?.id ?? row?.apBed?.key ?? row?.bed?.key ?? null,
              name: bedFromApi?.name ?? row?.apBed?.name ?? row?.bed?.name ?? null
            }
          : row?.apBed
      };
    });
  }, [normalizedTableData, activeAssignmentsMap, roomsMap, bedsMap]);

  const handleRefreshAfterBedChange = useCallback(async () => {
    await refetchEncounters();

    const refreshedAssignmentsResult = await refetchActiveAssignments();
    const refreshedAssignments = refreshedAssignmentsResult?.data ?? activeAssignments ?? [];

    const refreshedRoomIds = Array.from(
      new Set(
        (refreshedAssignments as any[])
          .map((assignment: any) => assignment?.room?.id ?? assignment?.roomId ?? null)
          .filter((value: any) => value !== null && value !== undefined)
      )
    );

    const refreshedBedIds = Array.from(
      new Set(
        (refreshedAssignments as any[])
          .map((assignment: any) => assignment?.bed?.id ?? assignment?.bedId ?? null)
          .filter((value: any) => value !== null && value !== undefined)
      )
    );

    if (refreshedRoomIds.length > 0) {
      await getRoomsByIds({ ids: refreshedRoomIds }).unwrap();
    }

    if (refreshedBedIds.length > 0) {
      await getBedsByIds({ ids: refreshedBedIds }).unwrap();
    }
  }, [refetchEncounters, refetchActiveAssignments, getRoomsByIds, getBedsByIds, activeAssignments]);

  const getEncounterId = (row: any) => row?.id ?? null;

  const startEncounterSafe = async (row: any) => {
    const encounterId = getEncounterId(row);
    if (!encounterId) return false;

    try {
      await startEncounter({ id: encounterId }).unwrap();
      return true;
    } catch (error: any) {
      handleCrudError(error, dispatch, ENCOUNTER_ERROR_MAP);
      return false;
    }
  };

  const cancelEncounterSafe = async (row: any) => {
    const encounterId = getEncounterId(row);
    if (!encounterId) return false;

    try {
      await cancelEncounter({ id: encounterId }).unwrap();
      dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
      return true;
    } catch (err: any) {
      const errorMap: Record<string, string> = {
        'error.cancel.notAllowed.rule':
          'Cancellation is not allowed for the current encounter status.',
        'error.cancel.notAllowed.hasObservation': 'Cannot cancel encounter with observations'
      };

      const backendMessage = err?.data?.message;
      const msg = errorMap[backendMessage] || 'Error cancelling encounter';

      dispatch(notify({ msg, sev: 'error' }));
      return false;
    }
  };

  const fetchPatientForEncounter = async (enc: any) => {
    const pid = enc?.patient?.id ?? null;
    if (!pid) return null;

    try {
      const fullPatient = await triggerGetPatientById({ id: pid }).unwrap();
      return fullPatient;
    } catch (e) {
      handleCrudError(e, dispatch, { 'patient.notfound': 'Patient not found.' });
      return null;
    }
  };

  const handleGoToVisit = async (encounterData: any) => {
    const isStarted = await startEncounterSafe(encounterData);
    if (!isStarted) return;

    dispatch(showSystemLoader());
    const fullPatient = await fetchPatientForEncounter(encounterData);
    dispatch(hideSystemLoader());

    if (!fullPatient) {
      dispatch(notify({ msg: 'Failed to load patient data.', sev: 'error' }));
      return;
    }

    dispatch(setEncounter(encounterData));
    dispatch(setPatient(fullPatient));

    const privatePatientPath = '/user-access-patient-private';
    const encounterPath = '/encounter';
    const targetPath = fullPatient.isPrivatePatient ? privatePatientPath : encounterPath;

    navigate(targetPath, {
      state: {
        info: 'toEncounter',
        fromPage: 'Urgent_Care_List',
        patient: fullPatient,
        encounter: encounterData
      }
    });

    sessionStorage.setItem('encounterPageSource', 'EncounterList');
  };

  const handleGoToNurseStation = async (encounterData: any) => {
    const isStarted = await startEncounterSafe(encounterData);
    if (!isStarted) return;

    dispatch(showSystemLoader());
    const fullPatient = await fetchPatientForEncounter(encounterData);
    dispatch(hideSystemLoader());

    if (!fullPatient) {
      dispatch(notify({ msg: 'Failed to load patient data.', sev: 'error' }));
      return;
    }

    dispatch(setEncounter(encounterData));
    dispatch(setPatient(fullPatient));
    sessionStorage.setItem('encounterPageSource', 'Urgent_Care_List');
    const targetPath = fullPatient?.isPrivatePatient
      ? '/user-access-patient-private'
      : '/nurse-station';

    navigate(targetPath, {
      state: {
        info: fullPatient?.isPrivatePatient ? 'toNurse' : 'toNurseStation',
        fromPage: 'Urgent_Care_List',
        patient: fullPatient,
        encounter: encounterData,
        edit: String(encounterData?.status ?? '').toUpperCase() === 'CLOSED'
      }
    });
  };

  const handleCancelEncounter = async () => {
    if (!encounter) return;

    const isCancelled = await cancelEncounterSafe(encounter);
    if (!isCancelled) return;

    refetchEncounters();
    setOpen(false);
  };

  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleGoToViewTriage = (encounterData: any, patientData: any) => {
    navigate('/urgent-care-view-triage', {
      state: {
        from: 'Urgent_Care_List',
        info: 'toUrgentCareViewTriage',
        patient: patientData,
        encounter: encounterData
      }
    });
  };

  const handleClearFilters = () => {
    const now = new Date();
    const lastWeekDate = new Date(now);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);

    setFilterLoading(true);
    setRecord({});
    setDateFilter({ fromDate: lastWeekDate, toDate: now });
    setStatusIn(DEFAULT_STATUS);
    setEncounterReasons([]);
    setPriorities([]);
    setHasPrescription(undefined);
    setHasOrder(undefined);
    setIsObserved(undefined);

    const clearedSearch = { searchByField: 'fullName', patientName: '' };
    setPatientSearchDraft(clearedSearch);
    setPatientSearchApplied(clearedSearch);

    setPage(0);
    setSearchTick(prev => prev + 1);
  };

  const tableColumns = [
    {
      key: 'encounterNumber',
      title: '#',
      render: (row: any) => row?.encounterNumber ?? row?.departmentDailySequenceNumber ?? row?.id
    },
    {
      key: 'patientFullName',
      title: 'PATIENT NAME',
      fullText: true,
      render: (row: any) => {
        const speaker = (
          <Tooltip>
            <div>MRN: {row?.patientObject?.medicalRecordNumber ?? '-'}</div>
            <div>Age: {row?.patientAge ?? '-'}</div>
            <div>Gender: {row?.patientObject?.sexAtBirth ?? '-'}</div>
          </Tooltip>
        );

        return (
          <Whisper trigger="hover" placement="top" speaker={speaker}>
            <div className="encounter-list__patient-name-cell">
              {row?.patientObject?.isPrivatePatient ? (
                <Badge color="blue" content="Private">
                  <p className="encounter-list__patient-name encounter-list__patient-name--clickable">
                    {row?.patientObject?.fullName}
                  </p>
                </Badge>
              ) : (
                <p className="encounter-list__patient-name encounter-list__patient-name--clickable">
                  {row?.patientObject?.fullName}
                </p>
              )}
            </div>
          </Whisper>
        );
      }
    },
    {
      key: 'encounterReason',
      title: 'ENCOUNTER REASON',
      render: (row: any) => formatEnumString(row?.encounterReason) ?? ''
    },
    {
      key: 'chiefComplaint',
      title: 'CHIEF COMPLAIN',
      render: (row: any) => row?.chiefComplaint ?? '-'
    },
    {
      key: 'location',
      title: 'LOCATION',
      render: (row: any) => {
        const statusUpper = String(row?.status ?? '').toUpperCase();

        if (statusUpper === 'DISCHARGED') {
          return <span className="location-table-style">Discharged</span>;
        }

        if (statusUpper === 'CLOSED') {
          return <span className="location-table-style">Closed</span>;
        }

        const assignments = row?.activeAssignmentsForEncounter ?? [];

        const speaker = (
          <Tooltip>
            {assignments.length > 0 ? (
              assignments.map((assignment: any, index: number) => {
                const roomId = assignment?.room?.id ?? assignment?.roomId ?? null;
                const bedId = assignment?.bed?.id ?? assignment?.bedId ?? null;

                const room = roomId != null ? roomsMap.get(String(roomId)) : null;
                const bed = bedId != null ? bedsMap.get(String(bedId)) : null;

                return (
                  <div key={assignment?.id ?? index}>
                    Room {assignments.length > 1 ? index + 1 : ''}:{' '}
                    {room?.name ?? assignment?.room?.name ?? '-'}
                    <br />
                    Bed {assignments.length > 1 ? index + 1 : ''}:{' '}
                    {bed?.name ?? assignment?.bed?.name ?? '-'}
                    <br />
                    Admission Reason {assignments.length > 1 ? index + 1 : ''}:{' '}
                    {assignment?.admissionReason ?? '-'}
                  </div>
                );
              })
            ) : (
              <div>Admission Reason: -</div>
            )}
          </Tooltip>
        );

        const firstAssignment = assignments[0] ?? null;
        const firstRoomId = firstAssignment?.room?.id ?? firstAssignment?.roomId ?? null;
        const firstBedId = firstAssignment?.bed?.id ?? firstAssignment?.bedId ?? null;

        const firstRoom = firstRoomId != null ? roomsMap.get(String(firstRoomId)) : null;
        const firstBed = firstBedId != null ? bedsMap.get(String(firstBedId)) : null;

        return (
          <Whisper trigger="hover" placement="top" speaker={speaker}>
            <span className="location-table-style">
              {firstRoom?.name ?? row?.apRoom?.name ?? row?.room?.name ?? '-'}
              <br />
              {firstBed?.name ?? row?.apBed?.name ?? row?.bed?.name ?? '-'}
            </span>
          </Whisper>
        );
      }
    },
    {
      key: 'hasPrescription',
      title: 'PRESCRIPTION',
      render: (row: any) =>
        row?.hasPrescription ? (
          <MyBadgeStatus contant="YES" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="NO" color="#969fb0" />
        )
    },
    {
      key: 'hasOrder',
      title: 'HAS ORDER',
      render: (row: any) =>
        row?.hasOrder ? (
          <MyBadgeStatus contant="YES" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="NO" color="#969fb0" />
        )
    },
    {
      key: 'priorityLevel',
      title: 'PRIORITY',
      render: (row: any) => formatEnumString(row?.priorityLevel) ?? ''
    },
    {
      key: 'encounterDate',
      title: 'DATE',
      render: (row: any) => row?.encounterDate ?? row?.plannedStartDate ?? '-'
    },
    {
      key: 'startedDate',
      title: 'STARTED DATE',
      expandable: true,

      render: (row: any) => {
        const raw = row?.startedDate;
        if (!raw) return '-';
        const d = new Date(raw);
        return isNaN(d.getTime()) ? raw : d.toLocaleString();
      }
    },
    {
      key: 'startedBy',
      title: 'STARTED BY',
      expandable: true,
      render: (row: any) => row?.startedBy ?? '-'
    },
    {
      key: 'status',
      title: 'STATUS',
      render: (row: any) => {
        const statusUpper = String(row?.status ?? '').toUpperCase();

        const statusColorMap: Record<string, string> = {
          NEW: '#0d6efd',
          ONGOING: '#198754',
          CANCELED: '#ffc107',
          CANCELLED: '#ffc107',
          CLOSED: '#6c757d',
          DISCHARGED: '#adb5bd',
          PENDING_PAYMENT: '#fd7e14'
        };

        return (
          <MyBadgeStatus
            color={statusColorMap[statusUpper] ?? '#969fb0'}
            contant={formatEnumString(row?.status) ?? row?.status ?? ''}
          />
        );
      }
    },
    {
      key: 'actions',
      title: ' ',
      render: (row: any) => {
        const tooltipDoctor = <Tooltip>Go to Visit</Tooltip>;
        const tooltipEMR = <Tooltip>Go to EMR</Tooltip>;
        const tooltipChangeBed = <Tooltip>Change Bed</Tooltip>;
        const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;
        const tooltipTriage = <Tooltip>View Triage</Tooltip>;
        const tooltipNurse = <Tooltip>Nurse Station</Tooltip>;
        const statusUpper = String(row?.status ?? '').toUpperCase();
        const isNew = statusUpper === 'NEW';

        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            <Whisper trigger="hover" placement="top" speaker={tooltipTriage}>
              <div>
                <MyButton
                  size="small"
                  onClick={() => {
                    const patient = row?.patientObject;
                    setLocalEncounter(row);
                    handleGoToViewTriage(row, patient);
                  }}
                >
                  <FontAwesomeIcon icon={faCommentMedical} />
                </MyButton>
              </div>
            </Whisper>

            <Whisper trigger="hover" placement="top" speaker={tooltipDoctor}>
              <div>
                <MyButton
                  size="small"
                  onClick={() => {
                    setLocalEncounter(row);
                    handleGoToVisit(row);
                  }}
                >
                  <FontAwesomeIcon icon={faUserDoctor} />
                </MyButton>
              </div>
            </Whisper>

            <Whisper trigger="hover" placement="top" speaker={tooltipNurse}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="black"
                  onClick={() => {
                    setLocalEncounter(row);
                    setLocalPatient(row?.patientObject ?? { ...newPatient });
                    setOpenNurseAssessment(true);
                  }}
                >
                  <FontAwesomeIcon icon={faUserNurse} />
                </MyButton>
              </div>
            </Whisper>

            {statusUpper !== 'CLOSED' &&
              statusUpper !== 'DISCHARGED' &&
              statusUpper !== 'CANCELLED' && (
                <Whisper trigger="hover" placement="top" speaker={tooltipChangeBed}>
                  <div>
                    <MyButton
                      size="small"
                      backgroundColor="gray"
                      onClick={() => {
                        setLocalEncounter(row);
                        setLocalPatient(row?.patientObject ?? { ...newPatient });
                        setOpenChangeBedModal(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faBed} />
                    </MyButton>
                  </div>
                </Whisper>
              )}

            <Whisper trigger="hover" placement="top" speaker={tooltipEMR}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="violet"
                  onClick={() => {
                    setLocalEncounter(row);
                    setEmrEncounter(row);
                    setEmrPatient(row?.patientObject ?? null);
                    dispatch(setEncounter(row));
                    if (row?.patientObject) dispatch(setPatient(row.patientObject));
                    setOpenEMRModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faFileWaveform} />
                </MyButton>
              </div>
            </Whisper>

            {isNew && (
              <Whisper trigger="hover" placement="top" speaker={tooltipCancel}>
                <div>
                  <MyButton
                    size="small"
                    onClick={() => {
                      setLocalEncounter(row);
                      setOpen(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faRectangleXmark} />
                  </MyButton>
                </div>
              </Whisper>
            )}
          </Form>
        );
      },
      expandable: false
    }
  ];

  const filters = () => (
    <>
      <Form layout="inline" fluid className="date-filter-form">
        <MyInput
          column
          width={180}
          fieldType="date"
          fieldLabel="From Date"
          fieldName="fromDate"
          record={dateFilter}
          setRecord={v => {
            setFilterLoading(true);
            setDateFilter(v);
            setPage(0);
          }}
        />

        <MyInput
          column
          width={180}
          fieldType="date"
          fieldLabel="To Date"
          fieldName="toDate"
          record={dateFilter}
          setRecord={v => {
            setFilterLoading(true);
            setDateFilter(v);
            setPage(0);
          }}
        />

        <SearchPatientCriteria
          record={patientSearchDraft}
          setRecord={setPatientSearchDraft}
          onSearchClick={handlePatientSearchClick}
        />

        <MyInput
          column
          width={260}
          fieldType="checkPicker"
          fieldLabel="Encounter Status"
          fieldName="statusIn"
          selectData={EncounterStatusEnum}
          selectDataLabel="label"
          selectDataValue="value"
          record={{ statusIn }}
          setRecord={(v: any) => {
            setFilterLoading(true);
            setStatusIn(Array.isArray(v?.statusIn) ? v.statusIn : []);
            setPage(0);
          }}
        />
      </Form>

      <AdvancedSearchFilters
        searchFilter={true}
        clearOnClick={handleClearFilters}
        content={
          <div className="advanced-filters">
            <Form key={JSON.stringify(record)} fluid className="dissss">
              <MyInput
                fieldName="encounterReasons"
                fieldType="checkPicker"
                selectData={EncounterReasonEnum}
                selectDataLabel="label"
                selectDataValue="value"
                fieldLabel="Encounter Reason"
                record={{ encounterReasons }}
                setRecord={(v: any) => {
                  setFilterLoading(true);
                  const raw = Array.isArray(v) ? v : v?.encounterReasons;
                  setEncounterReasons(Array.isArray(raw) ? raw.map(String).filter(Boolean) : []);
                  setPage(0);
                }}
                searchable
                width={220}
              />

              <MyInput
                width={200}
                fieldName="chiefComplain"
                fieldType="text"
                record={record}
                setRecord={v => {
                  setFilterLoading(true);
                  setRecord(v);
                  setPage(0);
                }}
                fieldLabel="Chief Complain"
              />

              <MyInput
                width={200}
                fieldName="priorities"
                fieldType="checkPicker"
                record={{ priorities }}
                setRecord={(v: any) => {
                  setFilterLoading(true);
                  setPriorities(Array.isArray(v?.priorities) ? v.priorities : []);
                  setPage(0);
                }}
                selectData={EncounterPriorityEnum}
                selectDataLabel="label"
                selectDataValue="value"
                placeholder="Select Priority"
                fieldLabel="Priority"
                searchable={true}
              />
            </Form>
          </div>
        }
      />
    </>
  );

  const tableLoading =
    filterLoading ||
    isDepartmentFetching ||
    isEncountersLoading ||
    isEncountersFetching ||
    patientsBulkLoading ||
    isAssignmentsLoading ||
    isAssignmentsFetching ||
    isRoomsByIdsLoading ||
    isBedsByIdsLoading;

  if (!departmentId) {
    return (
      <Panel>
        <div className="encounter-list__no-department">
          <p>Please select a department to view encounters.</p>
        </div>
      </Panel>
    );
  }

  // if (!isDepartmentFetching && departmentData && !isEmergencyDepartment) {
  //   return (
  //     <Panel>
  //       <div className="encounter-list__no-department">
  //         <p>
  //           User Current Department should be Emergency to View This Screen, so no ER encounters are
  //           available.
  //         </p>
  //       </div>
  //     </Panel>
  //   );
  // }

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <div className="inpatient-list-btns">
        <MyButton
          onClick={() => setOpenBedManagementModal(true)}
          disabled={!departmentId || !isEmergencyDepartment}
          prefixIcon={() => <FontAwesomeIcon icon={faBedPulse} />}
        >
          Bed Management
        </MyButton>
      </div>

      <div className="count-div-on-top-of-page-visit-list">
        <DetailsCard
          title="Total ER Patient"
          number={totalErPatientsCount ?? 0}
          color="--primary-blue"
          backgroundClassName="result-ready-section"
          position="center"
          width="15vw"
        />
        <DetailsCard
          title="Patients in waiting list"
          number={waitingListCount ?? 0}
          color="--green-600"
          backgroundClassName="sample-collected-section"
          position="center"
          width="15vw"
        />
        <DetailsCard
          title="In Triage List"
          number={triageCount ?? 0}
          color="--primary-purple"
          backgroundClassName="new-section"
          position="center"
          width="15vw"
        />
        <DetailsCard
          title="Discharged"
          number={dischargedCount ?? 0}
          color="--primary-yellow"
          backgroundClassName="total-test-section"
          position="center"
          width="15vw"
        />
      </div>

      <MyTable
        filters={filters()}
        height={600}
        data={enrichedTableData}
        columns={tableColumns}
        rowClassName={(row: any) =>
          row && encounter && row.key === encounter.key ? 'selected-row' : ''
        }
        loading={tableLoading}
        onRowClick={(row: any) => {
          setLocalEncounter(row);
          setLocalPatient(row?.patientObject ?? { ...newPatient });
        }}
        page={page}
        rowsPerPage={pageSize}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <ChangeBedModal
        open={openChangeBedModal}
        setOpen={setOpenChangeBedModal}
        localEncounter={encounter}
        refetchInpatientList={handleRefreshAfterBedChange}
      />

      <BedManagementModal
        open={openBedManagementModal}
        setOpen={setOpenBedManagementModal}
        departmentKey={String(departmentId)}
      />

      <TransferPatientModal
        open={openTransferPatientModal}
        setOpen={setOpenTransferPatientModal}
        localEncounter={encounter}
        refetchInpatientList={refetchEncounters}
      />

      <MyModal
        open={openRefillModal}
        setOpen={setOpenRefillModal}
        title="Refill"
        size="90vw"
        content={
          <div dir={dir}>
            <RefillModalComponent />
          </div>
        }
        hideActionBtn={true}
        cancelButtonLabel="Close"
      />

      <DeletionConfirmationModal
        open={open}
        setOpen={setOpen}
        actionButtonFunction={handleCancelEncounter}
        actionType="Deactivate"
        confirmationQuestion="Do you want to cancel this Encounter?"
        actionButtonLabel="Cancel"
        cancelButtonLabel="Close"
      />

      <MyModal
        open={openPhysicianOrderSummaryModal}
        setOpen={setOpenPhysicianOrderSummaryModal}
        title="Task Management"
        size="90vw"
        content={
          <div dir={dir}>
            <PhysicianOrderSummaryModal />
          </div>
        }
        actionButtonLabel="Save"
        cancelButtonLabel="Close"
      />

      <MyModal
        open={openEncounterLogsModal}
        setOpen={setOpenEncounterLogsModal}
        title="Encounter Logs"
        size="70vw"
        content={
          <div dir={dir}>
            <EncounterLogsTable />
          </div>
        }
        actionButtonLabel="Close"
        actionButtonFunction={() => setOpenEncounterLogsModal(false)}
        cancelButtonLabel="Cancel"
      />

      <MyModal
        open={openEMRModal}
        setOpen={setOpenEMRModal}
        title="Electronic Medical Record"
        size="90vw"
        content={
          emrPatient && emrEncounter ? (
            <div dir={dir}>
              <PatientEMRModal patient={emrPatient} encounter={emrEncounter} />
            </div>
          ) : (
            <div className="encounter-list__no-patient">No patient selected.</div>
          )
        }
        actionButtonLabel="Close"
        actionButtonFunction={() => setOpenEMRModal(false)}
        cancelButtonLabel="Cancel"
      />

      <DeletionConfirmationModal
        open={openNurseAssessment}
        setOpen={setOpenNurseAssessment}
        actionButtonFunction={async () => {
          await handleGoToNurseStation(encounter);
          setOpenNurseAssessment(false);
        }}
        actionType="confirm"
        confirmationQuestion="Do you want to start Nurse Assessment?"
        actionButtonLabel="Start"
        cancelButtonLabel="Close"
      />
    </Panel>
  );
};

export default UrgentCareList;
