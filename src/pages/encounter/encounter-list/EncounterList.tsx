import MyInput from '@/components/MyInput';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { newApEncounter } from '@/types/model-types-constructor';
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserNurse,
  faUserDoctor,
  faPrint,
  faFileWaveform,
  faRectangleXmark,
  faEye,
  faVialCircleCheck
} from '@fortawesome/free-solid-svg-icons';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { Badge, Form, Panel, Tooltip, Whisper } from 'rsuite';
import RefillModalComponent from '@/pages/Inpatient/departmentStock/refill-component';
import 'react-tabs/style/react-tabs.css';
import { calculateAgeFormat, formatDate, formatEnumString } from '@/utils';
import {
  getEncounterTreatmentStatus,
  isEncounterAlreadyOngoingError,
  shouldSkipEncounterStart
} from '@/utils/encounterStatusHelpers';
import DetailsCard from '@/components/DetailsCard';
import MyModal from '@/components/MyModal/MyModal';
import { useDispatch } from 'react-redux';
import './styles.less';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import UserDateCell from '@/components/UserDateCell';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import PhysicianOrderSummaryModal from '@/pages/encounter/encounter-component/physician-order-summary/physician-order-summary-component/PhysicianOrderSummaryComponent';
import EncounterLogsTable from '@/pages/Inpatient/inpatientList/EncounterLogsTable';
import PatientEMRModal from '@/pages/patient/patient-emr/PatientEMRModal';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';

import { useLocation, useNavigate } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { setSelectedDepartment } from '@/reducers/authSlice';

import {
  useFilterEncountersQuery,
  useCountTodayDepartmentTotalPatientsQuery,
  useCountTodayDepartmentActiveCasesQuery,
  useCountTodayDepartmentCompletedQuery,
  useCountTodayDepartmentCancelledQuery,
  useStartEncounterMutation,
  useCancelEncounterMutation
} from '@/services/encounters/patientEncounterService';

import { useAppSelector } from '@/hooks';
import { useEnumOptions } from '@/services/enumsApi';

import {
  useGetBulkPatientBasicInfoMutation,
  useLazyGetPatientByIdQuery
} from '@/services/patient/patientService';
import {
  useSearchAppointmentsQuery,
  useGetAppointmentLogsQuery
} from '@/services/appointment/appointmentService';
import { useLazyGetVisitReportPdfQuery } from '@/services/observationServiceNew';
import { useGetActiveUserDepartmentsByUserQuery } from '@/services/security/userDepartmentsService';
import { useGetDepartmentsBulkMutation } from '@/services/security/departmentService';
// NEW: same practitioner-by-department hook used in AddResourceModal
import { useGetPractitionerByUserIdQuery, useLazyGetPractitionerByDepartmentQuery } from '@/services/setup/practitioner/PractitionerService';
import VisitReportPrintButton from './VisitReportPrintButton';
import ApprovedResultsCell from './ApprovedResultsCell';
import DoctorAppoitmentsView from './appointments';
import Translate from '@/components/Translate';
import CollectSambleModal from '@/pages/appointments-new/scheduling-screen/components/CollectSambleModal/CollectSambleModal';

// import '@/pages/patient/patient-emr/emr-tables/modal-view-only.less';
const PENDING_ENCOUNTER_ACTION_KEY = 'encounter-list.pending-encounter-action';

type EncounterAction = 'goToVisit' | 'viewVisit' | 'diagnosticsResults' | 'preVisitObservations';

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
      mrn: undefined as string | undefined,
      primaryMobileNumber: undefined as string | undefined,
      documentNumber: undefined as string | undefined,
      dateOfBirth: undefined as string | undefined
    };
  }

  if (searchByField === 'patientMrn') {
    return {
      patientName: undefined,
      mrn: raw,
      primaryMobileNumber: undefined,
      documentNumber: undefined,
      dateOfBirth: undefined
    };
  }

  if (searchByField === 'phoneNumber') {
    return {
      patientName: undefined,
      mrn: undefined,
      primaryMobileNumber: raw,
      documentNumber: undefined,
      dateOfBirth: undefined
    };
  }

  if (searchByField === 'documentNumber') {
    return {
      patientName: undefined,
      mrn: undefined,
      primaryMobileNumber: undefined,
      documentNumber: raw,
      dateOfBirth: undefined
    };
  }

  if (searchByField === 'dob') {
    return {
      patientName: undefined,
      mrn: undefined,
      primaryMobileNumber: undefined,
      documentNumber: undefined,
      dateOfBirth: raw
    };
  }

  return {
    patientName: raw,
    mrn: undefined,
    primaryMobileNumber: undefined,
    documentNumber: undefined,
    dateOfBirth: undefined
  };
};

