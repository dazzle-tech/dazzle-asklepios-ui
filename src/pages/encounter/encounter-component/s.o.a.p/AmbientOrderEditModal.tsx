import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import PatientDiagnosisTable from '@/pages/encounter/medical-notes-and-assessments/patient-diagnosis/PatientDiagnosisTable';
import type { AmbientOrder } from '@/services/ai-services/ambientDraft';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetActiveIngredientsActiveByNameQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useGetPharmaceuticalsByActiveIngredientQuery } from '@/services/setup/activeIngredients/pharmaceuticalService';
import { useGetActiveDiagnosticTestsByTypeQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetAllPrescriptionInstructionsQuery } from '@/services/setup/prescription-instruction/prescriptionInstructionService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';

export type AmbientOrderKind = 'lab' | 'radiology' | 'medication' | 'follow_up' | 'other';

const CUSTOM = 'CUSTOM_INSTRUCTIONS';
const PREDEFINED = 'PRE_DEFINED_INSTRUCTIONS';
const MANUAL = 'MANUAL_INSTRUCTIONS';

export const ambientOrderKind = (kind?: string | null): AmbientOrderKind => {
  const value = (kind || '').toLowerCase();
  if (value === 'lab' || value === 'laboratory') return 'lab';
  if (value === 'rad' || value === 'radiology' || value === 'imaging') return 'radiology';
  if (value === 'medication' || value === 'prescription') return 'medication';
  if (value === 'follow_up' || value === 'followup' || value === 'follow-up') return 'follow_up';
  return 'other';
};

const suggestedText = (order: AmbientOrder) => {
  const payload = order.payload ?? {};
  return [payload.name, payload.test, payload.medication, payload.dose, payload.dosage, payload.frequency, payload.duration, payload.reason]
    .filter(value => value !== null && value !== undefined && value !== '')
    .join(' · ');
};

const testLabel = (row: any) => row?.name || row?.testName || row?.shortName || '';

const preferredDateFromOrder = (order: AmbientOrder) => {
  const payload = order.payload ?? {};
  const raw = payload.preferredDate || payload.date;
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  const days = Number(payload.interval_days ?? payload.intervalDays ?? 0);
  const preferred = new Date();
  if (Number.isFinite(days) && days > 0) preferred.setDate(preferred.getDate() + days);
  return preferred.toISOString().slice(0, 10);
};

type MedicationForm = {
  activeIngredientId: number | null;
  activeIngredientName: string;
  otherMedicationName: string;
  pharmaceuticalId: number | null;
  instructionsType: string | null;
  instructions: string;
  dose: number | string | null;
  unit: string | null;
  frequency: string | null;
  roa: string | null;
  predefinedInstructionId: number | null;
  duration: number | string | null;
  durationType: string | null;
  chronicMedication: boolean;
  indicationIcd: number | null;
  indicationUse: string | null;
};

const emptyMedication = (): MedicationForm => ({
  activeIngredientId: null,
  activeIngredientName: '',
  otherMedicationName: '',
  pharmaceuticalId: null,
  instructionsType: null,
  instructions: '',
  dose: null,
  unit: null,
  frequency: null,
  roa: null,
  predefinedInstructionId: null,
  duration: null,
  durationType: null,
  chronicMedication: false,
  indicationIcd: null,
  indicationUse: null
});

type AmbientOrderEditModalProps = {
  order: AmbientOrder | null;
  open: boolean;
  locked: boolean;
  saving: boolean;
  patientId?: number | string | null;
  onClose: () => void;
  onAccept: (order: AmbientOrder) => Promise<boolean>;
};

