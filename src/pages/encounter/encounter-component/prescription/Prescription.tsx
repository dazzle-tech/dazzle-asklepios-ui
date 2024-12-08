import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import './styles.less';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import PageIcon from '@rsuite/icons/Page';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import {
    InputGroup,
    Form,
    Input,
    Panel,
    Text,
    Checkbox,
    Dropdown,
    Button,
    IconButton,
    Table,
    Modal,
    Stack,
    Divider,
    Radio,
    RadioGroup,
    TagInput,
    TagGroup,
    Tag
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { Toggle } from 'rsuite';
import { notify } from '@/utils/uiReducerActions';
import {
    useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import {
    useSavePrescriptionMutation,
    useGetPrescriptionsQuery,
    useSavePrescriptionMedicationMutation,
    useGetPrescriptionMedicationsQuery,
    useSaveCustomeInstructionsMutation,
    useGetCustomeInstructionsQuery
   
} from '@/services/encounterService';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CheckIcon from '@rsuite/icons/Check';
import PlusIcon from '@rsuite/icons/Plus';
import OthersIcon from '@rsuite/icons/Others';
import RemindOutlineIcon from '@rsuite/icons/RemindOutline';
import BlockIcon from '@rsuite/icons/Block';
import SearchIcon from '@rsuite/icons/Search';
import MyInput from '@/components/MyInput';
import { initialListRequest, ListRequest } from '@/types/types';
import { object } from 'prop-types';
import { ApCustomeInstructions, ApGenericMedication, ApPrescription, ApPrescriptionMedications } from '@/types/model-types';
import { newApCustomeInstructions, newApGenericMedication, newApPrescription, newApPrescriptionMedications } from '@/types/model-types-constructor';
import {
    useGetGenericMedicationQuery
} from '@/services/medicationsSetupService';
import {
    useGetPrescriptionInstructionQuery,

} from '@/services/medicationsSetupService';
import { mediaQuerySizeMap } from 'rsuite/esm/useMediaQuery/useMediaQuery';

const Prescription = () => {
    const patientSlice = useAppSelector(state => state.patient);
    const dispatch = useAppDispatch();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedOption, setSelectedOption] = useState(null);
    const [inst, setInst] = useState(null);
    const [tags, setTags] = React.useState([]);
    const [showCanceled, setShowCanceled] = useState(true);
    const [editing,setEditing]=useState(false);
    const [typing, setTyping] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: true
    });
    const [genericMedication, setGenericMedication] = useState<ApGenericMedication>({ ...newApGenericMedication });
    const [listGenericRequest, setListGenericRequest] = useState<ListRequest>({ ...initialListRequest });
    const { data: predefinedInstructionsListResponse } = useGetPrescriptionInstructionQuery({ ...initialListRequest });
    const [selectedGeneric, setSelectedGeneric] = useState(null);
    const [selectedPreDefine, setSelectedPreDefine] = useState(null);
    const [munial, setMunial] = useState(null);
    const [adminInstructions, setAdminInstructions] = useState();
    const [customeinst, setCustomeinst] = useState({
        dose: null,
        unit: null,
        frequency: null,
        roa:null
    });
    const { data: genericMedicationListResponse } = useGetGenericMedicationQuery(listGenericRequest);
    const [selectedRows, setSelectedRows] = useState([]);
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
    const { data: FrequencyLovQueryResponse } = useGetLovValuesByCodeQuery('MED_FREQUENCY');
    const { data: DurationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_DURATION');
    const { data: administrationInstructionsLovQueryResponse } = useGetLovValuesByCodeQuery('PRESC_INSTRUCTIONS');
    const { data: roaLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: instructionTypeQueryResponse } = useGetLovValuesByCodeQuery('PRESC_INSTR_TYPE');
    const [prescription, setPrescription] = useState<ApPrescription>({ ...newApPrescription });
    const { data: prescriptions, isLoading: isLoadingPrescriptions ,refetch:preRefetch} = useGetPrescriptionsQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patientSlice.patient.key,
            },
            {
                fieldName: "visit_key",
                operator: "match",
                value: patientSlice.encounter.key,
            },
        ],
    });
    const preKey = prescriptions?.object[0]?.key;
    console.log(preKey);
    const [prescriptionMedication, setPrescriptionMedications] = useState<ApPrescriptionMedications>(
        {
            ...newApPrescriptionMedications,
            prescriptionKey: preKey
        });
    const isSelected = rowData => {
        if (rowData && prescriptionMedication && rowData.key === prescriptionMedication.key) {
            return 'selected-row';
        } else return '';
    };
    const [customeInstruction, setCustomeInstruction] = useState<ApCustomeInstructions>({ ...newApCustomeInstructions });
    const [savePrescription, { isLoading: isSavingPrescription }] = useSavePrescriptionMutation();
    const [savePrescriptionMedication, { isLoading: isSavingPrescriptionMedication }] = useSavePrescriptionMedicationMutation();
    

    const [saveCustomeInstructions, { isLoading: isSavingCustomeInstructions }] = useSaveCustomeInstructionsMutation();



    const { data: prescriptionMedications, isLoading: isLoadingPrescriptionMedications, refetch: medicRefetch } = useGetPrescriptionMedicationsQuery({
        ...initialListRequest
        , filters: [
            {
                fieldName: "prescription_key",
                operator: "",
                value: preKey,
            },
            {
                fieldName: "status_lkey",
                operator: showCanceled?"notMatch":"match",
                value: "1804447528780744",
            }
        ],
    });
    const [selectedRowoMedicationKey,setSelectedRowoMedicationKey]=useState("");
    const { data: customeInstructions, isLoading: isLoadingCustomeInstructions,refetch:refetchCo } = useGetCustomeInstructionsQuery({ ...initialListRequest,
           
     });
    console.log(prescriptions?.object[0]?.statusLkey);
    useEffect(() => {
        console.log("searchKeyword changed:", searchKeyword);
        if (searchKeyword.trim() !== "") {
            setListGenericRequest({
                ...listGenericRequest,
                filters: [
                    {
                        fieldName: "generic_name",
                        operator: "containsIgnoreCase",
                        value: searchKeyword,
                    },
                ],
            });
        }
    }, [searchKeyword]);

    useEffect(() => {
        setPrescriptionMedications({ ...prescriptionMedication, instructionsTypeLkey: selectedOption })
        console.log(prescriptionMedication)
    }, [selectedOption])
    useEffect(() => {
        if (prescriptionMedication.administrationInstructions != null){
          
        console.log(prescriptionMedication.administrationInstructions)
            setAdminInstructions(prevadminInstructions =>
                prevadminInstructions ? `${prevadminInstructions}, ${administrationInstructionsLovQueryResponse?.object?.find(
                    item => item.key === prescriptionMedication.administrationInstructions
                )?.lovDisplayVale}` : 
                administrationInstructionsLovQueryResponse?.object?.find(
                    item => item.key === prescriptionMedication.administrationInstructions
                )?.lovDisplayVale
            );}

        setPrescriptionMedications({ ...prescriptionMedication, administrationInstructions: null })
    }, [prescriptionMedication.administrationInstructions])
    const handleSearch = value => {
        setSearchKeyword(value);
        console.log('serch' + searchKeyword);

    };
    useEffect(() => {

    }, [selectedPreDefine, munial])
     useEffect(()=>{

     },[customeinst])
     useEffect(()=>{
      console.log(selectedRowoMedicationKey)
      refetchCo();
      console.log(customeInstructions?.object)
      setCustomeinst({...customeinst,
                                unit:customeInstructions?.object?.find(item => item.prescriptionMedicationsKey ===selectedRowoMedicationKey)?.unitLkey,
                                frequency:customeInstructions?.object?.find(item => item.prescriptionMedicationsKey ===selectedRowoMedicationKey)?.frequencyLkey,
                               dose:customeInstructions?.object?.find(item => item.prescriptionMedicationsKey ===selectedRowoMedicationKey)?.dose,
                               })
     },[selectedRowoMedicationKey])
     console.log(prescriptions?.object[0]?.statusLkey)
    const handleFilterChange = (fieldName, value) => {
        if (value) {
            setListRequest(
                addFilterToListRequest(
                    fromCamelCaseToDBName(fieldName),
                    'containsIgnoreCase',
                    value,
                    listRequest
                )
            );
        } else {
            setListRequest({ ...listRequest, filters: [] });
        }
    };
    const handleCheckboxChange = (key) => {
        setSelectedRows((prev) => {
            if (prev.includes(key)) {
                return prev.filter(item => item !== key);
            } else {
                return [...prev, key];
            }
        });
    };
    const removeTag = tag => {
        const nextTags = tags.filter(item => item !== tag);
        setTags(nextTags);
    };
    const joinValuesFromArray = (values) => {
        return values.filter(Boolean).join(', ');
    };
    const handleCancle = async () => {
        console.log(selectedRows);

        try {
            await Promise.all(
                selectedRows.map(item => savePrescriptionMedication({ ...item, isValid: false, statusLkey: "1804447528780744", deletedAt: Date.now() }).unwrap())
            );

            dispatch(notify('All medication deleted successfully'));
            medicRefetch().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });
