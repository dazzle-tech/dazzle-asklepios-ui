import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useLazyFilterDiagnosticOrdersQuery,
  useLazyGetDiagnosticOrderByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderService';
import { useLazyFilterDiagnosticOrderTestsQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import {
  useGetEmergencyTriageBulkByEncounterIdsQuery,
  useLazyGetEmergencyTriageBulkByEncounterIdsQuery
} from '@/services/encounters/er-triage/emergencyTriageService';
import {
  useFilterEncountersQuery,
  useLazyGetEncountersByIdsQuery
} from '@/services/encounters/patientEncounterService';
import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';
import { useLazyGetDepartmentByIdQuery } from '@/services/security/departmentService';
import { useGetPractitionersBulkMutation } from '@/services/setup/practitioner/PractitionerService';
import {
  useCountActiveBedsQuery,
  useCountBedsByStatusQuery,
  useGetActiveAssignmentsByBedIdsQuery,
  useGetBedsByDepartmentIdQuery
} from '@/services/setup/room/bedService';
import { useGetUsersByIdsQuery } from '@/services/userService';
import { formatDate, formatEnumString } from '@/utils';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useDispatch } from 'react-redux';
import { Form, Loader, Panel } from 'rsuite';
import {
  buildAgeSex,
  buildDiagMapFromOrders,
  buildDiagMapFromTests,
  buildPatientFullName,
  buildPatientInitials,
  CTAS_COLOR_VAR,
  CTAS_TARGET_MINUTES,
  ctasFromEmergencyLevel,
  diagnosticStatusClass,
  extractEncounterId,
  extractPatientId,
  formatBoardDuration,
  formatLosOrDash,
  formatPractitionerName,
  isDiagnosticPending,
  losTone,
  matchesBoardSearch,
  toDateSafe
} from './erBedBoardUtils';
import './styles.less';

const SERVER_POLL_MS = 30000;
const CLOCK_TICK_MS = 15000;
const DIAG_PAGE_SIZE = 200;
const MAX_DIAG_PAGES = 25;

const TRIAGE_STATUSES = [
  'WAITING_TRIAGE',
  'PENDING_PAYMENT',
  'TRIAGE_STARTED'
] as const;

const BEDS_PAGE_SIZE = 500;
const TRIAGE_PAGE_SIZE = 500;

/** Same status values used by Bed Management (`bedService` / BedManagmentFirstTab). */
const BED_STATUS = {
  READY: 'READY',
  OCCUPIED: 'OCCUPIED',
  IN_CLEANING: 'IN_CLEANING',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE'
} as const;

const normalizeBedStatus = (status: unknown): string =>
  String(status ?? '').toUpperCase();

type DiagBadge = {
  status: string | null;
  label: string;
  className: string;
};

const toDiagBadge = (
  status: string | null | undefined
): DiagBadge => {
  if (!status) {
    return {
      status: null,
      label: '—',
      className: ''
    };
  }

  return {
    status,
    label: formatEnumString(status),
    className: diagnosticStatusClass(status)
  };
};

type BoardIconProps = {
  name: string;
};

const BoardIcon = ({ name }: BoardIconProps) => {
  const paths: Record<string, React.ReactNode> = {
    bed: (
      <>
        <path d="M3 18v-9m18 9v-7M3 15h18M3 10h7V6H5a2 2 0 0 0-2 2m7 1h8a3 3 0 0 1 3 3" />
        <path d="M3 18v2m18-2v2" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    pulse: <path d="M3 12h4l3-8 4 16 3-8h4" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2m1-15a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2" />
      </>
    ),
    lab: (
      <>
        <path d="M9 3h6m-5 0v7l-5 8a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3M8 15h8" />
        <path d="M10 18h.01m4-1h.01" />
      </>
    ),
    scan: (
      <>
        <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 12h10" />
        <rect x="7" y="7" width="10" height="10" rx="2" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M6 6a8 8 0 0 1 13 3M5 15a8 8 0 0 0 13 3" />
      </>
    ),
    expand: (
      <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
    ),
    alert: (
      <>
        <path d="m10 4-8 14a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3L14 4a2 2 0 0 0-4 0Z" />
        <path d="M12 9v4m0 4h.01" />
      </>
    ),
    doctor: (
      <>
        <path d="M6 3v5a5 5 0 0 0 10 0V3M4 3h4m6 0h4m-7 10v3a5 5 0 0 0 10 0v-2" />
        <circle cx="21" cy="11" r="2" />
      </>
    ),
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    )
  };

  return (
    <svg
      className="ebb-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.pulse}
    </svg>
  );
};

const StatusBadge = ({ badge }: { badge: DiagBadge }) => (
  <span className={`ebb-st ${badge.className}`}>
    <i />
    {badge.label}
  </span>
);

