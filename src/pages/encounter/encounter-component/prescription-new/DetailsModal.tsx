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
import {
  useGetCustomeInstructionsQuery
} from '@/services/encounterService';
import {
  useCreatePatientPrescriptionMedicationMutation,
  useUpdatePatientPrescriptionMedicationMutation,
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
import { useGetBrandMedicationByIdQuery, useSearchBrandMedicationsByNameOrActiveQuery } from '@/services/setup/brandmedication/BrandMedicationService ';
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
  
  const { data: genericMedicationListResponse } =
    useSearchBrandMedicationsByNameOrActiveQuery(
      { keyword: searchKeyword },
      { 
        skip: shouldSkipSearch
      }
    );
  const genericMedicationData: any[] = Array.isArray(genericMedicationListResponse)
    ? genericMedicationListResponse
    : (genericMedicationListResponse as any)?.data ?? [];
  const { data: Brand } = useGetBrandMedicationByIdQuery(prescriptionMedication?.genericMedicationsId, {
    skip: !prescriptionMedication?.genericMedicationsId,
  });
  const [instr, setInstruc] = useState(null);
  const [editDuration, setEditDuration] = useState(false);

  const { data: unitLov } = useGetLovValuesByCodeQuery("VALUE_UNIT");
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
    size: 9999,
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
    if (prescriptionMedication.key != null && Brand) {

      setSelectedGeneric(Brand);
      setSelectedOption(prescriptionMedication?.instructionsType);
      setInstruc(prescriptionMedication.administrationInstructions);
      setTags(prescriptionMedication?.parametersToMonitor?.split(',') ?? []);

      // FIX: reload ICD saved from backend
      setindicationsDescription(prescriptionMedication.indicationIcd ?? "");

      if (prescriptionMedication?.instructionsType === 'CUSTOM_INSTRUCTIONS') {
        const instruc = customeInstructions?.object?.find(
          item => item.prescriptionMedicationsKey === prescriptionMedication.key
        );

        setCustomeinst({
          dose: instruc?.dose,
          unit: instruc?.unitLkey,
          frequency: instruc?.frequencyLkey,
          roa: instruc?.roaLkey
        });
      }
    }
  }, [prescriptionMedication, Brand, customeInstructions]);

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
    const administrationInstructionValue = Array.isArray(instr) ? instr[0] : instr;
    const selectedMedicationId = selectedGeneric?.id ?? prescriptionMedication?.medicationsId;

    if (!selectedMedicationId) {
      dispatch(notify({ msg: 'Medication is required', sev: 'warning' }));
      return;
    }

    const createPayload = {
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
          ? (customeinst?.dose ?? null)
          : (prescriptionMedication?.dose ?? null),
      doesUnit:
        selectedOption === OPTION_CUSTOM
          ? (customeinst?.unit ?? null)
          : (prescriptionMedication?.doesUnit ?? null),
      rout:
        selectedOption === OPTION_CUSTOM
          ? String(customeinst?.roa ?? '')
          : String(prescriptionMedication?.rout ?? ''),
      frequency:
        selectedOption === OPTION_CUSTOM
          ? (customeinst?.frequency ?? null)
          : (prescriptionMedication?.frequency ?? null),
      chronicMedication: Boolean(prescriptionMedication?.chronicMedication),
      duration: prescriptionMedication?.duration ?? null,
      durationType: prescriptionMedication?.durationType ?? prescriptionMedication?.durationTypeLkey ?? null,
      maximumDose: prescriptionMedication?.maximumDose ?? null,
      validUtil: prescriptionMedication?.validUtil ?? null,
      allowedSubstitute:
        prescriptionMedication?.allowedSubstitute ??
        prescriptionMedication?.genericSubstitute ??
        false,
      indicationManually: prescriptionMedication?.indicationManually ?? null,
      indicationUse:
        prescriptionMedication?.indicationUse ??
        prescriptionMedication?.indicationUseLkey ??
        null,
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
      if (prescriptionMedication?.id) {
        await updatePrescriptionMedication({
          id: Number(prescriptionMedication.id),
          body: {
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
            lastModifiedBy: patient?.key ? String(patient.key) : 'system'
          }
      }).unwrap();
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
    if (!prescriptionMedication?.key) {
      handleCleare();
    }
  }, [open, prescriptionMedication?.key]);

  // Handle click outside medication search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target as Node)
      ) {
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


  return (
    <>
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
          <>
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
          </>
        }
        footerButtons={
          <div className="footer-buttons">
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
          <div className="prescription-container">
            <div className="prescription-top-row">
              <SectionContainer
                title={<Text className="font-style">Prescription Details</Text>}
                content={
                  <Form fluid>
                    <div className="prescription-medication-form-row min-hieght">
                      <div className="prescription-full-block">
                        {/* Medication Search */}
                        <div className="prescription-search-wrapper" ref={searchWrapperRef}>
                          <div className='prescription-search-button-position-handle'>
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
                                  prescriptionMedication?.chronicMedication
                                    ? '#1675E0'
                                    : '#808099'
                                }
                                prefixIcon={() => (
                                  <FontAwesomeIcon icon={faRightLeft} />
                                )}
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
                                          {Generic.activeIngredients.map((ai) => (
                                            <li key={ai.id}>
                                              {ai.name}
                                              {ai.atcCode ? ` (${ai.atcCode})` : ""}
                                              {ai.strength != null ? ` - ${ai.strength}${conjureValueBasedOnKeyFromList(unitLov?.object, ai?.unit, "lovDisplayVale")} ` : ""}
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
                            onChange={(value) => {
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
                            /></div>
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

            <div className='prescription-mid-row-indication-details'>
              <SectionContainer
                title={<Text className="font-style">Indication Details</Text>}
                content={
                  <Form>
                    <div className="prescription-indication-blocks">

                      <div className="indication-row">

                        {/* ICD-10 */}
                        <div className="indication-field">
                        
                            <Icd10DiagnosisSearch
              diagnosisId={(prescriptionMedication.indicationIcd as any) ?? null}
              setDiagnosisId={(id: number | null) => setPrescriptionMedications(prev => ({ ...prev, indicationIcd: id }))}
              label="ICD-10"
              disabled={preKey == null}
            />
                          <span style={{ color: 'red' }}>*</span>
                        </div>

                        {/* Indication Use */}
                        <div className="indication-field">
                          <MyInput
                            width="17vw"
                            fieldType="select"
                            showLabel={false}
                            placeholder="Indication Use"
                            fieldLabel="Indication Use"
                            selectData={indicationLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName={'indicationUseLkey'}
                            record={prescriptionMedication}
                            setRecord={setPrescriptionMedications}
                            searchable={false}
                          />
                          <Input as="textarea" rows={3} className="indication-textarea-indication-use" />
                        </div>

                        {/* Manual Indication */}
                        <div className='indication-field-notes-manual-handle'>
                          <div>
                          </div>


                        </div>
                        <div className='adminstration-instructions-position'>
                          <MyInput
                            width="17vw"
                            fieldType="select"
                            fieldLabel="Administration Instructions"
                            selectData={administrationInstructionsLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName="administrationInstructions"
                            record={{ administrationInstructions: instr }}
                            setRecord={(obj: any) => setInstruc(obj?.administrationInstructions ?? null)}
                            searchable={true}
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
                        disabled={preKey != null ? false : true}
                        width={140}
                        fieldType="number"
                        fieldLabel="Number of Refills"
                        fieldName="numberOfRefills"
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                      />

                      <MyInput
                        disabled={preKey != null ? false : true}
                        width={180}
                        fieldType="number"
                        fieldLabel="Refill Interval Value"
                        fieldName="refillValue"
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                      />

                      <MyInput
                        disabled={preKey != null ? false : true}
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
                      disabled={drugKey != null ? editing : true}
                      height={20}
                      fieldType="textarea"
                      fieldName="notes"
                      record={prescriptionMedication}
                      setRecord={setPrescriptionMedications}
                      width="100%"
                    />

                    <MyInput
                      disabled={drugKey != null ? editing : true}
                      height={20}
                      fieldType="textarea"
                      fieldName="extraDocumentation"
                      record={prescriptionMedication}
                      setRecord={setPrescriptionMedications}
                      width="100%"
                    />

                  </Form>
                } />





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
        content={<DiagnosticsOrder edit={edit} patient={patient} encounter={encounter} />}
      ></MyModal>

    </>
  );
};
export default DetailsModal;

