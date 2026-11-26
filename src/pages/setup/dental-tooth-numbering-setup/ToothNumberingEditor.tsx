import React, { useMemo, useState } from 'react';
import { Form } from 'rsuite';
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Tooth from '@/components/NewDentalChart/Tooth/Tooth';
import {
  NUMBERING_LABEL_MAX,
  PERMANENT_LOWER_IDS,
  PERMANENT_UPPER_IDS,
  PRIMARY_LOWER_IDS,
  PRIMARY_UPPER_IDS,
  buildBulkLabels,
  isPrimaryToothId,
  numberingSequence,
  validateToothLabels,
  type DentitionGroup,
  type NumberingSequenceDirection,
  type ToothLabelMap
} from '@/utils/toothNumberingSystems';
import '@/components/NewDentalChart/styles.less';
import '../dental-chart-setup/styles.less';
import './styles.less';

type ToothNumberingEditorProps = {
  labels: ToothLabelMap;
  onChange: (next: ToothLabelMap | ((prev: ToothLabelMap) => ToothLabelMap)) => void;
};

const directionOptions = [
  { label: 'Forward (upper right → upper left → lower left → lower right)', value: 'FORWARD' },
  { label: 'Reverse', value: 'REVERSE' }
];

const SECTIONS: Array<{
  key: DentitionGroup;
  title: string;
  upper: string[];
  lower: string[];
  total: number;
}> = [
  { key: 'permanent', title: 'Permanent teeth', upper: PERMANENT_UPPER_IDS, lower: PERMANENT_LOWER_IDS, total: 32 },
  { key: 'primary', title: 'Primary teeth', upper: PRIMARY_UPPER_IDS, lower: PRIMARY_LOWER_IDS, total: 20 }
];

/**
 * Visual label editor. The chart shows label definitions for all 32 permanent and 20 primary
 * teeth; it is not a patient inventory, so the 16-per-arch / 32-total patient limit does not apply.
 * Rows stay left-to-right (patient right on the screen-left) even in RTL pages.
 */