const ERBedBoard = () => {
  const dispatch = useDispatch();
  const boardRef = useRef<HTMLDivElement>(null);

  const [fullscreenError, setFullscreenError] = useState(false);

  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice.selectedDepartment;

  const departmentId =
    selectedDepartment?.departmentId ?? selectedDepartment?.id;

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const [nowMs, setNowMs] = useState(() => Date.now());

  const [searchRecord, setSearchRecord] = useState<{
    boardSearch?: string;
  }>({
    boardSearch: ''
  });

  const [encountersById, setEncountersById] = useState<
    Map<string, any>
  >(new Map());

  const [practitionersById, setPractitionersById] = useState<
    Map<string, any>
  >(new Map());

  const [diagByEncounter, setDiagByEncounter] = useState<
    Map<string, { lab: string | null; rad: string | null }>
  >(new Map());

  const [diagError, setDiagError] = useState(false);
  const [diagStale, setDiagStale] = useState(false);
  const [diagRefreshTick, setDiagRefreshTick] = useState(0);
  const [encountersError, setEncountersError] = useState(false);
  const [triageBulkError, setTriageBulkError] = useState(false);
  const [queueTriageBulkError, setQueueTriageBulkError] = useState(false);
  const [assignmentInconsistencies, setAssignmentInconsistencies] =
    useState<string[]>([]);

  const [
    triggerGetDepartmentById,
    {
      data: departmentData,
      isFetching: isDepartmentFetching,
      isError: isDepartmentError
    }
  ] = useLazyGetDepartmentByIdQuery();

  const [getEncountersByIds] = useLazyGetEncountersByIdsQuery();

  const [
    getBulkPatientBasicInfo,
    {
      data: patientsBasicInfo,
      isLoading: patientsBulkLoading
    }
  ] = useGetBulkPatientBasicInfoMutation();

  const [getPractitionersBulk] = useGetPractitionersBulkMutation();

  const [fetchDiagnosticOrders] = useLazyFilterDiagnosticOrdersQuery();
  const [fetchDiagnosticOrderById] = useLazyGetDiagnosticOrderByIdQuery();
  const [fetchDiagnosticOrderTests] =
    useLazyFilterDiagnosticOrderTestsQuery();

  const [getTriageBulkForQueue] =
    useLazyGetEmergencyTriageBulkByEncounterIdsQuery();

  const [triageQueueBulk, setTriageQueueBulk] = useState<any[]>([]);

  useEffect(() => {
    dispatch(setPageCode('ER_BED_BOARD'));
    dispatch(setDivContent('ER Bed Board'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(' '));
    };
  }, [dispatch]);

  useEffect(() => {
    if (!departmentId) return;

    triggerGetDepartmentById(Number(departmentId)).catch(
      () => undefined
    );
  }, [departmentId, triggerGetDepartmentById]);

  useEffect(() => {
    const id = window.setInterval(
      () => setNowMs(Date.now()),
      CLOCK_TICK_MS
    );

    return () => window.clearInterval(id);
  }, []);

  // Diagnostics must refresh even when assignment/encounter ID sets are unchanged.
  useEffect(() => {
    const id = window.setInterval(
      () => setDiagRefreshTick(tick => tick + 1),
      SERVER_POLL_MS
    );

    return () => window.clearInterval(id);
  }, []);

  const isEmergencyDepartment = useMemo(
    () =>
      String(
        departmentData?.encounterType ?? ''
      ).toUpperCase() === 'EMERGENCY',
    [departmentData]
  );

  const todayStr = useMemo(() => formatDate(new Date()), []);

  // Match ER Triage list default window (last 7 days).
  const fromDateWide = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return formatDate(d);
  }, []);

  // Clear stale enrichment when department scope changes.
  useEffect(() => {
    setEncountersById(new Map());
    setPractitionersById(new Map());
    setDiagByEncounter(new Map());
    setTriageQueueBulk([]);
    setDiagError(false);
    setDiagStale(false);
    setEncountersError(false);
    setTriageBulkError(false);
    setQueueTriageBulkError(false);
    setAssignmentInconsistencies([]);
  }, [departmentId]);

  const skipBedQueries = !departmentId || !isEmergencyDepartment;

  const {
    data: bedsResponse,
    isLoading: bedsLoading,
    isFetching: bedsFetching,
    isError: bedsError,
    refetch: refetchBeds
  } = useGetBedsByDepartmentIdQuery(
    {
      departmentId: departmentId as any,
      page: 0,
      size: BEDS_PAGE_SIZE,
      sort: 'name,asc'
    },
    {
      skip: skipBedQueries,
      pollingInterval: SERVER_POLL_MS
    }
  );

  // Department-wide counts — same hooks/status enums as Bed Management.
  const {
    data: totalBedsCount = 0,
    isError: totalBedsCountError,
    refetch: refetchTotalBedsCount
  } = useCountActiveBedsQuery(
    { departmentId: departmentId as any },
    { skip: skipBedQueries, pollingInterval: SERVER_POLL_MS }
  );

  const {
    data: occupiedBedsCount = 0,
    isError: occupiedCountError,
    refetch: refetchOccupiedCount
  } = useCountBedsByStatusQuery(
    { departmentId: departmentId as any, status: BED_STATUS.OCCUPIED },
    { skip: skipBedQueries, pollingInterval: SERVER_POLL_MS }
  );

  const {
    data: readyBedsCount = 0,
    isError: readyCountError,
    refetch: refetchReadyCount
  } = useCountBedsByStatusQuery(
    { departmentId: departmentId as any, status: BED_STATUS.READY },
    { skip: skipBedQueries, pollingInterval: SERVER_POLL_MS }
  );

  const {
    data: cleaningBedsCount = 0,
    isError: cleaningCountError,
    refetch: refetchCleaningCount
  } = useCountBedsByStatusQuery(
    { departmentId: departmentId as any, status: BED_STATUS.IN_CLEANING },
    { skip: skipBedQueries, pollingInterval: SERVER_POLL_MS }
  );

  const {
    data: outOfServiceBedsCount = 0,
    isError: outOfServiceCountError,
    refetch: refetchOutOfServiceCount
  } = useCountBedsByStatusQuery(
    { departmentId: departmentId as any, status: BED_STATUS.OUT_OF_SERVICE },
    { skip: skipBedQueries, pollingInterval: SERVER_POLL_MS }
  );

  const beds = useMemo(() => {
    const list = (bedsResponse?.data ?? []) as any[];
    return list.filter(b => b?.isActive !== false);
  }, [bedsResponse]);

  // Assignments enrich patient details only — same as Bed Management.
  const occupiedBedIds = useMemo(
    () =>
      beds
        .filter(
          (bed: any) =>
            normalizeBedStatus(bed?.status) === BED_STATUS.OCCUPIED
        )
        .map((bed: any) => bed.id)
        .filter((id: any) => id != null),
    [beds]
  );

  const {
    data: activeAssignments,
    isLoading: assignmentsLoading,
    isFetching: assignmentsFetching,
    isError: assignmentsError,
    refetch: refetchAssignments
  } = useGetActiveAssignmentsByBedIdsQuery(
    { bedIds: occupiedBedIds },
    {
      skip: skipBedQueries || occupiedBedIds.length === 0,
      pollingInterval: SERVER_POLL_MS
    }
  );

  const assignmentByBedId = useMemo(() => {
    const map = new Map<string, any>();

    // Do not treat a failed/undefined response as "no patients".
    if (!Array.isArray(activeAssignments)) {
      return map;
    }

    activeAssignments.forEach((a: any) => {
      const bedId = a?.bedId ?? a?.bed?.id;

      if (bedId == null) return;

      map.set(String(bedId), a);
    });

    return map;
  }, [activeAssignments]);

  const occupiedEncounterIds = useMemo(() => {
    if (!Array.isArray(activeAssignments)) {
      return [] as number[];
    }

    return Array.from(
      new Set(
        activeAssignments
          .map((a: any) => extractEncounterId(a))
          .filter((id): id is number => id != null)
      )
    );
  }, [activeAssignments]);

  const occupiedEncounterIdsKey = occupiedEncounterIds.join(',');

  const occupiedPatientIdsFromAssignments = useMemo(() => {
    if (!Array.isArray(activeAssignments)) {
      return [] as number[];
    }

    return Array.from(
      new Set(
        activeAssignments
          .map((a: any) => extractPatientId(a))
          .filter((id): id is number => id != null)
      )
    );
  }, [activeAssignments]);

  const occupiedPatientIdsKey =
    occupiedPatientIdsFromAssignments.join(',');

  const {
    data: occupiedTriages,
    isFetching: occupiedTriageFetching,
    isError: occupiedTriageError,
    isSuccess: occupiedTriageSuccess
  } = useGetEmergencyTriageBulkByEncounterIdsQuery(
    occupiedEncounterIds as any,
    {
      skip:
        !isEmergencyDepartment ||
        occupiedEncounterIds.length === 0,
      pollingInterval: SERVER_POLL_MS
    }
  );

  useEffect(() => {
    setTriageBulkError(Boolean(occupiedTriageError));
  }, [occupiedTriageError]);

  const triageByEncounterId = useMemo(() => {
    const map = new Map<string, any>();

    if (!occupiedTriageSuccess || !Array.isArray(occupiedTriages)) {
      return map;
    }

    occupiedTriages.forEach((t: any) => {
      const eid = extractEncounterId(t);
      if (eid == null) return;
      map.set(String(eid), t);
    });

    return map;
  }, [occupiedTriages, occupiedTriageSuccess]);

  useEffect(() => {
    if (
      !isEmergencyDepartment ||
      occupiedEncounterIds.length === 0
    ) {
      return;
    }

    let cancelled = false;
    setEncountersError(false);

    getEncountersByIds({ ids: occupiedEncounterIds })
      .unwrap()
      .then((rows: any[]) => {
        if (cancelled) return;

        const map = new Map<string, any>();

        (rows ?? []).forEach((e: any) => {
          if (e?.id != null) {
            map.set(String(e.id), e);
          }
        });

        setEncountersById(map);
        setEncountersError(false);
      })
      .catch(() => {
        if (!cancelled) {
          // Keep prior successful encounter map; surface the failure.
          setEncountersError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    occupiedEncounterIds,
    occupiedEncounterIdsKey,
    getEncountersByIds,
    isEmergencyDepartment,
    bedsFetching,
    assignmentsFetching
  ]);

  const occupiedPatientIds = useMemo(() => {
    const ids: string[] = occupiedPatientIdsFromAssignments.map(String);

    encountersById.forEach(e => {
      const pid = extractPatientId(e);
      if (pid != null) {
        ids.push(String(pid));
      }
    });

    return Array.from(new Set(ids));
  }, [occupiedPatientIdsFromAssignments, encountersById]);

  const patientById = useMemo(() => {
    const map = new Map<string, any>();

    (patientsBasicInfo ?? []).forEach((p: any) => {
      if (p?.id != null) {
        map.set(String(p.id), p);
      }
    });

    return map;
  }, [patientsBasicInfo]);

  const practitionerIds = useMemo(() => {
    const ids: number[] = [];

    encountersById.forEach(e => {
      const id = e?.practitionerId;

      if (id != null && !Number.isNaN(Number(id))) {
        ids.push(Number(id));
      }
    });

    return Array.from(new Set(ids));
  }, [encountersById]);

  const assignedNurseIds = useMemo(() => {
    const ids: number[] = [];

    encountersById.forEach(e => {
      const id = e?.assignedNurseId;
      if (id != null && !Number.isNaN(Number(id))) {
        ids.push(Number(id));
      }
    });

    return Array.from(new Set(ids));
  }, [encountersById]);

  const { data: nursesByIdsResponse = [] } = useGetUsersByIdsQuery(
    assignedNurseIds,
    { skip: assignedNurseIds.length === 0 }
  );

  const nursesById = useMemo(() => {
    const map = new Map<string, string>();

    (nursesByIdsResponse ?? []).forEach((user: any) => {
      if (user?.id == null) return;
      const name =
        `${String(user.firstName ?? '').trim()} ${String(user.lastName ?? '').trim()}`.trim() ||
        user.login ||
        String(user.id);
      map.set(String(user.id), name);
    });

    return map;
  }, [nursesByIdsResponse]);

  useEffect(() => {
    if (practitionerIds.length === 0) {
      setPractitionersById(new Map());
      return;
    }

    let cancelled = false;

    getPractitionersBulk(practitionerIds)
      .unwrap()
      .then((rows: any[]) => {
        if (cancelled) return;

        const map = new Map<string, any>();

        (rows ?? []).forEach((p: any) => {
          if (p?.id != null) {
            map.set(String(p.id), p);
          }
        });

        setPractitionersById(map);
      })
      .catch(() => {
        if (!cancelled) {
          setPractitionersById(new Map());
        }
      });

    return () => {
      cancelled = true;
    };
  }, [practitionerIds, getPractitionersBulk]);

  const fetchAllPaged = useCallback(
    async (
      fetchPage: (page: number) => Promise<{ data?: any[]; totalCount?: number }>
    ) => {
      const all: any[] = [];
      let page = 0;
      let totalCount = Number.POSITIVE_INFINITY;

      while (page < MAX_DIAG_PAGES && all.length < totalCount) {
        const result = await fetchPage(page);
        const rows = result?.data ?? [];
        all.push(...rows);
        totalCount = Number(result?.totalCount ?? rows.length);
        if (rows.length < DIAG_PAGE_SIZE) break;
        page += 1;
      }

      return all;
    },
    []
  );

  useEffect(() => {
    // Clinical Laboratory displays DiagnosticOrderTest.processingStatus.
    // Board must aggregate those tests (not invent order-level labels), scoped
    // to the occupied encounter — never another encounter for the same patient.
    if (
      !isEmergencyDepartment ||
      occupiedEncounterIds.length === 0
    ) {
      return;
    }

    let cancelled = false;
    const encounterIdSet = new Set(
      occupiedEncounterIds.map(id => String(id))
    );
    const encounterIdIn = occupiedEncounterIds.join(',');
    const patientIdIn =
      occupiedPatientIdsFromAssignments.join(',');

    const loadDiagnostics = async () => {
      setDiagError(false);

      try {
        // Orders: prefer encounterIdIn (backend extension); also pull by
        // patientIdIn so mapping works before/without that deploy. Always
        // client-filter to the occupied encounter set.
        const [byEncounter, byPatient] = await Promise.all([
          fetchAllPaged(page =>
            fetchDiagnosticOrders({
              page,
              size: DIAG_PAGE_SIZE,
              encounterIdIn
            } as any).unwrap()
          ).catch(() => [] as any[]),
          patientIdIn
            ? fetchAllPaged(page =>
                fetchDiagnosticOrders({
                  page,
                  size: DIAG_PAGE_SIZE,
                  patientIdIn
                } as any).unwrap()
              )
            : Promise.resolve([] as any[])
        ]);

        if (cancelled) return;

        const ordersById = new Map<string, any>();
        [...byEncounter, ...byPatient].forEach((order: any) => {
          if (order?.id == null) return;
          const eid = extractEncounterId(order);
          if (eid == null || !encounterIdSet.has(String(eid))) return;
          ordersById.set(String(order.id), order);
        });

        const orders = Array.from(ordersById.values());
        const orderIdToEncounterId = new Map<string, string>();
        orders.forEach((order: any) => {
          const eid = extractEncounterId(order);
          if (eid == null) return;
          orderIdToEncounterId.set(String(order.id), String(eid));
        });

        let next = buildDiagMapFromOrders(orders, encounterIdSet);
        let usedTests = false;
        let testsFailed = false;
        let testsUnmapped = false;

        try {
          const tests = await fetchAllPaged(page =>
            fetchDiagnosticOrderTests({
              page,
              size: DIAG_PAGE_SIZE,
              encounterIdIn
            } as any).unwrap()
          );

          if (cancelled) return;

          if (tests.length > 0) {
            // Fill gaps in order→encounter map via GET order-by-id (no PII logged).
            const missingOrderIds = Array.from(
              new Set(
                tests
                  .map((t: any) => t?.orderId)
                  .filter((id: any) => id != null)
                  .map((id: any) => String(id))
                  .filter(
                    (id: string) =>
                      !orderIdToEncounterId.has(id) &&
                      extractEncounterId(
                        tests.find((t: any) => String(t?.orderId) === id)
                      ) == null
                  )
              )
            ).slice(0, 50);

            if (missingOrderIds.length > 0) {
              await Promise.all(
                missingOrderIds.map(async (oid: string) => {
                  try {
                    const order = await fetchDiagnosticOrderById(
                      Number(oid)
                    ).unwrap();
                    const eid = extractEncounterId(order);
                    if (
                      eid != null &&
                      encounterIdSet.has(String(eid))
                    ) {
                      orderIdToEncounterId.set(oid, String(eid));
                    }
                  } catch {
                    // leave unmapped
                  }
                })
              );
            }

            if (cancelled) return;

            const singleEncounterFallback =
              occupiedEncounterIds.length === 1
                ? String(occupiedEncounterIds[0])
                : null;

            const fromTests = buildDiagMapFromTests(
              tests,
              orderIdToEncounterId,
              singleEncounterFallback
            );

            // Never overwrite a useful order-level map with an empty test map
            // (that was producing Lab="—" when orderId→encounter mapping failed).
            if (fromTests.size > 0) {
              next = fromTests;
              usedTests = true;
            } else {
              testsUnmapped = true;
            }

            if (
              typeof window !== 'undefined' &&
              (window as any).__EBB_DIAG_DEBUG
            ) {
              const sample = tests.slice(0, 5).map((t: any) => ({
                orderId: t?.orderId,
                encounterId: t?.encounterId,
                orderType: t?.orderType,
                processingStatus: t?.processingStatus,
                status: t?.status
              }));
              // eslint-disable-next-line no-console
              console.info('[EBB_DIAG]', {
                occupiedEncounterIds,
                ordersMapped: orderIdToEncounterId.size,
                testsReturned: tests.length,
                fromTestsSize: fromTests.size,
                usedTests,
                testsUnmapped,
                sample
              });
            }
          }
        } catch {
          testsFailed = true;
        }

        if (cancelled) return;

        setDiagByEncounter(next);
        setDiagError(false);
        setDiagStale((testsFailed && !usedTests) || testsUnmapped);
      } catch {
        if (!cancelled) {
          setDiagError(true);
          // Preserve prior successful diag map; do not clear to empty.
        }
      }
    };

    loadDiagnostics();

    return () => {
      cancelled = true;
    };
  }, [
    occupiedEncounterIds,
    occupiedEncounterIdsKey,
    occupiedPatientIdsFromAssignments,
    occupiedPatientIdsKey,
    fetchAllPaged,
    fetchDiagnosticOrders,
    fetchDiagnosticOrderById,
    fetchDiagnosticOrderTests,
    isEmergencyDepartment,
    diagRefreshTick
  ]);

  useEffect(() => {
    if (!Array.isArray(activeAssignments) || encountersById.size === 0) {
      setAssignmentInconsistencies([]);
      return;
    }

    const notes: string[] = [];

    activeAssignments.forEach((assignment: any) => {
      const eid = extractEncounterId(assignment);
      if (eid == null) {
        notes.push(
          `Bed ${assignment?.bedId ?? '?'} has an active assignment without encounterId.`
        );
        return;
      }

      const encounter = encountersById.get(String(eid));
      if (!encounter) return;

      const discharged = toDateSafe(encounter?.dischargeAt);
      const status = String(
        encounter?.encounterStatus ?? encounter?.status ?? ''
      ).toUpperCase();

      if (discharged || status === 'DISCHARGED' || status === 'COMPLETED') {
        notes.push(
          `Encounter ${encounter?.encounterNumber ?? eid} is discharged/completed but still has an active bed assignment (bed ${assignment?.bedId ?? '?'}).`
        );
      }
    });

    setAssignmentInconsistencies(notes);
  }, [activeAssignments, encountersById]);

  const triageFilterParams = useMemo(() => {
    if (!departmentId || !isEmergencyDepartment) {
      return null;
    }

    return {
      departmentId,
      fromDate: fromDateWide,
      toDate: todayStr,
      statuses: TRIAGE_STATUSES.join(','),
      page: 0,
      size: TRIAGE_PAGE_SIZE,
      sort: 'id,asc'
    };
  }, [
    departmentId,
    isEmergencyDepartment,
    fromDateWide,
    todayStr
  ]);

  const {
    data: triageEncountersPaged,
    isLoading: triageLoading,
    isFetching: triageFetching,
    isError: triageError,
    refetch: refetchTriage
  } = useFilterEncountersQuery(triageFilterParams as any, {
    skip: !triageFilterParams,
    pollingInterval: SERVER_POLL_MS
  });

  const triageEncounterRows = useMemo(
    () => (triageEncountersPaged?.data ?? []) as any[],
    [triageEncountersPaged]
  );

  const triageEncounterIds = useMemo(() => {
    return Array.from(
      new Set(
        triageEncounterRows
          .map(r => r?.id)
          .filter((id: any) => id != null)
          .map((id: any) => Number(id))
          .filter((n: number) => !Number.isNaN(n))
      )
    );
  }, [triageEncounterRows]);

  const triageEncounterIdsKey = triageEncounterIds.join(',');

  useEffect(() => {
    if (
      !isEmergencyDepartment ||
      triageEncounterIds.length === 0
    ) {
      if (!triageError) {
        setTriageQueueBulk([]);
        setQueueTriageBulkError(false);
      }
      return;
    }

    let cancelled = false;
    setQueueTriageBulkError(false);

    getTriageBulkForQueue(triageEncounterIds as any)
      .unwrap()
      .then(rows => {
        if (!cancelled) {
          setTriageQueueBulk(rows ?? []);
          setQueueTriageBulkError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQueueTriageBulkError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    triageEncounterIds,
    triageEncounterIdsKey,
    getTriageBulkForQueue,
    isEmergencyDepartment,
    triageFetching,
    triageError
  ]);

  const triageMapForQueue = useMemo(() => {
    const map = new Map<string, any>();

    (triageQueueBulk ?? []).forEach((t: any) => {
      const eid = extractEncounterId(t);
      if (eid != null) {
        map.set(String(eid), t);
      }
    });

    return map;
  }, [triageQueueBulk]);

  const triagePatientIds = useMemo(() => {
    return Array.from(
      new Set(
        triageEncounterRows
          .map(r => r?.patient?.id ?? r?.patientId)
          .filter((id: any) => id != null)
          .map((id: any) => String(id))
      )
    );
  }, [triageEncounterRows]);

  const allPatientIdsForBulk = useMemo(() => {
    const ids = [...occupiedPatientIds, ...triagePatientIds]
      .map(id => Number(id))
      .filter(n => Number.isFinite(n) && !Number.isNaN(n));

    return Array.from(new Set(ids));
  }, [occupiedPatientIds, triagePatientIds]);

  const allPatientIdsForBulkKey = allPatientIdsForBulk.join(',');

  useEffect(() => {
    if (allPatientIdsForBulk.length === 0) return;

    getBulkPatientBasicInfo(allPatientIdsForBulk)
      .unwrap()
      .catch(() => undefined);
  }, [
    allPatientIdsForBulk,
    allPatientIdsForBulkKey,
    getBulkPatientBasicInfo
  ]);

  const searchQuery = String(
    searchRecord?.boardSearch ?? ''
  );

  const resolvePatient = useCallback(
    (assignment: any, encounter: any) => {
      const pid =
        assignment?.patient?.id ??
        assignment?.patientId ??
        encounter?.patient?.id ??
        encounter?.patientId;

      const fromBulk =
        pid != null
          ? patientById.get(String(pid))
          : null;

      return (
        fromBulk ||
        assignment?.patient ||
        encounter?.patient ||
        null
      );
    },
    [patientById]
  );

  const bedCards = useMemo(() => {
    return beds.map((bed: any) => {
      const bedStatus = normalizeBedStatus(bed?.status);
      const isOccupied = bedStatus === BED_STATUS.OCCUPIED;
      const isReady = bedStatus === BED_STATUS.READY;
      const isCleaning = bedStatus === BED_STATUS.IN_CLEANING;
      const isOutOfService =
        bedStatus === BED_STATUS.OUT_OF_SERVICE;

      const assignment = isOccupied
        ? assignmentByBedId.get(String(bed.id))
        : undefined;

      const encounterId = extractEncounterId(assignment);

      const encounter =
        encounterId != null
          ? encountersById.get(String(encounterId)) ?? null
          : null;

      const triage =
        encounterId != null
          ? triageByEncounterId.get(String(encounterId))
          : null;

      const patient = resolvePatient(assignment, encounter);

      const ctas = ctasFromEmergencyLevel(
        triage?.emergencyLevel
      );

      // LOS uses encounter creation only — never assignment time.
      const created = toDateSafe(
        encounter?.createdDate ??
          encounter?.createdAt ??
          encounter?.created_at
      );

      const discharged = toDateSafe(encounter?.dischargeAt);
      const endMs = discharged ? discharged.getTime() : nowMs;
      const startMs = created ? created.getTime() : null;
      const elapsedMs =
        startMs != null ? Math.max(0, endMs - startMs) : null;

      const diag =
        encounterId != null
          ? diagByEncounter.get(String(encounterId))
          : null;

      const mrn = patient?.medicalRecordNumber ?? '—';

      const initials = patient
        ? buildPatientInitials(patient)
        : assignment?.patientName
          ? buildPatientInitials({
              fullName: assignment.patientName
            })
          : '—';

      const ageSex = buildAgeSex(patient);
      const fullName =
        buildPatientFullName(patient) ||
        assignment?.patientName ||
        '';

      const encounterNumber =
        encounter?.encounterNumber ?? '';

      const bedLabel = bed?.name ?? '';

      const zone =
        bed?.room?.name ||
        bed?.locationDetails ||
        formatEnumString(bed?.type) ||
        '—';

      const doctor =
        encounter?.practitionerName ||
        formatPractitionerName(
          encounter?.practitionerId != null
            ? practitionersById.get(
                String(encounter.practitionerId)
              )
            : null
        );

      const nurseFromEncounter =
        encounter?.assignedNurseName ||
        (encounter?.assignedNurseId != null
          ? nursesById.get(String(encounter.assignedNurseId))
          : null);

      const nurse = nurseFromEncounter || '—';

      const destination = triage?.destination
        ? formatEnumString(String(triage.destination))
        : '—';

      const chiefComplaint =
        encounter?.chiefComplaint ?? '—';

      const assignmentsLoaded =
        Array.isArray(activeAssignments) && !assignmentsError;

      return {
        bed,
        bedLabel,
        zone,
        bedStatus,
        isOccupied,
        isReady,
        isCleaning,
        isOutOfService,
        occupied: isOccupied,
        assignment,
        assignmentMissing:
          isOccupied && assignmentsLoaded && !assignment,
        encounter,
        encounterId,
        encounterNumber,
        patient,
        mrn,
        initials,
        ageSex,
        fullName,
        chiefComplaint,
        ctas,
        elapsedMs,
        doctor: doctor || '—',
        nurse,
        lab: toDiagBadge(diag?.lab),
        rad: toDiagBadge(diag?.rad),
        disposition: destination,
        searchHaystack: [
          bedLabel,
          mrn,
          fullName,
          initials,
          encounterNumber,
          formatEnumString(bedStatus)
        ]
      };
    });
  }, [
    beds,
    assignmentByBedId,
    encountersById,
    triageByEncounterId,
    resolvePatient,
    nowMs,
    diagByEncounter,
    practitionersById,
    nursesById,
    activeAssignments,
    assignmentsError
  ]);

  const filteredBedCards = useMemo(
    () =>
      bedCards.filter(card =>
        matchesBoardSearch(
          searchQuery,
          card.searchHaystack
        )
      ),
    [bedCards, searchQuery]
  );

  const triageQueueItems = useMemo(() => {
    const items = triageEncounterRows.map((row: any) => {
      const triage = triageMapForQueue.get(
        String(row.id)
      );

      const patientId =
        row?.patient?.id ?? row?.patientId;

      const patient =
        (patientId != null
          ? patientById.get(String(patientId))
          : null) ||
        row?.patient ||
        null;

      const ctas = ctasFromEmergencyLevel(
        triage?.emergencyLevel
      );

      const arrival = toDateSafe(
        row?.createdDate ??
          row?.createdAt ??
          row?.created_at
      );

      const mrn =
        patient?.medicalRecordNumber ?? '—';

      const initials = buildPatientInitials(patient);

      const ageSex = buildAgeSex(
        patient,
        row?.patientAge
      );

      const fullName = buildPatientFullName(patient);

      const chiefComplaint =
        row?.chiefComplaint ?? '';

      const encounterNumber =
        row?.encounterNumber ?? '';

      return {
        id: row.id,
        mrn,
        initials,
        ageSex,
        fullName,
        chiefComplaint,
        ctas,
        arrivalMs: arrival ? arrival.getTime() : null,
        encounterNumber,
        searchHaystack: [
          mrn,
          fullName,
          initials,
          encounterNumber
        ]
      };
    });

    return items.sort((a, b) => {
      const ca = a.ctas ?? 99;
      const cb = b.ctas ?? 99;

      if (ca !== cb) {
        return ca - cb;
      }

      const aArr = a.arrivalMs ?? Number.POSITIVE_INFINITY;
      const bArr = b.arrivalMs ?? Number.POSITIVE_INFINITY;
      return aArr - bArr;
    });
  }, [
    triageEncounterRows,
    triageMapForQueue,
    patientById
  ]);

  const filteredTriageQueue = useMemo(
    () =>
      triageQueueItems.filter(item =>
        matchesBoardSearch(
          searchQuery,
          item.searchHaystack
        )
      ),
    [triageQueueItems, searchQuery]
  );

  // Summary KPIs use Bed Management count APIs (department-wide, not search-filtered).
  const totalBedsForSummary = Number(totalBedsCount) || 0;
  const occupiedForSummary = Number(occupiedBedsCount) || 0;
  const availableForSummary = Number(readyBedsCount) || 0;
  const cleaningForSummary = Number(cleaningBedsCount) || 0;
  const outOfServiceForSummary = Number(outOfServiceBedsCount) || 0;

  const occupancyPct = totalBedsForSummary
    ? Math.round((occupiedForSummary / totalBedsForSummary) * 100)
    : 0;

  const occupiedCards = useMemo(
    () => bedCards.filter(c => c.isOccupied),
    [bedCards]
  );

  const waitingOverTarget = useMemo(() => {
    return triageQueueItems.filter(item => {
      if (item.ctas == null || item.arrivalMs == null) {
        return false;
      }

      const target = CTAS_TARGET_MINUTES[item.ctas];
      if (target == null) return false;

      const waitedMin = (nowMs - item.arrivalMs) / 60000;
      return waitedMin > target;
    }).length;
  }, [triageQueueItems, nowMs]);

  const knownLosCards = useMemo(
    () =>
      occupiedCards.filter(
        c => c.elapsedMs != null && Number.isFinite(c.elapsedMs)
      ),
    [occupiedCards]
  );

  const avgLosMs = useMemo(() => {
    if (!knownLosCards.length) return null;

    return (
      knownLosCards.reduce(
        (sum, c) => sum + (c.elapsedMs as number),
        0
      ) / knownLosCards.length
    );
  }, [knownLosCards]);

  const over4hCount = useMemo(
    () =>
      knownLosCards.filter(
        c => (c.elapsedMs as number) >= 240 * 60000
      ).length,
    [knownLosCards]
  );

  const labPending = useMemo(
    () =>
      occupiedCards.filter(c =>
        isDiagnosticPending(c.lab.status)
      ).length,
    [occupiedCards]
  );

  const radPending = useMemo(
    () =>
      occupiedCards.filter(c =>
        isDiagnosticPending(c.rad.status)
      ).length,
    [occupiedCards]
  );

  const clockTime = useMemo(
    () =>
      new Date(nowMs).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      }),
    [nowMs]
  );

  const clockDate = useMemo(
    () =>
      new Date(nowMs).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
    [nowMs]
  );

  const departmentName =
    departmentData?.name ||
    selectedDepartment?.departmentName ||
    selectedDepartment?.name ||
    'Emergency Department';

  const isLoading =
    isDepartmentFetching ||
    bedsLoading ||
    assignmentsLoading ||
    triageLoading ||
    patientsBulkLoading ||
    occupiedTriageFetching;

  const bedCountsError =
    totalBedsCountError ||
    occupiedCountError ||
    readyCountError ||
    cleaningCountError ||
    outOfServiceCountError;

  const hasError =
    isDepartmentError ||
    bedsError ||
    bedCountsError ||
    assignmentsError ||
    triageError ||
    occupiedTriageError ||
    triageBulkError ||
    queueTriageBulkError ||
    encountersError;

  const handleFullscreen = async () => {
    setFullscreenError(false);

    try {
      if (
        document.fullscreenElement === boardRef.current
      ) {
        await document.exitFullscreen();
      } else if (boardRef.current) {
        await boardRef.current.requestFullscreen();
      }
    } catch {
      setFullscreenError(true);
    }
  };

  const handleRefresh = () => {
    if (departmentId && isEmergencyDepartment) {
      refetchBeds();
      refetchTriage();
      refetchTotalBedsCount();
      refetchOccupiedCount();
      refetchReadyCount();
      refetchCleaningCount();
      refetchOutOfServiceCount();

      if (occupiedBedIds.length) {
        refetchAssignments();
      }

      // Force diagnostics / enrichment reload even when ID sets are unchanged.
      setDiagRefreshTick(tick => tick + 1);
    }
  };

  if (!departmentId) {
    return (
      <Panel>
        <div className="encounter-list__no-department">
          <p>
            <Translate>
              Please select a department to view the bed board.
            </Translate>
          </p>
        </div>
      </Panel>
    );
  }

  if (
    !isDepartmentFetching &&
    departmentData &&
    !isEmergencyDepartment
  ) {
    return (
      <Panel>
        <div className="encounter-list__no-department">
          <p>
            <Translate>
              User Current Department should be Emergency to view ER Bed Board.
            </Translate>
          </p>
        </div>
      </Panel>
    );
  }

  const refreshing =
    bedsFetching ||
    assignmentsFetching ||
    triageFetching;

  const metrics = [
    {
      label: 'Beds occupied',
      value: `${occupiedForSummary}`,
      suffix: `/ ${totalBedsForSummary}`,
      detail: `${occupancyPct}% department occupancy`,
      icon: 'bed',
      tone: 'blue'
    },
    {
      label: 'Beds available',
      value: `${availableForSummary}`,
      detail:
        availableForSummary > 0
          ? `Ready · ${cleaningForSummary} cleaning · ${outOfServiceForSummary} out of service`
          : cleaningForSummary > 0 || outOfServiceForSummary > 0
            ? `${cleaningForSummary} cleaning · ${outOfServiceForSummary} out of service`
            : 'No ready beds',
      icon: 'check',
      tone: 'green'
    },
    {
      label: 'Waiting triage',
      value: `${triageQueueItems.length}`,
      detail: `${waitingOverTarget} over CTAS target`,
      icon: 'users',
      tone: waitingOverTarget ? 'red' : 'purple'
    },
    {
      label: 'Average LOS',
      value: formatLosOrDash(avgLosMs),
      detail: `${over4hCount} patients over 4 hours`,
      icon: 'clock',
      tone:
        avgLosMs != null && avgLosMs >= 240 * 60000
          ? 'amber'
          : 'blue'
    },
    {
      label: 'Lab pending',
      value: diagError ? '—' : `${labPending}`,
      detail: 'Patients with pending labs',
      icon: 'lab',
      tone: 'purple'
    },
    {
      label: 'Radiology pending',
      value: diagError ? '—' : `${radPending}`,
      detail: 'Patients with pending imaging',
      icon: 'scan',
      tone: 'teal'
    }
  ];

  return (
    <div
      className="er-bed-board"
      dir={dir}
      ref={boardRef}
    >
      <div className="ebb-board">
        <header className="ebb-header">
          <div className="ebb-heading">
            <div className="ebb-brand-icon">
              <BoardIcon name="pulse" />
            </div>

            <div>
              <div className="ebb-eyebrow">
                EMERGENCY OPERATIONS
                <span> / </span>
                BED BOARD
              </div>

              <h1>{departmentName}</h1>

              <p>
                <Translate>
                  A clear view of every bed. A better view of patient flow.
                </Translate>
              </p>
            </div>
          </div>

          <div className="ebb-header-side">
            <div className="ebb-clock">
              <strong>{clockTime}</strong>
              <span>{clockDate}</span>
            </div>

            <button
              className="ebb-btn ebb-fullscreen"
              type="button"
              onClick={handleFullscreen}
            >
              <BoardIcon name="expand" />
              <Translate>Full screen</Translate>
            </button>
          </div>
        </header>

        <section
          className="ebb-kpis"
          aria-label="Department summary"
        >
          {metrics.map(metric => (
            <div
              className={`ebb-kpi ${metric.tone}`}
              key={metric.label}
            >
              <div className="ebb-kpi-top">
                <span>
                  <Translate>{metric.label}</Translate>
                </span>

                <div className="ebb-metric-icon">
                  <BoardIcon name={metric.icon} />
                </div>
              </div>

              <div className="ebb-metric-value ebb-num">
                {metric.value}
                <small>{metric.suffix}</small>
              </div>

              <div className="ebb-metric-detail">
                {metric.detail}
              </div>

              {metric.icon === 'bed' && (
                <div className="ebb-occupancy-track">
                  <span
                    style={{
                      width: `${occupancyPct}%`
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </section>

        <div className="ebb-toolbar">
          <div className="ebb-search-wrap">
            <BoardIcon name="search" />

            <Form
              className="ebb-search"
              fluid
              onSubmit={() => undefined}
            >
              <MyInput
                fieldName="boardSearch"
                fieldLabel="Search board"
                placeholder="Search name, MRN, encounter or bed..."
                record={searchRecord}
                setRecord={setSearchRecord}
                height={40}
                width="100%"
              />
            </Form>
          </div>

          <div className="ebb-toolbar-right">
            <span className="ebb-auto">
              <span
                className={
                  refreshing ? 'syncing' : ''
                }
              />

              {refreshing
                ? 'Updating board'
                : 'Auto-refresh · 30s'}
            </span>

            <button
              type="button"
              className="ebb-btn"
              onClick={handleRefresh}
              disabled={
                !isEmergencyDepartment || refreshing
              }
            >
              <BoardIcon name="refresh" />
              <Translate>Refresh</Translate>
            </button>
          </div>
        </div>

        {(hasError || diagError || diagStale || assignmentInconsistencies.length > 0) && (
          <div
            className="ebb-state error"
            role="alert"
          >
            <BoardIcon name="alert" />

            {(hasError || diagError) && (
              <Translate>
                Some board data could not be loaded. Refresh to try again.
              </Translate>
            )}

            {assignmentsError && (
              <span>
                Active bed assignments failed to load. Occupied beds still
                use bed status; patient details may be incomplete.
              </span>
            )}

            {encountersError && (
              <span>
                Encounter details failed to load for some occupied beds.
              </span>
            )}

            {(triageError || queueTriageBulkError) && (
              <span>
                Triage queue data failed to load.
              </span>
            )}

            {bedCountsError && (
              <span>
                Bed status counts failed to load.
              </span>
            )}

            {diagError && (
              <span>
                Diagnostic status failed to load. Prior values were kept when available.
              </span>
            )}

            {diagStale && !diagError && (
              <span>
                Lab/Radiology test details could not be refreshed; order-level
                statuses are shown instead and may be incomplete.
              </span>
            )}

            {assignmentInconsistencies.map(note => (
              <span key={note}>{note}</span>
            ))}
          </div>
        )}

        {fullscreenError && (
          <div
            className="ebb-state error"
            role="alert"
          >
            Full screen is unavailable in this browser or embedded view.
          </div>
        )}

        {isLoading &&
        !beds.length &&
        !triageEncounterRows.length ? (
          <div className="ebb-state">
            <Loader
              content={
                <Translate>
                  Loading bed board…
                </Translate>
              }
            />
          </div>
        ) : (
          <main className="ebb-main">
            <section
              className="ebb-panel ebb-map-panel"
              aria-labelledby="ebb-beds-title"
            >
              <div className="ebb-panel-heading">
                <div className="ebb-section-title">
                  <div className="ebb-section-icon">
                    <BoardIcon name="bed" />
                  </div>

                  <div>
                    <h2 id="ebb-beds-title">
                      <Translate>
                        Department beds
                      </Translate>

                      <span className="ebb-count">
                        {bedCards.length}
                      </span>
                    </h2>

                    <p>
                      {searchQuery.trim()
                        ? `${filteredBedCards.length} of ${bedCards.length} beds match your search`
                        : 'Real-time bed availability and patient overview'}
                    </p>
                  </div>
                </div>

                <div className="ebb-bed-key">
                  <span>
                    <i className="occupied" />
                    Occupied {occupiedForSummary}
                  </span>

                  <span>
                    <i className="available" />
                    Ready {availableForSummary}
                  </span>

                  <span>
                    <i className="cleaning" />
                    Cleaning {cleaningForSummary}
                  </span>

                  <span>
                    <i className="oos" />
                    Out of service {outOfServiceForSummary}
                  </span>
                </div>
              </div>

              <div className="ebb-bedgrid">
                {!filteredBedCards.length ? (
                  <div className="ebb-empty">
                    <BoardIcon name="bed" />

                    <strong>
                      {bedCards.length
                        ? 'No matching beds'
                        : 'No beds configured'}
                    </strong>

                    <span>
                      {bedCards.length
                        ? 'Try another name, MRN or bed label.'
                        : 'Beds will appear here when configured for this department.'}
                    </span>
                  </div>
                ) : (
                  filteredBedCards.map(card => {
                    if (card.isReady) {
                      return (
                        <article
                          className="ebb-tile free"
                          key={card.bed.id}
                          aria-label={`Bed ${card.bedLabel}, ready`}
                        >
                          <div className="ebb-card-top">
                            <div>
                              <span className="ebb-label">
                                BED
                              </span>

                              <h3>{card.bedLabel}</h3>

                              <span
                                className="ebb-zone"
                                title={card.zone}
                              >
                                {card.zone}
                              </span>
                            </div>

                            <span className="ebb-availability">
                              <i />
                              Ready
                            </span>
                          </div>

                          <div className="ebb-free-center">
                            <div className="ebb-free-icon">
                              <BoardIcon name="bed" />
                            </div>

                            <strong>
                              Ready for a patient
                            </strong>

                            <span>
                              This bed is currently available
                            </span>
                          </div>

                          <div className="ebb-free-footer">
                            <BoardIcon name="check" />

                            <Translate>
                              Ready
                            </Translate>
                          </div>
                        </article>
                      );
                    }

                    if (card.isCleaning || card.isOutOfService) {
                      const statusLabel = card.isCleaning
                        ? 'In cleaning'
                        : 'Out of service';

                      return (
                        <article
                          className={`ebb-tile status-tile ${
                            card.isCleaning
                              ? 'cleaning'
                              : 'out-of-service'
                          }`}
                          key={card.bed.id}
                          aria-label={`Bed ${card.bedLabel}, ${statusLabel}`}
                        >
                          <div className="ebb-card-top">
                            <div>
                              <span className="ebb-label">
                                BED
                              </span>

                              <h3>{card.bedLabel}</h3>

                              <span
                                className="ebb-zone"
                                title={card.zone}
                              >
                                {card.zone}
                              </span>
                            </div>

                            <span
                              className={`ebb-status-pill ${
                                card.isCleaning
                                  ? 'cleaning'
                                  : 'oos'
                              }`}
                            >
                              <i />
                              {statusLabel}
                            </span>
                          </div>

                          <div className="ebb-free-center">
                            <div
                              className={`ebb-free-icon ${
                                card.isCleaning
                                  ? 'cleaning'
                                  : 'oos'
                              }`}
                            >
                              <BoardIcon
                                name={
                                  card.isCleaning
                                    ? 'refresh'
                                    : 'alert'
                                }
                              />
                            </div>

                            <strong>{statusLabel}</strong>

                            <span>
                              {card.isCleaning
                                ? 'Not ready for a patient'
                                : 'Unavailable for assignment'}
                            </span>
                          </div>

                          <div className="ebb-free-footer">
                            <BoardIcon name="shield" />
                            {formatEnumString(card.bedStatus)}
                          </div>
                        </article>
                      );
                    }

                    if (!card.isOccupied) {
                      return (
                        <article
                          className="ebb-tile status-tile unknown"
                          key={card.bed.id}
                          aria-label={`Bed ${card.bedLabel}, ${card.bedStatus || 'unknown status'}`}
                        >
                          <div className="ebb-card-top">
                            <div>
                              <span className="ebb-label">
                                BED
                              </span>
                              <h3>{card.bedLabel}</h3>
                              <span
                                className="ebb-zone"
                                title={card.zone}
                              >
                                {card.zone}
                              </span>
                            </div>
                            <span className="ebb-status-pill">
                              <i />
                              {card.bedStatus
                                ? formatEnumString(card.bedStatus)
                                : 'Unknown'}
                            </span>
                          </div>
                          <div className="ebb-free-center">
                            <strong>
                              {card.bedStatus
                                ? formatEnumString(card.bedStatus)
                                : 'Status unavailable'}
                            </strong>
                            <span>Not counted as ready</span>
                          </div>
                        </article>
                      );
                    }

                    const tone = losTone(
                      card.elapsedMs
                    );

                    const lvl =
                      card.ctas != null
                        ? CTAS_COLOR_VAR[card.ctas]
                        : 'var(--ebb-dim)';

                    return (
                      <article
                        className={`ebb-tile occ ${
                          tone === 'crit'
                            ? 'longstay'
                            : ''
                        }`}
                        key={card.bed.id}
                        style={
                          {
                            '--ebb-lvl': lvl
                          } as React.CSSProperties
                        }
                      >
                        <div className="ebb-card-top">
                          <div>
                            <span className="ebb-label">
                              BED
                            </span>

                            <h3>{card.bedLabel}</h3>

                            <span
                              className="ebb-zone"
                              title={card.zone}
                            >
                              {card.zone}
                            </span>
                          </div>

                          <span className="ebb-ctas-badge">
                            CTAS
                            <strong>
                              {card.ctas ?? '—'}
                            </strong>
                          </span>
                        </div>

                        <div className="ebb-patient">
                          <div className="ebb-avatar">
                            {card.initials || '—'}
                          </div>

                          <div>
                            <strong
                              className="ebb-mrn"
                              dir="ltr"
                            >
                              {card.mrn}
                            </strong>

                            <span>
                              {card.initials}
                              <i />
                              {card.ageSex}
                            </span>
                          </div>
                        </div>

                        {card.assignmentMissing && (
                          <p className="ebb-complaint">
                            Occupied — assignment details unavailable
                          </p>
                        )}

                        <p
                          className="ebb-complaint"
                          title={card.chiefComplaint}
                        >
                          {card.chiefComplaint}
                        </p>

                        <div
                          className={`ebb-los-box ${tone}`}
                        >
                          <span>
                            <BoardIcon name="clock" />
                            Length of stay
                          </span>

                          <strong className="ebb-num">
                            {formatLosOrDash(card.elapsedMs)}
                          </strong>
                        </div>

                        <dl className="ebb-care-team">
                          <div>
                            <dt>
                              <BoardIcon name="doctor" />
                              Doctor
                            </dt>

                            <dd title={card.doctor}>
                              {card.doctor}
                            </dd>
                          </div>

                          <div>
                            <dt>
                              <BoardIcon name="users" />
                              Nurse
                            </dt>

                            <dd title={card.nurse}>
                              {card.nurse}
                            </dd>
                          </div>
                        </dl>

                        <div className="ebb-diagnostics">
                          <div>
                            <span>
                              <BoardIcon name="lab" />
                              Lab
                            </span>

                            <StatusBadge
                              badge={card.lab}
                            />
                          </div>

                          <div>
                            <span>
                              <BoardIcon name="scan" />
                              Radiology
                            </span>

                            <StatusBadge
                              badge={card.rad}
                            />
                          </div>
                        </div>

                        <div className="ebb-card-footer">
                          <span>Triage destination</span>

                          <strong
                            title={card.disposition}
                          >
                            {card.disposition}
                          </strong>

                          <BoardIcon name="arrow" />
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            <section
              className="ebb-panel ebb-queue-panel"
              aria-labelledby="ebb-triage-title"
            >
              <div className="ebb-panel-heading">
                <div className="ebb-section-title">
                  <div className="ebb-section-icon purple">
                    <BoardIcon name="users" />
                  </div>

                  <div>
                    <h2 id="ebb-triage-title">
                      Triage queue

                      <span className="ebb-count">
                        {filteredTriageQueue.length}
                      </span>
                    </h2>

                    <p>
                      Prioritized by CTAS, then arrival
                    </p>
                  </div>
                </div>
              </div>

              <div className="ebb-queue-summary">
                <span>
                  <i />
                  Waiting for triage
                </span>

                <strong>
                  {waitingOverTarget} over target
                </strong>
              </div>

              <ol className="ebb-queue">
                {triageError || queueTriageBulkError ? (
                  <li className="ebb-empty">
                    <BoardIcon name="alert" />
                    <strong>Triage queue unavailable</strong>
                    <span>
                      The queue request failed. Refresh to try again.
                    </span>
                  </li>
                ) : !filteredTriageQueue.length ? (
                  <li className="ebb-empty">
                    <BoardIcon name="check" />

                    <strong>
                      {triageQueueItems.length
                        ? 'No matching patients'
                        : triageLoading || triageFetching
                          ? 'Loading triage queue…'
                          : 'Queue is clear'}
                    </strong>

                    <span>
                      {triageQueueItems.length
                        ? 'Try a different search.'
                        : triageLoading || triageFetching
                          ? 'Fetching eligible triage encounters.'
                          : 'No patients are currently waiting.'}
                    </span>
                  </li>
                ) : (
                  filteredTriageQueue.map(
                    (item, index) => {
                      const hasArrival = item.arrivalMs != null;
                      const waitedMs = hasArrival
                        ? Math.max(0, nowMs - (item.arrivalMs as number))
                        : null;

                      const waitedMin =
                        waitedMs != null
                          ? waitedMs / 60000
                          : null;

                      const target =
                        item.ctas != null
                          ? CTAS_TARGET_MINUTES[
                              item.ctas
                            ]
                          : null;

                      const over =
                        target != null &&
                        waitedMin != null &&
                        waitedMin > target;

                      const near =
                        target != null &&
                        waitedMin != null &&
                        !over &&
                        waitedMin > target * 0.75;

                      const targetText =
                        !hasArrival
                          ? 'Arrival time unavailable'
                          : target == null
                            ? 'Target unavailable'
                            : over
                              ? `${formatBoardDuration(
                                  ((waitedMin as number) - target) *
                                    60000
                                )} over target`
                              : target === 0
                                ? 'See immediately'
                                : `Target ${target} min`;

                      const lvl =
                        item.ctas != null
                          ? CTAS_COLOR_VAR[item.ctas]
                          : 'var(--ebb-dim)';

                      return (
                        <li
                          key={item.id}
                          className={`ebb-q ${
                            over
                              ? 'over'
                              : near
                                ? 'near'
                                : ''
                          }`}
                          style={
                            {
                              '--ebb-lvl': lvl
                            } as React.CSSProperties
                          }
                        >
                          <div className="ebb-queue-top">
                            <span className="ebb-queue-position">
                              {String(
                                index + 1
                              ).padStart(2, '0')}
                            </span>

                            <span className="ebb-ctas-badge">
                              CTAS

                              <strong>
                                {item.ctas ?? '—'}
                              </strong>
                            </span>

                            <span className="ebb-queue-time">
                              <BoardIcon name="clock" />

                              {formatLosOrDash(waitedMs)}
                            </span>
                          </div>

                          <strong
                            className="ebb-mrn"
                            dir="ltr"
                          >
                            {item.mrn}
                          </strong>

                          <div className="ebb-queue-person">
                            {item.initials}
                            <span>·</span>
                            {item.ageSex}
                          </div>

                          <p
                            className="ebb-complaint"
                            title={
                              item.chiefComplaint
                            }
                          >
                            {item.chiefComplaint ||
                              '—'}
                          </p>

                          <div className="ebb-queue-target">
                            {over && (
                              <BoardIcon name="alert" />
                            )}

                            <span>{targetText}</span>
                          </div>
                        </li>
                      );
                    }
                  )
                )}
              </ol>

              <div className="ebb-queue-foot">
                <BoardIcon name="shield" />

                <span>
                  Read-only monitoring view
                </span>
              </div>
            </section>
          </main>
        )}

        <footer className="ebb-legend">
          <div className="ebb-legend-levels">
            <strong>CTAS PRIORITY</strong>

            {[1, 2, 3, 4, 5].map(level => (
              <span key={level}>
                <i
                  style={{
                    background: CTAS_COLOR_VAR[level]
                  }}
                />

                {level}

                <small>
                  {level === 1
                    ? 'Immediate'
                    : `${CTAS_TARGET_MINUTES[level]} min`}
                </small>
              </span>
            ))}
          </div>

          <div className="ebb-los-legend">
            <BoardIcon name="clock" />

            <span>LOS alerts</span>

            <b className="warn">4+ hours</b>

            <b className="crit">6+ hours</b>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ERBedBoard;