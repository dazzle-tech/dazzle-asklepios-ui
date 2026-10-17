import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useMemo, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form, Loader } from 'rsuite';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import { useSaveEncounterDashboardPreferenceMutation } from '@/services/encounters/patientEncounterService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { DASHBOARD_WIDGET_KEYS } from './dashboardWidgets';

type DraftMap = Record<string, boolean>;

const emptyDraft = (): DraftMap =>
  Object.fromEntries(DASHBOARD_WIDGET_KEYS.map(key => [key, false]));

const draftFromKeys = (keys: string[]): DraftMap => {
  const selected = new Set(keys);
  return Object.fromEntries(DASHBOARD_WIDGET_KEYS.map(key => [key, selected.has(key)]));
};

const ChooseDashboardSections = ({
  open,
  setOpen,
  initialSelectedKeys = [],
  selectionReady,
  encounterId,
  userId,
  loadError,
  onRetry
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialSelectedKeys?: string[];
  selectionReady: boolean;
  encounterId?: number | null;
  userId?: string | number;
  loadError?: string | null;
  onRetry?: () => void;
}) => {
  const dispatch = useAppDispatch();
  const [savePreference] = useSaveEncounterDashboardPreferenceMutation();
  const [draft, setDraft] = useState<DraftMap>(emptyDraft);
  const [draftReady, setDraftReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDraftReady(false);
      setSaveError(null);
      setSaving(false);
      return;
    }
    if (!selectionReady || draftReady) return;
    setDraft(draftFromKeys(initialSelectedKeys));
    setDraftReady(true);
  }, [open, selectionReady, initialSelectedKeys, draftReady]);

  const selectAllRecord = useMemo(
    () => ({
      all: DASHBOARD_WIDGET_KEYS.every(key => draft[key])
    }),
    [draft]
  );

  const handleDraftChange = (record: DraftMap) => {
    setDraft(prev => {
      const next = { ...prev };
      DASHBOARD_WIDGET_KEYS.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(record, key)) {
          next[key] = !!record[key];
        }
      });
      return next;
    });
  };

  const handleSelectAllChange = (record: { all?: boolean }) => {
    const checked = !!record?.all;
    setDraft(Object.fromEntries(DASHBOARD_WIDGET_KEYS.map(key => [key, checked])));
  };

  const handleCancel = () => {
    setDraft(draftFromKeys(initialSelectedKeys));
    setSaveError(null);
  };

  const handleSave = async () => {
    if (saving) return;
    if (encounterId == null || userId == null) {
      const msg = 'Open an encounter while signed in to save dashboard preferences.';
      setSaveError(msg);
      dispatch(notify({ sev: 'error', msg }));
      throw new Error('dashboard-preferences-save-failed');
    }

    const nextKeys = DASHBOARD_WIDGET_KEYS.filter(key => draft[key]);
    setSaving(true);
    setSaveError(null);
    try {
      await savePreference({
        encounterId,
        userId,
        widgetKeys: nextKeys
      }).unwrap();
      setOpen(false);
    } catch {
      const msg = 'Failed to save dashboard preferences. Please try again.';
      setSaveError(msg);
      dispatch(notify({ sev: 'error', msg }));
      throw new Error('dashboard-preferences-save-failed');
    } finally {
      setSaving(false);
    }
  };

  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <div className="choose-sections-dashboard">
            {loadError && (
              <div className="dashboard-preference-feedback">
                <span>{loadError}</span>
                {onRetry && (
                  <button type="button" className="dashboard-preference-retry" onClick={onRetry}>
                    Retry
                  </button>
                )}
              </div>
            )}
            {saveError && <div className="dashboard-preference-feedback">{saveError}</div>}
            {!selectionReady && !loadError && (
              <div className="dashboard-preference-feedback">
                <Loader size="sm" />
                <span>Loading dashboard preferences...</span>
              </div>
            )}
            {selectionReady && draftReady && (
              <Form layout="vertical" fluid>
                <MyInput
                  fieldType="check"
                  fieldName="all"
                  fieldLabel="Select All"
                  record={selectAllRecord}
                  setRecord={handleSelectAllChange}
                  showLabel={false}
                />
                <MyInput
                  fieldType="check"
                  fieldName="c2"
                  fieldLabel="Previous Visit"
                  record={draft}
                  showLabel={false}
                  setRecord={handleDraftChange}
                />
                <MyInput
                  fieldType="check"
                  fieldName="c3"
                  fieldLabel="Chronic Diseases"
                  record={draft}
                  setRecord={handleDraftChange}
                  showLabel={false}
                />
                <MyInput
                  fieldType="check"
                  fieldName="c4"
                  fieldLabel="Patient Chronic Medication"
                  record={draft}
                  setRecord={handleDraftChange}
                  showLabel={false}
                />
                <MyInput
                  fieldType="check"
                  fieldName="c5"
                  fieldLabel="Patient Observation"
                  showLabel={false}
                  record={draft}
                  setRecord={handleDraftChange}
                />
                <MyInput
                  fieldType="check"
                  fieldName="c7"
                  fieldLabel="Active Allergies"
                  showLabel={false}
                  record={draft}
                  setRecord={handleDraftChange}
                />
                <MyInput
                  fieldType="check"
                  fieldName="c8"
                  fieldLabel="Medical Warnings"
                  showLabel={false}
                  record={draft}
                  setRecord={handleDraftChange}
                />
                <MyInput
                  fieldType="check"
                  fieldName="c9"
                  fieldLabel="Patient Plan"
                  showLabel={false}
                  record={draft}
                  setRecord={handleDraftChange}
                />
                <MyInput
                  fieldType="check"
                  fieldName="c11"
                  fieldLabel="Procedures"
                  showLabel={false}
                  record={draft}
                  setRecord={handleDraftChange}
                />
                <MyInput
                  fieldType="check"
                  fieldName="c12"
                  fieldLabel="Recent Test Results"
                  showLabel={false}
                  record={draft}
                  setRecord={handleDraftChange}
                />
                <MyInput
                  fieldType="check"
                  fieldName="c13"
                  fieldLabel="Primary Care Provider"
                  showLabel={false}
                  record={draft}
                  setRecord={handleDraftChange}
                />
                <MyInput
                  fieldType="check"
                  fieldName="c14"
                  fieldLabel="Previous Assessments"
                  showLabel={false}
                  record={draft}
                  setRecord={handleDraftChange}
                />
              </Form>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Customize"
      position="right"
      content={conjureFormContent}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      actionButtonLoading={saving}
      isDisabledActionBtn={saving || !selectionReady || !draftReady}
      handleCancelFunction={handleCancel}
      size="300px"
      steps={[{ title: 'Select Component', icon: <FontAwesomeIcon icon={faChartLine} /> }]}
    />
  );
};

export default ChooseDashboardSections;
