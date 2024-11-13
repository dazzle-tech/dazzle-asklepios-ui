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
    Drawer,
    Table,
    Pagination,
    Button,
    Modal,
    Whisper,
    Tooltip,
    SelectPicker,
    Grid,
    Row,
    Col, 
    Text,
    DatePicker
} from 'rsuite';

import {
    useGetPatientRelationsQuery,
    useGetPatientsQuery,
    useSavePatientMutation,

} from '@/services/patientService';
import ChangeListIcon from '@rsuite/icons/ChangeList';
import { useNavigate } from 'react-router-dom';
import DetailIcon from '@rsuite/icons/Detail';
import TrashIcon from '@rsuite/icons/Trash';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import { FaClock, FaPencil, FaPlus, FaQuestion } from 'react-icons/fa6';
const { Column, HeaderCell, Cell } = Table;
import { notify } from '@/utils/uiReducerActions';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import PageIcon from '@rsuite/icons/Page';
import Translate from '@/components/Translate';
import { Block, Check, DocPass, Edit, History, Icon, PlusRound, Detail } from '@rsuite/icons';
import SearchIcon from '@rsuite/icons/Search';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { ApAttachment, ApPatient, ApPatientRelation, ApPatientSecondaryDocuments } from '@/types/model-types';
import { useAppDispatch, useAppSelector } from '@/hooks';
import ArowBackIcon from '@rsuite/icons/ArowBack';
import * as icons from '@rsuite/icons';
import MyInput from '@/components/MyInput';
import FileUploadIcon from '@rsuite/icons/FileUpload';
import { VscUnverified } from 'react-icons/vsc';

import { VscVerified } from 'react-icons/vsc';
import {
    useGetLovValuesByCodeAndParentQuery,
    useGetLovValuesByCodeQuery
} from '@/services/setupService';
import {
    useFetchAttachmentQuery,
    useFetchAttachmentLightQuery,
    useFetchAttachmentByKeyQuery,
    useUploadMutation,
    useDeleteAttachmentMutation,
    useUpdateAttachmentDetailsMutation,
} from '@/services/attachmentService';
import {
    newApPatient,
    newApPatientInsurance,
    newApPatientRelation,
} from '@/types/model-types-constructor';
import MyLabel from '@/components/MyLabel';
import EmployeeMainInfoScreen from '../employee-registration/EmployeeMainInfoScreen';


