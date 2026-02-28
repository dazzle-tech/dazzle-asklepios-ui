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
  faRectangleXmark
} from '@fortawesome/free-solid-svg-icons';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { Badge, Form, Panel, Tooltip, Whisper } from 'rsuite';
import RefillModalComponent from '@/pages/Inpatient/departmentStock/refill-component';
import 'react-tabs/style/react-tabs.css';
import { calculateAgeFormat, formatDate, formatEnumString } from '@/utils';
import DetailsCard from '@/components/DetailsCard';
import MyModal from '@/components/MyModal/MyModal';
import { useDispatch } from 'react-redux';
import './styles.less';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import PhysicianOrderSummaryModal from '@/pages/encounter/encounter-component/physician-order-summary/physician-order-summary-component/PhysicianOrderSummaryComponent';
import EncounterLogsTable from '@/pages/Inpatient/inpatientList/EncounterLogsTable';
import PatientEMRModal from '@/pages/patient/patient-emr/PatientEMRModal';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';

import { useLocation, useNavigate } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';

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

import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';

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
    return { patientName: undefined as string | undefined, mrn: undefined as string | undefined };
  }

  if (searchByField === 'patientMrn') return { patientName: undefined, mrn: raw };

  return { patientName: raw, mrn: undefined };
};

const ENCOUNTER_ERROR_MAP: Record<string, string> = {
  'id.notfound': 'Encounter not found.',
  'patient.notfound': 'Patient not found.',
  'patient.hasOngoing.notAllowed':
    'Patient already has an ONGOING encounter. Starting another one is not allowed.',
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
        sev: 'error'
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

  dispatch(notify({ msg: humanReadableMessage + traceSuffix, sev: 'error' }));
};

