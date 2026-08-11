import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Divider } from 'rsuite';

import CancellationModal from '@/components/CancellationModal';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch, useAppSelector } from '@/hooks';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';

import { useGetCustomeInstructionsQuery } from '@/services/encounterService';
import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService';
import { useGetAllPrescriptionInstructionsQuery } from '@/services/setup/prescription-instruction/prescriptionInstructionService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

import {
  useCreateOrGetPatientPrescriptionMutation,
  useGetPatientPrescriptionQuery,
  useSubmitPatientPrescriptionMutation
} from '@/services/patients/Prescription/patientPrescriptionService';

import {
  useDeletePatientPrescriptionMedicationMutation,
  useGetPatientPrescriptionMedicationsQuery
} from '@/services/patients/Prescription/patientPrescriptionMedicationService';

import { useGetActiveIngredientsByIdsMutation } from '@/services/setup/activeIngredients/activeIngredientsService';

import { conjureValueBasedOnKeyFromList, formatEnumString } from '@/utils';

import AllergyFloatingButton from '../../encounter-pre-observations/AllergiesNurse/AllergyFloatingButton';

import DetailsModal from './DetailsModal';
import PrescriptionPreview from './PrescriptionPreview';
import PatientHistorySummaryModal from './PatientHistorySummaryModal';
import BrandActivesPrefetcher from './BrandActivesPrefetcher';

import PrescriptionToolbar from './PrescriptionToolbar';
import PrescriptionTable from './PrescriptionTable';
import { usePrescriptionActions } from './hooks/usePrescriptionActions';

import type { PatientPrescription, PatientPrescriptionMedication } from '@/types/model-types-new';
import { newPatientPrescriptionMedication } from '@/types/model-types-constructor-new';

import './styles.less';

type Props = any;

