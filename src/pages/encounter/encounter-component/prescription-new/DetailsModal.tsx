import AdvancedModal from '@/components/AdvancedModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import MyModal from '@/components/MyModal/MyModal';
import MyTagInput from '@/components/MyTagInput/MyTagInput';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { useGetCustomeInstructionsQuery } from '@/services/encounterService';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useCreatePatientPrescriptionMedicationMutation,
  useUpdatePatientPrescriptionMedicationMutation
} from '@/services/patients/Prescription/patientPrescriptionMedicationService';
import { useLazyGetActiveIngredientPreRequestedTestsQuery } from '@/services/setup/activeIngredients/activeIngredientPreRequestedTestService';
import { useGetActiveIngredientsActiveByNameQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import {
  useGetBrandMedicationByIdQuery,
  useGetBrandMedicationsByActiveIdsMutation
} from '@/services/setup/brandmedication/BrandMedicationService';
import './styles.less';
import { conjureValueBasedOnKeyFromList, extractErrorMessage } from '@/utils';
import InfoCardList from '@/components/InfoCardList';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetIcdListQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newApPrescriptionMedications } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import CheckIcon from '@rsuite/icons/Check';
import SearchIcon from '@rsuite/icons/Search';
import React, { useEffect, useMemo, useState } from 'react';
import { Dropdown, Form, Input, InputGroup, Radio, RadioGroup, Text } from 'rsuite';
import DiagnosticsOrder from '../diagnostics-order-new';
import Substitues from '../drug-order/SubstitutesNew';
import ActiveIngrediantList from './ActiveIngredient';
import Instructions from './Instructions';
import PatientDiagnosisTable from '../../medical-notes-and-assessments/patient-diagnosis/PatientDiagnosisTable';
import { useCheckCurrentMedicationExistsQuery } from '@/services/patients/currentMedicationService';

