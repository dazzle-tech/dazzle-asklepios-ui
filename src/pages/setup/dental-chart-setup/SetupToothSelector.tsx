import React, { useMemo } from 'react';
import Tooth from '@/components/NewDentalChart/Tooth/Tooth';
import {
  dentitionGroupsForChartType,
  formatSelectedToothSummary,
  isPrimaryToothId,
  toothDisplayLabelForSystem,
  type ToothNumberingSystem
} from '@/utils/toothNumberingSystems';
import '@/components/NewDentalChart/styles.less';
import './styles.less';

type SetupToothSelectorProps = {
  chartType?: string | null;
  numberingSystem?: ToothNumberingSystem | string | null;
  selectedToothIds: string[];
  onChange: (toothIds: string[]) => void;
};

const SetupToothSelector: React.FC<SetupToothSelectorProps> = ({
  chartType,
  numberingSystem,
  selectedToothIds,
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

  const toggleTooth = (toothId: string) => {
    if (selectedSet.has(toothId)) {
      onChange(selectedToothIds.filter(id => id !== toothId));
      return;
    }
    onChange([...selectedToothIds, toothId]);
  };

  const renderArch = (ids: string[], arch: 'upper' | 'lower') => (
    <div className={`dcs-arch dcs-arch--${arch}`}>
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
            aria-pressed={selected}
            onClick={() => toggleTooth(toothId)}
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
