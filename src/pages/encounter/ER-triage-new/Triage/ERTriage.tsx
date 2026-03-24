import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { newApEncounter } from '@/types/model-types-constructor';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { faUserPlus, faBolt } from '@fortawesome/free-solid-svg-icons';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { Badge, Form, Panel, Popover, Tooltip, Whisper } from 'rsuite';
import { Modal } from 'rsuite';

import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import 'react-tabs/style/react-tabs.css';
import { calculateAgeFormat, formatDate, formatEnumString } from '@/utils';
import { faCommentMedical } from '@fortawesome/free-solid-svg-icons';
import {
  useCancelEncounterMutation,
  useFilterEncountersQuery,
  useUpdateEncounterMutation
} from '@/services/encounters/patientEncounterService';
import { useLocation } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch, useSelector } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { faBarcode } from '@fortawesome/free-solid-svg-icons';
import { faCirclePlay } from '@fortawesome/free-solid-svg-icons';
import { faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useEnumOptions } from '@/services/enumsApi';
import { resetRefetchEncounter } from '@/reducers/refetchEncounterState';
import { useNavigate } from 'react-router-dom';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import SendToModal from './component/SendToModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
import PatientSearch from '@/components/PatientSearch';
import ProfileSidebarNew from '@/pages/patient/patient-profile/ProfileSidebar-new';
import CreateNewPatient from '@/pages/patient/facility-patient-list/CreateNewPatient';
import QuickPatient from '@/pages/patient/facility-patient-list/QuickPatient';
import '../styles.less';
import PatientPaymentInfo, {
  PatientPaymentInfoHandle
} from '@/pages/patient/patient-profile/PatientQuickAppoinment/PatientPaymentInfo';
import { newPatientInsurance, newPatientPayments } from '@/types/model-types-constructor-new';
import {
  useCreateOrGetEmergencyTriageMutation,
  useGetLatestEmergencyTriageByEncounterQuery
} from '@/services/encounters/er-triage/emergencyTriageService';
import {
  useGetBulkPatientBasicInfoMutation,
  useLazyGetPatientWristbandQuery
} from '@/services/patient/patientService';

import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import MyModal from '@/components/MyModal/MyModal';
import PatientEMRModal from '@/pages/patient/patient-emr/PatientEMRModal';
import { printPatientWristband } from '@/utils/printPatientWristband';

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

