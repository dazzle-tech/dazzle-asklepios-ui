import React, { useMemo, useRef } from 'react';
import { Popover, Whisper } from 'rsuite';
import Tooth from '@/components/NewDentalChart/Tooth/Tooth';
import {
  MIXED_ARCH_MIDLINE_SLOT,
  MIXED_ARCH_POSITIONS,
  MIXED_MAX_TEETH_PER_ARCH,
  MIXED_MAX_TEETH_TOTAL,
  addMixedToothToPosition,
  canAddMixedTooth,
  counterpartToothId,
  dentitionGroupsForChartType,
  emptyMixedPositions,
  isPrimaryToothId,
  mixedPositionConflicts,
  mixedPositionSelection,
  mixedPositionToothIds,
  mixedToothCounts,
  orderMixedToothIds,
  replaceMixedTooth,
  toothLabelFromSnapshot,
  type ToothLabelMap,
  type MixedArch,
  type MixedPosition,
  type MixedSide,
  type ToothNumberingSystem
} from '@/utils/toothNumberingSystems';
import '@/components/NewDentalChart/styles.less';
import './styles.less';

type ToothIdsUpdater = string[] | ((prev: string[]) => string[]);

type SetupToothSelectorProps = {
  chartType?: string | null;
  numberingSystem?: ToothNumberingSystem | string | null;
  /** Labels of a selected custom numbering method; null keeps the built-in system labels. */
  numberingLabels?: ToothLabelMap | null;
  selectedToothIds: string[];
  /** Tooth id to the reason it cannot be removed or replaced; those teeth keep their controls disabled. */
  lockedTeeth?: Record<string, string>;
  onChange: (toothIds: ToothIdsUpdater) => void;
};

type PickerGroup = {
  key: string;
  /** Names the target position so the user knows what the choice fills or replaces. */
  heading: string;
  toothIds: string[];
};

type TeethPickerProps = {
  arch: MixedArch;
  groups: PickerGroup[];
  numberingSystem?: ToothNumberingSystem | string | null;
  numberingLabels?: ToothLabelMap | null;
  dir: 'ltr' | 'rtl';
  title: string;
  hint?: string;
  triggerClassName: string;
  triggerLabel: string;
  triggerTitle: string;
  triggerContent: React.ReactNode;
  disabled?: boolean;
  onPick: (toothId: string) => void;
};

/**
 * One anchored picker used by every add/replace entry point. Closing it
 * (outside click, Esc) never changes the inventory; only choosing a tooth does.
 */
