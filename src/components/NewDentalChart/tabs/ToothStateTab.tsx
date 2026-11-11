import React, { useMemo, useState } from 'react';
import { Form, Panel } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrash,
  faEraser
} from '@fortawesome/free-solid-svg-icons';

import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import CancellationModal from '@/components/CancellationModal/CancellationModal';

import FullTooth from '../../DentalChart/Tooth/Tooth';
import ToothActionCard from '../ToothActionCard/ToothActionCard';

import { toothDisplayLabel } from '@/utils/toothNumber';
import { useGetByDentalActionQuery } from '@/services/setup/dental-action/CdtDentalActionService';
import { useGetCdtByIdsQuery } from '@/services/setup/cdtCodeService';

import './ToothStateTab.less';

interface ToothStateTabProps {
  selectedTooth: any;
  currentToothAction: any;
  setCurrentToothAction: (action: any) => void;
  selectedCdt: string | null;
  setSelectedCdt: (cdt: string | null) => void;
  dentalActionsList: any[];
  dentalActionsMap: any;
  removeToothAction: any;
  clearCurrentAction: () => void;
  eligiblePlans?: any[];
  planSessions?: any[];
  onCreatePlan?: () => void;
  numberingSystem?: string | null;
}

const SURFACE_OPTIONS = [
  { key: 'MESIAL', lovDisplayVale: 'Mesial' },
  { key: 'DISTAL', lovDisplayVale: 'Distal' },
  { key: 'BUCCAL', lovDisplayVale: 'Buccal' },
  { key: 'LINGUAL', lovDisplayVale: 'Lingual' },
  { key: 'OCCLUSAL', lovDisplayVale: 'Occlusal' },
  { key: 'INCISAL', lovDisplayVale: 'Incisal' },
  { key: 'FACIAL', lovDisplayVale: 'Facial' },
  { key: 'WHOLE_TOOTH', lovDisplayVale: 'Whole Tooth' }
];

const SURFACE_LABELS = SURFACE_OPTIONS.reduce<Record<string, string>>(
  (result, option) => {
    result[option.key] = option.lovDisplayVale;
    return result;
  },
  {}
);