const ToothNumberingEditor: React.FC<ToothNumberingEditorProps> = ({ labels, onChange }) => {
  const [activeToothId, setActiveToothId] = useState<string | null>(null);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [bulk, setBulk] = useState({ start: 1, step: 1, prefix: '', suffix: '' });
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [directionRecord, setDirectionRecord] = useState({ direction: 'FORWARD' });
  const direction: NumberingSequenceDirection =
    directionRecord.direction === 'REVERSE' ? 'REVERSE' : 'FORWARD';

  const validation = useMemo(() => validateToothLabels(labels), [labels]);

  const dentitionOf = (toothId: string): DentitionGroup =>
    isPrimaryToothId(toothId) ? 'primary' : 'permanent';

  const setLabel = (toothId: string, value: string) =>
    onChange(prev => ({ ...prev, [toothId]: value }));

  // Enter moves to the next tooth of the same dentition in the chosen sequence.
  const goToNext = (toothId: string) => {
    const sequence = numberingSequence(dentitionOf(toothId), direction);
    const index = sequence.indexOf(toothId);
    if (index >= 0 && index < sequence.length - 1) {
      setActiveToothId(sequence[index + 1]);
    }
  };

  const orderedSelection = useMemo(() => {
    const selected = new Set(bulkSelected);
    return (['permanent', 'primary'] as DentitionGroup[]).flatMap(group =>
      numberingSequence(group, direction).filter(id => selected.has(id))
    );
  }, [bulkSelected, direction]);

  const bulkValid =
    Number.isFinite(Number(bulk.start)) &&
    Number.isInteger(Number(bulk.step)) &&
    Number(bulk.step) !== 0;

  const bulkPreview = useMemo<ToothLabelMap>(
    () =>
      bulkValid && orderedSelection.length
        ? buildBulkLabels(orderedSelection, {
            start: Number(bulk.start),
            step: Number(bulk.step),
            prefix: bulk.prefix,
            suffix: bulk.suffix
          })
        : {},
    [bulkValid, orderedSelection, bulk]
  );

  const bulkTooLong = Object.values(bulkPreview).some(label => label.length > NUMBERING_LABEL_MAX);
  const overwriteIds = orderedSelection.filter(
    id => (labels[id] ?? '').trim() && labels[id].trim() !== bulkPreview[id]
  );

  const applyBulk = () => {
    if (!orderedSelection.length || !bulkValid || bulkTooLong) return;
    if (overwriteIds.length && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }
    onChange(prev => ({ ...prev, ...bulkPreview }));
    setBulkSelected([]);
    setConfirmOverwrite(false);
  };

  const toggleBulk = (toothId: string) => {
    setConfirmOverwrite(false);
    setBulkSelected(prev =>
      prev.includes(toothId) ? prev.filter(id => id !== toothId) : [...prev, toothId]
    );
  };

  // Select all adds the section's remaining teeth; when every tooth of the section is already
  // selected it clears just that section. Only the selection changes, never the labels.
  const toggleGroup = (ids: string[]) => {
    setConfirmOverwrite(false);
    setBulkSelected(prev => {
      const allSelected = ids.every(id => prev.includes(id));
      return allSelected
        ? prev.filter(id => !ids.includes(id))
        : Array.from(new Set([...prev, ...ids]));
    });
  };

  const renderCell = (toothId: string, arch: 'upper' | 'lower') => {
    const primary = isPrimaryToothId(toothId);
    const label = (labels[toothId] ?? '').trim();
    const preview = bulkPreview[toothId];
    const missing = !label;
    const duplicate = Boolean(validation.duplicates[toothId]);
    const tooLong = label.length > NUMBERING_LABEL_MAX;
    const shown = preview ?? (label || '—');

    const labelEl = (
      <span
        className={`dtn-label${preview !== undefined ? ' dtn-label--preview' : ''}`}
        title={duplicate ? 'Duplicate label' : missing ? 'Missing label' : undefined}
      >
        {shown}
      </span>
    );
    const visualEl = (
      <span className="dcs-tooth-visual">
        <Tooth
          chartTooth={{ toothNumber: toothId, actions: [] }}
          selected={activeToothId === toothId}
          flipVertical={primary && arch === 'upper'}
        />
      </span>
    );

    return (
      <div
        key={toothId}
        className={`dtn-cell${activeToothId === toothId ? ' dtn-cell--active' : ''}${
          missing ? ' dtn-cell--missing' : ''
        }${duplicate || tooLong ? ' dtn-cell--duplicate' : ''}${
          bulkSelected.includes(toothId) ? ' dtn-cell--bulk' : ''
        }`}
      >
        <label className="dtn-bulk-check" title="Select for bulk numbering">
          <input
            type="checkbox"
            checked={bulkSelected.includes(toothId)}
            onChange={() => toggleBulk(toothId)}
            aria-label={`Select ${toothId} for bulk numbering`}
          />
        </label>
        <button
          type="button"
          className="dtn-cell-button"
          aria-label={`Edit label of ${toothId}`}
          onClick={() => setActiveToothId(toothId)}
        >
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
        </button>
      </div>
    );
  };

  const renderSection = (section: (typeof SECTIONS)[number]) => {
    const sectionIds = [...section.upper, ...section.lower];
    const labelled = sectionIds.filter(id => (labels[id] ?? '').trim()).length;
    const allSelected = sectionIds.every(id => bulkSelected.includes(id));
    return (
      <section key={section.key} className={`dcs-dentition-group dcs-dentition-group--${section.key}`}>
        <header className="dcs-dentition-header">
          <h5>
            <Translate>{section.title}</Translate> ({section.total})
          </h5>
          <span>
            {labelled}/{section.total}
          </span>
          <MyButton
            appearance="ghost"
            color="var(--deep-blue)"
            onClick={() => toggleGroup(sectionIds)}
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </MyButton>
        </header>
        <div className="dtn-arch" dir="ltr">
          {section.upper.map(id => renderCell(id, 'upper'))}
        </div>
        <div className="dcs-arch-divider" />
        <div className="dtn-arch" dir="ltr">
          {section.lower.map(id => renderCell(id, 'lower'))}
        </div>
      </section>
    );
  };

  const issueCount =
    validation.missing.length + Object.keys(validation.duplicates).length + validation.tooLong.length;

  return (
    <div className="dtn-editor">
      <Form fluid className="dtn-controls">
        <MyInput
          width="100%"
          fieldName="direction"
          fieldLabel="Sequence direction (Enter and bulk numbering)"
          fieldType="select"
          selectData={directionOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={directionRecord}
          setRecord={setDirectionRecord}
          searchable={false}
        />
      </Form>

      <div className="dtn-active-editor">
        {activeToothId ? (
          <Form fluid>
            <div
              onKeyDownCapture={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  event.stopPropagation();
                  goToNext(activeToothId);
                }
              }}
            >
              <MyInput
                width="100%"
                fieldName="label"
                fieldLabel={`Label for ${activeToothId} (${
                  isPrimaryToothId(activeToothId) ? 'Primary' : 'Permanent'
                }) — Enter moves to the next tooth`}
                record={{ label: labels[activeToothId] ?? '' }}
                setRecord={updated => setLabel(activeToothId, updated.label ?? '')}
              />
            </div>
          </Form>
        ) : (
          <p className="dental-chart-setup-hint">
            <Translate>Select a tooth to edit its display label.</Translate>
          </p>
        )}
      </div>

      {issueCount > 0 && (
        <p className="dcs-empty-inventory-error" role="alert">
          {validation.missing.length > 0 && `${validation.missing.length} missing label(s). `}
          {Object.keys(validation.duplicates).length > 0 &&
            `${Object.keys(validation.duplicates).length} teeth share a label with another tooth of the same dentition. `}
          {validation.tooLong.length > 0 &&
            `${validation.tooLong.length} label(s) exceed ${NUMBERING_LABEL_MAX} characters. `}
          A method can be saved inactive while incomplete, but it must be complete to activate.
        </p>
      )}

      {SECTIONS.map(renderSection)}

      <div className="dtn-bulk">
        <h5>
          <Translate>Bulk numbering</Translate>
        </h5>
        <Form fluid className="dtn-bulk-form">
          <MyInput
            width="100%"
            fieldName="start"
            fieldLabel="Start"
            fieldType="number"
            record={bulk}
            setRecord={updated => {
              setConfirmOverwrite(false);
              setBulk(updated);
            }}
          />
          <MyInput
            width="100%"
            fieldName="step"
            fieldLabel="Step (integer)"
            fieldType="number"
            record={bulk}
            setRecord={updated => {
              setConfirmOverwrite(false);
              setBulk(updated);
            }}
          />
          <MyInput
            width="100%"
            fieldName="prefix"
            fieldLabel="Prefix"
            record={bulk}
            setRecord={updated => {
              setConfirmOverwrite(false);
              setBulk(updated);
            }}
          />
          <MyInput
            width="100%"
            fieldName="suffix"
            fieldLabel="Suffix"
            record={bulk}
            setRecord={updated => {
              setConfirmOverwrite(false);
              setBulk(updated);
            }}
          />
        </Form>
        <p className="dtn-bulk-summary">
          {orderedSelection.length} tooth(s) selected
          {orderedSelection.length > 0 && bulkValid && (
            <>
              {' '}
              — preview:{' '}
              {orderedSelection
                .slice(0, 6)
                .map(id => `${id}→${bulkPreview[id]}`)
                .join(', ')}
              {orderedSelection.length > 6 ? ` … +${orderedSelection.length - 6} more` : ''}
            </>
          )}
        </p>
        {!bulkValid && (
          <p className="dcs-empty-inventory-error" role="alert">
            Start must be a number and Step a non-zero integer.
          </p>
        )}
        {bulkTooLong && (
          <p className="dcs-empty-inventory-error" role="alert">
            Some generated labels exceed {NUMBERING_LABEL_MAX} characters.
          </p>
        )}
        {confirmOverwrite && (
          <p className="dcs-empty-inventory-error" role="alert">
            {overwriteIds.length} selected tooth(s) already have a different label. Press Apply
            again to overwrite them, or change the selection to cancel.
          </p>
        )}
        <div className="dtn-bulk-actions">
          <MyButton
            color="var(--deep-blue)"
            disabled={!orderedSelection.length || !bulkValid || bulkTooLong}
            onClick={applyBulk}
          >
            {confirmOverwrite ? 'Apply and overwrite' : 'Apply'}
          </MyButton>
          <MyButton
            appearance="ghost"
            color="var(--deep-blue)"
            disabled={!orderedSelection.length}
            onClick={() => {
              setBulkSelected([]);
              setConfirmOverwrite(false);
            }}
          >
            Clear selection
          </MyButton>
        </div>
      </div>
    </div>
  );
};

export default ToothNumberingEditor;
