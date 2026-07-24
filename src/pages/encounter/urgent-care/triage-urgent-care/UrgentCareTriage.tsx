import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { newApEncounter } from '@/types/model-types-constructor';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faBolt, faPause } from '@fortawesome/free-solid-svg-icons';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { Badge, Form, Panel, Popover, Tooltip, Whisper } from 'rsuite';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import 'react-tabs/style/react-tabs.css';
import { calculateAgeFormat, formatDate, formatEnumString } from '@/utils';
import { faCommentMedical } from '@fortawesome/free-solid-svg-icons';
import {
  useCancelEncounterMutation,
  useFilterEncountersQuery,
  useUpdateEncounterMutation
} from '@/services/encounters/patientEncounterService';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch, useSelector } from 'react-redux';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { faBarcode } from '@fortawesome/free-solid-svg-icons';
import { faCirclePlay } from '@fortawesome/free-solid-svg-icons';
import { faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faBedPulse } from '@fortawesome/free-solid-svg-icons';
import { useEnumOptions } from '@/services/enumsApi';
import { resetRefetchEncounter } from '@/reducers/refetchEncounterState';
import { useNavigate } from 'react-router-dom';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
import PatientSearch from '@/components/PatientSearch';
import ProfileSidebarNew from '@/pages/patient/patient-profile/ProfileSidebar-new';
import CreateNewPatient from '@/pages/patient/facility-patient-list/CreateNewPatient';
import QuickPatient from '@/pages/patient/facility-patient-list/QuickPatient';
import '../styles.less';
import { newPatientInsurance, newPatientPayments } from '@/types/model-types-constructor-new';
import {
  useCreateOrGetEmergencyTriageMutation,
  useGetLatestEmergencyTriageByEncounterQuery
} from '@/services/encounters/er-triage/emergencyTriageService';
import {
  useGetBulkPatientBasicInfoMutation,
  useLazyGetPatientWristbandPdfQuery,
  useLazyGetPatientWristbandQuery
} from '@/services/patient/patientService';
import MyModal from '@/components/MyModal/MyModal';
import PatientEMRModal from '@/pages/patient/patient-emr/PatientEMRModal';
import { printPatientWristband } from '@/utils/printPatientWristband';
import BedAssignmentModal from '../../day-case/DayCaseList/BedAssignmentModal';
import { useAppSelector } from '@/hooks';
import AddPaymentModal from './component/AddPaymentModal';
import PatientWritBandPrintLabelButton from './PatientWritBandPrintLabelButton';

const DEFAULT_ENCOUNTER_STATUS_CODES = [
  'WAITING_TRIAGE',
  'PENDING_PAYMENT',
  'TRIAGE_STARTED'
] as const;

const toNumberOrNaN = (v: unknown) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '') return Number(v);
  return Number.NaN;
};

const unwrapApiObject = <T,>(data: any): T | null => {
  if (!data) return null;
  return (data?.object ?? data) as T;
};