const VisitRegistration = () => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCriterion, setSelectedCriterion] = useState('');
    const [searchResultVisible, setSearchResultVisible] = useState(false);
    const [patientSearchTarget, setPatientSearchTarget] = useState('primary');
    const [validationResult, setValidationResult] = useState({});
    const [localEmployee, setLocalEmployee] = useState<ApPatient>({ ...newApPatient });//Replace To Employee
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    //Lov Declaration
    const { data: accountTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ACCOUNT_TYPE');
    const { data: vesselsLovQueryResponse } = useGetLovValuesByCodeQuery('VESSELS');
    const { data: chargTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PACKG_CHARG_TYP');
    const { data: positionCateLovQueryResponse } = useGetLovValuesByCodeQuery('EMPLOYEE_POSITION');
    const { data: clientTypeLovQueryResponse } = useGetLovValuesByCodeQuery('EMPLOYEE_CLIENT');
    const { data: departmentCategoryLovQueryResponse } = useGetLovValuesByCodeQuery('EMPLOYEE_DEP_CAT');
    const { data: employeeCrewTypeLovQueryResponse } = useGetLovValuesByCodeQuery('EMPLOYEE_CREW_TYPE')
    //Replace Object json to Employee
    const [selectedEmployeeRelation, setSelectedEmployeeRelation] = useState<any>({
        ...newApPatientRelation
    });

    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: !searchKeyword || searchKeyword.length < 3
    });


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
                        value: searchKeyword,
                    },
                ]
            });
        }
    };
    const handleSelectEmployee = data => {
        if (patientSearchTarget === 'primary') {
            // selecteing primary patient (localEmployee)
            setLocalEmployee(data);
            dispatch(setPatient(data));
        } else if (patientSearchTarget === 'relation') {
            // selecting patient for relation patient key
            selectedEmployeeRelation({
                ...selectedEmployeeRelation,
                relativePatientKey: data.key,
                relativePatientObject: data
            });
        }
        setSearchResultVisible(false);
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

    //Replace to Employee List 
    const {
        data: patientListResponse,
        isLoading: isGettingPatients,
        isFetching: isFetchingPatients,
        refetch: refetchPatients
    } = useGetPatientsQuery({ ...listRequest, filterLogic: 'or' });
    //Select Criteria
    const searchCriteriaOptions = [
        { label: 'MRN', value: 'patientMrn' },
        { label: 'Document Number', value: 'documentNo' },
        { label: 'Full Name', value: 'fullName' },
        { label: 'Archiving Number', value: 'archivingNumber' },
        { label: 'Primary Phone Number', value: 'mobileNumber' },
        { label: 'Date of Birth', value: 'dob' },
    ];

    //Search Employee
    const conjureEmployeeSearchBar = target => {
        return (
            <Panel>

                <ButtonToolbar>
                    <SelectPicker label="Search Criteria" data={searchCriteriaOptions} onChange={(e) => { setSelectedCriterion(e) }} style={{ width: 250 }} />

                    <InputGroup inside style={{ width: '350px', direction: 'ltr' }}>
                        <Input
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    search(target);
                                }
                            }}
                            placeholder={'Search Employees '}
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
    const handleGoBack = () => {
        navigate(-1);
    };
    return (
        <>
            <Panel
                header={
                    <h3 className="title">
                        <Translate>Visit Registration</Translate>
                    </h3>
                }
            >

                <Panel bordered>
                    <ButtonToolbar>
                        {conjureEmployeeSearchBar('primary')}
                        <Divider vertical />


                        <IconButton

                            appearance="primary"
                            color="violet"
                            icon={<ArowBackIcon />}
                            onClick={handleGoBack}
                        >
                            <Translate>Go Back</Translate>
                        </IconButton>
                        <IconButton
                            appearance="primary"
                            color="blue"
                            icon={<Block />}
                        //onClick={handleClear}
                        >
                            <Translate>Clear</Translate>
                        </IconButton>
                        <IconButton
                            appearance="primary"
                            color="violet"
                            icon={<Check />}
                        // onClick={handleSave}
                        // disabled={!editing}
                        >
                            <Translate>Save</Translate>
                        </IconButton>
                        <Divider vertical />

                        <IconButton
                            // disabled={!lov.key}
                            appearance="primary"
                            color="cyan"
                            //onClick={() => setCarouselActiveIndex(1)}
                            icon={<ChangeListIcon />}
                        >
                            Appointment
                        </IconButton>


                        <IconButton
                            // disabled={!lov.key}
                            appearance="primary"
                            color="cyan"
                            //onClick={() => setCarouselActiveIndex(1)}
                            icon={<ChangeListIcon />}
                        >
                            Visit Note
                        </IconButton>
                        <IconButton
                            appearance="ghost"
                            color="violet"
                            icon={<History />}
                        // disabled={editing || localEmployee.key === undefined}
                        // onClick={()=>handleGoToVisitRegistration()}
                        >
                            <Translate>Change</Translate>
                        </IconButton>
                    </ButtonToolbar>
                </Panel>
                <br />
                <Panel bordered header={
                    <h4 className="title">
                        <Translate>Employee Information</Translate>
                    </h4>
                }>
                    <EmployeeMainInfoScreen />
                </Panel>
                <br />
                <Panel bordered header={
                    <h4 className="title">
                        <Translate>Account Information Section</Translate>
                    </h4>
                }>
                    <Form layout="inline" fluid><MyInput
                        width={165}
                        vr={validationResult}
                        column
                        fieldLabel="Account Type"
                        fieldType="select"
                        fieldName="accountTypeLkey"
                        selectData={accountTypeLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={""}
                        setRecord={""}
                    />
                        {/*Change tp Principle*/}
                        <MyInput
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Principal"
                            fieldType="select"
                            fieldName="principalLkey"
                            selectData={[]}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={""}
                            setRecord={""}
                        />
                        <MyInput
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Vessels"
                            fieldType="select"
                            fieldName="vesselsLkey"
                            selectData={vesselsLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={""}
                            setRecord={""}
                        />
                        <MyInput
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Charge Type"
                            fieldType="select"
                            fieldName="chargeTypeLkey"
                            selectData={chargTypeLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={""}
                            setRecord={""}
                        /></Form>

                </Panel>
                <br />
                <Panel bordered header={
                    <h4 className="title">
                        <Translate>Visit Information</Translate>
                    </h4>
                }>
                    <Form layout="inline" fluid>
                        <MyInput
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Visit ID"
                            fieldName="visitID"
                            disabled
                            record={""}
                            setRecord={""}
                        />
                        {/*Change tp Principle*/}
                        <MyInput
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Position Category"
                            fieldType="select"
                            fieldName="positionCategoryLkey"
                            selectData={positionCateLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={""}
                            setRecord={""}
                        />
                        <MyInput
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Position Description"
                            fieldName="positionDescription"
                            record={""}
                            setRecord={""}
                        />
                        <MyInput
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Client Type"
                            fieldType="select"
                            fieldName="clientType"
                            selectData={clientTypeLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={""}
                            setRecord={""}
                        />
                        <MyInput
                            width={165}
                            vr={validationResult}
                            column
                            fieldType="date"
                            fieldLabel="Length of Contract"
                            fieldName="lengthofContract"
                            record={""}
                            setRecord={""}
                        />
                        <MyInput
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Department Category"
                            fieldType="select"
                            fieldName="departmentCategoryLkey"
                            selectData={departmentCategoryLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={""}
                            setRecord={""}
                        />
                        <br />
                        <MyInput
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Crew Type"
                            fieldType="select"
                            fieldName="crewTypeLkey"
                            selectData={employeeCrewTypeLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={""}
                            setRecord={""}
                        />
                        <MyInput
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Ship Type"
                            fieldName="shipType"
                            record={""}
                            setRecord={""}
                        />
                        <MyInput
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Flag State"
                            fieldName="flagState"
                            record={""}
                            setRecord={""}
                        />
                        <MyInput
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Internet No."
                            fieldName="internetNo"
                            record={""}
                            setRecord={""}
                        />
                        <MyInput
                            width={165}
                            vr={validationResult}
                            column
                            fieldType="date"
                            fieldLabel="Scheduled Date"
                            fieldName="scheduledDate"
                            record={""}
                            setRecord={""}
                        />


                        <IconButton
                            appearance="primary"
                            color="violet"
                            icon={<Check />}
                        // onClick={handleSave}
                        // disabled={!editing}
                        >
                            <Translate>Save</Translate>
                        </IconButton>




                    </Form>

                </Panel>
                <br />
                <Panel bordered header={
                    <h4 className="title">
                        <Translate>
                            Packages
                            <span style={{ fontSize: 12, color: 'blue', marginLeft: 15 ,fontStyle: 'italic' }}>
                                Save Visit Information to Add Package
                            </span>
                        </Translate></h4>
                }>

<Grid fluid>
          <Row gutter={15}>
          <Col xs={10}>
          
          <Form layout="inline" fluid>
            
                        {/*Change to Package List*/}
                        <MyInput
                            width={145}
                            vr={validationResult}
                            column
                            fieldLabel="Package "
                            fieldType="select"
                            fieldName="positionCategoryLkey"
                            selectData={positionCateLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={""}
                            setRecord={""}
                        />
                        <MyInput
                            width={145}
                            column
                            fieldLabel="Quantity"
                            fieldType="number"
                            fieldName="quantity"
                            record={""}
                            setRecord={""}
                        />
                      <MyInput
                            width={145}
                            vr={validationResult}
                            column
                            disabled
                            fieldLabel="Total Price"
                         
                            fieldName="totalPrice"
                          
                            record={""}
                            setRecord={""}
                        />
                        <br />
                  
                        <MyInput
                  vr={validationResult}
                  width={145}
                  column
                  fieldType="checkbox"
                  fieldName="receiveSms"
                  fieldLabel="Charge Patient"
                  record={""}
                  setRecord={""}
               
                />
                
                        {/*Change to Package Additional Item */}
                        <MyInput
                            width={145}
                            vr={validationResult}
                            column
                            fieldLabel="Additional Item "
                            fieldType="select"
                            fieldName="positionCategoryLkey"
                            selectData={positionCateLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={""}
                            setRecord={""}
                        />
                    </Form>
          
          
          
          
          
          
          </Col>
            
            <Col xs={13}>
            
            
            
            
            </Col>
        
             
          </Row>


        </Grid>




                </Panel>


            </Panel>


            <Drawer
                size="lg"
                placement={'left'}
                open={searchResultVisible}
                onClose={() => { setSearchResultVisible(false) }}
            >
                <Drawer.Header>
                    <Drawer.Title>Employee List - Search Results</Drawer.Title>
                    <Drawer.Actions>{conjureEmployeeSearchBar(patientSearchTarget)}</Drawer.Actions>
                </Drawer.Header>
                <Drawer.Body>
                    <small>
                        * <Translate>Click to select employee</Translate>
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
                        rowHeight={60}
                        bordered
                        cellBordered
                        onRowClick={rowData => {
                            handleSelectEmployee(rowData);
                            setSearchKeyword(null)
                        }}
                        data={patientListResponse?.object ?? []}
                    >
                        <Column sortable flexGrow={3}>
                            <HeaderCell>
                                <Input onChange={e => handleFilterChange('fullName', e)} />
                                <Translate>Employee Name</Translate>
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
                            <Cell dataKey="employeeMrn" />
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

        </>
    );
};

export default VisitRegistration;
