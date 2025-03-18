import Translate from '@/components/Translate';
import { notify } from '@/reducers/uiSlice';
import { initialListRequest, ListRequest } from '@/types/types';

import WavePoint from '@rsuite/icons/lib/icons/WavePoint';
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
const { Column, HeaderCell, Cell } = Table;
import { useAppDispatch, useAppSelector } from '@/hooks';

import {
    InputGroup,
    ButtonToolbar,
    FlexboxGrid,
    Form,
    IconButton,
    Input,
    Panel,
    Stack,
    Divider,
    Drawer,
    Table,
    Pagination,
    SelectPicker,
    Button
} from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { calculateAgeFormat, fromCamelCaseToDBName } from '@/utils';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    useGetEncountersQuery,
    useCompleteEncounterRegistrationMutation
} from '@/services/encounterService';
import {
    useGetPatientRelationsQuery,
    useGetPatientsQuery,
    useGetPatientAdministrativeWarningsQuery
} from '@/services/patientService';
import {

    newApPatientRelation
} from '@/types/model-types-constructor';
import {
    addFilterToListRequest,
    conjureValueBasedOnKeyFromList,

} from '@/utils';
import { useNavigate } from 'react-router-dom';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import Encounter from '@/pages/encounter/encounter-screen';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { ApPatient } from '@/types/model-types';
const PatientEMR = () => {

    const patientSlice = useAppSelector(state => state.patient);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const [PatientSearch, setPatientSearch] = useState<ApPatient>({ ...newApPatient })
    const [listEncounterRequest, setListEncounterRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value:PatientSearch.key || undefined
            },

        ]

    });
    const [selectedCriterion, setSelectedCriterion] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [patientSearchTarget, setPatientSearchTarget] = useState('primary');
    const [searchResultVisible, setSearchResultVisible] = useState(false);
    const divElement = useSelector((state: RootState) => state.div?.divElement);
    const divContent = (
      <div style={{ display: 'flex' }}>
        <h5>Patients EMR</h5>
      </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('Patients_EMR'));
    dispatch(setDivContent(divContentHTML));
    const {
        data: patientListResponse,
        isLoading: isGettingPatients,
        isFetching: isFetchingPatients,
        refetch: refetchPatients
    } = useGetPatientsQuery({
        ...listRequest, filters: [
            {
                fieldName: fromCamelCaseToDBName(selectedCriterion) || "document_no",
                operator: 'containsIgnoreCase',
                value: searchKeyword || "-1",
            },

        ]
    });
    const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
 
    const [encounter,setLocalEncounter] = useState({ ...newApEncounter });
    const searchCriteriaOptions = [
        { label: 'MRN', value: 'patientMrn' },
        { label: 'Document Number', value: 'documentNo' },
        { label: 'Full Name', value: 'fullName' },
        { label: 'Archiving Number', value: 'archivingNumber' },
        { label: 'Primary Phone Number', value: 'mobileNumber' },
        { label: 'Date of Birth', value: 'dob' }
    ];
    const [selectedPatientRelation, setSelectedPatientRelation] = useState<any>({
        ...newApPatientRelation
    });
    const { data: encounterListResponse,isFetching } = useGetEncountersQuery(listEncounterRequest);
    const isSelected = rowData => {
        if (rowData && encounter && rowData.key === encounter.key) {
          return 'selected-row';
        } else return '';
      };
    useEffect(() => {
        if (!patientSlice.patient) {
            console.log("case1-no patient");
            dispatch(setPatient({ ...newApPatient }));

            // navigate('/patient-profile');
        } else {
            console.log("case2 patient");

            const updatedFilters = [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined
                },
                {
                    fieldName: 'patient_key',
                    operator: 'match',
                    value: PatientSearch.key || undefined
                }
            ];
            console.log(updatedFilters);
            setListEncounterRequest((prevRequest) => ({

                ...prevRequest,
                filters: updatedFilters,

            }));
        }

    }, [patientSlice.patient]);
    useEffect(()=>{
        if(searchKeyword==null||searchKeyword==""){
            setPatientSearch({...newApPatient});
            dispatch(setEncounter({...newApEncounter}));
            dispatch(setPatient({...newApPatient}));
            
        }
    },[searchKeyword]);
    useEffect(() => {
        return () => {
          dispatch(setPageCode(''));
          dispatch(setDivContent("  "));
        };
      }, [location.pathname, dispatch])
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
    const handleSelectPatient = data => {
        if (patientSearchTarget === 'primary') {

            setPatientSearch(data);
            dispatch(setPatient(data));

            setLocalEncounter(
                {
                    ...newApEncounter,
                    patientKey: patientSlice.patient.key,
                    patientFullName: patientSlice.patient.fullName,
                    patientAge: patientSlice.patient.dob ? calculateAgeFormat(patientSlice.patient.dob) + '' : '',
                    encounterStatusLkey: '91063195286200',//change this to be loaded from cache lov values by code
                    plannedStartDate: new Date()
                }
            )


        } else if (patientSearchTarget === 'relation') {
            // selecting patient for relation patient key
            setSelectedPatientRelation({
                ...selectedPatientRelation,
                relativePatientKey: data.key,
                relativePatientObject: data
            });
        }
        refetchPatients({ ...listRequest, clearResults: true });
        setSearchResultVisible(false);
    };
    const search = target => {

        setPatientSearchTarget(target);
        setSearchResultVisible(true);
        console.log(patientSearchTarget);
        if (searchKeyword !== "" && searchKeyword.length >= 3 && selectedCriterion) {

            setListRequest({
                ...listRequest,
                ignore: false,
                filters: [
                    {
                        fieldName: fromCamelCaseToDBName(selectedCriterion),
                        operator: 'containsIgnoreCase',
                        value: searchKeyword,
                    },
                ]
            });
        }



    };

    const conjurePatientSearchBar = target => {
        return (
            <Panel>

                <ButtonToolbar>
                    <SelectPicker label="Search Criteria" data={searchCriteriaOptions}
                        onChange={(e) => {
                            if (e !== null) { setSelectedCriterion(e) }
                            else { }
                            ; console.log(e)
                        }}
                        style={{ width: 250 }} />

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
                        <InputGroup.Button onClick={() => search(target)} >
                            <SearchIcon />
                        </InputGroup.Button>
                    </InputGroup>
                </ButtonToolbar>
            </Panel>

        );
    };
     const goToVisit = async(rowData) => {

        await setLocalEncounter(rowData);
        if (encounter && encounter.key) {
          dispatch(setEncounter(encounter));
          dispatch(setPatient(encounter['patientObject']));
        }
       
       
        const privatePatientPath = '/user-access-patient-private';
        const encounterPath = '/encounter';
        const targetPath = localPatient.privatePatient ? privatePatientPath : encounterPath;
    
        if (localPatient.privatePatient) {
          navigate(targetPath, { state: { info: "toEncounter" , fromPage: "PatientEMR" } });
        } else {
          navigate(targetPath, { state: { info: "toEncounter" , fromPage: "PatientEMR" } }); 
        }
      
        const currentDateTime = new Date().toLocaleString();
        setDateClickToVisit(currentDateTime);
      };
    return (<>
        <Panel bordered>
            {conjurePatientSearchBar('primary')}
        </Panel>
        <Drawer
            size="lg"
            placement={'left'}
            open={searchResultVisible}
            onClose={() => {
                setSearchResultVisible(false);
            }}
        >
            <Drawer.Header>
                <Drawer.Title>Patient List - Search Results</Drawer.Title>
                <Drawer.Actions>{conjurePatientSearchBar(patientSearchTarget)}</Drawer.Actions>
            </Drawer.Header>
            <Drawer.Body>
                <small>
                    * <Translate>Click to select patient</Translate>
                </small>
                <Table
                    height={600}
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
                    
                   
                    onRowClick={rowData => {
                        handleSelectPatient(rowData);
                        setSearchKeyword(null);
                    }}
                    data={patientListResponse?.object ?? []}
                >
                    <Column sortable flexGrow={3}>
                        <HeaderCell>
                            <Input onChange={e => handleFilterChange('fullName', e)} />
                            <Translate>Patient Name</Translate>
                        </HeaderCell>
                        <Cell dataKey="fullName" />
                    </Column>
                    <Column sortable flexGrow={3}>
                        <HeaderCell>
                            <Input onChange={e => handleFilterChange('mobileNumber', e)} />
                            <Translate>Mobile Number</Translate>
                        </HeaderCell>
                        <Cell dataKey="mobileNumber" />
                    </Column>
                    <Column sortable flexGrow={2}>
                        <HeaderCell>
                            <Input onChange={e => handleFilterChange('genderLkey', e)} />
                            <Translate>Gender</Translate>
                        </HeaderCell>
                        <Cell dataKey="genderLvalue.lovDisplayVale" />
                    </Column>
                    <Column sortable flexGrow={2}>
                        <HeaderCell>
                            <Input onChange={e => handleFilterChange('patientMrn', e)} />
                            <Translate>Mrn</Translate>
                        </HeaderCell>
                        <Cell dataKey="patientMrn" />
                    </Column>
                    <Column sortable flexGrow={3}>
                        <HeaderCell>
                            <Input onChange={e => handleFilterChange('documentNo', e)} />
                            <Translate>Document No</Translate>
                        </HeaderCell>
                        <Cell dataKey="documentNo" />
                    </Column>
                    <Column sortable flexGrow={3}>
                        <HeaderCell>
                            <Input onChange={e => handleFilterChange('archivingNumber', e)} />
                            <Translate>Archiving Number</Translate>
                        </HeaderCell>
                        <Cell dataKey="archivingNumber" />
                    </Column>
                    <Column sortable flexGrow={3}>
                        <HeaderCell>
                            <Input onChange={e => handleFilterChange('dob', e)} />
                            <Translate>Date of Birth</Translate>
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
           

            data={encounterListResponse?.object ?? []}
        onRowClick={rowData => {
            setLocalEncounter(rowData);
            setLocalPatient(rowData.patientObject)
        }}
        rowClassName={isSelected}
        loading={isFetching}
        >


            <Column flexGrow={2}>
                <HeaderCell align="center">
                    <Input onChange={e => handleFilterChange('visitId', e)} />
                    <Translate>VISIT ID</Translate>
                </HeaderCell>
                <Cell>
                    {rowData => (
                        <span
                            style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
                            onClick={() => {
                               
                                dispatch(setEncounter(rowData));
                                dispatch(setPatient(rowData['patientObject']));

                                goToVisit(rowData)}}
                        >
                            {rowData.visitId}
                        </span>
                    )}
                </Cell>
            </Column>
            <Column sortable flexGrow={3}>
                <HeaderCell>
                <Input onChange={e => handleFilterChange('plannedStartDate', e)} />
                    <Translate>DATE</Translate>
                </HeaderCell>
                <Cell dataKey="plannedStartDate" />
            </Column>
            <Column sortable flexGrow={3} fullText>
                <HeaderCell>
                    
                    <Translate>DIAGNOSIS</Translate>
                </HeaderCell>
                <Cell>
                    {rowData =>
                        rowData.diagnosis}

                </Cell>

            </Column>
            <Column sortable flexGrow={3} fullText>
                <HeaderCell>
                    
                    <Translate>STATUS</Translate>
                </HeaderCell>
                <Cell>
                {rowData =>
                rowData.encounterStatusLvalue
                  ? rowData.encounterStatusLvalue.lovDisplayVale
                  : rowData.encounterStatusLkey
              }

                </Cell>

            </Column>

        </Table>
    </>);
}
export default PatientEMR;