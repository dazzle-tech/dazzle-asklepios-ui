import React, { useEffect, useState, useRef } from "react";
import { notify } from '@/utils/uiReducerActions';
import { Form, Modal, Row, Col, Button, DatePicker, Table, Divider, Pagination, Panel, Text, Stack, InputGroup, Input, Dropdown, TagGroup, Tag, RadioGroup, Radio } from "rsuite";
import './styles.less';
import SearchIcon from '@rsuite/icons/Search';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useGetDepartmentsQuery, useGetIcdListQuery, useGetLovValuesByCodeQuery } from "@/services/setupService";
import AdvancedModal from "@/components/AdvancedModal";
import { useAppDispatch } from '@/hooks';
import ActiveIngrediantList from './ActiveIngredient'
import { useGetActiveIngredientQuery, useGetGenericMedicationActiveIngredientQuery, useGetGenericMedicationWithActiveIngredientQuery, useGetPrescriptionInstructionQuery } from "@/services/medicationsSetupService";
import { initialListRequest, ListRequest } from "@/types/types";

import MyButton from "@/components/MyButton/MyButton";
import { faCircleInfo, faCirclePlus, faCircleXmark, faLeftRight, faRightLeft } from "@fortawesome/free-solid-svg-icons";
import Translate from "@/components/Translate";
import MyInput from "@/components/MyInput";
import PlusIcon from '@rsuite/icons/Plus';
import { newApDrugOrderMedications, newApPrescriptionMedications } from "@/types/model-types-constructor";
import { useGetCustomeInstructionsQuery, useSaveDrugOrderMedicationMutation, useSavePrescriptionMedicationMutation } from "@/services/encounterService";
import MyLabel from "@/components/MyLabel";
import Substitues from "./Substitued";
import Instructions from "./Instructions";