const DetailsModal = ({
  edit,
  open,
  setOpen,
  prescriptionMedication,
  setPrescriptionMedications,
  preKey,
  patient,
  encounter,
  medicRefetch,
  openToAdd,
  setOrderMedication,
  drugKey,
  editing,
  existingMedications = []
}) => {
  const dispatch = useAppDispatch();

  const [openOrderModel, setOpenOrderModel] = useState(false);

  const [selectedGeneric, setSelectedGeneric] = useState<any>(null);
  const [selectedActiveIngredient, setSelectedActiveIngredient] = useState<any>(null);

  const [tags, setTags] = React.useState<any[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  const searchWrapperRef = React.useRef<HTMLDivElement>(null);

  const [activeIngredientKeyword, setActiveIngredientKeyword] = useState('');
  const [showActiveIngredientDropdown, setShowActiveIngredientDropdown] = useState(false);
  const activeIngredientSearchWrapperRef = React.useRef<HTMLDivElement>(null);

  const [fetchPreRequestedTests] = useLazyGetActiveIngredientPreRequestedTestsQuery();
  const [testsByAiId, setTestsByAiId] = useState<Record<string, any[]>>({});

  const [customeinst, setCustomeinst] = useState({
    dose: null,
    unit: null,
    frequency: null,
    roa: null
  });
  const [indicationsIcd, setIndicationsIcd] = useState({ indicationIcd: null });
  const [searchKeywordicd, setSearchKeywordicd] = useState('');
  const [inst, setInst] = useState(null);
  const [adminInstructions, setAdminInstructions] = useState({ administrationInstructions: [] });
  const [selectedOption, setSelectedOption] = useState(null);
  const [indicationsDescription, setindicationsDescription] = useState<string>('');
  const [openSubstitutesModel, setOpenSubstitutesModel] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [instr, setInstruc] = useState(null);
  const [editDuration, setEditDuration] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [capturedSourceId, setCapturedSourceId] = useState<number>(0);

  const instructionTypeOptions = useEnumOptions('PrescriptionInstructionsType');
  const { data: DurationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_DURATION');
  const { data: administrationInstructionsLovQueryResponse } =
    useGetLovValuesByCodeQuery('PRESC_INSTRUCTIONS');
  const { data: refillunitQueryResponse } = useGetLovValuesByCodeQuery('REFILL_INTERVAL');
  const { data: indicationLovQueryResponse } = useGetLovValuesByCodeQuery('MED_INDICATION_USE');
  const { data: unitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');

  const shouldSkipActiveIngredientSearch =
    !open || !activeIngredientKeyword || activeIngredientKeyword.trim().length < 2;

  const { data: activeIngredientListResponse } = useGetActiveIngredientsActiveByNameQuery(
    {
      name: activeIngredientKeyword.trim(),
      page: 0,
      size: 1000,
      sort: 'id,asc'
    },
    { skip: shouldSkipActiveIngredientSearch }
  );

  const activeIngredientData = activeIngredientListResponse?.data ?? [];

  const [getBrandsByActive, { data: brandMedicationByActiveResponse, isLoading }] =
    useGetBrandMedicationsByActiveIdsMutation();

  const allBrandsForSelectedActive = brandMedicationByActiveResponse ?? [];

  const genericMedicationData = allBrandsForSelectedActive.filter((item: any) =>
    item?.name?.toLowerCase().includes((searchKeyword || '').toLowerCase())
  );

  const medIdForBrand =
    prescriptionMedication?.medicationsId ?? prescriptionMedication?.genericMedicationsId;

  const { data: Brand } = useGetBrandMedicationByIdQuery(medIdForBrand, {
    skip: !medIdForBrand
  });

  const { data: exists } = useCheckCurrentMedicationExistsQuery(
    {
      patientId: patient?.id,
      activeIngredientId: selectedActiveIngredient?.id
    },
    { skip: !selectedActiveIngredient?.id || !patient?.id }
  );

  const { data: customeInstructions, refetch: refetchCo } = useGetCustomeInstructionsQuery({
    ...initialListRequest
  });

  const [icdListRequest, setIcdListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });

  const { data: diagnosticTestsResult } = useGetAllDiagnosticTestsQuery({ page: 0, size: 9999 });
  const diagnosticTests = diagnosticTestsResult?.data ?? [];

  const { data: icdListResponseLoading } = useGetIcdListQuery(icdListRequest);

  const [savePrescriptionMedication, { isLoading: isSavingPrescriptionMedication }] =
    useCreatePatientPrescriptionMedicationMutation();
  const [updatePrescriptionMedication, { isLoading: isUpdatingPrescriptionMedication }] =
    useUpdatePatientPrescriptionMedicationMutation();

  useEffect(() => {
    if (exists === true) {
      dispatch(
        notify({
          msg: 'This active ingredient already exists in patient current medications and is written in prescription',
          sev: 'warning'
        })
      );
    }
  }, [exists]);

  useEffect(() => {
    if (!open) {
      setSearchKeyword('');
      setActiveIngredientKeyword('');
      setTagsLoaded(false);
      return;
    }
    setEditingKey(prescriptionMedication?.id ?? null);
  }, [open, prescriptionMedication?.id]);

  useEffect(() => {
    const hasMedication = prescriptionMedication?.id != null;

    if (hasMedication && Brand) {
      setSelectedGeneric(Brand);

      if (Brand?.activeIngredients?.length) {
        setSelectedActiveIngredient(Brand.activeIngredients[0]);
        setActiveIngredientKeyword(Brand.activeIngredients[0]?.name ?? '');
      }

      setSelectedOption(prescriptionMedication?.instructionsType);
      setInstruc(prescriptionMedication?.administrationInstructions);

      if (
        (prescriptionMedication?.indicationUseLkey != null ||
          prescriptionMedication?.indicationUse != null) &&
        indicationLovQueryResponse?.object
      ) {
        const indicationValue = prescriptionMedication?.indicationUse;
        const sampleLovKey = indicationLovQueryResponse?.object?.[0]?.key;

        let finalValue = indicationValue;
        if (typeof sampleLovKey === 'string' && typeof indicationValue !== 'string') {
          finalValue = String(indicationValue);
        } else if (typeof sampleLovKey === 'number' && typeof indicationValue === 'string') {
          const numValue = Number(indicationValue);
          finalValue = !isNaN(numValue) ? numValue : indicationValue;
        }

        setPrescriptionMedications(prev => ({
          ...prev,
          indicationUseLkey: finalValue
        }));
      }

      if (!tagsLoaded) {
        const rawTags = prescriptionMedication?.parametersToMonitor;
        if (rawTags && typeof rawTags === 'string' && rawTags.trim() !== '') {
          const parsedTags = rawTags
            .split(',')
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0);
          setTags(parsedTags);
        } else {
          setTags([]);
        }
        setTagsLoaded(true);
      }

      setindicationsDescription(prescriptionMedication?.indicationIcd ?? '');

      if (prescriptionMedication?.instructionsType === 'CUSTOM_INSTRUCTIONS') {
        const medicationKey = prescriptionMedication?.key ?? prescriptionMedication?.id;
        const instrucItem = customeInstructions?.object?.find(
          item =>
            String(item.prescriptionMedicationsKey) === String(medicationKey) ||
            String(item.prescriptionMedicationsKey) === String(prescriptionMedication?.id)
        );

        if (instrucItem) {
          setCustomeinst({
            dose: instrucItem?.dose,
            unit: instrucItem?.unitLkey,
            frequency: instrucItem?.frequencyLkey,
            roa: instrucItem?.roaLkey
          });
        } else {
          setCustomeinst({
            dose: prescriptionMedication?.dose ?? null,
            unit: prescriptionMedication?.doesUnit ?? null,
            frequency: prescriptionMedication?.frequency ?? null,
            roa: prescriptionMedication?.rout ?? null
          });
        }
      }
    }
  }, [
    prescriptionMedication?.id,
    Brand,
    customeInstructions,
    indicationLovQueryResponse,
    setPrescriptionMedications,
    tagsLoaded
  ]);

  useEffect(() => {
    const hasMedication = prescriptionMedication?.key != null || prescriptionMedication?.id != null;
    if (!hasMedication || !administrationInstructionsLovQueryResponse?.object) return;

    const adminInstr = prescriptionMedication?.administrationInstructions;
    const sampleLovKey = administrationInstructionsLovQueryResponse?.object?.[0]?.key;
    const keysAreStrings = typeof sampleLovKey === 'string';

    if (typeof adminInstr === 'string' && adminInstr) {
      const arr = adminInstr
        .split(',')
        .map(v => {
          const trimmed = v.trim();
          if (!trimmed) return null;
          if (keysAreStrings) return trimmed;
          const num = Number(trimmed);
          return !isNaN(num) ? num : trimmed;
        })
        .filter(v => v !== null && v !== '');
      setAdminInstructions({ administrationInstructions: arr });
    } else if (Array.isArray(adminInstr)) {
      const arr = adminInstr
        .map(v => {
          if (keysAreStrings && typeof v !== 'string') return String(v);
          if (!keysAreStrings && typeof v === 'string') {
            const num = Number(v);
            return !isNaN(num) ? num : v;
          }
          return v;
        })
        .filter(v => v !== null && v !== '');
      setAdminInstructions({ administrationInstructions: arr });
    } else if (adminInstr == null || adminInstr === '') {
      setAdminInstructions({ administrationInstructions: [] });
    }
  }, [
    prescriptionMedication?.administrationInstructions,
    administrationInstructionsLovQueryResponse,
    prescriptionMedication?.key,
    prescriptionMedication?.id
  ]);

  useEffect(() => {
    if (searchKeywordicd.trim() !== '') {
      setIcdListRequest({
        ...initialListRequest,
        filterLogic: 'or',
        filters: [
          { fieldName: 'icd_code', operator: 'containsIgnoreCase', value: searchKeywordicd },
          { fieldName: 'description', operator: 'containsIgnoreCase', value: searchKeywordicd }
        ]
      });
    }
  }, [searchKeywordicd]);

  useEffect(() => {
    if (!open) return;

    const aiList = selectedGeneric?.activeIngredients?.length
      ? selectedGeneric.activeIngredients
      : selectedActiveIngredient
        ? [selectedActiveIngredient]
        : [];

    if (!aiList.length) {
      setTestsByAiId({});
      return;
    }

    (async () => {
      try {
        const results: Record<string, any[]> = {};
        await Promise.all(
          aiList
            .filter((ai: any) => ai?.id != null)
            .map(async (ai: any) => {
              const aiId = ai.id;
              const res = await fetchPreRequestedTests(aiId).unwrap();
              results[String(aiId)] = Array.isArray(res) ? res : [];
            })
        );
        setTestsByAiId(results);
      } catch {
        setTestsByAiId({});
      }
    })();
  }, [open, selectedGeneric, selectedActiveIngredient, fetchPreRequestedTests]);

  const isChronicMedication = !!prescriptionMedication?.chronicMedication;
  useEffect(() => {
    setEditDuration(isChronicMedication);
    setPrescriptionMedications(prev => ({
      ...prev,
      duration: null,
      durationTypeLkey: null
    }));
  }, [isChronicMedication]);

  useEffect(() => {
    if (indicationsIcd.indicationIcd) {
      setindicationsDescription(prevadminInstructions => {
        const currentIcd = icdListResponseLoading?.object?.find(
          item => item.key === indicationsIcd.indicationIcd
        );
        if (!currentIcd) return prevadminInstructions;
        const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;
        return prevadminInstructions ? `${prevadminInstructions}\n${newEntry}` : newEntry;
      });
    }
  }, [indicationsIcd.indicationIcd, icdListResponseLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeIngredientSearchWrapperRef.current &&
        !activeIngredientSearchWrapperRef.current.contains(event.target as Node)
      ) {
        setShowActiveIngredientDropdown(false);
      }
    };
    if (showActiveIngredientDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActiveIngredientDropdown]);

  useEffect(() => {
    if (!attachmentsModalOpen) {
      setCapturedSourceId(0);
    }
  }, [attachmentsModalOpen]);

  useEffect(() => {
    if (!open) return;
    if (!prescriptionMedication?.id && !prescriptionMedication?.indicationIcd) {
      handleCleare();
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setSearchKeyword('');
        setShowMedicationDropdown(false);
      }
    };
    if (showMedicationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMedicationDropdown]);

  const joinValuesFromArray = values => {
    return values?.filter(Boolean)?.join(', ');
  };

  const handleSaveMedication = async (shouldClose: boolean = false) => {
    if (!preKey) {
      dispatch(notify({ msg: 'Prescription not linked. Try again', sev: 'warning' }));
      return;
    }
    if (!selectedActiveIngredient) {
      dispatch(notify({ msg: 'Please select active ingredient', sev: 'warning' }));
      return;
    }
    if (selectedActiveIngredient?.isLookAlikeSoundAlike && !selectedGeneric) {
      dispatch(
        notify({ msg: 'This active ingredient is LASA, please select brand', sev: 'warning' })
      );
      return;
    }
    if (!selectedOption && !prescriptionMedication?.instructionsType) {
      dispatch(notify({ msg: 'Please Select Instruction type', sev: 'warning' }));
      return;
    }

    const OPTION_CUSTOM = 'CUSTOM_INSTRUCTIONS';
    const OPTION_PREDEFINED = 'PRE_DEFINED_INSTRUCTIONS';
    const OPTION_MANUAL = 'MANUAL_INSTRUCTIONS';

    if (selectedOption === OPTION_CUSTOM) {
      if (!customeinst?.dose) {
        dispatch(notify({ msg: 'Dose is required for Custom Instructions', sev: 'warning' }));
        return;
      }
      if (!customeinst?.unit) {
        dispatch(notify({ msg: 'Unit is required for Custom Instructions', sev: 'warning' }));
        return;
      }
      if (!customeinst?.frequency) {
        dispatch(notify({ msg: 'Frequency is required for Custom Instructions', sev: 'warning' }));
        return;
      }
      if (!customeinst?.roa) {
        dispatch(notify({ msg: 'ROA is required for Custom Instructions', sev: 'warning' }));
        return;
      }
    } else if (selectedOption === OPTION_PREDEFINED) {
      if (!inst) {
        dispatch(notify({ msg: 'Please select a Pre-defined Instruction', sev: 'warning' }));
        return;
      }
    } else if (selectedOption === OPTION_MANUAL) {
      if (!inst || !String(inst).trim()) {
        dispatch(notify({ msg: 'Manual Instructions text is required', sev: 'warning' }));
        return;
      }
    }

    const tagcompine = joinValuesFromArray(tags);

    let administrationInstructionValue = null;
    if (adminInstructions?.administrationInstructions?.length) {
      administrationInstructionValue = adminInstructions.administrationInstructions.join(',');
    }

    const selectedMedicationId = selectedGeneric?.id ?? prescriptionMedication?.medicationsId;

    const isChronic = Boolean(prescriptionMedication?.chronicMedication);
    const durationRaw = prescriptionMedication?.duration;
    const durationNum =
      durationRaw === '' || durationRaw === null || durationRaw === undefined
        ? NaN
        : Number(durationRaw);

    const hasDuration =
      (!Number.isNaN(durationNum) && durationNum > 0) ||
      (durationRaw !== null &&
        durationRaw !== undefined &&
        String(durationRaw).trim() !== '' &&
        String(durationRaw).trim() !== '0');

    if (!isChronic && !hasDuration) {
      dispatch(notify({ msg: 'Set Duration for the medication', sev: 'warning' }));
      return;
    }

    const durationTypeRaw =
      prescriptionMedication?.durationType ?? prescriptionMedication?.durationTypeLkey ?? null;
    if (!isChronic && hasDuration && !durationTypeRaw) {
      dispatch(notify({ msg: 'Please select Duration Type', sev: 'warning' }));
      return;
    }

    if (isChronic) {
      const currentId = prescriptionMedication?.id;
      const anotherChronicExists = (existingMedications as any[]).some(m => {
        if (currentId != null && String(m?.id) === String(currentId)) return false;
        return Boolean(m?.chronicMedication);
      });
      if (anotherChronicExists) {
        dispatch(
          notify({
            msg: 'A chronic medication already exists for this prescription. Only one chronic medication is allowed.',
            sev: 'warning'
          })
        );
        return;
      }
    }

    const indicationIcd = prescriptionMedication?.indicationIcd;
    const hasIcd10 =
      indicationIcd !== null &&
      indicationIcd !== undefined &&
      String(indicationIcd).trim() !== '' &&
      String(indicationIcd).trim() !== '0';

    if (!hasIcd10) {
      dispatch(notify({ msg: 'Please select ICD-10', sev: 'warning' }));
      return;
    }

    const indicationUseValue =
      prescriptionMedication?.indicationUse ?? prescriptionMedication?.indicationUseLkey ?? null;

    const hasIndicationUse =
      indicationUseValue !== null &&
      indicationUseValue !== undefined &&
      String(indicationUseValue).trim() !== '';

    if (!hasIndicationUse) {
      dispatch(notify({ msg: 'Please fill Indication Use', sev: 'warning' }));
      return;
    }

    const createPayload: any = {
      prescriptionHeaderId: preKey,
      activeIngredientId: selectedActiveIngredient?.id ?? null,
      medicationsId: selectedMedicationId,
      instructionsType: String(selectedOption ?? prescriptionMedication?.instructionsType ?? ''),
      instructions:
        selectedOption === OPTION_MANUAL
          ? String(inst ?? '')
          : selectedOption === OPTION_PREDEFINED
            ? String(inst ?? '')
            : null,
      dose:
        selectedOption === OPTION_CUSTOM
          ? customeinst?.dose ?? null
          : prescriptionMedication?.dose ?? null,
      doesUnit:
        selectedOption === OPTION_CUSTOM
          ? customeinst?.unit ?? null
          : prescriptionMedication?.doesUnit ?? null,
      rout:
        selectedOption === OPTION_CUSTOM
          ? String(customeinst?.roa ?? '')
          : String(prescriptionMedication?.rout ?? ''),
      frequency:
        selectedOption === OPTION_CUSTOM
          ? customeinst?.frequency ?? null
          : prescriptionMedication?.frequency ?? null,
      chronicMedication: Boolean(prescriptionMedication?.chronicMedication),
      duration: prescriptionMedication?.duration ?? null,
      durationType:
        prescriptionMedication?.durationType ?? prescriptionMedication?.durationTypeLkey ?? null,
      maximumDose: prescriptionMedication?.maximumDose ?? null,
      allowedSubstitute:
        prescriptionMedication?.allowedSubstitute ??
        prescriptionMedication?.genericSubstitute ??
        false,
      indicationManually: prescriptionMedication?.indicationManually ?? null,
      indicationUse:
        prescriptionMedication?.indicationUse ?? prescriptionMedication?.indicationUseLkey ?? null,
      indicationIcd: prescriptionMedication?.indicationIcd ?? '',
      parametersToMonitor: tagcompine ?? null,
      numberOfRefills: prescriptionMedication?.numberOfRefills ?? null,
      refillValue: prescriptionMedication?.refillValue ?? null,
      refillUnit:
        prescriptionMedication?.refillUnit ??
        prescriptionMedication?.refillIntervalUnitLkey ??
        null,
      notes: prescriptionMedication?.notes ?? null,
      extraDocumentation: prescriptionMedication?.extraDocumentation ?? null,
      administrationInstructions: administrationInstructionValue ?? null
    };

    try {
      const medicationId = prescriptionMedication?.id;
      if (medicationId) {
        await updatePrescriptionMedication({
          id: Number(medicationId),
          body: {
            activeIngredientId: createPayload.activeIngredientId,
            medicationsId: createPayload.medicationsId,
            instructionsType: createPayload.instructionsType,
            instructions: createPayload.instructions,
            dose: createPayload.dose,
            doesUnit: createPayload.doesUnit,
            rout: createPayload.rout,
            frequency: createPayload.frequency,
            chronicMedication: createPayload.chronicMedication,
            duration: createPayload.duration,
            durationType: createPayload.durationType,
            maximumDose: createPayload.maximumDose,
            allowedSubstitute: createPayload.allowedSubstitute,
            indicationManually: createPayload.indicationManually,
            indicationUse: createPayload.indicationUse,
            indicationIcd: createPayload.indicationIcd,
            parametersToMonitor: createPayload.parametersToMonitor,
            numberOfRefills: createPayload.numberOfRefills,
            refillValue: createPayload.refillValue,
            refillUnit: createPayload.refillUnit,
            notes: createPayload.notes,
            extraDocumentation: createPayload.extraDocumentation,
            administrationInstructions: createPayload.administrationInstructions,
            lastModifiedBy: patient?.key ? String(patient.key) : 'system'
          } as any
        } as any).unwrap();
      } else {
        await savePrescriptionMedication(createPayload as any).unwrap();
      }

      dispatch(
        notify({
          msg: prescriptionMedication?.id ? 'Updated successfully' : 'Saved successfully',
          sev: 'success'
        })
      );

      await Promise.all([medicRefetch(), refetchCo()]);
      handleCleare();

      if (shouldClose) {
        setOpen(false);
      }
    } catch (error: any) {
      if (error?.originalStatus === 409) return;

      const isChronicConflict =
        (error?.status === 400 || error?.originalStatus === 400) &&
        error?.data?.message === 'error.validate' &&
        error?.data?.params === 'patientPrescriptionMedication';

      if (isChronicConflict) {
        dispatch(
          notify({
            msg: 'A chronic medication already exists for this prescription. Only one chronic medication is allowed.',
            sev: 'warning'
          })
        );
        return;
      }

      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Save failed',
          sev: 'warning'
        })
      );
    }
  };

  const handleSearchActiveIngredient = (value: string) => {
    setActiveIngredientKeyword(value);
    setShowActiveIngredientDropdown(!!value);
  };

  const handleActiveIngredientClick = async (activeIngredient: any) => {
    setSelectedActiveIngredient(activeIngredient);
    setActiveIngredientKeyword(activeIngredient?.name ?? '');
    setShowActiveIngredientDropdown(false);
    setSelectedGeneric(null);
    setSearchKeyword('');
    setShowMedicationDropdown(false);

    if (activeIngredient?.id) {
      try {
        await getBrandsByActive([activeIngredient.id]).unwrap();
      } catch (e) {
        console.error('Error fetching brands:', e);
      }
    }

    if (activeIngredient?.highAlert) {
      dispatch(notify({ msg: 'This active ingredient is high alert', sev: 'warning' }));
    }
  };

  const handleSaveAndClose = () => {
    handleSaveMedication(true);
  };

  const handleItemClick = (Generic: any) => {
    setSelectedGeneric(Generic);
    setSearchKeyword(Generic?.name ?? '');
    setShowMedicationDropdown(false);
  };

  const handleSearch = value => {
    if (!selectedActiveIngredient) {
      dispatch(notify({ msg: 'Please select active ingredient first', sev: 'warning' }));
      return;
    }
    setSearchKeyword(value);
    setShowMedicationDropdown(!!value);
  };

  const handleCleare = () => {
    setPrescriptionMedications(newApPrescriptionMedications);
    setSelectedGeneric(null);
    setSelectedActiveIngredient(null);
    setSelectedOption(null);
    setInstruc(null);
    setAdminInstructions({ administrationInstructions: [] });
    setCustomeinst({ dose: null, unit: null, frequency: null, roa: null });
    setTags([]);
    setTagsLoaded(false);
    setSearchKeyword('');
    setActiveIngredientKeyword('');
    setSearchKeywordicd('');
    setEditingKey(null);
    setindicationsDescription('');
    setIndicationsIcd({ indicationIcd: null });
    setShowMedicationDropdown(false);
    setShowActiveIngredientDropdown(false);
  };

  const preRequestedTests = Object.values(testsByAiId ?? {})
    .flat()
    .filter(Boolean);

  const normalizedPreRequestedTests = preRequestedTests.map((row: any) => ({
    ...row,
    testId: row?.testId
  }));

  const preRequestedTestNames = Array.from(
    new Set(
      normalizedPreRequestedTests
        .map((row: any) => {
          const test = diagnosticTests.find((t: any) => Number(t?.id) === Number(row?.testId));
          return test?.name;
        })
        .filter((name: any) => Boolean(String(name ?? '').trim()))
        .map((name: string) => String(name).trim())
    )
  );

  const safeRecord = useMemo(() => {
    if (!prescriptionMedication) return {};
    const result: any = { ...prescriptionMedication };
    Object.keys(result).forEach(k => {
      if (result[k] === undefined) result[k] = null;
    });
    return result;
  }, [prescriptionMedication]);

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <AdvancedModal
        open={open}
        setOpen={setOpen}
        actionButtonFunction={() => handleSaveMedication(false)}
        actionButtonLabel={
          <span>
            <CheckIcon /> Save
          </span>
        }
        size="80vw"
        leftTitle={selectedGeneric ? String(selectedGeneric.name) : 'Select Generic'}
        rightTitle="Medication Order Details"
        leftContent={
          <div dir={dir}>
            <ActiveIngrediantList selectedGeneric={selectedGeneric} />
            {!!preRequestedTestNames.length && (
              <div style={{ marginTop: 12 }}>
                <Text className="font-style">Pre-requested Tests</Text>
                <InfoCardList
                  list={preRequestedTestNames.map((name: string) => ({ testName: name }))}
                  fields={['testName']}
                  titleField="testName"
                  fieldLabels={{ testName: 'Test Name' }}
                />
              </div>
            )}
          </div>
        }
        footerButtons={
          <div className="footer-buttons" dir={dir}>
            <MyButton
              appearance="ghost"
              onClick={() => setOpenOrderModel(true)}
              prefixIcon={() => <CheckIcon />}
            >
              Order Related Tests
            </MyButton>
            <MyButton
              appearance="primary"
              onClick={handleSaveAndClose}
              prefixIcon={() => <CheckIcon />}
            >
              Save and Close
            </MyButton>
          </div>
        }
        rightContent={
          <div className="prescription-container" dir={dir}>
            <div className="prescription-top-row">
              <SectionContainer
                title={<Text className="font-style">Prescription Details</Text>}
                content={
                  <Form fluid>
                    <div className="prescription-medication-form-row min-hieght">
                      <div className="prescription-full-block">
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div
                            className="prescription-search-wrapper"
                            ref={activeIngredientSearchWrapperRef}
                            style={{ flex: 1 }}
                          >
                            <InputGroup inside className="input-search-p">
                              <Input
                                placeholder={'Active Ingredient Name'}
                                value={activeIngredientKeyword}
                                onChange={handleSearchActiveIngredient}
                                onFocus={() =>
                                  setShowActiveIngredientDropdown(!!activeIngredientKeyword)
                                }
                              />
                              <InputGroup.Button>
                                <SearchIcon />
                              </InputGroup.Button>
                            </InputGroup>

                            {showActiveIngredientDropdown && activeIngredientKeyword && (
                              <Dropdown.Menu className="prescription-dropdown-menuresult">
                                {activeIngredientData.map((ai: any) => (
                                  <Dropdown.Item
                                    key={ai.id}
                                    eventKey={ai.id}
                                    onClick={() => handleActiveIngredientClick(ai)}
                                  >
                                    <div className="prescription-dropdown-item-content">
                                      <div className="prescription-dropdown-item-title">
                                        {ai.name}
                                        {ai.isLookAlikeSoundAlike ? ' (LASA)' : ''}
                                      </div>
                                      <div className="prescription-dropdown-item-extra">
                                        {ai.atcCode ? <div>ATC: {ai.atcCode}</div> : null}
                                      </div>
                                    </div>
                                  </Dropdown.Item>
                                ))}
                              </Dropdown.Menu>
                            )}
                          </div>

                          <div
                            className="prescription-search-wrapper"
                            ref={searchWrapperRef}
                            style={{ flex: 1 }}
                          >
                            <div className="prescription-search-button-position-handle">
                              <InputGroup inside className="input-search-p">
                                <Input
                                  placeholder={'Medication Name'}
                                  value={searchKeyword}
                                  onChange={handleSearch}
                                  onFocus={() => {
                                    if (!selectedActiveIngredient) {
                                      dispatch(
                                        notify({
                                          msg: 'Please select active ingredient first',
                                          sev: 'warning'
                                        })
                                      );
                                      return;
                                    }
                                    setShowMedicationDropdown(true);
                                  }}
                                />
                                <InputGroup.Button>
                                  <SearchIcon />
                                </InputGroup.Button>
                              </InputGroup>
                            </div>

                            {showMedicationDropdown && selectedActiveIngredient && (
                              <Dropdown.Menu className="prescription-dropdown-menuresult">
                                {genericMedicationData.length ? (
                                  genericMedicationData.map((Generic: any) => (
                                    <Dropdown.Item
                                      key={Generic.id}
                                      eventKey={Generic.id}
                                      onClick={() => handleItemClick(Generic)}
                                    >
                                      <div className="prescription-dropdown-item-content">
                                        <div className="prescription-dropdown-item-title">
                                          {Generic.name}
                                        </div>
                                      </div>
                                    </Dropdown.Item>
                                  ))
                                ) : (
                                  <Dropdown.Item disabled>No brands found</Dropdown.Item>
                                )}
                              </Dropdown.Menu>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="prescription-full-block">
                        <div className="prescription-radio-group">
                          <RadioGroup
                            value={selectedOption}
                            inline
                            name="radio-group"
                            disabled={preKey != null ? false : true}
                            onChange={value => {
                              const v = String(value);
                              setSelectedOption(v);
                              setPrescriptionMedications(prev => ({
                                ...prev,
                                instructionsType: v
                              }));
                            }}
                          >
                            {instructionTypeOptions?.map((instruction, index) => (
                              <Radio key={index} value={instruction.value}>
                                <Translate>{instruction.label}</Translate>
                              </Radio>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>

                      <div className="prescription-full-block">
                        <Instructions
                          selectedOption={selectedOption}
                          setCustomeinst={setCustomeinst}
                          customeinst={customeinst}
                          selectedGeneric={selectedGeneric}
                          setInst={setInst}
                          prescriptionMedication={prescriptionMedication}
                        />
                      </div>

                      <div className="prescription-full-block">
                        <div className="prescription-inputs-inline">
                          <MyInput
                            disabled={preKey != null ? editDuration : true}
                            required={!editDuration}
                            width={'100%'}
                            fieldType="number"
                            fieldLabel="Duration"
                            fieldName={'duration'}
                            record={safeRecord}
                            setRecord={setPrescriptionMedications}
                          />
                          <MyInput
                            disabled={preKey != null ? editDuration : true}
                            required={!editDuration}
                            width={'100%'}
                            fieldType="select"
                            fieldLabel="Duration Type"
                            selectData={DurationTypeLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            disableByField='isValid'

                            selectDataValue="key"
                            fieldName="durationType"
                            record={safeRecord}
                            setRecord={setPrescriptionMedications}
                            searchable={false}
                          />
                          <div style={{ marginBottom: '1.5vw' }}>
                            <MyInput
                              disabled={preKey != null ? false : true}
                              width={120}
                              fieldLabel="Chronic Medication"
                              fieldType="checkbox"
                              fieldName="chronicMedication"
                              record={safeRecord}
                              setRecord={setPrescriptionMedications}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="prescription-full-block">
                        <div className="prescription-inputs-inline">
                          <MyInput
                            disabled={preKey != null ? false : true}
                            width={120}
                            fieldType="number"
                            fieldLabel="Maximum Dose"
                            fieldName="maximumDose"
                            record={safeRecord}
                            setRecord={setPrescriptionMedications}
                          />
                          <div style={{ marginBottom: '1.5vw' }}>
                            <MyInput
                              disabled={preKey != null ? false : true}
                              width={140}
                              fieldLabel="Brand Substitute Allowed"
                              fieldType="checkbox"
                              fieldName="genericSubstitute"
                              record={safeRecord}
                              setRecord={setPrescriptionMedications}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Form>
                }
              />
            </div>

            <div className="prescription-mid-row-indication-details">
              <SectionContainer
                title={<Text className="font-style">Indication Details</Text>}
                content={
                  <Form>
                    <div className="prescription-indication-blocks">
                      <div className="indication-icd-section">
                        <div className="indication-icd-label-wrapper">
                          <Text className="indication-icd-label">
                            ICD-10
                            <span className="required-asterisk">*</span>
                          </Text>
                        </div>
                        <PatientDiagnosisTable
                          patient={patient}
                          disabled={false}
                          selectMode
                          selectedDiagnosisId={prescriptionMedication?.indicationIcd ?? null}
                          onSelectDiagnosis={ids => {
                            const selectedIcd = ids?.[0];
                            setPrescriptionMedications(prev => ({
                              ...prev,
                              indicationIcd: selectedIcd
                            }));
                          }}
                        />
                      </div>

                      <div className="indication-other-fields-row">
                        <div className="indication-field">
                          <MyInput
                            width="20vw"
                            fieldType="select"
                            showLabel={true}
                            placeholder="Select Indication Use"
                            fieldLabel="Indication Use"
                            selectData={indicationLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            disableByField='isValid'

                            selectDataValue="key"
                            fieldName={'indicationUseLkey'}
                            record={safeRecord}
                            setRecord={setPrescriptionMedications}
                            searchable={false}
                            required
                            disabled={preKey == null}
                          />
                          <Input
                            as="textarea"
                            rows={4}
                            value={prescriptionMedication?.indicationManually || ''}
                            onChange={value => {
                              setPrescriptionMedications(prev => ({
                                ...prev,
                                indicationManually: value
                              }));
                            }}
                            placeholder="Indication"
                            disabled={preKey == null}
                            className="indication-manual-textarea"
                          />
                        </div>

                        <div className="indication-field indication-field-admin">
                          <MyInput
                            width="20vw"
                            fieldType="checkPicker"
                            fieldLabel="Administration Instructions"
                            selectData={administrationInstructionsLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            disableByField='isValid'

                            selectDataValue="key"
                            fieldName="administrationInstructions"
                            record={adminInstructions}
                            setRecord={setAdminInstructions}
                            disabled={preKey == null}
                          />
                          <Input
                            as="textarea"
                            rows={4}
                            readOnly
                            value={
                              adminInstructions?.administrationInstructions?.length
                                ? adminInstructions.administrationInstructions
                                  .map(key => {
                                    return (
                                      conjureValueBasedOnKeyFromList(
                                        administrationInstructionsLovQueryResponse?.object ?? [],
                                        key,
                                        'lovDisplayVale'
                                      ) || String(key)
                                    );
                                  })
                                  .filter(Boolean)
                                  .join('\n')
                                : ''
                            }
                            className="indication-display-field"
                            placeholder="No selection"
                          />
                        </div>
                      </div>
                    </div>
                  </Form>
                }
              />
            </div>

            <div className="prescription-mid-row">
              <SectionContainer
                title={<Text className="font-style">Refills and Parameters to monitor</Text>}
                content={
                  <Form>
                    <MyLabel label="Parameters to monitor" />
                    <MyTagInput
                      tags={tags}
                      setTags={setTags}
                      onRemoveTag={(tagToDelete: string) => {
                        setTags(prev =>
                          prev.filter(tag => String(tag).trim() !== String(tagToDelete).trim())
                        );
                      }}
                      onClearAll={() => setTags([])}
                    />
                  </Form>
                }
              />

              <SectionContainer
                title={<Text className="font-style">Notes</Text>}
                content={
                  <Form>
                    <MyInput
                      disabled={preKey == null}
                      height={100}
                      fieldType="textarea"
                      fieldName="notes"
                      record={safeRecord}
                      setRecord={setPrescriptionMedications}
                      width="100%"
                    />
                    <MyInput
                      disabled={preKey == null}
                      height={100}
                      fieldType="textarea"
                      fieldName="extraDocumentation"
                      record={safeRecord}
                      setRecord={setPrescriptionMedications}
                      width="100%"
                    />
                  </Form>
                }
              />
            </div>
          </div>
        }
      />

      <Substitues
        open={openSubstitutesModel}
        setOpen={setOpenSubstitutesModel}
        selectedGeneric={selectedGeneric}
        setSelectedGeneric={setSelectedGeneric}
      />

      <MyModal
        open={openOrderModel}
        setOpen={setOpenOrderModel}
        size="full"
        title="Add Order"
        content={
          <div dir={dir}>
            <DiagnosticsOrder edit={edit} patient={patient} encounter={encounter} />
          </div>
        }
      />
    </div>
  );
};

export default DetailsModal;
