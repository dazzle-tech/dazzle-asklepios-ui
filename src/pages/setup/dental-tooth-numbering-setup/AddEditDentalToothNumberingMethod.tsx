import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import React, { useState } from 'react';
import { Form } from 'rsuite';
import { FaTeeth } from 'react-icons/fa6';
import {
  builtInToothLabels,
  numberingSystemLabel,
  type ToothLabelMap,
  type ToothNumberingSystem
} from '@/utils/toothNumberingSystems';
import ToothNumberingEditor from './ToothNumberingEditor';
import './styles.less';

const BUILT_IN_SYSTEMS: ToothNumberingSystem[] = [
  'UNIVERSAL',
  'FDI',
  'PALMER'
];

type CopyData = {
  labels: ToothLabelMap;
  name: string;
};

const AddEditDentalToothNumberingMethod = ({
  open,
  setOpen,
  width,
  method,
  setMethod,
  existingMethods,
  handleSave
}) => {
  const [copySource, setCopySource] = useState<{
    copyFrom: string | null;
  }>({ copyFrom: null });

  const [pendingCopy, setPendingCopy] = useState<CopyData | null>(null);

  const labels: ToothLabelMap = method?.toothLabels ?? {};

  const labelCount = Object.values(labels).filter(label =>
    (label ?? '').trim()
  ).length;

  const copyOptions = [
    { label: 'Blank (no labels)', value: 'BLANK' },
    ...BUILT_IN_SYSTEMS.map(system => ({
      label: `${numberingSystemLabel(system)} (built-in)`,
      value: `BUILTIN:${system}`
    })),
    ...(existingMethods ?? [])
      .filter(item => item.id && item.id !== method?.id)
      .map(item => ({
        label: item.name,
        value: `METHOD:${item.id}`
      }))
  ];

  const resolveCopy = (value: string): CopyData | null => {
    if (value === 'BLANK') {
      return { labels: {}, name: '' };
    }

    if (value.startsWith('BUILTIN:')) {
      const system = value.replace(
        'BUILTIN:',
        ''
      ) as ToothNumberingSystem;

      return {
        labels: builtInToothLabels(system),
        name: `Copy of ${numberingSystemLabel(system)}`
      };
    }

    if (value.startsWith('METHOD:')) {
      const source = (existingMethods ?? []).find(
        item => `METHOD:${item.id}` === value
      );

      return source
        ? {
            labels: { ...(source.toothLabels ?? {}) },
            name: `Copy of ${source.name}`
          }
        : null;
    }

    return null;
  };

  const applyCopy = (copy: CopyData) => {
    setMethod(prev => ({
      ...prev,
      toothLabels: copy.labels,
      name: prev?.name?.trim() ? prev.name : copy.name,
      isActive: false
    }));

    setPendingCopy(null);
  };

  const handleCopyChange = (updated: {
    copyFrom: string | null;
  }) => {
    setCopySource(updated);

    if (!updated.copyFrom) return;

    const copy = resolveCopy(updated.copyFrom);

    if (!copy) return;

    if (labelCount > 0) {
      setPendingCopy(copy);
      return;
    }

    applyCopy(copy);
  };

  const handleClose = (
    next: boolean | ((prev: boolean) => boolean)
  ) => {
    const resolved = typeof next === 'function' ? next(open) : next;

    if (!resolved) {
      setCopySource({ copyFrom: null });
      setPendingCopy(null);
    }

    setOpen(resolved);
  };

  const setLabels = (
    next: ToothLabelMap | ((prev: ToothLabelMap) => ToothLabelMap)
  ) => {
    setMethod(prev => {
      const current = prev?.toothLabels ?? {};

      return {
        ...prev,
        toothLabels:
          typeof next === 'function' ? next(current) : next
      };
    });
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const conjureFormContent = (stepNumber = 0) => {
    if (stepNumber !== 0) return null;

    return (
      <Form fluid className="dtn-method-form">
        <section className="dtn-method-section">
          <div className="dtn-method-section__header">
            <div>
              <h3 className="dtn-method-section__title">
                Method Details
              </h3>
              <p className="dtn-method-section__description">
                Name your numbering method and choose how to start.
              </p>
            </div>

            <span
              className={`dtn-method-status ${
                method?.isActive
                  ? 'dtn-method-status--active'
                  : 'dtn-method-status--inactive'
              }`}
            >
              {method?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="dtn-method-details-grid">
            <div className="dtn-method-field">
              <MyInput
                width="100%"
                fieldName="name"
                fieldLabel="Method Name"
                record={method}
                setRecord={setMethod}
              />
            </div>

            {!method?.id && (
              <div className="dtn-method-field">
                <MyInput
                  width="100%"
                  fieldName="copyFrom"
                  fieldLabel="Start from"
                  fieldType="select"
                  selectData={copyOptions}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={copySource}
                  setRecord={handleCopyChange}
                  placeholder="Blank or copy an existing method"
                  searchable={false}
                />
              </div>
            )}

            <div className="dtn-method-field dtn-method-field--full">
              <MyInput
                width="100%"
                fieldName="description"
                fieldLabel="Description (optional)"
                fieldType="textarea"
                record={method}
                setRecord={setMethod}
              />
            </div>
          </div>

          {pendingCopy && (
            <div className="dtn-method-copy-confirm" role="alert">
              <div className="dtn-method-copy-confirm__text">
                <strong>Replace existing labels?</strong>
                <span>
                  You have entered {labelCount} label(s). Applying this
                  source will replace them.
                </span>
              </div>

              <div className="dtn-method-copy-confirm__actions">
                <MyButton
                  appearance="ghost"
                  onClick={() => {
                    setPendingCopy(null);
                    setCopySource({ copyFrom: null });
                  }}
                >
                  Keep mine
                </MyButton>

                <MyButton onClick={() => applyCopy(pendingCopy)}>
                  Replace
                </MyButton>
              </div>
            </div>
          )}

          <div className="dtn-method-activation">
            <div className="dtn-method-activation__text">
              <span className="dtn-method-activation__title">
                Method availability
              </span>
              <p>
                Complete all 52 labels before activating. You can save
                incomplete methods as inactive.
              </p>
            </div>

            <div className="dtn-method-activation__control">
              <MyInput
                width="100%"
                fieldName="isActive"
                fieldLabel="Active"
                fieldType="checkbox"
                record={method}
                setRecord={setMethod}
              />
            </div>
          </div>
        </section>

        <section className="dtn-method-section dtn-method-section--editor">
          <div className="dtn-method-section__header">
            <div>
              <h3 className="dtn-method-section__title">
                Tooth Labels
              </h3>
              <p className="dtn-method-section__description">
                Assign labels to 32 permanent and 20 primary teeth.
              </p>
            </div>

            <span className="dtn-method-count">
              <strong>{labelCount}</strong>
              <span>/ 52 labelled</span>
            </span>
          </div>

          <div className="dtn-method-editor">
            <ToothNumberingEditor
              labels={labels}
              onChange={setLabels}
            />
          </div>

          <div className="dtn-method-note">
            Labels must be unique within each dentition. Existing
            charts retain the numbering they were created with.
          </div>
        </section>
      </Form>
    );
  };

  return (
    <MyModal
      open={open}
      setOpen={handleClose}
      title={
        method?.id
          ? 'Edit Tooth Numbering Method'
          : 'New Tooth Numbering Method'
      }
      position="right"
      content={stepNumber => (
        <div className="dtn-method-modal" dir={dir}>
          {conjureFormContent(stepNumber)}
        </div>
      )}
      actionButtonLabel={method?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[
        {
          title: 'Tooth Numbering Setup',
          icon: <FaTeeth />
        }
      ]}
      size={width > 900 ? '64vw' : width > 600 ? '80vw' : '94vw'}
    />
  );
};

export default AddEditDentalToothNumberingMethod;