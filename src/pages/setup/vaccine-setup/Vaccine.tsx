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
} from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
const { Column, HeaderCell, Cell } = Table;
import { MdSave } from 'react-icons/md';
import {
    useGetIcdListQuery,
} from '@/services/setupService';
import { useAppDispatch } from '@/hooks';

import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { notify } from '@/utils/uiReducerActions';
import {  ApVaccine, ApVaccineBrands } from '@/types/model-types';
import {  newApVaccine, newApVaccineBrands } from '@/types/model-types-constructor';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, fromCamelCaseToDBName } from '@/utils';
import {
    useSaveVaccineMutation,
    useGetLovValuesByCodeQuery,
    useGetVaccineListQuery,
    useRemoveVaccineMutation,
    useDeactiveActivVaccineMutation,
    useSaveVaccineBrandMutation,
    useGetVaccineBrandsListQuery, useDeactiveActivVaccineBrandsMutation
} from '@/services/setupService';
import ReloadIcon from '@rsuite/icons/Reload';
const Vaccine = () => {

    const [vaccine, setVaccine] = useState<ApVaccine>({ ...newApVaccine });
    const [vaccineBrand, setVaccineBrand] = useState<ApVaccineBrands>({ ...newApVaccineBrands });
    const [popupOpen, setPopupOpen] = useState(false);
    const [editBrand, setEditBrand] = useState(false);
    const [possibleDescription, setPossibleDescription] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [indicationsIcd, setIndicationsIcd] = useState({ indications: null });
    const [indicationsDescription, setindicationsDescription] = useState<string>('');
    const [saveVaccine, saveVaccineMutation] = useSaveVaccineMutation();
    const [saveVaccineBrand, saveVaccineBrandMutation] = useSaveVaccineBrandMutation();
    const [removeVaccine, removeVaccineMutation] = useRemoveVaccineMutation();
    const [deactiveVaccine, deactiveVaccineMutation] = useDeactiveActivVaccineMutation();
    const [deactiveVaccineBrand, deactiveVaccineBrandMutation] = useDeactiveActivVaccineBrandsMutation();
    const dispatch = useAppDispatch();
    const [edit_new, setEdit_new] = useState(false);

    //LOV
    const { data: typeLovQueryResponse } = useGetLovValuesByCodeQuery('VACCIN_TYP');
    const { data: rOALovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
    const { data: medAdversLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');
    const { data: manufacturerLovQueryResponse } = useGetLovValuesByCodeQuery('GEN_MED_MANUFACTUR');
    const { data: volumUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');

   


    const handleClear = () => {
        setPopupOpen(false);
        setVaccine(newApVaccine);
        setVaccineBrand(newApVaccineBrands);
        setEditBrand(false);
        setindicationsDescription('');
        setPossibleDescription('');
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
            setVaccineBrand({...newApVaccineBrands,brandName:'',});
            dispatch(notify('Vaccine Brand Added Successfully'));
            refetchVaccineDrand();
            setVaccineBrand({...newApVaccineBrands, vaccineKey:vaccine.key,
                brandName:'',
                manufacturerLkey:null,
                volume:0,
                unitLkey:null,
                marketingAuthorizationHolder:''});
            setEdit_new(false);
        });
    };

    useEffect(() => {
        if (saveVaccineMutation && saveVaccineMutation.status === 'fulfilled') {
            setVaccine(saveVaccineMutation.data);
            refetch();
        }
    }, [saveVaccineMutation]);

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

    const handleDelete = () => {
        removeVaccine(vaccine).unwrap().then(() => {
            setVaccine(newApVaccine);
            dispatch(notify('Vaccine Deleted Successfully'));
            refetch();
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
                    disabled={!vaccine.key}
                    appearance="primary"
                    color="blue"
                    icon={<TrashIcon />}
                    onClick={() => { handleDelete() }}
                >
                    Delete Selected
                </IconButton>

                <IconButton
                    disabled={!vaccine.isValid}
                    appearance="ghost"
                    color="cyan"
                    icon={<TrashIcon />}
                    onClick={() => {
                        handleDeactive()
                    }}
                >
                    Deactivate Selected
                </IconButton>

                <IconButton
                    disabled={vaccine.isValid || vaccine.key === undefined}
                    appearance="ghost"
                    color="violet"
                    icon={<ReloadIcon />}
                    onClick={() => {
                        handleDeactive()
                    }}
                >
                    Activate
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
        </Panel>



    );
};

export default Vaccine;
