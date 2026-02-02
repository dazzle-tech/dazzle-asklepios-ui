import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { newApEncounter } from '@/types/model-types-constructor';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { faUserPlus, faBolt } from '@fortawesome/free-solid-svg-icons';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import { Badge, Form, Panel, Popover, Tooltip, Whisper } from 'rsuite';

import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import 'react-tabs/style/react-tabs.css';
import { formatDate, formatEnumString } from '@/utils';
import { faCommentMedical } from '@fortawesome/free-solid-svg-icons';
import { initialListRequest, ListRequest } from '@/types/types';
import {
  useGetEREncountersListQuery,
  useSaveEncounterChangesMutation,
  useCancelEncounterMutation
} from '@/services/encounterService';
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
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
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
import {
  useCreateOrGetEmergencyTriageMutation,
  useGetLatestEmergencyTriageByEncounterQuery
} from '@/services/encounters/er-triage/emergencyTriageService';

import jsPDF from 'jspdf';
import QRCode from 'qrcode';

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

const ERTriage = () => {
  const COMPLETE_TRIAGE_STATUS_KEY = '91109811181900';
  const SENT_TO_ER_STATUS_KEY = '6742317684600328';

  const toDateSafe = (value: any): Date | null => {
    if (!value && value !== 0) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'number') {
      // heuristics: seconds vs millis
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

    const createdAt =
      latest?.createdDate ??
      fallbackCreatedAt ??
      null;
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
    const triageStart = toDateSafe(
        latest?.createdDate ??
        fallbackTriageCreatedAt
    );
    if (!arrival || !triageStart) return <></>;
    return <>{formatDuration(triageStart.getTime() - arrival.getTime())}</>;
  };

  const TriageCompletedAtCell = ({
    encounterId,
    statusKey,
    fallbackUpdatedAt,
    completedAt,
    completedDate
  }: any) => {
    const isCompleted = statusKey === COMPLETE_TRIAGE_STATUS_KEY || statusKey === SENT_TO_ER_STATUS_KEY;
    if (!isCompleted) return <></>;

    const id = toNumberOrNaN(encounterId);
    const { data: latestEmergencyTriage } = useGetLatestEmergencyTriageByEncounterQuery(id as any, {
      skip: Number.isNaN(id)
    });

    const latest = unwrapApiObject<any>(latestEmergencyTriage);
    const v =
      latest?.completedDate ??
      fallbackUpdatedAt ??
      completedAt ??
      completedDate ??
      null;
    if (!v) return <></>;
    return <>{formatDateTime(v)}</>;
  };

  const TriageTimeCell = ({
    encounterId,
    statusKey,
    fallbackTriageCreatedAt,
    fallbackUpdatedAt,
    rowUpdatedAt,
    completedAt,
    completedDate
  }: any) => {
    const isCompleted = statusKey === COMPLETE_TRIAGE_STATUS_KEY || statusKey === SENT_TO_ER_STATUS_KEY;
    if (!isCompleted) return <></>;

    const id = toNumberOrNaN(encounterId);
    const { data: latestEmergencyTriage } = useGetLatestEmergencyTriageByEncounterQuery(id as any, {
      skip: Number.isNaN(id)
    });

    const latest = unwrapApiObject<any>(latestEmergencyTriage);
    const triageStart = toDateSafe(
        latest?.createdDate ??
        fallbackTriageCreatedAt
    );
    const end = toDateSafe(
      latest?.completedDate ??
        fallbackUpdatedAt ??
        rowUpdatedAt ??
        completedAt ??
        completedDate ??
        null
    );
    if (!triageStart || !end) return <></>;
    return <>{formatDuration(end.getTime() - triageStart.getTime())}</>;
  };

  const handlePrintWristband = async (encounterData: any) => {
    try {
      if (!encounterData || !encounterData.patientObject) return;

      const p = encounterData.patientObject;

      const fullName = p.fullName || '';
      const mrn = p.patientMrn || '';
      const dob = p.dob
        ? new Date(p.dob).toLocaleDateString()
        : '';
      let admDate = '';

      if (encounterData.createdAt) {
        const d = new Date(encounterData.createdAt);
        if (!isNaN(d.getTime())) {
          admDate = d.toLocaleDateString();
        }
      }

      if (!admDate && encounterData.plannedStartDate) {
        admDate = encounterData.plannedStartDate;
      }

      const qrText = `MRN:${mrn};NAME:${fullName};DOB:${dob};VISIT:${encounterData.visitId || ''}`;
      const qrDataUrl = await QRCode.toDataURL(qrText);

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [50, 120]
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(fullName.toUpperCase(), 10, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`MRN: ${mrn}`, 10, 25);
      doc.text(`ADM: ${admDate}`, 10, 33);
      doc.text(`DOB: ${dob}`, 10, 41);

      doc.setFont('helvetica', 'bold');

      doc.addImage(qrDataUrl, 'PNG', 80, 10, 30, 30);

      doc.save(`Wristband_${mrn}.pdf`);
    } catch (e) {
      console.error('Error while generating wristband pdf', e);
    }
  };
  const location = useLocation();
  const dispatch = useDispatch();
  const [cancelEncounter] = useCancelEncounterMutation();
  const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter, discharge: false });
  const [emergencyLevel, setEmergencyLevel] = useState({ key: '' });
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [openSendToModal, setOpenSendToModal] = useState(false);
  const [sendToEmergencyTriageNew, setSendToEmergencyTriageNew] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const defaultEncounterStatusKeys = ['6742295599423814', '8890456518264959'];
  const [encounterStatus, setEncounterStatus] = useState<{ keys: string[] }>({
    keys: defaultEncounterStatusKeys
  });
  const [startEncounter] = useSaveEncounterChangesMutation();
  const [createOrGetEmergencyTriage] = useCreateOrGetEmergencyTriageMutation();
  const navigate = useNavigate();
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true,
    filters: [
      {
        fieldName: 'resource_type_lkey',
        operator: 'match',
        value: 'EMERGENCY'
      }
    ]
  });

  // State to manage the date filters for the manual search
  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),
    toDate: new Date()
  });

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearchResetToken, setPatientSearchResetToken] = useState(0);
  const [patientSidebarOpen, setPatientSidebarOpen] = useState(false);
  const [windowHeight, setWindowHeight] = useState<number>(window.innerHeight);
  const [refetchPatientSidebar, setRefetchPatientSidebar] = useState(false);
  const [openCreatePatient, setOpenCreatePatient] = useState(false);
  const [openQuickPatient, setOpenQuickPatient] = useState(false);

  // Keep refs to avoid "Search" reading stale state right after a picker change.
  const dateFilterRef = useRef(dateFilter);
  const emergencyLevelRef = useRef(emergencyLevel);
  const encounterStatusRef = useRef(encounterStatus);
  const selectedPatientRef = useRef<any>(selectedPatient);

  const setDateFilterSafe = (next: any) => {
    dateFilterRef.current = next;
    setDateFilter(next);
  };
  const setEmergencyLevelSafe = (next: any) => {
    emergencyLevelRef.current = next;
    setEmergencyLevel(next);
  };
  const setEncounterStatusSafe = (next: any) => {
    encounterStatusRef.current = next;
    setEncounterStatus(next);
  };
  const setSelectedPatientSafe = (next: any) => {
    selectedPatientRef.current = next;
    setSelectedPatient(next);
  };

  // Create a JSX element to display as the page header content
  const divContent = 'ER Triage';

  // IMPORTANT: don't dispatch during render (can cause infinite render loop / white screen).
  useEffect(() => {
    dispatch(setPageCode('ER_Triage'));
    dispatch(setDivContent(divContent));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(' '));
    };
  }, [dispatch, divContent]);

  const refetch = useSelector((state: any) => state?.refetch?.refetchEncounter);

  const {
    data: encounterListResponse,
    isFetching,
    refetch: refetchEncounter,
    isLoading
  } = useGetEREncountersListQuery(listRequest);

  const { data: encounterStatusLov } = useGetLovValuesByCodeQuery('ENC_STATUS');
  const emergencyLevelEnumOptions = useEnumOptions('EmergencyLevel');

  const encounterStatusSelectData = useMemo(() => encounterStatusLov?.object ?? [], [encounterStatusLov]);
  const encounterPriorityEnumOptions = useEnumOptions('EncounterPriority');

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
      // Force urgent-like priorities to the top regardless of enum order
      if (v.includes('URGENT') || v.includes('CRITICAL') || v.includes('STAT') || v.includes('EMERG')) return 0;
      return null;
    };
    const m = new Map<string, number>();
    // Put urgent-like priorities first, then the rest in enum order.
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
    // Keep a simple, consistent palette (since enums don't come with colors).
    const palette = ['#16a34a', '#dc2626', '#f97316', '#eab308', '#7c3aed', '#0ea5e9'];
    const m = new Map<string, string>();
    encounterPriorityEnumOptions.forEach((v, idx) => {
      if (v?.value != null) m.set(String(v.value), palette[idx % palette.length]);
    });
    return m;
  }, [encounterPriorityEnumOptions]);

  const tableData = useMemo(() => {
    const data = (encounterListResponse?.object ?? []) as any[];
    const copied = [...data];
    copied.sort((a, b) => {
      const aKey = a?.encounterPriorityLkey ? String(a.encounterPriorityLkey) : '';
      const bKey = b?.encounterPriorityLkey ? String(b.encounterPriorityLkey) : '';
      const aOrder = aKey ? priorityOrderMap.get(aKey) ?? 999999 : 999999;
      const bOrder = bKey ? priorityOrderMap.get(bKey) ?? 999999 : 999999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      // fallback: oldest first within same priority (stable-ish)
      const aDate = a?.plannedStartDate ? new Date(a.plannedStartDate).getTime() : 0;
      const bDate = b?.plannedStartDate ? new Date(b.plannedStartDate).getTime() : 0;
      return aDate - bDate;
    });
    return copied;
  }, [encounterListResponse, priorityOrderMap]);

  const isSelected = (rowData: any) => {
    if (rowData && encounter && rowData.key === encounter.key) {
      return 'selected-row';
    } else return '';
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

  // Search is applied only when user clicks Search (see `handleSearchClick`).

  const handleCancelEncounter = async () => {
    try {
      if (encounter) {
        await cancelEncounter(encounter).unwrap();
        refetchEncounter();
        dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
        setOpen(false);
      }
    } catch (error) {
      console.error('Encounter completion error:', error);
      dispatch(notify({ msg: 'An error occurred while canceling the encounter', sev: 'error' }));
    }
  };

  const handleUpdateEncounterPriority = async (rowData: any, priorityKey: string): Promise<boolean> => {
    try {
      await startEncounter({
        ...rowData,
        encounterPriorityLkey: priorityKey
      }).unwrap();
      dispatch(notify({ msg: 'Priority updated', sev: 'success' }));
      refetchEncounter();
      return true;
    } catch (error) {
      console.error('Priority update error:', error);
      dispatch(notify({ msg: 'Failed to update priority', sev: 'error' }));
      return false;
    }
  };

  const EncounterPriorityAction = ({ rowData }: { rowData: any }) => {
    const whisperRef = useRef<any>(null);
    const [lockHoverUntilLeave, setLockHoverUntilLeave] = useState(false);

    const prioritySpeaker = (
      <Popover title="Priority" className="er-priority-popover">
        <div className="er-priority-menu">
          {(encounterPriorityEnumOptions ?? []).map((p: any) => (
            <button
              type="button"
              key={p?.value}
              className={
                String(rowData?.encounterPriorityLkey ?? '') === String(p?.value ?? '')
                  ? 'er-priority-item is-selected'
                  : 'er-priority-item'
              }
              onClick={async (e: any) => {
                e?.stopPropagation?.();
                const ok = await handleUpdateEncounterPriority(rowData, String(p?.value ?? ''));
                if (ok) {
                  // Prevent immediate re-open when trigger includes hover and mouse stays on the button.
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
              {String(rowData?.encounterPriorityLkey ?? '') === String(p?.value ?? '') ? (
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
            trigger={lockHoverUntilLeave ? 'click' : (['hover', 'click'] as any)}
            placement="leftStart"
            speaker={prioritySpeaker}
            enterable
            delayClose={300}
          >
            <div
              style={{ display: 'inline-flex', alignItems: 'center' }}
              onMouseLeave={() => setLockHoverUntilLeave(false)}
            >
              <MyButton size="small">
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
      await startEncounter({
        ...encounterData,
        encounterStatusLkey: '6742295599423814'
      }).unwrap();

      const toNumberOrNaN = (v: unknown) => {
        if (typeof v === 'number') return v;
        if (typeof v === 'string' && v.trim() !== '') return Number(v);
        return Number.NaN;
      };

      const encounterId = toNumberOrNaN(encounterData?.id ?? encounterData?.encounterId ?? encounterData?.key);
      const patientId = toNumberOrNaN(patientData?.id ?? patientData?.patientId ?? patientData?.key  );

      const emergencyTriageNew =
        !Number.isNaN(encounterId) && !Number.isNaN(patientId)
          ? await createOrGetEmergencyTriage({ encounterId, patientId }).unwrap()
          : null;

      const targetPath = '/ER-start-triage';

      // Save source in sessionStorage before navigating
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
      console.error('Start triage error:', error);
      dispatch(notify({ msg: 'Failed to start triage', sev: 'error' }));
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
    // Initial load: apply search once so the table is populated by default.
    handleSearchClick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const buildFilters = () => {
    const df = dateFilterRef.current;
    const el = emergencyLevelRef.current;
    const es = encounterStatusRef.current;
    const sp = selectedPatientRef.current;

    const filters: any[] = [
      {
        fieldName: 'resource_type_lkey',
        operator: 'match',
        value: 'EMERGENCY'
      }
    ];

    if (df?.fromDate && df?.toDate) {
      const formattedFromDate = formatDate(df.fromDate);
      const formattedToDate = formatDate(df.toDate);
      filters.push({
        fieldName: 'planned_start_date',
        operator: 'between',
        value: `${formattedFromDate}_${formattedToDate}`
      });
    } else if (df?.fromDate) {
      const formattedFromDate = formatDate(df.fromDate);
      filters.push({
        fieldName: 'planned_start_date',
        operator: 'gte',
        value: formattedFromDate
      });
    } else if (df?.toDate) {
      const formattedToDate = formatDate(df.toDate);
      filters.push({
        fieldName: 'planned_start_date',
        operator: 'lte',
        value: formattedToDate
      });
    }

    if (el?.key) {
      filters.push({
        fieldName: 'emergency_level_lkey',
        operator: 'match',
        value: el.key
      });
    }

    if (es?.keys?.length) {
      filters.push({
        fieldName: 'encounter_status_lkey',
        operator: 'in',
        value: es.keys.map(key => `(${key})`).join(' ')
      });
    }

    if (sp?.key) {
      filters.push({
        fieldName: 'patient_key',
        operator: 'match',
        value: sp.key
      });
    }

    return filters;
  };

  const handleSearchClick = () => {
    setManualSearchTriggered(true);
    setListRequest(prev => ({
      ...prev,
      pageNumber: 1,
      ignore: false,
      filters: buildFilters()
    }));
  };

  const handleClearClick = () => {
    const nextDateFilter = { fromDate: new Date(), toDate: new Date() };
    const nextEmergencyLevel = { key: '' };
    const nextEncounterStatus = { keys: defaultEncounterStatusKeys };

    setDateFilterSafe(nextDateFilter);
    setEmergencyLevelSafe(nextEmergencyLevel);
    setEncounterStatusSafe(nextEncounterStatus);
    setSelectedPatientSafe(null);
    setPatientSearchResetToken(v => v + 1);

    // After clearing, re-apply the default search criteria (do not leave the list ignored/empty)
    const filters: any[] = [
      {
        fieldName: 'resource_type_lkey',
        operator: 'match',
        value: 'EMERGENCY'
      }
    ];

    if (nextDateFilter.fromDate && nextDateFilter.toDate) {
      const formattedFromDate = formatDate(nextDateFilter.fromDate);
      const formattedToDate = formatDate(nextDateFilter.toDate);
      filters.push({
        fieldName: 'planned_start_date',
        operator: 'between',
        value: `${formattedFromDate}_${formattedToDate}`
      });
    }

    if (nextEncounterStatus.keys?.length) {
      filters.push({
        fieldName: 'encounter_status_lkey',
        operator: 'in',
        value: nextEncounterStatus.keys.map(key => `(${key})`).join(' ')
      });
    }

    setManualSearchTriggered(true);
    setListRequest(prev => ({
      ...prev,
      pageNumber: 1,
      ignore: false,
      filters
    }));
  };

  // table Columns
  const tableColumns = [
    // Expandable details (only visible when row is expanded)
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
        const fallbackCreatedAt = rowData?.emergencyTriage?.createdAt ?? null;
        return <TriageStartedAtCell encounterId={encounterId} fallbackCreatedAt={fallbackCreatedAt} />;
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
            fallbackTriageCreatedAt={rowData?.emergencyTriage?.createdAt ?? null}
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
        const statusKey = String(rowData?.encounterStatusLkey ?? '');
        return (
          <TriageCompletedAtCell
            encounterId={encounterId}
            statusKey={statusKey}
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
        const statusKey = String(rowData?.encounterStatusLkey ?? '');
        return (
          <TriageTimeCell
            encounterId={encounterId}
            statusKey={statusKey}
            arrivalCreatedAt={rowData?.createdAt}
            fallbackTriageCreatedAt={rowData?.emergencyTriage?.createdAt ?? null}
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
      render: (rowData: any) => rowData?.patientObject.patientMrn
    },
    {
      key: 'patientFullName',
      title: <Translate>PATIENT NAME </Translate>,
      fullText: true,
      render: (rowData: any) => {
        const tooltipSpeaker = (
          <Tooltip>
            <div>MRN : {rowData?.patientObject?.patientMrn}</div>
            <div>Age : {rowData?.patientAge}</div>
            <div>
              Gender :{' '}
              {rowData?.patientObject?.genderLvalue
                ? rowData?.patientObject?.genderLvalue?.lovDisplayVale
                : rowData?.patientObject?.genderLkey}
            </div>
            <div>Visit ID : {rowData?.visitId}</div>
          </Tooltip>
        );

        return (
          <Whisper trigger="hover" placement="top" speaker={tooltipSpeaker}>
            <div style={{ display: 'inline-block' }}>
              {rowData?.patientObject?.privatePatient ? (
                <Badge color="blue" content="Private">
                  <p style={{ marginTop: '5px', cursor: 'pointer' }}>
                    {rowData?.patientObject?.fullName}
                  </p>
                </Badge>
              ) : (
                <>
                  <p style={{ cursor: 'pointer' }}>{rowData?.patientObject?.fullName}</p>
                </>
              )}
            </div>
          </Whisper>
        );
      }
    },
    {
      key: 'emergencyLevelLkey',
      title: <Translate>ER Level</Translate>,
      render: (rowData: any) =>
        rowData?.emergencyLevelLkey ? (
          <MyBadgeStatus
            color={
              emergencyLevelColorMap.get(String(rowData?.emergencyLevelLkey)) ??
              '#98A2B4'
            }
            contant={
              emergencyLevelLabelMap.get(String(rowData?.emergencyLevelLkey)) ??
              String(rowData?.emergencyLevelLkey)
            }
          />
        ) : (
          ''
        )
    },
    {
      key: 'encounterPriorityLkey',
      title: <Translate>Priority</Translate>,
      render: (rowData: any) => {
        const key = rowData?.encounterPriorityLkey ? String(rowData.encounterPriorityLkey) : '';
        return (
          rowData?.encounterPriorityLvalue?.lovDisplayVale ??
          (key ? priorityLabelMap.get(key) ?? key : '')
        );
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
        const fallbackDestination = row?.emergencyTriage?.destination ?? row?.emergencyTriage?.destinationLkey ?? null;
        return <DestinationCell encounterId={encounterId} fallbackDestination={fallbackDestination} />;
      }
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      render: (rowData: any) => (
        <MyBadgeStatus
          color={rowData?.encounterStatusLvalue?.valueColor}
          contant={
            rowData.encounterStatusLvalue
              ? rowData.encounterStatusLvalue.lovDisplayVale
              : rowData.encounterStatusLkey
          }
        />
      )
    },
    {
      key: 'actions',
      title: <Translate> </Translate>,
      render: (rowData: any) => {
        const tooltipEmr = <Tooltip>Open EMR</Tooltip>;
        const tooltipPrint = <Tooltip>Print wrist band</Tooltip>;
        const tooltipStart = !rowData?.encounterPriorityLkey ? (
          <Tooltip>Please set Priority first</Tooltip>
        ) : (
          <Tooltip>Start Triage</Tooltip>
        );
        const tooltipTriage = <Tooltip>View Triage</Tooltip>;
        const tooltipSendTo = <Tooltip>Send to</Tooltip>;
        const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;
        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            <Whisper trigger="hover" placement="top" speaker={tooltipEmr}>
              <div
                onClick={(e: any) => {
                  e?.stopPropagation?.();
                }}
              >
                <MyButton
                  size="small"
                  radius="6px"
                  backgroundColor="violet"
                  onClick={() => {
                    const patientData = rowData?.patientObject;
                    if (patientData) {
                      dispatch(setPatient(patientData));
                    }
                    dispatch(setEncounter(rowData));
                    navigate('/patient-EMR', {
                      state: {
                        patient: patientData,
                        encounter: rowData,
                        fromPage: 'ER_Triage',
                        inModal: true
                      }
                    });
                  }}
                >
                  <FontAwesomeIcon icon={faFileLines} color="white" />
                </MyButton>
              </div>
            </Whisper>

            {/* Priority action should appear before Start */}
            <EncounterPriorityAction rowData={rowData}  />

            {rowData?.encounterStatusLkey === '91109811181900' ||
            rowData?.encounterStatusLkey === '6550164111662337' ||
            rowData?.encounterStatusLkey === '6742317684600328' ? (
              <Whisper trigger="hover" placement="top" speaker={tooltipTriage}>
                <div>
                  <MyButton
                    size="small"
                    onClick={() => {
                      const patientData = rowData?.patientObject;
                      setLocalEncounter(rowData);
                      handleGoToViewTriage(rowData, patientData);
                    }}
                  >
                    <FontAwesomeIcon icon={faCommentMedical} />
                  </MyButton>
                </div>
              </Whisper>
            ) : (
              <Whisper trigger="hover" placement="top" speaker={tooltipStart}>
                <div>
                  <MyButton
                    size="small"
                    backgroundColor="black"
                    onClick={() => {
                      setLocalEncounter(rowData);
                      handleGoToVisit(rowData, rowData?.patientObject);
                    }}
                    disabled={
                      !rowData?.encounterPriorityLkey ||
                      rowData?.encounterStatusLkey !== '8890456518264959' &&
                      rowData?.encounterStatusLkey !== '6742295599423814'
                    }
                  >
                    <FontAwesomeIcon icon={faCirclePlay} />
                  </MyButton>
                </div>
              </Whisper>
            )}

            <Whisper trigger="hover" placement="top" speaker={tooltipPrint}>
              <div>
                <MyButton
                  size="small"
                  onClick={() => {
                    setLocalEncounter(rowData);
                    handlePrintWristband(rowData);
                  }}
                >
                  <FontAwesomeIcon icon={faBarcode} />
                </MyButton>
              </div>
            </Whisper>

            <Whisper trigger="hover" placement="top" speaker={tooltipSendTo}>
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
                    const encounterId = toNumberOrNaN(rowData?.id ?? rowData?.encounterId ?? rowData?.key);
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
                  disabled={rowData?.encounterStatusLkey != '6742295599423814'}
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </MyButton>
              </div>
            </Whisper>

            {(rowData?.encounterStatusLvalue?.valueCode === 'WAITING_TRIAGE' ||
              rowData?.encounterStatusLvalue?.valueCode === 'NEW' ||
              rowData?.encounterStatusLvalue?.valueCode === 'SENT_TO_ER' ||
              rowData?.encounterStatusLvalue?.valueCode === 'WAITING_LIST') && (
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

  const pageIndex = listRequest.pageNumber - 1;

  // how many rows per page:
  const rowsPerPage = listRequest.pageSize;

  // total number of items in the backend:
  const totalCount = encounterListResponse?.extraNumeric ?? 0;

  // handler when the user clicks a new page number:
  const handlePageChange = (_: unknown, newPage: number) => {
    setManualSearchTriggered(true);
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };

  // handler when the user chooses a different rows-per-page:
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualSearchTriggered(true);
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // reset to first page
    });
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
            <MyInput
              width={200}
              fieldType="select"
              fieldLabel="Emergency Level"
              fieldName="key"
              selectData={emergencyLevelEnumOptions}
              selectDataLabel="label"
              selectDataValue="value"
              record={emergencyLevel}
              setRecord={setEmergencyLevelSafe}
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
              fieldName="keys"
              selectData={encounterStatusSelectData}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={encounterStatus}
              setRecord={setEncounterStatusSafe}
            />
          </div>
        </Form>
        <AdvancedSearchFilters
          searchFilter={true}
          showAdvanceButton={false}
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
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          setListRequest({ ...listRequest, sortBy, sortType });
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
    </>
  );
};

export default ERTriage;
