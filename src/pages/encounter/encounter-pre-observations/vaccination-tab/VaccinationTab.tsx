import React, { useEffect, useState } from 'react';
import './styles.less';
import {
    InputGroup,
    Form,
    Input,
    Panel,
    DatePicker,
    Text,
    Checkbox,
    Dropdown,
    Button,
    IconButton,
    SelectPicker,
    Table,
    Modal,
    Stack,
    Divider,
    Toggle,
    ButtonToolbar,
    Grid,
    Row,
    Col,
} from 'rsuite';
import Translate from '@/components/Translate';
import SearchIcon from '@rsuite/icons/Search';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CheckOutlineIcon from '@rsuite/icons/CheckOutline';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import {
    useSaveVaccineMutation,
    useGetLovValuesByCodeQuery,
    useGetVaccineListQuery,
    useRemoveVaccineMutation,
    useDeactiveActivVaccineMutation,
    useSaveVaccineBrandMutation,
    useGetVaccineBrandsListQuery,
    useDeactiveActivVaccineBrandsMutation,
    useGetDoseNumbersListQuery,
    useSaveVaccineDoseMutation,
    useGetVaccineDosesListQuery,
    useRemoveVaccineDoseMutation,
    useSaveVaccineDosesIntervalMutation,
    useGetVaccineDosesIntervalListQuery,
    useRemoveVaccineDoseIntervalMutation,
} from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import { useAppSelector, useAppDispatch } from '@/hooks';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import CheckIcon from '@rsuite/icons/Check';
import PlusIcon from '@rsuite/icons/Plus';
import MyLabel from '@/components/MyLabel';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import { useSaveEncounterVaccineMutation, useGetEncounterVaccineQuery } from '@/services/observationService'
import { ApVaccine, ApVaccineBrands, ApVaccineDose, ApVaccineDosesInterval, ApEncounterVaccination } from '@/types/model-types';
import { newApVaccine, newApVaccineBrands, newApVaccineDose, newApVaccineDosesInterval, newApEncounterVaccination } from '@/types/model-types-constructor';
const { Column, HeaderCell, Cell } = Table;
const VaccinationTab = ({ disabled }) => {
    const patientSlice = useAppSelector(state => state.patient);
    const authSlice = useAppSelector(state => state.auth);
    const dispatch = useAppDispatch();
    const [vaccine, setVaccine] = useState<ApVaccine>({ ...newApVaccine });
    const [searchKeyword, setSearchKeyword] = useState('');
    const [vaccineBrand, setVaccineBrand] = useState<ApVaccineBrands>({ ...newApVaccineBrands, volume: null });
    const [vaccineDose, setVaccineDose] = useState<ApVaccineDose>({ ...newApVaccineDose });
    const [encounterVaccination, setEncounterVaccination] = useState<ApEncounterVaccination>({ ...newApEncounterVaccination });

    const [vaccineDoseInterval, setVaccineDoseInterval] = useState<ApVaccineDosesInterval>({ ...newApVaccineDosesInterval });
    const [vaccineToDose, setVaccineToDose] = useState<ApVaccineDose>({ ...newApVaccineDose });
    const [possibleDescription, setPossibleDescription] = useState('');
    const [popupOpen, setPopupOpen] = useState(false);
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [encounterStatus, setEncounterStatus] = useState('');
    const [allData, setAllDate] = useState(false);
    const reviewedAt = (new Date()).getTime();
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [hasExternalFacility, setHasExternalFacility] = useState({ isHas: encounterVaccination?.externalFacilityName === '' ? false : true })
    const [saveEncounterVaccine, saveEncounterVaccineMutation] = useSaveEncounterVaccineMutation();
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
                value: patientSlice?.patient?.key
            },
            {
                fieldName: 'encounter_key',
                operator: 'match',
                value: patientSlice?.encounter?.key
            }
        ],
    });
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
    /// handleFunctions
    const handleSearch = value => {
        setSearchKeyword(value);
    };
    const handleClear = () => {
        setPopupOpen(false);
        setPopupCancelOpen(false);
    };
    const handleClearField = () => {
        setPopupOpen(false);
        setPopupCancelOpen(false);
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
            brandName: null,
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
        setVaccineDoseInterval({ ...newApVaccineDosesInterval })
        setHasExternalFacility({ isHas: false });
        setPossibleDescription('');
    };
    const handleExpanded = (rowData) => {
        let open = false;
        const nextExpandedRowKeys = [];

        expandedRowKeys.forEach(key => {
            if (key === rowData.key) {
                open = true;
            } else {
                nextExpandedRowKeys.push(key);
            }
        });

        if (!open) {
            nextExpandedRowKeys.push(rowData.key);
        }
        setExpandedRowKeys(nextExpandedRowKeys);
    };
    const renderRowExpanded = rowData => {

        return (

            <Table
                data={[rowData]}
                bordered
                cellBordered
                style={{ width: '100%', marginTop: '10px' }}
                height={100}
            >
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Created At</HeaderCell>
                    <Cell >
                        {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString("en-GB") : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Created By</HeaderCell>
                    <Cell >
                        {rowData => rowData?.createByUser?.fullName}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Updated At</HeaderCell>
                    <Cell >

                        {rowData => rowData.updatedAt ? new Date(rowData.updatedAt).toLocaleString("en-GB") : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Updated By</HeaderCell>
                    <Cell >
                        {rowData => rowData?.updateByUser?.fullName}
                    </Cell>
                </Column>
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Reviewed At</HeaderCell>
                    <Cell dataKey="reviewedAt" >



                        {rowData => rowData.reviewedAt ? new Date(rowData.reviewedAt).toLocaleString("en-GB") : ""}


                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Reviewed By</HeaderCell>
                    <Cell >
                        {rowData => rowData?.reviewedByUser?.fullName}
                    </Cell>
                </Column>
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Cancelled At</HeaderCell>
                    <Cell dataKey="deletedAt" >
                        {rowData => rowData.deletedAt ? new Date(rowData.deletedAt).toLocaleString("en-GB") : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Cancelled By</HeaderCell>
                    <Cell >
                        {rowData => rowData?.deleteByUser?.fullName}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Cancelliton Reason</HeaderCell>
                    <Cell dataKey="cancellationReason" />
                </Column>
            </Table>


        );
    };
    const ExpandCell = ({ rowData, dataKey, expandedRowKeys, onChange, ...props }) => (
        <Cell {...props} style={{ padding: 5 }}>
            <IconButton
                appearance="subtle"
                onClick={() => {
                    onChange(rowData);
                }}
                icon={
                    expandedRowKeys.some(key => key === rowData["key"]) ? (
                        <CollaspedOutlineIcon />
                    ) : (
                        <ExpandOutlineIcon />
                    )
                }
            />
        </Cell>
    );
    const isSelected = rowData => {
        if (rowData && encounterVaccination && encounterVaccination.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    const handleSaveEncounterVaccine = () => {
        if (encounterVaccination.key === undefined) {
            saveEncounterVaccine({ ...encounterVaccination, vaccineKey: vaccine.key, vaccineBrandKey: vaccineBrand.key, vaccineDoseKey: vaccineDose.key, patientKey: patientSlice.patient.key, encounterKey: patientSlice.encounter.key, administrationReactions: possibleDescription, statusLkey: "9766169155908512", createdBy: authSlice.user.key }).unwrap().then(() => {
                dispatch(notify('Encounter Vaccine Added Successfully'));
                setEncounterVaccination({ ...newApEncounterVaccination, statusLkey: null })
                encounterVaccine();
                handleClearField();
            });
        } else if (encounterVaccination.key) {
            saveEncounterVaccine({ ...encounterVaccination, vaccineKey: vaccine.key, vaccineBrandKey: vaccineBrand.key, vaccineDoseKey: vaccineDose.key, patientKey: patientSlice.patient.key, encounterKey: patientSlice.encounter.key, administrationReactions: possibleDescription, updatedBy: authSlice.user.key }).unwrap().then(() => {
                dispatch(notify('Encounter Vaccine Updated Successfully'));
                encounterVaccine();
                handleClearField();
            });
        }

    };
    const handleCancle = () => {
        saveEncounterVaccine({ ...encounterVaccination, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('Encounter Vaccine Canceled Successfully'));
            encounterVaccine();
        });
    };
    const handleReviewe = () => {
        saveEncounterVaccine({ ...encounterVaccination, statusLkey: "3721622082897301", reviewedAt: reviewedAt, reviewedBy: authSlice.user.key, updatedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('Encounter Vaccine Reviewed Successfully'));
            encounterVaccine();
        });

    }
    /// useEffects 
    // TODO update status to be a LOV value
    useEffect(() => {
        if (patientSlice?.encounter?.encounterStatusLkey === '91109811181900') {
            setIsEncounterStatusClosed(true);
        }
    }, [patientSlice.encounter?.encounterStatusLkey]);
    useEffect(() => {
        console.log(isEncounterStatusClosed)
    }, [isEncounterStatusClosed, patientSlice?.encounter?.encounterStatusLkey, disabled]);

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
    }, [vaccine?.key]);
    useEffect(() => {
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
        if (encounterVaccination.administrationReactions != null) {
            const foundItem = medAdversLovQueryResponse?.object?.find(
                item => item.key === encounterVaccination.administrationReactions
            );

            const displayValue = foundItem?.lovDisplayVale || '';

            if (displayValue) {
                setPossibleDescription(prevadminInstructions =>
                    prevadminInstructions
                        ? `${prevadminInstructions}, ${displayValue}`
                        : displayValue
                );
            }
        }
    }, [encounterVaccination.administrationReactions]);
    useEffect(() => {
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
        setEncounterVaccination((prev) => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                ...(patientSlice.patient?.key && patientSlice.encounter?.key
                    ? [
                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patientSlice.patient?.key
                        },
                        {
                            fieldName: 'encounter_key',
                            operator: 'match',
                            value: patientSlice.encounter?.key
                        },
                    ]
                    : []),
            ],
        }));
    }, [patientSlice.patient?.key, patientSlice.encounter?.key]);
    useEffect(() => {
        encounterVaccine();
    }, [handleReviewe, saveEncounterVaccine])
    useEffect(() => {
        setHasExternalFacility({ isHas: encounterVaccination?.externalFacilityName === '' ? false : true });
    }, [encounterVaccination])
    useEffect(() => {
        setEncounterVaccineListRequest((prev) => ({
            ...prev,
            filters: [
                ...(encounterStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: encounterStatus,
                        },
                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patientSlice?.patient?.key,
                        },
                        ...(allData === false
                            ? [
                                {
                                    fieldName: 'encounter_key',
                                    operator: 'match',
                                    value: patientSlice?.encounter?.key,
                                },
                            ]
                            : []),
                    ]
                    : [
                        {
                            fieldName: 'deleted_at',
                            operator: 'isNull',
                            value: undefined,
                        },
                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patientSlice?.patient?.key,
                        },
                        ...(allData === false
                            ? [
                                {
                                    fieldName: 'encounter_key',
                                    operator: 'match',
                                    value: patientSlice?.encounter?.key,
                                },
                            ]
                            : []),
                    ]),
            ],
        }));
    }, [encounterStatus, allData]);

    useEffect(() => {

        setEncounterVaccineListRequest((prev) => {
            const filters =
                encounterStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patientSlice?.patient?.key
                        },
                    ]
                    : encounterStatus === '' && allData
                        ? [
                            {
                                fieldName: 'deleted_at',
                                operator: 'isNull',
                                value: undefined,
                            },
                            {
                                fieldName: 'patient_key',
                                operator: 'match',
                                value: patientSlice?.patient?.key
                            },
                        ]
                        : prev.filters;

            return {
                ...initialListRequest,
                filters,
            };
        });
    }, [allData, encounterStatus]);

    return (<>
        <div>
            <Panel header="Add Vaccine " collapsible bordered defaultExpanded>
                <div style={{ border: '1px solid #b6b7b8', padding: "5px" }}>
                    <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                        <div style={{ zoom: 0.9, display: 'flex', gap: '10px', flexWrap: "wrap" }}>

                            <div>
                                <Text style={{ fontWeight: '800', fontSize: '16px' }}>Vaccine Name</Text>
                                <InputGroup inside style={{ width: '230px' }}>
                                    <Input
                                        disabled={isEncounterStatusClosed || disabled}
                                        placeholder="Search"
                                        value={searchKeyword}
                                        onChange={handleSearch}
                                    />
                                    <InputGroup.Button>
                                        <SearchIcon />
                                    </InputGroup.Button>
                                </InputGroup>
                                {searchKeyword && (
                                    <Dropdown.Menu className="dropdown-menuresult">
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

                            <ButtonToolbar>
                                <IconButton width={180} style={{ marginTop: '25px' }} appearance="primary" color="cyan" icon={<PlusIcon />} onClick={() => { setPopupOpen(true) }}
                                    disabled={!vaccine.key} >
                                    View Vaccine
                                </IconButton> </ButtonToolbar></div>
                    </Form>
                    <Form style={{ zoom: 0.85, display: 'flex' }} layout="inline" fluid>
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
                                    disabled={!vaccine.key || isEncounterStatusClosed || disabled}

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
                                disabled={isEncounterStatusClosed || disabled}
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
                                        disabled={isEncounterStatusClosed || disabled}
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
                                    disabled={!vaccine.key || isEncounterStatusClosed || disabled}
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
                    <Form style={{ zoom: 0.85, display: 'flex' }} layout="inline" fluid>
                        <MyInput
                            column
                            disabled={isEncounterStatusClosed || disabled}
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
                            fieldName='administrationReactions'
                            selectData={medAdversLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={encounterVaccination}
                            setRecord={setEncounterVaccination}
                            disabled={isEncounterStatusClosed || disabled}
                        />
                        <MyInput
                            width={230}
                            column
                            fieldLabel="External Facility"
                            fieldType="checkbox"
                            fieldName="isHas"
                            record={hasExternalFacility}
                            setRecord={setHasExternalFacility}
                            disabled={isEncounterStatusClosed || disabled}
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
                                disabled={isEncounterStatusClosed || disabled}
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

                        <Input as="textarea"
                            disabled={true}
                            onChange={(e) => setPossibleDescription} value={possibleDescription || encounterVaccination.administrationReactions}
                            style={{ width: 300, marginTop: '26px' }} rows={4} />

                    </Form>
                    <br />
                    <IconButton
                        color="violet"
                        appearance="primary"
                        onClick={() => handleSaveEncounterVaccine()}

                        disabled={encounterVaccination.statusLkey === '3196709905099521' || isEncounterStatusClosed || disabled || patientSlice.encounter.key != encounterVaccination.encounterKey}
                        icon={<CheckIcon />}
                    >
                        <Translate>Save</Translate>
                    </IconButton>
                    <Button
                        color="cyan"
                        appearance="primary"
                        style={{ marginLeft: "5px" }}
                        onClick={handleClearField}
                    >

                        <FontAwesomeIcon icon={faBroom} style={{ marginRight: '5px' }} />
                        <span>Clear</span>
                    </Button>

                </div>
            </Panel>

            <Panel header="Patient’s Vaccines " collapsible bordered>
                <div>
                    <IconButton
                        color="cyan"
                        appearance="primary"
                        onClick={() => { setPopupCancelOpen(true) }}
                        icon={<CloseOutlineIcon />}
                        disabled={encounterVaccination.key === undefined || encounterVaccination.statusLkey === '3196709905099521' || isEncounterStatusClosed || disabled || patientSlice.encounter.key != encounterVaccination.encounterKey}

                    >
                        <Translate>Cancel</Translate>
                    </IconButton>
                    <IconButton
                        color="cyan"
                        appearance="primary"
                        onClick={handleReviewe}
                        style={{ marginLeft: '4px' }}
                        icon={<CheckOutlineIcon />}
                        disabled={encounterVaccination.key === undefined || encounterVaccination.statusLkey === '3721622082897301' || encounterVaccination.statusLkey === '3196709905099521' || encounterVaccination.key != undefined ? patientSlice.encounter.key != encounterVaccination.key : false || isEncounterStatusClosed || disabled || patientSlice.encounter.key != encounterVaccination.encounterKey}
                    >
                        <Translate>Review</Translate>
                    </IconButton>

                    <Checkbox
                        onChange={(value, checked) => {
                            if (checked) {
                                setEncounterStatus('3196709905099521');
                            }
                            else {
                                setEncounterStatus('');

                            }
                        }}
                    >
                        Show Cancelled
                    </Checkbox>
                    <Checkbox
                        onChange={(value, checked) => {
                            if (checked) {
                                setAllDate(true);
                            }
                            else {
                                setAllDate(false);

                            }
                        }}
                    >
                        Show All Vaccines
                    </Checkbox>
                </div>
                <Table
                    height={600}
                    data={encounterVaccineListResponseLoading?.object ?? []}
                    rowKey="key"
                    expandedRowKeys={expandedRowKeys}
                    renderRowExpanded={renderRowExpanded}
                    shouldUpdateScroll={false}
                    bordered
                    cellBordered
                    onRowClick={rowData => {
                        setEncounterVaccination({
                            ...rowData
                        });
                        setVaccineBrand({ ...rowData.vaccineBrands });
                        setVaccineDose({ ...rowData.vaccineDose })
                        setVaccine({ ...rowData.vaccine })

                    }}
                    rowClassName={isSelected}
                >
                    <Column width={70} align="center">
                        <HeaderCell>#</HeaderCell>
                        <ExpandCell rowData={rowData => rowData} dataKey="key" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} />
                    </Column>

                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Vaccine Name</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.vaccine?.vaccineName
                            }
                        </Cell>
                    </Column >

                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Brand Name</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.vaccineBrands?.brandName
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Dose Number</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.vaccineDose?.doseNameLvalue
                                    ? rowData.vaccineDose?.doseNameLvalue.lovDisplayVale
                                    : rowData.vaccineDose?.doseNameLkey
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Date of Administration</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => {
                                if (!rowData.dateAdministered) return "  ";
                                const date = new Date(rowData.dateAdministered);
                                return date.toLocaleString("en-GB");
                            }}
                        </Cell>
                    </Column>
                    <Column flexGrow={3} fullText>
                        <HeaderCell align="center">
                            <Translate>Actual Side and Site of Administration</Translate>
                        </HeaderCell>
                        <Cell dataKey="actualSide" />
                    </Column>
                    <Column flexGrow={1} fullText>
                        <HeaderCell align="center">
                            <Translate>ROA</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData?.vaccine?.roaLvalue
                                    ? rowData?.vaccine?.roaLvalue?.lovDisplayVale
                                    : rowData?.vaccine?.roaLkey
                            }

                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Vaccination Location</Translate>
                        </HeaderCell>
                        <Cell dataKey="externalFacilityName" />
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Is Reviewed</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.reviewedAt === 0 ? "No" : "Yes"
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Total Vaccine Doses</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData?.vaccine?.numberOfDosesLvalue
                                    ? rowData?.vaccine?.numberOfDosesLvalue?.lovDisplayVale
                                    : rowData?.vaccine?.numberOfDosesLkey
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={1} fullText>
                        <HeaderCell align="center">
                            <Translate>Status</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData?.statusLvalue
                                    ? rowData?.statusLvalue?.lovDisplayVale
                                    : rowData?.statusLkey
                            }
                        </Cell>
                    </Column>
                </Table>

            </Panel>
            <Modal
                open={popupOpen}
                onClose={() => handleClear()}
                size="lg"
            >
                <Modal.Header>
                    <Modal.Title>View Vaccine</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form layout="inline" fluid>
                        <MyInput
                            width={200}
                            column
                            fieldLabel="Vaccine Code"
                            fieldName="vaccineCode"
                            record={vaccine}
                            setRecord={setVaccine}
                            disabled
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="Vaccine Name"
                            fieldName="vaccineName"
                            record={vaccine}
                            setRecord={setVaccine}
                            plachplder={"Medical Component"}
                            disabled
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="ATC Code"
                            fieldName="atcCode"
                            record={vaccine}
                            setRecord={setVaccine}
                            disabled
                        />
                        <MyInput
                            width={200}
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
                        <br />
                        <MyInput
                            width={200}
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
                            width={200}
                            column
                            fieldLabel="Site of Administration"
                            fieldName="siteOfAdministration"
                            record={vaccine}
                            setRecord={setVaccine}
                            disabled
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="Post Opening Duration"
                            fieldName="postOpeningDuration"
                            record={vaccine}
                            setRecord={setVaccine}
                            disabled
                        />
                        <MyInput
                            width={200}
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
                        <br />
                        <div style={{ display: "flex", alignItems: 'center', gap: '10px' }}>
                            <div>
                                <Text style={{ fontWeight: '800', fontSize: '16px' }}>Indications</Text>
                                <InputGroup inside style={{ width: '415px' }}>
                                    <Input
                                        disabled
                                        placeholder="Search ICD"
                                        value={searchKeyword}
                                        onChange={handleSearch}
                                    />
                                    <InputGroup.Button>
                                        <SearchIcon />
                                    </InputGroup.Button>
                                </InputGroup>

                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Input as="textarea"
                                disabled={true}
                                value={vaccine?.indications}
                                style={{ width: 415 }} rows={4} />

                            <Input as="textarea"
                                disabled={true}
                                value={vaccine?.possibleReactions}
                                style={{ width: 415 }} rows={4} /></div>


                        <MyInput width={415} column fieldType="textarea" disabled fieldName="contraindicationsAndPrecautions" record={vaccine}
                            setRecord={setVaccine} />

                        <MyInput width={415} column fieldType="textarea" disabled fieldName="storageAndHandling" record={vaccine}
                            setRecord={setVaccine} />
                    </Form>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',

                        width: 840
                    }}>

                    </div>
                    <br />
                    <Panel header="View Brand Products of Vaccine " collapsible bordered>


                        <Panel bordered>

                            <Grid fluid>
                                <Row gutter={15}>


                                    <Col xs={23}>

                                        <Grid fluid>

                                            <Row gutter={15} style={{ border: '1px solid #e1e1e1' }}>

                                                <Col xs={20}></Col>

                                            </Row>
                                            <Row gutter={18}>
                                                <Col xs={24}>
                                                    <Table
                                                        bordered

                                                        data={vaccine?.key ? vaccineBrandsListResponseLoading?.object ?? [] : []}
                                                    >
                                                        <Table.Column flexGrow={2}>
                                                            <Table.HeaderCell>Brand Name</Table.HeaderCell>
                                                            <Table.Cell dataKey="brandName" />
                                                        </Table.Column>
                                                        <Table.Column flexGrow={2}>

                                                            <Table.HeaderCell>Manufacturer</Table.HeaderCell>
                                                            <Table.Cell>

                                                                {rowData =>
                                                                    rowData?.manufacturerLvalue
                                                                        ? rowData?.manufacturerLvalue?.lovDisplayVale
                                                                        : rowData?.manufacturerLkey
                                                                }
                                                            </Table.Cell>
                                                        </Table.Column>
                                                        <Table.Column flexGrow={2}>
                                                            <Table.HeaderCell>Volume</Table.HeaderCell>
                                                            <Table.Cell>

                                                                {rowData => (
                                                                    <>
                                                                        {rowData?.volume}{" "}
                                                                        {rowData?.unitLvalue
                                                                            ? rowData?.unitLvalue?.lovDisplayVale
                                                                            : rowData?.unitLkey}
                                                                    </>
                                                                )}
                                                            </Table.Cell>
                                                        </Table.Column>
                                                        <Table.Column flexGrow={4}>
                                                            <Table.HeaderCell>Marketing Authorization Holder</Table.HeaderCell>
                                                            <Table.Cell dataKey="marketingAuthorizationHolder" >

                                                            </Table.Cell>
                                                        </Table.Column>
                                                        <Table.Column flexGrow={2}>
                                                            <Table.HeaderCell>Status</Table.HeaderCell>
                                                            <Cell dataKey="isValid">
                                                                {rowData => (rowData?.isValid ? 'Valid' : 'InValid')}
                                                            </Cell>
                                                        </Table.Column>

                                                    </Table>
                                                </Col>
                                            </Row>
                                        </Grid>
                                    </Col>
                                </Row>
                            </Grid>
                        </Panel>
                    </Panel>

                </Modal.Body>

                <Modal.Footer>
                    <Button onClick={handleClear} appearance="ghost" color='blue'>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal
                open={popupCancelOpen}
                onClose={() => handleClear()}
                size="sm"
            >
                <Modal.Header>
                    <Translate><h6>Confirm Cancel</h6></Translate>
                </Modal.Header>
                <Modal.Body>
                    <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                        <MyInput
                            width={600}

                            column
                            fieldLabel="Cancellation Reason"
                            fieldType="textarea"
                            fieldName="cancellationReason"
                            height={120}
                            record={encounterVaccination}
                            setRecord={setEncounterVaccination}
                            disabled={encounterVaccination?.deletedAt === 0}
                        />
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button appearance="primary" onClick={handleCancle} disabled={encounterVaccination?.deletedAt === 0} >
                        Cancel
                    </Button>
                    <Divider vertical />
                    <Button onClick={handleClear} appearance="ghost" color='blue'>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    </>);
};
export default VaccinationTab;


