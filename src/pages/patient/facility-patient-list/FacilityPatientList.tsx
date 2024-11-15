
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
const { Column, HeaderCell, Cell } = Table;
import MyInput from '@/components/MyInput';
import SearchPeopleIcon from '@rsuite/icons/SearchPeople';
import MyLabel from '@/components/MyLabel';
import {
    ApPatient,
} from '@/types/model-types';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { faFileExport } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest, calculateAge, formatDate, fromCamelCaseToDBName } from '@/utils';
import { useGetEncountersQuery, useStartEncounterMutation } from '@/services/encounterService';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
const FacilityPatientList = () => {

    const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const { data: documentTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
    const { data: primaryInsuranceProviderLovQueryResponse } = useGetLovValuesByCodeQuery('INS_PROVIDER');
    const [searchPatient, setSearchPatient] = useState<ApPatient>({ ...newApPatient });
    const [dateRange, setDateRange] = useState([null, null]);

    const handleDateChange = (value) => {
        setDateRange(value);
        const [startDate, endDate] = value;
        console.log("Start Date:", startDate);
        console.log("End Date:", endDate);
    };

    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: true
    });
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

                                    <MyInput

                                        width={165}
                                        column
                                        fieldLabel="DOB"
                                        fieldType="date"
                                        fieldName="dob"
                                        record={searchPatient}
                                        setRecord={setSearchPatient}
                                    />
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
                                        fieldName="primaryInsuranceProviderLkey"
                                        selectData={primaryInsuranceProviderLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        record={""}
                                        setRecord={""}
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
                                        style={{ fontSize: "12px", justifyContent: "flex-start" }}
                                        icon={<FontAwesomeIcon icon={faBroom} style={{ marginRight: 'auto' }} />}
                                    >
                                        Clear
                                    </IconButton>

                                    <IconButton
                                        icon={<FontAwesomeIcon icon={faFileExport} style={{ marginRight: 'auto' }} />}
                                        appearance="primary"
                                        color="cyan"
                                        style={{ justifyContent: "flex-start" }}
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
                                        <Input onChange={e => handleFilterChange('queueNumber', e)} />
                                        <Translate># </Translate>
                                    </HeaderCell>
                                    <Cell dataKey="queueNumber" />
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