const Prescription = (props: Props) => {
  const location = useLocation();
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;

  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);

  const jobRole = String(authSlice.user?.jobRole ?? '').toUpperCase();
  const isNurse = jobRole === 'NURSE';

  const [openToAdd, setOpenToAdd] = useState(true);
  const [openCancellation, setOpenCancellation] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);

  const [currentPrescription, setCurrentPrescription] = useState<PatientPrescription | null>(null);
  const [preKeyRecord, setPreKeyRecord] = useState<{ preKey: number | null }>({ preKey: null });

  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState<PatientPrescriptionMedication[]>([]);
  const [selectedPreviewMedication, setSelectedPreviewMedication] =
    useState<PatientPrescriptionMedication | null>(null);

  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [selectedMedicationForAttachments, setSelectedMedicationForAttachments] =
    useState<PatientPrescriptionMedication | null>(null);

  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  const [patientPrescriptionMedicationObject, setPatientPrescriptionMedicationObject] =
    useState<PatientPrescriptionMedication>({
      ...newPatientPrescriptionMedication,
      prescriptionHeaderId: null as any
    });

  const patientId = patient?.id ? Number(patient.id) : patient?.key ? Number(patient.key) : undefined;

  const encounterId = encounter?.id
    ? Number(encounter.id)
    : encounter?.key
      ? Number(encounter.key)
      : undefined;

  const asArray = (x: any): any[] => {
    if (!x) return [];
    if (Array.isArray(x)) return x;
    if (Array.isArray(x.object)) return x.object;
    if (Array.isArray(x.data)) return x.data;
    if (Array.isArray(x.content)) return x.content;
    return [];
  };

  const isCanceledStatus = (status: any) =>
    String(status ?? '')
      .toUpperCase()
      .includes('CANCEL');

  const { data: predefinedInstructionsListResponse } = useGetAllPrescriptionInstructionsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
  const { data: unitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: frequencyLov } = useGetLovValuesByCodeQuery('MED_FREQUENCY');

  const { data: genericMedicationListResponse } = useGetAllBrandMedicationsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const {
    data: prescriptionsResponse,
    isLoading: isLoadingPrescriptions,
    refetch: preRefetch
  } = useGetPatientPrescriptionQuery(
    {
      patientId,
      includeCanceled: showCanceled,
      page: 0,
      size: 500,
      sort: 'prescriptionNum,desc'
    },
    { skip: !patientId }
  );

  const prescriptions = prescriptionsResponse?.data ?? [];

  const patientPrescriptions = useMemo(() => {
    if (!patientId) return [] as PatientPrescription[];
    if (!prescriptions.length) return [] as PatientPrescription[];

    const targetPatientId = Number(patientId);

    return (prescriptions as PatientPrescription[]).filter(p => {
      const pPatientId = p.patientId;

      if (pPatientId != null) {
        const pIdNum = typeof pPatientId === 'string' ? Number(pPatientId) : pPatientId;
        if (!isNaN(pIdNum) && pIdNum === targetPatientId) return true;
      }

      const patientObj = (p as any).patient;

      if (patientObj?.id != null) {
        const objId = typeof patientObj.id === 'string' ? Number(patientObj.id) : patientObj.id;
        if (!isNaN(objId) && objId === targetPatientId) return true;
      }

      if (patientObj?.key != null) {
        const objKey = typeof patientObj.key === 'string' ? Number(patientObj.key) : patientObj.key;
        if (!isNaN(objKey) && objKey === targetPatientId) return true;
      }

      if (encounterId != null && p.encounterId != null) {
        const pEncounterId =
          typeof p.encounterId === 'string' ? Number(p.encounterId) : p.encounterId;

        if (!isNaN(pEncounterId) && pEncounterId === Number(encounterId)) return true;
      }

      return false;
    });
  }, [prescriptions, patientId, encounterId]);

  const filteredPrescriptions = patientPrescriptions.filter(p =>
    showCanceled ? true : !isCanceledStatus(p.status)
  );

  const prescriptionOptions = filteredPrescriptions.map(p => ({
    key: p.id,
    label: String(p.prescriptionNum ?? p.id)
  }));

  const [createOrGetPrescription, { isLoading: isLoadingCreateOrGet }] =
    useCreateOrGetPatientPrescriptionMutation();

  const [deleteMedication] = useDeletePatientPrescriptionMedicationMutation();
  const [submitPrescription] = useSubmitPatientPrescriptionMutation();

  useEffect(() => {
    if (preKeyRecord.preKey !== null) return;

    const draft = patientPrescriptions.find(
      p => String(p.status ?? '').toUpperCase() === 'DRAFT'
    );

    if (draft?.id) {
      setCurrentPrescription(draft);
      setPreKeyRecord({ preKey: draft.id });
      return;
    }

    setCurrentPrescription(null);
  }, [patientPrescriptions, preKeyRecord.preKey]);


  useEffect(() => {
    if (!preKeyRecord.preKey) {
      setCurrentPrescription(null);
      return;
    }

    const selected = patientPrescriptions.find(p => p.id === preKeyRecord.preKey);

    if (selected) {
      setCurrentPrescription(selected);
    }
  }, [preKeyRecord.preKey, patientPrescriptions]);

  const {
    data: patientPrescriptionMedicationsRaw,
    isLoading: isLoadingPrescriptionMedications,
    refetch: medicRefetch
  } = useGetPatientPrescriptionMedicationsQuery(
    currentPrescription?.id
      ? { prescriptionHeaderId: currentPrescription.id, page: 0, size: 500, sort: 'id,desc' }
      : (undefined as any),
    { skip: !currentPrescription?.id }
  );

  const patientPrescriptionMedications = currentPrescription?.id
    ? (asArray(patientPrescriptionMedicationsRaw) as PatientPrescriptionMedication[])
    : [];
  const visiblePatientPrescriptionMedications = patientPrescriptionMedications.filter(m =>
    showCanceled ? true : !isCanceledStatus((m as any)?.status)
  );

  const { data: customeInstructions } = useGetCustomeInstructionsQuery({
    ...({} as any)
  });

  const [getActiveIngredientsByIds, { data: activeIngredientsByIds }] =
    useGetActiveIngredientsByIdsMutation();

  const activeIngredientIds = useMemo(() => {
    const medications = patientPrescriptionMedicationsRaw?.data ?? [];
    const ids = medications.map((item: any) => item.activeIngredientId);
    return ids.filter((id: any): id is number => id != null);
  }, [patientPrescriptionMedicationsRaw]);

  useEffect(() => {
    if (!activeIngredientIds.length) return;
    getActiveIngredientsByIds(activeIngredientIds);
  }, [activeIngredientIds, getActiveIngredientsByIds]);

  const activeIngredientsMap = useMemo(() => {
    return new Map((activeIngredientsByIds ?? []).map((item: any) => [item.id, item]));
  }, [activeIngredientsByIds]);

  type ActiveRel = any;
  type BrandActiveCache = Record<string, ActiveRel[]>;

  const [brandActivesCache, setBrandActivesCache] = useState<BrandActiveCache>({});

  const onActivesLoaded = (brandId: string, actives: ActiveRel[]) => {
    setBrandActivesCache(prev => {
      const existing = prev[brandId];
      if (existing) return prev;
      return { ...prev, [brandId]: actives ?? [] };
    });
  };

  const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));

  const getLovDisplay = (list: any[] = [], key: any, labelKey = 'lovDisplayVale') => {
    if (!key && key !== 0) return '';

    const lovList = list ?? [];
    if (!lovList.length) return '';

    const keyStr = String(key);
    const keyNum = Number(key);

    for (const item of lovList) {
      if (String(item?.key) === keyStr || Number(item?.key) === keyNum) {
        const display = item?.[labelKey] ?? item?.lovDisplayVale ?? item?.name ?? '';
        if (display) return String(display);
      }

      if (String(item?.id) === keyStr || Number(item?.id) === keyNum) {
        const display = item?.[labelKey] ?? item?.lovDisplayVale ?? item?.name ?? '';
        if (display) return String(display);
      }

      if (item?.valueCode && String(item?.valueCode) === keyStr) {
        const display = item?.[labelKey] ?? item?.lovDisplayVale ?? item?.name ?? '';
        if (display) return String(display);
      }
    }

    const fallback = conjureValueBasedOnKeyFromList(lovList, key, labelKey);
    if (fallback && fallback !== key) return String(fallback);

    return '';
  };

  const getMedicationName = (brandMedications: any[] = [], id: any) =>
    toStr(brandMedications.find(m => String(m?.id) === String(id))?.name);

  const formatActiveIngredientsLikeUI = (brandId: any) => {
    const rels = brandActivesCache[String(brandId)] ?? [];
    if (!rels.length) return '-';

    return rels
      .map((rel: any) => {
        const ai = rel?.activeIngredient ?? {};
        const name = toStr(ai?.name);
        const atc = toStr(ai?.atcCode);

        const unitTxt = rel?.unit ? ` ${getLovDisplay(unitLov?.object ?? [], rel.unit)}` : '';
        const strength = toStr(rel?.strength);
        const strengthTxt = strength ? `${strength}${unitTxt}`.trim() : '';

        return `${name}${atc ? ` (${atc})` : ''}${strengthTxt ? ` - ${strengthTxt}` : ''}`.trim();
      })
      .filter(Boolean)
      .join('\n');
  };

  const formatInstructionsLikeTable = (
    row: any,
    predefinedInstructions: any[] = [],
    customInstructions: any[] = []
  ) => {
    const type = toStr(row?.instructionsType ?? row?.instructionsTypeLkey);

    if (type === 'PRE_DEFINED_INSTRUCTIONS' || type === '3010591042600262') {
      const instId = Number(row?.instructions);
      const inst = predefinedInstructions.find((x: any) => Number(x.id) === instId);

      if (!inst) return '';

      return [
        toStr(inst?.dose),
        formatEnumString(inst?.unit) ?? '',
        formatEnumString(inst?.rout) ?? '',
        formatEnumString(inst?.frequency) ?? ''
      ]
        .map(s => toStr(s).trim())
        .filter(Boolean)
        .join(', ');
    }

    if (type === 'MANUAL_INSTRUCTIONS' || type === '3010573499898196') {
      return toStr(row?.instructions);
    }

    if (type === 'CUSTOM_INSTRUCTIONS' || type === '3010606785535008') {
      if (row?.dose != null || row?.doesUnit || row?.frequency || row?.rout) {
        const unitLovArray = Array.isArray(unitLovQueryResponse)
          ? unitLovQueryResponse
          : unitLovQueryResponse?.object ?? [];

        const freqLovArray = Array.isArray(frequencyLov)
          ? frequencyLov
          : frequencyLov?.object ?? [];

        const unitDisplay =
          getLovDisplay(unitLovArray, row?.doesUnit) ||
          formatEnumString(row?.doesUnit) ||
          (row?.doesUnit ? String(row.doesUnit) : '');

        const freqDisplay =
          getLovDisplay(freqLovArray, row?.frequency) ||
          formatEnumString(row?.frequency) ||
          (row?.frequency ? String(row.frequency) : '');

        return [toStr(row?.dose), unitDisplay, formatEnumString(row?.rout), freqDisplay]
          .map(s => toStr(s).trim())
          .filter(Boolean)
          .join(', ');
      }

      const ci = customInstructions.find(
        (x: any) => String(x.prescriptionMedicationsKey) === String(row?.id ?? row?.key)
      );

      return [
        toStr(ci?.dose),
        toStr(ci?.unitLvalue?.lovDisplayVale),
        formatEnumString(ci?.roaLkey),
        toStr(ci?.frequencyLvalue?.lovDisplayVale)
      ]
        .map(s => s.trim())
        .filter(Boolean)
        .join(', ');
    }

    return '';
  };

  const buildPrescriptionSummaryPayload = (
    patientX: any,
    encounterX: any,
    meds: any[] = [],
    brandMedicationsForNames: any[] = [],
    predefinedInstructions: any[] = [],
    customInstructions: any[] = []
  ) => {
    const patientInfo = {
      mrn: toStr(patientX?.patientMrn),
      fullName: toStr(patientX?.fullName || patientX?.patientFullName),
      gender: toStr(patientX?.genderLvalue?.lovDisplayVale || patientX?.genderLvalue?.valueCode),
      dob: toStr(patientX?.dob)
    };

    const encounterInfo = {
      visitId: toStr(encounterX?.visitId),
      visitType: toStr(encounterX?.visitTypeLvalue?.lovDisplayVale),
      plannedStartDate: toStr(encounterX?.plannedStartDate),
      chiefComplaint: toStr(encounterX?.chiefComplaint),
      patientAge: toStr(encounterX?.patientAge),
      diagnosis: toStr(encounterX?.diagnosis)
    };

    const medicationsAsStrings: string[] = (meds ?? []).map((row: any) => {
      const medId = row?.medicationsId ?? row?.genericMedicationsId;
      const medicationName = getMedicationName(brandMedicationsForNames, medId);
      const activeIngredientsText = formatActiveIngredientsLikeUI(medId);

      const instructionsText = formatInstructionsLikeTable(
        row,
        predefinedInstructions,
        customInstructions
      );

      return [
        `Medication Name: ${toStr(medicationName)}`,
        `Active Ingredients: ${activeIngredientsText || '-'}`,
        `Instructions: ${toStr(instructionsText)}`,
        `Instructions Type: ${toStr(row?.instructionsType ?? row?.instructionsTypeLkey)}`,
        `Valid Until: ${toStr(row?.validUtil)}`,
        `Is Chronic: ${row?.chronicMedication ? 'Yes' : 'No'}`,
        `Duration: ${toStr(row?.duration)}`,
        `Duration Type: ${toStr(row?.durationType ?? row?.durationTypeLkey)}`,
        `Maximum Dose: ${toStr(row?.maximumDose)}`,
        `ICD-10: ${toStr(row?.indicationIcd)}`
      ]
        .map(s => s.trim())
        .filter(Boolean)
        .join(' | ');
    });

    return {
      patient: patientInfo,
      encounter: encounterInfo,
      complain: toStr(encounterX?.chiefComplaint),
      diagnosis: { type: 'Encounter Diagnosis', value: toStr(encounterX?.diagnosis) },
      medications: medicationsAsStrings
    };
  };

  const uniqueBrandIds = useMemo(() => {
    const ids = (patientPrescriptionMedications ?? [])
      .map((m: any) => m?.medicationsId ?? m?.genericMedicationsId)
      .filter(Boolean)
      .map((x: any) => String(x));

    return Array.from(new Set(ids));
  }, [patientPrescriptionMedications]);

  const payload = useMemo(() => {
    return buildPrescriptionSummaryPayload(
      patient,
      encounter,
      patientPrescriptionMedications ?? [],
      genericMedicationListResponse?.data ?? [],
      predefinedInstructionsListResponse?.data ?? [],
      customeInstructions?.object ?? []
    );
  }, [
    patient,
    encounter,
    patientPrescriptionMedications,
    genericMedicationListResponse,
    predefinedInstructionsListResponse,
    customeInstructions,
    brandActivesCache,
    unitLovQueryResponse,
    frequencyLov
  ]);

  const isFormField = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;

    return (
      node.closest(
        'input, textarea, select, button, [contenteditable="true"], .rs-input, .rs-picker, .rs-checkbox, .rs-btn, .rs-picker-menu, .rs-picker-select-menu, .rs-picker-popup, .rs-modal, .rs-modal-body, .rs-modal-dialog'
      ) !== null
    );
  };

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;

      if (tableContainerRef.current?.contains(target as Node)) return;
      if (isFormField(e.target)) return;
      if ((e.target as Element)?.closest('.rs-modal, .rs-modal-body, .rs-modal-dialog')) return;

      setSelectedPreviewMedication(null);
      setSelectedRows([]);
    };

    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('touchstart', handleGlobalClick);

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPreviewMedication(null);
        setSelectedRows([]);
      }
    };

    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const {
    handleCancle,
    handleConfirmSubmitPres,
    handleNewPrescriptionAndAddMedication
  } = usePrescriptionActions({
    dispatch,
    currentPrescription,
    patientPrescriptionMedications,
    selectedRows,
    patientPrescriptionMedicationObject,
    deleteMedication,
    submitPrescription,
    createOrGetPrescription,
    patientId,
    encounterId,
    authSlice,
    encounter,
    setOpenCancellation,
    setSelectedRows,
    medicRefetch,
    preRefetch,
    setSummaryModalOpen,
    setCurrentPrescription,
    setPreKeyRecord,
    setSelectedPreviewMedication,
    setPatientPrescriptionMedicationObject,
    setOpenDetailsModal,
    setOpenToAdd,
    isCanceledStatus
  });

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  const tableFilters = (
    <PrescriptionToolbar
      edit={edit}
      isNurse={isNurse}
      isLoadingPrescriptions={isLoadingPrescriptions}
      isLoadingCreateOrGet={isLoadingCreateOrGet}
      currentPrescription={currentPrescription}
      preKeyRecord={preKeyRecord}
      setPreKeyRecord={setPreKeyRecord}
      prescriptionOptions={prescriptionOptions}
      selectedRows={selectedRows}
      patientPrescriptionMedicationObject={patientPrescriptionMedicationObject}
      setSelectedRows={setSelectedRows as any}
      setOpenCancellation={setOpenCancellation}
      setSummaryModalOpen={setSummaryModalOpen}
      handleNewPrescriptionAndAddMedication={handleNewPrescriptionAndAddMedication}
    />
  );

  return (
    <div dir={dir}>
      {uniqueBrandIds.map((id: string) => (
        <BrandActivesPrefetcher key={id} brandId={id} onLoaded={onActivesLoaded} />
      ))}

      <Divider />

      <div ref={tableContainerRef}>
        <PrescriptionTable
          edit={edit}
          currentPrescription={currentPrescription}
          medications={visiblePatientPrescriptionMedications}
          loading={isLoadingPrescriptionMedications}
          tableFilters={tableFilters}
          showCanceled={showCanceled}
          setShowCanceled={setShowCanceled}
          patientPrescriptionMedicationObject={patientPrescriptionMedicationObject}
          setPatientPrescriptionMedicationObject={setPatientPrescriptionMedicationObject as any}
          selectedPreviewMedication={selectedPreviewMedication}
          setSelectedPreviewMedication={setSelectedPreviewMedication as any}
          setOpenDetailsModal={setOpenDetailsModal}
          setOpenToAdd={setOpenToAdd}
          setSelectedMedicationForAttachments={setSelectedMedicationForAttachments as any}
          setAttachmentsModalOpen={setAttachmentsModalOpen}
          genericMedicationListResponse={genericMedicationListResponse}
          predefinedInstructionsListResponse={predefinedInstructionsListResponse}
          customeInstructions={customeInstructions}
          unitLovQueryResponse={unitLovQueryResponse}
          frequencyLov={frequencyLov}
          activeIngredientsMap={activeIngredientsMap}
          getLovDisplay={getLovDisplay}
        />
      </div>

      {selectedPreviewMedication && (
        <div className="mt-4">
          <PrescriptionPreview orderMedication={selectedPreviewMedication as any} />
        </div>
      )}

      <DetailsModal
        edit={edit}
        open={openDetailsModal}
        setOpen={setOpenDetailsModal}
        patient={patient}
        encounter={encounter}
        prescriptionMedication={patientPrescriptionMedicationObject}
        setPrescriptionMedications={setPatientPrescriptionMedicationObject}
        preKey={currentPrescription?.id}
        openToAdd={openToAdd}
        medicRefetch={medicRefetch}
        setOrderMedication={() => { }}
        drugKey={null}
        editing={false}
        existingMedications={patientPrescriptionMedications}
      />

      <CancellationModal
        open={openCancellation}
        setOpen={setOpenCancellation}
        object={patientPrescriptionMedicationObject as any}
        setObject={setPatientPrescriptionMedicationObject as any}
        handleCancle={handleCancle}
        fieldLabel="Reason"
        fieldName="cancellationReason"
        withReason={true}
        required={true}
        title="Cancellation"
       
      />

      <PatientHistorySummaryModal
        patient={patient}
        encounter={encounter}
        edit={edit}
        open={summaryModalOpen}
        setOpen={setSummaryModalOpen}
        handleSave={handleConfirmSubmitPres}
        medicationValidationPayload={payload}
      />

      <MyModal
        open={attachmentsModalOpen}
        setOpen={setAttachmentsModalOpen}
        title={`Attachments - ${selectedMedicationForAttachments
            ? genericMedicationListResponse?.data?.find(
              (item: any) =>
                String(item.id) ===
                String(
                  (selectedMedicationForAttachments as any)?.medicationsId ??
                  (selectedMedicationForAttachments as any)?.genericMedicationsId
                )
            )?.name || 'Medication'
            : 'Medication'
          }`}
        size="lg"
        hideActionBtn
        content={
          <EncounterAttachment
            localEncounter={encounter}
            source="PRESCRIPTION_ORDER_ATTACHMENT"
            sourceId={selectedMedicationForAttachments?.id ?? undefined}
            refetchAttachmentList={false}
            setRefetchAttachmentList={() => { }}
          />
        }
      />

      <AllergyFloatingButton patient={patient} encounter={encounter} />
    </div>
  );
};

export default Prescription;