import React, { useEffect, useState, useRef } from "react";
import { notify } from '@/utils/uiReducerActions';
import { Form, Modal, Row, Col, Button, DatePicker, Table, Divider, Pagination, Panel, Text, Stack, InputGroup, Input, Dropdown, TagGroup, Tag } from "rsuite";
import './styles.less';
import SearchIcon from '@rsuite/icons/Search';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useGetIcdListQuery, useGetLovValuesByCodeQuery } from "@/services/setupService";
import AdvancedModal from "@/components/AdvancedModal";
import InfoCardList from "@/components/InfoCardList";
import ActiveIngrediantList from './ActiveIngredient'
import { useGetActiveIngredientQuery, useGetGenericMedicationActiveIngredientQuery, useGetGenericMedicationWithActiveIngredientQuery } from "@/services/medicationsSetupService";
import { initialListRequest, ListRequest } from "@/types/types";
import Substitues from "./Substitutes";
import MyButton from "@/components/MyButton/MyButton";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import Translate from "@/components/Translate";
import MyInput from "@/components/MyInput";
import PlusIcon from '@rsuite/icons/Plus';
const DetailsModal = ({ open, setOpen, orderMedication, setOrderMedication }) => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchKeywordicd, setSearchKeywordicd] = useState('');
    const [drugKey, setDrugKey] = useState({ key: "njnj" });
    const [editing, setEditing] = useState(true);
    const [typing, setTyping] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');
    const [tags, setTags] = React.useState([]);
    const [edit_new, setEdit_new] = useState(true);
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
    useEffect(() => {

        setEditDuration(orderMedication.chronicMedication);
        setOrderMedication({ ...orderMedication, duration: null, durationTypeLkey: null })
    }, [orderMedication.chronicMedication]);
    useEffect(() => {
        console.log("Selected Generic:", selectedGeneric);
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
                    style={{ width: 70}}
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
            style={{marginRight:'5px'}}
            />
        );
    };
    return (<>
        <AdvancedModal
            open={open}
            setOpen={setOpen}
            leftTitle="Active Ingredients"
            rightTitle="Medication Order Details"
            leftContent={<>
                <ActiveIngrediantList selectedGeneric={selectedGeneric} />
            </>}
            rightContent={

                <Row>
                    <Col md={12}>
                        <div className="child-div">
                        
                                <Row>
                                    <Col md={18}>
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
                                                    <span style={{ marginRight: "15px" }}>
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
                                    <Col md={6}><MyButton
                                    radius={'25px'}
                                    onClick={() => {
                                        setOpenSubstitutesModel(true);
                                    }}
                                    prefixIcon={() => <FontAwesomeIcon icon={faCircleInfo} />}
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
                                    <Translate style={{ marginTop: '6px' }}>Start Date Time</Translate>
                                    <DatePicker
                                        format="MM/dd/yyyy hh:mm aa"
                                        showMeridian
                                        value={selectedFirstDate}
                                        onChange={handleDateChange}
                                        disabled={drugKey != null ? editing : true}
                                    />
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
                                            fieldName={'drugOrderTypeLkey'}
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
                            <div className="fields-div" style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
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
                                        <Dropdown.Menu disabled={!edit_new} className="dropdown-menuresult">
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
                                                    <span style={{ marginRight: "19px" }}>{mod.icdCode}</span>
                                                    <span>{mod.description}</span>
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
                                <Form fluid style={{ width: '100%' }}  >
                                    <MyInput
                                        column
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
                                <Form fluid style={{ width: '100%' }}  >
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
                                            width={210}
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
                                            width={210}
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
                                <Form fluid style={{ width: '100%' }}   >
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
                                   <Text style={{ marginBottom: "10px" }}>Parameters to monitor</Text>
                                                    <TagGroup className='taggroup-style'>
                                                        {tags.map((item, index) => (
                                                            <Tag key={index} closable onClose={() => removeTag(item)}>
                                                                {item}
                                                            </Tag>
                                                        ))}
                                                        {renderInput()}
                                                    </TagGroup>
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
                                    <Form fluid style={{ width: '100%' }} layout="vertical" >
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