const TeethPicker: React.FC<TeethPickerProps> = ({
  arch,
  groups,
  numberingSystem,
  numberingLabels,
  dir,
  title,
  hint,
  triggerClassName,
  triggerLabel,
  triggerTitle,
  triggerContent,
  disabled,
  onPick
}) => {
  // Whisper's onOpen/onClose fire only after the overlay has animated in/out, so
  // a controlled `open` can never flip on click. Leave it uncontrolled and close
  // through the ref after a pick.
  const whisperRef = useRef<any>(null);

  return (
    <Whisper
      ref={whisperRef}
      trigger="click"
      placement={arch === 'upper' ? 'bottom' : 'top'}
      disabled={disabled}
      speaker={
        <Popover className="dcs-add-popover">
          <div dir={dir} className="dcs-add-popover-body">
            <strong className="dcs-add-popover-title">{title}</strong>
            {hint && <p className="dcs-add-popover-hint">{hint}</p>}
            {groups.length === 0 ? (
              <span className="dcs-arch-empty">No teeth available</span>
            ) : (
              <div className="dcs-add-popover-groups" dir="ltr">
                {groups.map(group => (
                  <div key={group.key} className="dcs-add-popover-group">
                    <span className="dcs-add-popover-group-heading">{group.heading}</span>
                    <div className="dcs-add-popover-teeth">
                      {group.toothIds.map(toothId => {
                        const primary = isPrimaryToothId(toothId);
                        const label = toothLabelFromSnapshot(toothId, numberingLabels, numberingSystem);
                        return (
                          <button
                            key={toothId}
                            type="button"
                            className="dcs-pick-option"
                            title={`${label} (${primary ? 'Primary' : 'Permanent'})`}
                            aria-label={`${title}: ${primary ? 'primary' : 'permanent'} tooth ${label}`}
                            onClick={() => {
                              onPick(toothId);
                              whisperRef.current?.close();
                            }}
                          >
                            <span className="dcs-tooth-label">{label}</span>
                            <span className="dcs-tooth-visual">
                              <Tooth
                                chartTooth={{ toothNumber: toothId, actions: [] }}
                                selected={false}
                                flipVertical={primary && arch === 'upper'}
                              />
                            </span>
                            <span className="dcs-pick-kind">
                              {primary ? 'Primary' : 'Permanent'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Popover>
      }
    >
      <button
        type="button"
        className={triggerClassName}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-label={triggerLabel}
        title={triggerTitle}
      >
        {triggerContent}
      </button>
    </Whisper>
  );
};

const SetupToothSelector: React.FC<SetupToothSelectorProps> = ({
  chartType,
  numberingSystem,
  numberingLabels,
  selectedToothIds,
  lockedTeeth,
  onChange
}) => {
  const selectedSet = useMemo(
    () => new Set(selectedToothIds ?? []),
    [selectedToothIds]
  );

  const groups = useMemo(
    () => dentitionGroupsForChartType(chartType),
    [chartType]
  );

  const pageDir =
    (localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'rtl' : 'ltr';

  const updateToothNumbers = (updater: (prev: string[]) => string[]) => {
    onChange(prev => {
      const current = Array.isArray(prev) ? prev : [];
      return updater(current);
    });
  };

  const toggleAdultChildTooth = (toothId: string) => {
    updateToothNumbers(prev => {
      if (prev.includes(toothId)) {
        if (lockedTeeth?.[toothId]) {
          return prev;
        }
        return prev.filter(id => id !== toothId);
      }
      return [...prev, toothId];
    });
  };

  // Every "+" (empty slot or side shortcut) adds through the same validated helper.
  const addMixedTooth = (toothId: string) =>
    updateToothNumbers(prev => addMixedToothToPosition(prev, toothId));

  // Atomic primary ↔ permanent swap in the same position (count unchanged).
  const replaceTooth = (fromId: string, toId: string) =>
    updateToothNumbers(prev => replaceMixedTooth(prev, fromId, toId));

  const removeMixedTooth = (toothId: string) => {
    updateToothNumbers(prev =>
      orderMixedToothIds(prev.filter(id => id !== toothId))
    );
  };

  const renderArch = (ids: string[], arch: 'upper' | 'lower') => (
    <div className={`dcs-arch dcs-arch--${arch}`} dir="ltr">
      {ids.map(toothId => {
        const selected = selectedSet.has(toothId);
        const primary = isPrimaryToothId(toothId);
        const label = toothLabelFromSnapshot(toothId, numberingLabels, numberingSystem);
        const lockedReason = selected ? lockedTeeth?.[toothId] : undefined;

        return (
          <button
            key={toothId}
            type="button"
            className={`dcs-tooth-cell${selected ? ' dcs-tooth-cell--selected' : ''}${
              primary ? ' dcs-tooth-cell--primary' : ' dcs-tooth-cell--permanent'
            }`}
            title={lockedReason ? `${label}: ${lockedReason}. It cannot be removed.` : `${label} (${toothId})`}
            aria-label={selected ? `Deselect tooth ${label}` : `Select tooth ${label}`}
            aria-pressed={selected}
            aria-disabled={Boolean(lockedReason)}
            onClick={() => toggleAdultChildTooth(toothId)}
          >
            {arch === 'upper' && (
              <span className="dcs-tooth-label">{label}</span>
            )}
            <span className="dcs-tooth-visual">
              <Tooth
                chartTooth={{ toothNumber: toothId, actions: [] }}
                selected={selected}
                flipVertical={primary && arch === 'upper'}
              />
            </span>
            {arch === 'lower' && (
              <span className="dcs-tooth-label">{label}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  const labelOf = (toothId: string) =>
    toothLabelFromSnapshot(toothId, numberingLabels, numberingSystem);

  const positionLabel = (position: MixedPosition) =>
    mixedPositionToothIds(position).map(labelOf).join(' / ');

  const renderToothVisual = (toothId: string, arch: MixedArch) => (
    <span className="dcs-tooth-visual">
      <Tooth
        chartTooth={{ toothNumber: toothId, actions: [] }}
        selected={false}
        flipVertical={isPrimaryToothId(toothId) && arch === 'upper'}
      />
    </span>
  );

  const renderMixedToothCell = (toothId: string, arch: MixedArch) => {
    const primary = isPrimaryToothId(toothId);
    const label = labelOf(toothId);
    const counterpart = counterpartToothId(toothId);
    const lockedReason = lockedTeeth?.[toothId];
    const canReplace = Boolean(counterpart) && !selectedSet.has(counterpart as string) && !lockedReason;
    const labelEl = <span className="dcs-tooth-label">{label}</span>;
    const visualEl = renderToothVisual(toothId, arch);

    return (
      <div
        className={`dcs-tooth-cell dcs-tooth-cell--slot dcs-tooth-cell--inventory dcs-tooth-cell--selected ${
          primary ? 'dcs-tooth-cell--primary' : 'dcs-tooth-cell--permanent'
        }`}
        title={lockedReason ? `${label}: ${lockedReason}` : `${label} (${primary ? 'Primary' : 'Permanent'})`}
      >
        <div className="dcs-tooth-action-row">
          {canReplace && counterpart && (
            <TeethPicker
              arch={arch}
              dir={pageDir}
              numberingSystem={numberingSystem}
              numberingLabels={numberingLabels}
              title={`Replace ${primary ? 'primary' : 'permanent'} ${label}`}
              hint={`Choose the ${primary ? 'permanent' : 'primary'} tooth that takes its place. Other teeth are not changed.`}
              groups={[
                {
                  key: toothId,
                  heading: `Replace ${label} with`,
                  toothIds: [counterpart]
                }
              ]}
              triggerClassName="dcs-tooth-replace"
              triggerLabel={`Replace tooth ${label} with ${primary ? 'permanent' : 'primary'} tooth ${labelOf(counterpart)}`}
              triggerTitle={`Replace with ${labelOf(counterpart)}`}
              triggerContent="⇄"
              onPick={next => replaceTooth(toothId, next)}
            />
          )}
          <button
            type="button"
            className="dcs-tooth-remove"
            aria-label={`Remove tooth ${label}`}
            title={lockedReason ? `Cannot remove or replace ${label}: ${lockedReason}` : `Remove ${label}`}
            disabled={Boolean(lockedReason)}
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              removeMixedTooth(toothId);
            }}
          >
            ×
          </button>
        </div>
        {arch === 'upper' ? (
          <>
            {labelEl}
            {visualEl}
          </>
        ) : (
          <>
            {visualEl}
            {labelEl}
          </>
        )}
      </div>
    );
  };

  // Dashed placeholder derived from the inventory (never saved); keeps its exact
  // anatomical position and shows the numbering of the teeth that fit there.
  const renderEmptyPosition = (position: MixedPosition) => {
    const { arch } = position;
    const disabled = !canAddMixedTooth(selectedToothIds, arch);
    const label = positionLabel(position);
    const trigger = (
      <TeethPicker
        arch={arch}
        dir={pageDir}
        numberingSystem={numberingSystem}
        numberingLabels={numberingLabels}
        title={`Add tooth at position ${label}`}
        groups={[
          {
            key: `${arch}-${position.slot}`,
            heading: `Position ${label}`,
            toothIds: mixedPositionToothIds(position)
          }
        ]}
        triggerClassName="dcs-slot-add-btn"
        triggerLabel={`Add tooth at position ${label}, ${arch} arch`}
        triggerTitle={disabled ? 'Tooth limit reached' : `Add tooth at position ${label}`}
        triggerContent="+"
        disabled={disabled}
        onPick={addMixedTooth}
      />
    );
    const labelEl = (
      <span className="dcs-tooth-label dcs-empty-slot-label">
        {mixedPositionToothIds(position).map(labelOf).map(text => (
          <span key={text}>{text}</span>
        ))}
      </span>
    );
    return (
      <div className="dcs-tooth-cell dcs-tooth-cell--slot dcs-tooth-cell--empty">
        {arch === 'upper' ? (
          <>
            {labelEl}
            {trigger}
          </>
        ) : (
          <>
            {trigger}
            {labelEl}
          </>
        )}
      </div>
    );
  };

  // 16 fixed positions per arch (patient right on the screen-left), midline between
  // slots 8 and 9. Stays LTR in RTL pages so R/L never flips.
  const renderMixedArchRow = (arch: MixedArch) => {
    const limitReached = !canAddMixedTooth(selectedToothIds, arch);
    const sideShortcut = (side: MixedSide) => {
      const targets = emptyMixedPositions(selectedToothIds, arch, side);
      return (
        <TeethPicker
          arch={arch}
          dir={pageDir}
          numberingSystem={numberingSystem}
          numberingLabels={numberingLabels}
          title={`Add tooth, ${arch} arch, patient ${side}`}
          hint="Each group is one empty position on this side."
          groups={targets.map(position => ({
            key: `${arch}-${position.slot}`,
            heading: `Position ${positionLabel(position)}`,
            toothIds: mixedPositionToothIds(position)
          }))}
          triggerClassName="dcs-arch-add-btn"
          triggerLabel={`Add tooth, ${arch} arch, patient ${side}`}
          triggerTitle={
            limitReached
              ? 'Tooth limit reached'
              : targets.length === 0
              ? 'No empty positions on this side'
              : `Add tooth (${arch} arch, patient ${side})`
          }
          triggerContent="+"
          disabled={limitReached || targets.length === 0}
          onPick={addMixedTooth}
        />
      );
    };

    return (
      <div className={`dcs-mixed-arch dcs-mixed-arch--${arch}`} dir="ltr">
        {sideShortcut('right')}
        <div className="dcs-mixed-arch-teeth">
          {MIXED_ARCH_POSITIONS[arch].map(position => {
            const occupied = mixedPositionSelection(position, selectedToothIds);
            return (
              <div
                key={position.slot}
                className={`dcs-tooth-slot${
                  position.slot === MIXED_ARCH_MIDLINE_SLOT ? ' dcs-tooth-slot--midline' : ''
                }${occupied.length > 1 ? ' dcs-tooth-slot--conflict' : ''}`}
                title={occupied.length > 1 ? 'Primary and permanent tooth both selected' : undefined}
              >
                {occupied.length === 0
                  ? renderEmptyPosition(position)
                  : occupied.map(toothId => (
                      <React.Fragment key={toothId}>
                        {renderMixedToothCell(toothId, arch)}
                      </React.Fragment>
                    ))}
              </div>
            );
          })}
        </div>
        {sideShortcut('left')}
      </div>
    );
  };

  if (chartType === 'MIXED') {
    const isEmpty = selectedToothIds.length < 1;
    const counts = mixedToothCounts(selectedToothIds);
    const conflicts = mixedPositionConflicts(selectedToothIds);
    const countLabel = `${counts.total}/${MIXED_MAX_TEETH_TOTAL} teeth · Upper ${counts.upper}/${MIXED_MAX_TEETH_PER_ARCH} · Lower ${counts.lower}/${MIXED_MAX_TEETH_PER_ARCH}`;

    return (
      <div className="dcs-tooth-selector dcs-tooth-selector--mixed">
        <div className="dcs-mixed-toolbar">
          <div className="dcs-mixed-toolbar-meta">
            <h5 className="dcs-mixed-toolbar-title">Mixed inventory</h5>
            <span className="dcs-mixed-count">{countLabel}</span>
          </div>
        </div>

        {isEmpty && (
          <p className="dcs-empty-inventory-error" role="alert">
            Select at least one tooth before saving.
          </p>
        )}
        {conflicts.length > 0 && (
          <p className="dcs-empty-inventory-error" role="alert">
            Position conflict: {conflicts.map(positionLabel).join('; ')} each have both a
            primary and a permanent tooth selected. Remove one tooth per position (or use
            Replace) before saving.
          </p>
        )}

        <section className="dcs-dentition-group dcs-dentition-group--mixed-inventory">
          {renderMixedArchRow('upper')}
          <div className="dcs-arch-divider" />
          {renderMixedArchRow('lower')}
        </section>
      </div>
    );
  }

  if (!groups.length) {
    return null;
  }

  return (
    <div className="dcs-tooth-selector">
      <div className="dcs-selected-summary">
        <span className="dcs-selected-summary-label">Selected teeth</span>
        <p>
          {selectedToothIds.length
            ? selectedToothIds
                .map(id => toothLabelFromSnapshot(id, numberingLabels, numberingSystem))
                .join(', ')
            : 'None selected'}
          {selectedToothIds.length > 0 ? ` (${selectedToothIds.length})` : ''}
        </p>
      </div>

      {groups.map(group => (
        <section
          key={group.key}
          className={`dcs-dentition-group dcs-dentition-group--${group.key}`}
        >
          <header className="dcs-dentition-header">
            <h5>{group.title}</h5>
            <span>
              {
                group.upper
                  .concat(group.lower)
                  .filter(id => selectedSet.has(id)).length
              }
              /{group.upper.length + group.lower.length}
            </span>
          </header>
          {renderArch(group.upper, 'upper')}
          <div className="dcs-arch-divider" />
          {renderArch(group.lower, 'lower')}
        </section>
      ))}
    </div>
  );
};

export default SetupToothSelector;
