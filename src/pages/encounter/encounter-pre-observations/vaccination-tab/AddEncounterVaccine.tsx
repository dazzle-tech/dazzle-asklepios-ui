import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import AdvancedModal from '@/components/AdvancedModal';
import { InputGroup, Form, Input, Panel, Text, Checkbox, Button, IconButton, Table, Modal, Row, SelectPicker, Col, Grid, Dropdown, Stack, DatePicker } from 'rsuite';
import { ApVaccine, ApVaccineBrands, ApVaccineDose, ApVaccineDosesInterval, ApEncounterVaccination } from '@/types/model-types';
import { useSaveEncounterVaccineMutation, useGetEncounterVaccineQuery } from '@/services/observationService'
import { newApVaccine, newApVaccineBrands, newApVaccineDose, newApVaccineDosesInterval, newApEncounterVaccination } from '@/types/model-types-constructor';
import { useGetLovValuesByCodeQuery, useGetVaccineListQuery, useGetVaccineBrandsListQuery, useGetVaccineDosesListQuery, useGetVaccineDosesIntervalListQuery } from '@/services/setupService';
import SearchIcon from '@rsuite/icons/Search';
import { initialListRequest, ListRequest } from '@/types/types';
import MyLabel from '@/components/MyLabel';
const AddEncounterVaccine = ({
    open,
    setOpen,
    patient,
    encounter,
    encounterVaccination,
    setEncounterVaccination
}) => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [vaccine, setVaccine] = useState<ApVaccine>({ ...newApVaccine });
    const [vaccineBrand, setVaccineBrand] = useState<ApVaccineBrands>({ ...newApVaccineBrands, volume: null });
    const [vaccineDose, setVaccineDose] = useState<any>({ ...newApVaccineDose });
    const [vaccineToDose, setVaccineToDose] = useState<ApVaccineDose>({ ...newApVaccineDose });
    const [administrationReaction, setAdministrationReactions] = useState({ administrationReactionsLkey: '' });
    const [hasExternalFacility, setHasExternalFacility] = useState({ isHas: encounterVaccination?.externalFacilityName === '' ? false : true })
    const [vaccineDoseInterval, setVaccineDoseInterval] = useState<ApVaccineDosesInterval>({ ...newApVaccineDosesInterval });
    
    //LOV
    const { data: typeLovQueryResponse } = useGetLovValuesByCodeQuery('VACCIN_TYP');
    const { data: rOALovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: numofDossLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
    const { data: manufacturerLovQueryResponse } = useGetLovValuesByCodeQuery('GEN_MED_MANUFACTUR');
    const { data: medAdversLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');
    const { data: numSerialLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS_SERIAL');
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
    const { data: statusLovQueryResponse } = useGetLovValuesByCodeQuery('ALLERGY_RES_STATUS');
    const { data: volumUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');

    const [vaccineListRequest, setVaccineListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ],
    });
    const [vaccineBrandsListRequest, setVaccineBrandsListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ],
    });
    const [vaccineDosesListRequest, setVaccineDosesListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
        ],
    });
    const [vaccineDosesIntevalListRequest, setVaccineDosesIntervalListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ],
    });
    const [encounterVaccineListRequest, setEncounterVaccineListRequest] = useState<ListRequest>({
            ...initialListRequest,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                {
                    fieldName: 'patient_key',
                    operator: 'match',
                    value: patient?.key
                },
                {
                    fieldName: 'encounter_key',
                    operator: 'match',
                    value: encounter?.key
                }
            ],
        });
    //listResponses
    const { data: vaccineDosesListResponseLoading, refetch: refetchVaccineDoses } = useGetVaccineDosesListQuery(vaccineDosesListRequest, {
        skip: !vaccine?.key && !vaccineBrand?.key && !vaccineDose?.key,
    });
    const { data: vaccineListResponseLoading, refetch } = useGetVaccineListQuery(vaccineListRequest);
    const { data: encounterVaccineListResponseLoading, refetch: encounterVaccine } = useGetEncounterVaccineQuery(encounterVaccineListRequest);
    const { data: vaccineBrandsListResponseLoading, refetch: refetchBrands } = useGetVaccineBrandsListQuery(vaccineBrandsListRequest, {
        skip: !vaccine?.key,
    });
    const { data: vaccineDosesIntervalListResponseLoading, refetch: refetchVaccineDosesInterval } = useGetVaccineDosesIntervalListQuery(vaccineDosesIntevalListRequest, {
        skip: !vaccineBrand?.key && !vaccineDose?.key,
    });
    ///Fun 
    const modifiedData = (vaccineListResponseLoading?.object ?? []).map(item => ({
        ...item,
        combinedLabel: `${item.vaccineName}`,
    }));
    const brandsNameList = (vaccineBrandsListResponseLoading?.object ?? []).map(item => ({
        value: item.key,
        label: item.brandName,
        vaccineBrand: item
    }));
    const dosesList = (vaccineDosesListResponseLoading?.object ?? []).map(item => ({
        value: item.key,
        label: item.doseNameLvalue.lovDisplayVale,
        vaccineDoses: item
    }));
    const handleSearch = value => {
        setSearchKeyword(value);
    };


   useEffect(() => {
        setHasExternalFacility({ isHas: encounterVaccination?.externalFacilityName === '' ? false : true });
    }, [encounterVaccination])
    useEffect(() => {
        if (searchKeyword.trim() !== "") {
            setVaccineListRequest(
                {
                    ...initialListRequest,
                    filterLogic: 'and',
                    filters: [
                        {
                            fieldName: 'deleted_at',
                            operator: 'isNull',
                            value: undefined
                        },
                        {
                            fieldName: 'vaccine_name',
                            operator: 'containsIgnoreCase',
                            value: searchKeyword
                        },
                        {
                            fieldName: 'is_valid',
                            operator: 'match',
                            value: 'true'
                        }

                    ]
                }
            );
        }
    }, [searchKeyword]);
    return (
        <AdvancedModal
            open={open}
            setOpen={setOpen}
            leftTitle='Code'
            rightTitle='Add Vaccine'
            actionButtonFunction={""}
            leftContent={""}

            rightContent={
                <div >
                    <Form layout="inline" fluid>
                        <div>

                            <div style={{ position: "relative" }}>
                                <Text style={{ fontWeight: '800', fontSize: '16px' }}>Vaccine Name</Text>
                                <InputGroup inside style={{ width: '230px' }}>
                                    <Input
                                     //   disabled={isEncounterStatusClosed || disabled}
                                        placeholder="Search"
                                        value={searchKeyword}
                                        onChange={handleSearch}
                                    />
                                    <InputGroup.Button>
                                        <SearchIcon />
                                    </InputGroup.Button>
                                </InputGroup>
                                {searchKeyword && (
                                    <Dropdown.Menu className="dropdown-menuresult" >
                                        {modifiedData?.map(mod => (
                                            <Dropdown.Item
                                                key={mod.key}
                                                eventKey={mod.key}
                                                onClick={() => {
                                                    setVaccine(mod);
                                                    setSearchKeyword("");
                                                }}
                                            >
                                                <span style={{ marginRight: "19px" }}>{mod.vaccineName}</span>
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                )}
                            </div>

                            <MyInput
                                column
                                disabled
                                width={200}
                                fieldType="text"
                                fieldLabel="Vaccin Name"
                                fieldName='vaccineName'
                                record={vaccine}
                                setRecord={setVaccine}
                            />
                            <MyInput
                                column
                                disabled
                                width={200}
                                fieldType="text"
                                fieldLabel="ATC Code"
                                fieldName='atcCode'
                                record={vaccine}
                                setRecord={setVaccine}
                            />

                            <MyInput
                                width={230}
                                column
                                fieldLabel="Type"
                                fieldType="select"
                                fieldName="typeLkey"
                                selectData={typeLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={vaccine}
                                setRecord={setVaccine}
                                disabled
                            />
                            <MyInput
                                width={230}
                                column
                                fieldLabel="Number of Doses"
                                fieldType="select"
                                fieldName="numberOfDosesLkey"
                                selectData={numofDossLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={vaccine}
                                setRecord={setVaccine}
                                disabled
                            />

                            <MyInput
                                width={230}
                                column
                                fieldLabel="ROA"
                                fieldType="select"
                                fieldName="roaLkey"
                                selectData={rOALovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={vaccine}
                                setRecord={setVaccine}
                                disabled
                            />
                            <MyInput
                                width={230}
                                column
                                fieldLabel="Site of Administration"
                                fieldName="siteOfAdministration"
                                record={vaccine}
                                setRecord={setVaccine}
                                disabled
                            />
</div>
                            {/* <ButtonToolbar>
                        <IconButton width={180} style={{ marginTop: '25px' }} appearance="primary" color="cyan" icon={<PlusIcon />} onClick={() => { setPopupOpen(true) }}
                            disabled={!vaccine.key} >
                            View Vaccine
                        </IconButton> </ButtonToolbar></div> */}
                    </Form>
                    <Form style={{ display: 'flex' }} layout="inline" fluid>
                        <div style={{ display: 'flex', zoom: 0.90, alignItems: 'center', gap: '10px' }}>

                            <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px' }}>
                                <div>  <MyLabel label="Used Brand" /></div>
                                <SelectPicker

                                    data={brandsNameList}

                                    value={
                                        vaccineBrand?.brandName === null
                                            ? null
                                            : brandsNameList.key
                                    }
                                    onChange={(value) => {
                                        const selectedItem = brandsNameList.find((item) => item.value === value);
                                        setVaccineBrand({ ...selectedItem.vaccineBrand });
                                    }}
                                    style={{ width: 230 }}
                                    placeholder={vaccineBrand?.key ? vaccineBrand?.brandName : 'Select'}
                                    labelKey="label"
                                    valueKey="value"
                                   // disabled={!vaccine.key || isEncounterStatusClosed || disabled}

                                />
                            </div>
                            <MyInput
                                column
                                disabled
                                width={90}
                                fieldType="text"
                                fieldLabel="Volume"
                                fieldName='volume'
                                record={vaccineBrand}
                                setRecord={setVaccineBrand}
                            />
                            <MyInput
                                disabled
                                width={100}
                                column
                                fieldLabel="Unit"
                                fieldType="select"
                                fieldName="unitLkey"
                                selectData={volumUnitLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={vaccineBrand}
                                setRecord={setVaccineBrand}

                            />
                            <MyInput

                                width={200}
                                column
                                fieldLabel="Vaccine Manufacturer"
                                fieldType="select"
                                fieldName="manufacturerLkey"
                                selectData={manufacturerLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={vaccineBrand}
                                setRecord={setVaccineBrand}
                                disabled
                            />
                            <MyInput
                                column
                               // disabled={isEncounterStatusClosed || disabled}
                                width={230}
                                fieldType="text"
                                fieldLabel="Vaccine Lot Number"
                                fieldName='vaccineLotNumber'
                                record={encounterVaccination}
                                setRecord={setEncounterVaccination}
                            />
                            <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px' }}>
                                <div>  <MyLabel label="Date Administered" /></div>
                                <Stack spacing={10} direction="column" alignItems="flex-start">
                                    <DatePicker
                                        format="MM/dd/yyyy hh:mm"
                                        showMeridian
                                      //  disabled={isEncounterStatusClosed || disabled}
                                        style={{ width: '230px' }}
                                        value={encounterVaccination.dateAdministered ? new Date(encounterVaccination.dateAdministered) : null}
                                        placeholder={encounterVaccination.dateAdministered ? new Date(encounterVaccination.dateAdministered).toLocaleString("en-GB") : "MM/dd/yyyy hh:mm"}
                                        onChange={newValue => {
                                            if (newValue) {
                                                setEncounterVaccination(prev => ({
                                                    ...prev,
                                                    dateAdministered: newValue.getTime()
                                                }));
                                            } else {

                                                setEncounterVaccination(prev => ({
                                                    ...prev,
                                                    dateAdministered: null
                                                }));
                                            }
                                        }}
                                    />
                                </Stack>


                            </div>

                            <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px' }}>
                                <div>
                                    <MyLabel label="Dose Name" />
                                </div>
                                <SelectPicker
                                    data={dosesList}
                                    value={
                                        vaccineDose?.doseNameLkey === null
                                            ? null
                                            : dosesList.key
                                    }
                                    onChange={(value) => {
                                        const selectedItem = dosesList.find((item) => item.value === value);
                                        setVaccineDose({ ...selectedItem.vaccineDoses });
                                    }}
                                    style={{ width: 230 }}
                                    labelKey="label"
                                    valueKey="value"
                                    placeholder={
                                        vaccineDose?.key
                                            ? vaccineDose?.doseNameLvalue.lovDisplayVale
                                            : 'Select'
                                    }
                                 //   disabled={!vaccine.key || isEncounterStatusClosed || disabled}
                                />


                            </div>
                            <MyInput

                                width={230}
                                column
                                fieldLabel="Next Dose"
                                fieldType="select"
                                fieldName="doseNameLkey"
                                selectData={numSerialLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={vaccineToDose}

                                disabled
                            />
                            <div style={{ display: 'flex' }}>

                                <MyInput

                                    width={40}
                                    column
                                    fieldLabel="Next"
                                    fieldName="intervalBetweenDoses"
                                    record={vaccineDoseInterval}
                                    disabled
                                />
                                <MyInput

                                    width={150}
                                    column
                                    fieldLabel="Dose Due Date"
                                    fieldType="select"
                                    fieldName="unitLkey"
                                    selectData={unitLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    record={vaccineDoseInterval}
                                    disabled
                                />

                            </div>

                        </div>

                    </Form>
                    <Form style={{ display: 'flex' }} layout="inline" fluid>
                        <MyInput
                            column
                           // disabled={isEncounterStatusClosed || disabled}
                            width={300}
                            fieldType="text"
                            fieldLabel="Actual Side and Site of Administration"
                            fieldName='actualSide'
                            record={encounterVaccination}
                            setRecord={setEncounterVaccination}
                        />
                        <MyInput
                            width={353}
                            column
                            fieldLabel="Administration Reactions"
                            fieldType="select"
                            fieldName='administrationReactionsLkey'
                            selectData={medAdversLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={administrationReaction}
                            setRecord={setAdministrationReactions}
                           // disabled={isEncounterStatusClosed || disabled}
                        />
                        <MyInput
                            width={230}
                            column
                            fieldLabel="External Facility"
                            fieldType="checkbox"
                            fieldName="isHas"
                            record={hasExternalFacility}
                            setRecord={setHasExternalFacility}
                          // disabled={isEncounterStatusClosed || disabled}
                        />
                        <MyInput
                            column

                            width={230}
                            fieldType="text"
                            fieldLabel="External Facility Name"
                            fieldName='externalFacilityName'
                            record={encounterVaccination}
                            setRecord={setEncounterVaccination}
                            disabled={!hasExternalFacility.isHas}
                        />


                    </Form>
                    <Form style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Form style={{ display: 'flex', flexDirection: 'column' }}>
                            <MyLabel label="Notes" />
                            <Input
                               // disabled={isEncounterStatusClosed || disabled}
                                as="textarea"
                                value={encounterVaccination.notes}
                                onChange={(e) => setEncounterVaccination({
                                    ...encounterVaccination,
                                    notes: e
                                })}
                                style={{ width: 255 }}
                                rows={4}
                            />

                        </Form>
                        <Input
                            //disabled={isEncounterStatusClosed || disabled}
                            as="textarea"
                            value={encounterVaccination.administrationReactions || ""}
                            onChange={(value) =>
                                setEncounterVaccination((prev) => ({
                                    ...prev,
                                    administrationReactions: value
                                }))
                            }
                            style={{ width: 300, marginTop: '26px' }}
                            rows={4}
                        />


                    </Form>
                </div>
            }


        ></AdvancedModal>
    );
};
export default AddEncounterVaccine;
