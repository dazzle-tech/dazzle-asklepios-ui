import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyTab from '@/components/MyTab';
import MyModal from '@/components/MyModal/MyModal';
import CancellationModal from '@/components/CancellationModal/CancellationModal';

import TreatmentPlanModal from './TreatmentPlanModal';
import TreatmentPlanHeaderModal, {
  toPractitionerOptions
} from './TreatmentPlanHeaderModal';
import ProposeTreatmentChartModal from './ProposeTreatmentChartModal';
import ActivePlans from './ActivePlans';
import PrintTreatmentPlanModal from './print/PrintTreatmentPlanModal';
import TreatmentPlanHistory, {
  type HistoryStatus
} from './TreatmentPlanHistory';
import {
  EMPTY_VALUE,
  PlanStatus,
  formatDate,
  isCompleted,
  isExistingDocumentation,
  isGroupedScope,
  isInProgress,
  sortTreatments,
  treatmentRowKey,
  validateTreatmentFinancials
} from './treatmentPlanShared';

import {
  useGetTreatmentPlanByEncounterQuery,
  useGetTreatmentsByPlanQuery,
  useCreatePlannedTreatmentMutation,
  useCreatePlannedTreatmentsBatchMutation,
  useUpdatePlannedTreatmentMutation,
  useCancelPlannedTreatmentMutation,
  useCompletePlannedTreatmentMutation,
  useStartPlannedTreatmentMutation,
  useGetTreatmentPlansByPatientQuery,
  useGetTreatmentPlanSessionsQuery,
  useGetTreatmentPlanStatusLogQuery,
  useGetTreatmentPlanTreatmentHistoryQuery,
  useCreateTreatmentPlanMutation,
  useUpdateTreatmentPlanHeaderMutation,
  useProposeTreatmentPlanMutation,
  useAcceptTreatmentPlanMutation,
  useReturnTreatmentPlanToDraftMutation,
  useHoldTreatmentPlanMutation,
  useResumeTreatmentPlanMutation,
  useCancelTreatmentPlanMutation
} from '@/services/dental/dentalTreatmentPlanService';

import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { useGetAllCdtQuery } from '@/services/setup/cdtCodeService';
import { useGetServicesByCategoryQuery } from '@/services/setup/serviceService';
import { useGetProceduresByCategoryQuery } from '@/services/setup/procedure/procedureService';
import { useGetAllDentalActionsQuery } from '@/services/setup/dental-action/dentalActionService';
import { patientServicesAndProductsService } from '@/services/encounters/patientServicesAndProductsService';

import {
  newApDentalPlannedTreatment,
  newApDentalChartTooth
} from '@/types/model-types-constructor';

import {
  teethForTreatmentScope,
  type TreatmentAreaScope
} from '@/utils/toothNumber';

import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import { notify } from '@/utils/uiReducerActions';

import './TreatmentPlanTab.less';

const ACTIVE_PLAN_STATUSES = [
  'DRAFT',
  'PROPOSED',
  'ACCEPTED',
  'IN_PROGRESS',
  'ON_HOLD'
];

type PlanReasonAction = 'hold' | 'cancel' | 'return-draft';

