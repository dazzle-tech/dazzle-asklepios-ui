import React, { useEffect, useRef } from 'react';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Button, Form } from 'rsuite';

import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import DentalChart from '@/components/NewDentalChart';

import {
  toothDisplayLabel,
  teethForTreatmentScope,
  treatmentScopeLabel,
  type TreatmentAreaScope
} from '@/utils/toothNumber';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { formatLineNet, formatMoney, lineNetTotal } from './treatmentPlanShared';

import './TreatmentPlanModal.less';

export const SURFACE_OPTIONS = [
  { key: 'MESIAL', lovDisplayVale: 'Mesial' },
  { key: 'DISTAL', lovDisplayVale: 'Distal' },
  { key: 'BUCCAL', lovDisplayVale: 'Buccal' },
  { key: 'LINGUAL', lovDisplayVale: 'Lingual' },
  { key: 'OCCLUSAL', lovDisplayVale: 'Occlusal' },
  { key: 'INCISAL', lovDisplayVale: 'Incisal' },
  { key: 'FACIAL', lovDisplayVale: 'Facial' },
  { key: 'WHOLE_TOOTH', lovDisplayVale: 'Whole Tooth' }
];

export const TREATMENT_AREA_OPTIONS: {
  key: TreatmentAreaScope;
  label: string;
}[] = [
  { key: 'SPECIFIC_TOOTH', label: 'Specific Teeth' },
  { key: 'UPPER_ARCH', label: 'Upper Arch' },
  { key: 'LOWER_ARCH', label: 'Lower Arch' },
  { key: 'FULL_MOUTH', label: 'Full Mouth' }
];

type TreatmentPlanModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  selectedTooth: any;
  selectedTeeth: any[];
  onSelectTooth: (tooth: any) => void;
  onSelectedTeethChange: (teeth: any[]) => void;
  onTreatmentScopeChange: (scope: TreatmentAreaScope) => void;
  originalChart: any;
  readOnly: boolean;
  isBusy: boolean;
  isSaving: boolean;
  cdtList: any[];
  cdtMap: Record<number, any>;
  cdtLoading: boolean;
  dentalServicesList: any[];
  dentalServicesMap: Record<number, any>;
  servicesLoading: boolean;
  dentalProceduresList: any[];
  dentalProceduresMap: Record<number, any>;
  proceduresLoading: boolean;
  dentalActionsList: any[];
  dentalActionsMap: Record<number, any>;
  treatmentPlanTrigger: number;
  setTreatmentPlanTrigger: React.Dispatch<React.SetStateAction<number>>;
  viewOnly?: boolean;
  sessionOptions?: { key: string; lovDisplayVale: string }[];
  /** Allow chart tooth picks while fields stay read-only (propose / review). */
  allowChartSelection?: boolean;
  highlightToothIds?: Array<string | number> | null;
  allowedToothIds?: Array<string | number> | null;
  detailsToothLabel?: string | null;
  treatmentChoices?: Array<{ id: string | number; label: string }>;
  selectedTreatmentId?: string | number | null;
  onSelectTreatment?: (id: string | number) => void;
  modalTitle?: string;
  footerButtons?: React.ReactNode;
};

const emptyClinical = () => ({
  anesthesiaUsed: '',
  dose: null,
  unit: null,
  fillingMaterial: ''
});

