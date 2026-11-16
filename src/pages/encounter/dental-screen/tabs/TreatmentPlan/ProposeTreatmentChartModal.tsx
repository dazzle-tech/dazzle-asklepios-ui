import React, { useEffect, useMemo, useState } from 'react';

import TreatmentPlanModal from './TreatmentPlanModal';
import PlanActionToolbar from './PlanActionToolbar';
import {
  isExistingDocumentation,
  isGroupedScope
} from './treatmentPlanShared';
import { toothDisplayLabel } from '@/utils/toothNumber';
import { newApDentalChartTooth } from '@/types/model-types-constructor';
import type { TreatmentAreaScope } from '@/utils/toothNumber';

type ProposeTreatmentChartModalProps = {
  open: boolean;
  onClose: () => void;
  plan: any | null;
  treatments: any[];
  /** Active planned treatment count for Propose/Accept enablement. */
  treatmentCount?: number;
  originalChart: any;
  teethById: Record<number, any>;
  cdtList: any[];
  cdtMap: Record<number, any>;
  cdtLoading?: boolean;
  dentalProceduresList: any[];
  dentalProceduresMap: Record<number, any>;
  proceduresLoading?: boolean;
  dentalServicesList: any[];
  dentalServicesMap: Record<number, any>;
  servicesLoading?: boolean;
  dentalActionsList: any[];
  dentalActionsMap: Record<number, any>;
  actionsDisabled?: boolean;
  onPrintPlan: () => void;
  onStatusHistory: () => void;
  onEditPlan: () => void;
  onPropose: () => void;
  onAccept: () => void;
  onReturnToDraft: () => void;
  onHold: () => void;
  onResume: () => void;
  onCancelPlan: () => void;
};

const treatmentChoiceLabel = (
  row: any,
  cdtMap: Record<number, any>,
  dentalProceduresMap: Record<number, any>,
  dentalServicesMap: Record<number, any>
) => {
  const cdt = row?.cdtCodeId != null ? cdtMap[row.cdtCodeId] : null;
  const procedure =
    (row?.procedureId != null
      ? dentalProceduresMap[row.procedureId]?.name
      : null) ||
    (row?.serviceId != null ? dentalServicesMap[row.serviceId]?.name : null);

  const cdtPart = cdt
    ? `${cdt.code || ''} ${cdt.description || ''}`.trim()
    : row?.dentalActionDescription || 'Treatment';

  return [cdtPart, procedure].filter(Boolean).join(' · ');
};

const toViewForm = (row: any, tooth: any) => {
  const scope: TreatmentAreaScope = row.treatmentScope || 'SPECIFIC_TOOTH';
  const coveredIds = Array.isArray(row.coveredToothIds)
    ? row.coveredToothIds
    : [];

  return {
    ...row,
    patientId: row.patientId,
    encounterId: row.encounterId,
    treatmentScope: scope,
    coveredToothIds: isGroupedScope(scope) ? coveredIds : [],
    toothId: isGroupedScope(scope) ? null : tooth?.id ?? row.toothId ?? null,
    price: row.price ?? null,
    quantity: isExistingDocumentation(row) ? null : row.quantity ?? 1,
    discount: isExistingDocumentation(row) ? null : row.discount ?? 0,
    status: row.status || 'PENDING',
    anesthesiaUsed: row.anesthesiaUsed ?? '',
    dose: row.dose ?? null,
    unit: row.unit ?? null,
    fillingMaterial: row.fillingMaterial ?? '',
    surface: isGroupedScope(scope) ? null : row.surface ?? null,
    sessionChoice:
      row.treatmentSessionId != null ? String(row.treatmentSessionId) : 'NEW',
    visitNumber: row.visitNumber ?? null,
    _autoPrice: false,
    _seedClinical: true
  };
};

