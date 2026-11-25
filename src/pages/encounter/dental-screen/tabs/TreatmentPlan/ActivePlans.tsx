import React, { useMemo } from 'react';
import { Box, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faCalendarPlus,
  faEye,
  faTooth,
  faCircleInfo
} from '@fortawesome/free-solid-svg-icons';

import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';

import { practitionerDisplayName } from './TreatmentPlanHeaderModal';
import { formatSurfaces } from './TreatmentPlanModal';
import TreatmentRowActions from './TreatmentRowActions';

import {
  toothDisplayLabel,
  treatmentScopeLabel
} from '@/utils/toothNumber';

import {
  EMPTY_VALUE,
  PlanProgress,
  PlanStatus,
  formatDate,
  formatLineNet,
  lineDiscountAmount,
  formatMoney,
  groupTreatmentRows,
  isCompleted,
  isExistingDocumentation,
  isGroupedScope,
  isInProgress
} from './treatmentPlanShared';

import './ActivePlans.less';

export type ActivePlansProps = {
  plans: any[];
  plansLoading: boolean;
  plansError: boolean;
  onRetryPlans: () => void;
  selectedPlan: any | null;
  practitioners: any[];
  onViewPlan: (plan: any) => void;
  onOpenChart: () => void;
  onPropose: () => void;
  onCloseDetails: () => void;
  onNewPlan: () => void;
  newPlanDisabled: boolean;
  onBookAppointment: () => void;
  bookAppointmentDisabled: boolean;
  actionsDisabled: boolean;
  planTreatments: any[];
  existingDocumentation: any[];
  treatmentsFetching: boolean;
  existingFetching: boolean;
  treatmentsError: boolean;
  onRetryTreatments: () => void;
  canAddTreatment: boolean;
  canExecute: boolean;
  completingId: number | null;
  teethById: Record<number, any>;
  numberingSystem?: string | null;
  numberingLabels?: Record<string, string> | null;
  cdtMap: Record<number, any>;
  dentalServicesMap: Record<number, any>;
  dentalProceduresMap: Record<number, any>;
  onAddTreatment: () => void;
  onViewTreatment: (row: any) => void;
  onEditTreatment: (row: any) => void;
  onStartTreatment: (row: any) => void;
  onCompleteTreatment: (row: any) => void;
  onCancelTreatment: (row: any) => void;
  readOnly: boolean;
  canReturn: boolean;
  onReturnTreatment: (row: any) => void;
};

type RowActionProps = {
  label: string;
  className: string;
  icon: React.ComponentProps<typeof FontAwesomeIcon>['icon'];
  disabled?: boolean;
  onClick: () => void;
};

const RowAction = ({
  label,
  className,
  icon,
  disabled,
  onClick
}: RowActionProps) => (
  <IconButton
    className={`ap-action ${className}`}
    size="small"
    title={label}
    aria-label={label}
    disabled={disabled}
    onClick={event => {
      event.stopPropagation();
      onClick();
    }}
  >
    <FontAwesomeIcon icon={icon} />
  </IconButton>
);