const toDateSafe = (value: any): Date | null => {
  if (!value && value !== 0) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const formatDateTime = (value: any): string => {
  const d = toDateSafe(value);
  if (!d) return '';
  return d.toLocaleString();
};

const formatDuration = (ms: number | null): string => {
  if (ms == null || !isFinite(ms) || ms < 0) return '';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const EmergencyLevelCell = ({ encounterId, labelMap, colorMap }: any) => {
  const id = toNumberOrNaN(encounterId);
  const { data: latestEmergencyTriage } = useGetLatestEmergencyTriageByEncounterQuery(id as any, {
    skip: Number.isNaN(id)
  });

  const latest = unwrapApiObject<any>(latestEmergencyTriage);
  const level = latest?.emergencyLevel ?? null;
  if (!level) return <></>;

  const key = String(level);
  return (
    <MyBadgeStatus
      color={colorMap?.get?.(key) ?? '#98A2B4'}
      contant={labelMap?.get?.(key) ?? formatEnumString(key)}
    />
  );
};

const TriageStartedAtCell = ({ encounterId, fallbackCreatedAt }: any) => {
  const id = toNumberOrNaN(encounterId);
  const { data: latestEmergencyTriage } = useGetLatestEmergencyTriageByEncounterQuery(id as any, {
    skip: Number.isNaN(id)
  });

  const latest = unwrapApiObject<any>(latestEmergencyTriage);
  const createdAt = latest?.createdDate ?? fallbackCreatedAt ?? null;
  if (!createdAt) return <></>;
  return <>{formatDateTime(createdAt)}</>;
};

const WaitingTimeCell = ({ encounterId, arrivalCreatedAt, fallbackTriageCreatedAt }: any) => {
  const id = toNumberOrNaN(encounterId);
  const { data: latestEmergencyTriage } = useGetLatestEmergencyTriageByEncounterQuery(id as any, {
    skip: Number.isNaN(id)
  });

  const arrival = toDateSafe(arrivalCreatedAt);
  const latest = unwrapApiObject<any>(latestEmergencyTriage);
  const triageStart = toDateSafe(latest?.createdDate ?? fallbackTriageCreatedAt);
  if (!arrival || !triageStart) return <></>;
  return <>{formatDuration(triageStart.getTime() - arrival.getTime())}</>;
};

const TriageCompletedAtCell = ({
  encounterId,
  fallbackUpdatedAt,
  completedAt,
  completedDate
}: any) => {
  const id = toNumberOrNaN(encounterId);
  const { data: latestEmergencyTriage } = useGetLatestEmergencyTriageByEncounterQuery(id as any, {
    skip: Number.isNaN(id)
  });

  const latest = unwrapApiObject<any>(latestEmergencyTriage);
  const v = latest?.completedDate ?? completedDate ?? completedAt ?? fallbackUpdatedAt ?? null;
  if (!v) return <></>;
  return <>{formatDateTime(v)}</>;
};

const TriageTimeCell = ({
  encounterId,
  fallbackTriageCreatedAt,
  fallbackUpdatedAt,
  rowUpdatedAt,
  completedAt,
  completedDate
}: any) => {
  const id = toNumberOrNaN(encounterId);
  const { data: latestEmergencyTriage } = useGetLatestEmergencyTriageByEncounterQuery(id as any, {
    skip: Number.isNaN(id)
  });

  const latest = unwrapApiObject<any>(latestEmergencyTriage);
  const triageStart = toDateSafe(latest?.createdDate ?? fallbackTriageCreatedAt);
  const end = toDateSafe(
    latest?.completedDate ??
      completedDate ??
      completedAt ??
      rowUpdatedAt ??
      fallbackUpdatedAt ??
      null
  );
  if (!triageStart || !end) return <></>;
  return <>{formatDuration(end.getTime() - triageStart.getTime())}</>;
};

const AssignBedAction = ({
  rowData,
  isPendingPayment,
  isReceptionist,
  setLocalEncounter,
  setOpenBedAssignmentModal
}: {
  rowData: any;
  isPendingPayment: boolean;
  isReceptionist: boolean;
  setLocalEncounter: (row: any) => void;
  setOpenBedAssignmentModal: (open: boolean) => void;
}) => {
  const encounterId = toNumberOrNaN(rowData?.id ?? rowData?.encounterId ?? rowData?.key);

  const { data: latestEmergencyTriage } = useGetLatestEmergencyTriageByEncounterQuery(
    encounterId as any,
    {
      skip: Number.isNaN(encounterId)
    }
  );

  const latest = unwrapApiObject<any>(latestEmergencyTriage);
  const emergencyLevel = latest?.emergencyLevel ?? null;

  const statusUpper = String(rowData?.status ?? rowData?.encounterStatus ?? '').toUpperCase();
  const isTriageStarted = statusUpper === 'TRIAGE_STARTED';

  const disabled = isPendingPayment || !isTriageStarted || !emergencyLevel || isReceptionist;

  const speaker = isPendingPayment ? (
    <Tooltip>Please add payment first</Tooltip>
  ) : !isTriageStarted ? (
    <Tooltip>Assign Bed is only available when triage is started</Tooltip>
  ) : !emergencyLevel ? (
    <Tooltip>Please set Emergency Level first</Tooltip>
  ) : (
    <Tooltip>Assign Bed</Tooltip>
  );

  return (
    <Whisper trigger="hover" placement="top" speaker={speaker}>
      <div>
        <MyButton
          size="small"
          backgroundColor="black"
          disabled={disabled}
          onClick={() => {
            setLocalEncounter(rowData);
            setOpenBedAssignmentModal(true);
          }}
        >
          <FontAwesomeIcon icon={faBedPulse} />
        </MyButton>
      </div>
    </Whisper>
  );
};

const EncounterPriorityAction = ({
  rowData,
  encounterPriorityEnumOptions,
  priorityDotColor,
  isPendingPayment,
  onUpdatePriority,
  isReceptionist
}: {
  rowData: any;
  encounterPriorityEnumOptions: any[];
  priorityDotColor: Map<string, string>;
  isPendingPayment: boolean;
  onUpdatePriority: (rowData: any, priorityCode: string) => Promise<boolean>;
  isReceptionist: boolean;
}) => {
  const whisperRef = useRef<any>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const mode = useSelector((state: any) => state.ui.mode);
  const isDark = mode === 'dark';

  const popoverBackground = isDark ? '#0f172a' : '#ffffff';
  const popoverForeground = isDark ? '#e5e7eb' : '#111827';
  const popoverBorder = isDark ? '#334155' : '#e5e7eb';
  const mutedForeground = isDark ? '#94a3b8' : '#64748b';
  const selectedBackground = isDark ? 'rgba(59, 130, 246, 0.16)' : '#eff6ff';
  const selectedBorder = isDark ? '#3b82f6' : '#bfdbfe';

  const selectedPriority = String(rowData?.priorityLevel ?? '');

  const prioritySpeaker = (
    <Popover
      style={{
        backgroundColor: popoverBackground,
        color: popoverForeground,
        border: `1px solid ${popoverBorder}`,
        borderRadius: 12,
        boxShadow: isDark ? '0 12px 32px rgba(0, 0, 0, 0.45)' : '0 12px 32px rgba(15, 23, 42, 0.12)'
      }}
    >
      <div
        style={{
          minWidth: 220,
          display: 'flex',
          flexDirection: 'column',
          padding: 8,
          color: popoverForeground,
          backgroundColor: 'transparent'
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            padding: '4px 6px 10px 6px',
            borderBottom: `1px solid ${popoverBorder}`,
            marginBottom: 8,
            color: popoverForeground
          }}
        >
          Priority
        </div>

        {!encounterPriorityEnumOptions?.length ? (
          <div style={{ padding: 8, color: mutedForeground }}>
            No priority options
          </div>
        ) : (
          encounterPriorityEnumOptions.map((p: any) => {
            const value = String(p?.value ?? '');
            const label = String(p?.label ?? p?.value ?? '');
            const isSelected = selectedPriority === value;

            return (
              <button
                key={value}
                type="button"
                onClick={async (e: any) => {
                  e?.stopPropagation?.();
                  if (!value || saving) return;

                  try {
                    setSaving(value);
                    const ok = await onUpdatePriority(rowData, value);
                    if (ok) {
                      whisperRef.current?.close?.();
                    }
                  } finally {
                    setSaving(null);
                  }
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 12px',
                  marginBottom: 6,
                  borderRadius: 8,
                  border: isSelected ? `1px solid ${selectedBorder}` : `1px solid ${popoverBorder}`,
                  backgroundColor: isSelected ? selectedBackground : 'transparent',
                  color: popoverForeground,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    minWidth: 0
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: priorityDotColor.get(value) ?? mutedForeground,
                      flex: '0 0 auto'
                    }}
                  />
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: popoverForeground
                    }}
                  >
                    {label}
                  </span>
                </span>

                <span
                  style={{
                    fontWeight: 700,
                    color: isSelected ? popoverForeground : mutedForeground,
                    minWidth: 16,
                    textAlign: 'right'
                  }}
                >
                  {saving === value ? '...' : isSelected ? '✓' : ''}
                </span>
              </button>
            );
          })
        )}
      </div>
    </Popover>
  );

  return (
    <Whisper
      ref={whisperRef}
      trigger="click"
      placement="leftStart"
      enterable
      speaker={isPendingPayment ? <Tooltip>Please add payment first</Tooltip> : prioritySpeaker}
    >
      <div
        onClick={(e: any) => {
          e?.stopPropagation?.();
        }}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        <MyButton size="small" disabled={isReceptionist}>
          <FontAwesomeIcon icon={faCircleExclamation} />
        </MyButton>
      </div>
    </Whisper>
  );
};

