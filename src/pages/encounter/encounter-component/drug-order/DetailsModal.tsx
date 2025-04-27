import React, { useEffect, useState, useRef } from "react";
import { notify } from '@/utils/uiReducerActions';
import { Form, Modal, Row, Col, Button, DatePicker, Table, Divider, Pagination, Panel, Text, Stack, InputGroup, Input, Dropdown } from "rsuite";
import './styles.less';
import SearchIcon from '@rsuite/icons/Search';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import AdvancedModal from "@/components/AdvancedModal";
import InfoCardList from "@/components/InfoCardList";
import ActiveIngrediantList from './ActiveIngredient'
import { useGetActiveIngredientQuery, useGetGenericMedicationActiveIngredientQuery, useGetGenericMedicationWithActiveIngredientQuery } from "@/services/medicationsSetupService";
import { initialListRequest } from "@/types/types";
import Substitues from "./Substitutes";
import MyButton from "@/components/MyButton/MyButton";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import Translate from "@/components/Translate";
import MyInput from "@/components/MyInput";
const DetailsModal = ({ open, setOpen, orderMedication, setOrderMedication }) => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchKeywordicd, setSearchKeywordicd] = useState('');
    const [drugKey, setDrugKey] = useState({ key: "njnj" });
    const [editing, setEditing] = useState(true);
    const [openSubstitutesModel, setOpenSubstitutesModel] = useState(false);
    const [selectedGeneric, setSelectedGeneric] = useState(null);
    const [selectedFirstDate, setSelectedFirstDate] = useState(null);
    const [filteredList, setFilteredList] = useState([]);
    const { data: roaLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: genericMedicationListResponse } = useGetGenericMedicationWithActiveIngredientQuery(searchKeyword);
    const { data: orderTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MEDCATION_ORDER_TYPE');
    const { data: priorityLevelLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');

    useEffect(() => {
        console.log("Selected Generic:", selectedGeneric);
    }, [selectedGeneric]);
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
    const handleDateChange = (date) => {
        if (date) {
            const timestamp = date.getTime();
            setSelectedFirstDate(date);
        }
    };
    return (<>
        <AdvancedModal
            open={open}
            setOpen={setOpen}
            leftContent={<>
                <ActiveIngrediantList selectedGeneric={selectedGeneric} />
            </>}
            rightContent={
                <div className="details-basic-div">
                    <div className="child-div">
                        <div className="fields-div">
                            <Form layout="inline" >
                                <InputGroup inside className='input-search-p'>
                                    <Input
                                        width={"400px"}
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



                            </Form>
                            <MyButton
                                radius={'25px'}
                                onClick={() => {
                                    setOpenSubstitutesModel(true);
                                }}
                                prefixIcon={() => <FontAwesomeIcon icon={faCircleInfo} />}
                            >

                            </MyButton>
                        </div>
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
                                <Form layout="inline" >
                                    <MyInput
                                        width={"105px"}
                                        column
                                        disabled={drugKey != null ? editing : true}
                                        fieldType="number"
                                        fieldName={'maximumDose'}
                                        record={orderMedication}
                                        setRecord={setOrderMedication}
                                    />
                                </Form>
                            </div>
                            <div style={{ flex: 1 }}>
                                <Form layout="inline" >
                                    <MyInput
                                        column
                                        disabled={drugKey != null ? editing : true}
                                        width={"105px"}
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
                            </div>
                            <div style={{ flex: 1 }}>
                                <Form layout="inline" >

                                    <MyInput
                                        column
                                        width={"105px"}
                                        disabled={drugKey != null ? editing : true}
                                        fieldType="number"
                                        fieldName={'maximumDose'}
                                        record={orderMedication}
                                        setRecord={setOrderMedication}
                                    />
                                </Form>
                            </div>
                            <div style={{ flex: 1 }}>
                                <Form layout="inline" >
                                    <MyInput
                                        column
                                        disabled={drugKey != null ? editing : true}
                                        width={"105px"}
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
                            </div>
                        </div>
                        <div className="details-basic-div">1</div>
                        <div className="details-basic-div">1</div>
                    </div>
                    <div className="child-div">2</div>
                </div>}
        ></AdvancedModal>
        <Substitues open={openSubstitutesModel} setOpen={setOpenSubstitutesModel} selectedGeneric={selectedGeneric}></Substitues></>);
}
export default DetailsModal;