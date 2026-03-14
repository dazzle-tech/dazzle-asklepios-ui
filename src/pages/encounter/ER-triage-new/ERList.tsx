import MyInput from '@/components/MyInput';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserDoctor,
  faFileWaveform,
  faRectangleXmark,
  faBed,
  faBedPulse
} from '@fortawesome/free-solid-svg-icons';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { Badge, Form, Panel, Tooltip, Whisper } from 'rsuite';
import RefillModalComponent from '@/pages/Inpatient/departmentStock/refill-component';
import 'react-tabs/style/react-tabs.css';
import { calculateAgeFormat, formatDate, formatEnumString } from '@/utils';
import MyModal from '@/components/MyModal/MyModal';
import { useDispatch } from 'react-redux';
import './styles.less';
import { hideSystemLoader, showSystemLoader, notify } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import PhysicianOrderSummaryModal from '@/pages/encounter/encounter-component/physician-order-summary/physician-order-summary-component/PhysicianOrderSummaryComponent';
import EncounterLogsTable from '@/pages/Inpatient/inpatientList/EncounterLogsTable';
import PatientEMRModal from '@/pages/patient/patient-emr/PatientEMRModal';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import BedManagementModal from '@/pages/Inpatient/inpatientList/bedBedManagementModal';
import ChangeBedModal from '@/pages/Inpatient/inpatientList/changeBedModal';
import TransferPatientModal from '@/pages/Inpatient/inpatientList/transferPatient';
import { useGetEncounterLocationsQuery } from '@/services/encounterService';
import { useNavigate } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';

import {
  useFilterEncountersQuery,
  useStartEncounterMutation,
  useCancelEncounterMutation
} from '@/services/encounters/patientEncounterService';

import { useEnumOptions } from '@/services/enumsApi';
import {
  useGetBulkPatientBasicInfoMutation,
  useLazyGetPatientByIdQuery
} from '@/services/patient/patientService';
import { useLazyGetDepartmentByIdQuery } from '@/services/security/departmentService';
import { useAppSelector } from '@/hooks';
import { newPatient, newPatientEncounter } from '@/types/model-types-constructor-new';
import { Patient } from '@/types/model-types-new';

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
  'cancel.notAllowed.rule': 'Cancel is allowed only when status is NEW and isObserved is false.',
  'followUpEncounter.required.byReason':
    'Follow-up encounter is required when reason is FOLLOW_UP (and must be empty otherwise).',
  'followUpEncounter.notfound': 'Follow-up encounter not found.',
  'encounterNumber.duplicate': 'Encounter number already exists.',
  'patient.department.date.duplicate':
    'This patient already has an encounter for this department on this date.',
  'department.date.sequence.duplicate':
    'Department daily sequence number already exists for this date.',
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
  chiefComplaint: 'Chief Complaint',
  hasOrder: 'Has Orders',
  hasPrescription: 'Has Prescription',
  isObserved: 'Is Observed'
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

