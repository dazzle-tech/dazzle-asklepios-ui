import React, { useEffect, useState, useRef } from "react";
import { notify } from '@/utils/uiReducerActions';
import { Form, Modal, Row, Col, Button, DatePicker, Table, Divider, Pagination, Panel, Text, Stack, InputGroup, Input, Dropdown, TagGroup, Tag } from "rsuite";
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
import { faCircleInfo, faLeftRight, faRightLeft } from "@fortawesome/free-solid-svg-icons";
import Translate from "@/components/Translate";
import MyInput from "@/components/MyInput";
import PlusIcon from '@rsuite/icons/Plus';
import { newApDrugOrderMedications, newApPrescriptionMedications } from "@/types/model-types-constructor";
import { useSaveDrugOrderMedicationMutation, useSavePrescriptionMedicationMutation } from "@/services/encounterService";
import MyLabel from "@/components/MyLabel";

const DetailsModal = ({ open, setOpen, prescriptionMedication, setPrescriptionMedications, preKey, editing, patient, encounter, medicRefetch }) => {
    const dispatch = useAppDispatch();
    const [selectedGeneric, setSelectedGeneric] = useState(null);
    const [tags, setTags] = React.useState([]);
    const { data: predefinedInstructionsListResponse } = useGetPrescriptionInstructionQuery({ ...initialListRequest });
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedPreDefine, setSelectedPreDefine] = useState(null);
    const [munial, setMunial] = useState(null);
    const [adminInstructions, setAdminInstructions] = useState("");
    const [customeinst, setCustomeinst] = useState({
        dose: null,
        unit: null,
        frequency: null,
        roa: null
    });
    const [indicationsIcd, setIndicationsIcd] = useState({ indicationIcd: null });
    const [filteredList, setFilteredList] = useState([]);
    const [searchKeywordicd, setSearchKeywordicd] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    const [inst, setInst] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [indicationsDescription, setindicationsDescription] = useState<string>('');
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
    const { data: FrequencyLovQueryResponse } = useGetLovValuesByCodeQuery('MED_FREQUENCY');
    const { data: DurationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_DURATION');
    const { data: administrationInstructionsLovQueryResponse } = useGetLovValuesByCodeQuery('PRESC_INSTRUCTIONS');
    const { data: roaLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: instructionTypeQueryResponse } = useGetLovValuesByCodeQuery('PRESC_INSTR_TYPE');
    const { data: refillunitQueryResponse } = useGetLovValuesByCodeQuery('REFILL_INTERVAL');
    const { data: indicationLovQueryResponse } = useGetLovValuesByCodeQuery('MED_INDICATION_USE');
    const { data: medRoutLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const [openSubstitutesModel, setOpenSubstitutesModel] = useState(false);
    const { data: genericMedicationListResponse } = useGetGenericMedicationWithActiveIngredientQuery(searchKeyword);
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
    const [savePrescriptionMedication, { isLoading: isSavingPrescriptionMedication }] = useSavePrescriptionMedicationMutation();
    //  useEffect(() => {
    //        if (searchKeyword.trim() !== "") {
    //            setListGenericRequest({
    //                ...listGenericRequest,
    //                filters: [
    //                    {
    //                        fieldName: "generic_name",
    //                        operator: "containsIgnoreCase",
    //                        value: searchKeyword,
    //                    },
    //                    {
    //                        fieldName: 'deleted_at',
    //                        operator: 'isNull',
    //                        value: undefined
    //                    }
    //                ],
    //            });
    //        }
    //    }, [searchKeyword]);
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
        const saveData = async () => {
            if (inst != null) {


                if (preKey === null) {
                    dispatch(notify('Prescription not linked. Try again'));
                    return;
                }

                const tagcompine = joinValuesFromArray(tags);

                try {
                    await savePrescriptionMedication({
                        ...prescriptionMedication,
                        patientKey: patient.key,
                        visitKey: encounter.key,
                        prescriptionKey: preKey,
                        genericMedicationsKey: selectedGeneric.key,
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

                    dispatch(notify('Saved successfully'));

                    // Perform refetches
                    await Promise.all([
                        medicRefetch().then(() => ""),
                        // refetchCo().then(() => "")
                    ]);

                    handleCleare();
                } catch (error) {
                    console.error("Save failed:", error);
                    dispatch(notify('Save failed'));
                }
            }
        };

        saveData();
    }, [inst]);
    const joinValuesFromArray = (values) => {
        return values.filter(Boolean).join(', ');
    };
    const handleSaveMedication = () => {

        if (selectedOption === '3010591042600262') {
            setInst(selectedPreDefine.key);
        }
        else if (selectedOption === '3010573499898196') {
            setInst(munial);
        }
        else {
            setInst("");
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
            setAdminInstructions("");
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
        setFilteredList(newList);
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
            actionButtonFunction={savePrescriptionMedication}
            actionButtonLabel="Save"
            leftTitle={selectedGeneric ? selectedGeneric.genericName : "Select Generic"}
            rightTitle="Medication Order Details"
            leftContent={<>s</>}
            rightContent={
                <Row>
                    <Col xs={24} md={12}>
                        <Row>
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
                    </Col>
                    <Col xs={24} md={12}></Col>
                </Row>}
        />
    </>)
}
export default DetailsModal;