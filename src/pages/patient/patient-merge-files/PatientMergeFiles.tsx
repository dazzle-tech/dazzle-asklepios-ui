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
    SelectPicker,
    DatePicker,
  } from 'rsuite';
  import Translate from '@/components/Translate';
  const { Column, HeaderCell, Cell } = Table;
  import { Block, Check, DocPass, Edit, History, Icon, PlusRound, Detail } from '@rsuite/icons';
  import {
    useFetchAttachmentQuery,
    useFetchAttachmentLightQuery,
    useFetchAttachmentByKeyQuery,
    useUploadMutation,
    useDeleteAttachmentMutation,
    useUpdateAttachmentDetailsMutation,
  } from '@/services/attachmentService';
  import {
    useSaveEmployeeMutation,
    useGetEmployeesQuery,
    useGetEmployeeDocumentsQuery,
    useSaveDocumentMutation,
    useDeleteDocumentMutation
  } from '@/services/employeeService';
  import {
    newApPatientInsurance,
    newApPatientRelation,
    newApEmployee,
    newApEmployeeExtraDetails
  } from '@/types/model-types-constructor';
  import * as icons from '@rsuite/icons';
  import ReloadIcon from '@rsuite/icons/Reload';
  import SearchIcon from '@rsuite/icons/Search';
  import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
  import { initialListRequest, ListRequest } from '@/types/types';
  import {
    useGetLovValuesByCodeQuery
  } from '@/services/setupService';
  import { ApAttachment, ApEmployee, ApEmployeeExtraDetails, ApPatient, ApPatientRelation, ApPatientSecondaryDocuments } from '@/types/model-types';