const AmbientOrderEditModal = ({
  order,
  open,
  locked,
  saving,
  patientId,
  onClose,
  onAccept
}: AmbientOrderEditModalProps) => {
  const dispatch = useAppDispatch();
  const kind = ambientOrderKind(order?.kind);
  const diagnosticType = kind === 'radiology' ? 'RADIOLOGY' : 'LABORATORY';
  const medicationOpen = open && kind === 'medication';
  const diagnosticOpen = open && (kind === 'lab' || kind === 'radiology');

  const [testSearchInput, setTestSearchInput] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [testId, setTestId] = useState<number | null>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const [ingredientKeywordInput, setIngredientKeywordInput] = useState('');
  const [ingredientKeyword, setIngredientKeyword] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [medication, setMedication] = useState<MedicationForm>(emptyMedication);

  const [followUp, setFollowUp] = useState({
    priority: 'NORMAL',
    reason: 'Follow-up',
    preferredDate: '',
    note: ''
  });

  const instructionTypeOptions = useEnumOptions('PrescriptionInstructionsType');
  const roaOptions = useEnumOptions('RouteOfAdministration');
  const priorityOptions = useEnumOptions('EncounterPriority');
  const { data: unitLov } = useGetLovValuesByCodeQuery('UOM', { skip: !medicationOpen });
  const { data: frequencyLov } = useGetLovValuesByCodeQuery('MED_FREQUENCY', { skip: !medicationOpen });
  const { data: durationLov } = useGetLovValuesByCodeQuery('MED_DURATION', { skip: !medicationOpen });
  const { data: indicationLov } = useGetLovValuesByCodeQuery('MED_INDICATION_USE', { skip: !medicationOpen });
  const { data: reasonLov } = useGetLovValuesByCodeQuery('DIAG_ORD_REASON', { skip: !diagnosticOpen });
  const { data: predefinedInstructions } = useGetAllPrescriptionInstructionsQuery(
    { page: 0, size: 200, sort: 'id,asc' },
    { skip: !medicationOpen }
  );

  const { data: testsResponse } = useGetActiveDiagnosticTestsByTypeQuery(
    {
      type: diagnosticType,
      page: 0,
      size: 20,
      sort: 'id,asc',
      ...(testSearch.length >= 2 ? { name: testSearch } : {})
    },
    { skip: !diagnosticOpen }
  );

  const { data: ingredientResponse } = useGetActiveIngredientsActiveByNameQuery(
    { name: ingredientKeyword, page: 0, size: 20, sort: 'id,asc' },
    { skip: !medicationOpen || ingredientKeyword.trim().length < 2 }
  );

  const { data: pharmaceuticals = [] } = useGetPharmaceuticalsByActiveIngredientQuery(
    selectedIngredient?.id,
    { skip: !medicationOpen || !selectedIngredient?.id || !selectedIngredient?.isLookAlikeSoundAlike }
  );

  useEffect(() => {
    const timer = setTimeout(() => setTestSearch(testSearchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [testSearchInput]);

  useEffect(() => {
    const timer = setTimeout(() => setIngredientKeyword(ingredientKeywordInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [ingredientKeywordInput]);

  useEffect(() => {
    if (!open || !order) return;
    const payload = order.payload ?? {};
    const name = String(payload.name || payload.test || payload.medication || payload.description || '').trim();
    const existingTestId = Number(payload.testId ?? payload.test_id ?? payload.diagnosticTestId) || null;
    setTestSearchInput(name);
    setTestSearch(name);
    setTestId(existingTestId);
    setSelectedTest(existingTestId ? { id: existingTestId, label: name || String(existingTestId) } : null);
    setReason(payload.reason ?? null);
    setNotes(String(payload.notes || ''));
    setIngredientKeywordInput(name);
    setIngredientKeyword(name);
    setSelectedIngredient(null);
    setMedication({
      ...emptyMedication(),
      instructions: [payload.dose || payload.dosage, payload.frequency, payload.duration].filter(Boolean).join(' '),
      otherMedicationName: String(payload.name || payload.medication || '')
    });
    setFollowUp({
      priority: payload.priority || 'NORMAL',
      reason: payload.reason || 'Follow-up',
      preferredDate: preferredDateFromOrder(order),
      note: payload.note || ''
    });
  }, [open, order]);

  const testOptions = useMemo(() => {
    const rows = (testsResponse?.data ?? []).map((row: any) => ({
      ...row,
      id: row.id,
      label: testLabel(row)
    }));
    if (selectedTest?.id && !rows.some(row => Number(row.id) === Number(selectedTest.id))) {
      return [selectedTest, ...rows];
    }
    return rows;
  }, [testsResponse, selectedTest]);

  const ingredients = ingredientResponse?.data ?? [];
  const isOtherIngredient = String(selectedIngredient?.name || medication.activeIngredientName || '')
    .trim()
    .toLowerCase() === 'other';
  const pharmaceuticalOptions = (pharmaceuticals as any[])
    .filter(item => item?.isActive !== false)
    .map(item => ({ ...item, name: item.pharmaceuticalName || item.name }));
  const predefinedOptions = useMemo(
    () =>
      (predefinedInstructions?.data ?? []).map((item: any) => ({
        label: [item.dose, item.unit, item.rout, item.frequency].filter(Boolean).join(', ') || `Instruction ${item.id}`,
        value: item.id
      })),
    [predefinedInstructions]
  );

  const hasDuration = () => {
    const value = medication.duration;
    const number = Number(value);
    return (Number.isFinite(number) && number > 0) || (value != null && String(value).trim() !== '' && String(value).trim() !== '0');
  };

  const validationMessage = () => {
    if (kind === 'lab' || kind === 'radiology') {
      if (!testId) return 'Please select a diagnostic test.';
      return '';
    }
    if (kind === 'medication') {
      if (!medication.activeIngredientId) return 'Please select active ingredient';
      if (isOtherIngredient && !medication.otherMedicationName.trim()) return 'Please enter Other Medication Name';
      if (selectedIngredient?.isLookAlikeSoundAlike && !medication.pharmaceuticalId) {
        return 'This active ingredient is LASA, please select medication';
      }
      if (!medication.instructionsType) return 'Please Select Instruction type';
      if (medication.instructionsType === CUSTOM) {
        if (!medication.dose) return 'Dose is required for Custom Instructions';
        if (!medication.unit) return 'Unit is required for Custom Instructions';
        if (!medication.frequency) return 'Frequency is required for Custom Instructions';
        if (!medication.roa) return 'ROA is required for Custom Instructions';
      } else if (medication.instructionsType === PREDEFINED) {
        if (!medication.predefinedInstructionId) return 'Please select a Pre-defined Instruction';
      } else if (medication.instructionsType === MANUAL) {
        if (!medication.instructions.trim()) return 'Manual Instructions text is required';
      }
      if (!medication.chronicMedication && !hasDuration()) return 'Set Duration for the medication';
      if (!medication.chronicMedication && hasDuration() && !medication.durationType) return 'Please select Duration Type';
      if (!medication.indicationIcd) return 'Please select ICD-10';
      if (!medication.indicationUse) return 'Please fill Indication Use';
      return '';
    }
    if (kind === 'follow_up') {
      if (!followUp.priority) return 'Priority is required.';
      if (!followUp.reason.trim()) return 'Reason is required.';
      if (!followUp.preferredDate) return 'Preferred date is required.';
      return '';
    }
    return 'This order type cannot be created from the draft.';
  };

  const buildOrder = (): AmbientOrder => {
    const current = order as AmbientOrder;
    if (kind === 'lab' || kind === 'radiology') {
      const test = testOptions.find(row => Number(row.id) === Number(testId)) ?? selectedTest;
      return {
        ...current,
        payload: {
          ...(current.payload ?? {}),
          testId,
          name: testLabel(test),
          reason,
          notes
        }
      };
    }
    if (kind === 'medication') {
      return {
        ...current,
        payload: {
          ...(current.payload ?? {}),
          activeIngredientId: medication.activeIngredientId,
          pharmaceuticalId: medication.pharmaceuticalId,
          medicationsId: medication.pharmaceuticalId,
          otherMedicationName: isOtherIngredient ? medication.otherMedicationName.trim() : null,
          name: isOtherIngredient ? medication.otherMedicationName.trim() : medication.activeIngredientName,
          instructionsType: medication.instructionsType,
          instructions:
            medication.instructionsType === MANUAL
              ? medication.instructions.trim()
              : medication.instructionsType === PREDEFINED
                ? String(medication.predefinedInstructionId ?? '')
                : null,
          dose: medication.instructionsType === CUSTOM ? medication.dose : null,
          doesUnit: medication.instructionsType === CUSTOM ? medication.unit : null,
          rout: medication.instructionsType === CUSTOM ? medication.roa : null,
          frequency: medication.instructionsType === CUSTOM ? medication.frequency : null,
          duration: medication.duration,
          durationType: medication.durationType,
          chronicMedication: medication.chronicMedication,
          indicationIcd: medication.indicationIcd,
          indicationUse: medication.indicationUse
        }
      };
    }
    return {
      ...current,
      payload: {
        ...(current.payload ?? {}),
        priority: followUp.priority,
        reason: followUp.reason.trim(),
        preferredDate: followUp.preferredDate,
        note: followUp.note
      }
    };
  };

  const handleAccept = async () => {
    const message = validationMessage();
    if (message) {
      dispatch(notify({ msg: message, sev: 'warning' }));
      return;
    }
    if (!order) return;
    await onAccept(buildOrder());
  };

  const title =
    kind === 'lab' ? 'Edit lab order' : kind === 'radiology' ? 'Edit radiology order' : kind === 'medication' ? 'Edit prescription' : kind === 'follow_up' ? 'Edit follow-up' : 'Edit order';

  return (
    <MyModal
      open={open}
      setOpen={next => {
        if (!next) onClose();
      }}
      title={title}
      size="760px"
      bodyheight="auto"
      enforceFocus={false}
      customClassName="ambient-order-edit-modal"
      actionButtonLabel="Accept"
      hideActionBtn={kind === 'other'}
      actionButtonLoading={saving}
      isDisabledActionBtn={locked || saving || Boolean(validationMessage())}
      actionButtonFunction={handleAccept}
      content={
        order ? (
          <Form fluid className="ambient-order-edit">
            {suggestedText(order) && <p className="ambient-draft-copy">Suggested: {suggestedText(order)}</p>}
            {(kind === 'lab' || kind === 'radiology') && (
              <div className="ambient-order-edit-fields">
                <MyInput
                  width="100%"
                  fieldType="text"
                  fieldLabel="Search test"
                  fieldName="testSearch"
                  record={{ testSearch: testSearchInput }}
                  setRecord={(next: any) => setTestSearchInput(next.testSearch || '')}
                  disabled={locked}
                />
                <MyInput
                  width="100%"
                  required
                  fieldType="select"
                  fieldLabel="Diagnostic test"
                  selectData={testOptions}
                  selectDataLabel="label"
                  selectDataValue="id"
                  fieldName="testId"
                  record={{ testId }}
                  setRecord={(next: any) => {
                    const id = Number(next.testId) || null;
                    const found = testOptions.find(row => Number(row.id) === id) ?? null;
                    setTestId(id);
                    setSelectedTest(found);
                  }}
                  searchable
                  disabled={locked}
                />
                <MyInput
                  width="220px"
                  fieldType="select"
                  fieldLabel="Reason"
                  selectData={reasonLov?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="reason"
                  record={{ reason }}
                  setRecord={(next: any) => setReason(next.reason ?? null)}
                  disabled={locked}
                />
                <MyInput
                  width="100%"
                  fieldType="textarea"
                  fieldLabel="Clinical Notes"
                  fieldName="notes"
                  record={{ notes }}
                  setRecord={(next: any) => setNotes(next.notes || '')}
                  disabled={locked}
                />
              </div>
            )}
            {kind === 'medication' && (
              <div className="ambient-order-edit-fields">
                <MyInput
                  width="100%"
                  fieldType="text"
                  fieldLabel="Search active ingredient"
                  fieldName="keyword"
                  record={{ keyword: ingredientKeywordInput }}
                  setRecord={(next: any) => setIngredientKeywordInput(next.keyword || '')}
                  disabled={locked}
                />
                <MyInput
                  width="100%"
                  required
                  fieldType="select"
                  fieldLabel="Active ingredient"
                  selectData={ingredients}
                  selectDataLabel="name"
                  selectDataValue="id"
                  fieldName="activeIngredientId"
                  record={medication}
                  setRecord={(next: any) => {
                    const id = Number(next.activeIngredientId) || null;
                    const found = ingredients.find((item: any) => Number(item.id) === id) ?? null;
                    setSelectedIngredient(found);
                    setMedication(current => ({
                      ...current,
                      activeIngredientId: id,
                      activeIngredientName: found?.name ?? '',
                      pharmaceuticalId: null
                    }));
                  }}
                  searchable
                  disabled={locked}
                />
                {isOtherIngredient && (
                  <MyInput
                    width="100%"
                    required
                    fieldType="text"
                    fieldLabel="Other Medication Name"
                    fieldName="otherMedicationName"
                    record={medication}
                    setRecord={setMedication}
                    disabled={locked}
                  />
                )}
                {selectedIngredient?.isLookAlikeSoundAlike && (
                  <MyInput
                    width="100%"
                    required
                    fieldType="select"
                    fieldLabel="Medication"
                    selectData={pharmaceuticalOptions}
                    selectDataLabel="name"
                    selectDataValue="id"
                    fieldName="pharmaceuticalId"
                    record={medication}
                    setRecord={setMedication}
                    searchable
                    disabled={locked}
                  />
                )}
                <MyInput
                  width="240px"
                  required
                  fieldType="select"
                  fieldLabel="Instruction type"
                  selectData={instructionTypeOptions ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  fieldName="instructionsType"
                  record={medication}
                  setRecord={setMedication}
                  disabled={locked}
                />
                {medication.instructionsType === CUSTOM && (
                  <>
                    <MyInput width="140px" required fieldType="number" fieldLabel="Dose" fieldName="dose" record={medication} setRecord={setMedication} disabled={locked} />
                    <MyInput
                      width="180px"
                      required
                      fieldType="select"
                      fieldLabel="Unit"
                      selectData={unitLov?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      fieldName="unit"
                      record={medication}
                      setRecord={setMedication}
                      disabled={locked}
                    />
                    <MyInput
                      width="180px"
                      required
                      fieldType="select"
                      fieldLabel="Frequency"
                      selectData={frequencyLov?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      fieldName="frequency"
                      record={medication}
                      setRecord={setMedication}
                      disabled={locked}
                    />
                    <MyInput
                      width="180px"
                      required
                      fieldType="select"
                      fieldLabel="ROA"
                      selectData={roaOptions ?? []}
                      selectDataLabel="label"
                      selectDataValue="value"
                      fieldName="roa"
                      record={medication}
                      setRecord={setMedication}
                      disabled={locked}
                    />
                  </>
                )}
                {medication.instructionsType === PREDEFINED && (
                  <MyInput
                    width="100%"
                    required
                    fieldType="select"
                    fieldLabel="Pre-defined Instructions"
                    selectData={predefinedOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    fieldName="predefinedInstructionId"
                    record={medication}
                    setRecord={setMedication}
                    searchable
                    disabled={locked}
                  />
                )}
                {medication.instructionsType === MANUAL && (
                  <MyInput
                    width="100%"
                    required
                    fieldType="textarea"
                    fieldLabel="Manual instructions"
                    fieldName="instructions"
                    record={medication}
                    setRecord={setMedication}
                    disabled={locked}
                  />
                )}
                <MyInput
                  width="140px"
                  required={!medication.chronicMedication}
                  fieldType="number"
                  fieldLabel="Duration"
                  fieldName="duration"
                  record={medication}
                  setRecord={setMedication}
                  disabled={locked}
                />
                <MyInput
                  width="180px"
                  required={!medication.chronicMedication}
                  fieldType="select"
                  fieldLabel="Duration Type"
                  selectData={durationLov?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="durationType"
                  record={medication}
                  setRecord={setMedication}
                  disabled={locked}
                />
                <MyInput
                  width="160px"
                  fieldType="checkbox"
                  fieldLabel="Chronic"
                  fieldName="chronicMedication"
                  record={medication}
                  setRecord={setMedication}
                  disabled={locked}
                />
                <div className="ambient-order-edit-icd">
                  <div className="ambient-order-edit-label">
                    ICD-10 <span className="required-asterisk">*</span>
                  </div>
                  <PatientDiagnosisTable
                    patient={{ id: patientId }}
                    disabled={locked}
                    selectMode
                    selectedDiagnosisId={medication.indicationIcd}
                    onSelectDiagnosis={ids =>
                      setMedication(current => ({ ...current, indicationIcd: ids?.[0] ?? null }))
                    }
                  />
                </div>
                <MyInput
                  width="240px"
                  required
                  fieldType="select"
                  fieldLabel="Indication Use"
                  selectData={indicationLov?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="indicationUse"
                  record={medication}
                  setRecord={setMedication}
                  disabled={locked}
                />
              </div>
            )}
            {kind === 'follow_up' && (
              <div className="ambient-order-edit-fields">
                <MyInput
                  width="200px"
                  required
                  fieldType="select"
                  fieldLabel="Priority"
                  selectData={priorityOptions ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  fieldName="priority"
                  record={followUp}
                  setRecord={setFollowUp}
                  disabled={locked}
                />
                <MyInput
                  width="100%"
                  required
                  fieldType="text"
                  fieldLabel="Reason"
                  fieldName="reason"
                  record={followUp}
                  setRecord={setFollowUp}
                  disabled={locked}
                />
                <MyInput
                  width="200px"
                  required
                  fieldType="date"
                  fieldLabel="Preferred date"
                  fieldName="preferredDate"
                  record={followUp}
                  setRecord={setFollowUp}
                  disabled={locked}
                />
                <MyInput
                  width="100%"
                  fieldType="textarea"
                  fieldLabel="Note"
                  fieldName="note"
                  record={followUp}
                  setRecord={setFollowUp}
                  disabled={locked}
                />
              </div>
            )}
            {kind === 'other' && <p className="ambient-draft-copy">This order type cannot be created from the draft.</p>}
          </Form>
        ) : null
      }
    />
  );
};

export default AmbientOrderEditModal;