const DestinationCell = ({ encounterId, fallbackDestination }: any) => {
  const id = toNumberOrNaN(encounterId);
  const { data: latestEmergencyTriage } = useGetLatestEmergencyTriageByEncounterQuery(id as any, {
    skip: Number.isNaN(id)
  });

  const latest = unwrapApiObject<any>(latestEmergencyTriage);
  const destination = latest?.destination ?? fallbackDestination ?? null;
  if (!destination) return <></>;

  return <>{formatEnumString(String(destination))}</>;
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

const ERTriage = () => {
  const SENT_TO_ER_STATUS_CODE = 'SENT_TO_ER';
  const COMPLETE_TRIAGE_STATUS_CODE = 'CLOSED';

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
    statusCode,
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
    statusCode,
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
        completedDate ??
        null
    );
    if (!triageStart || !end) return <></>;
    return <>{formatDuration(end.getTime() - triageStart.getTime())}</>;
  };

  const location = useLocation();
  const dispatch = useDispatch();
  const [cancelEncounter] = useCancelEncounterMutation();
  const [updateEncounter] = useUpdateEncounterMutation();
  const [triggerWristband] = useLazyGetPatientWristbandQuery();
  const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter, discharge: false });
  const [manualSearchTriggered, setManualSearchTriggered] = useState(true);
  const [openSendToModal, setOpenSendToModal] = useState(false);
  const [sendToEmergencyTriageNew, setSendToEmergencyTriageNew] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [encounterStatus, setEncounterStatus] = useState<{ codes: string[] }>(() => ({
    codes: [...DEFAULT_ENCOUNTER_STATUS_CODES]
  }));
  const [createOrGetEmergencyTriage] = useCreateOrGetEmergencyTriageMutation();
  const navigate = useNavigate();
  const [openEMRModal, setOpenEMRModal] = useState(false);
  const [emrPatient, setEmrPatient] = useState<any>(null);
  const [emrEncounter, setEmrEncounter] = useState<any>(null);

  const handlePrintWristband = async (rowData: any) => {
    try {
      const patientId = rowData?.patientObject?.id ?? rowData?.patientId ?? rowData?.patient?.id;

      if (!patientId) return;

      const res = await triggerWristband({ patientId }).unwrap();

      await printPatientWristband(res);
    } catch (err: any) {
      console.error('Wristband print failed', err);

      dispatch(
        notify({
          msg: err?.data?.message || 'Failed to print wristband',
          sev: 'error'
        })
      );
    }
  };
  const selectedDepartment = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('selectedDepartment') || 'null');
    } catch {
      return null;
    }
  }, []);

  const departmentId = Number(selectedDepartment?.departmentId ?? selectedDepartment?.id ?? 0) || 0;

  // ✅ التعديل: fromDate = أسبوع قبل اليوم
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
  const paymentInfoRef = useRef<PatientPaymentInfoHandle>(null);

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

  const divContent = 'ER Triage';

  useEffect(() => {
    dispatch(setPageCode('ER_Triage'));
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
  const encounterStatusEnumOptions = useEnumOptions('EncounterStatus');
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

    const buildPatientFullName = (p: any) => {
      const v = String(p?.fullName ?? '').trim();
      if (v) return v;
      const parts = [p?.firstName, p?.secondName, p?.thirdName, p?.lastName].filter(Boolean);
      const joined = parts.join(' ').trim();
      return joined || '-';
    };

    return rows.map((encounterRow: any) => {
      const statusCode = String(encounterRow?.status ?? '').toUpperCase();
      const priorityCode = String(encounterRow?.priorityLevel ?? '').toUpperCase();

      const patientId = encounterRow?.patient?.id ?? null;
      const patientFromMap = patientId != null ? patientByIdMap.get(String(patientId)) : null;

      const patientFromEncounter = encounterRow?.patient ?? null;
      const patientMerged = patientFromEncounter || patientFromMap || null;

      const fullName = patientMerged ? buildPatientFullName(patientMerged) : '-';

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
        updatedAt: null
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
      )
        return 0;
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

  const tableData = useMemo(() => {
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
    if (body.hasPrescription == null) missing.push('hasPrescription');
    if (body.hasOrder == null) missing.push('hasOrder');
    if (body.isObserved == null) missing.push('isObserved');

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

  const handleUpdateEncounterPriority = async (
    rowData: any,
    priorityCode: string
  ): Promise<boolean> => {
    try {
      const encounterId = rowData?.id ?? null;
      if (!encounterId) return false;

      await updateEncounter({
        id: encounterId,
        body: buildEncounterUpdateBody(rowData, { priorityLevel: priorityCode })
      }).unwrap();
      dispatch(notify({ msg: 'Priority updated', sev: 'success' }));
      refetchEncounter();
      return true;
    } catch (error) {
      console.error('Priority update error:', error, { rowData });
      dispatch(
        notify({
          msg:
            (error as any)?.message ||
            'Failed to update priority (missing required encounter fields?)',
          sev: 'error'
        })
      );
      return false;
    }
  };

  const EncounterPriorityAction = ({ rowData }: { rowData: any }) => {
    const whisperRef = useRef<any>(null);
    const [lockHoverUntilLeave, setLockHoverUntilLeave] = useState(false);
    const isPendingPayment = isPendingPaymentStatus(rowData);

    const prioritySpeaker = (
      <Popover title="Priority" className="er-priority-popover">
        <div className="er-priority-menu">
          {(encounterPriorityEnumOptions ?? []).map((p: any) => (
            <button
              type="button"
              key={p?.value}
              className={
                String(rowData?.priorityLevel ?? '') === String(p?.value ?? '')
                  ? 'er-priority-item is-selected'
                  : 'er-priority-item'
              }
              onClick={async (e: any) => {
                e?.stopPropagation?.();
                const ok = await handleUpdateEncounterPriority(rowData, String(p?.value ?? ''));
                if (ok) {
                  setLockHoverUntilLeave(true);
                  whisperRef.current?.close?.();
                }
              }}
            >
              <span className="er-priority-left">
                <span
                  className="er-priority-dot"
                  style={{
                    backgroundColor: priorityDotColor.get(String(p?.value ?? '')) ?? '#98A2B4'
                  }}
                />
                <span className="er-priority-label">{p?.label ?? p?.value ?? ''}</span>
              </span>
              {String(rowData?.priorityLevel ?? '') === String(p?.value ?? '') ? (
                <span className="er-priority-check">✓</span>
              ) : (
                <span className="er-priority-check-placeholder" />
              )}
            </button>
          ))}
        </div>
      </Popover>
    );

    return (
      <Whisper trigger="hover" placement="top" speaker={<Tooltip>Set priority</Tooltip>}>
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Whisper
            ref={whisperRef}
            trigger={
              isPendingPayment
                ? 'click'
                : lockHoverUntilLeave
                ? 'click'
                : (['hover', 'click'] as any)
            }
            placement="leftStart"
            speaker={prioritySpeaker}
            enterable
            delayClose={300}
          >
            <div
              style={{ display: 'inline-flex', alignItems: 'center' }}
              onMouseLeave={() => setLockHoverUntilLeave(false)}
            >
              <MyButton size="small" disabled={isPendingPayment}>
                <FontAwesomeIcon icon={faCircleExclamation} />
              </MyButton>
            </div>
          </Whisper>
        </div>
      </Whisper>
    );
  };

  const handleGoToVisit = async (encounterData: any, patientData: any) => {
    try {
      const encounterId = encounterData?.id;
      const patientId = toNumberOrNaN(
        patientData?.id ?? patientData?.patientId ?? patientData?.key
      );

      const statusUpper = String(
        encounterData?.status ?? encounterData?.encounterStatus ?? ''
      ).toUpperCase();
      if (statusUpper === 'TRIAGE_STARTED') {
        const targetPath = '/ER-start-triage';
        sessionStorage.setItem('encounterPageSource', 'EncounterList');
        navigate(targetPath, {
          state: {
            info: 'to_Start_Triage',
            fromPage: 'ER_Triage',
            patient: patientData,
            encounter: encounterData,
            emergencyTriageNew: null
          }
        });
        return;
      }

      if (typeof encounterId === 'number' && !Number.isNaN(encounterId)) {
        await updateEncounter({
          id: encounterId,
          body: buildEncounterUpdateBody(encounterData, { status: 'TRIAGE_STARTED' })
        }).unwrap();
      }

      const emergencyTriageNew =
        typeof encounterId === 'number' && !Number.isNaN(encounterId) && !Number.isNaN(patientId)
          ? await createOrGetEmergencyTriage({ encounterId, patientId }).unwrap()
          : null;

      const targetPath = '/ER-start-triage';

      sessionStorage.setItem('encounterPageSource', 'EncounterList');

      if (!emergencyTriageNew) {
        console.warn(
          '[ER Triage] Could not create/get new emergency triage record: missing numeric patientId/encounterId',
          { patientId, encounterId, patientData, encounterData }
        );
      }

      navigate(targetPath, {
        state: {
          info: 'to_Start_Triage',
          fromPage: 'ER_Triage',
          patient: patientData,
          encounter: encounterData,
          emergencyTriageNew
        }
      });
    } catch (error) {
      console.error('Start triage error:', error, { encounterData, patientData });
      dispatch(
        notify({
          msg:
            (error as any)?.message ||
            'Failed to start triage (missing required encounter fields?)',
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
            statusCode={rowData?.status ?? rowData?.encounterStatus}
            fallbackUpdatedAt={rowData?.emergencyTriage?.updatedAt ?? null}
            rowUpdatedAt={rowData?.updatedAt ?? null}
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
            statusCode={rowData?.status ?? rowData?.encounterStatus}
            arrivalCreatedAt={rowData?.createdAt}
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
      title: <Translate>PATIENT NAME </Translate>,
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

        return (
          <Whisper trigger="hover" placement="top" speaker={tooltipSpeaker}>
            <div style={{ display: 'inline-block' }}>
              {rowData?.patientObject?.privatePatient ? (
                <Badge color="blue" content="Private">
                  <p style={{ marginTop: '5px', cursor: 'pointer' }}>
                    {rowData?.patientObject?.firstName} {rowData?.patientObject?.lastName}
                  </p>
                </Badge>
              ) : (
                <>
                  <p style={{ cursor: 'pointer' }}>
                    {rowData?.patientObject?.firstName} {rowData?.patientObject?.lastName}
                  </p>
                </>
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
      key: 'destination',
      title: 'Destination',
      render: (row: any) => {
        const encounterId = row?.id ?? row?.encounterId ?? row?.key;
        const fallbackDestination =
          row?.emergencyTriage?.destination ?? row?.emergencyTriage?.destinationLkey ?? null;
        return (
          <DestinationCell encounterId={encounterId} fallbackDestination={fallbackDestination} />
        );
      }
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      render: (rowData: any) => (
        <MyBadgeStatus
          color="#98A2B4"
          contant={
            encounterStatusLabelMap.get(
              String(rowData?.status ?? rowData?.encounterStatus ?? '')
            ) ?? String(rowData?.status ?? rowData?.encounterStatus ?? '')
          }
        />
      )
    },
    {
      key: 'actions',
      title: <Translate> </Translate>,
      render: (rowData: any) => {
        const isPendingPayment = isPendingPaymentStatus(rowData);
        const tooltipEmr = <Tooltip>Open EMR</Tooltip>;
        const tooltipPrint = <Tooltip>Print wrist band</Tooltip>;
        const tooltipStart = !rowData?.priorityLevel ? (
          <Tooltip>Please set Priority first</Tooltip>
        ) : (
          <Tooltip>Start Triage</Tooltip>
        );
        const tooltipTriage = <Tooltip>View Triage</Tooltip>;
        const tooltipSendTo = <Tooltip>Send to</Tooltip>;
        const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;
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
                  disabled={isPendingPayment}
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

            <EncounterPriorityAction rowData={rowData} />

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
                    disabled={isPendingPayment}
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
                      isPendingPayment ||
                      !['NEW', 'WAITING_TRIAGE', 'TRIAGE_STARTED'].includes(
                        String(rowData?.status ?? rowData?.encounterStatus ?? '').toUpperCase()
                      ) ||
                      (String(rowData?.status ?? rowData?.encounterStatus ?? '').toUpperCase() !==
                        'TRIAGE_STARTED' &&
                        !rowData?.priorityLevel)
                    }
                  >
                    <FontAwesomeIcon icon={faCirclePlay} />
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
                <MyButton
                  size="small"
                  onClick={() => {
                    setLocalEncounter(rowData);
                    handlePrintWristband(rowData);
                  }}
                  disabled={isPendingPayment}
                >
                  <FontAwesomeIcon icon={faBarcode} />
                </MyButton>
              </div>
            </Whisper>

            <Whisper
              trigger="hover"
              placement="top"
              speaker={isPendingPayment ? tooltipBlockedByPayment : tooltipSendTo}
            >
              <div>
                <MyButton
                  size="small"
                  backgroundColor="violet"
                  onClick={async () => {
                    setLocalEncounter(rowData);

                    const toNumberOrNaN = (v: unknown) => {
                      if (typeof v === 'number') return v;
                      if (typeof v === 'string' && v.trim() !== '') return Number(v);
                      return Number.NaN;
                    };

                    const patientData = rowData?.patientObject;
                    const encounterId = toNumberOrNaN(
                      rowData?.id ?? rowData?.encounterId ?? rowData?.key
                    );
                    const patientId = toNumberOrNaN(
                      patientData?.id ??
                        patientData?.patientId ??
                        patientData?.key ??
                        rowData?.patientId ??
                        rowData?.patientKey ??
                        rowData?.patient_key
                    );

                    try {
                      const triageNew =
                        !Number.isNaN(encounterId) && !Number.isNaN(patientId)
                          ? await createOrGetEmergencyTriage({ encounterId, patientId }).unwrap()
                          : null;
                      setSendToEmergencyTriageNew(triageNew);
                    } catch (e) {
                      console.error('[ER Triage] createOrGetEmergencyTriage failed (Send to)', e);
                      setSendToEmergencyTriageNew(null);
                    }

                    setOpenSendToModal(true);
                  }}
                  disabled={
                    isPendingPayment ||
                    String(rowData?.status ?? rowData?.encounterStatus ?? '').toUpperCase() !==
                      'TRIAGE_STARTED'
                  }
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </MyButton>
              </div>
            </Whisper>

            {['WAITING_TRIAGE', 'NEW', 'SENT_TO_ER', 'WAITING_LIST', 'PENDING_PAYMENT'].includes(
              String(rowData?.status ?? rowData?.encounterStatus ?? '').toUpperCase()
            ) && (
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

  return (
    <>
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
        <SendToModal
          open={openSendToModal}
          setOpen={setOpenSendToModal}
          encounter={encounter}
          triage={sendToEmergencyTriageNew}
          refetch={refetchEncounter}
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

      <Modal
        size="80vw"
        open={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setPaymentRow(null);
        }}
      >
        <Modal.Header>
          <Modal.Title>Add Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '75vh', overflow: 'auto' }}>
          <PatientPaymentInfo
            ref={paymentInfoRef}
            localPatient={paymentRow?.patientObject ?? null}
            localEncounter={paymentRow ?? null}
            isReadOnly={false}
            showInternalButtons={false}
            payment={payment}
            setPayment={setPayment}
            patientInsurance={patientInsurance}
            setPatientInsurance={setPatientInsurance}
          />
        </Modal.Body>
        <Modal.Footer>
          <MyButton
            appearance="ghost"
            onClick={() => {
              setPaymentModalOpen(false);
              setPaymentRow(null);
            }}
          >
            Close
          </MyButton>
          <MyButton
            appearance="primary"
            onClick={async () => {
              const ok = await paymentInfoRef.current?.confirm?.();
              if (!ok) return;

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
                setPaymentModalOpen(false);
                setPaymentRow(null);
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
            }}
          >
            Save
          </MyButton>
        </Modal.Footer>
      </Modal>

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
    </>
  );
};

export default ERTriage;
