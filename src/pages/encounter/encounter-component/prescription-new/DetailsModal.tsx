import AdvancedModal from '@/components/AdvancedModal';
import { useAppDispatch } from '@/hooks';
import { useGetIcdListQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SearchIcon from '@rsuite/icons/Search';
import React, { useEffect, useState } from 'react';
import { Dropdown, Form, Input, InputGroup, Radio, RadioGroup, Text } from 'rsuite';
import ActiveIngrediantList from './ActiveIngredient';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import MyTagInput from '@/components/MyTagInput/MyTagInput';
import MultiSelectAppender from '@/pages/medical-component/multi-select-appender/MultiSelectAppender';
import { useGetCustomeInstructionsQuery } from '@/services/encounterService';
import {
  useCreatePatientPrescriptionMedicationMutation,
  useUpdatePatientPrescriptionMedicationMutation
} from '@/services/patients/Prescription/patientPrescriptionMedicationService';
import { newApPrescriptionMedications } from '@/types/model-types-constructor';
import { faRightLeft, faPills } from '@fortawesome/free-solid-svg-icons';
import Instructions from './Instructions';
import Substitues from '../drug-order/SubstitutesNew';
import clsx from 'clsx';
import DiagnosticsOrder from '../diagnostics-order-new';
import CheckIcon from '@rsuite/icons/Check';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { newApDrugOrderMedications } from '@/types/model-types-constructor';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { FaDownload } from 'react-icons/fa';
import { PlusRound } from '@rsuite/icons';
import {
  useGetBrandMedicationByIdQuery,
  useSearchBrandMedicationsByNameOrActiveQuery
} from '@/services/setup/brandmedication/BrandMedicationService ';
import './styles.less';
import SectionContainer from '@/components/SectionsoContainer';
import { AttachmentUploadModal } from '@/components/AttachmentModals';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import { useLazyGetActiveIngredientPreRequestedTestsQuery } from '@/services/setup/activeIngredients/activeIngredientPreRequestedTestService';
import InfoCardList from '@/components/InfoCardList';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import Icd10DiagnosisSearch from '@/components/Icd10DiagnosisSearch';

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
  editing
}) => {
  const dispatch = useAppDispatch();
  const [openOrderModel, setOpenOrderModel] = useState(false);
  const [selectedGeneric, setSelectedGeneric] = useState(null);
  const [tags, setTags] = React.useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  const searchWrapperRef = React.useRef<HTMLDivElement>(null);
  // ✅ Pre-requested tests loading (per active ingredient)
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
  const instructionTypeOptions = useEnumOptions('PrescriptionInstructionsType');
  const { data: DurationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_DURATION');
  const { data: administrationInstructionsLovQueryResponse } =
    useGetLovValuesByCodeQuery('PRESC_INSTRUCTIONS');
  const { data: instructionTypeQueryResponse } = useGetLovValuesByCodeQuery('PRESC_INSTR_TYPE');
  const { data: refillunitQueryResponse } = useGetLovValuesByCodeQuery('REFILL_INTERVAL');
  const { data: indicationLovQueryResponse } = useGetLovValuesByCodeQuery('MED_INDICATION_USE');
  const [openSubstitutesModel, setOpenSubstitutesModel] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Only search when modal is open and keyword is valid (at least 2 characters)
  const shouldSkipSearch = !open || !searchKeyword || searchKeyword.trim().length < 2;

  const { data: genericMedicationListResponse } = useSearchBrandMedicationsByNameOrActiveQuery(
    { keyword: searchKeyword },
    {
      skip: shouldSkipSearch
    }
  );
  const genericMedicationData: any[] = Array.isArray(genericMedicationListResponse)
    ? genericMedicationListResponse
    : (genericMedicationListResponse as any)?.data ?? [];
  const medIdForBrand =
    prescriptionMedication?.medicationsId ?? prescriptionMedication?.genericMedicationsId;
  const { data: Brand } = useGetBrandMedicationByIdQuery(medIdForBrand, {
    skip: !medIdForBrand
  });
  const [instr, setInstruc] = useState(null);
  const [editDuration, setEditDuration] = useState(false);

  const { data: unitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const {
    data: customeInstructions,
    isLoading: isLoadingCustomeInstructions,
    refetch: refetchCo
  } = useGetCustomeInstructionsQuery({
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
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [capturedSourceId, setCapturedSourceId] = useState<number>(0);
  const { data: diagnosticTestsResult } = useGetAllDiagnosticTestsQuery({
    page: 0,
    size: 9999
  });
  const diagnosticTests = diagnosticTestsResult?.data ?? [];

  const { data: icdListResponseLoading } = useGetIcdListQuery(icdListRequest);
  const modifiedData = (icdListResponseLoading?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.icdCode} - ${item.description}`
  }));

  const [savePrescriptionMedication, { isLoading: isSavingPrescriptionMedication }] =
    useCreatePatientPrescriptionMedicationMutation();
  const [updatePrescriptionMedication, { isLoading: isUpdatingPrescriptionMedication }] =
    useUpdatePatientPrescriptionMedicationMutation();

  useEffect(() => {
    if (!open) {
      // Reset search keyword when modal closes to prevent unnecessary queries
      setSearchKeyword('');
      return;
    }
    setEditingKey(prescriptionMedication?.key ?? null);
  }, [open, prescriptionMedication?.key]);

  useEffect(() => {
    // Check if we have a medication to edit (either by key or id)
    const hasMedication = prescriptionMedication?.key != null || prescriptionMedication?.id != null;

    if (hasMedication && Brand) {
      setSelectedGeneric(Brand);
      setSelectedOption(prescriptionMedication?.instructionsType);
      setInstruc(prescriptionMedication.administrationInstructions);

      // Handle indicationUseLkey - ensure it's set for the select dropdown
      if (
        (prescriptionMedication?.indicationUseLkey != null ||
          prescriptionMedication?.indicationUse != null) &&
        indicationLovQueryResponse?.object
      ) {
        const indicationValue = prescriptionMedication?.indicationUse;
        const sampleLovKey = indicationLovQueryResponse?.object?.[0]?.key;

        // Convert to match LOV key type if needed
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

      setTags(prescriptionMedication?.parametersToMonitor?.split(',') ?? []);

      // FIX: reload ICD saved from backend
      setindicationsDescription(prescriptionMedication.indicationIcd ?? '');

      if (prescriptionMedication?.instructionsType === 'CUSTOM_INSTRUCTIONS') {
        // Try to find custom instructions by key or id
        const medicationKey = prescriptionMedication.key ?? prescriptionMedication.id;
        const instruc = customeInstructions?.object?.find(
          item =>
            String(item.prescriptionMedicationsKey) === String(medicationKey) ||
            String(item.prescriptionMedicationsKey) === String(prescriptionMedication.id)
        );

        if (instruc) {
          setCustomeinst({
            dose: instruc?.dose,
            unit: instruc?.unitLkey,
            frequency: instruc?.frequencyLkey,
            roa: instruc?.roaLkey
          });
        } else {
          // Fallback: use values directly from prescriptionMedication if available
          setCustomeinst({
            dose: prescriptionMedication?.dose ?? null,
            unit: prescriptionMedication?.doesUnit ?? null,
            frequency: prescriptionMedication?.frequency ?? null,
            roa: prescriptionMedication?.rout ?? null
          });
        }
      }
    } else if (hasMedication && !Brand && medIdForBrand) {
      // If we have medication ID but Brand hasn't loaded yet, wait for it
      // This handles the case where Brand query is still loading
    }
  }, [
    prescriptionMedication,
    Brand,
    customeInstructions,
    medIdForBrand,
    indicationLovQueryResponse
  ]);

  // Separate useEffect to handle Administration Instructions when LOV data is loaded
  useEffect(() => {
    const hasMedication = prescriptionMedication?.key != null || prescriptionMedication?.id != null;
    if (!hasMedication || !administrationInstructionsLovQueryResponse?.object) {
      return;
    }

    // Handle administrationInstructions - convert to array for checkPicker
    // Need to ensure keys match LOV key type (strings like '2412378840775947')
    const adminInstr = prescriptionMedication.administrationInstructions;
    const sampleLovKey = administrationInstructionsLovQueryResponse.object[0]?.key;
    const keysAreStrings = typeof sampleLovKey === 'string';

    if (typeof adminInstr === 'string' && adminInstr) {
      const arr = adminInstr
        .split(',')
        .map(v => {
          const trimmed = v.trim();
          if (!trimmed) return null;

          // Convert to match LOV key type
          if (keysAreStrings) {
            return trimmed; // Keep as string
          } else {
            const num = Number(trimmed);
            return !isNaN(num) ? num : trimmed;
          }
        })
        .filter(v => v !== null && v !== '');

      setAdminInstructions({ administrationInstructions: arr });
    } else if (Array.isArray(adminInstr)) {
      const arr = adminInstr
        .map(v => {
          if (keysAreStrings && typeof v !== 'string') {
            return String(v);
          } else if (!keysAreStrings && typeof v === 'string') {
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
          {
            fieldName: 'icd_code',
            operator: 'containsIgnoreCase',
            value: searchKeywordicd
          },
          {
            fieldName: 'description',
            operator: 'containsIgnoreCase',
            value: searchKeywordicd
          }
        ]
      });
    }
  }, [searchKeywordicd]);

  useEffect(() => {
    if (!open) return;
    if (!selectedGeneric?.activeIngredients?.length) {
      setTestsByAiId({});
      return;
    }

    (async () => {
      try {
        const aiList = selectedGeneric.activeIngredients ?? [];
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
  }, [open, selectedGeneric, fetchPreRequestedTests]);

  useEffect(() => {
    setEditDuration(prescriptionMedication.chronicMedication);
    setPrescriptionMedications(prev => ({
      ...prev,
      duration: null,
      durationTypeLkey: null
    }));
  }, [prescriptionMedication.chronicMedication]);

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
  }, [indicationsIcd.indicationIcd]);

  const joinValuesFromArray = values => {
    return values?.filter(Boolean)?.join(', ');
  };

  const handleSaveMedication = async (shouldClose: boolean = false) => {
    if (!preKey) {
      dispatch(notify({ msg: 'Prescription not linked. Try again', sev: 'warning' }));
      return;
    }

    if (!selectedGeneric) {
      dispatch(notify({ msg: 'Please Select Brand Medication', sev: 'warning' }));
      return;
    }

    if (!selectedOption && !prescriptionMedication.instructionsType) {
      dispatch(notify({ msg: 'Please Select Instruction type', sev: 'warning' }));
      return;
    }

    // Validate instruction type fields based on selected option
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
    // Handle administrationInstructions - convert array to comma-separated string
    let administrationInstructionValue = null;
    if (adminInstructions?.administrationInstructions?.length) {
      const joined = adminInstructions.administrationInstructions.join(',');
      administrationInstructionValue = joined;
    }
    const selectedMedicationId = selectedGeneric?.id ?? prescriptionMedication?.medicationsId;

    if (!selectedMedicationId) {
      dispatch(notify({ msg: 'Medication is required', sev: 'warning' }));
      return;
    }

    // ======================
    // Required fields validation (per business rules)
    // - Duration must be set unless Chronic is true
    // - Indication must be present (ICD or manual)
    // ======================
    const isChronic = Boolean(prescriptionMedication?.chronicMedication);
    const durationRaw = (prescriptionMedication as any)?.duration;
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

    const indicationIcd = (prescriptionMedication as any)?.indicationIcd;
    const indicationManual = String(
      (prescriptionMedication as any)?.indicationManually ?? ''
    ).trim();
    const hasIndication =
      (indicationIcd !== null &&
        indicationIcd !== undefined &&
        String(indicationIcd).trim() !== '') ||
      indicationManual.length > 0;

    if (!hasIndication) {
      dispatch(notify({ msg: 'Indication Is missing', sev: 'warning' }));
      return;
    }

    // Indication Use is required
    const indicationUseValue =
      (prescriptionMedication as any)?.indicationUse ??
      (prescriptionMedication as any)?.indicationUseLkey ??
      null;
    const hasIndicationUse =
      indicationUseValue !== null &&
      indicationUseValue !== undefined &&
      String(indicationUseValue).trim() !== '';

    // Validate validUtil is not in the past
    const validUntilRaw = (prescriptionMedication as any)?.validUtil;
    if (validUntilRaw) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(validUntilRaw) < today) {
        dispatch(notify({ msg: 'Valid Until cannot be a past date', sev: 'warning' }));
        return;
      }
    }
    if (!hasIndicationUse) {
      dispatch(notify({ msg: 'Please fill Indication Use', sev: 'warning' }));
      return;
    }

    const createPayload: any = {
      prescriptionHeaderId: preKey,
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
      validUtil: prescriptionMedication?.validUtil ?? null,
      allowedSubstitute:
        prescriptionMedication?.allowedSubstitute ??
        prescriptionMedication?.genericSubstitute ??
        false,
      indicationManually: prescriptionMedication?.indicationManually ?? null,
      indicationUse:
        prescriptionMedication?.indicationUse ?? prescriptionMedication?.indicationUseLkey ?? null,
      indicationIcd: prescriptionMedication?.indicationIcd ?? null,
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
      // Check if we're updating an existing medication (has id or key)
      const medicationId = prescriptionMedication?.id ?? prescriptionMedication?.key;
      if (medicationId) {
        await updatePrescriptionMedication({
          id: Number(medicationId),
          body: {
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
            validUtil: createPayload.validUtil,
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
      console.log('Save prescription medication error:', error);
      if (error?.originalStatus === 409) {
        return;
      }

      let errorMessage = 'Save failed';
      if (error?.data) {
        if (typeof error.data === 'string') errorMessage = error.data;
        else if (error.data?.message) errorMessage = error.data.message;
      }

      dispatch(notify({ msg: errorMessage, sev: 'warning' }));
    }
  };

  const handleSaveAndClose = () => {
    handleSaveMedication(true);
  };
  const handleItemClick = Generic => {
    setSelectedGeneric(Generic);
    setSearchKeyword('');
    setShowMedicationDropdown(false);
  };
  const handleSearchIcd = value => {
    setSearchKeywordicd(value);
  };
  const handleSearch = value => {
    setSearchKeyword(value);
    setShowMedicationDropdown(!!value);
  };

  useEffect(() => {
    if (attachmentsModalOpen) {
    } else {
      setCapturedSourceId(0);
    }
  }, [attachmentsModalOpen]);

  useEffect(() => {
    if (!open) return;
    // Only clear if we're adding new medication (no key and no id)
    if (!prescriptionMedication?.key && !prescriptionMedication?.id) {
      handleCleare();
    }
  }, [open, prescriptionMedication?.key, prescriptionMedication?.id]);

  // Handle click outside medication search dropdown
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

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMedicationDropdown]);

  const handleCleare = () => {
    setPrescriptionMedications(newApPrescriptionMedications);
    setSelectedGeneric(null);
    setSelectedOption(null);
    setInstruc(null);
    setAdminInstructions({ administrationInstructions: [] });
    setCustomeinst({ dose: null, unit: null, frequency: null, roa: null });
    setTags([]);
    setSearchKeyword('');
    setSearchKeywordicd('');
    setEditingKey(null);
    setindicationsDescription('');
    setIndicationsIcd({ indicationIcd: null });
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

  // Direction handling for RTL/LTR
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
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckIcon /> Save
          </span>
        }
        size="70vw"
        leftTitle={selectedGeneric ? selectedGeneric.name : 'Select Generic'}
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
              onClick={() => {
                setOpenOrderModel(true);
              }}
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
                        {/* Medication Search */}
                        <div className="prescription-search-wrapper" ref={searchWrapperRef}>
                          <div className="prescription-search-button-position-handle">
                            <InputGroup inside className="input-search-p">
                              <Input
                                placeholder={'Medication Name'}
                                value={searchKeyword}
                                onChange={handleSearch}
                                onFocus={() => setShowMedicationDropdown(!!searchKeyword)}
                              />
                              <InputGroup.Button>
                                <SearchIcon />
                              </InputGroup.Button>
                            </InputGroup>

                            <div className="prescription-button-wrapper">
                              <MyButton
                                radius="25px"
                                appearance="ghost"
                                onClick={() => setOpenSubstitutesModel(true)}
                                color={
                                  prescriptionMedication?.chronicMedication ? '#1675E0' : '#808099'
                                }
                                prefixIcon={() => <FontAwesomeIcon icon={faRightLeft} />}
                              />
                            </div>
                          </div>
                          {showMedicationDropdown && searchKeyword && (
                            <Dropdown.Menu className="prescription-dropdown-menuresult">
                              {genericMedicationData.map((Generic: any) => (
                                <Dropdown.Item
                                  key={Generic.id}
                                  eventKey={Generic.id}
                                  onClick={() => handleItemClick(Generic)}
                                >
                                  <div className="prescription-dropdown-item-content">
                                    <div className="prescription-dropdown-item-title">
                                      {Generic.name}{' '}
                                      {/* {Generic.dosageFormLvalue?.lovDisplayVale &&
                                          `(${Generic.dosageFormLvalue?.lovDisplayVale})`} */}
                                    </div>
                                    {/* <div className="prescription-dropdown-item-sub">
                                        {Generic.manufacturerLvalue?.lovDisplayVale}{' '}
                                        {Generic.roaLvalue?.lovDisplayVale &&
                                          `| ${Generic.roaLvalue?.lovDisplayVale}`}
                                      </div> */}
                                    <div className="prescription-dropdown-item-extra">
                                      {Generic.activeIngredients?.length ? (
                                        <ul>
                                          {Generic.activeIngredients.map(ai => (
                                            <li key={ai.id}>
                                              {ai.name}
                                              {ai.atcCode ? ` (${ai.atcCode})` : ''}
                                              {ai.strength != null
                                                ? ` - ${
                                                    ai.strength
                                                  }${conjureValueBasedOnKeyFromList(
                                                    unitLov?.object,
                                                    ai?.unit,
                                                    'lovDisplayVale'
                                                  )} `
                                                : ''}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <div>No active ingredients</div>
                                      )}
                                    </div>
                                  </div>
                                </Dropdown.Item>
                              ))}
                            </Dropdown.Menu>
                          )}
                        </div>

                        {/* Substitute Button */}
                      </div>

                      <div className="prescription-full-block">
                        {/* Instruction Type Radio Group */}
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
                                {instruction.label}
                              </Radio>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>

                      <div className="prescription-full-block">
                        {/* Instructions Component */}
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
                        {/* Duration Fields */}
                        <div className="prescription-inputs-inline">
                          <MyInput
                            disabled={preKey != null ? editDuration : true}
                            width={120}
                            fieldType="number"
                            fieldLabel="Duration"
                            fieldName={'duration'}
                            record={prescriptionMedication}
                            setRecord={setPrescriptionMedications}
                          />
                          <MyInput
                            disabled={preKey != null ? editDuration : true}
                            width={142}
                            fieldType="select"
                            fieldLabel="Duration Type"
                            selectData={DurationTypeLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName="durationType"
                            record={prescriptionMedication}
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
                              record={prescriptionMedication}
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
                            record={prescriptionMedication}
                            setRecord={setPrescriptionMedications}
                          />

                          <MyInput
                            disabled={preKey != null ? false : true}
                            width={140}
                            fieldType="date"
                            fieldLabel="Valid Until"
                            fieldName="validUtil"
                            record={prescriptionMedication}
                            setRecord={setPrescriptionMedications}
                            disablePastDates
                            showWarningIfInPast
                          />
                          <div style={{ marginBottom: '1.5vw' }}>
                            <MyInput
                              disabled={preKey != null ? false : true}
                              width={140}
                              fieldLabel="Brand Substitute Allowed"
                              fieldType="checkbox"
                              fieldName="genericSubstitute"
                              record={prescriptionMedication}
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
                      {/* ICD-10 Section - Full Width at Top */}
                      <div className="indication-icd-section">
                        <div className="indication-icd-label-wrapper">
                          <Text className="indication-icd-label">
                            ICD-10
                            <span className="required-asterisk">*</span>
                          </Text>
                        </div>
                        <Icd10DiagnosisSearch
                          diagnosisId={(prescriptionMedication.indicationIcd as any) ?? null}
                          setDiagnosisId={(id: number | null) =>
                            setPrescriptionMedications(prev => ({ ...prev, indicationIcd: id }))
                          }
                          label=""
                          disabled={preKey == null}
                        />
                      </div>

                      {/* Other Fields Section - Two Columns Below */}
                      <div className="indication-other-fields-row">
                        {/* Indication Use */}
                        <div className="indication-field">
                          <MyInput
                            width="20vw"
                            fieldType="select"
                            showLabel={true}
                            placeholder="Select Indication Use"
                            fieldLabel="Indication Use"
                            selectData={indicationLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName={'indicationUseLkey'}
                            record={prescriptionMedication}
                            setRecord={setPrescriptionMedications}
                            searchable={false}
                            required
                            disabled={preKey == null}
                          />
                          {/* Manual Indication - Free Text Field (under Indication Use) */}
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

                        {/* Administration Instructions */}
                        <div className="indication-field indication-field-admin">
                          <MyInput
                            width="20vw"
                            fieldType="checkPicker"
                            fieldLabel="Administration Instructions"
                            selectData={administrationInstructionsLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
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
                    <MyTagInput tags={tags} setTags={setTags} />

                    <div className="prescription-refills-blocks">
                      <MyInput
                        disabled={preKey == null}
                        width={140}
                        fieldType="number"
                        fieldLabel="Number of Refills"
                        fieldName="numberOfRefills"
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                      />

                      <MyInput
                        disabled={preKey == null}
                        width={180}
                        fieldType="number"
                        fieldLabel="Refill Interval Value"
                        fieldName="refillValue"
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                      />

                      <MyInput
                        disabled={preKey == null}
                        width={180}
                        fieldType="select"
                        fieldLabel="Refill Interval Unit"
                        selectData={refillunitQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName="refillUnit"
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                      />
                    </div>
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
                      record={prescriptionMedication}
                      setRecord={setPrescriptionMedications}
                      width="100%"
                    />

                    <MyInput
                      disabled={preKey == null}
                      height={100}
                      fieldType="textarea"
                      fieldName="extraDocumentation"
                      record={prescriptionMedication}
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
        size={'full'}
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
