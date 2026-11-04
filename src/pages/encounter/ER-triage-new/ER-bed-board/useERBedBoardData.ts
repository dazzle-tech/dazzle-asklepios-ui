import { useAppSelector } from '@/hooks';
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
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  buildAgeSex,
  buildDiagMapFromOrders,
  buildDiagMapFromTests,
  buildPatientFullName,
  buildPatientInitials,
  CTAS_TARGET_MINUTES,
  ctasFromEmergencyLevel,
  diagnosticStatusClass,
  extractEncounterId,
  extractPatientId,
  formatLosOrDash,
  formatPractitionerName,
  isDiagnosticPending,
  matchesBoardSearch,
  mergeDiagMaps,
  toDateSafe,
  visitStatusColor,
  visitStatusLabel
} from './erBedBoardUtils';

const SERVER_POLL_MS = 30000;
const CLOCK_TICK_MS = 15000;
const DIAG_PAGE_SIZE = 200;
const MAX_DIAG_PAGES = 25;
const BEDS_PAGE_SIZE = 500;
const TRIAGE_PAGE_SIZE = 500;

const TRIAGE_STATUSES = [
  'WAITING_TRIAGE',
  'PENDING_PAYMENT',
  'TRIAGE_STARTED'
] as const;

const BED_STATUS = {
  READY: 'READY',
  OCCUPIED: 'OCCUPIED',
  IN_CLEANING: 'IN_CLEANING',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE'
} as const;

export type DiagBadge = {
  status: string | null;
  label: string;
  className: string;
};

type DiagnosticSummary = {
  lab: string | null;
  rad: string | null;
};

export type BedCardModel = {
  bed: any;
  bedLabel: string;
  zone: string;
  bedStatus: string;
  isOccupied: boolean;
  isReady: boolean;
  isCleaning: boolean;
  isOutOfService: boolean;
  occupied: boolean;
  assignment: any;
  assignmentMissing: boolean;
  encounter: any;
  encounterId: number | null;
  encounterNumber: string;
  visitNo: string;
  patient: any;
  mrn: string;
  initials: string;
  ageSex: string;
  fullName: string;
  chiefComplaint: string;
  ctas: number | null;
  ctasDisplay: string;
  elapsedMs: number | null;
  doctor: string;
  nurse: string;
  lab: DiagBadge;
  rad: DiagBadge;
  /** Encounter treatment/visit status for the bed's active assignment only. */
  visitStatus: string;
  visitStatusCode: string | null;
  visitStatusColor: string;
  searchHaystack: Array<string | number | null | undefined>;
};

export type TriageQueueItem = {
  id: number | string;
  mrn: string;
  initials: string;
  ageSex: string;
  fullName: string;
  chiefComplaint: string;
  ctas: number | null;
  arrivalMs: number | null;
  encounterNumber: string;
  searchHaystack: Array<string | number | null | undefined>;
};

export type BoardMetric = {
  label: string;
  value: string;
  suffix?: string;
  detail: string;
  icon: string;
  tone: string;
};

const normalizeBedStatus = (status: unknown): string =>
  String(status ?? '').toUpperCase();

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