const UrgentCareTriage = () => {
  const SENT_TO_ER_STATUS_CODE = 'SENT_TO_ER';
  const COMPLETE_TRIAGE_STATUS_CODE = 'CLOSED';

  const dispatch = useDispatch();
  const [cancelEncounter] = useCancelEncounterMutation();
  const [updateEncounter] = useUpdateEncounterMutation();
  const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter, discharge: false });
  const [manualSearchTriggered, setManualSearchTriggered] = useState(true);
  const [openBedAssignmentModal, setOpenBedAssignmentModal] = useState(false);
  const [open, setOpen] = useState(false);
  const [encounterStatus, setEncounterStatus] = useState<{ codes: string[] }>(() => ({
    codes: [...DEFAULT_ENCOUNTER_STATUS_CODES]
  }));
  const [createOrGetEmergencyTriage] = useCreateOrGetEmergencyTriageMutation();

  const navigate = useNavigate();
  const [openEMRModal, setOpenEMRModal] = useState(false);
  const [emrPatient, setEmrPatient] = useState<any>(null);
  const [emrEncounter, setEmrEncounter] = useState<any>(null);
  const authSlice = useAppSelector(state => state.auth);
  const jobRole = String(authSlice.user?.jobRole ?? '').toUpperCase();
  const isReceptionist = jobRole === 'RECEPTIONIST';

  const selectedDepartment = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('selectedDepartment') || 'null');
    } catch {
      return null;
    }
  }, []);

  const departmentId = Number(selectedDepartment?.departmentId ?? selectedDepartment?.id ?? 0) || 0;

  const lastWeekDefault = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);

  const [dateFilter, setDateFilter] = useState({
    fromDate: lastWeekDefault,
    toDate: new Date()
  });

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearchResetToken, setPatientSearchResetToken] = useState(0);
  const [patientSidebarOpen, setPatientSidebarOpen] = useState(false);
  const [windowHeight, setWindowHeight] = useState<number>(window.innerHeight);
  const [refetchPatientSidebar, setRefetchPatientSidebar] = useState(false);
  const [openCreatePatient, setOpenCreatePatient] = useState(false);
  const [openQuickPatient, setOpenQuickPatient] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentRow, setPaymentRow] = useState<any>(null);
  const [payment, setPayment] = useState<any>({ ...newPatientPayments });
  const [patientInsurance, setPatientInsurance] = useState<any>({ ...newPatientInsurance });

  const dateFilterRef = useRef(dateFilter);
  const encounterStatusRef = useRef(encounterStatus);
  const selectedPatientRef = useRef<any>(selectedPatient);

  const setDateFilterSafe = (next: any) => {
    dateFilterRef.current = next;
    setDateFilter(next);
  };
  const setEncounterStatusSafe = (next: any) => {
    encounterStatusRef.current = next;
    setEncounterStatus(next);
  };
  const setSelectedPatientSafe = (next: any) => {
    selectedPatientRef.current = next;
    setSelectedPatient(next);
  };

  const divContent = 'Urgent Care Triage';

  useEffect(() => {
    dispatch(setPageCode('Urgent_Care_Triage'));
    dispatch(setDivContent(divContent));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(' '));
    };
  }, [dispatch, divContent]);

  const refetch = useSelector((state: any) => state?.refetch?.refetchEncounter);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const DEFAULT_SORT = 'id,desc';
  const [searchTick, setSearchTick] = useState(1);
  const [hasSearched, setHasSearched] = useState(true);

  const filterParams = useMemo(() => {
    if (!departmentId) return null;

    const df = dateFilterRef.current;
    const es = encounterStatusRef.current;
    const sp = selectedPatientRef.current;

    const fromDateObj = toDateSafe(df?.fromDate);
    const toDateObj = toDateSafe(df?.toDate);
    const fromDate = fromDateObj ? formatDate(fromDateObj) : undefined;
    const toDate = toDateObj ? formatDate(toDateObj) : undefined;

    const patientName =
      sp?.firstName || sp?.lastName
        ? `${sp.firstName ?? ''} ${sp.lastName ?? ''}`.trim()
        : undefined;

    const mrn = sp?.medicalRecordNumber || undefined;

    const statuses = (es?.codes?.length ? es.codes : DEFAULT_ENCOUNTER_STATUS_CODES).map((v: any) =>
      String(v ?? '').toUpperCase()
    );
    const statusesCsv = statuses.join(',');

    return {
      departmentId,
      fromDate,
      toDate,
      statuses: statusesCsv,
      patientName,
      mrn,
      page,
      size: pageSize,
      sort: DEFAULT_SORT,
      timestamp: searchTick
    };
  }, [departmentId, page, pageSize, searchTick]);

  const {
    data: encountersPaged,
    isFetching,
    isLoading,
    refetch: refetchEncounter
  } = useFilterEncountersQuery(filterParams as any, { skip: !filterParams || !hasSearched });

  const emergencyLevelEnumOptions = useEnumOptions('EmergencyLevel');
  const encounterStatusEnumOptions = useEnumOptions('EncounterStatus', {
    exclude: [
      'NEW',
      'ONGOING',
      'CANCELLED',
      'CLOSED',
      'DISCHARGED',
      'IN_OPERATION',
      'CONFIRM_RETURN',
      'TEMP_DC',
      'SENT_TO_ER',
      'WAITING_LIST'
    ]
  });
  const encounterPriorityEnumOptions = useEnumOptions('EncounterPriority');

  const encounterStatusLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    encounterStatusEnumOptions.forEach((opt: any) => {
      if (opt?.value == null) return;
      m.set(String(opt.value), String(opt.label ?? opt.value));
    });
    return m;
  }, [encounterStatusEnumOptions]);

  const [getBulkPatientBasicInfo, { data: patientsBasicInfo }] =
    useGetBulkPatientBasicInfoMutation();

  const patientIdsForBulk = useMemo(() => {
    const rows = (encountersPaged?.data ?? []) as any[];
    const ids = rows
      .map(row => row?.patient?.id)
      .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
      .map(v => String(v));
    return Array.from(new Set(ids));
  }, [encountersPaged]);

  useEffect(() => {
    if (patientIdsForBulk.length === 0) return;
    getBulkPatientBasicInfo(patientIdsForBulk as any)
      .unwrap()
      .catch(() => {});
  }, [patientIdsForBulk, getBulkPatientBasicInfo]);

  const patientByIdMap = useMemo(() => {
    const byId = new Map<string, any>();
    (patientsBasicInfo ?? []).forEach((patient: any) => {
      const idKey = patient?.id ?? null;
      if (idKey === null || idKey === undefined || String(idKey).trim() === '') return;
      byId.set(String(idKey), patient);
    });
    return byId;
  }, [patientsBasicInfo]);

  const normalizedRows = useMemo(() => {
    const rows = (encountersPaged?.data ?? []) as any[];

    return rows.map((encounterRow: any) => {
      const statusCode = String(encounterRow?.status ?? '').toUpperCase();
      const priorityCode = String(encounterRow?.priorityLevel ?? '').toUpperCase();

      const patientId = encounterRow?.patient?.id ?? null;
      const patientFromMap = patientId != null ? patientByIdMap.get(String(patientId)) : null;

      const patientFromEncounter = encounterRow?.patient ?? null;
      const patientMerged = patientFromEncounter || patientFromMap || null;

      const patientMrn = patientMerged?.medicalRecordNumber;
      const dateOfBirth = patientMerged?.dateOfBirth ?? patientMerged?.dob ?? null;
      const sexAtBirth = formatEnumString(patientMerged?.sexAtBirth) || '';

      return {
        ...encounterRow,
        key: encounterRow?.id,
        patientId,
        patientObject: {
          id: patientId,
          medicalRecordNumber: patientMrn,
          firstName: patientMerged?.firstName ?? '',
          secondName: patientMerged?.secondName ?? '',
          lastName: patientMerged?.lastName ?? '',
          privatePatient: Boolean(patientMerged?.isPrivatePatient ?? false),
          dateOfBirth,
          sexAtBirth
        },
        patientAge: dateOfBirth ? calculateAgeFormat(dateOfBirth) : null,
        visitId: encounterRow?.encounterNumber ?? encounterRow?.id,
        encounterPriority: encounterRow?.priorityLevel ?? priorityCode,
        encounterStatus: encounterRow?.status ?? statusCode,
        plannedStartDate: encounterRow?.encounterDate ?? null,
        createdAt:
          encounterRow?.createdDate ?? encounterRow?.createdAt ?? encounterRow?.created_at ?? null,
        updatedAt:
          encounterRow?.updatedDate ?? encounterRow?.updatedAt ?? encounterRow?.updated_at ?? null
      };
    });
  }, [encountersPaged, patientByIdMap]);

  const emergencyLevelLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    emergencyLevelEnumOptions.forEach((opt: any) => {
      if (opt?.value == null) return;
      m.set(String(opt.value), String(opt.label ?? opt.value));
    });
    return m;
  }, [emergencyLevelEnumOptions]);

  const emergencyLevelColorMap = useMemo(() => {
    const byValue: Record<string, string> = {
      RESUSCITATION: '#7f1d1d',
      EMERGENT: '#dc2626',
      URGENT: '#f97316',
      LESS_URGENT: '#eab308',
      NON_URGENT: '#16a34a'
    };

    const palette = ['#dc2626', '#f97316', '#eab308', '#16a34a', '#0ea5e9', '#7c3aed'];
    const m = new Map<string, string>();
    emergencyLevelEnumOptions.forEach((opt: any, idx: number) => {
      if (opt?.value == null) return;
      const key = String(opt.value);
      const mapped = byValue[String(opt.value).toUpperCase()];
      m.set(key, mapped ?? palette[idx % palette.length]);
    });
    return m;
  }, [emergencyLevelEnumOptions]);

  const priorityOrderMap = useMemo(() => {
    const rank = (value: string) => {
      const v = String(value ?? '').toUpperCase();
      if (
        v.includes('URGENT') ||
        v.includes('CRITICAL') ||
        v.includes('STAT') ||
        v.includes('EMERG')
      ) {
        return 0;
      }
      return null;
    };
    const m = new Map<string, number>();
    encounterPriorityEnumOptions.forEach((opt, idx) => {
      if (opt?.value == null) return;
      const forced = rank(String(opt.value));
      m.set(String(opt.value), forced ?? idx + 10);
    });
    return m;
  }, [encounterPriorityEnumOptions]);

  const priorityLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    encounterPriorityEnumOptions.forEach(v => {
      if (v?.value != null) m.set(String(v.value), String(v.label ?? v.value));
    });
    return m;
  }, [encounterPriorityEnumOptions]);

  const priorityDotColor = useMemo(() => {
    const palette = ['#16a34a', '#dc2626', '#f97316', '#eab308', '#7c3aed', '#0ea5e9'];
    const m = new Map<string, string>();
    encounterPriorityEnumOptions.forEach((v, idx) => {
      if (v?.value != null) m.set(String(v.value), palette[idx % palette.length]);
    });
    return m;
  }, [encounterPriorityEnumOptions]);

  const sortedTableData = useMemo(() => {
    const copied = [...(normalizedRows ?? [])];
    copied.sort((a, b) => {
      const aKey = a?.priorityLevel ? String(a.priorityLevel) : '';
      const bKey = b?.priorityLevel ? String(b.priorityLevel) : '';
      const aOrder = aKey ? priorityOrderMap.get(aKey) ?? 999999 : 999999;
      const bOrder = bKey ? priorityOrderMap.get(bKey) ?? 999999 : 999999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      const aDate = a?.encounterDate ? new Date(a.encounterDate).getTime() : 0;
      const bDate = b?.encounterDate ? new Date(b.encounterDate).getTime() : 0;
      return aDate - bDate;
    });
    return copied;
  }, [normalizedRows, priorityOrderMap]);

  const tableData = useMemo(() => sortedTableData ?? [], [sortedTableData]);

  const isSelected = (rowData: any) => {
    if (
      rowData &&
      encounter &&
      String(rowData?.id ?? rowData?.key) === String(encounter?.id ?? encounter?.key)
    ) {
      return 'selected-row';
    }
    return '';
  };

  const handleGoToViewTriage = async (encounterData: any, patientData: any) => {
    const targetPath = '/view-triage';
    navigate(targetPath, {
      state: {
        from: 'ER_Triage',
        info: 'toViewTriage',
        patient: patientData,
        encounter: encounterData
      }
    });
  };

  const handleCancelEncounter = async () => {
    try {
      const id = encounter?.id ?? encounter?.key;
      if (id) {
        await cancelEncounter({ id }).unwrap();
        refetchEncounter();
        dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
        setOpen(false);
      }
    } catch (error) {
      console.error('Encounter completion error:', error);
      dispatch(notify({ msg: 'An error occurred while canceling the encounter', sev: 'error' }));
    }
  };

  const buildEncounterUpdateBody = (row: any, patch: Partial<any>) => {
    const body: any = {
      id: row?.id,
      patientId: row?.patientId ?? row?.patient?.id ?? row?.patientObject?.id,
      encounterNumber: row?.encounterNumber ?? null,
      facilityId: row?.facilityId,
      departmentId: row?.departmentId,
      practitionerId: row?.practitionerId ?? null,
      encounterType: row?.encounterType,
      encounterReason: row?.encounterReason,
      followUpEncounterId: row?.followUpEncounterId ?? null,
      priorityLevel: row?.priorityLevel,
      originType: row?.originType ?? null,
      originName: row?.originName ?? null,
      notes: row?.notes ?? null,
      departmentDailySequenceNumber: row?.departmentDailySequenceNumber ?? null,
      encounterDate: row?.encounterDate ?? null,
      status: row?.status,
      chiefComplaint: row?.chiefComplaint ?? null,
      hasPrescription: row?.hasPrescription ?? false,
      hasOrder: row?.hasOrder ?? false,
      isObserved: row?.isObserved ?? false
    };

    Object.assign(body, patch ?? {});

    const missing: string[] = [];
    if (body.id == null) missing.push('id');
    if (body.patientId == null) missing.push('patientId');
    if (body.facilityId == null) missing.push('facilityId');
    if (body.departmentId == null) missing.push('departmentId');
    if (body.encounterType == null) missing.push('encounterType');
    if (body.encounterReason == null) missing.push('encounterReason');
    if (body.priorityLevel == null) missing.push('priorityLevel');
    if (body.status == null) missing.push('status');

    if (missing.length) {
      throw new Error(`Cannot update encounter: missing required fields: ${missing.join(', ')}`);
    }

    return body;
  };

  const isPendingPaymentStatus = (rowData: any) =>
    String(rowData?.status ?? rowData?.encounterStatus ?? '').toUpperCase() === 'PENDING_PAYMENT';

  const handleAddPayment = async (rowData: any): Promise<boolean> => {
    setPaymentRow(rowData);
    setPayment({ ...newPatientPayments });
    setPatientInsurance({ ...newPatientInsurance });
    setPaymentModalOpen(true);
    return true;
  };

  const handleSetPaymentModalOpen = (open: boolean) => {
    setPaymentModalOpen(open);
    if (!open) {
      setPaymentRow(null);
    }
  };

  const handleSavePayment = async () => {
    try {
      const encounterId = paymentRow?.id ?? null;
      if (encounterId) {
        await updateEncounter({
          id: encounterId,
          body: buildEncounterUpdateBody(paymentRow, { status: 'WAITING_TRIAGE' })
        }).unwrap();
      }

      dispatch(notify({ msg: 'Payment saved', sev: 'success' }));
      refetchEncounter();
      handleSetPaymentModalOpen(false);
    } catch (e: any) {
      dispatch(
        notify({
          msg:
            e?.data?.message ||
            e?.message ||
            'Payment saved, but failed to update encounter status',
          sev: 'error'
        })
      );
    }
  };

  const handleUpdateEncounterPriority = useCallback(
    async (rowData: any, priorityCode: string): Promise<boolean> => {
      try {
        const encounterId = rowData?.id ?? null;
        if (!encounterId) return false;

        await updateEncounter({
          id: encounterId,
          body: buildEncounterUpdateBody(
            {
              ...rowData,
              priorityLevel: priorityCode
            },
            { priorityLevel: priorityCode }
          )
        }).unwrap();

        dispatch(notify({ msg: 'Priority updated', sev: 'success' }));
        refetchEncounter();
        return true;
      } catch (error) {
        console.error('Priority update error:', error, { rowData, priorityCode });
        dispatch(
          notify({
            msg: (error as any)?.message || 'Failed to update priority',
            sev: 'error'
          })
        );
        return false;
      }
    },
    [updateEncounter, dispatch, refetchEncounter]
  );

  const handleGoToVisit = async (encounterData: any, patientData: any) => {
    try {
      const encounterId = encounterData?.id;
      const patientId = toNumberOrNaN(
        patientData?.id ?? patientData?.patientId ?? patientData?.key
      );

      const statusUpper = String(
        encounterData?.status ?? encounterData?.encounterStatus ?? ''
      ).toUpperCase();

      if (
        statusUpper !== 'TRIAGE_STARTED' &&
        typeof encounterId === 'number' &&
        !Number.isNaN(encounterId)
      ) {
        await updateEncounter({
          id: encounterId,
          body: buildEncounterUpdateBody(encounterData, { status: 'TRIAGE_STARTED' })
        }).unwrap();
      }

      const emergencyTriageNew =
        typeof encounterId === 'number' && !Number.isNaN(encounterId) && !Number.isNaN(patientId)
          ? await createOrGetEmergencyTriage({ encounterId, patientId }).unwrap()
          : null;

      const targetPath = '/urgent-care-start-triage';

      if (!emergencyTriageNew) {
        console.warn(
          '[ER Triage] Could not create/get emergency triage record: missing numeric patientId/encounterId',
          { patientId, encounterId, patientData, encounterData }
        );
      }

      navigate(targetPath, {
        state: {
          info: 'to_Urgent_Care_Start_Triage',
          fromPage: 'urgent-care-triage',
          patient: patientData,
          encounter: encounterData,
          emergencyTriageNew
        }
      });
    } catch (error: any) {
      console.error('Start triage error:', error, { encounterData, patientData });

      const errorKey = error?.message || error?.data?.message || '';
      let readableMessage = 'Failed to start triage';

      if (errorKey === 'error.patient.emergency.notAllowed.withOngoing') {
        readableMessage =
          'Cannot start a new triage because the patient already has an ongoing encounter.';
      } else if (errorKey) {
        readableMessage = errorKey.replaceAll('.', ' ');
      }

      dispatch(
        notify({
          msg: readableMessage,
          sev: 'error'
        })
      );
    }
  };

  useEffect(() => {
    const onResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isFetching && manualSearchTriggered) {
      setManualSearchTriggered(false);
    }
  }, [isFetching, manualSearchTriggered]);

  useEffect(() => {
    if (isLoading || isFetching) {
      dispatch(showSystemLoader());
    } else {
      dispatch(hideSystemLoader());
    }

    return () => {
      dispatch(hideSystemLoader());
    };
  }, [isLoading, isFetching, dispatch]);

  useEffect(() => {
    if (refetch) {
      dispatch(showSystemLoader());

      const doRefetch = async () => {
        try {
          await refetchEncounter();
        } catch (error) {
          console.error('Error while refetching encounter:', error);
        } finally {
          dispatch(hideSystemLoader());
          dispatch(resetRefetchEncounter());
        }
      };

      doRefetch();
    }
  }, [refetch, refetchEncounter, dispatch]);

  const triggerSearch = useCallback(() => {
    setManualSearchTriggered(true);
    setPage(0);
    setHasSearched(true);
    setSearchTick(t => t + 1);
  }, []);

  const handleSearchClick = () => {
    triggerSearch();
  };

  const handleClearClick = () => {
    const now = new Date();
    const lastWeekDate = new Date(now);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);

    const nextDateFilter = { fromDate: lastWeekDate, toDate: now };
    const nextEncounterStatus = { codes: [...DEFAULT_ENCOUNTER_STATUS_CODES] };

    setDateFilterSafe(nextDateFilter);
    setEncounterStatusSafe(nextEncounterStatus);
    setSelectedPatientSafe(null);
    setPatientSearchResetToken(v => v + 1);

    triggerSearch();
  };

  useEffect(() => {
    if (!departmentId) return;
    if (hasSearched) return;
    triggerSearch();
  }, [departmentId, hasSearched, triggerSearch]);

  const prevOpenCreatePatientRef = useRef(openCreatePatient);
  const prevOpenQuickPatientRef = useRef(openQuickPatient);

  useEffect(() => {
    const wasOpen = prevOpenCreatePatientRef.current;
    if (wasOpen && !openCreatePatient) {
      triggerSearch();
    }
    prevOpenCreatePatientRef.current = openCreatePatient;
  }, [openCreatePatient, triggerSearch]);

  useEffect(() => {
    const wasOpen = prevOpenQuickPatientRef.current;
    if (wasOpen && !openQuickPatient) {
      triggerSearch();
    }
    prevOpenQuickPatientRef.current = openQuickPatient;
  }, [openQuickPatient, triggerSearch]);

  const tableColumns = [
    {
      key: 'encounterCreatedAt',
      title: <Translate>Time Encounter Created</Translate>,
      expandable: true,
      render: (rowData: any) => formatDateTime(rowData?.createdAt)
    },
    {
      key: 'triageStartedAt',
      title: <Translate>Time Triage Started</Translate>,
      expandable: true,
      render: (rowData: any) => {
        const encounterId = rowData?.id ?? rowData?.encounterId ?? rowData?.key;
        const fallbackCreatedAt =
          rowData?.emergencyTriage?.createdDate ?? rowData?.emergencyTriage?.createdAt ?? null;
        return (
          <TriageStartedAtCell encounterId={encounterId} fallbackCreatedAt={fallbackCreatedAt} />
        );
      }
    },
    {
      key: 'waitingTime',
      title: <Translate>Waiting Time</Translate>,
      expandable: true,
      render: (rowData: any) => {
        const encounterId = rowData?.id ?? rowData?.encounterId ?? rowData?.key;
        return (
          <WaitingTimeCell
            encounterId={encounterId}
            arrivalCreatedAt={rowData?.createdAt}
            fallbackTriageCreatedAt={
              rowData?.emergencyTriage?.createdDate ?? rowData?.emergencyTriage?.createdAt ?? null
            }
          />
        );
      }
    },
    {
      key: 'triageCompletedAt',
      title: <Translate>Time Triage Completed</Translate>,
      expandable: true,
      render: (rowData: any) => {
        const encounterId = rowData?.id ?? rowData?.encounterId ?? rowData?.key;
        return (
          <TriageCompletedAtCell
            encounterId={encounterId}
            fallbackUpdatedAt={rowData?.emergencyTriage?.updatedAt ?? rowData?.updatedAt ?? null}
            completedAt={rowData?.completedAt ?? null}
            completedDate={rowData?.completedDate ?? null}
          />
        );
      }
    },
    {
      key: 'triageTime',
      title: <Translate>Triage Time</Translate>,
      expandable: true,
      render: (rowData: any) => {
        const encounterId = rowData?.id ?? rowData?.encounterId ?? rowData?.key;
        return (
          <TriageTimeCell
            encounterId={encounterId}
            fallbackTriageCreatedAt={
              rowData?.emergencyTriage?.createdDate ?? rowData?.emergencyTriage?.createdAt ?? null
            }
            fallbackUpdatedAt={rowData?.emergencyTriage?.updatedAt ?? null}
            rowUpdatedAt={rowData?.updatedAt ?? null}
            completedAt={rowData?.completedAt ?? null}
            completedDate={rowData?.completedDate ?? null}
          />
        );
      }
    },
    {
      key: 'queueNumber',
      title: <Translate>#</Translate>,
      dataKey: 'queueNumber',
      render: (_rowData: any, rowIndex?: number) => {
        const i = typeof rowIndex === 'number' ? rowIndex : 0;
        return page * pageSize + i + 1;
      }
    },
    {
      key: 'patientFullName',
      title: <Translate>PATIENT NAME</Translate>,
      fullText: true,
      render: (rowData: any) => {
        const tooltipSpeaker = (
          <Tooltip>
            <div>MRN : {rowData?.patientObject?.medicalRecordNumber}</div>
            <div>
              Age :{' '}
              {rowData?.patientObject?.dateOfBirth
                ? calculateAgeFormat(rowData?.patientObject?.dateOfBirth)
                : ''}
            </div>
            <div>Gender : {rowData?.patientObject?.sexAtBirth || ''}</div>
            <div>Visit ID : {rowData?.visitId}</div>
          </Tooltip>
        );

        const patientName = (
          <span className="patient-name-text">
            {[
              rowData?.patientObject?.firstName,
              rowData?.patientObject?.secondName,
              rowData?.patientObject?.lastName
            ]
              .filter(Boolean)
              .join(' ')}
          </span>
        );

        return (
          <Whisper trigger="hover" placement="top" speaker={tooltipSpeaker}>
            <div className="patient-name-wrapper">
              {rowData?.patientObject?.privatePatient ? (
                <Badge className="patient-badge" color="blue" content="Private">
                  {patientName}
                </Badge>
              ) : (
                patientName
              )}
            </div>
          </Whisper>
        );
      }
    },
    {
      key: 'emergencyLevel',
      title: <Translate>ER Level</Translate>,
      render: (rowData: any) => {
        const encounterId = rowData?.id ?? rowData?.encounterId ?? rowData?.key;
        return (
          <EmergencyLevelCell
            encounterId={encounterId}
            labelMap={emergencyLevelLabelMap}
            colorMap={emergencyLevelColorMap}
          />
        );
      }
    },
    {
      key: 'priorityLevel',
      title: <Translate>Priority</Translate>,
      render: (rowData: any) => {
        const key = rowData?.priorityLevel ? String(rowData.priorityLevel) : '';
        return key ? priorityLabelMap.get(key) ?? key : '';
      }
    },
    {
      key: 'chiefComplaint',
      title: <Translate>CHIEF COMPLAIN</Translate>,
      render: (rowData: any) => rowData.chiefComplaint
    },
    {
      key: 'plannedStartDate',
      title: <Translate>DATE</Translate>,
      dataKey: 'plannedStartDate'
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      render: (rowData: any) => {
        const statusCode = String(rowData?.status ?? rowData?.encounterStatus ?? '').toUpperCase();
        const statusColorMap: Record<string, string> = {
          PENDING_PAYMENT: '#fd7e14',
          WAITING_TRIAGE: '#b8860b',
          TRIAGE_STARTED: '#6f42c1'
        };
        const color = statusColorMap[statusCode] ?? '#969fb0';
        return (
          <MyBadgeStatus
            color={color}
            contant={
              encounterStatusLabelMap.get(
                String(rowData?.status ?? rowData?.encounterStatus ?? '')
              ) ?? String(rowData?.status ?? rowData?.encounterStatus ?? '')
            }
          />
        );
      }
    },
        {
          key :'encounterStatus',
          title: 'ENCOUNTER STATUS',
          render: (row: any) => {
            const statusUpper = String(row?.encounterStatus ?? '').toUpperCase();
            const statusColorMap: Record<string, string> = {
              OPEN: '#0d6efd',
              IN_PROGRESS: '#198754',
        
              CANCELLED: '#ffc107',
              CLOSED: '#6c757d'
            };  
    
            return (
              <MyBadgeStatus
                color={statusColorMap[statusUpper] ?? '#969fb0'}
                contant={formatEnumString(row?.encounterStatus) ?? row?.encounterStatus ?? ''}
              />
            );
          }
    
    
        },
    {
      key: 'actions',
      title: <Translate> </Translate>,
      render: (rowData: any) => {
        const isPendingPayment = isPendingPaymentStatus(rowData);
        const tooltipEmr = <Tooltip>Open EMR</Tooltip>;
        const tooltipPrint = <Tooltip>Print wrist band</Tooltip>;

        const statusUpper = String(
          rowData?.status ?? rowData?.encounterStatus ?? ''
        ).toUpperCase();

        const tooltipStart = !rowData?.priorityLevel ? (
          <Tooltip>Please set Priority first</Tooltip>
        ) : statusUpper === 'TRIAGE_STARTED' ? (
          <Tooltip>Resume Triage</Tooltip>
        ) : (
          <Tooltip>Start Triage</Tooltip>
        );

        const tooltipTriage = <Tooltip>View Triage</Tooltip>;
        const tooltipCancel = (
          <Tooltip>Cancel is only allowed for NEW, WAITING TRIAGE, or PENDING PAYMENT</Tooltip>
        );
        const tooltipPayment = <Tooltip>Add Payment</Tooltip>;
        const tooltipPaymentDisabled = (
          <Tooltip>Payment is only available for pending payment encounters</Tooltip>
        );
        const tooltipBlockedByPayment = <Tooltip>Please add payment first</Tooltip>;

        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            <Whisper
              trigger="hover"
              placement="top"
              speaker={isPendingPayment ? tooltipBlockedByPayment : tooltipEmr}
            >
              <div
                onClick={(e: any) => {
                  e?.stopPropagation?.();
                }}
              >
                <MyButton
                  size="small"
                  radius="6px"
                  backgroundColor="violet"
                  disabled={isPendingPayment || isReceptionist}
                  onClick={() => {
                    const patientData = rowData?.patientObject;

                    if (patientData) {
                      dispatch(setPatient(patientData));
                    }

                    dispatch(setEncounter(rowData));

                    setEmrPatient(patientData);
                    setEmrEncounter(rowData);
                    setOpenEMRModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faFileLines} color="white" />
                </MyButton>
              </div>
            </Whisper>

            <Whisper
              trigger="hover"
              placement="top"
              speaker={isPendingPayment ? tooltipPayment : tooltipPaymentDisabled}
            >
              <div
                onClick={(e: any) => {
                  e?.stopPropagation?.();
                }}
              >
                <MyButton
                  size="small"
                  backgroundColor="green"
                  disabled={!isPendingPayment}
                  onClick={() => {
                    void handleAddPayment(rowData);
                  }}
                >
                  <FontAwesomeIcon icon={faMoneyBillWave} />
                </MyButton>
              </div>
            </Whisper>

            <EncounterPriorityAction
              rowData={rowData}
              encounterPriorityEnumOptions={encounterPriorityEnumOptions}
              priorityDotColor={priorityDotColor}
              isPendingPayment={isPendingPayment}
              onUpdatePriority={handleUpdateEncounterPriority}
              isReceptionist={isReceptionist}
            />

            {String(rowData?.status ?? rowData?.encounterStatus ?? '').toUpperCase() ===
              COMPLETE_TRIAGE_STATUS_CODE ||
            String(rowData?.status ?? rowData?.encounterStatus ?? '').toUpperCase() ===
              SENT_TO_ER_STATUS_CODE ? (
              <Whisper trigger="hover" placement="top" speaker={tooltipTriage}>
                <div>
                  <MyButton
                    size="small"
                    onClick={() => {
                      const patientData = rowData?.patientObject;
                      setLocalEncounter(rowData);
                      handleGoToViewTriage(rowData, patientData);
                    }}
                    disabled={isPendingPayment || isReceptionist}
                  >
                    <FontAwesomeIcon icon={faCommentMedical} />
                  </MyButton>
                </div>
              </Whisper>
            ) : (
              <Whisper
                trigger="hover"
                placement="top"
                speaker={isPendingPayment ? tooltipBlockedByPayment : tooltipStart}
              >
                <div>
                  <MyButton
                    size="small"
                    backgroundColor="black"
                    onClick={() => {
                      setLocalEncounter(rowData);
                      handleGoToVisit(rowData, rowData?.patientObject);
                    }}
                    disabled={
                      isReceptionist ||
                      isPendingPayment ||
                      !['NEW', 'WAITING_TRIAGE', 'TRIAGE_STARTED'].includes(
                        String(rowData?.status ?? rowData?.encounterStatus ?? '').toUpperCase()
                      ) ||
                      (String(rowData?.status ?? rowData?.encounterStatus ?? '').toUpperCase() !==
                        'TRIAGE_STARTED' &&
                        !rowData?.priorityLevel)
                    }
                  >
                    <FontAwesomeIcon
                      icon={
                        String(rowData?.status ?? rowData?.encounterStatus ?? '').toUpperCase() ===
                        'TRIAGE_STARTED'
                          ? faPause
                          : faCirclePlay
                      }
                    />
                  </MyButton>
                </div>
              </Whisper>
            )}

            <Whisper
              trigger="hover"
              placement="top"
              speaker={isPendingPayment ? tooltipBlockedByPayment : tooltipPrint}
            >
              <div>
                
                <PatientWritBandPrintLabelButton  disabled={isPendingPayment || isReceptionist} patientId={rowData.patientId}  />
              </div>
            </Whisper>

            <AssignBedAction
              rowData={rowData}
              isPendingPayment={isPendingPayment}
              setLocalEncounter={setLocalEncounter}
              setOpenBedAssignmentModal={setOpenBedAssignmentModal}
              isReceptionist={isReceptionist}
            />

            {['WAITING_TRIAGE', 'NEW', 'PENDING_PAYMENT'].includes(
              String(rowData?.status ?? rowData?.encounterStatus ?? '').toUpperCase()
            ) && (
              <Whisper trigger="hover" placement="top" speaker={tooltipCancel}>
                <div>
                  <MyButton
                    size="small"
                    disabled={isReceptionist}
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
          </Form>
        );
      },
      expandable: false
    }
  ];

  const pageIndex = page;
  const rowsPerPage = pageSize;
  const totalCount = encountersPaged?.totalCount ?? 0;

  const handlePageChange = (_: unknown, newPage: number) => {
    setManualSearchTriggered(true);
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualSearchTriggered(true);
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filters = () => {
    return (
      <>
        <Form fluid className="date-filter-form">
          <div className="er-triage-filters-position-handle">
            <MyInput
              width={180}
              fieldType="date"
              fieldLabel="From Date"
              fieldName="fromDate"
              record={dateFilter}
              setRecord={setDateFilterSafe}
            />
            <MyInput
              width={180}
              fieldType="date"
              fieldLabel="To Date"
              fieldName="toDate"
              record={dateFilter}
              setRecord={setDateFilterSafe}
            />
            <PatientSearch
              value={selectedPatient}
              onChange={setSelectedPatientSafe}
              resetToken={patientSearchResetToken}
            />

            <MyInput
              width="10vw"
              fieldType="checkPicker"
              fieldLabel="Encounter Status"
              fieldName="codes"
              selectData={encounterStatusEnumOptions}
              selectDataLabel="label"
              selectDataValue="value"
              record={encounterStatus}
              setRecord={setEncounterStatusSafe}
            />
          </div>
        </Form>
        <AdvancedSearchFilters
          searchFilter={true}
          showAdvancedButton={false}
          extraActions={
            <>
              <MyButton
                appearance="ghost"
                onClick={() => setOpenCreatePatient(true)}
                prefixIcon={() => <FontAwesomeIcon icon={faUserPlus} />}
              >
                Create New Patient
              </MyButton>
              <MyButton
                appearance="ghost"
                onClick={() => setOpenQuickPatient(true)}
                prefixIcon={() => <FontAwesomeIcon icon={faBolt} />}
              >
                Quick Patient
              </MyButton>
            </>
          }
          searchOnClick={handleSearchClick}
          clearOnClick={handleClearClick}
        />
      </>
    );
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      {patientSidebarOpen && (
        <div className="er-triage-patient-sidebar-overlay">
          <ProfileSidebarNew
            expand={true}
            setExpand={setPatientSidebarOpen}
            windowHeight={windowHeight}
            setLocalPatient={(p: any) => {
              setSelectedPatientSafe(p);
              setPatientSidebarOpen(false);
            }}
            refetchData={refetchPatientSidebar}
            setRefetchData={setRefetchPatientSidebar}
            showButton={true}
            direction="right"
          />
        </div>
      )}

      <Panel>
        <MyTable
          filters={filters()}
          height={600}
          data={tableData}
          columns={tableColumns}
          rowClassName={isSelected}
          loading={isLoading || (manualSearchTriggered && isFetching)}
          onRowClick={rowData => {
            setLocalEncounter(rowData);
          }}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />

        <BedAssignmentModal
          refetchEncounter={refetchEncounter}
          open={openBedAssignmentModal}
          setOpen={setOpenBedAssignmentModal}
          encounter={encounter}
          departmentId={String(encounter?.departmentId ?? departmentId)}
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

        <CreateNewPatient open={openCreatePatient} setOpen={setOpenCreatePatient} />
        <QuickPatient open={openQuickPatient} setOpen={setOpenQuickPatient} />
      </Panel>

      <AddPaymentModal
        open={paymentModalOpen}
        setOpen={handleSetPaymentModalOpen}
        paymentRow={paymentRow}
        payment={payment}
        setPayment={setPayment}
        patientInsurance={patientInsurance}
        setPatientInsurance={setPatientInsurance}
        onSave={handleSavePayment}
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
    </div>
  );
};

export default UrgentCareTriage;
