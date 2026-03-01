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
  useGetCustomeInstructionsQuery,
  useSavePrescriptionMedicationMutation
} from '@/services/encounterService';
import { newApPrescriptionMedications } from '@/types/model-types-constructor';
import { faRightLeft, faPills } from '@fortawesome/free-solid-svg-icons';
import Instructions from './Instructions';
import Substitues from '../drug-order/SubstitutesNew';
import clsx from 'clsx';
import DiagnosticsOrder from '../diagnostics-order-new';
import CheckIcon from '@rsuite/icons/Check';
import MyModal from '@/components/MyModal/MyModal';
import MultiSelectAppender from '@/pages/medical-component/multi-select-appender/MultiSelectAppender';
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
  const { data: DurationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_DURATION');
  const { data: administrationInstructionsLovQueryResponse } =
    useGetLovValuesByCodeQuery('PRESC_INSTRUCTIONS');
  const { data: instructionTypeQueryResponse } = useGetLovValuesByCodeQuery('PRESC_INSTR_TYPE');
  const { data: refillunitQueryResponse } = useGetLovValuesByCodeQuery('REFILL_INTERVAL');
  const { data: indicationLovQueryResponse } = useGetLovValuesByCodeQuery('MED_INDICATION_USE');
  const [openSubstitutesModel, setOpenSubstitutesModel] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const { data: genericMedicationListResponse } =
    useSearchBrandMedicationsByNameOrActiveQuery({ keyword: searchKeyword });
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

  const { data: icdListResponseLoading } = useGetIcdListQuery(icdListRequest);
  const modifiedData = (icdListResponseLoading?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.icdCode} - ${item.description}`
  }));

  const [savePrescriptionMedication, { isLoading: isSavingPrescriptionMedication }] =
    useSavePrescriptionMedicationMutation();

  useEffect(() => {
    if (!open) return;
    setEditingKey(prescriptionMedication?.key ?? null);
  }, [open, prescriptionMedication?.key]);


  useEffect(() => {
    if (prescriptionMedication.key != null && Brand) {

      setSelectedGeneric(Brand);
      setSelectedOption(prescriptionMedication?.instructionsTypeLkey);
      setInstruc(prescriptionMedication.administrationInstructions);
      setTags(prescriptionMedication?.parametersToMonitor?.split(',') ?? []);

      // FIX: reload ICD saved from backend
      setindicationsDescription(prescriptionMedication.indicationIcd ?? "");

      if (prescriptionMedication?.instructionsTypeLkey === '3010606785535008') {
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

  const handleSaveMedication = async () => {
    if (!preKey) {
      dispatch(notify({ msg: 'Prescription not linked. Try again', sev: 'warning' }));
      return;
    }

    if (!selectedGeneric) {
      dispatch(notify({ msg: 'Please Select Brand', sev: 'warning' }));
      return;
    }

    if (!prescriptionMedication.instructionsTypeLkey) {
      dispatch(notify({ msg: 'Please Select Instruction type', sev: 'warning' }));
      return;
    }

    const tagcompine = joinValuesFromArray(tags);

    try {
      await savePrescriptionMedication({
        ...prescriptionMedication,
        key: editingKey ?? prescriptionMedication?.key,
        patientKey: patient.key,
        visitKey: encounter.key,
        prescriptionKey: preKey,
        genericMedicationsId: selectedGeneric.id,
        parametersToMonitor: tagcompine,
        statusLkey: '164797574082125',
        instructions: inst,
        dose: selectedOption === '3010606785535008' ? customeinst?.dose : null,
        frequencyLkey: selectedOption === '3010606785535008' ? customeinst?.frequency : null,
        unitLkey: selectedOption === '3010606785535008' ? customeinst?.unit : null,
        roaLkey: selectedOption === '3010606785535008' ? customeinst?.roa : null,
        administrationInstructions: instr,
        indicationIcd: indicationsDescription
      }).unwrap();

      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));

      await Promise.all([medicRefetch(), refetchCo()]);

      handleCleare();
      setOpen(false);

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
  const handleItemClick = Generic => {
    setSelectedGeneric(Generic);
    setSearchKeyword('');
  };
  const handleSearchIcd = value => {
    setSearchKeywordicd(value);
  };
  const handleSearch = value => {
    setSearchKeyword(value);
  };
  const handleRecall = rowData => {
    const genericMedication = genericMedicationListResponse?.find(
      item => item.id === rowData.genericMedicationsId
    );

    setOrderMedication({
      ...newApPrescriptionMedications,
      ...rowData,
      prescriptionKey: drugKey,
      genericName: genericMedication?.name || '',
      dose: rowData.dose || null,
      doseUnitLkey: rowData.doseUnitLkey || null,
      frequency: rowData.frequency || null,
      roaLkey: rowData.roaLkey || null,
      chronicMedication: rowData.chronicMedication || false,
      priorityLkey: rowData.priorityLkey || null,
      durationTypeLkey: rowData.durationTypeLkey || null,
      indicationUseLkey: rowData.indicationUseLkey || null,
      pharmacyDepartmentKey: rowData.pharmacyDepartmentKey || null
    });

    setSelectedGeneric(genericMedication || null);
    // setOpenFavoritesModal(false);
    // setOpenDetailsModel(true);
    // setOpenToAdd(true);
  };

  const handleAddNewAttachment = () => {
    const sourceIdValue = prescriptionMedication?.key ? Number(prescriptionMedication.key) : 0;
    setCapturedSourceId(sourceIdValue);
    setAttachmentsModalOpen(true);
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


  return (
    <>
      <AdvancedModal
        open={open}
        setOpen={setOpen}
        actionButtonFunction={handleSaveMedication}
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
                        <div className="prescription-search-wrapper">
                          <div className='prescription-search-button-position-handle'>
                            <InputGroup inside className="input-search-p">
                              <Input
                                placeholder={'Medication Name'}
                                value={searchKeyword}
                                onChange={handleSearch}
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
                          {searchKeyword && (
                            <Dropdown.Menu className="prescription-dropdown-menuresult">
                              {genericMedicationListResponse?.map(Generic => (
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
                                instructionsTypeLkey: v
                              }));
                            }}

                          >
                            {instructionTypeQueryResponse?.object?.map((instruction, index) => (
                              <Radio key={index} value={instruction.key}>
                                {instruction.lovDisplayVale}
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
                            fieldName={'durationTypeLkey'}
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
                            fieldName={'maximumDose'}
                            record={prescriptionMedication}
                            setRecord={setPrescriptionMedications}
                          />

                          <MyInput
                            disabled={preKey != null ? false : true}
                            width={140}
                            fieldType="date"
                            fieldLabel="Valid Until"
                            fieldName={'validUtil'}
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
                          <div className="icd-search-wrapper">
                            <InputGroup inside className="indication-input">
                              <Input
                                disabled={preKey == null}
                                placeholder="Search ICD-10"
                                value={searchKeywordicd}
                                onChange={handleSearchIcd}
                              />
                              <InputGroup.Button>
                                <SearchIcon />
                              </InputGroup.Button>
                            </InputGroup>

                            {searchKeywordicd && (
                              <Dropdown.Menu className="prescription-dropdown-menuresult">
                                {modifiedData?.map(mod => (
                                  <Dropdown.Item
                                    key={mod.key}
                                    eventKey={mod.key}
                                    onClick={() => {
                                      setIndicationsIcd({ ...indicationsIcd, indicationIcd: mod.key });
                                      setSearchKeywordicd('');
                                    }}
                                  >
                                    {mod.icdCode} - {mod.description}
                                  </Dropdown.Item>
                                ))}
                              </Dropdown.Menu>
                            )}
                          </div>

                          <Input
                            as="textarea"
                            disabled
                            value={indicationsDescription || prescriptionMedication.indicationIcd}
                            rows={3}
                            className="indication-textarea"
                          />
                        </div>


                        {/* SNOMED */}
                        <div className="indication-field">
                          <InputGroup inside className="indication-input">
                            <Input
                              disabled={preKey != null ? false : true}
                              placeholder="Search SNOMED-CT"
                            />
                            <InputGroup.Button>
                              <SearchIcon />
                            </InputGroup.Button>
                          </InputGroup>

                          <Input
                            as="textarea"
                            disabled
                            rows={3}
                            className="indication-textarea"
                          />
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
                          <MultiSelectAppender
                            label="Administration Instructions"
                            options={administrationInstructionsLovQueryResponse?.object ?? []}
                            optionLabel="lovDisplayVale"
                            optionValue="key"
                            setObject={setInstruc}
                            object={instr}
                          /></div>
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
                        fieldName="refillIntervalValue"
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
                        fieldName="refillIntervalUnitLkey"
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
                      fieldName={'notes'}
                      record={''}
                      setRecord={setOrderMedication}
                      width="100%"
                    />

                    <MyInput
                      disabled={drugKey != null ? editing : true}
                      height={20}
                      fieldType="textarea"
                      fieldName={'extraDocumentation'}
                      record={''}
                      setRecord={setOrderMedication}
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

      <AttachmentUploadModal
        isOpen={attachmentsModalOpen}
        setIsOpen={setAttachmentsModalOpen}
        encounterId={encounter?.id || encounter?.key}
        refetchData={() => { }}
        source="PRESCRIPTION_ORDER_ATTACHMENT"
        sourceId={capturedSourceId}
      />
    </>
  );
};
export default DetailsModal;