const ActivePlans = ({
  plans,
  plansLoading,
  plansError,
  onRetryPlans,
  selectedPlan,
  practitioners,
  onViewPlan,
  onOpenChart,
  onPropose,
  onCloseDetails,
  onNewPlan,
  newPlanDisabled,
  onBookAppointment,
  bookAppointmentDisabled,
  actionsDisabled,
  planTreatments,
  existingDocumentation,
  treatmentsFetching,
  existingFetching,
  treatmentsError,
  onRetryTreatments,
  canAddTreatment,
  canExecute,
  completingId,
  teethById,
  numberingSystem = 'UNIVERSAL',
  numberingLabels = null,
  cdtMap,
  dentalServicesMap,
  dentalProceduresMap,
  onAddTreatment,
  onViewTreatment,
  onEditTreatment,
  onStartTreatment,
  onCompleteTreatment,
  onCancelTreatment,
  readOnly,
  canReturn,
  onReturnTreatment
}: ActivePlansProps) => {
  const planOnHold = selectedPlan?.status === 'ON_HOLD';

  const visiblePlanTreatments = useMemo(
    () => (selectedPlan ? planTreatments : []),
    [selectedPlan, planTreatments]
  );

  const treatmentRows = useMemo(
    () =>
      groupTreatmentRows(
        visiblePlanTreatments,
        existingDocumentation,
        true
      ).filter((row: any) => !row._sessionHeader),
    [visiblePlanTreatments, existingDocumentation]
  );

  const treatmentsRefreshing =
    existingFetching ||
    (Boolean(selectedPlan) && treatmentsFetching);

  const treatmentsLoading =
    treatmentRows.length === 0 && treatmentsRefreshing;

  const showTreatmentTable =
    Boolean(selectedPlan) ||
    existingDocumentation.length > 0 ||
    existingFetching;

  const planTableHeight = Math.min(
    320,
    Math.max(170, plans.length * 65 + 70)
  );

  const planColumns = useMemo(
    () => [
      {
        key: 'planNumber',
        title: <Translate>Plan Number</Translate>,
        width: 145,
        render: (row: any) => (
          <span className="ap-plan-number">
            {row.planNumber || EMPTY_VALUE}
          </span>
        )
      },
      {
        key: 'title',
        title: <Translate>Plan Title</Translate>,
        width: 220,
        render: (row: any) => (
          <span className="ap-plan-title">
            {row.title || EMPTY_VALUE}
          </span>
        )
      },
      {
        key: 'practitioner',
        title: <Translate>Practitioner</Translate>,
        width: 170,
        render: (row: any) =>
          practitionerDisplayName(practitioners, row.practitionerId)
      },
      {
        key: 'originEncounter',
        title: <Translate>Origin Encounter</Translate>,
        width: 145,
        render: (row: any) => (
          <span className="ap-meta-value">
            {row.originEncounterNumber || EMPTY_VALUE}
          </span>
        )
      },
      {
        key: 'createdDate',
        title: <Translate>Created At</Translate>,
        width: 125,
        render: (row: any) => (
          <span className="ap-meta-value">
            {formatDate(row.createdDate)}
          </span>
        )
      },
      {
        key: 'status',
        title: <Translate>Status</Translate>,
        width: 140,
        render: (row: any) => <PlanStatus status={row.status} />
      },
      {
        key: 'progress',
        title: <Translate>Progress</Translate>,
        width: 130,
        render: (row: any) => (
          <div className="ap-plan-progress">
            <PlanProgress plan={row} />
          </div>
        )
      },
      {
        key: 'actions',
        title: <Translate>Actions</Translate>,
        width: 85,
        render: (row: any) => (
          <Box
            className="ap-actions"
            onClick={event => event.stopPropagation()}
          >
            <RowAction
              label="View Plan"
              className="ap-action--view"
              icon={faEye}
              onClick={() => onViewPlan(row)}
            />
          </Box>
        )
      }
    ],
    [practitioners, onViewPlan]
  );

  const treatmentColumns = useMemo(
    () => [
      {
        key: 'visitNumber',
        title: <Translate>Session Number</Translate>,
        width: 130,
        render: (row: any) => row.visitNumber ?? EMPTY_VALUE
      },
      {
        key: 'toothNumber',
        title: <Translate>Tooth / Area</Translate>,
        width: 130,
        render: (row: any) => {
          if (isGroupedScope(row.treatmentScope)) {
            return (
              <span className="ap-area-tag">
                <Translate>
                  {treatmentScopeLabel(row.treatmentScope)}
                </Translate>
              </span>
            );
          }

          const toothNumber =
            row.tooth?.toothNumber ||
            teethById[row.toothId]?.toothNumber;

          return (
            <span className="ap-tooth-number">
              {toothNumber
                ? toothDisplayLabel(toothNumber)
                : row.toothId ?? EMPTY_VALUE}
            </span>
          );
        }
      },
      {
        key: 'surface',
        title: <Translate>Surface</Translate>,
        width: 105,
        render: (row: any) => (
          <span className="ap-muted">
            {formatSurfaces(row) || EMPTY_VALUE}
          </span>
        )
      },
      {
        key: 'cdt',
        title: <Translate>CDT</Translate>,
        width: 230,
        render: (row: any) => {
          const cdt =
            row.cdtCodeId != null ? cdtMap[row.cdtCodeId] : null;

          return cdt ? (
            <div className="ap-procedure">
              <span className="ap-procedure-code">
                {cdt.code || EMPTY_VALUE}
              </span>

              <span className="ap-procedure-description">
                {cdt.description || EMPTY_VALUE}
              </span>
            </div>
          ) : (
            <span className="ap-procedure-description">
              {row.dentalActionDescription || EMPTY_VALUE}
            </span>
          );
        }
      },
      {
        key: 'dentalProcedure',
        title: <Translate>Dental Procedure</Translate>,
        width: 185,
        render: (row: any) => (
          <span className="ap-service-name">
            {(row.procedureId != null
              ? dentalProceduresMap[row.procedureId]?.name
              : null) ||
              (row.serviceId != null
                ? dentalServicesMap[row.serviceId]?.name
                : null) ||
              EMPTY_VALUE}
          </span>
        )
      },
      {
        key: 'price',
        title: <Translate>Unit Price</Translate>,
        width: 95,
        render: (row: any) => (
          <span className="ap-number">
            {isExistingDocumentation(row)
              ? EMPTY_VALUE
              : formatMoney(row.price)}
          </span>
        )
      },
      {
        key: 'quantity',
        title: <Translate>Quantity</Translate>,
        width: 90,
        render: (row: any) => (
          <span className="ap-number">
            {isExistingDocumentation(row)
              ? EMPTY_VALUE
              : row.quantity ?? 1}
          </span>
        )
      },
      {
        key: 'discount',
        title: <Translate>Discount Amount</Translate>,
        width: 110,
        render: (row: any) => (
          <span className="ap-number">
            {isExistingDocumentation(row)
              ? EMPTY_VALUE
              : formatMoney(
                  lineDiscountAmount(row.price, row.quantity ?? 1, row.discount, row.discountType)
                )}
          </span>
        )
      },
      {
        key: 'netTotal',
        title: <Translate>Net Total</Translate>,
        width: 100,
        render: (row: any) => (
          <span className="ap-number">
            {isExistingDocumentation(row)
              ? EMPTY_VALUE
              : formatLineNet(
                  row.price,
                  row.quantity ?? 1,
                  row.discount,
                  row.discountType
                )}
          </span>
        )
      },
      {
        key: 'status',
        title: <Translate>Status</Translate>,
        width: 175,
        render: (row: any) => {
          const existing = isExistingDocumentation(row);

          const status = row.cancelled
            ? 'cancelled'
            : existing || isCompleted(row)
              ? 'completed'
              : isInProgress(row)
                ? 'in-progress'
                : 'pending';

          const labels = {
            cancelled: 'Cancelled',
            completed: 'Completed',
            'in-progress': 'In Progress',
            pending: 'Pending'
          };

          return (
            <Box className="ap-status-group">
              <span className={`ap-status ap-status--${status}`}>
                <span className="ap-status-dot" aria-hidden="true" />
                <Translate>{labels[status]}</Translate>
              </span>

              {existing && (
                <span className="ap-status ap-status--existing">
                  <Translate>Existing</Translate>
                </span>
              )}
            </Box>
          );
        }
      },
      {
        key: 'actions',
        title: <Translate>Actions</Translate>,
        width: 175,
        render: (row: any) => (
          <Box
            className="ap-actions"
            onClick={event => event.stopPropagation()}
            onKeyDown={event => event.stopPropagation()}
          >
            <TreatmentRowActions
              row={row}
              actionsDisabled={actionsDisabled || readOnly}
              canAddTreatment={canAddTreatment}
              canExecute={canExecute}
              canReturn={canReturn}
              completingId={completingId}
              onViewTreatment={onViewTreatment}
              onEditTreatment={onEditTreatment}
              onStartTreatment={onStartTreatment}
              onCompleteTreatment={onCompleteTreatment}
              onCancelTreatment={onCancelTreatment}
              onReturnTreatment={onReturnTreatment}
            />
          </Box>
        )
      }
    ],
    [
      actionsDisabled,
      readOnly,
      canAddTreatment,
      canExecute,
      canReturn,
      cdtMap,
      completingId,
      dentalProceduresMap,
      dentalServicesMap,
      onCancelTreatment,
      onCompleteTreatment,
      onEditTreatment,
      onStartTreatment,
      onViewTreatment,
      onReturnTreatment,
      teethById
    ]
  );

  return (
    <div className="tp-tab-panel ap-page">
      <section className="ap-plans-section">
        <div className="ap-section-header">
          <div className="ap-section-heading">
            <div className="ap-title-line">
              <h4>
                <Translate>Treatment Plans</Translate>
              </h4>
              <span className="ap-count">{plans.length}</span>
            </div>

            <p>
              <Translate>
                Select a plan from the table to display its treatments below.
              </Translate>
            </p>
          </div>

          <div className="ap-section-actions">
            <MyButton
              prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
              onClick={onNewPlan}
              disabled={newPlanDisabled}
            >
              <Translate>New Treatment Plan</Translate>
            </MyButton>
            <MyButton
              prefixIcon={() => <FontAwesomeIcon icon={faCalendarPlus} />}
              onClick={onBookAppointment}
              disabled={bookAppointmentDisabled}
            >
              <Translate>Book Appointment</Translate>
            </MyButton>
          </div>
        </div>

        {plansError ? (
          <div className="ap-message" role="alert">
            <Translate>Could not load treatment plans.</Translate>

            <MyButton appearance="link" onClick={onRetryPlans}>
              <Translate>Retry</Translate>
            </MyButton>
          </div>
        ) : (
          <div className="ap-table-container">
            <MyTable
              data={plans}
              columns={planColumns}
              loading={plansLoading}
              height={planTableHeight}
              onRowClick={rowData => onViewPlan(rowData)}
              rowClassName={rowData =>
                rowData.id === selectedPlan?.id ? 'selected-row' : ''
              }
            />
          </div>
        )}

        {!plansLoading && !plansError && plans.length === 0 && (
          <div className="ap-table-note">
            <Translate>
              Create a treatment plan to start adding treatments.
            </Translate>
          </div>
        )}
      </section>

      <section className="ap-treatments-section">
        <div className="ap-section-header ap-treatments-header">
          <div className="ap-title-line ap-treatments-title-line">
            <h4>
              <Translate>Treatments</Translate>
            </h4>

            {selectedPlan && (
              <span className="ap-count-label">
                <Translate>Planned</Translate>
                <span className="ap-count">
                  {visiblePlanTreatments.length}
                </span>
              </span>
            )}

            {existingDocumentation.length > 0 && (
              <span className="ap-count-label">
                <Translate>Existing</Translate>
                <span className="ap-count">
                  {existingDocumentation.length}
                </span>
              </span>
            )}

            {selectedPlan && (
              <div className="ap-plan-identity">
                <span className="ap-plan-number">
                  {selectedPlan.planNumber || EMPTY_VALUE}
                </span>

                <strong className="ap-details-title">
                  {selectedPlan.title || EMPTY_VALUE}
                </strong>

                <PlanStatus status={selectedPlan.status} />
              </div>
            )}
          </div>

          {selectedPlan && (
            <div className="ap-treatments-actions">
              <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
                onClick={onAddTreatment}
                disabled={actionsDisabled || !canAddTreatment}
              >
                <Translate>Add Treatment</Translate>
              </MyButton>

              {selectedPlan.status === 'DRAFT' ? (
                <MyButton
                  prefixIcon={() => <FontAwesomeIcon icon={faTooth} />}
                  onClick={onPropose}
                  disabled={
                    actionsDisabled || visiblePlanTreatments.length < 1
                  }
                >
                  <Translate>Propose</Translate>
                </MyButton>
              ) : (
                <MyButton
                  prefixIcon={() => <FontAwesomeIcon icon={faTooth} />}
                  onClick={onOpenChart}
                >
                  <Translate>View Chart</Translate>
                </MyButton>
              )}

              <MyButton appearance="link" onClick={onCloseDetails}>
                <Translate>Clear Selection</Translate>
              </MyButton>
            </div>
          )}
        </div>

        {selectedPlan ? (
          (selectedPlan.notes || planOnHold) && (
            <div className="ap-plan-details">
              {selectedPlan.notes && (
                <div className="ap-note">
                  <span className="ap-note-label">
                    <Translate>Plan Notes</Translate>
                  </span>
                  <p>{selectedPlan.notes}</p>
                </div>
              )}

              {planOnHold && (
                <div className="ap-hold-notice">
                  <FontAwesomeIcon icon={faCircleInfo} />

                  <div>
                    <strong>
                      <Translate>This plan is on hold.</Translate>
                    </strong>

                    {selectedPlan.holdReason && (
                      <p>{selectedPlan.holdReason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="ap-selection-message">
            <FontAwesomeIcon icon={faCircleInfo} />

            <div>
              <strong>
                <Translate>No treatment plan selected</Translate>
              </strong>

              <p>
                <Translate>
                  Click any plan row in the table above to display its treatments here.
                </Translate>
              </p>
            </div>
          </div>
        )}

        {selectedPlan && treatmentsError && (
          <div className="ap-message ap-message--inline" role="alert">
            <Translate>Could not load planned treatments.</Translate>

            <MyButton
              appearance="link"
              onClick={onRetryTreatments}
            >
              <Translate>Retry</Translate>
            </MyButton>
          </div>
        )}

        {showTreatmentTable && (
          <div className="ap-table-container">
            <MyTable
              data={treatmentRows}
              columns={treatmentColumns}
              loading={treatmentsLoading}
              height={420}
              onRowClick={rowData => onViewTreatment(rowData)}
              rowClassName={rowData =>
                rowData.cancelled ? 'ap-cancelled-row' : ''
              }
            />
          </div>
        )}

        {selectedPlan &&
          !treatmentsFetching &&
          !existingFetching &&
          !treatmentsError &&
          visiblePlanTreatments.length === 0 && (
            <div className="ap-table-note">
              <Translate>
                This plan has no planned treatments.
              </Translate>

              {canAddTreatment && (
                <span>
                  {' '}
                  <Translate>Use Add Treatment to begin.</Translate>
                </span>
              )}
            </div>
          )}

        {showTreatmentTable && (
          <div className="ap-table-footer">
            <span>
              <Translate>
                Existing treatments are documentation only and do not affect plan progress.
              </Translate>
            </span>

            {treatmentsRefreshing && !treatmentsLoading && (
              <span role="status">
                <Translate>Updating...</Translate>
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default ActivePlans;