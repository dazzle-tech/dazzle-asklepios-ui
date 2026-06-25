import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';
import { useGetCustomeInstructionsQuery } from '@/services/encounterService';
import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService';
import { useGetAllPrescriptionInstructionsQuery } from '@/services/setup/prescription-instruction/prescriptionInstructionService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  useCreateOrGetPatientPrescriptionMutation,
  useGetPatientPrescriptionQuery,
  useSubmitPatientPrescriptionMutation,
  useLazyGetPrescriptionPdfQuery
} from '@/services/patients/Prescription/patientPrescriptionService';
import {
  useGetPatientPrescriptionMedicationsQuery,
  useDeletePatientPrescriptionMedicationMutation
} from '@/services/patients/Prescription/patientPrescriptionMedicationService';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import { notify } from '@/utils/uiReducerActions';
import {
  conjureValueBasedOnKeyFromList,
  formatDateWithoutSeconds,
  formatEnumString
} from '@/utils';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BlockIcon from '@rsuite/icons/Block';
import CheckIcon from '@rsuite/icons/Check';
import PlusIcon from '@rsuite/icons/Plus';
import clsx from 'clsx';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaFilePrescription } from 'react-icons/fa6';
import { MdAttachFile, MdModeEdit } from 'react-icons/md';
import { useLocation } from 'react-router-dom';
import { Checkbox, Divider, Form } from 'rsuite';

import AllergyFloatingButton from '../../encounter-pre-observations/AllergiesNurse/AllergyFloatingButton';
import UrgencyButton from '../drug-order/UrgencyButton';
import DetailsModal from './DetailsModal';
import PrescriptionPreview from './PrescriptionPreview';
import PatientHistorySummaryModal from './PatientHistorySummaryModal';
import BrandActivesPrefetcher from './BrandActivesPrefetcher';
import './styles.less';