const DetailsModal = ({ open, setOpen, prescriptionMedication, setPrescriptionMedications, preKey, editing, patient, encounter, medicRefetch }) => {
    const dispatch = useAppDispatch();
    const [selectedGeneric, setSelectedGeneric] = useState(null);
    const [tags, setTags] = React.useState([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [adminInstructions, setAdminInstructions] = useState("");
    const [customeinst, setCustomeinst] = useState({
        dose: null,
        unit: null,
        frequency: null,
        roa: null
    });
    const [indicationsIcd, setIndicationsIcd] = useState({ indicationIcd: null });
    const [searchKeywordicd, setSearchKeywordicd] = useState('');
    const [inst, setInst] = useState(null);
    const [typing, setTyping] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');
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
    const [editDuration, setEditDuration] = useState(false);
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
        if(prescriptionMedication.key!=null)
            
        {
            setSelectedGeneric(genericMedicationListResponse?.object?.find(item => item.key ===prescriptionMedication.genericMedicationsKey))
            setSelectedOption(prescriptionMedication.instructionsTypeLkey);
            setAdminInstructions(prescriptionMedication.administrationInstructions);
            setTags(prescriptionMedication.parametersToMonitor.split(","))
            if(prescriptionMedication.instructionsTypeLkey==="3010606785535008"){
                console.log(prescriptionMedication.key);
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
    useEffect(() => {
        if (prescriptionMedication.administrationInstructions != null) {
            setAdminInstructions(prevadminInstructions =>
                prevadminInstructions ? `${prevadminInstructions}, ${administrationInstructionsLovQueryResponse?.object?.find(
                    item => item.key === prescriptionMedication.administrationInstructions
                )?.lovDisplayVale}` :
                    administrationInstructionsLovQueryResponse?.object?.find(
                        item => item.key === prescriptionMedication.administrationInstructions
                    )?.lovDisplayVale
            );
        }

        setPrescriptionMedications({ ...prescriptionMedication, administrationInstructions: null })
    }, [prescriptionMedication.administrationInstructions])
    useEffect(() => {

        setEditDuration(prescriptionMedication.chronicMedication);
        setPrescriptionMedications({ ...prescriptionMedication, duration: null, durationTypeLkey: null })
    }, [prescriptionMedication.chronicMedication])
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
        if(open==false){
            handleCleare()
        }
    },[open])
    const joinValuesFromArray = (values) => {
        return values.filter(Boolean).join(', ');
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
                        dose: selectedOption === "3010606785535008" ? customeinst.dose : null,
                        frequencyLkey: selectedOption === "3010606785535008" ? customeinst.frequency : null,
                        unitLkey: selectedOption === "3010606785535008" ? customeinst.unit : null,
                        roaLkey: selectedOption === "3010606785535008" ? customeinst.roa : null,
                        administrationInstructions: adminInstructions,
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
        setAdminInstructions(null);
        setSelectedGeneric(null);
        setindicationsDescription(null);

        setCustomeinst({ dose: null, frequency: null, unit: null, roa: null })
        setTags([])
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
    const addTag = () => {
        const nextTags = inputValue ? [...tags, inputValue] : tags;
        setTags(nextTags);
        setTyping(false);
        setInputValue('');
    };

    const handleButtonClick = () => {
        setTyping(true);
    };
    const removeTag = tag => {
        const nextTags = tags.filter(item => item !== tag);
        setTags(nextTags);
    };

    const renderInput = () => {
        if (typing) {
            return (
                <Input
                    className="tag-input"
                    size="xs"
                    style={{ width: '86px', height: '24px' }}
                    value={inputValue}
                    onChange={setInputValue}
                    onBlur={addTag}
                    onPressEnter={addTag}

                />
            );
        }

        return (

            <FontAwesomeIcon icon={faCirclePlus} onClick={handleButtonClick} style={{ marginRight: '5px' }} />
        );
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
                <Row gutter={15}>
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
                                disabled={preKey != null ? editing : true}
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
                                            disabled={preKey != null ? editing : true}
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
                                            disabled={preKey != null ? editing : true}
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

                                        disabled={preKey != null ? editing : true}
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
                                        disabled={preKey != null ? editing : true}
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

                                        disabled={preKey != null ? (!editing ? editDuration : editing) : true}
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

                                        disabled={preKey != null ? (!editing ? editDuration : editing) : true}
                                        width='100%'
                                        fieldType="select"
                                        fieldLabel="Duration type"
                                        selectData={DurationTypeLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'durationTypeLkey'}
                                        record={prescriptionMedication}
                                        setRecord={setPrescriptionMedications}

                                    />
                                </Form>

                            </Col>
                            <Col md={8}>
                                <Form fluid>
                                    <MyInput

                                        disabled={preKey != null ? editing : true}
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

                                        disabled={preKey != null ? editing : true}
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

                                        disabled={preKey != null ? editing : true}
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

                                        disabled={preKey != null ? editing : true}
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
                                <TagGroup className='taggroup-style'>
                                    {tags.map((item, index) => (
                                        <Tag key={index} closable onClose={() => removeTag(item)}>
                                            {item}
                                        </Tag>
                                    ))}
                                    {renderInput()}
                                </TagGroup>
                            </Col>
                        </Row>
                        <Row className="rows-gap">
                            <Col md={8}>
                                <Form fluid>
                                    <MyInput

                                        disabled={preKey != null ? editing : true}
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
                                        disabled={preKey != null ? editing : true}
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
                                        disabled={preKey != null ? editing : true}
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Refill Interval Unit"
                                        selectData={refillunitQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'refillIntervalUnitLkey'}
                                        record={prescriptionMedication}
                                        setRecord={setPrescriptionMedications}
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
                                            disabled={preKey != null ? editing : true}
                                            fieldType="select"
                                            fieldLabel="Administration Instructions"
                                            selectData={administrationInstructionsLovQueryResponse?.object ?? []}
                                            selectDataLabel="lovDisplayVale"
                                            selectDataValue="key"
                                            fieldName={'administrationInstructions'}
                                            record={prescriptionMedication}
                                            setRecord={setPrescriptionMedications}
                                        /></Form>
                                </Row>
                                <Row>
                                    <Input as="textarea" onChange={(e) => setAdminInstructions(e)}
                                        value={adminInstructions}
                                        style={{ width: '100%' }}
                                        rows={3} />
                                </Row>
                            </Col>
                        </Row>
                        <Row className="rows-gap">
                            <Col md={24}>
                                <Form fluid>
                                    <MyInput
                                        disabled={preKey != null ? editing : true}
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