import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import AdvancedModal from '@/components/AdvancedModal';
import { InputGroup, Form, Input, Dropdown, Stack, DatePicker } from 'rsuite';
import { ApVaccine, ApVaccineBrands, ApVaccineDose, ApVaccineDosesInterval} from '@/types/model-types';
import { useSaveEncounterVaccineMutation, useGetEncounterVaccineQuery } from '@/services/observationService'
import { newApVaccine, newApVaccineBrands, newApVaccineDose, newApVaccineDosesInterval, newApEncounterVaccination } from '@/types/model-types-constructor';
import { useGetLovValuesByCodeQuery, useGetVaccineListQuery, useGetVaccineBrandsListQuery, useGetVaccineDosesListQuery, useGetVaccineDosesIntervalListQuery } from '@/services/setupService';
import SearchIcon from '@rsuite/icons/Search';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import MyLabel from '@/components/MyLabel';
import { notify } from '@/utils/uiReducerActions';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less'
import InfoCardList from '@/components/InfoCardList';
const AddEncounterVaccine = ({
    open,
    setOpen,
    patient,
    encounter,
    encounterVaccination,
    setEncounterVaccination,
    vaccineObject,
    vaccineDoseObjet,
    vaccineBrandObject,
    refetch,
    isDisabled=false,
    edit
}) => {
    const authSlice = useAppSelector(state => state.auth);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [vaccine, setVaccine] = useState<ApVaccine>({ ...vaccineObject });
    const [vaccineBrand, setVaccineBrand] = useState<ApVaccineBrands>({ ...vaccineBrandObject });
    const [isDisabledField,setIsDisabledField] = useState(false);
    const [vaccineDose, setVaccineDose] = useState<any>({ ...vaccineDoseObjet });
    const [vaccineToDose, setVaccineToDose] = useState<ApVaccineDose>({ ...newApVaccineDose });
    const [administrationReaction, setAdministrationReactions] = useState({ administrationReactionsLkey: '' });
    const [isEncounterVaccineStatusClose,setIsEncounterVacineStatusClose]=useState(false);
    const [hasExternalFacility, setHasExternalFacility] = useState({ isHas: encounterVaccination?.externalFacilityName === '' ? false : true })
    const [vaccineDoseInterval, setVaccineDoseInterval] = useState<ApVaccineDosesInterval>({ ...newApVaccineDosesInterval });
    const [saveEncounterVaccine] = useSaveEncounterVaccineMutation();
    const dispatch = useAppDispatch();
    // Fetch LOV data for various fields
    const { data: typeLovQueryResponse } = useGetLovValuesByCodeQuery('VACCIN_TYP');
    const { data: rOALovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: numofDossLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
    const { data: manufacturerLovQueryResponse } = useGetLovValuesByCodeQuery('GEN_MED_MANUFACTUR');
    const { data: medAdversLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');
    const { data: numSerialLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS_SERIAL');
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
    const { data: volumUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
    // Initialize List Request Filters
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

    //List Responses
    // Fetch vaccine doses list based on selected vaccine, brand, & dose
    const { data: vaccineDosesListResponseLoading} = useGetVaccineDosesListQuery(vaccineDosesListRequest, {
        skip: !vaccine?.key && !vaccineBrand?.key && !vaccineDose?.key,
    });
    // Fetch full vaccine list
    const { data: vaccineListResponseLoading } = useGetVaccineListQuery(vaccineListRequest);
    // Fetch vaccine brands list based on selected vaccine
    const { data: vaccineBrandsListResponseLoading } = useGetVaccineBrandsListQuery(vaccineBrandsListRequest, {
        skip: !vaccine?.key,
    });
    // Fetch vaccine dose intervals based on selected brand & dose
    const { data: vaccineDosesIntervalListResponseLoading } = useGetVaccineDosesIntervalListQuery(vaccineDosesIntevalListRequest, {
        skip: !vaccineBrand?.key && !vaccineDose?.key,
    });
   // Prepare vaccine list with a combined label for display
    const modifiedData = (vaccineListResponseLoading?.object ?? []).map(item => ({
        ...item,
        combinedLabel: `${item.vaccineName}`,
    }));
    // Prepare vaccine brands list for dropdown selection
    const brandsNameList = (vaccineBrandsListResponseLoading?.object ?? []).map(item => ({
        value: item.key,
        label: item.brandName,
        vaccineBrand: item
    }));
    // Prepare vaccine doses list with display name for dropdown selection
    const dosesList = (vaccineDosesListResponseLoading?.object ?? []).map(item => ({
        value: item.key,
        label: item.doseNameLvalue.lovDisplayVale,
        vaccineDoses: item
    }));

    //handle Search Function
    const handleSearch = value => {
        setSearchKeyword(value);
    };
    //handle Clear Fields
    const handleClearField = () => {
        setEncounterVaccination({ ...newApEncounterVaccination, statusLkey: null });
        setVaccine({
            ...newApVaccine,
            typeLkey: null,
            roaLkey: null,
            durationUnitLkey: null,
            numberOfDosesLkey: null
        });
        setVaccineBrand({
            ...newApVaccineBrands,
            brandName: '',
            manufacturerLkey: null,
            unitLkey: null,
        });
        setVaccineDose({
            ...newApVaccineDose,
            fromAgeUnitLkey: null,
            toAgeUnitLkey: null,
            doseNameLkey: null,
        });
        setVaccineToDose({
            ...newApVaccineDose,
            fromAgeUnitLkey: null,
            toAgeUnitLkey: null,
            doseNameLkey: null,
        });
        setIsEncounterVacineStatusClose(false);
        setVaccineDoseInterval({ ...newApVaccineDosesInterval });
        setHasExternalFacility({ isHas: false });
        setAdministrationReactions({ administrationReactionsLkey: null });
        setSearchKeyword("");
    };
    //handle Save Encounter Vaccine
    const handleSaveEncounterVaccine = () => {
        if (encounterVaccination.key === undefined) {
            saveEncounterVaccine({ ...encounterVaccination, vaccineKey: vaccine.key, vaccineBrandKey: vaccineBrand.key, vaccineDoseKey: vaccineDose.key, patientKey: patient.key, encounterKey: encounter.key, statusLkey: "9766169155908512", createdBy: authSlice.user.key }).unwrap().then(() => {
                dispatch(notify('Encounter Vaccine Added Successfully'));
                setEncounterVaccination({ ...newApEncounterVaccination, statusLkey: null })
                refetch();
                handleClearField();
                setOpen(false);
            });
        } else if (encounterVaccination.key) {
            saveEncounterVaccine({ ...encounterVaccination, vaccineKey: vaccine.key, vaccineBrandKey: vaccineBrand.key, vaccineDoseKey: vaccineDose.key, patientKey: patient.key, encounterKey: encounter.key, updatedBy: authSlice.user.key }).unwrap().then(() => {
                dispatch(notify('Encounter Vaccine Updated Successfully'));
                refetch();
                handleClearField();
                setOpen(false);
            });
        }
    };

    // Effects
    useEffect(() => {
    // TODO update status to be a LOV value
        if (encounter?.encounterStatusLkey === '91109811181900') {
            setIsEncounterStatusClosed(true);
        }
    }, [encounter?.encounterStatusLkey]);
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
    useEffect(() => {
        setVaccineDosesIntervalListRequest((prev) => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                ...(vaccine?.key
                    ? [
                        {
                            fieldName: 'vaccine_key',
                            operator: 'match',
                            value: vaccine.key,
                        },
                    ]
                    : []),
            ],
        }));
        setVaccineDosesListRequest((prev) => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                ...(vaccine?.key
                    ? [
                        {
                            fieldName: 'vaccine_key',
                            operator: 'match',
                            value: vaccine.key,
                        },
                    ]
                    : []),
            ],
        }));
        setVaccineBrandsListRequest((prev) => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                ...(vaccine?.key
                    ? [
                        {
                            fieldName: 'vaccine_key',
                            operator: 'match',
                            value: vaccine.key,
                        },
                    ]
                    : []),
            ],
        }));
    }, [vaccine?.key]);
    useEffect(() => {
        setVaccineDosesIntervalListRequest((prev) => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                ...(vaccine?.key
                    ? [
                        {
                            fieldName: 'vaccine_key',
                            operator: 'match',
                            value: vaccine.key,
                        },
                    ]
                    : []),
                ...(vaccineDose?.key
                    ? [
                        {
                            fieldName: 'from_dose_key',
                            operator: 'match',
                            value: vaccineDose.key,
                        },
                    ]
                    : []),
            ],
        }));
    }, [vaccineDose?.key]);
    useEffect(() => {
        if (vaccine?.key && vaccineBrand?.key && vaccineDose?.key) {
            if (vaccineDosesIntervalListResponseLoading?.object[0] != undefined) {
                setVaccineDoseInterval(vaccineDosesIntervalListResponseLoading?.object[0]);
                setVaccineToDose(vaccineDosesIntervalListResponseLoading?.object[0].toDose);
            }
            else {
                setVaccineDoseInterval(newApVaccineDosesInterval);
                setVaccineToDose(newApVaccineDose);
            }
        }
    }, [vaccineDosesIntervalListResponseLoading, vaccineDose?.key]);
    useEffect(() => {
        if (administrationReaction.administrationReactionsLkey != null) {
            const foundItemKey = medAdversLovQueryResponse?.object?.find(
                item => item.key === administrationReaction.administrationReactionsLkey
            );
            const foundItem = foundItemKey?.lovDisplayVale || '';;
            setEncounterVaccination(prevEncounterVaccination => ({
                ...prevEncounterVaccination,
                administrationReactions: prevEncounterVaccination.administrationReactions
                    ? prevEncounterVaccination.administrationReactions.includes(foundItem)
                        ? prevEncounterVaccination.administrationReactions
                        : `${prevEncounterVaccination.administrationReactions}, ${foundItem}`
                    : foundItem
            }));
        }
    }, [administrationReaction.administrationReactionsLkey]);
    useEffect(() => {
        setEncounterVaccination((prev) => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                ...(patient?.key && encounter?.key
                    ? [
                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                        {
                            fieldName: 'encounter_key',
                            operator: 'match',
                            value: encounter?.key
                        },
                    ]
                    : []),
            ],
        }));
    }, [patient?.key, encounter?.key]);
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
    useEffect(() => {
        setVaccine({ ...vaccineObject });
      }, [vaccineObject]);
    useEffect(() => {
        setVaccineBrand({ ...vaccineBrandObject });
      }, [vaccineBrandObject]);
    useEffect(() => {
        setVaccineDose({ ...vaccineDoseObjet });
      }, [vaccineDoseObjet]);
    useEffect(() => {
        if (encounterVaccination?.statusLkey === '3196709905099521') {
          setIsEncounterVacineStatusClose(true);
        } else {
          setIsEncounterVacineStatusClose(false);
        }
      }, [encounterVaccination?.statusLkey]);
    useEffect(() => {
        if (isEncounterStatusClosed || isDisabled || isEncounterVaccineStatusClose) {
          setIsDisabledField(true);
        } else {
          setIsDisabledField(false);
        }
      }, [isEncounterStatusClosed, isDisabled, isEncounterVaccineStatusClose]);
    return (
        <AdvancedModal
            open={open}
            setOpen={setOpen}
            isDisabledActionBtn={edit}
            leftTitle={`${vaccine?.vaccineName} Vaccine`}
            rightTitle='Add Vaccine'
            size = "87vw"
            actionButtonFunction={handleSaveEncounterVaccine}
            footerButtons={
                <MyButton appearance='ghost' onClick={handleClearField}>Clear</MyButton>
            }
            rightContent={
                <div className={`right-main-container ${edit?"disabled-panel":""}`}>
                    <div className='search-list'>
                        <MyLabel label="Vaccine Name" />
                        <InputGroup inside >
                            <Input
                                disabled={isDisabledField}
                                placeholder="Search"
                                value={searchKeyword}
                                onChange={handleSearch}
                            />
                            <InputGroup.Button   disabled={isDisabledField}>
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
                                        <span>{mod.vaccineName}</span>
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        )}
                    </div>
                    <Form layout="inline" fluid className="fields-container">
                        <MyInput
                            column
                            disabled
                            fieldType="text"
                            fieldLabel="Vaccin Name"
                            fieldName='vaccineName'
                            record={vaccine}
                            setRecord={setVaccine}
                        />
                        <MyInput
                            column
                            disabled
                            fieldType="text"
                            fieldLabel="ATC Code"
                            fieldName='atcCode'
                            record={vaccine}
                            setRecord={setVaccine}
                        />
                        <MyInput
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
                            column
                            fieldLabel="Site of Administration"
                            fieldName="siteOfAdministration"
                            record={vaccine}
                            setRecord={setVaccine}
                            disabled
                        />
                        <MyInput
                            column
                            searchable={false}
                            fieldLabel="Used Brand"
                            fieldType="select"
                            fieldName="key"
                            selectData={brandsNameList}
                            selectDataLabel="label"
                            selectDataValue="value"
                            record={{ key: vaccineBrand?.key || '' }}
                            setRecord={(updated) => {
                                if (!updated.key) {
                                    setVaccineBrand(null);
                                } else {
                                    const selectedItem = brandsNameList.find(item => item.value === updated.key);
                                    if (selectedItem) {
                                        setVaccineBrand({ ...selectedItem.vaccineBrand });
                                    }
                                }
                            }}
                            placeholder="Select"
                            disabled={isDisabledField}
                        />
                        <MyInput
                            column
                            disabled
                            fieldType="text"
                            fieldLabel="Volume"
                            fieldName='volume'
                            record={vaccineBrand}
                            setRecord={setVaccineBrand}
                        />
                        <MyInput
                            disabled
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
                             disabled={isDisabledField}
                            fieldType="text"
                            fieldLabel="Vaccine Lot Number"
                            fieldName='vaccineLotNumber'
                            record={encounterVaccination}
                            setRecord={setEncounterVaccination}
                        />
                        <MyInput
                            column
                            searchable={false}
                            fieldLabel="Dose Name"
                            fieldType="select"
                            fieldName="key"
                            selectData={dosesList}
                            selectDataLabel="label"
                            selectDataValue="value"
                            record={{ key: vaccineDose?.key || '' }}
                            setRecord={(updated) => {
                                const selectedItem = dosesList.find((item) => item.value === updated.key);
                                if (selectedItem) {
                                    setVaccineDose({ ...selectedItem.vaccineDoses });
                                } else {
                                    setVaccineDose({});
                                }
                            }}
                            placeholder={
                                vaccineDose?.key
                                    ? vaccineDose?.doseNameLvalue?.lovDisplayVale
                                    : 'Select'
                            }
                          disabled={isDisabledField}
                        />
                        <MyInput
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
                        <MyInput
                            column
                            fieldLabel="Next Dose Due Date"
                            fieldName="combined"
                            placeholder={
                                vaccineDoseInterval?.intervalBetweenDoses && vaccineDoseInterval?.unitLkey
                                    ? `${vaccineDoseInterval.intervalBetweenDoses} ${unitLovQueryResponse?.object?.find(u => u.key === vaccineDoseInterval.unitLkey)?.lovDisplayVale || ''
                                    }`
                                    : ' '
                            }
                            record={""}
                            disabled
                        />
                        <MyInput
                            column
                             disabled={isDisabledField}
                            fieldType="text"
                            fieldLabel="Administration Site"
                            fieldName='actualSide'
                            record={encounterVaccination}
                            setRecord={setEncounterVaccination}
                        />
                        <MyInput
                            column
                            fieldLabel="External Facility"
                            fieldType="checkbox"
                            fieldName="isHas"
                            record={hasExternalFacility}
                            setRecord={setHasExternalFacility}
                         disabled={isDisabledField}
                        />
                        <MyInput
                            column
                            fieldType="text"
                            fieldLabel="External Facility Name"
                            fieldName='externalFacilityName'
                            record={encounterVaccination}
                            setRecord={setEncounterVaccination}
                            disabled={!hasExternalFacility.isHas}
                        />
                        <div className='vaccine-input-wrapper'>
                            <div>  <MyLabel label="Date Administered" /></div>
                            <Stack spacing={10} direction="column" alignItems="flex-start" className='date-time-picker'>
                                <DatePicker
                                    format="MM/dd/yyyy hh:mm"
                                    showMeridian
                                    disabled={isDisabledField}
                                    style={{ width: '145px' }}
                                    value={encounterVaccination.dateAdministered ? new Date(encounterVaccination.dateAdministered) : null}
                                    placeholder={encounterVaccination.dateAdministered ? new Date(encounterVaccination.dateAdministered).toLocaleString("en-GB") : "M/d/y hh:mm"}
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
                    </Form>
                    <Form layout="inline" fluid className="form-container">
                        <div className="inputs-group">
                            <MyInput
                                column
                                fieldLabel="Administration Reactions"
                                fieldType="select"
                                fieldName="administrationReactionsLkey"
                                selectData={medAdversLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={administrationReaction}
                                setRecord={setAdministrationReactions}
                                disabled={isDisabledField}
                            />
                            <MyInput
                                disabled={isDisabledField}
                                showLabel={false}
                                fieldType="textarea"
                                fieldLabel="Administration Reactions"
                                fieldName="administrationReactions"
                                record={encounterVaccination}
                                setRecord={setEncounterVaccination}
                                rows={4}
                            />
                        </div>
                        <MyInput
                           disabled={isDisabledField}
                            column
                            fieldType="textarea"
                            fieldLabel="Notes"
                            fieldName="notes"
                            record={encounterVaccination}
                            setRecord={setEncounterVaccination}
                            rows={6}
                        />
                    </Form>
                </div>
            }
            leftContent={<div className="left-main-container">
                <Form layout="inline" fluid className="fields-container">
                    <MyInput
                        width={160}
                        column
                        fieldLabel="Vaccine Code"
                        fieldName="vaccineCode"
                        record={vaccine}
                        setRecord={setVaccine}
                        disabled
                    />
                    <MyInput
                        width={160}
                        column
                        fieldLabel="ATC Code"
                        fieldName="atcCode"
                        record={vaccine}
                        setRecord={setVaccine}
                        disabled
                    />
                    <MyInput
                        width={160}
                        column
                        fieldLabel="Post Opening Duration"
                        fieldName="postOpeningDuration"
                        record={vaccine}
                        setRecord={setVaccine}
                        disabled
                    />
                    <MyInput
                        width={160}
                        column
                        fieldLabel="Duration Unit"
                        fieldType="select"
                        fieldName="durationUnitLkey"
                        selectData={unitLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={vaccine}
                        setRecord={setVaccine}
                        disabled
                    />
                </Form>
                <div>
                    <h6>Vaccine Brands</h6>
                    <InfoCardList
                        list={vaccine?.key ? vaccineBrandsListResponseLoading?.object ?? [] : []}
                        fields={['manufacturerLkey', 'volume', 'unitLkey', 'marketingAuthorizationHolder', 'isValid']}
                        fieldLabels={{
                            manufacturerLkey: 'Manufacturer',
                            volume: 'Volume',
                            unitLkey: 'Unit',
                            marketingAuthorizationHolder: 'MAH',
                            isValid: 'isValid'
                        }}
                        titleField="brandName"
                    >
                    </InfoCardList>
                </div>
            </div>}
        ></AdvancedModal>
    );
};
export default AddEncounterVaccine;