const PatientMergeFiles = () => {
    const [firstEmployee, setFirstEmployee] = useState<ApEmployee>({ ...newApEmployee });
    const [secondEmployee, setSecondEmployee] = useState<ApEmployee>({ ...newApEmployee });
    const [firstEmployeeImage, setFirstEmployeeImage] = useState<ApAttachment>(undefined);
    const [secondEmployeeImage, setSecondEmployeeImage] = useState<ApAttachment>(undefined);
    const [upload, uploadMutation] = useUploadMutation();
    const profileImageFileInputRef = useRef(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [secSearchKeyword, setSecSearchKeyword] = useState('');
    const [selectedCriterion, setSelectedCriterion] = useState('');
    const [selectedSecCriterion, setSelectedSecCriterion] = useState('');
    const [searchResultVisible, setSearchResultVisible] = useState(false);
    const [searchSecResultVisible, setSearchSecResultVisible] = useState(false);
    const [employeeSearchTarget, setEmployeeSearchTarget] = useState('primary');
    const [employeeSecSearchTarget, setEmployeeSecSearchTarget] = useState('primary');
    const [unDoModalOpen, setUnDoModalOpen] = useState(false);
    const [employeeAttachments, setEmployeeAttachments] = useState([]);
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: !searchKeyword || searchKeyword.length < 3
      });
    const searchCriteriaOptions = [
        { label: 'Person ID', value: 'personId' },
        { label: 'Document Number', value: 'documentNo' },
        { label: 'Full Name', value: 'fullName' },
        { label: 'Seafarer’s Registration No.', value: '' },
        { label: 'Primary Phone Number', value: 'mobileNumber' },
        { label: 'Date of Birth', value: 'dob' },

      ];
      const {
        data: employeeListResponse,
        isLoading: isGettingEmployees,
        isFetching: isFetchingEmployees,
        refetch: refetchEmployees
      } = useGetEmployeesQuery({ ...listRequest, filterLogic: 'or' });
     //
    const { data: fetchAttachment, refetch: attachmentRefetch } = useFetchAttachmentLightQuery({ refKey: firstEmployee?.key }, { skip: !firstEmployee?.key });
    const { data: fetchSecAttachment, refetch: attachmentSecRefetch } = useFetchAttachmentLightQuery({ refKey: secondEmployee?.key }, { skip: !secondEmployee?.key });
    const { data: perfixLovQueryResponse } = useGetLovValuesByCodeQuery('PREFIX');
    const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const { data: civilStatusLovQueryResponse } = useGetLovValuesByCodeQuery('MARI_STATUS');
    const { data: nationalityLovQueryResponse } = useGetLovValuesByCodeQuery('NAT');
    const { data: religionLovQueryResponse } = useGetLovValuesByCodeQuery('REL');
    const fetchEmployeeImageResponse = useFetchAttachmentQuery(
        {
          type: 'EMPLOYEE_PROFILE_PICTURE',
          refKey: firstEmployee.key
        },
        { skip: !firstEmployee.key }
      );
      
      const handleFileChange = async event => {
        if (!firstEmployee.key) return;
    
        const selectedFile = event.target.files[0];
        if (selectedFile) {
          const formData = new FormData();
          formData.append('file', selectedFile);
           
            upload({
              formData: formData,
              type: 'EMPLOYEE_PROFILE_PICTURE',
              refKey:firstEmployee.key,
              details: `Profile Picture for ${firstEmployee.fullName}`
            })
              .unwrap()
              .then(() => attachmentRefetch());
          
        }
      };
      const fetchSecEmployeeImageResponse = useFetchAttachmentQuery(
        {
          type: 'EMPLOYEE_PROFILE_PICTURE',
          refKey: secondEmployee.key
        },
        { skip: !secondEmployee.key }
      );
      const handleSecFileChange = async event => {
        if (!secondEmployee.key) return;
    
        const selectedFile = event.target.files[0];
        if (selectedFile) {
          const formData = new FormData();
          formData.append('file', selectedFile);
           
            upload({
              formData: formData,
              type: 'EMPLOYEE_PROFILE_PICTURE',
              refKey:secondEmployee.key,
              details: `Profile Picture for ${secondEmployee.fullName}`
            })
              .unwrap()
              .then(() => attachmentRefetch());
          
        }
      };
      const handleSelectEmployee = data => {
        if (employeeSearchTarget === 'primary') {
          // selecteing primary patient (localEmployee)
          setFirstEmployee(data);
        // } else if (employeeSearchTarget === 'relation') {
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
        if (employeeSecSearchTarget === 'primary') {
          // selecteing primary patient (localEmployee)
          setSecondEmployee(data);
        // } else if (employeeSearchTarget === 'relation') {
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
        setEmployeeSearchTarget(target);
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
        setEmployeeSecSearchTarget(target);
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
      const {
        data: secEmployeeListResponse,
       
      } = useGetEmployeesQuery({ ...secListRequest, filterLogic: 'or' });
     const handleClear = () => {
        setFirstEmployee({
          ...newApEmployee,
          religionLkey: null,
          namePrefixLkey: null,
          genderLkey: null,
          civilStatusLkey: null,
          nationalityLkey: null,
          ethnicityLkey: null,
          occupationLkey: null,
          responsiblePartyLkey: null,
          educationalLevelLkey: null,
          preferredContactLkey: null,
          preferredLanguageLkey: null,
          emergencyContactRelationLkey: null,
          countryLkey: null,
          stateProvinceRegionLkey: null,
          cityLkey: null,
          districtLkey: null,
    
        });
        setSecondEmployee({
          ...newApEmployee,
          religionLkey: null,
          namePrefixLkey: null,
          genderLkey: null,
          civilStatusLkey: null,
          nationalityLkey: null,
          ethnicityLkey: null,
          occupationLkey: null,
          responsiblePartyLkey: null,
          educationalLevelLkey: null,
          preferredContactLkey: null,
          preferredLanguageLkey: null,
          emergencyContactRelationLkey: null,
          countryLkey: null,
          stateProvinceRegionLkey: null,
          cityLkey: null,
          districtLkey: null,
    
        });
        setSecondEmployeeImage(undefined);
        setFirstEmployeeImage(undefined);
        setSelectedCriterion('');
        setSecSearchKeyword('');
        setSearchKeyword('');
        setSearchSecResultVisible(false);
        setSearchResultVisible(false);
        setEmployeeAttachments([]);
       
      };
      ////////////////////
      useEffect(() => {
        if (fetchAttachment)
          if (fetchAttachment && firstEmployee.key) {
            setEmployeeAttachments(fetchAttachment);
          } else {
            useEffect(() => {
              if (
                fetchEmployeeImageResponse.isSuccess &&
                fetchEmployeeImageResponse.data &&
                fetchEmployeeImageResponse.data.key
              ) {
                setFirstEmployeeImage(fetchEmployeeImageResponse.data);
              } else {
                setFirstEmployeeImage(undefined);
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
          setFirstEmployeeImage(fetchEmployeeImageResponse.data);
        } else {
          setFirstEmployeeImage(undefined);
        }
      }, [fetchEmployeeImageResponse]);
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
const handleClearModel = () => {
    setUnDoModalOpen(false);

  };
      const conjureSecondEmployeeSearchBar = target => {
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
          if (fetchSecAttachment && secondEmployee.key) {
            setEmployeeAttachments(fetchSecAttachment);
          } else {
            useEffect(() => {
              if (
                fetchSecEmployeeImageResponse.isSuccess &&
                fetchSecEmployeeImageResponse.data &&
                fetchSecEmployeeImageResponse.data.key
              ) {
                setSecondEmployeeImage(fetchSecEmployeeImageResponse.data);
              } else {
                setSecondEmployeeImage(undefined);
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
          setSecondEmployeeImage(fetchSecEmployeeImageResponse.data);
        } else {
          setSecondEmployeeImage(undefined);
        }
      }, [fetchSecEmployeeImageResponse]);
    return (
        <>
 <Panel bordered>
          <ButtonToolbar>
            <h5>From Employee</h5>
            <Divider vertical />
            {conjureEmployeeSearchBar('primary')}
          
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
                    firstEmployeeImage && firstEmployeeImage.fileContent
                      ? `data:${firstEmployeeImage.contentType};base64,${firstEmployeeImage.fileContent}`
                      : 'https://img.icons8.com/?size=100&id=0lg0kb05hrOz&format=png&color=000000'
                  }
                />
              </div>
              <Form layout="inline" style={{ zoom: 0.80}}fluid>
                <MyInput
                  width={130}
                  
                  column
                  fieldLabel="Person ID"
                  fieldName="personId"
                  record={firstEmployee}
                  setRecord={setFirstEmployee}
                  disabled
                />

              </Form>
            </Stack.Item>
            <Stack.Item grow={15}>
              <Form style={{ zoom: 0.80}}layout="inline" fluid>
                <MyInput
                   width={165}
                  height={23}
                  
                  column
                  fieldLabel="Prefix"
                  fieldType="select"
                  fieldName="namePrefixLkey"
                  selectData={perfixLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={firstEmployee}
                  setRecord={setFirstEmployee}
                  disabled={true}
                />
                <MyInput
                  required
                  width={165}
                  height={23}
                  column
                  fieldName="firstName"
                  record={firstEmployee}
                  setRecord={setFirstEmployee}
                  disabled={true}
                />
                <MyInput
                  required
                  width={165}
                  height={23}
                  column
                  fieldName="secondName"
                  record={firstEmployee}
                  setRecord={setFirstEmployee}
                  disabled={true}
                />
                <MyInput
                  width={165}
                  height={23}
                  column
                  fieldName="thirdName"
                  record={firstEmployee}
                  setRecord={setFirstEmployee}
                  disabled={true}
                />
                <MyInput
                  required
                   width={165}
                  height={23}
                  
                  column
                  fieldName="lastName"
                  record={firstEmployee}
                  setRecord={setFirstEmployee}
                  disabled={true}
                />
                <MyInput
                  width={340}
                  
                  column
                  fieldName="fullName"
                  record={firstEmployee}
                  setRecord={setFirstEmployee}
                  disabled={true}
                  readOnly={true}
                />
                <br />
                <MyInput
                  required
                   width={165}
                  height={23}
                 
                  column
                  fieldLabel="Sex at Birth"
                  fieldType="select"
                  fieldName="genderLkey"
                  selectData={genderLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={firstEmployee}
                  setRecord={setFirstEmployee}
                  disabled={true}
                />
                <MyInput
                    width={165}
                  height={23}
                
                  fieldLabel="Alias"
                  
                  column
                  fieldName="employeeAlias"
                  record={firstEmployee}
                  setRecord={setFirstEmployee}
                  disabled={true}
                />
                <MyInput
                    width={165}
                  height={23}
                  
                  
                  column
                  fieldType="date"
                  fieldLabel="DOB"
                  fieldName="dob"
                  record={firstEmployee}
                  setRecord={setFirstEmployee}
                  disabled={true}
                />
                <MyInput
                   width={165}
                  height={23}
                  fieldLabel="Place of Birth"
                  style={{height:'20px'}}
                  column
                  fieldName="placeOfBirth"
                  record={firstEmployee}
                  setRecord={setFirstEmployee}
                  disabled={true}
                />
                <MyInput
                   width={165}
                  height={23}
                  style={{height:'20px'}}
                  column
                  fieldLabel="Civil Status"
                  fieldType="select"
                  fieldName="civilStatusLkey"
                  selectData={civilStatusLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={firstEmployee}
                  setRecord={setFirstEmployee}
                  disabled={true}
                />
                <MyInput
                   width={165}
                  height={23}
                  
                  column
                  fieldLabel="Nationality"
                  fieldType="select"
                  fieldName="nationalityLkey"
                  selectData={nationalityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={firstEmployee}
                  setRecord={setFirstEmployee}
                  disabled={true}
                />
                <MyInput
                   width={165}
                  height={23}
                  
                  column
                  fieldLabel="Religin"
                  fieldType="select"
                  fieldName="religionLkey"
                  selectData={religionLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={firstEmployee}
                  setRecord={setFirstEmployee}
                  disabled={true}
                />

                <MyInput
                  
                  column
                  fieldLabel="SF code"
                  fieldName="sfCode"
                  record={firstEmployee}
                  setRecord={setFirstEmployee}
                  disabled={true}
                />
                <MyInput
                  
                  column
                  fieldLabel="Seafarer’s Registration No."
                  fieldName="sfRegNo"
                  record={firstEmployee}
                  setRecord={setFirstEmployee}
                  disabled={true}
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
            <Drawer.Actions>{conjureEmployeeSearchBar(employeeSearchTarget)}</Drawer.Actions>
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
              data={employeeListResponse?.object ?? []}
            >
              <Column sortable flexGrow={3}>
                <HeaderCell>
                  <Input onChange={e => handleFilterChange('fullName', e)} />
                  <Translate>Employee Name</Translate>
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
                  <Input onChange={e => handleFilterChange('personId', e)} />
                  <Translate>Person ID</Translate>
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
                total={employeeListResponse?.extraNumeric ?? 0}
              />
            </div>
          </Drawer.Body>
        </Drawer>
       
  </Panel>
  
  <Panel bordered>
          <ButtonToolbar>
            <h5 style={{paddingRight:'40px'}}>Merge to</h5>
            <Divider vertical />
            {conjureSecondEmployeeSearchBar('primary')}
          
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
                    secondEmployeeImage && secondEmployeeImage.fileContent
                      ? `data:${secondEmployeeImage.contentType};base64,${secondEmployeeImage.fileContent}`
                      : 'https://img.icons8.com/?size=100&id=0lg0kb05hrOz&format=png&color=000000'
                  }
                />
              </div>
              <Form layout="inline" style={{ zoom: 0.80}} fluid>
                <MyInput
                  width={130}                 
                  column
                  fieldLabel="Person ID"
                  fieldName="personId"
                  record={secondEmployee}
                  setRecord={setSecondEmployee}
                  disabled
                />

              </Form>
            </Stack.Item>
            <Stack.Item grow={15}>
              <Form layout="inline" style={{ zoom: 0.80}} fluid>
                <MyInput
                   width={165}
                  height={23}
                  
                  column
                  fieldLabel="Prefix"
                  fieldType="select"
                  fieldName="namePrefixLkey"
                  selectData={perfixLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={secondEmployee}
                  setRecord={setSecondEmployee}
                  disabled={true}
                />
                <MyInput
                  required
                   width={165}
                  height={23}
                  
                  column
                  fieldName="firstName"
                  record={secondEmployee}
                  setRecord={setSecondEmployee}
                  disabled={true}
                />
                <MyInput
                  required
                   width={165}
                  height={23}
                  
                  column
                  fieldName="secondName"
                  record={secondEmployee}
                  setRecord={setSecondEmployee}
                  disabled={true}
                />
                <MyInput
                   width={165}
                  height={23}
                  
                  column
                  fieldName="thirdName"
                  record={secondEmployee}
                  setRecord={setSecondEmployee}
                  disabled={true}
                />
                <MyInput
                  required
                   width={165}
                  height={23}
                  
                  column
                  fieldName="lastName"
                  record={secondEmployee}
                  setRecord={setSecondEmployee}
                  disabled={true}
                />
                <MyInput
                  width={340}
                  
                  column
                  fieldName="fullName"
                  record={secondEmployee}
                  setRecord={setSecondEmployee}
                  disabled={true}
                  readOnly={true}
                />
                <br />
                <MyInput
                  required
                   width={165}
                  height={23}
                 
                  column
                  fieldLabel="Sex at Birth"
                  fieldType="select"
                  fieldName="genderLkey"
                  selectData={genderLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={secondEmployee}
                  setRecord={setSecondEmployee}
                  disabled={true}
                />
                <MyInput
                    width={165}
                  height={23}
                
                  fieldLabel="Alias"
                  
                  column
                  fieldName="employeeAlias"
                  record={secondEmployee}
                  setRecord={setSecondEmployee}
                  disabled={true}
                />
                <MyInput
                    width={165}
                  height={23}
                  
                  
                  column
                  fieldType="date"
                  fieldLabel="DOB"
                  fieldName="dob"
                  record={secondEmployee}
                  setRecord={setSecondEmployee}
                  disabled={true}
                />
                <MyInput
                   width={165}
                  height={23}
                  fieldLabel="Place of Birth"
                  style={{height:'20px'}}
                  column
                  fieldName="placeOfBirth"
                  record={secondEmployee}
                  setRecord={setSecondEmployee}
                  disabled={true}
                />
                <MyInput
                   width={165}
                  height={23}
                  style={{height:'20px'}}
                  column
                  fieldLabel="Civil Status"
                  fieldType="select"
                  fieldName="civilStatusLkey"
                  selectData={civilStatusLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={secondEmployee}
                  setRecord={setSecondEmployee}
                  disabled={true}
                />
                <MyInput
                   width={165}
                  height={23}
                  
                  column
                  fieldLabel="Nationality"
                  fieldType="select"
                  fieldName="nationalityLkey"
                  selectData={nationalityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={secondEmployee}
                  setRecord={setSecondEmployee}
                  disabled={true}
                />
                <MyInput
                   width={165}
                  height={23}
                  
                  column
                  fieldLabel="Religin"
                  fieldType="select"
                  fieldName="religionLkey"
                  selectData={religionLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={secondEmployee}
                  setRecord={setSecondEmployee}
                  disabled={true}
                />

                <MyInput
                  
                  column
                  fieldLabel="SF code"
                  fieldName="sfCode"
                  record={secondEmployee}
                  setRecord={setSecondEmployee}
                  disabled={true}
                />
                <MyInput
                  
                  column
                  fieldLabel="Seafarer’s Registration No."
                  fieldName="sfRegNo"
                  record={secondEmployee}
                  setRecord={setSecondEmployee}
                  disabled={true}
                />

              </Form>
            </Stack.Item>
          </Stack>
          <Drawer
          size="lg"
          placement={'left'}
          open={searchSecResultVisible}
          onClose={() => { setSearchSecResultVisible(false) }}
        >
          <Drawer.Header>
            <Drawer.Title>Employee List - Search Results</Drawer.Title>
            <Drawer.Actions>{conjureSecondEmployeeSearchBar(employeeSecSearchTarget)}</Drawer.Actions>
          </Drawer.Header>
          <Drawer.Body>
            <small>
              * <Translate>Click to select employee</Translate>
            </small>
            <Table
              height={600}
              sortColumn={secListRequest.sortBy}
              sortType={secListRequest.sortType}
              onSortColumn={(sortBy, sortType) => {
                if (sortBy)
                  setListRequest({
                    ...secListRequest,
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
                setSecSearchKeyword(null)
              }}
              data={secEmployeeListResponse?.object ?? []}
            >
              <Column sortable flexGrow={3}>
                <HeaderCell>
                  <Input onChange={e => handleFilterChange('fullName', e)} />
                  <Translate>Employee Name</Translate>
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
                  <Input onChange={e => handleFilterChange('personId', e)} />
                  <Translate>Person ID</Translate>
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
                limit={secListRequest.pageSize}
                activePage={secListRequest.pageNumber}
                onChangePage={pageNumber => {
                  setListRequest({ ...secListRequest, pageNumber });
                }}
                onChangeLimit={pageSize => {
                  setListRequest({ ...secListRequest, pageSize });
                }}
                total={secEmployeeListResponse?.extraNumeric ?? 0}
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
              onClick={()=>setUnDoModalOpen(true)}
              
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
                                <Translate className='headerFontSize'>Person Id From</Translate>
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
                                <Translate className='headerFontSize'>Person Id To</Translate>
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