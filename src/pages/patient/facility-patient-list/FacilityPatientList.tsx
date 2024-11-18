import React, { useEffect, useState } from 'react';
import { Panel } from 'rsuite';
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
import IdMappingIcon from '@rsuite/icons/IdMapping';
const FacilityPatientList = () => {

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
        <>
            <Panel>
                <h4>Facility Patients List</h4>
                <div>
                    <div className='resDivPart'>
                        <fieldset className='fieldSetStyle'>
                            <legend className='legendStyle'>
                                <h5>Search</h5>
                            </legend>
                            <Form layout="inline" fluid >
                                <div className='divContainFiledSearch'>
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
                        <fieldset className='fieldSetStyle'
                        >
                            <legend className='legendStyle'
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
                                data={patientListResponse?.object ?? []}
                                onRowClick={rowData => {
                                    setLocalPatient(rowData);
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
                                        <Input onChange={e => handleFilterChange('created_at', e)} />
                                        <Translate>Registration Date</Translate>
                                    </HeaderCell>
                                    <Cell dataKey="created_at" />
                                </Column>
                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input
                                            onChange={(e) => handleFilterChange('patientMrn', e)}
                                        />
                                        <Translate>MRN</Translate>
                                    </HeaderCell>
                                    <Cell dataKey="patientMrn" />
                                </Column>


                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input onChange={e => handleFilterChange('fullName', e)} />
                                        <Translate>Full Name </Translate>
                                    </HeaderCell>
                                    <Cell dataKey="fullName" />
                                </Column>

                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input onChange={e => handleFilterChange('genderLkey', e)} />
                                        <Translate> Sex at Birth</Translate>
                                    </HeaderCell>
                                    <Cell>
                                        {rowData =>
                                            rowData.encounterStatusLvalue
                                                ? rowData.genderLvalue.lovDisplayVale
                                                : rowData.genderLkey
                                        }
                                    </Cell>
                                </Column>
                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input onChange={e => handleFilterChange('dob', e)} />
                                        <Translate >DOB </Translate>
                                    </HeaderCell>
                                    <Cell dataKey="dob" />
                                </Column>
                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input onChange={e => handleFilterChange('documentTypeLkey', e)} />
                                        <Translate> Document Type</Translate>
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
                                    <HeaderCell>
                                        <Input onChange={e => handleFilterChange('documentNo', e)} />
                                        <Translate>Document Number</Translate>
                                    </HeaderCell>
                                    <Cell dataKey="documentNo" />
                                </Column>
                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input />
                                        <Translate>Primary Phone Number</Translate>
                                    </HeaderCell>
                                    <Cell dataKey="" />
                                </Column>
                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input />
                                        <Translate>Primary Insurance Provider</Translate>
                                    </HeaderCell>
                                    <Cell dataKey="" />
                                </Column>
                                <Column sortable flexGrow={4}>
                                    <HeaderCell>
                                        <Input onChange={e => handleFilterChange('', e)} />
                                        <Translate>Plan</Translate>
                                    </HeaderCell>
                                    <Cell dataKey="" />
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
                        </fieldset>
                    </div>
                </div>
            </Panel>
        </>
    );
};

export default FacilityPatientList;