const ToothStateTab: React.FC<ToothStateTabProps> = ({
  selectedTooth,
  currentToothAction,
  setCurrentToothAction,
  selectedCdt,
  setSelectedCdt,
  dentalActionsList,
  dentalActionsMap,
  removeToothAction,
  clearCurrentAction,
  eligiblePlans = [],
  planSessions = [],
  onCreatePlan,
  numberingSystem = 'UNIVERSAL'
}) => {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelForm, setCancelForm] = useState<any>({
    cancellationReason: ''
  });

  const selectedAction =
    dentalActionsMap[currentToothAction.dentalActionId];

  const isTreatment = selectedAction?.type === 'TREATMENT';
  const isSavedAction = Boolean(currentToothAction.id);
  const requiresPlan = isTreatment && !currentToothAction.existing;

  const appliedActions = selectedTooth?.actions ?? [];

  const toothLabel = selectedTooth?.toothNumber
    ? toothDisplayLabel(selectedTooth.toothNumber, numberingSystem)
    : '—';

  const sortedDentalActions = useMemo(
    () =>
      [...(dentalActionsList ?? [])].sort((a, b) => {
        const typeDifference =
          Number(a.type === 'TREATMENT') -
          Number(b.type === 'TREATMENT');

        return (
          typeDifference ||
          (a.description ?? '').localeCompare(b.description ?? '')
        );
      }),
    [dentalActionsList]
  );

  const { currentData: cdtDentalActionRows } =
    useGetByDentalActionQuery(currentToothAction.dentalActionId, {
      skip: !currentToothAction.dentalActionId
    });

  const treatmentCdtIds = useMemo(
    () =>
      (cdtDentalActionRows ?? [])
        .map(row => row.cdtId?.id)
        .filter((id): id is number => id != null),
    [cdtDentalActionRows]
  );

  const {
    currentData: treatmentCdtList,
    isFetching: treatmentCdtListIsLoading
  } = useGetCdtByIdsQuery(treatmentCdtIds, {
    skip: treatmentCdtIds.length === 0
  });

  const planOptions = useMemo(
    () =>
      eligiblePlans.map(plan => ({
        ...plan,
        label: `${plan.planNumber} · ${plan.title}`
      })),
    [eligiblePlans]
  );

  const sessionOptions = useMemo(
    () => [
      { id: 'NEW', label: 'New Session' },
      ...[...planSessions]
        .sort((a, b) => a.sessionNumber - b.sessionNumber)
        .map(session => ({
          id: session.id,
          label: `Session ${session.sessionNumber}`
        }))
    ],
    [planSessions]
  );

  const handleCancelAction = async () => {
    try {
      await removeToothAction({
        id: currentToothAction.id,
        body: {
          cancellationReason: cancelForm.cancellationReason || ''
        }
      }).unwrap();

      setCancelModalOpen(false);
      setCancelForm({ cancellationReason: '' });
    } catch {
      setCancelModalOpen(false);
    }
  };

  const selectAppliedAction = (action: any) => {
    setCurrentToothAction({
      ...action,
      id: action.id,
      dentalActionId: action.dentalActionId,
      surface: action.surface,
      note: action.note,
      existing: action.existing,
      anesthesiaUsed: action.anesthesiaUsed,
      dose: action.dose
    });
  };

  return (
    <div className="tst-page">
      <Panel bordered className="tst-form-panel">
        <div className="tst-header">
          <div>
            <h4>
              <Translate>Tooth Action</Translate>
              <span className="tst-tooth-label">#{toothLabel}</span>
            </h4>

            <p>
              <Translate>
                Select an action and enter its clinical details.
              </Translate>
            </p>
          </div>

          <span className="tst-mode-label">
            <Translate>
              {isSavedAction ? 'Selected Action' : 'New Action'}
            </Translate>
          </span>
        </div>

        <Form fluid className="tst-form">
          <section className="tst-form-section">
            <div className="tst-section-title">
              <Translate>Action Details</Translate>
            </div>

            <div className="tst-fields-grid">
              <div className="tst-field">
                <MyInput
                  fieldLabel="Action"
                  fieldName="dentalActionId"
                  fieldType="select"
                  required
                  record={currentToothAction}
                  setRecord={setCurrentToothAction}
                  placeholder={
                    <Translate>Select Action From List</Translate>
                  }
                  disabled={isSavedAction}
                  selectData={sortedDentalActions}
                  selectDataLabel="description"
                  selectDataValue="id"
                  renderMenuItem={(_, action) => (
                    <div className="tst-action-option">
                      <span>{action.description}</span>

                      <span
                        className={
                          action.type === 'TREATMENT'
                            ? 'tst-action-type tst-action-type--treatment'
                            : 'tst-action-type tst-action-type--condition'
                        }
                      >
                        <Translate>
                          {action.type === 'TREATMENT'
                            ? 'Treatment'
                            : 'Condition'}
                        </Translate>
                      </span>
                    </div>
                  )}
                />
              </div>

              <div className="tst-field">
                <MyInput
                  fieldLabel="Surface"
                  fieldName="surface"
                  fieldType="select"
                  required
                  record={currentToothAction}
                  setRecord={setCurrentToothAction}
                  disabled={isSavedAction}
                  placeholder={<Translate>Select Surface</Translate>}
                  selectData={SURFACE_OPTIONS}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                />
              </div>

              <div className="tst-field tst-field--full">
                <MyInput
                  fieldLabel="CDT / Procedure"
                  fieldName="cdtCodeId"
                  fieldType="select"
                  required={requiresPlan}
                  record={{ cdtCodeId: selectedCdt }}
                  setRecord={record =>
                    setSelectedCdt(record.cdtCodeId)
                  }
                  disabled={
                    !isTreatment || currentToothAction.existing
                  }
                  placeholder={
                    <Translate>
                      {isSavedAction
                        ? '(+) Add new CDT to this treatment'
                        : 'Select CDT (Treatment Only)'}
                    </Translate>
                  }
                  selectData={
                    treatmentCdtIds.length > 0
                      ? treatmentCdtList ?? []
                      : []
                  }
                  loading={treatmentCdtListIsLoading}
                  selectDataLabel="description"
                  selectDataValue="id"
                  renderMenuItem={(_, item) => (
                    <span>
                      {item.code} / {item.description}
                    </span>
                  )}
                  searchBy={(keyword, _, item) => {
                    const search = keyword.toLowerCase();

                    return (
                      String(item.code ?? '')
                        .toLowerCase()
                        .includes(search) ||
                      String(item.description ?? '')
                        .toLowerCase()
                        .includes(search)
                    );
                  }}
                />
              </div>
            </div>

            <div className="tst-existing">
              <MyInput
                fieldName="existing"
                fieldType="check"
                record={currentToothAction}
                setRecord={record => {
                  setCurrentToothAction(record);

                  if (record.existing) {
                    setSelectedCdt(null);
                  }
                }}
                disabled={!isTreatment || isSavedAction}
                label={<Translate>Existing Treatment</Translate>}
              />
            </div>
          </section>

          {requiresPlan && (
            <section className="tst-form-section">
              <div className="tst-section-heading">
                <div className="tst-section-title">
                  <Translate>Treatment Plan & Session</Translate>
                </div>

                {eligiblePlans.length === 0 && onCreatePlan && (
                  <MyButton
                    appearance="link"
                    prefixIcon={() => (
                      <FontAwesomeIcon icon={faPlus} />
                    )}
                    onClick={onCreatePlan}
                  >
                    <Translate>New Treatment Plan</Translate>
                  </MyButton>
                )}
              </div>

              <div className="tst-fields-grid">
                <div className="tst-field">
                  <MyInput
                    fieldName="treatmentPlanId"
                    fieldLabel="Treatment Plan"
                    fieldType="select"
                    required
                    record={currentToothAction}
                    setRecord={next =>
                      setCurrentToothAction({
                        ...next,
                        treatmentSessionId:
                          String(next.treatmentPlanId) ===
                          String(currentToothAction.treatmentPlanId)
                            ? next.treatmentSessionId
                            : null
                      })
                    }
                    selectData={planOptions}
                    selectDataLabel="label"
                    selectDataValue="id"
                    placeholder={
                      <Translate>Select a treatment plan</Translate>
                    }
                  />
                </div>

                <div className="tst-field">
                  <MyInput
                    fieldName="treatmentSessionId"
                    fieldLabel="Session"
                    fieldType="select"
                    record={{
                      ...currentToothAction,
                      treatmentSessionId:
                        currentToothAction.treatmentSessionId ?? 'NEW'
                    }}
                    setRecord={next =>
                      setCurrentToothAction({
                        ...currentToothAction,
                        treatmentSessionId:
                          next.treatmentSessionId === 'NEW'
                            ? null
                            : next.treatmentSessionId
                      })
                    }
                    selectData={sessionOptions}
                    selectDataLabel="label"
                    selectDataValue="id"
                    disabled={!currentToothAction.treatmentPlanId}
                  />
                </div>
              </div>
            </section>
          )}

          <section className="tst-form-section">
            <div className="tst-section-title">
              <Translate>Clinical Details</Translate>
            </div>

            <div className="tst-fields-grid">
              <div className="tst-field">
                <MyInput
                  fieldName="anesthesiaUsed"
                  fieldLabel="Anesthesia Used"
                  fieldType="text"
                  record={currentToothAction}
                  setRecord={setCurrentToothAction}
                  placeholder="Anesthesia"
                />
              </div>

              <div className="tst-field">
                <MyInput
                  fieldName="dose"
                  fieldLabel="Dose"
                  fieldType="text"
                  record={currentToothAction}
                  setRecord={setCurrentToothAction}
                  placeholder="Dose"
                />
              </div>

              <div className="tst-field tst-field--full">
                <MyInput
                  fieldLabel="Notes"
                  fieldName="note"
                  fieldType="text"
                  record={currentToothAction}
                  setRecord={setCurrentToothAction}
                  placeholder="Notes"
                />
              </div>
            </div>
          </section>

          <div className="tst-form-actions">
            <MyButton
              appearance="ghost"
              prefixIcon={() => (
                <FontAwesomeIcon icon={faEraser} />
              )}
              onClick={clearCurrentAction}
            >
              <Translate>Clear</Translate>
            </MyButton>

            <span className="tst-remove-action">
              <MyButton
                appearance="ghost"
                prefixIcon={() => (
                  <FontAwesomeIcon icon={faTrash} />
                )}
                disabled={!isSavedAction}
                onClick={() => {
                  setCancelForm({ cancellationReason: '' });
                  setCancelModalOpen(true);
                }}
              >
                <Translate>Remove</Translate>
              </MyButton>
            </span>
          </div>
        </Form>
      </Panel>

      <Panel bordered className="tst-applied-panel">
        <div className="tst-header">
          <div>
            <h4>
              <Translate>Applied Actions</Translate>
              <span className="tst-count">
                {appliedActions.length}
              </span>
            </h4>

            <p>
              <Translate>
                Select a card to display its details in the form.
              </Translate>
            </p>
          </div>
        </div>

        <div className="tst-applied-layout">
          <div className="tst-tooth-preview">
            {selectedTooth?.id && (
              <FullTooth
                key={selectedTooth.id}
                chartTooth={selectedTooth}
              />
            )}

            <span className="tst-preview-label">
              <Translate>Tooth</Translate> #{toothLabel}
            </span>
          </div>

          <div className="tst-action-list">
            {appliedActions.length === 0 ? (
              <div className="tst-empty">
                <Translate>
                  No actions applied to this tooth.
                </Translate>
              </div>
            ) : (
              appliedActions.map((action: any) => (
                <div
                  key={action.id}
                  className={`tst-action-item ${
                    currentToothAction.id === action.id
                      ? 'selected-row'
                      : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-label="Select tooth action"
                  onClick={() => selectAppliedAction(action)}
                  onKeyDown={event => {
                    if (
                      event.key !== 'Enter' &&
                      event.key !== ' '
                    ) {
                      return;
                    }

                    event.preventDefault();
                    selectAppliedAction(action);
                  }}
                >
                  <ToothActionCard
                    date={action.createdDate ?? null}
                    action={
                      dentalActionsMap[action.dentalActionId]
                        ?.description || 'Unknown Action'
                    }
                    type={
                      dentalActionsMap[action.dentalActionId]
                        ?.type || 'Unknown'
                    }
                    surface={
                      SURFACE_LABELS[action.surface] ||
                      action.surface ||
                      '—'
                    }
                    note={action.note}
                    existing={action.existing}
                    anesthesiaUsed={action.anesthesiaUsed}
                    dose={action.dose}
                    numberingSystem={numberingSystem}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </Panel>

      <CancellationModal
        title="Cancel Tooth Action"
        fieldLabel="Cancellation Reason"
        open={cancelModalOpen}
        setOpen={setCancelModalOpen}
        object={cancelForm}
        setObject={setCancelForm}
        handleCancle={handleCancelAction}
        fieldName="cancellationReason"
        required={true}
      />
    </div>
  );
};

export default ToothStateTab;