const TreatmentPlanModal: React.FC<TreatmentPlanModalProps> = ({
  open,
  onClose,
  onSave,
  form,
  setForm,
  selectedTooth,
  selectedTeeth,
  onSelectTooth,
  onSelectedTeethChange,
  onTreatmentScopeChange,
  originalChart,
  readOnly,
  isBusy,
  isSaving,
  cdtList,
  cdtMap,
  cdtLoading,
  dentalServicesList,
  dentalServicesMap,
  servicesLoading,
  dentalProceduresList,
  dentalProceduresMap: _dentalProceduresMap,
  proceduresLoading,
  dentalActionsList,
  dentalActionsMap,
  treatmentPlanTrigger,
  setTreatmentPlanTrigger,
  viewOnly = false,
  sessionOptions = [],
  allowChartSelection = false,
  highlightToothIds = null,
  allowedToothIds = null,
  detailsToothLabel = null,
  treatmentChoices = [],
  selectedTreatmentId = null,
  onSelectTreatment,
  modalTitle,
  footerButtons
}) => {
  const isEdit = Boolean(form?.id) && !viewOnly;

  const treatmentScope: TreatmentAreaScope =
    form?.treatmentScope || 'SPECIFIC_TOOTH';

  const isGroupedScope = treatmentScope !== 'SPECIFIC_TOOTH';
  const multiSelect = !isEdit && !viewOnly && !isGroupedScope;

  const chartTeeth = originalChart?.teeth ?? [];
  const numberingSystem = originalChart?.numberingSystem || 'UNIVERSAL';

  const scopeTeeth = isGroupedScope
    ? teethForTreatmentScope(chartTeeth, treatmentScope)
    : [];

  const resolveSelectedTooth = (tooth: any) => {
    if (!tooth) return null;

    const byId = chartTeeth.find(
      (item: any) => tooth?.id != null && String(item.id) === String(tooth.id)
    );
    if (byId) return byId;

    if (tooth?.toothNumber != null) {
      return (
        chartTeeth.find(
          (item: any) =>
            String(item.toothNumber) === String(tooth.toothNumber)
        ) || null
      );
    }

    return null;
  };

  const validSelectedTeeth = isGroupedScope
    ? scopeTeeth
    : multiSelect
      ? (selectedTeeth ?? [])
          .map((tooth: any) => resolveSelectedTooth(tooth))
          .filter(Boolean)
      : (() => {
          const resolved = resolveSelectedTooth(selectedTooth);
          return resolved ? [resolved] : [];
        })();

  const hasValidArea = validSelectedTeeth.length > 0;

  const completed =
    form.status === 'COMPLETED' || Boolean(form.patientServiceAndProductId);

  const locked = viewOnly || readOnly || isBusy || completed;
  const chartDisabled =
    (!allowChartSelection && locked) || (!allowChartSelection && isGroupedScope);
  const inputsDisabled = locked || !hasValidArea;
  const surfaceDisabled = inputsDisabled || isGroupedScope;

  const selectedToothLabels = validSelectedTeeth
    .map((tooth: any) => toothDisplayLabel(tooth.toothNumber, numberingSystem))
    .filter(Boolean);

  const selectedToothSummary = isGroupedScope
    ? treatmentScopeLabel(treatmentScope)
    : selectedToothLabels.join(', ');

  const dash = (value: any) =>
    value == null || String(value).trim() === '' ? '—' : value;

  const coveredToothLabels = (form?.coveredToothIds ?? [])
    .map((id: any) => {
      const tooth = chartTeeth.find((item: any) => String(item.id) === String(id));
      return tooth?.toothNumber
        ? toothDisplayLabel(tooth.toothNumber, numberingSystem)
        : null;
    })
    .filter(Boolean);

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const { data: valueUnitData } = useGetLovValuesByCodeQuery('VALUE_UNIT');

  const unitLabel =
    (valueUnitData?.object ?? []).find(
      (item: any) => String(item.key) === String(form?.unit)
    )?.lovDisplayVale || null;

  const lastAppliedProcedureIdRef = useRef<number | null | undefined>(undefined);
  const clinicalDirtyRef = useRef(false);

  useEffect(() => {
    if (!open) {
      lastAppliedProcedureIdRef.current = undefined;
      clinicalDirtyRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open || locked) return;

    const procedureId = form?.procedureId ?? null;

    if (!procedureId) {
      if (lastAppliedProcedureIdRef.current !== null) {
        lastAppliedProcedureIdRef.current = null;
        clinicalDirtyRef.current = false;

        setForm((prev: any) => ({
          ...prev,
          ...emptyClinical()
        }));
      }

      return;
    }

    if (isEdit && form?._seedClinical === true) {
      lastAppliedProcedureIdRef.current = procedureId;
      clinicalDirtyRef.current = false;

      setForm((prev: any) => {
        const { _seedClinical, ...rest } = prev;
        return rest;
      });

      return;
    }

    if (procedureId === lastAppliedProcedureIdRef.current) return;

    if (proceduresLoading) return;

    // No configured clinical defaults source — clear stale values on procedure change.
    lastAppliedProcedureIdRef.current = procedureId;
    clinicalDirtyRef.current = false;

    setForm((prev: any) => ({
      ...prev,
      ...emptyClinical()
    }));
  }, [
    open,
    locked,
    isEdit,
    form?.procedureId,
    form?._seedClinical,
    proceduresLoading,
    setForm
  ]);

  const handleClinicalChange = (next: any) => {
    clinicalDirtyRef.current = true;
    setForm(next);
  };

  const handleProcedureChange = (next: any) => {
    clinicalDirtyRef.current = false;

    setForm({
      ...next,
      _autoPrice: true
    });
  };

  const lineNetDisplay = formatLineNet(form?.price, form?.quantity, form?.discount);
  const isMultiToothBatch =
    !isEdit && !isGroupedScope && validSelectedTeeth.length > 1;
  const perToothNet = lineNetTotal(form?.price, form?.quantity, form?.discount);
  const batchNetTotal =
    isMultiToothBatch && perToothNet != null
      ? Math.round(perToothNet * validSelectedTeeth.length * 100) / 100
      : null;
  const batchNetDisplay =
    batchNetTotal == null ? null : formatMoney(batchNetTotal);

  const handleGroupedChartTeethChange = () => {
    if (isGroupedScope) {
      onSelectedTeethChange(scopeTeeth);
    }
  };

  const handleSave = () => {
    if (inputsDisabled) return;
    onSave();
  };

  const renderSectionHeading = (number: string, title: string) => (
    <div className="tpm-section-heading">
      <span className="tpm-section-number" aria-hidden="true">
        {number}
      </span>
      <h3 className="tpm-section-title">
        <Translate>{title}</Translate>
      </h3>
    </div>
  );

  return (
    <MyModal
      open={open}
      setOpen={(nextOpen: boolean) => {
        if (!nextOpen) onClose();
      }}
      title={
        modalTitle ||
        (viewOnly
          ? 'Treatment Details'
          : isEdit
            ? 'Edit Planned Treatment'
            : 'Add Planned Treatment')
      }
      // steps={[{ title: 'Treatment Details', icon: <AssignmentIcon /> }]}
      size="90vw"
      position="right"
      customClassName={`dental-chart-modal treatment-plan-modal${
        footerButtons ? ' treatment-plan-modal--plan-actions' : ''
      }`}
      actionButtonFunction={viewOnly ? undefined : handleSave}
      actionButtonLabel={isSaving ? 'Saving...' : 'Save'}
      actionButtonLoading={isSaving}
      isDisabledActionBtn={inputsDisabled}
      hideActionBtn={viewOnly}
      cancelButtonLabel={viewOnly ? 'Close' : 'Cancel'}
      handleCancelFunction={onClose}
      footerButtons={footerButtons}
      content={() => (
        <div className="treatment-plan-modal-content" dir={dir}>
          <div className="tpm-layout">
            <section
              className="tpm-chart-panel"
              aria-label="Treatment area selection"
            >
              <div className="tpm-chart-heading">
                <div className="tpm-heading-copy">
                  <span className="tpm-eyebrow">
                    <Translate>Treatment Area</Translate>
                  </span>

                  <h2 className="tpm-panel-title">
                    <Translate>
                      {allowChartSelection
                        ? 'Dental Chart'
                        : isGroupedScope
                          ? treatmentScopeLabel(treatmentScope)
                          : 'Select Teeth'}
                    </Translate>
                  </h2>

                  <p className="tpm-panel-description">
                    <Translate>
                      {allowChartSelection
                        ? 'Select a tooth with plan treatments to review its details.'
                        : isGroupedScope
                          ? 'Highlighted teeth belong to the selected treatment area.'
                          : multiSelect
                            ? 'Click a tooth to select it. Click again to remove it.'
                            : 'Select the tooth for this treatment.'}
                    </Translate>
                  </p>
                </div>

                <span
                  className={`tpm-selection-count${
                    hasValidArea ? ' tpm-selection-count--active' : ''
                  }`}
                >
                  <strong>{validSelectedTeeth.length}</strong>
                  <span>
                    <Translate>
                      {validSelectedTeeth.length === 1 ? 'Tooth' : 'Teeth'}
                    </Translate>
                  </span>
                </span>
              </div>

              {!isEdit && !viewOnly && (
                <div className="tpm-area-selector">
                  <span className="tpm-area-label">
                    <Translate>Select treatment area</Translate>
                  </span>

                  <div
                    className="tpm-area-buttons"
                    role="group"
                    aria-label="Treatment area"
                  >
                    {TREATMENT_AREA_OPTIONS.map(option => {
                      const active = treatmentScope === option.key;

                      return (
                        <Button
                          key={option.key}
                          className={`tpm-area-button${
                            active ? ' tpm-area-button--active' : ''
                          }`}
                          appearance="subtle"
                          disabled={locked}
                          aria-pressed={active}
                          onClick={() =>
                            onTreatmentScopeChange(option.key)
                          }
                        >
                          <Translate>{option.label}</Translate>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {chartTeeth.length ? (
                <div className="tpm-chart-scroll">
                  <div className="tpm-chart">
                    <DentalChart
                      selectionOnly
                      multiSelect={multiSelect || (!allowChartSelection && isGroupedScope)}
                      disabled={chartDisabled}
                      planReviewMode={allowChartSelection}
                      highlightToothIds={highlightToothIds}
                      allowedToothIds={allowedToothIds}
                      patientId={form?.patientId}
                      encounterId={form?.encounterId}
                      chartObject={originalChart}
                      setChartObject={() => {}}
                      selectedTooth={
                        !allowChartSelection && isGroupedScope
                          ? scopeTeeth[scopeTeeth.length - 1] || selectedTooth
                          : selectedTooth
                      }
                      setSelectedTooth={
                        !allowChartSelection && isGroupedScope
                          ? () => {}
                          : onSelectTooth
                      }
                      selectedTeeth={validSelectedTeeth}
                      setSelectedTeeth={
                        !allowChartSelection && isGroupedScope
                          ? handleGroupedChartTeethChange
                          : onSelectedTeethChange
                      }
                      dentalActionsList={dentalActionsList}
                      dentalActionsMap={dentalActionsMap}
                      dentalServicesList={dentalServicesList}
                      dentalServicesMap={dentalServicesMap}
                      cdtList={cdtList}
                      cdtMap={cdtMap}
                      treatmentPlanTrigger={treatmentPlanTrigger}
                      setTreatmentPlanTrigger={setTreatmentPlanTrigger}
                      cdtLoading={cdtLoading}
                      servicesLoading={servicesLoading}
                    />
                  </div>
                </div>
              ) : (
                <div className="tpm-empty-chart">
                  <AssignmentIcon aria-hidden="true" />
                  <strong>
                    <Translate>No teeth available</Translate>
                  </strong>
                  <span>
                    <Translate>
                      No chart teeth available for this encounter.
                    </Translate>
                  </span>
                </div>
              )}

              <div
                className={`tpm-selection-summary${
                  hasValidArea ? ' tpm-selection-summary--active' : ''
                }`}
                role="status"
              >
                <div className="tpm-summary-heading">
                  <span className="tpm-summary-label">
                    <Translate>
                      {isGroupedScope ? 'Selected Area' : 'Selected Teeth'}
                    </Translate>
                  </span>

                  {hasValidArea && isGroupedScope && (
                    <span className="tpm-area-tag">
                      <Translate>
                        {treatmentScopeLabel(treatmentScope)}
                      </Translate>
                    </span>
                  )}
                </div>

                {hasValidArea ? (
                  <div className="tpm-tooth-chips" dir="ltr">
                    {validSelectedTeeth.map((tooth: any) => (
                      <span className="tpm-tooth-chip" key={tooth.id}>
                        {toothDisplayLabel(tooth.toothNumber, numberingSystem)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="tpm-summary-empty">
                    <Translate>
                      Select a treatment area or choose teeth from the chart.
                    </Translate>
                  </p>
                )}
              </div>

              {!viewOnly && !isEdit && hasValidArea && (
                <div className="tpm-batch-hint" role="note">
                  <Translate>
                    {isGroupedScope
                      ? 'The selected area is saved as one treatment. Unit price is per tooth; quantity equals the number of teeth in the selected coverage.'
                      : validSelectedTeeth.length > 1
                        ? 'Each tooth is saved as its own row with the same Session Number. Unit Price, Quantity, and Discount Amount are copied onto every row — the discount is not shared once across the batch.'
                        : 'This treatment applies to the selected tooth.'}
                  </Translate>
                </div>
              )}
            </section>

            <section
              className="tpm-fields-panel"
              aria-label="Treatment details"
            >
              <div className="tpm-form-header">
                <div>
                  {detailsToothLabel ? (
                    <span className="tpm-eyebrow">
                      <Translate>{detailsToothLabel}</Translate>
                    </span>
                  ) : null}

                  <h2 className="tpm-panel-title">
                    <Translate>Treatment Details</Translate>
                  </h2>

                  <p className="tpm-panel-description">
                    <Translate>
                      {viewOnly
                        ? 'Review the selected tooth treatment details.'
                        : 'Enter the procedure and clinical details.'}
                    </Translate>
                  </p>
                </div>

                <span
                  className={`tpm-status ${
                    completed && !form?.cancelled
                      ? 'tpm-status--completed'
                      : 'tpm-status--pending'
                  }`}
                >
                  <span className="tpm-status-dot" aria-hidden="true" />
                  <Translate>
                    {form?.cancelled
                      ? 'Cancelled'
                      : form?.existing
                        ? 'Completed + Existing'
                        : form?.status === 'IN_PROGRESS'
                          ? 'In Progress'
                          : completed
                            ? 'Completed'
                            : 'Pending'}
                  </Translate>
                </span>
              </div>

              {!hasValidArea && (
                <div className="tpm-selection-notice" role="status">
                  <span className="tpm-notice-dot" aria-hidden="true" />
                  <span>
                    <Translate>
                      {allowChartSelection
                        ? 'Select a tooth with treatments to view details.'
                        : isGroupedScope
                          ? 'The selected treatment area has no teeth on this chart.'
                          : 'Choose teeth from the chart to enable the treatment fields.'}
                    </Translate>
                  </span>
                </div>
              )}

              {viewOnly && treatmentChoices.length > 1 && (
                <div className="tpm-treatment-choices" role="listbox" aria-label="Treatments">
                  {treatmentChoices.map(choice => {
                    const active =
                      selectedTreatmentId != null &&
                      String(selectedTreatmentId) === String(choice.id);

                    return (
                      <button
                        key={String(choice.id)}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={`tpm-treatment-choice${
                          active ? ' tpm-treatment-choice--active' : ''
                        }`}
                        onClick={() => onSelectTreatment?.(choice.id)}
                      >
                        {choice.label}
                      </button>
                    );
                  })}
                </div>
              )}

              <Form fluid className="tpm-form">
                <section className="tpm-section">
                  {renderSectionHeading('01', 'Treatment Area')}

                  <div className="tpm-fields-grid">
                    <div className="tpm-field">
                      <MyInput
                        width="100%"
                        fieldName="toothNumberDisplay"
                        fieldLabel={
                          isGroupedScope
                            ? 'Treatment Area'
                            : multiSelect && validSelectedTeeth.length > 1
                              ? 'Selected Tooth Numbers'
                              : 'Selected Tooth Number'
                        }
                        fieldType="text"
                        record={{
                          toothNumberDisplay: selectedToothSummary
                        }}
                        setRecord={() => {}}
                        disabled
                      />
                    </div>

                    <div className="tpm-field">
                      <MyInput
                        width="100%"
                        fieldName="surface"
                        fieldLabel="Surface"
                        fieldType="select"
                        selectData={SURFACE_OPTIONS}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        searchable={false}
                        record={form}
                        setRecord={setForm}
                        disabled={surfaceDisabled}
                      />
                    </div>
                  </div>

                  {isGroupedScope && (
                    <p className="tpm-field-hint">
                      <Translate>
                        Surface does not apply to arch or full-mouth treatments.
                      </Translate>
                    </p>
                  )}

                  {viewOnly && isGroupedScope && (
                    <p className="tpm-field-hint">
                      <Translate>Covered teeth</Translate>
                      {': '}
                      {coveredToothLabels.length
                        ? coveredToothLabels.join(', ')
                        : '—'}
                    </p>
                  )}
                </section>

                <section className="tpm-section">
                  {renderSectionHeading('02', 'Procedure & Session')}

                  <div className="tpm-fields-grid">
                    <div className="tpm-field tpm-field-full">
                      {viewOnly ? (
                        <MyInput
                          width="100%"
                          fieldName="sessionDisplay"
                          fieldLabel="Session Number"
                          fieldType="text"
                          record={{
                            sessionDisplay:
                              form?.visitNumber != null
                                ? `Session ${form.visitNumber}`
                                : '—'
                          }}
                          setRecord={() => {}}
                          disabled
                        />
                      ) : (
                        <MyInput
                          width="100%"
                          fieldName="sessionChoice"
                          fieldLabel="Session Number"
                          fieldType="select"
                          selectData={sessionOptions}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          searchable={false}
                          record={form}
                          setRecord={setForm}
                          disabled={inputsDisabled}
                        />
                      )}

                      {!viewOnly && (
                        <p className="tpm-field-hint">
                          <Translate>
                            {form?.sessionChoice === 'NEW'
                              ? 'A new Session Number is assigned when you save. The number is not shown until then.'
                              : 'This treatment is added to the selected session. Several procedures can share one session.'}
                          </Translate>
                        </p>
                      )}
                    </div>

                    <div className="tpm-field tpm-field-full">
                      <MyInput
                        width="100%"
                        required
                        fieldName="cdtCodeId"
                        fieldLabel="CDT"
                        fieldType="select"
                        selectData={cdtList}
                        selectDataLabel="description"
                        selectDataValue="id"
                        renderMenuItem={(_label, item) => (
                          <span>
                            {item.code} / {item.description}
                          </span>
                        )}
                        searchBy={(keyword, _, item: any) => {
                          const search = String(keyword || '').toLowerCase();

                          return (
                            String(item?.code || '')
                              .toLowerCase()
                              .includes(search) ||
                            String(item?.description || '')
                              .toLowerCase()
                              .includes(search)
                          );
                        }}
                        record={form}
                        setRecord={setForm}
                        disabled={inputsDisabled || cdtLoading}
                      />
                    </div>

                    <div className="tpm-field tpm-field-full">
                      <MyInput
                        width="100%"
                        required
                        fieldName="procedureId"
                        fieldLabel="Dental Procedure"
                        fieldType="select"
                        selectData={dentalProceduresList}
                        selectDataLabel="name"
                        selectDataValue="id"
                        searchable
                        record={form}
                        setRecord={handleProcedureChange}
                        disabled={inputsDisabled || proceduresLoading}
                      />
                    </div>
                  </div>
                </section>

                <section className="tpm-section">
                  {renderSectionHeading('04', 'Clinical Details')}

                  <div className="tpm-fields-grid">
                    <div className="tpm-field">
                      <MyInput
                        width="100%"
                        fieldName="anesthesiaUsed"
                        fieldLabel="Anesthesia Used"
                        fieldType="text"
                        record={
                          viewOnly
                            ? { anesthesiaUsed: dash(form?.anesthesiaUsed) }
                            : form
                        }
                        setRecord={handleClinicalChange}
                        disabled={inputsDisabled}
                      />
                    </div>

                    <div className="tpm-field">
                      <MyInput
                        width="100%"
                        fieldName="fillingMaterial"
                        fieldLabel="Filling Material"
                        fieldType="text"
                        record={
                          viewOnly
                            ? { fillingMaterial: dash(form?.fillingMaterial) }
                            : form
                        }
                        setRecord={handleClinicalChange}
                        disabled={inputsDisabled}
                      />
                    </div>

                    <div className="tpm-field">
                      <MyInput
                        width="100%"
                        fieldName="dose"
                        fieldLabel="Dose"
                        fieldType={viewOnly ? 'text' : 'number'}
                        allowDecimal
                        showZero
                        record={
                          viewOnly
                            ? { dose: form?.dose === 0 ? '0' : dash(form?.dose) }
                            : form
                        }
                        setRecord={handleClinicalChange}
                        disabled={inputsDisabled}
                      />
                    </div>

                    <div className="tpm-field">
                      {viewOnly ? (
                        <MyInput
                          width="100%"
                          fieldName="unitLabel"
                          fieldLabel="Unit"
                          fieldType="text"
                          record={{ unitLabel: dash(unitLabel || form?.unit) }}
                          setRecord={() => {}}
                          disabled
                        />
                      ) : (
                        <MyInput
                          width="100%"
                          fieldName="unit"
                          fieldLabel="Unit"
                          fieldType="select"
                          selectData={valueUnitData?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          record={form}
                          setRecord={handleClinicalChange}
                          disabled={inputsDisabled}
                          disableByField="isValid"
                        />
                      )}
                    </div>
                  </div>
                </section>

                <section className="tpm-section">
                  {renderSectionHeading('03', 'Price & Quantity')}

                  <div className="tpm-fields-grid tpm-fields-grid--pricing">
                    <div className="tpm-field">
                      <MyInput
                        width="100%"
                        fieldName="price"
                        fieldLabel="Unit Price"
                        fieldType={viewOnly && (form?.price == null || form?.price === '') ? 'text' : 'number'}
                        allowDecimal
                        showZero
                        record={
                          viewOnly && (form?.price == null || form?.price === '')
                            ? { price: '—' }
                            : form
                        }
                        setRecord={(next: any) =>
                          setForm({
                            ...next,
                            _autoPrice: false
                          })
                        }
                        disabled={inputsDisabled}
                      />
                    </div>

                    <div className="tpm-field">
                      <MyInput
                        width="100%"
                        fieldName="quantity"
                        fieldLabel="Quantity"
                        fieldType={viewOnly && (form?.quantity == null || form?.quantity === '') ? 'text' : 'number'}
                        record={
                          viewOnly && (form?.quantity == null || form?.quantity === '')
                            ? { quantity: '—' }
                            : form
                        }
                        setRecord={setForm}
                        disabled={inputsDisabled || isGroupedScope}
                      />
                    </div>

                    <div className="tpm-field">
                      <MyInput
                        width="100%"
                        fieldName="discount"
                        fieldLabel="Discount Amount"
                        fieldType={viewOnly && (form?.discount == null || form?.discount === '') ? 'text' : 'number'}
                        allowDecimal
                        showZero
                        record={
                          viewOnly && (form?.discount == null || form?.discount === '')
                            ? { discount: '—' }
                            : form
                        }
                        setRecord={setForm}
                        disabled={inputsDisabled}
                      />
                    </div>

                    <div className="tpm-field">
                      <MyInput
                        width="100%"
                        fieldName="netTotal"
                        fieldLabel="Net Total"
                        fieldType="text"
                        record={{ netTotal: lineNetDisplay }}
                        setRecord={() => undefined}
                        disabled
                      />
                    </div>
                  </div>
                  {!viewOnly && (
                    <p className="tpm-field-hint">
                      <Translate>
                        Unit price is per tooth. For arch or full-mouth coverage, quantity equals the number of covered teeth; specific teeth use quantity 1 per row.
                      </Translate>
                    </p>
                  )}
                  {!viewOnly && isMultiToothBatch && batchNetDisplay != null && (
                    <div className="tpm-batch-total" role="status">
                      <Translate>
                        Batch preview before save
                      </Translate>
                      {`: ${validSelectedTeeth.length} teeth × ${lineNetDisplay} net/row = ${batchNetDisplay} total (discount applied on each row).`}
                    </div>
                  )}
                </section>



                <section className="tpm-section">
                  {renderSectionHeading('05', 'Notes')}

                  <div className="tpm-field">
                    <MyInput
                      width="100%"
                      height={100}
                      showLabel={false}
                      fieldName="note"
                      fieldLabel="Notes"
                      fieldType="textarea"
                      record={viewOnly ? { note: dash(form?.note) } : form}
                      setRecord={setForm}
                      disabled={inputsDisabled}
                    />
                  </div>
                </section>

                {!viewOnly && form?.requiresRevisionReason && (
                  <section className="tpm-section">
                    {renderSectionHeading('06', 'Acceptance')}
                    <div className="tpm-field">
                      <MyInput
                        width="100%"
                        fieldName="revisionReason"
                        fieldLabel="Reason for changing accepted work"
                        fieldType="textarea"
                        record={form}
                        setRecord={setForm}
                        disabled={inputsDisabled}
                      />
                      <p className="tpm-field-hint">
                        <Translate>
                          Changing scope, procedure, price, or clinical details returns this plan to Proposed. Notes and session changes do not.
                        </Translate>
                      </p>
                    </div>
                  </section>
                )}

                {viewOnly && (
                  <section className="tpm-section">
                    {renderSectionHeading('06', 'Completion')}
                    <div className="tpm-fields-grid">
                      <div className="tpm-field">
                        <MyInput
                          width="100%"
                          fieldName="statusDisplay"
                          fieldLabel="Status"
                          fieldType="text"
                          record={{
                            statusDisplay: form?.cancelled
                              ? 'Cancelled'
                              : form?.existing
                                ? 'Completed + Existing'
                                : form?.status === 'IN_PROGRESS'
                                  ? 'In Progress'
                                  : form?.status === 'COMPLETED'
                                    ? 'Completed'
                                    : 'Pending'
                          }}
                          setRecord={() => {}}
                          disabled
                        />
                      </div>
                      <div className="tpm-field">
                        <MyInput
                          width="100%"
                          fieldName="completedBy"
                          fieldLabel="Performed By"
                          fieldType="text"
                          record={{ completedBy: dash(form?.completedBy) }}
                          setRecord={() => {}}
                          disabled
                        />
                      </div>
                      <div className="tpm-field tpm-field-full">
                        <MyInput
                          width="100%"
                          fieldName="completedAt"
                          fieldLabel="Completion Date"
                          fieldType="text"
                          record={{
                            completedAt: form?.completedAt
                              ? new Date(form.completedAt).toLocaleString()
                              : '—'
                          }}
                          setRecord={() => {}}
                          disabled
                        />
                      </div>
                    </div>
                  </section>
                )}
              </Form>
            </section>
          </div>
        </div>
      )}
    />
  );
};

export default TreatmentPlanModal;