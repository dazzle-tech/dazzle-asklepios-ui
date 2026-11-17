import React, { useEffect, useMemo, useState } from 'react';
import { Form, Loader } from 'rsuite';

import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import Tooth from '@/components/NewDentalChart/Tooth/Tooth';
import AdultOcclusal from '@/components/NewDentalChart/Tooth/AdultOcclusal';
import { getSurfaceStates } from '@/components/NewDentalChart/Tooth/surfaceStates';
import {
  buildDentalActionOptions,
  renderDentalActionMenuItem
} from '@/components/NewDentalChart/DentalActionOption/dentalActionOptions';
import {
  isPrimaryTooth,
  isUpperArchTooth,
  toothDisplayLabel,
  treatmentScopeLabel
} from '@/utils/toothNumber';

import { useGetExistingChartByEncounterQuery } from '@/services/dental/dentalChartService';

import { SURFACE_LABELS } from './TreatmentPlanModal';
import { EMPTY_VALUE, isGroupedScope } from './treatmentPlanShared';

import './CompleteTreatmentModal.less';

interface CompleteTreatmentModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  treatment?: any;
  dentalActions: any[];
  dentalActionsMap: Record<number, any>;
  dentalProceduresMap: Record<number, any>;
  dentalServicesMap: Record<number, any>;
  cdtMap: Record<number, any>;
  executionChart?: any;
  saving: boolean;
  onConfirm: (dentalActionId: number) => void | Promise<void>;
}