const EncounterList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;
  const departmentId = selectedDepartment?.departmentId ?? selectedDepartment?.id;

  const divContent = 'Patients Visit List';
  dispatch(setPageCode('P_Encounters'));
  dispatch(setDivContent(divContent));

  const [encounter, setLocalEncounter] = useState<any>({
    ...newApEncounter,
    discharge: false
  });

  const [open, setOpen] = useState(false);
  const [openRefillModal, setOpenRefillModal] = useState(false);
  const [openPhysicianOrderSummaryModal, setOpenPhysicianOrderSummaryModal] = useState(false);
  const [openEncounterLogsModal, setOpenEncounterLogsModal] = useState(false);
  const [openNurseAssessment, setOpenNurseAssessment] = useState(false);

  const [openEMRModal, setOpenEMRModal] = useState(false);
  const [emrPatient, setEmrPatient] = useState<any>(null);
  const [emrEncounter, setEmrEncounter] = useState<any>(null);

  const [startEncounter] = useStartEncounterMutation();
  const [cancelEncounter] = useCancelEncounterMutation();

  const EncounterStatusEnum = useEnumOptions('EncounterStatus', {
    exclude: [
      'DISCHARGED',
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

  const [dateFilter, setDateFilter] = useState({ fromDate: today, toDate: today });

  const DEFAULT_STATUS = useMemo(() => ['NEW', 'ONGOING'], []);
  const [statusIn, setStatusIn] = useState<string[]>(DEFAULT_STATUS);

  const [encounterReasonIn, setEncounterReasonIn] = useState<string[]>([]);
  const [priorityIn, setPriorityIn] = useState<string[]>([]);
  const [withPrescription, setWithPrescription] = useState<boolean | undefined>(undefined);
  const [hasOrders, setHasOrders] = useState<boolean | undefined>(undefined);
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

  const handlePatientSearchClick = useCallback(() => {
    setPatientSearchApplied((previousSearch: any) => ({
      ...previousSearch,
      ...(patientSearchDraft ?? {})
    }));
    setPage(0);
    setSearchTick(previousTick => previousTick + 1);
  }, [patientSearchDraft]);

  const filterParams = useMemo(() => {
    if (!departmentId) return null;

    const fromDate = toISODate(dateFilter.fromDate) ?? todayStr;
    const toDate = toISODate(dateFilter.toDate) ?? todayStr;

    const chiefComplaint =
      String(record?.chiefComplain ?? record?.chiefComplaint ?? '').trim() || undefined;

    const normalizedStatusIn = uniqueNonEmpty(statusIn) ?? DEFAULT_STATUS;
    const normalizedEncounterReasonIn = uniqueNonEmpty(encounterReasonIn);
    const normalizedPriorityIn =
      uniqueNonEmpty(priorityIn) ??
      uniqueNonEmpty(record?.priority ? [record.priority] : undefined);

    const { patientName, mrn } = derivePatientFilters(patientSearchApplied);

    return {
      departmentId: String(departmentId),
      fromDate,
      toDate,
      statusIn: normalizedStatusIn,

      patientName,
      mrn,

      encounterReasonIn: normalizedEncounterReasonIn,
      chiefComplaint,
      priorityIn: normalizedPriorityIn,

      withPrescription,
      hasOrders,
      isObserved,

      page,
      size: pageSize,
      sort: DEFAULT_SORT,

      timestamp: searchTick
    };
  }, [
    DEFAULT_STATUS,
    DEFAULT_SORT,
    dateFilter.fromDate,
    dateFilter.toDate,
    departmentId,
    encounterReasonIn,
    hasOrders,
    isObserved,
    page,
    pageSize,
    priorityIn,
    record,
    statusIn,
    todayStr,
    withPrescription,
    patientSearchApplied,
    searchTick
  ]);

  const {
    data: encountersPaged,
    isFetching: isEncountersFetching,
    isLoading: isEncountersLoading,
    refetch: refetchEncounters
  } = useFilterEncountersQuery(filterParams as any, { skip: !filterParams });

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

  const patientIdsForBulk = useMemo(() => {
    const rows = (tableData ?? []) as any[];

    const ids = rows
      .map(
        row =>
          row?.patientId ??
          row?.patientKey ??
          row?.patient?.id ??
          row?.patient?.key ??
          row?.patientObject?.id ??
          row?.patientObject?.key ??
          row?.patientObject?.patientId
      )
      .filter(value => value !== null && value !== undefined && String(value).trim() !== '')
      .map(value => String(value));

    return Array.from(new Set(ids));
  }, [tableData]);

  useEffect(() => {
    if (patientIdsForBulk.length === 0) return;

    patientBulkIdsRef.current = patientIdsForBulk;

    getBulkPatientBasicInfo(patientIdsForBulk as any)
      .unwrap()
      .catch(() => {});
  }, [patientIdsForBulk, getBulkPatientBasicInfo]);

  const patientMap = useMemo(() => {
    const map = new Map<string, any>();
    const ids = patientBulkIdsRef.current;

    (patientsBasicInfo ?? []).forEach((patient: any, index: number) => {
      const patientIdOrKey = patient?.id ?? patient?.key ?? ids[index];
      if (!patientIdOrKey) return;

      map.set(String(patientIdOrKey), {
        id: patientIdOrKey,
        firstName: patient?.firstName,
        secondName: patient?.secondName,
        thirdName: patient?.thirdName,
        lastName: patient?.lastName,
        dateOfBirth: patient?.dateOfBirth,
        sexAtBirth: patient?.sexAtBirth,
        medicalRecordNumber: patient?.medicalRecordNumber
      });
    });

    return map;
  }, [patientsBasicInfo]);

  const normalizedTableData = useMemo(() => {
    return (tableData ?? []).map((encounterRow: any) => {
      const statusCode = String(encounterRow?.status ?? '').toUpperCase();
      const priorityCode = String(encounterRow?.priorityLevel ?? '').toUpperCase();
      const reasonCode = String(encounterRow?.encounterReason ?? '').toUpperCase();

      const patientKey =
        encounterRow?.patientId ??
        encounterRow?.patientKey ??
        encounterRow?.patient?.id ??
        encounterRow?.patient?.key ??
        encounterRow?.patientObject?.id ??
        encounterRow?.patientObject?.key ??
        encounterRow?.patientObject?.patientId ??
        null;

      const patientFromMap = patientKey != null ? patientMap.get(String(patientKey)) : null;

      const firstName = String(
        patientFromMap?.firstName ?? encounterRow?.patient?.firstName ?? ''
      ).trim();
      const secondName = String(
        patientFromMap?.secondName ?? encounterRow?.patient?.secondName ?? ''
      ).trim();
      const thirdName = String(
        patientFromMap?.thirdName ?? encounterRow?.patient?.thirdName ?? ''
      ).trim();
      const lastName = String(
        patientFromMap?.lastName ?? encounterRow?.patient?.lastName ?? ''
      ).trim();

      const bulkFullName = [firstName, secondName, thirdName, lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

      const bulkMrn =
        patientFromMap?.medicalRecordNumber ??
        encounterRow?.patientObject?.patientMrn ??
        encounterRow?.patientMrn ??
        encounterRow?.mrn ??
        encounterRow?.encounterNumber ??
        encounterRow?.departmentDailySequenceNumber ??
        encounterRow?.id;

      const bulkDob = patientFromMap?.dateOfBirth ?? null;
      const bulkGender = formatEnumString(patientFromMap?.sexAtBirth) || '';

      return {
        ...encounterRow,
        key: encounterRow?.key ?? encounterRow?.id,

        patientObject: {
          ...(encounterRow?.patientObject ?? {}),
          ...(encounterRow?.patient ?? {}),
          id: patientKey ?? encounterRow?.patientObject?.id ?? encounterRow?.patient?.id,
          patientMrn: bulkMrn,
          fullName:
            bulkFullName ||
            encounterRow?.patientObject?.fullName ||
            encounterRow?.patientFullName ||
            encounterRow?.fullName ||
            '-',
          privatePatient:
            encounterRow?.patientObject?.privatePatient ?? encounterRow?.privatePatient ?? false,

          dateOfBirth: bulkDob,
          sexAtBirth: bulkGender,

          gender: encounterRow?.patientObject?.gender ?? null
        },

        patientAge: encounterRow?.patientAge ?? (bulkDob ? calculateAgeFormat(bulkDob) : null),

        visitId: encounterRow?.visitId ?? encounterRow?.id,

        encounterReason: encounterRow?.encounterReason ?? reasonCode,
        encounterPriority:
          encounterRow?.encounterPriority ?? encounterRow?.priorityLevel ?? priorityCode,
        encounterStatus: encounterRow?.encounterStatus ?? encounterRow?.status ?? statusCode,

        plannedStartDate: encounterRow?.plannedStartDate ?? encounterRow?.encounterDate
      };
    });
  }, [tableData, patientMap]);

  const getEncounterId = (row: any) => row?.id ?? row?.key ?? null;

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

  const handleGoToVisit = async (encounterData: any, patientData: any) => {
    const isStarted = await startEncounterSafe(encounterData);
    if (!isStarted) return;

    if (encounterData && encounterData.key) {
      dispatch(setEncounter(encounterData));
      dispatch(setPatient(encounterData['patientObject']));
    }

    const privatePatientPath = '/user-access-patient-private';
    const encounterPath = '/encounter';
    const targetPath = patientData.privatePatient ? privatePatientPath : encounterPath;

    navigate(targetPath, {
      state: {
        info: 'toEncounter',
        fromPage: 'EncounterList',
        patient: patientData,
        encounter: encounterData
      }
    });

    sessionStorage.setItem('encounterPageSource', 'EncounterList');
  };

  const handleGoToPreVisitObservations = async (encounterData: any, patientData: any) => {
    const isStarted = await startEncounterSafe(encounterData);
    if (!isStarted) return;

    const privatePatientPath = '/user-access-patient-private';
    const preObservationsPath = '/nurse-station';
    const targetPath = patientData.privatePatient ? privatePatientPath : preObservationsPath;

    if (patientData.privatePatient) {
      navigate(targetPath, {
        state: { info: 'toNurse', patient: patientData, encounter: encounterData }
      });
    } else {
      navigate(targetPath, {
        state: {
          patient: patientData,
          encounter: encounterData,
          edit:
            String(encounterData?.encounterStatus ?? encounterData?.status ?? '').toUpperCase() ===
            'CLOSED'
        }
      });
    }
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

  const handleClearFilters = () => {
    const now = new Date();
    setRecord({});
    setDateFilter({ fromDate: now, toDate: now });
    setStatusIn(DEFAULT_STATUS);
    setEncounterReasonIn([]);
    setPriorityIn([]);
    setWithPrescription(undefined);
    setHasOrders(undefined);
    setIsObserved(undefined);

    const clearedSearch = { searchByField: 'fullName', patientName: '' };
    setPatientSearchDraft(clearedSearch);
    setPatientSearchApplied(clearedSearch);

    setPage(0);
    setSearchTick(previousTick => previousTick + 1);
  };

  const tableColumns = [
    {
      key: 'queueNumber',
      title: '#',
      dataKey: 'queueNumber',
      render: (rowData: any) => rowData?.encounterNumber
    },
    {
      key: 'patientFullName',
      title: 'PATIENT NAME',
      fullText: true,
      render: (rowData: any) => {
        const tooltipSpeaker = (
          <Tooltip>
            <div>MRN : {rowData?.patientObject?.patientMrn}</div>
            <div>Age : {rowData?.patientAge}</div>
            <div>Gender : {rowData?.patientObject?.sexAtBirth || ''}</div>
          </Tooltip>
        );

        return (
          <Whisper trigger="hover" placement="top" speaker={tooltipSpeaker}>
            <div className="encounter-list__patient-name-cell">
              {rowData?.patientObject?.privatePatient ? (
                <Badge color="blue" content="Private">
                  <p className="encounter-list__patient-name encounter-list__patient-name--clickable">
                    {rowData?.patientObject?.fullName}
                  </p>
                </Badge>
              ) : (
                <p className="encounter-list__patient-name encounter-list__patient-name--clickable">
                  {rowData?.patientObject?.fullName}
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
      render: (rowData: any) => rowData?.encounterReason ?? ''
    },
    {
      key: 'chiefComplaint',
      title: 'CHIEF COMPLAIN',
      render: (rowData: any) => rowData?.chiefComplaint
    },
    {
      key: 'diagnosis',
      title: 'DIAGNOSIS',
      render: (rowData: any) => rowData?.diagnosis
    },
    {
      key: 'hasPrescription',
      title: 'PRESCRIPTION',
      render: (rowData: any) =>
        rowData.hasPrescription ? (
          <MyBadgeStatus contant="YES" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="NO" color="#969fb0" />
        )
    },
    {
      key: 'hasOrder',
      title: 'HAS ORDER',
      render: (rowData: any) =>
        rowData.hasOrder ? (
          <MyBadgeStatus contant="YES" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="NO" color="#969fb0" />
        )
    },
    {
      key: 'encounterPriority',
      title: 'PRIORITY',
      render: (rowData: any) => rowData?.encounterPriority ?? ''
    },
    {
      key: 'plannedStartDate',
      title: 'DATE',
      dataKey: 'plannedStartDate'
    },
    {
      key: 'status',
      title: 'STATUS',
      render: (rowData: any) => {
        const statusUpperCase = String(rowData?.encounterStatus ?? '').toUpperCase();

        const statusColorMap: Record<string, string> = {
          NEW: '#0d6efd',
          ONGOING: '#198754',
          CANCELED: '#ffc107',
          CANCELLED: '#ffc107',
          CLOSED: '#6c757d'
        };

        return (
          <MyBadgeStatus
            color={statusColorMap[statusUpperCase] ?? '#969fb0'}
            contant={String(rowData?.encounterStatus ?? rowData?.status ?? '')}
          />
        );
      }
    },
    {
      key: 'hasObservation',
      title: 'IS OBSERVED',
      render: (rowData: any) =>
        rowData.hasObservation ? (
          <MyBadgeStatus contant="YES" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="NO" color="#969fb0" />
        )
    },
    {
      key: 'actions',
      title: ' ',
      render: (rowData: any) => {
        const tooltipNurse = <Tooltip>Nurse Station</Tooltip>;
        const tooltipDoctor = <Tooltip>Go to Visit</Tooltip>;
        const tooltipEMR = <Tooltip>Go to EMR</Tooltip>;
        const tooltipPrint = <Tooltip>Print Visit Report</Tooltip>;
        const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;

        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            <Whisper trigger="hover" placement="top" speaker={tooltipNurse}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="black"
                  onClick={() => {
                    const patientData = rowData.patientObject;
                    setLocalEncounter(rowData);

                    if (rowData.hasObservation) {
                      handleGoToPreVisitObservations(rowData, patientData);
                    } else {
                      setOpenNurseAssessment(true);
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faUserNurse} />
                </MyButton>
              </div>
            </Whisper>

            <Whisper trigger="hover" placement="top" speaker={tooltipDoctor}>
              <div>
                <MyButton
                  size="small"
                  onClick={() => {
                    const patientData = rowData?.patientObject;
                    setLocalEncounter(rowData);
                    handleGoToVisit(rowData, patientData);
                  }}
                >
                  <FontAwesomeIcon icon={faUserDoctor} />
                </MyButton>
              </div>
            </Whisper>

            <Whisper trigger="hover" placement="top" speaker={tooltipEMR}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="violet"
                  onClick={() => {
                    setLocalEncounter(rowData);
                    setEmrEncounter(rowData);
                    setEmrPatient(rowData?.patientObject || null);

                    dispatch(setEncounter(rowData));
                    if (rowData?.patientObject) dispatch(setPatient(rowData.patientObject));

                    setOpenEMRModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faFileWaveform} />
                </MyButton>
              </div>
            </Whisper>

            {String(rowData?.encounterStatus ?? rowData?.status ?? '').toUpperCase() === 'NEW' && (
              <Whisper trigger="hover" placement="top" speaker={tooltipCancel}>
                <div>
                  <MyButton
                    size="small"
                    onClick={() => {
                      setLocalEncounter(rowData);
                      setOpen(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faRectangleXmark} />
                  </MyButton>
                </div>
              </Whisper>
            )}

            <Whisper trigger="hover" placement="top" speaker={tooltipPrint}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="light-blue"
                  onClick={() => {
                    setLocalEncounter(rowData);
                  }}
                >
                  <FontAwesomeIcon icon={faPrint} />
                </MyButton>
              </div>
            </Whisper>
          </Form>
        );
      },
      expandable: false
    }
  ];

  const filters = () => {
    return (
      <>
        <Form layout="inline" fluid className="date-filter-form">
          <MyInput
            column
            width={180}
            fieldType="date"
            fieldLabel="From Date"
            fieldName="fromDate"
            record={dateFilter}
            setRecord={updatedFilter => {
              setDateFilter(updatedFilter);
              setPage(0);
            }}
          />
          <MyInput
            width={180}
            column
            fieldType="date"
            fieldLabel="To Date"
            fieldName="toDate"
            record={dateFilter}
            setRecord={updatedFilter => {
              setDateFilter(updatedFilter);
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
            setRecord={(updatedStatus: any) => {
              setStatusIn(Array.isArray(updatedStatus?.statusIn) ? updatedStatus.statusIn : []);
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
                  fieldName="encounterReasonIn"
                  fieldType="checkPicker"
                  selectData={EncounterReasonEnum}
                  selectDataLabel="label"
                  selectDataValue="value"
                  fieldLabel="Encounter Reason"
                  record={{ encounterReasonIn }}
                  setRecord={(updatedReason: any) => {
                    const rawValue = Array.isArray(updatedReason)
                      ? updatedReason
                      : updatedReason?.encounterReasonIn;
                    const nextReasons = Array.isArray(rawValue)
                      ? rawValue.map((reasonItem: any) => String(reasonItem)).filter(Boolean)
                      : [];
                    setEncounterReasonIn(nextReasons);
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
                  setRecord={updatedRecord => {
                    setRecord(updatedRecord);
                    setPage(0);
                  }}
                  fieldLabel="Chief Complain"
                />

                <MyInput
                  width={130}
                  fieldName="withPrescription"
                  fieldType="checkbox"
                  record={{ withPrescription: !!withPrescription }}
                  setRecord={(updatedValue: any) => {
                    setWithPrescription(!!updatedValue?.withPrescription);
                    setPage(0);
                  }}
                  label="With Prescription"
                />
                <MyInput
                  width={110}
                  fieldName="hasOrders"
                  fieldType="checkbox"
                  record={{ hasOrders: !!hasOrders }}
                  setRecord={(updatedValue: any) => {
                    setHasOrders(!!updatedValue?.hasOrders);
                    setPage(0);
                  }}
                  label="Has Orders"
                />
                <MyInput
                  width={110}
                  fieldName="isObserved"
                  fieldType="checkbox"
                  record={{ isObserved: !!isObserved }}
                  setRecord={(updatedValue: any) => {
                    setIsObserved(!!updatedValue?.isObserved);
                    setPage(0);
                  }}
                  label="Is Observed"
                />

                <MyInput
                  width={200}
                  fieldName="priorityIn"
                  fieldType="checkPicker"
                  record={{ priorityIn }}
                  setRecord={(updatedPriority: any) => {
                    setPriorityIn(
                      Array.isArray(updatedPriority?.priorityIn) ? updatedPriority.priorityIn : []
                    );
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
  };

  const tableLoading = isEncountersLoading || isEncountersFetching || patientsBulkLoading;

  useEffect(() => {
    dispatch(setPageCode(''));
    dispatch(setDivContent(' '));
  }, [location.pathname, dispatch]);

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

  return (
    <>
      <div className="count-div-on-top-of-page-visit-list">
        <DetailsCard
          title="Total Patients"
          number={totalPatientsCount ?? 0}
          color="--primary-blue"
          backgroundClassName="result-ready-section"
          position="center"
          width={'15vw'}
        />
        <DetailsCard
          title="Active Cases"
          number={activeCasesCount ?? 0}
          color="--green-600"
          backgroundClassName="sample-collected-section"
          position="center"
          width={'15vw'}
        />
        <DetailsCard
          title="Completed"
          number={completedCount ?? 0}
          color="--primary-purple "
          backgroundClassName="new-section"
          position="center"
          width={'15vw'}
        />
        <DetailsCard
          title="Cancelled"
          number={cancelledCount ?? 0}
          color="--primary-yellow"
          backgroundClassName="total-test-section"
          position="center"
          width={'15vw'}
        />
      </div>

      <Panel>
        <MyTable
          filters={filters()}
          height={600}
          data={normalizedTableData}
          columns={tableColumns}
          rowClassName={(rowData: any) =>
            rowData && encounter && rowData.key === encounter.key ? 'selected-row' : ''
          }
          loading={tableLoading}
          onRowClick={(rowData: any) => setLocalEncounter(rowData)}
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
          confirmationQuestion="Do you want to cancel this Encounter ?"
          actionButtonLabel="Cancel"
          cancelButtonLabel="Close"
        />

        <DeletionConfirmationModal
          open={openNurseAssessment}
          setOpen={setOpenNurseAssessment}
          actionButtonFunction={async () => {
            if (encounter && encounter.patientObject) {
              await handleGoToPreVisitObservations(encounter, encounter.patientObject);
            }
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
    </>
  );
};

export default EncounterList;