import type { PatientPrescription, PatientPrescriptionMedication } from '@/types/model-types-new';
import { newPatientPrescriptionMedication } from '@/types/model-types-constructor-new';
import { useGetActiveIngredientsByIdsMutation } from '@/services/setup/activeIngredients/activeIngredientsService';
import PrescriptionReportButton from './PrescriptionReportButton';

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

  const { data: predefinedInstructionsListResponse } = useGetAllPrescriptionInstructionsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
  const { data: unitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: frequencyLov } = useGetLovValuesByCodeQuery('MED_FREQUENCY');

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

  // Brand medications (for names in table/preview)
  const { data: genericMedicationListResponse } = useGetAllBrandMedicationsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  // Patient / encounter ids (prefer numeric id; fallback to key)
  const patientId = patient?.id
    ? Number(patient.id)
    : patient?.key
      ? Number(patient.key)
      : undefined;
  const encounterId = encounter?.id
    ? Number(encounter.id)
    : encounter?.key
      ? Number(encounter.key)
      : undefined;

  // List prescriptions
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

  // Filter by patient ID (client-side filtering since service doesn't send patientId to backend)
  // The service query doesn't pass patientId to backend, so we filter client-side
  const patientPrescriptions = useMemo(() => {
    // If no patientId, return empty array (don't show prescriptions for unknown patient)
    if (!patientId) return [] as PatientPrescription[];

    // If no prescriptions, return empty array
    if (!prescriptions.length) return [] as PatientPrescription[];

    const targetPatientId = Number(patientId);

    return (prescriptions as PatientPrescription[]).filter(p => {
      // Try direct patientId field (most common case) - handle both number and string
      const pPatientId = p.patientId;
      if (pPatientId != null && pPatientId !== undefined) {
        const pIdNum = typeof pPatientId === 'string' ? Number(pPatientId) : pPatientId;
        if (!isNaN(pIdNum) && pIdNum === targetPatientId) return true;
      }

      // Fallback: try patient object if it exists
      const patientObj = (p as any).patient;
      if (patientObj) {
        if (patientObj.id != null) {
          const objId = typeof patientObj.id === 'string' ? Number(patientObj.id) : patientObj.id;
          if (!isNaN(objId) && objId === targetPatientId) return true;
        }
        if (patientObj.key != null) {
          const objKey =
            typeof patientObj.key === 'string' ? Number(patientObj.key) : patientObj.key;
          if (!isNaN(objKey) && objKey === targetPatientId) return true;
        }
      }

      // Additional fallback: if encounterId matches and we have encounterId, include it
      // This is a safety measure in case patientId is not populated but encounterId is
      if (encounterId != null && p.encounterId != null) {
        const pEncounterId =
          typeof p.encounterId === 'string' ? Number(p.encounterId) : p.encounterId;
        const targetEncounterId = Number(encounterId);
        if (!isNaN(pEncounterId) && pEncounterId === targetEncounterId) return true;
      }

      // If no patientId found on prescription, exclude it (safer than including all)
      return false;
    });
  }, [prescriptions, patientId, encounterId]);

  // Default: hide canceled prescriptions, show all only when checkbox is enabled.
  const filteredPrescriptions = patientPrescriptions.filter(p =>
    showCanceled ? true : !isCanceledStatus(p.status)
  );

  const prescriptionOptions = (filteredPrescriptions as PatientPrescription[]).map(p => ({
    key: p.id,
    label: String(p.prescriptionNum ?? p.id)
  }));

  // Create or get draft prescription
  const [createOrGetPrescription, { isLoading: isLoadingCreateOrGet }] =
    useCreateOrGetPatientPrescriptionMutation();

  useEffect(() => {
    if (!patientId || !encounterId) return;
    if (currentPrescription?.id) return;

    (async () => {
      try {
        const result = await createOrGetPrescription({
          patientId,
          encounterId,
          fromFacilityId: authSlice?.tenant?.selectedFacility?.id ?? (null as any),
          fromDepartmentId: encounter?.departmentId ?? (null as any),
          urgencyLevel: 'NORMAL'
        } as any).unwrap();

        setCurrentPrescription(result);
        setPreKeyRecord({ preKey: result.id });

        dispatch(
          notify({
            msg:
              result.status === 'DRAFT'
                ? `Draft prescription loaded (No. ${result.prescriptionNum})`
                : `Prescription opened (No. ${result.prescriptionNum})`,
            type: 'success'
          } as any)
        );

        await preRefetch();
      } catch {
        dispatch(
          notify({
            msg: 'Failed to load or create prescription',
            type: 'error'
          } as any)
        );
      }
    })();
  }, [
    patientId,
    encounterId,
    currentPrescription?.id,
    createOrGetPrescription,
    dispatch,
    authSlice?.tenant?.selectedFacility?.id,
    encounter?.departmentKey,
    preRefetch
  ]);

  // Keep currentPrescription in sync with dropdown selection
  useEffect(() => {
    if (!preKeyRecord.preKey) {
      setCurrentPrescription(null);
      return;
    }
    const selected =
      (patientPrescriptions as PatientPrescription[]).find(p => p.id === preKeyRecord.preKey) ||
      (prescriptions as PatientPrescription[]).find(p => p.id === preKeyRecord.preKey);
    if (selected) setCurrentPrescription(selected);
  }, [preKeyRecord.preKey, patientPrescriptions, prescriptions]);

  // Auto-select first prescription if none selected
  useEffect(() => {
    if (preKeyRecord.preKey !== null) return;
    const first = (filteredPrescriptions as PatientPrescription[])?.[0];
    if (first?.id) setPreKeyRecord({ preKey: first.id });
  }, [filteredPrescriptions, preKeyRecord.preKey]);

  // List medications for selected prescription
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
  const [getActiveIngredientsByIds, { data: activeIngredientsByIds }] =
    useGetActiveIngredientsByIdsMutation();

  const activeIngredientIds = useMemo(() => {
    const medications = patientPrescriptionMedicationsRaw?.data ?? [];

    const ids = medications.map(item => item.activeIngredientId);
    const filtered = ids.filter((id): id is number => id != null);
    return filtered;
  }, [patientPrescriptionMedicationsRaw]);

  useEffect(() => {
    if (!activeIngredientIds.length) return;
    getActiveIngredientsByIds(activeIngredientIds);
  }, [activeIngredientIds, getActiveIngredientsByIds]);
  const activeIngredientsMap = useMemo(() => {
    return new Map((activeIngredientsByIds ?? []).map(item => [item.id, item]));
  }, [activeIngredientsByIds]);

  const patientPrescriptionMedications = asArray(
    patientPrescriptionMedicationsRaw
  ) as PatientPrescriptionMedication[];
  const visiblePatientPrescriptionMedications = patientPrescriptionMedications.filter(m =>
    showCanceled ? true : !isCanceledStatus((m as any)?.status)
  );

  // Custom instructions (legacy table formatting uses this)
  const { data: customeInstructions } = useGetCustomeInstructionsQuery({
    ...({} as any)
  });

  // Helpers for summary payload
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

    // Predefined (supports both old enum & new string)
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

    // Manual
    if (type === 'MANUAL_INSTRUCTIONS' || type === '3010573499898196') {
      return toStr(row?.instructions);
    }

    // Custom instructions: read directly from medication object
    if (type === 'CUSTOM_INSTRUCTIONS') {
      // Try reading from medication object first (new API)
      if (row?.dose != null || row?.doesUnit || row?.frequency || row?.rout) {
        // Get LOV arrays - handle both object and direct array formats
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
          .map(s => s.trim())
          .filter(Boolean)
          .join(', ');
      }

      // Fallback to legacy custom instructions lookup
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

  function buildPrescriptionSummaryPayload(
    patientX: any,
    encounterX: any,
    meds: any[] = [],
    brandMedicationsForNames: any[] = [],
    predefinedInstructions: any[] = [],
    customInstructions: any[] = []
  ) {
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

      const parts = [
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
      ];

      return parts
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
  }

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

  // Global click to clear selection
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

  const isSelected = (rowData: any) => {
    if (
      rowData &&
      patientPrescriptionMedicationObject &&
      String(rowData.id) === String(patientPrescriptionMedicationObject.id)
    ) {
      return 'selected-row';
    }
    return '';
  };

  const handleCheckboxChange = (rowData: PatientPrescriptionMedication) => {
    setSelectedRows(prev => {
      const exists = prev.some(x => String(x.id) === String(rowData.id));
      if (exists) {
        setSelectedPreviewMedication(null);
        return prev.filter(x => String(x.id) !== String(rowData.id));
      }
      return [...prev, rowData];
    });
  };

  // Cancel/Delete meds (NEW API)
  const [deleteMedication] = useDeletePatientPrescriptionMedicationMutation();

  const handleCancle = async () => {
    const rowsToCancel = selectedRows.length
      ? selectedRows
      : patientPrescriptionMedicationObject?.id
        ? [patientPrescriptionMedicationObject]
        : [];

    if (!rowsToCancel.length) {
      dispatch(notify({ msg: 'Please select medication(s) to cancel', type: 'warning' } as any));
      return;
    }

    try {
      await Promise.all(
        rowsToCancel.filter(r => r?.id != null).map(r => deleteMedication(Number(r.id)).unwrap())
      );

      dispatch(
        notify({ msg: 'Selected medications deleted successfully', type: 'success' } as any)
      );
      setOpenCancellation(false);
      setSelectedRows([]);
      await medicRefetch();
    } catch {
      dispatch(notify({ msg: 'One or more deletions failed', type: 'error' } as any));
    }
  };

  const [submitPrescription] = useSubmitPatientPrescriptionMutation();
  const [triggerGetPrescriptionPdf] = useLazyGetPrescriptionPdfQuery();

  const handleConfirmSubmitPres = async () => {
    if (!currentPrescription?.id) return;

    const nonCancelledMeds = patientPrescriptionMedications.filter(
      m => !isCanceledStatus((m as any)?.status)
    );
    if (nonCancelledMeds.length === 0) {
      dispatch(
        notify({ msg: 'Cannot submit: all medications are cancelled', type: 'warning' } as any)
      );
      return;
    }

    try {
      await submitPrescription({
        id: currentPrescription.id
      }).unwrap();
      dispatch(notify({ msg: 'Submitted successfully', type: 'success' } as any));

      setSummaryModalOpen(false);
      await preRefetch();
      await medicRefetch();

      // After submit, open/create next draft header automatically for continued ordering.
      try {
        const nextDraft = await createOrGetPrescription({
          patientId,
          encounterId,
          fromFacilityId: authSlice?.tenant?.selectedFacility?.id ?? (null as any),
          fromDepartmentId: encounter?.departmentId ?? (null as any),
          urgencyLevel: 'NORMAL'
        } as any).unwrap();
        setCurrentPrescription(nextDraft);
        setPreKeyRecord({ preKey: nextDraft?.id ?? null });
        setSelectedRows([]);
        setSelectedPreviewMedication(null);
        setPatientPrescriptionMedicationObject({
          ...newPatientPrescriptionMedication,
          prescriptionHeaderId: nextDraft?.id ?? null
        } as any);
      } catch {
        dispatch(
          notify({
            msg: 'Prescription submitted, but failed to open next draft',
            type: 'warning'
          } as any)
        );
      }
    } catch {
      dispatch(notify({ msg: 'Submit failed', type: 'error' } as any));
    }
  };

  const handleNewPrescriptionAndAddMedication = async () => {
    if (!currentPrescription?.id) {
      dispatch(notify({ msg: 'No prescription loaded yet', type: 'warning' } as any));
      return;
    }
    if (String(currentPrescription?.status ?? '').toUpperCase() === 'SUBMITTED') {
      dispatch(
        notify({
          msg: 'Cannot add medication to submitted prescription',
          type: 'warning'
        } as any)
      );
      return;
    }

    setPatientPrescriptionMedicationObject({
      ...newPatientPrescriptionMedication,
      prescriptionHeaderId: currentPrescription.id
    } as any);

    setOpenDetailsModal(true);
    setOpenToAdd(true);
  };

  const UserDateCell = ({
    login,
    date
  }: {
    login?: string;
    date?: string;
  }) => {
    const { data: fullName } = useGetUserFullNameByLoginQuery(login, {
      skip: !login
    });

    if (!login && !date) return null;

    return (
      <>
        <span>{fullName || login || ''}</span>
        <br />
        <span className="date-table-style">
          {date ? formatDateWithoutSeconds(date) : ''}
        </span>
      </>
    );
  };

  // Table columns
  const tableColumns: any[] = [
    {
      key: 'activeIngredientId',
      title: 'Active Ingredients',
      flexGrow: 1,
      render: (rowData: any) => {
        const ingredient = activeIngredientsMap.get(rowData.activeIngredientId);
        return ingredient?.name ? String(ingredient.name) : '-';
      }
    },
    {
      key: 'medicationName',
      dataKey: 'medicationsId',
      title: <Translate> Medication Name</Translate>,
      flexGrow: 2,
      render: (rowData: any) => {
        const medId = rowData.medicationsId ?? rowData.genericMedicationsId;
        return genericMedicationListResponse?.data?.find(
          (item: any) => String(item.id) === String(medId)
        )?.name;
      }
    },
    {
      key: 'instructions',
      title: 'Instructions',
      flexGrow: 3,
      render: (rowData: any) => {
        const cleanJoin = (vals: any[], sep = ', ') =>
          vals
            .map(v => (v == null ? '' : String(v).trim()))
            .filter(v => v !== '' && v !== 'undefined' && v !== 'null')
            .join(sep);

        const type = String(rowData.instructionsType ?? rowData.instructionsTypeLkey ?? '');

        if (type === 'PRE_DEFINED_INSTRUCTIONS' || type === '3010591042600262') {
          const generic = predefinedInstructionsListResponse?.data?.find(
            (item: any) => item.id === Number(rowData.instructions)
          );

          return cleanJoin([
            generic?.dose,
            formatEnumString(generic?.unit),
            formatEnumString(generic?.rout),
            formatEnumString(generic?.frequency)
          ]);
        }

        if (type === 'MANUAL_INSTRUCTIONS' || type === '3010573499898196') {
          return cleanJoin([rowData?.instructions]);
        }

        // Custom instructions: read directly from medication object
        if (type === 'CUSTOM_INSTRUCTIONS' || type === '3010606785535008') {
          // Try reading from medication object first (new API)
          if (rowData?.dose != null || rowData?.doesUnit || rowData?.frequency || rowData?.rout) {
            // Get LOV arrays - handle both object and direct array formats
            const unitLovArray = Array.isArray(unitLovQueryResponse)
              ? unitLovQueryResponse
              : unitLovQueryResponse?.object ?? [];
            const freqLovArray = Array.isArray(frequencyLov)
              ? frequencyLov
              : frequencyLov?.object ?? [];

            const unitDisplay =
              getLovDisplay(unitLovArray, rowData?.doesUnit) ||
              formatEnumString(rowData?.doesUnit) ||
              (rowData?.doesUnit ? String(rowData.doesUnit) : '');
            const freqDisplay =
              getLovDisplay(freqLovArray, rowData?.frequency) ||
              formatEnumString(rowData?.frequency) ||
              (rowData?.frequency ? String(rowData.frequency) : '');
            return cleanJoin([
              rowData?.dose,
              unitDisplay,
              formatEnumString(rowData?.rout),
              freqDisplay
            ]);
          }

          // Fallback to legacy custom instructions lookup
          const custom = customeInstructions?.object?.find(
            (item: any) => String(item?.prescriptionMedicationsKey) === String(rowData.id)
          );

          return cleanJoin([
            custom?.dose,
            custom?.unitLvalue?.lovDisplayVale,
            formatEnumString(custom?.roaLkey),
            custom?.frequencyLvalue?.lovDisplayVale
          ]);
        }

        return '';
      }
    },
    {
      key: 'instructionsType',
      title: 'Instructions Type',
      flexGrow: 2,
      render: (rowData: any) =>
        rowData.instructionsType ? formatEnumString(rowData.instructionsType) : ''
    },
    { key: 'validUtil', dataKey: 'validUtil', title: 'Valid Util', flexGrow: 2 },
    {
      key: 'isChronic',
      dataKey: 'chronicMedication',
      title: 'Is Chronic',
      flexGrow: 2,
      render: (rowData: any) => (rowData.chronicMedication ? 'Yes' : 'No')
    },
    {
      key: 'status',
      dataKey: 'status',
      title: 'Status',
      flexGrow: 1,
      render: (rowData: any) => (rowData?.status ? formatEnumString(rowData.status) : '')
    },
    {
      key: 'actions',
      title: 'Actions',
      flexGrow: 1.5,
      render: (rowData: any) => {
        const isSubmitted =
          String(currentPrescription?.status ?? '').toUpperCase() === 'SUBMITTED';

        return (
          <div className="flex-c8">
            {!edit && (
              <MdModeEdit
                title={isSubmitted ? 'Prescription is submitted' : 'Edit'}
                size={20}
                className="font-aws"
                style={{
                  opacity: isSubmitted ? 0.5 : 1,
                  cursor: isSubmitted ? 'not-allowed' : 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();

                  if (isSubmitted) return;

                  setPatientPrescriptionMedicationObject({
                    ...rowData,
                    key: rowData.key ?? rowData.id,
                    id: rowData.id ?? rowData.key
                  });

                  setOpenDetailsModal(true);
                  setOpenToAdd(false);
                }}
              />
            )}
          </div>
        );
      }
    },
    {
      key: 'attachments',
      title: <Translate>Attachments</Translate>,
      flexGrow: 1,
      render: (rowData: any) => (
        <MdAttachFile
          size={20}
          fill={rowData?.id ? 'var(--primary-gray)' : '#ccc'}
          onClick={(e) => {
            e.stopPropagation();
            if (rowData?.id) {
              setSelectedMedicationForAttachments(rowData);
              setAttachmentsModalOpen(true);
            }
          }}
          style={{ cursor: rowData?.id ? 'pointer' : 'not-allowed' }}
          title="View Attachments"
        />
      )
    },
    {
      key: 'created',
      title: <Translate>Created At/By</Translate>,
      expandable: true,
      render: (rowData: any) => (
        <UserDateCell
          login={rowData.createdBy}
          date={rowData.createdDate}
        />
      )
    },
    {
      key: 'updated',
      title: <Translate>Updated At/By</Translate>,
      expandable: true,
      render: (rowData: any) => (
        <UserDateCell
          login={rowData.lastModifiedBy}
          date={rowData.lastModifiedDate}
        />
      )
    }
  ];

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  const tablefilters = (<div className="bt-div">
    <div style={{ width: '500px', display: 'flex', flexDirection: 'row', gap: '6px' }}>
      <Form fluid>
        <MyInput
          placeholder="Prescription"
          fieldName="preKey"
          fieldType="select"
          record={preKeyRecord}
          setRecord={setPreKeyRecord}
          selectData={prescriptionOptions}
          selectDataLabel="label"
          selectDataValue="key"
          showLabel={false}
        />
      </Form>

      <div className="icon-style">
        <FaFilePrescription size={18} />
      </div>

      <div>
        <div className="prescripton-word-style">Prescription</div>
        <div className="prescripton-number-style">
          {currentPrescription?.prescriptionNum || currentPrescription?.id || '_'}
        </div>
      </div>

      <Form fluid>
        <MyInput
          fieldName=""
          fieldType="select"
          selectData={[]}
          placeholder="Pharmacy"
          selectDataLabel="label"
          selectDataValue="key"
          record={{}}
          setRecord={() => { }}
          width={110}
        />
      </Form>
    </div>

    <div className={clsx('bt-right', { 'disabled-panel': edit })}>
      <UrgencyButton />

      <MyButton loading={isLoadingPrescriptions}>
        <Translate>Validate with Gallon Reasoner</Translate>
      </MyButton>

      <MyButton
        onClick={handleNewPrescriptionAndAddMedication}
        prefixIcon={() => <PlusIcon />}
        loading={isLoadingPrescriptions || isLoadingCreateOrGet}
        disabled={
          edit ||
          isNurse ||
          !currentPrescription?.id ||
          String(currentPrescription?.status ?? '').toUpperCase() === 'SUBMITTED'
        }
      >
        Add Medication
      </MyButton>

      <MyButton
        prefixIcon={() => <BlockIcon />}
        onClick={() => {
          if (!selectedRows.length && patientPrescriptionMedicationObject?.id) {
            setSelectedRows([patientPrescriptionMedicationObject]);
          }
          setOpenCancellation(true);
        }}
        disabled={
          (!selectedRows.length && !patientPrescriptionMedicationObject?.id) ||
          edit ||
          String(currentPrescription?.status ?? '').toUpperCase() === 'SUBMITTED'
        }
      >
        Cancel
      </MyButton>

      <MyButton
        loading={isLoadingPrescriptions}
        onClick={() => setSummaryModalOpen(true)}
        disabled={edit || !currentPrescription || currentPrescription?.status === 'SUBMITTED'}
        prefixIcon={() => <CheckIcon />}
      >
        Sign & Submit Order
      </MyButton>
    </div>

    <PrescriptionReportButton prescriptionId={currentPrescription?.id}
      disabled={!currentPrescription?.id || currentPrescription?.status !== 'SUBMITTED'}
    />
  </div>);

  const tablebuttons = (<div className="bt-div">
    <div className="bt-right">
      <Checkbox checked={showCanceled} onChange={() => setShowCanceled(v => !v)}>
        Show cancelled
      </Checkbox>
    </div>
  </div>);

  return (
    <div dir={dir}>
      {uniqueBrandIds.map((id: string) => (
        <BrandActivesPrefetcher key={id} brandId={id} onLoaded={onActivesLoaded} />
      ))}
      <Divider />

      <div ref={tableContainerRef}>
        <MyTable
          columns={tableColumns}
          data={visiblePatientPrescriptionMedications ?? []}
          onRowClick={(rowData: any) => {
            const isSameRow =
              String(patientPrescriptionMedicationObject?.id) === String(rowData?.id);

            if (isSameRow && selectedPreviewMedication) {
              // Deselect
              setSelectedPreviewMedication(null);
              setPatientPrescriptionMedicationObject({
                ...newPatientPrescriptionMedication,
                prescriptionHeaderId: currentPrescription?.id ?? null
              } as any);
            } else {
              // Select
              setSelectedPreviewMedication(rowData);
              setPatientPrescriptionMedicationObject(rowData);
              setOpenToAdd(false);
            }
          }}
          loading={isLoadingPrescriptionMedications}
          filters={tablefilters}
          tableButtons={tablebuttons}
          rowClassName={isSelected}
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
        withReason={false}
        title={'Cancellation'}
        size="30vw"
        bodyheight="30vh"
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
        hideActionBtn={true}
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

      <AllergyFloatingButton
          patient={patient}
          encounter={encounter}
      />
    </div>
  );
};

export default Prescription;
