import React, { useEffect, useState } from 'react';
import { Button, Panel } from 'rsuite';
import {
    IconButton,
    Input,
    Table,
    ButtonToolbar,
    DateRangePicker,
    Stack,
    Pagination,
    Form
} from 'rsuite';
import { DatePicker } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import MyInput from '@/components/MyInput';
import SearchPeopleIcon from '@rsuite/icons/SearchPeople';
import MyLabel from '@/components/MyLabel';
import {
    ApPatient,
    ApPatientInsurance
} from '@/types/model-types';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest, formatDate, fromCamelCaseToDBName } from '@/utils';
import {
    useGetPatientsQuery,
} from '@/services/patientService';
import './styles.less'
import { newApEncounter, newApPatient, newApPatientInsurance } from '@/types/model-types-constructor';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import { useDispatch, useSelector } from 'react-redux';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '@/store';
import { setDivContent ,setPageCode } from '@/reducers/divSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { faFileCsv } from '@fortawesome/free-solid-svg-icons';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import ReactDOMServer from 'react-dom/server';

const FacilityPatientList = () => {
    const divElement = useSelector((state: RootState) => state.div?.divElement);
    const dispatch = useDispatch();
    const divContent = (
        <div style={{ display: 'flex' }}>
          <h5>Facility Patients List</h5>
        </div>
      );

    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch (setPageCode('P_Facility'));
    dispatch(setDivContent(divContentHTML));
    const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const { data: documentTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
    const { data: primaryInsuranceProviderLovQueryResponse } = useGetLovValuesByCodeQuery('INS_PROVIDER');
    const [searchPatient, setSearchPatient] = useState<ApPatient>({ ...newApPatient });
    const [insurancePatient, setInsurancePatient] = useState<ApPatientInsurance>({ ...newApPatientInsurance });
    const [dateFilter, setDateFilter] = useState({
        fromDate: '',
        toDate: '',
    });
    const [patient, setLocalPatient] = useState({ ...newApEncounter });
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: true,
        filters: [],
    });
    const {
        data: patientListResponse,
        refetch: refetchPatients
    } = useGetPatientsQuery({ ...listRequest, filterLogic: 'or' }); //replace to newList 
    const handleDateChange = (value) => {
        const [startDate, endDate] = value;
        setDateFilter({
            fromDate: startDate,
            toDate: endDate,
        });
    };
    const handleManualSearch = () => {
        if (dateFilter.fromDate && dateFilter.toDate) {
            const formattedFromDate = formatDate(dateFilter.fromDate);
            const formattedToDate = formatDate(dateFilter.toDate);
            setListRequest(
                addFilterToListRequest(
                    'created_at',
                    'between',
                    formattedFromDate + '_' + formattedToDate,
                    listRequest
                )
            );
        } else if (dateFilter.fromDate) {
            const formattedFromDate = formatDate(dateFilter.fromDate);
            setListRequest(
                addFilterToListRequest('created_at', 'gte', formattedFromDate, listRequest)
            );
        } else if (dateFilter.toDate) {
            const formattedToDate = formatDate(dateFilter.toDate);
            setListRequest(
                addFilterToListRequest('created_at', 'lte', formattedToDate, listRequest)
            );
        } else {
            setListRequest({ ...listRequest, filters: [] });
        }
    };
    const handleDOFSearch = (value) => {
        const dob = formatDate(value);
        setListRequest(
            addFilterToListRequest(
                'dob',
                'match',
                dob,
                listRequest
            )
        );

    };
    const isSelected = rowData => {
        if (rowData && patient && rowData.key === patient.key) {
            return 'selected-row';
        } else return '';
    };
    useEffect(() => {
        handleManualSearch();
    }, []);
    useEffect(() => {
        setListRequest((prevState) => ({
            ...prevState,
            filters: [
                ...prevState.filters.filter(
                    (filter) =>
                        !['gender_lkey', 'document_type_lkey', 'insurance_provider_lkey'].includes(
                            filter.fieldName
                        )
                ),
                searchPatient.genderLkey && {
                    fieldName: 'gender_lkey',
                    operator: 'match',
                    value: searchPatient.genderLkey,
                },
                searchPatient.documentTypeLkey && {
                    fieldName: 'document_type_lkey',
                    operator: 'match',
                    value: searchPatient.documentTypeLkey,
                },
                insurancePatient.insuranceProviderLkey && {
                    fieldName: 'insurance_provider_lkey',
                    operator: 'match',
                    value: insurancePatient.insuranceProviderLkey,
                },
            ].filter(Boolean),
        }));
    }, [searchPatient.genderLkey, searchPatient.documentTypeLkey, insurancePatient.insuranceProviderLkey]);
    useEffect(() => {
        handleManualSearch();
    }, [dateFilter]);
    return (
     
            <Panel className='box-style'>
                <div  >
                    <div >
                        <Form layout='inline' fluid className='divStyle'>
                            <div className='divContainFiledSearch'>
                                <Stack spacing={5} direction="column" alignItems="flex-start" style={{ zoom: .8 }}>
                                    <MyLabel label="Registration Date " />
                                    <DateRangePicker
                                        format="MM/dd/yyyy"
                                        character=" – "
                                        onChange={handleDateChange}
                                    />
                                </Stack>
                                <Stack spacing={5} direction="column" alignItems="flex-start" style={{ zoom: .8 }}>
                                    <MyLabel label="Date of Birth " />
                                    <DatePicker format="MM/dd/yyyy" onChange={handleDOFSearch} />
                                </Stack >
                                <MyInput
                                    width={165}
                                    heigth={27}
                                    column
                                    fieldLabel="Sex at Birth"
                                    fieldType="select"
                                    fieldName="genderLkey"
                                    selectData={genderLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    record={searchPatient}
                                    setRecord={setSearchPatient}
                                />
                                <MyInput
                                    width={165}
                                    column
                                    fieldLabel="Document Type"
                                    fieldType="select"
                                    fieldName="documentTypeLkey"
                                    selectData={documentTypeLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    record={searchPatient}
                                    setRecord={setSearchPatient}
                                />
                                <MyInput
                                    width={165}
                                    column
                                    fieldLabel="Primary Insurance Provider"
                                    fieldType="select"
                                    fieldName="insuranceProviderLkey"
                                    selectData={primaryInsuranceProviderLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    record={insurancePatient}
                                    setRecord={setInsurancePatient}
                                />
                            </div>
                            <div>
                                <ButtonToolbar style={{ zoom: .8 }}>
                                    <Button appearance="primary" style={{ backgroundColor: 'var(--primary-blue)' }}>
                                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                                    </Button>
                                    <Button appearance="primary" style={{ backgroundColor: 'var(--primary-blue)', color: 'white', marginLeft: "3px" }} >
                                        <FontAwesomeIcon icon={faBroom} style={{ marginRight: '5px', color: 'white' }} />
                                        <Translate>Clear</Translate>
                                    </Button>
                                    <Button
                                        appearance="primary"
                                        style={{ backgroundColor: 'var(--primary-blue)', color: 'white', marginLeft: "3px" }}
                                    >
                                        <FontAwesomeIcon icon={faFileCsv} style={{ marginRight: '5px', color: 'white' }} />
                                        <Translate>Export to Xsl</Translate>
                                    </Button>
                                </ButtonToolbar>
                            </div>



                        </Form>

                    </div>
                   
                        <Table
                            height={460}
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
                            headerHeight={40}
                            rowHeight={30}
                            data={patientListResponse?.object ?? []}
                            // onRowClick={rowData => {
                            //     setLocalPatient(rowData);
                            // }}
                            rowClassName={(rowData, rowIndex) => {
                                if (rowIndex === -1) return "first-row";
                                return ""; 
                            }}
                            
                        >
                            <Column sortable flexGrow={1.5}>
                                <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
                                    <Translate># </Translate>
                                </HeaderCell>
                                <Cell>  {(rowData, rowIndex) => rowIndex + 1}</Cell>
                            </Column>
                            <Column sortable flexGrow={4}>
                                <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
                                    <Translate>REGISTRATION DATE</Translate>
                                </HeaderCell>
                                <Cell dataKey="created_at" />
                            </Column>
                            <Column sortable flexGrow={2}>
                                <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
                                    <Translate>MRN</Translate>
                                </HeaderCell>
                                <Cell dataKey="patientMrn" />
                            </Column>
                            <Column sortable flexGrow={4}>
                                <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
                                    <Translate>FULL NAME </Translate>
                                </HeaderCell>
                                <Cell dataKey="fullName" />
                            </Column>
                            <Column sortable flexGrow={4}>
                                <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
                                    <Translate> SEX AT  BIRTH</Translate>
                                </HeaderCell>
                                <Cell>
                                    {rowData =>
                                        rowData.genderLvalue
                                            ? rowData.genderLvalue.lovDisplayVale
                                            : rowData.genderLkey
                                    }
                                </Cell>
                            </Column>
                            <Column sortable flexGrow={4}>
                                <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
                                    <Translate >DOB </Translate>
                                </HeaderCell>
                                <Cell dataKey="dob" />
                            </Column>
                            <Column sortable flexGrow={4}>
                                <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
                                    <Translate> DOCUMENT TYPE</Translate>
                                </HeaderCell>
                                <Cell>
                                    {rowData =>
                                        rowData.encounterStatusLvalue
                                            ? rowData.documentTypeLvalue.lovDisplayVale
                                            : rowData.documentTypeLkey
                                    }
                                </Cell>
                            </Column>
                            <Column sortable flexGrow={4}>
                                <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
                                    <Translate> DOCUMENT NUMBER</Translate>
                                </HeaderCell>
                                <Cell dataKey="documentNo" />
                            </Column>
                            <Column sortable flexGrow={4}>
                                <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
                                    <Translate>PRIMARY PHONE NUMBER</Translate>
                                </HeaderCell>
                                <Cell dataKey="" />
                            </Column>
                            <Column sortable flexGrow={4}>
                                <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
                                    <Translate>PRIMARY INSURANCE PROVIDER</Translate>
                                </HeaderCell>
                                <Cell dataKey="" />
                            </Column>
                            <Column sortable flexGrow={2}>
                                <HeaderCell style={{ backgroundColor: "#f4f7fe", color: "#333" }}>
                                    <Translate>PLAN</Translate>
                                </HeaderCell>
                                <Cell dataKey="" />
                            </Column>
                        </Table>
                        <div className="first-row" style={{ padding:40 }}>
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
                    
                </div>
            </Panel>
        
    );
};

export default FacilityPatientList;
