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
import { useGetActiveIngredientQuery, useGetGenericMedicationActiveIngredientQuery, useGetGenericMedicationWithActiveIngredientQuery } from "@/services/medicationsSetupService";
import { initialListRequest, ListRequest } from "@/types/types";
import Substitues from "./Substitutes";
import MyButton from "@/components/MyButton/MyButton";
import { faCircleInfo, faLeftRight, faRightLeft } from "@fortawesome/free-solid-svg-icons";
import Translate from "@/components/Translate";
import MyInput from "@/components/MyInput";
import PlusIcon from '@rsuite/icons/Plus';
import { newApDrugOrderMedications } from "@/types/model-types-constructor";
import { useSaveDrugOrderMedicationMutation } from "@/services/encounterService";
import MyLabel from "@/components/MyLabel";
const DetailsModal = ({ open, setOpen, orderMedication, setOrderMedication, drugKey, editing, patient, encounter, medicRefetch }) => {
    const dispatch = useAppDispatch();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchKeywordicd, setSearchKeywordicd] = useState('');

    const [typing, setTyping] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');
    const [tags, setTags] = React.useState([]);
    const [indicationsIcd, setIndicationsIcd] = useState({ indicationIcd: null });
    const [openSubstitutesModel, setOpenSubstitutesModel] = useState(false);
    const [selectedGeneric, setSelectedGeneric] = useState(null);
    const [selectedFirstDate, setSelectedFirstDate] = useState(null);
    const [filteredList, setFilteredList] = useState([]);
    const [adminInstructions, setAdminInstructions] = useState("");
    const [editDuration, setEditDuration] = useState(false);
    const [indicationsDescription, setindicationsDescription] = useState<string>('');
    const { data: roaLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: genericMedicationListResponse } = useGetGenericMedicationWithActiveIngredientQuery(searchKeyword);
    const { data: administrationInstructionsLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ORDER_ADMIN_NSTRUCTIONS');
    const { data: orderTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MEDCATION_ORDER_TYPE');
    const { data: priorityLevelLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
    const { data: indicationLovQueryResponse } = useGetLovValuesByCodeQuery('MED_INDICATION_USE');
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
    const { data: DurationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_DURATION');
    const [saveDrugorderMedication, saveDrugorderMedicationMutation] = useSaveDrugOrderMedicationMutation();
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
    const { data: departmentListResponse } = useGetDepartmentsQuery({
        ...initialListRequest
        ,
        filters: [
            {
                fieldName: "department_type_lkey",
                operator: "match",
                value: '5673990729647012',
            },
        ]
    });
    const { data: icdListResponseLoading } = useGetIcdListQuery(icdListRequest);
    const modifiedData = (icdListResponseLoading?.object ?? []).map(item => ({
        ...item,
        combinedLabel: `${item.icdCode} - ${item.description}`,
    }));
    useEffect(() => {
        if(orderMedication.parametersToMonitor != null || orderMedication.parametersToMonitor != "") {
        const parameters = orderMedication.parametersToMonitor || "";
        const parametersArray = parameters.split(",");
        setTags(parametersArray);}
    }, [orderMedication])
    useEffect(() => {

        if (drugKey == null) {
            handleCleare();
        }

    }, [drugKey]);
  
    
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

        setEditDuration(orderMedication.chronicMedication);
        setOrderMedication({ ...orderMedication, duration: null, durationTypeLkey: null })
    }, [orderMedication.chronicMedication]);
    useEffect(() => {

    }, [selectedGeneric]);
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
        if (orderMedication.administrationInstructions != null) {

            setAdminInstructions(prevadminInstructions =>
                prevadminInstructions ? `${prevadminInstructions}, ${administrationInstructionsLovQueryResponse?.object?.find(
                    item => item.key === orderMedication.administrationInstructions
                )?.lovDisplayVale}` :
                    administrationInstructionsLovQueryResponse?.object?.find(
                        item => item.key === orderMedication.administrationInstructions
                    )?.lovDisplayVale
            );
        }

        setOrderMedication({ ...orderMedication, administrationInstructions: null })
    }, [orderMedication.administrationInstructions])
    useEffect(() => {

        setEditDuration(orderMedication.chronicMedication);
        setOrderMedication({ ...orderMedication, duration: null, durationTypeLkey: null })
    }, [orderMedication.chronicMedication]);

    const handleCleare = () => {
        setOrderMedication({
            ...newApDrugOrderMedications,
            durationTypeLkey: null,
            administrationInstructions: null,
            startDateTime: null,
            genericSubstitute: false,
            chronicMedication: false,
            patientOwnMedication: false,
            priorityLkey: null,
            roaLkey: null,
            doseUnitLkey: null,
            drugOrderTypeLkey: null,
            indicationUseLkey: null,
            pharmacyDepartmentKey: null,


        })
        setAdminInstructions("");
        setSelectedGeneric(null);
        setSelectedFirstDate(null);
        setindicationsDescription("");


        setTags([])
    }
    const handleSaveMedication = () => {
        try {
            const tagcompine = joinValuesFromArray(tags);
            saveDrugorderMedication({
                ...orderMedication,
                patientKey: patient.key,
                visitKey: encounter.key,
                drugOrderKey: drugKey,
                genericMedicationsKey: selectedGeneric.key,
                parametersToMonitor: tagcompine,
                statusLkey: "164797574082125",
                startDateTime: orderMedication.startDateTime ? orderMedication.startDateTime.getTime() : null,
                indicationIcd: indicationsDescription,
                administrationInstructions: adminInstructions
            }).unwrap().then(() => {
                dispatch(notify({msg:"added sucssesfily" ,sev:"success"}))
                setOpen(false);
                handleCleare();
                medicRefetch();
            })
        } catch (error) {
            dispatch(notify({ msg: "added feild", sev: "error" }))
        }
    }
    const handleSearch = value => {
        setSearchKeyword(value);
    };
    const handleItemClick = (Generic) => {
        setSelectedGeneric(Generic);
        // refetchGenric().then(() => {
        //     console.log("Refetch Genric");

        // }).catch((error) => {
        //     console.error("Refetch failed:", error);
        // });
        setSearchKeyword("")
        const newList = roaLovQueryResponse.object.filter((item) =>
            (Generic.roaList).includes(item.key)
        );
        setFilteredList(newList);
    };
    const handleSearchIcd = value => {
        setSearchKeywordicd(value);


    };
    const handleDateChange = (date) => {
        if (date) {
            const timestamp = date.getTime();
            setSelectedFirstDate(date);
        }
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
    const joinValuesFromArray = (values) => {
        return values.filter(Boolean).join(', ');
    };

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
            <PlusIcon
                onClick={handleButtonClick}
                style={{ marginRight: '5px' }}
            />
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
            leftContent={<>
            
                <ActiveIngrediantList selectedGeneric={selectedGeneric} />
            </>}
            rightContent={

                <Row>
                    <Col md={12}>
                        <div className="child-div">

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



                                    </Form></Col>
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

                                    </MyButton></Col>
                            </Row>

                            <div className="fields-div">
                                <div style={{ flex: 1 }}>
                                    <Form layout="inline" >
                                        <MyInput
                                            column
                                            fieldType="select"
                                            fieldLabel="Drug Order Type"
                                            selectData={orderTypeLovQueryResponse?.object ?? []}
                                            selectDataLabel="lovDisplayVale"
                                            selectDataValue="key"
                                            fieldName={'drugOrderTypeLkey'}
                                            record={orderMedication}
                                            setRecord={setOrderMedication}
                                        />
                                    </Form>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Form layout="inline" >
                                        <MyInput
                                            disabled={orderMedication.drugOrderTypeLkey != '2937712448460454' ? true : false}
                                            column
                                            fieldLabel="PRN Indication"
                                            fieldName={'prnIndication'}
                                            record={orderMedication}
                                            setRecord={setOrderMedication}
                                        />
                                    </Form>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Form layout="inline" >
                                        <MyInput
                                            fieldType="datetime"
                                            fieldName="startDateTime"
                                            record={orderMedication}
                                            setRecord={setOrderMedication}
                                        /></Form>
                                </div>

                            </div>
                            <div className="fields-div">
                                <div style={{ flex: 1 }}>
                                    <Form layout="inline" disabled={drugKey != null ? editing : true} >
                                        <MyInput
                                            column
                                            width={105}
                                            fieldType='number'
                                            fieldName={'dose'}
                                            record={orderMedication}
                                            setRecord={setOrderMedication}
                                        />
                                    </Form>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Form layout="inline" >
                                        <MyInput
                                            column
                                            width={105}
                                            fieldType="select"
                                            fieldLabel="Unit"
                                            selectData={unitLovQueryResponse?.object ?? []}
                                            selectDataLabel="lovDisplayVale"
                                            selectDataValue="key"
                                            fieldName={'doseUnitLkey'}
                                            record={orderMedication}
                                            setRecord={setOrderMedication}
                                        />
                                    </Form>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Form layout="inline" >

                                        <MyInput
                                            column
                                            width={"80px"}
                                            disabled={drugKey != null ? editing : true}
                                            fieldLabel="Frequency"
                                            fieldType="number"
                                            fieldName={'frequency'}
                                            record={orderMedication}
                                            setRecord={setOrderMedication}
                                            rightAddon="Hr"
                                        />
                                    </Form>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Form layout="inline" >
                                        <MyInput
                                            column
                                            width={105}
                                            fieldType="select"
                                            fieldLabel="ROA"
                                            selectData={filteredList ?? []}
                                            selectDataLabel="lovDisplayVale"
                                            selectDataValue="key"
                                            fieldName={'roaLkey'}
                                            record={orderMedication}
                                            setRecord={setOrderMedication}
                                        />
                                    </Form>
                                </div>
                            </div>
                            <Translate>Indication</Translate>
                            <div className="fields-div" style={{ gap: '10px' }}>
                                <div className="child-div"> <InputGroup inside >
                                    <Input
                                        disabled={drugKey != null ? editing : true}
                                        placeholder="Search ICD-10"
                                        value={searchKeywordicd}
                                        onChange={handleSearchIcd}
                                    />
                                    <InputGroup.Button>
                                        <SearchIcon />
                                    </InputGroup.Button>
                                </InputGroup>
                                    {searchKeywordicd && (
                                        <Dropdown.Menu  className="dropdown-menuresult">
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
                                    <Input as="textarea"
                                        disabled={true}
                                        onChange={(e) => setindicationsDescription} value={indicationsDescription
                                            || orderMedication.indicationIcd
                                        }
                                        rows={2} /></div>
                                <div className="child-div">
                                    <InputGroup inside >
                                        <Input
                                            disabled={drugKey != null ? editing : true}
                                            placeholder="Search SNOMED-CT"
                                            value={""}

                                        />
                                        <InputGroup.Button>
                                            <SearchIcon />
                                        </InputGroup.Button>
                                    </InputGroup>

                                    <Input as="textarea"
                                        disabled={true}

                                        rows={2} />
                                </div>
                            </div>
                            <div className="fields-div">
                                <Form fluid className="fill-width"  >
                                    <MyInput

                                        disabled={drugKey != null ? editing : true}
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Indication Use"
                                        selectData={indicationLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'indicationUseLkey'}
                                        record={orderMedication}
                                        setRecord={setOrderMedication}

                                    />
                                </Form>
                            </div>
                            <div className="fields-div">
                                <Form fluid className="fill-width" >
                                    <MyInput

                                        disabled={drugKey != null ? editing : true}
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Send To Pharmacy"
                                        selectData={departmentListResponse?.object ?? []}
                                        selectDataLabel="name"
                                        selectDataValue="key"
                                        fieldName={'pharmacyDepartmentKey'}
                                        record={orderMedication}
                                        setRecord={setOrderMedication}

                                    />
                                </Form>
                            </div>
                            <div className="fields-div">
                                <Form fluid className="fill-width" >
                                    <MyInput
                                        width="100%"
                                        disabled={drugKey != null ? editing : true}
                                        fieldType="textarea"
                                        fieldName='indicationManually'
                                        record={orderMedication}
                                        setRecord={setOrderMedication}
                                    />
                                </Form></div>
                        </div></Col>
                    <Col md={12}>
                        <div className="child-div">
                            <div className="fields-div">
                                <div style={{ flex: 1 }}>
                                    <Form layout="inline"  >
                                        <MyInput
                                            column
                                            disabled={drugKey != null ? (!editing ? editDuration : editing) : true}

                                            fieldType="number"
                                            fieldLabel="Duration"
                                            fieldName={'duration'}
                                            placholder={' '}
                                            record={orderMedication}
                                            setRecord={setOrderMedication}
                                        />
                                    </Form>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Form layout="inline" >
                                        <MyInput
                                            column
                                            disabled={drugKey != null ? (!editing ? editDuration : editing) : true}

                                            fieldType="select"
                                            fieldLabel="Duration type"
                                            selectData={DurationTypeLovQueryResponse?.object ?? []}
                                            selectDataLabel="lovDisplayVale"
                                            selectDataValue="key"
                                            fieldName={'durationTypeLkey'}
                                            record={orderMedication}
                                            setRecord={setOrderMedication}

                                        />
                                    </Form>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Form layout="inline" >
                                        <MyInput

                                            disabled={drugKey != null ? editing : true}
                                            column
                                            fieldLabel="Chronic Medication"
                                            fieldType="checkbox"
                                            fieldName="chronicMedication"
                                            record={orderMedication}
                                            setRecord={setOrderMedication}

                                        />
                                    </Form>
                                </div>

                            </div>
                            <div className="child-div">
                                <Form fluid>

                                    <MyInput

                                        width="100%"
                                        disabled={drugKey != null ? editing : true}
                                        fieldType="select"
                                        fieldLabel="Administration Instructions"
                                        selectData={administrationInstructionsLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'administrationInstructions'}
                                        record={orderMedication}
                                        setRecord={setOrderMedication}
                                    /></Form>
                                <Input as="textarea" onChange={(e) => setAdminInstructions(e)}
                                    value={adminInstructions}

                                />
                            </div>
                            <Row>
                                <Col md={12}>
                                    <Form fluid layout="inline">
                                        <MyInput
                                            column
                                            width={230}
                                            disabled={drugKey != null ? editing : true}
                                            fieldType="number"
                                            fieldName={'maximumDose'}
                                            record={orderMedication}
                                            setRecord={setOrderMedication}
                                        />
                                    </Form></Col>
                                <Col md={12}>
                                    <Form fluid layout="inline">
                                        <MyInput
                                            column
                                            disabled={drugKey != null ? editing : true}
                                            width={230}
                                            fieldType="select"
                                            fieldLabel="priority Level"
                                            selectData={priorityLevelLovQueryResponse?.object ?? []}
                                            selectDataLabel="lovDisplayVale"
                                            selectDataValue="key"
                                            fieldName={'priorityLkey'}
                                            record={orderMedication}
                                            setRecord={setOrderMedication}

                                        />
                                    </Form>
                                </Col>
                            </Row>

                            <div className="fields-div">
                                <Form fluid className="fill-width"   >
                                    <MyInput

                                        disabled={drugKey != null ? editing : true}
                                        height={30}
                                        fieldType="textarea"
                                        width="100%"
                                        fieldName={'specialInstructions'}
                                        record={orderMedication}
                                        setRecord={setOrderMedication}

                                    />
                                </Form>

                            </div>
                            <Row>
                                <Row>
                                <MyLabel label="Parameters to monitor"  />
                                </Row>
                                <Row></Row>
                                <Row>
                                <TagGroup className='taggroup-style'>
                                    {tags.map((item, index) => (
                                        <Tag key={index} closable onClose={() => removeTag(item)}>
                                            {item}
                                        </Tag>
                                    ))}
                                    {renderInput()}
                                </TagGroup>
                                </Row>
                              
                            </Row>
                            <Row>
                                <Col md={12}>
                                    <Form fluid layout="inline">
                                        <MyInput

                                            disabled={drugKey != null ? editing : true}
                                            column

                                            fieldLabel="Brand substitute allowed"
                                            fieldType="checkbox"
                                            fieldName="genericSubstitute"
                                            record={orderMedication}
                                            setRecord={setOrderMedication}

                                        />
                                    </Form></Col>
                                <Col md={12}>
                                    <Form fluid layout="inline" >
                                        <MyInput

                                            disabled={drugKey != null ? editing : true}
                                            column
                                            fieldType="checkbox"
                                            fieldName="patientOwnMedication"
                                            record={orderMedication}
                                            setRecord={setOrderMedication}

                                        />
                                    </Form>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={24}>
                                    <Form fluid className="fill-width" layout="vertical" >
                                        <MyInput

                                            disabled={drugKey != null ? editing : true}
                                            height={90}
                                            fieldType="textarea"
                                            width="100%"
                                            fieldName={'notes'}
                                            record={orderMedication}
                                            setRecord={setOrderMedication}

                                        />
                                    </Form>
                                </Col>
                            </Row>
                        </div></Col>
                </Row>
            }
        ></AdvancedModal>
        <Substitues open={openSubstitutesModel} setOpen={setOpenSubstitutesModel} selectedGeneric={selectedGeneric}></Substitues></>);
}
export default DetailsModal;