const ProposeTreatmentChartModal: React.FC<ProposeTreatmentChartModalProps> = ({
  open,
  onClose,
  plan,
  treatments,
  treatmentCount,
  originalChart,
  teethById,
  cdtList,
  cdtMap,
  cdtLoading = false,
  dentalProceduresList,
  dentalProceduresMap,
  proceduresLoading = false,
  dentalServicesList,
  dentalServicesMap,
  servicesLoading = false,
  dentalActionsList,
  dentalActionsMap,
  actionsDisabled = false,
  onPrintPlan,
  onStatusHistory,
  onEditPlan,
  onPropose,
  onAccept,
  onReturnToDraft,
  onHold,
  onResume,
  onCancelPlan
}) => {
  const [selectedTooth, setSelectedTooth] = useState<any>(null);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<
    string | number | null
  >(null);
  const [form, setForm] = useState<any>({});
  const [chartTrigger, setChartTrigger] = useState(0);

  const activeTreatments = useMemo(
    () =>
      (treatments ?? []).filter(
        (row: any) => !row?.cancelled && !row?._sessionHeader
      ),
    [treatments]
  );

  const highlightToothIds = useMemo(() => {
    const ids: string[] = [];
    const seen = new Set<string>();

    activeTreatments.forEach((row: any) => {
      const push = (id: any) => {
        if (id == null) return;
        const key = String(id);
        if (seen.has(key)) return;
        seen.add(key);
        ids.push(key);
      };

      push(row.toothId);
      (row.coveredToothIds ?? []).forEach(push);
    });

    return ids;
  }, [activeTreatments]);

  const resolveTooth = (id: string | number) =>
    teethById[Number(id)] ||
    (originalChart?.teeth ?? []).find(
      (item: any) => String(item.id) === String(id)
    ) ||
    null;

  const treatmentsForTooth = useMemo(() => {
    if (!selectedTooth?.id) return [];

    const toothId = String(selectedTooth.id);

    return activeTreatments.filter((row: any) => {
      if (row.toothId != null && String(row.toothId) === toothId) return true;
      return (row.coveredToothIds ?? []).some(
        (id: any) => id != null && String(id) === toothId
      );
    });
  }, [activeTreatments, selectedTooth]);

  const treatmentChoices = useMemo(
    () =>
      treatmentsForTooth.map((row: any) => ({
        id: row.id,
        label: treatmentChoiceLabel(
          row,
          cdtMap,
          dentalProceduresMap,
          dentalServicesMap
        )
      })),
    [treatmentsForTooth, cdtMap, dentalProceduresMap, dentalServicesMap]
  );

  const applyTreatment = (row: any, tooth: any) => {
    setSelectedTreatmentId(row?.id ?? null);
    setForm(toViewForm(row || {}, tooth));
  };

  const selectTooth = (tooth: any) => {
    if (!tooth?.id) return;

    setSelectedTooth(tooth);

    const rows = activeTreatments.filter((row: any) => {
      const toothId = String(tooth.id);
      if (row.toothId != null && String(row.toothId) === toothId) return true;
      return (row.coveredToothIds ?? []).some(
        (id: any) => id != null && String(id) === toothId
      );
    });

    applyTreatment(rows[0], tooth);
  };

  useEffect(() => {
    if (!open) {
      setSelectedTooth(null);
      setSelectedTreatmentId(null);
      setForm({});
      return;
    }

    const firstId = highlightToothIds[0];
    if (!firstId) {
      setSelectedTooth(null);
      setSelectedTreatmentId(null);
      setForm({});
      return;
    }

    const tooth = resolveTooth(firstId) || {
      ...newApDentalChartTooth,
      id: Number(firstId)
    };

    selectTooth(tooth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, highlightToothIds.join('|')]);

  const detailsToothLabel = selectedTooth?.toothNumber
    ? `Tooth ${toothDisplayLabel(selectedTooth.toothNumber)}`
    : null;

  const modalTitle = plan
    ? [plan.planNumber, plan.title].filter(Boolean).join(' — ') ||
      'Treatment Plan Chart'
    : 'Treatment Plan Chart';

  return (
    <TreatmentPlanModal
      open={open}
      onClose={onClose}
      onSave={() => {}}
      form={form}
      setForm={setForm}
      selectedTooth={selectedTooth}
      selectedTeeth={selectedTooth ? [selectedTooth] : []}
      onSelectTooth={selectTooth}
      onSelectedTeethChange={() => {}}
      onTreatmentScopeChange={() => {}}
      originalChart={originalChart}
      readOnly
      isBusy={false}
      isSaving={false}
      cdtList={cdtList}
      cdtMap={cdtMap}
      cdtLoading={cdtLoading}
      dentalServicesList={dentalServicesList}
      dentalServicesMap={dentalServicesMap}
      servicesLoading={servicesLoading}
      dentalProceduresList={dentalProceduresList}
      dentalProceduresMap={dentalProceduresMap}
      proceduresLoading={proceduresLoading}
      dentalActionsList={dentalActionsList}
      dentalActionsMap={dentalActionsMap}
      treatmentPlanTrigger={chartTrigger}
      setTreatmentPlanTrigger={setChartTrigger}
      viewOnly
      allowChartSelection
      highlightToothIds={highlightToothIds}
      allowedToothIds={highlightToothIds}
      detailsToothLabel={detailsToothLabel}
      treatmentChoices={treatmentChoices}
      selectedTreatmentId={selectedTreatmentId}
      onSelectTreatment={id => {
        const row = treatmentsForTooth.find(
          (item: any) => String(item.id) === String(id)
        );
        if (row) applyTreatment(row, selectedTooth);
      }}
      modalTitle={modalTitle}
      footerButtons={
        plan ? (
          <PlanActionToolbar
            className="tpm-plan-footer-actions"
            plan={plan}
            treatmentCount={
              treatmentCount != null
                ? treatmentCount
                : activeTreatments.length
            }
            actionsDisabled={actionsDisabled}
            onPrintPlan={onPrintPlan}
            onStatusHistory={onStatusHistory}
            onEditPlan={onEditPlan}
            onPropose={onPropose}
            onAccept={onAccept}
            onReturnToDraft={onReturnToDraft}
            onHold={onHold}
            onResume={onResume}
            onCancelPlan={onCancelPlan}
          />
        ) : null
      }
    />
  );
};

export default ProposeTreatmentChartModal;
