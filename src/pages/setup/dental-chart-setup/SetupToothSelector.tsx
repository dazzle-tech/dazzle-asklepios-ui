import React, { useEffect, useMemo, useState } from 'react';
import Tooth from '@/components/NewDentalChart/Tooth/Tooth';
import MyModal from '@/components/MyModal/MyModal';
import {
  MIXED_ARCH_SLOT_COUNT,
  MIXED_LOWER_LAYOUT,
  MIXED_UPPER_LAYOUT,
  dentitionGroupsForChartType,
  formatSelectedToothSummary,
  isPrimaryToothId,
  orderMixedToothIds,
  toothDisplayLabelForSystem,
  type MixedArchLayout,
  type MixedArchSubrow,
  type ToothNumberingSystem
} from '@/utils/toothNumberingSystems';
import '@/components/NewDentalChart/styles.less';
import './styles.less';

type ToothIdsUpdater = string[] | ((prev: string[]) => string[]);

type SetupToothSelectorProps = {
  chartType?: string | null;
  numberingSystem?: ToothNumberingSystem | string | null;
  selectedToothIds: string[];
  onChange: (toothIds: ToothIdsUpdater) => void;
  addModalOpen?: boolean;
  onAddModalOpenChange?: (open: boolean) => void;
};

const SetupToothSelector: React.FC<SetupToothSelectorProps> = ({
  chartType,
  numberingSystem,
  selectedToothIds,
  onChange,
  addModalOpen: controlledAddModalOpen,
  onAddModalOpenChange
}) => {
  const selectedSet = useMemo(
    () => new Set(selectedToothIds ?? []),
    [selectedToothIds]
  );

  const groups = useMemo(
    () => dentitionGroupsForChartType(chartType),
    [chartType]
  );

  const mixedPickerGroups = useMemo(
    () => dentitionGroupsForChartType('MIXED'),
    []
  );

  const [uncontrolledAddModalOpen, setUncontrolledAddModalOpen] = useState(false);
  const isAddModalControlled = typeof controlledAddModalOpen === 'boolean';
  const addModalOpen = isAddModalControlled
    ? controlledAddModalOpen
    : uncontrolledAddModalOpen;

  const setAddModalOpen = (open: boolean) => {
    if (!isAddModalControlled) {
      setUncontrolledAddModalOpen(open);
    }
    onAddModalOpenChange?.(open);
  };

  useEffect(() => {
    setAddModalOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType]);

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
        return prev.filter(id => id !== toothId);
      }
      return [...prev, toothId];
    });
  };

  const toggleMixedTooth = (toothId: string) => {
    updateToothNumbers(prev => {
      if (prev.includes(toothId)) {
        return orderMixedToothIds(prev.filter(id => id !== toothId));
      }
      return orderMixedToothIds([...prev, toothId]);
    });
  };

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
        const label = toothDisplayLabelForSystem(toothId, numberingSystem);

        return (
          <button
            key={toothId}
            type="button"
            className={`dcs-tooth-cell${selected ? ' dcs-tooth-cell--selected' : ''}${
              primary ? ' dcs-tooth-cell--primary' : ' dcs-tooth-cell--permanent'
            }`}
            title={`${label} (${toothId})`}
            aria-label={selected ? `Deselect tooth ${label}` : `Select tooth ${label}`}
            aria-pressed={selected}
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

  const renderMixedSlotCell = ({
    toothId,
    arch,
    interactive,
    showRemove
  }: {
    toothId: string;
    arch: 'upper' | 'lower';
    interactive: boolean;
    showRemove: boolean;
  }) => {
    const primary = isPrimaryToothId(toothId);
    const label = toothDisplayLabelForSystem(toothId, numberingSystem);
    const selected = selectedSet.has(toothId);

    const removeButton = showRemove ? (
      <button
        type="button"
        className="dcs-tooth-remove"
        aria-label={`Remove tooth ${label}`}
        title={`Remove ${label}`}
        onClick={event => {
          event.preventDefault();
          event.stopPropagation();
          removeMixedTooth(toothId);
        }}
      >
        ×
      </button>
    ) : null;

    const labelEl = <span className="dcs-tooth-label">{label}</span>;
    const visualEl = (
      <span className="dcs-tooth-visual">
        <Tooth
          chartTooth={{ toothNumber: toothId, actions: [] }}
          selected={false}
          flipVertical={primary && arch === 'upper'}
        />
      </span>
    );

    const body =
      arch === 'upper' ? (
        <>
          {labelEl}
          {visualEl}
        </>
      ) : (
        <>
          {visualEl}
          {labelEl}
        </>
      );

    if (interactive) {
      return (
        <div
          className={`dcs-tooth-cell dcs-tooth-cell--slot${
            selected ? ' dcs-tooth-cell--selected' : ''
          }${primary ? ' dcs-tooth-cell--primary' : ' dcs-tooth-cell--permanent'}`}
        >
          <div className="dcs-tooth-action-row">{removeButton}</div>
          <button
            type="button"
            className="dcs-tooth-picker-toggle"
            title={
              selected
                ? `Remove ${label} from inventory`
                : `Add ${label} to inventory`
            }
            aria-label={
              selected
                ? `Remove tooth ${label} from inventory`
                : `Add tooth ${label} to inventory`
            }
            aria-pressed={selected}
            onClick={() => toggleMixedTooth(toothId)}
          >
            {body}
          </button>
        </div>
      );
    }

    return (
      <div
        className={`dcs-tooth-cell dcs-tooth-cell--slot dcs-tooth-cell--inventory dcs-tooth-cell--selected${
          primary ? ' dcs-tooth-cell--primary' : ' dcs-tooth-cell--permanent'
        }`}
        title={`${label} (${toothId})`}
      >
        <div className="dcs-tooth-action-row">{removeButton}</div>
        {body}
      </div>
    );
  };

  const renderMixedSubrow = (
    subrow: MixedArchSubrow,
    arch: 'upper' | 'lower',
    mode: 'inventory' | 'picker'
  ) => {
    const hasAny = subrow.slotIds.some(id => selectedSet.has(id));
    if (mode === 'inventory' && !hasAny) {
      return null;
    }

    return (
      <div
        className={`dcs-mixed-subrow dcs-mixed-subrow--${subrow.dentition} dcs-mixed-subrow--${arch}`}
        style={{
          gridTemplateColumns: `repeat(${MIXED_ARCH_SLOT_COUNT}, minmax(0, 1fr))`
        }}
      >
        {subrow.slotIds.map((toothId, index) => {
          const selected = selectedSet.has(toothId);
          const column = subrow.gridColumnStart + index;
          const style = { gridColumn: column } as React.CSSProperties;

          if (mode === 'inventory' && !selected) {
            return (
              <div
                key={`empty-${toothId}`}
                className="dcs-tooth-slot-spacer"
                style={style}
                aria-hidden
              />
            );
          }

          return (
            <div key={toothId} className="dcs-tooth-slot" style={style}>
              {renderMixedSlotCell({
                toothId,
                arch,
                interactive: mode === 'picker',
                showRemove: mode === 'inventory' || selected
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMixedArch = (
    layout: MixedArchLayout,
    mode: 'inventory' | 'picker'
  ) => {
    const permanentRow = renderMixedSubrow(layout.permanent, layout.arch, mode);
    const primaryRow = renderMixedSubrow(layout.primary, layout.arch, mode);
    if (!permanentRow && !primaryRow) {
      return (
        <div className={`dcs-mixed-arch dcs-mixed-arch--${layout.arch}`}>
          <span className="dcs-arch-empty">No teeth in this arch</span>
        </div>
      );
    }

    const rows =
      layout.arch === 'upper'
        ? [permanentRow, primaryRow]
        : [primaryRow, permanentRow];

    return (
      <div
        className={`dcs-mixed-arch dcs-mixed-arch--${layout.arch}`}
        dir="ltr"
      >
        {rows}
      </div>
    );
  };

  const renderSimplePickerArch = (ids: string[], arch: 'upper' | 'lower') => (
    <div className={`dcs-arch dcs-arch--${arch} dcs-arch--picker`} dir="ltr">
      {ids.map(toothId =>
        renderMixedSlotCell({
          toothId,
          arch,
          interactive: true,
          showRemove: selectedSet.has(toothId)
        })
      )}
    </div>
  );

  if (chartType === 'MIXED') {
    const isEmpty = selectedToothIds.length < 1;
    const countLabel = `${selectedToothIds.length} ${
      selectedToothIds.length === 1 ? 'tooth' : 'teeth'
    } selected`;

    return (
      <div className="dcs-tooth-selector dcs-tooth-selector--mixed">
        <div className="dcs-mixed-toolbar">
          <div className="dcs-mixed-toolbar-meta">
            <h5 className="dcs-mixed-toolbar-title">Mixed inventory</h5>
            <span className="dcs-mixed-count">{countLabel}</span>
          </div>
          <button
            type="button"
            className="dcs-add-tooth-btn"
            aria-haspopup="dialog"
            aria-expanded={addModalOpen}
            onClick={() => setAddModalOpen(true)}
          >
            + Add Tooth
          </button>
        </div>

        {isEmpty && (
          <p className="dcs-empty-inventory-error" role="alert">
            Select at least one tooth before saving.
          </p>
        )}

        <section className="dcs-dentition-group dcs-dentition-group--mixed-inventory">
          {renderMixedArch(MIXED_UPPER_LAYOUT, 'inventory')}
          <div className="dcs-arch-divider" />
          {renderMixedArch(MIXED_LOWER_LAYOUT, 'inventory')}
        </section>

        <MyModal
          open={addModalOpen}
          setOpen={next => {
            const resolved =
              typeof next === 'function' ? next(addModalOpen) : next;
            setAddModalOpen(Boolean(resolved));
          }}
          title="Add Tooth"
          position="center"
          size="min(94vw, 780px)"
          bodyheight="min(68vh, 560px)"
          hideActionBtn
          cancelButtonLabel="Close"
          customClassName="dcs-add-tooth-modal-root"
          content={
            <div dir={pageDir} className="dcs-add-tooth-modal">
              <p className="dcs-add-tooth-modal-hint">
                Click a tooth to add or remove it. Selected teeth show a × and
                stay highlighted. The modal stays open for multiple changes.
              </p>
              <p className="dcs-mixed-count dcs-add-tooth-modal-count">
                {countLabel}
              </p>
              {mixedPickerGroups.map(group => (
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
                  {renderSimplePickerArch(group.upper, 'upper')}
                  <div className="dcs-arch-divider" />
                  {renderSimplePickerArch(group.lower, 'lower')}
                </section>
              ))}
            </div>
          }
        />
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
          {formatSelectedToothSummary(selectedToothIds, numberingSystem)}
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