const ERList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const departmentId = selectedDepartment?.departmentId ?? selectedDepartment?.id;

  useEffect(() => {
    dispatch(setPageCode('ER_Patient_Encounters'));
    dispatch(setDivContent('ER Department'));

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

  const [open, setOpen] = useState(false);
  const [openRefillModal, setOpenRefillModal] = useState(false);
  const [openPhysicianOrderSummaryModal, setOpenPhysicianOrderSummaryModal] = useState(false);
  const [openEncounterLogsModal, setOpenEncounterLogsModal] = useState(false);
  const [openEMRModal, setOpenEMRModal] = useState(false);
  const [openChangeBedModal, setOpenChangeBedModal] = useState(false);
  const [openBedManagementModal, setOpenBedManagementModal] = useState(false);
  const [openTransferPatientModal, setOpenTransferPatientModal] = useState(false);

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

  useEffect(() => {
    if (!departmentId) return;
    triggerGetDepartmentById(Number(departmentId)).catch(() => {});
  }, [departmentId, triggerGetDepartmentById]);

  const isEmergencyDepartment = useMemo(() => {
    return String(departmentData?.encounterType ?? '').toUpperCase() === 'EMERGENCY';
  }, [departmentData]);

  const handlePatientSearchClick = useCallback(() => {
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
      uniqueNonEmpty(priorities) ?? uniqueNonEmpty(record?.priority ? [record.priority] : undefined);
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
          .filter(v => v !== null && v !== undefined)
          .map(v => String(v))
      )
    );
  }, [normalizedTableData]);

  const {
    data: encounterLocations = [],
    isLoading: isLocationsLoading,
    isFetching: isLocationsFetching,
    refetch: refetchEncounterLocations
  } = useGetEncounterLocationsQuery(encounterIdsForLocations, {
    skip: !isEmergencyDepartment || encounterIdsForLocations.length === 0
  });

  const locationMap = useMemo(() => {
    const map = new Map<string, any>();
    (encounterLocations ?? []).forEach((item: any) => {
      const encounterId = item?.encounterId;
      if (!encounterId) return;
      map.set(String(encounterId), item);
    });
    return map;
  }, [encounterLocations]);

  const enrichedTableData = useMemo(() => {
    return (normalizedTableData ?? []).map((row: any) => {
      const location = locationMap.get(String(row?.id));

      return {
        ...row,
        encounterLocation: location ?? null,
        apRoom:
          location?.roomKey || location?.roomName
            ? {
                ...(row?.apRoom ?? {}),
                key: location?.roomKey ?? row?.apRoom?.key ?? row?.room?.key ?? null,
                name: location?.roomName ?? row?.apRoom?.name ?? row?.room?.name ?? null
              }
            : row?.apRoom,
        apBed:
          location?.bedKey || location?.bedName
            ? {
                ...(row?.apBed ?? {}),
                key: location?.bedKey ?? row?.apBed?.key ?? row?.bed?.key ?? null,
                name: location?.bedName ?? row?.apBed?.name ?? row?.bed?.name ?? null
              }
            : row?.apBed
      };
    });
  }, [normalizedTableData, locationMap]);

  const handleRefreshAfterBedChange = useCallback(async () => {
    await refetchEncounters();
    if (encounterIdsForLocations.length > 0) {
      await refetchEncounterLocations();
    }
  }, [refetchEncounters, refetchEncounterLocations, encounterIdsForLocations.length]);

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
    } catch (error: any) {
      handleCrudError(error, dispatch, ENCOUNTER_ERROR_MAP);
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
        fromPage: 'ER_Department',
        patient: fullPatient,
        encounter: encounterData
      }
    });

    sessionStorage.setItem('encounterPageSource', 'EncounterList');
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

  const prevChangeBedOpenRef = useRef(false);

  useEffect(() => {
    if (prevChangeBedOpenRef.current && !openChangeBedModal) {
      refetchEncounters();
    }
    prevChangeBedOpenRef.current = openChangeBedModal;
  }, [openChangeBedModal, refetchEncounters]);

  const handleClearFilters = () => {
    const now = new Date();
    const lastWeekDate = new Date(now);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
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
      render: (row: any) => (
        <span className="location-table-style">
          {row?.encounterLocation?.roomName ?? row?.apRoom?.name ?? row?.room?.name ?? '-'}
          <br />
          {row?.encounterLocation?.bedName ?? row?.apBed?.name ?? row?.bed?.name ?? '-'}
        </span>
      )
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
      key: 'isObserved',
      title: 'IS OBSERVED',
      render: (row: any) =>
        row?.isObserved ? (
          <MyBadgeStatus contant="YES" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="NO" color="#969fb0" />
        )
    },
    {
      key: 'actions',
      title: ' ',
      render: (row: any) => {
        const tooltipDoctor = <Tooltip>Go to Visit</Tooltip>;
        const tooltipEMR = <Tooltip>Go to EMR</Tooltip>;
        const tooltipChangeBed = <Tooltip>Change Bed</Tooltip>;
        const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;

        const statusUpper = String(row?.status ?? '').toUpperCase();
        const isNew = statusUpper === 'NEW';

        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
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
                  setRecord(v);
                  setPage(0);
                }}
                fieldLabel="Chief Complain"
              />

              <MyInput
                width={130}
                fieldName="hasPrescription"
                fieldType="checkbox"
                record={{ hasPrescription: !!hasPrescription }}
                setRecord={(v: any) => {
                  setHasPrescription(v?.hasPrescription ? true : undefined);
                  setPage(0);
                }}
                label="Has Prescription"
              />

              <MyInput
                width={110}
                fieldName="hasOrder"
                fieldType="checkbox"
                record={{ hasOrder: !!hasOrder }}
                setRecord={(v: any) => {
                  setHasOrder(v?.hasOrder ? true : undefined);
                  setPage(0);
                }}
                label="Has Orders"
              />

              <MyInput
                width={110}
                fieldName="isObserved"
                fieldType="checkbox"
                record={{ isObserved: !!isObserved }}
                setRecord={(v: any) => {
                  setIsObserved(v?.isObserved ? true : undefined);
                  setPage(0);
                }}
                label="Is Observed"
              />

              <MyInput
                width={200}
                fieldName="priorities"
                fieldType="checkPicker"
                record={{ priorities }}
                setRecord={(v: any) => {
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
    isDepartmentFetching ||
    isEncountersLoading ||
    isEncountersFetching ||
    patientsBulkLoading ||
    isLocationsLoading ||
    isLocationsFetching;

  useEffect(() => {
    if (tableLoading) dispatch(showSystemLoader());
    else dispatch(hideSystemLoader());

    return () => {
      dispatch(hideSystemLoader());
    };
  }, [dispatch, tableLoading]);

  if (!departmentId) {
    return (
      <Panel>
        <div className="encounter-list__no-department">
          <p>Please select a department to view encounters.</p>
        </div>
      </Panel>
    );
  }

  if (!isDepartmentFetching && departmentData && !isEmergencyDepartment) {
    return (
      <Panel>
        <div className="encounter-list__no-department">
          <p>User Current Department should be Emergency to View This Screen, so no ER encounters are available.</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="inpatient-list-btns">
        <MyButton
          onClick={() => setOpenBedManagementModal(true)}
          disabled={!departmentId || !isEmergencyDepartment}
          prefixIcon={() => <FontAwesomeIcon icon={faBedPulse} />}
        >
          Bed Management
        </MyButton>
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
        content={<RefillModalComponent />}
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
        content={<PhysicianOrderSummaryModal />}
        actionButtonLabel="Save"
        cancelButtonLabel="Close"
      />

      <MyModal
        open={openEncounterLogsModal}
        setOpen={setOpenEncounterLogsModal}
        title="Encounter Logs"
        size="70vw"
        content={<EncounterLogsTable />}
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
            <PatientEMRModal patient={emrPatient} encounter={emrEncounter} />
          ) : (
            <div className="encounter-list__no-patient">No patient selected.</div>
          )
        }
        actionButtonLabel="Close"
        actionButtonFunction={() => setOpenEMRModal(false)}
        cancelButtonLabel="Cancel"
      />
    </Panel>
  );
};

export default ERList;