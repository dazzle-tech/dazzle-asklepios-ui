import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import {
    InputGroup,
    Form,
    Input,
    Panel,
    Text,
    Checkbox,
    Dropdown,
    Button,
    IconButton,
    Table,
    Modal,
    Stack,
    Divider,
    Radio,
    RadioGroup,
    TagInput,
    TagGroup,
    SelectPicker,
    Tag, Pagination, ButtonToolbar,
} from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
const { Column, HeaderCell, Cell } = Table;
import {
    useGetIcdListQuery,
} from '@/services/setupService';
import {
    useGetDepartmentsQuery,
    useGetFacilitiesQuery,
    useGetPractitionersQuery,
    useSavePractitionerMutation,
    useDeactiveActivePractitionerMutation,
    useRemovePractitionerMutation,
    useGetUserRecordQuery,
    useGetUsersQuery
} from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApPractitioner ,ApVaccine} from '@/types/model-types';
import { newApPractitioner,newApVaccine } from '@/types/model-types-constructor';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, fromCamelCaseToDBName } from '@/utils';
import {
    useGetLovValuesByCodeAndParentQuery,
    useGetLovValuesByCodeQuery
} from '@/services/setupService';
import ReloadIcon from '@rsuite/icons/Reload';

const Vaccine = () => {
    const [practitioner, setPractitioner] = useState<ApPractitioner>({ ...newApPractitioner });
    const [vaccine, setVaccine] = useState<ApVaccine>({ ...newApVaccine });
    const [popupOpen, setPopupOpen] = useState(false);
    const [newPrac, setnewPrac] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [indicationsIcd, setIndicationsIcd] = useState(null);
    const [facilityListRequest, setFacilityListRequest] = useState<ListRequest>({
        ...initialListRequest
    });
    const [departmentListRequest, setDepartmentListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: true
    });

    //LOV
    const { data: typeLovQueryResponse } = useGetLovValuesByCodeQuery('VACCIN_TYP');
    const { data: rOALovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
    const { data: medAdversLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');
    const [edit_new, setEdit_new] = useState(false);


    const [dactivePractitioner, dactivePractitionerMutation] = useDeactiveActivePractitionerMutation();
    const [removePractitioner, removePractitionerMutation] = useRemovePractitionerMutation();
    const { data: getOneUser } = useGetUserRecordQuery(
        { userId: practitioner.linkedUser },
        { skip: !practitioner.linkedUser }
    );
    const handleClear = () => {
        setPopupOpen(false);

    };
    useEffect(() => {
        if (getOneUser) {
            setPractitioner({
                ...practitioner,
                practitionerFullName: getOneUser.fullName,
                practitionerFirstName: getOneUser.firstName,
                practitionerLastName: getOneUser.lastName,
                practitionerEmail: getOneUser.email,
                genderLkey: getOneUser.sexAtBirthLkey,
                practitionerPhoneNumber: getOneUser.phoneNumber

            });
        }
    }, [getOneUser]);

    const handleNew = () => {
        setEdit_new(true);
        setnewPrac(true)
    };

    const handleEdit = () => {
        setEdit_new(true);
        setnewPrac(false)

    };



    useEffect(() => {
        if (practitioner.primaryFacilityKey) {
            setDepartmentListRequest(
                addFilterToListRequest('facility_key', 'match', practitioner.primaryFacilityKey, {
                    ...departmentListRequest,
                    ignore: false
                })
            );
        }
    }, [practitioner.primaryFacilityKey]);



    const isSelected = rowData => {
        if (rowData && practitioner && rowData.key === practitioner.key) {
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

    const handleDeactive = () => {
        console.log(practitioner)
        dactivePractitioner(practitioner).unwrap().then(() => {
            setPractitioner(newApPractitioner)
        })
    };

    const handleDelete = () => {
        removePractitioner(practitioner).unwrap().then(() => {
            setPractitioner(newApPractitioner)
        })
    };

    ///

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

    const { data: icdListResponseLoading } = useGetIcdListQuery(listRequest);
    const handleSearch = value => {
        setSearchKeyword(value);


    };
    useEffect(() => {
        if (searchKeyword.trim() !== "") {
            setListRequest(
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


    console.log("icdListResponseLoading---->", icdListResponseLoading)
    return (

        <Panel
            header={
                <h3 className="title">
                    <Translate>Vaccine</Translate>
                </h3>
            }
        >
            <ButtonToolbar>
                <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={() => { setPopupOpen(true) }}>
                    Add New
                </IconButton>
                <IconButton
                    disabled={!practitioner.key}
                    appearance="primary"
                    onClick={() => handleEdit()}
                    color="green"
                    icon={<EditIcon />}
                >
                    Edit Selected
                </IconButton>


                <IconButton
                    disabled={!practitioner.key}
                    appearance="primary"
                    color="red"
                    icon={<TrashIcon />}
                    onClick={() => { handleDelete() }}
                >
                    Delete Selected
                </IconButton>
                {
                    practitioner.isValid || practitioner.key == null ?
                        <IconButton
                            disabled={!practitioner.key}
                            appearance="primary"
                            color="orange"
                            icon={<TrashIcon />}
                            onClick={() => {
                                handleDeactive()
                            }}
                        >
                            Deactivate Selected
                        </IconButton>
                        :
                        <IconButton
                            disabled={!practitioner.key}
                            appearance="primary"
                            color="green"
                            icon={<ReloadIcon />}
                            onClick={() => {
                                handleDeactive()
                            }}
                        >
                            Activate
                        </IconButton>

                }


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
                data={[]}
                onRowClick={rowData => {
                    setPractitioner(rowData);


                }}
                rowClassName={isSelected}
            >

                <Column sortable flexGrow={4}>
                    <HeaderCell>
                        <Input onChange={e => handleFilterChange('practitionerFullName', e)} />
                        <Translate>Vaccine Name</Translate>
                    </HeaderCell>
                    <Cell dataKey="practitionerFullName" />
                </Column>

                <Column sortable flexGrow={4} >
                    <HeaderCell>
                        <Input onChange={e => handleFilterChange('linkedUser', e)} />
                        <Translate>Code</Translate>
                    </HeaderCell>
                    <Cell dataKey="specialty" />
                </Column>
                <Column sortable flexGrow={3}>
                    <HeaderCell>
                        <Input onChange={e => handleFilterChange('specialty', e)} />
                        <Translate>Type</Translate>
                    </HeaderCell>
                    <Cell dataKey="specialty" />
                </Column>
                <Column sortable flexGrow={2}>
                    <HeaderCell>
                        <Input onChange={e => {
                            handleFilterChange('isValid', e);
                            console.log(e)
                        }} />

                        <Translate>ATC code</Translate>
                    </HeaderCell>
                    <Cell dataKey="jobRole" />
                </Column>
                <Column sortable flexGrow={2}>
                    <HeaderCell>
                        <Input onChange={e => {
                            handleFilterChange('isValid', e);
                            console.log(e)
                        }} />

                        <Translate>Status</Translate>
                    </HeaderCell>
                    <Cell dataKey="jobRole" />
                </Column>
            </Table>

            {/* <div style={{ padding: 20 }}>
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
                    total={0}
                />
            </div> */}


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
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="Vaccine Name"
                            fieldName="vaccineName"
                            record={vaccine}
                            setRecord={setVaccine}
                            plachplder={"Medical Component"}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="ATC Code"
                            fieldName="atcCode"
                            record={vaccine}
                            setRecord={setVaccine}
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
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="Site of Administration"
                            fieldName="siteOfAdministration"
                            record={vaccine}
                            setRecord={setVaccine}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="Post Opening Duration"
                            fieldName="postOpeningDuration"
                            record={vaccine}
                            setRecord={setVaccine}
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
                        />
                        <br />
                        <div style={{display:"flex",alignItems:'center',gap:'10px'}}>
                        <div>
                            <Text style={{ fontWeight:'800' ,fontSize:'16px'}}>Indications</Text>
                            <InputGroup inside style={{ width: '415px' }}>
                                <Input
                                    placeholder="Search ICD"
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
                                                setVaccine({
                                                  ...vaccine
                                                })
                                                setIndicationsIcd(mod)
                                                setSearchKeyword("");}}
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
                            fieldName=""
                            selectData={medAdversLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={vaccine}
                            setRecord={setVaccine}
                        />
                        </div>
                       
                    
                    <MyInput width={415} column fieldType="textarea" fieldName="" record={""} setRecord={""} />
                    
                       <MyInput width={415} column fieldType="textarea" fieldName="" record={""} setRecord={""} />
                       <MyInput width={415} column fieldType="textarea" fieldName="contraindicationsAndPrecautions" record={vaccine}
                            setRecord={setVaccine} />
                    
                       <MyInput width={415} column fieldType="textarea" fieldName="storageAndHandling" record={vaccine}
                            setRecord={setVaccine} />
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => handleClear()} appearance="subtle">
                        Cancel
                    </Button>
                    <Divider vertical />
                    <Button
                        //   onClick={() => {
                        //     handleSaveSecondaryDocument();
                        //   }}
                        appearance="primary"
                    >
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>
        </Panel>



    );
};

export default Vaccine;
