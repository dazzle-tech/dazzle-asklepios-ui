import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table, Checkbox, TagPicker, List } from 'rsuite';
import CheckIcon from '@rsuite/icons/Check';
import CloseIcon from '@rsuite/icons/Close';
import PageIcon from '@rsuite/icons/Page';
import EventDetailIcon from '@rsuite/icons/EventDetail';
import SearchIcon from '@rsuite/icons/Search';
import {
    FlexboxGrid,
    Grid,
    Row,
    Col,
    Text,
    InputGroup,
    SelectPicker,
    DatePicker,
    Dropdown
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
    useGetFacilitiesQuery,
    useGetDepartmentsQuery,
    useSaveDepartmentMutation,
    useSaveDiagnosticsTestProfileMutation,
    useGetDiagnosticsTestProfileListQuery,
    useRemoveDiagnosticsTestProfileMutation,
    useGetDiagnosticsTestNormalRangeListQuery,
    useGetLovsQuery,
    useRemoveDiagnosticsTestNormalRangeMutation,
    useSaveDiagnosticsTestNormalRangeMutation
} from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { Form, Stack, Divider, PanelGroup } from 'rsuite';
import MyInput from '@/components/MyInput';
import { MdSave } from 'react-icons/md';
import { Plus, Trash } from '@rsuite/icons';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import {
    useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { ApDiagnosticTestNormalRange, ApDiagnosticTestProfile } from '@/types/model-types';
import { newApDiagnosticTestNormalRange, newApDiagnosticTestProfile } from '@/types/model-types-constructor';
import NormalRangeSetup from './NormalRangeSetup';
const ProfileSetup = ({ popUpOpen, setPopUpOpen, diagnosticsTest }) => {

    const [isActive, setIsActive] = useState(false);
    const [diagnosticsTestProfile, setDiagnosticsTestProfile] = useState<ApDiagnosticTestProfile>({ ...newApDiagnosticTestProfile });
    const [diagnosticTestNormalRange, setDiagnosticTestNormalRange] = useState<ApDiagnosticTestNormalRange>({
        ...newApDiagnosticTestNormalRange
    });
    const dispatch = useAppDispatch();
    const [listRequest, setListRequest] = useState({
        ...initialListRequest,
        pageSize: 100,
        filters: [
            {
                fieldName: 'diagnostic_test_key',
                operator: 'match',
                value: diagnosticsTest?.key || undefined || null
            },
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ]
    }
    );

    const [normalRangeListRequest, setNormalRangeListRequest] = useState({
        ...initialListRequest,
        pageSize: 100,
        filters: [
            {
                fieldName: 'test_key',
                operator: 'match',
                value: diagnosticsTest.key || undefined
            },
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            },
            {
                fieldName: 'is_profile',
                operator: 'match',
                value: true
            },
            {
                fieldName: 'profile_test_key',
                operator: 'match',
                value: diagnosticsTestProfile.key || undefined
            }
        ]
    }
    );
    const [listLovRequest, setListLovRequest] = useState({ ...initialListRequest });
    const [selectedLOVs, setSelectedLOVs] = useState([]);
    const [lovCode, setLovCode] = useState("");
    const [saveDiagnosticsTestProfile, saveDiagnosticsTestProfileMutation] = useSaveDiagnosticsTestProfileMutation();
    const [removeDiagnosticsTestProfile, removeDiagnosticsTestProfileMutation] = useRemoveDiagnosticsTestProfileMutation();
    const [saveDiagnosticsTestNormalRange, saveDiagnosticsTestNormalRangeMutation] = useSaveDiagnosticsTestNormalRangeMutation();
    const { data: lovListResponseData } = useGetLovsQuery(listLovRequest);
    const { data: diagnosticsTestProfileListResponse, refetch: refetchDiagnosticsTestProfile } = useGetDiagnosticsTestProfileListQuery(listRequest);
    const { data: normalRangeListResponse, refetch: refetchNormalRange } = useGetDiagnosticsTestNormalRangeListQuery(normalRangeListRequest);
    const [removeDiagnosticsTestNormalRange, removeDiagnosticsTestNormalRangeMutation] = useRemoveDiagnosticsTestNormalRangeMutation();
    const [searchKeyword, setSearchKeyword] = useState('');
    const { data: unitsLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
    const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const { data: ageunitsLovQueryResponse } = useGetLovValuesByCodeQuery('AGE_UNITS');
    const { data: conditionLovQueryResponse } = useGetLovValuesByCodeQuery('NORANGE_CONDITIONS');
    const { data: testResultTypeLovQueryResponse } = useGetLovValuesByCodeQuery('TEST_RESULT_TYPE');
    const { data: normalRangeLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_NORMRANGE_VALUE_TYPE');
    const { data: lovQueryResponse } = useGetLovValuesByCodeQuery(lovCode);
    const [showSelected, setShowSelected] = useState(true);
    const modifiedData = (lovListResponseData?.object ?? []).map(item => ({
        ...item,
        combinedLabel: `${item.lovCode} - ${item.lovName}`
    }));
    const isSelected = rowData => {
        if (rowData && diagnosticsTestProfile && rowData.key === diagnosticsTestProfile.key) {
            return 'selected-row';
        } else return '';
    };
    const handleNew = () => {
        setIsActive(true);
        setDiagnosticsTestProfile({
            ...newApDiagnosticTestProfile,
            resultUnitLkey: null
        });
    };

    const handleSave = () => {

        saveDiagnosticsTestProfile({
            ...diagnosticsTestProfile,
            diagnosticTestKey: diagnosticsTest.key,
            createdBy: 'Administrator'
        }).unwrap().then(() => refetchDiagnosticsTestProfile());
        dispatch(notify('Added Successfully '));

        setDiagnosticsTestProfile({
            ...newApDiagnosticTestProfile,
            diagnosticTestKey: diagnosticsTest.key,
            resultUnitLkey: null
        });


        setIsActive(false);
    };

    const handleCancel = () => {
        setPopUpOpen(false);
        setDiagnosticsTestProfile({
            ...newApDiagnosticTestProfile,
            resultUnitLkey: null
        });
    }

    const handleRemove = () => {
        removeDiagnosticsTestProfile({
            ...diagnosticsTestProfile,
            deletedBy: 'Administrator'
        }).unwrap().then(() => refetchDiagnosticsTestProfile());
        dispatch(notify('Deleted Successfully '));

    };

    const handleNewNormalRange = () => {
        setIsActive(true);
        setDiagnosticTestNormalRange({
            ...newApDiagnosticTestNormalRange,
            ageToUnitLkey: null,
            ageFromUnitLkey: null,
            normalRangeTypeLkey: null,
            resultLovKey: null

        });
    };


    const handleSaveNormalRange = async () => {
        try {
            await saveDiagnosticsTestNormalRange({ diagnosticTestNormalRange: { ...diagnosticTestNormalRange, testKey: diagnosticsTest.key, profileTestKey: diagnosticsTestProfile.key, isProfile: true }, lov: selectedLOVs }).unwrap();
            refetchNormalRange();
            setDiagnosticTestNormalRange({
                ...newApDiagnosticTestNormalRange,
                ageToUnitLkey: null,
                ageFromUnitLkey: null,
                normalRangeTypeLkey: null,
                resultLovKey: null
            })
            dispatch(notify('Normal Range Saved Successfully'));

        } catch (error) {
            console.error("Error saving Normal Range:", error);
        }
    };

    const handleRemoveNormalRange = () => {
        removeDiagnosticsTestNormalRange({
            ...diagnosticTestNormalRange,
            deletedBy: 'Administrator'
        }).unwrap().then(() => refetchNormalRange());
        setDiagnosticTestNormalRange({
            ...newApDiagnosticTestNormalRange,
            ageToUnitLkey: null,
            ageFromUnitLkey: null,
            normalRangeTypeLkey: null,
            resultLovKey: null
        })
        dispatch(notify('Deleted Successfully '));

    };
const handleSearch = value => {
        setSearchKeyword(value);


    };
         useEffect(() => {
             if (searchKeyword?.trim() !== "") {
                 setListLovRequest(
                     {
                         ...listLovRequest,
                         filterLogic: 'or',
                         filters: [
                             {
                                 fieldName: 'lov_code',
                                 operator: 'containsIgnoreCase',
                                 value: searchKeyword
                             },
                             {
                                 fieldName: 'lov_name',
                                 operator: 'containsIgnoreCase',
                                 value: searchKeyword
                             }
     
                         ]
                     }
                 );
             }
         }, [searchKeyword]);

    useEffect(() => {
        const updatedFilters = [
            {
                fieldName: 'diagnostic_test_key',
                operator: 'match',
                value: diagnosticsTest?.key || undefined
            },
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ];
        setListRequest((prevRequest) => ({
            ...prevRequest,
            filters: updatedFilters,
        }));

        const updatedFilters2 =[
            {
                fieldName: 'test_key',
                operator: 'match',
                value: diagnosticsTest.key || undefined
            },
            {
              fieldName: 'deleted_at',
              operator: 'isNull',
              value: undefined
            },{
                fieldName: 'profile_test_key',
                operator: 'match',
                value: diagnosticsTestProfile.key || undefined
            }
          ];

          setNormalRangeListRequest((prevRequest) => ({
            ...prevRequest,
            filters: updatedFilters2,
          }));

        setDiagnosticTestNormalRange(prevState => ({
              ...prevState,
              testKey: diagnosticsTest.key

            }));

        setLovCode(null);
    }, [diagnosticsTest.key]);

    useEffect(() => {
        const updatedFilters2 =[
            {
                fieldName: 'test_key',
                operator: 'match',
                value: diagnosticsTest.key || undefined
            },
            {
              fieldName: 'deleted_at',
              operator: 'isNull',
              value: undefined
            },{
                fieldName: 'profile_test_key',
                operator: 'match',
                value: diagnosticsTestProfile.key || undefined
            }
          ];

          setNormalRangeListRequest((prevRequest) => ({
            ...prevRequest,
            filters: updatedFilters2,
          }));

        setDiagnosticTestNormalRange(prevState => ({
              ...prevState,
              testKey: diagnosticsTest.key

            }));

        setLovCode(null);
    }, [diagnosticsTestProfile.key]);

    useEffect(() => {
        if (diagnosticTestNormalRange) {
            setSelectedLOVs(diagnosticTestNormalRange.lovList);

        } else {
            setDiagnosticTestNormalRange(newApDiagnosticTestNormalRange);
        }
    }, [diagnosticTestNormalRange]);

    useEffect(() => {
        setDiagnosticTestNormalRange({
            ...newApDiagnosticTestNormalRange,
            ageToUnitLkey: null,
            ageFromUnitLkey: null,
            normalRangeTypeLkey: null,
            resultLovKey: null

        });
        if (saveDiagnosticsTestNormalRangeMutation.data) {
            setListRequest({ ...listRequest, timestamp: new Date().getTime() });
        }
    }, [saveDiagnosticsTestNormalRangeMutation.data]);



    return (


        <Modal open={popUpOpen} size="full" overflow>
            <Modal.Title>
                <Translate>New/Edit Profile</Translate>
            </Modal.Title>
            <Modal.Body>
                <PanelGroup accordion bordered>
                    <Panel header="Profile Tests" defaultExpanded>
                        <Row gutter={15}>
                            <Col xs={6}>
                                <Text>Test Name</Text>
                                <Input
                                    disabled={!isActive}
                                    placeholder="Test Name"
                                    style={{ width: '100%' }}
                                    value={diagnosticsTestProfile.testName}
                                    onChange={e =>
                                        setDiagnosticsTestProfile({
                                            ...diagnosticsTestProfile,
                                            testName: e
                                        })
                                    }
                                />
                            </Col>
                            <Col xs={6}>
                                <Text>Result Unit</Text>
                                <SelectPicker
                                    disabled={!isActive}
                                    style={{ width: '100%' }}
                                    data={unitsLovQueryResponse?.object ?? []}
                                    labelKey="lovDisplayVale"
                                    valueKey="key"
                                    placeholder="Result unit"
                                    value={diagnosticsTestProfile.resultUnitLkey}
                                    onChange={e =>
                                        setDiagnosticsTestProfile({
                                            ...diagnosticsTestProfile,
                                            resultUnitLkey: e
                                        })
                                    }
                                />
                            </Col>
                            <Col xs={6}>
                            </Col>
                            <Col xs={6}>
                            </Col>
                        </Row>
                        <Row gutter={15} style={{ border: '1px solid #e1e1e1' }}>
                            <Col xs={3}>
                                <ButtonToolbar style={{ margin: '6px' }}>
                                    <IconButton
                                        size="xs"
                                        appearance="primary"
                                        color="blue"
                                        icon={<Plus />}
                                        onClick={handleNew}
                                    />
                                </ButtonToolbar>
                            </Col>
                            <Col xs={18}></Col>
                            <Col xs={3}>
                                <ButtonToolbar style={{ margin: '6px' }}>
                                    <IconButton
                                        disabled={!isActive}
                                        size="xs"
                                        appearance="primary"
                                        color="green"
                                        icon={<MdSave />}
                                        onClick={handleSave}
                                    />
                                    <IconButton
                                        disabled={!diagnosticsTestProfile.key}
                                        size="xs"
                                        appearance="primary"
                                        color="red"
                                        icon={<Trash />}
                                        onClick={handleRemove}
                                    />
                                </ButtonToolbar>
                            </Col>
                        </Row>
                        <Row gutter={15}>
                            <Col xs={24}>
                                <Table
                                    rowClassName={isSelected}
                                    bordered
                                    data={diagnosticsTestProfileListResponse?.object || []}
                                    onRowClick={rowData => {
                                        setDiagnosticsTestProfile(rowData);
                                    }}

                                >
                                    <Table.Column flexGrow={1}>
                                        <Table.HeaderCell>Test Name</Table.HeaderCell>
                                        <Table.Cell>
                                            {rowData => <Text>{rowData.testName}</Text>}
                                        </Table.Cell>
                                    </Table.Column>
                                    <Table.Column flexGrow={1}>
                                        <Table.HeaderCell>Result Unit</Table.HeaderCell>
                                        <Table.Cell>
                                            {rowData => <Text>{rowData.resultUnitLvalue ? rowData.resultUnitLvalue.lovDisplayVale : rowData.resultUnitLkey}</Text>}
                                        </Table.Cell>
                                    </Table.Column>
                                </Table>
                            </Col>
                        </Row>

                    </Panel>
                    {diagnosticsTestProfile.key && <Panel header="Tests Normal Range">
                        <Form layout="inline" fluid>
                            <MyInput
                                disabled={!isActive}
                                fieldName="genderLkey"
                                fieldType="select"
                                selectData={genderLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={diagnosticTestNormalRange}
                                setRecord={setDiagnosticTestNormalRange} />

                            <MyInput width={100} disabled={!isActive} fieldName="ageFrom" record={diagnosticTestNormalRange} setRecord={setDiagnosticTestNormalRange} />
                            <MyInput
                                disabled={!isActive}
                                fieldName="ageFromUnitLkey"
                                fieldType="select"
                                selectData={ageunitsLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={diagnosticTestNormalRange}
                                setRecord={setDiagnosticTestNormalRange}
                            />
                            <MyInput width={100} disabled={!isActive} fieldName="ageTo" record={diagnosticTestNormalRange} setRecord={setDiagnosticTestNormalRange} />
                            <MyInput
                                disabled={!isActive}
                                fieldName="ageToUnitLkey"
                                fieldType="select"
                                selectData={ageunitsLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={diagnosticTestNormalRange}
                                setRecord={setDiagnosticTestNormalRange}
                            />
                            <MyInput
                                disabled={!isActive}
                                fieldName="conditionLkey"
                                fieldType="select"
                                selectData={conditionLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={diagnosticTestNormalRange}
                                setRecord={setDiagnosticTestNormalRange}
                            />
                        </Form>
                        <Form layout="inline" fluid style={{ display: 'flex' }}>
                            <MyInput
                                disabled={!isActive}
                                fieldName="resultTypeLkey"
                                fieldType="select"
                                selectData={testResultTypeLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={diagnosticTestNormalRange}
                                setRecord={setDiagnosticTestNormalRange}
                            />

                            {(diagnosticTestNormalRange.resultTypeLkey === '6209569237704618') && (
                                <MyInput
                                    fieldName="normalRangeTypeLkey"
                                    fieldType="select"
                                    selectData={normalRangeLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    record={diagnosticTestNormalRange}
                                    setRecord={setDiagnosticTestNormalRange}
                                />
                            )}

                            {(diagnosticTestNormalRange.normalRangeTypeLkey === '6221150241292558') && (<>
                                <MyInput width={100} fieldLabel="" fieldName="rangeFrom" record={diagnosticTestNormalRange} setRecord={setDiagnosticTestNormalRange} />

                                <MyInput width={100} fieldLabel="-" fieldName="rangeTo" record={diagnosticTestNormalRange} setRecord={setDiagnosticTestNormalRange} />
                            </>

                            )}

                            {(diagnosticTestNormalRange.normalRangeTypeLkey === '6221162489019880') && (
                                <MyInput width={100} fieldLabel="" fieldName="rangeFrom" record={diagnosticTestNormalRange} setRecord={setDiagnosticTestNormalRange} />
                            )}

                            {(diagnosticTestNormalRange.normalRangeTypeLkey === '6221175556193180') && (
                                <MyInput width={100} fieldLabel="" fieldName="rangeTo" record={diagnosticTestNormalRange} setRecord={setDiagnosticTestNormalRange} />
                            )}

                            {(diagnosticTestNormalRange.resultTypeLkey === '6209578532136054') && (
                                <>
                                               <InputGroup
                                    disabled={!isActive}
                                    inside style={{ width: '300px', marginTop: '20px' }}>
                                    <Input
                                        placeholder={'Search LOV'}
                                        value={searchKeyword}
                                        onChange={handleSearch}
                                    />
                                    <InputGroup.Button>
                                        <SearchIcon />
                                    </InputGroup.Button>
                                </InputGroup>
                                {searchKeyword && (
                                    <Dropdown.Menu className="dropdown-menuresult"
                                        style={{
                                            position: "absolute",
                                            zIndex: 9999,
                                            maxHeight: "200px",
                                            overflowY: "auto",
                                            backgroundColor: "white",
                                            border: "1px solid #ccc",
                                            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)"
                                        }}
                                    >
                                        {modifiedData && modifiedData?.map(mod => (
                                            <Dropdown.Item
                                                key={mod.key}
                                                eventKey={mod.key}
                                                onClick={() => {
                                                    setDiagnosticTestNormalRange({
                                                        ...diagnosticTestNormalRange,
                                                        resultLovKey: mod.key
                                                    })
                                                    setLovCode(mod.lovCode);
                                                    setSearchKeyword("");
                                                }
                                                }
                                            >
                                                <span style={{ marginRight: "19px" }}>{mod.lovCode}</span>
                                                <span>{mod.lovName}</span>
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                )}
                                    <Input
                                        disabled={true}
                                        style={{ width: '300px' }}
                                        value={
                                            lovListResponseData?.object.find(item => item.key === diagnosticTestNormalRange?.resultLovKey)
                                                ? `${lovListResponseData.object.find(item => item.key === diagnosticTestNormalRange?.resultLovKey)?.lovCode}, ${lovListResponseData.object.find(item => item.key === diagnosticTestNormalRange?.resultLovKey)?.lovName}`
                                                : ""
                                        }
                                    />

                                    <MyInput
                                        width={360}
                                        column
                                        fieldLabel="Lovs"
                                        selectData={lovQueryResponse?.object ?? []}
                                        fieldType="multyPicker"
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName="lovList"
                                        record={diagnosticTestNormalRange}
                                        setRecord={setDiagnosticTestNormalRange}
                                    />
                                </>
                            )}

                            <br />
                        </Form>
                        <Form layout="inline" fluid>
                            <MyInput
                                disabled={!isActive}
                                width={400}
                                fieldName="criticalValue"
                                fieldType="checkbox"
                                record={diagnosticTestNormalRange}
                                setRecord={setDiagnosticTestNormalRange}
                            />

                            {(diagnosticTestNormalRange.criticalValue === true) && (
                                <>
                                    <MyInput width={100} fieldLabel="Less Than" fieldName="criticalValueLessThan" record={diagnosticTestNormalRange} setRecord={setDiagnosticTestNormalRange} />
                                    <MyInput width={100} fieldLabel="More Than" fieldName="criticalValueMoreThan" record={diagnosticTestNormalRange} setRecord={setDiagnosticTestNormalRange} />

                                </>
                            )
                            }
                        </Form>
                        <Form layout="inline" fluid>
                            <ButtonToolbar style={{ margin: '6px' }}>
                                <IconButton
                                    size="xs"
                                    appearance="primary"
                                    color="blue"
                                    icon={<Plus />}
                                    onClick={handleNewNormalRange}
                                />
                                <IconButton
                                    disabled={!isActive}
                                    size="xs"
                                    onClick={handleSaveNormalRange}
                                    appearance="primary"
                                    color="green"
                                    icon={<MdSave />}
                                />
                                <IconButton
                                    disabled={!diagnosticTestNormalRange.key}
                                    size="xs"
                                    onClick={handleRemoveNormalRange}
                                    appearance="primary"
                                    color="red"
                                    icon={<Trash />}
                                />
                            </ButtonToolbar>
                            <Table
                                rowClassName={isSelected}
                                bordered
                                data={normalRangeListResponse?.object ?? []}
                                onRowClick={rowData => {
                                    setDiagnosticTestNormalRange(rowData);
                                }}
                            >
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell>Gender</Table.HeaderCell>
                                    <Table.Cell>
                                        {rowData =>
                                            rowData.genderLvalue ? rowData.genderLvalue.lovDisplayVale : rowData.genderLkey
                                        }
                                    </Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell>Age From - To</Table.HeaderCell>
                                    <Table.Cell>
                                        {rowData => <Text>{rowData.ageFrom}{rowData.ageFromUnitLvalue ? rowData.ageFromUnitLvalue.lovDisplayVale : rowData.ageFromUnitLkey} - {rowData.ageTo}{rowData.ageToUnitLvalue ? rowData.ageToUnitLvalue.lovDisplayVale : rowData.ageToUnitLkey}

                                        </Text>}
                                    </Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell>Normal Range</Table.HeaderCell>
                                    <Table.Cell>
                                        {rowData => (rowData.resultTypeLkey === '6209569237704618') ? <Text>{rowData.rangeFrom} - {rowData.rangeTo}</Text> : <Text>{rowData.rangeFrom} {rowData.rangeTo}</Text>}
                                    </Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell>LOV Values</Table.HeaderCell>
                                    <Table.Cell>
                                        {rowData => <Text>{rowData.lovList}</Text>}
                                    </Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell>Condition</Table.HeaderCell>
                                    <Table.Cell>
                                        {rowData => rowData.conditionLvalue ? rowData.conditionLvalue.lovDisplayVale : rowData.conditionLkey}
                                    </Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell>Status</Table.HeaderCell>
                                    <Table.Cell>
                                        {rowData =>
                                            rowData.deletedAt === null ? 'Active' : 'InActive'
                                        }
                                    </Table.Cell>
                                </Table.Column>
                            </Table>

                        </Form>
                    </Panel>}
                </PanelGroup>
            </Modal.Body>
            <Modal.Footer>
                <Stack spacing={2} divider={<Divider vertical />}>
                    <Button appearance="primary" color="red" onClick={handleCancel}>
                        Cancel
                    </Button>
                </Stack>
            </Modal.Footer>
        </Modal>

    );
};

export default ProfileSetup;