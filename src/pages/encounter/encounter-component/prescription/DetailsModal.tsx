import AdvancedModal from "@/components/AdvancedModal";
import { useAppDispatch } from '@/hooks';
import { useGetGenericMedicationWithActiveIngredientQuery } from "@/services/medicationsSetupService";
import { useGetIcdListQuery, useGetLovValuesByCodeQuery } from "@/services/setupService";
import { initialListRequest, ListRequest } from "@/types/types";
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SearchIcon from '@rsuite/icons/Search';
import React, { useEffect, useState } from "react";
import { Col, Dropdown, Form, Input, InputGroup, Radio, RadioGroup, Row, Text } from "rsuite";
import ActiveIngrediantList from './ActiveIngredient';
import './styles.less';
import { FaFilePrescription } from "react-icons/fa6";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyLabel from "@/components/MyLabel";
import MyTagInput from "@/components/MyTagInput/MyTagInput";
import { useGetCustomeInstructionsQuery, useSavePrescriptionMedicationMutation } from "@/services/encounterService";
import { newApPrescriptionMedications } from "@/types/model-types-constructor";
import { faRightLeft } from "@fortawesome/free-solid-svg-icons";
import Instructions from "./Instructions";
import Substitues from "./Substitued";
import clsx from "clsx";

const DetailsModal = ({edit, open, setOpen, prescriptionMedication, setPrescriptionMedications, preKey,patient, encounter, medicRefetch,openToAdd }) => {
    const dispatch = useAppDispatch();
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
    const { data: administrationInstructionsLovQueryResponse } = useGetLovValuesByCodeQuery('PRESC_INSTRUCTIONS');
    const { data: roaLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: instructionTypeQueryResponse } = useGetLovValuesByCodeQuery('PRESC_INSTR_TYPE');
    const { data: refillunitQueryResponse } = useGetLovValuesByCodeQuery('REFILL_INTERVAL');
    const { data: indicationLovQueryResponse } = useGetLovValuesByCodeQuery('MED_INDICATION_USE');
    const [openSubstitutesModel, setOpenSubstitutesModel] = useState(false);
    const { data: genericMedicationListResponse } = useGetGenericMedicationWithActiveIngredientQuery(searchKeyword);
    const [instructionList,setInstructionList]=useState([]);
    const [instr,setInstruc]=useState(null)
    const [editDuration, setEditDuration] = useState(false);
    const [slectInst,setSelectInt]=useState({inst:null})
     const { data: customeInstructions, isLoading: isLoadingCustomeInstructions, refetch: refetchCo } = useGetCustomeInstructionsQuery({
            ...initialListRequest,
        }); 
    const [icdListRequest, setIcdListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ],
    });
    const { data: icdListResponseLoading } = useGetIcdListQuery(icdListRequest);
    const modifiedData = (icdListResponseLoading?.object ?? []).map(item => ({
        ...item,
        combinedLabel: `${item.icdCode} - ${item.description}`,
    }));

    const [savePrescriptionMedication, { isLoading: isSavingPrescriptionMedication }] = useSavePrescriptionMedicationMutation();
    useEffect(()=>{
        setSelectInt(null)
        if(prescriptionMedication.key!=null)           
        {
            setSelectedGeneric(genericMedicationListResponse?.object?.find(item => item.key ===prescriptionMedication.genericMedicationsKey))
            setSelectedOption(prescriptionMedication?.instructionsTypeLkey);
            const prevadmin=prescriptionMedication.administrationInstructions?.split(",")
            setInstructionList(prevadmin)
            
            setTags(prescriptionMedication?.parametersToMonitor.split(","))
            if(prescriptionMedication?.instructionsTypeLkey==="3010606785535008"){
               
                const instruc=customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === prescriptionMedication.key)
         
                setCustomeinst({...customeinst,
                    dose:instruc?.dose,
                    unit:instruc?.unitLkey,
                    frequency:instruc?.frequencyLkey,
                    roa:instruc?.roaLkey})
            }
        }
 
      
    },[prescriptionMedication])

    useEffect(() => {
        if (searchKeywordicd.trim() !== "") {
            setIcdListRequest(
                {
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
                }
            );
        }
    }, [searchKeywordicd]);
  
    
    useEffect(()=>{
        setInstruc(joinValuesFromArray(instructionList))
    },[instructionList])


    useEffect(() => {
        if (slectInst?.inst != null) {
          const foundItem = administrationInstructionsLovQueryResponse?.object?.find(
            item => item.key === slectInst?.inst
          );
      
          const value = foundItem?.lovDisplayVale;
      
          if (value) {

           
            setInstructionList(prev => [...prev, foundItem?.lovDisplayVale]);
          } else {
            console.warn("⚠️ Could not find display value for key:", slectInst.inst);
          }
        }
      }, [slectInst?.inst]);


    useEffect(() => {
        setEditDuration(prescriptionMedication.chronicMedication);
        setPrescriptionMedications({ ...prescriptionMedication, duration: null, durationTypeLkey: null })
    }, [prescriptionMedication.chronicMedication]);

    useEffect(() => {
        if (indicationsIcd.indicationIcd != null || indicationsIcd.indicationIcd != "") {
            
            setindicationsDescription(prevadminInstructions => {
                const currentIcd = icdListResponseLoading?.object?.find(
                    item => item.key === indicationsIcd.indicationIcd
                );

                if (!currentIcd) return prevadminInstructions;

                const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;

                return prevadminInstructions
                    ? `${prevadminInstructions}\n${newEntry}`
                    : newEntry;
            });
        }
    }, [indicationsIcd.indicationIcd]);

    useEffect(() => {
        setPrescriptionMedications({ ...prescriptionMedication, instructionsTypeLkey:selectedOption })

    }, [selectedOption])

    useEffect(()=>{
        console.log(open);
       setSearchKeyword("");
        if(open==false){
            handleCleare();
            
        }
    },[open]);
    useEffect(()=>{   
        if(openToAdd){
            handleCleare();  
        }
    },[openToAdd]);

    const joinValuesFromArray = (values) => {
        return values?.filter(Boolean)?.join(', ');
    };
    const handleSaveMedication = async () => {

        if (preKey === null) {
            dispatch(notify({msg:'Prescription not linked. Try again',sev:"warning"}));
            return;
        }
        else {
            if(selectedGeneric !==null){
            if (prescriptionMedication.instructionsTypeLkey != null) {
                
                const tagcompine = joinValuesFromArray(tags);
                try {
                    await savePrescriptionMedication({
                        ...prescriptionMedication,
                        patientKey: patient.key,
                        visitKey: encounter.key,
                        prescriptionKey: preKey,
                        genericMedicationsKey:selectedGeneric?.key,
                        parametersToMonitor: tagcompine,
                        statusLkey: "164797574082125",
                        instructions: inst,
                        dose: selectedOption === "3010606785535008" ? customeinst?.dose : null,
                        frequencyLkey: selectedOption === "3010606785535008" ? customeinst?.frequency : null,
                        unitLkey: selectedOption === "3010606785535008" ? customeinst?.unit : null,
                        roaLkey: selectedOption === "3010606785535008" ? customeinst?.roa : null,
                        administrationInstructions:instr,
                        indicationIcd: indicationsDescription
                    }).unwrap();

                    dispatch(notify({msg:'Saved successfully' ,sev:"success"}));

                    await Promise.all([
                        medicRefetch().then(() => ""),
                        // refetchCo().then(() => "")
                    ]);

                    handleCleare();
                    setOpen(false);
                }
                catch (error) {
                    console.error("Save failed:", error);
                    dispatch(notify('Save failed'));
                }
            }
            else {
                dispatch(notify({ msg: 'Please Select Instruction type ', sev: 'warning' }));
            }}
            else{
                dispatch(notify({ msg: 'Please Select Brand ', sev: 'warning' }));
            }
        }



    }
    const handleCleare = () => {
       
        setPrescriptionMedications({
            ...newApPrescriptionMedications,
            durationTypeLkey: null,
            administrationInstructions: null,
            instructionsTypeLkey: null,
            genericSubstitute: false,
            chronicMedication: false,
            refillIntervalUnitLkey: null,
            indicationUseLkey: null
        })
        
        setSelectedGeneric(null);
        setindicationsDescription(null);
        setSelectedOption(null);
        setInstruc(null);
        setCustomeinst({ dose: null, frequency: null, unit: null, roa: null })
        setTags([]);
        setSearchKeyword("");
        
    }
    const handleItemClick = (Generic) => {
        setSelectedGeneric(Generic);
        setSearchKeyword("")
        const newList = roaLovQueryResponse.object.filter((item) =>
            (Generic.roaList)?.includes(item.key)
        );
      
    };
    const handleSearchIcd = value => {
        setSearchKeywordicd(value);
    };
    const handleSearch = value => {
        setSearchKeyword(value);
    };
 
    return (<>
        <AdvancedModal
            open={open}
            setOpen={setOpen}
            actionButtonFunction={handleSaveMedication}           
            actionButtonLabel="Save"
            leftTitle={selectedGeneric ? selectedGeneric.genericName : "Select Generic"}
            rightTitle="Medication Order Details"
            leftContent={<> <ActiveIngrediantList selectedGeneric={selectedGeneric} /></>}
            rightContent={
                <Row gutter={15}  className={clsx('', {'disabled-panel': edit
                                                         })}>
                    <Col xs={24} md={12}>
                        <Row className="rows-gap">
                            <Col md={20}>
                                <Form layout="inline" >
                                    <InputGroup inside className='input-search-p'>
                                        <Input

                                            placeholder={'Medication Name'}
                                            value={searchKeyword}
                                            onChange={handleSearch}
                                        />
                                        <InputGroup.Button>
                                            <SearchIcon />
                                        </InputGroup.Button>
                                    </InputGroup>
                                    {searchKeyword && (
                                        <Dropdown.Menu className="dropdown-menuresult">
                                            {genericMedicationListResponse && genericMedicationListResponse?.object?.map(Generic => (
                                                <Dropdown.Item
                                                    key={Generic.key}
                                                    eventKey={Generic.key}
                                                    onClick={() => handleItemClick(Generic)}

                                                >
                                                    <span >
                                                        {[Generic.genericName,
                                                        Generic.dosageFormLvalue?.lovDisplayVale,
                                                        Generic.manufacturerLvalue?.lovDisplayVale,
                                                        Generic.roaLvalue?.lovDisplayVale]
                                                            .filter(Boolean)
                                                            .join(', ')}
                                                    </span>
                                                    {Generic.activeIngredients}
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    )}



                                </Form>
                            </Col>
                            <Col md={4}>
                                <MyButton
                                    radius={'25px'}
                                    appearance="ghost"
                                    color="#808099"
                                    onClick={() => {
                                        setOpenSubstitutesModel(true);
                                    }}
                                    prefixIcon={() => <FontAwesomeIcon icon={faRightLeft} />}
                                >

                                </MyButton>
                            </Col>
                        </Row>
                        <Row className="rows-gap">
                            <RadioGroup
                               value={selectedOption}
                                inline
                                name="radio-group"
                                disabled={preKey != null ? false: true}
                                onChange={(value) => {setSelectedOption(String(value))
                                    setPrescriptionMedications({...prescriptionMedication,instructionsTypeLkey:String(value)})
                                }}
                            >
                                <Row gutter={10}>
                                    {instructionTypeQueryResponse?.object?.map((instruction, index) => (
                                        <Col md={8} key={index}>
                                            <Radio value={instruction.key}>
                                                {instruction.lovDisplayVale}
                                            </Radio>
                                        </Col>
                                    ))}
                                </Row>
                            </RadioGroup>
                        </Row>
                        <Row className="rows-gap">
                            <Instructions
                                selectedOption={selectedOption}
                                setCustomeinst={setCustomeinst}
                                customeinst={customeinst}
                                selectedGeneric={selectedGeneric}
                                setInst={setInst}
                                prescriptionMedication={prescriptionMedication}
                            />
                        </Row>

                        <Row className="rows-gap">
                            <Text className="font-style">Indication</Text>
                        </Row>
                        <Row className="rows-gap" gutter={16}>
                            <Col md={12}>
                                <Row>
                                    <InputGroup inside >
                                        <Input
                                            disabled={preKey != null ? false: true}
                                            placeholder="Search ICD-10"
                                            value={searchKeywordicd}
                                            onChange={handleSearchIcd}
                                        />
                                        <InputGroup.Button>
                                            <SearchIcon />
                                        </InputGroup.Button>
                                    </InputGroup>
                                    {searchKeywordicd && (
                                        <Dropdown.Menu className="dropdown-menuresult">
                                            {modifiedData?.map(mod => (
                                                <Dropdown.Item
                                                    key={mod.key}
                                                    eventKey={mod.key}
                                                    onClick={() => {
                                                        setIndicationsIcd({
                                                            ...indicationsIcd,
                                                            indicationIcd: mod.key
                                                        })
                                                        setSearchKeywordicd("");
                                                    }}
                                                >
                                                    {mod.icdCode} {" - "} {mod.description}
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    )}
                                </Row>
                                <Row>
                                    <Input as="textarea"
                                        disabled={true}
                                        onChange={(e) => setindicationsDescription} value={indicationsDescription
                                            || prescriptionMedication.indicationIcd
                                        }
                                        rows={2} /></Row>
                            </Col>
                            <Col md={12}>
                                <Row>
                                    <InputGroup inside >
                                        <Input
                                            disabled={preKey != null ? false : true}
                                            placeholder="Search SNOMED-CT"
                                            value={""}

                                        />
                                        <InputGroup.Button>
                                            <SearchIcon />
                                        </InputGroup.Button>
                                    </InputGroup></Row>
                                <Row><Input as="textarea"
                                    disabled={true}

                                    rows={2} /></Row>
                            </Col>
                        </Row>
                        <Row className="rows-gap">
                            <Col md={24}>
                                <Form fluid  >
                                    <MyInput

                                        disabled={preKey != null ? false: true}
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Indication Use"
                                        selectData={indicationLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'indicationUseLkey'}
                                        record={prescriptionMedication}
                                        setRecord={setPrescriptionMedications}

                                    />
                                </Form>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={24}>
                                <Form fluid  >
                                    <MyInput
                                        width="100%"
                                        height={40}
                                        disabled={preKey != null ? false : true}
                                        fieldType="textarea"
                                        fieldName='indicationManually'
                                        record={prescriptionMedication}
                                        setRecord={setPrescriptionMedications}
                                    />
                                </Form>
                            </Col>
                        </Row>
                    </Col>
                    <Col xs={24} md={12}>
                        <Row className="rows-gap">
                            <Col md={8}>
                                <Form fluid>
                                    <MyInput

                                        disabled={preKey != null ?  editDuration  : true}
                                        width='100%'
                                        fieldType="number"
                                        fieldLabel="Duration"
                                        fieldName={'duration'}
                                        placholder={' '}
                                        record={prescriptionMedication}
                                        setRecord={setPrescriptionMedications}
                                    />

                                </Form>
                            </Col>
                            <Col md={8}>
                                <Form fluid>
                                    <MyInput

                                        disabled={preKey != null ?  editDuration  : true}
                                        width='100%'
                                        fieldType="select"
                                        fieldLabel="Duration type"
                                        selectData={DurationTypeLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'durationTypeLkey'}
                                        record={prescriptionMedication}
                                        setRecord={setPrescriptionMedications}
                                        searchable={false}

                                    />
                                </Form>

                            </Col>
                            <Col md={8}>
                                <Form fluid>
                                    <MyInput

                                        disabled={preKey != null ? false : true}
                                        width="100%"
                                        fieldLabel="Chronic Medication"
                                        fieldType="checkbox"
                                        fieldName="chronicMedication"
                                        record={prescriptionMedication}
                                        setRecord={setPrescriptionMedications}

                                    />
                                </Form>
                            </Col>
                        </Row>
                        <Row className="rows-gap">
                            <Col md={8}>
                                <Form fluid>
                                    <MyInput

                                        disabled={preKey != null ? false : true}
                                        width='100%'
                                        fieldType="number"
                                        fieldName={'maximumDose'}
                                        record={prescriptionMedication}
                                        setRecord={setPrescriptionMedications}
                                    />

                                </Form>
                            </Col>
                            <Col md={8}>
                                <Form fluid>
                                    <MyInput

                                        disabled={preKey != null ? false : true}
                                        width="100%"
                                        fieldType="date"
                                        fieldName={'validUtil'}
                                        record={prescriptionMedication}
                                        setRecord={setPrescriptionMedications}
                                    />
                                </Form>

                            </Col>
                            <Col md={8}>
                                <Form fluid>
                                    <MyInput

                                        disabled={preKey != null ? false : true}
                                        width="100%"
                                        fieldLabel="Brand substitute allowed"
                                        fieldType="checkbox"
                                        fieldName="genericSubstitute"
                                        record={prescriptionMedication}
                                        setRecord={setPrescriptionMedications}

                                    />
                                </Form>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={24}>
                                <MyLabel label="Parameters to monitor" />
                            </Col>

                        </Row>
                        <Row className="rows-gap">
                            <Col md={24}>
                            <MyTagInput tags={tags} setTags={setTags}/>
                            
                            </Col>
                        </Row>
                        <Row className="rows-gap">
                            <Col md={8}>
                                <Form fluid>
                                    <MyInput

                                        disabled={preKey != null ? false : true}
                                        fieldType='number'
                                        width="100%"
                                        fieldName={'numberOfRefills'}
                                        record={prescriptionMedication}
                                        setRecord={setPrescriptionMedications}
                                    />
                                </Form>
                            </Col>
                            <Col md={8}>
                                <Form fluid>
                                    <MyInput
                                        disabled={preKey != null ? false : true}
                                        fieldType='number'
                                        width="100%"
                                        fieldName={'refillIntervalValue'}
                                        record={prescriptionMedication}
                                        setRecord={setPrescriptionMedications}
                                    />
                                </Form>

                            </Col>
                            <Col md={8}>
                                <Form fluid>
                                    <MyInput
                                        disabled={preKey != null ? false : true}
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Refill Interval Unit"
                                        selectData={refillunitQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'refillIntervalUnitLkey'}
                                        record={prescriptionMedication}
                                        setRecord={setPrescriptionMedications}
                                        searchable={false}
                                    />
                                </Form>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={24}>
                                <Row>
                                    <Form fluid>

                                        <MyInput

                                            width="100%"
                                            disabled={preKey != null ? false : true}
                                            fieldType="select"
                                            fieldLabel="Administration Instructions"
                                            selectData={administrationInstructionsLovQueryResponse?.object ?? []}
                                            selectDataLabel="lovDisplayVale"
                                            selectDataValue="key"
                                            fieldName={'inst'}
                                            record={slectInst}
                                            setRecord={setSelectInt}
                                        /></Form>
                                </Row>
                                <Row>
                                    <Input as="textarea" onChange={(e) =>setInstruc(e.target.value)}
                                        value={instr}
                                        style={{ width: '100%' }}
                                        rows={3} />
                                </Row>
                            </Col>
                        </Row>
                        <Row className="rows-gap">
                            <Col md={24}>
                                <Form fluid>
                                    <MyInput
                                        disabled={preKey != null ? false : true}
                                        height={40}
                                        fieldType="textarea"
                                        width="100%"
                                        fieldName={'notes'}
                                        record={prescriptionMedication}
                                        setRecord={setPrescriptionMedications}

                                    />
                                </Form>
                            </Col>
                        </Row>
                    </Col>
                </Row>}
        />
        <Substitues open={openSubstitutesModel} setOpen={setOpenSubstitutesModel} selectedGeneric={selectedGeneric} />
    </>)
}
export default DetailsModal;