export default function useERBedBoardData(searchQuery: string) {
  const selectedDepartment = useAppSelector(
    state => state.auth.selectedDepartment
  );

  const departmentId =
    selectedDepartment?.departmentId ?? selectedDepartment?.id;

  const [nowMs, setNowMs] = useState(() => Date.now());

  const [encountersById, setEncountersById] = useState<
    Map<string, any>
  >(new Map());

  const [practitionersById, setPractitionersById] = useState<
    Map<string, any>
  >(new Map());

  const [diagByEncounter, setDiagByEncounter] = useState<
    Map<string, DiagnosticSummary>
  >(new Map());

  const [diagError, setDiagError] = useState(false);
  const [diagStale, setDiagStale] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagRefreshTick, setDiagRefreshTick] = useState(0);
  const [encountersError, setEncountersError] = useState(false);
  const [queueTriageBulkError, setQueueTriageBulkError] =
    useState(false);

  const [assignmentInconsistencies, setAssignmentInconsistencies] =
    useState<string[]>([]);

  const [triageQueueBulk, setTriageQueueBulk] = useState<any[]>([]);

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
  const [fetchDiagnosticOrderById] =
    useLazyGetDiagnosticOrderByIdQuery();
  const [fetchDiagnosticOrderTests] =
    useLazyFilterDiagnosticOrderTestsQuery();

  const [getTriageBulkForQueue] =
    useLazyGetEmergencyTriageBulkByEncounterIdsQuery();

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

  useEffect(() => {
    const id = window.setInterval(
      () => setDiagRefreshTick(tick => tick + 1),
      SERVER_POLL_MS
    );

    return () => window.clearInterval(id);
  }, []);

  const isEmergencyDepartment = useMemo(
    () =>
      String(departmentData?.encounterType ?? '').toUpperCase() ===
      'EMERGENCY',
    [departmentData]
  );

  const todayStr = useMemo(() => formatDate(new Date()), []);

  const fromDateWide = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return formatDate(date);
  }, []);

  useEffect(() => {
    setEncountersById(new Map());
    setPractitionersById(new Map());
    setDiagByEncounter(new Map());
    setTriageQueueBulk([]);
    setDiagError(false);
    setDiagStale(false);
    setDiagLoading(false);
    setEncountersError(false);
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

  const {
    data: totalBedsCount = 0,
    isError: totalBedsCountError,
    refetch: refetchTotalBedsCount
  } = useCountActiveBedsQuery(
    { departmentId: departmentId as any },
    {
      skip: skipBedQueries,
      pollingInterval: SERVER_POLL_MS
    }
  );

  const {
    data: occupiedBedsCount = 0,
    isError: occupiedCountError,
    refetch: refetchOccupiedCount
  } = useCountBedsByStatusQuery(
    {
      departmentId: departmentId as any,
      status: BED_STATUS.OCCUPIED
    },
    {
      skip: skipBedQueries,
      pollingInterval: SERVER_POLL_MS
    }
  );

  const {
    data: readyBedsCount = 0,
    isError: readyCountError,
    refetch: refetchReadyCount
  } = useCountBedsByStatusQuery(
    {
      departmentId: departmentId as any,
      status: BED_STATUS.READY
    },
    {
      skip: skipBedQueries,
      pollingInterval: SERVER_POLL_MS
    }
  );

  const {
    data: cleaningBedsCount = 0,
    isError: cleaningCountError,
    refetch: refetchCleaningCount
  } = useCountBedsByStatusQuery(
    {
      departmentId: departmentId as any,
      status: BED_STATUS.IN_CLEANING
    },
    {
      skip: skipBedQueries,
      pollingInterval: SERVER_POLL_MS
    }
  );

  const {
    data: outOfServiceBedsCount = 0,
    isError: outOfServiceCountError,
    refetch: refetchOutOfServiceCount
  } = useCountBedsByStatusQuery(
    {
      departmentId: departmentId as any,
      status: BED_STATUS.OUT_OF_SERVICE
    },
    {
      skip: skipBedQueries,
      pollingInterval: SERVER_POLL_MS
    }
  );

  const beds = useMemo(
    () =>
      ((bedsResponse?.data ?? []) as any[]).filter(
        bed => bed?.isActive !== false
      ),
    [bedsResponse]
  );

  const occupiedBedIds = useMemo(
    () =>
      beds
        .filter(
          bed =>
            normalizeBedStatus(bed?.status) === BED_STATUS.OCCUPIED
        )
        .map(bed => bed.id)
        .filter(id => id != null),
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

    if (!Array.isArray(activeAssignments)) return map;

    activeAssignments.forEach((assignment: any) => {
      const bedId = assignment?.bedId ?? assignment?.bed?.id;

      if (bedId != null) {
        map.set(String(bedId), assignment);
      }
    });

    return map;
  }, [activeAssignments]);

  const occupiedEncounterIds = useMemo(() => {
    if (!Array.isArray(activeAssignments)) return [] as number[];

    return Array.from(
      new Set(
        activeAssignments
          .map((assignment: any) => extractEncounterId(assignment))
          .filter((id): id is number => id != null)
      )
    );
  }, [activeAssignments]);

  const occupiedEncounterIdsKey = occupiedEncounterIds.join(',');

  const occupiedPatientIdsFromAssignments = useMemo(() => {
    if (!Array.isArray(activeAssignments)) return [] as number[];

    return Array.from(
      new Set(
        activeAssignments
          .map((assignment: any) => extractPatientId(assignment))
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
        !isEmergencyDepartment || occupiedEncounterIds.length === 0,
      pollingInterval: SERVER_POLL_MS
    }
  );

  const triageByEncounterId = useMemo(() => {
    const map = new Map<string, any>();

    if (!occupiedTriageSuccess || !Array.isArray(occupiedTriages)) {
      return map;
    }

    occupiedTriages.forEach((triage: any) => {
      const encounterId = extractEncounterId(triage);

      if (encounterId != null) {
        map.set(String(encounterId), triage);
      }
    });

    return map;
  }, [occupiedTriages, occupiedTriageSuccess]);

  useEffect(() => {
    if (!isEmergencyDepartment || occupiedEncounterIds.length === 0) {
      return;
    }

    let cancelled = false;
    setEncountersError(false);

    getEncountersByIds({ ids: occupiedEncounterIds })
      .unwrap()
      .then((rows: any[]) => {
        if (cancelled) return;

        const map = new Map<string, any>();

        (rows ?? []).forEach(encounter => {
          if (encounter?.id != null) {
            map.set(String(encounter.id), encounter);
          }
        });

        setEncountersById(map);
        setEncountersError(false);
      })
      .catch(() => {
        if (!cancelled) {
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
    const ids = occupiedPatientIdsFromAssignments.map(String);

    encountersById.forEach(encounter => {
      const patientId = extractPatientId(encounter);

      if (patientId != null) {
        ids.push(String(patientId));
      }
    });

    return Array.from(new Set(ids));
  }, [occupiedPatientIdsFromAssignments, encountersById]);

  const patientById = useMemo(() => {
    const map = new Map<string, any>();

    (patientsBasicInfo ?? []).forEach((patient: any) => {
      if (patient?.id != null) {
        map.set(String(patient.id), patient);
      }
    });

    return map;
  }, [patientsBasicInfo]);

  const practitionerIds = useMemo(() => {
    const ids: number[] = [];

    encountersById.forEach(encounter => {
      const id = encounter?.practitionerId;

      if (id != null && !Number.isNaN(Number(id))) {
        ids.push(Number(id));
      }
    });

    return Array.from(new Set(ids));
  }, [encountersById]);

  const assignedNurseIds = useMemo(() => {
    const ids: number[] = [];

    encountersById.forEach(encounter => {
      const id = encounter?.assignedNurseId;

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
        `${String(user.firstName ?? '').trim()} ${String(
          user.lastName ?? ''
        ).trim()}`.trim() ||
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

        (rows ?? []).forEach(practitioner => {
          if (practitioner?.id != null) {
            map.set(String(practitioner.id), practitioner);
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
      fetchPage: (
        page: number
      ) => Promise<{ data?: any[]; totalCount?: number }>
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
    if (!isEmergencyDepartment || occupiedEncounterIds.length === 0) {
      setDiagByEncounter(new Map());
      setDiagError(false);
      setDiagStale(false);
      setDiagLoading(false);
      return;
    }

    let cancelled = false;

    const encounterIdSet = new Set(
      occupiedEncounterIds.map(id => String(id))
    );

    const encounterIdIn = occupiedEncounterIds.join(',');
    const patientIdIn = occupiedPatientIdsFromAssignments.join(',');

    const loadDiagnostics = async () => {
      setDiagError(false);
      setDiagLoading(true);

      try {
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

        [...byEncounter, ...byPatient].forEach(order => {
          if (order?.id == null) return;

          const encounterId = extractEncounterId(order);

          if (
            encounterId == null ||
            !encounterIdSet.has(String(encounterId))
          ) {
            return;
          }

          ordersById.set(String(order.id), order);
        });

        const orders = Array.from(ordersById.values());
        const orderIdToEncounterId = new Map<string, string>();

        orders.forEach(order => {
          const encounterId = extractEncounterId(order);

          if (encounterId != null) {
            orderIdToEncounterId.set(
              String(order.id),
              String(encounterId)
            );
          }
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
            const missingOrderIds = Array.from(
              new Set(
                tests
                  .map((test: any) => test?.orderId)
                  .filter((id: any) => id != null)
                  .map((id: any) => String(id))
                  .filter(
                    (id: string) =>
                      !orderIdToEncounterId.has(id) &&
                      extractEncounterId(
                        tests.find(
                          (test: any) => String(test?.orderId) === id
                        )
                      ) == null
                  )
              )
            ).slice(0, 50);

            await Promise.all(
              missingOrderIds.map(async (orderId: string) => {
                try {
                  const order = await fetchDiagnosticOrderById(
                    Number(orderId)
                  ).unwrap();

                  const encounterId = extractEncounterId(order);

                  if (
                    encounterId != null &&
                    encounterIdSet.has(String(encounterId))
                  ) {
                    orderIdToEncounterId.set(
                      orderId,
                      String(encounterId)
                    );
                  }
                } catch {
                  // Unresolved orders remain unmapped.
                }
              })
            );

            if (cancelled) return;

            const fromTests = buildDiagMapFromTests(
              tests,
              orderIdToEncounterId,
              null
            );

            if (fromTests.size > 0) {
              next = mergeDiagMaps(next, fromTests);
              usedTests = true;
            } else {
              testsUnmapped = true;
            }
          }
        } catch {
          testsFailed = true;
        }

        if (cancelled) return;

        setDiagByEncounter(next);
        setDiagError(false);
        setDiagStale((testsFailed && !usedTests) || testsUnmapped);
        setDiagLoading(false);
      } catch {
        if (!cancelled) {
          setDiagError(true);
          setDiagLoading(false);
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
    if (
      !Array.isArray(activeAssignments) ||
      encountersById.size === 0
    ) {
      setAssignmentInconsistencies([]);
      return;
    }

    const notes: string[] = [];

    activeAssignments.forEach((assignment: any) => {
      const encounterId = extractEncounterId(assignment);

      if (encounterId == null) {
        notes.push(
          `Bed ${
            assignment?.bedId ?? '?'
          } has an active assignment without encounterId.`
        );
        return;
      }

      const encounter = encountersById.get(String(encounterId));
      if (!encounter) return;

      const discharged = toDateSafe(encounter?.dischargeAt);
      const status = String(
        encounter?.encounterStatus ?? encounter?.status ?? ''
      ).toUpperCase();

      if (
        discharged ||
        status === 'DISCHARGED' ||
        status === 'COMPLETED'
      ) {
        notes.push(
          `Encounter ${
            encounter?.encounterNumber ?? encounterId
          } is discharged/completed but still has an active bed assignment (bed ${
            assignment?.bedId ?? '?'
          }).`
        );
      }
    });

    setAssignmentInconsistencies(notes);
  }, [activeAssignments, encountersById]);

  const triageFilterParams = useMemo(() => {
    if (!departmentId || !isEmergencyDepartment) return null;

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

  const triageEncounterIds = useMemo(
    () =>
      Array.from(
        new Set(
          triageEncounterRows
            .map(row => row?.id)
            .filter(id => id != null)
            .map(id => Number(id))
            .filter(id => !Number.isNaN(id))
        )
      ),
    [triageEncounterRows]
  );

  const triageEncounterIdsKey = triageEncounterIds.join(',');

  useEffect(() => {
    if (!isEmergencyDepartment || triageEncounterIds.length === 0) {
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

    triageQueueBulk.forEach(triage => {
      const encounterId = extractEncounterId(triage);

      if (encounterId != null) {
        map.set(String(encounterId), triage);
      }
    });

    return map;
  }, [triageQueueBulk]);

  const triagePatientIds = useMemo(
    () =>
      Array.from(
        new Set(
          triageEncounterRows
            .map(row => row?.patient?.id ?? row?.patientId)
            .filter(id => id != null)
            .map(String)
        )
      ),
    [triageEncounterRows]
  );

  const allPatientIdsForBulk = useMemo(
    () =>
      Array.from(
        new Set(
          [...occupiedPatientIds, ...triagePatientIds]
            .map(Number)
            .filter(id => Number.isFinite(id))
        )
      ),
    [occupiedPatientIds, triagePatientIds]
  );

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

  const resolvePatient = useCallback(
    (assignment: any, encounter: any) => {
      const patientId =
        assignment?.patient?.id ??
        assignment?.patientId ??
        encounter?.patient?.id ??
        encounter?.patientId;

      const patient =
        patientId != null
          ? patientById.get(String(patientId))
          : null;

      return (
        patient || assignment?.patient || encounter?.patient || null
      );
    },
    [patientById]
  );

  const bedCards = useMemo(
    (): BedCardModel[] =>
      beds.map((bed: any) => {
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
        const ctas = ctasFromEmergencyLevel(triage?.emergencyLevel);

        const created = toDateSafe(
          encounter?.createdDate ??
            encounter?.createdAt ??
            encounter?.created_at
        );

        const discharged = toDateSafe(encounter?.dischargeAt);

        const elapsedMs = created
          ? Math.max(
              0,
              (discharged ? discharged.getTime() : nowMs) -
                created.getTime()
            )
          : null;

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
        const fullNameRaw =
          buildPatientFullName(patient) ||
          String(assignment?.patientName ?? '').trim() ||
          '';

        const encounterNumber =
          encounter?.encounterNumber != null
            ? String(encounter.encounterNumber).trim()
            : '';

        const bedLabel = bed?.name ?? '';
        const zone =
          bed?.room?.name ||
          bed?.locationDetails ||
          formatEnumString(bed?.type) ||
          '—';

        const encounterDetailsPending =
          isOccupied &&
          encounterId != null &&
          !encounter &&
          (encountersError ||
            assignmentsFetching ||
            bedsFetching ||
            !encountersById.size);

        const triageDetailsPending =
          isOccupied &&
          encounterId != null &&
          !triage &&
          (occupiedTriageFetching || occupiedTriageError);

        const fieldOrUnrecorded = (
          value: unknown,
          pending: boolean
        ): string => {
          if (value != null && String(value).trim()) {
            return String(value).trim();
          }

          if (pending) return '…';

          if (encountersError && isOccupied && encounterId != null) {
            return 'Unavailable';
          }

          return '—';
        };

        const doctor =
          encounter?.practitionerName ||
          formatPractitionerName(
            encounter?.practitionerId != null
              ? practitionersById.get(
                  String(encounter.practitionerId)
                )
              : null
          );

        const nurse =
          encounter?.assignedNurseName ||
          (encounter?.assignedNurseId != null
            ? nursesById.get(String(encounter.assignedNurseId))
            : null);

        // Visit status comes only from the encounter linked to this bed's
        // active assignment — never another encounter for the same patient.
        const visitStatusRaw = String(
          encounter?.status ??
            encounter?.treatmentStatus ??
            encounter?.encounterStatus ??
            ''
        ).trim();

        const visitStatusCode = visitStatusRaw
          ? visitStatusRaw.toUpperCase()
          : null;

        const visitStatus = fieldOrUnrecorded(
          visitStatusLabel(visitStatusRaw),
          encounterDetailsPending
        );

        const chiefComplaint =
          encounter?.chiefComplaint != null
            ? String(encounter.chiefComplaint).trim()
            : '';

        const assignmentsLoaded =
          Array.isArray(activeAssignments) && !assignmentsError;

        const diagPending =
          isOccupied &&
          encounterId != null &&
          !diag &&
          !diagError &&
          diagLoading;

        const resolveDiagnosticBadge = (
          status: string | null | undefined
        ): DiagBadge => {
          if (diagError && !diag) {
            return {
              status: null,
              label: 'Unavailable',
              className: ''
            };
          }

          if (diagPending) {
            return {
              status: null,
              label: '…',
              className: ''
            };
          }

          return toDiagBadge(status);
        };

        const fullName = fieldOrUnrecorded(
          fullNameRaw,
          // Name can resolve from assignment.patientName before encounter loads.
          encounterDetailsPending && !fullNameRaw
        );

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
          visitNo: fieldOrUnrecorded(
            encounterNumber,
            encounterDetailsPending
          ),
          patient,
          mrn,
          initials,
          ageSex,
          fullName,
          chiefComplaint: fieldOrUnrecorded(
            chiefComplaint,
            encounterDetailsPending
          ),
          ctas,
          ctasDisplay:
            ctas != null
              ? String(ctas)
              : triageDetailsPending
                ? '…'
                : occupiedTriageError
                  ? 'Unavailable'
                  : '—',
          elapsedMs,
          doctor: fieldOrUnrecorded(
            doctor && doctor !== '—' ? doctor : '',
            encounterDetailsPending
          ),
          nurse: fieldOrUnrecorded(nurse, encounterDetailsPending),
          lab: resolveDiagnosticBadge(diag?.lab),
          rad: resolveDiagnosticBadge(diag?.rad),
          visitStatus,
          visitStatusCode,
          visitStatusColor: visitStatusColor(visitStatusCode),
          searchHaystack: [
            bedLabel,
            mrn,
            fullName,
            initials,
            encounterNumber,
            visitStatus,
            formatEnumString(bedStatus)
          ]
        };
      }),
    [
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
      assignmentsError,
      assignmentsFetching,
      bedsFetching,
      encountersError,
      occupiedTriageFetching,
      occupiedTriageError,
      diagError,
      diagLoading
    ]
  );

  const filteredBedCards = useMemo(
    () =>
      bedCards.filter(card =>
        matchesBoardSearch(searchQuery, card.searchHaystack)
      ),
    [bedCards, searchQuery]
  );

  const triageQueueItems = useMemo((): TriageQueueItem[] => {
    const items = triageEncounterRows.map((row: any) => {
      const triage = triageMapForQueue.get(String(row.id));
      const patientId = row?.patient?.id ?? row?.patientId;

      const patient =
        (patientId != null
          ? patientById.get(String(patientId))
          : null) ||
        row?.patient ||
        null;

      const arrival = toDateSafe(
        row?.createdDate ?? row?.createdAt ?? row?.created_at
      );

      const mrn = patient?.medicalRecordNumber ?? '—';
      const initials = buildPatientInitials(patient);
      const ageSex = buildAgeSex(patient, row?.patientAge);
      const fullName = buildPatientFullName(patient);
      const encounterNumber = row?.encounterNumber ?? '';

      return {
        id: row.id,
        mrn,
        initials,
        ageSex,
        fullName,
        chiefComplaint: row?.chiefComplaint ?? '',
        ctas: ctasFromEmergencyLevel(triage?.emergencyLevel),
        arrivalMs: arrival ? arrival.getTime() : null,
        encounterNumber,
        searchHaystack: [mrn, fullName, initials, encounterNumber]
      };
    });

    return items.sort((a, b) => {
      const priorityDifference = (a.ctas ?? 99) - (b.ctas ?? 99);

      if (priorityDifference) return priorityDifference;

      return (
        (a.arrivalMs ?? Number.POSITIVE_INFINITY) -
        (b.arrivalMs ?? Number.POSITIVE_INFINITY)
      );
    });
  }, [triageEncounterRows, triageMapForQueue, patientById]);

  const filteredTriageQueue = useMemo(
    () =>
      triageQueueItems.filter(item =>
        matchesBoardSearch(searchQuery, item.searchHaystack)
      ),
    [triageQueueItems, searchQuery]
  );

  const totalBedsForSummary = Number(totalBedsCount) || 0;
  const occupiedForSummary = Number(occupiedBedsCount) || 0;
  const availableForSummary = Number(readyBedsCount) || 0;
  const cleaningForSummary = Number(cleaningBedsCount) || 0;
  const outOfServiceForSummary = Number(outOfServiceBedsCount) || 0;

  const occupancyPct = totalBedsForSummary
    ? Math.round((occupiedForSummary / totalBedsForSummary) * 100)
    : 0;

  const occupiedCards = useMemo(
    () => bedCards.filter(card => card.isOccupied),
    [bedCards]
  );

  const waitingOverTarget = useMemo(
    () =>
      triageQueueItems.filter(item => {
        if (item.ctas == null || item.arrivalMs == null) return false;

        const target = CTAS_TARGET_MINUTES[item.ctas];

        return (
          target != null &&
          (nowMs - item.arrivalMs) / 60000 > target
        );
      }).length,
    [triageQueueItems, nowMs]
  );

  const knownLosCards = useMemo(
    () =>
      occupiedCards.filter(
        card =>
          card.elapsedMs != null && Number.isFinite(card.elapsedMs)
      ),
    [occupiedCards]
  );

  const avgLosMs = useMemo(
    () =>
      knownLosCards.length
        ? knownLosCards.reduce(
            (sum, card) => sum + (card.elapsedMs as number),
            0
          ) / knownLosCards.length
        : null,
    [knownLosCards]
  );

  const over4hCount = useMemo(
    () =>
      knownLosCards.filter(
        card => (card.elapsedMs as number) >= 240 * 60000
      ).length,
    [knownLosCards]
  );

  const labPending = useMemo(
    () =>
      occupiedCards.filter(card =>
        isDiagnosticPending(card.lab.status)
      ).length,
    [occupiedCards]
  );

  const radPending = useMemo(
    () =>
      occupiedCards.filter(card =>
        isDiagnosticPending(card.rad.status)
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
    queueTriageBulkError ||
    encountersError;

  const refreshing =
    bedsFetching || assignmentsFetching || triageFetching;

  const metrics: BoardMetric[] = [
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

  const handleRefresh = () => {
    if (!departmentId || !isEmergencyDepartment) return;

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

    setDiagRefreshTick(tick => tick + 1);
  };

  return {
    departmentId,
    departmentData,
    departmentName,
    isEmergencyDepartment,
    isDepartmentFetching,
    isDepartmentError,

    nowMs,
    clockTime,
    clockDate,

    bedCards,
    filteredBedCards,
    triageQueueItems,
    filteredTriageQueue,
    triageEncounterRows,

    metrics,
    occupancyPct,
    occupiedForSummary,
    availableForSummary,
    cleaningForSummary,
    outOfServiceForSummary,
    waitingOverTarget,

    isLoading,
    refreshing,
    hasError,
    diagError,
    diagStale,
    assignmentsError,
    encountersError,
    triageError,
    queueTriageBulkError,
    bedCountsError,
    assignmentInconsistencies,
    triageLoading,
    triageFetching,

    handleRefresh
  };
}
