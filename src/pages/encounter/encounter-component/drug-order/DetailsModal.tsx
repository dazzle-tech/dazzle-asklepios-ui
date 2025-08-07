import AdvancedModal from "@/components/AdvancedModal";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyLabel from "@/components/MyLabel";
import CheckIcon from '@rsuite/icons/Check';
import { useAppDispatch } from '@/hooks';
import { useSaveDrugOrderMedicationMutation } from "@/services/encounterService";
import { useGetGenericMedicationWithActiveIngredientQuery } from "@/services/medicationsSetupService";
import { useGetDepartmentsQuery, useGetIcdListQuery, useGetLovValuesByCodeQuery } from "@/services/setupService";
import { newApDrugOrderMedications } from "@/types/model-types-constructor";
import { initialListRequest, ListRequest } from "@/types/types";
import { notify } from '@/utils/uiReducerActions';
import { faRightLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PlusIcon from '@rsuite/icons/Plus';
import SearchIcon from '@rsuite/icons/Search';
import React, { useEffect, useState } from "react";
import { Col, Dropdown, Form, Input, InputGroup, Row, Tag, TagGroup, Text } from "rsuite";
import ActiveIngrediantList from './ActiveIngredient';
import './styles.less';
import Substitues from "./Substitutes";
import MyTagInput from "@/components/MyTagInput/MyTagInput";
import clsx from "clsx";
import DiagnosticsOrder from "../diagnostics-order";
import MyModal from "@/components/MyModal/MyModal";
import MultiSelectAppender from "@/pages/medical-component/multi-select-appender/MultiSelectAppender";
const DetailsModal = ({ edit, open, setOpen, orderMedication, setOrderMedication, drugKey, editing, patient, encounter, medicRefetch, openToAdd }) => {
    const dispatch = useAppDispatch();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchKeywordicd, setSearchKeywordicd] = useState('');
    const [openOrderModel, setOpenOrderModel] = useState(false);

    const [tags, setTags] = React.useState([]);
    const [indicationsIcd, setIndicationsIcd] = useState({ indicationIcd: null });
    const [openSubstitutesModel, setOpenSubstitutesModel] = useState(false);
    const [selectedGeneric, setSelectedGeneric] = useState(null);
    const [selectedFirstDate, setSelectedFirstDate] = useState(null);
    const [filteredList, setFilteredList] = useState([]);
    const [adminInstructions, setAdminInstructions] = useState("");
    const [editDuration, setEditDuration] = useState(false);
    const [slectInst, setSelectInt] = useState({ inst: null });
    const [instructionList, setInstructionList] = useState([]);
    const [instr, setInstruc] = useState(null)
    const [indicationsDescription, setindicationsDescription] = useState<string>('');
    const { data: roaLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: genericMedicationListResponse } = useGetGenericMedicationWithActiveIngredientQuery(searchKeyword);
    console.log("genericMedicationListResponse", genericMedicationListResponse?.object);
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
        if (orderMedication.key != null) {
            setSelectedGeneric(genericMedicationListResponse?.object?.find(item => item.key === orderMedication.genericMedicationsKey))
            const prevadmin = orderMedication.administrationInstructions?.split(",")
            setInstructionList(prevadmin)
            setAdminInstructions(orderMedication.administrationInstructions);
            setTags(orderMedication?.parametersToMonitor?.split(","))
        }

    }, [orderMedication]);

    useEffect(() => {
        setInstruc(joinValuesFromArray(instructionList))
    }, [instructionList])

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
        if (drugKey == null) {
            handleCleare();
        }
    }, [drugKey]);

    //when close modal clear 
    useEffect(() => {
        if (open == false) {
            handleCleare();

        }
    }, [open]);
    // cleare when open modal to add new medication
    useEffect(() => {
        if (openToAdd) {
            handleCleare();

        }
    }, [openToAdd]);
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
        setSearchKeyword("");
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
                startDateTime: orderMedication.startDateTime ? new Date(orderMedication?.startDateTime)?.getTime() : null,
                indicationIcd: indicationsDescription,
                administrationInstructions: instr
            }).unwrap().then(() => {
                dispatch(notify({ msg: "Added sucssesfily", sev: "success" }))
                setOpen(false);
                handleCleare();
                medicRefetch();
            })
        } catch (error) {
            dispatch(notify({ msg: "Added feild", sev: "error" }))
            console.log(error);

        }
    }
    const handleSearch = value => {
        setSearchKeyword(value);
    };
    const handleItemClick = (Generic) => {
        setSelectedGeneric(Generic);
        setSearchKeyword("");
        const newList = roaLovQueryResponse.object.filter((item) =>
            (Generic.roaList)?.includes(item.key)
        );
        setFilteredList(newList);
    };
    const handleSearchIcd = value => {
        setSearchKeywordicd(value);


    };


    const joinValuesFromArray = (values) => {
        return values?.filter(Boolean).join(', ');
    };


    return (<>
        <AdvancedModal
            open={open}
            setOpen={setOpen}
            actionButtonFunction={handleSaveMedication}
            actionButtonLabel="Save"
            isDisabledActionBtn={edit ? true : orderMedication.key ? orderMedication?.statusLvalue?.valueCode !== " DIAG_ORDER_STAT_NEW" : false}
            leftTitle={selectedGeneric ? selectedGeneric.genericName : "Select Generic"}
            rightTitle="Medication Order Details"
            leftContent={<> <ActiveIngrediantList selectedGeneric={selectedGeneric} /></>}
            footerButtons={<div className='footer-buttons'>

                <MyButton
                    appearance='ghost'

                    onClick={() => {
                        setOpenOrderModel(true);
                    }}

                    prefixIcon={() => <CheckIcon />}>
                    Order Related Tests
                </MyButton>
            </div>}

            rightContent={
                <Form fluid>
                    <Row gutter={20}
                        className={clsx({
                            'disabled-panel':
                                edit ||
                                (orderMedication?.key &&
                                    orderMedication?.statusLvalue?.valueCode !== 'DIAG_ORDER_STAT_NEW'),
                        })}

                    >
                        <Col md={12}>

                            <Row className="rows-gap">
                                <Col md={20}>

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
                                            {genericMedicationListResponse?.object?.map(Generic => (
                                                <Dropdown.Item
                                                    key={Generic.key}
                                                    eventKey={Generic.key}
                                                    onClick={() => handleItemClick(Generic)}
                                                >
                                                    <div style={{ lineHeight: '1.4' }}>
                                                        <div style={{ fontWeight: 'bold' }}>
                                                            {Generic.genericName} {Generic.dosageFormLvalue?.lovDisplayVale && `(${Generic.dosageFormLvalue?.lovDisplayVale})`}
                                                        </div>
                                                        <div style={{ fontSize: '0.85em', color: '#555' }}>
                                                            {Generic.manufacturerLvalue?.lovDisplayVale} {Generic.roaLvalue?.lovDisplayVale && `| ${Generic.roaLvalue?.lovDisplayVale}`}
                                                        </div>
                                                        <div style={{ fontSize: '0.8em', color: '#888' }}>
                                                            {Generic.activeIngredients}
                                                        </div>
                                                    </div>
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>

                                    )}



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

                                    </MyButton></Col>
                            </Row>
                            <Row className="rows-gap">
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="datetime"
                                        fieldName="startDateTime"
                                        record={orderMedication}
                                        setRecord={setOrderMedication}
                                    /></Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Drug Order Type"
                                        selectData={orderTypeLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'drugOrderTypeLkey'}
                                        record={orderMedication}
                                        setRecord={setOrderMedication}
                                        searchable={false}
                                    /></Col>
                                <Col md={8}>
                                    {orderMedication.drugOrderTypeLkey == '2937712448460454' ?
                                        (
                                            <MyInput
                                                width="100%"
                                                fieldLabel="PRN Indication"
                                                fieldName={'prnIndication'}
                                                record={orderMedication}
                                                setRecord={setOrderMedication}
                                            />
                                        ) : ""}</Col>
                            </Row>
                            <Row className="rows-gap">
                                <Col md={6}>
                                    <MyInput
                                        width="100%"
                                        fieldType='number'
                                        fieldName={'dose'}
                                        record={orderMedication}
                                        setRecord={setOrderMedication}
                                    /></Col>
                                <Col md={6}>  <MyInput

                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Unit"
                                    selectData={unitLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'doseUnitLkey'}
                                    record={orderMedication}
                                    setRecord={setOrderMedication}
                                /></Col>
                                <Col md={6}>      <MyInput

                                    width="100%"
                                    disabled={drugKey != null ? editing : true}
                                    fieldLabel="Frequency"
                                    fieldType="number"
                                    fieldName={'frequency'}
                                    record={orderMedication}
                                    setRecord={setOrderMedication}
                                    rightAddon="Hr"
                                /></Col>
                                <Col md={6}>  <MyInput

                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="ROA"
                                    selectData={filteredList ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'roaLkey'}
                                    record={orderMedication}
                                    setRecord={setOrderMedication}
                                /></Col>
                            </Row>
                            <Row className="rows-gap">
                                <Text className="font-style" >Indication</Text>
                            </Row>
                            <Row>
                                <Col md={12}>    <InputGroup inside >
                                    <Input

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
                                    )}</Col>
                                <Col md={12}> <InputGroup inside >
                                    <Input
                                        disabled={drugKey != null ? editing : true}
                                        placeholder="Search SNOMED-CT"
                                        value={""}

                                    />
                                    <InputGroup.Button>
                                        <SearchIcon />
                                    </InputGroup.Button>
                                </InputGroup>
                                </Col>
                            </Row>
                            <Row className="rows-gap">
                                <Col md={12}>  <Input as="textarea"
                                    disabled={true}
                                    onChange={(e) => setindicationsDescription} value={indicationsDescription
                                        || orderMedication.indicationIcd
                                    }
                                    rows={2} /></Col>
                                <Col md={12}>
                                    <Input as="textarea"
                                        disabled={true}

                                        rows={2} /></Col>
                            </Row>
                            <Row className="rows-gap">
                                <Col md={24}>
                                    <MyInput
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Indication Use"
                                        selectData={indicationLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'indicationUseLkey'}
                                        record={orderMedication}
                                        setRecord={setOrderMedication}
                                        searchable={false}
                                    /></Col>
                            </Row>
                            <Row className="rows-gap">
                                <Col md={24}>
                                    <MyInput

                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Send To Pharmacy"
                                        selectData={departmentListResponse?.object ?? []}
                                        selectDataLabel="name"
                                        selectDataValue="key"
                                        fieldName={'pharmacyDepartmentKey'}
                                        record={orderMedication}
                                        setRecord={setOrderMedication}
                                        searchable={false}

                                    /></Col>
                            </Row>
                            <Row className="rows-gap">
                                <Col md={24}>
                                    <MyInput
                                        width="100%"
                                        fieldType="textarea"
                                        fieldName='indicationManually'
                                        record={orderMedication}
                                        setRecord={setOrderMedication}
                                    />
                                </Col>
                            </Row>
                        </Col>
                        <Col md={12}>
                            <Row className="rows-gap">
                                <Col md={8}> <MyInput
                                    disabled={editDuration}
                                    fieldType="number"
                                    fieldLabel="Duration"
                                    fieldName={'duration'}
                                    width="100%"
                                    record={orderMedication}
                                    setRecord={setOrderMedication}
                                /></Col>
                                <Col md={8}>   <MyInput
                                    width="100%"
                                    disabled={editDuration}
                                    fieldType="select"
                                    fieldLabel="Duration type"
                                    selectData={DurationTypeLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'durationTypeLkey'}
                                    record={orderMedication}
                                    setRecord={setOrderMedication}
                                    searchable={false}

                                /></Col>
                                <Col md={8}> <MyInput
                                    width="100%"
                                    fieldLabel="Chronic Medication"
                                    fieldType="checkbox"
                                    fieldName="chronicMedication"
                                    record={orderMedication}
                                    setRecord={setOrderMedication}
                                /></Col>

                            </Row>
                            <Row>
                                <Col md={24}>
                                    <MyInput
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Administration Instructions"
                                        selectData={administrationInstructionsLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'inst'}
                                        record={slectInst}
                                        setRecord={setSelectInt}
                                    /></Col>
                            </Row>
                            <Row className="rows-gap">

                                <Col md={24}>
                                    <Input as="textarea" onChange={(e) => setInstruc(e.target.value)}
                                        value={instr}
                                        style={{ width: '100%' }}
                                        rows={3} /></Col>
                            </Row>
                            <Row className="rows-gap">
                                <Col md={12}>  <MyInput
                                    width="100%"
                                    fieldType="number"
                                    fieldName={'maximumDose'}
                                    record={orderMedication}
                                    setRecord={setOrderMedication}
                                /></Col>
                                <Col md={12}><MyInput

                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Priority Level"
                                    selectData={priorityLevelLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'priorityLkey'}
                                    record={orderMedication}
                                    setRecord={setOrderMedication}
                                    searchable={false}

                                /></Col>
                            </Row>

                            <Row className="rows-gap">
                                <Col md={24}>
                                    <MyInput
                                        height={30}
                                        fieldType="textarea"
                                        width="100%"
                                        fieldName={'specialInstructions'}
                                        record={orderMedication}
                                        setRecord={setOrderMedication}

                                    />
                                </Col>
                            </Row>

                            <Row>
                                <Col md={24}>
                                    <MyLabel label="Parameters to monitor" />
                                </Col>

                            </Row>
                            <Row className="rows-gap">
                                <Col md={24}>
                                    <MyTagInput tags={tags} setTags={setTags} />

                                </Col>
                            </Row>
                            <Row className="rows-gap">
                                <Col md={12}>

                                    <MyInput
                                        width="100%"
                                        fieldLabel="Brand substitute allowed"
                                        fieldType="checkbox"
                                        fieldName="genericSubstitute"
                                        record={orderMedication}
                                        setRecord={setOrderMedication}

                                    />
                                </Col>
                                <Col md={12}>
                                    <Form fluid layout="inline" >
                                        <MyInput
                                            width="100%"
                                            fieldType="checkbox"
                                            fieldName="patientOwnMedication"
                                            record={orderMedication}
                                            setRecord={setOrderMedication}

                                        />
                                    </Form>
                                </Col>
                            </Row>
                            <Row className="rows-gap">
                                <Col md={24}>
                                    <MyInput

                                        disabled={drugKey != null ? editing : true}
                                        height={90}
                                        fieldType="textarea"
                                        width="100%"
                                        fieldName={'notes'}
                                        record={orderMedication}
                                        setRecord={setOrderMedication}

                                    />
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Form>
            }
        ></AdvancedModal>
        <Substitues open={openSubstitutesModel} setOpen={setOpenSubstitutesModel} selectedGeneric={selectedGeneric}></Substitues>
        <MyModal
            open={openOrderModel}
            setOpen={setOpenOrderModel}
            size={'full'}
            title="Add Order"
            content={<DiagnosticsOrder edit={edit} patient={patient} encounter={encounter} />}>
        </MyModal>
    </>);
}
export default DetailsModal;