medicRefetch().then(() => {
    console.log("Refetch complete");
}).catch((error) => {
    console.error("Refetch failed:", error);
});
            

            setSelectedRows([]);

        } catch (error) {

            dispatch(notify('One or more deleted failed'));

        }
    };
    const handleSubmitPres =async () => {
        try {
           await savePrescription({
                ...prescriptions?.object[0],

                statusLkey: "1804482322306061"
            }).unwrap();
            dispatch(notify('submetid  Successfully'));
            preRefetch().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });
            medicRefetch().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });
            
        }
        catch (error) {
            console.error("Error saving prescription or medications:", error);
        }

        prescriptionMedications?.object?.map((item) => {
            savePrescriptionMedication({ ...item, statusLkey: "1804482322306061" })
        })
        medicRefetch().then(() => {
            console.log("Refetch complete");
        }).catch((error) => {
            console.error("Refetch failed:", error);
        });
        


    }
    useEffect(() => {
        if(inst!=null){
        console.log("useeffect   " + inst);
        const tagcompine = joinValuesFromArray(tags);
        try {
             savePrescriptionMedication({
                ...prescriptionMedication,
                patientKey: patientSlice.patient.key,
                visitKey: patientSlice.encounter.key,
                prescriptionKey: preKey,
                genericMedicationsKey: selectedGeneric.key,
                parametersToMonitor: tagcompine,
                statusLkey: "1804427038369874",
                instructions: inst,
                dose: selectedOption === "3010606785535008" ? customeinst.dose : null,
                frequencyLkey: selectedOption === "3010606785535008" ? customeinst.frequency : null,
                unitLkey: selectedOption === "3010606785535008" ? customeinst.unit : null,
                roaLkey:selectedOption === "3010606785535008" ? selectedGeneric.roaLvalue?.lovDisplayVale: null,
                administrationInstructions: adminInstructions
            }).unwrap();
            dispatch(notify('saved  Successfully'));
            handleCleare()
            medicRefetch().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });
            ;
        } catch (error) {

            console.log("iam in catch")
            dispatch(notify('saved  fill'));
        }}
    }, [inst])

    const handleSaveMedication = () => {

       
        if (selectedOption === '3010591042600262') {

            setInst(selectedPreDefine.key);
            console.log(selectedPreDefine.key)
            console.log("case1" + inst)

        }
        else if (selectedOption === '3010573499898196') {
            
            setInst(munial);
            console.log("case2  " + inst)
            
        }
        else {
            setInst("")
            console.log("case3" + inst)
        }

         
       
     

    }
    const handleCleare = () => {
        setPrescriptionMedications({
            ...newApPrescriptionMedications,
            durationTypeLkey: null,
            administrationInstructions: null,
            instructionsTypeLkey: null,
            genericSubstitute: false,
            chronicMedication: false
        })
        setAdminInstructions(null)
        setSelectedGeneric(null);
        setAdminInstructions(null);
        setCustomeinst({dose:null,frequency:null,unit:null,roa:null})

    }
    const addTag = () => {
        const nextTags = inputValue ? [...tags, inputValue] : tags;
        setTags(nextTags);
        setTyping(false);
        setInputValue('');
    }; 

    const handleButtonClick = () => {
        setTyping(true);
    };
    const handleItemClick = (Generic) => {
        setSelectedGeneric(Generic);
        setSearchKeyword("")
        console.log(Generic.genericName)

        // try {
        //     savePatientOrder({
        //         ...localOrder,
        //         patientKey: patientSlice.patient.key,
        //         visitKey: patientSlice.encounter.key,
        //         testKey: selectedTest.key,
        //         statusLkey: "91063195286200"
        //     }).unwrap();
        //     dispatch(notify('saved  Successfully'));
        //     orderRefetch();
        // }
        // catch (error) {

        //     console.error("Encounter save failed:", error);
        //     dispatch(notify('saved  fill'));
        // }
    };
    function handleRowData(rowData) {
        if (rowData.instructionsTypeLkey === "3010591042600262") {
            const generic = predefinedInstructionsListResponse?.object?.find(item => item.key === rowData.instructions);
            console.log(generic);
            if (generic) {
                return [
                    generic.genericName,
                    generic.dosageFormLvalue?.lovDisplayVale,
                    generic.manufacturerLvalue?.lovDisplayVale,
                    generic.roaLvalue?.lovDisplayVale
                ]
                    .filter(Boolean)
                    .join(", ");
            }
        } else if (rowData.instructionsTypeLkey === "3010573499898196") {
            return rowData.instructions;
        } else if (rowData.instructionsTypeLkey === "3010606785535008") {
            return "Custom Instructions";
        }

        return "";
    }


    const renderInput = () => {
        if (typing) {
            return (
                <Input
                    className="tag-input"
                    size="xs"
                    style={{ width: 70 }}
                    value={inputValue}
                    onChange={setInputValue}
                    onBlur={addTag}
                    onPressEnter={addTag}
                />
            );
        }

        return (
            <IconButton
                className="tag-add-btn"
                onClick={handleButtonClick}
                icon={<PlusIcon />}
                appearance="ghost"
                size="xs"
            />
        );
    };
    return (<>
        <h5 style={{ marginTop: "10px" }}>Create Prescription</h5>
        <div className='top-container-p'>
            <div className='form-search-container-p '>
                <Form>
                    <Text>Medication Name</Text>
                    <InputGroup inside className='input-search-p'>
                        <Input
                            placeholder={'Search'}
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
                                    <span style={{ marginRight: "15px" }}>
                                        {[Generic.genericName,
                                        Generic.dosageFormLvalue?.lovDisplayVale,
                                        Generic.manufacturerLvalue?.lovDisplayVale,
                                        Generic.roaLvalue?.lovDisplayVale]
                                            .filter(Boolean)
                                            .join(', ')}
                                    </span>

                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    )}



                </Form>
            </div>
            {selectedGeneric && <span style={{ marginTop: "25px", fontWeight: "bold" }}>
                {[selectedGeneric.genericName,
                selectedGeneric.dosageFormLvalue?.lovDisplayVale,
                selectedGeneric.manufacturerLvalue?.lovDisplayVale,
                selectedGeneric.roaLvalue?.lovDisplayVale]
                    .filter(Boolean)
                    .join(', ')}
            </span>}
            <div className="buttons-sect-p">

                <IconButton
                    color="violet"
                    appearance="primary"
                    onClick={handleSubmitPres}
                    disabled={prescriptions?.object[0]?.statusLkey == '1804482322306061' ? true : false}
                    
                    icon={<CheckIcon />}
                >
                    <Translate>Submit Prescription</Translate>
                </IconButton>
                <IconButton
                    color="cyan"
                    appearance="primary"

                    icon={<PageIcon />}
                >
                    <Translate> Print Prescription</Translate>
                </IconButton>



            </div>
        </div>
        <div className='instructions-container-p '>
            <div className='instructions-container-p ' style={{ minWidth: "800px", border: " 1px solid #b6b7b8" }}>
                <div>
                    <RadioGroup
                        name="radio-group"
                        disabled={editing}
                        onChange={(value) => setSelectedOption(String(value))}
                    >
                        {instructionTypeQueryResponse?.object?.map((instruction, index) => (
                            <Radio key={index} value={instruction.key}>
                                {instruction.lovDisplayVale}
                            </Radio>
                        ))}
                    </RadioGroup>
                </div>
                <div style={{ marginLeft: "10px" }}>
                    {selectedOption === "3010606785535008" &&
                        <div className='form-search-container-p ' style={{ width: "600px" }}>
                            <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                                <MyInput
                                    column
                                    disabled={false}
                                    width={150}
                                    fieldType='number'
                                    fieldName={'dose'}
                                    record={customeinst}
                                    setRecord={setCustomeinst}
                                />

                                <MyInput
                                    column

                                    width={150}
                                    fieldType="select"
                                    fieldLabel="Unit"
                                    selectData={unitLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'unit'}
                                    record={customeinst}
                                    setRecord={setCustomeinst}
                                />
                                <MyInput
                                    column
                                    width={150}
                                    fieldType="select"
                                    fieldLabel="Frequency"
                                    selectData={FrequencyLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'frequency'}
                                    record={customeinst}
                                    setRecord={setCustomeinst}
                                />
                            </Form>

                        </div>
                    }
                    {selectedOption === "3010591042600262" &&
                        <Form layout="inline" fluid>

                            <Dropdown style={{ width: "200px" }} title={!selectedPreDefine ? "Pre-defined Instructions" : [
                                selectedPreDefine.dose,

                                selectedPreDefine.unitLvalue?.lovDisplayVale,
                                selectedPreDefine.routLvalue?.lovDisplayVale,
                                selectedPreDefine.frequencyLvalue?.lovDisplayVale
                            ]
                                .filter(Boolean)
                                .join(', ')}>
                                {predefinedInstructionsListResponse && predefinedInstructionsListResponse?.object?.map((item, index) => (
                                    <Dropdown.Item key={index}
                                        onClick={() => setSelectedPreDefine(item)}>
                                        {[item.dose,

                                        item.unitLvalue?.lovDisplayVale,
                                        item.routLvalue?.lovDisplayVale,
                                        item.frequencyLvalue?.lovDisplayVale
                                        ]
                                            .filter(Boolean)
                                            .join(', ')}</Dropdown.Item>
                                ))}
                            </Dropdown>
                        </Form>
                    }
                    {selectedOption === "3010573499898196" &&
                        <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                            <textarea
                                rows={4}
                                style={{ width: '350px' }}
                                disabled={false}
                                value={munial}
                                onChange={(e) => setMunial(e.target.value)}

                            />


                        </Form>
                    }
                </div>
            </div>
            <div className='form-search-container-p ' style={{ padding: "5px", minWidth: "550px" }}>


                <Table
                    bordered
                    onRowClick={rowData => {

                    }}


                >

                    <Table.Column flexGrow={2}>
                        <Table.HeaderCell style={{ fontSize: '14px' }} >Active Ingredient</Table.HeaderCell>
                        <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                    </Table.Column>
                    <Table.Column flexGrow={2}>
                        <Table.HeaderCell style={{ fontSize: '14px' }}>Strength</Table.HeaderCell>
                        <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                    </Table.Column>
                    <Table.Column flexGrow={1}>
                        <Table.HeaderCell style={{ fontSize: '14px' }} >Details</Table.HeaderCell>
                        <Table.Cell><IconButton
                            // onClick={OpenDetailsModel} 
                            icon={<OthersIcon />} /></Table.Cell>
                    </Table.Column>

                </Table>

            </div>
        </div>
        <div className='top-container-p'>

            <div>
                <Form style={{ zoom: 0.85 }} layout="inline" fluid>


                    <MyInput
                        column
                        disabled={editing}
                        width={150}
                        fieldType="number"
                        fieldLabel="Duration"
                        fieldName={'duration'}
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                    />
                    <MyInput
                        column
                        disabled={editing}
                        width={150}
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
                <br />
                <Form style={{ zoom: 0.85 }} layout="inline" fluid>


                    <MyInput
                        column
                        disabled={editing}
                        fieldType='number'
                        width={150}
                        fieldName={'numberOfRefills'}
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                    />

                    <MyInput
                        column
                        disabled={editing}
                        fieldLabel="Min. Refill Interval"
                        width={150}
                        fieldName={'refillInterval'}
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                    />
                </Form>
            </div>
            <div>
                <Form style={{ zoom: 0.85 }} fluid>

                    <MyInput

                        width={250} 
                        disabled={editing}
                        fieldType="select"
                        fieldLabel="Administration Instructions"
                        selectData={administrationInstructionsLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'administrationInstructions'}
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                    />

                    <Input as="textarea" onChange={(e) => setAdminInstructions(e)} value={adminInstructions} style={{ width: 250 }} rows={3} />
                </Form>
            </div>
            <div style={{ marginLeft: "10px" }}>
                <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                    <MyInput
                        column
                        disabled={editing}
                        width={150}
                        fieldType="date"
                        fieldName={'validUtil'}
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                    />
                    <MyInput
                        column
                        disabled={editing}
                        width={150}
                        fieldType="number"
                        fieldName={'maximumDose'}
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                    />

                </Form><br />
                <Text style={{ marginBottom: "10px" }}>Parameters to monitor</Text>
                <TagGroup   className='taggroup-style'>
                    {tags.map((item, index) => (
                        <Tag key={index} closable onClose={() => removeTag(item)}>
                            {item}
                        </Tag>
                    ))}
                    {renderInput()}
                </TagGroup>
            </div>
            <div>
                <div style={{ display: "flex" }}>
                    <div className='toggle-style'>

                        <Form>
                            <MyInput
                                width={165}
                                disabled={editing}
                                column
                                fieldLabel="Chronic Medication"
                                fieldType="checkbox"
                                fieldName="chronicMedication"
                                record={prescriptionMedication}
                                setRecord={setPrescriptionMedications}
                            //   disabled={!editing}
                            /></Form></div>
                    <div className='toggle-style' style={{ marginLeft: "5px" }}>
                        <Form>
                            <MyInput
                                width={165}
                                disabled={editing}
                                column
                                fieldLabel="Generic substitute allowed"
                                fieldType="checkbox"
                                fieldName="genericSubstitute"
                                record={prescriptionMedication}
                                setRecord={setPrescriptionMedications}
                            //   disabled={!editing}
                            /></Form>
                    </div></div>
                <br />
                <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                    <MyInput
                        column
                        disabled={editing}
                        rows={5}
                        fieldType="textarea"
                        width={250}
                        fieldName={'notes'}
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}

                    />
                </Form>

            </div>
        </div>

        <div className='mid-container-p '>
            <div >
                <IconButton
                    color="cyan"
                    appearance="primary"
                    onClick={handleSaveMedication}
                    icon={<PlusIcon />}
                    disabled={prescriptions?.object[0]?.statusLkey == '1804482322306061' ? true : false}
                >
                    <Translate>Add</Translate>
                </IconButton>
                <IconButton
                    color="cyan"
                    appearance="primary"
                    style={{ marginLeft: "5px" }}
                    icon={<BlockIcon />}
                    onClick={handleCancle}
                    disabled={selectedRows.length === 0}
                >
                    <Translate> Cancle</Translate>
                </IconButton>
                <Button
                    color="cyan"
                    appearance="primary"
                    style={{ marginLeft: "5px" }}
                    onClick={handleCleare}

                >

                    <FontAwesomeIcon icon={faBroom} style={{ marginRight: '5px' }} />
                    <span>Clear</span>
                </Button>

                <Checkbox
                            checked={!showCanceled}
                            onChange={() => {
                                
                                
                                setShowCanceled(!showCanceled);
                            }}
                        >
                            Show canceled test
                        </Checkbox>
            </div>

            <div>
                <Table
                    height={400}
                    sortColumn={listRequest.sortBy}
                    sortType={listRequest.sortType}
                    onSortColumn={(sortBy, sortType) => {
                        if (sortBy)
                            setListRequest({
                                ...listRequest,
                                sortBy,
                                sortType
                            });
                    }}
                    headerHeight={80}
                    rowHeight={60}
                    bordered
                    cellBordered

                    data={prescriptionMedications?.object ?? []}
                    onRowClick={rowData => {
                        setPrescriptionMedications(rowData);
                        setSelectedGeneric(genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey))
                        setTags(rowData.parametersToMonitor.split(",").map(word => word.trim()))
                        if (rowData.instructionsTypeLkey == "3010591042600262") {
                            setSelectedPreDefine(predefinedInstructionsListResponse?.object?.find(item => item.key === rowData.instructions))
                            setSelectedOption("3010591042600262")
                        }
                        else if (rowData.instructionsTypeLkey == "3010573499898196") {
                            setMunial(rowData.instructions)
                            setSelectedOption("3010573499898196")
                        }
                        else if (rowData.instructionsTypeLkey == "3010606785535008") {
                            console.log("Iam in custom prsecription")
                            setSelectedOption("3010606785535008")
                            setSelectedRowoMedicationKey(rowData.key);
                            
                               console.log(selectedRowoMedicationKey)
                            console.log(customeinst);
                            console.log(customeInstructions?.object)
                        }
                        setEditing(rowData.statusLkey=="1804427038369874"?false:true)
                    }}
                    rowClassName={isSelected}
                >
                    <Column flexGrow={1}>
                        <HeaderCell align="center">

                            <Translate>#</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => (
                                <Checkbox
                                    key={rowData.id}
                                    checked={selectedRows.includes(rowData)}
                                    onChange={() => handleCheckboxChange(rowData)}
                                 disabled={rowData.statusLvalue?.lovDisplayVale !== 'New'}
                                />
                            )}
                        </Cell>


                    </Column>
                    <Column flexGrow={2}>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('genericMedicationsKey', e)} />
                            <Translate>Medication Name</Translate>
                        </HeaderCell>

                        <Cell dataKey="genericMedicationsKey" >
                            {rowData =>
                                genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey).genericName
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={4}>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('instructions', e)} />
                            <Translate>Instructions</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => {
                                if (rowData.instructionsTypeLkey === "3010591042600262") {
                                    const generic = predefinedInstructionsListResponse?.object?.find(
                                        item => item.key === rowData.instructions
                                    );
                                    
                                    if (generic) {
                                        console.log("Found generic:", generic);
                                    } else {
                                        console.warn("No matching generic found for key:", rowData.instructions);
                                    }
                                    return   [
                                        generic?.dose, 
                                        generic.unitLvalue?.lovDisplayVale,
                                        generic.routLvalue?.lovDisplayVale,
                                        generic.frequencyLvalue?.lovDisplayVale
                                    ]
                                        .filter(Boolean)
                                        .join(', ');
                                }
                                if(rowData.instructionsTypeLkey === "3010573499898196"){
                                    return  rowData.instructions

                                 }
                                 if(rowData.instructionsTypeLkey === "3010606785535008"){
                                    return customeInstructions?.object?.find(item => item.prescriptionMedicationsKey ===rowData.key)?.dose+
                                    ","+customeInstructions?.object?.find(item => item.prescriptionMedicationsKey ===rowData.key)?.unitLvalue.lovDisplayVale +","+
                                    customeInstructions?.object?.find(item => item.prescriptionMedicationsKey ===rowData.key)?.frequencyLvalue.lovDisplayVale
                                   
                                   
                                 }

                                return "no";
                            }}




                        </Cell>
                    </Column>
                    <Column flexGrow={2}>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('validUtil', e)} />
                            <Translate>Valid until</Translate>
                        </HeaderCell>
                        <Cell dataKey="validUtil" />
                    </Column>

                    <Column flexGrow={2}>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('ststusLvalue', e)} />
                            <Translate>Status</Translate>
                        </HeaderCell>
                        <Cell >{rowData => rowData.statusLvalue?.lovDisplayVale || ''}
                        </Cell>
                    </Column>


                    <Column flexGrow={2}>
                        <HeaderCell align="center">

                            <Translate>Is Chronic</Translate>
                        </HeaderCell>
                        <Cell  >
                            {rowData => rowData.chronicMedication ? "Yes" : "NO"}


                        </Cell>
                    </Column>
                </Table>

            </div>
        </div>
    </>);
};
export default Prescription;