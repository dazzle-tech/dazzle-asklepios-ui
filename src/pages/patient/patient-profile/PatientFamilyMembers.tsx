
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
const { Column, HeaderCell, Cell } = Table;
import { useAppDispatch, useAppSelector } from '@/hooks';
import React, { useEffect, useRef, useState } from 'react';
import {
    InputGroup,
    ButtonToolbar,
    Form,
    IconButton,
    Input,
    Panel,
    Stack,
    Divider,
    Table,
    Pagination,
    Button,
    Modal,
    Whisper,
    Tooltip,
    SelectPicker,
    Badge,
    Drawer,
    DOMHelper
} from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import RemindOutlineIcon from '@rsuite/icons/RemindOutline';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import { initialListRequest, ListRequest } from '@/types/types';
import TrashIcon from '@rsuite/icons/Trash';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import {
    useSavePatientRelationMutation,
    useGetPatientRelationsQuery,
    useDeletePatientRelationMutation,
    useGetPatientsQuery
} from '@/services/patientService';
import SearchIcon from '@rsuite/icons/Search';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPen } from '@fortawesome/free-solid-svg-icons';
import {
    newApPatient,
    newApPatientInsurance,
    newApPatientRelation,
    newApPatientSecondaryDocuments,
    newApPatientAdministrativeWarnings
} from '@/types/model-types-constructor';
import {
    useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { PlusRound } from '@rsuite/icons';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
const PatientFamilyMembers = ({ localPatient }) => {
    const dispatch = useAppDispatch();
    const [relationModalOpen, setRelationModalOpen] = useState(false);
    const [deleteRelativeModalOpen, setDeleteRelativeModalOpen] = useState(false);
    const [patientSearchTarget, setPatientSearchTarget] = useState('primary'); // primary, relation, etc..
    const [searchResultVisible, setSearchResultVisible] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCriterion, setSelectedCriterion] = useState('');
    const [open, setOpen] = useState(false);
  //Lov
    const { data: relationsLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
    const { data: categoryLovQueryResponse } = useGetLovValuesByCodeQuery('FAMILY_MMBR_CAT');

//handleFun
    const [patientRelationListRequest, setPatientRelationListRequest] = useState<ListRequest>({
        ...initialListRequest,
        pageSize: 1000
    });
    const [deleteRelation, deleteRelationMutation] = useDeletePatientRelationMutation();
    const [savePatientRelation, savePatientRelationMutation] = useSavePatientRelationMutation();
    const { data: patientRelationsResponse, refetch: patientRelationsRefetch } =
        useGetPatientRelationsQuery(
            {
                listRequest: patientRelationListRequest,
                key: localPatient?.key
            },
            { skip: !localPatient.key }
        );
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: !searchKeyword || searchKeyword.length < 3
    });
    const {
        data: patientListResponse,
        isLoading: isGettingPatients,
        isFetching: isFetchingPatients,
        refetch: refetchPatients
    } = useGetPatientsQuery({ ...listRequest, filterLogic: 'or' });
    const [selectedPatientRelation, setSelectedPatientRelation] = useState<any>({
        ...newApPatientRelation
    });
    const isSelectedRelation = rowData => {
        if (rowData && selectedPatientRelation && selectedPatientRelation.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    const search = target => {
        setPatientSearchTarget(target);
        setSearchResultVisible(true);

        if (searchKeyword && searchKeyword.length >= 3 && selectedCriterion) {
            setListRequest({
                ...listRequest,
                ignore: false,
                filters: [
                    {
                        fieldName: fromCamelCaseToDBName(selectedCriterion),
                        operator: 'containsIgnoreCase',
                        value: searchKeyword
                    }
                ]
            });
        }
    };
    const handleFilterChange = (fieldName, value) => {
        if (value) {
            setListRequest(
                addFilterToListRequest(
                    fromCamelCaseToDBName(fieldName),
                    'containsIgnoreCase',
                    value,
                    listRequest
                )
            );
        } else {
            setListRequest({ ...listRequest, filters: [] });
        }
    };
    const handleSelect = (value) => {
        setSelectedCriterion(value);
        setOpen(false);
    };
    const handleSaveFamilyMembers = () => {
        savePatientRelation({
            ...selectedPatientRelation,
            patientKey: localPatient.key,
        }).unwrap()
            .then(() => {
                patientRelationsRefetch();
            })
        patientRelationsRefetch();
    }
    const handleDeleteRelation = () => {
        deleteRelation({
            key: selectedPatientRelation.key
        }).then(
            () => (
                patientRelationsRefetch(),
                dispatch(notify('Relation Deleted')),
                setSelectedPatientRelation(newApPatientRelation),
                setDeleteRelativeModalOpen(false)
            )
        );
    };
    const handleClearRelative = () => {
        setSelectedPatientRelation(newApPatientRelation);
        setDeleteRelativeModalOpen(false);
    }

    const handleSelectPatient = data => {
        if (patientSearchTarget === 'primary') {
        } else if (patientSearchTarget === 'relation') {
            setSelectedPatientRelation({
                ...selectedPatientRelation,
                relativePatientKey: data.key,
                relativePatientObject: data
            });
        }
        setSearchResultVisible(false);
    };
    const searchCriteriaOptions = [
        { label: 'MRN', value: 'patientMrn' },
        { label: 'Document Number', value: 'documentNo' },
        { label: 'Full Name', value: 'fullName' },
        { label: 'Archiving Number', value: 'archivingNumber' },
        { label: 'Primary Phone Number', value: 'phoneNumber' },
        { label: 'Date of Birth', value: 'dob' }
    ];

    const conjurePatientSearchBar = target => {
        return (
            <Panel>
                <ButtonToolbar>
                    <SelectPicker
                        label="Search Criteria"
                        data={searchCriteriaOptions}
                        onChange={e => {
                            setSelectedCriterion(e);
                        }}
                        style={{ width: 250 }}
                    />

                    <InputGroup inside style={{ width: '350px', direction: 'ltr' }}>
                        <Input
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    search(target);
                                }
                            }}
                            placeholder={'Search Patients '}
                            value={searchKeyword}
                            onChange={e => setSearchKeyword(e)}
                        />
                        <InputGroup.Button onClick={() => search(target)}>
                            <SearchIcon />
                        </InputGroup.Button>
                    </InputGroup>
                </ButtonToolbar>
            </Panel>
        );
    };
    //useEffect
    useEffect(() => {
        setSearchKeyword('');
    }, [selectedCriterion]);
    useEffect(() => {
        if (savePatientRelationMutation.status === 'fulfilled') {
            setSelectedPatientRelation(savePatientRelationMutation.data);
            setPatientRelationListRequest({ ...patientRelationListRequest, timestamp: Date.now() });
            setRelationModalOpen(false);
            dispatch(notify('Relation saved'));
        }
    }, [savePatientRelationMutation]);
    return (
        <>
            <Panel>
                <Modal open={relationModalOpen} onClose={() => setRelationModalOpen(false)}>
                    <Modal.Header>
                        <Modal.Title>New/Edit Patient Relation</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form fluid>
                            <MyInput
                                required
                                width={165}
                                fieldLabel="Relation Type"
                                fieldType="select"
                                fieldName="relationTypeLkey"
                                selectData={relationsLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={selectedPatientRelation}
                                setRecord={setSelectedPatientRelation}
                            />
                            <MyInput
                                required
                                width={165}
                                fieldLabel="Category"
                                fieldType="select"
                                fieldName="categoryTypeLkey"
                                selectData={categoryLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={selectedPatientRelation}
                                setRecord={setSelectedPatientRelation}
                            />
                            <Form.Group>
                                <InputGroup inside style={{ width: 300, direction: 'ltr' }}>
                                    <Input
                                        width={165}
                                        disabled={true}
                                        placeholder={'Search Relative Patient'}
                                        value={selectedPatientRelation.relativePatientObject?.fullName ?? ''}
                                    />
                                    <InputGroup.Button onClick={() => search('relation')}>
                                        <SearchIcon />
                                    </InputGroup.Button>
                                </InputGroup>
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={() => setRelationModalOpen(false)} appearance="subtle">
                            Cancel
                        </Button>
                        <Divider vertical />
                        <Button
                            onClick={() =>
                                handleSaveFamilyMembers()
                            }
                            appearance="primary"
                        >
                            Save
                        </Button>
                    </Modal.Footer>
                </Modal>
                <ButtonToolbar style={{ padding: 1 ,zoom:.8}}>
                    <Button style={{ backgroundColor: ' #00b1cc', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}
                        disabled={!localPatient.key}
                        onClick={() => {
                            setSelectedPatientRelation({ ...newApPatientRelation });
                            setRelationModalOpen(true);
                        }}
                    >
                        <PlusRound />   New Relative
                    </Button>
                    <Button
                        disabled={!selectedPatientRelation.key}
                        onClick={() => {
                            setRelationModalOpen(true);
                        }}
                        appearance="ghost"
                        style={{ border: '1px solid #00b1cc', backgroundColor: 'white', color: '#00b1cc', marginLeft: "3px" }}
                    >
                        <FontAwesomeIcon icon={faUserPen} style={{ marginRight: '5px', color: '#007e91' }} />
                        <span>Edit</span>
                    </Button>
                    <Button
                        disabled={!selectedPatientRelation?.key}

                        style={{ border: '1px solid  #007e91', backgroundColor: 'white', color: '#007e91', display: 'flex', alignItems: 'center', gap: '5px' }}

                        onClick={() => { setDeleteRelativeModalOpen(true) }}
                    >
                        <TrashIcon /> <Translate>Delete</Translate>
                    </Button>
                </ButtonToolbar>
                <br />
                <Modal open={deleteRelativeModalOpen} onClose={handleClearRelative}>
                    <Modal.Header>
                        <Modal.Title>Confirm Delete</Modal.Title>

                    </Modal.Header>

                    <Modal.Body>
                        <p>
                            <RemindOutlineIcon style={{ color: '#ffca61', marginRight: '8px', fontSize: '24px' }} />
                            <Translate style={{ fontSize: '24px' }} >
                                Are you sure you want to delete this Relation?
                            </Translate>
                        </p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={handleClearRelative} appearance="ghost" color='cyan'>
                            Cancel
                        </Button>
                        <Divider vertical />
                        <Button
                            onClick={handleDeleteRelation}
                            appearance="primary"
                        >
                            Delete
                        </Button>
                    </Modal.Footer>
                </Modal>

                <Table
                    height={600}
                    sortColumn={patientRelationListRequest.sortBy}
                    sortType={patientRelationListRequest.sortType}
                    onSortColumn={(sortBy, sortType) => {
                        if (sortBy)
                            setPatientRelationListRequest({
                                ...patientRelationListRequest,
                                sortBy,
                                sortType
                            });
                    }}
                    headerHeight={40}
                    rowHeight={50}
                    bordered
                    cellBordered
                    onRowClick={rowData => {
                        setSelectedPatientRelation(rowData);
                    }}
                    data={patientRelationsResponse?.object ?? []}
                    rowClassName={isSelectedRelation}

                >
                    <Column sortable flexGrow={4}>
                        <HeaderCell>
                            <Translate>Relation Type</Translate>
                        </HeaderCell>
                        <Cell dataKey="relationTypeLvalue.lovDisplayVale" />
                    </Column>
                    <Column sortable flexGrow={4}>
                        <HeaderCell>
                            <Translate>Relative Patient Name</Translate>
                        </HeaderCell>
                        <Cell dataKey="relativePatientObject.fullName" />
                    </Column>
                    <Column sortable flexGrow={4}>
                        <HeaderCell>
                            <Translate>Relation Category</Translate>
                        </HeaderCell>
                        <Cell dataKey="categoryTypeLvalue.lovDisplayVale" />
                    </Column>
                </Table>
            </Panel>
            <Drawer
                size="md"
                style={{ zoom: .95 }}
                placement={'left'}
                open={searchResultVisible}
                onClose={() => {
                    setSearchResultVisible(false);
                }}
            >
                <Drawer.Header>
                    <Drawer.Title>Patient List - Search Results</Drawer.Title>

                </Drawer.Header>
                <Drawer.Actions style={{ marginLeft: '50px' }}>{conjurePatientSearchBar(patientSearchTarget)}</Drawer.Actions>
                <Drawer.Body>
                    <small>
                        * <Translate>Click to select patient</Translate>
                    </small>
                    <Table
                        height={500}
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
                        rowHeight={40}
                        bordered
                        cellBordered
                        onRowClick={rowData => {
                            handleSelectPatient(rowData);
                            setSearchKeyword(null);
                        }}
                        data={patientListResponse?.object ?? []}
                    >
                        <Column sortable flexGrow={3}>
                            <HeaderCell>
                                <Input onChange={e => handleFilterChange('fullName', e)} />
                                <Translate>PATIENT NAME</Translate>
                            </HeaderCell>
                            <Cell dataKey="fullName" />
                        </Column>
                        <Column sortable flexGrow={3}>
                            <HeaderCell>
                                <Input onChange={e => handleFilterChange('phoneNumber', e)} />
                                <Translate>MOBILE NUMBER</Translate>
                            </HeaderCell>
                            <Cell dataKey="phoneNumber" />
                        </Column>
                        <Column sortable flexGrow={2}>
                            <HeaderCell>
                                <Input onChange={e => handleFilterChange('genderLkey', e)} />
                                <Translate>GENDER</Translate>
                            </HeaderCell>
                            <Cell dataKey="genderLvalue.lovDisplayVale" />
                        </Column>
                        <Column sortable flexGrow={2}>
                            <HeaderCell>
                                <Input onChange={e => handleFilterChange('patientMrn', e)} />
                                <Translate>MRN</Translate>
                            </HeaderCell>
                            <Cell dataKey="patientMrn" />
                        </Column>
                        <Column sortable flexGrow={3}>
                            <HeaderCell>
                                <Input onChange={e => handleFilterChange('dob', e)} />
                                <Translate>DATE OF BIRTH</Translate>
                            </HeaderCell>
                            <Cell dataKey="dob" />
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
                            total={patientListResponse?.extraNumeric ?? 0}
                        />
                    </div>
                </Drawer.Body>
            </Drawer>
        </>
    );
};

export default PatientFamilyMembers;
