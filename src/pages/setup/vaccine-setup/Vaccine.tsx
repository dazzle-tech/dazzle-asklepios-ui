import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import {
    InputGroup,
    Form,
    Input,
    Panel,
    Text,
    Dropdown,
    Button,
    IconButton,
    Table,
    Modal,
    Divider,
    Pagination, ButtonToolbar,
    Grid,
    Row,
    Col,
    SelectPicker
} from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
const { Column, HeaderCell, Cell } = Table;
import { MdSave } from 'react-icons/md';
import MyLabel from '@/components/MyLabel';
import {
    useGetIcdListQuery,
} from '@/services/setupService';
import { useAppDispatch } from '@/hooks';


import WarningRoundIcon from '@rsuite/icons/WarningRound';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { notify } from '@/utils/uiReducerActions';
import { ApVaccine, ApVaccineBrands, ApVaccineDose, ApVaccineDosesInterval } from '@/types/model-types';
import { newApVaccine, newApVaccineBrands, newApVaccineDose, newApVaccineDosesInterval } from '@/types/model-types-constructor';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, fromCamelCaseToDBName } from '@/utils';
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
    useRemoveVaccineDoseIntervalMutation

} from '@/services/setupService';
import ReloadIcon from '@rsuite/icons/Reload';
const Vaccine = () => {

    const [vaccine, setVaccine] = useState<ApVaccine>({ ...newApVaccine });
    const [vaccineBrand, setVaccineBrand] = useState<ApVaccineBrands>({ ...newApVaccineBrands });
    const [vaccineDose, setVaccineDose] = useState<ApVaccineDose>({ ...newApVaccineDose });
    const [vaccineDoseInterval, setVaccineDoseInterval] = useState<ApVaccineDosesInterval>({ ...newApVaccineDosesInterval });
    const [popupOpen, setPopupOpen] = useState(false);
    const [dossPopupOpen, setDossPopupOpen] = useState(false);
    const [editBrand, setEditBrand] = useState(false);
    const [possibleDescription, setPossibleDescription] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [indicationsIcd, setIndicationsIcd] = useState({ indications: null });
    const [indicationsDescription, setindicationsDescription] = useState<string>('');
    const [saveVaccine, saveVaccineMutation] = useSaveVaccineMutation();
    const [saveVaccineBrand, saveVaccineBrandMutation] = useSaveVaccineBrandMutation();
    const [saveVaccineDosesInterval, saveVaccineDosesIntervalMutation] = useSaveVaccineDosesIntervalMutation();
    const [saveVaccineDose, saveVaccineDoseMutation] = useSaveVaccineDoseMutation();
    const [removeVaccine, removeVaccineMutation] = useRemoveVaccineMutation();
    const [removeVaccineDosesInterval, removeVaccineDosesIntervalMutation] = useRemoveVaccineDoseIntervalMutation();
    const [removeVaccineDose, removeVaccineDoseMutation] = useRemoveVaccineDoseMutation();
    const [deactiveVaccine, deactiveVaccineMutation] = useDeactiveActivVaccineMutation();
    const [deactiveVaccineBrand, deactiveVaccineBrandMutation] = useDeactiveActivVaccineBrandsMutation();
    const [numDisplayValue, setNumDisplayValue] = useState('');
    const dispatch = useAppDispatch();
    const [edit_new, setEdit_new] = useState(false);
    const [isSelect, setIsSelect] = useState(false);
    //LOV
    const { data: typeLovQueryResponse } = useGetLovValuesByCodeQuery('VACCIN_TYP');
    const { data: rOALovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
    const { data: medAdversLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');
    const { data: manufacturerLovQueryResponse } = useGetLovValuesByCodeQuery('GEN_MED_MANUFACTUR');
    const { data: volumUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
    const { data: numofDossLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
    const { data: ageUnitLovQueryResponse } = useGetLovValuesByCodeQuery('AGE_UNITS');
    ///
    const {
        data: fetchDoseNumbersListQueryResponce,
        error,
        isLoading,
        isFetching,
        isSuccess,
        refetch: refetchNumberDoses
    } = useGetDoseNumbersListQuery(
        { key: numDisplayValue },
        { skip: !numDisplayValue }
    );
    const selectedValue = numofDossLovQueryResponse?.object?.find(
        (item) => item.key === vaccine.numberOfDosesLkey

    );
    useEffect(() => {
        setNumDisplayValue(selectedValue?.lovDisplayVale || numDisplayValue);
    }, [selectedValue, vaccine]);


    const dosesNameList = (fetchDoseNumbersListQueryResponce?.apLovValues ?? []).map(item => ({
        value: item.key,
        label: item.lovDisplayVale,
    }));
    const handleClear = () => {
        setPopupOpen(false);
        setVaccine(newApVaccine);
        setVaccineBrand(newApVaccineBrands);
        setEditBrand(false);
        setindicationsDescription('');
        setPossibleDescription('');
        setDossPopupOpen(false);
    };
    const handleNew = () => {
        setEdit_new(true);

    };
    const handleEdit = () => {
        setEdit_new(true);
        setPopupOpen(true);

    };
    const handleSave = () => {
        saveVaccine({ ...vaccine, possibleReactions: possibleDescription, indications: indicationsDescription, isValid: true }).unwrap().then(() => {
            if (vaccine.key) {
                dispatch(notify('Vaccine Updated Successfully'));
            }
            else { dispatch(notify('Vaccine Added Successfully')); }

            refetch();
            setEdit_new(false);
            setEditBrand(true)
        });
    };
    const handleSaveVaccineBrand = () => {
        saveVaccineBrand({ ...vaccineBrand, vaccineKey: vaccine.key, valid: true }).unwrap().then(() => {
            setVaccineBrand({ ...newApVaccineBrands, brandName: '', });
            dispatch(notify('Vaccine Brand Added Successfully'));
            refetchVaccineDrand();
            setVaccineBrand({
                ...newApVaccineBrands, vaccineKey: vaccine.key,
                brandName: '',
                manufacturerLkey: null,
                volume: 0,
                unitLkey: null,
                marketingAuthorizationHolder: ''
            });
            setEdit_new(false);
        });
    };
    const handleSaveVaccineDoses = async () => {

        await saveVaccineDose({ ...vaccineDose, vaccineKey: vaccine.key }).unwrap();
        saveVaccine({ ...vaccine });
        dispatch(notify('Vaccine Dose Added Successfully'));

        refetchVaccineDoses();
        setVaccineDose({
            ...newApVaccineDose, vaccineKey: vaccine.key,
            fromAge: 0,
            toAge: 0,
            doseNameLkey: null,
            fromAgeUnitLkey: null,
            toAgeUnitLkey: null,
        });

    };

    const handleSaveVaccineDosesInterval = async () => {

        await saveVaccineDosesInterval({ ...vaccineDoseInterval, vaccineKey: vaccine.key }).unwrap();
        dispatch(notify('Vaccine Doses Interval Added Successfully'));
        refetchVaccineDosesInterval();
        setVaccineDoseInterval({
            ...newApVaccineDosesInterval, vaccineKey: vaccine.key,
            intervalBetweenDoses: 0,
            fromDoseKey: null,
            toDoseKey: null,
            unitLkey: null,
        });

    };

    const isSelected = rowData => {
        if (rowData && vaccine && vaccine.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };

    const handleFilterChange = (fieldName, value) => {
        if (value) {
            setListRequest(
                addFilterToListRequest(
                    fromCamelCaseToDBName(fieldName),
                    'startsWithIgnoreCase',
                    value,
                    listRequest
                )
            );
        } else {
            setListRequest({ ...listRequest, filters: [] });
        }
    };

    const isSelectedBrand = rowData => {
        if (rowData && vaccineBrand && vaccineBrand.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    const isSelectedDose = rowData => {
        if (rowData && vaccineDose && vaccineDose.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    const isSelectedDoseInterval = rowData => {
        if (rowData && vaccineDoseInterval && vaccineDoseInterval.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    const handleDeactive = () => {

        deactiveVaccine(vaccine).unwrap().then(() => {
            refetch();
            if (vaccine.isValid) { dispatch(notify('Vaccine Deactived Successfully')); }
            else { dispatch(notify('Vaccine Activated Successfully')); }
            setVaccine(newApVaccine);
        })
    };
    const handleDeactiveBrand = () => {

        deactiveVaccineBrand(vaccineBrand).unwrap().then(() => {
            refetchVaccineDrand();
            if (vaccineBrand.isValid) { dispatch(notify('Vaccine Brand Deactived Successfully')); }
            else { dispatch(notify('Vaccine Brand Activated Successfully')); }
            refetchVaccineDrand();

            setVaccineBrand(newApVaccineBrands);
        })
    };

    const handleDeleteVaccineDose = () => {
        removeVaccineDose(vaccineDose).unwrap().then(() => {
            setVaccineDose(newApVaccineDose);
            dispatch(notify('Vaccine Dose Deleted Successfully'));
            refetchVaccineDoses();
            setVaccineDose({
                ...newApVaccineDose, vaccineKey: vaccine.key,
                fromAge: 0,
                toAge: 0,
                doseNameLkey: null,
                fromAgeUnitLkey: null,
                toAgeUnitLkey: null,
            });
        })
    };
    const handleDeleteVaccineDosesInterval = () => {
        removeVaccineDosesInterval(vaccineDoseInterval).unwrap().then(() => {
            setVaccineDoseInterval(newApVaccineDosesInterval);
            dispatch(notify('Vaccine Doses Interval Deleted Successfully'));
            refetchVaccineDosesInterval();
            setVaccineDoseInterval({
                ...newApVaccineDosesInterval, vaccineKey: vaccine.key,
                intervalBetweenDoses: 0,
                fromDoseKey: null,
                toDoseKey: null,
                unitLkey: null,
            });
        })
    };
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
    const [listRequest, setListRequest] = useState<ListRequest>({
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
                value: undefined,
            },
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
                value: undefined,
            },
        ],
    });
    useEffect(() => {
        if (saveVaccineMutation && saveVaccineMutation.status === 'fulfilled') {
            setVaccine(saveVaccineMutation.data);
            refetch();
        }
    }, [saveVaccineMutation]);

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
    const { data: vaccineDosesIntervalListResponseLoading, refetch: refetchVaccineDosesInterval } = useGetVaccineDosesIntervalListQuery(vaccineDosesIntevalListRequest);
    const { data: vaccineDosesListResponseLoading, refetch: refetchVaccineDoses } = useGetVaccineDosesListQuery(vaccineDosesListRequest);
    const { data: vaccineBrandsListResponseLoading, refetch: refetchVaccineDrand } = useGetVaccineBrandsListQuery(vaccineBrandsListRequest);
    const { data: vaccineListResponseLoading, refetch } = useGetVaccineListQuery(listRequest);
    const { data: icdListResponseLoading } = useGetIcdListQuery(icdListRequest);
    const handleSearch = value => {
        setSearchKeyword(value);
    };
    useEffect(() => {
        if (searchKeyword.trim() !== "") {
            setIcdListRequest(
                {
                    ...initialListRequest,
                    filterLogic: 'or',
                    filters: [
                        {
                            fieldName: 'icd_code',
                            operator: 'containsIgnoreCase',
                            value: searchKeyword
                        },
                        {
                            fieldName: 'description',
                            operator: 'containsIgnoreCase',
                            value: searchKeyword
                        }

                    ]
                }
            );
        }
    }, [searchKeyword]);
    const dosesList = (vaccineDosesListResponseLoading?.object ?? []).map(item => ({
        value: item.key,
        label: item.doseNameLvalue.lovDisplayVale,
    }));
    const modifiedData = (icdListResponseLoading?.object ?? []).map(item => ({
        ...item,
        combinedLabel: `${item.icdCode} - ${item.description}`,
    }));
    useEffect(() => {
        if (indicationsIcd.indications != null) {

            setindicationsDescription(prevadminInstructions => {
                const currentIcd = icdListResponseLoading?.object?.find(
                    item => item.key === indicationsIcd.indications
                );

                if (!currentIcd) return prevadminInstructions;

                const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;

                return prevadminInstructions
                    ? `${prevadminInstructions}\n${newEntry}`
                    : newEntry;
            });
        }
    }, [indicationsIcd.indications]);
    useEffect(() => {
        if (vaccine.possibleReactions != null) {
            const foundItem = medAdversLovQueryResponse?.object?.find(
                item => item.key === vaccine.possibleReactions
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
    }, [vaccine.possibleReactions]);



    return (

        <Panel
            header={
                <h3 className="title">
                    <Translate>Vaccine</Translate>
                </h3>
            }
        >
            <ButtonToolbar>
                <IconButton appearance="primary" color="violet" icon={<AddOutlineIcon />} onClick={() => { setPopupOpen(true), setVaccine({ ...newApVaccine }), setEdit_new(true) }}>
                    Add New
                </IconButton>
                <IconButton
                    disabled={!vaccine.key}
                    appearance="primary"
                    onClick={() => handleEdit()}
                    color="cyan"
                    icon={<EditIcon />}
                >
                    Edit Selected
                </IconButton>
                
                <IconButton
                    disabled={ vaccine.key === undefined}
                    appearance="ghost"
                    color="violet"
                    icon={<ReloadIcon />}
                    onClick={() => {
                        handleDeactive()
                    }}
                >
                    Activate / Deactivate 
                </IconButton>

                
                <IconButton
                    disabled={!vaccine.key}
                    appearance="ghost"
                    color="blue"
                    icon={<ExpandOutlineIcon />}
                    onClick={() => { setDossPopupOpen(true) }}
                >
                    Does Schedule
                </IconButton>
            </ButtonToolbar>
            <hr />
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
                data={vaccineListResponseLoading?.object ?? []}
                onRowClick={rowData => {
                    setVaccine(rowData);
                    setIsSelect(rowData?.numberOfDosesLkey ? true : false)
                }}
                rowClassName={isSelected}
            >

                <Column sortable flexGrow={2}>
                    <HeaderCell>
                        <Input onChange={e => handleFilterChange('vaccineName', e)} />
                        <Translate>Vaccine Name</Translate>
                    </HeaderCell>
                    <Cell dataKey="vaccineName" />
                </Column>

                <Column sortable flexGrow={2} >
                    <HeaderCell>
                        <Input onChange={e => handleFilterChange('vaccineCode', e)} />
                        <Translate>Code</Translate>
                    </HeaderCell>
                    <Cell dataKey="vaccineCode" />
                </Column>
                <Column sortable flexGrow={2}>
                    <HeaderCell>
                        <Input onChange={e => handleFilterChange('typeLkey', e)} />
                        <Translate>Type</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData.typeLvalue
                                ? rowData.typeLvalue.lovDisplayVale
                                : rowData.typeLkey
                        }
                    </Cell>
                </Column>
                <Column sortable flexGrow={2}>
                    <HeaderCell>
                        <Input onChange={e => {
                            handleFilterChange('atcCode', e);

                        }} />

                        <Translate>ATC code</Translate>
                    </HeaderCell>
                    <Cell dataKey="atcCode" />
                </Column>
                <Column sortable flexGrow={2}>
                    <HeaderCell>
                        <Input onChange={e => handleFilterChange('numberOfDosesLkey', e)} />
                        <Translate>Doses Number</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData?.numberOfDosesLvalue
                                ? rowData.numberOfDosesLvalue.lovDisplayVale
                                : rowData.numberOfDosesLkey
                        }
                    </Cell>
                </Column>
                <Column sortable flexGrow={2}>
                    <HeaderCell>
                        <Input onChange={e => {
                            handleFilterChange('isValid', e);

                        }} />

                        <Translate>Status</Translate>
                    </HeaderCell>
                    <Cell>{rowData => rowData.isValid ? "Valid" : "InValid"}</Cell>
                </Column>
            </Table>

            <div style={{ padding: 20 }}>
                <Pagination
                    prev
                    next
                    first
                    last
                    ellipsis
                    boundaryLinks
                    maxButtons={5}
                    size="xs"
                    layout={['limit', '|', 'pager']}
                    limitOptions={[5, 15, 30]}
                    limit={listRequest.pageSize}
                    activePage={listRequest.pageNumber}
                    onChangePage={pageNumber => {
                        setListRequest({ ...listRequest, pageNumber });
                    }}
                    onChangeLimit={pageSize => {
                        setListRequest({ ...listRequest, pageSize });
                    }}
                    total={vaccineListResponseLoading?.extraNumeric ?? 0}
                />
            </div>


            <Modal
                open={popupOpen}
                onClose={() => handleClear()}
                size="lg"
            >
                <Modal.Header>
                    <Modal.Title>New/Edit Vaccine</Modal.Title>
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
                            disabled={!edit_new}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="Vaccine Name"
                            fieldName="vaccineName"
                            record={vaccine}
                            setRecord={setVaccine}
                            plachplder={"Medical Component"}
                            disabled={!edit_new}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="ATC Code"
                            fieldName="atcCode"
                            record={vaccine}
                            setRecord={setVaccine}
                            disabled={!edit_new}
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
                            disabled={!edit_new}
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
                            disabled={!edit_new}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="Site of Administration"
                            fieldName="siteOfAdministration"
                            record={vaccine}
                            setRecord={setVaccine}
                            disabled={!edit_new}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="Post Opening Duration"
                            fieldName="postOpeningDuration"
                            record={vaccine}
                            setRecord={setVaccine}
                            disabled={!edit_new}
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
                            disabled={!edit_new}
                        />
                        <br />
                        <div style={{ display: "flex", alignItems: 'center', gap: '10px' }}>
                            <div>
                                <Text style={{ fontWeight: '800', fontSize: '16px' }}>Indications</Text>
                                <InputGroup inside style={{ width: '415px' }}>
                                    <Input
                                        disabled={!edit_new}
                                        placeholder="Search ICD"
                                        value={searchKeyword}
                                        onChange={handleSearch}
                                    />
                                    <InputGroup.Button>
                                        <SearchIcon />
                                    </InputGroup.Button>
                                </InputGroup>
                                {searchKeyword && (
                                    <Dropdown.Menu disabled={!edit_new} className="dropdown-menuresult">
                                        {modifiedData?.map(mod => (
                                            <Dropdown.Item
                                                key={mod.key}
                                                eventKey={mod.key}
                                                onClick={() => {
                                                    setIndicationsIcd({
                                                        ...indicationsIcd,
                                                        indications: mod.key
                                                    })
                                                    setSearchKeyword("");
                                                }}
                                            >
                                                <span style={{ marginRight: "19px" }}>{mod.icdCode}</span>
                                                <span>{mod.description}</span>
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                )}
                            </div>

                            <MyInput
                                width={415}
                                column
                                fieldLabel="Possible Reactions"
                                fieldType="select"
                                fieldName={'possibleReactions'}
                                selectData={medAdversLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={vaccine}
                                setRecord={setVaccine}
                                disabled={!edit_new}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Input as="textarea"
                                disabled={true}
                                onChange={(e) => setindicationsDescription} value={indicationsDescription || vaccine.indications}
                                style={{ width: 415 }} rows={4} />

                            <Input as="textarea"
                                disabled={true}
                                onChange={(e) => setPossibleDescription} value={possibleDescription || vaccine.possibleReactions}
                                style={{ width: 415 }} rows={4} /></div>


                        <MyInput width={415} column fieldType="textarea" disabled={!edit_new} fieldName="contraindicationsAndPrecautions" record={vaccine}
                            setRecord={setVaccine} />

                        <MyInput width={415} column fieldType="textarea" disabled={!edit_new} fieldName="storageAndHandling" record={vaccine}
                            setRecord={setVaccine} />
                    </Form>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',

                        width: 840
                    }}> <div><Button color='blue' onClick={() => handleClear()} appearance="ghost" >
                        Cancel
                    </Button></div>
                        <Divider vertical />
                        <div> <Button
                            onClick={() => {
                                handleSave();
                            }}
                            appearance="primary"
                            color='violet'
                        >
                            Save
                        </Button></div>
                        <br />
                    </div>
                    <br />
                    <Panel header="Add Brand Products of Vaccine " collapsible bordered>
                        <div>
                            <Form layout="inline" fluid>

                                <MyInput
                                    required
                                    width={150}
                                    column
                                    fieldLabel="Brand Name"
                                    fieldName="brandName"
                                    record={vaccineBrand}
                                    setRecord={setVaccineBrand}
                                    disabled={!editBrand && !vaccine.key}
                                />
                                <MyInput
                                    required
                                    width={150}
                                    column
                                    fieldLabel="Manufacturer"
                                    fieldType="select"
                                    fieldName="manufacturerLkey"
                                    selectData={manufacturerLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    record={vaccineBrand}
                                    setRecord={setVaccineBrand}
                                    disabled={!editBrand && !vaccine.key}
                                />
                                <MyInput
                                    required
                                    width={210}
                                    column
                                    fieldType="number"
                                    fieldLabel="Volume"
                                    fieldName="volume"
                                    record={vaccineBrand}
                                    setRecord={setVaccineBrand}
                                    disabled={!editBrand && !vaccine.key}
                                />
                                <MyInput
                                    required
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
                                    disabled={!editBrand && !vaccine.key}

                                />
                                <MyInput
                                    width={200}
                                    column
                                    fieldLabel="Marketing Authorization Holder"
                                    fieldName="marketingAuthorizationHolder"
                                    record={vaccineBrand}
                                    setRecord={setVaccineBrand}
                                    disabled={!editBrand && !vaccine.key}

                                />

                            </Form>
                        </div>

                        <Panel bordered>

                            <Grid fluid>
                                <Row gutter={15}>


                                    <Col xs={23}>

                                        <Grid fluid>

                                            <Row gutter={15} style={{ border: '1px solid #e1e1e1' }}>

                                                <Col xs={20}></Col>
                                                <Col >
                                                    <ButtonToolbar zoom={.8} style={{ padding: '6px', display: 'flex' }}>
                                                        <IconButton
                                                            size="xs"
                                                            disabled={vaccineBrand.brandName === '' || vaccineBrand.manufacturerLkey === undefined || vaccineBrand.volume === 0 || vaccineBrand.unitLkey === undefined}
                                                            onClick={handleSaveVaccineBrand}
                                                            appearance="primary"
                                                            color="violet"
                                                            icon={<MdSave />}
                                                        >

                                                        </IconButton>

                                                        <IconButton
                                                            disabled={!vaccineBrand.key}
                                                            size="xs"
                                                            appearance="primary"
                                                            onClick={handleDeactiveBrand}
                                                            color="blue"
                                                            icon={<TrashIcon />}
                                                        >

                                                        </IconButton>



                                                    </ButtonToolbar>
                                                </Col>
                                            </Row>
                                            <Row gutter={18}>
                                                <Col xs={24}>
                                                    <Table
                                                        bordered
                                                        onRowClick={rowData => {

                                                            setVaccineBrand(rowData)
                                                        }}
                                                        rowClassName={isSelectedBrand}
                                                        data={vaccine.key ? vaccineBrandsListResponseLoading?.object ?? [] : []}
                                                    >
                                                        <Table.Column flexGrow={2}>
                                                            <Table.HeaderCell>Brand Name</Table.HeaderCell>
                                                            <Table.Cell dataKey="brandName" />
                                                        </Table.Column>
                                                        <Table.Column flexGrow={2}>

                                                            <Table.HeaderCell>Manufacturer</Table.HeaderCell>
                                                            <Table.Cell>

                                                                {rowData =>
                                                                    rowData.manufacturerLvalue
                                                                        ? rowData.manufacturerLvalue.lovDisplayVale
                                                                        : rowData.manufacturerLkey
                                                                }
                                                            </Table.Cell>
                                                        </Table.Column>
                                                        <Table.Column flexGrow={2}>
                                                            <Table.HeaderCell>Volume</Table.HeaderCell>
                                                            <Table.Cell>

                                                                {rowData => (
                                                                    <>
                                                                        {rowData.volume}{" "}
                                                                        {rowData.unitLvalue
                                                                            ? rowData.unitLvalue.lovDisplayVale
                                                                            : rowData.unitLkey}
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
                                                                {rowData => (rowData.isValid ? 'Valid' : 'InValid')}
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
            {/**/}
            <Modal
                open={dossPopupOpen}
                onClose={() => handleClear()}
                size="lg"
            >
                <Modal.Header>
                    <Modal.Title>New/Edit Vaccine</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form layout="inline" fluid >
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
                            fieldType="select"
                            fieldLabel="Number of Doses"
                            selectData={numofDossLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName="numberOfDosesLkey"
                            record={vaccine}
                            disabled={vaccine.numberOfDosesLkey && isSelect}
                            setRecord={(newRecord) => {
                                setVaccine(newRecord);
                                const selectedValue = numofDossLovQueryResponse?.object?.find(
                                    (item) => item.key === newRecord.numberOfDosesLkey
                                );
                                setNumDisplayValue(selectedValue?.lovDisplayVale || "");
                            }}
                        />

                        <br />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px' }}>
                                <div><span style={{ color: 'red', marginLeft: 2 }}>*</span>  <MyLabel label="Dose Name" /></div>
                                <SelectPicker
                                    data={dosesNameList}
                                    value={vaccineDose.doseNameLkey === null ? ' ' : dosesNameList.key}
                                    disabled={!vaccine.numberOfDosesLkey}
                                    onChange={(value) => {
                                        const selectedItem = dosesNameList.find((item) => item.value === value);
                                        setVaccineDose({ ...vaccineDose, doseNameLkey: value });
                                    }}
                                    style={{ width: 165 }}
                                    placeholder="Select "
                                    labelKey="label"
                                    valueKey="value"

                                />
                            </div>

                            <MyInput
                                required
                                width={150}
                                column
                                fieldLabel="Age"
                                fieldType="number"
                                fieldName="fromAge"
                                record={vaccineDose}
                                setRecord={setVaccineDose}
                            />
                            <MyInput
                                required
                                width={150}
                                column
                                fieldType="select"
                                fieldLabel="Age Unit"
                                selectData={ageUnitLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                fieldName="fromAgeUnitLkey"
                                record={vaccineDose}
                                setRecord={setVaccineDose}
                            />
                            <MyInput
                                width={150}
                                column
                                fieldLabel="Age Untill"
                                fieldType="number"
                                fieldName="toAge"
                                record={vaccineDose}
                                setRecord={setVaccineDose}
                            />
                            <MyInput
                                width={150}
                                column
                                fieldType="select"
                                fieldLabel="Age Unit"
                                selectData={ageUnitLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                fieldName="toAgeUnitLkey"
                                record={vaccineDose}
                                setRecord={setVaccineDose}
                            />
                        </div>

                        <br />
                        <Panel bordered>

                            <Grid fluid>
                                <Row gutter={15}>


                                    <Col xs={23}>

                                        <Grid fluid>

                                            <Row gutter={15} style={{ border: '1px solid #e1e1e1' }}>
                                                <Col xs={5}><MyInput
                                                    fieldType="checkbox"
                                                    fieldName="isBooster"
                                                    fieldLabel="Is Booster"
                                                    record={vaccineDose}
                                                    setRecord={setVaccineDose}

                                                /></Col>

                                                <Col xs={15}></Col>
                                                <Col >
                                                    <ButtonToolbar zoom={.8} style={{ padding: '6px', display: 'flex' }}>

                                                        <IconButton
                                                            disabled={vaccineDose.doseNameLkey === undefined || vaccineDose.fromAge === 0 || vaccineDose.fromAgeUnitLkey === undefined}
                                                            size="xs"
                                                            onClick={handleSaveVaccineDoses}
                                                            appearance="primary"
                                                            color="violet"
                                                            icon={<MdSave />}
                                                        >

                                                        </IconButton>
                                                        <IconButton
                                                            disabled={!vaccineDose.key}
                                                            size="xs"
                                                            appearance="primary"
                                                            onClick={handleDeleteVaccineDose}
                                                            color="blue"
                                                            icon={<TrashIcon />}
                                                        >
                                                        </IconButton>
                                                    </ButtonToolbar>
                                                </Col>
                                            </Row>
                                            <Row gutter={18}>
                                                <Col xs={24}>
                                                    <Table
                                                        bordered
                                                        onRowClick={rowData => {
                                                            setVaccineDose(rowData)
                                                        }}
                                                        rowClassName={isSelectedDose}
                                                        data={vaccine.key ? vaccineDosesListResponseLoading?.object ?? [] : []}
                                                    >
                                                        <Table.Column flexGrow={2}>
                                                            <Table.HeaderCell>Dose Name</Table.HeaderCell>
                                                            <Table.Cell>

                                                                {rowData =>
                                                                    rowData.doseNameLvalue
                                                                        ? rowData.doseNameLvalue.lovDisplayVale
                                                                        : rowData.doseNameLkey
                                                                }
                                                            </Table.Cell>
                                                        </Table.Column>
                                                        <Table.Column flexGrow={2}>

                                                            <Table.HeaderCell>Age</Table.HeaderCell>
                                                            <Table.Cell>

                                                                {rowData =>
                                                                    rowData.fromAge === 0 ? ' ' : rowData.fromAge

                                                                }
                                                            </Table.Cell>
                                                        </Table.Column>
                                                        <Table.Column flexGrow={2}>
                                                            <Table.HeaderCell>Age Unit</Table.HeaderCell>
                                                            <Table.Cell>

                                                                {rowData =>
                                                                    rowData.fromAgeUnitLvalue
                                                                        ? rowData.fromAgeUnitLvalue.lovDisplayVale
                                                                        : rowData.fromAgeUnitLkey
                                                                }
                                                            </Table.Cell>
                                                        </Table.Column>
                                                        <Table.Column flexGrow={2}>
                                                            <Table.HeaderCell>Age Until</Table.HeaderCell>
                                                            <Table.Cell>

                                                                {rowData =>
                                                                    rowData.toAge === 0 ? ' ' : rowData.toAge

                                                                }
                                                            </Table.Cell>

                                                        </Table.Column>
                                                        <Table.Column flexGrow={2}>
                                                            <Table.HeaderCell>Age Until Unit</Table.HeaderCell>
                                                            <Table.Cell>{rowData =>
                                                                rowData.toAgeUnitLvalue
                                                                    ? rowData.toAgeUnitLvalue.lovDisplayVale
                                                                    : rowData.toAgeUnitLkey
                                                            }</Table.Cell>
                                                        </Table.Column>
                                                        <Table.Column flexGrow={2}>
                                                            <Table.HeaderCell>Is Boostert</Table.HeaderCell>
                                                            <Table.Cell>{rowData =>
                                                                rowData.isBooster
                                                                    ? "Yes"
                                                                    : "No"
                                                            }</Table.Cell>
                                                        </Table.Column>

                                                    </Table>
                                                </Col>
                                            </Row>
                                        </Grid>
                                    </Col>
                                </Row>
                            </Grid>
                            <Panel header="Interval Between Doses" collapsible bordered>
                                <div>
                                    <Form layout="inline" fluid style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                                        <MyInput
                                            width={170}
                                            required
                                            fieldType="number"
                                            column
                                            fieldLabel="Interval Between Doses"
                                            fieldName="intervalBetweenDoses"
                                            record={vaccineDoseInterval}
                                            setRecord={setVaccineDoseInterval}
                                        />
                                        <MyInput
                                            required
                                            width={170}
                                            column
                                            fieldType="select"
                                            fieldLabel="Unit"
                                            fieldName="unitLkey"
                                            selectData={unitLovQueryResponse?.object ?? []}
                                            selectDataLabel="lovDisplayVale"
                                            selectDataValue="key"
                                            record={vaccineDoseInterval}
                                            setRecord={setVaccineDoseInterval}

                                        />
                                        <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px' }}>
                                            <div><span style={{ color: 'red', marginLeft: 2 }}>*</span>  <MyLabel label="Between Dose" /></div>
                                            <SelectPicker
                                                data={dosesList}

                                                value={vaccineDoseInterval.fromDoseKey === null ? ' ' : dosesList.key}
                                                onChange={(value) => {
                                                    const selectedItem = dosesNameList.find((item) => item.value === value);
                                                    setVaccineDoseInterval({ ...vaccineDoseInterval, fromDoseKey: value });
                                                }}
                                                style={{ width: 180 }}
                                                placeholder="Select "
                                                labelKey="label"
                                                valueKey="value"

                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px' }}>
                                            <div><span style={{ color: 'red', marginLeft: 2 }}>*</span>  <MyLabel label="To Dose" /></div>
                                            <SelectPicker
                                                data={dosesList}

                                                value={vaccineDoseInterval.toDoseKey === null ? ' ' : dosesList.key}
                                                onChange={(value) => {
                                                    const selectedItem = dosesNameList.find((item) => item.value === value);
                                                    setVaccineDoseInterval({ ...vaccineDoseInterval, toDoseKey: value });
                                                }}
                                                style={{ width: 180 }}
                                                placeholder="Select "
                                                labelKey="label"
                                                valueKey="value"

                                            />
                                        </div>

                                    </Form>
                                </div>

                                <Panel bordered>

                                    <Grid fluid>
                                        <Row gutter={15}>


                                            <Col xs={23}>

                                                <Grid fluid>

                                                    <Row gutter={15} style={{ border: '1px solid #e1e1e1' }}>

                                                        <Col xs={20}></Col>
                                                        <Col >
                                                            <ButtonToolbar zoom={.8} style={{ padding: '6px', display: 'flex' }}>
                                                                <IconButton
                                                                    size="xs"
                                                                    disabled={vaccineDoseInterval.intervalBetweenDoses === 0 || vaccineDoseInterval.unitLkey === undefined || vaccineDoseInterval.fromDoseKey === undefined || vaccineDoseInterval.toDoseKey === undefined}
                                                                    onClick={handleSaveVaccineDosesInterval}
                                                                    appearance="primary"
                                                                    color="violet"
                                                                    icon={<MdSave />}
                                                                >

                                                                </IconButton>

                                                                <IconButton
                                                                    disabled={!vaccineDoseInterval.key}
                                                                    size="xs"
                                                                    appearance="primary"
                                                                    onClick={handleDeleteVaccineDosesInterval}
                                                                    color="blue"
                                                                    icon={<TrashIcon />}
                                                                >

                                                                </IconButton>



                                                            </ButtonToolbar>
                                                        </Col>
                                                    </Row>
                                                    <Row gutter={18}>
                                                        <Col xs={24}>
                                                            <Table
                                                                bordered
                                                                onRowClick={rowData => {

                                                                    setVaccineDoseInterval(rowData)
                                                                }}
                                                                rowClassName={isSelectedDoseInterval}
                                                                data={vaccine.key ? vaccineDosesIntervalListResponseLoading?.object ?? [] : []}
                                                            >
                                                                <Table.Column flexGrow={2}>
                                                                    <Table.HeaderCell>Interval Between Doses</Table.HeaderCell>
                                                                    <Table.Cell dataKey="intervalBetweenDoses" />
                                                                </Table.Column>
                                                                <Table.Column flexGrow={2}>

                                                                    <Table.HeaderCell>Unit</Table.HeaderCell>
                                                                    <Table.Cell>

                                                                        {rowData =>
                                                                            rowData.unitLvalue
                                                                                ? rowData.unitLvalue.lovDisplayVale
                                                                                : rowData.unitLkey
                                                                        }
                                                                    </Table.Cell>
                                                                </Table.Column>
                                                                <Table.Column flexGrow={2}>
                                                                    <Table.HeaderCell>Between Dose </Table.HeaderCell>
                                                                    <Table.Cell>

                                                                        {rowData =>
                                                                            rowData.fromDose.doseNameLvalue
                                                                                ? rowData.fromDose.doseNameLvalue.lovDisplayVale
                                                                                : rowData.doseNameLkey
                                                                        }
                                                                    </Table.Cell>
                                                                </Table.Column>
                                                                <Table.Column flexGrow={4}>
                                                                    <Table.HeaderCell>And Dose</Table.HeaderCell>
                                                                    <Table.Cell>

                                                                        {rowData =>
                                                                            rowData.toDose.doseNameLvalue
                                                                                ? rowData.toDose.doseNameLvalue.lovDisplayVale
                                                                                : rowData.doseNameLkey
                                                                        }
                                                                    </Table.Cell>
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
                        </Panel>
                    </Form>
                    <br />

                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleClear} appearance="ghost" color='blue'>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Panel>



    );
};

export default Vaccine;