const ENCOUNTER_ERROR_MAP: Record<string, string> = {
  'id.notfound': 'Encounter not found.',
  'patient.notfound': 'Patient not found.',
  'startedBy.practitioner.notFound':
    'Your user account is not linked to a practitioner profile. Ask an administrator to link your account before starting encounters.',
  'startedBy.practitioner.validationFailed':
    'Unable to validate practitioner profile for the current user.',
  'startedBy.notDoctor': 'Only physician accounts can start clinical encounters.',
  'patient.hasOngoing.notAllowed':
    'Patient already has an ongoing encounter. Starting another one is not allowed.',
  'cancel.notAllowed.rule': 'Cancellation is not allowed for the current encounter status.',
  'followUpEncounter.required.byReason':
    'Follow-up encounter is required when reason is FOLLOW_UP (and must be empty otherwise).',
  'followUpEncounter.notfound': 'Follow-up encounter not found.',
  'encounterNumber.duplicate': 'Encounter number already exists.',
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

const safeFormatDateModule = (value: any) => {
  if (!value) return '';
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';
    const formattedDate = date.toLocaleDateString('en-GB');
    const formattedTime = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${formattedDate} ${formattedTime}`;
  } catch {
    return '';
  }
};

type AppointmentTimeKind = 'appointment' | 'confirm' | 'checkin';

const AppointmentLogTimeCell: React.FC<{
  appointmentId: number | string | null | undefined;
  kind: AppointmentTimeKind;
}> = ({ appointmentId, kind }) => {
  const { data: logs } = useGetAppointmentLogsQuery(
    { appointmentId: appointmentId as number },
    { skip: !appointmentId }
  );

  if (!appointmentId) return <>-</>;
  if (!logs || logs.length === 0) return <>-</>;

  const ascending = [...logs].reverse();

  if (kind === 'appointment') {
    return <>{safeFormatDateModule(ascending[0]?.startDatetime) || '-'}</>;
  }

  if (kind === 'confirm') {
    const log = ascending.find((l: any) => String(l?.status ?? '').toUpperCase() === 'CONFIRMED');
    return <>{log ? safeFormatDateModule(log.logDate) : '-'}</>;
  }

  if (kind === 'checkin') {
    const log = ascending.find((l: any) => String(l?.status ?? '').toUpperCase() === 'CHECKED_IN');
    return <>{log ? safeFormatDateModule(log.logDate) : '-'}</>;
  }

  return <>-</>;
};

const EncounterList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const departmentId = selectedDepartment?.departmentId ?? selectedDepartment?.id;
  const [openCollectSampleModal, setOpenCollectSampleModal] = useState(false);

  useEffect(() => {
    dispatch(setPageCode('P_Encounters'));
    dispatch(setDivContent('Patients Visit List'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(' '));
    };
  }, [dispatch]);

  const [encounter, setLocalEncounter] = useState<any>({
    ...newApEncounter,
    discharge: false
  });
  const [triggerGetPatientById, getPatientByIdState] = useLazyGetPatientByIdQuery();
  const [open, setOpen] = useState(false);
  const [openDoctorAppointments, setOpenDoctorAppointments] = useState<boolean>(false);
  const [openRefillModal, setOpenRefillModal] = useState(false);
  const [openPhysicianOrderSummaryModal, setOpenPhysicianOrderSummaryModal] = useState(false);
  const [openEncounterLogsModal, setOpenEncounterLogsModal] = useState(false);
  const [openNurseAssessment, setOpenNurseAssessment] = useState(false);
  const [openEMRModal, setOpenEMRModal] = useState(false);
  const [emrPatient, setEmrPatient] = useState<any>(null);
  const [emrEncounter, setEmrEncounter] = useState<any>(null);
  const [practitionerId, setPractitionerId] = useState<string | number | undefined>(undefined);

  const [filtersKey, setFiltersKey] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState<any>(null);

  const [startEncounter] = useStartEncounterMutation();
  const [cancelEncounter] = useCancelEncounterMutation();


  const TreatmentStatusEnum = useEnumOptions('TreatmentStatus', {
    exclude: [
      'DISCHARGED',
      'IN_OPERATION',
      'CONFIRM_RETURN',
      'TEMP_DC',
      'TRIAGE_STARTED',
      'SENT_TO_ER',
      'WAITING_TRIAGE',
      'WAITING_LIST',
      'PENDING_PAYMENT',
      'ASSIGNED_TO_BED'
    ]
  });
  const EncounterPriorityEnum = useEnumOptions('EncounterPriority');
  const EncounterReasonEnum = useEnumOptions('EncounterReason');

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const DEFAULT_SORT = 'id,desc';

  const today = new Date();
  const todayStr = formatDate(today);

  const [dateFilter, setDateFilter] = useState({ fromDate: today, toDate: today });

  const DEFAULT_STATUS = useMemo(() => ['NEW', 'ONGOING'], []);
  const [
    statusIn, setStatusIn] = useState<string[]>(DEFAULT_STATUS);
  const [
    showOnlyMyPatients, setShowOnlyMyPatients] = useState({ showOnlyMyPatients: true });
  const [encounterReasons, setEncounterReasons] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [hasPrescription, setHasPrescription] = useState<boolean | undefined>(undefined);
  const [hasOrder, setHasOrder] = useState<boolean | undefined>(undefined);
  const [isObserved, setIsObserved] = useState<boolean | undefined>(undefined);

  // Outpatient clinics the user can switch to (department switcher) — default selection for the department filter
  const facilityKey = selectedDepartment?.facilityId ?? authSlice?.tenant?.selectedFacility?.id ?? 'no-facility';
  const {
    data: activeUserDepartments,
    isSuccess: isUserDepartmentsSuccess,
    isError: isUserDepartmentsError
  } = useGetActiveUserDepartmentsByUserQuery(
    { userId: authSlice.user?.id as number, facilityId: facilityKey },
    { skip: !authSlice.user?.id }
  );
  const userDepartmentsResolved = !authSlice.user?.id || isUserDepartmentsSuccess || isUserDepartmentsError;

  const outpatientDepartmentOptions = useMemo(() => {
    const seen = new Set<string>();
    return (activeUserDepartments ?? [])
      .filter((d: any) => d?.departmentId != null && d?.departmentType === 'OUTPATIENT_CLINIC')
      .filter((d: any) => {
        const key = String(d.departmentId);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((d: any) => ({ label: d.departmentName ?? String(d.departmentId), value: String(d.departmentId) }));
  }, [activeUserDepartments]);

  const defaultDepartmentIds = useMemo(() => {
    const ids = outpatientDepartmentOptions.map(o => o.value);
    return ids.length ? ids : departmentId != null ? [String(departmentId)] : [];
  }, [outpatientDepartmentOptions, departmentId]);

  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const didInitDepartmentIdsRef = useRef(false);
  useEffect(() => {
    if (didInitDepartmentIdsRef.current || !userDepartmentsResolved || defaultDepartmentIds.length === 0) return;
    didInitDepartmentIdsRef.current = true;
    setDepartmentIds(defaultDepartmentIds);
  }, [userDepartmentsResolved, defaultDepartmentIds]);

  const resolveDepartmentIds = (ids: string[]) =>
    uniqueNonEmpty(ids) ?? (departmentId != null ? [String(departmentId)] : []);

  const [patientSearchDraft, setPatientSearchDraft] = useState<any>({
    searchByField: 'fullName',
    patientName: ''
  });
  const [record, setRecord] = useState<any>({});


  const {
    data: encountersPaged,
    isFetching: isEncountersFetching,
    isLoading: isEncountersLoading,
    refetch: refetchEncounters
  } = useFilterEncountersQuery(appliedFilters as any, {
    skip: !appliedFilters
  });

  const { data: appointmentsData } = useSearchAppointmentsQuery({
    filter: {
      facility: selectedDepartment?.facilityId,
      department: departmentId
    },
    page: 0,
    size: 50,
    sort: 'id,desc'
  });
  const currentUserId = useMemo(() => {
    const rawUser = authSlice?.user;
    const id = Number(rawUser?.id ?? rawUser?.userId ?? rawUser?.key ?? NaN);
    return Number.isFinite(id) ? id : null;
  }, [authSlice?.user]);
  const { data: practitionerByUserResponse } = useGetPractitionerByUserIdQuery(currentUserId as number, {
    skip: !currentUserId
  });
  const appointmentsMap = useMemo(() => {
    const map: any = {};
    (appointmentsData?.data ?? []).forEach((appt: any) => {
      const patientId = appt?.patient?.id;
      if (patientId) {
        map[patientId] = appt;
      }
    });
    return map;
  }, [appointmentsData]);

  const todayCountsSkip = !departmentId;
  const { data: totalPatientsCount } = useCountTodayDepartmentTotalPatientsQuery(
    { departmentId: String(departmentId ?? '') },
    { skip: todayCountsSkip }
  );
  const { data: activeCasesCount } = useCountTodayDepartmentActiveCasesQuery(
    { departmentId: String(departmentId ?? '') },
    { skip: todayCountsSkip }
  );
  const { data: completedCount } = useCountTodayDepartmentCompletedQuery(
    { departmentId: String(departmentId ?? '') },
    { skip: todayCountsSkip }
  );
  const { data: cancelledCount } = useCountTodayDepartmentCancelledQuery(
    { departmentId: String(departmentId ?? '') },
    { skip: todayCountsSkip }
  );

  const tableData = encountersPaged?.data ?? [];
  const totalCount = encountersPaged?.totalCount ?? 0;

  const patientBulkIdsRef = useRef<string[]>([]);
  const [getBulkPatientBasicInfo, { data: patientsBasicInfo, isLoading: patientsBulkLoading }] =
    useGetBulkPatientBasicInfoMutation();

  // ─── NEW: Practitioners for this department (used to resolve practitioner name) ───
  const [triggerGetPractitionersByDepartment, { isFetching: isPractitionersLoading }] =
    useLazyGetPractitionerByDepartmentQuery();
  const [departmentPractitioners, setDepartmentPractitioners] = useState<any[]>([]);

  const practitionerDepartmentIds: string[] = useMemo(
    () => appliedFilters?.departmentIds ?? (departmentId != null ? [String(departmentId)] : []),
    [appliedFilters?.departmentIds, departmentId]
  );

  useEffect(() => {
    if (practitionerDepartmentIds.length === 0) {
      setDepartmentPractitioners([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      practitionerDepartmentIds.map(id =>
        triggerGetPractitionersByDepartment({ departmentId: id, page: 0, size: 200, sort: 'id,asc' }, true)
          .unwrap()
          .then((res: any) => res?.data ?? [])
          .catch(() => [])
      )
    ).then(results => {
      if (!cancelled) setDepartmentPractitioners(results.flat());
    });
    return () => {
      cancelled = true;
    };
  }, [practitionerDepartmentIds, triggerGetPractitionersByDepartment]);
  useEffect(() => {
    console.log('Department practitioners updated:', departmentPractitioners);
  }, [departmentPractitioners]);

  const practitionerMap = useMemo(() => {
    const map = new Map<string, any>();
    (departmentPractitioners ?? []).forEach((p: any) => {
      if (p?.id != null) map.set(String(p.id), p);
    });
    return map;
  }, [departmentPractitioners]);

  const practitionerOptions = useMemo(
    () =>
      (departmentPractitioners ?? []).map((p: any) => ({
        label: `${p?.firstName ?? ''} ${p?.lastName ?? ''}`.trim(),
        value: p?.id
      })),
    [departmentPractitioners]
  );
  // ─────────────────────────────────────────────────────────────────────────────────

  const patientIdsForBulk = useMemo(() => {
    const ids = (tableData as any[])
      .map(row => row?.patient?.id)
      .filter(v => v !== null && v !== undefined)
      .map(v => String(v));
    return Array.from(new Set(ids));
  }, [tableData]);

  useEffect(() => {
    const pid = encounter?.patient?.id;
    if (pid) triggerGetPatientById({ id: pid });
  }, [encounter?.patient?.id]);

  useEffect(() => {
    if (patientIdsForBulk.length === 0) return;
    patientBulkIdsRef.current = patientIdsForBulk;
    getBulkPatientBasicInfo(patientIdsForBulk as any)
      .unwrap()
      .catch(() => { });
  }, [patientIdsForBulk, getBulkPatientBasicInfo]);

  const departmentIdsForBulk = useMemo(() => {
    const ids = (tableData as any[])
      .map(row => row?.departmentId)
      .filter(v => v !== null && v !== undefined)
      .map(v => Number(v));
    return Array.from(new Set(ids));
  }, [tableData]);

  const [getDepartmentsBulk, { data: departmentsBulk }] = useGetDepartmentsBulkMutation();

  useEffect(() => {
    if (departmentIdsForBulk.length === 0) return;
    getDepartmentsBulk(departmentIdsForBulk)
      .unwrap()
      .catch(() => { });
  }, [departmentIdsForBulk, getDepartmentsBulk]);

  const departmentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    (departmentsBulk ?? []).forEach((d: any) => {
      if (d?.id != null) map.set(String(d.id), d?.name ?? '');
    });
    return map;
  }, [departmentsBulk]);

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

      // ─── NEW: resolve practitioner name for this encounter ───
      const practitionerId =
        row?.practitioner?.id ?? row?.practitionerId ?? row?.defaultPractitionerId ?? null;
      const practitionerFromMap =
        practitionerId != null ? practitionerMap.get(String(practitionerId)) : null;

      const practitionerFirstName = String(
        practitionerFromMap?.firstName ?? row?.practitioner?.firstName ?? ''
      ).trim();
      const practitionerLastName = String(
        practitionerFromMap?.lastName ?? row?.practitioner?.lastName ?? ''
      ).trim();
      const practitionerFullName =
        [practitionerFirstName, practitionerLastName].filter(Boolean).join(' ').trim() || '-';
      // ───────────────────────────────────────────────────────────

      return {
        ...row,
        key: row?.id,
        patientObject: {
          id: patientId,
          fullName,
          medicalRecordNumber: mrn,
          firstName,
          lastName,
          dateOfBirth: dob,
          sexAtBirth,
          isPrivatePatient: isPrivate
        },
        practitionerObject: {
          id: practitionerId,
          fullName: practitionerFullName
        },
        patientAge: dob ? calculateAgeFormat(dob) : null
      };
    });
  }, [tableData, patientMap, practitionerMap]);
  const getEncounterId = (row: any) => row?.id ?? null;

  const startingEncounterIdsRef = useRef<Set<string | number>>(new Set());

  const startEncounterSafe = async (row: any) => {
    const encounterId = getEncounterId(row);
    if (!encounterId) return false;

    if (shouldSkipEncounterStart(row)) {
      return true;
    }

    if (startingEncounterIdsRef.current.has(encounterId)) {
      return false;
    }

    startingEncounterIdsRef.current.add(encounterId);

    try {
      await startEncounter({ id: encounterId }).unwrap();
      return true;
    } catch (error: any) {
      if (isEncounterAlreadyOngoingError(error)) {
        return true;
      }
      handleCrudError(error, dispatch, ENCOUNTER_ERROR_MAP);
      return false;
    } finally {
      startingEncounterIdsRef.current.delete(encounterId);
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

  // Encounter screens require the selected department to match the encounter department,
  // so switch to it first (page reload) and resume the action after the reload.
  const switchToEncounterDepartment = (encounterData: any, action: EncounterAction) => {
    const targetDepartmentId = encounterData?.departmentId;
    if (targetDepartmentId == null || String(targetDepartmentId) === String(departmentId ?? '')) {
      return false;
    }

    const assignment = (activeUserDepartments ?? []).find(
      (d: any) => String(d?.departmentId ?? '') === String(targetDepartmentId)
    );
    if (!assignment) {
      dispatch(notify({ msg: 'You do not have permission to access this department.', sev: 'warning' }));
      return true;
    }

    const nextDepartment = {
      departmentId: assignment.departmentId,
      facilityId: assignment.facilityId ?? selectedDepartment?.facilityId ?? null,
      departmentName: assignment.departmentName ?? null,
      facilityName: assignment.facilityName ?? null
    };

    sessionStorage.setItem(
      PENDING_ENCOUNTER_ACTION_KEY,
      JSON.stringify({ departmentId: nextDepartment.departmentId, action, encounter: encounterData })
    );
    dispatch(setSelectedDepartment(nextDepartment));
    setTimeout(() => {
      window.location.reload();
    }, 50);
    return true;
  };

  const handleGoToVisit = async (encounterData: any) => {
    if (switchToEncounterDepartment(encounterData, 'goToVisit')) return;
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

    navigate('/encounter', {
      state: {
        info: 'toEncounter',
        fromPage: 'EncounterList',
        patient: fullPatient,
        encounter: encounterData
      }
    });
  };

  const handleViewVisit = async (encounterData: any) => {
    if (switchToEncounterDepartment(encounterData, 'viewVisit')) return;
    dispatch(showSystemLoader());
    const fullPatient = await fetchPatientForEncounter(encounterData);
    dispatch(hideSystemLoader());

    if (!fullPatient) {
      dispatch(notify({ msg: 'Failed to load patient data.', sev: 'error' }));
      return;
    }

    dispatch(setEncounter(encounterData));
    dispatch(setPatient(fullPatient));

    navigate('/encounter', {
      state: {
        info: 'viewEncounter',
        fromPage: 'EncounterList',
        patient: fullPatient,
        encounter: encounterData,
        edit: false,
        viewMode: 'readOnly'
      }
    });
  };
  const handleGoToDiagnosticsResults = async (encounterData: any) => {
    if (switchToEncounterDepartment(encounterData, 'diagnosticsResults')) return;
    dispatch(showSystemLoader());
    const fullPatient = await fetchPatientForEncounter(encounterData);
    dispatch(hideSystemLoader());

    if (!fullPatient) {
      dispatch(notify({ msg: 'Failed to load patient data.', sev: 'error' }));
      return;
    }

    dispatch(setEncounter(encounterData));
    dispatch(setPatient(fullPatient));

    const isClosed = encounterData?.status?.toUpperCase() === 'CLOSED';

    navigate('/encounter/diagnostics-result', {
      state: {
        info: 'toEncounter',
        fromPage: 'EncounterList',
        patient: fullPatient,
        encounter: encounterData,
        edit: isClosed,
        ...(isClosed ? { viewMode: 'readOnly' } : {})
      }
    });
  };

  const handleGoToPreVisitObservations = async (encounterData: any) => {
    if (switchToEncounterDepartment(encounterData, 'preVisitObservations')) return;
    dispatch(showSystemLoader());
    const fullPatient = await fetchPatientForEncounter(encounterData);
    dispatch(hideSystemLoader());

    if (!fullPatient) {
      dispatch(notify({ msg: 'Failed to load patient data.', sev: 'error' }));
      return;
    }

    dispatch(setEncounter(encounterData));
    dispatch(setPatient(fullPatient));

    navigate('/nurse-station', {
      state: {
        info: fullPatient?.isPrivatePatient ? 'toNurse' : undefined,
        patient: fullPatient,
        encounter: encounterData,
        edit: encounterData?.status?.toUpperCase() === 'CLOSED',
        fromPage: 'EncounterList'
      }
    });
  };

  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_ENCOUNTER_ACTION_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_ENCOUNTER_ACTION_KEY);

    let pending: { departmentId?: string | number | null; action?: EncounterAction; encounter?: any };
    try {
      pending = JSON.parse(raw);
    } catch {
      return;
    }

    if (!pending.encounter || String(pending.departmentId ?? '') !== String(departmentId ?? '')) {
      dispatch(notify({ msg: 'The department could not be switched. The visit was not opened.', sev: 'warning' }));
      return;
    }

    const actions: Record<EncounterAction, (enc: any) => Promise<void>> = {
      goToVisit: handleGoToVisit,
      viewVisit: handleViewVisit,
      diagnosticsResults: handleGoToDiagnosticsResults,
      preVisitObservations: handleGoToPreVisitObservations
    };
    if (pending.action && actions[pending.action]) {
      setLocalEncounter(pending.encounter);
      actions[pending.action](pending.encounter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancelEncounter = async () => {
    if (!encounter) return;
    const isCancelled = await cancelEncounterSafe(encounter);
    if (!isCancelled) return;
    refetchEncounters();
    setOpen(false);
  };

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setPage(0);

    setAppliedFilters((prev: any) =>
      prev
        ? {
          ...prev,
          page: 0,
          size: newSize
        }
        : prev
    );
  }, []);

  const handlePageChange = useCallback(
    (_: unknown, newPage: number) => {
      setPage(newPage);

      setAppliedFilters((prev: any) =>
        prev
          ? {
            ...prev,
            page: newPage,
            size: pageSize
          }
          : prev
      );
    },
    [pageSize]
  );

  const handleClearFilters = () => {
    const now = new Date();

    const clearedDateFilter = {
      fromDate: new Date(now.getTime()),
      toDate: new Date(now.getTime() + 1000)
    };

    setRecord({ chiefComplain: '' });
    setDateFilter({ ...clearedDateFilter });
    setStatusIn([...DEFAULT_STATUS]);
    setEncounterReasons([]);
    setPriorities([]);
    setHasPrescription(undefined);
    setHasOrder(undefined);
    setIsObserved(undefined);
    setPractitionerId(undefined);
    setDepartmentIds([...defaultDepartmentIds]);

    const clearedSearch = {
      searchByField: 'fullName',
      patientName: ''
    };

    setPatientSearchDraft({ ...clearedSearch });

    setPage(0);

    setAppliedFilters({
      departmentId,
      departmentIds: defaultDepartmentIds.length ? [...defaultDepartmentIds] : undefined,
      fromDate: toISODate(clearedDateFilter.fromDate) ?? todayStr,
      toDate: toISODate(clearedDateFilter.toDate) ?? todayStr,
      statusIn: [...DEFAULT_STATUS],
      patientName: undefined,
      mrn: undefined,
      primaryMobileNumber: undefined,
      documentNumber: undefined,
      dateOfBirth: undefined,
      encounterReasons: undefined,
      chiefComplaint: undefined,
      priorities: undefined,
      hasPrescription: undefined,
      hasOrder: undefined,
      isObserved: undefined,
      practitionerId: showOnlyMyPatients.showOnlyMyPatients ? practitionerByUserResponse?.id : undefined,
      page: 0,
      size: pageSize,
      sort: DEFAULT_SORT,
    });
    setFiltersKey(prev => prev + 1);
  };

  const isAdmin = !!authSlice.user?.admin;
  const jobRole = String(authSlice.user?.jobRole ?? '').toUpperCase();

  const canSeeNurseStation = isAdmin || jobRole === 'NURSE';
  const canSeeDoctorVisit = isAdmin || jobRole === 'PHYSICIAN';
  const canSeeEMR = isAdmin || jobRole === 'PHYSICIAN';
  const canSeePrint = isAdmin || jobRole === 'PHYSICIAN' || jobRole === 'NURSE';
  const canSeeCancel = isAdmin || jobRole === 'PHYSICIAN' || jobRole === 'NURSE';

  const safeFormatDate = (value: any) => {
    if (!value) return '';
    try {
      const date = value instanceof Date ? value : new Date(value);
      if (isNaN(date.getTime())) return '';
      const formattedDate = date.toLocaleDateString('en-GB');
      const formattedTime = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${formattedDate} ${formattedTime}`;
    } catch {
      return '';
    }
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
      key: 'departmentName',
      title: 'DEPARTMENT',
      render: (row: any) =>
        row?.departmentId != null ? departmentNameMap.get(String(row.departmentId)) || '-' : '-'
    },
    {
      key: 'practitionerFullName',
      title: 'PRACTITIONER',
      render: (row: any) => <span>{row?.practitionerObject?.fullName ?? '-'}</span>,
      expandable: true,
    },
    {
      key: 'encounterReason',
      title: 'ENCOUNTER REASON',
      render: (row: any) => formatEnumString(row?.encounterReason) ?? ''
    },
    {
      key: 'chiefComplaint',
      title: 'CHIEF COMPLAIN',
      width: 220,
      render: (row: any) => {
        const complaint = row?.chiefComplaint ?? '-';
        const MAX_LENGTH = 20;

        const shouldTruncate =
          complaint !== '-' && String(complaint).length > MAX_LENGTH;

        const displayText = shouldTruncate
          ? `${String(complaint).substring(0, MAX_LENGTH)}...`
          : complaint;

        const content = (
          <div
            style={{
              cursor: shouldTruncate ? 'pointer' : 'default'
            }}
          >
            {displayText}
          </div>
        );

        if (!shouldTruncate) {
          return content;
        }

        return (
          <Whisper
            trigger="hover"
            placement="top"
            speaker={
              <Tooltip
                style={{
                  maxWidth: 400,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}
              >
                {complaint}
              </Tooltip>
            }
          >
            {content}
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
      key: 'approvedResults',
      title: 'APPROVED RESULTS',
      render: (row: any) => (
        <ApprovedResultsCell
          encounterId={row?.id}
          patientId={row?.patient?.id}
          onGoToDiagnosticsResults={() => handleGoToDiagnosticsResults(row)}
        />
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
      render: (row: any) => {
        if (!row?.encounterDate) {
          return '-';
        }

        const time = row?.encounterTime
          ? row.encounterTime.slice(0, 5)
          : '';

        return `${row.encounterDate} ${time}`;
      }
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
         key: 'createdBy',
         title: 'CREATED BY',
           expandable: true,
         render: (row: any) => {
           
           const login = row?.createdBy ;
   
           return <UserDateCell login={login} date={row?.createdAt } />;
         }
       },
    {
      key: 'status',
      title: 'STATUS',
      render: (row: any) => {
        const statusUpper = getEncounterTreatmentStatus(row);
        const statusColorMap: Record<string, string> = {
          NEW: '#0d6efd',
          ONGOING: '#198754',
          CANCELED: '#ffc107',
          CANCELLED: '#ffc107',
          COMPLETED: '#6c757d',
          DISCHARGED: '#adb5bd',
          PENDING_PAYMENT: '#fd7e14'
        };
        return (
          <MyBadgeStatus
            color={statusColorMap[statusUpper] ?? '#969fb0'}
            contant={formatEnumString(statusUpper) || '-'}
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
        const tooltipNurse = <Tooltip>Nurse Station</Tooltip>;
        const tooltipDoctor = <Tooltip><Translate>Go to Visit</Translate> </Tooltip>;
        const tooltipViewVisit = <Tooltip>View Visit</Tooltip>;
        const tooltipEMR = <Tooltip>Go to EMR</Tooltip>;
        const tooltipPrint = <Tooltip>Print Visit Report</Tooltip>;
        const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;
        const statusUpper = getEncounterTreatmentStatus(row);
        const isNew = statusUpper === 'NEW';
        const isViewOnlyStatus = statusUpper === 'COMPLETED' || statusUpper === 'CANCELLED';
        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            {canSeeNurseStation && !isViewOnlyStatus && (
              <Whisper trigger="hover" placement="top" speaker={tooltipNurse}>
                <div>
                  <MyButton
                    size="small"
                    backgroundColor="black"
                    onClick={() => {
                      setLocalEncounter(row);
                      if (row?.isObserved) {
                        handleGoToPreVisitObservations(row);
                      } else {
                        setOpenNurseAssessment(true);
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={faUserNurse} />
                  </MyButton>
                </div>
              </Whisper>
            )}

            {canSeeDoctorVisit && isViewOnlyStatus && (
              <Whisper trigger="hover" placement="top" speaker={tooltipViewVisit}>
                <div>
                  <MyButton
                    size="small"
                    backgroundColor="gray"
                    onClick={() => {
                      setLocalEncounter(row);
                      handleViewVisit(row);
                    }}
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </MyButton>
                </div>
              </Whisper>
            )}

            {canSeeDoctorVisit && !isViewOnlyStatus && (
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
            )}

            {canSeeEMR && (
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
            )}

            {canSeeCancel && isNew && !row?.isObserved && (
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
            {canSeePrint && (
              <Whisper trigger="hover" placement="top" speaker={tooltipPrint}>
                <div>
                  <VisitReportPrintButton
                    row={row}
                  />
                </div>
              </Whisper>
            )}
          </Form>
        );
      },
      expandable: false
    },
    {
      key: 'appointmentTime',
      title: 'APPOINTMENT TIME',
      expandable: true,
      render: (row: any) => (
        <AppointmentLogTimeCell
          appointmentId={
            row?.appointment?.id ?? row?.appointmentId ?? appointmentsMap[row?.patient?.id]?.id
          }
          kind="appointment"
        />
      )
    },
    {
      key: 'confirmTime',
      title: 'CONFIRM TIME',
      expandable: true,
      render: (row: any) => (
        <AppointmentLogTimeCell
          appointmentId={
            row?.appointment?.id ?? row?.appointmentId ?? appointmentsMap[row?.patient?.id]?.id
          }
          kind="confirm"
        />
      )
    },
    {
      key: 'checkInTime',
      title: 'CHECK-IN TIME',
      expandable: true,
      render: (row: any) => (
        <AppointmentLogTimeCell
          appointmentId={
            row?.appointment?.id ?? row?.appointmentId ?? appointmentsMap[row?.patient?.id]?.id
          }
          kind="checkin"
        />
      )
    },
    {
      key: 'seenByPhysicianTime',
      title: 'SEEN BY PHYSICIAN',
      expandable: true,
      render: (row: any) => safeFormatDate(appointmentsMap[row?.patient?.id]?.lastModifiedBy)
    }
  ];

  const filters = () => (
    <>
      <div key={filtersKey}>
        <Form layout="inline" fluid className="date-filter-form">
          <MyInput
            column
            width={180}
            fieldType="date"
            fieldLabel="From Date"
            fieldName="fromDate"
            record={dateFilter}
            setRecord={setDateFilter}
          />
          <MyInput
            column
            width={180}
            fieldType="date"
            fieldLabel="To Date"
            fieldName="toDate"
            record={dateFilter}
            setRecord={setDateFilter}
          />

          <MyInput
            column
            width={260}
            fieldType="checkPicker"
            fieldLabel="Department"
            fieldName="departmentIds"
            selectData={outpatientDepartmentOptions}
            selectDataLabel="label"
            selectDataValue="value"
            record={{ departmentIds }}
            setRecord={(v: any) => {
              setDepartmentIds(Array.isArray(v?.departmentIds) ? v.departmentIds.map(String) : []);
              setPage(0);
            }}
            searchable
          />

          <SearchPatientCriteria
            record={patientSearchDraft}
            setRecord={setPatientSearchDraft}
            liveSearchMinLength={0}
          />

          <MyInput
            column
            width={260}
            fieldType="checkPicker"
            fieldLabel="Treatment Status"
            fieldName="statusIn"
            selectData={TreatmentStatusEnum}
            selectDataLabel="label"
            selectDataValue="value"
            record={{ statusIn }}
            setRecord={(v: any) => {
              setStatusIn(Array.isArray(v?.statusIn) ? v.statusIn : []);
              setPage(0);
            }}
          />
          <MyInput
            column
            width={260}
            fieldType="check"
            fieldLabel="Show Only My Patients"
            fieldName="showOnlyMyPatients"
            record={showOnlyMyPatients}
            setRecord={setShowOnlyMyPatients}
            showLabel={false}
          />
        </Form>
      </div>

      <AdvancedSearchFilters
        searchFilter={true}
        clearOnClick={handleClearFilters}
        searchOnClick={() => {
          const fromDate = toISODate(dateFilter.fromDate) ?? todayStr;
          const toDate = toISODate(dateFilter.toDate) ?? todayStr;
          const chiefComplaint = record?.chiefComplain?.trim()
            ? record.chiefComplain.trim()
            : undefined;
          const normalizedStatusIn = uniqueNonEmpty(statusIn) ?? DEFAULT_STATUS;
          const normalizedEncounterReasons = uniqueNonEmpty(encounterReasons);
          const normalizedPriorities =
            uniqueNonEmpty(priorities) ??
            uniqueNonEmpty(record?.priority ? [record.priority] : undefined);
          const { patientName, mrn, primaryMobileNumber, documentNumber, dateOfBirth } =
            derivePatientFilters(patientSearchDraft);
          const normalizedPractitionerId =
            practitionerId === null || practitionerId === undefined || practitionerId === ''
              ? undefined
              : practitionerId;

          setPage(0);

          const normalizedDepartmentIds = resolveDepartmentIds(departmentIds);
          if (!uniqueNonEmpty(departmentIds)) setDepartmentIds(normalizedDepartmentIds);

          setAppliedFilters({
            departmentId,
            departmentIds: normalizedDepartmentIds.length ? normalizedDepartmentIds : undefined,
            fromDate,
            toDate,
            statusIn: normalizedStatusIn,
            patientName,
            mrn,
            primaryMobileNumber,
            documentNumber,
            dateOfBirth,
            encounterReasons: normalizedEncounterReasons,
            chiefComplaint,
            priorities: normalizedPriorities,
            hasPrescription,
            hasOrder,
            isObserved,
            practitionerId: showOnlyMyPatients.showOnlyMyPatients ? practitionerByUserResponse?.id : undefined,
            page: 0,
            size: pageSize,
            sort: DEFAULT_SORT
          });
        }}
        content={
          <div className="advanced-filters">
            <Form fluid className="dissss">
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
                setRecord={setRecord}
                fieldLabel="Chief Complain"
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

  const tableLoading = isEncountersLoading || isEncountersFetching || patientsBulkLoading;

  useEffect(() => {
    if (tableLoading) dispatch(showSystemLoader());
    else dispatch(hideSystemLoader());
    return () => {
      dispatch(hideSystemLoader());
    };
  }, [dispatch, tableLoading]);

  useEffect(() => {
    if (!departmentId || appliedFilters) return;
    if (showOnlyMyPatients.showOnlyMyPatients && currentUserId && !practitionerByUserResponse) return;
    if (!userDepartmentsResolved) return;

    const fromDate = toISODate(dateFilter.fromDate) ?? todayStr;
    const toDate = toISODate(dateFilter.toDate) ?? todayStr;

    setAppliedFilters({
      departmentId,
      departmentIds: defaultDepartmentIds.length ? [...defaultDepartmentIds] : undefined,
      fromDate,
      toDate,
      statusIn: DEFAULT_STATUS,
      patientName: undefined,
      mrn: undefined,
      primaryMobileNumber: undefined,
      documentNumber: undefined,
      dateOfBirth: undefined,
      encounterReasons: undefined,
      chiefComplaint: undefined,
      priorities: undefined,
      hasPrescription: undefined,
      hasOrder: undefined,
      isObserved: undefined,
      practitionerId: showOnlyMyPatients.showOnlyMyPatients ? practitionerByUserResponse?.id : undefined,
      page: 0,
      size: pageSize,
      sort: DEFAULT_SORT,
    });
  }, [
    departmentId,
    appliedFilters,
    dateFilter.fromDate,
    dateFilter.toDate,
    todayStr,
    DEFAULT_STATUS,
    pageSize,
    showOnlyMyPatients,
    practitionerByUserResponse,
    currentUserId,
    userDepartmentsResolved,
    defaultDepartmentIds
  ]);
  useEffect(() => {
    if (appliedFilters) {
      refetchEncounters();
    }
  }, [appliedFilters, refetchEncounters]);

  const didAutoRefetchRef = useRef(false);
  useEffect(() => {
    if (location.state?.shouldRefetch && !didAutoRefetchRef.current && departmentId) {
      didAutoRefetchRef.current = true;
      handleClearFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  return (
    <>
      <div className="count-div-on-top-of-page-visit-list">
        <DetailsCard
          title="Total Patients"
          number={totalPatientsCount ?? 0}
          color="--primary-blue"
          backgroundClassName="result-ready-section"
          position="center"
          width="15vw"
        />
        <DetailsCard
          title="Active Cases"
          number={activeCasesCount ?? 0}
          color="--green-600"
          backgroundClassName="sample-collected-section"
          position="center"
          width="15vw"
        />
        <DetailsCard
          title="Completed"
          number={completedCount ?? 0}
          color="--primary-purple"
          backgroundClassName="new-section"
          position="center"
          width="15vw"
        />
        <DetailsCard
          title="Cancelled"
          number={cancelledCount ?? 0}
          color="--primary-yellow"
          backgroundClassName="total-test-section"
          position="center"
          width="15vw"
        />
      </div>
      <div dir={isRTL ? 'rtl' : 'ltr'}>
        <Panel>
          <div style={{ display: 'flex', justifyContent: 'end', gap: '1vw' }}>
            <MyButton onClick={() => setOpenDoctorAppointments(true)}>Appointments</MyButton>

            <MyButton
              onClick={() => setOpenCollectSampleModal(true)}
            >
              <FontAwesomeIcon icon={faVialCircleCheck} />
              <Translate>COLLECT SAMPLE</Translate>
            </MyButton>
          </div>

          <MyTable
            filters={filters()}
            height={600}
            data={normalizedTableData}
            columns={tableColumns}
            rowClassName={(row: any) =>
              row && encounter && row.id === encounter.id ? 'selected-row' : ''
            }
            loading={tableLoading}
            onRowClick={(row: any) => setLocalEncounter(row)}
            page={page}
            rowsPerPage={pageSize}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
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

          <DeletionConfirmationModal
            open={openNurseAssessment}
            setOpen={setOpenNurseAssessment}
            actionButtonFunction={async () => {
              await handleGoToPreVisitObservations(encounter);
            }}
            actionType="confirm"
            confirmationQuestion="Do you want to start Nurse Assessment?"
            actionButtonLabel="Start"
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
        <DoctorAppoitmentsView
          open={openDoctorAppointments}
          setOpen={setOpenDoctorAppointments}
          facilityId={selectedDepartment?.facilityId}
          departmentId={departmentId}
        />
        

        <CollectSambleModal
          open={openCollectSampleModal}
          setOpen={setOpenCollectSampleModal}
          facilityId={selectedDepartment?.facilityId}
          fromDepartmentId={departmentId}
        />
      </div>
    </>
  );
};

export default EncounterList;