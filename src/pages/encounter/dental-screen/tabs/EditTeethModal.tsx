import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { FaTeeth } from 'react-icons/fa6';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import SetupToothSelector from '@/pages/setup/dental-chart-setup/SetupToothSelector';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractErrorMessage } from '@/utils/extractErrorMessage';
import { toothDisplayLabel } from '@/utils/toothNumber';
import { buildInventoryChanges } from '@/utils/dentalInventoryChanges';
import {
  dentalChartService,
  useSaveChartInventoryMutation
} from '@/services/dental/dentalChartService';
import '@/pages/setup/dental-chart-setup/styles.less';

const REASON_MAX = 500;

type EditTeethModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  chart: any;
  encounterId?: number | null;
  width: number;
};

/**
 * Edits the tooth inventory of the current visit chart. It reuses the Setup position-aware
 * selector; saving sends one batch with one reason. Removing or replacing a tooth only changes the
 * inventory: it never records an extraction or shedding and never touches actions or treatments.
 */
const EditTeethModal: React.FC<EditTeethModalProps> = ({ open, setOpen, chart, encounterId, width }) => {
  const dispatch = useAppDispatch();
  const [saveInventory, { isLoading }] = useSaveChartInventoryMutation();

  const initialIds: string[] = useMemo(
    () => (chart?.teeth ?? []).map((tooth: any) => tooth.toothNumber),
    [chart?.teeth]
  );
  // Teeth with recorded work: the backend states why; the selector disables their removal/replacement.
  const lockedTeeth = useMemo(() => {
    const locked: Record<string, string> = {};
    (chart?.teeth ?? []).forEach((tooth: any) => {
      if (tooth.inventoryProtection) {
        locked[tooth.toothNumber] = tooth.inventoryProtection;
      }
    });
    return locked;
  }, [chart?.teeth]);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [form, setForm] = useState({ reason: '' });

  // Start every edit session from the saved inventory; Cancel simply discards the draft.
  useEffect(() => {
    if (open) {
      setSelectedIds(initialIds);
      setForm({ reason: '' });
    }
  }, [open, initialIds]);

  const numberingSystem = chart?.numberingSystem || 'UNIVERSAL';
  const numberingLabels = chart?.numberingLabels ?? null;
  const changes = useMemo(() => buildInventoryChanges(initialIds, selectedIds), [initialIds, selectedIds]);

  // Teeth leaving the inventory that still have open planned treatment: shown, never auto-handled.
  const pendingWarnings = useMemo(() => {
    const leaving = new Set<string>();
    changes.forEach(change => {
      if (change.action === 'REMOVE' || change.action === 'REPLACE') leaving.add(change.toothNumber);
    });
    return (chart?.teeth ?? [])
      .filter((tooth: any) => leaving.has(tooth.toothNumber) && (tooth.pendingTreatments ?? 0) > 0)
      .map((tooth: any) => ({
        label: toothDisplayLabel(tooth.toothNumber, numberingSystem, numberingLabels),
        count: tooth.pendingTreatments as number
      }));
  }, [changes, chart?.teeth, numberingSystem, numberingLabels]);

  const handleSave = async () => {
    const reason = form.reason.trim();
    if (!changes.length) {
      dispatch(notify({ msg: 'No inventory changes to save', sev: 'warning' }));
      return;
    }
    if (!reason) {
      dispatch(notify({ msg: 'A reason is required for the inventory change', sev: 'warning' }));
      return;
    }
    if (reason.length > REASON_MAX) {
      dispatch(notify({ msg: `The reason must be at most ${REASON_MAX} characters`, sev: 'warning' }));
      return;
    }
    if (chart?.id == null || chart?.version == null || encounterId == null) {
      dispatch(notify({ msg: 'Reload the chart before editing teeth', sev: 'error' }));
      return;
    }

    try {
      const result = await saveInventory({
        chartId: chart.id,
        body: { expectedVersion: chart.version, encounterId, reason, changes }
      }).unwrap();
      dispatch(notify({ msg: 'Tooth inventory saved', sev: 'success' }));
      (result?.warnings ?? []).forEach(warning => {
        dispatch(
          notify({
            msg: `${toothDisplayLabel(warning.toothNumber, numberingSystem, numberingLabels)} still has ${
              warning.pendingTreatments
            } open planned treatment(s). They were not cancelled or moved.`,
            sev: 'warning'
          })
        );
      });
      setOpen(false);
    } catch (err: any) {
      const message = extractErrorMessage(err) || 'Failed to save the tooth inventory';
      dispatch(notify({ msg: message, sev: 'error' }));
      // A stale save means the chart changed meanwhile: refresh it and let the user review again.
      if (err?.status === 409) {
        dispatch(dentalChartService.util.invalidateTags(['DentalChart']));
        setOpen(false);
      }
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction.toUpperCase() === 'RTL' ? 'rtl' : 'ltr';
  // Adult charts stay permanent-only; Pediatric and Mixed charts may hold both dentitions.
  const selectorChartType = chart?.chartType === 'ADULT' ? 'ADULT' : 'MIXED';

  const content = () => (
    <div dir={dir}>
      <Form fluid>
        <p className="dental-chart-setup-hint">
          Update which teeth the patient has. Earlier visit charts are not changed, and removing or replacing a
          tooth does not record an extraction or shedding.
        </p>
        <SetupToothSelector
          chartType={selectorChartType}
          numberingSystem={numberingSystem}
          numberingLabels={numberingLabels}
          selectedToothIds={selectedIds}
          lockedTeeth={lockedTeeth}
          onChange={setSelectedIds}
        />
        {pendingWarnings.length > 0 && (
          <div className="dcs-empty-inventory-error" role="alert">
            {pendingWarnings.map(warning => (
              <div key={warning.label}>
                Tooth {warning.label} has {warning.count} open planned treatment(s). They are not cancelled or
                moved when the tooth leaves the inventory.
              </div>
            ))}
          </div>
        )}
        <MyInput
          width="100%"
          fieldName="reason"
          fieldLabel="Reason for change"
          fieldType="textarea"
          record={form}
          setRecord={setForm}
        />
        <p className="dental-chart-setup-hint">
          {changes.length ? `${changes.length} change(s) pending` : 'No changes yet'}
        </p>
      </Form>
    </div>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Edit Teeth"
      position="right"
      content={() => content()}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      actionButtonLoading={isLoading}
      isDisabledActionBtn={!changes.length}
      steps={[{ title: 'Edit Teeth', icon: <FaTeeth /> }]}
      size={width > 900 ? '56vw' : width > 600 ? '72vw' : '92vw'}
    />
  );
};

export default EditTeethModal;
