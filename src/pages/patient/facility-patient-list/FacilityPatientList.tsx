
import React, { useEffect, useState } from 'react';
import { Panel } from 'rsuite';
import {
    FlexboxGrid,
    IconButton,
    Input,
    Table,
    Grid,
    Row,
    Col,
    ButtonToolbar,
    Text,
    InputGroup,
    SelectPicker,
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
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { faFileExport } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest, calculateAge, formatDate, fromCamelCaseToDBName } from '@/utils';
import { useGetEncountersQuery, useStartEncounterMutation } from '@/services/encounterService';
import { newApEncounter, newApPatient, newApPatientInsurance } from '@/types/model-types-constructor';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import IdMappingIcon from '@rsuite/icons/IdMapping';
const FacilityPatientList = () => {

    const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const { data: documentTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
    const { data: primaryInsuranceProviderLovQueryResponse } = useGetLovValuesByCodeQuery('INS_PROVIDER');
    const [searchPatient, setSearchPatient] = useState<ApPatient>({
        ...newApPatient,
        // Ensures dob is an empty string
    });
    const [insurancePatient, setInsurancePatient] = useState<ApPatientInsurance>({ ...newApPatientInsurance });
    const [dateRange, setDateRange] = useState([null, null]);
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: true,
        filters: [

            {
                fieldName: 'gender_lkey',
                operator: 'match',
                value: searchPatient.genderLkey
            },
            {
                fieldName: 'document_type_lkey',
                operator: 'match',
                value: searchPatient.documentTypeLkey
            },
            {
                fieldName: 'insurance_provider_lkey',
                operator: 'match',
                value: insurancePatient.insuranceProviderLkey
            },

        ]

    });

    const [dateFilter, setDateFilter] = useState({
        fromDate: new Date(), //new Date(),
        toDate: new Date(),
    });

    const handleDateChange = (value) => {
        const [startDate, endDate] = value;
        setDateFilter((prev) => ({
            ...prev,
            fromDate: startDate,
            toDate: endDate,
        }));

        handleManualSearch();
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
            setListRequest({ ...listRequest });
        }
    };
    const handleDOFSearch = (value) => {
        console.log(value);
        const dob = formatDate(value);
        console.log(value);
        setListRequest(
            addFilterToListRequest(
                'dob',
                'match',
                dob,
                listRequest
            )
        );

    };
    console.log(listRequest);
    useEffect(() => {
        // init list
        handleManualSearch();
    }, []);

    useEffect(() => {
        setListRequest(prevState => ({
            ...prevState,
            filters: [
                ...prevState.filters,
            ]
        }));
    }, [searchPatient.genderLkey, searchPatient.documentTypeLkey, insurancePatient.insuranceProviderLkey]);
    const { data: encounterListResponse } = useGetEncountersQuery(listRequest);

    const isSelected = rowData => {
        if (rowData && encounter && rowData.key === encounter.key) {
            return 'selected-row';
        } else return '';
    };
    const [encounter, setLocalEncounter] = useState({ ...newApEncounter });
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
    return (
        <>
            <Panel>
                <h4>Facility Patients List</h4>
                <div>
                    <div className='resDivPart'>
                        <fieldset
                            style={{
                                padding: '5px',
                                margin: '5px',
                                border: '1px solid #ccc',
                                borderRadius: '5px'
                            }}
                        >
                            <legend
                                style={{
                                    padding: '0 5px',
                                    fontWeight: 'bold',
                                    backgroundColor: '#f9f9f9'
                                }}
                            >
                                <h5>Search</h5>
                            </legend>
                            <Form layout="inline" fluid >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                    <Stack spacing={5} direction="column" alignItems="flex-start">
                                        <MyLabel label="Registration Date " />
                                        <DateRangePicker
                                            format="MM/dd/yyyy"
                                            character=" – "
                                            onChange={handleDateChange}
                                        />
                                    </Stack>

                                    <Stack spacing={10} direction="column" alignItems="flex-start">
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
                                <br />
                                <ButtonToolbar>
                                    <IconButton appearance="primary" color="violet" icon={<SearchPeopleIcon />}>
                                        Search
                                    </IconButton>
                                    <IconButton
                                        appearance="primary"
                                        color="blue"
                                        icon={<IdMappingIcon />}
                                    >
                                        Clear
                                    </IconButton>

                                    <IconButton
                                        icon={<FileDownloadIcon />}
                                        appearance="primary"
                                        color="cyan"

                                    >
                                        Export to Xsl
                                    </IconButton>

                                </ButtonToolbar>
                            </Form>
                        </fieldset>
                    </div>

                    <div className='resDivPart'>
                        <fieldset
                            style={{
                                padding: '5px',
                                margin: '5px',
                                border: '1px solid #ccc',
                                borderRadius: '5px'
                            }}
                        >
                            <legend
                                style={{
                                    padding: '0 5px',
                                    fontWeight: 'bold',
                                    backgroundColor: '#f9f9f9'
                                }}
                            >
                                <h5>Patients List</h5>
                            </legend>
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
                                rowHeight={60}
                                bordered
                                cellBordered
                                data={encounterListResponse?.object ?? []}
                                onRowClick={rowData => {
                                    setLocalEncounter(rowData);
                                }}
                                rowClassName={isSelected}
                            >
                                <Column sortable flexGrow={2}>
                                    <HeaderCell>
                                        <Input />
                                        <Translate># </Translate>
                                    </HeaderCell>
                                    <Cell>  {(rowData, rowIndex) => rowIndex + 1}</Cell>
                                </Column>

                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input onChange={e => handleFilterChange('patientFullName', e)} />
                                        <Translate>Registration Date</Translate>
                                    </HeaderCell>
                                    <Cell dataKey="patientFullName" />
                                </Column>
                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input
                                            onChange={(e) => handleFilterChange('patientKey', e)}
                                        />
                                        <Translate>MRN</Translate>
                                    </HeaderCell>
                                    <Cell>

                                    </Cell>
                                </Column>


                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input onChange={e => handleFilterChange('patientAge', e)} />
                                        <Translate>Full Name </Translate>
                                    </HeaderCell>
                                    <Cell dataKey="patientAge" />
                                </Column>

                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input onChange={e => handleFilterChange('type', e)} />
                                        <Translate> Sex at Birth</Translate>
                                    </HeaderCell>
                                    <Cell dataKey="type" />
                                </Column>
                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input />
                                        <Translate>DOB </Translate>
                                    </HeaderCell>
                                    <Cell
                                    />
                                </Column>
                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input />
                                        <Translate> Document Type</Translate>
                                    </HeaderCell>
                                    <Cell
                                    />
                                </Column>
                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input />
                                        <Translate>Document Number</Translate>
                                    </HeaderCell>
                                    <Cell
                                    />
                                </Column>
                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input onChange={e => handleFilterChange('departmentKey', e)} />
                                        <Translate>Primary Phone Number</Translate>
                                    </HeaderCell>
                                    <Cell dataKey="departmentKey" />
                                </Column>
                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input onChange={e => handleFilterChange('encounterPriorityLkey', e)} />
                                        <Translate>Primary Insurance Provider</Translate>
                                    </HeaderCell>
                                    <Cell>
                                        {rowData =>
                                            rowData.encounterPriorityLvalue
                                                ? rowData.encounterPriorityLvalue.lovDisplayVale
                                                : rowData.encounterPriorityLkey
                                        }
                                    </Cell>
                                </Column>
                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input onChange={e => handleFilterChange('encounterPriorityLkey', e)} />
                                        <Translate>Plan</Translate>
                                    </HeaderCell>
                                    <Cell dataKey="plannedStartDate" />
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
                                    total={encounterListResponse?.extraNumeric ?? 0}
                                />
                            </div>
                        </fieldset>
                    </div>
                </div>
            </Panel>
        </>
    );
};

export default FacilityPatientList;