const CompleteTreatmentModal = ({
  open,
  setOpen,
  treatment,
  dentalActions,
  dentalActionsMap,
  dentalProceduresMap,
  dentalServicesMap,
  cdtMap,
  executionChart,
  saving,
  onConfirm
}: CompleteTreatmentModalProps) => {
  const [record, setRecord] = useState<any>({ dentalActionId: null });
  const treatmentId = treatment?.id;

  useEffect(() => {
    setRecord({ dentalActionId: null });
  }, [open, treatmentId]);

  // Same active list, ordering and Condition/Treatment metadata as the Chart's Action selector.
  const actionOptions = useMemo(
    () =>
      buildDentalActionOptions(
        dentalActions.filter(action => action.type === 'TREATMENT'),
        record.dentalActionId
      ),
    [dentalActions, record.dentalActionId]
  );

  const numberingSystem = executionChart?.numberingSystem ?? 'UNIVERSAL';
  const numberingLabels = executionChart?.numberingLabels ?? null;

  const grouped = isGroupedScope(treatment?.treatmentScope);

  const planningIsExecution =
    treatment?.encounterId != null &&
    String(treatment.encounterId) === String(executionChart?.encounterId);

  const planningChartQuery = useGetExistingChartByEncounterQuery(
    treatment?.encounterId,
    { skip: !open || treatment?.encounterId == null || planningIsExecution }
  );

  const planningChart = planningIsExecution
    ? executionChart
    : planningChartQuery.currentData ?? null;

  // Planning tooth id -> same patient, exact tooth number on the execution chart.
  const resolveExecutionTooth = (toothId: any) => {
    if (
      toothId == null ||
      !planningChart ||
      !executionChart ||
      String(planningChart.patientId) !== String(executionChart.patientId) ||
      (treatment?.patientId != null &&
        String(treatment.patientId) !== String(executionChart.patientId))
    ) {
      return null;
    }

    const planned = (planningChart.teeth ?? []).find(
      (tooth: any) => String(tooth.id) === String(toothId)
    );
    if (!planned?.toothNumber) return null;

    const matches = (executionChart.teeth ?? []).filter(
      (tooth: any) => tooth.toothNumber === planned.toothNumber
    );
    return matches.length === 1 ? matches[0] : null;
  };

  const singleTooth = grouped ? null : resolveExecutionTooth(treatment?.toothId);

  const coveredTeeth = grouped
    ? (treatment?.coveredToothIds ?? []).map((id: number) => ({
        id,
        tooth: resolveExecutionTooth(id)
      }))
    : [];

  const procedureName =
    (treatment?.procedureId != null
      ? dentalProceduresMap?.[treatment.procedureId]?.name
      : null) ||
    (treatment?.serviceId != null
      ? dentalServicesMap?.[treatment.serviceId]?.name
      : null) ||
    EMPTY_VALUE;

  const cdt =
    treatment?.cdtCodeId != null ? cdtMap?.[treatment.cdtCodeId] : null;

  const labelFor = (tooth: any) =>
    toothDisplayLabel(tooth.toothNumber, numberingSystem, numberingLabels);

  const renderSingleTooth = () => {
    if (!singleTooth?.toothNumber) {
      return (
        <p className="ctm-tooth-missing">
          <Translate>Tooth could not be found on the chart.</Translate>
        </p>
      );
    }

    const surfaceStates = getSurfaceStates(singleTooth, dentalActionsMap);
    const hasCondition = Object.values(surfaceStates).includes('condition');
    const hasTreatment = Object.values(surfaceStates).includes('treatment');
    const upper = isUpperArchTooth(singleTooth.toothNumber);
    const outer = (
      <div className="ctm-tooth-outer">
        <Tooth
          chartTooth={singleTooth}
          hasCondition={hasCondition}
          hasTreatment={hasTreatment}
          flipVertical={upper && isPrimaryTooth(singleTooth.toothNumber)}
        />
      </div>
    );
    const occlusal = (
      <div className="ctm-tooth-occlusal">
        <AdultOcclusal
          toothNumber={singleTooth.toothNumber}
          surfaceStates={surfaceStates}
        />
      </div>
    );

    return (
      <>
        <div
          className="ctm-tooth-art"
          key={`${singleTooth.id}-${singleTooth.toothNumber}`}
        >
          {upper ? outer : occlusal}
          {upper ? occlusal : outer}
        </div>
        <span className="ctm-tooth-label">{labelFor(singleTooth)}</span>
      </>
    );
  };

  const renderGroupedTeeth = () => {
    const resolved = coveredTeeth.filter((item: any) => item.tooth);
    const unresolved = coveredTeeth.length - resolved.length;

    return (
      <>
        <span className="ctm-tooth-scope">
          <Translate>{treatmentScopeLabel(treatment?.treatmentScope)}</Translate>
        </span>
        <div className="ctm-tooth-chips">
          {resolved.map((item: any) => (
            <span key={item.id} className="ctm-tooth-chip">
              {labelFor(item.tooth)}
            </span>
          ))}
        </div>
        {unresolved > 0 && (
          <p className="ctm-tooth-missing">
            {unresolved} <Translate>teeth could not be found on the chart.</Translate>
          </p>
        )}
      </>
    );
  };

  const resolving =
    !planningIsExecution &&
    (planningChartQuery.isFetching || planningChartQuery.isLoading);
  const resolveFailed = !planningIsExecution && planningChartQuery.isError;

  const renderToothCard = () => {
    if (resolving) {
      return (
        <div className="ctm-tooth-state">
          <Loader content="Loading tooth..." />
        </div>
      );
    }

    if (resolveFailed) {
      return (
        <div className="ctm-tooth-state">
          <p className="ctm-tooth-missing">
            <Translate>The tooth could not be loaded.</Translate>
          </p>
          <MyButton onClick={() => planningChartQuery.refetch()}>
            <Translate>Retry</Translate>
          </MyButton>
        </div>
      );
    }

    return grouped ? renderGroupedTeeth() : renderSingleTooth();
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={<Translate>Complete Treatment</Translate>}
      size="640px"
      bodyheight="auto"
      actionButtonLabel="Complete"
      actionButtonLoading={saving}
      isDisabledActionBtn={!record.dentalActionId || saving}
      actionButtonFunction={() => onConfirm(Number(record.dentalActionId))}
      content={
        <div className="ctm">
          <div className="ctm-tooth-card">
            {renderToothCard()}
          </div>

          <div className="ctm-details">
            <dl className="ctm-summary">
              <div className="ctm-summary-row">
                <dt>
                  <Translate>Dental Procedure</Translate>
                </dt>
                <dd>{procedureName}</dd>
              </div>
              <div className="ctm-summary-row">
                <dt>
                  <Translate>Surface</Translate>
                </dt>
                <dd>{SURFACE_LABELS[treatment?.surface] ?? EMPTY_VALUE}</dd>
              </div>
              {cdt && (
                <div className="ctm-summary-row">
                  <dt>CDT</dt>
                  <dd>
                    {cdt.code} / {cdt.description}
                  </dd>
                </div>
              )}
            </dl>

            <Form fluid className="ctm-action">
              <MyInput
                width="100%"
                fieldLabel="Action"
                fieldName="dentalActionId"
                fieldType="select"
                required
                record={record}
                setRecord={setRecord}
                placeholder="Select Action From List"
                selectData={actionOptions}
                selectDataLabel="description"
                selectDataValue="id"
                renderMenuItem={renderDentalActionMenuItem}
              />
            </Form>
          </div>
        </div>
      }
    />
  );
};

export default CompleteTreatmentModal;
