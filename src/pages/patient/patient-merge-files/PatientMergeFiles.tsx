import React, { useEffect, useRef, useState } from 'react';
import MyInput from '@/components/MyInput';
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
    Badge,
    DatePicker
} from 'rsuite';
import Translate from '@/components/Translate';
const { Column, HeaderCell, Cell } = Table;
import { Block, Icon, PlusRound } from '@rsuite/icons';
import {
    useFetchAttachmentQuery,
    useFetchAttachmentLightQuery,
    useUploadMutation,
} from '@/services/attachmentService';
import {
    newApPatient,
} from '@/types/model-types-constructor';
import { VscUnverified } from 'react-icons/vsc';
import { VscVerified } from 'react-icons/vsc';
import * as icons from '@rsuite/icons';
import ReloadIcon from '@rsuite/icons/Reload';
import SearchIcon from '@rsuite/icons/Search';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { initialListRequest, ListRequest } from '@/types/types';
import {
    useGetLovValuesByCodeQuery
} from '@/services/setupService';
import {
    useGetPatientsQuery,
} from '@/services/patientService';
import { ApAttachment, ApPatient } from '@/types/model-types';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/hooks';
const PatientMergeFiles = () => {
    const [firstPatient, setFirstPatient] = useState<ApPatient>({ ...newApPatient });
    const [secondPatient, setSecondPatient] = useState<ApPatient>({ ...newApPatient });
    const [firstPatientImage, setFirstPatientImage] = useState<ApAttachment>(undefined);
    const [secondPatientImage, setSecondPatientImage] = useState<ApAttachment>(undefined);
    const [upload, uploadMutation] = useUploadMutation();
    const profileImageFileInputRef = useRef(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [secSearchKeyword, setSecSearchKeyword] = useState('');
    const [selectedCriterion, setSelectedCriterion] = useState('');
    const [selectedSecCriterion, setSelectedSecCriterion] = useState('');
    const [searchResultVisible, setSearchResultVisible] = useState(false);
    const [searchSecResultVisible, setSearchSecResultVisible] = useState(false);
    const [patientSearchTarget, setPatientSearchTarget] = useState('primary');
    const [patientSecSearchTarget, setPatientSecSearchTarget] = useState('primary');
    const [validationResult, setValidationResult] = useState({});
    const [unDoModalOpen, setUnDoModalOpen] = useState(false);
    const [employeeAttachments, setEmployeeAttachments] = useState([]);
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: !searchKeyword || searchKeyword.length < 3
    });
    const searchCriteriaOptions = [
        { label: 'MRN', value: 'patientMrn' },
        { label: 'Document Number', value: 'documentNo' },
        { label: 'Full Name', value: 'fullName' },
        { label: 'Archiving Number', value: 'archivingNumber' },
        { label: 'Primary Phone Number', value: 'phoneNumber' },
        { label: 'Date of Birth', value: 'dob' }
    ];
    const {
        data: patientListResponse,
    } = useGetPatientsQuery({ ...listRequest, filterLogic: 'or' });

    const {
        data: secPatientListResponse,
    } = useGetPatientsQuery({ ...listRequest, filterLogic: 'or' });
    //
    const { data: fetchAttachment, refetch: attachmentRefetch } = useFetchAttachmentLightQuery({ refKey: firstPatient?.key }, { skip: !firstPatient?.key });
    const { data: fetchSecAttachment, refetch: attachmentSecRefetch } = useFetchAttachmentLightQuery({ refKey: secondPatient?.key }, { skip: !secondPatient?.key });
    const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const { data: patientClassLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_CLASS');
    const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
    const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
    const dispatch = useAppDispatch();
    const divElement = useSelector((state: RootState) => state.div?.divElement);
    const divContent = (
      <div style={{ display: 'flex' }}>
        <h5>Files Merge</h5>
      </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('Files_Merge'));
    dispatch(setDivContent(divContentHTML));
  
    const fetchEmployeeImageResponse = useFetchAttachmentQuery(
        {
            type: 'PATIENT_PROFILE_PICTURE',
            refKey: firstPatient.key
        },
        { skip: !firstPatient.key }
    );
    const handleFileChange = async event => {
        if (!firstPatient.key) return;

        const selectedFile = event.target.files[0];
        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);

            upload({
                formData: formData,
                type: 'PATIENT_PROFILE_PICTURE',
                refKey: firstPatient.key,
                details: `Profile Picture for ${firstPatient.fullName}`
            })
                .unwrap()
                .then(() => attachmentRefetch());

        }
    };
    const fetchSecEmployeeImageResponse = useFetchAttachmentQuery(
        {
            type: 'PATIENT_PROFILE_PICTURE',
            refKey: secondPatient.key
        },
        { skip: !secondPatient.key }
    );
    const handleSecFileChange = async event => {
        if (!secondPatient.key) return;

        const selectedFile = event.target.files[0];
        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);

            upload({
                formData: formData,
                type: 'PATIENT_PROFILE_PICTURE',
                refKey: secondPatient.key,
                details: `Profile Picture for ${secondPatient.fullName}`
            })
                .unwrap()
                .then(() => attachmentRefetch());

        }
    };
    const handleSelectPatient = data => {
        if (patientSearchTarget === 'primary') {
            // selecteing primary patient (localEmployee)
            setFirstPatient(data);
            // } else if (patientSearchTarget === 'relation') {
            //   // selecting employee for relation employee key
            //   setSelectedPatientRelation({
            //     ...selectedPatientRelation,
            //     relativePatientKey: data.key,
            //     relativePatientObject: data
            //   });
        }
        setSearchResultVisible(false);
    };
    const [secListRequest, setSecListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: !secSearchKeyword || secSearchKeyword.length < 3
    });
    const handleSelectSecEmployee = data => {
        if (patientSecSearchTarget === 'primary') {
            // selecteing primary patient (localEmployee)
            setSecondPatient(data);
            // } else if (patientSearchTarget === 'relation') {
            //   // selecting employee for relation employee key
            //   setSelectedPatientRelation({
            //     ...selectedPatientRelation,
            //     relativePatientKey: data.key,
            //     relativePatientObject: data
            //   });
        }
        setSearchSecResultVisible(false);
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
                        value: searchKeyword,
                    },
                ]
            });
        }
    };
    const searchSec = target => {
        setPatientSecSearchTarget(target);
        setSearchSecResultVisible(true);

        if (secSearchKeyword && secSearchKeyword.length >= 3 && selectedSecCriterion) {
            setSecListRequest({
                ...secListRequest,
                ignore: false,
                filters: [
                    {
                        fieldName: fromCamelCaseToDBName(selectedSecCriterion),
                        operator: 'containsIgnoreCase',
                        value: secSearchKeyword,
                    },
                ]
            });
        }
    };

    const handleClear = () => {
        setFirstPatient({
            ...newApPatient,
            religionLkey: null,
            genderLkey: null,
            nationalityLkey: null,
            ethnicityLkey: null,
            occupationLkey: null,
            responsiblePartyLkey: null,
            educationalLevelLkey: null,
            preferredContactLkey: null,
            emergencyContactRelationLkey: null,
            countryLkey: null,
            stateProvinceRegionLkey: null,
            cityLkey: null,


        });
        setSecondPatient({
            ...newApPatient,
            religionLkey: null,
            genderLkey: null,
            nationalityLkey: null,
            ethnicityLkey: null,
            occupationLkey: null,
            responsiblePartyLkey: null,
            educationalLevelLkey: null,
            preferredContactLkey: null,
            emergencyContactRelationLkey: null,
            countryLkey: null,
            stateProvinceRegionLkey: null,
            cityLkey: null,

        });
        setSecondPatientImage(undefined);
        setFirstPatientImage(undefined);
        setSelectedCriterion('');
        setSecSearchKeyword('');
        setSearchKeyword('');
        setSearchSecResultVisible(false);
        setSearchResultVisible(false);
        setEmployeeAttachments([]);

    };
    ////////////////////
    useEffect(() => {
        return () => {
          dispatch(setPageCode(''));
          dispatch(setDivContent("  "));
        };
      }, [location.pathname, dispatch]);
    useEffect(() => {
        if (fetchAttachment)
            if (fetchAttachment && firstPatient.key) {
                setEmployeeAttachments(fetchAttachment);
            } else {
                useEffect(() => {
                    if (
                        fetchEmployeeImageResponse.isSuccess &&
                        fetchEmployeeImageResponse.data &&
                        fetchEmployeeImageResponse.data.key
                    ) {
                        setFirstPatientImage(fetchEmployeeImageResponse.data);
                    } else {
                        setFirstPatientImage(undefined);
                    }
                }, [fetchEmployeeImageResponse]);
                setEmployeeAttachments(undefined);
            }

        console.log({ 'employee attatchments': fetchAttachment });
    }, [fetchAttachment]);
    useEffect(() => {
        if (
            fetchEmployeeImageResponse.isSuccess &&
            fetchEmployeeImageResponse.data &&
            fetchEmployeeImageResponse.data.key
        ) {
            setFirstPatientImage(fetchEmployeeImageResponse.data);
        } else {
            setFirstPatientImage(undefined);
        }
    }, [fetchEmployeeImageResponse]);
    const conjurePatientSearchBar = target => {
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
    const handleClearModel = () => {
        setUnDoModalOpen(false);
    };
    const conjureSecondPatientSearchBar = target => {
        return (
            <Panel>

                <ButtonToolbar>

                    <SelectPicker label="Search Criteria" data={searchCriteriaOptions} onChange={(e) => { setSelectedSecCriterion(e) }} style={{ width: 250 }} />

                    <InputGroup inside style={{ width: '350px', direction: 'ltr' }}>
                        <Input
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    searchSec(target);
                                }
                            }}
                            placeholder={'Search Employees '}
                            value={secSearchKeyword}
                            onChange={e => setSecSearchKeyword(e)}
                        />
                        <InputGroup.Button onClick={() => searchSec(target)} >
                            <SearchIcon />
                        </InputGroup.Button>
                    </InputGroup>
                </ButtonToolbar>
            </Panel>

        );


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
    //////////////////////////
    useEffect(() => {
        if (fetchSecAttachment)
            if (fetchSecAttachment && secondPatient.key) {
                setEmployeeAttachments(fetchSecAttachment);
            } else {
                useEffect(() => {
                    if (
                        fetchSecEmployeeImageResponse.isSuccess &&
                        fetchSecEmployeeImageResponse.data &&
                        fetchSecEmployeeImageResponse.data.key
                    ) {
                        setSecondPatientImage(fetchSecEmployeeImageResponse.data);
                    } else {
                        setSecondPatientImage(undefined);
                    }
                }, [fetchSecEmployeeImageResponse]);
                setEmployeeAttachments(undefined);
            }

        console.log({ 'employee attatchments': fetchSecAttachment });
    }, [fetchSecAttachment]);
    useEffect(() => {
        if (
            fetchSecEmployeeImageResponse.isSuccess &&
            fetchSecEmployeeImageResponse.data &&
            fetchSecEmployeeImageResponse.data.key
        ) {
            setSecondPatientImage(fetchSecEmployeeImageResponse.data);
        } else {
            setSecondPatientImage(undefined);
        }
    }, [fetchSecEmployeeImageResponse]);
    return (
        <>
            <Panel bordered>
                <ButtonToolbar>
                    <h5>From Patient</h5>
                    <Divider vertical />
                    {conjurePatientSearchBar('primary')}

                </ButtonToolbar>
                <br />

                <Stack>
                    <Stack.Item grow={1}>
                        <div
                            style={{
                                borderRadius: '5px',
                                border: '1px solid #e1e1e1',
                                margin: '2px',
                                position: 'relative',
                                bottom: 0,
                                width: 130
                            }}
                        >
                            {firstPatient.key && (
                                <Whisper
                                    placement="top"
                                    controlId="control-id-click"
                                    trigger="hover"
                                    speaker={
                                        <Tooltip>
                                            {firstPatient.verified ? 'Verified Patient' : 'Unverified Patient'}
                                        </Tooltip>
                                    }
                                >
                                    <div
                                        style={{
                                            fontSize: 30,
                                            position: 'absolute',
                                            left: '2%',
                                            top: '-3%'
                                        }}
                                    >
                                        {!firstPatient.verified && (
                                            <Icon style={{ color: 'red' }} as={VscUnverified} />
                                        )}
                                        {firstPatient.verified && (
                                            <Icon style={{ color: 'green' }} as={VscVerified} />
                                        )}
                                    </div>
                                </Whisper>
                            )}

                            {firstPatient.key && (
                                <Whisper
                                    style={{ marginTop: '50px' }}
                                    placement="bottom"
                                    controlId="control-id-click"
                                    trigger="hover"
                                    speaker={
                                        <Tooltip>
                                            {firstPatient.incompletePatient ? 'incomplete Patient' : 'complete Patient'}
                                        </Tooltip>
                                    }
                                >
                                    <div
                                        style={{
                                            fontSize: 30,
                                            position: 'absolute',
                                            left: '2%',
                                            marginTop: '30px'
                                        }}
                                    >
                                        {firstPatient.incompletePatient && (
                                            <Icon style={{ color: 'red' }} as={VscUnverified} />
                                        )}
                                        {!firstPatient.incompletePatient && (
                                            <Icon style={{ color: 'green' }} as={VscVerified} />
                                        )}
                                    </div>
                                </Whisper>
                            )}

                            <input
                                type="file"
                                ref={profileImageFileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                            <img
                                width={130}
                                height={130}
                                src={
                                    firstPatientImage && firstPatientImage.fileContent
                                        ? `data:${firstPatientImage.contentType};base64,${firstPatientImage.fileContent}`
                                        : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
                                }
                            />
                        </div>
                        <Form layout="inline">
                            <MyInput
                                width={165}
                                vr={validationResult}
                                column
                                fieldLabel="MRN"
                                fieldName="patientMrn"
                                record={firstPatient}
                                disabled
                            />
                        </Form>
                    </Stack.Item>
                    <Stack.Item grow={15}>
                        <Form layout="inline">
                            <MyInput
                                required
                                width={165}
                                vr={validationResult}
                                column
                                fieldName="firstName"
                                record={firstPatient}
                                disabled
                            />
                            <MyInput
                                required
                                width={165}
                                vr={validationResult}
                                column
                                fieldName="secondName"
                                record={firstPatient}
                                disabled
                            />
                            <MyInput
                                width={165}
                                vr={validationResult}
                                column
                                fieldName="thirdName"
                                record={firstPatient}
                                disabled
                            />
                            <MyInput
                                required
                                width={165}
                                vr={validationResult}
                                column
                                fieldName="lastName"
                                record={firstPatient}
                                disabled
                            />
                            <MyInput
                                width={400}
                                vr={validationResult}
                                column
                                fieldName="fullName"
                                record={firstPatient}
                                setRecord
                                disabled={true}
                            />
                            <br />
                            <MyInput
                                required
                                width={165}
                                vr={validationResult}
                                column
                                fieldLabel="Sex at Birth"
                                fieldType="select"
                                fieldName="genderLkey"
                                selectData={genderLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={firstPatient}
                                disabled
                            />
                            <MyInput
                                width={165}
                                vr={validationResult}
                                column
                                fieldType="date"
                                fieldLabel="DOB"
                                fieldName="dob"
                                record={firstPatient}
                                disabled
                            />
                            <MyInput
                                width={165}
                                vr={validationResult}
                                column
                                fieldLabel="Patient Class"
                                fieldType="select"
                                fieldName="patientClassLkey"
                                selectData={patientClassLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={firstPatient}
                                disabled
                            />
                            <MyInput
                                width={165}
                                vr={validationResult}
                                column
                                fieldLabel="Private Patient"
                                fieldType="checkbox"
                                fieldName="privatePatient"
                                record={firstPatient}

                                disabled
                            />
                            {firstPatient?.incompletePatient ? (
                                <MyInput
                                    width={165}
                                    vr={validationResult}
                                    column
                                    fieldLabel="Unknown Patient"
                                    fieldType="checkbox"
                                    fieldName="unknownPatient"
                                    record={firstPatient}
                                    setRecord
                                    disabled
                                />
                            ) : null}

                            <br />

                            <MyInput
                                required
                                vr={validationResult}
                                column
                                fieldLabel="Document Type"
                                fieldType="select"
                                fieldName="documentTypeLkey"
                                selectData={docTypeLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={firstPatient}
                                disabled
                            />
                            <MyInput
                                required
                                vr={validationResult}
                                column
                                fieldLabel="Document Country"
                                fieldType="select"
                                fieldName="documentCountryLkey"
                                selectData={countryLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={firstPatient}
                                disabled
                            />
                            <MyInput
                                required
                                vr={validationResult}
                                column
                                fieldLabel="Document Number"
                                fieldName="documentNo"
                                record={firstPatient}
                                disabled
                            />


                        </Form>
                    </Stack.Item>
                </Stack>
                <Drawer
                    size="lg"
                    placement={'left'}
                    open={searchResultVisible}
                    onClose={() => { setSearchResultVisible(false) }}
                >
                    <Drawer.Header>
                        <Drawer.Title>Employee List - Search Results</Drawer.Title>
                        <Drawer.Actions>{conjurePatientSearchBar(patientSearchTarget)}</Drawer.Actions>
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
                                handleSelectPatient(rowData);
                                setSearchKeyword(null)
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
                            <Column sortable flexGrow={2}>
                                <HeaderCell>
                                    <Input onChange={e => handleFilterChange('genderLkey', e)} />
                                    <Translate>Sex of Birth</Translate>
                                </HeaderCell>
                                <Cell>
                                    {rowData =>
                                        rowData.genderLvalue
                                            ? rowData.genderLvalue.lovDisplayVale
                                            : rowData.genderLkey
                                    }
                                </Cell>
                            </Column>
                            <Column sortable flexGrow={2}>
                                <HeaderCell>
                                    <Input onChange={e => handleFilterChange('patientMrn', e)} />
                                    <Translate>Patient MRN</Translate>
                                </HeaderCell>
                                <Cell dataKey="personId" />
                            </Column>

                            <Column sortable flexGrow={3}>
                                <HeaderCell>
                                    <Input onChange={e => handleFilterChange('', e)} />
                                    <Translate>Seafarer’s Registration No.</Translate>
                                </HeaderCell>
                                <Cell dataKey="sfRegNo" />
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

            </Panel>
            <Panel bordered>
                <ButtonToolbar>
                    <h5 style={{ paddingRight: '40px' }}>Merge to</h5>
                    <Divider vertical />
                    {conjureSecondPatientSearchBar('primary')}

                </ButtonToolbar>
                <br />


                <Stack>
                    <Stack.Item grow={1}>
                        <div
                            style={{
                                borderRadius: '5px',
                                border: '1px solid #e1e1e1',
                                margin: '2px',
                                position: 'relative',
                                bottom: 0,
                                width: 130
                            }}
                        >
                            {secondPatient.key && (
                                <Whisper
                                    placement="top"
                                    controlId="control-id-click"
                                    trigger="hover"
                                    speaker={
                                        <Tooltip>
                                            {secondPatient.verified ? 'Verified Patient' : 'Unverified Patient'}
                                        </Tooltip>
                                    }
                                >
                                    <div
                                        style={{
                                            fontSize: 30,
                                            position: 'absolute',
                                            left: '2%',
                                            top: '-3%'
                                        }}
                                    >
                                        {!secondPatient.verified && (
                                            <Icon style={{ color: 'red' }} as={VscUnverified} />
                                        )}
                                        {secondPatient.verified && (
                                            <Icon style={{ color: 'green' }} as={VscVerified} />
                                        )}
                                    </div>
                                </Whisper>
                            )}

                            {secondPatient.key && (
                                <Whisper
                                    style={{ marginTop: '50px' }}
                                    placement="bottom"
                                    controlId="control-id-click"
                                    trigger="hover"
                                    speaker={
                                        <Tooltip>
                                            {secondPatient.incompletePatient ? 'incomplete Patient' : 'complete Patient'}
                                        </Tooltip>
                                    }
                                >
                                    <div
                                        style={{
                                            fontSize: 30,
                                            position: 'absolute',
                                            left: '2%',
                                            marginTop: '30px'
                                        }}
                                    >
                                        {secondPatient.incompletePatient && (
                                            <Icon style={{ color: 'red' }} as={VscUnverified} />
                                        )}
                                        {!secondPatient.incompletePatient && (
                                            <Icon style={{ color: 'green' }} as={VscVerified} />
                                        )}
                                    </div>
                                </Whisper>
                            )}

                            <input
                                type="file"
                                ref={profileImageFileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleSecFileChange}
                                accept="image/*"
                            />
                            <img
                                width={130}
                                height={130}
                                src={
                                    secondPatientImage && secondPatientImage.fileContent
                                        ? `data:${secondPatientImage.contentType};base64,${secondPatientImage.fileContent}`
                                        : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
                                }
                            />
                        </div>
                        <Form layout="inline" >
                            <MyInput
                                width={165}
                                vr={validationResult}
                                column
                                fieldLabel="MRN"
                                fieldName="patientMrn"
                                record={secondPatient}
                                disabled
                            />
                        </Form>
                    </Stack.Item>
                    <Stack.Item grow={15}>
                        <Form layout="inline">
                            <MyInput
                                required
                                width={165}
                                vr={validationResult}
                                column
                                fieldName="firstName"
                                record={secondPatient}
                                disabled
                            />
                            <MyInput
                                required
                                width={165}
                                vr={validationResult}
                                column
                                fieldName="secondName"
                                record={secondPatient}
                                disabled
                            />
                            <MyInput
                                width={165}
                                vr={validationResult}
                                column
                                fieldName="thirdName"
                                record={secondPatient}
                                disabled
                            />
                            <MyInput
                                required
                                width={165}
                                vr={validationResult}
                                column
                                fieldName="lastName"
                                record={secondPatient}
                                disabled
                            />
                            <MyInput
                                width={400}
                                vr={validationResult}
                                column
                                fieldName="fullName"
                                record={secondPatient}
                                setRecord
                                disabled={true}
                            />
                            <br />
                            <MyInput
                                required
                                width={165}
                                vr={validationResult}
                                column
                                fieldLabel="Sex at Birth"
                                fieldType="select"
                                fieldName="genderLkey"
                                selectData={genderLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={secondPatient}

                                disabled
                            />
                            <MyInput
                                width={165}
                                vr={validationResult}
                                column
                                fieldType="date"
                                fieldLabel="DOB"
                                fieldName="dob"
                                record={secondPatient}

                                disabled
                            />
                            <MyInput
                                width={165}
                                vr={validationResult}
                                column
                                fieldLabel="Patient Class"
                                fieldType="select"
                                fieldName="patientClassLkey"
                                selectData={patientClassLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={secondPatient}
                                disabled
                            />
                            <MyInput
                                width={165}
                                vr={validationResult}
                                column
                                fieldLabel="Private Patient"
                                fieldType="checkbox"
                                fieldName="privatePatient"
                                record={secondPatient}

                                disabled
                            />
                            {secondPatient?.incompletePatient ? (
                                <MyInput
                                    width={165}
                                    vr={validationResult}
                                    column
                                    fieldLabel="Unknown Patient"
                                    fieldType="checkbox"
                                    fieldName="unknownPatient"
                                    record={secondPatient}
                                    setRecord
                                    disabled
                                />
                            ) : null}

                            <br />

                            <MyInput
                                required
                                vr={validationResult}
                                column
                                fieldLabel="Document Type"
                                fieldType="select"
                                fieldName="documentTypeLkey"
                                selectData={docTypeLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={secondPatient}

                                disabled
                            />
                            <MyInput
                                required
                                vr={validationResult}
                                column
                                fieldLabel="Document Country"
                                fieldType="select"
                                fieldName="documentCountryLkey"
                                selectData={countryLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={secondPatient}

                                disabled
                            />
                            <MyInput
                                required
                                vr={validationResult}
                                column
                                fieldLabel="Document Number"
                                fieldName="documentNo"
                                record={secondPatient}

                                disabled
                            />
                        </Form>
                    </Stack.Item>
                </Stack>
                <Drawer
                    size="lg"
                    placement={'left'}
                    open={searchSecResultVisible}
                    onClose={() => {
                        setSearchSecResultVisible(false);
                    }}
                >
                    <Drawer.Header>
                        <Drawer.Title>Patient List - Search Results</Drawer.Title>
                        <Drawer.Actions>{conjureSecondPatientSearchBar(patientSearchTarget)}</Drawer.Actions>
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
                            rowHeight={60}
                            bordered
                            cellBordered
                            onRowClick={rowData => {
                                handleSelectSecEmployee(rowData);
                                setSearchKeyword(null);
                            }}
                            data={secPatientListResponse?.object ?? []}
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
                                    <Input onChange={e => handleFilterChange('phoneNumber', e)} />
                                    <Translate>Mobile Number</Translate>
                                </HeaderCell>
                                <Cell dataKey="phoneNumber" />
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
                                total={secPatientListResponse?.extraNumeric ?? 0}
                            />
                        </div>
                    </Drawer.Body>
                </Drawer>
            </Panel>
            <Panel>
                <ButtonToolbar>

                    <IconButton
                        color="violet"
                        appearance="primary"
                        icon={<PlusRound />}

                    //onClick={}
                    >
                        <Translate>Merge</Translate>
                    </IconButton>
                    <IconButton
                        appearance="ghost"
                        color="violet"
                        icon={<ReloadIcon />}
                        onClick={() => setUnDoModalOpen(true)}

                    >
                        <Translate>Undo Merge</Translate>
                    </IconButton>

                    <IconButton
                        appearance="primary"
                        color="blue"
                        icon={<Block />}
                        onClick={handleClear}
                    >
                        <Translate>Clear</Translate>
                    </IconButton>

                </ButtonToolbar>
                <Modal
                    open={unDoModalOpen}
                    onClose={() => handleClearModel()}
                    size="lg"

                >
                    <Modal.Header>
                        <Modal.Title>Undo Merge</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Panel>
                            <ButtonToolbar>
                                <DatePicker
                                    oneTap
                                    placeholder="From Date"

                                />
                                <DatePicker
                                    oneTap
                                    placeholder="To Date"

                                />
                                <IconButton appearance="primary" icon={<icons.Search />} >
                                    <Translate>Search</Translate>
                                </IconButton>
                                <div className='btnContainer'>



                                    <IconButton
                                        appearance="ghost"
                                        color="violet"
                                        icon={<ReloadIcon />}


                                    >
                                        <Translate>Undo Merge</Translate>
                                    </IconButton>
                                </div>


                            </ButtonToolbar>
                        </Panel>
                        <Table
                            height={200}
                            headerHeight={35}

                            bordered
                            cellBordered
                            data={[]}
                        >
                            <Table.Column flexGrow={4}>
                                <HeaderCell>
                                    <Translate className='headerFontSize'>Patient MRN From</Translate>
                                </HeaderCell>
                                <Table.Cell dataKey="" />
                            </Table.Column>

                            <Table.Column flexGrow={4}>
                                <HeaderCell>
                                    <Translate className='headerFontSize'>Name From</Translate>
                                </HeaderCell>
                                <Table.Cell dataKey="" />
                            </Table.Column>

                            <Table.Column flexGrow={4}>
                                <HeaderCell>
                                    <Translate className='headerFontSize'>Patient MRN To</Translate>
                                </HeaderCell>
                                <Table.Cell>

                                </Table.Cell>
                            </Table.Column>
                            <Table.Column flexGrow={4}>
                                <HeaderCell>
                                    <Translate className='headerFontSize'>Name To</Translate>
                                </HeaderCell>
                                <Table.Cell dataKey="" />
                            </Table.Column>

                            <Table.Column flexGrow={4}>
                                <HeaderCell>
                                    <Translate className='headerFontSize'>Merge Date</Translate>
                                </HeaderCell>
                                <Table.Cell>
                                </Table.Cell>
                            </Table.Column>
                        </Table>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={() => handleClearModel()} appearance="primary" color="blue">
                            Cancel
                        </Button>

                    </Modal.Footer>
                </Modal>
            </Panel>
        </>
    );
};

export default PatientMergeFiles;