const normalizeNumber = (value: any): number | null => {
  if (value === '' || value === null || value === undefined) return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const emptyTreatment = () => ({
  ...newApDentalPlannedTreatment,
  type: 'CURRENT' as const,
  status: 'PENDING' as const,
  toothId: null,
  treatmentScope: 'SPECIFIC_TOOTH' as TreatmentAreaScope,
  coveredToothIds: [],
  quantity: 1,
  price: 0,
  discount: 0,
  visitNumber: null,
  sessionChoice: 'NEW',
  note: '',
  anesthesiaUsed: '',
  dose: null,
  unit: null,
  fillingMaterial: ''
});

const TreatmentPlanTab = ({
  encounter,
  patient,
  treatmentPlanTrigger,
  setTreatmentPlanTrigger,
  originalChart,
  dispatch
}) => {
  const location = useLocation();

  const readOnly =
    location.state?.viewMode === 'readOnly' ||
    Boolean(location.state?.edit ?? false);

  const direction =
    (localStorage.getItem('direction') || 'LTR').toUpperCase() === 'RTL'
      ? 'rtl'
      : 'ltr';

  const [form, setForm] = useState<any>(emptyTreatment());
  const [selectedTooth, setSelectedTooth] = useState<any>({
    ...newApDentalChartTooth
  });
  const [selectedTeeth, setSelectedTeeth] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelForm, setCancelForm] = useState<any>({
    cancellationReason: ''
  });
  const [rowPendingAction, setRowPendingAction] = useState<any>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [plansTab, setPlansTab] = useState('1');
  const [historyStatus, setHistoryStatus] = useState<HistoryStatus>('ALL');

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState<any>({
    title: '',
    notes: '',
    practitionerId: null
  });

  const [planReasonOpen, setPlanReasonOpen] = useState(false);
  const [planReasonAction, setPlanReasonAction] =
    useState<PlanReasonAction | null>(null);
  const [planReason, setPlanReason] = useState({ reason: '' });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [proposeChartOpen, setProposeChartOpen] = useState(false);
  const [printPlan, setPrintPlan] = useState<any>(null);
  const [planActionBusy, setPlanActionBusy] = useState(false);

  const [rememberedSession, setRememberedSession] =
    useState<Record<number, string>>({});

  const cdtListResponse = useGetAllCdtQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const { data: serviceList, isLoading: servicesLoading } =
    useGetServicesByCategoryQuery({
      page: 0,
      size: 1000,
      category: 'DENTAL'
    });

  const { data: procedureList, isLoading: proceduresLoading } =
    useGetProceduresByCategoryQuery({
      categoryType: 'DENTAL_PROCEDURE',
      page: 0,
      size: 1000
    });

  const dentalActionsRes = useGetAllDentalActionsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const treatmentPlanDataResponse = useGetTreatmentPlanByEncounterQuery(
    encounter?.id,
    { skip: !encounter?.id }
  );

  const plansQuery = useGetTreatmentPlansByPatientQuery(patient?.id, {
    skip: !patient?.id
  });

  const planTreatmentsQuery = useGetTreatmentsByPlanQuery(
    selectedPlanId as number,
    { skip: !selectedPlanId }
  );

  const planSessionsQuery = useGetTreatmentPlanSessionsQuery(
    selectedPlanId as number,
    { skip: !selectedPlanId }
  );

  const statusLogQuery = useGetTreatmentPlanStatusLogQuery(
    selectedPlanId as number,
    { skip: !selectedPlanId || !historyOpen }
  );

  const treatmentHistoryQuery = useGetTreatmentPlanTreatmentHistoryQuery(
    selectedPlanId as number,
    { skip: !selectedPlanId || !historyOpen }
  );

  const practitionersQuery = useGetAllPractitionersQuery({
    page: 0,
    size: 1000
  });

  const [createPlannedTreatment, createMutation] =
    useCreatePlannedTreatmentMutation();
  const [createPlannedTreatmentsBatch, createBatchMutation] =
    useCreatePlannedTreatmentsBatchMutation();
  const [updatePlannedTreatment, updateMutation] =
    useUpdatePlannedTreatmentMutation();
  const [cancelPlannedTreatment, cancelMutation] =
    useCancelPlannedTreatmentMutation();
  const [completePlannedTreatment, completeMutation] =
    useCompletePlannedTreatmentMutation();
  const [startPlannedTreatment, startMutation] =
    useStartPlannedTreatmentMutation();

  const [createTreatmentPlan, createPlanMutation] =
    useCreateTreatmentPlanMutation();
  const [updateTreatmentPlanHeader, updatePlanMutation] =
    useUpdateTreatmentPlanHeaderMutation();
  const [proposeTreatmentPlan] = useProposeTreatmentPlanMutation();
  const [acceptTreatmentPlan] = useAcceptTreatmentPlanMutation();
  const [returnTreatmentPlanToDraft] =
    useReturnTreatmentPlanToDraftMutation();
  const [holdTreatmentPlan] = useHoldTreatmentPlanMutation();
  const [resumeTreatmentPlan] = useResumeTreatmentPlanMutation();
  const [cancelTreatmentPlan] = useCancelTreatmentPlanMutation();

  const isSaving =
    createMutation.isLoading ||
    createBatchMutation.isLoading ||
    updateMutation.isLoading;

  const headerSaving =
    createPlanMutation.isLoading || updatePlanMutation.isLoading;

  const isBusy =
    isSaving ||
    cancelMutation.isLoading ||
    startMutation.isLoading ||
    completeMutation.isLoading ||
    completingId != null ||
    headerSaving ||
    planActionBusy;

  useEffect(() => {
    if (encounter?.id) treatmentPlanDataResponse.refetch();
    if (patient?.id) plansQuery.refetch();

    if (selectedPlanId) {
      planSessionsQuery.refetch();
      planTreatmentsQuery.refetch();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treatmentPlanTrigger]);

  const cdtMap = useMemo(
    () =>
      (cdtListResponse.data?.data ?? []).reduce(
        (map: Record<number, any>, item: any) => {
          map[item.id] = item;
          return map;
        },
        {}
      ),
    [cdtListResponse.data]
  );

  const dentalServicesMap = useMemo(
    () =>
      (serviceList?.data ?? []).reduce(
        (map: Record<number, any>, item: any) => {
          map[item.id] = item;
          return map;
        },
        {}
      ),
    [serviceList]
  );

  const dentalProceduresMap = useMemo(
    () =>
      (procedureList?.data ?? []).reduce(
        (map: Record<number, any>, item: any) => {
          map[item.id] = item;
          return map;
        },
        {}
      ),
    [procedureList]
  );

  const dentalActionsMap = useMemo(
    () =>
      (dentalActionsRes.data?.data ?? []).reduce(
        (map: Record<number, any>, item: any) => {
          map[item.id] = item;
          return map;
        },
        {}
      ),
    [dentalActionsRes.data]
  );

  const treatments = useMemo(() => {
    const rows = [
      ...(treatmentPlanDataResponse.data?.draftTreatments ?? []),
      ...(treatmentPlanDataResponse.data?.currentTreatments ?? [])
    ];

    const unique = new Map<string, any>();

    rows.forEach(row => {
      const key = treatmentRowKey(row);
      if (!unique.has(key)) unique.set(key, row);
    });

    return sortTreatments(Array.from(unique.values()));
  }, [treatmentPlanDataResponse.data]);

  const plans = plansQuery.data ?? [];

  const selectedPlan =
    plans.find(plan => plan.id === selectedPlanId) ?? null;

  const practitioners = practitionersQuery.data?.data ?? [];

  const practitionerOptions = useMemo(
    () => toPractitionerOptions(practitioners),
    [practitioners]
  );

  const planTreatments = useMemo(() => {
    if (!selectedPlanId) return [];

    return sortTreatments(
      (planTreatmentsQuery.currentData ?? []).filter((row: any) => {
        if (isExistingDocumentation(row)) return false;

        return (
          row.treatmentPlanId == null ||
          Number(row.treatmentPlanId) === Number(selectedPlanId)
        );
      })
    );
  }, [planTreatmentsQuery.currentData, selectedPlanId]);

  const existingDocumentation = useMemo(
    () => treatments.filter(isExistingDocumentation),
    [treatments]
  );

  const activePlans = plans.filter(plan =>
    ACTIVE_PLAN_STATUSES.includes(plan.status)
  );

  const allHistoryPlans = plans.filter(
    plan => plan.status === 'COMPLETED' || plan.status === 'CANCELLED'
  );

  const historyPlans = allHistoryPlans.filter(
    plan => historyStatus === 'ALL' || plan.status === historyStatus
  );

  const planExecutable =
    selectedPlan?.status === 'ACCEPTED' ||
    selectedPlan?.status === 'IN_PROGRESS';

  const planEditableHeader =
    selectedPlan?.status === 'DRAFT' ||
    selectedPlan?.status === 'PROPOSED';

  const planAcceptsTreatments = planEditableHeader || planExecutable;

  const teethById = useMemo(
    () =>
      (originalChart?.teeth ?? []).reduce(
        (map: Record<number, any>, tooth: any) => {
          if (tooth?.id != null) map[tooth.id] = tooth;
          return map;
        },
        {}
      ),
    [originalChart]
  );

  const resolveChartTooth = (tooth: any) =>
    (originalChart?.teeth ?? []).find(
      (item: any) =>
        tooth?.id != null && String(item.id) === String(tooth.id)
    ) || null;

  const showError = (error: any, fallback: string) =>
    dispatch(
      notify({
        msg: extractApiErrorMessage(error) || fallback,
        sev: 'error'
      })
    );

  const refreshPlans = () =>
    setTreatmentPlanTrigger(previous => previous * -1);

  const resetModalState = () => {
    setForm(emptyTreatment());
    setSelectedTooth({ ...newApDentalChartTooth });
    setSelectedTeeth([]);
    setRowPendingAction(null);
    setViewOnly(false);
  };

  const getRowTeeth = (row: any) => {
    const scope: TreatmentAreaScope =
      row.treatmentScope || 'SPECIFIC_TOOTH';

    const coveredIds: number[] = Array.isArray(row.coveredToothIds)
      ? row.coveredToothIds
      : [];

    if (isGroupedScope(scope)) {
      return coveredIds.length
        ? coveredIds.map(id => teethById[id]).filter(Boolean)
        : teethForTreatmentScope(originalChart?.teeth, scope);
    }

    const toothId = row.toothId ?? row.tooth?.id;
    return toothId != null && teethById[toothId]
      ? [teethById[toothId]]
      : [];
  };

  const openAddModal = () => {
    if (readOnly || isBusy || !selectedPlan || !planAcceptsTreatments) {
      return;
    }

    resetModalState();

    setForm({
      ...emptyTreatment(),
      sessionChoice: rememberedSession[selectedPlan.id] || 'NEW',
      treatmentPlanId: selectedPlan.id
    });

    setModalOpen(true);
  };

  const openEditModal = (row: any) => {
    if (
      readOnly ||
      isBusy ||
      isCompleted(row) ||
      isExistingDocumentation(row) ||
      row.cancelled
    ) {
      return;
    }

    const scope: TreatmentAreaScope =
      row.treatmentScope || 'SPECIFIC_TOOTH';
    const teeth = getRowTeeth(row);
    const coveredIds = Array.isArray(row.coveredToothIds)
      ? row.coveredToothIds
      : [];

    setForm({
      ...emptyTreatment(),
      ...row,
      treatmentScope: scope,
      coveredToothIds: isGroupedScope(scope)
        ? teeth.length
          ? teeth.map((tooth: any) => tooth.id)
          : coveredIds
        : [],
      toothId: isGroupedScope(scope)
        ? null
        : teeth[0]?.id ?? row.toothId ?? null,
      quantity: isGroupedScope(scope)
        ? (teeth.length || coveredIds.length || (row.quantity ?? 1))
        : row.quantity ?? 1,
      price: row.price ?? 0,
      discount: row.discount ?? 0,
      status: row.status || 'PENDING',
      anesthesiaUsed: row.anesthesiaUsed ?? '',
      dose: row.dose ?? null,
      unit: row.unit ?? null,
      fillingMaterial: row.fillingMaterial ?? '',
      surface: isGroupedScope(scope) ? null : row.surface ?? null,
      sessionChoice:
        row.treatmentSessionId != null
          ? String(row.treatmentSessionId)
          : 'NEW',
      requiresRevisionReason: planExecutable,
      revisionReason: '',
      _autoPrice: false,
      _seedClinical: true
    });

    setSelectedTooth(teeth[teeth.length - 1] || {
      ...newApDentalChartTooth
    });
    setSelectedTeeth(teeth);
    setViewOnly(false);
    setModalOpen(true);
  };

  const openViewModal = (row: any) => {
    const scope: TreatmentAreaScope =
      row.treatmentScope || 'SPECIFIC_TOOTH';
    const teeth = getRowTeeth(row);

    setForm({
      ...emptyTreatment(),
      ...row,
      price: row.price ?? null,
      quantity: isExistingDocumentation(row) ? null : row.quantity ?? 1,
      discount: isExistingDocumentation(row) ? null : row.discount ?? 0,
      treatmentScope: scope,
      coveredToothIds: isGroupedScope(scope)
        ? teeth.length
          ? teeth.map((tooth: any) => tooth.id)
          : row.coveredToothIds ?? []
        : [],
      sessionChoice:
        row.treatmentSessionId != null
          ? String(row.treatmentSessionId)
          : 'NEW',
      _seedClinical: true,
      _autoPrice: false
    });

    setSelectedTooth(teeth[teeth.length - 1] || {
      ...newApDentalChartTooth
    });
    setSelectedTeeth(teeth);
    setViewOnly(true);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setModalOpen(false);
    resetModalState();
  };

  const applyToothSelection = (
    teeth: any[],
    scope: TreatmentAreaScope
  ) => {
    const unique: any[] = [];
    const seen = new Set<string>();

    teeth.forEach(tooth => {
      const chartTooth = resolveChartTooth(tooth);
      if (!chartTooth) return;

      const key = String(chartTooth.id);
      if (seen.has(key)) return;

      seen.add(key);
      unique.push(chartTooth);
    });

    setSelectedTeeth(unique);
    setSelectedTooth(unique[unique.length - 1] || {
      ...newApDentalChartTooth
    });

    setForm(previous => ({
      ...previous,
      treatmentScope: scope,
      toothId: isGroupedScope(scope) ? null : unique[0]?.id ?? null,
      coveredToothIds: isGroupedScope(scope)
        ? unique.map(tooth => tooth.id)
        : [],
      // Grouped: qty = covered tooth count. Specific Teeth: one row per tooth uses qty 1.
      quantity: isGroupedScope(scope) ? unique.length || 1 : 1
    }));
  };

  const handleTreatmentScopeChange = (scope: TreatmentAreaScope) => {
    if (
      readOnly ||
      isBusy ||
      isCompleted(form) ||
      form.cancelled ||
      form.id
    ) {
      return;
    }

    const teeth =
      scope === 'SPECIFIC_TOOTH'
        ? []
        : teethForTreatmentScope(originalChart?.teeth, scope);

    applyToothSelection(teeth, scope);
    setForm(previous => ({ ...previous, surface: null }));
  };

  const handleSelectedTooth = (tooth: any) => {
    if (
      readOnly ||
      isBusy ||
      isCompleted(form) ||
      form.cancelled ||
      isGroupedScope(form.treatmentScope) ||
      !form.id
    ) {
      return;
    }

    const chartTooth = resolveChartTooth(tooth);

    setSelectedTooth(chartTooth || { ...newApDentalChartTooth });
    setSelectedTeeth(chartTooth ? [chartTooth] : []);
    setForm(previous => ({
      ...previous,
      treatmentScope: 'SPECIFIC_TOOTH',
      coveredToothIds: [],
      toothId: chartTooth?.id ?? null
    }));
  };

  const handleSelectedTeethChange = (teeth: any[]) => {
    if (
      readOnly ||
      isBusy ||
      isCompleted(form) ||
      form.cancelled ||
      form.id
    ) {
      return;
    }

    if (isGroupedScope(form.treatmentScope)) {
      applyToothSelection(
        teethForTreatmentScope(originalChart?.teeth, form.treatmentScope),
        form.treatmentScope
      );
      return;
    }

    applyToothSelection(teeth ?? [], 'SPECIFIC_TOOTH');
  };

  useEffect(() => {
    if (!form.procedureId || form._autoPrice === false) return;

    const procedure = dentalProceduresMap[form.procedureId];
    if (!procedure) return;

    setForm(previous => ({
      ...previous,
      price: Number(procedure.price ?? 0),
      _autoPrice: true
    }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.procedureId, dentalProceduresMap]);

  const buildSavePayload = (treatment: any) => {
    const scope: TreatmentAreaScope =
      treatment.treatmentScope || 'SPECIFIC_TOOTH';
    const grouped = isGroupedScope(scope);
    const coveredIds = grouped
      ? (treatment.coveredToothIds ?? []).filter((id: any) => id != null)
      : [];

    const sessionId =
      treatment.sessionChoice && treatment.sessionChoice !== 'NEW'
        ? normalizeNumber(treatment.sessionChoice)
        : null;

    return {
      patientId: patient?.id,
      encounterId: treatment.id
        ? treatment.encounterId
        : encounter?.id,
      type: treatment.type || 'CURRENT',
      visitNumber:
        sessionId ??
        (treatment.id ? normalizeNumber(treatment.visitNumber) : null),
      cdtCodeId: treatment.cdtCodeId ?? null,
      toothId: grouped ? null : treatment.toothId ?? null,
      treatmentScope: scope,
      coveredToothIds: grouped ? coveredIds : null,
      note: treatment.note ?? null,
      surface: grouped ? null : treatment.surface ?? null,
      insurance: treatment.insurance ?? 0,
      serviceId: treatment.serviceId ?? null,
      procedureId: treatment.procedureId ?? null,
      price: Number(treatment.price ?? 0),
      quantity: grouped
        ? coveredIds.length || Number(treatment.quantity ?? 1)
        : Number(treatment.quantity ?? 1),
      discount: Number(treatment.discount ?? 0),
      anesthesiaUsed: treatment.anesthesiaUsed?.trim?.() || null,
      dose: normalizeNumber(treatment.dose),
      unit: treatment.unit || null,
      fillingMaterial: treatment.fillingMaterial?.trim?.() || null,
      treatmentPlanId: selectedPlanId,
      treatmentSessionId: sessionId,
      revisionReason: treatment.revisionReason?.trim?.() || null
    };
  };

  const getValidSelectedTeethForSave = () => {
    const scope: TreatmentAreaScope =
      form.treatmentScope || 'SPECIFIC_TOOTH';

    if (isGroupedScope(scope)) {
      return teethForTreatmentScope(originalChart?.teeth, scope);
    }

    if (form.id) {
      if (form.toothId == null) return [];

      return [
        resolveChartTooth({ id: form.toothId }) || {
          id: form.toothId
        }
      ];
    }

    const unique: any[] = [];
    const seen = new Set<string>();

    selectedTeeth.forEach(tooth => {
      const chartTooth = resolveChartTooth(tooth);
      if (!chartTooth) return;

      const key = String(chartTooth.id);
      if (seen.has(key)) return;

      seen.add(key);
      unique.push(chartTooth);
    });

    return unique;
  };

  const validateForm = (
    toothCount: number,
    scope: TreatmentAreaScope
  ) => {
    const missing: string[] = [];

    if (!form.cdtCodeId) missing.push('CDT');
    if (!form.procedureId) missing.push('Dental Procedure');

    if (toothCount < 1) {
      missing.push(isGroupedScope(scope) ? 'Treatment Area' : 'Tooth');
    }

    if (form.sessionChoice && form.sessionChoice !== 'NEW') {
      const session = normalizeNumber(form.sessionChoice);

      if (session == null || !Number.isInteger(session) || session <= 0) {
        missing.push('Session Number');
      }
    }

    if (
      form.requiresRevisionReason &&
      !String(form.revisionReason ?? '').trim()
    ) {
      missing.push('Revision Reason');
    }

    if (missing.length) {
      dispatch(
        notify({
          msg: `Required: ${missing.join(', ')}`,
          sev: 'error'
        })
      );
      return false;
    }

    const financialError = validateTreatmentFinancials(
      form.price,
      form.quantity,
      form.discount
    );
    if (financialError) {
      dispatch(
        notify({
          msg: financialError,
          sev: 'error'
        })
      );
      return false;
    }

    return true;
  };

  const saveTreatment = async () => {
    if (readOnly || isBusy || isCompleted(form) || form.cancelled) return;

    const scope: TreatmentAreaScope =
      form.treatmentScope || 'SPECIFIC_TOOTH';
    const teeth = getValidSelectedTeethForSave();

    if (!teeth.length) {
      dispatch(
        notify({
          msg: isGroupedScope(scope)
            ? 'Selected treatment area has no teeth on this chart.'
            : 'Please select at least one tooth before entering treatment details.',
          sev: 'warning'
        })
      );
      return;
    }

    if (!validateForm(teeth.length, scope)) return;

    try {
      let savedSessionId: number | null = null;

      const body = buildSavePayload({
        ...form,
        toothId: isGroupedScope(scope) ? null : teeth[0].id,
        coveredToothIds: isGroupedScope(scope)
          ? teeth.map((tooth: any) => tooth.id)
          : []
      });

      if (form.id) {
        const saved = await updatePlannedTreatment({
          id: form.id,
          body
        }).unwrap();

        savedSessionId = saved?.treatmentSessionId ?? null;
      } else if (isGroupedScope(scope) || teeth.length === 1) {
        const saved = await createPlannedTreatment(body).unwrap();
        savedSessionId = saved?.treatmentSessionId ?? null;
      } else {
        const saved = await createPlannedTreatmentsBatch({
          patientId: body.patientId,
          encounterId: body.encounterId,
          type: body.type,
          visitNumber: body.visitNumber,
          cdtCodeId: body.cdtCodeId,
          toothIds: teeth.map((tooth: any) => tooth.id),
          note: body.note,
          surface: body.surface,
          insurance: body.insurance,
          procedureId: body.procedureId,
          serviceId: body.serviceId,
          price: body.price,
          quantity: body.quantity,
          discount: body.discount,
          anesthesiaUsed: body.anesthesiaUsed,
          dose: body.dose,
          unit: body.unit,
          fillingMaterial: body.fillingMaterial,
          treatmentPlanId: body.treatmentPlanId,
          treatmentSessionId: body.treatmentSessionId,
          revisionReason: body.revisionReason
        }).unwrap();

        savedSessionId = saved?.[0]?.treatmentSessionId ?? null;
      }

      if (selectedPlanId && savedSessionId) {
        setRememberedSession(previous => ({
          ...previous,
          [selectedPlanId]: String(savedSessionId)
        }));
      }

      refreshPlans();

      dispatch(
        notify({
          msg:
            !form.id && !isGroupedScope(scope) && teeth.length > 1
              ? `Created ${teeth.length} planned treatments`
              : 'Treatment saved successfully',
          sev: 'success'
        })
      );

      setModalOpen(false);
      resetModalState();
    } catch (error: any) {
      showError(error, 'Save Failed');
    }
  };

  const handleCancel = async () => {
    if (readOnly || isBusy) return;

    if (!rowPendingAction?.id) {
      setConfirmCancelOpen(false);
      return;
    }

    if (
      isCompleted(rowPendingAction) ||
      isExistingDocumentation(rowPendingAction) ||
      rowPendingAction.cancelled
    ) {
      return;
    }

    try {
      await cancelPlannedTreatment({
        id: rowPendingAction.id,
        body: {
          cancellationReason: cancelForm.cancellationReason || ''
        }
      }).unwrap();

      refreshPlans();

      dispatch(
        notify({
          msg: 'Treatment cancelled successfully',
          sev: 'success'
        })
      );

      setConfirmCancelOpen(false);
      setCancelForm({ cancellationReason: '' });
      setRowPendingAction(null);
    } catch (error: any) {
      showError(error, 'Cancel Failed');
      setConfirmCancelOpen(false);
    }
  };

  const handleStart = async (row: any) => {
    if (
      readOnly ||
      isBusy ||
      !row?.id ||
      isExistingDocumentation(row) ||
      isCompleted(row) ||
      isInProgress(row) ||
      row.cancelled
    ) {
      return;
    }

    try {
      await startPlannedTreatment({
        id: row.id,
        executionEncounterId: encounter?.id
      }).unwrap();

      refreshPlans();
      dispatch(
        notify({
          msg: 'Treatment marked in progress',
          sev: 'success'
        })
      );
    } catch (error: any) {
      showError(error, 'Start Failed');
    }
  };

  const handleComplete = async (row: any) => {
    if (
      readOnly ||
      isBusy ||
      !row?.id ||
      isExistingDocumentation(row) ||
      isCompleted(row) ||
      row.cancelled
    ) {
      return;
    }

    if (!row.procedureId && !row.serviceId) {
      dispatch(
        notify({
          msg: 'Dental procedure is required before completing this treatment.',
          sev: 'warning'
        })
      );
      return;
    }

    setCompletingId(row.id);

    try {
      await completePlannedTreatment({
        id: row.id,
        executionEncounterId: encounter?.id
      }).unwrap();

      refreshPlans();

      dispatch(
        patientServicesAndProductsService.util.invalidateTags([
          'PatientServiceAndProduct'
        ])
      );

      dispatch(
        notify({
          msg: 'Treatment completed',
          sev: 'success'
        })
      );
    } catch (error: any) {
      showError(error, 'Complete Failed');
    } finally {
      setCompletingId(null);
    }
  };

  const sessionOptions = useMemo(() => {
    const sessions = [...(planSessionsQuery.data ?? [])].sort(
      (a, b) => a.sessionNumber - b.sessionNumber
    );

    const options = sessions.map(session => ({
      key: String(session.id),
      lovDisplayVale: `Session ${session.sessionNumber}`
    }));

    if (
      form.treatmentSessionId != null &&
      !options.some(
        option => option.key === String(form.treatmentSessionId)
      )
    ) {
      options.push({
        key: String(form.treatmentSessionId),
        lovDisplayVale: `Session ${
          form.visitNumber ?? form.treatmentSessionId
        }`
      });
    }

    return viewOnly || form.id
      ? options
      : [{ key: 'NEW', lovDisplayVale: 'New Session' }, ...options];
  }, [
    planSessionsQuery.data,
    form.treatmentSessionId,
    form.visitNumber,
    form.id,
    viewOnly
  ]);

  const openPlan = (plan: any) => {
    setSelectedPlanId(plan.id);
    setHistoryOpen(false);
  };

  const closeDetails = () => {
    setSelectedPlanId(null);
    setHistoryOpen(false);
  };

  const changePlansTab = (key: string) => {
    if (key === plansTab) return;

    setPlansTab(key);
    setSelectedPlanId(null);
    setHistoryOpen(false);
  };

  const openNewPlan = () => {
    if (readOnly || isBusy) return;

    setPlanForm({
      title: '',
      notes: '',
      practitionerId: encounter?.practitionerId ?? null
    });
    setPlanModalOpen(true);
  };

  const openEditPlan = () => {
    if (readOnly || isBusy || !selectedPlan || !planEditableHeader) {
      return;
    }

    setPlanForm({
      id: selectedPlan.id,
      title: selectedPlan.title || '',
      notes: selectedPlan.notes || '',
      practitionerId: selectedPlan.practitionerId ?? null
    });
    setPlanModalOpen(true);
  };

  const savePlanHeader = async () => {
    if (readOnly || headerSaving) return;

    const title = planForm.title?.trim?.() || '';

    if (!title) {
      dispatch(notify({ msg: 'Title is required', sev: 'error' }));
      return;
    }

    if (!patient?.id || !encounter?.id) return;

    try {
      const body = {
        patientId: patient.id,
        originEncounterId: planForm.id
          ? selectedPlan?.originEncounterId || encounter.id
          : encounter.id,
        title,
        notes: planForm.notes?.trim?.() || null,
        practitionerId: planForm.practitionerId || null
      };

      const saved = planForm.id
        ? await updateTreatmentPlanHeader({
            id: planForm.id,
            body
          }).unwrap()
        : await createTreatmentPlan(body).unwrap();

      setPlanModalOpen(false);
      setPlansTab('1');
      setSelectedPlanId(saved.id);
      refreshPlans();

      dispatch(
        notify({
          msg: 'Treatment plan saved',
          sev: 'success'
        })
      );
    } catch (error: any) {
      showError(error, 'Could not save the treatment plan');
    }
  };

  const runPlanAction = async (
    action: () => Promise<any>,
    success: string
  ): Promise<boolean> => {
    if (readOnly || isBusy) return false;

    setPlanActionBusy(true);

    try {
      await action();
      refreshPlans();
      dispatch(notify({ msg: success, sev: 'success' }));
      return true;
    } catch (error: any) {
      showError(error, 'Plan update failed');
      return false;
    } finally {
      setPlanActionBusy(false);
    }
  };

  const askPlanReason = (action: PlanReasonAction) => {
    if (readOnly || isBusy) return;

    setPlanReasonAction(action);
    setPlanReason({ reason: '' });
    setPlanReasonOpen(true);
  };

  const submitPlanReason = async () => {
    if (!selectedPlan || !planReason.reason.trim()) return;

    const id = selectedPlan.id;
    const reason = planReason.reason.trim();
    let succeeded = false;

    if (planReasonAction === 'hold') {
      succeeded = await runPlanAction(
        () => holdTreatmentPlan({ id, reason }).unwrap(),
        'Plan placed on hold'
      );
    } else if (planReasonAction === 'cancel') {
      succeeded = await runPlanAction(
        () => cancelTreatmentPlan({ id, reason }).unwrap(),
        'Plan cancelled'
      );
    } else if (planReasonAction === 'return-draft') {
      succeeded = await runPlanAction(
        () => returnTreatmentPlanToDraft({ id, reason }).unwrap(),
        'Plan returned to draft'
      );
    }

    if (succeeded) {
      setPlanReasonOpen(false);
      setPlanReason({ reason: '' });
      setPlanReasonAction(null);
    }
  };


  return (
    <div className="treatment-plan-tab" dir={direction}>
      <TreatmentPlanModal
        open={modalOpen}
        onClose={closeModal}
        onSave={saveTreatment}
        form={form}
        setForm={setForm}
        selectedTooth={selectedTooth}
        selectedTeeth={selectedTeeth}
        onSelectTooth={handleSelectedTooth}
        onSelectedTeethChange={handleSelectedTeethChange}
        onTreatmentScopeChange={handleTreatmentScopeChange}
        originalChart={originalChart}
        readOnly={readOnly}
        isBusy={isBusy}
        isSaving={isSaving}
        cdtList={cdtListResponse.data?.data ?? []}
        cdtMap={cdtMap}
        cdtLoading={cdtListResponse.isLoading}
        dentalServicesList={serviceList?.data ?? []}
        dentalServicesMap={dentalServicesMap}
        servicesLoading={servicesLoading}
        dentalProceduresList={procedureList?.data ?? []}
        dentalProceduresMap={dentalProceduresMap}
        proceduresLoading={proceduresLoading}
        dentalActionsList={dentalActionsRes.data?.data ?? []}
        dentalActionsMap={dentalActionsMap}
        treatmentPlanTrigger={treatmentPlanTrigger}
        setTreatmentPlanTrigger={setTreatmentPlanTrigger}
        viewOnly={viewOnly}
        sessionOptions={sessionOptions}
      />

      <ProposeTreatmentChartModal
        open={proposeChartOpen}
        onClose={() => setProposeChartOpen(false)}
        plan={selectedPlan}
        treatments={planTreatments}
        treatmentCount={planTreatments.length}
        originalChart={originalChart}
        teethById={teethById}
        cdtList={cdtListResponse.data?.data ?? []}
        cdtMap={cdtMap}
        cdtLoading={cdtListResponse.isLoading}
        dentalProceduresList={procedureList?.data ?? []}
        dentalProceduresMap={dentalProceduresMap}
        proceduresLoading={proceduresLoading}
        dentalServicesList={serviceList?.data ?? []}
        dentalServicesMap={dentalServicesMap}
        servicesLoading={servicesLoading}
        dentalActionsList={dentalActionsRes.data?.data ?? []}
        dentalActionsMap={dentalActionsMap}
        actionsDisabled={readOnly || isBusy}
        onPrintPlan={() => setPrintPlan(selectedPlan)}
        onStatusHistory={() => setHistoryOpen(true)}
        onEditPlan={openEditPlan}
        onPropose={() => {
          if (!selectedPlan) return;

          return runPlanAction(
            () => proposeTreatmentPlan(selectedPlan.id).unwrap(),
            'Plan proposed'
          );
        }}
        onAccept={() => {
          if (!selectedPlan) return;

          return runPlanAction(
            () => acceptTreatmentPlan(selectedPlan.id).unwrap(),
            'Plan accepted'
          );
        }}
        onReturnToDraft={() => askPlanReason('return-draft')}
        onHold={() => askPlanReason('hold')}
        onResume={() => {
          if (!selectedPlan) return;

          return runPlanAction(
            () => resumeTreatmentPlan(selectedPlan.id).unwrap(),
            'Plan resumed'
          );
        }}
        onCancelPlan={() => askPlanReason('cancel')}
      />

      <CancellationModal
        title="Cancel Planned Treatment"
        fieldLabel="Cancellation Reason"
        open={confirmCancelOpen}
        setOpen={setConfirmCancelOpen}
        object={cancelForm}
        setObject={setCancelForm}
        handleCancle={handleCancel}
        fieldName="cancellationReason"
        required={true}
      />

      <CancellationModal
        title={
          planReasonAction === 'hold'
            ? 'Place Plan On Hold'
            : planReasonAction === 'return-draft'
              ? 'Return Plan To Draft'
              : 'Cancel Treatment Plan'
        }
        fieldLabel="Reason"
        open={planReasonOpen}
        setOpen={setPlanReasonOpen}
        object={planReason}
        setObject={setPlanReason}
        handleCancle={submitPlanReason}
        fieldName="reason"
        required={true}
      />

      <TreatmentPlanHeaderModal
        open={planModalOpen}
        setOpen={setPlanModalOpen}
        form={planForm}
        setForm={setPlanForm}
        practitioners={practitionerOptions}
        saving={headerSaving}
        onSave={savePlanHeader}
      />

      <MyModal
        open={historyOpen}
        setOpen={setHistoryOpen}
        title={<Translate>Plan & Treatment History</Translate>}
        hideActionBtn
        cancelButtonLabel="Close"
        size="860px"
        bodyheight="auto"
        content={
          <div className="tp-status-history">
            <h4 className="tp-history-section-title">
              <Translate>Plan Status History</Translate>
            </h4>
            {statusLogQuery.isError ? (
              <div className="tp-inline-message">
                <Translate>Could not load status history.</Translate>
                <MyButton onClick={() => statusLogQuery.refetch()}>
                  Retry
                </MyButton>
              </div>
            ) : (
              <div className="tp-table-scroll">
                <MyTable
                  data={statusLogQuery.data ?? []}
                  loading={statusLogQuery.isFetching}
                  height={220}
                  columns={[
                    {
                      key: 'previousStatus',
                      title: 'From',
                      width: 140,
                      render: (row: any) => (
                        <PlanStatus status={row.previousStatus} />
                      )
                    },
                    {
                      key: 'newStatus',
                      title: 'To',
                      width: 140,
                      render: (row: any) => (
                        <PlanStatus status={row.newStatus} />
                      )
                    },
                    {
                      key: 'changedBy',
                      title: 'Changed By',
                      width: 140,
                      render: (row: any) => (
                        <span>{row.changedBy || EMPTY_VALUE}</span>
                      )
                    },
                    {
                      key: 'changedAt',
                      title: 'Changed At',
                      width: 170,
                      render: (row: any) => (
                        <span>{formatDate(row.changedAt, true)}</span>
                      )
                    },
                    {
                      key: 'reason',
                      title: 'Reason',
                      width: 200,
                      render: (row: any) => (
                        <span className="tp-history-reason">
                          {row.reason || EMPTY_VALUE}
                        </span>
                      )
                    }
                  ]}
                />
              </div>
            )}

            <h4 className="tp-history-section-title">
              <Translate>Treatment History</Translate>
            </h4>
            {treatmentHistoryQuery.isError ? (
              <div className="tp-inline-message">
                <Translate>Could not load treatment history.</Translate>
                <MyButton onClick={() => treatmentHistoryQuery.refetch()}>
                  Retry
                </MyButton>
              </div>
            ) : (
              <div className="tp-table-scroll">
                <MyTable
                  data={treatmentHistoryQuery.data ?? []}
                  loading={treatmentHistoryQuery.isFetching}
                  height={260}
                  columns={[
                    {
                      key: 'toothLabel',
                      title: 'Tooth / Treatment',
                      width: 160,
                      render: (row: any) => (
                        <span>
                          {row.toothLabel ||
                            (row.toothId != null
                              ? `#${row.toothId}`
                              : EMPTY_VALUE)}
                          {row.plannedTreatmentId != null
                            ? ` · #${row.plannedTreatmentId}`
                            : ''}
                        </span>
                      )
                    },
                    {
                      key: 'action',
                      title: 'Action',
                      width: 130,
                      render: (row: any) => {
                        const labels: Record<string, string> = {
                          CREATED: 'Created',
                          IN_PROGRESS: 'In Progress',
                          COMPLETED: 'Completed',
                          CANCELLED: 'Cancelled'
                        };
                        return (
                          <span>{labels[row.action] || row.action || EMPTY_VALUE}</span>
                        );
                      }
                    },
                    {
                      key: 'changedBy',
                      title: 'User',
                      width: 140,
                      render: (row: any) => (
                        <span>{row.changedBy || EMPTY_VALUE}</span>
                      )
                    },
                    {
                      key: 'changedAt',
                      title: 'Timestamp',
                      width: 180,
                      render: (row: any) => (
                        <span>{formatDate(row.changedAt, true)}</span>
                      )
                    }
                  ]}
                />
              </div>
            )}
          </div>
        }
      />

      <PrintTreatmentPlanModal
        open={Boolean(printPlan)}
        plan={printPlan}
        patient={patient}
        direction={direction}
        onClose={() => setPrintPlan(null)}
      />

      <MyTab
        className="tp-plans-tabs"
        activeTab={plansTab}
        setActiveTab={changePlansTab}
        lazy
        data={[
          {
            title: `Active Plans`,
            content: (
              <ActivePlans
                plans={activePlans}
                plansLoading={plansQuery.isLoading}
                plansError={plansQuery.isError}
                onRetryPlans={() => plansQuery.refetch()}
                selectedPlan={selectedPlan}
                practitioners={practitioners}
                onViewPlan={openPlan}
                onOpenChart={() => setProposeChartOpen(true)}
                onCloseDetails={closeDetails}
                onNewPlan={openNewPlan}
                newPlanDisabled={
                  readOnly || isBusy || !patient?.id || !encounter?.id
                }
                actionsDisabled={readOnly || isBusy}
                planTreatments={planTreatments}
                existingDocumentation={existingDocumentation}
                treatmentsFetching={planTreatmentsQuery.isFetching}
                existingFetching={treatmentPlanDataResponse.isFetching}
                treatmentsError={
                  Boolean(selectedPlan) && planTreatmentsQuery.isError
                }
                onRetryTreatments={() => planTreatmentsQuery.refetch()}
                canAddTreatment={planAcceptsTreatments}
                canExecute={planExecutable}
                completingId={completingId}
                teethById={teethById}
                cdtMap={cdtMap}
                dentalServicesMap={dentalServicesMap}
                dentalProceduresMap={dentalProceduresMap}
                onAddTreatment={openAddModal}
                onViewTreatment={openViewModal}
                onEditTreatment={openEditModal}
                onStartTreatment={handleStart}
                onCompleteTreatment={handleComplete}
                onCancelTreatment={row => {
                  setRowPendingAction(row);
                  setCancelForm({ cancellationReason: '' });
                  setConfirmCancelOpen(true);
                }}
              />
            )
          },
          {
            title: `History`,
            content: (
              <TreatmentPlanHistory
                plans={historyPlans}
                plansLoading={plansQuery.isLoading}
                plansError={plansQuery.isError}
                onRetryPlans={() => plansQuery.refetch()}
                selectedPlan={selectedPlan}
                practitioners={practitioners}
                onViewPlan={openPlan}
                onOpenChart={() => setProposeChartOpen(true)}
                historyStatus={historyStatus}
                onHistoryStatusChange={setHistoryStatus}
                onCloseDetails={closeDetails}
                onNewPlan={openNewPlan}
                newPlanDisabled={
                  readOnly || isBusy || !patient?.id || !encounter?.id
                }
                actionsDisabled={readOnly || isBusy}
                planTreatments={planTreatments}
                treatmentsFetching={planTreatmentsQuery.isFetching}
                treatmentsError={
                  Boolean(selectedPlan) && planTreatmentsQuery.isError
                }
                onRetryTreatments={() => planTreatmentsQuery.refetch()}
                canAddTreatment={planAcceptsTreatments}
                canExecute={planExecutable}
                completingId={completingId}
                teethById={teethById}
                cdtMap={cdtMap}
                dentalServicesMap={dentalServicesMap}
                dentalProceduresMap={dentalProceduresMap}
                onAddTreatment={openAddModal}
                onViewTreatment={openViewModal}
                onEditTreatment={openEditModal}
                onStartTreatment={handleStart}
                onCompleteTreatment={handleComplete}
                onCancelTreatment={row => {
                  setRowPendingAction(row);
                  setCancelForm({ cancellationReason: '' });
                  setConfirmCancelOpen(true);
                }}
              />
            )
          }
        ]}
      />
    </div>
  );
};

export default TreatmentPlanTab;
